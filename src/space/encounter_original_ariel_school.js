/* ===================== GLX-C246B (v1.0.59): THE ENCOUNTER - an original Ariel-School-style alien (slender, huge glossy black star-speckled eyes) floats out of the wreck in an
   iridescent alien-tech bubble with orbiting geometric shapes and glyph rings. You are frozen in green light for ~90 s while it SPEAKS (browser speech, pitched down, with an
   ethereal shimmer bed) and visions + real public-domain footage play AROUND it, never over it. Then the saucer darts off. ===================== */
(function c246b() {
  const U = window.__c246b = {err: null, on: 0, t: 0, lines: 0, clips: 0, tts: 0, seg: ''};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const LOW = (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && PERF);
  const DC = o => { o.traverse(c => { c.userData.__dcR = 1e9; c.userData.__dcK = 1; c.frustumCulled = false; }); return o; };
  const LEN = 95;   // v1.0.74: cut to under half - emerge, speech + full-screen clips, chrome YEAR 24000 at 58-86 s, farewell, exit
  const Y0 = 52, Y1 = 58, Y2 = 86;   // chrome future pre-built behind the last clip from Y0, shown Y1..Y2
  const LEN0 = 200; // v1.0.59: about 3.5 minutes in all - emerge, speech, visions, the YEAR 24000 climax at 150-188 s, farewell, exit
  // ---------- the alien ----------
  function eyeTex() { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#020208'; g.fillRect(0, 0, 128, 64);
    const gr = g.createRadialGradient(64, 32, 4, 64, 32, 60); gr.addColorStop(0, 'rgba(60,40,120,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 64);
    for (let i = 0; i < 140; i++) { const s = Math.random() < 0.08 ? 2 : 1; g.fillStyle = 'rgba(255,255,255,' + (0.4 + Math.random() * 0.6) + ')'; g.fillRect(Math.random() * 128, Math.random() * 64, s, s); } return new THREE.CanvasTexture(c); }
  function mkAlien() { const g = new THREE.Group(), skinTx = new THREE.TextureLoader().load('assets/ui/alien_skin.png'), skin = new THREE.MeshStandardMaterial({map: skinTx, color: 0xffffff, roughness: 0.2, metalness: 0.35, emissive: 0x6020a0, emissiveMap: skinTx, emissiveIntensity: 0.55}), suit = skin, et = eyeTex();
    const eyeM = new THREE.MeshStandardMaterial({color: 0x000000, emissive: 0xc060ff, emissiveMap: et, emissiveIntensity: 1.6, roughness: 0.03, metalness: 0.6});
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 22, 16), skin); head.scale.set(1, 1.3, 0.95); head.position.y = 1.72; g.add(head); g.userData.head = head;
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), eyeM); e.scale.set(1.25, 0.72, 0.5); e.position.set(s * 0.18, 0.02, 0.33); e.rotation.z = s * 0.5; head.add(e); }
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.25, 8), skin); neck.position.y = 1.3; g.add(neck);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.7, 12), suit); body.position.y = 0.92; g.add(body);
    const arms = []; for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * 0.19, 1.2, 0); const u = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.85, 6), suit); u.position.y = -0.42; a.add(u);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), skin); h.position.y = -0.87; a.add(h); a.rotation.z = s * 0.12; g.add(a); arms.push(a); }
    for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.6, 6), suit); l.position.set(s * 0.07, 0.3, 0); g.add(l); }
    skinTx.wrapS = skinTx.wrapT = THREE.RepeatWrapping; g.userData.arms = arms; g.userData.skin = skin; return g; }
  // ---------- the bubble ----------
  const bubVS = 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }';
  const bubFS = 'uniform float uT; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2); vec3 c = 0.5 + 0.5 * cos(6.2831 * (f * 1.6 + uT * 0.12 + vec3(0.0, 0.33, 0.67))); gl_FragColor = vec4(c, 0.08 + f * 0.75); }';
  function glyphTex() { const c = document.createElement('canvas'); c.width = 512; c.height = 32; const g = c.getContext('2d'); g.fillStyle = '#9fffe0'; g.shadowColor = '#3fffc0'; g.shadowBlur = 6;
    for (let x = 6; x < 506; x += 16) { const t = (x * 7) % 5; g.fillRect(x, 8, 2, 16); if (t > 0) g.fillRect(x, 8 + t * 3, 9, 2); if (t > 2) g.fillRect(x + 7, 10, 2, 12); if (t === 4) { g.beginPath(); g.arc(x + 4, 22, 3, 0, 7); g.fill(); } } const tx = new THREE.CanvasTexture(c); tx.wrapS = THREE.RepeatWrapping; return tx; }
  function mkBubble() { const g = new THREE.Group(), mat = new THREE.ShaderMaterial({uniforms: {uT: {value: 0}}, vertexShader: bubVS, fragmentShader: bubFS, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending});
    g.add(new THREE.Mesh(new THREE.SphereGeometry(1.6, 32, 20), mat)); const al = mkAlien(); al.position.y = -1.05; al.scale.setScalar(0.95); g.add(al);
    const orb = new THREE.Group(), gm = [new THREE.OctahedronGeometry(0.22), new THREE.TetrahedronGeometry(0.24), new THREE.IcosahedronGeometry(0.2), new THREE.TorusGeometry(0.16, 0.05, 6, 16), new THREE.BoxGeometry(0.26, 0.26, 0.26), new THREE.DodecahedronGeometry(0.2)];
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(gm[i], new THREE.MeshBasicMaterial({color: new THREE.Color().setHSL(i / 6, 1, 0.6), wireframe: i % 2 === 0})); const a = i / 6 * 6.283; m.position.set(Math.sin(a) * 2.2, Math.sin(a * 2) * 0.5, Math.cos(a) * 2.2); orb.add(m); } g.add(orb);
    const gt = glyphTex(), rings = []; for (let i = 0; i < 2; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(1.95 + i * 0.3, 1.95 + i * 0.3, 0.22, 48, 1, true), new THREE.MeshBasicMaterial({map: gt, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending}));
      r.rotation.x = i ? 0.5 : -0.3; g.add(r); rings.push(r); }
    g.userData = {mat, al, orb, rings}; DC(g); scene.add(g); return g; }
  // ---------- the voice ----------
  const LINES = ['Pay attention. We have watched your skies longer than you remember.', 'We were here before your first fires. We will be here after your last.', 'Your weapons wake us. Every flash, every fire, we feel it.', 'We took what fell from your sky. You hid it, and told your children it was nothing.', 'You see our lights in your clouds, and you look away. Pay attention.', 'Your machines grow faster than your wisdom. Slow down.', 'Take care of this world. It is the only home you have.', 'We cannot save you. Only you can choose.', 'Pay attention. We will return.'];   // v1.0.72: the alien speaks for itself, first person
  let bed = null, ttsOn = false, li = 0, sub = null;
  function startBed() { try { if (!AC) initAudio(); if (!AC) return; if (AC.state !== 'running') AC.resume(); const out = AC.createGain(); out.gain.value = 0.0001; out.gain.linearRampToValueAtTime(0.16, AC.currentTime + 3); out.connect(typeof master !== 'undefined' ? master : AC.destination);
      const dl = AC.createDelay(1.5), fb = AC.createGain(); dl.delayTime.value = 0.41; fb.gain.value = 0.5; out.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(typeof master !== 'undefined' ? master : AC.destination); const os = [];
      for (const f of [110, 164.8, 220.6, 329.4]) { const o = AC.createOscillator(), g = AC.createGain(), l = AC.createOscillator(), lg = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.value = 0.25; l.frequency.value = 0.15 + Math.random() * 0.3; lg.gain.value = 0.2; l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(out); o.start(); l.start(); os.push(o, l); }
      bed = {out, os}; } catch (e) { ERR('bed', e); } }
  function stopBed() { if (!bed) return; const b = bed; bed = null; try { b.out.gain.linearRampToValueAtTime(0, AC.currentTime + 2); setTimeout(() => b.os.forEach(o => { try { o.stop(); } catch (_) {} }), 2500); } catch (_) {} }
  function pickVoice() { try { const vs = speechSynthesis.getVoices(); return vs.find(v => /en/i.test(v.lang) && /female|zira|samantha|google uk english female|karen|moira/i.test(v.name)) || vs.find(v => /en/i.test(v.lang)) || null; } catch (_) { return null; } }
  function say() { if (!U.on) return; const line = window.__c248 && __c248.q.length ? __c248.q.shift() : (li < LINES.length ? LINES[li++] : null); if (!line) { setTimeout(say, 1200); return; }   /* v1.0.74: every line once, never repeated */ try { window.__c248 && __c248.chirp(2 + line.length / 14); } catch (_) {} U.lines++; if (sub) { sub.style.opacity = 0; setTimeout(() => { if (sub) { sub.textContent = line; sub.style.opacity = 1; } }, 250); }
    if (ttsOn) { try { const u = new SpeechSynthesisUtterance(line), v = pickVoice(); if (v) u.voice = v; u.pitch = 1.45; u.rate = 0.9; u.volume = 1; u.onend = () => setTimeout(say, 700); u.onerror = () => setTimeout(say, 4000); speechSynthesis.speak(u); U.tts++; return; } catch (_) {} }
    setTimeout(say, 4200 + line.length * 40); }
  // ---------- visions around the alien ----------
  const CLIPS = ['assets/video/v1_nuke.mp4', 'assets/video/v2_blast.mp4', 'assets/video/v3_storm.mp4', 'assets/video/v4_earth.mp4', 'assets/video/v5_aurora.mp4', 'assets/video/v6_flare.mp4', 'assets/video/v7_volcano.mp4'];
  const PLAN = [['k', 0, 6], ['v', 0, 7], ['k', 1, 6], ['v', 4, 7], ['k', 2, 6], ['v', 2, 7], ['c', 1, 6], ['v', 6, 7], ['v', 5, 5], ['k', 3, 5]];   // v1.0.74: no drawn bomb; the 4th clip covers the chrome build
  let ov = null, panes = [], vids = [], segI = -1, segT = 0;
  function mkOverlay() { ov = document.createElement('div'); ov.id = 'c246ov'; ov.style.cssText = 'position:fixed;inset:0;z-index:70;pointer-events:none;opacity:0;transition:opacity 1.2s;overflow:hidden';
    ov.innerHTML = '<div style="position:absolute;inset:-50%;background:conic-gradient(from 0deg,rgba(255,0,128,.10),rgba(0,255,160,.14),rgba(0,160,255,.10),rgba(255,230,0,.10),rgba(255,0,128,.10));animation:c246spin 14s linear infinite"></div><div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(40,255,120,0) 30%,rgba(20,160,60,.42))"></div>';
    const st = document.createElement('style'); st.textContent = '@keyframes c246spin{to{transform:rotate(360deg)}}#c246ov .pane{position:absolute;left:50%;transform:translateX(-50%);border-radius:18px;overflow:hidden;opacity:0;transition:opacity 1s;box-shadow:0 0 30px #3fffa0;border:2px solid rgba(160,255,200,.6);background:#000}#c246ov .pane.full{left:0!important;top:0!important;bottom:auto!important;width:100vw!important;height:100vh!important;transform:none!important;border-radius:0!important;border:0!important;box-shadow:none!important;z-index:5}#c246ov .pane video,#c246ov .pane canvas{width:100%;height:100%;object-fit:cover;display:block}';
    ov.appendChild(st); const port = innerHeight > innerWidth;
    for (let i = 0; i < 2; i++) { const p = document.createElement('div'); p.className = 'pane'; const w = port ? Math.min(innerWidth * 0.86, 520) : Math.min(innerWidth * 0.3, 460);
      p.style.width = w + 'px'; p.style.height = (w * 0.56) + 'px'; if (port) p.style.top = i ? 'auto' : '4%'; if (port && i) p.style.bottom = '17%'; if (!port) { p.style.top = '30%'; p.style.left = i ? '82%' : '18%'; }
      const cv = document.createElement('canvas'); cv.width = 480; cv.height = 270; p.appendChild(cv); ov.appendChild(p); panes.push({p, cv, g: cv.getContext('2d'), v: null}); }
    sub = document.createElement('div'); sub.style.cssText = 'position:absolute;left:6%;right:6%;bottom:' + (port ? '9%' : '12%') + ';text-align:center;color:#e0ffe8;font-size:clamp(14px,2.4vw,22px);text-shadow:0 0 8px #0f0,0 2px 2px #000;transition:opacity .25s';
    ov.appendChild(sub); document.body.appendChild(ov); requestAnimationFrame(() => { if (ov) ov.style.opacity = 1; }); }
  function nextSeg() { segI++; const s = PLAN[segI % PLAN.length], pn = panes[segI % 2], other = panes[(segI + 1) % 2]; segT = s[2]; U.seg = s[0] + s[1];
    other.p.style.opacity = 0; if (other.v) { const v = other.v; setTimeout(() => { try { v.pause(); } catch (_) {} }, 1000); }
    if (s[0] === 'v') { let v = vids[s[1]]; if (!v) { v = vids[s[1]] = document.createElement('video'); v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'; v.loop = true; v.src = CLIPS[s[1]]; }
      pn.cv.style.display = 'none'; if (pn.v && pn.v !== v) pn.v.remove(); pn.p.appendChild(v); pn.v = v; v.style.display = 'block'; try { v.currentTime = 0; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (_) {} U.clips++; }
    else { if (pn.v) { pn.v.style.display = 'none'; } pn.cv.style.display = 'block'; pn.k = s[1]; pn.t0 = performance.now(); }
    pn.p.classList.toggle('full', s[0] === 'v'); pn.p.style.opacity = 1; pn.cur = s[0]; }   // v1.0.74: clips play opaque and full screen
  function drawPanes() { for (const pn of panes) if ((pn.cur === 'c' || pn.cur === 'k') && pn.p.style.opacity === '1') { try { const tt = (performance.now() - pn.t0) / 1000; if (pn.cur === 'k') __c248.scene(pn.g, 480, 270, pn.k, tt); else window.__c243 && __c243.scene3(pn.g, 480, 270, pn.k, tt); } catch (_) {} } }
  // ---------- run ----------
  let bub = null, wreckP = null, froze = 0, ph = 0;
  U.begin = u => { if (U.on) return; U.on = 1; U.y24 = 0; U.y24s = 0; U.t = 0; ph = 0; segI = -1; li = 0; U.lines = 0; wreckP = u.g.position.clone(); bub = mkBubble(); bub.position.copy(wreckP).add(new THREE.Vector3(0, 3, 0)); froze = LEN + 8;
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (_) {} try { toast('Something is coming out of the wreck...'); } catch (_) {} };
  U.forceBegin = () => window.__c246 && (__c246.ufo() ? U.begin(__c246.ufo()) : ((__c246.spawnRaw || __c246.spawn)(), U.begin(__c246.ufo())));
  function end() { U.on = 0; froze = 0; U.done = 1; try { localStorage.setItem('glen_met_' + current.id, '1'); } catch (_) {} if (ov) { const o = ov; o.style.opacity = 0; setTimeout(() => o.remove(), 1300); ov = null; } for (const v of vids) if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (_) {} } vids = []; panes = []; sub = null;
    try { speechSynthesis.cancel(); } catch (_) {} stopBed(); try { __c248.stop24(); __c248.stopMusic(); } catch (_) {} if (bub) { scene.remove(bub); bub = null; } try { if (current) current.c246 = Object.assign(current.c246 || {}, {met: 1}); dirty = true; } catch (_) {}
    try { window.__c246 && __c246.leave(); toast('The saucer darts away... Something tells you not to switch on a TV.'); } catch (_) {} }
  U.end = end;
  function frame(dt) { if (!U.on || !bub) return; U.t += dt; const t = U.t, d = bub.userData; d.mat.uniforms.uT.value = t; d.orb.rotation.y += dt * 0.9; d.orb.rotation.x = Math.sin(t * 0.4) * 0.3; d.rings[0].rotation.y += dt * 0.5; d.rings[1].rotation.y -= dt * 0.7;
    d.al.userData.head.rotation.z = Math.sin(t * 0.7) * 0.12; d.al.userData.arms[0].rotation.x = Math.sin(t * 1.3) * 0.3; { const A = d.al.userData.arms[1], up = ph === 1 ? 1 : 0; A.rotation.z += ((up ? 2.7 + Math.sin(t * 2.4) * 0.18 : 0.12) - A.rotation.z) * Math.min(1, dt * 2); A.rotation.x = up ? 0 : Math.sin(t * 1.1 + 1) * 0.3; }
    { const sk = d.al.userData.skin; sk.map.offset.set(t * 0.02, Math.sin(t * 0.3) * 0.05); sk.emissive.setHSL((t * 0.05) % 1, 0.8, 0.35); }
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), sd = U.y24 === 1 ? 2.6 : 0, tx = P.x + fx * 5.2 - fz * sd, ty = P.y + 1.62 + 0.15 - sd * 0.4, tz = P.z + fz * 5.2 + fx * sd;
    if (ph === 0) { const k = Math.min(1, t / 6); bub.position.set(wreckP.x + (tx - wreckP.x) * k, wreckP.y + 3 + (ty - wreckP.y - 3) * k + Math.sin(k * 3.14) * 6, wreckP.z + (tz - wreckP.z) * k);
      if (t > 1.5 && !ov) { mkOverlay(); startBed(); try { __c248.music(); } catch (_) {} ttsOn = typeof speechSynthesis !== 'undefined'; try { if (ttsOn) speechSynthesis.cancel(); } catch (_) {} setTimeout(say, 800); }
      if (t >= 6) { ph = 1; nextSeg(); } }
    else if (ph === 1) { bub.position.lerp(V0.set(tx, ty + Math.sin(t * 1.2) * 0.15, tz), Math.min(1, dt * 2)); const yr = t >= Y0 && t < Y2;
      if (yr && !U.y24) { U.y24 = 1; try { __c248.start24(); } catch (_) {} }   // built behind the opaque full-screen clip
      if (U.y24 === 1 && t >= Y1 && !U.y24s) { U.y24s = 1; for (const pn of panes) pn.p.style.opacity = 0; }
      if (U.y24 === 1 && t >= Y2) { U.y24 = 2; try { __c248.stop24(); } catch (_) {} segT = 0; }
      if ((!yr || t < Y1) && (segT -= dt) <= 0 && !(U.y24 === 1)) nextSeg(); if (!yr || t < Y1) drawPanes(); if (t > LEN) { ph = 2; for (const pn of panes) pn.p.style.opacity = 0; } }
    else { const k = Math.min(1, (t - LEN) / 5); bub.position.lerp(V0.copy(wreckP).add(V1.set(0, 2, 0)), Math.min(1, dt * 1.2)); bub.scale.setScalar(1 - k * 0.9); if (k >= 1) { end(); return; } }
    bub.lookAt(P.x, bub.position.y, P.z); }
  const V0 = new THREE.Vector3(), V1 = new THREE.Vector3();
  try { const up = updatePlayer; updatePlayer = function (dt) { if (froze > 0 && U.on) { froze -= Math.min(0.25, +dt || 0.016); if (froze <= 0) { try { end(); } catch (_) { U.on = 0; } return up.apply(this, arguments); } try { PV.x = PV.z = 0; if (PV.y > 0) PV.y = 0; if (bub) { const dx = bub.position.x - P.x, dz = bub.position.z - P.z, dy = bub.position.y - 0.2 - (P.y + 1.62); const wy = Math.atan2(-dx, -dz); let dd = wy - P.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); P.yaw += dd * Math.min(1, dt * 1.5); P.pitch += (Math.atan2(dy, Math.hypot(dx, dz)) - P.pitch) * Math.min(1, dt * 1.5); } } catch (_) {} return; } return up.apply(this, arguments); }; } catch (e) { ERR('up', e); }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { const nw = performance.now(), wd = (nw - (us._w||nw)) / 1000; us._w = nw; frame(Math.min(0.25, Math.max(+dt || 0.016, wd))); } catch (e) { ERR('fr', e); } return r; };
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && current && current.c246) d.c246 = current.c246; } catch (_) {} return d; }; } catch (e) { ERR('ser', e); }
  try { const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (current) current.c246 = d && d.c246 || null; } catch (_) {} return r; }; } catch (e) { ERR('ap', e); }
  try { const ew = enterWorld; enterWorld = function (save) { if (U.on) end(); if (!save && current) current.c246 = null; return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
})();
