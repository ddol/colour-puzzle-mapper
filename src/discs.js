// Puzzle labels map one-to-one to palette entries, regardless of their RGB values.
export { DEFAULT_PALETTE as DISC_PALETTE } from './default-palette.js';
import { DEFAULT_PALETTE as DISC_PALETTE } from './default-palette.js';

/**
 * Assign A → first disc, B → second disc, and so on. Sorting labels makes the
 * assignment independent of object insertion order. Editing a disc's colour or
 * stripes changes its appearance without changing any puzzle assignments.
 */
export function mapToDiscs(puzzleColors, palette = DISC_PALETTE) {
  const labels = Object.keys(puzzleColors).sort((a, b) => a.length - b.length || a.localeCompare(b, 'en'));
  if (labels.length > palette.length) {
    throw new Error(`Detected ${labels.length} screenshot colours but only ${palette.length} discs are available. Each screenshot colour needs its own disc; check the detected grid.`);
  }
  if (new Set(palette.map(disc => disc.id)).size !== palette.length) {
    throw new Error('Disc IDs must be unique for one-to-one mapping.');
  }
  const mapping = Object.fromEntries(labels.map((label, index) => [label, { disc: palette[index] }]));
  return { mapping };
}
