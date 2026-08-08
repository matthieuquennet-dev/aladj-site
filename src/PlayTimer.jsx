// =====================================================================
//  ALADJ — PlayTimer : chronométrage des parties (multi-device, "claim")
// ---------------------------------------------------------------------
//  Composant autonome à monter en modale plein écran.
//
//  PROPS
//   - supabase     : ton client Supabase (obligatoire)
//   - currentUser  : { id, name, avatar_url } du membre connecté, ou null
//                    (null = invité -> connexion anonyme automatique)
//   - gameId       : uuid d'un jeu (lancement depuis une fiche de jeu)
//   - eventId      : uuid d'une soirée (lancement depuis un moment jeux)
//   - joinCode     : code à 6 caractères (on REJOINT une partie existante)
//   - onExit       : callback de fermeture
//
//  USAGE
//   Hôte depuis une fiche de jeu :
//     <PlayTimer supabase={supabase} currentUser={me} gameId={jeu.id} onExit={...} />
//   Hôte depuis un moment jeux :
//     <PlayTimer supabase={supabase} currentUser={me} eventId={soiree.id} onExit={...} />
//   Joueur qui rejoint (ex. via un lien ?chrono=CODE détecté au chargement) :
//     <PlayTimer supabase={supabase} currentUser={me /* ou null */} joinCode={code} onExit={...} />
//
//  PRÉREQUIS : socle SQL + supplément exécutés, et "Anonymous Sign-Ins"
//  activé dans Supabase (pour les invités sur leur propre téléphone).
// =====================================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const C = {
  navy: '#1A3A5C', teal: '#1E8A8A', amber: '#E8A317', red: '#B5283A',
  purple: '#6B3A7A', cream: '#FBF7EF', white: '#FFFFFF',
};
const ACCENTS = [C.teal, C.amber, C.red, C.purple, C.navy];
const TITLE = "'Fredoka', system-ui, sans-serif";
const BODY = "'Nunito', system-ui, sans-serif";

const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`;
};
const initials = (name = '?') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';

/* ---------------------------------------------------------------------
   Garder l'ecran allume pendant une partie (Screen Wake Lock API).
   Un vrai affichage sur l'ecran verrouille n'est pas possible depuis un
   site web (il faudrait une application native) : on empeche donc la mise
   en veille tant que le chrono est ouvert. Le verrou est relache par le
   navigateur quand l'onglet passe en arriere-plan : on le redemande au
   retour au premier plan.
   --------------------------------------------------------------------- */
/* Palette des couleurs de jeu -- identique a celle du site (App.jsx).
   Elle est redefinie ici car PlayTimer est un module autonome ; les cles
   doivent rester strictement alignees sur profiles.fav_colors. */
const GAME_COLORS = [
  { key: 'rouge',     label: 'Rouge',     hex: '#D64545' },
  { key: 'bleu',      label: 'Bleu',      hex: '#2F6FB3' },
  { key: 'vert',      label: 'Vert',      hex: '#3B9B5B' },
  { key: 'jaune',     label: 'Jaune',     hex: '#E8B21C' },
  { key: 'orange',    label: 'Orange',    hex: '#E08A1E' },
  { key: 'violet',    label: 'Violet',    hex: '#7E4FA0' },
  { key: 'rose',      label: 'Rose',      hex: '#D96BA0' },
  { key: 'noir',      label: 'Noir',      hex: '#2B2B2B' },
  { key: 'blanc',     label: 'Blanc',     hex: '#F3EFE6' },
  { key: 'gris',      label: 'Gris',      hex: '#9AA0A6' },
  { key: 'marron',    label: 'Marron',    hex: '#8A5A2B' },
  { key: 'turquoise', label: 'Turquoise', hex: '#1FA8A0' },
];
const hexOfColor = (k) => (GAME_COLORS.find((c) => c.key === k) || {}).hex || null;
// Texte lisible sur un aplat : on calcule la luminance plutot que de tenir
// une liste de couleurs claires a maintenir a la main.
function readableOn(hex) {
  if (!hex) return '#fff';
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 165 ? '#1A3A5C' : '#fff';
}
const TEAM_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/* Ecran large en paysage : on bascule sur la disposition tablette. */
function useLandscape() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(orientation: landscape) and (min-width: 820px) and (min-height: 480px)');
    const on = () => setWide(mq.matches);
    on();
    if (mq.addEventListener) { mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); }
    mq.addListener(on); return () => mq.removeListener(on);
  }, []);
  return wide;
}

const WAKE_LOCK_SUPPORTED = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

function useKeepAwake(enabled) {
  const [active, setActive] = useState(false);
  const lockRef = useRef(null);

  useEffect(() => {
    if (!WAKE_LOCK_SUPPORTED) return undefined;
    let cancelled = false;

    const drop = async () => {
      const l = lockRef.current;
      lockRef.current = null;
      setActive(false);
      if (l) { try { await l.release(); } catch (e) { /* deja relache */ } }
    };

    const acquire = async () => {
      if (cancelled || !enabled) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (lockRef.current) return;
      try {
        const l = await navigator.wakeLock.request('screen');
        if (cancelled || !enabled) { try { await l.release(); } catch (e) {} return; }
        lockRef.current = l;
        setActive(true);
        l.addEventListener('release', () => {
          if (lockRef.current === l) lockRef.current = null;
          setActive(false);
        });
      } catch (e) {
        // Refuse par le navigateur (batterie faible, onglet masque...) : sans gravite.
        setActive(false);
      }
    };

    if (enabled) acquire(); else drop();

    const onVisible = () => { if (document.visibilityState === 'visible') acquire(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      drop();
    };
  }, [enabled]);

  return { supported: WAKE_LOCK_SUPPORTED, active };
}

/* ---------------------------------------------------------------------
   Points de regle, version chronometre.
   Meme contenu que la fiche du jeu (table game_rules), consultable et
   modifiable sans quitter la partie : c'est justement au moment ou la
   question se pose qu'on a besoin de la reponse.
   --------------------------------------------------------------------- */
function RulesSheet({ supabase, currentUser, isAdmin, gameId, gameName, onClose, onCount }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(null);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [busy, setBusy] = useState(false);
  const [names, setNames] = useState({});

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('game_rules')
      .select('id,author_id,content,created_at,updated_at')
      .eq('game_id', gameId).order('created_at', { ascending: true });
    if (error) { setErr(error.message); setRows([]); return; }
    setRows(data || []);
    if (onCount) onCount((data || []).length);
    const ids = [...new Set((data || []).map((r) => r.author_id).filter(Boolean))];
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id,name').in('id', ids);
      const m = {}; (profs || []).forEach((p) => { m[p.id] = p.name; });
      setNames(m);
    }
  }, [supabase, gameId, onCount]);
  useEffect(() => { load(); }, [load]);

  const canTouch = (r) => !!currentUser && (r.author_id === currentUser.id || isAdmin);

  const submitNew = async () => {
    const txt = draft.trim();
    if (!txt || !currentUser) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from('game_rules')
      .insert({ game_id: gameId, author_id: currentUser.id, content: txt.slice(0, 2000) });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setDraft(''); setAdding(false); await load();
  };

  const saveEdit = async () => {
    const txt = editText.trim();
    if (!txt) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from('game_rules')
      .update({ content: txt.slice(0, 2000), updated_at: new Date().toISOString() }).eq('id', editId);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setEditId(null); setEditText(''); await load();
  };

  const removeRule = async (r) => {
    if (typeof window !== 'undefined' && !window.confirm('Supprimer ce point de regle ?')) return;
    setErr(null);
    const { error } = await supabase.from('game_rules').delete().eq('id', r.id);
    if (error) { setErr(error.message); return; }
    await load();
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(26,58,92,.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 0 }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.cream, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560,
        maxHeight: '86vh', overflowY: 'auto', padding: '16px 16px 24px', WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
          <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 19, color: C.navy, minWidth: 0 }}>
            📖 Points de regle
          </div>
          <button onClick={onClose} style={btnGhost}>Fermer</button>
        </div>
        <div style={{ fontSize: 13, color: `${C.navy}99`, marginBottom: 12 }}>{gameName || 'Ce jeu'}</div>

        {err && (
          <div style={{ background: '#fdecee', color: C.red, border: `1px solid ${C.red}33`, borderRadius: 12, padding: '9px 12px', marginBottom: 10, fontWeight: 600, fontSize: 13 }}>{err}</div>
        )}

        {rows === null ? (
          <div style={{ color: `${C.navy}88`, fontSize: 14, padding: '10px 0' }}>Chargement...</div>
        ) : rows.length === 0 ? (
          <div style={{ color: `${C.navy}88`, fontSize: 14, padding: '10px 0' }}>
            Aucun point de regle pour ce jeu.{currentUser ? ' Notez le premier : il sera visible par tous, ici comme sur la fiche du jeu.' : ''}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {rows.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', gap: 10, background: '#fff', border: '1px solid #e6dcc9', borderRadius: 12, padding: '10px 12px' }}>
                <span style={{ flex: '0 0 auto', width: 24, height: 24, borderRadius: 8, background: C.teal, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: TITLE, fontWeight: 600, fontSize: 13 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editId === r.id ? (
                    <div>
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} maxLength={2000}
                        style={{ ...input, resize: 'vertical', marginBottom: 8 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ ...btnPrimary, padding: '8px 14px', fontSize: 14 }} onClick={saveEdit} disabled={busy || !editText.trim()}>Enregistrer</button>
                        <button style={btnGhost} onClick={() => { setEditId(null); setEditText(''); }}>Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 14.5, color: C.navy, lineHeight: 1.5, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{r.content}</div>
                      <div style={{ fontSize: 11.5, color: `${C.navy}77`, marginTop: 4 }}>
                        par {currentUser && r.author_id === currentUser.id ? 'vous' : (names[r.author_id] || 'un membre')}
                      </div>
                    </>
                  )}
                </div>
                {canTouch(r) && editId !== r.id && (
                  <div style={{ display: 'flex', gap: 10, flex: '0 0 auto' }}>
                    <button onClick={() => { setEditId(r.id); setEditText(r.content); }} title="Modifier"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: 0, lineHeight: 1 }}>✏️</button>
                    <button onClick={() => removeRule(r)} title="Supprimer"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: 0, lineHeight: 1 }}>🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!currentUser ? (
          <div style={{ fontSize: 13, color: `${C.navy}88` }}>Seuls les membres connectes peuvent ajouter un point de regle.</div>
        ) : !adding ? (
          <button style={{ ...btnSecondary, width: '100%' }} onClick={() => setAdding(true)}>+ Ajouter un point de regle</button>
        ) : (
          <div>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} maxLength={2000} autoFocus
              placeholder="Ex. : on ne defausse qu'une fois par tour, meme avec la carte Marchand."
              style={{ ...input, resize: 'vertical', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btnPrimary, flex: 1, opacity: busy || !draft.trim() ? 0.6 : 1 }} onClick={submitNew} disabled={busy || !draft.trim()}>
                {busy ? 'Enregistrement...' : 'Ajouter'}
              </button>
              <button style={btnGhost} onClick={() => { setAdding(false); setDraft(''); }}>Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ name, url, color, size = 44 }) {
  const st = {
    width: size, height: size, borderRadius: '50%', flex: '0 0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: TITLE, fontWeight: 600, color: C.white, fontSize: size * 0.38,
    background: color, objectFit: 'cover', overflow: 'hidden',
  };
  if (url) return <img src={url} alt={name} style={st} />;
  return <div style={st}>{initials(name)}</div>;
}

export default function PlayTimer({ supabase, currentUser, gameId, eventId, joinCode, onExit }) {
  const [phase, setPhase] = useState('loading'); // loading|setup|lobby|running|done|error
  const [error, setError] = useState(null);
  // Ecran maintenu allume pendant la partie (voir useKeepAwake plus haut).
  const [keepAwake, setKeepAwake] = useState(true);
  // Points de regle du jeu en cours (voir RulesSheet plus haut).
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesCount, setRulesCount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myUid, setMyUid] = useState(null);

  // session live
  const [session, setSession] = useState(null);     // ligne play_sessions
  const [players, setPlayers] = useState([]);        // play_session_players + nom/avatar résolus
  const [winnerIds, setWinnerIds] = useState([]);    // play_session_players.id des vainqueurs
  const [savingResult, setSavingResult] = useState(false);
  const [totals, setTotals] = useState({});          // player_id -> { total, max }
  const [newGamePrompt, setNewGamePrompt] = useState(false);
  const [newGameWinners, setNewGameWinners] = useState([]);
  const [openSegs, setOpenSegs] = useState({});      // player_id -> started_at (segments ouverts ; mode simultané)
  const [summary, setSummary] = useState(null);      // v_session_summary (fin)

  // setup (hôte)
  const [game, setGame] = useState(null);            // { id, name, play_time, image_url }
  const [eventGames, setEventGames] = useState([]);  // jeux d'une soirée
  const [boxMin, setBoxMin] = useState('');
  const [draft, setDraft] = useState([]);            // joueurs à ajouter (avant création)
  const [guestInput, setGuestInput] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [memberHits, setMemberHits] = useState([]);

  // ui running
  const [hostView, setHostView] = useState(false);
  const [scoreFor, setScoreFor] = useState(null); // id du joueur dont on edite le score
  // Sens du score : 'high' = le plus grand gagne, 'low' = le plus petit.
  // Pre-selectionne depuis la fiche du jeu, modifiable a la main.
  const [scoreDir, setScoreDir] = useState('high');
  // Passe a true des que l'on coche/decoche un vainqueur : on cesse alors
  // de recalculer automatiquement le vainqueur a partir des scores.
  const [winnersTouched, setWinnersTouched] = useState(false);
  const [pendingName, setPendingName] = useState(''); // prénom saisi par un invité avant de rejoindre
  const [now, setNow] = useState(Date.now());
  const channelRef = useRef(null);

  // (1) Chronos deja lances sur ce moment jeux : on propose de les rejoindre
  // plutot que d'en creer un deuxieme par megarde.
  const [eventSessions, setEventSessions] = useState([]);
  // (3) Disposition tablette (paysage). null = automatique selon l'ecran.
  const [tabletPref, setTabletPref] = useState(null);
  const wideScreen = useLandscape();
  const tablet = tabletPref === null ? wideScreen : tabletPref;
  // (2)/(3) Panneaux : choix d'une couleur, composition des equipes
  const [colorFor, setColorFor] = useState(null);
  const [teamsOpen, setTeamsOpen] = useState(false);
  // (4) Enchainer un autre jeu sans quitter le chrono.
  const [nextPicker, setNextPicker] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [nextQuery, setNextQuery] = useState('');
  const [nextHits, setNextHits] = useState([]);
  const [resultSaved, setResultSaved] = useState(false);

  const sid = session?.id;
  const isHost = !!(session && myUid && session.host_profile_id === myUid);
  const myPlayer = useMemo(
    () => players.find((p) => p.auth_user_id && p.auth_user_id === myUid) || null,
    [players, myUid]
  );

  // ---- auth : garantit un auth.uid() (anonyme si besoin) -------------
  const ensureAuth = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) return data.user.id;
    const { data: anon, error: e } = await supabase.auth.signInAnonymously();
    if (e) throw e;
    return anon.user.id;
  }, [supabase]);

  // ---- résolution des noms/avatars pour les lignes joueurs -----------
  const hydratePlayers = useCallback(async (rows) => {
    const ids = [...new Set(rows.map((r) => r.profile_id).filter(Boolean))];
    let byId = {};
    if (ids.length) {
      const { data } = await supabase.from('profiles').select('id,name,avatar_url,fav_colors').in('id', ids);
      (data || []).forEach((p) => { byId[p.id] = p; });
    }
    return rows.map((r) => ({
      ...r,
      name: r.profile_id ? (byId[r.profile_id]?.name || 'Membre') : (r.guest_name || 'Invité'),
      avatar_url: r.profile_id ? byId[r.profile_id]?.avatar_url : null,
      favColors: r.profile_id ? (byId[r.profile_id]?.fav_colors || []) : [],
    }));
  }, [supabase]);

  const refetchPlayers = useCallback(async (sessionId) => {
    const { data } = await supabase
      .from('play_session_players')
      .select('id,profile_id,guest_name,auth_user_id,score,team,color')
      .eq('session_id', sessionId)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('joined_at', { ascending: true });
    setPlayers(await hydratePlayers(data || []));
  }, [supabase, hydratePlayers]);

  const refetchTotals = useCallback(async (sessionId, gameNo) => {
    let g = gameNo;
    if (g == null) {
      const { data: s } = await supabase.from('play_sessions').select('current_game').eq('id', sessionId).maybeSingle();
      g = s?.current_game || 1;
    }
    // Chronos par joueur de la partie EN COURS uniquement (repart a zero a chaque nouvelle partie).
    const { data } = await supabase
      .from('play_turns').select('player_id,duration_seconds')
      .eq('session_id', sessionId).eq('kind', 'player_turn').eq('game_no', g)
      .not('ended_at', 'is', null);
    const map = {};
    (data || []).forEach((r) => {
      if (!r.player_id) return;
      const d = r.duration_seconds || 0;
      if (!map[r.player_id]) map[r.player_id] = { total: 0, max: 0 };
      map[r.player_id].total += d;
      if (d > map[r.player_id].max) map[r.player_id].max = d;
    });
    setTotals(map);
    // segments encore ouverts (mode simultane) de la partie en cours
    const { data: segs } = await supabase
      .from('play_turns').select('player_id,started_at')
      .eq('session_id', sessionId).eq('game_no', g).is('ended_at', null);
    const om = {};
    (segs || []).forEach((sg) => { if (sg.player_id) om[sg.player_id] = sg.started_at; });
    setOpenSegs(om);
  }, [supabase]);

  const refetchSession = useCallback(async (sessionId) => {
    const { data } = await supabase.from('play_sessions').select('*').eq('id', sessionId).single();
    if (data) setSession(data);
    return data;
  }, [supabase]);

  // ---- abonnement Realtime ------------------------------------------
  const subscribe = useCallback((sessionId) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel(`play_session_${sessionId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'play_sessions', filter: `id=eq.${sessionId}` },
        (payload) => { setSession(payload.new); refetchTotals(sessionId, payload.new?.current_game); })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'play_session_players', filter: `session_id=eq.${sessionId}` },
        () => refetchPlayers(sessionId))
      .subscribe();
    channelRef.current = ch;
  }, [supabase, refetchTotals, refetchPlayers]);

  // ---- rejoindre une partie (membre, ou invité avec son prénom) ------
  const joinNow = useCallback(async (guestName, code) => {
    const theCode = (code || joinCode || '').toUpperCase();
    const { error: e } = await supabase.rpc('join_session', {
      p_join_code: theCode,
      p_guest_name: currentUser ? null : ((guestName && guestName.trim()) || 'Invité'),
    });
    if (e) throw e;
    const { data: sess } = await supabase.from('play_sessions')
      .select('*').eq('join_code', theCode).single();
    if (!sess) throw new Error('Partie introuvable');
    setSession(sess);
    await refetchPlayers(sess.id);
    await refetchTotals(sess.id);
    subscribe(sess.id);
  }, [supabase, joinCode, currentUser, refetchPlayers, refetchTotals, subscribe]);

  useEffect(() => () => { if (channelRef.current) supabase.removeChannel(channelRef.current); }, [supabase]);

  // Au retour au premier plan (téléphone déverrouillé, onglet réactivé), le canal
  // temps réel a pu être coupé : on resynchronise l'état et on réabonne.
  useEffect(() => {
    const sid0 = session?.id;
    if (!sid0) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      refetchSession(sid0);
      refetchPlayers(sid0);
      refetchTotals(sid0);
      subscribe(sid0);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [session?.id, refetchSession, refetchPlayers, refetchTotals, subscribe]);

  // (4) Un autre appareil a enchaine sur un nouveau jeu : on suit sans rien
  // demander. C'est tout l'interet -- personne n'a a ressaisir quoi que ce soit.
  useEffect(() => {
    const nid = session?.next_session_id;
    if (!nid || nid === sid || switching) return undefined;
    let go = true;
    (async () => {
      const { data: s2 } = await supabase.from('play_sessions').select('id,join_code').eq('id', nid).maybeSingle();
      if (!go || !s2) return;
      try { await supabase.rpc('join_session', { p_join_code: s2.join_code, p_guest_name: null }); } catch (e) { /* deja present */ }
      if (!go) return;
      await switchToSession(nid);
    })();
    return () => { go = false; };
  }, [session?.next_session_id]); // eslint-disable-line

  // Recherche du jeu suivant.
  useEffect(() => {
    if (!nextPicker) return undefined;
    let go = true;
    const q = nextQuery.trim();
    const tid = setTimeout(async () => {
      const base = supabase.from('games').select('id,name,play_time,image_url,score_direction');
      const { data } = q
        ? await base.ilike('name', `%${q}%`).order('name').limit(12)
        : await base.order('name').limit(12);
      if (go) setNextHits(data || []);
    }, q ? 250 : 0);
    return () => { go = false; clearTimeout(tid); };
  }, [nextPicker, nextQuery, supabase]);

  // ---- horloge live (uniquement en partie) ---------------------------
  useEffect(() => {
    if (phase !== 'running' && phase !== 'lobby') return;
    if (scoreFor) return; // saisie de score en cours : on fige l'horloge pour des appuis instantanes
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [phase, scoreFor]);

  // ---- bascule de phase pilotée par le statut de session -------------
  useEffect(() => {
    if (!session) return;
    if (session.status === 'running' || session.status === 'paused') setPhase('running');
    else if (session.status === 'done') {
      setPhase('done');
      supabase.from('v_session_summary').select('*').eq('id', session.id).single()
        .then(({ data }) => { if (data) setSummary(data); })
        .catch(() => {});
    } else if (session.status === 'lobby') setPhase('lobby');
  }, [session?.status, supabase]); // eslint-disable-line

  // ---- initialisation ------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const uid = await ensureAuth();
        if (cancelled) return;
        setMyUid(uid);

        if (joinCode) {
          // flux JOINEUR
          if (!currentUser) { if (!cancelled) setPhase('ask-name'); return; } // invité : on demande son prénom d'abord
          await joinNow(null); // membre connecté : rejoint directement
          return; // la phase suivra session.status
        }

        // flux HÔTE -> setup
        if (eventId) {
          // (1) Un chrono tourne peut-etre deja pour ce moment : on le proposera
          // en haut de l'ecran de preparation, pour rejoindre au lieu de doubler.
          const { data: act } = await supabase.from('play_sessions')
            .select('id,join_code,status,game_id,created_at,host_profile_id')
            .eq('event_id', eventId).in('status', ['lobby', 'running'])
            .order('created_at', { ascending: false });
          if ((act || []).length) {
            const gIds2 = [...new Set(act.map((x) => x.game_id).filter(Boolean))];
            const hIds = [...new Set(act.map((x) => x.host_profile_id).filter(Boolean))];
            const [{ data: gs }, { data: hs }, { data: cnt }] = await Promise.all([
              gIds2.length ? supabase.from('games').select('id,name,image_url').in('id', gIds2) : Promise.resolve({ data: [] }),
              hIds.length ? supabase.from('profiles').select('id,name').in('id', hIds) : Promise.resolve({ data: [] }),
              supabase.from('play_session_players').select('session_id').in('session_id', act.map((x) => x.id)),
            ]);
            const gByI = {}; (gs || []).forEach((g) => { gByI[g.id] = g; });
            const hByI = {}; (hs || []).forEach((h) => { hByI[h.id] = h.name; });
            const nBy = {}; (cnt || []).forEach((r) => { nBy[r.session_id] = (nBy[r.session_id] || 0) + 1; });
            if (!cancelled) setEventSessions(act.map((x) => ({
              ...x,
              gameName: gByI[x.game_id]?.name || 'Partie',
              gameImg: gByI[x.game_id]?.image_url || null,
              hostName: hByI[x.host_profile_id] || 'un membre',
              nPlayers: nBy[x.id] || 0,
            })));
          }

          const { data: eg } = await supabase.from('event_games').select('game_id').eq('event_id', eventId);
          const gIds = [...new Set((eg || []).map((r) => r.game_id))];
          let gamesData = [];
          if (gIds.length) {
            const { data } = await supabase.from('games')
              .select('id,name,play_time,image_url,score_direction').in('id', gIds);
            gamesData = data || [];
          }
          setEventGames(gamesData);
          const first = gamesData[0] || null;
          setGame(first);
          setBoxMin(first?.play_time ? String(first.play_time) : '');

          // (14) Tous les participants du moment jeux sont pre-ajoutes a la partie :
          // les membres inscrits (event_players), les membres invites en attente et
          // les invites non-membres (event_guests). On peut ensuite en retirer
          // librement depuis l'ecran de preparation.
          const [{ data: eplayers }, { data: eguests }] = await Promise.all([
            supabase.from('event_players').select('user_id').eq('event_id', eventId),
            supabase.from('event_guests').select('member_id,guest_name').eq('event_id', eventId),
          ]);
          const memberIds = [...new Set([
            ...(eplayers || []).map((r) => r.user_id),
            ...(eguests || []).map((r) => r.member_id),
          ].filter(Boolean))];
          let pById = {};
          if (memberIds.length) {
            const { data } = await supabase.from('profiles').select('id,name,avatar_url').in('id', memberIds);
            (data || []).forEach((p) => { pById[p.id] = p; });
          }
          const pre = [];
          memberIds.forEach((id) => {
            if (id === currentUser?.id) return;              // l'hote est deja dans la partie
            pre.push({ key: `m${id}`, profileId: id, guestName: null,
              name: pById[id]?.name || 'Membre', avatar_url: pById[id]?.avatar_url || null });
          });
          (eguests || []).forEach((g, i) => {
            if (g.member_id || !g.guest_name) return;        // deja traite comme membre
            pre.push({ key: `g${i}`, profileId: null, guestName: g.guest_name,
              name: g.guest_name, avatar_url: null });
          });
          setDraft(pre);
        } else if (gameId) {
          const { data: g } = await supabase.from('games')
            .select('id,name,play_time,image_url,score_direction').eq('id', gameId).single();
          setGame(g);
          setBoxMin(g?.play_time ? String(g.play_time) : '');
          setDraft([]);
        }
        if (!cancelled) setPhase('setup');
      } catch (err) {
        if (!cancelled) { setError(err.message || String(err)); setPhase('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  // ---- recherche de membres (flux fiche de jeu) ----------------------
  useEffect(() => {
    if (!memberQuery.trim()) { setMemberHits([]); return; }
    let go = true;
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles')
        .select('id,name,avatar_url').ilike('name', `%${memberQuery.trim()}%`).limit(8);
      if (go) setMemberHits(data || []);
    }, 250);
    return () => { go = false; clearTimeout(t); };
  }, [memberQuery, supabase]);

  // ---- actions -------------------------------------------------------
  const addGuestDraft = () => {
    const n = guestInput.trim();
    if (!n) return;
    setDraft((d) => [...d, { key: `g${Date.now()}`, profileId: null, guestName: n, name: n, avatar_url: null }]);
    setGuestInput('');
  };
  const addMemberDraft = (m) => {
    if (draft.some((d) => d.profileId === m.id) || m.id === currentUser?.id) return;
    setDraft((d) => [...d, { key: `m${m.id}`, profileId: m.id, guestName: null, name: m.name, avatar_url: m.avatar_url }]);
    setMemberQuery(''); setMemberHits([]);
  };
  const removeDraft = (key) => setDraft((d) => d.filter((x) => x.key !== key));

  const createSession = async () => {
    try {
      setError(null);
      if (!game) throw new Error('Choisis un jeu');
      const { data, error: e } = await supabase.rpc('create_session', {
        p_game_id: game.id,
        p_event_id: eventId || null,
        p_box_duration_min: boxMin ? parseInt(boxMin, 10) : null,
      });
      if (e) throw e;
      const row = Array.isArray(data) ? data[0] : data;
      const sessionId = row.session_id;
      for (const d of draft) {
        if (d.profileId && d.profileId === currentUser?.id) continue; // hôte déjà ajouté
        await supabase.rpc('add_player', {
          p_session_id: sessionId,
          p_profile_id: d.profileId,
          p_guest_name: d.guestName,
        });
      }
      const sess = await refetchSession(sessionId);
      await refetchPlayers(sessionId);
      await refetchTotals(sessionId);
      subscribe(sessionId);
      if (sess?.status === 'lobby') setPhase('lobby');
    } catch (err) { setError(err.message || String(err)); }
  };

  // Un joueur qui rejoint via un code n'a pas charge la fiche du jeu :
  // on la recupere pour connaitre le sens du score.
  useEffect(() => {
    if (game || !session?.game_id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('games')
        .select('id,name,play_time,image_url,score_direction').eq('id', session.game_id).single();
      if (!cancelled && data) setGame(data);
    })();
    return () => { cancelled = true; };
  }, [game, session?.game_id]); // eslint-disable-line

  // Le sens du score suit la fiche du jeu (par defaut : le plus grand gagne).
  useEffect(() => {
    setScoreDir(game?.score_direction === 'low' ? 'low' : 'high');
    setWinnersTouched(false);
  }, [game?.id, game?.score_direction]);

  // Cle stable des scores : evite de recalculer a chaque synchro Realtime.
  const scoreKey = players.map((p) => `${p.id}:${p.score || 0}`).join('|');
  const anyScore = players.some((p) => (p.score || 0) !== 0);

  // Vainqueur(s) deduits des scores, selon le sens choisi.
  const autoWinners = useMemo(() => {
    if (!anyScore || !players.length) return [];
    const vals = players.map((p) => p.score || 0);
    const best = scoreDir === 'low' ? Math.min(...vals) : Math.max(...vals);
    return players.filter((p) => (p.score || 0) === best).map((p) => p.id);
  }, [scoreKey, scoreDir, anyScore]); // eslint-disable-line

  const sameIds = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

  // Pre-selection automatique du vainqueur en fin de partie, tant que
  // l'utilisateur n'a pas fait de choix manuel.
  useEffect(() => {
    if (phase !== 'done' || winnersTouched) return;
    setWinnerIds((prev) => (sameIds(prev, autoWinners) ? prev : autoWinners));
  }, [phase, autoWinners, winnersTouched]);

  // Changer le sens du score : on recalcule le vainqueur et on met a jour
  // la fiche du jeu (RPC dediee : la RLS de "games" reserve l'ecriture aux
  // proprietaires, or n'importe quel membre peut lancer un chrono).
  const changeScoreDir = async (d) => {
    setScoreDir(d);
    setWinnersTouched(false);
    if (!game?.id || !currentUser || game.score_direction === d) return;
    try {
      await supabase.rpc('set_game_score_direction', { p_game_id: game.id, p_direction: d });
      setGame((g) => (g ? { ...g, score_direction: d } : g));
    } catch (e) { /* le chrono ne doit jamais bloquer sur ce point */ }
  };

  const rpc = async (fn, args) => {
    try { setError(null); const { error: e } = await supabase.rpc(fn, args); if (e) throw e; }
    catch (err) { setError(err.message || String(err)); }
  };
  const start = () => rpc('start_session', { p_session_id: sid });
  const claim = (playerId) => rpc('claim_turn', { p_session_id: sid, p_player_id: playerId });
  const toggleNeutral = () => rpc('toggle_neutral', { p_session_id: sid });
  const nextRound = () => rpc('next_round', { p_session_id: sid });
  const openNewGame = () => { setNewGameWinners(autoWinners); setNewGamePrompt(true); };
  const toggleNewGameWinner = (pid) => setNewGameWinners((w) => (w.includes(pid) ? w.filter((x) => x !== pid) : [...w, pid]));
  const [newGameBusy, setNewGameBusy] = useState(false);
  const confirmNewGame = async () => { if (newGameBusy) return; setNewGameBusy(true); try { await rpc('new_game', { p_session_id: sid, p_winner_ids: newGameWinners }); for (const p of players) { if ((p.score || 0) !== 0) await supabase.rpc('set_player_score', { p_session_id: sid, p_player_id: p.id, p_score: 0 }); } await refetchPlayers(sid); } finally { setNewGameBusy(false); } setNewGamePrompt(false); setNewGameWinners([]); };
  const quitNoSave = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Quitter le chrono sans rien enregistrer ? La partie sera supprimee (aucune duree, aucun resultat).')) return;
    if (isHost && sid) { try { await supabase.rpc('abandon_session', { p_session_id: sid }); } catch (e) {} }
    onExit();
  };
  const end = () => { if (window.confirm('Terminer la partie ?')) rpc('end_session', { p_session_id: sid }); };
  const toggleWinner = (pid) => { setWinnersTouched(true); setWinnerIds((w) => (w.includes(pid) ? w.filter((x) => x !== pid) : [...w, pid])); };
  const saveResultAndExit = async () => {
    setSavingResult(true); setError(null);
    const { error: e } = await supabase.rpc('record_session_result', { p_session_id: sid, p_winner_ids: winnerIds });
    setSavingResult(false);
    if (e) { setError(e.message || String(e)); return; }
    onExit();
  };
  // (4) Reprendre la main sur une autre session : on remet a zero tout ce qui
  // appartenait a la partie precedente (chronos, vainqueurs, recap).
  const switchToSession = useCallback(async (nid) => {
    setSummary(null); setWinnerIds([]); setWinnersTouched(false);
    setTotals({}); setOpenSegs({}); setNewGamePrompt(false); setNewGameWinners([]);
    setScoreFor(null); setResultSaved(false); setGame(null); setError(null);
    const s2 = await refetchSession(nid);
    await refetchPlayers(nid);
    await refetchTotals(nid);
    subscribe(nid);
    setPhase(s2?.status === 'lobby' ? 'lobby' : 'running');
  }, [refetchSession, refetchPlayers, refetchTotals, subscribe]);

  // (4) L'hote choisit le jeu suivant : nouvelle session, memes joueurs,
  // memes equipes, memes couleurs. Les autres appareils suivent tout seuls
  // grace au chainage next_session_id.
  const continueWithGame = async (g) => {
    if (switching) return;
    setSwitching(true); setError(null);
    try {
      // 1. Le resultat de la partie qui s'acheve doit etre enregistre d'abord.
      if (!resultSaved) {
        const { error: e0 } = await supabase.rpc('record_session_result', { p_session_id: sid, p_winner_ids: winnerIds });
        if (e0) throw e0;
        setResultSaved(true);
      }
      // 2. Nouvelle session sur le meme moment jeux (s'il y en a un).
      const { data, error: e1 } = await supabase.rpc('create_session', {
        p_game_id: g.id,
        p_event_id: session?.event_id || null,
        p_box_duration_min: g.play_time || null,
      });
      if (e1) throw e1;
      const row = Array.isArray(data) ? data[0] : data;
      const nid = row.session_id;

      // 3. On recopie les joueurs (add_player dedoublonne les membres).
      for (const p of players) {
        if (p.profile_id && p.profile_id === myUid) continue; // l'hote est deja la
        await supabase.rpc('add_player', {
          p_session_id: nid, p_profile_id: p.profile_id || null, p_guest_name: p.guest_name || null,
        });
      }
      // 4. ... puis leurs equipes et leurs couleurs.
      const { data: np } = await supabase.from('play_session_players')
        .select('id,profile_id,guest_name').eq('session_id', nid);
      for (const p of players) {
        if (p.team == null && !p.color) continue;
        const m = (np || []).find((x) => (p.profile_id ? x.profile_id === p.profile_id : x.guest_name === p.guest_name));
        if (!m) continue;
        if (p.team != null) await supabase.rpc('aladj_set_player_team', { p_session_id: nid, p_player_id: m.id, p_team: p.team });
        if (p.color) await supabase.rpc('aladj_set_player_color', { p_session_id: nid, p_player_id: m.id, p_color: p.color });
      }
      // 5. On designe la suite : les telephones deja connectes basculent seuls.
      await supabase.rpc('aladj_link_next_session', { p_old: sid, p_new: nid });

      setNextPicker(false); setNextQuery(''); setNextHits([]);
      await switchToSession(nid);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSwitching(false);
    }
  };

  const movePlayer = (playerId, up) => rpc('move_player', { p_session_id: sid, p_player_id: playerId, p_up: up });
  const togglePhase = (ph) => rpc('toggle_phase', { p_session_id: sid, p_phase: ph });
  const simulEnter = () => rpc('simul_enter', { p_session_id: sid });
  const simulToggle = (playerId) => rpc('simul_toggle', { p_session_id: sid, p_player_id: playerId });
  const simulResumeAll = () => rpc('simul_resume_all', { p_session_id: sid });
  const simulExit = () => rpc('simul_exit', { p_session_id: sid });

  const addPlayerLive = async (profileId, guestName) => {
    await rpc('add_player', { p_session_id: sid, p_profile_id: profileId || null, p_guest_name: guestName || null });
  };

  // ---- score en direct (partage entre tous les telephones) -----------
  // (2) Mode equipe : un score saisi pour un joueur est reporte a l'identique
  // sur ses coequipiers. C'est bien le meme score, pas une somme : une equipe
  // marque des points ensemble.
  const setPlayerScore = async (playerId, score) => {
    const me = players.find((p) => p.id === playerId);
    const targets = (me && me.team != null)
      ? players.filter((p) => p.team === me.team)
      : (me ? [me] : []);
    const ids = targets.map((p) => p.id);
    setPlayers((ps) => ps.map((p) => (ids.includes(p.id) ? { ...p, score } : p))); // optimiste
    for (const id of ids) {
      await rpc('set_player_score', { p_session_id: sid, p_player_id: id, p_score: score });
    }
  };

  // ---- equipes et couleurs -------------------------------------------
  const setPlayerTeam = async (playerId, team) => {
    setPlayers((ps) => ps.map((p) => (p.id === playerId ? { ...p, team } : p)));
    await rpc('aladj_set_player_team', { p_session_id: sid, p_player_id: playerId, p_team: team });
    // Un joueur qui rejoint une equipe adopte aussitot le score de celle-ci.
    if (team != null) {
      const mate = players.find((p) => p.id !== playerId && p.team === team);
      if (mate && (mate.score || 0) !== 0) {
        setPlayers((ps) => ps.map((p) => (p.id === playerId ? { ...p, score: mate.score } : p)));
        await rpc('set_player_score', { p_session_id: sid, p_player_id: playerId, p_score: mate.score });
      }
    }
  };
  const setPlayerColor = async (playerId, color) => {
    setPlayers((ps) => ps.map((p) => (p.id === playerId ? { ...p, color } : p)));
    await rpc('aladj_set_player_color', { p_session_id: sid, p_player_id: playerId, p_color: color });
  };

  // Y a-t-il des equipes ? On le deduit des joueurs : aucun reglage a stocker
  // en plus, et tous les appareils sont d'accord sans synchronisation dediee.
  const teamsOn = players.some((p) => p.team != null);

  /* Attribution des couleurs, dans cet ordre :
       1. la couleur choisie a la main pour cette partie ;
       2. la premiere couleur preferee du profil encore libre ;
       3. la premiere couleur libre de la palette.
     Le premier arrive garde sa couleur : c'est ce qui produit le repli sur la
     2e ou 3e preference en cas de concurrence. */
  const colorKeyOf = useMemo(() => {
    const taken = new Set();
    const map = {};
    players.forEach((p) => { if (p.color) { map[p.id] = p.color; taken.add(p.color); } });
    players.forEach((p) => {
      if (map[p.id]) return;
      const fav = (p.favColors || []).find((k) => k && !taken.has(k));
      if (fav) { map[p.id] = fav; taken.add(fav); }
    });
    players.forEach((p, i) => {
      if (map[p.id]) return;
      const free = GAME_COLORS.find((c) => !taken.has(c.key));
      map[p.id] = free ? free.key : GAME_COLORS[i % GAME_COLORS.length].key;
      taken.add(map[p.id]);
    });
    return map;
  }, [players]);

  // En mode equipe, toute l'equipe prend la couleur de son premier membre.
  const teamColorKey = useMemo(() => {
    const m = {};
    players.forEach((p) => {
      if (p.team == null) return;
      if (m[p.team] === undefined) m[p.team] = colorKeyOf[p.id];
    });
    return m;
  }, [players, colorKeyOf]);

  const hexFor = (p) => hexOfColor(
    (teamsOn && p.team != null && teamColorKey[p.team]) ? teamColorKey[p.team] : colorKeyOf[p.id]
  ) || ACCENTS[0];

  // ---- temps affichés ------------------------------------------------
  const liveExtra = useCallback((pid) => {
    if (!session || session.status !== 'running') return 0;
    if (session.timer_mode === 'simul') {
      const st = openSegs[pid];
      return st ? Math.max(0, (now - new Date(st).getTime()) / 1000) : 0;
    }
    if (session.neutral_active) return 0;
    if (session.current_player_id !== pid || !session.current_turn_started_at) return 0;
    return (now - new Date(session.current_turn_started_at).getTime()) / 1000;
  }, [session, now, openSegs]);
  const shown = (pid) => (totals[pid]?.total || 0) + liveExtra(pid);

  const joinLink = useMemo(() => {
    if (!session?.join_code || typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}?chrono=${session.join_code}`;
  }, [session?.join_code]);

  // =====================================================================
  //  RENDU
  // =====================================================================
  // On ne maintient l'ecran allume que quand une partie est reellement en cours
  // ou sur le point de commencer : inutile de vider la batterie sur l'ecran final.
  const wake = useKeepAwake(keepAwake && (phase === 'running' || phase === 'lobby'));

  // Nombre de points de regle du jeu, pour la pastille du bouton.
  useEffect(() => {
    const gid = game?.id || session?.game_id;
    if (!gid) { setRulesCount(null); return undefined; }
    let go = true;
    (async () => {
      const { count } = await supabase.from('game_rules').select('id', { count: 'exact', head: true }).eq('game_id', gid);
      if (go) setRulesCount(count || 0);
    })();
    return () => { go = false; };
  }, [supabase, game?.id, session?.game_id]);

  // Un administrateur peut corriger n'importe quel point de regle.
  useEffect(() => {
    if (!currentUser?.id) { setIsAdmin(false); return undefined; }
    let go = true;
    (async () => {
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', currentUser.id).maybeSingle();
      if (go) setIsAdmin(data?.is_admin === true);
    })();
    return () => { go = false; };
  }, [supabase, currentUser?.id]);

  const shell = (children, wide) => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, color: C.navy,
      // Vue tablette : on reste dans les tons chaleureux du site. Le fond bleu
      // nuit essaye precedemment ecrasait les couleurs des joueurs et jurait
      // avec le reste de l'application.
      background: wide
        ? 'radial-gradient(1100px 700px at 18% -18%, #FFFDF8 0%, #F8F1E4 52%, #EFE4D1 100%)'
        : C.cream,
      fontFamily: BODY, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      <div style={{ maxWidth: wide ? 1500 : 560, margin: '0 auto', padding: wide ? '14px 20px 22px' : '18px 16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: wide ? 26 : 22, color: C.navy }}>
            Chrono <span style={{ color: C.teal }}>ALADJ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {!(wide && phase === 'running') && (game?.id || session?.game_id) && phase !== 'loading' && phase !== 'error' && phase !== 'ask-name' && (
              <button onClick={() => setRulesOpen(true)} title="Points de regle de ce jeu"
                style={{
                  border: `1.5px solid ${C.teal}55`, background: `${C.teal}12`, color: C.teal,
                  borderRadius: 999, padding: '6px 12px', fontFamily: TITLE, fontWeight: 600,
                  fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                📖 Regles{rulesCount ? ` (${rulesCount})` : ''}
              </button>
            )}
            {wideScreen && phase !== 'loading' && phase !== 'error' && phase !== 'ask-name' && (
              <button onClick={() => setTabletPref(tablet ? false : true)}
                title={tablet ? 'Revenir a la disposition telephone' : 'Passer en disposition tablette'}
                style={{
                  border: `1.5px solid ${tablet ? C.teal : '#d9cdb6'}`, background: tablet ? 'rgba(30,138,138,.12)' : '#fff',
                  color: tablet ? C.teal : `${C.navy}88`, borderRadius: 999, padding: '6px 12px',
                  fontFamily: TITLE, fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                {tablet ? '📱 Vue téléphone' : '🖥️ Vue tablette'}
              </button>
            )}
            {!(wide && phase === 'running') && wake.supported && (phase === 'running' || phase === 'lobby') && (
              <button onClick={() => setKeepAwake((v) => !v)}
                title={keepAwake ? "L'ecran reste allume pendant la partie - toucher pour laisser le telephone se mettre en veille" : "Empecher la mise en veille pendant la partie"}
                style={{
                  border: `1.5px solid ${wake.active ? C.amber : '#d9cdb6'}`, background: wake.active ? '#FDF4E0' : '#fff',
                  color: wake.active ? '#8a6a1f' : `${C.navy}88`, borderRadius: 999, padding: '6px 12px',
                  fontFamily: TITLE, fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                {wake.active ? '\u2600\ufe0f Ecran allume' : '\ud83c\udf19 Veille normale'}
              </button>
            )}
            <button onClick={quitNoSave} style={{ ...btnGhost, fontSize: wide ? 17 : 15 }}>Quitter</button>
          </div>
        </div>
        {error && (
          <div style={{ background: '#fdecee', color: C.red, border: `1px solid ${C.red}33`,
            borderRadius: 12, padding: '10px 12px', marginBottom: 12, fontWeight: 600 }}>
            {error}
          </div>
        )}
        {children}
      </div>
      {nextPicker && (
        <NextGameSheet
          eventGames={eventGames}
          hits={nextHits}
          query={nextQuery}
          onQuery={setNextQuery}
          busy={switching}
          onPick={continueWithGame}
          onClose={() => { if (!switching) { setNextPicker(false); setNextQuery(''); } }}
        />
      )}
      {colorFor && (
        <ColorSheet
          player={players.find((p) => p.id === colorFor)}
          currentKey={colorKeyOf[colorFor]}
          takenKeys={players.filter((p) => p.id !== colorFor).map((p) => colorKeyOf[p.id])}
          onPick={(k) => { setPlayerColor(colorFor, k); setColorFor(null); }}
          onClose={() => setColorFor(null)}
        />
      )}
      {teamsOpen && (
        <TeamsSheet
          players={players}
          hexFor={hexFor}
          onSet={setPlayerTeam}
          onClose={() => setTeamsOpen(false)}
        />
      )}
      {switching && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1400, background: 'rgba(60,45,25,.45)', display: 'grid', placeItems: 'center' }}>
          <div style={{ background: C.cream, color: C.navy, borderRadius: 18, padding: '18px 26px', fontFamily: TITLE, fontWeight: 600, fontSize: 18 }}>
            Préparation du jeu suivant…
          </div>
        </div>
      )}
      {rulesOpen && (game?.id || session?.game_id) && (
        <RulesSheet
          supabase={supabase}
          currentUser={currentUser}
          isAdmin={isAdmin}
          gameId={game?.id || session?.game_id}
          gameName={game?.name || ''}
          onClose={() => setRulesOpen(false)}
          onCount={setRulesCount}
        />
      )}
    </div>
  );

  if (phase === 'loading') return shell(<Centered>Connexion…</Centered>);
  if (phase === 'error') return shell(<Centered><button style={btnPrimary} onClick={onExit}>Retour</button></Centered>);

  if (phase === 'ask-name') {
    const go = () => {
      if (!pendingName.trim()) return;
      setPhase('loading');
      joinNow(pendingName).catch((err) => { setError(err.message || String(err)); setPhase('error'); });
    };
    return shell(
      <div>
        <Label>Ton prénom</Label>
        <p style={{ fontSize: 13, color: '#1A3A5C99', margin: '2px 0 12px' }}>Pour te différencier des autres joueurs à table.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input autoFocus value={pendingName} placeholder="Ex. Camille" style={{ ...input, flex: 1 }}
            onChange={(e) => setPendingName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') go(); }} />
          <button style={btnPrimary} onClick={go}>Rejoindre</button>
        </div>
      </div>
    );
  }

  // ---------- SETUP ----------
  if (phase === 'setup') {
    return shell(
      <div>
        {eventSessions.length > 0 && (
          <Card>
            <Label>{eventSessions.length > 1 ? 'Des chronos tournent deja' : 'Un chrono tourne deja'}</Label>
            <p style={{ fontSize: 13, color: `${C.navy}99`, margin: '2px 0 10px' }}>
              Sur ce moment jeux. Rejoignez plutot que de lancer un second chrono sur la meme table.
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {eventSessions.map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', border: `1.5px solid ${C.teal}44`, borderRadius: 13, padding: '9px 11px' }}>
                  {s.gameImg
                    ? <img src={s.gameImg} alt="" style={{ width: 42, height: 42, borderRadius: 9, objectFit: 'cover', flex: '0 0 auto' }} />
                    : <span style={{ width: 42, height: 42, borderRadius: 9, background: C.teal, flex: '0 0 auto' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 15.5, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.gameName}</div>
                    <div style={{ fontSize: 12, color: `${C.navy}99` }}>
                      lance par {s.hostName} · {s.nPlayers} joueur{s.nPlayers > 1 ? 's' : ''} · {s.status === 'running' ? 'en cours' : 'en attente'}
                    </div>
                  </div>
                  <button style={{ ...btnPrimary, flex: '0 0 auto', padding: '9px 14px', fontSize: 14 }}
                    onClick={() => {
                      setPhase('loading');
                      joinNow(null, s.join_code).catch((err) => { setError(err.message || String(err)); setPhase('setup'); });
                    }}>
                    Rejoindre
                  </button>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 12.5, color: `${C.navy}77`, marginTop: 12, fontWeight: 700 }}>
              — ou lancez une nouvelle partie ci-dessous —
            </div>
          </Card>
        )}
        <Card>
          <Label>Jeu</Label>
          {eventGames.length > 1 ? (
            <select value={game?.id || ''} style={input}
              onChange={(e) => { const g = eventGames.find((x) => x.id === e.target.value); setGame(g); setBoxMin(g?.play_time ? String(g.play_time) : ''); }}>
              {eventGames.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {game?.image_url && <img src={game.image_url} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />}
              <div style={{ fontFamily: TITLE, fontSize: 19, fontWeight: 600 }}>{game?.name || '—'}</div>
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <Label>Durée indiquée sur la boîte (min)</Label>
            <input type="number" inputMode="numeric" value={boxMin} placeholder="ex. 90"
              onChange={(e) => setBoxMin(e.target.value)} style={input} />
          </div>
        </Card>

        <Card>
          <Label>Joueurs ({draft.length + 1})</Label>
          <PlayerRow color={ACCENTS[0]} name={`${currentUser?.name || 'Moi'} (hôte)`} avatar={currentUser?.avatar_url} />
          {draft.map((d, i) => (
            <PlayerRow key={d.key} color={ACCENTS[(i + 1) % ACCENTS.length]} name={d.name} avatar={d.avatar_url}
              onRemove={() => removeDraft(d.key)} />
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input value={guestInput} placeholder="Nom d'un invité" style={{ ...input, flex: 1 }}
              onChange={(e) => setGuestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGuestDraft()} />
            <button style={btnSecondary} onClick={addGuestDraft}>+ Invité</button>
          </div>
          <div style={{ marginTop: 8, position: 'relative' }}>
            <input value={memberQuery} placeholder="Chercher un membre…" style={input}
              onChange={(e) => setMemberQuery(e.target.value)} />
            {memberHits.length > 0 && (
              <div style={{ background: C.white, border: `1px solid ${C.navy}22`, borderRadius: 10, marginTop: 4, overflow: 'hidden' }}>
                {memberHits.map((m) => (
                  <div key={m.id} onClick={() => addMemberDraft(m)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', cursor: 'pointer' }}>
                    <Avatar name={m.name} url={m.avatar_url} color={C.teal} size={30} />
                    <span style={{ fontWeight: 600 }}>{m.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <button style={{ ...btnPrimary, width: '100%', marginTop: 6 }} onClick={createSession}>
          Créer la partie
        </button>
        <p style={{ fontSize: 13, color: `${C.navy}99`, textAlign: 'center', marginTop: 10 }}>
          Les autres joueurs pourront rejoindre depuis leur téléphone avec le code affiché ensuite.
        </p>
      </div>
    );
  }

  // ---------- LOBBY ----------
  if (phase === 'lobby') {
    return shell(
      <div>
        <Card>
          <Label>Code de la partie</Label>
          <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 46, letterSpacing: 6, color: C.teal, textAlign: 'center' }}>
            {session?.join_code}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button style={{ ...btnSecondary, flex: 1 }} onClick={() => navigator.clipboard?.writeText(session.join_code)}>Copier le code</button>
            <button style={{ ...btnSecondary, flex: 1 }} onClick={() => navigator.clipboard?.writeText(joinLink)}>Copier le lien</button>
          </div>
          <p style={{ fontSize: 13, color: `${C.navy}99`, marginTop: 8 }}>
            Chacun ouvre le lien (ou saisit le code) sur son téléphone pour suivre son propre temps.
          </p>
        </Card>

        <Card>
          <Label>Joueurs connectés ({players.length})</Label>
          {players.map((p, i) => (
            <PlayerRow key={p.id} color={ACCENTS[i % ACCENTS.length]} name={p.name} avatar={p.avatar_url}
              tag={p.auth_user_id ? null : 'sans tel'} />
          ))}
          <LiveAdd onAddGuest={(n) => addPlayerLive(null, n)} supabase={supabase} currentUser={currentUser} onAddMember={(m) => addPlayerLive(m.id, null)} />
        </Card>

        {isHost ? (
          <button style={{ ...btnPrimary, width: '100%' }} onClick={start}>Démarrer la partie</button>
        ) : (
          <Centered>En attente du démarrage par l'hôte…</Centered>
        )}
      </div>
    );
  }

  // ---------- RUNNING ----------
  if (phase === 'running') {
    const activeId = session?.current_player_id;
    const neutral = session?.neutral_active;
    const showHost = isHost && hostView;

    // Phases cumulées : chaque phase additionne son temps et peut être mise en pause / reprise.
    const activePhase = session?.active_phase || null;
    const simul = session?.timer_mode === 'simul';
    const segMs = session?.seg_started_at ? new Date(session.seg_started_at).getTime() : null;
    const liveSeg = (activePhase && segMs) ? Math.max(0, (now - segMs) / 1000) : 0;
    const setupTotal = (session?.setup_seconds || 0) + (activePhase === 'setup' ? liveSeg : 0);
    const playTotal = (session?.play_seconds || 0) + (activePhase === 'play' ? liveSeg : 0);
    const teardownTotal = (session?.teardown_seconds || 0) + (activePhase === 'teardown' ? liveSeg : 0);
    const hasPlayed = (session?.play_seconds || 0) > 0 || activePhase === 'play';
    const hasWrapped = (session?.teardown_seconds || 0) > 0 || activePhase === 'teardown';
    const gamePhase = hasWrapped ? 'wrap' : (hasPlayed ? 'play' : 'prep');
    const totalElapsed = playTotal; // « Durée de la partie » = uniquement le jeu

    // Un bouton de phase : en cours (clic = pause), en pause (clic = reprendre) ou à démarrer.
    const phaseBtn = (phase, labels, total, started, color, disabled) => {
      const running = activePhase === phase;
      const paused = !running && started;
      const label = running ? labels.running : (paused ? labels.paused : labels.idle);
      const bg = disabled ? '#9aa5b1' : (running ? color : (paused ? C.navyDeep : C.navy));
      return (
        <button onClick={disabled ? undefined : () => togglePhase(phase)} disabled={disabled} style={{
          width: '100%', border: 'none', borderRadius: 16, padding: '16px 14px',
          fontFamily: TITLE, fontWeight: 600, fontSize: 18, color: C.white, cursor: disabled ? 'default' : 'pointer',
          background: bg, opacity: disabled ? 0.5 : 1, boxShadow: disabled ? 'none' : '0 4px 0 rgba(0,0,0,0.12)', textAlign: 'center',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {running && <span style={{ fontSize: 14 }}>⏸</span>}
            {paused && <span style={{ fontSize: 14 }}>▶</span>}
            {label}
          </span>
          {(total > 0 || running) && <div style={{ fontFamily: BODY, fontSize: 26, fontWeight: 800, marginTop: 4 }}>{fmt(total)}</div>}
        </button>
      );
    };

    // ---------- disposition tablette (paysage) ----------
    // Pensee pour un iPad pose au milieu de la table : tout doit se lire a un
    // metre. Les tailles sont exprimees en vw/vh bornees par clamp() pour
    // grandir avec la dalle, et les cartes joueurs sont horizontales
    // (identite a gauche, score au centre, chrono a droite) plutot que
    // verticales -- c'est ce qui remplit vraiment la largeur.
    if (tablet) {
      const n = players.length || 1;
      // Hauteur d'une ligne joueur : on occupe la place disponible plutot que
      // de laisser du vide sous les cartes.
      const rows = n <= 4 ? n : Math.ceil(n / 2);
      const cols = n <= 4 ? 1 : 2;
      const rowH = `clamp(104px, calc((100vh - 420px) / ${rows}), 230px)`;

      const bigPhase = (ph, label, total, started, color, disabled) => {
        const running = activePhase === ph;
        const paused = !running && started;
        return (
          <button onClick={disabled ? undefined : () => togglePhase(ph)} disabled={disabled}
            style={{
              flex: 1, borderRadius: 20, padding: 'clamp(10px,1.3vw,18px) clamp(12px,1.6vw,22px)',
              textAlign: 'left', cursor: disabled ? 'default' : 'pointer', minWidth: 0,
              background: running ? `linear-gradient(140deg, ${color}, ${color}cc)` : '#fff',
              color: running ? '#fff' : C.navy,
              border: `2px solid ${running ? color : (paused ? `${color}66` : '#E7DCC7')}`,
              boxShadow: running ? `0 14px 30px -14px ${color}` : '0 2px 8px rgba(90,70,40,.07)',
              opacity: disabled ? .4 : 1, transition: 'background .2s, box-shadow .2s, border-color .2s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: TITLE, fontWeight: 600,
              fontSize: 'clamp(14px,1.35vw,21px)', opacity: running ? 1 : .75, letterSpacing: .2 }}>
              <span>{running ? '⏸' : (paused ? '▶' : '○')}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 'clamp(32px,3.9vw,62px)',
              lineHeight: 1.05, marginTop: 2, fontVariantNumeric: 'tabular-nums',
              color: running ? '#fff' : (started ? color : '#C9BBA2') }}>
              {fmt(total)}
            </div>
          </button>
        );
      };

      // Les accessoires sont de gros carres : sur une tablette, une pastille
      // fine se rate une fois sur deux.
      const tile = (icon, label, on, onClick, tint) => (
        <button onClick={onClick} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
          minHeight: 'clamp(74px,7.6vh,104px)', padding: '8px 10px', borderRadius: 18, cursor: 'pointer',
          border: `2px solid ${on ? (tint || C.teal) : '#E7DCC7'}`,
          background: on ? `${tint || C.teal}18` : '#fff',
          color: on ? (tint || C.teal) : C.navy,
          boxShadow: '0 2px 8px rgba(90,70,40,.07)', textAlign: 'center',
        }}>
          <span style={{ fontSize: 'clamp(20px,1.9vw,28px)', lineHeight: 1 }}>{icon}</span>
          <span style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 'clamp(12px,1.05vw,16px)', lineHeight: 1.2 }}>{label}</span>
        </button>
      );

      return shell(
        <div>
          {scoreFor && (() => {
            const sp = players.find((p) => p.id === scoreFor);
            return sp ? (
              <ScorePad key={sp.id} name={sp.name + (sp.team != null ? ` · équipe ${TEAM_LETTERS[sp.team]}` : '')} initialScore={sp.score || 0}
                onClose={() => setScoreFor(null)}
                onApply={(v) => { setPlayerScore(sp.id, v); setScoreFor(null); }} />
            ) : null;
          })()}

          {/* Trois grands blocs de phase */}
          <div style={{ display: 'flex', gap: 'clamp(8px,1vw,14px)', marginBottom: 'clamp(8px,1vw,14px)' }}>
            {bigPhase('setup', 'Mise en place', setupTotal, setupTotal > 0, C.teal, hasPlayed)}
            {bigPhase('play', 'Partie', playTotal, (session?.play_seconds || 0) > 0, C.amber, hasWrapped)}
            {bigPhase('teardown', 'Rangement', teardownTotal, teardownTotal > 0, C.purple, !hasPlayed)}
          </div>

          {/* Bandeau du jeu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff',
            border: '1px solid #E7DCC7', borderRadius: 18, padding: '10px clamp(12px,1.4vw,20px)',
            marginBottom: 'clamp(8px,1vw,14px)', boxShadow: '0 2px 8px rgba(90,70,40,.06)' }}>
            {game?.image_url
              ? <img src={game.image_url} alt="" style={{ width: 'clamp(46px,4vw,68px)', height: 'clamp(46px,4vw,68px)', borderRadius: 13, objectFit: 'cover', flex: '0 0 auto' }} />
              : <span style={{ width: 'clamp(46px,4vw,68px)', height: 'clamp(46px,4vw,68px)', borderRadius: 13, background: `linear-gradient(135deg,${C.teal},${C.navy})`, flex: '0 0 auto' }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 'clamp(20px,2.1vw,32px)', color: C.navy, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {game?.name || 'Partie en cours'}
              </div>
              <div style={{ fontSize: 'clamp(12px,1.05vw,16px)', color: '#9c8d79', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span>Partie {session?.current_game || 1}</span>
                {simul && <span style={{ color: C.purple, fontWeight: 700 }}>· Simultané</span>}
                {neutral && <span style={{ color: C.amber, fontWeight: 700 }}>· En pause</span>}
                {teamsOn && <span style={{ color: C.teal, fontWeight: 700 }}>· Mode équipe</span>}
                {session?.join_code && <span>· Code {session.join_code}</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
              <div style={{ fontSize: 'clamp(10px,.8vw,13px)', letterSpacing: 1, color: '#b6a78f', fontWeight: 700, textTransform: 'uppercase' }}>Durée de jeu</div>
              <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 'clamp(26px,2.6vw,42px)', color: C.navy, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalElapsed)}</div>
            </div>
          </div>

          {/* Cartes joueurs : identite / score / chrono */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap: 'clamp(8px,1vw,14px)', marginBottom: 'clamp(8px,1vw,14px)' }}>
            {players.map((p) => {
              const active = simul ? !!openSegs[p.id] : (activeId === p.id && !neutral && activePhase === 'play');
              const clickable = gamePhase === 'play';
              const hex = hexFor(p);
              const ink = active ? readableOn(hex) : C.navy;
              return (
                <div key={p.id}
                  onClick={clickable ? () => (simul ? simulToggle(p.id) : (active ? toggleNeutral() : claim(p.id))) : undefined}
                  style={{
                    position: 'relative', display: 'flex', alignItems: 'center', gap: 'clamp(10px,1.2vw,20px)',
                    minHeight: rowH, borderRadius: 20, padding: '10px clamp(12px,1.5vw,22px)',
                    cursor: clickable ? 'pointer' : 'default', overflow: 'hidden',
                    background: active ? `linear-gradient(115deg, ${hex}, ${hex}d0)` : '#fff',
                    border: `2px solid ${active ? hex : '#E7DCC7'}`,
                    boxShadow: active ? `0 16px 36px -16px ${hex}` : '0 2px 8px rgba(90,70,40,.07)',
                    transition: 'background .18s, box-shadow .18s, border-color .18s',
                  }}>
                  {/* Bande de couleur : l'identite visuelle reste lisible meme carte inactive */}
                  {!active && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 7, background: hex }} />}

                  {/* Identite */}
                  <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 6, width: 'clamp(112px,12vw,208px)', marginLeft: active ? 0 : 6 }}>
                    <Avatar name={p.name} url={p.avatar_url} color={hex} size={78} />
                    <span style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 'clamp(19px,2.05vw,34px)',
                      lineHeight: 1.1, color: ink, textAlign: 'center', maxWidth: '100%',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    {p.team != null && (
                      <span style={{ fontSize: 'clamp(11px,1.05vw,17px)', fontWeight: 800, letterSpacing: .4,
                        color: active ? ink : hex, opacity: .9 }}>ÉQUIPE {TEAM_LETTERS[p.team]}</span>
                    )}
                  </div>

                  {/* Score, au centre et en tres grand */}
                  <button onClick={(e) => { e.stopPropagation(); setScoreFor(p.id); }} title="Modifier le score"
                    style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', cursor: 'pointer',
                      padding: 0, color: ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: TITLE, fontWeight: 600, fontSize: `clamp(52px, ${n <= 4 ? '7.4vw' : '4.8vw'}, 128px)`,
                      lineHeight: .95, fontVariantNumeric: 'tabular-nums' }}>{p.score || 0}</span>
                    <span style={{ fontSize: 'clamp(12px,1.05vw,17px)', letterSpacing: 1.4, fontWeight: 700,
                      opacity: .55, textTransform: 'uppercase', marginTop: 2 }}>points</span>
                  </button>

                  {/* Chrono du joueur, a droite */}
                  <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                    justifyContent: 'center', gap: 3, width: 'clamp(118px,12vw,224px)' }}>
                    <span style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 'clamp(30px,3.15vw,58px)',
                      lineHeight: 1, color: ink, fontVariantNumeric: 'tabular-nums' }}>{fmt(shown(p.id))}</span>
                    {active
                      ? <span style={{ fontSize: 'clamp(11px,1.05vw,17px)', fontWeight: 800, letterSpacing: .8, color: ink, opacity: .85, textTransform: 'uppercase' }}>à lui de jouer</span>
                      : <span style={{ fontSize: 'clamp(11px,1.05vw,17px)', color: '#b6a78f', letterSpacing: .6, textTransform: 'uppercase', fontWeight: 700 }}>temps de jeu</span>}
                  </div>

                  {/* Pastille de couleur */}
                  <button onClick={(e) => { e.stopPropagation(); setColorFor(p.id); }} title="Changer la couleur"
                    style={{ position: 'absolute', top: 10, right: 12, width: 22, height: 22, borderRadius: 7,
                      cursor: 'pointer', background: hex, border: `2px solid ${active ? ink : '#fff'}`,
                      boxShadow: '0 0 0 1px rgba(0,0,0,.12)' }} />
                </div>
              );
            })}
          </div>

          {/* Accessoires et commandes, en gros carres */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(112px,11vw,168px), 1fr))', gap: 'clamp(8px,.9vw,12px)' }}>
            {tile('👥', teamsOn ? 'Équipes' : 'Mode équipe', teamsOn, () => setTeamsOpen(true))}
            {wake.supported && tile(wake.active ? '☀️' : '🌙', wake.active ? 'Écran allumé' : 'Veille normale', wake.active, () => setKeepAwake((v) => !v), C.amber)}
            {(game?.id || session?.game_id) && tile('📖', `Points de règle${rulesCount ? ` (${rulesCount})` : ''}`, false, () => setRulesOpen(true))}
            {isHost && gamePhase === 'play' && !simul && activePhase === 'play' && tile(neutral ? '▶' : '⏸', neutral ? 'Reprendre' : 'Pause', !!neutral, toggleNeutral, C.amber)}
            {isHost && gamePhase === 'play' && !simul && tile('🔁', 'Nouvelle manche', false, openNewGame)}
            {isHost && gamePhase === 'play' && !simul && tile('⚡', 'Tous en même temps', false, simulEnter, C.purple)}
            {isHost && gamePhase === 'play' && simul && tile('▶', 'Relancer tout le monde', true, simulResumeAll, C.purple)}
            {isHost && gamePhase === 'play' && simul && tile('↩', 'Mode normal', false, simulExit, C.purple)}
            {isHost && tile('🏁', 'Terminer la partie', false, end, C.red)}
          </div>

          {newGamePrompt && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(60,45,25,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <div style={{ background: C.cream, color: C.navy, borderRadius: 20, padding: 18, width: '100%', maxWidth: 460, maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 20, marginBottom: 4 }}>Manche terminée</div>
                <div style={{ fontSize: 13, color: `${C.navy}99`, marginBottom: 12 }}>
                  {anyScore ? 'Qui a gagné cette manche ? Le vainqueur est déduit des scores.' : 'Qui a gagné cette manche ? (laisse vide pour un coopératif)'}
                </div>
                <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                  {players.map((p) => {
                    const won = newGameWinners.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => { setWinnersTouched(true); toggleNewGameWinner(p.id); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, cursor: 'pointer',
                          border: won ? `2px solid ${C.amber}` : '1px solid #e6dcc9', background: won ? '#FDF4E0' : '#fff', textAlign: 'left' }}>
                        <Avatar name={p.name} url={p.avatar_url} color={hexFor(p)} size={30} />
                        <span style={{ fontWeight: 700, flex: 1, color: C.navy }}>{p.name}</span>
                        {(p.score || 0) !== 0 && <span style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 13, color: '#8a6a1f', background: '#FDF4E0', border: `1px solid ${C.amber}66`, borderRadius: 999, padding: '2px 9px' }}>{p.score} pts</span>}
                        <span style={{ fontSize: 19, opacity: won ? 1 : 0.3 }}>🏆</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ ...btnGhost, flex: 1 }} onClick={() => { setNewGamePrompt(false); setNewGameWinners([]); }}>Annuler</button>
                  <button style={{ ...btnPrimary, flex: 1, opacity: newGameBusy ? 0.6 : 1 }} onClick={confirmNewGame} disabled={newGameBusy}>{newGameBusy ? 'Enregistrement…' : 'Manche suivante →'}</button>
                </div>
              </div>
            </div>
          )}
        </div>,
        true
      );
    }

    return shell(
      <div>
        {scoreFor && (() => {
          const sp = players.find((p) => p.id === scoreFor);
          return sp ? (
            <ScorePad key={sp.id} name={sp.name} initialScore={sp.score || 0}
              onClose={() => setScoreFor(null)}
              onApply={(v) => { setPlayerScore(sp.id, v); setScoreFor(null); }} />
          ) : null;
        })()}
        {newGamePrompt && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(26,58,92,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: C.cream, borderRadius: 20, padding: 18, width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 20, color: C.navy, marginBottom: 4 }}>Partie terminee</div>
              <div style={{ fontSize: 13, color: `${C.navy}99`, marginBottom: 12 }}>
                {anyScore
                  ? "Qui a gagne cette partie ? Le vainqueur est deduit des scores, corrige-le si besoin."
                  : "Qui a gagne cette partie ? (laisse vide pour un jeu cooperatif - la partie sera quand meme comptee)"}
              </div>
              {anyScore && (
                <div style={{ marginBottom: 12 }}>
                  <ScoreDirPicker value={scoreDir} onChange={(d) => { changeScoreDir(d); }} saved={game?.score_direction} compact />
                </div>
              )}
              <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                {players.map((p, i) => {
                  const won = newGameWinners.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => { setWinnersTouched(true); toggleNewGameWinner(p.id); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, cursor: 'pointer',
                        border: won ? `2px solid ${C.amber}` : '1px solid #e6dcc9', background: won ? '#FDF4E0' : '#fff', textAlign: 'left' }}>
                      <Avatar name={p.name} url={p.avatar} color={p.color || ACCENTS[i % ACCENTS.length]} size={30} />
                      <span style={{ fontWeight: 700, flex: 1, color: C.navy }}>{p.name}</span>
                      {(p.score || 0) !== 0 && <span style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 13, color: '#8a6a1f', background: '#FDF4E0', border: `1px solid ${C.amber}66`, borderRadius: 999, padding: '2px 9px' }}>{p.score} pts</span>}
                      <span style={{ fontSize: 19, opacity: won ? 1 : 0.3 }}>🏆</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ ...btnGhost, flex: 1 }} onClick={() => { setNewGamePrompt(false); setNewGameWinners([]); }}>Annuler</button>
                <button style={{ ...btnPrimary, flex: 1, opacity: newGameBusy ? 0.6 : 1 }} onClick={confirmNewGame} disabled={newGameBusy}>{newGameBusy ? 'Enregistrement…' : 'Nouvelle partie →'}</button>
              </div>
            </div>
          </div>
        )}
        {/* Chrono de la partie : ne compte que le jeu */}
        <div style={{ textAlign: 'center', background: C.navy, color: C.white, borderRadius: 16, padding: '12px 16px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: 1, opacity: .75, fontWeight: 700, textTransform: 'uppercase' }}>Durée de la partie</div>
          <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 34, lineHeight: 1.1 }}>{fmt(totalElapsed)}</div>
          {gamePhase === 'prep' && <div style={{ fontSize: 12, opacity: .8, marginTop: 2 }}>La partie n'a pas encore démarré</div>}
        </div>

        {/* Boutons de phase (temps cumulé, pause / reprise) */}
        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          {phaseBtn('setup', { idle: 'Mise en place & explications', running: 'Mise en place en cours', paused: 'Reprendre la mise en place' }, setupTotal, setupTotal > 0, C.teal, hasPlayed)}
          {phaseBtn('play', { idle: 'Lancer la partie', running: 'Partie en cours', paused: 'Reprendre la partie' }, playTotal, (session?.play_seconds || 0) > 0, C.amber, hasWrapped)}
          {phaseBtn('teardown', { idle: 'Rangement', running: 'Rangement en cours', paused: 'Reprendre le rangement' }, teardownTotal, teardownTotal > 0, C.purple, !hasPlayed)}
        </div>

        {/* En-tête de manche (pendant le jeu) */}
        {gamePhase === 'play' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 700 }}>Partie {session?.current_game || 1}</span>
            {simul && <span style={{ background: C.purple, color: C.white, padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>Simultané</span>}
            {neutral && <span style={{ background: C.amber, color: C.white, padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>Pause</span>}
            {isHost && <button style={btnGhost} onClick={() => setHostView((v) => !v)}>{showHost ? 'Vue joueur' : 'Vue hôte'}</button>}
          </div>
        )}

        {/* Gros bouton « C'est mon tour » (jeu uniquement, si j'ai un siège sur ce device) */}
        {activePhase === 'play' && myPlayer && !showHost && (simul ? (
          <button
            onClick={() => simulToggle(myPlayer.id)}
            style={{
              width: '100%', border: 'none', borderRadius: 20, padding: '22px 16px', marginBottom: 16,
              fontFamily: TITLE, fontWeight: 600, fontSize: 22, color: C.white, cursor: 'pointer',
              background: openSegs[myPlayer.id] ? C.teal : C.navy, boxShadow: '0 6px 0 rgba(0,0,0,0.12)',
            }}>
            {openSegs[myPlayer.id] ? "Mon chrono tourne (appuie pour pause)" : "Mon chrono en pause (appuie pour repartir)"}
            <div style={{ fontFamily: BODY, fontSize: 32, marginTop: 6, fontWeight: 800 }}>{fmt(shown(myPlayer.id))}</div>
          </button>
        ) : (
          <button
            onClick={() => (activeId === myPlayer.id && !neutral ? toggleNeutral() : claim(myPlayer.id))}
            style={{
              width: '100%', border: 'none', borderRadius: 20, padding: '22px 16px', marginBottom: 16,
              fontFamily: TITLE, fontWeight: 600, fontSize: 22, color: C.white, cursor: 'pointer',
              background: (activeId === myPlayer.id && !neutral) ? C.teal : C.navy, boxShadow: '0 6px 0 rgba(0,0,0,0.12)',
            }}>
            {(activeId === myPlayer.id && !neutral) ? "À toi de jouer ! (appuie pour pause)" : "C'est mon tour"}
            <div style={{ fontFamily: BODY, fontSize: 32, marginTop: 6, fontWeight: 800 }}>{fmt(shown(myPlayer.id))}</div>
          </button>
        ))}

        {/* Tableau de bord des joueurs (cliquable uniquement pendant le jeu) */}
        <div style={{ display: 'grid', gridTemplateColumns: showHost ? '1fr 1fr' : '1fr', gap: 10 }}>
          {players.map((p, i) => {
            const active = simul ? !!openSegs[p.id] : (activeId === p.id && !neutral && activePhase === 'play');
            const clickable = activePhase === 'play';
            return (
              <div key={p.id}
                onClick={clickable ? () => (simul ? simulToggle(p.id) : (active ? toggleNeutral() : claim(p.id))) : undefined}
                style={{
                  background: C.white, borderRadius: 16, padding: '12px 14px',
                  border: `2px solid ${active ? hexFor(p) : `${hexFor(p)}40`}`,
                  boxShadow: active ? `0 0 0 3px ${hexFor(p)}22` : '0 1px 4px rgba(0,0,0,0.06)',
                  cursor: clickable ? 'pointer' : 'default', transition: 'border-color .15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={p.name} url={p.avatar_url} color={hexFor(p)} size={38} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: `${C.navy}88`, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span onClick={(e) => { e.stopPropagation(); setColorFor(p.id); }} title="Changer la couleur"
                        style={{ width: 11, height: 11, borderRadius: 3, background: hexFor(p), border: '1px solid rgba(0,0,0,.15)', cursor: 'pointer', flexShrink: 0 }} />
                      {p.team != null && <span style={{ fontWeight: 800 }}>Equipe {TEAM_LETTERS[p.team]}</span>}
                      {!p.auth_user_id && <span>sans tel</span>}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setScoreFor(p.id); }} title="Modifier le score"
                    style={{ border: `1.5px solid ${C.amber}`, background: '#FDF4E0', color: '#8a6a1f', borderRadius: 999,
                      padding: '5px 11px', fontFamily: TITLE, fontWeight: 600, fontSize: 15, cursor: 'pointer', flexShrink: 0 }}>
                    {p.score || 0} pt{Math.abs(p.score || 0) > 1 ? 's' : ''}
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); movePlayer(p.id, true); }} disabled={i === 0}
                      style={{ ...orderBtn, opacity: i === 0 ? 0.3 : 1 }} aria-label="Monter dans l'ordre">▲</button>
                    <button onClick={(e) => { e.stopPropagation(); movePlayer(p.id, false); }} disabled={i === players.length - 1}
                      style={{ ...orderBtn, opacity: i === players.length - 1 ? 0.3 : 1 }} aria-label="Descendre dans l'ordre">▼</button>
                  </div>
                </div>
                <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 26, marginTop: 6, color: active ? hexFor(p) : C.navy }}>
                  {fmt(shown(p.id))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contrôles hôte */}
        {isHost && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            <button style={{ ...btnSecondary, flex: 1 }} onClick={() => setTeamsOpen(true)}>{teamsOn ? 'Equipes' : 'Mode equipe'}</button>
            {gamePhase === 'play' && !simul && activePhase === 'play' && <button style={{ ...btnSecondary, flex: 1 }} onClick={toggleNeutral}>{neutral ? 'Reprendre' : 'Pause'}</button>}
            {gamePhase === 'play' && !simul && <button style={{ ...btnSecondary, flex: 1 }} onClick={openNewGame}>Nouvelle partie</button>}
            {gamePhase === 'play' && !simul && <button style={{ ...btnSecondary, flex: 1, background: C.purple, color: C.white }} onClick={simulEnter}>Tous en même temps</button>}
            {gamePhase === 'play' && simul && <button style={{ ...btnSecondary, flex: 1, background: C.teal, color: C.white }} onClick={simulResumeAll}>Relancer tout le monde</button>}
            {gamePhase === 'play' && simul && <button style={{ ...btnSecondary, flex: 1 }} onClick={simulExit}>Mode normal</button>}
            <button style={{ ...btnSecondary, flex: 1 }} onClick={quitNoSave}>Quitter sans enregistrer</button>
            <button style={{ ...btnDanger, flex: 1 }} onClick={end}>Terminer</button>
          </div>
        )}
      </div>
    );
  }

  // ---------- DONE ----------
  if (phase === 'done') {
    const ranked = [...players].sort((a, b) => (totals[b.id]?.total || 0) - (totals[a.id]?.total || 0));
    const playerTotal = ranked.reduce((s, p) => s + (totals[p.id]?.total || 0), 0) || 1;
    const real = summary?.real_duration_seconds;
    return shell(
      <div>
        <Card>
          <Label>Récap de la partie</Label>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
            <Stat label="Durée réelle" value={real ? fmt(real) : '—'} />
            <Stat label="Sur la boîte" value={summary?.box_duration_min ? `${summary.box_duration_min} min` : '—'} />
            <Stat label="Ratio" value={summary?.ratio_vs_box ? `×${summary.ratio_vs_box}` : '—'} color={summary?.ratio_vs_box >= 1.5 ? C.red : C.teal} />
          </div>
        </Card>
        <Card>
          <Label>Qui a remporté la partie ?</Label>
          {anyScore && (
            <div style={{ marginTop: 6, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #e6dcc9' }}>
              <ScoreDirPicker value={scoreDir} onChange={changeScoreDir} saved={game?.score_direction} />
            </div>
          )}
          <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
            {players.map((p, i) => {
              const won = winnerIds.includes(p.id);
              return (
                <button key={p.id} onClick={() => toggleWinner(p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, cursor: 'pointer',
                    border: won ? `2px solid ${C.amber}` : '1px solid #e6dcc9', background: won ? '#FDF4E0' : '#fff', textAlign: 'left' }}>
                  <Avatar name={p.name} url={p.avatar} color={p.color || ACCENTS[i % ACCENTS.length]} size={30} />
                  <span style={{ fontWeight: 700, flex: 1, color: C.navy }}>{p.name}</span>
                  {(p.score || 0) !== 0 && <span style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 13, color: '#8a6a1f', background: '#FDF4E0', border: `1px solid ${C.amber}66`, borderRadius: 999, padding: '2px 9px' }}>{p.score} pts</span>}
                  <span style={{ fontSize: 19, opacity: won ? 1 : 0.3 }}>🏆</span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: `${C.navy}99`, marginTop: 8 }}>
            {anyScore
              ? <>Le vainqueur est déduit des scores ({scoreDir === 'low' ? 'le plus petit' : 'le plus grand'} l'emporte) — tu peux le corriger à la main.{winnersTouched ? ' (choix manuel en cours)' : ''}</>
              : <>Laisse vide pour une partie sans vainqueur (coopératif) : elle sera quand même comptabilisée.</>}
          </div>
        </Card>
        <Card>
          <Label>Temps par joueur</Label>
          {ranked.map((p, i) => {
            const tot = totals[p.id]?.total || 0;
            const pct = Math.round((tot / playerTotal) * 100);
            return (
              <div key={p.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700 }}>{p.name}</span>
                  <span style={{ color: `${C.navy}aa` }}>{fmt(tot)} · {pct}%
                    {totals[p.id]?.max ? <span style={{ color: C.red }}> · pic {fmt(totals[p.id].max)}</span> : null}
                  </span>
                </div>
                <div style={{ height: 10, background: `${C.navy}14`, borderRadius: 8 }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 8, background: ACCENTS[i % ACCENTS.length] }} />
                </div>
              </div>
            );
          })}
        </Card>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={{ ...btnGhost, flex: '1 1 140px' }} onClick={onExit}>Fermer sans enregistrer</button>
          <button style={{ ...btnPrimary, flex: '1 1 180px' }} onClick={saveResultAndExit} disabled={savingResult || switching}>{savingResult ? 'Enregistrement…' : 'Enregistrer et quitter'}</button>
        </div>
        {isHost && (
          <button style={{ ...btnSecondary, width: '100%', marginTop: 10, background: C.teal, color: C.white, border: 'none' }}
            onClick={() => setNextPicker(true)} disabled={savingResult || switching}>
            🎲 Enregistrer et enchaîner un autre jeu
          </button>
        )}
        <p style={{ fontSize: 12.5, color: `${C.navy}99`, textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
          {isHost
            ? "Les mêmes joueurs, les mêmes équipes et les mêmes couleurs sont repris — et tous les téléphones déjà connectés basculent tout seuls sur le nouveau jeu."
            : "L'hôte peut enchaîner sur un autre jeu : votre écran suivra automatiquement."}
        </p>
      </div>
    );
  }

  return null;
}

// ---- choix du sens du score (le plus grand / le plus petit l'emporte) ----
/* Choisir le jeu suivant, sans quitter le chrono ni ressaisir les joueurs. */
function NextGameSheet({ eventGames, hits, query, onQuery, busy, onPick, onClose }) {
  const seen = new Set();
  const list = [];
  (eventGames || []).forEach((g) => { if (!seen.has(g.id)) { seen.add(g.id); list.push({ ...g, _fromEvent: true }); } });
  (hits || []).forEach((g) => { if (!seen.has(g.id)) { seen.add(g.id); list.push(g); } });

  return (
    <div onClick={busy ? undefined : onClose} style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(60,45,25,.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.cream, color: C.navy, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 700, maxHeight: '88vh', overflowY: 'auto', padding: '16px 16px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 20 }}>🎲 On enchaîne sur quoi ?</div>
          <button onClick={onClose} style={btnGhost} disabled={busy}>Fermer</button>
        </div>
        <p style={{ fontSize: 13.5, color: `${C.navy}99`, margin: '4px 0 14px', lineHeight: 1.55 }}>
          Le résultat de la partie qui vient de s'achever est enregistré, puis un nouveau
          chrono démarre avec <b>les mêmes joueurs</b>, les mêmes équipes et les mêmes couleurs.
          Les téléphones déjà connectés basculent tout seuls.
        </p>

        <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Chercher un jeu…"
          style={{ ...input, marginBottom: 12 }} disabled={busy} autoFocus />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 9 }}>
          {list.length === 0 && <div style={{ color: `${C.navy}88`, fontSize: 14 }}>Aucun jeu trouvé.</div>}
          {list.map((g) => (
            <button key={g.id} onClick={() => onPick(g)} disabled={busy}
              style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', border: '1.5px solid #e6dcc9',
                borderRadius: 14, padding: '9px 11px', cursor: busy ? 'default' : 'pointer', textAlign: 'left',
                minWidth: 0, opacity: busy ? .6 : 1 }}>
              {g.image_url
                ? <img src={g.image_url} alt="" style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'cover', flex: '0 0 auto' }} />
                : <span style={{ width: 46, height: 46, borderRadius: 10, background: `linear-gradient(135deg,${C.teal},${C.navy})`, flex: '0 0 auto' }} />}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontFamily: TITLE, fontWeight: 600, fontSize: 15, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                <span style={{ display: 'block', fontSize: 12, color: `${C.navy}88` }}>
                  {g._fromEvent ? 'jeu du moment' : (g.play_time ? `${g.play_time} min` : 'ludothèque')}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Palette : choisir a la main la couleur d'un joueur. */
function ColorSheet({ player, currentKey, takenKeys, onPick, onClose }) {
  if (!player) return null;
  const taken = new Set(takenKeys || []);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1250, background: 'rgba(10,25,42,.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.cream, color: C.navy, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, padding: '16px 16px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 19 }}>Couleur de {player.name}</div>
          <button onClick={onClose} style={btnGhost}>Fermer</button>
        </div>
        <div style={{ fontSize: 13, color: `${C.navy}99`, marginBottom: 14 }}>
          Les couleurs deja prises par un autre joueur sont marquees d'un point.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 9 }}>
          {GAME_COLORS.map((c) => {
            const on = c.key === currentKey;
            return (
              <button key={c.key} onClick={() => onPick(c.key)} title={taken.has(c.key) ? `${c.label} (deja pris)` : c.label}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 4px', borderRadius: 13, cursor: 'pointer',
                  border: on ? `2.5px solid ${C.navy}` : '1.5px solid #e6dcc9', background: '#fff' }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: c.hex, border: '1px solid rgba(0,0,0,.15)', position: 'relative' }}>
                  {taken.has(c.key) && !on && <span style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 1.5px rgba(0,0,0,.35)' }} />}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{c.label}</span>
              </button>
            );
          })}
        </div>
        <button onClick={() => onPick(null)} style={{ ...btnSecondary, width: '100%', marginTop: 12 }}>
          Revenir a la couleur automatique
        </button>
      </div>
    </div>
  );
}

/* Composition des equipes. Un joueur sans equipe joue pour lui-meme. */
function TeamsSheet({ players, hexFor, onSet, onClose }) {
  const used = [...new Set(players.map((p) => p.team).filter((x) => x != null))].sort((a, b) => a - b);
  const nextFree = (() => { for (let i = 0; i < TEAM_LETTERS.length; i++) if (!used.includes(i)) return i; return null; })();
  const choices = nextFree == null ? used : [...used, nextFree];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1250, background: 'rgba(10,25,42,.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.cream, color: C.navy, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 620, maxHeight: '86vh', overflowY: 'auto', padding: '16px 16px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 19 }}>👥 Mode equipe</div>
          <button onClick={onClose} style={btnGhost}>Fermer</button>
        </div>
        <div style={{ fontSize: 13, color: `${C.navy}99`, marginBottom: 14, lineHeight: 1.5 }}>
          Attribuez une equipe a chaque joueur. Le score saisi pour l'un est aussitot
          reporté sur ses coequipiers, et toute l'equipe partage la même couleur.
          Laissez sur <b>Seul</b> les joueurs qui jouent pour eux-mêmes.
        </div>
        <div style={{ display: 'grid', gap: 9 }}>
          {players.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', border: '1px solid #e6dcc9', borderRadius: 13, padding: '9px 11px', flexWrap: 'wrap' }}>
              <Avatar name={p.name} url={p.avatar_url} color={hexFor(p)} size={32} />
              <span style={{ flex: 1, minWidth: 90, fontWeight: 700 }}>{p.name}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => onSet(p.id, null)}
                  style={{ padding: '6px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: TITLE, fontWeight: 600, fontSize: 13,
                    border: p.team == null ? `2px solid ${C.navy}` : '1.5px solid #e6dcc9', background: p.team == null ? C.navy : '#fff', color: p.team == null ? '#fff' : `${C.navy}99` }}>
                  Seul
                </button>
                {choices.map((n) => (
                  <button key={n} onClick={() => onSet(p.id, n)}
                    style={{ width: 38, padding: '6px 0', borderRadius: 9, cursor: 'pointer', fontFamily: TITLE, fontWeight: 600, fontSize: 14,
                      border: p.team === n ? `2px solid ${C.teal}` : '1.5px solid #e6dcc9', background: p.team === n ? C.teal : '#fff', color: p.team === n ? '#fff' : `${C.navy}99` }}>
                    {TEAM_LETTERS[n]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreDirPicker({ value, onChange, saved, compact }) {
  const opts = [
    { v: 'high', t: 'Le plus grand score gagne' },
    { v: 'low', t: 'Le plus petit score gagne' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        {opts.map((o) => {
          const on = value === o.v;
          return (
            <button key={o.v} onClick={() => onChange(o.v)}
              style={{ flex: 1, padding: compact ? '7px 8px' : '9px 10px', borderRadius: 12, cursor: 'pointer',
                fontFamily: TITLE, fontWeight: 600, fontSize: compact ? 12.5 : 13.5, lineHeight: 1.25,
                border: on ? `2px solid ${C.teal}` : '1px solid #e6dcc9',
                background: on ? '#E8F4F4' : '#fff', color: on ? C.teal : `${C.navy}aa` }}>
              {o.t}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: `${C.navy}88`, marginTop: 6, lineHeight: 1.45 }}>
        {saved === value
          ? 'Enregistre sur la fiche du jeu : ce sera pre-selectionne la prochaine fois.'
          : 'Ce choix sera enregistre sur la fiche du jeu et pre-selectionne la prochaine fois.'}
      </div>
    </div>
  );
}

// ---- pave de saisie du score (clavier type calculatrice) -------------
// Exporte : le meme pave est reutilise dans App.jsx pour les parties
// enregistrees a la main (fenetre "Enregistrer une partie jouee").
export const ScorePad = React.memo(function ScorePad({ name, initialScore, onClose, onApply }) {
  const [entry, setEntry] = useState('');
  const [op, setOp] = useState(null); // null = saisie directe | '+' | '-'
  const cur = initialScore || 0;
  const n = entry === '' ? null : (parseInt(entry, 10) || 0);
  const preview = op
    ? (n == null ? cur : (op === '+' ? cur + n : cur - n))
    : (n == null ? cur : n);
  const press = (d) => setEntry((e) => (e + d).replace(/^0+(?=\d)/, '').slice(0, 6));
  const back = () => setEntry((e) => e.slice(0, -1));
  const clearAll = () => { setEntry(''); setOp(null); };
  const pickOp = (o) => setOp((prev) => (prev === o ? null : o));

  const keyBase = {
    border: 'none', borderRadius: 14, padding: '15px 0', fontFamily: TITLE, fontWeight: 600,
    fontSize: 22, cursor: 'pointer', background: C.white, color: C.navy,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)', touchAction: 'manipulation',
    userSelect: 'none', WebkitUserSelect: 'none', WebkitTapHighlightColor: 'transparent',
  };
  // Touches de SAISIE : reaction au pointerdown (doigt pose), sans attendre le relachement.
  // Elles ne ferment jamais le pave, donc le click qui suit est absorbe par le pave lui-meme.
  const K = ({ label, on, st, aria }) => (
    <button
      onPointerDown={(e) => { e.preventDefault(); on(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); on(); } }}
      aria-label={aria || String(label)} style={{ ...keyBase, ...st }}>{label}</button>
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(26,58,92,.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.cream, borderRadius: 20, padding: 18, width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 20, color: C.navy }}>{name}</div>
          <div style={{ fontSize: 13, color: `${C.navy}99`, fontWeight: 700 }}>Score actuel : {cur}</div>
        </div>
        <div style={{ fontSize: 13, color: `${C.navy}99`, marginBottom: 10 }}>
          Saisis un score puis valide, ou appuie sur + / − pour ajouter ou retrancher des points.
        </div>

        {/* Ecran de la calculatrice */}
        <div style={{ background: C.white, borderRadius: 14, padding: '12px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 26, color: op ? (op === '+' ? C.teal : C.red) : C.navy }}>
            {op ? (op === '+' ? '+ ' : '− ') : ''}{entry || (op ? '…' : String(cur))}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: `${C.navy}99` }}>→ {preview} pt{Math.abs(preview) > 1 ? 's' : ''}</div>
        </div>

        {/* Clavier */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <K label="7" on={() => press('7')} />
          <K label="8" on={() => press('8')} />
          <K label="9" on={() => press('9')} />
          <K label="+" on={() => pickOp('+')} aria="Ajouter des points"
            st={{ background: op === '+' ? C.teal : `${C.teal}1a`, color: op === '+' ? C.white : C.teal }} />
          <K label="4" on={() => press('4')} />
          <K label="5" on={() => press('5')} />
          <K label="6" on={() => press('6')} />
          <K label="−" on={() => pickOp('-')} aria="Retrancher des points"
            st={{ background: op === '-' ? C.red : `${C.red}1a`, color: op === '-' ? C.white : C.red }} />
          <K label="1" on={() => press('1')} />
          <K label="2" on={() => press('2')} />
          <K label="3" on={() => press('3')} />
          <K label="⌫" on={back} aria="Effacer le dernier chiffre" st={{ fontSize: 19 }} />
          <K label="C" on={clearAll} aria="Tout effacer" st={{ color: `${C.navy}99` }} />
          <K label="0" on={() => press('0')} />
          <K label="00" on={() => press('00')} st={{ fontSize: 18 }} />
          {/* Touche de FERMETURE : declenchee au click (relachement). Fermer des le
              pointerdown provoquait un click fantome sur l'interface situee derriere
              (pastille de score), qui rouvrait le pave aussitot. */}
          <button
            onClick={() => onApply(preview)}
            aria-label="Valider le score"
            style={{ ...keyBase, background: '#2FA24F', color: C.white, boxShadow: '0 3px 0 rgba(0,0,0,0.15)' }}>✓</button>
        </div>

        <button onClick={onClose} style={{ ...btnGhost, width: '100%', marginTop: 12, textAlign: 'center' }}>Annuler</button>
      </div>
    </div>
  );
});

// ---- petits composants & styles -------------------------------------
function Centered({ children }) {
  return <div style={{ textAlign: 'center', padding: '40px 0', fontWeight: 600, color: '#1A3A5C' }}>{children}</div>;
}
function Card({ children }) {
  return <div style={{ background: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>{children}</div>;
}
function Label({ children }) {
  return <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#1A3A5C99', marginBottom: 8 }}>{children}</div>;
}
function Stat({ label, value, color = '#1A3A5C' }) {
  return (
    <div>
      <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 24, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#1A3A5C99' }}>{label}</div>
    </div>
  );
}
function PlayerRow({ color, name, avatar, onRemove, tag }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <Avatar name={name} url={avatar} color={color} size={36} />
      <span style={{ fontWeight: 700, flex: 1 }}>{name}</span>
      {tag && <span style={{ fontSize: 11, color: '#1A3A5C88' }}>{tag}</span>}
      {onRemove && <button onClick={onRemove} style={{ ...btnGhost, color: '#B5283A' }}>×</button>}
    </div>
  );
}
function LiveAdd({ onAddGuest, onAddMember, supabase, currentUser }) {
  const [n, setN] = useState('');
  const [q, setQ] = useState('');
  const [hits, setHits] = useState([]);
  useEffect(() => {
    if (!q.trim()) { setHits([]); return; }
    let go = true;
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id,name,avatar_url').ilike('name', `%${q.trim()}%`).limit(6);
      if (go) setHits(data || []);
    }, 250);
    return () => { go = false; clearTimeout(t); };
  }, [q, supabase]);
  return (
    <div style={{ marginTop: 10, borderTop: '1px dashed #1A3A5C22', paddingTop: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={n} placeholder="Ajouter un invité sans tel" style={{ ...input, flex: 1 }}
          onChange={(e) => setN(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && n.trim()) { onAddGuest(n.trim()); setN(''); } }} />
        <button style={btnSecondary} onClick={() => { if (n.trim()) { onAddGuest(n.trim()); setN(''); } }}>+</button>
      </div>
      <input value={q} placeholder="Ajouter un membre…" style={{ ...input, marginTop: 8 }} onChange={(e) => setQ(e.target.value)} />
      {hits.map((m) => (
        <div key={m.id} onClick={() => { onAddMember(m); setQ(''); setHits([]); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', cursor: 'pointer' }}>
          <Avatar name={m.name} url={m.avatar_url} color="#1E8A8A" size={28} />
          <span style={{ fontWeight: 600 }}>{m.name}</span>
        </div>
      ))}
    </div>
  );
}

const input = {
  width: '100%', boxSizing: 'border-box', border: '1px solid #1A3A5C33', borderRadius: 12,
  padding: '11px 12px', fontSize: 16, fontFamily: "'Nunito', sans-serif", color: '#1A3A5C', background: '#fff',
};
const btnBase = {
  border: 'none', borderRadius: 12, padding: '12px 16px', fontFamily: "'Fredoka', sans-serif",
  fontWeight: 600, fontSize: 16, cursor: 'pointer',
};
const btnPrimary = { ...btnBase, background: '#1E8A8A', color: '#fff' };
const btnSecondary = { ...btnBase, background: '#1A3A5C12', color: '#1A3A5C' };
const btnDanger = { ...btnBase, background: '#B5283A', color: '#fff' };
const btnGhost = { background: 'transparent', border: 'none', color: '#1A3A5C99', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" };
const orderBtn = { width: 28, height: 22, border: '1px solid #1A3A5C22', background: '#fff', borderRadius: 7, color: '#1A3A5C', fontSize: 10, lineHeight: 1, cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 };
