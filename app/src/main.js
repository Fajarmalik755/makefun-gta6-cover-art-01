// Wires Sunset Coast Cover Studio: editor controls, panel picking + panning,
// undo/redo, before/after, PNG export at three sizes, and the ?shot= scenes.

import { defaultState, GRADES, LAYOUTS, PRESETS, snapshot, restore, layoutRects } from './state.js';
import { drawCover } from './render.js';
import { findFocus } from './smartcrop.js';

const $ = (id) => document.getElementById(id);
const canvas = $('stage');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');

let state = defaultState();
let undoStack = [];
let redoStack = [];
let before = false;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  await Promise.all(state.panels.map(async (p) => {
    try { p.img = await loadImage(p.src); } catch { p.img = null; }
  }));
}

function pushHistory() {
  undoStack.push(snapshot(state));
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
}

function redraw() {
  drawCover(ctx, state, canvas.width, canvas.height, { bare: before });
  if (!shot) syncPanelInputs();
}

function syncPanelInputs() {
  const p = state.panels[state.selected];
  if (!p) return;
  $('inTag').value = p.tag || '';
  $('inZoom').value = p.zoom || 1;
  $('panelHint').textContent = `Panel ${state.selected + 1} selected — ${p.tag || 'no tag'}. Click another panel to switch.`;
}

// ---- control builders ----
function buildButtons() {
  const lr = $('layoutRow');
  Object.entries(LAYOUTS).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = def.label; b.dataset.layout = key;
    b.classList.toggle('active', state.layout === key);
    b.addEventListener('click', () => {
      if (state.layout === key) return;
      pushHistory(); state.layout = key; state.selected = 0; buildButtons(); redraw();
    });
    lr.appendChild(b);
  });
  const gr = $('gradeRow');
  Object.entries(GRADES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = def.label; b.dataset.grade = key;
    b.classList.toggle('active', state.grade === key);
    b.addEventListener('click', () => {
      if (state.grade === key) return;
      pushHistory(); state.grade = key; buildButtons(); redraw();
    });
    gr.appendChild(b);
  });
  const pr = $('presetRow');
  Object.entries(PRESETS).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = def.label;
    b.addEventListener('click', () => {
      pushHistory();
      Object.assign(state, { layout: def.layout, grade: def.grade, title: def.title, subtitle: def.subtitle, quote: def.quote });
      syncTextInputs(); buildButtons(); redraw();
    });
    pr.appendChild(b);
  });
}

function syncTextInputs() {
  $('inTitle').value = state.title;
  $('inSubtitle').value = state.subtitle;
  $('inQuote').value = state.quote;
  $('inTagline').value = state.tagline;
  $('inBilling').value = state.billing;
  $('inSeal').value = state.seal;
  $('inVol').value = state.vol;
}

function bindText(id, key) {
  $(id).addEventListener('input', (e) => { state[key] = e.target.value; redraw(); });
  $(id).addEventListener('change', () => pushHistory());
}
bindText('inTitle', 'title'); bindText('inSubtitle', 'subtitle'); bindText('inQuote', 'quote');
bindText('inTagline', 'tagline'); bindText('inBilling', 'billing'); bindText('inSeal', 'seal'); bindText('inVol', 'vol');

$('inTag').addEventListener('input', (e) => { state.panels[state.selected].tag = e.target.value; redraw(); });
$('inTag').addEventListener('change', () => pushHistory());
$('inZoom').addEventListener('input', (e) => { state.panels[state.selected].zoom = Number(e.target.value); redraw(); });
$('inZoom').addEventListener('change', () => pushHistory());

$('smartCropBtn').addEventListener('click', () => {
  const p = state.panels[state.selected];
  if (!p.img) return;
  pushHistory();
  const f = findFocus(p.img);
  p.fx = f.fx; p.fy = f.fy; p.ox = 0; p.oy = 0;
  if (p.zoom < 1.25) p.zoom = 1.25;
  $('status').textContent = `Smart crop: focus near ${Math.round(f.fx * 100)}%, ${Math.round(f.fy * 100)}% (on-device heuristic).`;
  redraw();
});

$('applyAllBtn').addEventListener('click', () => {
  const src = state.panels[state.selected];
  if (!src.img) return;
  pushHistory();
  state.panels.forEach((p) => { p.img = src.img; p.src = src.src; p.zoom = src.zoom; p.ox = src.ox; p.oy = src.oy; });
  $('status').textContent = 'Photo applied to all panels.';
  redraw();
});

$('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    pushHistory();
    const p = state.panels[state.selected];
    p.img = img; p.src = url; p.zoom = 1; p.ox = 0; p.oy = 0; delete p.fx; delete p.fy;
    $('status').textContent = `Loaded ${file.name} into panel ${state.selected + 1}.`;
    redraw();
  } catch { $('status').textContent = 'That file could not be read as an image.'; }
  e.target.value = '';
});

// ---- canvas picking + panning ----
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
}
function panelAt(x, y) {
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  const i = panelAt(pt.x, pt.y);
  if (i < 0) return;
  state.selected = i;
  drag = { x: pt.x, y: pt.y, moved: false, ox: state.panels[i].ox, oy: state.panels[i].oy };
  canvas.setPointerCapture(e.pointerId);
  syncPanelInputs();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const pt = canvasPoint(e);
  const dx = pt.x - drag.x, dy = pt.y - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
  const p = state.panels[state.selected];
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  const r = rects[state.selected];
  p.ox = Math.max(-1, Math.min(1, drag.ox + dx / Math.max(20, r.w * 0.4)));
  p.oy = Math.max(-1, Math.min(1, drag.oy + dy / Math.max(20, r.h * 0.4)));
  redraw();
});
canvas.addEventListener('pointerup', () => { if (drag && drag.moved) pushHistory(); drag = null; });

// ---- undo / redo / before-after ----
$('undoBtn').addEventListener('click', () => {
  if (!undoStack.length) return;
  redoStack.push(snapshot(state));
  state = restore(state, undoStack.pop());
  syncTextInputs(); buildButtons(); redraw();
});
$('redoBtn').addEventListener('click', () => {
  if (!redoStack.length) return;
  undoStack.push(snapshot(state));
  state = restore(state, redoStack.pop());
  syncTextInputs(); buildButtons(); redraw();
});
const baBtn = $('beforeAfterBtn');
baBtn.addEventListener('pointerdown', () => { before = true; redraw(); });
['pointerup', 'pointerleave'].forEach((ev) => baBtn.addEventListener(ev, () => { before = false; redraw(); }));

// ---- export ----
export async function renderExport(w, h) {
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  drawCover(off.getContext('2d'), state, w, h, {});
  return off;
}
function download(canvasEl, name) {
  return new Promise((resolve) => {
    canvasEl.toBlob((blob) => {
      if (!blob) { resolve(false); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(true);
    }, 'image/png');
  });
}
async function exportSize(spec) {
  const [w, h] = spec.split('x').map(Number);
  const off = await renderExport(w, h);
  const ok = await download(off, `sunset-coast-cover-${w}x${h}.png`);
  $('status').textContent = ok ? `Saved sunset-coast-cover-${w}x${h}.png` : 'Export failed.';
}
document.querySelectorAll('.export-btn').forEach((b) => {
  b.addEventListener('click', async () => {
    const spec = b.dataset.export;
    b.disabled = true;
    try {
      if (spec === 'all') {
        for (const s of ['1080x1080', '1080x1350', '1920x1080']) await exportSize(s);
        $('status').textContent = 'Saved all 3 sizes.';
      } else await exportSize(spec);
    } finally { b.disabled = false; }
  });
});

// Test hook (harmless in production): lets an automated check render exports
// and read state without clicking through the UI.
window.__coverTest = { renderExport, get state() { return state; } };

// ---- boot + shots ----
async function boot() {
  buildButtons();
  syncTextInputs();
  if (shot === 'cover' || shot === 'cover45' || shot === 'coversq') {
    document.body.classList.add('shot-cover');
    if (shot === 'cover45') { canvas.width = 1080; canvas.height = 1350; }
    else if (shot === 'coversq') { canvas.width = 1080; canvas.height = 1080; }
    else { canvas.width = 1920; canvas.height = 1080; }
  }
  await loadSamples();
  try { await document.fonts.ready; } catch { /* fonts are optional */ }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
boot();
