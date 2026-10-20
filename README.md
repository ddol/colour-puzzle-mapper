# colour-puzzle-mapper

Static single-page app (GitHub Pages) that takes a screenshot of the daily
colour-sort puzzle, extracts the tube grid, and maps each colour to our
physically printed discs.

- **No framework or dependencies.** Vanilla ES modules + Canvas API; a small
  Node script packages the public files for deployment.
- **Runs entirely in the browser.** Screenshots are never uploaded anywhere.
- **Discs are the inverse** of each screenshot colour, snapped to the nearest
  printed disc colour (ΔE in Lab space). The mapping is not 1:1, so colliding
  colours are reported.

## Run locally

```sh
make dev         # http://127.0.0.1:3000; Ctrl-C to stop
make dev PORT=8080 HOST=0.0.0.0  # optional port / network binding
make test        # node --test, zero dependencies
make build       # generate deployable web assets in _site/
```

Requires Node.js 21+ and Make. No `npm install` is needed. The equivalent npm
commands are `npm run dev`, `npm test`, and `npm run build` (`npm start` also
starts the dev server). The server reads source files on each request; refresh
the browser after editing. It only serves public assets.

Choose an image using the file picker or drag it onto the upload area. The
browser decodes it locally, locates repeated slot shapes, and outlines the detected
slots in the preview. The results show the original colours and mapped physical
discs as stacks. Position **1 is the bottom disc**; work upwards to build the stack.

Detection is tuned to the supplied dark-board screenshot: a regular grid with four
slots per tube. It tolerates different screenshot sizes and includes empty tubes
inside the detected grid. A completely empty outside column/row cannot be inferred
from coloured slots alone. Cropped boards, other themes, or unusual layouts may
need a future manual override. Review the outlines and colour-count warnings.

## Disc palette

The editor always contains ten disc colours. Each colour has a name, native colour
picker, and independent **black stripe** and **white stripe** options (neither,
either one, or both). Changes immediately update stacks and save in local storage.
Matching uses the base colour only, via the existing inverse-colour Lab distance;
stripes identify physical discs and appear in the output. Duplicate/nearby base
colours can map to the same disc; collisions are shown above the stacks.

- **Export palette** downloads versioned `palette.json`; **Import palette** loads it.
- **Share palette link** copies a URL with `?palette=<URL-encoded JSON>`; there is
  a selectable link if clipboard access fails. A valid URL palette overrides local
  storage and saves on the recipient's device. Otherwise local storage overrides
  the repository default. Invalid data is rejected without replacing the palette.
- **Reset to repo default** restores the checked-in ten colours.
- To publish your exported palette as the default for everyone, run:

  ```sh
  make palette-default PALETTE=/path/to/palette.json
  make test build
  ```

  Commit `src/default-palette.js` along with the change. This workflow validates the
  file before writing; a static hosted webpage cannot directly write to the repo.
  Saved local palettes keep their settings until reset.

The initial default values are examples; replace them with your printed disc colours.

## Layout

```
index.html           upload UI, preview, results
styles.css
src/main.js          wiring: file → canvas → detect → sample → cluster → map → render
src/render.js        DOM rendering: grid + disc mapping
src/image.js         File → ImageData (browser only)
src/detect.js        board / tube / slot geometry (+ manual grid fallback)
src/sample.js        median colour per slot, empty-slot detection
src/cluster.js       ΔE clustering → labelled grid
src/color.js         pure colour maths (invert, Lab, ΔE, HSV, median)
src/discs.js         inverse→nearest-disc mapping
src/default-palette.js checked-in ten-colour default
src/palette.js       validation, JSON/query encoding, stripe backgrounds
src/palette-ui.js    colour editor, local storage, import/export/share
fixtures/            sample screenshots (named by puzzle date)
test/                node:test unit tests
scripts/             dependency-free asset build and local HTTP server
Makefile             build, dev, test, palette-default targets
```

Detection, sampling, clustering, palette validation and colour mapping are pure
modules tested in Node. Detection tests use a reduced RGBA copy of the real JPEG
fixture at three sizes, including both empty tubes and all ten colours.

## Conventions

- Slot order is **bottom → top** within a tube; tubes are row-major.
- `null` means an empty slot.
- Output JSON: `{ layout, order, grid, colors, counts, discs, stacks, palette, collisions }`
  with `order: "bottom-to-top"`. `stacks` includes disc identities, colours and stripes..

## Status

| Piece | State |
|---|---|
| Upload, outlined preview, disc stacks, JSON | ✅ |
| Colour maths, disc mapping, clustering | ✅ with tests |
| `detectLayout` (auto-detect grid) | ✅ dark-board fixture at three sizes |
| Ten-colour palette, stripes, persistence, sharing, repo default | ✅ |
| Manual crop/grid override UI | ⏳ |
| Click-to-fix a misread slot | ⏳ |
| Solver | 🗂 backlog |

## Deploy

Pull requests and pushes to `main` run tests, build `_site/`, and retain the
generated site as the `web-assets` CI artifact. The build contains only
`index.html`, `styles.css`, `src/`, and `.nojekyll`; screenshots, fixtures,
tests, and repository metadata are excluded. Relative asset paths support
GitHub Pages project URLs.

Pushes to `main` (or a manual workflow run) test and build the site, then deploy
the generated artifact via `.github/workflows/pages.yml`. In repo settings set
**Pages → Source: GitHub Actions**, and allow Actions to run. A successful deploy
will expose the site at https://ddol.github.io/colour-puzzle-mapper/.

The deployment job uses the `github-pages` environment and GitHub's built-in
token; no hosting credentials or image-upload backend are required. Environment
protection rules, if configured in GitHub, must permit the deployment branch.
