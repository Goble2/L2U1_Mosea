// ── Utilitaires graphiques SVG — MOSEA ───────────────────────
// Généré avec assistance IA (Claude, Anthropic)

// ── Dimensions SVG internes ───────────────────────────────────
const SVG_W      = 400;
const SVG_H      = 200;
const SVG_PAD_T  = 8;
const SVG_PAD_B  = 8;
const SVG_ZONE_H = SVG_H - SVG_PAD_T - SVG_PAD_B; // 184

// ── Formatage axe X ──────────────────────────────────────────
function formaterTempsAxe(s) {
    if (s === 0) return '0';
    if (s >= 3600) {
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
        return m > 0 ? `${h}h${m}min` : `${h}h`;
    }
    if (s >= 60) {
        const m = Math.floor(s / 60), sec = s % 60;
        return sec > 0 ? `${m}min${sec}s` : `${m}min`;
    }
    return s + 's';
}

// ── Coordonnée Y ─────────────────────────────────────────────
// valMax en haut (y=SVG_PAD_T), 0 en bas (y=SVG_PAD_T+SVG_ZONE_H)
function valToY(v, valMax) {
    return SVG_PAD_T + SVG_ZONE_H * (1 - Math.max(0, Math.min(v, valMax)) / valMax);
}

// ── Coordonnée X ─────────────────────────────────────────────
// t=tMin → x=0, t=tMax → x=SVG_W
// tMin = temps[0], tMax = tempsMax (passé en paramètre)
function tempsToX(t, tMin, tMax) {
    const range = tMax - tMin;
    if (range <= 0) return 0;
    return ((t - tMin) / range) * SVG_W;
}

// ── Génère les points SVG ─────────────────────────────────────
// valeurs : tableau de mesures
// temps   : tableau de timestamps — temps[0] = borne gauche, tempsMax = borne droite
// valMax  : valeur max de l'axe Y
// tempsMax: borne droite de l'axe X (peut être > temps[last] pour aligner plusieurs élèves)
function genererPoints(valeurs, temps, valMax, tempsMax) {
    if (!valeurs || !temps || valeurs.length === 0) return '';
    const tMin = temps[0];
    return valeurs.map((v, i) => {
        const x = tempsToX(temps[i], tMin, tempsMax).toFixed(2);
        const y = valToY(v, valMax).toFixed(2);
        return `${x},${y}`;
    }).join(' ');
}

// ── Ticks axe X ──────────────────────────────────────────────
// tMin = temps[0] de la session, tempsMax = temps[last]
function genererTicksHTML(tempsMax, tMin) {
    const min   = tMin ?? 0;
    const range = tempsMax - min;
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => {
        const t   = Math.round(min + (i / steps) * range);
        const pct = (i / steps) * 100;
        return `<span class="x-tick" style="left:${pct.toFixed(1)}%">${formaterTempsAxe(t)}</span>`;
    }).join('');
}

// ── Grille horizontale ────────────────────────────────────────
function buildGridLines(yTicks, valMax) {
    return yTicks.map(v => {
        const y = valToY(v, valMax).toFixed(2);
        return `<line x1="0" y1="${y}" x2="${SVG_W}" y2="${y}"
                      stroke="var(--border)" stroke-width="0.8"
                      stroke-dasharray="4,4" opacity="0.5"/>`;
    }).join('');
}

// ── Axe Y HTML ───────────────────────────────────────────────
// yTicks décroissants [5,4,3,2,1,0] → flex space-between → 5 en haut, 0 en bas
function buildYAxisHTML(yTicks) {
    return yTicks.map(v => `<span class="y-tick">${v}</span>`).join('');
}

// ── Helpers ───────────────────────────────────────────────────
function getAxe(type) {
    return AXES[type] || AXES['Subjectif'];
}

function moyenneMinMax(valeurs) {
    if (!valeurs || valeurs.length === 0) return { min: 0, max: 0, moyenne: 0 };
    return {
        min:     Math.min(...valeurs),
        max:     Math.max(...valeurs),
        moyenne: valeurs.reduce((a, b) => a + b, 0) / valeurs.length
    };
}

// ── Bloc graphe HTML ─────────────────────────────────────────
function buildChartHTML(polylines, ticksHTML, type, _couleur) {
    const { valMax, yTicks } = getAxe(type);
    return `
    <div class="chart">
        <div class="y-axis">${buildYAxisHTML(yTicks)}</div>
        <div class="chart-svg-area">
            <svg viewBox="0 0 ${SVG_W} ${SVG_H}" xmlns="http://www.w3.org/2000/svg"
                 preserveAspectRatio="none" class="line-chart">
                ${buildGridLines(yTicks, valMax)}
                ${polylines}
            </svg>
            <div class="x-axis--relative">${ticksHTML}</div>
        </div>
    </div>`;
}

// ── Graphe simple (un seul élève) ────────────────────────────
function buildSingleChart(valeurs, temps, type) {
    const { valMax } = getAxe(type);
    const tMin    = temps[0] ?? 0;
    const tempsMax = temps[temps.length - 1] ?? tMin;
    const pts     = genererPoints(valeurs, temps, valMax, tempsMax);
    const couleur = type === 'Subjectif' ? 'var(--accent)' : '#e67e22';
    const polyline = `<polyline fill="none" stroke="${couleur}" stroke-width="2"
                                stroke-linejoin="round" stroke-linecap="round"
                                points="${pts}"/>`;
    return buildChartHTML(polyline, genererTicksHTML(tempsMax, tMin), type);
}
