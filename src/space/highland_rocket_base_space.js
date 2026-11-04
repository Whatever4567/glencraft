/* GLX-C299 (v1.0.107, SPACE v1.0.114): Highland Rocket Base and space flight across the whole solar system.
   - A launch pad with a gantry, a sign and a saltire flag next to one of the farmers crofts. Mesh only: no world blocks are touched, so it works in every world.
   - Board the rocket (button), then THRUST (button or Space), steer with the move stick / WASD, EXIT once landed. Third person camera that looks along the flight
     direction and pitches with the rocket (straight up while you climb).
   - Going up: build height, The Firmament (y 300), the atmosphere (the Highlands map shrinking and fading below), then space from y 1000: zero gravity, no drag,
     perpetual drift. Deep space is 24000 x 24000 with every planet of C305. TARGET picks one; let go of the stick and the rocket steers for it (WARP when far).
   - The Moon and Mars are real voxel worlds (C306): fly into them to land, build, then climb out to leave. EXIT in deep space for a zero-g space walk.
   - While you are up there the real player is parked high above the base, so mobs, freezing and fall damage never touch you. */
(function c299() {
  const U = window.__c299 = {err: null, on: false, frame: 'earth', base: null, V: {x: 0, y: 0, z: 0}, vel: {x: 0, y: 0, z: 0}, tilt: 0, yaw: 0, thr: 0, landed: true, walk: false, layer: '', maxY: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const FY = 300, SPACE = 1000, VMAX = 260, VWARP = 700;
  const L = (c, e) => new THREE.MeshLambertMaterial({color: c, emissive: e || 0x000000});
  const B = c => new THREE.MeshBasicMaterial({color: c});
  U.topAt = (x, z) => { x = Math.floor(x); z = Math.floor(z); if (x < 0 || z < 0 || x >= W || z >= D) return 0; for (let y = H - 1; y > 0; y--) { const b = world[idx(x, y, z)]; if (b && b !== T.WATER && !(typeof PLANT !== 'undefined' && PLANT[b]) && b !== T.LEAVES) return y + 1; if (b === T.WATER) return y + 1; } return 1; };
  // ---------- the rocket ----------
  function rocket() { const g = new THREE.Group(), w = L(0xeef0f2, 0x202020), r = L(0xc8202a, 0x300000), bl = L(0x1f4fa8, 0x081830);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 10, 18), w); body.position.y = 6; g.add(body);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.33, 1.33, 1.2, 18), bl); band.position.y = 8; g.add(band);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.3, 4, 18), r); nose.position.y = 13; g.add(nose);
    const win = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), L(0x8fd4ff, 0x2a5a80)); win.position.set(0, 9.6, -1.2); g.add(win);
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 1.8), r), a = k * Math.PI / 2; f.position.set(Math.sin(a) * 1.7, 2.2, Math.cos(a) * 1.7); f.rotation.y = a; g.add(f); }
    const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 1, 14), L(0x333333)); noz.position.y = 0.6; g.add(noz);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5, 12), new THREE.MeshBasicMaterial({color: 0xffa030, transparent: true, opacity: 0.85, fog: false})); fl.rotation.x = Math.PI; fl.position.y = -2.4; fl.visible = false; g.add(fl);
    g.userData.fl = fl; return g; }
  function sign() { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#163a6e'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#fff'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.fillText('HIGHLAND', 128, 28); x.font = 'bold 20px sans-serif'; x.fillText('ROCKET BASE', 128, 54);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(c), side: THREE.DoubleSide})); return m; }
  function flag() { const c = document.createElement('canvas'); c.width = 64; c.height = 40; const x = c.getContext('2d'); x.fillStyle = '#0065bd'; x.fillRect(0, 0, 64, 40); x.strokeStyle = '#fff'; x.lineWidth = 7; x.beginPath(); x.moveTo(0, 0); x.lineTo(64, 40); x.moveTo(64, 0); x.lineTo(0, 40); x.stroke();
    return new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(c), side: THREE.DoubleSide})); }
  function hazard() { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#8a8d90'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#e8c21a'; for (let i = -128; i < 256; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 8, 0); x.lineTo(i + 8 - 128, 128); x.lineTo(i - 128, 128); x.fill(); }
    x.fillStyle = '#8a8d90'; x.fillRect(12, 12, 104, 104); x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.arc(64, 64, 30, 0, 6.283); x.stroke(); return new THREE.CanvasTexture(c); }
  function findSpot() { const F = (window.__c113 && __c113.farmsList && __c113.farmsList()) || []; const tries = F.length ? F : [{x0: (W >> 1) + 40, z0: (D >> 1) + 40}];
    for (const f of tries) { const cx = f.x0 + 3, cz = f.z0 + 6; for (let rr = 26; rr < 90; rr += 6) for (let a = 0; a < 6.283; a += 0.35) { const x = Math.round(cx + Math.cos(a) * rr), z = Math.round(cz + Math.sin(a) * rr);
      if (x < 12 || z < 12 || x > W - 12 || z > D - 12) continue; let lo = 1e9, hi = -1e9, ok = true; for (let dx = -6; dx <= 6 && ok; dx += 2) for (let dz = -6; dz <= 6; dz += 2) { const t = U.topAt(x + dx, z + dz); if (world[idx(x + dx, t - 1, z + dz)] === T.WATER || t <= SEA + 2) { ok = false; break; } lo = Math.min(lo, t); hi = Math.max(hi, t); }
      if (ok && hi - lo <= 1) return {x, z, y: hi, farm: f}; } } return null; }
  let G = null, R = null;
  function build() { const s = findSpot(); if (!s) return false; U.base = s; G = new THREE.Group(); G.position.set(s.x + 0.5, s.y, s.z + 0.5);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(13, 0.24, 13), new THREE.MeshLambertMaterial({map: hazard()})); pad.position.y = 0.12; G.add(pad);
    const red = L(0xb02028), wh = L(0xdddddd); for (const [ox, oz] of [[5, 5], [5, 3], [3, 5], [3, 3]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.35, 20, 0.35), red); p.position.set(ox, 10, oz); G.add(p); }
    for (let y = 2; y < 20; y += 3) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 2.4), wh); b.position.set(4, y, 4); G.add(b); }
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 3.2), red); arm.position.set(3, 11, 2.4); arm.rotation.y = -0.78; G.add(arm);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 0.2), wh); post.position.set(-7.5, 1.25, -7.5); G.add(post); const sg = sign(); sg.position.set(-7.5, 2.9, -7.5); sg.rotation.y = Math.PI / 4; G.add(sg);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6, 6), wh); pole.position.set(-6.5, 3, 6.5); G.add(pole); const fg = flag(); fg.position.set(-5.7, 5.4, 6.5); G.add(fg); G.userData.flag = fg;
    scene.add(G); R = rocket(); scene.add(R); park(); return true; }
  function park() { const s = U.base; U.V = {x: s.x + 0.5, y: s.y + 0.24, z: s.z + 0.5}; U.vel = {x: 0, y: 0, z: 0}; U.tilt = 0; U.landed = true; U.frame = 'earth'; place(); }
  U.park = park;
  function place() { if (!R) return; R.position.set(U.V.x, U.V.y, U.V.z); R.rotation.set(0, 0, 0); R.rotateY(U.yaw); R.rotateX(-U.tilt); R.visible = true; }
  const nose = () => { const s = Math.sin(U.tilt); return {x: -Math.sin(U.yaw) * s, y: Math.cos(U.tilt), z: -Math.cos(U.yaw) * s}; };
  const S5 = () => window.__c305, PD = () => window.__c306, say = t => { try { toast(t); } catch (_) {} };
  const TG = ['moon', 'mars', 'earth', ]; U.ti = 0;
  U.tbody = () => B7() ? U.tb7() : S5().get(TG[U.ti % TG.length]);
  /* v1.1.28: the rocket flies inside the C317 space box: free flight, real block collisions, land on top of the Moon or Mars */
  const B7 = () => !!(window.__c317 && __c317.on());
  const gB7 = (x, y, z) => { const X = Math.floor(x), Z = Math.floor(z); for (let yy = Math.floor(y) + 1; yy > Math.floor(y) - 14; yy--) if (solid(X, yy, Z)) return yy + 1; return -1e9; };
  const NM = {moon: 'The Moon', mars: 'Mars', earth: 'Earth'};
  U.isPl = () => !!(PD() && PD().is() && U.frame === DIM.cur);
  U.tb7 = () => { const id = TG[U.ti % TG.length]; return {id, name: NM[id], home: id === 'earth', r: 0}; };
  U.overMap = () => U.V.x > -200 && U.V.x < W + 200 && U.V.z > -200 && U.V.z < D + 200;
  U.space = () => U.frame === 'earth' && (B7() ? (!__c317.foot(U.V.x, U.V.z) || U.V.y > H + 300 || U.V.y < -2) : U.V.y > SPACE || !U.overMap() || U.V.y < -50);
  U.target = () => { if (B7()) { const id = U.tb7().id, t = id !== 'earth' && window.__c318 && __c318.top(id); return t ? {x: t[0], y: t[1] + 40, z: t[2]} : {x: W / 2, y: H + 120, z: D / 2}; } const b = U.tbody(), e = S5().E0(); if (b.id === 'earth') return {x: e.x, y: SPACE + 100, z: e.z}; return S5().pos(b); };
  U.alt = () => U.V.y;
  U.ground = (x, z) => B7() ? gB7(x, U.V.y, z) : U.topAt(x, z);
  function layers() { const a = U.alt(), E = U.frame === 'earth'; let l = a < H + 20 ? '' : !E ? 'up' : U.space() ? 'space' : a < FY - 20 ? 'up' : a < FY + 25 ? 'firm' : 'atmo';
    if (l !== U.layer) { const m = {up: E ? 'Above the build height - no limit for the rocket' : 'Climb on to leave orbit', firm: 'The Firmament!', atmo: 'The atmosphere - the Highlands map shrinking below',
        space: 'Space! Zero gravity, perpetual orbit. TARGET picks a planet and the rocket steers for it until you move the stick'}; if (m[l] && a > U.maxL) say(m[l]); U.layer = l; U.maxL = Math.max(U.maxL || 0, a); } }
  // ---------- flight ----------
  function fly(dt, mx, mz) { if (DIM.busy || U.busy) return; const thr = U.thrHeld || !!keys.Space || jumpHeld || jumpHeldPad; U.thr = thr ? 1 : 0; jumpReq = false; jumpBuf = 0;
    const a = U.alt(), E = U.frame === 'earth', space = U.space(), pl = !E && PD() ? PD().PL[U.frame] : null;
    U.yaw -= mx * 1.3 * dt; if (Math.abs(mz) > 0.1) U.tilt = Math.max(0, Math.min(space ? 3.1 : 1.55, U.tilt + mz * 0.9 * dt));
    if (Math.abs(mx) >= 0.1 || Math.abs(mz) >= 0.1) U.auto = false; /* v1.0.116: the autopilot only steers after you press TARGET, so it never dives you back down */
    if (space && U.auto && Math.abs(mx) < 0.1 && Math.abs(mz) < 0.1) { const t = U.target(), dx = t.x - U.V.x, dy = t.y - U.V.y, dz = t.z - U.V.z, h = Math.hypot(dx, dz);
      const ty = Math.atan2(-dx, -dz), tt = Math.atan2(h, dy); let d = ty - U.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); U.yaw += d * Math.min(1, dt * 1.5); U.tilt += (tt - U.tilt) * Math.min(1, dt * 1.5); }
    const nP = B7() && space && window.__c318 && __c318.near(U.V, 90), n = nose(), g = space ? (nP ? 4 : 0) : pl ? 9.8 * pl.g : 9.8 * Math.max(0.25, 1 - a / SPACE), acc = thr ? (space ? 60 : 32) : 0;
    U.vel.x += n.x * acc * dt; U.vel.y += (n.y * acc - g) * dt; U.vel.z += n.z * acc * dt;
    if (space && thr) { const dot = U.vel.x * n.x + U.vel.y * n.y + U.vel.z * n.z, k = 1 - Math.exp(-dt * 0.8); U.vel.x -= (U.vel.x - n.x * dot) * k; U.vel.y -= (U.vel.y - n.y * dot) * k; U.vel.z -= (U.vel.z - n.z * dot) * k; }
    if (!space) { const dens = pl ? 0.6 : Math.max(0.02, 1 - a / SPACE), k = Math.exp(-dt * (0.35 * dens + (thr ? 0 : 0.15))); U.vel.x *= k; U.vel.z *= k; U.vel.y *= Math.exp(-dt * 0.12 * dens); }
    let far = 0; if (space && B7()) far = !(window.__c318 && __c318.near(U.V, 1500)); else if (space) { const nb = S5().nearest(U.V); far = nb[1] > 1500; }
    const sp = Math.hypot(U.vel.x, U.vel.y, U.vel.z), cap = space ? (far && thr ? VWARP : VMAX) : 120; if (sp > cap) { const f = Math.exp(-dt * 2) + (1 - Math.exp(-dt * 2)) * cap / sp; U.vel.x *= f; U.vel.y *= f; U.vel.z *= f; }
    if (!thr && !space) { const up = U.V.y - U.ground(U.V.x, U.V.z); if (up < 60 && U.vel.y < -18) U.vel.y += (-18 - U.vel.y) * Math.min(1, dt * 2.5); }
    const pv = [U.V.x, U.V.y, U.V.z]; U.V.x += U.vel.x * dt; U.V.y += U.vel.y * dt; U.V.z += U.vel.z * dt;
    if (B7()) { const hit = () => { for (let k = 1; k <= 3; k++) if (solid(Math.floor(U.V.x), Math.floor(U.V.y) + k, Math.floor(U.V.z))) return true; return false; }; if (hit()) { U.V.x = pv[0]; U.V.y = pv[1]; U.V.z = pv[2]; if (Math.hypot(U.vel.x, U.vel.y, U.vel.z) > 25) say('Bump!'); U.vel.x *= -0.2; U.vel.y *= -0.2; U.vel.z *= -0.2; } __c317.clampBox(U.V, 12); }
    if (!B7() && (!E || U.V.y < H + 60 && U.overMap())) { U.V.x = Math.max(6, Math.min(W - 6, U.V.x)); U.V.z = Math.max(6, Math.min(D - 6, U.V.z)); }
    if (E && !B7()) { const L = S5().BOUND, e = S5().E0(); for (const k of ['x', 'z']) if (Math.abs(U.V[k] - e[k]) > L) { U.V[k] = e[k] + Math.sign(U.V[k] - e[k]) * L; U.vel[k] = 0; } if (Math.abs(U.V.y) > 9000) { U.V.y = Math.sign(U.V.y) * 9000; U.vel.y = 0; } }
    const gr = B7() ? gB7(U.V.x, U.V.y, U.V.z) : U.overMap() || !E ? U.ground(U.V.x, U.V.z) : -1e9; U.landed = false;
    if (U.V.y <= gr) { if (U.vel.y < -28) say('Bumpy landing!'); U.V.y = gr; U.vel.x *= 0.5; U.vel.z *= 0.5; U.vel.y = Math.max(0, U.vel.y); if (!thr) { U.landed = true; U.tilt *= Math.exp(-dt * 3); U.vel.x = U.vel.z = 0; } }
    if (space && !B7()) bodies(); if (pl && a > H + 260) leavePl();
    if (R) { place(); const fl = R.userData.fl; fl.visible = thr; if (thr) fl.scale.set(1, 0.8 + Math.random() * 0.5, 1); }
    U.maxY = Math.max(U.maxY, a); layers(); }
  let nag = 0;
  function bodies() { for (const b of S5().SYS) { if (b.v2) continue; const d = S5().surf(b, U.V); if (b.home) { if (!(U.overMap() && U.V.y > -50) && d < 25) push(b, 25); continue; }
      if (b.land && d < 30) { land(b); return; } if (!b.land && d < 40) { push(b, 40); if (performance.now() > nag) { say(b.no); nag = performance.now() + 4000; } } } }
  function push(b, m) { const p = S5().pos(b), dx = U.V.x - p.x, dy = U.V.y - p.y, dz = U.V.z - p.z, l = Math.hypot(dx, dy, dz) || 1, nx = dx / l, ny = dy / l, nz = dz / l, rr = b.r + m;
    U.V.x = p.x + nx * rr; U.V.y = p.y + ny * rr; U.V.z = p.z + nz * rr; const v = U.vel.x * nx + U.vel.y * ny + U.vel.z * nz; if (v < 0) { U.vel.x -= 1.4 * v * nx; U.vel.y -= 1.4 * v * ny; U.vel.z -= 1.4 * v * nz; } }
  async function land(b) { U.busy = true; try { const ok = await PD().land(b); if (ok) { U.frame = b.id; const S = PD().PL[b.id].size; U.V = {x: S / 2 + 0.5, y: H + 150, z: S / 2 + 0.5}; U.vel = {x: 0, y: -40, z: 0}; U.tilt = 0; U.layer = ''; U.maxL = 1e9; setTimeout(() => { U.maxL = 0; }, 4000); } else push(b, 60); } catch (e) { ERR('land', e); } U.busy = false; }
  async function leavePl() { U.busy = true; try { const id = U.frame, b = S5().get(id); if (await PD().leave()) { U.frame = 'earth'; const p = S5().pos(b); U.V = {x: p.x, y: p.y + b.r + 160, z: p.z}; U.vel = {x: 0, y: 50, z: 0}; U.tilt = 0;
      U.ti = TG.indexOf('earth'); U.auto = true; say('Back in space. TARGET is set to Earth - let go of the stick to steer home'); } } catch (e) { ERR('leave', e); } U.busy = false; }
  function syncP() { if (B7() && U.frame === 'earth') { if (U.on) { P.x = U.V.x; P.y = U.V.y; P.z = U.V.z; } P.vy = 0; P.onGround = true; P.fallTop = null; return; } if ((U.frame === 'earth' && U.V.y < H + 40 && U.overMap() && U.on) || U.isPl()) { P.x = Math.max(1, Math.min(W - 2, U.V.x)); P.z = Math.max(1, Math.min(D - 2, U.V.z)); P.y = Math.max(1, Math.min(H - 1, U.V.y)); }
    else if (U.base) { P.x = U.base.x + 0.5; P.z = U.base.z + 0.5; P.y = H + 90; } P.vy = 0; P.onGround = true; P.fallTop = null; }
  U.board = () => { if (!R || U.on) return; U.on = true; if (PD()) PD().eva = false; window.__thirdPerson = window.thirdPerson = true; if (U.landed) { U.yaw = P.yaw; U.vel = {x: 0, y: 0, z: 0}; }
    say('Rocket: hold THRUST to lift off, move stick / WASD to steer, EXIT once landed (or in space for a space walk)'); ui(); };
  U.exit = () => { if (!U.on) return; const sp = U.space();
    if (B7()) { if (!U.landed && !sp) { say('Land first, then EXIT (or EXIT out in space and fall with normal gravity)'); return; } U.on = false; window.__thirdPerson = window.thirdPerson = false; const s_ = Math.sin(U.yaw), c_ = Math.cos(U.yaw);
      P.x = U.V.x + c_ * 3; P.z = U.V.z - s_ * 3; P.y = U.V.y + (U.landed ? 0.6 : 0); P.vy = 0; P.fallTop = null; if (!U.landed) { U.vel = {x: 0, y: 0, z: 0}; say('You stepped out into space. Fly back with the jetpack to BOARD again'); } ui(); return; } if (!U.landed && !sp) { say('Land first, then EXIT (or EXIT in deep space for a space walk)'); return; } U.on = false; window.__thirdPerson = window.thirdPerson = false;
    if (sp && !U.landed) PD().startEva(U.V, U.vel); else { P.x = U.V.x + 3; P.z = U.V.z; P.y = U.ground(P.x, P.z) + 0.05; P.vy = 0; } ui(); };
  try { const up = updatePlayer; updatePlayer = function (dt, mx, mz) { try { const d = Math.min(dt, 0.05);
        if (U.on) { fly(d, mx, mz); syncP(); return 0; }
        if (U.frame === 'earth' && U.space() && !U.landed) { U.V.x += U.vel.x * d; U.V.y += U.vel.y * d; U.V.z += U.vel.z * d; place(); }
        if (PD() && PD().eva) { PD().evaStep(d, mx, mz); syncP(); return 0; } } catch (e) { ERR('upd', e); } return up.apply(this, arguments); }; } catch (e) { ERR('wrap', e); }
  try { const se = serialize; serialize = function () { const o = se.apply(this, arguments); try { if (!DIM.cur && o && o.P && (U.on || U.frame !== 'earth' || (PD() && PD().eva)) && U.base) { o.P.x = U.base.x + 3.5; o.P.z = U.base.z + 0.5; o.P.y = U.base.y + 0.1; } } catch (_) {} return o; }; } catch (e) { ERR('ser', e); }
  try { const ew = enterWorld; enterWorld = function () { try { U.on = false; window.__thirdPerson = window.thirdPerson = false; if (PD()) PD().eva = false; U.frame = 'earth'; U.walk = false;
      if (G) { scene.remove(G); G = null; } if (R) { scene.remove(R); R = null; } U.base = null; } catch (e) { ERR('ew', e); } return ew.apply(this, arguments); }; } catch (e) { ERR('ew0', e); }
  let bx = null; const btn = (t, css, on, off) => { const b = document.createElement('div'); b.textContent = t; b.style.cssText = 'position:fixed;z-index:45;padding:10px 16px;border-radius:14px;font:bold 15px sans-serif;color:#fff;background:rgba(22,58,110,.82);border:2px solid #9cc4ff;user-select:none;touch-action:none;display:none;' + css;
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); on(); }); if (off) { b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off); } document.body.appendChild(b); return b; };
  function ui() { if (!bx) { bx = {board: btn('Board rocket', 'left:50%;bottom:120px;transform:translateX(-50%);', () => U.board()), thr: btn('THRUST', 'right:22%;bottom:150px;padding:18px 22px;background:rgba(170,40,30,.85);border-color:#ffb08a;', () => { U.thrHeld = true; }, () => { U.thrHeld = false; }),
      exit: btn('EXIT', 'right:22%;bottom:230px;', () => U.exit()), tgt: btn('TARGET', 'right:22%;bottom:300px;', () => { U.ti++; U.auto = true; say('Target: ' + U.tbody().name); }), hud: btn('', 'left:50%;top:54px;transform:translateX(-50%);font-size:13px;padding:5px 10px;pointer-events:none;', () => {})};
      bx.board.dataset.testid = 'rocket-board'; bx.thr.dataset.testid = 'rocket-thrust'; bx.exit.dataset.testid = 'rocket-exit'; bx.tgt.dataset.testid = 'rocket-target'; }
    const ev = PD() && PD().eva; bx.thr.style.display = bx.exit.style.display = U.on ? 'block' : 'none'; bx.tgt.style.display = U.on && U.frame === 'earth' ? 'block' : 'none'; bx.hud.style.display = U.on || ev ? 'block' : 'none'; }
  U.ui = ui;
  // ---------- per frame ----------
  (function loop() { requestAnimationFrame(loop); try { if (!started) { if (bx) bx.board.style.display = 'none'; return; } if (!G && !DIM.cur && window.__c113 && (__c113.farms || performance.now() > 30000)) build(); if (!R) return; ui();
      const ev = PD() && PD().eva, me = ev ? PD().E : {x: P.x, y: P.y, z: P.z}, mine = !DIM.cur ? U.frame === 'earth' : U.isPl();
      const near = !U.on && mine && (ev ? Math.hypot(me.x - U.V.x, me.y - U.V.y, me.z - U.V.z) < 12 : Math.hypot(me.x - U.V.x, me.z - U.V.z) < 7 && Math.abs(me.y - U.V.y) < 6);
      bx.board.style.display = near && !menuOpen ? 'block' : 'none'; R.visible = mine; if (G) { G.visible = U.frame === 'earth' && !DIM.cur; G.userData.flag.rotation.y = Math.sin(performance.now() / 600) * 0.25; }
      if (U.on || ev) { const t = U.frame === 'earth' ? U.target() : null, b = U.tbody(); bx.hud.textContent = window.__spaceHud ? window.__spaceHud : (ev ? 'SPACE WALK' + (PD().jet() ? ' (jetpack)' : '') + '   rocket ' + Math.round(Math.hypot(me.x - U.V.x, me.y - U.V.y, me.z - U.V.z)) : 'Altitude ' + Math.round(U.alt()) + '   Speed ' + Math.round(Math.hypot(U.vel.x, U.vel.y, U.vel.z)))
        + (U.frame !== 'earth' ? '   ' + PD().PL[U.frame].name.toUpperCase() : t && !ev ? '   ' + b.name + ' ' + Math.max(0, Math.round(Math.hypot(t.x - U.V.x, t.y - U.V.y, t.z - U.V.z) - (b.home ? 0 : b.r))) : ''); } } catch (e) { ERR('loop', e); } })();
  const stars = (() => { const n = 1400, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, t = Math.random() * 6.283, s = Math.sqrt(1 - u * u); a[i * 3] = s * Math.cos(t) * 125; a[i * 3 + 1] = u * 125; a[i * 3 + 2] = s * Math.sin(t) * 125; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false})); p.frustumCulled = false; p.visible = false; scene.add(p); return p; })();
  const uT = {value: 0}; const firm = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.ShaderMaterial({uniforms: {uT}, transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec2 vU; void main(){ vU = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uT; varying vec2 vU; void main(){ float w = sin(vU.x * 0.09 + uT * 1.3) + sin(vU.y * 0.07 - uT * 0.9) + sin((vU.x + vU.y) * 0.05 + uT * 2.1); vec3 c = 0.55 + 0.45 * cos(vec3(0.0, 2.1, 4.2) + w + uT * 0.4); float e = 1.0 - smoothstep(90.0, 150.0, length(vU)); gl_FragColor = vec4(mix(vec3(0.75, 0.9, 1.0), c, 0.6), (0.28 + 0.12 * w) * e); }'}));
  firm.rotation.x = -Math.PI / 2; firm.visible = false; firm.frustumCulled = false; scene.add(firm);
  // ---------- the Highlands map seen from above (fades as you climb) ----------
  let mapP = null; const MC = {};
  const mcol = b => { if (MC[b] !== undefined) return MC[b]; const n = String((typeof NAMES !== 'undefined' && NAMES[b]) || '').toLowerCase();
    return (MC[b] = /water/.test(n) ? [40, 90, 170] : /snow|ice/.test(n) ? [235, 240, 245] : /grass|leaf|leaves|fern|moss/.test(n) ? [70, 130, 55] : /sand/.test(n) ? [214, 196, 140] : /log|wood|plank|dirt|peat|mud/.test(n) ? [110, 85, 55] : /stone|rock|cobble|gravel|slate/.test(n) ? [125, 125, 128] : [95, 120, 80]); };
  function mapPlane() { const N = 216, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N), sx = W / N, sz = D / N;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const wx = Math.floor((i + 0.5) * sx), wz = Math.floor((j + 0.5) * sz); let b = 0, y = H - 1; for (; y > 0; y--) { b = world[idx(wx, y, wz)]; if (b) break; }
      const k = mcol(b), sh = 0.8 + 0.4 * Math.min(1, y / H), o = (j * N + i) * 4; im.data[o] = k[0] * sh; im.data[o + 1] = k[1] * sh; im.data[o + 2] = k[2] * sh; im.data[o + 3] = 255; }
    x.putImageData(im, 0, 0); const m = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, fog: false}));
    m.rotation.x = -Math.PI / 2; m.position.set(W / 2, SEA + 2, D / 2); m.frustumCulled = false; m.visible = false; m.userData.w = W; scene.add(m); return m; }
  const hid = [], bg0 = new THREE.Color(), fc0 = new THREE.Color(), tmp = new THREE.Color(), BLK = new THREE.Color(0x02030a), up0 = new THREE.Vector3(0, 1, 0);
  function camSet(c) { const n = nose(), st = Math.sin(U.tilt), ct = Math.cos(U.tilt), sy = Math.sin(U.yaw), cy = Math.cos(U.yaw), u = {x: sy * ct, y: st, z: cy * ct}, hg = Math.max(0, Math.min(1, (U.V.y - U.ground(U.V.x, U.V.z) - 6) / 30));
          const bx_ = -sy, bz = -cy, p0 = [U.V.x - bx_ * 22, U.V.y + 9, U.V.z - bz * 22], p1 = [U.V.x - n.x * 26 + u.x * 6, U.V.y + 6 - n.y * 26 + u.y * 6, U.V.z - n.z * 26 + u.z * 6];
          c.position.set(p0[0] + (p1[0] - p0[0]) * hg, p0[1] + (p1[1] - p0[1]) * hg, p0[2] + (p1[2] - p0[2]) * hg); c.up.set(u.x * hg, 1 - hg + u.y * hg, u.z * hg).normalize();
          c.lookAt(U.V.x + n.x * (8 + 32 * hg), U.V.y + 5 + n.y * (4 + 36 * hg), U.V.z + n.z * (8 + 32 * hg)); }
  U.camSet = camSet;
  try { const rr = renderer.render; renderer.render = function (s, c) { const pl = U.isPl(); if (s !== scene || !started || !U.base || (DIM.cur && !pl)) return rr.apply(this, arguments); let restore = null, far0 = 0, eS = null;
    try { const ev = PD() && PD().eva, off = !(window.__c317 && __c317.on()) && (U.on || ev || (U.frame === 'earth' && U.space())); stars.visible = firm.visible = false; if (mapP) mapP.visible = false; if (S5()) S5().show(false);
      if (B7() && U.on && U.frame === 'earth') { camSet(c); for (const m of c.children) if (m.visible && m.isGroup && m.children.length) { m.visible = false; hid.push(m); } }
      if (off || pl) { const E = U.frame === 'earth', a = ev ? PD().E.y : U.alt(); uT.value = performance.now() / 1000; hid.length = 0; const deep = E && (a > FY + 200 || !U.overMap());
        for (const m of s.children) if (m.visible && m !== stars && ((m.renderOrder <= -10 && m.material && m.material.isShaderMaterial) || m.isSprite || (m.isPoints && m.position.distanceTo(c.position) < 3) || (deep && m !== R && !m.userData.sys && m !== mapP && !m.isLight && !(S5() && S5().SYS.some(b => b.g === m))))) { m.visible = false; hid.push(m); }
        if (U.on || ev) for (const m of c.children) if (m.visible && m.isGroup && m.children.length) { m.visible = false; hid.push(m); }
        if (U.on) camSet(c);
        else if (ev) c.position.set(PD().E.x, PD().E.y + 1.6, PD().E.z);
        if (E) { const f = Math.max(0, Math.min(1, (a - H - 20) / (SPACE - H - 20))) * (U.overMap() ? 1 : 0) + (U.overMap() ? 0 : 1);
          if (s.fog && s.background && s.background.isColor) { bg0.copy(s.background); fc0.copy(s.fog.color); restore = [s.fog.near, s.fog.far]; tmp.copy(bg0).lerp(BLK, Math.min(1, f)); s.background.copy(tmp); s.fog.color.copy(tmp);
            if (f > 0.05) { s.fog.near = 400; s.fog.far = deep ? 1e6 : 1500; } }
          if (f > 0.15) { stars.visible = true; stars.position.copy(c.position); stars.material.opacity = Math.min(1, (f - 0.15) * 1.6); }
          if (Math.abs(c.position.y - FY) < 140 && U.overMap()) { firm.visible = !window.__c314; firm.position.set(c.position.x, FY, c.position.z); }
          if (a > H + 40) { if (!mapP || mapP.userData.w !== W) mapP = mapPlane(); mapP.visible = false; mapP.material.opacity = 1; /* v1.1.19: the flat Earth stays solid from space and the Moon */ }
          if (a > FY - 100 || !U.overMap()) { S5().show(true); far0 = c.far; c.far = 60000; c.updateProjectionMatrix(); } }
        else { bg0.copy(s.background); fc0.copy(s.fog.color); restore = [s.fog.near, s.fog.far]; const st_ = PD().sky(s, c, a); if (st_) { stars.visible = true; stars.position.copy(c.position); stars.material.opacity = 1; }
          if (U.frame === 'moon' && S5()) { S5().show(false); const e = S5().get('earth'); if (!S5().list) S5().build(); eS = e.g; e.g.visible = true; e.g.scale.setScalar(16 / 1400); e.g.position.set(c.position.x + 35, c.position.y + 55, c.position.z - 45); if (typeof moonDisc !== 'undefined' && moonDisc.visible) { moonDisc.visible = false; hid.push(moonDisc); } e.g.rotation.y += 0.0005; } } } } catch (e) { ERR('rw', e); }
    const r = rr.apply(this, arguments); for (const m of hid) m.visible = true; hid.length = 0; c.up.copy(up0); if (far0) { c.far = far0; c.updateProjectionMatrix(); } if (eS) { eS.visible = false; eS.scale.setScalar(1); }
    if (restore) { s.background.copy(bg0); s.fog.color.copy(fc0); s.fog.near = restore[0]; s.fog.far = restore[1]; } return r; }; } catch (e) { ERR('rw0', e); }
})();
