// Tiny IndexedDB wrapper. Stores:
//   orders – one record per order (keyPath "id")
//   files  – uploaded audio / preset blobs (keyPath "id")
//   kv     – settings and misc. key/value pairs

const DB_NAME = 'beat-orders';
const DB_VERSION = 1;

let dbPromise;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('orders')) db.createObjectStore('orders', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const result = fn(s);
    t.oncomplete = () => resolve(result && 'result' in result ? result.result : result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const db = {
  allOrders: () => tx('orders', 'readonly', (s) => s.getAll()),
  getOrder: (id) => tx('orders', 'readonly', (s) => s.get(id)),
  putOrder: (order) => tx('orders', 'readwrite', (s) => s.put(order)),
  deleteOrder: (id) => tx('orders', 'readwrite', (s) => s.delete(id)),

  getFile: (id) => tx('files', 'readonly', (s) => s.get(id)),
  putFile: (id, blob) => tx('files', 'readwrite', (s) => s.put({ id, blob })),
  deleteFile: (id) => tx('files', 'readwrite', (s) => s.delete(id)),

  get: (key) => tx('kv', 'readonly', (s) => s.get(key)),
  set: (key, value) => tx('kv', 'readwrite', (s) => s.put(value, key)),

  async clearAll() {
    await tx('orders', 'readwrite', (s) => s.clear());
    await tx('files', 'readwrite', (s) => s.clear());
    await tx('kv', 'readwrite', (s) => s.clear());
  },
};

// Ask the browser not to evict our data (important for audio on iOS).
export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist();
  } catch {}
  return false;
}
