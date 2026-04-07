// ═══════════════════════════════════════════════════════════════
//  src/utils/chart.js
//  Toute la logique de construction des graphes SVG.
//  Partagée entre eleve.js et professeur.js.
// ═══════════════════════════════════════════════════════════════

// ── AXES ──────────────────────────────────────────────────────
/**
 * Retourne la config d'axe pour un type de mesure.
 * Fallback sur Subjectif si le type est inconnu.
 * @param {'Subjectif'|'Objectif'} type
 */
function getAxe(type) {
    return AXES[type] || AXES.Subjectif;
}

// ── POINTS SVG ────────────────────────────────────────────────
/**
 * Calcule les coordonnées SVG pour une série de valeurs.
 * Système de coordonnées : viewBox 0 0 100 100
 *   x : 10 → 95
 *   y : 95 - (v / valMax * 90)  → 5 = haut, 95 = bas
 *
 * @param {number[]} valeurs   - Valeurs mesurées
 * @param {number[]} temps     - Timestamps en secondes
 * @param {number}   valMax    - Valeur max de l'axe Y
 * @param {number}   tempsMax  - Durée totale (pour normaliser l'axe X)
 * @returns {string} Points au format SVG "x1,y1 x2,y2 ..."
 */
function genererPoints(valeurs, temps, valMax, tempsMax) {
    const duree = tempsMax || temps[temps.length - 1] || 1;
    return valeurs.map((v, i) => {
        const x = 10 + (temps[i] / duree) * 85;
        const y = 95 -  (v / valMax)      * 90;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
}

// ── AXE X ─────────────────────────────────────────────────────
/**
 * Génère les ticks HTML de l'axe X.
 * Choisit automatiquement le pas le plus lisible.
 * @param {number} dureeTotal - Durée totale en secondes
 * @returns {string} HTML des ticks
 */
function genererTicksHTML(dureeTotal) {
    if (!dureeTotal || dureeTotal === 0) return '';
    const candidats = [5, 10, 15, 20, 30, 60, 120, 180, 300, 600];
    const pas = candidats.find(p => dureeTotal / p <= 8) || 600;
    let html = '';
    for (let t = 0; t <= dureeTotal; t += pas) {
        const pct = (t / dureeTotal) * 100;
        html += `<span class="x-tick" style="left:${pct.toFixed(1)}%">${formaterTemps(t)}</span>`;
    }
    return html;
}

// ── GRILLE ────────────────────────────────────────────────────
/**
 * Génère les lignes de grille SVG alignées sur les ticks Y.
 * @param {'Subjectif'|'Objectif'} type
 * @returns {string} SVG <line> elements
 */
function buildGridLines(type) {
    const { yTicks, valMax } = getAxe(type);
    return yTicks.map(v => {
        const y = (95 - (v / valMax * 90)).toFixed(1);
        return `<line x1="0" y1="${y}" x2="100" y2="${y}" stroke="var(--grid)" stroke-width="0.5"/>`;
    }).join('');
}

// ── HTML COMPLET DU GRAPHE ────────────────────────────────────
/**
 * Construit le HTML complet d'un graphe (axes + SVG + ticks X).
 *
 * @param {string} polylinesHTML  - SVG <polyline> elements
 * @param {string} ticksXHTML     - HTML des ticks X
 * @param {string} type           - 'Subjectif' | 'Objectif'
 * @param {string} [couleur]      - Couleur principale (défaut: var(--accent))
 * @returns {string} HTML complet du graphe
 */
function buildChartHTML(polylinesHTML, ticksXHTML, type, couleur = 'var(--accent)') {
    const { yTicks } = getAxe(type);
    const yHTML = yTicks.map(v => `<span class="y-tick">${v}</span>`).join('');

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

/**
 * Graphe pour un seul élève / une seule série.
 *
 * @param {number[]} valeurs
 * @param {number[]} temps
 * @param {string}   type    - 'Subjectif' | 'Objectif'
 * @returns {string} HTML du graphe
 */
function buildSingleChart(valeurs, temps, type) {
    const { valMax } = getAxe(type);
    const duree     = temps[temps.length - 1];
    const pts       = genererPoints(valeurs, temps, valMax, duree);
    const polyline  = `<polyline fill="none" stroke="var(--accent)" stroke-width="0.5" points="${pts}"/>`;
    return buildChartHTML(polyline, genererTicksHTML(duree), type);
}

// ── STATS ─────────────────────────────────────────────────────
/**
 * Calcule min, max et moyenne d'un tableau de nombres.
 * @param {number[]} tab
 * @returns {{ min: number, max: number, moyenne: number }}
 */
function moyenneMinMax(tab) {
    if (!tab || tab.length === 0) return { min: 0, max: 0, moyenne: 0 };
    let somme = 0, min = tab[0], max = tab[0];
    for (const v of tab) {
        somme += v;
        if (v < min) min = v;
        if (v > max) max = v;
    }
    return { min, max, moyenne: somme / tab.length };
}
