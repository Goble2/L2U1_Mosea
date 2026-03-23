// ═══════════════════════════════════════════════════════════════
//  src/login.js
//  Gère le formulaire de connexion de index.html.
//  Importe connecter() depuis auth.js pour ne pas dupliquer
//  la logique Supabase.
// ═══════════════════════════════════════════════════════════════

import { connecter } from './auth.js';

// ── Éléments du DOM ───────────────────────────────────────────
const form    = document.getElementById('loginForm');
const msgEl   = document.getElementById('msg-erreur');
const btnEl   = document.getElementById('connexionButton');

// ── Helpers UI ────────────────────────────────────────────────

function setErreur(message) {
    msgEl.textContent = message;
}

function setChargement(actif) {
    btnEl.disabled     = actif;
    btnEl.textContent  = actif ? 'Connexion en cours…' : 'Se connecter';
}

// ── Soumission du formulaire ──────────────────────────────────

async function handleConnexion(event) {
    event.preventDefault();
    setErreur('');

    const nom    = document.getElementById('nom').value.trim().toLowerCase();
    const prenom = document.getElementById('prenom').value.trim().toLowerCase();
    const role   = document.getElementById('Role').value;
    const mode   = document.getElementById('Mode').value;
    const mdp    = document.getElementById('mdp').value;

    // Validation basique côté client
    if (!nom || !prenom || !mdp) {
        setErreur('Veuillez remplir tous les champs.');
        return;
    }

    setChargement(true);

    const { utilisateur, erreur } = await connecter({ nom, prenom, mode, mdp, role });

    setChargement(false);

    if (erreur) {
        setErreur(erreur);
        return;
    }

    // Redirection selon le rôle
    if (role === 'professeur') {
        window.location.href = 'indexProfesseur.html';
    } else {
        window.location.href = 'indexEleve.html';
    }
}

// ── Boot ──────────────────────────────────────────────────────

form.addEventListener('submit', handleConnexion);
