// Locate the puzzle board, tubes and slots in the screenshot.
// Works on ImageData-like objects ({ data, width, height }) so it is testable in Node.

/**
 * @typedef {{ x: number, y: number, w: number, h: number }} Rect
 * @typedef {{ rect: Rect, slots: Rect[] }} Tube
 * @typedef {{ board: Rect, rows: number, cols: number, slotsPerTube: number, tubes: Tube[] }} Layout
 */

/**
 * Find repeated bright slot interiors on a dark board. Work at a bounded size,
 * reject text/UI components by shape, then fit columns and repeated slot rows.
 * Empty tubes are retained wherever they fall inside the detected grid.
 * Geometry remains in screenshot coordinates; slots are ordered bottom first.
 * Screenshots must show the complete board. The default puzzle has four slots.
 * @returns {Layout}
 */
export function detectLayout(img, { slotsPerTube = 4 } = {}) {
  if (!Number.isInteger(slotsPerTube) || slotsPerTube < 2 || slotsPerTube > 12) {
    throw new Error('Slots per tube must be between 2 and 12.');
  }
  if (!img?.width || !img?.height || img.data?.length !== img.width * img.height * 4) {
    throw new Error('Invalid screenshot pixels.');
  }
  const scale = Math.min(1, 720 / img.width, 1200 / img.height);
  const width = Math.round(img.width * scale), height = Math.round(img.height * scale);
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (Math.min(img.height - 1, Math.floor(y / scale)) * img.width +
        Math.min(img.width - 1, Math.floor(x / scale))) * 4;
      const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2];
      const hi = Math.max(r, g, b), lo = Math.min(r, g, b);
      // Saturated blocks plus light grey. Excludes dark board and most glows.
      mask[y * width + x] = hi > 165 && (hi - lo > 65 || lo > 155) ? 1 : 0;
    }
  }
  const queue = new Int32Array(mask.length);
  const candidates = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start]) continue;
    let head = 0, tail = 1;
    queue[0] = start; mask[start] = 0;
    let left = width, right = 0, top = height, bottom = 0;
    while (head < tail) {
      const pos = queue[head++], x = pos % width, y = Math.floor(pos / width);
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
      for (const next of [x > 0 ? pos - 1 : -1, x + 1 < width ? pos + 1 : -1,
        y > 0 ? pos - width : -1, y + 1 < height ? pos + width : -1]) {
        if (next >= 0 && mask[next]) { mask[next] = 0; queue[tail++] = next; }
      }
    }
    const w = right - left + 1, h = bottom - top + 1;
    if (w >= width * 0.045 && h >= height * 0.012 && w / h > 1.3 && w / h < 5 &&
        tail / (w * h) > 0.65) {
      candidates.push({ x: left, y: top, w, h, cx: (left + right) / 2, cy: (top + bottom) / 2 });
    }
  }
  if (candidates.length < slotsPerTube * 2) throw new Error('No repeated puzzle slots found. Use a clear screenshot of the complete dark board.');
  // Choose the most common block size rather than large buttons or header text.
  let blocks = [];
  for (const seed of candidates) {
    const group = candidates.filter(c => Math.abs(c.w - seed.w) < seed.w * 0.25 && Math.abs(c.h - seed.h) < seed.h * 0.3);
    if (group.length > blocks.length) blocks = group;
  }
  const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const slotW = median(blocks.map(b => b.w)), slotH = median(blocks.map(b => b.h));
  const groupAxis = (key, tolerance) => {
    const groups = [];
    for (const block of [...blocks].sort((a, b) => a[key] - b[key])) {
      const group = groups.at(-1);
      if (group && Math.abs(block[key] - median(group.map(b => b[key]))) < tolerance) group.push(block);
      else groups.push([block]);
    }
    return groups;
  };
  const xGroups = groupAxis('cx', slotW * 0.35).filter(g => g.length >= 2);
  const xs = xGroups.map(g => median(g.map(b => b.cx)));
  if (xs.length < 2) throw new Error('Could not identify the tube columns. Include the full board.');
  blocks = blocks.filter(b => xs.some(x => Math.abs(x - b.cx) < slotW * 0.35));
  const ys = groupAxis('cy', slotH * 0.4).map(g => median(g.map(b => b.cy)));
  const gaps = ys.slice(1).map((y, i) => y - ys[i]);
  const shortGaps = gaps.filter(g => g > slotH * 0.8 && g < slotH * 1.8);
  if (!shortGaps.length) throw new Error('Could not identify slot spacing. Include the full board.');
  const step = median(shortGaps);
  const rowGroups = [];
  for (const y of ys) {
    if (!rowGroups.length || y - rowGroups.at(-1).at(-1) > step * 1.6) rowGroups.push([y]);
    else rowGroups.at(-1).push(y);
  }
  if (rowGroups.some(group => group.length > slotsPerTube)) {
    throw new Error('Ambiguous grid: check the number of slots per tube.');
  }
  const tubes = [];
  for (const group of rowGroups) {
    // In partial tubes contents sit at the bottom. Anchor incomplete rows there.
    const bottom = group.at(-1);
    const first = bottom - (slotsPerTube - 1) * step;
    for (const x of xs) {
      const slots = Array.from({ length: slotsPerTube }, (_, i) => ({
        x: (x - slotW / 2) / scale, y: (bottom - i * step - slotH / 2) / scale,
        w: slotW / scale, h: slotH / scale,
      }));
      tubes.push({ rect: { x: (x - slotW / 2) / scale, y: (first - slotH / 2) / scale,
        w: slotW / scale, h: (step * (slotsPerTube - 1) + slotH) / scale }, slots });
    }
  }
  const left = Math.min(...tubes.map(t => t.rect.x)), top = Math.min(...tubes.map(t => t.rect.y));
  const right = Math.max(...tubes.map(t => t.rect.x + t.rect.w));
  const bottom = Math.max(...tubes.map(t => t.rect.y + t.rect.h));
  if (top < 0 || bottom > img.height) throw new Error('The puzzle board appears cropped. Include all slots.');
  return { board: { x: left, y: top, w: right - left, h: bottom - top },
    rows: rowGroups.length, cols: xs.length, slotsPerTube, tubes };
}

/**
 * Manual fallback: an evenly spaced grid inside a user-supplied board rect.
 * @returns {Layout}
 */
export function gridFromManual({ board, rows, cols, slotsPerTube, padding = 0.12 }) {
  const tubes = [];
  const cellW = board.w / cols;
  const cellH = board.h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rect = {
        x: board.x + c * cellW + cellW * padding,
        y: board.y + r * cellH + cellH * padding,
        w: cellW * (1 - 2 * padding),
        h: cellH * (1 - 2 * padding),
      };
      const slotH = rect.h / slotsPerTube;
      const slots = Array.from({ length: slotsPerTube }, (_, s) => ({
        x: rect.x,
        y: rect.y + (slotsPerTube - 1 - s) * slotH,
        w: rect.w,
        h: slotH,
      }));
      tubes.push({ rect, slots });
    }
  }
  return { board, rows, cols, slotsPerTube, tubes };
}
