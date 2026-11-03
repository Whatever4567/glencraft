/* ===================== GLX-C172 (v1.0.33): the black castle island is one charred land - black grass and ground, dead black trees, lava pools ===================== */
(function c172() {
  const U = window.__c172 = {err: null, pools: 0, leaves: 0, plants: 0, ms: 0, sh: 0, up: 0};
  const warn = (w, e) => { U.err = w + ' ' + String(e && e.stack || e); console.warn('c172', w, e); };
  const RZ = 84;
  const black = () => { try { if (typeof g9castles === 'undefined' || !g9castles || genVer !== GEN9 || cityGen || W < 600) return null; return g9castles.find(q => q[0] === 'black') || null; } catch (_) { return null; } };
  const isl = () => (window.__c101 && __c101.isl) || null;
  const inZone = (x, z, c) => { const d = Math.hypot(x - c[1], z - c[2]); if (d > RZ) return false; const I = isl(); if (I && Math.hypot(x - I.cx, z - I.cz) < I.R + 8) return false;
    for (const o of g9castles) if (o !== c && Math.hypot(x - o[1], z - o[2]) < d) return false; return true; };
  // ---------- 1) the shader: a 'charred' flag in the grass-tint attribute (green channel exactly 0) darkens the whole texel ----------
  function patchShader() { try { const m = window.__TA && __TA.mat; if (!m || m.userData.c172) return !!(m && m.userData.c172);
      const A = 'vec4 t = texture(uArr, vUvL);', fs = m.fragmentShader; if (fs.indexOf(A) < 0) return false;
      m.fragmentShader = fs.replace(A, A + ' if (vTint.g < 0.0005 && vTint.r > 0.05) { float lu = dot(t.rgb, vec3(0.3, 0.55, 0.15)); t.rgb = vec3(lu * 0.26 + 0.015, lu * 0.2 + 0.01, lu * 0.2 + 0.01); } else');
      m.userData.c172 = 1; m.needsUpdate = true; U.sh = 1; return true; } catch (e) { warn('sh', e); return false; } }
  let CHL = null;
  function charLayers() { if (CHL) return CHL; if (!window.__TA || !__TA.layers) return null; const s = new Set();
    for (const t of [T.GRASS, T.DIRT, T.LOG, T.STONE, T.SAND, T.GRAVEL, T.SNOW, 135, 136, 137, 138, 139, 143, T.PODZOL || 142]) { const L = __TA.layers(t); if (L) L.forEach(v => s.add(v)); }
    return (CHL = s.size ? s : null); }
  function charMesh(m, c) { const g = m.geometry, la = g.getAttribute('lay'), pa = g.getAttribute('position'); if (!la || !pa) return;
    const L = charLayers(); if (!L) return; let at = g.getAttribute('bioC'); const n = la.count;
    if (!at || at.count !== n) { at = new THREE.BufferAttribute(new Uint8Array(n * 3), 3, true); g.setAttribute('bioC', at); }
    const A = at.array, Pp = pa.array, Ly = la.array, ox = m.parent ? m.parent.position.x : 0, oz = m.parent ? m.parent.position.z : 0; let k = 0;
    for (let v = 0; v < n; v++) { if (!L.has(Ly[v])) continue; const x = Pp[v * 3] + ox, z = Pp[v * 3 + 2] + oz; if (!inZone(x, z, c)) continue; A[v * 3] = 255; A[v * 3 + 1] = 0; A[v * 3 + 2] = 255; k++; }
    if (k) at.needsUpdate = true; m.userData.c172 = m.userData.bioImg || 1; }
  function charGroup(grp, cx, cz) { const c = black(); if (!c || !grp || DIM.cur) return; const x = cx * CH + CH / 2, z = cz * CH + CH / 2; if (Math.hypot(x - c[1], z - c[2]) > RZ + 24) return;
    if (!patchShader()) return; for (const m of grp.children) if (m.userData && m.userData.merged) charMesh(m, c); }
  const bc = buildChunk; buildChunk = function (cx, cz) { const r = bc.apply(this, arguments); try { charGroup(chunkObjs.get(cx * 64 + cz), cx, cz); } catch (e) { warn('bc', e); } return r; };
  // the biome-tint re-bake (new map) would wipe the flag: put it back
  setInterval(() => { try { const c = black(); if (!c || DIM.cur || typeof chunkObjs === 'undefined') return; let k = 0;
      for (const [id, g] of chunkObjs) { const cx = Math.floor(id / 64), cz = id % 64, x = cx * CH + CH / 2, z = cz * CH + CH / 2; if (Math.hypot(x - c[1], z - c[2]) > RZ + 24) continue;
        for (const m of g.children) if (m.userData && m.userData.merged && m.userData.c172 !== (m.userData.bioImg || 1)) { if (!patchShader()) return; charMesh(m, c); k++; } if (k > 30) break; } } catch (e) { warn('iv', e); } }, 400);

  // ---------- 2) the land: no leaves, grass tufts or flowers; scorched patches; lava pools (natural blocks only) ----------
  const mine = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i);
  const inb = (x, y, z) => x > 0 && z > 0 && x < W - 1 && z < D - 1 && y > 0 && y < H - 1;
  const get = (x, y, z) => inb(x, y, z) ? world[idx(x, y, z)] : 0;
  const put = (x, y, z, b) => { if (!inb(x, y, z)) return false; const i = idx(x, y, z); if (mine(i)) return false; world[i] = b; return true; };
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const BLK = T.BLACKSTONE || 248, MG = T.MAGMA || 208, GROUND = new Set([T.GRASS, T.DIRT, T.SAND, T.STONE, T.GRAVEL, T.PODZOL || 142, T.MOSS || 144].filter(v => v !== undefined));
  const nearBridge = (x, z) => { try { return (__c113.bridges || []).some(b => { const [ax, az, ux, uz, t0, t1] = b.a, px = x - ax, pz = z - az, t = px * ux + pz * uz; return t > t0 - 6 && t < t1 + 10 && Math.abs(-px * uz + pz * ux) < 8; }); } catch (_) { return false; } };
  function topAt(x, z) { for (let y = Math.min(H - 2, SEA + 40); y > SEA - 2; y--) { const b = get(x, y, z); if (b && b !== T.WATER && !LEAFY[b] && PLANT[b] !== 1 && !LOGGY[b]) return y; } return -1; }
  function scorch(c) { const t0 = performance.now(), ch = new Set(), cx = c[1], cz = c[2];
    for (let x = cx - RZ; x <= cx + RZ; x++) for (let z = cz - RZ; z <= cz + RZ; z++) { if (!inb(x, 5, z) || !inZone(x, z, c)) continue;
      for (let y = SEA - 2; y < Math.min(H - 2, SEA + 46); y++) { const i = idx(x, y, z), b = world[i]; if (!b) continue;
        if (LEAFY[b] && !mine(i)) { world[i] = 0; U.leaves++; ch.add(Math.floor(x / CH) * 64 + Math.floor(z / CH)); }
        else if (PLANT[b] === 1 && b !== T.WATER && b !== T.TORCH && !mine(i) && (b === T.TALLGRASS || FLOWERS.has(b) || b === 238 || b === T.THISTLE)) { world[i] = 0; U.plants++; ch.add(Math.floor(x / CH) * 64 + Math.floor(z / CH)); } }
      const d = Math.hypot(x - cx, z - cz); if (d < 30) continue;
      const y = topAt(x, z); if (y <= SEA) continue; const b = get(x, y, z), v = h3(x, 7, z);
      if (GROUND.has(b) && !nearBridge(x, z) && v < 0.06) { if (put(x, y, z, v < 0.012 ? MG : BLK)) ch.add(Math.floor(x / CH) * 64 + Math.floor(z / CH)); } }
    // lava pools, kept off the paths, the bridge and the castle
    let s = (gSeed ^ 0x1a7a) >>> 0 || 3; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; let n = 0;
    for (let tr = 0; tr < 900 && n < 12; tr++) { const a = rnd() * 6.283, r = 32 + rnd() * 46, px = Math.round(cx + Math.cos(a) * r), pz = Math.round(cz + Math.sin(a) * r), R = 1.4 + rnd() * 1.6;
      if (!inZone(px, pz, c) || nearBridge(px, pz)) continue; const y0 = topAt(px, pz); if (y0 <= SEA + 1) continue; let okp = true; const cells = [];
      for (let dx = -4; dx <= 4 && okp; dx++) for (let dz = -4; dz <= 4; dz++) { const d = Math.hypot(dx, dz); if (d > R + 1.6) continue; const x = px + dx, z = pz + dz, y = topAt(x, z);
        if (!inZone(x, z, c) || nearBridge(x, z) || Math.abs(y - y0) > 2 || !GROUND.has(get(x, y, z)) || mine(idx(x, y0, z))) { okp = false; break; } cells.push([x, z, d]); }
      if (!okp || cells.length < 6) continue; if (cells.some(([x, z]) => get(x, y0 + 1, z) && !GROUND.has(get(x, y0 + 1, z)) && get(x, y0 + 1, z) !== T.WATER && PLANT[get(x, y0 + 1, z)] !== 1 && !LEAFY[get(x, y0 + 1, z)])) continue;
      for (const [x, z, d] of cells) { for (let y = y0 + 1; y <= y0 + 3; y++) if (!mine(idx(x, y, z))) world[idx(x, y, z)] = 0;
        if (d <= R) { put(x, y0, z, T.LAVA); put(x, y0 - 1, z, BLK); } else { put(x, y0, z, h3(x, 3, z) < 0.3 ? MG : BLK); if (!get(x, y0 - 1, z)) put(x, y0 - 1, z, BLK); } ch.add(Math.floor(x / CH) * 64 + Math.floor(z / CH)); }
      n++; }
    U.pools = n; U.ms = Math.round(performance.now() - t0); return ch; }
  U.scorch = scorch;
  const ok = () => typeof current !== 'undefined' && current && !DIM.cur && current.mode !== 'creative' && black() && current.l94;
  const ge = generate; generate = function () { const r = ge.apply(this, arguments); try { if (ok()) { scorch(black()); current.c172u = true; } } catch (e) { warn('gen', e); } return r; };
  const ew = enterWorld; enterWorld = function (save) { try { if (current) current.c172u = save ? !!save.c172 : true; } catch (_) {} return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && current && current.c172u) d.c172 = 1; } catch (_) {} return d; };
  let wait = 3;
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments);
    try { if (started && !paused && current && !current.c172u && (wait -= (+dt || 0.016)) < 0) { current.c172u = true; if (ok()) { const ch = scorch(black());
          for (const id of ch) { try { markDirty(Math.floor(id / 64) * CH + 2, (id % 64) * CH + 2); } catch (_) {} } try { scanLights(); validateLights(); } catch (_) {} U.up = 1; } } } catch (e) { warn('up', e); }
    return r; };
})();
