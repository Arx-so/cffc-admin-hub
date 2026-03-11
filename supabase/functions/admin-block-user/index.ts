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
	let body: { userId?: string };
	try {
		body = await req.json();
	} catch {
		return jsonResponse(JSON.stringify({ message: "Invalid JSON body" }), 400);
	}
	const userId = body.userId;
	if (!userId || typeof userId !== "string") {
		return jsonResponse(JSON.stringify({ message: "userId is required" }), 400);
	}
	const { error } = await supabase.auth.admin.updateUserById(userId, {
		ban_duration: "876000h",
	});
	if (error) {
		return jsonResponse(JSON.stringify({ message: error.message }), 400);
	}
	return jsonResponse(JSON.stringify({ success: true }), 200);
});
