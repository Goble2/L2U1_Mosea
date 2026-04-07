// ═══════════════════════════════════════════════════════════════
//  src/supabase.js
//  Initialise le client Supabase à partir des constantes définies
//  dans src/config.js. Doit être chargé APRÈS le CDN supabase-js
//  et APRÈS src/config.js.
// ═══════════════════════════════════════════════════════════════

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
