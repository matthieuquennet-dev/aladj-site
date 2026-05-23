# ALADJ — À l'assaut des jeux

Site de l'association de jeux de société du Coutançais (Gouville-sur-Mer / Coutances, Manche).

Application React + Supabase : page d'accueil, agenda des soirées (calendrier avec statut rouge/vert selon le quorum), ludothèque partagée avec notation et classements, espace membre personnel avec export Excel, import depuis BoardGameGeek avec traduction automatique en français.

## 🚀 Installation

**Vous débutez ?** Suivez le **`GUIDE-INSTALLATION.md`** : il détaille tout pas à pas (Supabase + GitHub + Vercel), sans connaissances techniques requises. ~30-45 min.

## 🧑‍💻 Pour développeurs — démarrage rapide

```bash
npm install
cp .env.example .env     # puis renseignez vos clés Supabase
npm run dev
```

Avant le premier lancement : exécutez **`supabase-schema.sql`** dans l'éditeur SQL de votre projet Supabase pour créer les tables.

## 📁 Structure

```
src/
  App.jsx            Toute l'application (interface + logique)
  supabaseClient.js  Connexion à Supabase
  main.jsx           Point d'entrée
api/
  bgg.js             Relais BoardGameGeek (contourne CORS)
  translate.js       Traduction EN→FR
supabase-schema.sql  Création des tables + sécurité
```

## 🔑 Variables d'environnement

| Variable | Où la trouver |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |

## 🛠️ Stack

React 18 · Vite · Supabase (base de données + authentification + temps réel) · lucide-react (icônes) · SheetJS/xlsx (export Excel) · fonctions serverless Vercel.
