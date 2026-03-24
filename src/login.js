const form  = document.getElementById('loginForm');
const msgEl = document.getElementById('msg-erreur');
const btnEl = document.getElementById('connexionButton');

function setErreur(msg) { msgEl.textContent = msg; }

function setChargement(actif) {
    btnEl.disabled    = actif;
    btnEl.textContent = actif ? 'Connexion en cours…' : 'Se connecter';
}

async function handleConnexion(event) {
    event.preventDefault();
    setErreur('');

    const nom    = document.getElementById('nom').value.trim().toLowerCase();
    const prenom = document.getElementById('prenom').value.trim().toLowerCase();
    const role   = document.getElementById('Role').value;
    const mode   = document.getElementById('Mode').value;
    const mdp    = document.getElementById('mdp').value;

    if (!nom || !prenom || !mdp) {
        setErreur('Veuillez remplir tous les champs.');
        return;
    }

    setChargement(true);
    const { utilisateur, erreur } = await connecter({ nom, prenom, mode, mdp, role });
    setChargement(false);

    if (erreur) { setErreur(erreur); return; }

    window.location.href = role === 'professeur'
        ? 'AnalyseProfesseur.html'
        : 'AnalyseEleve.html';
}

form.addEventListener('submit', handleConnexion);
