// ── Clés localStorage pour le rate limiting ───────────────────
const RL_ATTEMPTS = 'mosea_login_attempts';
const RL_LOCKOUT  = 'mosea_login_lockout';

// ── Connexion ─────────────────────────────────────────────────
async function connecter({ nom, prenom, mode, mdp, role }) {
    const lockoutMsg = verifierRateLimit();
    if (lockoutMsg) return { utilisateur: null, erreur: lockoutMsg };

    const table = role === 'élève' ? TABLES.ELEVE : TABLES.PROFESSEUR;

    const { data, error } = await db
        .from(table)
        .select('*')
        .match({ nom, prenom, mode, mdp })
        .maybeSingle();

    if (error) return { utilisateur: null, erreur: 'Erreur réseau. Réessayez.' };

    if (!data) {
        enregistrerEchecConnexion();
        return { utilisateur: null, erreur: 'Identifiants incorrects.' };
    }

    reinitialiserRateLimit();
    const utilisateurAvecRole = { ...data, role };
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

// ── Guard ─────────────────────────────────────────────────────
function requireAuth(role) {
    const user = getUtilisateur();
    if (!user || user.role !== role) {
        window.location.href = 'Connexion.html';
        throw new Error('Non authentifié');
    }
    return user;
}

// ── Rate limiting ─────────────────────────────────────────────
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
