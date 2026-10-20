// DOM rendering for the extracted grid and disc mapping.

import { rgbToHex } from './color.js';

/**
 * @param {HTMLElement} el
 * @param {(string | null)[][]} grid  labels per tube, top → bottom
 * @param {(label: string) => string} colorOf  label → CSS colour
 * @param {number} cols
 */
export function renderGrid(el, grid, colorOf, cols) {
  el.replaceChildren();
  el.style.setProperty('--cols', String(cols));
  for (const tube of grid) {
    const t = document.createElement('div');
    t.className = 'tube';
    for (const label of tube) {
      const s = document.createElement('div');
      s.className = label ? 'slot' : 'slot empty';
      if (label) {
        s.style.background = colorOf(label);
        s.title = label;
      }
      t.append(s);
    }
    el.append(t);
  }
}

export function renderJson(el, payload) {
  el.textContent = JSON.stringify(payload, null, 2);
}

export const hex = rgbToHex;
