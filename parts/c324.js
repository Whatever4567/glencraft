/* GLX-C324 (v1.1.32): THE ROUND EARTH UP CLOSE. Out past the map the Earth was only drawn as smooth sea sheets, so the new continents,
   the snow cliffs round Glencraft, the shallow sea floor and every hole you dig are now drawn as real blocks near you by the game's own
   chunk mesher, a few chunks at a time (lazy, nothing stored but what you change). It works on every side of the planet. Also: no grey
   Earth fog out in space or on the Moon and Mars, so the red Mars sand and the grey Moon dust show in their real colours again. */
(function c324() {
  const U = window.__c324 = {err: null, meshed: 0, ms: 0, n: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); console.warn('c324', w, e); };
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent) || (typeof PERF !== 'undefined' && PERF), C = CH, PW = 3 * C + 1, NB = 72, RN = PH ? 2 : 3;
  const E = () => window.__c320, F = () => window.__c321, on = () => { try { return !!(window.__c317 && __c317.on()); } catch (_) { return false; } };
  const MS = [[[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 1, 0], [-1, 0, 0], [0, 0, 1]], [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[1, 0, 0], [0, -1, 0], [0, 0, -1]], [[1, 0, 0], [0, 0, 1], [0, -1, 0]], [[1, 0, 0], [0, 0, -1], [0, 1, 0]]];
  const QS = MS.map(m => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...m[0]), new THREE.Vector3(...m[1]), new THREE.Vector3(...m[2]))));
  const root = new THREE.Group(); root.name = 'earth324'; scene.add(root); const meshes = new Map(); let fAx = -1, fPiv = '', band = null, TMP = null;
  const drop = k => { const g = meshes.get(k); meshes.delete(k); if (!g) return; root.remove(g); g.traverse(o => { if (o.isInstancedMesh) o.dispose(); else if (o.geometry) o.geometry.dispose(); }); };
  const dropAll = () => { for (const k of [...meshes.keys()]) drop(k); stale.clear(); };
  U.dirty = new Set(); const stale = new Set();
  // v1.1.38: generated blocks are cached in 8 high slabs per chunk column, so digging, walking and going down rebuild from the cache, not from the noise
  const SL = 8, SW = C + 2, cache = new Map(); let eV = -1, eL = [];
  function slab(ax, piv, cx, cz, sy) { const key = ax + '|' + piv.join() + '|' + cx + ',' + cz + ',' + sy; let A = cache.get(key); if (A) { cache.delete(key); cache.set(key, A); return A; }
    const e = E(), c = e.E(), R = e.R, m = MS[ax], Z0 = (typeof __XZ !== 'undefined' && __XZ) ? __XZ : 0; A = new Uint8Array(SW * SL * SW); U.gen = (U.gen || 0) + 1;
    for (let i = 0; i < SW; i++) for (let k = 0; k < SW; k++) { const lx = cx * C - 1 + i, lz = cz * C - 1 + k, ox = lx + 0.5 - piv[0], oz = lz + 0.5 - piv[2]; let gk = null;
      for (let j = 0; j < SL; j++) { const oy = sy + j + 0.5 - piv[1], wx = Math.round(m[0][0] * ox + m[1][0] * oy + m[2][0] * oz + piv[0] - 0.5), wy = Math.round(m[0][1] * ox + m[1][1] * oy + m[2][1] * oz + piv[1] - 0.5), wz = Math.round(m[0][2] * ox + m[1][2] * oy + m[2][2] * oz + piv[2] - 0.5);
        if (wx >= 0 && wx < W && wz < D && wz >= Z0 && wy >= 0) continue;
        if (e.flat) { const fb = e.earth(wx, wy, wz); if (fb && fb !== T.WATER) A[(i * SL + j) * SW + k] = fb; continue; }   /* v1.1.42: the flat Earth */
        const dx = wx + 0.5 - c[0], dy = wy + 0.5 - c[1], dz = wz + 0.5 - c[2], r = Math.sqrt(dx * dx + dy * dy + dz * dz), a = Math.max(wy - SEA, r - R); if (a > 32) continue;
        let b; if (e.tOn && a >= -40 && wy - SEA < r - R - 1) { b = e.terr(wx, wy, wz, dx, dy, dz, r); if (!b || b === T.WATER) continue; } else if (a < -40) { b = e.hol ? e.hol(wx, wy, wz, dx, dy, dz, r) : e.layer(r, 99, 0, wx, wy, wz); if (!b) continue; } else { if (!gk) gk = e.ground(wx, wy, wz, dx / r, dy / r, dz / r); if (a >= gk[0]) continue; b = e.layer(r, gk[0] - a, gk[1], wx, wy, wz); }
        A[(i * SL + j) * SW + k] = b; } }
    cache.set(key, A); if (cache.size > (PH ? 1500 : 3000)) cache.delete(cache.keys().next().value); return A; }
  U.cache = cache;
  // v1.1.38: missing slabs are generated a few at a time within the frame budget; a chunk is drawn once all its slabs are ready
  function ready(ax, piv, cx, cz, y0, t1, bud) { for (let s0 = 0; s0 < NB; s0 += SL) { if (cache.has(ax + '|' + piv.join() + '|' + cx + ',' + cz + ',' + (y0 + s0))) continue; if (performance.now() - t1 > bud) return false; slab(ax, piv, cx, cz, y0 + s0); } return performance.now() - t1 < bud * 1.6; }
  function fill(ax, piv, cx, cz, y0) { const e = E(); if (!TMP) TMP = new Uint8Array(PW * NB * PW); else TMP.fill(0); let any = false;
    for (let s0 = 0; s0 < NB; s0 += SL) { const A = slab(ax, piv, cx, cz, y0 + s0);
      for (let i = 0; i < SW; i++) for (let j = 0; j < SL; j++) { const src = (i * SL + j) * SW, dst = ((C - 1 + i) * NB + s0 + j) * PW + C - 1; TMP.set(A.subarray(src, src + SW), dst);
        if (!any && i > 0 && i <= C) for (let k = 1; k <= C; k++) if (A[src + k]) { any = true; break; } } }
    // dug or placed blocks: the edits list is read once per change, not once per block
    if (e.edits.size) { if (eV === -1) { eV = 0; eL = []; for (const k of e.edits.keys()) eL.push(k.split(',').map(Number)); }
      const m = MS[ax]; for (const q of eL) { const vx = q[0] + 0.5 - piv[0], vy = q[1] + 0.5 - piv[1], vz = q[2] + 0.5 - piv[2];
        const lx = Math.round(m[0][0] * vx + m[0][1] * vy + m[0][2] * vz + piv[0] - 0.5), ly = Math.round(m[1][0] * vx + m[1][1] * vy + m[1][2] * vz + piv[1] - 0.5), lz = Math.round(m[2][0] * vx + m[2][1] * vy + m[2][2] * vz + piv[2] - 0.5);
        const tx = lx - cx * C + C, ty = ly - y0, tz = lz - cz * C + C; if (tx >= C - 1 && tx <= 2 * C && tz >= C - 1 && tz <= 2 * C && ty >= 0 && ty < NB) TMP[(tx * NB + ty) * PW + tz] = 0; } }
    return any; }
  function mesh(ax, piv, cx, cz, y0) { const t0 = performance.now(), k = cx + ',' + cz; drop(k); const fk = fill(ax, piv, cx, cz, y0); U.fm = Math.round(performance.now() - t0); if (!fk) { meshes.set(k, null); return; }
    const sv = [world, W, H, D], cc = window.__caveCull, o = chunkObjs.get(65), ol = chunkLists.get(65); let g = null;
    chunkObjs.delete(65); chunkLists.delete(65); window.__caveCull = null; window.__c317mesh = 1;
    try { world = TMP; W = PW; H = NB; D = PW; __bcBase(1, 1); g = chunkObjs.get(65); } catch (e) { ERR('bc', e); }
    finally { world = sv[0]; W = sv[1]; H = sv[2]; D = sv[3]; window.__caveCull = cc; window.__c317mesh = 0; chunkObjs.delete(65); chunkLists.delete(65); if (o) chunkObjs.set(65, o); if (ol) chunkLists.set(65, ol); }
    if (!g) { meshes.set(k, null); return; } blockGroup.remove(g); g.position.set(cx * C - C - piv[0], y0 - piv[1], cz * C - C - piv[2]); root.add(g); meshes.set(k, g); U.meshed++; U.ms = Math.round(performance.now() - t0); (U.mt = U.mt || []).push([U.ms, U.fm]); if (U.mt.length > 400) U.mt.shift(); }
  U.mesh = mesh;
  setInterval(() => { try { const f = F(), e = E(); if (typeof started === 'undefined' || !started || DIM.cur || !on() || !f || !e) { root.visible = false; return; }
      const w = f.pw(); if (e.alt(w.x, w.y, w.z) > 120 || (window.__c309 && __c309.on)) { root.visible = false; if (meshes.size) dropAll(); band = null; return; } root.visible = true;
      const ax = f.ax, piv = ax === 2 ? [0, 0, 0] : f.piv.slice(), pk = ax + ':' + piv.join();
      if (pk !== fPiv) { dropAll(); fPiv = pk; fAx = ax; band = null; root.position.set(piv[0], piv[1], piv[2]); root.quaternion.copy(QS[ax]); root.updateMatrixWorld(true); }
      if (band === null || Math.abs(P.y - (band + 40)) > 14) { const nb = Math.floor((P.y - 40) / SL) * SL; if (band === null) dropAll(); else for (const k of meshes.keys()) stale.add(k); band = nb; }   /* v1.1.38: old chunks stay drawn until rebuilt, no remesh storm */
      if (U.wv !== world) { U.wv = world; cache.clear(); eV = -1; dropAll(); band = Math.floor((P.y - 40) / SL) * SL; } if (e.dirty) { e.dirty = 0; eV = -1; }   /* v1.1.38: an edit no longer redraws every chunk at once; the chunk you changed is redrawn first */
      const pcx = Math.floor(P.x / C), pcz = Math.floor(P.z / C);
      for (const k of [...meshes.keys()]) { const [cx, cz] = k.split(',').map(Number); if (Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz)) > RN + 1) drop(k); }
      const want = []; for (let cx = pcx - RN; cx <= pcx + RN; cx++) for (let cz = pcz - RN; cz <= pcz + RN; cz++) { const k = cx + ',' + cz; if (!meshes.has(k) || U.dirty.has(k) || stale.has(k)) want.push([Math.hypot(cx - pcx, cz - pcz) - (U.dirty.has(k) ? 99 : 0) + (stale.has(k) && meshes.get(k) ? 0.5 : 0), cx, cz, k]); }
      want.sort((a, b) => a[0] - b[0]); const mk = pcx + ',' + pcz, near = want.filter(q => q[0] < 1.5).length; U.hold = !meshes.has(mk) || near > 0;   /* v1.1.36: the ground under you is built first and fast, and you wait for it */
      const t1 = performance.now(), bud = U.hold ? (PH ? 10 : 14) : (PH ? 5 : 8); for (let i = 0; i < want.length && performance.now() - t1 < bud; i++) { const q = want[i]; if (!ready(ax, piv, q[1], q[2], band, t1, bud)) break; U.dirty.delete(q[3]); stale.delete(q[3]); mesh(ax, piv, q[1], q[2], band); } U.n = meshes.size; U.tk = Math.round(performance.now() - t1); } catch (e) { ERR('loop', e); } }, PH ? 120 : 70);
  setTimeout(() => { try { const up = updatePlayer; updatePlayer = function (dt) { try { const e = E(); if (U.hold && root.visible && !flying && e) { const w = F().pw(); const al = e.alt(w.x, w.y, w.z); if (al < 60 && al > -60 && P.vy < 0 && (U.hf || 0) < 90) { P.vy = 0; U.held = (U.held || 0) + 1; U.hf = (U.hf || 0) + 1; } } else U.hf = 0; } catch (_) {} return up.apply(this, arguments); }; } catch (e) { ERR('hold', e); } }, 3200);
  // blocks you dig or place out on the planet: redraw that chunk
  try { const s0 = setB; setB = function (x, y, z, v) { const r = s0.apply(this, arguments); try { const f = F(); if (f && on() && meshes.size) { const mx = ((Math.floor(x) % C) + C) % C, mz = ((Math.floor(z) % C) + C) % C; for (const [ax, az] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if ((ax === 0 || (ax > 0 ? mx === C - 1 : mx === 0)) && (az === 0 || (az > 0 ? mz === C - 1 : mz === 0))) U.dirty.add(Math.floor((Math.floor(x) + ax) / C) + ',' + Math.floor((Math.floor(z) + az) / C)); } } catch (_) {} return r; }; } catch (e) { ERR('setB', e); }
  // no grey ground fog in space or near the Moon and Mars
  // the icy edge tint (for the old ice wall round the map) stays on the map and the north ice plain, not out on the Earth, the Moon or Mars
  const uIceB = {value: new THREE.Vector4(0, 0, 0, 0)}, IA = 'if (uIce.w > 0.5) {';
  setInterval(() => { try { const m = window.__TA && __TA.mat; if (!m) return; if (!m.__c324 && m.fragmentShader.includes(IA)) { m.uniforms.uIceB = uIceB;
        m.fragmentShader = m.fragmentShader.replace('uniform vec4 uIce;', 'uniform vec4 uIce; uniform vec4 uIceB;').replace(IA, 'if (uIce.w > 0.5 && (uIceB.w < 0.5 || (vIceW.y > -90.0 && vIceW.y < uIceB.w && vIceW.x > -2.0 && vIceW.x < uIceB.x && vIceW.z > uIceB.y && vIceW.z < uIceB.z))) {');
        m.__c324 = 1; m.needsUpdate = true; U.ice = 1; }
      const Z0 = (typeof __XZ !== 'undefined' && __XZ) ? __XZ : 0; if (on()) uIceB.value.set(W + 2, Z0 - 2, D + 2, H + 200); else uIceB.value.w = 0; } catch (e) { ERR('ice', e); } }, 1000);
  const spaceNow = () => { try { const f = F(), b = f && f.body; if (!on() || DIM.cur || !f) return false; if (b === 'moon' || b === 'mars') return true; const w = f.pw(); return !!(E() && E().space(w.x, w.y, w.z)); } catch (_) { return false; } };
  try { const us = updateSky; updateSky = function () { const r = us.apply(this, arguments); try { const fg = scene.fog; if (fg && spaceNow()) { fg.near = Math.max(fg.near, 260); fg.far = Math.max(fg.far, 1400); fg.color.setHex(0x05060a); U.fogN = (U.fogN || 0) + 1; } } catch (e) { ERR('fog', e); } return r; }; } catch (e) { ERR('fog0', e); }
})();
