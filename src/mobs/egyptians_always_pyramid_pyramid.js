/* GLX-C270 (v1.0.86): the Egyptians are always at the pyramid. The pyramid record (__c239.pyr) is saved with the world, so if the
   pyramid scan ever comes back empty (reload, chunk rebuild, reset) the folk are not cleared - the saved pyramid is put back and the
   folk respawn there. Any folk mesh that falls out of the scene is re-added, and any that strays too far is walked home. */
(function () {
  const U = window.__c270 = {err: null, restored: 0, readded: 0, homed: 0, respawn: 0};
  const KEY = () => current && current.id ? 'glen_pyr_' + current.id : null;
  const mkO = c => { const o = Object.assign({}, c); o.L = (u, v) => [o.cx + u * o.fx + v * o.rx, o.cz + u * o.fz + v * o.rz]; o.saved = 1; return o; };
  let cache = null, cacheId = null, lastSeen = 0;
  function tick() { if (typeof started === 'undefined' || !started || !current) return; const C = window.__c239; if (!C) return; const k = KEY();
    if (cacheId !== k) { cacheId = k; cache = null; try { const s = localStorage.getItem(k); if (s) cache = mkO(JSON.parse(s)); } catch (_) {} }
    const o = C.pyr;
    if (o && !o.saved && o.L) { const r = {cx: o.cx, cy: o.cy, cz: o.cz, hy: o.hy, fx: o.fx, fz: o.fz, rx: o.rx, rz: o.rz}; const js = JSON.stringify(r);
      if (!cache || JSON.stringify({cx: cache.cx, cy: cache.cy, cz: cache.cz, hy: cache.hy, fx: cache.fx, fz: cache.fz, rx: cache.rx, rz: cache.rz}) !== js) { cache = mkO(r); try { localStorage.setItem(k, js); } catch (_) {} } }
    if (!o && cache) { C.pyr = cache; U.restored++; }
    const p = C.pyr; if (!p || !p.L) return; const fk = window.__c240 && __c240.folk;
    if (fk && !fk.length && window.__c240.spawnAt) { __c240.spawnAt(p); U.respawn++; }
    const all = (fk || []).concat((window.__c259 && __c259.all) ? [] : []), out = window.__c259 && __c259.out ? __c259.out() : [];
    for (const f of all.concat(out)) { if (!f || !f.g) continue; if (!f.g.parent) { scene.add(f.g); U.readded++; }
      if (f.hx === undefined && f.dz === undefined) { f.hx = f.x; f.hz = f.z; }
      const hx = f.hx !== undefined ? f.hx : p.cx, hz = f.hz !== undefined ? f.hz : p.cz;
      if (!f.dz && Math.hypot(f.x - p.cx, f.z - p.cz) > 34) { f.x = f.tx = hx; f.z = f.tz = hz; if (f.y === undefined || f.y < 2) f.y = p.hy; U.homed++; } } }
  setInterval(() => { try { tick(); } catch (e) { if (!U.err) U.err = String(e).slice(0, 200); } }, 1000);
  try { const ew = enterWorld; enterWorld = function () { try { cacheId = null; cache = null; } catch (_) {} return ew.apply(this, arguments); }; } catch (e) { U.err = String(e); }
})();
