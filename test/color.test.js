import { test } from 'node:test';
import assert from 'node:assert/strict';
import { invert, rgbToHex, hexToRgb, rgbToLab, deltaE, rgbToHsv, medianRgb } from '../src/color.js';

test('invert flips each channel', () => {
  assert.deepEqual(invert([0, 128, 255]), [255, 127, 0]);
});

test('hex round-trips', () => {
  assert.equal(rgbToHex([255, 16, 0]), '#ff1000');
  assert.deepEqual(hexToRgb('#FF1000'), [255, 16, 0]);
  assert.throws(() => hexToRgb('nope'));
});

test('rgbToLab matches reference values', () => {
  const [L, a, b] = rgbToLab([255, 255, 255]);
  assert.ok(Math.abs(L - 100) < 0.01 && Math.abs(a) < 0.01 && Math.abs(b) < 0.01);
  const red = rgbToLab([255, 0, 0]);
  assert.ok(Math.abs(red[0] - 53.24) < 0.1);
  assert.ok(Math.abs(red[1] - 80.09) < 0.1);
  assert.ok(Math.abs(red[2] - 67.2) < 0.1);
});

test('deltaE separates the colours most often confused', () => {
  const blue = rgbToLab([20, 30, 240]);
  const periwinkle = rgbToLab([120, 125, 235]);
  const gray = rgbToLab([215, 215, 215]);
  const white = rgbToLab([240, 240, 240]);
  assert.ok(deltaE(blue, periwinkle) > 20);
  assert.ok(deltaE(gray, white) > 5);
  assert.equal(deltaE(blue, blue), 0);
});

test('rgbToHsv', () => {
  assert.deepEqual(rgbToHsv([255, 0, 0]), { h: 0, s: 1, v: 1 });
  assert.equal(rgbToHsv([0, 0, 0]).s, 0);
});

test('medianRgb ignores outliers', () => {
  assert.deepEqual(medianRgb([[10, 10, 10], [12, 12, 12], [255, 255, 255]]), [12, 12, 12]);
});
