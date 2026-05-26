/* eslint-disable @typescript-eslint/triple-slash-reference -- Edge Functions: Deno types from deno.d.ts */
/// <reference path="../deno.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAdmin } from "../_shared/requireAdmin.ts";

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

Deno.serve(async (req: Request) => {
	if (req.method === "OPTIONS") {
		return new Response(null, { status: 204, headers: CORS_HEADERS });
	}
	if (req.method !== "POST") {
		return jsonResponse(JSON.stringify({ message: "Method not allowed" }), 405);
	}
	const admin = await requireAdmin(req);
	if (admin instanceof Response) {
		return new Response(admin.body, {
			status: admin.status,
			headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
		});
	}
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
