
/* ===================== GLX-C50 (v0.9.46): unlimited Keep markers, mob separation, zombie packs, roaming treeman ===================== */
(function c50() {
  // ---- 10) Keep markers are never used up ----
  const MKR = new Set([241, 242, 243]);
  const uu = useUp; useUp = function (id) { if (MKR.has(id)) { if (!(inv[id] > 0)) inv[id] = 64; return; } return uu.apply(this, arguments); };
  setInterval(() => { for (const id of MKR) if (inv[id] > 0 && inv[id] !== 64) inv[id] = 64; }, 1000);
  // ---- 9) mobs touch, never overlap ----
  function separate() { const n = mobs.length; for (let i = 0; i < n; i++) { const a = mobs[i]; if (a.kind === 'bee' || a.kind === 'dragon' || heldBy === a) continue; const pa = a.g.position, ra = a.hitR || 0.4;
      for (let j = i + 1; j < n; j++) { const b = mobs[j]; if (b.kind === 'bee' || b.kind === 'dragon' || heldBy === b) continue; const pb = b.g.position; if (Math.abs(pa.y - pb.y) > 1.6) continue;
        const dx = pb.x - pa.x, dz = pb.z - pa.z, d = Math.hypot(dx, dz), m = ra + (b.hitR || 0.4); if (d >= m) continue;
        const ux = d > 1e-4 ? dx / d : Math.cos(i + j), uz = d > 1e-4 ? dz / d : Math.sin(i + j), push = (m - d) / 2;
        const tryMove = (o, sx, sz) => { const nx = o.x + sx, nz = o.z + sz; if (!solid(Math.floor(nx), Math.floor(o.y + 0.2), Math.floor(nz)) && !solid(Math.floor(nx), Math.floor(o.y + 1.1), Math.floor(nz))) { o.x = nx; o.z = nz; } };
        tryMove(pa, -ux * push, -uz * push); tryMove(pb, ux * push, uz * push); } } }
  window.__separate = separate;
  const um = updateMobs; updateMobs = function () { const r = um.apply(this, arguments); try { separate(); } catch (_) {} return r; };
  // ---- 8) zombies come in packs of about 3 ----
  let pack = false;
  const sm = spawnMob; spawnMob = function (kind) { const a = sm.apply(this, arguments);
    if (a && kind === 'zombie' && !pack && !window.__eggSpot) { pack = true; try { const p = a.g.position; const extra = 1 + (Math.random() < 0.75 ? 1 : 0) + (Math.random() < 0.2 ? 1 : 0);
        for (let i = 0; i < extra; i++) { const ang = Math.random() * 6.28, x = p.x + Math.cos(ang) * 1.8, z = p.z + Math.sin(ang) * 1.8, y = solidTop(Math.floor(x), Math.floor(z)) + 1;
          if (Math.abs(y - p.y) > 2 || solid(Math.floor(x), y, Math.floor(z))) continue; window.__eggSpot = [x, y, z, x, z]; window.__egg = true; try { sm.call(this, 'zombie'); } finally { window.__eggSpot = null; window.__egg = false; } } } finally { pack = false; } }
    return a; };
  // ---- 7) the treeman leaves when you walk away, and comes back at night by a tree near you ----
  function treeNear(rMin, rMax) { const px = Math.floor(P.x), pz = Math.floor(P.z), c = [];
    for (let x = Math.max(2, px - rMax); x < Math.min(W - 2, px + rMax); x++) for (let z = Math.max(2, pz - rMax); z < Math.min(D - 2, pz + rMax); z++) { const d = Math.hypot(x - px, z - pz); if (d < rMin || d > rMax) continue;
      for (let y = H - 2; y > 2; y--) { const b = getB(x, y, z); if (b === T.LOG) { let ty = y; while (ty > 2 && getB(x, ty - 1, z) === T.LOG) ty--; c.push([x, ty, z]); break; } if (b && b !== T.LEAVES && !isPlant(b)) break; } }
    for (let t = 0; t < 30 && c.length; t++) { const [x, ty, z] = c[(Math.random() * c.length) | 0];
      for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, -1]]) { const cx = x + ox, cz = z + oz; for (const yy of [ty, ty + 1, ty - 1]) if (solid(cx, yy - 1, cz) && !solid(cx, yy, cz) && !solid(cx, yy + 1, cz)) return [cx + .5, yy, cz + .5, x, z]; } }
    window.__tnC = c.length;
    return null; }
  let tmT = 20;
  setInterval(() => { if (!started || paused || DIM.cur) return; try {
      for (const a of mobs.slice()) if (a.kind === 'treeman') { const d = Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z); const busy = a.state === 'chase' || a.state === 'grab' || a.state === 'twist';
        if (d > 34 && !busy) { a.gone = (a.gone || 0) + 1; if (a.gone >= 2) { try { mistPuff(a.g.position.x, a.g.position.y + 1, a.g.position.z, 0x4a3a2a, 4); } catch (_) {} removeMob(a); } } else a.gone = 0; }
      tmT -= 1; const night = typeof isNight === 'boolean' ? isNight : (dayClock / CYCLE > 0.75 || dayClock / CYCLE < 0.22);
      if (night && tmT <= 0 && !mobs.some(a => a.kind === 'treeman')) { tmT = 45; const s = treeNear(14, 34); if (s) { window.__eggSpot = s; try { const a = spawnMob('treeman'); window.__lastTree = a ? [s[0], s[2]] : null; } finally { window.__eggSpot = null; } } }
    } catch (_) {} }, 1000);
  window.__treeNear = treeNear;
})();
