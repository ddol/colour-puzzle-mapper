import { defaultPalette, STORAGE_KEY, decodePalette, encodePalette, discBackground } from './palette.js';

export function setupPalette(onChange) {
  const $ = id => document.getElementById(id);
  const message = text => { $('palette-status').textContent = text; };
  let palette = defaultPalette();
  let storageError = '';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) palette = decodePalette(stored);
  } catch { storageError = 'Saved palette could not be loaded; using repository defaults.'; }
  const shared = new URL(location.href).searchParams.get('palette');
  if (shared !== null) {
    try { palette = decodePalette(shared); storageError = ''; }
    catch (error) { storageError = `Shared palette rejected: ${error.message}`; }
  }
  function save(cleanURL = true) {
    // Keep the URL consistent after editing a palette opened from a share link.
    const url = new URL(location.href);
    if (cleanURL && url.searchParams.has('palette')) {
      url.searchParams.delete('palette');
      try { history.replaceState(null, '', url); } catch { /* Local persistence still works. */ }
    }
    if (cleanURL) { $('palette-link').hidden = true; $('palette-link').value = ''; }
    try {
      localStorage.setItem(STORAGE_KEY, encodePalette(palette));
      message('Palette saved on this device.');
    } catch { message('Local storage is unavailable. Export your palette to keep it.'); }
    onChange(palette);
  }
  // A single stable native picker avoids ten Safari colour wells. Only the
  // selected disc previews input events; save/remap once the picker commits.
  const picker = document.createElement('input');
  picker.type = 'color';
  picker.className = 'shared-color-picker';
  picker.tabIndex = -1;
  picker.setAttribute('aria-label', 'Selected disc colour');
  $('palette-panel').append(picker);
  let activeColor = null;
  picker.addEventListener('input', () => {
    if (!activeColor) return;
    activeColor.disc.hex = picker.value;
    activeColor.swatch.style.background = discBackground(activeColor.disc);
  });
  picker.addEventListener('change', () => {
    if (!activeColor) return;
    activeColor.disc.hex = picker.value;
    activeColor.swatch.style.background = discBackground(activeColor.disc);
    save();
  });
  function render() {
    activeColor = null;
    $('palette-colors').replaceChildren();
    for (const [i, disc] of palette.entries()) {
      const row = document.createElement('div');
      row.className = 'palette-color';
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.setAttribute('aria-label', `Colour ${i + 1} base colour`);
      swatch.title = 'Change disc colour';
      swatch.className = 'palette-swatch';
      const refresh = () => { swatch.style.background = discBackground(disc); save(); };
      swatch.style.background = discBackground(disc);
      const number = document.createElement('strong');
      number.textContent = disc.id;
      const name = document.createElement('input');
      name.className = 'palette-name';
      name.value = disc.name; name.maxLength = 40;
      name.setAttribute('aria-label', `Colour ${i + 1} name`);
      name.addEventListener('change', () => {
        disc.name = name.value.trim() || `Colour ${i + 1}`;
        name.value = disc.name; refresh();
      });
      swatch.addEventListener('click', () => {
        activeColor = { disc, swatch };
        picker.value = disc.hex;
        picker.click();
      });
      row.append(number, swatch, name);
      for (const [key, labelText] of [['blackStripe', 'Black stripe'], ['whiteStripe', 'White stripe']]) {
        const label = document.createElement('label');
        label.className = 'stripe-option';
        label.title = labelText;
        const check = document.createElement('input');
        check.type = 'checkbox'; check.checked = disc[key];
        check.setAttribute('aria-label', `Colour ${i + 1} ${labelText.toLowerCase()}`);
        check.addEventListener('change', () => { disc[key] = check.checked; refresh(); });
        label.append(check);
        row.append(label);
      }
      $('palette-colors').append(row);
    }
  }
  $('palette-reset').addEventListener('click', () => { palette = defaultPalette(); render(); save(); });
  $('palette-export').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([encodePalette(palette)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'palette.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message('Exported palette.json. To set the repo default: make palette-default PALETTE=/path/to/palette.json');
  });
  $('palette-import').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 12000) throw new Error('Palette file is too large.');
      palette = decodePalette(await file.text()); render(); save();
    } catch (error) { message(`Import rejected: ${error.message}`); }
    event.target.value = '';
  });
  $('palette-share').addEventListener('click', async () => {
    const url = new URL(location.href);
    url.searchParams.set('palette', encodePalette(palette));
    $('palette-link').value = url.href;
    $('palette-link').hidden = false;
    try { await navigator.clipboard.writeText(url.href); message('Palette link copied.'); }
    catch { $('palette-link').select(); message('Copy the palette link below.'); }
  });
  render();
  if (shared !== null && !storageError) save(false);
  if (storageError) message(storageError);
  return () => palette;
}
