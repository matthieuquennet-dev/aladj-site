/* =====================================================================
 *  ALADJ — Flux calendrier iCal abonnable (fonction serverless Vercel)
 *  À placer dans  api/calendar.js
 *
 *  Sert un fichier .ics avec les moments jeux : les membres s'y abonnent
 *  depuis Google Agenda / Apple Calendrier et les soirées apparaissent
 *  automatiquement dans leur agenda (mises à jour comprises).
 *
 *  Variables d'environnement Vercel (les 2 premières existent déjà
 *  depuis l'installation du push) :
 *    SUPABASE_URL              = https://<ref>.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY = (clé service_role, secrète)
 *    CALENDAR_TOKEN            = jeton d'accès du flux (cf. INSTALLATION)
 * ===================================================================== */

import { createClient } from '@supabase/supabase-js';

/* Échappe le texte pour le format iCalendar (RFC 5545). */
function esc(t) {
  return String(t || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/* Plie les lignes longues (75 octets max) : suite de ligne = CRLF + espace. */
function fold(line) {
  const out = [];
  let s = line;
  while (Buffer.byteLength(s, 'utf8') > 73) {
    let cut = 73;
    while (cut > 0 && Buffer.byteLength(s.slice(0, cut), 'utf8') > 73) cut--;
    out.push(s.slice(0, cut));
    s = ' ' + s.slice(cut);
  }
  out.push(s);
  return out.join('\r\n');
}

/* "2026-07-04" + "20:00" -> "20260704T200000" (heure locale Europe/Paris) */
function dtLocal(dateStr, timeStr) {
  const d = dateStr.replace(/-/g, '');
  const t = (timeStr || '20:00').slice(0, 5).replace(':', '') + '00';
  return `${d}T${t}`;
}

/* Ajoute des heures à un couple (date, heure) sans librairie de fuseaux. */
function addHours(dateStr, timeStr, hours) {
  const [y, m, dd] = dateStr.split('-').map(Number);
  const [hh, mi] = (timeStr || '20:00').slice(0, 5).split(':').map(Number);
  const d = new Date(Date.UTC(y, m - 1, dd, hh, mi));
  d.setUTCHours(d.getUTCHours() + hours);
  const p = (n) => String(n).padStart(2, '0');
  return [
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`,
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`,
  ];
}

export default async function handler(req, res) {
  try {
  // Vérifications explicites : un env manquant donne un message clair, pas un crash.
  if (!process.env.SUPABASE_URL) { res.status(500).send('Config manquante : SUPABASE_URL'); return; }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) { res.status(500).send('Config manquante : SUPABASE_SERVICE_ROLE_KEY'); return; }
  if (!process.env.CALENDAR_TOKEN) { res.status(500).send('Config manquante : CALENDAR_TOKEN (variable Vercel a ajouter, puis redeployer)'); return; }

  // Jeton d'accès : évite que le flux soit lisible par n'importe qui.
  const k = (req.query && req.query.k) || new URL(req.url, 'https://aladj.fr').searchParams.get('k');
  if (k !== process.env.CALENDAR_TOKEN) {
    res.status(401).send('Accès refusé');
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Moments : des 2 derniers mois jusqu'au futur.
  const since = new Date();
  since.setMonth(since.getMonth() - 2);
  const sinceStr = since.toISOString().slice(0, 10);

  // Ce flux est partage (un seul jeton pour toute l'association) : les moments
  // jeux PRIVES en sont donc exclus. Ils restent visibles sur le site pour les
  // seuls membres convies. NB : la cle service_role ignore la RLS, le filtre
  // ci-dessous est donc indispensable.
  const { data: allEvents, error } = await supabase
    .from('events')
    .select('id,event_date,event_time,place,online,notes,min_players,max_players,is_private')
    .gte('event_date', sinceStr)
    .order('event_date', { ascending: true });
  if (error) { res.status(500).send('Erreur de lecture'); return; }
  const events = (allEvents || []).filter((e) => e.is_private !== true);

  const ids = (events || []).map((e) => e.id);
  const counts = {};
  if (ids.length) {
    const { data: players } = await supabase
      .from('event_players').select('event_id').in('event_id', ids);
    (players || []).forEach((p) => { counts[p.event_id] = (counts[p.event_id] || 0) + 1; });
  }

  const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const L = [];
  L.push('BEGIN:VCALENDAR');
  L.push('VERSION:2.0');
  L.push('PRODID:-//ALADJ//aladj.fr//FR');
  L.push('CALSCALE:GREGORIAN');
  L.push('METHOD:PUBLISH');
  L.push('X-WR-CALNAME:ALADJ — Moments jeux');
  L.push('X-WR-TIMEZONE:Europe/Paris');
  L.push('REFRESH-INTERVAL;VALUE=DURATION:PT6H');
  L.push('X-PUBLISHED-TTL:PT6H');
  // Fuseau Europe/Paris (heure d'été / heure d'hiver)
  L.push('BEGIN:VTIMEZONE');
  L.push('TZID:Europe/Paris');
  L.push('BEGIN:DAYLIGHT');
  L.push('TZOFFSETFROM:+0100');
  L.push('TZOFFSETTO:+0200');
  L.push('TZNAME:CEST');
  L.push('DTSTART:19700329T020000');
  L.push('RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU');
  L.push('END:DAYLIGHT');
  L.push('BEGIN:STANDARD');
  L.push('TZOFFSETFROM:+0200');
  L.push('TZOFFSETTO:+0100');
  L.push('TZNAME:CET');
  L.push('DTSTART:19701025T030000');
  L.push('RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU');
  L.push('END:STANDARD');
  L.push('END:VTIMEZONE');

  for (const e of events || []) {
    const n = counts[e.id] || 0;
    const quorum = e.min_players ? n >= e.min_players : n > 0;
    const title = e.online
      ? `🎲 ALADJ — Soirée en ligne (BGA)${quorum ? '' : ' (en attente)'}`
      : `🎲 ALADJ — Soirée jeux${e.place ? ' · ' + e.place : ''}${quorum ? '' : ' (en attente)'}`;
    const descParts = [];
    descParts.push(`${n} inscrit${n > 1 ? 's' : ''}${e.min_players ? ` (minimum ${e.min_players})` : ''}${e.max_players ? ` — maximum ${e.max_players}` : ''}`);
    if (e.notes) descParts.push(e.notes);
    descParts.push('Détails et inscription : https://aladj.fr');
    const [endDate, endTime] = addHours(e.event_date, e.event_time, 3);

    L.push('BEGIN:VEVENT');
    L.push(`UID:${e.id}@aladj.fr`);
    L.push(`DTSTAMP:${now}`);
    L.push(fold(`SUMMARY:${esc(title)}`));
    L.push(`DTSTART;TZID=Europe/Paris:${dtLocal(e.event_date, e.event_time)}`);
    L.push(`DTEND;TZID=Europe/Paris:${dtLocal(endDate, endTime)}`);
    L.push(fold(`LOCATION:${esc(e.online ? 'Board Game Arena (en ligne)' : (e.place || ''))}`));
    L.push(fold(`DESCRIPTION:${esc(descParts.join('\n'))}`));
    L.push(`STATUS:${quorum ? 'CONFIRMED' : 'TENTATIVE'}`);
    L.push('URL:https://aladj.fr');
    L.push('END:VEVENT');
  }
  L.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="aladj.ics"');
  // Cache CDN 30 min : soulage Supabase, tout en restant frais.
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
  res.status(200).send(L.join('\r\n') + '\r\n');
  } catch (e) {
    // Message lisible plutôt qu'un crash opaque FUNCTION_INVOCATION_FAILED.
    res.status(500).send('Erreur calendrier : ' + (e && e.message ? e.message : String(e)));
  }
}
