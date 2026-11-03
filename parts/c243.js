/* ===================== GLX-C243 (v1.0.57): DESERT - no rain or snow over the sand, sandstorms (haze, blowing sand, wind), and TIC-TAC UFOs that zip over the dunes.
   Shoot one down: it crashes, you freeze in a green light, a grey-green visitor shows you visions (a nuclear blast, the Earth, a machine mind) in an ethereal voice,
   then the craft lifts off and is gone - leaving a thin glowing puddle of Element 115 in the crater. ===================== */
(function c243() {
  const U = window.__c243 = {err: null, desert: false, storm: 0, ufos: 0, shot: 0, crashes: 0, visions: 0, frozen: 0, puddles: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const LOW = (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && PERF);
  const OUT = () => typeof master !== 'undefined' ? master : AC.destination;
  const mine = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i);
  const inB = (x, y, z) => x > 0 && z > 0 && y > 1 && x < W - 1 && z < D - 1 && y < H - 1;
  const top = (x, z) => { for (let y = H - 2; y > 1; y--) { const v = world[idx(x, y, z)]; if (v && v !== T.FIRE && !PLANT[v]) return y; } return 0; };
  const C = () => current ? (current.c243 || (current.c243 = {p: []})) : {p: []};
  const noBuf = (len) => { const b = AC.createBuffer(1, AC.sampleRate * len | 0, AC.sampleRate), ch = b.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; return b; };
  // ---------- desert detection ----------
  let dT = 0, desert = false;
  const SANDY = new Set([T.SAND, T.SANDSTONE, T.CACTUS, T.REDSAND, T.DEADBUSH].filter(v => v !== undefined)); let dFrac = 0, dK = 0;
  function checkDesert() { if (DIM.cur) return 0; let s = 0, n = 0; const sm = (x, z, w) => { x = Math.floor(x); z = Math.floor(z); if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1) return; const t = top(x, z); n += w; if (t > SEA - 1 && SANDY.has(world[idx(x, t, z)])) s += w; }; sm(P.x, P.z, 3); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + 0.2, r = 5 + (i % 4) * 5; sm(P.x + Math.sin(a) * r, P.z + Math.cos(a) * r, 1); } return n ? s / n : 0; }
  U.isDesert = () => desert; U.dK = () => dK;
  try { const sw = window.__snowWx; if (sw) window.__snowWx = function () { return desert ? false : sw.apply(this, arguments); }; } catch (e) { ERR('snow', e); }
  // v1.0.58: rain/snow are masked for EVERY system while you stand in the desert - weather.type reads clear, the real weather keeps running underneath
  try { let real = weather.type; Object.defineProperty(weather, 'type', {configurable: true, enumerable: true, get() { const w = WEATHER[real]; return desert && w && w.drops ? 'clear' : real; }, set(v) { real = v; }}); U.realWx = () => real; } catch (e) { ERR('wx', e); }
  // ---------- sandstorm: haze, blowing sand, wind ----------
  let storm = 0, stormK = 0, stormT = 60 + Math.random() * 90, wind = null, sand = null, lastFog = null;
  function mkSand() { const N = LOW ? 140 : 360, pos = new Float32Array(N * 3), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({color: 0xd8b878, size: 0.12, transparent: true, opacity: 0, depthWrite: false})); m.frustumCulled = false; m.userData.__dcR = 1e9; m.userData.__dcK = 1; scene.add(m);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 30; pos[i * 3 + 1] = (Math.random() - .3) * 10; pos[i * 3 + 2] = (Math.random() - .5) * 30; } return {m, pos, g, N}; }
  function mkWind() { try { if (!AC || AC.state !== 'running') return null; const n = AC.createBufferSource(); n.buffer = noBuf(3); n.loop = true; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.7; const g = AC.createGain(); g.gain.value = 0; n.connect(bp); bp.connect(g); g.connect(OUT()); n.start(); return {g, bp}; } catch (e) { ERR('wind', e); return null; } }
  // ---------- UFO (tic-tac) ----------
  let ufo = null, ufoT = 20 + Math.random() * 30;
  const SANDC = new THREE.Color(0.78, 0.64, 0.42), TMPV = new THREE.Vector3();
  function mkUfo() { const g = new THREE.Group(); g.userData.__dcR = 1e9; g.userData.__dcK = 1;
    const metal = new THREE.MeshStandardMaterial({color: 0xbfc6ce, emissive: 0x39424c, emissiveIntensity: 0.4, roughness: 0.28, metalness: 0.85});   // v1.0.58: classic flying saucer
    const disc = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 10).scale(3.2, 0.5, 3.2), metal); g.add(disc);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.16, 6, 32), new THREE.MeshStandardMaterial({color: 0x6f7780, roughness: 0.4, metalness: 0.9})); rim.rotation.x = Math.PI / 2; g.add(rim);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.15, 18, 10, 0, 6.283, 0, Math.PI / 2), new THREE.MeshStandardMaterial({color: 0x7fe9ff, emissive: 0x1e8fb0, emissiveIntensity: 0.7, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.8})); dome.position.y = 0.3; g.add(dome);
    const lg = new THREE.SphereGeometry(0.3, 8, 6), lm = [new THREE.MeshBasicMaterial({color: 0xff5050}), new THREE.MeshBasicMaterial({color: 0x60ff90}), new THREE.MeshBasicMaterial({color: 0xffe060})];
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, l = new THREE.Mesh(lg, lm[i % 3]); l.position.set(Math.sin(a) * 2.6, -0.22, Math.cos(a) * 2.6); g.add(l); }
    const under = new THREE.Mesh(new THREE.CircleGeometry(1.3, 20), new THREE.MeshBasicMaterial({color: 0x9fffd0, transparent: true, opacity: 0.85, side: THREE.DoubleSide})); under.rotation.x = Math.PI / 2; under.position.y = -0.53; g.add(under);
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), q = x.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(230,245,255,0.6)'); q.addColorStop(1, 'rgba(200,230,255,0)'); x.fillStyle = q; x.fillRect(0, 0, 64, 64);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending})); halo.scale.set(10, 4, 1); g.add(halo); g.traverse(o => { o.userData.__dcR = 1e9; o.userData.__dcK = 1; });
    scene.add(g); return g; }
  function spawnUfo() { if (ufo) return false; const g = mkUfo(), a = Math.random() * 6.283; g.position.set(P.x + Math.sin(a) * 90, P.y + 30 + Math.random() * 12, P.z + Math.cos(a) * 90);
    ufo = {g, st: 'fly', t: 0, wp: null, hold: 0, v: new THREE.Vector3()}; U.ufos++; return true; }
  U.spawnUfo = () => window.__c246 ? __c246.spawn() : spawnUfo(); U.ufo = () => ufo;
  function ufoFly(dt) { const u = ufo; u.t += dt; const p = u.g.position;
    if (u.st === 'fly') { if (u.hold > 0) { u.hold -= dt; u.g.rotation.y += dt * 0.3; return; }
      if (!u.wp || p.distanceTo(u.wp) < 1.5) { if (u.wp) u.hold = 0.6 + Math.random() * 2.5; u.wp = u.t > 45 ? new THREE.Vector3(p.x + (p.x - P.x) * 4, p.y + 80, p.z + (p.z - P.z) * 4) : new THREE.Vector3(P.x + (Math.random() - .5) * 90, P.y + 24 + Math.random() * 18, P.z + (Math.random() - .5) * 90); }
      const d = TMPV.copy(u.wp).sub(p), L = d.length(), sp = Math.min(L, (u.t > 45 ? 60 : 32) * dt); p.add(d.multiplyScalar(sp / Math.max(L, 1e-3))); u.g.rotation.y = Math.atan2(-d.z, d.x);
      if (u.t > 60 || p.distanceTo(P) > 300) { scene.remove(u.g); ufo = null; } return; }
    if (u.st === 'fall') { u.v.y -= 14 * dt; p.addScaledVector(u.v, dt); u.g.rotation.x += dt * 2.5; u.g.rotation.z += dt * 1.3; if (Math.random() < dt * 30) try { burst(p.x, p.y, p.z, Math.random() < 0.5 ? 0x2a2a2a : 0xff8030, 2, 0.6); } catch (_) {}
      const X = Math.floor(p.x), Y = Math.floor(p.y - 0.8), Z = Math.floor(p.z); if (Y < 2 || (inB(X, Y, Z) && world[idx(X, Y, Z)] && !PLANT[world[idx(X, Y, Z)]])) crash(); return; }
    if (u.st === 'down') return;
    if (u.st === 'leave') { u.v.y += 30 * dt; u.v.x += 18 * dt; p.addScaledVector(u.v, dt); u.g.rotation.x *= 0.9; u.g.rotation.z *= 0.9; if (p.y > P.y + 260) { scene.remove(u.g); ufo = null; } } }
  // ---------- crash ----------
  function crash() { const u = ufo, p = u.g.position, X = Math.floor(p.x), Y = Math.floor(p.y), Z = Math.floor(p.z); u.st = 'down'; U.crashes++;
    const R = 3.5; for (let dx = -4; dx <= 4; dx++) for (let dy = -3; dy <= 3; dy++) for (let dz = -4; dz <= 4; dz++) { if (Math.hypot(dx, dy * 1.3, dz) > R) continue; const x = X + dx, y = Y + dy, z = Z + dz; if (!inB(x, y, z)) continue; const i = idx(x, y, z), b = world[i]; if (!b || b === T.WATER || mine(i) || ENT[b] && !PLANT[b]) continue; world[i] = 0; try { FLV.delete(i); markDirty(x, z); flQueue(x, y, z); } catch (_) {} }
    try { dirty = true; } catch (_) {} let fy = Y; while (fy > 2 && !world[idx(X, fy - 1, Z)]) fy--;
    u.g.position.set(X + .5, fy + 0.9, Z + .5); u.g.rotation.set(0.25, u.g.rotation.y, 0.3);
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283, x = Math.floor(X + Math.sin(a) * 4.5), z = Math.floor(Z + Math.cos(a) * 4.5), t = top(x, z); try { if (t && window.__c237) __c237.ignite(x + .5, t + 1.02, z + .5); } catch (_) {} }
    try { burst(X, fy + 1, Z, 0xff8a30, 30, 3); burst(X, fy + 2, Z, 0x333333, 24, 3.5); shake(1.2, 0.15); sfx('boom'); } catch (_) {}
    const c = C(); c.p.push([X + 0.5, fy, Z + 0.5 + 2.2]); if (c.p.length > 6) c.p.shift(); syncPuddles();
    setTimeout(() => { try { visions(); } catch (e) { ERR('vis', e); } }, 1500); }
  // ---------- Element 115 puddles: thin, flat, glowing neon blue ----------
  const pm = new THREE.MeshBasicMaterial({color: 0x2ec8ff, transparent: true, opacity: 0.92, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, fog: false});
  const gc = document.createElement('canvas'); gc.width = gc.height = 64; { const x = gc.getContext('2d'), q = x.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(80,210,255,0.8)'); q.addColorStop(1, 'rgba(40,140,255,0)'); x.fillStyle = q; x.fillRect(0, 0, 64, 64); }
  const gm = new THREE.SpriteMaterial({map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending});
  const pGeo = new THREE.CircleGeometry(1, 18); pGeo.rotateX(-Math.PI / 2); let pud = [];
  function syncPuddles() { for (const q of pud) scene.remove(q); pud = []; for (const p of C().p) { const g = new THREE.Group(); const m = new THREE.Mesh(pGeo, pm); m.scale.set(1.5, 1, 1.1); g.add(m); const s = new THREE.Sprite(gm); s.scale.set(5, 2.2, 1); s.position.y = 0.4; g.add(s);
      g.position.set(p[0], p[1] + 0.03, p[2]); g.traverse(o => { o.userData.__dcR = 1e9; o.userData.__dcK = 1; }); scene.add(g); pud.push(g); } U.puddles = pud.length; }
  U.syncPuddles = syncPuddles; U.scene3 = (...a) => scene3(...a); U.addPuddle = (x, y, z) => { const c = C(); c.p.push([x, y, z]); if (c.p.length > 6) c.p.shift(); syncPuddles(); };
  U.scoop = () => { const c = C(); let bi = -1, bd = 3.2; c.p.forEach((p, i) => { const d = Math.hypot(p[0] - P.x, p[2] - P.z, (p[1] - P.y) * 0.5); if (d < bd) { bd = d; bi = i; } }); if (bi < 0) return false; c.p.splice(bi, 1); syncPuddles(); try { dirty = true; } catch (_) {} return true; };
  // ---------- visions ----------
  let frozen = 0, alien = null, ov = null;
  function mkAlien() { const g = new THREE.Group(), sk = new THREE.MeshStandardMaterial({color: 0x8fb08a, roughness: 0.6, emissive: 0x203820}), ey = new THREE.MeshStandardMaterial({color: 0x050505, roughness: 0.1, metalness: 0.5});
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), sk); head.scale.set(1, 1.15, 0.95); head.position.y = 1.55; g.add(head);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), ey); e.scale.set(1.3, 0.75, 0.5); e.position.set(s * 0.16, 1.55, 0.36); e.rotation.z = s * 0.45; g.add(e); }
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.8, 10), sk); body.position.y = 0.85; g.add(body);
    for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.75, 6), sk); a.position.set(s * 0.25, 0.85, 0); a.rotation.z = s * 0.15; g.add(a); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.5, 6), sk); l.position.set(s * 0.09, 0.25, 0); g.add(l); }
    g.traverse(o => { o.userData.__dcR = 1e9; o.userData.__dcK = 1; }); scene.add(g); return g; }
  const LINE = 'You must not become too dependent on technology. You must stop your wars, for the future of your civilisation.';
  function scene3(g, w, h, k, t) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); const cx = w / 2, cy = h / 2, r = Math.min(w, h);
    if (k === 0) { // the bomb
      g.fillStyle = '#1a0a04'; g.fillRect(0, cy + r * 0.25, w, h); t = Math.max(0, t); const f = Math.min(1, t / 2); const gr = g.createRadialGradient(cx, cy - r * 0.1, 0, cx, cy - r * 0.1, r * 0.35 * (0.4 + f));
      gr.addColorStop(0, '#fff6d0'); gr.addColorStop(0.3, '#ffb040'); gr.addColorStop(0.7, '#a03010'); gr.addColorStop(1, 'rgba(60,20,10,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy - r * 0.12, r * 0.3 * (0.5 + f), r * 0.17 * (0.5 + f), 0, 0, 7); g.fill();
      g.fillStyle = '#c0602a'; g.fillRect(cx - r * 0.04, cy - r * 0.05, r * 0.08, r * 0.32); g.fillStyle = 'rgba(255,200,120,' + (0.6 * (1 - f)) + ')'; g.fillRect(0, 0, w, h); }
    else if (k === 1) { // the Earth
      for (let i = 0; i < 120; i++) { g.fillStyle = 'rgba(255,255,255,' + ((i * 37) % 10) / 12 + ')'; g.fillRect((i * 977) % w, (i * 613) % h, 1.5, 1.5); }
      const R = r * 0.3, gr = g.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R); gr.addColorStop(0, '#5ab0ff'); gr.addColorStop(1, '#0a2a6a'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
      g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip(); g.fillStyle = '#3c8a3a'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(cx + Math.sin(i * 2.3 + t * 0.3) * R * 0.7, cy + Math.cos(i * 1.7) * R * 0.5, R * 0.28, R * 0.16, i, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(cx + Math.sin(i * 1.9 - t * 0.5) * R * 0.8, cy + Math.cos(i * 2.9) * R * 0.6, R * 0.3, R * 0.05, i * 0.4, 0, 7); g.fill(); } g.restore(); }
    else { // the machine mind
      g.strokeStyle = 'rgba(80,255,160,0.55)'; g.lineWidth = 2; for (let i = 0; i < 26; i++) { const y = (i * 53) % h, x = (i * 131) % w; g.beginPath(); g.moveTo(0, y); g.lineTo(x, y); g.lineTo(x + 40, y + 40); g.lineTo(w, y + 40); g.stroke(); g.fillStyle = '#5f9'; g.fillRect(x - 3, y - 3, 6, 6); }
      const R = r * 0.16, p = 0.7 + 0.3 * Math.sin(t * 4); g.fillStyle = '#100'; g.beginPath(); g.arc(cx, cy, R * 1.4, 0, 7); g.fill(); const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R); gr.addColorStop(0, '#fff'); gr.addColorStop(0.2, '#ff3030'); gr.addColorStop(1, 'rgba(120,0,0,0)'); g.fillStyle = gr; g.globalAlpha = p; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); g.globalAlpha = 1; } }
  function voice(len) { try { U.vcall = (U.vcall || 0) + 1; if (!AC) { try { initAudio(); } catch (_) {} } if (!AC) return; if (AC.state !== 'running') { try { AC.resume(); } catch (_) {} } U.voiced = (U.voiced || 0) + 1; const t0 = AC.currentTime + 0.05, out = AC.createGain(); out.gain.value = 0.7; const dl = AC.createDelay(1.5), fb = AC.createGain(); dl.delayTime.value = 0.33; fb.gain.value = 0.55; out.connect(dl); dl.connect(fb); fb.connect(dl); const wet = AC.createGain(); wet.gain.value = 0.5; dl.connect(wet); wet.connect(OUT()); out.connect(OUT());
      const VOW = [[730, 1090], [270, 2290], [570, 840], [440, 1020], [300, 870], [660, 1700]];
      const src = []; for (const f of [110, 110.7, 165.3]) { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const vb = AC.createOscillator(), vg = AC.createGain(); vb.frequency.value = 4.6; vg.gain.value = 2.2; vb.connect(vg); vg.connect(o.frequency); vb.start(t0); vb.stop(t0 + len + 1); o.start(t0); o.stop(t0 + len + 1); src.push(o); }
      const amp = AC.createGain(); amp.gain.setValueAtTime(0, t0); src.forEach(o => o.connect(amp));
      const f1 = AC.createBiquadFilter(), f2 = AC.createBiquadFilter(); f1.type = f2.type = 'bandpass'; f1.Q.value = 9; f2.Q.value = 12; amp.connect(f1); amp.connect(f2); f1.connect(out); f2.connect(out);
      let t = t0; while (t < t0 + len) { const v = VOW[(Math.random() * VOW.length) | 0], d = 0.18 + Math.random() * 0.25; f1.frequency.linearRampToValueAtTime(v[0], t + 0.06); f2.frequency.linearRampToValueAtTime(v[1], t + 0.06);
        amp.gain.linearRampToValueAtTime(0.9, t + 0.05); amp.gain.linearRampToValueAtTime(0.15, t + d); t += d + (Math.random() < 0.18 ? 0.35 : 0.04); }
      amp.gain.linearRampToValueAtTime(0, t0 + len + 0.6);
      const pad = AC.createOscillator(), pg = AC.createGain(); pad.type = 'sine'; pad.frequency.value = 220; pg.gain.setValueAtTime(0, t0); pg.gain.linearRampToValueAtTime(0.08, t0 + 2); pg.gain.linearRampToValueAtTime(0, t0 + len + 1); pad.connect(pg); pg.connect(out); pad.start(t0); pad.stop(t0 + len + 1.2); } catch (e) { ERR('voice', e); } }
  function visions() { U.visions++; frozen = 14; U.frozen = 1; try { if (document.pointerLockElement) document.exitPointerLock(); } catch (_) {}
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); alien = mkAlien(); const ax = P.x + fx * 3.6, az = P.z + fz * 3.6; let ay = top(Math.floor(ax), Math.floor(az)) + 1; if (Math.abs(ay - P.y) > 3) ay = P.y; alien.position.set(ax, ay, az); alien.rotation.y = Math.atan2(P.x - ax, P.z - az); alien.scale.setScalar(1.25); try { P.pitch = Math.atan2(ay + 1.2 - (P.y + 1.62), 3.6); } catch (_) {} try { burst(ax, ay + 1, az, 0x7dffa0, 30, 1.2); } catch (_) {}
    ov = document.createElement('div'); ov.id = 'c243ov'; ov.style.cssText = 'position:fixed;inset:0;z-index:70;pointer-events:none;background:radial-gradient(ellipse at center,rgba(40,255,120,.08),rgba(20,160,60,.45));transition:opacity .8s;opacity:0';
    const cv = document.createElement('canvas'); cv.width = 480; cv.height = 300; cv.style.cssText = 'position:absolute;left:50%;top:17%;transform:translate(-50%,-50%);width:min(84vw,560px);height:auto;aspect-ratio:480/300;border-radius:50%;opacity:0;transition:opacity 1s;-webkit-mask-image:radial-gradient(closest-side,#000 60%,transparent);mask-image:radial-gradient(closest-side,#000 60%,transparent)';
    const sb = document.createElement('div'); sb.style.cssText = 'position:absolute;left:6%;right:6%;bottom:16%;text-align:center;color:#d8ffe0;font-size:clamp(15px,2.6vw,24px);text-shadow:0 0 8px #0f0,0 2px 2px #000;opacity:0;transition:opacity 1.2s';
    sb.textContent = LINE; ov.appendChild(cv); ov.appendChild(sb); document.body.appendChild(ov); requestAnimationFrame(() => { ov.style.opacity = 1; });
    setTimeout(() => { cv.style.opacity = 1; }, 1200); setTimeout(() => { sb.style.opacity = 1; voice(7); }, 2500);
    const g = cv.getContext('2d'), t0 = performance.now(); (function draw() { if (!ov) return; const t = (performance.now() - t0) / 1000; const k = Math.min(2, Math.floor(Math.max(0, t - 1.2) / 3.6)); scene3(g, cv.width, cv.height, k, Math.max(0, t - 1.2) % 3.6); requestAnimationFrame(draw); })(); }
  function endVisions() { if (ov) { const o = ov; o.style.opacity = 0; setTimeout(() => o.remove(), 900); ov = null; } if (alien) { scene.remove(alien); alien = null; } U.frozen = 0;
    if (ufo) { ufo.st = 'leave'; ufo.v.set(0, 2, 0); try { burst(ufo.g.position.x, ufo.g.position.y, ufo.g.position.z, 0x9effc0, 20, 2); } catch (_) {} } try { toast('Something glows in the crater...'); } catch (_) {} }
  try { const up = updatePlayer; updatePlayer = function (dt) { if (frozen > 0) { frozen -= dt; try { PV.x = PV.z = 0; if (PV.y > 0) PV.y = 0; } catch (_) {} if (alien) { alien.position.y += Math.sin(performance.now() / 300) * 0.002; } if (frozen <= 0) endVisions(); return; } return up.apply(this, arguments); }; } catch (e) { ERR('up', e); }
  // ---------- shooting ----------
  try { const fg = fireGun; fireGun = function (id) { const d0 = lookDir().slice ? lookDir().slice() : lookDir(), o0 = new THREE.Vector3(P.x, P.y + 1.62, P.z); const r = fg.apply(this, arguments); try { if (ufo && ufo.st === 'fly') { const d = d0, o = o0, c = ufo.g.position, v = c.clone().sub(o), t = v.x * d[0] + v.y * d[1] + v.z * d[2];
      if (t > 0 && t < 260) { const px = o.x + d[0] * t - c.x, py = o.y + d[1] * t - c.y, pz = o.z + d[2] * t - c.z; if (Math.hypot(px, py, pz) < 3.2) { U.shot++; ufo.st = 'fall'; ufo.v.set(d[0] * 8, 2, d[2] * 8); try { burst(c.x, c.y, c.z, 0xffffff, 20, 1.5); sfx('boom'); } catch (_) {} } } } } catch (e) { ERR('shot', e); } return r; }; } catch (e) { ERR('fg', e); }
  // ---------- per frame ----------
  function frame(dt) { if (!started) return;
    if ((dT -= dt) <= 0) { dT = LOW ? 0.4 : 0.25; dFrac = checkDesert(); }
    // v1.0.58: the sandstorm is CONSTANT anywhere in the desert, fading in/out smoothly at the edge
    const y24 = window.__c248 && __c248.y === 1; if (y24) dK = 0; let clr = false; try { clr = !!(window.__c68 && __c68().wlock === 'clear'); } catch (_) {} U.clearLock = clr; /* v1.0.93: storms come and go - long calm spells (6-12 min) with the odd storm (1.5-3 min) that fades in and out */
    if (U.cyc === undefined) { U.cyc = 0; U.cycT = 120 + Math.random() * 240; U.cycOn = 0; } if ((U.cycT -= dt) <= 0) { U.cycOn = U.cycOn ? 0 : 1; if (U.cycOn && desert) try { toast('A sandstorm is blowing in...'); } catch (_) {} U.cycT = U.cycOn ? 90 + Math.random() * 90 : 360 + Math.random() * 360; } U.cyc += ((U.cycOn ? 1 : 0) - U.cyc) * Math.min(1, dt / 20);
    const tgt = (y24 || clr) ? 0 : Math.max(0, Math.min(1, (dFrac - 0.25) / 0.3)); dK += (tgt - dK) * Math.min(1, dt * 0.6); if (dK < 0.003) dK = 0; U.dKv = +dK.toFixed(2); U.frac = +dFrac.toFixed(2); // v1.0.60: no sandstorm during the YEAR 24000 vision
    const was = desert; desert = U.desert = desert ? dK > 0.2 : dK > 0.35; if (desert && !was && !U.told) { U.told = 1; try { toast('The hot desert stretches out before you...'); } catch (_) {} }
    /* v1.0.92: no sandstorm indoors - roof check over the player (pyramid, caves, under a roof) fades the sand and haze out */
    if ((U.skyT = (U.skyT || 0) - dt) <= 0) { U.skyT = 0.3; let cov = 0; const px = Math.floor(P.x), pz = Math.floor(P.z), py = Math.floor(P.y) + 2; for (const [ox, oz] of [[0, 0], [2, 0], [-2, 0], [0, 2], [0, -2]]) { for (let y = py; y < Math.min(H - 1, py + 24); y++) { const b = world[idx(px + ox, y, pz + oz)]; if (b && !PLANT[b]) { cov++; break; } } } U.skyTg = cov >= 4 ? 0 : 1; }
    U.sky = U.sky === undefined ? 1 : U.sky + ((U.skyTg === undefined ? 1 : U.skyTg) - U.sky) * Math.min(1, dt * 2.5);
    stormK = dK * U.sky * U.cyc; U.storm = +stormK.toFixed(2);
    if (stormK > 0.01) { if (!sand) sand = mkSand(); sand.m.visible = true; sand.m.position.set(P.x, P.y, P.z); sand.m.material.opacity = 0.75 * stormK; const ps = sand.pos;
      for (let i = 0; i < sand.N; i++) { ps[i * 3] += dt * 16; ps[i * 3 + 1] += Math.sin(i + performance.now() / 400) * dt * 0.6; ps[i * 3 + 2] += dt * 5; if (ps[i * 3] > 15) ps[i * 3] -= 30; if (ps[i * 3 + 2] > 15) ps[i * 3 + 2] -= 30; } sand.g.attributes.position.needsUpdate = true;
      try { const f = scene.fog; f.color.lerp(SANDC, stormK * 0.85); if (f.isFogExp2) f.density = f.density * (1 + 5 * stormK); else { if (lastFog === null || f.far !== lastFog) { U.baseFar = f.far; } f.far = U.baseFar * (1 - 0.65 * stormK); f.near = Math.min(f.near, f.far * 0.3); lastFog = f.far; } } catch (_) {} }
    else { if (sand) sand.m.visible = false; try { if (lastFog !== null && scene.fog.far === lastFog && U.baseFar) scene.fog.far = U.baseFar; } catch (_) {} lastFog = null; }
    if (stormK > 0.01 && !wind) wind = mkWind(); if (wind) { wind.g.gain.value = 0.22 * stormK * (0.7 + 0.3 * Math.sin(performance.now() / 900)); wind.bp.frequency.value = 380 + 260 * Math.sin(performance.now() / 1300); }
    // ufos
    if (desert && (ufoT -= dt) <= 0) { ufoT = 50 + Math.random() * 70; try { if (window.__c246) __c246.spawn(); } catch (_) {} }   // v1.0.59: the big saucer encounter lives in c246
    if (ufo) ufoFly(dt); }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { frame(Math.min(0.1, +dt || 0.016)); } catch (e) { ERR('fr', e); } return r; };
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && current && current.c243) d.c243 = current.c243; } catch (_) {} return d; }; } catch (e) { ERR('ser', e); }
  try { const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (current) current.c243 = d && d.c243 || {p: []}; syncPuddles(); } catch (_) {} return r; }; } catch (e) { ERR('ap', e); }
  try { const ew = enterWorld; enterWorld = function (save) { if (!save && current) current.c243 = {p: []}; const r = ew.apply(this, arguments); try { syncPuddles(); } catch (_) {} return r; }; } catch (e) { ERR('ew', e); }
})();
