// ═══════════════════════════════════════════════════════════════
//  src/config.js
//  Regroupe toutes les constantes du projet dans un seul fichier.
//  Objectif : ne pas avoir de valeurs "en dur" dispersées partout.
// ═══════════════════════════════════════════════════════════════


// ─── Supabase ─────────────────────────────────────────────────
// Adresse du serveur et clé publique (clé anonyme).
// La clé anon peut être dans le code source : c'est une clé publique
// qui ne donne accès qu'à ce qu'autorisent les Row Level Security (RLS)
// configurées côté Supabase.
const SUPABASE_URL      = 'https://wzjsjmttovuhqsaosgzt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XB90iEJcRd2fGrjEkCgfoA_BnRV-Xnh';


// ─── Noms des tables ──────────────────────────────────────────
// On centralise ici les noms de tables pour éviter les fautes
// de frappe dans tout le projet.
const TABLES = {
    ELEVE:              'eleve',
    PROFESSEUR:         'professeur',
    SESSION_ELEVE:      'SessionEleve',
    SESSION_PROFESSEUR: 'SessionProfesseur',
};


// ─── Noms EXACTS des colonnes Supabase ───────────────────────
// Important : Supabase est sensible à la casse. Certaines colonnes
// sont en minuscules, d'autres en camelCase, d'autres avec une
// majuscule initiale. On les centralise pour ne jamais se tromper.
//
// Exceptions à retenir :
//   - SessionEleve.idEleve    → camelCase
//   - SessionProfesseur.Date  → majuscule initiale
//   - SessionProfesseur.Heure → majuscule initiale
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
        idEleve:    'idEleve',      // camelCase (exception)
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
        date:         'Date',       // majuscule initiale (exception)
        heure:        'Heure',      // majuscule initiale (exception)
        sujet:        'sujet',
    },
};


// ─── Échelles des graphiques ──────────────────────────────────
// Subjectif  : échelle ISA de 0 à 5.
// Objectif   : mesure physiologique (ex : fréquence cardiaque) de 0 à 220.
const AXES = {
    Subjectif: { valMax: 5,   yTicks: [5, 4, 3, 2, 1, 0] },
    Objectif:  { valMax: 220, yTicks: [220, 180, 140, 100, 60, 0] },
};


// ─── Couleurs utilisées pour différencier les élèves ──────────
// Dans la vue "Tous les élèves" du professeur, chaque groupe
// de mesures reçoit une couleur différente dans cette liste.
const COLORS_ALL = [
    'var(--accent)',
    '#e67e22',
    '#27ae60',
    '#8e44ad',
    '#e74c3c',
];


// ─── Rate limiting (protection anti-brute-force) ──────────────
// Après 5 échecs de connexion, l'utilisateur est bloqué 30 secondes.
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS   = 30000;   // 30 secondes en millisecondes
