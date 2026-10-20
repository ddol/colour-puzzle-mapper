// Wiring: file input → canvas → detect → sample → cluster → map → render.

import { loadImage } from './image.js';
import { detectLayout } from './detect.js';
import { sampleLayout } from './sample.js';
import { clusterColors } from './cluster.js';
import { mapToDiscs } from './discs.js';
import { renderGrid, renderJson, hex } from './render.js';
import { setupPalette } from './palette-ui.js';
import { palettePayload } from './palette.js';

const $ = (id) => document.getElementById(id);
const fileInput = $('file-input');
const drop = document.querySelector('.drop');
const status = $('status');
let loadingImage = false;
let currentResult = null;
const getPalette = setupPalette(() => renderResult());

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

for (const ev of ['dragenter', 'dragover']) {
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('dragover'); });
}
for (const ev of ['dragleave', 'drop']) {
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('dragover'); });
}
drop.addEventListener('drop', (e) => {
  const file = e.dataTransfer?.files?.[0];
  if (file) handleFile(file);
});

$('copy-json').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('json').textContent);
    status.textContent = 'JSON copied.';
  } catch {
    status.textContent = 'Copy failed. Select the JSON and copy it manually.';
  }
});

async function handleFile(file) {
  if (loadingImage) return;
  loadingImage = true;
  fileInput.disabled = true;
  drop.setAttribute('aria-busy', 'true');
  currentResult = null;
  $('result-panel').hidden = true;
  $('preview-panel').hidden = true;
  status.textContent = 'Reading image…';
  let img;
  try {
    img = await loadImage(file, $('preview'));
    $('preview-panel').hidden = false;
  } catch (err) {
    status.textContent = `Could not read the image: ${err.message}`;
    return;
  } finally {
    loadingImage = false;
    fileInput.disabled = false;
    fileInput.value = '';
    drop.removeAttribute('aria-busy');
  }
  try {
    const layout = detectLayout(img);
    const sampled = sampleLayout(img, layout);
    const { grid, colors, counts } = clusterColors(sampled);
    currentResult = { layout, grid, colors, counts };
    renderResult();
    const context = $('preview').getContext('2d');
    context.lineWidth = Math.max(1, img.width / 500);
    context.strokeStyle = '#ffffff';
    for (const tube of layout.tubes) {
      for (const slot of tube.slots) context.strokeRect(slot.x, slot.y, slot.w, slot.h);
    }
    status.textContent = `Detected ${layout.rows} rows × ${layout.cols} stacks, ${layout.slotsPerTube} discs per stack. Check the outlined slots and results.`;
  } catch (err) {
    console.error(err);
    status.textContent = `Image loaded. Could not extract the grid: ${err.message}`;
  }
}

function renderResult() {
  if (!currentResult) return;
  const { layout, grid, colors, counts } = currentResult;
  const palette = getPalette();
  const { mapping, collisions } = mapToDiscs(colors, palette);
  renderGrid($('grid'), grid, label => hex(colors[label]), layout.cols);
  renderGrid($('discs'), grid, label => mapping[label].disc, layout.cols);
  renderJson($('json'), {
    layout: { rows: layout.rows, cols: layout.cols, slotsPerTube: layout.slotsPerTube },
    order: 'bottom-to-top', grid,
    colors: Object.fromEntries(Object.entries(colors).map(([key, value]) => [key, hex(value)])),
    counts,
    discs: Object.fromEntries(Object.entries(mapping).map(([key, value]) => [key, value.disc.id])),
    stacks: grid.map(tube => tube.map(label => label ? { ...mapping[label].disc } : null)),
    palette: palettePayload(palette), collisions,
  });
  const warnings = [];
  if (Object.keys(collisions).length) warnings.push('Some puzzle colours map to the same disc: ' +
    Object.entries(collisions).map(([id, labels]) => `${id} (${labels.join(', ')})`).join('; ') + '. Adjust your palette to distinguish them.');
  const uneven = Object.entries(counts).filter(([, count]) => count !== layout.slotsPerTube);
  if (uneven.length) warnings.push('Check detected colour counts: ' + uneven.map(([label, count]) => `${label}: ${count}`).join(', ') + '.');
  $('result-warning').textContent = warnings.join(' ');
  $('result-panel').hidden = false;
}
