let sessions   = null;
let listeEleve = null;

// ── Init ──────────────────────────────────────────────────────
async function PageProfesseur() {
    const utilisateur = requireAuth('professeur');

    document.getElementById('userInfo').textContent = nomComplet(utilisateur.nom, utilisateur.prenom);
    document.getElementById('btn-deconnexion').addEventListener('click', deconnecter);

    sessions = await recupererSessionsProfesseur(utilisateur.idProfesseur);

    if (!sessions || sessions.length === 0) {
        afficherEtatVide('Aucune session disponible.');
        return;
    }
    afficherListeSessions(sessions);
}

// ── Supabase ──────────────────────────────────────────────────
async function recupererSessionsProfesseur(idProfesseur) {
    const { data, error } = await db
        .from(TABLES.SESSION_PROFESSEUR)
        .select('*')
        .eq('idProfesseur', idProfesseur);

    if (error) { console.error('Erreur sessions prof :', error); return null; }
    return data;
}

async function recupererSessionsEleve(listeId, linkSession) {
    const { data, error } = await db
        .from(TABLES.SESSION_ELEVE)
        .select(`*, eleve(nom, prenom)`)
        .eq('Link', linkSession)
        .in('idEleve', listeId);

    if (error) { console.error('Erreur sessions élève :', error); return null; }
    return data;
}

// ── Liste sessions ────────────────────────────────────────────
function afficherListeSessions(data) {
    const container = document.getElementById('sessions-list');
    if (!container) return;
    container.innerHTML = data.map((session, i) => {
        const listeEleveStr = String(session.ListeEleve);
        return `
        <div class="session-card" onclick="changerSession([${listeEleveStr}], ${session.LinkSession}, ${i})">
            <p><strong>Session ${session.LinkSession} du ${session.Date} à ${session.Heure}</strong></p>
            <p>Sujet : ${session.sujet}</p>
        </div>`;
    }).join('');
}

// ── Changement de session ─────────────────────────────────────
async function changerSession(listeEleveNum, linkSession, index) {
    listeEleve = null;
    document.getElementById('list-eleve').innerHTML = '';
    resetStatsUI();

    document.querySelectorAll('.session-card')
        .forEach((el, i) => el.classList.toggle('active', i === index));

    await afficherElevesPresents(listeEleveNum, linkSession);
    afficherResultatAll();
}

function resetStatsUI() {
    ['Max', 'Min', 'Avg', 'Mesure', 'time', 'date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });
    const chartTitle = document.getElementById('chart-title');
    if (chartTitle) chartTitle.textContent = 'Graphe';
    const container = document.getElementById('graphe-container');
    if (container) container.innerHTML = '';
}

// ── Panel élèves présents ─────────────────────────────────────
async function afficherElevesPresents(listeEleveNum, linkSession) {
    const container = document.getElementById('list-eleve');
    if (!container) return;

    listeEleve = await recupererSessionsEleve(listeEleveNum, linkSession);
    if (!listeEleve) return;

    const carteAll = `
        <div class="session-eleve session-eleve--all" onclick="afficherResultatAll()">
            <p><strong>Tous les élèves</strong></p>
            <p>Vue agrégée par type de mesure</p>
        </div>`;

    const cartesEleves = listeEleve.map((eleve, i) => `
        <div class="session-eleve" onclick="afficherResultatEleve(${i})">
            <p><strong>${eleve.eleve.nom} ${eleve.eleve.prenom}</strong></p>
            <p>Type : ${eleve.TypeMesure}</p>
        </div>`).join('');

    container.innerHTML = carteAll + cartesEleves;
}

// ── Résultat un élève ─────────────────────────────────────────
function afficherResultatEleve(index) {
    if (!listeEleve) return;
    const session = listeEleve[index];
    const valeurs = session.DataMesure?.valeurs;
    const temps   = session.DataMesure?.temps;
    if (!valeurs || !temps) return;

    const { min, max, moyenne } = moyenneMinMax(valeurs);

    document.getElementById('Max').textContent    = max;
    document.getElementById('Min').textContent    = min;
    document.getElementById('Avg').textContent    = moyenne.toFixed(2);
    document.getElementById('Mesure').textContent = session.duree ?? '—';
    document.getElementById('time').textContent   = session.heur;
    document.getElementById('date').textContent   = session.date;
    document.getElementById('chart-title').textContent = 'Graphe';

    document.getElementById('graphe-container').innerHTML =
        buildSingleChart(valeurs, temps, session.TypeMesure);
}

// ── Résultat tous les élèves ──────────────────────────────────
function afficherResultatAll() {
    if (!listeEleve || listeEleve.length === 0) return;

    ['Max', 'Min', 'Avg', 'Mesure', 'time', 'date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });
    document.getElementById('chart-title').textContent = 'Graphes par type de mesure';

    // Regrouper par type de mesure
    const groupes = {};
    listeEleve.forEach(eleve => {
        const type = eleve.TypeMesure || 'Inconnu';
        if (!groupes[type]) groupes[type] = [];
        groupes[type].push(eleve);
    });

    const html = Object.entries(groupes).map(([type, eleves], idx) => {
        const couleur    = COLORS_ALL[idx % COLORS_ALL.length];
        const { valMax } = getAxe(type);

        const vGroupe = eleves.flatMap(e => e.DataMesure?.valeurs || []);
        const stats   = vGroupe.length > 0 ? moyenneMinMax(vGroupe) : null;

        const tempsMax = Math.max(...eleves.map(e => {
            const t = e.DataMesure?.temps;
            return t ? t[t.length - 1] : 0;
        }));

        const polylines = eleves.map((eleve, i) => {
            const v = eleve.DataMesure?.valeurs;
            const t = eleve.DataMesure?.temps;
            if (!v || !t) return '';
            const opacity = (0.35 + (0.65 / eleves.length) * (i + 1)).toFixed(2);
            const pts = genererPoints(v, t, valMax, tempsMax);
            return `<polyline fill="none" stroke="${couleur}" stroke-width="0.4" opacity="${opacity}" points="${pts}"/>`;
        }).join('');

        const statsHTML = stats ? `
            <span class="all-stat"><span class="all-stat-label">Min</span>    <span class="all-stat-value">${stats.min}</span></span>
            <span class="all-stat"><span class="all-stat-label">Max</span>    <span class="all-stat-value">${stats.max}</span></span>
            <span class="all-stat"><span class="all-stat-label">Moy</span>    <span class="all-stat-value">${stats.moyenne.toFixed(2)}</span></span>
            <span class="all-stat"><span class="all-stat-label">Élèves</span> <span class="all-stat-value">${eleves.length}</span></span>`
            : '<span class="all-stat-label">Aucune donnée</span>';

        return `
        <div class="all-chart-block" style="--block-color:${couleur}">
            <div class="all-chart-header">
                <span class="all-chart-type">${type}</span>
                <div class="all-chart-stats">${statsHTML}</div>
            </div>
            ${buildChartHTML(polylines, genererTicksHTML(tempsMax), type, couleur)}
        </div>`;
    }).join('');

    document.getElementById('graphe-container').innerHTML = html;
}

// ── État vide ─────────────────────────────────────────────────
function afficherEtatVide(message) {
    const container = document.getElementById('sessions-list');
    if (container)
        container.innerHTML = `<p style="padding:16px;color:var(--text-muted);font-size:.85rem">${message}</p>`;
}

// ── Paramètres ────────────────────────────────────────────────
function toggleParametres() {
    const panel       = document.getElementById('panel-params');
    const mainContent = document.getElementById('main-content');
    const btn         = document.getElementById('btn-params');
    const isOpen      = panel.style.display === 'flex';

    panel.style.display       = isOpen ? 'none' : 'flex';
    mainContent.style.display = isOpen ? 'flex' : 'none';
    btn.textContent           = isOpen ? 'Paramètres' : '← Retour';
    btn.classList.toggle('header-btn--active', !isOpen);

    if (!isOpen) {
        setMsg('msg-session', '', '');
        setMsg('msg-compte', '', '');
        document.getElementById('confirm-compte')?.remove();
    }
}

function toggleAide() {
    const modal = document.getElementById('modal-aide');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function setMsg(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className   = 'params-msg' + (type ? ' ' + type : '');
}

// ── Supprimer une session ─────────────────────────────────────
async function supprimerSession() {
    const id = parseInt(document.getElementById('input-session-id').value, 10);
    if (!id || id <= 0) { setMsg('msg-session', 'Identifiant invalide.', 'error'); return; }
    setMsg('msg-session', 'Suppression en cours…', '');

    const { error } = await db.from(TABLES.SESSION_PROFESSEUR).delete().eq('LinkSession', id);
    if (error) { setMsg('msg-session', `Erreur : ${error.message}`, 'error'); return; }

    setMsg('msg-session', `Session ${id} supprimée.`, 'success');
    document.getElementById('input-session-id').value = '';

    const utilisateur = getUtilisateur();
    if (utilisateur) {
        sessions = await recupererSessionsProfesseur(utilisateur.idProfesseur);
        afficherListeSessions(sessions || []);
    }
}

// ── Supprimer le compte ───────────────────────────────────────
function confirmerSuppressionCompte() {
    if (document.getElementById('confirm-compte')) return;
    setMsg('msg-compte', '', '');

    const div = document.createElement('div');
    div.id        = 'confirm-compte';
    div.className = 'params-confirm';
    div.innerHTML = `
        <p>Êtes-vous sûr ? Toutes vos sessions seront supprimées.</p>
        <div class="params-confirm-btns">
            <button class="params-btn params-btn--danger" id="btn-confirm-delete">Oui, supprimer</button>
            <button class="params-btn params-btn--cancel" id="btn-cancel-delete">Annuler</button>
        </div>`;
    document.getElementById('msg-compte').after(div);
    document.getElementById('btn-confirm-delete').addEventListener('click', supprimerCompteProfesseur);
    document.getElementById('btn-cancel-delete').addEventListener('click', () => div.remove());
}

async function supprimerCompteProfesseur() {
    const utilisateur = getUtilisateur();
    if (!utilisateur) { setMsg('msg-compte', 'Aucun utilisateur connecté.', 'error'); return; }

    document.getElementById('confirm-compte')?.remove();
    setMsg('msg-compte', 'Suppression en cours…', '');

    await db.from(TABLES.SESSION_PROFESSEUR).delete().eq('idProfesseur', utilisateur.idProfesseur);
    const { error } = await db.from(TABLES.PROFESSEUR).delete().eq('idProfesseur', utilisateur.idProfesseur);
    if (error) { setMsg('msg-compte', `Erreur : ${error.message}`, 'error'); return; }

    sessionStorage.clear();
    setMsg('msg-compte', 'Compte supprimé. Redirection…', 'success');
    setTimeout(() => { window.location.href = 'Connexion.html'; }, 2000);
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', PageProfesseur);
