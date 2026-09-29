import { PEOPLE } from './people.js';

// ~100 customers in 12 archetypes – each with its own (very exaggerated)
// writing style, budget habits, replies and a generated cartoon avatar.
//
// Templates use: {what} {genre} {bpm} {mood} {key} {i1} {i2} {theme} {voice} {name}
// `extra` is picked by order type: inst (beats/remixes), theme (songs/hooks), voice (vocal chains).

export const ARCHETYPES = {
  chaya: {
    label: 'Baddie', mult: 1.2, note: '(vom Sugar Daddy 💸)',
    names: ['Candy Diamond|f', 'Destiny Rose|f', 'Honey Bunz|f', 'Cherry Velvet|f', 'Mercedes Gold|f', 'Bambi Blaze|f',
      'Crystal Chanel|f', 'Jasmine Juicy|f', 'Nikita Glow|f', 'Chanelle Babyface|f', 'Roxy Peaches|f', 'Scarlett Sugar|f'],
    what: { instrumental: 'nen beat', full_song: 'nen ganzen song', vocal_chain: 'ne vocal chain', hook: 'ne hook', remix: 'nen remix' },
    greet: ['heyyy babe 💅✨', 'omg hiii bestie 😘', 'hallooo producer-schatz 💋', 'babe. BABE. 🙀'],
    lines: [
      'ich brauch {what} und der muss sooo {mood} sein, literally {genre} vibes, {bpm} bpm periodt 💅',
      'slayyy, gib mir {what} im {genre}-style, der muss härter bouncen als mein BBL nach pilates 🍑✨',
      'ich will {what}, bei dem mein ex weint und seine neue mitsingt 😘 {genre}, {mood}, no cap',
      'mach mir {what} so dirty, dass ich danach duschen muss 🚿😏 {genre}, {bpm} bpm, bestie trust me',
      'ich brauch {what}, der so heiß ist, dass mein handy überhitzt 🥵 {genre}, {mood}, und der bass so tief wie mein ausschnitt 😮‍💨',
    ],
    extra: {
      inst: ['{i1} und {i2} bitte, that is non-negotiable bestie 💁‍♀️', 'mit {i1}, weil {i1} ist so me-coded 💖'],
      theme: ['thema: {theme}, aber make it baddie 😈', 'es soll um {theme} gehen, aber so hot-girl-mäßig 🔥'],
      voice: ['meine stimme ist {voice}, nur viel sexier 😌', 'ich klinge wie {voice} – mach mich zur queen 👑'],
    },
    outro: ['love u, slay 💅', 'xoxo 💋', 'kuss auf die stirn 😘 (und sonst nix, calm down)', 'du bist mein lieblings-producer, don’t tell the others 🤫', 'ok bye, muss zu meinem nail appointment 💅'],
    replies: {
      great: ['babe ich hab das beim twerken gehört und bin fast umgefallen 🍑😵‍💫 10/10 slay',
        'OMG BABE 😭😭 das ist so slay, ich hab geschrien 💅✨', 'periodt!!! mein BBL hat automatisch angefangen zu twerken 🍑🔥', 'ich bin obsessed, du bist literally ein genie 😍'],
      good: ['cute! nicht ganz iconic, aber cute 💖', 'okayyy ich fühl’s, kommt in meine story 📱'],
      late: ['babe… zu spät ist nicht slay 😒 aber klingt gut ok', 'hab so lang gewartet, meine nägel sind rausgewachsen 💅 aber nice'],
    },
    look: { bg: ['#ff6fb5', '#c86bfa', '#ff8fab'], hair: ['long'], hairColor: ['#f5d06f', '#1c1c1c', '#6b3e26', '#ff77c8', '#e8e0d0'], lashes: true, lips: true, hoops: true, blush: true, shirt: ['#ff2d95', '#111', '#f5f5f5'] },
  },

  rentner: {
    label: 'Pensionist:in', mult: 0.8, note: '(bar im Kuvert)',
    names: ['Gerhart Huber|m', 'Gertrude Pfeiffer|f', 'Herbert Wurzinger|m', 'Hildegard Moser|f', 'Waltraud Novak|f', 'Friedrich Brandl|m',
      'Erwin Leitner|m', 'Ingeborg Sommer|f', 'Rudolf Hainz|m', 'Brunhilde Kraus|f', 'Otto Grünwald|m', 'Elfriede Schober|f'],
    what: { instrumental: 'eine Instrumentalmusik', full_song: 'ein ganzes Lied', vocal_chain: 'eine sogenannte „Vokal-Kette“', hook: 'einen Refrain', remix: 'einen Remix (so sagt mein Enkel)' },
    greet: ['Sehr geehrter Herr Produzent,', 'Grüß Gott junger Mann!!', 'Hallo, hier spricht {name}.', 'Guten Tag,'],
    lines: [
      'ich hätte gerne {what} im Stil „{genre}“, mein Enkel sagt, das ist modern. Nicht zu laut bitte, {bpm} Schläge pro Minute wie mein Herzschrittmacher.',
      'für den Seniorennachmittag im Pfarrsaal benötige ich {what}. Stilrichtung {genre}, Stimmung {mood}. BITTE NICHT ZU VIEL BASS, sonst wackeln die Gläser.',
      'ich habe Sie im Internet gefunden (Google). Ich brauche {what}, am besten {genre}, aber so, dass man dazu Walzer tanzen kann.',
    ],
    extra: {
      inst: ['Mit {i1} und {i2}, so wie früher bei Peter Alexander.', 'Gerne mit {i1}. Was {i2} ist, weiß ich nicht, aber mein Enkel sagt, es gehört dazu.'],
      theme: ['Das Lied soll von „{theme}“ handeln. Bitte keine Schimpfwörter!!!', 'Thema: {theme}. Und ein bisschen von meinem Garten.'],
      voice: ['Meine Stimme ist {voice}, ich singe seit 1968 im Kirchenchor.', 'Ich singe wie {voice}. Sagt jedenfalls meine Nachbarin.'],
    },
    outro: ['Mit freundlichen Grüßen\n{name}\n\nGesendet von meinem iPad', 'Hochachtungsvoll, {name}', 'MfG {name} (bitte nicht anrufen, während „Bares für Rares“ läuft)', 'Liebe Grüße, {name} 🌹😂'],
    replies: {
      great: ['Sehr schön!!! Die ganze Seniorenrunde hat mitgeklatscht. Ich schicke Ihnen eine Karte.', 'Wunderbar. Mein Enkel sagt, es ist „fire“. Ich weiß nicht, was das heißt, aber ich bin stolz.'],
      good: ['Ganz nett. Etwas laut. Aber ganz nett.', 'Danke. Ich habe es mir auf CD brennen lassen.'],
      late: ['Zu meiner Zeit war man pünktlich, junger Mann.', 'Der Seniorennachmittag war schon. Wir haben dann Heino gehört.'],
    },
    look: { bg: ['#9fb8ad', '#c9b79c', '#a8c5da'], hair: { f: ['curls'], m: ['bald', 'side'] }, hairColor: ['#e8e8e8', '#cfcfcf', '#bdbdbd'], glasses: 0.8, wrinkles: true, mustache: 0.3, shirt: ['#8d6e63', '#6d8b74', '#7b8fa6'] },
  },

  kid: {
    label: 'Kind', kid: true,
    names: ['Larry (9)|m', 'Timmy (8)|m', 'Kevin (10)|m', 'Jonas (7)|m', 'Finn-Luca (9)|m', 'Jayden (11)|m',
      'Mia-Sophie (8)|f', 'Paulchen (6)|m', 'Benni (10)|m', 'Lina (9)|f', 'Maxi (7)|m', 'Emil (8)|m'],
    what: { instrumental: 'einen beat', full_song: 'ein lied', vocal_chain: 'so ein stimmen-ding', hook: 'einen refrain', remix: 'einen remix' },
    greet: ['hallo', 'yooo bro', 'hiii', 'ey'],
    lines: [
      'kannst du mir {what} machen für mein fortnite video?? {genre} am besten pls pls pls 🥺',
      'mama sagt ich darf dich fragen. ich will {what} der so {mood} ist wie wenn man in minecraft einen creeper sieht 😱',
      'ich brauch {what} für meine präsentation über dinosaurier. {genre} mit ganz viel bass 🦖🦖',
    ],
    extra: {
      inst: ['mit {i1}!!! und {i2} ist auch cool', 'bitte mit {i1} weil das klingt nach sigma 🗿'],
      theme: ['es soll um {theme} gehen oder um meinen hamster krümel 🐹', 'das thema ist {theme} aber mit mehr aura'],
      voice: ['meine stimme ist hoch weil ich noch klein bin', 'ich klinge wie {voice} sagt mein bruder aber der lügt'],
    },
    outro: ['ich muss jetzt hausübung machen tschüss', 'danke!!! du hast +1000 aura 🗿', 'bitte nicht meiner lehrerin sagen', 'skibidi 🚽 (sorry das war mein bruder)'],
    replies: {
      great: ['BRO DAS IST SO KRASS ich hab es 67 mal angehört 🤯', 'meine ganze klasse findet es cool!!! +10000 aura'],
      good: ['cool danke', 'ist gut aber mein bruder sagt es ist cringe (er ist aber selber cringe)'],
      late: ['ich hab so lang gewartet dass ich fast ein jahr älter bin', 'die präsentation war schon 😭 aber danke'],
    },
    look: { bg: ['#ffd166', '#6ee7b7', '#7dd3fc', '#fda4af'], hair: { m: ['spiky', 'short', 'cap'], f: ['pigtails'] }, hairColor: ['#8b5a2b', '#f5d06f', '#3b2a20', '#d97b3a'], freckles: true, blush: true, bigEyes: true, shirt: ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'] },
  },

  gamer: {
    label: 'Gamer', mult: 0.5, note: '(in V-Bucks)',
    names: ['milfhunter|m', 'xXSniperGodXx|m', 'N00bSlayer2009|m', 'RageQuitRalf|m', 'ChunkyChris_TTV|m', 'Tryhard_Tobi|m', 'MonsterEnergyMike|m'],
    what: { instrumental: 'nen beat', full_song: 'nen song', vocal_chain: 'ne vocal chain fürs streaming-mic', hook: 'ne hook', remix: 'nen remix' },
    greet: ['yo', 'ayo producer', 'sup', 'gg'],
    lines: [
      'need {what} fürs twitch intro, {genre}, {bpm} bpm, so sweaty wie meine hände nach 6h ranked 🎮',
      'brauch {what} für meine montage, {mood} vibes, muss hitten wenn ich den 360 noscope mach',
      'kannst du {what} machen? {genre}. zahlung in v-bucks ok? bin lowkey broke rn',
    ],
    extra: {
      inst: ['{i1} und {i2} rein, gib mir main character energy', 'mit {i1}, sonst uninstall'],
      theme: ['thema: {theme}, aber gaming edition', 'es geht um {theme} und wie ich 0/12 gegangen bin'],
      voice: ['meine voice ist {voice} + mein headset ist von 2014', 'ich klinge wie {voice} mit mund voll chips'],
    },
    outro: ['brb mom ruft wegen abendessen', 'gg ez', 'afk, pizza ist da 🍕', 'ttv/{name} folgen pls'],
    replies: {
      great: ['BRO W PRODUCER 🔥🔥 chat eskaliert komplett', 'no cap das ist goated, 10/10 würd wieder kaufen'],
      good: ['solid, bisschen mid aber ok', 'passt, chat sagt W'],
      late: ['bro ich hab schon ohne musik gestreamt, L', 'lag irl? egal, nice'],
    },
    look: { bg: ['#10b981', '#4f46e5', '#0ea5e9'], hair: ['messy'], hairColor: ['#3b2a20', '#1c1c1c', '#7a5230'], fat: true, headset: true, stubble: true, shirt: ['#1f2937', '#111827'] },
  },

  rapper: {
    label: 'Straßenrapper', mult: 1,
    names: ['Baba Kalle|m', 'Big Mo|m', 'Kid Kanone|m', 'Money Mike|m', 'Stacks Stefan|m', 'Blocklord Benni|m',
      'Gold-Gregor|m', 'Sniper Sascha|m', 'Rolex Ronny|m', 'Beton Bernd|m'],
    what: { instrumental: 'einen Beat', full_song: 'einen ganzen Track', vocal_chain: 'eine Vocal Chain', hook: 'eine Hook', remix: 'einen Remix' },
    greet: ['Bruder!', 'Ey Digga.', 'Ehrenmann-Anfrage:', 'Brudi, hör zu.'],
    lines: [
      'ich brauch {what}, {genre}, so hart, dass die Nachbarn die Polizei rufen. {bpm} BPM, keine Diskussion.',
      'mach mir {what} für mein Straßenalbum „Beton & Gold“. Vibe: {mood}. Muss im Benz scheppern.',
      '{what}, {genre}, {bpm} BPM. Knallt der Beat, bist du Familie.',
    ],
    extra: {
      inst: ['{i1} und {i2} rein, Bruder, wie bei den Großen.', 'Viel {i1}. {i2} nur, wenn es Ehre hat.'],
      theme: ['Thema: {theme}. Und dass ich es von ganz unten geschafft hab.', 'Es geht um {theme}. Und Mama. Immer Mama.'],
      voice: ['Meine Stimme: {voice}. Soll nach Platin klingen.', 'Ich hab {voice}, mach mich zum Boss.'],
    },
    outro: ['Ehre. 🤝', 'Respekt, Bruder.', 'Wir sehen uns ganz oben. 💯', 'Bezahlung kommt, Wort drauf.'],
    replies: {
      great: ['BRUDER. Das ist eine Straßenhymne. Ehre für immer 🤝💯', 'Der Beat hat so geknallt, mein Subwoofer ist tot. Beste.'],
      good: ['Solide, Bruder. Kann man machen.', 'Passt. Nächstes Mal härter.'],
      late: ['Bruder, pünktlich ist Ehre. Trotzdem gut.', 'Hat gedauert wie mein Führerschein. Aber passt.'],
    },
    look: { bg: ['#f59e0b', '#1f2937', '#dc2626'], hair: ['cap', 'fade'], hairColor: ['#1c1c1c', '#3b2a20'], beard: 0.7, chain: true, sunglasses: 0.4, shirt: ['#111', '#f5f5f5', '#1e3a8a'] },
  },

  fitness: {
    label: 'Fitness-Bro', mult: 1,
    names: ['Protein-Paul|m', 'Gains Gabriel|m', 'Max Muskel|m', 'Chad Brenner|m', 'Kevin Pump|m', 'Sixpack Simon|m', 'Bulk-Basti|m', 'Coach Kerstin|f'],
    what: { instrumental: 'einen Beat', full_song: 'einen Song', vocal_chain: 'eine Vocal Chain', hook: 'eine Hook', remix: 'einen Remix' },
    greet: ['Yo Bro 💪', 'Grüß dich, Champion!', 'Morgen, Grinder! 5 Uhr aufgestanden – du auch?'],
    lines: [
      'brauche {what} für mein Gym-Reel. {genre}, {bpm} BPM, damit ich 200 kg drücke 🏋️',
      'mach mir {what}, der pumpt wie Pre-Workout. Vibe {mood}, keine Ausreden.',
      'ich brauche {what} für meinen Kurs „Alpha in 30 Tagen“. {genre}. Discipline > Motivation.',
    ],
    extra: {
      inst: ['{i1} und {i2} – progressiv wie meine Gains.', 'Viel {i1}, der Rest ist Cardio.'],
      theme: ['Thema: {theme} und Protein.', 'Es geht um {theme}. Und Leg Day. Nie Leg Day skippen.'],
      voice: ['Meine Stimme ist {voice}, aber mit Creatine.', 'Ich bin {voice} – mach mich breiter.'],
    },
    outro: ['Stay hard. 💪', 'Grind never stops.', 'Protein-Shake auf dich 🥤', 'Jetzt Eisbad. Bis dann.'],
    replies: {
      great: ['BRO. Neuer PR bei dem Beat. 💪🔥', 'Das ist pures Creatine für die Ohren.'],
      good: ['Solider Satz. 8 von 10 Wiederholungen.', 'Gut, aber noch nicht Olympia.'],
      late: ['Zu spät, Bro. Disziplin! Trotzdem gut.', 'Hab in der Zwischenzeit 3 kg zugelegt. Muskeln natürlich.'],
    },
    look: { bg: ['#22c55e', '#f97316', '#06b6d4'], hair: ['short'], hairColor: ['#3b2a20', '#f5d06f', '#1c1c1c'], headband: true, tank: true, shirt: ['#111'] },
  },

  crypto: {
    label: 'Crypto-Bro', mult: 1.5, note: '(in Dogecoin 🚀)',
    names: ['Satoshi Sven|m', 'Dogecoin-Dennis|m', 'Moonboy Marco|m', 'NFT-Niklas|m', 'Lambo-Lukas|m', 'Whale Walter|m', 'HODL-Hannes|m'],
    what: { instrumental: 'einen Beat', full_song: 'einen Song', vocal_chain: 'eine Vocal Chain', hook: 'eine Hook', remix: 'einen Remix' },
    greet: ['GM ☀️', 'Yo, gm gm', 'Hey Fren 🚀'],
    lines: [
      'brauche {what} für unseren NFT-Drop. {genre}, {mood}, muss nach 100x klingen 🚀',
      'ich zahl in Dogecoin. {what}, {genre}, {bpm} BPM. To the moon.',
      'mach mir {what} fürs Discord. Vibe: {mood}, aber bullish.',
    ],
    extra: {
      inst: ['{i1} und {i2}, wie eine grüne Kerze.', '{i1} ist quasi Blockchain für die Ohren.'],
      theme: ['Thema: {theme} und Lambo.', 'Es geht um {theme}. HODL.'],
      voice: ['Meine Stimme: {voice}. Mach mich zum Whale.', 'Ich bin {voice}, aber mit Diamond Hands 💎🙌'],
    },
    outro: ['WAGMI 🚀', 'NFA, DYOR.', 'Lambo soon. 🏎️', 'Bis zum nächsten Bullrun.'],
    replies: {
      great: ['Das ist ein 100x-Beat. Ich mint das sofort 🚀', 'Bullish. Extrem bullish.'],
      good: ['Solide, wie Bitcoin 2016.', 'Kein Moon, aber stabil.'],
      late: ['Zu spät, der Hype ist vorbei. Aber HODL.', 'Hab gewartet wie auf den Bullrun.'],
    },
    look: { bg: ['#f7931a', '#6366f1', '#111827'], hair: ['short', 'messy'], hairColor: ['#1c1c1c', '#f5d06f', '#7a5230'], sunglasses: 0.9, hoodie: true, shirt: ['#1f2937', '#f7931a'] },
  },

  grantler: {
    label: 'Wiener Grantler', mult: 0.7,
    names: ['Pepi Brandstetter|m', 'Ferdl Brunner|m', 'Poldi Schwarz|m', 'Hansi Kraxler|m', 'Mitzi Hinterhuber|f', 'Gustl Pichler|m', 'Resi Wimmer|f', 'Schurli Bauer|m'],
    what: { instrumental: 'an Beat', full_song: 'a ganzes Liad', vocal_chain: 'so a Vocal-Kettn', hook: 'an Refrain', remix: 'an Remix' },
    greet: ['Servas.', 'Heast, Oida.', 'Griaß di.', 'Na?'],
    lines: [
      'I brauch {what}. {genre}. Ned so a Klumpert wia des im Radio. {bpm} BPM, passt eh.',
      'Mei Schwoga sogt, du konnst des. {what}, Stimmung {mood}. Oba ned z’teuer, gö?',
      'Oida, {what} brauch i, {genre}, fürs Heurigen-Fest. Muss scheppern, oba gmiatlich.',
    ],
    extra: {
      inst: ['Mit {i1} und {i2}, wia a Melange mit Schlagobers.', '{i1} muss eine, {i2} is ma wurscht.'],
      theme: ['Thema: {theme}. Und dass früher ois besser woar.', 'Es geht um {theme} und um die Bim, de nia kummt.'],
      voice: ['I hob {voice}, oba mit Grant.', 'Mei Stimm is {voice}, sogt mei Oide.'],
    },
    outro: ['Pfiat di.', 'Baba und foi ned.', 'Schleich di und moch hinne.', 'Passt scho.'],
    replies: {
      great: ['Leiwand! Wirklich leiwand, Burschi. 🍷', 'Na servas, des is a Hammer. Da trink ma a Achterl drauf.'],
      good: ['Passt eh.', 'Geht scho. Is ka Katastrophe.'],
      late: ['Hot dauert wia de U-Bahn am Sonntag. Oba passt.', 'Z’spät, oba wurscht.'],
    },
    look: { bg: ['#b45309', '#64748b', '#991b1b'], hair: { m: ['flatcap', 'side'], f: ['bun'] }, hairColor: ['#9ca3af', '#6b4f3a', '#d1d5db'], mustache: 0.8, wrinkles: true, shirt: ['#374151', '#78350f'] },
  },

  mama: {
    label: 'Mama', mult: 1,
    names: ['Sabine Hofer|f', 'Petra Schmidt|f', 'Claudia Maier|f', 'Andrea Wagner|f', 'Uschi Berger|f', 'Karin Lechner|f', 'Birgit Moser|f', 'Tanja Eder|f'],
    what: { instrumental: 'einen Beat', full_song: 'ein Lied', vocal_chain: 'so eine Vocal-Kette (?)', hook: 'einen Refrain', remix: 'einen Remix' },
    greet: ['Hallo! 😊', 'Hallöchen 🌸', 'Hi, ich bin die Mama von Leon 😊'],
    lines: [
      'für den 50. Geburtstag von meinem Mann Uwe hätte ich gern {what}. Er mag {genre} (glaube ich 😅). Stimmung: {mood}!',
      'unsere Mädelsrunde braucht {what} für den Junggesellinnenabschied 🥂 {genre}, {bpm} BPM, damit wir tanzen können!!',
      'könnten Sie {what} fürs Schulfest machen? {genre}, aber bitte kindgerecht 🙏',
    ],
    extra: {
      inst: ['Gerne mit {i1} und {i2}, das klingt so schön 🥰', 'Mit {i1}! Hat mir mein Yoga-Lehrer empfohlen 🧘‍♀️'],
      theme: ['Thema: {theme} und Familie ❤️', 'Es soll um {theme} gehen. Und um Uwe. 😂'],
      voice: ['Ich singe wie {voice}, sagt meine Freundin Birgit 😅', 'Meine Stimme ist {voice}, aber ich bin nicht so gut 🙈'],
    },
    outro: ['Ganz liebe Grüße 🌸😊', 'Danke im Voraus!!! 🙏🙏', 'Schönen Tag noch ☀️', 'LG und danke!! (Sorry für die Sprachnachricht vorhin 🙈)'],
    replies: {
      great: ['Uwe hat geweint 😭❤️ Tausend Dank!!!', 'Die ganze WhatsApp-Gruppe ist begeistert 🥳🥳'],
      good: ['Sehr schön, danke 😊', 'Nett! Uwe fand es ein bisschen laut 😅'],
      late: ['Der Geburtstag war leider schon 😅 aber schön!', 'Etwas spät, aber lieben Dank 🌸'],
    },
    look: { bg: ['#f9a8d4', '#fcd34d', '#a5b4fc'], hair: ['bob'], hairColor: ['#8b5a2b', '#f5d06f', '#b45309', '#1c1c1c'], blush: true, studs: true, shirt: ['#f472b6', '#60a5fa', '#34d399'] },
  },

  eso: {
    label: 'Esoterik', mult: 0.9,
    names: ['Luna Sternenstaub|f', 'Indigo Freya|f', 'Shanti Sabine|f', 'Kosmos-Klaus|m', 'Aurora Lichtwesen|f', 'Gaia Blümchen|f', 'Sonnenherz Susi|f'],
    what: { instrumental: 'einen Klangteppich', full_song: 'ein Seelenlied', vocal_chain: 'eine Stimm-Aura-Kette', hook: 'ein Mantra', remix: 'einen Remix mit Heilfrequenzen' },
    greet: ['Namasté 🙏✨', 'Liebes Licht,', 'Hallo, schöne Seele 🌙'],
    lines: [
      'ich brauche {what} in 432 Hz für meine Klangschalen-Meditation. {genre}, aber spirituell. Stimmung: {mood}.',
      'das Universum hat mir gesagt, dass du {what} für mich machst. {genre}, {bpm} BPM, im Einklang mit Merkur.',
      'für meinen Vollmondkreis brauche ich {what}. Bitte mit guter Energie und ohne negative Frequenzen.',
    ],
    extra: {
      inst: ['{i1} und {i2}, die öffnen das Herzchakra ✨', 'Viel {i1}, das reinigt die Aura 🌿'],
      theme: ['Thema: {theme} und die Verbindung zu Mutter Erde 🌍', 'Es geht um {theme}, aus Sicht meines inneren Kindes.'],
      voice: ['Meine Stimme ist {voice} und schwingt im Halschakra.', 'Ich klinge wie {voice}, aber mit Mondenergie 🌙'],
    },
    outro: ['Licht & Liebe ✨', 'In Dankbarkeit 🙏', 'Om Shanti 🕉️', 'Das Universum wird dich belohnen (bezahlen tu ich auch).'],
    replies: {
      great: ['Ich hatte beim Hören ein Déjà-vu aus einem früheren Leben ✨', 'Mein Chakra ist offen wie nie. Danke, Lichtwesen 🙏'],
      good: ['Schöne Energie, leicht blockiert im Bass.', 'Gut. Merkur war rückläufig, daher okay.'],
      late: ['Zeit ist eine Illusion 🌙 trotzdem etwas spät.', 'Das Universum hat mich Geduld gelehrt.'],
    },
    look: { bg: ['#a78bfa', '#67e8f9', '#c4b5fd'], hair: ['long'], hairColor: ['#b45309', '#fde68a', '#7c3aed', '#6b3e26'], flower: true, thirdEye: true, shirt: ['#8b5cf6', '#14b8a6'] },
  },

  business: {
    label: 'Business', mult: 2,
    names: ['Thomas Berger – Nightlight Records|m', 'Julia König – FreshCola|f', 'Markus Vogt – VogtMedia GmbH|m', 'Dr. Stefanie Lang – Agentur Lang|f', 'Oliver Hahn – SnackBox AG|m', 'Nina Brandt – Urban Sneakers|f'],
    what: { instrumental: 'ein Instrumental', full_song: 'einen kompletten Song', vocal_chain: 'eine Vocal Chain für unseren Podcast', hook: 'einen Jingle/Hook', remix: 'einen Remix unseres Werbesongs' },
    greet: ['Sehr geehrte Damen und Herren,', 'Hi, kurze Anfrage aus dem Marketing:', 'Moin, direkt zum Punkt:'],
    lines: [
      'wir benötigen {what} für unsere Q4-Kampagne. Genre: {genre}. Stimmung: {mood}. Ziel: Synergien heben und Brand-Awareness um 12 % steigern.',
      'für unseren neuen Energy-Drink-Spot suchen wir {what}. {genre}, {bpm} BPM, „jung, frech, aber seriös“.',
      'bitte {what} liefern, {genre}. KPI: Ohrwurm-Faktor. Deadline ist hart, Budget ist freigegeben.',
    ],
    extra: {
      inst: ['Stakeholder wünschen {i1} und {i2}.', '{i1} ist bereits vom Vorstand abgenommen.'],
      theme: ['Kernbotschaft: {theme} – aber brand-safe.', 'Storyline: {theme}, abgestimmt mit Legal.'],
      voice: ['Sprecher: {voice}. Bitte markenkonform.', 'Unser CEO ({voice}) möchte selbst singen. Bitte retten.'],
    },
    outro: ['Beste Grüße\n{name}', 'Lass uns da gerne kurz syncen.', 'Freue mich auf deinen Input! 🚀', 'Cheers | Sent from Outlook'],
    replies: {
      great: ['Top, wurde intern sehr positiv aufgenommen. Wir skalieren das.', 'Stark. Der Vorstand hat genickt – das passiert nie.'],
      good: ['Passt, wir gehen damit live.', 'Solide Arbeit, ein paar Learnings nehmen wir mit.'],
      late: ['Leider außerhalb der Timeline. Nehmen wir ins Retro.', 'Kam spät, aber gerade noch vor dem Launch.'],
    },
    look: { bg: ['#334155', '#1e3a8a', '#0f766e'], hair: { m: ['short'], f: ['bob'] }, hairColor: ['#1c1c1c', '#6b3e26', '#9ca3af'], glasses: 0.4, tie: true, shirt: ['#1f2937', '#0f172a'] },
  },

  hipster: {
    label: 'Hipster', mult: 0.9,
    names: ['Jannis Bohne|m', 'Frida Vinyl|f', 'Moritz Analog|m', 'Lotte Leinen|f', 'Theo Hafermilch|m', 'Ida Sauerteig|f'],
    what: { instrumental: 'ein Instrumental', full_song: 'einen Song', vocal_chain: 'eine Vocal Chain', hook: 'eine Hook', remix: 'einen Remix' },
    greet: ['hey :)', 'hi, ich hoffe, dir geht’s gut', 'moin aus der Siebdruck-Werkstatt'],
    lines: [
      'ich suche {what}, gern {genre}, aber eher so, dass es niemand kennt. analog, warm, ein bisschen {mood}.',
      'für meinen Podcast über Sauerteig brauche ich {what}. {genre}, {bpm} BPM, gern auf Tape aufgenommen.',
      '{what} für die Vernissage in meinem Concept Store. {genre}, aber organisch. kein Mainstream bitte.',
    ],
    extra: {
      inst: ['{i1} und {i2}, aber bitte echt eingespielt, nicht aus dem Computer.', '{i1} wäre schön, klingt nach Hafer-Flat-White.'],
      theme: ['Thema: {theme}, aber ironisch.', 'Es geht um {theme} und Vinyl.'],
      voice: ['meine Stimme ist {voice}, eher lo-fi.', 'ich klinge wie {voice}, ungefiltert bitte.'],
    },
    outro: ['danke dir :)', 'peace ✌️', 'liebe Grüße aus dem 7. Bezirk', 'schreib mir gern auf Signal'],
    replies: {
      great: ['wow, klingt wie eine Platte, die ich 2009 am Flohmarkt gefunden hab.', 'absolut underground. ich lieb’s.'],
      good: ['nice, ein bisschen zu mainstream, aber nice.', 'schön warm. fast zu warm.'],
      late: ['Zeit ist ein Konstrukt. aber ja, spät.', 'gut Ding will Weile haben.'],
    },
    look: { bg: ['#84cc16', '#d97706', '#78716c'], hair: ['beanie'], hairColor: ['#6b3e26', '#b45309', '#1c1c1c'], beard: 0.6, roundGlasses: 0.7, shirt: ['#57534e', '#a16207'] },
  },
};

// Sonderlinge – say weird stuff, order weird stuff.
ARCHETYPES.weird = {
  label: 'Sonderling', mult: 0.6,
  names: [],
  what: { instrumental: 'einen Beat', full_song: 'ein Lied', vocal_chain: 'eine Stimm-Kette', hook: 'eine Hook', remix: 'einen Remix' },
  greet: ['Hallo.', 'Guten Abend. Oder Morgen.', 'Hi, ich bin es.', 'Ähm, hallo?'],
  lines: [
    'ich brauche {what}. {genre}. {bpm} BPM. Frag nicht warum.',
    'meine Schildkröte meint, ich soll {what} bestellen. {genre}, Vibe {mood}.',
    '{what} bitte. {genre}. Soll klingen wie ein Keller um 3 Uhr nachts, aber {mood}.',
  ],
  extra: {
    inst: ['Mit {i1}. {i2} nur, wenn es die Gurken erlauben.', '{i1} ja. {i2} vielleicht. Tiere mögen {i1}.'],
    theme: ['Thema: {theme}. Oder Schildkröten. Beides geht.', 'Es geht um {theme}, glaube ich.'],
    voice: ['Meine Stimme ist {voice}, sagt meine Mutter.', 'Ich klinge wie {voice}, nur leiser.'],
  },
  outro: ['Danke. Tschüss.', 'Bis bald. Oder nicht.', 'Ich gehe jetzt Gurken gießen.', 'Ende der Nachricht.'],
  replies: {
    great: ['Ich habe geweint. Meine Schildkröte auch. 🐢', 'Perfekt. Ich hab’s 300 Mal gehört, rückwärts auch.'],
    good: ['Gut. Die Gurken sind zufrieden.', 'Passt. Wackelt schön.'],
    late: ['Spät, aber Zeit ist eh relativ.', 'Ich hab gewartet und ein Puzzle gemacht. 5000 Teile.'],
  },
  look: { bg: ['#a3e635', '#fb923c', '#94a3b8', '#f0abfc'], hair: { m: ['messy', 'bald', 'short'], f: ['bun', 'curls'] }, hairColor: ['#9ca3af', '#d97706', '#1c1c1c', '#7c3aed'], glasses: 0.4, roundGlasses: 0.4, freckles: true, shirt: ['#65a30d', '#f59e0b', '#7c3aed'] },
};

// ---- Experts & the Ultra-Boss --------------------------------------------
// Experts always want the SAME thing (their specialty) and only accept
// ≥ minRating by your own honest review. Specialties below are placeholders –
// swap genre/bpm/instruments for your own.
ARCHETYPES.expert = {
  label: 'Experte', special: true,
  replies: {
    great: ['Akzeptiert. So klingt das. Du lernst.', 'Sauber. Das ist genau mein Sound. Nächstes Mal wieder so.'],
    good: ['Akzeptiert. Knapp, aber akzeptiert.'],
    late: ['Spät. Aber das Ergebnis zählt. Akzeptiert.'],
    reject: ['Nein. Das ist nicht mein Sound. Nochmal.', 'Nicht gut genug. Hör dir die Referenzen an und überarbeite es.', 'Das schick ich nicht mal meiner Oma. Nochmal.'],
  },
  look: { bg: ['#111827'], hair: ['fade'], hairColor: ['#1c1c1c'], shirt: ['#111'] },
};
ARCHETYPES.boss = {
  label: 'ULTRA-BOSS', special: true,
  replies: {
    great: ['…Das ist ein Release. Du bist bereit. 👑', 'Ich habe viele gehört. Das hier ist echt. Respekt.'],
    good: ['Akzeptiert. Veröffentliche es.'],
    late: ['Zu spät – aber gut genug. Akzeptiert.'],
    reject: ['Das ist kein Release. Das ist eine Demo. Nochmal.', 'Nein. Mix, Master, Performance – alles muss sitzen. Nochmal.'],
  },
  look: { bg: ['#1a0000'], hair: ['short'], hairColor: ['#0a0a0a'], shirt: ['#0a0a0a'] },
};

export const EXPERTS = [
  { id: 'expert:motorcity', name: 'Maestro Motorcity', arch: 'expert', g: 'm', sig: 'Detroit oder gar nicht.', fact: 'Ich höre seit 1996 nur Beats aus Detroit.',
    spec: { genre: 'Detroit', label: 'Detroit-Beat', bpm: [94, 102], keys: ['F Moll', 'C# Moll', 'G Moll'], inst: ['hüpfendes Offbeat-Piano', 'Clap auf 2 & 4', 'Detroit-Hi-Hats', 'kurze 808 mit Glide'] },
    look: { bg: '#0f172a', hair: 'fade', sunglasses: true, beard: true, chain: true, skin: '#8a5433' } },
  { id: 'expert:slide', name: 'Sir Sliding Eight-O-Eight', arch: 'expert', g: 'm', sig: 'Slide or die.', fact: 'Ich habe 400 Drill-Beats bewertet, 3 waren gut.',
    spec: { genre: 'UK Drill', label: 'UK-Drill-Beat', bpm: [140, 144], keys: ['F# Moll', 'D Moll'], inst: ['Sliding 808s', 'Drill-Hi-Hats im Triolen-Swing', 'dunkle Strings', 'Snare auf 3'] },
    look: { bg: '#18181b', hair: 'cap', sunglasses: false, beard: true, chain: true, skin: '#6b3f26' } },
  { id: 'expert:sampleton', name: 'Onkel Sampleton', arch: 'expert', g: 'm', sig: 'Staub ist Gold.', fact: 'Meine Plattensammlung wiegt mehr als mein Auto.',
    spec: { genre: 'Boom Bap (90s NY)', label: '90s-Boom-Bap-Beat', bpm: [86, 94], keys: ['A Moll', 'D Moll'], inst: ['gechoppte Soul-/Jazz-Samples', 'dreckige Drums mit Swing', 'Vinyl-Crackle', 'Upright- oder Sub-Bass'] },
    look: { bg: '#1c1917', hair: 'beanie', roundGlasses: true, beard: true, skin: '#b87a4b' } },
  { id: 'expert:kickroll', name: 'Queen Kickroll', arch: 'expert', g: 'f', sig: 'Bounce ist Pflicht.', fact: 'Ich tanze zu jedem Beat, den ich bewerte. Auch zu den schlechten.',
    spec: { genre: 'Jersey Club', label: 'Jersey-Club-Beat', bpm: [138, 142], keys: ['E Moll', 'B Moll'], inst: ['Kick-Rolls im Jersey-Pattern', 'Bed-Squeaks', 'Vocal-Chops', 'Synth-Stabs'] },
    look: { bg: '#1e1b4b', hair: 'long', hairColor: '#111', lashes: true, lips: true, hoops: true, skin: '#6b3f26', fem: true } },
];

export const BOSS = {
  id: 'boss:nero', name: 'IL MAESTRO NERO', arch: 'boss', g: 'm', sig: 'Nur Releases. Keine Demos.', fact: 'Ich habe 30 Jahre Hits gemacht. Überzeug mich.',
  look: { bg: '#1a0000', hair: 'short', hairColor: '#0a0a0a', sunglasses: true, beard: true, chain: true, crown: true, sparkles: true, skin: '#d89c6c', shirt: '#0a0a0a', tie: true },
};

// ---- seeded randomness so every customer always looks the same ----------
function seed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

for (const [arch, P] of Object.entries(PEOPLE)) if (P.names) ARCHETYPES[arch].names = P.names;

export const CUSTOMERS = Object.entries(ARCHETYPES).filter(([, a]) => !a.special).flatMap(([arch, a]) => a.names.map((n, i) => {
  const [name, g] = n.split('|');
  const P = PEOPLE[arch] || {};
  const r = seed(`${arch}:${name}:likes`);
  const pool = [...(P.likes || [])].sort(() => r() - 0.5);
  const nf = P.facts?.length || 0;
  return {
    id: `${arch}:${name}`, name, arch, g,
    sig: P.sigs?.[i % P.sigs.length] || '',
    facts: nf ? [P.facts[(2 * i) % nf], P.facts[(2 * i + 1) % nf]] : [],
    likes: pool.slice(0, 2),
  };
}));
export const CUSTOMER_BY_ID = Object.fromEntries([...CUSTOMERS, ...EXPERTS, BOSS].map((c) => [c.id, c]));

// What we call them inside their own messages.
export function firstName(c) {
  if (PEOPLE[c.arch]?.fullName || c.arch === 'expert' || c.arch === 'boss') return c.name;
  return c.name.replace(/\s*\(\d+\)/, '').split(/[\s–]/)[0];
}

// ---- writing ------------------------------------------------------------
const pickR = (r, arr) => arr[Math.floor(r() * arr.length)];
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function writeBrief(customer, type, vars, r = Math.random) {
  const a = ARCHETYPES[customer.arch];
  const v = { ...vars, what: a.what[type] || a.what.instrumental, name: customer.name.split(' – ')[0] };
  const kind = type === 'vocal_chain' ? 'voice' : type === 'full_song' || type === 'hook' ? 'theme' : 'inst';
  const greet = fill(pickR(r, a.greet), v);
  let line = fill(pickR(r, a.lines), v);
  // Formal greetings end with a comma → continue lowercase; otherwise capitalise.
  if (!/,$/.test(greet) && !a.kid && customer.arch !== 'chaya' && customer.arch !== 'gamer') line = cap(line);
  const extra = fill(pickR(r, a.extra[kind]), v);
  const outro = fill(pickR(r, a.outro), v);
  // Their own random (useless) fact – about every second message.
  const P = PEOPLE[customer.arch];
  const fact = customer.facts?.length && r() < 0.5
    ? `\n${fill(P.factTpl, { first: firstName(customer), fact: pickR(r, customer.facts) })}` : '';
  const sig = customer.sig ? `\n${customer.sig}` : '';
  return `${greet}\n${line} ${extra}${fact}\n\n${outro}${sig}`;
}

// Experts: always the same demand, very precise.
export function writeExpertBrief(expert, vars, minRating, r = Math.random) {
  const s = expert.spec;
  const opener = pickR(r, ['Wie immer.', 'Du weißt, was ich will.', 'Gleicher Auftrag wie immer.', 'Hör gut zu.']);
  return `${opener}\nIch will einen ${s.label}. ${vars.bpm} BPM, ${vars.key}. ${s.inst.join(', ')}. Keine Experimente, kein Genre-Mix.\n` +
    `Unter ${minRating}/10 brauchst du mir nichts schicken – dann geht er zurück.\n\n${expert.fact}\n${expert.sig}`;
}

export function writeBossBrief(boss, vars, minRating) {
  return `Du hast lange durchgezogen. Respekt.\nJetzt zeig mir, wer du bist: einen RELEASE-FERTIGEN SONG. Beat, Vocals, Mix, Master – alles.\n` +
    `Genre: ${vars.genre} – oder das, was du am besten kannst. Du hast 6 Wochen.\nUnter ${minRating}/10 will ich es nicht hören.\n\n${boss.fact}\n${boss.sig}`;
}

export function replyFor(customer, kind) {
  const a = ARCHETYPES[customer?.arch];
  if (!a?.replies?.[kind]) return null;
  return pickR(Math.random, a.replies[kind]);
}

export function budgetFor(customer, base, r = Math.random) {
  const a = ARCHETYPES[customer.arch];
  if (a.kid) return { budget: 2 + Math.floor(r() * 9), note: '(Taschengeld 🐷)' };
  return { budget: Math.max(5, Math.round((base * (a.mult || 1)) / 5) * 5), note: a.note || '' };
}

// ---- avatar (SVG, 100×100) ---------------------------------------------
// Head-and-shoulders portrait with gradients: shaded skin, almond eyes with
// iris + highlights, tapered brows, glossy lips, hair with volume & shine.
const SKIN = ['#fbe0cf', '#f6d0b1', '#eab98f', '#d89c6c', '#b87a4b', '#8a5433', '#6b3f26'];
const EYES = ['#5b3a1e', '#3d2a1a', '#2f6b3b', '#2a5d8f', '#6b7280', '#7c4a1d'];

// Lighten (+) / darken (−) a hex colour by pct (−1…1).
function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.round(pct < 0 ? c * (1 + pct) : c + (255 - c) * pct);
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function pickLook(customer) {
  const a = ARCHETYPES[customer.arch];
  const r = seed(customer.id);
  const L = a.look;
  const chance = (p) => (p === true ? true : typeof p === 'number' ? r() < p : false);
  const hairList = Array.isArray(L.hair) ? L.hair : (L.hair[customer.g] || Object.values(L.hair)[0]);
  return {
    bg: pickR(r, L.bg), skin: pickR(r, SKIN), hair: pickR(r, hairList), hairColor: pickR(r, L.hairColor),
    eye: pickR(r, EYES), shirt: pickR(r, L.shirt), glam: customer.arch === 'chaya',
    lashes: chance(L.lashes), lips: chance(L.lips), hoops: chance(L.hoops),
    blush: chance(L.blush), glasses: chance(L.glasses), roundGlasses: chance(L.roundGlasses), sunglasses: chance(L.sunglasses),
    wrinkles: chance(L.wrinkles), mustache: customer.g === 'm' && chance(L.mustache), beard: customer.g === 'm' && chance(L.beard),
    stubble: chance(L.stubble), freckles: chance(L.freckles), bigEyes: chance(L.bigEyes), fat: chance(L.fat),
    headset: chance(L.headset), chain: chance(L.chain), headband: chance(L.headband), tank: chance(L.tank),
    hoodie: chance(L.hoodie), tie: chance(L.tie), flower: chance(L.flower), thirdEye: chance(L.thirdEye), studs: chance(L.studs),
    beautyMark: customer.arch === 'chaya' && r() < 0.6, smile: r(), fem: customer.g === 'f',
  };
}

let avatarCount = 0;
export function avatarSvg(customer, opts = {}) {
  if (!customer) return '';
  const k = { ...pickLook(customer), ...(customer.look || {}), ...opts };
  const id = `av${(avatarCount++).toString(36)}`;
  const hc = k.hairColor, sk = k.skin;
  const W = k.fat ? 25 : k.fem ? 20 : 21; // face half-width
  const cx = 50, L = cx - W, R = cx + W;
  const jawY = k.fat ? 80 : 76;
  const face = k.fat
    ? `M50 25 C${R + 3} 25 ${R + 1} 40 ${R} 52 C${R} 70 64 ${jawY} 50 ${jawY} C36 ${jawY} ${L} 70 ${L} 52 C${L - 1} 40 ${L - 3} 25 50 25Z`
    : k.fem
      ? `M50 26 C${R} 26 ${R + 1} 40 ${R} 50 C${R - 1} 63 58 ${jawY} 50 ${jawY} C42 ${jawY} ${L + 1} 63 ${L} 50 C${L - 1} 40 ${L} 26 50 26Z`
      : `M50 26 C${R} 26 ${R + 1} 40 ${R} 51 C${R} 64 60 ${jawY} 50 ${jawY} C40 ${jawY} ${L} 64 ${L} 51 C${L - 1} 40 ${L} 26 50 26Z`;
  const p = [];
  p.push(`<defs>
    <radialGradient id="${id}bg" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="${shade(k.bg, 0.35)}"/><stop offset="1" stop-color="${shade(k.bg, -0.25)}"/></radialGradient>
    <radialGradient id="${id}sk" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="${shade(sk, 0.18)}"/><stop offset=".65" stop-color="${sk}"/><stop offset="1" stop-color="${shade(sk, -0.22)}"/></radialGradient>
    <linearGradient id="${id}hr" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${shade(hc, 0.28)}"/><stop offset=".45" stop-color="${hc}"/><stop offset="1" stop-color="${shade(hc, -0.35)}"/></linearGradient>
    <linearGradient id="${id}sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(k.shirt, 0.15)}"/><stop offset="1" stop-color="${shade(k.shirt, -0.3)}"/></linearGradient>
    <linearGradient id="${id}nk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(sk, -0.3)}"/><stop offset=".6" stop-color="${shade(sk, -0.08)}"/></linearGradient>
    <linearGradient id="${id}lp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0417f"/><stop offset="1" stop-color="#a3124b"/></linearGradient>
  </defs>`);
  const HR = `url(#${id}hr)`, SK = `url(#${id}sk)`;
  p.push(`<rect width="100" height="100" fill="url(#${id}bg)"/>`);
  if (k.sparkles) p.push('<g fill="#fff" opacity=".9"><path d="M14 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M85 13l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z"/><path d="M87 62l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z"/></g>');

  // hair behind head
  if (k.hair === 'long') p.push(`<path d="M${L - 6} 46 C${L - 12} 70 ${L - 10} 92 ${L - 2} 100 L${R + 2} 100 C${R + 10} 92 ${R + 12} 70 ${R + 6} 46 C${R + 6} 20 ${L - 6} 20 ${L - 6} 46Z" fill="${HR}"/>`);
  if (k.hair === 'bob') p.push(`<path d="M${L - 5} 46 C${L - 7} 60 ${L - 5} 68 ${L - 1} 70 L${R + 1} 70 C${R + 5} 68 ${R + 7} 60 ${R + 5} 46 C${R + 5} 22 ${L - 5} 22 ${L - 5} 46Z" fill="${HR}"/>`);
  if (k.hair === 'pigtails') p.push(`<ellipse cx="${L - 6}" cy="50" rx="7" ry="11" fill="${HR}"/><ellipse cx="${R + 6}" cy="50" rx="7" ry="11" fill="${HR}"/>`);

  // shoulders + clothes
  const body = 'M4 100 C8 82 26 76 40 74 L60 74 C74 76 92 82 96 100Z';
  if (k.tank || k.glam) {
    p.push(`<path d="${body}" fill="${SK}"/>`);
    if (k.glam) p.push(`<path d="M20 100 C24 91 30 88 36 88 C40 96 46 99 50 99 C54 99 60 96 64 88 C70 88 76 91 80 100Z" fill="url(#${id}sh)"/><path d="M36 88 L37 77 M64 88 L63 77" stroke="${shade(k.shirt, -0.15)}" stroke-width="1"/><path d="M47.5 91 Q50 95.5 52.5 91" stroke="${shade(sk, -0.28)}" stroke-width="1" fill="none" opacity=".45" stroke-linecap="round"/>`);
    else p.push(`<path d="M28 100 C30 88 36 80 40 76 C44 82 56 82 60 76 C64 80 70 88 72 100Z" fill="url(#${id}sh)"/>`);
  } else {
    p.push(`<path d="${body}" fill="url(#${id}sh)"/>`);
    p.push(`<path d="M40 74 C44 80 56 80 60 74" stroke="${shade(k.shirt, -0.4)}" stroke-width="1.5" fill="none" opacity=".6"/>`);
  }
  if (k.hoodie) p.push(`<path d="M30 76 C38 86 62 86 70 76" stroke="${shade(k.shirt, -0.45)}" stroke-width="3" fill="none"/><path d="M44 82 l-1 12 M56 82 l1 12" stroke="#e5e7eb" stroke-width="1.5"/>`);
  if (k.tie) p.push(`<path d="M38 74 L50 82 L62 74 L60 80 L50 86 L40 80Z" fill="#f8fafc"/><path d="M47 82 L53 82 L55 98 L50 100 L45 98Z" fill="#b91c1c"/>`);
  if (k.chain) p.push('<path d="M36 76 C42 90 58 90 64 76" stroke="#fbbf24" stroke-width="2.6" fill="none" stroke-dasharray="2.2 1.2"/><circle cx="50" cy="88" r="3.6" fill="#fcd34d" stroke="#b45309" stroke-width=".8"/>');
  if (k.glam) p.push('<path d="M41 78 C44 83 56 83 59 78" stroke="#fde68a" stroke-width=".8" fill="none"/><path d="M50 82.2 l1.6 2.4 -1.6 2.4 -1.6 -2.4z" fill="#e0f2fe"/>');

  // neck
  p.push(`<path d="M42 64 L42 76 C46 79 54 79 58 76 L58 64Z" fill="url(#${id}nk)"/>`);
  // ears
  p.push(`<ellipse cx="${L + 0.5}" cy="53" rx="3.6" ry="5" fill="${shade(sk, -0.08)}"/><ellipse cx="${R - 0.5}" cy="53" rx="3.6" ry="5" fill="${shade(sk, -0.08)}"/>`);
  if (k.hoops) p.push(`<circle cx="${L}" cy="63" r="5.2" stroke="#fbbf24" stroke-width="1.8" fill="none"/><circle cx="${R}" cy="63" r="5.2" stroke="#fbbf24" stroke-width="1.8" fill="none"/>`);
  if (k.studs) p.push(`<circle cx="${L}" cy="57" r="1.5" fill="#f1f5f9"/><circle cx="${R}" cy="57" r="1.5" fill="#f1f5f9"/>`);
  // face
  p.push(`<path d="${face}" fill="${SK}"/>`);
  if (k.glam) p.push(`<path d="M${L + 1} 52 C${L + 3} 62 44 70 46 72" stroke="${shade(sk, -0.2)}" stroke-width="4" fill="none" opacity=".16" stroke-linecap="round"/><path d="M${R - 1} 52 C${R - 3} 62 56 70 54 72" stroke="${shade(sk, -0.2)}" stroke-width="4" fill="none" opacity=".16" stroke-linecap="round"/>`);
  if (k.fat) p.push(`<path d="M38 74 C44 82 56 82 62 74" stroke="${shade(sk, -0.25)}" stroke-width="1.6" fill="none"/>`);
  if (k.stubble) p.push(`<path d="M${L + 3} 58 C${L + 6} ${jawY + 2} ${R - 6} ${jawY + 2} ${R - 3} 58 C${R - 6} 68 ${L + 6} 68 ${L + 3} 58Z" fill="${shade(hc, -0.2)}" opacity=".28"/>`);
  if (k.beard) p.push(`<path d="M${L + 1} 54 C${L + 2} 72 40 ${jawY + 3} 50 ${jawY + 3} C60 ${jawY + 3} ${R - 2} 72 ${R - 1} 54 C${R - 4} 64 58 67 50 67 C42 67 ${L + 4} 64 ${L + 1} 54Z" fill="${HR}"/>`);

  // cheeks
  if (k.blush || k.glam) p.push(`<ellipse cx="${L + 8}" cy="61" rx="5" ry="3" fill="#fb7185" opacity="${k.glam ? 0.3 : 0.35}"/><ellipse cx="${R - 8}" cy="61" rx="5" ry="3" fill="#fb7185" opacity="${k.glam ? 0.3 : 0.35}"/>`);
  if (k.freckles) p.push(`<g fill="${shade(sk, -0.35)}" opacity=".6"><circle cx="${L + 7}" cy="59" r=".8"/><circle cx="${L + 10}" cy="61" r=".8"/><circle cx="${L + 6}" cy="62" r=".8"/><circle cx="${R - 7}" cy="59" r=".8"/><circle cx="${R - 10}" cy="61" r=".8"/><circle cx="${R - 6}" cy="62" r=".8"/></g>`);
  if (k.wrinkles) p.push(`<path d="M41 38 Q50 35.5 59 38 M43 41 Q50 39.5 57 41" stroke="${shade(sk, -0.35)}" stroke-width=".8" fill="none" opacity=".6"/><path d="M${L + 4} 52 l3 1.2 M${L + 4} 55 l3 .2 M${R - 4} 52 l-3 1.2 M${R - 4} 55 l-3 .2" stroke="${shade(sk, -0.35)}" stroke-width=".8" opacity=".6"/><path d="M42 66 q-2 3 0 6 M58 66 q2 3 0 6" stroke="${shade(sk, -0.3)}" stroke-width=".8" fill="none" opacity=".5"/>`);
  if (k.thirdEye) p.push('<circle cx="50" cy="41" r="1.6" fill="#dc2626"/>');

  // brows
  const bc = ['#e8e8e8', '#cfcfcf', '#bdbdbd', '#d1d5db'].includes(hc) ? '#9ca3af' : shade(hc, -0.25);
  if (k.glam) p.push(`<path d="M35 45 Q39 39.5 46.5 42.2 Q40 41.8 35 45Z M65 45 Q61 39.5 53.5 42.2 Q60 41.8 65 45Z" fill="${bc}" stroke="${bc}" stroke-width=".6" stroke-linejoin="round"/>`);
  else if (k.fem) p.push(`<path d="M37 45.5 Q41 42 46.5 44 Q42 43.5 37 45.5Z M63 45.5 Q59 42 53.5 44 Q58 43.5 63 45.5Z" fill="${bc}" stroke="${bc}" stroke-width="1.2" stroke-linejoin="round"/>`);
  else p.push(`<path d="M36.5 45 Q41 42.5 46.5 44.2 L46.3 45.6 Q41 44.4 36.8 46.4Z M63.5 45 Q59 42.5 53.5 44.2 L53.7 45.6 Q59 44.4 63.2 46.4Z" fill="${bc}"/>`);

  // eyes
  const eye = (x, flip) => {
    const s = flip ? 1 : -1; // direction of the outer corner
    const ey = 51, ew = k.bigEyes ? 5.6 : k.glam ? 6 : 5, eh = k.bigEyes ? 3.8 : k.glam ? 3.6 : 2.9;
    const shape = `M${x - ew} ${ey} Q${x} ${ey - eh * 1.25} ${x + ew} ${ey} Q${x} ${ey + eh} ${x - ew} ${ey}Z`;
    const ir = k.bigEyes ? 3 : k.glam ? 2.9 : 2.5;
    let out = `<path d="${shape}" fill="#fff"/>`;
    out += `<clipPath id="${id}e${flip ? 1 : 0}"><path d="${shape}"/></clipPath><g clip-path="url(#${id}e${flip ? 1 : 0})"><circle cx="${x}" cy="${ey - 0.2}" r="${ir}" fill="${k.eye}"/><circle cx="${x}" cy="${ey - 0.2}" r="${ir * 0.5}" fill="#111"/><circle cx="${x + 0.9}" cy="${ey - 1.3}" r="${ir * 0.32}" fill="#fff"/></g>`;
    out += `<path d="M${x - ew} ${ey} Q${x} ${ey - eh * 1.3} ${x + ew} ${ey}" stroke="#2b1a12" stroke-width="${k.glam ? 1 : 0.8}" fill="none" opacity=".9"/>`;
    if (k.glam) {
      const o = x + s * ew; // outer corner
      out = `<path d="M${x - ew} ${ey - 1.2} Q${x} ${ey - eh * 2.3} ${x + ew} ${ey - 1.2} Q${x} ${ey - eh * 1.2} ${x - ew} ${ey - 1.2}Z" fill="#b45cf6" opacity=".35"/>` + out;
      out += `<path d="M${x - s * ew} ${ey} Q${x} ${ey - eh * 1.4} ${o} ${ey - 0.4} L${o + s * 3.8} ${ey - 3.2} L${o} ${ey + 0.6}" stroke="#1a1010" stroke-width="1" fill="#1a1010" stroke-linejoin="round"/>`;
      out += [0.1, 0.4, 0.7].map((t) => { const lx = x + s * ew * (t * 1.1); return `<path d="M${lx} ${ey - eh * 1.05} l${s * (0.8 + t * 1.6)} -${2.4 - t * 0.6}" stroke="#1a1010" stroke-width=".75" stroke-linecap="round"/>`; }).join('');
    }
    else if (k.lashes) out += `<path d="M${x - 2} ${ey - 2.8} l-0.5 -1.8 M${x + 2} ${ey - 2.8} l0.5 -1.8" stroke="#111" stroke-width=".8"/>`;
    return out;
  };
  if (k.sunglasses) {
    p.push(`<path d="M34 47 H48 Q48 57 41 57 Q34 57 34 47Z M52 47 H66 Q66 57 59 57 Q52 57 52 47Z" fill="#0b0b0b"/><path d="M48 48.5 H52" stroke="#0b0b0b" stroke-width="2"/><path d="M36 49 l4 0 M54 49 l4 0" stroke="rgba(255,255,255,.45)" stroke-width="1.2"/>`);
  } else {
    p.push(eye(41.5, false), eye(58.5, true));
    if (k.glasses || k.roundGlasses) {
      const g = k.roundGlasses ? `<circle cx="41.5" cy="51" r="6.2"/><circle cx="58.5" cy="51" r="6.2"/>` : `<rect x="34.5" y="46" width="14" height="10" rx="2.5"/><rect x="51.5" y="46" width="14" height="10" rx="2.5"/>`;
      p.push(`<g stroke="#3f3f46" stroke-width="1.5" fill="rgba(255,255,255,.12)">${g}</g><path d="M${k.roundGlasses ? 47.7 : 48.5} 50.5 H${k.roundGlasses ? 52.3 : 51.5}" stroke="#3f3f46" stroke-width="1.5"/>`);
    }
  }
  if (k.beautyMark) p.push(`<circle cx="${R - 9}" cy="66" r=".9" fill="#3b2314"/>`);

  // nose
  if (k.fem) p.push(`<path d="M51 55 C52 58 51.5 59.6 49.8 59.8 M47.8 59.4 Q49 60.4 49.8 59.8" stroke="${shade(sk, -0.25)}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".55"/>`);
  else p.push(`<path d="M50.5 50 C51 55 52.5 58 51.5 60 C50.5 61 48.5 60.8 47.5 60" stroke="${shade(sk, -0.28)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".6"/>`);
  if (k.glam) p.push('<path d="M49.5 52 L49.8 57" stroke="#fff" stroke-width="1" opacity=".35"/>');

  // mouth
  if (k.mustache) p.push(`<path d="M41 64 C44 60.5 48 61.5 50 63 C52 61.5 56 60.5 59 64 C55 65.5 52 64.5 50 64.2 C48 64.5 45 65.5 41 64Z" fill="${HR}"/>`);
  if (k.lips && k.glam) {
    // full, overlined, glossy lips
    p.push(`<path d="M41.5 66.2 C43.5 62.2 47 61.6 50 63.6 C53 61.6 56.5 62.2 58.5 66.2 C55 67.2 45 67.2 41.5 66.2Z" fill="url(#${id}lp)"/><path d="M41.5 66.2 C43 73.2 57 73.2 58.5 66.2 C55 67.2 45 67.2 41.5 66.2Z" fill="url(#${id}lp)"/><ellipse cx="50" cy="69.6" rx="4.4" ry="1.3" fill="#fff" opacity=".5"/><path d="M45.5 63.4 Q47.5 62.8 49 63.8" stroke="#fff" stroke-width=".7" opacity=".45" fill="none" stroke-linecap="round"/><path d="M41.5 66.2 C45 67.1 55 67.1 58.5 66.2" stroke="#6d0a31" stroke-width=".6" fill="none" opacity=".8"/>`);
  } else if (k.lips) {
    p.push(`<path d="M43 66 C45.5 63.2 48 63.4 50 64.6 C52 63.4 54.5 63.2 57 66 C54 66.8 46 66.8 43 66Z" fill="url(#${id}lp)"/><path d="M43 66 C45 71 55 71 57 66 C54 66.8 46 66.8 43 66Z" fill="url(#${id}lp)"/><path d="M46.5 68.3 Q50 69.6 53.5 68.3" stroke="#fff" stroke-width="1" opacity=".55" fill="none" stroke-linecap="round"/><path d="M43 66 C46 66.9 54 66.9 57 66" stroke="#7a0d38" stroke-width=".7" fill="none"/>`);
  } else if (k.smile > 0.55) {
    p.push(`<path d="M43.5 65 C46 70 54 70 56.5 65 C53 66.2 47 66.2 43.5 65Z" fill="#7f1d1d"/><path d="M45 65.4 C48 66.4 52 66.4 55 65.4 L54.4 66.8 C51 67.4 49 67.4 45.6 66.8Z" fill="#fff"/>`);
  } else {
    p.push(`<path d="M44.5 66 Q50 ${k.smile > 0.25 ? 68.8 : 67} 55.5 66" stroke="${shade(sk, -0.45)}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`);
  }

  // hair on top (with shine)
  const shine = (d) => `<path d="${d}" stroke="#fff" stroke-width="1.6" opacity=".28" fill="none" stroke-linecap="round"/>`;
  const top = {
    long: `<path d="M${L - 4} 52 C${L - 6} 26 38 18 52 19 C67 20 ${R + 6} 30 ${R + 4} 52 C${R} 40 ${R - 6} 33 60 31 C54 36 44 36 ${L + 6} 38 C${L + 2} 42 ${L} 46 ${L - 4} 52Z" fill="${HR}"/>${shine(`M40 25 C45 22 52 21 58 23`)}`,
    bob: `<path d="M${L - 3} 54 C${L - 5} 28 38 20 50 20 C64 20 ${R + 5} 28 ${R + 3} 54 C${R} 42 ${R - 4} 36 50 35 C${L + 4} 36 ${L} 42 ${L - 3} 54Z" fill="${HR}"/>${shine('M40 26 C45 23 52 22 58 24')}`,
    short: `<path d="M${L - 1} 47 C${L - 2} 30 38 21 51 21 C64 21 ${R + 2} 30 ${R + 1} 47 C${R - 2} 38 ${R - 6} 34 56 33 C50 35 42 34 ${L + 5} 36 C${L + 2} 39 ${L} 42 ${L - 1} 47Z" fill="${HR}"/>${shine('M42 26 C47 23.5 53 23.5 58 25')}`,
    fade: `<path d="M${L} 44 C${L} 30 40 24 50 24 C60 24 ${R} 30 ${R} 44 C${R - 4} 36 58 33 50 33 C42 33 ${L + 4} 36 ${L} 44Z" fill="${HR}"/><path d="M${L} 44 L${L} 52 M${R} 44 L${R} 52" stroke="${hc}" stroke-width="2" opacity=".35"/>`,
    messy: `<path d="M${L - 2} 48 C${L - 4} 34 ${L - 2} 26 36 25 L38 18 L44 24 L49 15 L54 23 L61 17 L62 25 C${R} 26 ${R + 3} 34 ${R + 2} 48 C${R - 2} 38 58 34 50 34 C42 34 ${L + 2} 38 ${L - 2} 48Z" fill="${HR}"/>`,
    spiky: `<path d="M${L} 44 L${L - 3} 28 L36 31 L36 17 L44 26 L49 11 L54 26 L63 16 L64 31 L${R + 3} 28 L${R} 44 C${R - 4} 36 58 33 50 33 C42 33 ${L + 4} 36 ${L} 44Z" fill="${HR}"/>`,
    pigtails: `<path d="M${L - 1} 48 C${L - 2} 28 38 21 50 21 C62 21 ${R + 2} 28 ${R + 1} 48 C${R - 4} 36 56 32 50 32 C44 32 ${L + 4} 36 ${L - 1} 48Z" fill="${HR}"/><circle cx="${L - 2}" cy="40" r="2.4" fill="#f472b6"/><circle cx="${R + 2}" cy="40" r="2.4" fill="#f472b6"/>`,
    curls: [30, 37, 44, 51, 58, 65, 71].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 24 : 28}" r="7" fill="${HR}"/>`).join('') + `<circle cx="${L - 1}" cy="40" r="6" fill="${HR}"/><circle cx="${R + 1}" cy="40" r="6" fill="${HR}"/><circle cx="${L}" cy="49" r="4.5" fill="${HR}"/><circle cx="${R}" cy="49" r="4.5" fill="${HR}"/>`,
    bun: `<circle cx="50" cy="17" r="8" fill="${HR}"/><path d="M${L - 1} 48 C${L - 2} 30 38 23 50 23 C62 23 ${R + 2} 30 ${R + 1} 48 C${R - 4} 37 58 34 50 34 C42 34 ${L + 4} 37 ${L - 1} 48Z" fill="${HR}"/>`,
    bald: `<path d="M${L - 1} 56 C${L - 2} 48 ${L} 43 ${L + 4} 42 L${L + 4} 56Z M${R + 1} 56 C${R + 2} 48 ${R} 43 ${R - 4} 42 L${R - 4} 56Z" fill="${HR}"/>${shine('M42 31 C45 29 49 29 52 30')}`,
    side: `<path d="M${L - 1} 52 C${L - 2} 40 ${L + 2} 35 ${L + 8} 34 L${L + 7} 52Z M${R + 1} 52 C${R + 2} 40 ${R - 2} 35 ${R - 8} 34 L${R - 7} 52Z" fill="${HR}"/>`,
    cap: `<path d="M${L - 1} 44 C${L - 1} 26 38 19 50 19 C62 19 ${R + 1} 26 ${R + 1} 44Z" fill="${k.shirt === '#111' ? '#dc2626' : '#18181b'}"/><path d="M${L - 1} 42 H${R + 18} C${R + 17} 47 ${R + 8} 47 ${L} 46Z" fill="${k.shirt === '#111' ? '#991b1b' : '#27272a'}"/>${shine('M40 25 C45 22 52 22 57 23')}`,
    flatcap: `<path d="M${L - 2} 42 C${L} 27 38 23 50 23 C63 23 ${R + 6} 28 ${R + 9} 38 L${L - 2} 44Z" fill="#5b4a3a"/><path d="M${L} 40 L${R + 7} 37" stroke="#3f3328" stroke-width="1"/>`,
    beanie: `<path d="M${L - 1} 44 C${L - 1} 22 38 14 50 14 C62 14 ${R + 1} 22 ${R + 1} 44Z" fill="#b45309"/><rect x="${L - 2}" y="39" width="${W * 2 + 4}" height="7" rx="3" fill="#92400e"/><path d="M40 20 v18 M46 16 v22 M52 15 v23 M58 17 v21" stroke="#92400e" stroke-width=".8" opacity=".6"/>`,
  }[k.hair] || '';
  p.push(top);
  // glam: face-framing strands for volume
  if (k.glam && k.hair === 'long') p.push(`<path d="M${L + 1} 36 C${L - 5} 50 ${L - 2} 66 ${L - 7} 82 C${L - 4} 70 ${L - 9} 56 ${L - 4} 44Z" fill="${HR}"/><path d="M${R - 1} 36 C${R + 5} 50 ${R + 2} 66 ${R + 7} 82 C${R + 4} 70 ${R + 9} 56 ${R + 4} 44Z" fill="${HR}"/><path d="M${L + 2} 40 C${L - 2} 54 ${L} 66 ${L - 4} 78" stroke="#fff" stroke-width="1" opacity=".25" fill="none"/>`);
  if (k.headband) p.push(`<rect x="${L - 1}" y="35" width="${W * 2 + 2}" height="5" rx="2.5" fill="#ef4444"/>`);
  if (k.flower) p.push(`<g transform="translate(${R - 2} 32)"><circle cx="0" cy="-5" r="3.5" fill="#f472b6"/><circle cx="5" cy="0" r="3.5" fill="#f472b6"/><circle cx="0" cy="5" r="3.5" fill="#f472b6"/><circle cx="-5" cy="0" r="3.5" fill="#f472b6"/><circle r="3" fill="#fde047"/></g>`);
  if (k.crown) p.push('<path d="M35 22 L38 8 L44 16 L50 4 L56 16 L62 8 L65 22Z" fill="#fbbf24" stroke="#b45309" stroke-width="1"/><circle cx="50" cy="14" r="2" fill="#ef4444"/><circle cx="41" cy="18" r="1.3" fill="#38bdf8"/><circle cx="59" cy="18" r="1.3" fill="#38bdf8"/>');
  if (k.headset) p.push(`<path d="M${L - 3} 52 C${L - 4} 18 ${R + 4} 18 ${R + 3} 52" stroke="#18181b" stroke-width="4" fill="none"/><rect x="${L - 8}" y="44" width="9" height="16" rx="3.5" fill="#22c55e"/><rect x="${R - 1}" y="44" width="9" height="16" rx="3.5" fill="#22c55e"/><path d="M${L - 4} 58 C${L - 2} 68 40 70 43 69" stroke="#18181b" stroke-width="2" fill="none"/><circle cx="43" cy="69" r="2.4" fill="#18181b"/>`);
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="stroke:none;fill:none;stroke-width:1">${p.join('')}</svg>`;
}

// The legendary VIP (shop). Same generator, glam edition.
export const VIP = { id: 'chaya:VIP', name: 'Chaya Diamond', arch: 'chaya', g: 'f' };
export const vipAvatar = () => avatarSvg(VIP, {
  bg: '#3b0764', hair: 'long', hairColor: '#f5d06f', skin: '#d89c6c', eye: '#5b3a1e', crown: true, sparkles: true,
  sunglasses: false, glam: true, fem: true, lashes: true, lips: true, hoops: true, blush: true, beautyMark: true, shirt: '#fbbf24',
});
export const VIP_LINES = [
  'babe du bist literally der beste producer der welt, periodt 💅👑',
  'ich hab deinen letzten beat 40x gehört und mein BBL hat jedes mal getanzt 🍑✨',
  'du hast 3 jahre durchgezogen?? das ist so slay, ich bin obsessed 😍',
  'heute noch was abgeben? dann bist du mein ceo, no cap 💼💋',
  'reminder: du bist iconic. jetzt ab ins studio, bestie 🎧💖',
];
