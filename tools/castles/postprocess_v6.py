#!/usr/bin/env python3
"""Pass-6 architectural cleanup for image-driven castle voxels.

Denoise monocular depth, snap facades to planes / per-column dominant depth,
rebuild merlons and pointed caps as parametric shapes, drop floating voxels,
even out wall thickness, and punch clean arched openings.
"""
from __future__ import annotations

import math

import cv2
import numpy as np
from scipy import ndimage

# Imported lazily from voxelize_from_ref to avoid a cycle at module load.
THICK_DEFAULT = {'clansman': 10, 'skeleton': 12, 'black-skeleton': 12}


def denoise_depth(disp, mask):
    """Median + bilateral filter on disparity, applied inside the castle mask."""
    d = disp.astype(np.float32)
    out = d.copy()
    if not mask.any():
        return out
    lo = float(d[mask].min())
    hi = float(d[mask].max())
    scale = 255.0 / max(1e-6, hi - lo)
    u8 = np.clip((d - lo) * scale, 0, 255).astype(np.uint8)
    # OpenCV 5 medianBlur is 8U-only for ksize>5; stay in 8U then rescale.
    med = cv2.medianBlur(u8, 7)
    bil = cv2.bilateralFilter(u8, d=9, sigmaColor=22, sigmaSpace=9)
    med_f = med.astype(np.float32) / scale + lo
    rec = bil.astype(np.float32) / scale + lo
    # Weighted blend: bilateral + median dominate, keep a little of the original.
    mix = 0.15 * d + 0.45 * med_f + 0.40 * rec
    out[mask] = mix[mask]
    return out


def _height_profile(mask):
    h, w = mask.shape
    ys = np.where(mask, np.arange(h, dtype=np.int32)[:, None], h + 1)
    ye = np.where(mask, np.arange(h, dtype=np.int32)[:, None], -1)
    top = ys.min(axis=0)
    bot = ye.max(axis=0)
    valid = top < h
    return top, bot, valid


def _segments_from_profile(top, valid, min_gap=4, peak_prom=8):
    """Split the facade into curtain / tower x-intervals."""
    w = top.shape[0]
    xs = np.where(valid)[0]
    if xs.size == 0:
        return []
    # Continuous runs of the mask.
    runs = []
    a = int(xs[0])
    prev = a
    for x in xs[1:]:
        if x > prev + min_gap:
            runs.append((a, prev + 1))
            a = int(x)
        prev = int(x)
    runs.append((a, prev + 1))
    # Further split long runs at deep notches (tower / curtain boundaries).
    segs = []
    for x0, x1 in runs:
        if x1 - x0 < 8:
            segs.append((x0, x1, 'curtain'))
            continue
        t = top[x0:x1].astype(np.float32)
        # Smaller top-y = taller. Smooth, find local minima of top (peaks).
        k = max(5, ((x1 - x0) // 30) | 1)
        sm = cv2.GaussianBlur(t.reshape(1, -1), (k, 1), 0).ravel()
        # Notches are local maxima of top (dips in silhouette).
        splits = [0]
        for i in range(4, len(sm) - 4):
            if sm[i] >= sm[i - 1] and sm[i] >= sm[i + 1]:
                left = sm[max(0, i - 12):i].min()
                right = sm[i + 1:min(len(sm), i + 13)].min()
                if sm[i] - min(left, right) >= peak_prom:
                    splits.append(i)
        splits.append(len(sm))
        splits = sorted(set(splits))
        for a, b in zip(splits, splits[1:]):
            if b - a < 6:
                continue
            mid = sm[a:b].min()
            kind = 'tower' if (np.median(sm[a:b]) - mid) < 6 and (t[a:b].min() < np.median(t) - 6) else 'curtain'
            # Tall narrow = tower
            width = b - a
            height = (t.max() if t.size else 0) - t[a:b].min()  # noqa
            if width < 0.12 * w and t[a:b].min() < np.median(top[valid]) - 4:
                kind = 'tower'
            segs.append((x0 + a, x0 + b, kind))
    if not segs:
        segs = [(int(xs[0]), int(xs[-1]) + 1, 'curtain')]
    return segs


def _ransac_line(x, t, thresh, n_iter=48, rng=None):
    """Fit t = a + b x. Returns (a, b, inlier_mask) or None."""
    rng = rng or np.random.RandomState(7)
    n = x.size
    if n < 8:
        return None
    best_inl = None
    best_n = 0
    best_ab = None
    for _ in range(n_iter):
        i, j = rng.choice(n, 2, replace=False)
        if abs(x[i] - x[j]) < 1e-3:
            continue
        b = (t[j] - t[i]) / (x[j] - x[i])
        a = t[i] - b * x[i]
        err = np.abs(t - (a + b * x))
        inl = err <= thresh
        c = int(inl.sum())
        if c > best_n:
            best_n = c
            best_inl = inl
            best_ab = (a, b)
    if best_ab is None or best_n < max(8, int(0.35 * n)):
        # Fall back to a constant (median).
        a = float(np.median(t))
        return a, 0.0, np.abs(t - a) <= thresh
    # Refit on inliers.
    a, b = best_ab
    xin, tin = x[best_inl], t[best_inl]
    if xin.size >= 4 and (xin.max() - xin.min()) > 1:
        if (xin.max() - xin.min()) >= 8:
            b = float(np.polyfit(xin, tin, 1)[0])
            a = float(np.median(tin - b * xin))
        else:
            b = 0.0
            a = float(np.median(tin))
    return a, b, np.abs(t - (a + b * x)) <= thresh * 1.25


def snap_facade_planes(t, mask, kind, openings=None):
    """Reduce high-frequency depth noise on facades without flattening towers.

    A hard RANSAC snap onto one plane pulled every turret onto the curtain
    (v6 first pass dropped Clansman offline IoU 0.683 → 0.60 and shrank the
    keep). Instead: per-column dominant depth, clamp *small* residuals, and
    only softly blend curtain inliers toward a plane. Spires, merlons, deep
    recesses and openings are left alone.
    """
    t = t.astype(np.float32)
    out = t.copy()
    if not mask.any():
        return out
    h, w = mask.shape
    top, bot, valid = _height_profile(mask)
    segs = _segments_from_profile(top, valid)
    body = mask.copy()
    if openings is not None:
        body = body & (~openings)
    for x0, x1, skind in segs:
        col = body[:, x0:x1]
        if not col.any():
            continue
        if valid[x0:x1].any():
            seg_top = int(top[x0:x1][valid[x0:x1]].min())
            seg_bot = int(bot[x0:x1][valid[x0:x1]].max())
        else:
            continue
        span = max(8, seg_bot - seg_top)
        y_lo = seg_top + int(0.18 * span)
        y_hi = seg_bot - int(0.12 * span)
        col_med = np.full(x1 - x0, np.nan, np.float32)
        for i, x in enumerate(range(x0, x1)):
            sl = body[y_lo:y_hi + 1, x]
            if sl.any():
                col_med[i] = float(np.median(t[y_lo:y_hi + 1, x][sl]))
        if not np.isfinite(col_med).any():
            continue
        idx = np.arange(x1 - x0)
        good = np.isfinite(col_med)
        col_med = np.interp(idx, idx[good], col_med[good]).astype(np.float32)
        k = 5 if skind == 'curtain' else 3
        if col_med.size >= k:
            col_med = cv2.medianBlur(col_med.reshape(1, -1), k).ravel()
        plane = None
        if skind == 'curtain' and good.sum() >= 16:
            xx = (x0 + idx[good]).astype(np.float32)
            fit = _ransac_line(xx, col_med[good], thresh=1.4)
            if fit is not None:
                a, b, _ = fit
                if abs(b) < 0.08:  # reject a steep plane that would warp the wing
                    plane = a + b * np.arange(x0, x1, dtype=np.float32)
        # Noise threshold in world blocks. Larger jumps are real architecture.
        noise = 2.4 if skind == 'curtain' else 1.8
        for x in range(x0, x1):
            if not mask[:, x].any():
                continue
            target = float(col_med[x - x0])
            if plane is not None and skind == 'curtain':
                target = 0.55 * target + 0.45 * float(plane[x - x0])
            ys_c = np.where(mask[:, x])[0]
            for y in ys_c:
                if openings is not None and openings[y, x]:
                    continue
                if y < y_lo or y > y_hi:
                    continue  # leave caps and feet
                cur = t[y, x]
                res = cur - target
                if abs(res) <= noise:
                    # mostly snap, keep a little residual so the wall is not glass-flat
                    out[y, x] = target + 0.25 * res
                # else: keep the original depth (tower offset, gate recess, etc.)
    return out


def openings_mask(rgb, castle, kind):
    """Dark arched windows / gate openings inside the masonry, not lava.

    Require the pixel to be substantially darker than its local masonry
    neighbourhood so sunset shadows on a wall are not punched as windows.
    """
    pix = rgb.astype(np.float32)
    lum = pix.mean(axis=2)
    r, g, b = pix[:, :, 0], pix[:, :, 1], pix[:, :, 2]
    lava = (r > 140) & (g > 40) & (r > b + 40) & (r > g + 20)
    tartan = ((r > g + 40) & (r > 90)) | ((g > r + 25) & (g > 60))
    # Local masonry luminance (mask-aware blur).
    lum_m = lum.copy()
    lum_m[~castle] = 0
    blur = cv2.GaussianBlur(lum_m, (31, 31), 0)
    cnt = cv2.GaussianBlur(castle.astype(np.float32), (31, 31), 0)
    local = blur / np.maximum(cnt, 1e-3)
    rel = (local - lum) >= (28 if kind == 'clansman' else 22)
    if kind == 'clansman':
        dark = (lum < 55) & rel & castle & (~tartan)
    elif kind == 'black-skeleton':
        dark = (lum < 38) & rel & castle & (~lava)
    else:
        dark = (lum < 44) & rel & castle
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    dark_u = cv2.morphologyEx(dark.astype(np.uint8), cv2.MORPH_OPEN, k)
    dark_u = cv2.morphologyEx(dark_u, cv2.MORPH_CLOSE, k)
    n, lab, st, _ = cv2.connectedComponentsWithStats(dark_u, 8)
    out = np.zeros(castle.shape, np.uint8)
    h, w = castle.shape
    for i in range(1, n):
        area = int(st[i, cv2.CC_STAT_AREA])
        ww = int(st[i, cv2.CC_STAT_WIDTH])
        hh = int(st[i, cv2.CC_STAT_HEIGHT])
        if area < 80 or area > int(0.012 * h * w):
            continue
        if hh < 10 or ww < 5:
            continue
        if ww > 2.4 * hh or hh > 4.5 * ww:
            continue
        # Must be mostly surrounded by masonry (a real opening, not a bite).
        x0, y0 = int(st[i, cv2.CC_STAT_LEFT]), int(st[i, cv2.CC_STAT_TOP])
        pad = 4
        y0p, y1p = max(0, y0 - pad), min(h, y0 + hh + pad)
        x0p, x1p = max(0, x0 - pad), min(w, x0 + ww + pad)
        ring = castle[y0p:y1p, x0p:x1p].mean()
        if ring < 0.55:
            continue
        out[lab == i] = 1
    return out.astype(bool)


def sunset_albedo(rgb, kind=None):
    """Undo painted sunset so quantize sees weathered-stone albedo.

    Official refs are already lit by a warm low sun. Mapping those pixels
    straight to block ids makes the keep even darker once the merged 1.2.113
    sunset plate lights the mesh again. Mild inverse: lift exposure and
    divide out a warm illuminant. Lava / tartan should be detected on the
    original pixels before this is applied.
    """
    pix = rgb.astype(np.float32)
    # Milder than duskHor so blue does not explode in deep shadows.
    illum = np.array([1.00, 0.78, 0.60], np.float32)
    exposure = 0.62
    out = np.clip(pix / (illum * exposure), 0, 255)
    return out.astype(np.float32)


def frame_stats(mask):
    h, w = mask.shape
    if not mask.any():
        return dict(frac=0.0, bbox=[0, 0, 1, 1], size=[1, 1], com=[0.5, 0.5])
    ys, xs = np.where(mask)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    return dict(
        frac=float(mask.mean()),
        bbox=[float(x0 / w), float(y0 / h), float(x1 / w), float(y1 / h)],
        size=[float((x1 - x0 + 1) / w), float((y1 - y0 + 1) / h)],
        com=[float(xs.mean() / w), float(ys.mean() / h)],
    )


# ---------------------------------------------------------------------------
# Volume helpers
# ---------------------------------------------------------------------------
def as_vol(g):
    return np.frombuffer(g.a, dtype='<u2').reshape(g.sx, g.sy, g.sz)


def write_vol(g, vol):
    if vol.shape != (g.sx, g.sy, g.sz):
        raise ValueError(f'vol shape {vol.shape} != grid {(g.sx, g.sy, g.sz)}')
    g.a[:] = np.ascontiguousarray(vol.astype('<u2', copy=False)).tobytes()


def _default_stone(kind, fallback=1):
    try:
        from ids import STONE, STONEBRICK, BLACKSTONE, MOSSYBRICK, DEEPSLATE
    except Exception:
        return fallback
    if kind == 'black-skeleton':
        return BLACKSTONE
    if kind == 'skeleton':
        return MOSSYBRICK
    return STONEBRICK


def _slate_id(kind):
    try:
        from ids import SLATE, DEEPSLATE, BLACKSTONE
    except Exception:
        return 1
    if kind == 'black-skeleton':
        return BLACKSTONE
    if kind == 'skeleton':
        return DEEPSLATE
    return SLATE


def drop_floating(vol, min_size=48):
    """Keep large 26-connected components and anything sitting on the floor."""
    solid = vol > 0
    if not solid.any():
        return vol
    struct = ndimage.generate_binary_structure(3, 3)
    lab, n = ndimage.label(solid, structure=struct)
    if n == 0:
        return vol
    # Touch the lowest 3 Y layers (axis 1) = foundations / ground contact.
    floor_labels = set(np.unique(lab[:, :3, :]).tolist())
    floor_labels.discard(0)
    counts = np.bincount(lab.ravel())
    keep = np.zeros(n + 1, dtype=bool)
    keep[0] = False
    for i in range(1, n + 1):
        if i in floor_labels or counts[i] >= min_size:
            keep[i] = True
    # Always keep the biggest component.
    if counts.size > 1:
        keep[int(np.argmax(counts[1:]) + 1)] = True
    vol = vol.copy()
    vol[~keep[lab]] = 0
    return vol


def consistent_thickness(vol, kind, thick=None):
    """Hollow the mass to a consistent shell thickness from the exterior."""
    thick = int(thick or THICK_DEFAULT.get(kind, 10))
    solid = vol > 0
    if not solid.any():
        return vol
    empty = ~solid
    s6 = ndimage.generate_binary_structure(3, 1)
    lab, n = ndimage.label(empty, structure=s6)
    border = np.zeros(lab.shape, dtype=bool)
    border[0] = True
    border[-1] = True
    border[:, 0] = True
    border[:, -1] = True
    border[:, :, 0] = True
    border[:, :, -1] = True
    ext_ids = np.unique(lab[border])
    ext_ids = ext_ids[ext_ids != 0]
    if ext_ids.size == 0:
        return vol
    exterior = np.isin(lab, ext_ids)
    dist = ndimage.distance_transform_edt(~exterior)
    shell = solid & (dist <= (thick + 0.6))
    # Keep a shallow foundation slab so the stamp still sits on the land.
    shell[:, :3, :] |= solid[:, :3, :]
    out = vol.copy()
    out[~shell] = 0
    return out


def straighten_tower_edges(vol):
    """Trim 1-2 voxel jaggies on vertical shaft edges; do not fill the hull.

    An earlier majority-fill version added ~8k blocks and dropped IoU 0.03.
    """
    solid = vol > 0
    if not solid.any():
        return vol
    sx, sy, sz = solid.shape
    y_present = solid.any(axis=(0, 2))
    ys = np.where(y_present)[0]
    if ys.size < 8:
        return vol
    y0 = int(ys.min() + 0.28 * (ys.max() - ys.min()))
    y1 = int(ys.min() + 0.84 * (ys.max() - ys.min()))
    if y1 - y0 < 6:
        return vol
    out = vol.copy()
    left = np.full(sy, -1, np.int32)
    right = np.full(sy, -1, np.int32)
    front = np.full(sy, -1, np.int32)
    back = np.full(sy, -1, np.int32)
    for y in range(y0, y1 + 1):
        sl = solid[:, y, :]
        if not sl.any():
            continue
        xs = np.where(sl.any(axis=1))[0]
        zs = np.where(sl.any(axis=0))[0]
        left[y] = int(xs.min())
        right[y] = int(xs.max())
        back[y] = int(zs.min())
        front[y] = int(zs.max())
    def _median_edge(arr):
        v = arr[arr >= 0]
        return int(np.median(v)) if v.size else None
    ml = _median_edge(left)
    mr = _median_edge(right)
    mf = _median_edge(front)
    mb = _median_edge(back)
    if ml is None or mr is None or mf is None or mb is None:
        return vol
    for y in range(y0, y1 + 1):
        if left[y] < 0:
            continue
        # Only shave protrusions of 1-2 voxels outside the median outline.
        if 0 < left[y] - ml <= 2:
            out[ml:left[y], y, :] = 0
        if 0 < right[y] - mr <= 2:
            out[mr + 1:right[y] + 1, y, :] = 0
        if 0 < front[y] - mf <= 2:
            out[:, y, mf + 1:front[y] + 1] = 0
        if 0 < mb and 0 < back[y] and 0 < back[y] - mb <= 2:
            # back is min z; a jaggy closer to 0 than the median back
            pass
        if 0 < mb - back[y] <= 2:
            out[:, y, back[y]:mb] = 0
    return out


def _peaks_xz(hmap, min_h, size=7):
    """Local maxima of a (x,z) height map."""
    if not np.any(hmap >= min_h):
        return []
    mx = ndimage.maximum_filter(hmap, size=size)
    peaks = (hmap == mx) & (hmap >= min_h)
    # Suppress plateaus: keep one voxel per connected plateau.
    lab, n = ndimage.label(peaks)
    pts = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)  # here ys=x, xs=z
        # pick the cell with max height, then centroid
        hh = hmap[ys, xs]
        k = int(np.argmax(hh))
        pts.append((int(ys[k]), int(xs[k]), int(hh[k])))
    return pts


def rebuild_spires(vol, kind):
    """Replace lumpy peaks with clean pointed cones / pyramid caps."""
    solid = vol > 0
    if not solid.any():
        return vol
    sx, sy, sz = solid.shape
    # hmap[x,z] = highest solid y index, or -1
    hmap = np.max(np.where(solid, np.arange(sy)[None, :, None], -1), axis=1)
    finite = hmap >= 0
    if not finite.any():
        return vol
    y_max = int(hmap.max())
    y_min = int(hmap[finite].min())
    span = max(8, y_max - y_min)
    # Peaks in the upper 40% that are isolated (not a long merlon ridge).
    min_h = y_min + int(0.58 * span)
    peaks = _peaks_xz(hmap, min_h, size=9)
    bid_cap = _slate_id(kind)
    bid_shaft = _default_stone(kind)
    out = vol.copy()
    for px, pz, py in peaks:
        # Width of the shaft measured ~30% of the peak height down.
        measure_y = max(0, py - max(4, int(0.22 * span)))
        # Radius: solid cells at measure_y around the peak.
        rad = 1
        for rtry in range(2, 8):
            x0, x1 = max(0, px - rtry), min(sx, px + rtry + 1)
            z0, z1 = max(0, pz - rtry), min(sz, pz + rtry + 1)
            sl = solid[x0:x1, measure_y, z0:z1]
            if sl.size == 0 or sl.mean() < 0.45:
                rad = max(1, rtry - 1)
                break
            rad = rtry
        rad = min(rad, 5)
        # Skip long ridges (merlons): if the high band stays high for many X.
        ridge = (hmap[:, pz] >= py - 2).sum() if 0 <= pz < sz else 99
        if ridge > max(8, 3 * rad + 2):
            continue
        # Also skip if this is a flat merlon stretch in Z.
        ridge_z = (hmap[px, :] >= py - 2).sum() if 0 <= px < sx else 99
        if ridge_z > max(8, 3 * rad + 2):
            continue
        # Cap height from the shaft top.
        cap_h = max(4, min(18, py - measure_y + 1))
        # Clear the messy cap and rebuild a cone.
        for y in range(measure_y, min(sy, py + 3)):
            t = (y - measure_y) / max(1, cap_h)
            r = max(0.0, rad * (1.0 - t))
            r2 = (r + 0.55) ** 2
            x0, x1 = max(0, px - rad - 1), min(sx, px + rad + 2)
            z0, z1 = max(0, pz - rad - 1), min(sz, pz + rad + 2)
            for x in range(x0, x1):
                for z in range(z0, z1):
                    if (x - px) ** 2 + (z - pz) ** 2 <= r2:
                        if out[x, y, z] == 0 or y >= measure_y:
                            out[x, y, z] = bid_cap if t > 0.15 else (out[x, y, z] or bid_shaft)
                    elif y > measure_y:
                        # trim lumps outside the cone
                        out[x, y, z] = 0
        # Pointed tip
        tip_y = min(sy - 1, measure_y + cap_h)
        if 0 <= px < sx and 0 <= pz < sz:
            out[px, tip_y, pz] = bid_cap
    return out


def rebuild_merlons(vol, kind):
    """Rebuild crenellations on relatively flat curtain tops as clean merlons."""
    solid = vol > 0
    if not solid.any():
        return vol
    sx, sy, sz = solid.shape
    # Front is +z (high z). Work on the front skin of each x-column.
    front_z = np.max(np.where(solid, np.arange(sz)[None, None, :], -1), axis=2)  # (sx,sy) unused
    # Per-x: frontmost z of the top of the wall, and that top y.
    hmap_x = np.max(np.where(solid, np.arange(sy)[None, :, None], -1), axis=(1, 2))  # (sx,) max y any z
    # Better: along the front facade, for each x take the max y in the front 6 z.
    z_max = int(np.max(np.where(solid, np.arange(sz)[None, None, :], -1)))
    z_front0 = max(0, z_max - 7)
    front_band = solid[:, :, z_front0:]
    if not front_band.any():
        return vol
    top_y = np.max(np.where(front_band, np.arange(sy)[None, :, None], -1), axis=(1, 2))  # (sx,)
    # Walk-height = a robust low percentile of local tops on "flat" stretches.
    valid = top_y >= 0
    if valid.sum() < 12:
        return vol
    out = vol.copy()
    bid = _default_stone(kind)
    # Detect flat stretches: sliding window std of top_y is small and not a spire.
    tops = top_y.astype(np.float32)
    merlon_h = 3 if kind == 'clansman' else 4
    merlon_w = 2
    gap_w = 2 if kind == 'clansman' else 2
    period = merlon_w + gap_w
    i = 0
    while i < sx:
        if not valid[i]:
            i += 1
            continue
        j = i
        # Break at a notch (tower / curtain boundary) or a sudden height jump.
        while j + 1 < sx and valid[j + 1] and abs(int(tops[j + 1]) - int(tops[j])) <= 2:
            j += 1
        j += 1
        if j - i < 12:
            i = j
            continue
        sl = tops[i:j]
        # Skip spires, gables, and already-pointed tower caps.
        if sl.max() - sl.min() > 4 or float(sl.std()) > 1.8:
            i = j
            continue
        walk = int(np.percentile(sl, 30))
        # Don't build merlons on mid-keep roofs that are already pointed — only
        # when the top looks crenellated or flat-with-nubs.
        nubs = int((sl >= walk + 2).sum())
        if nubs == 0 and (sl.max() - walk) < 1:
            # still add a regular merlon run on a flat curtain, as the refs show them
            pass
        # Clear existing nubs above the walk in the front band, then stamp.
        for x in range(i, j):
            z0 = z_front0
            z1 = sz
            # find actual front z at this x around walk
            col = solid[x, max(0, walk - 2):walk + merlon_h + 2, z0:z1]
            if not col.any():
                continue
            # front z at walk
            fz = z0
            for z in range(z1 - 1, z0 - 1, -1):
                if out[x, walk, z] or (walk + 1 < sy and out[x, min(sy - 1, walk), z]):
                    fz = z
                    break
            # clear above walk in a 3-deep front crust
            for y in range(walk + 1, min(sy, walk + merlon_h + 3)):
                for z in range(max(0, fz - 3), min(sz, fz + 2)):
                    out[x, y, z] = 0
            # merlon or gap
            phase = (x - i) % period
            if phase < merlon_w:
                for y in range(walk + 1, min(sy, walk + 1 + merlon_h)):
                    for z in range(max(0, fz - 2), min(sz, fz + 1)):
                        if out[x, walk, z] or z <= fz:
                            out[x, y, z] = bid if out[x, y, z] == 0 else out[x, y, z]
                            if out[x, y, z] == 0:
                                out[x, y, z] = bid
                        # force fill merlon
                        out[x, y, z] = out[x, y, z] or bid
        i = j
    return out


def punch_arches(vol, openings, rgb, t, cam, shift, H, W, kind):
    """Carve clean arched openings through the front wall at masked pixels."""
    if openings is None or not openings.any():
        return vol
    from voxelize_from_ref import camera_rays  # local import
    solid = vol > 0
    if not solid.any():
        return vol
    sx, sy, sz = vol.shape
    # Grid origin is needed to map world -> indices. Caller passes a Grid-like
    # origin via shift already applied (world = index + origin). We receive
    # origin separately... We'll take origin from attributes later. Here we
    # expect the function to be called with a grid and we work in world space
    # inside postprocess_grid.
    return vol  # implemented in postprocess_grid where origin is known


def postprocess_grid(g, kind, rgb, castle, openings, cam, shift, t):
    """Run volume cleanup on an aligned Grid. Mutates and returns g."""
    vol = as_vol(g).copy()
    n0 = int((vol > 0).sum())
    vol = drop_floating(vol, min_size=64 if kind == 'clansman' else 80)
    vol = straighten_tower_edges(vol)
    vol = consistent_thickness(vol, kind)
    vol = rebuild_merlons(vol, kind)
    vol = rebuild_spires(vol, kind)
    vol = punch_arches_on_grid(g, vol, openings, t, cam, shift)
    vol = drop_floating(vol, min_size=48)
    write_vol(g, vol)
    n1 = int((vol > 0).sum())
    return dict(blocks_before=n0, blocks_after=n1, dropped=n0 - n1)


def punch_arches_on_grid(g, vol, openings, t, cam, shift):
    if openings is None or not np.any(openings):
        return vol
    # Import here to reuse the same camera model as the voxelizer.
    import sys
    from pathlib import Path
    here = Path(__file__).resolve().parent
    if str(here) not in sys.path:
        sys.path.insert(0, str(here))
    from voxelize_from_ref import camera_rays

    h, w = openings.shape
    ys, xs = np.where(openings)
    if ys.size == 0:
        return vol
    # Component-wise: one clean arch per opening.
    u8 = openings.astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(u8, 8)
    out = vol.copy()
    ox, oy, oz = g.ox, g.oy, g.oz
    sx, sy, sz = out.shape
    # shift already applied to the grid (world = index + origin). The camera
    # in CAMERAS is in pre-shift local space; convert eye/look by -shift.
    eye = np.array(cam['eye'], dtype=np.float64) - np.array(shift, dtype=np.float64)
    look = np.array(cam['look'], dtype=np.float64) - np.array(shift, dtype=np.float64)
    cam_s = dict(eye=tuple(eye.tolist()), look=tuple(look.tolist()), fov=cam['fov'])
    for i in range(1, n):
        area = int(st[i, cv2.CC_STAT_AREA])
        if area < 24:
            continue
        bx = int(st[i, cv2.CC_STAT_LEFT])
        by = int(st[i, cv2.CC_STAT_TOP])
        bw = int(st[i, cv2.CC_STAT_WIDTH])
        bh = int(st[i, cv2.CC_STAT_HEIGHT])
        # Representative pixel: centroid, with depth from the opening edge
        # (the wall), not the dark interior (which may be far).
        cy = by + bh // 2
        cx = bx + bw // 2
        # Sample t at the opening border (masonry just outside would be better;
        # use median t of the component, which was snapped to the wall plane
        # only at the edges — openings were excluded from the snap, so use a
        # ring around the bbox).
        y0 = max(0, by - 2)
        y1 = min(h, by + bh + 2)
        x0 = max(0, bx - 2)
        x1 = min(w, bx + bw + 2)
        ring = np.zeros((h, w), bool)
        ring[y0:y1, x0:x1] = True
        ring[by:by + bh, bx:bx + bw] = False
        ring &= (t > 0)
        if ring.any():
            t_wall = float(np.median(t[ring]))
        elif t[cy, cx] > 0:
            t_wall = float(t[cy, cx])
        else:
            continue
        # Back-project the bbox corners and centroid onto the wall (same t).
        us = np.array([cx, bx, bx + bw - 1, cx], dtype=np.float64)
        vs = np.array([cy, by, by + bh - 1, by], dtype=np.float64)
        eye_p, dirs = camera_rays(cam_s['eye'], cam_s['look'], cam_s['fov'], w, h, us, vs)
        pts = eye_p[None, :] + dirs * t_wall
        # World -> index
        ixs = np.round(pts[:, 0] - ox).astype(np.int32)
        iys = np.round(pts[:, 1] - oy).astype(np.int32)
        izs = np.round(pts[:, 2] - oz).astype(np.int32)
        # Arch in index space: x from left..right, y from sill..crown, z through wall.
        x_lo = int(np.clip(min(ixs[1], ixs[2]) - 1, 0, sx - 1))
        x_hi = int(np.clip(max(ixs[1], ixs[2]) + 1, 0, sx - 1))
        y_sill = int(np.clip(max(iys[0], iys[1], iys[2]) , 0, sy - 1))  # larger y is higher? y up, image y down so 'by' is crown (smaller image y) -> higher world y
        # pts[3] is the top-centre (by), pts[0] mid.
        y_crown = int(np.clip(iys[3], 0, sy - 1))
        y_mid = int(np.clip(iys[0], 0, sy - 1))
        y_lo = min(y_sill, y_crown, y_mid)
        y_hi = max(y_sill, y_crown, y_mid)
        # If the mapping flipped, ensure the opening has some height.
        if y_hi - y_lo < 3:
            y_lo = max(0, y_mid - max(2, bh // 8))
            y_hi = min(sy - 1, y_mid + max(2, bh // 8))
        z_c = int(np.clip(izs[0], 0, sz - 1))
        z0 = max(0, z_c - 6)
        z1 = min(sz - 1, z_c + 3)
        # Semicircle arch in the X-Y plane, rectangular jambs below the spring.
        width = max(2, x_hi - x_lo)
        height = max(3, y_hi - y_lo)
        spring = y_lo + int(0.55 * height)  # arch starts in the top ~45%
        cx_i = 0.5 * (x_lo + x_hi)
        rad = 0.5 * width
        for x in range(x_lo, x_hi + 1):
            for y in range(y_lo, y_hi + 1):
                if y <= spring:
                    inside = True
                else:
                    # semicircle from spring to crown
                    ny = (y - spring) / max(1e-3, (y_hi - spring))
                    nx = (x - cx_i) / max(1e-3, rad)
                    inside = (nx * nx + ny * ny) <= 1.05
                if not inside:
                    continue
                out[x, y, z0:z1 + 1] = 0
    return out
