// Canvas-2D cover renderer for Sunset Coast Cover Studio.
// Draws the panel grid (slanted dividers, thin light gutters), the grades,
// the striped Anton title, the Pacifico subtitle and all poster furniture
// (stars + press quote, tagline ribbon, billing block, barcode, gold seal,
// volume badge, "COMING SOON"). No external assets: everything is drawn.

import { GRADES, layoutRects } from './state.js';

let grainCanvas = null;
function grain() {
  if (grainCanvas) return grainCanvas;
  grainCanvas = document.createElement('canvas');
  grainCanvas.width = 128; grainCanvas.height = 128;
  const g = grainCanvas.getContext('2d');
  const d = g.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    d.data[i] = v; d.data[i + 1] = v; d.data[i + 2] = v; d.data[i + 3] = 22;
  }
  g.putImageData(d, 0, 0);
  return grainCanvas;
}

function clipSlant(ctx, r, i) {
  // Parallelogram clip: alternate the slant so dividers zig-zag like a poster grid.
  const s = Math.min(r.w * 0.045, r.h * 0.09) * (i % 2 === 0 ? 1 : -1);
  ctx.beginPath();
  ctx.moveTo(r.x + s, r.y);
  ctx.lineTo(r.x + r.w, r.y);
  ctx.lineTo(r.x + r.w - s, r.y + r.h);
  ctx.lineTo(r.x, r.y + r.h);
  ctx.closePath();
  ctx.clip();
}

function drawPanel(ctx, r, panel, grade, i, showTag, tagY) {
  const g = 3; // thin light gutter
  const inner = { x: r.x + g, y: r.y + g, w: r.w - g * 2, h: r.h - g * 2 };
  ctx.save();
  clipSlant(ctx, inner, i);
  ctx.fillStyle = '#241533';
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  const img = panel.img;
  if (img) {
    const zoom = panel.zoom || 1;
    const scale = Math.max(inner.w / img.naturalWidth, inner.h / img.naturalHeight) * zoom;
    const pw = img.naturalWidth * scale, ph = img.naturalHeight * scale;
    // ox/oy pan in fractions of the overflow; focus offsets shift the centre.
    const cx = inner.w / 2 + (panel.ox || 0) * Math.max(0, pw - inner.w) * 0.5 + (panel.fx ? (panel.fx - 0.5) * (pw - inner.w) * 0.35 : 0);
    const cy = inner.h / 2 + (panel.oy || 0) * Math.max(0, ph - inner.h) * 0.5 + (panel.fy ? (panel.fy - 0.5) * (ph - inner.h) * 0.35 : 0);
    ctx.filter = grade.filter;
    ctx.drawImage(img, inner.x + cx - pw / 2, inner.y + cy - ph / 2, pw, ph);
    ctx.filter = 'none';
    const tint = ctx.createLinearGradient(0, inner.y, 0, inner.y + inner.h);
    tint.addColorStop(0, grade.top);
    tint.addColorStop(1, grade.bottom);
    ctx.fillStyle = tint;
    ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  }
  // Grain + vignette.
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = ctx.createPattern(grain(), 'repeat');
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  ctx.globalAlpha = 1;
  const vg = ctx.createRadialGradient(
    inner.x + inner.w / 2, inner.y + inner.h / 2, Math.min(inner.w, inner.h) * 0.35,
    inner.x + inner.w / 2, inner.y + inner.h / 2, Math.max(inner.w, inner.h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vg;
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  ctx.restore();
  // Light gutter edge.
  ctx.strokeStyle = 'rgba(255,240,220,0.85)';
  ctx.lineWidth = Math.max(1, inner.w * 0.004);
  ctx.save();
  clipSlant(ctx, inner, i);
  ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
  ctx.restore();
  if (showTag && panel.tag) {
    const fs = Math.max(11, inner.h * 0.055);
    ctx.font = `${fs}px Anton, sans-serif`;
    const tw = ctx.measureText(panel.tag).width;
    const px = inner.x + Math.max(8, inner.w * 0.03);
    // Bottom-anchored by default. 'top' anchors to the panel's top edge
    // (used when the panel's bottom sits under the title block); a number
    // is an absolute baseline y (used for the full-height hero panel).
    let py;
    if (tagY === 'top') py = inner.y + fs + Math.max(8, inner.h * 0.04);
    else if (typeof tagY === 'number') py = tagY;
    else py = inner.y + inner.h - Math.max(8, inner.h * 0.04);
    ctx.fillStyle = 'rgba(10,5,18,0.78)';
    ctx.fillRect(px - 6, py - fs - 4, tw + 12, fs + 10);
    ctx.fillStyle = '#ffe9c9';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(panel.tag, px, py);
  }
}

function fitFont(ctx, text, maxWidth, start, family, weight = '') {
  let size = start;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

// Striped sunset title, drawn on its own canvas so the stripes only hit the letters.
function drawTitle(ctx, text, cx, baselineY, maxWidth, maxSize) {
  const size = fitFont(ctx, text, maxWidth, maxSize, 'Anton, sans-serif');
  const w = Math.ceil(ctx.measureText(text).width) + 24;
  const h = Math.ceil(size * 1.25);
  const off = document.createElement('canvas');
  off.width = Math.max(2, w); off.height = Math.max(2, h);
  const o = off.getContext('2d');
  o.font = `${size}px Anton, sans-serif`;
  o.textAlign = 'center'; o.textBaseline = 'middle';
  o.save();
  o.translate(0, 2); // slight slant via shear on the main canvas instead
  const grad = o.createLinearGradient(0, h * 0.08, 0, h * 0.92);
  grad.addColorStop(0, '#ffe066'); grad.addColorStop(0.38, '#ff9a3d');
  grad.addColorStop(0.62, '#ff5f6d'); grad.addColorStop(1, '#c94bff');
  o.fillStyle = grad;
  o.fillText(text, w / 2, h / 2);
  // Horizontal sunset stripes knocked out of the letters.
  o.globalCompositeOperation = 'destination-out';
  for (let y = h * 0.52; y < h * 0.86; y += Math.max(3, size * 0.055)) {
    o.fillRect(0, y, w, Math.max(2, size * 0.022));
  }
  o.globalCompositeOperation = 'source-over';
  o.restore();
  // Dark outline + glow around the striped letters.
  o.globalCompositeOperation = 'destination-over';
  o.lineWidth = Math.max(2, size * 0.09);
  o.strokeStyle = '#160a24';
  o.strokeText(text, w / 2, h / 2);
  o.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.translate(cx, baselineY - h / 2);
  ctx.transform(1, 0, -0.045, 1, 0, 0); // slight slant
  ctx.shadowColor = 'rgba(255,110,60,0.75)';
  ctx.shadowBlur = size * 0.28;
  ctx.drawImage(off, -w / 2, 0, w, h);
  ctx.restore();
  return size;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawCover(ctx, state, W, H, opts = {}) {
  const bare = !!opts.bare; // before/after "before": raw photos only
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = layoutRects(state.layout, W, H);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#120a1e';
  ctx.fillRect(0, 0, W, H);
  const n = rects.length;
  for (let i = 0; i < n; i++) {
    // Panels whose bottom edge falls under the title block (title, subtitle,
    // billing) would have their bottom-anchored cast tag buried under that
    // text. Anchor those tags to the panel's top instead; the full-height
    // hero panel keeps its tag clear of the top-left barcode by sitting just
    // above the tagline ribbon instead.
    let tagY = 'bottom';
    if (rects[i].y + rects[i].h > H * 0.70) tagY = i === 0 ? H * 0.555 : 'top';
    drawPanel(ctx, rects[i], state.panels[i] || { tag: '' }, bare ? { filter: 'none', top: 'rgba(0,0,0,0)', bottom: 'rgba(0,0,0,0)' } : grade, i, !bare, tagY);
  }
  if (bare) return;
  const u = Math.min(W, H) / 100; // scale unit
  // Bottom shade so the title stays readable over any photo.
  const shade = ctx.createLinearGradient(0, H * 0.52, 0, H);
  shade.addColorStop(0, 'rgba(10,4,20,0)');
  shade.addColorStop(1, 'rgba(10,4,20,0.72)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, H * 0.52, W, H * 0.48);
  // Top: five stars + press quote.
  const starY = H * 0.055;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(H * 0.032)}px sans-serif`;
  ctx.fillStyle = '#ffd166';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6;
  ctx.fillText('★ ★ ★ ★ ★', W / 2, starY);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(H * 0.024)}px sans-serif`;
  ctx.fillText(`“${state.quote}”`, W / 2, starY + H * 0.038);
  // Tagline ribbon across the upper third.
  const ribY = H * 0.60;
  ctx.font = `bold ${Math.round(H * 0.021)}px sans-serif`;
  const ribW = Math.min(W * 0.72, ctx.measureText(state.tagline).width + W * 0.06);
  ctx.fillStyle = '#ff5f6d';
  ctx.save();
  ctx.translate(W / 2, ribY);
  ctx.rotate(-0.012);
  ctx.fillRect(-ribW / 2, -H * 0.016, ribW, H * 0.032);
  ctx.fillStyle = '#fff';
  ctx.fillText(state.tagline, 0, 1);
  ctx.restore();
  // Huge striped title + Pacifico subtitle.
  const titleSize = drawTitle(ctx, state.title.toUpperCase(), W / 2, H * 0.815, W * 0.94, H * 0.135);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(titleSize * 0.34)}px Pacifico, cursive`;
  ctx.fillStyle = '#ff8fc0';
  ctx.shadowColor = 'rgba(255,80,180,0.9)'; ctx.shadowBlur = 18;
  ctx.fillText(state.subtitle, W / 2, H * 0.925);
  ctx.shadowBlur = 0;
  // Billing block.
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = `${Math.round(H * 0.0145)}px sans-serif`;
  ctx.fillText(state.billing, W / 2, H * 0.965);
  // Volume badge, top right.
  const vb = Math.round(H * 0.052);
  ctx.save();
  ctx.translate(W - vb - W * 0.02, vb + H * 0.02);
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(0, 0, vb * 0.62, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#160a24'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#160a24';
  ctx.font = `bold ${Math.round(vb * 0.24)}px sans-serif`;
  ctx.fillText(state.vol, 0, 1);
  ctx.restore();
  // Gold seal, bottom right. Kept low enough that it clears the title's
  // bottom edge even in tall ratios (1:1, 4:5), where the title runs wide.
  const sr = Math.round(H * 0.055);
  ctx.save();
  ctx.translate(W - sr - W * 0.025, H - sr - H * 0.03);
  ctx.fillStyle = '#ffc44d';
  ctx.beginPath(); ctx.arc(0, 0, sr * 0.66, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#4a2c00';
  ctx.font = `bold ${Math.round(sr * 0.20)}px sans-serif`;
  const sealLines = state.seal.split(' ');
  sealLines.forEach((ln, k) => ctx.fillText(ln, 0, (k - (sealLines.length - 1) / 2) * sr * 0.24));
  ctx.restore();
  // Barcode sticker, top left under the COMING SOON stamp. The white box is
  // sized to the number text so nothing overflows it.
  ctx.font = `${Math.round(H * 0.012)}px monospace`;
  const barNum = '0 12345 67890 1';
  const bw = Math.max(W * 0.075, ctx.measureText(barNum).width + 12);
  const bh = H * 0.038, bx = W * 0.025, by = H * 0.095;
  ctx.fillStyle = '#fff';
  ctx.fillRect(bx - 4, by - 4, bw + 8, bh + H * 0.022);
  ctx.fillStyle = '#111';
  let x = bx;
  while (x < bx + bw) {
    const wBar = 1 + Math.random() * 3;
    if (Math.random() > 0.45) ctx.fillRect(x, by, wBar, bh);
    x += wBar + 1 + Math.random() * 2;
  }
  ctx.font = `${Math.round(H * 0.012)}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText('0 12345 67890 1', bx, by + bh + H * 0.016);
  ctx.textAlign = 'center';
  // COMING SOON stamp, top left. The box is sized to the text so it never clips.
  ctx.save();
  ctx.font = `bold ${Math.round(H * 0.017)}px sans-serif`;
  const stampW = ctx.measureText('COMING SOON').width + W * 0.03;
  ctx.translate(W * 0.025 + stampW / 2, H * 0.055);
  ctx.rotate(-0.06);
  ctx.strokeStyle = '#ff5f6d'; ctx.lineWidth = 2;
  roundRect(ctx, -stampW / 2, -H * 0.018, stampW, H * 0.036, 4);
  ctx.stroke();
  ctx.fillStyle = '#ff5f6d';
  ctx.fillText('COMING SOON', 0, 1);
  ctx.restore();
}
