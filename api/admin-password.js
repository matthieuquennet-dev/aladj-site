/* =====================================================================
 *  ALADJ — Mot de passe temporaire (fonction Vercel)
 *  À placer dans  api/admin-password.js
 *
 *  POURQUOI CETTE FONCTION
 *  -----------------------
 *  Le lien « mot de passe oublié » ne parvient pas toujours à son but :
 *  ouvert depuis un autre navigateur que celui d'où il a été demandé, ou
 *  depuis le navigateur intégré d'une application de messagerie, il ne
 *  reconnecte personne. Certains antivirus et certaines messageries
 *  visitent d'ailleurs les liens avant le destinataire, ce qui consomme
 *  le jeton à usage unique et rend le lien mort à l'arrivée.
 *
 *  Un administrateur peut donc poser un mot de passe temporaire sur un
 *  compte. Rien à cliquer, rien à ouvrir : le membre le saisit sur
 *  l'écran de connexion ordinaire. Le site lui demandera ensuite d'en
 *  choisir un autre, et ne le laissera pas passer outre.
 *
 *  CE QUE CELA SUPPOSE, ET QU'IL FAUT ASSUMER
 *  ------------------------------------------
 *  Poser un mot de passe sur le compte d'autrui, c'est pouvoir s'y
 *  connecter. Cette fonction est donc strictement réservée aux
 *  administrateurs du site, chaque usage est tracé par un courriel au
 *  bureau, et le membre concerné est prévenu par courriel lui aussi.
 *  Personne ne peut voir son mot de passe changer sans le savoir.
 *
 *  Variables d'environnement Vercel (toutes déjà en place) :
 *    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GMAIL_USER, GMAIL_APP_PASSWORD
 * ===================================================================== */

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { randomInt } from 'node:crypto';

/* Alphabet sans ambiguïté : ni O ni 0, ni I ni l ni 1. Un mot de passe
   temporaire se lit souvent à voix haute ou se recopie depuis un écran de
   téléphone — il ne doit pas se prêter à l'erreur. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function motDePasseTemporaire() {
  const bloc = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `${bloc()}-${bloc()}-${bloc()}`;
}

function mailer() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
}

function courrielAuMembre(nom, motDePasse) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FBF7EF;">
  <div style="max-width:560px;margin:0 auto;padding:24px 14px;font-family:Arial,sans-serif;">
    <div style="text-align:center;color:#1A3A5C;font-weight:bold;font-size:20px;margin-bottom:12px;">ALADJ — À l'assaut des jeux</div>
    <div style="background:#fff;border:1px solid #ece2d0;border-radius:20px;padding:24px 22px;color:#5e5346;">
      <div style="text-align:center;font-size:30px;">🔑</div>
      <div style="text-align:center;font-family:Arial,sans-serif;font-weight:bold;font-size:19px;color:#1A3A5C;margin-bottom:14px;">
        Un mot de passe temporaire pour ${nom}
      </div>
      <p style="font-size:14px;line-height:1.6;margin:0 0 14px;">
        Un administrateur du site vient de poser un <b>mot de passe temporaire</b> sur ton compte,
        parce que le lien « mot de passe oublié » n'aboutissait pas.
      </p>
      <div style="text-align:center;margin:0 0 16px;">
        <span style="display:inline-block;background:#1A3A5C;color:#fff;font-family:'Courier New',monospace;font-weight:bold;font-size:22px;letter-spacing:3px;padding:12px 20px;border-radius:11px;">${motDePasse}</span>
      </div>
      <p style="font-size:14px;line-height:1.6;margin:0 0 12px;">
        Rends-toi sur <b>aladj.fr</b>, clique sur <b>Connexion</b>, saisis ton adresse e-mail
        et ce mot de passe. <b>Il n'y a aucun lien à ouvrir</b> : tape-le simplement, tel quel,
        tirets compris. Les majuscules comptent.
      </p>
      <p style="font-size:14px;line-height:1.6;margin:0 0 12px;">
        Dès que tu seras connecté, le site te demandera d'en <b>choisir un autre</b> — celui que
        tu veux, que tu retiendras. Tant que ce ne sera pas fait, tu ne pourras rien faire d'autre.
      </p>
      <p style="font-size:13px;line-height:1.6;margin:0;color:#8a7c6a;">
        Tu n'as rien demandé ? Préviens l'association sans tarder : quelqu'un a pu se tromper de compte.
      </p>
    </div>
    <div style="text-align:center;font-size:11px;color:#9c8d79;margin-top:14px;line-height:1.5;">
      ALADJ — aladj.fr · Ce message a été envoyé parce qu'un administrateur a posé un mot de passe temporaire sur ce compte.
    </div>
  </div></body></html>`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Méthode non autorisée' }); return; }
    for (const v of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
      if (!process.env[v]) { res.status(500).json({ error: 'Config manquante : ' + v }); return; }
    }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // --- Qui appelle ? ------------------------------------------------
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) { res.status(401).json({ error: 'Connexion requise' }); return; }
    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData?.user) { res.status(401).json({ error: 'Session invalide — reconnectez-vous' }); return; }
    const appelant = userData.user;

    const { data: profAppelant } = await supabase
      .from('profiles').select('id,name,is_admin').eq('id', appelant.id).single();
    if (!profAppelant || profAppelant.is_admin !== true) {
      res.status(403).json({ error: 'Réservé aux administrateurs du site.' });
      return;
    }

    // --- Pour qui ? ---------------------------------------------------
    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const cibleId = String(body.userId || '').trim();
    if (!cibleId) { res.status(400).json({ error: 'Membre non précisé.' }); return; }
    if (cibleId === appelant.id) {
      res.status(400).json({ error: "Pour votre propre compte, utilisez « Mon profil → Mot de passe » : c'est plus direct et cela ne laisse pas de mot de passe temporaire derrière vous." });
      return;
    }

    const { data: cible } = await supabase
      .from('profiles').select('id,name,banned').eq('id', cibleId).single();
    if (!cible) { res.status(404).json({ error: 'Ce membre est introuvable.' }); return; }
    if (cible.banned === true) {
      res.status(400).json({ error: "Ce membre est banni : débannissez-le d'abord si vous voulez lui rendre l'accès." });
      return;
    }

    // L'adresse de connexion vit dans auth.users, pas dans profiles.
    const { data: authCible, error: eAuth } = await supabase.auth.admin.getUserById(cibleId);
    if (eAuth || !authCible?.user) { res.status(404).json({ error: "Ce compte n'existe plus côté connexion." }); return; }
    const email = authCible.user.email || null;

    // --- On pose le mot de passe --------------------------------------
    const motDePasse = motDePasseTemporaire();
    const { error: ePwd } = await supabase.auth.admin.updateUserById(cibleId, { password: motDePasse });
    if (ePwd) { res.status(500).json({ error: 'Changement refusé : ' + ePwd.message }); return; }

    // Le marqueur qui obligera le membre a en choisir un autre.
    await supabase.from('profiles').update({ pwd_temp_at: new Date().toISOString() }).eq('id', cibleId);

    // --- On prévient : le membre, et le bureau -------------------------
    // Un échec d'envoi ne doit pas annuler l'opération : le mot de passe est
    // déjà posé, et l'administrateur l'a sous les yeux. On dit simplement que
    // le courriel n'est pas parti.
    let mailMembre = false;
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const t = mailer();
      if (email) {
        try {
          await t.sendMail({
            from: `"ALADJ" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `🔑 Ton mot de passe temporaire pour aladj.fr`,
            html: courrielAuMembre(cible.name || 'toi', motDePasse),
          });
          mailMembre = true;
        } catch (e) { /* on le dira à l'administrateur */ }
      }
      // Trace pour le bureau. Le mot de passe n'y figure JAMAIS : cet e-mail
      // sert à savoir que la chose a eu lieu, pas à la refaire.
      try {
        await t.sendMail({
          from: `"ALADJ site" <${process.env.GMAIL_USER}>`,
          to: process.env.GMAIL_USER,
          subject: `🔑 Mot de passe temporaire posé sur le compte de ${cible.name}`,
          html: `<p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">
            <b>${profAppelant.name}</b> (administrateur) vient de poser un <b>mot de passe temporaire</b>
            sur le compte de <b>${cible.name}</b>${email ? ` (${email})` : ''}, le ${new Date().toLocaleString('fr-FR')}.<br><br>
            Le membre en a été informé par courriel${mailMembre ? '' : " (l'envoi a échoué)"} et devra en choisir
            un autre dès sa prochaine connexion.<br>
            <span style="color:#8a7c6a;font-size:12.5px;">Ce message ne contient pas le mot de passe. Il n'est là que pour garder une trace.</span></p>`,
        });
      } catch (e) { /* la trace est un confort, pas une condition */ }
    }

    res.status(200).json({
      ok: true,
      password: motDePasse,
      name: cible.name,
      email,
      mailSent: mailMembre,
    });
  } catch (e) {
    res.status(500).json({ error: e && e.message ? e.message : String(e) });
  }
}
