import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setupColorPicker } from '../src/color-picker.js';

function controls(t) {
  const original = globalThis.document;
  t.after(() => { globalThis.document = original; });
  class Control extends EventTarget {
    style = {}; value = ''; disabled = false; textContent = ''; open = false;
    constructor(id) { super(); this.id = id; }
    showModal() { this.open = true; }
    close() { this.open = false; this.dispatchEvent(new Event('close')); }
  }
  const ids = ['color-dialog', 'color-form', 'disc-hex', 'color-save', 'color-cancel',
    'disc-red', 'disc-green', 'disc-blue', 'disc-red-value', 'disc-green-value',
    'disc-blue-value', 'color-preview', 'color-error', 'color-title'];
  const elements = Object.fromEntries(ids.map(id => [id, new Control(id)]));
  globalThis.document = { getElementById: id => elements[id] };
  return elements;
}
function input(control, value) {
  control.value = value; control.dispatchEvent(new Event('input'));
}
function submit(elements) {
  elements['color-form'].dispatchEvent(new Event('submit', { cancelable: true }));
}
test('disc colour dialog commits edited RGB/hex to the selected disc, including stripes', t => {
  const elements = controls(t);
  let saved = 0;
  const edit = setupColorPicker(() => { saved++; });
  const disc = { id: 'D01', hex: '#123456', blackStripe: true, whiteStripe: false };
  const swatch = { style: {} };
  edit(disc, swatch);
  assert.equal(elements['color-dialog'].open, true);
  assert.equal(elements['disc-red'].value, 18);
  input(elements['disc-hex'], '#ABCDEF');
  assert.equal(disc.hex, '#123456', 'preview must not mutate the saved colour');
  assert.equal(saved, 0);
  submit(elements);
  assert.equal(disc.hex, '#abcdef');
  assert.match(swatch.style.background, /#abcdef/);
  assert.match(swatch.style.background, /#000/);
  assert.equal(saved, 1);
  assert.equal(elements['color-dialog'].open, false);

  const second = { id: 'D02', hex: '#000000' };
  edit(second, { style: {} });
  input(elements['disc-green'], '255');
  submit(elements);
  assert.equal(second.hex, '#00ff00');
  assert.equal(disc.hex, '#abcdef');
  assert.equal(saved, 2);
});
test('invalid hex cannot save and cancelling keeps the previous disc colour', t => {
  const elements = controls(t);
  let saved = 0;
  const edit = setupColorPicker(() => { saved++; });
  const disc = { id: 'D03', hex: '#ff0000' };
  edit(disc, { style: {} });
  input(elements['disc-hex'], '#zz0000');
  assert.equal(elements['color-save'].disabled, true);
  submit(elements);
  assert.equal(saved, 0);
  assert.equal(disc.hex, '#ff0000');
  input(elements['disc-hex'], '#00ffff');
  assert.equal(elements['color-save'].disabled, false);
  elements['color-cancel'].dispatchEvent(new Event('click'));
  assert.equal(disc.hex, '#ff0000');
  assert.equal(saved, 0);
  assert.equal(elements['color-dialog'].open, false);
});
