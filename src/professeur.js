// ═══════════════════════════════════════════════════════════════
//  src/professeur.js
//  Logique de la page AnalyseProfesseur.html :
//  - chargement des sessions créées par le professeur connecté
//  - pour une session : affichage des élèves présents
//  - vue individuelle d'un élève OU vue "tous les élèves"
//  - panneau Paramètres (suppression session, suppression compte)
// ═══════════════════════════════════════════════════════════════


// Variables globales utilisées par les gestionnaires de clics.
let sessions   = null;   // sessions du professeur connecté
let listeEleve = null;   // sessions des élèves de la session sélectionnée


// ─── Initialisation de la page ────────────────────────────────
async function PageProfesseur() {
    const utilisateur = requireAuth('professeur');

    // Affichage du nom en haut à droite
    document.getElementById('userInfo').textContent =
        nomComplet(utilisateur.nom, utilisateur.prenom);

    // Bouton de déconnexion
    document.getElementById('btn-deconnexion')
        .addEventListener('click', deconnecter);

    // Chargement des sessions du professeur
    const idProf = utilisateur[COLS.PROFESSEUR.id];
    sessions = await recupererSessionsProfesseur(idProf);

    if (!sessions || sessions.length === 0) {
        afficherEtatVide('Aucune session disponible.');
        return;
    }
    afficherListeSessions(sessions);
}


// ─── Requête : sessions d'un professeur ───────────────────────
async function recupererSessionsProfesseur(idProfesseur) {
    const { data, error } = await db
        .from(TABLES.SESSION_PROFESSEUR)
        .select('*')
        .eq(COLS.SESSION_PROFESSEUR.idProfesseur, idProfesseur);

    if (error) {
        console.error('Erreur sessions prof :', error);
        return null;
    }
    return data;
}


// ─── Requête : sessions des élèves d'une session prof ─────────
// On utilise une jointure Supabase pour récupérer d'un coup
// les noms et prénoms des élèves (depuis la table eleve).
async function recupererSessionsEleve(listeId, linkSession) {
    const { data, error } = await db
        .from(TABLES.SESSION_ELEVE)
        .select(`*, ${TABLES.ELEVE}(nom, prenom)`)
        .eq(COLS.SESSION_ELEVE.link, linkSession)
        .in(COLS.SESSION_ELEVE.idEleve, listeId);

    if (error) {
        console.error('Erreur sessions élève :', error);
        return null;
    }
    return data;
}


// ─── Affichage de la liste latérale des sessions du prof ─────
function afficherListeSessions(data) {
    const container = document.getElementById('sessions-list');
    if (!container) return;

    const html = data.map((session, i) => {
        const listeEleveStr = String(session.listeeleve);
        return `
        <div class="session-card"
             onclick="changerSession([${listeEleveStr}], ${session.linksession}, ${i})">
            <p><strong>Session ${session.linksession} du ${session.Date} à ${session.Heure}</strong></p>
            <p>Sujet : ${session.sujet}</p>
        </div>`;
    }).join('');

    container.innerHTML = html;
}


// ─── Clic sur une session : charger les élèves présents ──────
async function changerSession(listeEleveNum, linkSession, index) {
    listeEleve = null;
    document.getElementById('list-eleve').innerHTML = '';
    resetStatsUI();

    // Mettre en surbrillance la carte cliquée
    const cartes = document.querySelectorAll('.session-card');
    cartes.forEach((carte, i) => {
        carte.classList.toggle('active', i === index);
    });

    await afficherElevesPresents(listeEleveNum, linkSession);
    afficherResultatAll();
}


function resetStatsUI() {
    const champs = ['Max', 'Min', 'Avg', 'Mesure', 'time', 'date'];
    champs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });

    const titre = document.getElementById('chart-title');
    if (titre) titre.textContent = 'Graphe';

    const container = document.getElementById('graphe-container');
    if (container) container.innerHTML = '';
}


// ─── Panneau "élèves présents" ────────────────────────────────
// On affiche une carte spéciale "Tous les élèves" en premier,
// puis une carte par élève présent dans la session.
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

    const cartesEleves = listeEleve.map((item, i) => `
        <div class="session-eleve" onclick="afficherResultatEleve(${i})">
            <p><strong>${item.eleve.nom} ${item.eleve.prenom}</strong></p>
            <p>Type : ${item.typemesure}</p>
        </div>`).join('');

    container.innerHTML = carteAll + cartesEleves;
}


// ─── Vue individuelle d'un élève ──────────────────────────────
function afficherResultatEleve(index) {
    if (!listeEleve) return;

    const session = listeEleve[index];
    const valeurs = session.datamesure?.valeurs;
    const temps   = session.datamesure?.temps;

    if (!valeurs || !temps) return;

    const stats = moyenneMinMax(valeurs);

    document.getElementById('Max').textContent    = stats.max;
    document.getElementById('Min').textContent    = stats.min;
    document.getElementById('Avg').textContent    = stats.moyenne.toFixed(2);
    document.getElementById('Mesure').textContent = session.duree ?? '—';
    document.getElementById('time').textContent   = session.heur;
    document.getElementById('date').textContent   = session.date;
    document.getElementById('chart-title').textContent = 'Graphe';

    document.getElementById('graphe-container').innerHTML =
        buildSingleChart(valeurs, temps, session.typemesure);
}


// ─── Vue agrégée "Tous les élèves" ────────────────────────────
// On regroupe les sessions par type de mesure (Subjectif vs Objectif)
// puis on dessine un bloc (graphique + stats) par groupe.
// [Regroupement et rendu multi-courbes : assisté par IA]
function afficherResultatAll() {
    if (!listeEleve || listeEleve.length === 0) return;

    // Réinitialiser les stats individuelles
    const champs = ['Max', 'Min', 'Avg', 'Mesure', 'time', 'date'];
    champs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });
    document.getElementById('chart-title').textContent = 'Graphes par type de mesure';

    // 1) Regrouper les sessions par type de mesure
    const groupes = {};
    listeEleve.forEach(item => {
        const type = item.typemesure || 'Inconnu';
        if (!groupes[type]) groupes[type] = [];
        groupes[type].push(item);
    });

    // 2) Construire un bloc HTML pour chaque groupe
    const blocs = Object.entries(groupes).map(([type, items], idx) => {
        return construireBlocGroupe(type, items, idx);
    });

    document.getElementById('graphe-container').innerHTML = blocs.join('');
}


// ─── Construire un bloc "graphique + stats" pour un groupe ───
function construireBlocGroupe(type, items, idx) {
    const couleur = COLORS_ALL[idx % COLORS_ALL.length];
    const axe     = getAxe(type);

    // Toutes les valeurs du groupe, pour calculer des stats globales
    const toutesValeurs = items.flatMap(e => e.datamesure?.valeurs || []);
    const stats = toutesValeurs.length > 0 ? moyenneMinMax(toutesValeurs) : null;

    // Durée la plus longue parmi les élèves, pour aligner les courbes
    const tempsMax = Math.max(...items.map(e => {
        const temps = e.datamesure?.temps;
        return temps ? temps[temps.length - 1] : 0;
    }));

    // Une polyline par élève, avec une opacité différente pour les distinguer
    const polylines = items.map((item, i) => {
        const valeurs = item.datamesure?.valeurs;
        const temps   = item.datamesure?.temps;
        if (!valeurs || !temps) return '';

        const opacity = (0.35 + (0.65 / items.length) * (i + 1)).toFixed(2);
        const points  = genererPoints(valeurs, temps, axe.valMax, tempsMax);
        return `<polyline fill="none" stroke="${couleur}" stroke-width="0.4" opacity="${opacity}" points="${points}"/>`;
    }).join('');

    // Stats (ou message "aucune donnée")
    const statsHTML = stats
        ? `<span class="all-stat"><span class="all-stat-label">Min</span>    <span class="all-stat-value">${stats.min}</span></span>
           <span class="all-stat"><span class="all-stat-label">Max</span>    <span class="all-stat-value">${stats.max}</span></span>
           <span class="all-stat"><span class="all-stat-label">Moy</span>    <span class="all-stat-value">${stats.moyenne.toFixed(2)}</span></span>
           <span class="all-stat"><span class="all-stat-label">Élèves</span> <span class="all-stat-value">${items.length}</span></span>`
        : '<span class="all-stat-label">Aucune donnée</span>';

    return `
        <div class="all-chart-block" style="--block-color:${couleur}">
            <div class="all-chart-header">
                <span class="all-chart-type">${type}</span>
                <div class="all-chart-stats">${statsHTML}</div>
            </div>
            ${buildChartHTML(polylines, genererTicksHTML(tempsMax), type, couleur)}
        </div>`;
}


// ─── État vide ────────────────────────────────────────────────
function afficherEtatVide(message) {
    const container = document.getElementById('sessions-list');
    if (container) {
        container.innerHTML =
            `<p style="padding:16px;color:var(--text-muted);font-size:.85rem">${message}</p>`;
    }
}


// ─── Panneau Paramètres ───────────────────────────────────────
function toggleParametres() {
    const panel       = document.getElementById('panel-params');
    const mainContent = document.getElementById('main-content');
    const btn         = document.getElementById('btn-params');
    const ouvert      = panel.style.display === 'flex';

    panel.style.display       = ouvert ? 'none' : 'flex';
    mainContent.style.display = ouvert ? 'flex' : 'none';
    btn.textContent           = ouvert ? 'Paramètres' : '← Retour';
    btn.classList.toggle('header-btn--active', !ouvert);

    if (!ouvert) {
        setMsg('msg-session', '', '');
        setMsg('msg-compte',  '', '');
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


// ─── Helper pour les messages (succès/erreur) ─────────────────
function setMsg(id, texte, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = texte;
    el.className   = 'params-msg' + (type ? ' ' + type : '');
}


// ─── Suppression d'une session par son identifiant ────────────
// Cascade : on supprime d'abord les SessionEleve qui pointent
// vers cette linksession, puis la SessionProfesseur elle-même.
async function supprimerSession() {
    const id = parseInt(document.getElementById('input-session-id').value, 10);

    if (!id || id <= 0) {
        setMsg('msg-session', 'Identifiant invalide.', 'error');
        return;
    }

    setMsg('msg-session', 'Suppression en cours…', '');

    // 1) Cascade sur SessionEleve
    await db.from(TABLES.SESSION_ELEVE)
        .delete()
        .eq(COLS.SESSION_ELEVE.link, id);

    // 2) Supprimer la SessionProfesseur
    const { error } = await db.from(TABLES.SESSION_PROFESSEUR)
        .delete()
        .eq(COLS.SESSION_PROFESSEUR.linkSession, id);

    if (error) {
        setMsg('msg-session', `Erreur : ${error.message}`, 'error');
        return;
    }

    setMsg('msg-session', `Session ${id} supprimée.`, 'success');
    document.getElementById('input-session-id').value = '';

    // Recharger la liste des sessions
    const utilisateur = getUtilisateur();
    if (utilisateur) {
        sessions = await recupererSessionsProfesseur(utilisateur[COLS.PROFESSEUR.id]);
        afficherListeSessions(sessions || []);
    }
}


// ─── Suppression de compte : demande de confirmation ─────────
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

    document.getElementById('btn-confirm-delete')
        .addEventListener('click', supprimerCompteProfesseur);
    document.getElementById('btn-cancel-delete')
        .addEventListener('click', () => div.remove());
}


// ─── Suppression effective du compte professeur ──────────────
// Trois étapes en cascade :
//   1) récupérer tous les linksession du prof
//   2) supprimer toutes les SessionEleve qui référencent ces linksession
//   3) supprimer les SessionProfesseur du prof
//   4) supprimer le prof lui-même
async function supprimerCompteProfesseur() {
    const utilisateur = getUtilisateur();
    if (!utilisateur) {
        setMsg('msg-compte', 'Aucun utilisateur connecté.', 'error');
        return;
    }

    const idProf = utilisateur[COLS.PROFESSEUR.id];

    document.getElementById('confirm-compte')?.remove();
    setMsg('msg-compte', 'Suppression en cours…', '');

    // 1) Lister les linksession de ce prof
    const { data: sessionsProf } = await db
        .from(TABLES.SESSION_PROFESSEUR)
        .select(COLS.SESSION_PROFESSEUR.linkSession)
        .eq(COLS.SESSION_PROFESSEUR.idProfesseur, idProf);

    // 2) Cascade sur SessionEleve
    if (sessionsProf && sessionsProf.length > 0) {
        const links = sessionsProf.map(s => s[COLS.SESSION_PROFESSEUR.linkSession]);
        await db.from(TABLES.SESSION_ELEVE)
            .delete()
            .in(COLS.SESSION_ELEVE.link, links);
    }

    // 3) Supprimer les SessionProfesseur
    await db.from(TABLES.SESSION_PROFESSEUR)
        .delete()
        .eq(COLS.SESSION_PROFESSEUR.idProfesseur, idProf);

    // 4) Supprimer le prof lui-même
    const { error } = await db.from(TABLES.PROFESSEUR)
        .delete()
        .eq(COLS.PROFESSEUR.id, idProf);

    if (error) {
        setMsg('msg-compte', `Erreur : ${error.message}`, 'error');
        return;
    }

    sessionStorage.clear();
    setMsg('msg-compte', 'Compte supprimé. Redirection…', 'success');
    setTimeout(() => { window.location.href = 'Connexion.html'; }, 2000);
}


// ─── Navigation vers l'historique ─────────────────────────────
function goToHistorique() {
    window.location.href = 'Historique.html';
}


// ─── Point d'entrée : lancement de la page ────────────────────
document.addEventListener('DOMContentLoaded', PageProfesseur);
