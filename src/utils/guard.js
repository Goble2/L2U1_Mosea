// ═══════════════════════════════════════════════════════════════
//  src/utils/guard.js
//  Vérifie qu'un utilisateur est connecté et a le bon rôle
//  avant d'afficher une page protégée.
//
//  Usage — en toute première ligne de chaque page protégée :
//    import { requireAuth } from './utils/guard.js';
//    const utilisateur = requireAuth('élève');       // page élève
//    const utilisateur = requireAuth('professeur');  // page prof
// ═══════════════════════════════════════════════════════════════

import { getUtilisateur } from '../auth.js';

/**
 * Vérifie la session. Redirige vers /index.html si :
 *   - Aucun utilisateur en session
 *   - Le rôle ne correspond pas au rôle attendu
 *
 * @param {string} [roleAttendu]  'élève' | 'professeur' | undefined
 * @returns {object} L'utilisateur si valide (sinon la page a déjà redirigé)
 */
export function requireAuth(roleAttendu) {
    const user = getUtilisateur();

    if (!user) {
        window.location.href = '/index.html';
        // Lever une exception pour stopper l'exécution du script appelant
        throw new Error('Non authentifié — redirection en cours.');
    }

    if (roleAttendu && user.role !== roleAttendu) {
        window.location.href = '/index.html';
        throw new Error(`Rôle incorrect (attendu : ${roleAttendu}, reçu : ${user.role})`);
    }

    return user;
}
