/* GLX-C307 (v1.1.17): THE NORTH EXTENSION. The map now runs on 1500 blocks north past its old top edge (z 0 down to z -1500), in the same
   world and the same coordinates - no teleport, no separate area. It is flat ice, made on the fly in 26 x 26 chunks as you get near; only
   chunks that differ from flat ice are kept (the Agartha tunnel and city, and anything you dig or build), and only the ones you changed are
   saved. The 800 block tunnel runs from the ice wall hole near Blackstone Castle (72 blocks inside the map, 728 out here) down under the ice
   to Agartha. The base block helpers (getB, setB, solid, groundTop, skyTop) answer for z < 0 through __XG / __XS; GLX-C307b draws it. */
(function c307() {
  const X = window.__c307 = {err: null, ready: false, ch: new Map(), mod: new Set(), EH: 80, EXT: 1500, LT: 728, CR: 112, ZW: 240, L: null, route: null, ms: 0, gens: 0, x0: 0, z0: 0, W: 0};
  const ERR = (w, e) => { if (!X.err) X.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const EH = X.EH, CHs = CH, N = CHs * EH * CHs, key = (cx, cz) => (cz + 100) * 64 + cx;
  let FC = null;   // one flat-ice column
  const FL = () => SEA - 15;   // v1.1.29: open sea over a sea floor, like the rest of the round Earth (C320), no more ice plain
  const seaCol = () => { const c = new Uint8Array(EH); c[0] = T.DEEPSLATE || T.STONE; for (let y = 1; y < SEA; y++) c[y] = y <= FL() ? T.STONE : y <= FL() + 3 ? T.SAND : T.WATER; return c; };
  function shell(Z, ZW, ZD, F0, F1) { const y0 = FL() - 3, y1 = SEA + 1, ny = y1 - y0 + 1, n = ZW * ny * ZD, m = new Uint8Array(n), t = new Uint8Array(n), id = (x, y, z) => (x * ny + y) * ZD + z;
    for (let x = 0; x < ZW; x++) for (let y = 0; y < ny; y++) for (let z = 0; z < ZD; z++) if (!Z[(x * EH + y + y0) * ZD + z]) m[id(x, y, z)] = 1;
    const pass = (A, B, L, st, cnt) => { for (let o of cnt) { for (let i = 0; i < L; i++) { let v = 0; for (let k = -3; k <= 3; k++) { const j = i + k; if (j >= 0 && j < L && A[o + j * st]) { v = 1; break; } } B[o + i * st] = v; } } };
    const offs = (f) => { const r = []; f(r); return r; };
    pass(m, t, ZD, 1, offs(r => { for (let x = 0; x < ZW; x++) for (let y = 0; y < ny; y++) r.push(id(x, y, 0)); }));
    pass(t, m, ny, ZD, offs(r => { for (let x = 0; x < ZW; x++) for (let z = 0; z < ZD; z++) r.push(id(x, 0, z)); }));
    pass(m, t, ZW, ny * ZD, offs(r => { for (let y = 0; y < ny; y++) for (let z = 0; z < ZD; z++) r.push(id(0, y, z)); }));
    let n2 = 0; for (let x = 0; x < ZW; x++) for (let y = FL() + 1; y <= y1; y++) for (let z = 0; z < ZD; z++) { const i = (x * EH + y) * ZD + z, v = Z[i]; if (!v || v !== F0[y]) continue; Z[i] = t[id(x, y - y0, z)] ? T.STONE : F1[y]; n2++; }
    X.shellN = n2; }
  const flatCol = () => { const c = new Uint8Array(EH), S0 = SEA + 1; c[0] = T.DEEPSLATE || T.STONE; for (let y = 1; y <= S0; y++) c[y] = y > S0 - 4 ? (T.PACKSNOW || T.SNOW || T.STONE) : T.STONE; return c; };
  const newCh = () => { const a = new Uint8Array(N); for (let lx = 0; lx < CHs; lx++) for (let y = 0; y < EH; y++) a.fill(FC[y], (lx * EH + y) * CHs, (lx * EH + y + 1) * CHs); return a; };
  X.on = () => { try { return !!(window.__g89 && __g89() && W >= 600 && window.__c294 && __c294.M && __c294.M.e === 'N'); } catch (_) { return false; } };
  function getE(x, y, z) { if (z < __XZ || y < 0 || y >= EH) return 0; const cx = (x / CHs) | 0, cz = Math.floor(z / CHs), a = X.ch.get(key(cx, cz));
    return a ? a[((x - cx * CHs) * EH + y) * CHs + (z - cz * CHs)] : FC[y]; }
  function setE(x, y, z, v) { if (z < __XZ || y < 0 || y >= EH) return; const cx = (x / CHs) | 0, cz = Math.floor(z / CHs), k = key(cx, cz); let a = X.ch.get(k);
    if (!a) { if (FC[y] === v) return; a = newCh(); X.ch.set(k, a); } const lx = x - cx * CHs, lz = z - cz * CHs; a[(lx * EH + y) * CHs + lz] = v; X.mod.add(k);
    const d = X.dirty; d.add(k); if (lx === 0) d.add(key(cx - 1, cz)); if (lx === CHs - 1) d.add(key(cx + 1, cz)); if (lz === 0) d.add(key(cx, cz - 1)); if (lz === CHs - 1) d.add(key(cx, cz + 1));
    if (z === -1) try { markDirty(x, 0); } catch (_) {} }
  X.dirty = new Set(); X.get = getE; X.set = setE;
  function hook(a) { if (a) { __XG = getE; __XS = setE; __XN = (x, y) => y < EH ? getE(x, y, -1) : 0; __XZ = -X.EXT; } else { __XG = __XS = __XN = null; __XZ = 0; } }
  X.hook = hook;
  // ---------- make the extension: the zone (tunnel + Agartha) is carved once into a scratch array, then cut into chunks ----------
  function init(saved) { const t0 = performance.now(); X.ready = false; hook(false); X.ch.clear(); X.mod.clear(); X.dirty.clear(); X.L = null; X.route = null;
    try { if (window.__c307b) __c307b.clear(); } catch (_) {}
    if (!X.on()) return; FC = flatCol(); const M = __c294.M; X.LT = Math.max(600, 800 - Math.round(M.z));
    const ZW = X.ZW, ZD = X.LT + 2 * X.CR + 16, x0 = Math.max(0, Math.min(W - ZW, Math.round(M.c) - (ZW >> 1))), z0 = 3 - ZD; X.x0 = x0; X.z0 = z0; X.W = W;
    const sv = [world, W, H, D], Z = new Uint8Array(ZW * EH * ZD); let R = null;
    try { world = Z; W = ZW; H = EH; D = ZD; R = __c294.genExt({LT: X.LT, CR: X.CR, seed: typeof gSeed !== 'undefined' ? gSeed : 0, c: Math.round(M.c)}); }
    finally { world = sv[0]; W = sv[1]; H = sv[2]; D = sv[3]; }
    try { const t1 = performance.now(), F1 = seaCol(); shell(Z, ZW, ZD, FC, F1); FC = F1; X.shellMs = Math.round(performance.now() - t1); } catch (e) { ERR('shell', e); }
    const cx0 = Math.floor(x0 / CHs), cx1 = Math.floor((x0 + ZW - 1) / CHs), cz0 = Math.floor(z0 / CHs);
    for (let cx = cx0; cx <= cx1; cx++) for (let cz = cz0; cz <= -1; cz++) { let a = null;
      for (let lx = 0; lx < CHs; lx++) { const zx = cx * CHs + lx - x0; if (zx < 0 || zx >= ZW || cx * CHs + lx >= W) continue;
        for (let lz = 0; lz < CHs; lz++) { const wz = cz * CHs + lz, zz = wz - z0; if (wz >= 0 || zz < 0) continue;
          for (let y = 0; y < EH; y++) { const v = Z[(zx * EH + y) * ZD + zz]; if (!a) { if (v === FC[y]) continue; a = newCh(); } a[(lx * EH + y) * CHs + lz] = v; } } }
      if (a) X.ch.set(key(cx, cz), a); }
    // the zone answer in world coordinates for Agartha life, light, sky and the saucer
    const wx = x => x + x0, wz = z => z + z0;
    X.L = {v: 2, ag: 3, ext: 1, city: [wx(R.city[0]), wz(R.city[1]), R.city[2]], FL: R.FL, TOP: R.TOP, spires: (R.spires || []).map(p => [wx(p[0]), wz(p[1]), p[2], p[3]]), cry105: 1};
    X.route = R.path.map(p => [wx(p[0]), p[1], wz(p[2])]); X.tunnelEnd = X.route[X.route.length - 1];
    // saved changes go back on top
    if (saved && saved.v === 1 && saved.ch) for (const k in saved.ch) { try { const a = newCh(); rleDecode(saved.ch[k], a); X.ch.set(+k, a); X.mod.add(+k); } catch (e) { ERR('load', e); } }
    hook(true); X.ready = true; X.gens++; X.ms = Math.round(performance.now() - t0); try { if (window.__c307b) __c307b.clear(); } catch (_) {} }
  X.init = init;
  // the hole in the map edge: open the last two rows of the ice wall so the mouth tunnel runs straight on into the extension (new worlds only)
  function openEdge() { if (!window.__c294 || !__c294.M) return; const M = __c294.M, Y = SEA + 13; for (let z = 0; z <= 3; z++) for (let x = -17; x <= 17; x++) for (let y = SEA + 2; y <= Y + 13; y++) {
      if ((x * x) / (17 * 17) + ((y - Y) * (y - Y)) / (13 * 13) > 1) continue; const X0 = Math.round(M.c) + x; if (X0 < 0 || X0 >= W) continue; const i = idx(X0, y, z), b = world[i]; if (b && b !== T.HBEDROCK) world[i] = 0; }
    try { for (let x = -18; x <= 18; x++) markDirty(Math.round(M.c) + x, 0); } catch (_) {} }
  try { const gen = generate; generate = function () { hook(false); X.ready = false; const r = gen.apply(this, arguments); try { if (X.on()) { init(null); openEdge(); X.fresh = current && current.id; } } catch (e) { ERR('gen', e); } return r; }; } catch (e) { ERR('gw', e); }
  try { const ew = enterWorld; enterWorld = function (save) { hook(false); X.ready = false; X.fresh = null; const r = ew.apply(this, arguments);
      X.nw = !save || !!save.c307 || !!save.tpl; const go = () => { try { if (X.fresh && current && X.fresh === current.id && X.ready) return; if (!save) ens(); if (save) { init(save.c307 || null); if (!save.c307 && X.ready) openEdge(); } else if (!X.ready) { init(null); openEdge(); } } catch (e) { ERR('ew', e); } };
      if (r && typeof r.then === 'function') return r.then(v => { go(); return v; }); go(); return r; }; } catch (e) { ERR('ew0', e); }
  try { const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && X.ready) { const ch = {}; for (const k of X.mod) { const a = X.ch.get(k); if (a) ch[k] = rleEncode(a); } d.c307 = {v: 1, ch}; } } catch (e) { ERR('ser', e); } return d; }; } catch (e) { ERR('sw', e); }
  // v1.1.22: new and reset worlds always get the v1.1.17 layout, even when the mouth was not placed during generate (some world sizes and paths skipped it)
  function ens() { try { if (!DIM.cur && window.__g89 && __g89() && W >= 600 && window.__c294 && !__c294.M) __c294.build(); } catch (e) { ERR('ens', e); } }
  setInterval(() => { try { if (!X.nw || X.ready || !started || DIM.cur || !window.__g89 || !__g89() || W < 600) return; ens(); if (X.on()) { init(null); openEdge(); X.fresh = current && current.id; } } catch (e) { ERR('nw', e); } }, 500);
  // off in other dimensions (Moon, Mars, Backrooms...) and back on at home
  setInterval(() => { try { const a = X.ready && !DIM.cur && W === X.W && !(window.__c317 && __c317.on());   /* v1.1.38: no north ice plain on the round Earth, it is ocean now */ if (a !== !!__XG) hook(a); } catch (_) {} }, 100);
})();
