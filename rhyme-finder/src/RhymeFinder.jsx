import { useState, useRef, useCallback } from "react";
import { GERMAN_VOCAB } from "./germanVocab";

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
  "Consonance":     "#E0A05A",
  "Slant":          "#A87AD4",
  "Stress-Match":   "#E05A5A",
};
const tColor = t => TYPE_COLOR[t] || "#888";

const EXAMPLES = {
  both: ["Motivation", "Nacht", "charismatic", "Scheine", "dedicated", "real bleiben"],
  de:   ["Motivation", "Nacht", "Straße", "Träume", "Scheine", "kämpfen"],
  en:   ["dedication", "charismatic", "wave", "situation", "automatic", "grind"],
};

// Vibes for English words based on score/syllables
const EN_VIBES = ["smooth", "hard", "flex", "street", "melodic", "afroswing", "trap", "light", "emotional", "dark"];
const randomVibe = (seed) => EN_VIBES[Math.abs(seed) % EN_VIBES.length];

// ─── DATAMUSE API ─────────────────────────────────────────────────────────────

async function fetchDatamuse(params) {
  const url = `https://api.datamuse.com/words?${new URLSearchParams({ max: 100, ...params })}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Datamuse ${res.status}`);
  return res.json();
}

// ─── PHONETIC UTILS ───────────────────────────────────────────────────────────

function getSyllableCount(word) {
  const w = word.toLowerCase();
  const matches = w.match(/[aeiouyäöü]+/g);
  return matches ? Math.max(1, matches.length) : 1;
}

function getRhymeSuffix(word, len = 3) {
  return word.toLowerCase().slice(-len);
}

function extractRhymeAnchor(word) {
  const w = word.toLowerCase();
  // German -ieren ending
  if (w.endsWith("ieren")) return "-ieren";
  if (w.endsWith("tion")) return "-tion";
  if (w.endsWith("ung")) return "-ung";
  if (w.endsWith("eit")) return "-eit";
  if (w.endsWith("icht")) return "-icht";
  if (w.endsWith("acht")) return "-acht";
  if (w.endsWith("eine")) return "-eine";
  if (w.endsWith("aum")) return "-aum";
  if (w.endsWith("eben")) return "-eben";
  // English common endings
  if (w.endsWith("ation")) return "-ation";
  if (w.endsWith("ight")) return "-ight";
  if (w.endsWith("ound")) return "-ound";
  if (w.endsWith("ation")) return "-ation";
  const vowelMatch = w.match(/[aeiouy][^aeiouy]*$/);
  return vowelMatch ? `-${vowelMatch[0]}` : `-${w.slice(-2)}`;
}

function getStressPattern(word) {
  const syl = getSyllableCount(word);
  if (syl === 1) return "STARK";
  if (syl === 2) return "STARK-schwach";
  if (syl === 3) {
    if (word.endsWith("tion") || word.endsWith("ieren")) return "schwach-schwach-STARK";
    return "STARK-schwach-schwach";
  }
  if (syl === 4) return "schwach-STARK-schwach-schwach";
  return "schwach-schwach-STARK-schwach";
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── GERMAN RHYME MATCHING ────────────────────────────────────────────────────

function findGermanRhymes(inputWord, minSuffixLen = 3) {
  const input = inputWord.toLowerCase();
  const results = { perfect: [], slant: [] };

  for (let len = Math.min(6, input.length - 1); len >= minSuffixLen; len--) {
    const suffix = input.slice(-len);
    GERMAN_VOCAB.forEach(entry => {
      const w = entry.word.toLowerCase();
      if (w === input) return;
      if (w.endsWith(suffix)) {
        const bucket = len >= 4 ? "perfect" : "slant";
        if (!results.perfect.find(e => e.word === entry.word) && !results.slant.find(e => e.word === entry.word)) {
          results[bucket].push(entry);
        }
      }
    });
    if (results.perfect.length >= 8) break;
  }
  return results;
}

// ─── BUILD RESULTS ────────────────────────────────────────────────────────────

function buildEnglishWord(item, index) {
  const syllables = item.numSyllables || getSyllableCount(item.word);
  return {
    word: item.word,
    lang: "en",
    stressPattern: getStressPattern(item.word),
    vibe: randomVibe(item.word.charCodeAt(0) + index),
    context: `"...${item.word}..."`,
  };
}

function buildGermanWord(entry) {
  return {
    word: entry.word,
    lang: entry.lang || "de",
    stressPattern: getStressPattern(entry.word),
    vibe: entry.vibe || "street",
    context: entry.context || `"...${entry.word}..."`,
  };
}

async function buildResults(inputWord, mode) {
  const phonetic = {
    stressPattern: getStressPattern(inputWord),
    vowelCore: inputWord.match(/[aeiouyäöü]/i)?.[0]?.toLowerCase() || "?",
    syllables: inputWord.toLowerCase().match(/[^aeiouyäöü]*[aeiouyäöü]+[^aeiouyäöü]*/g) || [inputWord],
    rhymeAnchor: extractRhymeAnchor(inputWord),
  };

  let perfectWords = [], nearWords = [], slantWords = [], multiWords = [], assonWords = [];

  // ── English / Denglisch ────────────────────────────────────────────────────
  if (mode === "en" || mode === "both") {
    const [perfectRaw, nearRaw] = await Promise.all([
      fetchDatamuse({ rel_rhy: inputWord }),
      fetchDatamuse({ rel_nry: inputWord }),
    ]);

    // shuffle for variety
    const shuffledPerfect = shuffle(perfectRaw);
    const shuffledNear = shuffle(nearRaw);

    // Multi-syllabic = perfect rhymes with 2+ syllables
    const multiRaw = shuffledPerfect.filter(w => (w.numSyllables || getSyllableCount(w.word)) >= 2);
    multiWords = multiRaw.slice(0, 8).map((w, i) => buildEnglishWord(w, i));

    // Perfect = high-score perfect rhymes
    perfectWords = shuffledPerfect
      .filter(w => (w.numSyllables || getSyllableCount(w.word)) === 1)
      .slice(0, 8)
      .map((w, i) => buildEnglishWord(w, i + 10));

    // If not enough perfect, fill with multi
    if (perfectWords.length < 5) perfectWords = shuffledPerfect.slice(0, 8).map((w, i) => buildEnglishWord(w, i));

    // Near rhymes = slant + assonance
    assonWords = shuffledNear.slice(0, 6).map((w, i) => buildEnglishWord(w, i + 20));
    slantWords = shuffledNear.slice(6, 14).map((w, i) => buildEnglishWord(w, i + 30));
  }

  // ── German ────────────────────────────────────────────────────────────────
  if (mode === "de" || mode === "both") {
    const deRhymes = findGermanRhymes(inputWord);
    const dePerfect = shuffle(deRhymes.perfect).slice(0, 8).map(buildGermanWord);
    const deSlant = shuffle(deRhymes.slant).slice(0, 6).map(buildGermanWord);

    if (mode === "de") {
      perfectWords = dePerfect;
      slantWords = deSlant;
      multiWords = dePerfect.filter(w => getSyllableCount(w.word) >= 2).slice(0, 6);
      assonWords = deSlant.slice(0, 5);
    } else {
      // Mix for Denglisch
      perfectWords = shuffle([...perfectWords, ...dePerfect]).slice(0, 10);
      slantWords = shuffle([...slantWords, ...deSlant]).slice(0, 8);
    }
  }

  // Ensure min 5 words per group by filling from other groups
  const fillGroup = (arr, fallback, min = 5) => {
    if (arr.length >= min) return arr;
    const extra = fallback.filter(w => !arr.find(a => a.word === w.word));
    return [...arr, ...extra].slice(0, Math.max(min, arr.length));
  };

  const groups = [
    {
      type: "Perfect",
      quality: 5,
      description: `Identische Vokal+Konsonant-Kombination ab der letzten betonten Silbe wie in "${inputWord}".`,
      words: fillGroup(perfectWords, nearWords),
    },
    {
      type: "Multi-Syllabic",
      quality: 4,
      description: `Zwei oder mehr Silben reimen gemeinsam — maximaler Reim-Effekt im Hook.`,
      words: fillGroup(multiWords, perfectWords),
    },
    {
      type: "Assonance",
      quality: 3,
      description: `Gleiche Vokalklänge, Konsonanten variieren — typisch für J Hus Afroswing Flows.`,
      words: fillGroup(assonWords, slantWords),
    },
    {
      type: "Slant",
      quality: 2,
      description: `Nah aber nicht exakt — gibt dem Flow Reibung und Energie.`,
      words: fillGroup(slantWords, assonWords),
    },
  ].filter(g => g.words.length > 0);

  // ── Chains ────────────────────────────────────────────────────────────────
  const allWords = shuffle([...perfectWords, ...multiWords, ...assonWords, ...slantWords])
    .filter((w, i, arr) => arr.findIndex(x => x.word === w.word) === i);

  const chainThemes = [
    { theme: "Ambition", vibe: "smooth" },
    { theme: "Straße", vibe: "street" },
    { theme: "Flex", vibe: "flex" },
    { theme: "Deep", vibe: "emotional" },
  ];

  const chains = chainThemes.map((ct, i) => {
    const start = i * 4;
    const words = allWords.slice(start, start + 4);
    if (words.length < 2) return null;
    return {
      id: i + 1,
      theme: ct.theme,
      vibe: ct.vibe,
      words: words.map(w => w.word),
      langs: words.map(w => w.lang),
      rhymeLogic: `Alle Wörter teilen den Reim-Anker "${phonetic.rhymeAnchor}" — ideal für einen 4-Bar-Loop.`,
      barExample: `${words[0]?.word ?? ""} / ${words[1]?.word ?? ""} — ich bring das, keine ${words[2]?.word ?? ""} / ${words[3]?.word ?? ""}`,
    };
  }).filter(Boolean);

  const proTip = `Nutz "${phonetic.rhymeAnchor}" am Zeilenende — dann kannst du 4-8 Bars mit demselben Klang spielen wie J Hus in seinen Hooks. Wechsle zwischen Perfect und Slant für natürlichen Flow.`;

  return { input: inputWord, phonetic, groups, chains, proTip };
}

// ─── PILL COMPONENT ───────────────────────────────────────────────────────────

function Pill({ w, onCopy, isCopied }) {
  const [hov, setHov] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const c = vc(w.vibe);
  const flag = w.lang === "en" ? "🇬🇧" : w.lang === "denglisch" ? "⚡" : "🇩🇪";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => onCopy(w.word)}
        onMouseEnter={() => { setHov(true); setShowTip(true); }}
        onMouseLeave={() => { setHov(false); setShowTip(false); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 13px",
          background: hov ? c.bg : "rgba(255,255,255,0.04)",
          border: `1.5px solid ${hov ? c.border : "rgba(255,255,255,0.09)"}`,
          borderRadius: 10, cursor: "pointer",
          transform: hov ? "translateY(-2px)" : "none",
          boxShadow: hov ? `0 4px 14px ${c.border}` : "none",
          transition: "all 0.15s", position: "relative", overflow: "hidden",
        }}
      >
        <span style={{ fontSize: 11 }}>{flag}</span>
        <span style={{ fontFamily: "'Courier New',monospace", fontSize: 14, fontWeight: 700, color: hov ? c.text : "#ccc" }}>
          {w.word}
        </span>
        {w.stressPattern && (
          <span style={{ fontSize: 8, color: "#444", fontFamily: "'Courier New',monospace", display: hov ? "inline" : "none" }}>
            {w.stressPattern}
          </span>
        )}
        <span style={{
          fontSize: 9, padding: "1px 5px", borderRadius: 4,
          background: c.bg, color: c.text, fontFamily: "'Courier New',monospace",
          fontWeight: 700, opacity: hov ? 1 : 0.4, transition: "opacity 0.15s",
        }}>{w.vibe}</span>
        {isCopied && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(122,196,122,0.25)", color: "#7AC47A",
            fontSize: 13, fontWeight: 700,
          }}>✓</div>
        )}
      </button>
      {showTip && w.context && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 7px)", left: "50%",
          transform: "translateX(-50%)",
          background: "#1c1c22", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "7px 12px",
          fontSize: 11, color: "#aaa", lineHeight: 1.5,
          whiteSpace: "normal", maxWidth: 200, minWidth: 140,
          zIndex: 50, pointerEvents: "none",
          boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
        }}>
          {w.context}
        </div>
      )}
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
        {open && chain.barExample && (
          <div style={{
            marginTop: 8, padding: "10px 14px",
            background: "#060609", border: `1px solid ${c.border}`,
            borderRadius: 8, fontFamily: "'Courier New',monospace",
            fontSize: 13, color: "#D4A843", lineHeight: 1.8, fontStyle: "italic",
          }}>
            "{chain.barExample}"
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function RhymeFinder() {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("both");
  const [chainMode, setChainMode] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copiedWord, setCopiedWord] = useState(null);
  const [activeGroup, setActiveGroup] = useState(0);
  const [view, setView] = useState("words");
  const inputRef = useRef();

  function copyWord(w) {
    navigator.clipboard.writeText(w).catch(() => {});
    setCopiedWord(w);
    setTimeout(() => setCopiedWord(null), 1200);
  }

  const search = useCallback(async (q) => {
    const searchQuery = (q ?? query).trim();
    if (!searchQuery) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setActiveGroup(0);

    try {
      const data = await buildResults(searchQuery, lang);
      setResult(data);
      setView("words");
    } catch (e) {
      setErrorMsg(`Fehler: ${e.message} — versuch's nochmal`);
    } finally {
      setLoading(false);
    }
  }, [query, lang]);

  function loadExample(w) {
    setQuery(w);
    search(w);
  }

  const langColor = lang === "de" ? "#E05A5A" : lang === "en" ? "#5A9FE0" : "#D4A843";
  const examples = EXAMPLES[lang] || EXAMPLES.both;

  return (
    <div style={{ minHeight: "100vh", background: "#0C0C10", color: "#E0E0E0", fontFamily: "'Georgia',serif", paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(180deg,#0c0c18 0%,#0C0C10 100%)",
        borderBottom: "1px solid rgba(90,159,224,0.1)",
        padding: "32px 20px 26px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -20, right: -10, fontSize: 120, fontWeight: 900,
          color: "rgba(90,159,224,0.035)", fontFamily: "'Courier New',monospace",
          userSelect: "none", letterSpacing: -4,
        }}>RHYME</div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#5A9FE0", fontFamily: "'Courier New',monospace", marginBottom: 8 }}>
            ◆ PHONETIC RHYME FINDER ◆ J HUS STYLE ◆ KOSTENLOS
          </div>
          <h1 style={{ fontSize: "clamp(24px,5vw,40px)", fontWeight: 400, margin: "0 0 4px", color: "#fff" }}>
            Reim-Finder
          </h1>
          <p style={{ color: "#444", fontSize: 13, margin: 0, fontStyle: "italic" }}>
            Datamuse · Phonetisch · Denglisch · Ketten-Modus · Kein API Key nötig
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "22px 16px" }}>

        {/* SEARCH BOX */}
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: 18, marginBottom: 18,
        }}>
          {/* Controls */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6 }}>
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
                  fontFamily: "'Courier New',monospace", fontSize: 11, fontWeight: 700,
                  transition: "all 0.15s",
                }}>{lo.label}</button>
              ))}
            </div>
            <button onClick={() => setChainMode(v => !v)} style={{
              padding: "7px 14px",
              background: chainMode ? "rgba(212,168,67,0.12)" : "rgba(255,255,255,0.04)",
              border: `1.5px solid ${chainMode ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 8, cursor: "pointer",
              color: chainMode ? "#D4A843" : "#555",
              fontFamily: "'Courier New',monospace", fontSize: 11, fontWeight: 700,
              transition: "all 0.15s",
            }}>
              {chainMode ? "⛓ Ketten AN" : "⛓ Ketten AUS"}
            </button>
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="Wort oder Phrase… z.B. 'Motivation' oder 'charismatic'"
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
            <button
              onClick={() => search()}
              disabled={loading || !query.trim()}
              style={{
                padding: "0 22px",
                background: loading || !query.trim()
                  ? "rgba(255,255,255,0.06)"
                  : `linear-gradient(135deg, ${langColor}, ${langColor}99)`,
                border: "none", borderRadius: 10,
                color: loading || !query.trim() ? "#444" : "#000",
                fontFamily: "'Courier New',monospace",
                fontSize: 12, fontWeight: 800, letterSpacing: 1,
                cursor: loading ? "wait" : "pointer",
                transition: "all 0.15s", minWidth: 90,
              }}
            >{loading ? "..." : "SUCHEN"}</button>
          </div>

          {/* Examples */}
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 9, color: "#333", letterSpacing: 2, fontFamily: "'Courier New',monospace", marginRight: 10 }}>BEISPIELE</span>
            {examples.map(ex => (
              <button key={ex} onClick={() => loadExample(ex)} style={{
                marginRight: 6, marginBottom: 4, padding: "4px 10px",
                background: "none", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 5, cursor: "pointer",
                color: "#555", fontSize: 11, fontFamily: "'Courier New',monospace",
                transition: "all 0.15s",
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
              border: "2px solid rgba(90,159,224,0.1)",
              borderTop: "2px solid #5A9FE0",
              borderRadius: "50%", animation: "spin .8s linear infinite", marginBottom: 12,
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ color: "#5A9FE0", fontSize: 12, fontFamily: "'Courier New',monospace" }}>
              Analysiere Phoneme &amp; Betonung…
            </div>
          </div>
        )}

        {/* ERROR */}
        {errorMsg && (
          <div style={{
            padding: 16, marginBottom: 16,
            background: "rgba(224,90,90,0.08)", border: "1px solid rgba(224,90,90,0.2)",
            borderRadius: 10, color: "#E05A5A", fontSize: 13, fontFamily: "'Courier New',monospace",
          }}>
            {errorMsg}
          </div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <div>
            {/* Phonetic header */}
            <div style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(90,159,224,0.18)",
              borderRadius: 14, padding: 18, marginBottom: 18,
            }}>
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
                  <div key={i} style={{
                    padding: "7px 13px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 8,
                  }}>
                    <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, fontFamily: "'Courier New',monospace", marginBottom: 3 }}>{x.label}</div>
                    <div style={{ fontSize: 13, color: x.color, fontFamily: "'Courier New',monospace", fontWeight: 700 }}>{x.val}</div>
                  </div>
                ))}
              </div>
              {result.proTip && (
                <div style={{
                  padding: "9px 13px",
                  background: "rgba(212,168,67,0.07)", border: "1px solid rgba(212,168,67,0.15)",
                  borderRadius: 8, fontSize: 12, color: "#D4A843", fontStyle: "italic", lineHeight: 1.7,
                }}>
                  💡 {result.proTip}
                </div>
              )}
            </div>

            {/* View switcher */}
            <div style={{ display: "flex", gap: 0, marginBottom: 18, width: "fit-content", borderRadius: 9, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[
                { id: "words",  label: `Reimwörter (${result.groups?.reduce((a,g)=>a+(g.words?.length||0),0)||0})` },
                { id: "chains", label: `Ketten (${result.chains?.length||0})` },
              ].map(v => (
                <button key={v.id} onClick={() => setView(v.id)} style={{
                  padding: "9px 18px", background: view===v.id ? "rgba(90,159,224,0.12)" : "rgba(255,255,255,0.03)",
                  border: "none", color: view===v.id ? "#5A9FE0" : "#555",
                  fontFamily: "'Courier New',monospace", fontSize: 11, letterSpacing: 1,
                  cursor: "pointer", fontWeight: view===v.id ? 700 : 400,
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                }}>{v.label}</button>
              ))}
            </div>

            {/* WORDS VIEW */}
            {view === "words" && (
              <div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
                  {result.groups?.map((g, i) => {
                    const c = tColor(g.type);
                    return (
                      <button key={i} onClick={() => setActiveGroup(i)} style={{
                        padding: "7px 14px",
                        background: activeGroup===i ? `${c}22` : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${activeGroup===i ? c : "rgba(255,255,255,0.07)"}`,
                        borderRadius: 9, cursor: "pointer",
                        color: activeGroup===i ? c : "#666",
                        fontFamily: "'Courier New',monospace",
                        fontSize: 11, fontWeight: 700, transition: "all 0.15s",
                      }}>
                        {g.type} <span style={{ opacity: 0.5 }}>({g.words?.length})</span>
                      </button>
                    );
                  })}
                </div>

                {result.groups?.[activeGroup] && (() => {
                  const g = result.groups[activeGroup];
                  const c = tColor(g.type);
                  return (
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 5,
                          background: `${c}20`, border: `1px solid ${c}44`, color: c,
                          fontSize: 10, fontFamily: "'Courier New',monospace", fontWeight: 700, letterSpacing: 1,
                        }}>{g.type}</span>
                        <div style={{ display: "flex", gap: 3 }}>
                          {Array.from({length:5}).map((_,qi) => (
                            <div key={qi} style={{ width:8, height:8, borderRadius:2, background: qi<(g.quality||3) ? c : "rgba(255,255,255,0.08)" }} />
                          ))}
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: "#555", marginBottom: 14, lineHeight: 1.7, fontStyle: "italic" }}>
                        {g.description}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {g.words?.map((w, wi) => (
                          <Pill key={wi} w={w} onCopy={copyWord} isCopied={copiedWord===w.word} />
                        ))}
                      </div>
                      <div style={{ marginTop: 10, fontSize: 10, color: "#2a2a2a", fontFamily: "'Courier New',monospace" }}>
                        Hover = Kontext · Klick = Kopieren
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* CHAINS VIEW */}
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
                {(!result.chains || result.chains.length === 0) && (
                  <div style={{ color: "#444", fontSize: 13, fontFamily: "'Courier New',monospace", padding: 20 }}>
                    Ketten-Modus war beim Suchen deaktiviert. Suche nochmal mit ⛓ Ketten AN.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
