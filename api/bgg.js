// =============================================================================
// Route serverless : relais vers BoardGameGeek
// Appelée par le site en /api/bgg?action=search&query=... ou ?action=thing&id=...
// Se présente comme un vrai navigateur pour éviter le blocage de BGG.
// =============================================================================
export default async function handler(req, res) {
  const { action, query, id } = req.query;

  let url;
  if (action === "search") {
    url = `https://boardgamegeek.com/xmlapi2/search?type=boardgame&query=${encodeURIComponent(query || "")}`;
  } else if (action === "thing") {
    url = `https://boardgamegeek.com/xmlapi2/thing?id=${encodeURIComponent(id || "")}&stats=1`;
  } else {
    res.status(400).send("Paramètre 'action' invalide (search|thing).");
    return;
  }

  // En-têtes imitant un vrai navigateur (BGG bloque les requêtes "robots").
  const browserHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
  };

  try {
    let xml = "";
    let lastStatus = 0;
    // BGG répond parfois 202 (donnée en préparation) ou throttle : on réessaie plusieurs fois.
    for (let attempt = 0; attempt < 6; attempt++) {
      const r = await fetch(url, { headers: browserHeaders });
      lastStatus = r.status;
      if (r.status === 200) {
        const text = await r.text();
        // BGG renvoie parfois 200 avec un corps vide le temps de préparer : on patiente.
        if (text && text.trim().length > 20) { xml = text; break; }
        await new Promise((s) => setTimeout(s, 700));
        continue;
      }
      if (r.status === 202 || r.status === 429) {
        await new Promise((s) => setTimeout(s, 900));
        continue;
      }
      // autre code : on tente encore une fois après une pause, sinon on sort
      await new Promise((s) => setTimeout(s, 600));
    }

    if (!xml) {
      res.status(502).send(`BoardGameGeek a répondu ${lastStatus || "sans contenu"}. Réessayez dans un instant.`);
      return;
    }

    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(xml);
  } catch (e) {
    res.status(502).send("BoardGameGeek injoignable.");
  }
}
