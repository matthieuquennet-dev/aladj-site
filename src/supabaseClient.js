import { createClient } from "@supabase/supabase-js";

/* =============================================================================
   Connexion à Supabase
   -----------------------------------------------------------------------------
   Renseignez ces deux valeurs depuis votre projet Supabase :
   Dashboard → Project Settings → API
     • Project URL      → VITE_SUPABASE_URL
     • anon public key  → VITE_SUPABASE_ANON_KEY

   En local : créez un fichier ".env" à la racine avec :
     VITE_SUPABASE_URL=https://xxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGci...

   Sur Vercel : Settings → Environment Variables (mêmes deux clés).
   ============================================================================= */

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.warn(
    "[ALADJ] Variables Supabase manquantes. Renseignez VITE_SUPABASE_URL et " +
    "VITE_SUPABASE_ANON_KEY dans votre fichier .env (local) ou dans Vercel."
  );
}

export const supabase = createClient(URL || "https://placeholder.supabase.co", KEY || "placeholder");
export const isConfigured = Boolean(URL && KEY);
