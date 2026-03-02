import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function requireAdmin(req: Request): Promise<{ supabase: ReturnType<typeof createClient>; userId: string } | Response> {
	const authHeader = req.headers.get("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return new Response(JSON.stringify({ message: "Missing or invalid Authorization" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}
	const token = authHeader.slice(7);
	const url = Deno.env.get("SUPABASE_URL");
	const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
	if (!url || !serviceRole) {
		return new Response(JSON.stringify({ message: "Server configuration error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
	const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser(token);
	if (userError || !user) {
		return new Response(JSON.stringify({ message: "Invalid or expired token" }), {
			status: 403,
			headers: { "Content-Type": "application/json" },
		});
	}
	const { data: profile } = await supabase.from("profile").select("role").eq("id", user.id).single();
	if (profile?.role !== "admin") {
		return new Response(JSON.stringify({ message: "Admin role required" }), {
			status: 403,
			headers: { "Content-Type": "application/json" },
		});
	}
	return { supabase, userId: user.id };
}

export function jsonResponse(data: object, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}
