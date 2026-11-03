/* GLX-C262 (v1.0.74): encounter staging - the alien waits inside the crashed saucer until you walk within about 4 blocks of the hull,
   the crash crater fills with a flat glowing pool of Element 115 (kept with the world), the TV meteor warning stays up about 10 s,
   mobs stop spawning and freeze their AI during the YEAR 24000 vision, and the old grass-block cube is gone from the loading screen. */
(() => {
  const U = window.__c262 = {err: null, began: 0, pool: 0, paused: 0, hullR: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ': ' + ((e && e.message) || e); };
  try { const st = document.createElement('style'); st.textContent = '.cube{display:none!important}'; document.head.appendChild(st); } catch (e) { ERR('cube', e); }
  // ---------- the 115 pool ----------
  let pool = null;
  const key = () => 'glen_115_' + (current && current.id);
  function mkPool(x, y, z, r) { killPool(); const g = new THREE.Group(); g.userData.c255skip = 1;
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), new THREE.MeshBasicMaterial({color: 0x6bff4a, transparent: true, opacity: 0.88, depthWrite: false}));
    m.rotation.x = -Math.PI / 2; g.add(m);
    const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(160,255,120,.9)'); gr.addColorStop(1, 'rgba(60,255,80,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55})); s.scale.set(r * 2.6, r * 0.9, 1); s.position.y = 0.6; g.add(s);
    g.position.set(x, y, z); g.userData.m = m; scene.add(g); pool = g; U.pool = 1; }
  function killPool() { if (!pool) return; scene.remove(pool); pool.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); pool = null; U.pool = 0; }
  function fillCrater(p) { const X = Math.floor(p.x), Z = Math.floor(p.z); let lo = 1e9, n = 0, sum = 0;
    for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) { if (Math.hypot(dx, dz) > 6) continue; let y = Math.min(H - 2, Math.floor(p.y) + 6); while (y > 2 && !world[idx(X + dx, y, Z + dz)]) y--; lo = Math.min(lo, y); sum += y; n++; }
    const lvl = Math.min(lo + 1.6, sum / n + 0.4) + 1.02, r = 7.5; U.lvl = lvl; mkPool(X + 0.5, lvl, Z + 0.5, r); try { localStorage.setItem(key(), JSON.stringify([X + 0.5, lvl, Z + 0.5, r])); } catch (_) {} }
  function loadPool() { killPool(); try { const v = JSON.parse(localStorage.getItem(key()) || 'null'); if (v) mkPool(v[0], v[1], v[2], v[3]); } catch (_) {} }
  // ---------- the alien waits for you ----------
  const met = () => !!((window.__c246b && __c246b.done) || (current && (localStorage.getItem('glen_met_' + current.id) || (current.c246 && current.c246.met))));
  function hull(u) { if (u.hullR) return u.hullR; try { const b = new THREE.Box3().setFromObject(u.g), s = new THREE.Vector3(); b.getSize(s); u.hullR = Math.max(2, Math.min(6, Math.max(s.x, s.z) / 2)); } catch (_) { u.hullR = 8; } U.hullR = u.hullR; return u.hullR; }
  U.dist = () => { const u = window.__c246 && __c246.ufo(); if (!u) return null; return Math.hypot(P.x - u.g.position.x, P.z - u.g.position.z) - hull(u); };
  let lastW = null;
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments);
    try { if (current !== lastW) { lastW = current; loadPool(); }
      const u = window.__c246 && __c246.ufo && __c246.ufo();
      if (u && u.wait && u.st === 'wreck') { if (!u.pooled) { u.pooled = 1; fillCrater(u.g.position); }
        if (met()) u.wait = 0; else if (started && !paused && !dead && !(window.__c246b && __c246b.on) && Math.hypot(P.x - u.g.position.x, P.z - u.g.position.z) - hull(u) <= 4 && Math.abs(P.y - u.g.position.y) < 12) { u.wait = 0; U.began++; __c246b.begin(u); } }
      if (pool) { const k = performance.now() / 1000; pool.userData.m.material.color.setHSL(0.31, 1, 0.55 + Math.sin(k * 1.7) * 0.07); pool.visible = !DIM.cur; } } catch (e) { ERR('sky', e); } return r; };
  // ---------- the TV warning stays up ~10 s ----------
  try { const tt = toast; toast = function (m) { const r = tt.apply(this, arguments); try { if (/BRACE FOR IMPACT/i.test(String(m))) { clearTimeout(toastT); toastT = setTimeout(() => { try { $('toast').classList.remove('on'); } catch (_) {} }, 10000); U.tv = (U.tv || 0) + 1; } } catch (_) {} return r; }; } catch (e) { ERR('toast', e); }
  // ---------- the future vision pauses mobs ----------
  const vis = () => !!(window.__c248 && __c248.y === 1);
  try { const um = updateMobs; updateMobs = function () { if (vis()) { U.paused++; return; } return um.apply(this, arguments); }; } catch (e) { ERR('mobs', e); }
  try { if (typeof spawnKind === 'function') { const sk = spawnKind; spawnKind = function () { if (vis()) return null; return sk.apply(this, arguments); }; } } catch (_) {}
})();
