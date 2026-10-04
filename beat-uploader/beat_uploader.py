#!/usr/bin/env python3
"""Beat Uploader: MP3 rein → Cover, Video, Titel, Beschreibung, Tags → YouTube.

Beispiele:
  python beat_uploader.py                          # alle Beats in inbox/ verarbeiten + hochladen
  python beat_uploader.py beat.mp3 --artist "Drake, Future"
  python beat_uploader.py --no-upload              # nur Dateien erzeugen, nichts hochladen
  python beat_uploader.py --schedule "2026-10-06 18:00"   # 1 Beat pro Tag ab diesem Zeitpunkt
"""
import argparse
import datetime
import json
import re
import shutil
import sys
from pathlib import Path

from beatup import analyze, cover, metadata, video

BASE = Path(__file__).resolve().parent
AUDIO_EXTS = {".mp3", ".wav", ".flac", ".m4a"}


def load_config():
    path = BASE / "config.json"
    if not path.exists():
        print("⚠ config.json fehlt – nutze config.example.json. Kopier sie und trag deine Daten ein!")
        path = BASE / "config.example.json"
    return json.loads(path.read_text(encoding="utf-8"))


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "beat"


def split_list(text):
    return [a.strip() for a in re.split(r"\s*[,&]\s*|\s+x\s+", text) if a.strip()]


def build_meta(audio_path, args, cfg):
    from_name = analyze.parse_filename(audio_path.stem)
    print("   Analysiere Audio (BPM / Key)...")
    detected = analyze.analyze(audio_path)

    bpm = args.bpm or from_name.get("bpm") or detected["bpm"]
    key = (analyze.normalize_key(args.key) if args.key else None) or from_name.get("key") or detected["key"]
    artists = (split_list(args.artist) if args.artist else None) or from_name.get("artists") or cfg.get("default_artists", [])
    meta = {
        "title": args.title or from_name.get("title") or audio_path.stem,
        "artists": artists[:3],
        "bpm": bpm,
        "key": key,
        "genre": args.genre or cfg.get("default_genre", "Trap"),
        "producer": cfg.get("producer_name", "prod. me"),
        "free": not args.paid,
        "duration": round(detected["duration"], 1),
        "detected": {"bpm": detected["bpm"], "key": detected["key"]},
    }
    meta["mood"] = args.mood or metadata.guess_mood(bpm, key)
    return meta


def process(audio_path, args, cfg, publish_at, service_getter):
    print(f"\n🎵 {audio_path.name}")
    meta = build_meta(audio_path, args, cfg)
    print(f"   Titel: {meta['title']} | Artists: {', '.join(meta['artists']) or '-'} | "
          f"{meta['bpm']} BPM | {meta['key']} | Mood: {meta['mood']}")

    out_dir = BASE / "output" / f"{datetime.date.today():%Y-%m-%d}_{slugify(meta['title'])}"
    out_dir.mkdir(parents=True, exist_ok=True)
    bg_dir = BASE / "backgrounds"
    font = cfg.get("font")

    print("   Erstelle Cover & Thumbnail...")
    vcfg = cfg.get("video", {})
    vw, vh = vcfg.get("width", 1920), vcfg.get("height", 1080)
    frame = cover.render(meta, (vw, vh), out_dir / "frame.jpg", bg_dir, font)
    thumb = cover.render(meta, (1280, 720), out_dir / "thumbnail.jpg", bg_dir, font)
    cover.render(meta, (3000, 3000), out_dir / "cover_3000x3000.jpg", bg_dir, font)

    title = metadata.build_title(meta, cfg)
    tags = metadata.build_tags(meta, cfg)
    description = metadata.build_description(meta, cfg, tags)
    (out_dir / "upload.txt").write_text(
        f"TITEL:\n{title}\n\nBESCHREIBUNG:\n{description}\n\nTAGS:\n{', '.join(tags)}\n", encoding="utf-8"
    )

    print("   Rendere Video...")
    mp4 = video.render(frame, audio_path, out_dir / "video.mp4", vw, vh, vcfg.get("waveform", True))

    meta.update({"youtube_title": title, "tags": tags, "publish_at": publish_at})
    if args.no_upload:
        print(f"   ✅ Fertig (ohne Upload): {out_dir}")
    else:
        from beatup import youtube
        yt_cfg = dict(cfg.get("youtube", {}))
        if args.privacy:
            yt_cfg["privacy"] = args.privacy
        when = f" (geplant: {publish_at})" if publish_at else ""
        print(f"   Lade auf YouTube hoch{when}...")
        meta["youtube_id"] = youtube.upload(service_getter(), mp4, thumb, title, description, tags, yt_cfg, publish_at)
        meta["youtube_url"] = f"https://youtu.be/{meta['youtube_id']}"

    (out_dir / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    return out_dir


def main():
    # Windows consoles choke on emoji otherwise
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    p = argparse.ArgumentParser(description="MP3 rein → Cover, Video, Beschreibung → YouTube")
    p.add_argument("files", nargs="*", help="Audio-Dateien (Standard: alles in inbox/)")
    p.add_argument("--artist", help='Type-Beat-Artists, z.B. "Drake, Future"')
    p.add_argument("--title", help="Beat-Name (Standard: aus Dateiname)")
    p.add_argument("--bpm", type=int, help="BPM überschreiben")
    p.add_argument("--key", help="Tonart überschreiben, z.B. C#m")
    p.add_argument("--genre", help="z.B. Trap, Drill, R&B, Boom Bap")
    p.add_argument("--mood", choices=sorted(cover.PALETTES), help="Farbstil & Stimmung")
    p.add_argument("--paid", action="store_true", help='Ohne "[FREE]" und ohne Free-Lizenz-Text')
    p.add_argument("--no-upload", action="store_true", help="Nur Dateien erzeugen, nicht hochladen")
    p.add_argument("--privacy", choices=["public", "unlisted", "private"])
    p.add_argument("--schedule", help='Erste Veröffentlichung, z.B. "2026-10-06 18:00" (lokale Zeit)')
    args = p.parse_args()

    cfg = load_config()
    if args.files:
        files = [Path(f).resolve() for f in args.files]
        from_inbox = False
    else:
        files = sorted(f for f in (BASE / "inbox").iterdir() if f.suffix.lower() in AUDIO_EXTS)
        from_inbox = True
    if not files:
        print("Keine Beats gefunden. Leg MP3s in den Ordner inbox/ oder gib Dateien an.")
        return 1

    start = None
    if args.schedule:
        start = datetime.datetime.strptime(args.schedule, "%Y-%m-%d %H:%M").astimezone()
    hours_apart = cfg.get("youtube", {}).get("publish_hours_apart", 24)

    service = {}

    def service_getter():
        if "s" not in service:
            from beatup import youtube
            service["s"] = youtube.get_service(BASE)
        return service["s"]

    failed = 0
    for i, f in enumerate(files):
        publish_at = None
        if start:
            publish_at = (start + datetime.timedelta(hours=hours_apart * i)).isoformat()
        try:
            process(f, args, cfg, publish_at, service_getter)
            if from_inbox and not args.no_upload:
                (BASE / "done").mkdir(exist_ok=True)
                shutil.move(str(f), BASE / "done" / f.name)
        except Exception as e:  # keep going with the next beat
            failed += 1
            print(f"   ❌ Fehler bei {f.name}: {e}")
    print(f"\nFertig: {len(files) - failed}/{len(files)} Beats verarbeitet.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
