/* GLX-C397 (v1.1.96): DEEP DROPS KEEP. updateDrops culled any drop below Y -5, so mined blocks deep
   underground vanished before you could pick them up. Drops now only despawn below the true deep bottom
   (far under the hollow Earth core) or by the existing age / lava rules. Physics still uses solid/getB. */
(function c397() {
  const U = window.__c397 = {err: null, kept: 0, culled: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const BOTTOM = () => { try { const sea = (typeof SEA === 'number' ? SEA : 41); return sea - 1100; } catch (_) { return -1100; } };
  try {
    const ud = updateDrops;
    updateDrops = function (dt) {
      try {
        const floor = BOTTOM();
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i];
          if (d && d.y < -5 && d.y >= floor) { U.kept++; /* was culled; leave it */ }
        }
      } catch (e) { ERR('pre', e); }
      const r = ud.apply(this, arguments);
      return r;
    };
    // Replace the hard y < -5 cull by wrapping drop lifetime: re-add is too late. Patch by
    // intercepting scene.remove only for drops is fragile. Instead rewrite updateDrops fully via
    // monkeypatch of the condition: swap in a guarded version that uses BOTTOM.
    updateDrops = function (dt) {
      try {
        const px = P.x, py = P.y + 0.9, pz = P.z, floor = BOTTOM();
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i];
          d.age += dt; d.delay -= dt;
          const dist = Math.hypot(d.x - px, d.y - py, d.z - pz);
          if (d.delay <= 0 && !dead && dist < 2.3) {
            if (d.pick === undefined) { d.pick = 0; d.sx = d.x; d.sy = d.y; d.sz = d.z; d.s0 = d.m.scale.x; }
            d.pick = Math.min(1, d.pick + dt / 0.24); const e = d.pick * d.pick * (3 - 2 * d.pick);
            d.x = d.sx + (px - d.sx) * e; d.z = d.sz + (pz - d.sz) * e; d.y = d.sy + (py - d.sy) * e + Math.sin(d.pick * Math.PI) * 0.55; d.rest = false;
            const sc = d.s0 * (1 - 0.6 * Math.max(0, d.pick - 0.5) * 2); d.m.scale.setScalar(sc);
            if (d.pick >= 1) { addItem(d.id, d.n); sfx('pop'); scene.remove(d.m); drops.splice(i, 1); continue; }
          } else if (!d.rest) {
            if (d.pick !== undefined) { d.pick = undefined; d.m.scale.setScalar(d.s0); }
            d.vy -= 18 * dt;
            const nx = d.x + d.vx * dt, nz = d.z + d.vz * dt;
            if (!solid(Math.floor(nx), Math.floor(d.y), Math.floor(d.z))) d.x = nx; else d.vx = 0;
            if (!solid(Math.floor(d.x), Math.floor(d.y), Math.floor(nz))) d.z = nz; else d.vz = 0;
            const ny = d.y + d.vy * dt;
            if (solid(Math.floor(d.x), Math.floor(ny - 0.12), Math.floor(d.z)) && d.vy <= 0) {
              d.y = Math.floor(ny - 0.12) + 1.12; d.vy = 0; d.vx = d.vz = 0; d.rest = true;
            } else d.y = ny;
            if (d.y < floor) { scene.remove(d.m); drops.splice(i, 1); U.culled++; continue; }
          } else if (!solid(Math.floor(d.x), Math.floor(d.y - 0.2), Math.floor(d.z))) d.rest = false;
          if (d.age > 300 || getB(Math.floor(d.x), Math.floor(d.y - 0.1), Math.floor(d.z)) === T.LAVA) {
            if (d.age <= 300) burst(d.x, d.y, d.z, 0xff7a1a, 6, .6); scene.remove(d.m); drops.splice(i, 1); continue;
          }
          d.m.position.set(d.x, d.y + (d.rest ? 0.06 + Math.sin(d.age * 2.4 + d.ph) * 0.05 : 0), d.z);
          if (d.m.isMesh) d.m.rotation.y = d.age * 1.4 + d.ph;
        }
        U.on = 1;
      } catch (e) { ERR('ud', e); try { return ud.apply(this, arguments); } catch (_) {} }
    };
  } catch (e) { ERR('wrap', e); }
})();
