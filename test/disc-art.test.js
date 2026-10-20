import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discSvg, discBackground } from '../src/disc-art.js';

const base = { hex: '#e4af49', blackStripe: false, whiteStripe: false };
for (const [blackStripe, whiteStripe, black, white] of [
  [false, false, 0, 0], [true, false, 4, 0], [false, true, 0, 4], [true, true, 4, 4],
]) {
  test(`front rim: black=${blackStripe}, white=${whiteStripe}`, () => {
    const svg = discSvg({ ...base, blackStripe, whiteStripe });
    assert.equal((svg.match(/data-rim="black"/g) || []).length, black);
    assert.equal((svg.match(/data-rim="white"/g) || []).length, white);
    // Marks are side-wall paths painted before the solid donut face.
    if (black || white) assert.ok(svg.lastIndexOf('data-rim=') < svg.indexOf('data-surface="face"'));
  });
}
test('the disc face has an unfilled centre bore and the CSS background preserves it', () => {
  const svg = discSvg(base);
  assert.match(svg, /data-surface="face"[^>]*fill-rule="evenodd"/);
  assert.match(svg, /M61 16 A11 3\.6/);
  assert.match(svg, /rx="11" ry="3.6" fill="none"/);
  assert.ok(!svg.includes('<rect'), 'no background rectangle fills the transparent bore');
  const css = discBackground(base);
  assert.ok(css.startsWith('url("data:image/svg+xml,'));
  const encoded = css.slice(css.indexOf(',') + 1, css.indexOf('")'));
  assert.equal(decodeURIComponent(encoded), svg);
});
