/* ===================== GLX-C248 (v1.0.59): the deeper trip - kaleidoscope / tunnel / mandala / morphing-wall vision scenes, a procedural ambient trip soundtrack,
   chattering chirp layers under the alien voice, and the YEAR 24000 climax (chrome ground round the real pyramid, giant truck-robot mechs with red LEDs, a burning skyline) ===================== */
(function c248() {
  const U = window.__c248 = {err: null, q: [], y: 0, mechs: 0, mus: 0, chirps: 0};
  const LOW = (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && PERF);
  const ERR = (w, e) => { if (!U.err) U.err = w + ': ' + (e && e.message || e); };
  // ---------- vision scenes (drawn small, scaled up: cheap on phones) ----------
  const sc = document.createElement('canvas'); sc.width = 160; sc.height = 90; const sg = sc.getContext('2d');
  const hs = (h, l) => 'hsl(' + ((h % 360 + 360) % 360) + ',100%,' + (l || 55) + '%)';
  function kaleido(g, t) { g.fillStyle = '#05010a'; g.fillRect(0, 0, 160, 90); g.save(); g.translate(80, 45); const n = 10;
    for (let s = 0; s < n; s++) { g.save(); g.rotate(s / n * 6.283 + t * 0.25); if (s % 2) g.scale(1, -1);
      for (let i = 0; i < 7; i++) { const r = 8 + i * 9 + Math.sin(t * 1.3 + i) * 4; g.fillStyle = hs(t * 60 + i * 40 + s * 8, 50 + i * 3); g.beginPath(); g.moveTo(r * 0.3, 0); g.lineTo(r, r * 0.22); g.lineTo(r * 0.8 + Math.sin(t + i) * 5, r * 0.42); g.closePath(); g.fill(); }
      g.restore(); } g.restore(); }
  function tunnel(g, t) { g.fillStyle = '#000'; g.fillRect(0, 0, 160, 90); for (let i = 18; i > 0; i--) { const z = ((i - t * 3) % 18 + 18) % 18 + 0.5, r = 70 / z * 3, sides = 6;
      g.strokeStyle = hs(i * 25 + t * 90, 60); g.lineWidth = Math.max(1, 6 / z); g.beginPath();
      for (let k = 0; k <= sides; k++) { const a = k / sides * 6.283 + t * 0.4 + z * 0.15; const x = 80 + Math.cos(a) * r + Math.sin(t + z) * 6, y = 45 + Math.sin(a) * r * 0.8; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } }
  function mandala(g, t) { const gr = g.createRadialGradient(80, 45, 2, 80, 45, 90); gr.addColorStop(0, hs(t * 40 + 180, 30)); gr.addColorStop(1, '#0a0014'); g.fillStyle = gr; g.fillRect(0, 0, 160, 90);
    for (let ring = 1; ring < 6; ring++) { const n = ring * 6, R = ring * 8.5; for (let k = 0; k < n; k++) { const a = k / n * 6.283 + t * (ring % 2 ? 0.3 : -0.3); g.fillStyle = hs(ring * 55 + k * 4 + t * 50, 60);
      g.beginPath(); g.ellipse(80 + Math.cos(a) * R, 45 + Math.sin(a) * R, 2.5 + Math.sin(t * 2 + k) * 1.2, 5, a, 0, 6.283); g.fill(); } } }
  function walls(g, t) { for (let y = 0; y < 90; y += 6) for (let x = 0; x < 160; x += 6) { const v = Math.sin(x * 0.07 + t) + Math.sin(y * 0.09 - t * 1.3) + Math.sin((x + y) * 0.05 + t * 0.7);
      g.fillStyle = hs(v * 70 + t * 30, 45 + v * 8); g.fillRect(x, y, 6, 6); g.fillStyle = 'rgba(0,0,0,.35)'; if ((x / 6 + y / 6 + (t * 2 | 0)) % 3 === 0) g.fillRect(x + 2, y + 2, 2, 2); } }
  const SC = [kaleido, tunnel, mandala, walls];
  U.scene = (g, w, h, k, t) => { SC[k % 4](sg, t); g.imageSmoothingEnabled = true; g.drawImage(sc, 0, 0, w, h); };
  // ---------- soundtrack + chirps ----------
  let mus = null;
  const out = () => (typeof master !== 'undefined' && master) || AC.destination;
  U.music = () => { try { if (!AC) initAudio(); if (!AC || mus) return; const o = AC.createGain(); o.gain.value = 0.0001; o.gain.linearRampToValueAtTime(0.12, AC.currentTime + 4); o.connect(out());
      const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400; f.Q.value = 6; f.connect(o); const dl = AC.createDelay(1), fb = AC.createGain(); dl.delayTime.value = 0.33; fb.gain.value = 0.45; f.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(o);
      const SC5 = [0, 3, 5, 7, 10, 12, 15], base = 146.8; let step = 0; mus = {o, f, iv: setInterval(() => { try { if (!AC) return; const now = AC.currentTime; f.frequency.setTargetAtTime(700 + 1200 * (0.5 + 0.5 * Math.sin(now * 0.13)), now, 0.5);
        for (let i = 0; i < 2; i++) { const n = SC5[(step * 3 + i * 4 + (step >> 3)) % SC5.length], os = AC.createOscillator(), g = AC.createGain(); os.type = i ? 'triangle' : 'sawtooth'; os.frequency.value = base * Math.pow(2, n / 12 + (i ? 1 : 0));
          g.gain.setValueAtTime(0.0001, now + i * 0.12); g.gain.exponentialRampToValueAtTime(0.18, now + i * 0.12 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.5); os.connect(g); g.connect(f); os.start(now + i * 0.12); os.stop(now + i * 0.12 + 0.6); }
        step++; U.mus++; } catch (_) {} }, 250)}; } catch (e) { ERR('mus', e); } };
  U.stopMusic = () => { if (!mus) return; const m = mus; mus = null; clearInterval(m.iv); try { m.o.gain.linearRampToValueAtTime(0, AC.currentTime + 3); } catch (_) {} };
  U.chirp = (sec) => { try { if (!AC) return; const now = AC.currentTime, n = Math.min(60, sec * 7 | 0); const g0 = AC.createGain(); g0.gain.value = 0.05; g0.connect(out());
      for (let i = 0; i < n; i++) { const t0 = now + i / 7 + Math.random() * 0.08, os = AC.createOscillator(), md = AC.createOscillator(), mg = AC.createGain(), g = AC.createGain(); const f = 900 + Math.random() * 2600;
        os.type = 'square'; os.frequency.setValueAtTime(f, t0); os.frequency.exponentialRampToValueAtTime(f * (Math.random() < 0.5 ? 1.8 : 0.5), t0 + 0.07); md.frequency.value = 30 + Math.random() * 90; mg.gain.value = f * 0.3; md.connect(mg); mg.connect(os.frequency);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(1, t0 + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08); os.connect(g); g.connect(g0); os.start(t0); md.start(t0); os.stop(t0 + 0.1); md.stop(t0 + 0.1); }
      U.chirps++; } catch (_) {} };
  // ---------- YEAR 24000 ----------
  let Y = null;
  const top = (x, z) => { for (let y = H - 2; y > 1; y--) { const b = world[idx(x, y, z)]; if (b && !PLANT[b] && b !== T.WATER) return y; } return SEA; };
  function mech(red, chrome, dark) { const g = new THREE.Group(), B = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
    const legs = []; for (const s of [-1, 1]) { const L = new THREE.Group(); L.position.set(s * 2.2, 10, 0); const th = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.5, 2), dark); th.position.y = -2.7; L.add(th); const sh = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 2.6), chrome); sh.position.y = -7.4; L.add(sh);
      const w = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 10), dark); w.rotation.z = 1.57; w.position.set(s * 1.2, -7, 0); L.add(w); const led = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.5, 0.2), red); led.position.set(0, -7.4, 1.35); L.add(led); g.add(L); legs.push(L); }
    B(6.5, 2, 3.5, dark, 0, 10.8, 0); B(7.5, 5.5, 4.2, chrome, 0, 14.3, 0); // pelvis + truck-cab chest
    for (let i = 0; i < 5; i++) B(0.35, 3, 0.2, dark, -1.6 + i * 0.8, 14, 2.15); // grille
    B(7.6, 0.35, 0.25, red, 0, 16.6, 2.15); B(1, 0.6, 0.25, red, -3, 12.3, 2.15); B(1, 0.6, 0.25, red, 3, 12.3, 2.15);
    for (const s of [-1, 1]) { B(1.4, 6, 1.6, dark, s * 4.6, 13.5, 0); B(1.2, 1.2, 4, chrome, s * 4.6, 17.5, -0.5); const sm = B(0.5, 4, 0.5, chrome, s * 2.8, 18.8, -1.8); sm.userData.stack = 1; }
    B(2.2, 2.2, 2, dark, 0, 18.2, 0.2); const visor = B(1.9, 0.45, 0.2, red, 0, 18.4, 1.25); g.userData = {legs, visor}; return g; }
  U.start24 = () => { try { if (Y) return; const p = window.__c239 && __c239.pyr; let cx = P.x, cz = P.z; if (p) { cx = p.cx + 0.5; cz = p.cz + 0.5; }
      const back = [P.x, P.y, P.z, P.yaw], g0 = top(Math.floor(cx), Math.floor(cz)); let best = null; // the most open spot looking at the pyramid
      for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, x = Math.floor(cx + Math.sin(a) * 72), z = Math.floor(cz + Math.cos(a) * 72); if (x < 2 || z < 2 || x > W - 3 || z > D - 3) continue; const gy0 = top(x, z); let bad = Math.abs(gy0 - SEA - 3) * 2;
        for (let d = 8; d < 48; d += 4) { const t = top(Math.floor(x + (cx - x) * d / 72), Math.floor(z + (cz - z) * d / 72)); if (t > gy0 + 2) bad += t - gy0; if (t <= SEA) bad += 3; }
        if (!best || bad < best[0]) best = [bad, x, z]; }
      const px = best[1], pz = best[2], gy = top(px, pz) + 1;
      P.x = px + 0.5; P.z = pz + 0.5; P.y = gy; P.yaw = Math.atan2(-(cx - P.x), -(cz - P.z));
      const g = new THREE.Group(); g.userData.__dcR = 1e9; const red = new THREE.MeshBasicMaterial({color: 0xff1020}), chrome = new THREE.MeshPhongMaterial({color: 0x9aa4b4, specular: 0xffffff, shininess: 140}), dark = new THREE.MeshPhongMaterial({color: 0x23262e, specular: 0x8899aa, shininess: 80});
      const gnd = new THREE.Mesh(new THREE.CircleGeometry(150, 48), new THREE.MeshPhongMaterial({color: 0xb8c4d4, specular: 0xffffff, shininess: 200, transparent: true, opacity: 0.72, depthWrite: false}));
      gnd.rotation.x = -Math.PI / 2; gnd.position.set(P.x, gy + 0.03, P.z); g.add(gnd);
      const ms = []; for (let i = 0; i < (LOW ? 3 : 5); i++) { const m = mech(red, chrome, dark), r = mech(red, chrome, dark); r.scale.y = -1; r.traverse(o => { if (o.material) o.material = o.material.clone(), o.material.transparent = true, o.material.opacity = 0.35; });
        m.userData.r = r; m.userData.a = i / 5 * 6.283; m.userData.R = 28 + i * 11; m.scale.setScalar(1.6); r.scale.set(1.6, -1.6, 1.6); m.userData.sp = (i % 2 ? 1 : -1) * (0.05 + i * 0.01); g.add(m); g.add(r); ms.push(m); }
      const sky = new THREE.Group(), win = new THREE.MeshBasicMaterial({color: 0xff6a20}), blk = new THREE.MeshBasicMaterial({color: 0x0b0608});
      for (let i = 0; i < 46; i++) { const a2 = i / 46 * 6.283 + Math.random() * 0.05, R = 150 + Math.random() * 50, h = 40 + Math.random() * 130, w = 10 + Math.random() * 18; const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), blk); b.position.set(P.x + Math.sin(a2) * R, gy + h / 2 - 4, P.z + Math.cos(a2) * R); sky.add(b);
        if (i % 2) { const s = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 1.2, w * 1.02), win); s.position.copy(b.position); s.position.y += h * (Math.random() - 0.3) * 0.5; sky.add(s); } } g.add(sky);
      scene.add(g); const fog = scene.fog ? [scene.fog.color.getHex(), scene.fog.near, scene.fog.far] : null, bg = scene.background && scene.background.isColor ? scene.background.getHex() : null;
      const tx = document.createElement('div'); tx.style.cssText = 'position:fixed;left:0;right:0;top:30%;text-align:center;z-index:72;pointer-events:none;font:900 clamp(34px,9vw,96px) monospace;color:#fff;letter-spacing:.12em;text-shadow:0 0 18px #f22,0 0 40px #f00;opacity:0;transition:opacity 1.5s';
      tx.textContent = 'YEAR 24000'; document.body.appendChild(tx); requestAnimationFrame(() => tx.style.opacity = 1); setTimeout(() => tx.style.opacity = 0, 6000);
      U.g = g; Y = {g, ms, back, fog, bg, tx, cx: P.x, cz: P.z, t: 0, far: camera.far}; camera.far = 600; camera.updateProjectionMatrix();
      const sk = document.createElement('div'); sk.style.cssText = 'position:fixed;inset:0;z-index:71;pointer-events:none;background:linear-gradient(to bottom,rgba(40,0,0,.78),rgba(150,20,0,.45) 38%,rgba(255,80,0,.12) 55%,rgba(0,0,0,0) 70%)'; document.body.appendChild(sk); Y.sk = sk; const ov = document.getElementById('c246ov'); if (ov) for (let i = 0; i < 2; i++) if (ov.children[i]) ov.children[i].style.visibility = 'hidden'; U.y = 1; U.mechs = ms.length;
      U.q.push('This is your world, in the year twenty four thousand.', 'The machines walk where your cities stood. They do not remember you.', 'The sky burns. The seas are gone. Only the old stones remain.', 'This does not have to happen. Choose differently. Take care of the Earth.'); } catch (e) { ERR('y24', e); } };
  U.stop24 = () => { if (!Y) return; const y = Y; Y = null; U.y = 2; try { scene.remove(y.g); y.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); y.tx.remove(); y.sk.remove(); const ov = document.getElementById('c246ov'); if (ov) for (let i = 0; i < 2; i++) if (ov.children[i]) ov.children[i].style.visibility = ''; camera.far = y.far; camera.updateProjectionMatrix(); [P.x, P.y, P.z, P.yaw] = y.back;
      if (y.fog && scene.fog) { scene.fog.color.setHex(y.fog[0]); scene.fog.near = y.fog[1]; scene.fog.far = y.fog[2]; } if (y.bg !== null) scene.background.setHex(y.bg); } catch (e) { ERR('y24s', e); } };
  function frame(dt) { if (!Y) return; Y.t += dt; const t = Y.t;
    try { if (scene.fog) { scene.fog.color.setHex(0x3a0c08); scene.fog.near = 60; scene.fog.far = 420; } if (scene.background && scene.background.isColor) scene.background.setHex(0x4a1208); } catch (_) {}
    for (const m of Y.ms) { const d = m.userData; d.a += d.sp * dt; m.position.set(Y.cx + Math.sin(d.a) * d.R, P.y - 1 + Math.abs(Math.sin(t * 2.2 + d.R)) * 0.3, Y.cz + Math.cos(d.a) * d.R); m.rotation.y = d.a + (d.sp > 0 ? 1.57 : -1.57);
      const sw = Math.sin(t * 2.2 + d.R) * 0.45; d.legs[0].rotation.x = sw; d.legs[1].rotation.x = -sw; d.visor.material.color.setHex(Math.sin(t * 6 + d.R) > -0.6 ? 0xff1020 : 0x400005);
      const r = d.r; r.position.set(m.position.x, 2 * (P.y - 0.97) - m.position.y, m.position.z); r.rotation.y = m.rotation.y; r.userData.legs[0].rotation.x = sw; r.userData.legs[1].rotation.x = -sw; } }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { frame(Math.min(0.25, +dt || 0.016)); } catch (e) { ERR('fr', e); } return r; };
  try { const ew = enterWorld; enterWorld = function () { if (Y) U.stop24(); U.stopMusic(); return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
})();
