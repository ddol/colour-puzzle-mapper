import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const root = new URL('../', import.meta.url);
export const assets = ['index.html', 'styles.css', 'src'];

export async function build(destination = new URL('_site/', root)) {
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  for (const asset of assets) {
    await cp(new URL(asset, root), new URL(asset, destination), { recursive: true });
  }
  await writeFile(new URL('.nojekyll', destination), '');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await build();
  console.log('Built static site in _site/');
}
