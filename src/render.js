// Stacks are supplied bottom first; CSS places the first disc at the base.
import { rgbToHex } from './color.js';
import { discBackground } from './palette.js';

export function renderGrid(el, grid, colorOf, cols) {
  el.replaceChildren();
  el.style.setProperty('--cols', String(cols));
  grid.forEach((tube, tubeIndex) => {
    const figure = document.createElement('figure');
    figure.className = 'stack';
    const caption = document.createElement('figcaption');
    caption.textContent = `Stack ${tubeIndex + 1}`;
    const stack = document.createElement('ol');
    stack.className = 'tube';
    stack.setAttribute('aria-label', `Stack ${tubeIndex + 1}, bottom to top`);
    tube.forEach((label, index) => {
      const slot = document.createElement('li');
      slot.className = label ? 'slot' : 'slot empty';
      const disc = label ? colorOf(label) : null;
      if (disc) slot.style.background = typeof disc === 'string' ? disc : discBackground(disc);
      const text = label ? (typeof disc === 'string' ? label : `${label} · ${disc.id}`) : 'Empty';
      slot.textContent = `${index + 1} · ${text}`;
      slot.title = `Position ${index + 1} from bottom: ${text}`;
      slot.setAttribute('aria-label', slot.title);
      stack.append(slot);
    });
    figure.append(caption, stack);
    el.append(figure);
  });
}

export function renderJson(el, payload) {
  el.textContent = JSON.stringify(payload, null, 2);
}
export const hex = rgbToHex;
