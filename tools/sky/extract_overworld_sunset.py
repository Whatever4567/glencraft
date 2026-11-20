#!/usr/bin/env python3
"""Extract a full-resolution, seamless overworld sunset sky from the reference photo.
No downscaling, no stylising: keep the source sky pixels and only inpaint foreground holes.
Fast numpy row-propagation (no per-pixel Python flood fill).
"""
import os
import numpy as np
from PIL import Image, ImageFilter

SRC = os.environ.get('SKY_REF', '/workspace/qa/sky/ref-sunset.jpg')
OUT_WEBP = os.environ.get('SKY_WEBP', '/workspace/gc-sky/assets/sky/overworld-sunset.webp')
OUT_PREVIEW = '/workspace/qa/sky/extracted-sky.png'
OUT_MASK = '/workspace/qa/sky/extracted-sky-mask.png'

im = Image.open(SRC).convert('RGB')
W, H = im.size
arr = np.asarray(im, dtype=np.float32)
print('source', W, H, flush=True)

r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
yfrac = np.linspace(0, 1, H, dtype=np.float32)[:, None]

fol = ((g > r + 8) & (g > b - 8)) | ((g > 38) & (g >= r - 6) & (g > b + 12))
warm = (r >= g) & ((r - np.minimum(g, b)) >= 7) & (r >= 22)
purple = (r > 18) & (b > g + 2) & ((r + b) > (2 * g - 8))
gold = (r > 140) & (g > 35) & (b < g + 10)
hint = (~fol) & (warm | purple | gold | (yfrac < 0.16))

sky = np.zeros((H, W), dtype=bool)
sky[0] = True
# Downward + left/right propagation, a few passes per row
for y in range(1, H):
    if y > int(0.72 * H):
        break
    row = hint[y] & (sky[y - 1] | np.roll(sky[y - 1], 1) | np.roll(sky[y - 1], -1))
    for _ in range(8):
        nxt = row | (hint[y] & (np.roll(row, 1) | np.roll(row, -1)))
        if nxt is row or np.array_equal(nxt, row):
            break
        row = nxt
    # colour-continuity into darker cloud pockets from the row above
    prev = arr[y - 1]
    cur = arr[y]
    d = np.abs(cur - prev).sum(axis=1)
    loose = (~fol[y]) & (d < 42) & (yfrac[y, 0] < 0.66) & (
        sky[y - 1] | np.roll(sky[y - 1], 1) | np.roll(sky[y - 1], -1)
    )
    sky[y] = row | loose

def dilate(m, k=2):
    out = m.astype(np.uint8).copy()
    for _ in range(k):
        n = out.copy()
        n[1:] |= out[:-1]
        n[:-1] |= out[1:]
        n[:, 1:] |= out[:, :-1]
        n[:, :-1] |= out[:, 1:]
        out = n
    return out

def erode(m, k=2):
    return (1 - dilate(~m if m.dtype == bool else (1 - m), k)).astype(np.uint8)

closed = erode(dilate(sky, 3), 3).astype(bool)

def side_horizon(m, sl):
    col = m[:, sl].mean(axis=1)
    ys = np.where(col > 0.4)[0]
    return int(ys[-1]) if len(ys) else int(0.6 * H)

h_left = side_horizon(sky, slice(0, int(0.1 * W)))
h_right = side_horizon(sky, slice(int(0.9 * W), W))
horizon = int(round(0.5 * (h_left + h_right)))
print('side horizons', h_left, h_right, 'use', horizon, flush=True)

pad = 8
closed[horizon + pad:, :] = 0
fg = (~closed) & (np.arange(H)[:, None] <= horizon + pad)
fg = dilate(fg, 2).astype(bool)
closed[fg & (np.arange(H)[:, None] <= horizon)] = False
mask = closed

crop_h = min(H, horizon + 1)
sky_px = arr[:crop_h].copy()
sm = mask[:crop_h]
out = sky_px.copy()

for y in range(crop_h):
    valid = np.where(sm[y])[0]
    if valid.size < 2:
        continue
    holes = np.where(~sm[y])[0]
    if holes.size == 0:
        continue
    for c in range(3):
        out[y, holes, c] = np.interp(holes, valid, sky_px[y, valid, c])

filled_rows = [y for y in range(crop_h) if sm[y].mean() > 0.3]
if filled_rows:
    fr = np.array(filled_rows)
    for y in range(crop_h):
        if sm[y].mean() <= 0.3:
            src = fr[np.argmin(np.abs(fr - y))]
            out[y] = out[src]
            sm[y] = True

inp = ~mask[:crop_h]
if inp.any():
    blur = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=1.6))
    ba = np.asarray(blur, dtype=np.float32)
    out[inp] = 0.65 * ba[inp] + 0.35 * out[inp]
    blur2 = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius=0.8))
    ba2 = np.asarray(blur2, dtype=np.float32)
    out[inp] = 0.4 * ba2[inp] + 0.6 * out[inp]

for i in range(1, 7):
    y = crop_h - i
    if y >= 0:
        row = out[y]
        k = 5
        padrow = np.pad(row, ((k, k), (0, 0)), mode='wrap')
        acc = np.zeros_like(row)
        for o in range(-k, k + 1):
            acc += padrow[k + o:k + o + W]
        out[y] = acc / (2 * k + 1)

s = 280
L = out[:, :s].copy()
R = out[:, -s:].copy()
t = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, s, dtype=np.float32))[None, :, None]
mixed = (1.0 - t) * R + t * L
out[:, :s] = mixed
out[:, -s:] = mixed

sky_img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGB')
print('extracted sky', sky_img.size, 'width==source', sky_img.size[0] == W, flush=True)
os.makedirs(os.path.dirname(OUT_WEBP), exist_ok=True)
sky_img.save(OUT_WEBP, 'WEBP', quality=95, method=6, exact=True)
sky_img.save(OUT_PREVIEW, 'PNG')
vis = arr[:crop_h].astype(np.uint8).copy()
om = mask[:crop_h]
vis[~om] = np.array([200, 30, 30], dtype=np.uint8)
Image.fromarray(vis).save(OUT_MASK)
print('wrote', OUT_WEBP, os.path.getsize(OUT_WEBP), 'bytes', flush=True)
print('wrote', OUT_PREVIEW, os.path.getsize(OUT_PREVIEW), flush=True)
print('wrote', OUT_MASK, flush=True)
