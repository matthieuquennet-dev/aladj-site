/* =====================================================================
 *  ALADJ — Cotisation membre décisionnaire (fonction Vercel)
 *  À placer dans  api/membership.js
 *
 *  Deux actions (POST, authentifié par le jeton de session Supabase) :
 *   - action "checkout" : crée une session de paiement Stripe (CB,
 *     Apple Pay, Google Pay, PayPal) et renvoie l'URL de paiement.
 *     Le statut est accordé par le webhook Stripe après paiement.
 *   - action "cash"     : engagement à régler en espèces → statut
 *     accordé immédiatement (+365 jours), e-mail de remerciement au
 *     membre + e-mail d'information au bureau (Gmail de l'association).
 *
 *  Variables d'environnement Vercel :
 *    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER,
 *    GMAIL_APP_PASSWORD (déjà en place) + STRIPE_SECRET_KEY (clé sk_...)
 * ===================================================================== */

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import Stripe from 'stripe';

const MEMBERSHIP_EUR = 20;        // cotisation annuelle
const MEMBERSHIP_DAYS = 365;      // durée accordée

/* E-mail de remerciement (commun aux deux modes de règlement). */
export function thankYouEmailHtml(name, untilDateFr, viaCash) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FBF7EF;">
  <div style="max-width:560px;margin:0 auto;padding:24px 14px;font-family:Arial,sans-serif;">
    <div style="text-align:center;color:#1A3A5C;font-weight:bold;font-size:20px;margin-bottom:12px;">ALADJ — À l'assaut des jeux</div>
    <div style="background:linear-gradient(140deg,#1A3A5C,#1E8A8A);border-radius:20px;padding:24px 22px;color:#fff;">
      <div style="text-align:center;font-size:30px;">👑</div>
      <div style="text-align:center;font-weight:bold;font-size:19px;margin-bottom:14px;">Merci ${name} !</div>
      <p style="font-size:14px;line-height:1.6;margin:0 0 12px;">
        Ta cotisation fait de toi un <b>membre décisionnaire</b> de l'ALADJ jusqu'au <b>${untilDateFr}</b>
        (chaque renouvellement ajoutera 365 jours à ce total).
      </p>
      ${viaCash ? `<p style="font-size:13px;line-height:1.6;margin:0 0 12px;background:rgba(255,255,255,.13);border-radius:10px;padding:10px 13px;">
        💶 Tu t'es engagé à régler <b>${MEMBERSHIP_EUR} € en espèces</b> auprès d'un membre du bureau — pense à le faire dès que possible. Le bureau a été prévenu.
      </p>` : ''}
      <p style="font-size:14px;line-height:1.6;margin:0 0 6px;"><b>Tes avantages :</b></p>
      <ul style="font-size:14px;line-height:1.7;margin:0 0 14px;padding-left:20px;">
        <li>Voix délibérative aux assemblées générales de l'association</li>
        <li>Le <b>pass Ludovore de Ludum.fr offert pendant un an</b> (voir ci-dessous)</li>
        <li>Les fonctionnalités du site réservées aux décisionnaires, au fil de leur arrivée</li>
        <li>La couronne dorée à côté de ton nom sur le site 👑</li>
      </ul>
      <div style="background:rgba(255,255,255,.13);border-radius:10px;padding:12px 14px;font-size:13.5px;line-height:1.7;">
        🎟️ <b>Ton pass Ludovore offert (1 an)</b> — pour l'obtenir :<br>
        1. Crée ton compte (ou connecte-toi) sur <b>Ludum.fr</b><br>
        2. Ajoute le <b>pass Ludovore 365 jours</b> à ton panier<br>
        3. Au moment du paiement, entre le code de l'association dans la zone « votre code promo » :
        <div style="text-align:center;margin:8px 0;"><span style="display:inline-block;background:#E8A317;color:#fff;font-weight:bold;font-size:16px;letter-spacing:2px;padding:7px 16px;border-radius:9px;">TC839J71</span></div>
        Le pass te donne : une <b>remise supplémentaire de 10&nbsp;%</b>, une <b>vente privée Ludovore</b>
        par an (le 12 avril, anniversaire de Ludum.fr), l'accès aux <b>LudoFlash</b> (chaque mois,
        une sélection de jeux avec remises boostées à 15&nbsp;%), et un <b>accès anticipé de 24&nbsp;h minimum</b>
        à toutes les promos (Soldes, Black Friday, Rescapés…).
      </div>
    </div>
    <div style="text-align:center;font-size:11px;color:#9c8d79;margin-top:14px;line-height:1.5;">
      ALADJ — aladj.fr · Rappel : la cotisation se règle uniquement en ligne ou en espèces.
    </div>
  </div></body></html>`;
}

/* Accorde N jours de statut (s'ajoutent au restant). Renvoie la date de fin. */
export async function grantMembership(supabase, userId) {
  const { data: prof, error } = await supabase
    .from('profiles').select('id,name,decideur_until').eq('id', userId).single();
  if (error || !prof) throw new Error('Profil introuvable');
  const now = new Date();
  const base = prof.decideur_until && new Date(prof.decideur_until) > now ? new Date(prof.decideur_until) : now;
  const until = new Date(base.getTime() + MEMBERSHIP_DAYS * 86400000);
  const { error: e2 } = await supabase
    .from('profiles').update({ decideur_until: until.toISOString(), role: 'decideur' }).eq('id', userId);
  if (e2) throw new Error('Mise à jour du statut impossible : ' + e2.message);
  return { name: prof.name, until };
}

export function mailer() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
}

export const frDate = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Méthode non autorisée' }); return; }
    for (const v of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GMAIL_USER', 'GMAIL_APP_PASSWORD']) {
      if (!process.env[v]) { res.status(500).json({ error: 'Config manquante : ' + v }); return; }
    }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Authentification : jeton de session Supabase envoyé par le site.
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) { res.status(401).json({ error: 'Connexion requise' }); return; }
    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData?.user) { res.status(401).json({ error: 'Session invalide — reconnectez-vous' }); return; }
    const user = userData.user;

    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const action = body.action;

    if (action === 'checkout') {
      if (!process.env.STRIPE_SECRET_KEY) { res.status(500).json({ error: 'Config manquante : STRIPE_SECRET_KEY' }); return; }
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: MEMBERSHIP_EUR * 100,
            product_data: {
              name: 'Cotisation ALADJ — membre décisionnaire (365 jours)',
              description: 'Association À l\'assaut des jeux — les 365 jours s\'ajoutent au statut restant.',
            },
          },
        }],
        metadata: { user_id: user.id },
        customer_email: user.email || undefined,
        success_url: 'https://aladj.fr/?page=ma-ludo&cotisation=ok',
        cancel_url: 'https://aladj.fr/?page=ma-ludo&cotisation=annule',
      });
      res.status(200).json({ url: session.url });
      return;
    }

    if (action === 'cash') {
      const { name, until } = await grantMembership(supabase, user.id);
      const t = mailer();
      // Remerciement au membre
      if (user.email) {
        await t.sendMail({
          from: `"ALADJ" <${process.env.GMAIL_USER}>`,
          to: user.email,
          subject: `👑 Bienvenue parmi les membres décisionnaires, ${name} !`,
          html: thankYouEmailHtml(name, frDate(until), true),
        });
      }
      // Information au bureau : engagement de règlement en espèces
      await t.sendMail({
        from: `"ALADJ site" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `💶 Cotisation en espèces à encaisser — ${name}`,
        html: `<p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
          <b>${name}</b>${user.email ? ` (${user.email})` : ''} vient de s'engager sur aladj.fr à régler sa cotisation
          de <b>${MEMBERSHIP_EUR} € en espèces</b> auprès d'un membre du bureau.<br>
          Son statut de membre décisionnaire est actif jusqu'au <b>${frDate(until)}</b>.<br><br>
          Pensez à encaisser — en cas de non-règlement, un administrateur peut retirer le statut depuis
          la liste des membres du site.</p>`,
      });
      res.status(200).json({ ok: true, until: until.toISOString() });
      return;
    }

    res.status(400).json({ error: 'Action inconnue' });
  } catch (e) {
    res.status(500).json({ error: e && e.message ? e.message : String(e) });
  }
}
