# 🎧 Beat Orders

Eine Handy-App für Android und iPhone, die dir **realistische Aufträge**
für Beats, Songs, Vocal Chains, Hooks und Remixe schickt, damit du regelmäßig in
FL Studio übst. Du lädst deine Exporte hoch, gibst ab, bekommst Feedback vom
„Kunden“ und hast eine **Bibliothek mit allem, was du je gemacht hast**.

Es gibt sie in drei Varianten mit demselben Code:

- **Android-App (APK)**, z. B. für das Nothing Phone 2a. Mitteilungen kommen auch bei geschlossener App.
- **Installierbare Web-App** auf Android (Chrome) und iPhone (Safari).
- **Normale Website** am Laptop.

## 📱 Android-App installieren (Nothing Phone & Co.)

### Weg A: Fertige APK von GitHub (ohne Android Studio)
Bei jedem Push baut GitHub die APK automatisch (`.github/workflows/beat-orders-apk.yml`).

1. Auf dem Handy im GitHub-Repo **Releases → „Beat Orders (neueste Version)“** öffnen.
2. `beat-orders.apk` herunterladen und öffnen.
3. Android fragt einmalig, ob der Browser/Dateimanager **Apps installieren** darf. Erlauben.
4. App öffnen und **Mitteilungen erlauben**.

Updates installierst du genauso: neue APK öffnen, **„Aktualisieren“** wählen. Deine Daten bleiben erhalten,
weil jede Version mit demselben Schlüssel signiert ist (`android/app/beat-orders-debug.keystore`).

### Weg B: Mit Android Studio
```bash
cd beat-orders
npm install
npx cap sync android     # kopiert web/ ins Android-Projekt
npx cap open android     # öffnet Android Studio
```
Handy per USB anschließen (Entwickleroptionen + **USB-Debugging** an) und in Android Studio auf **▶ Run** drücken.

> Nach jeder Änderung in `web/` erneut `npx cap sync android` ausführen.

## Features (Grundgerüst)

| Bereich | Was geht |
|---|---|
| **Aufträge** | Kommen automatisch rein, nur in deiner Freizeit (werktags abends, optional am Wochenende). Anzahl pro Woche und max. gleichzeitige Aufträge sind einstellbar. Jede Anfrage hat Kunde, Brief (im iMessage-Look), Genre, BPM, Tonart, Vibe, Instrumente, Budget und Deadline. |
| **Arten** | Instrumental, Full Song, Vocal Chain, Hook/Feature, Remix/Flip, dazu **eigene Projekte** ohne Auftrag. Häufigkeit pro Art einstellbar. |
| **Upload** | Mehrere Versionen pro Auftrag (v1, v2 …), z. B. MP3/WAV aus FL Studio. Für Vocal Chains gehen auch Presets/beliebige Dateien. |
| **Abgabe** | Eine Version abgeben. Der Kunde antwortet mit Feedback und Sternen, pünktlich oder zu spät zählt. |
| **Nochmal anhören** | Am **Tag nach der Abgabe** wird die Bewertung freigeschaltet (mit Erinnerung am Abend). Du musst den Track erst (fast) ganz anhören (vorspulen zählt nicht), dann bewertest du ihn ehrlich von **1 bis 10**. |
| **Beat → Song → Video** | **Beat ab 8/10 → 🎙️ Vocal-Auftrag** auf deinem eigenen Beat. Jeder Vocal-Auftrag bekommt ein **Thema passend zum Genre** (Liebe, Geld & Hustle, Lebensgeschichte, Straße, Party, Motivation, Storytelling, Reflexion, Fun) plus Perspektive, Pflicht-Wort, Einstiegszeile und Gefühl. Thema und Konzept lassen sich neu würfeln. **Song ab 9/10 → 🎬 Video-Auftrag.** Beide Schwellen sind einstellbar. |
| **Kunden-Profil & Lyrics** | Tipp auf das Profilbild eines Kunden (im Auftrag oder in der Kundenkartei), dann siehst du seinen Steckbrief mit Spruch, Fakten, Lieblings-Genres und eurer gemeinsamen Historie. Song-Aufträge haben einen **Lyrics-Block** mit Struktur-Knopf ([Hook]/[Part]) und Live-Zähler für Zeilen, Bars und Wörter. |
| **Genres** | 30 Genres mit **Häufigkeit statt An/Aus**, abgestimmt auf deine Spotify-Stats: UK Afroswing (sehr oft), UK Rap, Afrobeats (oft), Afro-Dancehall, UK R&B, UK Drill, Amapiano, Detroit, Jerk (ab und zu), weitere US-Sounds und House/Indie (selten). „Selten“ ist dabei etwa 1/16 von „sehr oft“. Jeder Auftrag nennt **🎧 Referenz-Artists** (bei deinen Genres deine Favoriten wie J Hus, Skeete, Nines, Kojo Funds, NSG, Tera Kòrá, 8synatra, Skillibeng). Vocal-Aufträge nennen eine **Vibe-Referenz**. 5 Experten: Detroit, UK Drill, UK Rap, UK Afroswing, Jerk. |
| **Motivation** | **Session-Timer** (Studio-Stunden, XP, oben laufende Uhr), **3 Wochen-Quests** pro Woche (automatisch erkannt, bringen Coins), **Wochenrückblick** am Montag, **Titel** nach Level (Bedroom-Producer → Legende), **FL-Studio-Tipp des Tages**, gelegentliche **⚡ Eil-Aufträge** (2 Tage, pünktlich = doppelte Coins) und auf Android eine **Erinnerung, wenn deine freie Zeit beginnt**. |
| **Kunden** | **111 Kunden** in 13 Typen, jeder mit einzigartigem Namen (nur Rentner und Kinder heißen normal), gezeichnetem Profilbild, **eigenem Spruch**, **3 eigenen unnötigen Fakten** (333 verschiedene, z. B. „ich bin Shanice und ich hab einen fetten arsch 🍑“, „ich bin Burtram und ich mag Schildkröten“) und einer **Marotte** (Sprachnachricht-Hinweis, Haustier-Grüße, Hashtags, Spitzname, CAPS, Snack-Flecken …). Jeder hat **ungefähre Lieblings-Genres**. **⭐ Stammkunden** (gut abgeliefert) kommen öfter. Eine **Kundenkartei** sammelt, wen du schon bedient hast. Alles steht in `web/js/people.js`. |
| **🎖️ Experten** | Freischaltung, sobald du **ein Auto und eine Immobilie** besitzt, die zusammen ≥ 1.300 🪙 wert sind (ca. 2–3 Monate). 4 Experten wollen **immer genau ihren Sound** (Platzhalter: Detroit, UK Drill, 90s Boom Bap, Jersey Club, änderbar in `EXPERTS` in `web/js/customers.js`). Sie haben längere Deadlines und urteilen nach deiner ehrlichen Bewertung: **unter 8/10 → abgelehnt, überarbeiten**, ab 8 → akzeptiert (+150 🪙). Gold-Design mit Badge. |
| **💀 Ultra-Boss** | Freischaltung nach ~1 Jahr (330 Tage, 70 Abgaben, 1 Experte überzeugt). Er will einen **release-fertigen Song** (Beat, Vocals, Mix, Master), gibt dir 6 Wochen und akzeptiert erst ab 9/10. Belohnung: 1.500 🪙 und Trophäe. |
| **Wochenplan** | Pro Wochentag ein Zeitfenster, in dem du frei hast (Standard: Vollzeitjob, Training Mo/Di/Do, Match am Wochenende). Aufträge kommen, wenn deine freie Zeit anfängt. Die **Deadline wird aus deinen freien Stunden berechnet** (Aufwand × 2,5), und die App zeigt, wie viel deiner Freizeit eingeplant ist. |
| **Ablehnen** | Gefällt dir ein Auftrag nicht? „👎 anderen Auftrag“ gibt sofort einen neuen, so oft du willst. Abgelehnte Genres und Arten kommen danach seltener. Die Challenge lässt sich auch einzeln neu würfeln. |
| **Lernen** | Jeder Auftrag hat eine Lern-Challenge in einem von 13 Bereichen (Drums, Mixing, Sampling, Vocals … bis Mastering, Einspielen, Cover-Art, Release & Social). **📈 Aufbauen:** schwierigere Techniken dort, wo du laut deinen Bewertungen stark bist. **🧭 Neuland:** ein Bereich, den du noch nie gemacht hast. |
| **Profil & Shop** | Level, XP und Wochen-Serie. **Coins** gibt es für Abgaben, Pünktlichkeit, Challenges, gute Bewertungen und Trophäen. Im Shop kaufst du Profilbild-Rahmen (z. B. Regenbogen, Feuer, Neon), Banner, Objekte für **„Mein Studio“** und Autos für die **Garage** (Golf GTI → BMW M3 → G 63 → 911 → R8 → Lambo → McLaren → Ferrari → Bugatti) und **Immobilien** (WG-Zimmer → Altbau → Loft mit Studio → Haus → Villa Ibiza → Penthouse Dubai). Dazu kommen 13 Trophäen und eine Stärken/Schwächen-Übersicht. |
| **👑 Legendär** | Die **BBL Chaya als VIP-Managerin**: 20.000 🪙 **und** 150 Abgaben, also rund 3 Jahre konstant dranbleiben. Danach hypt sie dich im Profil und auf der Startseite. |
| **Bibliothek** | Alle Uploads nach Monat gruppiert, filterbar nach Art und Genre, mit Suche und Stats (abgegeben, Pünktlichkeit, Uploads). |
| **Player** | Mini-Player im Apple-Music-Stil, Steuerung auf dem Sperrbildschirm (Media Session), Teilen über das iOS-Share-Sheet. |
| **✨ Visualizer** | Wie der Visualizer in FL Studio: Tipp im Mini-Player aufs ✨, dann läuft Vollbild **„Alien Garden“**. Eine biolumineszente Blüte reagiert auf das Spektrum, Ranken wachsen mit den Mitten, Sporen explodieren auf jedem Kick, Glühwürmchen reagieren auf die Höhen. 5 Farbwelten (Alien, Aurora, Tiefsee, Dschungel, Lava-Orchidee). **⏺ Aufnehmen** speichert Bild und Ton als Video, das du teilen oder direkt an den Video-Auftrag des Songs hängen kannst. |
| **Handy** | Liquid-Glass-Design, Dark Mode, eigenes App-Icon, Vollbild, Mitteilungen bei neuen Aufträgen (Android-App: auch bei geschlossener App) plus Erinnerung am Abgabetag, Android-Zurück-Taste, offline nutzbar. |
| **Speicher** | Lokal auf dem Gerät (IndexedDB) **plus optional in der Cloud** (Supabase), damit nichts verloren geht und alles auf mehreren Geräten da ist. |
| **Backup** | Export/Import als JSON. |

## 🌐 Web-Version online stellen (optional)

Der Ordner `web/` besteht nur aus statischen Dateien, ohne Build-Schritt. Wichtig ist nur **HTTPS**.
Installation und Mitteilungen gehen nur über HTTPS.

**Am einfachsten: Netlify Drop**
1. <https://app.netlify.com/drop> öffnen.
2. Den Ordner `beat-orders/web/` hineinziehen.
3. Du bekommst sofort eine `https://…netlify.app`-Adresse.

**Oder GitHub Pages / Vercel / Cloudflare Pages:** den Ordner `beat-orders/web/` als
Root veröffentlichen.

**Lokal testen:**
```bash
cd beat-orders
npm run serve
# → http://localhost:8080
```

Installieren: auf Android in Chrome **⋮ → App installieren**, auf dem iPhone in Safari
**Teilen → Zum Home-Bildschirm** (Mitteilungen dort ab iOS 16.4).

## ☁️ Cloud-Speicher einrichten (optional, empfohlen)

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
Dateien über 50 MB (z. B. lange Videos) bleiben nur auf dem Handy und werden nicht in die Cloud geladen.

## Aufbau

```
beat-orders/
├── web/                    Die eigentliche App (HTML/CSS/JS, kein Build nötig)
│   ├── index.html          App-Hülle (Tab-Bar, Sheet, Mini-Player)
│   ├── manifest.webmanifest, sw.js   PWA: Icon, Vollbild, Offline, Mitteilungen
│   ├── css/app.css         Liquid-Glass-Design, Light und Dark Mode
│   └── js/
│       ├── app.js          UI, Aktionen, Player, Uploads
│       ├── generator.js    Auftrags-Generator: Genres, Challenges, Stärken, Zeitplan
│       ├── customers.js    Kunden-Typen, Experten, Boss, Schreibstile, Avatar-Zeichner
│       ├── people.js       Namen, Sprüche, Fakten und Lieblings-Genres aller Kunden
│       ├── themes.js       Song-Themen, Perspektiven, Pflicht-Wörter
│       ├── motivation.js   Titel, Tipps des Tages, Wochen-Quests
│       ├── visualizer.js   Audio-reaktiver Visualizer + Video-Aufnahme
│       ├── shop.js         Coins, Shop (Rahmen, Banner, Studio, Garage, Legendär), Trophäen
│       ├── native.js       Android-Brücke: Mitteilungen, Teilen, Zurück-Taste
│       ├── db.js           Lokale Datenbank (IndexedDB)
│       └── cloud.js        Supabase-Sync (Aufträge und Dateien)
├── android/                Android-Studio-Projekt (Capacitor)
├── capacitor.config.json   App-ID, Name, Mitteilungs-Icon
├── package.json
└── supabase/schema.sql     Cloud-Setup
```

**Deine Musik anpassen:** Genres (BPM-Bereiche, Tonarten, Instrumente), Kundennamen
und Auftragstexte stehen als einfache Listen oben in `web/js/generator.js`. Kunden und ihre Texte liegen in `web/js/customers.js`.

## Bekannte Grenzen und nächste Schritte

- **Mitteilungen bei geschlossener App:** In der Android-App wird der nächste Auftrag
  vorab geplant und als Mitteilung terminiert, das klappt also auch bei geschlossener App.
  In der Web-Version erscheint ein neuer Auftrag erst beim Öffnen der App.
  Für echte Push-Nachrichten im Web bräuchte es einen Server-Job
  (z. B. Supabase Edge Function mit Web Push), `sw.js` hat den `push`-Handler dafür schon.
- **Akku-Optimierung:** Manche Android-Hersteller verzögern geplante Mitteilungen.
  Falls sie zu spät kommen: *Einstellungen → Apps → Beat Orders → Akku → Nicht eingeschränkt*.
- **Als Nächstes:** deine Genres, Instrumente und Vorlieben, Schwierigkeitsstufen,
  Auftrags-Serien (z. B. „Beat-Tape mit 5 Tracks“), Streaks und Level, Waveform-Ansicht.
