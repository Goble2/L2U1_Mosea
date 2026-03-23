// ═══════════════════════════════════════════════════════════════
//  src/supabase.js
//  Client Supabase — instancié une seule fois, importé partout.
//  Dépend du CDN chargé dans le HTML :
//    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// ═══════════════════════════════════════════════════════════════

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const { createClient } = window.supabase; // exposé par le CDN

export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
