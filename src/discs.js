// Physical disc palette and screenshot → disc mapping.
//
// Discs are the *inverse* of the screenshot colour, then snapped to the
// nearest colour we actually have printed. Not 1:1: two puzzle colours may
// land on the same disc, which mapToDiscs() reports as a collision.

import { hexToRgb, invert, rgbToLab, deltaE } from './color.js';

/**
 * Printed disc set. PLACEHOLDER values: replace with the real disc colours
 * (ideally measured from a photo of the discs under neutral light).
 * @type {{ id: string, name: string, hex: string }[]}
 */
export const DISC_PALETTE = [
  { id: 'D01', name: 'White',   hex: '#f2f2f2' },
  { id: 'D02', name: 'Black',   hex: '#1a1a1a' },
  { id: 'D03', name: 'Red',     hex: '#d62828' },
  { id: 'D04', name: 'Orange',  hex: '#f77f00' },
  { id: 'D05', name: 'Yellow',  hex: '#fcbf49' },
  { id: 'D06', name: 'Green',   hex: '#2a9d8f' },
  { id: 'D07', name: 'Cyan',    hex: '#4cc9f0' },
  { id: 'D08', name: 'Blue',    hex: '#3a0ca3' },
  { id: 'D09', name: 'Purple',  hex: '#7209b7' },
  { id: 'D10', name: 'Pink',    hex: '#f72585' },
];

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
 * Map each distinct puzzle colour (label → RGB) to a disc via its inverse.
 * @param {Record<string, [number, number, number]>} puzzleColors
 * @returns {{ mapping: Record<string, { inverse: number[], disc: object, distance: number }>,
 *             collisions: Record<string, string[]> }}
 */
export function mapToDiscs(puzzleColors, palette = DISC_PALETTE) {
  const mapping = {};
  const byDisc = {};
  for (const [label, rgb] of Object.entries(puzzleColors)) {
    const inv = invert(rgb);
    const { disc, distance } = nearestDisc(inv, palette);
    mapping[label] = { inverse: inv, disc, distance };
    (byDisc[disc.id] ??= []).push(label);
  }
  const collisions = Object.fromEntries(Object.entries(byDisc).filter(([, labels]) => labels.length > 1));
  return { mapping, collisions };
}
