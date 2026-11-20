"""Software renderer for castle voxel models: RGB + occupancy mask, perspective camera."""
from __future__ import annotations
import math
import numpy as np
from ids import *

# Distinct block colours (not lit yet — a simple sun term is applied per face)
COLOUR = {
    STONEBRICK: (168, 164, 156),
    COBBLE: (130, 126, 118),
    SLATE: (72, 74, 80),
    WSTONE: (190, 190, 184),
    MOSSYBRICK: (110, 124, 96),
    MOSS: (62, 98, 48),
    BLACKSTONE: (28, 26, 30),
    DSBRICK: (36, 34, 40),
    DSTILE: (42, 40, 48),
    OBSIDIAN: (16, 10, 28),
    HELLROCK: (70, 32, 24),
    MAGMA: (230, 90, 24),
    LAVA: (255, 140, 30),
    WOOLRED: (198, 40, 40),
    WOOLGREEN: (46, 125, 50),
    WOOLYELLOW: (220, 190, 60),
    WOOL: (230, 230, 230),
    PLANKS: (160, 118, 70),
    BARS: (70, 72, 76),
    FENCE: (110, 80, 44),
    PINE: (62, 44, 26),
    LOG: (86, 62, 36),
    COBWEB: (220, 220, 220),
    HEATHER: (150, 70, 150),
    GRASS: (80, 130, 60),
    DIRT: (120, 84, 52),
    STONE: (120, 120, 120),
    OAKST: (150, 110, 64),
    STST: (150, 150, 148),
}

FACE_N = [
    (1, 0, 0), (-1, 0, 0),
    (0, 1, 0), (0, -1, 0),
    (0, 0, 1), (0, 0, -1),
]
# 4 corners of each face, in block space (0..1)
FACE_V = [
    [(1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1)],
    [(0, 0, 1), (0, 1, 1), (0, 1, 0), (0, 0, 0)],
    [(0, 1, 0), (0, 1, 1), (1, 1, 1), (1, 1, 0)],
    [(0, 0, 1), (0, 0, 0), (1, 0, 0), (1, 0, 1)],
    [(0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)],
    [(1, 0, 0), (0, 0, 0), (0, 1, 0), (1, 1, 0)],
]
# sun from the left-behind (matches the Clansman sunset over the loch, left)
SUN = np.array([-0.45, 0.55, 0.35], dtype=np.float32)
SUN = SUN / np.linalg.norm(SUN)
FACE_LIGHT = []
for n in FACE_N:
    nd = float(np.dot(SUN, np.array(n, dtype=np.float32)))
    FACE_LIGHT.append(0.42 + 0.58 * max(0.0, nd))


def look_at(eye, target, up=(0, 1, 0)):
    eye = np.array(eye, dtype=np.float64)
    target = np.array(target, dtype=np.float64)
    f = target - eye
    f = f / (np.linalg.norm(f) + 1e-9)
    u = np.array(up, dtype=np.float64)
    s = np.cross(f, u)
    s = s / (np.linalg.norm(s) + 1e-9)
    u = np.cross(s, f)
    # world -> camera: x right, y up, z forward (we use +z forward here)
    M = np.eye(4)
    M[0, :3] = s
    M[1, :3] = u
    M[2, :3] = f
    M[:3, 3] = -M[:3, :3] @ eye
    return M


def project_pts(pts, M, fov, w, h):
    # pts (N,3) world → (N,3) clip-like: sx, sy, depth
    hpts = np.concatenate([pts, np.ones((len(pts), 1))], axis=1)
    cam = (M @ hpts.T).T
    z = cam[:, 2]
    f = 0.5 * h / math.tan(math.radians(fov) * 0.5)
    # skip behind camera later
    sx = w * 0.5 + cam[:, 0] * f / np.clip(z, 1e-3, None)
    sy = h * 0.5 - cam[:, 1] * f / np.clip(z, 1e-3, None)
    return np.stack([sx, sy, z], axis=1)


def _fill_tri(img, zbuf, mask, x0, y0, z0, x1, y1, z1, x2, y2, z2, rgb):
    minx = int(max(0, math.floor(min(x0, x1, x2))))
    maxx = int(min(img.shape[1] - 1, math.ceil(max(x0, x1, x2))))
    miny = int(max(0, math.floor(min(y0, y1, y2))))
    maxy = int(min(img.shape[0] - 1, math.ceil(max(y0, y1, y2))))
    if minx > maxx or miny > maxy:
        return
    area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
    if abs(area) < 1e-6:
        return
    xs = np.arange(minx, maxx + 1, dtype=np.float32)
    ys = np.arange(miny, maxy + 1, dtype=np.float32)
    X, Y = np.meshgrid(xs, ys)
    a = (x1 - X) * (y2 - Y) - (x2 - X) * (y1 - Y)
    b = (x2 - X) * (y0 - Y) - (x0 - X) * (y2 - Y)
    c = (x0 - X) * (y1 - Y) - (x1 - X) * (y0 - Y)
    a /= area; b /= area; c /= area
    inside = (a >= -0.01) & (b >= -0.01) & (c >= -0.01)
    z = a * z0 + b * z1 + c * z2
    inside &= z > 0.1
    if not inside.any():
        return
    sl = zbuf[miny:maxy + 1, minx:maxx + 1]
    closer = inside & (z < sl)
    if not closer.any():
        return
    sl[closer] = z[closer]
    img[miny:maxy + 1, minx:maxx + 1][closer] = rgb
    mask[miny:maxy + 1, minx:maxx + 1][closer] = 1


def render(blocks, eye, look, fov=52, w=960, h=540, bg=(40, 28, 36)):
    """blocks: iterable of (x,y,z,id). Returns rgb uint8 (h,w,3), mask uint8 (h,w)."""
    # index occupied for hidden-face culling
    occ = set()
    bl = []
    for x, y, z, bid in blocks:
        occ.add((x, y, z))
        bl.append((x, y, z, bid))
    M = look_at(eye, look)
    img = np.zeros((h, w, 3), dtype=np.uint8)
    img[:, :] = np.array(bg, dtype=np.uint8)
    zbuf = np.full((h, w), 1e9, dtype=np.float32)
    mask = np.zeros((h, w), dtype=np.uint8)

    # sky-ish gradient
    for y in range(h):
        t = y / max(1, h - 1)
        # sunset: deep orange at horizon (bottom of sky / mid), dark red up
        img[y, :] = (
            int(20 + 80 * (1 - t) + 140 * max(0, 0.5 - abs(t - 0.55))),
            int(16 + 40 * (1 - t) + 50 * max(0, 0.5 - abs(t - 0.55))),
            int(28 + 20 * t),
        )

    neigh = [(1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)]
    # pre-filter surface faces
    faces = []
    for x, y, z, bid in bl:
        col = COLOUR.get(bid, (140, 140, 140))
        for fi, (nx, ny, nz) in enumerate(neigh):
            if (x + nx, y + ny, z + nz) in occ:
                continue
            faces.append((x, y, z, fi, col))

    # project all corners in one go
    if not faces:
        return img, mask
    pts = []
    for x, y, z, fi, col in faces:
        for vx, vy, vz in FACE_V[fi]:
            pts.append((x + vx, y + vy, z + vz))
    P = project_pts(np.array(pts, dtype=np.float64), M, fov, w, h)

    # rasterize
    for i, (x, y, z, fi, col) in enumerate(faces):
        q = P[i * 4:(i + 1) * 4]
        if np.any(q[:, 2] < 0.2):
            continue
        lit = FACE_LIGHT[fi]
        rgb = (np.clip(np.array(col) * lit, 0, 255)).astype(np.uint8)
        # two tris
        _fill_tri(img, zbuf, mask,
                  q[0, 0], q[0, 1], q[0, 2],
                  q[1, 0], q[1, 1], q[1, 2],
                  q[2, 0], q[2, 1], q[2, 2], rgb)
        _fill_tri(img, zbuf, mask,
                  q[0, 0], q[0, 1], q[0, 2],
                  q[2, 0], q[2, 1], q[2, 2],
                  q[3, 0], q[3, 1], q[3, 2], rgb)
    return img, mask


def iou(a, b):
    a = a.astype(bool); b = b.astype(bool)
    inter = np.logical_and(a, b).sum()
    union = np.logical_or(a, b).sum()
    return float(inter / union) if union else 0.0
