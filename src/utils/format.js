// ═══════════════════════════════════════════════════════════════
//  src/utils/format.js
//  Fonctions de formatage partagées entre toutes les pages.
// ═══════════════════════════════════════════════════════════════

/**
 * Formate une durée en secondes sous forme lisible.
 * @example formaterTemps(0)   → '0'
 * @example formaterTemps(45)  → '45s'
 * @example formaterTemps(60)  → '1m'
 * @example formaterTemps(90)  → '1m30s'
 */
export function formaterTemps(secondes) {
    if (secondes === 0) return '0';
    const m = Math.floor(secondes / 60);
    const s = secondes % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m${s}s`;
}

/**
 * Formate une date ISO (YYYY-MM-DD) en date lisible française.
 * @example formaterDate('2024-11-03') → '3 novembre 2024'
 */
export function formaterDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day:   'numeric',
        month: 'long',
        year:  'numeric',
    });
}

/**
 * Formate une heure HH:MM:SS en heure courte.
 * @example formaterHeure('14:32:00') → '14h32'
 */
export function formaterHeure(heureStr) {
    if (!heureStr) return '—';
    const [h, m] = heureStr.split(':');
    return `${h}h${m}`;
}

/**
 * Met la première lettre en majuscule, le reste en minuscule.
 * @example capitaliser('dupont') → 'Dupont'
 */
export function capitaliser(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Formate un nom complet en MAJUSCULES.
 * @example nomComplet('dupont', 'jean') → 'JEAN DUPONT'
 */
export function nomComplet(nom, prenom) {
    return `${prenom.toUpperCase()} ${nom.toUpperCase()}`;
}
