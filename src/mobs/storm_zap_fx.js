// GLX-ZAP v1.1.59: the Thunner Cloudie lightning strike gets a big zap - a thick forked bolt, a bright flash of light, a scorch glow and a spray of sparks.
// Also the loud explosion sound is swapped for a soft short thump made in game (no sample, nothing to credit beyond the game itself).
(function () { const U = window.__zap = {n: 0, soft: 0};
  const TEX = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(190,225,255,0.8)'); g.addColorStop(1, 'rgba(120,170,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const live = [];
  function forkPts(x, y0, z, top, jit) { const p = []; let px = x + (Math.random() - .5) * 3, pz = z + (Math.random() - .5) * 3; for (let y = top; y > y0; y -= 1.5) { const t = (y - y0) / (top - y0), nx = x + (px - x) * t + (Math.random() - .5) * jit, nz = z + (pz - z) * t + (Math.random() - .5) * jit, ny = Math.max(y0, y - 1.5); p.push(V(px, y, pz), V(nx, ny, nz)); px = nx; pz = nz; } return p; }
  const V = (a, b, c) => new THREE.Vector3(a, b, c);
  window.__zapFx = function (x, y, z) { try { U.n++; const top = y + 30, objs = [];
      // core bolt as a fat glowing tube plus forks
      const core = forkPts(x, y, z, top, 1.6), path = new THREE.CatmullRomCurve3(core.filter((_, i) => i % 2 === 0).concat([V(x, y, z)]));
      for (const [r, c, o] of [[0.12, 0xffffff, 1], [0.35, 0x9fd0ff, 0.45]]) { const m = new THREE.Mesh(new THREE.TubeGeometry(path, 40, r, 5, false), new THREE.MeshBasicMaterial({color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false})); m.frustumCulled = false; scene.add(m); objs.push(m); }
      for (let f = 0; f < 4; f++) { const sy = y + 6 + Math.random() * 18, br = forkPts(x + (Math.random() - .5) * 2, sy - 5 - Math.random() * 5, z + (Math.random() - .5) * 2, sy, 2.5); const L = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(br), new THREE.LineBasicMaterial({color: 0xdcefff, transparent: true, opacity: 0.9, fog: false})); scene.add(L); objs.push(L); }
      // flash light and ground glow
      const lt = new THREE.PointLight(0xbfe0ff, 6, 40); lt.position.set(x, y + 3, z); scene.add(lt); objs.push(lt);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({map: TEX, color: 0xcfe8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false})); gl.position.set(x, y + 0.6, z); gl.scale.set(7, 7, 1); scene.add(gl); objs.push(gl);
      // sparks
      const sp = []; for (let i = 0; i < 40; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({map: TEX, color: i % 3 ? 0xbfe0ff : 0xfff2b0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false})); const a = Math.random() * 6.28, v = 3 + Math.random() * 6; s.position.set(x, y + 0.4, z); s.scale.setScalar(0.25 + Math.random() * 0.2); s.userData.v = V(Math.cos(a) * v, 3 + Math.random() * 6, Math.sin(a) * v); scene.add(s); sp.push(s); }
      live.push({objs, sp, t: 0}); try { shake(0.4, 0.05); } catch (_) {} } catch (e) { U.err = String(e); } };
  let last = performance.now();
  (function tick() { requestAnimationFrame(tick); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (let i = live.length - 1; i >= 0; i--) { const L = live[i]; L.t += dt; const f = Math.max(0, 1 - L.t / 0.6), fl = L.t < 0.35 ? (Math.random() < 0.5 ? 1 : 0.35) : f;
      for (const o of L.objs) { if (o.isPointLight) o.intensity = 6 * fl; else if (o.material) o.material.opacity = (o.isSprite ? 1 : o.material.userData.o0 || (o.material.userData.o0 = o.material.opacity)) * fl; }
      for (const s of L.sp) { const v = s.userData.v; v.y -= 14 * dt; s.position.addScaledVector(v, dt); s.material.opacity = Math.max(0, 1 - L.t / 0.9); }
      if (L.t > 0.9) { for (const o of L.objs.concat(L.sp)) { scene.remove(o); if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); } live.splice(i, 1); } } })();
  // soft boom: replace the loud explosion synth with a quiet low thump
  try { const ps = playSound; playSound = function (kind, vol, pan, mat) { if (kind === 'boom') { U.soft++; try { const t = AC.currentTime, g = AC.createGain(), o = AC.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.45); const v = Math.min(0.22, 0.22 * (vol == null ? 1 : vol)); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.002, v), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(g); g.connect(typeof master !== 'undefined' ? master : AC.destination); o.start(t); o.stop(t + 0.55); } catch (_) {} return ps.call(this, 'thud', Math.min(0.5, (vol == null ? 1 : vol) * 0.4), pan, mat); } return ps.apply(this, arguments); }; } catch (e) { U.err = String(e); }
})();
