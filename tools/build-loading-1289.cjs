#!/usr/bin/env node
'use strict';
/* Slice remaining multi-second generate post-stages into <=200ms
   MessageChannel yields, resumable so the world stays byte-identical.
   Does not bump GAME_VERSION, version.json, PATCH_NOTES, or CREDITS. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function must(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
}
function replaceOnce(html, old, neu, tag) {
  const n = html.split(old).length - 1;
  must(n === 1, tag + ': expected 1 occurrence, got ' + n);
  return html.replace(old, neu);
}

/* 1) diamondBoost: resume by x, persist the xorshift state. */
const diamondOld = `function diamondBoost(seed) {
  let h = seed | 1; const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
  let n = 0;
  for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) for (let y = 2; y < 16; y++) {
    const i = idx(x, y, z), b = world[i]; if (b !== T.STONE && b !== T.DEEPSLATE) continue;
    if (world[i + 1] !== T.AIR && world[i - 1] !== T.AIR && world[idx(x, y + 1, z)] !== T.AIR && world[idx(x + 1, y, z)] !== T.AIR && world[idx(x - 1, y, z)] !== T.AIR) continue;
    if (rnd() < 0.0022) { for (let k = 0; k < 1 + Math.floor(rnd() * 4); k++) { const xx = x + Math.floor(rnd() * 2), yy = y + Math.floor(rnd() * 2) - 1, zz = z + Math.floor(rnd() * 2); const j = idx(xx, yy, zz); if (world[j] === T.STONE || world[j] === T.DEEPSLATE) { world[j] = T.DIAMONDORE; n++; } } }
  }
  return n;
}`;
const diamondNew = `function diamondBoost(seed) {
  /* GLX-LOAD1289 */ const __Ld = window.__glenLoad;
  const __st = (__Ld && __Ld.held && __Ld._loop && __Ld._loop.diamonds && __Ld._loop.diamonds.seed === seed) ? __Ld._loop.diamonds : null;
  let h = __st ? __st.h : (seed | 1), n = __st ? __st.n : 0;
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
  let __tD = performance.now(), __wD = Date.now(), __nD = 0;
  for (let x = __st ? __st.x : 1; x < W - 1; x++) {
    for (let z = 1; z < D - 1; z++) for (let y = 2; y < 16; y++) {
    const i = idx(x, y, z), b = world[i]; if (b !== T.STONE && b !== T.DEEPSLATE) continue;
    if (world[i + 1] !== T.AIR && world[i - 1] !== T.AIR && world[idx(x, y + 1, z)] !== T.AIR && world[idx(x + 1, y, z)] !== T.AIR && world[idx(x - 1, y, z)] !== T.AIR) continue;
    if (rnd() < 0.0022) { for (let k = 0; k < 1 + Math.floor(rnd() * 4); k++) { const xx = x + Math.floor(rnd() * 2), yy = y + Math.floor(rnd() * 2) - 1, zz = z + Math.floor(rnd() * 2); const j = idx(xx, yy, zz); if (world[j] === T.STONE || world[j] === T.DEEPSLATE) { world[j] = T.DIAMONDORE; n++; } } }
    }
    if (__Ld && __Ld.held && ((performance.now() - __tD > 200) || (Date.now() - __wD > 200))) {
      if (!__Ld._loop) __Ld._loop = {};
      __Ld._loop.diamonds = {seed: seed, h: h, n: n, x: x + 1};
      try { __Ld.touch(70 + 2 * (x + 1) / Math.max(1, W), 'Laying the ores… ' + (x + 1) + '/' + W, 92); } catch (_) {}
      throw __Ld.YIELD;
    }
  }
  if (__Ld && __Ld._loop) __Ld._loop.diamonds = null;
  return n;
}`;
html = replaceOnce(html, diamondOld, diamondNew, 'diamondBoost slice');

/* 2) fixTorches: resume by x (no PRNG). */
const torchOld = `function fixTorches() {
  let fixed = 0, removed = 0; const HD = H * D;
  for (let x = 0; x < W; x++) for (let y = 1; y < H - 1; y++) { const b0 = (x * H + y) * D; for (let z = 0; z < D; z++) {
    if (world[b0 + z] !== T.TORCH) continue;
    const k = keyOf(x, y, z), m = entMeta.get(k) || {};
    if (m.wall ? solid(x + m.wall[0], y, z + m.wall[1]) : m.ceil ? solid(x, y + 1, z) : solid(x, y - 1, z)) continue;
    let w = null; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (solid(x + dx, y, z + dz)) { w = [dx, dz]; break; }
    if (w) { entMeta.set(k, {face: 0, wall: w}); fixed++; }
    else if (solid(x, y - 1, z)) { entMeta.delete(k); fixed++; }
    else if (solid(x, y + 1, z)) { entMeta.set(k, {face: 0, ceil: 1}); fixed++; }
    else { world[b0 + z] = T.AIR; entMeta.delete(k); removed++; }
    markDirty(x, z);
  } }
  if (fixed + removed) console.log('[torches] fixed', fixed, 'removed', removed);
  return {fixed, removed};
}`;
const torchNew = `function fixTorches() {
  /* GLX-LOAD1289 */ const __Lt = window.__glenLoad;
  const __st = (__Lt && __Lt.held && __Lt._loop && __Lt._loop.torches) ? __Lt._loop.torches : null;
  let fixed = __st ? __st.fixed : 0, removed = __st ? __st.removed : 0; const HD = H * D;
  let __tT = performance.now(), __wT = Date.now(), __nT = 0;
  for (let x = __st ? __st.x : 0; x < W; x++) {
    for (let y = 1; y < H - 1; y++) { const b0 = (x * H + y) * D; for (let z = 0; z < D; z++) {
    if (world[b0 + z] !== T.TORCH) continue;
    const k = keyOf(x, y, z), m = entMeta.get(k) || {};
    if (m.wall ? solid(x + m.wall[0], y, z + m.wall[1]) : m.ceil ? solid(x, y + 1, z) : solid(x, y - 1, z)) continue;
    let w = null; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (solid(x + dx, y, z + dz)) { w = [dx, dz]; break; }
    if (w) { entMeta.set(k, {face: 0, wall: w}); fixed++; }
    else if (solid(x, y - 1, z)) { entMeta.delete(k); fixed++; }
    else if (solid(x, y + 1, z)) { entMeta.set(k, {face: 0, ceil: 1}); fixed++; }
    else { world[b0 + z] = T.AIR; entMeta.delete(k); removed++; }
    markDirty(x, z);
  } }
    if (__Lt && __Lt.held && ((performance.now() - __tT > 200) || (Date.now() - __wT > 200))) {
      if (!__Lt._loop) __Lt._loop = {};
      __Lt._loop.torches = {x: x + 1, fixed: fixed, removed: removed};
      try { __Lt.touch(74 + 2 * (x + 1) / Math.max(1, W), 'Lighting the hearths… ' + (x + 1) + '/' + W, 92); } catch (_) {}
      throw __Lt.YIELD;
    }
  }
  if (__Lt && __Lt._loop) __Lt._loop.torches = null;
  if (fixed + removed) console.log('[torches] fixed', fixed, 'removed', removed);
  return {fixed, removed};
}`;
html = replaceOnce(html, torchOld, torchNew, 'fixTorches slice');

/* 3) c39Settle: two phases, persist seen[] + stats, yield between columns. */
const settleOld = `  window.c39Settle = function (opt) {
    opt = opt || {}; const dry = !!opt.dry, reg = opt.region || null, W0 = W, H0 = H, D0 = D, hd = H0 * D0;
    const inReg = (x, z) => !reg || reg.some(r => Math.hypot(r[0] - x, r[1] - z) < r[2]);
    const placed = typeof placedSet !== 'undefined' ? placedSet : new Set();
    const st = {clusters: 0, clusterBlocks: 0, foundations: 0, torches: 0, lamps: 0, plants: 0, doors: 0, fences: 0};
    const at = (x, y, z) => (x < 0 || z < 0 || x >= W0 || z >= D0 || y < 0 || y >= H0) ? 0 : world[(x * H0 + y) * D0 + z];
    const sol = (x, y, z) => { if (y < 0) return true; const b = at(x, y, z); return b !== 0 && !isFluid(b) && !ATT[b] && !LEAFY[b] && b !== T.COBWEB; };
    const set = (x, y, z, v) => { if (!dry) world[(x * H0 + y) * D0 + z] = v; };
    // 1) structure components (everything solid that is not plain terrain): supported if touching terrain
    const seen = new Uint8Array(world.length), q = new Int32Array(1 << 21);
    for (let x = 0; x < W0; x++) for (let y = 1; y < H0; y++) { const b0 = (x * H0 + y) * D0; for (let z = 0; z < D0; z++) {`;

const settleNew = `  window.c39Settle = function (opt) {
    opt = opt || {}; const dry = !!opt.dry, reg = opt.region || null, W0 = W, H0 = H, D0 = D, hd = H0 * D0;
    const inReg = (x, z) => !reg || reg.some(r => Math.hypot(r[0] - x, r[1] - z) < r[2]);
    const placed = typeof placedSet !== 'undefined' ? placedSet : new Set();
    const __Ls = window.__glenLoad;
    const __can = !!(__Ls && __Ls.held && !dry && !reg);
    const __prev = (__can && __Ls._loop && __Ls._loop.settle) ? __Ls._loop.settle : null;
    const st = (__prev && __prev.st) ? __prev.st : {clusters: 0, clusterBlocks: 0, foundations: 0, torches: 0, lamps: 0, plants: 0, doors: 0, fences: 0};
    const at = (x, y, z) => (x < 0 || z < 0 || x >= W0 || z >= D0 || y < 0 || y >= H0) ? 0 : world[(x * H0 + y) * D0 + z];
    const sol = (x, y, z) => { if (y < 0) return true; const b = at(x, y, z); return b !== 0 && !isFluid(b) && !ATT[b] && !LEAFY[b] && b !== T.COBWEB; };
    const set = (x, y, z, v) => { if (!dry) world[(x * H0 + y) * D0 + z] = v; };
    // 1) structure components (everything solid that is not plain terrain): supported if touching terrain
    /* GLX-LOAD1289 */ const seen = (__prev && __prev.seen) ? __prev.seen : new Uint8Array(world.length), q = (__prev && __prev.q) ? __prev.q : new Int32Array(1 << 21);
    let __tS = performance.now(), __wS = Date.now(), __nS = 0;
    const __parkSettle = (phase, x, y) => {
      if (!__can) return;
      __nS++;
      if ((performance.now() - __tS <= 200) && (Date.now() - __wS <= 200)) return;
      if (!__Ls._loop) __Ls._loop = {};
      __Ls._loop.settle = {st: st, seen: seen, q: q, phase: phase, x: x, y: y};
      try { const denom = phase === 'att' ? Math.max(1, H0) : Math.max(1, W0); const cur = phase === 'att' ? y : x; __Ls.touch(76 + 4 * cur / denom, 'Settling the land…', 92); } catch (_) {}
      throw __Ls.YIELD;
    };
    if (!__prev || __prev.phase === 'struct') {
    const __sx = (__prev && __prev.phase === 'struct') ? (__prev.x || 0) : 0;
    for (let x = __sx; x < W0; x++) {
    for (let y = (x === __sx && __prev && __prev.phase === 'struct' && __prev.y) ? __prev.y : 1; y < H0; y++) { const b0 = (x * H0 + y) * D0; for (let z = 0; z < D0; z++) {`;

html = replaceOnce(html, settleOld, settleNew, 'c39Settle resume preamble');

/* Close the struct x loop and open the attachable phase with a yield. */
const settleMidOld = `    } }
    // 2) attachables, bottom-up so a post can rest on a fixed post
    for (let y = 1; y < H0 - 1; y++) for (let x = 0; x < W0; x++) { const b0 = (x * H0 + y) * D0; for (let z = 0; z < D0; z++) {`;

const settleMidNew = `    }
      __parkSettle('struct', x, y + 1);
    }
    }
    }
    // 2) attachables, bottom-up so a post can rest on a fixed post
    if (!__prev || __prev.phase === 'struct' || __prev.phase === 'att') {
    const __sy = (__prev && __prev.phase === 'att') ? (__prev.y || 1) : 1;
    const __sax = (__prev && __prev.phase === 'att' && __prev.x != null) ? __prev.x : 0;
    for (let y = __sy; y < H0 - 1; y++) {
    for (let x = (y === __sy ? __sax : 0); x < W0; x++) { const b0 = (x * H0 + y) * D0; for (let z = 0; z < D0; z++) {`;

html = replaceOnce(html, settleMidOld, settleMidNew, 'c39Settle phase split');

const settleEndOld = `      if (PLANT[b] === 1) { if (sb || LEAFY[below] || (b === T.WATER)) continue; if (isFluid(below) && (b === T.LILYPAD)) continue; st.plants++; set(x, y, z, 0); continue; }
    } }
    if (!dry && typeof markDirty === 'function') dirtyAll = true;
    st.total = st.clusters + st.foundations + st.torches + st.lamps + st.plants + st.doors + st.fences;
    return st;
  };`;

const settleEndNew = `      if (PLANT[b] === 1) { if (sb || LEAFY[below] || (b === T.WATER)) continue; if (isFluid(below) && (b === T.LILYPAD)) continue; st.plants++; set(x, y, z, 0); continue; }
    }
      __parkSettle('att', x + 1, y);
    }
    }
    }
    if (__Ls && __Ls._loop) __Ls._loop.settle = null;
    if (!dry && typeof markDirty === 'function') dirtyAll = true;
    st.total = st.clusters + st.foundations + st.torches + st.lamps + st.plants + st.doors + st.fences;
    return st;
  };`;

html = replaceOnce(html, settleEndOld, settleEndNew, 'c39Settle yield close');

/* 4) c77 orePass: slice the unsliced strip + veins, persist sd. */
const c77Old = `  function orePass() {
    const t0 = performance.now(); sd = (gSeed ^ 0x77a11e) >>> 0 || 9;
    const STRIP = new Uint8Array(1024); [T.COALORE, T.IRONORE, T.COPPERORE, T.GOLDORE, T.REDORE, T.DIAMONDORE, T.SILVERORE, 179].forEach(b => { if (b !== undefined) STRIP[b] = 1; });
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
      for (let v = 0; v < n; v++) { let x = 2 + (rnd() * (W - 4) | 0), z = 2 + (rnd() * (D - 4) | 0); let y = -1;
        for (let t = 0; t < 6 && (y < 1 || y > H - 3); t++) y = Math.round(rule === 'u' ? lo + rnd() * (hi - lo) : tri(lo, hi));
        if (y < 1 || y > H - 3) continue;
        // v0.9.72: most of the map is sea, so most veins used to start in water/air and vanish. Re-pick the column until the vein starts in rock (not for diamonds).
        if (rule !== 'hide' && !host(world[idx(x, y, z)])) for (let t = 0; t < 24; t++) { const xx = 2 + (rnd() * (W - 4) | 0), zz = 2 + (rnd() * (D - 4) | 0), tp = top(xx, zz);
            if (rule === 'mtn' && tp < SEA + 28) continue; const yh = Math.min(hi, tp - 3, H - 3), yl = Math.max(1, lo); if (yh < yl) continue;
            const yy = Math.round(rule === 'u' ? yl + rnd() * (yh - yl) : tri(yl, yh)); if (host(world[idx(xx, yy, zz)])) { x = xx; y = yy; z = zz; break; } }
        if (rule === 'mtn') { const tp = top(x, z); if (tp < SEA + 28 || y > tp - 2) continue; }
        placed += vein(x, y, z, Math.round(s0 + rnd() * (s1 - s0)), id, rule === 'hide'); }
      hist[name] = placed; }
    return {ms: Math.round(performance.now() - t0), stripped, placed: hist}; }`;

const c77New = `  function orePass() {
    const t0 = performance.now();
    const __Lo = window.__glenLoad;
    const __st = (__Lo && __Lo.held && __Lo._loop && __Lo._loop.c77) || {phase: 'strip', x: 0, stripped: 0, t0: t0};
    if (!__st.t0) __st.t0 = t0;
    const STRIP = new Uint8Array(1024); [T.COALORE, T.IRONORE, T.COPPERORE, T.GOLDORE, T.REDORE, T.DIAMONDORE, T.SILVERORE, 179].forEach(b => { if (b !== undefined) STRIP[b] = 1; });
    const DS = T.DEEPSLATE; let stripped = __st.stripped || 0;
    /* GLX-LOAD1289 */
    if (__st.phase !== 'veins') {
      let __tO = performance.now(), __wO = Date.now(), __nO = 0;
      for (let x = __st.x || 0; x < W; x++) {
        for (let y = 0; y < H; y++) { const b0 = (x * H + y) * D, low = y <= 22;
          for (let z = 0; z < D; z++) { const i = b0 + z, b = world[i];
            if (STRIP[b]) { world[i] = y < 21 ? DS : T.STONE; stripped++; continue; }
            if (!low) { if (b === DS && y > 24) world[i] = T.STONE; continue; }
            if (y === 0) { world[i] = BR; continue; }
            if (y <= 4) { if (b && b !== T.WATER && h3(x, y, z) < (5 - y) * 0.2) { world[i] = BR; continue; } }
            if (b === T.STONE && (y <= 19 || (y <= 22 && h3(x, y + 40, z) < (23 - y) / 4))) world[i] = DS;
            else if (b === DS && y > 22) world[i] = T.STONE; } }
        if (__Lo && __Lo.held && ((performance.now() - __tO > 200) || (Date.now() - __wO > 200))) {
          if (!__Lo._loop) __Lo._loop = {};
          __Lo._loop.c77 = {phase: 'strip', x: x + 1, stripped: stripped, t0: __st.t0};
          try { __Lo.touch(84 + 3 * (x + 1) / Math.max(1, W), 'Laying the ores… ' + (x + 1) + '/' + W, 92); } catch (_) {}
          throw __Lo.YIELD;
        }
      }
      if (__Lo && __Lo._loop) __Lo._loop.c77 = {phase: 'veins', stripped: stripped, t0: __st.t0, oi: 0, v: 0};
      __st.phase = 'veins'; __st.oi = 0; __st.v = 0; __st.stripped = stripped;
    }
    if (__st.sd == null) sd = (gSeed ^ 0x77a11e) >>> 0 || 9; else sd = __st.sd;
    const cols = W * D / 1000, top = (x, z) => g9cols ? g9cols[(x * D + z) * 2] : solidTop(x, z), hist = __st.hist || {};
    const ores = ORES();
    const startOi = __st.oi || 0, startV = __st.v || 0;
    let __tV = performance.now(), __wV = Date.now(), __nV = 0;
    for (let oi = startOi; oi < ores.length; oi++) {
      const [name, id, per, lo, hi, s0, s1, rule] = ores[oi]; if (id === undefined) continue; const n = Math.round(per * cols); let placed = (oi === startOi && hist[name] != null) ? hist[name] : 0;
      for (let v = (oi === startOi ? startV : 0); v < n; v++) { let x = 2 + (rnd() * (W - 4) | 0), z = 2 + (rnd() * (D - 4) | 0); let y = -1;
        for (let t = 0; t < 6 && (y < 1 || y > H - 3); t++) y = Math.round(rule === 'u' ? lo + rnd() * (hi - lo) : tri(lo, hi));
        if (y < 1 || y > H - 3) { /* fall through */ } else {
        // v0.9.72: most of the map is sea, so most veins used to start in water/air and vanish. Re-pick the column until the vein starts in rock (not for diamonds).
        if (rule !== 'hide' && !host(world[idx(x, y, z)])) for (let t = 0; t < 24; t++) { const xx = 2 + (rnd() * (W - 4) | 0), zz = 2 + (rnd() * (D - 4) | 0), tp = top(xx, zz);
            if (rule === 'mtn' && tp < SEA + 28) continue; const yh = Math.min(hi, tp - 3, H - 3), yl = Math.max(1, lo); if (yh < yl) continue;
            const yy = Math.round(rule === 'u' ? yl + rnd() * (yh - yl) : tri(yl, yh)); if (host(world[idx(xx, yy, zz)])) { x = xx; y = yy; z = zz; break; } }
        if (rule === 'mtn') { const tp = top(x, z); if (tp < SEA + 28 || y > tp - 2) { /* skip */ } else {
        placed += vein(x, y, z, Math.round(s0 + rnd() * (s1 - s0)), id, rule === 'hide'); } }
        else {
        placed += vein(x, y, z, Math.round(s0 + rnd() * (s1 - s0)), id, rule === 'hide'); } }
        if (__Lo && __Lo.held && ((performance.now() - __tV > 200) || (Date.now() - __wV > 200))) {
          hist[name] = placed;
          if (!__Lo._loop) __Lo._loop = {};
          __Lo._loop.c77 = {phase: 'veins', stripped: stripped, t0: __st.t0, sd: sd, hist: hist, oi: oi, v: v + 1};
          try { __Lo.touch(86, 'Laying the ores…', 92); } catch (_) {}
          throw __Lo.YIELD;
        }
      }
      hist[name] = placed;
    }
    if (__Lo && __Lo._loop) __Lo._loop.c77 = null;
    return {ms: Math.round(performance.now() - (__st.t0 || t0)), stripped, placed: hist}; }`;

html = replaceOnce(html, c77Old, c77New, 'c77 orePass slice');

/* 5) c104 orePass veins (strip is already sliced). Persist sd and vein index.
   Also restore window.__c77 when resuming the outer c104 wrapper. */
const c104VeinsOld = `    sd = (gSeed ^ 0x104a0e) >>> 0 || 11;
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
    return {ms: Math.round(performance.now() - t0), stripped, placed: hist, veins: want}; }`;

const c104VeinsNew = `    if (__st.sd == null) sd = (gSeed ^ 0x104a0e) >>> 0 || 11; else sd = __st.sd;
    const cols = W * D / 1000, hist = __st.hist || {}, want = __st.want || {};
    const ores = ORES();
    const startOi = __st.oi || 0, startV = __st.v || 0;
    let __tV = performance.now(), __wV = Date.now(), __nV = 0;
    for (let oi = startOi; oi < ores.length; oi++) {
      const [name, id, per, lo, hi, s0, s1, rule] = ores[oi]; if (id === undefined) continue; const n = Math.round(per * cols); let pl = (oi === startOi && hist[name] != null) ? hist[name] : 0, miss = (oi === startOi && want[name + '-miss'] != null) ? want[name + '-miss'] : 0;
      for (let v = (oi === startOi ? startV : 0); v < n; v++) { let x = 2 + (rnd() * (W - 4) | 0), z = 2 + (rnd() * (D - 4) | 0); let y = Math.round(rule === 'u' || rule === 'hide' ? lo + rnd() * (hi - lo) : tri(lo, hi));
        let __place = !(y < 1 || y > H - 3);
        if (__place && rule !== 'hide' && !host(world[idx(x, y, z)])) { let ok = false; for (let t = 0; t < 60; t++) { const xx = 2 + (rnd() * (W - 4) | 0), zz = 2 + (rnd() * (D - 4) | 0), tp = top(xx, zz);
            if (rule === 'mtn' && tp < SEA + 28) continue; const yh = Math.min(hi, tp - 3, H - 3), yl = Math.max(1, lo); if (yh < yl) continue;
            for (let q = 0; q < 4 && !ok; q++) { const yy = Math.round(rule === 'u' ? yl + rnd() * (yh - yl) : tri(yl, yh)); if (host(world[idx(xx, yy, zz)]) && !islBlock(xx, yy, zz)) { x = xx; y = yy; z = zz; ok = true; } } if (ok) break; } if (!ok) { miss++; __place = false; } }
        if (__place && rule === 'mtn') { const tp = top(x, z); if (tp < SEA + 28 || y > tp - 2) __place = false; }
        if (__place) pl += vein(x, y, z, Math.round(s0 + rnd() * (s1 - s0)), id, rule === 'hide');
        if (__Lo && __Lo.held && ((performance.now() - __tV > 200) || (Date.now() - __wV > 200))) {
          hist[name] = pl; want[name] = n; if (miss) want[name + '-miss'] = miss;
          if (!__Lo._loop) __Lo._loop = {};
          __Lo._loop.c104 = {phase: 'veins', stripped: stripped, t0: __st.t0, sd: sd, hist: hist, want: want, oi: oi, v: v + 1};
          try { __Lo.touch(87, 'Laying the ores…', 92); } catch (_) {}
          throw __Lo.YIELD;
        }
      }
      hist[name] = pl; want[name] = n; if (miss) want[name + '-miss'] = miss;
    }
    if (__Lo && __Lo._loop) __Lo._loop.c104 = null;
    return {ms: Math.round(performance.now() - (__st.t0 || t0)), stripped, placed: hist, veins: want}; }`;

html = replaceOnce(html, c104VeinsOld, c104VeinsNew, 'c104 orePass veins slice');

/* Restore __c77 on resume so a mid-c104 yield does not skip the rest of the pass. */
const c77nullOld = 'window.__c77 = null; const r = ge.apply(this, arguments);';
const c77nullNew = 'if (!(window.__glenLoad && __glenLoad.held && window.__c77)) window.__c77 = null; const r = ge.apply(this, arguments);';
html = replaceOnce(html, c77nullOld, c77nullNew, 'c104 resume keeps __c77');

const genClearOld = '    U._loop = Object.create(null);\n    U._tSlice = performance.now();';
const genClearNew = '    U._loop = Object.create(null);\n    try { window.__c77 = null; } catch (_) {}\n    U._tSlice = performance.now();';
html = replaceOnce(html, genClearOld, genClearNew, 'clear __c77 at generate start');

/* 6) cavePass: resume by x, persist sd. Wrap the call in coop. */
const caveOld = `  function cavePass(p) { const t0 = performance.now(); sd = (gSeed ^ 0xca7e5) >>> 0 || 13; let seams = 0, put = 0;
    for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) { const yt = Math.min(top(x, z) - 4, H - 3);
      for (let y = 2; y <= yt; y++) { const i = idx(x, y, z); if (world[i] !== 0 || rnd() > p) continue;
        const [a, b, c] = NB[rnd() * 6 | 0], X = x + a, Y = y + b, Z = z + c; if (!inb(X, Y, Z) || !host(world[idx(X, Y, Z)]) || islBlock(X, Y, Z)) continue;
        const ore = pickOre(Y), n = 3 + (rnd() * 5 | 0); let px = X, py = Y, pz = Z;
        for (let k = 0; k < n; k++) { if (inb(px, py, pz)) { const j = idx(px, py, pz); if (host(world[j]) && !placed(j)) { world[j] = ore; put++; } }
          // creep along the wall: prefer rock that touches the cave
          for (let t = 0; t < 4; t++) { const [u, v, w] = NB[rnd() * 6 | 0], qx = px + u, qy = py + v, qz = pz + w; if (inb(qx, qy, qz) && host(world[idx(qx, qy, qz)]) && (t === 3 || airN(qx, qy, qz))) { px = qx; py = qy; pz = qz; break; } } }
        seams++; } }
    return {ms: Math.round(performance.now() - t0), seams, put}; }`;

const caveNew = `  function cavePass(p) { const t0 = performance.now();
    const __Lc = window.__glenLoad;
    const __st = (__Lc && __Lc.held && __Lc._loop && __Lc._loop.c104cave) ? __Lc._loop.c104cave : null;
    if (!__st) sd = (gSeed ^ 0xca7e5) >>> 0 || 13; else sd = __st.sd;
    let seams = __st ? __st.seams : 0, put = __st ? __st.put : 0;
    let __tC = performance.now(), __wC = Date.now(), __nC = 0;
    /* GLX-LOAD1289 */
    for (let x = __st ? __st.x : 2; x < W - 2; x++) {
      for (let z = 2; z < D - 2; z++) { const yt = Math.min(top(x, z) - 4, H - 3);
      for (let y = 2; y <= yt; y++) { const i = idx(x, y, z); if (world[i] !== 0 || rnd() > p) continue;
        const [a, b, c] = NB[rnd() * 6 | 0], X = x + a, Y = y + b, Z = z + c; if (!inb(X, Y, Z) || !host(world[idx(X, Y, Z)]) || islBlock(X, Y, Z)) continue;
        const ore = pickOre(Y), n = 3 + (rnd() * 5 | 0); let px = X, py = Y, pz = Z;
        for (let k = 0; k < n; k++) { if (inb(px, py, pz)) { const j = idx(px, py, pz); if (host(world[j]) && !placed(j)) { world[j] = ore; put++; } }
          // creep along the wall: prefer rock that touches the cave
          for (let t = 0; t < 4; t++) { const [u, v, w] = NB[rnd() * 6 | 0], qx = px + u, qy = py + v, qz = pz + w; if (inb(qx, qy, qz) && host(world[idx(qx, qy, qz)]) && (t === 3 || airN(qx, qy, qz))) { px = qx; py = qy; pz = qz; break; } } }
        seams++; } }
      if (__Lc && __Lc.held && ((performance.now() - __tC > 200) || (Date.now() - __wC > 200))) {
        if (!__Lc._loop) __Lc._loop = {};
        __Lc._loop.c104cave = {x: x + 1, sd: sd, seams: seams, put: put, t0: (__st && __st.t0) || t0};
        try { __Lc.touch(88 + 3 * (x + 1) / Math.max(1, W), 'Carving the caves… ' + (x + 1) + '/' + W, 92); } catch (_) {}
        throw __Lc.YIELD;
      }
    }
    if (__Lc && __Lc._loop) __Lc._loop.c104cave = null;
    return {ms: Math.round(performance.now() - ((__st && __st.t0) || t0)), seams, put}; }`;

html = replaceOnce(html, caveOld, caveNew, 'cavePass slice');

html = replaceOnce(
  html,
  "st.caves = window.__g12 ? 'c131' : cavePass(U.P); if (U.measure) st.after = caveStats();",
  "st.caves = window.__g12 ? 'c131' : ((window.__glenLoad && __glenLoad.coop) ? __glenLoad.coop(\"c104caves\", \"Carving the caves…\", 89, function(){ return cavePass(U.P); }) : cavePass(U.P)); if (U.measure) st.after = caveStats();",
  'coop cavePass'
);

/* additional 1289 slices: GEN9 ores, keeps, veins, hives, caves */
html = replaceOnce(html, "    const vein = (ore, n, y0, y1, r) => {\n      for (let i = 0; i < n; i++) {\n        const cx = Math.floor(rnd() * W), cz = Math.floor(rnd() * D), cy = y0 + Math.floor(rnd() * (y1 - y0));\n        const len = 3 + Math.floor(rnd() * (r * 3));\n        let x = cx, y = cy, z = cz;\n        for (let k = 0; k < len; k++) {\n          const b = getB(x, y, z); if (b === T.STONE || b === T.DEEPSLATE) world[idx(x, y, z)] = ore;\n          x += Math.floor(rnd() * 3) - 1; y += Math.floor(rnd() * 3) - 1; z += Math.floor(rnd() * 3) - 1;\n        }\n      }\n    };\n    const A = W * D / 1000;\n    vein(T.COALORE, Math.round(A * 32), 14, H - 6, 3); vein(T.COPPERORE, Math.round(A * 16), 18, SEA + 10, 2);\n    vein(T.IRONORE, Math.round(A * 20), 6, SEA + 4, 2); vein(T.GOLDORE, Math.round(A * 6), 3, 24, 2);\n    vein(T.REDORE, Math.round(A * 6), 2, 18, 2); vein(T.DIAMONDORE, Math.round(A * 9), 2, 16, 1.4);   // GLX-C1: ~MC rate (was A*3)\n    // underground lochs: some cavern floors flood (only at depth)\n    for (let n = 0; n < (window.__g12 ? 0 : Math.round(A * 0.6)); n++) {\n      const x0 = Math.floor(rnd() * W), z0 = Math.floor(rnd() * D);\n      for (let y = 8; y < 26; y++) if (getB(x0, y, z0) === T.AIR && solid(x0, y - 1, z0)) {\n        for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) { const x = x0 + dx, z = z0 + dz; if (getB(x, y, z) === T.AIR && solid(x, y - 1, z) && dx * dx + dz * dz < 36) world[idx(x, y, z)] = T.WATER; }\n        break;\n      }\n    }\n    if (__L && __L.held) {\n      __L._g9 = {phase: 'feat', rnd: rnd, hash: hash, cav: cav, tun: tun, tri: tri};\n      try { __L.touch(68, 'Planting the glens\u2026', 90); } catch (_) {}\n      throw __L.YIELD;\n    }", "    const A = W * D / 1000;\n    /* GLX-LOAD1289 */ const veinJobs = [\n      [T.COALORE, Math.round(A * 32), 14, H - 6, 3],\n      [T.COPPERORE, Math.round(A * 16), 18, SEA + 10, 2],\n      [T.IRONORE, Math.round(A * 20), 6, SEA + 4, 2],\n      [T.GOLDORE, Math.round(A * 6), 3, 24, 2],\n      [T.REDORE, Math.round(A * 6), 2, 18, 2],\n      [T.DIAMONDORE, Math.round(A * 9), 2, 16, 1.4]\n    ];\n    const __ore0 = (st && st.phase === 'ores') ? st : {oreKind: 0, oreI: 0, lochN: 0};\n    let __tOre = performance.now(), __wOre = Date.now(), __nOre = 0;\n    const __parkOres = (oreKind, oreI, lochN) => {\n      if (!(__L && __L.held)) return;\n      __nOre++;\n      if ((performance.now() - __tOre <= 200) && (Date.now() - __wOre <= 200)) return;\n      __L._g9 = {phase: 'ores', rnd: rnd, hash: hash, cav: cav, tun: tun, tri: tri, oreKind: oreKind, oreI: oreI, lochN: lochN};\n      try { __L.touch(64 + 4 * (oreKind + oreI / 10000) / 7, 'Laying the ores\u2026 ' + (oreKind + 1) + '/' + veinJobs.length, 90); } catch (_) {}\n      throw __L.YIELD;\n    };\n    for (let k = __ore0.oreKind || 0; k < veinJobs.length; k++) {\n      const job = veinJobs[k], ore = job[0], n = job[1], y0 = job[2], y1 = job[3], r = job[4];\n      for (let i = (k === (__ore0.oreKind || 0) ? (__ore0.oreI || 0) : 0); i < n; i++) {\n        const cx = Math.floor(rnd() * W), cz = Math.floor(rnd() * D), cy = y0 + Math.floor(rnd() * (y1 - y0));\n        const len = 3 + Math.floor(rnd() * (r * 3));\n        let x = cx, y = cy, z = cz;\n        for (let kk = 0; kk < len; kk++) {\n          const b = getB(x, y, z); if (b === T.STONE || b === T.DEEPSLATE) world[idx(x, y, z)] = ore;\n          x += Math.floor(rnd() * 3) - 1; y += Math.floor(rnd() * 3) - 1; z += Math.floor(rnd() * 3) - 1;\n        }\n        __parkOres(k, i + 1, 0);\n      }\n    }\n    const lochMax = window.__g12 ? 0 : Math.round(A * 0.6);\n    for (let n = ((__ore0.oreKind || 0) >= veinJobs.length ? (__ore0.lochN || 0) : 0); n < lochMax; n++) {\n      const x0 = Math.floor(rnd() * W), z0 = Math.floor(rnd() * D);\n      for (let y = 8; y < 26; y++) if (getB(x0, y, z0) === T.AIR && solid(x0, y - 1, z0)) {\n        for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) { const x = x0 + dx, z = z0 + dz; if (getB(x, y, z) === T.AIR && solid(x, y - 1, z) && dx * dx + dz * dz < 36) world[idx(x, y, z)] = T.WATER; }\n        break;\n      }\n      __parkOres(veinJobs.length, 0, n + 1);\n    }\n    if (__L && __L.held) {\n      __L._g9 = {phase: 'feat', rnd: rnd, hash: hash, cav: cav, tun: tun, tri: tri};\n      try { __L.touch(68, 'Planting the glens\u2026', 90); } catch (_) {}\n      throw __L.YIELD;\n    }", "GEN9 ores slice");
html = replaceOnce(html, "function placeOreVeins(ore, n, y0, y1, lo, hi) {\n  for (let v = 0, tries = 0; v < n && tries < n * 40; tries++) {\n    const x = 2 + Math.floor(Math.random() * (W - 4)), z = 2 + Math.floor(Math.random() * (D - 4)), y = y0 + Math.floor(Math.random() * (y1 - y0 + 1));\n    const b = getB(x, y, z); if (b !== T.STONE && b !== T.DEEPSLATE) continue;\n    const want = lo + Math.floor(Math.random() * (hi - lo + 1));\n    let px = x, py = y, pz = z, placed = 0;\n    for (let i = 0; i < want * 4 && placed < want; i++) {\n      const c = getB(px, py, pz); if ((c === T.STONE || c === T.DEEPSLATE) && py >= y0 && py <= y1) { setB(px, py, pz, ore); placed++; }\n      const r = Math.floor(Math.random() * 6); px += r === 0 ? 1 : r === 1 ? -1 : 0; py += r === 2 ? 1 : r === 3 ? -1 : 0; pz += r === 4 ? 1 : r === 5 ? -1 : 0;\n      px = clamp(px, 1, W - 2); pz = clamp(pz, 1, D - 2); py = clamp(py, 1, H - 2);\n    }\n    v++;\n  }\n}", "function placeOreVeins(ore, n, y0, y1, lo, hi) {\n  /* GLX-LOAD1289 */ const __Lv = window.__glenLoad;\n  const __key = [ore, n, y0, y1, lo, hi].join(',');\n  const __st = (__Lv && __Lv.held && __Lv._loop && __Lv._loop.silver && __Lv._loop.silver.key === __key) ? __Lv._loop.silver : null;\n  let v = __st ? __st.v : 0, tries = __st ? __st.tries : 0;\n  let __tV = performance.now(), __wV = Date.now(), __nV = 0;\n  for (; v < n && tries < n * 40; tries++) {\n    const x = 2 + Math.floor(Math.random() * (W - 4)), z = 2 + Math.floor(Math.random() * (D - 4)), y = y0 + Math.floor(Math.random() * (y1 - y0 + 1));\n    const b = getB(x, y, z); if (b !== T.STONE && b !== T.DEEPSLATE) {\n      if (__Lv && __Lv.held && ((performance.now() - __tV > 200) || (Date.now() - __wV > 200))) {\n        if (!__Lv._loop) __Lv._loop = {};\n        __Lv._loop.silver = {key: __key, v: v, tries: tries + 1};\n        try { __Lv.touch(72.5, 'Laying the ores\u2026 ' + v + '/' + n, 92); } catch (_) {}\n        throw __Lv.YIELD;\n      }\n      continue;\n    }\n    const want = lo + Math.floor(Math.random() * (hi - lo + 1));\n    let px = x, py = y, pz = z, placed = 0;\n    for (let i = 0; i < want * 4 && placed < want; i++) {\n      const c = getB(px, py, pz); if ((c === T.STONE || c === T.DEEPSLATE) && py >= y0 && py <= y1) { setB(px, py, pz, ore); placed++; }\n      const r = Math.floor(Math.random() * 6); px += r === 0 ? 1 : r === 1 ? -1 : 0; py += r === 2 ? 1 : r === 3 ? -1 : 0; pz += r === 4 ? 1 : r === 5 ? -1 : 0;\n      px = clamp(px, 1, W - 2); pz = clamp(pz, 1, D - 2); py = clamp(py, 1, H - 2);\n    }\n    v++;\n    if (__Lv && __Lv.held && ((performance.now() - __tV > 200) || (Date.now() - __wV > 200))) {\n      if (!__Lv._loop) __Lv._loop = {};\n      __Lv._loop.silver = {key: __key, v: v, tries: tries + 1};\n      try { __Lv.touch(72.5, 'Laying the ores\u2026 ' + v + '/' + n, 92); } catch (_) {}\n      throw __Lv.YIELD;\n    }\n  }\n  if (__Lv && __Lv._loop) __Lv._loop.silver = null;\n}", "placeOreVeins slice");
html = replaceOnce(html, "function placeHives() { if (DIM.cur) return 0; let n = 0; const want = 1;\n    for (let t = 0; t < 6000 && n < want; t++) { const x = 6 + Math.floor(Math.random() * (W - 12)), z = 6 + Math.floor(Math.random() * (D - 12));\n      let y = H - 3; while (y > 2 && !LEAFY[world[idx(x, y, z)]]) { if (world[idx(x, y, z)] && !LEAFY[world[idx(x, y, z)]]) { y = 0; break; } y--; } if (y < 4) continue;\n      let ly = y; while (ly > 2 && LEAFY[world[idx(x, ly - 1, z)]]) ly--;   // bottom leaf of the canopy\n      if (world[idx(x, ly - 1, z)] !== T.AIR || world[idx(x, ly - 2, z)] !== T.AIR) continue;\n      let fl = 0; for (let a = -6; a <= 6; a++) for (let c = -6; c <= 6; c++) { const g = solidTop(x + a, z + c); const b = world[idx(x + a, g + 1, z + c)]; if (FLOWERS.has(b) || FLOWERS.has(world[idx(x + a, g, z + c)])) fl++; } if (fl < 2) continue;\n      world[idx(x, ly - 1, z)] = HIVE; entMeta.set(keyH(x, ly - 1, z), {honey: 5, face: Math.floor(Math.random() * 4)}); n++; }\n    return n; }", "function placeHives() { if (DIM.cur) return 0; let n = 0; const want = 1;\n    /* GLX-LOAD1289 */ const __Lh = window.__glenLoad;\n    const __st = (__Lh && __Lh.held && __Lh._loop && __Lh._loop.hives) ? __Lh._loop.hives : null;\n    n = __st ? __st.n : 0;\n    let __tH = performance.now(), __wH = Date.now(), __nH = 0;\n    for (let t = __st ? __st.t : 0; t < 6000 && n < want; t++) { const x = 6 + Math.floor(Math.random() * (W - 12)), z = 6 + Math.floor(Math.random() * (D - 12));\n      let y = H - 3; while (y > 2 && !LEAFY[world[idx(x, y, z)]]) { if (world[idx(x, y, z)] && !LEAFY[world[idx(x, y, z)]]) { y = 0; break; } y--; } if (y < 4) {\n        if (__Lh && __Lh.held && ((performance.now() - __tH > 200) || (Date.now() - __wH > 200))) {\n          if (!__Lh._loop) __Lh._loop = {};\n          __Lh._loop.hives = {t: t + 1, n: n};\n          try { __Lh.touch(79, 'Planting the woods\u2026 ' + t + '/6000', 92); } catch (_) {}\n          throw __Lh.YIELD;\n        }\n        continue;\n      }\n      let ly = y; while (ly > 2 && LEAFY[world[idx(x, ly - 1, z)]]) ly--;   // bottom leaf of the canopy\n      if (world[idx(x, ly - 1, z)] !== T.AIR || world[idx(x, ly - 2, z)] !== T.AIR) continue;\n      let fl = 0; for (let a = -6; a <= 6; a++) for (let c = -6; c <= 6; c++) { const g = solidTop(x + a, z + c); const b = world[idx(x + a, g + 1, z + c)]; if (FLOWERS.has(b) || FLOWERS.has(world[idx(x + a, g, z + c)])) fl++; } if (fl < 2) continue;\n      world[idx(x, ly - 1, z)] = HIVE; entMeta.set(keyH(x, ly - 1, z), {honey: 5, face: Math.floor(Math.random() * 4)}); n++;\n      if (__Lh && __Lh.held && ((performance.now() - __tH > 200) || (Date.now() - __wH > 200))) {\n        if (!__Lh._loop) __Lh._loop = {};\n        __Lh._loop.hives = {t: t + 1, n: n};\n        try { __Lh.touch(79, 'Planting the woods\u2026 ' + t + '/6000', 92); } catch (_) {}\n        throw __Lh.YIELD;\n      }\n    }\n    if (__Lh && __Lh._loop) __Lh._loop.hives = null;\n    return n; }", "placeHives slice");
html = replaceOnce(html, "function g9PlaceCastles() {\n  if (W < 200) return [];\n  const hAt = (x, z) => g9cols[(x * D + z) * 2], kind = (x, z) => g9cols[(x * D + z) * 2 + 1];\n  const placed = [], cx = W >> 1, cz = D >> 1;\n  const ok = (x, z, r) => x > r + 8 && z > r + 8 && x < W - r - 8 && z < D - r - 8 && Math.hypot(x - cx, z - cz) > 40 &&\n    placed.every(p => Math.hypot(p[1] - x, p[2] - z) > 70) && castleAvoid.every(a => x + r < a.x0 - 6 || x - r > a.x1 + 6 || z + r < a.z0 - 6 || z - r > a.z1 + 6);\n  const flat = (x, z, r) => { let lo = 1e9, hi = -1e9, wet = 0; for (let a = -r; a <= r; a += 3) for (let b = -r; b <= r; b += 3) { const h = hAt(x + a, z + b); lo = Math.min(lo, h); hi = Math.max(hi, h); if (kind(x + a, z + b) === 5) wet++; } return {lo, hi, wet}; };\n  const best = (r, score) => { let bx = -1, bz = -1, bs = -1e18; for (let x = 0; x < W; x += 4) for (let z = 0; z < D; z += 4) { if (!ok(x, z, r)) continue; const s = score(x, z); if (s > bs) { bs = s; bx = x; bz = z; } } return bs > -1e17 ? [bx, bz] : null; };\n  const add = (k, r, f) => { const p = best(r, f); if (p) { placed.push([k, p[0], p[1]]); } };\n  // white citadel: the highest broad hilltop\n  add('citadel', 26, (x, z) => { const f = flat(x, z, 18); return f.wet ? -1e18 : f.lo * 2 - (f.hi - f.lo) * 3; });\n  // turreted castle: a green hill of middling height\n  add('turrets', 18, (x, z) => { const f = flat(x, z, 12); if (f.wet || f.lo < SEA + 8) return -1e18; return -Math.abs(f.lo - (SEA + 16)) * 2 - (f.hi - f.lo) * 4; });\n  // ruined tower-house on a loch shore\n  add('towerhouse', 14, (x, z) => { const f = flat(x, z, 9); if (f.wet || f.lo < SEA + 1 || f.hi > SEA + 7) return -1e18; const w = flat(x, z, 22).wet; return w * 4 - (f.hi - f.lo) * 3; });\n  // island ruin: a low flat glen floor right under big mountains (it digs its own lochan)\n  add('lochisle', 22, (x, z) => { const f = flat(x, z, 18); if (f.wet > 2 || f.lo < SEA + 1 || f.hi - f.lo > 6) return -1e18; const m = flat(x, z, 45).hi; return (m - f.lo) * 2 - (f.hi - f.lo) * 4; });\n  for (const c of placed) { try { buildCastle(c[0], c[1], c[2]); } catch (e) { console.warn('castle', c, e); } }\n  g9castles = placed;\n  return placed;\n}", "function g9PlaceCastles() {\n  if (W < 200) return [];\n  const hAt = (x, z) => g9cols[(x * D + z) * 2], kind = (x, z) => g9cols[(x * D + z) * 2 + 1];\n  /* GLX-LOAD1289 */ const __Lk = window.__glenLoad;\n  const __st = (__Lk && __Lk.held && __Lk._loop && __Lk._loop.keeps) ? __Lk._loop.keeps : null;\n  const placed = (__st && __st.placed) ? __st.placed : [], cx = W >> 1, cz = D >> 1;\n  const ok = (x, z, r) => x > r + 8 && z > r + 8 && x < W - r - 8 && z < D - r - 8 && Math.hypot(x - cx, z - cz) > 40 &&\n    placed.every(p => Math.hypot(p[1] - x, p[2] - z) > 70) && castleAvoid.every(a => x + r < a.x0 - 6 || x - r > a.x1 + 6 || z + r < a.z0 - 6 || z - r > a.z1 + 6);\n  const flat = (x, z, r) => { let lo = 1e9, hi = -1e9, wet = 0; for (let a = -r; a <= r; a += 3) for (let b = -r; b <= r; b += 3) { const h = hAt(x + a, z + b); lo = Math.min(lo, h); hi = Math.max(hi, h); if (kind(x + a, z + b) === 5) wet++; } return {lo, hi, wet}; };\n  const jobs = [\n    ['citadel', 26, (x, z) => { const f = flat(x, z, 18); return f.wet ? -1e18 : f.lo * 2 - (f.hi - f.lo) * 3; }],\n    ['turrets', 18, (x, z) => { const f = flat(x, z, 12); if (f.wet || f.lo < SEA + 8) return -1e18; return -Math.abs(f.lo - (SEA + 16)) * 2 - (f.hi - f.lo) * 4; }],\n    ['towerhouse', 14, (x, z) => { const f = flat(x, z, 9); if (f.wet || f.lo < SEA + 1 || f.hi > SEA + 7) return -1e18; const w = flat(x, z, 22).wet; return w * 4 - (f.hi - f.lo) * 3; }],\n    ['lochisle', 22, (x, z) => { const f = flat(x, z, 18); if (f.wet > 2 || f.lo < SEA + 1 || f.hi - f.lo > 6) return -1e18; const m = flat(x, z, 45).hi; return (m - f.lo) * 2 - (f.hi - f.lo) * 4; }]\n  ];\n  let __tK = performance.now(), __wK = Date.now(), __nK = 0;\n  const startJ = (__st && __st.phase !== 'build') ? (__st.j || 0) : jobs.length;\n  for (let j = startJ; j < jobs.length; j++) {\n    const k = jobs[j][0], r = jobs[j][1], score = jobs[j][2];\n    let bx = (j === startJ && __st && __st.phase === 'search') ? __st.bx : -1;\n    let bz = (j === startJ && __st && __st.phase === 'search') ? __st.bz : -1;\n    let bs = (j === startJ && __st && __st.phase === 'search') ? __st.bs : -1e18;\n    for (let x = (j === startJ && __st && __st.phase === 'search') ? (__st.x || 0) : 0; x < W; x += 4) {\n      for (let z = 0; z < D; z += 4) { if (!ok(x, z, r)) continue; const s = score(x, z); if (s > bs) { bs = s; bx = x; bz = z; } }\n      if (__Lk && __Lk.held && ((performance.now() - __tK > 200) || (Date.now() - __wK > 200))) {\n        if (!__Lk._loop) __Lk._loop = {};\n        __Lk._loop.keeps = {phase: 'search', j: j, x: x + 4, bx: bx, bz: bz, bs: bs, placed: placed};\n        try { __Lk.touch(73, 'Raising the keeps\u2026 ' + (j + 1) + '/' + jobs.length, 92); } catch (_) {}\n        throw __Lk.YIELD;\n      }\n    }\n    if (bs > -1e17) placed.push([k, bx, bz]);\n  }\n  const startB = (__st && __st.phase === 'build') ? (__st.bi || 0) : 0;\n  for (let bi = startB; bi < placed.length; bi++) {\n    const c = placed[bi];\n    try { buildCastle(c[0], c[1], c[2]); } catch (e) { console.warn('castle', c, e); }\n    if (__Lk && __Lk.held && bi + 1 < placed.length) {\n      if (!__Lk._loop) __Lk._loop = {};\n      __Lk._loop.keeps = {phase: 'build', bi: bi + 1, placed: placed};\n      try { __Lk.touch(73.5, 'Raising the keeps\u2026', 92); } catch (_) {}\n      throw __Lk.YIELD;\n    }\n  }\n  if (__Lk && __Lk._loop) __Lk._loop.keeps = null;\n  g9castles = placed;\n  return placed;\n}", "g9PlaceCastles slice");
html = replaceOnce(html, "window.c41Castles = function () {\n    if (DIM.cur || typeof g9castles === 'undefined') return {};\n    let removed = 0, cleared = 0;\n    for (const c of g9castles) { const R = c[0] === 'citadel' ? 30 : 26, list = [];\n      for (const [k, ch] of chests) { const [x, y, z] = k.split(',').map(Number); if (Math.abs(x - c[1]) <= R && Math.abs(z - c[2]) <= R && !(typeof placedSet !== 'undefined' && placedSet.has(idx(x, y, z)))) list.push([k, ch, x, y, z]); }\n      list.sort((a, b) => a[3] - b[3]);\n      const keep = list.length > 3 ? [list[0], list[Math.floor(list.length / 2)], list[list.length - 1]] : list;\n      for (const e of list) if (!keep.includes(e)) { chests.delete(e[0]); world[idx(e[2], e[3], e[4])] = T.AIR; removed++; }\n      if (keep.length && !keep.some(e => e[1].slots.some(s => s && s[0] === IT.PAINTING))) { const s = keep[0][1].slots; const i = s.indexOf(null); s[i >= 0 ? i : 26] = [IT.PAINTING, 1]; }\n      for (let x = c[1] - R; x <= c[1] + R; x++) for (let z = c[2] - R; z <= c[2] + R; z++) { if (x < 0 || z < 0 || x >= W || z >= D) continue;\n        for (let y = 2; y < H - 3; y++) if (IS_STAIR[world[idx(x, y, z)]]) for (let h = 1; h <= 2; h++) { const b = world[idx(x, y + h, z)]; if (DECOR.has(b)) { world[idx(x, y + h, z)] = T.AIR; entMeta.delete(keyOf(x, y + h, z)); cleared++; } } }\n    }\n    return {removed, cleared};\n  };", "window.c41Castles = function () {\n    if (DIM.cur || typeof g9castles === 'undefined') return {};\n    /* GLX-LOAD1289 */ const __L4 = window.__glenLoad;\n    const __st = (__L4 && __L4.held && __L4._loop && __L4._loop.c41) ? __L4._loop.c41 : null;\n    let removed = __st ? __st.removed : 0, cleared = __st ? __st.cleared : 0;\n    let __t4 = performance.now(), __w4 = Date.now();\n    for (let ci = __st ? __st.ci : 0; ci < g9castles.length; ci++) {\n      const c = g9castles[ci]; const R = c[0] === 'citadel' ? 30 : 26, list = [];\n      for (const [k, ch] of chests) { const [x, y, z] = k.split(',').map(Number); if (Math.abs(x - c[1]) <= R && Math.abs(z - c[2]) <= R && !(typeof placedSet !== 'undefined' && placedSet.has(idx(x, y, z)))) list.push([k, ch, x, y, z]); }\n      list.sort((a, b) => a[3] - b[3]);\n      const keep = list.length > 3 ? [list[0], list[Math.floor(list.length / 2)], list[list.length - 1]] : list;\n      for (const e of list) if (!keep.includes(e)) { chests.delete(e[0]); world[idx(e[2], e[3], e[4])] = T.AIR; removed++; }\n      if (keep.length && !keep.some(e => e[1].slots.some(s => s && s[0] === IT.PAINTING))) { const s = keep[0][1].slots; const i = s.indexOf(null); s[i >= 0 ? i : 26] = [IT.PAINTING, 1]; }\n      const x0 = __st && __st.ci === ci && __st.x != null ? __st.x : (c[1] - R);\n      for (let x = x0; x <= c[1] + R; x++) {\n        for (let z = c[2] - R; z <= c[2] + R; z++) { if (x < 0 || z < 0 || x >= W || z >= D) continue;\n        for (let y = 2; y < H - 3; y++) if (IS_STAIR[world[idx(x, y, z)]]) for (let h = 1; h <= 2; h++) { const b = world[idx(x, y + h, z)]; if (DECOR.has(b)) { world[idx(x, y + h, z)] = T.AIR; entMeta.delete(keyOf(x, y + h, z)); cleared++; } } }\n        if (__L4 && __L4.held && ((performance.now() - __t4 > 200) || (Date.now() - __w4 > 200))) {\n          if (!__L4._loop) __L4._loop = {};\n          __L4._loop.c41 = {ci: ci, x: x + 1, removed: removed, cleared: cleared};\n          try { __L4.touch(77, 'Raising the keeps\u2026', 92); } catch (_) {}\n          throw __L4.YIELD;\n        }\n      }\n    }\n    if (__L4 && __L4._loop) __L4._loop.c41 = null;\n    return {removed, cleared};\n  };", "c41Castles slice");
html = replaceOnce(html, "function finishCastles() {\n    if (!isNew() || DIM.cur) return null; const out = [];\n    for (const c of g9castles) { if (!BASE[c[0]]) continue; const [k, cx, cz] = c, S = SIZE[BASE[k]], R = S + 2, gy = gyAt.get(cx + ',' + cz) || (solidTop(cx, cz) + 1);\n      let removed = 0;\n      for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) for (let y = Math.max(2, gy - 3); y < Math.min(H - 1, gy + 26); y++) { const i = idx(x, y, z), b = world[i]; if (!b) continue;\n        if (placedSet && placedSet.has(i)) continue;\n        if (DECOR.has(b)) { world[i] = b === T.RCARPET ? (k === 'black' ? BLK : T.STONEBRICK) : T.AIR; entMeta.delete(keyOf(x, y, z)); chests.delete(keyOf(x, y, z)); removed++; continue; }\n        if (b === T.GLOWROCK || b === T.LAVA && y > gy) { world[i] = T.AIR; continue; }\n        if (STONES.has(b)) { if (k === 'black') world[i] = BLK; else if (k === 'human') { if (b === T.MOSSYBRICK || b === T.COBBLE && y > gy) world[i] = T.STONEBRICK; }\n          else { const r = h3(x, y, z); world[i] = r < 0.45 ? T.MOSSYBRICK : r < 0.6 ? T.COBBLE : T.STONEBRICK; if (y > gy + 4 && r > 0.955 && !world[idx(x, y + 1, z)]) world[i] = T.AIR; } } }\n      // the one chest, in the keep by the front door\n      const KX = S - 6, kz1 = cz - 2, x0 = cx - KX, chx = x0 + 1, chz = kz1 - 1; let chy = gy; while (chy < gy + 3 && world[idx(chx, chy, chz)]) chy++;\n      const loot = k === 'human' ? [[IT.IRONINGOT, 6], [IT.BREAD, 6], [IT.COOKEDMUTTON || IT.MUTTON, 4], [IT.DIAMOND, 3]] : k === 'mossy' ? [[IT.IRONINGOT, 3], [IT.BREAD, 3], [IT.POTATO, 4]] : [[IT.FLINTSTEEL, 1], [T.OBSIDIAN, 4]];\n      const slots = new Array(27).fill(null); loot.forEach(([id, n], j) => { if (id) slots[[4, 10, 13, 16][j]] = [id, n]; });\n      world[idx(chx, chy, chz)] = T.CHEST; chests.set(keyOf(chx, chy, chz), {slots, castle: k}); entMeta.set(keyOf(chx, chy, chz), {face: 1});\n      // blackstone castle: an unfinished portal (2 obsidian missing), a 1x1 lava pool and Hell blocks around it\n      let portal = null;\n      if (k === 'black') { const px = cx - 2, pz = cz + S + 6; if (pz < D - 6) { const g = solidTop(px, pz);\n          for (let x = px - 4; x <= px + 7; x++) for (let z = pz - 4; z <= pz + 4; z++) { const t = solidTop(x, z); if (Math.abs(t - g) > 3) continue; const r = h3(x, 7, z); if (r < 0.7) world[idx(x, t, z)] = r < 0.42 ? T.HELLROCK : r < 0.6 ? T.SOULSAND : T.MAGMA; for (let y = t + 1; y < t + 7; y++) if (world[idx(x, y, z)] && !STONES.has(world[idx(x, y, z)])) world[idx(x, y, z)] = T.AIR; }\n          for (let x = px - 1; x <= px + 2; x++) for (let z = pz - 1; z <= pz + 1; z++) { world[idx(x, g, z)] = T.HELLROCK; for (let y = g + 1; y <= g + 6; y++) world[idx(x, y, z)] = T.AIR; }\n          let n = 0; for (let x = px - 1; x <= px + 2; x++) for (let y = g + 1; y <= g + 5; y++) { const edge = x === px - 1 || x === px + 2 || y === g + 1 || y === g + 5; if (!edge) continue; const miss = (x === px + 2 && y === g + 5) || (x === px - 1 && y === g + 3); world[idx(x, y, pz)] = miss ? T.AIR : T.OBSIDIAN; if (!miss) n++; }\n          world[idx(px + 5, g, pz)] = T.LAVA; portal = [px, g + 1, pz, n]; } }\n      out.push({k, cx, cz, gy, removed, chest: [chx, chy, chz], portal}); }\n    try { scanLights(); validateLights(); } catch (_) {}\n    return out; }", "function finishCastles() {\n    if (!isNew() || DIM.cur) return null; const out = [];\n    /* GLX-LOAD1289 */ const __Lf = window.__glenLoad;\n    const __st = (__Lf && __Lf.held && __Lf._loop && __Lf._loop.finishC) ? __Lf._loop.finishC : null;\n    if (__st && __st.out) Array.prototype.push.apply(out, __st.out);\n    for (let ci = __st ? __st.ci : 0; ci < g9castles.length; ci++) { const c = g9castles[ci]; if (!BASE[c[0]]) continue; const [k, cx, cz] = c, S = SIZE[BASE[k]], R = S + 2, gy = gyAt.get(cx + ',' + cz) || (solidTop(cx, cz) + 1);\n      let removed = 0;\n      for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) for (let y = Math.max(2, gy - 3); y < Math.min(H - 1, gy + 26); y++) { const i = idx(x, y, z), b = world[i]; if (!b) continue;\n        if (placedSet && placedSet.has(i)) continue;\n        if (DECOR.has(b)) { world[i] = b === T.RCARPET ? (k === 'black' ? BLK : T.STONEBRICK) : T.AIR; entMeta.delete(keyOf(x, y, z)); chests.delete(keyOf(x, y, z)); removed++; continue; }\n        if (b === T.GLOWROCK || b === T.LAVA && y > gy) { world[i] = T.AIR; continue; }\n        if (STONES.has(b)) { if (k === 'black') world[i] = BLK; else if (k === 'human') { if (b === T.MOSSYBRICK || b === T.COBBLE && y > gy) world[i] = T.STONEBRICK; }\n          else { const r = h3(x, y, z); world[i] = r < 0.45 ? T.MOSSYBRICK : r < 0.6 ? T.COBBLE : T.STONEBRICK; if (y > gy + 4 && r > 0.955 && !world[idx(x, y + 1, z)]) world[i] = T.AIR; } } }\n      // the one chest, in the keep by the front door\n      const KX = S - 6, kz1 = cz - 2, x0 = cx - KX, chx = x0 + 1, chz = kz1 - 1; let chy = gy; while (chy < gy + 3 && world[idx(chx, chy, chz)]) chy++;\n      const loot = k === 'human' ? [[IT.IRONINGOT, 6], [IT.BREAD, 6], [IT.COOKEDMUTTON || IT.MUTTON, 4], [IT.DIAMOND, 3]] : k === 'mossy' ? [[IT.IRONINGOT, 3], [IT.BREAD, 3], [IT.POTATO, 4]] : [[IT.FLINTSTEEL, 1], [T.OBSIDIAN, 4]];\n      const slots = new Array(27).fill(null); loot.forEach(([id, n], j) => { if (id) slots[[4, 10, 13, 16][j]] = [id, n]; });\n      world[idx(chx, chy, chz)] = T.CHEST; chests.set(keyOf(chx, chy, chz), {slots, castle: k}); entMeta.set(keyOf(chx, chy, chz), {face: 1});\n      // blackstone castle: an unfinished portal (2 obsidian missing), a 1x1 lava pool and Hell blocks around it\n      let portal = null;\n      if (k === 'black') { const px = cx - 2, pz = cz + S + 6; if (pz < D - 6) { const g = solidTop(px, pz);\n          for (let x = px - 4; x <= px + 7; x++) for (let z = pz - 4; z <= pz + 4; z++) { const t = solidTop(x, z); if (Math.abs(t - g) > 3) continue; const r = h3(x, 7, z); if (r < 0.7) world[idx(x, t, z)] = r < 0.42 ? T.HELLROCK : r < 0.6 ? T.SOULSAND : T.MAGMA; for (let y = t + 1; y < t + 7; y++) if (world[idx(x, y, z)] && !STONES.has(world[idx(x, y, z)])) world[idx(x, y, z)] = T.AIR; }\n          for (let x = px - 1; x <= px + 2; x++) for (let z = pz - 1; z <= pz + 1; z++) { world[idx(x, g, z)] = T.HELLROCK; for (let y = g + 1; y <= g + 6; y++) world[idx(x, y, z)] = T.AIR; }\n          let n = 0; for (let x = px - 1; x <= px + 2; x++) for (let y = g + 1; y <= g + 5; y++) { const edge = x === px - 1 || x === px + 2 || y === g + 1 || y === g + 5; if (!edge) continue; const miss = (x === px + 2 && y === g + 5) || (x === px - 1 && y === g + 3); world[idx(x, y, pz)] = miss ? T.AIR : T.OBSIDIAN; if (!miss) n++; }\n          world[idx(px + 5, g, pz)] = T.LAVA; portal = [px, g + 1, pz, n]; } }\n      out.push({k, cx, cz, gy, removed, chest: [chx, chy, chz], portal});\n      if (__Lf && __Lf.held && ci + 1 < g9castles.length) {\n        if (!__Lf._loop) __Lf._loop = {};\n        __Lf._loop.finishC = {ci: ci + 1, out: out};\n        try { __Lf.touch(80, 'Raising the keeps\u2026', 92); } catch (_) {}\n        throw __Lf.YIELD;\n      }\n    }\n    if (__Lf && __Lf._loop) __Lf._loop.finishC = null;\n    try { scanLights(); validateLights(); } catch (_) {}\n    return out; }", "finishCastles slice");
html = replaceOnce(html, "function carveCaves() {\n    if (!isNew() || DIM.cur || genVer !== GEN9 || W < 200) return null;\n    let sd = (gSeed ^ 0x2c1b3c6d) >>> 0 || 7; const rnd = () => (sd = (Math.imul(sd, 16807) >>> 0) % 2147483647) / 2147483647;\n    const soft = b => b === T.STONE || b === T.DIRT || b === T.DEEPSLATE || b === T.GRASS || b === T.HEATHER || b === T.SAND || b === T.PEAT || b === T.MUD || b === T.GRAVEL || b === T.COALORE || b === T.IRONORE || b === T.COPPERORE || b === T.GOLDORE || b === T.REDORE || b === T.DIAMONDORE || b === T.COBBLE || b === T.LAVA;\n    const wet = (x, y, z) => world[idx(x, y + 1, z)] === T.WATER || world[idx(x + 1, y, z)] === T.WATER || world[idx(x - 1, y, z)] === T.WATER || world[idx(x, y, z + 1)] === T.WATER || world[idx(x, y, z - 1)] === T.WATER;\n    const ball = (cx, cy, cz, r, ry, minY) => { const R = Math.ceil(r), Ry = Math.ceil(ry);\n      for (let x = Math.max(3, Math.floor(cx - R)); x <= Math.min(W - 4, cx + R); x++) for (let z = Math.max(3, Math.floor(cz - R)); z <= Math.min(D - 4, cz + R); z++) for (let y = Math.max(minY || 3, Math.floor(cy - Ry)); y <= Math.min(H - 3, cy + Ry); y++) {\n        const dx = (x - cx) / r, dy = (y - cy) / ry, dz = (z - cz) / r; if (dx * dx + dy * dy + dz * dz > 1) continue; const i = idx(x, y, z); if (!soft(world[i]) || wet(x, y, z)) continue; if (placedSet && placedSet.has(i)) continue; world[i] = T.AIR; } };\n    const away = (x, z) => g9castles.every(c => Math.hypot(c[1] - x, c[2] - z) > 34);\n    const st = {entrances: 0, caverns: 0, deep: 0, list: []};\n    const nE = Math.max(12, Math.round(W * D / 9000));\n    for (let n = 0, t = 0; n < nE && t < nE * 20; t++) {\n      const x0 = 12 + rnd() * (W - 24), z0 = 12 + rnd() * (D - 24); if (!away(x0, z0)) continue; const top = solidTop(Math.floor(x0), Math.floor(z0)); if (top <= SEA + 2 || world[idx(Math.floor(x0), top, Math.floor(z0))] === T.WATER) continue;\n      // the path: a winding tunnel stepping down at a walkable slope into a big open cavern\n      let x = x0, y = top + 1, z = z0, yaw = rnd() * 6.283; const floorY = 14 + rnd() * 14;\n      for (let k = 0; k < 220 && y > floorY; k++) { const r = 1.9 + Math.sin(k * 0.3) * 0.35; ball(x, y, z, r, r * 1.15);\n        yaw += (rnd() - 0.5) * 0.35; x += Math.cos(yaw) * 0.85; z += Math.sin(yaw) * 0.85; y -= 0.42; if (x < 12 || z < 12 || x > W - 12 || z > D - 12) { yaw += Math.PI; x = Math.max(13, Math.min(W - 13, x)); z = Math.max(13, Math.min(D - 13, z)); } }\n      const r = 9 + rnd() * 6; ball(x + Math.cos(yaw) * r * 0.6, y + 2, z + Math.sin(yaw) * r * 0.6, r, 5 + rnd() * 3); st.caverns++; st.list.push([Math.round(x0), top, Math.round(z0), Math.round(x + Math.cos(yaw) * r * 0.6), Math.round(y + 2), Math.round(z + Math.sin(yaw) * r * 0.6), Math.round(r)]);\n      // a couple of side galleries off the cavern\n      for (let g = 0; g < 2; g++) { let gx = x, gz = z, gy = y + 1, gyaw = rnd() * 6.283; for (let k = 0; k < 40; k++) { ball(gx, gy, gz, 2.2, 2); gyaw += (rnd() - .5) * 0.4; gx += Math.cos(gyaw); gz += Math.sin(gyaw); gy += (rnd() - 0.5) * 0.4; if (gx < 10 || gz < 10 || gx > W - 10 || gz > D - 10) break; } }\n      st.entrances++; n++; }\n    // deep caverns by the bedrock, walls of deepslate cobble\n    const deep = []; const nD = 3;\n    for (let n = 0, t = 0; n < nD && t < 200; t++) { const cx = 30 + rnd() * (W - 60), cz = 30 + rnd() * (D - 60); if (deep.some(d => Math.hypot(d[0] - cx, d[2] - cz) < 60)) continue;\n      const cy = 9, r = 11 + rnd() * 5, ry = 5.5; ball(cx, cy, cz, r, ry, 3);\n      for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) for (let z = Math.floor(cz - r - 2); z <= cz + r + 2; z++) for (let y = 2; y <= cy + ry + 2; y++) { if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) continue; const i = idx(x, y, z), b = world[i]; if (!b || b === T.WATER) continue;\n        if (b === T.LAVA) { world[i] = T.AIR; continue; } const nearAir = !world[idx(x + 1, y, z)] || !world[idx(x - 1, y, z)] || !world[idx(x, y + 1, z)] || !world[idx(x, y - 1, z)] || !world[idx(x, y, z + 1)] || !world[idx(x, y, z - 1)];\n        if (nearAir && y > 1 && Math.hypot(x - cx, z - cz) < r + 2) world[i] = DSC; }\n      // and a long sloping shaft linking it up to the nearest open cave\n      let x = cx, y = cy + 2, z = cz, yaw = rnd() * 6.283; for (let k = 0; k < 90 && y < 26; k++) { ball(x, y, z, 2, 2.2); yaw += (rnd() - .5) * 0.3; x += Math.cos(yaw) * 0.9; z += Math.sin(yaw) * 0.9; y += 0.4; if (x < 10 || z < 10 || x > W - 10 || z > D - 10) yaw += Math.PI; }\n      deep.push([cx, cy, cz, r]); st.deep++; n++; }\n    window.__deepCaves = deep; return st; }", "function carveCaves() {\n    if (!isNew() || DIM.cur || genVer !== GEN9 || W < 200) return null;\n    /* GLX-LOAD1289 */ const __Cv = window.__glenLoad;\n    const __sv = (__Cv && __Cv.held && __Cv._loop && __Cv._loop.carve) ? __Cv._loop.carve : null;\n    let sd = __sv ? __sv.sd : ((gSeed ^ 0x2c1b3c6d) >>> 0 || 7); const rnd = () => (sd = (Math.imul(sd, 16807) >>> 0) % 2147483647) / 2147483647;\n    const soft = b => b === T.STONE || b === T.DIRT || b === T.DEEPSLATE || b === T.GRASS || b === T.HEATHER || b === T.SAND || b === T.PEAT || b === T.MUD || b === T.GRAVEL || b === T.COALORE || b === T.IRONORE || b === T.COPPERORE || b === T.GOLDORE || b === T.REDORE || b === T.DIAMONDORE || b === T.COBBLE || b === T.LAVA;\n    const wet = (x, y, z) => world[idx(x, y + 1, z)] === T.WATER || world[idx(x + 1, y, z)] === T.WATER || world[idx(x - 1, y, z)] === T.WATER || world[idx(x, y, z + 1)] === T.WATER || world[idx(x, y, z - 1)] === T.WATER;\n    const ball = (cx, cy, cz, r, ry, minY) => { const R = Math.ceil(r), Ry = Math.ceil(ry);\n      for (let x = Math.max(3, Math.floor(cx - R)); x <= Math.min(W - 4, cx + R); x++) for (let z = Math.max(3, Math.floor(cz - R)); z <= Math.min(D - 4, cz + R); z++) for (let y = Math.max(minY || 3, Math.floor(cy - Ry)); y <= Math.min(H - 3, cy + Ry); y++) {\n        const dx = (x - cx) / r, dy = (y - cy) / ry, dz = (z - cz) / r; if (dx * dx + dy * dy + dz * dz > 1) continue; const i = idx(x, y, z); if (!soft(world[i]) || wet(x, y, z)) continue; if (placedSet && placedSet.has(i)) continue; world[i] = T.AIR; } };\n    const away = (x, z) => g9castles.every(c => Math.hypot(c[1] - x, c[2] - z) > 34);\n    const st = (__sv && __sv.st) ? __sv.st : {entrances: 0, caverns: 0, deep: 0, list: []};\n    const nE = Math.max(12, Math.round(W * D / 9000));\n    let __tE = performance.now(), __wE = Date.now();\n    if (!__sv || __sv.phase === 'ent') {\n    for (let n = (__sv && __sv.phase === 'ent') ? (__sv.n || 0) : 0, t = (__sv && __sv.phase === 'ent') ? (__sv.t || 0) : 0; n < nE && t < nE * 20; t++) {\n      const x0 = 12 + rnd() * (W - 24), z0 = 12 + rnd() * (D - 24); if (!away(x0, z0)) continue; const top = solidTop(Math.floor(x0), Math.floor(z0)); if (top <= SEA + 2 || world[idx(Math.floor(x0), top, Math.floor(z0))] === T.WATER) continue;\n      // the path: a winding tunnel stepping down at a walkable slope into a big open cavern\n      let x = x0, y = top + 1, z = z0, yaw = rnd() * 6.283; const floorY = 14 + rnd() * 14;\n      for (let k = 0; k < 220 && y > floorY; k++) { const r = 1.9 + Math.sin(k * 0.3) * 0.35; ball(x, y, z, r, r * 1.15);\n        yaw += (rnd() - 0.5) * 0.35; x += Math.cos(yaw) * 0.85; z += Math.sin(yaw) * 0.85; y -= 0.42; if (x < 12 || z < 12 || x > W - 12 || z > D - 12) { yaw += Math.PI; x = Math.max(13, Math.min(W - 13, x)); z = Math.max(13, Math.min(D - 13, z)); } }\n      const r = 9 + rnd() * 6; ball(x + Math.cos(yaw) * r * 0.6, y + 2, z + Math.sin(yaw) * r * 0.6, r, 5 + rnd() * 3); st.caverns++; st.list.push([Math.round(x0), top, Math.round(z0), Math.round(x + Math.cos(yaw) * r * 0.6), Math.round(y + 2), Math.round(z + Math.sin(yaw) * r * 0.6), Math.round(r)]);\n      // a couple of side galleries off the cavern\n      for (let g = 0; g < 2; g++) { let gx = x, gz = z, gy = y + 1, gyaw = rnd() * 6.283; for (let k = 0; k < 40; k++) { ball(gx, gy, gz, 2.2, 2); gyaw += (rnd() - .5) * 0.4; gx += Math.cos(gyaw); gz += Math.sin(gyaw); gy += (rnd() - 0.5) * 0.4; if (gx < 10 || gz < 10 || gx > W - 10 || gz > D - 10) break; } }\n      st.entrances++; n++;\n      if (__Cv && __Cv.held && ((performance.now() - __tE > 200) || (Date.now() - __wE > 200))) {\n        if (!__Cv._loop) __Cv._loop = {};\n        __Cv._loop.carve = {phase: 'ent', sd: sd, n: n, t: t + 1, st: st};\n        try { __Cv.touch(82, 'Carving the caves\u2026 ' + n + '/' + nE, 92); } catch (_) {}\n        throw __Cv.YIELD;\n      }\n    } }\n\n    // deep caverns by the bedrock, walls of deepslate cobble\n    const deep = (__sv && __sv.deep) ? __sv.deep : []; const nD = 3;\n    let __tD = performance.now(), __wD = Date.now();\n    for (let n = (__sv && __sv.phase === 'deep') ? (__sv.n || 0) : 0, t = (__sv && __sv.phase === 'deep') ? (__sv.t || 0) : 0; n < nD && t < 200; t++) { const cx = 30 + rnd() * (W - 60), cz = 30 + rnd() * (D - 60); if (deep.some(d => Math.hypot(d[0] - cx, d[2] - cz) < 60)) continue;\n      const cy = 9, r = 11 + rnd() * 5, ry = 5.5; ball(cx, cy, cz, r, ry, 3);\n      for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) for (let z = Math.floor(cz - r - 2); z <= cz + r + 2; z++) for (let y = 2; y <= cy + ry + 2; y++) { if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) continue; const i = idx(x, y, z), b = world[i]; if (!b || b === T.WATER) continue;\n        if (b === T.LAVA) { world[i] = T.AIR; continue; } const nearAir = !world[idx(x + 1, y, z)] || !world[idx(x - 1, y, z)] || !world[idx(x, y + 1, z)] || !world[idx(x, y - 1, z)] || !world[idx(x, y, z + 1)] || !world[idx(x, y, z - 1)];\n        if (nearAir && y > 1 && Math.hypot(x - cx, z - cz) < r + 2) world[i] = DSC; }\n      // and a long sloping shaft linking it up to the nearest open cave\n      let x = cx, y = cy + 2, z = cz, yaw = rnd() * 6.283; for (let k = 0; k < 90 && y < 26; k++) { ball(x, y, z, 2, 2.2); yaw += (rnd() - .5) * 0.3; x += Math.cos(yaw) * 0.9; z += Math.sin(yaw) * 0.9; y += 0.4; if (x < 10 || z < 10 || x > W - 10 || z > D - 10) yaw += Math.PI; }\n      deep.push([cx, cy, cz, r]); st.deep++; n++;\n      if (__Cv && __Cv.held && ((performance.now() - __tD > 200) || (Date.now() - __wD > 200))) {\n        if (!__Cv._loop) __Cv._loop = {};\n        __Cv._loop.carve = {phase: 'deep', sd: sd, n: n, t: t + 1, st: st, deep: deep};\n        try { __Cv.touch(83, 'Carving the caves\u2026', 92); } catch (_) {}\n        throw __Cv.YIELD;\n      }\n    }\n    if (__Cv && __Cv._loop) __Cv._loop.carve = null;\n    window.__deepCaves = deep; return st; }", "carveCaves slice");

html = replaceOnce(html, 'if (guarded > 20000)', 'if (guarded > 100000)', 'raise yield overflow cap');
must(html.includes('if (guarded > 100000)'), 'yield overflow cap is 100000');
must(!html.includes('if (guarded > 20000)'), 'old 20000 yield cap is gone');

if (!html.includes('<!-- glencraft-build: load1289 -->')) {
  html = replaceOnce(
    html,
    '<!-- glencraft-build: load1285 -->',
    '<!-- glencraft-build: load1285 -->\n<!-- glencraft-build: load1289 -->',
    'load1289 marker'
  );
}

must(html.includes("const GAME_VERSION = '1.2.88';"), 'version still 1.2.88');
must(!html.includes("const GAME_VERSION = '1.2.89';"), 'no 1.2.89 version bump');
must(html.includes('/* GLX-LOAD1289 */'), 'LOAD1289 markers present');
must(html.includes('__Ld._loop.diamonds'), 'diamondBoost is sliced');
must(html.includes('__Lt._loop.torches'), 'fixTorches is sliced');
must(html.includes('__parkSettle'), 'c39Settle is sliced');
must(html.includes("__Lo._loop.c77"), 'c77 orePass is sliced');
must(html.includes("phase: 'veins'") && html.includes('__st.sd == null') && html.includes('__Lo._loop.c104'), 'c104 veins are sliced');
must(html.includes('__Lc._loop.c104cave'), 'cavePass is sliced');
must(html.includes('held && window.__c77)) window.__c77 = null') && html.includes('try { window.__c77 = null; } catch (_) {}'), 'c104 does not drop __c77 on a held resume');

must(html.includes('veinJobs'), 'GEN9 ores are sliced');
must(html.includes('__Lv._loop.silver'), 'placeOreVeins is sliced');
must(html.includes('__Lh._loop.hives'), 'placeHives is sliced');
must(html.includes("__Lk._loop.keeps"), 'g9PlaceCastles is sliced');
must(html.includes('__L4._loop.c41'), 'c41Castles is sliced');
must(html.includes('__Lf._loop.finishC'), 'finishCastles is sliced');
must(html.includes('__Cv._loop.carve'), 'carveCaves is sliced');
must(html.includes('Date.now() - __wT') && !html.includes('++__nT >= 4'), 'fixTorches uses wall-clock slice cap without a 4-column forced yield');

must(html.includes('coop("c104caves"') || html.includes('coop(\"c104caves\"') || html.includes('coop("c104caves"'), 'cavePass is coop-wrapped');

must(html.includes('const resume9 = function') && html.includes('__glenLoad._g12 = on'), 'GEN9 resume re-holds c37busy/__g12 wrapper flags');

must(html.includes('GLX-LOAD1289 timer gate') && html.includes('tick.__tgFree = 1') && html.includes('__tgate.flush()'), 'timer gate holds game timers during sliced generate');

const vj = fs.readFileSync(path.join(root, 'version.json'), 'utf8');
must(JSON.parse(vj).v === '1.2.88', 'version.json stays 1.2.88');

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('build load1289 ok, index bytes', html.length, 'version stays 1.2.88');
