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
};

export const ITEMS = Object.fromEntries(
  Object.entries(SHOP).flatMap(([cat, c]) => c.items.map((i) => [i.id, { ...i, cat }]))
);

// Trophies are earned automatically; each one also pays a coin bonus.
// `check(stats)` returns [current, goal].
export const TROPHIES = [
  { id: 'first', icon: '🎉', name: 'Erste Abgabe', desc: 'Deinen ersten Auftrag abgegeben', check: (s) => [s.delivered, 1] },
  { id: 'ontime5', icon: '⏰', name: 'Pünktlich', desc: '5 Aufträge pünktlich abgegeben', check: (s) => [s.onTime, 5] },
  { id: 'ten', icon: '💯', name: 'Perfekt', desc: 'Einen Track mit 10/10 bewertet', check: (s) => [s.tens, 1] },
  { id: 'video1', icon: '🎬', name: 'Regisseur', desc: 'Dein erstes Video fertig', check: (s) => [s.videos, 1] },
  { id: 'streak4', icon: '🔥', name: 'Dranbleiber', desc: '4 Wochen in Folge abgegeben', check: (s) => [s.streak, 4] },
  { id: 'skills10', icon: '🧠', name: 'Wissbegierig', desc: '10 verschiedene Skills gelernt', check: (s) => [s.skills, 10] },
  { id: 'areas', icon: '🧭', name: 'Allrounder', desc: 'In 8 Bereichen etwas gelernt', check: (s) => [s.areas, 8] },
  { id: 'genres', icon: '🌍', name: 'Genre-Hopper', desc: 'In 5 Genres mind. 8/10 geschafft', check: (s) => [s.goodGenres, 5] },
  { id: 'level5', icon: '⭐️', name: 'Aufsteiger', desc: 'Level 5 erreicht', check: (s) => [s.level, 5] },
  { id: 'twenty', icon: '🏅', name: 'Produzent', desc: '20 Aufträge abgegeben', check: (s) => [s.delivered, 20] },
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
  return c;
}

export const DEFAULT_PROFILE = { owned: [], frame: null, banner: null };
