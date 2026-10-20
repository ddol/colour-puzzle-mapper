# colour-puzzle-mapper

Static single-page app (GitHub Pages) that takes a screenshot of the daily
colour-sort puzzle, extracts the tube grid, and maps each colour to our
physically printed discs.

- **No framework, no build step.** Vanilla ES modules + Canvas API.
- **Runs entirely in the browser.** Screenshots are never uploaded anywhere.
- **Discs are the inverse** of each screenshot colour, snapped to the nearest
  printed disc colour (ΔE in Lab space). The mapping is not 1:1, so colliding
  colours are reported.

## Run locally

```sh
npm start        # serves the repo root (ES modules need http://, not file://)
npm test         # node --test, zero dependencies
```

## Layout

```
index.html           upload UI, preview, results
styles.css
src/main.js          wiring: file → canvas → detect → sample → cluster → map → render
src/image.js         File → ImageData (browser only)
src/detect.js        board / tube / slot geometry (+ manual grid fallback)
src/sample.js        median colour per slot, empty-slot detection
src/cluster.js       ΔE clustering → labelled grid
src/color.js         pure colour maths (invert, Lab, ΔE, HSV, median)
src/discs.js         printed disc palette + inverse→nearest-disc mapping
fixtures/            sample screenshots (named by puzzle date)
test/                node:test unit tests
```

Everything except `image.js`, `render.js` and `main.js` is pure and works on
ImageData-like `{ data, width, height }` objects, so it can be tested in Node.

## Conventions

- Slot order is **top → bottom** within a tube; tubes are row-major.
- `null` means an empty slot.
- Output JSON: `{ layout, order, grid, colors, counts, discs, collisions }`.

## Status

| Piece | State |
|---|---|
| Upload, preview, render, JSON | ✅ skeleton |
| Colour maths, disc mapping, clustering | ✅ with tests |
| `detectLayout` (auto-detect grid) | ⏳ next PR |
| Real disc palette values | ⏳ placeholders in `src/discs.js` |
| Manual crop/grid override UI | ⏳ |
| Click-to-fix a misread slot | ⏳ |
| Solver | 🗂 backlog |

## Deploy

Pushes to `main` deploy via `.github/workflows/pages.yml`. In repo settings set
**Pages → Source: GitHub Actions**.
