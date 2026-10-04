"""Finds the photo for a beat's thumbnail.

Order of preference:
  1. Your own pictures in artists/<Artist Name>/      (artist photo)
  2. Freely licensed artist photos from Wikimedia Commons (downloaded once, cached in artists/)
  3. Your own pictures in backgrounds/<mood>/ or backgrounds/   (aesthetic photo)
  4. Freely licensed aesthetic photos from Openverse   (downloaded once, cached in backgrounds/<mood>/)

Downloaded photos come with a credit line (photographer + license), which is
added to the YouTube description so the license terms are met.
"""
import json
import random
import re
import urllib.parse
import urllib.request
from pathlib import Path

USER_AGENT = "BeatUploader/1.0 (https://github.com/felix361goat/gambler; personal beat uploads)"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

AESTHETIC_QUERIES = {
    "dark":   ["night city rain", "dark alley neon", "night street lights", "smoke dark"],
    "sad":    ["rain window", "empty street night", "lonely person silhouette", "foggy forest"],
    "hype":   ["sports car night", "neon lights city", "fireworks night", "stadium lights"],
    "chill":  ["sunset beach", "palm trees sunset", "clouds sky aesthetic", "city skyline dusk"],
    "love":   ["pink sunset", "roses", "couple silhouette sunset", "cherry blossom"],
    "drill":  ["london street night", "tower block", "black and white city", "underground station"],
    "dreamy": ["pastel clouds", "milky way stars", "aurora", "purple sky"],
}

# Genre-specific looks (checked before the mood). Detroit channels use
# portrait phone photos of jewelry, drinks, cars ... without any text.
GENRE_QUERIES = {
    "detroit":   (["iced out watch", "diamond chain jewelry", "purple neon light", "cognac bottle",
                   "luxury car interior night", "cash money"], "tall"),
    "flint":     (["iced out watch", "diamond chain jewelry", "purple neon light", "cash money"], "tall"),
    "afroswing": (["london summer street", "carnival dancers", "summer party friends", "sunset palm trees"], "wide"),
    "afrobeat":  (["lagos street", "carnival dancers", "summer party friends", "sunset palm trees"], "wide"),
    "drill":     (["london street night", "tower block", "underground station", "hooded figure night"], "wide"),
    "jersey":    (["new jersey street night", "club lights", "neon party"], "wide"),
}


def _get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def _download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as r:
        dest.write_bytes(r.read())


def _strip_html(text):
    return re.sub(r"<[^>]+>", "", text or "").strip()


def _credits(folder):
    f = folder / "credits.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}


def _save_credit(folder, filename, credit):
    data = _credits(folder)
    data[filename] = credit
    (folder / "credits.json").write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def _local_images(folder):
    if not folder.is_dir():
        return []
    return sorted(p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXTS)


def _artist_folder(base, artist):
    root = base / "artists"
    root.mkdir(exist_ok=True)
    for d in root.iterdir():
        if d.is_dir() and d.name.lower() == artist.lower():
            return d
    return root / artist


# ---------- Wikimedia Commons (artist photos) ----------

def _commons_category(artist):
    """Artist name → Wikipedia article → Wikidata → Commons photo category (+ main image)."""
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "list": "search", "srlimit": 5,
        "srsearch": f"{artist} rapper OR singer OR musician",
    })
    results = _get_json(f"https://en.wikipedia.org/w/api.php?{q}")["query"]["search"]
    for res in results:
        q = urllib.parse.urlencode({
            "action": "query", "format": "json", "prop": "pageprops", "titles": res["title"],
        })
        pages = _get_json(f"https://en.wikipedia.org/w/api.php?{q}")["query"]["pages"]
        qid = next(iter(pages.values())).get("pageprops", {}).get("wikibase_item")
        if not qid:
            continue
        entity = _get_json(f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json")["entities"][qid]
        claims = entity.get("claims", {})
        # Only accept humans (Q5) so "Future" doesn't give us a painting of the future
        is_human = any(c["mainsnak"].get("datavalue", {}).get("value", {}).get("id") == "Q5"
                       for c in claims.get("P31", []))
        if not is_human:
            continue
        cat = claims.get("P373", [{}])[0].get("mainsnak", {}).get("datavalue", {}).get("value")
        main = claims.get("P18", [{}])[0].get("mainsnak", {}).get("datavalue", {}).get("value")
        return cat, main
    return None, None


def _commons_files(params):
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1920, **params,
    })
    pages = _get_json(f"https://commons.wikimedia.org/w/api.php?{q}").get("query", {}).get("pages", {})
    files = []
    for p in pages.values():
        info = (p.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata", {})
        license_name = _strip_html(meta.get("LicenseShortName", {}).get("value"))
        if info.get("mime") != "image/jpeg" or info.get("width", 0) < 800:
            continue
        if not re.search(r"CC|Public domain|PD", license_name, re.I):
            continue
        author = _strip_html(meta.get("Artist", {}).get("value")) or "unknown"
        files.append({
            "url": info.get("thumburl") or info["url"],
            "name": p["title"],
            "credit": f"{author} / Wikimedia Commons, {license_name}",
        })
    return files


def fetch_artist_photos(base, artist, limit=6):
    folder = _artist_folder(base, artist)
    cat, main = _commons_category(artist)
    files = []
    if main:
        files += _commons_files({"titles": f"File:{main}"})
    if cat:
        files += _commons_files({"generator": "categorymembers", "gcmtitle": f"Category:{cat}",
                                 "gcmtype": "file", "gcmlimit": 50})
    seen, picked = set(), []
    for f in files:
        if f["url"] not in seen:
            seen.add(f["url"])
            picked.append(f)
    picked = picked[:limit]
    if not picked:
        return []
    folder.mkdir(parents=True, exist_ok=True)
    out = []
    for i, f in enumerate(picked):
        dest = folder / f"commons_{i + 1}.jpg"
        _download(f["url"], dest)
        _save_credit(folder, dest.name, f["credit"])
        out.append(dest)
    return out


# ---------- Openverse (aesthetic photos) ----------

def _genre_key(genre):
    genre = (genre or "").lower()
    return next((k for k in GENRE_QUERIES if k in genre), None)


def fetch_aesthetic_photos(base, folder_name, queries, aspect="wide", limit=8):
    folder = base / "backgrounds" / folder_name
    out = []
    for query in queries:
        q = urllib.parse.urlencode({
            "q": query, "license_type": "commercial", "aspect_ratio": aspect,
            "size": "large", "page_size": 5, "mature": "false",
        })
        try:
            results = _get_json(f"https://api.openverse.org/v1/images/?{q}").get("results", [])
        except Exception:
            continue
        for r in results[:2]:
            if len(out) >= limit:
                return out
            folder.mkdir(parents=True, exist_ok=True)
            dest = folder / f"openverse_{r['id'][:8]}.jpg"
            try:
                _download(r["url"], dest)
            except Exception:
                continue
            lic = f"CC {r.get('license', '').upper()} {r.get('license_version', '')}".strip()
            if r.get("license") in ("cc0", "pdm"):
                lic = "Public Domain"
            _save_credit(folder, dest.name, f"{r.get('creator') or 'unknown'} / {r.get('source', 'Openverse')}, {lic}")
            out.append(dest)
    return out


# ---------- choosing ----------

def pick(base, meta, cfg, rng=None):
    """Returns {"path": Path|None, "kind": "artist"|"aesthetic"|None, "credit": str|None}."""
    base = Path(base)
    tcfg = cfg.get("thumbnail", {})
    rng = rng or random.Random(meta["title"])
    auto = tcfg.get("auto_download", True)

    candidates, kind = [], None
    if tcfg.get("use_artist_photos", True) and meta["artists"]:
        for artist in meta["artists"]:
            folder = _artist_folder(base, artist)
            found = _local_images(folder)
            if not found and auto:
                try:
                    print(f"   Suche lizenzfreie Fotos von {artist} (Wikimedia Commons)...")
                    found = fetch_artist_photos(base, artist)
                except Exception as e:
                    print(f"   ⚠ Artist-Fotos konnten nicht geladen werden: {e}")
            candidates += found
        kind = "artist" if candidates else None

    if not candidates:
        genre = _genre_key(meta["genre"])
        folder_name = genre or meta["mood"]
        candidates = (_local_images(base / "backgrounds" / folder_name)
                      or _local_images(base / "backgrounds" / meta["mood"])
                      or _local_images(base / "backgrounds"))
        if not candidates and auto:
            custom = tcfg.get("aesthetic_queries", {}).get(folder_name)
            queries, aspect = GENRE_QUERIES.get(genre) or (AESTHETIC_QUERIES.get(meta["mood"], AESTHETIC_QUERIES["dark"]), "wide")
            try:
                print(f"   Suche lizenzfreie Ästhetik-Fotos ({folder_name}) bei Openverse...")
                candidates = fetch_aesthetic_photos(base, folder_name, custom or queries, aspect)
            except Exception as e:
                print(f"   ⚠ Ästhetik-Fotos konnten nicht geladen werden: {e}")
        kind = "aesthetic" if candidates else None

    if not candidates:
        return {"path": None, "kind": None, "credit": None}
    path = rng.choice(candidates)
    return {"path": path, "kind": kind, "credit": _credits(path.parent).get(path.name)}
