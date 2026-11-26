from PIL import Image
from pathlib import Path
import numpy as np, json, sys
root = Path(sys.argv[1])
KEYS = ['stone','sand','sandstone','peat','cobblestone','stone_bricks','gold_ore','deepslate']
out = {}

def luma(a):
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]

def seam(a):
    return [int(np.abs(a[:, 0].astype(np.int16) - a[:, -1].astype(np.int16)).mean()),
            int(np.abs(a[0].astype(np.int16) - a[-1].astype(np.int16)).mean())]

maps = {}
for k in KEYS:
    im = Image.open(root / 'assets' / 'tex' / (k + '-1403.webp')).convert('RGB')
    a = np.asarray(im)
    maps[k] = a
    small = np.asarray(im.resize((128, 128)))
    uniq = len({(int(p[0]) << 16) | (int(p[1]) << 8) | int(p[2]) for p in small.reshape(-1, 3)})
    out[k] = {
        'w': int(a.shape[1]), 'h': int(a.shape[0]),
        'mean': [round(float(x), 1) for x in a.mean(axis=(0, 1))],
        'stdev': [round(float(x), 1) for x in a.std(axis=(0, 1))],
        'unique128': uniq,
        'ymin': round(float(luma(a).min()), 1),
        'seams': seam(a),
    }

# gold fraction: clearly yellow pixels
g = maps['gold_ore'].astype(np.int16)
gold = (g[..., 0] > 140) & (g[..., 1] > 80) & (g[..., 0] > g[..., 2] + 40) & (g[..., 1] > g[..., 2] + 20)
out['gold_frac'] = round(float(gold.mean()), 4)

# deepslate vs stone
s, d = maps['stone'], maps['deepslate']
out['deep_vs_stone'] = round(float(luma(s).mean() - luma(d).mean()), 1)
out['not_byte_copy'] = bool((s != d).any())
print(json.dumps(out))
