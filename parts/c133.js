/* ===================== GLX-C133 (v1.0.14): abandoned mineshafts for the new (c131) cave system - each one starts inside a connected cave tunnel ===================== */
(function c133() {
  const U = window.__c133 = {n: 0, chests: 0, len: 0, err: null};
  const LOOT = () => [[IT.IRONINGOT, 3, 0.6], [IT.COAL, 6, 0.8], [IT.GOLDINGOT, 2, 0.35], [IT.REDSTONE, 4, 0.5], [IT.DIAMOND, 1, 0.12], [T.TORCH, 8, 0.6], [IT.BREAD, 3, 0.5], [IT.RAWSILVER, 4, 0.35]];
  // C = {nodes, alive, surf0, dW, prot, lab, L (mainland id), rnd, touched, NAT}
  U.place = function (C) { try {
    const {nodes, alive, surf0, dW, prot, lab, rnd, touched, NAT} = C; let made = 0; U.n = 0; U.chests = 0; U.len = 0;
    const ok = (x, y, z) => { if (x < 6 || z < 6 || x > W - 7 || z > D - 7) return false; const c = x * D + z; return !prot[c] && dW[c] >= 10 && lab[c] === C.L && y + 3 < surf0[c] - 7; };
    const cor = new Uint8Array(W * D), mine = b => b === 162 || b === T.PLANKS || b === T.COBWEB || b === T.TORCH;   // corridor cells: crossings clear each other's frames
    const cand = nodes.map((n, i) => [n, i]).filter(([n, i]) => alive[i] && n.t === 't' && n.L === C.L && n.y >= 14 && n.y <= 34 && ok(n.x, n.y, n.z));
    const want = Math.min(4, Math.max(2, Math.round(cand.length / 12))), used = [];
    for (let tries = 0; tries < 60 && made < want && cand.length; tries++) {
      const [n] = cand[(rnd() * cand.length) | 0]; if (used.some(u => Math.hypot(u[0] - n.x, u[1] - n.z) < 120)) continue; used.push([n.x, n.z]);
      const sy = n.y; const seg = [[n.x, n.z, rnd() < 0.5 ? 0 : 1, 0]]; let segs = 0;
      while (seg.length && segs < 12) { const [x0, z0, ax] = seg.shift(); const L = 12 + Math.floor(rnd() * 20), dir = rnd() < 0.5 ? 1 : -1; segs++;
        for (let k = 0; k < L; k++) { const x = ax === 0 ? x0 + k * dir : x0, z = ax === 1 ? z0 + k * dir : z0;
          let good = true; for (let w = -1; w <= 1 && good; w++) { const xx = ax === 0 ? x : x + w, zz = ax === 1 ? z : z + w; if (!ok(xx, sy, zz)) good = false; } if (!good) break;
          const at = (w, h) => idx(ax === 0 ? x : x + w, sy + h, ax === 1 ? z : z + w);
          for (let w = -1; w <= 1; w++) for (let h = 0; h < 3; h++) { const i = at(w, h), b = world[i]; if (b === T.WATER || b === T.LAVA) continue; if (!b || NAT[b] || (mine(b) && cor[(ax === 0 ? x : x + w) * D + (ax === 1 ? z : z + w)])) world[i] = 0; }
          const free = w => !cor[(ax === 0 ? x : x + w) * D + (ax === 1 ? z : z + w)];
          touched[x * D + z] = 1; U.len++;
          const fl = idx(x, sy - 1, z); if (world[fl] === 0 || world[fl] === T.LAVA) world[fl] = T.PLANKS;
          if (k % 4 === 0 && k > 0 && free(-1) && free(0) && free(1)) { for (const w of [-1, 1]) { world[at(w, 0)] = 162; world[at(w, 1)] = 162; } for (let w = -1; w <= 1; w++) world[at(w, 2)] = T.PLANKS;
            if (rnd() < 0.3) { const X = ax === 0 ? x : x + 1, Z = ax === 1 ? z : z + 1, i = idx(X, sy + 1, Z); if (!world[i]) { world[i] = T.TORCH; try { lightSrc.set((X * 4096 + Z) * 256 + sy + 1, [X + .5, sy + 1.7, Z + .5, T.TORCH]); } catch (_) {} } } }
          else if (rnd() < 0.12) { const w = rnd() < 0.5 ? -1 : 1, i = at(w, 2); if (!world[i] && free(w)) world[i] = T.COBWEB; }
          if (rnd() < 0.025) { const w = rnd() < 0.5 ? -1 : 1; if (free(w)) try { lootChest(ax === 0 ? x : x + w, sy, ax === 1 ? z : z + w, LOOT(), rnd); U.chests++; } catch (_) {} }
          for (let w = -1; w <= 1; w++) cor[(ax === 0 ? x : x + w) * D + (ax === 1 ? z : z + w)] = 1;
          if (k === L - 1 || rnd() < 0.06) seg.push([x, z, 1 - ax]); } }
      made++; }
    U.n = made; return made; } catch (e) { U.err = String(e && e.stack || e); return 0; } };
})();
