// ═══════════════════════════════════════════════════════════════
//  src/config.js
//  Configuration centrale de l'application web Mosea Analyse.
//  Tous les noms de tables et de colonnes sont alignés avec le
//  schéma Supabase réel (colonnes en minuscules sauf "Date"/"Heure"
//  dans la table SessionProfesseur).
// ═══════════════════════════════════════════════════════════════

// ── Supabase ──────────────────────────────────────────────────
const SUPABASE_URL      = 'https://wzjsjmttovuhqsaosgzt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XB90iEJcRd2fGrjEkCgfoA_BnRV-Xnh';

// ── Noms des tables ───────────────────────────────────────────
const TABLES = {
    ELEVE:              'eleve',
    PROFESSEUR:         'professeur',
    SESSION_ELEVE:      'SessionEleve',
    SESSION_PROFESSEUR: 'SessionProfesseur',
};

// ── Noms des colonnes (alignés avec le schéma Supabase) ───────
//  Centralisés ici pour éviter toute divergence dans les requêtes.
const COLS = {
    ELEVE: {
        ID:     'ideleve',
        NOM:    'nom',
        PRENOM: 'prenom',
        MODE:   'mode',
        MDP:    'mdp',
    },
    PROFESSEUR: {
        ID:     'idprofesseur',
        NOM:    'nom',
        PRENOM: 'prenom',
        MODE:   'mode',
        MDP:    'mdp',
    },
    SESSION_ELEVE: {
        ID:          'id',
        ID_ELEVE:    'idEleve',
        LINK:        'link',
        TYPE_MESURE: 'typemesure',
        DATA_MESURE: 'datamesure',
        DUREE:       'duree',
        HEUR:        'heur',
        DATE:        'date',
    },
    SESSION_PROFESSEUR: {
        ID:            'id',
        ID_PROFESSEUR: 'idprofesseur',
        LINK_SESSION:  'linksession',
        LISTE_ELEVE:   'listeeleve',
        DATE:          'Date',
        HEURE:         'Heure',
        SUJET:         'sujet',
    },
};

// ── Axes du graphe ────────────────────────────────────────────
const AXES = {
    Subjectif: { valMax: 5,   yTicks: [5, 4, 3, 2, 1, 0] },
    Objectif:  { valMax: 220, yTicks: [220, 180, 140, 100, 60, 0] },
};

// ── Couleurs vue « Tous les élèves » ──────────────────────────
const COLORS_ALL = [
    'var(--accent)',
    '#e67e22',
    '#27ae60',
    '#8e44ad',
    '#e74c3c',
];

// ── Rate limiting ─────────────────────────────────────────────
const LOGIN_LOCKOUT_MS   = 30000;
const LOGIN_MAX_ATTEMPTS = 5;
