/* ===================== GLX-C77 (v0.9.62): 864 x 864 Highlands with a bedrock border, 288 Hell at 1:3, Minecraft 1.18-style ores + bedrock, castle gates + solid foundations, linked caves ===================== */
var ORE18 = false, ISL_S = 1;
(function c77() {
  const BIG = 864, BR = T.BEDROCK || 211;
  // ---- island layout for a world size: the island grows to fill most of the map, the sea mountain sits to the east ----
  function islandLayout(w) {
    ISL_W = w;
    if (w === BIG) { ISL_S = w / 448; ISL_C = [352, 432]; ISL_R = 288; MT_C = [736, 432]; MT_R = 80; }
    else { ISL_S = 1; ISL_C = [170, 224]; ISL_R = 112; MT_C = [372, 224]; MT_R = 58; }
    const k = MT_R / 58; HOL_C = [MT_C[0] + Math.round(20 * k), MT_C[1] + 2];
  }
  window.__islandLayout = islandLayout;
  let smallNext = false;
  const cw = createWorld; createWorld = function () { smallNext = newMode === 'creative'; return cw.apply(this, arguments); };
  const ew = enterWorld; enterWorld = function (save) {
    if (save) { ORE18 = !!(save.ore18 && save.W === BIG); islandLayout(ORE18 ? BIG : 448); }
    else { const big = !!(current && current.mode !== 'creative' && !smallNext && !current.preset && !window.__c77small); ORE18 = big; islandLayout(big ? BIG : 448); }
    smallNext = false; return ew.apply(this, arguments); };
  const se = serialize; serialize = function () { const d = se.apply(this, arguments); if (ORE18 && !DIM.cur) d.ore18 = 1; return d; };
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); if (d && d.dim === 'hell' && d.W) HELL_W = d.W; else if (d && d.world && !d.dim) ORE18 = !!(d.ore18 && d.W === BIG); return r; };

  let sd = 1; const rnd = () => (sd = (Math.imul(sd, 16807) >>> 0) % 2147483647) / 2147483647;
  const tri = (a, b) => a + (b - a) * (rnd() + rnd()) / 2;
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ gSeed; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const inb = (x, y, z) => x > 0 && z > 0 && x < W - 1 && z < D - 1 && y > 0 && y < H - 1;
  const airN = (x, y, z) => { const a = world[idx(x + 1, y, z)], b = world[idx(x - 1, y, z)], c = world[idx(x, y + 1, z)], d = world[idx(x, y - 1, z)], e = world[idx(x, y, z + 1)], f = world[idx(x, y, z - 1)]; return !a || !b || !c || !d || !e || !f; };
  // MC Y -> game y: -64 -> 0, 0 -> 21, 63 (sea) -> 41, 320 -> 124
  const MCY = Y => Math.round((Y + 64) * 0.3228);
  const ORES = () => [
    // [name, id, veins per 1000 columns, yLo, yHi (triangle, MC-mapped), size lo, size hi, rule]
    ['coal', T.COALORE, 26, MCY(0), MCY(192), 5, 12], ['coal-high', T.COALORE, 8, MCY(136), MCY(320), 4, 10, 'u'],
    ['copper', T.COPPERORE, 14, MCY(-16), MCY(112), 4, 9], ['iron', T.IRONORE, 16, MCY(-24), MCY(56), 3, 8], ['iron-mountain', T.IRONORE, 10, MCY(80), MCY(384), 3, 8],
    ['silver', T.SILVERORE, 5, MCY(-48), MCY(48), 2, 6], ['gold', T.GOLDORE, 5, MCY(-64), MCY(32), 2, 6],
    ['lazurite', T.LAZORE, 3.5, MCY(-32), MCY(32), 2, 6], ['lazurite-even', T.LAZORE, 1.5, 1, MCY(64), 2, 5, 'u'],
    ['redstone', T.REDORE, 6, MCY(-96), MCY(-32), 3, 8], ['redstone-even', T.REDORE, 2, 1, MCY(15), 3, 7, 'u'],
    ['diamond', T.DIAMONDORE, 5, MCY(-144), MCY(16), 1, 5, 'hide'], ['ruby', T.RUBYORE, 9, MCY(-16), MCY(480), 1, 2, 'mtn']];
  window.__c77ores = ORES;
  const host = b => b === T.STONE || b === T.DEEPSLATE;
  function vein(x, y, z, n, ore, hide) { let put = 0;
    for (let k = 0; k < n; k++) { if (inb(x, y, z) && host(world[idx(x, y, z)]) && !(hide && airN(x, y, z) && rnd() < 0.5) && !(placedSet && placedSet.has(idx(x, y, z)))) { world[idx(x, y, z)] = ore; put++; }
      const r = rnd() * 6 | 0; if (r === 0) x++; else if (r === 1) x--; else if (r === 2) z++; else if (r === 3) z--; else if (r === 4) y++; else y--; }
    return put; }
  function orePass() {
    const t0 = performance.now(); sd = (gSeed ^ 0x77a11e) >>> 0 || 9;
    const STRIP = new Uint8Array(256); [T.COALORE, T.IRONORE, T.COPPERORE, T.GOLDORE, T.REDORE, T.DIAMONDORE, T.SILVERORE, 179].forEach(b => { if (b !== undefined) STRIP[b] = 1; });
    const DS = T.DEEPSLATE; let stripped = 0;
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { const b0 = (x * H + y) * D, low = y <= 22;
      for (let z = 0; z < D; z++) { const i = b0 + z, b = world[i];
        if (STRIP[b]) { world[i] = y < 21 ? DS : T.STONE; stripped++; continue; }
        if (!low) { if (b === DS && y > 24) world[i] = T.STONE; continue; }
        if (y === 0) { world[i] = BR; continue; }
        if (y <= 4) { if (b && b !== T.WATER && h3(x, y, z) < (5 - y) * 0.2) { world[i] = BR; continue; } }
        if (b === T.STONE && (y <= 19 || (y <= 22 && h3(x, y + 40, z) < (23 - y) / 4))) world[i] = DS;
        else if (b === DS && y > 22) world[i] = T.STONE; } }
    const cols = W * D / 1000, top = (x, z) => g9cols ? g9cols[(x * D + z) * 2] : solidTop(x, z), hist = {};
    for (const [name, id, per, lo, hi, s0, s1, rule] of ORES()) { if (id === undefined) continue; const n = Math.round(per * cols); let placed = 0;
      for (let v = 0; v < n; v++) { const x = 2 + (rnd() * (W - 4) | 0), z = 2 + (rnd() * (D - 4) | 0); let y = -1;
        for (let t = 0; t < 6 && (y < 1 || y > H - 3); t++) y = Math.round(rule === 'u' ? lo + rnd() * (hi - lo) : tri(lo, hi));
        if (y < 1 || y > H - 3) continue;
        if (rule === 'mtn') { const tp = top(x, z); if (tp < SEA + 28 || y > tp - 2) continue; }
        placed += vein(x, y, z, Math.round(s0 + rnd() * (s1 - s0)), id, rule === 'hide'); }
      hist[name] = placed; }
    return {ms: Math.round(performance.now() - t0), stripped, placed: hist}; }
  // ---- the edge of the world: a ring of unbreakable bedrock, an invisible wall beyond it ----
  function border() { let n = 0;
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { if (x && z && x < W - 1 && z < D - 1) continue; let t = 0; for (let y = H - 1; y > 0; y--) { const b = world[idx(x, y, z)]; if (b && b !== T.WATER && !PLANT[b]) { t = y; break; } }
      const top = Math.max(t, SEA - 1); for (let y = 0; y <= top; y++) { world[idx(x, y, z)] = BR; n++; } for (let y = top + 1; y < H; y++) if (world[idx(x, y, z)] !== T.WATER) world[idx(x, y, z)] = T.AIR; }
    return n; }
  // ---- castles: solid ground under them, no mineshafts beneath, a proper gate + path ----
  const SIZE = {human: 15, mossy: 15, black: 13};
  const MINE = new Set([T.PLANKS, 162, T.COBWEB, T.TORCH, T.CHEST].filter(v => v !== undefined));
  function castleWork() { const out = [];
    for (const c of g9castles) { const [k, cx, cz] = c; const S = SIZE[k]; if (!S) continue;
      const info = (window.__c53 || []).find(o => o.cx === cx && o.cz === cz); const gy = info ? info.gy : solidTop(cx, cz) + 1;
      const R = S + 4, fill = y => y < 21 ? T.DEEPSLATE : T.STONE; let filled = 0, mines = 0;
      // 1) mineshaft pieces under and around the castle go back to rock
      for (let x = cx - R - 20; x <= cx + R + 20; x++) for (let z = cz - R - 20; z <= cz + R + 20; z++) for (let y = 2; y < gy - 2; y++) { if (!inb(x, y, z)) continue; const i = idx(x, y, z), b = world[i];
        if (MINE.has(b)) { world[i] = fill(y); mines++; if (b === T.CHEST) { chests.delete(keyOf(x, y, z)); entMeta.delete(keyOf(x, y, z)); }
          for (const [a, bb, cc] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]]) { const j = idx(x + a, y + bb, z + cc); if (inb(x + a, y + bb, z + cc) && !world[j] && y + bb < gy - 2) world[j] = fill(y + bb); } } }
      // 2) no caves, ravines or tunnels under the walls: fill any hollow down to 12 blocks below, tapering outwards
      for (let x = cx - R - 6; x <= cx + R + 6; x++) for (let z = cz - R - 6; z <= cz + R + 6; z++) { const d = Math.max(Math.abs(x - cx), Math.abs(z - cz)), depth = d <= R ? 12 : 12 - (d - R) * 2; if (depth <= 0) continue;
        for (let y = gy - 2; y >= Math.max(1, gy - 1 - depth); y--) { if (!inb(x, y, z)) continue; const i = idx(x, y, z), b = world[i]; if (!b || b === T.WATER || b === T.LAVA || b === T.LAVAB) { world[i] = fill(y); filled++; } } }
      // 3) gate: arched opening, raised portcullis, a gatehouse over it, banners, then steps + a path out to the land
      const st = k === 'black' ? T.BLACKSTONE : T.STONEBRICK, st2 = () => k === 'mossy' ? (h3(cx, filled++, cz) < 0.45 ? T.MOSSYBRICK : T.STONEBRICK) : st;
      const put = (x, y, z, b) => { if (inb(x, y, z)) world[idx(x, y, z)] = b; };
      const gz0 = cz + S - 1, gz1 = cz + S, WH = 7;
      for (const z of [gz0, gz1]) { for (let x = cx - 1; x <= cx + 1; x++) for (let y = gy; y < gy + 4; y++) put(x, y, z, T.AIR); put(cx - 1, gy + 3, z, st2()); put(cx + 1, gy + 3, z, st2()); }
      put(cx, gy + 3, gz0, 163); put(cx - 1, gy + 2, gz0, 163); put(cx + 1, gy + 2, gz0, 163);   // portcullis teeth, raised into the arch
      if (k === 'black' || k === 'mossy') { put(cx - 1, gy + 2, gz0, T.AIR); }                           // the old ones are half broken
      for (let x = cx - 1; x <= cx + 1; x++) for (let z = gz0; z <= gz1 + 1; z++) { for (let y = gy + 4; y <= gy + WH + 3; y++) put(x, y, z, st2()); if (((x + z) & 1) === 0) put(x, gy + WH + 4, z, st2()); }
      put(cx, gy + WH + 1, gz1 + 1, T.GLASS);   // a window over the gate
      if (k !== 'black') for (const sx of [-1, 1]) { if (k === 'mossy' && sx > 0) continue; put(cx + sx * 4, gy + 5, cz + S + 2, T.TAPESTRY); put(cx + sx * 4, gy + 4, cz + S + 2, T.TAPESTRY); }
      // path: 3 wide, follows the land one step at a time with stairs, lamp posts at the human castle
      let s = gy - 1; const pathB = k === 'black' ? T.BLACKSTONE : k === 'mossy' ? T.COBBLE : (T.GRAVEL || T.COBBLE), len = 16;
      for (let j = 1; j <= len; j++) { const z = cz + S + j; if (z > D - 3) break; let t = 0; for (let x = cx - 1; x <= cx + 1; x++) t += solidTop(x, z); t = Math.round(t / 3);
        const ns = j <= 2 ? gy - 1 : Math.max(s - 1, Math.min(s + 1, t));
        for (let x = cx - 1; x <= cx + 1; x++) { for (let y = ns + 1; y <= ns + 4; y++) { const b = world[idx(x, y, z)]; if (b && b !== T.TORCH) put(x, y, z, T.AIR); }
          put(x, ns, z, ns > s ? 167 : pathB); if (ns > s) entMeta.set(keyOf(x, ns, z), {face: stairF(0, 1)});
          for (let y = ns - 1; y > 1 && y > ns - 8; y--) { const b = world[idx(x, y, z)]; if (b && b !== T.WATER && b !== T.LEAVES && !PLANT[b]) break; put(x, y, z, k === 'black' ? T.BLACKSTONE : T.COBBLE); } }
        if (ns < s) for (let x = cx - 1; x <= cx + 1; x++) { put(x, s, z - 1, 167); entMeta.set(keyOf(x, s, z - 1), {face: stairF(0, -1)}); }
        if (k === 'human' && j % 5 === 0) for (const sx of [-2, 2]) { const tt = solidTop(cx + sx, z); put(cx + sx, tt + 1, z, 162); put(cx + sx, tt + 2, z, T.TORCH); }
        s = ns; }
      out.push({k, cx, cz, gy, filled, mines}); }
    try { scanLights(); validateLights(); } catch (_) {}
    return out; }
  // ---- caves: every cavern, deep cave and worm cave joined into one network ----
  function linkCaves() { const t0 = performance.now(); sd = (gSeed ^ 0x3cafe) >>> 0 || 5;
    const nodes = []; const c54 = window.__c54 && window.__c54.list || [];
    for (const l of c54) nodes.push([l[3], l[4], l[5]]); for (const d of (window.__deepCaves || [])) nodes.push([Math.round(d[0]), Math.round(d[1]) + 2, Math.round(d[2])]);
    // worm caves and ravines: sample enclosed air
    for (let t = 0; t < 4000 && nodes.length < c54.length + 220; t++) { const x = 8 + (rnd() * (W - 16) | 0), z = 8 + (rnd() * (D - 16) | 0), y = 6 + (rnd() * 34 | 0);
      if (world[idx(x, y, z)] || !world[idx(x, y - 1, z)]) continue; const tp = g9cols ? g9cols[(x * D + z) * 2] : solidTop(x, z); if (y > tp - 6) continue;
      if (nodes.some(n => Math.abs(n[0] - x) + Math.abs(n[2] - z) < 24)) continue; nodes.push([x, y, z]); }
    const away = (x, z) => g9castles.every(c => Math.max(Math.abs(c[1] - x), Math.abs(c[2] - z)) > (SIZE[c[0]] || 15) + 14);
    const soft = b => b === T.STONE || b === T.DEEPSLATE || b === T.DIRT || b === T.GRAVEL || b === T.COALORE || b === T.IRONORE || b === T.COPPERORE || b === T.GOLDORE || b === T.REDORE || b === T.DIAMONDORE || b === T.SILVERORE || b === T.LAZORE || b === T.RUBYORE || b === T.DSCOBBLE || b === T.LAVA;
    const ball = (cx, cy, cz, r) => { for (let x = Math.floor(cx - r); x <= cx + r; x++) for (let z = Math.floor(cz - r); z <= cz + r; z++) for (let y = Math.max(3, Math.floor(cy - r)); y <= cy + r; y++) {
      if (x < 3 || z < 3 || x > W - 4 || z > D - 4 || y > H - 3) continue; const dx = x - cx, dy = y - cy, dz = z - cz; if (dx * dx + dy * dy * 1.3 + dz * dz > r * r) continue;
      const i = idx(x, y, z); if (!soft(world[i])) continue; if (world[idx(x, y + 1, z)] === T.WATER) continue; const tp = g9cols ? g9cols[(x * D + z) * 2] : H; if (y > tp - 3) continue; if (placedSet && placedSet.has(i)) continue; world[i] = T.AIR; } };
    // minimum spanning tree (Prim) over the nodes, then a winding tunnel along each edge
    const n = nodes.length, inT = new Uint8Array(n), best = new Float64Array(n).fill(1e18), par = new Int32Array(n).fill(-1); if (!n) return null; best[0] = 0; const edges = [];
    for (let it = 0; it < n; it++) { let u = -1; for (let i = 0; i < n; i++) if (!inT[i] && (u < 0 || best[i] < best[u])) u = i; inT[u] = 1; if (par[u] >= 0) edges.push([par[u], u]);
      for (let v = 0; v < n; v++) if (!inT[v]) { const a = nodes[u], b = nodes[v], d = Math.hypot(a[0] - b[0], (a[1] - b[1]) * 2, a[2] - b[2]); if (d < best[v]) { best[v] = d; par[v] = u; } } }
    let carved = 0, len = 0;
    for (const [i, j] of edges) { const a = nodes[i], b = nodes[j], L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), steps = Math.ceil(L / 0.9); len += L;
      const ph = rnd() * 6.283, amp = Math.min(10, L * 0.12);
      for (let s = 0; s <= steps; s++) { const f = s / steps, w = Math.sin(f * Math.PI) * amp; const px = -(b[2] - a[2]) / (L || 1), pz = (b[0] - a[0]) / (L || 1);
        const x = a[0] + (b[0] - a[0]) * f + px * w * Math.sin(ph + f * 5), z = a[2] + (b[2] - a[2]) * f + pz * w * Math.sin(ph + f * 5), y = a[1] + (b[1] - a[1]) * f + Math.sin(ph * 2 + f * 9) * 1.5;
        if (!away(x, z)) continue; ball(x, y, z, 1.7 + 0.4 * Math.sin(f * 17 + ph)); carved++; } }
    window.__caveNodes = nodes; return {nodes: n, edges: edges.length, len: Math.round(len), ms: Math.round(performance.now() - t0)}; }
  const ge = generate; generate = function () { const r = ge.apply(this, arguments);
    if (!ORE18 || W !== BIG || DIM.cur || genVer !== GEN9 || (typeof cityGen !== 'undefined' && cityGen)) return r;
    const was = c37busy; c37busy = true;
    try { const st = {}; const t = performance.now();
      try { st.caves = linkCaves(); } catch (e) { console.warn('c77 caves', e); }
      try { st.castles = castleWork(); } catch (e) { console.warn('c77 castles', e); }
      try { st.ores = orePass(); } catch (e) { console.warn('c77 ores', e); }
      try { st.border = border(); } catch (e) { console.warn('c77 border', e); }
      st.ms = Math.round(performance.now() - t); window.__c77 = st; console.log('[c77]', JSON.stringify(st)); } finally { c37busy = was; }
    return r; };
  window.__c77parts = {orePass, border, castleWork, linkCaves};
  // ---- Hell: 288 wide for the big world (1/3 of the Highlands), a bedrock wall at the edge, cobalt low down, nether gold all through ----
  const gh = genHell; genHell = function () {
    HELL_W = ORE18 ? 288 : 160;
    const ow = DIM.ow && DIM.ow.P; window.__hellAt = ORE18 && ow ? [Math.max(14, Math.min(HELL_W - 15, Math.round(ow.x / 3))), Math.max(14, Math.min(HELL_W - 15, Math.round(ow.z / 3)))] : null;
    const r = gh.apply(this, arguments); if (!ORE18) return r;
    sd = ((gSeed || 7) ^ 0xc0ba17) >>> 0 || 3; const hst = {cobalt: 0, gold: 0};
    const hv = (x, y, z, n, ore, hide) => { let p = 0; for (let k = 0; k < n; k++) { if (x > 1 && z > 1 && x < W - 2 && z < D - 2 && y > 1 && y < H - 2 && world[idx(x, y, z)] === T.HELLROCK && !(hide && airN(x, y, z))) { world[idx(x, y, z)] = ore; p++; }
      const q = rnd() * 6 | 0; if (q === 0) x++; else if (q === 1) x--; else if (q === 2) z++; else if (q === 3) z--; else if (q === 4) y++; else y--; } return p; };
    const cols = W * D / 1000;
    for (let v = 0; v < Math.round(cols * 1.6); v++) hst.cobalt += hv(2 + (rnd() * (W - 4) | 0), Math.round(tri(4, 12)), 2 + (rnd() * (D - 4) | 0), 1 + (rnd() * 3 | 0), T.COBALTORE, true);
    for (let v = 0; v < Math.round(cols * 0.4); v++) hst.cobalt += hv(2 + (rnd() * (W - 4) | 0), Math.round(4 + rnd() * 55), 2 + (rnd() * (D - 4) | 0), 1 + (rnd() * 2 | 0), T.COBALTORE, true);
    for (let v = 0; v < Math.round(cols * 10); v++) hst.gold += hv(2 + (rnd() * (W - 4) | 0), Math.round(5 + rnd() * 54), 2 + (rnd() * (D - 4) | 0), 3 + (rnd() * 6 | 0), T.GOLDORE, false);
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { if (x && z && x < W - 1 && z < D - 1) continue; for (let y = 0; y < H; y++) world[idx(x, y, z)] = T.HBEDROCK; }
    window.__c77hell = hst; return r; };
  // ---- debug / tests ----
  window.__c77hist = function () { const ids = {coal: T.COALORE, copper: T.COPPERORE, iron: T.IRONORE, silver: T.SILVERORE, gold: T.GOLDORE, lazurite: T.LAZORE, redstone: T.REDORE, diamond: T.DIAMONDORE, ruby: T.RUBYORE, cobalt: T.COBALTORE, bedrock: BR, deepslate: T.DEEPSLATE};
    const rev = {}; for (const k in ids) rev[ids[k]] = k; const h = {}; for (const k in ids) h[k] = new Array(H).fill(0); let exposedD = 0, totalD = 0;
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { const b0 = (x * H + y) * D; for (let z = 0; z < D; z++) { const k = rev[world[b0 + z]]; if (k) { h[k][y]++; if (k === 'diamond') { totalD++; if (x > 0 && z > 0 && x < W - 1 && z < D - 1 && y > 0 && y < H - 1 && airN(x, y, z)) exposedD++; } } } }
    return {W, H, hist: h, diamondsExposed: exposedD, diamonds: totalD}; };
})();
