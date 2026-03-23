// ═══════════════════════════════════════════════════════════════
//  src/config.js
//  Point d'entrée unique pour toutes les constantes du projet.
//  → Avec Vite : remplacer les strings par import.meta.env.VITE_*
// ═══════════════════════════════════════════════════════════════

// ── Supabase ──────────────────────────────────────────────────
export const SUPABASE_URL      = 'https://wzjsjmttovuhqsaosgzt.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_XB90iEJcRd2fGrjEkCgfoA_BnRV-Xnh';

// ── Noms des tables Supabase ──────────────────────────────────
export const TABLES = {
    ELEVE:             'eleve',
    PROFESSEUR:        'professeur',
    SESSION_ELEVE:     'SessionEleve',
    SESSION_PROFESSEUR:'SessionProfesseur',
};

// ── Configuration des axes du graphe ─────────────────────────
//  yTicks : valeurs affichées sur l'axe Y (haut → bas)
//  valMax : valeur max pour le calcul des coordonnées SVG
//  Règle  : y = 95 - (v / valMax * 90)
//           → v = valMax  donne y = 5  (haut)
//           → v = 0       donne y = 95 (bas)
export const AXES = {
    Subjectif: {
        valMax : 5,
        yTicks : [5, 4, 3, 2, 1, 0],
    },
    Objectif: {
        valMax : 220,
        yTicks : [220, 180, 140, 100, 60, 0],
    },
};

// ── Couleurs pour la vue "Tous les élèves" ────────────────────
export const COLORS_ALL = [
    'var(--accent)',  // bleu
    '#e67e22',        // orange
    '#27ae60',        // vert
    '#8e44ad',        // violet
    '#e74c3c',        // rouge
];

// ── Durée du lockout après trop de tentatives (ms) ───────────
export const LOGIN_LOCKOUT_MS      = 30_000; // 30 secondes
export const LOGIN_MAX_ATTEMPTS    = 5;
