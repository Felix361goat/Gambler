// Long-term career goals. You enter your real numbers (Spotify monthly
// listeners, followers, releases …) every now and then; every milestone
// pays coins and the big ones unlock exclusive items you can't buy.
//
// steps: [value, name, coins, extra?]  extra = { item, title }

export const PLATFORMS = {
  spotify: {
    label: 'Spotify', unit: 'monatliche Hörer', icon: '🎧', color: '#1db954',
    steps: [
      [10, 'Freunde & Familie', 50], [50, 'Erste Fremde hören zu', 75], [100, 'Dreistellig', 100], [250, 'Kleiner Kreis', 150],
      [500, 'Lokal bekannt', 200], [1000, 'Die ersten Tausend', 400], [2500, 'Die Szene merkt dich', 500], [5000, 'Playlist-Material', 700],
      [10000, '10K – Verified-Vibes', 1200, { item: 'frame-verified' }], [25000, 'Rising Star', 2000], [50000, 'Halbe 100K', 3000],
      [100000, 'Established Artist', 6000, { item: 'banner-festival' }], [250000, 'Headliner-Potenzial', 9000], [500000, 'Halbe Million', 14000],
      [1000000, 'Millionen-Artist', 25000, { item: 'obj-platinwall' }], [5000000, 'Superstar', 60000],
    ],
  },
  tiktok: {
    label: 'TikTok', unit: 'Follower', icon: '📱', color: '#ff0050',
    steps: [
      [100, 'Erste 100', 30], [500, 'Kleine Community', 60], [1000, 'LIVE-Niveau', 120], [5000, 'Sounds werden benutzt', 250],
      [10000, 'Creator-Status', 500, { item: 'obj-ringlight' }], [50000, 'Viraler Moment', 1500], [100000, 'Viral-Maschine', 3000, { item: 'obj-tourbus' }],
      [500000, 'Halbe Million', 8000], [1000000, 'Million Follower', 15000],
    ],
  },
  instagram: {
    label: 'Instagram', unit: 'Follower', icon: '📸', color: '#e1306c',
    steps: [
      [100, 'Erste 100', 30], [500, 'Freundeskreis+', 60], [1000, '1K', 120], [5000, 'Szene-Account', 250],
      [10000, '10K – Influencer-Level', 500], [50000, 'Brand-Deals möglich', 1500], [100000, '100K', 3000],
      [500000, 'Halbe Million', 8000], [1000000, 'Million Follower', 15000],
    ],
  },
  youtube: {
    label: 'YouTube', unit: 'Abonnenten', icon: '▶️', color: '#ff0000',
    steps: [
      [100, 'Erste 100', 30], [500, 'Kanal lebt', 60], [1000, 'Monetarisierungs-Grenze', 200], [10000, '10K', 600],
      [100000, 'Silver Play Button', 3000, { item: 'obj-silverbutton' }], [1000000, 'Gold Play Button', 20000, { item: 'obj-goldbutton' }],
    ],
  },
  releases: {
    label: 'Releases', unit: 'veröffentlichte Songs', icon: '💿', color: '#a855f7',
    steps: [
      [1, 'Erster Release', 150], [3, 'Dranbleiber', 200], [5, 'EP-Größe', 300], [10, 'Album-Größe', 600, { item: 'obj-recorddeal' }],
      [25, 'Fleißiger Artist', 1200], [50, 'Katalog-Artist', 3000], [100, 'Legenden-Katalog', 8000],
    ],
  },
};

// Your career title follows Spotify monthly listeners.
export const CAREER_TITLES = [
  [0, 'Bedroom Artist'], [100, 'Newcomer'], [1000, 'Upcoming'], [10000, 'Rising'],
  [100000, 'Established Artist'], [1000000, 'Star'], [5000000, 'Superstar'],
];
export const careerTitle = (listeners = 0) => [...CAREER_TITLES].reverse().find(([n]) => listeners >= n)[1];

// Exclusive rewards – not in the shop.
export const CAREER_ITEMS = {
  'frame-verified': { name: 'Verified-Rahmen', cat: 'frames', price: 0 },
  'banner-festival': { name: 'Festival-Bühne', cat: 'banners', price: 0 },
  'obj-ringlight': { name: 'Creator-Ringlicht', emoji: '🔆', cat: 'studio', price: 0 },
  'obj-tourbus': { name: 'Tourbus', emoji: '🚌', cat: 'studio', price: 0 },
  'obj-silverbutton': { name: 'Silver Play Button', emoji: '🥈', cat: 'studio', price: 0 },
  'obj-goldbutton': { name: 'Gold Play Button', emoji: '🥇', cat: 'studio', price: 0 },
  'obj-platinwall': { name: 'Platin-Wand', emoji: '💿', cat: 'studio', price: 0 },
  'obj-recorddeal': { name: 'Plattenvertrag (gerahmt)', emoji: '📜', cat: 'studio', price: 0 },
};

export const fmtNum = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0).replace('.', ',')} Mio.` : n >= 1e4 ? `${Math.round(n / 1e3)}K` : n.toLocaleString('de-DE'));
