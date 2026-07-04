/* =====================================================================
 *  ALADJ — Envoi des rétrospectives par e-mail (fonction Vercel + cron)
 *  À placer dans  api/retro-email.js
 *
 *  Déclenchée automatiquement le 1er de chaque mois à 08h00 (cron Vercel) :
 *   - chaque mois : rétrospective du mois écoulé (compacte)
 *   - en janvier : rétrospective de l'année écoulée (riche) à la place
 *  N'envoie qu'aux membres ayant retro_emails = true et au moins 1 partie.
 *
 *  Variables d'environnement Vercel :
 *    SUPABASE_URL              (déjà en place)
 *    SUPABASE_SERVICE_ROLE_KEY (déjà en place)
 *    CRON_SECRET               = jeton (Vercel l'ajoute de lui-même aux appels cron)
 *    GMAIL_USER                = aladj50200@gmail.com
 *    GMAIL_APP_PASSWORD        = mot de passe d'application Google (voir notice)
 *
 *  Test manuel (envoie uniquement à l'adresse donnée) :
 *    https://aladj.fr/api/retro-email?k=<CRON_SECRET>&test=vous@exemple.fr
 *    (+ &period=year pour tester la version annuelle)
 * ===================================================================== */

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/* ---- Calcul de la rétrospective d'un membre sur [start, end) ---- */
function computeRetro(uid, startIso, endIso, plays, gameNames, userNames) {
  const mine = plays
    .filter((pl) => pl.participants.some((pt) => pt.user_id === uid && pt.confirmed !== false))
    .sort((a, b) => (a.played_at < b.played_at ? -1 : 1));
  const inRange = mine.filter((pl) => pl.played_at >= startIso && pl.played_at < endIso);
  const won = (pl) => pl.participants.some((pt) => pt.user_id === uid && pt.is_winner && pt.confirmed !== false);
  const wins = inRange.filter(won).length;
  const seconds = inRange.reduce((s, pl) => s + (pl.duration_seconds || 0), 0);
  const byGame = {};
  inRange.forEach((pl) => { byGame[pl.game_id] = (byGame[pl.game_id] || 0) + 1; });
  const topId = Object.keys(byGame).sort((a, b) => byGame[b] - byGame[a])[0] || null;
  const byPartner = {};
  inRange.forEach((pl) => pl.participants.forEach((pt) => {
    if (pt.user_id && pt.user_id !== uid && pt.confirmed !== false) byPartner[pt.user_id] = (byPartner[pt.user_id] || 0) + 1;
  }));
  const topPartnerId = Object.keys(byPartner).sort((a, b) => byPartner[b] - byPartner[a])[0] || null;
  const firstByGame = {};
  mine.forEach((pl) => { if (!firstByGame[pl.game_id]) firstByGame[pl.game_id] = pl.played_at; });
  const discoveries = Object.keys(firstByGame).filter((g) => firstByGame[g] >= startIso && firstByGame[g] < endIso).length;
  let streak = 0, bestStreak = 0;
  inRange.forEach((pl) => { streak = won(pl) ? streak + 1 : 0; if (streak > bestStreak) bestStreak = streak; });
  return {
    plays: inRange.length, wins,
    hours: Math.round(seconds / 360) / 10,
    distinctGames: Object.keys(byGame).length,
    topGame: topId ? { name: gameNames[topId] || 'Un jeu', count: byGame[topId] } : null,
    topPartner: topPartnerId ? { name: userNames[topPartnerId] || 'Un membre', count: byPartner[topPartnerId] } : null,
    discoveries, bestStreak,
  };
}

/* ---- Gabarit HTML de l'e-mail ---- */
function emailHtml(name, periodLabel, r, isYear) {
  const stat = (emoji, big, label) => `
    <td style="background:rgba(255,255,255,.13);border-radius:12px;padding:12px 6px;text-align:center;">
      <div style="font-size:20px;">${emoji}</div>
      <div style="font-family:Arial,sans-serif;font-weight:bold;font-size:24px;color:#fff;">${big}</div>
      <div style="font-size:10px;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.05em;">${label}</div>
    </td>`;
  const line = (emoji, html) => `
    <div style="background:rgba(255,255,255,.13);border-radius:10px;padding:9px 13px;color:#fff;font-size:14px;font-family:Arial,sans-serif;margin-top:7px;">${emoji} ${html}</div>`;
  let extra = '';
  if (r.topGame) extra += line('🎲', `${isYear ? "Jeu de l'année" : 'Jeu du mois'} : <b>${r.topGame.name}</b> (${r.topGame.count} partie${r.topGame.count > 1 ? 's' : ''})`);
  if (isYear && r.topPartner) extra += line('🤝', `Partenaire favori : <b>${r.topPartner.name}</b> (${r.topPartner.count} parties ensemble)`);
  if (isYear && r.discoveries > 0) extra += line('💡', `<b>${r.discoveries}</b> jeu${r.discoveries > 1 ? 'x' : ''} découvert${r.discoveries > 1 ? 's' : ''}`);
  if (isYear && r.bestStreak >= 2) extra += line('🔥', `Meilleure série : <b>${r.bestStreak} victoires d'affilée</b>`);
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FBF7EF;">
  <div style="max-width:560px;margin:0 auto;padding:24px 14px;">
    <div style="text-align:center;font-family:Arial,sans-serif;color:#1A3A5C;font-weight:bold;font-size:20px;margin-bottom:12px;">ALADJ — À l'assaut des jeux</div>
    <div style="background:linear-gradient(140deg,#1A3A5C,#1E8A8A);border-radius:20px;padding:24px 20px;">
      <div style="text-align:center;font-size:28px;">✨</div>
      <div style="text-align:center;font-family:Arial,sans-serif;font-weight:bold;font-size:19px;color:#fff;margin-bottom:16px;">
        ${name}, voici ta rétrospective<br>${periodLabel}
      </div>
      <table role="presentation" width="100%" cellspacing="6" cellpadding="0"><tr>
        ${stat('🎲', r.plays, r.plays > 1 ? 'parties' : 'partie')}
        ${stat('🏆', r.wins, r.wins > 1 ? 'victoires' : 'victoire')}
        ${stat('🧭', r.distinctGames, r.distinctGames > 1 ? 'jeux' : 'jeu')}
        ${r.hours > 0 ? stat('⏱️', String(r.hours).replace('.', ',') + ' h', 'de jeu') : ''}
      </tr></table>
      ${extra}
      <div style="text-align:center;margin-top:18px;">
        <a href="https://aladj.fr" style="display:inline-block;background:#E8A317;color:#fff;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;text-decoration:none;padding:11px 22px;border-radius:12px;">Voir ma rétrospective complète</a>
      </div>
    </div>
    <div style="text-align:center;font-family:Arial,sans-serif;font-size:11px;color:#9c8d79;margin-top:14px;line-height:1.5;">
      Vous recevez cet e-mail car vous êtes membre de l'ALADJ.<br>
      Pour ne plus recevoir les rétrospectives : aladj.fr → Mon espace → « Rétrospective par e-mail » → Désactiver.
    </div>
  </div></body></html>`;
}

export default async function handler(req, res) {
  try {
    for (const v of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CRON_SECRET', 'GMAIL_USER', 'GMAIL_APP_PASSWORD']) {
      if (!process.env[v]) { res.status(500).send('Config manquante : ' + v); return; }
    }
    // Accès : soit le cron Vercel (en-tête Authorization automatique), soit ?k=
    const url = new URL(req.url, 'https://aladj.fr');
    const k = (req.query && req.query.k) || url.searchParams.get('k');
    const auth = req.headers && req.headers.authorization;
    if (auth !== `Bearer ${process.env.CRON_SECRET}` && k !== process.env.CRON_SECRET) {
      res.status(401).send('Accès refusé'); return;
    }
    const testEmail = (req.query && req.query.test) || url.searchParams.get('test');
    const forcedPeriod = (req.query && req.query.period) || url.searchParams.get('period');

    // Période : par défaut le mois écoulé ; en janvier, l'année écoulée.
    const now = new Date();
    const y = now.getUTCFullYear(), m = now.getUTCMonth();
    const iso = (yy, mm) => new Date(Date.UTC(yy, mm, 1)).toISOString();
    let isYear = forcedPeriod ? forcedPeriod === 'year' : m === 0;
    let start, end, label;
    if (isYear) {
      start = iso(y - 1, 0); end = iso(y, 0); label = `de l'année ${y - 1} 🎉`;
    } else {
      const pm = m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 };
      start = iso(pm.y, pm.m); end = iso(pm.m === 11 ? pm.y + 1 : pm.y, (pm.m + 1) % 12);
      label = `de ${MONTHS[pm.m]} ${pm.y}`;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Données : profils + parties (avec participants) + noms de jeux
    const { data: profiles, error: e1 } = await supabase
      .from('profiles').select('id,name,retro_emails,banned');
    if (e1) { res.status(500).send('Erreur profils : ' + e1.message); return; }

    const { data: gp, error: e2 } = await supabase
      .from('game_plays').select('id,game_id,played_at,duration_seconds').gte('played_at', start).lt('played_at', end);
    if (e2) { res.status(500).send('Erreur parties : ' + e2.message); return; }
    // Toutes les participations passées servent au calcul des découvertes :
    const { data: allGp } = await supabase.from('game_plays').select('id,game_id,played_at,duration_seconds');
    const { data: gpp } = await supabase.from('game_play_participants').select('play_id,user_id,is_winner,confirmed');
    const byPlay = {};
    (gpp || []).forEach((pt) => { (byPlay[pt.play_id] ||= []).push(pt); });
    const plays = (allGp || []).map((pl) => ({ ...pl, participants: byPlay[pl.id] || [] }));

    const { data: games } = await supabase.from('games').select('id,name');
    const gameNames = {}; (games || []).forEach((g) => { gameNames[g.id] = g.name; });
    const userNames = {}; (profiles || []).forEach((p) => { userNames[p.id] = p.name; });

    // E-mails des membres (auth admin)
    const emailById = {};
    let page = 1;
    for (let guard = 0; guard < 20; guard++) {
      const { data: pageData, error: eU } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (eU || !pageData || !pageData.users || pageData.users.length === 0) break;
      pageData.users.forEach((u) => { if (u.email) emailById[u.id] = u.email; });
      if (pageData.users.length < 200) break;
      page++;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    let sent = 0, skipped = 0;
    const errors = [];
    for (const p of profiles || []) {
      if (p.banned || p.retro_emails === false) { skipped++; continue; }
      const email = emailById[p.id];
      if (!email) { skipped++; continue; }
      if (testEmail && email !== testEmail) continue; // mode test : une seule adresse
      const r = computeRetro(p.id, start, end, plays, gameNames, userNames);
      if (r.plays === 0) { skipped++; continue; } // rien à raconter, pas d'e-mail
      try {
        await transporter.sendMail({
          from: `"ALADJ" <${process.env.GMAIL_USER}>`,
          to: email,
          subject: isYear ? `🎁 ${p.name}, ta rétrospective ALADJ ${y - 1} est là !` : `🎲 ${p.name}, ton mois ALADJ en un coup d'œil`,
          html: emailHtml(p.name, label, r, isYear),
        });
        sent++;
        await new Promise((ok) => setTimeout(ok, 400)); // rythme doux pour Gmail
      } catch (e) {
        errors.push(`${email}: ${e.message}`);
      }
    }

    res.status(200).json({ ok: true, period: label, sent, skipped, errors });
  } catch (e) {
    res.status(500).send('Erreur retro-email : ' + (e && e.message ? e.message : String(e)));
  }
}
