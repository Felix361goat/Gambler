# Beat Orders – notes for Claude

Vanilla-JS PWA in `web/` (no build step), wrapped as an Android app with
Capacitor (`android/`). The APK is built by `.github/workflows/beat-orders-apk.yml`
on every push to `claude/beat-orders-app-ios-b9v6z0` and published as the
release `beat-orders-latest` (download: `.../releases/download/beat-orders-latest/beat-orders.apk`).
The user talks German; app texts are German.

## 📬 Sending the user a task (no app update needed)

When the user says something like "schick mir als Task …" / "gib mir in der App
die Aufgabe …", add it to the task inbox – the app fetches
`inbox/tasks.json` from this branch (raw.githubusercontent.com) and turns new
entries into orders:

```sh
cd beat-orders
TASK_CODE="<the user's task code>" node tools/send-task.mjs \
  --title "Kurzer Titel" \
  --brief "Was genau zu tun ist (Deutsch, konkret, motivierend; \n = neue Zeile)" \
  [--genre "UK Afroswing"] [--effort 3] [--days 5]
git add inbox/tasks.json && git commit -m "Inbox: <title>" && git push -u origin claude/beat-orders-app-ios-b9v6z0
```

- Tasks are encrypted with the user's task code (the repo is public). The code
  is **never** written to the repo, code or commit messages. If the user didn't
  give it in the conversation, ask for it.
- `--effort` = hours of work (deadline follows their weekly free time),
  `--days` = fixed deadline instead. `--genre` should be a key of `GENRES`
  in `web/js/genres.js` (then the order shows the genre guide + references).
- **Before sending tasks for the next days, always ask where the user is:**
  Schwechat (has a mic → vocals/songs/hooks OK) or Perchtoldsdorf (no mic →
  only beats, mixing, sound design, writing lyrics; no recording). Plan the
  tasks accordingly. The app asks the same question itself (📍 card).
- Make the brief actionable: what to make, 1–2 concrete constraints, a reference.
- Only the inbox file changes → pushing it still triggers an APK build; that's fine.
- The app checks on start, when it comes back to the foreground and every ~5 min
  (the raw CDN can take up to ~5 min to show a new commit).

## Checks before pushing code changes

- `node --check web/js/*.js`
- Serve `web/` (`python3 -m http.server 8765`) and drive it with Playwright (Pixel 7 emulation).
- Bump `CACHE` in `web/sw.js` when shell files change.
- Data lives in IndexedDB on the phone: never change ids/keys without a migration in `boot()`.
- Android: `@capacitor/core` is **not** bundled (no build step), so
  `window.Capacitor.registerPlugin` does not exist on the device – plugins are
  reached via `Capacitor.nativePromise`/`addListener` (see `web/js/native.js`).
  Native Playwright mocks must mirror that (no `registerPlugin`), otherwise
  they hide device-only crashes.
