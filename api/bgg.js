// =============================================================================
// Route serverless : relais vers BoardGameGeek
// Appelée par le site en /api/bgg?action=search&query=... ou ?action=thing&id=...
// Évite le blocage CORS du navigateur en faisant l'appel côté serveur.
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

  try {
    // BGG répond parfois 202 le temps de préparer la donnée : on réessaie.
    let xml = "";
    for (let attempt = 0; attempt < 4; attempt++) {
      const r = await fetch(url, { headers: { "User-Agent": "ALADJ-ludotheque" } });
      if (r.status === 200) { xml = await r.text(); break; }
      if (r.status === 202) { await new Promise((s) => setTimeout(s, 800)); continue; }
      res.status(r.status).send("Erreur BoardGameGeek");
      return;
    }
    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
    res.status(200).send(xml || "<items/>");
  } catch (e) {
    res.status(502).send("BoardGameGeek injoignable.");
  }
}
