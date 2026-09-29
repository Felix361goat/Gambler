// Things that keep you coming back: titles, a daily tip, weekly quests
// (auto-tracked, pay coins), a Monday recap and studio-session stats.

export const TITLES = [
  [1, 'Bedroom-Producer'], [2, 'Loop-Bastler'], [3, 'Beatmaker'], [4, 'Sound-Tüftler'], [5, 'Producer'],
  [6, 'Studio-Ratte'], [7, 'Hitmaker'], [8, 'Plattenboss'], [9, 'Chart-Stürmer'], [10, 'Legende'],
];
export const titleFor = (level) => [...TITLES].reverse().find(([l]) => level >= l)?.[1] || TITLES[0][1];

// FL Studio / production tips – one per day.
export const TIPS = [
  'Strg+B dupliziert die Auswahl im Piano Roll – perfekt für Hi-Hat-Pattern.',
  'Alt beim Ziehen im Piano Roll hält die Noten ohne Snap – für menschlicheres Timing.',
  'Mach zuerst 8 Takte, die sofort knallen. Arrangement kommt danach.',
  'Gib jeder Spur einen eigenen Mixer-Kanal (Strg+L im Channel Rack) – spart später Stunden.',
  'Referenz-Track in einen Mixer-Kanal ohne Effekte legen und A/B vergleichen.',
  'Sidechain muss man nicht hören, man soll ihn fühlen: Attack schnell, Release zum Tempo.',
  'Die 808 und die Kick nie gleichzeitig laut auf derselben Frequenz – entweder tunen oder sidechainen.',
  'Wenn der Beat langweilig wird: nimm 2 Takte lang ALLES außer einem Element raus.',
  'Hi-Hats: Velocity variieren (Alt+R randomisiert im Piano Roll).',
  'Speichere Presets, die dir gefallen, sofort – dein eigenes Sound-Archiv ist Gold wert.',
  'Nimm Ideen als Sprachmemo auf, bevor du sie vergisst – Melodie summen reicht.',
  'Mute die Drums und hör, ob die Melodie alleine trägt.',
  'Weniger ist mehr: 3 starke Elemente > 12 mittelmäßige.',
  'Mach nach 45 Minuten 5 Minuten Pause – deine Ohren werden ehrlicher.',
  'Übe Tempo: stell dir einen Timer und mach einen Beat in 30 Minuten.',
  'Pitch ein Sample um +/-12 Halbtöne und hör, was passiert – oft entsteht ein neuer Vibe.',
  'Lass bei Vocals Platz im Mix: senk die Mitten der Melodie bei 1–3 kHz.',
  'Vocals: nimm immer eine Double-Spur auf, auch wenn du sie später leise machst.',
  'Hook zuerst schreiben – wenn die Hook sitzt, schreiben sich die Parts leichter.',
  'Schreib 10 Zeilen, streich 5. Was übrig bleibt, ist dein Text.',
  'Reime sind wichtig, aber Bilder sind wichtiger: Was sieht der Hörer?',
  'Automation macht Beats lebendig: Filter, Volume, Reverb-Send über 8 Takte.',
  'Afroswing lebt vom Groove: Percs leicht neben das Raster ziehen.',
  'Detroit-Beats: das Piano bouncet auf den Offbeats – spiel es, statt es zu klicken.',
  'Jerk: Tempo hoch, Sounds luftig – lass Lücken, damit die Vocals fliegen können.',
  'House: Kick auf jeden Schlag, Hats auf die Offbeats – der Rest ist Gefühl.',
  'Speichere nach jedem großen Schritt eine neue Version (Beat_v2, v3 …).',
  'Mastering-Faustregel: erst den Mix gut machen, nicht das Master retten.',
  'Hör deinen Mix leise – wenn er leise gut klingt, klingt er laut noch besser.',
  'Teste deinen Beat auf Handy-Lautsprecher und im Auto.',
  'Lern eine Tastenkombi pro Woche – in einem Jahr bist du doppelt so schnell.',
  'Konsistenz schlägt Talent: lieber jede Woche 2 Beats als einmal im Monat 10.',
];
export const tipOfDay = (date = new Date()) => TIPS[(Math.floor(date.getTime() / 864e5)) % TIPS.length];

// ---- weekly quests -----------------------------------------------------------
// Each check gets the stats for the current week (see weekStats in app.js).
export const QUEST_POOL = [
  { id: 'deliver2', icon: '📦', text: '2 Aufträge abgeben', reward: 60, check: (w) => [w.delivered, 2] },
  { id: 'ontime', icon: '⏰', text: '1 Auftrag pünktlich abgeben', reward: 30, check: (w) => [w.onTime, 1] },
  { id: 'hours3', icon: '⏱️', text: '3 Stunden Studio-Zeit (Session-Timer)', reward: 50, check: (w) => [Math.floor(w.minutes / 60), 3] },
  { id: 'hours5', icon: '🔥', text: '5 Stunden Studio-Zeit', reward: 90, check: (w) => [Math.floor(w.minutes / 60), 5] },
  { id: 'newGenre', icon: '🧭', text: 'Ein Genre abgeben, das du noch nie gemacht hast', reward: 80, check: (w) => [w.newGenres, 1] },
  { id: 'challenge2', icon: '🎯', text: '2 Lern-Challenges schaffen', reward: 60, check: (w) => [w.challenges, 2] },
  { id: 'review2', icon: '🎧', text: '2 Tracks ehrlich nachbewerten', reward: 40, check: (w) => [w.reviews, 2] },
  { id: 'eight', icon: '⭐', text: 'Eine Bewertung von 8/10 oder besser', reward: 60, check: (w) => [w.eights, 1] },
  { id: 'days3', icon: '📅', text: 'An 3 verschiedenen Tagen eine Session', reward: 70, check: (w) => [w.sessionDays, 3] },
  { id: 'vocals', icon: '🎙️', text: 'Einen Song mit Vocals abgeben', reward: 80, check: (w) => [w.vocals, 1] },
  { id: 'neuland', icon: '🌍', text: 'Eine Neuland-Challenge schaffen', reward: 60, check: (w) => [w.neuland, 1] },
  { id: 'nodecline', icon: '💪', text: 'Diese Woche keinen Auftrag ablehnen (und 1 abgeben)', reward: 40, check: (w) => [w.declined === 0 ? w.delivered : 0, 1] },
];

// 3 quests per week, picked deterministically from the week number.
export function questsForWeek(weekKey) {
  let h = 0;
  for (const c of String(weekKey)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const pool = [...QUEST_POOL];
  const out = [];
  while (out.length < 3 && pool.length) { out.push(pool.splice(h % pool.length, 1)[0]); h = (h * 1103515245 + 12345) >>> 0; }
  return out;
}
