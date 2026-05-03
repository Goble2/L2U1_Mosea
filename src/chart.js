// ── Utilitaires graphiques SVG — MOSEA ───────────────────────
// Généré avec assistance IA (Claude, Anthropic)

// ── SVG viewBox (unités internes) ────────────────────────────
const CHART_W     = 100;   // largeur utile du tracé
const CHART_H     = 50;    // hauteur utile du tracé
const CHART_PAD_X = 8;     // marge gauche (axe Y)
const CHART_PAD_Y = 4;     // marge haute/basse

// ── Formatage de la durée en axe X ───────────────────────────
// Choisit automatiquement l'unité selon l'amplitude (secondes vs minutes)
function formaterTempsAxe(secondes) {
    if (secondes >= 120) {
        const min = Math.round(secondes / 60);
        return min + ' min';
    }
    return secondes + 's';
}

// ── Génère les points SVG normalisés ─────────────────────────
// valeurs  : tableau de mesures
// temps    : tableau de timestamps (en secondes depuis début)
// valMax   : valeur maximale de l'axe Y (ex : 5 pour subjectif, 220 pour objectif)
// dureeMax : durée totale de référence en secondes (au moins 1 pour éviter ÷0)
function genererPoints(valeurs, temps, valMax, dureeMax) {
    const dMax = Math.max(dureeMax, 1);
    return valeurs.map((v, i) => {
        const x = CHART_PAD_X + (temps[i] / dMax) * CHART_W;
        const y = CHART_PAD_Y + CHART_H - (v / valMax) * CHART_H;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
}

// ── Génère les ticks de l'axe X en HTML ──────────────────────
// dureeMax : durée totale en secondes
// Affiche 5 ticks répartis uniformément ; adapte l'unité (s / min)
function genererTicksHTML(dureeMax) {
    const dMax  = Math.max(dureeMax, 1);
    const steps = 5;
    return Array.from({ length: steps + 1 }, (_, i) => {
        const t      = Math.round((i / steps) * dMax);
        const pct    = (i / steps) * 100;
        const label  = formaterTempsAxe(t);
        return `<span style="left:${pct.toFixed(1)}%">${label}</span>`;
    }).join('');
}

// ── Génère les lignes de grille horizontales ─────────────────
function buildGridLines(yTicks, valMax) {
    return yTicks.map(v => {
        const y = (CHART_PAD_Y + CHART_H - (v / valMax) * CHART_H).toFixed(2);
        return `<line x1="${CHART_PAD_X}" y1="${y}" x2="${CHART_PAD_X + CHART_W}" y2="${y}"
                      stroke="var(--border)" stroke-width="0.3" stroke-dasharray="1,1"/>`;
    }).join('');
}

// ── Génère les labels de l'axe Y ─────────────────────────────
function buildYLabels(yTicks, valMax) {
    return yTicks.map(v => {
        const y = (CHART_PAD_Y + CHART_H - (v / valMax) * CHART_H + 1).toFixed(2);
        return `<text x="${(CHART_PAD_X - 1).toFixed(2)}" y="${y}"
                      font-size="3" fill="var(--text-muted)" text-anchor="end">${v}</text>`;
    }).join('');
}

// ── Retourne l'axe correspondant au type de mesure ───────────
function getAxe(type) {
    return AXES[type] || AXES['Subjectif'];
}

// ── Retourne min / max / moyenne d'un tableau ────────────────
function moyenneMinMax(valeurs) {
    if (!valeurs || valeurs.length === 0) return { min: 0, max: 0, moyenne: 0 };
    const min     = Math.min(...valeurs);
    const max     = Math.max(...valeurs);
    const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
    return { min, max, moyenne };
}

// ── Construit le HTML complet d'un bloc graphe ───────────────
function buildChartHTML(polylines, ticksHTML, type, couleur) {
    const { valMax, yTicks } = getAxe(type);
    const gridLines = buildGridLines(yTicks, valMax);
    const yLabels   = buildYLabels(yTicks, valMax);
    const vbW = CHART_PAD_X + CHART_W + 2;
    const vbH = CHART_PAD_Y * 2 + CHART_H + 4;

    return `
    <div class="chart-wrap">
        <svg viewBox="0 0 ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg"
             preserveAspectRatio="none" class="chart-svg">
            ${gridLines}
            ${yLabels}
            ${polylines}
        </svg>
        <div class="chart-ticks-x">${ticksHTML}</div>
    </div>`;
}

// ── Construit un graphe pour un seul élève ───────────────────
function buildSingleChart(valeurs, temps, type) {
    const { valMax } = getAxe(type);
    const dureeMax   = Math.max(...temps, 1);
    const pts        = genererPoints(valeurs, temps, valMax, dureeMax);
    const couleur    = type === 'Subjectif' ? 'var(--accent)' : '#e67e22';
    const polyline   = `<polyline fill="none" stroke="${couleur}" stroke-width="0.6"
                                  stroke-linejoin="round" stroke-linecap="round"
                                  points="${pts}"/>`;
    return buildChartHTML(polyline, genererTicksHTML(dureeMax), type, couleur);
}
