/* GLX-C280 (v1.0.91): foliage looks solid and 3D with no black edges. Grass, flowers, ferns and saplings keep their own art, but:
   - the colour of every leaf edge is bled out into the see-through pixels, so mipmaps never mix in black (the dark fringe)
   - a crisp alphaTest of 0.5, opaque depth writing, no blending
   - a soft shade toward the base of each plant and a light tip, so the crossed quads read as rounded tufts instead of flat cut-outs. */
(function () {
  const U = window.__c280 = {err: null, tex: 0, mats: 0, ms: 0};
  function fix(t) { const img = t.image; if (!img || !img.width || t.__c280) return; const w = img.width, h = img.height; const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d', {willReadFrequently: true}); g.drawImage(img, 0, 0); const id = g.getImageData(0, 0, w, h), d = id.data;
    // tile height: the art is laid out in square tiles across the strip
    const th = Math.min(w, h); const solid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) { const a = d[i * 4 + 3]; solid[i] = a >= 128 ? 1 : 0; d[i * 4 + 3] = a >= 128 ? 255 : 0; }
    // shading: darker toward the base of each tile, slightly brighter tips
    for (let y = 0; y < h; y++) { const f = (y % th) / th, m = f > 0.55 ? 1 - (f - 0.55) / 0.45 * 0.32 : 1 + (0.55 - f) / 0.55 * 0.08;
      for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (!d[i + 3]) continue; d[i] = Math.min(255, d[i] * m); d[i + 1] = Math.min(255, d[i + 1] * m); d[i + 2] = Math.min(255, d[i + 2] * m); } }
    // edge bleed: copy neighbour colours into the transparent pixels (8 passes is enough for every mip level used at view range)
    let cur = solid; for (let pass = 0; pass < 8; pass++) { const nx = cur.slice(); let any = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = y * w + x; if (cur[p]) continue; let r = 0, gg = 0, b = 0, n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const q = Y * w + X; if (!cur[q]) continue; r += d[q * 4]; gg += d[q * 4 + 1]; b += d[q * 4 + 2]; n++; }
        if (n) { d[p * 4] = r / n; d[p * 4 + 1] = gg / n; d[p * 4 + 2] = b / n; nx[p] = 1; any = 1; } }
      cur = nx; if (!any) break; }
    g.putImageData(id, 0, 0); t.image = c; t.premultiplyAlpha = false; t.__c280 = 1; t.needsUpdate = true; U.tex++; }
  function run() { const t0 = performance.now(); try { const fire = T && T.FIRE;
      for (const k in PLANT_MATS) { if (+k === fire) continue; for (const m of [].concat(PLANT_MATS[k])) { if (!m || !m.map || m.transparent || m.blending === THREE.AdditiveBlending) continue;
          fix(m.map); m.alphaTest = 0.5; m.transparent = false; m.depthWrite = true; m.premultipliedAlpha = true; m.needsUpdate = true; U.mats++; } }
    } catch (e) { U.err = String(e && e.message || e); } U.ms = Math.round(performance.now() - t0); }
  let tries = 0; const t = setInterval(() => { tries++; if (typeof PLANT_MATS !== 'undefined' && Object.keys(PLANT_MATS).length > 5) { clearInterval(t); run(); } else if (tries > 40) clearInterval(t); }, 500);
})();
