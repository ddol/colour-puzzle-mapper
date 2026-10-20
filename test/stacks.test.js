import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reverseStacks } from '../src/stacks.js';

test('physical top discs match the digital bottom-first exit sequence', () => {
  const grid = [['A', 'B', 'C', 'D'], ['D', 'A', null, null], [null, 'B', null, 'C'], [null, null, null, null]];
  const original = structuredClone(grid);
  const physical = reverseStacks(grid);
  assert.deepEqual(physical, [['D', 'C', 'B', 'A'], ['A', 'D', null, null], ['C', 'B', null, null], [null, null, null, null]]);
  physical.forEach((tube, i) => {
    assert.deepEqual(tube.filter(label => label !== null).reverse(), grid[i].filter(label => label !== null));
  });
  assert.deepEqual(grid, original, 'the extracted screenshot order remains unchanged');
});
