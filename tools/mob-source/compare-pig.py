#!/usr/bin/env python3
"""Side-by-side reference vs after front/portrait, every round."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import sys

ref_p = Path(sys.argv[1] if len(sys.argv) > 1 else '/workspace/qa/phase3/pig/ref-pig.jpg')
after_dir = Path(sys.argv[2] if len(sys.argv) > 2 else '/workspace/qa/phase3/pig/after')
out = Path(sys.argv[3] if len(sys.argv) > 3 else '/workspace/qa/phase3/pig/compare-front.png')

ref = Image.open(ref_p).convert('RGB')
# prefer a tight portrait shot if present, else front
after_p = after_dir / 'portrait.png'
if not after_p.exists():
    after_p = after_dir / 'front.png'
after = Image.open(after_p).convert('RGB')
front = Image.open(after_dir / 'front.png').convert('RGB') if (after_dir / 'front.png').exists() else after
threeq = Image.open(after_dir / 'threeq.png').convert('RGB') if (after_dir / 'threeq.png').exists() else after

# crop the pig from studio shots (trim mostly-empty studio backdrop)
def crop_subject(im, bg_thresh=28):
    arr = __import__('numpy').asarray(im)
    # background is ~ #d8d6d2
    bg = arr[2, 2].astype('int')
    diff = abs(arr.astype('int') - bg).sum(-1)
    mask = diff > bg_thresh
    ys, xs = mask.nonzero()
    if len(xs) < 20:
        return im
    pad = 24
    x0, x1 = max(0, xs.min()-pad), min(im.width, xs.max()+pad)
    y0, y1 = max(0, ys.min()-pad), min(im.height, ys.max()+pad)
    return im.crop((x0, y0, x1, y1))

ref_c = crop_subject(ref, 18)
por_c = crop_subject(after, 28)
fr_c = crop_subject(front, 28)
tq_c = crop_subject(threeq, 28)

H = 720
def fit_h(im, h=H):
    r = h / im.height
    w = max(1, int(im.width * r))
    return im.resize((w, h), Image.Resampling.LANCZOS)

tiles = [fit_h(ref_c), fit_h(por_c), fit_h(fr_c), fit_h(tq_c)]
labels = ['Reference', 'After — portrait', 'After — front', 'After — three-quarter']
pad, label_h, title_h = 14, 34, 50
widths = [t.width for t in tiles]
cw = pad + sum(w + pad for w in widths)
ch = title_h + label_h + H + pad
sheet = Image.new('RGB', (cw, ch), (24, 22, 21))
draw = ImageDraw.Draw(sheet)
try:
    font_t = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
    font_l = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except Exception:
    font_t = font_l = ImageFont.load_default()
draw.text((pad, 12), 'Pig vs reference — front reads at a glance?  (unpublished WIP)', font=font_t, fill=(245, 236, 228))
x = pad
for lab, im, w in zip(labels, tiles, widths):
    col = (80, 42, 36) if lab.startswith('After') else (50, 48, 60)
    draw.rectangle([x, title_h, x+w, title_h+label_h], fill=col)
    draw.text((x+8, title_h+8), lab, font=font_l, fill=(245, 236, 228))
    sheet.paste(im, (x, title_h+label_h))
    x += w + pad
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out, 'PNG', optimize=True)
print('wrote', out, out.stat().st_size, sheet.size)
