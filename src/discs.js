// Match screenshot colours directly to the physical disc palette.
import { hexToRgb, rgbToLab, deltaE } from './color.js';

/**
 * Printed disc set. PLACEHOLDER values: replace with the real disc colours
 * (ideally measured from a photo of the discs under neutral light).
 * @type {{ id: string, name: string, hex: string }[]}
 */
export { DEFAULT_PALETTE as DISC_PALETTE } from './default-palette.js';
import { DEFAULT_PALETTE as DISC_PALETTE } from './default-palette.js';

/** Nearest disc to an RGB colour, by ΔE in Lab space. */
export function nearestDisc(rgb, palette = DISC_PALETTE) {
  const lab = rgbToLab(rgb);
  let best = null;
  for (const disc of palette) {
    const d = deltaE(lab, rgbToLab(hexToRgb(disc.hex)));
    if (!best || d < best.distance) best = { disc, distance: d };
  }
  return best;
}

/**
 * Map each distinct puzzle colour (label → RGB) to the nearest disc colour.
 * @param {Record<string, [number, number, number]>} puzzleColors
 * @returns {{ mapping: Record<string, { disc: object, distance: number }>,
 *             collisions: Record<string, string[]> }}
 */
export function mapToDiscs(puzzleColors, palette = DISC_PALETTE) {
  const mapping = {};
  const byDisc = {};
  for (const [label, rgb] of Object.entries(puzzleColors)) {
    const { disc, distance } = nearestDisc(rgb, palette);
    mapping[label] = { disc, distance };
    (byDisc[disc.id] ??= []).push(label);
  }
  const collisions = Object.fromEntries(Object.entries(byDisc).filter(([, labels]) => labels.length > 1));
  return { mapping, collisions };
}
