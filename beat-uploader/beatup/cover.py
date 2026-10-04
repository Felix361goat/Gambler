"""Thumbnails / cover art in the style of the big type beat channels.

Modelled on what ranks in searches like "uk afroswing type beat" and
"detroit type beat":

  title      (KBEATS / Drayy style) artist photo fills the frame, natural
             colors, ONE big wide white word (the beat name) in the middle,
             small producer tag below
  tiled      same, but a portrait photo repeated 2-3x side by side
  pillarbox  (Detroit style) a portrait phone photo centered on black,
             no text at all
  clean      landscape aesthetic photo, full frame, no text
  bold       fallback without any photo: abstract background + big text
"""
import hashlib
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

BASE = Path(__file__).resolve().parent.parent

PALETTES = {
    "dark":   [(10, 10, 18), (90, 0, 30), (200, 20, 60), (255, 60, 90)],
    "sad":    [(8, 12, 30), (20, 40, 90), (70, 120, 200), (160, 200, 255)],
    "hype":   [(15, 5, 0), (140, 30, 0), (255, 110, 0), (255, 210, 60)],
    "chill":  [(10, 20, 25), (20, 80, 90), (60, 190, 170), (180, 255, 230)],
    "love":   [(25, 5, 20), (110, 20, 80), (240, 80, 160), (255, 190, 220)],
    "drill":  [(5, 5, 5), (40, 40, 50), (120, 120, 140), (230, 230, 240)],
    "dreamy": [(15, 5, 35), (70, 20, 120), (170, 90, 255), (255, 170, 250)],
}

# saturation, contrast, shadow tint, highlight tint  (applied lightly)
GRADES = {
    "dark":   (0.85, 1.10, (25, -5, 0), (5, -5, -5)),
    "sad":    (0.75, 1.00, (-10, 0, 25), (-5, 5, 15)),
    "hype":   (1.15, 1.12, (5, 0, -10), (20, 8, -10)),
    "chill":  (1.00, 1.00, (-5, 10, 10), (15, 10, 0)),
    "love":   (1.00, 1.02, (20, -5, 15), (15, 5, 5)),
    "drill":  (0.60, 1.15, (0, 0, 8), (0, 0, 0)),
    "dreamy": (0.95, 1.00, (20, -5, 35), (15, 5, 20)),
}

LAYOUTS = ["title", "tiled", "pillarbox", "clean", "bold"]
TEXT_LAYOUTS = {"title", "tiled", "bold"}

TITLE_FONTS = [
    str(BASE / "fonts" / "ArchivoBlack-Regular.ttf"),
    "C:/Windows/Fonts/ariblk.ttf",
    "/System/Library/Fonts/Supplemental/Arial Black.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def _font(size, custom=None):
    for path in ([custom] if custom else []) + TITLE_FONTS:
        if path and Path(path).exists():
            return ImageFont.truetype(path, max(8, int(size)))
    return ImageFont.load_default(max(8, int(size)))


def _orientation(path):
    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im)
        return "portrait" if im.height > im.width * 1.05 else "landscape"


def choose_layout(meta, photo, style="auto", text="auto"):
    """photo: {"path", "kind"} from images.pick() or None."""
    if not photo or not photo.get("path"):
        return "bold"
    portrait = _orientation(photo["path"]) == "portrait"
    if style in LAYOUTS and style != "bold":
        if style == "tiled" and not portrait:
            return "title"
        if style == "pillarbox" and not portrait:
            return "clean"
        return style
    if style == "bold":
        return "bold"

    if text == "never":
        return "pillarbox" if portrait else "clean"
    if photo["kind"] == "artist" or text == "always":
        return "tiled" if portrait else "title"
    # Aesthetic photo: the Detroit look, picture speaks for itself
    return "pillarbox" if portrait else "clean"


# ---------- image processing ----------

def _load(path):
    return ImageOps.exif_transpose(Image.open(path)).convert("RGB")


def _fit(img, w, h, kind):
    # Faces usually sit in the upper part of artist photos
    centering = (0.5, 0.35) if kind == "artist" else (0.5, 0.5)
    return ImageOps.fit(img, (w, h), Image.LANCZOS, centering=centering)


def grade(img, mood, strength=0.5):
    sat, contrast, shadow, highlight = GRADES.get(mood, GRADES["dark"])
    a = np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0
    lum = (a @ np.array([0.299, 0.587, 0.114], dtype=np.float32))[..., None]
    a = lum + (a - lum) * (1 + (sat - 1) * strength)
    a = 0.5 + (a - 0.5) * (1 + (contrast - 1) * strength)
    a = a + (1 - lum) * np.array(shadow, dtype=np.float32) / 255.0 * strength
    a = a + lum * np.array(highlight, dtype=np.float32) / 255.0 * strength
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def grain(img, amount=0.03, seed=0):
    w, h = img.size
    rng = np.random.default_rng(seed)
    scale = max(1, round(min(w, h) / 720))
    noise = rng.normal(0, 255 * amount, (h // scale + 1, w // scale + 1)).astype(np.float32)
    if scale > 1:
        noise = np.kron(noise, np.ones((scale, scale), dtype=np.float32))
    a = np.asarray(img, dtype=np.float32) + noise[:h, :w, None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def vignette(img, strength=0.35):
    w, h = img.size
    y, x = np.ogrid[:h, :w]
    d = np.sqrt(((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
    mask = 1 - strength * np.clip(d * 1.25 - 0.25, 0, 1) ** 1.6
    a = np.asarray(img, dtype=np.float32) * mask[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def _abstract_background(w, h, palette, rng):
    base = Image.new("RGB", (w, h), palette[0])
    glow = Image.new("RGB", (w, h), (0, 0, 0))
    d = ImageDraw.Draw(glow)
    for _ in range(rng.randint(4, 7)):
        r = rng.randint(min(w, h) // 5, min(w, h) // 2)
        x, y = rng.randint(0, w), rng.randint(0, h)
        d.ellipse((x - r, y - r, x + r, y + r), fill=rng.choice(palette[1:]))
    glow = glow.filter(ImageFilter.GaussianBlur(min(w, h) // 6))
    return Image.blend(base, glow, 0.85)


# ---------- text ----------

def _big_title(img, text, font_path, center_y=0.56, max_w=0.80, max_h=0.24, stretch=1.25):
    """One big wide white word with a soft drop shadow, like KBEATS / Drayy.
    The text is drawn narrow and then stretched horizontally, which gives the
    'extended' look of fonts like Druk Wide / Monument Extended."""
    w, h = img.size
    text = text.upper()
    nw = int(w / stretch)
    probe = ImageDraw.Draw(img)
    size = h * max_h
    font = _font(size, font_path)
    while probe.textlength(text, font=font) * stretch > w * max_w and size > 10:
        size *= 0.95
        font = _font(size, font_path)

    def mask(dx=0, dy=0, fill=255):
        m = Image.new("L", (nw, h), 0)
        ImageDraw.Draw(m).text((nw / 2 + dx / stretch, h * center_y + dy), text, font=font, fill=fill, anchor="mm")
        return m.resize((w, h), Image.LANCZOS)

    off = max(2, int(font.size * 0.04))
    shadow = mask(off, off, 170).filter(ImageFilter.GaussianBlur(max(2, font.size * 0.08)))
    img.paste(Image.new("RGB", (w, h), (0, 0, 0)), (0, 0), shadow)
    img.paste(Image.new("RGB", (w, h), (255, 255, 255)), (0, 0), mask())
    return font


def _producer_tag(img, tag, font_path, y=0.86):
    """Small boxed tag under the title, like the 'KB / PROD BY KBEATS' logo."""
    w, h = img.size
    d = ImageDraw.Draw(img, "RGBA")
    font = _font(h * 0.032, font_path)
    text = tag.upper()
    tw = d.textlength(text, font=font)
    pad = font.size * 0.45
    x0, y0 = w / 2 - tw / 2 - pad, h * y - font.size / 2 - pad
    x1, y1 = w / 2 + tw / 2 + pad, h * y + font.size / 2 + pad
    d.rectangle((x0, y0, x1, y1), outline=(255, 255, 255, 230), width=max(2, int(h * 0.004)))
    d.text((w / 2, h * y), text, font=font, fill=(255, 255, 255, 240), anchor="mm")


# ---------- main entry ----------

def render(meta, size, out_path, photo=None, layout="title", fonts=None, show_tag=True):
    w, h = size
    fonts = fonts or {}
    title_font = fonts.get("title")
    seed = int(hashlib.md5(meta["title"].encode()).hexdigest(), 16) % (2 ** 32)
    rng = random.Random(seed)
    kind = photo.get("kind") if photo and photo.get("path") else None

    if layout == "bold" or not kind:
        palette = PALETTES.get(meta["mood"], PALETTES["dark"])
        img = _abstract_background(w, h, palette, rng)
        img = vignette(grain(img, 0.04, seed), 0.6)
        _big_title(img, meta["title"], title_font, center_y=0.47)
        sub = (" x ".join(meta["artists"]) or meta["genre"]).upper() + " TYPE BEAT"
        d = ImageDraw.Draw(img)
        f = _font(h * 0.045, title_font)
        d.text((w / 2, h * 0.62), sub, font=f, fill=palette[-1], anchor="mm")
        if show_tag:
            _producer_tag(img, meta["producer"], title_font)
        img.save(out_path, quality=92)
        return out_path

    src = _load(photo["path"])

    if layout in ("pillarbox", "clean"):
        if layout == "pillarbox":
            # Portrait phone photo centered on black, like the Detroit channels
            ph = h
            pw = min(w, int(src.width * ph / src.height))
            inner = _fit(src, pw, ph, kind)
            img = Image.new("RGB", (w, h), (0, 0, 0))
            img.paste(grade(inner, meta["mood"], 0.4), ((w - pw) // 2, 0))
        else:
            img = grade(_fit(src, w, h, kind), meta["mood"], 0.4)
        img = grain(img, 0.02, seed)
        img.save(out_path, quality=92)
        return out_path

    if layout == "tiled":
        # Repeat a portrait photo side by side until the frame is filled
        n = max(2, min(3, round(w / (h * src.width / src.height))))
        tile_w = -(-w // n)
        tile = _fit(src, tile_w, h, kind)
        img = Image.new("RGB", (w, h))
        for i in range(n):
            img.paste(tile, (i * tile_w, 0))
    else:
        img = _fit(src, w, h, kind)

    img = grade(img, meta["mood"], 0.35)
    img = vignette(grain(img, 0.02, seed), 0.3)
    _big_title(img, meta["title"], title_font)
    if show_tag:
        _producer_tag(img, meta["producer"], title_font)
    img.save(out_path, quality=92)
    return out_path
