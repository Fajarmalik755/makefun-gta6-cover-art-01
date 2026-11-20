// On-device "smart crop" heuristic.
// Downscales the photo, scores each cell for skin tones plus edge density, and
// returns the focus point (fx, fy in 0..1) the crop should centre on. It is a
// rough heuristic, not a face detector: it just finds the warmest, busiest area.

export function findFocus(img) {
  const W = 64, H = 64;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  let data;
  try {
    data = ctx.getImageData(0, 0, W, H).data;
  } catch {
    return { fx: 0.5, fy: 0.4 };
  }
  const lum = (x, y) => {
    const i = (y * W + x) * 4;
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  };
  const skin = (x, y) => {
    const i = (y * W + x) * 4;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // Warm skin-like pixels: red dominant, clearly above green and blue.
    return (r > 95 && r > g + 12 && r > b + 12 && r - g < 110) ? 1 : 0;
  };
  // Score 8x8 cells: skin share + edge density (local luminance contrast).
  const N = 8, cell = W / N;
  let best = { score: -1, fx: 0.5, fy: 0.4 };
  for (let cy = 0; cy < N; cy++) {
    for (let cx = 0; cx < N; cx++) {
      let s = 0, e = 0, n = 0;
      for (let y = Math.floor(cy * cell); y < Math.floor((cy + 1) * cell); y++) {
        for (let x = Math.floor(cx * cell); x < Math.floor((cx + 1) * cell); x++) {
          s += skin(x, y);
          if (x + 1 < W) e += Math.abs(lum(x, y) - lum(x + 1, y));
          if (y + 1 < H) e += Math.abs(lum(x, y) - lum(x, y + 1));
          n++;
        }
      }
      // Centre cells get a small bonus so the crop does not hug the edges.
      const cxd = Math.abs(cx - (N - 1) / 2) / N, cyd = Math.abs(cy - (N - 1) / 2) / N;
      const score = (s / n) * 3 + (e / n) / 60 - (cxd + cyd) * 0.25;
      if (score > best.score) best = { score, fx: (cx + 0.5) / N, fy: (cy + 0.5) / N };
    }
  }
  return { fx: best.fx, fy: best.fy };
}
