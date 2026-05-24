import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from "react";
import * as XLSX from "xlsx";
import {
  Dice5, Dice1, Calendar, Library, Home, LogIn, LogOut, UserPlus, Plus, Star, Search,
  Download, MapPin, Clock, Users, X, Menu, Trophy, Filter, Check, ChevronRight,
  Heart, Sparkles, BookOpen, Trash2, Edit3, ExternalLink, Globe, PenLine, Loader2,
  ArrowRight, Crown, Mail, ShieldCheck, Gamepad2, ChevronDown, Award, Info, AlertTriangle, Eye, EyeOff
} from "lucide-react";
import { supabase, isConfigured } from "./supabaseClient";

/* =============================================================================
   ALADJ — À l'assaut des jeux  ·  version connectée à Supabase
   ============================================================================= */

/* ---------- Palette (issue du logo) ---------- */
const C = {
  navy: "#1A3A5C", navyDeep: "#12293f", teal: "#1E8A8A", amber: "#E8A317",
  red: "#B5283A", purple: "#6B3A7A", cream: "#FBF7EF", paper: "#FFFEFB", ink: "#22303C",
};

/* ---------- Utilitaires ---------- */
const slug = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const FR_DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const FR_MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
function formatDateFr(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return `${FR_DAYS[d.getDay()]} ${d.getDate()} ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatDateShort(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${FR_MONTHS[d.getMonth()].slice(0, 4)}.`;
}

const MECHANIC_SUGGESTIONS = [
  "Coopératif", "Draft de cartes", "Placement d'ouvriers", "Pose de tuiles", "Dés",
  "Gestion de ressources", "Deck-building", "Contrôle de zone", "Enchères", "Bluff",
  "Combat", "Set collection", "Programmation", "Déduction", "Narration", "Mémoire",
  "Stop ou encore", "Combos", "Négociation", "Stratégie", "Familial", "Ambiance",
];

/* =============================================================================
   IMPORT BoardGameGeek
   -----------------------------------------------------------------------------
   Ces fonctions appellent une route serverless /api/bgg (incluse dans le projet)
   qui relaie les requêtes vers BoardGameGeek. Cela évite le blocage "CORS" du
   navigateur. La traduction passe par /api/translate.
   ============================================================================= */
// Récupère le XML de BGG. On essaie D'ABORD notre fonction serveur (fiable, c'est notre
// infrastructure), PUIS des proxies CORS publics en secours si elle échoue.
async function fetchBggXml(bggUrl) {
  const action = bggUrl.includes("/search") ? "search" : "thing";
  const sp = new URL(bggUrl).searchParams;
  const own = action === "search"
    ? `/api/bgg?action=search&query=${encodeURIComponent(sp.get("query") || "")}`
    : `/api/bgg?action=thing&id=${sp.get("id") || ""}`;

  // 1) notre fonction serveur
  try {
    const res = await fetch(own);
    if (res.ok) {
      const text = await res.text();
      if (text && text.includes("<")) return text;
    }
  } catch (e) { /* on tente les proxies */ }

  // 2) proxies CORS publics (secours)
  const proxies = [
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
    (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
  ];
  for (const make of proxies) {
    try {
      const res = await fetch(make(bggUrl));
      if (res.ok) {
        const text = await res.text();
        if (text && text.includes("<")) return text;
      }
    } catch (e) { /* proxy suivant */ }
  }
  throw new Error("BoardGameGeek indisponible");
}

async function bggSearch(query) {
  const text = await fetchBggXml(`https://boardgamegeek.com/xmlapi2/search?type=boardgame&query=${encodeURIComponent(query)}`);
  const xml = new DOMParser().parseFromString(text, "text/xml");
  return Array.from(xml.querySelectorAll("item")).slice(0, 12).map((it) => ({
    id: it.getAttribute("id"),
    name: it.querySelector("name")?.getAttribute("value") || "Sans titre",
    year: it.querySelector("yearpublished")?.getAttribute("value") || "",
  }));
}

async function bggDetails(id) {
  const text = await fetchBggXml(`https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`);
  const xml = new DOMParser().parseFromString(text, "text/xml");
  const it = xml.querySelector("item");
  if (!it) throw new Error("Jeu introuvable");
  const primaryName = Array.from(it.querySelectorAll("name")).find((n) => n.getAttribute("type") === "primary")?.getAttribute("value") || it.querySelector("name")?.getAttribute("value") || "";
  const year = it.querySelector("yearpublished")?.getAttribute("value") || "";
  const min = it.querySelector("minplayers")?.getAttribute("value") || "";
  const max = it.querySelector("maxplayers")?.getAttribute("value") || "";
  const time = it.querySelector("playingtime")?.getAttribute("value") || "";
  const img = it.querySelector("image")?.textContent || it.querySelector("thumbnail")?.textContent || "";
  let desc = it.querySelector("description")?.textContent || "";
  const ta = document.createElement("textarea"); ta.innerHTML = desc;
  desc = ta.value.replace(/&#10;/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const mechanics = Array.from(it.querySelectorAll("link")).filter((l) => l.getAttribute("type") === "boardgamemechanic").map((l) => l.getAttribute("value")).slice(0, 6);
  return { name: primaryName, year: year ? Number(year) : "", min: min ? Number(min) : "", max: max ? Number(max) : "", time: time ? Number(time) : "", img, desc, mechanics };
}

const MECH_FR = {
  "Hand Management": "Gestion de main", "Set Collection": "Set collection", "Tile Placement": "Pose de tuiles",
  "Worker Placement": "Placement d'ouvriers", "Dice Rolling": "Lancer de dés", "Card Drafting": "Draft de cartes",
  "Deck, Bag, and Pool Building": "Deck-building", "Area Majority / Influence": "Contrôle de zone",
  "Cooperative Game": "Jeu coopératif", "Auction/Bidding": "Enchères", "Variable Player Powers": "Pouvoirs variables",
  "Route/Network Building": "Construction de réseau", "Modular Board": "Plateau modulaire", "Trading": "Commerce",
  "Push Your Luck": "Stop ou encore", "Pattern Building": "Construction de motifs", "Grid Movement": "Déplacement sur grille",
  "Simultaneous Action Selection": "Sélection d'action simultanée", "Betting and Bluffing": "Pari et bluff",
  "Action Points": "Points d'action", "Memory": "Mémoire", "Storytelling": "Narration", "Voting": "Vote",
};
const translateMechanics = (arr) => (arr || []).map((m) => MECH_FR[m] || m);

async function translateText(text) {
  if (!text) return "";
  try {
    const res = await fetch(`/api/translate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 1500) }),
    });
    if (res.ok) { const data = await res.json(); if (data.translated) return data.translated; }
  } catch (e) { /* repli : texte original */ }
  return text;
}

/* =============================================================================
   CONTEXTE GLOBAL — connecté à Supabase
   ============================================================================= */
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// transforme une ligne "games" + ses notes en objet utilisé par l'interface
function mapGame(row, ratingsByGame, nameById = {}) {
  const ratings = {};
  (ratingsByGame[row.id] || []).forEach((r) => { ratings[r.user_id] = r.value; });
  return {
    id: row.id, name: row.name, year: row.year || "", min: row.min_players || "", max: row.max_players || "",
    time: row.play_time || "", mechanics: row.mechanics || [], desc: row.description || "", img: row.image_url || "",
    source: row.source || "manuel", ownerId: row.owner_id, ownerName: nameById[row.owner_id] || "Membre",
    ratings, addedAt: row.created_at ? new Date(row.created_at).getTime() : 0,
  };
}
function mapEvent(row, playersByEvent, nameById = {}, guestsByEvent = {}, commentsByEvent = {}) {
  return {
    id: row.id, date: row.event_date, time: row.event_time, place: row.place, min: row.min_players, max: row.max_players,
    notes: row.notes || "", hostId: row.host_id, hostName: nameById[row.host_id] || "Membre",
    deadline: row.deadline || null,
    players: (playersByEvent[row.id] || []).map((p) => ({ id: p.user_id, name: nameById[p.user_id] || "Membre" })),
    guests: (guestsByEvent[row.id] || []).map((g) => ({ id: g.id, name: g.guest_name, memberId: g.member_id, addedBy: g.added_by })),
    comments: (commentsByEvent[row.id] || []).map((c) => ({ id: c.id, authorId: c.author_id, authorName: nameById[c.author_id] || "Membre", content: c.content, createdAt: c.created_at, updatedAt: c.updated_at })),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
  };
}

function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [authUser, setAuthUser] = useState(null);     // utilisateur Supabase Auth
  const [currentUser, setCurrentUser] = useState(null); // profil (avec name, role)
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [events, setEvents] = useState([]);
  const [fatalError, setFatalError] = useState(null);

  /* ---- Chargement des données partagées ---- */
  const loadData = useCallback(async () => {
    try {
      // On charge chaque table séparément, SANS jointure automatique (profiles(name)),
      // car cette jointure échoue si la clé étrangère n'est pas détectée par Supabase.
      // On reconstitue les noms côté application via une table de correspondance.
      const [{ data: profiles }, { data: gamesRows }, { data: ratings }, { data: eventsRows }, { data: eps }, { data: guests }, { data: comments }] = await Promise.all([
        supabase.from("profiles").select("*").order("name"),
        supabase.from("games").select("*"),
        supabase.from("ratings").select("*"),
        supabase.from("events").select("*"),
        supabase.from("event_players").select("*"),
        supabase.from("event_guests").select("*"),
        supabase.from("event_comments").select("*").order("created_at"),
      ]);

      // table de correspondance id -> nom
      const nameById = {};
      (profiles || []).forEach((p) => { nameById[p.id] = p.name; });

      const ratingsByGame = {};
      (ratings || []).forEach((r) => { (ratingsByGame[r.game_id] ||= []).push(r); });
      const playersByEvent = {};
      (eps || []).forEach((p) => { (playersByEvent[p.event_id] ||= []).push(p); });
      const guestsByEvent = {};
      (guests || []).forEach((g) => { (guestsByEvent[g.event_id] ||= []).push(g); });
      const commentsByEvent = {};
      (comments || []).forEach((c) => { (commentsByEvent[c.event_id] ||= []).push(c); });

      setUsers((profiles || []).map((p) => ({ id: p.id, name: p.name, role: p.role, admin: p.is_admin })));
      setGames((gamesRows || []).map((g) => mapGame(g, ratingsByGame, nameById)));
      setEvents((eventsRows || []).map((e) => mapEvent(e, playersByEvent, nameById, guestsByEvent, commentsByEvent)));
    } catch (e) {
      console.error(e);
      setFatalError("Impossible de charger les données. Vérifiez la configuration Supabase.");
    }
  }, []);

  /* ---- Session + écoute des changements d'auth ---- */
  useEffect(() => {
    if (!isConfigured) { setFatalError("config"); setReady(true); return; }
    let sub;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthUser(session?.user || null);
      await loadData();
      setReady(true);
      sub = supabase.auth.onAuthStateChange((_e, sess) => { setAuthUser(sess?.user || null); });
    })();
    return () => sub?.data?.subscription?.unsubscribe();
  }, [loadData]);

  /* ---- Charger le profil du membre connecté ---- */
  useEffect(() => {
    (async () => {
      if (!authUser) { setCurrentUser(null); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
      if (data) setCurrentUser({ id: data.id, name: data.name, role: data.role, admin: data.is_admin });
    })();
  }, [authUser]);

  /* ---- Abonnement temps réel : recharge quand la base change ---- */
  useEffect(() => {
    if (!isConfigured) return;
    const channel = supabase.channel("aladj-changes")
      .on("postgres_changes", { event: "*", schema: "public" }, () => { loadData(); })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadData]);

  /* ---- Auth ---- */
  const register = useCallback(async ({ name, email, pwd, role }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password: pwd, options: { data: { name: name.trim(), role: role || "membre" } },
    });
    if (error) return { error: error.message.includes("already") ? "Un compte existe déjà avec cet e-mail." : error.message };
    // si confirmation e-mail désactivée, on est connecté direct
    await loadData();
    return { user: { name: name.trim() }, needsConfirm: !data.session };
  }, [loadData]);

  const login = useCallback(async ({ email, pwd }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    if (error) return { error: "E-mail ou mot de passe incorrect." };
    const { data: prof } = await supabase.from("profiles").select("name").eq("id", data.user.id).single();
    return { user: { name: prof?.name || "Membre" } };
  }, []);

  const logout = useCallback(async () => { await supabase.auth.signOut(); setCurrentUser(null); }, []);

  /* ---- Jeux ---- */
  const addGame = useCallback(async (d) => {
    const { data, error } = await supabase.from("games").insert({
      name: d.name.trim(), year: d.year || null, min_players: d.min || null, max_players: d.max || null,
      play_time: d.time || null, mechanics: d.mechanics || [], description: d.desc || "", image_url: d.img || "",
      source: d.source || "manuel", owner_id: currentUser.id,
    }).select().single();
    if (error) return { error: error.message };
    await loadData();
    return { game: data };
  }, [currentUser, loadData]);

  const updateGame = useCallback(async (id, patch) => {
    await supabase.from("games").update({
      name: patch.name, year: patch.year || null, min_players: patch.min || null, max_players: patch.max || null,
      play_time: patch.time || null, mechanics: patch.mechanics || [], description: patch.desc || "", image_url: patch.img || "",
    }).eq("id", id);
    await loadData();
  }, [loadData]);

  const removeGame = useCallback(async (id) => { await supabase.from("games").delete().eq("id", id); await loadData(); }, [loadData]);

  const rateGame = useCallback(async (id, value) => {
    if (!currentUser) return;
    const existing = games.find((g) => g.id === id)?.ratings?.[currentUser.id];
    if (existing === value) {
      await supabase.from("ratings").delete().eq("game_id", id).eq("user_id", currentUser.id);
    } else {
      await supabase.from("ratings").upsert({ game_id: id, user_id: currentUser.id, value });
    }
    await loadData();
  }, [currentUser, games, loadData]);

  /* ---- Soirées ---- */
  const addEvent = useCallback(async (d) => {
    const { data, error } = await supabase.from("events").insert({
      event_date: d.date, event_time: d.time, place: d.place, min_players: d.min, max_players: d.max,
      notes: d.notes || "", host_id: currentUser.id, deadline: d.deadline || null,
    }).select().single();
    if (error) return { error: error.message };
    if (d.joinSelf) await supabase.from("event_players").insert({ event_id: data.id, user_id: currentUser.id });
    // invités ajoutés dès la création
    if (d.invites && d.invites.length) {
      await supabase.from("event_guests").insert(
        d.invites.map((inv) => ({ event_id: data.id, guest_name: inv.name, member_id: inv.memberId || null, added_by: currentUser.id }))
      );
    }
    await loadData();
    return { event: data };
  }, [currentUser, loadData]);

  const updateEvent = useCallback(async (id, patch) => {
    const { error } = await supabase.from("events").update({
      event_date: patch.date, event_time: patch.time, place: patch.place,
      min_players: patch.min, max_players: patch.max, notes: patch.notes || "", deadline: patch.deadline || null,
    }).eq("id", id);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  // ---- Invités nommés (membres avec compte OU personnes sans compte) ----
  const addGuest = useCallback(async (eventId, guestName, memberId = null) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { error } = await supabase.from("event_guests").insert({
      event_id: eventId, guest_name: guestName.trim(), member_id: memberId, added_by: currentUser.id,
    });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  const removeGuest = useCallback(async (guestId) => {
    await supabase.from("event_guests").delete().eq("id", guestId);
    await loadData();
  }, [loadData]);

  // ---- Commentaires de soirée ----
  const addComment = useCallback(async (eventId, content) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { error } = await supabase.from("event_comments").insert({
      event_id: eventId, author_id: currentUser.id, content: content.trim(),
    });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  const updateComment = useCallback(async (commentId, content) => {
    const { error } = await supabase.from("event_comments").update({
      content: content.trim(), updated_at: new Date().toISOString(),
    }).eq("id", commentId);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  const removeComment = useCallback(async (commentId) => {
    await supabase.from("event_comments").delete().eq("id", commentId);
    await loadData();
  }, [loadData]);

  const toggleJoin = useCallback(async (eventId) => {
    if (!currentUser) return;
    const ev = events.find((e) => e.id === eventId);
    const inIt = ev?.players.some((p) => p.id === currentUser.id);
    if (inIt) await supabase.from("event_players").delete().eq("event_id", eventId).eq("user_id", currentUser.id);
    else await supabase.from("event_players").insert({ event_id: eventId, user_id: currentUser.id });
    await loadData();
  }, [currentUser, events, loadData]);

  const removeEvent = useCallback(async (id) => { await supabase.from("events").delete().eq("id", id); await loadData(); }, [loadData]);

  const value = {
    ready, fatalError, users, games, events, currentUser,
    register, login, logout, addGame, updateGame, removeGame, rateGame,
    addEvent, updateEvent, toggleJoin, removeEvent,
    addGuest, removeGuest, addComment, updateComment, removeComment, reload: loadData,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

function gameStats(g) {
  const vals = Object.values(g.ratings || {});
  const count = vals.length;
  return { count, avg: count ? vals.reduce((a, b) => a + b, 0) / count : 0 };
}

// Une soirée est visible sauf si sa date limite (deadline) est passée
// ET que le quorum (min joueurs) n'est pas atteint.
function isEventVisible(e) {
  if (!e.deadline) return true; // pas de limite → toujours visible
  const now = Date.now();
  const limit = new Date(e.deadline).getTime();
  if (now < limit) return true; // limite pas encore atteinte
  const totalPlayers = (e.players?.length || 0) + (e.guests?.length || 0);
  return totalPlayers >= e.min; // après la limite : visible seulement si quorum atteint
}
/* =============================================================================
   COMPOSANTS UI
   ============================================================================= */

/* ---- Logo / Wordmark ALADJ ---- */
function Wordmark({ size = 28 }) {
  const letters = [
    { ch: "A", c: C.navy }, { ch: "L", c: C.teal }, { ch: "A", c: C.amber },
    { ch: "D", c: C.red }, { ch: "J", c: C.purple },
  ];
  return (
    <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: size, letterSpacing: "-0.02em", lineHeight: 1, display: "inline-flex" }}>
      {letters.map((l, i) => <span key={i} style={{ color: l.c }}>{l.ch}</span>)}
    </span>
  );
}

function MeepleIcon({ size = 22, color = C.navy }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M12 2c-1.3 0-2.4 1-2.4 2.3 0 .7.3 1.3.8 1.7-1.1.4-2 .9-3.3 1.6-1 .5-1.6 1.1-1.6 2 0 .8.6 1.4 1.4 1.4.5 0 1-.2 1.7-.5.6-.3 1.2-.5 1.2.2 0 .5-.4 1.2-1.2 2.4-.9 1.4-1.6 2.5-1.6 3.6 0 .8.6 1.6 2 1.6h6c1.4 0 2-.8 2-1.6 0-1.1-.7-2.2-1.6-3.6-.8-1.2-1.2-1.9-1.2-2.4 0-.7.6-.5 1.2-.2.7.3 1.2.5 1.7.5.8 0 1.4-.6 1.4-1.4 0-.9-.6-1.5-1.6-2-1.3-.7-2.2-1.2-3.3-1.6.5-.4.8-1 .8-1.7C14.4 3 13.3 2 12 2z" />
    </svg>
  );
}

/* ---- Étoiles de notation ---- */
function Stars({ value = 0, onRate, size = 18, readOnly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <span style={{ display: "inline-flex", gap: 2 }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n;
        return (
          <button key={n} type="button" disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(n)}
            onClick={() => !readOnly && onRate && onRate(n)}
            style={{
              background: "none", border: "none", padding: 0, cursor: readOnly ? "default" : "pointer",
              lineHeight: 0, transition: "transform .12s", transform: hover === n ? "scale(1.2)" : "scale(1)",
            }}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}>
            <Star size={size} fill={active ? C.amber : "none"} color={active ? C.amber : "#cdb9a0"} strokeWidth={1.8} />
          </button>
        );
      })}
    </span>
  );
}

/* ---- Bouton ---- */
function Btn({ children, onClick, variant = "primary", size = "md", disabled, style, type = "button", full }) {
  const sizes = { sm: { padding: "7px 14px", fontSize: 13 }, md: { padding: "11px 20px", fontSize: 14.5 }, lg: { padding: "14px 26px", fontSize: 16 } };
  const variants = {
    primary: { background: C.navy, color: "#fff", border: `2px solid ${C.navy}` },
    teal: { background: C.teal, color: "#fff", border: `2px solid ${C.teal}` },
    amber: { background: C.amber, color: C.navyDeep, border: `2px solid ${C.amber}` },
    red: { background: C.red, color: "#fff", border: `2px solid ${C.red}` },
    ghost: { background: "transparent", color: C.navy, border: `2px solid ${C.navy}` },
    soft: { background: "rgba(26,58,92,.07)", color: C.navy, border: "2px solid transparent" },
    danger: { background: "transparent", color: C.red, border: `2px solid ${C.red}` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{
        ...sizes[size], ...variants[variant], width: full ? "100%" : "auto",
        borderRadius: 12, fontWeight: 700, fontFamily: "'Fredoka', sans-serif", cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, transition: "transform .12s, box-shadow .2s, filter .2s",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, ...style,
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
      {children}
    </button>
  );
}

/* ---- Champ texte ---- */
function Field({ label, children, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 6, fontFamily: "'Fredoka', sans-serif" }}>{label}</span>
      {children}
      {hint && <span style={{ display: "block", fontSize: 12, color: "#8a7c6a", marginTop: 4 }}>{hint}</span>}
    </label>
  );
}
const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 11, border: "2px solid #e6dcc9",
  background: "#fff", fontSize: 15, fontFamily: "'Nunito', sans-serif", color: C.ink, outline: "none",
  boxSizing: "border-box", transition: "border-color .15s",
};
function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...props.style }}
    onFocus={(e) => (e.target.style.borderColor = C.teal)}
    onBlur={(e) => (e.target.style.borderColor = "#e6dcc9")} />;
}

/* ---- Modale ---- */
function Modal({ open, onClose, children, title, width = 560 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(18,41,63,.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 16px", zIndex: 1000, overflowY: "auto",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.paper, borderRadius: 22, width: "100%", maxWidth: width, boxShadow: "0 30px 80px rgba(18,41,63,.35)",
        border: "1px solid #ece2d0", animation: "popIn .25s ease", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #efe6d6" }}>
          <h3 style={{ margin: 0, fontFamily: "'Fredoka', sans-serif", color: C.navy, fontSize: 20 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "rgba(26,58,92,.07)", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", color: C.navy }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

/* ---- Badge ---- */
function Badge({ children, color = C.teal, soft = true }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, padding: "4px 10px",
      borderRadius: 999, fontFamily: "'Fredoka', sans-serif",
      background: soft ? `${color}1a` : color, color: soft ? color : "#fff", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => { if (msg) { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); } }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 2000,
      background: C.navy, color: "#fff", padding: "13px 22px", borderRadius: 14, fontFamily: "'Fredoka', sans-serif",
      fontWeight: 600, boxShadow: "0 14px 40px rgba(18,41,63,.4)", display: "flex", alignItems: "center", gap: 10, animation: "popIn .25s ease",
    }}>
      <Check size={18} color={C.amber} /> {msg}
    </div>
  );
}

/* =============================================================================
   NAVIGATION
   ============================================================================= */
const NAV = [
  { key: "accueil", label: "Accueil", icon: Home },
  { key: "soirees", label: "Moments jeux", icon: Calendar },
  { key: "ludotheque", label: "Ludothèque", icon: Library },
  { key: "ma-ludo", label: "Ma ludothèque", icon: BookOpen, auth: true },
];

function Navbar({ page, setPage, onAuth }) {
  const { currentUser, logout } = useApp();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => !n.auth || currentUser);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 500, background: "rgba(251,247,239,.86)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid #ece2d0",
    }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => setPage("accueil")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 11, background: C.navy }}>
            <MeepleIcon size={22} color="#fff" />
          </span>
          <Wordmark size={26} />
        </button>

        <nav style={{ display: "flex", gap: 4, marginLeft: 12 }} className="aladj-desktop-nav">
          {items.map((n) => {
            const Icon = n.icon; const active = page === n.key;
            return (
              <button key={n.key} onClick={() => setPage(n.key)} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 11, border: "none",
                cursor: "pointer", fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14.5,
                background: active ? C.navy : "transparent", color: active ? "#fff" : C.navy, transition: "background .15s",
              }}>
                <Icon size={17} /> {n.label}
              </button>
            );
          })}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }} className="aladj-desktop-nav">
          {currentUser ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 11, background: "rgba(30,138,138,.1)" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: C.teal, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14 }}>
                  {currentUser.name[0].toUpperCase()}
                </span>
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>{currentUser.name}</span>
                {currentUser.role === "decideur" && <Crown size={15} color={C.amber} />}
              </div>
              <Btn variant="ghost" size="sm" onClick={logout}><LogOut size={15} /> Sortir</Btn>
            </>
          ) : (
            <>
              <Btn variant="ghost" size="sm" onClick={() => onAuth("login")}><LogIn size={15} /> Connexion</Btn>
              <Btn variant="amber" size="sm" onClick={() => onAuth("register")}><UserPlus size={15} /> Adhérer</Btn>
            </>
          )}
        </div>

        <button className="aladj-burger" onClick={() => setOpen(!open)} style={{
          marginLeft: "auto", display: "none", background: C.navy, color: "#fff", border: "none", borderRadius: 10, width: 40, height: 40, cursor: "pointer", placeItems: "center",
        }}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="aladj-mobile-menu" style={{ padding: "8px 16px 18px", display: "grid", gap: 6, borderTop: "1px solid #ece2d0" }}>
          {items.map((n) => {
            const Icon = n.icon; const active = page === n.key;
            return (
              <button key={n.key} onClick={() => { setPage(n.key); setOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, border: "none", cursor: "pointer",
                fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 16, background: active ? C.navy : "rgba(26,58,92,.06)", color: active ? "#fff" : C.navy,
              }}><Icon size={19} /> {n.label}</button>
            );
          })}
          <div style={{ height: 1, background: "#ece2d0", margin: "6px 0" }} />
          {currentUser ? (
            <>
              <div style={{ padding: "8px 4px", fontFamily: "'Fredoka',sans-serif", color: C.navy, fontWeight: 600 }}>Connecté : {currentUser.name}</div>
              <Btn variant="ghost" onClick={() => { logout(); setOpen(false); }} full><LogOut size={16} /> Se déconnecter</Btn>
            </>
          ) : (
            <>
              <Btn variant="ghost" onClick={() => { onAuth("login"); setOpen(false); }} full><LogIn size={16} /> Connexion</Btn>
              <Btn variant="amber" onClick={() => { onAuth("register"); setOpen(false); }} full><UserPlus size={16} /> Adhérer</Btn>
            </>
          )}
        </div>
      )}
    </header>
  );
}


/* =============================================================================
   AUTHENTIFICATION (modale) — Supabase
   ============================================================================= */
function AuthModal({ mode, onClose, setToast }) {
  const { login, register } = useApp();
  const [tab, setTab] = useState(mode || "login");
  const [form, setForm] = useState({ name: "", email: "", pwd: "", pwd2: "", role: "decideur" });
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setTab(mode), [mode]);

  const submit = async () => {
    setErr(""); setInfo(""); setBusy(true);
    let res;
    if (tab === "login") res = await login({ email: form.email, pwd: form.pwd });
    else {
      if (!form.name.trim()) { setErr("Indiquez votre nom ou pseudo."); setBusy(false); return; }
      if (form.pwd.length < 6) { setErr("Le mot de passe doit faire au moins 6 caractères."); setBusy(false); return; }
      if (form.pwd !== form.pwd2) { setErr("Les deux mots de passe ne correspondent pas."); setBusy(false); return; }
      res = await register(form);
    }
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    if (res.needsConfirm) {
      setInfo("Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.");
      setTab("login");
      return;
    }
    onClose();
    setToast(tab === "login" ? `Bienvenue ${res.user.name} !` : `Compte créé — bienvenue ${res.user.name} !`);
  };

  return (
    <Modal open onClose={onClose} title={tab === "login" ? "Connexion" : "Rejoindre l'association"} width={480}>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "rgba(26,58,92,.06)", padding: 5, borderRadius: 13 }}>
        {[["login", "J'ai un compte"], ["register", "Je m'inscris"]].map(([k, lbl]) => (
          <button key={k} onClick={() => { setTab(k); setErr(""); setInfo(""); }} style={{
            flex: 1, padding: "9px", border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14,
            background: tab === k ? "#fff" : "transparent", color: tab === k ? C.navy : "#9c8d79", boxShadow: tab === k ? "0 2px 8px rgba(18,41,63,.1)" : "none",
          }}>{lbl}</button>
        ))}
      </div>

      {info && <div style={{ background: "rgba(30,138,138,.12)", color: C.teal, padding: "12px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14, lineHeight: 1.5 }}>{info}</div>}

      {tab === "register" && (
        <Field label="Nom ou pseudo">
          <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Camille" />
        </Field>
      )}
      <Field label="Adresse e-mail">
        <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.fr" />
      </Field>
      <Field label="Mot de passe" hint={tab === "register" ? "Au moins 6 caractères." : undefined}>
        <div style={{ position: "relative" }}>
          <TextInput type={showPwd ? "text" : "password"} value={form.pwd} onChange={(e) => setForm({ ...form, pwd: e.target.value })} placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && tab === "login" && submit()} style={{ paddingRight: 44 }} />
          <button type="button" onClick={() => setShowPwd(!showPwd)} aria-label={showPwd ? "Masquer" : "Afficher"}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9c8d79", padding: 6, display: "grid", placeItems: "center" }}>
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>

      {tab === "register" && (
        <Field label="Confirmer le mot de passe">
          <div style={{ position: "relative" }}>
            <TextInput type={showPwd ? "text" : "password"} value={form.pwd2} onChange={(e) => setForm({ ...form, pwd2: e.target.value })} placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && submit()} style={{ paddingRight: 44 }} />
            {form.pwd2 && (
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
                {form.pwd === form.pwd2 ? <Check size={18} color={C.teal} /> : <X size={18} color={C.red} />}
              </span>
            )}
          </div>
        </Field>
      )}

      {tab === "register" && (
        <Field label="Type d'adhésion" hint="Le statut peut être ajusté ensuite par le bureau.">
          <div style={{ display: "grid", gap: 8 }}>
            {[
              { v: "decideur", t: "Membre décisionnaire", d: "Cotisation 30 €/an · voix délibérative en AG", icon: Crown },
              { v: "membre", t: "Membre non décisionnaire", d: "Gratuit · accès aux moments jeux et à la ludothèque", icon: Heart },
            ].map((o) => {
              const Icon = o.icon; const active = form.role === o.v;
              return (
                <button key={o.v} onClick={() => setForm({ ...form, role: o.v })} style={{
                  textAlign: "left", padding: "12px 14px", borderRadius: 13, cursor: "pointer", display: "flex", gap: 12, alignItems: "center",
                  border: `2px solid ${active ? C.teal : "#e6dcc9"}`, background: active ? "rgba(30,138,138,.07)" : "#fff",
                }}>
                  <Icon size={20} color={active ? C.teal : "#b6a78f"} />
                  <span>
                    <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy }}>{o.t}</span>
                    <span style={{ fontSize: 12.5, color: "#8a7c6a" }}>{o.d}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn onClick={submit} disabled={busy} full size="lg" variant={tab === "login" ? "primary" : "amber"}>
        {busy ? <Loader2 size={18} className="aladj-spin" /> : (tab === "login" ? <><LogIn size={18} /> Se connecter</> : <><Sparkles size={18} /> Créer mon compte</>)}
      </Btn>
    </Modal>
  );
}

/* =============================================================================
   PAGE — ACCUEIL (Landing)
   ============================================================================= */
function Dice({ color, n, style }) {
  const pips = {
    1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[28, 28], [50, 50], [72, 72]],
    4: [[30, 30], [70, 30], [30, 70], [70, 70]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]],
  }[n];
  return (
    <svg viewBox="0 0 100 100" style={style}>
      <rect x="6" y="6" width="88" height="88" rx="20" fill={color} />
      <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#dg)" />
      <defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".25" /><stop offset="1" stopColor="#000" stopOpacity=".12" /></linearGradient></defs>
      {pips.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="7.5" fill="#fff" />)}
    </svg>
  );
}

function HomePage({ setPage, onAuth }) {
  const { events, games, users, currentUser } = useApp();
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...events].filter((e) => e.date >= today && isEventVisible(e)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 3);
  }, [events]);

  const strongPoints = [
    { icon: Library, c: C.teal, t: "Une ludothèque vivante", d: "Des centaines de jeux partagés par les membres, notés et commentés par la communauté." },
    { icon: Calendar, c: C.red, t: "Des moments jeux toute l'année", d: "Proposez ou rejoignez des moments jeux à Gouville-sur-Mer et dans le Coutançais." },
    { icon: Users, c: C.amber, t: "Une communauté conviviale", d: "Joueurs débutants ou aguerris, on partage le plaisir du jeu sans prise de tête." },
    { icon: Trophy, c: C.purple, t: "Découvertes & classements", d: "Le top des jeux préférés de l'asso, et des classements sur-mesure pour vos tablées." },
  ];

  return (
    <div>
      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyDeep} 60%, #0c1f30 100%)` }}>
        {/* formes décoratives */}
        <Dice color={C.teal} n={5} style={{ position: "absolute", width: 120, top: 60, left: "6%", opacity: .9, transform: "rotate(-12deg)", filter: "drop-shadow(0 12px 24px rgba(0,0,0,.3))" }} />
        <Dice color={C.red} n={3} style={{ position: "absolute", width: 90, top: 220, left: "2%", opacity: .85, transform: "rotate(14deg)", filter: "drop-shadow(0 12px 24px rgba(0,0,0,.3))" }} />
        <Dice color={C.amber} n={6} style={{ position: "absolute", width: 110, bottom: 50, right: "7%", opacity: .9, transform: "rotate(10deg)", filter: "drop-shadow(0 12px 24px rgba(0,0,0,.3))" }} />
        <div style={{ position: "absolute", width: 64, height: 64, top: 80, right: "16%" }}><MeepleIcon size={64} color={C.purple} /></div>
        <div style={{ position: "absolute", width: 44, height: 44, bottom: 120, left: "18%", transform: "rotate(-20deg)" }}><MeepleIcon size={44} color={C.amber} /></div>

        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "84px 24px 96px", position: "relative", textAlign: "center" }}>
          <Badge color={C.amber} soft={false}><MapPin size={13} /> Gouville-sur-Mer · Coutançais · Manche</Badge>
          <h1 style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: "clamp(38px, 7vw, 76px)", lineHeight: 1.02, margin: "22px 0 8px", letterSpacing: "-0.03em" }}>
            À l'assaut<br />
            <span style={{ background: `linear-gradient(90deg, ${C.teal}, ${C.amber}, ${C.red}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>des jeux !</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,.8)", fontSize: "clamp(16px,2.3vw,20px)", maxWidth: 620, margin: "0 auto 34px", lineHeight: 1.55 }}>
            L'association des passionnés de jeux de société du Coutançais. On se réunit pour jouer, découvrir et partager — autour d'une grande table et de centaines de jeux.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {!currentUser && <Btn variant="amber" size="lg" onClick={() => onAuth("register")}><Sparkles size={19} /> Rejoindre l'asso</Btn>}
            <Btn variant="teal" size="lg" onClick={() => setPage("soirees")}><Calendar size={19} /> Voir les moments jeux</Btn>
            <Btn size="lg" onClick={() => setPage("ludotheque")} style={{ background: "rgba(255,255,255,.12)", border: "2px solid rgba(255,255,255,.3)", color: "#fff" }}>
              <Library size={19} /> La ludothèque
            </Btn>
          </div>

          <div style={{ display: "flex", gap: "clamp(20px,5vw,64px)", justifyContent: "center", marginTop: 56, flexWrap: "wrap" }}>
            {[[games.length, "jeux partagés"], [users.length, "membres"], [events.length, "moments jeux"], ["2010", "depuis"]].map(([n, l], i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 38, color: "#fff", lineHeight: 1 }}>{n}</div>
                <div style={{ color: "rgba(255,255,255,.6)", fontSize: 14, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 1440 60" style={{ display: "block", width: "100%", height: 50 }} preserveAspectRatio="none"><path d="M0 60 L0 30 Q360 0 720 24 T1440 20 L1440 60 Z" fill={C.cream} /></svg>
      </section>

      {/* POINTS FORTS */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 24px 20px" }}>
        <SectionTitle kicker="Pourquoi nous rejoindre" title="Nos points forts" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginTop: 36 }}>
          {strongPoints.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} style={{ background: C.paper, borderRadius: 20, padding: 26, border: "1px solid #ece2d0", boxShadow: "0 4px 18px rgba(18,41,63,.05)" }}>
                <div style={{ width: 54, height: 54, borderRadius: 15, background: `${p.c}1a`, display: "grid", placeItems: "center", marginBottom: 16 }}>
                  <Icon size={26} color={p.c} />
                </div>
                <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 19, margin: "0 0 8px" }}>{p.t}</h3>
                <p style={{ color: "#6e6256", fontSize: 14.5, lineHeight: 1.55, margin: 0 }}>{p.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* PROCHAINES SOIRÉES */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <SectionTitle kicker="Agenda" title="Les 3 prochains moments jeux" noMargin />
          <Btn variant="soft" size="sm" onClick={() => setPage("soirees")}>Tout voir <ArrowRight size={15} /></Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginTop: 32 }}>
          {upcoming.length === 0 && <EmptyHint icon={Calendar} text="Aucun moment jeux programmé pour l'instant." />}
          {upcoming.map((e) => <EventCardMini key={e.id} e={e} onOpen={() => setPage("soirees")} />)}
        </div>
      </section>

      {/* ADHÉSION */}
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 24px 80px" }}>
        <SectionTitle kicker="Adhésion" title="Comment nous rejoindre" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 36 }}>
          <PlanCard color={C.amber} crown title="Membre décisionnaire" price="30 €" period="/ an"
            features={["Voix délibérative en assemblée générale", "Participe aux décisions de l'asso", "Accès complet à la ludothèque", "Crée et rejoint les moments jeux", "Note les jeux et exporte sa ludothèque"]}
            cta={currentUser ? null : "Adhérer"} onCta={() => onAuth("register")} />
          <PlanCard color={C.teal} title="Membre non décisionnaire" price="Gratuit" period=""
            features={["Accès à la ludothèque de l'asso", "Participe et crée des moments jeux", "Note les jeux de l'association", "Gère sa ludothèque personnelle", "Pas de voix délibérative en AG"]}
            cta={currentUser ? null : "Créer un compte"} onCta={() => onAuth("register")} />
        </div>
        <p style={{ textAlign: "center", color: "#8a7c6a", fontSize: 14, marginTop: 26, maxWidth: 640, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
          <Info size={15} style={{ verticalAlign: "-2px" }} /> Association loi 1901 fondée le 13 octobre 2010 à Coutances. La cotisation est fixée chaque année par l'assemblée générale. Une pièce d'identité peut être demandée à l'entrée des moments jeux (réservé aux +16 ans).
        </p>
      </section>
    </div>
  );
}

function SectionTitle({ kicker, title, noMargin }) {
  return (
    <div style={{ textAlign: "center", marginBottom: noMargin ? 0 : 0 }}>
      <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em" }}>{kicker}</span>
      <h2 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: "clamp(28px,4vw,40px)", margin: "6px 0 0", letterSpacing: "-0.02em" }}>{title}</h2>
    </div>
  );
}

function PlanCard({ color, title, price, period, features, cta, onCta, crown }) {
  return (
    <div style={{ background: C.paper, borderRadius: 24, padding: 32, border: `2px solid ${color}`, position: "relative", boxShadow: "0 8px 30px rgba(18,41,63,.07)" }}>
      {crown && <div style={{ position: "absolute", top: -14, right: 24, background: color, color: C.navyDeep, padding: "5px 14px", borderRadius: 999, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", gap: 5 }}><Crown size={14} /> Décide de l'asso</div>}
      <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 22, margin: "0 0 10px" }}>{title}</h3>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 22 }}>
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 44, color }}>{price}</span>
        <span style={{ color: "#8a7c6a", fontSize: 16 }}>{period}</span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "grid", gap: 11 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "#5e5346", fontSize: 14.5, lineHeight: 1.4 }}>
            <span style={{ marginTop: 1, color }}><Check size={18} /></span> {f}
          </li>
        ))}
      </ul>
      {cta && <Btn full size="lg" onClick={onCta} style={{ background: color, border: `2px solid ${color}`, color: crown ? C.navyDeep : "#fff" }}>{cta} <ChevronRight size={18} /></Btn>}
    </div>
  );
}

function EmptyHint({ icon: Icon, text }) {
  return (
    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px 20px", color: "#a89a86", background: "rgba(26,58,92,.03)", borderRadius: 18, border: "2px dashed #e0d4bf" }}>
      <Icon size={40} style={{ opacity: .5 }} />
      <p style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, marginTop: 12, fontSize: 16 }}>{text}</p>
    </div>
  );
}

/* =============================================================================
   CARTES SOIRÉE
   ============================================================================= */
function EventCardMini({ e, onOpen }) {
  const filled = e.players.length + (e.guests?.length || 0);
  const reached = filled >= e.min;
  return (
    <button onClick={onOpen} style={{
      textAlign: "left", cursor: "pointer", borderRadius: 20, overflow: "hidden", padding: 0,
      background: C.paper, boxShadow: "0 4px 18px rgba(18,41,63,.06)", border: "1px solid #ece2d0",
    }}>
      <div style={{ background: reached ? `linear-gradient(135deg,${C.teal},#16706f)` : `linear-gradient(135deg,${C.red},#8e1f2e)`, padding: "16px 20px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12.5, opacity: .85, fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>{formatDateShort(e.date)} · {e.time}</div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 18 }}>{FR_DAYS[new Date(e.date + "T00:00:00").getDay()]}</div>
        </div>
        <Badge color="#fff" soft={false}>{reached ? <><Check size={13} /> Confirmée</> : "En attente"}</Badge>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", color: C.navy, fontWeight: 600, fontFamily: "'Fredoka',sans-serif", marginBottom: 10 }}>
          <MapPin size={16} color={C.teal} /> {e.place}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#6e6256", fontSize: 14 }}>
          <Users size={16} color={reached ? C.teal : C.red} />
          <b style={{ color: reached ? C.teal : C.red }}>{filled}</b> joueur{filled > 1 ? "s" : ""} · min {e.min} / max {e.max}
        </div>
        <div style={{ marginTop: 12, height: 7, borderRadius: 99, background: "#eee4d2", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (filled / e.max) * 100)}%`, background: reached ? C.teal : C.red, transition: "width .4s" }} />
        </div>
        <div style={{ fontSize: 12.5, color: "#9c8d79", marginTop: 8 }}>Proposée par {e.hostName}</div>
      </div>
    </button>
  );
}

/* =============================================================================
   PAGE — SOIRÉES (calendrier + création + fond rouge/vert)
   ============================================================================= */
function EventsPage({ onAuth, setToast }) {
  const { events, currentUser, addEvent, toggleJoin, removeEvent } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [presetDate, setPresetDate] = useState(null); // date pré-remplie au clic sur le calendrier
  const [selected, setSelected] = useState(null);
  const [monthCursor, setMonthCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

  const sorted = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...events].filter((e) => e.date >= today && isEventVisible(e)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [events]);

  const selectedEvent = events.find((e) => e.id === selected);

  // grille calendrier
  const cal = useMemo(() => {
    const { y, m } = monthCursor;
    const first = new Date(y, m, 1);
    const startDay = (first.getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ d, iso, events: events.filter((e) => e.date === iso) });
    }
    return cells;
  }, [monthCursor, events]);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 30 }}>
        <div>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em" }}>Agenda</span>
          <h1 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: "clamp(30px,5vw,44px)", margin: "4px 0 0", letterSpacing: "-0.02em" }}>Les moments jeux</h1>
        </div>
        {currentUser
          ? <Btn variant="amber" size="lg" onClick={() => setShowCreate(true)}><Plus size={18} /> Proposer un moment jeux</Btn>
          : <Btn variant="ghost" onClick={() => onAuth("login")}><LogIn size={16} /> Connectez-vous pour proposer</Btn>}
      </div>

      {/* CALENDRIER */}
      <div style={{ background: C.paper, borderRadius: 22, border: "1px solid #ece2d0", padding: "20px 22px", marginBottom: 36, boxShadow: "0 4px 18px rgba(18,41,63,.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => setMonthCursor((c) => { const m = c.m - 1; return m < 0 ? { y: c.y - 1, m: 11 } : { ...c, m }; })} style={navBtnStyle}><ChevronRight size={18} style={{ transform: "rotate(180deg)" }} /></button>
          <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 21, margin: 0, textTransform: "capitalize" }}>{FR_MONTHS[monthCursor.m]} {monthCursor.y}</h3>
          <button onClick={() => setMonthCursor((c) => { const m = c.m + 1; return m > 11 ? { y: c.y + 1, m: 0 } : { ...c, m }; })} style={navBtnStyle}><ChevronRight size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} style={{ textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#a89a86", fontSize: 12.5, padding: "4px 0" }}>{d}</div>
          ))}
          {cal.map((cell, i) => {
            if (!cell) return <div key={i} />;
            const isToday = cell.iso === new Date().toISOString().slice(0, 10);
            const todayIso = new Date().toISOString().slice(0, 10);
            const isPast = cell.iso < todayIso;
            const hasEv = cell.events.length > 0;
            // clic : sur un événement → ouvre sa fiche ; sur case vide future → crée à cette date
            const handleClick = () => {
              if (hasEv) { setSelected(cell.events[0].id); return; }
              if (!isPast && currentUser) { setPresetDate(cell.iso); setShowCreate(true); }
            };
            const clickable = hasEv || (!isPast && currentUser);
            return (
              <button key={i} onClick={handleClick} title={!hasEv && !isPast && currentUser ? "Proposer un moment jeux ce jour" : undefined} style={{
                aspectRatio: "1", border: isToday ? `2px solid ${C.amber}` : "1px solid #efe6d6", borderRadius: 12, background: hasEv ? "rgba(30,138,138,.08)" : "#fff",
                cursor: clickable ? "pointer" : "default", padding: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", position: "relative", opacity: isPast && !hasEv ? 0.5 : 1,
              }}>
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5, color: isToday ? C.amber : C.navy }}>{cell.d}</span>
                {cell.events.slice(0, 2).map((e) => {
                  const reached = (e.players.length + (e.guests?.length || 0)) >= e.min;
                  return <span key={e.id} style={{ width: "82%", marginTop: 3, fontSize: 9.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", background: reached ? C.teal : C.red, borderRadius: 5, padding: "1px 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.time}</span>;
                })}
                {!hasEv && !isPast && currentUser && <Plus size={12} color="#cdb9a0" style={{ marginTop: 2 }} />}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Legend color={C.teal} label="Quorum atteint" /><Legend color={C.red} label="En attente de joueurs" /><Legend color={C.amber} label="Aujourd'hui" outline />
        </div>
      </div>

      {/* LISTE À VENIR */}
      <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 24, margin: "0 0 18px" }}>À venir</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 18 }}>
        {sorted.length === 0 && <EmptyHint icon={Calendar} text="Aucun moment jeux à venir. Proposez-en un !" />}
        {sorted.map((e) => <EventCardMini key={e.id} e={e} onOpen={() => setSelected(e.id)} />)}
      </div>

      {showCreate && <CreateEventModal presetDate={presetDate} onClose={() => { setShowCreate(false); setPresetDate(null); }} onCreate={async (d) => { const res = await addEvent(d); if (res?.error) return res; setShowCreate(false); setPresetDate(null); setToast("Moment jeux créé !"); return {}; }} />}
      {selectedEvent && <EventDetailModal e={selectedEvent} onClose={() => setSelected(null)} onJoin={toggleJoin} onRemove={async (id) => { await removeEvent(id); setSelected(null); setToast("Moment jeux supprimé."); }} onAuth={onAuth} />}
    </div>
  );
}
const navBtnStyle = { background: "rgba(26,58,92,.07)", border: "none", borderRadius: 10, width: 38, height: 38, cursor: "pointer", display: "grid", placeItems: "center", color: C.navy };
function Legend({ color, label, outline }) {
  return <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#6e6256" }}>
    <span style={{ width: 14, height: 14, borderRadius: 5, background: outline ? "transparent" : color, border: outline ? `2px solid ${color}` : "none" }} /> {label}
  </span>;
}

/* ---- Modale création moment jeux (fond rouge/vert dynamique) ---- */
function CreateEventModal({ onClose, onCreate, presetDate }) {
  const { currentUser, users } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const startDate = presetDate || today;
  const [f, setF] = useState({ date: startDate, time: "20:00", place: "Local ALADJ — Gouville-sur-Mer", min: 3, max: 6, notes: "", joinSelf: true, useDeadline: false, deadlineDate: startDate, deadlineTime: "18:00" });
  const [invites, setInvites] = useState([]); // {name, memberId|null}
  const [showInvite, setShowInvite] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // le "fond" reflète : moi (si joinSelf) + invités ajoutés
  const startCount = (f.joinSelf ? 1 : 0) + invites.length;
  const reached = startCount >= Number(f.min);

  const addInvite = (name, memberId) => { setInvites((arr) => [...arr, { name, memberId }]); setShowInvite(false); };
  const removeInvite = (idx) => setInvites((arr) => arr.filter((_, i) => i !== idx));

  const submit = async () => {
    setErr("");
    if (!f.date || !f.time || !f.place.trim()) { setErr("Renseignez la date, l'heure et le lieu."); return; }
    if (Number(f.min) > Number(f.max)) { setErr("Le minimum ne peut pas dépasser le maximum."); return; }
    let deadline = null;
    if (f.useDeadline && f.deadlineDate && f.deadlineTime) {
      deadline = new Date(`${f.deadlineDate}T${f.deadlineTime}:00`).toISOString();
    }
    setBusy(true);
    const res = await onCreate({
      date: f.date, time: f.time, place: f.place.trim(),
      min: Number(f.min), max: Number(f.max), notes: f.notes.trim(),
      joinSelf: f.joinSelf, deadline, invites,
    });
    setBusy(false);
    if (res?.error) setErr(res.error);
  };

  return (
    <Modal open onClose={onClose} title="Proposer un moment jeux" width={580}>
      {/* bandeau d'état dynamique */}
      <div style={{
        borderRadius: 16, padding: "18px 20px", marginBottom: 22, color: "#fff", transition: "background .4s",
        background: reached ? `linear-gradient(135deg,${C.teal},#13615f)` : `linear-gradient(135deg,${C.red},#8a1f2d)`,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center" }}>
          {reached ? <Check size={26} /> : <Users size={26} />}
        </div>
        <div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 17 }}>
            {reached ? "Quorum atteint — c'est lancé !" : "En attente de joueurs"}
          </div>
          <div style={{ fontSize: 13.5, opacity: .9 }}>
            {reached ? `Avec ${startCount} inscrit(s), le minimum de ${f.min} est couvert.` : `Il manque ${Math.max(0, f.min - startCount)} joueur(s) pour atteindre le minimum.`}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Jour"><TextInput type="date" min={today} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Heure"><TextInput type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
      </div>
      <Field label="Lieu"><TextInput value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })} placeholder="Ex. Local ALADJ — Gouville-sur-Mer" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Joueurs min."><TextInput type="number" min={1} max={30} value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
        <Field label="Joueurs max."><TextInput type="number" min={1} max={40} value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></Field>
      </div>

      {/* m'inscrire moi-même */}
      <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(30,138,138,.07)", marginBottom: 14, cursor: "pointer" }}>
        <input type="checkbox" checked={f.joinSelf} onChange={(e) => setF({ ...f, joinSelf: e.target.checked })} style={{ width: 18, height: 18, accentColor: C.teal }} />
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>Je m'inscris à ce moment jeux</span>
      </label>

      {/* invités dès la création */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: invites.length ? 10 : 0 }}>
          {invites.map((inv, idx) => (
            <span key={idx} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(107,58,122,.1)", padding: "6px 12px", borderRadius: 999 }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: C.purple, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 11 }}>{inv.name[0].toUpperCase()}</span>
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13 }}>{inv.name}</span>
              {inv.memberId && <span style={{ fontSize: 10, color: C.purple }}>(membre)</span>}
              <button onClick={() => removeInvite(idx)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#a07ab0", display: "grid", placeItems: "center" }}><X size={13} /></button>
            </span>
          ))}
        </div>
        {!showInvite ? (
          <Btn size="sm" variant="soft" onClick={() => setShowInvite(true)}><UserPlus size={15} /> Ajouter un invité</Btn>
        ) : (
          <GuestAdderInline users={users} excludeIds={invites.map((i) => i.memberId).filter(Boolean)} onAdd={addInvite} onCancel={() => setShowInvite(false)} />
        )}
      </div>

      {/* date limite de validation */}
      <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(232,163,23,.1)", marginBottom: f.useDeadline ? 12 : 14, cursor: "pointer" }}>
        <input type="checkbox" checked={f.useDeadline} onChange={(e) => setF({ ...f, useDeadline: e.target.checked })} style={{ width: 18, height: 18, accentColor: C.amber }} />
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>Fixer une date limite (le moment jeux disparaît si le minimum n'est pas atteint à temps)</span>
      </label>
      {f.useDeadline && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Valable jusqu'au"><TextInput type="date" min={today} max={f.date} value={f.deadlineDate} onChange={(e) => setF({ ...f, deadlineDate: e.target.value })} /></Field>
          <Field label="à"><TextInput type="time" value={f.deadlineTime} onChange={(e) => setF({ ...f, deadlineTime: e.target.value })} /></Field>
        </div>
      )}

      <Field label="Note (jeux prévus, ambiance...)" hint="Facultatif">
        <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} placeholder="On sort les gros jeux de gestion ? Apéro partagé..."
          style={{ ...inputStyle, resize: "vertical", fontFamily: "'Nunito',sans-serif" }} />
      </Field>
      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" variant={reached ? "teal" : "amber"} onClick={submit} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Plus size={18} /> Créer le moment jeux</>}</Btn>
    </Modal>
  );
}

/* ---- Modale détail soirée (fond plein rouge/vert) ---- */
function EventDetailModal({ e, onClose, onJoin, onRemove, onAuth }) {
  const { currentUser, users, addGuest, removeGuest, addComment, updateComment, removeComment } = useApp();
  const totalCount = e.players.length + (e.guests?.length || 0);
  const reached = totalCount >= e.min;
  const full = totalCount >= e.max;
  const isIn = currentUser && e.players.some((p) => p.id === currentUser.id);
  const isParticipant = currentUser && (isIn || e.hostId === currentUser.id);
  const canManage = currentUser && (currentUser.id === e.hostId || currentUser.admin);

  const [showGuest, setShowGuest] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);

  const deadlineStr = e.deadline ? new Date(e.deadline) : null;
  const deadlinePassed = deadlineStr && Date.now() > deadlineStr.getTime();

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setBusy(true); await addComment(e.id, commentText); setBusy(false); setCommentText("");
  };
  const saveEdit = async () => {
    if (!editText.trim()) return;
    await updateComment(editingId, editText); setEditingId(null); setEditText("");
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 16px", overflowY: "auto",
      background: reached ? "rgba(19,97,95,.92)" : "rgba(138,31,45,.92)", transition: "background .4s", backdropFilter: "blur(3px)" }}>
      <div onClick={(ev) => ev.stopPropagation()} style={{ background: C.paper, borderRadius: 24, width: "100%", maxWidth: 560, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.4)", animation: "popIn .25s ease" }}>
        <div style={{ padding: "22px 26px", color: "#fff", background: reached ? `linear-gradient(135deg,${C.teal},#13615f)` : `linear-gradient(135deg,${C.red},#8a1f2d)`, position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,.2)", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", color: "#fff" }}><X size={18} /></button>
          <Badge color="#fff" soft={false}>{reached ? <><Check size={13} /> Moment jeux confirmé</> : "En attente de joueurs"}</Badge>
          <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 26, margin: "12px 0 4px", textTransform: "capitalize" }}>{formatDateFr(e.date)}</h2>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", opacity: .95, fontSize: 14.5 }}>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Clock size={16} /> {e.time}</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><MapPin size={16} /> {e.place}</span>
          </div>
        </div>

        <div style={{ padding: 26 }}>
          {/* date limite */}
          {deadlineStr && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: reached ? "rgba(30,138,138,.1)" : "rgba(232,163,23,.12)", borderRadius: 11, padding: "9px 14px", marginBottom: 16, fontSize: 13, color: reached ? C.teal : "#9a7b2a", fontWeight: 600 }}>
              <Clock size={15} />
              {reached ? "Quorum atteint, le moment jeux est maintenu." : `À valider avant le ${formatDateFr(deadlineStr.toISOString().slice(0,10))} à ${deadlineStr.toTimeString().slice(0,5)}`}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 17 }}>
              {totalCount} / {e.max} participants
            </span>
            <span style={{ fontSize: 13.5, color: reached ? C.teal : C.red, fontWeight: 700 }}>
              {reached ? "Minimum atteint ✓" : `Encore ${e.min - totalCount} pour valider`}
            </span>
          </div>
          <div style={{ height: 12, borderRadius: 99, background: "#eee4d2", overflow: "hidden", marginBottom: 6, position: "relative" }}>
            <div style={{ height: "100%", width: `${Math.min(100, (totalCount / e.max) * 100)}%`, background: reached ? C.teal : C.red, transition: "width .4s" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, left: `${(e.min / e.max) * 100}%`, width: 2, background: C.navy, opacity: .4 }} />
          </div>
          <div style={{ fontSize: 11.5, color: "#9c8d79", marginBottom: 18 }}>↑ le repère indique le minimum requis ({e.min})</div>

          {/* participants inscrits + invités */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {totalCount === 0 && <span style={{ color: "#a89a86", fontSize: 14 }}>Personne inscrit pour l'instant.</span>}
            {e.players.map((p) => (
              <span key={p.id} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(30,138,138,.1)", padding: "6px 12px", borderRadius: 999 }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, background: C.teal, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12 }}>{p.name[0].toUpperCase()}</span>
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5 }}>{p.name}</span>
              </span>
            ))}
            {(e.guests || []).map((g) => {
              const canRemoveGuest = currentUser && (g.addedBy === currentUser.id || canManage);
              return (
                <span key={g.id} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(107,58,122,.1)", padding: "6px 12px", borderRadius: 999 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 7, background: C.purple, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12 }}>{g.name[0].toUpperCase()}</span>
                  <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5 }}>{g.name}</span>
                  {g.memberId && <span style={{ fontSize: 10.5, color: C.purple }}>(membre)</span>}
                  {canRemoveGuest && <button onClick={() => removeGuest(g.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#a07ab0", display: "grid", placeItems: "center" }}><X size={14} /></button>}
                </span>
              );
            })}
          </div>

          {/* ajouter un invité (participants + créateur) */}
          {isParticipant && (
            <div style={{ marginBottom: 18 }}>
              {!showGuest ? (
                <Btn size="sm" variant="soft" onClick={() => setShowGuest(true)}><UserPlus size={15} /> Ajouter un invité</Btn>
              ) : (
                <GuestAdder users={users} currentEvent={e} onAdd={addGuest} onDone={() => setShowGuest(false)} />
              )}
            </div>
          )}

          {e.notes && <div style={{ background: "rgba(232,163,23,.1)", borderRadius: 13, padding: "12px 16px", marginBottom: 18, fontSize: 14, color: "#6e5e42", lineHeight: 1.5 }}><b style={{ fontFamily: "'Fredoka',sans-serif", color: C.amber }}>Note :</b> {e.notes}</div>}

          <div style={{ fontSize: 13, color: "#9c8d79", marginBottom: 16 }}>Proposée par <b style={{ color: C.navy }}>{e.hostName}</b></div>

          {currentUser ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
              <Btn full={!canManage} size="lg" variant={isIn ? "ghost" : (reached ? "teal" : "red")} disabled={!isIn && full} onClick={() => onJoin(e.id)} style={canManage ? { flex: 1 } : {}}>
                {isIn ? <><X size={17} /> Me retirer</> : full ? "Complet" : <><Check size={17} /> Je participe</>}
              </Btn>
              {canManage && <Btn variant="danger" size="lg" onClick={() => onRemove(e.id)}><Trash2 size={17} /></Btn>}
            </div>
          ) : (
            <Btn full size="lg" variant="primary" onClick={() => { onClose(); onAuth("login"); }} style={{ marginBottom: 22 }}><LogIn size={18} /> Se connecter pour participer</Btn>
          )}

          {/* COMMENTAIRES */}
          <div style={{ borderTop: "1px solid #f0e8d8", paddingTop: 18 }}>
            <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: "0 0 12px" }}>💬 Discussion ({(e.comments || []).length})</h4>
            <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
              {(e.comments || []).length === 0 && <span style={{ color: "#a89a86", fontSize: 13.5 }}>Aucun commentaire. Lancez la discussion !</span>}
              {(e.comments || []).map((c) => {
                const mine = currentUser && c.authorId === currentUser.id;
                const edited = c.updatedAt && c.createdAt && new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime() > 2000;
                return (
                  <div key={c.id} style={{ background: "rgba(26,58,92,.04)", borderRadius: 13, padding: "10px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: mine ? C.teal : C.navy, fontSize: 13.5 }}>{c.authorName}{mine ? " (vous)" : ""}</span>
                      {mine && editingId !== c.id && (
                        <span style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => { setEditingId(c.id); setEditText(c.content); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79", padding: 0 }}><Edit3 size={14} /></button>
                          <button onClick={() => removeComment(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 0 }}><Trash2 size={14} /></button>
                        </span>
                      )}
                    </div>
                    {editingId === c.id ? (
                      <div>
                        <textarea value={editText} onChange={(ev) => setEditText(ev.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <Btn size="sm" variant="teal" onClick={saveEdit}><Check size={14} /> Enregistrer</Btn>
                          <Btn size="sm" variant="soft" onClick={() => setEditingId(null)}>Annuler</Btn>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5, whiteSpace: "pre-line" }}>{c.content}{edited && <span style={{ fontSize: 11, color: "#b6a78f", fontStyle: "italic" }}> (modifié)</span>}</div>
                    )}
                  </div>
                );
              })}
            </div>
            {currentUser ? (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea value={commentText} onChange={(ev) => setCommentText(ev.target.value)} rows={1} placeholder="Écrire un commentaire..." style={{ ...inputStyle, resize: "vertical", flex: 1 }} />
                <Btn variant="teal" onClick={submitComment} disabled={busy || !commentText.trim()}>{busy ? <Loader2 size={16} className="aladj-spin" /> : "Envoyer"}</Btn>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: "#a89a86" }}>Connectez-vous pour commenter.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Variante "inline" : collecte un invité sans toucher la base (pour la création) ---- */
function GuestAdderInline({ users, excludeIds = [], onAdd, onCancel }) {
  const [mode, setMode] = useState("guest");
  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState("");
  const availableMembers = users.filter((u) => !excludeIds.includes(u.id));

  const submit = () => {
    if (mode === "member" && memberId) {
      const m = users.find((u) => u.id === memberId);
      onAdd(m.name, memberId);
    } else if (mode === "guest" && name.trim()) {
      onAdd(name.trim(), null);
    }
  };

  return (
    <div style={{ background: "rgba(107,58,122,.06)", borderRadius: 14, padding: 14, border: "1px solid rgba(107,58,122,.2)" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, background: "#fff", padding: 4, borderRadius: 10 }}>
        {[["guest", "Invité sans compte"], ["member", "Membre du site"]].map(([k, lbl]) => (
          <button key={k} type="button" onClick={() => setMode(k)} style={{ flex: 1, padding: "7px", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12.5, background: mode === k ? C.purple : "transparent", color: mode === k ? "#fff" : "#9c8d79" }}>{lbl}</button>
        ))}
      </div>
      {mode === "guest" ? (
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'invité (ex. conjoint, enfant...)" style={{ marginBottom: 10 }} />
      ) : (
        <select value={memberId} onChange={(e) => setMemberId(e.target.value)} style={{ ...inputStyle, marginBottom: 10, cursor: "pointer" }}>
          <option value="">Choisir un membre...</option>
          {availableMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn size="sm" variant="teal" onClick={submit} disabled={mode === "guest" ? !name.trim() : !memberId}><Check size={14} /> Ajouter</Btn>
        <Btn size="sm" variant="soft" onClick={onCancel}>Annuler</Btn>
      </div>
    </div>
  );
}

/* ---- Sous-composant : ajouter un invité (membre OU sans compte) ---- */
function GuestAdder({ users, currentEvent, onAdd, onDone }) {
  const [mode, setMode] = useState("guest"); // "guest" (sans compte) | "member"
  const [name, setName] = useState("");
  const [memberId, setMemberId] = useState("");
  const [busy, setBusy] = useState(false);

  // membres pas déjà inscrits/invités
  const alreadyIn = new Set([...currentEvent.players.map((p) => p.id), ...(currentEvent.guests || []).map((g) => g.memberId).filter(Boolean)]);
  const availableMembers = users.filter((u) => !alreadyIn.has(u.id));

  const submit = async () => {
    setBusy(true);
    if (mode === "member" && memberId) {
      const m = users.find((u) => u.id === memberId);
      await onAdd(currentEvent.id, m.name, memberId);
    } else if (mode === "guest" && name.trim()) {
      await onAdd(currentEvent.id, name.trim(), null);
    }
    setBusy(false); onDone();
  };

  return (
    <div style={{ background: "rgba(107,58,122,.06)", borderRadius: 14, padding: 14, border: "1px solid rgba(107,58,122,.2)" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, background: "#fff", padding: 4, borderRadius: 10 }}>
        {[["guest", "Invité sans compte"], ["member", "Membre du site"]].map(([k, lbl]) => (
          <button key={k} onClick={() => setMode(k)} style={{ flex: 1, padding: "7px", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12.5, background: mode === k ? C.purple : "transparent", color: mode === k ? "#fff" : "#9c8d79" }}>{lbl}</button>
        ))}
      </div>
      {mode === "guest" ? (
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'invité (ex. conjoint, enfant...)" style={{ marginBottom: 10 }} />
      ) : (
        <select value={memberId} onChange={(e) => setMemberId(e.target.value)} style={{ ...inputStyle, marginBottom: 10, cursor: "pointer" }}>
          <option value="">Choisir un membre...</option>
          {availableMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn size="sm" variant="teal" onClick={submit} disabled={busy || (mode === "guest" ? !name.trim() : !memberId)}>{busy ? <Loader2 size={14} className="aladj-spin" /> : <><Check size={14} /> Ajouter</>}</Btn>
        <Btn size="sm" variant="soft" onClick={onDone}>Annuler</Btn>
      </div>
    </div>
  );
}

/* =============================================================================
   CARTE DE JEU + DÉTAIL
   ============================================================================= */
function GameCover({ g, size = "md" }) {
  const heights = { sm: 56, md: 150, lg: 220 };
  const h = heights[size];
  if (g.img) {
    return <div style={{ height: h, background: `#11202f url(${g.img}) center/cover`, borderRadius: size === "sm" ? 10 : 0 }} />;
  }
  // placeholder coloré
  const palette = [C.teal, C.amber, C.red, C.purple, C.navy];
  const col = palette[(g.name.charCodeAt(0) + (g.name.length || 0)) % palette.length];
  return (
    <div style={{ height: h, background: `linear-gradient(135deg, ${col}, ${col}cc)`, display: "grid", placeItems: "center", borderRadius: size === "sm" ? 10 : 0, position: "relative", overflow: "hidden" }}>
      <Dice color="rgba(255,255,255,.25)" n={(g.name.length % 6) + 1} style={{ position: "absolute", width: h * 0.55, right: -h * 0.1, bottom: -h * 0.12, transform: "rotate(12deg)" }} />
      <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: size === "sm" ? 18 : 34, textAlign: "center", padding: 8, lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,.25)", zIndex: 1 }}>
        {g.name.split(" ").slice(0, 3).map((w) => w[0]).join("").toUpperCase().slice(0, 3)}
      </span>
    </div>
  );
}

function GameCard({ g, onOpen }) {
  const { avg, count } = gameStats(g);
  return (
    <button onClick={onOpen} style={{ textAlign: "left", cursor: "pointer", border: "1px solid #ece2d0", borderRadius: 18, overflow: "hidden", padding: 0, background: C.paper, boxShadow: "0 4px 16px rgba(18,41,63,.05)", transition: "transform .15s, box-shadow .2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(18,41,63,.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(18,41,63,.05)"; }}>
      <div style={{ position: "relative" }}>
        <GameCover g={g} />
        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(18,41,63,.85)", color: "#fff", borderRadius: 999, padding: "4px 10px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
          <Star size={13} fill={C.amber} color={C.amber} /> {count ? avg.toFixed(1) : "—"}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: "0 0 4px", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</h3>
        <div style={{ display: "flex", gap: 10, color: "#8a7c6a", fontSize: 12.5, marginBottom: 10, flexWrap: "wrap" }}>
          {g.min && <span><Users size={12} style={{ verticalAlign: "-1px" }} /> {g.min}{g.max && g.max !== g.min ? `-${g.max}` : ""}</span>}
          {g.time && <span><Clock size={12} style={{ verticalAlign: "-1px" }} /> {g.time} min</span>}
          {g.year && <span>{g.year}</span>}
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
          {(g.mechanics || []).slice(0, 2).map((m, i) => <Badge key={i} color={C.purple}>{m}</Badge>)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0e8d8", paddingTop: 10 }}>
          <span style={{ fontSize: 12, color: "#9c8d79" }}>chez <b style={{ color: C.teal }}>{g.ownerName}</b></span>
          <span style={{ fontSize: 11.5, color: "#b6a78f" }}>{count} vote{count > 1 ? "s" : ""}</span>
        </div>
      </div>
    </button>
  );
}

function GameDetailModal({ g, onClose, onAuth, setToast }) {
  const { currentUser, rateGame, removeGame, updateGame, users } = useApp();
  const { avg, count } = gameStats(g);
  const myRating = currentUser ? (g.ratings?.[currentUser.id] || 0) : 0;
  const canManage = currentUser && (currentUser.id === g.ownerId || currentUser.admin);
  const [editing, setEditing] = useState(false);

  // distribution des notes
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: Object.values(g.ratings || {}).filter((v) => v === n).length }));

  return (
    <Modal open onClose={onClose} title={g.name} width={620}>
      <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 18 }}><GameCover g={g} size="lg" /></div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        {g.year && <Badge color={C.navy}>{g.year}</Badge>}
        {g.min && <Badge color={C.teal}><Users size={12} /> {g.min}{g.max && g.max !== g.min ? `–${g.max}` : ""} joueurs</Badge>}
        {g.time && <Badge color={C.amber}><Clock size={12} /> {g.time} min</Badge>}
        {g.source && g.source !== "manuel" && <Badge color={C.purple}><Globe size={12} /> {g.source}</Badge>}
      </div>

      {/* note moyenne */}
      <div style={{ display: "flex", gap: 20, alignItems: "center", background: "rgba(232,163,23,.08)", borderRadius: 16, padding: "16px 20px", marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 42, color: C.amber, lineHeight: 1 }}>{count ? avg.toFixed(1) : "—"}</div>
          <Stars value={Math.round(avg)} readOnly size={15} />
          <div style={{ fontSize: 12, color: "#9c8d79", marginTop: 3 }}>{count} avis</div>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          {dist.map((d) => (
            <div key={d.n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 11.5, color: "#8a7c6a", width: 28 }}>{d.n} ★</span>
              <div style={{ flex: 1, height: 7, background: "#eee4d2", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: count ? `${(d.c / count) * 100}%` : 0, background: C.amber }} />
              </div>
              <span style={{ fontSize: 11.5, color: "#b6a78f", width: 16, textAlign: "right" }}>{d.c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ma note */}
      <div style={{ background: C.paper, border: "2px solid #ece2d0", borderRadius: 16, padding: "14px 18px", marginBottom: 18 }}>
        {currentUser ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy }}>Votre note {myRating ? `: ${myRating}/5` : ""}</span>
            <Stars value={myRating} size={26} onRate={async (v) => { await rateGame(g.id, v); setToast(v === myRating ? "Note retirée" : `Noté ${v}/5 !`); }} />
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "#8a7c6a", fontSize: 14 }}>Connectez-vous pour noter ce jeu.</span>
            <Btn size="sm" onClick={() => { onClose(); onAuth("login"); }}><LogIn size={15} /> Connexion</Btn>
          </div>
        )}
      </div>

      {/* présentation */}
      <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: "0 0 8px" }}><BookOpen size={16} style={{ verticalAlign: "-2px" }} /> Présentation</h4>
      <p style={{ color: "#5e5346", fontSize: 14.5, lineHeight: 1.6, margin: "0 0 18px", whiteSpace: "pre-line" }}>{g.desc || "Pas encore de description pour ce jeu."}</p>

      {(g.mechanics || []).length > 0 && (
        <>
          <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: "0 0 8px" }}>Mécaniques</h4>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
            {g.mechanics.map((m, i) => <Badge key={i} color={C.purple}>{m}</Badge>)}
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0e8d8", paddingTop: 16, flexWrap: "wrap", gap: 10 }}>
        <span style={{ fontSize: 13.5, color: "#8a7c6a" }}>Apporté par <b style={{ color: C.teal, fontFamily: "'Fredoka',sans-serif" }}>{g.ownerName}</b></span>
        {canManage && (
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" variant="soft" onClick={() => setEditing(true)}><Edit3 size={14} /> Modifier</Btn>
            <Btn size="sm" variant="danger" onClick={async () => { await removeGame(g.id); onClose(); setToast("Jeu retiré de la ludothèque."); }}><Trash2 size={14} /> Retirer</Btn>
          </div>
        )}
      </div>

      {editing && <EditGameModal g={g} onClose={() => setEditing(false)} onSave={async (patch) => { await updateGame(g.id, patch); setEditing(false); setToast("Jeu mis à jour."); }} />}
    </Modal>
  );
}

function EditGameModal({ g, onClose, onSave }) {
  const [f, setF] = useState({ name: g.name, year: g.year, min: g.min, max: g.max, time: g.time, desc: g.desc, img: g.img, mechanics: (g.mechanics || []).join(", ") });
  return (
    <Modal open onClose={onClose} title="Modifier le jeu" width={560}>
      <Field label="Nom"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Année"><TextInput type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></Field>
        <Field label="Min"><TextInput type="number" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
        <Field label="Max"><TextInput type="number" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></Field>
      </div>
      <Field label="Durée (min)"><TextInput type="number" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
      <Field label="Mécaniques (séparées par des virgules)"><TextInput value={f.mechanics} onChange={(e) => setF({ ...f, mechanics: e.target.value })} /></Field>
      <Field label="Image (URL)"><TextInput value={f.img} onChange={(e) => setF({ ...f, img: e.target.value })} /></Field>
      <Field label="Présentation"><textarea rows={4} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} /></Field>
      <Btn full size="lg" onClick={() => onSave({ ...f, year: Number(f.year) || "", min: Number(f.min) || "", max: Number(f.max) || "", time: Number(f.time) || "", mechanics: f.mechanics.split(",").map((s) => s.trim()).filter(Boolean) })}><Check size={18} /> Enregistrer</Btn>
    </Modal>
  );
}

/* =============================================================================
   PAGE — LUDOTHÈQUE GÉNÉRALE
   ============================================================================= */
// classement avec départage : note moyenne desc, puis nb votants desc, puis alpha
function rankGames(games, restrictUserIds = null) {
  return [...games].map((g) => {
    let ratings = g.ratings || {};
    if (restrictUserIds) {
      ratings = Object.fromEntries(Object.entries(ratings).filter(([uid]) => restrictUserIds.includes(uid)));
    }
    const vals = Object.values(ratings);
    const count = vals.length;
    const avg = count ? vals.reduce((a, b) => a + b, 0) / count : 0;
    return { ...g, _avg: avg, _count: count };
  }).sort((a, b) => {
    if (b._avg !== a._avg) return b._avg - a._avg;
    if (b._count !== a._count) return b._count - a._count;
    return a.name.localeCompare(b.name, "fr");
  });
}

function LudothequePage({ onAuth, setToast, setPage }) {
  const { games, users, currentUser } = useApp();
  const [q, setQ] = useState("");
  const [mech, setMech] = useState("");
  const [sort, setSort] = useState("note");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCustomRank, setShowCustomRank] = useState(false);

  const allMechanics = useMemo(() => {
    const s = new Set();
    games.forEach((g) => (g.mechanics || []).forEach((m) => s.add(m)));
    return [...s].sort((a, b) => a.localeCompare(b, "fr"));
  }, [games]);

  const filtered = useMemo(() => {
    let list = games.filter((g) => {
      const okQ = !q || g.name.toLowerCase().includes(q.toLowerCase()) || (g.ownerName || "").toLowerCase().includes(q.toLowerCase());
      const okM = !mech || (g.mechanics || []).includes(mech);
      return okQ && okM;
    });
    if (sort === "note") list = rankGames(list);
    else if (sort === "alpha") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    else if (sort === "recent") list = [...list].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    return list;
  }, [games, q, mech, sort]);

  const top = useMemo(() => rankGames(games).filter((g) => g._count > 0).slice(0, 5), [games]);
  const selectedGame = games.find((g) => g.id === selected);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 26 }}>
        <div>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em" }}>La collection de l'asso</span>
          <h1 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: "clamp(30px,5vw,44px)", margin: "4px 0 0", letterSpacing: "-0.02em" }}>Ludothèque · {games.length} jeux</h1>
        </div>
        {currentUser
          ? <Btn variant="amber" size="lg" onClick={() => setShowAdd(true)}><Plus size={18} /> Ajouter un jeu</Btn>
          : <Btn variant="ghost" onClick={() => onAuth("login")}><LogIn size={16} /> Connectez-vous pour ajouter</Btn>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, alignItems: "start" }} className="aladj-ludo-grid">
        {/* COLONNE PRINCIPALE */}
        <div>
          {/* recherche + filtres */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={18} color="#b6a78f" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un jeu, un propriétaire..." style={{ paddingLeft: 42 }} />
            </div>
            <select value={mech} onChange={(e) => setMech(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes mécaniques</option>
              {allMechanics.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="note">Mieux notés</option>
              <option value="alpha">A → Z</option>
              <option value="recent">Récents</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
            {filtered.length === 0 && <EmptyHint icon={Library} text="Aucun jeu ne correspond." />}
            {filtered.map((g) => <GameCard key={g.id} g={g} onOpen={() => setSelected(g.id)} />)}
          </div>
        </div>

        {/* COLONNE LATÉRALE : classements */}
        <aside style={{ position: "sticky", top: 88, display: "grid", gap: 18 }} className="aladj-ludo-aside">
          {/* TOP 5 */}
          <div style={{ background: `linear-gradient(160deg, ${C.navy}, ${C.navyDeep})`, borderRadius: 20, padding: 22, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Trophy size={20} color={C.amber} />
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 19, margin: 0 }}>Top jeux de l'asso</h3>
            </div>
            {top.length === 0 && <p style={{ opacity: .7, fontSize: 14 }}>Aucune note pour l'instant.</p>}
            <div style={{ display: "grid", gap: 8 }}>
              {top.map((g, i) => (
                <button key={g.id} onClick={() => setSelected(g.id)} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.07)", border: "none", borderRadius: 12, padding: "9px 12px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 18, color: [C.amber, "#d9d9d9", "#cd9b6a", "rgba(255,255,255,.5)", "rgba(255,255,255,.5)"][i], width: 22 }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 14.5, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                    <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)" }}>{g._count} vote{g._count > 1 ? "s" : ""}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.amber, fontFamily: "'Fredoka',sans-serif", fontWeight: 700 }}>
                    <Star size={14} fill={C.amber} /> {g._avg.toFixed(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* CLASSEMENT PERSONNALISÉ */}
          <div style={{ background: C.paper, borderRadius: 20, padding: 22, border: `2px solid ${C.teal}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Award size={20} color={C.teal} />
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 18, margin: 0, color: C.navy }}>Classement sur-mesure</h3>
            </div>
            <p style={{ fontSize: 13.5, color: "#6e6256", lineHeight: 1.5, margin: "0 0 14px" }}>
              Choisissez les membres présents à votre moment jeux pour trouver le jeu qui plaira au plus grand nombre.
            </p>
            <Btn full variant="teal" onClick={() => setShowCustomRank(true)}><Filter size={16} /> Composer ma tablée</Btn>
          </div>
        </aside>
      </div>

      {showAdd && <AddGameFlow onClose={() => setShowAdd(false)} setToast={setToast} />}
      {selectedGame && <GameDetailModal g={selectedGame} onClose={() => setSelected(null)} onAuth={onAuth} setToast={setToast} />}
      {showCustomRank && <CustomRankModal onClose={() => setShowCustomRank(false)} onOpenGame={(id) => { setShowCustomRank(false); setSelected(id); }} />}
    </div>
  );
}

/* ---- Classement personnalisé par membres ---- */
function CustomRankModal({ onClose, onOpenGame }) {
  const { users, games } = useApp();
  const [chosen, setChosen] = useState([]);
  const toggle = (id) => setChosen((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);

  const ranked = useMemo(() => {
    if (chosen.length === 0) return [];
    return rankGames(games, chosen).filter((g) => g._count > 0).slice(0, 12);
  }, [games, chosen]);

  return (
    <Modal open onClose={onClose} title="Classement pour votre tablée" width={620}>
      <p style={{ fontSize: 14, color: "#6e6256", margin: "0 0 16px", lineHeight: 1.5 }}>
        Sélectionnez les membres présents : le classement ne tient compte que de <b>leurs</b> notes. Idéal pour choisir un jeu qui mettra tout le monde d'accord.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
        {users.map((u) => {
          const active = chosen.includes(u.id);
          return (
            <button key={u.id} onClick={() => toggle(u.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, cursor: "pointer",
              border: `2px solid ${active ? C.teal : "#e6dcc9"}`, background: active ? C.teal : "#fff", color: active ? "#fff" : C.navy,
              fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 14, transition: "all .12s",
            }}>
              {active && <Check size={15} />} {u.name}
            </button>
          );
        })}
      </div>

      {chosen.length === 0 ? (
        <EmptyHint icon={Users} text="Sélectionnez au moins un membre." />
      ) : ranked.length === 0 ? (
        <EmptyHint icon={Star} text="Ces membres n'ont pas encore noté de jeux." />
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontSize: 12.5, color: "#9c8d79", marginBottom: 2 }}>{chosen.length} membre(s) · {ranked.length} jeu(x) noté(s)</div>
          {ranked.map((g, i) => (
            <button key={g.id} onClick={() => onOpenGame(g.id)} style={{ display: "flex", alignItems: "center", gap: 14, background: i === 0 ? "rgba(232,163,23,.1)" : "rgba(26,58,92,.04)", border: "none", borderRadius: 13, padding: "11px 16px", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 20, color: i === 0 ? C.amber : "#b6a78f", width: 26 }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15.5 }}>{g.name}</span>
                <span style={{ fontSize: 12, color: "#9c8d79" }}>{g._count} vote(s) parmi la sélection · chez {g.ownerName}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.amber, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 17 }}>
                <Star size={16} fill={C.amber} /> {g._avg.toFixed(1)}
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* =============================================================================
   AJOUT DE JEU — import BGG / TricTrac / manuel
   ============================================================================= */
function AddGameFlow({ onClose, setToast }) {
  const { addGame } = useApp();
  const [mode, setMode] = useState("choose"); // choose | bgg | manual
  return (
    <Modal open onClose={onClose} title="Ajouter un jeu à la ludothèque" width={640}>
      {mode === "choose" && (
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ fontSize: 14, color: "#6e6256", margin: "0 0 4px", lineHeight: 1.5 }}>Comment souhaitez-vous ajouter ce jeu ? L'import récupère automatiquement la fiche (joueurs, durée, image, mécaniques) et traduit la description en français.</p>
          <SourceBtn icon={Globe} color={C.teal} title="Importer depuis BoardGameGeek" desc="Recherche dans la plus grande base mondiale + traduction auto en français." onClick={() => setMode("bgg")} />
          <SourceBtn icon={Search} color={C.purple} title="Importer depuis TricTrac" desc="Recherche par nom (via la base mondiale, fiches en français)." onClick={() => setMode("bgg")} badge="Recherche FR" />
          <SourceBtn icon={PenLine} color={C.amber} title="Saisir manuellement" desc="Remplissez vous-même la fiche du jeu." onClick={() => setMode("manual")} />
        </div>
      )}
      {mode === "bgg" && <BggImport onBack={() => setMode("choose")} onDone={async (data) => { await addGame({ ...data, source: "BoardGameGeek" }); onClose(); setToast(`« ${data.name} » ajouté !`); }} />}
      {mode === "manual" && <ManualForm onBack={() => setMode("choose")} onDone={async (data) => { await addGame({ ...data, source: "manuel" }); onClose(); setToast(`« ${data.name} » ajouté !`); }} />}
    </Modal>
  );
}

function SourceBtn({ icon: Icon, color, title, desc, onClick, badge }) {
  return (
    <button onClick={onClick} style={{ display: "flex", gap: 14, alignItems: "center", textAlign: "left", padding: "16px 18px", borderRadius: 16, border: "2px solid #ece2d0", background: "#fff", cursor: "pointer", transition: "border-color .15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#ece2d0")}>
      <span style={{ width: 48, height: 48, borderRadius: 13, background: `${color}1a`, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon size={24} color={color} /></span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 16 }}>{title}</span>
          {badge && <Badge color={color}>{badge}</Badge>}
        </span>
        <span style={{ fontSize: 13, color: "#8a7c6a" }}>{desc}</span>
      </span>
      <ChevronRight size={20} color="#cdb9a0" />
    </button>
  );
}

function BggImport({ onBack, onDone }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [importing, setImporting] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [preview, setPreview] = useState(null);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true); setErr(""); setResults([]);
    try {
      const r = await bggSearch(q.trim());
      if (r.length === 0) setErr("Aucun résultat. Essayez un autre nom (souvent le titre anglais fonctionne mieux).");
      setResults(r);
    } catch (e) {
      setErr("Impossible de joindre BoardGameGeek. Réessayez ou saisissez le jeu manuellement.");
    }
    setLoading(false);
  };

  const pick = async (id) => {
    setImporting(id); setErr("");
    try {
      const d = await bggDetails(id);
      setTranslating(true);
      const desc = await translateText(d.desc);
      const mechanics = translateMechanics(d.mechanics);
      setTranslating(false);
      setPreview({ ...d, desc, mechanics });
    } catch (e) {
      setErr("Échec de l'import de ce jeu.");
    }
    setImporting(null);
  };

  if (preview) {
    return (
      <div>
        <button onClick={() => setPreview(null)} style={backLinkStyle}><ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Autre jeu</button>
        <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 16 }}><GameCover g={preview} size="lg" /></div>
        <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 22, margin: "0 0 8px" }}>{preview.name} {preview.year && <span style={{ color: "#b6a78f", fontWeight: 400, fontSize: 16 }}>({preview.year})</span>}</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {preview.min && <Badge color={C.teal}><Users size={12} /> {preview.min}–{preview.max}</Badge>}
          {preview.time && <Badge color={C.amber}><Clock size={12} /> {preview.time} min</Badge>}
          {preview.mechanics.map((m, i) => <Badge key={i} color={C.purple}>{m}</Badge>)}
        </div>
        <div style={{ background: "rgba(30,138,138,.08)", borderRadius: 12, padding: "8px 12px", marginBottom: 12, fontSize: 12.5, color: C.teal, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          <Globe size={14} /> Description traduite automatiquement en français
        </div>
        <p style={{ color: "#5e5346", fontSize: 14, lineHeight: 1.6, maxHeight: 160, overflowY: "auto", margin: "0 0 18px", whiteSpace: "pre-line" }}>{preview.desc}</p>
        <Btn full size="lg" variant="teal" onClick={() => onDone(preview)}><Plus size={18} /> Ajouter à ma ludothèque</Btn>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} style={backLinkStyle}><ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Retour</button>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={18} color="#b6a78f" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Nom du jeu (ex. Wingspan, Catan...)" style={{ paddingLeft: 42 }} autoFocus />
        </div>
        <Btn variant="teal" onClick={search} disabled={loading}>{loading ? <Loader2 size={17} className="aladj-spin" /> : "Chercher"}</Btn>
      </div>
      {translating && <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.teal, fontSize: 13.5, marginBottom: 12, fontWeight: 600 }}><Loader2 size={15} className="aladj-spin" /> Traduction de la fiche en français...</div>}
      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, marginBottom: 14, lineHeight: 1.5 }}>{err}</div>}
      <div style={{ display: "grid", gap: 8, maxHeight: 320, overflowY: "auto" }}>
        {results.map((r) => (
          <button key={r.id} onClick={() => pick(r.id)} disabled={importing} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, border: "1px solid #ece2d0", background: "#fff", cursor: "pointer", textAlign: "left" }}>
            <span>
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 15 }}>{r.name}</span>
              {r.year && <span style={{ color: "#b6a78f", fontSize: 13, marginLeft: 8 }}>{r.year}</span>}
            </span>
            {importing === r.id ? <Loader2 size={16} className="aladj-spin" color={C.teal} /> : <ChevronRight size={18} color="#cdb9a0" />}
          </button>
        ))}
      </div>
    </div>
  );
}
const backLinkStyle = { background: "none", border: "none", color: C.teal, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 14, padding: 0, fontSize: 14 };

function ManualForm({ onBack, onDone }) {
  const [f, setF] = useState({ name: "", year: "", min: "", max: "", time: "", desc: "", img: "", mechanics: [] });
  const [err, setErr] = useState("");
  const toggleMech = (m) => setF((s) => ({ ...s, mechanics: s.mechanics.includes(m) ? s.mechanics.filter((x) => x !== m) : [...s.mechanics, m] }));
  const submit = () => {
    if (!f.name.trim()) { setErr("Le nom du jeu est obligatoire."); return; }
    onDone({ ...f, name: f.name.trim(), year: Number(f.year) || "", min: Number(f.min) || "", max: Number(f.max) || "", time: Number(f.time) || "" });
  };
  return (
    <div>
      <button onClick={onBack} style={backLinkStyle}><ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Retour</button>
      <Field label="Nom du jeu *"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex. Les Aventuriers du Rail" autoFocus /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <Field label="Année"><TextInput type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></Field>
        <Field label="Joueurs min"><TextInput type="number" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
        <Field label="Joueurs max"><TextInput type="number" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></Field>
        <Field label="Durée (min)"><TextInput type="number" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
      </div>
      <Field label="Mécaniques">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {MECHANIC_SUGGESTIONS.map((m) => {
            const active = f.mechanics.includes(m);
            return <button key={m} type="button" onClick={() => toggleMech(m)} style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : "#8a7c6a" }}>{m}</button>;
          })}
        </div>
      </Field>
      <Field label="Image (URL)" hint="Facultatif — collez l'adresse d'une image du jeu"><TextInput value={f.img} onChange={(e) => setF({ ...f, img: e.target.value })} placeholder="https://..." /></Field>
      <Field label="Présentation & mécaniques"><textarea rows={4} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="Décrivez le jeu, son thème, ses mécaniques..." style={{ ...inputStyle, resize: "vertical" }} /></Field>
      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" variant="amber" onClick={submit}><Plus size={18} /> Ajouter le jeu</Btn>
    </div>
  );
}

/* =============================================================================
   PAGE — MA LUDOTHÈQUE (membres connectés) + export Excel
   ============================================================================= */
function MyLudoPage({ setToast, setPage }) {
  const { games, currentUser } = useApp();
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const mine = useMemo(() => games.filter((g) => g.ownerId === currentUser?.id).sort((a, b) => a.name.localeCompare(b.name, "fr")), [games, currentUser]);
  const myRatingsCount = useMemo(() => games.filter((g) => g.ratings?.[currentUser?.id]).length, [games, currentUser]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Feuille 1 : ma ludothèque détaillée
    const rows = mine.map((g) => {
      const { avg, count } = gameStats(g);
      return {
        "Jeu": g.name,
        "Année": g.year || "",
        "Joueurs min": g.min || "",
        "Joueurs max": g.max || "",
        "Durée (min)": g.time || "",
        "Mécaniques": (g.mechanics || []).join(", "),
        "Note moyenne asso": count ? avg.toFixed(2) : "",
        "Nombre de votes": count,
        "Ma note": g.ratings?.[currentUser.id] || "",
        "Source": g.source || "manuel",
        "Présentation": (g.desc || "").replace(/\n/g, " "),
        "Image": g.img || "",
        "Ajouté le": g.addedAt ? new Date(g.addedAt).toLocaleDateString("fr-FR") : "",
      };
    });
    const ws1 = XLSX.utils.json_to_sheet(rows);
    ws1["!cols"] = [{ wch: 30 }, { wch: 7 }, { wch: 11 }, { wch: 11 }, { wch: 11 }, { wch: 30 }, { wch: 16 }, { wch: 14 }, { wch: 9 }, { wch: 14 }, { wch: 60 }, { wch: 40 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Ma ludothèque");

    // Feuille 2 : toutes mes notes (sur toute la ludo de l'asso)
    const noteRows = games.filter((g) => g.ratings?.[currentUser.id]).map((g) => ({
      "Jeu": g.name, "Propriétaire": g.ownerName, "Ma note": g.ratings[currentUser.id], "Note moyenne asso": gameStats(g).avg.toFixed(2),
    }));
    const ws2 = XLSX.utils.json_to_sheet(noteRows.length ? noteRows : [{ "Jeu": "—", "Propriétaire": "", "Ma note": "", "Note moyenne asso": "" }]);
    ws2["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 9 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Mes notes");

    // Feuille 3 : récapitulatif
    const ws3 = XLSX.utils.json_to_sheet([
      { "Information": "Membre", "Valeur": currentUser.name },
      { "Information": "Statut", "Valeur": currentUser.role === "decideur" ? "Décisionnaire" : "Non décisionnaire" },
      { "Information": "Jeux dans ma ludothèque", "Valeur": mine.length },
      { "Information": "Jeux notés", "Valeur": myRatingsCount },
      { "Information": "Export généré le", "Valeur": new Date().toLocaleString("fr-FR") },
    ]);
    ws3["!cols"] = [{ wch: 28 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Récapitulatif");

    XLSX.writeFile(wb, `ludotheque-${slug(currentUser.name)}-aladj.xlsx`);
    setToast("Export Excel téléchargé !");
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 26 }}>
        <div>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.12em" }}>Espace membre</span>
          <h1 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: "clamp(30px,5vw,44px)", margin: "4px 0 0", letterSpacing: "-0.02em" }}>Ma ludothèque</h1>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn variant="ghost" onClick={exportExcel} disabled={mine.length === 0}><Download size={17} /> Export Excel</Btn>
          <Btn variant="amber" onClick={() => setShowAdd(true)}><Plus size={17} /> Ajouter un jeu</Btn>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard icon={Library} color={C.teal} n={mine.length} label="jeux apportés" />
        <StatCard icon={Star} color={C.amber} n={myRatingsCount} label="jeux notés" />
        <StatCard icon={currentUser.role === "decideur" ? Crown : Heart} color={C.purple} n={currentUser.role === "decideur" ? "Décisionnaire" : "Membre"} label="statut" small />
      </div>

      {mine.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(26,58,92,.03)", borderRadius: 20, border: "2px dashed #e0d4bf" }}>
          <Gamepad2 size={48} color="#cdb9a0" />
          <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, marginTop: 14, marginBottom: 6 }}>Votre ludothèque est vide</h3>
          <p style={{ color: "#8a7c6a", marginBottom: 20 }}>Ajoutez vos jeux : ils enrichiront la ludothèque de l'association.</p>
          <Btn variant="amber" size="lg" onClick={() => setShowAdd(true)}><Plus size={18} /> Ajouter mon premier jeu</Btn>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
          {mine.map((g) => <GameCard key={g.id} g={g} onOpen={() => setSelected(g.id)} />)}
        </div>
      )}

      {showAdd && <AddGameFlow onClose={() => setShowAdd(false)} setToast={setToast} />}
      {selected && <GameDetailModal g={games.find((g) => g.id === selected)} onClose={() => setSelected(null)} onAuth={() => {}} setToast={setToast} />}
    </div>
  );
}

function StatCard({ icon: Icon, color, n, label, small }) {
  return (
    <div style={{ flex: "1 1 160px", background: C.paper, borderRadius: 18, padding: "18px 22px", border: "1px solid #ece2d0", display: "flex", alignItems: "center", gap: 14 }}>
      <span style={{ width: 50, height: 50, borderRadius: 14, background: `${color}1a`, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon size={24} color={color} /></span>
      <div>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: small ? 18 : 28, lineHeight: 1 }}>{n}</div>
        <div style={{ fontSize: 13, color: "#8a7c6a", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

/* =============================================================================
   FOOTER
   ============================================================================= */
function Footer({ setPage }) {
  return (
    <footer style={{ background: C.navyDeep, color: "rgba(255,255,255,.7)", padding: "48px 24px 28px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 11, background: "#fff" }}><MeepleIcon size={22} color={C.navy} /></span>
            <Wordmark size={24} />
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
            À l'assaut des jeux — association loi 1901 de jeux de société du Coutançais, fondée en 2010.
          </p>
        </div>
        <div>
          <h4 style={{ color: "#fff", fontFamily: "'Fredoka',sans-serif", fontSize: 15, marginBottom: 12 }}>Navigation</h4>
          {NAV.map((n) => <button key={n.key} onClick={() => setPage(n.key)} style={footLink}>{n.label}</button>)}
        </div>
        <div>
          <h4 style={{ color: "#fff", fontFamily: "'Fredoka',sans-serif", fontSize: 15, marginBottom: 12 }}>Nous trouver</h4>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>
            <MapPin size={14} style={{ verticalAlign: "-2px" }} /> Local ALADJ<br />Gouville-sur-Mer (50560)<br />
            <span style={{ fontSize: 12.5, opacity: .8 }}>Réservé aux +16 ans · pièce d'identité possible à l'entrée</span>
          </p>
        </div>
        <div>
          <h4 style={{ color: "#fff", fontFamily: "'Fredoka',sans-serif", fontSize: 15, marginBottom: 12 }}>Contact</h4>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>
            <Mail size={14} style={{ verticalAlign: "-2px" }} /> Via le groupe Signal de l'association<br />
            <span style={{ fontSize: 12.5, opacity: .8 }}>Communication des dates & infos sur Signal</span>
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 1180, margin: "32px auto 0", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.12)", fontSize: 12.5, textAlign: "center", opacity: .7 }}>
        © {new Date().getFullYear()} À l'assaut des jeux (ALADJ) · Coutances / Gouville-sur-Mer, Manche
      </div>
    </footer>
  );
}
const footLink = { display: "block", background: "none", border: "none", color: "rgba(255,255,255,.7)", cursor: "pointer", padding: "4px 0", fontSize: 13.5, fontFamily: "'Nunito',sans-serif", textAlign: "left" };

/* =============================================================================
   ÉCRAN DE CONFIGURATION (si Supabase non branché)
   ============================================================================= */
function ConfigScreen() {
  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 560, background: C.paper, borderRadius: 22, padding: 36, border: "1px solid #ece2d0", boxShadow: "0 10px 40px rgba(18,41,63,.1)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 15, background: "rgba(232,163,23,.12)", display: "grid", placeItems: "center", marginBottom: 18 }}>
          <AlertTriangle size={28} color={C.amber} />
        </div>
        <h1 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 26, margin: "0 0 10px" }}>Connexion à Supabase requise</h1>
        <p style={{ color: "#5e5346", fontSize: 15, lineHeight: 1.6, margin: "0 0 18px" }}>
          L'application n'a pas encore ses clés Supabase. Renseignez les deux variables suivantes,
          puis rechargez la page :
        </p>
        <div style={{ background: "#11202f", borderRadius: 12, padding: "16px 18px", fontFamily: "monospace", fontSize: 13, color: "#cde", marginBottom: 18, lineHeight: 1.8, overflowX: "auto" }}>
          VITE_SUPABASE_URL=https://xxxxx.supabase.co<br />
          VITE_SUPABASE_ANON_KEY=eyJhbGci...
        </div>
        <p style={{ color: "#8a7c6a", fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
          En local : dans un fichier <b>.env</b> à la racine du projet.<br />
          Sur Vercel : <b>Settings → Environment Variables</b>.<br />
          Le pas-à-pas complet est dans le guide d'installation fourni.
        </p>
      </div>
    </div>
  );
}

/* =============================================================================
   ROOT
   ============================================================================= */
function Shell() {
  const { ready, fatalError, currentUser } = useApp();
  const [page, setPage] = useState("accueil");
  const [auth, setAuth] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);
  useEffect(() => { if (!currentUser && page === "ma-ludo") setPage("accueil"); }, [currentUser, page]);

  if (fatalError === "config") return <ConfigScreen />;

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.cream }}>
        <div style={{ textAlign: "center" }}>
          <div className="aladj-bounce" style={{ display: "inline-block" }}><MeepleIcon size={48} color={C.navy} /></div>
          <p style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, marginTop: 12, fontWeight: 600 }}>Chargement de la ludothèque...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.cream, display: "flex", flexDirection: "column" }}>
      <Navbar page={page} setPage={setPage} onAuth={(m) => setAuth(m)} />
      {fatalError && fatalError !== "config" && (
        <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 20px", textAlign: "center", fontSize: 14, fontWeight: 600 }}>
          {fatalError}
        </div>
      )}
      <main style={{ flex: 1 }}>
        {page === "accueil" && <HomePage setPage={setPage} onAuth={(m) => setAuth(m)} />}
        {page === "soirees" && <EventsPage onAuth={(m) => setAuth(m)} setToast={setToast} />}
        {page === "ludotheque" && <LudothequePage onAuth={(m) => setAuth(m)} setToast={setToast} setPage={setPage} />}
        {page === "ma-ludo" && currentUser && <MyLudoPage setToast={setToast} setPage={setPage} />}
      </main>
      <Footer setPage={setPage} />
      {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} setToast={setToast} />}
      <Toast msg={toast} onDone={() => setToast("")} />
    </div>
  );
}

export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Nunito', sans-serif; -webkit-font-smoothing: antialiased; background: ${C.cream}; }
        button { font-family: inherit; }
        select { -webkit-appearance: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231A3A5C' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 34px !important; }
        textarea:focus { border-color: ${C.teal} !important; }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-thumb { background: #d9cbb4; border-radius: 99px; }
        @keyframes popIn { from { opacity: 0; transform: scale(.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        .aladj-spin { animation: spin 1s linear infinite; }
        .aladj-bounce { animation: bounce 1s ease-in-out infinite; }
        .aladj-burger { display: none !important; }
        @media (max-width: 860px) {
          .aladj-desktop-nav { display: none !important; }
          .aladj-burger { display: grid !important; }
        }
        @media (min-width: 861px) { .aladj-mobile-menu { display: none !important; } }
        @media (max-width: 920px) {
          .aladj-ludo-grid { grid-template-columns: 1fr !important; }
          .aladj-ludo-aside { position: static !important; }
        }
      `}</style>
      <AppProvider><Shell /></AppProvider>
    </>
  );
}
