/**
 * Digital tubes are sampled bottom first and empty from the bottom. Physical
 * stacks empty from the top, so reverse their occupied discs. Empty spaces
 * always sit above the physical discs. Both grids use bottom-to-top arrays.
 */
export function reverseStacks(grid) {
  return grid.map(tube => {
    const occupied = tube.filter(label => label !== null).reverse();
    return [...occupied, ...Array(tube.length - occupied.length).fill(null)];
  });
}
