/* GLX-V130 (v1.3.0): time box cockpit. A blue glass time rotor tube with flowing yellow energy on the console, a pilot stick beside it
   that leans with your input (your hand rests on it while you fly), chrome/purple/blue interior tint, and a looping in-flight hum
   made in code. Controls are in the TBOX3 flight patch: right stick = up/down and left/right, left stick = spin only, LS = boost. */
(function v130() {
  const T = window.__tbox, F = () => window.__tbox3; if (!T) return;
  const U = window.__v130 = {err: null, built: 0, hum: 0, boosts: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const RR = T.RR, HW = T.HW, CZ = HW - RR; let tube = null, core = null, stick = null, knob = null, t = 0;
  function build() { const room = T.parts && T.parts.room; if (!room || U.built) return; const SM = T.SM || (m => m);
    const glass = SM(new THREE.MeshPhongMaterial({color: 0x3a8cff, emissive: 0x0a2a66, transparent: true, opacity: 0.45, shininess: 120}));
    const energy = SM(new THREE.MeshBasicMaterial({color: 0xffd23a, transparent: true, opacity: 0.9}));
    const chrome = SM(new THREE.MeshPhongMaterial({color: 0xd8dde8, emissive: 0x202436, specular: 0xffffff, shininess: 140}));
    const g = new THREE.Group(); tube = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 3.2, 20, 1, true), glass); tube.position.y = 2.6; g.add(tube);
    core = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.0, 12), energy); core.position.y = 2.6; g.add(core);
    for (const y of [1.0, 4.2]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.06, 8, 24), chrome); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); }
    g.position.set(0, 0, CZ); room.add(g);
    const sg = new THREE.Group(); stick = sg; const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.75, 10), chrome); shaft.position.y = 0.375; sg.add(shaft);
    knob = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), SM(new THREE.MeshPhongMaterial({color: 0x7a3cff, emissive: 0x2a0a66, shininess: 90}))); knob.position.y = 0.78; sg.add(knob);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.12, 14), chrome); sg.add(base); sg.position.set(0.95, 0.95, CZ + 0.85); room.add(sg);
    for (const o of [g, sg]) o.traverse(q => { if (q.material) { q.material.stencilFunc = T.camIn ? THREE.AlwaysStencilFunc : THREE.EqualStencilFunc; q.material.needsUpdate = true; } });
    // chrome / purple / blue interior: tint the room's own materials once (shared only inside the box room)
    const seen = new Set(); room.traverse(q => { const m = q.material; if (!m || seen.has(m) || q === tube || q === core) return; seen.add(m); if (m.color && !m.map) { const c = m.color, l = (c.r + c.g + c.b) / 3; c.setRGB(0.55 * l + 0.35, 0.5 * l + 0.3, 0.75 * l + 0.45); if (m.emissive) m.emissive.setRGB(0.06, 0.03, 0.14); } });
    U.built = 1; }
  // flight hum (code-made, no recordings)
  let AC = null, hum = null; const vol = () => (typeof SET !== 'undefined' ? SET.sfx : 0.8);
  function humOn(on) { try { if (on && !hum) { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const a = AC, o1 = a.createOscillator(), o2 = a.createOscillator(), lf = a.createOscillator(), lg = a.createGain(), g = a.createGain(), f = a.createBiquadFilter();
        o1.type = 'sawtooth'; o1.frequency.value = 55; o2.type = 'triangle'; o2.frequency.value = 110.5; lf.frequency.value = 0.7; lg.gain.value = 18; lf.connect(lg); lg.connect(f.frequency); f.type = 'lowpass'; f.frequency.value = 420;
        g.gain.value = 0.0001; o1.connect(f); o2.connect(f); f.connect(g); g.connect(a.destination); o1.start(); o2.start(); lf.start(); g.gain.setTargetAtTime(0.07 * vol(), a.currentTime, 0.4); hum = {o: [o1, o2, lf], g}; U.hum++; }
      else if (!on && hum) { const h = hum; hum = null; h.g.gain.setTargetAtTime(0.0001, AC.currentTime, 0.3); setTimeout(() => { for (const o of h.o) try { o.stop(); } catch (_) {} }, 1200); } } catch (e) { ERR('hum', e); } }
  U.lean = [0, 0];
  setInterval(() => { try { if (T.inside) build(); const f = F(); humOn(!!(f && f.pilot && T.inside)); } catch (e) { ERR('tick', e); } }, 250);
  try { const up = updatePlayer; updatePlayer = function (dt) { const r = up.apply(this, arguments); try { if (!U.built) return r; t += dt || 0.016;
      if (core) { core.material.opacity = 0.65 + 0.3 * Math.sin(t * 6); core.scale.x = core.scale.z = 1 + 0.15 * Math.sin(t * 9); }
      const f = F(); if (stick) { const L = (f && f.pilot && f.inp) ? f.inp : [0, 0]; stick.rotation.z += (-L[0] * 0.45 - stick.rotation.z) * Math.min(1, dt * 8); stick.rotation.x += (L[1] * 0.45 - stick.rotation.x) * Math.min(1, dt * 8); U.lean = [stick.rotation.x, stick.rotation.z]; } } catch (e) { ERR('anim', e); } return r; }; } catch (e) { ERR('up', e); }
})();
