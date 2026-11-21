// State for Sunset Coast Cover Studio: the sample photos, the layouts, the
// color grades, the presets, and the default cover. Nothing here touches the
// page; it only describes the cover.

export const SAMPLES = [
  { id: 'boulevard', label: 'Boulevard' },
  { id: 'crew', label: 'Crew' },
  { id: 'getaway', label: 'Getaway' },
  { id: 'neon', label: 'Neon Street' },
  { id: 'pier', label: 'Pier' },
  { id: 'rooftop', label: 'Rooftop' },
];

// Each layout lists its panels as polygons in fractions of the canvas
// (0..1). A rectangle is just a four-corner polygon, so every layout,
// including the diagonal one, is described the same way.
export const LAYOUTS = {
  trio: {
    name: 'Classic Trio',
    hint: 'Three tall panels, side by side.',
    panels: [
      { clip: [[0, 0], [0.32, 0], [0.32, 1], [0, 1]] },
      { clip: [[0.34, 0], [0.66, 0], [0.66, 1], [0.34, 1]] },
      { clip: [[0.68, 0], [1, 0], [1, 1], [0.68, 1]] },
    ],
  },
  hero: {
    name: 'Hero Left',
    hint: 'One big panel on the left, two stacked on the right.',
    panels: [
      { clip: [[0, 0], [0.58, 0], [0.58, 1], [0, 1]] },
      { clip: [[0.6, 0], [1, 0], [1, 0.49], [0.6, 0.49]] },
      { clip: [[0.6, 0.51], [1, 0.51], [1, 1], [0.6, 1]] },
    ],
  },
  grid: {
    name: 'Four Grid',
    hint: 'Four equal panels in a grid.',
    panels: [
      { clip: [[0, 0], [0.49, 0], [0.49, 0.49], [0, 0.49]] },
      { clip: [[0.51, 0], [1, 0], [1, 0.49], [0.51, 0.49]] },
      { clip: [[0, 0.51], [0.49, 0.51], [0.49, 1], [0, 1]] },
      { clip: [[0.51, 0.51], [1, 0.51], [1, 1], [0.51, 1]] },
    ],
  },
  diagonal: {
    name: 'Diagonal Split',
    hint: 'Two panels cut on a diagonal.',
    panels: [
      { clip: [[0, 0], [1, 0], [0, 1]] },
      { clip: [[1, 0], [1, 1], [0, 1]] },
    ],
  },
};

export const GRADES = {
  sunset: {
    name: 'Sunset',
    top: 'rgba(255, 170, 80, 0.10)',
    bottom: 'rgba(190, 40, 110, 0.55)',
    scrim: 'rgba(20, 8, 30, 0.55)',
    text: '#ffffff',
    accent: '#ffb347',
  },
  neon: {
    name: 'Neon',
    top: 'rgba(0, 229, 255, 0.12)',
    bottom: 'rgba(255, 0, 140, 0.50)',
    scrim: 'rgba(8, 4, 28, 0.55)',
    text: '#ffffff',
    accent: '#00e5ff',
  },
  noir: {
    name: 'Noir',
    top: 'rgba(120, 120, 140, 0.08)',
    bottom: 'rgba(0, 0, 0, 0.65)',
    scrim: 'rgba(0, 0, 0, 0.60)',
    text: '#f2f2f2',
    accent: '#c9c9d4',
  },
  vice: {
    name: 'Vice',
    top: 'rgba(255, 110, 199, 0.14)',
    bottom: 'rgba(0, 170, 190, 0.45)',
    scrim: 'rgba(24, 4, 40, 0.55)',
    text: '#ffffff',
    accent: '#ff6ec7',
  },
  pastel: {
    name: 'Pastel',
    top: 'rgba(255, 214, 230, 0.20)',
    bottom: 'rgba(150, 120, 220, 0.35)',
    scrim: 'rgba(40, 24, 60, 0.35)',
    text: '#ffffff',
    accent: '#e58bb1',
  },
};

export const PRESETS = [
  {
    name: 'Sunset Heist',
    layout: 'trio',
    grade: 'sunset',
    texts: {
      title: 'SUNSET HEIST',
      subtitle: 'A Vice City Story',
      quote: 'One last score before the sun goes down.',
      tagline: 'Coming soon',
      billing: 'A fan-made cover',
      seal: 'SC',
      volume: 'Vol. 1',
    },
    panels: [
      { photo: 'pier', tag: 'Heist' },
      { photo: 'boulevard', tag: 'Queen' },
      { photo: 'neon', tag: 'Night' },
    ],
  },
  {
    name: 'Neon Nights',
    layout: 'hero',
    grade: 'neon',
    texts: {
      title: 'NEON NIGHTS',
      subtitle: 'Drive fast. Shine brighter.',
      quote: 'The city never sleeps, and neither do we.',
      tagline: 'Only on the coast',
      billing: 'A fan-made cover',
      seal: 'NN',
      volume: 'Vol. 2',
    },
    panels: [
      { photo: 'neon', tag: 'Drive' },
      { photo: 'crew', tag: 'Crew' },
      { photo: 'rooftop', tag: 'Roof' },
    ],
  },
  {
    name: 'Midnight Drive',
    layout: 'grid',
    grade: 'noir',
    texts: {
      title: 'MIDNIGHT DRIVE',
      subtitle: 'Four streets. One way out.',
      quote: 'Every road leads back to the coast.',
      tagline: 'This winter',
      billing: 'A fan-made cover',
      seal: 'MD',
      volume: 'Vol. 3',
    },
    panels: [
      { photo: 'getaway', tag: 'Run' },
      { photo: 'pier', tag: 'Pier' },
      { photo: 'boulevard', tag: 'City' },
      { photo: 'neon', tag: 'Glow' },
    ],
  },
];

export function makePanel(photo, tag) {
  return {
    photo,
    upload: null,
    uploadName: '',
    zoom: 1.25,
    fx: 0.5,
    fy: 0.5,
    tag: tag || '',
  };
}

export function defaultState() {
  const first = PRESETS[0];
  return {
    layout: first.layout,
    grade: first.grade,
    selected: 0,
    texts: { ...first.texts },
    panels: first.panels.map((p) => makePanel(p.photo, p.tag)),
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function panelsFor(state) {
  return LAYOUTS[state.layout].panels;
}

export function applyPreset(state, preset) {
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.texts = { ...preset.texts };
  state.panels = preset.panels.map((p) => makePanel(p.photo, p.tag));
  state.selected = 0;
}

export function ensurePanels(state) {
  const want = LAYOUTS[state.layout].panels.length;
  while (state.panels.length < want) state.panels.push(makePanel('pier', ''));
  state.panels.length = want;
  if (state.selected >= want) state.selected = 0;
}
