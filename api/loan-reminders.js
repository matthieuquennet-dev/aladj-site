/* =====================================================================
 *  ALADJ — Rappels de retour des locations (fonction serverless Vercel)
 *  À placer dans  api/loan-reminders.js
 *
 *  Déclenchée une fois par jour par le cron déclaré dans vercel.json.
 *  Pour chaque location en cours (loans.returned ≠ true), elle envoie à
 *  l'EMPRUNTEUR :
 *    - « due_soon »  : la veille de l'échéance
 *    - « due_day »   : le jour où le jeu doit être rendu
 *    - « late_wN »   : un rappel par semaine entière de retard, jusqu'au retour
 *
 *  L'anti-doublon repose sur la table loan_reminders (clé loan_id + kind) :
 *  si le cron passe deux fois dans la journée, ou si Vercel le rejoue, aucun
 *  membre ne reçoit deux fois le même rappel.
 *
 *  Le propriétaire n'est volontairement pas notifié des retards : c'est
 *  l'emprunteur qui doit agir, et sa page « Mes locations » porte déjà la
 *  pastille rouge. (Facile à changer : cf. NOTIFY_LENDER ci-dessous.)
 *
 *  Variables d'environnement Vercel (déjà en place) :
 *    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *    CRON_SECRET (facultatif — si défini, Vercel l'envoie en Bearer)
 * ===================================================================== */

import { createClient } from '@supabase/supabase-js';

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

/* Prévenir aussi le propriétaire des retards ? Non par défaut. */
const NOTIFY_LENDER = false;

/* Date lisible en français, sans dépendance externe. */
function fmtDate(d) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', timeZone: 'Europe/Paris',
  });
}

/* Quel rappel faut-il envoyer pour cette location, à cet instant ?
   Renvoie null s'il n'y a rien à faire aujourd'hui. */
function reminderFor(dueAt, now) {
  const due = new Date(dueAt).getTime();
  if (!Number.isFinite(due)) return null;

  // Rappel de la veille. La fenêtre est volontairement plus large que 24 h :
  // le cron ne passe qu'une fois par jour, à heure fixe, alors que l'échéance
  // tombe à n'importe quelle heure. Avec une fenêtre pile de 24 h, un décalage
  // de quelques minutes suffirait à la manquer. Le dédoublonnage par « kind »
  // garantit qu'un seul rappel part, même si deux passages tombent dedans.
  if (now >= due - 1.5 * DAY && now < due) return { kind: 'due_soon' };

  // Fenêtre [échéance, échéance + 24 h[ : le jour J.
  if (now >= due && now < due + DAY) return { kind: 'due_day' };

  // Au-delà : une relance par semaine entière écoulée.
  if (now >= due + WEEK) {
    const weeks = Math.floor((now - due) / WEEK);
    return { kind: `late_w${weeks}`, weeks };
  }
  return null;
}

/* Le texte de la notification. Écrit ici (et non en SQL) pour garder les
   accents : les scripts passés dans l'éditeur Supabase doivent rester ASCII. */
function messageFor(rem, gameName, lenderName, dueAt) {
  const jeu = `« ${gameName} »`;
  if (rem.kind === 'due_soon') {
    return `Rappel : ${jeu} est à rendre demain à ${lenderName} (${fmtDate(dueAt)}).`;
  }
  if (rem.kind === 'due_day') {
    return `C'est aujourd'hui : ${jeu} doit être rendu à ${lenderName}.`;
  }
  const s = rem.weeks > 1 ? 's' : '';
  return `${jeu} est en retard de ${rem.weeks} semaine${s} — pensez à le rendre à ${lenderName} (échéance du ${fmtDate(dueAt)}).`;
}

export default async function handler(req, res) {
  // Vercel signe ses appels de cron avec CRON_SECRET quand la variable existe.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Non autorisé.' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const now = Date.now();

  try {
    /* 1. Les locations encore ouvertes. */
    const { data: loans, error: loansErr } = await supabase
      .from('loans')
      .select('id, game_id, lender_id, borrower_id, due_at, returned')
      .not('returned', 'is', true);
    if (loansErr) throw loansErr;
    if (!loans || loans.length === 0) {
      return res.status(200).json({ ok: true, checked: 0, sent: 0 });
    }

    /* 2. Ce qu'il y a à envoyer aujourd'hui, avant dédoublonnage. */
    const todo = [];
    for (const l of loans) {
      const rem = reminderFor(l.due_at, now);
      if (rem) todo.push({ loan: l, rem });
    }
    if (todo.length === 0) {
      return res.status(200).json({ ok: true, checked: loans.length, sent: 0 });
    }

    /* 3. Rappels déjà envoyés pour ces locations. */
    const loanIds = [...new Set(todo.map((t) => t.loan.id))];
    const { data: already, error: remErr } = await supabase
      .from('loan_reminders')
      .select('loan_id, kind')
      .in('loan_id', loanIds);
    if (remErr) throw remErr;
    const sentSet = new Set((already || []).map((r) => `${r.loan_id}|${r.kind}`));

    const pending = todo.filter((t) => !sentSet.has(`${t.loan.id}|${t.rem.kind}`));
    if (pending.length === 0) {
      return res.status(200).json({ ok: true, checked: loans.length, sent: 0 });
    }

    /* 4. Noms des jeux et des membres concernés. */
    const gameIds = [...new Set(pending.map((t) => t.loan.game_id))];
    const userIds = [...new Set(pending.flatMap((t) => [t.loan.lender_id, t.loan.borrower_id]))];

    const [{ data: games }, { data: profiles }] = await Promise.all([
      supabase.from('games').select('id, name').in('id', gameIds),
      supabase.from('profiles').select('id, name').in('id', userIds),
    ]);
    const gameName = {};
    (games || []).forEach((g) => { gameName[g.id] = g.name; });
    const userName = {};
    (profiles || []).forEach((p) => { userName[p.id] = p.name; });

    /* 5. Notifications. actor_id = le propriétaire : c'est bien de sa part
          que le rappel arrive du point de vue de l'emprunteur. */
    const notifs = [];
    const marks = [];
    for (const { loan, rem } of pending) {
      const jeu = gameName[loan.game_id] || 'un jeu';
      const preteur = userName[loan.lender_id] || 'son propriétaire';
      const type = rem.kind.startsWith('late_') ? 'loan_late'
        : (rem.kind === 'due_day' ? 'loan_due_today' : 'loan_due_soon');

      notifs.push({
        recipient_id: loan.borrower_id,
        actor_id: loan.lender_id,
        type,
        message: messageFor(rem, jeu, preteur, loan.due_at),
        link_kind: 'loan',
        link_id: null,
      });

      if (NOTIFY_LENDER && rem.kind.startsWith('late_')) {
        const emprunteur = userName[loan.borrower_id] || 'Un membre';
        notifs.push({
          recipient_id: loan.lender_id,
          actor_id: loan.borrower_id,
          type: 'loan_late',
          message: `${emprunteur} n'a pas encore rendu « ${jeu} » (échéance du ${fmtDate(loan.due_at)}).`,
          link_kind: 'loan',
          link_id: null,
        });
      }

      marks.push({ loan_id: loan.id, kind: rem.kind });
    }

    /* 6. On marque AVANT d'insérer : en cas de plantage entre les deux, mieux
          vaut un rappel manqué qu'une avalanche de doublons au prochain
          passage. La contrainte de clé primaire absorbe les rejeux. */
    const { error: markErr } = await supabase
      .from('loan_reminders')
      .upsert(marks, { onConflict: 'loan_id,kind', ignoreDuplicates: true });
    if (markErr) throw markErr;

    const { error: notifErr } = await supabase.from('notifications').insert(notifs);
    if (notifErr) throw notifErr;

    return res.status(200).json({
      ok: true, checked: loans.length, sent: notifs.length,
    });
  } catch (e) {
    console.error('[loan-reminders]', e);
    return res.status(500).json({ error: e.message || String(e) });
  }
}
