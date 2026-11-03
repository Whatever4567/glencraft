/* ===================== GLX-C104 (v0.9.85): ores by depth (coal/iron/silver everywhere, lapis low, gold just above diamonds, diamonds by bedrock) + ore seams on cave walls; a new raw-silver icon ===================== */
(function c104() {
  const U = window.__c104 = {};
  let sd = 1; const rnd = () => (sd = (Math.imul(sd, 16807) >>> 0) % 2147483647) / 2147483647;
  const tri = (a, b) => a + (b - a) * (rnd() + rnd()) / 2;
  const inb = (x, y, z) => x > 0 && z > 0 && x < W - 1 && z < D - 1 && y > 0 && y < H - 1;
  const airN = (x, y, z) => !world[idx(x + 1, y, z)] || !world[idx(x - 1, y, z)] || !world[idx(x, y + 1, z)] || !world[idx(x, y - 1, z)] || !world[idx(x, y, z + 1)] || !world[idx(x, y, z - 1)];
  const host = b => b === T.STONE || b === T.DEEPSLATE;
  const top = (x, z) => g9cols ? g9cols[(x * D + z) * 2] : solidTop(x, z);
  const placed = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i);
  const isl = () => window.__c101 && __c101.isl;
  // keep the spawn island's buildings clean: no ore in its stonework above the sea floor
  // v1.0.35: only the buildings - the natural hill rock under grass / dirt / snow (3+ blocks down) gets ore like anywhere else
  const NAT = new Set([T.GRASS, T.DIRT, T.SNOW, T.HEATHER, T.STONE, T.GRAVEL, T.SAND, T.PEAT, T.COBBLE, T.DEEPSLATE].filter(v => v !== undefined));
  const islBlock = (x, y, z) => { const I = isl(); if (!(I && y >= SEA - 8 && Math.hypot(x - I.cx, z - I.cz) < I.R + 4)) return false;
    const tp = top(x, z); return !(y <= tp - 3 && NAT.has(world[idx(x, tp, z)])); };
  const MCY = Y => Math.round((Y + 64) * 0.3228);
  // [name, id, veins per 1000 columns, yLo, yHi, size lo, size hi, rule]  ('u' = even spread, else a triangle peaking in the middle)
  const ORES = () => [
    ['coal', T.COALORE, 60, 16, SEA + 34, 6, 14], ['coal-deep', T.COALORE, 30, 1, SEA, 5, 11, 'u'], ['coal-high', T.COALORE, 20, MCY(136), MCY(320), 5, 12, 'u'],
    ['copper', T.COPPERORE, 40, MCY(-16), MCY(112), 5, 11],
    ['iron', T.IRONORE, 60, 1, SEA + 4, 4, 10], ['iron-even', T.IRONORE, 20, 1, SEA + 10, 4, 9, 'u'], ['iron-deep', T.IRONORE, 30, 1, 22, 4, 9, 'u'], ['iron-mountain', T.IRONORE, 25, MCY(80), MCY(384), 4, 10],
    ['silver', T.SILVERORE, 24, 1, SEA + 6, 3, 7, 'u'],
    ['lazurite', T.LAZORE, 6, 2, 15, 3, 7, 'u'],
    ['gold', T.GOLDORE, 7, 1, 19, 3, 7, 'u'],
    ['redstone', T.REDORE, 12, MCY(-96), MCY(-32), 4, 9], ['redstone-even', T.REDORE, 2, 1, MCY(15), 4, 8, 'u'],
    ['diamond', T.DIAMONDORE, 7.5, 1, 13, 2, 6, 'hide'], ['ruby', T.RUBYORE, 48, MCY(-16), MCY(480), 1, 3, 'mtn']];
  U.ORES = ORES;
  function vein(x, y, z, n, ore, hide) { let put = 0;
    for (let k = 0; k < n; k++) { if (inb(x, y, z)) { const i = idx(x, y, z); if (host(world[i]) && !islBlock(x, y, z) && !(hide && airN(x, y, z) && rnd() < 0.5) && !placed(i)) { world[i] = ore; put++; } }
      const r = rnd() * 6 | 0; if (r === 0) x++; else if (r === 1) x--; else if (r === 2) z++; else if (r === 3) z--; else if (r === 4) y++; else y--; }
    return put; }
  const ORESET = () => new Set([T.COALORE, T.IRONORE, T.COPPERORE, T.GOLDORE, T.REDORE, T.DIAMONDORE, T.SILVERORE, T.LAZORE, T.RUBYORE, 179].filter(v => v !== undefined));
  function orePass() { const t0 = performance.now(); sd = (gSeed ^ 0x104a0e) >>> 0 || 11;
    const S = new Uint8Array(256); for (const b of ORESET()) S[b] = 1; let stripped = 0;
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { const b0 = (x * H + y) * D; for (let z = 0; z < D; z++) { const i = b0 + z; if (S[world[i]] && !placed(i)) { world[i] = y < 21 ? T.DEEPSLATE : T.STONE; stripped++; } } }
    const cols = W * D / 1000, hist = {}, want = {};
    for (const [name, id, per, lo, hi, s0, s1, rule] of ORES()) { if (id === undefined) continue; const n = Math.round(per * cols); let pl = 0, miss = 0;
      for (let v = 0; v < n; v++) { let x = 2 + (rnd() * (W - 4) | 0), z = 2 + (rnd() * (D - 4) | 0); let y = Math.round(rule === 'u' || rule === 'hide' ? lo + rnd() * (hi - lo) : tri(lo, hi));
        if (y < 1 || y > H - 3) continue;
        // the v0.9.72 fix: most of the map is sea, so re-pick the column until the vein starts in rock (not for diamonds)
        if (rule !== 'hide' && !host(world[idx(x, y, z)])) { let ok = false; for (let t = 0; t < 60; t++) { const xx = 2 + (rnd() * (W - 4) | 0), zz = 2 + (rnd() * (D - 4) | 0), tp = top(xx, zz);
            if (rule === 'mtn' && tp < SEA + 28) continue; const yh = Math.min(hi, tp - 3, H - 3), yl = Math.max(1, lo); if (yh < yl) continue;
            for (let q = 0; q < 4 && !ok; q++) { const yy = Math.round(rule === 'u' ? yl + rnd() * (yh - yl) : tri(yl, yh)); if (host(world[idx(xx, yy, zz)]) && !islBlock(xx, yy, zz)) { x = xx; y = yy; z = zz; ok = true; } } if (ok) break; } if (!ok) { miss++; continue; } }
        if (rule === 'mtn') { const tp = top(x, z); if (tp < SEA + 28 || y > tp - 2) continue; }
        pl += vein(x, y, z, Math.round(s0 + rnd() * (s1 - s0)), id, rule === 'hide'); }
      hist[name] = pl; want[name] = n; if (miss) want[name + '-miss'] = miss; }
    return {ms: Math.round(performance.now() - t0), stripped, placed: hist, veins: want}; }
  // ---- seams on cave walls: coal, iron and some silver where you can actually see them ----
  function pickOre(y) { const r = rnd(); if (y <= 12) return r < 0.42 ? T.IRONORE : r < 0.72 ? T.COALORE : T.SILVERORE; if (y <= SEA - 6) return r < 0.5 ? T.IRONORE : r < 0.85 ? T.COALORE : T.SILVERORE; return r < 0.38 ? T.IRONORE : r < 0.95 ? T.COALORE : T.SILVERORE; }
  const NB = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  function cavePass(p) { const t0 = performance.now(); sd = (gSeed ^ 0xca7e5) >>> 0 || 13; let seams = 0, put = 0;
    for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) { const yt = Math.min(top(x, z) - 4, H - 3);
      for (let y = 2; y <= yt; y++) { const i = idx(x, y, z); if (world[i] !== 0 || rnd() > p) continue;
        const [a, b, c] = NB[rnd() * 6 | 0], X = x + a, Y = y + b, Z = z + c; if (!inb(X, Y, Z) || !host(world[idx(X, Y, Z)]) || islBlock(X, Y, Z)) continue;
        const ore = pickOre(Y), n = 3 + (rnd() * 5 | 0); let px = X, py = Y, pz = Z;
        for (let k = 0; k < n; k++) { if (inb(px, py, pz)) { const j = idx(px, py, pz); if (host(world[j]) && !placed(j)) { world[j] = ore; put++; } }
          // creep along the wall: prefer rock that touches the cave
          for (let t = 0; t < 4; t++) { const [u, v, w] = NB[rnd() * 6 | 0], qx = px + u, qy = py + v, qz = pz + w; if (inb(qx, qy, qz) && host(world[idx(qx, qy, qz)]) && (t === 3 || airN(qx, qy, qz))) { px = qx; py = qy; pz = qz; break; } } }
        seams++; } }
    return {ms: Math.round(performance.now() - t0), seams, put}; }
  // exposed (cave-air-touching, underground) coal/iron per 16x16 chunk that has caves
  function caveStats() { const CW = Math.ceil(W / 16), CD = Math.ceil(D / 16), air = new Int32Array(CW * CD), co = new Int32Array(CW * CD), ir = new Int32Array(CW * CD), si = new Int32Array(CW * CD);
    for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) { const yt = Math.min(top(x, z) - 4, H - 2), c = (x >> 4) * CD + (z >> 4);
      for (let y = 1; y <= yt; y++) { const b = world[idx(x, y, z)]; if (b === 0) { air[c]++; continue; }
        if ((b === T.COALORE || b === T.IRONORE || b === T.SILVERORE) && airN(x, y, z)) (b === T.COALORE ? co : b === T.IRONORE ? ir : si)[c]++; } }
    let n = 0, C = 0, I = 0, Sv = 0; for (let c = 0; c < CW * CD; c++) if (air[c] >= 60) { n++; C += co[c]; I += ir[c]; Sv += si[c]; }
    return {caveChunks: n, coalPerChunk: +(C / (n || 1)).toFixed(1), ironPerChunk: +(I / (n || 1)).toFixed(1), silverPerChunk: +(Sv / (n || 1)).toFixed(1)}; }
  function depthHist() { const ids = {coal: T.COALORE, iron: T.IRONORE, silver: T.SILVERORE, lazurite: T.LAZORE, gold: T.GOLDORE, diamond: T.DIAMONDORE}, rev = {}, h = {}; for (const k in ids) { rev[ids[k]] = k; h[k] = {}; }
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { const b0 = (x * H + y) * D; for (let z = 0; z < D; z++) { const k = rev[world[b0 + z]]; if (k) { const band = y <= 10 ? '1-10' : y <= 20 ? '11-20' : y <= 30 ? '21-30' : y <= SEA ? '31-sea' : 'above'; h[k][band] = (h[k][band] || 0) + 1; } } }
    return h; }
  U.caveStats = caveStats; U.depthHist = depthHist; U.orePass = orePass; U.cavePass = cavePass; U.P = 0.024;
  const ge = generate; generate = function () { window.__c77 = null; const r = ge.apply(this, arguments);
    if (!window.__c77 || DIM.cur) return r;   // only the big Highlands worlds that got the c77 ore pass (new worlds only)
    const was = c37busy; c37busy = true;
    try { const st = {}; if (U.measure) st.before = caveStats();
      st.ores = orePass(); if (U.measure) st.mid = caveStats();
      st.caves = window.__g12 ? 'c131' : cavePass(U.P); if (U.measure) st.after = caveStats();
      U.st = st; console.log('[c104]', JSON.stringify(st)); } catch (e) { U.err = String(e && e.stack || e); console.warn('c104', e); } finally { c37busy = was; }
    return r; };
  // ---- raw silver: a little cluster of shiny droplets (pixel art), nothing like raw iron ----
  try { ICONS[IT.RAWSILVER] = drawIcon(g => { g.imageSmoothingEnabled = false;
    const N = 16, px = 4, drops = [[5, 10, 2.6], [10.5, 11, 2.3], [8, 5.6, 2.0], [12.2, 5.2, 1.4], [3.6, 4.6, 1.2]], m = new Uint8Array(N * N);
    const inDrop = (x, y) => { for (const [cx, cy, r] of drops) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= r * r) return [cx, cy, r];
        if (dy < 0 && dy > -r * 2.1) { const w = r * (1 + dy / (r * 2.1)); if (Math.abs(dx) <= w * 0.9) return [cx, cy, r]; } } return null; };
    const col = {1: '#2c323a', 2: '#7c8692', 3: '#aab4bf', 4: '#d9e1ea', 5: '#ffffff'};
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const d = inDrop(x + 0.5, y + 0.5); if (!d) continue; const [cx, cy, r] = d, u = (x + 0.5 - cx) / r, v = (y + 0.5 - cy) / r;
      const sh = -u * 0.6 - v * 0.8; m[y * N + x] = sh > 0.55 ? 5 : sh > 0.1 ? 4 : sh > -0.45 ? 3 : 2; }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!m[y * N + x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const X = x + a, Y = y + b; return X >= 0 && Y >= 0 && X < N && Y < N && m[Y * N + X] > 1; })) m[y * N + x] = 1;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const k = m[y * N + x]; if (!k) continue; g.fillStyle = col[k]; g.fillRect(-32 + x * px, -32 + y * px, px, px); } }); } catch (e) { console.warn('c104 icon', e); }
})();
/* ===================== GLX-C104b (v0.9.85): night spiders - blocky, eight legs, red eyes; hunt you at night on the surface and in dark caves, climb walls, leap; drop string ===================== */
(function c104spider() {
  const U = window.__c104s = {spawned: 0, bites: 0, leaps: 0, killed: 0};
  // ---- string ----
  const SID = 400; if (!NAMES[SID]) {
    IT.STRING = SID; NAMES[SID] = 'String';
    ICONS[SID] = drawIcon(g => { g.strokeStyle = '#3b3b3b'; g.lineWidth = 5; const path = () => { g.beginPath(); g.moveTo(-20, 18); g.bezierCurveTo(-30, -6, 2, -4, -4, -18); g.bezierCurveTo(-8, -30, 22, -24, 14, -6); g.bezierCurveTo(8, 8, 30, 10, 22, 22); g.stroke(); };
      path(); g.strokeStyle = '#f1efe8'; g.lineWidth = 2.6; path(); });
    if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(SID);
    RECIPES.push(rc('Wool', '4 String', T.WOOL, 1, [[SID, 4]])); }
  // ---- the model ----
  function makeNightSpider() {
    const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
    const body = new THREE.MeshLambertMaterial({color: 0x2b2420}), dark = new THREE.MeshLambertMaterial({color: 0x17120f}), eye = new THREE.MeshBasicMaterial({color: 0xff1a10});
    const box = (w, h, d, m, x, y, z, p) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); (p || rig).add(b); return b; };
    box(0.42, 0.34, 0.42, body, 0, 0.42, 0.12);                     // thorax
    const head = new THREE.Group(); head.position.set(0, 0.46, 0.42); rig.add(head);
    box(0.5, 0.42, 0.4, dark, 0, 0, 0.12, head);                     // head
    box(0.1, 0.08, 0.02, eye, -0.11, 0.06, 0.33, head); box(0.1, 0.08, 0.02, eye, 0.11, 0.06, 0.33, head);
    for (const [x, y] of [[-0.19, 0.12], [0.19, 0.12], [-0.05, 0.15], [0.05, 0.15], [-0.17, -0.02], [0.17, -0.02]]) box(0.05, 0.05, 0.02, eye, x, y, 0.33, head);
    box(0.06, 0.12, 0.06, dark, -0.07, -0.2, 0.3, head); box(0.06, 0.12, 0.06, dark, 0.07, -0.2, 0.3, head);   // fangs
    const abd = box(0.78, 0.6, 0.86, body, 0, 0.55, -0.48); box(0.3, 0.04, 0.4, new THREE.MeshLambertMaterial({color: 0x5a1a12}), 0, 0.31, 0, abd);
    const legs = [], Z = [0.3, 0.17, 0.04, -0.09], SPREAD = [0.75, 0.25, -0.2, -0.65];
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(s * 0.2, 0.44, Z[k]); rig.add(hip);
      const yaw = new THREE.Group(); yaw.rotation.y = s > 0 ? -SPREAD[k] : Math.PI + SPREAD[k]; hip.add(yaw);   // leg plane points along local +x
      const up = new THREE.Group(); up.rotation.z = 0.7; yaw.add(up); box(0.62, 0.08, 0.08, body, 0.31, 0, 0, up);
      const kn = new THREE.Group(); kn.position.x = 0.62; kn.rotation.z = -1.95; up.add(kn); box(0.78, 0.07, 0.07, dark, 0.39, 0, 0, kn);
      legs.push({yaw, up, kn, s, k, y0: yaw.rotation.y, ph: ((k + (s > 0 ? 1 : 0)) % 2) * Math.PI}); }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return {g, rig, head, nsLegs: legs, legs: [], arms: [], mats: [body, dark], speed: 6.2, hp: 5, hitY: 0.45, hitR: 0.8, tall: 1, hostile: true};
  }
  const roomy = (x, y, z) => { if (solid(x, y + 2, z)) return false; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = 0; c <= 1; c++) if (solid(x + a, y + c, z + b)) return false; return true; };
  const near = (x, y, z, r, id) => { for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let c = -r; c <= r; c++) if (getB(x + a, y + b, z + c) === id) return true; return false; };
  U.spawnAt = (...q) => spawnAt(...q);
  function spawnAt(x, y, z, cave) { const m = makeNightSpider();
    const a = Object.assign(m, {kind: 'nspider', cave: !!cave, flee: 0, timer: 0, flash: 0, kbx: 0, kbz: 0, vy: 0, onGround: true, burning: 0, ang: Math.random() * 6.28, yawVis: 0, walk: 0, biteCd: 0, leapCd: 1, sndT: 2 + Math.random() * 4, aggro: 0, climb: false, climbK: 0});
    a.gs = 3; a.g.scale.setScalar(a.gs); a.hitR = 0.8 * a.gs * 0.9; a.hitY = 0.45 * a.gs; a.tall = 2;   // v0.9.91: giant (body ~2.5 blocks wide), squeezes through 2-high gaps
    a.yawVis = a.ang; a.g.position.set(x + 0.5, y, z + 0.5); a.g.rotation.y = a.ang; scene.add(a.g); mobs.push(a); U.spawned++; return a; }
  U.spawnAt = spawnAt;
  const all = () => mobs.filter(a => a.kind === 'nspider');
  let spT = 0;
  function trySpawn(dt) { spT -= dt; if (spT > 0) return; spT = 4;
    if (!started || paused || dead || DIM.cur || (MODE && MODE.name === 'creative')) return;
    const L = all(); const under = caveK > 0.45;
    if (false && !under && isNight && L.length + (typeof countKind === 'function' ? countKind('spider') : 0) < 1 && Math.random() < 0.55) {
      for (let t = 0; t < 12; t++) { const an = Math.random() * 6.283, r = 16 + Math.random() * 14, x = Math.floor(P.x + Math.sin(an) * r), z = Math.floor(P.z + Math.cos(an) * r);
        if (x < 3 || z < 3 || x > W - 4 || z > D - 4) continue; const y = solidTop(x, z) + 1; const b = getB(x, y - 1, z);
        if (y <= SEA || b === T.WATER || b === T.LAVA || getB(x, y, z) || getB(x, y + 1, z) || Math.abs(y - P.y) > 12 || !roomy(x, y, z) || near(x, y, z, 4, T.TORCH)) continue;
        spawnAt(x, y, z, false); break; } }
    else if (under && L.length + (typeof countKind === 'function' ? countKind('spider') : 0) < 1 && Math.random() < 0.35) {
      for (let t = 0; t < 20; t++) { const an = Math.random() * 6.283, r = 10 + Math.random() * 12, x = Math.floor(P.x + Math.sin(an) * r), z = Math.floor(P.z + Math.cos(an) * r), y = Math.floor(P.y) + ((Math.random() * 13) | 0) - 6;
        if (x < 3 || z < 3 || x > W - 4 || z > D - 4 || y < 2) continue;
        if (getB(x, y, z) || getB(x, y + 1, z) || !solid(x, y - 1, z) || y > solidTop(x, z) - 4 || !roomy(x, y, z) || near(x, y, z, 5, T.TORCH)) continue;
        spawnAt(x, y, z, true); break; } } }
  function step(a, dt) { const p = a.g.position; a.biteCd -= dt; a.leapCd -= dt; if (a.flash > 0) a.flash -= dt;
    const G = a.gs || 1, dP = Math.hypot(P.x - p.x, P.z - p.z);
    if (a.vic && !(a.vic.g && mobs.indexOf(a.vic) >= 0 && a.vic.hp > 0 && (a.vicT -= dt) > 0)) a.vic = null;
    // v1.0.0: hostile to every other mob nearby (still neutral to you unless you hit it)
    if (!a.vic && !(a.aggro > 0) && !a.slam && (a.preyT = (a.preyT || 0) - dt) <= 0) { a.preyT = 0.6; let best = null, bd = 14;
      for (const m of mobs) { if (m === a || !m.g || m.kind === 'nspider' || m.kind === 'spider' || m.kind === 'treeman' || m.kind === 'dragon' || m.boss || m.tamed || m.mounted || !(m.hp > 0) || m.grabbed) continue;
        const q = m.g.position, dd = Math.hypot(q.x - p.x, q.z - p.z); if (dd < bd && Math.abs(q.y - p.y) < 5) { bd = dd; best = m; } }
      if (best) { a.vic = best; a.vicT = 20; a.prey = true; } }
    const tg = a.vic ? a.vic.g.position : P, dx = tg.x - p.x, dz = tg.z - p.z, dy = tg.y - p.y, d = Math.hypot(dx, dz);
    if (dP > 56 || p.y < -4 || (!a.cave && !isNight && dP > 24 && !a.vic) || DIM.cur) { removeMob(a); const i = mobs.indexOf(a); if (i >= 0) mobs.splice(i, 1); return; }
    // v0.9.91: NEUTRAL - only goes for you after you hit it (until you get well away), or for a skeleton that shot it
    const hunt = !a.slam && (a.vic ? Math.abs(dy) < 10 : !dead && a.aggro > 0 && d < 34 && Math.abs(dy) < 10);
    a.aggro = Math.max(0, a.aggro - dt * (dP > 24 ? 3 : 1));
    let spd = 0;
    if (hunt) { let ang = Math.atan2(dx, dz); if (d > 3) { try { const pa = pathAngle(a, tg.x, tg.z); if (pa !== null) ang = pa; } catch (_) {} } a.ang = ang; spd = d > 0.8 * G ? a.speed * (a.vic ? 1.15 : 1) : 0;
      if (a.onGround && a.leapCd <= 0 && d > 2 * G * 0.6 && d < 4.8 * G * 0.6 && Math.abs(dy) < 2.5) { a.leapCd = 2.2 + Math.random(); a.vy = 6.2; a.onGround = false; a.kbx = dx / d * 7.5; a.kbz = dz / d * 7.5; sfx3d('hiss', p, 14); U.leaps++; }
      if (a.vic && d < 1.0 * G && Math.abs(dy) < 2.5 && a.vic.kind === 'skeleton' && window.__c110) { __c110.grab(a, a.vic); spd = 0; }
      else if (a.vic && d < 0.95 * G && Math.abs(dy) < 2.5) { spd = 0; if (a.biteCd <= 0) { a.biteCd = 0.8; a.fang = 0.35; try { damageMob(a.vic, 3, false); const v = a.vic; if (v.kbx !== undefined) { v.kbx += dx / (d || 1) * 4; v.kbz += dz / (d || 1) * 4; } } catch (_) {} try { sfx3d('hiss', p, 16); } catch (_) {} U.preyBites = (U.preyBites || 0) + 1; } }
      else if (!a.vic && d < 1.0 * G && Math.abs(dy) < 1.5 * G * 0.6 && a.biteCd <= 0) { a.biteCd = 1.0; hurt(2, 'A spider got you.'); knockPlayer(dx / (d || 1), dz / (d || 1), 3, 2); U.bites++; } }
    else { a.timer -= dt; if (a.timer <= 0) { a.timer = 1 + Math.random() * 2.5; a.moving = Math.random() < 0.6; a.ang += (Math.random() - .5) * 2.5; } spd = a.moving ? 2.4 : 0; }
    a.yawVis = turnToward(a.yawVis, a.ang, dt * 9); a.g.rotation.y = a.yawVis;
    let r = true; if (spd) { const hd = a.yawVis, mx = Math.sin(hd) * spd * dt, mz = Math.cos(hd) * spd * dt;
      const mv1 = (x, z) => { const og = a.onGround; a.onGround = false; let q = moveMob(a, x, z); a.onGround = og;
        if (q === 'step' && og) { const y0 = p.y; p.y = Math.floor(p.y + 0.05) + 1; a.vy = 0; q = moveMob(a, x, z); if (q !== true) p.y = y0; else a.stepped = (a.stepped || 0) + 1; }
        return q === true; };
      r = mv1(mx, mz) || (Math.abs(mx) > Math.abs(mz) ? (mv1(mx, 0) || mv1(0, mz)) : (mv1(0, mz) || mv1(mx, 0)));
      if (!r && !hunt && !(a.blockCd > 0)) { a.ang += (Math.random() < .5 ? 1 : -1) * Math.PI * (0.5 + Math.random() * 0.4); a.timer = 1.5; a.blockCd = 1.0; }
      // stuck for a moment: scuttle sideways, then hop
      const mvd = Math.hypot(p.x - (a.lx || 0), p.z - (a.lz || 0)); a.lx = p.x; a.lz = p.z; a.stuck = mvd < spd * dt * 0.2 ? (a.stuck || 0) + dt : 0;
      if (a.stuck > 0.5 && !a.climb) { a.stuck = 0; a.sideT = 0.8; a.sideS = Math.random() < .5 ? 1 : -1; if (a.onGround && Math.random() < 0.5) { a.vy = 6; a.onGround = false; } }
      if (a.sideT > 0) { a.sideT -= dt; const sa = a.yawVis + a.sideS * 1.4; mv1(Math.sin(sa) * spd * dt, Math.cos(sa) * spd * dt); } }
    if (a.blockCd > 0) a.blockCd -= dt;
    // walls: walk straight up them
    const fx = Math.floor(p.x + Math.sin(a.yawVis) * 0.75 * G * 0.6), fz = Math.floor(p.z + Math.cos(a.yawVis) * 0.75 * G * 0.6);
    if (spd && solid(fx, Math.floor(p.y + 0.3), fz) && !solid(Math.floor(p.x), Math.floor(p.y + 1.1), Math.floor(p.z)) && (r === false || a.climb)) { a.climb = true; a.vy = 3.2; a.onGround = false; }
    else if (a.climb) { a.climb = false; if (!solid(fx, Math.floor(p.y + 0.1), fz)) { moveMob(a, Math.sin(a.yawVis) * 0.4, Math.cos(a.yawVis) * 0.4); a.vy = Math.max(a.vy, 2); } }
    mobPhysics(a, dt);
    a.sndT -= dt; if (a.sndT <= 0) { a.sndT = 4 + Math.random() * 6; if (dP < 20) sfx3d('hiss', p, 14); }
    // animation: alternating leg sets, body bob, climbing tilt, red flash when hit
    const mv = spd > 0 || !a.onGround; a.walk += dt * (mv ? (spd > 3 ? 20 : 11) : 0);
    a.climbK += ((a.climb ? 1 : 0) - a.climbK) * Math.min(1, dt * 10); a.rig.rotation.x = -a.climbK * 1.35;
    if (a.sy === undefined || Math.abs(a.sy - p.y) > 2.5) a.sy = p.y; a.sy += (p.y - a.sy) * Math.min(1, dt * 9); a.rig.position.y = a.climbK * 0.35 + (a.sy - p.y) / G;
    a.tw = (a.tw || 0) - dt; if (a.tw < 0) { a.tw = 0.15 + Math.random() * 0.9; a.twL = Math.random() * 8 | 0; a.twA = (Math.random() - .5) * 0.5; }
    // v1.0.0: quick wave gait, front legs feeling the air, random twitches when still
    a.nsLegs.forEach((L, j) => { const ph = a.walk * 1.35 + L.k * 0.8 + (L.s > 0 ? Math.PI : 0), sw = mv ? Math.sin(ph) * 0.5 : 0, lift = mv ? Math.pow(Math.max(0, Math.cos(ph)), 2) * 0.55 : 0;
      const feel = L.k === 0 ? 0.35 + Math.sin(a.walk * 0.7 + L.s) * 0.25 : 0, twc = !mv && a.twL === j ? a.twA : 0;
      L.yaw.rotation.y = L.y0 + sw * L.s + twc * L.s; L.up.rotation.z = 0.7 + lift + feel + (a.onGround ? 0 : 0.3) + Math.abs(twc); L.kn.rotation.z = -1.95 - lift * 0.8 + feel * 0.6; });
    if (a.fang > 0) a.fang -= dt; if (a.fangs) { const o = (a.fang > 0 ? 0.6 : 0.12 + Math.sin(performance.now() / 90) * 0.1); a.fangs.forEach((f, i) => f.rotation.z = (i ? -1 : 1) * o); }
    a.head.rotation.x = (hunt && d < 3 * G) || a.slam ? -0.25 : 0;
    const f = a.flash > 0 ? 1 : 0; for (const m of a.mats) if (m.emissive) m.emissive.setRGB(0.6 * f, 0, 0); }
  const um = updateMobs; updateMobs = function (dt) { const sp = []; for (let i = mobs.length - 1; i >= 0; i--) if (mobs[i].kind === 'nspider') { sp.push(mobs[i]); mobs.splice(i, 1); }
    try { return um.apply(this, arguments); } finally { for (const a of sp) mobs.push(a); if (!paused) { for (const a of sp) { try { step(a, dt); } catch (e) { if (!U.err) U.err = String(e && e.stack || e); } } try { trySpawn(dt); } catch (e) { if (!U.err) U.err = String(e && e.stack || e); } } } };
  const dmO = damageMob; damageMob = function (a, dmg, byPlayer) { if (a && a.kind === 'nspider' && byPlayer) { a.aggro = 20; a.vic = null; } return dmO.apply(this, arguments); };
  const km = killMob; killMob = function (a) { if (a && a.kind === 'nspider') { const p = a.g.position; burst(p.x, p.y + 0.4, p.z, 0x2a1f1a, 14); const n = Math.random() < 0.5 ? 2 : 1; dropItem(SID, n, p.x, p.y + 0.4, p.z, (Math.random() - .5) * 2.5, 3.5, (Math.random() - .5) * 2.5, 0.4);
      U.killed++; removeMob(a); const i = mobs.indexOf(a); if (i >= 0) mobs.splice(i, 1); return; } return km.apply(this, arguments); };
  // new world / load: clear any left over
  const ew = enterWorld; enterWorld = function () { for (let i = mobs.length - 1; i >= 0; i--) if (mobs[i].kind === 'nspider') { try { removeMob(mobs[i]); } catch (_) {} mobs.splice(i, 1); } return ew.apply(this, arguments); };
})();
/* ===================== GLX-C104c (v0.9.85): nights you can see in - moonlit blue, but the land, mobs and you stay clearly lit (all graphics presets) ===================== */
(function c104night() {
  const LIFT = new THREE.Color(0x3a4c6c), MOONC = new THREE.Color(0xb4c8ff);
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments);
    try { if (DIM.cur || window.__uw) return r; const cb = getB(Math.floor(camera.position.x), Math.floor(camera.position.y), Math.floor(camera.position.z)); if (cb === T.LAVA) return r;
      const wd = weather.dark || 0, cl = typeof caveL === 'number' ? caveL : 0, nk = 1 - daylight;
      // ambient floor ~65% of day out in the open; caves still dim (about a quarter), never pitch black
      const floor = 0.54 * (1 - wd * 0.3) * (1 - cl * 0.62);
      if (hemi.intensity < floor) hemi.intensity = floor;
      const sy = Math.sin(dayClock / CYCLE * Math.PI * 2);
      if (sy <= -0.05) { sunL.color.copy(MOONC); const mf = 0.34 * (1 - wd * 0.6) * (1 - Math.min(1, cl * 1.6)); if (sunL.intensity < mf) sunL.intensity = mf; }
      // fog/horizon: a lighter moonlit blue instead of near-black
      if (nk > 0.01 && cl < 0.95) { const k = nk * (1 - cl); const f = scene.fog.color; const lum = f.r + f.g + f.b, ll = LIFT.r + LIFT.g + LIFT.b; if (lum < ll) { f.lerp(LIFT, k * 0.85); scene.background.copy(f); } }
      // Photo-real: keep only a gentle cool grade at night, no heavy vignette/desaturation
      if (window.__c81 && typeof __c81.night === 'number') __c81.night = Math.min(__c81.night, 0.25);
      window.__c104n = {hemi: +hemi.intensity.toFixed(2), sun: +sunL.intensity.toFixed(2), nk: +nk.toFixed(2)};
    } catch (e) { if (!window.__c104ne) window.__c104ne = String(e); }
    return r; };
})();

/* ===================== GLX-C104d (v0.9.85): painted sky - CC0 sky textures (Screaming Brain Studios) as a drifting cloud layer, crossfading day -> sunset -> night -> dawn ===================== */
(function c104sky() {
  const S = window.__c104sky = {loaded: 0};
  const L = new THREE.TextureLoader(), mk = n => L.load('sky/' + n + '.webp', t => { S.loaded++; }, undefined, () => { S.err = n; });
  const tx = [mk('day'), mk('dusk'), mk('night')];
  for (const t of tx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; }
  Object.assign(skyUniforms, {tD: {value: tx[0]}, tS: {value: tx[1]}, tN: {value: tx[2]}, wts: {value: new THREE.Vector3(1, 0, 0)}, drift: {value: new THREE.Vector2(0, 0)}, texK: {value: 0}, nb: {value: 1.0}});
  const old = skyDome.material;
  skyDome.material = new THREE.ShaderMaterial({uniforms: skyUniforms, side: THREE.BackSide, depthWrite: false, fog: false, vertexShader: old.vertexShader,
    fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunK, dark, texK, nb; uniform sampler2D tD, tS, tN; uniform vec3 wts; uniform vec2 drift; varying vec3 vDir;
    void main(){ vec3 d = normalize(vDir); float h = clamp(d.y, -0.2, 1.0);
      vec3 c = mix(hor, top, pow(max(h, 0.0), 0.55));
      c = mix(c, hor * 0.55, clamp(-h * 4.0, 0.0, 1.0));
      if (texK > 0.0 && h > 0.0) {
        vec2 uv = d.xz / (h + 0.18) * 0.45 + drift;              // a flat cloud layer seen in perspective
        vec3 t = texture2D(tD, uv).rgb * wts.x + texture2D(tS, uv).rgb * wts.y + texture2D(tN, uv).rgb * wts.z * nb;
        float k = smoothstep(0.02, 0.32, h) * texK;               // melts into the horizon / fog colour
        c = mix(c, t, k); }
      float s = max(dot(d, normalize(sunDir)), 0.0);
      c += sunCol * (pow(s, 600.0) * 2.5 + pow(s, 42.0) * 0.55 + pow(s, 6.0) * 0.18) * sunK;
      gl_FragColor = vec4(c * (1.0 - dark), 1.0); }`});
  try { old.dispose(); } catch (_) {}
  const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments);
    try { const sy = Math.sin(dayClock / CYCLE * Math.PI * 2) + 0.2;   // same sun height the base cycle uses
      const day = ss(0.12, 0.45, sy), night = ss(0.02, -0.22, sy), dusk = Math.max(0, 1 - day - night);
      skyUniforms.wts.value.set(day, dusk, night);
      const wd = weather.dark || 0;
      skyUniforms.texK.value = DIM.cur || S.loaded < 3 ? 0 : 0.92 * (1 - wd * 0.75);
      skyUniforms.nb.value = 1.25;   // moonlit clouds, not a black void
      if (dt > 0 && dt < 1) { skyUniforms.drift.value.x += dt * 0.0035; skyUniforms.drift.value.y += dt * 0.0012; }
    } catch (e) { if (!S.e) S.e = String(e); }
    return r; };
})();
