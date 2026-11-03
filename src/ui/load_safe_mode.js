/* ===================== GLX-C99 (v0.9.80): load safe mode + catching a frozen load on the next start ===================== */
(function c99() {
  const S = window.__c99 = {};
  // errors while the loading screen is up go on the loading screen (small text)
  addEventListener('error', e => { if (screen === 'loading') try { loadErr('script', e.error || e.message); } catch (_) {} });
  addEventListener('unhandledrejection', e => { if (screen === 'loading') try { loadErr('promise', e.reason); } catch (_) {} });
  // safe mode: terrain + player + inventory + chests only; bots, castle state, door states and boats start fresh
  const ap = applySave;
  applySave = function (d) {
    if (window.__safeLoad && d && !d.dim) { d = Object.assign({}, d); for (const k of ['c95', 'c96', 'c78', 'doors', 'boats', 'cauldrons']) delete d[k]; S.stripped = 1; arguments[0] = d; }
    const r = ap.apply(this, arguments);
    try { if (d && !d.dim) { // a broken player position (NaN / outside the world / far below) -> back to spawn
        if (!isFinite(P.x) || !isFinite(P.y) || !isFinite(P.z) || (!(window.__c317 && __c317.on()) && (P.x < 1 || P.z < 1 || P.x >= W - 1 || P.z >= D - 1)) || Math.abs(P.x) > 1e6 || Math.abs(P.z) > 1e6 || P.y < SEA - 1500) { console.warn('load: bad player position, respawning', P.x, P.y, P.z); spawnPlayer(); }
        if (!isFinite(P.yaw)) P.yaw = 0; else P.yaw %= 6.283185307179586; if (!isFinite(P.pitch)) P.pitch = 0;
        const sn = window.__c95 && __c95.snap; if (sn) for (const k of Object.keys(sn)) { const q = sn[k], ps = q && q.pos; if (!ps || !ps.every(isFinite) || ps[1] < 1 || ps[0] < 1 || ps[2] < 1 || ps[0] >= W - 1 || ps[2] >= D - 1) delete sn[k]; } } } catch (e) { console.warn('c99 sanitize', e); }
    return r;
  };
  function openSafe(id) {
    window.__safeLoad = true;
    const go = () => { const w = (worldList() || []).find(q => q && q.id === id) || (worldList() || [])[0]; if (!w) { toast('No world to open'); return; } playWorld(w); };
    const wait = setInterval(() => { if (screen === 'title' || screen === 'worlds') { clearInterval(wait); Promise.race([worldsReady, new Promise(r => setTimeout(r, 6000))]).then(go, go); } }, 300);
  }
  S.openSafe = openSafe;
  // pause menu: teleport to each clansman (safe standing spot next to him, land around him built first)
  function spotNear(x0, y0, z0) {
    const ok = (x, y, z) => solid(x, y - 1, z) && !solid(x, y, z) && !solid(x, y + 1, z) && ![T.WATER, T.LAVA].includes(getB(x, y, z)) && getB(x, y - 1, z) !== T.LAVA;
    for (let r = 1; r <= 4; r++) for (let dy of [0, 1, -1, 2, -2, 3]) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue; const x = x0 + dx, y = y0 + dy, z = z0 + dz; if (x > 1 && z > 1 && x < W - 2 && z < D - 2 && y > 0 && y < H - 2 && ok(x, y, z)) return [x, y, z]; }
    if (ok(x0, y0, z0)) return [x0, y0, z0];
    const gy = groundTop(x0, z0) + 1; return [x0, gy, z0];
  }
  function tpTo(m) {
    const p = m.g.position, sp = spotNear(Math.floor(p.x), Math.floor(p.y + 0.05), Math.floor(p.z));
    P.x = sp[0] + .5; P.y = sp[1]; P.z = sp[2] + .5; try { P.vy = 0; } catch (_) {}
    P.yaw = Math.atan2(-(p.x - P.x), -(p.z - P.z));
    try { rebuild(); } catch (e) { console.warn('tp rebuild', e); }
    setPause(false); toast('Teleported to the ' + (m.name || m.role));
  }
  S.tpTo = tpTo;
  function tpButtons() {
    const host = $('pause') && $('pause').querySelector('.btns'); if (!host) return;
    let box = document.getElementById('tpBots'); if (!box) { box = document.createElement('div'); box.id = 'tpBots'; box.style.cssText = 'display:contents'; const rb = $('resumeBtn'); host.insertBefore(box, rb ? rb.nextSibling : host.firstChild); }
    box.innerHTML = '';
    const bs = (typeof mobs !== 'undefined' ? mobs : []).filter(m => m.kind === 'clansman' && m.role && m.hp > 0 && m.g);
    for (const m of bs) { const b = document.createElement('button'); b.className = 'btn alt'; const nm = m.name || (m.role[0].toUpperCase() + m.role.slice(1));
      b.textContent = 'Teleport to ' + nm; b.setAttribute('data-testid', 'pause-tp-' + m.role); b.onclick = () => tpTo(m); box.appendChild(b); }
  }
  const sp0 = setPause; setPause = function (on) { const r = sp0.apply(this, arguments); if (on) try { tpButtons(); } catch (e) { console.warn('tp buttons', e); } return r; };
  let safeId = null; try { safeId = localStorage.getItem('glen_safe'); localStorage.removeItem('glen_safe'); } catch (_) {}
  if (safeId) { openSafe(safeId); return; }
  // the last load never finished (page froze or was closed on the loading screen): offer safe mode on the title screen
  let ld = null; try { ld = JSON.parse(localStorage.getItem('glen_load') || 'null'); } catch (_) {}
  if (ld && ld.id && Date.now() - (ld.hb || ld.t || 0) > 5000) {
    S.lastLoad = ld;
    const show = () => {
      if (document.getElementById('c99note')) return;
      const el = document.createElement('div'); el.id = 'c99note';
      el.style.cssText = 'position:fixed;left:50%;top:10%;transform:translateX(-50%);z-index:70;max-width:min(520px,92vw);background:rgba(20,28,22,.95);color:#f3ead2;border:2px solid #d9b45a;border-radius:14px;padding:14px 18px;font:15px/1.4 system-ui,sans-serif;text-align:center';
      const esc = t => String(t || '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
      el.innerHTML = '<b>' + esc(ld.name || 'Your world') + ' did not finish loading last time</b><br><small>stuck at: ' + esc(ld.step) + ' (' + esc(ld.v) + ')</small><br>' +
        '<button id="c99safe" style="margin:10px 6px 0;padding:8px 14px;font:600 14px system-ui">Open in safe mode</button><button id="c99no" style="margin:10px 6px 0;padding:8px 14px;font:14px system-ui">Dismiss</button>';
      document.body.appendChild(el);
      document.getElementById('c99safe').onclick = () => { el.remove(); try { localStorage.removeItem('glen_load'); } catch (_) {} openSafe(ld.id); };
      document.getElementById('c99no').onclick = () => { el.remove(); try { localStorage.removeItem('glen_load'); } catch (_) {} };
    };
    const w = setInterval(() => { if (screen === 'title') { clearInterval(w); show(); } }, 400);
  }
  // stale page check: compare this page's build with the live one (first 1 KB only, never cached); offer a cache-busting reload
  try {
    const mine = (() => { for (const n of (document.head ? document.head.childNodes : [])) if (n.nodeType === 8) { const m = /glencraft-build: ([a-z0-9.-]+)/.exec(n.nodeValue); if (m) return m[1]; } return null; })();
    S.build = mine;
    if (mine && /^https?:/.test(location.protocol + '') && !/localhost|127\.0\.0\.1/.test(location.host)) setTimeout(() => {
      fetch(location.origin + location.pathname + '?nc=' + Date.now(), {cache: 'no-store', headers: {Range: 'bytes=0-2047'}}).then(r => r.text()).then(t => { const m = /glencraft-build: ([a-z0-9.-]+)/.exec(t); S.live = m && m[1];
        if (S.live && S.live !== mine && !document.getElementById('c99upd')) { const el = document.createElement('div'); el.id = 'c99upd';
          el.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:71;background:rgba(20,28,22,.95);color:#f3ead2;border:2px solid #7fbf6a;border-radius:12px;padding:10px 14px;font:14px system-ui,sans-serif';
          el.innerHTML = 'A newer version is out. <button style="margin-left:8px;padding:6px 12px;font:600 14px system-ui">Update now</button>'; document.body.appendChild(el);
          el.querySelector('button').onclick = () => { try { if (started) saveWorld(true); } catch (_) {} setTimeout(() => location.replace(location.origin + location.pathname + '?v=' + S.live), 800); }; } }).catch(() => {});
    }, 4000);
  } catch (_) {}
  // in safe mode the extras that run on top of the world stay off for this session
  const tg = setInterval(() => { if (window.__safeLoad && started) { clearInterval(tg); setTimeout(() => toast('Safe mode: bots and castle doors were reset, your land, inventory and chests are kept'), 1500); } }, 500);
})();
