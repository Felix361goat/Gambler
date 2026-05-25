import { useState, useRef, useCallback } from "react";
import { GERMAN_VOCAB } from "./germanVocab";
import { ALL_GERMAN_WORDS as DICT_FALLBACK } from "./germanRhymeDict";
import { JHUS_VOCAB, JHUS_CHAINS, JHUS_PRO_TIPS, JHUS_FLOW_RULES } from "./jhusData";

// ─── GERMAN WORDLIST (50k words, fetched once, cached in localStorage) ────────

const DE_WORDLIST_URL =
  "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2016/de/de_50k.txt";
const CACHE_KEY = "rhyme_de_v2";

let _deWords = null; // in-memory after first load

async function loadGermanWords() {
  if (_deWords) return _deWords;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      _deWords = JSON.parse(cached);
      return _deWords;
    }
  } catch {}

  try {
    const res = await fetch(DE_WORDLIST_URL);
    if (!res.ok) throw new Error("fetch failed");
    const text = await res.text();
    _deWords = text
      .split("\n")
      .map(line => line.split(" ")[0].trim())
      .filter(w => w.length >= 2 && /^[a-zA-ZäöüÄÖÜß-]+$/.test(w));
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(_deWords)); } catch {}
    return _deWords;
  } catch {
    // fallback: use the bundled 3k-word dict (works offline)
    _deWords = DICT_FALLBACK.length > 0 ? DICT_FALLBACK : GERMAN_VOCAB.map(v => v.word);
    return _deWords;
  }
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const VIBE_COLOR = {
  hard:      { bg: "rgba(224,90,90,0.15)",   text: "#E05A5A",  border: "rgba(224,90,90,0.3)"   },
  smooth:    { bg: "rgba(90,159,224,0.15)",  text: "#5A9FE0",  border: "rgba(90,159,224,0.3)"  },
  melodic:   { bg: "rgba(212,168,67,0.15)",  text: "#D4A843",  border: "rgba(212,168,67,0.3)"  },
  street:    { bg: "rgba(168,122,212,0.15)", text: "#A87AD4",  border: "rgba(168,122,212,0.3)" },
  flex:      { bg: "rgba(224,160,90,0.15)",  text: "#E0A05A",  border: "rgba(224,160,90,0.3)"  },
  emotional: { bg: "rgba(90,196,196,0.15)",  text: "#5AC4C4",  border: "rgba(90,196,196,0.3)"  },
  dark:      { bg: "rgba(130,130,160,0.15)", text: "#9090b0",  border: "rgba(130,130,160,0.3)" },
  trap:      { bg: "rgba(224,90,90,0.15)",   text: "#E05A5A",  border: "rgba(224,90,90,0.3)"   },
  afroswing: { bg: "rgba(212,168,67,0.15)",  text: "#D4A843",  border: "rgba(212,168,67,0.3)"  },
  light:     { bg: "rgba(122,196,122,0.15)", text: "#7AC47A",  border: "rgba(122,196,122,0.3)" },
};
const vc = v => VIBE_COLOR[v] || VIBE_COLOR.smooth;

const TYPE_COLOR = {
  "Perfect":        "#7AC47A",
  "Multi-Syllabic": "#D4A843",
  "Assonance":      "#5A9FE0",
  "Slant":          "#A87AD4",
};
const tColor = t => TYPE_COLOR[t] || "#888";

const EXAMPLES = {
  both: ["blessed", "Motivation", "real bleiben", "Nacht", "dedication", "Scheine"],
  de:   ["Motivation", "Nacht", "Träume", "Scheine", "kämpfen", "Freiheit"],
  en:   ["blessed", "dedication", "alive", "situation", "wave", "grind"],
};

const EN_VIBES = ["smooth","hard","flex","street","melodic","afroswing","trap","light","emotional","dark"];
const stableVibe = w => EN_VIBES[w.split("").reduce((a,c) => a + c.charCodeAt(0), 0) % EN_VIBES.length];

// Metadata lookup from the small curated vocab (vibe + context)
const VOCAB_MAP = Object.fromEntries([
  ...GERMAN_VOCAB,
  ...JHUS_VOCAB,
].map(v => [v.word.toLowerCase(), v]));

// ─── PHONETIC UTILS ───────────────────────────────────────────────────────────

function getSyllableCount(word) {
  const m = word.toLowerCase().match(/[aeiouyäöü]+/g);
  return m ? Math.max(1, m.length) : 1;
}

function extractRhymeAnchor(word) {
  const w = word.toLowerCase().replace(/[^a-zäöüß]/g, "");
  // Longest-match first
  const ENDINGS = [
    // German -ieren (multi-syllabic)
    "ieren",
    // -ation family (both DE+EN)
    "ation","tion","sion",
    // German suffixes
    "heit","keit","lich","isch","ling","ungen","ung",
    "eine","einen","einem","einer","äume","aum",
    "eben","acht","icht","eld","elt","ang","ein",
    // J Hus favourite anchors
    "essed","ight","ound","ong","ive","eal","eed",
    "ove","ine","ain","ation","eam","ree","low",
    // Short common
    "ay","ow","oy","ew","oo","ut","ig","er","en",
  ];
  for (const e of ENDINGS) if (w.endsWith(e)) return `-${e}`;
  // Fallback: last vowel cluster + following consonants
  const m = w.match(/[aeiouyäöü][^aeiouyäöü]*$/);
  return m ? `-${m[0]}` : `-${w.slice(-2)}`;
}

function getStressPattern(word) {
  const w = word.toLowerCase();
  // J Hus specific
  const KNOWN = {
    "blessed": "STARK", "motivation": "schwach-schwach-STARK-schwach",
    "situation": "schwach-schwach-STARK-schwach", "dedication": "schwach-schwach-STARK-schwach",
    "alive": "schwach-STARK", "survive": "schwach-STARK", "thrive": "STARK",
    "spirit": "STARK-schwach", "divine": "schwach-STARK", "energy": "STARK-schwach-schwach",
  };
  if (KNOWN[w]) return KNOWN[w];
  const syl = getSyllableCount(word);
  if (syl === 1) return "STARK";
  if (syl === 2) {
    const w = word.toLowerCase();
    if (w.endsWith("tion")||w.endsWith("heit")||w.endsWith("keit")) return "schwach-STARK";
    return "STARK-schwach";
  }
  if (syl === 3) {
    if (word.endsWith("tion")||word.endsWith("ieren")||word.endsWith("keit")||word.endsWith("heit"))
      return "schwach-schwach-STARK";
    return "STARK-schwach-schwach";
  }
  if (syl >= 4) return "schwach-STARK-schwach-schwach";
  return "STARK-schwach";
}

function inferVibe(word) {
  const w = word.toLowerCase();
  // J Hus spiritual
  if (["blessed","spirit","divine","pray","faith","grace","grateful","energy","frequency","universe","alive","thrive","survive"].includes(w)) return "afroswing";
  // Flex
  if (["drip","sauce","flex","racks","bag","paper","flip","secure","winning","wave"].includes(w)) return "flex";
  // Street
  if (["endz","mandem","ting","bruv","bare","link","move","bredren","real","grind"].includes(w)) return "street";
  // German suffix rules
  if (w.endsWith("ieren")) return "smooth";
  if (w.endsWith("tion")||w.endsWith("sion")) return "smooth";
  if (w.endsWith("heit")||w.endsWith("keit")) return "emotional";
  if (w.endsWith("ung")) return "street";
  if (w.endsWith("acht")||w.endsWith("icht")) return "hard";
  if (w.endsWith("eine")||w.endsWith("ein")) return "flex";
  if (w.endsWith("aum")||w.endsWith("äume")) return "melodic";
  if (w.endsWith("eben")) return "emotional";
  if (w.endsWith("ang")||w.endsWith("eld")) return "hard";
  // English suffix rules
  if (w.endsWith("ight")||w.endsWith("ong")||w.endsWith("ound")) return "hard";
  if (w.endsWith("ow")||w.endsWith("eal")||w.endsWith("ow")) return "smooth";
  if (w.endsWith("essed")||w.endsWith("ive")||w.endsWith("eed")) return "afroswing";
  if (w.endsWith("ain")||w.endsWith("ine")||w.endsWith("ove")) return "emotional";
  return stableVibe(word);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── DATAMUSE (English) ───────────────────────────────────────────────────────

async function fetchDatamuse(params) {
  const url = `https://api.datamuse.com/words?${new URLSearchParams({ max: 1000, ...params })}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Datamuse ${res.status}`);
  return res.json();
}

// ─── GERMAN RHYME MATCHING ────────────────────────────────────────────────────

async function findGermanRhymes(inputWord) {
  const words = await loadGermanWords();
  const input = inputWord.toLowerCase();
  const seen = new Set([input]);
  const perfect = [];
  const slant   = [];

  // Try longest suffix first (best quality), stop when we have plenty
  for (let len = Math.min(7, input.length - 1); len >= 2; len--) {
    const suffix = input.slice(-len);
    for (const w of words) {
      const wl = w.toLowerCase();
      if (seen.has(wl)) continue;
      if (wl.endsWith(suffix)) {
        seen.add(wl);
        (len >= 4 ? perfect : slant).push(w);
      }
    }
    // Once we have enough high-quality perfect rhymes, only gather slant for short suffixes
    if (perfect.length >= 50 && len < 4) break;
  }

  return { perfect, slant };
}

// ─── WORD BUILDERS ────────────────────────────────────────────────────────────

function buildEnWord(item) {
  return {
    word: item.word,
    lang: "en",
    stressPattern: getStressPattern(item.word),
    vibe: stableVibe(item.word),
    context: null,
  };
}

function buildDeWord(word) {
  const meta = VOCAB_MAP[word.toLowerCase()];
  return {
    word,
    lang: meta?.lang || "de",
    stressPattern: getStressPattern(word),
    vibe: meta?.vibe || inferVibe(word),
    context: meta?.context || null,
  };
}

// ─── MAIN SEARCH LOGIC ────────────────────────────────────────────────────────

async function buildResults(inputWord, mode) {
  const phonetic = {
    stressPattern: getStressPattern(inputWord),
    vowelCore: inputWord.match(/[aeiouyäöü]/i)?.[0]?.toLowerCase() || "?",
    syllables: inputWord.toLowerCase().match(/[^aeiouyäöü]*[aeiouyäöü]+[^aeiouyäöü]*/g) || [inputWord],
    rhymeAnchor: extractRhymeAnchor(inputWord),
  };

  let enPerfect = [], enNear = [], dePerfect = [], deSlant = [];

  await Promise.all([
    ...(mode === "en" || mode === "both" ? [
      fetchDatamuse({ rel_rhy: inputWord }).then(r => { enPerfect = shuffle(r); }).catch(() => {}),
      fetchDatamuse({ rel_nry: inputWord }).then(r => { enNear    = shuffle(r); }).catch(() => {}),
    ] : []),
    ...(mode === "de" || mode === "both" ? [
      findGermanRhymes(inputWord).then(r => {
        dePerfect = shuffle(r.perfect);
        deSlant   = shuffle(r.slant);
      }).catch(() => {}),
    ] : []),
  ]);

  const toEn = arr => arr.map(buildEnWord);
  const toDe = arr => arr.map(buildDeWord);
  const dedup = arr =>
    arr.filter((w, i, a) => a.findIndex(x => x.word.toLowerCase() === w.word.toLowerCase()) === i);

  let perfectWords, multiWords, assonWords, slantWords;

  if (mode === "en") {
    const multi  = enPerfect.filter(w => (w.numSyllables || getSyllableCount(w.word)) >= 2);
    const single = enPerfect.filter(w => (w.numSyllables || getSyllableCount(w.word)) <  2);
    perfectWords = toEn(single.length >= 5 ? single : enPerfect);
    multiWords   = toEn(multi);
    assonWords   = toEn(enNear.slice(0, Math.ceil(enNear.length / 2)));
    slantWords   = toEn(enNear.slice(Math.ceil(enNear.length / 2)));

  } else if (mode === "de") {
    perfectWords = toDe(dePerfect);
    slantWords   = toDe(deSlant);
    multiWords   = toDe(dePerfect.filter(w => getSyllableCount(w) >= 2));
    assonWords   = toDe(deSlant);

  } else {
    const enMulti  = enPerfect.filter(w => (w.numSyllables || getSyllableCount(w.word)) >= 2);
    const enSingle = enPerfect.filter(w => (w.numSyllables || getSyllableCount(w.word)) <  2);
    perfectWords = shuffle([...toEn(enSingle), ...toDe(dePerfect)]);
    multiWords   = shuffle([...toEn(enMulti),  ...toDe(dePerfect.filter(w => getSyllableCount(w) >= 2))]);
    assonWords   = shuffle([...toEn(enNear.slice(0, Math.ceil(enNear.length / 2))), ...toDe(deSlant)]);
    slantWords   = shuffle([...toEn(enNear.slice(Math.ceil(enNear.length / 2))),    ...toDe(deSlant)]);
  }

  const groups = [
    { type: "Perfect",        quality: 5, words: dedup(perfectWords),
      description: `Identische Vokal+Konsonant-Kombination ab der letzten betonten Silbe wie in "${inputWord}".` },
    { type: "Multi-Syllabic", quality: 4, words: dedup(multiWords),
      description: "Zwei oder mehr Silben reimen gemeinsam — maximaler Reim-Effekt im Hook." },
    { type: "Assonance",      quality: 3, words: dedup(assonWords),
      description: "Gleiche Vokalklänge, Konsonanten variieren — typisch für J Hus Afroswing Flows." },
    { type: "Slant",          quality: 2, words: dedup(slantWords),
      description: "Nah aber nicht exakt — gibt dem Flow Reibung und Energie." },
  ].filter(g => g.words.length > 0);

  if (mode === "en" || mode === "both") {
    const jhusWords = JHUS_VOCAB
      .filter(w => w.word.toLowerCase() !== inputWord.toLowerCase())
      .filter(w => {
        // Nur Wörter die phonetisch passen (gleicher Reim-Anker oder ähnlich)
        return w.context?.includes(w.word) && (
          w.vibe === "afroswing" || w.vibe === "smooth"
        );
      })
      .slice(0, 12);

    if (jhusWords.length >= 3) {
      groups.push({
        type: "J Hus Style",
        quality: 4,
        description: "Vokabular im J Hus / UK Afroswing Stil — phonetisch und kulturell passend.",
        words: jhusWords,
      });
    }
  }

  const allUniq = dedup(shuffle([...perfectWords, ...multiWords, ...assonWords, ...slantWords]));
  const chainDefs = [
    { theme: "Ambition", vibe: "smooth"    },
    { theme: "Straße",   vibe: "street"    },
    { theme: "Flex",     vibe: "flex"      },
    { theme: "Deep",     vibe: "emotional" },
  ];
  const chains = chainDefs.map((ct, i) => {
    const words = allUniq.slice(i * 4, i * 4 + 4);
    if (words.length < 2) return null;
    return {
      id: i + 1,
      ...ct,
      words: words.map(w => w.word),
      langs: words.map(w => w.lang),
      rhymeLogic: `Alle Wörter teilen den Reim-Anker "${phonetic.rhymeAnchor}" — ideal für einen 4-Bar-Loop.`,
      barExample: `${words[0]?.word} / ${words[1]?.word} — ich bring das, keine ${words[2]?.word ?? "..."} / ${words[3]?.word ?? "..."}`,
    };
  }).filter(Boolean);

  // Mix in J Hus style chains when relevant
  const jhusRelevant = JHUS_CHAINS.filter(c =>
    c.words.some(w => allUniq.find(u => u.word.toLowerCase() === w.toLowerCase()))
  ).slice(0, 2).map(c => ({ ...c, id: chains.length + c.id }));
  const allChains = [...chains, ...jhusRelevant];

  return {
    input: inputWord,
    phonetic,
    groups,
    chains: allChains,
    proTip: (() => {
      const anchor = phonetic.rhymeAnchor?.replace('-', '');
      return JHUS_PRO_TIPS[anchor] || JHUS_PRO_TIPS['default'] || `Nutz "${phonetic.rhymeAnchor}" am Zeilenende — 4-8 Bars mit demselben Klang wie J Hus.`;
    })(),
    flowRules: JHUS_FLOW_RULES,
  };
}

// ─── PILL ─────────────────────────────────────────────────────────────────────

function Pill({ w, onCopy, isCopied }) {
  const [hov, setHov] = useState(false);
  const [tip, setTip] = useState(false);
  const c = vc(w.vibe);
  const flag = w.lang === "en" ? "🇬🇧" : w.lang === "denglisch" ? "⚡" : "🇩🇪";
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => onCopy(w.word)}
        onMouseEnter={() => { setHov(true); setTip(true); }}
        onMouseLeave={() => { setHov(false); setTip(false); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "6px 11px",
          background: hov ? c.bg : "rgba(255,255,255,0.04)",
          border: `1.5px solid ${hov ? c.border : "rgba(255,255,255,0.09)"}`,
          borderRadius: 9, cursor: "pointer",
          transform: hov ? "translateY(-2px)" : "none",
          boxShadow: hov ? `0 4px 14px ${c.border}` : "none",
          transition: "all 0.15s", position: "relative", overflow: "hidden",
        }}
      >
        <span style={{ fontSize: 10 }}>{flag}</span>
        <span style={{ fontFamily: "'Courier New',monospace", fontSize: 13, fontWeight: 700, color: hov ? c.text : "#ccc" }}>
          {w.word}
        </span>
        <span style={{
          fontSize: 8, padding: "1px 4px", borderRadius: 3,
          background: c.bg, color: c.text, fontFamily: "'Courier New',monospace",
          fontWeight: 700, opacity: hov ? 1 : 0.3, transition: "opacity 0.15s",
        }}>{w.vibe}</span>
        {isCopied && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(122,196,122,0.25)", color: "#7AC47A", fontSize: 13, fontWeight: 700,
          }}>✓</div>
        )}
      </button>
      {tip && w.context && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 7px)", left: "50%",
          transform: "translateX(-50%)",
          background: "#1c1c22", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "7px 12px", fontSize: 11, color: "#aaa",
          lineHeight: 1.5, whiteSpace: "normal", maxWidth: 200, minWidth: 130,
          zIndex: 50, pointerEvents: "none", boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
        }}>{w.context}</div>
      )}
    </div>
  );
}

// ─── WORD GROUP WITH PAGINATION ───────────────────────────────────────────────

const PAGE = 30;

function WordGroup({ g, onCopy, copiedWord }) {
  const [shown, setShown] = useState(PAGE);
  const c = tColor(g.type);
  const visible = g.words.slice(0, shown);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ padding: "3px 10px", borderRadius: 5, background: `${c}20`, border: `1px solid ${c}44`, color: c, fontSize: 10, fontFamily: "'Courier New',monospace", fontWeight: 700, letterSpacing: 1 }}>{g.type}</span>
        <span style={{ fontSize: 11, color: "#555", fontFamily: "'Courier New',monospace" }}>{g.words.length} Wörter</span>
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({length:5}).map((_,qi) => (
            <div key={qi} style={{ width:7, height:7, borderRadius:2, background: qi<(g.quality||3) ? c : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>
      </div>
      <p style={{ fontSize: 12, color: "#555", marginBottom: 14, lineHeight: 1.7, fontStyle: "italic" }}>{g.description}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {visible.map((w, i) => (
          <Pill key={i} w={w} onCopy={onCopy} isCopied={copiedWord === w.word} />
        ))}
      </div>
      {shown < g.words.length && (
        <button onClick={() => setShown(s => Math.min(s + PAGE, g.words.length))} style={{
          marginTop: 12, padding: "6px 16px", background: "rgba(255,255,255,0.04)",
          border: `1px solid ${c}44`, borderRadius: 7, color: c,
          fontSize: 11, fontFamily: "'Courier New',monospace", cursor: "pointer",
        }}>
          + {g.words.length - shown} mehr anzeigen
        </button>
      )}
      <div style={{ marginTop: 8, fontSize: 10, color: "#2a2a2a", fontFamily: "'Courier New',monospace" }}>
        Hover = Kontext · Klick = Kopieren
      </div>
    </div>
  );
}

// ─── CHAIN CARD ───────────────────────────────────────────────────────────────

function Chain({ chain, onCopy, copiedWord }) {
  const [open, setOpen] = useState(false);
  const c = vc(chain.vibe);
  return (
    <div style={{ border: `1px solid ${c.border}`, borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#444", fontFamily: "'Courier New',monospace", letterSpacing: 2 }}>#{chain.id}</span>
            <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 5, background: c.bg, color: c.text, fontFamily: "'Courier New',monospace", fontWeight: 700 }}>{chain.theme}</span>
          </div>
          <span style={{ fontSize: 9, color: "#555", fontFamily: "'Courier New',monospace" }}>{chain.vibe}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 0, alignItems: "center", rowGap: 6 }}>
          {chain.words?.map((word, i) => {
            const flag = chain.langs?.[i] === "en" ? "🇬🇧" : chain.langs?.[i] === "denglisch" ? "⚡" : "🇩🇪";
            const copied = copiedWord === word;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <button onClick={() => onCopy(word)} style={{
                  padding: "7px 14px",
                  background: copied ? "rgba(122,196,122,0.2)" : c.bg,
                  border: `1.5px solid ${copied ? "rgba(122,196,122,0.5)" : c.border}`,
                  borderRadius: 8, cursor: "pointer",
                  fontFamily: "'Courier New',monospace", fontSize: 14, fontWeight: 800,
                  color: copied ? "#7AC47A" : c.text, transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 10, marginRight: 4 }}>{flag}</span>{word}
                </button>
                {i < chain.words.length - 1 && (
                  <span style={{ color: "#2a2a2a", fontSize: 18, margin: "0 3px" }}>→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ padding: "10px 18px" }}>
        <p style={{ fontSize: 12, color: "#555", margin: "0 0 8px", lineHeight: 1.6 }}>{chain.rhymeLogic}</p>
        <button onClick={() => setOpen(v => !v)} style={{
          background: "none", border: "none", cursor: "pointer",
          color: c.text, fontSize: 11, fontFamily: "'Courier New',monospace", padding: 0, opacity: 0.7,
        }}>{open ? "▲ Bar verstecken" : "▼ Beispiel-Bar"}</button>
        {open && (
          <div style={{
            marginTop: 8, padding: "10px 14px", background: "#060609",
            border: `1px solid ${c.border}`, borderRadius: 8,
            fontFamily: "'Courier New',monospace", fontSize: 13, color: "#D4A843",
            lineHeight: 1.8, fontStyle: "italic",
          }}>"{chain.barExample}"</div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function RhymeFinder() {
  const [query, setQuery]             = useState("");
  const [lang, setLang]               = useState("both");
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [dictLoading, setDictLoading] = useState(false);
  const [errorMsg, setErrorMsg]       = useState(null);
  const [copiedWord, setCopiedWord]   = useState(null);
  const [activeGroup, setActiveGroup] = useState(0);
  const [view, setView]               = useState("words");
  const inputRef = useRef();

  function copyWord(w) {
    navigator.clipboard.writeText(w).catch(() => {});
    setCopiedWord(w);
    setTimeout(() => setCopiedWord(null), 1200);
  }

  const search = useCallback(async (q) => {
    const sq = (q ?? query).trim();
    if (!sq) return;
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setActiveGroup(0);

    // Show dict-loading hint only if words aren't cached yet
    if (!_deWords && (lang === "de" || lang === "both")) setDictLoading(true);

    try {
      const data = await buildResults(sq, lang);
      const total = data.groups.reduce((a, g) => a + g.words.length, 0);
      if (total === 0) {
        setErrorMsg("Keine Reime gefunden — versuch ein anderes Wort.");
      } else {
        setResult(data);
        setView("words");
      }
    } catch (e) {
      setErrorMsg(`Fehler: ${e.message}`);
    } finally {
      setLoading(false);
      setDictLoading(false);
    }
  }, [query, lang]);

  function loadExample(w) { setQuery(w); search(w); }

  const langColor = lang === "de" ? "#E05A5A" : lang === "en" ? "#5A9FE0" : "#D4A843";
  const totalWords = result?.groups?.reduce((a, g) => a + g.words.length, 0) || 0;
  const examples = EXAMPLES[lang] || EXAMPLES.both;

  return (
    <div style={{ minHeight: "100vh", background: "#0C0C10", color: "#E0E0E0", fontFamily: "'Georgia',serif", paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(180deg,#0c0c18 0%,#0C0C10 100%)",
        borderBottom: "1px solid rgba(90,159,224,0.1)",
        padding: "32px 20px 26px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, right: -10, fontSize: 120, fontWeight: 900, color: "rgba(90,159,224,0.035)", fontFamily: "'Courier New',monospace", userSelect: "none", letterSpacing: -4 }}>RHYME</div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#5A9FE0", fontFamily: "'Courier New',monospace", marginBottom: 8 }}>
            ◆ PHONETIC RHYME FINDER ◆ J HUS STYLE ◆ 50.000 WÖRTER ◆ KOSTENLOS
          </div>
          <h1 style={{ fontSize: "clamp(24px,5vw,40px)", fontWeight: 400, margin: "0 0 4px", color: "#fff" }}>Reim-Finder</h1>
          <p style={{ color: "#444", fontSize: 13, margin: 0, fontStyle: "italic" }}>
            Datamuse (1000+ EN) · 50k deutsche Wörter · Phonetisch · Denglisch
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "22px 16px" }}>

        {/* SEARCH */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 18, marginBottom: 18 }}>

          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {[
              { id: "de",   label: "🇩🇪 Deutsch",  color: "#E05A5A" },
              { id: "en",   label: "🇬🇧 English",   color: "#5A9FE0" },
              { id: "both", label: "⚡ Denglisch",  color: "#D4A843" },
            ].map(lo => (
              <button key={lo.id} onClick={() => setLang(lo.id)} style={{
                padding: "7px 13px",
                background: lang === lo.id ? `${lo.color}20` : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${lang === lo.id ? lo.color : "rgba(255,255,255,0.07)"}`,
                borderRadius: 8, cursor: "pointer",
                color: lang === lo.id ? lo.color : "#555",
                fontFamily: "'Courier New',monospace", fontSize: 11, fontWeight: 700, transition: "all 0.15s",
              }}>{lo.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="Wort eingeben… z.B. 'Nacht' oder 'dedication'"
              style={{
                flex: 1, background: "#07070c",
                border: `1.5px solid ${query ? langColor + "55" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10, padding: "13px 16px",
                color: langColor, fontFamily: "'Courier New',monospace",
                fontSize: 15, outline: "none", transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = langColor + "88"}
              onBlur={e => e.target.style.borderColor = query ? langColor + "55" : "rgba(255,255,255,0.08)"}
            />
            <button onClick={() => search()} disabled={loading || !query.trim()} style={{
              padding: "0 22px",
              background: loading || !query.trim() ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${langColor}, ${langColor}99)`,
              border: "none", borderRadius: 10,
              color: loading || !query.trim() ? "#444" : "#000",
              fontFamily: "'Courier New',monospace", fontSize: 12, fontWeight: 800, letterSpacing: 1,
              cursor: loading ? "wait" : "pointer", transition: "all 0.15s", minWidth: 90,
            }}>{loading ? "..." : "SUCHEN"}</button>
          </div>

          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 9, color: "#333", letterSpacing: 2, fontFamily: "'Courier New',monospace", marginRight: 10 }}>BEISPIELE</span>
            {examples.map(ex => (
              <button key={ex} onClick={() => loadExample(ex)} style={{
                marginRight: 6, marginBottom: 4, padding: "4px 10px",
                background: "none", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 5, cursor: "pointer", color: "#555",
                fontSize: 11, fontFamily: "'Courier New',monospace", transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.target.style.color = langColor; e.target.style.borderColor = langColor + "44"; }}
                onMouseLeave={e => { e.target.style.color = "#555"; e.target.style.borderColor = "rgba(255,255,255,0.06)"; }}
              >{ex}</button>
            ))}
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{ textAlign: "center", padding: "50px 20px" }}>
            <div style={{
              display: "inline-block", width: 36, height: 36,
              border: "2px solid rgba(90,159,224,0.1)", borderTop: "2px solid #5A9FE0",
              borderRadius: "50%", animation: "spin .8s linear infinite", marginBottom: 12,
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ color: "#5A9FE0", fontSize: 12, fontFamily: "'Courier New',monospace" }}>
              {dictLoading ? "Lade 50.000 deutsche Wörter… (nur beim ersten Mal)" : "Suche Reime…"}
            </div>
          </div>
        )}

        {/* ERROR */}
        {errorMsg && (
          <div style={{ padding: 16, marginBottom: 16, background: "rgba(224,90,90,0.08)", border: "1px solid rgba(224,90,90,0.2)", borderRadius: 10, color: "#E05A5A", fontSize: 13, fontFamily: "'Courier New',monospace" }}>
            {errorMsg}
          </div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <div>
            {/* Phonetic card */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(90,159,224,0.18)", borderRadius: 14, padding: 18, marginBottom: 18 }}>
              <div style={{ fontSize: 10, color: "#5A9FE0", letterSpacing: 2, fontFamily: "'Courier New',monospace", marginBottom: 12 }}>
                PHONETIK VON "{result.input}"
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {[
                  { label: "BETONUNG",   val: result.phonetic?.stressPattern, color: "#D4A843" },
                  { label: "KERN-VOKAL", val: result.phonetic?.vowelCore,     color: "#5A9FE0" },
                  { label: "REIM-ANKER", val: result.phonetic?.rhymeAnchor,   color: "#7AC47A" },
                  { label: "SILBEN",     val: result.phonetic?.syllables?.join("·"), color: "#A87AD4" },
                ].filter(x => x.val).map((x, i) => (
                  <div key={i} style={{ padding: "7px 13px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}>
                    <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, fontFamily: "'Courier New',monospace", marginBottom: 3 }}>{x.label}</div>
                    <div style={{ fontSize: 13, color: x.color, fontFamily: "'Courier New',monospace", fontWeight: 700 }}>{x.val}</div>
                  </div>
                ))}
              </div>
              {result.proTip && (
                <div style={{ padding: "9px 13px", background: "rgba(212,168,67,0.07)", border: "1px solid rgba(212,168,67,0.15)", borderRadius: 8, fontSize: 12, color: "#D4A843", fontStyle: "italic", lineHeight: 1.7 }}>
                  💡 {result.proTip}
                </div>
              )}
              {result.flowRules?.length > 0 && (
                <div style={{ marginTop: 10, padding: "8px 13px", background: "rgba(168,122,212,0.07)", border: "1px solid rgba(168,122,212,0.15)", borderRadius: 8 }}>
                  <div style={{ fontSize: 9, color: "#A87AD4", letterSpacing: 2, fontFamily: "'Courier New',monospace", marginBottom: 6 }}>J HUS FLOW RULES</div>
                  {result.flowRules.slice(0, 3).map((r, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#888", marginBottom: 3, fontStyle: "italic" }}>• {r}</div>
                  ))}
                </div>
              )}
            </div>

            {/* View tabs */}
            <div style={{ display: "flex", gap: 0, marginBottom: 18, width: "fit-content", borderRadius: 9, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[
                { id: "words",  label: `Reimwörter (${totalWords})` },
                { id: "chains", label: `Ketten (${result.chains?.length || 0})` },
              ].map(v => (
                <button key={v.id} onClick={() => setView(v.id)} style={{
                  padding: "9px 18px",
                  background: view === v.id ? "rgba(90,159,224,0.12)" : "rgba(255,255,255,0.03)",
                  border: "none", color: view === v.id ? "#5A9FE0" : "#555",
                  fontFamily: "'Courier New',monospace", fontSize: 11, letterSpacing: 1,
                  cursor: "pointer", fontWeight: view === v.id ? 700 : 400,
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                }}>{v.label}</button>
              ))}
            </div>

            {/* WORDS */}
            {view === "words" && (
              <div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
                  {result.groups?.map((g, i) => {
                    const c = tColor(g.type);
                    return (
                      <button key={i} onClick={() => setActiveGroup(i)} style={{
                        padding: "7px 14px",
                        background: activeGroup === i ? `${c}22` : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${activeGroup === i ? c : "rgba(255,255,255,0.07)"}`,
                        borderRadius: 9, cursor: "pointer",
                        color: activeGroup === i ? c : "#666",
                        fontFamily: "'Courier New',monospace", fontSize: 11, fontWeight: 700, transition: "all 0.15s",
                      }}>
                        {g.type} <span style={{ opacity: 0.5 }}>({g.words?.length})</span>
                      </button>
                    );
                  })}
                </div>
                {result.groups?.[activeGroup] && (
                  <WordGroup g={result.groups[activeGroup]} onCopy={copyWord} copiedWord={copiedWord} />
                )}
              </div>
            )}

            {/* CHAINS */}
            {view === "chains" && (
              <div>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, fontFamily: "'Courier New',monospace", marginBottom: 14 }}>
                  4-WORT REIM-KETTEN · KLICK = KOPIEREN · ▼ = BEISPIEL-BAR
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 12 }}>
                  {result.chains?.map((chain, i) => (
                    <Chain key={i} chain={chain} onCopy={copyWord} copiedWord={copiedWord} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
