/* GLX-AGU (v1.1.87): THE REAL AGARTHA IS UNDER SCOTLAND. No more separate Agartha world. The cave mouth is in the hills on the north
   coast of Scotland, just past the top of the old map where the ice wall was. Walk in: a lit spiral cave winds down about 120 blocks, a short
   passage joins the great overgrown tube tunnel, and about 450 blocks along it opens into the crystal city in its huge cavern, with its
   own inner sun, haze, sparkles and the tall blue eyed Agarthans. The saucer sleeps in the city by day and flies out the same way at dusk.
   It is all part of the normal world, so you can dig and place blocks anywhere in it and it is kept in your save. */
(function agu() {
  const U = window.__agw = {err: null, ok: 0, ms: 0, went: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const AX = 420, AY = -50, ZS = 1560, YN = 48, HX = 540, HZ = -30, HR = 12, TR = 3.2, YT = 86, YB = -36, SLP = 4, TURN = (YT - YB) / SLP, PH0 = Math.PI / 2 - TURN;
  let S = null, SW = 0, SD = 0, L = null; U.box = null;
  // the crystal city and tunnel are made once by the original Agartha maker, then kept as a block stamp under Scotland
  function build() { const t0 = performance.now(), sv = {world, W, D, H, dim: DIM.cur}; let A = null; DIM.cur = 'agartha';
    try { __c294.genAg(); A = __c294.A; SW = W; SD = D - ZS; const st = new Uint8Array(SW * YN * SD);
      for (let x = 0; x < SW; x++) for (let z = 0; z < SD; z++) for (let y = 0; y < YN; y++) { const b = world[idx(x, y, z + ZS)]; st[(x * SD + z) * YN + y] = (b && (b === T.HBEDROCK || b === T.BEDROCK)) ? (T.DEEPSLATE || T.STONE) : b; }   /* v1.1.92: no bedrock floor under Agartha, you can dig on down into the deep layers */
      S = st; } finally { DIM.cur = sv.dim; world = sv.world; W = sv.W; D = sv.D; H = sv.H; }
    const dz = -ZS; L = {v: 2, ag: 3, cry105: 1, city: [A.city[0] + AX, A.city[1] + dz, A.city[2]], FL: A.FL + AY, TOP: A.TOP + AY, spires: (A.spires || []).map(s => [s[0] + AX, s[1] + dz].concat(s.slice(2))), under: 1};
    U.L = L; U.box = [AX, AY, 0, AX + SW, AY + YN, SD]; U.ms = Math.round(performance.now() - t0); U.ok = 1; }
  const stamp = (x, y, z) => { const i = x - AX, j = y - AY; if (i < 0 || i >= SW || j < 0 || j >= YN || z < 0 || z >= SD) return undefined; return S[(i * SD + z) * YN + j]; };
  // the spiral cave down from the hills, then a short passage south into the tube tunnel
  function way(x, y, z) { if (y > YT + 4 || y < YB - 6) return undefined;
    // v1.1.91: the big tube does not stop in a flat wall: it narrows like a funnel over 18 blocks into the passage, with a bumpy rock edge
    if (z >= -18 && z < 1) { const t = (1 - z) / 19, e = t * t * (3 - 2 * t), rx = 13 - 10.5 * e, ry = 12 - 9 * e, yc = -27.5 + (YB + 0.5 + 27.5) * e, dx = (x + 0.5 - HX) / rx, dy = (y + 0.5 - yc) / ry, q = dx * dx + dy * dy, n = (h(x, y, z) - 0.5) * 0.18; if (q < 1 + n) return 0; }
    if (x >= HX - 2 && x <= HX + 2 && z >= HZ + HR - 2 && z <= 3 && y >= YB - 3 && y <= YB + 2) return 0;
    if (x >= HX - 3 && x <= HX + 3 && z >= HZ + HR - 3 && z <= 3 && y === YB - 4) return (z & 7) === 0 && Math.abs(x - HX) === 3 ? T.GLOWROCK || T.LAMP : undefined;
    const hx = x + 0.5 - HX, hz = z + 0.5 - HZ, rr = Math.hypot(hx, hz), rho = rr - HR; if (Math.abs(rho) > TR + 1.2) return undefined;
    let ph = Math.atan2(hz, hx) - PH0; ph = ((ph % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    for (let th = ph; th <= TURN + 0.2; th += 2 * Math.PI) { const yc = YT - th * SLP, dy = y + 0.5 - yc, q = rho * rho + dy * dy; if (q < TR * TR) return 0;
      if (dy < 0 && q < (TR + 1.2) * (TR + 1.2) && rho > 1.5 && h(x, y, z) < 0.12) return T.GLOWROCK || T.LAMP; }
    return undefined; }
  const h = (x, y, z) => { let k = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791); k = Math.imul(k ^ (k >>> 13), 1274126177); return ((k ^ (k >>> 16)) >>> 0) / 4294967296; };
  // v1.1.91: solid rock round the spiral, the passage and the near end of the tunnel, so the deep caverns do not cut them open into a flat wall
  const vn = (x, y, z) => { const fx = x / 6, fy = y / 6, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, a = h(x0, y0, z), b = h(x0 + 1, y0, z), c = h(x0, y0 + 1, z), d = h(x0 + 1, y0 + 1, z); return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty; };
  function wall(x, y, z) { if (y < AY - 6 || y > YT) return false; const rr = Math.hypot(x + 0.5 - HX, z + 0.5 - HZ);
    if (rr < HR + TR + 3 && y >= YB - 6 && y < AY + YN - 8) return true;
    if (Math.abs(x - HX) <= 5 && z >= HZ + HR - 4 && z < 0 && y >= YB - 6 && y <= YB + 5) return true;
    if (x >= AX - 12 && x < AX + 252 && z < 0 && y < AY + YN && z >= -12 - 12 * vn(x, y, 7)) return true; return false; }
  U.way = way; U.stamp = stamp;
  function hook() { const e = window.__c320; if (!U.ok || !e || !e.flat || !e.fearth || !e.fearth.dw || e.fearth.agw) return; const f0 = e.fearth;
    const f = function (x, y, z) { if (Math.abs(x - HX) <= HR + 5 && z >= HZ - HR - 5 && z <= 4) { const q = way(x, y, z); if (q !== undefined) return q; }
      if (wall(x, y, z)) return T.STONE;
      if (y < AY + YN && y >= AY) { const q = stamp(x, y, z); if (q !== undefined) return q; } return f0.apply(this, arguments); };
    for (const k in f0) f[k] = f0[k]; f.agw = 1; e.fearth = f; try { if (window.__c324 && __c324.cache) __c324.cache.clear(); e.dirty = 1; } catch (_) {} }
  setInterval(() => { try { if (typeof started === 'undefined' || !started || DIM.cur) return; if (!U.ok && window.__c294 && __c294.genAg && window.__c320 && __c320.flat) build(); hook();
      if (L && window.__c294 && __c294.L !== L && !DIM.cur) __c294.L = L; } catch (e) { ERR('tick', e); } }, 500);
  // where things are, for the saucer, the teleports and older code
  const surf = (x, z) => { for (let y = YT + 20; y > SEA - 2; y--) { const b = getB(x, y, z); if (b && b !== T.WATER && !(PLANT[b]) && !LEAFY[b]) return y + 1; } return SEA; };
  U.mouth = () => { const x = HX + HR + 5, z = HZ; return [x + 0.5, surf(x, z) + 0.05, z + 0.5]; };
  U.cityPos = () => L ? [L.city[0] + 0.5, L.FL + 0.05, L.city[1] - L.city[2] + 14.5] : null;
  U.route = () => { if (!L) return null; const c = L.city, ty = AY + 24; return [['ow', c[0] + 0.5, L.FL + 6, c[1] + 0.5], ['ow', c[0] + 0.5, ty, c[1] - c[2]], ['ow', HX + 0.5, ty, 2.5], ['ow', HX + 0.5, YB, HZ + HR], ['ow', HX + 0.5, YB, HZ + 0.5], ['ow', HX + 0.5, YT + 6, HZ + 0.5]]; };
  const tp = (p, yaw, msg) => { P.x = p[0]; P.y = p[1]; P.z = p[2]; P.vy = 0; P.fallTop = null; if (yaw != null) P.yaw = yaw; U.went++; try { dirtyAll = true; } catch (_) {} try { toast(msg); } catch (_) {} };
  U.toMouth = () => { if (DIM.cur) { toast('Go back to the overworld first'); return false; } tp(U.mouth(), Math.PI / 2, 'North Scotland: the cave down to Agartha'); return true; };
  U.toCity = () => { if (DIM.cur) { toast('Go back to the overworld first'); return false; } const p = U.cityPos(); if (!p) { toast('Agartha is still being made, try again in a moment'); return false; } tp(p, Math.PI, 'Agartha'); return true; };
  const PO = {x: HX - 12, z: HZ, top: YT, lat: 90, n: [0, 1, 0]};
  setInterval(() => { try { const c = window.__c332; if (c && c.pole !== PO) { c.pole = PO; c.SH = () => PO; c.toCity = () => U.toCity(); } } catch (_) {} }, 1000);
})();
