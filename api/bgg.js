// =============================================================================
// Route serverless : relais authentifié vers BoardGameGeek
// BGG exige désormais un jeton d'application (Authorization: Bearer ...).
// Le jeton est stocké dans la variable d'environnement BGG_APPLICATION_TOKEN.
// Appelée en /api/bgg?path=search&query=... ou /api/bgg?path=thing&id=...
// =============================================================================
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // On accepte "path" (nouveau) ET "action" (ancien) pour compatibilité.
    const { path, action, ...params } = req.query;
    const route = path || action;
    const allowed = ["search", "thing"];
    if (!route || !allowed.includes(route)) {
      return res.status(400).json({ error: "Invalid path" });
    }

    // On ne garde que les paramètres utiles pour BGG (query, id, type, stats...).
    delete params.path; delete params.action;
    const queryString = new URLSearchParams(params).toString();
    const bggUrl = `https://boardgamegeek.com/xmlapi2/${route}?${queryString}`;

    const rawToken = process.env.BGG_APPLICATION_TOKEN;
    const headers = {
      "User-Agent": "ALADJ/1.0",
      "Accept": "*/*",
    };
    // Si un jeton est configuré, on l'utilise (c'est ce que BGG exige).
    if (rawToken) {
      const token = rawToken.trim().replace(/^Bearer\s+/i, "");
      headers["Authorization"] = `Bearer ${token}`;
    }

    // BGG répond parfois 202 (donnée en préparation) : on réessaie.
    let xml = "";
    let lastStatus = 0;
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = await fetch(bggUrl, { headers });
      lastStatus = r.status;
      if (r.status === 200) {
        const t = await r.text();
        if (t && t.trim().length > 20) { xml = t; break; }
        await new Promise((s) => setTimeout(s, 700));
        continue;
      }
      if (r.status === 202 || r.status === 429) {
        await new Promise((s) => setTimeout(s, 900));
        continue;
      }
      // autre code (401, 403...) : on renvoie l'info
      return res.status(r.status).json({ error: `BGG a répondu ${r.status}` });
    }

    if (!xml) {
      return res.status(502).json({ error: `BGG sans contenu (${lastStatus}). Réessayez.` });
    }

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).send(xml);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Erreur interne" });
  }
}
