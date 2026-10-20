import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultPalette, encodePalette, decodePalette, discBackground } from '../src/palette.js';
import { mapToDiscs } from '../src/discs.js';
import { hexToRgb } from '../src/color.js';

test('all four stripe options round-trip through JSON and the palette GET parameter', () => {
  const palette = defaultPalette();
  palette[0].name = 'Blue & orange / discs';
  palette.forEach((disc, i) => { disc.blackStripe = !!(i & 1); disc.whiteStripe = !!(i & 2); });
  const url = new URL('https://example.com/puzzle/?other=1');
  url.searchParams.set('palette', encodePalette(palette));
  assert.deepEqual(decodePalette(new URL(url).searchParams.get('palette')), palette);
  assert.equal(url.searchParams.get('other'), '1');
  assert.match(discBackground(palette[3]), /#000.*#fff/);
});
test('validate exact palette length, hex colours, names, stripes, version and size', () => {
  const payload = JSON.parse(encodePalette(defaultPalette()));
  for (const bad of [null, {}, { ...payload, version: 2 }, { ...payload, colors: payload.colors.slice(1) }]) {
    assert.throws(() => decodePalette(JSON.stringify(bad)));
  }
  for (const patch of [{ hex: 'red' }, { name: '' }, { name: 'x'.repeat(41) }, { blackStripe: 'yes' }, { whiteStripe: null }]) {
    const bad = structuredClone(payload); Object.assign(bad.colors[0], patch);
    assert.throws(() => decodePalette(JSON.stringify(bad)));
  }
  assert.throws(() => decodePalette('x'.repeat(12001)), /too large/);
});
test('mapping uses the edited palette and preserves stripe identities', () => {
  const palette = defaultPalette();
  palette[0] = { ...palette[0], hex: '#456789', blackStripe: true, whiteStripe: true };
  const { mapping } = mapToDiscs({ A: hexToRgb('#456789') }, palette);
  assert.deepEqual(mapping.A.disc, palette[0]);
});
test('reset returns a fresh independent default palette', () => {
  const palette = defaultPalette(); palette[0].hex = '#123456';
  assert.notEqual(defaultPalette()[0].hex, '#123456');
});
