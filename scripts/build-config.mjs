import { writeFileSync } from "node:fs";

const url = process.env.NORTHSTAR_SUPABASE_URL;
const key = process.env.NORTHSTAR_SUPABASE_ANON_KEY;

if (!url || !key) throw new Error("Missing Supabase environment variables");

writeFileSync(
  "assets/js/config.js",
  `window.NORTHSTAR_SUPABASE_URL = ${JSON.stringify(url)};
window.NORTHSTAR_SUPABASE_ANON_KEY = ${JSON.stringify(key)};
`
);
