import { readFile, writeFile } from 'node:fs/promises';
import { decodePalette } from '../src/palette.js';
const file = process.argv[2];
if (!file) throw new Error('Usage: make palette-default PALETTE=palette.json');
const palette = decodePalette(await readFile(file, 'utf8'));
await writeFile(new URL('../src/default-palette.js', import.meta.url),
  '// Repository default. Update with make palette-default PALETTE=palette.json\n' +
  `export const DEFAULT_PALETTE = ${JSON.stringify(palette, null, 2)};\n`);
console.log('Updated src/default-palette.js. Commit this file to publish the new default.');
