# Glencraft original haggis model (v1.1.23): procedural mesh, rig and fur texture, made from scratch (no third party assets).
import numpy as np, struct, json, io, sys
from PIL import Image, ImageFilter
rng = np.random.default_rng(1123)
TS = int(sys.argv[2]) if len(sys.argv) > 2 else 2048
# ---------------- texture atlas: [0,0.75]x[0,1] fur, right column: skin, hoof/horn, eye, nose ----------------
def fur(w, h, base, dark, light):
    n = rng.random((h, w)).astype(np.float32)
    img = Image.fromarray((n * 255).astype(np.uint8))
    # strands: blur along v (hair flows down), plus a little sideways jitter
    s = np.asarray(img.filter(ImageFilter.BoxBlur(1)).resize((w // 4, h), Image.BILINEAR).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255
    s = np.asarray(Image.fromarray((s * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur((0.6, 6)) if False else ImageFilter.GaussianBlur(1)), np.float32) / 255
    k = np.zeros((h, w), np.float32)
    for i in range(int(w * h / 90)):   # individual hairs
        x, y = rng.integers(0, w), rng.integers(0, h); L = rng.integers(h // 40, h // 12); dx = rng.normal(0, 0.15)
        ys = np.arange(y, min(h, y + L)); xs = (x + (ys - y) * dx).astype(int) % w; k[ys, xs] += rng.uniform(0.4, 1.0) * np.linspace(1, 0.3, len(ys))
    k = np.asarray(Image.fromarray(np.clip(k * 120, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7)), np.float32) / 255
    lo = np.asarray(Image.fromarray((rng.random((h // 64, w // 64)) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), np.float32) / 255
    t = np.clip(0.45 * s + 0.75 * k + 0.25 * lo - 0.15, 0, 1)[..., None]
    col = np.array(dark) * (1 - t) + np.array(light) * t
    col = col * (0.85 + 0.3 * lo[..., None]) * np.array(base)
    return np.clip(col, 0, 255)
W, H = TS, TS; atl = np.zeros((H, W, 3), np.float32)
fw = int(W * 0.75); atl[:, :fw] = fur(fw, H, (1, 1, 1), (58, 34, 20), (196, 128, 70))
cw = W - fw; q = H // 4
def flat(c, var, y0):
    n = np.asarray(Image.fromarray((rng.random((q // 8, cw // 8)) * 255).astype(np.uint8)).resize((cw, q), Image.BICUBIC), np.float32)[..., None] / 255
    atl[y0:y0 + q, fw:] = np.clip(np.array(c) * (1 - var + 2 * var * n), 0, 255)
flat((120, 78, 70), 0.15, 0)        # skin (snout, ears inside)
flat((48, 40, 34), 0.2, q)          # hooves and horns
flat((14, 12, 12), 0.05, 2 * q)     # eyes
flat((60, 38, 36), 0.12, 3 * q)     # nose
tex = Image.fromarray(atl.astype(np.uint8))
R = {'skin': (0.75, 0.0), 'hoof': (0.75, 0.25), 'eye': (0.75, 0.5), 'nose': (0.75, 0.75)}
def ruv(k): u0, v0 = R[k]; return (u0 + 0.125, v0 + 0.125)
# ---------------- geometry ----------------
P, N, UV, J = [], [], [], []   # J = joint index
idx = []
def add(pos, nor, uv, j, tris):
    b = len(P); P.extend(pos); N.extend(nor); UV.extend(uv); J.extend([j] * len(pos)); idx.extend([[b + a, b + c, b + d] for a, c, d in tris])
def ellip(c, r, j, seg=40, ring=28, shag=0.0, region=None, vscale=1.0, droop=0.0):
    pos, nor, uv = [], [], []
    for i in range(ring + 1):
        th = np.pi * i / ring
        for k in range(seg + 1):
            ph = 2 * np.pi * k / seg; d = np.array([np.sin(th) * np.cos(ph), np.cos(th), np.sin(th) * np.sin(ph)])
            s = 1 + shag * (rng.random() * 0.6 + 0.4 * np.sin(ph * 9 + th * 7)) if 0 < i < ring and 0 < k < seg else 1 + shag * 0.7
            p = np.array(c) + d * np.array(r) * s; p[1] -= droop * max(0, d[1] * -1 + 0.3) * np.array(r)[1]
            pos.append(p); nor.append(d / np.linalg.norm(d))
            uv.append((k / seg * 0.75, i / ring * vscale) if region is None else ruv(region))
    tris = []
    for i in range(ring):
        for k in range(seg):
            a = i * (seg + 1) + k; b = a + seg + 1; tris += [(a, b, a + 1), (a + 1, b, b + 1)]
    add(pos, nor, uv, j, tris)
def tufts(c, r, j, n, L, ymin=-0.2):
    # fur locks: thin bent quads hanging off the surface (both sides drawn by a double-sided material)
    for _ in range(n):
        th = np.arccos(rng.uniform(-1, 1)); ph = rng.uniform(0, 2 * np.pi); d = np.array([np.sin(th) * np.cos(ph), np.cos(th), np.sin(th) * np.sin(ph)])
        if d[1] < ymin: continue
        base = np.array(c) + d * np.array(r) * 0.97; t = np.cross(d, [0, 1, 0]); t = t / (np.linalg.norm(t) + 1e-6) * rng.uniform(0.03, 0.06)
        ln = L * rng.uniform(0.6, 1.3); tip = base + d * ln * 0.45 + np.array([0, -ln, 0]) * (0.6 + 0.4 * max(0, d[1]))
        mid = (base + tip) / 2 + d * ln * 0.15; u = rng.uniform(0.02, 0.7); v = rng.uniform(0, 0.8)
        pos = [base - t, base + t, mid - t * 0.8, mid + t * 0.8, tip]
        uv = [(u, v), (u + 0.03, v), (u, v + 0.08), (u + 0.03, v + 0.08), (u + 0.015, v + 0.16)]
        add(pos, [d] * 5, uv, j, [(0, 2, 1), (1, 2, 3), (2, 4, 3)])
def cyl(a, b, r0, r1, j, region, seg=12):
    a, b = np.array(a), np.array(b); ax = b - a; L = np.linalg.norm(ax); ax /= L; t = np.cross(ax, [1, 0, 0]); t /= np.linalg.norm(t); s = np.cross(ax, t)
    pos, nor, uv = [], [], []
    for e, (p0, r) in enumerate([(a, r0), (b, r1)]):
        for k in range(seg + 1):
            ph = 2 * np.pi * k / seg; d = t * np.cos(ph) + s * np.sin(ph); pos.append(p0 + d * r); nor.append(d)
            uv.append(ruv(region) if region else (k / seg * 0.2 + 0.3, 0.85 + e * 0.1))
    tris = [(k, seg + 1 + k, k + 1) for k in range(seg)] + [(k + 1, seg + 1 + k, seg + 2 + k) for k in range(seg)]
    pos += [b]; nor += [ax]; uv += [ruv('hoof')]; c = len(pos) - 1; tris += [(seg + 1 + k, c, seg + 2 + k) for k in range(seg)]
    add(pos, nor, uv, j, tris)
# joints: 0 root, 1 body, 2 head, 3 legFL, 4 legFR, 5 legBL, 6 legBR (front is +z)
BODY = (0, 0.42, 0); BR = (0.36, 0.32, 0.44)
ellip(BODY, BR, 1, shag=0.10, droop=0.25)
tufts(BODY, BR, 1, 520, 0.16)
HEAD = (0, 0.5, 0.42); HR = (0.17, 0.16, 0.16)
ellip(HEAD, HR, 2, seg=28, ring=20, shag=0.06)
tufts((0, 0.55, 0.40), (0.19, 0.16, 0.17), 2, 160, 0.11, ymin=0.0)        # the highland fringe falling over the face
ellip((0, 0.45, 0.58), (0.085, 0.07, 0.06), 2, seg=16, ring=10, region='skin')  # snout
ellip((-0.035, 0.46, 0.635), (0.018, 0.014, 0.01), 2, seg=8, ring=6, region='nose'); ellip((0.035, 0.46, 0.635), (0.018, 0.014, 0.01), 2, seg=8, ring=6, region='nose')
for sx in (-1, 1):
    ellip((sx * 0.085, 0.54, 0.555), (0.024, 0.024, 0.02), 2, seg=10, ring=8, region='eye')
    # small curved horns, highland style
    pts = [np.array([sx * 0.12, 0.62, 0.42])]; d = np.array([sx * 1.0, 0.25, 0.2])
    for i in range(5): d = d + np.array([0, 0.35, 0.05]); pts.append(pts[-1] + d / np.linalg.norm(d) * 0.04)
    for i in range(5): cyl(pts[i], pts[i + 1], 0.026 * (1 - i / 5) + 0.006, 0.026 * (1 - (i + 1) / 5) + 0.004, 2, 'hoof', seg=8)
    ellip((sx * 0.16, 0.58, 0.38), (0.05, 0.025, 0.04), 2, seg=10, ring=8)      # ears
LEG = {3: (-0.17, 0.30), 4: (0.17, 0.30), 5: (-0.17, -0.28), 6: (0.17, -0.28)}
HIPY = 0.24
for j, (x, z) in LEG.items():
    cyl((x, HIPY, z), (x, 0.06, z), 0.065, 0.055, j, None); cyl((x, 0.06, z), (x, 0.0, z), 0.057, 0.06, j, 'hoof')
ellip((0, 0.5, -0.46), (0.06, 0.06, 0.06), 1, seg=10, ring=8, shag=0.2)      # tail tuft
P = np.array(P, np.float32); N = np.array(N, np.float32); N /= np.linalg.norm(N, axis=1, keepdims=True) + 1e-9; UV = np.array(UV, np.float32)
I = np.array(idx, np.uint32).ravel(); JN = np.zeros((len(P), 4), np.uint8); JN[:, 0] = J; WT = np.zeros((len(P), 4), np.float32); WT[:, 0] = 1
# ---------------- glTF ----------------
nodes_t = [(0, 0, 0), BODY, (np.array(HEAD) - np.array(BODY) - (0, 0, 0.1)).tolist()] + [(x, HIPY - BODY[1], z) for x, z in LEG.values()]
world = [np.array([0, 0, 0]), np.array(BODY), np.array(BODY) + np.array(nodes_t[2])] + [np.array([x, HIPY, z]) for x, z in LEG.values()]
names = ['Root', 'Body', 'Head', 'LegFL', 'LegFR', 'LegBL', 'LegBR']
ibm = np.zeros((7, 16), np.float32)
for i, w in enumerate(world): m = np.eye(4, dtype=np.float32); m[:3, 3] = -w; ibm[i] = m.T.ravel()
buf = io.BytesIO(); views = []; accs = []
def view(b, target=None):
    while buf.tell() % 4: buf.write(b'\0')
    o = buf.tell(); buf.write(b); v = {'buffer': 0, 'byteOffset': o, 'byteLength': len(b)}
    if target: v['target'] = target
    views.append(v); return len(views) - 1
def acc(a, ct, typ, target=None, mm=False):
    v = view(a.tobytes(), target); d = {'bufferView': v, 'componentType': ct, 'count': len(a), 'type': typ}
    if mm: d['min'] = a.min(0).tolist(); d['max'] = a.max(0).tolist()
    accs.append(d); return len(accs) - 1
aP = acc(P, 5126, 'VEC3', 34962, True); aN = acc(N, 5126, 'VEC3', 34962); aU = acc(UV, 5126, 'VEC2', 34962)
aJ = acc(JN, 5121, 'VEC4', 34962); aW = acc(WT, 5126, 'VEC4', 34962); aI = acc(I, 5125, 'SCALAR', 34963); aB = acc(ibm, 5126, 'MAT4')
tb = io.BytesIO(); tex.save(tb, 'WEBP', quality=88, method=6) if sys.argv[1].endswith('webp') else tex.save(tb, 'PNG')
# idle clip: a gentle breath on the body (the game drives the legs and head itself)
tt = np.linspace(0, 2, 9).astype(np.float32); sc = np.array([[1, 1 + 0.02 * np.sin(np.pi * t), 1] for t in tt], np.float32)
aT = acc(tt, 5126, 'SCALAR', None, True); aS = acc(sc, 5126, 'VEC3')
iv = view(tb.getvalue())
nodes = [{'name': 'Haggis', 'children': [1, 8]}, {'name': names[0], 'translation': list(nodes_t[0]), 'children': [2]}, {'name': names[1], 'translation': list(BODY), 'children': [3, 4, 5, 6, 7]}]
nodes += [{'name': names[i], 'translation': [float(x) for x in nodes_t[i]]} for i in range(2, 7)]
nodes += [{'name': 'HaggisMesh', 'mesh': 0, 'skin': 0}]
g = {'asset': {'version': '2.0', 'generator': 'Glencraft haggis_gen.py (original, CC0)'}, 'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': nodes,
     'meshes': [{'name': 'Haggis', 'primitives': [{'attributes': {'POSITION': aP, 'NORMAL': aN, 'TEXCOORD_0': aU, 'JOINTS_0': aJ, 'WEIGHTS_0': aW}, 'indices': aI, 'material': 0}]}],
     'skins': [{'joints': [1, 2, 3, 4, 5, 6, 7], 'inverseBindMatrices': aB, 'skeleton': 1}],
     'materials': [{'name': 'HaggisFur', 'doubleSided': True, 'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0, 'roughnessFactor': 0.95}}],
     'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 10497, 'wrapT': 10497}],
     'animations': [{'name': 'idle', 'channels': [{'sampler': 0, 'target': {'node': 2, 'path': 'scale'}}], 'samplers': [{'input': aT, 'output': aS, 'interpolation': 'LINEAR'}]}],
     'accessors': accs, 'bufferViews': views}
if sys.argv[1].endswith('webp'):
    g['images'] = [{'bufferView': iv, 'mimeType': 'image/webp'}]; g['textures'] = [{'sampler': 0, 'extensions': {'EXT_texture_webp': {'source': 0}}}]; g['extensionsUsed'] = ['EXT_texture_webp']; g['extensionsRequired'] = ['EXT_texture_webp']
else:
    g['images'] = [{'bufferView': iv, 'mimeType': 'image/png'}]; g['textures'] = [{'sampler': 0, 'source': 0}]
while buf.tell() % 4: buf.write(b'\0')
bb = buf.getvalue(); g['buffers'] = [{'byteLength': len(bb)}]
js = json.dumps(g).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bb)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(bb), 0x004E4942) + bb
open(sys.argv[1], 'wb').write(out); tex.save(sys.argv[1] + '.tex.png'); print(sys.argv[1], len(out), len(P), len(I) // 3)
