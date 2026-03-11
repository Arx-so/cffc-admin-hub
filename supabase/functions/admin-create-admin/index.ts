/* eslint-disable @typescript-eslint/triple-slash-reference -- Edge Functions: Deno types from deno.d.ts */
/// <reference path="../deno.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: string, status: number) {
	return new Response(body, {
		status,
		headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
	});
}

async function requireAdmin(req: Request): Promise<{ supabase: ReturnType<typeof createClient> } | Response> {
	const authHeader = req.headers.get("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return jsonResponse(JSON.stringify({ message: "Missing or invalid Authorization" }), 401);
	}
	const token = authHeader.slice(7);
	const url = Deno.env.get("SUPABASE_URL");
	const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
	if (!url || !serviceRole) {
		return jsonResponse(JSON.stringify({ message: "Server configuration error" }), 500);
	}
	const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });
	const { data: { user }, error: userError } = await supabase.auth.getUser(token);
	if (userError || !user) {
		return jsonResponse(JSON.stringify({ message: "Invalid or expired token" }), 403);
	}
	const { data: profile } = await supabase.from("profile").select("role").eq("id", user.id).single();
	if (profile?.role !== "admin") {
		return jsonResponse(JSON.stringify({ message: "Admin role required" }), 403);
	}
	return { supabase };
}

Deno.serve(async (req: Request) => {
	if (req.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: CORS_HEADERS });
	}
	if (req.method !== "POST") {
		return jsonResponse(JSON.stringify({ message: "Method not allowed" }), 405);
	}
	const admin = await requireAdmin(req);
	if (admin instanceof Response) return admin;
	const { supabase } = admin;
	let body: { email?: string };
	try {
		body = await req.json();
	} catch {
		return jsonResponse(JSON.stringify({ message: "Invalid JSON body" }), 400);
	}
	const email = body.email?.trim();
	if (!email) {
		return jsonResponse(JSON.stringify({ message: "email is required" }), 400);
	}
	const { data: newUser, error: createError } = await supabase.auth.admin.inviteUserByEmail(email);
	if (createError) {
		return jsonResponse(JSON.stringify({ message: createError.message }), 400);
	}
	if (!newUser.user) {
		return jsonResponse(JSON.stringify({ message: "User creation failed" }), 500);
	}
	const name = email.split("@")[0] || "";
	const { error: profileError } = await supabase.from("profile").upsert(
		{ id: newUser.user.id, email, name, role: "admin" },
		{ onConflict: "id" }
	);
	if (profileError) {
		return jsonResponse(JSON.stringify({ message: "Profile creation failed: " + profileError.message }), 500);
	}
	return jsonResponse(JSON.stringify({ success: true, userId: newUser.user.id }), 200);
});
