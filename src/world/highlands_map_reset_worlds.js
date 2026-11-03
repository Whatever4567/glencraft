/* GLX-C273 (v1.0.89): the Highlands map for new and reset worlds - one connected grassy mainland (no sea channels or bridges), open lochs,
   rivers winding down mountain glens, rolling hills, ridged mountains, an OG spawn meadow, strongly rounded map corners and a great ice wall
   all round the edge instead of the void. Old saves keep their own land (the flag g89 is only set on new / reset worlds). */
(function c273() {
  const U = window.__c273 = {err: null, ms: 0, wall: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  U.on = () => { try { return !!(current && current.g89 && current.g42 && !DIM.cur && W >= 600); } catch (_) { return false; } };
  window.__g89 = U.on;
  const ew = enterWorld; enterWorld = function (save) { try { if (current) current.g89 = save ? !!(save.c273 && save.c273.g89) : current.mode !== 'creative'; } catch (_) {} return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && current && current.g89) d.c273 = {g89: 1}; } catch (_) {} return d; };
  const sst = (a, b, t) => { t = Math.max(0, Math.min(1, (t - a) / (b - a))); return t * t * (3 - 2 * t); };
  const F = (x, z, o) => Math.max(-1, Math.min(1, g9fbm(x, z, o) * 3.3));
  // landmarks: the pyramid desert moves in a little from the south-west corner, the volcano goes far off to the north-east mountains
  U.MT = () => [Math.round(W * 0.30), Math.round(D * 0.70)];
  U.volc = () => [Math.round(W * 0.70), Math.round(D * 0.30)];
  U.RE = () => Math.round(W * 0.463);           // radius of the ice wall (rounded square, p = 3)
  U.edgeQ = (x, z) => { const dx = Math.abs(x - (W >> 1)), dz = Math.abs(z - (D >> 1)); return Math.cbrt(dx * dx * dx + dz * dz * dz); };
  try { const mt = __c208.MT; __c208.MT = () => U.on() ? U.MT() : mt(); } catch (e) { ERR('mt', e); }
  let CAS = null;
  function at(x, z) {
    const cx = W >> 1, cz = D >> 1, rr = Math.hypot(x - cx, z - cz), q = U.edgeQ(x, z), RE = U.RE(), S = W / 864;
    const n1 = F(x / 90 + 2, z / 90 - 7, 3), n2 = F(x / 31 - 9, z / 31 + 4, 2);
    if (!CAS) { try { CAS = __c208.isl().map(c => [c.x, c.z]); } catch (_) { CAS = []; } }
    // mountains: broad ranges away from spawn, a big range round the volcano, snowy foothills against the ice wall
    const V = U.volc(), dv = Math.hypot(x - V[0], z - V[1]);
    let M = sst(0.0, 0.5, F(x / 300 + 5, z / 300 - 8, 2)) * sst(120 * S, 200 * S, rr);
    M = Math.max(M, (1 - sst(40 * S, 150 * S, dv)) * 0.95);
    /* v1.0.101 coast: a ragged shoreline, sandy beaches, then open sea deepening out to the ice wall */
    const qc = q + 14 * S * F(x / 70 + 41, z / 70 - 53, 3), C0 = RE - U.WS - 78 * S, coast = sst(C0 - 30 * S, C0, qc);
    M *= 1 - coast;
    for (const [ax, az] of CAS) M *= sst(55 * S, 110 * S, Math.hypot(x - ax, z - az));
    const r1 = 1 - Math.abs(F(x / 80 + 13, z / 80 - 21, 4)), r2 = 1 - Math.abs(F(x / 37 - 33, z / 37 + 17, 3)), ridge = r1 * r1 * (0.6 + 0.4 * r2);
    const hill = 3 + 11 * Math.pow(0.5 + 0.5 * n1, 1.4) + 2 * n2, mount = 12 + 46 * ridge + 4 * n1;
    let e = hill * (1 - M) + mount * M;
    // the spawn meadow: gentle, open and green
    const sp = 1 - sst(32 * S, 95 * S, rr); e = e * (1 - sp) + (3 + 1.3 * n2) * sp;
    // the desert flat (the pyramid isle, now joined to the land)
    const MT = U.MT(), dd = Math.hypot(x - MT[0], z - MT[1]) - 124 * S, dk = sst(0, 45 * S, dd); e = 0.6 + (e - 0.6) * dk;
    const keep = sst(60 * S, 120 * S, rr) * sst(10 * S, 50 * S, dd) * (1 - sst(RE - 45 * S, RE - 15 * S, q));
    // open lochs in the hills
    let loch = false; const lk = F(x / 170 - 61, z / 170 + 37, 2);
    if (lk > 0.5 && keep > 0) { const k = sst(0.5, 0.7, lk) * keep; e = e * (1 - k) - 5 * k; loch = e < 0; }
    // rivers: long winding glens (warped noise zero lines) running down through the mountains to the lochs
    const wx = x + 45 * F(x / 140 + 3, z / 140 - 1, 2), wz = z + 45 * F(x / 140 - 7, z / 140 + 5, 2);
    const rv = Math.abs(F(wx / 260 + 17, wz / 260 - 29, 3)), rw = 0.016 + 0.012 * (0.5 + 0.5 * n1);
    let riv = false;
    if (keep > 0) { const vk = sst(rw, rw + 0.07 + 0.1 * M, rv); const bed = -2.5; const ne = bed + (e - bed) * (1 - (1 - vk) * keep); if (ne < e) e = ne; riv = rv < rw && keep > 0.5; }
    let sea = false, beach = false;
    if (coast > 0) { const o = sst(C0, C0 + 40 * S, qc); const target = 1.2 - 3.2 * sst(C0 - 4 * S, C0 + 6 * S, qc) - 12 * o; e = e * (1 - coast) + Math.min(e, target) * coast; if (coast > 0.6) { beach = e < 2.6; sea = e < -0.5; } }
    const h = SEA + 1 + e;
    if (sea || beach) return {h: Math.max(6, Math.min(H - 5, Math.round(h))), hf: h, glen: 0.3, mMask: 0, loch: sea, sand: true, mar: false, coast: 1};
    const sand = (loch || riv || e < 1.6) && dk > 0.5 && e < 2.4 && sp < 0.5;
    return {h: Math.max(BASE + 4, Math.min(H - 5, Math.round(h))), hf: h, glen: riv ? 0.5 : 0.3, mMask: Math.min(1, M * 1.1), loch: loch || riv, sand, mar: false};
  }
  U.at = at;
  try { const rh = __c208.rawH; __c208.rawH = (x, z) => U.on() ? at(x, z) : rh(x, z); } catch (e) { ERR('rawH', e); }
  // ---------- after generation: the ice wall ----------
  // v1.0.92: the wall is a climbable staircase of solid icy snow (opaque snow blocks, tinted icy by the block shader in GLX-C282), rising one block per block
  // from 40 blocks inside the old wall line up to near the world roof, so it stands about three times higher over the land than before
  U.WS = 40;
  function wall() {
    const RE = U.RE(), WS = U.WS, SNOW = T.PACKSNOW || T.WOOL; /* v1.0.94 packed snow, v1.0.93: full white snow blocks, never the thin 178 snow layer */ let n = 0;
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
      const q = U.edgeQ(x, z); if (q < RE - WS - 130 * (W / 864)) continue;
      if (q < RE - WS) { const r = at(x, z); if (r.coast && r.loch && r.h < SEA - 2) { const c0 = x * H * D + z, fl = Math.max(8, r.h), SB = (x * 7 + z * 13) % 5 ? T.SAND : (T.GRAVEL || T.SAND);
          for (let y = fl - 2; y <= SEA; y++) { const i = c0 + y * D; world[i] = y < fl - 1 ? T.STONE : y <= fl ? SB : T.WATER; } continue; } }
      if (q < RE - WS - 6) continue;
      const col = x * H * D + z;
      if (q < RE - WS) { // snow-capped land creeping up to the wall
        for (let y = H - 2; y > SEA; y--) { const b = world[col + y * D]; if (b === T.WATER) break; if (b && b !== T.WATER) { if (b === T.GRASS || b === T.DIRT || b === T.STONE || b === T.HEATHER) world[col + y * D] = SNOW; break; } if (b) world[col + y * D] = 0; }
        continue; }
      let g = 0; for (let y = H - 2; y > 1; y--) { const b = world[col + y * D]; if (b && !PLANT[b] && b !== T.WATER) { g = y; break; } }
      const top = Math.max(Math.min(g, H - 4), U.wallTop(x, z));
      for (let y = 1; y < H - 1; y++) { const i = col + y * D; if (y <= top) { if (y > top - 3 || !world[i] || world[i] === T.WATER || PLANT[world[i]]) world[i] = y > top - 3 ? SNOW : T.STONE; } else world[i] = 0; }
      try { g9cols[(x * D + z) * 2] = top + 1; g9cols[(x * D + z) * 2 + 1] = 3; } catch (_) {}
      n++; }
    U.wall = n; }
  U.wallFn = wall;
  U.wallTop = (x, z) => Math.min(H - 4, SEA + 4 + Math.floor(U.edgeQ(x, z) - (U.RE() - U.WS)));
  // the ice: a glassy blue cladding over the inner face of the wall (one mesh, no extra block ids needed)
  let iceM = null;
  function iceMesh() { try { if (iceM) { scene.remove(iceM); iceM.geometry.dispose(); iceM = null; } return; /* v1.0.92: no see-through cladding any more (it caused the lag) */
      const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#f4fbff'); gr.addColorStop(0.25, '#bfe6f7'); gr.addColorStop(1, '#5fa6d0'); g.fillStyle = gr; g.fillRect(0, 0, 128, 256);
      let s = 7; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
      for (let i = 0; i < 70; i++) { g.strokeStyle = 'rgba(255,255,255,' + (0.15 + r() * 0.35) + ')'; g.lineWidth = 0.5 + r() * 1.5; g.beginPath(); let x = r() * 128, y = r() * 256; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .5) * 30; y += r() * 40; g.lineTo(x, y); } g.stroke(); }
      for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(30,90,140,' + r() * 0.18 + ')'; g.fillRect(r() * 128, r() * 256, 2 + r() * 10, 10 + r() * 50); }
      const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      const N = 900, RE = U.RE() - 0.15, cx = (W >> 1) + .5, cz = (D >> 1) + .5, pos = new Float32Array((N + 1) * 6), uv = new Float32Array((N + 1) * 4), ix = []; let L = 0, px = 0, pz = 0;
      for (let i = 0; i <= N; i++) { const a = i / N * 6.2832, ca = Math.cos(a), sa = Math.sin(a), r0 = RE / Math.cbrt(Math.abs(ca) ** 3 + Math.abs(sa) ** 3), x = cx + ca * r0, z = cz + sa * r0;
        if (i) L += Math.hypot(x - px, z - pz); px = x; pz = z; const top = U.wallTop(Math.round(x), Math.round(z)) + 1;
        pos.set([x, SEA - 1, z, x, top, z], i * 6); uv.set([L / 24, 0, L / 24, (top - SEA + 1) / 24], i * 4); if (i < N) { const a0 = i * 2; ix.push(a0, a0 + 2, a0 + 1, a0 + 1, a0 + 2, a0 + 3); } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(ix); geo.computeVertexNormals();
      iceM = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({map: tx, color: 0xdff4ff, emissive: 0x16384c, transparent: true, opacity: 0.9, side: THREE.DoubleSide}));
      iceM.frustumCulled = false; iceM.renderOrder = 2; iceM.userData.__dcR = 1e9; scene.add(iceM); } catch (e) { ERR('ice', e); } }
  U.iceMesh = iceMesh;
  let lastId = null; setInterval(() => { try { const id = typeof started !== 'undefined' && started && current ? current.id + (U.on() ? 'y' : 'n') + W : null; if (id !== lastId) { lastId = id; iceMesh(); } } catch (_) {} }, 1000);
  const gen = generate; generate = function () { CAS = null; const r = gen.apply(this, arguments); try { if (U.on()) { const t = performance.now(); wall(); U.ms = Math.round(performance.now() - t); try { dirtyAll = true; } catch (_) {} } } catch (e) { ERR('gen', e); } return r; };
  // v1.0.92: no invisible barrier - climb the wall if you like; past it you freeze (GLX-C282). Only the world bounds hold you in.
  setInterval(() => { try { if (!U.on() || typeof started === 'undefined' || !started || (window.__c317 && __c317.on())) return; P.x = Math.max(1.5, Math.min(W - 1.5, P.x)); P.z = Math.max(__XG ? __XZ + 1.5 : 1.5, Math.min(D - 1.5, P.z)); } catch (_) {} }, 250);
})();
