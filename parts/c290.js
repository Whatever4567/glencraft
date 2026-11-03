/* GLX-C290 (v1.0.95): auto-recorded pieces for the Builder Tool - no corner marking. Every generated thing near you is found and
   recorded as a piece: each build (croft, hag hut, castle, bridge, landmark, other builds), each tree (one type per log block), lava
   pools, caves and ravines. In Test World you spawn holding the tool; while it is in your hotbar the pieces near you get outlines and
   labels (nearest one green), blocks you change are tinted as part of that piece, and Save piece (on-screen button, RT with the tool,
   X on the pad with the tool, or G) writes that type to the library. Upload builds exports it. Saved trees replace that tree type in
   new worlds (GLX-C286 already handles croft, hut, bridge and landmark). */
(function c290() {
  const U = window.__c290 = {err: null, pieces: [], edits: 0, saved: 0, scans: 0, ms: 0, trees: 0, treeMs: 0, near: null};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const BT = 991, TW = () => !!(current && String(current.name || '').trim().toLowerCase() === 'test world');
  const C5 = () => window.__c285;
  const MAN = new Uint8Array(256), RX = /PLANK|COBBLE|BRICK|GLASS|TABLE|FURNACE|BED|CHEST|DOOR|TV|WOOL|THATCH|FENCE|STAIR|SLAB|TORCH|LANTERN|ROOF|PILLAR|TILE|CARPET|BOOK|ANVIL|WINDOW|LADDER|SIGN|BARREL|CAULDRON|GOLD_BLOCK|IRON_BLOCK|CANDLE|BANNER|STATUE/;
  try { for (const k in T) if (RX.test(k) && T[k] > 0 && T[k] < 256) MAN[T[k]] = 1; } catch (e) { ERR('man', e); }
  const NAME = id => { try { return (NAMES[id] || 'Tree').replace(/ ?log/i, '') || 'Tree'; } catch (_) { return 'Tree'; } };
  const TL = {croft: 'Croft house', hut: 'Hag hut', castle: 'Castle', bridge: 'Bridge', landmark: 'Landmark', build: 'Build', lava: 'Lava pool', cave: 'Cave', ravine: 'Ravine'};
  const label = t => t.indexOf('tree_') === 0 ? NAME(+t.slice(5)) + ' tree' : (TL[t] || t);
  function addType(k) { if (k.indexOf('gs_') === 0) return; try { const TY = C5().TYPES; if (!TY.some(t => t.k === k)) TY.push({k, n: label(k), d: k.indexOf('tree_') === 0 ? 'Replaces this tree type in new worlds' : 'Recorded piece (saved and uploaded)', live: 1}); } catch (_) {} }
  setTimeout(() => { try { for (const k of Object.keys(C5().lib())) addType(k); } catch (_) {} }, 500);
  // ---------- known site positions for naming builds ----------
  function sites() { const s = []; const add = (t, x, z) => { if (isFinite(x) && isFinite(z)) s.push([t, x, z]); };
    try { for (const f of __c113.farmsList()) add('croft', f.x0, f.z0); } catch (_) {}
    try { const h = __c142.st.hut; if (h) add('hut', h[0], h[2]); } catch (_) {}
    try { for (const c of g9castles) add('castle', c[1], c[2]); } catch (_) {}
    try { const S = __c286.sites || {}; for (const k in S) for (const q of S[k] || []) if (Array.isArray(q)) add(k === 'bridge' ? 'bridge' : 'landmark', q[0], q[1]); else if (q) add('landmark', q.x, q.z); } catch (_) {}
    return s; }
  // ---------- scan ----------
  const R = 26, RY = 18;
  function scan() { const t0 = performance.now(), px = Math.floor(P.x), py = Math.floor(P.y), pz = Math.floor(P.z), out = [], S = sites();
    const x0 = Math.max(1, px - R), x1 = Math.min(W - 2, px + R), y0 = Math.max(1, py - RY), y1 = Math.min(H - 2, py + RY), z0 = Math.max(1, pz - R), z1 = Math.min(D - 2, pz + R);
    const sx = x1 - x0 + 1, sy = y1 - y0 + 1, sz = z1 - z0 + 1, seen = new Uint8Array(sx * sy * sz), L = i => i;
    const kind = b => MAN[b] ? 1 : (LOGGY[b] || LEAFY[b]) ? 2 : b === T.LAVA ? 3 : 0;
    const st = [];
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { const li = ((x - x0) * sy + (y - y0)) * sz + (z - z0); if (seen[li]) continue; const b = world[idx(x, y, z)], k = kind(b); if (!k) continue;
      seen[li] = 1; st.length = 0; st.push(x, y, z); let n = 0, bx = [x, y, z, x, y, z], logs = {}, base = null;
      while (st.length && n < 6000) { const cz = st.pop(), cy = st.pop(), cx = st.pop(); n++; const cb = world[idx(cx, cy, cz)];
        if (k === 2 && LOGGY[cb]) { logs[cb] = (logs[cb] || 0) + 1; if (!base || cy < base[1]) base = [cx, cy, cz]; }
        if (cx < bx[0]) bx[0] = cx; if (cy < bx[1]) bx[1] = cy; if (cz < bx[2]) bx[2] = cz; if (cx > bx[3]) bx[3] = cx; if (cy > bx[4]) bx[4] = cy; if (cz > bx[5]) bx[5] = cz;
        for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) for (let e = -1; e <= 1; e++) { const nx = cx + a, ny = cy + c, nz = cz + e; if (nx < x0 || nx > x1 || ny < y0 || ny > y1 || nz < z0 || nz > z1) continue;
          const ni = ((nx - x0) * sy + (ny - y0)) * sz + (nz - z0); if (seen[ni]) continue; if (kind(world[idx(nx, ny, nz)]) !== k) continue; seen[ni] = 1; st.push(nx, ny, nz); } }
      if (k === 1 && n >= 8) { const cx = (bx[0] + bx[3]) / 2, cz = (bx[2] + bx[5]) / 2; let t = 'build', bd = 1e9, si = -1; S.forEach((s, j) => { const d = Math.hypot(s[1] - cx, s[2] - cz); if (d < 26 && d < bd) { bd = d; t = s[0]; si = j; } });
        bx[1] = Math.max(1, bx[1] - 1); const m = si >= 0 && out.find(q => q.si === si); if (m) { for (let i = 0; i < 3; i++) { m.b[i] = Math.min(m.b[i], bx[i]); m.b[i + 3] = Math.max(m.b[i + 3], bx[i + 3]); } } else out.push({t, b: bx, si}); }
      if (k === 2 && base && n >= 4) { let best = 0, id = 0; for (const q in logs) if (logs[q] > best) { best = logs[q]; id = +q; } out.push({t: 'tree_' + id, b: bx, base}); }
      if (k === 3 && n >= 4) out.push({t: 'lava', b: [bx[0] - 1, bx[1] - 1, bx[2] - 1, bx[3] + 1, bx[4] + 1, bx[5] + 1]}); }
    // terrain pieces: cave cell when you are under the ground, ravine when the ground drops away on both sides
    try { const tp = (x, z) => { for (let y = H - 2; y > 0; y--) { const b = world[idx(x, y, z)]; if (b && b !== T.WATER && !LEAFY[b] && !LOGGY[b]) return y; } return 0; };
      const g = tp(px, pz), G = 24, cx0 = Math.floor(px / G) * G, cz0 = Math.floor(pz / G) * G;
      if (g > py + 4) out.push({t: 'cave', b: [cx0, Math.max(1, Math.floor(py / 16) * 16 - 4), cz0, cx0 + G - 1, Math.floor(py / 16) * 16 + 15, cz0 + G - 1]});
      const h = s => tp(Math.max(1, Math.min(W - 2, px + s[0])), Math.max(1, Math.min(D - 2, pz + s[1])));
      if ((h([-7, 0]) > g + 7 && h([7, 0]) > g + 7) || (h([0, -7]) > g + 7 && h([0, 7]) > g + 7)) out.push({t: 'ravine', b: [cx0, Math.max(1, g - 2), cz0, cx0 + G - 1, Math.min(H - 2, g + 14), cz0 + G - 1]}); } catch (e) { ERR('ter', e); }
    for (const p of out) { const b = p.b, dx = Math.max(b[0] - P.x, 0, P.x - b[3] - 1), dy = Math.max(b[1] - P.y, 0, P.y - b[4] - 1), dz = Math.max(b[2] - P.z, 0, P.z - b[5] - 1); p.d = Math.hypot(dx, dy, dz); }
    out.sort((a, b) => a.d - b.d); U.pieces = out.slice(0, 24); U.near = U.pieces[0] && U.pieces[0].d < 12 ? U.pieces[0] : null; U.scans++; U.ms = Math.round(performance.now() - t0); }
  U.scan = scan;
  // ---------- edits (tinted as part of the piece) ----------
  const EDIT = new Map();
  try { const sb = setB; setB = function (x, y, z, v) { try { if (started && TW() && v !== T.WATER && v !== T.LAVA && Math.abs(x - P.x) < 9 && Math.abs(z - P.z) < 9 && Math.abs(y - P.y) < 9) { const o = world[idx(x, y, z)]; if (o !== T.WATER && o !== v) { EDIT.set(idx(x, y, z), [x, y, z]); U.edits = EDIT.size; } } } catch (_) {} return sb.apply(this, arguments); }; } catch (e) { ERR('sb', e); }
  // ---------- drawing ----------
  let grp = null, wires = [], sprites = [], tint = null; const TX = {};
  function lbl(text, near) { const k = text + (near ? '*' : ''); if (TX[k]) return TX[k]; const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = near ? 'rgba(20,90,40,.85)' : 'rgba(40,30,10,.75)'; g.fillRect(0, 8, 256, 48); g.font = 'bold 26px sans-serif'; g.fillStyle = near ? '#9dffb0' : '#ffd77a'; g.textAlign = 'center'; g.fillText(text + (near ? ' - Save piece' : ''), 128, 42);
    const t = new THREE.CanvasTexture(c); TX[k] = t; return t; }
  function ensure() { if (grp) return; grp = new THREE.Group(); grp.renderOrder = 998; scene.add(grp); const eg = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
    for (let i = 0; i < 24; i++) { const w = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({color: 0xffc844, depthTest: false, transparent: true, opacity: .8})); w.frustumCulled = false; w.renderOrder = 999; grp.add(w); wires.push(w);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({depthTest: false, transparent: true})); s.renderOrder = 1000; s.scale.set(4, 1, 1); grp.add(s); sprites.push(s); }
    tint = new THREE.InstancedMesh(new THREE.BoxGeometry(1.03, 1.03, 1.03), new THREE.MeshBasicMaterial({color: 0x46d8ff, transparent: true, opacity: .32, depthWrite: false}), 2048); tint.frustumCulled = false; tint.count = 0; grp.add(tint); }
  const M4 = new THREE.Matrix4();
  function draw(show) { ensure(); grp.visible = show; if (!show) return; const ps = U.pieces;
    for (let i = 0; i < 24; i++) { const p = ps[i], w = wires[i], s = sprites[i]; const on = !!p && p.d < 22 && (i < 8 || p.d < 6); w.visible = s.visible = on; if (!on) continue; const b = p.b, near = p === U.near;
      w.scale.set(b[3] - b[0] + 1.04, b[4] - b[1] + 1.04, b[5] - b[2] + 1.04); w.position.set((b[0] + b[3] + 1) / 2, (b[1] + b[4] + 1) / 2, (b[2] + b[5] + 1) / 2); w.material.color.setHex(near ? 0x6cff8a : p.t.indexOf('tree_') === 0 ? 0x9be36b : 0xffc844);
      const t = lbl(label(p.t), near); if (s.material.map !== t) { s.material.map = t; s.material.needsUpdate = true; } s.position.set((b[0] + b[3] + 1) / 2, b[4] + 2, (b[2] + b[5] + 1) / 2); }
    let n = 0; for (const [, q] of EDIT) { if (n >= 2048) break; if (!world[idx(q[0], q[1], q[2])]) continue; if (!ps.some(p => q[0] >= p.b[0] - 1 && q[0] <= p.b[3] + 1 && q[1] >= p.b[1] - 1 && q[1] <= p.b[4] + 1 && q[2] >= p.b[2] - 1 && q[2] <= p.b[5] + 1)) continue;
      M4.makeTranslation(q[0] + .5, q[1] + .5, q[2] + .5); tint.setMatrixAt(n++, M4); } tint.count = n; tint.instanceMatrix.needsUpdate = true; }
  // ---------- save ----------
  function save(p) { p = p || U.near; const c = C5(); if (!c || !TW()) return; if (!p) { toast('Walk up to a piece (the green outline) to save it'); return; }
    const b = p.b; c.A = [b[0], b[1], b[2]]; c.B = [b[3], b[4], b[5]]; const pf = c.capture(p.t); c.A = c.B = null; if (!pf) return;
    if (p.base) { pf.ax = p.base[0] - b[0]; pf.az = p.base[2] - b[2]; pf.ay = p.base[1] - b[1]; }
    const L = c.lib(); L[p.t] = pf; try { c.setLib(L); } catch (e) { toast('Could not save - the library is full'); return; }
    addType(p.t); U.saved++; c.saves++; c.last = p.t; try { sfx('pop', .4); } catch (_) {}
    toast('Saved ' + label(p.t) + ' (' + pf.sx + 'x' + pf.sy + 'x' + pf.sz + ') - Upload builds in the pause menu exports it'); }
  U.save = save; U.rt = () => save();
  let btn = null;
  function ui(show) { if (!btn) { btn = document.createElement('button'); btn.id = 'c290save'; btn.textContent = 'Save piece'; btn.dataset.testid = 'save-piece-btn';
      btn.style.cssText = 'position:fixed;right:14px;top:112px;z-index:40;padding:9px 14px;border-radius:10px;border:2px solid #6cff8a;background:rgba(10,40,20,.8);color:#9dffb0;font:bold 15px sans-serif;display:none';
      const go = e => { e.preventDefault(); e.stopPropagation(); save(); }; btn.addEventListener('touchstart', go, {passive: false}); btn.addEventListener('mousedown', go); document.body.appendChild(btn); }
    btn.style.display = show && U.near && !menuOpen ? 'block' : 'none'; }
  addEventListener('keydown', e => { if (e.code === 'KeyG' && !e.repeat && U.near && started && TW() && hasTool() && !menuOpen) save(); });
  // pad X with the tool held saves instead of opening crafting
  const padX = () => { try { for (const g of navigator.getGamepads ? navigator.getGamepads() : []) if (g && g.buttons[2] && g.buttons[2].pressed) return true; } catch (_) {} return false; };
  try { const om = openMenu; openMenu = function () { if (U.near && started && TW() && selId === BT && padX()) { save(); return; } return om.apply(this, arguments); }; } catch (e) { ERR('om', e); }
  const hasTool = () => { try { return cnt(BT) > 0; } catch (_) { return false; } };
  // ---------- loop ----------
  let held = null, heldT = 0, lastGr = 0, lastScan = 0;
  setInterval(() => { try { const tw = started && TW() && !DIM.cur;
      if (tw && hasTool() && held !== current.id) { held = current.id; heldT = performance.now(); } const gr = window.__c264 ? __c264.granted : 0; if (gr !== lastGr) { lastGr = gr; heldT = performance.now(); } if (tw && hasTool() && performance.now() - heldT < 8000 && selId !== BT) { try { const hb = MODE.hotbar; if (hb && !hb.includes(BT)) { let i = hb.indexOf(0); if (i < 0) i = hb.findIndex(v => v === undefined || v === null); if (i < 0) i = hb.length - 1; hb[i] = BT; } } catch (_) {} selId = BT; try { renderHotbar(); } catch (_) {} }
      const show = false; /* v1.0.111: no auto outlines / scanning of everything - Game structures (GLX-C303) replaces it */ if (show && performance.now() - lastScan > 900) { lastScan = performance.now(); scan(); }
      draw(show); ui(show); } catch (e) { ERR('loop', e); } }, 150);
  // ---------- saved trees become that tree type in new worlds ----------
  /* v1.0.116: a tree saved down in the Agartha tunnel (glow grass, moss or glow plants in its box, or a huge box) is never used for the trees of the surface world */
  function agT(pf, u) { if (pf.ag || pf.sx > 13 || pf.sz > 13 || pf.sy > 20) return true; const G = [T.GLOWGRASS, T.GLOWPLANT, T.MOSS]; for (let i = 0; i < u.length; i++) if (G.includes(u[i])) return true; return false; }
  function trees() { const t0 = performance.now(); let L = Object.assign({}, (window.__c286 && __c286.pub) || {}); try { Object.assign(L, C5().lib()); } catch (_) {} /* v1.0.111: your saved trees are used in all your new worlds */
    const TP = {}; for (const k in L) if (k.indexOf('tree_') === 0) { const pf = L[k]; try { const u = C5().unb64(pf.b); if (agT(pf, u)) { U.skipAg = (U.skipAg || 0) + 1; continue; } TP[+k.slice(5)] = {pf, u}; } catch (_) {} } if (!Object.keys(TP).length) return 0;
    let n = 0; const st = [];
    for (let x = 4; x < W - 4; x++) for (let z = 4; z < D - 4; z++) { let y = H - 2; while (y > 1 && (!world[idx(x, y, z)] || LEAFY[world[idx(x, y, z)]])) y--; const b = world[idx(x, y, z)]; const tp = TP[b]; if (!tp) continue;
      while (y > 1 && world[idx(x, y - 1, z)] === b) y--; const g = world[idx(x, y - 1, z)]; if (!g || LOGGY[g] || LEAFY[g]) continue;
      // clear the old tree (logs + leaves joined to this trunk, within 6 blocks)
      st.length = 0; st.push(x, y, z); let c = 0; while (st.length && c < 600) { const cz = st.pop(), cy = st.pop(), cx = st.pop(); const q = world[idx(cx, cy, cz)]; if (!(LOGGY[q] || LEAFY[q])) continue; world[idx(cx, cy, cz)] = 0; c++;
        for (const [a, e, f] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const nx = cx + a, ny = cy + e, nz = cz + f; if (Math.abs(nx - x) <= 6 && Math.abs(nz - z) <= 6 && ny >= y && ny < H - 1) st.push(nx, ny, nz); } }
      const pf = tp.pf, u = tp.u, ox = x - (pf.ax || 0), oy = y - (pf.ay || 0), oz = z - (pf.az || 0);
      for (let i = 0; i < pf.sx; i++) for (let j = 0; j < pf.sy; j++) for (let k = 0; k < pf.sz; k++) { const v = u[(i * pf.sy + j) * pf.sz + k]; if (!v || !(LOGGY[v] || LEAFY[v])) continue; const X = ox + i, Y = oy + j, Z = oz + k;
        if (X < 1 || X >= W - 1 || Z < 1 || Z >= D - 1 || Y < 1 || Y >= H - 1 || world[idx(X, Y, Z)]) continue; world[idx(X, Y, Z)] = v; }
      n++; z += 2; }
    U.trees = n; U.treeMs = Math.round(performance.now() - t0); return n; }
  U.applyTrees = trees;
  try { const gen = generate; generate = function () { const r = gen.apply(this, arguments); try { if (!DIM.cur && window.__g89 && __g89()) { trees(); try { dirtyAll = true; } catch (_) {} } } catch (e) { ERR('trees', e); } return r; }; } catch (e) { ERR('gw', e); }
})();
