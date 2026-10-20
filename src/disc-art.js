import { hexToRgb, rgbToHex } from './color.js';

function shade(hex, factor) {
  return rgbToHex(hexToRgb(hex).map(channel => Math.min(255, channel * factor)));
}
const point = (angle, offset = 0) => [50 + 49 * Math.cos(angle), 16 + 16 * Math.sin(angle) + offset]
  .map(value => Number(value.toFixed(3))).join(' ');

/** Acrylic washer in perspective: transparent bore, solid face, marked rim. */
export function discSvg(disc) {
  const colors = [];
  if (disc.blackStripe) colors.push({ name: 'black', hex: '#000000' });
  if (disc.whiteStripe) colors.push({ name: 'white', hex: '#ffffff' });
  const count = colors.length * 8; // Eight marks around the full rim per colour.
  const marks = [];
  for (let i = 0; i < count; i++) {
    const angle = (i + 0.5) * 2 * Math.PI / count;
    if (Math.sin(angle) < 0) continue; // The rear half is hidden by the face.
    const { name, hex } = colors[i % colors.length];
    const start = angle - Math.PI / 45, end = angle + Math.PI / 45;
    marks.push(`<path data-rim="${name}" fill="${hex}" d="M${point(start)} A49 16 0 0 1 ${point(end)} L${point(end, 8)} A49 16 0 0 0 ${point(start, 8)} Z"/>`);
  }
  // The second subpath cuts the bore out of the face. No background fills it.
  const face = 'M99 16 A49 16 0 1 0 1 16 A49 16 0 1 0 99 16 Z M61 16 A11 3.6 0 1 0 39 16 A11 3.6 0 1 0 61 16 Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" preserveAspectRatio="none">
<defs>
<linearGradient id="face" x2="0" y2="1"><stop stop-color="${shade(disc.hex, 1.12)}"/><stop offset=".55" stop-color="${disc.hex}"/><stop offset="1" stop-color="${shade(disc.hex, .95)}"/></linearGradient>
<linearGradient id="rim" x2="0" y2="1"><stop stop-color="${shade(disc.hex, .85)}"/><stop offset="1" stop-color="${shade(disc.hex, .58)}"/></linearGradient>
</defs>
<path fill="url(#rim)" d="M1 16 A49 16 0 0 0 99 16 L99 24 A49 16 0 0 1 1 24 Z"/>
${marks.join('\n')}
<path data-surface="face" fill="url(#face)" fill-rule="evenodd" stroke="${shade(disc.hex, .8)}" stroke-width=".65" d="${face}"/>
<ellipse cx="50" cy="16" rx="11" ry="3.6" fill="none" stroke="${shade(disc.hex, .45)}" stroke-width=".8"/>
</svg>`;
}

export function discBackground(disc) {
  return `url("data:image/svg+xml,${encodeURIComponent(discSvg(disc))}") center / 100% 100% no-repeat`;
}
