#!/usr/bin/env python3
"""Extract a full-resolution, horizontally seamless overworld sunset sky
from the reference photo. Keep literal source sky pixels; inpaint only
foreground (trees, mountains, terrain). No downscaling, no stylising.
"""
import os
import numpy as np
from PIL import Image, ImageFilter
import cv2

SRC = os.environ.get('SKY_REF', '/workspace/qa/sky/ref-sunset.jpg')
OUT_WEBP = os.environ.get('SKY_WEBP', '/workspace/gc-sky/assets/sky/overworld-sunset.webp')
OUT_PREVIEW = os.environ.get('SKY_PREVIEW', '/workspace/qa/sky/extracted-sky.png')
OUT_MASK = os.environ.get('SKY_MASK', '/workspace/qa/sky/extracted-sky-mask.png')
HORIZON = int(os.environ.get('SKY_HORIZON', '1320'))

im = Image.open(SRC).convert('RGB')
W, H = im.size
arr = np.asarray(im)
print('source', W, H, flush=True)

bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
r = arr[:, :, 0].astype(np.float32)
g = arr[:, :, 1].astype(np.float32)
b = arr[:, :, 2].astype(np.float32)
luma = 0.30 * r + 0.50 * g + 0.20 * b
sat = arr.max(2).astype(np.float32) - arr.min(2).astype(np.float32)
yy = np.arange(H)[:, None]

veg = (g > r + 5) & (g > b)
trunk = (luma < 32) & (yy > 350) & (sat < 45)
# warm-grey / tan stone in the mid-lower frame, not sunset gold
sky_chroma = (
    ((r > g + 18) & (sat > 45) & (r > 70))
    | ((r > g + 6) & (b > g + 4) & (sat > 16))  # mauve / purple cloud
)
stone = (
    (yy > int(0.38 * H))
    & (sat < 52)
    & (luma > 22)
    & (luma < 230)
    & ~sky_chroma
)
def_fg = veg | trunk | stone
def_fg[:200, :] = False

top = yy < 90
warm = (r > g + 8) & (sat > 35) & (r > 50) & ~def_fg
purple = (r > g + 5) & (b > g + 4) & (yy < int(0.60 * H)) & ~def_fg
def_sky = (top | warm | purple) & ~def_fg
def_sky[:90, :] = True

scale = 2
h2, w2 = H // scale, W // scale
small = cv2.resize(bgr, (w2, h2), interpolation=cv2.INTER_AREA)
mask = np.full((h2, w2), cv2.GC_PR_BGD, np.uint8)
ds = cv2.resize(def_sky.astype(np.uint8), (w2, h2), interpolation=cv2.INTER_AREA) > 0.5
df = cv2.resize(def_fg.astype(np.uint8), (w2, h2), interpolation=cv2.INTER_AREA) > 0.5
pr_sky = (cv2.resize((yy < int(0.5 * H)).astype(np.uint8), (w2, h2)) > 0) & ~df
mask[pr_sky] = cv2.GC_PR_FGD
mask[ds] = cv2.GC_FGD
mask[df] = cv2.GC_BGD
bgd = np.zeros((1, 65), np.float64)
fgd = np.zeros((1, 65), np.float64)
print('grabcut…', flush=True)
cv2.grabCut(small, mask, None, bgd, fgd, 5, cv2.GC_INIT_WITH_MASK)
sky_s = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
sky = cv2.resize(sky_s, (W, H), interpolation=cv2.INTER_NEAREST) > 0
sky |= def_sky
sky &= ~def_fg

fg = (~sky).astype(np.uint8) * 255
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, k)
fg = cv2.dilate(fg, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
fg[:80, :] = 0

# Grow terrain only through non-sky-chroma pixels
allow = ((~sky_chroma) & (yy > 280)).astype(np.uint8) * 255
allow = cv2.bitwise_or(allow, fg)
seed = fg.copy()
for i in range(50):
    nxt = cv2.dilate(seed, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    nxt = cv2.bitwise_and(nxt, allow)
    if np.array_equal(nxt, seed):
        print('terrain flood settled at', i, flush=True)
        break
    seed = nxt
fg = seed
fg[:80, :] = 0

# Keep only FG components that touch the horizon (trees/mountains sit on the ground)
hor = min(HORIZON, H - 1)
num, labels, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
keep = np.zeros(num, np.uint8)
for i in range(1, num):
    ys = labels[max(0, hor - 8):min(H, hor + 30), :] == i
    if ys.any() and stats[i, cv2.CC_STAT_AREA] >= 200:
        keep[i] = 1
fg = keep[labels] * 255
# Fill enclosed holes (unmasked stone faces inside the mountain)
inv = cv2.bitwise_not(fg)
ff = inv.copy()
h0, w0 = ff.shape
for seed_pt in [(0, 0), (w0 - 1, 0), (0, h0 - 1), (w0 - 1, h0 - 1), (1, hor // 2 if hor < h0 else 10)]:
    if ff[seed_pt[1], seed_pt[0]] != 0:
        cv2.floodFill(ff, None, seed_pt, 128)
enclosed = (ff == 255)
fg[enclosed] = 255
# One more close + dilate so tree tips and mountain rims are covered
fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
fg = cv2.dilate(fg, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
fg[:80, :] = 0
# Re-drop any blob that no longer touches the horizon (close may have created sky islands? unlikely)
num2, lab2, st2, _ = cv2.connectedComponentsWithStats(fg, 8)
keep2 = np.zeros(num2, np.uint8)
for i in range(1, num2):
    ys = lab2[max(0, hor - 8):min(H, hor + 30), :] == i
    if ys.any():
        keep2[i] = 1
fg = keep2[lab2] * 255
print('kept FG components', int(keep.sum()), 'of', num - 1, 'after hole-fill fg frac', float((fg[:hor + 1] > 0).mean()), flush=True)

sky = fg == 0

# --- fill only the holes, up to the horizon ---
crop_h = hor + 1
img = arr[:crop_h].copy()
hole = (fg[:crop_h] > 0).astype(np.uint8) * 255
hole = cv2.dilate(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
# eat a few leftover tree-tip / rim pixels
print('hole frac', float((hole > 0).mean()), 'px', int((hole > 0).sum()), flush=True)
np.save('/tmp/sky-hole.npy', hole)
np.save('/tmp/sky-img.npy', img)
print('saved /tmp/sky-hole.npy', flush=True)
if os.environ.get('STOP_AFTER_MASK'): raise SystemExit(0)


luma_c = (0.30 * img[:, :, 0] + 0.50 * img[:, :, 1] + 0.20 * img[:, :, 2]).astype(np.float32)
# Do not use dark ocean / leftover terrain as colour sources
# Also ignore a thin band just outside the hole (mixed sky/tree colours)
src_ok = (hole == 0) & (luma_c > 58)
edge_ban = cv2.dilate(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
src_ok &= (edge_ban == 0) | (hole == 0)
# actually edge_ban>=hole, so src_ok &= hole==0 already; drop mixed rim:
src_ok &= (cv2.dilate(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))) == 0)
# restore: we still need some sources near the hole; only ban the 3px rim
rim = cv2.dilate(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
src_ok = (hole == 0) & (luma_c > 58)
src_ok &= (rim == 0) | (cv2.erode((hole == 0).astype(np.uint8) * 255, np.ones((3, 3), np.uint8)) > 0)
# simpler final:
src_ok = (hole == 0) & (luma_c > 58)

def push_pull(img8, valid_bool, levels=8):
    imgf = img8.astype(np.float32)
    valid = valid_bool.astype(np.float32)
    imgs, ws = [], []
    cur, w = imgf, valid
    for _ in range(levels):
        imgs.append(cur)
        ws.append(w)
        if cur.shape[0] < 4 or cur.shape[1] < 4:
            break
        nw, nh = max(1, cur.shape[1] // 2), max(1, cur.shape[0] // 2)
        premul = cur * w[:, :, None]
        premul_d = cv2.resize(premul, (nw, nh), interpolation=cv2.INTER_AREA)
        w_d = cv2.resize(w, (nw, nh), interpolation=cv2.INTER_AREA)
        cur = premul_d / np.maximum(w_d[:, :, None], 1e-5)
        w = (w_d > 0.02).astype(np.float32)
    for i in range(len(imgs) - 2, -1, -1):
        up = cv2.resize(cur, (imgs[i].shape[1], imgs[i].shape[0]), interpolation=cv2.INTER_LINEAR)
        w_i = ws[i][:, :, None]
        cur = imgs[i] * w_i + up * (1.0 - w_i)
    return np.clip(cur, 0, 255)

# Low-frequency target colour in the holes (sunset gradient, no dark ocean)
low = push_pull(img, src_ok)

# Build a clean sky atlas: pixels we are allowed to clone texture from
atlas = src_ok.copy()
# Prefer mid/upper sky (more cloud texture); still allow lower gold
# Texture sample: pick a source that is definitely sky, preferably a large horizontal shift
# into the left or right clean bands, plus a vertical wrap through the upper/mid band
detail_img = img.astype(np.float32)
# precompute lowfreq of source for colour transfer
low_src = cv2.GaussianBlur(np.where(src_ok[:, :, None], detail_img, low), (0, 0), 18)

Hloc, Wloc = crop_h, img.shape[1]
# candidate shifts into known clean regions
shifts = [1200, -1200, 900, -900, 1600, -1600, 600, -600, 2000]
# For each hole pixel, first shift that lands in atlas; then recolor to low target
# Vectorized: try shifts in order, keep first hit
remain = (hole > 0)
ys, xs = np.indices((Hloc, Wloc))
src_y = ys.copy()
src_x = xs.copy()
found = np.zeros((Hloc, Wloc), dtype=bool)
for sh in shifts:
    x2 = (xs + sh) % Wloc
    # vertical jitter: map lower rows partly into a higher band so we don't
    # sample near-horizon ocean; keep x the same height when the src row is clean
    hit = remain & atlas[ys, x2] & (~found)
    src_x[hit] = x2[hit]
    src_y[hit] = ys[hit]
    found |= hit
# For remaining (wide lower holes where this row is almost all foreground),
# sample from a higher clean row in the gold/pink cloud band.
if (~found & remain).any():
    for dy, sh in ((180, 1100), (280, -1000), (400, 800), (520, -800), (80, 1500)):
        y2 = np.clip(ys - dy, 0, Hloc - 1)
        x2 = (xs + sh) % Wloc
        hit = remain & (~found) & atlas[y2, x2]
        src_x[hit] = x2[hit]
        src_y[hit] = y2[hit]
        found |= hit
# last resort: any atlas pixel via push-pull colour only (no extra texture)
sampled = detail_img[src_y, src_x]
src_low = np.maximum(low_src[src_y, src_x], 8.0)
tgt_low = np.maximum(low, 8.0)
# colour transfer: keep source texture, match local sunset colour
recolor = sampled * (tgt_low / src_low)
recolor = np.clip(recolor, 0, 255)
# where we never found a texture sample, just use the low-frequency fill
recolor = np.where(found[:, :, None], recolor, low)

filled = np.where(hole[:, :, None] > 0, recolor, detail_img)

# Soften the seam: blur a copy and lerp on a feathered hole edge
blur_f = cv2.GaussianBlur(filled, (0, 0), 3)
# feather: 1 inside hole, 0 in literal sky, 0.5 on a 12px edge
dist_in = cv2.distanceTransform((hole > 0).astype(np.uint8), cv2.DIST_L2, 5)
dist_out = cv2.distanceTransform((hole == 0).astype(np.uint8), cv2.DIST_L2, 5)
# we must never change literal sky; only feather inside the hole near the edge
feather = np.clip(dist_in / 14.0, 0, 1).astype(np.float32)
# near the edge (small dist_in), more blur
filled = filled * feather[:, :, None] + blur_f * (1.0 - feather[:, :, None])
filled = np.where((hole == 0)[:, :, None], detail_img, filled)

# Telea inpaint on a narrow seam (mostly inside the hole plus 2px)
edge = cv2.dilate(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
edge = cv2.subtract(edge, cv2.erode(hole, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))))
edge_bgr = cv2.cvtColor(np.clip(filled, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
print('edge inpaint…', int((edge > 0).sum()), 'px', 'found tex', float(found[hole > 0].mean()) if (hole > 0).any() else 0, flush=True)
inp = cv2.inpaint(edge_bgr, edge, 4, cv2.INPAINT_TELEA)
comp = cv2.cvtColor(inp, cv2.COLOR_BGR2RGB).astype(np.float32)
comp = np.where((hole == 0)[:, :, None], detail_img, comp)

SEAM = 280
left = comp[:, :SEAM].copy()
right = comp[:, -SEAM:].copy()
mix = 0.5 * (left + right)
amt = (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, SEAM, dtype=np.float32)))[None, :, None]  # 1 at outer edge
comp[:, :SEAM] = left * (1 - amt) + mix * amt
comp[:, -SEAM:] = right * (1 - amt[:, ::-1, :]) + mix * amt[:, ::-1, :]

comp = np.clip(comp, 0, 255).astype(np.uint8)
out_im = Image.fromarray(comp, 'RGB')

# previews
mask_vis = arr[:crop_h].astype(np.float32).copy()
m = hole > 0
mask_vis[m] = mask_vis[m] * 0.35 + np.array([220, 30, 30], np.float32) * 0.65
Image.fromarray(mask_vis.astype(np.uint8)).save(OUT_MASK)
out_im.save(OUT_PREVIEW)
os.makedirs(os.path.dirname(OUT_WEBP), exist_ok=True)
out_im.save(OUT_WEBP, 'WEBP', quality=98, method=6)
print('wrote', OUT_WEBP, out_im.size, 'bytes', os.path.getsize(OUT_WEBP), flush=True)
print('wrote', OUT_PREVIEW, OUT_MASK, flush=True)
# also a small jpeg for inspection
smallp = out_im.resize((1280, int(1280 * crop_h / W)), Image.Resampling.LANCZOS)
smallp.save('/tmp/plate-new.jpg', 'JPEG', quality=92)
print('preview /tmp/plate-new.jpg', flush=True)
