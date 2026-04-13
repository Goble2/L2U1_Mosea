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

// ── Noms EXACTS des colonnes (casing critique Supabase) ───────
// Règle : la plupart sont en minuscules, SAUF :
//   - SessionEleve.idEleve     (camelCase)
//   - SessionProfesseur.Date   (majuscule initiale)
//   - SessionProfesseur.Heure  (majuscule initiale)
const COLS = {
    ELEVE: {
        id:     'ideleve',
        nom:    'nom',
        prenom: 'prenom',
        mode:   'mode',
        mdp:    'mdp',
    },
    PROFESSEUR: {
        id:     'idprofesseur',
        nom:    'nom',
        prenom: 'prenom',
        mode:   'mode',
        mdp:    'mdp',
    },
    SESSION_ELEVE: {
        id:         'id',
        idEleve:    'idEleve',        // camelCase !
        link:       'link',
        typeMesure: 'typemesure',
        dataMesure: 'datamesure',
        duree:      'duree',
        heur:       'heur',
        date:       'date',
    },
    SESSION_PROFESSEUR: {
        id:           'id',
        idProfesseur: 'idprofesseur',
        linkSession:  'linksession',
        listeEleve:   'listeeleve',
        date:         'Date',         // majuscule !
        heure:        'Heure',        // majuscule !
        sujet:        'sujet',
    },
};

// ── Axes du graphe ────────────────────────────────────────────
const AXES = {
    Subjectif: { valMax: 5,   yTicks: [5, 4, 3, 2, 1, 0] },
    Objectif:  { valMax: 220, yTicks: [220, 180, 140, 100, 60, 0] },
};

// ── Couleurs vue "Tous les élèves" ────────────────────────────
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
