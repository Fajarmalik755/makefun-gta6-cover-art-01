// Wires Sunset Coast Cover Studio: builds the controls, keeps the cover
// state, draws the canvas, and handles history, compare, export and shots.
import { SAMPLES, LAYOUTS, GRADES, PRESETS, defaultState, cloneState, applyPreset, ensurePanels } from './state.js';
import { drawCover, renderToSize, panelAt, panelBoundsFor, panelTransform } from './render.js';
import { applySmartCrop } from './smartcrop.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusLine = document.getElementById('status');
const undoButton = document.getElementById('undo');
const redoButton = document.getElementById('redo');
const compareButton = document.getElementById('compare');
const layoutsBox = document.getElementById('layouts');
const gradesBox = document.getElementById('grades');
const presetsBox = document.getElementById('presets');
const photosBox = document.getElementById('photos');
const uploadInput = document.getElementById('upload');
const zoomInput = document.getElementById('zoom');
const smartCropButton = document.getElementById('smartcrop');
const tagInput = document.getElementById('tag');
const panelTitle = document.getElementById('panel-title');

const TEXT_FIELDS = ['title', 'subtitle', 'quote', 'tagline', 'billing', 'seal', 'volume'];

let state = defaultState();
const images = new Map();
let past = [];
let future = [];
let rawPreview = false;
let drag = null;
let pendingSnapshot = null;
let zoomSnapshot = null;

function say(message) {
  statusLine.textContent = message;
}

function clamp(value, low, high) {
  return Math.min(Math.max(value, low), high);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${url}`));
    img.src = url;
  });
}

async function loadSample(id) {
  if (!images.has(id)) images.set(id, await loadImage(`samples/${id}.jpg`));
  return images.get(id);
}

async function imageFor(panel) {
  const key = panel.upload || panel.photo;
  if (!key) return null;
  if (!images.has(key)) {
    images.set(key, await loadImage(panel.upload ? key : `samples/${key}.jpg`));
  }
  return images.get(key);
}

async function preloadPanels() {
  for (const panel of state.panels) {
    try {
      await imageFor(panel);
    } catch {
      // A missing photo just leaves its panel empty.
    }
  }
}

function selectedPanel() {
  return state.panels[state.selected];
}

function redraw() {
  drawCover(canvas, state, images, { raw: rawPreview, highlight: rawPreview ? -1 : state.selected });
}

function remember() {
  past.push(cloneState(state));
  if (past.length > 60) past.shift();
  future = [];
  refreshHistory();
}

function refreshHistory() {
  undoButton.disabled = past.length === 0;
  redoButton.disabled = future.length === 0;
}

function undo() {
  if (!past.length) return;
  future.push(cloneState(state));
  state = past.pop();
  syncControls();
  redraw();
  refreshHistory();
  say('Undid the last change.');
}

function redo() {
  if (!future.length) return;
  past.push(cloneState(state));
  state = future.pop();
  syncControls();
  redraw();
  refreshHistory();
  say('Redid the change.');
}

function markActive(box, id) {
  for (const button of box.querySelectorAll('button')) {
    button.classList.toggle('active', button.dataset.id === id);
  }
}

function syncControls() {
  markActive(layoutsBox, state.layout);
  markActive(gradesBox, state.grade);
  for (const field of TEXT_FIELDS) {
    document.getElementById(`text-${field}`).value = state.texts[field];
  }
  const panel = selectedPanel();
  zoomInput.value = String(panel.zoom);
  tagInput.value = panel.tag;
  markActive(photosBox, panel.upload ? '' : panel.photo);
  panelTitle.textContent = `Panel ${state.selected + 1} of ${state.panels.length}`;
}

function buildChoices(box, items, onPick) {
  box.innerHTML = '';
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.dataset.id = item.id;
    button.textContent = item.name;
    if (item.hint) button.title = item.hint;
    button.addEventListener('click', () => onPick(item.id));
    box.appendChild(button);
  }
}

function buildPhotos() {
  photosBox.innerHTML = '';
  for (const sample of SAMPLES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'photo';
    button.dataset.id = sample.id;
    const thumb = document.createElement('img');
    thumb.src = `samples/${sample.id}.jpg`;
    thumb.alt = sample.label;
    const label = document.createElement('span');
    label.textContent = sample.label;
    button.append(thumb, label);
    button.addEventListener('click', () => pickPhoto(sample.id));
    photosBox.appendChild(button);
  }
}

async function pickPhoto(id) {
  const panel = selectedPanel();
  if (panel.photo === id && !panel.upload) return;
  remember();
  panel.photo = id;
  panel.upload = null;
  panel.uploadName = '';
  const img = await loadSample(id);
  applySmartCrop(panel, img);
  syncControls();
  redraw();
  say(`Panel photo: ${id}. Smart crop applied.`);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const hit = panelAt(state, point.x, point.y, canvas.width, canvas.height);
  if (hit === -1) return;
  if (hit !== state.selected) {
    state.selected = hit;
    syncControls();
    redraw();
  }
  canvas.setPointerCapture(event.pointerId);
  const panel = selectedPanel();
  drag = { x: point.x, y: point.y, fx: panel.fx, fy: panel.fy, snapshot: cloneState(state), moved: false };
});

canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const point = canvasPoint(event);
  const panel = selectedPanel();
  const img = images.get(panel.upload || panel.photo);
  if (!img) return;
  const bounds = panelBoundsFor(state, state.selected, canvas.width, canvas.height);
  const t = panelTransform(panel, img, bounds);
  panel.fx = clamp(drag.fx - (point.x - drag.x) / t.dw, 0, 1);
  panel.fy = clamp(drag.fy - (point.y - drag.y) / t.dh, 0, 1);
  if (panel.fx !== drag.fx || panel.fy !== drag.fy) drag.moved = true;
  redraw();
});

canvas.addEventListener('pointerup', () => {
  if (drag && drag.moved) {
    past.push(drag.snapshot);
    future = [];
    refreshHistory();
  }
  drag = null;
});

canvas.addEventListener('pointercancel', () => {
  drag = null;
});

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function canvasToBlob(offscreen) {
  return new Promise((resolve) => offscreen.toBlob(resolve, 'image/png'));
}

async function exportSize(width, height) {
  const off = renderToSize(state, images, width, height, {});
  const blob = await canvasToBlob(off);
  downloadBlob(blob, `sunset-coast-cover-${width}x${height}.png`);
  say(`Saved sunset-coast-cover-${width}x${height}.png`);
}

document.querySelectorAll('.export').forEach((button) => {
  button.addEventListener('click', async () => {
    await exportSize(Number(button.dataset.w), Number(button.dataset.h));
  });
});

document.getElementById('export-all').addEventListener('click', async () => {
  for (const [w, h] of [[1080, 1080], [1080, 1350], [1920, 1080]]) {
    await exportSize(w, h);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
});

smartCropButton.addEventListener('click', () => {
  const panel = selectedPanel();
  const img = images.get(panel.upload || panel.photo);
  if (!img) {
    say('Pick a photo first.');
    return;
  }
  remember();
  const focus = applySmartCrop(panel, img);
  syncControls();
  redraw();
  say(`Smart crop centered on the focus point (${Math.round(focus.x * 100)}%, ${Math.round(focus.y * 100)}%).`);
});

uploadInput.addEventListener('change', async () => {
  const file = uploadInput.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    images.set(url, img);
    remember();
    const panel = selectedPanel();
    panel.upload = url;
    panel.uploadName = file.name;
    applySmartCrop(panel, img);
    syncControls();
    redraw();
    say(`Uploaded ${file.name}. Smart crop applied.`);
  } catch {
    URL.revokeObjectURL(url);
    say('That file could not be read as a photo.');
  }
  uploadInput.value = '';
});

zoomInput.addEventListener('pointerdown', () => {
  zoomSnapshot = cloneState(state);
});
zoomInput.addEventListener('focus', () => {
  zoomSnapshot = cloneState(state);
});
zoomInput.addEventListener('input', () => {
  selectedPanel().zoom = Number(zoomInput.value);
  redraw();
});
zoomInput.addEventListener('change', () => {
  if (zoomSnapshot) {
    past.push(zoomSnapshot);
    future = [];
    refreshHistory();
    zoomSnapshot = null;
  }
});

tagInput.addEventListener('focusin', () => {
  pendingSnapshot = cloneState(state);
});
tagInput.addEventListener('input', () => {
  selectedPanel().tag = tagInput.value;
  redraw();
});
tagInput.addEventListener('change', () => {
  if (pendingSnapshot && pendingSnapshot.panels[state.selected].tag !== selectedPanel().tag) {
    past.push(pendingSnapshot);
    future = [];
    refreshHistory();
  }
  pendingSnapshot = null;
});

function startCompare(event) {
  event.preventDefault();
  rawPreview = true;
  compareButton.classList.add('holding');
  redraw();
}

function endCompare() {
  rawPreview = false;
  compareButton.classList.remove('holding');
  redraw();
}

compareButton.addEventListener('pointerdown', startCompare);
compareButton.addEventListener('pointerup', endCompare);
compareButton.addEventListener('pointerleave', endCompare);
compareButton.addEventListener('pointercancel', endCompare);

undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);

async function init() {
  buildChoices(
    layoutsBox,
    Object.entries(LAYOUTS).map(([id, layout]) => ({ id, name: layout.name, hint: layout.hint })),
    (id) => {
      if (id === state.layout) return;
      remember();
      state.layout = id;
      ensurePanels(state);
      syncControls();
      redraw();
      say(`Layout: ${LAYOUTS[id].name}.`);
    },
  );
  buildChoices(
    gradesBox,
    Object.entries(GRADES).map(([id, grade]) => ({ id, name: grade.name })),
    (id) => {
      if (id === state.grade) return;
      remember();
      state.grade = id;
      syncControls();
      redraw();
      say(`Color grade: ${GRADES[id].name}.`);
    },
  );
  buildChoices(
    presetsBox,
    PRESETS.map((preset) => ({ id: preset.name, name: preset.name })),
    async (name) => {
      const preset = PRESETS.find((p) => p.name === name);
      remember();
      applyPreset(state, preset);
      await preloadPanels();
      syncControls();
      redraw();
      say(`Preset: ${preset.name}.`);
    },
  );
  buildPhotos();
  for (const field of TEXT_FIELDS) {
    const input = document.getElementById(`text-${field}`);
    input.addEventListener('focusin', () => {
      pendingSnapshot = cloneState(state);
    });
    input.addEventListener('input', () => {
      state.texts[field] = input.value;
      redraw();
    });
    input.addEventListener('change', () => {
      if (pendingSnapshot && pendingSnapshot.texts[field] !== state.texts[field]) {
        past.push(pendingSnapshot);
        future = [];
        refreshHistory();
      }
      pendingSnapshot = null;
    });
  }
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  await preloadPanels();
  try {
    await document.fonts.load('40px Anton');
    await document.fonts.load('20px Pacifico');
  } catch {
    // The canvas falls back to system fonts.
  }
  await document.fonts.ready;
  if (shot) {
    await runShot(shot, params, {
      canvas,
      state,
      images,
      loadSample,
      draw: (c, s, imgs, o) => drawCover(c, s, imgs, o),
    });
  } else {
    syncControls();
    redraw();
  }
  refreshHistory();
  say('Ready. Pick a layout, a grade, and a preset — or build your own cover.');
}

init();
