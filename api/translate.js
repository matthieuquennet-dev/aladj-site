// =============================================================================
// Route serverless : traduction anglais -> francais
// Appelee par le site en POST /api/translate  { text: "..." }
// Reponse : { translated, provider, warning? }
//
// 1) DeepL (cle personnelle, quota reserve a l'association) - voie principale
// 2) MyMemory en secours (quota partage entre tous les sites Vercel)
// 3) a defaut, le texte d'origine : l'apercu du jeu ne doit jamais bloquer.
//
// DIAGNOSTIC : ouvrir https://aladj.fr/api/translate?diag=1 dans un navigateur.
// La page dit si la cle DeepL est trouvee, si DeepL l'accepte, le quota
// consomme ce mois-ci, et le resultat d'un essai de traduction. La cle
// elle-meme n'est jamais affichee.
//
// Novembre 2025 / janvier 2026 : DeepL refuse desormais toute cle passee en
// parametre (auth_key=...) ou par GET. La cle part donc UNIQUEMENT dans
// l'en-tete Authorization, la requete est un POST en JSON.
// =============================================================================

// Nom de la variable Vercel : on accepte les variantes deja rencontrees.
function deeplKey() {
  return (process.env.DEEPL_API_KEY || process.env.DEEPL_AUTH_KEY || process.env.DEEPL_KEY || "").trim();
}
// Les cles du plan gratuit finissent par ":fx" et ont leur propre serveur.
function deeplBase(key) {
  return /:fx$/.test(key) ? "https://api-free.deepl.com" : "https://api.deepl.com";
}

// Messages lisibles pour les codes d'erreur de DeepL.
const DEEPL_ERRORS = {
  400: "requete refusee par DeepL (parametres)",
  401: "cle DeepL inconnue ou revoquee",
  403: "cle DeepL refusee (mauvaise cle, ou cle gratuite envoyee au serveur payant)",
  413: "texte trop long pour DeepL",
  429: "trop de requetes DeepL en meme temps",
  456: "quota DeepL du mois epuise",
  500: "DeepL en panne",
  503: "DeepL indisponible",
};

async function withTimeout(promise, ms) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error("timeout")), ms); });
  try { return await Promise.race([promise, timer]); } finally { clearTimeout(t); }
}

async function translateDeepL(text) {
  const key = deeplKey();
  if (!key) return { ok: false, reason: "aucune cle DeepL dans les variables Vercel" };
  const r = await withTimeout(fetch(`${deeplBase(key)}/v2/translate`, {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${key}`,
      "Content-Type": "application/json",
      "User-Agent": "ALADJ-ludotheque/1.0",
    },
    body: JSON.stringify({ text: [text], target_lang: "FR", preserve_formatting: true }),
  }), 6500);
  if (!r.ok) {
    let detail = "";
    try { detail = (await r.text()).slice(0, 200); } catch (e) { /* rien */ }
    return { ok: false, status: r.status, reason: DEEPL_ERRORS[r.status] || `erreur DeepL ${r.status}`, detail };
  }
  const data = await r.json();
  const tr = data && data.translations && data.translations[0];
  if (!tr || !tr.text) return { ok: false, reason: "reponse DeepL vide" };
  return { ok: true, text: tr.text, source: tr.detected_source_language || null };
}

// MyMemory : 500 octets maximum par appel, d'ou le decoupage par phrases.
function chunkText(text, max = 450) {
  const chunks = [];
  let buf = "";
  for (const para of text.split(/\n/)) {
    for (const sentence of para.split(/(?<=[.!?])\s+/)) {
      if (!sentence) continue;
      if ((buf + " " + sentence).length > max) {
        if (buf) chunks.push(buf);
        buf = sentence.length > max ? sentence.slice(0, max) : sentence;
      } else buf += (buf ? " " : "") + sentence;
    }
    buf += "\n";
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.map((c) => c.trim()).filter(Boolean);
}

async function translateMyMemory(text) {
  const email = (process.env.MYMEMORY_EMAIL || "aladj50200@gmail.com").trim();
  const out = [];
  for (const c of chunkText(text).slice(0, 8)) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(c)}&langpair=en|fr`
      + (email ? `&de=${encodeURIComponent(email)}` : "");
    const r = await withTimeout(fetch(url), 4000);
    if (!r.ok) return { ok: false, reason: `MyMemory ${r.status}` };
    const data = await r.json();
    const t = data && data.responseData && data.responseData.translatedText;
    if (!t || Number(data.responseStatus) !== 200 || /MYMEMORY WARNING|INVALID|QUOTA/i.test(t)) {
      return { ok: false, reason: "quota MyMemory epuise ou refus" };
    }
    out.push(t);
  }
  return out.length ? { ok: true, text: out.join(" ") } : { ok: false, reason: "rien a traduire" };
}

async function diagnostic(res) {
  const key = deeplKey();
  const report = {
    cle_deepl_trouvee: !!key,
    type_de_cle: key ? (/:fx$/.test(key) ? "gratuite (:fx)" : "payante") : null,
    serveur_deepl: key ? deeplBase(key) : null,
  };
  if (key) {
    try {
      const u = await withTimeout(fetch(`${deeplBase(key)}/v2/usage`, {
        headers: { "Authorization": `DeepL-Auth-Key ${key}` },
      }), 6000);
      if (u.ok) {
        const d = await u.json();
        report.quota_deepl = `${d.character_count} / ${d.character_limit} caracteres ce mois-ci`;
        report.quota_epuise = d.character_count >= d.character_limit;
      } else {
        report.quota_deepl = DEEPL_ERRORS[u.status] || `erreur ${u.status}`;
      }
    } catch (e) { report.quota_deepl = "DeepL injoignable : " + e.message; }
  }
  const sample = "A cooperative card game where players build a deck together.";
  try { report.essai_deepl = await translateDeepL(sample); } catch (e) { report.essai_deepl = { ok: false, reason: e.message }; }
  try { report.essai_mymemory = await translateMyMemory(sample); } catch (e) { report.essai_mymemory = { ok: false, reason: e.message }; }
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json(report);
}

export default async function handler(req, res) {
  if (req.method === "GET" && req.query && req.query.diag) return diagnostic(res);
  if (req.method !== "POST") { res.status(405).json({ error: "Methode non autorisee" }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const text = String((body && body.text) || "").slice(0, 5000);
  if (!text.trim()) { res.status(200).json({ translated: "", provider: "none" }); return; }

  const warnings = [];
  try {
    const d = await translateDeepL(text);
    if (d.ok) {
      // Une description deja en francais revient telle quelle.
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
      res.status(200).json({ translated: d.source === "FR" ? text : d.text, provider: "deepl" });
      return;
    }
    warnings.push(d.reason);
    console.error("[translate] DeepL :", d.status || "", d.reason, d.detail || "");
  } catch (e) {
    warnings.push("DeepL : " + e.message);
    console.error("[translate] DeepL exception :", e);
  }

  try {
    const m = await translateMyMemory(text);
    if (m.ok) {
      res.status(200).json({ translated: m.text, provider: "mymemory", warning: warnings.join(" ; ") });
      return;
    }
    warnings.push(m.reason);
  } catch (e) { warnings.push("MyMemory : " + e.message); }

  console.error("[translate] echec total :", warnings.join(" ; "));
  // Pas de cache : le prochain essai doit retenter pour de vrai.
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ translated: text, provider: "none", warning: warnings.join(" ; ") });
}
