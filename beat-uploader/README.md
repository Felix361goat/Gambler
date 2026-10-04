# 🎵 Beat Uploader

Du legst eine MP3 rein, das Tool macht den Rest:

1. **Analysiert den Beat**: erkennt BPM und Tonart (Key) automatisch
2. **Erstellt Cover-Art**: YouTube-Thumbnail (1280×720), Video-Bild (1920×1080) und ein quadratisches Cover (3000×3000) für BeatStars/Instagram
3. **Rendert das Video**: Cover + Beat + animierte Waveform als MP4
4. **Schreibt Titel, Beschreibung und Tags** im bewährten Type-Beat-Format, z. B.
   `[FREE] Drake x Future Type Beat - "Midnight Rain" | Dark Trap Beat 2026`
5. **Lädt alles auf YouTube hoch**, mit Thumbnail und auf Wunsch geplant (z. B. 1 Beat pro Tag um 18 Uhr)

---

## 1. Installation (einmalig)

**Du brauchst:**
- **Python 3.10+**: https://www.python.org/downloads/ (bei Windows **„Add Python to PATH“** anhaken!)
- **FFmpeg**:
  - Windows: `winget install ffmpeg` (in der Eingabeaufforderung)
  - Mac: `brew install ffmpeg`

Dann im Ordner `beat-uploader`:

```bash
pip install -r requirements.txt
```

## 2. Deine Daten eintragen

Kopiere `config.example.json` → `config.json` und trag ein:

| Feld | Bedeutung |
|---|---|
| `producer_name` | dein Producer-Tag, z. B. `prod. Felix` |
| `default_artists` | Type-Beat-Artists, wenn im Dateinamen keiner steht |
| `default_genre` | `Trap`, `Drill`, `R&B`, `Boom Bap`, … |
| `links.buy` | dein BeatStars/Airbit-Shop (**wichtig, damit du Geld verdienst!**) |
| `links.email` / `links.instagram` | damit Artists dich für Placements erreichen |
| `license_text` | Free-for-profit/Non-Profit-Hinweis |
| `youtube.publish_hours_apart` | Abstand zwischen geplanten Uploads (Standard: 24 h) |
| `font` *(optional)* | Pfad zu einer eigenen .ttf-Schrift für die Cover |

## 3. YouTube verbinden (einmalig, ca. 10 Minuten)

1. Geh auf https://console.cloud.google.com/ → **Neues Projekt** anlegen (z. B. „Beat Uploader“)
2. **APIs & Dienste → Bibliothek** → „**YouTube Data API v3**“ suchen → **Aktivieren**
3. **APIs & Dienste → OAuth-Zustimmungsbildschirm** → Typ **Extern** → App-Name + deine E-Mail eintragen → unter **Testnutzer** deine eigene Google-Mail hinzufügen
4. **APIs & Dienste → Anmeldedaten → Anmeldedaten erstellen → OAuth-Client-ID** → Typ **Desktop-App**
5. JSON herunterladen, in **`client_secret.json`** umbenennen und in den Ordner `beat-uploader` legen

Beim ersten Upload öffnet sich der Browser: mit dem YouTube-Kanal einloggen und erlauben. Danach merkt sich das Tool den Login (`token.json`).

> ⚠️ **Wichtig, bitte lesen:**
> - **Videos bleiben erst mal „Privat“:** Google sperrt Uploads aus neuen, nicht geprüften API-Projekten auf *privat*. Damit sie öffentlich gehen, stellst du einmal kostenlos einen **Audit-Antrag** („YouTube API Services – Audit and Quota Extension Form“). Bis der durch ist: siehe Plan B unten.
> - **Thumbnails** gehen nur, wenn dein Kanal **verifiziert** ist (Telefonnummer: https://www.youtube.com/verify).
> - **Limit:** ca. **6 Uploads pro Tag** (API-Kontingent).
> - Solange die App im „Test“-Modus ist, läuft der Login nach 7 Tagen ab → einfach `token.json` löschen und neu einloggen.
>
> **Plan B (funktioniert sofort):** `python beat_uploader.py --no-upload` erstellt alles. Du lädst dann `video.mp4` + `thumbnail.jpg` in YouTube Studio hoch und kopierst Titel/Beschreibung/Tags aus `upload.txt`. Dauert ca. 1 Minute pro Beat.

## 4. Benutzen

**Einfachster Weg:** MP3s in den Ordner **`inbox/`** legen und starten:

```bash
python beat_uploader.py
```

(Windows: einfach **`start.bat`** doppelklicken.)

Alle Beats werden verarbeitet, hochgeladen und danach nach `done/` verschoben. Die erzeugten Dateien landen in `output/DATUM_beatname/`.

### Dateinamen = automatische Infos

Das Tool liest Titel, Artists, BPM und Key aus dem Dateinamen (was fehlt, wird erkannt):

| Dateiname | Ergebnis |
|---|---|
| `Midnight Rain - Drake x Future.mp3` | Titel *Midnight Rain*, Drake x Future Type Beat, BPM/Key automatisch |
| `Ice Cold - Lil Baby - 150 - F#min.mp3` | alles aus dem Namen |
| `lonely_92bpm_Am.mp3` | Titel *lonely*, 92 BPM, Am, Artists aus config |

### Optionen

```bash
python beat_uploader.py beat.mp3 --artist "Travis Scott, Don Toliver"
python beat_uploader.py --genre Drill --mood drill
python beat_uploader.py --schedule "2026-10-06 18:00"   # 1. Beat morgen 18 Uhr, danach alle 24 h
python beat_uploader.py --privacy unlisted
python beat_uploader.py --paid                           # ohne [FREE] im Titel
python beat_uploader.py --no-upload                      # nur Dateien erstellen
```

| Option | Beschreibung |
|---|---|
| `--artist` | Type-Beat-Artists (max. 3) |
| `--title` | Beat-Name |
| `--bpm`, `--key` | falls die automatische Erkennung danebenliegt |
| `--genre` | z. B. Trap, Drill, R&B |
| `--mood` | Farbstil: `dark`, `sad`, `hype`, `chill`, `love`, `drill`, `dreamy` (sonst automatisch: Moll + schnell = dark, Moll + langsam = sad …) |
| `--schedule` | geplante Veröffentlichung |
| `--paid` | kein „FREE“ |
| `--no-upload` | nicht hochladen |

### Eigene Hintergrundbilder

Leg Bilder (JPG/PNG) in den Ordner **`backgrounds/`**. Dann wird statt des generierten Farbverlaufs zufällig eins davon als Hintergrund genutzt (abgedunkelt, mit Text drauf). Gute Quellen für lizenzfreie Bilder: Unsplash, Pexels.

---

## 💡 Tipps, um mit Beats Geld zu verdienen & Placements zu bekommen

- **Regelmäßig hochladen**: 1 Beat pro Tag (`--schedule`) schlägt 7 Beats an einem Tag.
- **Die richtigen Artists taggen**: aktuelle, angesagte Artists, aber auch mittelgroße. Bei Drake-Type-Beats ist die Konkurrenz riesig, bei kleineren Artists rankst du leichter.
- **Shop verlinken**: BeatStars oder Airbit, der Link steht automatisch ganz oben in der Beschreibung.
- **„FREE for non-profit“** bringt Reichweite, Geld kommt über Lizenzen (MP3/WAV/Trackouts/Exclusive).
- **Placements** kommen selten durch YouTube allein: Schick Beats direkt an Artists/A&Rs (Instagram-DMs, E-Mail), baue Kontakte zu Engineers und anderen Producern auf, mach Collabs.
- **Verwende nur Samples, die du clearen darfst.** Sonst gibt's Copyright-Claims und keine Placements.
