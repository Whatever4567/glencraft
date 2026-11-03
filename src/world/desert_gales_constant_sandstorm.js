/* ===================== GLX-C245 (v1.0.58): DESERT GALES - in the constant sandstorm, sheep and other light passive mobs get lifted and tumble on the wind,
   then drift gently back down (no fall damage - the float is fully scripted), and dropped items skitter downwind. Capped for phones. ===================== */
(function c245() {
  const U = window.__c245 = {err: null, lifts: 0, floating: 0, drift: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const LOW = (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && PERF);
  const CAP = LOW ? 2 : 4, LIGHT = new Set(['sheep', 'haggis', 'duck', 'chicken', 'rabbit', 'hare', 'pig', 'lamb']);
  const WX = 0.954, WZ = 0.298;   // same heading as the blowing sand
  const solidAt = (x, y, z) => { x = Math.floor(x); y = Math.floor(y); z = Math.floor(z); if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1 || y < 1) return true; if (y >= H - 1) return false; const b = world[idx(x, y, z)]; return !!b && b !== T.WATER && !(PLANT && PLANT[b]) && b !== T.FIRE; };
  const ground = (x, z, y0) => { let y = Math.min(H - 2, Math.floor(y0) + 2); while (y > 1 && !solidAt(x, y - 1, z)) y--; return y; };
  const fl = new Set(); let pickT = 2;
  U.lift = a => { if (!a || a.dead || fl.has(a) || fl.size >= CAP) return false; const T0 = LOW ? 6 : 7 + Math.random() * 3; a.__w = {t: 0, T: T0, h: 4 + Math.random() * 4, y0: a.g.position.y, sp: 2.5 + Math.random() * 2, rx: (Math.random() - .5) * 6, rz: (Math.random() - .5) * 6}; fl.add(a); U.lifts++; return true; };
  function step(dt) { const dK = (window.__c243 && __c243.dK ? __c243.dK() : 0) * (window.__c243 && __c243.cyc !== undefined ? __c243.cyc : 1); /* v1.0.93: gales only in a storm */
    if (dK > 0.6 && (pickT -= dt) <= 0) { pickT = 1.2 + Math.random() * 1.5; if (fl.size < CAP && typeof mobs !== 'undefined') { const c = mobs.filter(a => a && !a.dead && LIGHT.has(a.kind) && !fl.has(a) && a.g && Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z) < 40); if (c.length && Math.random() < 0.5) U.lift(c[(Math.random() * c.length) | 0]); } }
    for (const a of fl) { const w = a.__w, p = a.g.position; if (a.dead || !a.g.parent) { fl.delete(a); continue; } w.t += dt; const k = Math.min(1, w.t / w.T);
      const nx = p.x + WX * w.sp * dt * Math.sin(Math.PI * k), nz = p.z + WZ * w.sp * dt * Math.sin(Math.PI * k);
      if (!solidAt(nx, p.y + 0.5, nz) && !solidAt(nx, p.y + 1.2, nz)) { p.x = nx; p.z = nz; }
      const g = ground(p.x, p.z, p.y), base = Math.max(g, Math.min(w.y0, p.y)); w.y0 += (g - w.y0) * Math.min(1, dt * 2);
      p.y = Math.max(g, w.y0 + w.h * Math.sin(Math.PI * k) + 0.25 * Math.sin(w.t * 5) * (1 - k));
      a.g.rotation.x = w.rx * Math.sin(Math.PI * k) * Math.sin(w.t * 1.7); a.g.rotation.z = w.rz * Math.sin(Math.PI * k) * Math.cos(w.t * 1.3);
      a.vy = 0; a.onGround = true; a.fallY = p.y; a.fallStart = p.y; a.moving = false;
      if (k >= 1) { p.y = g; a.g.rotation.x = a.g.rotation.z = 0; delete a.__w; fl.delete(a); } }
    U.floating = fl.size;
    if (dK > 0.3 && typeof drops !== 'undefined') { let n = 0; for (const d of drops) { if (n > (LOW ? 12 : 30)) break; if (Math.abs(d.x - P.x) > 30 || Math.abs(d.z - P.z) > 30) continue; n++;
        const s = dK * (LOW ? 1.2 : 1.5) * dt, nx = d.x + WX * s, nz = d.z + WZ * s; if (!solidAt(nx, d.y + 0.2, nz)) { d.x = nx; d.z = nz; if (d.m) d.m.position.x = nx, d.m.position.z = nz; if (!solidAt(nx, d.y - 0.3, nz)) d.rest = false; U.drift++; } } } }
  try { const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments); try { step(Math.min(0.1, +dt || 0.016)); } catch (e) { ERR('st', e); } return r; }; } catch (e) { ERR('wrap', e); }
})();
