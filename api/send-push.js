/* =====================================================================
 *  ALADJ — Envoi des notifications push (fonction serverless Vercel)
 *  À placer dans  api/send-push.js
 *
 *  Déclenchée par un "Database Webhook" Supabase sur INSERT de la table
 *  notifications. Pour chaque nouvelle notif, on envoie un push à tous
 *  les appareils abonnés du destinataire.
 *
 *  Variables d'environnement Vercel à définir :
 *    SUPABASE_URL                = https://<ref>.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY   = (clé service_role, secrète)
 *    VAPID_PUBLIC_KEY            = (clé publique VAPID)
 *    VAPID_PRIVATE_KEY          = (clé privée VAPID, secrète)
 *    PUSH_WEBHOOK_SECRET        = (chaîne secrète partagée avec le webhook)
 * ===================================================================== */

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  'mailto:aladj50200@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Sécurité : le webhook Supabase doit envoyer ce secret en en-tête
  if (process.env.PUSH_WEBHOOK_SECRET &&
      req.headers['x-webhook-secret'] !== process.env.PUSH_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const rec = body.record || body; // payload Supabase : { record: {...} }
    const recipientId = rec.recipient_id;
    if (!recipientId) return res.status(400).json({ error: 'recipient_id manquant' });

    // URL cible selon le lien de la notif (le client lit ?page=... au chargement)
    let url = '/?page=ma-ludo';
    if (rec.link_kind === 'event') url = '/?page=soirees';
    else if (rec.link_kind === 'game') url = '/?page=ludotheque';

    // Abonnements de ce destinataire
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id,endpoint,p256dh,auth')
      .eq('user_id', recipientId);
    if (!subs || subs.length === 0) return res.status(200).json({ sent: 0 });

    // Compteur de notifs non lues -> pastille d'icône
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', recipientId)
      .eq('read', false);

    const payload = JSON.stringify({
      title: 'ALADJ',
      body: rec.message || 'Nouvelle notification',
      url,
      count: count || 0,
      tag: 'aladj-notif',
    });

    let sent = 0;
    await Promise.all(subs.map(async (s) => {
      const subscription = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
      try {
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err) {
        // 404/410 = abonnement expiré -> on le retire
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          await supabase.from('push_subscriptions').delete().eq('id', s.id);
        }
      }
    }));

    return res.status(200).json({ sent });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
