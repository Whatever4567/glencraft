/* GLX-C303 (v1.0.111): Game structures. The Builder Tool library (Test World) gets a second tab listing every structure the
   generator builds - crofts, the hag hut, the three castles, castle bridges, the pyramid, the sphinx, the shipwreck, the rocket
   base, the Agartha entrance, scattered landmarks and every tree type. Open one: you are taken to it and an edit mode starts (gold
   outline, Paint all with the held block, Save, Cancel). Save stores it in this device's local storage and every new world you
   make uses your edited version. No download button: the edits can be read from code with __c303.dump(). */
(function c303() {
  const U = window.__c303 = {err: null, ed: null, applied: {}, ms: 0, saves: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const C5 = () => window.__c285, TW = () => !!(current && String(current.name || '').trim().toLowerCase() === 'test world');
  const NAT = new Uint8Array(256); NAT[0] = 1;
  try { for (const k of 'GRASS DIRT STONE HEATHER WATER SAND PEAT TALLGRASS THISTLE DANDELION DAFFODIL BLUEBELL COALORE IRONORE COPPERORE GOLDORE REDORE DIAMONDORE DEEPSLATE LAVA MUD RSAND GRAVEL CAIRNORE SILVERORE RUBYORE LAZORE COBALTORE PODZOL MOSS FERN REEDS PACKSNOW SNOW GLOWGRASS GLOWPLANT CRYCYAN CRYVIOLET CRYWHITE OBSIDIAN'.split(' ')) if (T[k]) NAT[T[k]] = 1;
    for (let i = 0; i < 256; i++) if (LEAFY[i] || LOGGY[i] || PLANT[i]) NAT[i] = 1; } catch (e) { ERR('nat', e); }
  const inW = (x, z) => x >= 1 && z >= 1 && x < W - 1 && z < D - 1, at = (x, y, z) => world[idx(x, y, z)];
  function gtop(x, z) { for (let y = H - 2; y > 0; y--) { const b = at(x, y, z); if (b && b !== T.WATER && !LEAFY[b] && !LOGGY[b] && !PLANT[b]) return y; } return 0; }
  // ---------- every structure site in the current world ----------
  const CN = {human: 'Clan Castle', black: 'Blackstone Castle', mossy: 'Mossy Skeleton Castle'};
  function sites() { const s = [], add = (k, n, x0, z0, x1, z1, y0, y1) => { if ([x0, z0, x1, z1, y0, y1].every(isFinite)) s.push({k, n, r: [Math.max(1, x0 | 0), Math.max(1, z0 | 0), Math.min(W - 2, x1 | 0), Math.min(D - 2, z1 | 0)], y: [Math.max(1, y0 | 0), Math.min(H - 2, y1 | 0)]}); };
    try { for (const f of __c113.farmsList() || []) add('gs_croft', 'Croft house', f.x0 - 2, f.z0 - 2, f.x0 + 9, f.z0 + 9, f.gy - 3, f.gy + 14); } catch (_) {}
    try { const h = __c142.st.hut; if (Array.isArray(h)) add('gs_hut', 'Hag hut', h[0] - 7, h[2] - 7, h[0] + 7, h[2] + 7, h[1] - 3, h[1] + 14); } catch (_) {}
    try { for (const c of g9castles || []) { const g = gtop(c[1], c[2]); add('gs_castle_' + c[0], CN[c[0]] || 'Castle', c[1] - 34, c[2] - 34, c[1] + 34, c[2] + 34, g - 12, g + 60); } } catch (_) {}
    try { for (const b of __c113.bridges || []) if (b && b.from && b.to) add('gs_bridge_' + b.k, (CN[b.k] || 'Castle') + ' bridge', Math.min(b.from[0], b.to[0]) - 4, Math.min(b.from[1], b.to[1]) - 4, Math.max(b.from[0], b.to[0]) + 4, Math.max(b.from[1], b.to[1]) + 4, SEA - 8, SEA + 16); } catch (_) {}
    try { const p = __c239.pyr; if (p) add('gs_pyramid', 'Pyramid', p.cx - 36, p.cz - 36, p.cx + 36, p.cz + 36, (p.hy || p.cy - 20) - 6, p.cy + 14); } catch (_) {}
    try { const e = __c142.st.sphinx && __c142.st.sphinx.ear; if (e) add('gs_sphinx', 'Sphinx', e[0] - 16, e[2] - 16, e[0] + 16, e[2] + 16, e[1] - 22, e[1] + 10); } catch (_) {}
    try { const b = __c142.st.boat; if (Array.isArray(b)) add('gs_ship', 'Shipwreck', b[1] - 16, b[2] - 16, b[1] + 16, b[2] + 16, SEA - 12, SEA + 20); } catch (_) {}
    try { const b = __c299.base; if (b) add('gs_rocketbase', 'Highland Rocket Base', b.x - 14, b.z - 14, b.x + 14, b.z + 14, b.y - 4, b.y + 40); } catch (_) {}
    try { const e = __c294.M; if (e) { const p = __c294.WP(1, -20), q = __c294.WP(e.df + 20, 20); add('gs_agartha', 'Agartha entrance (ice wall nearest Blackstone Castle)', Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1]), e.y - 2, e.y + 28); } } catch (_) {}
    try { for (const q of (__c286.sites && __c286.sites.landmark) || []) add('gs_landmark', 'Landmark', q[0] - 2, q[1] - 2, q[0] + 22, q[1] + 22, gtop(q[0], q[1]) - 4, gtop(q[0], q[1]) + 30); } catch (_) {}
    return s; }
  U.sites = sites;
  // bounding box of the built (non natural) blocks of a site, padded so edits just outside still fit
  function boxOf(s) { let b = null; const [x0, z0, x1, z1] = s.r;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = s.y[0]; y <= s.y[1]; y++) { const v = at(x, y, z); if (NAT[v]) continue;
      if (!b) b = [x, y, z, x, y, z]; else { if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (z < b[2]) b[2] = z; if (x > b[3]) b[3] = x; if (y > b[4]) b[4] = y; if (z > b[5]) b[5] = z; } }
    if (!b) return null; return [Math.max(1, b[0] - 3), Math.max(1, b[1] - 1), Math.max(1, b[2] - 3), Math.min(W - 2, b[3] + 3), Math.min(H - 2, b[4] + 4), Math.min(D - 2, b[5] + 3)]; }
  U.boxOf = boxOf;
  // ---------- trees ----------
  const LOGS = () => { const o = []; for (let i = 1; i < 256; i++) if (LOGGY[i]) o.push(i); return o; };
  function findTree(id) { const px = Math.floor(P.x), pz = Math.floor(P.z);
    for (let r = 0; r < 160; r += 2) for (let dx = -r; dx <= r; dx += 2) for (const dz of (Math.abs(dx) === r ? range(-r, r) : [-r, r])) { const x = px + dx, z = pz + dz; if (!inW(x, z)) continue;
      for (let y = H - 2; y > 1; y--) { const b = at(x, y, z); if (!b || LEAFY[b]) continue; if (b !== id) break; let by = y; while (by > 1 && at(x, by - 1, z) === id) by--; return treeBox(x, by, z, id); } }
    return null; }
  const range = (a, b) => { const o = []; for (let i = a; i <= b; i += 2) o.push(i); return o; };
  function treeBox(x, y, z, id) { const st = [x, y, z], seen = new Set(), b = [x, y, z, x, y, z]; let n = 0;
    while (st.length && n < 900) { const cz = st.pop(), cy = st.pop(), cx = st.pop(), k = idx(cx, cy, cz); if (seen.has(k)) continue; seen.add(k); const q = at(cx, cy, cz); if (!(LOGGY[q] || LEAFY[q])) continue; n++;
      b[0] = Math.min(b[0], cx); b[1] = Math.min(b[1], cy); b[2] = Math.min(b[2], cz); b[3] = Math.max(b[3], cx); b[4] = Math.max(b[4], cy); b[5] = Math.max(b[5], cz);
      for (const [a, e, f] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const nx = cx + a, ny = cy + e, nz = cz + f; if (Math.abs(nx - x) <= 6 && Math.abs(nz - z) <= 6 && ny >= y && ny < H - 1) st.push(nx, ny, nz); } }
    return {b: [b[0] - 1, b[1], b[2] - 1, b[3] + 1, b[4] + 1, b[5] + 1], base: [x, y, z]}; }
  // ---------- library entries ----------
  const lib = () => C5().lib();
  function entries() { const S = sites(), m = new Map(); for (const s of S) { if (!m.has(s.k)) m.set(s.k, {k: s.k, n: s.n, list: []}); m.get(s.k).list.push(s); }
    for (const id of LOGS()) { let n = 'Tree'; try { n = (NAMES[id] || 'Tree').replace(/ ?log/i, '').trim(); n = (n || 'Oak') + ' tree'; } catch (_) {} m.set('tree_' + id, {k: 'tree_' + id, n, tree: id, list: []}); }
    return [...m.values()]; }
  U.entries = entries;
  const esc = s => String(s).replace(/[<>&]/g, c => ({'<': '&lt;', '>': '&gt;', '&': '&amp;'})[c]);
  function tabs(which) { const o = document.getElementById('c285ov'); if (!o || o.querySelector('#c303tabs')) return; const d = document.createElement('div'); d.id = 'c303tabs'; d.style.cssText = 'display:flex;gap:6px;justify-content:center;margin-bottom:10px';
    d.innerHTML = '<button class="btn" data-g="mine"' + (which === 'mine' ? ' style="outline:2px solid #6cff8a"' : '') + '>My builds</button><button class="btn" data-g="game" data-testid="game-structures-tab"' + (which === 'game' ? ' style="outline:2px solid #6cff8a"' : '') + '>Game structures</button>';
    o.prepend(d); d.querySelector('[data-g=mine]').onclick = () => show('mine'); d.querySelector('[data-g=game]').onclick = () => show('game'); }
  function show(which) { const c = C5(); if (!c) return; if (which === 'mine') { c.library(); tabs('mine'); return; }
    c.note(''); const o = document.getElementById('c285ov'), L = lib(); let h = '<div style="font-size:18px;margin-bottom:4px">Game structures</div><div style="opacity:.8;margin-bottom:8px">Open one to edit it here, then press Save. New worlds you make use your edited version.</div>';
    for (const e of entries()) { const ed = !!L[e.k]; h += '<div style="border:1px solid rgba(255,200,68,.35);border-radius:8px;padding:6px 8px;margin:5px 0;display:flex;align-items:center;gap:6px;justify-content:space-between"><span style="text-align:left"><b>' + esc(e.n) + '</b>' + (e.tree ? '' : ' <small style="opacity:.7">(' + e.list.length + ' here)</small>') + (ed ? ' <small style="color:#9dffb0">edited</small>' : '') + '</span><span>' +
      '<button class="btn" data-o="' + e.k + '"' + (!e.tree && !e.list.length ? ' disabled' : '') + '>Open</button>' + (ed ? ' <button class="btn" data-x="' + e.k + '">Reset</button>' : '') + '</span></div>'; }
    h += '<button class="btn" data-a="x">Close</button>'; o.innerHTML = h; tabs('game');
    const E = entries(); o.querySelectorAll('[data-o]').forEach(b => b.onclick = () => open(E.find(e => e.k === b.dataset.o)));
    o.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { const L2 = lib(); delete L2[b.dataset.x]; C5().setLib(L2); show('game'); });
    o.querySelector('[data-a=x]').onclick = () => c.close(); const f = o.querySelector('button:not([disabled])'); if (f) f.focus(); }
  U.show = show;
  // the pause button opens the tabbed library; the library re-draw (after Delete) keeps its tabs
  setInterval(() => { try { const b = document.getElementById('c285lib'); if (b && !b.dataset.c303) { b.dataset.c303 = 1; b.onclick = ev => { ev.preventDefault(); try { setPause(false); } catch (_) {} setTimeout(() => show('mine'), 60); }; }
      const o = document.getElementById('c285ov'); if (o && o.style.display !== 'none' && /My builds library/.test(o.textContent) && !o.querySelector('#c303tabs')) tabs('mine'); } catch (_) {} }, 300);
  // ---------- edit mode ----------
  let wire = null, bar = null;
  function open(e) { if (!e) return; const c = C5(); if (!TW()) { c.note('Open a world called test world to edit game structures.'); return; }
    let b = null, base = null; if (e.tree) { const t = findTree(e.tree); if (t) { b = t.b; base = t.base; } } else { for (const s of e.list) { b = boxOf(s); if (b) break; } }
    if (!b) { c.note('Could not find ' + esc(e.n) + ' in this world.'); return; } c.close();
    U.ed = {k: e.k, n: e.n, b, base}; const fx = (b[0] + b[3] + 1) / 2, fz = Math.min(D - 3, b[5] + 3);
    P.x = fx; P.z = fz + 0.5; P.y = gtop(Math.floor(fx), Math.floor(fz)) + 1.05; P.vy = 0; try { dirtyAll = true; } catch (_) {}
    try { toast('Edit mode: ' + e.n + ' - change it with normal blocks, then press Save'); } catch (_) {} }
  U.open = open;
  function paint() { const E = U.ed; if (!E) return; const id = selId; if (!id || id >= 256 || NAT[id] && !LOGGY[id] || cnt(id) <= 0) { toast('Hold a block in your hand to paint with'); return; } const b = E.b; let n = 0;
    for (let x = b[0]; x <= b[3]; x++) for (let y = b[1]; y <= b[4]; y++) for (let z = b[2]; z <= b[5]; z++) { const i = idx(x, y, z), v = world[i]; if (v && !NAT[v] && v !== T.DOOR && v !== T.DOORTOP && v !== T.CHEST && v !== T.TORCH) { world[i] = id; n++; } }
    try { dirtyAll = true; } catch (_) {} toast('Painted ' + n + ' blocks'); }
  function save() { const E = U.ed, c = C5(); if (!E || !c) return; const b = E.b; c.A = [b[0], b[1], b[2]]; c.B = [b[3], b[4], b[5]]; const pf = c.capture(E.k); c.A = c.B = null; if (!pf) return;
    pf.gs = 1; if (E.base) { pf.ax = E.base[0] - b[0]; pf.ay = E.base[1] - b[1]; pf.az = E.base[2] - b[2]; }
    const L = lib(); L[E.k] = pf; try { c.setLib(L); } catch (_) { toast('Could not save - storage is full'); return; } U.saves++; U.ed = null; try { sfx('pop', .4); } catch (_) {}
    toast('Saved ' + E.n + ' - your new worlds will use it'); }
  U.save = save; U.paint = paint;
  function ui() { if (!bar) { bar = document.createElement('div'); bar.id = 'c303bar'; bar.style.cssText = 'position:fixed;right:12px;top:108px;z-index:40;display:none;flex-direction:column;gap:6px';
      for (const [t, f, id] of [['Paint all with held block', paint, 'paint'], ['Save', save, 'save'], ['Cancel', () => { U.ed = null; }, 'cancel']]) { const b = document.createElement('button'); b.textContent = t; b.dataset.testid = 'gs-' + id;
        b.style.cssText = 'padding:8px 12px;border-radius:10px;border:2px solid #6cff8a;background:rgba(10,40,20,.82);color:#9dffb0;font:bold 14px sans-serif';
        const go = e => { e.preventDefault(); e.stopPropagation(); f(); }; b.addEventListener('touchstart', go, {passive: false}); b.addEventListener('mousedown', go); bar.appendChild(b); } document.body.appendChild(bar); }
    const on = !!(U.ed && started && TW()); bar.style.display = on && !menuOpen ? 'flex' : 'none';
    if (!wire) { wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({color: 0xffc844, depthTest: false, transparent: true})); wire.renderOrder = 999; wire.frustumCulled = false; scene.add(wire); }
    wire.visible = on; if (on) { const b = U.ed.b; wire.scale.set(b[3] - b[0] + 1.04, b[4] - b[1] + 1.04, b[5] - b[2] + 1.04); wire.position.set((b[0] + b[3] + 1) / 2, (b[1] + b[4] + 1) / 2, (b[2] + b[5] + 1) / 2); } }
  setInterval(() => { try { if (typeof scene !== 'undefined') ui(); } catch (e) { ERR('ui', e); } }, 200);
  // ---------- new worlds use the edited structures (trees are handled by GLX-C290) ----------
  function apply() { const t0 = performance.now(), L = Object.assign({}, (window.__c286 && __c286.pub) || {}, lib()); const keys = Object.keys(L).filter(k => k.indexOf('gs_') === 0); if (!keys.length) return;
    const S = sites(); U.applied = {};
    for (const k of keys) { const pf = L[k]; let u; try { u = C5().unb64(pf.b); } catch (_) { continue; }
      for (const s of S) { if (s.k !== k) continue; const b = boxOf(s); if (!b) continue; const cx = (b[0] + b[3] + 1) >> 1, cz = (b[2] + b[5] + 1) >> 1, x0 = cx - (pf.sx >> 1), z0 = cz - (pf.sz >> 1), y0 = b[1];
        for (let i = 0; i < pf.sx; i++) for (let j = 0; j < pf.sy; j++) for (let q = 0; q < pf.sz; q++) { const X = x0 + i, Y = y0 + j, Z = z0 + q; if (!inW(X, Z) || Y < 1 || Y >= H - 1) continue;
          const pv = u[(i * pf.sy + j) * pf.sz + q], wi = idx(X, Y, Z), wv = world[wi]; if (pv === wv) continue; if (!NAT[pv] || LOGGY[pv] || !NAT[wv]) world[wi] = pv; }
        U.applied[k] = (U.applied[k] || 0) + 1; } }
    U.ms = Math.round(performance.now() - t0); try { dirtyAll = true; } catch (_) {} }
  U.apply = apply;
  try { const gen = generate; generate = function () { const r = gen.apply(this, arguments); try { if (!DIM.cur && window.__g89 && __g89()) apply(); } catch (e) { ERR('apply', e); } return r; }; } catch (e) { ERR('gw', e); }
  // hidden way to read the edits (no button): __c303.dump()
  U.dump = () => { const L = lib(), o = {}; for (const k in L) o[k] = L[k]; return JSON.stringify({v: 1, made: Date.now(), builds: o}); };
})();
