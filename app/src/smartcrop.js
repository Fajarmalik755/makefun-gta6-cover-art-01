// Smart crop: finds the focus point of a photo on the device, by sampling a
// small copy of it and scoring each cell for brightness and local contrast.
// No network, no model — just the pixels in front of us.

const SAMPLE_W = 48;
const SAMPLE_H = 32;

function sampleGrid(img) {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_W;
  canvas.height = SAMPLE_H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, SAMPLE_W, SAMPLE_H);
  const data = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data;
  const cells = [];
  for (let y = 0; y < SAMPLE_H; y++) {
    for (let x = 0; x < SAMPLE_W; x++) {
      const i = (y * SAMPLE_W + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      cells.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }
  }
  return cells;
}

function cellScore(cells, x, y) {
  const at = (cx, cy) => cells[cy * SAMPLE_W + cx];
  const center = at(x, y);
  let contrast = 0;
  let neighbours = 0;
  if (x + 1 < SAMPLE_W) { contrast += Math.abs(center - at(x + 1, y)); neighbours++; }
  if (y + 1 < SAMPLE_H) { contrast += Math.abs(center - at(x, y + 1)); neighbours++; }
  if (x > 0) { contrast += Math.abs(center - at(x - 1, y)); neighbours++; }
  if (y > 0) { contrast += Math.abs(center - at(x, y - 1)); neighbours++; }
  const local = neighbours ? contrast / neighbours : 0;
  // Bright, detailed areas draw the eye; flat dark areas do not.
  return local * 0.7 + center * 0.3;
}

/** Returns the focus point of `img` as fractions { x, y } in 0..1. */
export function findFocus(img) {
  if (!img || !img.naturalWidth) return { x: 0.5, y: 0.5 };
  const cells = sampleGrid(img);
  let best = { x: 0.5, y: 0.5 };
  let bestScore = -1;
  for (let y = 0; y < SAMPLE_H; y++) {
    for (let x = 0; x < SAMPLE_W; x++) {
      const score = cellScore(cells, x, y);
      if (score > bestScore) {
        bestScore = score;
        best = { x: (x + 0.5) / SAMPLE_W, y: (y + 0.5) / SAMPLE_H };
      }
    }
  }
  return best;
}

export const MIN_ZOOM = 1.2;

/** Centers `panel` on the photo's focus point, with at least the minimum zoom. */
export function applySmartCrop(panel, img) {
  const focus = findFocus(img);
  panel.fx = focus.x;
  panel.fy = focus.y;
  panel.zoom = Math.max(panel.zoom, MIN_ZOOM);
  return focus;
}
