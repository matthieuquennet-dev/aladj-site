# Guide d'installation — Site ALADJ

Ce guide vous accompagne pas à pas pour mettre votre site en ligne, **même sans connaissances techniques**. Comptez environ **30 à 45 minutes** la première fois.

Vous allez faire trois choses :

1. Créer la base de données (Supabase) — c'est gratuit.
2. Mettre le code sur GitHub.
3. Publier le site sur Vercel — gratuit aussi.

Tout est gratuit pour une association de votre taille. Aucune carte bancaire n'est demandée.

---

## Étape 1 — Créer la base de données Supabase

La base de données, c'est l'endroit où vivront les comptes des membres, les jeux, les notes et les soirées.

### 1.1 — Créer le compte et le projet

1. Allez sur **https://supabase.com** et cliquez sur **Start your project**.
2. Connectez-vous (le plus simple : avec votre compte GitHub, qu'on créera de toute façon à l'étape 2 — vous pouvez aussi utiliser un e-mail).
3. Cliquez **New project**.
4. Remplissez :
   - **Name** : `aladj`
   - **Database Password** : cliquez sur *Generate a password* et **copiez-le quelque part en sécurité** (vous n'en aurez pas besoin au quotidien, mais gardez-le).
   - **Region** : choisissez **West EU (Paris)** ou **Central EU (Frankfurt)** — au plus proche.
5. Cliquez **Create new project**. Patientez 1 à 2 minutes le temps que la base se prépare.

### 1.2 — Créer les tables

1. Dans le menu de gauche, cliquez sur l'icône **SQL Editor** (un symbole `>_`).
2. Cliquez **New query**.
3. Ouvrez le fichier **`supabase-schema.sql`** fourni, copiez **tout** son contenu, et collez-le dans la zone de texte.
4. Cliquez **Run** (en bas à droite). Vous devez voir *Success. No rows returned*. C'est bon, vos tables sont créées et sécurisées.

### 1.3 — Récupérer vos deux clés

1. Menu de gauche : **Project Settings** (l'engrenage tout en bas) → **API**.
2. Notez ces deux valeurs (gardez l'onglet ouvert, on s'en sert à l'étape 3) :
   - **Project URL** — ressemble à `https://abcdefgh.supabase.co`
   - **Project API keys → `anon` `public`** — une longue suite de caractères commençant par `eyJ...`

> La clé `anon public` est conçue pour être utilisée côté site web : elle est sans danger à publier. Ne partagez jamais en revanche la clé `service_role`.

### 1.4 — (Recommandé) Simplifier l'inscription

Par défaut, Supabase envoie un e-mail de confirmation à chaque inscription. Pour une petite association, c'est souvent plus simple de le désactiver :

1. Menu **Authentication** → **Sign In / Providers** → **Email**.
2. Désactivez **Confirm email**.
3. Enregistrez.

Ainsi, un nouveau membre est connecté immédiatement après son inscription, sans devoir cliquer dans un e-mail. (Si vous laissez l'option activée, le site gère les deux cas correctement.)

---

## Étape 2 — Mettre le code sur GitHub

GitHub héberge le code. Vercel ira ensuite y piocher pour publier le site.

1. Créez un compte sur **https://github.com** si vous n'en avez pas.
2. Cliquez le **+** en haut à droite → **New repository**.
   - **Repository name** : `aladj-site`
   - Laissez en **Private** (ou Public, comme vous préférez).
   - Cliquez **Create repository**.
3. Maintenant il faut envoyer les fichiers du projet. Le plus simple sans ligne de commande :
   - Sur la page du dépôt vide, cliquez **uploading an existing file**.
   - Glissez-déposez **tout le contenu** du dossier du projet (les dossiers `src`, `api`, et les fichiers `package.json`, `index.html`, `vite.config.js`, `supabase-schema.sql`, `.gitignore`, `.env.example`).
   - **Ne déposez PAS** le dossier `node_modules` ni un éventuel fichier `.env` (ils ne doivent jamais être publiés).
   - En bas, cliquez **Commit changes**.

> Astuce : si vous êtes à l'aise avec l'outil **GitHub Desktop** (gratuit, sans ligne de commande), c'est encore plus simple pour les mises à jour futures.

---

## Étape 3 — Publier le site sur Vercel

1. Allez sur **https://vercel.com** et cliquez **Sign Up** → connectez-vous **avec GitHub** (le plus simple).
2. Cliquez **Add New… → Project**.
3. Vercel affiche vos dépôts GitHub. À côté de **`aladj-site`**, cliquez **Import**.
4. Sur l'écran de configuration, Vercel détecte tout seul que c'est un projet Vite — ne touchez à rien dans *Build & Output*.
5. Dépliez la section **Environment Variables** et ajoutez vos **deux clés Supabase** (celles de l'étape 1.3) :

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | votre Project URL (`https://....supabase.co`) |
   | `VITE_SUPABASE_ANON_KEY` | votre clé `anon public` (`eyJ...`) |

   Tapez le **Name** exactement comme ci-dessus (sensible aux majuscules), collez la valeur, cliquez **Add** pour chacune.
6. Cliquez **Deploy**. Patientez 1 à 2 minutes.
7. 🎉 Vercel affiche **Congratulations** avec un lien du type `https://aladj-site.vercel.app`. C'est votre site en ligne !

---

## Et voilà !

Votre site est en ligne. Testez-le :

- Cliquez **Adhérer**, créez un compte avec votre e-mail.
- Ajoutez un jeu (essayez l'import BoardGameGeek : tapez « Wingspan » par exemple).
- Notez-le, créez une soirée, exportez votre ludothèque en Excel.
- Demandez à un autre membre de créer son compte : vous verrez ses jeux apparaître chez vous. C'est ça, la base partagée !

### Se nommer administrateur

Pour pouvoir gérer (supprimer) les soirées et jeux des autres en cas de besoin :

1. Dans Supabase → **Table Editor** → table **`profiles`**.
2. Trouvez votre ligne, mettez la colonne **`is_admin`** à **`true`**, enregistrez.

### Mettre à jour le site plus tard

Toute modification du code se fait via GitHub : dès que vous mettez à jour un fichier sur GitHub, Vercel republie le site automatiquement en 1 à 2 minutes. Vos données (membres, jeux…) ne sont pas affectées : elles vivent dans Supabase, séparément.

### Un nom de domaine personnalisé (optionnel)

Si vous avez ou achetez un domaine (ex. `aladj.fr`), vous pouvez le brancher dans Vercel → votre projet → **Settings → Domains**.

---

## En cas de souci

- **Le site affiche « Connexion à Supabase requise »** : les deux variables d'environnement ne sont pas (bien) renseignées dans Vercel. Vérifiez les noms exacts (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), puis dans Vercel → Deployments → **Redeploy**.
- **« E-mail ou mot de passe incorrect » alors que tout est bon** : si vous avez laissé la confirmation d'e-mail activée (étape 1.4), il faut d'abord cliquer le lien reçu par mail avant de pouvoir se connecter.
- **L'import BoardGameGeek ne renvoie rien** : BGG est parfois lent ; réessayez. Le titre anglais fonctionne souvent mieux. La saisie manuelle reste toujours disponible.
- **Autre problème** : notez le message d'erreur exact et on pourra diagnostiquer.
