# 🎧 Beat Orders

Eine iPhone-App (als installierbare Web-App/PWA), die dir **realistische Aufträge**
für Beats, Songs, Vocal Chains, Hooks und Remixe schickt, damit du regelmäßig in
FL Studio übst. Du lädst deine Exporte hoch, gibst ab, bekommst Feedback vom
„Kunden“ und hast eine **Bibliothek mit allem, was du je gemacht hast**.

Die App funktioniert auch als normale Website, am Handy, Laptop und Tablet.

## Features (Grundgerüst)

| Bereich | Was geht |
|---|---|
| **Aufträge** | Kommen automatisch rein, nur in deiner Freizeit (werktags abends, optional am Wochenende). Anzahl pro Woche und max. gleichzeitige Aufträge sind einstellbar. Jede Anfrage hat Kunde, Brief (im iMessage-Look), Genre, BPM, Tonart, Vibe, Instrumente, Budget und Deadline. |
| **Arten** | Instrumental, Full Song, Vocal Chain, Hook/Feature, Remix/Flip, dazu **eigene Projekte** ohne Auftrag. Häufigkeit pro Art einstellbar. |
| **Upload** | Mehrere Versionen pro Auftrag (v1, v2 …), z. B. MP3/WAV aus FL Studio. Für Vocal Chains gehen auch Presets/beliebige Dateien. |
| **Abgabe** | Eine Version abgeben. Der Kunde antwortet mit Feedback und Sternen, pünktlich oder zu spät zählt. |
| **Bibliothek** | Alle Uploads nach Monat gruppiert, filterbar nach Art und Genre, mit Suche und Stats (abgegeben, Pünktlichkeit, Uploads). |
| **Player** | Mini-Player im Apple-Music-Stil, Steuerung auf dem Sperrbildschirm (Media Session), Teilen über das iOS-Share-Sheet. |
| **iPhone** | Liquid-Glass-Design, Dark Mode, Home-Bildschirm-Icon, Vollbild, Mitteilungen bei neuen Aufträgen, App-Badge mit neuen Aufträgen, offline nutzbar. |
| **Speicher** | Lokal auf dem Gerät (IndexedDB) **plus optional in der Cloud** (Supabase), damit nichts verloren geht und alles auf mehreren Geräten da ist. |
| **Backup** | Export/Import als JSON. |

## 1. Online stellen

Die App besteht nur aus statischen Dateien, ohne Build-Schritt. Wichtig ist nur **HTTPS**.
iOS erlaubt Installation und Mitteilungen nur über HTTPS.

**Am einfachsten: Netlify Drop**
1. <https://app.netlify.com/drop> öffnen.
2. Den Ordner `beat-orders/` hineinziehen.
3. Du bekommst sofort eine `https://…netlify.app`-Adresse.

**Oder GitHub Pages / Vercel / Cloudflare Pages:** den Ordner `beat-orders/` als
Root veröffentlichen.

**Lokal testen:**
```bash
cd beat-orders
python3 -m http.server 8080
# → http://localhost:8080
```

## 2. Aufs iPhone installieren

1. Die Adresse in **Safari** öffnen.
2. **Teilen** → **Zum Home-Bildschirm** antippen.
3. Die App vom Home-Bildschirm öffnen, dann **Einstellungen → Mitteilungen** einschalten.

> Mitteilungen im Web gehen auf dem iPhone ab iOS 16.4, und nur, wenn die App
> über „Zum Home-Bildschirm“ installiert ist.

## 3. Cloud-Speicher einrichten (optional, empfohlen)

Supabase ist kostenlos (500 MB Datenbank, 1 GB Dateien, max. 50 MB pro Datei).

1. Bei <https://supabase.com> ein Konto und ein neues Projekt anlegen.
2. **SQL Editor** öffnen, den Inhalt von [`supabase/schema.sql`](supabase/schema.sql) einfügen und **Run** drücken.
   Das legt die Tabelle `orders` und den privaten Speicher-Bucket `beats` an, jeweils nur für dich lesbar.
3. **Project Settings → API**: die **Project URL** und den **anon public key** kopieren.
4. In der App: **Einstellungen → Cloud-Speicher**, beide Werte eintragen, dann **Verbinden**.
5. Mit E-Mail und Passwort anmelden. Beim ersten Mal wird das Konto angelegt.
   Falls Supabase eine Bestätigungs-E-Mail schickt: bestätigen und nochmal anmelden.
   Das lässt sich unter *Authentication → Providers → Email → Confirm email* auch abschalten.

Danach synchronisiert die App automatisch nach jeder Änderung und beim Öffnen.
Auf einem zweiten Gerät einfach dieselben Daten eintragen und anmelden.

**Tipp:** Aus FL Studio als **MP3 (320 kbps)** exportieren. WAVs werden schnell größer als 50 MB.

## Aufbau

```
beat-orders/
├── index.html            App-Hülle (Tab-Bar, Sheet, Mini-Player)
├── manifest.webmanifest  PWA-Infos (Name, Icon, Vollbild)
├── sw.js                 Service Worker: Offline-Cache, Mitteilungen, vorbereitet für Push
├── css/app.css           iOS/Liquid-Glass-Design, Light und Dark Mode
├── js/app.js             UI, Aktionen, Player, Uploads
├── js/generator.js       Auftrags-Generator: Genres, Instrumente, Kunden, Texte, Zeitplan
├── js/db.js              Lokale Datenbank (IndexedDB)
├── js/cloud.js           Supabase-Sync (Aufträge und Dateien)
├── icons/                App-Icons
└── supabase/schema.sql   Cloud-Setup
```

**Deine Musik anpassen:** Genres (BPM-Bereiche, Tonarten, Instrumente), Kundennamen
und Auftragstexte stehen als einfache Listen oben in `js/generator.js`.

## Bekannte Grenzen und nächste Schritte

- **Mitteilungen bei geschlossener App:** Aktuell prüft die App beim Öffnen (und
  jede Minute, solange sie offen ist), ob ein neuer Auftrag fällig ist, und meldet
  ihn dann. Für echte Push-Nachrichten bei komplett geschlossener App braucht es
  einen kleinen Server-Job, z. B. eine Supabase Edge Function mit Cron und Web Push.
  `sw.js` hat den `push`-Handler dafür schon eingebaut.
- **Native App (App Store / TestFlight):** Die PWA lässt sich später mit Capacitor
  als echte iOS-App verpacken. Dafür braucht es einen Mac mit Xcode und einen
  Apple-Developer-Account.
- **Als Nächstes:** deine Genres, Instrumente und Vorlieben, Schwierigkeitsstufen,
  Auftrags-Serien (z. B. „Beat-Tape mit 5 Tracks“), Streaks und Level, Waveform-Ansicht.
