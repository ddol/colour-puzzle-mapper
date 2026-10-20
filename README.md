# colour-puzzle-mapper

Static web app (GitHub Pages) that takes a screenshot of the daily
colour-sort puzzle, extracts the tube grid, and maps each colour to our
physically printed discs.

- **No framework or dependencies.** Vanilla ES modules + Canvas API; a small
  Node script packages the public files for deployment.
- **Runs entirely in the browser.** Screenshots are never uploaded anywhere.
- **Assign screenshot colours one-to-one** to the palette in label order:
  A → D01, B → D02, …, J → D10. Colours do not need to look similar.
- **Reverse each stack's occupied discs** so the next digital bottom disc is
  accessible from the physical top. RGB colour channels are never inverted.

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

Choose an image using the file picker or drag it onto the upload area. The main
flow is **upload → physical output**. The ten-colour editor stays in a closed
palette drawer. The screenshot preview and extracted colours share a second,
closed drawer below the output; expand it when you want to inspect detection.
The top navigation links to r/ColorPuzzleGame and a companion post at
`screen-free.html`, with photos of the physical setup and the story behind it.

The browser decodes the image locally into a canvas capped at 720 × 1200 pixels, locates
repeated slot shapes, and outlines the detected
slots in the preview. The results show the original colours and mapped physical
discs as compact, unlabelled stacks. Build each stack from the bottom upwards.
Discs are 24 px tall and overlap by 5%. Their SVG artwork has a transparent
centre bore and a shaded acrylic rim, based on the physical discs. Each enabled
stripe colour has eight marks around the full rim: four are visible on the front.
With black and white enabled, eight alternating marks are visible. Markings stay
on the rim, leaving the top face solid. The palette editor, modal and legend use
the same artwork. Legend entries use 3 px inner gaps and a 28 px column gap. Stack/disc labels remain available to screen readers and on
hover, and the JSON export keeps all positions and IDs.
After a successful upload, the page scrolls to the physical output (respecting
reduced-motion preferences). Palette edits update the result without scrolling.

Only one image loads at a time; files over 25 MB are rejected. The app releases the
original image and its object URL after drawing, and avoids an extra preview canvas
to reduce memory pressure on mobile browsers. Repeated selection of the same file
is supported.

Detection is tuned to the supplied dark-board screenshot: a regular grid with four
slots per tube. It tolerates different screenshot sizes and includes empty tubes
inside the detected grid. A completely empty outside column/row cannot be inferred
from coloured slots alone. Cropped boards, other themes, or unusual layouts may
need a future manual override. Review the outlines and colour-count warnings.

## Disc palette

Expand **Your ten disc colours** to edit the palette. The editor always contains ten disc colours. Each colour has a name, a colour
dialog opened by tapping the disc, and independent **black stripe** and
**white stripe** checkboxes in compact columns (neither,
either one, or both). Saved changes update stacks and local storage.
Each detected screenshot colour receives one distinct disc ID, in palette order,
regardless of its RGB value. Assignment is stable for a given set of screenshot
labels, even if their RGB values or the palette's colours/stripes change. The
output includes a visible screenshot-label → disc-ID key. More detected colours
than available discs produces a clear error instead of merging colours.

Tap a palette disc to open the colour dialog, then **tap the disc inside the
modal** to open the OS/browser's default colour picker. A real native colour
input overlays that modal disc, so it receives the tap directly; no programmatic
click proxy is used. RGB sliders and hex entry also remain available. Native,
RGB and hex edits stay synchronized. **Save colour** commits the choice;
**Cancel** leaves the palette unchanged.

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

The checked-in default uses Amber, Lime, Red, Orange, Yellow, Green, Cyan, Blue,
Purple and Pink. Yellow has black and white stripes; Orange and Purple have white
stripes, matching the supplied palette.

## Layout

```
index.html           upload UI, preview, results
screen-free.html     screen-free setup blog post
images/              published photos of the physical setup
styles.css
src/main.js          wiring: file → canvas → detect → sample → cluster → map → render
src/render.js        DOM rendering: grid + disc mapping
src/image.js         File → ImageData (browser only)
src/detect.js        board / tube / slot geometry (+ manual grid fallback)
src/sample.js        median colour per slot, empty-slot detection
src/cluster.js       ΔE clustering → labelled grid
src/color.js         pure colour maths (RGB, Lab, ΔE, HSV, median)
src/discs.js         consistent one-to-one screenshot-label→disc-ID mapping
src/stacks.js        reverse occupied stack order; keep empty space at the top
src/color-picker.js  native OS picker plus accessible RGB/hex colour dialog
src/default-palette.js checked-in ten-colour default
src/palette.js       validation and JSON/query encoding
src/disc-art.js      shared SVG discs with rim markers and transparent bores
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
- `null` means an empty slot. Physical stacks keep empty slots above the discs.
- Digital tubes empty from the bottom, physical stacks from the top. Thus a
  digital bottom-to-top `[A, B, C, D]` becomes physical `[D, C, B, A]`.
- Output JSON: `{ layout, order, grid, physicalGrid, colors, counts, discs, stacks, palette, mappingMode }`
  with `order: "bottom-to-top"`. `grid` preserves the screenshot order;
  `physicalGrid` reverses the occupied labels. `stacks` follows `physicalGrid`
  and includes disc identities, colours and stripes. `mappingMode` is `"one-to-one"`.

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
`index.html`, `screen-free.html`, `styles.css`, `src/`, `images/`, and `.nojekyll`;
uploaded screenshots, fixtures, tests, and repository metadata are excluded.
The two setup photos in `images/` are intentionally public. Relative asset paths support
GitHub Pages project URLs.

Pushes to `main` (or a manual workflow run) test and build the site, then deploy
the generated artifact via `.github/workflows/pages.yml`. In repo settings set
**Pages → Source: GitHub Actions**, and allow Actions to run. A successful deploy
will expose the site at https://ddol.github.io/colour-puzzle-mapper/.

The deployment job uses the `github-pages` environment and GitHub's built-in
token; no hosting credentials or image-upload backend are required. Environment
protection rules, if configured in GitHub, must permit the deployment branch.
