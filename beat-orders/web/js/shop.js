import { CAREER_ITEMS } from './careers.js';

// Coins, shop items and trophies. Coins are *derived* from your orders
// (like XP), so they stay correct after a sync or re-install; only what you
// bought/equipped is stored (kv "profile").

export const SHOP = {
  frames: {
    label: 'Rahmen',
    items: [
      { id: 'frame-glass', name: 'Glas', price: 60 },
      { id: 'frame-gold', name: 'Gold', price: 150 },
      { id: 'frame-ice', name: 'Eis', price: 180 },
      { id: 'frame-neon', name: 'Neon', price: 220 },
      { id: 'frame-fire', name: 'Feuer', price: 280 },
      { id: 'frame-rainbow', name: 'Regenbogen', price: 350 },
    ],
  },
  banners: {
    label: 'Banner',
    items: [
      { id: 'banner-sunset', name: 'Sunset', price: 80 },
      { id: 'banner-ocean', name: 'Ozean', price: 100 },
      { id: 'banner-studio', name: 'Studio-Nacht', price: 150 },
      { id: 'banner-vinyl', name: 'Vinyl', price: 180 },
      { id: 'banner-aurora', name: 'Aurora', price: 240 },
      { id: 'banner-galaxy', name: 'Galaxie', price: 300 },
    ],
  },
  studio: {
    label: 'Studio',
    items: [
      { id: 'obj-plant', name: 'Studio-Pflanze', emoji: '🪴', price: 40 },
      { id: 'obj-headphones', name: 'Studio-Kopfhörer', emoji: '🎧', price: 60 },
      { id: 'obj-neon', name: 'Neon-Schild', emoji: '💡', price: 90 },
      { id: 'obj-keys', name: 'MIDI-Keyboard', emoji: '🎹', price: 120 },
      { id: 'obj-guitar', name: 'Gitarre', emoji: '🎸', price: 140 },
      { id: 'obj-speakers', name: 'Monitor-Boxen', emoji: '🔊', price: 150 },
      { id: 'obj-drums', name: 'Drum-Kit', emoji: '🥁', price: 160 },
      { id: 'obj-mpc', name: 'MPC', emoji: '🎛️', price: 180 },
      { id: 'obj-mic', name: 'Großmembran-Mic', emoji: '🎙️', price: 200 },
      { id: 'obj-cat', name: 'Studio-Katze', emoji: '🐈‍⬛', price: 250 },
      { id: 'obj-gold', name: 'Goldene Schallplatte', emoji: '📀', price: 300 },
      { id: 'obj-crown', name: 'Krone', emoji: '👑', price: 400 },
      { id: 'obj-platinum', name: 'Platin-Platte', emoji: '💿', price: 600 },
      { id: 'obj-trophy', name: 'Grammy-Pokal', emoji: '🏆', price: 1000 },
    ],
  },
  garage: {
    label: 'Garage',
    items: [
      { id: 'car-golf', name: 'VW Golf GTI', shape: 'hatch', color: '#dc2626', price: 800 },
      { id: 'car-m3', name: 'BMW M3', shape: 'sedan', color: '#2563eb', price: 1500 },
      { id: 'car-g63', name: 'Mercedes-AMG G 63', shape: 'suv', color: '#111827', price: 3000 },
      { id: 'car-911', name: 'Porsche 911 GT3', shape: 'sport', color: '#e5e7eb', price: 5000 },
      { id: 'car-r8', name: 'Audi R8', shape: 'super', color: '#6b7280', price: 6000 },
      { id: 'car-amggt', name: 'Mercedes-AMG GT Black Series', shape: 'sport', color: '#f97316', price: 7500 },
      { id: 'car-huracan', name: 'Lamborghini Huracán', shape: 'super', color: '#84cc16', price: 9000 },
      { id: 'car-720s', name: 'McLaren 720S', shape: 'super', color: '#fb923c', price: 10000 },
      { id: 'car-aventador', name: 'Lamborghini Aventador', shape: 'super', color: '#a855f7', price: 12000 },
      { id: 'car-sf90', name: 'Ferrari SF90', shape: 'super', color: '#ef4444', price: 13000 },
      { id: 'car-chiron', name: 'Bugatti Chiron', shape: 'hyper', color: '#1d4ed8', price: 18000 },
    ],
  },
  homes: {
    label: 'Immobilien',
    items: [
      { id: 'home-wg', name: 'WG-Zimmer in Favoriten', emoji: '🛏️', price: 500 },
      { id: 'home-altbau', name: 'Altbauwohnung in Wien', emoji: '🏢', price: 1200 },
      { id: 'home-loft', name: 'Loft mit eigenem Tonstudio', emoji: '🎚️', price: 2500 },
      { id: 'home-haus', name: 'Haus mit Garten', emoji: '🏡', price: 5000 },
      { id: 'home-ibiza', name: 'Villa auf Ibiza', emoji: '🏝️', price: 12000 },
      { id: 'home-dubai', name: 'Penthouse in Dubai', emoji: '🌆', price: 16000 },
    ],
  },
  legendary: {
    label: 'Legendär',
    items: [
      // ~3 years of 2 orders/week. Needs coins *and* deliveries.
      { id: 'vip-chaya', name: 'BBL Chaya – VIP-Managerin', price: 20000, needs: { delivered: 150 } },
    ],
  },
};

// Side-view car (viewBox 120×50) from a shape + colour.
const CAR_BODY = {
  hatch: ['M8 38 L10 27 L30 24 L41 12 L88 12 L99 24 L110 27 L111 38Z', 'M44 15 L86 15 L94 24 L36 24Z'],
  sedan: ['M6 38 L8 29 L30 26 L43 15 L78 15 L93 26 L112 28 L114 38Z', 'M46 18 L76 18 L88 26 L36 26Z'],
  suv: ['M8 38 L8 11 L98 11 L106 22 L112 24 L112 38Z', 'M14 14 L50 14 L50 23 L14 23Z M54 14 L94 14 L101 23 L54 23Z'],
  sport: ['M8 38 Q9 28 28 26 Q46 12 70 14 Q96 18 111 31 L112 38Z', 'M44 22 Q56 15 70 17 Q84 20 90 26 L38 26Z'],
  super: ['M6 38 L12 30 L40 24 L60 15 L82 16 L108 29 L113 38Z', 'M46 24 L61 17 L79 18 L90 25Z'],
  hyper: ['M6 38 Q8 30 30 27 Q50 14 74 15 Q100 18 112 32 L113 38Z', 'M46 25 Q58 17 74 18 Q88 20 94 26Z'],
};
export function carSvg(item) {
  const [body, glass] = CAR_BODY[item.shape] || CAR_BODY.sport;
  const wheel = (x) => `<circle cx="${x}" cy="38" r="8.5" fill="#111"/><circle cx="${x}" cy="38" r="4.5" fill="#9ca3af"/><circle cx="${x}" cy="38" r="1.5" fill="#111"/>`;
  return `<svg viewBox="0 0 120 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="stroke:none;fill:none;stroke-width:1">
    <ellipse cx="60" cy="46" rx="54" ry="3" fill="rgba(0,0,0,.25)"/>
    <path d="${body}" fill="${item.color}"/>
    <path d="${body}" fill="url(#shine-${item.id})"/>
    <path d="${glass}" fill="#0f172a" opacity=".85"/>
    <path d="M10 33 L110 33" stroke="rgba(0,0,0,.18)" stroke-width="1"/>
    <rect x="${item.shape === 'suv' ? 107 : 106}" y="30" width="6" height="3" rx="1.5" fill="#fef08a"/>
    <rect x="6" y="31" width="5" height="3" rx="1.5" fill="#ef4444"/>
    ${wheel(item.shape === 'suv' ? 28 : 30)}${wheel(item.shape === 'suv' ? 92 : 91)}
    <defs><linearGradient id="shine-${item.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs>
  </svg>`;
}

// Experts unlock once you own a car AND a home worth ≥ this together
// (~2–3 months of steady work). The Ultra-Boss needs about a year.
export const EXPERT_UNLOCK_VALUE = 1300;
export const BOSS_UNLOCK = { days: 330, delivered: 70, expertsAccepted: 1 };

export const ITEMS = {
  ...Object.fromEntries(Object.entries(SHOP).flatMap(([cat, c]) => c.items.map((i) => [i.id, { ...i, cat }]))),
  // Exclusive career rewards (not buyable).
  ...Object.fromEntries(Object.entries(CAREER_ITEMS).map(([id, i]) => [id, { ...i, id, career: true }])),
};

// Trophies are earned automatically; each one also pays a coin bonus.
// `check(stats)` returns [current, goal].
export const TROPHIES = [
  { id: 'first', icon: '🎉', name: 'Erste Abgabe', desc: 'Deinen ersten Auftrag abgegeben', check: (s) => [s.delivered, 1] },
  { id: 'ontime5', icon: '⏰', name: 'Pünktlich', desc: '5 Aufträge pünktlich abgegeben', check: (s) => [s.onTime, 5] },
  { id: 'ten', icon: '💯', name: 'Perfekt', desc: 'Einen Track mit 10/10 bewertet', check: (s) => [s.tens, 1] },
  { id: 'song1', icon: '🎙️', name: 'Artist', desc: 'Vocals auf deinen eigenen Beat', check: (s) => [s.songs, 1] },
  { id: 'video1', icon: '🎬', name: 'Regisseur', desc: 'Dein erstes Video fertig', check: (s) => [s.videos, 1] },
  { id: 'streak4', icon: '🔥', name: 'Dranbleiber', desc: '4 Wochen in Folge abgegeben', check: (s) => [s.streak, 4] },
  { id: 'skills10', icon: '🧠', name: 'Wissbegierig', desc: '10 verschiedene Skills gelernt', check: (s) => [s.skills, 10] },
  { id: 'areas', icon: '🧭', name: 'Allrounder', desc: 'In 8 Bereichen etwas gelernt', check: (s) => [s.areas, 8] },
  { id: 'genres', icon: '🌍', name: 'Genre-Hopper', desc: 'In 5 Genres mind. 8/10 geschafft', check: (s) => [s.goodGenres, 5] },
  { id: 'level5', icon: '⭐️', name: 'Aufsteiger', desc: 'Level 5 erreicht', check: (s) => [s.level, 5] },
  { id: 'twenty', icon: '🏅', name: 'Produzent', desc: '20 Aufträge abgegeben', check: (s) => [s.delivered, 20] },
  { id: 'expert1', icon: '🎖️', name: 'Vom Experten abgesegnet', desc: 'Einen Experten-Auftrag bestanden', check: (s) => [s.expertsAccepted, 1] },
  { id: 'boss', icon: '💀', name: 'Boss besiegt', desc: 'Den Ultra-Boss mit einem Release überzeugt', check: (s) => [s.bossBeaten, 1] },
  { id: 'clients25', icon: '📇', name: 'Netzwerker', desc: '25 verschiedene Kunden bedient', check: (s) => [s.clients, 25] },
  { id: 'clientsAll', icon: '🌐', name: 'Jeder kennt dich', desc: 'Alle Kunden mindestens einmal bedient', check: (s) => [s.clients, s.clientsTotal] },
];
export const TROPHY_BONUS = 50;

// Coins for one delivered order.
export function orderCoins(o, threshold) {
  if (o.deleted || o.status !== 'delivered') return 0;
  let c = o.type === 'own' ? 15 : 20;
  if (o.deadline && o.deliveredAt <= o.deadline) c += 10;
  if (o.challenge?.done) c += 15;
  const r = o.review?.rating;
  if (r) c += r >= threshold ? 25 : r >= 7 ? 10 : 0;
  if (o.tier === 'expert' && o.accepted) c += 150;
  if (o.tier === 'boss' && o.accepted) c += 1500;
  if (o.rush && o.deadline && o.deliveredAt <= o.deadline) c *= 2; // ⚡ Eil-Auftrag pünktlich = doppelt
  return c;
}

export const DEFAULT_PROFILE = { owned: [], frame: null, banner: null };
