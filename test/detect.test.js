import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { detectLayout } from '../src/detect.js';
import { sampleLayout } from '../src/sample.js';
import { clusterColors } from '../src/cluster.js';

// Reduced RGBA copy of fixtures/2026-10-20.jpeg; no JPEG dependency needed in CI.
const fixture = { width: 360, height: 580, data: gunzipSync(readFileSync(
  new URL('fixtures/2026-10-20-360x580.rgba.gz', import.meta.url))) };
const expected = [
  ['A', 'B', 'C', 'D'], ['E', 'F', 'C', 'G'], ['G', 'H', 'H', 'E'], ['G', 'I', 'B', 'I'],
  ['I', 'A', 'B', 'E'], ['E', 'J', 'H', 'G'], ['D', 'A', 'D', 'F'], ['A', 'I', 'C', 'F'],
  ['B', 'D', 'J', 'J'], ['J', 'F', 'H', 'C'], [null, null, null, null], [null, null, null, null],
];
function resize(img, scale) {
  const width = Math.round(img.width * scale), height = Math.round(img.height * scale);
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (Math.floor(y / scale) * img.width + Math.floor(x / scale)) * 4;
    data.set(img.data.subarray(i, i + 4), (y * width + x) * 4);
  }
  return { width, height, data };
}
for (const scale of [1, 2, 4]) {
  test(`detect real screenshot at scale ${scale}: 12 stacks, 10 colours, two empty tubes`, () => {
    const img = resize(fixture, scale);
    const layout = detectLayout(img);
    assert.equal(layout.rows, 3);
    assert.equal(layout.cols, 4);
    assert.equal(layout.slotsPerTube, 4);
    const result = clusterColors(sampleLayout(img, layout));
    assert.deepEqual(result.grid, expected);
    assert.deepEqual(Object.values(result.counts), Array(10).fill(4));
    for (const tube of layout.tubes) {
      assert.ok(tube.slots[0].y > tube.slots[3].y, 'bottom first');
    }
  });
}
test('reject invalid pixels, blank images and invalid slot counts', () => {
  assert.throws(() => detectLayout({}), /Invalid screenshot/);
  assert.throws(() => detectLayout({ width: 100, height: 100, data: new Uint8Array(40000) }), /No repeated puzzle/);
  assert.throws(() => detectLayout(fixture, { slotsPerTube: 0 }), /Slots per tube/);
});
