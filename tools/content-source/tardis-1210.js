/* GLX-V130 (v1.2.10): time box cockpit. A blue glass time rotor tube with flowing yellow energy on the console, a pilot stick beside it
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
  // ---- pinned hand: while flying, a gloved hand + sleeve grips the stick knob and follows its lean; the normal first person
  //      hand/arms are only skipped for the frames drawn while piloting (their pose/scale state is never touched) ----
  let grip = null, fore = null; const gv = new THREE.Vector3(), cv3 = new THREE.Vector3(), dv = new THREE.Vector3(), Yv = new THREE.Vector3(0, 1, 0);
  function mkGrip() { const SM = T.SM || (m => m), skin = SM(new THREE.MeshLambertMaterial({color: 0xe0b08a})), sl = SM(new THREE.MeshLambertMaterial({color: 0x2a3a6a}));
    grip = new THREE.Group(); const palm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.12), skin); grip.add(palm);
    for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.016, 6, 10, Math.PI * 1.3), skin); f.position.set(-0.04 + i * 0.027, 0.01, 0); f.rotation.y = Math.PI / 2; grip.add(f); }
    const th = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.07, 6), skin); th.position.set(-0.07, 0.03, 0.03); th.rotation.z = 0.9; grip.add(th);
    fore = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1, 10), sl); fore.geometry.translate(0, 0.5, 0);
    for (const o of [grip, fore]) { o.traverse(q => { if (q.material) { q.material.stencilFunc = T.camIn ? THREE.AlwaysStencilFunc : THREE.EqualStencilFunc; q.material.needsUpdate = true; } }); o.visible = false; scene.add(o); } }
  U.pinned = () => { const f = F(); return !!(f && f.pilot && T.inside && U.built && knob); };
  function placeGrip() { if (!grip) mkGrip(); const on = U.pinned(); grip.visible = fore.visible = on; if (!on) return;
    knob.updateMatrixWorld(true); knob.getWorldPosition(gv); grip.position.copy(gv); grip.quaternion.copy(stick.getWorldQuaternion(new THREE.Quaternion()));
    camera.updateMatrixWorld(true); cv3.set(0.28, -0.42, -0.15).applyMatrix4(camera.matrixWorld); dv.subVectors(gv, cv3); const L = dv.length() || 1;
    fore.position.copy(cv3); fore.scale.set(1, L, 1); fore.quaternion.setFromUnitVectors(Yv, dv.divideScalar(L)); }
  try { const rr = renderer.render; renderer.render = function (sc, cam) { let hide = null;
      try { if (sc === scene && cam === camera) { placeGrip(); if (U.pinned()) { hide = []; const R = window.__fpa && __fpa.rig ? __fpa.rig() : null; for (const o of [typeof hand !== 'undefined' ? hand : null, R]) if (o && o.visible) { o.visible = false; hide.push(o); } } } } catch (e) { ERR('grip', e); }
      try { return rr.apply(this, arguments); } finally { if (hide) for (const o of hide) o.visible = true; } }; } catch (e) { ERR('rr', e); }
  setInterval(() => { try { if (T.inside) build(); const f = F(); humOn(!!(f && f.pilot && T.inside)); } catch (e) { ERR('tick', e); } }, 250);
  try { const up = updatePlayer; updatePlayer = function (dt) { const r = up.apply(this, arguments); try { if (!U.built) return r; t += dt || 0.016;
      if (core) { core.material.opacity = 0.65 + 0.3 * Math.sin(t * 6); core.scale.x = core.scale.z = 1 + 0.15 * Math.sin(t * 9); }
      const f = F(); if (stick) { const L = (f && f.pilot && f.inp) ? f.inp : [0, 0]; stick.rotation.z += (-L[0] * 0.45 - stick.rotation.z) * Math.min(1, dt * 8); stick.rotation.x += (L[1] * 0.45 - stick.rotation.x) * Math.min(1, dt * 8); U.lean = [stick.rotation.x, stick.rotation.z]; } } catch (e) { ERR('anim', e); } return r; }; } catch (e) { ERR('up', e); }
})();
