// ═══════════════════════════════════════════════════════════════
//  src/login.js   [Assisté par IA pour la structure initiale]
//  Gère les interactions de la page Connexion.html :
//  lecture des champs, affichage des messages, redirection.
// ═══════════════════════════════════════════════════════════════


// ─── Références aux éléments du DOM ──────────────────────────
const formulaire   = document.getElementById('loginForm');
const zoneErreur   = document.getElementById('msg-erreur');
const boutonLogin  = document.getElementById('connexionButton');


// ─── Affichage du message d'erreur ───────────────────────────
function setErreur(message) {
    zoneErreur.textContent = message;
}


// ─── État "en chargement" du bouton ──────────────────────────
// Pendant la requête Supabase, on désactive le bouton et on
// change son texte, pour éviter les double-clics.
function setChargement(actif) {
    boutonLogin.disabled    = actif;
    boutonLogin.textContent = actif ? 'Connexion en cours…' : 'Se connecter';
}


// ─── Soumission du formulaire ────────────────────────────────
async function handleConnexion(event) {
    event.preventDefault();   // empêche le rechargement de la page
    setErreur('');

    // 1) Lecture des champs, nettoyage et normalisation
    //    (trim = supprime les espaces, toLowerCase = mise en minuscules)
    const nom    = document.getElementById('nom').value.trim().toLowerCase();
    const prenom = document.getElementById('prenom').value.trim().toLowerCase();
    const role   = document.getElementById('Role').value;
    const mode   = document.getElementById('Mode').value;
    const mdp    = document.getElementById('mdp').value;

    // 2) Validation côté client
    if (!nom || !prenom || !mdp) {
        setErreur('Veuillez remplir tous les champs.');
        return;
    }

    // 3) Appel à la fonction de connexion définie dans auth.js
    setChargement(true);
    const resultat = await connecter({ nom, prenom, mode, mdp, role });
    setChargement(false);

    // 4) Affichage de l'erreur ou redirection selon le rôle
    if (resultat.erreur) {
        setErreur(resultat.erreur);
        return;
    }

    if (role === 'professeur') {
        window.location.href = 'AnalyseProfesseur.html';
    } else {
        window.location.href = 'AnalyseEleve.html';
    }
}


// ─── Attacher l'écouteur d'événement au formulaire ────────────
formulaire.addEventListener('submit', handleConnexion);
