// ═══════════════════════════════════════════════════════════════
//  src/guard.js
//  Vérifie qu'un utilisateur est connecté et a le bon rôle
//  avant d'afficher une page protégée.
//
//  Usage — en toute première ligne de chaque page protégée :
//    const utilisateur = requireAuth('élève');       // page élève
//    const utilisateur = requireAuth('professeur');  // page prof
// ═══════════════════════════════════════════════════════════════

/**
 * Vérifie la session. Redirige vers /index.html si :
 *   - aucun utilisateur en session
 *   - le rôle ne correspond pas au rôle attendu
 *
 * @param {string} [roleAttendu]  'élève' | 'professeur' | undefined
 * @returns {object} L'utilisateur si valide.
 */
function requireAuth(roleAttendu) {
    const user = getUtilisateur();

    if (!user) {
        window.location.href = '/index.html';
        throw new Error('Non authentifié — redirection en cours.');
    }

    if (roleAttendu && user.role !== roleAttendu) {
        window.location.href = '/index.html';
        throw new Error(`Rôle incorrect (attendu : ${roleAttendu}, reçu : ${user.role})`);
    }

    return user;
}
