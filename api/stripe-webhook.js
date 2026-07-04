/* =====================================================================
 *  ALADJ — Webhook Stripe (fonction Vercel)
 *  À placer dans  api/stripe-webhook.js
 *
 *  Stripe appelle cette adresse quand un paiement de cotisation aboutit :
 *  le statut de membre décisionnaire est alors accordé (+365 jours,
 *  cumulés au restant) et l'e-mail de remerciement est envoyé.
 *
 *  Variables d'environnement Vercel :
 *    STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (whsec_..., voir notice)
 *    + SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GMAIL_* (déjà en place)
 * ===================================================================== */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { grantMembership, thankYouEmailHtml, mailer, frDate } from './membership.js';

// Stripe exige le corps BRUT de la requête pour vérifier la signature.
export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') { res.status(405).send('Méthode non autorisée'); return; }
    for (const v of ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
      if (!process.env[v]) { res.status(500).send('Config manquante : ' + v); return; }
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const raw = await readRawBody(req);
    let event;
    try {
      event = stripe.webhooks.constructEvent(raw, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
    } catch (e) {
      res.status(400).send('Signature invalide : ' + e.message);
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata && session.metadata.user_id;
      if (userId && session.payment_status === 'paid') {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { name, until } = await grantMembership(supabase, userId);
        const email = session.customer_details && session.customer_details.email;
        if (email && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
          try {
            await mailer().sendMail({
              from: `"ALADJ" <${process.env.GMAIL_USER}>`,
              to: email,
              subject: `👑 Bienvenue parmi les membres décisionnaires, ${name} !`,
              html: thankYouEmailHtml(name, frDate(until), false),
            });
          } catch (e) { /* l'e-mail ne doit pas faire échouer le webhook */ }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (e) {
    res.status(500).send('Erreur webhook : ' + (e && e.message ? e.message : String(e)));
  }
}
