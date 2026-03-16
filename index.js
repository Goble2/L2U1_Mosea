const SUPABASE_URL = 'https://wzjsjmttovuhqsaosgzt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XB90iEJcRd2fGrjEkCgfoA_BnRV-Xnh';

const { createClient } = supabase;  // Global après CDN
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verificationBase(table, donnees) {
    const { data, error } = await supabaseClient
        .from(table)
        .select('*')
        .match({ nom: donnees.nom, prenom: donnees.prenom, mode: donnees.mode, mdp: donnees.mdp })
        .maybeSingle();
    return data !== null;
}


async function connexionPage(event) {
    event.preventDefault();  

    const nom = document.getElementById('nom').value.trim().toLowerCase();
    const prenom = document.getElementById('prenom').value.trim().toLowerCase();
    const role = document.getElementById('Role').value;
    const mode = document.getElementById('Mode').value;
    const mdp = document.getElementById('mdp').value;

    const donnees = { nom, prenom, mode, mdp };
    const valide = await verificationBase((role == 'élève') ? 'eleve' : 'professeur', donnees); 

    if (valide && (role == 'professeur')) {
        window.location.href = 'indexProfesseur.html';
    } else if (valide && (role == 'élève')){
        window.location.href = 'indexEleve.html';
    } else {
        alert("Identifiants incorrects ou rôle invalide.");
    }
}


document.querySelector('form').addEventListener('submit', connexionPage);

