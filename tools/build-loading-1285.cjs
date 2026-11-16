#!/usr/bin/env node
'use strict';
/* Fold-in later: do NOT bump GAME_VERSION, version.json, PATCH_NOTES, or CREDITS. */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function must(cond, msg) { if (!cond) { console.error('FAIL:', msg); process.exit(1); } }
function replaceOnce(s, a, b, label) {
  const n = s.split(a).length - 1;
  must(n === 1, label + ': expected 1 match, got ' + n);
  return s.split(a).join(b);
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
must(html.includes("const GAME_VERSION = '1.2.84';"), 'must stay on 1.2.84 (no version bump)');
must(!html.includes("const GAME_VERSION = '1.2.85';"), 'must not bump to 1.2.85');

const src = fs.readFileSync(path.join(root, 'tools/content-source/loading-1285.js'), 'utf8');
must(src.includes('GLX-LOAD1285'), 'source marker');
must(src.includes('__glenLoad'), 'source API');

/* 1) Cooperative GEN9 generate: lattice, columns, ores and features all
      yield every ~200ms and resume from a phase stash. Innermost registers
      as __glenLoad._gen9 and sets genDone so wrapper post-work can be pumped
      separately without re-running terrain. */
const gen9Old = `function generate() {
  if (!gSeed) gSeed = window.__forceSeed || (Math.random() * 2 ** 31) | 0;
  G9P = g9perm(gSeed); genVer = GEN9; NSEED = gSeed;
  const rnd = g9rng(gSeed ^ 0x9e3779b9), hash = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ gSeed; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  world.fill(T.AIR);
  g9cols = new Int16Array(W * D * 2);
  // cavern density on a coarse 4x4x4 lattice, trilinearly interpolated (64x fewer noise calls)
  const SX = Math.ceil(W / 4) + 1, SY = Math.ceil(H / 4) + 1, SZ = Math.ceil(D / 4) + 1, cav = new Float32Array(SX * SY * SZ), tun = new Float32Array(SX * SY * SZ);
  for (let i = 0; i < SX; i++) for (let j = 0; j < SY; j++) for (let k = 0; k < SZ; k++) {
    const x = i * 4, y = j * 4, z = k * 4, o = (i * SY + j) * SZ + k;
    cav[o] = g9n3(x / 38, y / 16, z / 38) + 0.5 * g9n3(x / 17, y / 9, z / 17);
    tun[o] = Math.abs(g9n3(x / 26 + 100, y / 15, z / 26 - 50));
  }
  const tri = (A, x, y, z) => {
    const fx = x / 4, fy = y / 4, fz = z / 4, i = Math.floor(fx), j = Math.floor(fy), k = Math.floor(fz), u = fx - i, v = fy - j, w = fz - k;
    const at = (a, b, c) => A[((i + a) * SY + (j + b)) * SZ + (k + c)];
    const L = (a, b, t) => a + (b - a) * t;
    return L(L(L(at(0, 0, 0), at(1, 0, 0), u), L(at(0, 1, 0), at(1, 1, 0), u), v), L(L(at(0, 0, 1), at(1, 0, 1), u), L(at(0, 1, 1), at(1, 1, 1), u), v), w);
  };
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    const c = g9height(x, z), h = c.h;
    const heath = g9fbm(x / 40 + 7, z / 40 - 3, 2), bog = g9fbm(x / 33 - 21, z / 33 + 9, 2);
    let top = T.GRASS, sub = T.DIRT, kind = 0;   // kind 0 meadow, 1 moor, 2 bog, 3 mountain rock, 4 shore, 5 loch bed
    const steep = Math.abs(g9height(x + 1, z).h - h) + Math.abs(g9height(x, z + 1).h - h) >= 4;
    if (h <= SEA) { top = hash(x, 1, z) < 0.5 ? T.SAND : T.DIRT; sub = T.SAND; kind = 5; }
    else if ((h <= SEA + 1 && c.glen > 0.4) || (c.sand && h <= SEA + 4)) { top = T.SAND; sub = T.SAND; kind = 4; }
    else if (h >= SEA + 30 || (steep && h >= SEA + 14)) { top = T.STONE; sub = T.STONE; kind = 3; }
    else if ((c.glen > 0.6 && bog > 0.18) || (c.mar && bog > -0.03)) { top = hash(x, 2, z) < 0.6 ? T.PEAT : T.MUD; kind = 2; }
    else if (heath > 0.08 && h > SEA + 5) { top = window.__trees2 ? T.GRASS : T.HEATHER; kind = 1; }   // v0.9.65: moor heather grows in clumps (c80), not as a carpet
    g9cols[(x * D + z) * 2] = h; g9cols[(x * D + z) * 2 + 1] = kind;
    const col = x * H * D + z;
    for (let y = 0; y < h; y++) {
      let b = y === h - 1 ? top : y >= h - 4 ? sub : (y < 14 ? T.DEEPSLATE : T.STONE);
      if (y === 0) b = T.DEEPSLATE;
      world[col + y * D] = b;
    }
    for (let y = h; y <= SEA; y++) world[col + y * D] = T.WATER;
    // caverns + tunnels: open halls well below the surface, kept under lochs/sea by a thick roof
    const roof = h - (h <= SEA + 1 ? 9 : 6);
    for (let y = 3; y < roof; y++) {
      const depthK = y < 20 ? 0.0 : (y - 20) / 60;
      const d = tri(cav, x, y, z), t = tri(tun, x, y, z);
      if (!window.__g12 && (d > 0.36 + depthK * 0.35 || (t < 0.045 && y > 8))) world[col + y * D] = y <= 6 ? T.LAVA : T.AIR;
    }
  }
  // ores: veins by depth (rarity per 1000 columns)
  const vein = (ore, n, y0, y1, r) => {
    for (let i = 0; i < n; i++) {
      const cx = Math.floor(rnd() * W), cz = Math.floor(rnd() * D), cy = y0 + Math.floor(rnd() * (y1 - y0));
      const len = 3 + Math.floor(rnd() * (r * 3));
      let x = cx, y = cy, z = cz;
      for (let k = 0; k < len; k++) {
        const b = getB(x, y, z); if (b === T.STONE || b === T.DEEPSLATE) world[idx(x, y, z)] = ore;
        x += Math.floor(rnd() * 3) - 1; y += Math.floor(rnd() * 3) - 1; z += Math.floor(rnd() * 3) - 1;
      }
    }
  };
  const A = W * D / 1000;
  vein(T.COALORE, Math.round(A * 32), 14, H - 6, 3); vein(T.COPPERORE, Math.round(A * 16), 18, SEA + 10, 2);
  vein(T.IRONORE, Math.round(A * 20), 6, SEA + 4, 2); vein(T.GOLDORE, Math.round(A * 6), 3, 24, 2);
  vein(T.REDORE, Math.round(A * 6), 2, 18, 2); vein(T.DIAMONDORE, Math.round(A * 9), 2, 16, 1.4);   // GLX-C1: ~MC rate (was A*3)
  // underground lochs: some cavern floors flood (only at depth)
  for (let n = 0; n < (window.__g12 ? 0 : Math.round(A * 0.6)); n++) {
    const x0 = Math.floor(rnd() * W), z0 = Math.floor(rnd() * D);
    for (let y = 8; y < 26; y++) if (getB(x0, y, z0) === T.AIR && solid(x0, y - 1, z0)) {
      for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) { const x = x0 + dx, z = z0 + dz; if (getB(x, y, z) === T.AIR && solid(x, y - 1, z) && dx * dx + dz * dz < 36) world[idx(x, y, z)] = T.WATER; }
      break;
    }
  }
  gGenFeatures(rnd, hash);
  dirtyAll = true;
}`;
const gen9New = `function generate() {
  const __L = window.__glenLoad;
  if (__L && __L.genDone) return;
  if (__L) __L._gen9 = __glenGen9 || generate;
  let rnd, hash, cav, tun, tri;
  const st = (__L && __L.held && __L._g9) || null;
  const phase = st && st.phase;
  const SX = Math.ceil(W / 4) + 1, SY = Math.ceil(H / 4) + 1, SZ = Math.ceil(D / 4) + 1;
  if (phase === 'cols' || phase === 'ores' || phase === 'feat') {
    rnd = st.rnd; hash = st.hash; cav = st.cav; tun = st.tun; tri = st.tri;
  } else {
    if (!phase) {
      if (!gSeed) gSeed = window.__forceSeed || (Math.random() * 2 ** 31) | 0;
      G9P = g9perm(gSeed); genVer = GEN9; NSEED = gSeed;
      rnd = g9rng(gSeed ^ 0x9e3779b9); hash = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ gSeed; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
      world.fill(T.AIR);
      g9cols = new Int16Array(W * D * 2);
      cav = new Float32Array(SX * SY * SZ); tun = new Float32Array(SX * SY * SZ);
    } else {
      rnd = st.rnd; hash = st.hash; cav = st.cav; tun = st.tun;
    }
    let __tLat = performance.now();
    for (let i = (st && st.latI) || 0; i < SX; i++) {
      for (let j = 0; j < SY; j++) for (let k = 0; k < SZ; k++) {
        const x = i * 4, y = j * 4, z = k * 4, o = (i * SY + j) * SZ + k;
        cav[o] = g9n3(x / 38, y / 16, z / 38) + 0.5 * g9n3(x / 17, y / 9, z / 17);
        tun[o] = Math.abs(g9n3(x / 26 + 100, y / 15, z / 26 - 50));
      }
      if (__L && __L.held && (performance.now() - __tLat > 200)) {
        __L._g9 = {phase: 'lat', rnd: rnd, hash: hash, cav: cav, tun: tun, latI: i + 1};
        try { __L.touch(1 + 5 * (i + 1) / SX, 'Preparing the ground… ' + (i + 1) + '/' + SX, 70); } catch (_) {}
        throw __L.YIELD;
      }
    }
    tri = (A, x, y, z) => {
      const fx = x / 4, fy = y / 4, fz = z / 4, i = Math.floor(fx), j = Math.floor(fy), k = Math.floor(fz), u = fx - i, v = fy - j, w = fz - k;
      const at = (a, b, c) => A[((i + a) * SY + (j + b)) * SZ + (k + c)];
      const L = (a, b, t) => a + (b - a) * t;
      return L(L(L(at(0, 0, 0), at(1, 0, 0), u), L(at(0, 1, 0), at(1, 1, 0), u), v), L(L(at(0, 0, 1), at(1, 0, 1), u), L(at(0, 1, 1), at(1, 1, 1), u), v), w);
    };
    if (__L && __L.held) {
      __L._g9 = {phase: 'cols', rnd: rnd, hash: hash, cav: cav, tun: tun, tri: tri};
      __L.genX = 0;
      try { __L.touch(6, 'Raising the mountains… 0/' + W, 70); } catch (_) {}
      throw __L.YIELD;
    }
  }
  if (phase !== 'ores' && phase !== 'feat') {
    const __x0 = (__L && __L.held && __L.genX) || 0;
    let __tSlice = performance.now();
    for (let x = __x0; x < W; x++) {
      for (let z = 0; z < D; z++) {
      const c = g9height(x, z), h = c.h;
      const heath = g9fbm(x / 40 + 7, z / 40 - 3, 2), bog = g9fbm(x / 33 - 21, z / 33 + 9, 2);
      let top = T.GRASS, sub = T.DIRT, kind = 0;   // kind 0 meadow, 1 moor, 2 bog, 3 mountain rock, 4 shore, 5 loch bed
      const steep = Math.abs(g9height(x + 1, z).h - h) + Math.abs(g9height(x, z + 1).h - h) >= 4;
      if (h <= SEA) { top = hash(x, 1, z) < 0.5 ? T.SAND : T.DIRT; sub = T.SAND; kind = 5; }
      else if ((h <= SEA + 1 && c.glen > 0.4) || (c.sand && h <= SEA + 4)) { top = T.SAND; sub = T.SAND; kind = 4; }
      else if (h >= SEA + 30 || (steep && h >= SEA + 14)) { top = T.STONE; sub = T.STONE; kind = 3; }
      else if ((c.glen > 0.6 && bog > 0.18) || (c.mar && bog > -0.03)) { top = hash(x, 2, z) < 0.6 ? T.PEAT : T.MUD; kind = 2; }
      else if (heath > 0.08 && h > SEA + 5) { top = window.__trees2 ? T.GRASS : T.HEATHER; kind = 1; }   // v0.9.65: moor heather grows in clumps (c80), not as a carpet
      g9cols[(x * D + z) * 2] = h; g9cols[(x * D + z) * 2 + 1] = kind;
      const col = x * H * D + z;
      for (let y = 0; y < h; y++) {
        let b = y === h - 1 ? top : y >= h - 4 ? sub : (y < 14 ? T.DEEPSLATE : T.STONE);
        if (y === 0) b = T.DEEPSLATE;
        world[col + y * D] = b;
      }
      for (let y = h; y <= SEA; y++) world[col + y * D] = T.WATER;
      // caverns + tunnels: open halls well below the surface, kept under lochs/sea by a thick roof
      const roof = h - (h <= SEA + 1 ? 9 : 6);
      for (let y = 3; y < roof; y++) {
        const depthK = y < 20 ? 0.0 : (y - 20) / 60;
        const d = tri(cav, x, y, z), t = tri(tun, x, y, z);
        if (!window.__g12 && (d > 0.36 + depthK * 0.35 || (t < 0.045 && y > 8))) world[col + y * D] = y <= 6 ? T.LAVA : T.AIR;
      }
      }
      if (__L && __L.held && (performance.now() - __tSlice > 200)) {
        __L.genX = x + 1;
        __L._g9 = {phase: 'cols', rnd: rnd, hash: hash, cav: cav, tun: tun, tri: tri};
        try { __L.touch(6 + 58 * (x + 1) / Math.max(1, W), 'Raising the mountains… ' + (x + 1) + '/' + W, 70); } catch (_) {}
        throw __L.YIELD;
      }
    }
    if (__L && __L.held) {
      __L.genX = 0;
      __L._g9 = {phase: 'ores', rnd: rnd, hash: hash, cav: cav, tun: tun, tri: tri};
      try { __L.touch(64, 'Laying the ores…', 90); } catch (_) {}
      throw __L.YIELD;
    }
  }
  if (phase !== 'feat') {
    const vein = (ore, n, y0, y1, r) => {
      for (let i = 0; i < n; i++) {
        const cx = Math.floor(rnd() * W), cz = Math.floor(rnd() * D), cy = y0 + Math.floor(rnd() * (y1 - y0));
        const len = 3 + Math.floor(rnd() * (r * 3));
        let x = cx, y = cy, z = cz;
        for (let k = 0; k < len; k++) {
          const b = getB(x, y, z); if (b === T.STONE || b === T.DEEPSLATE) world[idx(x, y, z)] = ore;
          x += Math.floor(rnd() * 3) - 1; y += Math.floor(rnd() * 3) - 1; z += Math.floor(rnd() * 3) - 1;
        }
      }
    };
    const A = W * D / 1000;
    vein(T.COALORE, Math.round(A * 32), 14, H - 6, 3); vein(T.COPPERORE, Math.round(A * 16), 18, SEA + 10, 2);
    vein(T.IRONORE, Math.round(A * 20), 6, SEA + 4, 2); vein(T.GOLDORE, Math.round(A * 6), 3, 24, 2);
    vein(T.REDORE, Math.round(A * 6), 2, 18, 2); vein(T.DIAMONDORE, Math.round(A * 9), 2, 16, 1.4);   // GLX-C1: ~MC rate (was A*3)
    // underground lochs: some cavern floors flood (only at depth)
    for (let n = 0; n < (window.__g12 ? 0 : Math.round(A * 0.6)); n++) {
      const x0 = Math.floor(rnd() * W), z0 = Math.floor(rnd() * D);
      for (let y = 8; y < 26; y++) if (getB(x0, y, z0) === T.AIR && solid(x0, y - 1, z0)) {
        for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) { const x = x0 + dx, z = z0 + dz; if (getB(x, y, z) === T.AIR && solid(x, y - 1, z) && dx * dx + dz * dz < 36) world[idx(x, y, z)] = T.WATER; }
        break;
      }
    }
    if (__L && __L.held) {
      __L._g9 = {phase: 'feat', rnd: rnd, hash: hash, cav: cav, tun: tun, tri: tri};
      try { __L.touch(68, 'Planting the glens…', 90); } catch (_) {}
      throw __L.YIELD;
    }
  }
  gGenFeatures(rnd, hash);
  dirtyAll = true;
  if (__L) { __L.genDone = 1; __L._g9 = null; __L.genX = 0; try { __L.touch(72, 'Building the land around you…', 92); } catch (_) {} }
}
var __glenGen9 = generate;
`;
html = replaceOnce(html, gen9Old, gen9New, 'coop GEN9 generate');


/* 1b) Yield inside the gGenFeatures pine scan (864×864 columns). */
const featOld = `  // pine forests (dense patches) + lone Scots pines on the moor
  for (let x = 3; x < W - 3; x++) for (let z = 3; z < D - 3; z++) {`;
const featNew = `  // pine forests (dense patches) + lone Scots pines on the moor
  const __Lf = window.__glenLoad;
  let __tFeat = performance.now();
  for (let x = (__Lf && __Lf.held && __Lf._featX) || 3; x < W - 3; x++) {
    for (let z = 3; z < D - 3; z++) {`;
html = replaceOnce(html, featOld, featNew, 'gGenFeatures loop start');

const featEndOld = `    else if (k === 0 && f < -0.25 && r < 0.004) { const t = g9top(x, z); if (getB(x, t, z) === T.GRASS && getB(x, t + 1, z) === T.AIR) plantTree(x, z); }
  }
  // standing stones: rings of tall stones on flat meadow or moor`;
const featEndNew = `    else if (k === 0 && f < -0.25 && r < 0.004) { const t = g9top(x, z); if (getB(x, t, z) === T.GRASS && getB(x, t + 1, z) === T.AIR) plantTree(x, z); }
    }
    if (__Lf && __Lf.held && (performance.now() - __tFeat > 200)) {
      __Lf._featX = x + 1;
      try { __Lf.touch(68 + 4 * (x + 1) / Math.max(1, W), 'Planting the glens… ' + (x + 1) + '/' + W, 90); } catch (_) {}
      throw __Lf.YIELD;
    }
  }
  if (__Lf) __Lf._featX = 0;
  // standing stones: rings of tall stones on flat meadow or moor`;
html = replaceOnce(html, featEndOld, featEndNew, 'gGenFeatures loop end');

/* 1c) Wrapper post-stages: run once (cached on resume) and yield after each.
      Only the call expression is wrapped so surrounding if/try/assignment stay valid. */
function coopCall(expr, id, label, p) {
  return '(window.__glenLoad && __glenLoad.coop) ? __glenLoad.coop(' +
    JSON.stringify(id) + ', ' + JSON.stringify(label) + ', ' + p +
    ', function(){ return ' + expr + '; }) : ' + expr;
}
function wrapCall(html, aroundOld, aroundNew, tag) {
  return replaceOnce(html, aroundOld, aroundNew, tag);
}
html = replaceOnce(
  html,
  'const r = g.apply(this, arguments); diamondBoost(gSeed ^ 0x51ed);',
  'const r = g.apply(this, arguments); ' + coopCall('diamondBoost(gSeed ^ 0x51ed)', 'diamonds', 'Laying the ores…', 72) + ';',
  'coop diamonds'
);
html = replaceOnce(
  html,
  'if (genVer === GEN9 && !cityGen) g9PlaceCastles();',
  'if (genVer === GEN9 && !cityGen) ' + coopCall('g9PlaceCastles()', 'castles0', 'Raising the keeps…', 73) + ';',
  'coop g9PlaceCastles'
);
html = replaceOnce(
  html,
  'placeOreVeins(T.SILVERORE, Math.round(9 * W * D / 3136), 6, 34, 2, 5); placeOreVeins(T.SILVERORE, Math.round(5 * W * D / 3136), 30, 70, 1, 3);',
  coopCall('(placeOreVeins(T.SILVERORE, Math.round(9 * W * D / 3136), 6, 34, 2, 5), placeOreVeins(T.SILVERORE, Math.round(5 * W * D / 3136), 30, 70, 1, 3))', 'silver', 'Laying the ores…', 72.5) + ';',
  'coop silver veins'
);
html = replaceOnce(
  html,
  'g9Underground();',
  coopCall('g9Underground()', 'under', 'Carving the caves…', 74) + ';',
  'coop underground'
);
html = replaceOnce(
  html,
  'const r = ge.apply(this, arguments); try { fixTorches(); } catch (e) { console.warn(e); } return r;',
  'const r = ge.apply(this, arguments); try { ' + coopCall('fixTorches()', 'torches', 'Lighting the hearths…', 75) + '; } catch (e) { console.warn(e); } return r;',
  'coop fixTorches'
);
html = replaceOnce(
  html,
  'const s = c39Settle();',
  'const s = ' + coopCall('c39Settle()', 'settle', 'Settling the land…', 76) + ';',
  'coop settle'
);
html = replaceOnce(
  html,
  'window.__c41 = c41Castles();',
  'window.__c41 = ' + coopCall('c41Castles()', 'c41', 'Raising the keeps…', 77) + ';',
  'coop c41'
);
html = replaceOnce(
  html,
  'window.__hives = placeHives();',
  'window.__hives = ' + coopCall('placeHives()', 'hives', 'Planting the woods…', 79) + ';',
  'coop hives'
);
html = replaceOnce(
  html,
  'window.__c53 = finishCastles();',
  'window.__c53 = ' + coopCall('finishCastles()', 'c53', 'Raising the keeps…', 80) + ';',
  'coop finishCastles'
);
html = replaceOnce(
  html,
  'if (!window.__g12) window.__c54 = carveCaves();',
  'if (!window.__g12) window.__c54 = ' + coopCall('carveCaves()', 'c54', 'Carving the caves…', 82) + ';',
  'coop carveCaves'
);
html = replaceOnce(
  html,
  'if (!window.__g12) st.caves = linkCaves();',
  'if (!window.__g12) st.caves = ' + coopCall('linkCaves()', 'c77caves', 'Carving the caves…', 83) + ';',
  'coop linkCaves'
);
html = replaceOnce(
  html,
  'st.castles = castleWork();',
  'st.castles = ' + coopCall('castleWork()', 'c77castles', 'Raising the keeps…', 84) + ';',
  'coop castleWork'
);
html = replaceOnce(
  html,
  "try { st.ores = orePass(); } catch (e) { console.warn('c77 ores', e); }",
  'try { st.ores = ' + coopCall('orePass()', 'c77ores', 'Laying the ores…', 85) + "; } catch (e) { console.warn('c77 ores', e); }",
  'coop c77 ores'
);
html = replaceOnce(
  html,
  'window.__c80 = plant(gSeed ^ 0x7ee5);',
  'window.__c80 = ' + coopCall('plant(gSeed ^ 0x7ee5)', 'plant', 'Planting the woods…', 86) + ';',
  'coop plant'
);
html = replaceOnce(
  html,
  'st.ores = orePass(); if (U.measure) st.mid = caveStats();',
  'st.ores = ' + coopCall('orePass()', 'c104ores', 'Laying the ores…', 87) + '; if (U.measure) st.mid = caveStats();',
  'coop c104 ores'
);
html = replaceOnce(
  html,
  'placePools(7, null);',
  coopCall('placePools(7, null)', 'pools', 'Planting the glens…', 88) + ';',
  'coop pools'
);


/* 1e) c104 orePass strips the whole 864³ ore map in one go (~11s). Slice the
      x scan so the bar keeps moving; veins still run once after the strip. */
const c104Old = `  function orePass() { const t0 = performance.now(); sd = (gSeed ^ 0x104a0e) >>> 0 || 11;
    const S = new Uint8Array(1024); for (const b of ORESET()) S[b] = 1; let stripped = 0;
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { const b0 = (x * H + y) * D; for (let z = 0; z < D; z++) { const i = b0 + z; if (S[world[i]] && !placed(i)) { world[i] = y < 21 ? T.DEEPSLATE : T.STONE; stripped++; } } }`;
const c104New = `  function orePass() { const t0 = performance.now();
    const __Lo = window.__glenLoad;
    const __st = (__Lo && __Lo.held && __Lo._loop && __Lo._loop.c104) || {phase: 'strip', x: 0, stripped: 0, t0: t0};
    if (!__st.t0) __st.t0 = t0;
    const S = new Uint8Array(1024); for (const b of ORESET()) S[b] = 1; let stripped = __st.stripped || 0;
    if (__st.phase !== 'veins') {
      let __tO = performance.now();
      for (let x = __st.x || 0; x < W; x++) {
        for (let y = 0; y < H; y++) { const b0 = (x * H + y) * D; for (let z = 0; z < D; z++) { const i = b0 + z; if (S[world[i]] && !placed(i)) { world[i] = y < 21 ? T.DEEPSLATE : T.STONE; stripped++; } } }
        if (__Lo && __Lo.held && (performance.now() - __tO > 200)) {
          if (!__Lo._loop) __Lo._loop = {};
          __Lo._loop.c104 = {phase: 'strip', x: x + 1, stripped: stripped, t0: __st.t0};
          try { __Lo.touch(82 + 5 * (x + 1) / Math.max(1, W), 'Laying the ores… ' + (x + 1) + '/' + W, 92); } catch (_) {}
          throw __Lo.YIELD;
        }
      }
      if (__Lo && __Lo._loop) __Lo._loop.c104 = {phase: 'veins', stripped: stripped, t0: __st.t0};
    }
    sd = (gSeed ^ 0x104a0e) >>> 0 || 11;`;
html = replaceOnce(html, c104Old, c104New, 'c104 orePass strip');

/* 1f) Wrapper try/catch blocks swallow YIELD (console.warn('c104', e) and
      similar), which turns a 200ms slice into a multi-second freeze and
      skips the rest of that stage. Rethrow cooperative yields from catch (e)
      inside generate wrappers only — a file-wide rewrite would dirty other
      content sources (torso/hands) that later tests match verbatim. */
{
  const inj = ' if (window.__glenLoad && __glenLoad.isYield && __glenLoad.isYield(e)) throw e;';
  const startRe = /generate\s*=\s*function\s*\([^)]*\)\s*\{/g;
  const catchRe = /catch\s*\(\s*e\s*\)\s*\{/g;
  let nCatch = 0, nWrap = 0;
  const pieces = [];
  let last = 0;
  let m;
  while ((m = startRe.exec(html))) {
    nWrap++;
    const bodyStart = m.index + m[0].length;
    // Walk braces from the function's opening '{', skipping strings/comments.
    let i = bodyStart - 1, depth = 0, mode = 'code';
    for (; i < html.length; i++) {
      const c = html[i], nch = html[i + 1];
      if (mode === 'code') {
        if (c === '"' || c === "'" || c === '`') { mode = c; continue; }
        if (c === '/' && nch === '/') { mode = 'line'; i++; continue; }
        if (c === '/' && nch === '*') { mode = 'block'; i++; continue; }
        if (c === '{') depth++;
        else if (c === '}') {
          depth--;
          if (depth === 0) { i++; break; }
        }
      } else if (mode === 'line') {
        if (c === '\n') mode = 'code';
      } else if (mode === 'block') {
        if (c === '*' && nch === '/') { mode = 'code'; i++; }
      } else if (mode === '`' && c === '\\') { i++; }
      else if (c === '\\') { i++; }
      else if (c === mode) mode = 'code';
    }
    const fnEnd = i;
    pieces.push(html.slice(last, m.index));
    const head = html.slice(m.index, bodyStart);
    let body = html.slice(bodyStart, fnEnd);
    body = body.replace(catchRe, function (cm) {
      nCatch++;
      return cm + inj;
    });
    pieces.push(head, body);
    last = fnEnd;
  }
  pieces.push(html.slice(last));
  html = pieces.join('');
  must(nWrap > 40, 'generate wrappers scanned: expected 50+, got ' + nWrap);
  must(nCatch > 15, 'rethrow yields in generate catch (e): expected many, got ' + nCatch);
  console.log('rethrow yields injected into', nCatch, 'catch (e) blocks across', nWrap, 'generate wrappers');
}

/* 2) New survival worlds: don't call generate() before the loading screen can paint.
      Await the sliced generate instead. Make this wrapper async. */
const ewOld = `  enterWorld = function (save) {
    const needs = !c1Want && ((!save && current.mode === 'creative') || (save && save.gen === GEN10 && !isGold(current)));
    if (!save && current.mode !== 'creative') { const nw = g9Island ? ISL_W : 320; NEW_W = nw; setWorldSize(nw); gSeed = 0; generate(); dirtyAll = true; g9spawn = null; }`;

const ewNew = `  enterWorld = async function (save) {
    const needs = !c1Want && ((!save && current.mode === 'creative') || (save && save.gen === GEN10 && !isGold(current)));
    if (!save && current.mode !== 'creative') { const nw = g9Island ? ISL_W : 320; NEW_W = nw; setWorldSize(nw); gSeed = 0; if (window.__glenLoad && __glenLoad.generate) { try { if (typeof showScreen === 'function') showScreen('loading'); } catch (_) {} await __glenLoad.boot('Raising the mountains…'); await __glenLoad.generate(); } else generate(); dirtyAll = true; g9spawn = null; }`;

html = replaceOnce(html, ewOld, ewNew, 'enterWorld generate defer');

/* 3) flGen finally must not wipe flow maps mid-yield. */
const flOld = `generate = function () { flGen = true; try { return ge.apply(this, arguments); } finally { flGen = false; FLV.clear(); FLQ.clear(); } };`;
const flNew = `generate = function () { flGen = true; try { return ge.apply(this, arguments); } finally { if (!(window.__glenLoad && __glenLoad.held)) { flGen = false; FLV.clear(); FLQ.clear(); } } };`;
html = replaceOnce(html, flOld, flNew, 'flGen finally');

/* 4) Original loading lerp feeds the shared meter and does not reset a bar that is already filling. */
const shownOld = `  let i = 0, shown = 0, target = 0, t0 = performance.now(), ready = false;`;
const shownNew = `  let i = 0, shown = (window.__glenLoad && __glenLoad.shown) || 0, target = Math.max(shown, (window.__glenLoad && __glenLoad.real) || 0), t0 = performance.now(), ready = false;`;
html = replaceOnce(html, shownOld, shownNew, 'shown init');

const animOld = `  const anim = () => { shown += (target - shown) * 0.12; bar.style.width = shown.toFixed(1) + '%'; if (pct) pct.textContent = Math.round(shown) + '%'; if (screen === 'loading') requestAnimationFrame(anim); };
  requestAnimationFrame(anim);`;
const animNew = `  const anim = () => {
    if (window.__glenLoad && __glenLoad.live) {
      try { __glenLoad.setReal(Math.max(target, __glenLoad.real || 0), tip && tip.textContent, ready ? 100 : 99); if (ready) __glenLoad.finish(); } catch (_) {}
      if (screen === 'loading') requestAnimationFrame(anim);
      return;
    }
    shown += (target - shown) * 0.12; if (shown > target) shown = target; bar.style.width = shown.toFixed(1) + '%'; if (pct) pct.textContent = Math.round(shown) + '%'; if (screen === 'loading') requestAnimationFrame(anim);
  };
  requestAnimationFrame(anim);`;
html = replaceOnce(html, animOld, animNew, 'anim hook');

const readyOld = "    if (ready && shown > 98.5) {";
const readyNew = "    if (ready && (shown > 98.5 || (window.__glenLoad && __glenLoad.shown > 98.5))) {";
html = replaceOnce(html, readyOld, readyNew, 'ready uses shared meter');


/* 4b) The 20s "full rebuild" used rebuild() with no budget and stalled the meter.
      Also: do not dirtyAll (that disposes already-meshed spawn chunks). */
const rbOld = "console.error('load: land still not built after 20 s - full rebuild'); try { dirtyAll = true; rebuild(); }";
const rbNew = "console.error('load: land still not built after 20 s - full rebuild'); try { rebuild(150); }";
html = replaceOnce(html, rbOld, rbNew, 'bounded 20s rebuild');

/* 4c) While loading, mesh R=2 so the floor(P/CH)±1 ring chunksReady tests is
      fully covered. Stream rebuild uses P/CH-0.5, so R=1 misses the far side
      and the loader sits at 4/9 until the 45s give-up. LOAD_R stays 1 (9 chunks). */
const srOld = "try { if (!started || (typeof screen !== 'undefined' && screen === 'loading')) { const lr = (window.__loadChunkR != null ? window.__loadChunkR : 1); if (_sr > lr) _sr = lr; } } catch (_) {}";
const srNew = "try { if (!started || (typeof screen !== 'undefined' && screen === 'loading')) { const lr = (window.__loadChunkR != null ? window.__loadChunkR : 1); const meshR = Math.max(lr, 2); if (_sr > meshR) _sr = meshR; } } catch (_) {}";
html = replaceOnce(html, srOld, srNew, 'load mesh ring R=2');

/* 1g) On resume of the outer wrapper chain, skip wrapper bodies that already
      finished (including pre-apply resets) so uncached posts are not redone.
      markPost is inserted as a block around `return r` so `if (cond) return r`
      keeps a single-statement body. */
{
  function walkFns(html, onFn) {
    const startRe = /generate\s*=\s*function\s*\([^)]*\)\s*\{/g;
    const pieces = [];
    let last = 0, nWrap = 0, m;
    while ((m = startRe.exec(html))) {
      const bodyStart = m.index + m[0].length;
      let i = bodyStart - 1, depth = 0, mode = 'code';
      for (; i < html.length; i++) {
        const c = html[i], nch = html[i + 1];
        if (mode === 'code') {
          if (c === '"' || c === "'" || c === '`') { mode = c; continue; }
          if (c === '/' && nch === '/') { mode = 'line'; i++; continue; }
          if (c === '/' && nch === '*') { mode = 'block'; i++; continue; }
          if (c === '{') depth++;
          else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
        } else if (mode === 'line') {
          if (c === '\n') mode = 'code';
        } else if (mode === 'block') {
          if (c === '*' && nch === '/') { mode = 'code'; i++; }
        } else if (mode === '`' && c === '\\') { i++; }
        else if (c === '\\') { i++; }
        else if (c === mode) mode = 'code';
      }
      nWrap++;
      pieces.push(html.slice(last, m.index));
      pieces.push(onFn(nWrap, html.slice(m.index, bodyStart), html.slice(bodyStart, i)));
      last = i;
    }
    pieces.push(html.slice(last));
    return { html: pieces.join(''), nWrap };
  }
  const applyRe = /(\w+)\.apply\(this,\s*arguments\)/;
  const retRe = /return\s+(\w+)\s*;/g;
  let nSkip = 0, nMark = 0, nPass = 0;
  const out = walkFns(html, function (n, head, body) {
    const am = applyRe.exec(body);
    if (!am) { nPass++; return head + body; }
    const inner = am[1];
    const skip = 'if (window.__glenLoad && __glenLoad.skipPost && __glenLoad.skipPost(' + n + ')) return ' + inner + '.apply(this, arguments); ';
    if (!body.includes('skipPost(' + n + ')')) {
      body = skip + body;
      nSkip++;
    }
    body = body.replace(retRe, function (rm, ret) {
      // Don't wrap a skipPost early-return we just inserted (same ret as inner.apply result, already a block start).
      nMark++;
      return '{ if (window.__glenLoad && __glenLoad.markPost) __glenLoad.markPost(' + n + '); ' + rm + ' }';
    });
    return head + body;
  });
  html = out.html;
  must(nSkip >= 20, 'skipPost injected into too few wrappers: ' + nSkip);
  must(nMark >= 20, 'markPost injected into too few returns: ' + nMark);
  console.log('skipPost on', nSkip, 'wrappers, markPost on', nMark, 'returns, passthrough', nPass, 'of', out.nWrap);
}

/* 5) Liquid markup (firstChild stays the fill so existing width writes still work). */
html = replaceOnce(
  html,
  '    <div class="bootbar" id="loadW"><i></i></div>',
  '    <div class="bootbar liquid1285" id="loadW"><i class="load-fill"><b class="load-wave" aria-hidden="true"></b></i></div>',
  'loadW markup'
);

/* 6) Append the runtime once, before the closing script. */
if (!html.includes('/* GLX-LOAD1285')) {
  const needle = '\n</script>\n</body>\n</html>';
  must(html.endsWith(needle) || html.slice(-needle.length) === needle || html.includes(needle), 'closing script found');
  const idx = html.lastIndexOf('\n</script>\n</body>\n</html>');
  must(idx > 0, 'closing script index');
  html = html.slice(0, idx) + '\n' + src + '\n' + html.slice(idx);
}

if (!html.includes('<!-- glencraft-build: load1285 -->')) {
  must(html.includes('<!-- glencraft-build: b1284-v1.2.84 -->'), 'b1284 marker missing');
  html = replaceOnce(
    html,
    '<!-- glencraft-build: b1284-v1.2.84 -->',
    '<!-- glencraft-build: b1284-v1.2.84 -->\n<!-- glencraft-build: load1285 -->',
    'load1285 marker'
  );
}

/* Safety: no version bump, no 1.2.85 patch notes. */
must(html.includes("const GAME_VERSION = '1.2.84';"), 'version still 1.2.84');
must(!html.includes('"v":"v1.2.85"'), 'no 1.2.85 patch notes');
must(html.includes('/* GLX-LOAD1285'), 'runtime present');
must(html.includes('__glenLoad.generate'), 'deferred generate present');
must(html.includes('throw __L.YIELD'), 'column yield present');
must(html.includes('__L._gen9 = __glenGen9 || generate'), 'innermost GEN9 is captured');
must(html.includes('var __glenGen9 = generate;'), 'GEN9 captured before wrappers overwrite generate');
must(html.includes('__glenLoad.isYield && __glenLoad.isYield(e)) throw e'), 'catch rethrows yields');
must(html.includes('__glenLoad.skipPost') && html.includes('__glenLoad.markPost'), 'wrapper posts are skipped on resume');
must(html.includes('liquid1285'), 'liquid markup present');
must((html.split('/* GLX-LOAD1285').length - 1) === 1, 'one LOAD1285 block');

const vj = fs.readFileSync(path.join(root, 'version.json'), 'utf8');
must(JSON.parse(vj).v === '1.2.84', 'version.json stays 1.2.84');

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('build load1285 ok, index bytes', html.length, 'version stays 1.2.84');
