/* GLX-C260 (v1.0.71): Reset world builds the new map nearest-first a few chunks per frame with no save errors, new worlds start with a
   map, a diamond axe and the unlimited XP splash potion, the big saucer only comes out at night (flies off at dawn), LT on an Egyptian
   never places or uses the held item, and the main menu shows an original controller + Bluetooth badge. */
(() => {
  const U = window.__c260 = {err: null, q: 0, built: 0, kits: 0, throws: 0, ufoBlock: 0, ufoLeave: 0, del: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e).slice(0, 160); };
  const ph = () => window.__c105 && __c105.phase; let quietUntil = 0;
  // ---------- reset: no autosave, no save-error toasts, old save deleted, progressive nearest-first build ----------
  try { const sw = saveWorld; saveWorld = function () { if (ph()) return true; return sw.apply(this, arguments); }; } catch (e) { ERR('sw', e); }
  try { const tt = toast; toast = function (m) { if (/could not save|couldn.t save/i.test(String(m)) && (ph() || performance.now() < quietUntil)) return; return tt.apply(this, arguments); }; } catch (e) { ERR('toast', e); }
  const Q = new Map(); let lastPh = null;
  try { const bc = buildChunk; buildChunk = function (cx, cz) { const p = ph();
      if ((p === 'gen' || p === 'land') && !buildChunk.__now) { const d = Math.hypot(cx + 0.5 - P.x / CH, cz + 0.5 - P.z / CH); if (d > 1.6) { Q.set(cx * 64 + cz, [cx, cz]); U.q = Q.size; return; } }
      return bc.apply(this, arguments); }; } catch (e) { ERR('bc', e); }
  function drain() { if (!Q.size) return; const pcx = P.x / CH, pcz = P.z / CH, arr = [...Q.values()].sort((a, b) => Math.hypot(a[0] + .5 - pcx, a[1] + .5 - pcz) - Math.hypot(b[0] + .5 - pcx, b[1] + .5 - pcz));
    const n = (window.LOWEND || (typeof PERF !== 'undefined' && PERF)) ? 2 : 4; buildChunk.__now = 1;
    try { for (let i = 0; i < n && i < arr.length; i++) { const [cx, cz] = arr[i]; Q.delete(cx * 64 + cz); try { buildChunk(cx, cz); U.built++; } catch (e) { ERR('build', e); } } } finally { buildChunk.__now = 0; } U.q = Q.size; }
  function delSave() { try { const id = current && current.id; if (!id) return; try { localStorage.removeItem('glen_w_' + id); localStorage.removeItem('glen_met_' + id); } catch (_) {} idbDo('worlds', 'readwrite', o => o.delete(id)).catch(() => {}); U.del++; } catch (e) { ERR('del', e); } }
  // ---------- starter kit + unlimited XP splash potion ----------
  const XPP = 479; try { IT.XPPOT = XPP; NAMES[XPP] = 'XP Splash Potion (unlimited)'; ORDER.push(XPP); if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(XPP);
    ICONS[XPP] = drawIcon(g => { g.fillStyle = '#d8f4ff'; g.fillRect(-6, -26, 12, 10); g.fillStyle = '#8a5a2a'; g.fillRect(-7, -30, 14, 6); const gr = g.createRadialGradient(-5, 4, 2, 0, 8, 22); gr.addColorStop(0, '#f4ffb0'); gr.addColorStop(0.5, '#7cf05a'); gr.addColorStop(1, '#1f8a3a');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 8, 19, 0, 7); g.fill(); g.strokeStyle = '#e8fff0'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 8, 19, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-7, 1, 4, 7, -0.5, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.fillText('\u221e', 0, 14); }); } catch (e) { ERR('item', e); }
  function kit() { window.__c260kit = kit; try { if (typeof cnt === 'function' && cnt(XPP) > 0) return; for (const id of [IT.MAP, IT.DAXE, XPP, IT.PISTOL, IT.MUSKET]) if (id) addItem(id, 1); /* v1.0.93: a pistol and a musket with infinite bullets */ try { renderHotbar(); } catch (_) {} U.kits++; } catch (e) { ERR('kit', e); } }
  window.__c260kit = kit; try { const ew = enterWorld; enterWorld = function (save) { const r = ew.apply(this, arguments); if (!save && !ph()) { const t = setInterval(() => { if (typeof started !== 'undefined' && started) { clearInterval(t); setTimeout(kit, 600); } }, 300); } return r; }; } catch (e) { ERR('ew', e); }
  const pots = [], fx = []; let lastThrow = 0; const potGeo = new THREE.SphereGeometry(0.13, 8, 6), potMat = new THREE.MeshBasicMaterial({color: 0x7cf05a});
  function throwPot() { const now = performance.now(); if (now - lastThrow < 150) return; lastThrow = now; if (pots.length > 10) { scene.remove(pots[0].m); pots.shift(); }
    const d = new THREE.Vector3(); camera.getWorldDirection(d); const m = new THREE.Mesh(potGeo, potMat); m.position.copy(camera.position).addScaledVector(d, 0.6); scene.add(m);
    pots.push({m, v: d.multiplyScalar(13).add(new THREE.Vector3(0, 2.5, 0)), t: 0}); U.throws++; try { swing(); } catch (_) {} }
  function splash(p) { try { dropXP(p.x, p.y, p.z, 20 + (Math.random() * 15 | 0)); } catch (e) { ERR('xp', e); }
    if (fx.length > 6) { const o = fx.shift(); scene.remove(o.pts); o.pts.geometry.dispose(); }
    const N = 40, pos = new Float32Array(N * 3), vel = []; for (let i = 0; i < N; i++) { pos.set([p.x, p.y + 0.2, p.z], i * 3); vel.push([(Math.random() - .5) * 5, Math.random() * 4 + 1, (Math.random() - .5) * 5]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({color: 0xb6ff7a, size: 0.18, transparent: true, opacity: 1, depthWrite: false}));
    scene.add(pts); fx.push({pts, vel, t: 0}); try { sfx3d ? sfx3d('squelch', p, 16) : 0; } catch (_) {} }
  function tickPots(dt) { for (let i = pots.length - 1; i >= 0; i--) { const o = pots[i]; o.t += dt; o.v.y -= 22 * dt; o.m.position.addScaledVector(o.v, dt); const q = o.m.position;
      if (o.t > 3 || solid(Math.floor(q.x), Math.floor(q.y), Math.floor(q.z))) { q.addScaledVector(o.v, -dt); splash(q.clone()); scene.remove(o.m); pots.splice(i, 1); } }
    for (let i = fx.length - 1; i >= 0; i--) { const o = fx[i]; o.t += dt; const a = o.pts.geometry.attributes.position; for (let k = 0; k < o.vel.length; k++) { o.vel[k][1] -= 12 * dt; a.array[k * 3] += o.vel[k][0] * dt; a.array[k * 3 + 1] += o.vel[k][1] * dt; a.array[k * 3 + 2] += o.vel[k][2] * dt; }
      a.needsUpdate = true; o.pts.material.opacity = Math.max(0, 1 - o.t / 0.9); if (o.t > 0.9) { scene.remove(o.pts); o.pts.geometry.dispose(); o.pts.material.dispose(); fx.splice(i, 1); } } }
  try { const ui = useItem; useItem = function () {
      try { if (window.__c259 && __c259.aimEg && __c259.aimEg()) return; } catch (_) {}   // LT on an Egyptian = dance only
      try { if (!menuOpen && !paused && !dead && started && selId === XPP && cnt(XPP) > 0) { throwPot(); return; } } catch (_) {}   // never consumed
      return ui.apply(this, arguments); }; } catch (e) { ERR('use', e); }
  // ---------- the saucer is a night visitor ----------
  const night = () => (typeof isNight !== 'undefined' && isNight) || (typeof daylight === 'number' && daylight < 0.3);
  function ufoHook() { const C = window.__c246; if (!C || C.__c260) return; C.__c260 = 1; const sp = C.spawn; C.spawnRaw = sp; C.spawn = function () { if (!night()) { U.ufoBlock++; return false; } return sp.apply(this, arguments); }; }
  function ufoDawn() { const C = window.__c246; if (!C || !C.ufo) return; const u = C.ufo(); if (!u || night() || u.st !== 'fly' || C.st === 'leaving' || (window.__c246b && __c246b.on)) return; try { C.leave(); U.ufoLeave++; } catch (_) {} }
  // ---------- main-menu controller badge (original SVG) ----------
  let badge = null; function mkBadge() { badge = document.createElement('div'); badge.id = 'c260pad'; badge.title = 'Bluetooth controller supported';
    badge.innerHTML = '<svg viewBox="0 0 72 40" width="64" height="36" aria-hidden="true"><path d="M14 9h20c7 0 10 4 12 11l2 9c1 5-3 8-7 5l-5-5H18l-5 5c-4 3-8 0-7-5l2-9c2-7 5-11 6-11z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 17v8M10 21h8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="33" cy="18" r="1.8" fill="currentColor"/><circle cx="37" cy="22" r="1.8" fill="currentColor"/><path d="M58 11l10 9-5 5V5l5 5-10 9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/></svg><span>Controller supported</span>';
    const st = document.createElement('style'); st.textContent = '#c260pad{position:fixed;right:calc(14px + env(safe-area-inset-right));bottom:calc(10px + env(safe-area-inset-bottom));z-index:60;display:none;flex-direction:column;align-items:center;gap:1px;color:#9fdcff;opacity:.55;filter:drop-shadow(0 0 4px rgba(90,190,255,.55));font:600 9px/1 system-ui,sans-serif;letter-spacing:.04em;pointer-events:none;transition:opacity .4s,filter .4s}#c260pad.on{opacity:1;color:#d8f3ff;filter:drop-shadow(0 0 6px rgba(120,210,255,.95)) drop-shadow(0 0 14px rgba(60,160,255,.7))}';
    document.head.appendChild(st); document.body.appendChild(badge); }
  function badgeTick() { try { if (!badge) mkBadge(); const show = typeof screen === 'string' && screen === 'title'; badge.style.display = show ? 'flex' : 'none'; if (!show) return; let pad = false; try { for (const g of navigator.getGamepads ? navigator.getGamepads() : []) if (g && g.connected) pad = true; } catch (_) {} badge.classList.toggle('on', pad); } catch (e) { ERR('badge', e); } }
  setInterval(() => { try { if (typeof mobs !== 'undefined') for (let i = mobs.length - 1; i >= 0; i--) { const m = mobs[i]; if (m && m.kind === 'nm08') { try { removeMob(m); } catch (_) {} if (mobs[i] === m) mobs.splice(i, 1); U.tiki = (U.tiki || 0) + 1; } } badgeTick(); ufoHook(); if (typeof started !== 'undefined' && started) ufoDawn(); } catch (e) { ERR('slow', e); } }, 700);
  let last = performance.now();
  const loop = now => { const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { const p = ph(); if (p !== lastPh) { if (p === 'lift' || p === 'del') { /* v1.0.88: the old save is NOT deleted when a reset starts - it stays until the new world is saved, so a reset cut short (tab closed on a phone) can never leave a world with no save */ quietUntil = performance.now() + 1e9; } if (!p && lastPh) { quietUntil = performance.now() + 8000; setTimeout(kit, 400); } lastPh = p; }
      if (Q.size && (p === 'gen' || p === 'land' || !p)) drain(); if (pots.length || fx.length) tickPots(dt); } catch (e) { ERR('loop', e); }
    requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
})();
