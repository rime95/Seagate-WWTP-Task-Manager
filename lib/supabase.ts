import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The app runs entirely in the browser, so one browser client is all it needs: PKCE sign-in, the session kept in
// localStorage and refreshed automatically, and the ?code= from the Google redirect exchanged on page load.
// Without the env vars (see .env.example) sign-in is hidden and the app works on this device only.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null | undefined;

/** The shared browser client, or null when Supabase isn't configured (or on the server). */
export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (typeof window === "undefined") return null;
  client =
    URL && ANON_KEY
      ? createClient(URL, ANON_KEY, {
          auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        })
      : null;
  return client;
}
