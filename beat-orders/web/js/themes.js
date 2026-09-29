// Song-writing prompts: a theme that fits the beat's genre, plus a few
// constraints that make writing easier (perspective, must-use word,
// opening line, emotion). Used for vocal orders and client song requests.

export const THEME_BANK = {
  liebe: {
    label: 'Liebe',
    themes: ['frisch verliebt und du willst es niemandem sagen', 'Situationship – nix Festes, aber doch alles', 'die eine, die weggezogen ist (Fernbeziehung)',
      'Herzschmerz um 3 Uhr nachts', 'toxische Ex, die immer wieder schreibt', 'erstes Date, das komplett schiefgeht (aber schön)', 'Liebe auf den zweiten Blick',
      'du bist zu stolz, um „sorry“ zu sagen', 'sie ist der Grund, warum du früher heimgehst'],
  },
  geld: {
    label: 'Geld & Hustle',
    themes: ['vom Nichts zum ersten fetten Gehalt', 'Hustle neben dem 9-to-5', 'Geldsorgen am Monatsende', 'der erste Traumkauf – und was er wirklich bedeutet',
      'Neider, die erst da sind, seit es läuft', 'Mama ein Haus kaufen', 'Flexen – aber ehrlich, was dahinter steckt', 'Nachtschicht für den Traum'],
  },
  leben: {
    label: 'Lebensgeschichte',
    themes: ['deine Kindheit in einem Bild', 'der Tag, an dem sich alles geändert hat', 'Freunde, die man auf dem Weg verloren hat', 'ein Brief an dein 15-jähriges Ich',
      'Umzug in eine neue Stadt', 'was deine Eltern nie erfahren haben', 'dein Opa / deine Oma und was du von ihnen gelernt hast', 'der erste Job und die erste Kündigung'],
  },
  strasse: {
    label: 'Straße & Stadt',
    themes: ['Nachts durch Wien – leere U-Bahn, volle Gedanken', 'der Block, der dich großgezogen hat', 'Loyalität: wer bleibt, wenn’s ernst wird', 'Storytelling: ein Abend, der eskaliert',
      'zwischen Training, Arbeit und Studio', 'Sirenen im Hintergrund, Ziele im Kopf', 'der Weg von der Parkbank bis zur Bühne'],
  },
  party: {
    label: 'Party & Vibes',
    themes: ['Freitagabend, Handy aus, Leben an', 'Sommer, Balkon, Sonnenuntergang', 'Club, Blickkontakt, keine Worte', 'Urlaub, der nie enden soll',
      'Geburtstag, aber du bist der DJ', 'Roadtrip mit den Jungs', 'Afterhour-Gedanken um 6 Uhr früh'],
  },
  motivation: {
    label: 'Motivation',
    themes: ['Selbstzweifel besiegen', 'allen beweisen, dass es geht', 'Disziplin, wenn keiner zuschaut', 'nach einer Niederlage wieder aufstehen',
      'Training, Schweiß und Ziele', 'Gespräch mit dem Spiegel', 'heute ist Tag 1'],
  },
  story: {
    label: 'Storytelling',
    themes: ['eine erfundene Figur, die alles riskiert', 'ein Heist, der schiefgeht', 'erzähl einen Tag aus Sicht deines Handys', 'zwei Menschen, eine Nacht, zwei Perspektiven',
      'ein Brief, der nie abgeschickt wurde', 'Zeitreise: du triffst dich mit 40'],
  },
  reflexion: {
    label: 'Reflexion',
    themes: ['mentale Gesundheit – ehrlich, ohne Filter', 'Social Media vs. echtes Leben', 'Glaube, Zweifel und Hoffnung', 'Zukunftsangst mit Mitte 20',
      'Dankbarkeit für die kleinen Dinge', 'was bleibt, wenn der Hype weg ist'],
  },
  fun: {
    label: 'Fun',
    themes: ['ein Liebeslied an den Döner', 'Diss-Track gegen deinen Wecker', 'Hymne auf dein Lieblingsgetränk', 'dein Haustier ist der eigentliche Star',
      'Überlebensguide für Montage', 'du bist der Hauptcharakter in deinem Lieblingsgame'],
  },
};

// Which themes suit which sound (rough, not strict).
const GENRE_THEMES = {
  'UK Afroswing': ['liebe', 'party', 'geld'], 'Afrobeats': ['liebe', 'party'], 'Amapiano': ['party', 'liebe'], 'Dancehall': ['party', 'liebe'],
  'R&B': ['liebe', 'reflexion'], 'Pop': ['liebe', 'party', 'motivation'],
  'UK Drill': ['strasse', 'story', 'geld'], 'NY Drill': ['strasse', 'story'], 'Drill': ['strasse', 'geld'], 'Grime': ['strasse', 'fun'],
  'Detroit': ['geld', 'fun', 'party'], 'Jerk': ['party', 'fun', 'geld'], 'Plugg': ['liebe', 'reflexion', 'geld'], 'Rage': ['motivation', 'party'],
  'Trap': ['geld', 'motivation', 'strasse'], 'Memphis': ['strasse', 'story'], 'Phonk': ['motivation', 'strasse'], 'Hyperpop': ['fun', 'reflexion'],
  'Deutschrap': ['leben', 'strasse', 'motivation'], 'Boom Bap': ['leben', 'reflexion', 'story'], 'Lo-Fi': ['reflexion', 'leben'],
  'West Coast': ['party', 'story'], 'Jersey Club': ['party', 'fun'], 'UK Garage': ['party', 'liebe'],
  'House': ['party', 'liebe'], 'Indie House': ['party', 'reflexion', 'liebe'], 'Indie Rock': ['leben', 'reflexion', 'liebe'],
};

const PERSPECTIVES = ['aus deiner eigenen Sicht (Ich)', 'als würdest du direkt mit jemandem reden (Du)', 'aus Sicht einer anderen Person (Er/Sie)', 'als Dialog zwischen zwei Stimmen'];
const MUST_WORDS = ['Mitternacht', 'Spiegel', 'Regen', 'Schlüssel', 'Uhr', 'Neon', 'Asphalt', 'Gold', 'Ozean', 'Papier', 'Blaulicht', 'Treppenhaus', 'Sonnenbrille', 'Parfum', 'Rückspiegel', 'Kopfhörer'];
const OPENERS = ['„Ich hab’s nie jemandem erzählt, aber…“', '„Drei Uhr früh und das Handy leuchtet…“', '„Weißt du noch, damals…“', '„Sie sagen, ich hab mich verändert…“',
  '„Kein Schlaf, nur Pläne…“', '„Der Bass wackelt, die Stadt schläft…“', '„Wenn ich zurückschau…“', '„Alles fing an mit einem Anruf…“'];
const EMOTIONS = ['euphorisch', 'melancholisch', 'wütend, aber kontrolliert', 'selbstbewusst', 'verletzlich', 'nostalgisch', 'verspielt', 'hungrig'];

const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Returns { category, theme, perspective, word, opener, emotion }.
export function songPrompt(genre) {
  const cats = GENRE_THEMES[genre] || Object.keys(THEME_BANK);
  // Mostly fitting, sometimes a total curveball (keeps writing fresh).
  const cat = Math.random() < 0.8 ? pick(cats) : pick(Object.keys(THEME_BANK));
  return {
    category: THEME_BANK[cat].label,
    theme: pick(THEME_BANK[cat].themes),
    perspective: pick(PERSPECTIVES),
    word: pick(MUST_WORDS),
    opener: pick(OPENERS),
    emotion: pick(EMOTIONS),
  };
}

// Just a short theme (for client song/hook requests).
export const songTheme = (genre) => songPrompt(genre).theme;
