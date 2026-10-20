// Group sampled colours into distinct puzzle colours and label each slot.

import { rgbToLab, deltaE, medianRgb } from './color.js';

/**
 * Greedy ΔE clustering of slot colours.
 * TODO (next PR): tune threshold against fixtures and validate that every
 * colour appears exactly `slotsPerTube` times; flag the result if not.
 *
 * @param {(number[] | null)[][]} sampled  output of sampleLayout()
 * @param {number} threshold  max ΔE to join an existing cluster
 * @returns {{ grid: (string | null)[][], colors: Record<string, number[]>, counts: Record<string, number> }}
 */
export function clusterColors(sampled, threshold = 12) {
  /** @type {{ label: string, lab: number[], members: number[][] }[]} */
  const clusters = [];
  const grid = sampled.map((tube) =>
    tube.map((rgb) => {
      if (!rgb) return null;
      const lab = rgbToLab(rgb);
      let best = null;
      for (const c of clusters) {
        const d = deltaE(lab, c.lab);
        if (d <= threshold && (!best || d < best.d)) best = { c, d };
      }
      if (best) {
        best.c.members.push(rgb);
        return best.c.label;
      }
      const label = labelFor(clusters.length);
      clusters.push({ label, lab, members: [rgb] });
      return label;
    }),
  );

  const colors = {};
  const counts = {};
  for (const c of clusters) {
    colors[c.label] = medianRgb(c.members);
    counts[c.label] = c.members.length;
  }
  return { grid, colors, counts };
}

/** A, B, …, Z, AA, AB, … */
export function labelFor(i) {
  let s = '';
  i += 1;
  while (i > 0) {
    const r = (i - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}
