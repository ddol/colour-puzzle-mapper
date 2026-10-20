// Stacks are supplied bottom first; CSS places the first disc at the base.
import { rgbToHex } from './color.js';
import { discBackground } from './palette.js';

export function renderGrid(el, grid, colorOf, cols) {
  el.replaceChildren();
  el.style.setProperty('--cols', String(cols));
  grid.forEach((tube, tubeIndex) => {
    const figure = document.createElement('figure');
    figure.className = 'stack';
    const stack = document.createElement('ol');
    stack.className = 'tube';
    stack.setAttribute('aria-label', `Stack ${tubeIndex + 1}, bottom to top`);
    tube.forEach((label, index) => {
      const slot = document.createElement('li');
      slot.className = label ? 'slot' : 'slot empty';
      const disc = label ? colorOf(label) : null;
      if (disc) {
        if (typeof disc !== 'string') slot.classList.add('physical-disc');
        slot.style.background = typeof disc === 'string' ? disc : discBackground(disc);
      }
      const text = label ? (typeof disc === 'string' ? label : `${label} · ${disc.id}`) : 'Empty';
      slot.title = `Position ${index + 1} from bottom: ${text}`;
      slot.setAttribute('aria-label', slot.title);
      stack.append(slot);
    });
    figure.append(stack);
    el.append(figure);
  });
}

/** Show the one-to-one substitution even when screenshot/disc colours differ. */
export function renderMapping(el, colors, mapping) {
  el.replaceChildren();
  for (const [label, { disc }] of Object.entries(mapping)) {
    const item = document.createElement('span');
    item.className = 'mapping-item';
    const source = document.createElement('span');
    source.className = 'mapping-source';
    source.style.background = rgbToHex(colors[label]);
    const target = document.createElement('span');
    target.className = 'mapping-target physical-disc';
    target.style.background = discBackground(disc);
    const name = document.createElement('span');
    name.className = 'mapping-label';
    name.textContent = `${label} → ${disc.id}`;
    item.append(source, name, target);
    item.title = `${label} maps to ${disc.id}: ${disc.name}`;
    el.append(item);
  }
}

export function renderJson(el, payload) {
  el.textContent = JSON.stringify(payload, null, 2);
}
export const hex = rgbToHex;
