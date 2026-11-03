/* GLX-C307b (v1.1.17): drawing the north extension. Ext chunks near you are meshed by the game's own chunk mesher (the original
   buildChunk, before any wrappers) on a small padded scratch copy, then moved into place, two per tick, nearest first; chunks out of range
   are thrown away again, so phone memory and frame rate stay flat however far north you walk. */
(function c307b() {
  const U = window.__c307b = {err: null, n: 0, built: 0, ms: 0, R: 4};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const X = window.__c307, EH = X.EH, C = CH, PW = 3 * C + 1, key = (cx, cz) => (cz + 100) * 64 + cx;
  const grp = new THREE.Group(); grp.name = 'ext307'; scene.add(grp); const M = new Map(); let TMP = null;
  function drop(k) { const g = M.get(k); if (!g) return; grp.remove(g); g.traverse(o => { if (o.isInstancedMesh) o.dispose(); else if (o.geometry) o.geometry.dispose(); }); M.delete(k); }
  U.clear = () => { for (const k of [...M.keys()]) drop(k); };
  function build(cx, cz) { const t0 = performance.now(), k = key(cx, cz);
    if (!TMP) TMP = new Uint8Array(PW * EH * PW); const ox = cx * C - C, oz = cz * C - C, Hm = H, Dm = D, wd = world, Wm = W;
    for (let tx = C - 1; tx <= 2 * C; tx++) { const x = ox + tx; for (let tz = C - 1; tz <= 2 * C; tz++) { const z = oz + tz, b = (tx * EH) * PW + tz;
        if (x < 0 || x >= Wm || z < __XZ) { for (let y = 0; y < EH; y++) TMP[b + y * PW] = 0; continue; }
        if (z >= 0) { const m = (x * Hm) * Dm + z; for (let y = 0; y < EH; y++) TMP[b + y * PW] = wd[m + y * Dm]; continue; }
        for (let y = 0; y < EH; y++) TMP[b + y * PW] = X.get(x, y, z); } }
    const sv = [world, W, H, D], cc = window.__caveCull, o = chunkObjs.get(65), ol = chunkLists.get(65); let g = null;
    chunkObjs.delete(65); chunkLists.delete(65); window.__caveCull = null;
    try { world = TMP; W = PW; H = EH; D = PW; __bcBase(1, 1); g = chunkObjs.get(65); }
    catch (e) { ERR('bc', e); }
    finally { world = sv[0]; W = sv[1]; H = sv[2]; D = sv[3]; window.__caveCull = cc; chunkObjs.delete(65); chunkLists.delete(65); if (o) chunkObjs.set(65, o); if (ol) chunkLists.set(65, ol); }
    if (!g) return; blockGroup.remove(g); drop(k); g.position.set(ox, 0, oz); g.userData.ext = k; grp.add(g); M.set(k, g); U.built++; U.ms = Math.round(performance.now() - t0); }
  U.build = build;
  setInterval(() => { try {
      const on = X.ready && !!__XG && typeof started !== 'undefined' && started; grp.visible = on; if (!on) { if (M.size) U.clear(); return; }
      const pcx = Math.floor(P.x / C), pcz = Math.floor(P.z / C), R = U.R, want = [];
      for (const k of [...M.keys()]) { const cx = k % 64, cz = Math.floor(k / 64) - 100; if (Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz)) > R + 1) drop(k); }
      if (pcz - R <= -1) for (let cz = Math.max(Math.floor(__XZ / C), pcz - R); cz <= Math.min(-1, pcz + R); cz++) for (let cx = Math.max(0, pcx - R); cx <= Math.min(Math.floor((W - 1) / C), pcx + R); cx++) {
        const k = key(cx, cz); if (!M.has(k) || X.dirty.has(k)) want.push([Math.hypot(cx - pcx, cz - pcz) - (X.dirty.has(k) ? 99 : 0), cx, cz, k]); }
      want.sort((a, b) => a[0] - b[0]); for (let i = 0; i < Math.min(2, want.length); i++) { const w = want[i]; X.dirty.delete(w[3]); build(w[1], w[2]); }
      U.n = M.size; } catch (e) { ERR('loop', e); } }, 90);
  // ---------- the edges move with it: the world bound, the freezing and the open sea now sit at the new north boundary ----------
  try { setInterval(() => { try { if (!X.ready || !__XG || !started || (window.__c317 && __c317.on())) return; if (P.z < __XZ + 1.5) { P.z = __XZ + 1.5; } } catch (_) {} }, 100); } catch (e) { ERR('edge', e); }
})();
