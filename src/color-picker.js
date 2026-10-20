import { hexToRgb, rgbToHex } from './color.js';
import { discBackground } from './palette.js';

// The modal disc contains a real colour input, directly tapped by the user.
export function setupColorPicker(onSave) {
  const $ = id => document.getElementById(id);
  const dialog = $('color-dialog');
  const hex = $('disc-hex');
  const native = $('disc-native-color');
  const save = $('color-save');
  const channels = ['red', 'green', 'blue'].map(channel => $(`disc-${channel}`));
  let selected = null;
  let candidate = '#000000';
  function showColor(value) {
    candidate = value.toLowerCase();
    hex.value = candidate;
    native.value = candidate;
    const rgb = hexToRgb(candidate);
    channels.forEach((input, i) => {
      input.value = rgb[i];
      $(`${input.id}-value`).textContent = String(rgb[i]);
      const low = [...rgb], high = [...rgb];
      low[i] = 0; high[i] = 255;
      input.style.background = `linear-gradient(90deg, ${rgbToHex(low)}, ${rgbToHex(high)})`;
    });
    $('color-preview').style.background = discBackground({ ...selected.disc, hex: candidate });
    $('color-error').textContent = '';
    save.disabled = false;
  }
  for (const event of ['input', 'change']) {
    native.addEventListener(event, () => showColor(native.value));
  }
  hex.addEventListener('input', () => {
    const value = hex.value.trim();
    if (/^#[0-9a-f]{6}$/i.test(value)) showColor(value);
    else {
      $('color-error').textContent = 'Enter a six-digit hex colour, for example #e34b40.';
      save.disabled = true;
    }
  });
  channels.forEach(input => input.addEventListener('input', () => {
    showColor(rgbToHex(channels.map(channel => Number(channel.value))));
  }));
  $('color-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!selected || save.disabled) return;
    const { disc, swatch } = selected;
    disc.hex = candidate;
    swatch.style.background = discBackground(disc);
    onSave();
    dialog.close();
  });
  $('color-cancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { selected = null; });
  return (disc, swatch) => {
    selected = { disc, swatch };
    $('color-title').textContent = `Disc ${disc.id} colour`;
    showColor(disc.hex);
    dialog.showModal();
  };
}
