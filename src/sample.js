// Sample a representative colour for each slot.

import { medianRgb, rgbToHsv } from './color.js';
import { pixelAt } from './image.js';

/**
 * Median RGB of a small box at the slot centre (avoids the glow halo).
 * @param {{ data: Uint8ClampedArray, width: number, height: number }} img
 * @param {{ x: number, y: number, w: number, h: number }} slot
 * @param {number} frac  box size as a fraction of the slot (0–1)
 */
export function sampleSlot(img, slot, frac = 0.3) {
  const cx = slot.x + slot.w / 2;
  const cy = slot.y + slot.h / 2;
  const hw = Math.max(1, (slot.w * frac) / 2);
  const hh = Math.max(1, (slot.h * frac) / 2);
  const samples = [];
  for (let y = Math.round(cy - hh); y <= Math.round(cy + hh); y++) {
    for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) {
      if (x >= 0 && y >= 0 && x < img.width && y < img.height) samples.push(pixelAt(img, x, y));
    }
  }
  return medianRgb(samples);
}

/**
 * Empty slots show the dark navy board through a dashed outline. The board is
 * fairly saturated, so key on brightness only: every puzzle colour is far brighter.
 */
export function isEmptySlot(rgb, { maxValue = 0.25 } = {}) {
  return rgbToHsv(rgb).v <= maxValue;
}

/**
 * Sample every slot in a layout.
 * @returns {(number[] | null)[][]}  per tube, top → bottom; null = empty
 */
export function sampleLayout(img, layout) {
  return layout.tubes.map((tube) =>
    tube.slots.map((slot) => {
      const rgb = sampleSlot(img, slot);
      return isEmptySlot(rgb) ? null : rgb;
    }),
  );
}
