// =============================================================================
// Fonction serverless Vercel : upload d'une image vers Cloudflare R2
// Reçoit une image (base64 ou URL externe), la pousse dans le bucket R2,
// et renvoie l'URL publique. Les clés R2 restent côté serveur (jamais exposées).
//
// Variables d'environnement attendues (à définir dans Vercel) :
//   R2_ACCOUNT_ID        : l'identifiant de compte Cloudflare
//   R2_ACCESS_KEY_ID     : Access Key ID du token R2
//   R2_SECRET_ACCESS_KEY : Secret Access Key du token R2
//   R2_BUCKET            : nom du bucket (ex : aladj-images)
//   R2_PUBLIC_URL        : URL publique r2.dev (ex : https://pub-xxxx.r2.dev)
// =============================================================================

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET;
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, ""); // sans slash final

function extFromMime(mime) {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

// Télécharge une URL externe et renvoie { buffer, contentType } ; null si échec.
async function fetchExternal(url) {
  const tries = [
    url,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
  ];
  for (const u of tries) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(u, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") || "image/jpeg";
      if (!contentType.startsWith("image/")) continue;
      const arrayBuf = await res.arrayBuffer();
      return { buffer: Buffer.from(arrayBuf), contentType };
    } catch (e) { /* on tente la voie suivante */ }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }
  if (!BUCKET || !PUBLIC_URL || !process.env.R2_ACCOUNT_ID) {
    return res.status(500).json({ error: "Configuration R2 manquante côté serveur" });
  }

  try {
    const { image, folder = "games" } = req.body || {};
    if (!image) return res.status(400).json({ error: "Aucune image fournie" });

    // Si l'image est déjà sur notre R2, on ne refait rien.
    if (typeof image === "string" && image.startsWith(PUBLIC_URL)) {
      return res.status(200).json({ url: image });
    }

    let buffer = null;
    let contentType = "image/jpeg";

    if (typeof image === "string" && image.startsWith("data:")) {
      // Cas base64 : data:image/xxx;base64,....
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return res.status(400).json({ error: "Format base64 invalide" });
      contentType = match[1];
      buffer = Buffer.from(match[2], "base64");
    } else if (typeof image === "string" && /^https?:\/\//i.test(image)) {
      // Cas URL externe (BGG, ancien Supabase Storage, etc.) : on télécharge.
      const fetched = await fetchExternal(image);
      if (!fetched) {
        // On renvoie l'URL d'origine pour ne pas casser l'affichage.
        return res.status(200).json({ url: image, warning: "Téléchargement impossible, URL conservée" });
      }
      buffer = fetched.buffer;
      contentType = fetched.contentType;
    } else {
      return res.status(400).json({ error: "Format d'image non reconnu" });
    }

    // Garde-fou taille : 10 Mo max (R2 accepte beaucoup plus, mais on borne par prudence)
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(413).json({ error: "Image trop volumineuse (>10 Mo)" });
    }

    const ext = extFromMime(contentType);
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable", // cache 1 an (egress R2 gratuit de toute façon)
    }));

    return res.status(200).json({ url: `${PUBLIC_URL}/${key}` });
  } catch (e) {
    console.error("Erreur upload R2 :", e);
    return res.status(500).json({ error: "Échec de l'upload vers R2" });
  }
}
