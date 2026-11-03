/* ===================== GLX-C190 (v1.0.36): sandstone redo - pale sand grain with horizontal layer bands (no wood look), on the block, stairs and corner stairs, with fresh icons ===================== */
(function c190() {
  const U = window.__c190 = {err: null, passes: 0, icons: 0, c: null};
  const warn = (w, e) => { U.err = w + ' ' + String(e && e.stack || e); console.warn('c190', w, e); };
  const KEY = 'sandstone', S = touchMode ? 256 : 512;
  function paint() { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), im = g.createImageData(S, S), d = im.data;
    let s = 90127; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    // strata: a few bands of slightly different sand tone, each wobbling gently (periodic in x so the tile repeats)
    const bands = [], NB = 7; let y = 0; for (let i = 0; i < NB; i++) { const h = S / NB * (.7 + r() * .6); bands.push({y, h, t: (r() - .5) * 16, w: r() * 6.28}); y += h; }
    const scale = S / y; bands.forEach(b => { b.y *= scale; b.h *= scale; });
    const ph = [r() * 6.28, r() * 6.28], amp = S * .012;
    const tone = yy => { for (let i = bands.length - 1; i >= 0; i--) if (yy >= bands[i].y) return [bands[i], i]; return [bands[0], 0]; };
    const noise = new Float32Array(S * S); for (let i = 0; i < noise.length; i++) noise[i] = r();
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) { const a = px / S * 6.2832;
      const yy = ((py + Math.sin(a + ph[0]) * amp + Math.sin(a * 3 + ph[1]) * amp * .35) % S + S) % S;
      const [b, bi] = tone(yy), off = yy - b.y, edge = Math.min(off, b.h - off);
      let k = 218 + b.t;                                   // pale sand
      if (edge < S * .006) k -= 26; else if (edge < S * .014) k -= 10;   // thin darker seam between layers
      if (off < b.h * .22) k += 6;                         // each layer a touch lighter at its top
      const n = noise[py * S + px], n2 = noise[((py >> 1) * S + (px >> 1)) % noise.length];
      k += (n - .5) * 22 + (n2 - .5) * 12;                 // fine sand grain
      if (n > .993) k -= 40; else if (n < .006) k += 24;   // odd dark / bright grains
      const i = (py * S + px) * 4; d[i] = Math.min(255, k + 14); d[i + 1] = Math.min(255, k * .9 + 6); d[i + 2] = Math.min(255, k * .66); d[i + 3] = 255; }
    g.putImageData(im, 0, 0); return c; }
  function css(c) { try { const s = document.createElement('canvas'); s.width = s.height = 64; s.getContext('2d').drawImage(c, 0, 0, 64, 64);
    let el = document.getElementById('c190tex'); if (!el) { el = document.createElement('style'); el.id = 'c190tex'; document.head.appendChild(el); }
    el.textContent = '.ic-' + KEY + '{background-image:url(' + s.toDataURL() + ') !important}'; } catch (_) {} }
  const ids = () => { const out = [T.SANDSTONE]; for (const k in NAMES) { const n = NAMES[k] || ''; if (/^sandstone/i.test(n) && +k !== T.SANDSTONE) out.push(+k); } return out; };
  function pass() { const c = U.c || (U.c = paint()); const ts = new Set();
    try { if (texCache[KEY]) ts.add(texCache[KEY]); if (matCache[KEY] && matCache[KEY].map) ts.add(matCache[KEY].map); } catch (_) {}
    for (const id of ids()) try { [].concat(BLOCK_MATS[id] || []).forEach(m => { if (m && m.map) ts.add(m.map); }); } catch (_) {}
    try { if (window.__stMat) [].concat(__stMat(0, 168) || []).forEach(m => { if (m && m.map) ts.add(m.map); }); } catch (_) {}
    if (texImg[KEY] !== c) { texImg[KEY] = c; css(c); try { AVG[KEY] = 0xdccb9a; } catch (_) {} }
    for (const t of ts) if (t && t.image !== c && (t.image === undefined || t.image.width)) { t.image = c; t.needsUpdate = true; }
    U.passes++; }
  function icons() { const K = window.__c187 && __c187.kit && __c187.kit(); if (!K) return false; const F = [U.c, U.c, U.c];
    for (const id of ids()) { const nm = (NAMES[id] || '').toLowerCase(); try { K.setIc(id, K.isoIcon(F, K.shapeOf(id, nm))); U.icons++; } catch (e) { warn('ic' + id, e); } }
    try { renderHotbar(); } catch (_) {} return true; }
  let n = 0, iconsDone = false; const iv = setInterval(() => { try { if (typeof texDone !== 'undefined' && texDone < texTotal) return; pass();
      if (!iconsDone && n > 6) iconsDone = icons(); } catch (e) { warn('pass', e); } if (++n > 60) clearInterval(iv); }, 500);
})();
