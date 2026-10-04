"""Cover art / thumbnail generator.

Uses a random picture from backgrounds/ if there is one, otherwise paints an
abstract glow background in colors that match the beat's mood.
"""
import hashlib
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

PALETTES = {
    "dark":  [(10, 10, 18), (90, 0, 30), (200, 20, 60), (255, 60, 90)],
    "sad":   [(8, 12, 30), (20, 40, 90), (70, 120, 200), (160, 200, 255)],
    "hype":  [(15, 5, 0), (140, 30, 0), (255, 110, 0), (255, 210, 60)],
    "chill": [(10, 20, 25), (20, 80, 90), (60, 190, 170), (180, 255, 230)],
    "love":  [(25, 5, 20), (110, 20, 80), (240, 80, 160), (255, 190, 220)],
    "drill": [(5, 5, 5), (40, 40, 50), (120, 120, 140), (230, 230, 240)],
    "dreamy": [(15, 5, 35), (70, 20, 120), (170, 90, 255), (255, 170, 250)],
}

FONT_CANDIDATES = [
    "C:/Windows/Fonts/impact.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "/System/Library/Fonts/Supplemental/Impact.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
]

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def _font(size, custom=None):
    for path in ([custom] if custom else []) + FONT_CANDIDATES:
        if path and Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size)


def _abstract_background(w, h, palette, rng):
    base = Image.new("RGB", (w, h), palette[0])
    glow = Image.new("RGB", (w, h), (0, 0, 0))
    d = ImageDraw.Draw(glow)
    for _ in range(rng.randint(4, 7)):
        r = rng.randint(min(w, h) // 5, min(w, h) // 2)
        x, y = rng.randint(0, w), rng.randint(0, h)
        d.ellipse((x - r, y - r, x + r, y + r), fill=rng.choice(palette[1:]))
    glow = glow.filter(ImageFilter.GaussianBlur(min(w, h) // 6))
    img = Image.blend(base, glow, 0.85)

    # Thin geometric lines for some texture
    d = ImageDraw.Draw(img, "RGBA")
    accent = palette[-1]
    for _ in range(rng.randint(3, 6)):
        y = rng.randint(0, h)
        d.line((0, y, w, y + rng.randint(-h // 3, h // 3)), fill=accent + (40,), width=max(2, h // 300))
    return img


def _photo_background(w, h, path):
    img = Image.open(path).convert("RGB")
    img = ImageOps.fit(img, (w, h), Image.LANCZOS)
    img = img.filter(ImageFilter.GaussianBlur(max(1, min(w, h) // 400)))
    return Image.blend(img, Image.new("RGB", (w, h), (0, 0, 0)), 0.35)


def _grain_and_vignette(img, rng):
    w, h = img.size
    noise = Image.effect_noise((w, h), 40).convert("RGB")
    img = Image.blend(img, noise, 0.06)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).ellipse((-w * 0.2, -h * 0.2, w * 1.2, h * 1.2), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(min(w, h) // 5))
    return Image.composite(img, Image.new("RGB", (w, h), (0, 0, 0)), mask)


def _fit_text(draw, text, max_width, start_size, font_path):
    size = start_size
    while size > 12:
        font = _font(size, font_path)
        if draw.textlength(text, font=font) <= max_width:
            return font
        size = int(size * 0.9)
    return _font(size, font_path)


def _centered(draw, y, text, font, fill, shadow=True):
    w = draw.im.size[0]
    tw = draw.textlength(text, font=font)
    x = (w - tw) / 2
    if shadow:
        off = max(2, font.size // 25)
        draw.text((x + off, y + off), text, font=font, fill=(0, 0, 0, 180))
    draw.text((x, y), text, font=font, fill=fill)
    return y + font.size * 1.15


def render(meta, size, out_path, backgrounds_dir=None, font_path=None):
    w, h = size
    seed = int(hashlib.md5(meta["title"].encode()).hexdigest(), 16)
    rng = random.Random(seed)
    palette = PALETTES.get(meta["mood"], PALETTES["dark"])

    photos = []
    if backgrounds_dir and Path(backgrounds_dir).is_dir():
        photos = sorted(p for p in Path(backgrounds_dir).iterdir() if p.suffix.lower() in IMAGE_EXTS)
    if photos:
        img = _photo_background(w, h, rng.choice(photos))
    else:
        img = _abstract_background(w, h, palette, rng)
    img = _grain_and_vignette(img, rng)

    d = ImageDraw.Draw(img, "RGBA")
    accent = palette[-1] + (255,)
    unit = min(w, h)
    margin = w * 0.08

    title = meta["title"].upper()
    title_font = _fit_text(d, title, w - 2 * margin, int(unit * 0.20), font_path)
    sub = f"{' x '.join(meta['artists']).upper()} TYPE BEAT" if meta["artists"] else meta["genre"].upper() + " BEAT"
    sub_font = _fit_text(d, sub, w - 2 * margin, int(unit * 0.07), font_path)
    info = "  •  ".join(x for x in [f"{meta['bpm']} BPM" if meta.get("bpm") else "", meta.get("key") or ""] if x)
    info_font = _font(int(unit * 0.045), font_path)

    block_h = title_font.size * 1.15 + sub_font.size * 1.15 + (info_font.size * 1.6 if info else 0)
    y = (h - block_h) / 2
    y = _centered(d, y, title, title_font, (255, 255, 255, 255))
    y = _centered(d, y, sub, sub_font, accent)
    if info:
        _centered(d, y + info_font.size * 0.4, info, info_font, (255, 255, 255, 220), shadow=False)

    tag_font = _font(int(unit * 0.04), font_path)
    _centered(d, h - tag_font.size * 2.2, meta["producer"], tag_font, (255, 255, 255, 200), shadow=False)

    if meta.get("free"):
        badge_font = _font(int(unit * 0.05), font_path)
        pad = badge_font.size * 0.4
        bw = d.textlength("FREE", font=badge_font) + 2 * pad
        d.rounded_rectangle((margin * 0.5, margin * 0.5, margin * 0.5 + bw, margin * 0.5 + badge_font.size + 2 * pad),
                            radius=pad, fill=accent)
        d.text((margin * 0.5 + pad, margin * 0.5 + pad * 0.8), "FREE", font=badge_font, fill=(0, 0, 0, 255))

    img.save(out_path, quality=92)
    return out_path
