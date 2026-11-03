/* ===================== GLX-C202 (v1.0.41): block-breaking bits are little pieces of the real block - each chip shows a random patch of the block's
   own (HD) texture on every face, wood types / stairs / slabs / doors use their wood, ores show their ore; the mining progress bar is gone (crack overlay stays) ===================== */
(function c202() {
  const U = window.__c202 = {err: null, tex: 0, flat: 0};
  const warn = (w, e) => { U.err = w + ' ' + String(e && e.message || e); console.warn('c202', w, e); };
  try { const st = document.createElement('style'); st.id = 'glx202'; st.textContent = '#mine{display:none !important}'; document.head.appendChild(st); } catch (e) { warn('css', e); }
  // chip geometries: a 0.1 cube whose faces show a random quarter of the texture
  const GEOS = [];
  try { for (let i = 0; i < 8; i++) { const g = new THREE.BoxGeometry(0.1, 0.1, 0.1), uv = g.attributes.uv, s = 0.22 + Math.random() * 0.12, ou = Math.random() * (1 - s), ov = Math.random() * (1 - s);
      for (let j = 0; j < uv.count; j++) uv.setXY(j, ou + uv.getX(j) * s, ov + uv.getY(j) * s); uv.needsUpdate = true; GEOS.push(g); } } catch (e) { warn('geo', e); }
  const LC = new Map();
  function lam(src) { if (!src) return null; const map = src.map || null, key = map ? map.uuid : 'c' + (src.color ? src.color.getHex() : 0x777777);
    let m = LC.get(key); if (m) return m;
    m = new THREE.MeshLambertMaterial(map ? {map, alphaTest: src.alphaTest || (src.transparent ? 0.4 : 0), transparent: false, side: THREE.DoubleSide} : {color: src.color ? src.color.getHex() : 0x777777});
    LC.set(key, m); return m; }
  const asArr = m => Array.isArray(m) ? (m.length === 6 ? m : m.length ? [0, 1, 2, 3, 4, 5].map(i => m[i % m.length]) : null) : m ? [m, m, m, m, m, m] : null;
  const pl = w => { const C = window.__c121; let p = C && C.PLMAT && C.PLMAT[w]; return p; };
  function matsFor(b, wood) { try {
      const C187 = window.__c187 && __c187.CORN && __c187.CORN[b]; if (C187) { const w = wood || C187.w; return asArr(w ? pl(w) : BLOCK_MATS[C187.st] || BLOCK_MATS[10]); }
      if (wood) { let m = null; try { m = window.__stMat ? __stMat(wood, b) : null; } catch (_) {} if (!m || m === BLOCK_MATS[b]) m = (b === T.DOOR || b === T.DOORTOP) && __c121.doorMat ? [pl(wood), pl(wood), pl(wood), pl(wood), __c121.doorMat(wood), __c121.doorMat(wood)] : pl(wood); if (m) return asArr(m); }
      return asArr(BLOCK_MATS[b]); } catch (e) { warn('mats' + b, e); return null; } }
  let ctx = null, pend = null;
  try { const bc = blockColor; blockColor = function (id) { const c = bc.apply(this, arguments); pend = {b: id, c}; return c; }; } catch (e) { warn('bc', e); }
  try { const pb = popBlock; popBlock = function (x, y, z) { let b = 0, w = 0; try { b = getB(x, y, z); const ly = b === T.DOORTOP ? y - 1 : y, m = entMeta.get(keyOf(x, ly, z)); w = (m && m.wood) || 0; } catch (_) {}
      const prev = ctx; ctx = {b, w, x, y, z}; try { return pb.apply(this, arguments); } finally { ctx = prev; } }; } catch (e) { warn('pop', e); }
  try { const bu = burst; burst = function (x, y, z, col) { let c = null;
      try { if (ctx && Math.floor(x) === ctx.x && Math.floor(z) === ctx.z) c = ctx; else if (pend && pend.c === col) { const bx = Math.floor(x), by = Math.floor(y), bz = Math.floor(z); let w = 0; try { const m = entMeta.get(keyOf(bx, by, bz)); w = (m && m.wood) || 0; } catch (_) {} c = {b: pend.b, w}; } } catch (_) {}
      pend = null;
      const n0 = parts.length; const r = bu.apply(this, arguments);
      try { if (c && c.b && parts.length > n0) { const ms = matsFor(c.b, c.w); let plantFlat = false; try { plantFlat = isPlant(c.b); } catch (_) {}
          if (plantFlat) { let pc = 0x6aa040; try { pend = null; pc = blockColor(c.b); pend = null; } catch (_) {} const pm = partMat(pc); for (let i = n0; i < parts.length; i++) if (parts[i] && parts[i].m && !parts[i].mist) parts[i].m.material = pm; U.flat++; }
          else if (ms && ms.length) { const L = ms.map(lam); if (L.every(Boolean)) {
            for (let i = n0; i < parts.length; i++) { const p = parts[i]; if (!p || !p.m || p.mist) continue; p.m.geometry = GEOS[(Math.random() * GEOS.length) | 0]; p.m.material = L; p.m.rotation.set(Math.random() * 6, Math.random() * 6, 0); U.tex++; } } else U.flat++; } } } catch (e) { warn('burst', e); }
      return r; }; } catch (e) { warn('wrap', e); }
  // v1.0.41 redstone: the red glow lights only the red specks, not the stone around them (the glow used to tint the whole block pink so it never matched the stone)
  try { const A = window.__TA, m = A && A.mat, F = 'gl_FragColor = vec4(t.rgb * (vDif + vEm), 1.0);';
    if (m && m.fragmentShader.includes(F)) { m.fragmentShader = m.fragmentShader.replace(F, 'vec3 em2 = vEm; if (vEm.r > 0.001 && vEm.r > 3.0 * vEm.g && vEm.r > 3.0 * vEm.b) em2 *= clamp((t.r - max(t.g, t.b)) * 4.0, 0.0, 1.0); gl_FragColor = vec4(t.rgb * (vDif + em2), 1.0);'); m.needsUpdate = true; U.sh = 1; } } catch (e) { warn('sh', e); }
  let emT = 0; const emIv = setInterval(() => { try { const C = window.__c107, c = C && C.made && C.made.redstone_ore, m = BLOCK_MATS[T.REDORE];
      if (c && m && U.emFor !== c) { const k = document.createElement('canvas'); k.width = k.height = c.width; const g = k.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, k.width, k.height);
        const mask = C.paint('redstone_ore', k); const t = new THREE.CanvasTexture(mask); try { const o = m.map; if (o) { t.wrapS = o.wrapS; t.wrapT = o.wrapT; t.magFilter = o.magFilter; t.minFilter = o.minFilter; t.colorSpace = o.colorSpace; t.encoding = o.encoding; } } catch (_) {}
        m.emissiveMap = t; m.needsUpdate = true; U.emFor = c; U.em = (U.em || 0) + 1; } } catch (e) { warn('em', e); } if (++emT > 160) clearInterval(emIv); }, 500);
})();
