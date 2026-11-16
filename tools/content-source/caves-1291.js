/* GLX-C274 (v1.2.91): Highlands caves. The normal walkable top layer is kept
   (small surface pits are still filled) but each seed now grows a Minecraft-like
   network: interconnecting spaghetti tunnels that open into cheese caverns with
   pillars and ledges the deeper you go, plus ravines and big sinkholes that drop
   into that network, sealed or flooded underwater caves with no broken water,
   and a follow-up ore pass so every area gets veins and rare ores (diamond, gold,
   silver) get more common with depth. New / reset g89 worlds only. */
(function c274() {
  const U = window.__c274 = {err: null, ms: 0, filled: 0, worms: 0, cells: 0, mouths: [], halls: 0, ravines: 0, holes: 0, uw: 0, seams: 0, cover: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const on = () => !!(window.__g89 && __g89());
  let NAT = null;
  const nat = b => { if (!NAT) { NAT = new Uint8Array(1024); for (const v of [T.STONE, T.DEEPSLATE, T.DIRT, T.GRAVEL, T.COALORE, T.IRONORE, T.COPPERORE, T.GOLDORE, T.REDORE, T.DIAMONDORE, T.SILVERORE, T.GRASS, T.HEATHER, T.PEAT, T.MUD, T.SAND, 156, 178]) if (v !== undefined) NAT[v] = 1; } return !!NAT[b]; };
  const inB = (x, y, z) => x > 2 && z > 2 && y > 2 && x < W - 3 && z < D - 3 && y < H - 2;
  const placed = i => !!(typeof placedSet !== 'undefined' && placedSet && placedSet.has(i));
  const wet = (x, y, z) => world[idx(x, y + 1, z)] === T.WATER || world[idx(x + 1, y, z)] === T.WATER || world[idx(x - 1, y, z)] === T.WATER || world[idx(x, y, z + 1)] === T.WATER || world[idx(x, y, z - 1)] === T.WATER;
  const tops = () => { const t = new Int16Array(W * D); for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { const c = x * H * D + z; let y = H - 2; for (; y > 1; y--) { const b = world[c + y * D]; if (b && !PLANT[b] && !LEAFY[b] && !LOGGY[b]) break; } t[x * D + z] = y; } return t; };
  const inside = (x, z, m) => window.__c273 ? __c273.edgeQ(x, z) < __c273.RE() - m : true;
  const midAway = (x, z) => Math.hypot(x - (W >> 1), z - (D >> 1)) >= 70;
  // 1) fill pits: a column far below nearly all of its neighbours (not a ravine, not water) is filled back up to the ground
  function pits(tp) { let n = 0;
    for (let p = 0; p < 2; p++) for (let x = 3; x < W - 3; x++) for (let z = 3; z < D - 3; z++) { const t = tp[x * D + z]; if (!inside(x, z, 8)) continue;
      const hs = []; for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, -2], [2, -2], [-2, 2]]) hs.push(tp[(x + dx) * D + z + dz]);
      hs.sort((a, b) => a - b); const med = hs[4]; if (t >= med - 2 || hs[1] < med - 2) continue;
      const c = x * H * D + z; if (world[c + (t + 1) * D] === T.WATER || world[c + t * D] === T.WATER || med <= SEA) continue;
      let ok = true; for (let y = t + 1; y <= med; y++) { const b = world[c + y * D]; if (b && !PLANT[b]) { ok = false; break; } } if (!ok) continue;
      const g = world[c + med * D + 0] || T.GRASS;
      for (let y = t + 1; y <= med; y++) world[c + y * D] = y === med ? T.GRASS : y >= med - 3 ? T.DIRT : T.STONE; tp[x * D + z] = med; n++; if (g) {} }
    U.filled = n; }
  function makeCarve(tp, cellsRef) {
    const carve = (cx, cy, cz, r, keep, opts) => {
      opts = opts || {};
      const openSky = !!opts.openSky, flooded = !!opts.flooded, sealed = !!opts.sealed;
      const fill = flooded ? T.WATER : (opts.fill != null ? opts.fill : ((cy <= 6 && !openSky) ? T.LAVA : 0));
      const R = Math.ceil(r);
      for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) for (let dz = -R; dz <= R; dz++) {
        if (dx * dx + dy * dy * (openSky ? 0.45 : 1.3) + dz * dz > r * r) continue;
        const x = Math.round(cx + dx), y = Math.round(cy + dy), z = Math.round(cz + dz);
        if (!inB(x, y, z) || !inside(x, z, openSky ? 10 : 12)) continue;
        const tt = tp[x * D + z] || 60;
        if (keep && !openSky && y > tt - keep) continue;
        if (openSky && y > tt + 3) continue;
        const i = idx(x, y, z); if (placed(i)) continue;
        const b = world[i];
        const soft = nat(b) || (openSky && (!b || (typeof PLANT !== 'undefined' && PLANT[b]) || (typeof LEAFY !== 'undefined' && LEAFY[b]) || (typeof LOGGY !== 'undefined' && LOGGY[b])));
        if (!soft) continue;
        if (sealed && (wet(x, y, z) || b === T.WATER)) continue;
        if (flooded && !b && !nat(b)) {
          // already air: only fill if this is still under a roof / not a land cave open to sky
          if (y >= tt - 1) continue;
        }
        if (!flooded && !openSky && !sealed && wet(x, y, z)) continue;
        world[i] = fill; cellsRef.n++;
      }
    };
    return carve;
  }
  function pickRare(y, rnd) {
    const r = rnd();
    if (y <= 8) return r < 0.14 ? T.DIAMONDORE : r < 0.30 ? T.GOLDORE : r < 0.52 ? T.SILVERORE : r < 0.78 ? T.IRONORE : T.COALORE;
    if (y <= 14) return r < 0.06 ? T.DIAMONDORE : r < 0.18 ? T.GOLDORE : r < 0.40 ? T.SILVERORE : r < 0.70 ? T.IRONORE : T.COALORE;
    if (y <= 20) return r < 0.08 ? T.GOLDORE : r < 0.28 ? T.SILVERORE : r < 0.62 ? T.IRONORE : T.COALORE;
    if (y <= SEA - 6) return r < 0.12 ? T.SILVERORE : r < 0.50 ? T.IRONORE : T.COALORE;
    return r < 0.38 ? T.IRONORE : r < 0.95 ? T.COALORE : T.SILVERORE;
  }
  function host(b) { return b === T.STONE || b === T.DEEPSLATE || b === T.ANDESITE || b === T.GRANITE || b === T.DIORITE || b === T.TUFF || b === T.GRAVEL; }
  // 2) the seed's own cave network: spaghetti, cheese, ravines, sinkholes, underwater
  function runNetwork(tp, rnd, getSd, t0, st) {
    const cellsRef = {n: st && st.cells != null ? st.cells : 0};
    const carve = makeCarve(tp, cellsRef);
    U.carve = (cx, cy, cz, r, keep, opts) => carve(cx, cy, cz, r, keep, opts);
    let pts = (st && st.pts) ? st.pts : [];
    let phase = st && st.phase ? st.phase : 'worms';
    let i0 = st && st.i != null ? st.i : 0;
    let __tS = performance.now(), __wS = Date.now();
    const bump = (ph, i) => {
      U.cells = cellsRef.n;
      const L = window.__glenLoad;
      if (L && L.held && ((performance.now() - __tS > (__SLB())) || (Date.now() - __wS > (__SLB())))) {
        if (!L._loop) L._loop = {};
        L._loop.c274 = {phase: ph, i: i, sd: getSd(), t0: t0, pts: pts, usedW: usedW, usedS: usedS, usedU: usedU, cells: cellsRef.n,
          worms: U.worms, halls: U.halls, ravines: U.ravines, holes: U.holes, uw: U.uw, seams: U.seams, cover: U.cover};
        try { L.touch(84, 'Carving the caves…', 92); } catch (_) {}
        throw L.YIELD;
      }
    };
    const usedW = (st && st.usedW) ? st.usedW : [];
    const usedS = (st && st.usedS) ? st.usedS : [];
    const usedU = (st && st.usedU) ? st.usedU : [];
    const takeSpot = (minD, land, bag, tries) => {
      for (let t = 0; t < (tries || 80); t++) {
        const x = 40 + rnd() * (W - 80), z = 40 + rnd() * (D - 80);
        if (!inside(x, z, 20) || !midAway(x, z)) continue;
        const X = Math.round(x), Z = Math.round(z), tt = tp[X * D + Z] || 0;
        if (land && (tt <= SEA + 2 || world[idx(X, Math.min(H - 2, tt + 1), Z)] === T.WATER)) continue;
        if (!land && tt > SEA) continue;
        if (bag.some(p => Math.hypot(p[0] - x, p[1] - z) < minD)) continue;
        bag.push([x, z]); return [x, z, tt];
      }
      return null;
    };
    const cheeseAt = (cx, cy, cz, rx, ry, rz, rnd0) => {
      const Rx = Math.ceil(rx), Ry = Math.ceil(ry), Rz = Math.ceil(rz), ph = rnd0() * 6.28;
      for (let dx = -Rx; dx <= Rx; dx++) for (let dy = -Ry; dy <= Ry; dy++) for (let dz = -Rz; dz <= Rz; dz++) {
        const u = dx / rx, v = dy / ry, w = dz / rz; if (u * u + v * v + w * w > 1) continue;
        // pillars and ledges so a cavern is never a bare hall
        const px = Math.sin((cx + dx) * 0.33 + ph) * Math.cos((cz + dz) * 0.29 - ph);
        if (px > 0.62 && Math.abs(v) < 0.78) continue;
        if (Math.sin((cy + dy) * 0.85 + ph) > 0.78 && Math.abs(v) < 0.5) continue;
        if (v > 0.58 && ((Math.round(cx + dx) * 3 + Math.round(cz + dz) * 7 + (cy | 0)) % 5 === 0)) continue;
        const x = Math.round(cx + dx), y = Math.round(cy + dy), z = Math.round(cz + dz);
        carve(x, y, z, 1.05, 5);
      }
      U.halls++;
    };
    // ---- spaghetti worms: interconnecting, go all the way down ----
    if (phase === 'worms') {
      const NW = 44 + Math.floor(rnd() * 18);
      for (let w = i0; w < NW; w++) {
        const spot = takeSpot(24, true, usedW, 60) || takeSpot(36, true, usedW, 40);
        if (!spot) { U.worms++; continue; }
        let x = spot[0], z = spot[1];
        const deep = rnd() < 0.45;
        let y = deep ? (5 + rnd() * 14) : (12 + rnd() * Math.max(6, SEA - 18));
        let a = rnd() * 6.283, p = (rnd() - 0.5) * 0.45, r = 1.5 + rnd() * 1.5;
        const L = 90 + rnd() * 180, style = rnd();
        for (let s = 0; s < L; s++) {
          a += (rnd() - 0.5) * (style < 0.28 ? 0.55 : 0.22);
          // occasionally steer toward an existing node so the network interconnects
          if (pts.length && s % 18 === 7 && rnd() < 0.45) {
            const q = pts[(rnd() * pts.length) | 0];
            const ta = Math.atan2(q[2] - z, q[0] - x);
            let da = ((ta - a + 9.42) % 6.283) - 3.14;
            a += Math.max(-0.2, Math.min(0.2, da));
            if (q[1] < y) p = Math.min(p, -0.15);
          }
          p = Math.max(-0.55, Math.min(0.55, p + (rnd() - 0.5) * 0.16));
          const tt = tp[Math.round(x) * D + Math.round(z)] || 60;
          const depth = Math.max(0, Math.min(1, (tt - y) / Math.max(8, tt - 4)));
          r = Math.max(1.25, Math.min(2.4 + 1.8 * depth, r + (rnd() - 0.5) * 0.32));
          x += Math.cos(a); z += Math.sin(a); y += p * 0.65;
          if (y < 4) { y = 4; p = Math.abs(p); }
          if (y > tt - 6) { p = -Math.abs(p) - 0.1; y = tt - 6; }
          carve(x, y, z, r, 5);
          if (s % 22 === 11) pts.push([x, y, z]);
          if (rnd() < 0.012 + 0.02 * depth) {
            // cheese pocket, larger deeper
            const cr = (3.2 + depth * 6 + rnd() * 3);
            cheeseAt(x, y + (rnd() - 0.4), z, cr, 2.4 + depth * 3.5, cr * 0.9, rnd);
          }
          // short branches
          if (rnd() < 0.008) {
            let bx = x, by = y, bz = z, ba = a + (rnd() < 0.5 ? 1.2 : -1.2);
            for (let k = 0; k < 18 + rnd() * 16; k++) { ba += (rnd() - 0.5) * 0.3; bx += Math.cos(ba); bz += Math.sin(ba); by += (rnd() - 0.5) * 0.3; if (by < 4) by = 4; carve(bx, by, bz, Math.max(1.2, r * 0.8), 5); }
            pts.push([bx, by, bz]);
          }
        }
        U.worms++;
      }
      phase = 'ravines'; i0 = 0;
    }
    // ---- ravines: winding open cuts from the surface down into the network ----
    if (phase === 'ravines') {
      const area = (W * D) / 1e6;
      const want = Math.max(10, Math.round(15 * area + rnd() * 3));
      for (let n = i0; n < want; n++) {
        const spot = takeSpot(55, true, usedS, 120);
        if (!spot) { continue; }
        let x = spot[0], z = spot[1], a = rnd() * 6.283;
        const L = 70 + rnd() * 130, w0 = 2.2 + rnd() * 3.2, yb0 = 8 + rnd() * 12, ph = rnd() * 6.28;
        let deepX = x, deepZ = z, deepY = 99;
        for (let s = 0; s < L; s++) {
          a += (rnd() - 0.5) * 0.14 + 0.04 * Math.sin(s * 0.11 + ph);
          x += Math.cos(a); z += Math.sin(a);
          const X = Math.round(x), Z = Math.round(z);
          if (X < 8 || Z < 8 || X >= W - 8 || Z >= D - 8 || !inside(X, Z, 12)) { a += Math.PI * 0.5; continue; }
          const tt = tp[X * D + Z] || 0;
          if (tt <= SEA + 1 || world[idx(X, Math.min(H - 2, tt + 1), Z)] === T.WATER) { a += 0.4; continue; }
          const e = Math.sin((s / L) * Math.PI); // taper at the ends
          const f = Math.pow(Math.max(0.15, e), 0.45);
          const yb = Math.max(4, Math.round(tt - (tt - yb0) * f));
          const hw = w0 * (0.45 + 0.55 * f) * (1 + 0.12 * Math.sin(x * 0.31 + z * 0.17 + ph));
          const R = Math.ceil(hw);
          for (let y = yb; y <= tt + 2 && y < H - 2; y++) {
            const g = Math.max(0, Math.min(1, (y - yb) / Math.max(4, tt - yb)));
            const w = hw * (0.38 + 0.62 * Math.pow(g, 0.65));
            const rw = Math.ceil(w);
            for (let dx = -rw; dx <= rw; dx++) for (let dz = -rw; dz <= rw; dz++) {
              if (dx * dx + dz * dz > w * w) continue;
              const xx = X + dx, zz = Z + dz; if (!inB(xx, y, zz)) continue;
              if (wet(xx, y, zz)) continue;
              const i = idx(xx, y, zz); if (placed(i)) continue;
              const b = world[i];
              if (nat(b) || !b || (typeof PLANT !== 'undefined' && PLANT[b]) || (typeof LEAFY !== 'undefined' && LEAFY[b])) { world[i] = (y <= 6 ? T.LAVA : 0); cellsRef.n++; }
            }
          }
          if (yb < deepY) { deepY = yb; deepX = x; deepZ = z; }
        }
        // join the floor of the ravine to the nearest cave node
        if (pts.length) {
          let best = pts[0], bd = 1e9;
          for (const q of pts) { const d = Math.hypot(q[0] - deepX, q[2] - deepZ); if (d < bd) { bd = d; best = q; } }
          let cx = deepX, cy = deepY + 1, cz = deepZ;
          const steps = Math.max(8, Math.ceil(Math.hypot(best[0] - cx, best[1] - cy, best[2] - cz)));
          for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            cx = deepX + (best[0] - deepX) * t; cy = deepY + 1 + (best[1] - deepY - 1) * t; cz = deepZ + (best[2] - deepZ) * t;
            carve(cx, cy, cz, 2.1, 3);
          }
        }
        pts.push([deepX, deepY + 2, deepZ]);
        U.ravines++;
      }
      phase = 'holes'; i0 = 0;
    }
    // ---- big open surface sinkholes down into the network ----
    if (phase === 'holes') {
      const area = (W * D) / 1e6;
      const want = Math.max(8, Math.round(13 * area + rnd() * 3));
      for (let n = i0; n < want; n++) {
        const spot = takeSpot(48, true, usedS, 120);
        if (!spot) { continue; }
        const x = spot[0], z = spot[1], tt = spot[2];
        const r0 = 3.6 + rnd() * 5.2, depth = 10 + rnd() * 18, ph = rnd() * 6.28;
        const yBot = Math.max(4, tt - depth);
        for (let y = yBot; y <= tt + 2 && y < H - 2; y++) {
          const g = (y - yBot) / Math.max(1, tt - yBot);
          const rr = r0 * (0.35 + 0.65 * Math.pow(Math.max(0, Math.min(1, g)), 0.55)) * (1 + 0.15 * Math.sin(y * 0.4 + ph));
          const R = Math.ceil(rr + 1);
          for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
            // irregular rim
            const wob = 0.7 + 0.3 * Math.sin((Math.atan2(dz, dx) + ph) * 3);
            if (dx * dx + dz * dz > (rr * wob) * (rr * wob)) continue;
            const xx = Math.round(x + dx), zz = Math.round(z + dz);
            if (!inB(xx, y, zz) || wet(xx, y, zz)) continue;
            const i = idx(xx, y, zz); if (placed(i)) continue;
            const b = world[i];
            if (nat(b) || !b || (typeof PLANT !== 'undefined' && PLANT[b]) || (typeof LEAFY !== 'undefined' && LEAFY[b])) { world[i] = (y <= 6 ? T.LAVA : 0); cellsRef.n++; }
          }
        }
        // leave a couple of ledge blocks on the way down
        if (pts.length) {
          let best = pts[0], bd = 1e9;
          for (const q of pts) { const d = Math.hypot(q[0] - x, q[2] - z); if (d < bd) { bd = d; best = q; } }
          const steps = Math.max(6, Math.ceil(Math.hypot(best[0] - x, best[1] - yBot, best[2] - z)));
          for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            carve(x + (best[0] - x) * t, yBot + (best[1] - yBot) * t, z + (best[2] - z) * t, 2.0, 3);
          }
        }
        pts.push([x, yBot + 2, z]);
        U.holes++;
      }
      phase = 'water'; i0 = 0;
    }
    // ---- underwater caves: sealed air pockets or fully flooded, never leak ----
    if (phase === 'water') {
      const area = (W * D) / 1e6;
      const want = Math.max(12, Math.round(18 * area + rnd() * 4));
      for (let n = i0; n < want; n++) {
        const spot = takeSpot(32, false, usedU, 100);
        if (!spot) { U.uw++; continue; }
        let x = spot[0], z = spot[1], tt = spot[2];
        // start well under the seafloor so a solid roof remains
        let y = Math.max(4, Math.min(tt - 5, 6 + rnd() * Math.max(4, tt - 10)));
        let a = rnd() * 6.283, p = (rnd() - 0.5) * 0.3, r = 1.5 + rnd() * 1.3;
        const L = 50 + rnd() * 110, flooded = rnd() < 0.55;
        const opts = flooded ? {flooded: 1, fill: T.WATER} : {sealed: 1};
        for (let s = 0; s < L; s++) {
          a += (rnd() - 0.5) * 0.28; p = Math.max(-0.4, Math.min(0.35, p + (rnd() - 0.5) * 0.12));
          x += Math.cos(a); z += Math.sin(a); y += p * 0.5;
          const X = Math.round(x), Z = Math.round(z);
          const top = (X >= 0 && Z >= 0 && X < W && Z < D) ? (tp[X * D + Z] || tt) : tt;
          if (y > top - 4) { y = top - 4; p = -Math.abs(p); }
          if (y < 4) { y = 4; p = Math.abs(p); }
          carve(x, y, z, r, 0, opts);
          if (rnd() < 0.02) carve(x, y, z, 3.4 + rnd() * 2.4, 0, opts);
        }
        U.uw++;
      }
      phase = 'fix'; i0 = 0;
    }
    // ---- no broken water: flood isolated underground air that touches water; plug leaks to land/sky caves ----
    if (phase === 'fix') {
      const sea = (typeof SEA === 'number' ? SEA : 40);
      const seaCol = new Uint8Array(W * D);
      for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
        const top = tp[x * D + z] || 0;
        if (top <= sea && (world[idx(x, Math.min(H - 2, Math.max(sea, top)), z)] === T.WATER || world[idx(x, sea, z)] === T.WATER || world[idx(x, Math.max(2, sea - 1), z)] === T.WATER)) seaCol[x * D + z] = 1;
      }
      const vis = new Uint8Array(W * H * D);
      const NB = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
      const airOf = [];
      const seeWater = [];
      const landish = [];
      for (let x = 2; x < W - 2; x++) for (let z = 2; z < D - 2; z++) for (let y = 2; y < sea; y++) {
        const i = idx(x, y, z);
        if (vis[i] || world[i] !== 0) continue;
        // BFS this underground air pocket
        const stack = [x, y, z];
        vis[i] = 1;
        airOf.length = 0; seeWater.length = 0;
        let land = 0, n = 0;
        while (stack.length && n < 200000) {
          const cz = stack.pop(), cy = stack.pop(), cx = stack.pop(); n++;
          airOf.push(cx, cy, cz);
          if (!seaCol[cx * D + cz] && (tp[cx * D + cz] || 0) > sea) land = 1;
          for (let k = 0; k < 6; k++) {
            const X = cx + NB[k][0], Y = cy + NB[k][1], Z = cz + NB[k][2];
            if (!inB(X, Y, Z) || Y < 2 || Y > sea + 2) continue;
            const j = idx(X, Y, Z), b = world[j];
            if (b === T.WATER) seeWater.push(X, Y, Z);
            else if (b === 0 && !vis[j]) { vis[j] = 1; stack.push(X, Y, Z); }
          }
        }
        if (!seeWater.length) continue;
        if (land) {
          // land cave that touched water: plug the contact, never flood the network
          for (let k = 0; k < seeWater.length; k += 3) {
            const X = seeWater[k], Y = seeWater[k + 1], Z = seeWater[k + 2];
            const j = idx(X, Y, Z);
            // only plug underground water, not the open sea itself (sea cells have sky above)
            let roof = 0;
            for (let yy = Y + 1; yy <= sea + 2 && yy < H; yy++) { const bb = world[idx(X, yy, Z)]; if (bb && bb !== T.WATER && !(typeof PLANT !== 'undefined' && PLANT[bb])) { roof = 1; break; } }
            if (roof && !placed(j)) world[j] = T.STONE;
            for (let t = 0; t < 6; t++) {
              const ax = X + NB[t][0], ay = Y + NB[t][1], az = Z + NB[t][2];
              if (!inB(ax, ay, az)) continue;
              const u = idx(ax, ay, az);
              if (world[u] === 0 && !placed(u) && seaCol[ax * D + az]) world[u] = T.STONE;
            }
          }
        } else {
          // isolated pocket under the sea: flood it completely
          for (let k = 0; k < airOf.length; k += 3) {
            const j = idx(airOf[k], airOf[k + 1], airOf[k + 2]);
            if (!placed(j) && world[j] === 0) world[j] = T.WATER;
          }
        }
      }
      // last: no water sitting on air
      for (let x = 3; x < W - 3; x++) for (let z = 3; z < D - 3; z++) for (let y = 3; y < sea; y++) {
        const i = idx(x, y, z), k = idx(x, y - 1, z);
        if (world[i] === T.WATER && world[k] === 0) {
          if (!seaCol[x * D + z] || (tp[x * D + z] || 0) > sea) { if (!placed(i)) world[i] = T.STONE; }
          else if (!placed(k)) world[k] = T.WATER;
        }
      }
      phase = 'seams'; i0 = 0;
      bump('seams', 0);
    }
    // ---- seams on the new cave walls + a coverage pass so every area gets ore ----
    if (phase === 'seams') {
      const p = 0.02;
      const NB = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
      for (let x = (i0 || 2); x < W - 2; x++) {
        for (let z = 2; z < D - 2; z++) {
          const yt = Math.min((tp[x * D + z] || SEA) - 4, H - 3);
          for (let y = 2; y <= yt; y++) {
            if (world[idx(x, y, z)] !== 0 || rnd() > p) continue;
            const [a, b, c] = NB[(rnd() * 6) | 0], X = x + a, Y = y + b, Z = z + c;
            if (!inB(X, Y, Z) || !host(world[idx(X, Y, Z)]) || placed(idx(X, Y, Z))) continue;
            const ore = pickRare(Y, rnd), n = 3 + (rnd() * 5 | 0);
            let px = X, py = Y, pz = Z;
            for (let k = 0; k < n; k++) {
              if (inB(px, py, pz)) { const j = idx(px, py, pz); if (host(world[j]) && !placed(j)) { world[j] = ore; U.seams++; } }
              for (let t = 0; t < 4; t++) {
                const [u, v, w] = NB[(rnd() * 6) | 0], qx = px + u, qy = py + v, qz = pz + w;
                if (inB(qx, qy, qz) && host(world[idx(qx, qy, qz)]) && (t === 3 || !world[idx(qx + 1, qy, qz)] || !world[idx(qx - 1, qy, qz)] || !world[idx(qx, qy + 1, qz)] || !world[idx(qx, qy - 1, qz)] || !world[idx(qx, qy, qz + 1)] || !world[idx(qx, qy, qz - 1)])) { px = qx; py = qy; pz = qz; break; }
              }
            }
          }
        }
        if (x % 8 === 7) bump('seams', x + 1);
      }
      phase = 'cover'; i0 = 0;
    }
    if (phase === 'cover') {
      const TILE = 32;
      const ores = new Set([T.COALORE, T.IRONORE, T.COPPERORE, T.GOLDORE, T.SILVERORE, T.DIAMONDORE, T.REDORE, T.LAZORE, T.RUBYORE].filter(v => v != null));
      const x0 = i0 || 2;
      for (let tx = x0; tx < W - 2; tx += TILE) {
        for (let tz = 2; tz < D - 2; tz += TILE) {
          let count = 0;
          const x1 = Math.min(W - 2, tx + TILE), z1 = Math.min(D - 2, tz + TILE);
          for (let x = tx; x < x1 && count < 3; x += 2) for (let z = tz; z < z1 && count < 3; z += 2) {
            const yt = Math.min((tp[x * D + z] || SEA) - 3, H - 3);
            for (let y = 3; y <= yt; y += 2) { if (ores.has(world[idx(x, y, z)])) { count++; break; } }
          }
          if (count >= 2) continue;
          for (let t = 0; t < 40; t++) {
            const x = tx + ((rnd() * (x1 - tx)) | 0), z = tz + ((rnd() * (z1 - tz)) | 0);
            const yt = Math.min((tp[x * D + z] || SEA) - 3, H - 3);
            const y = 3 + ((rnd() * Math.max(1, yt - 3)) | 0);
            if (!inB(x, y, z) || !host(world[idx(x, y, z)]) || placed(idx(x, y, z))) continue;
            const ore = pickRare(y, rnd), n = 4 + (rnd() * 5 | 0);
            let px = x, py = y, pz = z;
            for (let k = 0; k < n; k++) {
              if (inB(px, py, pz)) { const j = idx(px, py, pz); if (host(world[j]) && !placed(j)) { world[j] = ore; U.cover++; } }
              px += (rnd() * 3 | 0) - 1; py += (rnd() * 3 | 0) - 1; pz += (rnd() * 3 | 0) - 1;
            }
            break;
          }
        }
        bump('cover', tx + TILE);
      }
    }
    U.cells = cellsRef.n;
    U.pts = pts;
    return pts;
  }
  // 3) walk-in cave mouths at the foot of mountains, sloping down into the network
  function mouths(tp, rnd, pts) { let n = 0, tries = 0; const want = 22 + Math.floor(rnd() * 10);
    while (n < want && tries++ < 6000) { const x = 30 + Math.floor(rnd() * (W - 60)), z = 30 + Math.floor(rnd() * (D - 60)); if (!inside(x, z, 30) || Math.hypot(x - (W >> 1), z - (D >> 1)) < 70) continue;
      const g = tp[x * D + z]; if (g <= SEA + 1 || world[idx(x, g + 1, z)] === T.WATER) continue;
      let best = -1, bd = 0; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283, X = Math.round(x + Math.cos(a) * 7), Z = Math.round(z + Math.sin(a) * 7), h = tp[X * D + Z] - g; if (h > bd) { bd = h; best = a; } }
      if (bd < 7 || U.mouths.some(m => Math.hypot(m[0] - x, m[2] - z) < 60)) continue;
      let cx = x, cy = g + 2, cz = z, a = best; const C = U.carve; let target = null, td = 1e9; for (const p of pts) { const d = Math.hypot(p[0] - x, p[2] - z); if (d < td && d < 90) { td = d; target = p; } }
      for (let s = 0; s < 70; s++) { if (s > 10 && target) { const ta = Math.atan2(target[2] - cz, target[0] - cx); let da = ((ta - a + 9.42) % 6.283) - 3.14; a += Math.max(-0.12, Math.min(0.12, da)); }
        a += (rnd() - .5) * 0.2; cx += Math.cos(a); cz += Math.sin(a); if (s > 8) cy -= 0.55; C(cx, cy, cz, s < 3 ? 2.3 : 1.9, 0);
        if (target && Math.hypot(target[0] - cx, target[1] - cy, target[2] - cz) < 3) break; if (cy < 10) break; }
      for (let dx = -3; dx <= 3; dx++) for (let dy = -1; dy <= 4; dy++) for (let dz = -3; dz <= 3; dz++) { const X = Math.round(x + Math.cos(best) * 2) + dx, Y = g + dy, Z = Math.round(z + Math.sin(best) * 2) + dz; if (!inB(X, Y, Z)) continue; const b = world[idx(X, Y, Z)]; if ((b === T.STONE || b === T.DIRT) && rnd() < 0.4) world[idx(X, Y, Z)] = T.MOSSYCOBBLE || T.COBBLE || b; }
      const LX = Math.round(x + Math.cos(best) * 6), LZ = Math.round(z + Math.sin(best) * 6); let LY = g + 3; while (LY > 2 && !world[idx(LX, LY - 1, LZ)]) LY--; if (!world[idx(LX, LY, LZ)]) world[idx(LX, LY, LZ)] = 161;
      U.mouths.push([x, g + 1, z, +best.toFixed(2)]); n++; } }
  const gen = generate; generate = function () {if (window.__glenLoad && __glenLoad.skipPost && __glenLoad.skipPost(41)) return gen.apply(this, arguments);  const r = gen.apply(this, arguments); try { if (on()) {
        const L = window.__glenLoad;
        const st = (L && L._loop && L._loop.c274) ? L._loop.c274 : null;
        const t0 = (st && st.t0) ? st.t0 : performance.now();
        if (!st) { U.mouths = []; U.halls = 0; U.worms = 0; U.ravines = 0; U.holes = 0; U.uw = 0; U.seams = 0; U.cover = 0; U.cells = 0; }
        else { U.worms = st.worms || 0; U.halls = st.halls || 0; U.ravines = st.ravines || 0; U.holes = st.holes || 0; U.uw = st.uw || 0; U.seams = st.seams || 0; U.cover = st.cover || 0; }
        let s = st ? st.sd : (((gSeed | 0) ^ 0x2740c) >>> 0);
        const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
        let tp = tops();
        if (!st) pits(tp);
        const pts = runNetwork(tp, rnd, () => s, t0, st);
        mouths(tp, rnd, pts || U.pts || []);
        try { tp = tops(); for (let i = 0; i < W * D; i++) g9cols[i * 2] = tp[i] + 1; } catch (_) {}
        try { dirtyAll = true; } catch (_) {}
        if (L && L._loop) L._loop.c274 = null;
        U.ms = Math.round(performance.now() - t0);
      } } catch (e) { if (window.__glenLoad && __glenLoad.isYield && __glenLoad.isYield(e)) throw e; ERR('gen', e); } { if (window.__glenLoad && __glenLoad.markPost) __glenLoad.markPost(41); return r; } };
})();
