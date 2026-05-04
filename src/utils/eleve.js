let donneesSession = null;

// ── Init ──────────────────────────────────────────────────────
async function PageEleve() {
    const utilisateur = requireAuth('élève');

    document.getElementById('userInfo').textContent =
        String(utilisateur.nom) + ' ' + String(utilisateur.prenom);
    document.getElementById('btn-deconnexion').addEventListener('click', deconnecter);

    donneesSession = await recupererSessions(utilisateur[COLS.ELEVE.id]);

    if (!donneesSession || donneesSession.length === 0) {
        afficherEtatVide('Aucune session disponible pour le moment.');
        return;
    }

    donneesSession.sort((a, b) =>
        new Date(`${b.date}T${b.heur}`) - new Date(`${a.date}T${a.heur}`)
    );

    afficherListeSessions(donneesSession);
    changerSession(0);
}

// ── Supabase ──────────────────────────────────────────────────
async function recupererSessions(ideleve) {
    const { data, error } = await db
        .from(TABLES.SESSION_ELEVE)
        .select('*')
        .eq(COLS.SESSION_ELEVE.idEleve, ideleve);

    if (error) {
        console.error('Erreur récupération sessions :', error);
        afficherEtatVide('Erreur de chargement des sessions.');
        return null;
    }
    return data;
}

// ── Liste sessions ────────────────────────────────────────────
function afficherListeSessions(sessions) {
    const container = document.getElementById('sessions-list');
    if (!container) return;
    container.innerHTML = sessions.map((s, i) => `
        <div class="session-card" onclick="changerSession(${i})">
            <p><strong>Session du ${s.date} à ${s.heur}</strong></p>
            <p>Type de mesure : ${s.typemesure}</p>
        </div>
    `).join('');
}

// ── Changement de session ─────────────────────────────────────
function changerSession(index) {
    document.querySelectorAll('.session-card')
        .forEach((el, i) => el.classList.toggle('active', i === index));
    resetStatsUI();
    afficherResultat(index);
}

function resetStatsUI() {
    document.getElementById('Result').textContent      = 'Résultats de la session';
    document.getElementById('chart-title').textContent = 'Graphe';
    ['Max', 'Min', 'Avg', 'duree', 'time', 'date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });
}

// ── Affichage résultat ────────────────────────────────────────
function afficherResultat(index) {
    const session = donneesSession[index];
    const valeurs = session.datamesure?.valeurs;
    const temps   = session.datamesure?.temps;
    const type    = session.typemesure;

    if (!valeurs || !temps || valeurs.length === 0) {
        document.getElementById('graphe-container').innerHTML =
            '<p style="color:var(--text-muted);padding:16px">Aucune donnée pour cette session.</p>';
        return;
    }

    const { min, max, moyenne } = moyenneMinMax(valeurs);

    document.getElementById('Result').textContent =
        session.link != null ? `Résultats liés à la session ${session.link}` : 'Résultats de la session';
    document.getElementById('Max').textContent    = max;
    document.getElementById('Min').textContent    = min;
    document.getElementById('Avg').textContent    = moyenne.toFixed(2);
    document.getElementById('duree').textContent  = session.duree ?? '—';
    document.getElementById('time').textContent   = session.heur;
    document.getElementById('date').textContent   = session.date;
    document.getElementById('chart-title').textContent =
        type === 'Subjectif' ? 'Graphe : Mesure Subjectif' : 'Graphe : Mesure Objectif';

    document.getElementById('graphe-container').innerHTML = buildSingleChart(valeurs, temps, type);
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

// ── Suppression de compte ─────────────────────────────────────
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
    document.getElementById('btn-confirm-delete').addEventListener('click', supprimerCompte);
    document.getElementById('btn-cancel-delete').addEventListener('click', () => div.remove());
}

async function supprimerCompte() {
    const utilisateur = getUtilisateur();
    if (!utilisateur) { setMsg('msg-compte', 'Aucun utilisateur connecté.', 'error'); return; }

    const ideleve = utilisateur[COLS.ELEVE.id];

    document.getElementById('confirm-compte')?.remove();
    setMsg('msg-compte', 'Suppression en cours…', '');

    // 1) Cascade : supprimer les SessionEleve liées
    await db.from(TABLES.SESSION_ELEVE)
        .delete()
        .eq(COLS.SESSION_ELEVE.idEleve, ideleve);

    // 2) Supprimer l'élève lui-même
    const { error } = await db.from(TABLES.ELEVE)
        .delete()
        .eq(COLS.ELEVE.id, ideleve);

    if (error) { setMsg('msg-compte', `Erreur : ${error.message}`, 'error'); return; }

    sessionStorage.clear();
    setMsg('msg-compte', 'Compte supprimé. Redirection…', 'success');
    setTimeout(() => { window.location.href = 'Connexion.html'; }, 2000);
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', PageEleve);

// ── Export CSV ────────────────────────────────────────────────
function exporterCSV() {
    const msgEl = document.getElementById('msg-export');
    if (!donneesSession || donneesSession.length === 0) {
        if (msgEl) msgEl.textContent = 'Aucune donnée à exporter.';
        return;
    }
    const lignes = [['Type mesure', 'Date', 'Heure', 'Durée', 'Session liée', 'Valeurs', 'Temps (s)']];
    donneesSession.forEach(s => {
        lignes.push([
            s.typemesure ?? '', s.date ?? '', s.heur ?? '', s.duree ?? '', s.link ?? '',
            (s.datamesure?.valeurs ?? []).join(';'),
            (s.datamesure?.temps   ?? []).join(';')
        ]);
    });
    const contenu = lignes.map(row => row.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + contenu], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'mosea_mes_sessions.csv'; a.click();
    URL.revokeObjectURL(url);
    if (msgEl) { msgEl.textContent = 'Export réussi.'; msgEl.className = 'params-msg success'; }
}
