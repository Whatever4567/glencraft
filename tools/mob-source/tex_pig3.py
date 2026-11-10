#!/usr/bin/env python3
"""Warm-pink preprocess of the Grab3D albedo (source UVs) before bake."""
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from pathlib import Path

TEX_DIR = Path("/tmp/pig-bases/tex")
OUT_DIR = Path("/workspace/gc-phase3/assets/tex")

def main():
    albedo = Image.open(TEX_DIR / "img1.jpg").convert("RGB")
    arr = np.asarray(albedo).astype(np.float32)
    h, w, _ = arr.shape

    warm = arr.copy()
    warm[..., 0] = np.clip(arr[..., 0] * 1.07 + 6, 0, 255)
    warm[..., 1] = np.clip(arr[..., 1] * 0.98 + 2, 0, 255)
    warm[..., 2] = np.clip(arr[..., 2] * 0.90, 0, 255)

    mx = warm.max(2)
    mn = warm.min(2)
    sat = np.where(mx > 1, (mx - mn) / np.maximum(mx, 1), 0)
    val = mx / 255.0
    skin = (sat > 0.10) & (val > 0.35)

    crease = skin & (val < 0.72) & (val > 0.38)
    warm[crease, 0] *= 0.93
    warm[crease, 1] *= 0.88
    warm[crease, 2] *= 0.84

    already_dark = (arr.max(2) / 255.0) < 0.22
    warm[already_dark] = warm[already_dark] * 0.55 + np.array([36, 14, 12], dtype=np.float32)

    rng = np.random.default_rng(7)
    bristle = Image.new("L", (w, h), 0)
    dr = ImageDraw.Draw(bristle)
    ys, xs = np.nonzero(skin & (val > 0.55))
    if len(xs) > 0:
        pick = rng.choice(len(xs), size=min(12000, max(1, len(xs) // 50)), replace=False)
        for i in pick:
            x, y = int(xs[i]), int(ys[i])
            ang = float(rng.uniform(-0.5, 0.5))
            length = int(rng.integers(3, 9))
            x2 = int(x + length * np.sin(ang))
            y2 = int(y + length * np.cos(ang))
            dr.line((x, y, x2, y2), fill=int(rng.integers(80, 160)), width=1)
    bristle = bristle.filter(ImageFilter.GaussianBlur(radius=0.55))
    b = np.asarray(bristle).astype(np.float32) / 255.0
    col = np.array([52, 32, 26], dtype=np.float32)
    for c in range(3):
        warm[..., c] = warm[..., c] * (1 - 0.40 * b) + col[c] * (0.40 * b)

    out = np.clip(warm, 0, 255).astype(np.uint8)
    im = Image.fromarray(out, "RGB")
    im2 = im.resize((2048, 2048), Image.Resampling.LANCZOS)
    im1 = im.resize((1024, 1024), Image.Resampling.LANCZOS)
    TEX_DIR.mkdir(parents=True, exist_ok=True)
    im1.save(TEX_DIR / "pig3_albedo_1k.png", "PNG", optimize=True)
    im2.save(TEX_DIR / "pig3_albedo_2k.png", "PNG", optimize=True)
    # Normal / AO sidecars from the source (reused if present)
    if (TEX_DIR / "img0.jpg").exists():
        Image.open(TEX_DIR / "img0.jpg").convert("RGB").resize((2048, 2048), Image.Resampling.LANCZOS).save(
            OUT_DIR / "pig3_n_2k.webp", "WEBP", quality=90, method=6)
    if (TEX_DIR / "img2.jpg").exists():
        Image.open(TEX_DIR / "img2.jpg").convert("RGB").resize((2048, 2048), Image.Resampling.LANCZOS).split()[0].save(
            OUT_DIR / "pig3_ao_2k.webp", "WEBP", quality=90, method=6)
    print("preprocessed", out.mean(axis=(0, 1)))

if __name__ == "__main__":
    main()
