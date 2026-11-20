// Default state, grades, layouts and preset looks for Sunset Coast Cover Studio.
// All wording here is original copy written for this app.

export const SAMPLES = [
  'samples/boulevard.jpg',
  'samples/pier.jpg',
  'samples/rooftop.jpg',
  'samples/neon.jpg',
  'samples/crew.jpg',
  'samples/getaway.jpg',
];

export const DEFAULT_TAGS = [
  'THE DRIVER', 'THE CAPTAIN', 'THE BOSS', 'THE FIXER', 'THE LOOKOUT', 'THE GETAWAY',
  'THE DRIVER', 'THE CAPTAIN', 'THE BOSS',
];

export function defaultState() {
  return {
    layout: 'hero-six',
    grade: 'sunset',
    title: 'GOLDEN HOUR HEIST',
    subtitle: 'Chasing the Last Light',
    quote: 'FULL THROTTLE INTO THE SUNSET',
    tagline: 'SIX CREW · ONE COAST · NO WAY BACK',
    billing: 'A SUNSET COAST PICTURE · STARRING YOUR CREW · SHOT ON YOUR OWN CAMERA · GRADED AT SUNSET',
    seal: 'BEST CAST',
    vol: 'VOL. 1',
    selected: 0,
    panels: SAMPLES.concat(SAMPLES.slice(0, 3)).map((src, i) => ({
      src, zoom: 1, ox: 0, oy: 0, tag: DEFAULT_TAGS[i] || 'CREW',
    })),
  };
}

// Grades: a canvas filter plus warm overlay tints painted over each photo.
export const GRADES = {
  sunset: { label: 'Sunset', filter: 'saturate(1.35) contrast(1.08) brightness(1.05)', top: 'rgba(255,120,60,0.10)', bottom: 'rgba(190,40,120,0.22)' },
  neon: { label: 'Neon', filter: 'saturate(1.8) contrast(1.15) hue-rotate(-12deg)', top: 'rgba(255,60,180,0.14)', bottom: 'rgba(40,120,255,0.20)' },
  noir: { label: 'Noir', filter: 'grayscale(1) contrast(1.25) brightness(0.95)', top: 'rgba(0,0,0,0.10)', bottom: 'rgba(0,0,0,0.28)' },
  heatwave: { label: 'Heatwave', filter: 'sepia(0.45) saturate(1.6) contrast(1.1) brightness(1.08)', top: 'rgba(255,90,20,0.16)', bottom: 'rgba(160,20,20,0.20)' },
  miami: { label: 'Miami Pastel', filter: 'saturate(1.1) brightness(1.12) hue-rotate(15deg) contrast(0.95)', top: 'rgba(255,170,210,0.14)', bottom: 'rgba(60,200,220,0.16)' },
};

// Layouts: panel rectangles in normalised (0..1) coordinates for the cover.
// `count` is how many panels the layout shows; panel 0 is always the hero.
export const LAYOUTS = {
  'hero-six': { label: 'Hero Six', count: 6 },
  'hero-four': { label: 'Hero Four', count: 4 },
  'full-bleed': { label: 'Full Bleed', count: 1 },
  'nine-grid': { label: 'Nine Grid', count: 9 },
};

export function layoutRects(layout, W, H) {
  const R = (x, y, w, h) => ({ x: x * W, y: y * H, w: w * W, h: h * H });
  if (layout === 'hero-four') {
    return [R(0, 0, 0.60, 1), R(0.60, 0, 0.40, 0.34), R(0.60, 0.34, 0.40, 0.33), R(0.60, 0.67, 0.40, 0.33)];
  }
  if (layout === 'full-bleed') return [R(0, 0, 1, 1)];
  if (layout === 'nine-grid') {
    const out = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(R(c / 3, r / 3, 1 / 3, 1 / 3));
    return out;
  }
  // hero-six (default): big hero left, five panels right.
  return [
    R(0, 0, 0.52, 1),
    R(0.52, 0, 0.24, 0.34), R(0.76, 0, 0.24, 0.34),
    R(0.52, 0.34, 0.24, 0.33), R(0.76, 0.34, 0.24, 0.33),
    R(0.52, 0.67, 0.48, 0.33),
  ];
}

// Three named preset looks: each is a layout + grade + wording bundle.
export const PRESETS = {
  'golden-getaway': { label: 'Golden Getaway', layout: 'hero-six', grade: 'sunset', title: 'GOLDEN HOUR HEIST', subtitle: 'Chasing the Last Light', quote: 'FULL THROTTLE INTO THE SUNSET' },
  'neon-nights': { label: 'Neon Nights', layout: 'hero-four', grade: 'neon', title: 'NEON AFTER DARK', subtitle: 'The City Never Sleeps', quote: 'EVERY LIGHT HIDES A SECRET' },
  'last-resort': { label: 'Last Resort', layout: 'nine-grid', grade: 'heatwave', title: 'ONE LAST JOB', subtitle: 'No Turning Back Now', quote: 'THE COAST REMEMBERS EVERYTHING' },
};

export function snapshot(state) {
  return JSON.parse(JSON.stringify({ ...state, panels: state.panels }));
}

export function restore(state, snap) {
  const imgs = state.panels.map((p) => p.img);
  const fresh = JSON.parse(JSON.stringify(snap));
  fresh.panels.forEach((p, i) => { p.img = imgs[i] || null; });
  return fresh;
}
