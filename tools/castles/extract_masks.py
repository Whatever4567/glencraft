#!/usr/bin/env python3
"""Extract castle+hill silhouette masks from the official refs, ignoring sky, distant mountains and trees."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageMorph

ROOT = Path('/workspace/qa/castles')
REFS = {
    'clansman': ROOT / 'v2/refs/clansman.jpg',
    'skeleton': ROOT / 'v2/refs/skeleton.jpg',
    'black-skeleton': ROOT / 'v2/refs/black-skeleton.jpg',
}
OUT = ROOT / 'v3/masks'
OUT.mkdir(parents=True, exist_ok=True)

def flood_from_top(sky_like, max_frac=0.85):
    h, w = sky_like.shape
    vis = np.zeros((h, w), dtype=bool)
    stack = []
    for x in range(w):
        if sky_like[0, x]:
            stack.append((0, x))
            vis[0, x] = True
    # also from left/right upper sides
    for y in range(int(h * 0.45)):
        for x in (0, w - 1):
            if sky_like[y, x] and not vis[y, x]:
                stack.append((y, x))
                vis[y, x] = True
    while stack:
        y, x = stack.pop()
        if y > h * max_frac:
            continue
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and (not vis[ny, nx]) and sky_like[ny, nx]:
                vis[ny, nx] = True
                stack.append((ny, nx))
    return vis

def close_open(mask, close=5, open_=3):
    im = Image.fromarray(mask.astype(np.uint8) * 255, 'L')
    if close:
        im = im.filter(ImageFilter.MaxFilter(close))
        im = im.filter(ImageFilter.MinFilter(close))
    if open_:
        im = im.filter(ImageFilter.MinFilter(open_))
        im = im.filter(ImageFilter.MaxFilter(open_))
    return np.asarray(im) > 127

def mask_clansman(a):
    h, w = a.shape[:2]
    r, g, b = a[:,:,0].astype(np.int16), a[:,:,1].astype(np.int16), a[:,:,2].astype(np.int16)
    # sunset sky: warm, relatively smooth, brighter in the upper frame
    sky_like = (r > 70) & (r > b + 15) & (r >= g - 5) & (g > 35) & ((r + g + b) > 180)
    sky_like |= (r > 90) & (r > b + 25) & (g > 40) & (g < 140)  # orange band
    # also pale grey-pink high sky
    sky_like |= (r > 100) & (np.abs(r.astype(int) - g) < 40) & (b > 70) & (r > b)
    sky = flood_from_top(sky_like, 0.72)
    # loch: lower-left, darker cool or reflective
    loch = np.zeros((h, w), dtype=bool)
    ys, xs = slice(int(h*0.45), h), slice(0, int(w*0.38))
    loch[ys, xs] = (b[ys, xs] >= r[ys, xs] - 5) & (b[ys, xs] > 25) & (g[ys, xs] > 20) & (r[ys, xs] < 90)
    # pines: dark green columns on the left mid
    trees = (g > r + 8) & (g > b + 5) & (g > 25) & (r < 70)
    # distant mountains: left background, mid contrast brown/purple, not the keep
    # keep is around the right-center; drop far-left low-frequency brown
    mountains = np.zeros((h, w), dtype=bool)
    xs = slice(0, int(w*0.22))
    mountains[:, xs] = (r[:, xs] > 40) & (r[:, xs] < 130) & (g[:, xs] < r[:, xs] + 5) & (b[:, xs] < r[:, xs]) & (~sky[:, xs]) & (g[:, xs] > 20)
    castle = ~(sky | loch | trees | mountains)
    # drop heather-only foreground? keep terraces (grey stone). Heather is purple-pink near steps.
    # include heather as hill/terrace.
    # clean small islands of noise
    castle = close_open(castle, 5, 3)
    # drop tiny speckles at the very top
    castle[:int(h*0.04)] = False
    return castle, dict(sky=sky, loch=loch, trees=trees, mountains=mountains)

def mask_ruin(a, black=False):
    h, w = a.shape[:2]
    r, g, b = a[:,:,0].astype(np.int16), a[:,:,1].astype(np.int16), a[:,:,2].astype(np.int16)
    if black:
        # red/orange sky
        sky_like = (r > 60) & (r > g + 10) & (r > b + 15)
        sky_like |= (r > 80) & (g < 80) & (b < 70)
    else:
        sky_like = (r > 50) & (r > b + 5) & (g > 25) & (g < 120) & (r > 40)
        sky_like |= (r > 70) & (g > 30) & (b > 30) & (r > b)
        # foggy grey sky
        sky_like |= (np.abs(r - g) < 20) & (np.abs(g - b) < 25) & (r > 55) & (r < 160) & (b > 40)
    sky = flood_from_top(sky_like, 0.7)
    # water / fog at the very bottom left/right, not the crag
    water = np.zeros((h, w), dtype=bool)
    def cool(ys, xs):
        return (b[ys, xs] >= g[ys, xs] - 5) & (b[ys, xs] >= r[ys, xs] - 5) & (b[ys, xs] > 20)
    water[int(h*0.72):, :int(w*0.18)] = cool(slice(int(h*0.72), h), slice(0, int(w*0.18)))
    water[int(h*0.72):, int(w*0.82):] = cool(slice(int(h*0.72), h), slice(int(w*0.82), w))
    # dead trees: thin dark verticals at far left/right, not the keep
    trees = np.zeros((h, w), dtype=bool)
    dark = (r + g + b) < 90
    trees[:, :int(w*0.12)] = dark[:, :int(w*0.12)]
    trees[:, int(w*0.88):] = dark[:, int(w*0.88):]
    castle = ~(sky | water | trees)
    castle = close_open(castle, 5, 3)
    castle[:int(h*0.03)] = False
    return castle, dict(sky=sky, water=water, trees=trees)

def save_overlay(im, mask, path):
    a = np.asarray(im.convert('RGB')).copy()
    # tint mask in cyan
    m = mask
    a[m] = (a[m] * 0.45 + np.array([40, 200, 220]) * 0.55).astype(np.uint8)
    Image.fromarray(a).save(path)

def main():
    report = []
    for name, p in REFS.items():
        im = Image.open(p)
        a = np.asarray(im.convert('RGB'))
        if name == 'clansman':
            mask, parts = mask_clansman(a)
        else:
            mask, parts = mask_ruin(a, black=(name == 'black-skeleton'))
        Image.fromarray(mask.astype(np.uint8) * 255, 'L').save(OUT / f'{name}-mask.png')
        save_overlay(im, mask, OUT / f'{name}-mask-overlay.png')
        for k, v in parts.items():
            Image.fromarray(v.astype(np.uint8) * 255, 'L').save(OUT / f'{name}-part-{k}.png')
        frac = float(mask.mean())
        report.append(f'{name}: mask frac={frac:.3f} size={mask.shape[1]}x{mask.shape[0]}')
        print(report[-1])
    (OUT / 'mask-report.txt').write_text('\n'.join(report) + '\n')

if __name__ == '__main__':
    main()
