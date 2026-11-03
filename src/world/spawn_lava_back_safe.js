/* ===================== GLX-C156 (v1.0.26): the spawn lava is back (safe pools only), the Ghost is rare and only hunts what it can see ===================== */
(function c156() {
  const U = window.__c156 = {st: {}, err: null, ghost: {cut: 0, kept: 0, aggro: 0, gaveUp: 0}};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e); };
  /* ---- spawn lava: the old spawn pools that c131 turned to stone come back where they are safe ---- */
  const firm = b => !!b && b !== T.WATER && b !== T.LAVA && b !== T.TORCH && !LEAFY[b] && !LOGGY[b] && PLANT[b] !== 1 && b !== (T.ICE || -1);
  const wet = (x, y, z) => { for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = -1; dy <= 2; dy++) if (getB(x + dx, y + dy, z + dz) === T.WATER) return true; return false; };
  function restoreLava() { const L = window.__c131lava; window.__c131lava = null; const st = U.st = {cells: 0, pools: 0, kept: 0, made: 0}; if (!L || !L.length) return st; st.cells = L.length;
    const set = new Set(L), seen = new Set();
    const xyz = k => [(k / (H * D)) | 0, ((k / D) | 0) % H, k % D];   // idx = (x*H + y)*D + z
    for (const k0 of L) { if (seen.has(k0)) continue; const comp = [k0]; seen.add(k0);
      for (let i = 0; i < comp.length; i++) { const [x, y, z] = xyz(comp[i]); for (const [a, b, c] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { if (x + a < 0 || z + c < 0 || x + a >= W || z + c >= D) continue; const n = idx(x + a, y + b, z + c); if (set.has(n) && !seen.has(n)) { seen.add(n); comp.push(n); } } }
      st.pools++; let ok = comp.length <= 1200; const why = {};
      for (const k of comp) { const [x, y, z] = xyz(k); if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) { ok = false; break; } const o0 = true; const ok0 = ok; ok = true;
        if (!set.has(idx(x, y - 1, z)) && !firm(getB(x, y - 1, z))) ok = false;   // solid floor
        for (const [a, c] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = idx(x + a, y, z + c); if (!set.has(n) && !firm(getB(x + a, y, z + c))) ok = false; }   // solid walls
        const up = getB(x, y + 1, z); if (up && !set.has(idx(x, y + 1, z)) && (up === T.WATER || !firm(up))) ok = false;   // open sky or rock above, never water
        if (wet(x, y, z)) ok = false; if (!ok) why[[x, y, z].join(",")] = 1; ok = ok && ok0; }
      (st.comps = st.comps || []).push({n: comp.length, ok, bad: Object.keys(why).slice(0, 6)});
      if (ok) { for (const k of comp) world[k] = T.LAVA; st.kept++; } }
    return st; }
  // a fallback pool near spawn when no old pool was safe: 2x3, one deep, rimmed with stone, on dry land
  function makePool() { const st = U.st; if (st.kept || DIM.cur) return; const sx = Math.floor(P.x), sz = Math.floor(P.z);
    for (let t = 0; t < 80; t++) { const an = t * 2.399, r = 9 + (t % 12), x = Math.floor(sx + Math.sin(an) * r), z = Math.floor(sz + Math.cos(an) * r); if (x < 6 || z < 6 || x > W - 7 || z > D - 7) continue;
      const y = solidTop(x, z); if (y <= SEA + 1) continue; let ok = true;
      for (let dx = -2; dx <= 3 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) { const X = x + dx, Z = z + dz; if (solidTop(X, Z) !== y || !firm(getB(X, y, Z)) || getB(X, y + 1, Z) || getB(X, y + 2, Z) || placedSet.has(idx(X, y, Z))) ok = false; }
      if (!ok || wet(x, y, z) || wet(x + 1, y, z)) continue;
      for (let dx = -1; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { setB(x + dx, y, z + dz, T.STONE); setB(x + dx, y - 1, z + dz, T.STONE); }
      for (let dx = 0; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) setB(x + dx, y, z + dz, T.LAVA);
      st.made = 1; st.at = [x, y, z]; dirtyAll = true; return; } }
  try { const gen = generate; generate = function () { const r = gen.apply(this, arguments); try { if (!DIM.cur) { restoreLava(); U.pend = true; } } catch (e) { ERR(e); } return r; }; } catch (e) { ERR(e); }
  /* ---- the Ghost (Linen Ghaist): rare, night only, one near you, normal sight range ---- */
  const C = window.__c123, GH = 'nm10', SEE = 16, LOSE = 24;
  const los = (a) => { const p = a.g.position, x0 = p.x, y0 = p.y + 1, z0 = p.z, x1 = P.x, y1 = P.y + 1.5, z1 = P.z, L = Math.hypot(x1 - x0, y1 - y0, z1 - z0), n = Math.ceil(L * 2);
    for (let i = 1; i < n; i++) { const f = i / n; if (solid(Math.floor(x0 + (x1 - x0) * f), Math.floor(y0 + (y1 - y0) * f), Math.floor(z0 + (z1 - z0) * f))) return false; } return true; };
  let lastGhost = 0, wanderDef = null, wanderOf = null;
  const drop = a => { try { removeMob(a); } catch (_) {} const i = mobs.indexOf(a); if (i >= 0) mobs.splice(i, 1); };
  function ghosts(dt) { const D0 = C && C.DEF && C.DEF[GH]; if (!D0) return; if (wanderOf !== D0) { wanderOf = D0; wanderDef = Object.assign({}, D0, {ai: 'wander'}); }
    const G = mobs.filter(a => a && a.kind === GH && a.g);
    for (const a of G) { const p = a.g.position, d = Math.hypot(P.x - p.x, P.y - p.y, P.z - p.z);
      if (!a.__c156) { a.__c156 = 1; const natural = !a.egg && a.home !== 'spec' && !a.spec;
        if (natural) { const near = G.filter(b => b !== a && b.__c156 && Math.hypot(b.g.position.x - P.x, b.g.position.z - P.z) < 64).length, now = performance.now();
          if (!isNight || near >= 1 || now - lastGhost < 150000 || Math.random() > 0.15) { drop(a); U.ghost.cut++; continue; } lastGhost = now; U.ghost.kept++; } }
      if (a.frozen) continue;
      if (!a.gh) { if (d < SEE && los(a)) { a.gh = 1; a.ghLost = 0; U.ghost.aggro++; } }
      else { a.ghLost = los(a) ? 0 : (a.ghLost || 0) + dt; if (d > LOSE || a.ghLost > 4) { a.gh = 0; U.ghost.gaveUp++; } }
      a.def = a.gh ? D0 : wanderDef; } }
  U.los = los;
  try { const um = updateMobs; updateMobs = function (dt) { try { ghosts(dt || 0); } catch (e) { ERR(e); } const r = um.apply(this, arguments);
      try { if (U.pend && started && !DIM.cur) { U.pend = false; makePool(); } } catch (e) { ERR(e); } return r; }; } catch (e) { ERR(e); }
})();
