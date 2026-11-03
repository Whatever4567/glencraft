/* ===================== GLX-C189 (v1.0.36): settling snow + snowy mountain tops ===================== */
// No free block ids, so snow is a per-column overlay (like the park paint): SN[x*D+z] = level 0-4 (bits 0-2), 64 = permanent, 128 = snow-block cap.
// SNY holds the top block it sits on - dig that block or build over it and the snow there goes. One mesh per chunk, inside the chunk's group (blockGroup).
(function c189() {
  const U = window.__c189 = {n: 0, caps: 0, edge: 0, settled: 0, melted: 0, meshes: 0, ms: 0, err: null, lastSnow: -9, gd: 0};
  let SN = null, SNY = null, act = new Set(), pendCaps = false, capAt = 0, lastGD = null;
  const dirty = new Set();
  const ok = () => { try { return !!(started && current && !DIM.cur && !cityGen && (typeof genVer === 'undefined' || genVer === GEN9)); } catch (_) { return false; } };
  const alloc = () => { if (!SN || SN.length !== W * D) { SN = new Uint8Array(W * D); SNY = new Uint8Array(W * D); act = new Set(); } };
  const cid = (x, z) => Math.floor(x / CH) * 64 + Math.floor(z / CH);
  const topY = (x, z) => { const b0 = x * H * D + z; for (let y = H - 1; y > 0; y--) { const b = world[b0 + y * D]; if (b && b !== T.WATER && b !== T.LAVA && b !== T.TORCH && PLANT[b] !== 1) return y; } return 0; };
  const GROUNDS = new Set([T.STONE, T.GRASS, T.DIRT, T.GRAVEL, T.HEATHER, T.PEAT, T.PODZOL, T.MOSS, T.DEEPSLATE, T.SAND].filter(v => v !== undefined));
  // can snow lie on top of this column? (open sky, not water, not doors/fences/torches)
  function canLie(x, z, t) { if (t < 1 || t >= H - 1) return false; const b = world[(x * H + t) * D + z], a = world[(x * H + t + 1) * D + z];
    if (a === T.WATER || a === T.LAVA || b === T.LAVA || b === T.FIRE) return false; if (ENT[b] && !LEAFY[b]) return false; return true; }
  // ---------- texture + material ----------
  const tc = document.createElement('canvas'); tc.width = tc.height = 64; { const g = tc.getContext('2d'); g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, 64, 64);
    let s = 5; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 340; i++) { g.fillStyle = ['#ffffff', '#e3eaf3', '#d6e0ec', '#fbfdff'][i % 4]; const w = 1 + r() * 3; g.fillRect(r() * 64, r() * 64, w, w); } }
  const tex = new THREE.CanvasTexture(tc); tex.magFilter = THREE.NearestFilter; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const mat = new THREE.MeshLambertMaterial({map: tex, color: 0xffffff}); U.mat = mat;
  // ---------- per-chunk mesh ----------
  function quad(A, p, n, uv) { const b = A.p.length / 3; for (let v = 0; v < 4; v++) { A.p.push(p[v][0], p[v][1], p[v][2]); A.n.push(n[0], n[1], n[2]); A.u.push(uv[v][0], uv[v][1]); } A.i.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  function box(A, x0, y0, z0, x1, y1, z1, sides) {
    const v0 = 0, v1 = Math.min(1, y1 - y0);
    quad(A, [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    if (sides & 1) quad(A, [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], [[0, v0], [1, v0], [1, v1], [0, v1]]);
    if (sides & 2) quad(A, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], [[0, v0], [1, v0], [1, v1], [0, v1]]);
    if (sides & 4) quad(A, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], [[0, v0], [1, v0], [1, v1], [0, v1]]);
    if (sides & 8) quad(A, [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], [[0, v0], [1, v0], [1, v1], [0, v1]]);
  }
  const NB = [[1, 0, 1], [-1, 0, 2], [0, 1, 4], [0, -1, 8]];
  const thick = l => 0.0625 * (1 + l);
  function surf(x, z) { if (x < 0 || z < 0 || x >= W || z >= D) return 999; const i = x * D + z, s = SN[i]; const t = topY(x, z); if (!s || SNY[i] !== t) return t + 1; return s & 128 ? t + 1.003 : t + 1 + thick(s & 7); }
  function meshChunk(cx, cz) {
    const grp = chunkObjs.get(cx * 64 + cz); if (!grp) return;
    for (const c of grp.children.slice()) if (c.userData.c189) { grp.remove(c); c.geometry.dispose(); }
    if (!SN || SN.length !== W * D || DIM.cur) return;
    const A = {p: [], n: [], u: [], i: []}, x0 = cx * CH, z0 = cz * CH, x1 = Math.min(W, x0 + CH), z1 = Math.min(D, z0 + CH);
    for (let x = x0; x < x1; x++) for (let z = z0; z < z1; z++) { const i = x * D + z, s = SN[i]; if (!s) continue;
      const t = topY(x, z); if (SNY[i] !== t || !canLie(x, z, t)) { SN[i] = 0; SNY[i] = 0; act.delete(i); continue; }
      if (s & 128) { let sd = 0; for (const [dx, dz, bit] of NB) { const X = x + dx, Z = z + dz; if (X < 0 || Z < 0 || X >= W || Z >= D || !solid(X, t, Z)) sd |= bit; }
        const e = 0.003; box(A, x - (sd & 2 ? e : 0), t, z - (sd & 8 ? e : 0), x + 1 + (sd & 1 ? e : 0), t + 1 + e, z + 1 + (sd & 4 ? e : 0), sd); continue; }
      const top = t + 1 + thick(s & 7); let sd = 0;
      for (const [dx, dz, bit] of NB) if (surf(x + dx, z + dz) < top - 0.01) sd |= bit;
      box(A, x, t + 1, z, x + 1, top, z + 1, sd); }
    if (!A.i.length) return;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(A.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(A.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(A.u, 2)); g.setIndex(A.i); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat); m.userData.c189 = 1; grp.add(m); U.meshes++;
  }
  U.meshChunk = meshChunk;
  const bc = buildChunk; buildChunk = function (cx, cz) { const r = bc.apply(this, arguments); try { if (SN && !DIM.cur) { dirty.delete(cx * 64 + cz); meshChunk(cx, cz); } } catch (e) { U.err = 'mesh ' + e; } return r; };
  // ---------- snowcaps on the high tops (new and reset worlds, made once, never melt) ----------
  function makeCaps() {
    alloc(); const t0 = performance.now(); let caps = 0, edge = 0; const fbm = typeof g9fbm === 'function' ? g9fbm : null, base = U.capY = window.__c189capY || (() => { const hs = []; for (let x = 2; x < W - 2; x += 4) for (let z = 2; z < D - 2; z += 4) { const t = topY(x, z); if (t > SEA + 2) hs.push(t); } if (hs.length < 500) return 87; hs.sort((p, q) => p - q); return Math.max(74, Math.min(87, hs[Math.floor(hs.length * 0.996)] + 1)); })();   // v1.0.36: lower hills get caps too
    const gc = typeof g9cols !== 'undefined' && g9cols && g9cols.length === W * D * 2 ? g9cols : null;
    for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) {
      if (gc && gc[(x * D + z) * 2] < base - 12) continue;
      const t = topY(x, z); if (t < base - 8 || !canLie(x, z, t)) continue;
      const n = fbm ? fbm(x / 21 + 5.3, z / 21 - 2.1, 3) : 0, th = base + n * 8 + (((x * 73856093) ^ (z * 19349663)) >>> 0) % 3 - 1;
      const b = world[(x * H + t) * D + z], i = x * D + z;
      if (t >= th && GROUNDS.has(b)) { SN[i] = 128 | 64; SNY[i] = t; caps++; }
      else if (t >= th - 3 && (GROUNDS.has(b) || LEAFY[b] || (window.__NAT && __NAT[b]))) { SN[i] = 64 | Math.max(1, Math.min(3, 1 + Math.floor(t - (th - 3)))); SNY[i] = t; edge++; } }
    U.caps = caps; U.edge = edge; U.capMs = Math.round(performance.now() - t0); current.c189caps = 1;
    for (const id of chunkObjs.keys()) dirty.add(id);
  }
  U.makeCaps = makeCaps;
  // ---------- settling + melting ----------
    function tick() {
    if (!ok()) return; alloc();
    if (pendCaps && !(window.__c105 && __c105.phase)) { if (!capAt) capAt = performance.now() + 6000; else if (performance.now() > capAt) { pendCaps = false; capAt = 0; try { makeCaps(); } catch (e) { U.err = 'caps ' + e; } } }
    let dd = lastGD === null ? 0 : ((dayClock - lastGD + CYCLE) % CYCLE) / CYCLE; if (dd > 0.5) dd = 0; lastGD = dayClock; const gd = U.gd = U.gd + dd;
    const snowing = !!window.__snowing && !(window.__c105 && __c105.phase);
    if (snowing) { U.lastSnow = gd; const force = !!window.__forceSnow, minY = (window.__snowY || SEA + 30) - 14, R = 44, px = P.x, pz = P.z;
      for (let k = 0; k < 160; k++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * R, x = Math.floor(px + Math.cos(a) * r), z = Math.floor(pz + Math.sin(a) * r);
        if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1 || !chunkObjs.has(cid(x, z))) continue; const t = topY(x, z); if ((!force && t < minY) || !canLie(x, z, t)) continue;
        const i = x * D + z, s = SN[i]; if (s & 192) continue; if (Math.random() < 0.5) continue;
        const lv = SNY[i] === t ? s & 7 : 0; if (lv >= 4) continue; SN[i] = lv + 1; SNY[i] = t; act.add(i); U.settled++; dirty.add(cid(x, z)); } }
    else if (dd > 0 && gd - U.lastSnow > 0.2 && act.size) { const p = dd * 4 / 3 * (window.__c189fast || 1);
      for (const i of act) { if (Math.random() >= p) continue; const s = SN[i]; if (s & 64) { act.delete(i); continue; } const lv = (s & 7) - 1;
        if (lv <= 0) { SN[i] = 0; SNY[i] = 0; act.delete(i); } else SN[i] = lv; U.melted++; const x = Math.floor(i / D), z = i % D; if (chunkObjs.has(cid(x, z))) dirty.add(cid(x, z)); } }
    let n = 0; const t0 = performance.now(); for (const id of dirty) { dirty.delete(id); try { meshChunk(Math.floor(id / 64), id % 64); } catch (e) { U.err = 'mesh ' + e; } if (++n >= 6 || performance.now() - t0 > 6) break; }
    U.n = act.size; U.ms = Math.round((performance.now() - t0) * 10) / 10;
  }
  setInterval(() => { try { tick(); } catch (e) { U.err = 'tick ' + (e && e.stack || e); } }, 1000);
  // ---------- save / load ----------
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments);
    try { if (d && !DIM.cur && SN && SN.length === W * D) d.c189 = {sn: rleEncode(SN), sy: rleEncode(SNY), ls: U.lastSnow, gd: U.gd, caps: current && current.c189caps ? 1 : 0, pc: pendCaps ? 1 : 0}; } catch (_) {} return d; };
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments);
    try { if (d && !d.dim && d.world) { SN = null; alloc(); lastGD = null; const c = d.c189;
        if (c && c.sn) { rleDecode(c.sn, SN); rleDecode(c.sy, SNY); for (let i = 0; i < SN.length; i++) if (SN[i] && !(SN[i] & 64)) act.add(i); U.lastSnow = typeof c.ls === 'number' ? c.ls : -9; U.gd = typeof c.gd === 'number' ? c.gd : 0; if (current) current.c189caps = c.caps; pendCaps = !!c.pc; } else pendCaps = false;
        for (const id of chunkObjs.keys()) dirty.add(id); } } catch (e) { U.err = 'load ' + e; } return r; };
  const ew = enterWorld; enterWorld = function (save) { if (!save) { SN = null; lastGD = null; U.lastSnow = -9; U.gd = 0; pendCaps = true; capAt = 0; try { current.c189caps = 0; } catch (_) {} } return ew.apply(this, arguments); };
  U.sn = () => SN; U.sny = () => SNY; U.dirty = dirty; U.act = () => act;
})();
