import { DEFAULT_PALETTE } from './default-palette.js';

export const STORAGE_KEY = 'colour-puzzle-palette-v1';
export function validatePalette(value) {
  if (value?.version !== 1 || !Array.isArray(value.colors) || value.colors.length !== 10) {
    throw new Error('A palette must contain exactly 10 colours (version 1).');
  }
  return value.colors.map((color, i) => {
    if (!/^#[0-9a-f]{6}$/i.test(color?.hex) ||
        typeof color.name !== 'string' || !color.name.trim() || color.name.length > 40 ||
        typeof color.blackStripe !== 'boolean' || typeof color.whiteStripe !== 'boolean') {
      throw new Error(`Invalid colour ${i + 1}: use a name, hex colour and stripe flags.`);
    }
    return { id: `D${String(i + 1).padStart(2, '0')}`, name: color.name.trim(),
      hex: color.hex.toLowerCase(), blackStripe: color.blackStripe, whiteStripe: color.whiteStripe };
  });
}
export function palettePayload(colors) {
  return { version: 1, colors: colors.map(({ name, hex, blackStripe, whiteStripe }) =>
    ({ name, hex, blackStripe, whiteStripe })) };
}
export function encodePalette(colors) {
  return JSON.stringify(palettePayload(colors));
}
export function decodePalette(text) {
  if (typeof text !== 'string' || text.length > 12000) throw new Error('Palette data is too large.');
  return validatePalette(JSON.parse(text));
}
export function defaultPalette() {
  return validatePalette(palettePayload(DEFAULT_PALETTE));
}
export { discBackground } from './disc-art.js';
