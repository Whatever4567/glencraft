
/* ===================== GLX-C127 (v1.0.9): pause menu - Teleport to Unicorn ===================== */
(function c127() {
  const U = window.__c125; if (!U) return;
  const R = window.__c127 = {n: 0, last: null};
  const NIGHTS = 7;
  const bad = b => b === T.WATER || b === T.LAVA;
  // a safe standing spot beside the unicorn: solid (not water/lava) under the feet, two clear non-water blocks to stand in
  const ok = (x, y, z) => x > 1 && z > 1 && x < W - 2 && z < D - 2 && y > 1 && y < H - 2 && solid(x, y - 1, z) && !bad(getB(x, y - 1, z)) && !solid(x, y, z) && !solid(x, y + 1, z) && !bad(getB(x, y, z)) && !bad(getB(x, y + 1, z));
  function spotBy(px, py, pz) { const x0 = Math.floor(px), z0 = Math.floor(pz), y0 = Math.floor(py + 0.05);
    for (let r = 2; r <= 7; r++) for (const dy of [0, 1, -1, 2, -2, 3, -3]) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue; const x = x0 + dx, z = z0 + dz, y = y0 + dy; if (ok(x, y, z)) return [x, y, z]; }
    for (let r = 2; r <= 12; r++) for (let a = 0; a < 16; a++) { const x = Math.floor(x0 + Math.sin(a / 16 * 6.283) * r), z = Math.floor(z0 + Math.cos(a / 16 * 6.283) * r), y = solidTop(x, z) + 1; if (ok(x, y, z)) return [x, y, z]; }
    return null; }
  function state() { const u = U.uni;
    if (!u || (current && current.flat)) return 'none';
    if (U.riding && U.riding()) return 'riding';
    if (u.s.dead) return 'dead';
    return 'ok'; }
  function nightsLeft() { const u = U.uni; return Math.max(1, NIGHTS - ((U.nights || 0) - ((u && u.s.deadAt) || 0))); }
  function go() { R.n++; const st = state();
    if (DIM.cur) { R.last = 'dim'; toast('The unicorn lives in the overworld - use Return to overworld first'); return false; }
    if (st === 'none') { R.last = 'none'; toast('There is no unicorn in this world'); return false; }
    if (st === 'riding') { R.last = 'riding'; toast('You are already riding the unicorn'); return false; }
    if (st === 'dead') { const n = nightsLeft(); R.last = 'dead'; toast('The unicorn has faded into starlight - it returns in ' + n + ' more night' + (n === 1 ? '' : 's')); return false; }
    const u = U.uni, p = u.g.position;
    if (!(p.y > 1)) p.y = solidTop(Math.floor(p.x), Math.floor(p.z)) + 1;
    const sp = spotBy(p.x, p.y, p.z); if (!sp) { R.last = 'nospot'; toast('Could not find a safe spot by the unicorn'); return false; }
    P.x = sp[0] + .5; P.y = sp[1]; P.z = sp[2] + .5; P.vy = 0; P.fallTop = null; P.kbx = 0; P.kbz = 0; P.onGround = true;
    try { if (typeof flying !== 'undefined') flying = false; } catch (_) {}
    P.yaw = Math.atan2(-(p.x - P.x), -(p.z - P.z));
    try { rebuild(); } catch (e) { console.warn('uni tp rebuild', e); }
    // no fall damage straight after landing
    R.safeT = 2;
    R.last = 'ok'; setPause(false); toast('Teleported to ' + (u.s.tamed && u.s.name ? u.s.name : 'the Unicorn')); return true; }
  R.go = go; R.state = state; R.nightsLeft = nightsLeft;
  const h0 = hurt; hurt = function (n, cause) { if (R.safeT > 0 && /fall/i.test(String(cause || ''))) return; return h0.apply(this, arguments); };
  // the button (only shown when it can do something useful: not while you are riding, not in flat worlds)
  function button() { const host = $('pause') && $('pause').querySelector('.btns'); if (!host) return;
    let b = document.getElementById('tpUniBtn'); const st = state();
    if (st === 'none' || st === 'riding') { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('button'); b.className = 'btn alt'; b.id = 'tpUniBtn'; b.setAttribute('data-testid', 'pause-tp-unicorn'); b.textContent = 'Teleport to Unicorn'; b.onclick = go; }
    const after = document.getElementById('tpBots') || $('resumeBtn'); if (b.previousSibling !== after) after.after(b); }
  const sp0 = setPause; setPause = function (on) { if (on) try { button(); } catch (e) { console.warn('uni tp button', e); } return sp0.apply(this, arguments); };
  // the unicorn comes back after 7 nights without needing a reload
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { if (R.safeT > 0) R.safeT -= dt; const u = U.uni; if (started && u && u.s.dead && (U.nights || 0) - (u.s.deadAt || 0) >= NIGHTS && U.setup && R.revN !== U.nights) { R.revN = U.nights; u.s.nights = U.nights; try { localStorage.setItem('glen_uni_' + ((current && (current.seed || current.id)) || 'w'), JSON.stringify(u.s)); } catch (_) {} U.setup(); } } catch (e) { R.err = String(e); }
    return r; };
})();
