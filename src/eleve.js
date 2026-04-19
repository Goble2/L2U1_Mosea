// ═══════════════════════════════════════════════════════════════
//  src/eleve.js
//  Logique de la page AnalyseEleve.html :
//  - chargement des sessions de l'élève connecté
//  - affichage de la liste et des résultats
//  - panneau Paramètres et suppression de compte
// ═══════════════════════════════════════════════════════════════


// Variable globale qui contient toutes les sessions chargées.
// Elle est utilisée par changerSession() et afficherResultat().
let donneesSession = null;


// ─── Initialisation de la page ────────────────────────────────
async function PageEleve() {

    // 1) Vérifier qu'un élève est bien connecté
    const utilisateur = requireAuth('élève');

    // 2) Afficher son nom en haut à droite
    document.getElementById('userInfo').textContent =
        utilisateur.nom + ' ' + utilisateur.prenom;

    // 3) Brancher le bouton de déconnexion
    document.getElementById('btn-deconnexion')
        .addEventListener('click', deconnecter);

    // 4) Récupérer les sessions depuis Supabase
    const idEleve = utilisateur[COLS.ELEVE.id];
    donneesSession = await recupererSessions(idEleve);

    // 5) Cas "aucune session"
    if (!donneesSession || donneesSession.length === 0) {
        afficherEtatVide('Aucune session disponible pour le moment.');
        return;
    }

    // 6) Trier les sessions de la plus récente à la plus ancienne
    donneesSession.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.heur}`);
        const dateB = new Date(`${b.date}T${b.heur}`);
        return dateB - dateA;
    });

    // 7) Afficher la liste et sélectionner la première
    afficherListeSessions(donneesSession);
    changerSession(0);
}


// ─── Récupération des sessions d'un élève ─────────────────────
async function recupererSessions(idEleve) {
    const { data, error } = await db
        .from(TABLES.SESSION_ELEVE)
        .select('*')
        .eq(COLS.SESSION_ELEVE.idEleve, idEleve);

    if (error) {
        console.error('Erreur récupération sessions :', error);
        afficherEtatVide('Erreur de chargement des sessions.');
        return null;
    }
    return data;
}


// ─── Affichage de la liste latérale des sessions ──────────────
function afficherListeSessions(sessions) {
    const container = document.getElementById('sessions-list');
    if (!container) return;

    const html = sessions.map((session, i) => `
        <div class="session-card" onclick="changerSession(${i})">
            <p><strong>Session du ${session.date} à ${session.heur}</strong></p>
            <p>Type de mesure : ${session.typemesure}</p>
        </div>
    `).join('');

    container.innerHTML = html;
}


// ─── Changer de session (clic sur une carte) ──────────────────
function changerSession(index) {
    // Mettre en surbrillance la carte cliquée
    const cartes = document.querySelectorAll('.session-card');
    cartes.forEach((carte, i) => {
        carte.classList.toggle('active', i === index);
    });

    // Réinitialiser puis afficher les résultats
    resetStatsUI();
    afficherResultat(index);
}


// ─── Remettre l'affichage des stats à zéro ────────────────────
function resetStatsUI() {
    document.getElementById('Result').textContent      = 'Résultats de la session';
    document.getElementById('chart-title').textContent = 'Graphe';

    const champsAEffacer = ['Max', 'Min', 'Avg', 'duree', 'time', 'date'];
    champsAEffacer.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });
}


// ─── Afficher les résultats d'une session ─────────────────────
function afficherResultat(index) {
    const session = donneesSession[index];
    const valeurs = session.datamesure?.valeurs;
    const temps   = session.datamesure?.temps;
    const type    = session.typemesure;

    // Cas "session vide"
    if (!valeurs || !temps || valeurs.length === 0) {
        document.getElementById('graphe-container').innerHTML =
            '<p style="color:var(--text-muted);padding:16px">Aucune donnée pour cette session.</p>';
        return;
    }

    // Calcul des statistiques
    const stats = moyenneMinMax(valeurs);

    // Titre : si la session est liée à un professeur, on l'indique
    const titre = session.link != null
        ? `Résultats liés à la session ${session.link}`
        : 'Résultats de la session';

    document.getElementById('Result').textContent      = titre;
    document.getElementById('Max').textContent         = stats.max;
    document.getElementById('Min').textContent         = stats.min;
    document.getElementById('Avg').textContent         = stats.moyenne.toFixed(2);
    document.getElementById('duree').textContent       = session.duree ?? '—';
    document.getElementById('time').textContent        = session.heur;
    document.getElementById('date').textContent        = session.date;
    document.getElementById('chart-title').textContent =
        type === 'Subjectif' ? 'Graphe : Mesure Subjectif' : 'Graphe : Mesure Objectif';

    // Dessin du graphique
    document.getElementById('graphe-container').innerHTML =
        buildSingleChart(valeurs, temps, type);
}


// ─── Affichage d'un message "liste vide" ──────────────────────
function afficherEtatVide(message) {
    const container = document.getElementById('sessions-list');
    if (container) {
        container.innerHTML =
            `<p style="padding:16px;color:var(--text-muted);font-size:.85rem">${message}</p>`;
    }
}


// ─── Panneau Paramètres ───────────────────────────────────────
// Affiche/cache le panneau Paramètres et change l'état du bouton.
function toggleParametres() {
    const panel       = document.getElementById('panel-params');
    const mainContent = document.getElementById('main-content');
    const btn         = document.getElementById('btn-params');
    const ouvert      = panel.style.display === 'flex';

    panel.style.display       = ouvert ? 'none' : 'flex';
    mainContent.style.display = ouvert ? 'flex' : 'none';
    btn.textContent           = ouvert ? 'Paramètres' : '← Retour';
    btn.classList.toggle('header-btn--active', !ouvert);

    // Si on ferme le panneau, on efface les messages et la confirmation
    if (!ouvert) {
        setMsg('msg-compte', '', '');
        document.getElementById('confirm-compte')?.remove();
    }
}


// ─── Modal d'aide ─────────────────────────────────────────────
function toggleAide() {
    const modal = document.getElementById('modal-aide');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}


// ─── Petit helper pour afficher un message (succès/erreur) ───
function setMsg(id, texte, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = texte;
    el.className   = 'params-msg' + (type ? ' ' + type : '');
}


// ─── Suppression de compte : demande de confirmation ──────────
function confirmerSuppressionCompte() {
    // Si le bloc de confirmation existe déjà, ne rien faire
    if (document.getElementById('confirm-compte')) return;

    setMsg('msg-compte', '', '');

    // Création dynamique du bloc de confirmation
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

    document.getElementById('btn-confirm-delete')
        .addEventListener('click', supprimerCompte);
    document.getElementById('btn-cancel-delete')
        .addEventListener('click', () => div.remove());
}


// ─── Suppression effective du compte élève ────────────────────
// Deux étapes :
//   1) supprimer toutes les SessionEleve de l'élève (cascade)
//   2) supprimer l'élève lui-même de la table eleve
async function supprimerCompte() {
    const utilisateur = getUtilisateur();
    if (!utilisateur) {
        setMsg('msg-compte', 'Aucun utilisateur connecté.', 'error');
        return;
    }

    const idEleve = utilisateur[COLS.ELEVE.id];

    document.getElementById('confirm-compte')?.remove();
    setMsg('msg-compte', 'Suppression en cours…', '');

    // 1) Cascade : supprimer les SessionEleve liées
    await db.from(TABLES.SESSION_ELEVE)
        .delete()
        .eq(COLS.SESSION_ELEVE.idEleve, idEleve);

    // 2) Supprimer l'élève lui-même
    const { error } = await db.from(TABLES.ELEVE)
        .delete()
        .eq(COLS.ELEVE.id, idEleve);

    if (error) {
        setMsg('msg-compte', `Erreur : ${error.message}`, 'error');
        return;
    }

    // Nettoyage et redirection
    sessionStorage.clear();
    setMsg('msg-compte', 'Compte supprimé. Redirection…', 'success');
    setTimeout(() => { window.location.href = 'Connexion.html'; }, 2000);
}


// ─── Point d'entrée : lancement de la page ────────────────────
document.addEventListener('DOMContentLoaded', PageEleve);
