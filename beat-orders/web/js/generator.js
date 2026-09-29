// Generates realistic "client" orders and decides when the next one arrives.
// Everything here is plain data + pure functions, so it's easy to extend later
// (own genres, instruments, clients, brief templates …).

export const ORDER_TYPES = {
  instrumental: { label: 'Instrumental', short: 'Beat', icon: '🎹', days: [4, 7], budget: [40, 150] },
  full_song:    { label: 'Full Song',    short: 'Song', icon: '🎤', days: [7, 12], budget: [120, 400] },
  vocal_chain:  { label: 'Vocal Chain',  short: 'Chain', icon: '🎚️', days: [2, 4], budget: [25, 80] },
  hook:         { label: 'Hook / Feature', short: 'Hook', icon: '🪝', days: [3, 6], budget: [60, 200] },
  remix:        { label: 'Remix / Flip', short: 'Remix', icon: '🔁', days: [4, 8], budget: [50, 180] },
  own:          { label: 'Eigenes Projekt', short: 'Eigenes', icon: '⭐️', days: [0, 0], budget: [0, 0], manualOnly: true },
  // Only unlocked by your own rating (see createVideoOrder) – never random.
  video:        { label: 'Video / TikTok', short: 'Video', icon: '🎬', days: [5, 8], budget: [0, 0], manualOnly: true },
};

export const GENRES = {
  'Trap':        { bpm: [130, 160], keys: ['C# Moll', 'F Moll', 'G# Moll', 'A Moll'], inst: ['808s', 'Hi-Hat Rolls', 'dunkle Pads', 'Glocken', 'Flöte'] },
  'Drill':       { bpm: [138, 146], keys: ['F# Moll', 'D Moll', 'E Moll'], inst: ['Sliding 808s', 'Strings', 'Choir', 'Piano', 'Percs'] },
  'Boom Bap':    { bpm: [84, 96], keys: ['A Moll', 'D Moll', 'Eb Dur'], inst: ['Sample-Chops', 'Vinyl Crackle', 'Upright Bass', 'Rhodes', 'Dusty Drums'] },
  'R&B':         { bpm: [65, 95], keys: ['Db Dur', 'Ab Dur', 'Bb Moll'], inst: ['Rhodes', 'Gitarre', 'weiche Pads', 'Finger Snaps', 'Sub Bass'] },
  'Afrobeats':   { bpm: [100, 115], keys: ['G Dur', 'A Moll', 'E Moll'], inst: ['Log Drum', 'Shaker', 'Gitarre', 'Marimba', 'Talking Drum'] },
  'Lo-Fi':       { bpm: [70, 90], keys: ['F Dur', 'C Dur', 'E Moll'], inst: ['Piano', 'Tape Wobble', 'Jazz-Chords', 'Rain FX', 'Soft Kick'] },
  'Pop':         { bpm: [95, 125], keys: ['C Dur', 'G Dur', 'F Dur'], inst: ['Synth Leads', 'Claps', 'Plucks', 'Akustikgitarre', 'Big Chorus'] },
  'Deutschrap':  { bpm: [85, 150], keys: ['A Moll', 'C Moll', 'G Moll'], inst: ['Piano', '808s', 'Streicher', 'Vocal Chops', 'Hard Kicks'] },
  'Phonk':       { bpm: [120, 140], keys: ['C# Moll', 'F Moll'], inst: ['Cowbell', 'Memphis Vocals', 'distorted 808', 'Drift FX'] },
  'Jersey Club': { bpm: [135, 145], keys: ['E Moll', 'B Moll'], inst: ['Bed Squeaks', 'Kick Rolls', 'Vocal Chops', 'Synth Stabs'] },
  'Dancehall':   { bpm: [90, 105], keys: ['G Moll', 'D Moll'], inst: ['Riddim Drums', 'Skank Guitar', 'Horns', 'Sub Bass'] },
  'Hyperpop':    { bpm: [140, 170], keys: ['B Dur', 'E Dur'], inst: ['Supersaws', 'Pitched Vocals', 'Glitch FX', 'Distorted Drums'] },
};

const MOODS = ['dunkel', 'melancholisch', 'aggressiv', 'chillig', 'euphorisch', 'emotional', 'bouncy', 'verträumt', 'hart', 'sommerlich'];

const CLIENTS = [
  'Lil Nova', 'Mara K.', 'YVNG Serif', 'Jules Beaumont', 'OG Tempo', 'Sina Vale', 'Kairo', 'Deniz 44',
  'Luna Rae', 'Blackwave Records', 'Theo Mont', 'Ayo Blessing', 'Nightshift Collective', 'Emre B.',
  'Kid Zephyr', 'Nadia Sol', 'Rico Stacks', 'Velvet Tape', 'Jonah Grey', 'Milla Frost',
];

const VOICES = ['tiefe Männerstimme', 'hohe Frauenstimme', 'raue Rap-Stimme', 'weiche R&B-Stimme', 'Autotune-lastige Stimme'];

const BRIEFS = {
  instrumental: [
    'Yo! Brauche einen {genre}-Beat, Vibe eher {mood}, so um die {bpm} BPM. Gerne mit {i1} und {i2}. Ist für meine nächste Single 🙏',
    'Hey, ich suche ein {genre} Instrumental – eher {mood}. {i1} wäre krass, {i2} optional. Tonart gern {key}.',
    'Kannst du mir was im {genre}-Style bauen? Soll {mood} klingen, {bpm} BPM, Fokus auf {i1}. Hook-Part sollte Platz für Vocals lassen.',
  ],
  full_song: [
    'Ich will einen kompletten Song von dir: {genre}, {mood}, ~{bpm} BPM. Beat + deine Vocals (2 Parts + Hook). Thema: {theme}.',
    'Full Song bitte! {genre} mit {i1}. Du rappst/singst drauf, Thema „{theme}“. Vibe: {mood}.',
  ],
  vocal_chain: [
    'Kannst du mir eine Vocal Chain für {genre} bauen? Meine Stimme: {voice}. Bitte als FL-Studio-Preset + kurzes Vorher/Nachher-Demo.',
    'Brauche eine saubere Vocal Chain (EQ, Comp, De-Esser, Reverb/Delay) für {voice}. Style: {genre}, eher {mood}.',
  ],
  hook: [
    'Ich hab einen {genre}-Track fertig, mir fehlt nur die Hook. Eingängig, 8 Bars, Vibe {mood}. Thema: {theme}.',
    'Feature-Anfrage: 16 Bars auf meinem {genre}-Beat ({bpm} BPM). Vibe {mood}, Thema „{theme}“.',
  ],
  remix: [
    'Mach mal einen {genre}-Remix von einem Song, den du feierst – Vibe {mood}, {bpm} BPM. Überrasch mich!',
    'Flip ein Sample deiner Wahl in {genre}. {i1} rein, Tempo ~{bpm}. Vibe: {mood}.',
  ],
};

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
  'Video': [
    ['Schnitt exakt auf den Beat (Beat-Marker in CapCut)', 1], ['Die ersten 2 Sekunden als Scroll-Stopper', 1],
    ['Animierte Untertitel/Lyrics', 1], ['Color Grading mit LUT', 2],
    ['Match Cuts als Übergänge', 2], ['One-Take ohne einen einzigen Schnitt', 3],
  ],
};

const SKILL_AREAS = {
  instrumental: ['Drums', 'Sound Design', 'Mixing', 'Arrangement', 'Sampling', 'Musiktheorie'],
  full_song: ['Vocals', 'Songwriting', 'Arrangement', 'Mixing'],
  vocal_chain: ['Vocals', 'Mixing'],
  hook: ['Songwriting', 'Vocals'],
  remix: ['Sampling', 'Arrangement', 'Sound Design'],
  own: ['Drums', 'Sound Design', 'Musiktheorie', 'Sampling'],
  video: ['Video'],
};

// XP → level. Level decides how hard the challenges get.
export const LEVELS = [0, 40, 100, 180, 280, 400, 550, 750, 1000, 1300];
export function levelInfo(xp) {
  let lvl = 1;
  while (lvl < LEVELS.length && xp >= LEVELS[lvl]) lvl++;
  const cur = LEVELS[lvl - 1], next = LEVELS[lvl] ?? cur + 400;
  return { level: lvl, xp, cur, next, frac: (xp - cur) / (next - cur) };
}
const maxSkillLvl = (level) => (level >= 5 ? 3 : level >= 2 ? 2 : 1);

// Picks a technique: prefers areas/skills you haven't practised, never the
// same area as the last order.
export function pickChallenge(type, { level = 1, history = [] } = {}) {
  const areas = SKILL_AREAS[type] || SKILL_AREAS.instrumental;
  const done = new Set(history.filter((o) => o.challenge?.done).map((o) => o.challenge.name));
  const recent = history.filter((o) => o.challenge).sort((a, b) => b.createdAt - a.createdAt);
  const lastArea = recent[0]?.challenge.area;
  const pool = [];
  for (const area of areas) {
    if (areas.length > 1 && area === lastArea) continue;
    for (const [name, lvl] of SKILLS[area]) {
      if (lvl > maxSkillLvl(level)) continue;
      pool.push({ area, name, lvl, fresh: !done.has(name) });
    }
  }
  const fresh = pool.filter((x) => x.fresh);
  const c = pick(fresh.length ? fresh : pool);
  return c ? { area: c.area, name: c.name, lvl: c.lvl, done: null } : null;
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

export function createVideoOrder(song, { concept, level = 1, history = [] } = {}) {
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
    challenge: pickChallenge('video', { level, history }),
    bpm: null, key: null, mood: c.format, instruments: [],
    budget: 0, createdAt: now,
    deadline: deadlineIn(randInt(ORDER_TYPES.video.days[0], ORDER_TYPES.video.days[1])),
    status: 'new', submissions: [], deliveredAt: null, deliveredSubmissionId: null,
    reply: null, rating: null, updatedAt: now,
  };
}

export const rerollConcept = (order) => {
  const others = VIDEO_CONCEPTS.filter((c) => c.idea !== order.concept?.idea);
  return pick(others);
};

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
  eveningStart: 17, // Uhrzeit, ab der Aufträge unter der Woche reinkommen dürfen
  eveningEnd: 22,
  weekends: true,
  genres: ['Trap', 'Boom Bap', 'R&B', 'Deutschrap', 'Lo-Fi'],
  types: { instrumental: 3, full_song: 1, vocal_chain: 1, hook: 1, remix: 1 }, // Gewichtung, 0 = aus
  notifications: false,
  videoThreshold: 9, // eigene Bewertung (1–10), ab der ein Song fürs Video freigegeben wird
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

// Deadline: n days out, snapped to 23:59 so it's always "bis Ende Tag X".
function deadlineIn(days, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 0, 0);
  return d.getTime();
}

// `at` lets us pre-generate an order that "arrives" later (scheduled notification).
// `history` (your previous orders) keeps things varied: no genre from the
// last two orders, no type twice in a row (if alternatives exist).
export function generateOrder(settings, { type, at, history = [], level = 1 } = {}) {
  const recent = [...history].filter((o) => o.type !== 'own' && o.type !== 'video').sort((a, b) => b.createdAt - a.createdAt);
  const known = (settings.genres?.length ? settings.genres : Object.keys(GENRES)).filter((g) => GENRES[g]);
  const genreNames = known.length ? known : Object.keys(GENRES);
  const recentGenres = recent.slice(0, 2).map((o) => o.genre);
  const freshGenres = genreNames.filter((g) => !recentGenres.includes(g));
  const genre = pick(freshGenres.length ? freshGenres : genreNames);
  const g = GENRES[genre];
  let t = type || weightedType(settings.types || DEFAULT_SETTINGS.types);
  for (let i = 0; !type && i < 4 && t === recent[0]?.type; i++) t = weightedType(settings.types || DEFAULT_SETTINGS.types);
  const T = ORDER_TYPES[t];
  const bpm = randInt(g.bpm[0], g.bpm[1]);
  const [i1, i2] = pickN(g.inst, 2);
  const vars = {
    genre, bpm, key: pick(g.keys), mood: pick(MOODS), i1, i2,
    theme: pick(THEMES), voice: pick(VOICES),
  };
  const now = at ?? Date.now();
  return {
    id: uid(),
    client: pick(CLIENTS),
    type: t,
    genre,
    bpm: t === 'vocal_chain' ? null : bpm,
    key: t === 'vocal_chain' ? null : vars.key,
    mood: vars.mood,
    instruments: t === 'vocal_chain' ? [] : [i1, i2],
    brief: fill(pick(BRIEFS[t]), vars),
    challenge: pickChallenge(t, { level, history }),
    budget: Math.round(rand(T.budget[0], T.budget[1]) / 5) * 5,
    createdAt: now,
    deadline: deadlineIn(randInt(T.days[0], T.days[1]), new Date(now)),
    status: 'new', // new → in_progress → delivered
    submissions: [],
    deliveredAt: null,
    deliveredSubmissionId: null,
    reply: null,
    rating: null,
    updatedAt: now,
  };
}

export function createOwnProject({ title, genre, level = 1, history = [] }) {
  const now = Date.now();
  return {
    id: uid(), client: 'Du', type: 'own', genre: genre || 'Sonstiges',
    bpm: null, key: null, mood: null, instruments: [],
    brief: title || 'Eigenes Projekt', title: title || 'Eigenes Projekt',
    challenge: pickChallenge('own', { level, history }),
    budget: 0, createdAt: now, deadline: null, status: 'in_progress',
    submissions: [], deliveredAt: null, deliveredSubmissionId: null,
    reply: null, rating: null, updatedAt: now,
  };
}

export function clientReply(order) {
  const late = order.deadline && order.deliveredAt > order.deadline;
  if (late) return { reply: pick(REPLIES.late), rating: randInt(2, 4) };
  const great = Math.random() < 0.55;
  return great ? { reply: pick(REPLIES.great), rating: 5 } : { reply: pick(REPLIES.good), rating: 4 };
}

// ---- Scheduling ---------------------------------------------------------
// Orders only arrive in the "free time" window: weekday evenings and
// (optionally) weekend daytime, so they fit around a full-time job.

function inWindow(date, s) {
  const day = date.getDay(); // 0 = So, 6 = Sa
  const h = date.getHours();
  const weekend = day === 0 || day === 6;
  if (weekend) return s.weekends && h >= 10 && h < s.eveningEnd;
  return h >= s.eveningStart && h < s.eveningEnd;
}

export function snapToWindow(ts, s) {
  const d = new Date(ts);
  for (let i = 0; i < 24 * 8; i++) {
    if (inWindow(d, s)) return d.getTime();
    d.setHours(d.getHours() + 1, randInt(0, 50), 0, 0);
  }
  return ts;
}

export function nextArrival(s, from = Date.now()) {
  const perWeek = Math.max(1, Math.min(14, s.ordersPerWeek || 2));
  const avgMs = (7 * 24 * 3600 * 1000) / perWeek;
  return snapToWindow(from + avgMs * rand(0.6, 1.3), s);
}
