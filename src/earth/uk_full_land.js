/* GLX-C347 (v1.1.51): THE WHOLE UK AND IRELAND IS FULL GLENCRAFT LAND. Out past the Scotland map the ground now gets the same
   top blocks as Glencraft (grass, heather, sand beaches, snow tops, regional rock), with trees, flowers, ferns, ores and small
   caves (never under water). The sea is real water everywhere, and the streamed chunks are drawn far out and from the air. */
(() => {
  const U = window.__c347 = {err: null, n: 0, trees: 0};
  const ERR = (w, e) => { U.err = w + ': ' + (e && e.message || e); };
  const E = () => window.__c320, off = (x, z) => !(x >= 0 && x < W && z >= 0 && z < D);
  const hs = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7 + 17.3) * 43758.5453; return s - Math.floor(s); };
  const h3 = (i, j, k) => { const s = Math.sin(i * 12.99 + j * 78.23 + k * 37.72) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, z) => { const i = Math.floor(x), j = Math.floor(z), a = x - i, b = z - j, u = a * a * (3 - 2 * a), w = b * b * (3 - 2 * b);
    return (hs(i, j) * (1 - u) + hs(i + 1, j) * u) * (1 - w) + (hs(i, j + 1) * (1 - u) + hs(i + 1, j + 1) * u) * w; };
  const fbm = (x, z) => vn(x, z) * 0.55 + vn(x * 2.1 + 5.2, z * 2.1 - 3.1) * 0.3 + vn(x * 4.3 - 7.7, z * 4.3 + 1.9) * 0.15;
  const cl = (v, a, b) => v < a ? a : v > b ? b : v, ss = t => t * t * (3 - 2 * t);
  const BASE = new Set([0, 1, 10, 11]);
  // one column: height above the sea, the ground kind and the top block
  const CC = new Map();
  function colm(x, z) { const k = x * 131072 + z; let c = CC.get(k); if (c) return c; const e = E();
    const q = e.ground(x, SEA, z, 0, 1, 0), g = q[0], kind = q[1], h = __c341.hT(x, z), hi = h[1] || 0, L = h[2] || 0, vk = h[3];
    let tb = 0; if (BASE.has(kind) && !vk) { const SN = T.PACKSNOW || T.SNOW || T.STONE, GV = T.GRAVEL || T.STONE, beach = g <= 2 && L < 0.62;
      tb = g <= 0 ? (g < -4 ? GV : T.SAND) : beach ? T.SAND : hi > 0.5 && g > 40 ? SN : hi > 0.5 && g > 30 ? (fbm(x / 6, z / 6) > 0.5 ? T.STONE : GV) : hi > 0.4 && fbm(x / 23 + 3, z / 23) > 0.56 ? T.HEATHER : T.GRASS; }
    let vg = tb; if (!tb && g > 0) { try { vg = e.layer(e.R, 0.5, kind, x, SEA + g - 1, z); } catch (_) { vg = 0; } if (kind === 30 && fbm(x / 13, z / 13) < 0.62) { tb = T.GRASS; vg = T.GRASS; } }
    c = [g, kind, tb, hi, vg]; CC.set(k, c); if (CC.size > 400000) CC.clear(); return c; }
  // trees: same spacing as Glencraft, pines up in the Highlands, birch and oak lower down
  const TC = new Map();
  function tree(x, z) { const k = x * 131072 + z; let t = TC.get(k); if (t !== undefined) return t; t = 0;
    const c = colm(x, z), g = c[0]; if (g > 1 && g < 44 && (c[4] === T.GRASS || c[4] === T.HEATHER)) { const p = hs(x * 0.37, z * 0.91), dn = c[3] > 0.5 ? (g < 26 ? 0.012 : 0) : 0.006 + 0.02 * ss(cl(fbm(x / 70 + 50, z / 70) * 2 - 1, 0, 1));
      if (p < dn) t = [g, 4 + (hs(x, z) * 3 | 0), c[3] > 0.5]; }
    TC.set(k, t); if (TC.size > 400000) TC.clear(); return t; }
  function leaf(x, a, z) { for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const t = tree(x + dx, z + dz); if (!t) continue; const [g, n, pine] = t, dy = a - g;
      if (!dx && !dz && dy >= 0 && dy < n) return pine ? (T.PINELOG || T.LOG) : (T.BIRCHLOG || T.LOG);
      if (dy < n - 2 || dy > n + 1) continue; const r = pine ? Math.max(0, 2 - ((dy - n + 2) >> 1)) : (dy > n ? 1 : 2);
      if (Math.abs(dx) > r || Math.abs(dz) > r || Math.abs(dx) + Math.abs(dz) > r + 1) continue; return pine ? (T.PINELEAVES || T.LEAVES) : (T.BIRCHLEAVES || T.LEAVES); } return 0; }
  const ORES = () => [[T.COALORE, 0.014, 60], [T.IRONORE, 0.008, 60], [T.COPPERORE, 0.005, 40], [T.GOLDORE, 0.0015, 25], [T.DIAMONDORE, 0.0006, 30]].filter(o => o[0]);
  let OR = null;
  function gen(x, y, z, f0) { const a = y - SEA, c = colm(x, z), g = c[0], kind = c[1], tb = c[2], e = E();
    if (a < g) { const dd = g - a - 1;
      if (!tb) return e.layer(e.R, dd + 0.5, kind, x, y, z);
      if (dd === 0) return tb; if (dd < 3) return tb === T.SAND || tb === (T.GRAVEL || -1) ? T.SAND : tb === T.STONE || tb === (T.PACKSNOW || T.SNOW) ? T.STONE : T.DIRT;
      // small winding caves in the rock, never under the sea or a loch
      if (g > 3 && dd > 5 && a > -36) { const v = vn(x / 17 + a * 0.13, z / 17 - a * 0.09) + vn(x / 9 - 3.3, z / 9 + a / 7) * 0.5; if (Math.abs(v - 0.75) < 0.035) return 0; }
      if (!OR) OR = ORES(); const r = h3(x, y, z); let s = 0; for (const o of OR) { s += o[1]; if (r < s && dd > 3 && -a < o[2] + 40) return o[0]; if (r < s) break; }
      return T.STONE; }
    if (a < 0) return T.WATER;
    if (g <= 0) return 0;
    const vg = c[4]; if (a === g && (vg === T.GRASS || vg === T.HEATHER)) { const p = hs(x * 1.31 + 7, z * 0.77 - 3); if (p < 0.08) { const t = tree(x, z); if (t) return t[2] ? (T.PINELOG || T.LOG) : (T.BIRCHLOG || T.LOG);
        return p < 0.05 ? T.TALLGRASS : p < 0.06 ? (T.FERN || T.TALLGRASS) : p < 0.07 ? (vg === T.HEATHER ? T.THISTLE : T.DANDELION) : (T.BLUEBELL || T.DANDELION); } }
    if (a > g + 8) return 0; return leaf(x, a, z); }
  function hook() { const e = E(); if (!e || !e.fearth || e.fearth.c347 || !window.__c341 || !__c341.hT) return; const f0 = e.fearth;
    const f = function (x, y, z) { try { const a = y - SEA; if (off(x, z) && a >= -40 && a < 70 && e.flat) { const ll = __c339.fll(x, z); if (ll[0] !== 0) { U.n++; return gen(x, y, z, f0); } } } catch (er) { ERR('gen', er); } return f0.apply(this, arguments); };
    f.c347 = 1; f.top = (x, z) => { if (!off(x, z)) return 999; const ll = __c339.fll(x, z); if (ll[0] === 0) return 0; return Math.max(0, colm(x, z)[0]) + 9; }; e.fearth = f; try { __c339.fresh(); } catch (_) {} }
  // digging down never sends you home: the old fell out of the world check is ignored on the big world unless you are below the true bottom
  const deep = () => { try { return W >= 600 && !DIM.cur && isFinite(P.y) && P.y > SEA - 1500; } catch (_) { return false; } };
  let skip = 0;
  try { const hu = hurt; hurt = function (n, why) { if (/fell out of the world/i.test(String(why || '')) && deep()) { skip = 1; U.voidSkip = (U.voidSkip || 0) + 1; return; } return hu.apply(this, arguments); }; } catch (e) { ERR('hurt', e); }
  try { const sp = spawnPlayer; spawnPlayer = function () { if (skip) { skip = 0; return; } return sp.apply(this, arguments); }; } catch (e) { ERR('sp', e); }
  // below the true bottom (under the hollow Earth floor): back up to the ground above
  setInterval(() => { try { if (typeof started === 'undefined' || !started || DIM.cur || W < 600 || !(P.y < SEA - 1500) || (window.__c321 && __c321.on && __c321.on())) return; const x = Math.floor(P.x), z = Math.floor(P.z);
      let y; if (!off(x, z)) y = groundTop(x, z) + 1.05; else y = SEA + Math.max(0, colm(x, z)[0]) + 1.05; P.y = y; P.vy = 0; P.fallTop = null; U.bottom = (U.bottom || 0) + 1; try { toast('You fell below the bottom of the world - back up to the ground'); } catch (_) {} } catch (e) { ERR('bot', e); } }, 400);
  setInterval(() => { try { hook(); } catch (er) { ERR('hook', er); } }, 500);
})();
