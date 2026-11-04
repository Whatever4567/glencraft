/* GLX-C370 (v1.1.71, item 41): Tornado weather. Pick Tornado in the pause menu Weather row and a
   tall spinning funnel comes down in a storm near you and roams the land for about two minutes. It rips up natural blocks,
   trees and castle stone in its path and flings them out as pieces you can pick up, throws mobs, and lifts and spins you if
   you get too close. It never touches blocks you placed, never water or bedrock, and breaks at most a few blocks a second. */
(function c370() {
  const U = window.__c370 = {err: null, on: 0, broke: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  let T0 = null, life = 0, ang = 0, br = 0;
  const mat = new THREE.MeshBasicMaterial({color: 0x8a8f96, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false});
  function make() { const g = new THREE.Group(); g.name = 'tornado370';
    for (let i = 0; i < 8; i++) { const y0 = i * 5, r0 = 1.2 + i * i * 0.18, r1 = 1.2 + (i + 1) * (i + 1) * 0.18, m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, 5.2, 14, 1, true), mat); m.position.y = y0 + 2.6; m.userData.s = 1.5 + (8 - i) * 0.25; g.add(m); }
    const n = 300, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const h = Math.random() * 40, r = 1 + h * 0.25 + Math.random(), a = Math.random() * 6.28; p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = h; p[i * 3 + 2] = Math.sin(a) * r; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(p, 3)); const pts = new THREE.Points(pg, new THREE.PointsMaterial({color: 0x5a4a3a, size: 0.35})); pts.name = 'deb'; g.add(pts);
    return g; }
  function ground(x, z) { for (let y = H - 2; y > 0; y--) { const b = getB(x, y, z); if (b && b !== T.WATER && !(PLANT && PLANT[b])) return y; } return SEA; }
  U.start = () => { try { if (DIM.cur) return false; if (!T0) { T0 = make(); scene.add(T0); } const a = Math.random() * 6.28; T0.position.set(P.x + Math.cos(a) * 40, 0, P.z + Math.sin(a) * 40); T0.userData.h = a + Math.PI; T0.visible = true;
      life = 120; U.on = 1; try { setWeather('thunder'); } catch (_) {} return true; } catch (e) { ERR('start', e); return false; } };
  U.stop = () => { life = 0; U.on = 0; if (T0) T0.visible = false; };
  const pl = () => { try { return placedSet; } catch (_) { return null; } };
  let last = performance.now();
  setInterval(() => { try { const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; if (!U.on || !T0) return; if (DIM.cur || typeof started === 'undefined' || !started) { T0.visible = false; return; } T0.visible = true;
      life -= dt; if (life <= 0) { U.stop(); return; }
      // roam: a slow wander that keeps drifting back towards the player
      const tx = P.x - T0.position.x, tz = P.z - T0.position.z, far = Math.hypot(tx, tz); let h = T0.userData.h + (Math.random() - 0.5) * 0.25 * dt * 20;
      if (far > 70) h = Math.atan2(tz, tx); T0.userData.h = h; const sp = 4.5; T0.position.x += Math.cos(h) * sp * dt; T0.position.z += Math.sin(h) * sp * dt;
      const gx = Math.floor(T0.position.x), gz = Math.floor(T0.position.z); T0.position.y += (ground(gx, gz) + 1 - T0.position.y) * 0.2;
      ang += dt * 4; T0.children.forEach(m => { m.rotation.y = ang * (m.userData.s || 1); });
      // rip up blocks, capped
      br += dt * 5; const ps = pl();
      while (br >= 1) { br -= 1; const a = Math.random() * 6.28, r = Math.random() * 3, x = Math.floor(T0.position.x + Math.cos(a) * r), z = Math.floor(T0.position.z + Math.sin(a) * r);
        for (let y = Math.min(H - 2, Math.floor(T0.position.y) + 14); y > Math.floor(T0.position.y) - 3; y--) { const b = getB(x, y, z); if (!b) continue; if (b === T.WATER || b === T.LAVA || b === T.BEDROCK) break;
          if (ps && x >= 0 && z >= 0 && x < W && z < D && ps.has(idx(x, y, z))) break;
          setB(x, y, z, 0); U.broke++; const da = a + 1.2; try { if (Math.random() < 0.5) dropItem(b, 1, x + 0.5, y + 0.5, z + 0.5, Math.cos(da) * 9, 7 + Math.random() * 4, Math.sin(da) * 9); } catch (_) {} break; } }
      // throw mobs and the player
      for (const m of mobs) { const p = m.g && m.g.position; if (!p) continue; const dx = p.x - T0.position.x, dz = p.z - T0.position.z, d = Math.hypot(dx, dz); if (d > 6) continue;
        m.vy = Math.max(m.vy || 0, 8); m.onGround = false; m.kbx = (-dz / (d + 0.1) * 9 + dx * 0.6); m.kbz = (dx / (d + 0.1) * 9 + dz * 0.6); }
      const dx = P.x - T0.position.x, dz = P.z - T0.position.z, d = Math.hypot(dx, dz); U.pd = +d.toFixed(1);
      if (d < 5 && P.y < T0.position.y + 12) { P.vy = Math.max(P.vy || 0, 6.5); const k = dt * 7; P.x += (-dz / (d + 0.1)) * k + dx * 0.04; P.z += (dx / (d + 0.1)) * k + dz * 0.04; }
    } catch (e) { ERR('tick', e); } }, 50);
  // the Tornado button in the Weather row
  setInterval(() => { try { const s = document.getElementById('wxSeg'); if (!s || s.querySelector('[data-v="tornado"]')) return; const b = document.createElement('button'); b.dataset.v = 'tornado'; b.dataset.testid = 'pause-wxSeg-tornado';
      b.textContent = 'Tornado'; b.style.minHeight = '44px'; b.style.minWidth = '64px'; b.addEventListener('click', e => { e.stopImmediatePropagation(); if (U.on) { U.stop(); toast('Tornado gone'); } else if (U.start()) toast('A tornado is coming!'); }); s.appendChild(b); } catch (e) { ERR('btn', e); } }, 1500);
})();
