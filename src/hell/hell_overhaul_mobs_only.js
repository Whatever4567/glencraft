/* ===================== GLX-C170 (v1.0.31): Hell overhaul 4 - mobs only at the builds, each build its own: skeletons at the Cathedral (and the Wyrm's lair), ghosts over the Abbey's soul sand, imps at the Keep, hounds at the Bastion ===================== */
(function c170() {
  const C = window.__c167; if (!C) return;
  const U = window.__c170 = {err: null, st: {made: {}, blocked: 0}, nat: false, block: false};
  const MOBS = {cathedral: ['blazeskel'], abbey: ['ghost'], keep: ['imp'], bastion: ['hound'], fort: ['blazeskel', 'blazeskel', 'hound']};
  U.MOBS = MOBS;
  const SS = T.SOULSAND || 207;
  // the build (or the old fortress) you are at, if any
  U.near = function (r) { let best = null, bd = r || 52;
    for (const b of C.b) { const d = Math.hypot(P.x - b[1], P.z - b[2]); if (d < bd) { bd = d; best = {k: b[0], x: b[1], z: b[2], y: b[3] + 1, d}; } }
    if (hellFort) { const d = C.fortDist(P.x, P.z); if (d < 26 && d < bd) best = {k: 'fort', x: P.x, z: P.z, y: hellFort.y, d, fort: true}; }
    return best; };
  const abbey = () => C.b.find(b => b[0] === 'abbey');
  // top of soul sand (with 4 clear blocks above) in this column near height y, else -1
  function soulTop(x, z, yHi, yLo) { for (let y = yHi; y >= yLo; y--) { const b = getB(x, y, z); if (b === SS) { for (let k = 1; k <= 4; k++) if (getB(x, y + k, z) !== 0) return -1; return y + 1; } if (b && b !== T.FIRE) return -1; } return -1; }
  U.soulSpot = function (lift) { const a = abbey(); if (!a) return null;
    for (let t = 0; t < 24; t++) { const an = Math.random() * 6.28, rr = Math.random() * 30, x = Math.floor(a[1] + Math.cos(an) * rr), z = Math.floor(a[2] + Math.sin(an) * rr), dp = Math.hypot(x - P.x, z - P.z);
      if (dp < 9 || dp > 34 || x < 3 || z < 3 || x >= W - 3 || z >= D - 3) continue; const y = soulTop(x, z, a[3] + 4, a[3] - 2); if (y > 0) return [x + .5, y + (lift || 0), z + .5]; }
    return null; };
  U.orbOK = () => { const a = abbey(); return !!a && Math.hypot(P.x - a[1], P.z - a[2]) < 56; };
  // ---------- the spawner: replaces the old one that dropped mobs anywhere near you ----------
  const groundSpot = (x, z, yHi, yLo) => { for (let y = yHi; y > yLo; y--) { const f = getB(x, y - 1, z), a = getB(x, y, z); if (solid(x, y - 1, z) && f !== T.LAVA && f !== T.PORTAL && !solid(x, y, z) && !solid(x, y + 1, z) && a !== T.LAVA && a !== T.PORTAL && a !== T.FIRE) return y; } return -1; };
  window.hellSpawn = function () { try { const nb = U.near(); if (!nb) return; const L = MOBS[nb.k] || MOBS.fort, kind = L[(Math.random() * L.length) | 0];
      if (kind === 'ghost') { const s = U.soulSpot(3 + Math.random() * 2); if (s) { hellMake('ghost', s[0], s[1], s[2]); U.st.made.ghost = (U.st.made.ghost || 0) + 1; } return; }
      for (let t = 0; t < 24; t++) { let x, z, yHi, yLo;
        if (nb.fort) { const an = Math.random() * 6.28, rr = 12 + Math.random() * 16; x = Math.floor(P.x + Math.cos(an) * rr); z = Math.floor(P.z + Math.sin(an) * rr); if (C.fortDist(x, z) > 5) continue; yHi = hellFort.y + 5; yLo = hellFort.y - 2; }
        else { const an = Math.random() * 6.28, rr = Math.random() * 26; x = Math.floor(nb.x + Math.cos(an) * rr); z = Math.floor(nb.z + Math.sin(an) * rr); yHi = nb.y + 14; yLo = nb.y - 3; }
        if (x < 3 || z < 3 || x >= W - 3 || z >= D - 3) continue; const dp = Math.hypot(x - P.x, z - P.z); if (dp < 10 || dp > 34) continue;
        const y = groundSpot(x, z, yHi, yLo); if (y < 0) continue; hellMake(kind, x + .5, y, z + .5); U.st.made[kind] = (U.st.made[kind] || 0) + 1; return; } } catch (e) { U.err = String(e && e.stack || e); } };
  window.hellPopulate = function () { for (let k = 0; k < 2; k++) hellSpawn(); };
  // the Ember Wyrm only comes to its lair over the Black Cathedral; eggs still work anywhere
  const hm = hellMake; hellMake = function (kind) { if (U.nat && kind === 'dragon') { const c = C.b.find(b => b[0] === 'cathedral'); if (C.b.length && (!c || Math.hypot(P.x - c[1], P.z - c[2]) > 90)) { U.block = true; U.st.blocked++; return null; } } return hm.apply(this, arguments); };
  const to = toast; toast = function (m) { if (U.block && typeof m === 'string' && /roar/i.test(m)) return; return to.apply(this, arguments); };
  try { const s3 = sfx3d; sfx3d = function (n) { if (U.block && n === 'growl') return; return s3.apply(this, arguments); }; } catch (_) {}
  // a quicker top-up while you are at a build (same caps as before: 3 on phones, 4 on desktop)
  let t = 4;
  const um = updateMobs; updateMobs = function (dt) { U.nat = true; U.block = false; let r; try { r = um.apply(this, arguments); } finally { U.nat = false; U.block = false; }
    try { if (started && DIM.cur === 'hell' && (t -= dt) <= 0) { t = 6; const nb = U.near(); if (nb) { const n = mobs.filter(a => a.hell && a.kind !== 'dragon' && Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z) < 48).length; if (n < (PERF ? 3 : 4)) hellSpawn(); } } } catch (e) { U.err = String(e && e.stack || e); }
    return r; };
})();
