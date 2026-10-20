`2026-10-20-360x580.rgba.gz` is a 360 × 580 RGBA reduction of the repository's
`fixtures/2026-10-20.jpeg`, compressed with gzip (mtime=0). It lets Node test the
real screenshot without adding a JPEG decoder or requiring browser/Python in CI.

To regenerate with Python and Pillow:

```python
from PIL import Image
import gzip
from pathlib import Path
image = Image.open('fixtures/2026-10-20.jpeg').convert('RGBA').resize((360, 580))
Path('test/fixtures/2026-10-20-360x580.rgba.gz').write_bytes(
    gzip.compress(image.tobytes(), mtime=0))
```
