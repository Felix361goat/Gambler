// J Hus phonetic style data — analysed from: Did You See, Bigger Picture,
// Common Sense, Fisherman, Must Be, Who Told You, La Vida, Spirit, Daily Duppy

// ─── TOP RHYME ANCHORS (frequency-ranked) ────────────────────────────────────
export const JHUS_RHYME_ANCHORS = [
  { anchor: "-ay",     examples: ["way","say","day","pray","stay","play","sway","they","display"],       germanEq: ["Traum","Bahn","klar","gar"],               vibe: "smooth"    },
  { anchor: "-ight",   examples: ["right","night","fight","light","might","tight","sight","bright"],     germanEq: ["Nacht","Macht","echt","Recht"],            vibe: "hard"      },
  { anchor: "-ation",  examples: ["motivation","situation","dedication","sensation","foundation"],       germanEq: ["Motivation","Generation","Situation"],    vibe: "smooth"    },
  { anchor: "-essed",  examples: ["blessed","stressed","pressed","rest","best","test","chest"],         germanEq: ["fest","Rest","best","Nest"],               vibe: "afroswing" },
  { anchor: "-eal",    examples: ["real","feel","deal","steal","reveal","heal","appeal","conceal"],     germanEq: ["Ziel","Spiel","viel","Stil"],              vibe: "emotional" },
  { anchor: "-ow",     examples: ["flow","know","show","grow","go","slow","below","glow"],              germanEq: ["so","froh","roh","Strom"],                 vibe: "smooth"    },
  { anchor: "-ife",    examples: ["life","wife","knife","strife","thrive"],                             germanEq: ["Trieb","tief","Brief"],                   vibe: "emotional" },
  { anchor: "-ound",   examples: ["around","sound","ground","found","bound","profound","surround"],     germanEq: ["rund","Grund","Mund","Stund"],             vibe: "street"    },
  { anchor: "-ong",    examples: ["strong","long","song","wrong","belong","along","strong"],            germanEq: ["lang","Gang","Klang","bang"],              vibe: "hard"      },
  { anchor: "-ee",     examples: ["free","be","see","me","energy","money","honey","family"],            germanEq: ["nie","wie","Ziel","Liebe"],                vibe: "light"     },
  { anchor: "-ive",    examples: ["alive","survive","thrive","drive","strive","arrive","vibe"],         germanEq: ["Trieb","tief","Lieb"],                    vibe: "afroswing" },
  { anchor: "-eed",    examples: ["need","greed","speed","feed","bleed","freed","indeed"],              germanEq: ["Glied","Lied","Ried"],                    vibe: "dark"      },
  { anchor: "-ove",    examples: ["love","above","tough","enough","rough","stuff","done"],              germanEq: ["Stoff","Hof","Ruf"],                      vibe: "emotional" },
  { anchor: "-ine",    examples: ["mine","shine","divine","fine","line","sign","grind","time"],         germanEq: ["rein","Schein","mein","kein"],             vibe: "melodic"   },
  { anchor: "-ain",    examples: ["pain","rain","gain","chain","remain","explain","brain","maintain"],  germanEq: ["Schein","Bein","kein","mein"],             vibe: "emotional" },
];

// ─── J HUS VOCABULARY (english + denglisch) ──────────────────────────────────
export const JHUS_VOCAB = [
  // Spiritual / Blessing
  { word: "blessed",     lang: "en", vibe: "afroswing", context: "I stay blessed, no stress in my chest" },
  { word: "spirit",      lang: "en", vibe: "afroswing", context: "my spirit's on a higher frequency" },
  { word: "divine",      lang: "en", vibe: "afroswing", context: "feeling divine, this life is mine" },
  { word: "pray",        lang: "en", vibe: "afroswing", context: "I pray every day, come what may" },
  { word: "faith",       lang: "en", vibe: "afroswing", context: "got faith in my chest, I'm blessed" },
  { word: "grace",       lang: "en", vibe: "afroswing", context: "move with grace, win the race" },
  { word: "grateful",    lang: "en", vibe: "afroswing", context: "grateful for life, for my wife" },
  { word: "energy",      lang: "en", vibe: "afroswing", context: "higher energy, feel it with me" },
  { word: "frequency",   lang: "en", vibe: "smooth",    context: "on a different frequency, stay free" },
  { word: "universe",    lang: "en", vibe: "melodic",   context: "the universe aligned for mine" },

  // Street / Hood
  { word: "endz",        lang: "en", vibe: "street",    context: "came up from the endz, now I flex" },
  { word: "mandem",      lang: "en", vibe: "street",    context: "my mandem ride with me always" },
  { word: "ting",        lang: "en", vibe: "street",    context: "every little ting gonna be alright" },
  { word: "bruv",        lang: "en", vibe: "street",    context: "trust me bruv, I grind every day" },
  { word: "bare",        lang: "en", vibe: "street",    context: "got bare flows, they can't handle" },
  { word: "link",        lang: "en", vibe: "street",    context: "link with me, we move differently" },
  { word: "move",        lang: "en", vibe: "street",    context: "know how to move, never lose" },
  { word: "bredren",     lang: "en", vibe: "street",    context: "my bredren hold it down from the ground" },
  { word: "gyallis",     lang: "en", vibe: "smooth",    context: "gyallis ting, she know what I bring" },
  { word: "wifey",       lang: "en", vibe: "emotional", context: "my wifey by my side, she my ride" },

  // Flow / Music
  { word: "flow",        lang: "en", vibe: "smooth",    context: "my flow go hard, from the start" },
  { word: "bars",        lang: "en", vibe: "hard",      context: "these bars hit different, stay winning" },
  { word: "wave",        lang: "en", vibe: "smooth",    context: "riding my wave, feeling brave" },
  { word: "vibe",        lang: "en", vibe: "afroswing", context: "catch my vibe, feel alive" },
  { word: "tune",        lang: "en", vibe: "melodic",   context: "this tune go hard, from the start" },
  { word: "rhythm",      lang: "en", vibe: "melodic",   context: "feel the rhythm, feel the system" },
  { word: "frequency",   lang: "en", vibe: "smooth",    context: "locked on your frequency, stay free" },
  { word: "melody",      lang: "en", vibe: "melodic",   context: "my melody hits differently" },

  // Success / Money
  { word: "racks",       lang: "en", vibe: "flex",      context: "stack racks, never look back" },
  { word: "bag",         lang: "en", vibe: "flex",      context: "secure the bag, never lag" },
  { word: "paper",       lang: "en", vibe: "flex",      context: "chasing paper every single day" },
  { word: "flip",        lang: "en", vibe: "flex",      context: "flip it, I don't quit it" },
  { word: "drip",        lang: "en", vibe: "flex",      context: "drip too hard, you know I'm scarred" },
  { word: "sauce",       lang: "en", vibe: "flex",      context: "got sauce, stay on course" },
  { word: "secure",      lang: "en", vibe: "smooth",    context: "stay secure, keep it pure" },
  { word: "winning",     lang: "en", vibe: "smooth",    context: "stay winning, from the beginning" },

  // Emotion / Deep
  { word: "real",        lang: "en", vibe: "hard",      context: "stay real, you know how I feel" },
  { word: "feel",        lang: "en", vibe: "emotional", context: "you don't know how I feel, keep it real" },
  { word: "pain",        lang: "en", vibe: "dark",      context: "turned my pain into gain, in the rain" },
  { word: "struggle",    lang: "en", vibe: "dark",      context: "from the struggle, came the hustle" },
  { word: "survive",     lang: "en", vibe: "hard",      context: "I survive and I thrive, feel alive" },
  { word: "thrive",      lang: "en", vibe: "smooth",    context: "watch me thrive and survive, feel alive" },
  { word: "alive",       lang: "en", vibe: "afroswing", context: "feel alive, catch my vibe" },
  { word: "journey",     lang: "en", vibe: "emotional", context: "this journey ain't easy, trust me" },

  // Denglisch bridges
  { word: "blessed sein", lang: "denglisch", vibe: "afroswing", context: "ich bin blessed, kein Stress" },
  { word: "auf der Wave", lang: "denglisch", vibe: "smooth",    context: "auf der Wave, ich bleib brave" },
  { word: "Vibes fühlen", lang: "denglisch", vibe: "afroswing", context: "ich fühl die Vibes, nichts bleibt" },
  { word: "real bleiben", lang: "denglisch", vibe: "hard",      context: "bleib real, du weißt wie ich fühl" },
  { word: "my Mandem",   lang: "denglisch", vibe: "street",    context: "my Mandem hält den Block, kein Schock" },
  { word: "Spirit haben", lang: "denglisch", vibe: "afroswing", context: "hab Spirit, kein Limit" },
  { word: "Grind never stops", lang: "denglisch", vibe: "hard", context: "der Grind stoppt nie, glaub mir" },
  { word: "Flow on point", lang: "denglisch", vibe: "smooth",   context: "mein Flow on point, kein Joint" },
];

// ─── J HUS STYLE RHYME CHAINS ────────────────────────────────────────────────
export const JHUS_CHAINS = [
  {
    id: 1, theme: "Blessed", vibe: "afroswing",
    words: ["blessed", "stressed", "rest", "best"],
    langs: ["en", "en", "en", "en"],
    rhymeLogic: "Klassische J Hus -essed Assonance — sanft aber tief, wie in 'Spirit'",
    barExample: "I stay blessed, never stressed, find your rest, be the best",
  },
  {
    id: 2, theme: "Motivation", vibe: "smooth",
    words: ["Motivation", "Situation", "Generation", "dedication"],
    langs: ["de", "de", "de", "en"],
    rhymeLogic: "-ation Reim-Anker: funktioniert auf Englisch UND Deutsch — J Hus Hookformel",
    barExample: "pure Motivation, jede Situation, für meine Generation, that's dedication",
  },
  {
    id: 3, theme: "Alive", vibe: "afroswing",
    words: ["alive", "survive", "thrive", "vibe"],
    langs: ["en", "en", "en", "en"],
    rhymeLogic: "-ive/-ibe Assonance — J Hus benutzt diese Kette in fast jedem Hook",
    barExample: "feel alive, I survive, watch me thrive, catch my vibe",
  },
  {
    id: 4, theme: "Real", vibe: "hard",
    words: ["real bleiben", "Ziel", "Spiel", "feel"],
    langs: ["denglisch", "de", "de", "en"],
    rhymeLogic: "Deutsch -iel und Englisch -eal sind phonetisch identisch — perfekte Denglisch-Brücke",
    barExample: "ich bleib real, kenn mein Ziel, das ist mein Spiel, you know how I feel",
  },
  {
    id: 5, theme: "Hustle", vibe: "street",
    words: ["Nacht", "gemacht", "Macht", "bedacht"],
    langs: ["de", "de", "de", "de"],
    rhymeLogic: "-acht Reimfamilie: deutsch äquivalent zu J Hus -ight chains (night/right/tight)",
    barExample: "durch die Nacht, alles selbst gemacht, ich hab die Macht, wohl bedacht",
  },
  {
    id: 6, theme: "Flow", vibe: "smooth",
    words: ["flow", "know", "show", "grow"],
    langs: ["en", "en", "en", "en"],
    rhymeLogic: "-ow Assonance — J Hus Lieblingsmuster für melodische Verse",
    barExample: "watch my flow, let 'em know, steal the show, watch me grow",
  },
  {
    id: 7, theme: "Spiritual", vibe: "afroswing",
    words: ["spirit", "limit", "in it", "win it"],
    langs: ["en", "en", "en", "en"],
    rhymeLogic: "Multi-Syllabic -irit/-imit — J Hus typisches 2-Silben-Reim-Spiel",
    barExample: "got spirit, no limit, stay in it, gonna win it",
  },
  {
    id: 8, theme: "Ambition DE", vibe: "smooth",
    words: ["Scheine", "meine", "reine", "alleine"],
    langs: ["de", "de", "de", "de"],
    rhymeLogic: "-eine entspricht J Hus -ine Ketten (mine/shine/divine) — identische Phonetik",
    barExample: "ich zähl meine Scheine, das sind meine, mit reiner Energie, niemals alleine",
  },
];

// ─── PRO TIPS (J HUS STYLE) ──────────────────────────────────────────────────
export const JHUS_PRO_TIPS = {
  "ation":  "J Hus benutzt -ation in fast jedem Hook: 'motivation/situation/dedication' — klingt smooth und international.",
  "essed":  "blessed/stressed/rest/best: J Hus' emotionalste Kette. Spiritualität trifft Straße.",
  "ight":   "right/night/tight/might = J Hus Confidence-Mode. Deutsch: Nacht/Macht/gemacht.",
  "ow":     "flow/know/show/grow: sein melodischer Default. Langsam, smooth, catchy.",
  "ive":    "alive/survive/thrive/vibe: seine afroswing Energie-Kette — perfekt für Hooks.",
  "eal":    "real/feel/deal/steal: emotional und stark. Deutsch: Ziel/Spiel/viel funktioniert identisch.",
  "eine":   "Scheine/meine/reine = deutsches Äquivalent zu J Hus -ine (mine/shine/divine).",
  "ieren":  "Investieren/kassieren/regieren = J Hus -ation Style auf Deutsch — smooth und lang.",
  "default": "Nutz den Reim-Anker am Zeilenende und variiere ihn durch 4-8 Bars — nie exact gleich, immer Assonance.",
};

// ─── FLOW RULES ──────────────────────────────────────────────────────────────
export const JHUS_FLOW_RULES = [
  "Assonance über perfekte Reime: gleiche Vokale, egal die Konsonanten.",
  "Multi-Syllabic: 2+ Silben reimen — 'motivation/situation' schlägt immer 'cat/hat'.",
  "Interne Reime: Mitte und Ende der Bar reimen — doppelter Effekt.",
  "Melodic Hook → Hard Verse → Melodic Hook: Wechsel schafft Spannung.",
  "Spirituelles Vokabular (blessed/spirit/divine) gibt tiefe ohne Aggression.",
  "Gambian Phonetik: 'dem' statt 'them', gedehnte Vokale — klingt smoother.",
  "Delayed Rhyme: Bar 1 setzt das Wort, Bar 4 löst es auf — Spannung aufbauen.",
  "Denglisch: Englischer Reim-Anker + deutsches Inhaltswort = authentisch und einzigartig.",
];
