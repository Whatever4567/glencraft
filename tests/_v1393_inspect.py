from PIL import Image
from pathlib import Path
import numpy as np, json, sys
root = Path(sys.argv[1])
out = {}
for name in ['grass_top-1393.webp', 'dirt-1393.webp']:
    im = Image.open(root / 'assets' / 'tex' / name).convert('RGB')
    a = np.asarray(im)
    small = np.asarray(im.resize((128, 128)))
    out[name] = {
        'w': int(a.shape[1]), 'h': int(a.shape[0]),
        'mean': [round(float(x), 1) for x in small.mean(axis=(0, 1))],
        'stdev': [round(float(x), 1) for x in small.std(axis=(0, 1))],
    }

def seam(im):
    a = np.asarray(im.convert('RGB')).astype(np.int16)
    return [int(np.abs(a[:, 0] - a[:, -1]).mean()), int(np.abs(a[0] - a[-1]).mean())]

out['seams_grass'] = seam(Image.open(root / 'assets' / 'tex' / 'grass_top-1393.webp'))
out['seams_dirt'] = seam(Image.open(root / 'assets' / 'tex' / 'dirt-1393.webp'))
print(json.dumps(out))
