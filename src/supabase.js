// ═══════════════════════════════════════════════════════════════
//  src/supabase.js
//  Crée l'unique client Supabase utilisé par tout le reste du
//  projet. Ce fichier doit être chargé APRÈS le CDN supabase-js
//  et APRÈS config.js (qui fournit SUPABASE_URL et SUPABASE_ANON_KEY).
// ═══════════════════════════════════════════════════════════════

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
