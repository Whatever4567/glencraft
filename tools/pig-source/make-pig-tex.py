#!/usr/bin/env python3
"""Shift pig2 textures slightly pinker, keep dirt on legs/belly only, add fine pore/bristle detail."""
from __future__ import annotations
import json, struct, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC4 = ROOT / "assets/tex/pig2_4k.webp"
OUT_DIR_QA = Path("/workspace/qa/pig-1248")
OUT_DIR_QA.mkdir(parents=True, exist_ok=True)

def load_glb_uv_masks(glb_path: Path, size: int):
    """Build UV masks for low body (legs/belly) from bind-pose positions."""
    data = glb_path.read_bytes()
    magic, ver, length = struct.unpack_from("<4sII", data, 0)
    chunk_len, chunk_type = struct.unpack_from("<I4s", data, 12)
    assert chunk_type == b"JSON"
    js = json.loads(data[20:20 + chunk_len])
    bin_off = 20 + chunk_len
    # pad to 4
    if bin_off % 4: bin_off += 4 - (bin_off % 4)
    # next chunk is BIN
    if bin_off + 8 <= len(data):
        blen, btype = struct.unpack_from("<I4s", data, bin_off)
        blob = data[bin_off + 8: bin_off + 8 + blen]
    else:
        return None, None

    acc, views, bufs = js["accessors"], js["bufferViews"], js["buffers"]

    def acc_data(i, typ=np.float32):
        a = acc[i]
        v = views[a["bufferView"]]
        off = (v.get("byteOffset") or 0) + (a.get("byteOffset") or 0)
        n = a["count"]
        comps = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[a["type"]]
        raw = blob[off: off + n * comps * np.dtype(typ).itemsize]
        arr = np.frombuffer(raw, dtype=typ)
        return arr.reshape(n, comps)

    # first primitive
    prim = js["meshes"][0]["primitives"][0]
    attrs = prim["attributes"]
    pos = acc_data(attrs["POSITION"])
    uv = acc_data(attrs["TEXCOORD_0"])
    # apply the armature's typical 90-deg if we can — use PCA / height from coords
    # Blender Z-up often stored with X/Z as ground. Use the smallest-extent axis as up after scale.
    # Positions here are in mesh space before armature. Inspect ranges:
    # We'll treat the axis with smallest span as... actually pig body is long.
    spans = pos.max(0) - pos.min(0)
    long_ax = int(np.argmax(spans))  # body length
    up_ax = int(np.argmin(spans)) if False else None
    # prefer Y if it looks like height
    # After looking at typical prase model: we'll compute "height" as the axis not length and not width.
    axes = [0, 1, 2]
    # length is max span, width mid, height min? For a pig standing, height and width can be similar.
    # Use the median y-like: the axis most correlated with being "below the body centre" for skinny bits (legs).
    # Legs are thinner clusters at one extreme of an axis.
    # Try each axis: legs = points in the lowest 25% that are also far from the centre in the other axes? 
    # Simpler: the "down" direction is the one where the minimum is a thin protrusion (legs).
    # Compute occupancy of the lowest 20% vs mid 20% for each axis.
    down = None
    best = -1
    for ax in range(3):
        lo, hi = pos[:, ax].min(), pos[:, ax].max()
        thr = lo + 0.22 * (hi - lo)
        low = pos[pos[:, ax] <= thr]
        # compactness: legs should be a smaller fraction
        frac = len(low) / max(1, len(pos))
        # prefer the axis where low fraction is small-ish (0.1-0.4) 
        score = (1.0 if 0.08 <= frac <= 0.45 else 0.2) * (1.0 / (spans[ax] + 1e-6))
        # actually height is often mid span. Let's just print and pick min-mean of thinness.
        if score > best:
            best = score
            down = ax
            down_frac = frac
    # If Y looks like height (positive up common in glTF after loader, but raw may be Z)
    # Fallback: use axis 1 if close.
    # We'll also build belly: near down-low AND close to the central plane of the two other axes? 
    # Belly is the underside of the wide body, not just the feet — mid-length, low on the up axis, near centre of width.
    lo, hi = pos[:, down].min(), pos[:, down].max()
    # In glTF Y-up, legs have small Y. If the model is Z-up, legs have small Z.
    # Confirm: if "down" min is legs, the lowest points should not be the snout (which is at an end of the long axis).
    height = (pos[:, down] - lo) / (hi - lo + 1e-9)
    # belly + legs: lower 40% of height
    low_mask_v = height < 0.42
    # rasters
    def stamp(mask_v, r=2):
        m = np.zeros((size, size), dtype=np.float32)
        u = np.clip((uv[mask_v, 0] * size).astype(int), 0, size - 1)
        v = np.clip(((1.0 - uv[mask_v, 1]) * size).astype(int), 0, size - 1)
        m[v, u] = 1
        # dilate a bit
        from PIL import ImageFilter as F
        im = Image.fromarray((m * 255).astype(np.uint8), "L")
        im = im.filter(F.MaxFilter(7)).filter(F.GaussianBlur(radius=3))
        return np.asarray(im).astype(np.float32) / 255.0

    legs_v = height < 0.28
    belly_v = (height < 0.45) & (height >= 0.16)
    # drop snout: ends of long axis
    la = int(np.argmax(spans))
    ln = (pos[:, la] - pos[:, la].min()) / (spans[la] + 1e-9)
    legs_v = legs_v & (ln > 0.08) & (ln < 0.95)
    belly_v = belly_v & (ln > 0.15) & (ln < 0.85)
    legs = stamp(legs_v)
    belly = stamp(belly_v)
    info = dict(down=int(down), long=int(np.argmax(spans)), spans=spans.tolist(), down_frac=float(down_frac if 'down_frac' in dir() else 0), n=len(pos))
    return legs, belly, info

def rgb_to_hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    df = mx - mn + 1e-8
    h = np.zeros_like(mx)
    mask = mx == r
    h[mask] = np.mod((g[mask] - b[mask]) / df[mask], 6)
    mask = (mx == g) & (mx != r)
    h[mask] = (b[mask] - r[mask]) / df[mask] + 2
    mask = (mx == b) & (mx != r) & (mx != g)
    h[mask] = (r[mask] - g[mask]) / df[mask] + 4
    h = h / 6.0
    s = df / (mx + 1e-8)
    s[mx == 0] = 0
    return h, s, mx

def hsv_to_rgb(h, s, v):
    h = np.mod(h, 1.0) * 6
    i = np.floor(h).astype(int)
    f = h - i
    p = v * (1 - s)
    q = v * (1 - s * f)
    t = v * (1 - s * (1 - f))
    i6 = i % 6
    r = np.choose(i6, [v, q, p, p, t, v])
    g = np.choose(i6, [t, v, v, q, p, p])
    b = np.choose(i6, [p, p, t, v, v, q])
    return np.stack([r, g, b], -1)

def main():
    img = Image.open(SRC4).convert("RGB")
    src = np.asarray(img).astype(np.float32) / 255.0
    H, W, _ = src.shape
    glb = ROOT / "assets/models/pig2.glb"
    legs, belly, info = load_glb_uv_masks(glb, W)
    print("uv mask", info)
    Image.fromarray((np.clip(legs, 0, 1) * 255).astype(np.uint8)).save(OUT_DIR_QA / "mask-legs.png")
    Image.fromarray((np.clip(belly, 0, 1) * 255).astype(np.uint8)).save(OUT_DIR_QA / "mask-belly.png")

    # Identify "skin-like" pixels (warm, not black hooves/eyes, not white highlights)
    lum = src.mean(-1)
    h, s, v = rgb_to_hsv(src)
    # orange-brown skin sits around hue 0.02-0.12
    skin = (v > 0.22) & (s > 0.12) & (lum > 0.2) & (lum < 0.92)
    # keep dark hoof / eye / metal islands as they are
    keep = ~skin

    # Shift hue toward a warm pink (hue ~ 0.01, i.e. slightly past red toward magenta? 
    # red=0, yellow=0.16, pink/magenta is 0.9-0.02. Farm pig is a rosy peach ~ hue 0.02-0.04 with a bit more blue than orange.
    # Current is more orange (~0.06). Pull hue down toward 0.02 and add a touch of blue in RGB.
    h2 = h.copy()
    # move skin hues that are too orange (0.04-0.14) toward 0.02
    h2[skin] = h[skin] * 0.45 + 0.018 * 0.55
    s2 = s.copy()
    s2[skin] = np.clip(s[skin] * 0.92 + 0.04, 0, 0.72)
    v2 = v.copy()
    v2[skin] = np.clip(v[skin] * 1.04 + 0.02, 0, 1)
    pink = hsv_to_rgb(h2, s2, v2)
    # add a little rose in the midtones
    rose = np.array([0.86, 0.58, 0.55], dtype=np.float32)
    mid = skin & (lum > 0.3) & (lum < 0.8)
    k = 0.16
    pink[mid] = pink[mid] * (1 - k) + rose * k
    out = src.copy()
    out[skin] = pink[skin]

    # Reduce muddy brown blotches on the body (not legs/belly)
    body_clean = skin & (legs < 0.25) & (belly < 0.25)
    # brown blotch: distinctly more red than blue but darker / more yellow-brown
    brown = body_clean & (src[..., 0] > src[..., 2] + 0.08) & (src[..., 1] < src[..., 0] * 0.9) & (lum < 0.55)
    # blend blotches toward local pink skin
    out[brown] = out[brown] * 0.35 + rose * 0.65
    # slight overall desmudge
    muddiness = np.clip((0.5 - lum) * 2, 0, 1) * (1.0 - np.maximum(legs, belly))
    out = out + (rose - out) * (muddiness * 0.18)[..., None]
    out[keep] = src[keep]

    # Re-apply subtle dirt on legs and belly only
    dirt_col = np.array([0.42, 0.30, 0.24], dtype=np.float32)
    dirt_amt = np.clip(legs * 0.38 + belly * 0.22, 0, 0.45)
    # noise so it's patchy, not a flat stain
    rng = np.random.RandomState(1248)
    noise = rng.randn(H, W).astype(np.float32)
    # cheap blur via box
    ksz = 11
    ker = np.ones((ksz,), dtype=np.float32) / ksz
    noise = np.apply_along_axis(lambda m: np.convolve(m, ker, mode="same"), 1, noise)
    noise = np.apply_along_axis(lambda m: np.convolve(m, ker, mode="same"), 0, noise)
    noise = (noise - noise.min()) / (noise.max() - noise.min() + 1e-8)
    patch = np.clip((noise - 0.35) * 1.6, 0, 1) * dirt_amt
    out = out * (1 - patch[..., None] * 0.85) + dirt_col * (patch[..., None] * 0.85)

    # Fine pores and bristles (detail, not blurry)
    rng2 = np.random.RandomState(811)
    pores = rng2.rand(H, W)
    pore_mask = (pores > 0.992) & skin
    out[pore_mask] *= 0.86
    # bristles: short strokes via directional noise
    yy, xx = np.mgrid[0:H, 0:W]
    brist = ((np.sin(xx * 0.9 + yy * 2.3) * 0.5 + 0.5) * (rng2.rand(H, W) > 0.65))
    brist = brist * skin * (1.0 - np.clip(legs + belly, 0, 1) * 0.5)
    out = out + (np.array([0.95, 0.90, 0.86]) - out) * (brist * 0.07)[..., None]
    # dark bristle ticks
    darkb = (rng2.rand(H, W) > 0.997) & skin
    out[darkb] *= 0.78

    out = np.clip(out, 0, 1)
    # unsharp mask for crisp pores
    pil = Image.fromarray((out * 255).astype(np.uint8), "RGB")
    blur = pil.filter(ImageFilter.GaussianBlur(radius=1.2))
    sharp = Image.fromarray(
        np.clip(np.asarray(pil).astype(np.int16) * 1.35 - np.asarray(blur).astype(np.int16) * 0.35, 0, 255).astype(np.uint8),
        "RGB",
    )
    # save textures
    dest4 = ROOT / "assets/tex/pig2_4k.webp"
    dest2 = ROOT / "assets/tex/pig2_2k.webp"
    # keep a before copy in qa
    Image.open(SRC4).convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(OUT_DIR_QA / "tex-before.png")
    sharp.save(dest4, "WEBP", quality=82, method=4)
    sharp.resize((2048, 2048), Image.Resampling.LANCZOS).save(dest2, "WEBP", quality=82, method=4)
    sharp.resize((1024, 1024), Image.Resampling.LANCZOS).save(OUT_DIR_QA / "tex-after.png")
    # average colour check
    small = np.asarray(sharp.resize((64, 64))).mean(axis=(0, 1))
    print("avg RGB after", small, "4k bytes", dest4.stat().st_size, "2k bytes", dest2.stat().st_size)
    print("done")

if __name__ == "__main__":
    main()
