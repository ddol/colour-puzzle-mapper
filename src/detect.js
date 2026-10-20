// Locate the puzzle board, tubes and slots in the screenshot.
// Works on ImageData-like objects ({ data, width, height }) so it is testable in Node.

/**
 * @typedef {{ x: number, y: number, w: number, h: number }} Rect
 * @typedef {{ rect: Rect, slots: Rect[] }} Tube
 * @typedef {{ board: Rect, rows: number, cols: number, slotsPerTube: number, tubes: Tube[] }} Layout
 */

/**
 * Find the board, tubes and slots.
 * TODO (next PR):
 *  1. Crop to the board panel (skip Reddit header and the Restart/Undo bar).
 *  2. Threshold bright/saturated/light-grey pixels and run connected components.
 *  3. Cluster component centres on x and y to get columns, rows and slot order.
 * Use relative geometry only: screenshots vary by device.
 * @returns {Layout}
 */
export function detectLayout(_img, _opts = {}) {
  throw new Error('detectLayout: not implemented yet');
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
        y: rect.y + s * slotH,
        w: rect.w,
        h: slotH,
      }));
      tubes.push({ rect, slots });
    }
  }
  return { board, rows, cols, slotsPerTube, tubes };
}
