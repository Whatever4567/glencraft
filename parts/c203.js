/* ===================== GLX-C203 (v1.0.41): real snow - thin snow layer BLOCKS settle on open ground near you while it snows and melt away over a few days without snow.
   Replaces the v1.0.36 per-column snow overlay (c189 removed). Block id 178 (the old cooked pork item id, unused since v1.0.1). Breakable (quickest with a shovel), drops snowballs,
   saved with the world like any block. Placing is budgeted (a few per tick) and chunks are re-meshed in batches, at most one per interval, never per block. ===================== */
(function c203() {
  const SN = 178, U = window.__c203 = {id: SN, placed: 0, melted: 0, cells: 0, rebuilds: 0, pend: 0, caps: 0, conv: 0, ms: 0, err: null, lastSnow: -9, gd: 0, scan: 0};
  const warn = (w, e) => { U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); console.warn('c203', w, e); };
  const BALL = U.ball = IT.SNOWBALL = 379;
  // ---------- block + item ----------
  try {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#f2f6fb'; g.fillRect(0, 0, 128, 128);
    let s = 5; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 900; i++) { g.fillStyle = ['#ffffff', '#e2e9f2', '#d5dfeb', '#fbfdff'][i % 4]; const w = 1 + r() * 4; g.fillRect(r() * 128, r() * 128, w, w); }
    TEX.snow_layer = c.toDataURL('image/png'); FACES[SN] = 'snow_layer'; BLOCK_MATS[SN] = mat('snow_layer'); ICON_KEY[SN] = 'snow_layer'; AVG.snow_layer = 0xeef2f8;
    NAMES[SN] = 'Snow'; HARD[SN] = 0.5; MC_HARD[SN] = 0.25; REQ[SN] = 0; try { NEEDS_PICK.delete(SN); } catch (_) {} try { SHOVEL_ON.add(SN); } catch (_) {}
    ENT[SN] = 1; PLANT[SN] = 1; try { if (window.__NAT) __NAT[SN] = 1; } catch (_) {} try { if (chunkST) chunkST[SN] = 1; } catch (_) {}
    try { PLACEABLE.delete(SN); } catch (_) {}
    NAMES[BALL] = 'Snowball';
    ICONS[BALL] = drawIcon(g => { const gr = g.createRadialGradient(-7, -8, 2, 0, 0, 22); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, '#e6eef8'); gr.addColorStop(1, '#a9bccf'); g.fillStyle = gr; g.beginPath(); g.arc(0, 2, 20, 0, 7); g.fill();
      g.fillStyle = 'rgba(150,170,195,.45)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(Math.sin(i * 2.1) * 10, Math.cos(i * 1.3) * 10 + 3, 2.5, 0, 7); g.fill(); } });
    if (!ORDER.includes(BALL)) ORDER.push(BALL); if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(BALL)) CREATIVE_ALL.push(BALL);
  } catch (e) { warn('setup', e); }
  try { const df = dropsFor; dropsFor = function (b) { if (b === SN) { let n = 1; try { const t = TOOL[heldToolId()]; if (t && t[0] === 'shovel') n = 2; } catch (_) {} return [[BALL, n]]; } return df.apply(this, arguments); }; } catch (e) { warn('drops', e); }
  // ---------- mesh: one merged thin-layer mesh per chunk ----------
  const TH = 0.125;
  function quad(A, p, n, uv) { const b = A.p.length / 3; for (let v = 0; v < 4; v++) { A.p.push(p[v][0], p[v][1], p[v][2]); A.n.push(n[0], n[1], n[2]); A.u.push(uv[v][0], uv[v][1]); } A.i.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const open = (x, y, z) => { if (x < 0 || z < 0 || x >= W || z >= D) return false; const b = world[(x * H + y) * D + z]; return b !== SN && (!b || !solid(x, y, z) || ENT[b] || b === T.GLASS || LEAFY[b]); };
  function layerGeo(a) { const A = {p: [], n: [], u: [], i: []};
    for (let k = 0; k < a.length; k += 3) { const x = a[k], y = a[k + 1], z = a[k + 2], y1 = y + TH, v1 = TH;
      quad(A, [[x, y1, z + 1], [x + 1, y1, z + 1], [x + 1, y1, z], [x, y1, z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      if (open(x + 1, y, z)) quad(A, [[x + 1, y, z + 1], [x + 1, y, z], [x + 1, y1, z], [x + 1, y1, z + 1]], [1, 0, 0], [[0, 0], [1, 0], [1, v1], [0, v1]]);
      if (open(x - 1, y, z)) quad(A, [[x, y, z], [x, y, z + 1], [x, y1, z + 1], [x, y1, z]], [-1, 0, 0], [[0, 0], [1, 0], [1, v1], [0, v1]]);
      if (open(x, y, z + 1)) quad(A, [[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y1, z + 1], [x, y1, z + 1]], [0, 0, 1], [[0, 0], [1, 0], [1, v1], [0, v1]]);
      if (open(x, y, z - 1)) quad(A, [[x + 1, y, z], [x, y, z], [x, y1, z], [x + 1, y1, z]], [0, 0, -1], [[0, 0], [1, 0], [1, v1], [0, v1]]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(A.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(A.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(A.u, 2)); g.setIndex(A.i); g.computeBoundingSphere(); return g; }
  try { const bc = buildChunk; buildChunk = function (cx, cz) { const r = bc.apply(this, arguments);
      try { const id = cx * 64 + cz, L = chunkLists.get(id), grp = chunkObjs.get(id), a = L && L[SN]; pend.delete(id); if (a && a.length && grp) { const m = new THREE.Mesh(layerGeo(a), BLOCK_MATS[SN]); m.userData.c203 = 1; grp.add(m); } } catch (e) { warn('mesh', e); }
      return r; }; } catch (e) { warn('bc', e); }
  // ---------- settle / melt ----------
  const pend = new Set(), cells = new Set();
  const cid = (x, z) => Math.floor(x / CH) * 64 + Math.floor(z / CH);
  const ok = () => { try { return !!(started && current && !DIM.cur && !cityGen && !paused); } catch (_) { return false; } };
  const topY = (x, z) => { const b0 = x * H * D + z; for (let y = H - 2; y > 0; y--) { const b = world[b0 + y * D]; if (b && b !== T.TORCH && PLANT[b] !== 1) return y; } return 0; };
  function canLie(x, y, z) { const i = (x * H + y) * D + z, b = world[i], a = world[i + D]; if (a !== T.AIR) return false;
    if (!b || b === T.WATER || b === T.LAVA || b === T.FIRE || b === T.GLASS || ENT[b] || (IS_STAIR && IS_STAIR[b]) || b === T.ICE) return false;
    if (placedSet && placedSet.has(i)) return false; return solid(x, y, z); }
  function put(x, y, z) { try { const E = window.__c273; if (E && E.on() && E.edgeQ(x, z) > E.RE() - E.WS - 12) return; } catch (_) {} /* v1.0.93: no thin snow layers by the ice wall - solid blocks only */ const i = (x * H + y) * D + z; world[i] = SN; cells.add(i); pend.add(cid(x, z)); U.placed++; }
  function capLine() { if (U.capY) return U.capY; const hs = []; for (let x = 2; x < W - 2; x += 6) for (let z = 2; z < D - 2; z += 6) { const t = topY(x, z); if (t > SEA + 2) hs.push(t); }
    hs.sort((a, b) => a - b); return U.capY = hs.length > 200 ? Math.max(SEA + 30, hs[Math.floor(hs.length * 0.97)]) : H; }
  // snowcaps on the highest tops (made once per world, never melt) - real layers now
  function makeCaps() { const t0 = performance.now(), cy = capLine(); let n = 0;
    for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) { const t = topY(x, z); if (t + 1 < cy || t >= H - 2) continue; const j = (((x * 73856093) ^ (z * 19349663)) >>> 0) % 7; if (t + 1 < cy + (j < 2 ? 0 : j - 2) * 0.5) continue; if (canLie(x, t, z)) { put(x, t + 1, z); n++; } }
    U.caps = n; U.capMs = Math.round(performance.now() - t0); current.c203caps = 1; }
  // existing snow cells (loaded worlds): found a few chunks at a time
  let scanQ = null;
  function scanStep() { if (!scanQ) return; const t0 = performance.now(); while (scanQ.length && performance.now() - t0 < 3) { const id = scanQ.pop(), x0 = Math.floor(id / 64) * CH, z0 = (id % 64) * CH;
      for (let x = x0; x < Math.min(W, x0 + CH); x++) for (let z = z0; z < Math.min(D, z0 + CH); z++) { const b0 = x * H * D + z; for (let y = 1; y < H; y++) if (world[b0 + y * D] === SN) cells.add(b0 + y * D); } U.scan++; }
    if (!scanQ.length) scanQ = null; }
  let lastGD = null, capsPend = false, capAt = 0, lastFlush = 0, lastId = null;
  function tick() {
    if (!ok()) return; const t0 = performance.now();
    if (scanQ) scanStep();
    if (capsPend && !(window.__c105 && __c105.phase)) { if (!capAt) capAt = t0 + 5000; else if (t0 > capAt) { capsPend = false; try { makeCaps(); } catch (e) { warn('caps', e); } } }
    let dd = lastGD === null ? 0 : ((dayClock - lastGD + CYCLE) % CYCLE) / CYCLE; if (dd > 0.5) dd = 0; lastGD = dayClock; U.gd += dd;
    const snowing = !!window.__snowing && !(window.__c105 && __c105.phase);
    if (snowing) { U.lastSnow = U.gd; const force = !!window.__forceSnow, minY = (window.__snowY || SEA + 30) - 14, R = 40, px = P.x, pz = P.z; let put0 = 0;
      for (let k = 0; k < 24 && put0 < 6; k++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * R, x = Math.floor(px + Math.cos(a) * r), z = Math.floor(pz + Math.sin(a) * r);
        if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1) continue; const t = topY(x, z); if ((!force && t < minY) || t >= H - 2) continue;
        if (world[(x * H + t + 1) * D + z] === SN || !canLie(x, t, z)) continue; put(x, t + 1, z); put0++; } }
    else if (dd > 0 && U.gd - U.lastSnow > 0.2 && cells.size) { const p = dd / 2.5 * (window.__c203fast || 1), cy = capLine(); let n = 0;   // ~2.5 days for a layer to go
      for (const i of cells) { if (world[i] !== SN) { cells.delete(i); continue; } if (Math.random() >= p) continue; const y = Math.floor(i / D) % H; if (y >= cy) { cells.delete(i); continue; }
        world[i] = T.AIR; cells.delete(i); const x = Math.floor(i / (H * D)), z = i % D; pend.add(cid(x, z)); U.melted++; if (++n >= 40) break; } }
    // batched re-mesh: one queued chunk at a time, nearest first, only when the game has no other chunk work waiting
    if (pend.size && t0 - lastFlush > (window.__c203gap || 900) && !dirtyAll && (lastId == null || !dirtyCh.has(lastId))) { let best = null, bd = 1e9; const pcx = Math.floor(P.x / CH), pcz = Math.floor(P.z / CH);
      for (const id of pend) { const d = Math.abs(Math.floor(id / 64) - pcx) + Math.abs(id % 64 - pcz); if (d < bd) { bd = d; best = id; } }
      pend.delete(best); if (chunkObjs.has(best)) { dirtyCh.add(best); lastId = best; U.rebuilds++; } lastFlush = t0; }
    U.cells = cells.size; U.pend = pend.size; U.ms = Math.round((performance.now() - t0) * 10) / 10;
  }
  setInterval(() => { try { tick(); } catch (e) { warn('tick', e); } }, 400);
  // ---------- save / load (the snow itself is saved in the world like any block) ----------
  try { const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur) d.c203 = {ls: U.lastSnow, gd: U.gd, caps: current && current.c203caps ? 1 : 0, pc: capsPend ? 1 : 0}; } catch (_) {} return d; }; } catch (e) { warn('ser', e); }
  try { const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments);
      try { if (d && !d.dim && d.world) { lastGD = null; cells.clear(); pend.clear(); U.capY = 0; const c = d.c203;
          if (c) { U.lastSnow = typeof c.ls === 'number' ? c.ls : -9; U.gd = typeof c.gd === 'number' ? c.gd : 0; if (current) current.c203caps = c.caps; capsPend = !!c.pc; }
          else { U.lastSnow = -9; U.gd = 0; capsPend = false; const o = d.c189;   // a v1.0.36-v1.0.40 world: turn its overlay snow into real snow layers once
            if (o && o.sn) { try { const S = new Uint8Array(W * D), Y = new Uint8Array(W * D); rleDecode(o.sn, S); rleDecode(o.sy, Y);
                for (let i = 0; i < S.length; i++) { if (!S[i]) continue; const x = Math.floor(i / D), z = i % D, t = Y[i]; if (t > 0 && t < H - 2 && topY(x, z) === t && canLie(x, t, z)) { world[(x * H + t + 1) * D + z] = SN; U.conv++; } }
                if (current) current.c203caps = o.caps ? 1 : 0; capsPend = !!o.pc; if (U.conv) for (const id of chunkObjs.keys()) dirtyCh.add(id); } catch (e) { warn('conv', e); } } }
          scanQ = []; const ncx = Math.ceil(W / CH), ncz = Math.ceil(D / CH); for (let x = 0; x < ncx; x++) for (let z = 0; z < ncz; z++) scanQ.push(x * 64 + z); } } catch (e) { warn('load', e); } return r; }; } catch (e) { warn('ap', e); }
  try { const ew = enterWorld; enterWorld = function (save) { if (!save) { cells.clear(); pend.clear(); lastGD = null; U.lastSnow = -9; U.gd = 0; U.capY = 0; capsPend = true; capAt = 0; scanQ = null; try { current.c203caps = 0; } catch (_) {} } return ew.apply(this, arguments); }; } catch (e) { warn('ew', e); }
  // placing a block onto snow replaces the snow layer (like Minecraft), instead of stacking on top of it
  try { const ui = useItem; useItem = function () { let sx = null;
      try { if (!window.__raOverride && (PLACEABLE.has(selId) || (window.__c121 && __c121.VARI && __c121.VARI[selId])) && (MODE.infinite || cnt(selId) > 0)) { const r = raycast(5);
          if (r && getB(...r.hit) === SN) { const [x, y, z] = r.hit; sx = [x, y, z]; world[(x * H + y) * D + z] = T.AIR; window.__raOverride = {hit: [x, y - 1, z], prev: [x, y, z], t: r.t}; } } } catch (_) {}
      try { return ui.apply(this, arguments); } finally { if (sx) { window.__raOverride = null; const [x, y, z] = sx, i = (x * H + y) * D + z; if (world[i] === T.AIR) world[i] = SN; else { cells.delete(i); dirtyAround(x, z); } } } }; } catch (e) { warn('ui', e); }
  U.cellsSet = () => cells; U.pendSet = () => pend; U.makeCaps = makeCaps;
})();
