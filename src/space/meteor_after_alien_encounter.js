/* ===================== GLX-C247 (v1.0.59): THE METEOR - after the alien encounter, switching on any TV shows static... and a huge flaming meteor appears far away,
   burning across the sky towards the desert for ~45 s with a fire trail and a growing rumble. It hits the middle of the desert and wipes out the whole sand area: a huge crater,
   fires and a shockwave that hurts you if you are still there. The work is spread over many frames; player-placed blocks are never touched. ===================== */
(function c247() {
  const U = window.__c247 = {err: null, st: 'none', cols: 0, done: 0, left: 0, eta: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const LOW = (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && PERF);
  const mine = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i);
  const SANDY = new Set([T.SAND, T.SANDSTONE, T.CACTUS, T.REDSAND, T.DEADBUSH].filter(v => v !== undefined));
  const topAny = (x, z) => { for (let y = H - 2; y > 1; y--) { const v = world[idx(x, y, z)]; if (v && v !== T.FIRE && !PLANT[v]) return y; } return 0; };
  const CELL = 16;
  // ---------- TV static ----------
  const sc = document.createElement('canvas'); sc.width = 64; sc.height = 48; const sg = sc.getContext('2d'), stTex = new THREE.CanvasTexture(sc), stMat = new THREE.MeshBasicMaterial({map: stTex});
  let stT = 0, stKey = null, stOld = null;
  function staticOn(k) { try { const o = entObjs.get(k); if (!o || !o.screen) return; if (stKey && stKey !== k) staticOff(); stKey = k; stOld = o.screen.material; o.screen.material = stMat; } catch (e) { ERR('st', e); } }
  function staticOff() { try { const o = stKey && entObjs.get(stKey); if (o && o.screen && stOld) o.screen.material = stOld; } catch (_) {} stKey = null; stOld = null; }
  function drawStatic(dt) { if ((stT -= dt) > 0) return; stT = 0.09; const d = sg.createImageData(64, 48), a = d.data; for (let i = 0; i < a.length; i += 4) { const v = Math.random() * 255 | 0; a[i] = v * 0.85; a[i + 1] = v; a[i + 2] = v * 0.9; a[i + 3] = 255; } sg.putImageData(d, 0, 0); stTex.needsUpdate = true; }
  try { const ut = useTV; useTV = function (x, y, z) { const k = keyOf(x, y, z), s = current && current.c246;
      if (s && s.met && !s.boom && U.st === 'none' && tvOnKey !== k) { try { swing(); } catch (_) {} tvOnKey = k; staticOn(k); toast('The TV crackles... BRACE FOR IMPACT - a METEOR is inbound - GET OUT OF THE DESERT!'); start(); return; }
      if (stKey === k && tvOnKey === k) { tvOnKey = null; staticOff(); toast('TV off'); return; } return ut.apply(this, arguments); }; } catch (e) { ERR('tv', e); }
  // ---------- find the desert (incremental scan during the warning) ----------
  let scan = null;
  function startScan() { const nx = Math.ceil(W / CELL), nz = Math.ceil(D / CELL); scan = {nx, nz, cnt: new Uint16Array(nx * nz), x: 1, list: null}; }
  function stepScan(n) { const s = scan; while (n-- > 0 && s.x < W - 1) { for (let z = 1; z < D - 1; z += 2) { const t = topAny(s.x, z); if (t >= SEA - 1 && SANDY.has(world[idx(s.x, t, z)])) s.cnt[((s.x / CELL) | 0) * s.nz + ((z / CELL) | 0)]++; } s.x += 2; } return s.x >= W - 1; }
  function region() { const s = scan, full = CELL * CELL / 4, ok = i => s.cnt[i] >= full * 0.35; let best = -1, bv = 0;
    // seed: the sandy cell nearest the player if he is in the desert, else the sandiest cell
    const pc = ((P.x / CELL) | 0) * s.nz + ((P.z / CELL) | 0); if (ok(pc)) best = pc; else for (let i = 0; i < s.cnt.length; i++) if (s.cnt[i] > bv) { bv = s.cnt[i]; best = i; }
    const seen = new Uint8Array(s.cnt.length), q = [best], cells = []; seen[best] = 1; while (q.length) { const i = q.pop(); cells.push(i); const cx = (i / s.nz) | 0, cz = i % s.nz;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = cx + dx, z = cz + dz; if (x < 0 || z < 0 || x >= s.nx || z >= s.nz) continue; const j = x * s.nz + z; if (!seen[j] && ok(j)) { seen[j] = 1; q.push(j); } } }
    let sx = 0, sz = 0; for (const i of cells) { sx += ((i / s.nz) | 0) * CELL + CELL / 2; sz += (i % s.nz) * CELL + CELL / 2; } const cx = sx / cells.length, cz = sz / cells.length; let R = 0;
    for (const i of cells) R = Math.max(R, Math.hypot(((i / s.nz) | 0) * CELL + CELL / 2 - cx, (i % s.nz) * CELL + CELL / 2 - cz) + CELL * 0.7);
    const set = new Set(cells), list = []; for (const i of cells) { const x0 = ((i / s.nz) | 0) * CELL, z0 = (i % s.nz) * CELL; for (let x = x0; x < x0 + CELL; x++) for (let z = z0; z < z0 + CELL; z++) if (x > 0 && z > 0 && x < W - 1 && z < D - 1) list.push(x, z); }
    for (let i = list.length / 2 - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [list[i * 2], list[j * 2]] = [list[j * 2], list[i * 2]]; [list[i * 2 + 1], list[j * 2 + 1]] = [list[j * 2 + 1], list[i * 2 + 1]]; }
    list.sort ? 0 : 0; return {cx, cz, R, set, list, cells: cells.length}; }
  // ---------- the meteor ----------
  let met = null, trail = null, rum = null, reg = null, ETA = 45;
  function mkMeteor() { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#3a1a0a'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 260; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(255,' + (90 + Math.random() * 120 | 0) + ',20,0.8)' : 'rgba(20,10,5,0.7)'; g.beginPath(); g.arc(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 8, 0, 7); g.fill(); }
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(14, 2), new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(c), fog: false})); const gc = document.createElement('canvas'); gc.width = gc.height = 64; const gx = gc.getContext('2d'), q = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
    q.addColorStop(0, 'rgba(255,240,180,1)'); q.addColorStop(0.35, 'rgba(255,140,30,0.8)'); q.addColorStop(1, 'rgba(255,60,0,0)'); gx.fillStyle = q; gx.fillRect(0, 0, 64, 64);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false})); glow.scale.set(80, 80, 1); m.add(glow);
    m.userData.__dcR = 1e9; m.userData.__dcK = 1; m.frustumCulled = false; glow.userData.__dcR = 1e9; scene.add(m); return m; }
  function mkTrail() { const n = LOW ? 140 : 320, P3 = new Float32Array(n * 3), L = new Float32Array(n), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P3, 3)); for (let i = 0; i < n; i++) P3[i * 3 + 1] = -999;
    const pts = new THREE.Points(g, new THREE.PointsMaterial({color: 0xff7a20, size: 22, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, fog: false})); pts.frustumCulled = false; pts.userData.__dcR = 1e9; pts.userData.__dcK = 1; scene.add(pts); return {P3, L, g, n, i: 0, pts}; }
  function mkRumble() { try { if (!AC) initAudio(); const b = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), ch = b.getChannelData(0); let l = 0; for (let i = 0; i < ch.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; ch[i] = l * 3.5; }
      const s = AC.createBufferSource(); s.buffer = b; s.loop = true; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; const g = AC.createGain(); g.gain.value = 0; s.connect(lp); lp.connect(g); g.connect(typeof master !== 'undefined' ? master : AC.destination); s.start(); return {s, g, lp}; } catch (e) { ERR('rum', e); return null; } }
  function brace() { try { if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance('Brace for impact.'); u.pitch = 1.45; u.rate = 0.9; u.volume = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } } catch (_) {}   // v1.0.73: original alien voice, then a roar
    try { if (!AC) initAudio(); const t = AC.currentTime + 0.9, n = AC.sampleRate * 3, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < n; i++) { l = l * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = l * 9; }
      const s = AC.createBufferSource(); s.buffer = b; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(140, t); lp.frequency.linearRampToValueAtTime(900, t + 1.2); lp.frequency.linearRampToValueAtTime(200, t + 3);
      const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(48, t); o.frequency.linearRampToValueAtTime(70, t + 1.2); o.frequency.linearRampToValueAtTime(38, t + 3); const og = AC.createGain(); og.gain.value = 0.35;
      const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1.1, t + 0.5); g.gain.setValueAtTime(1.1, t + 1.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
      s.connect(lp); o.connect(og); og.connect(lp); lp.connect(g); g.connect((typeof master !== 'undefined' && master) || AC.destination); s.start(t); o.start(t); s.stop(t + 3.1); o.stop(t + 3.1); U.roar = (U.roar || 0) + 1; } catch (_) {} }
  function start() { U.st = 'warn'; U.t = 0; startScan(); ETA = 45; brace(); launch(); try { if (current) { current.c246 = Object.assign(current.c246 || {}, {met: 1}); } } catch (_) {} }
  U.start = start;
  function launch() { reg = null; const a = Math.random() * 6.283; met = mkMeteor(); trail = mkTrail(); rum = mkRumble(); const cx = W / 2, cz = D / 2;
    const ty = SEA + 4; met.userData.a = new THREE.Vector3(cx + Math.sin(a) * 2600, ty + 1200, cz + Math.cos(a) * 2600); met.userData.b = new THREE.Vector3(cx, ty, cz); met.scale.setScalar(0.06); met.position.copy(met.userData.a); U.st = 'fall'; U.ft = 0;
    try { toast('A HUGE METEOR is burning across the sky - get out of the desert!'); } catch (_) {} }
  function boom() { U.st = 'impact'; const b = met.userData.b; scene.remove(met); met = null; if (rum) { try { rum.g.gain.linearRampToValueAtTime(0, AC.currentTime + 6); const r = rum; setTimeout(() => { try { r.s.stop(); } catch (_) {} }, 6500); } catch (_) {} rum = null; }
    const fl = document.createElement('div'); fl.style.cssText = 'position:fixed;inset:0;background:#fff6e0;z-index:80;pointer-events:none;transition:opacity 2.5s'; document.body.appendChild(fl); setTimeout(() => { fl.style.opacity = 0; }, 150); setTimeout(() => fl.remove(), 2800);
    try { sfx('boom'); sfx('boom'); setTimeout(() => { try { sfx('boom'); } catch (_) {} }, 300); shake(4, 0.9); } catch (_) {}
    const d = Math.hypot(P.x - b.x, P.z - b.z), inD = reg.set.has(((P.x / CELL) | 0) * scan.nz + ((P.z / CELL) | 0)); U.hit = inD ? 'in' : d < reg.R + 40 ? 'near' : 'far';
    try { if (inD) hurt(d < reg.R * 0.5 ? 18 : 12, 'The meteor wiped out the desert.'); else if (d < reg.R + 40) hurt(4, 'The meteor shockwave knocked you down.'); } catch (_) {}
    wave = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({color: 0xffa040, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false}));
    wave.rotation.x = -Math.PI / 2; wave.position.set(b.x, b.y + 2, b.z); wave.userData.__dcR = 1e9; wave.userData.__dcK = 1; scene.add(wave); U.wr = 2; U.ci = 0;
    try { current.c246.boom = 1; dirty = true; } catch (_) {} }
  let wave = null;
  function carve(n) { const L = reg.list, b = reg; let k = 0; while (k < n && U.ci < L.length) { const x = L[U.ci], z = L[U.ci + 1]; U.ci += 2; k++; const d = Math.hypot(x - b.cx, z - b.cz), f = Math.max(0, 1 - d / b.R), depth = Math.round(3 + 15 * f * f + 3 * f);
      const t = topAny(x, z); if (!t) continue; let cut = 0; for (let y = t; y > Math.max(2, t - depth); y--) { const i = idx(x, y, z), v = world[i]; if (!v || mine(i)) continue; if (v === T.WATER) break; world[i] = 0; cut++; try { FLV.delete(i); } catch (_) {} }
      if (cut) { const ny = Math.max(2, t - depth); const i = idx(x, ny, z); if (world[i] && !mine(i) && world[i] !== T.WATER) world[i] = T.SANDSTONE !== undefined && Math.random() < 0.5 ? T.SANDSTONE : (T.GRAVEL || world[i]); try { markDirty(x, z); } catch (_) {} if (Math.random() < 0.012 && window.__c237) try { __c237.ignite(x + .5, ny + 1.02, z + .5); } catch (_) {} } }
    U.done = U.ci / 2; U.left = L.length / 2 - U.done; try { dirty = true; } catch (_) {} return U.ci >= L.length; }
  function frame(dt) { if (!started) return; if (stKey) drawStatic(dt);
    if (U.st === 'warn') U.st = 'fall';
    if (U.st === 'fall' && !reg && scan && stepScan(LOW ? 6 : 12)) { reg = region(); U.cols = reg.list.length / 2; U.R = Math.round(reg.R); met.userData.b.set(reg.cx, SEA + 4, reg.cz); }
    if (U.st === 'fall') { U.ft += dt; const k = Math.min(1, U.ft / ETA), e = k * k * (3 - 2 * k) * 0.3 + k * 0.7; met.position.lerpVectors(met.userData.a, met.userData.b, e); met.scale.setScalar(0.06 + 0.94 * Math.pow(k, 1.7)); met.rotation.x += dt * 0.6; met.rotation.y += dt * 0.4; U.eta = Math.round(ETA - U.ft);
      const tr = trail; for (let j = 0; j < (LOW ? 3 : 6); j++) { const i = tr.i = (tr.i + 1) % tr.n; tr.P3[i * 3] = met.position.x + (Math.random() - .5) * 18; tr.P3[i * 3 + 1] = met.position.y + (Math.random() - .5) * 18; tr.P3[i * 3 + 2] = met.position.z + (Math.random() - .5) * 18; tr.L[i] = 4; }
      for (let i = 0; i < tr.n; i++) if (tr.L[i] > 0) { tr.L[i] -= dt; tr.P3[i * 3 + 1] += dt * 3; if (tr.L[i] <= 0) tr.P3[i * 3 + 1] = -999; } tr.g.attributes.position.needsUpdate = true;
      if (rum) { rum.g.gain.value = 0.04 + 1.9 * Math.pow(k, 2.2); if (rum.lp) rum.lp.frequency.value = 110 + 900 * k * k; } if (k > 0.75 && Math.random() < dt * 6) try { shake(0.3, 0.05 + 0.2 * k); } catch (_) {}
      if (U.eta === 30 && !U.w30) { U.w30 = 1; toast('30 seconds until impact - RUN!'); } if (U.eta === 10 && !U.w10) { U.w10 = 1; toast('10 seconds!'); } if (k >= 1 && reg) boom(); }
    else if (U.st === 'impact') { if (wave) { U.wr += dt * 140; wave.scale.set(U.wr, U.wr, 1); wave.material.opacity = Math.max(0, 0.8 - U.wr / (reg.R * 2.5)); if (U.wr > reg.R * 2.5) { scene.remove(wave); wave = null; } }
      if (trail) { for (let i = 0; i < trail.n; i++) if (trail.L[i] > 0) { trail.L[i] -= dt; if (trail.L[i] <= 0) trail.P3[i * 3 + 1] = -999; } trail.g.attributes.position.needsUpdate = true; }
      if (carve(LOW ? 140 : 320)) { U.st = 'over'; if (trail) { scene.remove(trail.pts); trail = null; } try { toast('The desert is gone - only a smoking crater remains.'); } catch (_) {} } } }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { const nw = performance.now(), wd = (nw - (us._w||nw)) / 1000; us._w = nw; frame(Math.min(0.25, Math.max(+dt || 0.016, wd))); } catch (e) { ERR('fr', e); } return r; };
  try { const ew = enterWorld; enterWorld = function () { if (met) { scene.remove(met); met = null; } if (trail) { scene.remove(trail.pts); trail = null; } if (rum) { try { rum.s.stop(); } catch (_) {} rum = null; } staticOff(); U.st = 'none'; return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
})();
