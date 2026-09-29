import { db, requestPersistence, STATE_KEYS } from './db.js';
import {
  ORDER_TYPES, GENRES, DEFAULT_SETTINGS, generateOrder, createOwnProject,
  clientReply, nextArrival, uid, createVideoOrder, createVocalOrder, rerollConcept, reviewOpensAt,
  SKILLS, levelInfo, DEFAULT_GENRE_WEIGHTS, GENRE_LABELS, TASTE_VERSION, analyze, pickChallenge, windowOn, freeMinutesPerWeek,
  createExpertOrder, createBossOrder, verdictReply, isFan, EXPERT_MIN, vocalBrief, songPrompt,
  createEventOrder, GENRE_RENAMES,
} from './generator.js';
import { titleFor, tipOfDay, questsForWeek } from './motivation.js';
import { FAMILIES } from './genres.js';
import { PLATFORMS, careerTitle, fmtNum } from './careers.js';
import { SHOP, ITEMS, TROPHIES, TROPHY_BONUS, orderCoins, DEFAULT_PROFILE, carSvg, EXPERT_UNLOCK_VALUE, BOSS_UNLOCK } from './shop.js';
import {
  ensureAudioGraph, resumeAudio, createVisualizer, startRecording, stopRecording, isRecording,
} from './visualizer.js';
import { CUSTOMERS, CUSTOMER_BY_ID, ARCHETYPES, EXPERTS, BOSS, avatarSvg, vipAvatar, VIP_LINES, firstName } from './customers.js';
import { PEOPLE } from './people.js';
import { cloud } from './cloud.js';
import {
  isNative, App, LocalNotifications, notifId, requestNotificationPermission, scheduleAll, shareBlob, writeTextFile, shareUri,
} from './native.js';

// ---------------------------------------------------------------- state --

const state = {
  tab: 'orders',
  settings: { ...DEFAULT_SETTINGS },
  orders: [],
  filter: { type: 'all', genre: 'all', q: '' },
  sheet: null, // { kind: 'order' | 'own' | ..., id? }
  playing: null, // { orderId, subId, url }
  cloudUser: null,
  nextOrderAt: null,
  profile: { ...DEFAULT_PROFILE },
  pfpUrl: null,
  shopTab: 'frames',
  sessions: [], // finished studio sessions { start, end, minutes, orderId }
  activeSession: null, // { start, orderId }
  career: { stats: {}, claimed: [] }, // stats[platform] = [{ t, v }], claimed = [{ id, reward }]
  lexFam: 'Alle',
};

const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');
const audio = $('#audio');

// --------------------------------------------------------------- helpers --

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isActive = (o) => !o.deleted && (o.status === 'new' || o.status === 'in_progress');
const visible = (o) => !o.deleted && o.status !== 'declined';
const DAY = 86400000;
const MODE = {
  neu: { icon: '🧭', label: 'Neuland – ganz neues Skillset' },
  aufbauen: { icon: '📈', label: 'Baut auf deiner Stärke auf' },
  'üben': { icon: '🎯', label: 'Üben' },
};
const fmtHours = (h) => `${String(h).replace('.', ',')} Std`;
const selfMade = (o) => o.type === 'own' || o.type === 'video' || o.type === 'vocals'; // no "client"
const isAudioFile = (s) => (s.mime || '').startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac|aiff?|ogg)$/i.test(s.name);
const isVideoFile = (s) => (s.mime || '').startsWith('video/') || /\.(mp4|mov|m4v|webm|3gp)$/i.test(s.name);
// Self-review: opens the day after delivery, then rate 1–10.
const reviewOpen = (o) => visible(o) && o.review && !o.review.rating && Date.now() >= o.review.opensAt;
const reviewWaiting = (o) => visible(o) && o.review && !o.review.rating && Date.now() < o.review.opensAt;

// Top rating unlocks the next step: a beat gets vocals, a song gets a video.
const BEAT_TYPES = ['instrumental', 'remix'];
const unlockFor = (o) => (BEAT_TYPES.includes(o.type) ? 'vocals' : 'video');
// Beats unlock vocals at a lower bar (write lots of songs!), songs → video higher.
const thrFor = (o) => (unlockFor(o) === 'vocals' ? state.settings.vocalThreshold : state.settings.videoThreshold);
const UNLOCK = {
  vocals: { icon: '🎙️', short: 'Vocals', free: 'Freigegeben für Vocals', hint: 'wird er für Vocals freigegeben', go: 'Zum Vocal-Auftrag' },
  video: { icon: '🎬', short: 'Video', free: 'Freigegeben für Videos', hint: 'wird der Song fürs Video freigegeben', go: 'Zum Video-Auftrag' },
};

// ---- Progress: XP, level, weekly streak, learned skills -----------------
function orderXp(o) {
  if (!visible(o) || o.status !== 'delivered') return 0;
  let xp = selfMade(o) ? 8 : 10;
  if (o.deadline && o.deliveredAt <= o.deadline) xp += 5;
  if (o.challenge?.done) xp += 10;
  if (o.review?.rating) xp += o.review.rating + (o.review.rating >= thrFor(o) ? 10 : 0);
  if (o.accepted) xp += o.tier === 'boss' ? 300 : 40;
  return xp;
}
const weekStart = (ts) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d.getTime();
};
function progress() {
  const done = state.orders.filter((o) => visible(o) && o.status === 'delivered');
  const sessionMin = state.sessions.reduce((a, x) => a + x.minutes, 0);
  const info = levelInfo(done.reduce((a, o) => a + orderXp(o), 0) + Math.floor(sessionMin / 10));
  // Streak: weeks in a row with at least one delivery (this week may still be open).
  const weeks = new Set(done.map((o) => weekStart(o.deliveredAt)));
  let w = weekStart(Date.now()), streak = 0;
  if (!weeks.has(w)) w -= 7 * DAY;
  while (weeks.has(w)) { streak++; w = weekStart(w - 3 * DAY); }
  const skills = new Set(done.filter((o) => o.challenge?.done).map((o) => o.challenge.name));
  const rated = done.filter((o) => o.review?.rating);
  const genreAvg = {};
  for (const o of rated) (genreAvg[o.genre] ||= []).push(o.review.rating);
  const tstats = {
    delivered: done.filter((o) => !selfMade(o)).length,
    onTime: done.filter((o) => o.deadline && o.deliveredAt <= o.deadline).length,
    tens: rated.filter((o) => o.review.rating === 10).length,
    videos: done.filter((o) => o.type === 'video').length,
    songs: done.filter((o) => o.type === 'vocals').length,
    streak, skills: skills.size, level: info.level,
    areas: new Set(done.filter((o) => o.challenge?.done).map((o) => o.challenge.area)).size,
    goodGenres: Object.values(genreAvg).filter((a) => a.reduce((x, y) => x + y, 0) / a.length >= 8).length,
    clients: new Set(done.map((o) => o.customerId).filter((id) => CUSTOMER_BY_ID[id] && !o_isTier(id))).size,
    expertsAccepted: done.filter((o) => o.tier === 'expert' && o.accepted).length,
    bossBeaten: done.filter((o) => o.tier === 'boss' && o.accepted).length,
    clientsTotal: CUSTOMERS.length,
  };
  const trophies = TROPHIES.map((t) => { const [cur, goal] = t.check(tstats); return { ...t, cur: Math.min(cur, goal), goal, won: cur >= goal }; });
  const questCoins = (state.profile.claims || []).reduce((a, c) => a + c.reward, 0)
    + (state.career.claimed || []).reduce((a, c) => a + c.reward, 0);
  const earned = done.reduce((a, o) => a + orderCoins(o, thrFor(o)), 0) + trophies.filter((t) => t.won).length * TROPHY_BONUS + questCoins;
  const spent = state.profile.owned.reduce((a, id) => a + (ITEMS[id]?.price || 0), 0);
  return { ...info, title: titleFor(info.level), sessionMin, streak, skills, trophies, coins: earned - spent, delivered: tstats.delivered, served: new Set(done.map((o) => o.customerId).filter(Boolean)) };
}
const o_isTier = (id) => /^(expert|boss):/.test(id);

// ---- Experts & Boss unlocks ----------------------------------------------
function assetInfo() {
  const items = state.profile.owned.map((id) => ITEMS[id]).filter(Boolean);
  const cars = items.filter((i) => i.cat === 'garage');
  const homes = items.filter((i) => i.cat === 'homes');
  const value = [...cars, ...homes].reduce((a, i) => a + i.price, 0);
  return { cars, homes, value };
}
const expertsUnlocked = () => { const a = assetInfo(); return a.cars.length > 0 && a.homes.length > 0 && a.value >= EXPERT_UNLOCK_VALUE; };
function bossInfo() {
  const live = state.orders.filter((o) => !o.deleted);
  const first = live.reduce((m, o) => Math.min(m, o.createdAt), Date.now());
  const days = Math.floor((Date.now() - first) / DAY);
  const delivered = live.filter((o) => o.status === 'delivered' && !selfMade(o)).length;
  const experts = live.filter((o) => o.tier === 'expert' && o.accepted).length;
  const ok = days >= BOSS_UNLOCK.days && delivered >= BOSS_UNLOCK.delivered && experts >= BOSS_UNLOCK.expertsAccepted;
  return { days, delivered, experts, ok };
}
const TIER = {
  expert: { badge: '🎖️ EXPERTE', label: 'Experte' },
  boss: { badge: '💀 ULTRA-BOSS', label: 'Ultra-Boss' },
  event: { badge: '✨ SPECIAL EVENT', label: 'Special Event' },
};

// ---- week stats & quests ---------------------------------------------------
const weekKey = (ts = Date.now()) => new Date(weekStart(ts)).toISOString().slice(0, 10);
function weekStats(ts = Date.now()) {
  const a = weekStart(ts), b = a + 7 * DAY;
  const inW = (t) => t >= a && t < b;
  const live = state.orders.filter((o) => !o.deleted);
  const done = live.filter((o) => o.status === 'delivered' && inW(o.deliveredAt));
  const firstByGenre = {};
  for (const o of live.filter((x) => x.status === 'delivered')) firstByGenre[o.genre] = Math.min(firstByGenre[o.genre] ?? Infinity, o.deliveredAt);
  const sess = state.sessions.filter((x) => inW(x.start));
  const rated = live.filter((o) => o.review?.ratedAt && inW(o.review.ratedAt));
  return {
    delivered: done.length,
    onTime: done.filter((o) => o.deadline && o.deliveredAt <= o.deadline).length,
    minutes: sess.reduce((m, x) => m + x.minutes, 0),
    sessionDays: new Set(sess.map((x) => new Date(x.start).toDateString())).size,
    newGenres: new Set(done.filter((o) => firstByGenre[o.genre] >= a).map((o) => o.genre)).size,
    challenges: done.filter((o) => o.challenge?.done).length,
    neuland: done.filter((o) => o.challenge?.done && o.challenge.mode === 'neu').length,
    reviews: rated.length,
    eights: rated.filter((o) => o.review.rating >= 8).length,
    vocals: done.filter((o) => o.type === 'vocals' || o.type === 'full_song' || o.type === 'release').length,
    declined: live.filter((o) => o.status === 'declined' && inW(o.updatedAt)).length,
    ratingAvg: rated.length ? rated.reduce((m, o) => m + o.review.rating, 0) / rated.length : null,
    best: rated.reduce((m, o) => Math.max(m, o.review.rating), 0),
  };
}
function currentQuests() {
  const w = weekStats();
  const key = weekKey();
  const claimed = new Set((state.profile.claims || []).filter((c) => c.w === key).map((c) => c.id));
  return questsForWeek(key).map((q) => { const [cur, goal] = q.check(w); return { ...q, cur: Math.min(cur, goal), goal, done: cur >= goal, claimed: claimed.has(q.id) }; });
}
// Auto-claim finished quests (coins are stored in the profile).
async function claimQuests() {
  const fresh = currentQuests().filter((q) => q.done && !q.claimed);
  if (!fresh.length) return;
  state.profile.claims = [...(state.profile.claims || []), ...fresh.map((q) => ({ w: weekKey(), id: q.id, reward: q.reward }))];
  await db.set('profile', state.profile);
  fresh.forEach((q, i) => setTimeout(() => toast(`🏅 Quest geschafft: ${q.text} · +${q.reward} 🪙`), 600 + i * 2800));
}

// ---- studio sessions (timer) -------------------------------------------------
const fmtClock = (ms) => { const t = Math.floor(ms / 1000); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60; return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(sec).padStart(2, '0')}`; };
async function startSession(orderId = null) {
  if (state.activeSession) return;
  state.activeSession = { start: Date.now(), orderId };
  await db.set('activeSession', state.activeSession);
  toast('⏱ Session läuft – viel Spaß im Studio!');
  renderSessionBar(); render(); if (state.sheet) renderSheet();
}
async function stopSession() {
  const a = state.activeSession;
  if (!a) return;
  let minutes = Math.round((Date.now() - a.start) / 60000);
  if (minutes > 240) { minutes = 240; toast('Timer lief über 4 Std – ich zähle 4 Std 😉'); }
  state.activeSession = null;
  await db.set('activeSession', null);
  if (minutes >= 1) {
    const before = progress();
    state.sessions = [...state.sessions, { start: a.start, end: Date.now(), minutes, orderId: a.orderId }];
    await db.set('sessions', state.sessions);
    rewardToast(before, `⏱ ${minutes} Min Studio-Zeit gespeichert`);
    claimQuests();
  }
  renderSessionBar(); render(); if (state.sheet) renderSheet();
}
function renderSessionBar() {
  let bar = $('#sessionBar');
  if (!state.activeSession) { bar?.remove(); return; }
  if (!bar) {
    bar = document.createElement('button');
    bar.id = 'sessionBar'; bar.className = 'session-bar glass'; bar.dataset.action = 'stop-session';
    document.body.appendChild(bar);
  }
  const o = state.orders.find((x) => x.id === state.activeSession.orderId);
  bar.innerHTML = `<span class="rec-dot"></span> ${fmtClock(Date.now() - state.activeSession.start)}${o ? ` · ${esc(orderTitle(o)).slice(0, 26)}` : ''} <b>Stopp</b>`;
}
setInterval(() => state.activeSession && renderSessionBar(), 1000);

const genOpts = () => ({ history: state.orders.filter((o) => !o.deleted), settings: state.settings });

// Toast the XP/coins/trophies a change brought ("before" = progress() before it).
function rewardToast(before, msg) {
  const after = progress();
  const parts = [];
  if (after.xp > before.xp) parts.push(`+${after.xp - before.xp} XP`);
  if (after.coins > before.coins) parts.push(`+${after.coins - before.coins} 🪙`);
  toast([msg, parts.join(' · ')].filter(Boolean).join(' · '));
  const newT = after.trophies.filter((t) => t.won && !before.trophies.find((b) => b.id === t.id).won);
  const extra = [];
  if (after.level > before.level) extra.push(`⬆️ Level ${after.level}!`);
  for (const t of newT) extra.push(`${t.icon} Trophäe: ${t.name} (+${TROPHY_BONUS} 🪙)`);
  extra.forEach((m, i) => setTimeout(() => toast(m), 2800 * (i + 1)));
}

function hue(str) {
  let h = 0;
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
const gradient = (str) => {
  const h = hue(str);
  return `linear-gradient(135deg, hsl(${h} 85% 60%), hsl(${(h + 50) % 360} 80% 50%))`;
};
const customerOf = (o) => CUSTOMER_BY_ID[o.customerId];
const hasVip = () => state.profile.owned.includes('vip-chaya');
const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

function fmtDate(ts, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Date(ts).toLocaleDateString('de-DE', opts);
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}
function fmtDuration(sec) {
  if (!sec || !isFinite(sec)) return '';
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
function fmtSize(bytes) {
  return bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

function dueInfo(o) {
  if (!o.deadline) return { text: 'Ohne Deadline', cls: '' };
  if (o.status === 'delivered') {
    const late = o.deliveredAt > o.deadline;
    return late ? { text: 'Verspätet abgegeben', cls: 'orange' } : { text: 'Pünktlich abgegeben', cls: 'green' };
  }
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.floor((o.deadline - startToday) / DAY);
  if (o.deadline < now.getTime()) {
    const over = Math.max(1, Math.ceil((now - o.deadline) / DAY));
    return { text: over === 1 ? 'Überfällig' : `Seit ${over} Tagen überfällig`, cls: 'red' };
  }
  if (days === 0) return { text: 'Heute fällig', cls: 'red' };
  if (days === 1) return { text: 'Morgen fällig', cls: 'orange' };
  return { text: `Noch ${days} Tage`, cls: days <= 2 ? 'orange' : 'blue' };
}

function orderTitle(o) {
  if (selfMade(o)) return o.title || 'Eigenes Projekt';
  return `${ORDER_TYPES[o.type]?.label || o.type} für ${o.client}`;
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

const ICON = {
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  close: '<svg class="stroke" viewBox="0 0 24 24" style="stroke:currentColor;fill:none;stroke-width:2.2"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  share: '<svg class="stroke" viewBox="0 0 24 24"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
};

// ------------------------------------------------------------ persistence --

async function saveOrder(o, { silent } = {}) {
  o.updatedAt = Date.now();
  await db.putOrder(o);
  const i = state.orders.findIndex((x) => x.id === o.id);
  if (i >= 0) state.orders[i] = o; else state.orders.push(o);
  updateBadge();
  scheduleNative();
  claimQuests();
  if (!silent) syncSoon();
}

async function saveSettings() {
  await db.set('settings', state.settings);
}

let syncTimer;
function syncSoon() {
  if (!state.cloudUser) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => runSync(true), 2500);
}

let syncing = false;
async function runSync(quiet) {
  if (syncing) return;
  syncing = true;
  try {
    const r = await cloud.sync();
    state.orders = await db.allOrders();
    if (r.stateChanged) await loadState();
    if (!quiet) toast(`Synchronisiert ☁️ ↓${r.pulled} ↑${r.pushed}${r.uploaded ? ` · ${r.uploaded} Dateien` : ''}${r.skipped ? ` · ${r.skipped} nur lokal (zu groß)` : ''}`);
    render();
    if (state.sheet) renderSheet();
  } catch (e) {
    if (!quiet) toast(`Sync fehlgeschlagen: ${e.message}`);
    console.warn('sync', e);
  } finally {
    syncing = false;
  }
}

// ----------------------------------------------------- order arrivals --

// The next order is generated ahead of time and kept as "pendingOrder" until
// its arrival time. That way the Android app can schedule a notification with
// the real client + brief even while the app is closed.

const activeCount = () => state.orders.filter((o) => isActive(o) && !selfMade(o)).length;

async function newPending(from = Date.now()) {
  const stage = careerStage();
  const types = { ...state.settings.types };
  for (const [k, f] of Object.entries(stage.boost)) if (types[k]) types[k] *= f;
  const opts = { at: nextArrival(state.settings, from), ...genOpts(), settings: { ...state.settings, types } };
  const live = state.orders.filter((o) => !o.deleted);
  const lastBoss = live.filter((o) => o.tier === 'boss').reduce((m, o) => Math.max(m, o.createdAt), 0);
  let p;
  if (bossInfo().ok && !live.some((o) => o.tier === 'boss' && isActive(o)) && Date.now() - lastBoss > 60 * DAY && Math.random() < 0.25) {
    p = createBossOrder(state.settings, opts);
  } else if (eventsUnlocked() && !live.some((o) => o.tier === 'event' && isActive(o)) && Math.random() < stage.event) {
    p = createEventOrder(state.settings, opts);
  } else if (expertsUnlocked() && !live.some((o) => o.tier === 'expert' && isActive(o)) && Math.random() < stage.expert) {
    p = createExpertOrder(state.settings, opts);
  } else if (!live.some((o) => o.rush && isActive(o)) && Math.random() < 0.08) {
    // ⚡ Eil-Auftrag: small job, short deadline, double reward.
    p = generateOrder(opts.settings, { ...opts, type: pick(['hook', 'vocal_chain']) });
    const d = new Date(p.createdAt); d.setDate(d.getDate() + 2); d.setHours(23, 59, 0, 0);
    Object.assign(p, { rush: true, deadline: d.getTime(), budget: Math.round(p.budget * 1.5), brief: `⚡ EILT!!! Bis übermorgen bitte.\n${p.brief}` });
  } else {
    p = generateOrder(opts.settings, opts);
  }
  await db.set('pendingOrder', p);
  return p;
}

async function checkArrivals() {
  const now = Date.now();
  let pending = (await db.get('pendingOrder')) || (await newPending(now));
  if (now >= pending.createdAt && activeCount() < state.settings.maxActive) {
    // Waited long (e.g. because you were at your limit)? Then the clock starts now.
    const delay = now - pending.createdAt;
    if (delay > 12 * 3600e3) {
      const d = new Date(pending.deadline + delay);
      d.setHours(23, 59, 0, 0);
      pending.deadline = d.getTime();
      pending.createdAt = now;
    }
    pending.updatedAt = now;
    await receiveOrder(pending);
    pending = await newPending(now);
  }
  state.nextOrderAt = pending.createdAt;
  scheduleNative(pending);
}

async function receiveOrder(order) {
  await saveOrder(order);
  toast(`📥 Neuer Auftrag von ${order.client}`);
  if (!isNative) notify(order); // Android already showed the scheduled notification
  render();
}

const slotStart = (ts) => {
  const w = windowOn(ts, state.settings.week);
  if (w) return w[0];
  const d = new Date(ts); d.setHours(18, 0, 0, 0); return d.getTime();
};

// Android: (re)plan the upcoming order notification plus deadline reminders.
async function scheduleNative(pending) {
  if (!isNative || !state.settings.notifications) return;
  pending = pending || (await db.get('pendingOrder'));
  const list = [];
  if (pending && activeCount() < state.settings.maxActive) {
    list.push({
      id: 1,
      title: `📥 ${pending.client} · ${ORDER_TYPES[pending.type].label}`,
      body: pending.brief,
      at: pending.createdAt,
      extra: { orderId: pending.id },
    });
  }
  for (const o of state.orders.filter(isActive)) {
    if (!o.deadline) continue;
    const at = new Date(slotStart(o.deadline)); // when your free time starts that day
    list.push({
      id: notifId(o.id),
      title: `⏰ Heute fällig: ${orderTitle(o)}`,
      body: o.submissions.length ? 'Du hast schon eine Version – abgeben nicht vergessen!' : 'Noch nichts hochgeladen. Schaffst du es heute noch?',
      at: at.getTime(),
      extra: { orderId: o.id },
    });
  }
  for (const o of state.orders.filter((x) => visible(x) && x.review && !x.review.rating)) {
    const at = new Date(slotStart(o.review.opensAt));
    list.push({
      id: notifId(o.id + ':review'),
      title: `🎧 Nochmal anhören: ${orderTitle(o)}`,
      body: `Mit frischen Ohren bewerten – ab ${thrFor(o)}/10 ${UNLOCK[unlockFor(o)].hint} ${UNLOCK[unlockFor(o)].icon}`,
      at: at.getTime(),
      extra: { orderId: o.id },
    });
  }
  // "Deine Studio-Zeit beginnt" – next 3 free slots, only while something is open.
  const open = state.orders.filter((o) => isActive(o)).sort((a, b) => (a.deadline || Infinity) - (b.deadline || Infinity));
  if (open.length) {
    const sessionToday = state.sessions.some((x) => new Date(x.start).toDateString() === new Date().toDateString());
    for (let i = 0; i < 3; i++) {
      const w = windowOn(Date.now() + i * DAY, state.settings.week);
      if (!w || (i === 0 && sessionToday)) continue;
      const hrs = ((w[1] - w[0]) / 3.6e6).toFixed(1).replace('.', ',');
      list.push({ id: 9000 + i, title: '🎧 Deine Studio-Zeit beginnt', body: `${hrs} Std frei – „${orderTitle(open[0])}“ wartet. Session starten?`, at: w[0] + 5 * 60e3 });
    }
  }
  try { await scheduleAll(list); } catch (e) { console.warn('schedule', e); }
}

async function notify(order) {
  if (!state.settings.notifications || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.ready;
    const title = `${order.client} · ${ORDER_TYPES[order.type].label}`;
    const opts = {
      body: order.brief,
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      tag: order.id,
      data: { orderId: order.id, url: `./?order=${order.id}` },
    };
    if (reg) await reg.showNotification(title, opts);
    else new Notification(title, opts);
  } catch (e) {
    console.warn('notify', e);
  }
}

function updateBadge() {
  const n = state.orders.filter((o) => (!o.deleted && o.status === 'new') || reviewOpen(o)).length;
  const b = $('#tabBadge');
  b.hidden = n === 0;
  b.textContent = n;
  try {
    if (navigator.setAppBadge) n ? navigator.setAppBadge(n) : navigator.clearAppBadge();
  } catch {}
}

// ------------------------------------------------------------ rendering --

function render() {
  const tabFor = state.tab === 'settings' ? 'profile' : state.tab;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tabFor));
  if (state.tab === 'orders') view.innerHTML = renderOrders();
  else if (state.tab === 'library') view.innerHTML = renderLibrary();
  else if (state.tab === 'lexikon') view.innerHTML = renderLexikon();
  else if (state.tab === 'career') view.innerHTML = renderCareer();
  else if (state.tab === 'profile') view.innerHTML = renderProfile();
  else view.innerHTML = renderSettings();
  renderMiniPlayer();
}

function installHint() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (isNative || standalone || state.hideInstallHint) return '';
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const android = /Android/.test(navigator.userAgent);
  if (!ios && !android) return '';
  const how = ios
    ? 'Tippe unten in Safari auf <b style="display:inline">Teilen</b> → <b style="display:inline">Zum Home-Bildschirm</b>.'
    : state.installPrompt
      ? 'Installiere die App auf deinem Startbildschirm.'
      : 'Tippe in Chrome oben rechts auf <b style="display:inline">⋮</b> → <b style="display:inline">App installieren</b>.';
  return `<div class="hint glass">
    <div style="font-size:26px">📲</div>
    <div><b>Als App installieren</b>${how} Dann bekommst du auch Mitteilungen.
      ${state.installPrompt ? '<br><button class="btn small" style="margin-top:8px" data-action="install">Installieren</button>' : ''}</div>
    <button class="x" data-action="hide-hint" aria-label="Schließen">×</button>
  </div>`;
}

function orderCard(o) {
  const T = ORDER_TYPES[o.type];
  const due = dueInfo(o);
  const frac = o.deadline ? Math.min(1, Math.max(0, (Date.now() - o.createdAt) / (o.deadline - o.createdAt))) : 0;
  const thr = thrFor(o);
  const status = o.status === 'new' ? '<span class="pill accent">Neu</span>'
    : o.status === 'in_progress' ? '<span class="pill">In Arbeit</span>'
    : reviewOpen(o) ? '<span class="pill accent">Bewerten</span>'
    : reviewWaiting(o) ? '<span class="pill">🔒 Morgen</span>'
    : o.review?.rating ? `<span class="pill ${o.review.rating >= thr ? 'green' : ''}">${o.review.rating}/10${o.review.rating >= thr ? ` ${UNLOCK[unlockFor(o)].icon}` : ''}</span>` : '';
  return `<button class="card glass ${o.tier ? `tier-${o.tier}` : ''}" data-action="open-order" data-id="${o.id}" style="display:block;width:100%;text-align:left">
    ${o.tier ? `<div class="tier-badge">${TIER[o.tier].badge}${o.minRating ? ` · mind. ${o.minRating}/10` : ' · +150 🪙'}</div>` : ''}
    <div class="order-top">
      <div class="avatar ${o.tier ? `ring-${o.tier}` : ''}" style="background:${gradient(o.type === 'video' ? o.title : o.client)}">${selfMade(o) ? T.icon : customerOf(o) ? avatarSvg(customerOf(o)) : esc(initials(o.client))}</div>
      <div class="order-meta">
        <div class="order-client">${esc(selfMade(o) ? orderTitle(o) : o.client)}${customerOf(o) ? ` <small class="arch">${esc(ARCHETYPES[customerOf(o).arch].label)}${!o.tier && isFan(o.customerId, state.orders.filter((x) => x.id !== o.id)) ? ' · ⭐ Stammkunde' : ''}</small>` : ''}</div>
        <div class="order-sub">${T.icon} ${esc(T.label)} · ${esc(o.genre)}${o.bpm ? ` · ${o.bpm} BPM` : ''}</div>
      </div>
      ${status}
    </div>
    ${o.type === 'own' && !o.tier ? '' : `<p class="order-brief">${esc(o.brief.replace(/\s*\n+\s*/g, ' '))}</p>`}
    <div class="order-foot">
      <span class="pill ${due.cls}">${due.text}</span>
      ${o.rush && o.status !== 'delivered' ? '<span class="pill orange">⚡ Eilt · 2× Coins</span>' : ''}
      ${o.challenge ? `<span class="pill ${o.challenge.done ? 'green' : 'blue'}">${MODE[o.challenge.mode]?.icon || '🎯'} ${esc(o.challenge.area)}${o.challenge.done ? ' ✓' : ''}</span>` : ''}
      ${o.effort && o.status !== 'delivered' ? `<span class="pill">⏱ ~${fmtHours(o.effort)}</span>` : ''}
      ${o.submissions.length ? `<span class="pill">${o.type === 'video' ? '🎬' : o.type === 'vocals' ? '🎙️' : '🎧'} ${o.submissions.length} Version${o.submissions.length > 1 ? 'en' : ''}</span>` : ''}
      <span class="spacer"></span>
      ${o.budget ? `<span class="pill green">${o.budget} €</span>` : ''}
    </div>
    ${o.deadline && o.status !== 'delivered' ? `<div class="progress"><i style="width:${Math.round(frac * 100)}%"></i></div>` : ''}
  </button>`;
}

function renderOrders() {
  const active = state.orders.filter(isActive).sort((a, b) => (a.deadline || Infinity) - (b.deadline || Infinity));
  const toReview = state.orders.filter(reviewOpen).sort((a, b) => a.deliveredAt - b.deliveredAt);
  const done = state.orders.filter((o) => visible(o) && o.status === 'delivered').sort((a, b) => b.deliveredAt - a.deliveredAt).slice(0, 5);
  const weekAgo = Date.now() - 7 * DAY;
  const doneWeek = state.orders.filter((o) => visible(o) && o.status === 'delivered' && o.deliveredAt > weekAgo).length;
  const name = state.settings.artistName ? `, ${esc(state.settings.artistName)}` : '';

  const nextHint = !state.nextOrderAt ? ''
    : state.nextOrderAt <= Date.now()
      ? 'Ein Kunde wartet schon – sobald du unter deinem Limit bist, kommt der Auftrag rein 👀'
      : `Nächster Auftrag voraussichtlich ${fmtDate(state.nextOrderAt, { weekday: 'long' })} 👀`;

  return `
    ${installHint()}
    <div class="header-row">
      <h1 class="large-title">Aufträge</h1>
      <button class="icon-btn glass" data-action="request-order" aria-label="Auftrag anfordern" style="margin-bottom:6px">${ICON.plus}</button>
    </div>
    <p class="subtitle">Hi${name} 👋 Diese Woche: ${doneWeek}/${state.settings.ordersPerWeek} erledigt</p>
    ${progressCard()}
    ${recapCard()}
    ${careerDue() && state.orders.some((o) => o.status === 'delivered') ? '<button class="hint glass" data-action="tab" data-tab="career" style="width:100%;text-align:left"><div style="font-size:24px">📈</div><div><b>Karriere-Update fällig</b>Trag deine Spotify-, TikTok- und Insta-Zahlen ein.</div></button>' : ''}
    ${backupDue() ? '<button class="hint glass" data-action="export" style="width:100%;text-align:left"><div style="font-size:24px">💾</div><div><b>Backup fällig</b>Sichere deine Beats, Coins & Karriere (1× im Monat) – tippen und in Google Drive speichern.</div></button>' : ''}
    ${hasVip() ? `<div class="vip-hype glass"><span class="mini-avatar big">${vipAvatar()}</span><div class="bubble them">${esc(VIP_LINES[new Date().getDate() % VIP_LINES.length])}</div></div>` : ''}

    ${toReview.length ? `<div class="section-title" style="margin-top:6px">Nochmal anhören <small>${toReview.length}</small></div>
      ${toReview.map(orderCard).join('')}
      <div class="section-title">Aufträge</div>` : ''}

    ${active.length ? active.map(orderCard).join('') : `
      <div class="empty glass">
        <div class="big">🎧</div>
        <h3>Gerade keine Aufträge</h3>
        <p>${nextHint || 'Neue Aufträge kommen automatisch rein.'}</p>
        <button class="btn small" data-action="request-order">Auftrag jetzt anfordern</button>
      </div>`}

    ${active.length && nextHint ? `<p class="footnote">${nextHint}</p>` : ''}

    ${questCard()}
    ${tipCard()}

    ${done.length ? `<div class="section-title">Zuletzt abgegeben <small><button class="btn plain small" data-action="tab" data-tab="library">Alle</button></small></div>
      ${done.map(orderCard).join('')}` : ''}
  `;
}

// Monthly nudge to save a complete backup (not needed while cloud sync is on).
function backupDue() {
  if (state.cloudUser) return false;
  const delivered = state.orders.filter((o) => visible(o) && o.status === 'delivered');
  if (delivered.length < 3) return false;
  const since = state.lastBackupAt || delivered.reduce((m, o) => Math.min(m, o.deliveredAt), Date.now());
  return Date.now() - since > 30 * DAY;
}

function progressCard() {
  const p = progress();
  return `<div class="level glass">
    <div class="level-badge">${p.level}</div>
    <div class="level-main">
      <div class="level-top"><b>Level ${p.level} · ${esc(p.title)}</b><span>${p.xp} / ${p.next} XP</span></div>
      <div class="progress" style="margin-top:6px"><i style="width:${Math.round(Math.min(1, p.frac) * 100)}%"></i></div>
      <div class="level-stats"><span>🔥 ${p.streak} ${p.streak === 1 ? 'Woche' : 'Wochen'}</span><span>⏱ ${(weekStats().minutes / 60).toFixed(1).replace('.', ',')} Std</span><span>🎯 ${p.skills.size}</span><span>🪙 ${p.coins}</span></div>
    </div>
  </div>
  ${state.activeSession ? '' : '<button class="btn secondary small session-start" data-action="start-session">⏱ Studio-Session starten</button>'}`;
}

function questCard() {
  const qs = currentQuests();
  const d = new Date(weekStart(Date.now()) + 7 * DAY);
  const daysLeft = Math.max(0, Math.ceil((d - Date.now()) / DAY));
  return `<div class="section-title">🗓️ Wochen-Quests <small>noch ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tage'}</small></div>
    <div class="group glass quests">${qs.map((q) => `<div class="row quest ${q.done ? 'done' : ''}">
      <span class="q-ico">${q.done ? '✅' : q.icon}</span>
      <span class="label">${esc(q.text)}<div class="progress" style="margin-top:6px"><i style="width:${Math.round((q.cur / q.goal) * 100)}%"></i></div></span>
      <span class="value">${q.cur}/${q.goal}<br><small>+${q.reward} 🪙</small></span></div>`).join('')}</div>`;
}

// Monday/Tuesday: how did last week go?
function recapCard() {
  const day = new Date().getDay();
  const lastKey = weekKey(Date.now() - 7 * DAY);
  if (!(day === 1 || day === 2) || state.recapSeen === lastKey) return '';
  const w = weekStats(Date.now() - 7 * DAY);
  if (!w.delivered && !w.minutes) return '';
  const claimed = (state.profile.claims || []).filter((c) => c.w === lastKey).length;
  const verdict = w.delivered >= state.settings.ordersPerWeek ? 'Ziel erreicht – stark! 💪' : w.delivered ? 'Gut dabei – diese Woche noch einen drauf? 🔥' : 'Studio-Zeit gesammelt – jetzt noch was abgeben 🎧';
  return `<div class="recap glass">
    <div class="recap-head"><b>📊 Deine letzte Woche</b><button class="x" data-action="hide-recap" aria-label="Schließen">×</button></div>
    <div class="recap-grid">
      <div><b>${w.delivered}</b><span>Abgaben</span></div>
      <div><b>${(w.minutes / 60).toFixed(1).replace('.', ',')}</b><span>Std Studio</span></div>
      <div><b>${w.ratingAvg ? w.ratingAvg.toFixed(1) : '–'}</b><span>Ø Note</span></div>
      <div><b>${claimed}/3</b><span>Quests</span></div>
    </div>
    <p>${verdict}${w.best ? ` Beste Note: ${w.best}/10.` : ''}</p>
  </div>`;
}

function tipCard() {
  return `<div class="tip glass"><span>💡</span><div><b>Tipp des Tages</b>${esc(tipOfDay())}</div></div>`;
}

function skillsOverview() {
  const learned = progress().skills;
  const rows = Object.entries(SKILLS).map(([area, list]) => {
    const n = list.filter(([name]) => learned.has(name)).length;
    return `<div class="row"><span class="label">${esc(area)}</span>
      <div class="progress" style="width:90px;margin:0"><i style="width:${Math.round((n / list.length) * 100)}%"></i></div>
      <span class="value" style="min-width:44px">${n}/${list.length}</span></div>`;
  }).join('');
  return `<div class="group-title">Skills</div><div class="group glass">${rows}</div>
    <p class="footnote">Jeder Auftrag bringt eine Lern-Challenge mit. Neue Techniken werden bevorzugt, schwierigere kommen mit höherem Level.</p>`;
}

function allTracks() {
  const tracks = [];
  for (const o of state.orders) {
    if (!visible(o)) continue;
    for (const s of o.submissions) tracks.push({ o, s });
  }
  return tracks.sort((a, b) => b.s.uploadedAt - a.s.uploadedAt);
}

function renderLibrary() {
  const { type, genre, q } = state.filter;
  const tracks = allTracks();
  const delivered = state.orders.filter((o) => visible(o) && o.status === 'delivered' && !selfMade(o));
  const onTime = delivered.filter((o) => o.deliveredAt <= o.deadline).length;
  const rated = state.orders.filter((o) => visible(o) && o.review?.rating);
  const genresUsed = [...new Set(tracks.map((t) => t.o.genre))].sort();

  const ql = q.trim().toLowerCase();
  const list = tracks.filter(({ o, s }) =>
    (type === 'all' || o.type === type) &&
    (genre === 'all' || o.genre === genre) &&
    (!ql || [o.client, o.genre, o.brief, o.title, s.name, s.note, ORDER_TYPES[o.type]?.label].join(' ').toLowerCase().includes(ql))
  );

  // group by month
  const groups = new Map();
  for (const t of list) {
    const k = fmtDate(t.s.uploadedAt, { month: 'long', year: 'numeric' });
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(t);
  }

  const typeChips = [['all', 'Alle'], ...Object.entries(ORDER_TYPES).map(([k, v]) => [k, `${v.icon} ${v.label}`])]
    .map(([k, l]) => `<button class="chip glass ${type === k ? 'on' : ''}" data-action="filter-type" data-v="${k}">${esc(l)}</button>`).join('');
  const genreChips = genresUsed.length > 1
    ? `<div class="chips">${[['all', 'Alle Genres'], ...genresUsed.map((g) => [g, g])]
        .map(([k, l]) => `<button class="chip glass ${genre === k ? 'on' : ''}" data-action="filter-genre" data-v="${esc(k)}">${esc(l)}</button>`).join('')}</div>`
    : '';

  return `
    <div class="header-row">
      <h1 class="large-title">Bibliothek</h1>
      <button class="icon-btn glass" data-action="new-own" aria-label="Eigenes Projekt" style="margin-bottom:6px">${ICON.plus}</button>
    </div>
    <p class="subtitle">Alles, was du je gemacht hast.</p>

    <div class="stats">
      <div class="stat glass"><b>${delivered.length}</b><span>Abgegeben</span></div>
      <div class="stat glass"><b>${delivered.length ? Math.round((onTime / delivered.length) * 100) : 0}%</b><span>Pünktlich</span></div>
      <div class="stat glass"><b>${rated.length ? (rated.reduce((a, o) => a + o.review.rating, 0) / rated.length).toFixed(1) : '–'}</b><span>Ø Bewertung</span></div>
      <div class="stat glass"><b>${rated.filter((o) => o.review.rating >= thrFor(o)).length}</b><span>⭐ Frei</span></div>
    </div>

    <label class="search">${ICON.search}<input type="search" placeholder="Suchen" value="${esc(q)}" data-input="search" /></label>
    <div class="chips">${typeChips}</div>
    ${genreChips}

    ${list.length ? [...groups].map(([month, items]) => `
      <div class="group-title">${esc(month)}</div>
      ${items.map(trackRow).join('')}
    `).join('') : `
      <div class="empty glass">
        <div class="big">💿</div>
        <h3>${tracks.length ? 'Nichts gefunden' : 'Noch keine Uploads'}</h3>
        <p>${tracks.length ? 'Versuch einen anderen Filter.' : 'Lade deinen ersten Beat bei einem Auftrag hoch – oder starte ein eigenes Projekt.'}</p>
      </div>`}

    ${skillsOverview()}
  `;
}

function trackRow({ o, s }) {
  const T = ORDER_TYPES[o.type];
  const playing = state.playing?.subId === s.id;
  const isAudio = isAudioFile(s);
  const final = o.deliveredSubmissionId === s.id;
  const score = final && o.review?.rating ? ` · ${o.review.rating}/10${o.review.rating >= thrFor(o) ? ` ${UNLOCK[unlockFor(o)].icon}` : ''}` : '';
  return `<div class="track glass ${playing ? 'playing' : ''}">
    <button class="art" style="background:${gradient(o.genre)}" data-action="open-order" data-id="${o.id}">${T.icon}</button>
    <button class="t-main" style="text-align:left" data-action="open-order" data-id="${o.id}">
      <div class="t-title">${esc(orderTitle(o))}${final ? ' ✅' : ''}</div>
      <div class="t-sub">${esc(o.genre)} · v${s.version}${s.duration ? ` · ${fmtDuration(s.duration)}` : ''} · ${fmtDate(s.uploadedAt, { day: 'numeric', month: 'short' })}${score}</div>
    </button>
    ${isVideoFile(s)
      ? `<button class="play-dot" data-action="play-video" data-order="${o.id}" data-sub="${s.id}" aria-label="Video ansehen">${ICON.play}</button>`
      : isAudio
      ? `<button class="play-dot" data-action="play" data-order="${o.id}" data-sub="${s.id}" aria-label="Abspielen">${playing && !audio.paused ? ICON.pause : ICON.play}</button>`
      : `<button class="play-dot" data-action="share-file" data-order="${o.id}" data-sub="${s.id}" aria-label="Teilen">${ICON.share}</button>`}
  </div>`;
}

function stepper(key, min, max) {
  return `<div class="stepper"><button data-action="step" data-key="${key}" data-d="-1" data-min="${min}" data-max="${max}">−</button><button data-action="step" data-key="${key}" data-d="1" data-min="${min}" data-max="${max}">+</button></div>`;
}
function toggle(key, on) {
  return `<label class="switch"><input type="checkbox" data-toggle="${key}" ${on ? 'checked' : ''}/><span></span></label>`;
}

// ---------------------------------------------------------------- profile --

function avatarHtml(size = 104) {
  const name = state.settings.artistName || 'Du';
  const inner = state.pfpUrl
    ? `<img src="${state.pfpUrl}" alt="" />`
    : `<span style="font-size:${Math.round(size / 2.6)}px">${esc(initials(name) || '🎧')}</span>`;
  return `<div class="pfp-wrap ${state.profile.frame || 'frame-none'}" style="width:${size}px;height:${size}px">
    <div class="pfp" style="background:${gradient(name)}">${inner}</div></div>`;
}

function strengths() {
  const a = analyze(state.orders);
  const good = [], weak = [];
  for (const [k, v] of Object.entries(a.areas)) {
    if (!v.done) continue;
    if (v.level >= 2 || (v.avg ?? 0) >= 8) good.push(`${k}${v.avg ? ` · ${v.avg.toFixed(1)}` : ''}`);
    else if (v.avg != null && v.avg < 7) weak.push(`${k} · ${v.avg.toFixed(1)}`);
  }
  for (const [k, v] of Object.entries(a.genres)) {
    if (v.avg >= 8) good.push(`${k} · ${v.avg.toFixed(1)}`);
    else if (v.avg < 7) weak.push(`${k} · ${v.avg.toFixed(1)}`);
  }
  for (const [k, v] of Object.entries(a.types)) {
    const label = ORDER_TYPES[k]?.label || k;
    if (v.avg >= 8) good.push(`${label} · ${v.avg.toFixed(1)}`);
    else if (v.avg < 7) weak.push(`${label} · ${v.avg.toFixed(1)}`);
  }
  const fresh = Object.entries(a.areas).filter(([, v]) => !v.done).map(([k]) => k);
  return { good, weak, fresh };
}

function renderProfile() {
  const p = progress();
  const st = strengths();
  const done = state.orders.filter((o) => visible(o) && o.status === 'delivered');
  const rated = done.filter((o) => o.review?.rating);
  const owned = state.profile.owned.map((id) => ITEMS[id]).filter((i) => i?.cat === 'studio');
  const cars = state.profile.owned.map((id) => ITEMS[id]).filter((i) => i?.cat === 'garage');
  const homes = state.profile.owned.map((id) => ITEMS[id]).filter((i) => i?.cat === 'homes');
  const chips = (list, cls) => list.map((x) => `<span class="pill ${cls}">${esc(x)}</span>`).join('');
  return `
    <div class="header-row" style="justify-content:flex-end;margin-top:8px">
      <button class="icon-btn glass" data-action="tab" data-tab="settings" aria-label="Einstellungen"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></svg></button>
    </div>
    <div class="profile-head" style="margin-top:4px">
      <div class="profile-banner ${state.profile.banner || 'banner-none'}"></div>
      <button class="profile-pfp" data-action="pfp" aria-label="Profilbild ändern">${avatarHtml()}</button>
    </div>
    <h1 class="profile-name">${esc(state.settings.artistName || 'Dein Name')}</h1>
    <p class="subtitle" style="text-align:center">Level ${p.level} · ${esc(p.title)} · ${p.xp} XP · ⏱ ${Math.round(p.sessionMin / 60)} Std Studio</p>
    <div class="btn-row" style="margin:0 0 6px">
      <button class="btn" data-action="open-shop">🛍️ Shop · ${p.coins} 🪙</button>
    </div>

    <div class="stats">
      <div class="stat glass"><b>${done.length}</b><span>Abgaben</span></div>
      <div class="stat glass"><b>${rated.length ? (rated.reduce((a, o) => a + o.review.rating, 0) / rated.length).toFixed(1) : '–'}</b><span>Ø Bewertung</span></div>
      <div class="stat glass"><b>${p.skills.size}</b><span>Skills</span></div>
      <div class="stat glass"><b>${p.streak}</b><span>Wochen 🔥</span></div>
    </div>

    <div class="section-title">Was du kannst</div>
    <div class="card glass" style="cursor:default">
      <div class="skill-row"><b>💪 Stärken</b><div class="chip-wrap">${st.good.length ? chips(st.good, 'green') : '<span class="muted">Noch zu wenig Bewertungen – gib ab und bewerte ehrlich.</span>'}</div></div>
      <div class="skill-row"><b>🛠️ Ausbaufähig</b><div class="chip-wrap">${st.weak.length ? chips(st.weak, 'orange') : '<span class="muted">Nichts unter 7/10 – stark!</span>'}</div></div>
      <div class="skill-row"><b>🧭 Neuland</b><div class="chip-wrap">${st.fresh.length ? chips(st.fresh, 'blue') : '<span class="muted">Alles schon ausprobiert 🤯</span>'}</div></div>
      <p class="footnote" style="margin:10px 0 0">Aufträge bauen auf deinen Stärken auf (schwierigere Techniken) und schicken dich regelmäßig ins Neuland.</p>
    </div>

    <div class="section-title">Trophäen <small>${p.trophies.filter((t) => t.won).length}/${p.trophies.length}</small></div>
    <div class="trophies">
      ${p.trophies.map((t) => `<div class="trophy glass ${t.won ? 'won' : ''}">
        <div class="t-icon">${t.icon}</div><b>${esc(t.name)}</b><span>${t.won ? esc(t.desc) : `${t.cur}/${t.goal} · ${esc(t.desc)}`}</span></div>`).join('')}
    </div>

    ${hasVip() ? `<div class="section-title">👑 Deine VIP</div>
      <div class="vip-card glass"><div class="vip-portrait">${vipAvatar()}</div>
        <div><b>Chaya Diamond</b><span>VIP-Managerin · freigeschaltet</span><div class="bubble them" style="margin-top:8px">${esc(VIP_LINES[Math.floor(Date.now() / 3.6e6) % VIP_LINES.length])}</div></div></div>` : ''}

    <div class="section-title">Garage <small>${cars.length}/${SHOP.garage.items.length}</small></div>
    ${cars.length ? `<div class="garage">${cars.map((c) => `<div class="car glass">${carSvg(c)}<b>${esc(c.name)}</b></div>`).join('')}</div>`
      : `<div class="empty glass"><div class="big">🏎️</div><h3>Noch keine Autos</h3><p>Erstes Ziel: der Golf GTI für 800 🪙. Endgegner: Bugatti Chiron.</p></div>`}

    <div class="section-title">Immobilien <small>${homes.length}/${SHOP.homes.items.length}</small></div>
    ${homes.length ? `<div class="studio glass">${homes.map((i) => `<div class="studio-item"><span>${i.emoji}</span><small>${esc(i.name)}</small></div>`).join('')}</div>`
      : '<p class="footnote" style="margin-top:0">Noch keine Immobilie. Erste Station: WG-Zimmer für 500 🪙.</p>'}

    ${expertSection()}

    <div class="section-title">Kundenkartei <small>${p.served.size}/${CUSTOMERS.length}</small></div>
    <div class="kartei glass">${CUSTOMERS.map((c) => p.served.has(c.id)
      ? `<button class="k-item" title="${esc(c.name)}" data-action="open-customer" data-id="${esc(c.id)}">${avatarSvg(c)}</button>`
      : '<div class="k-item unknown">?</div>').join('')}</div>
    <p class="footnote">Jeder Kunde, den du einmal bedient hast, landet hier. Schaffst du alle ${CUSTOMERS.length}?</p>

    <div class="section-title">Mein Studio <small>${owned.length}/${SHOP.studio.items.length}</small></div>
    ${owned.length ? `<div class="studio glass">${owned.map((i) => `<div class="studio-item" title="${esc(i.name)}"><span>${i.emoji}</span><small>${esc(i.name)}</small></div>`).join('')}</div>`
      : `<div class="empty glass"><div class="big">🏠</div><h3>Dein Studio ist noch leer</h3><p>Verdien Coins mit Aufträgen und richte es im Shop ein.</p>
        <button class="btn small" data-action="open-shop">Zum Shop</button></div>`}
  `;
}

function expertSection() {
  const a = assetInfo();
  const on = expertsUnlocked();
  const b = bossInfo();
  const row = (ok, text) => `<div class="req ${ok ? 'ok' : ''}">${ok ? '✅' : '🔒'} ${text}</div>`;
  const activeExpert = state.orders.some((o) => o.tier === 'expert' && isActive(o));
  return `
    <div class="section-title">🎖️ Experten <small>${on ? 'freigeschaltet' : 'gesperrt'}</small></div>
    <div class="card glass tier-expert" style="cursor:default">
      <div class="expert-row">${EXPERTS.map((e) => `<div class="expert ${on ? '' : 'locked'}"><span class="mini-avatar big ring-expert">${avatarSvg(e)}</span>
        <b>${on ? esc(e.name) : '???'}</b><small>${on ? esc(e.spec.genre) : 'gesperrt'}</small></div>`).join('')}</div>
      ${on ? `<p class="footnote" style="margin:10px 0 0">Experten wollen immer genau ihren Sound und akzeptieren erst ab ${EXPERT_MIN}/10 (deine Bewertung). Dafür gibt's längere Deadlines und fette Gagen (+150 🪙).</p>
        ${activeExpert ? '' : '<button class="btn small" style="margin-top:10px" data-action="request-expert">Experten-Auftrag anfordern</button>'}`
      : `<div class="reqs">${row(a.cars.length > 0, 'Ein Auto besitzen')}${row(a.homes.length > 0, 'Eine Immobilie besitzen')}${row(a.value >= EXPERT_UNLOCK_VALUE, `Besitz im Wert von ${EXPERT_UNLOCK_VALUE.toLocaleString('de-DE')} 🪙 (aktuell ${a.value.toLocaleString('de-DE')})`)}</div>`}
    </div>

    <div class="section-title">💀 Ultra-Boss <small>${b.ok ? 'freigeschaltet' : 'gesperrt'}</small></div>
    <div class="card glass tier-boss" style="cursor:default">
      <div class="boss-row"><span class="mini-avatar boss-avatar ring-boss ${b.ok ? '' : 'locked'}">${avatarSvg(BOSS)}</span>
        <div><b>${b.ok ? esc(BOSS.name) : '??? ??? ???'}</b><span class="muted">Will einen release-fertigen Song. 6 Wochen Zeit, akzeptiert ab 9/10. Belohnung: 1.500 🪙.</span></div></div>
      ${b.ok ? '' : `<div class="reqs">${row(b.days >= BOSS_UNLOCK.days, `${BOSS_UNLOCK.days} Tage dabei (${b.days})`)}${row(b.delivered >= BOSS_UNLOCK.delivered, `${BOSS_UNLOCK.delivered} Abgaben (${b.delivered})`)}${row(b.experts >= BOSS_UNLOCK.expertsAccepted, 'Einen Experten überzeugt')}</div>`}
    </div>`;
}

// Steckbrief of a customer: who they are + your history together.
function lyricsStats(t = '') {
  const lines = t.split('\n').map((l) => l.trim()).filter((l) => l && !/^\[.*\]$/.test(l));
  const words = lines.join(' ').split(/\s+/).filter(Boolean).length;
  return `${lines.length} Zeilen · ~${Math.ceil(lines.length / 2)} Bars · ${words} Wörter`;
}

function renderCustomerSheet(c) {
  if (!c) return '<p>Kunde nicht gefunden.</p>';
  const a = ARCHETYPES[c.arch];
  const theirs = state.orders.filter((o) => o.customerId === c.id && !o.deleted);
  const done = theirs.filter((o) => o.status === 'delivered');
  const rated = done.filter((o) => o.review?.rating);
  const avg = rated.length ? (rated.reduce((m, o) => m + o.review.rating, 0) / rated.length).toFixed(1) : '–';
  const fan = isFan(c.id, state.orders);
  const P = PEOPLE[c.arch];
  const facts = (c.facts || (c.fact ? [c.fact] : [])).map((f) => (P ? P.factTpl.replace('{first}', firstName(c)).replace('{fact}', f) : f));
  return `
    <div class="sheet-head">
      <button class="btn plain" data-action="close-sheet">Schließen</button>
      <h2>Kunden-Profil</h2><span style="width:80px"></span>
    </div>
    <div class="cust-head">
      <div class="cust-avatar ${c.arch === 'expert' ? 'ring-expert' : c.arch === 'boss' ? 'ring-boss' : ''}">${avatarSvg(c)}</div>
      <h2>${esc(c.name)}</h2>
      <p class="muted">${esc(a?.label || '')}${fan ? ' · ⭐ Stammkunde' : ''}</p>
      ${c.sig ? `<div class="bubble them" style="margin:10px auto 0;display:inline-block">„${esc(c.sig)}“</div>` : ''}
    </div>
    <div class="stats" style="margin-top:16px">
      <div class="stat glass"><b>${theirs.length}</b><span>Aufträge</span></div>
      <div class="stat glass"><b>${done.length}</b><span>Abgegeben</span></div>
      <div class="stat glass"><b>${avg}</b><span>Ø Note</span></div>
      <div class="stat glass"><b>${done.filter((o) => o.deadline && o.deliveredAt <= o.deadline).length}</b><span>Pünktlich</span></div>
    </div>
    ${facts.length ? `<div class="group-title">Was man über ${esc(firstName(c))} wissen muss</div>
      <div class="group glass">${facts.map((f) => `<div class="row"><span class="label">${esc(f)}</span></div>`).join('')}</div>` : ''}
    ${c.likes?.length ? `<div class="group-title">Hört gern</div><div class="chip-wrap" style="margin:0 4px">${c.likes.map((g) => `<span class="pill blue">${esc(g)}</span>`).join('')}</div>` : ''}
    ${c.spec ? `<div class="group-title">Will immer</div><div class="group glass"><div class="row"><span class="label">${esc(c.spec.label)} · ${c.spec.bpm[0]}–${c.spec.bpm[1]} BPM<br><small class="muted">${esc(c.spec.inst.join(', '))}</small></span></div></div>` : ''}
    ${theirs.length ? `<div class="group-title">Eure Geschichte</div>${theirs.sort((x, y) => y.createdAt - x.createdAt).map(orderCard).join('')}` : '<p class="footnote">Ihr hattet noch keinen Auftrag zusammen.</p>'}
  `;
}

// ---- genre lexicon ------------------------------------------------------------
function genreGuide(name) {
  const g = GENRES[name];
  if (!g) return '';
  const row = (k, v) => (v ? `<div class="g-row"><span>${k}</span><b>${esc(v)}</b></div>` : '');
  return `<div class="g-body">
    ${row('Tempo', `${g.bpm[0]}–${g.bpm[1]} BPM`)}
    ${row('Tonarten', (g.keys || []).join(', '))}
    ${row('🥁 Snare/Clap', g.snare)}
    ${row('Hi-Hats', g.hats)}
    ${row('808/Bass', g.bass)}
    ${row('Aufbau & Übergänge', g.arr)}
    ${g.tip ? `<div class="g-tip">💡 ${esc(g.tip)}</div>` : ''}
    <div class="g-inst">${(g.inst || []).map((i) => `<span class="pill">${esc(i)}</span>`).join('')}</div>
    ${g.refs?.length ? `<div class="g-refs">🎧 ${esc(g.refs.join(' · '))}</div>` : ''}
  </div>`;
}

const shortText = (t, n) => (t.length <= n ? t.trim() : `${t.slice(0, t.lastIndexOf(' ', n)).trim()} …`);

function renderLexikon() {
  const fam = state.lexFam;
  const names = Object.keys(GENRES).filter((n) => fam === 'Alle' || GENRES[n].fam === fam);
  const done = {};
  for (const o of state.orders) if (!o.deleted && o.status === 'delivered') done[o.genre] = (done[o.genre] || 0) + 1;
  return `
    <h1 class="large-title">Lexikon</h1>
    <p class="subtitle">${Object.keys(GENRES).length} Genres – BPM, Snare, typische Sounds. Tipp drauf für den Spickzettel.</p>
    <div class="chips">${['Alle', ...FAMILIES].map((f) => `<button class="chip glass ${fam === f ? 'on' : ''}" data-action="lex-fam" data-v="${f}">${f}</button>`).join('')}</div>
    <div class="group glass">${names.map((n) => `<button class="row tap" data-action="open-genre" data-v="${esc(n)}">
      <span class="label"><b style="font-weight:600">${esc(n)}</b><br><small class="muted">${GENRES[n].bpm[0]}–${GENRES[n].bpm[1]} BPM · ${esc(shortText((GENRES[n].snare || '').split('(')[0], 44))}</small></span>
      <span class="value">${done[n] ? `✓ ${done[n]}` : ''}</span>${ICON.chev}</button>`).join('')}</div>
    <p class="footnote">✓ = so oft hast du das Genre schon abgegeben. Die Infos sind ein Startpunkt – dein Ohr und YouTube-Tutorials machen den Rest.</p>`;
}

function renderGenreSheet(name) {
  return `<div class="sheet-head"><button class="btn plain" data-action="close-sheet">Schließen</button><h2>${esc(name)}</h2><span style="width:80px"></span></div>
    <div class="guide glass" style="margin-top:12px">${genreGuide(name)}</div>
    <button class="btn" style="margin-top:14px" data-action="request-genre" data-v="${esc(name)}">Auftrag in diesem Genre anfordern</button>`;
}

// ---- career -------------------------------------------------------------------
const careerLatest = (id) => { const h = state.career.stats[id] || []; return h.length ? h[h.length - 1] : null; };
function careerDue() {
  return Object.keys(PLATFORMS).some((id) => { const l = careerLatest(id); return !l || Date.now() - l.t > 30 * DAY; });
}
// The app adapts to where you are: build → release → grow → artist.
function careerStage() {
  const sp = careerLatest('spotify')?.v || 0;
  const rel = careerLatest('releases')?.v || 0;
  const social = Math.max(careerLatest('tiktok')?.v || 0, careerLatest('instagram')?.v || 0, careerLatest('youtube')?.v || 0);
  if (sp >= 100000) return { id: 'artist', text: '👑 Artist-Phase: Release-Qualität zählt – Experten & Boss öfter, Songs statt Skizzen.', boost: { full_song: 2, hook: 1.5 }, event: 0.08, expert: 0.45 };
  if (sp >= 1000 || social >= 1000) return { id: 'grow', text: '📈 Wachstums-Phase: Content zählt – mehr Songs, Videos und Special Events.', boost: { full_song: 2, hook: 1.5 }, event: social >= 10000 ? 0.08 : 0.06, expert: 0.3 };
  if (rel >= 1) return { id: 'release', text: '🎤 Release-Phase: Katalog aufbauen – mehr Songs und Hooks, jeder Beat ab 8/10 wird ein Song.', boost: { full_song: 2, hook: 1.5 }, event: 0.04, expert: 0.3 };
  return { id: 'build', text: '🛠️ Aufbau-Phase: Skills & Beats sammeln, bis du bereit für den ersten Release bist. Zahlen auf 0 sind völlig okay.', boost: { instrumental: 1.3 }, event: 0.03, expert: 0.3 };
}
// Special events unlock after ~6 weeks of use, or once you have some reach.
function eventsUnlocked() {
  const live = state.orders.filter((o) => !o.deleted);
  const first = live.reduce((m, o) => Math.min(m, o.createdAt), Date.now());
  const social = Math.max(careerLatest('tiktok')?.v || 0, careerLatest('instagram')?.v || 0);
  return Date.now() - first > 42 * DAY || social >= 1000;
}

function sparkline(hist, color) {
  if (!hist || hist.length < 2) return '';
  const vals = hist.map((x) => x.v), max = Math.max(...vals), min = Math.min(...vals);
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 26}`).join(' ');
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" style="stroke:${color};fill:none;stroke-width:2"><polyline points="${pts}" /></svg>`;
}
function renderCareer() {
  const sp = careerLatest('spotify')?.v || 0;
  const title = careerTitle(sp);
  const claimed = new Set(state.career.claimed.map((c) => c.id));
  const exclusive = Object.values(PLATFORMS).flatMap((P) => P.steps.filter((s) => s[3]?.item).map((s) => ({ item: ITEMS[s[3].item], need: `${fmtNum(s[0])} ${P.unit}` })));
  return `
    <h1 class="large-title">Karriere</h1>
    <p class="subtitle">Langfristige Ziele – von den ersten Hörern bis zum Established Artist.</p>
    <div class="career-hero glass">
      <div class="ch-title">🎤 ${esc(title)}</div>
      <div class="muted">${sp ? `${fmtNum(sp)} monatliche Hörer auf Spotify` : 'Trag deine ersten Zahlen ein – auch 0 ist ein Start.'}</div>
    </div>
    <div class="tip glass" style="margin-top:0"><span>🧭</span><div><b>Fokus gerade</b>${esc(careerStage().text)}</div></div>
    ${careerDue() ? '<div class="hint glass"><div style="font-size:24px">📈</div><div><b>Monats-Update</b>Trag deine aktuellen Zahlen ein – jeder Meilenstein bringt Coins.</div></div>' : ''}
    ${Object.entries(PLATFORMS).map(([id, P]) => {
      const hist = state.career.stats[id] || [];
      const cur = careerLatest(id)?.v ?? 0;
      const monthAgo = [...hist].reverse().find((x) => x.t <= Date.now() - 28 * DAY);
      const delta = monthAgo ? cur - monthAgo.v : null;
      const next = P.steps.find((s) => s[0] > cur);
      const prev = [...P.steps].reverse().find((s) => s[0] <= cur);
      const frac = next ? (cur - (prev?.[0] || 0)) / (next[0] - (prev?.[0] || 0)) : 1;
      return `<div class="platform glass">
        <div class="pf-top"><span class="pf-icon" style="background:${P.color}">${P.icon}</span>
          <div class="pf-main"><b>${P.label}</b><span class="muted">${P.unit}</span></div>
          <div class="pf-num"><b>${fmtNum(cur)}</b>${delta != null ? `<small class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : '−'}${fmtNum(Math.abs(delta))} / Monat</small>` : ''}</div></div>
        ${sparkline(hist, P.color)}
        ${next ? `<div class="pf-next"><span>Nächstes Ziel: <b>${fmtNum(next[0])}</b> – ${esc(next[1])}</span><span>+${next[2].toLocaleString('de-DE')} 🪙${next[3]?.item ? ' + 🎁' : ''}</span></div>
          <div class="progress"><i style="width:${Math.round(Math.max(0.02, frac) * 100)}%;background:${P.color}"></i></div>` : '<div class="pf-next"><b>Alle Ziele erreicht. Legende. 👑</b></div>'}
        <div class="btn-row"><button class="btn small" data-action="career-update" data-id="${id}">Zahl eintragen</button></div>
        <details class="ladder"><summary>Alle ${P.steps.length} Meilensteine</summary>
          ${P.steps.map((s) => `<div class="step ${claimed.has(`${id}:${s[0]}`) ? 'done' : ''}"><span>${claimed.has(`${id}:${s[0]}`) ? '✅' : '🔒'}</span>
            <b>${fmtNum(s[0])}</b><span class="st-name">${esc(s[1])}</span><span class="st-rew">+${s[2].toLocaleString('de-DE')} 🪙${s[3]?.item ? ` · 🎁 ${esc(ITEMS[s[3].item].name)}` : ''}</span></div>`).join('')}
        </details>
      </div>`;
    }).join('')}
    <div class="section-title">🎁 Exklusive Belohnungen</div>
    <div class="studio glass">${exclusive.map(({ item, need }) => {
      const own = state.profile.owned.includes(item.id);
      const icon = item.emoji || (item.cat === 'frames' ? '🔵' : '🎪');
      return `<div class="studio-item ${own ? '' : 'locked-item'}"><span>${own ? icon : '🔒'}</span><small>${esc(item.name)}${own ? '' : `<br>ab ${esc(need)}`}</small>
        ${own && (item.cat === 'frames' || item.cat === 'banners') ? `<button class="btn plain small" data-action="equip" data-id="${item.id}">${state.profile.frame === item.id || state.profile.banner === item.id ? 'Ablegen' : 'Anlegen'}</button>` : ''}</div>`;
    }).join('')}</div>
    <p class="footnote">Ehrlich eintragen – die Coins sind nur was wert, wenn die Zahlen echt sind. 💪</p>`;
}

async function careerUpdate(id) {
  const P = PLATFORMS[id];
  const cur = careerLatest(id)?.v ?? 0;
  const raw = prompt(`${P.label}: ${P.unit} aktuell?`, String(cur || ''));
  if (raw == null) return;
  const v = Math.max(0, Math.round(Number(String(raw).replace(/[^\d]/g, '')) || 0));
  const before = progress();
  state.career.stats[id] = [...(state.career.stats[id] || []), { t: Date.now(), v }];
  const claimed = new Set(state.career.claimed.map((c) => c.id));
  const fresh = P.steps.filter((s) => v >= s[0] && !claimed.has(`${id}:${s[0]}`));
  for (const s of fresh) {
    state.career.claimed.push({ id: `${id}:${s[0]}`, reward: s[2] });
    if (s[3]?.item && !state.profile.owned.includes(s[3].item)) state.profile.owned = [...state.profile.owned, s[3].item];
  }
  await db.set('career', state.career);
  await db.set('profile', state.profile);
  if (fresh.length) {
    rewardToast(before, `🚀 ${fresh.length} ${fresh.length === 1 ? 'Meilenstein' : 'Meilensteine'} erreicht: ${fresh[fresh.length - 1][1]}`);
    fresh.filter((s) => s[3]?.item).forEach((s, i) => setTimeout(() => toast(`🎁 Exklusiv freigeschaltet: ${ITEMS[s[3].item].name}`), 3000 * (i + 1)));
  } else toast(`${P.label} aktualisiert ✅`);
  render();
}

function renderShopSheet() {
  const p = progress();
  const tab = state.shopTab;
  const items = SHOP[tab].items;
  const tile = (i) => {
    const owned = state.profile.owned.includes(i.id);
    const equipped = state.profile.frame === i.id || state.profile.banner === i.id;
    const lockedBy = i.needs?.delivered && p.delivered < i.needs.delivered ? `${p.delivered}/${i.needs.delivered} Abgaben` : '';
    const preview = tab === 'garage' ? `<div class="shop-car">${carSvg(i)}</div>`
      : tab === 'legendary' ? `<div class="vip-portrait" style="width:140px;height:140px">${vipAvatar()}</div><span class="muted">Deine persönliche Hype-Managerin. Nur für echte Dranbleiber – ca. 3 Jahre konstant.</span>`
      : tab === 'homes' ? `<div class="shop-emoji">${i.emoji}</div>`
      : tab === 'frames'
      ? `<div class="pfp-wrap ${i.id}" style="width:72px;height:72px"><div class="pfp" style="background:${gradient(state.settings.artistName || 'Du')}">${state.pfpUrl ? `<img src="${state.pfpUrl}" alt="" />` : '🎧'}</div></div>`
      : tab === 'banners' ? `<div class="profile-banner ${i.id}" style="height:64px;border-radius:14px;width:100%"></div>`
      : `<div class="shop-emoji">${i.emoji}</div>`;
    const cant = p.coins < i.price || lockedBy;
    const btn = !owned
      ? `<button class="btn small ${cant ? 'secondary' : ''}" data-action="buy" data-id="${i.id}" ${cant ? 'disabled' : ''}>${i.price.toLocaleString('de-DE')} 🪙${lockedBy ? ` · 🔒 ${lockedBy}` : ''}</button>`
      : tab === 'studio' ? '<span class="pill green">Im Studio ✓</span>'
      : tab === 'garage' ? '<span class="pill green">In der Garage ✓</span>'
      : tab === 'homes' ? '<span class="pill green">Gehört dir ✓</span>'
      : tab === 'legendary' ? '<span class="pill green">👑 Freigeschaltet</span>'
      : `<button class="btn small ${equipped ? 'secondary' : ''}" data-action="equip" data-id="${i.id}">${equipped ? 'Ablegen' : 'Anlegen'}</button>`;
    return `<div class="shop-item glass">${preview}<b>${esc(i.name)}</b>${btn}</div>`;
  };
  return `
    <div class="sheet-head">
      <button class="btn plain" data-action="close-sheet">Fertig</button>
      <h2>Shop</h2>
      <span style="width:80px;text-align:right"><span class="pill orange">${p.coins} 🪙</span></span>
    </div>
    <div class="chips" style="margin-top:10px">${Object.entries(SHOP).map(([k, c]) => `<button class="chip glass ${k === tab ? 'on' : ''}" data-action="shop-tab" data-v="${k}">${c.label}</button>`).join('')}</div>
    <div class="shop-grid ${tab}">${items.map(tile).join('')}</div>
    <p class="footnote">Coins gibt's für jede Abgabe (+20), Pünktlichkeit (+10), geschaffte Challenges (+15), gute Bewertungen (+10/+25) und Trophäen (+${TROPHY_BONUS}).</p>
  `;
}

async function saveProfile() {
  await db.set('profile', state.profile);
}

// 24h picker in 15-min steps (native <input type=time> follows the phone's 12/24h setting).
const TIMES = Array.from({ length: 97 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`);
function timeSelect(value, key, label) {
  return `<select class="time" data-week="${key}" aria-label="${label}">
    <option value="" ${value ? '' : 'selected'}>frei</option>
    ${TIMES.map((t) => `<option ${t === value ? 'selected' : ''}>${t}</option>`).join('')}
  </select>`;
}

function renderSettings() {
  const s = state.settings;
  const genreRows = Object.keys(GENRES).sort((a, b) => (s.genreWeights[b] ?? 0) - (s.genreWeights[a] ?? 0) || a.localeCompare(b)).map((g) => `
    <div class="row"><span class="label">${esc(g)}<br><small style="color:var(--label-2)">${GENRE_LABELS[s.genreWeights[g] ?? 0]}</small></span>${stepper(`genre:${g}`, 0, 4)}</div>`).join('');
  const typeRows = Object.entries(ORDER_TYPES).filter(([, T]) => !T.manualOnly).map(([k, T]) => `
    <div class="row has-icon"><span class="ico" style="background:${gradient(k)}">${T.icon}</span>
      <span class="label">${esc(T.label)}<br><small style="color:var(--label-2)">${['Aus', 'Selten', 'Manchmal', 'Oft', 'Sehr oft'][s.types[k] ?? 0]}</small></span>
      ${stepper(`type:${k}`, 0, 4)}</div>`).join('');

  return `
    <button class="btn plain small" data-action="tab" data-tab="profile" style="padding:0;margin-top:18px">‹ Profil</button>
    <h1 class="large-title" style="margin-top:4px">Einstellungen</h1>
    <p class="subtitle">Passe die Aufträge an deinen Alltag an.</p>

    <div class="group-title">Profil</div>
    <div class="group glass">
      <label class="row"><span class="label">Artist-Name</span><input type="text" placeholder="Dein Name" value="${esc(s.artistName)}" data-setting="artistName" /></label>
    </div>

    <div class="group-title">Rhythmus</div>
    <div class="group glass">
      <div class="row"><span class="label">Aufträge pro Woche</span><span class="value">${s.ordersPerWeek}</span>${stepper('ordersPerWeek', 1, 14)}</div>
      <div class="row"><span class="label">Max. gleichzeitig</span><span class="value">${s.maxActive}</span>${stepper('maxActive', 1, 6)}</div>
      <div class="row"><span class="label">🎙️ Vocals ab</span><span class="value">${s.vocalThreshold}/10</span>${stepper('vocalThreshold', 5, 10)}</div>
      <div class="row"><span class="label">🎬 Video ab</span><span class="value">${s.videoThreshold}/10</span>${stepper('videoThreshold', 5, 10)}</div>
    </div>
    <p class="footnote">Am Tag nach der Abgabe hörst du deinen Track nochmal an und bewertest ihn. 🎹 Beat ab ${s.vocalThreshold}/10 → 🎙️ Vocals drauf → 🎤 Song ab ${s.videoThreshold}/10 → 🎬 Video/TikTok.</p>

    <div class="group-title">Wochenplan – wann hast du Zeit?</div>
    <div class="group glass">
      ${[1, 2, 3, 4, 5, 6, 0].map((d) => {
        const w = s.week[d] || {};
        return `<div class="row"><span class="label">${['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][d]}</span>
          ${timeSelect(w.from, `${d}:from`, 'von')}
          <span style="color:var(--label-2)">–</span>
          ${timeSelect(w.to, `${d}:to`, 'bis')}</div>`;
      }).join('')}
    </div>
    ${(() => {
      const free = freeMinutesPerWeek(s.week) / 60;
      const types = Object.entries(s.types).filter(([, w]) => w > 0);
      const avgEffort = types.reduce((a, [k, w]) => a + ORDER_TYPES[k].effort * w, 0) / Math.max(1, types.reduce((a, [, w]) => a + w, 0));
      const planned = s.ordersPerWeek * avgEffort;
      const pct = free ? Math.round((planned / free) * 100) : 0;
      return `<p class="footnote">Freizeit: <b>${Math.round(free)} Std/Woche</b> · eingeplant ~${Math.round(planned)} Std (${pct} %).
        ${pct > 45 ? '⚠️ Das ist viel – lieber weniger Aufträge pro Woche, dafür gescheit.' : pct < 15 ? 'Da ist noch Luft nach oben.' : '👍 Machbar, ohne dass es stresst.'}
        Aufträge kommen, wenn deine freie Zeit anfängt, und die Deadline richtet sich nach deinen freien Stunden. Feld leer lassen = an dem Tag keine Zeit.</p>`;
    })()}

    <div class="group-title">Auftragsarten</div>
    <div class="group glass">${typeRows}</div>

    <div class="group-title">Genres</div>
    <div class="group glass">${genreRows}</div>

    <div class="group-title">Mitteilungen</div>
    <div class="group glass">
      <div class="row"><span class="label">Neue Aufträge melden</span>${toggle('notifications', s.notifications)}</div>
      <button class="row tap" data-action="test-notification"><span class="label" style="color:var(--accent)">Test-Mitteilung senden</span></button>
    </div>
    <p class="footnote">${isNative
      ? 'Neue Aufträge melden sich auch, wenn die App geschlossen ist – plus eine Erinnerung am Abend des Abgabetags.'
      : 'Auf dem Handy funktionieren Mitteilungen, wenn die App installiert ist (Android: Chrome → App installieren, iPhone: Zum Home-Bildschirm, iOS 16.4+).'}</p>

    ${renderCloudSettings()}

    <div class="group-title">Daten</div>
    <div class="group glass">
      <button class="row tap" data-action="export"><span class="label">💾 Komplett-Backup speichern (inkl. MP3s)</span>${ICON.chev}</button>
      <button class="row tap" data-action="import"><span class="label">Backup importieren</span>${ICON.chev}</button>
      <button class="row tap" data-action="reset"><span class="label" style="color:var(--red)">Alles lokal löschen</span></button>
    </div>
    <p class="footnote" style="text-align:center;margin-top:24px">Beat Orders · Version ${esc(state.appVersion || '1.0 (Web)')}</p>
  `;
}

function renderCloudSettings() {
  const c = state.cloudConfigured;
  const u = state.cloudUser;
  let body;
  if (!c) {
    body = `<div class="group glass">
      <label class="row col"><span class="label">Supabase-URL</span><input type="url" id="cUrl" placeholder="https://xyz.supabase.co" autocapitalize="off" /></label>
      <label class="row col"><span class="label">Anon Key</span><input type="text" id="cKey" placeholder="eyJhbGciOi…" autocapitalize="off" autocomplete="off" /></label>
      <button class="row tap" data-action="cloud-save"><span class="label" style="color:var(--accent);font-weight:600">Verbinden</span></button>
    </div>
    <p class="footnote">Deine Aufträge und Beats werden zusätzlich online gespeichert und sind auf allen Geräten da. Anleitung: README → „Cloud-Speicher“.</p>`;
  } else if (!u) {
    body = `<div class="group glass">
      <label class="row"><span class="label">E-Mail</span><input type="email" id="cEmail" placeholder="du@mail.de" autocapitalize="off" /></label>
      <label class="row"><span class="label">Passwort</span><input type="password" id="cPass" placeholder="••••••••" /></label>
      <button class="row tap" data-action="cloud-login"><span class="label" style="color:var(--accent);font-weight:600">Anmelden / Registrieren</span></button>
      <button class="row tap" data-action="cloud-reset"><span class="label" style="color:var(--red)">Verbindung entfernen</span></button>
    </div>`;
  } else {
    body = `<div class="group glass">
      <div class="row"><span class="label">Angemeldet</span><span class="value">${esc(u.email)}</span></div>
      <div class="row"><span class="label">Letzter Sync</span><span class="value">${state.lastSync ? `${fmtDate(state.lastSync, { day: 'numeric', month: 'short' })}, ${fmtTime(state.lastSync)}` : '–'}</span></div>
      <button class="row tap" data-action="cloud-sync"><span class="label" style="color:var(--accent);font-weight:600">Jetzt synchronisieren</span></button>
      <button class="row tap" data-action="cloud-logout"><span class="label" style="color:var(--red)">Abmelden</span></button>
    </div>`;
  }
  return `<div class="group-title">Cloud-Speicher ☁️</div>${body}`;
}

// ---------------------------------------------------------------- sheets --

function openSheet(sheet) {
  // Switching to another order? Stop a video that belongs to the old one.
  const target = sheet.kind === 'order' && state.orders.find((o) => o.id === sheet.id);
  if (state.video && !target?.submissions.some((x) => x.id === state.video.subId)) closeVideo();
  state.sheet = sheet;
  $('#sheetLayer').hidden = false;
  $('#sheet').classList.remove('closing');
  $('.sheet-dim').classList.remove('closing');
  renderSheet();
  $('#sheet').scrollTop = 0;
}

function closeVideo() {
  if (!state.video) return;
  URL.revokeObjectURL(state.video.url);
  state.video = null;
}

function closeSheet() {
  if (!state.sheet) return;
  state.sheet = null;
  closeVideo();
  $('#sheet').classList.add('closing');
  $('.sheet-dim').classList.add('closing');
  setTimeout(() => { if (!state.sheet) $('#sheetLayer').hidden = true; }, 240);
  render();
}

// Write a lyrics/notes/lesson textarea into its order (saved right away or debounced).
function flushText(el) {
  const k = ['lyrics', 'note', 'lesson'].find((x) => el.dataset?.[x]);
  const o = k && state.orders.find((x) => x.id === el.dataset[k]);
  if (!o) return null;
  if (k === 'lyrics') { if (o.lyrics === el.value) return null; o.lyrics = el.value; }
  else if (k === 'note') { if (o.notes === el.value) return null; o.notes = el.value; }
  else { if (!o.review || o.review.lesson === el.value) return null; o.review.lesson = el.value; }
  return o;
}
const textTimers = {};
function autosaveText(el, delay = 1200) {
  const key = Object.entries(el.dataset).map((x) => x.join('=')).join();
  clearTimeout(textTimers[key]);
  textTimers[key] = setTimeout(() => { const o = flushText(el); if (o) saveOrder(o); }, delay);
}

function renderSheet() {
  const s = state.sheet;
  if (!s) return;
  // Keep what you're typing (lyrics, notes …) when the sheet re-renders.
  const act = document.activeElement;
  const typingKey = act && $('#sheet').contains(act) && ['lyrics', 'note', 'lesson'].find((k) => act.dataset?.[k]);
  const caret = typingKey ? [act.selectionStart, act.selectionEnd, act.scrollTop] : null;
  if (typingKey) { const o = flushText(act); if (o) saveOrder(o); }
  let html = '';
  if (s.kind === 'order') html = renderOrderSheet(state.orders.find((o) => o.id === s.id));
  else if (s.kind === 'own') html = renderOwnSheet();
  else if (s.kind === 'shop') html = renderShopSheet();
  else if (s.kind === 'customer') html = renderCustomerSheet(CUSTOMER_BY_ID[s.id]);
  else if (s.kind === 'genre') html = renderGenreSheet(s.id);
  const oldVideo = $('#sheet video');
  if (oldVideo) oldVideo.remove(); // detach so it keeps playing
  $('#sheet').innerHTML = `<div class="grabber"></div>${html}`;
  if (typingKey) {
    const el = $(`#sheet textarea[data-${typingKey}="${act.dataset[typingKey]}"]`);
    if (el) { el.focus({ preventScroll: true }); el.setSelectionRange(caret[0], caret[1]); el.scrollTop = caret[2]; }
  }
  const slot = $('#videoSlot');
  if (slot && state.video) {
    const v = oldVideo && oldVideo.src === state.video.url ? oldVideo : Object.assign(document.createElement('video'), {
      src: state.video.url, controls: true, playsInline: true, autoplay: true, className: 'video-preview',
    });
    slot.replaceWith(v);
  }
}

function renderOrderSheet(o) {
  if (!o) return '<p>Auftrag nicht gefunden.</p>';
  const T = ORDER_TYPES[o.type];
  const due = dueInfo(o);
  const delivered = o.status === 'delivered';
  const subs = [...o.submissions].sort((a, b) => b.version - a.version);

  const c = o.concept;
  const specs = o.type === 'video' || o.type === 'vocals' ? [
    ['Format', c?.format],
    c?.ratio && ['Seitenverhältnis', c.ratio],
    ['Länge', c?.length],
    o.bpm && ['Tempo', `${o.bpm} BPM`],
    o.key && ['Tonart', o.key],
    o.deadline && ['Deadline', `${fmtDate(o.deadline)}`],
  ].filter(Boolean) : [
    ['Art', `${T.icon} ${T.label}`],
    ['Genre', o.genre],
    o.bpm && ['Tempo', `${o.bpm} BPM`],
    o.key && ['Tonart', o.key],
    o.mood && ['Vibe', o.mood],
    o.deadline && ['Deadline', `${fmtDate(o.deadline)}`],
    o.budget && ['Budget', `${o.budget} € ${o.budgetNote || ''}`.trim()],
    o.effort && ['Aufwand', `~${fmtHours(o.effort)}`],
  ].filter(Boolean);
  // Odd number of tiles → stretch the last one; instruments always get a full row.
  if (specs.length % 2) specs[specs.length - 1].wide = true;
  if (o.instruments?.length) specs.push(Object.assign([o.tier ? 'Instrumente' : '🎛️ Pflicht-Sounds (Challenge)', o.instruments.join(', ')], { wide: true }));
  if (o.idea) specs.push(Object.assign(['🧪 Sample-/Sound-Challenge', o.idea], { wide: true }));
  if (o.refs?.length) specs.push(Object.assign(['🎧 Referenz (reinhören!)', o.refs.join(', ')], { wide: true }));

  return `
    ${o.tier ? `<div class="tier-banner tier-${o.tier}">${TIER[o.tier].badge}${o.minRating ? ` · akzeptiert nur ab ${o.minRating}/10 · längere Deadline` : ' · selten & einzigartig · +150 🪙'}</div>` : ''}
    <div class="sheet-head">
      <button class="btn plain" data-action="close-sheet">Schließen</button>
      <h2 class="sheet-title">${customerOf(o) ? `<button class="mini-avatar ${o.tier ? `ring-${o.tier}` : ''}" data-action="open-customer" data-id="${esc(o.customerId)}" aria-label="Kunden-Profil">${avatarSvg(customerOf(o))}</button>` : ''}${esc(o.type === 'own' ? 'Projekt' : o.type === 'video' ? 'Video' : o.type === 'vocals' ? 'Vocals' : o.client.split(' – ')[0])}</h2>
      <span style="width:80px;text-align:right"><span class="pill ${due.cls}">${delivered ? '✓' : due.text.replace('Noch ', '')}</span></span>
    </div>

    ${o.type !== 'own' ? `
    <div class="thread">
      <div class="thread-meta">${fmtDate(o.createdAt)}, ${fmtTime(o.createdAt)}</div>
      <div class="bubble them">${esc(o.brief)}</div>
      ${o.status !== 'new' ? '<div class="bubble me">Bin dran! 🎛️</div>' : ''}
      ${(o.verdicts || []).map((v) => `<div class="bubble me">Hier ist meine Version 🎧</div>
        <div class="thread-meta">${fmtDate(v.at)} · deine Bewertung ${v.rating}/10</div>
        <div class="bubble them">${v.accepted ? '✅' : '❌'} ${esc(v.reply)}</div>`).join('')}
      ${delivered && o.minRating && !o.accepted ? `<div class="bubble me">Hier ist dein ${esc(T.short)} 🎧</div>
        <div class="bubble them">⏳ Ich urteile erst nach deiner ehrlichen Bewertung. Unter ${o.minRating}/10 geht er zurück.</div>` : ''}
      ${delivered && !o.minRating ? `<div class="bubble me">Hier ist dein ${esc(T.short)} 🎧</div>
        <div class="thread-meta">${fmtDate(o.deliveredAt)}, ${fmtTime(o.deliveredAt)}</div>
        <div class="bubble them">${esc(o.reply)}<br><span class="stars">${'★'.repeat(o.rating || 0)}${'☆'.repeat(5 - (o.rating || 0))}</span></div>` : ''}
    </div>` : `<h2 style="font-size:28px;margin:12px 4px 4px">${esc(orderTitle(o))}</h2>
      ${o.type === 'video' || o.type === 'vocals' || o.tier === 'event' ? `<div class="thread"><div class="bubble them">${o.tier ? '' : `${T.icon} `}${esc(o.brief)}</div></div>` : ''}`}

    ${o.challenge ? `<div class="challenge glass">
      <div class="challenge-ico">${MODE[o.challenge.mode]?.icon || '🎯'}</div>
      <div style="flex:1"><span>${MODE[o.challenge.mode] ? `${MODE[o.challenge.mode].label} · ` : 'Lern-Challenge · '}${esc(o.challenge.area)} · ${'●'.repeat(o.challenge.lvl)}${'○'.repeat(3 - o.challenge.lvl)}</span>
        <b>${esc(o.challenge.name)}</b>
        ${o.status !== 'delivered' ? `<button class="btn plain small" style="padding:0;min-height:30px" data-action="reroll-challenge" data-id="${o.id}">🎲 Andere Challenge</button>` : ''}
        ${o.challenge.done === true ? '<span style="color:var(--green)">✓ Umgesetzt</span>' : o.challenge.done === false ? '<span>Nicht umgesetzt – kommt wieder dran</span>' : ''}</div>
    </div>` : ''}
    ${renderReview(o)}
    ${o.sourceOrderId ? `<button class="btn plain" data-action="open-order" data-id="${o.sourceOrderId}">🎧 ${o.type === 'vocals' ? 'Zum Beat' : 'Zum Song'}</button>` : ''}
    ${state.video && o.submissions.some((x) => x.id === state.video.subId) ? '<div id="videoSlot"></div>' : ''}

    <div class="specs">
      ${specs.map((sp) => `<div class="spec ${sp.wide ? 'wide' : ''}"><span>${sp[0]}</span><b>${esc(sp[1])}</b></div>`).join('')}
    </div>
    ${GENRES[o.genre] ? `<details class="guide glass"><summary>📚 Genre-Guide: ${esc(o.genre)}</summary>${genreGuide(o.genre)}</details>` : ''}

    ${o.status === 'new' && (o.type === 'video' || o.type === 'vocals') ? `
      <button class="btn" data-action="accept" data-id="${o.id}">Los geht's ${T.icon}</button>
      <button class="btn secondary" data-action="reroll-concept" data-id="${o.id}" style="margin-top:10px">🎲 Anderes Konzept</button>
      ${o.prompt ? `<button class="btn secondary" data-action="reroll-theme" data-id="${o.id}" style="margin-top:10px">✍️ Anderes Thema</button>` : ''}
    ` : o.status === 'new' ? `
      <button class="btn" data-action="accept" data-id="${o.id}">Auftrag annehmen</button>
      <button class="btn secondary" data-action="decline" data-id="${o.id}" style="margin-top:10px">👎 Gefällt mir nicht – anderen Auftrag</button>
    ` : `
      <div class="section-title" style="margin-top:14px">Versionen <small>${subs.length}</small></div>
      ${subs.length ? subs.map((s) => subRow(o, s)).join('') : `<p class="footnote" style="margin:0 4px 10px">${o.type === 'video'
        ? 'Noch nichts hochgeladen. Schneide das Video (z. B. CapCut) und lade es hier hoch.'
        : o.type === 'vocals' ? 'Nimm deine Vocals in FL Studio auf, misch sie und exportiere den ganzen Song (MP3/WAV).'
        : 'Noch nichts hochgeladen. Exportiere aus FL Studio (MP3/WAV) und lade die Datei hier hoch.'}</p>`}
      <button class="btn ${subs.length ? 'secondary' : ''}" data-action="upload" data-id="${o.id}">⬆︎ ${o.type === 'vocal_chain' ? 'Preset / Demo hochladen' : o.type === 'video' ? 'Video hochladen' : o.tier === 'event' ? 'Audio / Video hochladen' : o.type === 'vocals' ? 'Song mit Vocals hochladen' : o.type === 'release' ? 'Release-Song hochladen (gemischt & gemastert)' : 'Datei hochladen'}</button>
      ${!delivered ? (state.activeSession?.orderId === o.id
        ? `<button class="btn secondary" style="margin-top:10px" data-action="stop-session">⏹ Session beenden (${fmtClock(Date.now() - state.activeSession.start)})</button>`
        : state.activeSession ? '' : `<button class="btn secondary" style="margin-top:10px" data-action="start-session" data-id="${o.id}">⏱ Session für diesen Auftrag starten</button>`) : ''}
      ${!delivered && subs.length ? `<button class="btn" style="margin-top:10px" data-action="deliver" data-id="${o.id}">${selfMade(o) ? 'Als fertig markieren' : `v${subs[0].version} abgeben`}</button>` : ''}
    `}

    ${['vocals', 'full_song', 'hook', 'release'].includes(o.type) ? `
    <div class="group-title">✍️ Lyrics</div>
    <div class="group glass lyrics">
      <textarea data-lyrics="${o.id}" placeholder="[Hook]\n…\n\n[Part 1]\n…" rows="10">${esc(o.lyrics || '')}</textarea>
      <div class="lyrics-bar"><span id="lyricsStats">${lyricsStats(o.lyrics)}</span>
        <button class="btn plain small" data-action="lyrics-template" data-id="${o.id}">+ Struktur</button></div>
    </div>` : ''}
    <div class="group glass" style="margin-top:22px">
      <label class="row col"><span class="label" style="font-size:13px;color:var(--label-2)">Notizen${o.type === 'video' ? '' : ' (Samples, Plugins, Ideen …)'}</span>
        <textarea data-note="${o.id}" placeholder="${o.type === 'video' ? 'z. B. Drehorte, Outfits, Shots, CapCut-Effekte …' : o.type === 'vocals' ? 'z. B. Reimideen, Flow, Adlibs, Mic-Einstellungen …' : 'z. B. Serum Preset „Dark Pluck“, 808 aus Kit X …'}">${esc(o.notes || '')}</textarea></label>
    </div>
    <button class="btn danger" data-action="delete-order" data-id="${o.id}" style="margin-top:8px">${o.type === 'own' ? 'Projekt' : 'Auftrag'} löschen</button>
  `;
}

// "Sleep on it" review: day after delivery, listen again, rate 1–10.
function renderReview(o) {
  const r = o.review;
  if (!r || o.deleted) return '';
  const thr = thrFor(o);
  const U = UNLOCK[unlockFor(o)];
  if (r.rating) {
    const free = r.rating >= thr;
    return `<div class="review glass">
      <div class="review-score ${free ? 'free' : ''}">${r.rating}<small>/10</small></div>
      <div><b>${free ? `${U.icon} ${U.free}` : 'Nicht freigegeben – bleibt Übung 💪'}</b>
        <span>Deine Bewertung vom ${fmtDate(r.ratedAt, { day: 'numeric', month: 'short' })}${free ? '' : `. Ab ${thr}/10 gibt's ${U.short === 'Vocals' ? 'einen Vocal-Auftrag' : 'ein Video'}.`}</span>
        ${free && (r.nextOrderId || r.videoOrderId) ? `<button class="btn small" style="margin-top:10px" data-action="open-order" data-id="${r.nextOrderId || r.videoOrderId}">${U.go}</button>` : ''}</div>
    </div>
    <div class="group glass">
      <label class="row col"><span class="label" style="font-size:13px;color:var(--label-2)">Was nimmst du mit? Was machst du nächstes Mal anders?</span>
        <textarea data-lesson="${o.id}" placeholder="z. B. 808 war zu laut, Hook früher bringen …">${esc(r.lesson || '')}</textarea></label>
    </div>`;
  }
  if (Date.now() < r.opensAt) {
    return `<div class="review glass">
      <div class="review-score">🔒</div>
      <div><b>${fmtDate(r.opensAt, { weekday: 'long' })} nochmal anhören</b>
        <span>Erst mit etwas Abstand bewerten – dann hörst du ehrlicher. Ab ${thr}/10 ${U.hint}.</span></div>
    </div>`;
  }
  const sub = o.submissions.find((x) => x.id === o.deliveredSubmissionId);
  const need = (r.duration || sub?.duration || 0) * 0.9;
  const pct = need ? Math.min(100, Math.round(((r.listenedSec || 0) / need) * 100)) : 0;
  const ready = pct >= 100;
  const playing = state.playing?.subId === sub?.id && !audio.paused;
  return `<div class="review glass col">
    <b>🎧 Nochmal komplett anhören & ehrlich bewerten</b>
    ${o.minRating ? `<span style="color:var(--orange);font-weight:600">${o.tier === 'boss' ? '💀' : '🎖️'} ${esc(o.client)} akzeptiert erst ab ${o.minRating}/10 – sei ehrlich, sonst lernst du nichts.</span>` : ''}
    <span>Ab ${thr}/10 ${U.hint}.</span>
    ${sub ? `<div class="review-listen">
      <button class="play-dot" data-action="play" data-order="${o.id}" data-sub="${sub.id}" aria-label="Abspielen">${playing ? ICON.pause : ICON.play}</button>
      <div class="progress" style="flex:1;margin:0"><i style="width:${pct}%"></i></div>
      <small>${ready ? '✓' : `${pct}%`}</small>
    </div>` : '<span style="color:var(--red)">Die abgegebene Version fehlt.</span>'}
    <div class="rate-grid">
      ${Array.from({ length: 10 }, (_, i) => i + 1).map((n) => `<button class="rate-btn ${n >= thr ? 'hi' : ''}" data-action="rate" data-id="${o.id}" data-v="${n}" ${ready || !sub ? '' : 'disabled'}>${n}</button>`).join('')}
    </div>
    ${ready ? '' : '<span>Bewerten geht, sobald du ihn (fast) ganz gehört hast.</span>'}
  </div>`;
}

function subRow(o, s) {
  const playing = state.playing?.subId === s.id;
  const isAudio = isAudioFile(s);
  const final = o.deliveredSubmissionId === s.id;
  return `<div class="track glass ${playing || state.video?.subId === s.id ? 'playing' : ''}">
    <div class="art" style="background:${gradient(o.genre + s.version)}">v${s.version}</div>
    <div class="t-main">
      <div class="t-title">${esc(s.name)}${final ? ' ✅' : ''}</div>
      <div class="t-sub">${fmtDate(s.uploadedAt, { day: 'numeric', month: 'short' })} · ${fmtSize(s.size)}${s.duration ? ` · ${fmtDuration(s.duration)}` : ''}${s.remotePath ? ' · ☁️' : ''}</div>
    </div>
    <button class="play-dot" data-action="share-file" data-order="${o.id}" data-sub="${s.id}" aria-label="Teilen">${ICON.share}</button>
    ${isVideoFile(s) ? `<button class="play-dot" data-action="play-video" data-order="${o.id}" data-sub="${s.id}" aria-label="Video ansehen">${ICON.play}</button>`
      : isAudio ? `<button class="play-dot" data-action="play" data-order="${o.id}" data-sub="${s.id}" aria-label="Abspielen">${playing && !audio.paused ? ICON.pause : ICON.play}</button>` : ''}
    <button class="play-dot" data-action="delete-sub" data-order="${o.id}" data-sub="${s.id}" aria-label="Löschen" style="color:var(--red)">${ICON.close}</button>
  </div>`;
}

function renderOwnSheet() {
  const genres = Object.keys(GENRES);
  return `
    <div class="sheet-head">
      <button class="btn plain" data-action="close-sheet">Abbrechen</button>
      <h2>Eigenes Projekt</h2>
      <button class="btn plain bold" data-action="create-own">Erstellen</button>
    </div>
    <div class="group glass" style="margin-top:14px">
      <label class="row"><span class="label">Titel</span><input type="text" id="ownTitle" placeholder="z. B. Late Night Freestyle" /></label>
      <label class="row"><span class="label">Genre</span>
        <select id="ownGenre" style="text-align:right">${genres.map((g) => `<option>${esc(g)}</option>`).join('')}<option>Sonstiges</option></select></label>
    </div>
    <p class="footnote">Für alles, was du einfach so machst. Landet genauso in deiner Bibliothek.</p>
  `;
}

// ---------------------------------------------------------------- player --

async function getBlob(o, s) {
  const f = await db.getFile(s.fileId);
  if (f) return f.blob;
  if (s.remotePath) {
    toast('Lade aus der Cloud …');
    return cloud.download(s);
  }
  return null;
}

async function play(orderId, subId) {
  if (state.playing?.subId === subId) {
    if (audio.paused) audio.play(); else audio.pause();
    return;
  }
  const o = state.orders.find((x) => x.id === orderId);
  const s = o?.submissions.find((x) => x.id === subId);
  if (!s) return;
  let blob;
  try { blob = await getBlob(o, s); } catch (e) { return toast(`Download fehlgeschlagen: ${e.message}`); }
  if (!blob) return toast('Datei ist auf diesem Gerät nicht vorhanden.');
  if (state.playing?.url) URL.revokeObjectURL(state.playing.url);
  const url = URL.createObjectURL(blob);
  state.playing = { orderId, subId, url };
  audio.src = url;
  resumeAudio();
  try { await audio.play(); } catch (e) { console.warn(e); }

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${orderTitle(o)} (v${s.version})`,
      artist: state.settings.artistName || 'Beat Orders',
      album: `${o.genre} · ${ORDER_TYPES[o.type].label}`,
      artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }],
    });
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('seekto', (d) => { audio.currentTime = d.seekTime; });
  }
}

function renderMiniPlayer() {
  const mp = $('#miniplayer');
  const p = state.playing;
  const o = p && state.orders.find((x) => x.id === p.orderId);
  const s = o?.submissions.find((x) => x.id === p.subId);
  if (!s) { mp.hidden = true; return; }
  mp.hidden = false;
  mp.innerHTML = `
    <button class="mp-art" style="background:${gradient(o.genre)}" data-action="open-viz" aria-label="Visualizer">✨</button>
    <button class="mp-text" style="text-align:left" data-action="open-order" data-id="${o.id}">
      <div class="mp-title">${esc(orderTitle(o))}</div>
      <div class="mp-sub">v${s.version} · ${esc(o.genre)}</div>
      <div class="mp-bar"><i id="mpProgress"></i></div>
    </button>
    <button class="mp-btn" data-action="play" data-order="${o.id}" data-sub="${s.id}" aria-label="Play/Pause">${audio.paused ? ICON.play : ICON.pause}</button>
    <button class="mp-btn" data-action="stop" aria-label="Schließen" style="color:var(--label-2)">${ICON.close}</button>`;
  updateProgress();
}

function updateProgress() {
  const bar = $('#mpProgress');
  if (bar && audio.duration) bar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
}

audio.addEventListener('timeupdate', updateProgress);

// Count real listening time (seeking doesn't count) for the self-review.
let lastPos = 0;
audio.addEventListener('seeking', () => { lastPos = audio.currentTime; });
audio.addEventListener('timeupdate', () => {
  const t = audio.currentTime, d = t - lastPos;
  lastPos = t;
  const p = state.playing;
  const o = p && state.orders.find((x) => x.id === p.orderId);
  if (!o?.review || o.review.rating || p.subId !== o.deliveredSubmissionId || Date.now() < o.review.opensAt) return;
  if (d <= 0 || d > 1.5) return;
  const r = o.review;
  const before = r.listenedSec || 0;
  r.listenedSec = before + d;
  if (audio.duration && isFinite(audio.duration)) r.duration = audio.duration;
  const step = (r.duration || 60) * 0.05; // save/re-render every ~5 %
  if (Math.floor(r.listenedSec / step) !== Math.floor(before / step)) {
    saveOrder(o, { silent: true });
    if (state.sheet?.id === o.id) renderSheet();
  }
});
['play', 'pause', 'ended'].forEach((ev) => audio.addEventListener(ev, () => {
  renderVizUi();
  render();
  if (state.sheet) renderSheet();
}));

// Seek by tapping the progress bar in the mini player.
document.addEventListener('click', (e) => {
  const bar = e.target.closest('.mp-bar');
  if (!bar || !audio.duration) return;
  e.stopPropagation();
  const r = bar.getBoundingClientRect();
  audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
}, true);

// ------------------------------------------------------------ visualizer --

let viz = null;
function openViz() {
  const an = ensureAudioGraph(audio); // needs the tap (user gesture) to start Web Audio
  if (!an) return toast('Visualizer wird hier nicht unterstützt.');
  $('#viz').hidden = false;
  viz ||= createVisualizer($('#vizCanvas'));
  viz.start(an);
  state.vizOpen = true;
  renderVizUi();
}
function closeViz() {
  if (isRecording()) stopRecording();
  viz?.stop();
  $('#viz').hidden = true;
  state.vizOpen = false;
}
function renderVizUi() {
  if (!state.vizOpen) return;
  const p = state.playing;
  const o = p && state.orders.find((x) => x.id === p.orderId);
  const s = o?.submissions.find((x) => x.id === p.subId);
  $('#vizUi').innerHTML = `
    <div class="viz-top">
      <button class="viz-btn glass" data-action="close-viz" aria-label="Schließen">⌄</button>
      <button class="viz-chip glass" data-action="viz-palette">🎨 ${esc(viz.paletteName)}</button>
    </div>
    <div class="viz-panel glass">
      <div class="mp-title">${esc(o ? orderTitle(o) : 'Nichts ausgewählt')}</div>
      <div class="mp-sub">${s ? `v${s.version} · ${esc(o.genre)}` : 'Spiel einen Track in der Bibliothek ab'}</div>
      <input id="vizSeek" class="viz-seek" type="range" min="0" max="1000" value="${audio.duration ? Math.round((audio.currentTime / audio.duration) * 1000) : 0}" aria-label="Position" />
      <div class="viz-controls">
        <button class="viz-rec ${isRecording() ? 'on' : ''}" data-action="viz-rec">${isRecording() ? '⏹ Stopp' : '⏺ Aufnehmen'}</button>
        ${s ? `<button class="mp-btn big" data-action="play" data-order="${o.id}" data-sub="${s.id}" aria-label="Play/Pause">${audio.paused ? ICON.play : ICON.pause}</button>` : ''}
        <span style="width:96px"></span>
      </div>
    </div>`;
}

document.addEventListener('input', (e) => {
  if (e.target.id === 'vizSeek' && audio.duration) audio.currentTime = (e.target.value / 1000) * audio.duration;
});
audio.addEventListener('timeupdate', () => {
  const el = $('#vizSeek');
  if (el && audio.duration && document.activeElement !== el) el.value = Math.round((audio.currentTime / audio.duration) * 1000);
});

// Record the visualizer (+ audio) → video you can post or attach to a video order.
async function toggleRecording() {
  if (isRecording()) { stopRecording(); return; }
  const p = state.playing;
  const o = p && state.orders.find((x) => x.id === p.orderId);
  if (!o) return toast('Erst einen Track abspielen.');
  let done;
  try { done = startRecording($('#vizCanvas')); } catch (e) { return toast(e.message); }
  if (audio.paused) audio.play();
  toast('⏺ Aufnahme läuft – nochmal tippen zum Stoppen');
  renderVizUi();
  const blob = await done;
  renderVizUi();
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
  const file = new File([blob], `visualizer-${orderTitle(o).replace(/[äöüÄÖÜß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss' }[c])).replace(/[^\w]+/g, '-').slice(0, 40)}.${ext}`, { type: blob.type });
  // Belongs to an open video order for this song? Offer to attach it.
  const vo = state.orders.find((x) => x.type === 'video' && !x.deleted && x.status !== 'delivered' && x.sourceOrderId === o.id);
  if (vo && confirm('Video als neue Version zum Video-Auftrag hinzufügen?')) {
    await addFileToOrder(vo, file);
    return;
  }
  if (isNative) { try { await shareBlob(file, file.name, 'Visualizer'); } catch {} return; }
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file] }); } catch {} return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = file.name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

// ------------------------------------------------------------- uploads --

function pickFile(accept) {
  return new Promise((resolve) => {
    const input = $('#filePicker');
    input.value = '';
    input.accept = accept;
    input.onchange = () => resolve(input.files[0] || null);
    input.click();
  });
}

// Read a (big) text file line by line without loading it into one string.
async function* readLines(file) {
  const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
  let pieces = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    let start = 0, i;
    while ((i = value.indexOf('\n', start)) >= 0) {
      pieces.push(value.slice(start, i));
      yield pieces.join('');
      pieces = [];
      start = i + 1;
    }
    pieces.push(value.slice(start));
  }
  const rest = pieces.join('');
  if (rest.trim()) yield rest;
}

function audioDuration(blob) {
  return new Promise((resolve) => {
    const a = new Audio();
    const url = URL.createObjectURL(blob);
    const done = (v) => { URL.revokeObjectURL(url); resolve(v); };
    a.preload = 'metadata';
    a.onloadedmetadata = () => done(a.duration);
    a.onerror = () => done(null);
    setTimeout(() => done(null), 5000);
    a.src = url;
  });
}

async function upload(orderId) {
  const o = state.orders.find((x) => x.id === orderId);
  if (!o) return;
  const AUDIO = 'audio/*,.mp3,.wav,.m4a,.aac,.flac,.aif,.aiff,.ogg', VIDEO = 'video/*,.mp4,.mov,.webm';
  const accept = o.type === 'vocal_chain' ? '' : o.type === 'video' ? VIDEO : o.type === 'own' ? `${AUDIO},${VIDEO}` : AUDIO;
  const file = await pickFile(accept);
  if (!file) return;
  await addFileToOrder(o, file);
}

async function addFileToOrder(o, file) {
  const fileId = uid();
  await db.putFile(fileId, file);
  const media = isAudioFile({ mime: file.type, name: file.name }) || isVideoFile({ mime: file.type, name: file.name });
  const duration = media ? await audioDuration(file) : null;
  const version = o.submissions.reduce((m, s) => Math.max(m, s.version), 0) + 1;
  o.submissions.push({
    id: uid(), fileId, name: file.name, size: file.size, mime: file.type,
    duration, version, uploadedAt: Date.now(), remotePath: null,
  });
  if (o.status === 'new') o.status = 'in_progress';
  await saveOrder(o);
  toast(`v${version} hochgeladen 🎉`);
  render();
  renderSheet();
}

async function shareFile(orderId, subId) {
  const o = state.orders.find((x) => x.id === orderId);
  const s = o?.submissions.find((x) => x.id === subId);
  if (!s) return;
  let blob;
  try { blob = await getBlob(o, s); } catch (e) { return toast(e.message); }
  if (!blob) return toast('Datei ist auf diesem Gerät nicht vorhanden.');
  if (isNative) {
    try { await shareBlob(blob, s.name, orderTitle(o)); } catch (e) { if (!/cancel/i.test(e.message)) toast(e.message); }
    return;
  }
  const file = new File([blob], s.name, { type: s.mime || blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: orderTitle(o) }); } catch {}
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = s.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
}

// ------------------------------------------------------------- actions --

const actions = {
  'tab': (el) => { state.tab = el.dataset.tab; render(); window.scrollTo(0, 0); },
  async install() {
    const p = state.installPrompt;
    if (!p) return;
    state.installPrompt = null;
    p.prompt();
    await p.userChoice.catch(() => {});
    render();
  },
  'hide-hint': async () => { state.hideInstallHint = true; await db.set('hideInstallHint', true); render(); },
  'open-order': (el) => openSheet({ kind: 'order', id: el.dataset.id }),
  'close-sheet': () => closeSheet(),

  async 'request-order'() {
    const active = state.orders.filter((o) => isActive(o) && o.type !== 'own').length;
    if (active >= state.settings.maxActive &&
        !confirm(`Du hast schon ${active} aktive Aufträge (Limit ${state.settings.maxActive}). Trotzdem einen neuen?`)) return;
    const o = generateOrder(state.settings, genOpts());
    await receiveOrder(o);
    openSheet({ kind: 'order', id: o.id });
  },

  async accept(el) {
    const o = state.orders.find((x) => x.id === el.dataset.id);
    o.status = 'in_progress';
    await saveOrder(o);
    render(); renderSheet();
  },

  // Not feeling it? Decline and get a different order right away – as often
  // as you like. Declines also teach the generator what you don't want.
  async decline(el) {
    const o = state.orders.find((x) => x.id === el.dataset.id);
    o.status = 'declined';
    await saveOrder(o);
    const n = generateOrder(state.settings, genOpts());
    await saveOrder(n);
    toast('🔄 Neuer Auftrag');
    render();
    openSheet({ kind: 'order', id: n.id });
  },

  async 'reroll-challenge'(el) {
    const o = state.orders.find((x) => x.id === el.dataset.id);
    const hist = genOpts().history.filter((x) => x.id !== o.id);
    let c;
    for (let i = 0; i < 6 && (!c || c.name === o.challenge?.name); i++) c = pickChallenge(o.type, { history: hist });
    o.challenge = c;
    await saveOrder(o);
    renderSheet();
  },

  upload: (el) => upload(el.dataset.id),

  async deliver(el) {
    const o = state.orders.find((x) => x.id === el.dataset.id);
    const latest = o.submissions.reduce((a, b) => (b.version > a.version ? b : a));
    if (o.challenge && o.challenge.done == null) {
      o.challenge.done = confirm(`🎯 Hast du die Lern-Challenge umgesetzt?\n\n„${o.challenge.name}“\n\nOK = Ja · Abbrechen = Nein`);
    }
    const before = progress();
    o.status = 'delivered';
    o.deliveredAt = Date.now();
    o.deliveredSubmissionId = latest.id;
    if (o.minRating) o.reply = null; // experts/boss judge after your review
    else if (!selfMade(o)) Object.assign(o, clientReply(o));
    // Everything with music gets the next-day self-review (not presets, not videos).
    if (o.type !== 'vocal_chain' && o.type !== 'video' && isAudioFile(latest)) {
      o.review = { opensAt: reviewOpensAt(o.deliveredAt), listenedSec: 0, duration: latest.duration || null, rating: null };
    }
    await saveOrder(o);
    rewardToast(before, o.minRating ? `Abgegeben – Urteil nach deiner Bewertung (mind. ${o.minRating}/10)` : o.review ? 'Abgegeben ✅ Morgen nochmal anhören' : selfMade(o) ? 'Fertig ✅' : 'Abgegeben ✅');
    render(); renderSheet();
  },

  async 'delete-order'(el) {
    if (!confirm('Wirklich löschen? Alle Uploads dazu werden entfernt.')) return;
    const o = state.orders.find((x) => x.id === el.dataset.id);
    for (const s of o.submissions) {
      await db.deleteFile(s.fileId);
      cloud.removeFile(s).catch(() => {});
    }
    if (state.playing?.orderId === o.id) actions.stop();
    // Tombstone so the deletion also syncs to other devices.
    o.deleted = true;
    o.submissions = [];
    await saveOrder(o);
    closeSheet();
  },

  async 'delete-sub'(el) {
    if (!confirm('Diese Version löschen?')) return;
    const o = state.orders.find((x) => x.id === el.dataset.order);
    const s = o.submissions.find((x) => x.id === el.dataset.sub);
    await db.deleteFile(s.fileId);
    cloud.removeFile(s).catch(() => {});
    if (state.playing?.subId === s.id) actions.stop();
    o.submissions = o.submissions.filter((x) => x.id !== s.id);
    if (o.deliveredSubmissionId === s.id) o.deliveredSubmissionId = null;
    await saveOrder(o);
    render(); renderSheet();
  },

  play: (el) => play(el.dataset.order, el.dataset.sub),
  'open-viz': () => openViz(),
  'close-viz': () => closeViz(),
  'viz-palette': () => { toast(`🎨 ${viz.nextPalette()}`); renderVizUi(); },
  'viz-rec': () => toggleRecording(),

  async 'play-video'(el) {
    const o = state.orders.find((x) => x.id === el.dataset.order);
    const s = o?.submissions.find((x) => x.id === el.dataset.sub);
    if (!s) return;
    let blob;
    try { blob = await getBlob(o, s); } catch (e) { return toast(`Download fehlgeschlagen: ${e.message}`); }
    if (!blob) return toast('Datei ist auf diesem Gerät nicht vorhanden.');
    audio.pause();
    closeVideo();
    state.video = { subId: s.id, url: URL.createObjectURL(blob) };
    if (state.sheet?.id !== o.id) openSheet({ kind: 'order', id: o.id }); else renderSheet();
    $('#sheet video')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  async rate(el) {
    const o = state.orders.find((x) => x.id === el.dataset.id);
    const n = Number(el.dataset.v);
    if (!confirm(`${n}/10 – sicher? Die Bewertung ist endgültig.`)) return;
    const before = progress();
    o.review.rating = n;
    o.review.ratedAt = Date.now();
    if (o.minRating) {
      const accepted = n >= o.minRating;
      const reply = verdictReply(o, accepted);
      o.verdicts = [...(o.verdicts || []), { rating: n, accepted, reply, at: Date.now() }];
      if (!accepted) {
        // Sent back: rework and deliver again.
        Object.assign(o, { status: 'in_progress', deliveredAt: null, deliveredSubmissionId: null, review: null, reply: null });
        if (state.playing?.orderId === o.id) audio.pause();
        await saveOrder(o);
        toast(`❌ ${o.client.split(' ')[0]} hat abgelehnt – überarbeiten und nochmal abgeben`);
        render(); renderSheet();
        return;
      }
      o.accepted = true; o.reply = reply; o.rating = 5;
    }
    if (n >= thrFor(o)) {
      const v = unlockFor(o) === 'vocals' ? createVocalOrder(o, genOpts()) : createVideoOrder(o, genOpts());
      o.review.nextOrderId = v.id;
      await saveOrder(v);
    }
    if (state.playing?.orderId === o.id) audio.pause();
    await saveOrder(o);
    rewardToast(before, o.accepted ? `✅ ${TIER[o.tier].label} hat akzeptiert!`
      : n >= thrFor(o)
      ? (unlockFor(o) === 'vocals' ? '🎙️ Freigegeben – jetzt Vocals drauf!' : '🎬 Freigegeben – Video-Auftrag ist da')
      : `${n}/10 – nächstes Mal knackst du die ${thrFor(o)} 💪`);
    render(); renderSheet();
  },

  async 'reroll-concept'(el) {
    const o = state.orders.find((x) => x.id === el.dataset.id);
    const src = state.orders.find((x) => x.id === o.sourceOrderId) || o;
    const make = o.type === 'vocals' ? createVocalOrder : createVideoOrder;
    const fresh = make(src, { concept: rerollConcept(o), ...genOpts() });
    Object.assign(o, { concept: fresh.concept, mood: fresh.mood });
    o.brief = o.type === 'vocals' && o.prompt ? vocalBrief(o.concept, o.title.replace(/^Vocals: /, ''), o.prompt, o.refs) : fresh.brief;
    await saveOrder(o);
    renderSheet();
  },
  async 'reroll-theme'(el) {
    const o = state.orders.find((x) => x.id === el.dataset.id);
    o.prompt = songPrompt(o.genre);
    o.brief = vocalBrief(o.concept, o.title.replace(/^Vocals: /, ''), o.prompt, o.refs);
    await saveOrder(o);
    renderSheet();
  },
  'share-file': (el) => shareFile(el.dataset.order, el.dataset.sub),
  stop() {
    audio.pause();
    if (state.playing?.url) URL.revokeObjectURL(state.playing.url);
    state.playing = null;
    audio.removeAttribute('src');
    render();
  },

  'filter-type': (el) => { state.filter.type = el.dataset.v; render(); },
  'filter-genre': (el) => { state.filter.genre = el.dataset.v; render(); },

  'new-own': () => openSheet({ kind: 'own' }),

  'open-shop': () => openSheet({ kind: 'shop' }),
  'lex-fam': (el) => { state.lexFam = el.dataset.v; render(); },
  'open-genre': (el) => openSheet({ kind: 'genre', id: el.dataset.v }),
  async 'request-genre'(el) {
    const o = generateOrder(state.settings, { ...genOpts(), genre: el.dataset.v });
    await receiveOrder(o);
    openSheet({ kind: 'order', id: o.id });
  },
  'career-update': (el) => careerUpdate(el.dataset.id),
  'open-customer': (el) => openSheet({ kind: 'customer', id: el.dataset.id }),
  async 'lyrics-template'(el) {
    const o = state.orders.find((x) => x.id === el.dataset.id);
    const L = o.concept?.length || '';
    const parts = /3 Parts/.test(L) ? ['Part 1', 'Part 2', 'Part 3']
      : /1 Part|Hook \+ 1|8 \+ 16/.test(L) ? ['Hook', 'Part 1', 'Hook']
      : ['Intro', 'Hook', 'Part 1', 'Hook', 'Part 2', 'Hook', 'Outro'];
    o.lyrics = (o.lyrics ? `${o.lyrics}\n\n` : '') + parts.map((x) => `[${x}]\n`).join('\n');
    await saveOrder(o);
    renderSheet();
  },
  'start-session': (el) => startSession(el.dataset.id || null),
  'stop-session': () => stopSession(),
  async 'hide-recap'() { state.recapSeen = weekKey(Date.now() - 7 * DAY); await db.set('recapSeen', state.recapSeen); render(); },
  async 'request-expert'() {
    if (!expertsUnlocked()) return;
    const o = createExpertOrder(state.settings, genOpts());
    await receiveOrder(o);
    openSheet({ kind: 'order', id: o.id });
  },
  'shop-tab': (el) => { state.shopTab = el.dataset.v; renderSheet(); },
  async buy(el) {
    const item = ITEMS[el.dataset.id];
    const p = progress();
    if (!item || p.coins < item.price) return toast('Nicht genug Coins 🪙');
    if (item.needs?.delivered && p.delivered < item.needs.delivered) return toast(`🔒 Erst ${item.needs.delivered} Abgaben`);
    if (!confirm(`${item.name} für ${item.price} 🪙 kaufen?`)) return;
    const expertsUnlockedBefore = expertsUnlocked();
    state.profile.owned = [...state.profile.owned, item.id];
    if (item.cat === 'frames') state.profile.frame = item.id;
    if (item.cat === 'banners') state.profile.banner = item.id;
    await saveProfile();
    const wasLocked = !expertsUnlockedBefore;
    if (wasLocked && expertsUnlocked()) setTimeout(() => toast('🎖️ EXPERTEN FREIGESCHALTET! Schau ins Profil.'), 2600);
    toast(item.id === 'vip-chaya' ? '👑 LEGENDÄR! Chaya ist jetzt deine VIP-Managerin 💅' : `${item.emoji || (item.cat === 'garage' ? '🏎️' : '✨')} ${item.name} gekauft!`);
    renderSheet(); render();
  },
  async equip(el) {
    const item = ITEMS[el.dataset.id];
    const key = item.cat === 'frames' ? 'frame' : 'banner';
    state.profile[key] = state.profile[key] === item.id ? null : item.id;
    await saveProfile();
    renderSheet(); render();
  },
  async pfp() {
    const file = await pickFile('image/*');
    if (!file) return;
    await db.putFile('pfp', file);
    if (state.pfpUrl) URL.revokeObjectURL(state.pfpUrl);
    state.pfpUrl = URL.createObjectURL(file);
    render();
  },
  async 'create-own'() {
    const o = createOwnProject({ title: $('#ownTitle').value.trim(), genre: $('#ownGenre').value, ...genOpts() });
    await saveOrder(o);
    openSheet({ kind: 'order', id: o.id });
    render();
  },

  async step(el) {
    const [key, sub] = el.dataset.key.split(':');
    const d = Number(el.dataset.d), min = Number(el.dataset.min), max = Number(el.dataset.max);
    const s = state.settings;
    if (key === 'type') s.types[sub] = Math.min(max, Math.max(min, (s.types[sub] ?? 0) + d));
    else if (key === 'genre') s.genreWeights = { ...s.genreWeights, [sub]: Math.min(max, Math.max(min, (s.genreWeights[sub] ?? 0) + d)) };
    else s[key] = Math.min(max, Math.max(min, s[key] + d));
    await saveSettings();
    if (key === 'type' || key === 'genre') await refreshPending(true);
    else if (key === 'videoThreshold' || key === 'vocalThreshold') { /* nur Anzeige */ }
    else if (key !== 'maxActive') await refreshPending(false);
    else scheduleNative();
    render();
  },

  async 'test-notification'() {
    if (isNative) {
      if (!(await requestNotificationPermission())) return toast('Mitteilungen sind nicht erlaubt.');
      await LocalNotifications.schedule({ notifications: [{
        id: 2, title: 'Beat Orders', body: 'So sehen neue Aufträge aus 🎧', smallIcon: 'ic_stat_orders',
        schedule: { at: new Date(Date.now() + 3000), allowWhileIdle: true },
      }] });
      return toast('Kommt in 3 Sekunden …');
    }
    if (!('Notification' in window)) return toast('Mitteilungen gehen erst nach „Zum Home-Bildschirm“.');
    if (Notification.permission !== 'granted') await Notification.requestPermission();
    if (Notification.permission !== 'granted') return toast('Mitteilungen sind nicht erlaubt.');
    const reg = await navigator.serviceWorker?.ready;
    const opts = { body: 'So sehen neue Aufträge aus 🎧', icon: 'icons/icon-192.png' };
    reg ? reg.showNotification('Beat Orders', opts) : new Notification('Beat Orders', opts);
  },

  // Complete backup: orders, MP3s/videos, profile, career, sessions, settings.
  // Format (v3): line 1 = JSON header with orders + settings, then one JSON
  // line per file – written and read piece by piece, so even a huge library
  // never has to fit into memory at once.
  async export() {
    toast('Backup wird erstellt …');
    const toB64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
    const kv = await db.allKv();
    const keep = Object.fromEntries(Object.entries(kv).filter(([k]) => [...STATE_KEYS, 'pendingOrder', 'nextOrderAt', 'hideInstallHint', 'stateUpdatedAt'].includes(k)));
    const ids = (await db.allFiles()).map((f) => f.id); // (blobs are read one by one below)
    const name = `beat-orders-komplett-${new Date().toISOString().slice(0, 10)}.json`;
    async function* lines() {
      yield `${JSON.stringify({ app: 'beat-orders', version: 3, exportedAt: Date.now(), kv: keep, orders: state.orders, fileCount: ids.length })}\n`;
      for (const id of ids) {
        const f = await db.getFile(id);
        if (f?.blob) yield `${JSON.stringify({ file: id, data: await toB64(f.blob) })}\n`;
      }
    }
    try {
      if (isNative) {
        const uri = await writeTextFile(name, lines());
        state.lastBackupAt = Date.now(); await db.set('lastBackupAt', state.lastBackupAt);
        toast(`Backup fertig (${ids.length} Dateien) – jetzt z. B. in Google Drive speichern`);
        try { await shareUri(uri, 'Beat Orders Backup'); } catch (e) { if (!/cancel/i.test(e.message)) toast(e.message); }
        render();
        return;
      }
      const parts = [];
      for await (const l of lines()) parts.push(l);
      const file = new File(parts, name, { type: 'application/json' });
      state.lastBackupAt = Date.now(); await db.set('lastBackupAt', state.lastBackupAt);
      toast(`Backup fertig (${fmtSize(file.size)}) – jetzt sicher speichern, z. B. in Google Drive`);
      render();
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file] }); return; } catch {}
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 20000);
    } catch (e) {
      toast(`Backup fehlgeschlagen: ${e.message}`);
    }
  },

  async import() {
    const file = await pickFile(''); // any file – Drive often doesn't label .json correctly
    if (!file) return;
    try {
      let header = null, files = 0;
      const putFile = async (id, data) => { await db.putFile(id, await (await fetch(data)).blob()); files++; };
      for await (const line of readLines(file)) {
        if (!line.trim()) continue;
        const data = JSON.parse(line);
        if (!header) {
          if (data.app !== 'beat-orders') throw new Error('Keine Beat-Orders-Datei');
          if (data.version >= 2 && !confirm('Komplett-Backup einspielen? Profil, Karriere & Einstellungen werden durch das Backup ersetzt, Aufträge und Dateien zusammengeführt.')) return;
          header = data;
          toast('Backup wird eingespielt …');
          for (const o of data.orders || []) {
            if (GENRE_RENAMES[o.genre]) o.genre = GENRE_RENAMES[o.genre];
            const cur = state.orders.find((x) => x.id === o.id);
            if (!cur || (o.updatedAt || 0) > (cur.updatedAt || 0)) await db.putOrder(o);
          }
          for (const f of data.files || []) await putFile(f.id, f.data); // v2: files inline
          if (data.kv) for (const [k, v] of Object.entries(data.kv)) await db.set(k, v);
          // v1 backups (older app versions)
          if (data.settings) await db.set('settings', { ...DEFAULT_SETTINGS, ...data.settings });
          if (data.profile) await db.set('profile', { ...DEFAULT_PROFILE, ...data.profile });
        } else if (data.file) {
          await putFile(data.file, data.data);
        }
      }
      if (!header) throw new Error('Datei ist leer');
      state.orders = await db.allOrders();
      await loadState();
      const pfp = await db.getFile('pfp');
      if (pfp) state.pfpUrl = URL.createObjectURL(pfp.blob);
      toast(`Backup importiert ✅ (${files} Dateien${header.fileCount && files < header.fileCount ? ` – ${header.fileCount - files} fehlen, Datei unvollständig?` : ''})`);
      render();
      syncSoon();
    } catch (e) {
      toast(`Import fehlgeschlagen: ${e.message}`);
    }
  },

  async reset() {
    if (!confirm('Alle lokalen Daten (Aufträge, Uploads, Einstellungen) löschen? Cloud-Daten bleiben erhalten.')) return;
    actions.stop();
    await db.clearAll();
    location.reload();
  },

  async 'cloud-save'() {
    const url = $('#cUrl').value, key = $('#cKey').value;
    if (!/^https:\/\//.test(url.trim()) || key.trim().length < 20) return toast('Bitte URL und Anon Key eintragen.');
    await cloud.saveConfig(url, key);
    state.cloudConfigured = true;
    render();
  },
  async 'cloud-reset'() {
    await db.set('cloud', null);
    state.cloudConfigured = false;
    render();
  },
  async 'cloud-login'() {
    const email = $('#cEmail').value.trim(), pass = $('#cPass').value;
    if (!email || pass.length < 6) return toast('E-Mail und Passwort (min. 6 Zeichen) eingeben.');
    try {
      state.cloudUser = await cloud.signIn(email, pass);
      toast('Angemeldet ☁️');
      render();
      await runSync(false);
      state.lastSync = await db.get('lastSync');
      render();
    } catch (e) {
      toast(e.message);
    }
  },
  async 'cloud-sync'() {
    await runSync(false);
    state.lastSync = await db.get('lastSync');
    render();
  },
  async 'cloud-logout'() {
    await cloud.signOut();
    state.cloudUser = null;
    render();
  },
};

// Settings changed → re-roll the upcoming order (optionally keeping its time).
async function refreshPending(keepTime) {
  const old = await db.get('pendingOrder');
  const p = keepTime && old
    ? generateOrder(state.settings, { at: old.createdAt, ...genOpts() })
    : generateOrder(state.settings, { at: nextArrival(state.settings), ...genOpts() });
  await db.set('pendingOrder', p);
  state.nextOrderAt = p.createdAt;
  scheduleNative(p);
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el); }
});

document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => actions.tab(t)));

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.lyrics) { const st = $('#lyricsStats'); if (st) st.textContent = lyricsStats(el.value); }
  if (el.dataset.lyrics || el.dataset.note || el.dataset.lesson) autosaveText(el);
  if (el.dataset.input === 'search') {
    state.filter.q = el.value;
    const pos = el.selectionStart;
    render();
    const again = $('[data-input="search"]');
    again.focus();
    again.setSelectionRange(pos, pos);
  }
});

document.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.dataset.week) {
    const [d, k] = el.dataset.week.split(':');
    const week = state.settings.week.map((w) => ({ ...(w || {}) }));
    week[d][k] = el.value || null;
    state.settings.week = week;
    await saveSettings();
    await refreshPending(false);
    render();
  } else if (el.dataset.setting) {
    state.settings[el.dataset.setting] = el.value.trim();
    await saveSettings();
  } else if (el.dataset.lyrics || el.dataset.lesson || el.dataset.note) {
    const o = flushText(el);
    if (o) await saveOrder(o);
  } else if (el.dataset.toggle) {
    const [key, sub] = el.dataset.toggle.split(':');
    const s = state.settings;
    if (key === 'notifications' && isNative) {
      s.notifications = el.checked && (await requestNotificationPermission());
      if (el.checked && !s.notifications) toast('Mitteilungen wurden nicht erlaubt – bitte in den Android-Einstellungen erlauben.');
      await saveSettings();
      if (s.notifications) scheduleNative(); else scheduleAll([]);
    } else if (key === 'notifications' && el.checked) {
      if (!('Notification' in window)) {
        el.checked = false;
        return toast('Erst über „Teilen → Zum Home-Bildschirm“ installieren.');
      }
      const perm = await Notification.requestPermission();
      s.notifications = perm === 'granted';
      if (!s.notifications) toast('Mitteilungen wurden nicht erlaubt.');
    } else {
      s[key] = el.checked;
    }
    await saveSettings();
    render();
  }
});

// ------------------------------------------------------------------ boot --

function setupNative() {
  document.documentElement.classList.add('native');
  // Tapping a notification opens the matching order.
  LocalNotifications.addListener('localNotificationActionPerformed', async (e) => {
    const id = e.notification?.extra?.orderId;
    await checkArrivals();
    render();
    if (id && state.orders.some((o) => o.id === id)) openSheet({ kind: 'order', id });
  });
  // Android back button: close sheet → back to first tab → minimise.
  App.addListener('backButton', () => {
    if (state.vizOpen) closeViz();
    else if (state.sheet) closeSheet();
    else if (state.tab === 'settings') { state.tab = 'profile'; render(); }
    else if (state.tab !== 'orders') { state.tab = 'orders'; render(); }
    else App.minimizeApp();
  });
  App.addListener('resume', () => checkArrivals().then(render));
}

// Android Chrome offers its own install prompt – keep it for our button.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  state.installPrompt = e;
  if (state.tab === 'orders') render();
});

// (Re)load everything that isn't an order from the local DB.
async function loadState() {
  state.settings = { ...DEFAULT_SETTINGS, ...((await db.get('settings')) || {}) };
  state.settings.types = { ...DEFAULT_SETTINGS.types, ...state.settings.types };
  state.profile = { ...DEFAULT_PROFILE, ...((await db.get('profile')) || {}) };
  state.sessions = (await db.get('sessions')) || [];
  state.career = { stats: {}, claimed: [], ...((await db.get('career')) || {}) };
  state.recapSeen = await db.get('recapSeen');
}

async function boot() {
  requestPersistence();
  state.settings = { ...DEFAULT_SETTINGS, ...((await db.get('settings')) || {}) };
  state.settings.types = { ...DEFAULT_SETTINGS.types, ...state.settings.types };
  state.orders = await db.allOrders();
  // v4: more specific genre names ("Trap" → "Atlanta Trap" …) – move saved weights and old orders first.
  const savedWeights = { ...(state.settings.genreWeights || {}) };
  for (const [from, to] of Object.entries(GENRE_RENAMES)) {
    if (from in savedWeights) { savedWeights[to] ??= savedWeights[from]; delete savedWeights[from]; }
  }
  for (const o of state.orders) if (GENRE_RENAMES[o.genre]) { o.genre = GENRE_RENAMES[o.genre]; await db.putOrder(o); }
  const pend = await db.get('pendingOrder');
  if (pend && GENRE_RENAMES[pend.genre]) { pend.genre = GENRE_RENAMES[pend.genre]; await db.set('pendingOrder', pend); }
  // New genres get their defaults; old on/off genre list is folded in once.
  const oldGenres = state.settings.genres;
  state.settings.genreWeights = { ...DEFAULT_GENRE_WEIGHTS, ...savedWeights };
  // New taste profile (from your Spotify stats) → apply the new defaults once.
  if ((state.settings.tasteVersion || 0) < 2) state.settings.genreWeights = { ...DEFAULT_GENRE_WEIGHTS };
  if ((state.settings.tasteVersion || 0) < TASTE_VERSION) {
    // v3: new genres (trap family, dancehall, FR/ES) – keep your own tweaks, add the rest.
    state.settings.genreWeights = { ...DEFAULT_GENRE_WEIGHTS, ...state.settings.genreWeights };
    state.settings.genreWeights.Dancehall = Math.max(2, state.settings.genreWeights.Dancehall ?? 0);
    state.settings.tasteVersion = TASTE_VERSION;
    await saveSettings();
  }
  if (Array.isArray(oldGenres)) {
    for (const g of oldGenres) state.settings.genreWeights[g] = Math.max(2, state.settings.genreWeights[g] ?? 0);
    delete state.settings.genres;
    await saveSettings();
  }
  state.orders = await db.allOrders();
  state.hideInstallHint = await db.get('hideInstallHint');
  state.sessions = (await db.get('sessions')) || [];
  state.activeSession = (await db.get('activeSession')) || null;
  state.recapSeen = await db.get('recapSeen');
  state.career = { stats: {}, claimed: [], ...((await db.get('career')) || {}) };
  state.profile = { ...DEFAULT_PROFILE, ...((await db.get('profile')) || {}) };
  const pfp = await db.getFile('pfp');
  if (pfp) state.pfpUrl = URL.createObjectURL(pfp.blob);
  state.lastSync = await db.get('lastSync');
  state.lastBackupAt = await db.get('lastBackupAt');
  state.cloudConfigured = await cloud.configured();

  // First launch: welcome order so the app isn't empty.
  if (!(await db.get('welcomed'))) {
    await db.set('welcomed', true);
    await saveOrder(generateOrder(state.settings, { type: 'instrumental', ...genOpts() }), { silent: true });
    // Android app: ask once for notification permission right away.
    if (isNative && (await requestNotificationPermission())) {
      state.settings.notifications = true;
      await saveSettings();
    }
  }

  await checkArrivals();
  updateBadge();
  render();
  renderSessionBar();
  claimQuests();

  const params = new URLSearchParams(location.search);
  if (params.get('order')) {
    openSheet({ kind: 'order', id: params.get('order') });
    history.replaceState(null, '', location.pathname);
  }

  if (isNative) { setupNative(); App.getInfo().then((i) => { state.appVersion = i.version; }).catch(() => {}); }
  else if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('sw', e));
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.type === 'open-order' && e.data.id) openSheet({ kind: 'order', id: e.data.id });
    });
  }

  // Re-check for new orders every minute and whenever the app comes back.
  // Skip re-rendering while the user is typing so inputs don't lose focus.
  const typing = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
  setInterval(() => checkArrivals().then(() => { if (!typing()) render(); }), 60_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkArrivals().then(() => { if (!typing()) render(); });
      syncSoon();
    }
  });

  if (state.cloudConfigured) {
    try {
      state.cloudUser = await cloud.user();
      if (state.cloudUser) runSync(true);
    } catch (e) {
      console.warn('cloud', e);
    }
  }
}

boot();
