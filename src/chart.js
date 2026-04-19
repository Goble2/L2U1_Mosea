// ═══════════════════════════════════════════════════════════════
//  src/utils/chart.js   [Assisté par IA]
//
//  Construction des graphiques en SVG pur (sans bibliothèque
//  externe type Chart.js). Utilisé par eleve.js et professeur.js.
//
//  Système de coordonnées : viewBox "0 0 100 100"
//    - l'axe X va de x=10 (gauche) à x=95 (droite)  → 85 unités
//    - l'axe Y va de y=5  (haut)   à y=95 (bas)      → 90 unités
//  (en SVG, y=0 est en haut, y=100 est en bas)
// ═══════════════════════════════════════════════════════════════


// ─── Récupérer la configuration d'axe selon le type de mesure
// Fallback sur Subjectif si le type est inconnu, pour éviter les crashs.
function getAxe(type) {
    return AXES[type] || AXES.Subjectif;
}


// ─── Calculer les coordonnées SVG des points de mesure ────────
// Transforme chaque couple (temps, valeur) en coordonnées "x,y"
// dans le viewBox 100x100.
function genererPoints(valeurs, temps, valMax, tempsMax) {
    // Si tempsMax n'est pas fourni, on prend le dernier temps.
    const dureeTotale = tempsMax || temps[temps.length - 1];

    const pointsSvg = valeurs.map((valeur, i) => {
        const x = 10 + (temps[i] / dureeTotale) * 85;
        const y = 95 - (valeur / valMax)        * 90;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return pointsSvg.join(' ');
}


// ─── Générer les graduations (ticks) de l'axe X ───────────────
// Choisit automatiquement le pas le plus lisible selon la durée.
// Par exemple une session de 30s aura un tick toutes les 5 secondes,
// une session de 10 minutes en aura un toutes les 120 secondes.
function genererTicksHTML(dureeTotale) {
    if (!dureeTotale || dureeTotale === 0) return '';

    // Liste des pas possibles (en secondes). On choisit le plus
    // petit pas qui ne produit pas plus de 8 graduations.
    const pasPossibles = [5, 10, 15, 20, 30, 60, 120, 180, 300, 600];
    const pas = pasPossibles.find(p => dureeTotale / p <= 8) || 600;

    let html = '';
    for (let t = 0; t <= dureeTotale; t += pas) {
        const pourcentage = (t / dureeTotale) * 100;
        html += `<span class="x-tick" style="left:${pourcentage.toFixed(1)}%">${formaterTemps(t)}</span>`;
    }
    return html;
}


// ─── Générer les lignes de grille horizontales ────────────────
// Une ligne par graduation de l'axe Y, pour aider la lecture.
function buildGridLines(type) {
    const axe = getAxe(type);

    const lignes = axe.yTicks.map(valeur => {
        const y = (95 - (valeur / axe.valMax) * 90).toFixed(1);
        return `<line x1="0" y1="${y}" x2="100" y2="${y}" stroke="var(--grid)" stroke-width="0.5"/>`;
    });

    return lignes.join('');
}


// ─── Assembler le HTML complet du graphique ───────────────────
// Combine : graduations Y (à gauche) + zone SVG (grille + courbes)
//           + graduations X (en bas).
function buildChartHTML(polylinesHTML, ticksXHTML, type, couleur = 'var(--accent)') {
    const axe = getAxe(type);

    // Graduations Y en HTML
    const yHTML = axe.yTicks
        .map(valeur => `<span class="y-tick">${valeur}</span>`)
        .join('');

    return `
    <div class="chart">
        <div class="y-axis">${yHTML}</div>
        <div class="chart-svg-area">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="line-chart">
                ${buildGridLines(type)}
                ${polylinesHTML}
            </svg>
            <div class="x-axis x-axis--relative">${ticksXHTML}</div>
        </div>
    </div>`;
}


// ─── Construire un graphique pour une seule courbe ────────────
// Utilisé pour la vue "un seul élève" (côté élève ou côté professeur).
function buildSingleChart(valeurs, temps, type) {
    const axe    = getAxe(type);
    const duree  = temps[temps.length - 1];
    const points = genererPoints(valeurs, temps, axe.valMax, duree);

    const polyline = `<polyline fill="none" stroke="var(--accent)" stroke-width="0.5" points="${points}"/>`;

    return buildChartHTML(polyline, genererTicksHTML(duree), type);
}


// ─── Calculer min, max et moyenne d'un tableau ────────────────
// Parcours unique du tableau pour de meilleures performances.
function moyenneMinMax(tableau) {
    let somme = 0;
    let min   = tableau[0];
    let max   = tableau[0];

    for (const valeur of tableau) {
        somme += valeur;
        if (valeur < min) min = valeur;
        if (valeur > max) max = valeur;
    }

    return {
        min:     min,
        max:     max,
        moyenne: somme / tableau.length,
    };
}
