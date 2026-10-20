// Browser-only image loading. Keep canvas/pixel buffers bounded on mobile Safari.
export const MAX_IMAGE_WIDTH = 720;
export const MAX_IMAGE_HEIGHT = 1200;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function imageSize(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('The image has invalid dimensions');
  }
  const scale = Math.min(1, MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Decode into one bounded canvas and release the original image after sampling. */
export async function loadImage(file, canvas) {
  if (!file.type.startsWith('image/')) throw new Error('Not an image file');
  if (file.size > MAX_FILE_BYTES) throw new Error('Choose an image smaller than 25 MB');
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = 'async';
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('This image format could not be decoded. Try a JPEG or PNG screenshot.'));
      image.src = url;
    });
    const size = imageSize(image.naturalWidth, image.naturalHeight);
    // Drop the old backing store before allocating the next one (Safari retains canvases).
    canvas.width = 0;
    canvas.height = 0;
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('The browser could not allocate an image preview');
    ctx.drawImage(image, 0, 0, size.width, size.height);
    return ctx.getImageData(0, 0, size.width, size.height);
  } finally {
    image.onload = null;
    image.onerror = null;
    image.src = '';
    URL.revokeObjectURL(url);
  }
}

/** Read the RGB at (x, y) from an ImageData-like { data, width }. */
export function pixelAt(img, x, y) {
  const i = (y * img.width + x) * 4;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
}
