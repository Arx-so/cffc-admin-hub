/**
 * Minimal Deno type declarations for Supabase Edge Functions.
 * The actual runtime is Deno; this only satisfies the IDE/TypeScript in the repo.
 */
declare namespace Deno {
	function serve(handler: (req: Request) => Response | Promise<Response>): void;

	namespace env {
		function get(key: string): string | undefined;
	}
}

/** Deno resolves URL imports at runtime; declare so TS does not error. */
declare module "https://esm.sh/@supabase/supabase-js@2" {
	export function createClient(
		url: string,
		key: string,
		options?: { auth?: { persistSession?: boolean } }
	): ReturnType<typeof createClient<Database>>;
}
