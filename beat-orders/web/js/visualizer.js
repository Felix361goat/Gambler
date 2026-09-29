// "Alien Garden" – audio-reactive visualizer (like FL Studio's ZGameEditor).
// A bioluminescent flower blooms with the spectrum, glowing tendrils sway
// with the mids, spores burst out on every kick, fireflies drift upwards.
// Can also record itself (+ the audio) as a video for TikTok/Reels.

let actx, source, analyser, recDest;

// The <audio> element can only be wired into Web Audio once – keep it.
export function ensureAudioGraph(audio) {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
    source = actx.createMediaElementSource(audio);
    analyser = actx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.78;
    source.connect(analyser);
    analyser.connect(actx.destination);
  }
  if (actx.state === 'suspended') actx.resume();
  return analyser;
}
export const resumeAudio = () => { if (actx?.state === 'suspended') actx.resume(); };

export const PALETTES = [
  { name: 'Alien', hue: 150, spread: 140, speed: 6, bg: [4, 6, 18] },
  { name: 'Aurora', hue: 170, spread: 90, speed: 4, bg: [2, 8, 20] },
  { name: 'Tiefsee', hue: 200, spread: 70, speed: 3, bg: [0, 6, 16] },
  { name: 'Dschungel', hue: 95, spread: 80, speed: 5, bg: [4, 10, 6] },
  { name: 'Lava-Orchidee', hue: 320, spread: 90, speed: 7, bg: [14, 3, 12] },
];

export function createVisualizer(canvas) {
  const g = canvas.getContext('2d');
  const freq = new Uint8Array(1024);
  const wave = new Uint8Array(2048);
  let raf = 0, t0 = performance.now(), w = 0, h = 0, dpr = 1;
  let palette = 0;
  let bassAvg = 0.2, lastBeat = 0;
  const bands = { bass: 0, mid: 0, high: 0 };
  const spores = [];
  const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3, p: Math.random() * 6 }));

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const [r, gg, b] = PALETTES[palette].bg;
    g.fillStyle = `rgb(${r},${gg},${b})`; g.fillRect(0, 0, w, h);
  }

  const avgBins = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += freq[i]; return s / (b - a) / 255; };
  const hueAt = (t, off = 0) => {
    const P = PALETTES[palette];
    return P.hue + Math.sin(t * 0.05 * P.speed + off) * P.spread * 0.5 + off * 18;
  };

  function spawn(n, x, y, hue, speed = 3) {
    for (let i = 0; i < n && spores.length < 420; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.5 + Math.random()) * speed;
      spores.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.6, life: 1, r: 1 + Math.random() * 2.6, hue: hue + (Math.random() - 0.5) * 60 });
    }
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    if (analyser) { analyser.getByteFrequencyData(freq); analyser.getByteTimeDomainData(wave); }
    // smooth bands
    const b = avgBins(1, 8), m = avgBins(12, 90), hi = avgBins(120, 420);
    bands.bass += (b - bands.bass) * 0.35; bands.mid += (m - bands.mid) * 0.25; bands.high += (hi - bands.high) * 0.25;
    bassAvg += (bands.bass - bassAvg) * 0.02;
    const beat = bands.bass > bassAvg * 1.25 && bands.bass > 0.3 && now - lastBeat > 180;
    if (beat) lastBeat = now;

    const P = PALETTES[palette];
    const cx = w / 2, cy = h * 0.42, R = Math.min(w, h) * 0.17;
    const baseHue = hueAt(t);

    // trails
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(${P.bg[0]},${P.bg[1]},${P.bg[2]},${0.16 + (1 - bands.bass) * 0.08})`;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';

    // twinkling stars
    for (const s of stars) {
      const a = 0.25 + 0.35 * Math.sin(t * 2 + s.p) + bands.high * 0.6;
      g.fillStyle = `hsla(${baseHue + 60},80%,85%,${Math.max(0, a) * 0.35})`;
      g.beginPath(); g.arc(s.x * w, s.y * h * 0.8, s.r, 0, 7); g.fill();
    }

    // tendrils growing from the ground
    const N = 9;
    for (let i = 0; i < N; i++) {
      const x0 = (w * (i + 0.5)) / N + Math.sin(i * 7.3) * 12;
      const height = h * (0.22 + 0.38 * bands.mid + 0.08 * Math.sin(t * 0.7 + i));
      const hue = baseHue + i * 22 - 60;
      g.strokeStyle = `hsla(${hue},95%,60%,0.55)`;
      g.lineWidth = 1.5 + bands.high * 5;
      g.shadowBlur = 18; g.shadowColor = `hsla(${hue},100%,60%,0.9)`;
      g.beginPath();
      let x = x0, y = h;
      g.moveTo(x, y);
      const segs = 26;
      for (let s = 1; s <= segs; s++) {
        const k = s / segs;
        y = h - height * k;
        x = x0 + Math.sin(k * 5 + t * (0.9 + i * 0.07) + i) * (14 + bands.mid * 60) * k;
        g.lineTo(x, y);
      }
      g.stroke();
      // glowing bulb at the tip
      g.fillStyle = `hsla(${hue + 40},100%,70%,0.9)`;
      g.beginPath(); g.arc(x, y, 2.5 + bands.bass * 9, 0, 7); g.fill();
      if (beat && Math.random() < 0.5) spawn(3, x, y, hue + 40, 1.6);
    }
    g.shadowBlur = 0;

    // blooming spectrum flower – 3 rotating layers
    const pts = 120;
    for (let layer = 0; layer < 3; layer++) {
      const hue = baseHue + layer * 45;
      const rot = t * (0.15 + layer * 0.06) * (layer % 2 ? -1 : 1);
      const scale = R * (0.55 + layer * 0.32) * (1 + bands.bass * 0.35);
      g.beginPath();
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2 + rot;
        // mirrored, log-ish bin mapping → symmetric petals
        const mi = i < pts / 2 ? i : pts - i;
        const bin = Math.min(600, Math.floor(2 + Math.pow(mi / (pts / 2), 1.8) * (180 + layer * 140)));
        const v = freq[bin] / 255;
        const petal = 1 + 0.18 * Math.sin(a * (6 + layer * 2) - t * 2);
        const r = scale * petal + v * R * (0.95 - layer * 0.22);
        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
        i ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath();
      const grd = g.createRadialGradient(cx, cy, 0, cx, cy, scale * 1.9);
      grd.addColorStop(0, `hsla(${hue},100%,60%,0.12)`);
      grd.addColorStop(1, `hsla(${hue + 60},100%,50%,0)`);
      g.fillStyle = grd; g.fill();
      g.strokeStyle = `hsla(${hue},100%,70%,0.75)`;
      g.lineWidth = 1.2 + layer * 0.4;
      g.shadowBlur = 14; g.shadowColor = `hsla(${hue},100%,60%,1)`;
      g.stroke();
    }
    g.shadowBlur = 0;

    // waveform halo around the core
    g.beginPath();
    const wr = R * 0.42 * (1 + bands.bass * 0.4);
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      const v = (wave[(i * 8) % 2048] - 128) / 128;
      const r = wr + v * R * 0.35;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.strokeStyle = `hsla(${baseHue + 120},100%,80%,0.6)`; g.lineWidth = 1.2; g.stroke();

    // pulsing core
    const cr = R * (0.2 + bands.bass * 0.25);
    const core = g.createRadialGradient(cx, cy, 0, cx, cy, cr * 2.2);
    core.addColorStop(0, `hsla(${baseHue + 90},100%,92%,${0.35 + bands.bass * 0.4})`);
    core.addColorStop(0.3, `hsla(${baseHue + 90},100%,65%,${0.25 + bands.bass * 0.3})`);
    core.addColorStop(1, `hsla(${baseHue + 90},100%,50%,0)`);
    g.fillStyle = core; g.beginPath(); g.arc(cx, cy, cr * 2.2, 0, 7); g.fill();

    // spores + fireflies
    if (beat) spawn(26 + Math.round(bands.bass * 30), cx, cy, baseHue + 90, 3.2);
    if (Math.random() < 0.35 + bands.high) spores.push({ x: Math.random() * w, y: h + 5, vx: (Math.random() - 0.5) * 0.4, vy: -0.4 - Math.random() * 0.9, life: 1, r: 0.8 + Math.random() * 1.8, hue: baseHue + 120 + Math.random() * 60 });
    for (let i = spores.length - 1; i >= 0; i--) {
      const s = spores[i];
      s.x += s.vx + Math.sin(t * 2 + s.y * 0.02) * 0.3; s.y += s.vy;
      s.vx *= 0.985; s.vy = s.vy * 0.985 - 0.012;
      s.life -= 0.006 + (s.r > 2.5 ? 0.004 : 0);
      if (s.life <= 0 || s.y < -10) { spores.splice(i, 1); continue; }
      g.fillStyle = `hsla(${s.hue},100%,70%,${s.life})`;
      g.beginPath(); g.arc(s.x, s.y, s.r * (1 + bands.high), 0, 7); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
  }

  return {
    start(an) {
      analyser = an || analyser;
      resize();
      window.addEventListener('resize', resize);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    },
    nextPalette() {
      palette = (palette + 1) % PALETTES.length;
      return PALETTES[palette].name;
    },
    get paletteName() { return PALETTES[palette].name; },
  };
}

// ---- recording (canvas + audio → video file) -----------------------------
let recorder = null;
export const isRecording = () => Boolean(recorder);

export function startRecording(canvas) {
  if (!canvas.captureStream || !window.MediaRecorder || !actx) throw new Error('Aufnehmen wird auf diesem Gerät nicht unterstützt.');
  const stream = canvas.captureStream(30);
  recDest ||= actx.createMediaStreamDestination();
  analyser.connect(recDest);
  recDest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
  const mime = ['video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
    .find((m) => MediaRecorder.isTypeSupported(m)) || '';
  const chunks = [];
  recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 6_000_000 } : undefined);
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((resolve) => {
    recorder.onstop = () => {
      try { analyser.disconnect(recDest); } catch {}
      const type = recorder.mimeType || 'video/webm';
      recorder = null;
      resolve(new Blob(chunks, { type }));
    };
  });
  recorder.start(500);
  return done;
}
export function stopRecording() { recorder?.stop(); }
