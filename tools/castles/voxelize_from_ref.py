#!/usr/bin/env python3
"""Image-driven castle voxelization (Pass 5).

For each official ref: castle-only mask (exclude sky, crag, trees), monocular
depth (Depth Anything V2 Small ONNX), back-project at the matched hero camera,
extrude + mirror the unseen back, quantize to game block ids, re-carve
interiors, and pack assets/castles/*.bin (GC13 + JS13 specials footer).

Intended interpreter: /workspace/qa/castles/v5/.venv/bin/python
(rembg, onnxruntime, opencv, numpy, pillow).
"""
from __future__ import annotations

import argparse
import json
import math
import struct
import sys
import time
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))

from ids import *  # noqa: E402
from vox import Grid, pack_rle  # noqa: E402

REFS = Path('/workspace/qa/castles/v2/refs')
QA = Path('/workspace/qa/castles/v5')
DEPTH_ONNX = QA / 'models/depth-anything-v2-small.onnx'
ASSETS = ROOT / 'assets' / 'castles'

# Matched hero cameras (local +z = gate). Same as v4 specials / capture.
CAMERAS = {
    'clansman': dict(eye=(32.0, 22.0, 125.0), look=(6.0, 44.0, 8.0), fov=50.0),
    'skeleton': dict(eye=(8.0, 24.0, 148.0), look=(8.0, 44.0, 6.0), fov=50.0),
    'black-skeleton': dict(eye=(8.0, 24.0, 148.0), look=(8.0, 44.0, 6.0), fov=50.0),
}

# Target facade distance used to pin Depth Anything (ray length to a point
# on the keep front). Calibrated so the keep sits in front of the look-at.
TARGET = {
    'clansman': (6.0, 30.0, 28.0),
    'skeleton': (8.0, 28.0, 22.0),
    'black-skeleton': (8.0, 28.0, 22.0),
}

# Depth span (near..far, as a fraction of median t) across the visible facade.
DEPTH_SPAN = 0.28

# Wall thickness along the view ray (voxels) plus a shallower front crust.
THICK = {'clansman': 10, 'skeleton': 12, 'black-skeleton': 12}

PALETTES = {
    'clansman': [
        (STONE, (112, 108, 102)),
        (COBBLE, (88, 84, 78)),
        (STONEBRICK, (138, 132, 124)),
        (WSTONE, (168, 164, 156)),
        (DEEPSLATE, (48, 50, 54)),
        (DSBRICK, (42, 42, 48)),
        (SLATE, (36, 38, 44)),
        (MOSS, (42, 72, 36)),
        (MOSSYBRICK, (86, 98, 72)),
        (WOOLRED, (150, 36, 36)),
        (WOOLGREEN, (32, 96, 40)),
        (PLANKS, (126, 88, 48)),
        (DSTILE, (40, 38, 42)),
    ],
    'skeleton': [
        (MOSSYBRICK, (96, 104, 84)),
        (STONE, (108, 106, 100)),
        (COBBLE, (82, 80, 74)),
        (STONEBRICK, (128, 124, 114)),
        (MOSS, (40, 78, 38)),
        (DEEPSLATE, (46, 46, 48)),
        (DSBRICK, (40, 40, 44)),
    ],
    'black-skeleton': [
        (BLACKSTONE, (36, 32, 32)),
        (OBSIDIAN, (16, 12, 22)),
        (DEEPSLATE, (44, 42, 48)),
        (DSBRICK, (50, 46, 50)),
        (HELLROCK, (64, 30, 24)),
        (DSTILE, (40, 36, 42)),
        (STONE, (70, 64, 62)),
        (MAGMA, (210, 78, 18)),
        (HELLBRICK, (80, 28, 22)),
    ],
}


# ---------------------------------------------------------------------------
# Camera (Three.js PerspectiveCamera: looks down -Z, +X right, +Y up)
# ---------------------------------------------------------------------------
def three_axes(eye, target, up=(0.0, 1.0, 0.0)):
    eye = np.asarray(eye, dtype=np.float64)
    target = np.asarray(target, dtype=np.float64)
    up = np.asarray(up, dtype=np.float64)
    z_axis = eye - target
    z_axis /= np.linalg.norm(z_axis) + 1e-12
    x_axis = np.cross(up, z_axis)
    x_axis /= np.linalg.norm(x_axis) + 1e-12
    y_axis = np.cross(z_axis, x_axis)
    return eye, x_axis, y_axis, z_axis


def camera_rays(eye, look, fov_v, W, H, us, vs):
    eye, x_axis, y_axis, z_axis = three_axes(eye, look)
    tan_v = math.tan(math.radians(fov_v) * 0.5)
    tan_h = tan_v * (W / float(H))
    ndc_x = (2.0 * (us + 0.5) / W - 1.0)
    ndc_y = (1.0 - 2.0 * (vs + 0.5) / H)
    dirs = (x_axis * (ndc_x * tan_h)[:, None]
            + y_axis * (ndc_y * tan_v)[:, None]
            - z_axis)
    dirs /= np.linalg.norm(dirs, axis=1, keepdims=True) + 1e-12
    return eye, dirs


def project_three(pts, eye, look, fov_v, W, H):
    eye, x_axis, y_axis, z_axis = three_axes(eye, look)
    rel = np.asarray(pts, dtype=np.float64) - eye
    cx = rel @ x_axis
    cy = rel @ y_axis
    z_fwd = -(rel @ z_axis)
    tan_v = math.tan(math.radians(fov_v) * 0.5)
    tan_h = tan_v * (W / float(H))
    sx = (cx / (np.clip(z_fwd, 1e-3, None) * tan_h) + 1.0) * 0.5 * W
    sy = (1.0 - cy / (np.clip(z_fwd, 1e-3, None) * tan_v)) * 0.5 * H
    return sx, sy, z_fwd


# ---------------------------------------------------------------------------
# Segmentation
# ---------------------------------------------------------------------------
def flood_from_border(like, max_y_frac=0.85):
    h, w = like.shape
    vis = np.zeros((h, w), dtype=bool)
    stack = []
    for x in range(w):
        if like[0, x]:
            stack.append((0, x))
            vis[0, x] = True
    for y in range(int(h * 0.5)):
        for x in (0, w - 1):
            if like[y, x] and not vis[y, x]:
                stack.append((y, x))
                vis[y, x] = True
    while stack:
        y, x = stack.pop()
        if y > h * max_y_frac:
            continue
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and (not vis[ny, nx]) and like[ny, nx]:
                vis[ny, nx] = True
                stack.append((ny, nx))
    return vis


def close_open(mask, close=5, open_=3):
    im = Image.fromarray(mask.astype(np.uint8) * 255, 'L')
    if close:
        im = im.filter(ImageFilter.MaxFilter(close)).filter(ImageFilter.MinFilter(close))
    if open_:
        im = im.filter(ImageFilter.MinFilter(open_)).filter(ImageFilter.MaxFilter(open_))
    return np.asarray(im) > 127


def largest_component(mask):
    num, lab, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    if num <= 1:
        return mask
    areas = stats[1:, cv2.CC_STAT_AREA]
    keep = 1 + int(np.argmax(areas))
    return lab == keep


def rembg_alpha(rgb, session, max_w=1920):
    h, w = rgb.shape[:2]
    scale = min(1.0, max_w / float(w))
    if scale < 1:
        small = cv2.resize(rgb, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    else:
        small = rgb
    from rembg import remove
    out = remove(Image.fromarray(small), session=session)
    a = np.asarray(out)[..., 3]
    if a.shape != (h, w):
        a = cv2.resize(a, (w, h), interpolation=cv2.INTER_LINEAR)
    return a.astype(np.float32) / 255.0


def sky_mask_clansman(rgb):
    a = rgb.astype(np.int16)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    sky_like = (r > 70) & (r > b + 15) & (r >= g - 5) & (g > 35) & ((r + g + b) > 180)
    sky_like |= (r > 90) & (r > b + 25) & (g > 40) & (g < 160)
    sky_like |= (r > 100) & (np.abs(r.astype(int) - g) < 40) & (b > 70) & (r > b)
    return flood_from_border(sky_like, 0.72)


def sky_mask_ruin(rgb, black=False):
    a = rgb.astype(np.int16)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    if black:
        sky_like = (r > 60) & (r > g + 10) & (r > b + 15)
        sky_like |= (r > 80) & (g < 80) & (b < 70)
    else:
        sky_like = (r > 50) & (r > b + 5) & (g > 25) & (g < 120)
        sky_like |= (r > 70) & (g > 30) & (b > 30) & (r > b)
        sky_like |= ((np.abs(r - g) < 20) & (np.abs(g - b) < 25) & (r > 55) & (r < 160) & (b > 40))
    return flood_from_border(sky_like, 0.78)


def edge_trees(rgb, sky, frac=0.12):
    h, w = sky.shape
    lum = rgb.astype(np.int16).sum(axis=2)
    dark = lum < 90
    trees = np.zeros((h, w), dtype=bool)
    trees[:, :int(w * frac)] = dark[:, :int(w * frac)]
    trees[:, int(w * (1 - frac)):] = dark[:, int(w * (1 - frac)):]
    trees &= ~sky
    # keep only components that touch the left/right border (the leafless trees)
    num, lab = cv2.connectedComponents(trees.astype(np.uint8), 8)
    keep = np.zeros(num, dtype=bool)
    if num > 1:
        border = np.unique(np.concatenate([lab[:, 0], lab[:, -1], lab[:, 1], lab[:, -2]]))
        keep[border] = True
        keep[0] = False
    return keep[lab] if num > 1 else trees


def keep_large_components(mask, min_frac=0.002, min_rel=0.12):
    """Keep every connected component that is big, not only the largest."""
    num, lab, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    if num <= 1:
        return mask
    areas = stats[1:, cv2.CC_STAT_AREA]
    biggest = float(areas.max())
    total = mask.size
    keep = np.zeros(num, dtype=bool)
    for i, a in enumerate(areas, start=1):
        if a >= min_frac * total or a >= min_rel * biggest:
            keep[i] = True
    return keep[lab]


def cut_terrain(sil, disp, kind):
    """Drop the closer hill under a ruin, keep the built silhouette."""
    h, w = sil.shape
    ys = np.arange(h)[:, None]
    tops = np.full(w, h, np.int32)
    for x in range(w):
        col = np.flatnonzero(sil[:, x])
        if col.size:
            tops[x] = int(col[0])
    valid = tops < h
    if not valid.any():
        return sil
    # Typical visible masonry height from the tallest (highest in frame) columns.
    q = np.percentile(tops[valid], 20)
    tall = valid & (tops <= q + 0.04 * h)
    # Built mass runs ~70-80% of the way down the frame under the keep tops.
    frac = 0.76 if kind == 'black-skeleton' else 0.78
    ref_h = float(np.median((frac * h) - tops[tall])) if tall.any() else 0.68 * h
    ref_h = max(0.48 * h, min(0.78 * h, ref_h))
    base = tops.astype(np.float64) + ref_h
    k = max(21, (w // 80) | 1)
    base_sm = cv2.GaussianBlur(base.astype(np.float32).reshape(1, -1), (k, 1), 0).ravel()
    cap = 0.82 * h if kind == 'black-skeleton' else 0.84 * h
    base_sm = np.clip(base_sm, 0, cap)
    castle = sil & (ys <= base_sm[None, :] + 0.01 * h)
    # Depth: lower pixels clearly closer than the facade are the slope.
    if disp is not None and castle.any():
        sure = castle & (ys < 0.48 * h)
        if sure.sum() > 200:
            p50, p90 = np.percentile(disp[sure], [50, 90])
            # Only the bottom band, and only when much closer than the facade —
            # the lower curtain is naturally a bit nearer and must be kept.
            closer = (disp > p90 + 0.25 * max(1e-3, p90 - p50)) & (ys > 0.76 * h)
            castle &= ~closer
    castle = close_open(castle, 5, 3)
    return keep_large_components(castle)


def mask_clansman(rgb, rembg_a):
    sky = sky_mask_clansman(rgb)
    a = rgb.astype(np.int16)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    h, w = r.shape
    lum = (r.astype(np.int16) + g + b) / 3.0
    chroma = np.maximum(np.abs(r - g), np.maximum(np.abs(g - b), np.abs(r - b)))
    trees = (g > r + 10) & (g > b + 6) & (g > 28) & (r < 75)
    heather = (r > g + 10) & (b > g - 8) & (r > 55) & (r < 190) & (g < 115) & (b > 40)
    heather[:int(h * 0.62)] = False
    loch = np.zeros((h, w), dtype=bool)
    ys, xs = slice(int(h * 0.45), h), slice(0, int(w * 0.42))
    loch[ys, xs] = (b[ys, xs] >= r[ys, xs] - 8) & (b[ys, xs] > 25) & (g[ys, xs] > 20) & (r[ys, xs] < 100)
    drop = sky | trees | heather | loch
    region = np.zeros((h, w), dtype=bool)
    region[int(h * 0.04):int(h * 0.76), int(w * 0.26):] = True
    # rembg at a higher threshold already drops the mid-ground pines and the
    # right forest, but misses the shadowed right wing. Use a stricter seed
    # on the left (in front of the gate, where the pines sit) and a looser
    # seed + masonry grow on the right wing / curtain.
    mid = int(0.50 * w)
    seed = np.zeros((h, w), dtype=bool)
    seed[:, :mid] = rembg_a[:, :mid] > 0.26
    seed[:, mid:] = rembg_a[:, mid:] > 0.08
    seed &= (~drop) & region
    seed[:, :int(w * 0.16)] = False
    masonry_ok = (chroma < 78) & (lum > 18) & (lum < 220) & region & (~drop)
    roof = (lum < 62) & (r < 80) & (g < 70) & region & (~sky)
    masonry_ok |= roof
    k = np.ones((3, 3), np.uint8)
    # Grow mostly on the right, where rembg alpha is weak; a few steps on the
    # left only to close masonry holes, not enough to crawl onto the pines.
    left, right = seed[:, :mid].copy(), seed[:, mid:].copy()
    mok_l, mok_r = masonry_ok[:, :mid], masonry_ok[:, mid:]
    for _ in range(6):
        dil = cv2.dilate(left.astype(np.uint8), k) > 0
        add = dil & mok_l & (~left)
        if not add.any():
            break
        left |= add
    for _ in range(50):
        dil = cv2.dilate(right.astype(np.uint8), k) > 0
        add = dil & mok_r & (~right)
        if not add.any():
            break
        right |= add
    seed[:, :mid] = left
    seed[:, mid:] = right
    banner = ((r > g + 25) & (r > 80) & (g < 95)) | ((g > r + 15) & (g > 48) & (r < 95) & (b < g))
    seed |= banner & region & (~drop)
    # Shadowed right curtain / turrets: flood remaining masonry in the right wing.
    right_box = np.zeros((h, w), dtype=bool)
    right_box[int(0.10 * h):int(0.76 * h), int(0.58 * w):int(0.96 * w)] = True
    k3 = np.ones((3, 3), np.uint8)
    addable = (masonry_ok | banner | roof) & right_box & (~drop)
    for _ in range(40):
        dil = cv2.dilate(seed.astype(np.uint8), k3) > 0
        add = dil & addable & (~seed)
        if not add.any():
            break
        seed |= add
    # Drop thin pine spikes (tall, narrow components) above the right curtain
    # and in front of the left terrace, without cutting turret roofs.
    def drop_thin_spikes(mask, x0, x1, max_w_frac=0.032, min_aspect=1.8, y_max_frac=0.55):
        roi = np.zeros_like(mask)
        roi[:int(y_max_frac * h), x0:x1] = mask[:int(y_max_frac * h), x0:x1]
        num, lab, stats, _ = cv2.connectedComponentsWithStats(roi.astype(np.uint8), 8)
        out = mask.copy()
        for i in range(1, num):
            ww = stats[i, cv2.CC_STAT_WIDTH]
            hh = stats[i, cv2.CC_STAT_HEIGHT]
            if ww < max_w_frac * w and hh > min_aspect * max(1, ww):
                out[lab == i] = False
        return out
    seed = drop_thin_spikes(seed, int(0.72 * w), w, max_w_frac=0.030, min_aspect=1.6, y_max_frac=0.50)
    seed = drop_thin_spikes(seed, int(0.26 * w), int(0.48 * w), max_w_frac=0.028, min_aspect=1.7, y_max_frac=0.52)
    seed[:, :int(w * 0.16)] = False
    seed[int(h * 0.78):] = False
    castle = close_open(seed, 9, 3)
    castle = keep_large_components(castle, min_frac=0.004, min_rel=0.15)
    return castle, dict(sky=sky, trees=trees, heather=heather)


def mask_ruin(rgb, disp, kind):
    black = kind == 'black-skeleton'
    sky = sky_mask_ruin(rgb, black=black)
    trees = edge_trees(rgb, sky, frac=0.115)
    sil = close_open((~sky) & (~trees), 5, 3)
    sil = largest_component(sil)
    castle = cut_terrain(sil, disp, kind)
    # Side trees can still attach at the ankles — drop far sides below mid.
    h, w = castle.shape
    if black:
        castle[:, :int(w * 0.07)] = False
        castle[:, int(w * 0.93):] = False
    else:
        castle[:, :int(w * 0.08)] = False
        castle[:, int(w * 0.92):] = False
    castle = keep_large_components(close_open(castle, 3, 3), min_frac=0.004, min_rel=0.08)
    return castle, dict(sky=sky, trees=trees, sil=sil)


# ---------------------------------------------------------------------------
# Depth
# ---------------------------------------------------------------------------
def depth_anything(rgb, session):
    """Relative disparity, larger = nearer. Short side 518, multiples of 14."""
    h, w = rgb.shape[:2]
    short = 518
    if h < w:
        nh = short
        nw = int(round(w * short / h / 14) * 14)
        nw = max(nw, short)
    else:
        nw = short
        nh = int(round(h * short / w / 14) * 14)
        nh = max(nh, short)
    img = rgb.astype(np.float64) / 255.0
    img = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_CUBIC)
    mean = np.array([0.485, 0.456, 0.406], np.float64)
    std = np.array([0.229, 0.224, 0.225], np.float64)
    x = ((img - mean) / std).astype(np.float32).transpose(2, 0, 1)[None]
    disp = session.run(None, {session.get_inputs()[0].name: x})[0][0]
    disp = cv2.resize(disp, (w, h), interpolation=cv2.INTER_LINEAR)
    return disp.astype(np.float32)


def metric_t(disp, mask, t_med, span=DEPTH_SPAN):
    """Affine disparity → ray length, pinned so the median facade is at t_med.

    Depth Anything is a disparity (larger = nearer). We map the 5th..95th
    percentile of the castle to [t_med*(1+span), t_med*(1-span)].
    """
    d = disp[mask]
    lo, hi = np.percentile(d, [5, 95])
    dn = np.clip((disp - lo) / (hi - lo + 1e-6), 0.0, 1.0)
    t_near = t_med * (1.0 - span)
    t_far = t_med * (1.0 + span)
    # Use a disparity-like inverse around the median for a slightly more
    # physical falloff, then rescale so median(t) == t_med.
    t = t_far + (t_near - t_far) * dn
    med = float(np.median(t[mask]))
    if med > 1e-3:
        t = t * (t_med / med)
    return t.astype(np.float32)


# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------
def quantize(rgb, kind, y_frac=None, is_roof=None):
    pal = PALETTES[kind]
    ids = np.array([p[0] for p in pal], dtype=np.int32)
    cols = np.array([p[1] for p in pal], dtype=np.float32)
    pix = rgb.astype(np.float32)
    # slight Lab-ish weighting: more on R for lava, less on tiny chroma noise
    w = np.array([1.1, 1.0, 0.9], dtype=np.float32)
    dist = ((pix[:, None, :] - cols[None, :, :]) * w) ** 2
    d2 = dist.sum(axis=2)
    # Prefer slate on dark Clansman roof pixels near the top of the keep.
    if kind == 'clansman' and y_frac is not None:
        slate_i = next(i for i, p in enumerate(pal) if p[0] == SLATE)
        dark = pix.mean(axis=1) < 55
        top = y_frac < 0.42
        d2[dark & top, slate_i] *= 0.45
        # tartan: boost wool on saturated red/green mid-wall pixels
        red_i = next(i for i, p in enumerate(pal) if p[0] == WOOLRED)
        grn_i = next(i for i, p in enumerate(pal) if p[0] == WOOLGREEN)
        r, g, b = pix[:, 0], pix[:, 1], pix[:, 2]
        d2[(r > g + 30) & (r > 80) & (g < 90), red_i] *= 0.25
        d2[(g > r + 18) & (g > 50) & (r < 90), grn_i] *= 0.25
    if kind == 'black-skeleton':
        mag_i = next(i for i, p in enumerate(pal) if p[0] == MAGMA)
        r, g, b = pix[:, 0], pix[:, 1], pix[:, 2]
        lava = (r > 90) & (r > g + 25) & (r > b + 20)
        d2[lava, mag_i] *= 0.08
    return ids[np.argmin(d2, axis=1)]


# ---------------------------------------------------------------------------
# Voxelize
# ---------------------------------------------------------------------------
def voxelize(rgb, mask, t, kind, stride=1):
    cam = CAMERAS[kind]
    h, w = mask.shape
    ys, xs = np.where(mask)
    if stride > 1:
        keep = ((ys + xs) % stride) == 0
        ys, xs = ys[keep], xs[keep]
    eye, dirs = camera_rays(cam['eye'], cam['look'], cam['fov'], w, h,
                            xs.astype(np.float64), ys.astype(np.float64))
    tt = t[ys, xs].astype(np.float64)
    # Drop obviously wild depths (should already be clipped).
    ok = np.isfinite(tt) & (tt > 5) & (tt < 400)
    xs, ys, dirs, tt = xs[ok], ys[ok], dirs[ok], tt[ok]
    pts = eye[None, :] + dirs * tt[:, None]
    # Colour / id at those pixels
    bid = quantize(rgb[ys, xs], kind, y_frac=ys / float(h))

    # Extrude along the ray, behind the visible surface.
    thick = THICK[kind]
    chunks_p = [pts]
    chunks_b = [bid]
    for s in range(1, thick + 1):
        chunks_p.append(eye[None, :] + dirs * (tt + s)[:, None])
        chunks_b.append(bid)
    # A 1-voxel crust in front avoids holes when snapping.
    chunks_p.append(eye[None, :] + dirs * np.clip(tt - 1.0, 5, None)[:, None])
    chunks_b.append(bid)
    P = np.concatenate(chunks_p, axis=0)
    B = np.concatenate(chunks_b, axis=0)

    V = np.rint(P).astype(np.int32)
    # Reject outliers
    med = np.median(V, axis=0)
    keep = (np.abs(V[:, 0] - med[0]) < 180) & (V[:, 1] > med[1] - 80) & (V[:, 1] < med[1] + 160) \
        & (np.abs(V[:, 2] - med[2]) < 180)
    V, B = V[keep], B[keep]

    # First vote: last write wins is noisy; accumulate majority.
    # Shift to compact coordinates for a dense vote grid, then shift back.
    vmin = V.min(axis=0) - 2
    vmax = V.max(axis=0) + 2
    # Guard memory: if the AABB is huge, tighten to percentiles.
    if np.prod(vmax - vmin + 1) > 12_000_000:
        lo = np.percentile(V, 1, axis=0).astype(np.int32) - 4
        hi = np.percentile(V, 99, axis=0).astype(np.int32) + 4
        keep = np.all(V >= lo, axis=1) & np.all(V <= hi, axis=1)
        V, B = V[keep], B[keep]
        vmin = V.min(axis=0) - 2
        vmax = V.max(axis=0) + 2
    shape = tuple((vmax - vmin + 1).tolist())
    # Vote with a compact dict of counts per (voxel, bid) would be slow in
    # pure Python; use a single id volume + a count volume (first / majority
    # via running score).
    acc_id = np.zeros(shape, dtype=np.int32)
    acc_n = np.zeros(shape, dtype=np.int16)
    # majority: for speed, keep a running winner and count; collisions of
    # different ids just increment a score for the new id if it ties/wins.
    # Simpler: last-max by counting in a 4-D is too big. Two-pass: unique
    # bids, vote each.
    ix = (V - vmin[None, :]).astype(np.int32)
    # Order surface first (first chunk is the surface) so the visible face
    # colour is preferred when we write surface voxels first then only fill
    # empty cells for extrusion.
    n_surf = len(xs)  # surface votes (before extrusion copies)
    # We concatenated [surface, thick copies, front crust]. Surface is first.
    # Actually all chunks have the same length L = len(xs after ok).
    # After outlier drop, we can't split cleanly. Just majority-vote.

    bids_u = np.unique(B)
    # For each bid, count votes in a volume, then argmax.
    # Memory: shape might be ~120*100*80 = 1M, times n_ids ~12, fine.
    votes = np.zeros(shape + (len(bids_u),), dtype=np.int16)
    bid_index = {int(b): i for i, b in enumerate(bids_u)}
    # vectorized per id
    for b, j in bid_index.items():
        sel = B == b
        if not sel.any():
            continue
        p = ix[sel]
        np.add.at(votes[:, :, :, j], (p[:, 0], p[:, 1], p[:, 2]), 1)
    winner = np.argmax(votes, axis=3)
    total = votes.sum(axis=3)
    solid = total > 0
    ids_vol = np.zeros(shape, dtype=np.int32)
    ids_vol[solid] = bids_u[winner[solid]]

    # 3D close so ray-extrusion pillars become a watertight shell; new
    # cells take the majority neighbour id (fallback: a mid palette stone).
    try:
        from scipy.ndimage import binary_closing, generate_binary_structure
        st = generate_binary_structure(3, 2)
        closed = binary_closing(ids_vol > 0, structure=st, iterations=2)
        added = closed & (ids_vol == 0)
        if added.any():
            # pad and majority of existing ids in a 3x3x3
            pad = np.pad(ids_vol, 1)
            acc = np.zeros(ids_vol.shape, dtype=np.int32)
            cnt = np.zeros(ids_vol.shape, dtype=np.int16)
            for dx in range(3):
                for dy in range(3):
                    for dz in range(3):
                        sl = pad[dx:dx + ids_vol.shape[0], dy:dy + ids_vol.shape[1], dz:dz + ids_vol.shape[2]]
                        m = sl > 0
                        acc[m] += sl[m]
                        cnt[m] += 1
            fill = np.zeros_like(ids_vol)
            ok = cnt > 0
            fill[ok] = (acc[ok] / np.maximum(cnt[ok], 1)).astype(np.int32)
            # majority average may land between ids; snap to nearest used id
            used = bids_u
            if used.size:
                # broadcast snap
                flat = fill[added]
                d = np.abs(flat[:, None] - used[None, :])
                fill[added] = used[np.argmin(d, axis=1)]
            default = int(used[len(used) // 2]) if used.size else STONE
            fill[added & (fill == 0)] = default
            ids_vol[added] = fill[added]
    except Exception as e:
        print('  3d-close skipped:', e, flush=True)

    # Align: gate x ≈ 0, gate floor y = 0, front stays near +z.
    # Use the original surface points (before rint/shift) to find the gate.
    return ids_vol, vmin, V, B, pts, bid, xs, ys


def align_and_fill(ids_vol, vmin, kind, surf_pts):
    """Shift so the gate is at x=0, floor y=0; mirror the unseen back."""
    solid = ids_vol > 0
    ys, xs, zs = None, None, None  # silence lints
    coords = np.argwhere(solid)  # (n, 3) in ix, iy, iz
    world = coords + vmin[None, :]
    wx, wy, wz = world[:, 0], world[:, 1], world[:, 2]

    # Floor: 5th percentile of Y of the lower front third (gate threshold).
    z_front = np.percentile(wz, 85)
    front = wz >= z_front - 8
    y_floor = int(np.percentile(wy[front] if front.any() else wy, 8))
    # Gate X: median X of the lowest front voxels (the threshold / door).
    low = front & (wy <= y_floor + 8)
    x_gate = int(np.round(np.median(wx[low] if low.any() else wx)))

    # Apply shift in the volume by changing vmin (world = index + vmin).
    # We want world' = world - (x_gate, y_floor, 0), i.e. vmin' = vmin - shift.
    shift = np.array([x_gate, y_floor, 0], dtype=np.int32)
    vmin = vmin - shift
    # surf_pts also shift
    surf_pts = np.asarray(surf_pts, dtype=np.float64) - shift[None, :]

    # Mirror across x=0 (the gate / keep centre). Copy into empty cells only,
    # and only toward the back half so unique visible facade detail stays.
    # After shift, x=0 is the gate. Grow the volume if the mirror falls outside.
    ix, iy, iz = np.indices(ids_vol.shape, dtype=np.int32)
    world_x = ix + vmin[0]
    world_z = iz + vmin[2]
    z_mid = int(np.median(wz - shift[2]))
    src_id = ids_vol
    # Mirror destination indices: world_x' = -world_x => ix' = -world_x - vmin[0]
    dest_ix = (-world_x) - vmin[0]
    inb = (dest_ix >= 0) & (dest_ix < ids_vol.shape[0])
    # Only fill empty destination cells; prefer filling the back (smaller z,
    # since +z is the gate / camera side).
    back = world_z <= z_mid + 2
    copy_to = inb & back & (ids_vol[dest_ix.clip(0, ids_vol.shape[0] - 1), iy, iz] == 0) & (src_id > 0)
    # dest_ix was clipped for advanced indexing safety; recompute a clean mask.
    dest_ix_safe = dest_ix
    fill = inb & (src_id > 0)
    # Build a new volume that may need x-padding if the mirror sticks out.
    need_lo = int((0 + vmin[0]) - (ids_vol.shape[0] - 1 + vmin[0]))  # if x_max mirrored < x_min
    # Easier: compute all solid world coords, add mirrors, scatter into a new grid.
    coords = np.argwhere(ids_vol > 0)
    wld = coords + vmin[None, :]
    bids = ids_vol[ids_vol > 0]
    # Mirror of each voxel
    mir = wld.copy()
    mir[:, 0] = -mir[:, 0]
    # Keep originals always; add mirrors that don't collide and are not in front
    # of an existing unique voxel at the same (y,z) with a different x on the
    # visible side. Rule: if the destination is empty, fill it.
    occ = {}
    for (x, y, z), b in zip(wld, bids):
        occ[(int(x), int(y), int(z))] = int(b)
    z_mid = int(np.median(wld[:, 2]))
    for (x, y, z), b in zip(mir, bids):
        key = (int(x), int(y), int(z))
        if key in occ:
            continue
        # Don't invent a mirrored copy in the extreme front (+z) where the
        # camera already sees unique geometry.
        if z > z_mid + 6:
            continue
        occ[key] = int(b)

    xs = [k[0] for k in occ]
    ys = [k[1] for k in occ]
    zs = [k[2] for k in occ]
    x0, x1 = min(xs) - 4, max(xs) + 4
    y0, y1 = min(ys) - 1, max(ys) + 2
    z0, z1 = min(zs) - 4, max(zs) + 4
    # Clamp height so stamping stays under the sky (H=192, site gy≈46).
    if y1 > 140:
        # drop the very top outliers rather than clipping the keep mid-air
        y_cut = 140
        occ = {k: v for k, v in occ.items() if k[1] <= y_cut}
        ys = [k[1] for k in occ]
        y1 = max(ys) + 2
    g = Grid(x0, x1, y0, y1, z0, z1)
    for (x, y, z), b in occ.items():
        if b:
            g.set(x, y, z, b)
    return g, surf_pts, shift


# ---------------------------------------------------------------------------
# Interiors
# ---------------------------------------------------------------------------
def _col_range(g, x, z):
    ylo, yhi = None, None
    for y in range(g.oy, g.oy + g.sy):
        if g.get(x, y, z):
            if ylo is None:
                ylo = y
            yhi = y
    return ylo, yhi


def _clear(g, x0, y0, z0, x1, y1, z1):
    for x in range(min(x0, x1), max(x0, x1) + 1):
        for y in range(min(y0, y1), max(y0, y1) + 1):
            for z in range(min(z0, z1), max(z0, z1) + 1):
                g.set0(x, y, z)


def _fill(g, x0, y0, z0, x1, y1, z1, bid):
    for x in range(min(x0, x1), max(x0, x1) + 1):
        for y in range(min(y0, y1), max(y0, y1) + 1):
            for z in range(min(z0, z1), max(z0, z1) + 1):
                if not g.get(x, y, z):
                    g.set(x, y, z, bid)


def _floor_pal(kind):
    if kind == 'black-skeleton':
        return BLACKSTONE
    if kind == 'skeleton':
        return MOSSYBRICK
    return STONEBRICK


def carve_interiors(g, kind):
    """Re-carve a gate passage, hall, wall-walk and stairs into the shell."""
    x0, y0, z0, x1, y1, z1 = g.bounds_used()
    pal = _floor_pal(kind)
    # Front is +z (gate). Find the front wall's z at x≈0 near the floor.
    def solid_z(x, y):
        zs = [z for z in range(z0, z1 + 1) if g.get(x, y, z)]
        return zs

    # Gate passage: 5 wide, 5 high, through the front wall at x=0, y=1..5.
    gate_w, gate_h = 5, 5
    # Find front-most solid z near the origin at y=2.
    front_z = z1
    for z in range(z1, z0 - 1, -1):
        if any(g.get(x, y, z) for x in range(-2, 3) for y in range(1, 6)):
            front_z = z
            break
    # How deep is the front wall along z at the gate?
    depth = 0
    z = front_z
    while z >= z0 and any(g.get(x, 2, z) for x in range(-2, 3)):
        depth += 1
        z -= 1
        if depth > 30:
            break
    passage_to = front_z - max(8, min(depth + 6, 22))
    _clear(g, -gate_w // 2, 1, passage_to, gate_w // 2, gate_h, front_z + 1)
    # Keep a 1-block sill / threshold at y=0 and a portcullis hint at the mouth.
    _fill(g, -gate_w // 2, 0, passage_to, gate_w // 2, 0, front_z, pal)
    for x in range(-gate_w // 2, gate_w // 2 + 1):
        for y in range(1, gate_h + 1):
            if x % 2 == 0:
                g.set(x, y, front_z, BARS)

    # Hall: behind the front wall, centred on x=0.
    hall_z1 = passage_to + 1
    hall_z0 = max(z0 + 3, hall_z1 - max(16, (z1 - z0) // 3))
    hall_x0 = max(x0 + 3, -max(8, (x1 - x0) // 6))
    hall_x1 = min(x1 - 3, max(8, (x1 - x0) // 6))
    hall_h = 10 if kind == 'clansman' else 8
    # Ceiling must stay under the shell; shrink if the keep is short.
    mid_z = (hall_z0 + hall_z1) // 2
    col_hi = []
    for x in range(hall_x0, hall_x1 + 1):
        _, yhi = _col_range(g, x, mid_z)
        if yhi is not None:
            col_hi.append(yhi)
    if col_hi:
        hall_h = max(6, min(hall_h, int(np.percentile(col_hi, 40)) - 3))
    _clear(g, hall_x0, 1, hall_z0, hall_x1, hall_h, hall_z1)
    _fill(g, hall_x0, 0, hall_z0, hall_x1, 0, hall_z1, pal)
    # Open the passage into the hall.
    _clear(g, -gate_w // 2, 1, hall_z1, gate_w // 2, gate_h, hall_z1)
    # A couple of lamps / chests (specials); leave air under them.
    g.mark('chest', x=0, y=1, z=hall_z0 + 2, face='+z', loot='hall' if kind == 'clansman' else 'ruin')
    g.mark('lamp', x=hall_x0 + 2, y=min(6, hall_h - 1), z=mid_z)
    g.mark('lamp', x=hall_x1 - 2, y=min(6, hall_h - 1), z=mid_z)
    g.mark('garrison', x=-3 if kind == 'clansman' else 0, y=1, z=mid_z,
           role='hall' if kind == 'clansman' else 'ruin')
    if kind == 'clansman':
        g.mark('garrison', x=3, y=1, z=mid_z, role='hall')
        g.mark('chest', x=hall_x0 + 2, y=1, z=mid_z, face='+x', loot='treasury')
    if kind == 'black-skeleton':
        g.mark('blackPortal', x=hall_x0 + 3, y=1, z=hall_z0 + 3)
    g.mark('camera', name='hall',
           x=0, y=4, z=hall_z1 - 1,
           lx=0, ly=6, lz=hall_z0 + 2, fov=60 if kind == 'clansman' else 70)

    # Wall-walk: a 3-wide walk on the front curtain, under the merlons.
    # Find a typical top of the front wall (not the keep spires).
    front_band = []
    for x in range(x0 + 2, x1 - 1):
        for z in range(front_z - 6, front_z + 1):
            _, yhi = _col_range(g, x, z)
            if yhi is not None:
                front_band.append(yhi)
    if front_band:
        # Sit the walk on the curtain (mid-height of the keep), not on the
        # foundation shelf that dominates the front-band histogram.
        ww_y = max(hall_h + 8, min(int(0.52 * y1), y1 - 12))
        # Walk just behind the outer shell — never punch the visible front face.
        _clear(g, hall_x0 - 2, ww_y, front_z - 8, hall_x1 + 2, ww_y + 3, front_z - 4)
        _fill(g, hall_x0 - 2, ww_y - 1, front_z - 8, hall_x1 + 2, ww_y - 1, front_z - 4, pal)
        g.mark('camera', name='wallwalk',
               x=0, y=ww_y + 3, z=front_z + 2,
               lx=0, ly=ww_y + 2, lz=front_z - 8, fov=70)
    else:
        ww_y = hall_h + 4

    # Stairs: straight flight along the right side of the hall, up to the walk.
    sx = hall_x1 - 2
    n_steps = max(3, ww_y - 1)
    # Need a shaft: clear a 3-wide well and place steps (z decreases as y rises,
    # climbing toward the front wall-walk).
    stair_z = hall_z1 - 3
    for i in range(n_steps):
        y = 1 + i
        z = stair_z - i
        if y >= ww_y:
            break
        _clear(g, sx - 1, y, z - 1, sx + 1, y + 4, z + 1)
        _fill(g, sx - 1, y, z, sx + 1, y, z, pal)
    g.mark('camera', name='towerstair' if kind != 'clansman' else 'towerstair-keep',
           x=sx, y=min(ww_y - 2, 1 + n_steps // 2 + 2), z=stair_z - n_steps // 2,
           lx=sx, ly=min(ww_y - 2, 1 + n_steps // 2 + 4), lz=stair_z - n_steps // 2 - 2,
           fov=70)

    # A second spiral-ish well in a thick corner if the keep is wide enough,
    # so upper floors stay reachable if the straight flight is tight.
    cx, cz = hall_x0 + 3, hall_z0 + 3
    for y in range(1, ww_y + 1):
        # 2x2 well
        _clear(g, cx, y, cz, cx + 1, y, cz + 1)
        # step around the well
        step = y % 4
        if step == 0:
            g.set(cx + 2, y, cz, pal)
        elif step == 1:
            g.set(cx + 1, y, cz + 2, pal)
        elif step == 2:
            g.set(cx - 1, y, cz + 1, pal)
        else:
            g.set(cx, y, cz - 1, pal)

    # Door at the gate inner face (kit places T.DOOR).
    g.mark('door', x=0, y=1, z=front_z - 2, face='+z')

    return dict(front_z=front_z, hall=(hall_x0, 1, hall_z0, hall_x1, hall_h, hall_z1),
                ww_y=ww_y, y1=y1, x0=x0, x1=x1, z0=z0, z1=z1)


def mark_cameras(g, kind, shift=(0, 0, 0)):
    """Hero cameras live in the same local frame as the voxels. After we
    translate the keep so the gate floor is y=0, translate the cameras too
    so the matched ref view is unchanged."""
    sx, sy, sz = int(shift[0]), int(shift[1]), int(shift[2])
    cam = CAMERAS[kind]
    e, l, fov = cam['eye'], cam['look'], cam['fov']
    g.mark('camera', name='hero',
           x=e[0] - sx, y=e[1] - sy, z=e[2] - sz,
           lx=l[0] - sx, ly=l[1] - sy, lz=l[2] - sz, fov=fov)
    if kind == 'clansman':
        g.mark('camera', name='hero-wide',
               x=22 - sx, y=14 - sy, z=72 - sz,
               lx=6 - sx, ly=34 - sy, lz=6 - sz, fov=55)
        g.mark('gold', x=14 - sx, y=0, z=-16 - sz)
    else:
        g.mark('camera', name='hero-wide',
               x=6 - sx, y=22 - sy, z=170 - sz,
               lx=8 - sx, ly=42 - sy, lz=4 - sz, fov=50)
        g.mark('kind', name='mossy' if kind == 'skeleton' else 'black')


# ---------------------------------------------------------------------------
# Preview + pack
# ---------------------------------------------------------------------------
def splat_preview(g, kind, w=1920, h=1080, bg=None, eye=None, look=None, fov=None):
    cam = CAMERAS[kind]
    eye = cam['eye'] if eye is None else eye
    look = cam['look'] if look is None else look
    fov = cam['fov'] if fov is None else fov
    blocks = list(g.iter_blocks())
    if not blocks:
        return np.zeros((h, w, 3), dtype=np.uint8), np.zeros((h, w), dtype=np.uint8)
    pts = np.array([(x + 0.5, y + 0.5, z + 0.5) for x, y, z, _ in blocks], dtype=np.float64)
    bids = np.array([b for *_, b in blocks], dtype=np.int32)
    sx, sy, zf = project_three(pts, eye, look, fov, w, h)
    img = np.zeros((h, w, 3), dtype=np.uint8)
    img[:] = bg if bg is not None else (28, 18, 22)
    zbuf = np.full((h, w), 1e9, dtype=np.float32)
    mask = np.zeros((h, w), dtype=np.uint8)
    from render_sil import COLOUR
    tan_v = math.tan(math.radians(fov) * 0.5)
    # half-size of one voxel in pixels at a given depth
    def half_px(z):
        return max(1, int(round(0.5 * h / (tan_v * max(z, 1.0)))))
    # Paint far-to-near so a cheap overwrite works, then z-test within a box.
    order = np.argsort(-zf)
    for i in order:
        if zf[i] < 0.5:
            continue
        u = int(round(sx[i]))
        v = int(round(sy[i]))
        r = half_px(zf[i])
        x0, x1 = max(0, u - r), min(w, u + r + 1)
        y0, y1 = max(0, v - r), min(h, v + r + 1)
        if x0 >= x1 or y0 >= y1:
            continue
        sl = zbuf[y0:y1, x0:x1]
        closer = zf[i] < sl
        if not closer.any():
            continue
        sl[closer] = zf[i]
        col = COLOUR.get(int(bids[i]), (140, 140, 140))
        img[y0:y1, x0:x1][closer] = col
        mask[y0:y1, x0:x1][closer] = 1
    return img, mask


def specials_jsonable(spec):
    out = {}
    for k, v in spec.items():
        rows = []
        for item in v:
            row = {}
            for kk, vv in item.items():
                if isinstance(vv, (int, float, str, bool)) or vv is None:
                    row[kk] = vv
                else:
                    row[kk] = str(vv)
            rows.append(row)
        out[k] = rows
    return out


def write_bin(path, raw, spec, stats):
    js = json.dumps({'specials': spec, 'stats': stats}, separators=(',', ':')).encode('utf-8')
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(raw + js + struct.pack('<I', len(js)) + b'JS13')
    return path


def colorize_depth(disp, mask):
    d = disp.copy()
    lo, hi = np.percentile(d[mask] if mask.any() else d, [2, 98])
    n = np.clip((d - lo) / (hi - lo + 1e-6), 0, 1)
    cm = cv2.applyColorMap((n * 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
    vis = cv2.cvtColor(cm, cv2.COLOR_BGR2RGB)
    out = (np.zeros_like(vis) if False else (np.zeros_like(vis)))
    # show on mask only
    base = np.zeros_like(vis)
    base[mask] = vis[mask]
    return base


def overlay(rgb, mask, color=(0, 255, 80), a=0.45):
    out = rgb.copy()
    tint = np.zeros_like(out)
    tint[mask] = color
    out = (out * (1 - a) + tint * a).astype(np.uint8)
    out[~mask] = (out[~mask] * 0.45).astype(np.uint8)
    return out


# ---------------------------------------------------------------------------
# Pipeline per castle
# ---------------------------------------------------------------------------
def load_sessions():
    import onnxruntime as ort
    from rembg import new_session
    print('loading rembg isnet-general-use...', flush=True)
    seg = new_session('isnet-general-use')
    print('loading Depth Anything V2 Small ONNX...', flush=True)
    if not DEPTH_ONNX.exists():
        raise SystemExit(f'depth model missing: {DEPTH_ONNX}')
    depth = ort.InferenceSession(str(DEPTH_ONNX), providers=['CPUExecutionProvider'])
    return seg, depth


def process_kind(kind, seg_s, depth_s, stride=1, skip_bin=False):
    t0 = time.time()
    ref_path = REFS / f'{kind}.jpg'
    rgb = np.asarray(Image.open(ref_path).convert('RGB'))
    h, w = rgb.shape[:2]
    print(f'=== {kind}  {w}x{h}', flush=True)

    print('  depth...', flush=True)
    disp = depth_anything(rgb, depth_s)

    print('  mask...', flush=True)
    if kind == 'clansman':
        alpha = rembg_alpha(rgb, seg_s, max_w=1920)
        castle, parts = mask_clansman(rgb, alpha)
    else:
        alpha = None
        castle, parts = mask_ruin(rgb, disp, kind)
    print(f'  mask frac={castle.mean():.4f}  px={int(castle.sum())}', flush=True)

    # Save debug
    (QA / 'debug').mkdir(parents=True, exist_ok=True)
    (QA / 'masks').mkdir(parents=True, exist_ok=True)
    (QA / 'depth').mkdir(parents=True, exist_ok=True)
    Image.fromarray((castle * 255).astype(np.uint8)).resize((1920, 1080)).save(QA / 'masks' / f'{kind}-castle.png')
    Image.fromarray(overlay(rgb, castle)).resize((1920, 1080), Image.Resampling.LANCZOS)\
        .save(QA / 'debug' / f'{kind}-mask-overlay.jpg', quality=92)
    vis = (rgb * 0.25).astype(np.uint8)
    dep = colorize_depth(disp, castle)
    vis[castle] = dep[castle]
    Image.fromarray(vis).resize((1920, 1080), Image.Resampling.LANCZOS)\
        .save(QA / 'depth' / f'{kind}-depth.jpg', quality=92)
    np.savez_compressed(QA / 'masks' / f'{kind}-data.npz', castle=castle, disp=disp)

    if skip_bin:
        return None

    # Metric depth
    cam = CAMERAS[kind]
    tgt = np.array(TARGET[kind], dtype=np.float64)
    t_med = float(np.linalg.norm(np.array(cam['eye']) - tgt))
    t = metric_t(disp, castle, t_med)
    print(f'  t_med target={t_med:.1f}  t[mask] med={float(np.median(t[castle])):.1f}  '
          f'p10={float(np.percentile(t[castle], 10)):.1f} p90={float(np.percentile(t[castle], 90)):.1f}',
          flush=True)

    print('  back-project...', flush=True)
    ids_vol, vmin, V, B, surf_pts, surf_bid, u, v = voxelize(rgb, castle, t, kind, stride=stride)
    print(f'  volume {ids_vol.shape} vmin={vmin.tolist()} solids={int((ids_vol>0).sum())}', flush=True)

    print('  align + mirror...', flush=True)
    # surf_pts are the first-chunk (visible surface) points, pre-extrusion.
    # voxelize returns all-chunk pts in `pts`; pass only the unique surface.
    # We returned `pts` as the surface (first chunk) — yes, `pts` is surface only.
    g, _, shift = align_and_fill(ids_vol, vmin, kind, surf_pts)
    print(f'  shift (x_gate,y_floor,0)={shift.tolist()}', flush=True)
    used = g.bounds_used()
    print(f'  aligned aabb={used} blocks={g.count()}', flush=True)

    print('  interiors...', flush=True)
    info = carve_interiors(g, kind)
    mark_cameras(g, kind, shift)
    print(f'  after carve blocks={g.count()} interiors={info}', flush=True)

    raw, spec, stats = pack_rle(g)
    spec = specials_jsonable(spec)
    bin_path = ASSETS / f'{kind}.bin'
    write_bin(bin_path, raw, spec, stats)
    print(f'  wrote {bin_path}  {bin_path.stat().st_size}B  {stats}', flush=True)

    # Offline silhouette vs the castle mask (same camera, Three.js convention).
    print('  preview splat...', flush=True)
    # Splat at the ref resolution so IoU is direct (then also 1920 for sheets).
    # Use the translated hero camera (same as in-game specials).
    hx = CAMERAS[kind]['eye'][0] - int(shift[0])
    hy = CAMERAS[kind]['eye'][1] - int(shift[1])
    hz = CAMERAS[kind]['eye'][2] - int(shift[2])
    lx = CAMERAS[kind]['look'][0] - int(shift[0])
    ly = CAMERAS[kind]['look'][1] - int(shift[1])
    lz = CAMERAS[kind]['look'][2] - int(shift[2])
    prev, pmask = splat_preview(g, kind, w=w, h=h, bg=None,
                                eye=(hx, hy, hz), look=(lx, ly, lz),
                                fov=CAMERAS[kind]['fov'])
    iou = float(np.logical_and(pmask > 0, castle).sum() / max(1, np.logical_or(pmask > 0, castle).sum()))
    print(f'  offline castle-only IoU={iou:.3f}', flush=True)
    (QA / 'renders').mkdir(parents=True, exist_ok=True)
    # Composite preview on a dim ref for eyeballing
    dim = (rgb * 0.35).astype(np.uint8)
    overlayed = dim.copy()
    m = pmask > 0
    overlayed[m] = (prev[m] * 0.75 + rgb[m] * 0.25).astype(np.uint8)
    Image.fromarray(prev).resize((1920, 1080), Image.Resampling.NEAREST)\
        .save(QA / 'renders' / f'{kind}-splat.png')
    Image.fromarray((pmask * 255).astype(np.uint8)).resize((1920, 1080), Image.Resampling.NEAREST)\
        .save(QA / 'renders' / f'{kind}-splat-mask.png')
    Image.fromarray(overlayed).resize((1920, 1080), Image.Resampling.LANCZOS)\
        .save(QA / 'renders' / f'{kind}-splat-on-ref.jpg', quality=92)
    # IoU overlay: green=match, red=ref only, blue=model only
    cmp = np.zeros_like(rgb)
    cmp[castle & (pmask > 0)] = (40, 200, 80)
    cmp[castle & (pmask == 0)] = (200, 40, 40)
    cmp[(~castle) & (pmask > 0)] = (40, 80, 220)
    Image.fromarray(cmp).resize((1920, 1080), Image.Resampling.NEAREST)\
        .save(QA / 'renders' / f'{kind}-iou-overlay.png')
    (QA / 'renders' / f'{kind}-offline.json').write_text(json.dumps({
        'kind': kind, 'iou': iou, 'stats': stats, 't_med': t_med,
        'mask_frac': float(castle.mean()), 'seconds': time.time() - t0,
    }, indent=2))
    print(f'  done {kind} in {time.time()-t0:.1f}s', flush=True)
    return dict(grid=g, stats=stats, spec=spec, iou=iou, path=str(bin_path))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--kind', choices=['clansman', 'skeleton', 'black-skeleton', 'all'], default='all')
    ap.add_argument('--stride', type=int, default=1)
    ap.add_argument('--masks-only', action='store_true')
    args = ap.parse_args()
    kinds = ['clansman', 'skeleton', 'black-skeleton'] if args.kind == 'all' else [args.kind]
    seg_s, depth_s = load_sessions()
    results = {}
    for kind in kinds:
        results[kind] = process_kind(kind, seg_s, depth_s, stride=args.stride, skip_bin=args.masks_only)
    print('ALL DONE', {k: (v.get('iou') if isinstance(v, dict) else v) for k, v in results.items()})


if __name__ == '__main__':
    main()
