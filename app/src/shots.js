// Fixed scenes for screenshots: ?shot=cover, ?shot=cover45 and ?shot=coversq
// render the bare cover at their sizes; ?shot=editor shows the editor.
// window.__shotReady is set once the scene has painted.

import { PRESETS, applyPreset } from './state.js';

const COVER_SIZES = {
  cover: [1920, 1080],
  cover45: [1080, 1350],
  coversq: [1080, 1080],
};

function markReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

async function waitForFonts() {
  try {
    await document.fonts.load('40px Anton');
    await document.fonts.load('20px Pacifico');
  } catch {
    // The canvas falls back to system fonts if a face fails to load.
  }
  await document.fonts.ready;
}

/**
 * Sets up a screenshot scene. `ctx` carries the canvas, the state, an image
 * loader and the draw function, so this file never touches the page itself.
 */
export async function runShot(shot, query, ctx) {
  const { canvas, state, loadSample, draw } = ctx;
  if (COVER_SIZES[shot]) {
    const [w, h] = COVER_SIZES[shot];
    canvas.width = w;
    canvas.height = h;
    document.body.classList.add('shot-cover');
    applyPreset(state, PRESETS[0]);
    const photo = query.get('photo') || 'pier';
    const caption = query.get('caption');
    if (caption) state.texts.title = caption;
    if (photo) state.panels[0].photo = photo;
    const images = new Map();
    for (const panel of state.panels) {
      images.set(panel.photo, await loadSample(panel.photo));
    }
    await waitForFonts();
    draw(canvas, state, images, { highlight: -1 });
    markReady();
    return;
  }
  // Editor scene: leave the canvas and controls as they are.
  await waitForFonts();
  draw(canvas, state, ctx.images, { highlight: state.selected });
  markReady();
}
