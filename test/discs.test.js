import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapToDiscs } from '../src/discs.js';
import { defaultPalette } from '../src/palette.js';
import { labelFor } from '../src/cluster.js';

const ids = result => Object.fromEntries(Object.entries(result.mapping).map(([label, { disc }]) => [label, disc.id]));
test('ten screenshot colours get ten unique discs even with identical or unrelated palette colours', () => {
  const colors = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [labelFor(i), [i, i, i]]));
  const palette = defaultPalette().map(disc => ({ ...disc, hex: '#112233' }));
  const mapping = ids(mapToDiscs(colors, palette));
  assert.deepEqual(mapping, Object.fromEntries(Array.from({ length: 10 }, (_, i) => [labelFor(i), `D${String(i + 1).padStart(2, '0')}`])));
  assert.equal(new Set(Object.values(mapping)).size, 10);
});
test('mapping stays consistent across object ordering, RGB noise, and palette appearance edits', () => {
  const palette = defaultPalette();
  const initial = ids(mapToDiscs({ A: [20, 30, 40], B: [200, 100, 90], C: [10, 240, 0] }, palette));
  const edited = palette.map(disc => ({ ...disc, hex: '#ff00ff', blackStripe: true, whiteStripe: true }));
  assert.deepEqual(ids(mapToDiscs({ C: [1, 200, 3], A: [80, 90, 40], B: [200, 0, 0] }, edited)), initial);
});
test('more detected colours than discs and duplicate disc identities produce clear errors', () => {
  const colors = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [labelFor(i), [0, 0, 0]]));
  assert.throws(() => mapToDiscs(colors), /Detected 11 screenshot colours but only 10 discs/);
  const palette = defaultPalette(); palette[1].id = palette[0].id;
  assert.throws(() => mapToDiscs({ A: [0, 0, 0] }, palette), /Disc IDs must be unique/);
});
