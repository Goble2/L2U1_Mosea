// ═══════════════════════════════════════════════════════════════
//  src/eleve.js
//  Logique complète de la page Élève.
//  Importer dans indexEleve.html avec type="module".
// ═══════════════════════════════════════════════════════════════

import { db }                                         from './supabase.js';
import { getUtilisateur, deconnecter }                from './auth.js';
import { requireAuth }                                from './utils/guard.js';
import { nomComplet }                                 from './utils/format.js';
import { buildSingleChart, moyenneMinMax, getAxe }    from './utils/chart.js';
import { TABLES }                                     from './config.js';

// ── État local ────────────────────────────────────────────────
let donneesSession = null;

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════

async function PageEleve() {
    // Guard — stoppe le script si non authentifié ou mauvais rôle
    const utilisateur = requireAuth('élève');

    document.getElementById('userInfo').textContent = nomComplet(utilisateur.nom, utilisateur.prenom);

    // Bouton déconnexion
    document.getElementById('btn-deconnexion')?.addEventListener('click', deconnecter);

    // Chargement des sessions
    donneesSession = await recupererSessions(utilisateur.idEleve);

    if (!donneesSession || donneesSession.length === 0) {
        afficherEtatVide('Aucune session disponible pour le moment.');
        return;
    }

    // Tri : plus récente en premier
    donneesSession.sort((a, b) =>
        new Date(`${b.date}T${b.heur}`) - new Date(`${a.date}T${a.heur}`)
    );

    afficherListeSessions(donneesSession);
    changerSession(0);
}

// ═══════════════════════════════════════════════════════════════
//  SUPABASE
// ═══════════════════════════════════════════════════════════════

async function recupererSessions(idEleve) {
    const { data, error } = await db
        .from(TABLES.SESSION_ELEVE)
        .select('*')
        .eq('idEleve', idEleve);

    if (error) {
        console.error('Erreur récupération sessions :', error);
        afficherEtatVide('Erreur de chargement des sessions.');
        return null;
    }
    return data;
}

// ═══════════════════════════════════════════════════════════════
//  LISTE DES SESSIONS (colonne gauche)
// ═══════════════════════════════════════════════════════════════

function afficherListeSessions(sessions) {
    const container = document.getElementById('sessions-list');
    if (!container) return;

    container.innerHTML = sessions.map((s, i) => `
        <div class="session-card" data-index="${i}" onclick="window._changerSession(${i})">
            <p><strong>Session du ${s.date} à ${s.heur}</strong></p>
            <p>Type de mesure : ${s.TypeMesure}</p>
        </div>
    `).join('');
}

// ═══════════════════════════════════════════════════════════════
//  CHANGEMENT DE SESSION
// ═══════════════════════════════════════════════════════════════

function changerSession(index) {
    // Carte active
    document.querySelectorAll('.session-card')
        .forEach((el, i) => el.classList.toggle('active', i === index));

    // Reset UI
    resetStatsUI();

    // Affichage
    afficherResultat(index);
}

function resetStatsUI() {
    const champs = ['Result', 'Max', 'Min', 'Avg', 'duree', 'time', 'date', 'chart-title'];
    const valeurs = {
        'Result':      'Résultats de la session',
        'chart-title': 'Graphe',
    };
    champs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = valeurs[id] ?? '—';
    });
}

// ═══════════════════════════════════════════════════════════════
//  AFFICHAGE RÉSULTAT
// ═══════════════════════════════════════════════════════════════

function afficherResultat(index) {
    const session = donneesSession[index];
    const valeurs = session.DataMesure?.valeurs;
    const temps   = session.DataMesure?.temps;
    const type    = session.TypeMesure;

    if (!valeurs || !temps || valeurs.length === 0) {
        document.getElementById('graphe-container').innerHTML =
            '<p style="color:var(--text-muted);padding:16px">Aucune donnée pour cette session.</p>';
        return;
    }

    const { min, max, moyenne } = moyenneMinMax(valeurs);

    // Titre lié à une session prof
    document.getElementById('Result').textContent =
        session.Link != null
            ? `Résultats liés à la session ${session.Link}`
            : 'Résultats de la session';

    document.getElementById('Max').textContent   = max;
    document.getElementById('Min').textContent   = min;
    document.getElementById('Avg').textContent   = moyenne.toFixed(2);
    document.getElementById('duree').textContent = session.duree ?? '—';
    document.getElementById('time').textContent  = session.heur;
    document.getElementById('date').textContent  = session.date;

    document.getElementById('chart-title').textContent =
        type === 'Subjectif' ? 'Graphe : Mesure Subjectif' : 'Graphe : Mesure Objectif';

    document.getElementById('graphe-container').innerHTML =
        buildSingleChart(valeurs, temps, type);
}

// ═══════════════════════════════════════════════════════════════
//  ÉTAT VIDE
// ═══════════════════════════════════════════════════════════════

function afficherEtatVide(message) {
    const container = document.getElementById('sessions-list');
    if (container) {
        container.innerHTML = `<p style="padding:16px;color:var(--text-muted);font-size:.85rem">${message}</p>`;
    }
}

// ═══════════════════════════════════════════════════════════════
//  PARAMÈTRES & AIDE
// ═══════════════════════════════════════════════════════════════

export function toggleParametres() {
    const panel       = document.getElementById('panel-params');
    const mainContent = document.getElementById('main-content');
    const btn         = document.getElementById('btn-params');
    const isOpen      = panel.style.display === 'flex';

    if (isOpen) {
        panel.style.display       = 'none';
        mainContent.style.display = 'flex';
        btn.textContent           = 'Paramètres';
        btn.classList.remove('header-btn--active');
    } else {
        panel.style.display       = 'flex';
        mainContent.style.display = 'none';
        btn.textContent           = '← Retour';
        btn.classList.add('header-btn--active');
        setMsg('msg-compte', '', '');
        document.getElementById('confirm-compte')?.remove();
    }
}

export function toggleAide() {
    const modal = document.getElementById('modal-aide');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

export function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function setMsg(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className   = 'params-msg' + (type ? ' ' + type : '');
}

// ── Suppression de compte ─────────────────────────────────────

export function confirmerSuppressionCompte() {
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

    document.getElementById('confirm-compte')?.remove();
    setMsg('msg-compte', 'Suppression en cours…', '');

    await db.from(TABLES.SESSION_ELEVE).delete().eq('idEleve', utilisateur.idEleve);

    const { error } = await db.from(TABLES.ELEVE).delete().eq('idEleve', utilisateur.idEleve);
    if (error) { setMsg('msg-compte', `Erreur : ${error.message}`, 'error'); return; }

    sessionStorage.clear();
    setMsg('msg-compte', 'Compte supprimé. Redirection…', 'success');
    setTimeout(() => { window.location.href = '/index.html'; }, 2000);
}

// ═══════════════════════════════════════════════════════════════
//  EXPOSITION GLOBALE (pour les onclick HTML inline)
//  → À supprimer si on migre vers des addEventListener
// ═══════════════════════════════════════════════════════════════

window._changerSession          = changerSession;
window.toggleParametres         = toggleParametres;
window.toggleAide               = toggleAide;
window.closeModal               = closeModal;
window.confirmerSuppressionCompte = confirmerSuppressionCompte;

// ═══════════════════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', PageEleve);
