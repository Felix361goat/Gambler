// Optional cloud storage via Supabase (free tier is enough).
// Orders are stored as JSON rows in the "orders" table, audio files in the
// private "beats" storage bucket. See supabase/schema.sql for the setup.
//
// Local IndexedDB stays the source the UI reads from; sync() merges both
// sides with "newest updatedAt wins".

import { db } from './db.js';

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

  // Full two-way sync. Returns { pulled, pushed, uploaded }.
  async sync() {
    const c = await getClient();
    const user = await this.user();
    if (!c || !user) throw new Error('Nicht angemeldet.');

    const { data: rows, error } = await c.from('orders').select('id, data, updated_at');
    if (error) throw error;
    const remote = new Map(rows.map((r) => [r.id, r.data]));
    const local = new Map((await db.allOrders()).map((o) => [o.id, o]));
    let pulled = 0, pushed = 0, uploaded = 0;

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
        const path = `${user.id}/${sub.fileId}`;
        const up = await c.storage.from('beats').upload(path, f.blob, {
          upsert: true, contentType: f.blob.type || 'application/octet-stream',
        });
        if (up.error) throw up.error;
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

    await db.set('lastSync', Date.now());
    return { pulled, pushed, uploaded };
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
