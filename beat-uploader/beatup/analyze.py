"""Audio analysis: BPM, key and duration, using ffmpeg for decoding and numpy for the math."""
import re
import subprocess

import numpy as np

SR = 22050
HOP = 512
N_FFT = 2048

# Spelled the way producers usually write them
NOTES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
ENHARMONIC = {"Db": "C#", "D#": "Eb", "Gb": "F#", "G#": "Ab", "A#": "Bb"}

# Krumhansl-Schmuckler key profiles
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def decode(path, start=0.0, duration=None):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start), "-i", str(path)]
    if duration:
        cmd += ["-t", str(duration)]
    cmd += ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def get_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def _stft_mag(y, n_fft=N_FFT, hop=HOP):
    if len(y) < n_fft:
        y = np.pad(y, (0, n_fft - len(y)))
    n_frames = 1 + (len(y) - n_fft) // hop
    idx = np.arange(n_fft)[None, :] + hop * np.arange(n_frames)[:, None]
    frames = y[idx] * np.hanning(n_fft)[None, :]
    return np.abs(np.fft.rfft(frames, axis=1))


def detect_bpm(mag):
    # Spectral flux onset envelope
    log_mag = np.log1p(10 * mag)
    flux = np.maximum(0, np.diff(log_mag, axis=0)).sum(axis=1)
    flux -= flux.mean()
    if not np.any(flux):
        return None

    ac = np.correlate(flux, flux, mode="full")[len(flux) - 1:]
    fps = SR / HOP
    bpms = np.arange(60.0, 200.0, 0.25)
    lags = fps * 60.0 / bpms
    # Sum the autocorrelation at several multiples of the beat period, which
    # averages out frame quantization (a single lag can't tell 140 from 144)
    strength = sum(np.interp(lags * k, np.arange(len(ac)), ac) for k in (1, 2, 3, 4))
    # Prior centred on typical rap/trap tempos, so 140 doesn't get halved to 70
    prior = np.exp(-0.5 * (np.log2(bpms / 130.0) / 0.6) ** 2)
    bpm = bpms[np.argmax(strength * prior)]
    return int(round(bpm))


def detect_key(y):
    # Long FFT for enough pitch resolution; ignore sub-bass where 808s and kicks smear the chroma
    mag = _stft_mag(y, n_fft=8192, hop=4096)
    freqs = np.fft.rfftfreq(8192, 1 / SR)
    valid = (freqs > 100) & (freqs < 2000)
    midi = np.round(69 + 12 * np.log2(freqs[valid] / 440.0)).astype(int)
    energy = mag[:, valid].sum(axis=0)
    chroma = np.bincount(midi % 12, weights=energy, minlength=12)
    if chroma.sum() == 0:
        return None

    best, best_score = None, -np.inf
    for i in range(12):
        for profile, suffix in ((MAJOR_PROFILE, ""), (MINOR_PROFILE, "m")):
            score = np.corrcoef(chroma, np.roll(profile, i))[0, 1]
            if score > best_score:
                best, best_score = NOTES[i] + suffix, score
    return best


def analyze(path):
    duration = get_duration(path)
    # Skip the intro and analyze up to 90s of the main part
    start = min(10.0, duration * 0.1)
    y = decode(path, start=start, duration=90)
    return {"duration": duration, "bpm": detect_bpm(_stft_mag(y)), "key": detect_key(y)}


def normalize_key(text):
    """'C# minor', 'Ebmin', 'F#m', 'A' -> 'C#m', 'D#m', 'F#m', 'A'."""
    m = re.fullmatch(r"([A-Ga-g])([#b]?)\s*(m|min|minor|maj|major)?", text.strip())
    if not m:
        return None
    note = m.group(1).upper() + m.group(2)
    note = ENHARMONIC.get(note, note)
    if note not in NOTES:
        return None
    minor = (m.group(3) or "").lower() in ("m", "min", "minor")
    return note + ("m" if minor else "")


def parse_filename(stem):
    """Pull title, bpm, key and artist out of names like
    'Midnight - Drake - 140bpm - C#m' or 'midnight_140_Cmin'."""
    info = {}
    parts = [p.strip() for p in re.split(r"\s+-\s+|_|\s*\|\s*", stem) if p.strip()]
    rest = []
    for p in parts:
        inline_bpm = re.search(r"\b(\d{2,3})\s*bpm\b", p, re.I)
        if inline_bpm and "bpm" not in info:
            info["bpm"] = int(inline_bpm.group(1))
            p = (p[:inline_bpm.start()] + p[inline_bpm.end():]).strip()
            if not p:
                continue
        bpm = re.fullmatch(r"(\d{2,3})\s*(bpm)?", p, re.I)
        if bpm and 50 <= int(bpm.group(1)) <= 220 and "bpm" not in info:
            info["bpm"] = int(bpm.group(1))
            continue
        key = normalize_key(p) if len(p) <= 8 else None
        if key and "key" not in info:
            info["key"] = key
            continue
        rest.append(p)
    if rest:
        info["title"] = rest[0]
    if len(rest) > 1:
        info["artists"] = [a.strip() for a in re.split(r"\s*[,&]\s*|\s+x\s+", rest[1]) if a.strip()]
    return info
