// v1.1.33: zero clipping - swept move with sub steps and push out, for walking, jetpack and flying, plus a fresh version check
(function () {
  const Z = window.__c325 = {fix: 0, push: 0, sweep: 0, err: null};
  const hit = (x, y, z) => { try { return collides(x, y, z); } catch (_) { return false; } };
  const riding = () => { const u = window.__c309, r = window.__c299; return !!((u && u.on) || (r && r.on)); };
  const skip = () => typeof started === 'undefined' || !started || (typeof MODE !== 'undefined' && MODE.noclip) || riding();
  const DIRS = [[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]];
  function depen() {
    if (!hit(P.x, P.y, P.z)) return false;
    for (let d = 0.02; d <= 2.6; d += d < 0.3 ? 0.02 : 0.1) for (const v of DIRS) {
      const x = P.x + v[0] * d, y = P.y + v[1] * d, z = P.z + v[2] * d;
      if (!hit(x, y, z)) { P.x = x; P.y = y; P.z = z; if (v[1] > 0 && P.vy < 0) P.vy = 0; if (v[1] < 0 && P.vy > 0) P.vy = 0; Z.push++; return true; } }
    for (let k = 1; k <= 24; k++) if (!hit(P.x, P.y + k * 0.5, P.z)) { P.y += k * 0.5; P.vy = 0; Z.push++; return true; }
    return false;
  }
  function sweep(ox, oy, oz) {
    const dx = P.x - ox, dy = P.y - oy, dz = P.z - oz, L = Math.hypot(dx, dy, dz);
    if (L < 1e-6 || L > 60 || !hit(P.x, P.y, P.z) && L < 0.2) return;
    const n = Math.min(300, Math.ceil(L / 0.1));
    let clear = true; for (let i = 1; i <= n; i++) if (hit(ox + dx * i / n, oy + dy * i / n, oz + dz * i / n)) { clear = false; break; }
    if (clear) return;
    let x = ox, y = oy, z = oz;
    for (let i = 1; i <= n; i++) {
      const sx = dx / n, sy = dy / n, sz = dz / n;
      if (!hit(x, y + sy, z)) y += sy; else if (sy < 0) { if (P.vy < 0) P.vy = 0; } else if (P.vy > 0) P.vy = 0;
      if (!hit(x + sx, y, z)) x += sx;
      if (!hit(x, y, z + sz)) z += sz;
    }
    if (x !== P.x || y !== P.y || z !== P.z) Z.sweep++;
    P.x = x; P.y = y; P.z = z;
  }
  setTimeout(() => { try { const up = updatePlayer; updatePlayer = function (dt, mx, mz) {
    if (skip()) return up.apply(this, arguments);
    const sw = window.__c321 ? __c321.sw : 0, ox = P.x, oy = P.y, oz = P.z, freeBefore = !hit(ox, oy, oz);
    const r = up.apply(this, arguments);
    try { if (!skip()) { const same = !window.__c321 || __c321.sw === sw;
      if (same && freeBefore) sweep(ox, oy, oz);
      if (depen()) Z.fix++; } } catch (e) { Z.err = String(e); }
    return r; }; } catch (e) { Z.err = String(e); } }, 4200);
  Z.depen = depen;
  // fresh version check: phones that kept an old copy reload to the new one
  const V = typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '';
  function check() { try { if (!/^https?:/.test(location.protocol)) return;
    fetch('version.json?t=' + Date.now(), {cache: 'no-store'}).then(r => r.ok ? r.json() : null).then(j => {
      if (!j || !j.v || j.v === V) return;
      const k = 'glen_vr_' + j.v; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1');
      try { if (typeof saveWorld === 'function' && typeof started !== 'undefined' && started) saveWorld(); } catch (_) {}
      const u = new URL(location.href); u.searchParams.set('v', j.v); setTimeout(() => location.replace(u.toString()), 800);
    }).catch(() => {}); } catch (_) {} }
  setTimeout(check, 2500); setInterval(check, 300000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  try { if ('serviceWorker' in navigator && /^https:/.test(location.protocol)) navigator.serviceWorker.register('sw.js?v=' + V).then(g => { try { g.update(); } catch (_) {} }).catch(() => {}); } catch (_) {}
})();
