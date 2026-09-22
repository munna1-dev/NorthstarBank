/*
 * NorthstarBank - Supabase client
 *
 * IMPORTANT:
 * Only use the Supabase publishable/anon key here.
 * NEVER put the service_role/secret key in browser code.
 */

const SUPABASE_URL = window.NORTHSTAR_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.NORTHSTAR_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[NorthstarBank] Supabase is not configured yet. " +
    "Set NORTHSTAR_SUPABASE_URL and NORTHSTAR_SUPABASE_ANON_KEY."
  );
}

let northstarSupabase = null;

if (
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  window.supabase &&
  typeof window.supabase.createClient === "function"
) {
  northstarSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}

window.NorthstarSupabase = {
  client: northstarSupabase,
  url: SUPABASE_URL,
  configured: Boolean(northstarSupabase)
};
