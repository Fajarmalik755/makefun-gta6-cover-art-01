// Draws the cover onto a canvas: the panels clipped to the layout, the
// color grade washed over them, and the cover text on top.

import { LAYOUTS, GRADES } from './state.js';

function pointInPolygon(px, py, polygon) {
  let inside = false;
  for (let a = 0, b = polygon.length - 1; a < polygon.length; b = a++) {
    const [ax, ay] = polygon[a];
    const [bx, by] = polygon[b];
    if (ay > py !== by > py && px < ((bx - ax) * (py - ay)) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}

/** Returns the panel index under a canvas point, or -1. */
export function panelAt(state, px, py, width, height) {
  const panels = LAYOUTS[state.layout].panels;
  for (let i = panels.length - 1; i >= 0; i--) {
    const poly = panels[i].clip.map(([fx, fy]) => [fx * width, fy * height]);
    if (pointInPolygon(px, py, poly)) return i;
  }
  return -1;
}

function panelBounds(polygon, width, height) {
  const xs = polygon.map(([fx]) => fx * width);
  const ys = polygon.map(([, fy]) => fy * height);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };
}

/** The bounding box of one layout panel, in canvas pixels. */
export function panelBoundsFor(state, index, width, height) {
  const clip = LAYOUTS[state.layout].panels[index].clip;
  return panelBounds(clip, width, height);
}

/**
 * Where a panel's photo lands: the cover-fit scale times the panel zoom, and
 * the top-left corner that puts the panel's focus point at the panel center.
 * The corner is clamped so the photo always covers the panel.
 */
export function panelTransform(panel, img, bounds) {
  const base = Math.max(bounds.w / img.naturalWidth, bounds.h / img.naturalHeight);
  const scale = base * panel.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;
  let dx = cx - panel.fx * dw;
  let dy = cy - panel.fy * dh;
  if (dw > bounds.w) dx = Math.min(Math.max(dx, bounds.x + bounds.w - dw), bounds.x);
  else dx = bounds.x + (bounds.w - dw) / 2;
  if (dh > bounds.h) dy = Math.min(Math.max(dy, bounds.y + bounds.h - dh), bounds.y);
  else dy = bounds.y + (bounds.h - dh) / 2;
  return { scale, dx, dy, dw, dh };
}

function drawPanelImage(ctx, img, panel, bounds) {
  const t = panelTransform(panel, img, bounds);
  ctx.drawImage(img, t.dx, t.dy, t.dw, t.dh);
}

function fitFont(ctx, text, start, maxWidth, family, weight) {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawTexts(ctx, state, grade, width, height) {
  const t = state.texts;
  const pad = Math.round(width * 0.05);
  const unit = Math.min(width, height);
  const titleSize = fitFont(ctx, t.title, Math.round(unit * 0.11), width - pad * 2, 'Anton, sans-serif', 400);
  const subSize = Math.max(12, Math.round(titleSize * 0.3));
  const quoteSize = Math.max(13, Math.round(titleSize * 0.28));
  const footSize = Math.max(11, Math.round(titleSize * 0.19));
  const smallSize = Math.max(11, Math.round(titleSize * 0.21));

  // Stack the text block upward from the foot of the cover.
  const footBase = height - Math.round(height * 0.035);
  const subBase = footBase - Math.round(height * 0.035) - footSize;
  const titleBase = subBase - Math.round(titleSize * 0.45);
  const titleTop = titleBase - titleSize;
  const quoteBase = titleTop - Math.round(height * 0.02);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = Math.round(titleSize * 0.15);
  ctx.shadowOffsetY = Math.round(titleSize * 0.03);
  ctx.font = `${titleSize}px Anton, sans-serif`;
  ctx.fillStyle = grade.text;
  ctx.fillText(t.title, pad, titleBase);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.font = `700 ${subSize}px system-ui, sans-serif`;
  ctx.fillStyle = grade.accent;
  ctx.fillText(t.subtitle, pad, subBase);

  ctx.font = `${quoteSize}px Pacifico, cursive`;
  ctx.fillStyle = grade.text;
  ctx.globalAlpha = 0.95;
  ctx.fillText(t.quote, pad, quoteBase);
  ctx.globalAlpha = 1;

  ctx.font = `600 ${footSize}px system-ui, sans-serif`;
  ctx.fillStyle = grade.text;
  ctx.fillText(t.tagline, pad, footBase);
  const billingWidth = ctx.measureText(t.billing).width;
  ctx.fillText(t.billing, width - pad - billingWidth, footBase);

  // Volume at the top left, seal badge at the top right.
  ctx.font = `700 ${smallSize}px system-ui, sans-serif`;
  ctx.fillText(t.volume, pad, pad + smallSize);
  const sealR = Math.round(titleSize * 0.42);
  const sealX = width - pad - sealR;
  const sealY = pad + sealR;
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
  ctx.fillStyle = grade.accent;
  ctx.fill();
  ctx.lineWidth = Math.max(2, Math.round(sealR * 0.08));
  ctx.strokeStyle = grade.text;
  ctx.stroke();
  ctx.fillStyle = grade.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const sealSize = fitFont(ctx, t.seal, Math.round(sealR * 0.9), sealR * 1.5, 'Anton, sans-serif', 400);
  ctx.font = `${sealSize}px Anton, sans-serif`;
  ctx.fillText(t.seal, sealX, sealY + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawTag(ctx, panel, bounds, height) {
  if (!panel.tag || !panel.tag.trim()) return;
  const label = panel.tag.trim().toUpperCase();
  const size = Math.max(11, Math.round(Math.min(bounds.w, bounds.h) * 0.07));
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  const textWidth = ctx.measureText(label).width;
  const padX = Math.round(size * 0.6);
  const padY = Math.round(size * 0.35);
  const bx = bounds.x + Math.round(bounds.w * 0.04);
  // Sit below the top strip (volume text on the left, seal badge on the
  // right) so the chip never prints over either of them. The strip's depth
  // follows the canvas width (its padding is 5% of the width), so on a wide
  // cover it reaches further down than 9% of the height — 12% clears it.
  const by = bounds.y + Math.max(Math.round(bounds.h * 0.04), Math.round(height * 0.12));
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(bx, by, textWidth + padX * 2, size + padY * 2);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bx + padX, by + (size + padY * 2) / 2);
  ctx.textBaseline = 'alphabetic';
}

/**
 * Draws the whole cover. `images` maps a panel's photo id (or upload URL) to
 * a loaded image. With `raw` true, the grade and the text are skipped, so the
 * bare photos show — the "before" side of the compare hold. `highlight`
 * outlines one panel (the selected one in the editor, -1 for exports).
 */
export function drawCover(canvas, state, images, opts = {}) {
  const { raw = false, highlight = -1 } = opts;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const grade = GRADES[state.grade];
  ctx.fillStyle = '#17121f';
  ctx.fillRect(0, 0, width, height);
  const layout = LAYOUTS[state.layout];
  layout.panels.forEach((panelDef, i) => {
    const panel = state.panels[i];
    if (!panel) return;
    const poly = panelDef.clip.map(([fx, fy]) => [fx * width, fy * height]);
    const bounds = panelBounds(panelDef.clip, width, height);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let k = 1; k < poly.length; k++) ctx.lineTo(poly[k][0], poly[k][1]);
    ctx.closePath();
    ctx.clip();
    const img = images.get(panel.upload || panel.photo);
    if (img) drawPanelImage(ctx, img, panel, bounds);
    ctx.restore();
    ctx.strokeStyle = 'rgba(10, 6, 16, 0.9)';
    ctx.lineWidth = Math.max(2, Math.round(Math.min(width, height) * 0.004));
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let k = 1; k < poly.length; k++) ctx.lineTo(poly[k][0], poly[k][1]);
    ctx.closePath();
    ctx.stroke();
    if (!raw) drawTag(ctx, panel, bounds, height);
    if (i === highlight) {
      ctx.strokeStyle = grade.accent;
      ctx.lineWidth = Math.max(3, Math.round(Math.min(width, height) * 0.006));
      ctx.stroke();
    }
  });
  if (raw) return;
  const wash = ctx.createLinearGradient(0, 0, 0, height);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  const scrim = ctx.createLinearGradient(0, height * 0.55, 0, height);
  scrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
  scrim.addColorStop(1, grade.scrim);
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, width, height);
  drawTexts(ctx, state, grade, width, height);
}

/** Renders the cover at an arbitrary size and returns the fresh canvas. */
export function renderToSize(state, images, width, height, opts = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, state, images, opts);
  return canvas;
}
