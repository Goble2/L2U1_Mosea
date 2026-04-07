// ═══════════════════════════════════════════════════════════════
//  src/auth.js
//  Authentification, déconnexion, lecture de session et
//  rate limiting des tentatives de connexion.
// ═══════════════════════════════════════════════════════════════

// ── Clés localStorage pour le rate limiting ───────────────────
const RL_ATTEMPTS = 'mosea_login_attempts';
const RL_LOCKOUT  = 'mosea_login_lockout';

// ── Connexion ─────────────────────────────────────────────────
/**
 * Authentifie un utilisateur (élève ou professeur) auprès de
 * Supabase. Applique le rate limiting et stocke l'utilisateur
 * connecté dans sessionStorage sous la clé 'user'.
 *
 * @param {{nom:string, prenom:string, mode:string, mdp:string, role:'élève'|'professeur'}} params
 * @returns {Promise<{utilisateur:object|null, erreur:string|null}>}
 */
async function connecter({ nom, prenom, mode, mdp, role }) {
    const lockoutMsg = verifierRateLimit();
    if (lockoutMsg) return { utilisateur: null, erreur: lockoutMsg };

    const table = role === 'élève' ? TABLES.ELEVE : TABLES.PROFESSEUR;

    const { data, error } = await db
        .from(table)
        .select('*')
        .eq('nom',    nom)
        .eq('prenom', prenom)
        .eq('mode',   mode)
        .eq('mdp',    mdp)
        .maybeSingle();

    if (error) {
        console.error('Erreur Supabase connexion :', error);
        return { utilisateur: null, erreur: 'Erreur réseau. Réessayez.' };
    }

    if (!data) {
        enregistrerEchecConnexion();
        return { utilisateur: null, erreur: 'Identifiants incorrects.' };
    }

    reinitialiserRateLimit();

    // Normalisation : on ajoute un champ `role` et on expose les
    // identifiants sous deux formes (snake_case Supabase et
    // camelCase historique) afin que le reste du code reste lisible.
    const utilisateurAvecRole = {
        ...data,
        role,
        idEleve:      data.ideleve      ?? null,
        idProfesseur: data.idprofesseur ?? null,
    };

    sessionStorage.setItem('user', JSON.stringify(utilisateurAvecRole));
    return { utilisateur: utilisateurAvecRole, erreur: null };
}

// ── Déconnexion ───────────────────────────────────────────────
function deconnecter() {
    sessionStorage.clear();
    window.location.href = 'Connexion.html';
}

// ── Lecture session ───────────────────────────────────────────
function getUtilisateur() {
    try { return JSON.parse(sessionStorage.getItem('user')); }
    catch { return null; }
}

// ── Rate limiting ─────────────────────────────────────────────
/**
 * Retourne null si aucun verrou n'est actif, sinon un message
 * indiquant le temps restant avant la prochaine tentative.
 * @returns {string|null}
 */
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
