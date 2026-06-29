import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from "react";
import {
  Dice5, Dice1, Calendar, Library, Home, LogIn, LogOut, UserPlus, Plus, Star, Search,
  Download, MapPin, Clock, Users, X, Menu, Trophy, Filter, Check, ChevronRight,
  Heart, Sparkles, BookOpen, Trash2, Edit3, ExternalLink, Globe, PenLine, Loader2,
  ArrowRight, Crown, Mail, ShieldCheck, Gamepad2, ChevronDown, Award, Info, AlertTriangle, Eye, EyeOff,
  Euro, Lock, ArrowRightLeft, Package, ShoppingBag, Ticket
} from "lucide-react";
import { supabase, isConfigured } from "./supabaseClient";
import PlayTimer from "./PlayTimer";

/* =============================================================================
   ALADJ — À l'assaut des jeux  ·  version connectée à Supabase
   ============================================================================= */

/* ---------- Palette (issue du logo) ---------- */
const C = {
  navy: "#1A3A5C", navyDeep: "#12293f", teal: "#1E8A8A", amber: "#E8A317",
  red: "#B5283A", purple: "#6B3A7A", cream: "#FBF7EF", paper: "#FFFEFB", ink: "#22303C",
};

// Groupes Signal de l'association (lien d'invitation + description)
const SIGNAL_GROUPS = [
  { name: "Organisation jeux", color: "#1E8A8A", icon: Calendar,
    desc: "Pour organiser et s'inscrire aux moments jeux de l'association.",
    url: "https://signal.group/#CjQKIBiXldDw1Py1MFhQA8ksSS6NhCItoUDOjzN13FH2-MtoEhCwJT2eW-qLyOg4bKiEnLw3" },
  { name: "Blabla", color: "#6B3A7A", icon: Heart,
    desc: "Pour nos discussions informelles, papoter et partager entre membres.",
    url: "https://signal.group/#CjQKIOeZ5C6Pezkiq6idGK_KNZDTsLvRYQbQeO9kg3CNrilxEhCiajWWCRHgI-Fe19To7xOj" },
  { name: "Achat", color: "#E8A317", icon: Library,
    desc: "Pour organiser nos achats groupés de jeux.",
    url: "https://signal.group/#CjQKIOtkwx38mqzrzsVU6YdZoezItFjjVZtgVFAD-w2ZMe7iEhAHRKOSRBFHEKXBTkZNmVED" },
  { name: "Jeux en ligne", color: "#6B3A7A", icon: Globe,
    desc: "Pour nos soirées jeux en ligne sur Board Game Arena.",
    url: "https://signal.group/#CjQKIDrh0Erb7vmLuqhbBcjelvyRNlakSz8S0DWuwYzbY9PMEhCa0Qkdic8YD72P2HPBjUVK" },
];

/* ---------- Utilitaires ---------- */
const slug = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Normalise un nom de jeu pour comparer (minuscules, sans accents ni ponctuation/espaces).
const normGameName = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

// Prix de location = 10% du prix neuf, arrondi au 0,5 € supérieur.
function rentalPrice(newPrice) {
  if (!newPrice || newPrice <= 0) return null;
  const tenth = newPrice * 0.10;
  return Math.ceil(tenth * 2) / 2; // arrondi au 0,5 supérieur
}
// Formate un nombre d'euros en français (ex. 2,5 €)
const fmtEuro = (n) => `${Number(n).toFixed(2).replace(/\.?0+$/, "").replace(".", ",")} €`;
// Cherche les jeux existants dont le nom est identique ou très proche du nom saisi.
function findSimilarGames(games, name) {
  const n = normGameName(name);
  if (n.length < 3) return [];
  return games.filter((g) => {
    const gn = normGameName(g.name);
    return gn === n || gn.includes(n) || n.includes(gn);
  });
}

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
// "il y a X minutes / heures / jours" à partir d'un timestamp ISO complet
function timeAgoFr(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j < 7) return `il y a ${j} jour${j > 1 ? "s" : ""}`;
  const sem = Math.floor(j / 7);
  if (sem < 5) return `il y a ${sem} sem.`;
  const mois = Math.floor(j / 30);
  return `il y a ${mois} mois`;
}

const MECHANIC_SUGGESTIONS = [
  "Coopératif", "Draft de cartes", "Placement d'ouvriers", "Pose de tuiles", "Dés",
  "Gestion de ressources", "Deck-building", "Contrôle de zone", "Enchères", "Bluff",
  "Combat", "Set collection", "Programmation", "Déduction", "Narration", "Mémoire",
  "Stop ou encore", "Combos", "Négociation", "Stratégie", "Familial", "Ambiance",
  "Rôles cachés", "Enquête", "Jeu en équipe", "Placement", "Gestion", "Roll'n'write",
  "Flip'n'write", "Jeu de plis", "Jeu de défausse", "Jeu de cartes", "JCC (jeu de cartes à collectionner)",
  "JCE (jeu de cartes évolutif)", "Party game", "Escape game", "Legacy", "Gestion de main",
  "Majorité", "Course", "Exploration", "Construction de moteur", "Tuiles à connecter",
  "Paris", "Mise", "Asymétrique", "Temps réel", "Adresse / dextérité", "Quiz / culture",
].sort((a, b) => a.localeCompare(b, "fr"));

/* =============================================================================
   STORAGE — Upload des images vers Supabase Storage
   Les images sont stockées dans le bucket public "aladj-images", organisées par
   dossier selon le type (games, extensions, upcoming, avatars, places).
   Les URLs publiques sont mises en cache par les navigateurs → bien plus efficient
   que stocker du base64 dans la base de données.
   ============================================================================= */

// Envoie une image vers Cloudflare R2 (via la fonction serverless /api/r2-upload)
// et renvoie l'URL publique R2. Les images sont servies par R2 (egress gratuit).
// - Si vide → "" (pas d'image)
// - Si déjà une URL R2 → renvoyée telle quelle (rien à faire)
// - Si base64 OU URL externe (BGG, ancien Supabase) → uploadée vers R2
// folder : "games" | "extensions" | "upcoming" | "avatars" | "places"
const R2_PUBLIC_PREFIX = "https://pub-a3613b9531e948d684f5307f0105183b.r2.dev";

// Lien d'achat affilié Ludum (partenariat ALADJ, code aff=146).
// Si une URL de fiche précise est fournie on l'utilise, sinon on génère une recherche par nom.
// Le code d'affiliation est ajouté avec "?" ou "&" selon que l'URL a déjà des paramètres.
const LUDUM_AFF = "146";
const LUDUM_SEARCH_BASE = "https://www.ludum.fr/recherche?controller=search&s=";
function ludumLink(name, storedUrl) {
  const base = (storedUrl && storedUrl.trim())
    ? storedUrl.trim()
    : LUDUM_SEARCH_BASE + encodeURIComponent((name || "").trim());
  return base + (base.includes("?") ? "&" : "?") + "aff=" + LUDUM_AFF;
}
async function uploadImageToStorage(image, folder = "games") {
  if (!image) return "";
  // Déjà sur notre R2 → rien à faire
  if (image.startsWith(R2_PUBLIC_PREFIX)) return image;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000); // 20 s (le serveur peut télécharger une URL externe)
    const res = await fetch("/api/r2-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, folder }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.error("Upload R2 échec :", res.status);
      return image; // repli : on garde la valeur d'origine
    }
    const data = await res.json();
    return data.url || image;
  } catch (e) {
    console.error("Upload R2 exception :", e);
    return image; // repli : on garde la valeur d'origine
  }
}

/* =============================================================================
   IMPORT BoardGameGeek
   -----------------------------------------------------------------------------
   Ces fonctions appellent une route serverless /api/bgg (incluse dans le projet)
   qui relaie les requêtes vers BoardGameGeek. Cela évite le blocage "CORS" du
   navigateur. La traduction passe par /api/translate.
   ============================================================================= */
// Récupère le XML de BGG. On passe par notre fonction serveur /api/bgg qui ajoute
// le jeton d'authentification BGG (obligatoire désormais). Proxies en ultime secours.
async function fetchBggXml(bggUrl) {
  const u = new URL(bggUrl);
  const route = u.pathname.includes("/search") ? "search" : "thing";
  const sp = u.searchParams;
  const params = new URLSearchParams();
  params.set("path", route);
  for (const [k, v] of sp.entries()) params.set(k, v);
  const own = `/api/bgg?${params.toString()}`;

  const isValid = (t) => t && t.includes("<") && (t.includes("<item") || t.includes("<items"));

  // 1) notre fonction serveur authentifiée (la voie principale)
  try {
    const res = await fetch(own);
    if (res.ok) { const t = await res.text(); if (isValid(t)) return t; }
  } catch (e) { /* secours */ }

  // 2) proxies CORS publics (secours si le serveur échoue)
  const proxies = [
    (x) => `https://api.allorigins.win/raw?url=${encodeURIComponent(x)}`,
    (x) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(x)}`,
  ];
  for (const make of proxies) {
    try {
      const res = await fetch(make(bggUrl));
      if (res.ok) { const t = await res.text(); if (isValid(t)) return t; }
    } catch (e) { /* proxy suivant */ }
  }
  throw new Error("BGG_UNAVAILABLE");
}

async function bggSearch(query) {
  const q = query.trim();
  const text = await fetchBggXml(`https://boardgamegeek.com/xmlapi2/search?type=boardgame&query=${encodeURIComponent(q)}`);
  const xml = new DOMParser().parseFromString(text, "text/xml");
  let items = Array.from(xml.querySelectorAll("item")).map((it) => ({
    id: it.getAttribute("id"),
    name: it.querySelector("name")?.getAttribute("value") || "Sans titre",
    year: it.querySelector("yearpublished")?.getAttribute("value") || "",
  }));
  // tri par pertinence : correspondance exacte, puis "commence par", puis "contient",
  // puis par ancienneté (les jeux plus anciens / de base sont souvent les plus pertinents)
  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const nq = norm(q);
  const score = (it) => {
    const n = norm(it.name);
    if (n === nq) return 0;
    if (n.startsWith(nq)) return 1;
    if (n.includes(nq)) return 2;
    return 3;
  };
  items.sort((a, b) => {
    const sa = score(a), sb = score(b);
    if (sa !== sb) return sa - sb;
    // à pertinence égale, le plus ancien d'abord (souvent le jeu "de base")
    const ya = Number(a.year) || 9999, yb = Number(b.year) || 9999;
    return ya - yb;
  });
  return items.slice(0, 20);
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
    // Timeout de 8 s : sur mobile, une connexion lente pouvait laisser le fetch
    // en attente très longtemps et bloquer l'affichage de l'aperçu du jeu.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`/api/translate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 1500) }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) { const data = await res.json(); if (data.translated) return data.translated; }
  } catch (e) { /* repli : texte original (timeout, hors-ligne, quota dépassé…) */ }
  return text;
}

/* =============================================================================
   CONTEXTE GLOBAL — connecté à Supabase
   ============================================================================= */
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// Récupère TOUTES les lignes d'une table en contournant la limite de 1000 lignes
// imposée par Supabase : on pagine par paquets de 1000. orderCols garantit un ordre
// stable entre les pages (on passe les colonnes de clé primaire). Renvoie { data }
// pour rester interchangeable avec une requête Supabase classique dans loadData.
async function fetchAllRows(table, columns, orderCols) {
  const size = 1000;
  let from = 0;
  const all = [];
  for (let guard = 0; guard < 100; guard++) {
    let q = supabase.from(table).select(columns);
    (orderCols || []).forEach((c) => { q = q.order(c, { ascending: true }); });
    const { data, error } = await q.range(from, from + size - 1);
    if (error) { console.error("fetchAllRows", table, error.message); break; }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < size) break;
    from += size;
  }
  return { data: all };
}

// transforme une ligne "games" + ses notes en objet utilisé par l'interface
function mapGame(row, ratingsByGame, nameById = {}, commentsByGame = {}, ownersByGame = {}, extsByGame = {}, roleById = {}, playCountByGame = {}, discoveriesByGame = {}) {
  const ratings = {};
  (ratingsByGame[row.id] || []).forEach((r) => { ratings[r.user_id] = Number(r.value); });

  // ownersByGame[row.id] est un tableau d'objets { owner_id, confirmed, declared_by }
  // (auparavant c'était de simples ID — on garde la compat en testant)
  const ownerRows = ownersByGame[row.id] || [];
  // Repli sur owner_id si la table de liaison est TOTALEMENT vide (cas de migration / anciens jeux
  // qui n'ont jamais eu de ligne dans game_owners). Si la table contient des lignes — même
  // si toutes sont en attente — on les utilise telles quelles, sans inventer de propriétaire.
  let normalizedOwners = ownerRows;
  if (normalizedOwners.length === 0 && row.owner_id) normalizedOwners = [{ owner_id: row.owner_id, confirmed: true, declared_by: null }];

  const ownerToInfo = (o) => ({
    id: o.owner_id,
    name: nameById[o.owner_id] || "Membre",
    role: roleById[o.owner_id] || "non",
    confirmed: o.confirmed !== false,
    declaredBy: o.declared_by || null,
    declaredByName: o.declared_by ? (nameById[o.declared_by] || "un membre") : null,
  });

  // Possesseurs confirmés (affichés normalement)
  const confirmedOwners = normalizedOwners
    .filter((o) => o.confirmed !== false)
    .map(ownerToInfo)
    .sort((a, b) => {
      if (a.role === "decideur" && b.role !== "decideur") return -1;
      if (b.role === "decideur" && a.role !== "decideur") return 1;
      return a.name.localeCompare(b.name, "fr");
    });

  // Possessions en attente (déclarées par un autre, le concerné n'a pas encore confirmé)
  const pendingOwners = normalizedOwners
    .filter((o) => o.confirmed === false)
    .map(ownerToInfo)
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  // Pour la rétro-compatibilité, "owners" et "ownerIds" listent les confirmés.
  // Le code existant qui consulte g.owners / g.ownerIds continue de fonctionner.
  const owners = confirmedOwners;
  const ownerIds = confirmedOwners.map((o) => o.id);

  // Envies de découvrir : liste des user IDs qui veulent découvrir ce jeu
  const wantIds = discoveriesByGame[row.id] || [];

  return {
    id: row.id, name: row.name, year: row.year || "", min: row.min_players || "", max: row.max_players || "",
    time: row.play_time || "", mechanics: row.mechanics || [], desc: row.description || "", img: row.image_url || "", ludumUrl: row.ludum_url || "",
    source: row.source || "manuel", ownerId: row.owner_id, ownerName: nameById[row.owner_id] || "Membre",
    owners, ownerIds,
    confirmedOwners, pendingOwners,           // nouvelles structures
    wantIds,                                  // envies de découvrir : liste d'IDs
    extensions: extsByGame[row.id] || [],
    newPrice: row.new_price != null ? Number(row.new_price) : null,
    shared: row.shared !== false,
    playCount: playCountByGame[row.id] || 0,
    comments: (commentsByGame[row.id] || []).map((c) => ({ id: c.id, authorId: c.author_id, authorName: nameById[c.author_id] || "Membre", content: c.content, createdAt: c.created_at, updatedAt: c.updated_at })),
    ratings, addedAt: row.created_at ? new Date(row.created_at).getTime() : 0,
  };
}
function mapEvent(row, playersByEvent, nameById = {}, guestsByEvent = {}, commentsByEvent = {}, eventGamesByEvent = {}, gamesIndexById = {}) {
  return {
    id: row.id, date: row.event_date, time: row.event_time, place: row.place, placeId: row.place_id || null, min: row.min_players, max: row.max_players,
    notes: row.notes || "", online: !!row.online, hostId: row.host_id, hostName: nameById[row.host_id] || "Membre",
    deadline: row.deadline || null,
    players: (playersByEvent[row.id] || []).map((p) => ({ id: p.user_id, name: nameById[p.user_id] || "Membre" })),
    // un membre invité (event_guests.member_id) qui s'est aussi inscrit comme participant
    // n'est ni affiché ni compté deux fois : on le retire de la liste des invités
    guests: (guestsByEvent[row.id] || [])
      .filter((g) => !(g.member_id && (playersByEvent[row.id] || []).some((p) => p.user_id === g.member_id)))
      .map((g) => ({ id: g.id, name: g.guest_name, memberId: g.member_id, addedBy: g.added_by })),
    comments: (commentsByEvent[row.id] || []).map((c) => ({ id: c.id, authorId: c.author_id, authorName: nameById[c.author_id] || "Membre", content: c.content, createdAt: c.created_at, updatedAt: c.updated_at })),
    playedGames: (eventGamesByEvent[row.id] || []).map((eg) => ({
      id: eg.id, gameId: eg.game_id, addedBy: eg.added_by, addedByName: nameById[eg.added_by] || "Membre",
      gameName: gamesIndexById[eg.game_id]?.name || "(jeu supprimé)",
      gameImg: gamesIndexById[eg.game_id]?.img || "",
      createdAt: eg.created_at,
    })),
    createdAt: row.created_at ? new Date(row.created_at).getTime() : 0,
  };
}

function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [authUser, setAuthUser] = useState(null);     // utilisateur Supabase Auth
  const [currentUser, setCurrentUser] = useState(null); // profil (avec name, role)
  const [bannedNotice, setBannedNotice] = useState(false); // affiché si un membre banni tente de se connecter
  const [memberEmails, setMemberEmails] = useState({}); // { userId: email } — chargé uniquement si admin
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [events, setEvents] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loans, setLoans] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [myWeights, setMyWeights] = useState({}); // { gameId: weight_g } pour l'utilisateur connecté
  const [notifications, setNotifications] = useState([]); // notifications du membre connecté
  const [dismissedIds, setDismissedIds] = useState([]);   // jeux que le membre a rejetés des suggestions
  const [household, setHousehold] = useState({ memberIds: [], invitesReceived: [], invitesSent: [] }); // regroupement familial
  const [fatalError, setFatalError] = useState(null);
  // Ref vers l'id du membre connecté, lisible dans loadData sans le mettre en dépendance.
  const currentUserIdRef = useRef(null);
  useEffect(() => { currentUserIdRef.current = currentUser?.id || null; }, [currentUser]);

  // ⏱ Chronomètre de partie (multi-device) : état + détection d'un lien de jonction ?chrono=CODE
  const [chrono, setChrono] = useState(null); // null | { gameId } | { eventId } | { joinCode }
  const openChrono = useCallback((opts) => setChrono(opts), []);
  const closeChrono = useCallback(() => setChrono(null), []);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("chrono");
    if (code) setChrono({ joinCode: code });
  }, []);

  /* ---- Chargement des données partagées ---- */
  const loadData = useCallback(async () => {
    try {
      // Historique préservé : on ne supprime plus automatiquement les moments anciens.
      // (Auparavant, les moments > 1 an étaient nettoyés ; ce n'est plus le cas pour
      // garder la mémoire des parties jouées dans le temps.)

      // On charge chaque table séparément, SANS jointure automatique (profiles(name)),
      // car cette jointure échoue si la clé étrangère n'est pas détectée par Supabase.
      // On reconstitue les noms côté application via une table de correspondance.
      const [{ data: profiles }, { data: gamesRows }, { data: ratings }, { data: eventsRows }, { data: eps }, { data: guests }, { data: comments }, { data: gameComments }, { data: placesRows }, { data: gameOwners }, { data: extsRows }, { data: extOwners }, { data: loansRows }, { data: weightsRows }, { data: eventGamesRows }, { data: upcRows }, { data: hypeRows }, { data: intentRows }, { data: upcCommentsRows }, { data: discRows }, { data: notifRows }, { data: dismissedRows }, { data: hhMembers }, { data: hhInvites }] = await Promise.all([
        supabase.from("profiles").select("id,name,role,is_admin,banned,share_library,avatar_url,city,bio,bgg_url,okkazeo_url,fav_mechanics").order("name"),
        fetchAllRows("games", "id,name,year,min_players,max_players,play_time,mechanics,image_url,source,owner_id,new_price,shared,created_at,ludum_url", ["id"]),
        fetchAllRows("ratings", "*", ["game_id", "user_id"]),
        supabase.from("events").select("*"),
        fetchAllRows("event_players", "*", ["event_id", "user_id"]),
        supabase.from("event_guests").select("*"),
        fetchAllRows("event_comments", "*", ["created_at", "id"]),
        fetchAllRows("game_comments", "*", ["created_at", "id"]),
        supabase.from("places").select("*").order("name"),
        fetchAllRows("game_owners", "*", ["game_id", "owner_id"]),
        fetchAllRows("extensions", "id,game_id,name,image_url,created_by", ["name", "id"]),
        fetchAllRows("extension_owners", "*", ["id"]),
        supabase.from("loans").select("*").order("started_at", { ascending: false }),
        fetchAllRows("game_weights", "*", ["game_id", "owner_id"]),
        fetchAllRows("event_games", "*", ["id"]),
        supabase.from("upcoming_games").select("id,name,year,min_players,max_players,play_time,mechanics,description,image_url,new_price,source,created_by,created_at,ludo_game_id,ludum_url").order("name"),
        supabase.from("upcoming_hype").select("*"),
        supabase.from("upcoming_intent").select("*"),
        fetchAllRows("upcoming_comments", "*", ["created_at", "id"]),
        fetchAllRows("game_discoveries", "*", ["game_id", "user_id"]),
        currentUserIdRef.current ? supabase.from("notifications").select("*").eq("recipient_id", currentUserIdRef.current).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
        currentUserIdRef.current ? supabase.from("reco_dismissed").select("game_id").eq("user_id", currentUserIdRef.current) : Promise.resolve({ data: [] }),
        currentUserIdRef.current ? supabase.from("household_members").select("*") : Promise.resolve({ data: [] }),
        currentUserIdRef.current ? supabase.from("household_invites").select("*").eq("status", "pending") : Promise.resolve({ data: [] }),
      ]);

      // table de correspondance id -> nom
      const nameById = {};
      const roleById = {};
      (profiles || []).forEach((p) => { nameById[p.id] = p.name; roleById[p.id] = p.role; });

      const ratingsByGame = {};
      (ratings || []).forEach((r) => { (ratingsByGame[r.game_id] ||= []).push(r); });
      const playersByEvent = {};
      (eps || []).forEach((p) => { (playersByEvent[p.event_id] ||= []).push(p); });
      const guestsByEvent = {};
      (guests || []).forEach((g) => { (guestsByEvent[g.event_id] ||= []).push(g); });
      // jeux joués : par moment ET compteur global par jeu
      const eventGamesByEvent = {};
      const playCountByGame = {};
      (eventGamesRows || []).forEach((eg) => {
        (eventGamesByEvent[eg.event_id] ||= []).push(eg);
        playCountByGame[eg.game_id] = (playCountByGame[eg.game_id] || 0) + 1;
      });
      const commentsByEvent = {};
      (comments || []).forEach((c) => { (commentsByEvent[c.event_id] ||= []).push(c); });
      const commentsByGame = {};
      (gameComments || []).forEach((c) => { (commentsByGame[c.game_id] ||= []).push(c); });
      // propriétaires multiples par jeu (table de liaison game_owners)
      // On stocke les lignes complètes pour récupérer confirmed et declared_by
      const ownersByGame = {};
      (gameOwners || []).forEach((o) => { (ownersByGame[o.game_id] ||= []).push(o); });
      // Envies de découvrir : qui veut découvrir quoi
      const discoveriesByGame = {};
      (discRows || []).forEach((d) => { (discoveriesByGame[d.game_id] ||= []).push(d.user_id); });
      // extensions par jeu, avec leurs propriétaires
      const extOwnersByExt = {};
      (extOwners || []).forEach((o) => { (extOwnersByExt[o.extension_id] ||= []).push(o.owner_id); });
      const extsByGame = {};
      (extsRows || []).forEach((x) => {
        const ids = extOwnersByExt[x.id] || [];
        (extsByGame[x.game_id] ||= []).push({
          id: x.id, name: x.name, img: x.image_url || "", createdBy: x.created_by,
          ownerIds: ids, owners: ids.map((id) => ({ id, name: nameById[id] || "Membre" })),
        });
      });

      setUsers((profiles || []).map((p) => ({ id: p.id, name: p.name, role: p.role, admin: p.is_admin, banned: p.banned === true, shareLibrary: p.share_library !== false, avatar: p.avatar_url || "", city: p.city || "", bio: p.bio || "", bggUrl: p.bgg_url || "", okkazeoUrl: p.okkazeo_url || "", favMechanics: p.fav_mechanics || [] })));
      const mappedGames = (gamesRows || []).map((g) => mapGame(g, ratingsByGame, nameById, commentsByGame, ownersByGame, extsByGame, roleById, playCountByGame, discoveriesByGame));
      // index id->jeu pour résoudre les jeux joués dans mapEvent
      const gamesIndexById = {};
      mappedGames.forEach((g) => { gamesIndexById[g.id] = g; });
      setGames(mappedGames);
      setEvents((eventsRows || []).map((e) => mapEvent(e, playersByEvent, nameById, guestsByEvent, commentsByEvent, eventGamesByEvent, gamesIndexById)));
      setPlaces((placesRows || []).map((p) => ({ id: p.id, name: p.name, address: p.address || "", accessInfo: p.access_info || "", createdBy: p.created_by, createdByName: nameById[p.created_by] || "Membre" })));
      setLoans((loansRows || []).map((l) => ({
        id: l.id, gameId: l.game_id, lenderId: l.lender_id, borrowerId: l.borrower_id,
        lenderName: nameById[l.lender_id] || "Membre", borrowerName: nameById[l.borrower_id] || "Membre",
        gameName: (gamesRows || []).find((g) => g.id === l.game_id)?.name || "Jeu",
        weight: l.weight_g, startedAt: l.started_at, dueAt: l.due_at, returned: l.returned, returnedAt: l.returned_at,
      })));
      // poids privés de l'utilisateur connecté (RLS ne renvoie que les siens)
      const wmap = {};
      (weightsRows || []).forEach((w) => { wmap[w.game_id] = w.weight_g; });
      setMyWeights(wmap);

      // ---- Fiches "À venir" ----
      // Index des hypes / intentions / commentaires par fiche À venir
      const hypeByUpc = {};
      (hypeRows || []).forEach((h) => { (hypeByUpc[h.upcoming_id] ||= []).push(h); });
      const intentByUpc = {};
      (intentRows || []).forEach((i) => { (intentByUpc[i.upcoming_id] ||= []).push(i); });
      const upcCommentsByUpc = {};
      (upcCommentsRows || []).forEach((c) => { (upcCommentsByUpc[c.upcoming_id] ||= []).push(c); });
      // Pour le retrait auto : compter les vrais votes (ratings) par jeu de ludo
      const ratingsCountByGame = {};
      (ratings || []).forEach((r) => { ratingsCountByGame[r.game_id] = (ratingsCountByGame[r.game_id] || 0) + 1; });

      const allUpc = (upcRows || []).map((u) => {
        const hypes = {};
        (hypeByUpc[u.id] || []).forEach((h) => { hypes[h.user_id] = h.value; });
        const intents = {};
        (intentByUpc[u.id] || []).forEach((i) => { intents[i.user_id] = i.intent; });
        // résoudre la fiche ludo correspondante : via lien explicite OU via nom similaire
        let ludoGame = u.ludo_game_id ? (gamesRows || []).find((g) => g.id === u.ludo_game_id) : null;
        if (!ludoGame) {
          // recherche par similarité de nom (réutilise normGameName défini globalement)
          const nu = normGameName(u.name);
          ludoGame = (gamesRows || []).find((g) => normGameName(g.name) === nu);
        }
        const ludoVotes = ludoGame ? (ratingsCountByGame[ludoGame.id] || 0) : 0;
        return {
          id: u.id, name: u.name, year: u.year || "", min: u.min_players || "", max: u.max_players || "",
          time: u.play_time || "", mechanics: u.mechanics || [], desc: u.description || "", img: u.image_url || "", ludumUrl: u.ludum_url || "",
          newPrice: u.new_price != null ? Number(u.new_price) : null,
          source: u.source || "manuel", createdBy: u.created_by, createdByName: nameById[u.created_by] || "Membre",
          ludoGameId: ludoGame ? ludoGame.id : null, ludoVotes,
          hypes, intents,
          comments: (upcCommentsByUpc[u.id] || []).map((c) => ({ id: c.id, authorId: c.author_id, authorName: nameById[c.author_id] || "Membre", content: c.content, createdAt: c.created_at, updatedAt: c.updated_at })),
          addedAt: u.created_at ? new Date(u.created_at).getTime() : 0,
        };
      });
      // Règle de bascule : si la fiche ludo liée a ≥ 2 votes, on cache la fiche À venir.
      // On garde tout en base (la fiche reste consultable techniquement) mais on filtre l'affichage.
      setUpcoming(allUpc.filter((u) => u.ludoVotes < 2));

      // Notifications du membre connecté + jeux rejetés des suggestions
      setNotifications((notifRows || []).map((n) => ({
        id: n.id, recipientId: n.recipient_id, actorId: n.actor_id, type: n.type,
        message: n.message, linkKind: n.link_kind, linkId: n.link_id, read: n.read === true,
        createdAt: n.created_at,
      })));
      setDismissedIds((dismissedRows || []).map((d) => d.game_id));
      // Foyer (regroupement familial) : la RLS ne remonte que mon propre foyer
      {
        const myId = currentUserIdRef.current;
        setHousehold({
          memberIds: (hhMembers || []).map((m) => m.user_id),
          invitesReceived: (hhInvites || []).filter((i) => i.invitee_id === myId),
          invitesSent: (hhInvites || []).filter((i) => i.inviter_id === myId),
        });
      }
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
  const loadCurrentUser = useCallback(async () => {
    if (!authUser) { setCurrentUser(null); return; }
    // Invité anonyme (rejoint une partie via le chronomètre, sans compte) :
    // pas de profil, pas de membre dans la liste. On évite ainsi de créer de faux décisionnaires.
    if (authUser.is_anonymous) { setCurrentUser(null); return; }
    let { data } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
    // Première connexion via Google : pas encore de profil → on en crée un.
    if (!data) {
      const meta = authUser.user_metadata || {};
      const name = meta.full_name || meta.name || (authUser.email ? authUser.email.split("@")[0] : "Membre");
      const { data: created } = await supabase.from("profiles").insert({
        id: authUser.id, name, role: "decideur", is_admin: false,
      }).select().single();
      data = created;
    }
    // Membre banni : on bloque l'accès et on le déconnecte immédiatement.
    if (data && data.banned) {
      setBannedNotice(true);
      await supabase.auth.signOut();
      setCurrentUser(null);
      return;
    }
    if (data) setCurrentUser({ id: data.id, name: data.name, role: data.role, admin: data.is_admin, banned: data.banned === true, shareLibrary: data.share_library !== false, avatar: data.avatar_url || "", city: data.city || "", bio: data.bio || "", bggUrl: data.bgg_url || "", okkazeoUrl: data.okkazeo_url || "", favMechanics: data.fav_mechanics || [] });
  }, [authUser]);
  useEffect(() => { loadCurrentUser(); }, [loadCurrentUser]);

  // Quand l'identité du membre connecté change (connexion / déconnexion), on recharge
  // les données afin de récupérer SES notifications et SES rejets de suggestions
  // (qui dépendent de currentUserIdRef, non disponible au tout premier chargement).
  useEffect(() => {
    if (currentUser?.id) loadData();
  }, [currentUser?.id, loadData]);

  /* ---- Charger les e-mails des membres (réservé aux admins) ---- */
  // On appelle la fonction get_member_emails() (security definer) : elle ne renvoie
  // des données que si l'appelant est admin (garde-fou interne côté base).
  useEffect(() => {
    let cancelled = false;
    if (currentUser && currentUser.admin) {
      supabase.rpc("get_member_emails")
        .then(({ data, error }) => {
          if (cancelled || error || !data) return;
          const map = {};
          data.forEach((r) => { map[r.id] = r.email; });
          setMemberEmails(map);
        });
    } else {
      setMemberEmails({});
    }
    return () => { cancelled = true; };
  }, [currentUser]);

  /* ---- Abonnement temps réel : recharge quand la base change ---- */
  useEffect(() => {
    if (!isConfigured) return;
    const channel = supabase.channel("aladj-changes")
      .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
        if (payload.table && payload.table.startsWith("play_")) return; // géré par le chrono
        loadData();
      })
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

  // Connexion via Google (OAuth). Redirige vers Google puis revient sur le site.
  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) return { error: error.message };
    return {}; // la redirection prend le relais
  }, []);

  const logout = useCallback(async () => { await supabase.auth.signOut(); setCurrentUser(null); }, []);

  /* ---- Modération admin : bannir / débannir un membre ---- */
  // Bannissement logique : le membre ne pourra plus se connecter, mais ses jeux
  // et ses notes restent en base (pas de dégât sur la ludothèque commune).
  const banUser = useCallback(async (userId) => {
    if (!currentUser?.admin) return { error: "Réservé aux administrateurs." };
    if (userId === currentUser.id) return { error: "Vous ne pouvez pas vous bannir vous-même." };
    const { error } = await supabase.from("profiles").update({ banned: true }).eq("id", userId);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  const unbanUser = useCallback(async (userId) => {
    if (!currentUser?.admin) return { error: "Réservé aux administrateurs." };
    const { error } = await supabase.from("profiles").update({ banned: false }).eq("id", userId);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Suppression définitive d'un membre (faux invités, comptes à retirer).
  const deleteUser = useCallback(async (userId) => {
    if (!currentUser?.admin) return { error: "Réservé aux administrateurs." };
    if (userId === currentUser.id) return { error: "Vous ne pouvez pas vous supprimer vous-même." };
    const { error } = await supabase.rpc("delete_member", { p_user_id: userId });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  /* ---- Jeux ---- */
  const addGame = useCallback(async (d) => {
    if (!currentUser) return { error: "Connectez-vous." };
    // d.forUserIds : autres membres pour lesquels on déclare la possession (en attente de confirmation)
    // d.selfOwns   : si true (défaut), j'inscris aussi MA possession (confirmée)
    const selfOwns = d.selfOwns !== false;
    const forUserIds = (d.forUserIds || []).filter((id) => id && id !== currentUser.id);

    // owner_id sur la table games = TOUJOURS moi (le créateur de la fiche).
    // C'est nécessaire pour respecter la RLS d'insert (auth.uid() = owner_id).
    // La VRAIE possession est gérée par la table de liaison game_owners (avec confirmed/declared_by).
    // Si je ne possède pas le jeu, j'en suis quand même le « créateur de fiche » côté metadata.
    // Si l'image est en base64, on l'envoie d'abord vers Supabase Storage et on ne garde que l'URL.
    const imgUrl = await uploadImageToStorage(d.img || "", "games");
    const { data, error } = await supabase.from("games").insert({
      name: d.name.trim(), year: d.year || null, min_players: d.min || null, max_players: d.max || null,
      play_time: d.time || null, mechanics: d.mechanics || [], description: d.desc || "", image_url: imgUrl,
      source: d.source || "manuel", owner_id: currentUser.id,
      ludum_url: d.ludumUrl ? d.ludumUrl.trim() : "",
    }).select().single();
    if (error) return { error: error.message };

    // Inscriptions dans la table de liaison
    const rows = [];
    if (selfOwns) {
      // Moi : possession confirmée d'office
      rows.push({ game_id: data.id, owner_id: currentUser.id, confirmed: true, declared_by: currentUser.id });
    }
    forUserIds.forEach((uid) => {
      // Autres membres : possession en attente de leur confirmation
      rows.push({ game_id: data.id, owner_id: uid, confirmed: false, declared_by: currentUser.id });
    });
    if (rows.length > 0) {
      const { error: ownersErr } = await supabase.from("game_owners").insert(rows);
      if (ownersErr) {
        // On nettoie le jeu créé si l'inscription de possession échoue, sinon on aurait une fiche orpheline.
        await supabase.from("games").delete().eq("id", data.id);
        return { error: ownersErr.message };
      }
    }

    await loadData();
    return { game: data };
  }, [currentUser, loadData]);

  // Se rattacher à un jeu existant ("je l'ai aussi") — sans recréer de fiche
  const addOwner = useCallback(async (gameId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    // Je m'ajoute moi-même : possession confirmée d'office
    const { error } = await supabase.from("game_owners").insert({
      game_id: gameId, owner_id: currentUser.id, confirmed: true, declared_by: currentUser.id,
    });
    if (error && !/duplicate|unique/i.test(error.message)) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Déclarer qu'un ou plusieurs AUTRES membres possèdent aussi ce jeu (en attente de leur confirmation).
  const declareOwners = useCallback(async (gameId, userIds) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const ids = (userIds || []).filter((id) => id && id !== currentUser.id);
    if (ids.length === 0) return { error: "Sélectionnez au moins un membre." };
    const rows = ids.map((uid) => ({ game_id: gameId, owner_id: uid, confirmed: false, declared_by: currentUser.id }));
    const { error } = await supabase.from("game_owners").insert(rows);
    if (error && !/duplicate|unique/i.test(error.message)) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Se retirer d'un jeu ("je ne l'ai plus"). Si plus aucun propriétaire, la fiche est supprimée.
  const removeOwner = useCallback(async (gameId) => {
    if (!currentUser) return;
    await supabase.from("game_owners").delete().eq("game_id", gameId).eq("owner_id", currentUser.id);
    // reste-t-il des propriétaires ?
    const { data: remaining } = await supabase.from("game_owners").select("owner_id").eq("game_id", gameId);
    if (!remaining || remaining.length === 0) {
      await supabase.from("games").delete().eq("id", gameId); // plus personne → on retire la fiche
    } else {
      // si le créateur initial (owner_id) vient de se retirer, on réaffecte owner_id
      // à un propriétaire restant pour garder la fiche cohérente
      const game = games.find((g) => g.id === gameId);
      if (game && game.ownerId === currentUser.id) {
        await supabase.from("games").update({ owner_id: remaining[0].owner_id }).eq("id", gameId);
      }
    }
    await loadData();
  }, [currentUser, loadData, games]);

  // ---- Possessions par procuration ----
  // Confirmer une possession en attente : "oui, je possède bien ce jeu"
  const confirmOwnership = useCallback(async (gameId) => {
    if (!currentUser) return;
    await supabase.from("game_owners").update({ confirmed: true })
      .eq("game_id", gameId).eq("owner_id", currentUser.id);
    await loadData();
  }, [currentUser, loadData]);

  // Refuser une possession en attente : on retire la ligne, et on supprime la fiche si elle devient orpheline.
  const declineOwnership = useCallback(async (gameId) => {
    if (!currentUser) return;
    await supabase.from("game_owners").delete().eq("game_id", gameId).eq("owner_id", currentUser.id);
    const { data: remaining } = await supabase.from("game_owners").select("owner_id").eq("game_id", gameId);
    if (!remaining || remaining.length === 0) {
      await supabase.from("games").delete().eq("id", gameId);
    } else {
      const game = games.find((g) => g.id === gameId);
      if (game && game.ownerId === currentUser.id) {
        await supabase.from("games").update({ owner_id: remaining[0].owner_id }).eq("id", gameId);
      }
    }
    await loadData();
  }, [currentUser, loadData, games]);

  // ---- Envies de découvrir ----
  // Bascule l'envie de découvrir un jeu (toggle). Si déjà présent → retire, sinon → ajoute.
  const toggleDiscover = useCallback(async (gameId) => {
    if (!currentUser) return;
    const g = games.find((x) => x.id === gameId);
    const already = g && (g.wantIds || []).includes(currentUser.id);
    if (already) {
      await supabase.from("game_discoveries").delete()
        .eq("game_id", gameId).eq("user_id", currentUser.id);
    } else {
      await supabase.from("game_discoveries").insert({ game_id: gameId, user_id: currentUser.id });
      // Notifier les propriétaires du jeu qu'un membre souhaite le découvrir (sauf moi).
      if (g) {
        const recipients = [...new Set((g.ownerIds && g.ownerIds.length) ? g.ownerIds : (g.ownerId ? [g.ownerId] : []))]
          .filter((id) => id && id !== currentUser.id);
        if (recipients.length > 0) {
          await supabase.from("notifications").insert(recipients.map((rid) => ({
            recipient_id: rid, actor_id: currentUser.id, type: "discovery",
            message: `${currentUser.name} aimerait découvrir votre jeu « ${g.name} »`,
            link_kind: "game", link_id: gameId,
          })));
        }
      }
    }
    await loadData();
  }, [currentUser, games, loadData]);

  // ---- Extensions ----
  // Ajouter une extension à un jeu (le créateur en devient premier propriétaire)
  const addExtension = useCallback(async (gameId, data) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const imgUrl = await uploadImageToStorage(data.img || "", "extensions");
    const { data: row, error } = await supabase.from("extensions").insert({
      game_id: gameId, name: data.name.trim(), image_url: imgUrl, created_by: currentUser.id,
    }).select().single();
    if (error) return { error: error.message };
    await supabase.from("extension_owners").insert({ extension_id: row.id, owner_id: currentUser.id });
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Se rattacher à une extension existante ("je l'ai aussi")
  const addExtensionOwner = useCallback(async (extId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { error } = await supabase.from("extension_owners").insert({ extension_id: extId, owner_id: currentUser.id });
    if (error && !/duplicate|unique/i.test(error.message)) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Se retirer d'une extension. Si plus aucun propriétaire, l'extension est supprimée.
  const removeExtensionOwner = useCallback(async (extId) => {
    if (!currentUser) return;
    await supabase.from("extension_owners").delete().eq("extension_id", extId).eq("owner_id", currentUser.id);
    const { data: remaining } = await supabase.from("extension_owners").select("id").eq("extension_id", extId);
    if (!remaining || remaining.length === 0) {
      await supabase.from("extensions").delete().eq("id", extId);
    }
    await loadData();
  }, [currentUser, loadData]);

  const updateGame = useCallback(async (id, patch) => {
    const imgUrl = await uploadImageToStorage(patch.img || "", "games");
    const fields = {
      name: patch.name, year: patch.year || null, min_players: patch.min || null, max_players: patch.max || null,
      play_time: patch.time || null, mechanics: patch.mechanics || [], description: patch.desc || "", image_url: imgUrl,
    };
    if (patch.newPrice !== undefined) fields.new_price = patch.newPrice === "" || patch.newPrice == null ? null : Number(patch.newPrice);
    if (patch.ludumUrl !== undefined) fields.ludum_url = patch.ludumUrl ? patch.ludumUrl.trim() : "";
    await supabase.from("games").update(fields).eq("id", id);
    await loadData();
  }, [loadData]);

  // Enregistrer / mettre à jour MON poids pour un jeu (privé, par membre)
  const setGameWeight = useCallback(async (gameId, weightG) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const w = weightG === "" || weightG == null ? null : Number(weightG);
    if (w == null) {
      await supabase.from("game_weights").delete().eq("game_id", gameId).eq("owner_id", currentUser.id);
    } else {
      await supabase.from("game_weights").upsert({ game_id: gameId, owner_id: currentUser.id, weight_g: w, updated_at: new Date().toISOString() }, { onConflict: "game_id,owner_id" });
    }
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Créer une location (le prêteur = utilisateur connecté). Durée fixe : 2 semaines.
  const createLoan = useCallback(async (gameId, borrowerId, weightG) => {
    if (!currentUser) return { error: "Connectez-vous." };
    if (!borrowerId) return { error: "Choisissez l'emprunteur." };
    const due = new Date(); due.setDate(due.getDate() + 14); // +2 semaines
    const { error } = await supabase.from("loans").insert({
      game_id: gameId, lender_id: currentUser.id, borrower_id: borrowerId,
      weight_g: weightG === "" || weightG == null ? null : Number(weightG),
      due_at: due.toISOString(), returned: false,
    });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Clore une location : seul le prêteur le peut (le jeu a été rendu)
  const closeLoan = useCallback(async (loanId) => {
    if (!currentUser) return;
    await supabase.from("loans").update({ returned: true, returned_at: new Date().toISOString() }).eq("id", loanId).eq("lender_id", currentUser.id);
    await loadData();
  }, [currentUser, loadData]);

  const removeGame = useCallback(async (id) => { await supabase.from("games").delete().eq("id", id); await loadData(); }, [loadData]);

  // Partage : (dé)partager un jeu précis dans la ludothèque commune
  const toggleGameShared = useCallback(async (id, shared) => {
    await supabase.from("games").update({ shared }).eq("id", id);
    await loadData();
  }, [loadData]);

  // Partage : réglage global du membre (partager toute sa ludothèque ou non)
  const setShareLibrary = useCallback(async (value) => {
    if (!currentUser) return;
    await supabase.from("profiles").update({ share_library: value }).eq("id", currentUser.id);
    setCurrentUser((u) => u ? { ...u, shareLibrary: value } : u);
    await loadData();
  }, [currentUser, loadData]);

  // Mise à jour du profil du membre connecté
  const updateProfile = useCallback(async (patch) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const fields = {};
    if (patch.name !== undefined) fields.name = patch.name.trim();
    if (patch.avatar !== undefined) fields.avatar_url = await uploadImageToStorage(patch.avatar, "avatars");
    if (patch.city !== undefined) fields.city = patch.city.trim();
    if (patch.bio !== undefined) fields.bio = patch.bio.slice(0, 500);
    if (patch.bggUrl !== undefined) fields.bgg_url = patch.bggUrl.trim();
    if (patch.okkazeoUrl !== undefined) fields.okkazeo_url = patch.okkazeoUrl.trim();
    if (patch.favMechanics !== undefined) fields.fav_mechanics = (patch.favMechanics || []).slice(0, 6);
    const { error } = await supabase.from("profiles").update(fields).eq("id", currentUser.id);
    if (error) return { error: error.message };
    // Pour le state local, on garde le base64 si patch.avatar était en base64 (affichage immédiat avant rechargement)
    // mais en DB c'est désormais l'URL Storage
    setCurrentUser((u) => u ? { ...u, ...patch, avatar: fields.avatar_url !== undefined ? fields.avatar_url : u.avatar, bio: patch.bio !== undefined ? patch.bio.slice(0, 500) : u.bio } : u);
    await loadData();
    return {};
  }, [currentUser, loadData]);

  const rateGame = useCallback(async (id, value) => {
    if (!currentUser) return;
    const existing = games.find((g) => g.id === id)?.ratings?.[currentUser.id];
    if (existing === value) {
      await supabase.from("ratings").delete().eq("game_id", id).eq("user_id", currentUser.id);
    } else {
      await supabase.from("ratings").upsert({ game_id: id, user_id: currentUser.id, value });
      // Si je note un jeu, mon envie de le découvrir n'a plus lieu d'être : je le retire automatiquement.
      // (sans gravité si je ne l'avais pas marqué : la requête supprime simplement zéro ligne.)
      await supabase.from("game_discoveries").delete().eq("game_id", id).eq("user_id", currentUser.id);
    }
    await loadData();
  }, [currentUser, games, loadData]);

  // Effacer explicitement sa note pour un jeu
  const clearRating = useCallback(async (id) => {
    if (!currentUser) return;
    await supabase.from("ratings").delete().eq("game_id", id).eq("user_id", currentUser.id);
    await loadData();
  }, [currentUser, loadData]);

  /* ---- Soirées ---- */
  const addEvent = useCallback(async (d) => {
    const { data, error } = await supabase.from("events").insert({
      event_date: d.date, event_time: d.time, place: d.place, place_id: d.placeId || null, min_players: d.min, max_players: d.max,
      notes: d.notes || "", online: d.online || false, host_id: currentUser.id, deadline: d.deadline || null,
    }).select().single();
    if (error) return { error: error.message };
    if (d.joinSelf) await supabase.from("event_players").insert({ event_id: data.id, user_id: currentUser.id });
    // invités ajoutés dès la création
    if (d.invites && d.invites.length) {
      await supabase.from("event_guests").insert(
        d.invites.map((inv) => ({ event_id: data.id, guest_name: inv.name, member_id: inv.memberId || null, added_by: currentUser.id }))
      );
      const memberInvites = d.invites.filter((inv) => inv.memberId && inv.memberId !== currentUser.id);
      if (memberInvites.length) {
        await supabase.from("notifications").insert(memberInvites.map((inv) => ({
          recipient_id: inv.memberId, actor_id: currentUser.id, type: "event_invite",
          message: `${currentUser.name} vous a ajouté au moment jeux du ${formatDateFr(d.date)}`,
          link_kind: "event", link_id: data.id,
        })));
      }
    }
    await loadData();
    return { event: data };
  }, [currentUser, loadData]);

  const updateEvent = useCallback(async (id, patch) => {
    const { error } = await supabase.from("events").update({
      event_date: patch.date, event_time: patch.time, place: patch.place, place_id: patch.placeId || null,
      min_players: patch.min, max_players: patch.max, notes: patch.notes || "", online: patch.online || false, deadline: patch.deadline || null,
    }).eq("id", id);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  // ---- Jeux joués lors d'un moment (historique) ----
  // Ajouter un jeu joué : l'utilisateur connecté doit être participant du moment.
  const addPlayedGame = useCallback(async (eventId, gameId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { error } = await supabase.from("event_games").insert({ event_id: eventId, game_id: gameId, added_by: currentUser.id });
    if (error) {
      // contrainte unique : déjà ajouté
      if (/duplicate|unique/i.test(error.message)) return { error: "Ce jeu est déjà noté pour ce moment." };
      return { error: error.message };
    }
    await loadData();
    return {};
  }, [currentUser, loadData]);

  // Retirer un jeu joué : seul celui qui l'a ajouté (ou un admin) peut le faire.
  const removePlayedGame = useCallback(async (playedGameId) => {
    if (!currentUser) return;
    await supabase.from("event_games").delete().eq("id", playedGameId);
    await loadData();
  }, [currentUser, loadData]);

  // ============================================================
  // ---- Fiches "À venir" (jeux à sortir / nouveautés) ----
  // ============================================================

  // Créer une fiche À venir
  const addUpcoming = useCallback(async (d) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const imgUrl = await uploadImageToStorage(d.img || "", "upcoming");
    const { data, error } = await supabase.from("upcoming_games").insert({
      name: d.name.trim(), year: d.year || null, min_players: d.min || null, max_players: d.max || null,
      play_time: d.time || null, mechanics: d.mechanics || [], description: d.desc || "", image_url: imgUrl,
      new_price: d.newPrice != null && d.newPrice !== "" ? Number(d.newPrice) : null,
      source: d.source || "manuel", created_by: currentUser.id,
      ludum_url: d.ludumUrl ? d.ludumUrl.trim() : "",
    }).select().single();
    if (error) return { error: error.message };
    await loadData();
    return { upcoming: data };
  }, [currentUser, loadData]);

  // Modifier une fiche À venir
  const updateUpcoming = useCallback(async (id, patch) => {
    const fields = {};
    if (patch.name !== undefined) fields.name = patch.name.trim();
    if (patch.year !== undefined) fields.year = patch.year || null;
    if (patch.min !== undefined) fields.min_players = patch.min || null;
    if (patch.max !== undefined) fields.max_players = patch.max || null;
    if (patch.time !== undefined) fields.play_time = patch.time || null;
    if (patch.mechanics !== undefined) fields.mechanics = patch.mechanics || [];
    if (patch.desc !== undefined) fields.description = patch.desc || "";
    if (patch.img !== undefined) fields.image_url = await uploadImageToStorage(patch.img || "", "upcoming");
    if (patch.newPrice !== undefined) fields.new_price = patch.newPrice != null && patch.newPrice !== "" ? Number(patch.newPrice) : null;
    if (patch.ludumUrl !== undefined) fields.ludum_url = patch.ludumUrl ? patch.ludumUrl.trim() : "";
    // .select() pour confirmer l'écriture : un update bloqué par RLS ne renvoie pas d'erreur
    // mais ne touche aucune ligne — on le détecte ici pour éviter un faux « succès ».
    const { data, error } = await supabase.from("upcoming_games").update(fields).eq("id", id).select("id");
    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: "Modification impossible : vous n'avez pas les droits sur cette fiche (ou elle n'existe plus)." };
    await loadData();
    return {};
  }, [loadData]);

  // Supprimer une fiche À venir (n'importe quel membre connecté).
  const removeUpcoming = useCallback(async (id) => {
    if (!currentUser) return;
    await supabase.from("upcoming_games").delete().eq("id", id);
    await loadData();
  }, [currentUser, loadData]);

  // Voter / changer / retirer son vote du thermomètre de la hype (1-5)
  const setHype = useCallback(async (upcId, value) => {
    if (!currentUser) return;
    const upc = upcoming.find((u) => u.id === upcId);
    const existing = upc?.hypes?.[currentUser.id];
    if (existing === value) {
      await supabase.from("upcoming_hype").delete().eq("upcoming_id", upcId).eq("user_id", currentUser.id);
    } else {
      await supabase.from("upcoming_hype").upsert({ upcoming_id: upcId, user_id: currentUser.id, value });
    }
    await loadData();
  }, [currentUser, upcoming, loadData]);

  // Définir / retirer son intention d'achat
  const setIntent = useCallback(async (upcId, intent) => {
    if (!currentUser) return;
    const upc = upcoming.find((u) => u.id === upcId);
    const existing = upc?.intents?.[currentUser.id];
    if (existing === intent) {
      await supabase.from("upcoming_intent").delete().eq("upcoming_id", upcId).eq("user_id", currentUser.id);
    } else {
      await supabase.from("upcoming_intent").upsert({ upcoming_id: upcId, user_id: currentUser.id, intent });
    }
    await loadData();
  }, [currentUser, upcoming, loadData]);

  // Commentaires sur une fiche À venir
  const addUpcomingComment = useCallback(async (upcId, content) => {
    if (!currentUser) return { error: "Connectez-vous." };
    if (!content?.trim()) return { error: "Le commentaire est vide." };
    const { error } = await supabase.from("upcoming_comments").insert({
      upcoming_id: upcId, author_id: currentUser.id, content: content.trim().slice(0, 2000),
    });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  const updateUpcomingComment = useCallback(async (commentId, content) => {
    if (!currentUser) return { error: "Connectez-vous." };
    if (!content?.trim()) return { error: "Le commentaire est vide." };
    const { error } = await supabase.from("upcoming_comments").update({
      content: content.trim().slice(0, 2000), updated_at: new Date().toISOString(),
    }).eq("id", commentId);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [currentUser, loadData]);

  const removeUpcomingComment = useCallback(async (commentId) => {
    if (!currentUser) return;
    await supabase.from("upcoming_comments").delete().eq("id", commentId);
    await loadData();
  }, [currentUser, loadData]);

  // Bouton "Je l'ai !" : crée une fiche ludothèque depuis une fiche À venir,
  // m'y inscrit comme premier propriétaire, et lie la fiche À venir au jeu créé.
  const importUpcomingToLudo = useCallback(async (upcId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const u = upcoming.find((x) => x.id === upcId);
    if (!u) return { error: "Fiche introuvable." };
    // si déjà liée à une fiche ludo existante, on s'y ajoute juste comme propriétaire
    if (u.ludoGameId) {
      const { error } = await supabase.from("game_owners").insert({ game_id: u.ludoGameId, owner_id: currentUser.id });
      if (error && !/duplicate|unique/i.test(error.message)) return { error: error.message };
      await loadData();
      return { gameId: u.ludoGameId };
    }
    // sinon on crée la fiche ludo à partir des infos À venir
    const imgUrl = await uploadImageToStorage(u.img || "", "games");
    const { data: game, error } = await supabase.from("games").insert({
      name: u.name, year: u.year || null, min_players: u.min || null, max_players: u.max || null,
      play_time: u.time || null, mechanics: u.mechanics || [], description: u.desc || "", image_url: imgUrl,
      new_price: u.newPrice != null ? u.newPrice : null, source: u.source || "manuel", owner_id: currentUser.id,
    }).select().single();
    if (error) return { error: error.message };
    await supabase.from("game_owners").insert({ game_id: game.id, owner_id: currentUser.id, confirmed: true, declared_by: currentUser.id });
    // lier la fiche À venir à la nouvelle fiche ludo
    await supabase.from("upcoming_games").update({ ludo_game_id: game.id }).eq("id", upcId);
    await loadData();
    return { gameId: game.id };
  }, [currentUser, upcoming, loadData]);


  // ---- Invités nommés (membres avec compte OU personnes sans compte) ----
  const addGuest = useCallback(async (eventId, guestName, memberId = null) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { error } = await supabase.from("event_guests").insert({
      event_id: eventId, guest_name: guestName.trim(), member_id: memberId, added_by: currentUser.id,
    });
    if (error) return { error: error.message };
    // Inviter un membre => on le prévient ; il confirmera depuis Ma ludothèque (en attente = ambre)
    if (memberId && memberId !== currentUser.id) {
      const ev = events.find((e) => e.id === eventId);
      await supabase.from("notifications").insert({
        recipient_id: memberId, actor_id: currentUser.id, type: "event_invite",
        message: `${currentUser.name} vous a ajouté au moment jeux du ${formatDateFr(ev?.date)}`,
        link_kind: "event", link_id: eventId,
      });
    }
    await loadData();
    return {};
  }, [currentUser, events, loadData]);

  const confirmEventInvite = useCallback(async (guestId) => {
    const { error } = await supabase.rpc("respond_event_invite", { p_guest_id: guestId, p_accept: true });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);
  const declineEventInvite = useCallback(async (guestId) => {
    const { error } = await supabase.rpc("respond_event_invite", { p_guest_id: guestId, p_accept: false });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  const removeGuest = useCallback(async (guestId) => {
    await supabase.from("event_guests").delete().eq("id", guestId);
    await loadData();
  }, [loadData]);

  // ---- Commentaires de soirée ----
  // Insère des notifications pour une liste de destinataires (en excluant l'acteur lui-même).
  // recipients : tableau d'IDs. On ne notifie jamais l'auteur de l'action.
  const notifyUsers = useCallback(async (recipients, { type, message, linkKind = null, linkId = null }) => {
    if (!currentUser) return;
    const unique = [...new Set(recipients)].filter((id) => id && id !== currentUser.id);
    if (unique.length === 0) return;
    const rows = unique.map((rid) => ({
      recipient_id: rid, actor_id: currentUser.id, type, message,
      link_kind: linkKind, link_id: linkId,
    }));
    await supabase.from("notifications").insert(rows); // best-effort, on n'interrompt pas en cas d'échec
  }, [currentUser]);

  const addComment = useCallback(async (eventId, content) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { error } = await supabase.from("event_comments").insert({
      event_id: eventId, author_id: currentUser.id, content: content.trim(),
    });
    if (error) return { error: error.message };
    // Notifier les participants du moment (hôte + inscrits), sauf l'auteur du commentaire.
    const ev = events.find((e) => e.id === eventId);
    if (ev) {
      const recipients = [ev.hostId, ...(ev.players || []).map((p) => p.id)];
      await notifyUsers(recipients, {
        type: "event_comment",
        message: `${currentUser.name} a commenté le moment du ${formatDateFr(ev.date)}`,
        linkKind: "event", linkId: eventId,
      });
    }
    await loadData();
    return {};
  }, [currentUser, loadData, events, notifyUsers]);

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

  // ---- Commentaires de jeux (mêmes règles que ceux des moments) ----
  const addGameComment = useCallback(async (gameId, content) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { error } = await supabase.from("game_comments").insert({ game_id: gameId, author_id: currentUser.id, content: content.trim() });
    if (error) return { error: error.message };
    // Notifier les propriétaires (confirmés) du jeu, sauf l'auteur du commentaire.
    const g = games.find((x) => x.id === gameId);
    if (g) {
      const recipients = (g.ownerIds && g.ownerIds.length) ? g.ownerIds : (g.ownerId ? [g.ownerId] : []);
      await notifyUsers(recipients, {
        type: "game_comment",
        message: `${currentUser.name} a commenté votre jeu « ${g.name} »`,
        linkKind: "game", linkId: gameId,
      });
    }
    await loadData();
    return {};
  }, [currentUser, loadData, games, notifyUsers]);

  const updateGameComment = useCallback(async (commentId, content) => {
    const { error } = await supabase.from("game_comments").update({ content: content.trim(), updated_at: new Date().toISOString() }).eq("id", commentId);
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  const removeGameComment = useCallback(async (commentId) => {
    await supabase.from("game_comments").delete().eq("id", commentId);
    await loadData();
  }, [loadData]);

  // ---- Notifications : marquer lues ----
  // Marque une notification précise comme lue (mise à jour locale immédiate + base).
  const markNotificationRead = useCallback(async (notifId) => {
    setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", notifId);
  }, []);

  // Supprime une notification (croix dans « Ma ludothèque »).
  const deleteNotification = useCallback(async (notifId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    await supabase.from("notifications").delete().eq("id", notifId);
  }, []);

  // Marque toutes mes notifications comme lues.
  const markAllNotificationsRead = useCallback(async () => {
    if (!currentUser) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("recipient_id", currentUser.id).eq("read", false);
  }, [currentUser]);

  // ---- Suggestions : rejeter un jeu ("ça ne m'intéresse pas") ----
  const dismissReco = useCallback(async (gameId) => {
    if (!currentUser) return;
    setDismissedIds((prev) => prev.includes(gameId) ? prev : [...prev, gameId]); // maj locale immédiate
    await supabase.from("reco_dismissed").insert({ user_id: currentUser.id, game_id: gameId });
  }, [currentUser]);

  // ---- Regroupement familial (foyers) ----
  const inviteToHousehold = useCallback(async (memberId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { error } = await supabase.rpc("household_invite", { p_invitee_id: memberId });
    if (error) return { error: error.message };
    await notifyUsers([memberId], {
      type: "household_invite",
      message: `${currentUser.name} vous invite à rejoindre sa famille`,
      linkKind: "household", linkId: null,
    });
    await loadData();
    return {};
  }, [currentUser, notifyUsers, loadData]);

  const acceptHouseholdInvite = useCallback(async (inviteId) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { data: inviterId, error } = await supabase.rpc("household_accept", { p_invite_id: inviteId });
    if (error) return { error: error.message };
    if (inviterId) await notifyUsers([inviterId], {
      type: "household_accepted",
      message: `${currentUser.name} a rejoint votre famille`,
      linkKind: "household", linkId: null,
    });
    await loadData();
    return {};
  }, [currentUser, notifyUsers, loadData]);

  const declineHouseholdInvite = useCallback(async (inviteId) => {
    const { data: inviterId, error } = await supabase.rpc("household_decline", { p_invite_id: inviteId });
    if (error) return { error: error.message };
    if (inviterId && currentUser) await notifyUsers([inviterId], {
      type: "household_declined",
      message: `${currentUser.name} a décliné votre invitation à la famille`,
      linkKind: "household", linkId: null,
    });
    await loadData();
    return {};
  }, [currentUser, notifyUsers, loadData]);

  const cancelHouseholdInvite = useCallback(async (inviteId) => {
    const { error } = await supabase.rpc("household_cancel_invite", { p_invite_id: inviteId });
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  const leaveHousehold = useCallback(async () => {
    const { error } = await supabase.rpc("household_leave");
    if (error) return { error: error.message };
    await loadData();
    return {};
  }, [loadData]);

  // ---- Lieux réutilisables (partagés entre tous) ----
  const addPlace = useCallback(async (data) => {
    if (!currentUser) return { error: "Connectez-vous." };
    const { data: row, error } = await supabase.from("places").insert({
      name: data.name.trim(), address: data.address?.trim() || "", access_info: data.accessInfo?.trim() || "", created_by: currentUser.id,
    }).select().single();
    if (error) return { error: error.message };
    await loadData();
    return { id: row.id };
  }, [currentUser, loadData]);

  const updatePlace = useCallback(async (id, data) => {
    const { error } = await supabase.from("places").update({
      name: data.name.trim(), address: data.address?.trim() || "", access_info: data.accessInfo?.trim() || "",
    }).eq("id", id);
    if (error) return { error: error.message };
    await loadData();
    return {};
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
    ready, fatalError, users, games, events, places, loans, myWeights, upcoming, currentUser,
    register, login, logout, addGame, updateGame, removeGame, rateGame, clearRating,
    loginWithGoogle,
    toggleGameShared, setShareLibrary, addOwner, removeOwner, declareOwners, updateProfile,
    confirmOwnership, declineOwnership, toggleDiscover,
    banUser, unbanUser, deleteUser, memberEmails, bannedNotice, setBannedNotice,
    notifications, markNotificationRead, markAllNotificationsRead, deleteNotification,
    dismissedIds, dismissReco,
    household, inviteToHousehold, acceptHouseholdInvite, declineHouseholdInvite, cancelHouseholdInvite, leaveHousehold,
    addExtension, addExtensionOwner, removeExtensionOwner,
    setGameWeight, createLoan, closeLoan,
    addEvent, updateEvent, toggleJoin, removeEvent, addPlayedGame, removePlayedGame,
    addGuest, removeGuest, confirmEventInvite, declineEventInvite, addComment, updateComment, removeComment,
    addGameComment, updateGameComment, removeGameComment,
    addPlace, updatePlace,
    addUpcoming, updateUpcoming, removeUpcoming, setHype, setIntent,
    addUpcomingComment, updateUpcomingComment, removeUpcomingComment, importUpcomingToLudo,
    reload: loadData,
    chrono, openChrono, closeChrono,
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

// Moteur de recommandations : propose des jeux non notés par l'utilisateur,
// en combinant (a) les goûts des membres aux profils proches, (b) les mécaniques qu'il aime.
function recommendGames(games, currentUserId, dismissedIds = []) {
  if (!currentUserId) return [];
  const myRatings = {}; // gameId -> ma note
  games.forEach((g) => { const v = g.ratings?.[currentUserId]; if (v) myRatings[g.id] = v; });
  const ratedIds = new Set(Object.keys(myRatings));

  // --- (a) Similarité entre membres : qui note comme moi sur les jeux qu'on a en commun ?
  const otherUsers = {};
  games.forEach((g) => {
    Object.entries(g.ratings || {}).forEach(([uid, val]) => {
      if (uid === currentUserId) return;
      (otherUsers[uid] ||= []).push({ gameId: g.id, val });
    });
  });
  const similarity = {}; // uid -> score de proximité (0..1)
  Object.entries(otherUsers).forEach(([uid, theirRatings]) => {
    let sum = 0, n = 0;
    theirRatings.forEach(({ gameId, val }) => {
      if (myRatings[gameId] != null) { sum += Math.abs(myRatings[gameId] - val); n++; }
    });
    // proximité = inverse de l'écart moyen (sur échelle 0-5) ; n>0 requis
    if (n > 0) similarity[uid] = 1 - (sum / n) / 5;
  });

  // --- (b) Mécaniques que j'apprécie (jeux notés ≥ 4) ET que je n'aime pas (jeux notés ≤ 2)
  const likedMech = {};
  const dislikedMech = {};
  games.forEach((g) => {
    const r = myRatings[g.id] || 0;
    if (r >= 4) (g.mechanics || []).forEach((m) => { likedMech[m] = (likedMech[m] || 0) + 1; });
    else if (r > 0 && r <= 2) (g.mechanics || []).forEach((m) => { dislikedMech[m] = (dislikedMech[m] || 0) + 1; });
  });
  const maxMech = Math.max(1, ...Object.values(likedMech));

  // --- (c) Format préféré : nombre de joueurs et durée de mes jeux bien notés (≥ 4)
  //     On calcule une fourchette "habituelle" pour donner un petit bonus aux jeux similaires.
  const likedPlayers = [];
  const likedTimes = [];
  games.forEach((g) => {
    if ((myRatings[g.id] || 0) >= 4) {
      const mid = g.min && g.max ? (Number(g.min) + Number(g.max)) / 2 : (Number(g.min) || Number(g.max) || 0);
      if (mid > 0) likedPlayers.push(mid);
      if (Number(g.time) > 0) likedTimes.push(Number(g.time));
    }
  });
  const avg = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
  const prefPlayers = avg(likedPlayers); // 0 si pas de signal
  const prefTime = avg(likedTimes);

  // --- (d) Envies de découvrir des membres proches (signal social)
  //     Pour chaque jeu, on regarde si des membres qui me ressemblent veulent le découvrir.
  const discoverPeerScore = (g) => {
    const wanters = g.wantIds || [];
    if (wanters.length === 0) return 0;
    let s = 0;
    wanters.forEach((uid) => { if (uid !== currentUserId) s += (similarity[uid] || 0.3); });
    return Math.min(1, s / 3); // plafonné : 3 membres proches qui le veulent = score max
  };

  // --- Score de chaque jeu candidat (non noté par moi)
  // Candidats : jeux que je n'ai pas notés, que je ne possède pas déjà,
  // pour lesquels je n'ai pas déjà exprimé une envie de découvrir,
  // et que je n'ai pas rejetés ("ça ne m'intéresse pas").
  const dismissed = new Set(dismissedIds);
  const candidates = games.filter((g) =>
    !ratedIds.has(g.id)
    && !(g.ownerIds || []).includes(currentUserId)
    && !(g.wantIds || []).includes(currentUserId)
    && !dismissed.has(g.id)
  );
  const scored = candidates.map((g) => {
    // composante "profils similaires" : moyenne pondérée des notes des autres par leur proximité
    let wSum = 0, wTot = 0;
    Object.entries(g.ratings || {}).forEach(([uid, val]) => {
      if (uid === currentUserId) return;
      const sim = similarity[uid];
      if (sim != null && sim > 0) { wSum += sim * val; wTot += sim; }
    });
    const peerScore = wTot > 0 ? (wSum / wTot) / 5 : 0; // 0..1

    // composante "mécaniques aimées" moins "mécaniques détestées"
    const mechHits = (g.mechanics || []).reduce((s, m) => s + (likedMech[m] || 0), 0);
    const mechMiss = (g.mechanics || []).reduce((s, m) => s + (dislikedMech[m] || 0), 0);
    const mechScore = Math.max(0, Math.min(1, (mechHits - mechMiss * 0.7) / (maxMech * 2))); // 0..1, pénalisé

    // score de base : dominante profils (0.7) + appoint mécaniques (0.3)
    const globalAvg = gameStats(g).avg / 5;
    let base = wTot > 0 ? (0.7 * peerScore + 0.3 * mechScore) : (0.5 * mechScore + 0.3 * globalAvg);

    // bonus additif "format préféré" (15% max) : proximité du nb de joueurs et de la durée
    let formatBonus = 0;
    if (prefPlayers > 0 && (g.min || g.max)) {
      const mid = g.min && g.max ? (Number(g.min) + Number(g.max)) / 2 : (Number(g.min) || Number(g.max));
      const diff = Math.abs(mid - prefPlayers);
      formatBonus += 0.075 * Math.max(0, 1 - diff / 4); // 4 joueurs d'écart = bonus nul
    }
    if (prefTime > 0 && Number(g.time) > 0) {
      const diff = Math.abs(Number(g.time) - prefTime);
      formatBonus += 0.075 * Math.max(0, 1 - diff / 90); // 90 min d'écart = bonus nul
    }

    // bonus social "envie de découvrir des pairs"
    const discoverBonus = 0.1 * discoverPeerScore(g);

    const score = base + formatBonus + discoverBonus;

    // raison principale affichée à l'utilisateur (explication de la reco)
    let reason = "";
    if (wTot > 0 && peerScore >= mechScore) reason = "Apprécié par des membres proches de vous";
    else if (mechHits > 0) {
      const topMech = (g.mechanics || []).filter((m) => likedMech[m]).sort((a, b) => (likedMech[b] || 0) - (likedMech[a] || 0))[0];
      reason = topMech ? `Vous aimez les jeux « ${topMech} »` : "Correspond à vos goûts";
    } else if (discoverPeerScore(g) > 0) reason = "Des membres proches veulent le découvrir";
    else reason = "Bien noté par l'association";

    return { game: g, score, reason, mechanics: g.mechanics || [], hasSignal: wTot > 0 || mechHits > 0 || discoverPeerScore(g) > 0 };
  });

  // on ne garde que les jeux avec un vrai signal et un score positif
  const pool = scored.filter((s) => s.hasSignal && s.score > 0).sort((a, b) => b.score - a.score);

  // --- Diversité douce (MMR à 15%) : on construit la liste un jeu à la fois,
  //     en pénalisant légèrement les jeux trop semblables (mêmes mécaniques) à ceux déjà choisis.
  const DIVERSITY = 0.15;
  const selected = [];
  const remaining = [...pool];
  while (selected.length < 10 && remaining.length > 0) {
    let bestIdx = 0, bestVal = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      // similarité max avec un jeu déjà sélectionné = proportion de mécaniques partagées
      let maxSim = 0;
      selected.forEach((sel) => {
        const setA = new Set(cand.mechanics);
        const shared = sel.mechanics.filter((m) => setA.has(m)).length;
        const denom = Math.max(1, Math.min(cand.mechanics.length, sel.mechanics.length));
        maxSim = Math.max(maxSim, shared / denom);
      });
      const adjusted = cand.score - DIVERSITY * maxSim;
      if (adjusted > bestVal) { bestVal = adjusted; bestIdx = i; }
    }
    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  // on renvoie les jeux enrichis de leur "raison" (pour l'affichage)
  return selected.map((s) => ({ ...s.game, _recoReason: s.reason }));
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
/* ---- Encart : échelle de notation (réutilisé en ludothèque générale et perso) ---- */
function RatingScaleNote() {
  const [open, setOpen] = useState(false);
  const scale = [
    { v: 5,   t: "j'y joue encore et encore (j'adore)" },
    { v: 4,   t: "j'y joue avec plaisir" },
    { v: 3,   t: "j'y joue si on me le propose" },
    { v: 2,   t: "j'y joue pour faire plaisir" },
    { v: 1,   t: "j'y joue à contre-cœur" },
    { v: 0.5, t: "je n'y rejouerai jamais" },
  ];
  return (
    <div style={{ background: "rgba(232,163,23,.08)", border: "1px solid rgba(232,163,23,.3)", borderRadius: 14, padding: "12px 16px", marginBottom: 20 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 14.5 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Star size={16} fill={C.amber} color={C.amber} /> Comment on note les jeux à l'ALADJ
        </span>
        <ChevronRight size={16} style={{ transform: open ? "rotate(90deg)" : "rotate(0)", transition: "transform .15s", color: "#9c8d79" }} />
      </button>
      {open && (
        <>
          <p style={{ fontSize: 13.5, color: "#5e5346", margin: "10px 0 12px", lineHeight: 1.55 }}>
            Juger la qualité « objective » d'un jeu est difficile, mais on sait facilement si on a envie d'y rejouer. Notre échelle reflète cette envie :
          </p>
          <div style={{ display: "grid", gap: 6 }}>
            {scale.map((s) => (
              <div key={s.v} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flexShrink: 0, width: 110 }}><Stars value={s.v} readOnly size={14} /></span>
                <span style={{ fontSize: 13.5, color: "#5e5346" }}>{s.t}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stars({ value = 0, onRate, onClear, size = 18, readOnly = false }) {
  const [hover, setHover] = useState(0); // valeur survolée (peut être .5)
  const shown = hover || value; // valeur affichée
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ display: "inline-flex", gap: 2, position: "relative" }} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const full = shown >= n;
          const half = !full && shown >= n - 0.5;
          return (
            <span key={n} style={{ position: "relative", lineHeight: 0, display: "inline-block", width: size, height: size }}>
              {/* étoile de fond (vide) */}
              <Star size={size} fill="none" color="#cdb9a0" strokeWidth={1.8} style={{ position: "absolute", top: 0, left: 0 }} />
              {/* remplissage (plein ou moitié gauche) */}
              {(full || half) && (
                <span style={{ position: "absolute", top: 0, left: 0, width: half ? size / 2 : size, height: size, overflow: "hidden", lineHeight: 0 }}>
                  <Star size={size} fill={C.amber} color={C.amber} strokeWidth={1.8} />
                </span>
              )}
              {/* zones cliquables (au-dessus de tout) : moitié gauche = n-0.5, moitié droite = n */}
              {!readOnly && (
                <>
                  <button type="button" aria-label={`${n - 0.5} étoile`} title={`${String(n - 0.5).replace(".", ",")} / 5`}
                    onMouseEnter={() => setHover(n - 0.5)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRate && onRate(n - 0.5); }}
                    style={{ position: "absolute", top: 0, left: 0, width: size / 2, height: size, background: "transparent", border: "none", padding: 0, margin: 0, cursor: "pointer", zIndex: 2 }} />
                  <button type="button" aria-label={`${n} étoiles`} title={`${n} / 5`}
                    onMouseEnter={() => setHover(n)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRate && onRate(n); }}
                    style={{ position: "absolute", top: 0, left: size / 2, width: size / 2, height: size, background: "transparent", border: "none", padding: 0, margin: 0, cursor: "pointer", zIndex: 2 }} />
                </>
              )}
            </span>
          );
        })}
      </span>
      {/* bouton effacer la note */}
      {!readOnly && onClear && value > 0 && (
        <button type="button" onClick={onClear} title="Effacer ma note"
          style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(181,40,58,.08)", color: C.red, border: "none", borderRadius: 8, padding: "4px 9px", cursor: "pointer", fontSize: 12, fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
          <X size={12} /> Effacer
        </button>
      )}
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
    purple: { background: C.purple, color: "#fff", border: `2px solid ${C.purple}` },
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

/* ---- Champ image : URL OU import d'un fichier local (jpg, png...) avec compression auto ---- */
function ImageField({ value, onChange }) {
  const [err, setErr] = useState("");
  const [working, setWorking] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = React.useRef(null);

  // Redimensionne (max 800px de côté) et recompresse en JPEG pour alléger l'image.
  const compressImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, width, height); // fond blanc pour les PNG transparents
        ctx.drawImage(img, 0, 0, width, height);
        // qualité 0.8 ; on réduit si l'image reste trop lourde
        let quality = 0.8;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > 250 * 1024 && quality > 0.4) { // vise < ~250 Ko
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Image illisible"));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.readAsDataURL(file);
  });

  const handleFile = async (e) => {
    setErr("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Choisissez un fichier image (jpg, png...)."); return; }
    setWorking(true);
    try {
      const compressed = await compressImage(file); // remplace automatiquement l'ancienne valeur
      onChange(compressed);
    } catch (e) {
      setErr("Impossible de traiter cette image. Essayez une autre, ou utilisez une adresse web.");
    }
    setWorking(false);
    if (fileRef.current) fileRef.current.value = ""; // permet de réimporter le même fichier
  };

  // Télécharge une image depuis une URL, la convertit et la stocke localement.
  // Indispensable pour BGG, qui bloque l'affichage direct de ses images (hotlinking).
  const importFromUrl = async (rawUrl) => {
    const url = rawUrl.trim();
    if (!url || !/^https?:\/\//i.test(url)) { setErr("Adresse invalide."); return; }
    setErr(""); setWorking(true);
    // on tente plusieurs voies pour récupérer l'image malgré les blocages
    const tries = [
      url,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
    ];
    for (const u of tries) {
      try {
        const res = await fetch(u);
        if (!res.ok) continue;
        const blob = await res.blob();
        if (!blob.type.startsWith("image/")) continue;
        const file = new File([blob], "image", { type: blob.type });
        const compressed = await compressImage(file);
        onChange(compressed);
        setWorking(false);
        return;
      } catch (e) { /* voie suivante */ }
    }
    setWorking(false);
    setErr("Impossible de récupérer cette image. Téléchargez-la sur votre appareil puis utilisez « Importer ».");
  };

  const isLocal = value && value.startsWith("data:");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <TextInput value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Coller l'adresse d'une image (https://...)" style={{ flex: 1 }} disabled={working}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); importFromUrl(urlInput); } }} />
        <Btn variant="soft" size="md" onClick={() => importFromUrl(urlInput)} type="button" disabled={working || !urlInput.trim()}>Charger</Btn>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ flex: 1, height: 1, background: "#ece2d0" }} />
        <span style={{ fontSize: 12, color: "#a89a86" }}>ou</span>
        <span style={{ flex: 1, height: 1, background: "#ece2d0" }} />
      </div>
      <Btn variant="soft" size="md" onClick={() => fileRef.current?.click()} type="button" disabled={working} full>
        {working ? <Loader2 size={15} className="aladj-spin" /> : <><Download size={15} style={{ transform: "rotate(180deg)" }} /> Importer depuis mon appareil</>}
      </Btn>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

      {value && !working && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,.03)", borderRadius: 10, padding: 8, marginTop: 8 }}>
          <img src={value} alt="aperçu" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 8 }} />
          <span style={{ fontSize: 12.5, color: "#8a7c6a", flex: 1 }}>Image enregistrée et optimisée ✓</span>
          <button type="button" onClick={() => { onChange(""); setUrlInput(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 6 }}><X size={16} /></button>
        </div>
      )}
      {working && <div style={{ fontSize: 12.5, color: C.teal, marginTop: 8 }}>Traitement de l'image en cours...</div>}
      {err && <div style={{ color: C.red, fontSize: 12.5, marginTop: 6 }}>{err}</div>}
    </div>
  );
}

/* ---- Modale ---- */
function Modal({ open, onClose, children, title, width = 560 }) {
  // On ne ferme sur clic de l'arrière-plan QUE si le geste de souris a commencé
  // ET s'est terminé sur l'arrière-plan lui-même. Cela évite les fermetures
  // intempestives quand on sélectionne du texte dans un champ et que le geste
  // déborde hors de la fenêtre (cas classique du "mousedown dedans, mouseup dehors").
  const downOnOverlay = useRef(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  // À l'ouverture, on rend la fenêtre visible : on remonte en haut l'overlay courant
  // ET les overlays parents qui seraient défilés. Sans ça, une fenêtre ouverte depuis
  // une fiche déjà scrollée apparaît hors écran sur mobile (le flou des overlays parents
  // crée un « containing block » qui décale les fenêtres imbriquées).
  useEffect(() => {
    if (!open) return;
    const el = overlayRef.current;
    if (el) el.scrollTop = 0;
    let p = el ? el.parentElement : null;
    while (p && p !== document.body) {
      if (p.scrollHeight > p.clientHeight + 1) p.scrollTop = 0;
      p = p.parentElement;
    }
  }, [open]);

  if (!open) return null;
  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => { downOnOverlay.current = e.target === e.currentTarget; }}
      onMouseUp={(e) => { if (downOnOverlay.current && e.target === e.currentTarget) onClose(); downOnOverlay.current = false; }}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed", inset: 0, background: "rgba(18,41,63,.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 16px", zIndex: 1000, overflowY: "auto",
      }}>
      <div style={{
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
  { key: "a-venir", label: "À venir", icon: Sparkles },
  { key: "locations", label: "Mes locations", icon: ArrowRightLeft, auth: true },
];

function Navbar({ page, setPage, onAuth }) {
  const { currentUser, logout, notifications } = useApp();
  const [open, setOpen] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const items = NAV.filter((n) => !n.auth || currentUser);
  const unreadNotifs = (notifications || []).filter((n) => !n.read).length;

  return (
    <>
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
            const showBadge = n.key === "ma-ludo" && unreadNotifs > 0;
            return (
              <button key={n.key} onClick={() => setPage(n.key)} style={{
                position: "relative",
                display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 11, border: "none",
                cursor: "pointer", fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 14.5,
                background: active ? C.navy : "transparent", color: active ? "#fff" : C.navy, transition: "background .15s",
              }}>
                <Icon size={17} /> {n.label}
                {showBadge && <span style={{ position: "absolute", top: 3, right: 5, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: C.red, color: "#fff", fontSize: 10.5, fontWeight: 700, display: "grid", placeItems: "center" }}>{unreadNotifs}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }} className="aladj-desktop-nav">
          {currentUser ? (
            <>
              <button onClick={() => setEditProfile(true)} title="Modifier mon profil" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 11, background: "rgba(30,138,138,.1)", border: "none", cursor: "pointer" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, overflow: "hidden", background: C.teal, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14 }}>
                  {currentUser.avatar ? <img src={currentUser.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : currentUser.name[0].toUpperCase()}
                </span>
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>{currentUser.name}</span>
                {currentUser.role === "decideur" && <Crown size={15} color={C.amber} />}
              </button>
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
              <Btn variant="ghost" onClick={() => { setEditProfile(true); setOpen(false); }} full><Users size={16} /> Mon profil</Btn>
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
    {editProfile && <ProfileEditModal onClose={() => setEditProfile(false)} />}
    </>
  );
}

/* ---- Modale : édition de son propre profil ---- */
function ProfileEditModal({ onClose }) {
  const { currentUser, updateProfile } = useApp();
  const [f, setF] = useState({
    name: currentUser?.name || "", avatar: currentUser?.avatar || "", city: currentUser?.city || "",
    bio: currentUser?.bio || "", bggUrl: currentUser?.bggUrl || "", okkazeoUrl: currentUser?.okkazeoUrl || "",
    favMechanics: currentUser?.favMechanics || [],
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const toggleMech = (m) => setF((s) => {
    if (s.favMechanics.includes(m)) return { ...s, favMechanics: s.favMechanics.filter((x) => x !== m) };
    if (s.favMechanics.length >= 6) return s; // max 6
    return { ...s, favMechanics: [...s.favMechanics, m] };
  });

  const save = async () => {
    setErr("");
    if (!f.name.trim()) { setErr("Le nom ne peut pas être vide."); return; }
    setBusy(true);
    const res = await updateProfile(f);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Mon profil" width={560}>
      {/* avatar */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, flexShrink: 0, overflow: "hidden", background: C.teal, display: "grid", placeItems: "center" }}>
          {f.avatar ? <img src={f.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: 30 }}>{(f.name[0] || "?").toUpperCase()}</span>}
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14, marginBottom: 6 }}>Photo / image de profil</label>
          <ImageField value={f.avatar} onChange={(v) => setF({ ...f, avatar: v })} />
        </div>
      </div>

      <Field label="Nom affiché"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Ville"><TextInput value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="Ex. Gouville-sur-Mer" /></Field>

      <Field label={`Présentation (${f.bio.length}/500)`} hint="Quelques mots sur vous, vos goûts de jeu...">
        <textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value.slice(0, 500) })} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Joueur passionné depuis..." />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Lien BoardGameGeek" hint="Facultatif"><TextInput value={f.bggUrl} onChange={(e) => setF({ ...f, bggUrl: e.target.value })} placeholder="https://boardgamegeek.com/user/..." /></Field>
        <Field label="Lien Okkazeo" hint="Facultatif"><TextInput value={f.okkazeoUrl} onChange={(e) => setF({ ...f, okkazeoUrl: e.target.value })} placeholder="https://www.okkazeo.com/..." /></Field>
      </div>

      <Field label={`Mécaniques préférées (${f.favMechanics.length}/6)`} hint="Choisissez jusqu'à 6 types de jeux que vous aimez">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {MECHANIC_SUGGESTIONS.map((m) => {
            const active = f.favMechanics.includes(m);
            const disabled = !active && f.favMechanics.length >= 6;
            return <button key={m} type="button" onClick={() => toggleMech(m)} disabled={disabled} style={{ padding: "6px 12px", borderRadius: 999, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : (disabled ? "#cdbfa8" : "#8a7c6a"), opacity: disabled ? .6 : 1 }}>{m}</button>;
          })}
        </div>
      </Field>

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" onClick={save} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Check size={18} /> Enregistrer mon profil</>}</Btn>
    </Modal>
  );
}


/* =============================================================================
   AUTHENTIFICATION (modale) — Supabase
   ============================================================================= */
function AuthModal({ mode, onClose, setToast }) {
  const { login, register, loginWithGoogle } = useApp();
  const [tab, setTab] = useState(mode || "login");
  const [form, setForm] = useState({ name: "", email: "", pwd: "", pwd2: "", role: "decideur" });
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState(null); // { name } → affiche l'écran de bienvenue + consigne de présentation
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
      // Confirmation e-mail requise : on affiche l'écran de bienvenue avec la consigne de présentation,
      // en précisant aussi qu'il faut confirmer son adresse.
      setWelcome({ name: res.user.name, needsConfirm: true });
      return;
    }
    if (tab === "register") {
      // Inscription réussie et connecté directement → écran de bienvenue avec consigne de présentation.
      setWelcome({ name: res.user.name, needsConfirm: false });
      return;
    }
    onClose();
    setToast(`Bienvenue ${res.user.name} !`);
  };

  // Écran de bienvenue après inscription : rappelle de se présenter à l'association.
  if (welcome) {
    return (
      <Modal open onClose={onClose} title="Bienvenue à l'ALADJ !" width={480}>
        <div style={{ textAlign: "center", padding: "6px 4px" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(30,138,138,.12)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <Sparkles size={28} color={C.teal} />
          </div>
          <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 20, margin: "0 0 6px" }}>
            Compte créé — bienvenue {welcome.name} !
          </h3>
          {welcome.needsConfirm && (
            <p style={{ fontSize: 14, color: "#b5283a", fontWeight: 600, margin: "0 0 14px", lineHeight: 1.5 }}>
              Pensez d'abord à confirmer votre adresse via le mail que nous venons de vous envoyer, puis connectez-vous.
            </p>
          )}
          <div style={{ background: "rgba(232,163,23,.1)", border: `1px solid ${C.amber}`, borderRadius: 14, padding: "16px 18px", margin: "0 0 20px", textAlign: "left" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Info size={18} color={C.amber} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.6, margin: 0 }}>
                <b>N'oubliez pas de vous présenter&nbsp;!</b> Faites-vous connaître auprès de l'association, soit par e-mail à <a href="mailto:aladj50200@gmail.com" style={{ color: C.teal, fontWeight: 600 }}>aladj50200@gmail.com</a>, soit dans la conversation Signal «&nbsp;Organisation jeux&nbsp;». Cela nous permet de faire connaissance et de vous accueillir comme il se doit.
              </p>
            </div>
          </div>
          <Btn full variant="teal" size="lg" onClick={() => { onClose(); setToast(`Bienvenue ${welcome.name} !`); }}>
            <Check size={17} /> J'ai compris
          </Btn>
        </div>
      </Modal>
    );
  }

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

      {/* Connexion Google */}
      <button onClick={async () => { setErr(""); const res = await loginWithGoogle(); if (res?.error) setErr(res.error); }}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px", borderRadius: 12, border: "1.5px solid #e0d4bf", background: "#fff", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 14.5, color: C.navy, marginBottom: 16 }}>
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
        </svg>
        Continuer avec Google
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ flex: 1, height: 1, background: "#ece2d0" }} />
        <span style={{ fontSize: 12.5, color: "#a89a86" }}>ou par e-mail</span>
        <span style={{ flex: 1, height: 1, background: "#ece2d0" }} />
      </div>

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
              { v: "decideur", t: "Membre décisionnaire", d: "Cotisation 20 €/an · voix délibérative en AG", icon: Crown },
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
  const { events, games, users, currentUser, openChrono } = useApp();
  const [showMembers, setShowMembers] = useState(false);
  const [viewMemberId, setViewMemberId] = useState(null); // pour consulter la ludothèque d'un membre
  const [chronoCode, setChronoCode] = useState("");
  const joinChrono = () => {
    const code = chronoCode.trim().toUpperCase();
    if (code.length >= 4) openChrono({ joinCode: code });
  };
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...events].filter((e) => e.date >= today && isEventVisible(e)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 3);
  }, [events]);
  // nombre de moments à venir (pour le compteur d'accueil)
  const upcomingCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events.filter((e) => e.date >= today && isEventVisible(e)).length;
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
            {[
              { n: games.length, l: "jeux partagés", onClick: () => setPage("ludotheque") },
              { n: users.length, l: "membres", onClick: () => setShowMembers(true) },
              { n: upcomingCount, l: "moments à venir", onClick: () => setPage("soirees") },
              { n: "2010", l: "depuis", onClick: null },
            ].map((s, i) => (
              <div key={i} onClick={s.onClick || undefined} style={{ textAlign: "center", cursor: s.onClick ? "pointer" : "default", transition: "transform .15s", ...(s.onClick ? {} : {}) }}
                onMouseEnter={(e) => { if (s.onClick) e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 38, color: "#fff", lineHeight: 1, textDecoration: s.onClick ? "underline" : "none", textDecorationColor: "rgba(255,255,255,.3)", textUnderlineOffset: 6 }}>{s.n}</div>
                <div style={{ color: "rgba(255,255,255,.6)", fontSize: 14, marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 1440 60" style={{ display: "block", width: "100%", height: 50 }} preserveAspectRatio="none"><path d="M0 60 L0 30 Q360 0 720 24 T1440 20 L1440 60 Z" fill={C.cream} /></svg>
      </section>

      {/* ---- Nouveauté : soirées jeux en ligne (BGA) ---- */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", background: `linear-gradient(135deg, ${C.purple}, #4a2856)`, borderRadius: 22, padding: "24px 26px", color: "#fff", boxShadow: "0 14px 36px rgba(107,58,122,.28)" }}>
          <div style={{ display: "grid", placeItems: "center", width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,.16)", flexShrink: 0 }}>
            <Globe size={30} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "clamp(20px,3vw,26px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 6 }}>Nouveau : nos soirées jeux en ligne&nbsp;!</div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, opacity: .92 }}>
              En plus de nos rendez-vous au local, l'association organise désormais des parties <b>en ligne sur Board&nbsp;Game&nbsp;Arena</b>. Repérez les moments « en ligne » (en violet) dans le calendrier, et rejoignez la conversation Signal dédiée pour nous retrouver à l'heure du rendez-vous.
            </p>
          </div>
          <a href="https://signal.group/#CjQKIDrh0Erb7vmLuqhbBcjelvyRNlakSz8S0DWuwYzbY9PMEhCa0Qkdic8YD72P2HPBjUVK" target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: C.purple, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 15, padding: "12px 18px", borderRadius: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
            <Globe size={17} /> Conversation « Jeux en ligne »
          </a>
        </div>
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
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 24px 80px" }}>
        <SectionTitle kicker="Adhésion" title="Rejoindre l'association" center />
        <p style={{ textAlign: "center", color: "#5e5346", fontSize: 15.5, lineHeight: 1.7, maxWidth: 720, margin: "20px auto 36px" }}>
          Deux formules d'adhésion existent, mais <b>tous les membres profitent pleinement de l'asso</b> : moments jeux, ludothèque, notations, location, gestion personnelle... La différence se résume à <b>deux points seulement</b>.
        </p>

        {/* Tronc commun (ce que TOUS les membres ont) */}
        <div style={{ background: C.paper, borderRadius: 22, padding: "28px 32px", border: "1px solid #ece2d0", marginBottom: 24, boxShadow: "0 4px 14px rgba(18,41,63,.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, justifyContent: "center" }}>
            <Check size={20} color={C.teal} />
            <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 19, margin: 0 }}>Ce que tous les membres partagent</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, fontSize: 14, color: "#5e5346", lineHeight: 1.5 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Check size={16} color={C.teal} style={{ marginTop: 2, flexShrink: 0 }} /> Accès complet à la ludothèque partagée lors des moments jeux</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Check size={16} color={C.teal} style={{ marginTop: 2, flexShrink: 0 }} /> Création et participation aux moments jeux</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Check size={16} color={C.teal} style={{ marginTop: 2, flexShrink: 0 }} /> Gestion libre de sa ludothèque personnelle</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Check size={16} color={C.teal} style={{ marginTop: 2, flexShrink: 0 }} /> Notation des jeux et accès complet au site</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Check size={16} color={C.teal} style={{ marginTop: 2, flexShrink: 0 }} /> Location de jeux entre membres</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><Check size={16} color={C.teal} style={{ marginTop: 2, flexShrink: 0 }} /> Mêmes tarifs de location (10 % du prix neuf)</div>
          </div>
        </div>

        {/* Les 2 vraies différences */}
        <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 18, textAlign: "center", margin: "0 0 18px" }}>Les deux seules différences entre les formules</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: 24 }}>
          {/* Décisionnaire */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "26px 26px 22px", border: `2px solid ${C.amber}`, position: "relative" }}>
            <div style={{ position: "absolute", top: -14, left: 22, background: C.amber, color: "#fff", padding: "5px 14px", borderRadius: 999, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}><Crown size={14} /> Décisionnaire</div>
            <div style={{ marginTop: 8, marginBottom: 16 }}>
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 28 }}>20 €</span>
              <span style={{ color: "#9c8d79", fontSize: 14 }}> / an</span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: "rgba(232,163,23,.18)", display: "grid", placeItems: "center" }}><Award size={15} color={C.amber} /></span>
                <span style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5 }}><b style={{ color: C.navy }}>Voix délibérative</b> en assemblée générale — vous participez aux décisions de l'association.</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: "rgba(232,163,23,.18)", display: "grid", placeItems: "center" }}><Check size={15} color={C.amber} /></span>
                <span style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5 }}><b style={{ color: C.navy }}>Dispense de caution</b> sur la location des jeux entre membres.</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: "rgba(232,163,23,.18)", display: "grid", placeItems: "center" }}><Ticket size={15} color={C.amber} /></span>
                <span style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5 }}><b style={{ color: C.navy }}>Pass Ludovore annuel</b> grâce à notre partenariat avec Ludum.</span>
              </div>
            </div>
            {!currentUser && <Btn full variant="amber" size="md" style={{ marginTop: 18 }} onClick={() => onAuth("register")}><UserPlus size={15} /> Adhérer</Btn>}
          </div>

          {/* Non décisionnaire */}
          <div style={{ background: "#fff", borderRadius: 20, padding: "26px 26px 22px", border: `2px solid ${C.teal}`, position: "relative" }}>
            <div style={{ position: "absolute", top: -14, left: 22, background: C.teal, color: "#fff", padding: "5px 14px", borderRadius: 999, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}><Heart size={14} /> Non décisionnaire</div>
            <div style={{ marginTop: 8, marginBottom: 16 }}>
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 28 }}>Gratuit</span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: "rgba(30,138,138,.15)", display: "grid", placeItems: "center" }}><Info size={15} color={C.teal} /></span>
                <span style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5 }}>Pas de voix délibérative en AG (présence possible à titre consultatif).</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: "rgba(30,138,138,.15)", display: "grid", placeItems: "center" }}><Info size={15} color={C.teal} /></span>
                <span style={{ fontSize: 14, color: "#5e5346", lineHeight: 1.5 }}>Caution possible (au prix neuf du jeu) demandée par le prêteur lors d'une location.</span>
              </div>
            </div>
            {!currentUser && <Btn full variant="teal" size="md" style={{ marginTop: 18 }} onClick={() => onAuth("register")}><UserPlus size={15} /> Créer un compte gratuit</Btn>}
          </div>
        </div>

        <p style={{ textAlign: "center", color: "#8a7c6a", fontSize: 14, marginTop: 26, maxWidth: 720, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
          <Info size={15} style={{ verticalAlign: "-2px" }} /> Association loi 1901 fondée le 13 octobre 2010 à Coutances. La cotisation est fixée chaque année par l'assemblée générale. L'association est ouverte aux adultes de 18 ans et plus ; les jeunes de 14 ans et plus sont les bienvenus s'ils sont joueurs et accompagnés d'un adulte. Une pièce d'identité peut être demandée à l'entrée des moments jeux.
        </p>
      </section>

      {/* SOUTENIR L'ASSO — PARTENAIRE LUDUM */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 24px 40px" }}>
        <div style={{ position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyDeep} 100%)`, borderRadius: 24, padding: "clamp(28px,4vw,44px)", boxShadow: "0 10px 30px rgba(18,41,63,.14)" }}>
          <Dice color={C.amber} n={6} style={{ position: "absolute", width: 96, top: -16, right: 28, opacity: .22, transform: "rotate(12deg)" }} />
          <Dice color={C.teal} n={4} style={{ position: "absolute", width: 64, bottom: -10, right: 132, opacity: .18, transform: "rotate(-10deg)" }} />
          <div style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 28 }}>
            <div style={{ flex: "1 1 340px" }}>
              <Badge color={C.amber} soft={false}><Heart size={13} /> Notre partenaire</Badge>
              <h2 style={{ fontFamily: "'Fredoka',sans-serif", color: "#fff", fontSize: "clamp(24px,3.6vw,32px)", margin: "16px 0 10px", lineHeight: 1.1 }}>
                Achetez chez Ludum, soutenez l'asso
              </h2>
              <p style={{ color: "rgba(255,255,255,.82)", fontSize: 15.5, lineHeight: 1.6, margin: "0 0 8px", maxWidth: 540 }}>
                Pour soutenir l'association, pensez à acheter vos jeux chez <b style={{ color: "#fff" }}>Ludum</b> via notre lien partenaire. Une partie de votre achat revient à l'ALADJ, sans aucun surcoût pour vous.
              </p>
              <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
                <Ticket size={13} style={{ verticalAlign: "-2px" }} /> Les membres cotisants profitent en plus du <b style={{ color: C.amber }}>pass Ludovore annuel</b>.
              </p>
            </div>
            <a href="https://www.ludum.fr/?aff=146" target="_blank" rel="noopener noreferrer sponsored"
              style={{ display: "inline-flex", alignItems: "center", gap: 9, background: C.amber, color: "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 17, padding: "15px 28px", borderRadius: 14, textDecoration: "none", boxShadow: "0 8px 22px rgba(232,163,23,.45)", whiteSpace: "nowrap", flexShrink: 0 }}>
              <ShoppingBag size={19} /> Acheter chez Ludum
            </a>
          </div>
        </div>
      </section>

      {/* ---- Location de jeux : règles ---- */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 24px 60px" }}>
        <SectionTitle kicker="Entre membres" title="La location de jeux" center />
        <div style={{ background: C.paper, border: `2px solid ${C.teal}`, borderRadius: 22, padding: "28px 32px", marginTop: 28, boxShadow: "0 6px 20px rgba(18,41,63,.06)" }}>
          <p style={{ fontSize: 15, color: "#5e5346", lineHeight: 1.7, margin: "0 0 18px" }}>
            Les membres de l'association peuvent <b>se louer des jeux entre eux</b>, pour le plaisir d'essayer chez soi avant d'acheter, ou simplement pour profiter d'un jeu d'un autre membre le temps d'une soirée.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 11, background: "rgba(30,138,138,.12)", display: "grid", placeItems: "center" }}>
                <Euro size={18} color={C.teal} />
              </div>
              <div>
                <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 14.5, marginBottom: 3 }}>Tarif</div>
                <div style={{ fontSize: 13.5, color: "#6e6256", lineHeight: 1.55 }}>10% du prix neuf du jeu, arrondi au 0,50 € supérieur. La durée de location est fixée à <b>2 semaines</b>.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 11, background: "rgba(232,163,23,.15)", display: "grid", placeItems: "center" }}>
                <Crown size={18} color={C.amber} />
              </div>
              <div>
                <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 14.5, marginBottom: 3 }}>Caution</div>
                <div style={{ fontSize: 13.5, color: "#6e6256", lineHeight: 1.55 }}>Les <b>membres décisionnaires</b> en sont dispensés. Pour les autres membres, une caution équivalente au prix neuf du jeu peut être demandée par le prêteur.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 11, background: "rgba(181,40,58,.12)", display: "grid", placeItems: "center" }}>
                <Package size={18} color={C.red} />
              </div>
              <div>
                <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 14.5, marginBottom: 3 }}>Jeu abîmé ou incomplet</div>
                <div style={{ fontSize: 13.5, color: "#6e6256", lineHeight: 1.55 }}>L'emprunteur s'engage à <b>rembourser le prêteur</b> à hauteur du préjudice si le jeu est rendu détérioré ou avec des pièces manquantes.</div>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#9c8d79", margin: 0, textAlign: "center", lineHeight: 1.55, borderTop: "1px solid #f0e8d8", paddingTop: 14 }}>
            <Info size={13} style={{ verticalAlign: "-2px" }} /> Le tarif et le suivi de chaque location se gèrent depuis la fiche du jeu, dans la rubrique <b>Location</b>. Retrouvez vos prêts et emprunts en cours sur la page <b>Mes locations</b>.
          </p>
        </div>
      </section>

      {/* ---- Conversations Signal ---- */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 24px 80px" }}>
        <SectionTitle kicker="Rester en contact" title="Nos conversations Signal" center />
        <p style={{ textAlign: "center", color: "#8a7c6a", fontSize: 15, margin: "10px auto 36px", maxWidth: 620, lineHeight: 1.6 }}>
          La vie de l'association se passe sur Signal. Rejoignez les groupes qui vous intéressent en cliquant sur le bouton, ou en scannant le QR code avec votre téléphone.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22 }}>
          {SIGNAL_GROUPS.map((grp) => (
            <div key={grp.name} style={{ background: C.paper, border: "1px solid #ece2d0", borderRadius: 20, padding: 26, textAlign: "center", boxShadow: "0 4px 16px rgba(18,41,63,.05)", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 15, background: grp.color, display: "grid", placeItems: "center", marginBottom: 14 }}>
                <grp.icon size={26} color="#fff" />
              </div>
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 19, margin: "0 0 6px" }}>{grp.name}</h3>
              <p style={{ color: "#8a7c6a", fontSize: 13.5, lineHeight: 1.5, margin: "0 0 18px", flex: 1 }}>{grp.desc}</p>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent(grp.url)}`} alt={`QR code ${grp.name}`}
                style={{ width: 140, height: 140, borderRadius: 12, border: "1px solid #ece2d0", marginBottom: 16 }} />
              <a href={grp.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", width: "100%" }}>
                <Btn full variant="primary" size="md" style={{ background: grp.color, borderColor: grp.color }}><ExternalLink size={16} /> Rejoindre</Btn>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Chrono : rejoindre une partie en cours ---- */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "10px 24px" }}>
        <div style={{ background: C.cream, border: `2px solid ${C.teal}33`, borderRadius: 22, padding: "26px 24px", textAlign: "center" }}>
          <Clock size={28} style={{ color: C.teal, marginBottom: 10 }} />
          <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 22, margin: "0 0 6px", color: C.navy }}>Rejoindre une partie chronométrée</h2>
          <p style={{ fontSize: 14.5, color: C.navy, opacity: .75, margin: "0 0 18px", lineHeight: 1.5, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Saisissez le code donné par l'organisateur pour suivre votre temps de jeu sur votre téléphone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", maxWidth: 440, margin: "0 auto" }}>
            <input
              value={chronoCode}
              onChange={(e) => setChronoCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") joinChrono(); }}
              placeholder="Ex. VPDMS3"
              maxLength={8}
              style={{ flex: 1, minWidth: 170, padding: "13px 16px", borderRadius: 13, border: `1.5px solid ${C.teal}66`, fontSize: 18, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, letterSpacing: 4, textAlign: "center", textTransform: "uppercase", color: C.navy, background: "#fff", outline: "none" }}
            />
            <Btn variant="teal" onClick={joinChrono} disabled={chronoCode.trim().length < 4}>
              <Clock size={17} /> Rejoindre
            </Btn>
          </div>
        </div>
      </section>

      {/* ---- Nous contacter (par e-mail) ---- */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "10px 24px 60px" }}>
        <div style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.navy})`, borderRadius: 22, padding: "32px 28px", color: "#fff", textAlign: "center", boxShadow: "0 8px 24px rgba(18,41,63,.12)" }}>
          <Mail size={32} style={{ marginBottom: 12, opacity: .9 }} />
          <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 26, margin: "0 0 8px" }}>Une question ? Envie de nous rejoindre ?</h2>
          <p style={{ fontSize: 15, opacity: .9, margin: "0 0 18px", lineHeight: 1.55, maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
            Écrivez-nous directement, on vous répond avec plaisir.
          </p>
          <div style={{ background: "rgba(255,255,255,.14)", borderRadius: 14, padding: "14px 20px", margin: "0 auto 22px", maxWidth: 560, fontSize: 14.5, lineHeight: 1.6 }}>
            <b>Nouveau membre&nbsp;?</b> Pensez à vous présenter auprès de l'association, soit dans la conversation Signal «&nbsp;Organisation jeux&nbsp;», soit par e-mail. Cela nous permet de faire connaissance et de vous accueillir comme il se doit&nbsp;!
          </div>
          <a href="mailto:aladj50200@gmail.com" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", color: C.navy, padding: "13px 26px", borderRadius: 13, textDecoration: "none", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 16, boxShadow: "0 4px 14px rgba(0,0,0,.15)" }}>
            <Mail size={18} /> aladj50200@gmail.com
          </a>
        </div>
      </section>

      {showMembers && <MembersModal onClose={() => setShowMembers(false)} onPickMember={(id) => { setShowMembers(false); setViewMemberId(id); }} />}
      {viewMemberId && <MemberLibraryModal memberId={viewMemberId} onClose={() => setViewMemberId(null)} />}
    </div>
  );
}

/* ---- Pop-up : liste des membres, couleur selon statut ---- */
function MembersModal({ onClose, onPickMember }) {
  const { users, currentUser, memberEmails, banUser, unbanUser, deleteUser } = useApp();
  const isAdmin = currentUser && currentUser.admin;
  const [busyId, setBusyId] = useState(null);
  const [confirmBan, setConfirmBan] = useState(null); // id du membre en attente de confirmation de bannissement
  const [confirmDelete, setConfirmDelete] = useState(null); // id du membre en attente de confirmation de suppression
  // Tri : les bannis en bas, puis alphabétique
  const sorted = [...users].sort((a, b) => {
    if (a.banned !== b.banned) return a.banned ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  const doBan = async (id) => {
    setBusyId(id);
    await banUser(id);
    setBusyId(null); setConfirmBan(null);
  };
  const doUnban = async (id) => {
    setBusyId(id);
    await unbanUser(id);
    setBusyId(null);
  };
  const doDelete = async (id) => {
    setBusyId(id);
    const res = await deleteUser(id);
    setBusyId(null); setConfirmDelete(null);
    if (res?.error) alert(res.error);
  };

  return (
    <Modal open onClose={onClose} title={`Les membres de l'association (${users.length})`} width={isAdmin ? 540 : 460}>
      <div style={{ display: "flex", gap: 14, marginBottom: 16, fontSize: 12.5, color: "#8a7c6a", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: C.amber }} /> Décisionnaire</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 4, background: C.teal }} /> Non décisionnaire</span>
        {isAdmin && <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.purple, fontWeight: 700 }}><ShieldCheck size={13} /> Vue administrateur</span>}
      </div>
      <div style={{ display: "grid", gap: 8, maxHeight: "55vh", overflowY: "auto" }}>
        {sorted.map((m) => {
          const color = m.role === "decideur" ? C.amber : C.teal;
          const email = memberEmails[m.id];
          const isMe = currentUser && m.id === currentUser.id;
          return (
            <div key={m.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 13,
              border: m.banned ? `1px solid ${C.red}` : "1px solid #efe6d6",
              background: m.banned ? "rgba(181,40,58,.05)" : "#fff", opacity: m.banned ? 0.85 : 1,
            }}>
              <button onClick={() => onPickMember(m.id)} title="Voir sa ludothèque" style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, overflow: "hidden", background: color, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {m.avatar
                    ? <img src={m.avatar} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : m.name[0].toUpperCase()}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 15 }}>
                    {m.name}
                    {m.admin && <ShieldCheck size={13} color={C.purple} />}
                    {m.banned && <span style={{ fontSize: 10.5, background: C.red, color: "#fff", borderRadius: 5, padding: "1px 6px", fontWeight: 700 }}>BANNI</span>}
                  </span>
                  <span style={{ display: "block", fontSize: 12, color }}>{m.role === "decideur" ? "Membre décisionnaire" : "Membre non décisionnaire"}</span>
                  {isAdmin && email && <span style={{ display: "block", fontSize: 11.5, color: "#9c8d79", marginTop: 1 }}>{email}</span>}
                </span>
              </button>
              {isAdmin && !isMe && (
                confirmDelete === m.id ? (
                  <span style={{ display: "flex", gap: 5 }}>
                    <Btn size="sm" variant="danger" onClick={() => doDelete(m.id)} disabled={busyId === m.id}>{busyId === m.id ? <Loader2 size={13} className="aladj-spin" /> : "Supprimer définitivement"}</Btn>
                    <Btn size="sm" variant="soft" onClick={() => setConfirmDelete(null)}>Non</Btn>
                  </span>
                ) : m.banned ? (
                  <span style={{ display: "flex", gap: 5 }}>
                    <Btn size="sm" variant="teal" onClick={() => doUnban(m.id)} disabled={busyId === m.id}>{busyId === m.id ? <Loader2 size={13} className="aladj-spin" /> : <>Débannir</>}</Btn>
                    <Btn size="sm" variant="soft" onClick={() => setConfirmDelete(m.id)} title="Supprimer définitivement"><Trash2 size={13} /></Btn>
                  </span>
                ) : confirmBan === m.id ? (
                  <span style={{ display: "flex", gap: 5 }}>
                    <Btn size="sm" variant="danger" onClick={() => doBan(m.id)} disabled={busyId === m.id}>{busyId === m.id ? <Loader2 size={13} className="aladj-spin" /> : "Confirmer"}</Btn>
                    <Btn size="sm" variant="soft" onClick={() => setConfirmBan(null)}>Non</Btn>
                  </span>
                ) : (
                  <span style={{ display: "flex", gap: 5 }}>
                    <Btn size="sm" variant="soft" onClick={() => setConfirmDelete(m.id)} title="Supprimer définitivement"><Trash2 size={13} /></Btn>
                    <Btn size="sm" variant="soft" onClick={() => setConfirmBan(m.id)} title="Bannir ce membre"><Lock size={13} /></Btn>
                  </span>
                )
              )}
              {!isAdmin && <ChevronRight size={18} color="#c9bba6" />}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 12.5, color: "#a89a86", marginTop: 14, textAlign: "center" }}>
        {isAdmin ? "Cliquez sur un membre pour voir sa ludothèque. Le bannissement bloque l'accès au site sans supprimer ses jeux." : "Cliquez sur un membre pour voir sa ludothèque."}
      </p>
    </Modal>
  );
}

/* ---- Pop-up : consultation de la ludothèque d'un membre ---- */
function MemberLibraryModal({ memberId, onClose }) {
  const { games, users } = useApp();
  const member = users.find((u) => u.id === memberId);
  // ludothèque triée par note du membre (du mieux noté au moins bien), puis alphabétique
  const theirGames = games.filter((g) => (g.ownerIds || []).includes(memberId)).sort((a, b) => {
    const ra = a.ratings?.[memberId] || 0, rb = b.ratings?.[memberId] || 0;
    if (rb !== ra) return rb - ra;
    return a.name.localeCompare(b.name, "fr");
  });
  const initial = member ? member.name[0].toUpperCase() : "?";
  // Nombre d'extensions que ce membre possède
  const theirExtCount = (() => {
    let n = 0;
    games.forEach((g) => (g.extensions || []).forEach((x) => { if ((x.ownerIds || []).includes(memberId)) n++; }));
    return n;
  })();
  return (
    <Modal open onClose={onClose} title={member ? member.name : "Membre"} width={640}>
      {member && (
        <div style={{ marginBottom: 20 }}>
          {/* en-tête profil */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: member.bio ? 14 : 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, flexShrink: 0, overflow: "hidden", background: member.role === "decideur" ? C.amber : C.teal, display: "grid", placeItems: "center" }}>
              {member.avatar
                ? <img src={member.avatar} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: 30 }}>{initial}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: member.role === "decideur" ? C.amber : C.teal, fontWeight: 700, fontFamily: "'Fredoka',sans-serif" }}>
                  {member.role === "decideur" ? "Membre décisionnaire" : "Membre non décisionnaire"}
                </span>
                {member.city && <span style={{ fontSize: 13, color: "#8a7c6a", display: "inline-flex", alignItems: "center", gap: 3 }}><MapPin size={13} /> {member.city}</span>}
              </div>
              {/* liens externes */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {member.bggUrl && <a href={member.bggUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "#fff", background: "#ff5100", padding: "4px 10px", borderRadius: 8, textDecoration: "none", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><ExternalLink size={12} /> BGG</a>}
                {member.okkazeoUrl && <a href={member.okkazeoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: "#fff", background: C.purple, padding: "4px 10px", borderRadius: 8, textDecoration: "none", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><ExternalLink size={12} /> Okkazeo</a>}
              </div>
              {/* mécaniques préférées */}
              {member.favMechanics && member.favMechanics.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: "#9c8d79", alignSelf: "center" }}>Aime :</span>
                  {member.favMechanics.map((m, i) => <Badge key={i} color={C.purple}>{m}</Badge>)}
                </div>
              )}
            </div>
          </div>
          {/* encart de présentation */}
          {member.bio && (
            <div style={{ background: "rgba(26,58,92,.04)", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#5e5346", lineHeight: 1.55, whiteSpace: "pre-line" }}>{member.bio}</div>
          )}
        </div>
      )}

      <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: "0 0 12px", borderTop: "1px solid #f0e8d8", paddingTop: 16 }}>
        Sa ludothèque ({theirGames.length}{theirExtCount > 0 ? ` + ${theirExtCount} ${theirExtCount > 1 ? "extensions" : "extension"}` : ""}) <span style={{ fontWeight: 400, fontSize: 12.5, color: "#9c8d79" }}>· classée par ses notes</span>
      </h4>
      {theirGames.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#a89a86" }}>
          <Gamepad2 size={40} style={{ opacity: .4, marginBottom: 12 }} />
          <p style={{ fontSize: 14.5 }}>Ce membre n'a pas encore ajouté de jeu.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, maxHeight: "55vh", overflowY: "auto", padding: 2 }}>
          {theirGames.map((g) => {
            const myRating = g.ratings?.[memberId] || 0;
            return (
              <div key={g.id} style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #efe6d6", background: "#fff" }}>
                <div style={{ position: "relative" }}>
                  <GameCover g={g} />
                  {myRating > 0 && (
                    <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(232,163,23,.95)", color: "#fff", borderRadius: 999, padding: "3px 9px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
                      <Star size={11} fill="#fff" color="#fff" /> {String(myRating).replace(".", ",")}
                    </div>
                  )}
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14, lineHeight: 1.2 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: "#9c8d79", marginTop: 4, display: "flex", gap: 8 }}>
                    {g.min && <span>{g.min}{g.max && g.max !== g.min ? `-${g.max}` : ""} j.</span>}
                    {g.time && <span>{g.time} min</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
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
  const { currentUser } = useApp();
  const filled = e.players.length + (e.guests?.length || 0);
  const reached = filled >= e.min;
  // Couleurs cohérentes avec le calendrier : en ligne (BGA) => violet/ambre, présentiel => teal/rouge
  const accent = e.online ? (reached ? C.purple : C.amber) : (reached ? C.teal : C.red);
  const headerGrad = e.online
    ? (reached ? `linear-gradient(135deg,${C.purple},#4a2856)` : `linear-gradient(135deg,${C.amber},#b07d10)`)
    : (reached ? `linear-gradient(135deg,${C.teal},#16706f)` : `linear-gradient(135deg,${C.red},#8e1f2e)`);
  return (
    <button onClick={onOpen} style={{
      textAlign: "left", cursor: "pointer", borderRadius: 20, overflow: "hidden", padding: 0,
      background: C.paper, boxShadow: "0 4px 18px rgba(18,41,63,.06)", border: "1px solid #ece2d0",
    }}>
      <div style={{ background: headerGrad, padding: "16px 20px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12.5, opacity: .85, fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>{formatDateShort(e.date)} · {e.time}</div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 18 }}>{FR_DAYS[new Date(e.date + "T00:00:00").getDay()]}</div>
        </div>
        <Badge color="#fff" soft={false}>{reached ? <><Check size={13} /> Confirmée</> : "En attente"}</Badge>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", color: C.navy, fontWeight: 600, fontFamily: "'Fredoka',sans-serif", marginBottom: 10 }}>
          {e.online ? <Globe size={16} color={accent} /> : <MapPin size={16} color={accent} />} {currentUser ? e.place : <i style={{ color: "#9c8d79", fontWeight: 500 }}>Lieu réservé aux membres connectés</i>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#6e6256", fontSize: 14 }}>
          <Users size={16} color={accent} />
          <b style={{ color: accent }}>{filled}</b> joueur{filled > 1 ? "s" : ""} · min {e.min}{e.max ? ` / max ${e.max}` : " · sans limite"}
        </div>
        <div style={{ marginTop: 12, height: 7, borderRadius: 99, background: "#eee4d2", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${e.max ? Math.min(100, (filled / e.max) * 100) : (reached ? 100 : (filled / Math.max(e.min, 1)) * 100)}%`, background: accent, transition: "width .4s" }} />
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
  const [justCreated, setJustCreated] = useState(null); // moment tout juste créé → proposer le partage Signal
  const [selected, setSelected] = useState(null);
  const [dayPicker, setDayPicker] = useState(null); // plusieurs moments le même jour → fenêtre de choix
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 6 }} className="aladj-cal-grid">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} style={{ textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#a89a86", fontSize: 12.5, padding: "4px 0", minWidth: 0 }}>{d}</div>
          ))}
          {cal.map((cell, i) => {
            if (!cell) return <div key={i} style={{ minWidth: 0 }} />;
            const isToday = cell.iso === new Date().toISOString().slice(0, 10);
            const todayIso = new Date().toISOString().slice(0, 10);
            const isPast = cell.iso < todayIso;
            const hasEv = cell.events.length > 0;
            // clic : sur un événement → ouvre sa fiche ; sur case vide future → crée à cette date
            const handleClick = () => {
              if (hasEv) {
                if (cell.events.length === 1) setSelected(cell.events[0].id);
                else setDayPicker(cell.events);
                return;
              }
              if (!isPast && currentUser) { setPresetDate(cell.iso); setShowCreate(true); }
            };
            const clickable = hasEv || (!isPast && currentUser);
            return (
              <button key={i} onClick={handleClick} title={!hasEv && !isPast && currentUser ? "Proposer un moment jeux ce jour" : undefined} className="aladj-cal-cell" style={{
                aspectRatio: "1", minWidth: 0, border: isToday ? `2px solid ${C.amber}` : "1px solid #efe6d6", borderRadius: 12, background: hasEv ? "rgba(30,138,138,.08)" : "#fff",
                cursor: clickable ? "pointer" : "default", padding: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", position: "relative", overflow: "hidden", opacity: isPast && !hasEv ? 0.5 : 1,
              }}>
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5, color: isToday ? C.amber : C.navy }}>{cell.d}</span>
                {cell.events.slice(0, 2).map((e) => {
                  const reached = (e.players.length + (e.guests?.length || 0)) >= e.min;
                  const pillBg = e.online ? (reached ? C.purple : C.amber) : (reached ? C.teal : C.red);
                  return <span key={e.id} style={{ maxWidth: "92%", marginTop: 3, fontSize: 9.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", background: pillBg, borderRadius: 5, padding: "1px 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{e.time}</span>;
                })}
                {!hasEv && !isPast && currentUser && <Plus size={12} color="#cdb9a0" style={{ marginTop: 2 }} />}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Legend color={C.teal} label="Présentiel — confirmé" /><Legend color={C.red} label="Présentiel — en attente" /><Legend color={C.purple} label="En ligne — confirmé" /><Legend color={C.amber} label="En ligne — en attente" /><Legend color={C.amber} label="Aujourd'hui" outline />
        </div>
      </div>

      {/* LISTE À VENIR */}
      <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 24, margin: "0 0 18px" }}>À venir</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 18 }}>
        {sorted.length === 0 && <EmptyHint icon={Calendar} text="Aucun moment jeux à venir. Proposez-en un !" />}
        {sorted.map((e) => <EventCardMini key={e.id} e={e} onOpen={() => setSelected(e.id)} />)}
      </div>

      {showCreate && <CreateEventModal presetDate={presetDate} onClose={() => { setShowCreate(false); setPresetDate(null); }} onCreate={async (d) => { const res = await addEvent(d); if (res?.error) return res; setShowCreate(false); setPresetDate(null); setToast("Moment jeux créé !"); setJustCreated(d); return {}; }} />}
      {justCreated && <ShareEventModal event={justCreated} onClose={() => setJustCreated(null)} />}
      {dayPicker && (
        <Modal open onClose={() => setDayPicker(null)} title="Plusieurs moments jeux ce jour">
          <p style={{ margin: "0 0 16px", color: C.navy, opacity: .75, fontSize: 14.5 }}>Choisissez celui que vous voulez ouvrir :</p>
          <div style={{ display: "grid", gap: 14 }}>
            {dayPicker.map((ev) => (
              <EventCardMini key={ev.id} e={ev} onOpen={() => { setSelected(ev.id); setDayPicker(null); }} />
            ))}
          </div>
        </Modal>
      )}
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
/* ---- Sélecteur de lieu : choisir un lieu enregistré ou en créer un ---- */
function PlaceSelector({ value, placeId, onChange }) {
  // value = texte libre du lieu ; placeId = id du lieu enregistré (ou null)
  const { places, addPlace, currentUser } = useApp();
  const [mode, setMode] = useState(placeId ? "existing" : "free"); // "existing" | "free" | "new"
  const [newPlace, setNewPlace] = useState({ name: "", address: "", accessInfo: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [editPlace, setEditPlace] = useState(null); // lieu en cours de modification

  const createNew = async () => {
    setErr("");
    if (!newPlace.name.trim()) { setErr("Donnez un nom au lieu."); return; }
    setBusy(true);
    const res = await addPlace(newPlace);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    onChange({ place: newPlace.name.trim(), placeId: res.id });
    setMode("existing");
    setNewPlace({ name: "", address: "", accessInfo: "" });
  };

  const selectedPlace = placeId ? places.find((p) => p.id === placeId) : null;

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14, marginBottom: 6 }}>Lieu</label>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setMode("existing")} style={tabStyle(mode === "existing")}>Lieu enregistré</button>
        <button type="button" onClick={() => { setMode("free"); onChange({ place: value, placeId: null }); }} style={tabStyle(mode === "free")}>Saisie libre</button>
        <button type="button" onClick={() => setMode("new")} style={tabStyle(mode === "new")}>+ Nouveau lieu</button>
      </div>

      {mode === "existing" && (
        places.length === 0 ? (
          <p style={{ fontSize: 13, color: "#a89a86", margin: 0 }}>Aucun lieu enregistré pour l'instant. Créez-en un avec « + Nouveau lieu ».</p>
        ) : (
          <div>
            <select value={placeId || ""} onChange={(e) => { const p = places.find((x) => x.id === e.target.value); onChange({ place: p ? p.name : "", placeId: p ? p.id : null }); }} style={{ ...inputStyle, cursor: "pointer" }}>
              <option value="">— Choisir un lieu —</option>
              {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {selectedPlace && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12.5, color: "#8a7c6a" }}>
                {selectedPlace.accessInfo ? <span>🅿️ Infos d'accès renseignées</span> : <span>Pas encore d'infos d'accès</span>}
                <button type="button" onClick={() => setEditPlace(selectedPlace)} style={{ background: "none", border: "none", color: C.teal, cursor: "pointer", fontSize: 12.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
                  <Edit3 size={13} /> Modifier ce lieu
                </button>
              </div>
            )}
          </div>
        )
      )}

      {mode === "free" && (
        <TextInput value={value} onChange={(e) => onChange({ place: e.target.value, placeId: null })} placeholder="Ex. Local ALADJ — Gouville-sur-Mer" />
      )}

      {mode === "new" && (
        <div style={{ background: "rgba(30,138,138,.06)", borderRadius: 13, padding: 14 }}>
          <Field label="Nom du lieu"><TextInput value={newPlace.name} onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })} placeholder="Ex. Chez Justine - Régneville" /></Field>
          <Field label="Adresse exacte" hint="Facultatif"><TextInput value={newPlace.address} onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })} placeholder="12 rue des Jeux, 50590 Régneville" /></Field>
          <Field label="Accès & stationnement" hint="Comment se garer / accéder">
            <textarea value={newPlace.accessInfo} onChange={(e) => setNewPlace({ ...newPlace, accessInfo: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Parking devant la maison, sonner au portail bleu..." />
          </Field>
          {err && <div style={{ color: C.red, fontSize: 12.5, marginBottom: 8 }}>{err}</div>}
          <Btn size="sm" variant="teal" onClick={createNew} disabled={busy}>{busy ? <Loader2 size={14} className="aladj-spin" /> : <><Plus size={14} /> Créer ce lieu</>}</Btn>
        </div>
      )}

      {editPlace && <PlaceInfoModal place={editPlace} onClose={() => setEditPlace(null)} startEditing />}
    </div>
  );
}
function tabStyle(active) {
  return {
    padding: "6px 12px", borderRadius: 9, border: "1px solid " + (active ? C.teal : "#e6dcc9"),
    background: active ? C.teal : "#fff", color: active ? "#fff" : "#6e6256",
    fontSize: 12.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, cursor: "pointer",
  };
}

function CreateEventModal({ onClose, onCreate, presetDate }) {
  const { currentUser, users } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const startDate = presetDate || today;
  const [f, setF] = useState({ date: startDate, time: "20:00", place: "Local ALADJ — Gouville-sur-Mer", placeId: null, online: false, min: 2, max: "", notes: "", joinSelf: true, useDeadline: false, deadlineDate: startDate, deadlineTime: "18:00" });
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
    if (!f.date || !f.time || (!f.online && !f.place.trim())) { setErr("Renseignez la date, l'heure et le lieu."); return; }
    const minN = Number(f.min) || 1;
    const maxN = f.max === "" || f.max == null ? null : Number(f.max); // null = pas de limite
    if (maxN != null && minN > maxN) { setErr("Le minimum ne peut pas dépasser le maximum."); return; }
    let deadline = null;
    if (f.useDeadline && f.deadlineDate && f.deadlineTime) {
      deadline = new Date(`${f.deadlineDate}T${f.deadlineTime}:00`).toISOString();
    }
    setBusy(true);
    const res = await onCreate({
      date: f.date, time: f.time, place: f.online ? "Board Game Arena" : f.place.trim(), placeId: f.online ? null : f.placeId, online: f.online,
      min: minN, max: maxN, notes: f.notes.trim(),
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
        background: reached ? (f.online ? `linear-gradient(135deg,${C.purple},#4a2856)` : `linear-gradient(135deg,${C.teal},#13615f)`) : (f.online ? `linear-gradient(135deg,${C.amber},#b07d10)` : `linear-gradient(135deg,${C.red},#8a1f2d)`),
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
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button type="button" onClick={() => setF({ ...f, online: false, place: f.place === "Board Game Arena" ? "Local ALADJ — Gouville-sur-Mer" : f.place })}
          style={{ flex: 1, padding: "11px", borderRadius: 12, border: `2px solid ${!f.online ? C.teal : "#e6dcc9"}`, background: !f.online ? "rgba(30,138,138,.08)" : "#fff", color: C.navy, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <MapPin size={16} /> En présentiel
        </button>
        <button type="button" onClick={() => setF({ ...f, online: true, place: "Board Game Arena", placeId: null })}
          style={{ flex: 1, padding: "11px", borderRadius: 12, border: `2px solid ${f.online ? C.purple : "#e6dcc9"}`, background: f.online ? "rgba(107,58,122,.08)" : "#fff", color: C.navy, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Globe size={16} /> En ligne (BGA)
        </button>
      </div>
      {f.online ? (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", borderRadius: 12, background: "rgba(107,58,122,.08)", color: C.navy, fontSize: 13.5, lineHeight: 1.45, marginBottom: 14 }}>
          <Globe size={18} color={C.purple} style={{ flexShrink: 0 }} /> Sur <b>&nbsp;Board Game Arena&nbsp;</b> — rendez-vous sur la conversation Signal «&nbsp;Jeux en ligne&nbsp;» à l'heure indiquée.
        </div>
      ) : (
        <PlaceSelector value={f.place} placeId={f.placeId} onChange={({ place, placeId }) => setF({ ...f, place, placeId })} />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Joueurs min."><TextInput type="number" min={1} max={30} value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
        <Field label="Joueurs max." hint="Laisser vide = illimité"><TextInput type="number" min={1} max={40} value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} placeholder="illimité" /></Field>
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
  const { currentUser, users, places, addGuest, removeGuest, addComment, updateComment, removeComment, updateEvent, openChrono } = useApp();
  const linkedPlace = e.placeId ? places.find((p) => p.id === e.placeId) : null;
  const [showPlace, setShowPlace] = useState(false);
  const totalCount = e.players.length + (e.guests?.length || 0);
  const reached = totalCount >= e.min;
  const full = e.max ? totalCount >= e.max : false;
  const isIn = currentUser && e.players.some((p) => p.id === currentUser.id);
  const isParticipant = currentUser && (isIn || e.hostId === currentUser.id);
  const canManage = currentUser && (currentUser.id === e.hostId || currentUser.admin);

  const [showGuest, setShowGuest] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);

  const deadlineStr = e.deadline ? new Date(e.deadline) : null;
  const deadlinePassed = deadlineStr && Date.now() > deadlineStr.getTime();
  const overlayBg = e.online ? (reached ? "rgba(74,40,86,.92)" : "rgba(176,125,16,.92)") : (reached ? "rgba(19,97,95,.92)" : "rgba(138,31,45,.92)");
  const headerGrad = e.online ? (reached ? `linear-gradient(135deg,${C.purple},#4a2856)` : `linear-gradient(135deg,${C.amber},#b07d10)`) : (reached ? `linear-gradient(135deg,${C.teal},#13615f)` : `linear-gradient(135deg,${C.red},#8a1f2d)`);

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
      background: overlayBg, transition: "background .4s", backdropFilter: "blur(3px)" }}>
      <div onClick={(ev) => ev.stopPropagation()} style={{ background: C.paper, borderRadius: 24, width: "100%", maxWidth: 560, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.4)", animation: "popIn .25s ease" }}>
        <div style={{ padding: "22px 26px", color: "#fff", background: headerGrad, position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,.2)", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", color: "#fff" }}><X size={18} /></button>
          <Badge color="#fff" soft={false}>{reached ? <><Check size={13} /> Moment jeux confirmé</> : "En attente de joueurs"}</Badge>
          <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 26, margin: "12px 0 4px", textTransform: "capitalize" }}>{formatDateFr(e.date)}</h2>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", opacity: .95, fontSize: 14.5 }}>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Clock size={16} /> {e.time}</span>
            {e.online ? (
              <span style={{ display: "flex", gap: 6, alignItems: "center" }}><Globe size={16} /> Board Game Arena</span>
            ) : !currentUser ? (
              <span style={{ display: "flex", gap: 6, alignItems: "center", opacity: .8 }}><MapPin size={16} /> <i>Lieu réservé aux membres connectés</i></span>
            ) : linkedPlace ? (
              <button onClick={() => setShowPlace(true)} style={{ display: "flex", gap: 6, alignItems: "center", background: "rgba(255,255,255,.18)", border: "none", borderRadius: 8, padding: "3px 10px", cursor: "pointer", color: "#fff", fontSize: 14.5, fontFamily: "'Nunito',sans-serif", textDecoration: "underline", textUnderlineOffset: 3 }} title="Voir les infos d'accès">
                <MapPin size={16} /> {e.place} <Info size={13} />
              </button>
            ) : (
              <span style={{ display: "flex", gap: 6, alignItems: "center" }}><MapPin size={16} /> {e.place}</span>
            )}
          </div>
        </div>

        <div style={{ padding: 26 }}>
          {e.online && (
            <a href="https://signal.group/#CjQKIDrh0Erb7vmLuqhbBcjelvyRNlakSz8S0DWuwYzbY9PMEhCa0Qkdic8YD72P2HPBjUVK" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", background: "rgba(107,58,122,.09)", border: `1.5px solid ${C.purple}33`, borderRadius: 13, padding: "13px 15px", marginBottom: 16 }}>
              <Globe size={22} color={C.purple} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, lineHeight: 1.45, color: C.navy }}>
                Partie <b>en ligne sur Board Game Arena</b>. Rendez-vous sur la conversation Signal <b>«&nbsp;Jeux en ligne&nbsp;»</b> à {e.time}.
              </span>
            </a>
          )}
          {/* date limite */}
          {deadlineStr && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: reached ? "rgba(30,138,138,.1)" : "rgba(232,163,23,.12)", borderRadius: 11, padding: "9px 14px", marginBottom: 16, fontSize: 13, color: reached ? C.teal : "#9a7b2a", fontWeight: 600 }}>
              <Clock size={15} />
              {reached ? "Quorum atteint, le moment jeux est maintenu." : `À valider avant le ${formatDateFr(deadlineStr.toISOString().slice(0,10))} à ${deadlineStr.toTimeString().slice(0,5)}`}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 17 }}>
              {totalCount}{e.max ? ` / ${e.max}` : ""} participant{totalCount > 1 ? "s" : ""}{!e.max ? " · sans limite" : ""}
            </span>
            <span style={{ fontSize: 13.5, color: reached ? C.teal : C.red, fontWeight: 700 }}>
              {reached ? "Minimum atteint ✓" : `Encore ${e.min - totalCount} pour valider`}
            </span>
          </div>
          <div style={{ height: 12, borderRadius: 99, background: "#eee4d2", overflow: "hidden", marginBottom: 6, position: "relative" }}>
            <div style={{ height: "100%", width: `${e.max ? Math.min(100, (totalCount / e.max) * 100) : (reached ? 100 : (totalCount / Math.max(e.min, 1)) * 100)}%`, background: reached ? C.teal : C.red, transition: "width .4s" }} />
            {e.max ? <div style={{ position: "absolute", top: 0, bottom: 0, left: `${(e.min / e.max) * 100}%`, width: 2, background: C.navy, opacity: .4 }} /> : null}
          </div>
          <div style={{ fontSize: 11.5, color: "#9c8d79", marginBottom: 18 }}>{e.max ? `↑ le repère indique le minimum requis (${e.min})` : `Minimum requis : ${e.min} joueur${e.min > 1 ? "s" : ""}`}</div>

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
              const memberPending = !!g.memberId; // membre invité, en attente de sa confirmation
              const chipBg = memberPending ? "rgba(232,163,23,.13)" : "rgba(107,58,122,.1)";
              const sqBg = memberPending ? C.amber : C.purple;
              const xColor = memberPending ? "#b88a2e" : "#a07ab0";
              return (
                <span key={g.id} style={{ display: "flex", alignItems: "center", gap: 7, background: chipBg, padding: "6px 12px", borderRadius: 999 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 7, background: sqBg, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12 }}>{g.name[0].toUpperCase()}</span>
                  <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5 }}>{g.name}</span>
                  {memberPending && <span style={{ fontSize: 10.5, color: "#b88a2e", fontWeight: 700 }}>en attente</span>}
                  {canRemoveGuest && <button onClick={() => removeGuest(g.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: xColor, display: "grid", placeItems: "center" }}><X size={14} /></button>}
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
              {canManage && <Btn variant="soft" size="lg" onClick={() => setShowEdit(true)}><Edit3 size={17} /></Btn>}
              {canManage && <Btn variant="danger" size="lg" onClick={() => onRemove(e.id)}><Trash2 size={17} /></Btn>}
            </div>
          ) : (
            <Btn full size="lg" variant="primary" onClick={() => { onClose(); onAuth("login"); }} style={{ marginBottom: 22 }}><LogIn size={18} /> Se connecter pour participer</Btn>
          )}

          {currentUser && (
            <Btn full variant="teal" style={{ marginBottom: 18 }} onClick={() => { onClose(); openChrono({ eventId: e.id }); }}>
              <Clock size={17} /> Lancer le chrono de la partie
            </Btn>
          )}

          {/* JEUX JOUÉS */}
          <EventPlayedGames e={e} isParticipant={!!isParticipant} canManage={!!canManage} />

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
      {showEdit && <EditEventModal e={e} onClose={() => setShowEdit(false)} onSave={async (patch) => { await updateEvent(e.id, patch); setShowEdit(false); }} />}
      {showPlace && linkedPlace && <PlaceInfoModal place={linkedPlace} onClose={() => setShowPlace(false)} />}
    </div>
  );
}

/* ---- Section : jeux joués lors d'un moment ---- */
function EventPlayedGames({ e, isParticipant, canManage }) {
  const { games, currentUser, addPlayedGame, removePlayedGame } = useApp();
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [openedGameId, setOpenedGameId] = useState(null); // jeu joué cliqué pour ouvrir sa fiche
  const played = e.playedGames || [];

  // ids déjà notés pour ce moment (pour les masquer de la recherche)
  const alreadyIds = new Set(played.map((p) => p.gameId));

  // suggestions : jeux de l'asso filtrés par la saisie, excluant ceux déjà notés ce moment
  const suggestions = useMemo(() => {
    if (!q.trim()) return [];
    const n = q.toLowerCase();
    return games
      .filter((g) => !alreadyIds.has(g.id) && g.name.toLowerCase().includes(n))
      .slice(0, 8);
  }, [games, q, played]);

  const submit = async (gameId) => {
    setBusy(true); setErr("");
    const res = await addPlayedGame(e.id, gameId);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setQ("");
  };

  return (
    <div style={{ borderTop: "1px solid #f0e8d8", paddingTop: 18, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: 0 }}>🎲 Jeux joués ({played.length})</h4>
        {isParticipant && !adding && <Btn size="sm" variant="soft" onClick={() => setAdding(true)}><Plus size={14} /> Ajouter</Btn>}
      </div>

      {played.length === 0 && !adding && <span style={{ color: "#a89a86", fontSize: 13.5 }}>Aucun jeu noté pour ce moment.</span>}

      {/* liste des jeux joués */}
      {played.length > 0 && (
        <div style={{ display: "grid", gap: 8, marginBottom: adding ? 14 : 0 }}>
          {played.map((p) => {
            const mineToRemove = currentUser && (p.addedBy === currentUser.id || canManage);
            const gameStillExists = !!games.find((g) => g.id === p.gameId);
            return (
              <div key={p.id} role={gameStillExists ? "button" : undefined} tabIndex={gameStillExists ? 0 : undefined}
                onClick={() => { if (gameStillExists) setOpenedGameId(p.gameId); }}
                title={gameStillExists ? "Voir la fiche du jeu (pour le noter par exemple)" : undefined}
                style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(26,58,92,.04)", borderRadius: 11, padding: "8px 12px", cursor: gameStillExists ? "pointer" : "default", transition: "background .15s" }}
                onMouseEnter={(ev) => { if (gameStillExists) ev.currentTarget.style.background = "rgba(30,138,138,.08)"; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.background = "rgba(26,58,92,.04)"; }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: p.gameImg ? `center/cover url("${p.gameImg}")` : `linear-gradient(135deg,${C.teal},${C.purple})`, display: "grid", placeItems: "center" }}>
                  {!p.gameImg && <span style={{ color: "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 11 }}>{p.gameName.slice(0, 2).toUpperCase()}</span>}
                </div>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>{p.gameName}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "#9c8d79" }}>ajouté par {p.addedByName}{gameStillExists ? " · cliquez pour noter" : ""}</span>
                </span>
                {mineToRemove && <button onClick={(ev) => { ev.stopPropagation(); removePlayedGame(p.id); }} title="Retirer ce jeu" style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 4 }}><Trash2 size={14} /></button>}
              </div>
            );
          })}
        </div>
      )}

      {/* recherche / ajout */}
      {adding && (
        <div style={{ background: "rgba(30,138,138,.06)", borderRadius: 12, padding: 12 }}>
          <Field label="Rechercher un jeu de la ludothèque" hint={isParticipant ? "Vous pouvez ajouter n'importe quel jeu de l'association." : null}>
            <div style={{ position: "relative" }}>
              <Search size={16} color="#b6a78f" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <TextInput value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Nom du jeu..." autoFocus style={{ paddingLeft: 38 }} />
            </div>
          </Field>
          {err && <div style={{ background: "rgba(181,40,58,.08)", color: C.red, padding: "8px 11px", borderRadius: 8, fontSize: 12.5, marginBottom: 8 }}>{err}</div>}
          {q.trim() && (
            <div style={{ display: "grid", gap: 5, maxHeight: 240, overflowY: "auto", marginBottom: 10 }}>
              {suggestions.length === 0 && <span style={{ fontSize: 13, color: "#a89a86", padding: "4px 6px" }}>Aucun jeu correspondant (ou déjà ajouté).</span>}
              {suggestions.map((g) => (
                <button key={g.id} type="button" onClick={() => submit(g.id)} disabled={busy}
                  style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #ece2d0", borderRadius: 9, padding: "7px 10px", cursor: busy ? "wait" : "pointer", textAlign: "left" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: g.img ? `center/cover url("${g.img}")` : `linear-gradient(135deg,${C.teal},${C.purple})` }} />
                  <span style={{ flex: 1, minWidth: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13 }}>{g.name}</span>
                  <Plus size={13} color={C.teal} />
                </button>
              ))}
            </div>
          )}
          <Btn size="sm" variant="soft" onClick={() => { setAdding(false); setQ(""); setErr(""); }}>Fermer</Btn>
        </div>
      )}

      {!isParticipant && played.length === 0 && currentUser && (
        <span style={{ fontSize: 12.5, color: "#a89a86", display: "block", marginTop: 6 }}>Seuls les participants au moment peuvent ajouter des jeux joués.</span>
      )}

      {/* Fiche jeu ouverte au clic sur un jeu joué (permet de noter le jeu en direct) */}
      {openedGameId && (
        <GameDetailModal g={games.find((g) => g.id === openedGameId)} onClose={() => setOpenedGameId(null)} onAuth={() => {}} setToast={() => {}} />
      )}
    </div>
  );
}

/* ---- Modale : modifier un moment jeux (créateur/admin) ---- */
function EditEventModal({ e, onClose, onSave }) {
  const [f, setF] = useState({
    date: e.date, time: e.time, place: e.place, placeId: e.placeId || null, online: !!e.online, min: e.min, max: e.max || "",
    notes: e.notes || "",
    useDeadline: !!e.deadline,
    deadlineDate: e.deadline ? new Date(e.deadline).toISOString().slice(0, 10) : e.date,
    deadlineTime: e.deadline ? new Date(e.deadline).toTimeString().slice(0, 5) : "18:00",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    if (!f.date || !f.time || (!f.online && !f.place.trim())) { setErr("Renseignez la date, l'heure et le lieu."); return; }
    const minN = Number(f.min) || 1;
    const maxN = f.max === "" || f.max == null ? null : Number(f.max);
    if (maxN != null && minN > maxN) { setErr("Le minimum ne peut pas dépasser le maximum."); return; }
    let deadline = null;
    if (f.useDeadline && f.deadlineDate && f.deadlineTime) deadline = new Date(`${f.deadlineDate}T${f.deadlineTime}:00`).toISOString();
    setBusy(true);
    const res = await onSave({ date: f.date, time: f.time, place: f.online ? "Board Game Arena" : f.place.trim(), placeId: f.online ? null : f.placeId, online: f.online, min: minN, max: maxN, notes: f.notes.trim(), deadline });
    setBusy(false);
    if (res?.error) setErr(res.error);
  };

  const today = new Date().toISOString().slice(0, 10);
  return (
    <Modal open onClose={onClose} title="Modifier le moment jeux" width={540}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Jour"><TextInput type="date" value={f.date} onChange={(ev) => setF({ ...f, date: ev.target.value })} /></Field>
        <Field label="Heure"><TextInput type="time" value={f.time} onChange={(ev) => setF({ ...f, time: ev.target.value })} /></Field>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button type="button" onClick={() => setF({ ...f, online: false, place: f.place === "Board Game Arena" ? "Local ALADJ — Gouville-sur-Mer" : f.place })}
          style={{ flex: 1, padding: "11px", borderRadius: 12, border: `2px solid ${!f.online ? C.teal : "#e6dcc9"}`, background: !f.online ? "rgba(30,138,138,.08)" : "#fff", color: C.navy, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <MapPin size={16} /> En présentiel
        </button>
        <button type="button" onClick={() => setF({ ...f, online: true, place: "Board Game Arena", placeId: null })}
          style={{ flex: 1, padding: "11px", borderRadius: 12, border: `2px solid ${f.online ? C.purple : "#e6dcc9"}`, background: f.online ? "rgba(107,58,122,.08)" : "#fff", color: C.navy, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <Globe size={16} /> En ligne (BGA)
        </button>
      </div>
      {f.online ? (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", borderRadius: 12, background: "rgba(107,58,122,.08)", color: C.navy, fontSize: 13.5, lineHeight: 1.45, marginBottom: 14 }}>
          <Globe size={18} color={C.purple} style={{ flexShrink: 0 }} /> Sur <b>&nbsp;Board Game Arena&nbsp;</b> — rendez-vous sur la conversation Signal «&nbsp;Jeux en ligne&nbsp;» à l'heure indiquée.
        </div>
      ) : (
        <PlaceSelector value={f.place} placeId={f.placeId} onChange={({ place, placeId }) => setF({ ...f, place, placeId })} />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Joueurs min."><TextInput type="number" min={1} value={f.min} onChange={(ev) => setF({ ...f, min: ev.target.value })} /></Field>
        <Field label="Joueurs max." hint="Vide = illimité"><TextInput type="number" min={1} value={f.max} onChange={(ev) => setF({ ...f, max: ev.target.value })} placeholder="illimité" /></Field>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(232,163,23,.1)", marginBottom: f.useDeadline ? 12 : 14, cursor: "pointer" }}>
        <input type="checkbox" checked={f.useDeadline} onChange={(ev) => setF({ ...f, useDeadline: ev.target.checked })} style={{ width: 18, height: 18, accentColor: C.amber }} />
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>Date limite de validation</span>
      </label>
      {f.useDeadline && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Valable jusqu'au"><TextInput type="date" value={f.deadlineDate} onChange={(ev) => setF({ ...f, deadlineDate: ev.target.value })} /></Field>
          <Field label="à"><TextInput type="time" value={f.deadlineTime} onChange={(ev) => setF({ ...f, deadlineTime: ev.target.value })} /></Field>
        </div>
      )}
      <Field label="Note"><textarea value={f.notes} onChange={(ev) => setF({ ...f, notes: ev.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></Field>
      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" onClick={submit} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Check size={18} /> Enregistrer les modifications</>}</Btn>
    </Modal>
  );
}

/* ---- Modale : partager le moment jeux sur Signal (message prêt à copier) ---- */
function ShareEventModal({ event, onClose }) {
  const [copied, setCopied] = useState(false);
  const orga = SIGNAL_GROUPS.find((g) => g.name === "Organisation jeux");
  const siteUrl = "https://aladj-site.vercel.app";

  const deadlineTxt = event.deadline
    ? `\n⏳ À valider avant le ${formatDateFr(new Date(event.deadline).toISOString().slice(0,10))} à ${new Date(event.deadline).toTimeString().slice(0,5)}`
    : "";
  const message =
`🎲 Nouveau moment jeux !

📅 ${formatDateFr(event.date)} à ${event.time}
📍 ${event.place}
👥 ${event.min} à ${event.max} joueurs${deadlineTxt}${event.notes ? `\n📝 ${event.notes}` : ""}

➡️ Inscriptions et détails : ${siteUrl}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // repli : sélection manuelle
      setCopied(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Partager ce moment jeux" width={520}>
      <p style={{ fontSize: 14, color: "#6e6256", margin: "0 0 16px", lineHeight: 1.5 }}>
        Votre moment jeux est créé ! Copiez ce message et collez-le dans le groupe Signal « Organisation jeux » pour prévenir les membres.
      </p>
      <div style={{ background: "rgba(26,58,92,.04)", border: "1px solid #ece2d0", borderRadius: 13, padding: 16, fontSize: 13.5, color: "#3a3a3a", whiteSpace: "pre-line", lineHeight: 1.5, marginBottom: 16, fontFamily: "'Nunito',sans-serif" }}>
        {message}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Btn variant={copied ? "teal" : "primary"} size="lg" onClick={copy} style={{ flex: 1 }}>
          {copied ? <><Check size={17} /> Copié !</> : <><PenLine size={17} /> Copier le message</>}
        </Btn>
        {orga && (
          <a href={orga.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", flex: 1 }}>
            <Btn variant="soft" size="lg" full><ExternalLink size={17} /> Ouvrir Signal</Btn>
          </a>
        )}
      </div>
      <button onClick={onClose} style={{ width: "100%", marginTop: 12, background: "none", border: "none", color: "#9c8d79", cursor: "pointer", fontSize: 13.5, fontFamily: "'Nunito',sans-serif" }}>
        Plus tard
      </button>
    </Modal>
  );
}

/* ---- Modale : infos d'accès d'un lieu (+ édition par le créateur/admin) ---- */
function PlaceInfoModal({ place, onClose, startEditing = false }) {
  const { currentUser, updatePlace } = useApp();
  const canEdit = currentUser && (currentUser.id === place.createdBy || currentUser.admin);
  const [editing, setEditing] = useState(startEditing && canEdit);
  const [f, setF] = useState({ name: place.name, address: place.address, accessInfo: place.accessInfo });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true); await updatePlace(place.id, f); setBusy(false); setEditing(false);
  };

  return (
    <Modal open onClose={onClose} title={editing ? "Modifier le lieu" : place.name} width={480}>
      {editing ? (
        <div>
          <Field label="Nom du lieu"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Adresse exacte"><TextInput value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
          <Field label="Accès & stationnement"><textarea value={f.accessInfo} onChange={(e) => setF({ ...f, accessInfo: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="teal" onClick={save} disabled={busy}>{busy ? <Loader2 size={16} className="aladj-spin" /> : <><Check size={16} /> Enregistrer</>}</Btn>
            <Btn variant="soft" onClick={() => setEditing(false)}>Annuler</Btn>
          </div>
        </div>
      ) : (
        <div>
          {place.address && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5, marginBottom: 3 }}><MapPin size={14} style={{ verticalAlign: "-2px" }} /> Adresse</div>
              <div style={{ fontSize: 14.5, color: "#5e5346", lineHeight: 1.5 }}>{place.address}</div>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5, marginBottom: 3 }}>🅿️ Accès & stationnement</div>
            <div style={{ fontSize: 14.5, color: "#5e5346", lineHeight: 1.5, whiteSpace: "pre-line" }}>{place.accessInfo || "Pas d'information d'accès pour ce lieu."}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0e8d8", paddingTop: 14, marginTop: 4 }}>
            <span style={{ fontSize: 12.5, color: "#9c8d79" }}>Lieu créé par {place.createdByName}</span>
            {canEdit && <Btn size="sm" variant="soft" onClick={() => setEditing(true)}><Edit3 size={14} /> Modifier</Btn>}
          </div>
        </div>
      )}
    </Modal>
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
  const [imgError, setImgError] = useState(false);
  // placeholder coloré (utilisé si pas d'image OU si l'image ne charge pas)
  const palette = [C.teal, C.amber, C.red, C.purple, C.navy];
  const col = palette[(g.name.charCodeAt(0) + (g.name.length || 0)) % palette.length];

  if (g.img && !imgError) {
    return (
      <div style={{ height: h, position: "relative", borderRadius: size === "sm" ? 10 : 0, overflow: "hidden", background: "#11202f" }}>
        <img src={g.img} alt={g.name} onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  return (
    <div style={{ height: h, background: `linear-gradient(135deg, ${col}, ${col}cc)`, display: "grid", placeItems: "center", borderRadius: size === "sm" ? 10 : 0, position: "relative", overflow: "hidden" }}>
      <Dice color="rgba(255,255,255,.25)" n={(g.name.length % 6) + 1} style={{ position: "absolute", width: h * 0.55, right: -h * 0.1, bottom: -h * 0.12, transform: "rotate(12deg)" }} />
      <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: size === "sm" ? 18 : 34, textAlign: "center", padding: 8, lineHeight: 1, textShadow: "0 2px 8px rgba(0,0,0,.25)", zIndex: 1 }}>
        {g.name.split(" ").slice(0, 3).map((w) => w[0]).join("").toUpperCase().slice(0, 3)}
      </span>
    </div>
  );
}

function GameCard({ g, onOpen, myGame, globalShare, onToggleShare, showBoth, ownerBadge = null }) {
  const { currentUser } = useApp();
  const { avg, count } = gameStats(g);
  const isShared = g.shared !== false;
  const myRating = currentUser ? (g.ratings?.[currentUser.id] || 0) : 0;
  const iVoted = myRating > 0;

  // Badge : dans "ma ludothèque" → ma note ; dans la générale → moyenne (couleur selon si j'ai voté)
  let badgeBg, badgeContent;
  if (myGame) {
    badgeBg = iVoted ? "rgba(232,163,23,.95)" : "rgba(18,41,63,.6)";
    badgeContent = iVoted
      ? <><Star size={13} fill="#fff" color="#fff" /> {String(myRating).replace(".", ",")}</>
      : <span style={{ fontSize: 11.5 }}>À noter</span>;
  } else {
    // ludothèque générale : moyenne ; turquoise si j'ai voté, foncé sinon
    badgeBg = iVoted ? "rgba(30,138,138,.95)" : "rgba(18,41,63,.85)";
    badgeContent = <><Star size={13} fill={C.amber} color={C.amber} /> {count ? avg.toFixed(2).replace(".", ",") : "—"}</>;
  }

  // Mode "deux notes" : on affiche la moyenne (ambre) en haut à droite,
  // et juste en dessous la note personnelle (turquoise) si l'utilisateur est connecté.
  const bothNotes = showBoth && currentUser;

  return (
    <div style={{ position: "relative" }}>
      <button onClick={onOpen} style={{ width: "100%", textAlign: "left", cursor: "pointer", border: "1px solid #ece2d0", borderRadius: 18, overflow: "hidden", padding: 0, background: C.paper, boxShadow: "0 4px 16px rgba(18,41,63,.05)", transition: "transform .15s, box-shadow .2s" }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(18,41,63,.12)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(18,41,63,.05)"; }}>
        <div style={{ position: "relative" }}>
          <GameCover g={g} />
          {(g.wantIds || []).length > 0 && (
            <div title={`${g.wantIds.length} membre${g.wantIds.length > 1 ? "s veulent" : " veut"} découvrir ce jeu`}
              style={{ position: "absolute", top: 10, left: 10, background: C.red, color: "#fff", borderRadius: 999, padding: "4px 9px 4px 7px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 6px rgba(0,0,0,.18)" }}>
              <Heart size={13} fill="#fff" color="#fff" /> {g.wantIds.length}
            </div>
          )}
          {ownerBadge && (
            <div title={`Appartient à ${ownerBadge}`}
              style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(107,58,122,.92)", color: "#fff", borderRadius: 999, padding: "3px 10px 3px 8px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 4, boxShadow: "0 2px 6px rgba(0,0,0,.2)" }}>
              <Users size={12} color="#fff" /> {ownerBadge}
            </div>
          )}
          {bothNotes ? (
            // Deux badges empilés : moyenne (ambre) puis ma note (turquoise)
            <div style={{ position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
              <div title="Note moyenne de l'association" style={{ background: "rgba(232,163,23,.95)", color: "#fff", borderRadius: 999, padding: "4px 10px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={13} fill="#fff" color="#fff" /> {count ? avg.toFixed(2).replace(".", ",") : "—"}
              </div>
              <div title={iVoted ? "Votre note" : "Vous n'avez pas encore noté ce jeu"} style={{ background: iVoted ? "rgba(30,138,138,.95)" : "rgba(18,41,63,.6)", color: "#fff", borderRadius: 999, padding: "4px 10px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12.5, display: "flex", alignItems: "center", gap: 4 }}>
                {iVoted ? <><Heart size={11} fill="#fff" color="#fff" /> {String(myRating).replace(".", ",")}</> : <span style={{ fontSize: 11 }}>non noté</span>}
              </div>
            </div>
          ) : (
            <div title={myGame ? (iVoted ? "Votre note" : "Vous n'avez pas encore noté ce jeu") : (iVoted ? "Moyenne — vous avez voté" : "Moyenne — vous n'avez pas encore voté")}
              style={{ position: "absolute", top: 10, right: 10, background: badgeBg, color: "#fff", borderRadius: 999, padding: "4px 10px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
              {badgeContent}
            </div>
          )}
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
            <span style={{ fontSize: 12, color: "#9c8d79" }}>chez {(() => {
              // Affichage : possesseurs confirmés en priorité, puis pendings avec mention "X selon Y"
              const confirmed = (g.confirmedOwners || g.owners || []).map((o) => ({ name: o.name }));
              const pending = (g.pendingOwners || []).map((o) => ({ name: o.name, declaredByName: o.declaredByName }));
              const all = [...confirmed, ...pending];
              if (all.length === 0 && g.ownerName) all.push({ name: g.ownerName });
              const shown = all.slice(0, 2).map((o) => o.declaredByName ? `${o.name} selon ${o.declaredByName}` : o.name).join(", ");
              const extra = all.length - 2;
              return <><b style={{ color: C.teal }}>{shown || "—"}</b>{extra > 0 ? ` +${extra}` : ""}</>;
            })()}</span>
            <span style={{ fontSize: 11.5, color: "#8a7c6a", fontWeight: 700, fontFamily: "'Fredoka',sans-serif" }}>{count} vote{count > 1 ? "s" : ""}</span>
          </div>
        </div>
      </button>
      {/* Badge de partage (uniquement sur mes propres jeux) — placé en bas à gauche
          pour ne pas masquer le badge cœur des envies de découverte (en haut à gauche). */}
      {myGame && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleShare(!isShared); }}
          title={!globalShare ? "Votre ludothèque est privée (réglage global)" : isShared ? "Partagé dans la ludothèque commune — cliquez pour rendre privé" : "Privé — cliquez pour partager"}
          disabled={!globalShare}
          style={{
            position: "absolute", top: 130, left: 10, border: "none", borderRadius: 999, padding: "5px 11px", fontSize: 11.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 700,
            cursor: globalShare ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 5,
            background: !globalShare ? "rgba(120,110,95,.85)" : isShared ? "rgba(30,138,138,.92)" : "rgba(120,110,95,.85)", color: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,.15)",
          }}>
          {!globalShare ? <><EyeOff size={12} /> Privé</> : isShared ? <><Check size={12} /> Partagé</> : <><EyeOff size={12} /> Privé</>}
        </button>
      )}
    </div>
  );
}

function fmtDuration(s) {
  if (s == null) return "—";
  const m = Math.round(s / 60);
  if (m < 1) return "< 1 min";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), mm = m % 60;
  return mm ? `${h} h ${String(mm).padStart(2, "0")}` : `${h} h`;
}

function SessionsModal({ sessions, gameName, canDelete, onClose, onDeleted }) {
  const [busyId, setBusyId] = useState(null);
  const del = async (id) => {
    if (!window.confirm("Écarter cette partie des statistiques ? Action définitive.")) return;
    setBusyId(id);
    const { error } = await supabase.rpc("delete_session", { p_session_id: id });
    setBusyId(null);
    if (error) { alert(error.message); return; }
    onDeleted && onDeleted();
  };
  return (
    <Modal open onClose={onClose} title={`Parties — ${gameName}`}>
      {!sessions || sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: 20, color: "#9c8d79" }}>Aucune partie chronométrée pour l'instant.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {sessions.map((r) => (
            <div key={r.session_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: C.paper, border: "1px solid #ece2d0", borderRadius: 12, padding: "11px 14px" }}>
              <div>
                <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15 }}>{fmtDuration(r.real_duration_seconds)} <span style={{ fontWeight: 400, color: "#8a7c6a", fontSize: 13 }}>· {r.player_count} joueur{r.player_count > 1 ? "s" : ""}</span></div>
                <div style={{ fontSize: 12.5, color: "#8a7c6a" }}>{formatDateFr(new Date(r.started_at).toISOString().slice(0, 10))}</div>
              </div>
              {canDelete && (
                <button onClick={() => del(r.session_id)} disabled={busyId === r.session_id}
                  style={{ background: "rgba(181,40,58,.1)", border: "none", borderRadius: 9, padding: "7px 9px", cursor: "pointer", color: C.red, display: "grid", placeItems: "center" }} title="Écarter cette partie">
                  {busyId === r.session_id ? <Loader2 size={15} className="aladj-spin" /> : <Trash2 size={15} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {canDelete && sessions && sessions.length > 0 && (
        <p style={{ fontSize: 12.5, color: "#9c8d79", marginTop: 14, marginBottom: 0 }}>Écartez les parties non représentatives (chrono oublié, partie interrompue…) pour affiner les moyennes.</p>
      )}
    </Modal>
  );
}

function GameDetailModal({ g, onClose, onAuth, setToast }) {
  const { currentUser, rateGame, clearRating, removeGame, updateGame, users, addOwner, removeOwner, declareOwners, toggleDiscover, openChrono } = useApp();
  const { avg, count } = gameStats(g);
  const myRating = currentUser ? (g.ratings?.[currentUser.id] || 0) : 0;
  const confirmedOwners = g.confirmedOwners && g.confirmedOwners.length ? g.confirmedOwners : (g.owners && g.owners.length ? g.owners : (g.ownerId ? [{ id: g.ownerId, name: g.ownerName, confirmed: true }] : []));
  const pendingOwners = g.pendingOwners || [];
  const owners = confirmedOwners;
  const isOwner = currentUser && confirmedOwners.some((o) => o.id === currentUser.id);
  const canManage = currentUser && (isOwner || currentUser.admin);
  const [editing, setEditing] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState(null);
  const [myAvg, setMyAvg] = useState(null);
  const [allAvg, setAllAvg] = useState(null);
  const [setupAvg, setSetupAvg] = useState(null);
  const [teardownAvg, setTeardownAvg] = useState(null);
  const [declaring, setDeclaring] = useState(false);
  const [selDeclare, setSelDeclare] = useState([]);
  const [declBusy, setDeclBusy] = useState(false);
  const ownerIdSet = new Set([...confirmedOwners.map((o) => o.id), ...pendingOwners.map((o) => o.id)]);
  const declarableUsers = (users || []).filter((u) => !u.banned && u.id !== currentUser?.id && !ownerIdSet.has(u.id));

  // La description n'est pas chargée dans le listing (pour alléger l'Egress) :
  // on la récupère à la demande, uniquement quand la fiche est ouverte.
  const [desc, setDesc] = useState(g.desc || "");
  useEffect(() => {
    let cancelled = false;
    // Si la description n'est pas déjà connue, on la charge pour ce seul jeu.
    if (!g.desc && g.id) {
      supabase.from("games").select("description").eq("id", g.id).single()
        .then(({ data }) => { if (!cancelled && data) setDesc(data.description || ""); });
    }
    return () => { cancelled = true; };
  }, [g.id, g.desc]);

  // Statistiques de durée des parties chronométrées (chargées à l'ouverture de la fiche).
  const loadStats = useCallback(async () => {
    const { data: ss } = await supabase.from("v_game_sessions").select("session_id,started_at,real_duration_seconds,player_count").eq("game_id", g.id).order("started_at", { ascending: false });
    setSessions(ss || []);
    const { data: all } = await supabase.from("v_game_avg_player_time").select("avg_player_seconds").eq("game_id", g.id).maybeSingle();
    setAllAvg(all?.avg_player_seconds ?? null);
    const { data: ph } = await supabase.from("v_game_phase_time").select("avg_setup_seconds,avg_teardown_seconds").eq("game_id", g.id).maybeSingle();
    setSetupAvg(ph?.avg_setup_seconds ?? null);
    setTeardownAvg(ph?.avg_teardown_seconds ?? null);
    if (currentUser) {
      const { data: m } = await supabase.from("v_game_player_time").select("avg_player_seconds").eq("game_id", g.id).eq("profile_id", currentUser.id).maybeSingle();
      setMyAvg(m?.avg_player_seconds ?? null);
    }
  }, [g.id, currentUser]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // Durée moyenne ventilée par nombre de joueurs (calculée à partir des parties).
  const byCount = useMemo(() => {
    if (!sessions || !sessions.length) return [];
    const map = {};
    sessions.forEach((s) => {
      const k = s.player_count || 0;
      if (!map[k]) map[k] = { player_count: k, sum: 0, count: 0 };
      map[k].sum += s.real_duration_seconds; map[k].count += 1;
    });
    return Object.values(map).map((m) => ({ player_count: m.player_count, avg: Math.round(m.sum / m.count), count: m.count })).sort((a, b) => a.player_count - b.player_count);
  }, [sessions]);

  // Envies de découvrir : qui les a, est-ce que c'est moi ?
  const wantIds = g.wantIds || [];
  const wanters = wantIds.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  const iWant = currentUser && wantIds.includes(currentUser.id);
  const iCanWant = currentUser && myRating === 0; // ça n'a pas de sens d'avoir envie de découvrir un jeu qu'on a déjà noté (donc joué) ; mais on peut vouloir découvrir un jeu qu'on possède sans y avoir encore joué

  // distribution des notes (les demi-notes sont regroupées avec l'entier supérieur : 4,5 → ligne 5)
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: Object.values(g.ratings || {}).filter((v) => Math.ceil(v) === n).length }));

  return (
    <Modal open onClose={onClose} title={g.name} width={620}>
      <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 18 }}><GameCover g={g} size="lg" /></div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        {g.year && <Badge color={C.navy}>{g.year}</Badge>}
        {g.min && <Badge color={C.teal}><Users size={12} /> {g.min}{g.max && g.max !== g.min ? `–${g.max}` : ""} joueurs</Badge>}
        {g.time && <Badge color={C.amber}><Clock size={12} /> {g.time} min</Badge>}
        {g.source && g.source !== "manuel" && <Badge color={C.purple}><Globe size={12} /> {g.source}</Badge>}
        {(g.playCount || 0) > 0 && <Badge color="#6e6256">🎲 joué {g.playCount} fois</Badge>}
      </div>

      <a href={ludumLink(g.name, g.ludumUrl)} target="_blank" rel="noopener noreferrer sponsored"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, width: "100%", boxSizing: "border-box", background: C.amber, color: "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 15, padding: "13px 20px", borderRadius: 13, textDecoration: "none", marginBottom: 12 }}>
        <ShoppingBag size={17} /> Acheter chez Ludum
      </a>
      {currentUser && (
        <Btn full variant="teal" style={{ marginBottom: 18 }} onClick={() => { onClose(); openChrono({ gameId: g.id }); }}>
          <Clock size={17} /> Chronométrer une partie
        </Btn>
      )}

      {/* note moyenne */}
      <div style={{ display: "flex", gap: 20, alignItems: "center", background: "rgba(232,163,23,.08)", borderRadius: 16, padding: "16px 20px", marginBottom: 18, flexWrap: "wrap" }}>
        <button type="button" onClick={() => count > 0 && setShowVoters(true)} style={{ textAlign: "center", background: "none", border: "none", cursor: count > 0 ? "pointer" : "default", padding: 0 }} title={count > 0 ? "Voir qui a voté" : ""}>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 42, color: C.amber, lineHeight: 1 }}>{count ? avg.toFixed(2).replace(".", ",") : "—"}</div>
          <Stars value={Math.round(avg * 2) / 2} readOnly size={15} />
          <div style={{ fontSize: 12, color: count > 0 ? C.teal : "#9c8d79", marginTop: 3, textDecoration: count > 0 ? "underline" : "none", textUnderlineOffset: 2 }}>{count} avis</div>
        </button>
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

      {/* durée moyenne des parties chronométrées, par nombre de joueurs */}
      {sessions && sessions.length > 0 && (
        <div style={{ background: "rgba(30,138,138,.08)", borderRadius: 16, padding: "16px 20px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
            <Clock size={24} color={C.teal} style={{ flexShrink: 0 }} />
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 18, color: C.navy }}>Durée moyenne d'une partie</div>
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            {byCount.map((b) => (
              <div key={b.player_count} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 14.5 }}>
                <span style={{ color: "#6b5d49" }}>{b.player_count} joueur{b.player_count > 1 ? "s" : ""}</span>
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy }}>{fmtDuration(b.avg)} <span style={{ fontWeight: 400, color: "#9c8d79", fontSize: 12 }}>· {b.count} partie{b.count > 1 ? "s" : ""}</span></span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowSessions(true)} style={{ background: "none", border: "none", color: C.teal, fontSize: 12.5, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer", padding: "10px 0 0", fontFamily: "'Nunito',sans-serif" }}>Voir le détail des {sessions.length} partie{sessions.length > 1 ? "s" : ""}</button>
          {(allAvg != null || myAvg != null || setupAvg != null || teardownAvg != null) && (
            <div style={{ borderTop: "1px solid rgba(30,138,138,.18)", marginTop: 12, paddingTop: 11, display: "grid", gap: 5, fontSize: 13.5 }}>
              {allAvg != null && <div style={{ color: "#6b5d49" }}>Temps de jeu moyen par joueur : <b style={{ color: C.navy }}>{fmtDuration(allAvg)}</b></div>}
              {myAvg != null && <div style={{ color: "#6b5d49" }}>Ton temps de jeu moyen : <b style={{ color: C.teal }}>{fmtDuration(myAvg)}</b></div>}
              {setupAvg != null && <div style={{ color: "#6b5d49" }}>Temps de mise en place moyen : <b style={{ color: C.amber }}>{fmtDuration(setupAvg)}</b></div>}
              {teardownAvg != null && <div style={{ color: "#6b5d49" }}>Temps de rangement moyen : <b style={{ color: C.purple }}>{fmtDuration(teardownAvg)}</b></div>}
            </div>
          )}
        </div>
      )}

      {/* ma note */}
      <div style={{ background: C.paper, border: "2px solid #ece2d0", borderRadius: 16, padding: "14px 18px", marginBottom: 18 }}>
        {currentUser ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy }}>Votre note {myRating ? `: ${String(myRating).replace(".", ",")}/5` : ""}</span>
            <Stars value={myRating} size={26}
              onRate={async (v) => { await rateGame(g.id, v); setToast(v === myRating ? "Note retirée" : `Noté ${String(v).replace(".", ",")}/5 !`); }}
              onClear={async () => { await clearRating(g.id); setToast("Note effacée"); }} />
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
      <p style={{ color: "#5e5346", fontSize: 14.5, lineHeight: 1.6, margin: "0 0 18px", whiteSpace: "pre-line" }}>{desc || "Pas encore de description pour ce jeu."}</p>

      {(g.mechanics || []).length > 0 && (
        <>
          <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: "0 0 8px" }}>Mécaniques</h4>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
            {g.mechanics.map((m, i) => <Badge key={i} color={C.purple}>{m}</Badge>)}
          </div>
        </>
      )}

      <div style={{ borderTop: "1px solid #f0e8d8", paddingTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <span style={{ fontSize: 13, color: "#8a7c6a", display: "block", marginBottom: 4 }}>{owners.length > 1 ? "Possédé par" : "Apporté par"}</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {owners.map((o) => (
                <span key={o.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: o.id === currentUser?.id ? "rgba(30,138,138,.12)" : "rgba(26,58,92,.05)", borderRadius: 999, padding: "4px 11px", fontSize: 13, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: o.id === currentUser?.id ? C.teal : C.navy }}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: o.id === currentUser?.id ? C.teal : C.navy, color: "#fff", display: "grid", placeItems: "center", fontSize: 11 }}>{o.name[0].toUpperCase()}</span>
                  {o.name}{o.id === currentUser?.id ? " (vous)" : ""}
                </span>
              ))}
            </div>
          </div>
          {canManage && (
            <div style={{ display: "flex", gap: 8 }}>
              <Btn size="sm" variant="soft" onClick={() => setEditing(true)}><Edit3 size={14} /> Modifier</Btn>
            </div>
          )}
        </div>

        {/* rattachement : je l'ai aussi / je ne l'ai plus */}
        {currentUser && (
          <div style={{ marginTop: 14 }}>
            {isOwner ? (
              <Btn size="sm" variant="danger" onClick={async () => {
                const last = owners.length === 1;
                await removeOwner(g.id);
                if (last) { onClose(); setToast("Jeu retiré de la ludothèque."); }
                else setToast("Vous ne possédez plus ce jeu.");
              }}><X size={14} /> Je ne l'ai plus</Btn>
            ) : (
              <Btn size="sm" variant="teal" onClick={async () => { await addOwner(g.id); setToast("Ajouté à votre ludothèque !"); }}><Plus size={14} /> Je l'ai aussi</Btn>
            )}
            {currentUser.admin && owners.length > 0 && (
              <Btn size="sm" variant="soft" style={{ marginLeft: 8 }} onClick={async () => { await removeGame(g.id); onClose(); setToast("Fiche supprimée (admin)."); }}><Trash2 size={14} /> Supprimer la fiche</Btn>
            )}
          </div>
        )}

        {/* Déclarer qu'un autre membre possède aussi ce jeu (validation de sa part) */}
        {canManage && (
          <div style={{ marginTop: 14 }}>
            {!declaring ? (
              <Btn size="sm" variant="soft" onClick={() => setDeclaring(true)}><UserPlus size={14} /> Déclarer un autre propriétaire</Btn>
            ) : (
              <div style={{ padding: "12px 14px", background: "rgba(232,163,23,.08)", borderRadius: 11 }}>
                <span style={{ display: "block", fontSize: 12.5, color: "#6e6256", marginBottom: 8 }}>Quels membres possèdent aussi ce jeu ? Ils recevront une demande de confirmation.</span>
                {declarableUsers.length === 0 ? (
                  <span style={{ fontSize: 12.5, color: "#9c8d79" }}>Tous les membres sont déjà rattachés à ce jeu.</span>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {declarableUsers.map((u) => {
                      const on = selDeclare.includes(u.id);
                      return (
                        <button key={u.id} type="button" onClick={() => setSelDeclare((arr) => on ? arr.filter((x) => x !== u.id) : [...arr, u.id])}
                          style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${on ? C.amber : "#e6dcc9"}`, background: on ? C.amber : "#fff", color: on ? "#fff" : "#8a7c6a" }}>
                          {on && <Check size={12} style={{ verticalAlign: "-1px", marginRight: 3 }} />}{u.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn size="sm" variant="teal" disabled={selDeclare.length === 0 || declBusy} onClick={async () => {
                    setDeclBusy(true);
                    const res = await declareOwners(g.id, selDeclare);
                    setDeclBusy(false);
                    if (res?.error) { setToast(res.error); }
                    else { setToast("Demande de confirmation envoyée."); setDeclaring(false); setSelDeclare([]); }
                  }}>{declBusy ? <Loader2 size={14} className="aladj-spin" /> : <><Check size={14} /> Envoyer la demande</>}</Btn>
                  <Btn size="sm" variant="soft" onClick={() => { setDeclaring(false); setSelDeclare([]); }}>Annuler</Btn>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Possessions en attente de confirmation (déclarées par d'autres membres) */}
        {pendingOwners.length > 0 && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(232,163,23,.08)", borderRadius: 11, border: "1px dashed rgba(232,163,23,.4)" }}>
            <span style={{ fontSize: 12, color: "#9c8d79", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>Possessions à confirmer</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {pendingOwners.map((o) => (
                <span key={o.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", borderRadius: 999, padding: "4px 11px", fontSize: 13, color: "#5e5346", border: "1px solid #ece2d0" }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, background: "#cdbfa8", color: "#fff", display: "grid", placeItems: "center", fontSize: 10 }}>{o.name[0].toUpperCase()}</span>
                  <b>{o.name}</b> selon <i>{o.declaredByName}</i>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section : envie de découvrir */}
      <div style={{ borderTop: "1px solid #f0e8d8", marginTop: 18, paddingTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
          <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <Heart size={16} fill={wantIds.length ? C.red : "none"} color={C.red} /> Envie de découvrir ({wantIds.length})
          </h4>
          {currentUser && iCanWant && (
            iWant
              ? <Btn size="sm" variant="soft" onClick={async () => { await toggleDiscover(g.id); setToast("Envie retirée."); }}><X size={13} /> Je n'ai plus envie</Btn>
              : <Btn size="sm" variant="amber" onClick={async () => { await toggleDiscover(g.id); setToast("Vous avez envie de découvrir ce jeu !"); }}><Heart size={13} /> J'ai envie de le découvrir</Btn>
          )}
        </div>
        {!currentUser && <p style={{ fontSize: 13, color: "#a89a86", margin: "0 0 8px" }}><a href="#" onClick={(e) => { e.preventDefault(); onAuth("login"); }} style={{ color: C.teal }}>Connectez-vous</a> pour ajouter ce jeu à votre envie de découverte.</p>}
        {currentUser && myRating > 0 && <p style={{ fontSize: 12.5, color: "#a89a86", margin: "0 0 8px" }}>Vous avez noté ce jeu, vous l'avez donc joué — votre envie de découverte n'a plus lieu d'être.</p>}
        {wanters.length === 0 ? (
          <p style={{ fontSize: 13, color: "#a89a86", margin: 0 }}>Personne n'a encore exprimé l'envie de le découvrir.</p>
        ) : (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {wanters.map((u) => (
              <span key={u.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(181,40,58,.08)", color: C.red, borderRadius: 999, padding: "4px 11px", fontSize: 12.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
                <Heart size={11} fill={C.red} color={C.red} /> {u.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* section location */}
      <GameRentalSection g={g} onClose={onClose} setToast={setToast} isOwner={isOwner} />

      {/* extensions du jeu */}
      <GameExtensions g={g} onAuth={onAuth} onClose={onClose} setToast={setToast} />

      {/* commentaires sur le jeu */}
      <GameComments g={g} onAuth={onAuth} onClose={onClose} />

      {editing && <EditGameModal g={{ ...g, desc }} onClose={() => setEditing(false)} onSave={async (patch) => { await updateGame(g.id, patch); setEditing(false); setToast("Jeu mis à jour."); }} />}
      {showVoters && <VotersModal g={g} onClose={() => setShowVoters(false)} />}
      {showSessions && <SessionsModal sessions={sessions} gameName={g.name} canDelete={!!currentUser?.admin} onClose={() => setShowSessions(false)} onDeleted={loadStats} />}
    </Modal>
  );
}

/* ---- Modale : liste des membres ayant noté un jeu et leur note ---- */
function VotersModal({ g, onClose }) {
  const { users } = useApp();
  const { avg, count } = gameStats(g);
  const voters = Object.entries(g.ratings || {})
    .map(([uid, val]) => ({ name: (users.find((u) => u.id === uid) || {}).name || "Membre", val }))
    .sort((a, b) => b.val - a.val);
  return (
    <Modal open onClose={onClose} title={`Avis sur ${g.name}`} width={420}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 32, color: C.amber }}>{count ? avg.toFixed(2).replace(".", ",") : "—"}</span>
        <span style={{ fontSize: 14, color: "#9c8d79" }}> / 5 · {count} avis</span>
      </div>
      <div style={{ display: "grid", gap: 8, maxHeight: "55vh", overflowY: "auto" }}>
        {voters.length === 0 && <span style={{ color: "#a89a86", fontSize: 13.5, textAlign: "center" }}>Personne n'a encore noté ce jeu.</span>}
        {voters.map((v, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(26,58,92,.04)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: C.teal, color: "#fff", display: "grid", placeItems: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14 }}>{v.name[0].toUpperCase()}</span>
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14.5 }}>{v.name}</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Stars value={v.val} readOnly size={14} />
              <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.amber, fontSize: 14, minWidth: 28, textAlign: "right" }}>{String(v.val).replace(".", ",")}</span>
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ---- Section location d'une fiche de jeu ---- */
function GameRentalSection({ g, onClose, setToast, isOwner }) {
  const { currentUser, myWeights, setGameWeight, loans } = useApp();
  const [showLoan, setShowLoan] = useState(false);
  const [editWeight, setEditWeight] = useState(false);
  const [w, setW] = useState(myWeights[g.id] != null ? String(myWeights[g.id]) : "");
  const price = rentalPrice(g.newPrice);
  const myWeight = myWeights[g.id];
  // ce jeu est-il actuellement prêté par moi ?
  const myActiveLoan = (loans || []).find((l) => l.gameId === g.id && l.lenderId === currentUser?.id && !l.returned);

  return (
    <div style={{ borderTop: "1px solid #f0e8d8", marginTop: 18, paddingTop: 18 }}>
      <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 7 }}>
        <Euro size={17} color={C.teal} /> Location
      </h4>

      {price != null ? (
        <div style={{ background: "rgba(30,138,138,.07)", borderRadius: 12, padding: "12px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 14, color: "#5e5346" }}>Tarif de location <span style={{ fontSize: 12, color: "#9c8d79" }}>(2 semaines)</span></span>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 20 }}>{fmtEuro(price)}</span>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#9c8d79", margin: "0 0 12px" }}>Le tarif de location s'affichera une fois le prix neuf renseigné (modifiez la fiche).</p>
      )}

      {/* outils du propriétaire : poids + prêter */}
      {isOwner && (
        <div style={{ display: "grid", gap: 10 }}>
          {/* mon poids pour ce jeu (privé) */}
          <div style={{ background: "rgba(26,58,92,.04)", borderRadius: 12, padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13.5, color: "#5e5346", display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={13} color="#9c8d79" /> Poids de mon exemplaire {myWeight != null ? <b>: {String(myWeight).replace(".", ",")} g</b> : <span style={{ color: "#9c8d79" }}>: non renseigné</span>}
              </span>
              {!editWeight && <button onClick={() => { setW(myWeight != null ? String(myWeight) : ""); setEditWeight(true); }} style={{ background: "none", border: "none", color: C.teal, cursor: "pointer", fontSize: 13, fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>Modifier</button>}
            </div>
            {editWeight && (
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                <input type="number" step="0.1" value={w} onChange={(e) => setW(e.target.value)} placeholder="ex. 1250,5" style={{ ...inputStyle, flex: 1 }} />
                <span style={{ fontSize: 13, color: "#9c8d79" }}>g</span>
                <Btn size="sm" variant="teal" onClick={async () => { await setGameWeight(g.id, w); setEditWeight(false); setToast("Poids enregistré."); }}>OK</Btn>
                <Btn size="sm" variant="soft" onClick={() => setEditWeight(false)}>Annuler</Btn>
              </div>
            )}
            <p style={{ fontSize: 11.5, color: "#9c8d79", margin: "6px 0 0" }}>Visible de vous seul. Sert à vérifier qu'aucune pièce ne manque au retour (inserts, sleeves... le poids vous est propre).</p>
          </div>

          {/* prêter ce jeu */}
          {myActiveLoan ? (
            <div style={{ background: "rgba(232,163,23,.1)", borderRadius: 12, padding: "10px 14px", fontSize: 13.5, color: "#5e5346" }}>
              Vous prêtez actuellement ce jeu à <b>{myActiveLoan.borrowerName}</b>. Gérez-le dans « Mes locations ».
            </div>
          ) : (
            <Btn variant="teal" onClick={() => setShowLoan(true)}><ArrowRightLeft size={16} /> Prêter ce jeu</Btn>
          )}
        </div>
      )}

      {showLoan && <LoanModal g={g} onClose={() => setShowLoan(false)} setToast={setToast} defaultWeight={myWeight} />}
    </div>
  );
}

/* ---- Modale : enregistrer un prêt ---- */
function LoanModal({ g, onClose, setToast, defaultWeight }) {
  const { users, currentUser, createLoan } = useApp();
  const [borrowerId, setBorrowerId] = useState("");
  const [weight, setWeight] = useState(defaultWeight != null ? String(defaultWeight) : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // date de retour = dans 14 jours
  const due = new Date(); due.setDate(due.getDate() + 14);
  const dueStr = due.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " à " + due.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const others = users.filter((u) => u.id !== currentUser?.id);

  const submit = async () => {
    setErr("");
    if (!borrowerId) { setErr("Choisissez à qui vous prêtez le jeu."); return; }
    setBusy(true);
    const res = await createLoan(g.id, borrowerId, weight);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    onClose();
    setToast("Prêt enregistré !");
  };

  return (
    <Modal open onClose={onClose} title={`Prêter « ${g.name} »`} width={520}>
      <Field label="À qui prêtez-vous ce jeu ?">
        <select value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">— Choisir un membre —</option>
          {others.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </Field>

      <div style={{ background: "rgba(30,138,138,.07)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <Calendar size={18} color={C.teal} />
        <span style={{ fontSize: 13.5, color: "#5e5346" }}>Retour prévu le <b>{dueStr}</b> <span style={{ color: "#9c8d79" }}>(dans 2 semaines)</span></span>
      </div>

      <Field label="Poids relevé (g)" hint="Pré-rempli avec votre poids enregistré. Sert à vérifier le jeu au retour (visible de vous seul).">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="ex. 1250,5" style={{ ...inputStyle, flex: 1 }} />
          <span style={{ fontSize: 14, color: "#9c8d79" }}>g</span>
        </div>
      </Field>

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" variant="teal" onClick={submit} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><ArrowRightLeft size={18} /> Enregistrer le prêt</>}</Btn>
    </Modal>
  );
}

/* ---- Section extensions d'une fiche de jeu ---- */
function GameExtensions({ g, onAuth, onClose, setToast }) {
  const { currentUser, addExtension, addExtensionOwner, removeExtensionOwner } = useApp();
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState("bgg"); // "bgg" | "manual"
  const [f, setF] = useState({ name: "", img: "" });
  const [busy, setBusy] = useState(false);
  // recherche BGG
  const [bggQuery, setBggQuery] = useState("");
  const [bggResults, setBggResults] = useState([]);
  const [bggSearching, setBggSearching] = useState(false);
  const [bggLoadingId, setBggLoadingId] = useState(null);
  const [bggErr, setBggErr] = useState("");
  const exts = g.extensions || [];

  const reset = () => { setAdding(false); setMode("bgg"); setF({ name: "", img: "" }); setBggQuery(""); setBggResults([]); setBggErr(""); };

  const submitManual = async () => {
    if (!f.name.trim()) return;
    setBusy(true);
    await addExtension(g.id, f);
    setBusy(false);
    reset();
    setToast("Extension ajoutée !");
  };

  const runBggSearch = async () => {
    if (!bggQuery.trim()) return;
    setBggSearching(true); setBggErr(""); setBggResults([]);
    try {
      const list = await bggSearch(bggQuery.trim());
      setBggResults(list);
      if (list.length === 0) setBggErr("Aucun résultat trouvé sur BoardGameGeek.");
    } catch (e) {
      setBggErr("Recherche BGG indisponible. Essayez la saisie manuelle.");
    } finally { setBggSearching(false); }
  };

  const importFromBgg = async (id, name) => {
    setBggLoadingId(id); setBggErr("");
    try {
      const d = await bggDetails(id);
      // On bascule en mode édition manuel avec les données pré-remplies depuis BGG.
      // L'utilisateur peut alors corriger le nom, l'image, etc. avant validation.
      setF({ name: d.name || name, img: d.img || "" });
      setMode("manual");
    } catch (e) {
      setBggErr("Impossible de récupérer cette fiche depuis BGG.");
    } finally { setBggLoadingId(null); }
  };

  return (
    <div style={{ borderTop: "1px solid #f0e8d8", marginTop: 18, paddingTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: 0 }}>🧩 Extensions ({exts.length})</h4>
        {currentUser && !adding && <Btn size="sm" variant="soft" onClick={() => { setAdding(true); setBggQuery(g.name || ""); }}><Plus size={14} /> Ajouter</Btn>}
      </div>

      {exts.length === 0 && !adding && <span style={{ color: "#a89a86", fontSize: 13.5 }}>Aucune extension référencée pour ce jeu.</span>}

      <div style={{ display: "grid", gap: 10, marginBottom: adding ? 14 : 0 }}>
        {exts.map((x) => {
          const isOwner = currentUser && (x.ownerIds || []).includes(currentUser.id);
          return (
            <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(107,58,122,.06)", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ width: 42, height: 42, borderRadius: 9, flexShrink: 0, background: x.img ? `center/cover url("${x.img}")` : `linear-gradient(135deg,${C.purple},${C.red})`, display: "grid", placeItems: "center" }}>
                {!x.img && <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#fff", fontSize: 13 }}>🧩</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14.5 }}>{x.name}</div>
                <div style={{ fontSize: 12, color: "#9c8d79" }}>
                  {x.owners && x.owners.length ? `chez ${x.owners.map((o) => o.name).join(", ")}` : "personne ne la possède"}
                </div>
              </div>
              {currentUser && (
                isOwner ? (
                  <Btn size="sm" variant="danger" onClick={async () => { await removeExtensionOwner(x.id); setToast("Vous ne possédez plus cette extension."); }}><X size={13} /></Btn>
                ) : (
                  <Btn size="sm" variant="teal" onClick={async () => { await addExtensionOwner(x.id); setToast("Extension ajoutée à votre ludothèque !"); }}><Plus size={13} /> Je l'ai</Btn>
                )
              )}
            </div>
          );
        })}
      </div>

      {adding && (
        <div style={{ background: "rgba(107,58,122,.06)", borderRadius: 13, padding: 14 }}>
          {/* onglets mode */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, background: "#fff", borderRadius: 10, padding: 4 }}>
            <button type="button" onClick={() => setMode("bgg")} style={{ flex: 1, padding: "8px 10px", border: "none", borderRadius: 7, background: mode === "bgg" ? C.purple : "transparent", color: mode === "bgg" ? "#fff" : C.navy, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5 }}>Rechercher sur BGG</button>
            <button type="button" onClick={() => setMode("manual")} style={{ flex: 1, padding: "8px 10px", border: "none", borderRadius: 7, background: mode === "manual" ? C.purple : "transparent", color: mode === "manual" ? "#fff" : C.navy, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5 }}>Saisie manuelle</button>
          </div>

          {mode === "bgg" ? (
            <>
              <Field label="Rechercher l'extension sur BoardGameGeek" hint={`Astuce : incluez le nom du jeu de base (ex. « ${g.name} oceania »)`}>
                <div style={{ display: "flex", gap: 8 }}>
                  <TextInput value={bggQuery} onChange={(e) => setBggQuery(e.target.value)} placeholder="Nom de l'extension..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); runBggSearch(); } }} autoFocus />
                  <Btn size="md" variant="purple" onClick={runBggSearch} disabled={bggSearching || !bggQuery.trim()}>{bggSearching ? <Loader2 size={15} className="aladj-spin" /> : <Search size={15} />}</Btn>
                </div>
              </Field>
              {bggErr && <div style={{ background: "rgba(181,40,58,.08)", color: C.red, padding: "9px 12px", borderRadius: 9, fontSize: 13, marginBottom: 10 }}>{bggErr}</div>}
              {bggResults.length > 0 && (
                <div style={{ display: "grid", gap: 6, maxHeight: 280, overflowY: "auto", marginBottom: 12 }}>
                  {bggResults.map((r) => (
                    <button key={r.id} type="button" onClick={() => importFromBgg(r.id, r.name)} disabled={bggLoadingId === r.id}
                      style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #ece2d0", borderRadius: 10, padding: "9px 12px", cursor: bggLoadingId === r.id ? "wait" : "pointer", textAlign: "left" }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5 }}>{r.name}</span>
                        {r.year && <span style={{ fontSize: 11.5, color: "#9c8d79" }}>{r.year}</span>}
                      </span>
                      {bggLoadingId === r.id ? <Loader2 size={15} className="aladj-spin" color={C.purple} /> : <Plus size={15} color={C.purple} />}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="soft" onClick={reset}>Annuler</Btn>
              </div>
            </>
          ) : (
            <>
              <Field label="Nom de l'extension"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex. Oceania, Europe..." autoFocus /></Field>
              <Field label="Image" hint="Facultatif"><ImageField value={f.img} onChange={(v) => setF({ ...f, img: v })} /></Field>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn size="sm" variant="purple" onClick={submitManual} disabled={busy || !f.name.trim()}>{busy ? <Loader2 size={14} className="aladj-spin" /> : <><Plus size={14} /> Ajouter l'extension</>}</Btn>
                <Btn size="sm" variant="soft" onClick={reset}>Annuler</Btn>
              </div>
            </>
          )}
        </div>
      )}

      {!currentUser && exts.length === 0 && <span style={{ fontSize: 13, color: "#a89a86" }}> Connectez-vous pour ajouter une extension.</span>}
    </div>
  );
}

/* ---- Section commentaires d'une fiche de jeu (signés, modifiables) ---- */
function GameComments({ g, onAuth, onClose }) {
  const { currentUser, addGameComment, updateGameComment, removeGameComment } = useApp();
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);
  const list = g.comments || [];

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true); await addGameComment(g.id, text); setBusy(false); setText("");
  };
  const saveEdit = async () => {
    if (!editText.trim()) return;
    await updateGameComment(editingId, editText); setEditingId(null); setEditText("");
  };

  return (
    <div style={{ borderTop: "1px solid #f0e8d8", marginTop: 18, paddingTop: 18 }}>
      <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: "0 0 12px" }}>💬 Avis & commentaires ({list.length})</h4>
      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        {list.length === 0 && <span style={{ color: "#a89a86", fontSize: 13.5 }}>Aucun commentaire pour l'instant. Partagez votre avis sur ce jeu !</span>}
        {list.map((c) => {
          const mine = currentUser && c.authorId === currentUser.id;
          const edited = c.updatedAt && c.createdAt && new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime() > 2000;
          return (
            <div key={c.id} style={{ background: "rgba(26,58,92,.04)", borderRadius: 13, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: mine ? C.teal : C.navy, fontSize: 13.5 }}>{c.authorName}{mine ? " (vous)" : ""}</span>
                {mine && editingId !== c.id && (
                  <span style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditingId(c.id); setEditText(c.content); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79", padding: 0 }}><Edit3 size={14} /></button>
                    <button onClick={() => removeGameComment(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 0 }}><Trash2 size={14} /></button>
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
          <textarea value={text} onChange={(ev) => setText(ev.target.value)} rows={1} placeholder="Votre avis sur ce jeu..." style={{ ...inputStyle, resize: "vertical", flex: 1 }} />
          <Btn variant="teal" onClick={submit} disabled={busy || !text.trim()}>{busy ? <Loader2 size={16} className="aladj-spin" /> : "Publier"}</Btn>
        </div>
      ) : (
        <span style={{ fontSize: 13, color: "#a89a86" }}>Connectez-vous pour laisser un commentaire.</span>
      )}
    </div>
  );
}

/* ---- Compte à rebours (se met à jour chaque seconde, passe en négatif) ---- */
function Countdown({ dueAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(dueAt).getTime() - now; // ms restantes (négatif si en retard)
  const late = diff < 0;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const mins = Math.floor((abs % 3600000) / 60000);
  const secs = Math.floor((abs % 60000) / 1000);
  const parts = days > 0 ? `${days} j ${hours} h ${mins} min` : `${hours} h ${mins} min ${secs} s`;
  return (
    <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: late ? C.red : C.teal, fontSize: 15 }}>
      {late ? `En retard de ${parts}` : `${parts} restant${days > 1 ? "s" : ""}`}
    </span>
  );
}

/* =============================================================================
   PAGE — MES LOCATIONS
   ============================================================================= */
/* ============================================================ */
/* ---- Module "À venir" (jeux à sortir / nouveautés) ---- */
/* ============================================================ */

// Labels et couleurs pour les 5 niveaux du thermomètre
const HYPE_LABELS = {
  1: { label: "Froid", color: "#4a90c2" },
  2: { label: "Tiède", color: "#7ab8a8" },
  3: { label: "Intéressé", color: "#e8a317" },
  4: { label: "Chaud", color: "#e87317" },
  5: { label: "Brûlant", color: "#b5283a" },
};

// Labels pour les 7 intentions d'achat (du plus engagé au moins engagé)
const INTENT_OPTIONS = [
  { key: "preorder",   label: "Précommandé",               color: "#b5283a" },
  { key: "release",    label: "À la sortie",               color: "#e87317" },
  { key: "certain",    label: "Certainement",              color: "#e8a317" },
  { key: "promo",      label: "En promotion",              color: "#c5a823" },
  { key: "completion", label: "Pour compléter une commande", color: "#7ab8a8" },
  { key: "unlikely",   label: "Peu probable",              color: "#8e8275" },
  { key: "never",      label: "Jamais",                    color: "#6e6256" },
];

/* ---- Thermomètre cliquable (1 à 5) ---- */
function Thermometer({ value = 0, onRate, readOnly = false, size = 22 }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = shown >= n;
        const cfg = HYPE_LABELS[n];
        return (
          <button key={n} type="button" disabled={readOnly}
            onMouseEnter={() => setHover(n)} onClick={() => !readOnly && onRate && onRate(n)}
            title={`${n} — ${cfg.label}`}
            style={{
              width: size, height: size, borderRadius: "50%", border: "none", padding: 0,
              background: active ? cfg.color : "#e4dccb", cursor: readOnly ? "default" : "pointer",
              transition: "transform .12s", transform: hover === n ? "scale(1.18)" : "scale(1)",
              boxShadow: active ? "0 2px 6px rgba(0,0,0,.15)" : "none",
            }} />
        );
      })}
      {shown > 0 && <span style={{ marginLeft: 6, fontSize: 12, color: HYPE_LABELS[shown].color, fontFamily: "'Fredoka',sans-serif", fontWeight: 700 }}>{HYPE_LABELS[shown].label}</span>}
    </span>
  );
}

// Stats sur une fiche À venir
function upcomingStats(u) {
  const vals = Object.values(u.hypes || {});
  const count = vals.length;
  const avg = count ? vals.reduce((a, b) => a + b, 0) / count : 0;
  return { avg, count };
}

/* ---- Carte d'une fiche À venir (grille principale) ---- */
function UpcomingCard({ u, onOpen, currentUserId }) {
  const { avg, count } = upcomingStats(u);
  const myHype = currentUserId ? (u.hypes?.[currentUserId] || 0) : 0;
  const iVoted = myHype > 0;
  const cfg = HYPE_LABELS[Math.round(avg)] || HYPE_LABELS[1];
  return (
    <button onClick={onOpen} style={{ width: "100%", textAlign: "left", cursor: "pointer", border: "1px solid #ece2d0", borderRadius: 18, overflow: "hidden", padding: 0, background: C.paper, boxShadow: "0 4px 16px rgba(18,41,63,.05)", transition: "transform .15s, box-shadow .2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(18,41,63,.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(18,41,63,.05)"; }}>
      <div style={{ position: "relative" }}>
        <GameCover g={u} />
        {count > 0 && (
          <div title={iVoted ? "Hype moyenne — vous avez voté" : "Hype moyenne — vous n'avez pas encore voté"}
            style={{ position: "absolute", top: 10, right: 10, background: iVoted ? cfg.color : "rgba(18,41,63,.85)", color: "#fff", borderRadius: 999, padding: "4px 11px", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
            🌡️ {avg.toFixed(1).replace(".", ",")}
          </div>
        )}
      </div>
      <div style={{ padding: 14 }}>
        <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 16, margin: "0 0 4px", lineHeight: 1.2 }}>{u.name}</h3>
        {u.year && <p style={{ fontSize: 12, color: "#9c8d79", margin: "0 0 8px" }}>Sortie : {u.year}</p>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 12, color: "#5e5346" }}>
          {u.min && <span>{u.min}{u.max && u.max !== u.min ? `-${u.max}` : ""} j.</span>}
          {u.time && <span>· {u.time} min</span>}
          {u.newPrice != null && <span>· {u.newPrice.toFixed(2).replace(".", ",")} €</span>}
        </div>
        {count > 0 && <span style={{ display: "block", marginTop: 8, fontSize: 11.5, color: "#8a7c6a", fontWeight: 700, fontFamily: "'Fredoka',sans-serif" }}>{count} vote{count > 1 ? "s" : ""} de hype</span>}
      </div>
    </button>
  );
}

/* ---- Page "À venir" ---- */
function UpcomingPage({ onAuth, setToast }) {
  const { upcoming, users, currentUser } = useApp();
  const [q, setQ] = useState("");
  const [mech, setMech] = useState("");
  const [sort, setSort] = useState("hype");
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const allMechanics = useMemo(() => {
    const s = new Set();
    upcoming.forEach((u) => (u.mechanics || []).forEach((m) => s.add(m)));
    return [...s].sort((a, b) => a.localeCompare(b, "fr"));
  }, [upcoming]);

  const filtered = useMemo(() => {
    let list = upcoming.filter((u) => {
      const okQ = !q || u.name.toLowerCase().includes(q.toLowerCase());
      const okM = !mech || (u.mechanics || []).includes(mech);
      return okQ && okM;
    }).map((u) => {
      const st = upcomingStats(u);
      return { ...u, _avg: st.avg, _count: st.count };
    });
    if (sort === "hype") list.sort((a, b) => b._avg - a._avg || b._count - a._count || a.name.localeCompare(b.name, "fr"));
    else if (sort === "alpha") list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    else if (sort === "year") list.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    else if (sort === "recent") list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    return list;
  }, [upcoming, q, mech, sort]);

  // Top 20 : toutes les fiches qui ont au moins 1 vote (différence avec ludothèque !)
  const top = useMemo(() => {
    return upcoming
      .map((u) => ({ ...u, _avg: upcomingStats(u).avg, _count: upcomingStats(u).count }))
      .filter((u) => u._count >= 1)
      .sort((a, b) => b._avg - a._avg || b._count - a._count || a.name.localeCompare(b.name, "fr"))
      .slice(0, 20);
  }, [upcoming]);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 26 }}>
        <div>
          <h1 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 32, margin: 0 }}>À venir</h1>
          <p style={{ color: "#6e6256", fontSize: 14.5, margin: "6px 0 0", maxWidth: 560 }}>
            Les jeux qui viennent de sortir ou qui arrivent bientôt. <b>Faites grimper votre thermomètre de la hype</b> et indiquez votre intention d'achat — chaque membre voit qui veut quoi.
          </p>
        </div>
        {currentUser
          ? <Btn variant="amber" size="lg" onClick={() => setShowAdd(true)}><Plus size={18} /> Ajouter un jeu</Btn>
          : <Btn variant="amber" size="lg" onClick={() => onAuth("login")}><LogIn size={18} /> Se connecter</Btn>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, alignItems: "start" }} className="aladj-ludo-grid">
        <div className="aladj-ludo-main">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={18} color="#b6a78f" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un jeu..." style={{ paddingLeft: 42 }} />
            </div>
            <select value={mech} onChange={(e) => setMech(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes mécaniques</option>
              {allMechanics.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="hype">Hype</option>
              <option value="alpha">A → Z</option>
              <option value="year">Année (récent)</option>
              <option value="recent">Récemment ajoutés</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyHint icon={Sparkles} text={upcoming.length === 0 ? "Aucun jeu en veille pour l'instant. Ajoutez-en un pour lancer le suivi !" : "Aucun jeu ne correspond aux filtres."} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
              {filtered.map((u) => <UpcomingCard key={u.id} u={u} onOpen={() => setSelected(u.id)} currentUserId={currentUser?.id} />)}
            </div>
          )}
        </div>

        <aside style={{ position: "sticky", top: 88, display: "grid", gap: 18 }} className="aladj-ludo-aside">
          <div style={{ background: `linear-gradient(160deg, ${C.red}, ${C.purple})`, borderRadius: 20, padding: 22, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Sparkles size={20} color="#ffd9a3" />
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 18, margin: 0 }}>Top 20 hype</h3>
            </div>
            <p style={{ opacity: .75, fontSize: 12, margin: "0 0 12px", lineHeight: 1.5 }}>Dès qu'un jeu reçoit un vote, il entre dans ce classement.</p>
            {top.length === 0 && <p style={{ opacity: .7, fontSize: 13.5 }}>Pas encore de vote.</p>}
            <div style={{ display: "grid", gap: 8, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
              {top.map((u, i) => (
                <button key={u.id} onClick={() => setSelected(u.id)} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.09)", border: "none", borderRadius: 12, padding: "9px 12px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: i < 3 ? 17 : 14, color: "rgba(255,255,255,.85)", width: 24, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>{u._count} vote{u._count > 1 ? "s" : ""}</span>
                  </span>
                  <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: "#ffd9a3" }}>{u._avg.toFixed(1).replace(".", ",")}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {showAdd && <AddUpcomingFlow onClose={() => setShowAdd(false)} setToast={setToast} />}
      {selected && <UpcomingDetailModal upcId={selected} onClose={() => setSelected(null)} onAuth={onAuth} setToast={setToast} />}
    </div>
  );
}

/* ---- Flow d'ajout : choix BGG / manuel + détection de doublons ---- */
function AddUpcomingFlow({ onClose, setToast }) {
  const { addUpcoming, upcoming, games } = useApp();
  const [mode, setMode] = useState("choose");
  const [prefillName, setPrefillName] = useState("");

  const handleDone = async (data) => {
    if (!data) { onClose(); return; }
    await addUpcoming({ ...data, source: data.source || "manuel" });
    onClose();
    setToast(`« ${data.name} » ajouté en veille !`);
  };

  return (
    <Modal open onClose={onClose} title="Ajouter un jeu à venir" width={600}>
      {mode === "choose" && (
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ fontSize: 14, color: "#5e5346", margin: "0 0 6px", lineHeight: 1.55 }}>
            Comment souhaitez-vous ajouter ce jeu à venir ?
          </p>
          <button onClick={() => setMode("bgg")} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", border: "2px solid #ece2d0", borderRadius: 14, background: "#fff", cursor: "pointer", textAlign: "left" }}>
            <span style={{ width: 44, height: 44, borderRadius: 11, background: "#ff5100", display: "grid", placeItems: "center" }}><Globe size={22} color="#fff" /></span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15 }}>Rechercher sur BoardGameGeek</span>
              <span style={{ display: "block", fontSize: 12.5, color: "#9c8d79" }}>Fiche pré-remplie (image, mécaniques, joueurs, durée)</span>
            </span>
          </button>
          <button onClick={() => setMode("manual")} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", border: "2px solid #ece2d0", borderRadius: 14, background: "#fff", cursor: "pointer", textAlign: "left" }}>
            <span style={{ width: 44, height: 44, borderRadius: 11, background: C.teal, display: "grid", placeItems: "center" }}><Edit3 size={20} color="#fff" /></span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15 }}>Saisie manuelle</span>
              <span style={{ display: "block", fontSize: 12.5, color: "#9c8d79" }}>Pour un jeu non encore référencé sur BGG</span>
            </span>
          </button>
        </div>
      )}
      {mode === "bgg" && <BggImport onBack={() => setMode("choose")} onManual={(name) => { setPrefillName(name); setMode("manual"); }} onDone={async (data) => { if (data) { await handleDone({ ...data, source: "BoardGameGeek" }); } else { onClose(); } }} forUpcoming />}
      {mode === "manual" && <ManualUpcomingForm onBack={() => setMode("choose")} onDone={handleDone} initialName={prefillName} />}
    </Modal>
  );
}

/* ---- Formulaire manuel pour une fiche À venir ---- */
function ManualUpcomingForm({ onBack, onDone, initialName = "" }) {
  const { upcoming, games, currentUser } = useApp();
  const [f, setF] = useState({ name: initialName, year: "", min: "", max: "", time: "", mechanics: [], desc: "", img: "", newPrice: "", ludumUrl: "" });
  const [err, setErr] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const toggleMech = (m) => setF((s) => ({ ...s, mechanics: s.mechanics.includes(m) ? s.mechanics.filter((x) => x !== m) : [...s.mechanics, m] }));

  // Détection de doublons : à la fois dans les fiches À venir ET dans la ludothèque
  const similarUpc = useMemo(() => dismissed ? [] : findSimilarGames(upcoming, f.name), [upcoming, f.name, dismissed]);
  const similarLudo = useMemo(() => dismissed ? [] : findSimilarGames(games, f.name), [games, f.name, dismissed]);
  const [busy, setBusy] = useState(false); // anti double-clic

  const submit = async () => {
    if (busy) return;
    if (!f.name.trim()) { setErr("Le nom du jeu est obligatoire."); return; }
    setBusy(true);
    await onDone({ ...f, name: f.name.trim(), year: Number(f.year) || "", min: Number(f.min) || "", max: Number(f.max) || "", time: Number(f.time) || "", newPrice: f.newPrice });
  };

  return (
    <div>
      <button onClick={onBack} style={backLinkStyle}><ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Retour</button>
      <Field label="Nom du jeu *"><TextInput value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setDismissed(false); }} placeholder="Ex. Nucléum" autoFocus /></Field>

      {(similarUpc.length > 0 || similarLudo.length > 0) && (
        <div style={{ background: "rgba(232,163,23,.08)", border: "1px solid rgba(232,163,23,.3)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.amber, fontSize: 14 }}>Ce jeu existe peut-être déjà</span>
            <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79", fontSize: 12.5 }}>Ignorer</button>
          </div>
          {similarUpc.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#9c8d79", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>En veille</span>
              {similarUpc.slice(0, 3).map((u) => (
                <div key={u.id} style={{ fontSize: 13.5, color: "#5e5346", padding: "4px 0" }}>• {u.name}{u.year ? ` (${u.year})` : ""}</div>
              ))}
            </div>
          )}
          {similarLudo.length > 0 && (
            <div>
              <span style={{ fontSize: 12, color: "#9c8d79", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>Dans la ludothèque</span>
              {similarLudo.slice(0, 3).map((g) => (
                <div key={g.id} style={{ fontSize: 13.5, color: "#5e5346", padding: "4px 0" }}>• {g.name}{g.year ? ` (${g.year})` : ""}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <Field label="Image"><ImageField value={f.img} onChange={(v) => setF({ ...f, img: v })} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Année de sortie"><TextInput type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} placeholder="2026" /></Field>
        <Field label="Prix neuf (€)"><TextInput type="number" step="0.01" value={f.newPrice} onChange={(e) => setF({ ...f, newPrice: e.target.value })} placeholder="50" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Joueurs min"><TextInput type="number" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} placeholder="2" /></Field>
        <Field label="Joueurs max"><TextInput type="number" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} placeholder="4" /></Field>
        <Field label="Durée (min)"><TextInput type="number" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} placeholder="60" /></Field>
      </div>
      <Field label="Mécaniques">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {MECHANIC_SUGGESTIONS.map((m) => {
            const active = f.mechanics.includes(m);
            return <button key={m} type="button" onClick={() => toggleMech(m)} style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : "#8a7c6a" }}>{m}</button>;
          })}
        </div>
      </Field>
      <Field label="Description"><textarea value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" }} placeholder="Présentation du jeu..." /></Field>
      <Field label="Lien Ludum (facultatif)" hint="Collez l'adresse de la fiche du jeu sur Ludum. Laissez vide : un bouton de recherche par nom sera proposé automatiquement.">
        <TextInput value={f.ludumUrl} onChange={(e) => setF({ ...f, ludumUrl: e.target.value })} placeholder="https://www.ludum.fr/..." />
      </Field>

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" variant="amber" onClick={submit} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Plus size={18} /> Ajouter en veille</>}</Btn>
    </div>
  );
}

/* ---- Fiche détaillée d'un jeu À venir ---- */
function UpcomingDetailModal({ upcId, onClose, onAuth, setToast }) {
  const { upcoming, users, currentUser, setHype, setIntent, removeUpcoming, updateUpcoming, importUpcomingToLudo, addUpcomingComment, updateUpcomingComment, removeUpcomingComment } = useApp();
  const u = upcoming.find((x) => x.id === upcId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  if (!u) return <Modal open onClose={onClose} title="Fiche introuvable"><p>Cette fiche n'existe plus ou a été retirée (le jeu est probablement passé en ludothèque).</p></Modal>;

  const { avg, count } = upcomingStats(u);
  const myHype = currentUser ? (u.hypes?.[currentUser.id] || 0) : 0;
  const myIntent = currentUser ? u.intents?.[currentUser.id] : null;
  // Détail des votants pour la transparence : qui a mis quel thermomètre, qui veut quoi
  const hypesByMember = Object.entries(u.hypes || {}).map(([uid, v]) => ({ uid, name: users.find((m) => m.id === uid)?.name || "Membre", value: v }));
  const intentsByOption = INTENT_OPTIONS.map((opt) => ({
    ...opt,
    members: Object.entries(u.intents || {}).filter(([, val]) => val === opt.key).map(([uid]) => users.find((m) => m.id === uid)?.name || "Membre"),
  }));

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setBusy(true);
    await addUpcomingComment(u.id, commentText);
    setBusy(false);
    setCommentText("");
  };

  const importMe = async () => {
    setBusy(true);
    const res = await importUpcomingToLudo(u.id);
    setBusy(false);
    if (res?.error) { setToast(res.error); return; }
    setToast("Ajouté à votre ludothèque !");
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={u.name} width={720}>
      {/* en-tête : image + badges */}
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 18, marginBottom: 20 }} className="aladj-upc-head">
        <GameCover g={u} />
        <div>
          <h2 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 22, margin: "0 0 8px" }}>{u.name}</h2>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {u.year && <Badge color={C.amber}><Calendar size={12} /> {u.year}</Badge>}
            {u.min && <Badge color={C.teal}><Users size={12} /> {u.min}{u.max && u.max !== u.min ? `–${u.max}` : ""} joueurs</Badge>}
            {u.time && <Badge color={C.amber}><Clock size={12} /> {u.time} min</Badge>}
            {u.newPrice != null && <Badge color={C.purple}><Euro size={12} /> {u.newPrice.toFixed(2).replace(".", ",")} €</Badge>}
            {u.source && u.source !== "manuel" && <Badge color={C.purple}><Globe size={12} /> {u.source}</Badge>}
          </div>
          {u.mechanics && u.mechanics.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
              {u.mechanics.map((m, i) => <Badge key={i} color="#8a7c6a">{m}</Badge>)}
            </div>
          )}
          <p style={{ fontSize: 12.5, color: "#9c8d79", margin: "8px 0 0" }}>Ajouté par {u.createdByName}</p>
        </div>
      </div>

      {u.desc && <p style={{ fontSize: 14.5, color: "#5e5346", lineHeight: 1.6, marginBottom: 18, whiteSpace: "pre-line" }}>{u.desc}</p>}

      <a href={ludumLink(u.name, u.ludumUrl)} target="_blank" rel="noopener noreferrer sponsored"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, width: "100%", boxSizing: "border-box", background: C.amber, color: "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 15, padding: "13px 20px", borderRadius: 13, textDecoration: "none", marginBottom: 18 }}>
        <ShoppingBag size={17} /> Acheter chez Ludum
      </a>

      {/* Prix neuf annoncé (s'il a été renseigné) */}
      {u.newPrice != null && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(107,58,122,.08)", border: "1px solid rgba(107,58,122,.2)", borderRadius: 12, padding: "10px 16px", marginBottom: 18 }}>
          <Euro size={18} color={C.purple} />
          <span style={{ fontSize: 13, color: "#6e6256" }}>Prix annoncé :</span>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.purple, fontSize: 17 }}>{u.newPrice.toFixed(2).replace(".", ",")} €</span>
        </div>
      )}

      {/* Thermomètre de la hype */}
      <div style={{ background: "rgba(232,163,23,.08)", border: "1px solid rgba(232,163,23,.25)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: "0 0 6px" }}>🌡️ Thermomètre de la hype</h4>
        <p style={{ fontSize: 12.5, color: "#6e6256", margin: "0 0 12px" }}>De « Froid » (je ne suis pas tenté) à « Brûlant » (j'ai hâte de l'avoir entre les mains).</p>
        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: count > 0 ? 12 : 0 }}>
            <Thermometer value={myHype} onRate={(v) => setHype(u.id, v)} size={26} />
            <span style={{ fontSize: 12.5, color: "#9c8d79" }}>{myHype > 0 ? `Votre vote : ${HYPE_LABELS[myHype].label}` : "Cliquez pour voter"}</span>
          </div>
        ) : (
          <Btn size="sm" variant="amber" onClick={() => onAuth("login")}><LogIn size={14} /> Se connecter pour voter</Btn>
        )}
        {count > 0 && (
          <div style={{ borderTop: "1px solid rgba(232,163,23,.2)", paddingTop: 10 }}>
            <div style={{ fontSize: 13, color: "#5e5346", marginBottom: 6 }}>
              <b>Moyenne : {avg.toFixed(2).replace(".", ",")}</b> · {count} vote{count > 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {hypesByMember.sort((a, b) => b.value - a.value).map((h) => (
                <span key={h.uid} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", borderRadius: 999, padding: "3px 9px", fontSize: 12, color: "#5e5346", border: `1px solid ${HYPE_LABELS[h.value].color}` }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: HYPE_LABELS[h.value].color }} /> {h.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Intentions d'achat */}
      <div style={{ background: "rgba(107,58,122,.06)", border: "1px solid rgba(107,58,122,.2)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: "0 0 10px" }}>🎯 Mon intention d'achat</h4>
        {currentUser ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
            {INTENT_OPTIONS.map((opt) => {
              const active = myIntent === opt.key;
              return (
                <button key={opt.key} onClick={() => setIntent(u.id, opt.key)}
                  style={{ padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13, border: `2px solid ${active ? opt.color : "#e6dcc9"}`, background: active ? opt.color : "#fff", color: active ? "#fff" : "#8a7c6a", transition: "all .12s" }}>
                  {active && <Check size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />}{opt.label}
                </button>
              );
            })}
          </div>
        ) : (
          <Btn size="sm" variant="purple" onClick={() => onAuth("login")} style={{ marginBottom: 14 }}><LogIn size={14} /> Se connecter</Btn>
        )}
        <div style={{ borderTop: "1px solid rgba(107,58,122,.15)", paddingTop: 12 }}>
          <div style={{ fontSize: 13, color: "#5e5346", marginBottom: 8, fontWeight: 600 }}>Intentions des membres</div>
          {intentsByOption.every((o) => o.members.length === 0) && <span style={{ fontSize: 13, color: "#a89a86" }}>Personne ne s'est encore prononcé.</span>}
          {intentsByOption.filter((o) => o.members.length > 0).map((o) => (
            <div key={o.key} style={{ marginBottom: 6, fontSize: 13, color: "#5e5346" }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: o.color, marginRight: 8, verticalAlign: "-1px" }} />
              <b>{o.label}</b> ({o.members.length}) : <span style={{ color: "#9c8d79" }}>{o.members.join(", ")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {currentUser && (
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <Btn variant="teal" size="md" onClick={importMe} disabled={busy}><Plus size={16} /> Je l'ai ! L'ajouter à ma ludothèque</Btn>
          <Btn variant="soft" size="md" onClick={() => setEditing(true)}><Edit3 size={15} /> Modifier la fiche</Btn>
          {!confirmDelete
            ? <Btn variant="ghost" size="md" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Supprimer cette fiche</Btn>
            : <>
                <Btn variant="danger" size="md" onClick={async () => { await removeUpcoming(u.id); setToast("Fiche supprimée."); onClose(); }}>Confirmer</Btn>
                <Btn variant="soft" size="md" onClick={() => setConfirmDelete(false)}>Annuler</Btn>
              </>}
        </div>
      )}

      {/* Commentaires */}
      <div style={{ borderTop: "1px solid #f0e8d8", paddingTop: 16 }}>
        <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: "0 0 10px" }}>💬 Commentaires ({(u.comments || []).length})</h4>
        <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          {(u.comments || []).map((c) => {
            const mine = currentUser && c.authorId === currentUser.id;
            const isEdit = editId === c.id;
            return (
              <div key={c.id} style={{ background: "rgba(26,58,92,.04)", borderRadius: 11, padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13 }}>{c.authorName}</span>
                  {mine && !isEdit && (
                    <span style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => { setEditId(c.id); setEditText(c.content); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79" }}><Edit3 size={13} /></button>
                      <button onClick={() => removeUpcomingComment(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red }}><Trash2 size={13} /></button>
                    </span>
                  )}
                </div>
                {isEdit ? (
                  <>
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical", marginBottom: 6 }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn size="sm" variant="teal" onClick={async () => { await updateUpcomingComment(c.id, editText); setEditId(null); }}>Enregistrer</Btn>
                      <Btn size="sm" variant="soft" onClick={() => setEditId(null)}>Annuler</Btn>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13.5, color: "#5e5346", margin: 0, lineHeight: 1.5, whiteSpace: "pre-line" }}>{c.content}</p>
                )}
              </div>
            );
          })}
        </div>
        {currentUser ? (
          <div style={{ display: "flex", gap: 8 }}>
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={1} placeholder="Écrire un commentaire..." style={{ ...inputStyle, resize: "vertical", flex: 1 }} />
            <Btn variant="teal" onClick={submitComment} disabled={busy || !commentText.trim()}>{busy ? <Loader2 size={16} className="aladj-spin" /> : "Envoyer"}</Btn>
          </div>
        ) : (
          <Btn size="sm" variant="ghost" onClick={() => onAuth("login")}><LogIn size={14} /> Se connecter pour commenter</Btn>
        )}
      </div>

      {editing && <EditUpcomingModal u={u} onClose={() => setEditing(false)} setToast={setToast} />}
    </Modal>
  );
}

/* ---- Modale : modifier une fiche À venir ---- */
function EditUpcomingModal({ u, onClose, setToast }) {
  const { updateUpcoming } = useApp();
  const [f, setF] = useState({
    name: u.name || "", year: u.year || "", min: u.min || "", max: u.max || "", time: u.time || "",
    mechanics: u.mechanics || [], desc: u.desc || "", img: u.img || "", ludumUrl: u.ludumUrl || "",
    newPrice: u.newPrice != null ? String(u.newPrice) : "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const toggleMech = (m) => setF((s) => ({ ...s, mechanics: s.mechanics.includes(m) ? s.mechanics.filter((x) => x !== m) : [...s.mechanics, m] }));

  const save = async () => {
    if (!f.name.trim()) { setErr("Le nom est obligatoire."); return; }
    setBusy(true);
    const res = await updateUpcoming(u.id, {
      name: f.name, year: Number(f.year) || null, min: Number(f.min) || null, max: Number(f.max) || null,
      time: Number(f.time) || null, mechanics: f.mechanics, desc: f.desc, img: f.img, ludumUrl: f.ludumUrl,
      newPrice: f.newPrice === "" ? null : Number(f.newPrice),
    });
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setToast("Fiche mise à jour.");
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Modifier la fiche" width={600}>
      <Field label="Nom du jeu *"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
      <Field label="Image"><ImageField value={f.img} onChange={(v) => setF({ ...f, img: v })} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Année de sortie"><TextInput type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></Field>
        <Field label="Prix neuf (€)"><TextInput type="number" step="0.01" value={f.newPrice} onChange={(e) => setF({ ...f, newPrice: e.target.value })} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Joueurs min"><TextInput type="number" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
        <Field label="Joueurs max"><TextInput type="number" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></Field>
        <Field label="Durée (min)"><TextInput type="number" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
      </div>
      <Field label="Mécaniques">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {MECHANIC_SUGGESTIONS.map((m) => {
            const active = f.mechanics.includes(m);
            return <button key={m} type="button" onClick={() => toggleMech(m)} style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : "#8a7c6a" }}>{m}</button>;
          })}
        </div>
      </Field>
      <Field label="Description"><textarea value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" }} /></Field>
      <Field label="Lien Ludum (facultatif)" hint="Collez l'adresse de la fiche du jeu sur Ludum. Laissez vide : un bouton de recherche par nom sera proposé automatiquement.">
        <TextInput value={f.ludumUrl} onChange={(e) => setF({ ...f, ludumUrl: e.target.value })} placeholder="https://www.ludum.fr/..." />
      </Field>

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" variant="amber" onClick={save} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Check size={18} /> Enregistrer les modifications</>}</Btn>
    </Modal>
  );
}

function LocationsPage({ setToast }) {
  const { loans, currentUser, closeLoan } = useApp();
  const myLent = (loans || []).filter((l) => l.lenderId === currentUser?.id && !l.returned);
  const myBorrowed = (loans || []).filter((l) => l.borrowerId === currentUser?.id && !l.returned);
  const history = (loans || []).filter((l) => (l.lenderId === currentUser?.id || l.borrowerId === currentUser?.id) && l.returned);

  const fmtDue = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) + " à " + new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px 80px" }}>
      <h1 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 32, color: C.navy, margin: "0 0 6px" }}>Mes locations</h1>
      <p style={{ color: "#8a7c6a", margin: "0 0 32px", fontSize: 15 }}>Les jeux que vous prêtez et ceux que vous empruntez.</p>

      {/* JEUX QUE JE PRÊTE */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 20, color: C.navy, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <ArrowRightLeft size={20} color={C.teal} /> Jeux que je prête ({myLent.length})
        </h2>
        {myLent.length === 0 ? (
          <EmptyHint icon={Package} text="Vous ne prêtez aucun jeu actuellement." />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {myLent.map((l) => {
              const late = new Date(l.dueAt).getTime() < Date.now();
              return (
                <div key={l.id} style={{ background: C.paper, border: `1px solid ${late ? "rgba(181,40,58,.3)" : "#ece2d0"}`, borderRadius: 16, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 17 }}>{l.gameName}</div>
                      <div style={{ fontSize: 13.5, color: "#5e5346", marginTop: 4 }}>Prêté à <b>{l.borrowerName}</b></div>
                      <div style={{ fontSize: 13, color: "#9c8d79", marginTop: 2 }}>Retour prévu le {fmtDue(l.dueAt)}</div>
                      {/* poids visible du prêteur seulement */}
                      {l.weight != null && (
                        <div style={{ fontSize: 12.5, color: "#9c8d79", marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(26,58,92,.05)", padding: "3px 9px", borderRadius: 8 }}>
                          <Lock size={12} /> Poids relevé : <b>{String(l.weight).replace(".", ",")} g</b>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                      <Countdown dueAt={l.dueAt} />
                      <Btn size="sm" variant="teal" onClick={async () => { await closeLoan(l.id); setToast("Location clôturée, jeu rendu !"); }}><Check size={14} /> Le jeu a bien été rendu</Btn>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* JEUX QUE J'EMPRUNTE */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 20, color: C.navy, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <Package size={20} color={C.amber} /> Jeux que j'emprunte ({myBorrowed.length})
        </h2>
        {myBorrowed.length === 0 ? (
          <EmptyHint icon={Package} text="Vous n'empruntez aucun jeu actuellement." />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {myBorrowed.map((l) => {
              const late = new Date(l.dueAt).getTime() < Date.now();
              return (
                <div key={l.id} style={{ background: late ? "rgba(181,40,58,.05)" : C.paper, border: `1px solid ${late ? "rgba(181,40,58,.3)" : "#ece2d0"}`, borderRadius: 16, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 17 }}>{l.gameName}</div>
                      <div style={{ fontSize: 13.5, color: "#5e5346", marginTop: 4 }}>Emprunté à <b>{l.lenderName}</b></div>
                      <div style={{ fontSize: 13, color: "#9c8d79", marginTop: 2 }}>À rendre le {fmtDue(l.dueAt)}</div>
                      {late && <div style={{ fontSize: 12.5, color: C.red, marginTop: 6, fontWeight: 600 }}>⚠ Pensez à rendre ce jeu à son propriétaire.</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Countdown dueAt={l.dueAt} />
                      <div style={{ fontSize: 11.5, color: "#9c8d79", marginTop: 6 }}>Seul {l.lenderName} peut clôturer le prêt.</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* HISTORIQUE */}
      {history.length > 0 && (
        <section>
          <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 20, color: C.navy, margin: "0 0 14px" }}>Historique ({history.length})</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {history.slice(0, 30).map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(26,58,92,.03)", borderRadius: 10, fontSize: 13.5 }}>
                <span style={{ color: "#5e5346" }}><b>{l.gameName}</b> — {l.lenderId === currentUser?.id ? `prêté à ${l.borrowerName}` : `emprunté à ${l.lenderName}`}</span>
                <span style={{ color: "#9c8d79", fontSize: 12.5 }}>rendu{l.returnedAt ? ` le ${new Date(l.returnedAt).toLocaleDateString("fr-FR")}` : ""}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EditGameModal({ g, onClose, onSave }) {
  const { currentUser, toggleGameShared } = useApp();
  const [f, setF] = useState({ name: g.name, year: g.year, min: g.min, max: g.max, time: g.time, desc: g.desc, img: g.img, mechanics: (g.mechanics || []).join(", "), newPrice: g.newPrice != null ? String(g.newPrice) : "", ludumUrl: g.ludumUrl || "" });
  const [shared, setShared] = useState(g.shared !== false);
  const isOwner = currentUser && currentUser.id === g.ownerId;
  const previewRental = rentalPrice(Number(f.newPrice));
  return (
    <Modal open onClose={onClose} title="Modifier le jeu" width={560}>
      <Field label="Nom"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Année"><TextInput type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></Field>
        <Field label="Min"><TextInput type="number" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
        <Field label="Max"><TextInput type="number" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></Field>
      </div>
      <Field label="Durée (min)"><TextInput type="number" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
      <Field label="Prix neuf (€)" hint={previewRental != null ? `Location calculée : ${fmtEuro(previewRental)} (10% arrondi au 0,5 € sup.)` : "Sert à calculer le tarif de location"}>
        <TextInput type="number" step="0.01" value={f.newPrice} onChange={(e) => setF({ ...f, newPrice: e.target.value })} placeholder="ex. 45" />
      </Field>
      <Field label="Mécaniques (séparées par des virgules)"><TextInput value={f.mechanics} onChange={(e) => setF({ ...f, mechanics: e.target.value })} /></Field>
      <Field label="Image" hint="Adresse web ou import depuis votre appareil"><ImageField value={f.img} onChange={(v) => setF({ ...f, img: v })} /></Field>
      <Field label="Présentation"><textarea rows={4} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} /></Field>
      <Field label="Lien Ludum (facultatif)" hint="Collez l'adresse de la fiche du jeu sur Ludum. Laissez vide : un bouton de recherche par nom sera proposé automatiquement.">
        <TextInput value={f.ludumUrl} onChange={(e) => setF({ ...f, ludumUrl: e.target.value })} placeholder="https://www.ludum.fr/..." />
      </Field>
      {isOwner && (
        <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 12, background: shared ? "rgba(30,138,138,.08)" : "rgba(120,110,95,.08)", marginBottom: 16, cursor: "pointer" }}>
          <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} style={{ width: 18, height: 18, accentColor: C.teal }} />
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>
            Partager ce jeu dans la ludothèque commune
            <span style={{ display: "block", fontSize: 12, color: "#8a7c6a", fontWeight: 400 }}>Décochez pour le garder uniquement dans votre ludothèque personnelle.</span>
          </span>
        </label>
      )}
      <Btn full size="lg" onClick={async () => {
        if (isOwner && shared !== (g.shared !== false)) await toggleGameShared(g.id, shared);
        onSave({ ...f, year: Number(f.year) || "", min: Number(f.min) || "", max: Number(f.max) || "", time: Number(f.time) || "", newPrice: f.newPrice === "" ? null : Number(f.newPrice), mechanics: f.mechanics.split(",").map((s) => s.trim()).filter(Boolean) });
      }}><Check size={18} /> Enregistrer</Btn>
    </Modal>
  );
}

/* =============================================================================
   PAGE — LUDOTHÈQUE GÉNÉRALE
   ============================================================================= */
// classement avec départage : note moyenne desc, puis nb votants desc, puis alpha
function rankGames(games, restrictUserIds = null, preferLessPlayed = false) {
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
    // option : à note égale, les jeux les moins joués remontent (favorise la rotation)
    if (preferLessPlayed) {
      const pa = a.playCount || 0, pb = b.playCount || 0;
      if (pa !== pb) return pa - pb;
    }
    if (b._count !== a._count) return b._count - a._count;
    return a.name.localeCompare(b.name, "fr");
  });
}

function LudothequePage({ onAuth, setToast, setPage }) {
  const { games, users, currentUser } = useApp();
  const [q, setQ] = useState("");
  const [mech, setMech] = useState("");
  const [players, setPlayers] = useState("");
  const [duration, setDuration] = useState("");
  const [year, setYear] = useState("");
  const [wantFilter, setWantFilter] = useState(""); // "" | "mine" | "any" | "none"
  const [showBoth, setShowBoth] = useState(false); // afficher moyenne + ma note simultanément sur les cartes
  const [sort, setSort] = useState("note");
  const [view, setView] = useState("grid"); // "grid" | "list"
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCustomRank, setShowCustomRank] = useState(false);

  // Jeux réellement visibles dans la ludothèque commune :
  // le propriétaire partage sa ludothèque ET le jeu lui-même est partagé.
  const sharedById = useMemo(() => {
    const m = {};
    users.forEach((u) => { m[u.id] = u.shareLibrary !== false; });
    return m;
  }, [users]);
  const communGames = useMemo(
    () => games.filter((g) => {
      if (g.shared === false) return false;
      // visible si au moins un propriétaire partage sa ludothèque
      const ids = (g.ownerIds && g.ownerIds.length) ? g.ownerIds : (g.ownerId ? [g.ownerId] : []);
      return ids.some((id) => sharedById[id] !== false);
    }),
    [games, sharedById]
  );

  const allMechanics = useMemo(() => {
    const s = new Set();
    communGames.forEach((g) => (g.mechanics || []).forEach((m) => s.add(m)));
    return [...s].sort((a, b) => a.localeCompare(b, "fr"));
  }, [communGames]);

  // Années présentes dans la ludothèque, du plus récent au plus ancien
  // + flag indiquant s'il y a des jeux sans année renseignée (pour proposer le filtre "sans année")
  const { allYears, hasNoYear } = useMemo(() => {
    const s = new Set();
    let none = false;
    communGames.forEach((g) => {
      const y = Number(g.year) || 0;
      if (y > 0) s.add(y);
      else none = true;
    });
    return { allYears: [...s].sort((a, b) => b - a), hasNoYear: none };
  }, [communGames]);

  const filtered = useMemo(() => {
    let list = communGames.filter((g) => {
      const okQ = !q || g.name.toLowerCase().includes(q.toLowerCase()) || (g.ownerName || "").toLowerCase().includes(q.toLowerCase());
      const okM = !mech || (g.mechanics || []).includes(mech);
      // filtre nombre de joueurs : le jeu accepte-t-il ce nombre ? (entre min et max)
      let okP = true;
      if (players) {
        const want = Number(players);
        const min = Number(g.min) || 1;
        const max = g.max ? Number(g.max) : Infinity;
        okP = (players === "7") ? max >= 7 : (want >= min && want <= max);
      }
      // filtre durée : durée du jeu sous le seuil choisi
      let okD = true;
      if (duration) {
        const t = Number(g.time) || 0;
        if (duration === "121") okD = t > 120;
        else okD = t > 0 && t <= Number(duration);
      }
      // filtre année : "none" = sans année renseignée ; sinon année précise
      let okY = true;
      if (year) {
        const y = Number(g.year) || 0;
        if (year === "none") okY = !g.year || y === 0;
        else okY = y === Number(year);
      }
      // filtre envies : "mine" = je veux le découvrir ; "any" = au moins un membre ; "none" = personne
      let okW = true;
      if (wantFilter) {
        const wantIds = g.wantIds || [];
        if (wantFilter === "mine") okW = currentUser && wantIds.includes(currentUser.id);
        else if (wantFilter === "any") okW = wantIds.length > 0;
        else if (wantFilter === "none") okW = wantIds.length === 0;
      }
      return okQ && okM && okP && okD && okY && okW;
    });
    if (sort === "note") list = rankGames(list);
    else if (sort === "myNote") list = [...list].sort((a, b) => (b.ratings?.[currentUser?.id] || 0) - (a.ratings?.[currentUser?.id] || 0));
    else if (sort === "alpha") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    else if (sort === "recent") list = [...list].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    else if (sort === "wants") list = [...list].sort((a, b) => (b.wantIds?.length || 0) - (a.wantIds?.length || 0));
    return list;
  }, [communGames, q, mech, players, duration, year, wantFilter, sort, currentUser]);

  // Top 20 : un jeu doit avoir au moins 4 votes pour entrer dans le classement
  // (évite que quelques avis isolés propulsent un jeu en tête).
  const top = useMemo(() => rankGames(communGames).filter((g) => g._count >= 4).slice(0, 20), [communGames]);
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
        <div className="aladj-ludo-main">
          <RatingScaleNote />
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
            <select value={players} onChange={(e) => setPlayers(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Tous joueurs</option>
              <option value="1">1 joueur</option>
              <option value="2">2 joueurs</option>
              <option value="3">3 joueurs</option>
              <option value="4">4 joueurs</option>
              <option value="5">5 joueurs</option>
              <option value="6">6 joueurs</option>
              <option value="7">7+ joueurs</option>
            </select>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes durées</option>
              <option value="30">≤ 30 min</option>
              <option value="45">≤ 45 min</option>
              <option value="60">≤ 1 h</option>
              <option value="90">≤ 1 h 30</option>
              <option value="120">≤ 2 h</option>
              <option value="121">{"> 2 h"}</option>
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes années</option>
              {allYears.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              {hasNoYear && <option value="none">Sans année renseignée</option>}
            </select>
            <select value={wantFilter} onChange={(e) => setWantFilter(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes envies ❤</option>
              {currentUser && <option value="mine">Que j'ai envie de découvrir</option>}
              <option value="any">Avec au moins une envie</option>
              <option value="none">Sans envie</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="note">Mieux notés (général)</option>
              <option value="myNote">Mes meilleures notes</option>
              <option value="wants">Plus d'envies ❤</option>
              <option value="alpha">A → Z</option>
              <option value="recent">Récents</option>
            </select>
            <button onClick={() => setView((v) => v === "grid" ? "list" : "grid")} title={view === "grid" ? "Afficher en liste" : "Afficher en grille"}
              style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, color: C.navy }}>
              {view === "grid" ? <><Menu size={16} /> Liste</> : <><Library size={16} /> Grille</>}
            </button>
            {currentUser && view === "grid" && (
              <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5, color: C.navy, padding: "0 4px" }} title="Afficher la note moyenne et votre note en même temps">
                <input type="checkbox" checked={showBoth} onChange={(e) => setShowBoth(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.teal, cursor: "pointer" }} />
                Voir les 2 notes
              </label>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyHint icon={Library} text="Aucun jeu ne correspond." />
          ) : view === "list" ? (
            <div style={{ display: "grid", gap: 4 }}>
              {/* en-tête de liste */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 14px", fontSize: 12, color: "#9c8d79", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
                <span style={{ flex: 1 }}>Jeu</span>
                <span style={{ width: 60, textAlign: "center" }} title="Membres qui veulent découvrir ce jeu">Envies</span>
                <span style={{ width: 70, textAlign: "center" }}>Moyenne</span>
                <span style={{ width: 70, textAlign: "center" }}>Ma note</span>
              </div>
              {filtered.map((g) => {
                const { avg, count } = gameStats(g);
                const myR = currentUser ? (g.ratings?.[currentUser.id] || 0) : 0;
                const wantC = (g.wantIds || []).length;
                return (
                  <button key={g.id} onClick={() => setSelected(g.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: "1px solid #efe6d6", background: "#fff", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(30,138,138,.05)"} onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                    <span style={{ width: 60, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13.5, color: wantC ? C.red : "#cdbfa8", display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                      {wantC > 0 && <Heart size={12} fill={C.red} color={C.red} />}{wantC || "—"}
                    </span>
                    <span style={{ width: 70, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: count ? C.amber : "#cdbfa8", fontSize: 14 }}>{count ? avg.toFixed(2).replace(".", ",") : "—"}</span>
                    <span style={{ width: 70, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: myR ? C.teal : "#cdbfa8", fontSize: 14 }}>{myR ? String(myR).replace(".", ",") : "—"}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
              {filtered.map((g) => <GameCard key={g.id} g={g} onOpen={() => setSelected(g.id)} showBoth={showBoth} />)}
            </div>
          )}
        </div>

        {/* COLONNE LATÉRALE : classements */}
        <aside style={{ position: "sticky", top: 88, display: "grid", gap: 18 }} className="aladj-ludo-aside">
          {/* CLASSEMENT PERSONNALISÉ (placé en premier pour remonter en haut sur mobile) */}
          <div style={{ background: C.paper, borderRadius: 20, padding: 22, border: `2px solid ${C.teal}` }} className="aladj-ludo-custom">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Award size={20} color={C.teal} />
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 18, margin: 0, color: C.navy }}>Classement sur-mesure</h3>
            </div>
            <p style={{ fontSize: 13.5, color: "#6e6256", lineHeight: 1.5, margin: "0 0 14px" }}>
              Choisissez les membres présents à votre moment jeux pour trouver le jeu qui plaira au plus grand nombre.
            </p>
            <Btn full variant="teal" onClick={() => setShowCustomRank(true)}><Filter size={16} /> Composer ma tablée</Btn>
          </div>

          {/* TOP 20 */}
          <div style={{ background: `linear-gradient(160deg, ${C.navy}, ${C.navyDeep})`, borderRadius: 20, padding: 22, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Trophy size={20} color={C.amber} />
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 19, margin: 0 }}>Top 20 de l'asso</h3>
            </div>
            {top.length === 0 && <p style={{ opacity: .7, fontSize: 13.5, lineHeight: 1.5 }}>Pas encore de jeu avec au moins 4 votes. Notez des jeux pour faire vivre le classement !</p>}
            <div style={{ display: "grid", gap: 8, maxHeight: 520, overflowY: "auto", paddingRight: 4 }}>
              {top.map((g, i) => {
                const medal = i === 0 ? C.amber : i === 1 ? "#d9d9d9" : i === 2 ? "#cd9b6a" : "rgba(255,255,255,.5)";
                return (
                  <button key={g.id} onClick={() => setSelected(g.id)} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.07)", border: "none", borderRadius: 12, padding: "9px 12px", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: i < 3 ? 18 : 15, color: medal, width: 24, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 14.5, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                      <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.55)" }}>{g._count} vote{g._count > 1 ? "s" : ""}</span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.amber, fontFamily: "'Fredoka',sans-serif", fontWeight: 700 }}>
                      <Star size={14} fill={C.amber} /> {g._avg.toFixed(2).replace(".", ",")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Mention obligatoire BGG (données importées via leur API) */}
      <div style={{ textAlign: "center", padding: "30px 20px 10px", marginTop: 10 }}>
        <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#9c8d79", fontSize: 12.5, opacity: .85 }}>
          <span style={{ display: "inline-grid", placeItems: "center", width: 22, height: 22, borderRadius: 6, background: "#ff5100" }}>
            <Dice color="#fff" n={5} style={{ width: 13 }} />
          </span>
          <span>Certaines données de jeux proviennent de <b style={{ color: "#6e6256" }}>BoardGameGeek</b> — Powered by BGG</span>
        </a>
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
  const [players, setPlayers] = useState("");
  const [duration, setDuration] = useState("");
  const [mechFilter, setMechFilter] = useState([]); // mécaniques sélectionnées (multi)
  const [mode, setMode] = useState("consensus"); // "consensus" (valeurs sûres) | "discovery" (découverte)
  const [limit, setLimit] = useState(40); // nombre de propositions affichées par section
  const toggle = (id) => setChosen((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);
  const toggleMech = (m) => setMechFilter((c) => c.includes(m) ? c.filter((x) => x !== m) : [...c, m]);

  // Liste des mécaniques présentes dans la ludothèque (pour le filtre)
  const allMechanics = useMemo(() => {
    const s = new Set();
    games.forEach((g) => (g.mechanics || []).forEach((m) => s.add(m)));
    return [...s].sort((a, b) => a.localeCompare(b, "fr"));
  }, [games]);

  // Helpers de filtrage communs aux trois sections
  const matchPlayers = (g) => {
    if (!players) return true;
    const want = Number(players);
    const min = Number(g.min) || 1;
    const max = g.max ? Number(g.max) : Infinity;
    return players === "7" ? max >= 7 : (want >= min && want <= max);
  };
  const matchDuration = (g) => {
    if (!duration) return true;
    const t = Number(g.time) || 0;
    return duration === "121" ? t > 120 : (t > 0 && t <= Number(duration));
  };
  const matchMech = (g) => mechFilter.length === 0 || mechFilter.every((m) => (g.mechanics || []).includes(m));
  const passFilters = (g) => matchPlayers(g) && matchDuration(g) && matchMech(g);

  // Calcul des trois sections : envies de découverte, notés par la tablée, autres jeux disponibles
  const { discoverGames, regularGames, otherGames } = useMemo(() => {
    if (chosen.length === 0) return { discoverGames: [], regularGames: [], otherGames: [] };
    const chosenSet = new Set(chosen);

    // moyenne des notes de la tablée pour un jeu (0 si aucune note)
    const tableAvg = (g) => {
      const vals = Object.entries(g.ratings || {}).filter(([uid]) => chosenSet.has(uid)).map(([, v]) => v);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    };
    const tableCount = (g) => Object.keys(g.ratings || {}).filter((uid) => chosenSet.has(uid)).length;

    // --- Section 1 : envies de découverte de la tablée ---
    let discover = games
      .map((g) => {
        const wantersInTable = (g.wantIds || []).filter((id) => chosenSet.has(id));
        return { ...g, _wantCount: wantersInTable.length, _wanters: wantersInTable };
      })
      .filter((g) => g._wantCount > 0 && passFilters(g));
    discover.sort((a, b) => {
      if (b._wantCount !== a._wantCount) return b._wantCount - a._wantCount;
      const d = tableAvg(b) - tableAvg(a);
      if (d !== 0) return d;
      const pa = a.playCount || 0, pb = b.playCount || 0;
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name, "fr");
    });

    // --- Section 2 : jeux notés par la tablée ---
    let regular = rankGames(games, chosen, true).filter((g) => g._count > 0 && passFilters(g));
    const discoverIds = new Set(discover.map((g) => g.id));
    regular = regular.filter((g) => !discoverIds.has(g.id));

    // --- Section 3 : autres jeux disponibles (non notés par la tablée) ---
    // Classés par note générale de l'association (résout le manque de votes de la tablée).
    const usedIds = new Set([...discoverIds, ...regular.map((g) => g.id)]);
    let others = games
      .filter((g) => !usedIds.has(g.id) && passFilters(g) && tableCount(g) === 0)
      .map((g) => { const st = gameStats(g); return { ...g, _globalAvg: st.avg, _globalCount: st.count }; });
    others.sort((a, b) => {
      // mode "découverte" : on privilégie les jeux jamais joués par l'asso
      if (mode === "discovery") {
        const pa = a.playCount || 0, pb = b.playCount || 0;
        if ((pa === 0) !== (pb === 0)) return pa === 0 ? -1 : 1;
      }
      if (b._globalAvg !== a._globalAvg) return b._globalAvg - a._globalAvg;
      if (b._globalCount !== a._globalCount) return b._globalCount - a._globalCount;
      return a.name.localeCompare(b.name, "fr");
    });

    // mode "découverte" : on remonte les envies en priorité ; mode "consensus" : les notés
    if (mode === "discovery") {
      // en découverte, on ne change pas l'ordre des sections mais on pourrait pondérer ;
      // ici on garde la structure claire en 3 sections.
    }

    return { discoverGames: discover, regularGames: regular, otherGames: others };
  }, [games, chosen, players, duration, mechFilter, mode]);

  // Réinitialise la limite d'affichage quand les critères changent
  useEffect(() => { setLimit(40); }, [chosen, players, duration, mechFilter, mode]);

  return (
    <Modal open onClose={onClose} title="Classement pour votre tablée" width={620}>
      <p style={{ fontSize: 14, color: "#6e6256", margin: "0 0 16px", lineHeight: 1.5 }}>
        Sélectionnez les membres présents : le classement ne tient compte que de <b>leurs</b> notes. Idéal pour choisir un jeu qui mettra tout le monde d'accord.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
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

      {/* filtres joueurs + durée */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <select value={players} onChange={(e) => setPlayers(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
          <option value="">Nombre de joueurs : tous</option>
          <option value="1">1 joueur</option>
          <option value="2">2 joueurs</option>
          <option value="3">3 joueurs</option>
          <option value="4">4 joueurs</option>
          <option value="5">5 joueurs</option>
          <option value="6">6 joueurs</option>
          <option value="7">7+ joueurs</option>
        </select>
        <select value={duration} onChange={(e) => setDuration(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
          <option value="">Durée : toutes</option>
          <option value="30">≤ 30 min</option>
          <option value="45">≤ 45 min</option>
          <option value="60">≤ 1 h</option>
          <option value="90">≤ 1 h 30</option>
          <option value="120">≤ 2 h</option>
          <option value="121">{"> 2 h"}</option>
        </select>
        {chosen.length > 1 && <button onClick={() => setPlayers(String(Math.min(chosen.length, 7)))} style={{ background: "rgba(30,138,138,.1)", border: "none", borderRadius: 10, padding: "0 14px", cursor: "pointer", color: C.teal, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13 }}>Pour {chosen.length} joueurs</button>}
      </div>

      {/* Bascule mode : valeurs sûres (consensus) vs découverte */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#f0e8d8", borderRadius: 11, padding: 4, width: "fit-content" }}>
        {[["consensus", "🛡️ Valeurs sûres"], ["discovery", "✨ Découverte"]].map(([val, label]) => (
          <button key={val} onClick={() => setMode(val)} style={{
            padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5,
            background: mode === val ? "#fff" : "transparent", color: mode === val ? C.navy : "#9c8d79",
            boxShadow: mode === val ? "0 1px 4px rgba(0,0,0,.1)" : "none",
          }}>{label}</button>
        ))}
      </div>

      {/* Filtre mécaniques (multi-sélection) */}
      {allMechanics.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12.5, color: "#8a7c6a", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, marginBottom: 8 }}>
            Filtrer par mécaniques {mechFilter.length > 0 && <span style={{ color: C.teal }}>({mechFilter.length} sélectionnée{mechFilter.length > 1 ? "s" : ""})</span>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 110, overflowY: "auto" }}>
            {allMechanics.map((m) => {
              const active = mechFilter.includes(m);
              return (
                <button key={m} onClick={() => toggleMech(m)} style={{
                  padding: "5px 11px", borderRadius: 999, cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: 12.5,
                  border: `1.5px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : "#6e6256",
                }}>{m}</button>
              );
            })}
          </div>
          {mechFilter.length > 0 && <button onClick={() => setMechFilter([])} style={{ marginTop: 8, background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 12.5, fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>Effacer les mécaniques</button>}
        </div>
      )}

      {chosen.length === 0 ? (
        <EmptyHint icon={Users} text="Sélectionnez au moins un membre." />
      ) : (discoverGames.length === 0 && regularGames.length === 0 && otherGames.length === 0) ? (
        <EmptyHint icon={Star} text="Aucun jeu ne correspond à ces filtres." />
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          {/* Section 1 : envies de découverte de la tablée */}
          {discoverGames.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Heart size={16} fill={C.red} color={C.red} />
                <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: 0 }}>Envies de découverte ({discoverGames.length})</h4>
              </div>
              <p style={{ fontSize: 12, color: "#9c8d79", margin: "0 0 8px" }}>Jeux qu'au moins un membre de la tablée souhaite découvrir — l'occasion parfaite !</p>
              <div style={{ display: "grid", gap: 8 }}>
                {discoverGames.slice(0, limit).map((g, i) => {
                  const wanterNames = g._wanters.map((id) => users.find((u) => u.id === id)?.name).filter(Boolean).join(", ");
                  return (
                    <button key={g.id} onClick={() => onOpenGame(g.id)} style={{ display: "flex", alignItems: "center", gap: 14, background: i === 0 ? "rgba(181,40,58,.1)" : "rgba(181,40,58,.04)", border: `1px solid ${i === 0 ? "rgba(181,40,58,.3)" : "rgba(181,40,58,.15)"}`, borderRadius: 13, padding: "11px 16px", cursor: "pointer", textAlign: "left" }}>
                      <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 20, color: C.red, width: 26 }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15.5 }}>{g.name}</span>
                        <span style={{ fontSize: 12, color: "#9c8d79" }}>
                          <b style={{ color: C.red }}>{g._wantCount} envie{g._wantCount > 1 ? "s" : ""}</b> ({wanterNames}) · {g.min || "?"}{g.max && g.max !== g.min ? `-${g.max}` : ""} j.{g.time ? ` · ${g.time} min` : ""}
                        </span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.red, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 18 }}>
                        <Heart size={16} fill={C.red} /> {g._wantCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2 : classement classique sur les notes */}
          {regularGames.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Star size={16} fill={C.amber} color={C.amber} />
                <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: 0 }}>Mieux notés par la tablée ({regularGames.length})</h4>
              </div>
              <p style={{ fontSize: 12, color: "#9c8d79", margin: "0 0 8px" }}>{chosen.length} membre(s) · à note égale, les jeux les moins joués remontent.</p>
              <div style={{ display: "grid", gap: 8 }}>
                {regularGames.slice(0, limit).map((g, i) => (
                  <button key={g.id} onClick={() => onOpenGame(g.id)} style={{ display: "flex", alignItems: "center", gap: 14, background: i === 0 ? "rgba(232,163,23,.1)" : "rgba(26,58,92,.04)", border: "none", borderRadius: 13, padding: "11px 16px", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 20, color: i === 0 ? C.amber : "#b6a78f", width: 26 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15.5 }}>{g.name}</span>
                      <span style={{ fontSize: 12, color: "#9c8d79" }}>
                        {g._count} vote(s) parmi la sélection · {g.min || "?"}{g.max && g.max !== g.min ? `-${g.max}` : ""} j.{g.time ? ` · ${g.time} min` : ""}
                        {" · "}<span style={{ color: (g.playCount || 0) === 0 ? C.teal : "#9c8d79", fontWeight: (g.playCount || 0) === 0 ? 700 : 400 }}>{(g.playCount || 0) === 0 ? "jamais joué" : `joué ${g.playCount} fois`}</span>
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.amber, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 17 }}>
                      <Star size={16} fill={C.amber} /> {g._avg.toFixed(2).replace(".", ",")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 3 : autres jeux disponibles (non notés par la tablée) */}
          {otherGames.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Library size={16} color={C.teal} />
                <h4 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 15, margin: 0 }}>Autres jeux disponibles ({otherGames.length})</h4>
              </div>
              <p style={{ fontSize: 12, color: "#9c8d79", margin: "0 0 8px" }}>Jeux compatibles que la tablée n'a pas encore notés — classés par note de l'association.</p>
              <div style={{ display: "grid", gap: 8 }}>
                {otherGames.slice(0, limit).map((g, i) => (
                  <button key={g.id} onClick={() => onOpenGame(g.id)} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(30,138,138,.05)", border: "1px solid rgba(30,138,138,.12)", borderRadius: 13, padding: "11px 16px", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 18, color: "#b6a78f", width: 26 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15.5 }}>{g.name}</span>
                      <span style={{ fontSize: 12, color: "#9c8d79" }}>
                        {g._globalCount > 0 ? `${g._globalCount} vote(s) dans l'asso` : "pas encore noté"} · {g.min || "?"}{g.max && g.max !== g.min ? `-${g.max}` : ""} j.{g.time ? ` · ${g.time} min` : ""}
                        {" · "}<span style={{ color: (g.playCount || 0) === 0 ? C.teal : "#9c8d79", fontWeight: (g.playCount || 0) === 0 ? 700 : 400 }}>{(g.playCount || 0) === 0 ? "jamais joué" : `joué ${g.playCount} fois`}</span>
                      </span>
                    </span>
                    {g._globalCount > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.teal, fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 16 }}>
                        <Star size={15} fill={C.teal} /> {g._globalAvg.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bouton "Voir plus" si au moins une section dépasse la limite affichée */}
          {(discoverGames.length > limit || regularGames.length > limit || otherGames.length > limit) && (
            <button onClick={() => setLimit((l) => l + 40)} style={{
              justifySelf: "center", padding: "10px 24px", borderRadius: 12, border: `2px solid ${C.teal}`, background: "#fff", color: C.teal,
              cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 14,
            }}>Voir plus de jeux</button>
          )}
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
  const [prefillName, setPrefillName] = useState("");
  return (
    <Modal open onClose={onClose} title="Ajouter un jeu à la ludothèque" width={640}>
      {mode === "choose" && (
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ fontSize: 14, color: "#6e6256", margin: "0 0 4px", lineHeight: 1.5 }}>Comment souhaitez-vous ajouter ce jeu ? L'import récupère automatiquement la fiche (joueurs, durée, image, mécaniques) et traduit la description en français.</p>
          <SourceBtn icon={Globe} color={C.teal} title="Importer depuis BoardGameGeek" desc="Recherche dans la plus grande base mondiale + traduction auto en français." onClick={() => setMode("bgg")} />
          <SourceBtn icon={PenLine} color={C.amber} title="Saisir manuellement" desc="Remplissez vous-même la fiche du jeu (toujours disponible)." onClick={() => { setPrefillName(""); setMode("manual"); }} />
        </div>
      )}
      {mode === "bgg" && <BggImport onBack={() => setMode("choose")} onManual={(name) => { setPrefillName(name); setMode("manual"); }} onDone={async (data, msg) => { if (data) { await addGame({ ...data, source: "BoardGameGeek" }); } onClose(); setToast(msg || `« ${data?.name} » ajouté !`); }} />}
      {mode === "manual" && <ManualForm prefillName={prefillName} onBack={() => setMode("choose")} onDone={async (data, msg) => { if (data) { await addGame({ ...data, source: "manuel" }); } onClose(); setToast(msg || `« ${data?.name} » ajouté !`); }} />}
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

function BggImport({ onBack, onDone, onManual, forUpcoming = false }) {
  const { games, upcoming, users, currentUser, addOwner } = useApp();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [failed, setFailed] = useState(false); // l'import a échoué → proposer le manuel
  const [importing, setImporting] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [preview, setPreview] = useState(null);
  // Procuration : ne s'applique que pour la ludothèque (pas pour les fiches À venir).
  const [ownership, setOwnership] = useState("self");
  const [forUserIds, setForUserIds] = useState([]);
  const toggleForUser = (uid) => setForUserIds((arr) => arr.includes(uid) ? arr.filter((x) => x !== uid) : [...arr, uid]);
  const otherUsers = useMemo(() => (users || []).filter((u) => u.id !== currentUser?.id).sort((a, b) => a.name.localeCompare(b.name, "fr")), [users, currentUser]);

  // jeux déjà présents dans la base au nom proche de la recherche
  // jeux déjà présents dans la base au nom proche de la recherche
  const existing = useMemo(() => findSimilarGames(games, q), [games, q]);
  // fiches À venir au nom proche (détection inter-sections)
  const existingUpcoming = useMemo(() => findSimilarGames(upcoming || [], q), [upcoming, q]);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true); setErr(""); setFailed(false); setResults([]);
    try {
      const r = await bggSearch(q.trim());
      if (r.length === 0) setErr("Aucun résultat. Essayez un autre nom (souvent le titre anglais fonctionne mieux).");
      setResults(r);
    } catch (e) {
      setErr("BoardGameGeek est momentanément inaccessible (cela arrive parfois). Vous pouvez réessayer dans un instant, ou saisir le jeu manuellement — c'est tout aussi rapide.");
      setFailed(true);
    }
    setLoading(false);
  };

  const pick = async (id) => {
    setImporting(id); setErr(""); setFailed(false);
    try {
      const d = await bggDetails(id);
      setTranslating(true);
      // La traduction et la conversion des mécaniques ne doivent JAMAIS empêcher
      // l'affichage de l'aperçu éditable. On les protège individuellement.
      let desc = d.desc;
      try { desc = await translateText(d.desc); } catch (e) { /* on garde la VO */ }
      let mechanics = d.mechanics || [];
      try { mechanics = translateMechanics(d.mechanics); } catch (e) { /* on garde les mécaniques d'origine */ }
      setTranslating(false);
      setPreview({ ...d, desc, mechanics });
    } catch (e) {
      setErr("Impossible de récupérer cette fiche pour le moment. Réessayez ou saisissez-la manuellement.");
      setFailed(true);
      setTranslating(false);
    }
    setImporting(null);
  };

  if (preview) {
    // Helpers locaux pour modifier les champs du preview
    const updatePreview = (patch) => setPreview({ ...preview, ...patch });
    const toggleMech = (m) => {
      const arr = preview.mechanics || [];
      updatePreview({ mechanics: arr.includes(m) ? arr.filter((x) => x !== m) : [...arr, m] });
    };
    const addCustomMech = (m) => {
      const trimmed = m.trim();
      if (!trimmed) return;
      const arr = preview.mechanics || [];
      if (!arr.includes(trimmed)) updatePreview({ mechanics: [...arr, trimmed] });
    };
    return (
      <div>
        <button onClick={() => setPreview(null)} style={backLinkStyle}><ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Autre jeu</button>
        <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 16 }}><GameCover g={preview} size="lg" /></div>

        {/* Bandeau d'info : la fiche est modifiable avant validation */}
        <div style={{ background: "rgba(232,163,23,.08)", border: "1px solid rgba(232,163,23,.25)", borderRadius: 11, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#6e6256", display: "flex", alignItems: "center", gap: 8 }}>
          <Info size={15} color={C.amber} /> Vous pouvez modifier les champs ci-dessous avant de valider.
        </div>

        {/* Champs éditables */}
        <Field label="Nom du jeu"><TextInput value={preview.name || ""} onChange={(e) => updatePreview({ name: e.target.value })} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          <Field label="Année"><TextInput type="number" value={preview.year || ""} onChange={(e) => updatePreview({ year: Number(e.target.value) || "" })} /></Field>
          <Field label="Joueurs min"><TextInput type="number" value={preview.min || ""} onChange={(e) => updatePreview({ min: Number(e.target.value) || "" })} /></Field>
          <Field label="Joueurs max"><TextInput type="number" value={preview.max || ""} onChange={(e) => updatePreview({ max: Number(e.target.value) || "" })} /></Field>
          <Field label="Durée (min)"><TextInput type="number" value={preview.time || ""} onChange={(e) => updatePreview({ time: Number(e.target.value) || "" })} /></Field>
        </div>

        <Field label="Mécaniques" hint="Décochez celles avec lesquelles vous n'êtes pas d'accord, cochez-en d'autres, ou ajoutez-en de personnalisées.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[...new Set([...MECHANIC_SUGGESTIONS, ...(preview.mechanics || [])])].map((m) => {
              const active = (preview.mechanics || []).includes(m);
              return <button key={m} type="button" onClick={() => toggleMech(m)} style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : "#8a7c6a" }}>{m}</button>;
            })}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <TextInput placeholder="Ajouter une mécanique personnalisée et appuyer sur Entrée…" onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addCustomMech(e.target.value); e.target.value = ""; }
            }} />
          </div>
        </Field>

        <Field label="Description">
          <textarea rows={5} value={preview.desc || ""} onChange={(e) => updatePreview({ desc: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} />
          <div style={{ background: "rgba(30,138,138,.08)", borderRadius: 8, padding: "6px 10px", marginTop: 6, fontSize: 12, color: C.teal, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Globe size={12} /> Description traduite automatiquement en français
          </div>
        </Field>

        <Field label="Lien Ludum (facultatif)" hint="Collez l'adresse de la fiche du jeu sur Ludum. Laissez vide : un bouton de recherche par nom sera proposé automatiquement.">
          <TextInput value={preview.ludumUrl || ""} onChange={(e) => updatePreview({ ludumUrl: e.target.value })} placeholder="https://www.ludum.fr/..." />
        </Field>

        {/* Bloc : qui possède ce jeu ? (uniquement pour la ludothèque, pas pour À venir) */}
        {!forUpcoming && (
          <Field label="Qui possède ce jeu ?" hint="Le membre concerné devra confirmer la possession dans Ma ludothèque.">
            <div style={{ display: "grid", gap: 8 }}>
              {[
                { v: "self",  t: "Je le possède" },
                { v: "other", t: "Un autre membre le possède" },
                { v: "both",  t: "Plusieurs membres le possèdent (dont moi)" },
              ].map((opt) => {
                const active = ownership === opt.v;
                return (
                  <button key={opt.v} type="button" onClick={() => setOwnership(opt.v)}
                    style={{ display: "flex", gap: 12, alignItems: "center", padding: "9px 14px", borderRadius: 11, cursor: "pointer", textAlign: "left", border: `2px solid ${active ? C.teal : "#e6dcc9"}`, background: active ? "rgba(30,138,138,.06)" : "#fff" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? C.teal : "#c5b69c"}`, flexShrink: 0, display: "grid", placeItems: "center" }}>
                      {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal }} />}
                    </span>
                    <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>{opt.t}</span>
                  </button>
                );
              })}
            </div>
            {(ownership === "other" || ownership === "both") && (
              <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(232,163,23,.08)", borderRadius: 11 }}>
                <span style={{ display: "block", fontSize: 12.5, color: "#6e6256", marginBottom: 8 }}>Sélectionnez le ou les membres propriétaires :</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {otherUsers.map((u) => {
                    const active = forUserIds.includes(u.id);
                    return (
                      <button key={u.id} type="button" onClick={() => toggleForUser(u.id)}
                        style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.amber : "#e6dcc9"}`, background: active ? C.amber : "#fff", color: active ? "#fff" : "#8a7c6a" }}>
                        {active && <Check size={12} style={{ verticalAlign: "-1px", marginRight: 3 }} />}{u.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Field>
        )}

        <Btn full size="lg" variant="teal" onClick={() => {
          if (!forUpcoming && ownership === "other" && forUserIds.length === 0) { setErr("Sélectionnez au moins un membre, ou choisissez « Je le possède »."); return; }
          onDone({
            ...preview,
            selfOwns: forUpcoming ? true : (ownership === "self" || ownership === "both"),
            forUserIds: forUpcoming ? [] : ((ownership === "other" || ownership === "both") ? forUserIds : []),
          });
        }}><Plus size={18} /> {forUpcoming ? "Ajouter aux jeux à venir" : "Ajouter à ma ludothèque"}</Btn>
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

      {/* jeux déjà présents dans la ludothèque (évite les doublons) */}
      {existing.length > 0 && (
        <div style={{ background: "rgba(30,138,138,.08)", border: "1px solid rgba(30,138,138,.25)", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 14, display: "block", marginBottom: 8 }}>Déjà dans la ludothèque</span>
          <div style={{ display: "grid", gap: 8 }}>
            {existing.slice(0, 4).map((g) => {
              const alreadyMine = (g.ownerIds || []).includes(currentUser?.id);
              return (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: g.img ? `center/cover url("${g.img}")` : `linear-gradient(135deg,${C.teal},${C.purple})`, display: "grid", placeItems: "center" }}>
                    {!g.img && <span style={{ color: "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 11 }}>{g.name.slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5 }}>{g.name}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "#9c8d79" }}>chez {(g.owners || []).map((o) => o.name).join(", ") || g.ownerName}</span>
                  </span>
                  {alreadyMine
                    ? <span style={{ fontSize: 12, color: C.teal, fontWeight: 700, fontFamily: "'Fredoka',sans-serif", padding: "0 6px" }}>✓ Vous l'avez</span>
                    : <Btn size="sm" variant="teal" onClick={async () => { await addOwner(g.id); onDone(null, "Ajouté à votre ludothèque !"); }}><Plus size={13} /> Je l'ai aussi</Btn>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* fiches À venir au nom proche (détection inter-sections) */}
      {existingUpcoming.length > 0 && (
        <div style={{ background: "rgba(232,163,23,.08)", border: "1px solid rgba(232,163,23,.3)", borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Sparkles size={15} color={C.amber} />
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.amber, fontSize: 14 }}>Aussi en « À venir »</span>
          </div>
          <p style={{ fontSize: 12, color: "#6e6256", margin: "0 0 8px" }}>Astuce : vous pouvez aussi utiliser le bouton <b>« Je l'ai ! »</b> depuis l'onglet À venir.</p>
          <div style={{ display: "grid", gap: 4 }}>
            {existingUpcoming.slice(0, 3).map((u) => (
              <div key={u.id} style={{ fontSize: 13, color: "#5e5346", padding: "3px 8px", background: "#fff", borderRadius: 7 }}>
                • <b>{u.name}</b>{u.year ? ` (${u.year})` : ""}
              </div>
            ))}
          </div>
        </div>
      )}
      {failed && (
        <Btn full variant="amber" onClick={() => onManual(q.trim())} style={{ marginBottom: 14 }}>
          <PenLine size={16} /> Saisir « {q.trim() || "ce jeu"} » manuellement
        </Btn>
      )}
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

function ManualForm({ onBack, onDone, prefillName = "" }) {
  const { games, upcoming, users, currentUser, addOwner } = useApp();
  const [f, setF] = useState({ name: prefillName, year: "", min: "", max: "", time: "", desc: "", img: "", mechanics: [], ludumUrl: "" });
  const [err, setErr] = useState("");
  const [dismissed, setDismissed] = useState(false); // l'utilisateur a écarté la suggestion de doublon
  const [busy, setBusy] = useState(false); // anti double-clic : verrouille le bouton pendant la création
  // Procuration : "self" = je le possède / "other" = quelqu'un d'autre le possède.
  // forUserIds = les autres membres pour qui on déclare la possession.
  const [ownership, setOwnership] = useState("self");
  const [forUserIds, setForUserIds] = useState([]);
  const toggleMech = (m) => setF((s) => ({ ...s, mechanics: s.mechanics.includes(m) ? s.mechanics.filter((x) => x !== m) : [...s.mechanics, m] }));
  const toggleForUser = (uid) => setForUserIds((arr) => arr.includes(uid) ? arr.filter((x) => x !== uid) : [...arr, uid]);
  // Membres sélectionnables (tous sauf moi)
  const otherUsers = useMemo(() => (users || []).filter((u) => u.id !== currentUser?.id).sort((a, b) => a.name.localeCompare(b.name, "fr")), [users, currentUser]);

  // jeux existants au nom proche (qu'on les possède ou non)
  const similar = useMemo(() => {
    if (dismissed) return [];
    return findSimilarGames(games, f.name);
  }, [games, f.name, dismissed]);
  // fiches À venir au nom proche (détection inter-sections)
  const similarUpcoming = useMemo(() => {
    if (dismissed) return [];
    return findSimilarGames(upcoming || [], f.name);
  }, [upcoming, f.name, dismissed]);

  const submit = async () => {
    if (busy) return;
    if (!f.name.trim()) { setErr("Le nom du jeu est obligatoire."); return; }
    if (ownership === "other" && forUserIds.length === 0) {
      setErr("Sélectionnez au moins un membre qui possède ce jeu, ou choisissez « Je le possède »."); return;
    }
    setBusy(true);
    await onDone({
      ...f, name: f.name.trim(),
      year: Number(f.year) || "", min: Number(f.min) || "", max: Number(f.max) || "", time: Number(f.time) || "",
      selfOwns: ownership === "self" || ownership === "both",
      forUserIds: (ownership === "other" || ownership === "both") ? forUserIds : [],
    });
  };
  return (
    <div>
      <button onClick={onBack} style={backLinkStyle}><ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Retour</button>
      <Field label="Nom du jeu *"><TextInput value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setDismissed(false); }} placeholder="Ex. Les Aventuriers du Rail" autoFocus /></Field>

      {/* encart : ce jeu existe peut-être déjà */}
      {similar.length > 0 && (
        <div style={{ background: "rgba(30,138,138,.08)", border: "1px solid rgba(30,138,138,.25)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.teal, fontSize: 14 }}>Ce jeu existe peut-être déjà</span>
            <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9c8d79", fontSize: 12.5 }}>Ignorer</button>
          </div>
          <p style={{ fontSize: 12.5, color: "#6e6256", margin: "0 0 10px" }}>Inutile de recréer une fiche : cliquez sur « Je l'ai aussi » pour vous rattacher au jeu existant.</p>
          <div style={{ display: "grid", gap: 8 }}>
            {similar.slice(0, 5).map((g) => {
              const alreadyMine = (g.ownerIds || []).includes(currentUser?.id);
              return (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: g.img ? `center/cover url("${g.img}")` : `linear-gradient(135deg,${C.teal},${C.purple})`, display: "grid", placeItems: "center" }}>
                    {!g.img && <span style={{ color: "#fff", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 12 }}>{g.name.slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>{g.name}</span>
                    <span style={{ display: "block", fontSize: 12, color: "#9c8d79" }}>{g.year ? `${g.year} · ` : ""}chez {(g.owners || []).map((o) => o.name).join(", ") || g.ownerName}</span>
                  </span>
                  {alreadyMine
                    ? <span style={{ fontSize: 12, color: C.teal, fontWeight: 700, fontFamily: "'Fredoka',sans-serif", padding: "0 8px" }}>✓ Vous l'avez</span>
                    : <Btn size="sm" variant="teal" onClick={async () => { await addOwner(g.id); onDone(null, "Ajouté à votre ludothèque !"); }}><Plus size={13} /> Je l'ai aussi</Btn>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* encart : fiches À venir au nom proche (détection inter-sections) */}
      {similarUpcoming.length > 0 && (
        <div style={{ background: "rgba(232,163,23,.08)", border: "1px solid rgba(232,163,23,.3)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Sparkles size={15} color={C.amber} />
            <span style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.amber, fontSize: 14 }}>Une fiche « À venir » existe</span>
          </div>
          <p style={{ fontSize: 12.5, color: "#6e6256", margin: "0 0 10px" }}>Astuce : depuis la fiche « À venir » du jeu, cliquez sur <b>« Je l'ai ! »</b> — votre ludothèque sera créée en un clic, avec toutes les infos déjà remplies.</p>
          <div style={{ display: "grid", gap: 6 }}>
            {similarUpcoming.slice(0, 3).map((u) => (
              <div key={u.id} style={{ fontSize: 13.5, color: "#5e5346", padding: "4px 8px", background: "#fff", borderRadius: 8 }}>
                • <b>{u.name}</b>{u.year ? ` (${u.year})` : ""}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <Field label="Année"><TextInput type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></Field>
        <Field label="Joueurs min"><TextInput type="number" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
        <Field label="Joueurs max"><TextInput type="number" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></Field>
        <Field label="Durée (min)"><TextInput type="number" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
      </div>
      <Field label="Mécaniques" hint="Cliquez pour sélectionner, ou ajoutez vos propres mécaniques ci-dessous.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {[...new Set([...MECHANIC_SUGGESTIONS, ...(f.mechanics || [])])].map((m) => {
            const active = f.mechanics.includes(m);
            return <button key={m} type="button" onClick={() => toggleMech(m)} style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.purple : "#e6dcc9"}`, background: active ? C.purple : "#fff", color: active ? "#fff" : "#8a7c6a" }}>{m}</button>;
          })}
        </div>
        <div style={{ marginTop: 8 }}>
          <TextInput placeholder="Ajouter une mécanique personnalisée et appuyer sur Entrée…" onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = e.target.value.trim();
              if (v && !f.mechanics.includes(v)) setF({ ...f, mechanics: [...f.mechanics, v] });
              e.target.value = "";
            }
          }} />
        </div>
      </Field>
      <Field label="Image" hint="Facultatif — adresse web ou import depuis votre appareil"><ImageField value={f.img} onChange={(v) => setF({ ...f, img: v })} /></Field>
      <Field label="Présentation & mécaniques"><textarea rows={4} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="Décrivez le jeu, son thème, ses mécaniques..." style={{ ...inputStyle, resize: "vertical" }} /></Field>
      <Field label="Lien Ludum (facultatif)" hint="Collez l'adresse de la fiche du jeu sur Ludum. Laissez vide : un bouton de recherche par nom sera proposé automatiquement.">
        <TextInput value={f.ludumUrl} onChange={(e) => setF({ ...f, ludumUrl: e.target.value })} placeholder="https://www.ludum.fr/..." />
      </Field>

      {/* Bloc : qui possède ce jeu ? (procuration possible) */}
      <Field label="Qui possède ce jeu ?" hint="Vous pouvez créer cette fiche pour vous, pour un autre membre, ou les deux. Le membre concerné devra confirmer la possession dans Ma ludothèque.">
        <div style={{ display: "grid", gap: 8 }}>
          {[
            { v: "self",  t: "Je le possède",                                d: "Vous êtes inscrit·e comme propriétaire." },
            { v: "other", t: "Un autre membre le possède",                   d: "La fiche sera créée à son nom, à confirmer par sa part." },
            { v: "both",  t: "Plusieurs membres le possèdent (dont moi)",    d: "Vous et d'autres membres êtes propriétaires." },
          ].map((opt) => {
            const active = ownership === opt.v;
            return (
              <button key={opt.v} type="button" onClick={() => setOwnership(opt.v)}
                style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px", borderRadius: 11, cursor: "pointer", textAlign: "left", border: `2px solid ${active ? C.teal : "#e6dcc9"}`, background: active ? "rgba(30,138,138,.06)" : "#fff" }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${active ? C.teal : "#c5b69c"}`, marginTop: 1, flexShrink: 0, display: "grid", placeItems: "center" }}>
                  {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal }} />}
                </span>
                <span>
                  <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>{opt.t}</span>
                  <span style={{ display: "block", fontSize: 12, color: "#8a7c6a", marginTop: 2 }}>{opt.d}</span>
                </span>
              </button>
            );
          })}
        </div>
        {(ownership === "other" || ownership === "both") && (
          <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(232,163,23,.08)", borderRadius: 11 }}>
            <span style={{ display: "block", fontSize: 12.5, color: "#6e6256", marginBottom: 8 }}>Sélectionnez le ou les membres propriétaires :</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {otherUsers.map((u) => {
                const active = forUserIds.includes(u.id);
                return (
                  <button key={u.id} type="button" onClick={() => toggleForUser(u.id)}
                    style={{ padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 12.5, border: `2px solid ${active ? C.amber : "#e6dcc9"}`, background: active ? C.amber : "#fff", color: active ? "#fff" : "#8a7c6a" }}>
                    {active && <Check size={12} style={{ verticalAlign: "-1px", marginRight: 3 }} />}{u.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Field>

      {err && <div style={{ background: "rgba(181,40,58,.1)", color: C.red, padding: "10px 14px", borderRadius: 11, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>{err}</div>}
      <Btn full size="lg" variant="amber" onClick={submit} disabled={busy}>{busy ? <Loader2 size={18} className="aladj-spin" /> : <><Plus size={18} /> Ajouter le jeu</>}</Btn>
    </div>
  );
}

/* =============================================================================
   PAGE — MA LUDOTHÈQUE (membres connectés) + export Excel
   ============================================================================= */
// Section "Ma famille" : foyer partageant une ludothèque commune
function FamilySection({ setToast }) {
  const { household, users, currentUser, inviteToHousehold, acceptHouseholdInvite, declineHouseholdInvite, cancelHouseholdInvite, leaveHousehold } = useApp();
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const nameById = useMemo(() => Object.fromEntries((users || []).map((u) => [u.id, u.name])), [users]);
  const memberIds = household?.memberIds || [];
  const otherMembers = memberIds.filter((id) => id !== currentUser?.id);
  const received = household?.invitesReceived || [];
  const sent = household?.invitesSent || [];
  const sentIds = sent.map((i) => i.invitee_id);
  const inFamily = otherMembers.length > 0;

  const invitable = useMemo(() => (users || [])
    .filter((u) => u.id !== currentUser?.id && !memberIds.includes(u.id) && !sentIds.includes(u.id) && !u.banned)
    .sort((a, b) => a.name.localeCompare(b.name, "fr")), [users, memberIds, sentIds, currentUser]);

  const run = async (fn, ok) => {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r?.error) setToast(r.error);
    else if (ok) setToast(ok);
    return r;
  };

  // On masque entièrement la section s'il n'y a rien à montrer (pas de foyer, aucune invitation)
  if (!currentUser) return null;
  const hasContent = inFamily || received.length > 0 || sent.length > 0;

  return (
    <div style={{ background: "rgba(107,58,122,.06)", border: `2px solid ${C.purple}`, borderRadius: 16, padding: "16px 20px", marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: hasContent ? 12 : 6, flexWrap: "wrap" }}>
        <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={18} color={C.purple} /> Ma famille
        </h3>
        <Btn size="sm" variant="soft" onClick={() => setShowPicker(true)}><UserPlus size={15} /> Inviter un membre</Btn>
      </div>

      <p style={{ fontSize: 12.5, color: "#6e6256", margin: "0 0 12px", lineHeight: 1.5 }}>
        Les membres d'une même famille partagent une ludothèque commune : tous les jeux du foyer apparaissent ici et évoluent ensemble. Chacun garde ses propres notes et avis.
      </p>

      {received.map((i) => (
        <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 11, background: "#fff", border: `1px solid ${C.purple}`, marginBottom: 8, flexWrap: "wrap" }}>
          <Mail size={16} color={C.purple} />
          <span style={{ flex: 1, minWidth: 140, fontSize: 13.5, color: "#5e5346" }}>
            <strong>{nameById[i.inviter_id] || "Un membre"}</strong> vous invite à rejoindre sa famille
          </span>
          <Btn size="sm" variant="teal" disabled={busy} onClick={() => run(() => acceptHouseholdInvite(i.id), "Vous avez rejoint la famille.")}><Check size={15} /> Accepter</Btn>
          <Btn size="sm" variant="soft" disabled={busy} onClick={() => run(() => declineHouseholdInvite(i.id))}><X size={15} /> Refuser</Btn>
        </div>
      ))}

      {memberIds.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: (sent.length || inFamily) ? 12 : 0 }}>
          {memberIds.map((id) => (
            <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e6dcc9", borderRadius: 999, padding: "5px 12px", fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Fredoka',sans-serif" }}>
              <Users size={13} color={C.purple} /> {id === currentUser?.id ? "Vous" : (nameById[id] || "Membre")}
            </span>
          ))}
        </div>
      )}

      {sent.map((i) => (
        <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 11, background: "rgba(255,255,255,.6)", border: "1px dashed #cdbfa8", marginBottom: 8 }}>
          <Clock size={15} color="#a89a86" />
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "#6e6256" }}>
            Invitation envoyée à <strong>{nameById[i.invitee_id] || "un membre"}</strong> — en attente
          </span>
          <Btn size="sm" variant="ghost" disabled={busy} onClick={() => run(() => cancelHouseholdInvite(i.id))}><X size={14} /> Annuler</Btn>
        </div>
      ))}

      {inFamily && (confirmLeave ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <span style={{ fontSize: 13, color: C.red, fontWeight: 600 }}>Quitter la famille ? Vos jeux redeviendront les vôtres uniquement.</span>
          <Btn size="sm" variant="red" disabled={busy} onClick={async () => { await run(() => leaveHousehold(), "Vous avez quitté la famille."); setConfirmLeave(false); }}><LogOut size={14} /> Confirmer</Btn>
          <Btn size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmLeave(false)}>Annuler</Btn>
        </div>
      ) : (
        <Btn size="sm" variant="ghost" onClick={() => setConfirmLeave(true)}><LogOut size={14} /> Quitter la famille</Btn>
      ))}

      {showPicker && (
        <Modal open onClose={() => setShowPicker(false)} title="Inviter un membre dans la famille" width={460}>
          {invitable.length === 0 ? (
            <p style={{ color: "#6e6256", fontSize: 14, margin: 0 }}>Aucun membre disponible à inviter pour le moment.</p>
          ) : (
            <div style={{ display: "grid", gap: 6, maxHeight: 380, overflowY: "auto" }}>
              {invitable.map((m) => (
                <button key={m.id} disabled={busy} onClick={async () => { const r = await run(() => inviteToHousehold(m.id), "Invitation envoyée."); if (!r?.error) setShowPicker(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 11, border: "1px solid #e6dcc9", background: "#fff", cursor: "pointer", textAlign: "left", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14 }}>
                  <UserPlus size={16} color={C.purple} /> {m.name}
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function MyLudoPage({ setToast, setPage }) {
  const { games, currentUser, users, household, events, setShareLibrary, toggleGameShared, confirmOwnership, declineOwnership, confirmEventInvite, declineEventInvite, dismissedIds, dismissReco, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useApp();
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [q, setQ] = useState("");
  const [mech, setMech] = useState("");
  const [players, setPlayers] = useState("");
  const [duration, setDuration] = useState("");
  const [year, setYear] = useState("");
  const [wantFilter, setWantFilter] = useState("");
  const [sort, setSort] = useState("alpha");
  const [view, setView] = useState("grid"); // "grid" | "list"
  const [showBoth, setShowBoth] = useState(false); // afficher moyenne + ma note simultanément sur les cartes

  // Possessions en attente : jeux où je suis listé comme propriétaire mais avec confirmed=false.
  // J'ai besoin de confirmer ou de refuser ces déclarations.
  const myPending = useMemo(
    () => games.filter((g) => (g.pendingOwners || []).some((o) => o.id === currentUser?.id)),
    [games, currentUser]
  );

  const householdIds = useMemo(() => {
    const ids = household?.memberIds || [];
    return ids.length ? ids : (currentUser ? [currentUser.id] : []);
  }, [household, currentUser]);
  const nameById = useMemo(() => Object.fromEntries((users || []).map((u) => [u.id, u.name])), [users]);
  // Étiquette du propriétaire réel d'un jeu du foyer (null si le jeu est aussi à moi)
  const familyOwnerLabel = useCallback((g) => {
    if (!(household?.memberIds || []).length) return null;
    if ((g.ownerIds || []).includes(currentUser?.id)) return null;
    const other = (g.ownerIds || []).find((id) => householdIds.includes(id));
    return other ? (nameById[other] || "un proche") : null;
  }, [household, householdIds, nameById, currentUser]);
  // Ma ludothèque = mes jeux + ceux des membres de mon foyer (union, calculée à l'affichage)
  const allMine = useMemo(() => games.filter((g) => (g.ownerIds || []).some((id) => householdIds.includes(id))), [games, householdIds]);
  const [inviteBusy, setInviteBusy] = useState(false);
  // Invitations à des moments jeux : lignes event_guests où je suis le membre concerné (en attente)
  const myEventInvites = useMemo(() => {
    if (!currentUser) return [];
    const out = [];
    (events || []).forEach((e) => (e.guests || []).forEach((g) => { if (g.memberId === currentUser.id) out.push({ ev: e, guest: g }); }));
    return out.sort((a, b) => (a.ev.date || "").localeCompare(b.ev.date || ""));
  }, [events, currentUser]);
  const runInvite = async (fn, ok) => {
    setInviteBusy(true);
    const r = await fn();
    setInviteBusy(false);
    if (r?.error) setToast(r.error);
    else if (ok) setToast(ok);
  };
  // Nombre d'extensions que le membre possède (à travers tous les jeux de l'association)
  const myExtCount = useMemo(() => {
    let n = 0;
    games.forEach((g) => (g.extensions || []).forEach((x) => { if ((x.ownerIds || []).some((id) => householdIds.includes(id))) n++; }));
    return n;
  }, [games, householdIds]);
  const myMechanics = useMemo(() => {
    const s = new Set();
    allMine.forEach((g) => (g.mechanics || []).forEach((m) => s.add(m)));
    return [...s].sort((a, b) => a.localeCompare(b, "fr"));
  }, [allMine]);

  // Années présentes dans ma ludothèque + flag pour les jeux sans année
  const { allYears: myYears, hasNoYear: myHasNoYear } = useMemo(() => {
    const s = new Set();
    let none = false;
    allMine.forEach((g) => {
      const y = Number(g.year) || 0;
      if (y > 0) s.add(y);
      else none = true;
    });
    return { allYears: [...s].sort((a, b) => b - a), hasNoYear: none };
  }, [allMine]);

  const mine = useMemo(() => {
    let list = allMine.filter((g) => {
      const okQ = !q || g.name.toLowerCase().includes(q.toLowerCase());
      const okM = !mech || (g.mechanics || []).includes(mech);
      let okP = true;
      if (players) {
        const want = Number(players);
        const min = Number(g.min) || 1;
        const max = g.max ? Number(g.max) : Infinity;
        okP = (players === "7") ? max >= 7 : (want >= min && want <= max);
      }
      let okD = true;
      if (duration) {
        const t = Number(g.time) || 0;
        if (duration === "121") okD = t > 120;
        else okD = t > 0 && t <= Number(duration);
      }
      let okY = true;
      if (year) {
        const y = Number(g.year) || 0;
        if (year === "none") okY = !g.year || y === 0;
        else okY = y === Number(year);
      }
      let okW = true;
      if (wantFilter) {
        const wantIds = g.wantIds || [];
        if (wantFilter === "mine") okW = currentUser && wantIds.includes(currentUser.id);
        else if (wantFilter === "any") okW = wantIds.length > 0;
        else if (wantFilter === "none") okW = wantIds.length === 0;
      }
      return okQ && okM && okP && okD && okY && okW;
    });
    if (sort === "alpha") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    else if (sort === "note") list = rankGames(list); // note générale
    else if (sort === "myNote") list = [...list].sort((a, b) => (b.ratings?.[currentUser?.id] || 0) - (a.ratings?.[currentUser?.id] || 0));
    else if (sort === "recent") list = [...list].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    else if (sort === "wants") list = [...list].sort((a, b) => (b.wantIds?.length || 0) - (a.wantIds?.length || 0));
    return list;
  }, [allMine, q, mech, players, duration, year, wantFilter, sort, currentUser]);

  const myRatingsCount = useMemo(() => games.filter((g) => g.ratings?.[currentUser?.id]).length, [games, currentUser]);
  const recommendations = useMemo(() => recommendGames(games, currentUser?.id, dismissedIds), [games, currentUser, dismissedIds]);

  const exportExcel = async () => {
    // Chargement à la demande de la lib XLSX (≈ 200 ko) : on ne paie pas son coût au démarrage,
    // uniquement quand l'utilisateur déclenche réellement un export.
    setToast("Préparation de l'export…");
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    // Les descriptions ne sont pas chargées dans le listing (allègement Egress).
    // On les récupère ici, uniquement pour mes jeux, juste avant l'export.
    const descById = {};
    try {
      const ids = allMine.map((g) => g.id);
      if (ids.length > 0) {
        const { data: descRows } = await supabase.from("games").select("id,description").in("id", ids);
        (descRows || []).forEach((r) => { descById[r.id] = r.description || ""; });
      }
    } catch (e) { /* en cas d'échec, on exporte sans les descriptions */ }

    // Feuille 1 : ma ludothèque détaillée
    const rows = allMine.map((g) => {
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
        "Présentation": (descById[g.id] || g.desc || "").replace(/\n/g, " "),
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

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={Library} color={C.teal} n={mine.length} label="jeux apportés" />
        <StatCard icon={Package} color={C.red} n={myExtCount} label={myExtCount > 1 ? "extensions" : "extension"} />
        <StatCard icon={Star} color={C.amber} n={myRatingsCount} label="jeux notés" />
        <StatCard icon={currentUser.role === "decideur" ? Crown : Heart} color={C.purple} n={currentUser.role === "decideur" ? "Décisionnaire" : "Membre"} label="statut" small />
      </div>

      {myEventInvites.length > 0 && (
        <div style={{ background: "rgba(232,163,23,.08)", border: `2px solid ${C.amber}`, borderRadius: 16, padding: "16px 20px", marginBottom: 22 }}>
          <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={18} color={C.amber} /> Mes invitations aux moments
          </h3>
          <p style={{ fontSize: 12.5, color: "#6e6256", margin: "0 0 12px", lineHeight: 1.5 }}>
            On vous a ajouté à ces moments jeux. Confirmez votre venue pour apparaître comme participant (sinon vous restez affiché « en attente »).
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {myEventInvites.map(({ ev, guest }) => (
              <div key={guest.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 11, background: "#fff", border: `1px solid ${C.amber}`, flexWrap: "wrap" }}>
                <Calendar size={16} color={C.amber} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 150, fontSize: 13.5, color: "#5e5346" }}>
                  Moment du <strong>{formatDateFr(ev.date)}</strong> à {ev.time}{ev.online ? " (en ligne)" : (ev.place ? ` — ${ev.place}` : "")}
                </span>
                <Btn size="sm" variant="teal" disabled={inviteBusy} onClick={() => runInvite(() => confirmEventInvite(guest.id), "Participation confirmée !")}><Check size={15} /> Je viens</Btn>
                <Btn size="sm" variant="soft" disabled={inviteBusy} onClick={() => runInvite(() => declineEventInvite(guest.id))}><X size={15} /> Décliner</Btn>
              </div>
            ))}
          </div>
        </div>
      )}

      <FamilySection setToast={setToast} />

      {/* Notifications récentes (commentaires, envies de découverte sur mes jeux/moments) */}
      {notifications.length > 0 && (() => {
        const unreadCount = notifications.filter((n) => !n.read).length;
        const shown = notifications.slice(0, 12); // on affiche les 12 plus récentes
        const iconFor = (t) => t === "game_comment" ? PenLine : (t === "event_comment" || t === "event_invite") ? Calendar : t === "discovery" ? Heart : (t === "household_invite" || t === "household_accepted" || t === "household_declined") ? Users : Info;
        return (
          <div style={{ background: "rgba(30,138,138,.07)", border: `2px solid ${C.teal}`, borderRadius: 16, padding: "16px 20px", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} color={C.teal} /> Notifications
                {unreadCount > 0 && <span style={{ background: C.red, color: "#fff", borderRadius: 999, fontSize: 12, padding: "1px 9px", fontWeight: 700 }}>{unreadCount}</span>}
              </h3>
              {unreadCount > 0 && <Btn size="sm" variant="soft" onClick={() => markAllNotificationsRead()}>Tout marquer comme lu</Btn>}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {shown.map((n) => {
                const Icon = iconFor(n.type);
                return (
                  <div key={n.id} role="button" tabIndex={0} onClick={() => {
                    markNotificationRead(n.id);
                    if (n.linkKind === "game" && n.linkId) setSelected(n.linkId);
                    else if (n.linkKind === "event") setPage("soirees");
                  }} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 11, textAlign: "left", cursor: "pointer",
                    background: n.read ? "#fff" : "rgba(30,138,138,.1)", border: n.read ? "1px solid #ece2d0" : `1px solid ${C.teal}`,
                  }}>
                    <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: n.read ? "#f0e8d8" : "rgba(30,138,138,.18)", display: "grid", placeItems: "center" }}>
                      <Icon size={15} color={n.read ? "#9c8d79" : C.teal} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 13.5, color: "#5e5346", lineHeight: 1.4 }}>{n.message}</span>
                      <span style={{ display: "block", fontSize: 11, color: "#a89a86", marginTop: 1 }}>{timeAgoFr(n.createdAt)}</span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.red }} />}
                      <button title="Supprimer cette notification" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                        style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "#a89a86", display: "grid", placeItems: "center", borderRadius: 6 }}>
                        <X size={15} />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Possessions à confirmer (déclarées par d'autres membres) */}
      {myPending.length > 0 && (
        <div style={{ background: "rgba(232,163,23,.1)", border: `2px solid ${C.amber}`, borderRadius: 16, padding: "16px 20px", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Info size={18} color={C.amber} />
            <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, fontSize: 17, margin: 0 }}>
              {myPending.length === 1 ? "Une possession à confirmer" : `${myPending.length} possessions à confirmer`}
            </h3>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {myPending.map((g) => {
              const pending = (g.pendingOwners || []).find((o) => o.id === currentUser.id);
              const declarer = pending?.declaredByName || "un membre";
              return (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#fff", borderRadius: 11, flexWrap: "wrap" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 9, flexShrink: 0, background: g.img ? `center/cover url("${g.img}")` : `linear-gradient(135deg,${C.teal},${C.purple})` }} />
                  <span style={{ flex: 1, minWidth: 200, fontSize: 13.5, color: "#5e5346" }}>
                    <b style={{ color: C.navy, fontFamily: "'Fredoka',sans-serif" }}>{declarer}</b> a indiqué que vous possédiez <b style={{ color: C.navy }}>{g.name}</b>.
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="teal" onClick={async () => { await confirmOwnership(g.id); setToast(`« ${g.name} » confirmé dans votre ludothèque.`); }}><Check size={14} /> Confirmer</Btn>
                    <Btn size="sm" variant="danger" onClick={async () => { await declineOwnership(g.id); setToast("Possession refusée."); }}><X size={14} /> Supprimer</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interrupteur global de partage de la ludothèque */}
      <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14, background: currentUser.shareLibrary !== false ? "rgba(30,138,138,.08)" : "rgba(181,40,58,.07)", border: "1px solid #ece2d0", marginBottom: 28, cursor: "pointer" }}>
        <input type="checkbox" checked={currentUser.shareLibrary !== false} onChange={(e) => setShareLibrary(e.target.checked)} style={{ width: 20, height: 20, accentColor: C.teal, flexShrink: 0 }} />
        <span>
          <span style={{ display: "block", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: C.navy, fontSize: 15 }}>
            {currentUser.shareLibrary !== false ? "Ma ludothèque est partagée avec l'association" : "Ma ludothèque est privée"}
          </span>
          <span style={{ display: "block", fontSize: 13, color: "#8a7c6a", marginTop: 2 }}>
            {currentUser.shareLibrary !== false
              ? "Vos jeux apparaissent dans la ludothèque commune. Vous pouvez en exclure certains individuellement ci-dessous."
              : "Aucun de vos jeux n'apparaît dans la ludothèque commune, quels que soient les réglages par jeu."}
          </span>
        </span>
      </label>

      {/* Recommandations : jeux qui pourraient plaire */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <SectionTitle kicker="Suggestions" title="Des jeux qui pourraient vous plaire" noMargin />
          <p style={{ fontSize: 13.5, color: "#8a7c6a", margin: "8px 0 16px" }}>D'après vos notes, les goûts des membres proches de vous, les mécaniques et formats que vous appréciez, et les envies de découverte.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
            {recommendations.map((g) => {
              const st = gameStats(g);
              return (
                <div key={g.id} style={{ position: "relative", border: "1px solid #efe6d6", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
                  <button onClick={() => setSelected(g.id)} style={{ textAlign: "left", border: "none", background: "none", cursor: "pointer", padding: 0, width: "100%", display: "block" }}>
                    <GameCover g={g} />
                    <div style={{ padding: "9px 11px" }}>
                      <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 13.5, lineHeight: 1.2 }}>{g.name}</div>
                      <div style={{ fontSize: 11.5, color: "#9c8d79", marginTop: 3 }}>chez {(g.owners && g.owners.length ? g.owners[0].name : g.ownerName)}{st.count > 0 ? ` · ★ ${st.avg.toFixed(2).replace(".", ",")}` : ""}</div>
                      {g._recoReason && (
                        <div style={{ marginTop: 6, fontSize: 10.5, color: C.teal, background: "rgba(30,138,138,.08)", borderRadius: 6, padding: "3px 7px", lineHeight: 1.3, display: "inline-block" }}>
                          {g._recoReason}
                        </div>
                      )}
                    </div>
                  </button>
                  {/* Bouton "ça ne m'intéresse pas" : retire définitivement ce jeu des suggestions */}
                  <button onClick={() => { dismissReco(g.id); setToast("Suggestion masquée — on ne vous la proposera plus."); }}
                    title="Ça ne m'intéresse pas" style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(18,41,63,.55)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", backdropFilter: "blur(2px)" }}>
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {allMine.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(26,58,92,.03)", borderRadius: 20, border: "2px dashed #e0d4bf" }}>
          <Gamepad2 size={48} color="#cdb9a0" />
          <h3 style={{ fontFamily: "'Fredoka',sans-serif", color: C.navy, marginTop: 14, marginBottom: 6 }}>Votre ludothèque est vide</h3>
          <p style={{ color: "#8a7c6a", marginBottom: 20 }}>Ajoutez vos jeux : ils enrichiront la ludothèque de l'association.</p>
          <Btn variant="amber" size="lg" onClick={() => setShowAdd(true)}><Plus size={18} /> Ajouter mon premier jeu</Btn>
        </div>
      ) : (
        <>
          <RatingScaleNote />
          {/* recherche + filtres + tri */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={18} color="#b6a78f" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans mes jeux..." style={{ paddingLeft: 42 }} />
            </div>
            <select value={mech} onChange={(e) => setMech(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes mécaniques</option>
              {myMechanics.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={players} onChange={(e) => setPlayers(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Tous joueurs</option>
              <option value="1">1 joueur</option><option value="2">2 joueurs</option><option value="3">3 joueurs</option>
              <option value="4">4 joueurs</option><option value="5">5 joueurs</option><option value="6">6 joueurs</option><option value="7">7+ joueurs</option>
            </select>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes durées</option>
              <option value="30">≤ 30 min</option><option value="45">≤ 45 min</option><option value="60">≤ 1 h</option><option value="90">≤ 1 h 30</option><option value="120">≤ 2 h</option><option value="121">{"> 2 h"}</option>
            </select>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes années</option>
              {myYears.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              {myHasNoYear && <option value="none">Sans année renseignée</option>}
            </select>
            <select value={wantFilter} onChange={(e) => setWantFilter(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="">Toutes envies ❤</option>
              <option value="mine">Que j'ai envie de découvrir</option>
              <option value="any">Avec au moins une envie</option>
              <option value="none">Sans envie</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
              <option value="alpha">A → Z</option>
              <option value="note">Mieux notés (général)</option>
              <option value="myNote">Mes meilleures notes</option>
              <option value="wants">Plus d'envies ❤</option>
              <option value="recent">Récents</option>
            </select>
            <button onClick={() => setView((v) => v === "grid" ? "list" : "grid")} title={view === "grid" ? "Afficher en liste" : "Afficher en grille"}
              style={{ ...inputStyle, width: "auto", cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, color: C.navy }}>
              {view === "grid" ? <><Menu size={16} /> Liste</> : <><Library size={16} /> Grille</>}
            </button>
            {view === "grid" && (
              <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 13.5, color: C.navy, padding: "0 4px" }} title="Afficher la note moyenne et votre note en même temps">
                <input type="checkbox" checked={showBoth} onChange={(e) => setShowBoth(e.target.checked)} style={{ width: 16, height: 16, accentColor: C.teal, cursor: "pointer" }} />
                Voir les 2 notes
              </label>
            )}
          </div>

          {mine.length === 0 ? (
            <EmptyHint icon={Library} text="Aucun de vos jeux ne correspond à ces filtres." />
          ) : view === "list" ? (
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 14px", fontSize: 12, color: "#9c8d79", fontFamily: "'Fredoka',sans-serif", fontWeight: 600 }}>
                <span style={{ flex: 1 }}>Jeu</span>
                <span style={{ width: 60, textAlign: "center" }} title="Membres qui veulent découvrir ce jeu">Envies</span>
                <span style={{ width: 70, textAlign: "center" }}>Moyenne</span>
                <span style={{ width: 70, textAlign: "center" }}>Ma note</span>
              </div>
              {mine.map((g) => {
                const { avg, count } = gameStats(g);
                const myR = currentUser ? (g.ratings?.[currentUser.id] || 0) : 0;
                const wantC = (g.wantIds || []).length;
                return (
                  <button key={g.id} onClick={() => setSelected(g.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: "1px solid #efe6d6", background: "#fff", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(30,138,138,.05)"} onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: "'Fredoka',sans-serif", fontWeight: 600, color: C.navy, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.name}
                      {familyOwnerLabel(g) && <span style={{ marginLeft: 8, fontSize: 11.5, fontWeight: 700, color: C.purple }}>· {familyOwnerLabel(g)}</span>}
                    </span>
                    <span style={{ width: 60, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 13.5, color: wantC ? C.red : "#cdbfa8", display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                      {wantC > 0 && <Heart size={12} fill={C.red} color={C.red} />}{wantC || "—"}
                    </span>
                    <span style={{ width: 70, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: count ? C.amber : "#cdbfa8", fontSize: 14 }}>{count ? avg.toFixed(2).replace(".", ",") : "—"}</span>
                    <span style={{ width: 70, textAlign: "center", fontFamily: "'Fredoka',sans-serif", fontWeight: 700, color: myR ? C.teal : "#cdbfa8", fontSize: 14 }}>{myR ? String(myR).replace(".", ",") : "—"}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
              {mine.map((g) => <GameCard key={g.id} g={g} onOpen={() => setSelected(g.id)} myGame globalShare={currentUser.shareLibrary !== false} onToggleShare={(val) => toggleGameShared(g.id, val)} showBoth={showBoth} ownerBadge={familyOwnerLabel(g)} />)}
            </div>
          )}
        </>
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
            <span style={{ fontSize: 12.5, opacity: .8 }}>Ouverte aux +18 ans ; +14 ans accompagnés d'un adulte</span>
          </p>
        </div>
        <div>
          <h4 style={{ color: "#fff", fontFamily: "'Fredoka',sans-serif", fontSize: 15, marginBottom: 12 }}>Contact</h4>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>
            <a href="mailto:aladj50200@gmail.com" style={{ color: "#fff", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Mail size={14} /> aladj50200@gmail.com
            </a><br />
            <span style={{ fontSize: 12.5, opacity: .8 }}>Dates & infos détaillées sur Signal</span>
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
  const { ready, fatalError, currentUser, bannedNotice, setBannedNotice, chrono, closeChrono } = useApp();
  const [page, setPage] = useState("accueil");
  const [auth, setAuth] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);
  useEffect(() => { if (!currentUser && (page === "ma-ludo" || page === "locations")) setPage("accueil"); }, [currentUser, page]);

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
        {page === "a-venir" && <UpcomingPage onAuth={(m) => setAuth(m)} setToast={setToast} />}
        {page === "locations" && currentUser && <LocationsPage setToast={setToast} />}
      </main>
      <Footer setPage={setPage} />
      {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} setToast={setToast} />}
      {bannedNotice && (
        <Modal open onClose={() => setBannedNotice(false)} title="Accès suspendu" width={440}>
          <div style={{ textAlign: "center", padding: "8px 4px" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(181,40,58,.1)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <Lock size={26} color={C.red} />
            </div>
            <p style={{ fontSize: 15, color: "#5e5346", lineHeight: 1.6, margin: "0 0 18px" }}>
              Votre accès au site a été suspendu. Si vous pensez qu'il s'agit d'une erreur, contactez l'association à l'adresse <a href="mailto:aladj50200@gmail.com" style={{ color: C.teal, fontWeight: 600 }}>aladj50200@gmail.com</a>.
            </p>
            <Btn variant="soft" onClick={() => setBannedNotice(false)}>Fermer</Btn>
          </div>
        </Modal>
      )}
      {chrono && (
        <PlayTimer
          supabase={supabase}
          currentUser={currentUser ? { id: currentUser.id, name: currentUser.name, avatar_url: currentUser.avatar } : null}
          gameId={chrono.gameId}
          eventId={chrono.eventId}
          joinCode={chrono.joinCode}
          onExit={closeChrono}
        />
      )}
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
          .aladj-ludo-grid { display: flex !important; flex-direction: column !important; }
          .aladj-ludo-aside { position: static !important; order: -1; }
          .aladj-ludo-aside .aladj-ludo-custom { border-width: 2px; }
        }
        @media (max-width: 600px) {
          .aladj-cal-grid { gap: 3px !important; }
          .aladj-cal-cell { padding: 2px !important; border-radius: 8px !important; }
          .aladj-cal-cell > span:first-child { font-size: 12px !important; }
        }
      `}</style>
      <AppProvider><Shell /></AppProvider>
    </>
  );
}
