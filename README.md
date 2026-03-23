# Mosea Analyse

Plateforme web de visualisation de la **charge mentale**, conçue pour les domaines de l'**Éducation** et de l'**Aviation**.

Les données sont collectées depuis l'application mobile Mosea, puis consultables ici par les professeurs et les élèves sous forme de graphes et de statistiques.

---

## Présentation

Mosea Analyse permet de :

- Consulter les sessions de mesure de charge mentale archivées
- Visualiser les données sous forme de courbes (mode Subjectif 0–5 ou Objectif 0–220)
- Comparer les profils de tous les élèves d'une session (vue professeur)
- Accéder à son historique personnel (vue élève)

---

## Structure du projet

```
mosea-analyse/
│
├── public/                        # Pages HTML et styles
│   ├── landing.html               # Page d'accueil
│   ├── landing.css
│   ├── index.html                 # Page de connexion
│   ├── index.css
│   ├── indexEleve.html            # Tableau de bord élève
│   ├── indexEleve.css
│   ├── indexProfesseur.html       # Tableau de bord professeur
│   ├── indexProfesseur.css
│   └── favicon.svg
│
├── src/                           # Logique JavaScript
│   ├── config.js                  # Constantes centralisées (tables, axes, couleurs)
│   ├── supabase.js                # Client Supabase (singleton)
│   ├── auth.js                    # Connexion, déconnexion, rate limiting
│   ├── eleve.js                   # Logique page élève
│   ├── professeur.js              # Logique page professeur
│   └── utils/
│       ├── guard.js               # Protection des pages (vérif. session)
│       ├── chart.js               # Construction des graphes SVG
│       └── format.js              # Formatage dates, heures, noms
│
├── .env                           # Variables secrètes (non commité)
├── .env.example                   # Modèle de configuration (commité)
├── .gitignore
└── README.md
```

---

## Prérequis

- Un navigateur moderne (Chrome, Firefox, Safari, Edge)
- Un compte [Supabase](https://supabase.com) avec les tables configurées
- Node.js 18+ (uniquement si tu utilises Vite pour le build)

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/ton-compte/mosea-analyse.git
cd mosea-analyse
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Ouvrir `.env` et renseigner les valeurs :

```
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_ANON_KEY=ta_cle_anon
```

Ces valeurs se trouvent dans le dashboard Supabase :
**Project Settings → API → Project URL & anon key**

### 3a. Lancer sans outil de build (HTML pur)

Ouvrir `public/landing.html` directement dans un navigateur,
ou utiliser l'extension **Live Server** dans VS Code.

> ⚠️ Sans Vite, les variables `import.meta.env` ne fonctionnent pas.
> Dans ce cas, renseigner les clés directement dans `src/config.js`
> et ne jamais commiter ce fichier.

### 3b. Lancer avec Vite (recommandé)

```bash
npm install
npm run dev
```

L'application est accessible sur `http://localhost:5173`.

---

## Déploiement

### Netlify (recommandé, gratuit)

1. Connecter le dépôt GitHub sur [app.netlify.com](https://app.netlify.com)
2. Renseigner les variables d'environnement dans :
   **Site Settings → Environment Variables**
3. Ajouter un fichier `netlify.toml` à la racine :

```toml
[build]
  publish = "public"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

### Vercel

1. Connecter le dépôt sur [vercel.com](https://vercel.com)
2. Renseigner les variables dans :
   **Project Settings → Environment Variables**

---

## Rôles et accès

| Rôle | Page | Accès |
|---|---|---|
| **Professeur** | `indexProfesseur.html` | Toutes les sessions de sa classe, vue agrégée de tous les élèves |
| **Élève** | `indexEleve.html` | Ses propres sessions uniquement |

La page de connexion (`index.html`) redirige automatiquement vers la bonne page selon le rôle sélectionné.

---

## Base de données Supabase

### Tables utilisées

| Table | Description |
|---|---|
| `eleve` | Comptes élèves (nom, prénom, mode, mdp) |
| `professeur` | Comptes professeurs |
| `SessionEleve` | Sessions de mesure des élèves |
| `SessionProfesseur` | Sessions créées par les professeurs |

### Activer le Row Level Security (RLS)

> **Important** — À faire dans Supabase Dashboard avant toute mise en production.

Dans **Table Editor → chaque table → RLS → Enable**, puis ajouter les policies
décrites dans `GUIDE_SECURITE.md`.

---

## Modes de mesure

| Mode | Échelle | Description |
|---|---|---|
| **Subjectif** | 0 – 5 | Auto-évaluation de la charge ressentie |
| **Objectif** | 0 – 220 | Données physiologiques (fréquence cardiaque, etc.) |

---

## Contribuer

1. Créer une branche : `git checkout -b feature/ma-fonctionnalite`
2. Commiter les changements : `git commit -m "feat: description"`
3. Pousser la branche : `git push origin feature/ma-fonctionnalite`
4. Ouvrir une Pull Request

---

## Licence

Projet privé — tous droits réservés.
