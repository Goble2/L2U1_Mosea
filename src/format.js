// ═══════════════════════════════════════════════════════════════
//  src/utils/format.js
//  Fonctions de formatage des données avant affichage.
//  Partagées entre toutes les pages.
// ═══════════════════════════════════════════════════════════════


// ─── Formater une durée en secondes ───────────────────────────
// Exemples :
//   formaterTemps(0)   → '0'
//   formaterTemps(45)  → '45s'
//   formaterTemps(60)  → '1m'
//   formaterTemps(90)  → '1m30s'
function formaterTemps(secondes) {
    if (secondes === 0) return '0';

    const minutes          = Math.floor(secondes / 60);
    const secondesRestantes = secondes % 60;

    if (minutes === 0)          return `${secondesRestantes}s`;
    if (secondesRestantes === 0) return `${minutes}m`;
    return `${minutes}m${secondesRestantes}s`;
}


// ─── Formater une date ISO en français ────────────────────────
// Exemple : formaterDate('2024-11-03') → '3 novembre 2024'
function formaterDate(dateStr) {
    if (!dateStr) return '—';

    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day:   'numeric',
        month: 'long',
        year:  'numeric',
    });
}


// ─── Formater une heure HH:MM:SS en HhMM ──────────────────────
// Exemple : formaterHeure('14:32:00') → '14h32'
function formaterHeure(heureStr) {
    if (!heureStr) return '—';

    const parties = heureStr.split(':');
    const heures  = parties[0];
    const minutes = parties[1];
    return `${heures}h${minutes}`;
}


// ─── Mettre la première lettre en majuscule ───────────────────
// Exemple : capitaliser('dupont') → 'Dupont'
function capitaliser(texte) {
    if (!texte) return '';
    return texte.charAt(0).toUpperCase() + texte.slice(1).toLowerCase();
}


// ─── Formater un nom complet en majuscules ────────────────────
// Exemple : nomComplet('dupont', 'jean') → 'JEAN DUPONT'
function nomComplet(nom, prenom) {
    return `${prenom.toUpperCase()} ${nom.toUpperCase()}`;
}
