// Wiring: file input → canvas → detect → sample → cluster → map → render.

import { loadImage } from './image.js';
import { detectLayout } from './detect.js';
import { sampleLayout } from './sample.js';
import { clusterColors } from './cluster.js';
import { mapToDiscs } from './discs.js';
import { renderGrid, renderMapping, renderJson, hex } from './render.js';
import { setupPalette } from './palette-ui.js';
import { palettePayload } from './palette.js';
import { reverseStacks } from './stacks.js';

const $ = (id) => document.getElementById(id);
const fileInput = $('file-input');
const drop = document.querySelector('.drop');
const status = $('status');
let loadingImage = false;
let currentResult = null;
const exampleRequest = new AbortController();
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

async function handleFile(file, { example = false } = {}) {
  if (loadingImage) return;
  if (!example) exampleRequest.abort();
  loadingImage = true;
  fileInput.disabled = true;
  drop.setAttribute('aria-busy', 'true');
  currentResult = null;
  $('result-panel').hidden = true;
  $('preview-panel').hidden = true;
  $('extracted-panel').hidden = true;
  $('inspection-panel').hidden = true;
  $('inspection-panel').open = false;
  status.textContent = example ? 'Reading example puzzle…' : 'Reading image…';
  let img;
  try {
    img = await loadImage(file, $('preview'));
    $('preview-panel').hidden = false;
    $('inspection-panel').hidden = false;
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
    status.textContent = `${example ? 'Example puzzle. ' : ''}Detected ${layout.rows} rows × ${layout.cols} stacks, ${layout.slotsPerTube} discs per stack. Check the outlined slots and results.`;
    if (!example) requestAnimationFrame(() => {
      const output = $('physical-output');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      output.focus({ preventScroll: true });
      output.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  } catch (err) {
    currentResult = null;
    $('result-panel').hidden = true;
    console.error(err);
    status.textContent = `Image loaded. Could not extract the grid: ${err.message}`;
  }
}

async function loadExample() {
  status.textContent = 'Loading example puzzle…';
  try {
    const response = await fetch(new URL('../images/example-puzzle.jpg', import.meta.url), { signal: exampleRequest.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const image = await response.blob();
    // An explicit upload takes priority, even if the example download finishes later.
    if (!exampleRequest.signal.aborted) await handleFile(image, { example: true });
  } catch (error) {
    if (exampleRequest.signal.aborted) return;
    console.error(error);
    status.textContent = 'Could not load the example puzzle. Choose a screenshot to get started.';
  }
}

if (fileInput.files[0]) handleFile(fileInput.files[0]);
else loadExample();

function renderResult() {
  if (!currentResult) return;
  const { layout, grid, colors, counts } = currentResult;
  const palette = getPalette();
  const { mapping } = mapToDiscs(colors, palette);
  const physicalGrid = reverseStacks(grid);
  renderGrid($('grid'), grid, label => hex(colors[label]), layout.cols);
  $('extracted-panel').hidden = false;
  renderGrid($('discs'), physicalGrid, label => mapping[label].disc, layout.cols);
  renderMapping($('mapping-legend'), colors, mapping);
  renderJson($('json'), {
    layout: { rows: layout.rows, cols: layout.cols, slotsPerTube: layout.slotsPerTube },
    order: 'bottom-to-top', grid, physicalGrid,
    colors: Object.fromEntries(Object.entries(colors).map(([key, value]) => [key, hex(value)])),
    counts,
    discs: Object.fromEntries(Object.entries(mapping).map(([key, value]) => [key, value.disc.id])),
    stacks: physicalGrid.map(tube => tube.map(label => label ? { ...mapping[label].disc } : null)),
    palette: palettePayload(palette), mappingMode: 'one-to-one',
  });
  const warnings = [];
  const uneven = Object.entries(counts).filter(([, count]) => count !== layout.slotsPerTube);
  if (uneven.length) warnings.push('Check detected colour counts: ' + uneven.map(([label, count]) => `${label}: ${count}`).join(', ') + '.');
  $('result-warning').textContent = warnings.join(' ');
  $('result-panel').hidden = false;
}
