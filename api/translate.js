// =============================================================================
// Route serverless : traduction anglais → français
// Appelée par le site en POST /api/translate  { text: "..." }
// Utilise l'API gratuite MyMemory (sans clé). Traduit par tranches.
// =============================================================================
async function translateChunk(text) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`;
  const r = await fetch(url);
  const data = await r.json();
  const t = data?.responseData?.translatedText;
  if (t && !/MYMEMORY WARNING|INVALID|QUOTA/i.test(t)) return t;
  return text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).send("Méthode non autorisée"); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const text = (body?.text || "").toString();
  if (!text) { res.status(200).json({ translated: "" }); return; }

  try {
    // découpe en tranches de ~480 caractères en respectant les phrases
    const chunks = [];
    let buf = "";
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      if ((buf + sentence).length > 480) { if (buf) chunks.push(buf); buf = sentence; }
      else buf += (buf ? " " : "") + sentence;
    }
    if (buf) chunks.push(buf);

    const translated = [];
    for (const c of chunks.slice(0, 6)) translated.push(await translateChunk(c));
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    res.status(200).json({ translated: translated.join(" ") });
  } catch (e) {
    res.status(200).json({ translated: text }); // repli : texte original
  }
}
