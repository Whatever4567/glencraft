/* ===================== GLX-C167 (v1.0.31): Hell overhaul 1 - a bigger nether (384 wide), four biomes, four gothic build sites carved into great caverns ===================== */
(function c167() {
  const U = window.__c167 = {b: [], props: [], err: null, st: {}, ms: 0, retro: null, R: 23};
  const BS = 248, DB = 228, DC = 249, DT = 229, OB = T.OBSIDIAN || 189, HR = T.HELLROCK || 206, SS = T.SOULSAND || 207, MG = T.MAGMA || 208, GR = T.GLOWROCK || 209, HB = T.HELLBRICK || 210;
  U.ids = {BS, DB, DC, DT, OB, HR, SS, MG, GR, HB};
  const NAT = U.NAT = new Set([0, HR, T.LAVA, MG, SS, GR, T.GOLDORE, T.COBALTORE, T.HBEDROCK, T.FIRE, BS, DC, DT].filter(v => v !== undefined));
  U.KINDS = ['cathedral', 'abbey', 'keep', 'bastion'];
  U.NAME = {cathedral: 'the Black Cathedral', abbey: 'the Soul Abbey', keep: 'the Ember Keep', bastion: 'the Hound Bastion'};
  U.BIOME = ['Blackstone Wastes', 'Soul Sand Valley', 'Ember Wastes', 'Basalt Deltas'];
  const hh = U.hh = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ 0x167; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const inW = (x, y, z) => x > 1 && z > 1 && x < W - 2 && z < D - 2 && y > 0 && y < H - 1;
  // ---------- where the four builds go: the four diagonals off the old fortress ----------
  const fortDist = (x, z) => { const f = hellFort; if (!f) return 1e9; const sx = Math.max(f.x - 56, Math.min(f.x + 42, x)), sz = Math.max(f.z - 54, Math.min(f.z + 50, z));
    return Math.min(Math.hypot(x - sx, z - f.z), Math.hypot(x - f.x, z - sz)); };
  U.fortDist = fortDist;
  function siteOk(x, z, gy, retro, taken) { const R = U.R, RD = R + 8; if (x - RD < 3 || z - RD < 3 || x + RD > W - 4 || z + RD > D - 4) return false;
    if (fortDist(x, z) < RD + 2) return false; for (const t of taken) if (Math.hypot(t[1] - x, t[2] - z) < RD * 2 + 6) return false;
    const sp = window.__hellAt || [40, 50]; if (Math.hypot(sp[0] - x, sp[1] - z) < RD + 8) return false;
    if (!retro) return true;
    if (typeof P !== 'undefined' && Math.hypot(P.x - x, P.z - z) < RD + 6) return false;
    for (let a = x - RD; a <= x + RD; a++) for (let b = z - RD; b <= z + RD; b++) { if (Math.hypot(a - x, b - z) > RD + 1) continue; for (let y = HELL_LAVA - 2; y < H - 1; y++) if (!NAT.has(world[idx(a, y, b)])) return false; }
    return true; }
  U.pickOne = function (i, retro, out) { const f = hellFort || {x: W >> 1, z: D >> 1}, off = Math.min(95, (W >> 1) - 34), gy = 18, [a, b] = [[-1, -1], [1, -1], [-1, 1], [1, 1]][i];
    const J = [[0, 0], [8, 0], [0, 8], [-8, 0], [0, -8], [12, 12], [-12, 12], [12, -12], [-12, -12], [20, 0], [0, 20], [-20, 0], [0, -20]], bx = f.x + a * off, bz = f.z + b * off;
    for (const [jx, jz] of J) { const x = Math.round(bx + jx * a), z = Math.round(bz + jz * b); if (siteOk(x, z, gy, retro, out)) { const dx = f.x - x, dz = f.z - z;
        const rot = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 3 : 1) : (dz > 0 ? 0 : 2); return [U.KINDS[i], x, z, gy, rot]; } }
    return null; };
  U.pick = function (retro) { const out = []; for (let i = 0; i < 4; i++) { const e = U.pickOne(i, retro, out); if (e) out.push(e); } return out; };
  // ---------- biomes: each build owns the land nearest it (warped), the old fortress keeps the crimson wastes ----------
  U.biomeAt = (x, z) => { const B = U.b; if (!B || !B.length) return -1; if (fortDist(x, z) < 14) return -1;
    const wx = x + (hh(x >> 3, 1, z >> 3) - 0.5) * 22, wz = z + (hh(x >> 3, 2, z >> 3) - 0.5) * 22; let bi = -1, bd = 1e9;
    for (const b of B) { const d = Math.hypot(b[1] - wx, b[2] - wz); if (d < bd) { bd = d; bi = U.KINDS.indexOf(b[0]); } } return bi; };
  // convert one column to its biome (natural rock only)
  U.column = function (x, z) { const bi = U.biomeAt(x, z); if (bi < 0) return 0; let n = 0;
    for (let y = 1; y < H - 1; y++) { const i = idx(x, y, z), b = world[i]; if (b !== HR && b !== SS && b !== MG) continue; const up = world[i + D], v = hh(x, y, z), top = up === 0 || up === T.LAVA; let nb = b;
      if (bi === 0) nb = top ? (v < 0.05 ? MG : v < 0.7 ? BS : DC) : (v < 0.62 ? BS : v < 0.86 ? DC : HR);
      else if (bi === 1) nb = top || world[i + 2 * D] === 0 ? (v < 0.9 ? SS : DC) : (b === MG ? SS : v < 0.28 ? DC : HR);
      else if (bi === 2) nb = top ? (v < 0.16 ? MG : v < 0.2 ? GR : HR) : (b === SS ? HR : b);
      else nb = top ? (v < 0.1 ? MG : v < 0.6 ? DC : DT) : (v < 0.5 ? DC : v < 0.8 ? BS : DT);
      if (nb !== b) { world[i] = nb; n++; } }
    // ember wastes: extra glowing drips from the roof (light)
    if (bi === 2 && hh(x, 77, z) < 0.03) for (let y = H - 3; y > 30; y--) { const i = idx(x, y, z); if (world[i] === 0 && world[i + D] === HR) { const L = 1 + (hh(z, 5, x) * 3 | 0); for (let k = 0; k < L && world[i - k * D] === 0; k++) world[i - k * D] = GR; break; } }
    return n; };
  // ---------- the cavern + foundation for one build (world coords) ----------
  const floorB = (k, x, z, v) => k === 'cathedral' ? (v < 0.45 ? BS : v < 0.72 ? DC : v < 0.8 ? MG : BS) : k === 'abbey' ? (v < 0.78 ? SS : v < 0.9 ? DC : BS) : k === 'keep' ? (v < 0.55 ? HR : v < 0.78 ? MG : v < 0.84 ? GR : HB) : (v < 0.45 ? DC : v < 0.8 ? DT : MG);
  U.cavern = function (b, retro) { const [k, cx, cz, gy] = b, R = U.R, RD = R + 7, top = H - 3; let n = 0;
    const set = (x, y, z, v) => { if (!inW(x, y, z)) return; const i = idx(x, y, z); if (retro && !NAT.has(world[i])) return; if (world[i] !== v) { world[i] = v; n++; } };
    for (let x = cx - RD - 2; x <= cx + RD + 2; x++) for (let z = cz - RD - 2; z <= cz + RD + 2; z++) { const r = Math.hypot(x - cx, z - cz) + (hh(x, 7, z) - 0.5) * 2.4; if (r > RD + 1) continue;
      for (let y = HELL_LAVA - 3; y <= gy; y++) set(x, y, z, y === gy ? floorB(k, x, z, hh(x, 3, z)) : (hh(x, y, z) < 0.7 ? BS : DC));
      for (let y = gy + 1; y <= top; y++) { const t = (y - gy) / (top - gy), rd = RD * Math.sqrt(Math.max(0, 1 - t * t)) + (hh(x, y, z) - 0.5) * 2.2; if (r < rd) set(x, y, z, 0); } }
    return n; };
  // ---------- the whole pass for one build: cavern, gothic build (c168), roof chains ----------
  U.raise = function (b, i, retro) { const t0 = performance.now(); U.cavern(b, retro);
    const ps = placedSet, keep = window.__c150 ? __c150.props : null, mine = [];
    try { placedSet = new Set(); if (window.__c150) __c150.props = mine; const K = __c151.ctx([b[0], b[1], b[2]], i, b[3], b[4]); window.__c168.build(K, b[0]);
      // great chains from the cavern roof down to the ground, in a ring outside the moat
      for (let j = 0; j < 10; j++) { const an = j / 10 * 6.283 + hh(i, j, 9) * 0.4, rr = 24 + hh(j, i, 3) * 4, x = Math.round(b[1] + Math.cos(an) * rr), z = Math.round(b[2] + Math.sin(an) * rr);
        let y = b[3] + 2; while (y < H - 2 && world[idx(x, y, z)] === 0) y++; if (y >= H - 2 || y - b[3] < 8) continue;
        mine.push({t: 'chain', c: i, x, y: y - 1, z, f: 0, L: y - 1 - b[3], a: [x, y, z, world[idx(x, y, z)]]}); }
    } catch (e) { U.err = String(e && e.stack || e); } finally { placedSet = ps; if (window.__c150) __c150.props = keep; }
    U.props = U.props.filter(p => p.c !== i).concat(mine); U.ms = Math.max(U.ms, Math.round(performance.now() - t0)); return mine.length; };
  // ---------- the old fortress gets glowing lamps (was too dark) ----------
  U.fortLights = function () { const f = hellFort; if (!f) return 0; const fy = f.y - 1; let n = 0; const sw = (x, y, z) => { if (!inW(x, y, z)) return; const i = idx(x, y, z); if (world[i] === HB) { world[i] = GR; n++; } };
    for (let x = f.x - 56; x <= f.x + 42; x += 9) { sw(x, fy + 1, f.z - 2); sw(x, fy + 1, f.z + 2); }
    for (let z = f.z - 54; z <= f.z + 50; z += 9) { sw(f.x - 2, fy + 1, z); sw(f.x + 2, fy + 1, z); }
    for (const [cx, cz, r] of [[f.x, f.z, 6], [f.x + 36, f.z, 4], [f.x, f.z + 44, 4], [f.x - 52, f.z, 4]]) for (const [a, q] of [[-r, -2], [-r, 2], [r, -2], [r, 2], [-2, -r], [2, -r], [-2, r], [2, r]]) sw(cx + a, fy + 3, cz + q);
    return n; };
  // ---------- new / reset Hells: bigger (c77 now makes it 384), biomes everywhere, the four builds ----------
  const gh = genHell; genHell = function () { const r = gh.apply(this, arguments);
    try { const t0 = performance.now(); U.props = []; U.b = U.pick(false); let n = 0; for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) n += U.column(x, z);
      U.b.forEach((b, i) => U.raise(b, i, false)); U.st = {biome: n, builds: U.b.map(b => b[0] + '@' + b[1] + ',' + b[2]), fort: U.fortLights(), ms: Math.round(performance.now() - t0), W}; U.retro = null; U.v = 1;
    } catch (e) { U.err = String(e && e.stack || e); } return r; };
})();
