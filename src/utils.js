// ── Format ────────────────────────────────────────────────────
function nomComplet(nom, prenom) {
    return `${prenom} ${nom}`.trim();
}

// ── Stats ─────────────────────────────────────────────────────
function moyenneMinMax(valeurs) {
    const min     = Math.min(...valeurs);
    const max     = Math.max(...valeurs);
    const moyenne = valeurs.reduce((s, v) => s + v, 0) / valeurs.length;
    return { min, max, moyenne };
}

// ── Axes ──────────────────────────────────────────────────────
function getAxe(type) {
    return AXES[type] || AXES.Subjectif;
}

// ── Génération des points SVG ─────────────────────────────────
function genererPoints(valeurs, temps, valMax, tempsMax) {
    return valeurs.map((v, i) => {
        const x = ((temps[i] || 0) / (tempsMax || 1)) * 100;
        const y = 95 - (v / (valMax || 1)) * 90;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
}

// ── Ticks axe X ───────────────────────────────────────────────
function genererTicksHTML(tempsMax) {
    const nb = 5;
    return Array.from({ length: nb + 1 }, (_, i) => {
        const t   = Math.round((i / nb) * (tempsMax || 0));
        const pct = (i / nb) * 100;
        return `<span class="x-tick" style="left:${pct}%">${t}s</span>`;
    }).join('');
}

// ── Ticks axe Y ───────────────────────────────────────────────
function genererYTicksHTML(yTicks) {
    return yTicks.map(v => `<span class="y-tick">${v}</span>`).join('');
}

// ── Lignes de grille SVG ──────────────────────────────────────
function gridLines() {
    return [7.5, 25, 42.5, 60, 77.5, 94.5].map(y =>
        `<line x1="0" y1="${y}" x2="100" y2="${y}" stroke="var(--grid)" stroke-width="0.5"/>`
    ).join('');
}

// ── HTML d'un graphe complet ──────────────────────────────────
function buildChartHTML(polylines, ticksHTML, type, couleur, yTicksHTML) {
    const axe          = getAxe(type);
    const yContent     = yTicksHTML || genererYTicksHTML(axe.yTicks);
    return `
    <div class="chart">
        <div class="y-axis">${yContent}</div>
        <div class="chart-svg-area">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="line-chart">
                ${gridLines()}
                ${polylines}
            </svg>
            <div class="x-axis x-axis--relative">${ticksHTML}</div>
        </div>
    </div>`;
}

// ── Graphe simple (un seul élève / une mesure) ────────────────
function buildSingleChart(valeurs, temps, type) {
    const { valMax, yTicks } = getAxe(type);
    const tempsMax   = temps[temps.length - 1] || 1;
    const points     = genererPoints(valeurs, temps, valMax, tempsMax);
    const ticksHTML  = genererTicksHTML(tempsMax);
    const yTicksHTML = genererYTicksHTML(yTicks);
    const polylines  = `<polyline fill="none" stroke="var(--accent)" stroke-width="0.6" points="${points}"/>`;
    return buildChartHTML(polylines, ticksHTML, type, 'var(--accent)', yTicksHTML);
}
