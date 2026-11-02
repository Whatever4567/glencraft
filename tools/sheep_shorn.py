# Makes the sheared-sheep texture from our own sheep2 texture: wool trimmed to short stubble over pinkish skin.
import numpy as np, sys
from PIL import Image, ImageFilter
def make(src, dst):
    im = Image.open(src).convert('RGB'); n = im.size[0]
    a = np.asarray(im).astype(np.float32) / 255
    mx, mn = a.max(2), a.min(2); s = (mx - mn) / np.maximum(mx, 1e-3); L = a.mean(2)
    wool = np.clip((0.30 - s) / 0.1, 0, 1)
    yy, xx = np.mgrid[0:n, 0:n] / n
    keep = ((xx < 0.23) & (yy < 0.21)) | ((xx > 0.03) & (xx < 0.19) & (yy > 0.55) & (yy < 0.75))   # face and ear stay as painted
    wool[keep] = 0
    wool = np.asarray(Image.fromarray((wool * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(n / 512))).astype(np.float32) / 255
    blur = np.asarray(im.filter(ImageFilter.GaussianBlur(n / 48))).astype(np.float32) / 255
    detail = (L - blur.mean(2))[..., None]                     # fine curl detail, flattened to stubble
    skin = np.array([0.90, 0.76, 0.70], np.float32)
    rng = np.random.default_rng(7); sp = np.asarray(Image.fromarray((rng.random((n, n)) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32)[..., None] / 255
    stub = blur * 0.5 + skin * 0.5 + detail * 0.12 + (sp - 0.5) * 0.12
    out = a * (1 - wool[..., None]) + stub * wool[..., None]
    Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(dst, 'WEBP', quality=88, method=6)
for k in ('2k', '4k'): make(f'sheep2_{k}.webp', f'sheep2s_{k}.webp')
