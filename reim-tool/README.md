# 🎤 Reim-Tool — Afroswing Edition

Lokales Reim-Tool für UK Afroswing / J Hus Style. Deutsch-englisches
Code-Switching, moderner Slang, keine kitschigen Reime. Alle Vorschläge
werden **live über die Claude API generiert** (Modell `claude-sonnet-4-6`) —
es gibt keine feste Reim-Datenbank, deshalb kommen bei derselben Eingabe
immer wieder neue Vorschläge.

## Ordnerstruktur

```
reim-tool/
├── server.js          ← Backend (Node.js + Express): nimmt deine Eingabe,
│                         fragt die Claude API, gibt JSON zurück
├── stylePrompt.js     ← DER STYLE-PROMPT. Hier tunst du den Vibe!
│                         Eigene Lines als Beispiele reinwerfen lohnt sich.
├── package.json       ← Liste der benötigten Pakete
├── .env.example       ← Vorlage für deine .env (Key-Datei)
├── .env               ← legst DU an, enthält deinen API-Key (bleibt lokal!)
└── public/            ← Frontend (läuft im Browser)
    ├── index.html     ← Aufbau der Seite
    ├── style.css      ← dunkles Studio-Design
    └── app.js         ← Logik: Anfrage schicken, Karten rendern
```

## Starten (3 Schritte)

Du brauchst einmalig [Node.js](https://nodejs.org) (LTS-Version reicht).

**1. Pakete installieren** (nur beim ersten Mal):

```bash
cd reim-tool
npm install
```

**2. API-Key hinterlegen:**

Kopiere `.env.example` zu `.env` und trag deinen Key ein:

```bash
cp .env.example .env
```

Dann `.env` mit einem Editor öffnen und `sk-ant-dein-key-hier` durch
deinen echten Key ersetzen (gibt's auf https://platform.claude.com unter
API Keys). Die `.env` bleibt lokal — sie steht in der `.gitignore` und
landet nie auf GitHub.

**3. Loslegen:**

```bash
npm start
```

Dann im Browser öffnen: **http://localhost:3000**

Beenden mit `Strg+C` im Terminal.

## Bedienung

- Oben Wort, Phrase oder ganze Line eingeben (Enter oder „Reime holen“)
- Mit den runden Buttons Kategorien an-/abwählen
- **↻ Nochmal** holt bei gleicher Eingabe komplett neue Vorschläge

## Warum kommen immer neue Vorschläge?

Drei Dinge kombiniert:

1. **Keine lokale Wortliste** — jede Anfrage geht live an die Claude API
2. **`temperature: 0.9`** — hohe Kreativität/Varianz im Modell
3. **Frische-Anweisung im Prompt** — Claude wird explizit angewiesen,
   die naheliegendsten Reime zu überspringen (plus eine Zufalls-Session-ID
   pro Anfrage, damit identische Eingaben nicht identisch behandelt werden)

## Style-Prompt tunen

Öffne `stylePrompt.js` — da steht alles drin, was Claude über deinen
Stil weiß. Der größte Hebel: **wirf 2–4 deiner eigenen Lines als
Beispiele rein** (der Platz dafür ist unten in der Datei markiert).
Nach Änderungen den Server neu starten (`Strg+C`, dann `npm start`).

## Kosten

Jede Anfrage kostet ein paar Cent-Bruchteile (Sonnet 4.6:
3 $/Mio. Input-Tokens, 15 $/Mio. Output-Tokens — eine typische
Anfrage liegt grob bei ~0,02–0,05 $). Für eine Schreibsession
völlig im Rahmen.
