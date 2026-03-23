// ═══════════════════════════════════════════════════════════════
//  src/auth.js
//  Toute la logique d'authentification en un seul endroit :
//    - connexion avec vérification Supabase
//    - déconnexion
//    - lecture de l'utilisateur courant
//    - rate limiting (anti brute-force côté client)
// ═══════════════════════════════════════════════════════════════

import { db }                                   from './supabase.js';
import { TABLES, LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_MS } from './config.js';

// ── Clés localStorage pour le rate limiting ───────────────────
const RL_ATTEMPTS = 'mosea_login_attempts';
const RL_LOCKOUT  = 'mosea_login_lockout';

// ═══════════════════════════════════════════════════════════════
//  CONNEXION
// ═══════════════════════════════════════════════════════════════

/**
 * Vérifie les identifiants dans Supabase.
 * @param {{ nom, prenom, mode, mdp, role }} donnees
 * @returns {{ utilisateur: object|null, erreur: string|null }}
 */
export async function connecter({ nom, prenom, mode, mdp, role }) {

    // 1. Rate limiting
    const lockoutMsg = verifierRateLimit();
    if (lockoutMsg) return { utilisateur: null, erreur: lockoutMsg };

    // 2. Requête Supabase
    const table = role === 'élève' ? TABLES.ELEVE : TABLES.PROFESSEUR;

    const { data, error } = await db
        .from(table)
        .select('*')
        .match({ nom, prenom, mode, mdp })
        .maybeSingle();

    if (error) {
        return { utilisateur: null, erreur: 'Erreur réseau. Réessayez.' };
    }

    if (!data) {
        enregistrerEchecConnexion();
        return { utilisateur: null, erreur: 'Identifiants incorrects.' };
    }

    // 3. Succès → réinitialiser le compteur et stocker la session
    reinitialiserRateLimit();
    const utilisateurAvecRole = { ...data, role };
    sessionStorage.setItem('user', JSON.stringify(utilisateurAvecRole));

    return { utilisateur: utilisateurAvecRole, erreur: null };
}

// ═══════════════════════════════════════════════════════════════
//  DÉCONNEXION
// ═══════════════════════════════════════════════════════════════

/**
 * Vide la session et redirige vers la page de connexion.
 */
export function deconnecter() {
    sessionStorage.clear();
    window.location.href = '/connexion.html';
}

// ═══════════════════════════════════════════════════════════════
//  LECTURE SESSION
// ═══════════════════════════════════════════════════════════════

/**
 * Retourne l'utilisateur stocké en session, ou null.
 * @returns {object|null}
 */
export function getUtilisateur() {
    try {
        return JSON.parse(sessionStorage.getItem('user'));
    } catch {
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
//  RATE LIMITING (côté client — protection UI)
// ═══════════════════════════════════════════════════════════════

function verifierRateLimit() {
    const lockout = parseInt(localStorage.getItem(RL_LOCKOUT) || '0', 10);
    if (Date.now() < lockout) {
        const restant = Math.ceil((lockout - Date.now()) / 1000);
        return `Trop de tentatives. Réessayez dans ${restant}s.`;
    }
    return null;
}

function enregistrerEchecConnexion() {
    const tentatives = parseInt(localStorage.getItem(RL_ATTEMPTS) || '0', 10) + 1;
    localStorage.setItem(RL_ATTEMPTS, tentatives);
    if (tentatives >= LOGIN_MAX_ATTEMPTS) {
        localStorage.setItem(RL_LOCKOUT, Date.now() + LOGIN_LOCKOUT_MS);
        localStorage.setItem(RL_ATTEMPTS, '0');
    }
}

function reinitialiserRateLimit() {
    localStorage.removeItem(RL_ATTEMPTS);
    localStorage.removeItem(RL_LOCKOUT);
}
