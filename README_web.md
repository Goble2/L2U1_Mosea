# MOSEA — Interface Web d'analyse

> Projet L2U-1 · Université Paris Cité · L2 Informatique appliquée  
> Superviseur : Gnaho Christophe  
> Équipe : Diawara Aïché · Noumi Tayssir · Killian Louis

---

## Présentation

L'interface web MOSEA est la partie d'analyse et de visualisation du projet MOSEA (*Mesure Objective et Subjective de l'Effort et de l'Attention*). Elle permet aux professeurs et aux élèves de consulter les données de charge mentale collectées via l'application mobile Android.

L'interface est développée en **HTML5 / CSS3 / JavaScript vanilla**, sans framework ni bundler, et hébergée sur **GitHub Pages**.

---

## Structure des fichiers

```
/
├── index.html               # Page d'accueil publique (présentation + téléchargement APK)
├── index.css                # Styles de la page d'accueil
├── index.js                 # Script page d'accueil (smooth scroll, reveal, nav)
│
├── Connexion.html           # Page de connexion (professeur / élève)
├── Connexion.css            # Styles de la page de connexion
│
├── AnalyseProfesseur.html   # Tableau de bord professeur
├── AnalyseProfesseur.css    # Styles du tableau de bord professeur
│
├── AnalyseEleve.html        # Tableau de bord élève
├── AnalyseEleve.css         # Styles du tableau de bord élève
│
├── Historique.html          # Page historique (élève)
│
├── download/
│   └── mosea.apk            # Fichier APK Android (à placer manuellement)
│
└── src/
    ├── config.js            # Constantes globales (URL Supabase, noms tables/colonnes, axes)
    ├── supabase.js          # Initialisation du client Supabase
    ├── auth.js              # Authentification nom/prénom, rate limiting, session
    ├── login.js             # Logique du formulaire de connexion
    ├── professeur.js        # Logique de la page AnalyseProfesseur
    ├── eleve.js             # Logique de la page AnalyseEleve
    └── utils/
        ├── format.js        # Fonctions utilitaires (nomComplet, formatDate, capitaliser…)
        └── chart.js         # Génération des graphes SVG (axes, ticks, polylines)
```

---

## Fonctionnalités

### Page d'accueil (`index.html`)
- Présentation du projet et de la méthode ISA.
- Section téléchargement avec **QR code fonctionnel** généré dynamiquement (librairie `qrcodejs`) pointant vers `download/mosea.apk`.
- Bouton de téléchargement direct de l'APK.

### Page de connexion (`Connexion.html`)
- Connexion par **Nom / Prénom** + mot de passe.
- Sélection du rôle (Professeur / Élève) et du mode (Éducation / Aviation).
- **Rate limiting** : blocage de 30 secondes après 5 échecs consécutifs.
- Redirection automatique vers le tableau de bord correspondant au rôle.

### Tableau de bord professeur (`AnalyseProfesseur.html`)
- Affichage des sessions créées par le professeur connecté.
- Liste des élèves liés à une session.
- Statistiques agrégées (min, max, moyenne) par élève ou globalement.
- Graphes SVG par type de mesure (Subjectif / Objectif).
- Suppression d'une session ou du compte (avec cascade en base).

### Tableau de bord élève (`AnalyseEleve.html`)
- Historique des sessions de l'élève connecté, triées par date.
- Visualisation des données (valeurs, durée, heure, date).
- Graphe SVG de la mesure (subjectif : axe 0–5 ; objectif : axe 0–220 BPM).
- Suppression du compte.

---

## Base de données (Supabase)

| Table | Description |
|---|---|
| `eleve` | Comptes élèves (ideleve, nom, prenom, mode, mdp) |
| `professeur` | Comptes professeurs (idprofesseur, nom, prenom, mode, mdp) |
| `SessionEleve` | Sessions de mesure d'un élève (idEleve, typemesure, datamesure, duree, heur, date, link) |
| `SessionProfesseur` | Sessions créées par un professeur (idprofesseur, linksession, listeeleve, Date, Heure, sujet) |

> **Attention au casing** : `idEleve` (camelCase), `Date` et `Heure` (majuscule initiale), toutes les autres colonnes en minuscules.

---

## Déploiement (GitHub Pages)

Le site est synchronisé depuis le dépôt SVN (forge académique) vers GitHub via `rsync` :

```bash
# 1. Synchroniser SVN → dossier Git (en excluant les métadonnées SVN)
rsync -av --exclude='.svn' /home/kirma/Documents/L2U1_svn/ /chemin/vers/repo-git/

# 2. Pousser vers GitHub Pages
cd /chemin/vers/repo-git/
git add .
git commit -m "mise à jour"
git push
```

---

## Notes techniques

- **Pas de framework** : JavaScript vanilla pur, compatible avec tous les navigateurs modernes.
- **QR code** : généré via [`qrcodejs`](https://github.com/davidshimjs/qrcodejs) (CDN jsDelivr). Pointe vers l'URL absolue de `download/mosea.apk`.
- **Graphes** : SVG pur généré dynamiquement. L'axe X s'adapte automatiquement à la durée réelle de la session (affichage en secondes pour < 2 min, en minutes sinon).
- **Authentification** : session stockée dans `sessionStorage` (effacée à la fermeture du navigateur).
- **Sécurité** : clé Supabase `anon` publique (Row Level Security à configurer côté Supabase).

---

## Lancer en local

Aucune installation requise. Ouvrir directement `index.html` dans un navigateur, ou utiliser un serveur local simple :

```bash
# Python 3
python3 -m http.server 8080
# puis ouvrir http://localhost:8080
```

---

*Ce README a été généré avec assistance IA (Claude, Anthropic).*
