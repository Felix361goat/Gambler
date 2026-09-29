// 📬 Task inbox: ideas you tell Claude in chat land in the app without an
// app update. Claude adds them to beat-orders/inbox/tasks.json in the GitHub
// repo; the app fetches that file and turns new entries into orders.
//
// The repo is public, so every task is encrypted (AES-GCM, key from your
// personal task code via PBKDF2). The code is only typed into the app and
// told to Claude – it is never stored in the repo.
//
// Shared by the app and tools/send-task.mjs (Node 20+ has WebCrypto too).

export const INBOX_URL = 'https://raw.githubusercontent.com/Felix361goat/Gambler/claude/beat-orders-app-ios-b9v6z0/beat-orders/inbox/tasks.json';

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

// Forgiving: "Baba Jabba Hase 123" = "babajabbahase123".
export const normalizeCode = (code) => String(code || '').toLowerCase().replace(/[^a-z0-9äöüß]/g, '');

async function keyFor(code) {
  const base = await crypto.subtle.importKey('raw', enc.encode(normalizeCode(code)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('beat-orders-inbox-v1'), iterations: 150000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}

export async function encryptTask(task, code) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFor(code), enc.encode(JSON.stringify(task))));
  return `${b64(iv)}.${b64(data)}`;
}

// → task object, or null if the code is wrong.
export async function decryptTask(payload, code) {
  try {
    const [iv, data] = payload.split('.').map(unb64);
    return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await keyFor(code), data)));
  } catch {
    return null;
  }
}

// Fetch the inbox → [{ id, at, task | null }] (task null = can't decrypt).
export async function fetchInbox(code, url = INBOX_URL) {
  const res = await fetch(`${url}?t=${Math.floor(Date.now() / 60000)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Postfach nicht erreichbar (${res.status})`);
  const { tasks = [] } = await res.json();
  const out = [];
  for (const t of tasks) out.push({ id: t.id, at: t.at, task: t.enc ? (code ? await decryptTask(t.enc, code) : null) : t });
  return out;
}
