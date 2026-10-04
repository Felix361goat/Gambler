"""YouTube title, description and tags in the usual 'type beat' SEO format."""
import datetime

MOOD_WORDS = {
    "dark":   ["Dark", "Hard", "Aggressive"],
    "sad":    ["Sad", "Emotional", "Melodic"],
    "hype":   ["Hype", "Bouncy", "Energetic"],
    "chill":  ["Chill", "Smooth", "Laid Back"],
    "love":   ["Love", "R&B", "Smooth"],
    "drill":  ["Drill", "Dark", "Sliding"],
    "dreamy": ["Dreamy", "Ambient", "Atmospheric"],
}


def guess_mood(bpm, key):
    minor = bool(key and key.endswith("m"))
    fast = bool(bpm and bpm >= 125)
    if minor:
        return "dark" if fast else "sad"
    return "hype" if fast else "chill"


def build_title(meta, cfg):
    year = datetime.date.today().year
    parts = []
    if meta.get("free") and cfg.get("title_prefix"):
        parts.append(cfg["title_prefix"])
    if meta["artists"]:
        parts.append(f"{' x '.join(meta['artists'])} Type Beat")
    else:
        parts.append(f"{meta['genre']} Beat")
    parts.append(f'- "{meta["title"]}"')
    mood_word = MOOD_WORDS.get(meta["mood"], ["Hard"])[0]
    tail = f"| {mood_word} {meta['genre']} Beat"
    if cfg.get("year_in_title", True):
        tail += f" {year}"
    title = " ".join(parts + [tail])
    # YouTube limit is 100 chars - drop the tail first if needed
    if len(title) > 100:
        title = " ".join(parts)
    return title[:100]


def build_tags(meta, cfg):
    year = datetime.date.today().year
    genre = meta["genre"].lower()
    tags = []
    for a in meta["artists"]:
        a = a.lower()
        tags += [f"{a} type beat", f"{a} type beat {year}", f"free {a} type beat", f"{a} instrumental"]
    if len(meta["artists"]) > 1:
        tags.append(" x ".join(a.lower() for a in meta["artists"]) + " type beat")
    for w in MOOD_WORDS.get(meta["mood"], []):
        tags.append(f"{w.lower()} {genre} beat")
    tags += [f"{genre} beat", f"{genre} beat {year}", f"{genre} instrumental", f'{meta["title"].lower()}']
    if meta.get("bpm"):
        tags.append(f"{meta['bpm']} bpm")
    tags += [t.lower() for t in cfg.get("extra_tags", [])]
    tags.append(meta["producer"].lower())

    # Dedupe, and stay under YouTube's 500 char total limit
    out, total = [], 0
    for t in dict.fromkeys(t.strip() for t in tags if t.strip()):
        cost = len(t) + (2 if " " in t else 0) + 1
        if total + cost > 480:
            break
        out.append(t)
        total += cost
    return out


def build_description(meta, cfg, tags):
    links = cfg.get("links", {})
    lines = []
    if links.get("buy"):
        lines += [f"💰 Beat kaufen / Purchase (Instant Delivery): {links['buy']}", ""]
    who = " x ".join(meta["artists"]) + " Type Beat" if meta["artists"] else meta["genre"] + " Beat"
    lines.append(f'{who} - "{meta["title"]}"')
    lines.append(meta["producer"])
    lines.append("")
    info = []
    if meta.get("bpm"):
        info.append(f"BPM: {meta['bpm']}")
    if meta.get("key"):
        info.append(f"Key: {meta['key']}")
    if info:
        lines += ["🎹 " + " | ".join(info), ""]
    if links.get("email"):
        lines.append(f"📧 Business / Custom Beats: {links['email']}")
    if links.get("instagram"):
        lines.append(f"📸 Instagram: {links['instagram']}")
    if links.get("email") or links.get("instagram"):
        lines.append("")
    if meta.get("free") and cfg.get("license_text"):
        lines += ["⚠️ " + cfg["license_text"], ""]
    lines.append("🔔 Abonnieren für täglich neue Beats!")
    if meta.get("image_credit"):
        lines += ["", f"📷 Foto: {meta['image_credit']}"]
    lines.append("")
    hashtags = []
    for a in meta["artists"][:2]:
        hashtags.append("#" + a.replace(" ", "").lower() + "typebeat")
    hashtags += [f"#{meta['genre'].replace(' ', '').lower()}beat", "#typebeat"]
    lines.append(" ".join(hashtags))
    lines += ["", "Tags:", ", ".join(tags)]
    return "\n".join(lines)[:4900]
