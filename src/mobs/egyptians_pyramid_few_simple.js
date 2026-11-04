/* ===================== GLX-C240 (v1.0.54): Egyptians at the pyramid - a few simple villager-like folk in white and gold linen with tan
   skin and kohl-lined eyes, and one pharaoh in a blue and gold striped nemes. They wander the hall and porch, turn to look at you and
   murmur in deep voices. Decorative folk: no health, drops or trades, so nothing else in the game changes. ===================== */
(function c240() {
  const U = window.__c240 = {err: null, n: 0};
  try {
    const SK = ['#b9855a', '#a87449', '#c79466', '#9a6a40'];
    function face(skin, ph) { const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d');
      g.fillStyle = skin; g.fillRect(0, 0, 8, 8); g.fillStyle = ph ? '#1f3f9a' : '#16110c'; g.fillRect(0, 0, 8, 2); g.fillRect(0, 0, 1, 5); g.fillRect(7, 0, 1, 5);
      if (ph) { g.fillStyle = '#e2b53a'; g.fillRect(1, 1, 6, 1); g.fillRect(3, 0, 2, 1); }
      g.fillStyle = '#0b0b0b'; g.fillRect(1, 3, 3, 1); g.fillRect(4, 3, 3, 1); g.fillStyle = '#f2efe6'; g.fillRect(2, 4, 1, 1); g.fillRect(5, 4, 1, 1);
      g.fillStyle = '#2a1a10'; g.fillRect(3, 4, 1, 1); g.fillRect(6, 4, 1, 1); g.fillStyle = '#0b0b0b'; g.fillRect(1, 4, 1, 1); g.fillRect(7, 3, 1, 1);
      g.fillStyle = '#7a4a2e'; g.fillRect(3, 6, 2, 1); if (ph) { g.fillStyle = '#3a2a10'; g.fillRect(3, 7, 2, 1); }
      const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; }
    function stripes(a, b, n) { const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); for (let i = 0; i < 8; i++) { g.fillStyle = (Math.floor(i / (8 / n)) % 2) ? b : a; g.fillRect(0, i, 8, 1); } const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; return t; }
    const L = c => new THREE.MeshLambertMaterial({color: c}), LM = t => new THREE.MeshLambertMaterial({map: t});
    const box = (w, h, d, m, x, y, z, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o; };
    function make(i, ph) { const g = new THREE.Group(), skin = SK[i % SK.length], sk = L(skin), lin = L(ph ? '#f4efe0' : ['#efe9d8', '#e6dcc2', '#f2ede2'][i % 3]), gold = L('#d9a92e');
      const legs = [-0.09, 0.09].map(x => { const q = new THREE.Group(); q.position.set(x, 0.7, 0); box(0.16, 0.7, 0.16, sk, 0, -0.35, 0, q); g.add(q); return q; });
      box(0.44, 0.34, 0.26, lin, 0, 0.62, 0, g);                              // linen kilt
      box(0.4, 0.42, 0.22, ph ? gold : sk, 0, 1.0, 0, g);                       // chest (pharaoh: gold pectoral)
      box(0.46, 0.1, 0.25, gold, 0, 1.17, 0, g);                                // broad gold collar
      box(0.42, 0.05, 0.27, gold, 0, 0.8, 0, g);                                // belt
      const arms = [-0.29, 0.29].map(x => { const q = new THREE.Group(); q.position.set(x, 1.18, 0); box(0.14, 0.56, 0.14, sk, 0, -0.27, 0, q); box(0.15, 0.06, 0.15, gold, 0, -0.42, 0, q); g.add(q); return q; });
      const hd = new THREE.Group(); hd.position.set(0, 1.22, 0); g.add(hd); const fm = LM(face(skin, ph));
      box(0.4, 0.4, 0.4, [sk, sk, ph ? LM(stripes('#1f3f9a', '#e2b53a', 4)) : L('#16110c'), sk, fm, ph ? L('#1f3f9a') : L('#16110c')], 0, 0.2, 0, hd);
      if (ph) { const nm = LM(stripes('#1f3f9a', '#e2b53a', 6)); box(0.12, 0.5, 0.12, nm, -0.24, 0.0, 0.06, hd); box(0.12, 0.5, 0.12, nm, 0.24, 0.0, 0.06, hd); box(0.46, 0.14, 0.46, nm, 0, 0.42, -0.02, hd); box(0.46, 0.44, 0.08, nm, 0, 0.12, -0.24, hd);
        box(0.06, 0.08, 0.06, gold, 0, 0.42, 0.24, hd); box(0.08, 0.14, 0.05, L('#3a2a10'), 0, -0.05, 0.2, hd); }
      else if (i % 2) box(0.42, 0.08, 0.42, gold, 0, 0.36, 0, hd);           // gold headband
      g.userData.__dcR = 0; return {g, legs, arms, hd, ph, x: 0, z: 0, tx: 0, tz: 0, yaw: 0, wt: Math.random() * 3, ph2: Math.random() * 6, vt: 3 + Math.random() * 8}; }
    const folk = []; let key = null, ac = null; U.folk = folk; U.make = (i, ph) => make(i, ph); U.spawnAt = o => { key = o; spawn(o); };
    function voice(f, ph) { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state !== 'running') ac.resume();
        const t = ac.currentTime, o = ac.createOscillator(), b = ac.createBiquadFilter(), gn = ac.createGain(), d = Math.hypot(P.x - f.x, P.z - f.z), v = Math.max(0, 0.22 - d * 0.018) * (window.__vol || 1);
        if (v <= 0) return; o.type = 'sawtooth'; const f0 = ph ? 68 : 82 + Math.random() * 14; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * (0.85 + Math.random() * 0.3), t + 0.35); o.frequency.linearRampToValueAtTime(f0 * 0.9, t + 0.7);
        b.type = 'bandpass'; b.frequency.setValueAtTime(380, t); b.frequency.linearRampToValueAtTime(260 + Math.random() * 300, t + 0.5); b.Q.value = 3; gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(v, t + 0.08); gn.gain.linearRampToValueAtTime(0, t + 0.75);
        o.connect(b); b.connect(gn); gn.connect(ac.destination); o.start(t); o.stop(t + 0.8); } catch (_) {} }
    function spawn(o) { for (const f of folk) scene.remove(f.g); folk.length = 0;
      const spots = [[-2, 3], [1, -3], [-3, -2], [0, 0]]; spots.forEach(([u, v], i) => { const f = make(i, i === 3); const [x, z] = o.L(u, v); f.x = f.tx = x + 0.5; f.z = f.tz = z + 0.5; f.y = o.hy; scene.add(f.g); folk.push(f); });
      U.n = folk.length; }
    function pick(f, o) { const u = -3.5 + Math.random() * 6, v = -4.2 + Math.random() * 8.4, [x, z] = o.L(Math.floor(u), Math.floor(v)); f.tx = x + 0.5; f.tz = z + 0.5; }
    const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments);
      try { const o = window.__c239 && __c239.pyr; if (o && o !== key && o.L) { key = o; spawn(o); }   /* v1.0.86: never cleared when the pyramid scan blinks - c270 brings the saved pyramid back */
        if (!o || !started) return r; const near = Math.hypot(P.x - (o.cx + 0.5), P.z - (o.cz + 0.5)) < 70, live = !paused && !dead && !DIM.cur; dt = Math.min(dt || 0.016, 0.1);
        for (const f of folk) { f.g.visible = !DIM.cur; if (!near || !live) continue; if (f.dz) continue;
          const dpx = P.x - f.x, dpz = P.z - f.z, dp = Math.hypot(dpx, dpz); let mv = 0, want = f.yaw;
          if (dp < 4.5) want = Math.atan2(dpx, dpz); else { const dx = f.tx - f.x, dz = f.tz - f.z, dd = Math.hypot(dx, dz);
            if (dd < 0.15) { if ((f.wt -= dt) <= 0) { f.wt = 2 + Math.random() * 5; pick(f, o); } } else { const s = Math.min(dd, dt * 0.9); f.x += dx / dd * s; f.z += dz / dd * s; want = Math.atan2(dx, dz); mv = 1; } }
          let dy = want - f.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); f.yaw += dy * Math.min(1, dt * 5);
          f.ph2 += dt * (mv ? 7 : 1.2); const sw = mv ? Math.sin(f.ph2) * 0.5 : 0; f.legs[0].rotation.x = sw; f.legs[1].rotation.x = -sw; f.arms[0].rotation.x = -sw * 0.7; f.arms[1].rotation.x = sw * 0.7 + (f.ph && !mv ? -0.5 : 0);
          f.hd.rotation.x = dp < 4.5 ? Math.max(-0.4, Math.min(0.4, -(P.y + 1.5 - f.y - 1.6) / Math.max(1, dp) * 0.7)) : Math.sin(f.ph2 * 0.3) * 0.05;
          f.g.position.set(f.x, f.y, f.z); f.g.rotation.y = f.yaw; if (dp < 14 && (f.vt -= dt) <= 0) { f.vt = 5 + Math.random() * 10; voice(f, f.ph); } }
      } catch (e) { if (!U.err) { U.err = String(e); console.warn('c240', e); } } return r; };
  } catch (e) { U.err = String(e); console.warn('c240 init', e); }
})();
