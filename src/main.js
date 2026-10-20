// Wiring: file input → canvas → detect → sample → cluster → map → render.

import { loadImage } from './image.js';
import { detectLayout } from './detect.js';
import { sampleLayout } from './sample.js';
import { clusterColors } from './cluster.js';
import { mapToDiscs } from './discs.js';
import { renderGrid, renderJson, hex } from './render.js';

const $ = (id) => document.getElementById(id);
const fileInput = $('file-input');
const drop = document.querySelector('.drop');
const status = $('status');

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
  status.textContent = 'Reading image…';
  try {
    const img = await loadImage(file, $('preview'));
    $('preview-panel').hidden = false;

    const layout = detectLayout(img);
    const sampled = sampleLayout(img, layout);
    const { grid, colors, counts } = clusterColors(sampled);
    const { mapping, collisions } = mapToDiscs(colors);

    renderGrid($('grid'), grid, (l) => hex(colors[l]), layout.cols);
    renderGrid($('discs'), grid, (l) => mapping[l].disc.hex, layout.cols);
    renderJson($('json'), {
      layout: { rows: layout.rows, cols: layout.cols, slotsPerTube: layout.slotsPerTube },
      order: 'top-to-bottom',
      grid,
      colors: Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, hex(v)])),
      counts,
      discs: Object.fromEntries(Object.entries(mapping).map(([k, m]) => [k, m.disc.id])),
      collisions,
    });
    $('result-panel').hidden = false;
    status.textContent = 'Done.';
  } catch (err) {
    console.error(err);
    status.textContent = `Could not extract the grid: ${err.message}`;
  }
}
