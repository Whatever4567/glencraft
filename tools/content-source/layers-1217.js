/* GLX-V1217 (v1.2.17): FOUR OPEN DEEP LAYERS UNDER THE UK, bedrock at y -237. New big (UK) worlds only.
   Real path traced: below y 0 every block comes from GLX-C320 getB -> __c320.fearth (no storage except your edits in __c320.edits),
   which GLX-DEEP wraps (deep caverns from 40 below the sea) and GLX-AGU wraps on top (the Agartha stamp, spiral and its solid walls,
   which still win). This module plugs into GLX-DEEP's gen for y < 0, so drawing (C324), edits, saving and Agartha stay as they are.
     y   -1 .. -3   rock roof (map caves above keep going down to y 0)
     y  -4 .. -46   1 NATURE: rolling grass and moss floor, mushroom-cap trees, moss boulders
     y -54 .. -96   2 BLUE: Gloamstone and deep tile halls, blue crystal stalactites, contained water pools (drips are heard near them)
     y -104 .. -150 3 CRYSTAL: round geode chambers joined together, crystal spikes from the floor
     y -156 .. -230 4 FIRE (tallest): basalt column fields, contained lava lakes, magma, and the Watcher eye shrine under the map centre
     y -231 .. -237 ragged bedrock, solid bedrock below -237
   Spiral stairs of Watcher brick go down through every layer on a 192 block grid, so you can walk all the way down.
   Kept solid: 24 blocks round the Agartha stamp box and the spiral cave (fail closed: if Agartha is not ready, the old deep code runs).
   Worlds saved before v1.2.17 keep the old deep layers (flag v1217dl). Pools and lakes sit in solid rimmed basins. */
(function v1217() {
  const U = window.__v1217 = {err: null, dl: false, n: 0, ent: 0, drips: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const S = Math.sin, F = Math.floor, BOT = -237;
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const n2 = (x, z, s) => 0.5 * S(x * 0.011 + s) * S(z * 0.013 - s * 1.3) + 0.3 * S(x * 0.031 - z * 0.027 + s * 2.1) + 0.2 * S(x * 0.077 + z * 0.069 - s);
  let B = null; const bl = () => B || (B = {ST: T.STONE, DS: T.DEEPSLATE || T.STONE, BR: T.BEDROCK || T.HBEDROCK || 211, GR: T.GRASS, DI: T.DIRT, MO: T.MOSS || T.MOSSYCOBBLE || T.GRASS,
    LOG: T.LOG || T.STONE, CAP: T.CAP || T.RED || 46, GLO: 771, FUN: 770, EMB: 772, ABY: 773, WB: 774, TILE: T.DSTILE || T.DEEPSLATE, CC: T.CRYCYAN || T.GLASS || 63,
    CV: T.CRYVIOLET || T.GEODE || 190, GEO: T.GEODE || 190, OB: T.OBSIDIAN || 189, BAS: T.BASALTCOL || 200, MAG: T.MAGMA || 208, HR: T.HELLROCK || 206, BS: T.BLACKSTONE || T.OBSIDIAN || 189, W: T.WATER, L: T.LAVA, GL: T.GLOWROCK || 209});
  // ---- who may use it ----
  let EYE = null; U.eyeAt = () => EYE;
  let AG = null; const agOk = () => { const a = window.__agw; if (!a || !a.ok || !Array.isArray(a.box)) return false; AG = a.box; return true; };
  U.on = () => U.dl && agOk() && !DIM.cur;
  const near = (x, y, z) => { if (!AG && !agOk()) return true; const b = AG; if (y > b[4] + 24 || y < b[1] - 24) { /* spiral cave */ } else if (x > b[0] - 24 && x < b[3] + 24 && z > b[2] - 24 && z < b[5] + 24) return true;
    return y > -66 && Math.hypot(x + 0.5 - 540, z + 0.5 + 30) < 40; };
  // ---- spiral stairs ----
  const G = 192; function stair(x, y, z) { const cx = F(x / G), cz = F(z / G), sx = cx * G + 40 + F(h3(cx, 5, cz) * 112), sz = cz * G + 40 + F(h3(cz, 6, cx) * 112), dx = x + 0.5 - sx, dz = z + 0.5 - sz, r = Math.hypot(dx, dz);
    if (r >= 7.5 || y < -228) return undefined; if (r < 2) return bl().WB;
    if (r >= 6.5) return y > -4 || y < -228 ? undefined : (h3(x, y, z) < 0.2 ? undefined : bl().WB);   // ruined wall
    const th = (Math.atan2(dz, dx) + Math.PI) / (2 * Math.PI), P = 6, t = ((-y - th * P) % P + P) % P; return t < 1 ? bl().WB : 0; }
  U.stairAt = (cx, cz) => [cx * G + 40 + F(h3(cx, 5, cz) * 112), cz * G + 40 + F(h3(cz, 6, cx) * 112)];
  // ---- basins: [type, cx, cz, r, top] for pools (layer 2) and lava lakes (layer 4) ----
  const stairD = (x, z) => { let m = 1e9; for (let i = -1; i <= 1; i++) for (let k = -1; k <= 1; k++) { const c = U.stairAt(F(x / G) + i, F(z / G) + k); m = Math.min(m, Math.hypot(x - c[0], z - c[1])); } return m; };
  const BC = new Map();
  function basin(x, z, k) { const q = 56, qx = F(x / q), qz = F(z / q), key = (qx * 65536 + qz) * 128 + k; if (BC.has(key)) return BC.get(key); let out = null; const r0 = h3(qx, k, qz);
    if (r0 <= 0.35) { const cx = qx * q + 14 + F(h3(qz, k + 1, qx) * 28), cz = qz * q + 14 + F(h3(qx, k + 2, qz) * 28), r = 4 + r0 * 20;
      // never next to a stair shaft, the Watcher shrine, or the Agartha keep-out (so nothing liquid ever borders open air sideways)
      if (stairD(cx, cz) > r + 12 && !(EYE && Math.hypot(cx - EYE[0], cz - EYE[2]) < r + 30) && !(AG && cx > AG[0] - 30 - r && cx < AG[3] + 30 + r && cz > AG[2] - 30 - r && cz < AG[5] + 30 + r)) out = [cx, cz, r]; }
    if (BC.size > 50000) BC.clear(); BC.set(key, out); return out; }
  // ---- layers ----
  function L1(x, y, z) { const b = bl(), fl = -42 + 5 * n2(x, z, 1) + 2 * n2(x * 3, z * 3, 2), ce = -7 - 4 * n2(z, x, 3); if (y >= ce || y < -46) return b.ST;
    if (y < fl) return y > fl - 1 ? (h3(x, 3, z) < 0.25 ? b.MO : b.GR) : y > fl - 4 ? b.DI : b.ST;
    const ty = F(fl); const cx = F(x / 24), cz = F(z / 24), th = h3(cx, 11, cz); if (th < 0.4) { const tx = cx * 24 + 6 + F(h3(cz, 12, cx) * 12), tz = cz * 24 + 6 + F(h3(cx, 13, cz) * 12), hh = 7 + F(th * 20), d = Math.hypot(x - tx, z - tz), fy = F(-42 + 5 * n2(tx, tz, 1) + 2 * n2(tx * 3, tz * 3, 2));
      if (d < 1 && y < fy + hh) return b.LOG; if (y >= fy + hh && y < fy + hh + 2 && d < 3.5 + th * 4 - (y - fy - hh) * 1.5) return b.CAP; }
    if (h3(x >> 2, 14, z >> 2) < 0.02 && y < ty + 3 && Math.hypot((x & 3) - 1.5, y - ty - 0.5, (z & 3) - 1.5) < 2) return b.MO;
    if (y > ce - 1 && h3(x, 15, z) < 0.15) return b.MO;
    return 0; }
  function L2(x, y, z) { const b = bl(), fl = -92 + 3 * n2(x, z, 21) + 3 * Math.abs(n2(x * 2, z * 2, 22)), ce = -58 - 6 * (0.5 + 0.5 * n2(z * 1.3, x * 1.3, 23)); if (y >= ce || y < -96) return y >= ce && y < ce + 1 && h3(x, 24, z) < 0.04 ? b.CC : b.GLO;
    const P = basin(x, z, 31); if (P) { const d = Math.hypot(x + 0.5 - P[0], z + 0.5 - P[1]), top = F(-92 + 3 * n2(P[0], P[1], 21)); if (d < P[2] + 1.6) { if (y > top) return h3(x, y, z) < 0.003 ? b.CC : 0; if (d < P[2] && y >= top - 2) return b.W; return b.TILE; } }
    if (y < fl) return h3(x, 25, z) < 0.3 ? b.TILE : b.GLO;
    const s = h3(x, 26, z); if (s < 0.025 && y > ce - 2 - F(s * 300)) return b.CC;   // blue crystal stalactites
    if (n2(x * 0.5, z * 0.5, 27) < -0.6) return b.GLO;   // great rock masses split the halls
    return 0; }
  const SP = new Map();
  function L3(x, y, z) { const b = bl(), C = 40, cx = F(x / C), cy = F((-y - 104) / 23), cz = F(z / C); let best = 1e9, sh = b.ABY;
    for (let i = -1; i <= 1; i++) for (let k = -1; k <= 1; k++) for (let j = 0; j <= 1; j++) { const X = cx + i, Z = cz + k, Y = cy + j, sk = (X * 4096 + Z) * 16 + Y; let q = SP.get(sk); if (!q) { q = [X * C + 8 + h3(X, Y, Z) * 24, -110 - Y * 23 - h3(X, Z, Y) * 10, Z * C + 8 + h3(Z, Y, X) * 24, 11 + h3(Y, X, Z) * 9]; if (SP.size > 60000) SP.clear(); SP.set(sk, q); }
      const ex = x + 0.5 - q[0], ey = (y + 0.5 - q[1]) * 1.25, ez = z + 0.5 - q[2], d = Math.sqrt(ex * ex + ey * ey + ez * ez) / q[3]; if (d < best) best = d; }
    const tun = Math.abs(n2(x * 0.7, z * 0.7, 41)) < 0.05 && y > -140 && y < -112;   // tubes join the geodes
    if (y > -104 || y < -150) return b.ABY;
    if (best < 1 || tun) { const fl = best < 1 ? 0 : 1; if (h3(x, 42, z) < 0.02 && h3(x, 43, z) * 9 > (y + 150) % 9) return h3(x, 44, z) < 0.5 ? b.CV : b.CC; return fl ? 0 : 0; }
    if (best < 1.12) return h3(x, y, z) < 0.08 ? (h3(x, y + 1, z) < 0.5 ? b.CV : b.CC) : b.GEO;
    return h3(x >> 1, y >> 1, z >> 1) < 0.5 ? b.ABY : b.OB; }
  function L4(x, y, z) { const b = bl(), fl = -226 + 4 * n2(x, z, 51), ce = -160 - 8 * (0.5 + 0.5 * n2(z * 0.8, x * 0.8, 52)); if (y >= ce || y < -230) return y >= ce ? (h3(x, 53, z) < 0.05 ? b.MAG : b.BS) : b.BS;
    if (EYE) { const d = Math.hypot(x + 0.5 - EYE[0], z + 0.5 - EYE[2]); if (d < 26) { if (y < -225) return d < 22 ? b.WB : b.BS; if (d >= 22 && d < 24 && y < -223) return y < -224 ? b.BS : 0; const a = Math.atan2(z - EYE[2], x - EYE[0]) / (Math.PI / 4); if (d > 16 && d < 18.5 && Math.abs(a - Math.round(a)) < 0.12 && y < -186) return b.EMB; return 0; } }
    const P = basin(x, z, 61); if (P) { const d = Math.hypot(x + 0.5 - P[0], z + 0.5 - P[1]), top = F(-226 + 4 * n2(P[0], P[1], 51)); if (d < P[2] + 1.6) { if (y > top) return 0; if (d < P[2] && y >= top - 1) return b.L; return b.BS; } }
    if (y < fl) return h3(x, 54, z) < 0.12 ? b.MAG : h3(x, 55, z) < 0.5 ? b.EMB : b.BS;
    const hx = F(x / 5), hz = F(z / 5), hc = h3(hx, 56, hz); if (n2(x * 0.3, z * 0.3, 57) > 0.25 && hc < 0.55 && Math.hypot((x - hx * 5) - 2, (z - hz * 5) - 2) < 2.3 && y < fl + 4 + hc * 40) return b.BAS;   // basalt column fields
    if (h3(x, 58, z) < 0.012 && y > ce - 3 - F(h3(z, 59, x) * 12)) return b.HR;
    return 0; }
  function gen(x, y, z) { U.n++; const b = bl(); if (y < BOT) return b.BR; if (y < -230) return y < -233 - F(h3(x, 1, z) * 3) ? b.BR : b.BS;
    if (near(x, y, z)) return y < -150 ? b.BS : b.DS;
    const st = stair(x, y, z); if (st !== undefined) return st;
    if (y > -4) return b.ST; if (y >= -46) return L1(x, y, z); if (y > -54) return b.ST; if (y >= -96) return L2(x, y, z); if (y > -104) return b.DS; if (y >= -150) return L3(x, y, z); if (y > -156) return b.OB; return L4(x, y, z); }
  U.gen = (x, y, z) => { try { return gen(x, y, z); } catch (e) { ERR('gen', e); return T.STONE; } };
  U.layer = y => y >= 0 ? 0 : y >= -50 ? 1 : y >= -100 ? 2 : y >= -153 ? 3 : y >= BOT ? 4 : 5;
  const flush = () => { try { const e = window.__c320; if (window.__c324 && __c324.cache) __c324.cache.clear(); if (e) { e.dirty = 1; e.edgeClr && e.edgeClr(); } } catch (_) {} };
  // ---- the way in: from the map caves down through y 0 onto each spiral stair under the map (new worlds, natural blocks only) ----
  function entrances() { let n = 0; const NAT = new Set([T.STONE, T.DEEPSLATE, T.DIRT, T.GRAVEL, T.BEDROCK, T.HBEDROCK, T.ANDESITE, T.GRANITE, T.DIORITE, T.TUFF, T.COALORE, T.IRONORE, T.COPPERORE, 133, 211].filter(v => v != null));
    for (let cx = 0; cx * G < W; cx++) for (let cz = 0; cz * G < D; cz++) { const [sx, sz] = U.stairAt(cx, cz); if (sx < 8 || sz < 8 || sx > W - 8 || sz > D - 8 || near(sx, -10, sz)) continue;
      let top = -1; for (let y = 1; y < Math.min(H - 1, 40); y++) { if (world[idx(sx, y, sz)] === T.AIR && world[idx(sx, y + 1, sz)] === T.AIR) { let roof = false; for (let k = y + 2; k < H; k++) { const v = world[idx(sx, k, sz)]; if (v === T.WATER || v === T.LAVA) break; if (v) { roof = true; break; } } if (roof) top = y; break; } }
      if (top < 0) continue; let ok = true; for (let x = sx - 3; x <= sx + 3 && ok; x++) for (let z = sz - 3; z <= sz + 3 && ok; z++) for (let y = 0; y <= top; y++) { const v = world[idx(x, y, z)]; if (v === T.WATER || v === T.LAVA) { ok = false; break; } }
      if (!ok) continue; for (let x = sx - 2; x <= sx + 2; x++) for (let z = sz - 2; z <= sz + 2; z++) { if (Math.hypot(x - sx, z - sz) > 2.6) continue; for (let y = 0; y < top; y++) { const i = idx(x, y, z); if (NAT.has(world[i])) world[i] = T.AIR; } } n++; }
    return n; }
  // ---- hooks ----
  try { const g = generate; generate = function () { const r = g.apply(this, arguments); try { U.dl = false; EYE = null;
      if (!DIM.cur && W >= 600 && !cityGen) { U.dl = true; EYE = [W >> 1, -196, D >> 1]; if (window.__v1212) __v1212.eye = EYE.slice(); try { if (current) current.v1212eye = EYE.slice(); } catch (_) {} U.ent = agOk() ? entrances() : 0; flush(); } } catch (e) { ERR('gen', e); } return r; }; } catch (e) { ERR('gw', e); }
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && !DIM.cur && U.dl) d.v1217dl = 1; } catch (_) {} return d; };
    const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && !d.dim) { const was = U.dl; U.dl = !!d.v1217dl; EYE = U.dl && Array.isArray(d.v1212eye) ? d.v1212eye : (U.dl ? [W >> 1, -196, D >> 1] : null); if (was !== U.dl) flush(); } } catch (_) {} return r; }; } catch (e) { ERR('save', e); }
  let lastOn = null; setInterval(() => { try { const o = U.on(); if (o !== lastOn) { lastOn = o; flush(); } } catch (_) {} }, 1000);
  // ---- water drips: only in the blue layer, only within 20 blocks of a pool, a few at a time; stops when you leave ----
  let dripT = 0, live = 0; const DN = new Set();
  function drip(v) { try { if (typeof AC === 'undefined' || !AC || live > 3) return; const t = AC.currentTime + 0.01, o = AC.createOscillator(), g = AC.createGain(); const f = 1100 + Math.random() * 900; o.type = 'sine';
      o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.1); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06 * v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g); g.connect(typeof master !== 'undefined' && master ? master : AC.destination); o.start(t); o.stop(t + 0.3); live++; DN.add(o); o.onended = () => { live--; DN.delete(o); try { o.disconnect(); g.disconnect(); } catch (_) {} }; U.drips++; } catch (e) { ERR('drip', e); } }
  setInterval(() => { try { if (!U.on() || !started || paused || P.y > -54 || P.y < -96) { if (DN.size) for (const o of DN) { try { o.stop(); } catch (_) {} } return; }
      let best = 1e9; for (let i = -1; i <= 1; i++) for (let k = -1; k <= 1; k++) { const q = basin(F(P.x) + i * 56, F(P.z) + k * 56, 31); if (q) best = Math.min(best, Math.hypot(P.x - q[0], P.z - q[1]) - q[2]); }
      if (best > 20) return; if ((dripT -= 0.5) <= 0) { dripT = 1 + Math.random() * 2.5; drip(Math.max(0.2, 1 - Math.max(0, best) / 20)); } } catch (_) {} }, 500);
  // ---- v1.2.6 icons (chest, grass, diamond block, map, bread, rotten flesh) given to the icon owners that re-assert forever ----
  // Cause: GLX-C187 (every 1.5 s, for ever) and GLX-C122 put back their own cached icons; the v1.2.6 re-assert stops after ~2 min,
  // so the old flat or late iso chest icon came back. Registering ours in their keep maps makes them re-assert ours instead.
  let icT = 0; const icv = setInterval(() => { try { const V = window.__v126; if (V && V.icons && Object.keys(V.icons).length) { for (const k in V.icons) { const u = V.icons[k];
        if (window.__c187 && __c187.MINE) __c187.MINE[k] = u; if (window.__c122 && __c122.MINE) __c122.MINE[k] = u; if (ICONS[k] !== u) { ICONS[k] = u; try { delete ICON_KEY[k]; } catch (_) {} } } U.icons = 1; }
      if (++icT > 240 || U.icons) { if (U.icons && icT > 20) clearInterval(icv); } } catch (e) { ERR('icons', e); } }, 1000);
})();
