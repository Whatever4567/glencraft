/* GLX-C259 (v1.0.69): many more Egyptians around the pyramid - stone carriers, kneeling worshippers, farmers with hoes and drummers -
   plus the LT meditation dance: aim at any Egyptian and press LT and every Egyptian nearby performs the same keyframed arm and head
   routine in perfect sync (legs only sway), to an original 97 BPM arabesque loop played as 3D audio from the dancers. LT again or
   walking away ends it. Decorative folk only: no health, drops or trades. */
(() => {
  const U = window.__c259 = {err: null, n: 0, on: 0, dancers: 0, t: 0, lt: 0};
  const PI = Math.PI, out = []; let key = null, buf = null, raw = null, src = null, pan = null, gn = null, ctr = null, ltPrev = false, ltT = 0;
  const box = (w, h, d, c, x, y, z, p) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({color: c})); m.position.set(x, y, z); p.add(m); return m; };
  function ground(x, z) { x = Math.floor(x); z = Math.floor(z); for (let y = H - 2; y > 1; y--) { const v = world[idx(x, y, z)]; if (v && !PLANT[v] && v !== T.WATER) return y + 1; } return 0; }
  const ACTS = ['carry', 'pray', 'farm', 'drum', 'carry', 'pray', 'farm', 'carry', 'drum', 'pray', 'farm', 'carry', 'pray', 'farm'];
  function spawn(o) { for (const f of out) scene.remove(f.g); out.length = 0; const mk = window.__c240 && __c240.make; if (!mk) return;
    const n = (window.LOWEND || (typeof lowEnd !== 'undefined' && lowEnd)) ? 8 : 14;
    for (let i = 0; i < n; i++) { const a = 0.3, r = 27, row = Math.floor(i / 4), col = i % 4, ox = (col - 1.5) * 2.6 + (row % 2) * 1.1, oz = (row - 1.5) * 2.6, x = o.cx + 0.5 + Math.cos(a) * r + ox, z = o.cz + 0.5 + Math.sin(a) * r + oz, y = ground(x, z); if (!y) continue;   // v1.0.74: one tight village cluster
      const f = mk(i + 1, false); f.act = ACTS[i % ACTS.length]; f.x = f.hx = x; f.z = f.hz = z; f.y = y; f.a = a; f.r = r; f.yaw = Math.atan2(o.cx - x, o.cz - z);
      if (f.act === 'carry') { f.stone = box(0.5, 0.35, 0.5, 0xd8c08a, 0, 1.92, 0.05, f.g); }
      if (f.act === 'farm') { const h = new THREE.Group(); box(0.05, 1.1, 0.05, 0x6b4a2a, 0, -0.5, 0, h); box(0.22, 0.05, 0.14, 0x777777, 0, -1.05, 0.08, h); h.position.set(0, -0.5, 0); f.arms[1].add(h); }
      if (f.act === 'drum') { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.5, 10), new THREE.MeshLambertMaterial({color: 0x9b6a3a})); d.position.set(0, 0.55, 0.38); f.g.add(d); }
      scene.add(f.g); out.push(f); }
    U.n = out.length; }
  // keyframes [time, lx, lz, rx, rz, headPitch(+down), headYaw(+left), palm roll]
  // v1.0.77: re-keyframed from the reference breakdown (one pose a second, half-beat in-betweens). pose = [lx, lz, rx, rz, headPitch, headYaw(+left), palm roll, headRoll]
  const Q = {clasp: [-1.9, 0.5, -1.9, -0.5, 0.2, 0, 0, 0], bars: [-1.6, 0.62, -1.5, -0.55, 0, 0, 0, 0], rUp: [-0.7, 0.35, -2.95, -0.2, 0, 0, 0, 0], lUp: [-2.95, 0.2, -0.7, -0.35, 0, 0, 0, 0],
    diamond: [-2.5, 0.42, -2.5, -0.42, 0, 0, 0, 0], Lr: [-1.57, 0.75, -2.95, -0.12, 0, 0.4, 0, 0], Ll: [-2.95, 0.12, -1.57, -0.75, 0, -0.4, 0, 0], head: [-2.85, 0.4, -2.85, -0.4, -0.1, 0, 0, 0],
    eyes: [-2.2, 0.42, -2.2, -0.42, 0, 0, 0, 0], flute: [-1.65, 0.32, -1.85, 0.05, 0.05, 0, 0, 0], thrust: [-1.35, 0.95, -1.57, 0, 0, 0, 0, 0], frame: [-2.75, 0.14, -2.75, -0.14, 0, 0, 0, 0],
    cover: [-2.35, 0.47, -2.35, -0.47, 0.1, 0, PI, 0], open: [-2.65, -0.55, -2.65, 0.55, -0.1, 0, 0, 0], paw: [-1.85, 0.32, -1.85, -0.32, 0.1, 0, 0, 0.3], point: [-1.9, 0.4, -1.57, -0.05, 0, 0, 0, 0]};
  const SEQ = [[0, 1.75, 'clasp'], [2, 2.75, 'bars'], [3, 3.75, 'rUp'], [4, 4.75, 'lUp'], [5, 5.75, 'diamond'], [6, 6.75, 'Lr'], [7, 7.75, 'Ll'], [8, 8.75, 'head'], [9, 9.75, 'eyes'],
    [10, 10.75, 'Ll'], [11, 11.75, 'eyes'], [12, 12.75, 'Lr'], [13, 13.75, 'eyes'], [14, 17.75, 'flute'], [18, 18.75, 'thrust'], [19, 19.75, 'frame'], [20, 20.75, 'Lr'], [21, 21.75, 'diamond'],
    [22, 26.6, 'cover'], [27, 27.35, 'open'], [27.6, 27.7, 'cover'], [28, 28.35, 'open'], [28.6, 28.7, 'cover'], [29, 29.35, 'open'], [30, 30.75, 'paw'], [31, 31.3, 'point'], [31.5, 31.6, 'clasp'], [32, 32.4, 'point'], [33, 33, 'clasp']];
  const K = []; for (const [a, b, n] of SEQ) { K.push([a].concat(Q[n])); if (b > a) K.push([b].concat(Q[n])); }
  const LEN = 33, BEAT = 60 / 97, sm = k => k * k * (3 - 2 * k);
  function pose(t) { t %= LEN; let i = 0; while (i < K.length - 2 && K[i + 1][0] <= t) i++; const a = K[i], b = K[i + 1], k = sm(Math.max(0, Math.min(1, (t - a[0]) / Math.max(0.01, b[0] - a[0])))); const p = a.map((v, j) => v + (b[j] - v) * k);
    if (t >= 14 && t < 18) { const w = Math.sin(t * 18) * 0.05; p[2] += w; p[4] -= w; p[6] = t < 15 ? -0.3 : 0.3; }   // flute: wiggling fingers, head right then left, left
    if (t >= 22 && t < 26.6) p[6] = 0.3 * Math.sin((t - 22) / BEAT * PI);   // face covered, head swaying
    return p; }
  function apply(f, p, t) { f.arms[0].rotation.set(p[1], p[7], p[2]); f.arms[1].rotation.set(p[3], -p[7], p[4]); f.hd.rotation.set(p[5], p[6], p[8] || 0);
    const sw = Math.sin(t / BEAT * PI) * 0.06; f.legs[0].rotation.set(0, 0, sw); f.legs[1].rotation.set(0, 0, sw); f.g.rotation.z = sw * 0.3; }
  function all() { return out.concat((window.__c240 && __c240.folk) || []); }
  function ltDown() { try { for (const g of navigator.getGamepads ? navigator.getGamepads() : []) if (g && g.connected && g.buttons[6] && (g.buttons[6].pressed || g.buttons[6].value > 0.4)) return true; } catch (_) {} return ltT > performance.now() - 120; }
  function hookBtn() { try { for (const el of document.querySelectorAll('b,button,div,span')) if (!el.__c259 && el.children.length === 0 && el.textContent.trim() === 'LT') { el.__c259 = 1; const t = el.closest('[id]') || el; t.addEventListener('pointerdown', () => { ltT = performance.now(); }, true); t.addEventListener('touchstart', () => { ltT = performance.now(); }, {capture: true, passive: true}); } } catch (_) {} }
  function aimed() { const fw = new THREE.Vector3(); camera.getWorldDirection(fw); const hl = Math.hypot(fw.x, fw.z) || 1, hx = fw.x / hl, hz = fw.z / hl; let best = null, bs = 1e9;   // v1.0.73: generous - nearest Egyptian within ~4.5 blocks in a wide view cone (or right next to you)
    for (const f of all()) { if (!f.g.visible) continue; const dx = f.x - camera.position.x, dz = f.z - camera.position.z, d = Math.hypot(dx, dz), dy = Math.abs(f.y - P.y); if (d > 4.5 || dy > 3) continue; const c = d < 0.01 ? 1 : (dx * hx + dz * hz) / d; if (c < 0.45 && d > 2) continue; const sc = d - c; if (sc < bs) { bs = sc; best = f; } } return best; }
  // v1.0.78: your own dance track from Settings (kept on this device in IndexedDB, c266) is used first, else the built-in original loop
  const DANCE_SRC = ['assets/music/dance.ogg'];
  function getDance(i = 0) { if (i === 0 && window.__c266 && __c266.get) return __c266.get().then(v => { if (v) { U.src = 'custom:' + v.name; return v.ab.slice(0); } return getDance(1); });
    return getDance0(Math.max(0, i - 1)); }
  function getDance0(i) { return fetch(DANCE_SRC[i]).then(r => { if (!r.ok) throw 0; U.src = DANCE_SRC[i]; return r.arrayBuffer(); }).catch(e => { if (i + 1 < DANCE_SRC.length) return getDance0(i + 1); throw e; }); }
  function music(on) { if (!AC) return; if (on) { if (!raw) { raw = 1; getDance().then(ab => AC.decodeAudioData(ab, b => { buf = b; if (U.ph === 'dance') music(1); })).catch(() => { raw = null; }); return; } if (!buf || src) return;
      src = AC.createBufferSource(); src.buffer = buf; src.loop = true; pan = AC.createPanner(); pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = 8; pan.rolloffFactor = 0.5; pan.maxDistance = 80;   /* v1.0.81: much gentler fall-off */ gn = AC.createGain(); gn.gain.value = 0;
      const dry = AC.createGain(); dry.gain.value = 0.55; const wet = AC.createGain(); wet.gain.value = 0.75; src.connect(gn); gn.connect(wet); wet.connect(pan); pan.connect(AC.destination); gn.connect(dry); dry.connect(AC.destination); src.start(); gn.gain.setTargetAtTime(Math.max(0.15, Math.min(1, SET.music)) * 1.0, AC.currentTime, 0.4);   /* v1.0.81: on the music level (not the sound-effects bus), half direct + half 3D so it is loud and clear */ }
    else if (src) { const s = src, g = gn; g.gain.setTargetAtTime(0, AC.currentTime, 0.4); setTimeout(() => { try { s.stop(); } catch (_) {} }, 1600); src = null; } }
  function start(f) { const ds = all().filter(e => e.g.visible && Math.abs(e.y - f.y) < 2.5 && Math.hypot(e.x - f.x, e.z - f.z) < 18); if (!ds.length) return;   // v1.0.70: group up first
    const fy = Math.atan2(P.x - f.x, P.z - f.z), fx = Math.sin(fy), fz = Math.cos(fy), rx = fz, rz = -fx, per = Math.min(5, Math.max(3, Math.ceil(ds.length / 3)));
    ds.sort((a, b) => (a === f ? -1 : b === f ? 1 : Math.hypot(a.x - f.x, a.z - f.z) - Math.hypot(b.x - f.x, b.z - f.z)));
    ds.forEach((e, k) => { const row = Math.floor(k / per), col = k % per, n = Math.min(per, ds.length - row * per), off = (col - (n - 1) / 2) * 1.4 + (row % 2) * 0.35;
      e.gx = f.x + rx * off - fx * row * 1.5; e.gz = f.z + rz * off - fz * row * 1.5; e.gyaw = fy; e.dz = 1; e.arr = 0; e.blk = 0; });
    U.on = 1; U.ph = 'gather'; U.gt = 0; U.t = 0; U.dancers = ds.length; U.ds = ds; ctr = {x: 0, y: 0, z: 0}; for (const e of ds) { ctr.x += e.gx / ds.length; ctr.y += (e.y + 1.4) / ds.length; ctr.z += e.gz / ds.length; }
    if (!raw && AC) { raw = 1; getDance().then(ab => AC.decodeAudioData(ab, b => { buf = b; if (U.ph === 'dance') music(1); })).catch(() => { raw = null; }); } try { applyMusicVol(); } catch (_) {} }
  function walk(e, d) { const dx = e.gx - e.x, dz = e.gz - e.z, dd = Math.hypot(dx, dz); if (dd < 0.12) { e.x = e.gx; e.z = e.gz; e.arr = 1; return; }
    let ux = dx / dd, uz = dz / dd; const s = Math.min(dd, d * 2.2), by = Math.floor(e.y + 0.5), free = (vx, vz) => { const x = Math.floor(e.x + vx * 0.6), z = Math.floor(e.z + vz * 0.6); return !solid(x, by, z) && !solid(x, by + 1, z); };
    if (!free(ux, uz)) { const sd = e.blk || 1; if (free(-uz * sd, ux * sd)) { const t = ux; ux = -uz * sd; uz = t * sd; } else if (free(uz * sd, -ux * sd)) { const t = ux; ux = uz * sd; uz = -t * sd; e.blk = -sd; } else { e.blk = -sd; return; } }
    e.x += ux * s; e.z += uz * s; const yw = Math.atan2(ux, uz); let dy = yw - e.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); e.g.rotation.y += dy * Math.min(1, d * 8);
    const gy = e.hz !== undefined ? ground(e.x, e.z) : 0; if (gy && Math.abs(gy - e.y) < 2) e.y = gy; e.ph2 = (e.ph2 || 0) + d * 7; const sw = Math.sin(e.ph2) * 0.5; e.legs[0].rotation.set(sw, 0, 0); e.legs[1].rotation.set(-sw, 0, 0); e.arms[0].rotation.set(-sw * 0.7, 0, 0); e.arms[1].rotation.set(sw * 0.7, 0, 0); e.hd.rotation.set(0, 0, 0); e.g.position.set(e.x, e.y, e.z); }
  function stop() { U.on = 0; U.ph = ''; for (const e of out) if (e.dz) { e.ph2 = 0; e.ret = 1; } for (const e of all()) if (e.dz) { e.dz = 0; e.g.rotation.z = 0; e.hd.rotation.set(0, 0, 0); for (const q of e.arms.concat(e.legs)) q.rotation.set(0, 0, 0); } music(0); try { applyMusicVol(); } catch (_) {} }
  try { const am = applyMusicVol; applyMusicVol = function () { const l = musicLvl; if (U.on) musicLvl = 0; try { return am.apply(this, arguments); } finally { musicLvl = l; } }; } catch (e) { U.err = 'amv ' + e; }
  function idle(f, dt, near) { f.g.visible = !DIM.cur; if (!f.g.visible || f.dz) return;   /* v1.0.74: always there */ if (f.ret) { f.gx = f.hx; f.gz = f.hz; f.arr = 0; walk(f, dt); if (!f.arr) return; f.ret = 0; f.ph2 = 0; } f.ph2 += dt; const t = f.ph2, A = f.arms, L = f.legs;
    if (f.act === 'carry') { const s = Math.sin(t * 0.25), r = f.r + s * 6; f.x = (window.__c239.pyr.cx + 0.5) + Math.cos(f.a) * r; f.z = (window.__c239.pyr.cz + 0.5) + Math.sin(f.a) * r; f.yaw = Math.atan2(Math.cos(f.a) * Math.cos(t * 0.25), Math.sin(f.a) * Math.cos(t * 0.25)); const sw = Math.sin(t * 6) * 0.45; L[0].rotation.x = sw; L[1].rotation.x = -sw; A[0].rotation.set(PI, 0, -0.2); A[1].rotation.set(PI, 0, 0.2); f.y = ground(f.x, f.z) || f.y; }
    else if (f.act === 'pray') { L[0].rotation.x = L[1].rotation.x = -1.5; f.g.position.y = f.y - 0.35; const b = 0.35 + 0.35 * Math.max(0, Math.sin(t * 0.9)); f.hd.rotation.x = b; A[0].rotation.set(-2.6 + b, 0, 0.15); A[1].rotation.set(-2.6 + b, 0, -0.15); }
    else if (f.act === 'farm') { const s = Math.sin(t * 2.2); A[1].rotation.x = -1.0 + s * 0.8; A[0].rotation.x = -0.9 + s * 0.7; f.hd.rotation.x = 0.3; }
    else if (f.act === 'drum') { L[0].rotation.x = L[1].rotation.x = -1.5; const s = t / BEAT * PI; A[0].rotation.x = -0.9 - 0.4 * Math.max(0, Math.sin(s)); A[1].rotation.x = -0.9 - 0.4 * Math.max(0, Math.sin(s + PI)); f.hd.rotation.x = 0.1 * Math.sin(s * 2); }
    if (f.act !== 'pray' && f.act !== 'drum') f.g.position.y = f.y; f.g.position.x = f.x; f.g.position.z = f.z; f.g.rotation.y = f.yaw; }
  let last = performance.now(), hb = 0;
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments);
    try { const o = window.__c239 && __c239.pyr, ok = o ? o.cx + ',' + o.cz : null; if (ok !== key) { key = ok; if (U.on) { U.why = 'pyr'; stop(); } if (o && o.L) spawn(o); }   /* v1.0.86: folk are kept if the pyramid scan blinks */
      if (!o || !started) return r; const now = performance.now(), d = Math.min(0.1, (now - last) / 1000); last = now; const near = Math.hypot(P.x - o.cx, P.z - o.cz) < 80, live = !paused && !dead && !DIM.cur;
      if ((hb -= d) <= 0) { hb = 2; hookBtn(); }
      if (live) for (const f of out) idle(f, d, near);
      const lt = live && ltDown(); if (lt && !ltPrev) { U.lt++; if (U.on) { U.why = 'lt'; stop(); } else { const f = aimed(); if (f) start(f); } } ltPrev = lt;
      if (U.on && U.ph === 'gather') { U.gt += d; let all1 = 1; for (const e of U.ds) { if (!e.arr) walk(e, d); if (!e.arr) all1 = 0; }
        if (all1 || U.gt > 6) { for (const e of U.ds) { e.x = e.gx; e.z = e.gz; e.arr = 1; e.g.rotation.y = e.gyaw; e.g.position.set(e.x, e.y, e.z); } U.ph = 'dance'; U.t = 0; U.snap = all1 ? 0 : 1; music(1); } }
      else if (U.on) { U.t += d; const p = pose(U.t); for (const e of U.ds) if (e.dz) { apply(e, p, U.t); e.g.rotation.y = e.gyaw; e.g.position.set(e.x, e.y, e.z); }
        if (pan) { const s = AC.currentTime; pan.positionX ? (pan.positionX.setValueAtTime(ctr.x, s), pan.positionY.setValueAtTime(ctr.y, s), pan.positionZ.setValueAtTime(ctr.z, s)) : pan.setPosition(ctr.x, ctr.y, ctr.z); }
        U.far = Math.hypot(P.x - ctr.x, P.z - ctr.z) > 32 ? (U.far || 0) + d : 0; if (U.far > 2 || DIM.cur) { U.why = DIM.cur ? 'dim' : 'far'; stop(); } }   /* v1.0.83: keeps dancing (song loops) until you walk well away or press LT */
    } catch (e) { if (!U.err) { U.err = String(e).slice(0, 200); console.warn('c259', e); } } return r; };
  /* v1.0.77: the terrain / biome music fades out for the whole dance and comes back after */ let wasOn = 0; setInterval(() => { const on = U.on ? 1 : 0; if (on !== wasOn) { wasOn = on; try { applyMusicVol(); } catch (_) {} } if (on && typeof AC !== 'undefined' && AC && AC.state === 'suspended') AC.resume().catch(() => {}); }, 150);
  U.reset = () => { try { if (src) music(0); } catch (_) {} buf = null; raw = null; };
  U.start = () => { const f = all().find(e => e.g.visible); if (f) start(f); }; U.stop = stop; U.out = () => out; U.all = all; U.pose = pose; U.aimEg = () => { try { return !!aimed(); } catch (_) { return false; } };
})();
