/* GLX-C313 (v1.1.23): our own haggis model, and sharper pig and sheep fur.
   - haggis2.glb is made from scratch by tools/haggis_gen.py (round shaggy body, short legs, highland fringe and small horns, procedural fur
     texture). It uses the same procedural gait as the new pig and sheep (C302 + C310), so it walks and idles smoothly; behaviour is unchanged.
   - The pig and sheep colour textures were upscaled 4x with Real-ESRGAN and sharpened. Desktops load the 4096 version, phones and small
     GPUs the 2048 one; both are WebP with mipmaps. If a texture fails to load the model keeps its built-in 1024 one. */
(() => {
  const C = window.__c135; if (!C || !C.cat) return;
  const U = window.__c313 = {err: null, size: 0, swapped: 0, loaded: {}};
  if (C.cat.haggis) { const h = C.cat.haggis; h.f = 'haggis2'; h.pal = null; h.noclip = 1; try { delete h.gl; Object.defineProperty(h, 'gl', {get: () => undefined, set: () => {}, configurable: true}); } catch (_) {} }
  let big = true; try { const gl = renderer.getContext(), mx = gl.getParameter(gl.MAX_TEXTURE_SIZE), phone = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) < 900);
    big = mx >= 4096 && !phone && !(navigator.deviceMemory && navigator.deviceMemory < 6); } catch (_) { big = false; }
  U.size = big ? 4096 : 2048;
  const TX = {}, L = new THREE.TextureLoader();
  function tex(f) { if (TX[f]) return TX[f]; const t = TX[f] = {t: null, wait: []};
    L.load('assets/tex/' + f + '_' + (big ? '4k' : '2k') + '.webp?' + (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : ''), x => {
      x.flipY = false; x.colorSpace = THREE.SRGBColorSpace; x.generateMipmaps = true; x.minFilter = THREE.LinearMipmapLinearFilter; x.magFilter = THREE.LinearFilter;
      try { x.anisotropy = Math.min(big ? 8 : 4, renderer.capabilities.getMaxAnisotropy()); } catch (_) {}
      t.t = x; U.loaded[f] = 1; t.wait.forEach(fn => fn(x)); t.wait = []; }, undefined, e => { U.err = 'tex ' + f; }); return t; }
  const use = (m, x) => m.traverse(o => { if (!o.isMesh) return; for (const mm of [].concat(o.material)) if (mm && mm.map) { const old = mm.map; x.wrapS = old.wrapS; x.wrapT = old.wrapT; x.channel = old.channel || 0; mm.map = x; mm.needsUpdate = true; U.swapped++; } });
  C.post.push((a, c, M, m) => { try { if (c.f !== 'pig2' && c.f !== 'sheep2') return; const t = tex(c.f); if (t.t) use(m, t.t); else t.wait.push(x => use(m, x)); } catch (e) { U.err = String(e); } });
})();
