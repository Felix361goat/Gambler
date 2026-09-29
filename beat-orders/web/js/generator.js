import { songPrompt, songTheme } from './themes.js';
import {
  CUSTOMERS, CUSTOMER_BY_ID, EXPERTS, BOSS, writeBrief, writeExpertBrief, writeBossBrief, replyFor, budgetFor,
} from './customers.js';

// Generates realistic "client" orders and decides when the next one arrives.
// Everything here is plain data + pure functions, so it's easy to extend later
// (own genres, instruments, clients, brief templates …).

export const ORDER_TYPES = {
  instrumental: { label: 'Instrumental', short: 'Beat', icon: '🎹', days: [4, 7], effort: 4, budget: [40, 150] },
  full_song:    { label: 'Full Song',    short: 'Song', icon: '🎤', days: [7, 12], effort: 7, budget: [120, 400] },
  vocal_chain:  { label: 'Vocal Chain',  short: 'Chain', icon: '🎚️', days: [2, 4], effort: 2.5, budget: [25, 80] },
  hook:         { label: 'Hook / Feature', short: 'Hook', icon: '🪝', days: [3, 6], effort: 3, budget: [60, 200] },
  remix:        { label: 'Remix / Flip', short: 'Remix', icon: '🔁', days: [4, 8], effort: 4, budget: [50, 180] },
  own:          { label: 'Eigenes Projekt', short: 'Eigenes', icon: '⭐️', days: [0, 0], effort: 0, budget: [0, 0], manualOnly: true },
  // Only unlocked by your own rating – never random.
  release:      { label: 'Release-Song', short: 'Release', icon: '💿', days: [42, 42], effort: 25, budget: [0, 0], manualOnly: true },
  vocals:       { label: 'Vocals drauf', short: 'Song', icon: '🎙️', days: [5, 9], effort: 4, budget: [0, 0], manualOnly: true },
  video:        { label: 'Video / TikTok', short: 'Video', icon: '🎬', days: [5, 8], effort: 3, budget: [0, 0], manualOnly: true },
};

import { GENRES, ideaFor, GENRE_RENAMES } from './genres.js';
export { GENRES, GENRE_RENAMES };

// How often each genre comes up (0 = aus … 4 = sehr oft). Tuned to your taste:
// UK Afroswing + US sounds a lot, House/Indie ab und zu, Indie Rock selten.
export const DEFAULT_GENRE_WEIGHTS = {
  // Kern – nach deinen Spotify-Stats (J Hus, JAE5, Kojo Funds, NSG, Skeete, Nines, Tera Kòrá …)
  'UK Afroswing': 4, 'UK Rap': 3, 'Afrobeats': 3, 'Afro-Dancehall': 2, 'UK R&B': 2, 'UK Drill': 2, 'Amapiano': 2,
  // Dancehall-inspiriert + FR/ES (Morad & Co.)
  'UK Sample-Rap': 2, 'Dancehall': 2, 'Dancehall-Trap': 2, 'Afro-Trap (FR)': 2, 'Morad-Style': 2, 'French Drill': 1, 'Reggaeton': 1,
  // Amerikanisch – die ganze Trap-Familie & Co., ab und zu
  'R&B Trap': 2, 'Alternative R&B': 1, '90s R&B': 1, 'Sexy Drill': 1,
  'Detroit': 2, 'Jerk': 2, 'Atlanta Trap': 1, 'Dark Trap': 1, 'Melodic Trap': 1, 'Rage': 1, 'Plugg': 1, 'Pluggnb': 1, 'Trap Soul': 1,
  'Memphis': 1, 'Chicago Drill': 1, 'NY Drill': 1, 'Sample Drill': 1, 'Jersey Club': 1, 'West Coast': 1, 'Ratchet': 1, 'Bay Area': 1, 'Boom Bap': 1,
  // Rest
  'Contemporary R&B': 1, 'Deutschrap': 1, 'UK Garage': 1, 'Grime': 1, 'Lo-Fi': 1, 'Pop': 1, 'Phonk': 1, 'Hyperpop': 1,
  // Ganz anders (Calvin Harris & Co.)
  'House': 1, 'Indie House': 1, 'Indie Rock': 1,
};
export const TASTE_VERSION = 4; // bump → new genres/defaults are merged in once

export const refsFor = (genre, n = 2) => [...(GENRES[genre]?.refs || [])].sort(() => Math.random() - 0.5).slice(0, n);

export const GENRE_LABELS = ['Aus', 'Selten', 'Ab und zu', 'Oft', 'Sehr oft'];
// Steps are steep on purpose: "Selten" ≈ 1/16 of "Sehr oft".
const WEIGHT_SCALE = [0, 1, 3, 7, 16];
const gweight = (gw, g) => WEIGHT_SCALE[gw[g] ?? 0] ?? 0;

const MOODS = ['dunkel', 'melancholisch', 'aggressiv', 'chillig', 'euphorisch', 'emotional', 'bouncy', 'verträumt', 'hart', 'sommerlich'];

const VOICES = ['tiefe Männerstimme', 'hohe Frauenstimme', 'raue Rap-Stimme', 'weiche R&B-Stimme', 'Autotune-lastige Stimme'];

const THEMES = ['Nachtfahrt durch die Stadt', 'Neuanfang', 'Loyalität', 'Herzschmerz', 'Hustle neben dem 9-to-5', 'Sommer', 'Heimat', 'Erfolg', 'Selbstzweifel', 'Freundschaft'];

const REPLIES = {
  great: ['🔥🔥 Genau das, was ich wollte! Danke dir!', 'Bro das ist krank. Wird released!', 'Wow – übertrifft meine Erwartungen 😍', 'Perfekt, direkt gekauft ✅'],
  good: ['Richtig gut, danke! Kleine Details passe ich selbst an.', 'Nice, der Vibe passt 👌', 'Gefällt mir, danke für die schnelle Lieferung!'],
  late: ['Kam etwas spät, aber klingt gut 👍', 'Hat gedauert, aber das Ergebnis passt.', 'Nächstes Mal bitte pünktlich – trotzdem nice.'],
};

const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

// ---- Learning challenges -----------------------------------------------
// Every order comes with one concrete technique to practise. `lvl` 1–3:
// harder ones unlock as your level grows.
export const SKILLS = {
  'Drums': [
    ['Hi-Hat-Rolls & Triolen im Piano Roll', 1], ['Swing/Groove über den Channel-Rack-Swing', 1],
    ['Ghost-Notes auf der Snare', 2], ['808-Glides (Portamento) im Piano Roll', 2],
    ['Eigenes Drum-Kit aus selbst aufgenommenen Geräuschen', 3], ['Polyrhythmik: 3 gegen 4 in den Percs', 3],
  ],
  'Sound Design': [
    ['Pluck in 3xOsc oder Sytrus selbst bauen', 1], ['Pad mit langem Attack, Chorus & Reverb', 1],
    ['Eigenes Wavetable-Preset in Vital/Serum from scratch', 2], ['Resampling: Sound bouncen & in Edison zerlegen', 2],
    ['FM-Bass in Sytrus', 3], ['Granular-Textur mit Fruity Granulizer', 3],
  ],
  'Mixing': [
    ['Sidechain Kick → 808 mit Fruity Limiter', 1], ['Gain Staging: jeder Kanal um −6 dB Peak', 1],
    ['Filter-Sweep-Automation für Übergänge', 1], ['Parallel-Kompression auf dem Drum-Bus', 2],
    ['Kompletter Mix nur mit Stock-Plugins', 2], ['Mid/Side-EQ für Breite ohne Matsch', 3],
    ['Mit Referenz-Track mischen und Lautheit (LUFS) angleichen', 3],
  ],
  'Arrangement': [
    ['Klassische Struktur: Intro–Hook–Verse–Hook–Bridge–Hook', 1], ['Drop mit Stille/Riser davor', 1],
    ['Maximal 8 Spuren in der Playlist', 2], ['Beat-Switch in der Mitte des Tracks', 2],
    ['Tonartwechsel für die letzte Hook', 3],
  ],
  'Sampling': [
    ['Sample chopen mit Slicex', 1], ['Sample pitchen & time-stretchen (Stretch-Modus)', 1],
    ['Sample rückwärts + Reverb-Tail als Übergang', 2], ['Vocal-Chop-Melodie aus einem Acapella', 2],
    ['Sample aus einer Nicht-Musik-Quelle (Field Recording)', 3],
  ],
  'Musiktheorie': [
    ['Akkordfolge mit 7th/9th-Akkorden', 1], ['Melodie nur aus der Moll-Pentatonik', 1],
    ['Borrowed Chord (Moll-Subdominante in Dur)', 2], ['Counter-Melody als zweite Stimme', 2],
    ['Ungerade Taktart: 6/8 oder 7/8', 3],
  ],
  'Vocals': [
    ['Doubles & Ad-Libs aufnehmen und panen', 1], ['Punch-in-Recording für saubere Takes', 1],
    ['Pitch-Korrektur mit Newtone', 1], ['Harmonies (Terz/Quinte) aufnehmen', 2],
    ['Delay-Throws am Zeilenende automatisieren', 2], ['Reverb & Delay als Send statt Insert', 2],
  ],
  'Songwriting': [
    ['Hook mit maximal 8 Wörtern', 1], ['Call & Response in der Hook', 1],
    ['Storytelling-Verse mit Anfang, Mitte, Ende', 2], ['Multisilbige Reime in jeder Zeile', 2],
    ['Flow-Wechsel zwischen den Parts', 3],
  ],
  // Ganz andere Skillsets – kommen als „Neuland“ dazu.
  'Mastering': [
    ['Master-Kette: EQ → Kompressor → Limiter (Stock-Plugins)', 1], ['Auf −14 LUFS für Streaming mastern', 1],
    ['Multiband-Kompression (Maximus)', 2], ['Stereo-Imaging nur ab den Mitten', 2],
    ['Zwei Master-Versionen A/B-vergleichen und begründen', 3],
  ],
  'Einspielen': [
    ['Melodie live per MIDI-Keyboard einspielen (kein Mausklick)', 1], ['Drums live einspielen statt klicken', 1],
    ['Velocity & Timing bewusst menschlich lassen', 2], ['Echtes Instrument/Stimme als Hauptelement aufnehmen', 2],
    ['Kompletten Part in einem Take einspielen', 3],
  ],
  'Cover-Art': [
    ['Cover in Canva/Photoshop gestalten (3000×3000 px)', 1], ['Eigenes Foto als Cover bearbeiten', 1],
    ['Farbpalette passend zum Song festlegen', 2], ['Typografie-Cover nur mit Schrift', 2],
    ['Animiertes Cover (Spotify Canvas, 8 Sek. Loop)', 3],
  ],
  'Release & Social': [
    ['Caption + 5 passende Hashtags schreiben', 1], ['Posting-Zeitpunkt planen und begründen', 1],
    ['3 Teaser-Clips aus einem Song schneiden', 2], ['Mini-Release-Plan: 2 Wochen Countdown', 2],
    ['Behind-the-Scenes-Story mit 5 Slides', 3],
  ],
  'Video': [
    ['Schnitt exakt auf den Beat (Beat-Marker in CapCut)', 1], ['Die ersten 2 Sekunden als Scroll-Stopper', 1],
    ['Animierte Untertitel/Lyrics', 1], ['Color Grading mit LUT', 2],
    ['Match Cuts als Übergänge', 2], ['One-Take ohne einen einzigen Schnitt', 3],
  ],
};

const SKILL_AREAS = {
  instrumental: ['Drums', 'Sound Design', 'Mixing', 'Arrangement', 'Sampling', 'Musiktheorie', 'Einspielen', 'Mastering'],
  full_song: ['Vocals', 'Songwriting', 'Arrangement', 'Mixing', 'Mastering', 'Cover-Art'],
  vocal_chain: ['Vocals', 'Mixing'],
  hook: ['Songwriting', 'Vocals', 'Einspielen'],
  remix: ['Sampling', 'Arrangement', 'Sound Design', 'Mastering'],
  own: ['Drums', 'Sound Design', 'Musiktheorie', 'Sampling', 'Einspielen', 'Cover-Art'],
  video: ['Video', 'Release & Social', 'Cover-Art'],
  vocals: ['Vocals', 'Songwriting', 'Mixing', 'Cover-Art'],
  release: ['Mastering', 'Mixing', 'Vocals', 'Cover-Art', 'Release & Social'],
};

// XP → level. Level decides how hard the challenges get.
export const LEVELS = [0, 40, 100, 180, 280, 400, 550, 750, 1000, 1300];
export function levelInfo(xp) {
  let lvl = 1;
  while (lvl < LEVELS.length && xp >= LEVELS[lvl]) lvl++;
  const cur = LEVELS[lvl - 1], next = LEVELS[lvl] ?? cur + 400;
  return { level: lvl, xp, cur, next, frac: (xp - cur) / (next - cur) };
}
// ---- What are you good at? ----------------------------------------------
// Looks at your own 1–10 ratings: per skill area, genre and order type.
// Declined orders count as "not my thing right now".
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

export function analyze(history) {
  const areas = {}, genres = {}, types = {}, declined = { genres: {}, types: {} };
  for (const area of Object.keys(SKILLS)) areas[area] = { done: 0, ratings: [] };
  for (const o of history) {
    if (o.deleted) continue;
    if (o.status === 'declined') {
      declined.genres[o.genre] = (declined.genres[o.genre] || 0) + 1;
      declined.types[o.type] = (declined.types[o.type] || 0) + 1;
      continue;
    }
    const r = o.review?.rating;
    if (o.challenge?.done && areas[o.challenge.area]) {
      areas[o.challenge.area].done++;
      if (r) areas[o.challenge.area].ratings.push(r);
    }
    if (r) {
      (genres[o.genre] ||= []).push(r);
      (types[o.type] ||= []).push(r);
    }
  }
  const out = { areas: {}, genres: {}, types: {}, declined };
  for (const [k, v] of Object.entries(areas)) {
    const a = avg(v.ratings);
    // Level per area: practise it (count) *and* be happy with the result (ratings).
    let level = 1;
    if (v.done >= 2 && (a ?? 7) >= 7) level = 2;
    if (v.done >= 4 && a != null && a >= 8.5) level = 3;
    out.areas[k] = { done: v.done, avg: a, level };
  }
  for (const [k, v] of Object.entries(genres)) out.genres[k] = { n: v.length, avg: avg(v) };
  for (const [k, v] of Object.entries(types)) out.types[k] = { n: v.length, avg: avg(v) };
  return out;
}

// Picks one technique for an order. Three modes:
//   aufbauen – an area you're already good at, at your (higher) level there
//   neu      – an area you've never done: a completely different skill set
//   üben     – anything else in the order's areas you haven't nailed yet
// Never the same area as the previous order; unpractised skills first.
export function pickChallenge(type, { history = [] } = {}) {
  const stats = analyze(history);
  const all = SKILL_AREAS[type] || SKILL_AREAS.instrumental;
  const lastArea = history.filter((o) => o.challenge && !o.deleted).sort((a, b) => b.createdAt - a.createdAt)[0]?.challenge.area;
  const areas = all.length > 1 ? all.filter((a) => a !== lastArea) : all;
  const doneNames = new Set(history.filter((o) => o.challenge?.done).map((o) => o.challenge.name));

  const untried = areas.filter((a) => stats.areas[a].done === 0);
  const strong = areas.filter((a) => stats.areas[a].level >= 2 || (stats.areas[a].avg ?? 0) >= 8);
  const r = Math.random();
  let mode, area;
  if (untried.length && (r < 0.4 || untried.length === areas.length)) { mode = 'neu'; area = pick(untried); }
  else if (strong.length && r < 0.8) { mode = 'aufbauen'; area = pick(strong); }
  else { mode = 'üben'; area = pick(areas); }

  const lvl = mode === 'neu' ? 1 : stats.areas[area].level;
  const skills = SKILLS[area].filter(([, l]) => l <= lvl).map(([name, l]) => ({ name, l }));
  const fresh = skills.filter((x) => !doneNames.has(x.name));
  // Building on a strength → prefer the hardest skill you've unlocked there.
  const pool = fresh.length ? fresh : skills;
  const top = mode === 'aufbauen' ? pool.filter((x) => x.l === Math.max(...pool.map((y) => y.l))) : pool;
  const c = pick(top);
  return c ? { area, name: c.name, lvl: c.l, mode, done: null } : null;
}

// ---- Video concepts ----------------------------------------------------
// {song} = title of the song, {genre} = its genre.
const VIDEO_CONCEPTS = [
  { format: 'TikTok / Reel', ratio: '9:16', length: '15–30 Sek.', idea: 'Lip-Sync zur stärksten Line aus „{song}“ – ein Take, harter Schnitt auf den Drop.' },
  { format: 'TikTok / Reel', ratio: '9:16', length: '20–40 Sek.', idea: '„Wie ich diesen {genre}-Beat gebaut habe“: FL-Studio-Screen-Recording, Layer für Layer, am Ende der fertige Song.' },
  { format: 'TikTok / Reel', ratio: '9:16', length: '15 Sek.', idea: 'Hook von „{song}“ mit großem Text-Overlay (Lyrics), ruhige Kamerafahrt oder Nacht-Aufnahmen.' },
  { format: 'TikTok / Reel', ratio: '9:16', length: '30 Sek.', idea: 'Studio-Session: Kopfhörer auf, Mic-Performance von „{song}“, dazwischen Reaction-Shots.' },
  { format: 'YouTube Short', ratio: '9:16', length: '30–60 Sek.', idea: 'Vorher/Nachher: erst die rohe Idee, dann die finale Version von „{song}“.' },
  { format: 'Visualizer', ratio: '16:9', length: 'ganzer Song', idea: 'Loop-Visualizer für „{song}“: Cover/Artwork mit Waveform oder langsam animiertem Hintergrund.' },
  { format: 'Musikvideo', ratio: '16:9', length: 'ganzer Song', idea: 'Low-Budget-Musikvideo zu „{song}“: 3 Locations, Performance + B-Roll, Schnitt im Takt ({genre}-Vibe).' },
  { format: 'Lyric Video', ratio: '16:9 oder 9:16', length: 'ganzer Song', idea: 'Lyric-Video zu „{song}“: Text synchron zum Song, Schrift passend zum {genre}-Vibe.' },
];

export function createVideoOrder(song, { concept, history = [], settings } = {}) {
  const now = Date.now();
  const c = concept || pick(VIDEO_CONCEPTS);
  const songTitle = song.title || `${ORDER_TYPES[song.type]?.label || 'Song'} für ${song.client}`;
  const vars = { song: songTitle, genre: song.genre };
  return {
    id: uid(), client: 'Du', type: 'video', genre: song.genre,
    title: `Video: ${songTitle}`,
    brief: fill(c.idea, vars),
    concept: c,
    sourceOrderId: song.id,
    challenge: pickChallenge('video', { history }),
    bpm: null, key: null, mood: c.format, instruments: [],
    budget: 0, createdAt: now,
    deadline: deadlineFor(ORDER_TYPES.video.effort, now, settings?.week),
    status: 'new', submissions: [], deliveredAt: null, deliveredSubmissionId: null,
    reply: null, rating: null, updatedAt: now,
  };
}

export const rerollConcept = (order) => {
  const list = order.type === 'vocals' ? VOCAL_CONCEPTS : VIDEO_CONCEPTS;
  return pick(list.filter((c) => c.idea !== order.concept?.idea));
};

// ---- Vocal concepts (a beat you rated ≥ threshold becomes a song) --------
const VOCAL_CONCEPTS = [
  { format: '2 Parts + Hook', length: '16 + 8 + 16 Bars', idea: 'Schreib 2 Parts und eine Hook auf deinen Beat „{song}“. Thema: {theme}.' },
  { format: 'Hook + 1 Part', length: '8 + 16 Bars', idea: 'Kurz und knackig: eine Hook, die hängen bleibt, und ein Part auf „{song}“. Thema frei.' },
  { format: 'Storytelling', length: '3 Parts, keine Hook', idea: 'Erzähl auf „{song}“ eine Geschichte mit Anfang, Mitte und Ende. Thema: {theme}.' },
  { format: 'Melodisch', length: 'Hook + 2 Parts', idea: 'Sing/rappe melodisch auf „{song}“ – mit Autotune/Newtone und Doubles. Thema: {theme}.' },
  { format: 'Freestyle → Song', length: '1 Take + Überarbeitung', idea: 'Nimm auf „{song}“ zuerst einen Freestyle auf, such dir die besten Zeilen raus und bau daraus eine Hook.' },
  { format: 'Feature-Style', length: 'Hook + Part + Platz für Feature', idea: 'Schreib Hook und einen Part auf „{song}“ und lass Platz für ein Feature (16 Bars). Thema: {theme}.' },
];

export function vocalBrief(c, title, pr, refs = []) {
  return `${fill(c.idea, { song: title, theme: pr.theme })}\n\n✍️ Thema (${pr.category}): ${pr.theme}\n👁️ Perspektive: ${pr.perspective}\n` +
    `🔑 Pflicht-Wort: „${pr.word}“\n🎬 Einstieg (optional): ${pr.opener}\n💭 Gefühl: ${pr.emotion}` +
    (refs.length ? `\n🎧 Vibe-Referenz: ${refs.join(' / ')}` : '');
}
export { songPrompt };

export function createVocalOrder(beat, { concept, history = [], settings } = {}) {
  const now = Date.now();
  const c = concept || pick(VOCAL_CONCEPTS);
  const title = beat.title || `${ORDER_TYPES[beat.type]?.label || 'Beat'} für ${beat.client}`;
  const prompt = songPrompt(beat.genre);
  return {
    id: uid(), client: 'Du', type: 'vocals', genre: beat.genre,
    title: `Vocals: ${title}`,
    brief: vocalBrief(c, title, prompt, refsFor(beat.genre, 2)),
    prompt,
    refs: refsFor(beat.genre, 2),
    concept: c, sourceOrderId: beat.id,
    challenge: pickChallenge('vocals', { history }),
    effort: ORDER_TYPES.vocals.effort,
    bpm: beat.bpm, key: beat.key, mood: beat.mood, instruments: [],
    budget: 0, createdAt: now,
    deadline: deadlineFor(ORDER_TYPES.vocals.effort, now, settings?.week),
    status: 'new', submissions: [], deliveredAt: null, deliveredSubmissionId: null,
    reply: null, rating: null, updatedAt: now,
  };
}

// Self-review opens on the calendar day after delivery.
export function reviewOpensAt(deliveredAt) {
  const d = new Date(deliveredAt);
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const DEFAULT_SETTINGS = {
  artistName: '',
  ordersPerWeek: 2,
  maxActive: 2,
  // Freie Zeit pro Wochentag (0 = So … 6 = Sa) als "HH:MM"-Fenster, null = kein Slot.
  // Standard: Vollzeitjob + Pendeln, Training Mo/Di/Do, Match am Wochenende.
  week: [
    { from: '11:00', to: '18:00' }, // So
    { from: '20:45', to: '23:00' }, // Mo (Training bis 20:00 + Fahrt)
    { from: '20:45', to: '23:00' }, // Di (Training)
    { from: '19:00', to: '23:00' }, // Mi (Arbeit bis 18:15 + Fahrt)
    { from: '20:45', to: '23:00' }, // Do (Training)
    { from: '16:00', to: '23:00' }, // Fr (früher frei – Hauptblock)
    { from: '18:00', to: '22:30' }, // Sa (nach dem Match)
  ],
  genreWeights: { ...DEFAULT_GENRE_WEIGHTS },
  types: { instrumental: 3, full_song: 1, vocal_chain: 1, hook: 1, remix: 1 }, // Gewichtung, 0 = aus
  notifications: false,
  vocalThreshold: 8, // eigene Bewertung, ab der ein Beat für Vocals freigegeben wird
  videoThreshold: 9, // eigene Bewertung, ab der ein Song fürs Video freigegeben wird
};

function weightedType(weights) {
  const entries = Object.entries(weights).filter(([k, w]) => w > 0 && ORDER_TYPES[k] && !ORDER_TYPES[k].manualOnly);
  if (!entries.length) return 'instrumental';
  let r = Math.random() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [k, w] of entries) if ((r -= w) <= 0) return k;
  return entries[0][0];
}

function fill(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

// Genres/types you declined recently come up less often.
function weightedPick(items, weightOf) {
  const w = items.map(weightOf);
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) if ((r -= w[i]) <= 0) return items[i];
  return items[items.length - 1];
}

// Customer choice: new faces first, and "fans" (you delivered well to them
// before) come back more often. Each customer mostly orders their own
// favourite genres.
function pickCustomer(history) {
  const recent = new Set(history.slice(-25).map((o) => o.customerId));
  const fans = new Set(history.filter((o) => o.customerId && o.status === 'delivered' && ((o.review?.rating ?? 0) >= 8 || o.rating === 5)).map((o) => o.customerId));
  return weightedPick(CUSTOMERS, (c) => (fans.has(c.id) ? 3 : recent.has(c.id) ? 0.3 : 1));
}
export const isFan = (customerId, history) => history.some((o) => o.customerId === customerId && o.status === 'delivered' && ((o.review?.rating ?? 0) >= 8 || o.rating === 5));

export function generateOrder(settings, { type, at, history = [], genre: forcedGenre } = {}) {
  const { declined } = analyze(history.slice(-40));
  const recent = [...history].filter((o) => o.type !== 'own' && o.type !== 'video' && !o.deleted)
    .sort((a, b) => b.createdAt - a.createdAt);
  const gw = settings.genreWeights || DEFAULT_GENRE_WEIGHTS;
  const enabled = Object.keys(GENRES).filter((g) => (gw[g] ?? 0) > 0);
  const genreNames = enabled.length ? enabled : Object.keys(GENRES);
  const customer = pickCustomer(history);
  const theirs = (customer.likes || []).filter((g) => (gw[g] ?? 0) > 0);
  const recentGenres = recent.slice(0, 2).map((o) => o.genre);
  const freshGenres = genreNames.filter((g) => !recentGenres.includes(g));
  // Your strong genres (≥ 8 Ø) come up a bit more, declined ones less.
  const { genres: genreStats } = analyze(history);
  // Your taste decides; the customer's favourites only tilt it (×4), so a
  // rare genre stays rare even if this customer loves it.
  const genre = forcedGenre && GENRES[forcedGenre] ? forcedGenre
    : weightedPick(freshGenres.length ? freshGenres : genreNames,
      (g) => gweight(gw, g) * (theirs.includes(g) ? 4 : 1) * ((genreStats[g]?.avg ?? 0) >= 8 ? 1.3 : 1) / (1 + (declined.genres[g] || 0)));
  const g = GENRES[genre];
  const tw = Object.fromEntries(Object.entries(settings.types || DEFAULT_SETTINGS.types)
    .map(([k, w]) => [k, w / (1 + 0.5 * (declined.types[k] || 0))]));
  let t = type || weightedType(tw);
  for (let i = 0; !type && i < 4 && t === recent[0]?.type; i++) t = weightedType(tw);
  const T = ORDER_TYPES[t];
  const bpm = randInt(g.bpm[0], g.bpm[1]);
  const [i1, i2] = pickN(g.inst, 2);
  const vars = {
    genre, bpm, key: pick(g.keys), mood: pick(MOODS), i1, i2,
    theme: songTheme(genre), voice: pick(VOICES),
  };
  const now = at ?? Date.now();
  const { budget, note } = budgetFor(customer, rand(T.budget[0], T.budget[1]));
  return {
    id: uid(),
    client: customer.name,
    customerId: customer.id,
    budgetNote: note,
    type: t,
    genre,
    bpm: t === 'vocal_chain' ? null : bpm,
    key: t === 'vocal_chain' ? null : vars.key,
    mood: vars.mood,
    instruments: t === 'vocal_chain' ? [] : [i1, i2],
    brief: writeBrief(customer, t, vars),
    challenge: pickChallenge(t, { history }),
    refs: refsFor(genre),
    idea: ideaFor(genre),
    effort: T.effort,
    budget,
    createdAt: now,
    deadline: deadlineFor(T.effort, now, settings.week),
    status: 'new', // new → in_progress → delivered
    submissions: [],
    deliveredAt: null,
    deliveredSubmissionId: null,
    reply: null,
    rating: null,
    updatedAt: now,
  };
}

export function createOwnProject({ title, genre, history = [] }) {
  const now = Date.now();
  return {
    id: uid(), client: 'Du', type: 'own', genre: genre || 'Sonstiges',
    bpm: null, key: null, mood: null, instruments: [],
    brief: title || 'Eigenes Projekt', title: title || 'Eigenes Projekt',
    challenge: pickChallenge('own', { history }),
    budget: 0, createdAt: now, deadline: null, status: 'in_progress',
    submissions: [], deliveredAt: null, deliveredSubmissionId: null,
    reply: null, rating: null, updatedAt: now,
  };
}

// ---- ✨ Special Events --------------------------------------------------------
// Rare, one-of-a-kind jobs – the kind of content that stands out online.
export const EVENTS = [
  { title: 'Gitarren-Rap', brief: 'Rap/sing über eine Akustik-Gitarre – kein Beat, nur Gitarre und Stimme (wie Souily auf TikTok). Nimm es als Video auf.', genre: 'Indie Rock', effort: 3 },
  { title: 'Küchen-Beat', brief: 'Bau einen kompletten Beat nur aus Geräuschen aus deiner Küche: Töpfe, Gläser, Besteck, Wasserhahn.', genre: 'UK Afroswing', effort: 4 },
  { title: 'Wien-Sounds', brief: 'Nimm Straßengeräusche in Wien auf (U-Bahn-Ansage, Bim, Tauben, Stimmen) und bau daraus Drums und Atmosphäre.', genre: 'UK Rap', effort: 4 },
  { title: 'Genre-Mashup', brief: 'Kreuze zwei Welten: Amapiano-Log-Drum trifft UK-Drill-Drums. Mach, dass es trotzdem funktioniert.', genre: 'Amapiano', effort: 5 },
  { title: '20-Minuten-Challenge', brief: 'Stell einen Timer auf 20 Minuten und bau einen Beat – filme den Bildschirm dabei (perfekter TikTok-Content).', genre: 'Detroit', effort: 1 },
  { title: 'Sprachmemo → Beat', brief: 'Summ eine Melodie ins Handy, importiere die Aufnahme und bau den Beat um deine Stimme herum.', genre: 'R&B Trap', effort: 3 },
  { title: 'Flohmarkt-Sample', brief: 'Such dir eine alte Platte oder ein altes Lied (Flohmarkt, Omas CDs, YouTube-Rarität) und sample es.', genre: 'UK Sample-Rap', effort: 4 },
  { title: 'Kinderlied-Flip', brief: 'Nimm ein bekanntes Kinderlied und flippe es in einen harten Beat. Lustig UND gut – das geht viral.', genre: 'Jersey Club', effort: 3 },
  { title: 'Ein-Instrument-Song', brief: 'Ein kompletter Song mit nur EINEM Instrument (plus Stimme). Weniger ist mehr.', genre: 'Alternative R&B', effort: 4 },
  { title: 'Live-Session', brief: 'Nimm einen Song in einem einzigen Take auf – Beat läuft, du performst, Kamera an. Keine Schnitte.', genre: 'UK Afroswing', effort: 4 },
];

export function createEventOrder(settings, { history = [], at } = {}) {
  const now = at ?? Date.now();
  const done = new Set(history.filter((o) => o.tier === 'event').map((o) => o.title));
  const pool = EVENTS.filter((e) => !done.has(`✨ ${e.title}`));
  const ev = pick(pool.length ? pool : EVENTS);
  return {
    id: uid(), tier: 'event', client: 'Du', type: 'own', title: `✨ ${ev.title}`, genre: ev.genre,
    brief: `✨ SPECIAL EVENT\n${ev.brief}\n\nDas ist die Art Content, die online auffällt – filme es mit!`,
    bpm: null, key: null, mood: 'einzigartig', instruments: [], refs: refsFor(ev.genre), idea: null,
    challenge: pickChallenge('own', { history }), effort: ev.effort, budget: 0,
    createdAt: now, deadline: deadlineFor(ev.effort, now, settings.week),
    status: 'new', submissions: [], deliveredAt: null, deliveredSubmissionId: null, reply: null, rating: null, updatedAt: now,
  };
}

// ---- Experts & Boss -------------------------------------------------------
export const EXPERT_MIN = 8;
export const BOSS_MIN = 9;
const EXPERT_FACTOR = 3.5; // longer deadlines than normal orders

export function createExpertOrder(settings, { history = [], at } = {}) {
  const now = at ?? Date.now();
  const lastExpert = history.filter((o) => o.tier === 'expert').sort((a, b) => b.createdAt - a.createdAt)[0];
  const pool = EXPERTS.filter((e) => e.id !== lastExpert?.customerId);
  const ex = pick(pool.length ? pool : EXPERTS);
  const sp = ex.spec;
  const vars = { bpm: randInt(sp.bpm[0], sp.bpm[1]), key: pick(sp.keys) };
  const effort = 6;
  return {
    id: uid(), tier: 'expert', minRating: EXPERT_MIN,
    client: ex.name, customerId: ex.id, type: 'instrumental', genre: sp.genre,
    bpm: vars.bpm, key: vars.key, mood: 'exakt nach Vorgabe', instruments: sp.inst,
    brief: writeExpertBrief(ex, vars, EXPERT_MIN),
    challenge: pickChallenge('instrumental', { history }), effort,
    budget: randInt(40, 80) * 10, budgetNote: '(Experten-Gage)',
    createdAt: now, deadline: deadlineFor(effort * EXPERT_FACTOR / 2.5, now, settings.week),
    status: 'new', submissions: [], deliveredAt: null, deliveredSubmissionId: null, reply: null, rating: null, updatedAt: now,
  };
}

export function createBossOrder(settings, { history = [], at } = {}) {
  const now = at ?? Date.now();
  const gw = settings.genreWeights || DEFAULT_GENRE_WEIGHTS;
  const vars = { genre: weightedPick(Object.keys(GENRES), (g) => gweight(gw, g)) };
  const d = new Date(now); d.setDate(d.getDate() + 42); d.setHours(23, 59, 0, 0);
  return {
    id: uid(), tier: 'boss', minRating: BOSS_MIN,
    client: BOSS.name, customerId: BOSS.id, type: 'release', genre: vars.genre,
    bpm: null, key: null, mood: 'release-fertig', instruments: [],
    brief: writeBossBrief(BOSS, vars, BOSS_MIN),
    challenge: pickChallenge('release', { history }), effort: ORDER_TYPES.release.effort,
    budget: 5000, budgetNote: '(+ 1.500 🪙 Boss-Bonus)',
    createdAt: now, deadline: d.getTime(),
    status: 'new', submissions: [], deliveredAt: null, deliveredSubmissionId: null, reply: null, rating: null, updatedAt: now,
  };
}

// Verdict after your own review (experts/boss): accept or send it back.
export function verdictReply(order, accepted) {
  const c = CUSTOMER_BY_ID[order.customerId];
  const late = order.deadline && order.deliveredAt > order.deadline;
  if (!accepted) return replyFor(c, 'reject') || 'Nochmal.';
  return replyFor(c, late ? 'late' : 'great') || 'Akzeptiert.';
}

export function clientReply(order) {
  const c = CUSTOMER_BY_ID[order.customerId];
  const late = order.deadline && order.deliveredAt > order.deadline;
  if (late) return { reply: replyFor(c, 'late') || pick(REPLIES.late), rating: randInt(2, 4) };
  const great = Math.random() < 0.55;
  return great ? { reply: replyFor(c, 'great') || pick(REPLIES.great), rating: 5 }
    : { reply: replyFor(c, 'good') || pick(REPLIES.good), rating: 4 };
}

// ---- Scheduling ---------------------------------------------------------
// Everything runs on your weekly plan (settings.week): orders arrive when a
// free slot starts, and deadlines are counted in *free hours*, not days.

const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };

// Free window of the calendar day containing `ts` → [start, end] timestamps or null.
export function windowOn(ts, week) {
  const d = new Date(ts);
  const w = (week || DEFAULT_SETTINGS.week)[d.getDay()];
  if (!w?.from || !w?.to || toMin(w.to) <= toMin(w.from)) return null;
  d.setHours(0, 0, 0, 0);
  return [d.getTime() + toMin(w.from) * 60e3, d.getTime() + toMin(w.to) * 60e3];
}

export function freeMinutesPerWeek(week) {
  return (week || DEFAULT_SETTINGS.week).reduce((a, w) => a + (w?.from && w?.to ? Math.max(0, toMin(w.to) - toMin(w.from)) : 0), 0);
}

// Deadline = end of the day on which your free time since `from` covers
// 2.5× the effort (you won't spend every free minute on it). 2–14 days.
const EFFORT_FACTOR = 2.5;
export function deadlineFor(effortH, from = Date.now(), week) {
  const need = (effortH || 3) * 60 * EFFORT_FACTOR;
  const day = new Date(from);
  day.setHours(12, 0, 0, 0);
  let acc = 0;
  for (let i = 0; i < 14; i++) {
    const win = windowOn(day.getTime(), week);
    if (win) acc += Math.max(0, win[1] - Math.max(win[0], from)) / 60e3;
    if (acc >= need && i >= 2) break;
    if (i < 13) day.setDate(day.getDate() + 1);
  }
  day.setHours(23, 59, 0, 0);
  return day.getTime();
}

// Next moment you're free (at least an hour left in the slot).
export function snapToWindow(ts, s) {
  const day = new Date(ts);
  for (let i = 0; i < 8; i++) {
    const win = windowOn(day.getTime(), s.week);
    if (win) {
      const at = Math.max(win[0], ts);
      if (win[1] - at >= 60 * 60e3) return at === win[0] ? at + randInt(0, 20) * 60e3 : at;
    }
    day.setDate(day.getDate() + 1);
    day.setHours(0, 0, 0, 0);
  }
  return ts;
}

export function nextArrival(s, from = Date.now()) {
  const perWeek = Math.max(1, Math.min(14, s.ordersPerWeek || 2));
  const avgMs = (7 * 24 * 3600 * 1000) / perWeek;
  return snapToWindow(from + avgMs * rand(0.6, 1.3), s);
}
