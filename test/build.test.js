import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from '../scripts/build.js';

test('build publishes only public assets and removes stale output', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'colour-puzzle-site-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const destination = pathToFileURL(`${directory}/`);
  await writeFile(new URL('stale.txt', destination), 'old output');
  await build(destination);
  assert.deepEqual((await readdir(destination)).sort(), ['.nojekyll', 'images', 'index.html', 'screen-free.html', 'src', 'styles.css']);
  const html = await readFile(new URL('index.html', destination), 'utf8');
  assert.match(html, /type="file" accept="image\/\*"/);
  // Both pages must work under a GitHub Pages project path, including the photos.
  for (const page of ['index.html', 'screen-free.html']) {
    const content = await readFile(new URL(page, destination), 'utf8');
    for (const [, path] of content.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^https?:/.test(path)) continue;
      assert.ok(!path.startsWith('/'), `Use a project-relative URL: ${path}`);
      assert.ok((await readFile(new URL(path, destination))).length > 0, `${path} should be published`);
    }
  }
  // Check the entry module and its relative imports are present in the artifact.
  const main = await readFile(new URL('src/main.js', destination), 'utf8');
  for (const [, path] of main.matchAll(/from '(.+?)'/g)) {
    await readFile(new URL(path, new URL('src/main.js', destination)));
  }
});
