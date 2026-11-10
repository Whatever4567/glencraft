#!/usr/bin/env python3
"""Glencraft original pig (phase 3). Procedural mesh, rig, walk clip, painted
albedo + normal + AO, made from scratch to match game/ref/pig_ref.jpg:
a grotesque photoreal balloon pig with a huge protruding fleshy snout disc,
comma-shaped nostrils, a forehead high on the body, small heavy-lidded brown
eyes, a small buzz-cut stubble patch, warm pale pink mottled skin, deep fat
rolls, and short stubby pink legs. No third-party meshes. CC0.
"""
from __future__ import annotations
import json, math, struct, sys, io
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

rng = np.random.default_rng(20261110)
TS = int(sys.argv[2]) if len(sys.argv) > 2 else 2048
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('assets/models/pig3.glb')

# ---------------------------------------------------------------------------
# Painted atlas
#   [0.00, 0.00) - [0.70, 0.70)  body / head skin
#   [0.70, 0.00) - [1.00, 0.35)  snout disk
#   [0.70, 0.35) - [1.00, 0.55)  ear inner
#   [0.70, 0.55) - [1.00, 0.70)  hooves
#   [0.00, 0.70) - [0.50, 1.00)  buzz-cut stubble
#   [0.50, 0.70) - [0.75, 1.00)  eye
#   [0.75, 0.70) - [1.00, 1.00)  nostril cavity
# ---------------------------------------------------------------------------
W = H = TS
alb = np.zeros((H, W, 3), np.float32)
height = np.zeros((H, W), np.float32)  # 0.5 = mid, used for normal + AO

def noise(h, w, scale, octaves=3, seed=0):
    r = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32)
    amp, freq = 1.0, 1
    for o in range(octaves):
        sh, sw = max(2, int(h / (scale / freq))), max(2, int(w / (scale / freq)))
        n = r.random((sh, sw)).astype(np.float32)
        n = np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), np.float32) / 255
        acc += n * amp
        amp *= 0.5
        freq *= 2
    acc /= acc.max() + 1e-6
    return acc

# --- body skin: warm pale pink, red mottling, pores, horizontal wrinkle height ---
x0, y0, x1, y1 = 0, 0, int(0.70 * W), int(0.70 * H)
bw, bh = x1 - x0, y1 - y0
base = np.array([255, 236, 222], np.float32)
blush = np.array([226, 124, 112], np.float32)
n1 = noise(bh, bw, 56, 5, 11)
n2 = noise(bh, bw, 14, 3, 22)
pore = noise(bh, bw, 3, 1, 33)
# blotchy redness in patches only (not a full-body tan)
blot = np.clip((n1 - 0.58) * 2.8, 0, 1)
# faint horizontal wrinkle bands in the tile (U is around, V is height-ish)
yy, xx = np.mgrid[0:bh, 0:bw]
# several irregular crease lines across V
crease = np.zeros((bh, bw), np.float32)
for i, (v0, amp, sig, seed) in enumerate((
    (0.18, 1.0, 0.018, 101), (0.30, 1.15, 0.020, 102),
    (0.42, 1.10, 0.020, 103), (0.54, 0.95, 0.018, 104),
    (0.64, 0.75, 0.016, 105), (0.78, 0.55, 0.016, 106),
)):
    wobble = (noise(bh, bw, 40, 2, seed) - 0.5) * 0.04
    dv = (yy / max(1, bh - 1) - v0 - wobble)
    crease += amp * np.exp(-(dv * dv) / (2 * sig * sig))
crease = np.clip(crease, 0, 1.6)
# fine secondary wrinkles
fine = np.clip((noise(bh, bw, 8, 2, 201) - 0.55) * 3.0, 0, 1) * 0.25

skin = base * (0.97 + 0.08 * n2)[..., None]
skin = skin * (1 - 0.32 * blot[..., None]) + blush * (0.32 * blot[..., None])
# valleys of creases go slightly redder / darker
skin = skin * (1 - 0.04 * crease[..., None]) + np.array([236, 170, 155]) * (0.04 * crease[..., None])
skin = skin * (1 - 0.06 * (pore > 0.80)[..., None])
# very short peach fuzz, warm not grey
fuzz = np.zeros((bh, bw), np.float32)
for i in range(bw * bh // 22):
    x, y = int(rng.integers(0, bw)), int(rng.integers(0, bh))
    L = int(rng.integers(2, 6)); dx = rng.normal(0, 0.35)
    for k in range(L):
        fuzz[(y + k) % bh, (x + int(k * dx)) % bw] += 0.3
fuzz = np.asarray(Image.fromarray(np.clip(fuzz * 80, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.4)), np.float32) / 255
skin = skin * (1 - 0.06 * fuzz[..., None]) + np.array([236, 196, 180]) * (0.06 * fuzz[..., None])
alb[y0:y1, x0:x1] = np.clip(skin, 0, 255)
height[y0:y1, x0:x1] = 0.5 - 0.18 * crease - 0.06 * fine - 0.03 * (pore > 0.80)

# --- snout (warm, slightly redder, tight pores, wetter) ---
sx0, sy0, sx1, sy1 = int(0.70 * W), 0, W, int(0.35 * H)
sw, sh = sx1 - sx0, sy1 - sy0
sn = noise(sh, sw, 22, 4, 44)
sn2 = noise(sh, sw, 4, 1, 45)
snout = np.array([255, 214, 200], np.float32) * (0.96 + 0.10 * sn[..., None])
snout = snout * (1 - 0.10 * (sn2 > 0.72)[..., None])
snout = snout + np.array([28, 8, 6]) * np.clip((sn - 0.55) * 1.6, 0, 1)[..., None]
yy, xx = np.mgrid[0:sh, 0:sw]
rad = np.sqrt(((xx - sw * 0.5) / (sw * 0.38)) ** 2 + ((yy - sh * 0.45) / (sh * 0.32)) ** 2)
snout = snout + np.array([36, 24, 20]) * (np.clip(1 - rad, 0, 1) ** 2 * 0.28)[..., None]
# fine snout wrinkles (concentric-ish)
cr = np.clip((noise(sh, sw, 10, 2, 46) - 0.5) * 2, 0, 1)
alb[sy0:sy1, sx0:sx1] = np.clip(snout, 0, 255)
height[sy0:sy1, sx0:sx1] = 0.5 - 0.12 * cr - 0.05 * (sn2 > 0.72)

# --- ear inner ---
ex0, ey0, ex1, ey1 = int(0.70 * W), int(0.35 * H), W, int(0.55 * H)
ew, eh = ex1 - ex0, ey1 - ey0
en = noise(eh, ew, 16, 3, 55)
ear = np.array([236, 150, 145], np.float32) * (0.92 + 0.16 * en[..., None])
alb[ey0:ey1, ex0:ex1] = np.clip(ear, 0, 255)
height[ey0:ey1, ex0:ex1] = 0.5

# --- hooves ---
hx0, hy0, hx1, hy1 = int(0.70 * W), int(0.55 * H), W, int(0.70 * H)
hw, hh = hx1 - hx0, hy1 - hy0
hn = noise(hh, hw, 10, 3, 66)
hoof = np.array([52, 38, 32], np.float32) * (0.85 + 0.3 * hn[..., None])
for i in range(80):
    x = int(rng.integers(0, hw))
    hoof[:, x % hw] *= rng.uniform(0.85, 1.1)
alb[hy0:hy1, hx0:hx1] = np.clip(hoof, 0, 255)
height[hy0:hy1, hx0:hx1] = 0.5

# --- buzz-cut STUBBLE (dark brown fibers with sheen, not a black void) ---
bx0, by0, bx1, by1 = 0, int(0.70 * H), int(0.50 * W), H
bw, bh = bx1 - bx0, by1 - by0
base_h = np.array([78, 60, 46], np.float32)
lit_h = np.array([130, 104, 82], np.float32)
hn1 = noise(bh, bw, 8, 2, 77)
fib = np.zeros((bh, bw), np.float32)
for i in range(bw * bh // 2):
    x = int(rng.integers(0, bw)); y = int(rng.integers(0, bh))
    L = int(rng.integers(3, 9))
    for k in range(L):
        yy = (y + k) % bh
        xx = (x + int(k * rng.normal(0, 0.18))) % bw
        fib[yy, xx] += 1.0
fib = np.asarray(Image.fromarray(np.clip(fib * 36, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.45)), np.float32) / 255
t = np.clip(0.30 + 1.0 * fib + 0.25 * hn1, 0, 1)
hair = base_h * (1 - t[..., None]) + lit_h * t[..., None]
alb[by0:by1, bx0:bx1] = np.clip(hair, 0, 255)
height[by0:by1, bx0:bx1] = 0.55 + 0.20 * fib  # short fiber relief

# --- eye (brown iris dominant, small sclera) ---
ix0, iy0, ix1, iy1 = int(0.50 * W), int(0.70 * H), int(0.75 * W), H
iw, ih = ix1 - ix0, iy1 - iy0
eye = np.zeros((ih, iw, 3), np.float32)
yy, xx = np.mgrid[0:ih, 0:iw]
u = (xx / max(1, iw - 1)) * 2 - 1
v = (yy / max(1, ih - 1)) * 2 - 1
r = np.sqrt(u * u + v * v)
eye[:] = (236, 220, 210)
vein = noise(ih, iw, 6, 2, 88)
eye = eye * (1 - 0.06 * (vein > 0.75)[..., None]) + np.array([200, 90, 90]) * (0.06 * (vein > 0.75)[..., None])
iris = (r < 0.72) & (r > 0.14)
ang = np.arctan2(v, u)
iris_col = np.array([118, 70, 40], np.float32) + np.array([50, 26, 10]) * np.cos(ang * 7 + 1)[..., None]
ring = (r < 0.72) & (r > 0.63)
eye[iris] = iris_col[iris]
eye[ring] = (48, 28, 16)
pupil = r < 0.18
eye[pupil] = (10, 7, 6)
hi = ((u + 0.16) ** 2 + (v + 0.20) ** 2) < 0.010
eye[hi] = (255, 255, 250)
alb[iy0:iy1, ix0:ix1] = np.clip(eye, 0, 255)
height[iy0:iy1, ix0:ix1] = 0.5

# --- nostril cavity (warm dark flesh, lighter toward the rim) ---
nx0, ny0, nx1, ny1 = int(0.75 * W), int(0.70 * H), W, H
nw, nh = nx1 - nx0, ny1 - ny0
cav = noise(nh, nw, 8, 2, 99)
nostril = np.array([62, 28, 26], np.float32) * (0.55 + 0.8 * cav[..., None])
yy, xx = np.mgrid[0:nh, 0:nw]
radn = np.sqrt(((xx - nw / 2) / (nw * 0.5)) ** 2 + ((yy - nh / 2) / (nh * 0.5)) ** 2)
rim = np.clip(radn - 0.40, 0, 1)
nostril = nostril * (1 - 0.65 * rim[..., None]) + np.array([180, 100, 95], np.float32) * (0.65 * rim[..., None])
alb[ny0:ny1, nx0:nx1] = np.clip(nostril, 0, 255)
height[ny0:ny1, nx0:nx1] = 0.25 + 0.3 * radn  # darker / deeper in the middle

alb = np.clip(alb, 0, 255)
tex = Image.fromarray(alb.astype(np.uint8))
tex = tex.filter(ImageFilter.UnsharpMask(radius=0.8, percent=30, threshold=2))
alb = np.asarray(tex, np.float32)

# normal (OpenGL tangent-space) + AO from height
def height_to_normal_ao(h, strength=6.0):
    # slight blur so the normal isn't crispy-noisy
    h_img = Image.fromarray(np.clip(h * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    h2 = np.asarray(h_img, np.float32) / 255.0
    dy, dx = np.gradient(h2)
    nx = -dx * strength
    ny = dy * strength   # image y down, OpenGL +Y up after this sign
    nz = np.ones_like(h2)
    n = np.stack([nx, ny, nz], -1)
    n /= np.maximum(np.linalg.norm(n, axis=-1, keepdims=True), 1e-6)
    nmap = np.clip(n * 0.5 + 0.5, 0, 1) * 255
    # AO: valleys (low height) are darker
    ao = np.clip(0.88 + 0.18 * h2, 0.82, 1.0)
    ao = np.asarray(Image.fromarray((ao * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), np.float32)
    ao_rgb = np.stack([ao, ao, ao], -1)
    return nmap, ao_rgb

nmap, aomap = height_to_normal_ao(height, strength=2.2)
nimg = Image.fromarray(nmap.astype(np.uint8))
aimg = Image.fromarray(aomap.astype(np.uint8))

def UV(region):
    R = {
        'skin':    (0.00, 0.00, 0.70, 0.70),
        'snout':   (0.70, 0.00, 1.00, 0.35),
        'earin':   (0.70, 0.35, 1.00, 0.55),
        'hoof':    (0.70, 0.55, 1.00, 0.70),
        'hair':    (0.00, 0.70, 0.50, 1.00),
        'eye':     (0.50, 0.70, 0.75, 1.00),
        'nostril': (0.75, 0.70, 1.00, 1.00),
        'leg':     (0.40, 0.02, 0.62, 0.18),  # clean-ish patch of the skin tile
    }
    return R[region]

def map_uv(u, v, region):
    u0, v0, u1, v1 = UV(region)
    u = 0.06 + 0.88 * float(np.clip(u, 0.0, 1.0))
    v = 0.06 + 0.88 * float(np.clip(v, 0.0, 1.0))
    return (u0 + u * (u1 - u0), v0 + v * (v1 - v0))

# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------
P, N, UVS, JIDX, JW = [], [], [], [], []
IDX = []

def emit(pos, nor, uv, joints, weights, tris):
    b = len(P)
    P.extend(pos); N.extend(nor); UVS.extend(uv); JIDX.extend(joints); JW.extend(weights)
    for a, c, d in tris:
        IDX.append([b + a, b + c, b + d])

def normalize(v):
    n = np.linalg.norm(v, axis=-1, keepdims=True)
    n = np.maximum(n, 1e-8)
    return v / n

BONE = {
    'Root':  np.array([0.0, 0.0, 0.0]),
    'Body':  np.array([0.0, 0.44, -0.08]),
    'Head':  np.array([0.0, 0.72, 0.10]),
    'Snout': np.array([0.0, 0.46, 0.42]),
    'EarL':  np.array([-0.14, 0.86, 0.08]),
    'EarR':  np.array([ 0.14, 0.86, 0.08]),
    'Tail':  np.array([0.0, 0.52, -0.46]),
    'LegFL': np.array([-0.16, 0.14,  0.12]),
    'LegFR': np.array([ 0.16, 0.14,  0.12]),
    'LegBL': np.array([-0.17, 0.14, -0.16]),
    'LegBR': np.array([ 0.17, 0.14, -0.16]),
}
BONE_ORDER = ['Root','Body','Head','Snout','EarL','EarR','Tail','LegFL','LegFR','LegBL','LegBR']
BONE_I = {n: i for i, n in enumerate(BONE_ORDER)}
PARENT = {'Root': None, 'Body': 'Root', 'Head': 'Body', 'Snout': 'Head',
          'EarL': 'Head', 'EarR': 'Head', 'Tail': 'Body',
          'LegFL': 'Body', 'LegFR': 'Body', 'LegBL': 'Body', 'LegBR': 'Body'}

def jw(*pairs):
    js = [0, 0, 0, 0]; ws = [0, 0, 0, 0]
    s = 0.0
    for i, (n, w) in enumerate(pairs[:4]):
        js[i] = BONE_I[n]; ws[i] = w; s += w
    if s <= 0: ws[0] = 1
    else:
        ws = [w / s for w in ws]
    return js, ws

def skin_of(p, default='Body'):
    y, z, x = p[1], p[2], p[0]
    for name, hip in (('LegFL', BONE['LegFL']), ('LegFR', BONE['LegFR']),
                      ('LegBL', BONE['LegBL']), ('LegBR', BONE['LegBR'])):
        if y < 0.22 and np.hypot(x - hip[0], z - hip[2]) < 0.13:
            return jw((name, 1))
    if z < -0.40 and y > 0.30:
        return jw(('Tail', 0.85), ('Body', 0.15))
    if y > 0.80 and abs(x) > 0.10 and -0.02 < z < 0.20:
        ear = 'EarL' if x < 0 else 'EarR'
        return jw((ear, 0.8), ('Head', 0.2))
    if z > 0.32:
        return jw(('Snout', 0.8), ('Head', 0.2))
    if z > 0.00 and y > 0.62:
        return jw(('Head', 0.85), ('Body', 0.15))
    return jw((default, 1))

def ray_ellipsoid(o, d, c, r):
    q = (np.asarray(o, np.float32) - np.asarray(c, np.float32)) / r
    u = np.asarray(d, np.float32) / r
    A = float(np.dot(u, u))
    B = 2.0 * float(np.dot(q, u))
    C = float(np.dot(q, q) - 1.0)
    if A < 1e-12:
        return None
    disc = B * B - 4 * A * C
    if disc < 0:
        return None
    s = math.sqrt(disc)
    ts = [t for t in ((-B - s) / (2 * A), (-B + s) / (2 * A)) if t > 1e-6]
    return max(ts) if ts else None

def latlong_sphere(c, r, seg=32, ring=20, squash=(1, 1, 1), deform=None, region='skin', uv_mode='sphere', hemi=None):
    r = np.array(r, np.float32) * np.array(squash, np.float32)
    pos, nor, uv, J, Wts, tris = [], [], [], [], [], []
    th_max = math.pi / 2 if hemi == '+y' else math.pi
    for i in range(ring + 1):
        th = th_max * i / ring
        st, ct = math.sin(th), math.cos(th)
        for k in range(seg + 1):
            ph = 2 * math.pi * k / seg
            d = np.array([st * math.cos(ph), ct, st * math.sin(ph)], np.float32)
            p = np.array(c, np.float32) + d * r
            if deform is not None:
                p = deform(p, d, i / ring, k / seg)
            n = d.copy()
            pos.append(p); nor.append(n)
            reg = region(p) if callable(region) else region
            if reg == 'hair':
                uu = 0.5 + 0.5 * np.clip(p[0] / 0.12, -1, 1)
                vv = 0.5 + 0.5 * np.clip((p[2] - 0.06) / 0.12, -1, 1)
                uv.append(map_uv(float(uu), float(vv), 'hair'))
            elif reg == 'nostril':
                uu = 0.5 + 0.5 * np.clip((p[0] - math.copysign(0.09, p[0] or 1.0)) / 0.05, -1, 1)
                vv = 0.5 + 0.5 * np.clip((p[1] - 0.44) / 0.06, -1, 1)
                uv.append(map_uv(float(uu), float(vv), 'nostril'))
            elif uv_mode == 'sphere':
                if reg == 'snout' or (reg == 'skin' and p[2] > 0.18 and p[1] > 0.58):
                    # planar +Z: forehead and snout face, no pole pinch
                    uu = 0.5 + 0.5 * np.clip(p[0] / 0.42, -1, 1)
                    vv = 0.5 + 0.5 * np.clip((p[1] - 0.55) / 0.38, -1, 1)
                else:
                    uu = (math.atan2(p[0], p[2]) / (2 * math.pi)) % 1.0
                    vv = 0.12 + 0.76 * np.clip((p[1] - 0.08) / 0.86, 0, 1)
                uv.append(map_uv(float(uu), float(vv), reg))
            elif uv_mode == 'cap':
                uv.append(map_uv(0.5 + 0.5 * d[0] * st, 0.5 + 0.5 * d[2] * st, reg))
            else:
                uv.append(map_uv(k / seg, i / ring, reg))
            js, ws = skin_of(p)
            J.append(js); Wts.append(ws)
    for i in range(ring):
        for k in range(seg):
            a = i * (seg + 1) + k
            b = a + seg + 1
            tris += [(a, b, a + 1), (a + 1, b, b + 1)]
    emit(pos, nor, uv, J, Wts, tris)
    return len(tris)

def cylinder(c0, c1, r0, r1, seg=16, region='skin', bone=None):
    axis = np.array(c1, np.float32) - np.array(c0, np.float32)
    L = np.linalg.norm(axis)
    if L < 1e-6: return
    az = axis / L
    tmp = np.array([0, 1, 0], np.float32) if abs(az[1]) < 0.9 else np.array([1, 0, 0], np.float32)
    ax = np.cross(tmp, az); ax /= np.linalg.norm(ax)
    ay = np.cross(az, ax)
    pos, nor, uv, J, Wts, tris = [], [], [], [], [], []
    rings = 5
    for i in range(rings + 1):
        t = i / rings
        c = (1 - t) * np.array(c0, np.float32) + t * np.array(c1, np.float32)
        r = (1 - t) * r0 + t * r1
        for k in range(seg + 1):
            ph = 2 * math.pi * k / seg
            n = ax * math.cos(ph) + ay * math.sin(ph)
            p = c + n * r
            pos.append(p); nor.append(n)
            uv.append(map_uv(k / seg, t, region))
            js, ws = jw((bone, 1)) if bone else skin_of(p)
            J.append(js); Wts.append(ws)
    for i in range(rings):
        for k in range(seg):
            a = i * (seg + 1) + k
            b = a + seg + 1
            tris += [(a, b, a + 1), (a + 1, b, b + 1)]
    emit(pos, nor, uv, J, Wts, tris)

def disk(c, nrm, r, seg=20, region='snout', bone='Snout'):
    nrm = np.array(nrm, np.float32); nrm /= np.linalg.norm(nrm)
    tmp = np.array([0, 1, 0], np.float32) if abs(nrm[1]) < 0.9 else np.array([1, 0, 0], np.float32)
    ax = np.cross(tmp, nrm); ax /= np.linalg.norm(ax)
    ay = np.cross(nrm, ax)
    pos, nor, uv, J, Wts, tris = [c], [nrm], [map_uv(0.5, 0.5, region)], [], [], []
    js, ws = jw((bone, 1)); J.append(js); Wts.append(ws)
    for k in range(seg + 1):
        ph = 2 * math.pi * k / seg
        d = ax * math.cos(ph) + ay * math.sin(ph)
        p = np.array(c, np.float32) + d * r
        pos.append(p); nor.append(nrm)
        uv.append(map_uv(0.5 + 0.5 * math.cos(ph), 0.5 + 0.5 * math.sin(ph), region))
        J.append(js); Wts.append(ws)
    tris = [(0, k, k + 1) for k in range(1, seg + 1)]
    emit(pos, nor, uv, J, Wts, tris)

def comma_nostril(side, c, nrm, rx, ry, depth=0.04, seg=20, rings=8, bone='Snout'):
    """Teardrop / comma cavity. side=-1 is -X (viewer's right).
    Wide head is upper-inner; tail points down and outward."""
    nrm = np.array(nrm, np.float32); nrm /= np.linalg.norm(nrm)
    # Outward (world X * side) and up, projected onto the opening plane.
    # Keep ax, ay, nrm right-handed so both sides share the same winding
    # (an ax flip alone reversed one nostril and hid it from the front).
    outward = np.array([float(side), 0.0, 0.0], np.float32)
    outward = outward - nrm * float(np.dot(outward, nrm))
    lo = float(np.linalg.norm(outward))
    ax = outward / lo if lo > 1e-6 else np.array([1.0, 0.0, 0.0], np.float32)
    ay = np.cross(nrm, ax); ay /= np.linalg.norm(ay)
    if ay[1] < 0:
        ay = -ay
        ax = -ax
    # re-assert right-handedness
    if float(np.dot(np.cross(ax, ay), nrm)) < 0:
        ax = -ax
    js, ws = jw((bone, 1))
    pos, nor, uv, J, Wts, tris = [], [], [], [], [], []

    def rim(k):
        th = 2 * math.pi * k / seg
        # th=0 at top (+ay), increases toward +ax (outward)
        v = math.cos(th)
        u = math.sin(th)
        ru = rx * (0.70 + 0.70 * max(0.0, -v) + 0.20 * max(0.0, u))
        rv = ry * (0.82 + 0.50 * max(0.0, -v))
        u_off = 0.50 * rx * max(0.0, -v)
        return ax * (u * ru + u_off) + ay * (v * rv)

    for i in range(rings + 1):
        t = i / rings
        thb = t * math.pi / 2
        scale = math.cos(thb)
        back = -nrm * (depth * math.sin(thb))
        for k in range(seg + 1):
            dlt = rim(k)
            p = np.array(c, np.float32) + dlt * scale + back
            # normal faces the opening
            radial = dlt / (np.linalg.norm(dlt) + 1e-8)
            n = radial * math.cos(thb) + nrm * math.sin(thb)
            pos.append(p); nor.append(n)
            uv.append(map_uv(k / seg, t, 'snout' if t < 0.30 else 'nostril'))
            J.append(js); Wts.append(ws)
    for i in range(rings):
        for k in range(seg):
            a = i * (seg + 1) + k
            b = a + seg + 1
            tris += [(a, a + 1, b), (a + 1, b + 1, b)]
    # Make sure the cavity faces the opening (+nrm). If the first
    # triangle points the wrong way, flip every triangle.
    i0, i1, i2 = tris[0]
    fn = np.cross(np.asarray(pos[i1]) - pos[i0], np.asarray(pos[i2]) - pos[i0])
    if float(np.dot(fn, nrm)) < 0:
        tris = [(a, c, b) for (a, b, c) in tris]
        nor = [-np.asarray(n) for n in nor]
    emit(pos, nor, uv, J, Wts, tris)

# ---------------------------------------------------------------------------
# Shape: fat body + high forehead + a SEPARATE protruding snout disc + bridge
# ---------------------------------------------------------------------------
ORIGIN = np.array([0.0, 0.52, 0.06], np.float32)
# body sits back, belly off the ground so legs show
BODY_E  = (np.array([0.0, 0.50, -0.16], np.float32), np.array([0.46, 0.38, 0.40], np.float32))
# forehead / head mass HIGH on the body
HEAD_E  = (np.array([0.0, 0.74,  0.14], np.float32), np.array([0.22, 0.14, 0.18], np.float32))
# big protruding fleshy snout — convex bulb (never flatten into a cave)
SNOUT_E = (np.array([0.0, 0.48,  0.48], np.float32), np.array([0.36, 0.28, 0.32], np.float32))
# broad nose bridge so the forehead flows out of the snout
BRIDGE_E= (np.array([0.0, 0.64,  0.30], np.float32), np.array([0.26, 0.18, 0.22], np.float32))
ELLIPSOIDS = (BODY_E, HEAD_E, SNOUT_E, BRIDGE_E)

def pig_deform(p, d, v, u):
    origin = ORIGIN
    direction = np.asarray(p, np.float32) - origin
    nrm = float(np.linalg.norm(direction))
    direction = direction / nrm if nrm > 1e-8 else np.array([0.0, 0.0, 1.0], np.float32)
    ts = [ray_ellipsoid(origin, direction, *e) for e in ELLIPSOIDS]
    hits = [t for t in ts if t is not None]
    if not hits:
        return p
    t = max(hits)
    # puff seams where two volumes meet
    valid = [x for x in ts if x is not None]
    if len(valid) >= 2:
        valid.sort(reverse=True)
        diff = valid[0] - valid[1]
        t += 0.070 * math.exp(-(diff * diff) / (2 * 0.070 * 0.070))
    p = origin + direction * t
    x, y, z = float(p[0]), float(p[1]), float(p[2])

    # keep a clear gap under the belly so short legs are visible
    if y < 0.18:
        p[1] = max(0.10, y)
        y = float(p[1])

    # very slight tip squash only — keeps the snout convex
    if z > 0.74:
        p[2] = 0.74 + (z - 0.74) * 0.55
        z = float(p[2])

    # gentle midline dip between the nostrils (do not punch a hole)
    if z > 0.58 and abs(x) < 0.05:
        g = math.exp(-(x * x) / (2 * 0.028 * 0.028))
        p[2] -= 0.005 * g

    # paint-only buzz-cut: barely flatten peaks so the hair tile sits flush
    cr = math.hypot(x, z - 0.08)
    if cr < 0.10 and y > 0.90:
        p[1] = 0.898
        y = float(p[1])

    # INWARD horizontal fat-roll creases on the body (valleys, not inverted ridges)
    if z < 0.36:
        for y0, amp, sig in (
            (0.22, 0.016, 0.038),
            (0.34, 0.018, 0.040),
            (0.46, 0.016, 0.040),
            (0.58, 0.012, 0.038),
        ):
            dy = p[1] - y0
            w = math.exp(-(dy * dy) / (2 * sig * sig))
            if w < 0.03:
                continue
            radial = np.array([p[0], 0.0, p[2] + 0.16], np.float32)
            rn = float(np.linalg.norm(radial))
            if rn < 1e-5:
                continue
            p = p - radial / rn * (amp * w)

    # rolls under the chin / around the snout base (inward)
    for z0, amp, sig, yaxis in (
        (0.28, 0.014, 0.036, 0.46),
        (0.16, 0.012, 0.036, 0.48),
        (0.06, 0.010, 0.036, 0.50),
    ):
        dz = p[2] - z0
        w = math.exp(-(dz * dz) / (2 * sig * sig))
        if w < 0.03:
            continue
        radial = np.array([p[0], p[1] - yaxis, 0.0], np.float32)
        rn = float(np.linalg.norm(radial))
        if rn < 1e-5:
            continue
        p = p - radial / rn * (amp * w)

    # eye sockets + hanging brow on the front of the forehead, just above the snout
    for sx in (-0.050, 0.050):
        ec = np.array([sx, 0.785, 0.26], np.float32)
        rel = p - ec
        d2 = (rel[0] / 0.038) ** 2 + (rel[1] / 0.028) ** 2 + (rel[2] / 0.034) ** 2
        if d2 < 1.3:
            k = max(0.0, 1.0 - d2 / 1.3)
            p = p - np.array([0.0, 0.0, 0.022], np.float32) * k
        bc = np.array([sx, 0.802, 0.265], np.float32)
        rel = p - bc
        d2 = (rel[0] / 0.036) ** 2 + (rel[1] / 0.016) ** 2 + (rel[2] / 0.026) ** 2
        if d2 < 1.15:
            k = max(0.0, 1.0 - d2 / 1.15)
            p = p + np.array([0.0, 0.005, 0.010], np.float32) * k

    # shallow nostril recesses (the comma bowls carry the cavity)
    for sx in (-0.075, 0.075):
        nc = np.array([sx, 0.47, 0.72], np.float32)
        rel = p - nc
        d2 = (rel[0] / 0.036) ** 2 + (rel[1] / 0.048) ** 2 + (rel[2] / 0.032) ** 2
        if d2 < 1.2:
            k = max(0.0, 1.0 - d2 / 1.2)
            p = p - np.array([0.006 * math.copysign(1, sx), 0.003, 0.014], np.float32) * (k * k)

    # jowl sag under the cheeks
    x, y, z = float(p[0]), float(p[1]), float(p[2])
    if y < 0.48 and abs(x) > 0.10 and 0.05 < z < 0.50:
        p[0] += math.copysign(0.018, x)
        p[1] -= 0.012
    return p

def body_region(p):
    x, y, z = float(p[0]), float(p[1]), float(p[2])
    cr = math.hypot(x, z - 0.08)
    if cr < 0.10 and y > 0.86:
        return 'hair'
    if z > 0.62:
        return 'snout'
    return 'skin'

latlong_sphere(ORIGIN, (0.52, 0.50, 0.62), seg=60, ring=48, deform=pig_deform, region=body_region)

# tiny ears at the sides of the hairline
def ear(side):
    c = np.array([side * 0.15, 0.86, 0.10], np.float32)
    latlong_sphere(c, (0.022, 0.030, 0.012), seg=10, ring=7, region='skin')
    latlong_sphere(c + np.array([side * 0.005, 0.0, 0.004], np.float32),
                   (0.014, 0.020, 0.006), seg=8, ring=5, region='earin')
ear(-1); ear(1)

# comma-shaped nostrils on the front of the snout disc
def snout_z(x, y):
    a = (x / 0.36) ** 2 + ((y - 0.48) / 0.28) ** 2
    if a >= 0.98:
        return None
    return 0.48 + 0.32 * math.sqrt(max(0.0, 1.0 - a))

for sx in (-0.075, 0.075):
    z = snout_z(sx, 0.455)
    if z is None:
        print('WARN no snout_z', sx)
        continue
    print('nostril', sx, 'z', z)
    comma_nostril(int(math.copysign(1, sx)),
                  np.array([sx, 0.470, z + 0.008], np.float32),
                  np.array([0.03 * math.copysign(1, sx), -0.05, 1.0], np.float32),
                  rx=0.026, ry=0.042, depth=0.028, seg=20, rings=8)

# small heavy-lidded brown eyes, close together, high on the forehead
def eyeball(side):
    c = np.array([side * 0.050, 0.788, 0.275], np.float32)
    seg, ring = 14, 10
    pos, nor, uv, J, Wts, tris = [], [], [], [], [], []
    r = 0.016
    js, ws = jw(('Head', 1))
    for i in range(ring + 1):
        th = math.pi * i / ring
        st, ct = math.sin(th), math.cos(th)
        for k in range(seg + 1):
            ph = 2 * math.pi * k / seg
            d = np.array([st * math.cos(ph), ct, st * math.sin(ph)], np.float32)
            p = c + d * r
            pos.append(p); nor.append(d)
            fu = 0.5 + 0.50 * d[0] / max(0.15, d[2] + 0.85)
            fv = 0.5 - 0.50 * d[1] / max(0.15, d[2] + 0.85)
            uv.append(map_uv(float(np.clip(fu, 0, 1)), float(np.clip(fv, 0, 1)), 'eye'))
            J.append(js); Wts.append(ws)
    for i in range(ring):
        for k in range(seg):
            a = i * (seg + 1) + k
            b = a + seg + 1
            tris += [(a, b, a + 1), (a + 1, b, b + 1)]
    emit(pos, nor, uv, J, Wts, tris)
    # heavy upper lid covers the top third of the globe, leaves the iris visible
    latlong_sphere(c + np.array([0.0, 0.009, 0.004], np.float32),
                   (0.018, 0.009, 0.014), seg=10, ring=6, region='skin')
    # thin lower lid
    latlong_sphere(c + np.array([0.0, -0.012, 0.005], np.float32),
                   (0.014, 0.005, 0.010), seg=8, ring=5, region='skin')
eyeball(-1); eyeball(1)

# short stubby PINK legs + small dark hooves, clearly visible under the body
for name, hip in (('LegFL', BONE['LegFL']), ('LegFR', BONE['LegFR']),
                  ('LegBL', BONE['LegBL']), ('LegBR', BONE['LegBR'])):
    top = np.array([hip[0], 0.16, hip[2]], np.float32)
    ankle = np.array([hip[0] * 1.04, 0.045, hip[2] + 0.008], np.float32)
    hoof = np.array([hip[0] * 1.05, 0.0, hip[2] + 0.014], np.float32)
    cylinder(top, ankle, 0.024, 0.016, seg=12, region='leg', bone=name)
    cylinder(ankle, hoof, 0.016, 0.018, seg=10, region='hoof', bone=name)
    sx = 0.008
    disk(hoof + np.array([-sx, 0.002, 0.006]), (0, 1, 0), 0.010, seg=8, region='hoof', bone=name)
    disk(hoof + np.array([ sx, 0.002, 0.006]), (0, 1, 0), 0.010, seg=8, region='hoof', bone=name)

# curly tail
tail_pts = []
for i in range(10):
    tt = i / 9
    ang = tt * math.pi * 2.2
    tail_pts.append(np.array([
        0.03 * math.sin(ang),
        0.54 + 0.02 * math.sin(ang * 0.5) + 0.04 * tt,
        -0.50 - 0.08 * tt
    ], np.float32))
for i in range(len(tail_pts) - 1):
    cylinder(tail_pts[i], tail_pts[i + 1], 0.016, 0.012, seg=8, region='skin', bone='Tail')

# ---------------------------------------------------------------------------
# Pack, smooth normals, tangents, export GLB with albedo + normal + AO
# ---------------------------------------------------------------------------
P = np.asarray(P, np.float32)
N = np.asarray(N, np.float32)
UVS = np.asarray(UVS, np.float32)
JN = np.asarray(JIDX, np.uint8)
WT = np.asarray(JW, np.float32)
I = np.asarray(IDX, np.uint32)

accn = np.zeros_like(P)
v0, v1, v2 = P[I[:, 0]], P[I[:, 1]], P[I[:, 2]]
fn = np.cross(v1 - v0, v2 - v0)
fn = normalize(fn)
for k in range(3):
    np.add.at(accn, I[:, k], fn)
N = normalize(accn)

# tangents (Lengyel) for the normal map
tan = np.zeros_like(P)
for i0, i1, i2 in I:
    p0, p1, p2 = P[i0], P[i1], P[i2]
    w0, w1, w2 = UVS[i0], UVS[i1], UVS[i2]
    e1, e2 = p1 - p0, p2 - p0
    s1, t1 = w1[0] - w0[0], w1[1] - w0[1]
    s2, t2 = w2[0] - w0[0], w2[1] - w0[1]
    denom = s1 * t2 - s2 * t1
    if abs(denom) < 1e-8:
        continue
    rcp = 1.0 / denom
    T = (e1 * t2 - e2 * t1) * rcp
    tan[i0] += T; tan[i1] += T; tan[i2] += T
# orthonormalise and store xyz + sign
T4 = np.zeros((len(P), 4), np.float32)
for i in range(len(P)):
    n = N[i]; t = tan[i]
    t = t - n * np.dot(n, t)
    ln = float(np.linalg.norm(t))
    if ln < 1e-8:
        # arbitrary tangent
        t = np.array([1, 0, 0], np.float32) if abs(n[0]) < 0.9 else np.array([0, 1, 0], np.float32)
        t = t - n * np.dot(n, t)
        ln = float(np.linalg.norm(t)) + 1e-8
    t = t / ln
    b = np.cross(n, t)
    # sign unused (we don't have bitangents from UV) — default +1
    T4[i] = [t[0], t[1], t[2], 1.0]

ntris = len(I)
print('tris', ntris, 'verts', len(P), 'height', float(P[:, 1].max() - P[:, 1].min()),
      'lenZ', float(P[:, 2].max() - P[:, 2].min()), 'width', float(P[:, 0].max() - P[:, 0].min()),
      'zRange', float(P[:, 2].min()), float(P[:, 2].max()),
      'yRange', float(P[:, 1].min()), float(P[:, 1].max()))

nodes_t = []
for name in BONE_ORDER:
    par = PARENT[name]
    nodes_t.append(BONE[name].copy() if par is None else BONE[name] - BONE[par])

ibm = np.zeros((len(BONE_ORDER), 16), np.float32)
for i, name in enumerate(BONE_ORDER):
    m = np.eye(4, dtype=np.float32)
    m[:3, 3] = -BONE[name]
    ibm[i] = m.T.ravel()

nkeys = 13
tt = np.linspace(0, 1, nkeys).astype(np.float32)
def quat_x(a):
    return np.array([math.sin(a / 2), 0, 0, math.cos(a / 2)], np.float32)
leg_ch = {}
amp = 0.40
for name, phase in (('LegFL', 0), ('LegBR', 0), ('LegFR', math.pi), ('LegBL', math.pi)):
    qs = np.stack([quat_x(amp * math.sin(2 * math.pi * t + phase)) for t in tt])
    leg_ch[name] = qs
body_t = np.stack([
    np.array([0.0, float(nodes_t[BONE_I['Body']][1] + 0.010 * math.sin(2 * math.pi * t * 2)), 0.0], np.float32)
    for t in tt
])
head_q = np.stack([quat_x(-0.07 * math.sin(2 * math.pi * t * 2)) for t in tt])

def write_glb(path, albedo_img, normal_img, ao_img):
    buf = io.BytesIO(); views = []; accs = []
    def view(b, target=None):
        while buf.tell() % 4: buf.write(b'\0')
        o = buf.tell(); buf.write(b)
        v = {'buffer': 0, 'byteOffset': o, 'byteLength': len(b)}
        if target: v['target'] = target
        views.append(v); return len(views) - 1
    def acc(a, ct, typ, target=None, mm=False):
        v = view(a.tobytes(), target)
        d = {'bufferView': v, 'componentType': ct, 'count': len(a), 'type': typ}
        if mm:
            d['min'] = a.min(0).tolist(); d['max'] = a.max(0).tolist()
        accs.append(d); return len(accs) - 1
    aP = acc(P, 5126, 'VEC3', 34962, True)
    aN = acc(N, 5126, 'VEC3', 34962)
    aU = acc(UVS, 5126, 'VEC2', 34962)
    aTng = acc(T4, 5126, 'VEC4', 34962)
    aJ = acc(JN, 5121, 'VEC4', 34962)
    aW = acc(WT, 5126, 'VEC4', 34962)
    aI = acc(I.ravel(), 5125, 'SCALAR', 34963)
    aB = acc(ibm, 5126, 'MAT4')
    aTime = acc(tt, 5126, 'SCALAR', None, True)
    rot_acc = {n: acc(leg_ch[n], 5126, 'VEC4') for n in leg_ch}
    aBodyT = acc(body_t, 5126, 'VEC3')
    aHeadQ = acc(head_q, 5126, 'VEC4')

    def img_view(im, q=90):
        tb = io.BytesIO()
        im.save(tb, 'WEBP', quality=q, method=6)
        return view(tb.getvalue())
    iv_a = img_view(albedo_img, 90)
    iv_n = img_view(normal_img, 92)
    iv_o = img_view(ao_img, 88)

    nodes = [{'name': 'Pig3', 'children': [1, 1 + len(BONE_ORDER)]}]
    for i, name in enumerate(BONE_ORDER):
        node = {'name': name, 'translation': [float(x) for x in nodes_t[i]]}
        ch = [BONE_I[n] + 1 for n in BONE_ORDER if PARENT[n] == name]
        if ch: node['children'] = ch
        nodes.append(node)
    nodes.append({'name': 'PigMesh', 'mesh': 0, 'skin': 0})

    channels, samplers = [], []
    def add_ch(node, path, out_acc):
        samplers.append({'input': aTime, 'output': out_acc, 'interpolation': 'LINEAR'})
        channels.append({'sampler': len(samplers) - 1, 'target': {'node': node, 'path': path}})
    for n, a in rot_acc.items():
        add_ch(BONE_I[n] + 1, 'rotation', a)
    add_ch(BONE_I['Body'] + 1, 'translation', aBodyT)
    add_ch(BONE_I['Head'] + 1, 'rotation', aHeadQ)

    g = {
        'asset': {'version': '2.0', 'generator': 'Glencraft pig_gen.py (original, CC0)'},
        'scene': 0,
        'scenes': [{'nodes': [0]}],
        'nodes': nodes,
        'meshes': [{'name': 'Pig', 'primitives': [{
            'attributes': {
                'POSITION': aP, 'NORMAL': aN, 'TEXCOORD_0': aU, 'TANGENT': aTng,
                'JOINTS_0': aJ, 'WEIGHTS_0': aW
            },
            'indices': aI, 'material': 0
        }]}],
        'skins': [{'joints': list(range(1, 1 + len(BONE_ORDER))), 'inverseBindMatrices': aB, 'skeleton': 1}],
        'materials': [{'name': 'PigSkin',
            'pbrMetallicRoughness': {
                'baseColorTexture': {'index': 0},
                'metallicFactor': 0.0,
                'roughnessFactor': 0.55
            },
            'normalTexture': {'index': 1, 'scale': 0.50},
            'occlusionTexture': {'index': 2},
        }],
        'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}],
        'animations': [{'name': 'walk', 'channels': channels, 'samplers': samplers}],
        'accessors': accs, 'bufferViews': views,
        'images': [
            {'bufferView': iv_a, 'mimeType': 'image/webp'},
            {'bufferView': iv_n, 'mimeType': 'image/webp'},
            {'bufferView': iv_o, 'mimeType': 'image/webp'},
        ],
        'textures': [
            {'sampler': 0, 'source': 0, 'extensions': {'EXT_texture_webp': {'source': 0}}},
            {'sampler': 0, 'source': 1, 'extensions': {'EXT_texture_webp': {'source': 1}}},
            {'sampler': 0, 'source': 2, 'extensions': {'EXT_texture_webp': {'source': 2}}},
        ],
        'extensionsUsed': ['EXT_texture_webp'],
        'extensionsRequired': ['EXT_texture_webp'],
    }
    while buf.tell() % 4: buf.write(b'\0')
    bb = buf.getvalue()
    g['buffers'] = [{'byteLength': len(bb)}]
    js = json.dumps(g).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bb))
    out += struct.pack('<II', len(js), 0x4E4F534A) + js
    out += struct.pack('<II', len(bb), 0x004E4942) + bb
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(out)
    print('wrote', path, len(out), 'tris', ntris)

tex = Image.fromarray(alb.astype(np.uint8))
tex_dir = OUT.parent.parent / 'tex'
if 'assets/models' in str(OUT) or OUT.suffix == '.glb':
    tex_dir = OUT.parent.parent / 'tex'
tex_dir.mkdir(parents=True, exist_ok=True)
tex.save(tex_dir / 'pig3_2k.webp', 'WEBP', quality=90, method=6)
nimg.save(tex_dir / 'pig3_n_2k.webp', 'WEBP', quality=92, method=6)
aimg.save(tex_dir / 'pig3_ao_2k.webp', 'WEBP', quality=88, method=6)
print('tex', tex_dir / 'pig3_2k.webp', (tex_dir / 'pig3_2k.webp').stat().st_size)
print('nrm', tex_dir / 'pig3_n_2k.webp')
print('ao ', tex_dir / 'pig3_ao_2k.webp')

write_glb(OUT, tex, nimg, aimg)
tex.save(OUT.with_suffix('.atlas.png'))
print('atlas', OUT.with_suffix('.atlas.png'))
