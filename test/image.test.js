import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageSize, loadImage, MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT } from '../src/image.js';

test('large phone images fit a bounded canvas and small images are not upscaled', () => {
  for (const [width, height] of [[12000, 9000], [9000, 12000], [1179, 1901], [1, 20000]]) {
    const size = imageSize(width, height);
    assert.ok(size.width <= MAX_IMAGE_WIDTH && size.height <= MAX_IMAGE_HEIGHT);
    assert.ok(size.width > 0 && size.height > 0);
    assert.ok(size.width * size.height <= MAX_IMAGE_WIDTH * MAX_IMAGE_HEIGHT);
  }
  assert.deepEqual(imageSize(320, 500), { width: 320, height: 500 });
  assert.deepEqual(imageSize(12000, 9000), { width: 720, height: 540 });
  for (const invalid of [0, -1, NaN, Infinity]) assert.throws(() => imageSize(invalid, 100));
});

test('image loader uses a bounded backing store and releases the image URL on success or failure', async t => {
  const originalImage = globalThis.Image;
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL;
  t.after(() => { globalThis.Image = originalImage; URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; });
  let revoked = 0, cleared = 0, failDecode = false, failDraw = false;
  URL.createObjectURL = () => 'blob:test';
  URL.revokeObjectURL = url => { assert.equal(url, 'blob:test'); revoked++; };
  globalThis.Image = class {
    naturalWidth = 9000; naturalHeight = 12000;
    set src(value) {
      if (!value) { cleared++; return; }
      queueMicrotask(() => failDecode ? this.onerror() : this.onload());
    }
  };
  const dimensions = [];
  const canvas = {
    set width(value) { dimensions.push(['width', value]); },
    set height(value) { dimensions.push(['height', value]); },
    getContext: () => ({
      drawImage(image, x, y, width, height) {
        assert.equal(width, 720); assert.equal(height, 960);
        if (failDraw) throw new Error('draw failed');
      },
      getImageData: () => ({ width: 720, height: 960 }),
    }),
  };
  const file = { type: 'image/jpeg', size: 1024 };
  assert.deepEqual(await loadImage(file, canvas), { width: 720, height: 960 });
  assert.deepEqual(dimensions, [['width', 0], ['height', 0], ['width', 720], ['height', 960]]);
  failDecode = true;
  await assert.rejects(loadImage(file, canvas), /could not be decoded/);
  failDecode = false; failDraw = true;
  await assert.rejects(loadImage(file, canvas), /draw failed/);
  assert.equal(revoked, 3); assert.equal(cleared, 3);
  await assert.rejects(loadImage({ type: 'image/jpeg', size: 30 * 1024 * 1024 }, canvas), /25 MB/);
  await assert.rejects(loadImage({ type: 'text/plain', size: 1 }, canvas), /Not an image/);
  assert.equal(revoked, 3);
});
