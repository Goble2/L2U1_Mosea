// ═══════════════════════════════════════════════════════════════
//  src/auth.js
//  Gère la connexion, la déconnexion, la protection des pages
//  et le rate limiting (blocage après trop d'échecs).
// ═══════════════════════════════════════════════════════════════


// ─── Clés utilisées dans localStorage pour le rate limiting ──
// localStorage persiste entre les onglets et les sessions, ce qui
// évite qu'un attaquant contourne le blocage en rafraîchissant.
const RL_ATTEMPTS = 'mosea_login_attempts';
const RL_LOCKOUT  = 'mosea_login_lockout';


// ─── Connexion ────────────────────────────────────────────────
// Vérifie les identifiants dans la table appropriée (eleve ou
// professeur selon le rôle). En cas de succès, stocke l'utilisateur
// dans sessionStorage. En cas d'échec, incrémente le compteur.
async function connecter({ nom, prenom, mode, mdp, role }) {

    // 1) Vérifier qu'on n'est pas bloqué par le rate limiting
    const messageBlocage = verifierRateLimit();
    if (messageBlocage) {
        return { utilisateur: null, erreur: messageBlocage };
    }

    // 2) Choisir la table selon le rôle
    const table = role === 'élève' ? TABLES.ELEVE : TABLES.PROFESSEUR;
    const cols  = role === 'élève' ? COLS.ELEVE   : COLS.PROFESSEUR;

    // 3) Requête Supabase : cherche une ligne qui correspond à tous les champs
    const { data, error } = await db
        .from(table)
        .select('*')
        .eq(cols.nom,    nom)
        .eq(cols.prenom, prenom)
        .eq(cols.mode,   mode)
        .eq(cols.mdp,    mdp)
        .maybeSingle();

    // 4) Erreur réseau
    if (error) {
        return { utilisateur: null, erreur: 'Erreur réseau. Réessayez.' };
    }

    // 5) Aucun utilisateur trouvé → identifiants incorrects
    if (!data) {
        enregistrerEchecConnexion();
        return { utilisateur: null, erreur: 'Identifiants incorrects.' };
    }

    // 6) Succès : on réinitialise le compteur et on stocke l'utilisateur
    reinitialiserRateLimit();
    const utilisateur = { ...data, role: role };
    sessionStorage.setItem('user', JSON.stringify(utilisateur));
    return { utilisateur: utilisateur, erreur: null };
}


// ─── Déconnexion ──────────────────────────────────────────────
// Vide sessionStorage et redirige vers la page de connexion.
function deconnecter() {
    sessionStorage.clear();
    window.location.href = 'Connexion.html';
}


// ─── Lecture de l'utilisateur connecté ────────────────────────
// Retourne l'objet utilisateur stocké, ou null si personne
// n'est connecté ou si le JSON est corrompu.
function getUtilisateur() {
    try {
        return JSON.parse(sessionStorage.getItem('user'));
    } catch {
        return null;
    }
}


// ─── Guard : protège une page ─────────────────────────────────
// À appeler en première instruction dans eleve.js et professeur.js.
// Redirige vers Connexion.html si l'utilisateur n'est pas connecté
// ou si son rôle ne correspond pas au rôle attendu pour la page.
function requireAuth(roleAttendu) {
    const utilisateur = getUtilisateur();
    const estConnecte = utilisateur !== null && utilisateur !== undefined;
    const bonRole     = !roleAttendu || utilisateur?.role === roleAttendu;

    if (!estConnecte || !bonRole) {
        window.location.href = 'Connexion.html';
        throw new Error('Non authentifié');
    }
    return utilisateur;
}


// ═══════════════════════════════════════════════════════════════
//  Rate limiting  [Assisté par IA]
//  Bloque les tentatives de connexion pendant 30 secondes après
//  5 échecs consécutifs, pour éviter le brute-force.
// ═══════════════════════════════════════════════════════════════

// Vérifie si l'utilisateur est actuellement bloqué.
// Retourne un message d'erreur avec le temps restant, ou null.
function verifierRateLimit() {
    const finBlocage = parseInt(localStorage.getItem(RL_LOCKOUT) || '0', 10);

    if (Date.now() < finBlocage) {
        const secondesRestantes = Math.ceil((finBlocage - Date.now()) / 1000);
        return `Trop de tentatives. Réessayez dans ${secondesRestantes}s.`;
    }
    return null;
}

// Incrémente le compteur d'échecs. Si on atteint le maximum,
// on pose un verrou de 30s et on remet le compteur à 0.
function enregistrerEchecConnexion() {
    const echecsPrecedents = parseInt(localStorage.getItem(RL_ATTEMPTS) || '0', 10);
    const nouveauCompte    = echecsPrecedents + 1;

    localStorage.setItem(RL_ATTEMPTS, nouveauCompte);

    if (nouveauCompte >= LOGIN_MAX_ATTEMPTS) {
        const finBlocage = Date.now() + LOGIN_LOCKOUT_MS;
        localStorage.setItem(RL_LOCKOUT,  finBlocage);
        localStorage.setItem(RL_ATTEMPTS, '0');
    }
}

// Remet le compteur à zéro (appelé après une connexion réussie).
function reinitialiserRateLimit() {
    localStorage.removeItem(RL_ATTEMPTS);
    localStorage.removeItem(RL_LOCKOUT);
}
