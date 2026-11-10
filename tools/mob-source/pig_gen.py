#!/usr/bin/env python3
"""Glencraft original pig (phase 3). Procedural mesh, rig, idle+walk clips,
painted albedo + normal + AO. Grotesque photoreal balloon pig matching
/workspace/qa/phase3/pig/ref-pig.jpg: huge convex snout disc, comma nostrils
with dark interiors, high forehead, heavy-lidded brown eyes, flush buzz-cut
stubble painted into the skin, warm even pink, deep fat rolls, short pink
legs, real ears and a curly tail. Faces +Z, hooves at y=0. No third-party
meshes. CC0.
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
# Atlas
#   skin    [0.00, 0.00) - [0.72, 0.78)
#   snout   [0.72, 0.00) - [1.00, 0.40)
#   earin   [0.72, 0.40) - [1.00, 0.58)
#   hoof    [0.72, 0.58) - [1.00, 0.74)
#   eye     [0.00, 0.78) - [0.36, 1.00)
#   nostril [0.36, 0.78) - [0.64, 1.00)
#   spare   [0.64, 0.78) - [1.00, 1.00)  (lid / inner mouth)
# Stubble is painted into the skin tile, not a separate cap region.
# ---------------------------------------------------------------------------
W = H = TS
alb = np.zeros((H, W, 3), np.float32)
height = np.full((H, W), 0.5, np.float32)

def noise(h, w, scale, octaves=3, seed=0):
    r = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32)
    amp, freq = 1.0, 1
    for o in range(octaves):
        sh, sw = max(2, int(h / max(1, (scale / freq)))), max(2, int(w / max(1, (scale / freq))))
        n = r.random((sh, sw)).astype(np.float32)
        n = np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), np.float32) / 255
        acc += n * amp
        amp *= 0.5
        freq *= 2
    acc /= acc.max() + 1e-6
    return acc

def UV(region):
    return {
        'skin':    (0.00, 0.00, 0.72, 0.78),
        'snout':   (0.72, 0.00, 1.00, 0.40),
        'earin':   (0.72, 0.40, 1.00, 0.58),
        'hoof':    (0.72, 0.58, 1.00, 0.74),
        'eye':     (0.00, 0.78, 0.36, 1.00),
        'nostril': (0.36, 0.78, 0.64, 1.00),
        'lid':     (0.64, 0.78, 1.00, 1.00),
        'leg':     (0.08, 0.08, 0.30, 0.28),
    }[region]

def map_uv(u, v, region):
    u0, v0, u1, v1 = UV(region)
    u = 0.04 + 0.92 * float(np.clip(u, 0.0, 1.0))
    v = 0.04 + 0.92 * float(np.clip(v, 0.0, 1.0))
    return (u0 + u * (u1 - u0), v0 + v * (v1 - v0))

# --- even warm pale-pink skin (subtle flush, no dirty blotches) ---
x0, y0, x1, y1 = 0, 0, int(0.72 * W), int(0.78 * H)
bw, bh = x1 - x0, y1 - y0
base = np.array([255, 228, 214], np.float32)
rose = np.array([232, 150, 140], np.float32)
n1 = noise(bh, bw, 64, 4, 11)
n2 = noise(bh, bw, 18, 3, 22)
pore = noise(bh, bw, 3, 1, 33)
# soft, even flush — never patchy dirt
flush = np.clip((n1 - 0.42) * 1.15, 0, 1) * 0.16
yy, xx = np.mgrid[0:bh, 0:bw]
crease = np.zeros((bh, bw), np.float32)
for i, (v0, amp, sig, seed) in enumerate((
    (0.20, 0.70, 0.022, 101), (0.34, 0.80, 0.024, 102),
    (0.48, 0.75, 0.024, 103), (0.62, 0.60, 0.022, 104),
    (0.74, 0.45, 0.020, 105),
)):
    wobble = (noise(bh, bw, 48, 2, seed) - 0.5) * 0.035
    dv = (yy / max(1, bh - 1) - v0 - wobble)
    crease += amp * np.exp(-(dv * dv) / (2 * sig * sig))
crease = np.clip(crease, 0, 1.4)
fine = np.clip((noise(bh, bw, 9, 2, 201) - 0.55) * 2.4, 0, 1) * 0.18

skin = base * (0.98 + 0.05 * n2)[..., None]
skin = skin * (1 - flush[..., None]) + rose * flush[..., None]
skin = skin * (1 - 0.05 * crease[..., None]) + np.array([230, 175, 162]) * (0.05 * crease[..., None])
skin = skin * (1 - 0.045 * (pore > 0.82)[..., None])
# sparse peach fuzz
fuzz = np.zeros((bh, bw), np.float32)
for i in range(bw * bh // 40):
    x, y = int(rng.integers(0, bw)), int(rng.integers(0, bh))
    L = int(rng.integers(2, 5)); dx = rng.normal(0, 0.3)
    for k in range(L):
        fuzz[(y + k) % bh, (x + int(k * dx)) % bw] += 0.35
fuzz = np.asarray(Image.fromarray(np.clip(fuzz * 80, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.4)), np.float32) / 255
skin = skin * (1 - 0.05 * fuzz[..., None]) + np.array([236, 200, 186]) * (0.05 * fuzz[..., None])
alb[y0:y1, x0:x1] = np.clip(skin, 0, 255)
height[y0:y1, x0:x1] = 0.5 - 0.16 * crease - 0.05 * fine - 0.025 * (pore > 0.82)

# --- snout: warmer, tighter pores, even, slightly rosier ---
sx0, sy0, sx1, sy1 = int(0.72 * W), 0, W, int(0.40 * H)
sw, sh = sx1 - sx0, sy1 - sy0
sn = noise(sh, sw, 20, 4, 44)
sn2 = noise(sh, sw, 4, 1, 45)
snout = np.array([255, 214, 202], np.float32) * (0.98 + 0.04 * sn[..., None])
snout = snout * (1 - 0.04 * (sn2 > 0.80)[..., None])
yy, xx = np.mgrid[0:sh, 0:sw]
rad = np.sqrt(((xx - sw * 0.5) / (sw * 0.42)) ** 2 + ((yy - sh * 0.48) / (sh * 0.36)) ** 2)
snout = snout + np.array([22, 10, 8]) * (np.clip(1 - rad, 0, 1) ** 2 * 0.22)[..., None]
cr = np.clip((noise(sh, sw, 11, 2, 46) - 0.5) * 1.6, 0, 1)
alb[sy0:sy1, sx0:sx1] = np.clip(snout, 0, 255)
height[sy0:sy1, sx0:sx1] = 0.5 - 0.10 * cr - 0.04 * (sn2 > 0.74)

# --- ear inner ---
ex0, ey0, ex1, ey1 = int(0.72 * W), int(0.40 * H), W, int(0.58 * H)
ew, eh = ex1 - ex0, ey1 - ey0
en = noise(eh, ew, 16, 3, 55)
ear = np.array([232, 148, 142], np.float32) * (0.94 + 0.12 * en[..., None])
alb[ey0:ey1, ex0:ex1] = np.clip(ear, 0, 255)

# --- hooves ---
hx0, hy0, hx1, hy1 = int(0.72 * W), int(0.58 * H), W, int(0.74 * H)
hw, hh = hx1 - hx0, hy1 - hy0
hn = noise(hh, hw, 10, 3, 66)
hoof = np.array([48, 34, 28], np.float32) * (0.88 + 0.24 * hn[..., None])
for i in range(50):
    x = int(rng.integers(0, hw))
    hoof[:, x % hw] *= rng.uniform(0.88, 1.08)
alb[hy0:hy1, hx0:hx1] = np.clip(hoof, 0, 255)

# --- eye: brown iris, small sclera, highlight ---
ix0, iy0, ix1, iy1 = 0, int(0.78 * H), int(0.36 * W), H
iw, ih = ix1 - ix0, iy1 - iy0
eye = np.zeros((ih, iw, 3), np.float32)
yy, xx = np.mgrid[0:ih, 0:iw]
u = (xx / max(1, iw - 1)) * 2 - 1
v = (yy / max(1, ih - 1)) * 2 - 1
r = np.sqrt(u * u + v * v)
eye[:] = (230, 210, 200)
iris = (r < 0.78) & (r > 0.16)
ang = np.arctan2(v, u)
iris_col = np.array([92, 52, 28], np.float32) + np.array([40, 20, 8]) * np.cos(ang * 6 + 0.7)[..., None]
eye[iris] = iris_col[iris]
eye[(r < 0.78) & (r > 0.70)] = (36, 20, 12)
eye[r < 0.20] = (8, 5, 4)
eye[((u + 0.18) ** 2 + (v + 0.22) ** 2) < 0.012] = (255, 255, 248)
alb[iy0:iy1, ix0:ix1] = np.clip(eye, 0, 255)

# --- nostril cavity: dark warm interior, lighter rim ---
nx0, ny0, nx1, ny1 = int(0.36 * W), int(0.78 * H), int(0.64 * W), H
nw, nh = nx1 - nx0, ny1 - ny0
cav = noise(nh, nw, 8, 2, 99)
nostril = np.array([42, 16, 14], np.float32) * (0.45 + 0.9 * cav[..., None])
yy, xx = np.mgrid[0:nh, 0:nw]
radn = np.sqrt(((xx - nw / 2) / (nw * 0.5)) ** 2 + ((yy - nh / 2) / (nh * 0.5)) ** 2)
rim = np.clip((radn - 0.35) / 0.65, 0, 1)
nostril = nostril * (1 - 0.7 * rim[..., None]) + np.array([160, 80, 72], np.float32) * (0.7 * rim[..., None])
alb[ny0:ny1, nx0:nx1] = np.clip(nostril, 0, 255)
height[ny0:ny1, nx0:nx1] = 0.22 + 0.35 * radn

# lid flesh
lx0, ly0, lx1, ly1 = int(0.64 * W), int(0.78 * H), W, H
lw, lh = lx1 - lx0, ly1 - ly0
ln = noise(lh, lw, 14, 3, 111)
lid = np.array([244, 200, 188], np.float32) * (0.96 + 0.08 * ln[..., None])
alb[ly0:ly1, lx0:lx1] = np.clip(lid, 0, 255)

# Flush buzz-cut in a known island of the skin tile (top centre). Soft
# hairline into pink — never a hard black cap, never a body-wide splat.
def paint_stubble_island(alb, height):
    u0, v0, u1, v1 = UV('skin')
    # island in unit-skin space, then to pixels
    su0, sv0, su1, sv1 = 0.28, 0.84, 0.72, 0.995
    x0 = int((u0 + su0 * (u1 - u0)) * W); x1 = int((u0 + su1 * (u1 - u0)) * W)
    y0 = int((v0 + sv0 * (v1 - v0)) * H); y1 = int((v0 + sv1 * (v1 - v0)) * H)
    if x1 <= x0 or y1 <= y0:
        return
    rw, rh = x1 - x0, y1 - y0
    yy, xx = np.mgrid[0:rh, 0:rw]
    cx, cy = rw / 2, rh / 2
    rad = 0.46 * min(rw, rh)
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / max(rad, 1)
    mask = np.clip(1.0 - dist, 0, 1)
    mask = mask ** 0.7
    # fiber field
    fib = np.zeros((rh, rw), np.float32)
    rloc = np.random.default_rng(77)
    for i in range(2200):
        ang = rloc.random() * 2 * math.pi
        rr = rad * math.sqrt(rloc.random())
        x = int(cx + math.cos(ang) * rr); y = int(cy + math.sin(ang) * rr)
        if not (0 <= x < rw and 0 <= y < rh):
            continue
        L = int(rloc.integers(2, 5)); dx = rloc.normal(0, 0.3)
        for k in range(L):
            yy2 = min(rh - 1, max(0, y + k))
            xx2 = min(rw - 1, max(0, x + int(k * dx)))
            fib[yy2, xx2] += 1.0
    fib = np.asarray(Image.fromarray(np.clip(fib * 40, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5)), np.float32) / 255
    base_h = np.array([132, 102, 84], np.float32)
    lit_h = np.array([168, 132, 108], np.float32)
    hair = base_h * (1 - 0.50 * fib[..., None]) + lit_h * (0.50 * fib[..., None])
    m = mask[..., None]
    patch = alb[y0:y1, x0:x1]
    alb[y0:y1, x0:x1] = patch * (1 - 0.62 * m) + hair * (0.62 * m)
    height[y0:y1, x0:x1] = height[y0:y1, x0:x1] * (1 - 0.3 * mask) + (0.58 + 0.16 * fib) * (0.3 * mask)

paint_stubble_island(alb, height)
alb = np.clip(alb, 0, 255)

def height_to_normal_ao(h, strength=2.0):
    h_img = Image.fromarray(np.clip(h * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.9))
    h2 = np.asarray(h_img, np.float32) / 255.0
    dy, dx = np.gradient(h2)
    n = np.stack([-dx * strength, dy * strength, np.ones_like(h2)], -1)
    n /= np.maximum(np.linalg.norm(n, axis=-1, keepdims=True), 1e-6)
    nmap = np.clip(n * 0.5 + 0.5, 0, 1) * 255
    ao = np.clip(0.90 + 0.16 * h2, 0.84, 1.0)
    ao = np.asarray(Image.fromarray((ao * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), np.float32)
    return nmap, np.stack([ao, ao, ao], -1)

# ---------------------------------------------------------------------------
# Geometry
# ---------------------------------------------------------------------------
P, N, UVS, JIDX, JW, IDX = [], [], [], [], [], []

def emit(pos, nor, uv, joints, weights, tris):
    b = len(P)
    P.extend(pos); N.extend(nor); UVS.extend(uv); JIDX.extend(joints); JW.extend(weights)
    for a, c, d in tris:
        IDX.append([b + a, b + c, b + d])

def normalize(v):
    n = np.linalg.norm(v, axis=-1, keepdims=True)
    return v / np.maximum(n, 1e-8)

BONE = {
    'Root':  np.array([0.0, 0.0, 0.0]),
    'Body':  np.array([0.0, 0.46, -0.06]),
    'Head':  np.array([0.0, 0.74, 0.12]),
    'Snout': np.array([0.0, 0.50, 0.46]),
    'EarL':  np.array([-0.18, 0.90, 0.06]),
    'EarR':  np.array([ 0.18, 0.90, 0.06]),
    'Tail':  np.array([0.0, 0.54, -0.44]),
    'LegFL': np.array([-0.15, 0.16,  0.14]),
    'LegFR': np.array([ 0.15, 0.16,  0.14]),
    'LegBL': np.array([-0.16, 0.16, -0.16]),
    'LegBR': np.array([ 0.16, 0.16, -0.16]),
}
BONE_ORDER = ['Root','Body','Head','Snout','EarL','EarR','Tail','LegFL','LegFR','LegBL','LegBR']
BONE_I = {n: i for i, n in enumerate(BONE_ORDER)}
PARENT = {'Root': None, 'Body': 'Root', 'Head': 'Body', 'Snout': 'Head',
          'EarL': 'Head', 'EarR': 'Head', 'Tail': 'Body',
          'LegFL': 'Body', 'LegFR': 'Body', 'LegBL': 'Body', 'LegBR': 'Body'}

def jw(*pairs):
    js = [0, 0, 0, 0]; ws = [0, 0, 0, 0]; s = 0.0
    for i, (n, w) in enumerate(pairs[:4]):
        js[i] = BONE_I[n]; ws[i] = w; s += w
    if s <= 0: ws[0] = 1
    else: ws = [w / s for w in ws]
    return js, ws

def skin_of(p, default='Body'):
    y, z, x = p[1], p[2], p[0]
    for name, hip in (('LegFL', BONE['LegFL']), ('LegFR', BONE['LegFR']),
                      ('LegBL', BONE['LegBL']), ('LegBR', BONE['LegBR'])):
        if y < 0.26 and np.hypot(x - hip[0], z - hip[2]) < 0.14:
            return jw((name, 1))
    if z < -0.40 and y > 0.32:
        return jw(('Tail', 0.9), ('Body', 0.1))
    if y > 0.82 and abs(x) > 0.12 and -0.06 < z < 0.22:
        return jw(('EarL' if x < 0 else 'EarR', 0.85), ('Head', 0.15))
    if z > 0.34:
        return jw(('Snout', 0.85), ('Head', 0.15))
    if z > 0.00 and y > 0.64:
        return jw(('Head', 0.9), ('Body', 0.1))
    return jw((default, 1))

def ray_ellipsoid(o, d, c, r):
    q = (np.asarray(o, np.float32) - np.asarray(c, np.float32)) / r
    u = np.asarray(d, np.float32) / r
    A = float(np.dot(u, u)); B = 2.0 * float(np.dot(q, u)); C = float(np.dot(q, q) - 1.0)
    if A < 1e-12: return None
    disc = B * B - 4 * A * C
    if disc < 0: return None
    s = math.sqrt(disc)
    ts = [t for t in ((-B - s) / (2 * A), (-B + s) / (2 * A)) if t > 1e-6]
    return max(ts) if ts else None

def body_uv(p):
    x, y, z = float(p[0]), float(p[1]), float(p[2])
    # Crown: small island at the top of the skin tile (stubble is painted there).
    cr = math.hypot(x, z - 0.08)
    if y > 0.86 and cr < 0.13:
        u = 0.50 + 0.16 * np.clip(x / 0.13, -1, 1)
        v = 0.90 + 0.08 * np.clip((z - 0.08) / 0.13, -1, 1)
        return map_uv(float(np.clip(u, 0, 1)), float(np.clip(v, 0, 1)), 'skin')
    # Body: cylindrical, continuous. Keep v out of the stubble island.
    u = (math.atan2(x, z + 0.08) / (2 * math.pi)) % 1.0
    v = 0.06 + 0.78 * np.clip((y - 0.08) / 0.86, 0, 1)
    return map_uv(float(u), float(v), 'skin')

def snout_uv(p):
    x, y, z = float(p[0]), float(p[1]), float(p[2])
    u = 0.5 + 0.5 * np.clip(x / 0.40, -1, 1)
    v = 0.5 + 0.5 * np.clip((y - 0.50) / 0.32, -1, 1)
    return map_uv(float(u), float(v), 'snout')

def latlong_sphere(c, r, seg=32, ring=20, squash=(1, 1, 1), deform=None, region='skin', uv_fn=None):
    r = np.array(r, np.float32) * np.array(squash, np.float32)
    pos, nor, uv, J, Wts, tris = [], [], [], [], [], []
    for i in range(ring + 1):
        th = math.pi * i / ring
        st, ct = math.sin(th), math.cos(th)
        for k in range(seg + 1):
            ph = 2 * math.pi * k / seg
            d = np.array([st * math.cos(ph), ct, st * math.sin(ph)], np.float32)
            p = np.array(c, np.float32) + d * r
            if deform is not None:
                p = deform(p, d, i / ring, k / seg)
            pos.append(p); nor.append(d)
            if uv_fn:
                uv.append(uv_fn(p))
            elif region == 'earin' or region == 'skin' or region == 'lid':
                uv.append(map_uv(k / seg, i / ring, region))
            else:
                uv.append(map_uv(k / seg, i / ring, region))
            js, ws = skin_of(p)
            J.append(js); Wts.append(ws)
    for i in range(ring):
        for k in range(seg):
            a = i * (seg + 1) + k
            b = a + seg + 1
            tris += [(a, b, a + 1), (a + 1, b, b + 1)]
    emit(pos, nor, uv, J, Wts, tris)

def cylinder(c0, c1, r0, r1, seg=16, region='skin', bone=None, rings=5):
    axis = np.array(c1, np.float32) - np.array(c0, np.float32)
    L = float(np.linalg.norm(axis))
    if L < 1e-6: return
    az = axis / L
    tmp = np.array([0, 1, 0], np.float32) if abs(az[1]) < 0.9 else np.array([1, 0, 0], np.float32)
    ax = np.cross(tmp, az); ax /= np.linalg.norm(ax)
    ay = np.cross(az, ax)
    pos, nor, uv, J, Wts, tris = [], [], [], [], [], []
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

def disk(c, nrm, r, seg=20, region='hoof', bone='Snout', oval=(1, 1)):
    nrm = np.array(nrm, np.float32); nrm /= np.linalg.norm(nrm)
    tmp = np.array([0, 1, 0], np.float32) if abs(nrm[1]) < 0.9 else np.array([1, 0, 0], np.float32)
    ax = np.cross(tmp, nrm); ax /= np.linalg.norm(ax)
    ay = np.cross(nrm, ax)
    js, ws = jw((bone, 1))
    pos, nor, uv, J, Wts = [c], [nrm], [map_uv(0.5, 0.5, region)], [js], [ws]
    for k in range(seg + 1):
        ph = 2 * math.pi * k / seg
        d = ax * math.cos(ph) * oval[0] + ay * math.sin(ph) * oval[1]
        pos.append(np.array(c, np.float32) + d * r); nor.append(nrm)
        uv.append(map_uv(0.5 + 0.5 * math.cos(ph), 0.5 + 0.5 * math.sin(ph), region))
        J.append(js); Wts.append(ws)
    emit(pos, nor, uv, J, Wts, [(0, k, k + 1) for k in range(1, seg + 1)])

def comma_nostril(side, c, nrm, rx, ry, depth=0.045, seg=22, rings=10, bone='Snout'):
    nrm = np.array(nrm, np.float32); nrm /= np.linalg.norm(nrm)
    outward = np.array([float(side), 0.0, 0.0], np.float32)
    outward = outward - nrm * float(np.dot(outward, nrm))
    lo = float(np.linalg.norm(outward))
    ax = outward / lo if lo > 1e-6 else np.array([1.0, 0.0, 0.0], np.float32)
    ay = np.cross(nrm, ax); ay /= np.linalg.norm(ay)
    if ay[1] < 0:
        ay = -ay; ax = -ax
    if float(np.dot(np.cross(ax, ay), nrm)) < 0:
        ax = -ax
    js, ws = jw((bone, 1))
    pos, nor, uv, J, Wts, tris = [], [], [], [], [], []

    def rim(k):
        th = 2 * math.pi * k / seg
        v = math.cos(th); u = math.sin(th)
        # comma: wide head up/in, tail down and out
        ru = rx * (0.72 + 0.85 * max(0.0, -v) + 0.22 * max(0.0, u * side * -1 if False else u))
        rv = ry * (0.80 + 0.55 * max(0.0, -v))
        u_off = 0.55 * rx * max(0.0, -v)
        return ax * (u * ru + u_off) + ay * (v * rv)

    for i in range(rings + 1):
        t = i / rings
        thb = t * math.pi / 2
        scale = math.cos(thb)
        back = -nrm * (depth * math.sin(thb))
        for k in range(seg + 1):
            dlt = rim(k)
            p = np.array(c, np.float32) + dlt * scale + back
            radial = dlt / (np.linalg.norm(dlt) + 1e-8)
            n = radial * math.cos(thb) + nrm * math.sin(thb)
            pos.append(p); nor.append(n)
            uv.append(map_uv(k / seg, t, 'snout' if t < 0.22 else 'nostril'))
            J.append(js); Wts.append(ws)
    for i in range(rings):
        for k in range(seg):
            a = i * (seg + 1) + k
            b = a + seg + 1
            tris += [(a, a + 1, b), (a + 1, b + 1, b)]
    i0, i1, i2 = tris[0]
    fn = np.cross(np.asarray(pos[i1]) - pos[i0], np.asarray(pos[i2]) - pos[i0])
    if float(np.dot(fn, nrm)) < 0:
        tris = [(a, c, b) for (a, b, c) in tris]
        nor = [-np.asarray(n) for n in nor]
    emit(pos, nor, uv, J, Wts, tris)

# ---- implicit balloon body + high head + convex snout + bridge ----
ORIGIN = np.array([0.0, 0.52, 0.04], np.float32)
BODY_E   = (np.array([0.0, 0.48, -0.14], np.float32), np.array([0.44, 0.36, 0.38], np.float32))
HEAD_E   = (np.array([0.0, 0.78,  0.14], np.float32), np.array([0.20, 0.15, 0.17], np.float32))
SNOUT_E  = (np.array([0.0, 0.48,  0.40], np.float32), np.array([0.40, 0.23, 0.32], np.float32))
BRIDGE_E = (np.array([0.0, 0.66,  0.30], np.float32), np.array([0.26, 0.18, 0.24], np.float32))
CHEEK_L  = (np.array([-0.22, 0.50, 0.20], np.float32), np.array([0.16, 0.16, 0.18], np.float32))
CHEEK_R  = (np.array([ 0.22, 0.50, 0.20], np.float32), np.array([0.16, 0.16, 0.18], np.float32))
# Body+head+bridge+cheeks. The snout face is a separate cap.
ELLIPSOIDS = (BODY_E, HEAD_E, BRIDGE_E, CHEEK_L, CHEEK_R)

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
    valid = [x for x in ts if x is not None]
    if len(valid) >= 2:
        valid.sort(reverse=True)
        diff = valid[0] - valid[1]
        t += 0.055 * math.exp(-(diff * diff) / (2 * 0.065 * 0.065))
    p = origin + direction * t
    x, y, z = float(p[0]), float(p[1]), float(p[2])

    # keep a belly gap so legs read
    if y < 0.20:
        p[1] = max(0.12, y)
        y = float(p[1])

    # convex disc face: compress only the tip, never invert
    z_cap = 0.72
    if z > z_cap:
        p[2] = z_cap + (z - z_cap) * 0.28
        z = float(p[2])

    # shallow midline between nostrils
    if z > 0.60 and abs(x) < 0.06:
        p[2] -= 0.006 * math.exp(-(x * x) / (2 * 0.03 * 0.03))

    # barely flatten the crown so stubble sits flush, no slot
    cr = math.hypot(x, z - 0.08)
    if cr < 0.10 and y > 0.92:
        p[1] = 0.915 + (y - 0.915) * 0.35
        y = float(p[1])

    # inward fat-roll valleys on the body
    if z < 0.38:
        for y0, amp, sig in ((0.24, 0.020, 0.036), (0.36, 0.024, 0.038),
                             (0.48, 0.022, 0.038), (0.60, 0.016, 0.036)):
            dy = p[1] - y0
            w = math.exp(-(dy * dy) / (2 * sig * sig))
            if w < 0.03: continue
            radial = np.array([p[0], 0.0, p[2] + 0.14], np.float32)
            rn = float(np.linalg.norm(radial))
            if rn < 1e-5: continue
            p = p - radial / rn * (amp * w)

    # chin / snout-base folds
    for z0, amp, sig, yaxis in ((0.30, 0.018, 0.034, 0.46), (0.18, 0.016, 0.034, 0.48), (0.08, 0.012, 0.034, 0.50)):
        dz = p[2] - z0
        w = math.exp(-(dz * dz) / (2 * sig * sig))
        if w < 0.03: continue
        radial = np.array([p[0], p[1] - yaxis, 0.0], np.float32)
        rn = float(np.linalg.norm(radial))
        if rn < 1e-5: continue
        p = p - radial / rn * (amp * w)

    # eye sockets + hanging brow
    for sx in (-0.055, 0.055):
        ec = np.array([sx, 0.805, 0.28], np.float32)
        rel = p - ec
        d2 = (rel[0] / 0.040) ** 2 + (rel[1] / 0.028) ** 2 + (rel[2] / 0.032) ** 2
        if d2 < 1.3:
            k = max(0.0, 1.0 - d2 / 1.3)
            p = p - np.array([0.0, 0.0, 0.024], np.float32) * k
        bc = np.array([sx, 0.824, 0.285], np.float32)
        rel = p - bc
        d2 = (rel[0] / 0.038) ** 2 + (rel[1] / 0.015) ** 2 + (rel[2] / 0.024) ** 2
        if d2 < 1.2:
            k = max(0.0, 1.0 - d2 / 1.2)
            p = p + np.array([0.0, 0.006, 0.012], np.float32) * k

    # shallow nostril recesses (cavities carry the depth)
    for sx in (-0.085, 0.085):
        nc = np.array([sx, 0.49, 0.70], np.float32)
        rel = p - nc
        d2 = (rel[0] / 0.040) ** 2 + (rel[1] / 0.055) ** 2 + (rel[2] / 0.030) ** 2
        if d2 < 1.2:
            k = max(0.0, 1.0 - d2 / 1.2)
            p = p - np.array([0.007 * math.copysign(1, sx), 0.004, 0.016], np.float32) * (k * k)

    # jowl sag
    x, y, z = float(p[0]), float(p[1]), float(p[2])
    if y < 0.48 and abs(x) > 0.10 and 0.05 < z < 0.52:
        p[0] += math.copysign(0.020, x)
        p[1] -= 0.014
    return p

latlong_sphere(ORIGIN, (0.52, 0.50, 0.64), seg=64, ring=52, deform=pig_deform, uv_fn=body_uv)

def latlong_cap(c, r, seg=40, ring=20, uv_fn=None, bone='Snout'):
    """Convex +Z cap (hemisphere of the ellipsoid), welded into the bridge."""
    c = np.array(c, np.float32); r = np.array(r, np.float32)
    pos, nor, uv, J, Wts, tris = [], [], [], [], [], []
    for i in range(ring + 1):
        th = (math.pi * 0.72) * i / ring  # past the equator; rim sits inside the head
        st, ct = math.sin(th), math.cos(th)
        for k in range(seg + 1):
            ph = 2 * math.pi * k / seg
            d = np.array([st * math.cos(ph), st * math.sin(ph), ct], np.float32)
            fall = i / ring  # 0 at the tip, 1 at the buried rim
            rr = r * np.array([1.0 - 0.55 * fall ** 1.15, 1.0 - 0.30 * fall, 1.0], np.float32)
            p = c + d * rr
            # keep the tip convex (shallow cap, not a funnel)
            if p[2] > c[2] + r[2] * 0.72:
                p[2] = c[2] + r[2] * 0.72 + (p[2] - (c[2] + r[2] * 0.72)) * 0.35
            if p[2] > c[2] + r[2] * 0.4 and abs(p[0]) < 0.06:
                p[2] -= 0.008 * math.exp(-(p[0] * p[0]) / (2 * 0.03 * 0.03))
            pos.append(p); nor.append(d)
            uv.append(uv_fn(p) if uv_fn else map_uv(k / seg, i / ring, 'snout'))
            js, ws = jw((bone, 0.9), ('Head', 0.1))
            J.append(js); Wts.append(ws)
    for i in range(ring):
        for k in range(seg):
            a = i * (seg + 1) + k
            b = a + seg + 1
            tris += [(a, b, a + 1), (a + 1, b, b + 1)]
    emit(pos, nor, uv, J, Wts, tris)

latlong_cap(SNOUT_E[0], SNOUT_E[1], seg=44, ring=22, uv_fn=snout_uv)

# ---- leaf-shaped ears ----
def ear(side):
    # base at the hairline, blade up / slightly out / a little back
    base = np.array([side * 0.16, 0.88, 0.08], np.float32)
    tip  = np.array([side * 0.22, 0.98, 0.00], np.float32)
    # flattened ellipsoid along base-tip
    c = (base + tip) * 0.5
    def ear_deform(p, d, v, u, s=side):
        # stretch up-out, flatten on Z, slight curl
        q = p.copy()
        q[0] = c[0] + (p[0] - c[0]) * 1.15
        q[1] = c[1] + (p[1] - c[1]) * 1.25
        q[2] = c[2] + (p[2] - c[2]) * 0.55
        q[2] -= 0.01 * ((p[1] - base[1]) / 0.12)
        return q
    latlong_sphere(c, (0.045, 0.055, 0.022), seg=14, ring=10, deform=ear_deform, region='skin')
    # inner pink
    latlong_sphere(c + np.array([side * 0.006, 0.0, 0.008], np.float32),
                   (0.028, 0.036, 0.010), seg=10, ring=7, region='earin')
ear(-1); ear(1)

# ---- comma nostrils on the disc face ----
def snout_z(x, y):
    c, r = SNOUT_E
    a = ((x - c[0]) / r[0]) ** 2 + ((y - c[1]) / r[1]) ** 2
    if a >= 0.95:
        return None
    z = c[2] + r[2] * math.sqrt(max(0.0, 1.0 - a))
    zlim = c[2] + r[2] * 0.72
    if z > zlim:
        z = zlim + (z - zlim) * 0.35
    return z

for sx in (-0.090, 0.090):
    z = snout_z(sx, 0.465)
    print('nostril', sx, 'z', z)
    comma_nostril(int(math.copysign(1, sx)),
                  np.array([sx, 0.468, (z or 0.68) + 0.012], np.float32),
                  np.array([0.05 * math.copysign(1, sx), -0.10, 1.0], np.float32),
                  rx=0.034, ry=0.055, depth=0.055, seg=24, rings=12)

# ---- heavy-lidded brown eyes ----
def eyeball(side):
    c = np.array([side * 0.052, 0.812, 0.310], np.float32)
    seg, ring, r = 16, 12, 0.024
    pos, nor, uv, J, Wts, tris = [], [], [], [], [], []
    js, ws = jw(('Head', 1))
    for i in range(ring + 1):
        th = math.pi * i / ring
        st, ct = math.sin(th), math.cos(th)
        for k in range(seg + 1):
            ph = 2 * math.pi * k / seg
            d = np.array([st * math.cos(ph), ct, st * math.sin(ph)], np.float32)
            p = c + d * r
            pos.append(p); nor.append(d)
            fu = 0.5 + 0.48 * d[0] / max(0.2, d[2] + 0.85)
            fv = 0.5 - 0.48 * d[1] / max(0.2, d[2] + 0.85)
            uv.append(map_uv(float(np.clip(fu, 0, 1)), float(np.clip(fv, 0, 1)), 'eye'))
            J.append(js); Wts.append(ws)
    for i in range(ring):
        for k in range(seg):
            a = i * (seg + 1) + k
            b = a + seg + 1
            tris += [(a, b, a + 1), (a + 1, b, b + 1)]
    emit(pos, nor, uv, J, Wts, tris)
    # heavy upper lid covers the top third
    latlong_sphere(c + np.array([0.0, 0.011, 0.006], np.float32),
                   (0.022, 0.011, 0.016), seg=12, ring=7, region='lid')
    latlong_sphere(c + np.array([0.0, -0.014, 0.006], np.float32),
                   (0.016, 0.006, 0.011), seg=10, ring=5, region='lid')
eyeball(-1); eyeball(1)

# ---- short pink legs that start inside the belly, hooves on y=0 ----
for name, hip in (('LegFL', BONE['LegFL']), ('LegFR', BONE['LegFR']),
                  ('LegBL', BONE['LegBL']), ('LegBR', BONE['LegBR'])):
    top = np.array([hip[0], 0.22, hip[2]], np.float32)
    ankle = np.array([hip[0] * 1.05, 0.055, hip[2] + 0.010], np.float32)
    hoof_c = np.array([hip[0] * 1.06, 0.022, hip[2] + 0.016], np.float32)
    sole = np.array([hip[0] * 1.06, 0.0, hip[2] + 0.018], np.float32)
    cylinder(top, ankle, 0.032, 0.022, seg=14, region='leg', bone=name, rings=6)
    cylinder(ankle, sole, 0.022, 0.024, seg=12, region='hoof', bone=name, rings=3)
    # cloven sole
    sx = 0.010
    disk(sole + np.array([-sx, 0.001, 0.004]), (0, 1, 0), 0.012, seg=8, region='hoof', bone=name)
    disk(sole + np.array([ sx, 0.001, 0.004]), (0, 1, 0), 0.012, seg=8, region='hoof', bone=name)

# ---- clearly curly tail ----
tail_pts = []
for i in range(14):
    tt = i / 13
    ang = tt * math.pi * 3.2
    tail_pts.append(np.array([
        0.045 * math.sin(ang),
        0.56 + 0.05 * math.sin(ang) + 0.02 * tt,
        -0.46 - 0.10 * tt + 0.02 * math.cos(ang)
    ], np.float32))
for i in range(len(tail_pts) - 1):
    r0 = 0.018 * (1 - 0.4 * i / 13)
    r1 = 0.018 * (1 - 0.4 * (i + 1) / 13)
    cylinder(tail_pts[i], tail_pts[i + 1], r0, r1, seg=10, region='skin', bone='Tail', rings=2)

# ---------------------------------------------------------------------------
# Pack
# ---------------------------------------------------------------------------
P = np.asarray(P, np.float32)
N = np.asarray(N, np.float32)
UVS = np.asarray(UVS, np.float32)
JN = np.asarray(JIDX, np.uint8)
WT = np.asarray(JW, np.float32)
I = np.asarray(IDX, np.uint32)

# plant hooves exactly on y=0 (shift the whole rig/mesh together)
ymin = float(P[:, 1].min())
if abs(ymin) > 1e-5:
    P[:, 1] -= ymin
    for k in BONE:
        BONE[k] = BONE[k].copy(); BONE[k][1] -= ymin

nmap, aomap = height_to_normal_ao(height, strength=2.0)
# slight sharpen of albedo after the stamp
tex = Image.fromarray(np.clip(alb, 0, 255).astype(np.uint8))
tex = tex.filter(ImageFilter.UnsharpMask(radius=0.7, percent=24, threshold=2))
alb = np.asarray(tex, np.float32)
nimg = Image.fromarray(nmap.astype(np.uint8))
aimg = Image.fromarray(aomap.astype(np.uint8))

accn = np.zeros_like(P)
v0, v1, v2 = P[I[:, 0]], P[I[:, 1]], P[I[:, 2]]
fn = normalize(np.cross(v1 - v0, v2 - v0))
for k in range(3):
    np.add.at(accn, I[:, k], fn)
N = normalize(accn)

tan = np.zeros_like(P)
for i0, i1, i2 in I:
    p0, p1, p2 = P[i0], P[i1], P[i2]
    w0, w1, w2 = UVS[i0], UVS[i1], UVS[i2]
    e1, e2 = p1 - p0, p2 - p0
    s1, t1 = w1[0] - w0[0], w1[1] - w0[1]
    s2, t2 = w2[0] - w0[0], w2[1] - w0[1]
    denom = s1 * t2 - s2 * t1
    if abs(denom) < 1e-8: continue
    T = (e1 * t2 - e2 * t1) / denom
    tan[i0] += T; tan[i1] += T; tan[i2] += T
T4 = np.zeros((len(P), 4), np.float32)
for i in range(len(P)):
    n = N[i]; t = tan[i]
    t = t - n * np.dot(n, t)
    ln = float(np.linalg.norm(t))
    if ln < 1e-8:
        t = np.array([1, 0, 0], np.float32) if abs(n[0]) < 0.9 else np.array([0, 1, 0], np.float32)
        t = t - n * np.dot(n, t)
        ln = float(np.linalg.norm(t)) + 1e-8
    t = t / ln
    T4[i] = [t[0], t[1], t[2], 1.0]

ntris = len(I)
print('tris', ntris, 'verts', len(P),
      'height', float(P[:, 1].max() - P[:, 1].min()),
      'lenZ', float(P[:, 2].max() - P[:, 2].min()),
      'width', float(P[:, 0].max() - P[:, 0].min()),
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

def quat_axis(axis, a):
    axis = np.asarray(axis, np.float32)
    axis = axis / (float(np.linalg.norm(axis)) + 1e-8)
    s = math.sin(a / 2)
    return np.array([axis[0] * s, axis[1] * s, axis[2] * s, math.cos(a / 2)], np.float32)

# walk: 1.2s, diagonal gait, slight body bob and head nod
n_w = 13
tt_w = np.linspace(0, 1.2, n_w).astype(np.float32)
amp = 0.42
leg_ch = {}
for name, phase in (('LegFL', 0), ('LegBR', 0), ('LegFR', math.pi), ('LegBL', math.pi)):
    qs = np.stack([quat_axis((1, 0, 0), amp * math.sin(2 * math.pi * (t / 1.2) + phase)) for t in tt_w])
    leg_ch[name] = qs
body_t = np.stack([
    np.array([0.0, float(nodes_t[BONE_I['Body']][1] + 0.012 * math.sin(2 * math.pi * (t / 1.2) * 2)), 0.0], np.float32)
    for t in tt_w
])
head_q = np.stack([quat_axis((1, 0, 0), -0.08 * math.sin(2 * math.pi * (t / 1.2) * 2)) for t in tt_w])
tail_q = np.stack([quat_axis((0, 1, 0), 0.18 * math.sin(2 * math.pi * (t / 1.2))) for t in tt_w])

# idle: 2s breath / ear / tail
n_i = 9
tt_i = np.linspace(0, 2.0, n_i).astype(np.float32)
body_i = np.stack([
    np.array([0.0, float(nodes_t[BONE_I['Body']][1] + 0.006 * math.sin(2 * math.pi * (t / 2.0))), 0.0], np.float32)
    for t in tt_i
])
head_i = np.stack([quat_axis((1, 0, 0), -0.03 * math.sin(2 * math.pi * (t / 2.0))) for t in tt_i])
tail_i = np.stack([quat_axis((0, 0, 1), 0.10 * math.sin(2 * math.pi * (t / 2.0))) for t in tt_i])
earL_i = np.stack([quat_axis((0, 0, 1), 0.06 * math.sin(2 * math.pi * (t / 2.0) + 0.4)) for t in tt_i])
earR_i = np.stack([quat_axis((0, 0, 1), -0.06 * math.sin(2 * math.pi * (t / 2.0) + 0.9)) for t in tt_i])

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
    aTimeW = acc(tt_w, 5126, 'SCALAR', None, True)
    aTimeI = acc(tt_i, 5126, 'SCALAR', None, True)
    rot_acc = {n: acc(leg_ch[n], 5126, 'VEC4') for n in leg_ch}
    aBodyT = acc(body_t, 5126, 'VEC3')
    aHeadQ = acc(head_q, 5126, 'VEC4')
    aTailQ = acc(tail_q, 5126, 'VEC4')
    aBodyI = acc(body_i, 5126, 'VEC3')
    aHeadI = acc(head_i, 5126, 'VEC4')
    aTailI = acc(tail_i, 5126, 'VEC4')
    aEarLI = acc(earL_i, 5126, 'VEC4')
    aEarRI = acc(earR_i, 5126, 'VEC4')

    # Embed PNG so GLTFLoader never depends on EXT_texture_webp (the previous
    # required-webp path left map.image undefined in game).
    def img_view(im):
        tb = io.BytesIO()
        im.save(tb, 'PNG', optimize=True)
        return view(tb.getvalue())
    # slightly smaller embed: 1024 PNG fallback; runtime swaps 2k webp
    iv_a = img_view(albedo_img.resize((1024, 1024), Image.Resampling.LANCZOS))
    iv_n = img_view(normal_img.resize((1024, 1024), Image.Resampling.LANCZOS))
    iv_o = img_view(ao_img.resize((1024, 1024), Image.Resampling.LANCZOS))

    nodes = [{'name': 'Pig3', 'children': [1, 1 + len(BONE_ORDER)]}]
    for i, name in enumerate(BONE_ORDER):
        node = {'name': name, 'translation': [float(x) for x in nodes_t[i]]}
        ch = [BONE_I[n] + 1 for n in BONE_ORDER if PARENT[n] == name]
        if ch: node['children'] = ch
        nodes.append(node)
    nodes.append({'name': 'PigMesh', 'mesh': 0, 'skin': 0})

    def anim(name, time_acc, chans):
        samplers, channels = [], []
        for node, path, out_acc in chans:
            samplers.append({'input': time_acc, 'output': out_acc, 'interpolation': 'LINEAR'})
            channels.append({'sampler': len(samplers) - 1, 'target': {'node': node, 'path': path}})
        return {'name': name, 'channels': channels, 'samplers': samplers}

    walk_ch = [(BONE_I[n] + 1, 'rotation', rot_acc[n]) for n in rot_acc]
    walk_ch += [(BONE_I['Body'] + 1, 'translation', aBodyT),
                (BONE_I['Head'] + 1, 'rotation', aHeadQ),
                (BONE_I['Tail'] + 1, 'rotation', aTailQ)]
    idle_ch = [(BONE_I['Body'] + 1, 'translation', aBodyI),
               (BONE_I['Head'] + 1, 'rotation', aHeadI),
               (BONE_I['Tail'] + 1, 'rotation', aTailI),
               (BONE_I['EarL'] + 1, 'rotation', aEarLI),
               (BONE_I['EarR'] + 1, 'rotation', aEarRI)]

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
            'normalTexture': {'index': 1, 'scale': 0.45},
            'occlusionTexture': {'index': 2},
        }],
        'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}],
        'animations': [anim('walk', aTimeW, walk_ch), anim('idle', aTimeI, idle_ch)],
        'accessors': accs, 'bufferViews': views,
        'images': [
            {'bufferView': iv_a, 'mimeType': 'image/png'},
            {'bufferView': iv_n, 'mimeType': 'image/png'},
            {'bufferView': iv_o, 'mimeType': 'image/png'},
        ],
        'textures': [
            {'sampler': 0, 'source': 0},
            {'sampler': 0, 'source': 1},
            {'sampler': 0, 'source': 2},
        ],
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

tex = Image.fromarray(np.clip(alb, 0, 255).astype(np.uint8))
tex_dir = OUT.parent.parent / 'tex'
tex_dir.mkdir(parents=True, exist_ok=True)
tex.save(tex_dir / 'pig3_2k.webp', 'WEBP', quality=90, method=6)
nimg.save(tex_dir / 'pig3_n_2k.webp', 'WEBP', quality=92, method=6)
aimg.save(tex_dir / 'pig3_ao_2k.webp', 'WEBP', quality=88, method=6)
print('tex', tex_dir / 'pig3_2k.webp', (tex_dir / 'pig3_2k.webp').stat().st_size)

write_glb(OUT, tex, nimg, aimg)
# QA atlas only — do not ship in the repo
tex.save(OUT.with_suffix('.atlas.png'))
print('atlas', OUT.with_suffix('.atlas.png'))
