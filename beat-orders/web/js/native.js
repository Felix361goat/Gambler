// Bridge to the Android app (Capacitor). In the browser everything here is a
// no-op and isNative is false, so the web/PWA version keeps working unchanged.

const C = window.Capacitor;
export const isNative = Boolean(C?.isNativePlatform?.());

const plugin = (name) => (isNative ? C.registerPlugin(name) : null);
export const LocalNotifications = plugin('LocalNotifications');
export const App = plugin('App');
export const Filesystem = plugin('Filesystem');
export const Share = plugin('Share');

// Stable positive int id per string (notification ids must be 32-bit ints).
export function notifId(str) {
  let h = 7;
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return (Math.abs(h) % 2_000_000_000) + 10;
}

export async function requestNotificationPermission() {
  if (!isNative) return false;
  const res = await LocalNotifications.requestPermissions();
  return res.display === 'granted';
}

// Replace every scheduled notification with `list`
// ({ id, title, body, at, extra }).
export async function scheduleAll(list) {
  if (!isNative) return;
  const { notifications } = await LocalNotifications.getPending();
  if (notifications.length) await LocalNotifications.cancel({ notifications: notifications.map((n) => ({ id: n.id })) });
  const now = Date.now();
  const upcoming = list.filter((n) => n.at > now + 5000);
  if (!upcoming.length) return;
  await LocalNotifications.schedule({
    notifications: upcoming.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      largeBody: n.body,
      schedule: { at: new Date(n.at), allowWhileIdle: true },
      smallIcon: 'ic_stat_orders',
      extra: n.extra || {},
    })),
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

// Share a file through Android's share sheet (WhatsApp, Drive, Mail …).
export async function shareBlob(blob, name, title) {
  const safe = name.replace(/[^\w.\- ]+/g, '_');
  const { uri } = await Filesystem.writeFile({
    path: safe,
    data: await blobToBase64(blob),
    directory: 'CACHE',
  });
  await Share.share({ title, files: [uri] });
}
