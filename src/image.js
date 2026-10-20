// Browser-only: file → bitmap → canvas pixels. Nothing leaves the device.

/** Decode an uploaded File into an ImageData plus the canvas it was drawn on. */
export async function loadImage(file, canvas) {
  if (!file.type.startsWith('image/')) throw new Error('Not an image file');
  const bitmap = await createImageBitmap(file);
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/** Read the RGB at (x, y) from an ImageData-like { data, width }. */
export function pixelAt(img, x, y) {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
}
