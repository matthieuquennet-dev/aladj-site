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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

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
  const [pendingName, setPendingName] = useState(''); // prénom saisi par un invité avant de rejoindre
  const [now, setNow] = useState(Date.now());
  const channelRef = useRef(null);

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
      const { data } = await supabase.from('profiles').select('id,name,avatar_url').in('id', ids);
      (data || []).forEach((p) => { byId[p.id] = p; });
    }
    return rows.map((r) => ({
      ...r,
      name: r.profile_id ? (byId[r.profile_id]?.name || 'Membre') : (r.guest_name || 'Invité'),
      avatar_url: r.profile_id ? byId[r.profile_id]?.avatar_url : null,
    }));
  }, [supabase]);

  const refetchPlayers = useCallback(async (sessionId) => {
    const { data } = await supabase
      .from('play_session_players')
      .select('id,profile_id,guest_name,auth_user_id')
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
  const joinNow = useCallback(async (guestName) => {
    const { error: e } = await supabase.rpc('join_session', {
      p_join_code: joinCode,
      p_guest_name: currentUser ? null : ((guestName && guestName.trim()) || 'Invité'),
    });
    if (e) throw e;
    const { data: sess } = await supabase.from('play_sessions')
      .select('*').eq('join_code', joinCode.toUpperCase()).single();
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

  // ---- horloge live (uniquement en partie) ---------------------------
  useEffect(() => {
    if (phase !== 'running' && phase !== 'lobby') return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [phase]);

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
          const { data: eg } = await supabase.from('event_games').select('game_id').eq('event_id', eventId);
          const gIds = [...new Set((eg || []).map((r) => r.game_id))];
          let gamesData = [];
          if (gIds.length) {
            const { data } = await supabase.from('games')
              .select('id,name,play_time,image_url').in('id', gIds);
            gamesData = data || [];
          }
          setEventGames(gamesData);
          const first = gamesData[0] || null;
          setGame(first);
          setBoxMin(first?.play_time ? String(first.play_time) : '');

          const { data: eguests } = await supabase.from('event_guests')
            .select('member_id,guest_name').eq('event_id', eventId);
          const memberIds = [...new Set((eguests || []).map((r) => r.member_id).filter(Boolean))];
          let pById = {};
          if (memberIds.length) {
            const { data } = await supabase.from('profiles').select('id,name,avatar_url').in('id', memberIds);
            (data || []).forEach((p) => { pById[p.id] = p; });
          }
          const pre = (eguests || []).map((g, i) => g.member_id
            ? { key: `m${i}`, profileId: g.member_id, guestName: null,
                name: pById[g.member_id]?.name || 'Membre', avatar_url: pById[g.member_id]?.avatar_url }
            : { key: `g${i}`, profileId: null, guestName: g.guest_name,
                name: g.guest_name || 'Invité', avatar_url: null });
          setDraft(pre);
        } else if (gameId) {
          const { data: g } = await supabase.from('games')
            .select('id,name,play_time,image_url').eq('id', gameId).single();
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

  const rpc = async (fn, args) => {
    try { setError(null); const { error: e } = await supabase.rpc(fn, args); if (e) throw e; }
    catch (err) { setError(err.message || String(err)); }
  };
  const start = () => rpc('start_session', { p_session_id: sid });
  const claim = (playerId) => rpc('claim_turn', { p_session_id: sid, p_player_id: playerId });
  const toggleNeutral = () => rpc('toggle_neutral', { p_session_id: sid });
  const nextRound = () => rpc('next_round', { p_session_id: sid });
  const openNewGame = () => { setNewGameWinners([]); setNewGamePrompt(true); };
  const toggleNewGameWinner = (pid) => setNewGameWinners((w) => (w.includes(pid) ? w.filter((x) => x !== pid) : [...w, pid]));
  const [newGameBusy, setNewGameBusy] = useState(false);
  const confirmNewGame = async () => { if (newGameBusy) return; setNewGameBusy(true); try { await rpc('new_game', { p_session_id: sid, p_winner_ids: newGameWinners }); } finally { setNewGameBusy(false); } setNewGamePrompt(false); setNewGameWinners([]); };
  const quitNoSave = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Quitter le chrono sans rien enregistrer ? La partie sera supprimee (aucune duree, aucun resultat).')) return;
    if (isHost && sid) { try { await supabase.rpc('abandon_session', { p_session_id: sid }); } catch (e) {} }
    onExit();
  };
  const end = () => { if (window.confirm('Terminer la partie ?')) rpc('end_session', { p_session_id: sid }); };
  const toggleWinner = (pid) => setWinnerIds((w) => (w.includes(pid) ? w.filter((x) => x !== pid) : [...w, pid]));
  const saveResultAndExit = async () => {
    setSavingResult(true); setError(null);
    const { error: e } = await supabase.rpc('record_session_result', { p_session_id: sid, p_winner_ids: winnerIds });
    setSavingResult(false);
    if (e) { setError(e.message || String(e)); return; }
    onExit();
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
  const shell = (children) => (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: C.cream, color: C.navy,
      fontFamily: BODY, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '18px 16px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 22, color: C.navy }}>
            Chrono <span style={{ color: C.teal }}>ALADJ</span>
          </div>
          <button onClick={quitNoSave} style={btnGhost}>Quitter</button>
        </div>
        {error && (
          <div style={{ background: '#fdecee', color: C.red, border: `1px solid ${C.red}33`,
            borderRadius: 12, padding: '10px 12px', marginBottom: 12, fontWeight: 600 }}>
            {error}
          </div>
        )}
        {children}
      </div>
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

    return shell(
      <div>
        {newGamePrompt && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(26,58,92,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: C.cream, borderRadius: 20, padding: 18, width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 20, color: C.navy, marginBottom: 4 }}>Partie terminee</div>
              <div style={{ fontSize: 13, color: `${C.navy}99`, marginBottom: 12 }}>Qui a gagne cette partie ? (laisse vide pour un jeu cooperatif - la partie sera quand meme comptee)</div>
              <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                {players.map((p, i) => {
                  const won = newGameWinners.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => toggleNewGameWinner(p.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, cursor: 'pointer',
                        border: won ? `2px solid ${C.amber}` : '1px solid #e6dcc9', background: won ? '#FDF4E0' : '#fff', textAlign: 'left' }}>
                      <Avatar name={p.name} url={p.avatar} color={p.color || ACCENTS[i % ACCENTS.length]} size={30} />
                      <span style={{ fontWeight: 700, flex: 1, color: C.navy }}>{p.name}</span>
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
                  border: `2px solid ${active ? ACCENTS[i % ACCENTS.length] : 'transparent'}`,
                  boxShadow: active ? `0 0 0 3px ${ACCENTS[i % ACCENTS.length]}22` : '0 1px 4px rgba(0,0,0,0.06)',
                  cursor: clickable ? 'pointer' : 'default', transition: 'border-color .15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={p.name} url={p.avatar_url} color={ACCENTS[i % ACCENTS.length]} size={38} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    {!p.auth_user_id && <div style={{ fontSize: 11, color: `${C.navy}88` }}>sans tel</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => { e.stopPropagation(); movePlayer(p.id, true); }} disabled={i === 0}
                      style={{ ...orderBtn, opacity: i === 0 ? 0.3 : 1 }} aria-label="Monter dans l'ordre">▲</button>
                    <button onClick={(e) => { e.stopPropagation(); movePlayer(p.id, false); }} disabled={i === players.length - 1}
                      style={{ ...orderBtn, opacity: i === players.length - 1 ? 0.3 : 1 }} aria-label="Descendre dans l'ordre">▼</button>
                  </div>
                </div>
                <div style={{ fontFamily: TITLE, fontWeight: 600, fontSize: 26, marginTop: 6, color: active ? ACCENTS[i % ACCENTS.length] : C.navy }}>
                  {fmt(shown(p.id))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contrôles hôte */}
        {isHost && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            {activePhase === 'play' && !simul && <button style={{ ...btnSecondary, flex: 1 }} onClick={toggleNeutral}>{neutral ? 'Reprendre' : 'Pause'}</button>}
            {activePhase === 'play' && !simul && <button style={{ ...btnSecondary, flex: 1 }} onClick={openNewGame}>Nouvelle partie</button>}
            {activePhase === 'play' && !simul && <button style={{ ...btnSecondary, flex: 1, background: C.purple, color: C.white }} onClick={simulEnter}>Tous en même temps</button>}
            {activePhase === 'play' && simul && <button style={{ ...btnSecondary, flex: 1, background: C.teal, color: C.white }} onClick={simulResumeAll}>Relancer tout le monde</button>}
            {activePhase === 'play' && simul && <button style={{ ...btnSecondary, flex: 1 }} onClick={simulExit}>Mode normal</button>}
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
          <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
            {players.map((p, i) => {
              const won = winnerIds.includes(p.id);
              return (
                <button key={p.id} onClick={() => toggleWinner(p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, cursor: 'pointer',
                    border: won ? `2px solid ${C.amber}` : '1px solid #e6dcc9', background: won ? '#FDF4E0' : '#fff', textAlign: 'left' }}>
                  <Avatar name={p.name} url={p.avatar} color={p.color || ACCENTS[i % ACCENTS.length]} size={30} />
                  <span style={{ fontWeight: 700, flex: 1, color: C.navy }}>{p.name}</span>
                  <span style={{ fontSize: 19, opacity: won ? 1 : 0.3 }}>🏆</span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: `${C.navy}99`, marginTop: 8 }}>Laisse vide pour une partie sans vainqueur (coopératif) : elle sera quand même comptabilisée.</div>
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
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...btnGhost, flex: 1 }} onClick={onExit}>Fermer sans enregistrer</button>
          <button style={{ ...btnPrimary, flex: 1 }} onClick={saveResultAndExit} disabled={savingResult}>{savingResult ? 'Enregistrement…' : 'Enregistrer le résultat'}</button>
        </div>
      </div>
    );
  }

  return null;
}

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
