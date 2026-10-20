import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gridFromManual } from '../src/detect.js';
import { sampleLayout, isEmptySlot } from '../src/sample.js';
import { clusterColors, labelFor } from '../src/cluster.js';
import { mapToDiscs, DISC_PALETTE } from '../src/discs.js';

/** Build a synthetic ImageData-like image from a grid of RGB (null = empty). */
function synthImage(tubes, { cols, slotsPerTube, cell = 40, slotH = 10 }) {
  const rows = Math.ceil(tubes.length / cols);
  const width = cols * cell;
  const height = rows * cell * 2;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) { data[i] = 15; data[i + 1] = 20; data[i + 2] = 32; data[i + 3] = 255; }
  const layout = gridFromManual({ board: { x: 0, y: 0, w: width, h: height }, rows, cols, slotsPerTube });
  layout.tubes.forEach((tube, t) => {
    tube.slots.forEach((slot, s) => {
      const rgb = tubes[t]?.[s];
      if (!rgb) return;
      for (let y = Math.floor(slot.y); y < Math.floor(slot.y + slot.h); y++) {
        for (let x = Math.floor(slot.x); x < Math.floor(slot.x + slot.w); x++) {
          const i = (y * width + x) * 4;
          data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2];
        }
      }
    });
  });
  return { img: { data, width, height }, layout, slotH };
}

test('gridFromManual produces rows × cols tubes with bottom-first slots', () => {
  const layout = gridFromManual({ board: { x: 0, y: 0, w: 400, h: 300 }, rows: 3, cols: 4, slotsPerTube: 4 });
  assert.equal(layout.tubes.length, 12);
  assert.equal(layout.tubes[0].slots.length, 4);
  assert.ok(layout.tubes[0].slots[0].y > layout.tubes[0].slots[3].y);
});

test('sample → cluster recovers a synthetic grid', () => {
  const R = [235, 60, 45], Y = [250, 250, 90], C = [120, 250, 250];
  const tubes = [[R, Y, C, R], [Y, C, R, Y], [C, R, Y, C], [null, null, null, null]];
  const { img, layout } = synthImage(tubes, { cols: 4, slotsPerTube: 4 });
  const sampled = sampleLayout(img, layout);
  const { grid, counts } = clusterColors(sampled);
  assert.deepEqual(grid[0], ['A', 'B', 'C', 'A']);
  assert.deepEqual(grid[3], [null, null, null, null]);
  assert.deepEqual(counts, { A: 4, B: 4, C: 4 });
});

test('isEmptySlot: dark board yes, light grey no', () => {
  assert.equal(isEmptySlot([15, 20, 32]), true);
  assert.equal(isEmptySlot([215, 215, 215]), false);
});

test('labelFor', () => {
  assert.equal(labelFor(0), 'A');
  assert.equal(labelFor(25), 'Z');
  assert.equal(labelFor(26), 'AA');
});

test('each clustered screenshot colour receives its own palette disc', () => {
  const { mapping } = mapToDiscs({ A: [10, 10, 10], B: [14, 14, 14] });
  assert.equal(mapping.A.disc.id, 'D01');
  assert.equal(mapping.B.disc.id, 'D02');
  assert.notEqual(mapping.A.disc.id, mapping.B.disc.id);
  assert.equal(DISC_PALETTE.length, 10);
});
