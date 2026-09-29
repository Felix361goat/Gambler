// Optional cloud storage via Supabase (free tier is enough).
// Orders are stored as JSON rows in the "orders" table, audio files in the
// private "beats" storage bucket. See supabase/schema.sql for the setup.
//
// Local IndexedDB stays the source the UI reads from; sync() merges both
// sides with "newest updatedAt wins".

import { db, STATE_KEYS } from './db.js';

const MAX_UPLOAD = 50 * 1024 * 1024;

let client = null;
let cfgKey = '';

async function getClient() {
  const cfg = (await db.get('cloud')) || {};
  if (!cfg.url || !cfg.anonKey) return null;
  const key = cfg.url + '|' + cfg.anonKey;
  if (client && key === cfgKey) return client;
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  client = createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'beat-orders-auth' },
  });
  cfgKey = key;
  return client;
}

export const cloud = {
  async configured() {
    const cfg = (await db.get('cloud')) || {};
    return Boolean(cfg.url && cfg.anonKey);
  },

  async saveConfig(url, anonKey) {
    await db.set('cloud', { url: url.trim().replace(/\/$/, ''), anonKey: anonKey.trim() });
    client = null;
  },

  async user() {
    const c = await getClient();
    if (!c) return null;
    const { data } = await c.auth.getSession();
    return data.session?.user ?? null;
  },

  async signIn(email, password) {
    const c = await getClient();
    if (!c) throw new Error('Cloud ist nicht konfiguriert.');
    let { error } = await c.auth.signInWithPassword({ email, password });
    if (error && /invalid login/i.test(error.message)) {
      // First time: create the account.
      const res = await c.auth.signUp({ email, password });
      if (res.error) throw res.error;
      if (!res.data.session) throw new Error('Konto erstellt – bitte E-Mail bestätigen und dann erneut anmelden.');
      return res.data.user;
    }
    if (error) throw error;
    return (await c.auth.getUser()).data.user;
  },

  async signOut() {
    const c = await getClient();
    if (c) await c.auth.signOut();
  },

  // Full two-way sync. Returns { pulled, pushed, uploaded, skipped }.
  async sync() {
    const c = await getClient();
    const user = await this.user();
    if (!c || !user) throw new Error('Nicht angemeldet.');

    const { data: rows, error } = await c.from('orders').select('id, data, updated_at');
    if (error) throw error;
    // Special row "__state" = profile, career, sessions, settings …
    const stateRow = rows.find((r) => r.id === '__state');
    const remote = new Map(rows.filter((r) => r.id !== '__state').map((r) => [r.id, r.data]));
    const local = new Map((await db.allOrders()).map((o) => [o.id, o]));
    let pulled = 0, pushed = 0, uploaded = 0, skipped = 0;

    // Remote → local
    for (const [id, r] of remote) {
      const l = local.get(id);
      if (!l || (r.updatedAt || 0) > (l.updatedAt || 0)) {
        await db.putOrder(r);
        local.set(id, r);
        pulled++;
      }
    }

    // Local → remote (upload missing files first so paths are stored)
    for (const [id, o] of local) {
      let changed = false;
      for (const sub of o.submissions || []) {
        if (sub.remotePath) continue;
        const f = await db.getFile(sub.fileId);
        if (!f) continue;
        // Supabase free tier: max 50 MB per file (long videos) → keep local only.
        if (f.blob.size > MAX_UPLOAD) { skipped++; continue; }
        const path = `${user.id}/${sub.fileId}`;
        const up = await c.storage.from('beats').upload(path, f.blob, {
          upsert: true, contentType: f.blob.type || 'application/octet-stream',
        });
        if (up.error) { console.warn('upload', sub.name, up.error); skipped++; continue; }
        sub.remotePath = path;
        changed = true;
        uploaded++;
      }
      if (changed) {
        o.updatedAt = Date.now();
        await db.putOrder(o);
      }
      const r = remote.get(id);
      if (changed || !r || (o.updatedAt || 0) > (r.updatedAt || 0)) {
        const { error: e } = await c.from('orders').upsert({
          id, user_id: user.id, data: o, updated_at: new Date(o.updatedAt || Date.now()).toISOString(),
        });
        if (e) throw e;
        pushed++;
      }
    }

    // State: newest side wins.
    let stateChanged = false;
    const localAt = (await db.get('stateUpdatedAt')) || 0;
    const remoteAt = stateRow?.data?.updatedAt || 0;
    // First sync on this device (new phone / reinstall): the cloud copy wins,
    // otherwise a fresh, empty profile would overwrite your coins & career.
    const firstSync = !(await db.get('lastSync'));
    if (stateRow && (firstSync || remoteAt > localAt)) {
      for (const k of STATE_KEYS) if (k in stateRow.data.kv) await db.set(k, stateRow.data.kv[k], { touch: false });
      await db.set('stateUpdatedAt', Math.max(remoteAt, localAt), { touch: false });
      stateChanged = true;
    } else if (localAt > remoteAt) {
      const kv = {};
      for (const k of STATE_KEYS) kv[k] = await db.get(k);
      const { error: e } = await c.from('orders').upsert({ id: '__state', user_id: user.id, data: { updatedAt: localAt, kv }, updated_at: new Date(localAt).toISOString() });
      if (e) throw e;
    }

    await db.set('lastSync', Date.now());
    return { pulled, pushed, uploaded, skipped, stateChanged };
  },

  // Fetch a file that only exists in the cloud and cache it locally.
  async download(sub) {
    const c = await getClient();
    if (!c || !sub.remotePath) return null;
    const { data, error } = await c.storage.from('beats').download(sub.remotePath);
    if (error) throw error;
    await db.putFile(sub.fileId, data);
    return data;
  },

  async removeFile(sub) {
    const c = await getClient();
    if (c && sub.remotePath) await c.storage.from('beats').remove([sub.remotePath]);
  },
};
