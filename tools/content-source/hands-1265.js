/* GLX-HANDS1265 (v1.2.65): further pixel-sculpt detail on the classic
   1.2.57–1.2.59 __fpa hands. Adds faceted knuckle and finger segmentation,
   a thumb pad, nail tips, palm creases, and skin-tone shading in small
   faceted steps (lighter on top, warmer and darker in the creases and
   between the fingers), plus wrist tendons. The sleeve has a rolled linen
   cuff with fold facets. Skin and linen textures are generated procedurally
   (canvas, never hand-placed pixel data): a limited palette per material
   (8–32 colours) with light, mid and shadow ramps, ordered Bayer dithering
   for fake gradients and lighting, darkened dither in crevices for ambient
   occlusion, sparse specular pixels on knuckles and nails, rim lighting on
   the hand edge, and slightly darkened outlines. Linen weave is procedural
   noise plus palette quantization. Built in passes (base colour, dither
   shading, detail overlays, edges), generated once, cached, and kept at a
   mobile-friendly size. Same objects, hierarchy, pivots, per-item grips,
   hold offsets and every animation. Geometry is cached and merged so there
   are no stutter spikes. The gold D-pad is left alone.
   The first-person view-model stays hidden in third person. */
(function hands1265(W) {
  const U = W.__hands1265 = {
    on: 0, err: null, version: '1.2.65-pixel-sculpt', sculpted: 0,
    cached: 0, merged: 0, verts: 0, geos: 0, frames: 0,
    texCached: 0, palettes: null
  };
  const T = W.THREE;
  if (!T) return;
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  /* ---------- cached / merged geometry ---------- */
  const GEO = {};
  function share(key, build) {
    if (!GEO[key]) { GEO[key] = build(); U.geos++; }
    U.cached++;
    return GEO[key];
  }

  function mergeGeos(list) {
    const pos = [], nrm = [], uv = [], col = [], idx = [];
    let base = 0, hasCol = false;
    for (let g = 0; g < list.length; g++) {
      const geo = list[g];
      if (!geo) continue;
      const p = geo.getAttribute('position');
      if (!p) continue;
      const n = geo.getAttribute('normal');
      const u = geo.getAttribute('uv');
      const c = geo.getAttribute('color');
      if (c) hasCol = true;
      for (let i = 0; i < p.count; i++) {
        pos.push(p.getX(i), p.getY(i), p.getZ(i));
        if (n) nrm.push(n.getX(i), n.getY(i), n.getZ(i));
        else nrm.push(0, 1, 0);
        if (u) uv.push(u.getX(i), u.getY(i));
        else uv.push(0, 0);
        if (c) col.push(c.getX(i), c.getY(i), c.getZ(i));
        else col.push(1, 1, 1);
      }
      if (geo.index) {
        for (let i = 0; i < geo.index.count; i++) idx.push(geo.index.getX(i) + base);
      } else {
        for (let i = 0; i < p.count; i++) idx.push(base + i);
      }
      base += p.count;
    }
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
    out.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    if (hasCol) out.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    if (idx.length) out.setIndex(idx);
    U.merged++;
    U.verts += (pos.length / 3) | 0;
    return out;
  }

  /* ---------- limited palettes (8–32 colours): light, mid, shadow ramps ---------- */
  /* Skin: warm tan, lighter on the dorsum, warmer palmar, dark in creases. */
  const SKIN_RAMP = [
    [0.97, 0.88, 0.76], /* light 0 — highlight */
    [0.93, 0.82, 0.68],
    [0.90, 0.76, 0.60],
    [0.86, 0.70, 0.54], /* mid-light */
    [0.80, 0.64, 0.48],
    [0.74, 0.56, 0.42], /* mid */
    [0.66, 0.48, 0.36],
    [0.58, 0.40, 0.30], /* mid-shadow */
    [0.50, 0.34, 0.26],
    [0.42, 0.28, 0.21], /* shadow */
    [0.34, 0.22, 0.17],
    [0.26, 0.16, 0.12]  /* deep AO */
  ];
  const SKIN_PALM_RAMP = [
    [0.94, 0.82, 0.70],
    [0.90, 0.76, 0.64],
    [0.86, 0.70, 0.58],
    [0.80, 0.62, 0.50],
    [0.74, 0.54, 0.44],
    [0.66, 0.46, 0.38],
    [0.58, 0.38, 0.30],
    [0.50, 0.32, 0.26],
    [0.42, 0.26, 0.20],
    [0.34, 0.20, 0.16],
    [0.28, 0.16, 0.13],
    [0.22, 0.13, 0.10]
  ];
  const NAIL_RAMP = [
    [0.98, 0.92, 0.90],
    [0.94, 0.84, 0.82],
    [0.90, 0.76, 0.74],
    [0.84, 0.68, 0.66],
    [0.76, 0.58, 0.56],
    [0.66, 0.48, 0.48],
    [0.54, 0.38, 0.38],
    [0.40, 0.28, 0.28],
    [0.30, 0.20, 0.20]
  ];
  const LINEN_RAMP = [
    [0.97, 0.94, 0.88],
    [0.93, 0.90, 0.82],
    [0.88, 0.84, 0.74],
    [0.82, 0.78, 0.66],
    [0.76, 0.71, 0.60],
    [0.68, 0.63, 0.52],
    [0.60, 0.55, 0.44],
    [0.52, 0.47, 0.38],
    [0.44, 0.40, 0.32],
    [0.36, 0.32, 0.26],
    [0.28, 0.25, 0.20]
  ];
  const SKIN_SPEC = [0.99, 0.95, 0.90];
  const SKIN_SPEC_LO = [0.96, 0.90, 0.82];
  const SKIN_RIM = [0.95, 0.86, 0.74];
  const SKIN_OUTLINE = [0.22, 0.13, 0.09];
  const NAIL_SPEC = [0.99, 0.97, 0.96];
  const LINEN_OUTLINE = [0.28, 0.25, 0.20];

  U.palettes = {
    skin: SKIN_RAMP.length + 4,      /* ramp + spec + rim + outline */
    palm: SKIN_PALM_RAMP.length,
    nail: NAIL_RAMP.length + 1,
    linen: LINEN_RAMP.length + 1
  };

  const PAL = {
    d0: SKIN_RAMP[1], d1: SKIN_RAMP[3], d2: SKIN_RAMP[5],
    p0: SKIN_PALM_RAMP[1], p1: SKIN_PALM_RAMP[4],
    crease: SKIN_PALM_RAMP[8], creaseW: SKIN_PALM_RAMP[6],
    web: SKIN_PALM_RAMP[7], pad: SKIN_PALM_RAMP[2],
    tendon: SKIN_RAMP[3],
    nail: NAIL_RAMP[1], nailTip: NAIL_RAMP[2],
    linen0: LINEN_RAMP[1], linen1: LINEN_RAMP[3], linenFold: LINEN_RAMP[6]
  };
  function quant(t, steps) {
    steps = steps || 5;
    return Math.max(0, Math.min(1, Math.round(t * (steps - 1)) / (steps - 1)));
  }
  function lerp3(a, b, t) {
    t = quant(t, 5);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function skinTone(z, shade, crease) {
    /* z>0 dorsal (lighter on top), z<0 palmar (warmer). shade 0..1, crease 0..1. */
    const dorsal = z >= 0;
    let c = dorsal ? lerp3(PAL.d2, PAL.d0, shade) : lerp3(PAL.p1, PAL.p0, shade);
    if (crease > 0.15) c = lerp3(c, crease > 0.55 ? PAL.crease : PAL.creaseW, Math.min(1, crease));
    return c;
  }

  /* ---------- procedural textures: generate once, cache, 128px (mobile-friendly) ---------- */
  /* Ordered Bayer 8×8 for fake gradients. Sparse sparkles use a hashed blue-noise. */
  const BAYER8 = [
    [ 0, 32,  8, 40,  2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44,  4, 36, 14, 46,  6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [ 3, 35, 11, 43,  1, 33,  9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47,  7, 39, 13, 45,  5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21]
  ];
  function bayer(x, y) { return (BAYER8[y & 7][x & 7] + 0.5) / 64; }
  function hash21(x, y) {
    /* hashed blue-noise-ish [0,1), not a hand-placed table */
    let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    n = n - Math.floor(n);
    let m = Math.sin((x + 19.1) * 269.5 + (y + 7.3) * 183.3) * 24634.634;
    m = m - Math.floor(m);
    return (n + 0.5 * m) % 1;
  }
  function fade(t) { return t * t * (3 - 2 * t); }
  function vnoise(x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const a = hash21(x0, y0), b = hash21(x0 + 1, y0);
    const c = hash21(x0, y0 + 1), d = hash21(x0 + 1, y0 + 1);
    const ux = fade(fx), uy = fade(fy);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  function fbm(x, y) {
    return vnoise(x, y) * 0.6 + vnoise(x * 2.1, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3) * 0.1;
  }
  function rampDither(t, ramp, x, y) {
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const n = ramp.length - 1;
    const f = t * n;
    const i = f | 0;
    const frac = f - i;
    const idx = (frac > bayer(x, y)) ? (i < n ? i + 1 : n) : i;
    return ramp[idx];
  }
  function distToSeg(px, py, ax, ay, bx, by) {
    const vx = bx - ax, vy = by - ay;
    const l2 = vx * vx + vy * vy || 1e-8;
    let t = ((px - ax) * vx + (py - ay) * vy) / l2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = px - (ax + vx * t), dy = py - (ay + vy * t);
    return Math.hypot(dx, dy);
  }
  function distToPoly(px, py, pts) {
    let d = 1e9;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const q = distToSeg(px, py, a[0], a[1], b[0], b[1]);
      if (q < d) d = q;
    }
    return d;
  }
  function put(data, size, x, y, c) {
    const i = (y * size + x) * 4;
    data[i] = (c[0] * 255 + 0.5) | 0;
    data[i + 1] = (c[1] * 255 + 0.5) | 0;
    data[i + 2] = (c[2] * 255 + 0.5) | 0;
    data[i + 3] = 255;
  }
  function getC(data, size, x, y) {
    const i = (y * size + x) * 4;
    return [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
  }

  /* Passes: 1 base colour, 2 dither shading (+ AO in crevices), 3 detail overlays, 4 edges. */
  function paintDorsal(data, size) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / (size - 1), v = y / (size - 1);
        /* Pass 1 — base: lighter on top (low V), mid toward the wrist. */
        let shade = 0.28 + 0.50 * (1 - v) + 0.10 * (1 - Math.abs(u - 0.5) * 2);
        shade += (fbm(u * 5, v * 5) - 0.5) * 0.10;
        /* Pass 2 — crevice AO: tendon gutters and knuckle creases darken the dither. */
        const tendons = Math.abs(Math.sin(u * Math.PI * 3.0)) ;
        const gutter = Math.max(0, 0.35 - tendons) / 0.35;
        const knuckleCrease = Math.exp(-Math.pow((v - 0.22) / 0.045, 2)) + 0.7 * Math.exp(-Math.pow((v - 0.48) / 0.04, 2));
        const cavity = Math.max(gutter * 0.55, knuckleCrease * 0.7);
        shade -= cavity * 0.50;
        let col = rampDither(shade, SKIN_RAMP, x, y);
        /* Pass 3 — detail: sparse bright specular pixels on the knuckles. */
        const knZone = Math.exp(-Math.pow((v - 0.20) / 0.07, 2)) + 0.6 * Math.exp(-Math.pow((v - 0.46) / 0.06, 2));
        if (knZone > 0.35) {
          const spark = hash21(x * 3.1, y * 7.7);
          if (spark > 0.987) col = SKIN_SPEC;
          else if (spark > 0.972) col = SKIN_SPEC_LO;
        }
        /* faint tendon ridges stay on the light side of the ramp (already in shade) */
        put(data, size, x, y, col);
      }
    }
    /* Pass 4 — rim lighting on the hand edge, slightly darkened outlines. */
    edgePass(data, size, SKIN_RIM, SKIN_OUTLINE, SKIN_RAMP);
  }

  function paintPalm(data, size) {
    /* Procedural palmar creases (life, head, heart + finger-root), not hand-placed pixels. */
    const life = [[0.22, 0.18], [0.28, 0.38], [0.34, 0.58], [0.40, 0.80]];
    const head = [[0.12, 0.36], [0.36, 0.40], [0.62, 0.42], [0.88, 0.48]];
    const heart = [[0.14, 0.24], [0.40, 0.22], [0.68, 0.24], [0.90, 0.30]];
    const roots = [];
    for (let i = 0; i < 4; i++) {
      const x0 = 0.14 + i * 0.22;
      roots.push([[x0 - 0.07, 0.12], [x0, 0.08], [x0 + 0.07, 0.12]]);
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / (size - 1), v = y / (size - 1);
        /* Pass 1 — warmer palmar base, slightly darker toward the centre hollow. */
        let shade = 0.38 + 0.22 * Math.abs(u - 0.5) * 2 + 0.12 * v;
        shade += (fbm(u * 4.5, v * 4.5) - 0.5) * 0.08;
        /* Pass 2 — darken the dither along crease curves and between the fingers (AO). */
        let cav = 0;
        cav = Math.max(cav, Math.exp(-Math.pow(distToPoly(u, v, life) / 0.018, 2)));
        cav = Math.max(cav, Math.exp(-Math.pow(distToPoly(u, v, head) / 0.016, 2)));
        cav = Math.max(cav, Math.exp(-Math.pow(distToPoly(u, v, heart) / 0.016, 2)));
        for (let r = 0; r < roots.length; r++) {
          cav = Math.max(cav, Math.exp(-Math.pow(distToPoly(u, v, roots[r]) / 0.015, 2)));
        }
        /* webbing between finger roots */
        for (let i = 0; i < 3; i++) {
          const wx = 0.25 + i * 0.22;
          const web = Math.exp(-Math.pow((u - wx) / 0.04, 2)) * Math.exp(-Math.pow((v - 0.10) / 0.08, 2));
          cav = Math.max(cav, web * 0.85);
        }
        shade -= cav * 0.62;
        const col = rampDither(shade, SKIN_PALM_RAMP, x, y);
        put(data, size, x, y, col);
      }
    }
    edgePass(data, size, SKIN_RIM, SKIN_OUTLINE, SKIN_PALM_RAMP);
  }

  function paintFinger(data, size) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / (size - 1), v = y / (size - 1);
        /* Pass 1 — lighter on the dorsal half of U, mid toward the sides. */
        const dorsal = 0.5 - 0.5 * Math.cos(u * Math.PI * 2); /* 0 at sides, 1 at back */
        let shade = 0.32 + 0.42 * dorsal + 0.08 * (1 - v);
        shade += (fbm(u * 6, v * 6) - 0.5) * 0.08;
        /* Pass 2 — joint crease rings (AO between segments) and side webbing. */
        const ring1 = Math.exp(-Math.pow((v - 0.10) / 0.035, 2));
        const ring2 = Math.exp(-Math.pow((v - 0.48) / 0.035, 2));
        const ring3 = Math.exp(-Math.pow((v - 0.82) / 0.03, 2));
        const sideAO = Math.pow(1 - dorsal, 2);
        const cavity = Math.max(ring1, ring2 * 0.9, ring3 * 0.7) * (0.6 + 0.4 * sideAO) + sideAO * 0.25;
        shade -= cavity * 0.55;
        /* knuckle bulge is slightly lighter just past the crease */
        if (v > 0.14 && v < 0.30) shade += 0.12 * (1 - Math.abs(v - 0.22) / 0.08) * dorsal;
        let col = rampDither(shade, SKIN_RAMP, x, y);
        /* Pass 3 — sparse knuckle specular, very sparse nail-adjacent glints near the tip. */
        if (v > 0.14 && v < 0.32 && dorsal > 0.55) {
          const spark = hash21(x * 2.7, y * 5.3);
          if (spark > 0.986) col = SKIN_SPEC;
          else if (spark > 0.970) col = SKIN_SPEC_LO;
        }
        put(data, size, x, y, col);
      }
    }
    edgePass(data, size, SKIN_RIM, SKIN_OUTLINE, SKIN_RAMP);
  }

  function paintKnuckle(data, size) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / (size - 1), v = y / (size - 1);
        const r = Math.hypot(u - 0.5, v - 0.5) * 2;
        let shade = 0.22 + 0.55 * Math.max(0, 1 - r);
        shade += (fbm(u * 6, v * 6) - 0.5) * 0.08;
        /* crease AO around the bead equator */
        const eq = Math.exp(-Math.pow((v - 0.55) / 0.06, 2));
        shade -= eq * 0.40;
        let col = rampDither(shade, SKIN_RAMP, x, y);
        /* sparse bright specular pixels on the knuckles */
        if (r < 0.55 && v < 0.48) {
          const spark = hash21(x * 4.1, y * 9.2);
          if (spark > 0.982) col = SKIN_SPEC;
          else if (spark > 0.964) col = SKIN_SPEC_LO;
        }
        put(data, size, x, y, col);
      }
    }
    edgePass(data, size, SKIN_RIM, SKIN_OUTLINE, SKIN_RAMP);
  }

  function paintNail(data, size) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / (size - 1), v = y / (size - 1);
        /* Pass 1 — pearly plate, slightly darker free edge. */
        let shade = 0.28 + 0.45 * (1 - v) + 0.10 * (1 - Math.abs(u - 0.5) * 2);
        shade += (fbm(u * 7, v * 5) - 0.5) * 0.06;
        if (v > 0.72) shade += 0.08; /* lunula-ish, actually lighter near root if V=0 is root: we use V-up as tip */
        if (v < 0.22) shade -= 0.12; /* darker free edge at the tip */
        /* Pass 2 — side AO */
        const side = Math.pow(Math.abs(u - 0.5) * 2, 3);
        shade -= side * 0.28;
        let col = rampDither(shade, NAIL_RAMP, x, y);
        /* Pass 3 — sparse bright specular pixels on the nails */
        const spark = hash21(x * 5.5, y * 3.2);
        if (v > 0.30 && v < 0.70 && Math.abs(u - 0.42) < 0.18 && spark > 0.978) col = NAIL_SPEC;
        else if (v > 0.30 && v < 0.70 && spark > 0.991) col = NAIL_SPEC;
        put(data, size, x, y, col);
      }
    }
    edgePass(data, size, [0.98, 0.92, 0.90], [0.30, 0.20, 0.20], NAIL_RAMP);
  }

  function paintLinen(data, size) {
    /* Procedural noise plus palette quantization for the linen weave. */
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / (size - 1), v = y / (size - 1);
        /* Pass 1 — cream base + woven warp/weft */
        const warp = Math.abs(Math.sin(x * 0.95 + vnoise(x * 0.15, y * 0.15) * 1.2));
        const weft = Math.abs(Math.sin(y * 0.95 + vnoise(x * 0.17 + 8, y * 0.13) * 1.2));
        const thread = 0.55 * warp + 0.45 * weft;
        const n = fbm(u * 8, v * 8);
        let shade = 0.32 + 0.36 * thread + (n - 0.5) * 0.10;
        /* Pass 2 — darken the dither in cuff-fold crevices (broad longitudinal bands). */
        const fold = Math.pow(Math.abs(Math.sin(u * Math.PI * 4 + v * 0.8)), 2.4);
        const foldAO = Math.max(0, 0.35 - fold);
        shade -= foldAO * 0.55;
        const col = rampDither(shade, LINEN_RAMP, x, y);
        put(data, size, x, y, col);
      }
    }
    edgePass(data, size, LINEN_RAMP[0], LINEN_OUTLINE, LINEN_RAMP);
  }

  function edgePass(data, size, rimCol, outlineCol, ramp) {
    /* Slightly darkened outlines at the UV island edge, plus a rim-light dither. */
    const copy = new Uint8ClampedArray(data);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / (size - 1), v = y / (size - 1);
        const edge = Math.min(u, v, 1 - u, 1 - v);
        let col = getC(copy, size, x, y);
        if (edge < 2.2 / size) {
          col = outlineCol;
        } else if (edge < 5.5 / size) {
          /* outline dither: mix toward the dark outline on a Bayer threshold */
          if (bayer(x, y) > edge * size / 8) col = outlineCol;
        } else if (edge < 0.11) {
          /* rim lighting on the hand edge — sparse, only on the lighter side */
          const lum = col[0] * 0.4 + col[1] * 0.45 + col[2] * 0.15;
          if (lum > 0.45 && hash21(x + 3, y + 11) > 0.55) {
            const k = (0.11 - edge) / 0.11 * 0.55;
            if (bayer(x + 3, y) < k) col = rimCol;
          }
        }
        put(data, size, x, y, col);
      }
    }
  }

  const TEX = {};
  function makeTex(key, size, paint) {
    if (TEX[key]) { U.texCached++; return TEX[key]; }
    const c = (typeof document !== 'undefined') ? document.createElement('canvas') : null;
    if (!c) return null;
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    paint(img.data, size);
    ctx.putImageData(img, 0, 0);
    const tex = new T.CanvasTexture(c);
    tex.magFilter = T.NearestFilter;
    tex.minFilter = T.NearestFilter;
    tex.generateMipmaps = false;
    tex.wrapS = T.RepeatWrapping;
    tex.wrapT = T.RepeatWrapping;
    try { if ('SRGBColorSpace' in T) tex.colorSpace = T.SRGBColorSpace; } catch (_) {}
    tex.needsUpdate = 1;
    tex.userData = { procedural1265: 1, key: key, size: size };
    TEX[key] = tex;
    U.texCached++;
    return tex;
  }
  function ensureTextures() {
    /* Generate once, cache, mobile-friendly 128² (256 would also be fine; 128 is cheaper and chunkier). */
    if (U._texReady) return TEX;
    makeTex('dorsal', 128, paintDorsal);
    makeTex('palm', 128, paintPalm);
    makeTex('finger', 128, paintFinger);
    makeTex('knuckle', 128, paintKnuckle);
    makeTex('nail', 128, paintNail);
    makeTex('linen', 128, paintLinen);
    U._texReady = 1;
    U.TEX = TEX;
    return TEX;
  }

  /* ---------- geometry helpers ---------- */
  function pushBox(bag, x, y, z, w, h, d, col, rx, ry, rz) {
    const hx = w / 2, hy = h / 2, hz = d / 2;
    const faces = [
      [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz], [0, 0, 1]],
      [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz], [0, 0, -1]],
      [[-hx, hy, -hz], [-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [0, 1, 0]],
      [[-hx, -hy, hz], [-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [0, -1, 0]],
      [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz], [1, 0, 0]],
      [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz], [-1, 0, 0]]
    ];
    const cr = Math.cos(rx || 0), sr = Math.sin(rx || 0);
    const cy = Math.cos(ry || 0), sy = Math.sin(ry || 0);
    const ck = Math.cos(rz || 0), sk = Math.sin(rz || 0);
    function rot(px, py, pz) {
      let x0 = px, y0 = py * cr - pz * sr, z0 = py * sr + pz * cr;
      let x1 = x0 * cy + z0 * sy, y1 = y0, z1 = -x0 * sy + z0 * cy;
      return [x1 * ck - y1 * sk, x1 * sk + y1 * ck, z1];
    }
    function rotN(nx, ny, nz) {
      const r = rot(nx, ny, nz);
      const l = Math.hypot(r[0], r[1], r[2]) || 1;
      return [r[0] / l, r[1] / l, r[2] / l];
    }
    for (let f = 0; f < 6; f++) {
      const F = faces[f];
      const n = rotN(F[4][0], F[4][1], F[4][2]);
      const v = [];
      for (let i = 0; i < 4; i++) {
        const r = rot(F[i][0], F[i][1], F[i][2]);
        v.push([r[0] + x, r[1] + y, r[2] + z]);
      }
      const tri = [0, 1, 2, 0, 2, 3];
      const uvs = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]];
      for (let i = 0; i < 6; i++) {
        const p = v[tri[i]];
        bag.pos.push(p[0], p[1], p[2]);
        bag.nrm.push(n[0], n[1], n[2]);
        bag.uv.push(uvs[i][0], uvs[i][1]);
        bag.col.push(col[0], col[1], col[2]);
      }
    }
  }

  function bagToGeo(bag) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(bag.pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(bag.nrm, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(bag.uv, 2));
    g.setAttribute('color', new T.Float32BufferAttribute(bag.col, 3));
    U.verts += ((bag.pos.length / 3) | 0);
    U.merged++;
    return g;
  }

  function fingerSegFacet(len, r0, r1, ovalZ, knuckle) {
    return share(['ff', len, r0, r1, ovalZ, knuckle ? 1 : 0].join(','), function () {
      const RAD = 8;
      const rings = [
        { t: 0,    rm: 1.00, sh: 0.85, cr: 0.05 },
        { t: 0.10, rm: 0.90, sh: 0.55, cr: 0.85 },
        { t: 0.26, rm: knuckle ? 1.18 : 1.02, sh: 1.05, cr: 0.05 },
        { t: 0.48, rm: 1.00, sh: 0.95, cr: 0.08 },
        { t: 0.78, rm: 0.90, sh: 0.90, cr: 0.10 },
        { t: 1.00, rm: 0.80, sh: 0.98, cr: 0.00 }
      ];
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      function ringPt(ring, k) {
        const a = (k / RAD) * Math.PI * 2;
        const r = (r0 + (r1 - r0) * Math.pow(ring.t, 0.85)) * ring.rm;
        const ox = Math.cos(a), oz = Math.sin(a) * (ovalZ || 0.58);
        return { x: ox * r, y: ring.t * len, z: oz * r, a: a, ox: ox, oz: oz };
      }
      for (let i = 0; i < rings.length - 1; i++) {
        for (let k = 0; k < RAD; k++) {
          const a = ringPt(rings[i], k), b = ringPt(rings[i], k + 1);
          const c = ringPt(rings[i + 1], k), d = ringPt(rings[i + 1], k + 1);
          const midz = (a.z + b.z + c.z + d.z) * 0.25;
          const shade = (rings[i].sh + rings[i + 1].sh) * 0.5;
          const crease = Math.max(rings[i].cr, rings[i + 1].cr);
          const col = skinTone(midz, shade, crease);
          const e1x = b.x - a.x, e1y = b.y - a.y, e1z = b.z - a.z;
          const e2x = c.x - a.x, e2y = c.y - a.y, e2z = c.z - a.z;
          let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
          const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          const verts = [a, c, b, b, c, d];
          const uvs = [
            [a.a / (Math.PI * 2), a.y / len], [c.a / (Math.PI * 2), c.y / len], [b.a / (Math.PI * 2), b.y / len],
            [b.a / (Math.PI * 2), b.y / len], [c.a / (Math.PI * 2), c.y / len], [d.a / (Math.PI * 2), d.y / len]
          ];
          for (let v = 0; v < 6; v++) {
            const p = verts[v];
            bag.pos.push(p.x, p.y, p.z);
            bag.nrm.push(nx, ny, nz);
            bag.uv.push(uvs[v][0], uvs[v][1]);
            bag.col.push(col[0], col[1], col[2]);
          }
        }
      }
      [[rings[0], -1], [rings[rings.length - 1], 1]].forEach(function (pair) {
        const ring = pair[0], sgn = pair[1];
        const cy = ring.t * len;
        const col = skinTone(0, ring.sh, ring.cr);
        for (let k = 0; k < RAD; k++) {
          const a = ringPt(ring, k), b = ringPt(ring, k + 1);
          const tri = sgn > 0 ? [[0, cy, 0], [b.x, b.y, b.z], [a.x, a.y, a.z]]
                              : [[0, cy, 0], [a.x, a.y, a.z], [b.x, b.y, b.z]];
          for (let v = 0; v < 3; v++) {
            bag.pos.push(tri[v][0], tri[v][1], tri[v][2]);
            bag.nrm.push(0, sgn, 0);
            bag.uv.push(0.5, ring.t);
            bag.col.push(col[0], col[1], col[2]);
          }
        }
      });
      return bagToGeo(bag);
    });
  }

  function knuckleFacet(r) {
    return share('knf-' + r, function () {
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      const RAD = 8, SEG = 4;
      for (let i = 0; i < SEG; i++) {
        const t0 = i / SEG, t1 = (i + 1) / SEG;
        const y0 = (t0 - 0.5) * r * 1.35, y1 = (t1 - 0.5) * r * 1.35;
        const f0 = Math.sin(t0 * Math.PI), f1 = Math.sin(t1 * Math.PI);
        for (let k = 0; k < RAD; k++) {
          const a0 = (k / RAD) * Math.PI * 2, a1 = ((k + 1) / RAD) * Math.PI * 2;
          function pt(a, y, f) {
            return { x: Math.cos(a) * r * f, y: y, z: Math.sin(a) * r * f * 0.78, u: a / (Math.PI * 2), v: (y / (r * 1.35) + 0.5) };
          }
          const A = pt(a0, y0, f0), B = pt(a1, y0, f0), C = pt(a0, y1, f1), D = pt(a1, y1, f1);
          const midz = (A.z + B.z + C.z + D.z) * 0.25;
          const col = skinTone(midz, 1.05, 0.05);
          const e1x = B.x - A.x, e1y = B.y - A.y, e1z = B.z - A.z;
          const e2x = C.x - A.x, e2y = C.y - A.y, e2z = C.z - A.z;
          let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
          const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          const verts = [A, C, B, B, C, D];
          for (let v = 0; v < 6; v++) {
            const p = verts[v];
            bag.pos.push(p.x, p.y, p.z);
            bag.nrm.push(nx, ny, nz);
            bag.uv.push(p.u, p.v);
            bag.col.push(col[0], col[1], col[2]);
          }
        }
      }
      return bagToGeo(bag);
    });
  }

  function nailFacet(w, h, d) {
    return share(['nail', w, h, d].join(','), function () {
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      pushBox(bag, 0, 0, 0, w, h, d, PAL.nail, -0.08, 0, 0);
      pushBox(bag, 0, h * 0.38, d * 0.15, w * 0.92, h * 0.28, d * 0.7, PAL.nailTip, -0.04, 0, 0);
      return bagToGeo(bag);
    });
  }

  function thumbPadGeo() {
    return share('tpad', function () {
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      const RAD = 8, SEG = 4, rx = 0.011, ry = 0.010, rz = 0.0075;
      for (let i = 0; i < SEG; i++) {
        const t0 = i / SEG, t1 = (i + 1) / SEG;
        const y0 = (t0 - 0.5) * ry * 2, y1 = (t1 - 0.5) * ry * 2;
        const f0 = Math.sin(t0 * Math.PI), f1 = Math.sin(t1 * Math.PI);
        for (let k = 0; k < RAD; k++) {
          const a0 = (k / RAD) * Math.PI * 2, a1 = ((k + 1) / RAD) * Math.PI * 2;
          function pt(a, y, f) {
            return { x: Math.cos(a) * rx * f, y: y, z: Math.sin(a) * rz * f, u: a / (Math.PI * 2), v: t0 };
          }
          const A = pt(a0, y0, f0), B = pt(a1, y0, f0), C = pt(a0, y1, f1), D = pt(a1, y1, f1);
          const col = PAL.pad;
          const e1x = B.x - A.x, e1y = B.y - A.y, e1z = B.z - A.z;
          const e2x = C.x - A.x, e2y = C.y - A.y, e2z = C.z - A.z;
          let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
          const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          const verts = [A, C, B, B, C, D];
          for (let v = 0; v < 6; v++) {
            const p = verts[v];
            bag.pos.push(p.x, p.y, p.z);
            bag.nrm.push(nx, ny, nz);
            bag.uv.push(p.u || 0, p.v || 0);
            bag.col.push(col[0], col[1], col[2]);
          }
        }
      }
      return bagToGeo(bag);
    });
  }

  /* Subtle dorsal wrist tendons (skin-coloured ridges, not brown sticks), merged. */
  function tendonGeo() {
    return share('tendons', function () {
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      const xs = [-0.014, 0, 0.014];
      const parts = [];
      for (let i = 0; i < xs.length; i++) {
        pushBox(bag, xs[i], 0.012, 0.0175, 0.0018, 0.068, 0.0014, PAL.tendon, 0.06, 0, 0);
        pushBox(bag, xs[i], 0.044, 0.018, 0.0022, 0.010, 0.0016, PAL.tendon, 0.03, 0, 0);
      }
      return bagToGeo(bag);
    });
  }

  /* Modest rolled linen cuff with fold facets — tight hem, not a life-preserver. */
  function rolledCuffGeo() {
    return share('cuffRoll', function () {
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      const RAD = 10, TUB = 6;
      const R = 0.078, rTube = 0.0072;
      for (let i = 0; i < RAD; i++) {
        const a0 = (i / RAD) * Math.PI * 2, a1 = ((i + 1) / RAD) * Math.PI * 2;
        const fold0 = 1 - 0.16 * Math.max(0, Math.sin(a0 * 4));
        const fold1 = 1 - 0.16 * Math.max(0, Math.sin(a1 * 4));
        const col0 = lerp3(PAL.linen0, PAL.linenFold, 1 - fold0);
        for (let j = 0; j < TUB; j++) {
          const t0 = (j / TUB) * Math.PI * 2, t1 = ((j + 1) / TUB) * Math.PI * 2;
          function pt(a, t, fold) {
            const rr = R * fold;
            const tt = rTube * (0.88 + 0.12 * fold);
            const cx = Math.cos(a) * rr, cz = Math.sin(a) * rr;
            const ox = Math.cos(a), oz = Math.sin(a);
            return {
              x: cx + ox * Math.cos(t) * tt,
              y: Math.sin(t) * tt,
              z: cz + oz * Math.cos(t) * tt,
              u: a / (Math.PI * 2),
              v: t / (Math.PI * 2)
            };
          }
          const A = pt(a0, t0, fold0), B = pt(a1, t0, fold1), C = pt(a0, t1, fold0), D = pt(a1, t1, fold1);
          const e1x = B.x - A.x, e1y = B.y - A.y, e1z = B.z - A.z;
          const e2x = C.x - A.x, e2y = C.y - A.y, e2z = C.z - A.z;
          let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
          const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          const verts = [A, C, B, B, C, D];
          for (let v = 0; v < 6; v++) {
            const p = verts[v];
            bag.pos.push(p.x, p.y, p.z);
            bag.nrm.push(nx, ny, nz);
            bag.uv.push(p.u, p.v);
            bag.col.push(col0[0], col0[1], col0[2]);
          }
        }
      }
      /* small longitudinal fold facets on the cuff body, close to the cloth, not fins */
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.2;
        const x = Math.cos(a) * 0.074, z = Math.sin(a) * 0.074;
        pushBox(bag, x, -0.018, z, 0.007, 0.032, 0.004, PAL.linenFold, 0, -a, 0.10);
      }
      return bagToGeo(bag);
    });
  }

  function mkMat(map, opts) {
    opts = opts || {};
    const cfg = {
      color: 0xffffff,
      map: map || undefined,
      vertexColors: true,
      flatShading: true,
      emissive: 0x000000
    };
    if (opts.vertexColors === false) cfg.vertexColors = false;
    if (opts.flatShading === false) cfg.flatShading = false;
    const m = new T.MeshLambertMaterial(cfg);
    m.userData.sculpt1265 = 1;
    m.userData.sculptKeep = 1;
    if (opts.tag) m.userData[opts.tag] = 1;
    return m;
  }
  function skinMat() {
    if (U._skin) return U._skin;
    ensureTextures();
    U._skin = mkMat(TEX.dorsal, { vertexColors: true, tag: 'skin1265' });
    return U._skin;
  }
  function palmMat() {
    if (U._palm) return U._palm;
    ensureTextures();
    U._palm = mkMat(TEX.palm, { vertexColors: true, tag: 'palm1265' });
    return U._palm;
  }
  function fingerMat() {
    if (U._finger) return U._finger;
    ensureTextures();
    U._finger = mkMat(TEX.finger, { vertexColors: true, tag: 'finger1265' });
    return U._finger;
  }
  function knuckleMat() {
    if (U._kn) return U._kn;
    ensureTextures();
    U._kn = mkMat(TEX.knuckle, { vertexColors: true, tag: 'knuckle1265' });
    return U._kn;
  }
  function nailMat() {
    if (U._nail) return U._nail;
    ensureTextures();
    /* Lambert + baked specular pixels — cheaper than MeshStandard, same sparkle. */
    U._nail = mkMat(TEX.nail, { vertexColors: true, tag: 'nail1265' });
    return U._nail;
  }
  function linenMat() {
    if (U._linen) return U._linen;
    ensureTextures();
    U._linen = mkMat(TEX.linen, { vertexColors: true, tag: 'linen1265' });
    return U._linen;
  }
  function linenBodyMat() {
    /* For existing 1249 sleeves: weave map, no vertexColors (those geos have none). */
    if (U._linenBody) return U._linenBody;
    ensureTextures();
    U._linenBody = mkMat(TEX.linen, { vertexColors: false, flatShading: false, tag: 'linen1265' });
    return U._linenBody;
  }

  function mark(o) {
    if (!o) return o;
    o.userData = o.userData || {};
    o.userData.sculpt1265 = 1;
    o.userData.sculptKeep = 1;
    o.frustumCulled = false;
    o.castShadow = false;
    /* Do not raise renderOrder — that drew palmar creases through the dorsum. */
    return o;
  }
  function addMesh(parent, geo, mat, x, y, z) {
    const m = new T.Mesh(geo, mat);
    if (x || y || z) m.position.set(x || 0, y || 0, z || 0);
    mark(m);
    parent.add(m);
    return m;
  }

  const WIDTHS = [0.0086, 0.0082, 0.0074, 0.0066];

  function directMeshes(group, pred) {
    const out = [];
    if (!group || !group.children) return out;
    for (let i = 0; i < group.children.length; i++) {
      const o = group.children[i];
      if (o && o.isMesh && (!pred || pred(o))) out.push(o);
    }
    return out;
  }
  function replaceSegOn(group, len, r0, r1, oval, kn) {
    directMeshes(group, function (o) { return o.userData && o.userData.fingerAtlas; }).forEach(function (o) {
      if (o.userData.sculpt1265geo) return;
      o.geometry = fingerSegFacet(len, r0, r1, oval, kn);
      o.material = fingerMat();
      o.userData.sculpt1265geo = 1;
      mark(o);
    });
  }
  function replaceKnuckleOn(group, kr) {
    directMeshes(group, function (o) { return o.userData && o.userData.knuckle1249; }).forEach(function (o) {
      if (o.userData.sculpt1265geo) return;
      o.geometry = knuckleFacet(kr);
      o.material = knuckleMat();
      o.userData.sculpt1265geo = 1;
      mark(o);
    });
  }
  function replaceNailOn(group, w, h, d) {
    directMeshes(group, function (o) { return o.userData && o.userData.nail1249; }).forEach(function (o) {
      if (o.userData.sculpt1265geo) return;
      o.geometry = nailFacet(w, h, d);
      o.material = nailMat();
      o.userData.nail1265 = 1;
      o.userData.sculpt1265geo = 1;
      mark(o);
    });
  }
  function refineFingers(h) {
    const fingers = h.userData.f || [];
    for (let i = 0; i < fingers.length; i++) {
      const pair = fingers[i];
      if (!pair) continue;
      const f = pair[0], k = pair[1];
      const r = WIDTHS[i] || 0.0075;
      /* Exact 1.2.57 lengths: proximal 0.036, mid 0.017, distal 0.013. Pivots untouched. */
      replaceSegOn(f, 0.036, r, r * 0.82, 0.58, 1);
      replaceKnuckleOn(f, r * 1.10);
      if (k) {
        replaceSegOn(k, 0.017, r * 0.82, r * 0.72, 0.56, 1);
        replaceKnuckleOn(k, r * 0.92);
        const d = k.userData && k.userData.d;
        if (d) {
          replaceSegOn(d, 0.013, r * 0.72, r * 0.52, 0.54, 0);
          replaceKnuckleOn(d, r * 0.78);
          replaceNailOn(d, r * 0.92, 0.0052, r * 0.26);
        }
      }
    }
    const th = h.userData.th;
    if (th) {
      replaceSegOn(th, 0.05, 0.0100, 0.0078, 0.64, 1);
      const tk = th.userData && th.userData.k;
      if (tk) {
        replaceSegOn(tk, 0.018, 0.0082, 0.0070, 0.62, 1);
        const td = tk.userData && tk.userData.d;
        if (td) {
          replaceSegOn(td, 0.014, 0.0070, 0.0056, 0.60, 0);
          replaceNailOn(td, 0.0076, 0.0054, 0.0020);
        }
      }
    }
  }

  function upgradeHand(h, side) {
    if (!h || h.userData.sculpt1265) return;
    h.userData.sculpt1265 = 1;
    ensureTextures();
    refineFingers(h);

    const th = h.userData.th;
    if (th && !th.userData.pad1265) {
      const pad = addMesh(th, thumbPadGeo(), palmMat(), 0, 0.018, -0.0062);
      pad.name = 'ThumbPad1265';
      pad.userData.pad1265 = 1;
      th.userData.pad1265 = 1;
    }

    /* Palm creases live in the palmar texture (dithered AO along life/head/heart).
       No stick-like crease meshes — those drew through the dorsum. */
    h.userData.creases1265 = 1;

    if (!h.userData.tendons1265) {
      const t = addMesh(h, tendonGeo(), skinMat(), 0, 0, 0);
      t.name = 'WristTendons1265';
      t.userData.tendon1265 = 1;
      h.userData.tendons1265 = 1;
    }

    try {
      h.traverse(function (o) {
        if (!o.isMesh || !o.userData) return;
        if (o.userData.palmAtlas && !o.userData.sculpt1265geo) {
          const g = o.geometry.clone();
          const p = g.getAttribute('position');
          const col = [];
          for (let i = 0; i < p.count; i++) {
            const z = p.getZ(i);
            const crease = (z < 0) ? 0.18 : 0;
            const c = skinTone(z, z >= 0 ? 1.0 : 0.72, crease);
            col.push(c[0], c[1], c[2]);
          }
          g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
          o.geometry = g;
          /* Palmar faces get the crease map; a single mesh uses the palm map (creases
             are on the palmar UV island of the 1249 atlas-style unwrap). */
          o.material = palmMat();
          o.userData.sculpt1265geo = 1;
          o.userData.crease1265 = 1;
          mark(o);
        }
        if (o.userData.pad1249 && !o.userData.sculpt1265geo) {
          try {
            const g = o.geometry.clone();
            const p = g.getAttribute('position');
            const col = [];
            for (let i = 0; i < p.count; i++) {
              const c = PAL.pad;
              col.push(c[0], c[1], c[2]);
            }
            g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
            o.geometry = g;
          } catch (_) {}
          o.material = palmMat();
          o.userData.sculpt1265geo = 1;
          mark(o);
        }
        if (o.userData.knuckle1249 && !o.userData.sculpt1265geo) {
          const kr = 0.0070;
          o.geometry = knuckleFacet(kr);
          o.material = knuckleMat();
          o.userData.sculpt1265geo = 1;
          mark(o);
        }
      });
    } catch (e) { ERR('palm', e); }
  }

  function cuffLen(mesh) {
    try {
      const p = mesh.geometry && mesh.geometry.getAttribute('position');
      if (!p) return 0.145;
      let ymin = Infinity, ymax = -Infinity;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
      return (ymax > ymin) ? ymax : 0.145;
    } catch (_) { return 0.145; }
  }

  function upgradeCuff(cuff) {
    if (!cuff || cuff.userData.roll1265) return;
    const y = cuffLen(cuff);
    /* Sit the modest roll on the existing 1249 swell lip. */
    const roll = addMesh(cuff, rolledCuffGeo(), linenMat(), 0, y - 0.004, 0);
    roll.name = 'RolledCuff1265';
    roll.userData.roll1265 = 1;
    roll.userData.sleeveCap = 1;
    roll.userData.fold1265 = 1;
    cuff.userData.roll1265 = 1;
    /* Give the existing cuff our weave map; do not mark() it (no renderOrder, no vertexColors). */
    try {
      cuff.material = linenBodyMat();
      cuff.userData.linen1265 = 1;
    } catch (_) {}
  }

  function upgradeSleeve(mesh) {
    if (!mesh || mesh.userData.folds1265) return;
    /* Texture-only upgrade on the existing sleeve — no extra fold fins that ballooned in close-up. */
    try {
      mesh.material = linenBodyMat();
      mesh.userData.linen1265 = 1;
    } catch (_) {}
    mesh.userData.folds1265 = 1;
  }

  function upgradeArm(arm) {
    if (!arm || !arm.userData || !arm.userData.p) return;
    if (arm.userData.sculpt1265) return;
    const p = arm.userData.p;
    const side = arm.userData.side || 1;
    if (p.h) upgradeHand(p.h, side);
    if (p.cuff) upgradeCuff(p.cuff);
    if (p.fo) upgradeSleeve(p.fo);
    if (p.up) upgradeSleeve(p.up);
    arm.userData.sculpt1265 = 1;
  }

  function applyMaterials() {
    try {
      const fpa = W.__fpa;
      const rig = fpa && (typeof fpa.rig === 'function' ? fpa.rig() : fpa.g);
      if (!rig) return false;
      ensureTextures();
      const sm = skinMat(), pm = palmMat(), fm = fingerMat(), km = knuckleMat();
      const lm = linenMat(), lb = linenBodyMat(), nm = nailMat();
      rig.traverse(function (o) {
        if (!(o.isMesh || o.isSkinnedMesh) || !o.material) return;
        if (!o.userData) return;
        if (o.userData.sculptHidden) { o.visible = false; return; }
        if (o.userData.nail1265 || o.userData.nail1249) { o.material = nm; o.visible = true; return; }
        if (o.userData.roll1265 || o.userData.fold1265) { o.material = lm; o.visible = true; return; }
        if (o.userData.linen1265 || o.userData.sleeve1257 || o.userData.sleeveCuff22 || o.userData.wristCap1249) {
          o.material = lb; o.visible = true; return;
        }
        if (o.userData.palmAtlas || o.userData.pad1249 || o.userData.pad1265 || o.userData.crease1265) {
          o.material = pm; o.visible = true; return;
        }
        if (o.userData.knuckle1249 || o.userData.knuckle1265) { o.material = km; o.visible = true; return; }
        if (o.userData.fingerAtlas) { o.material = fm; o.visible = true; return; }
        if (o.userData.sculpt1265 || o.userData.sculpt1265geo || o.userData.tendon1265) {
          o.material = sm;
          o.visible = true;
        }
      });
      return true;
    } catch (e) { ERR('mats', e); return false; }
  }

  function apply() {
    try {
      const fpa = W.__fpa;
      if (!fpa) return false;
      const rig = (typeof fpa.rig === 'function' ? fpa.rig() : fpa.g);
      if (!rig) return false;
      ensureTextures();
      try {
        const h = W.__hands1249;
        if (h && typeof h.apply === 'function' && !h.sculpted) h.apply();
      } catch (_) {}
      if (rig.userData.R) upgradeArm(rig.userData.R);
      if (rig.userData.L) upgradeArm(rig.userData.L);
      applyMaterials();
      U.sculpted = 1;
      U.on = 1;
      return true;
    } catch (e) { ERR('apply', e); return false; }
  }
  U.apply = apply;
  U.applyMaterials = applyMaterials;
  U.ensureTextures = ensureTextures;

  function hookPaint() {
    if (U._hooked) return;
    try {
      const H = W.__held1240;
      if (H && typeof H.retextureProceduralArms === 'function' && !H.__sculpt1265) {
        const prev = H.retextureProceduralArms.bind(H);
        H.retextureProceduralArms = function () {
          const r = prev.apply(this, arguments);
          try { apply(); applyMaterials(); } catch (_) {}
          return r;
        };
        H.__sculpt1265 = 1;
      }
      if (H && typeof H.hardenFpa === 'function' && !H.__sculpt1265h) {
        const prevH = H.hardenFpa.bind(H);
        H.hardenFpa = function () {
          const r = prevH.apply(this, arguments);
          try { applyMaterials(); } catch (_) {}
          return r;
        };
        H.__sculpt1265h = 1;
      }
      const h1249 = W.__hands1249;
      if (h1249 && typeof h1249.apply === 'function' && !h1249.__wrap1265) {
        const pa = h1249.apply.bind(h1249);
        h1249.apply = function () {
          const r = pa.apply(this, arguments);
          try { apply(); } catch (_) {}
          return r;
        };
        h1249.__wrap1265 = 1;
      }
      if (h1249 && typeof h1249.applyMaterials === 'function' && !h1249.__wrap1265m) {
        const pm = h1249.applyMaterials.bind(h1249);
        h1249.applyMaterials = function () {
          const r = pm.apply(this, arguments);
          try { applyMaterials(); } catch (_) {}
          return r;
        };
        h1249.__wrap1265m = 1;
      }
    } catch (e) { ERR('hook', e); }
    U._hooked = 1;
  }

  function hookStep() {
    if (U._stepHooked) return;
    const fpa = W.__fpa;
    if (!fpa || typeof fpa.step !== 'function') return;
    const prev = fpa.step.bind(fpa);
    fpa.step = function () {
      const r = prev.apply(this, arguments);
      try { if (!U.sculpted) apply(); } catch (_) {}
      U.frames++;
      return r;
    };
    U._stepHooked = 1;
  }

  let n = 0;
  const boot = setInterval(function () {
    n++;
    hookPaint();
    hookStep();
    if (apply() || n > 100) clearInterval(boot);
  }, 50);
  /* Re-apply after HANDS1263's delayed boots (50/360/1100/2000). */
  [80, 420, 1200, 2100, 2800].forEach(function (ms) {
    setTimeout(function () { try { hookPaint(); hookStep(); apply(); } catch (_) {} }, ms);
  });
  if (W.addEventListener) W.addEventListener('load', function () { hookPaint(); hookStep(); apply(); });
})(typeof window !== 'undefined' ? window : this);
