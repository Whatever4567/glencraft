/* GLX-TBOX3 (v1.1.82): FLYING THE TIME BOX. Inside the box a big screen on the back wall shows a live view from the box, looking the way
   it is heading. Next to the console is a brass steering wheel. Stand at the console and press G (controller X, or tap Fly) to take the
   wheel: W and S go forward and back, A and D steer, Space floats up and Shift sinks. The higher you go the faster it flies, so you can fly
   right up into space and over to the Moon and Mars, and set down on them. Press G again to let go. Teleport trips now fade the box out
   with a whoosh made in code and drop it down with a happy thump when it lands. Moon and Mars trips use the new planet tops. */
(function tbox3() {
  const T = window.__tbox, C2 = window.__tbox2; if (!T || !C2) return; const S = T.S;
  const U = window.__tbox3 = {err: null, pilot: false, H: 0, v: [0, 0, 0], frames: 0, trips: 0, thumps: 0, whoosh: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent), RR = T.RR, HW = T.HW, CZ = HW - RR;
  const room = T.parts.room, SM = T.SM;
  // ---------- the big screen ----------
  const RW = PH ? 256 : 384, RH = Math.round(RW * 9 / 16); let rt = null, cam = null, scr = null, wheel = null;
  function build() { rt = new THREE.WebGLRenderTarget(RW, RH, {depthBuffer: true}); cam = new THREE.PerspectiveCamera(70, 16 / 9, 0.3, 4000);
    const fm = SM(new THREE.MeshBasicMaterial({color: 0x2b1a0c})), sm = SM(new THREE.MeshBasicMaterial({map: rt.texture}));
    const g = new THREE.Group(); const fr = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.0, 0.12), fm); g.add(fr); scr = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.75), sm); scr.position.z = 0.07; g.add(scr);
    g.position.set(0, 2.35, CZ - RR + 0.45); room.add(g);
    const bm = SM(new THREE.MeshLambertMaterial({color: 0xc8962e, emissive: 0x3a2508})), w = new THREE.Group(); w.add(new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 28), bm));
    for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.82, 0.03), bm); s.rotation.z = i * Math.PI / 6; w.add(s); } const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 12), bm); hub.rotation.x = Math.PI / 2; w.add(hub);
    for (let i = 0; i < 6; i++) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), bm); const a = i * Math.PI / 3; k.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0); w.add(k); }
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.0, 10), bm); post.position.set(0, -0.55, -0.1); wheel = w; const wg = new THREE.Group(); wg.add(w); wg.add(post); wg.position.set(1.15, 1.25, CZ + 0.9); wg.rotation.x = -0.5; room.add(wg);
    for (const m of [fm, sm, bm]) { m.stencilFunc = T.camIn ? THREE.AlwaysStencilFunc : THREE.EqualStencilFunc; m.needsUpdate = true; } }
  let fi = 0, busyR = false;
  function shoot(r) { if (busyR || !T.inside || !S.on || DIM.cur) return; if (++fi % (PH ? 4 : 3)) return; busyR = true; const vis = []; const pa = T.parts;
    try { cam.position.set(S.x, S.y + 2.2, S.z); const pitch = U.pilot ? Math.max(-0.5, Math.min(0.5, U.v[1] * 0.02)) : -0.08; cam.rotation.set(pitch, U.H, 0, 'YXZ'); cam.updateMatrixWorld();
      for (const o of [pa.all, typeof hand !== 'undefined' ? hand : null]) if (o) { vis.push([o, o.visible]); o.visible = false; }
      const ort = r.getRenderTarget(), ac = r.autoClear; r.setRenderTarget(rt); r.autoClear = true; r.clear(); r.render(scene, cam); r.setRenderTarget(ort); r.autoClear = ac; U.frames++; }
    catch (e) { ERR('shoot', e); } finally { for (const [o, v] of vis) o.visible = v; busyR = false; } }
  try { const rr = renderer.render.bind(renderer); let inR = 0; renderer.render = function (s, c) { if (!inR && s === scene && c === camera && T.inside) { inR = 1; try { if (!rt) build(); shoot(renderer); } catch (e) { ERR('rr', e); } inR = 0; } return rr(s, c); }; } catch (e) { ERR('rr0', e); }
  // ---------- flying ----------
  const K = {}; addEventListener('keydown', e => { K[e.code] = 1; if (e.code === 'KeyG' && (U.pilot || atC())) { e.stopImmediatePropagation(); toggle(); } }, true); addEventListener('keyup', e => { K[e.code] = 0; }, true);
  const atC = () => T.inside && Math.hypot(P.x - S.x, P.z - (S.z + CZ)) < 2.6;
  let rel = null, tin = {f: 0, t: 0, u: 0};
  function toggle() { if (busyT) return; U.pilot = !U.pilot; rel = U.pilot ? [P.x - S.x, P.y - S.y, P.z - S.z] : null; U.v = [0, 0, 0]; pad.style.display = U.pilot && PH ? 'grid' : 'none'; fb.textContent = U.pilot ? 'Let go' : 'Fly';
    try { toast(U.pilot ? 'You have the wheel. W S A D to fly, Space up, Shift down, G to let go' : 'You let go of the wheel'); } catch (_) {} }
  U.toggle = toggle;
  const blocked = (x, y, z) => { for (const [ox, oz] of [[-HW, -HW], [HW, -HW], [-HW, HW], [HW, HW], [0, 0]]) for (const oy of [0.1, 1.3, 2.5]) if (solid(Math.floor(x + ox), Math.floor(y + oy), Math.floor(z + oz))) return true; return false; };
  function fly(dt) { const g = navigator.getGamepads ? [...navigator.getGamepads()].find(p => p) : null, ax = i => g && Math.abs(g.axes[i] || 0) > 0.2 ? g.axes[i] : 0, bt = i => g && g.buttons[i] && g.buttons[i].pressed ? 1 : 0;
    const f = (K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0) - ax(1) + tin.f, tr = (K.KeyA ? 1 : 0) - (K.KeyD ? 1 : 0) - ax(0) + tin.t, up = (K.Space ? 1 : 0) - (K.ShiftLeft || K.ShiftRight ? 1 : 0) + bt(0) - bt(1) + tin.u;
    U.H += tr * dt * 1.3; try { wheel.rotation.z += ((tr * 1.2) - wheel.rotation.z) * Math.min(1, dt * 6); } catch (_) {}
    const alt = S.y - SEA, sp = alt > 1500 ? 420 : alt > 400 ? 160 : alt > 80 ? 40 : 14, tx = -Math.sin(U.H) * f * sp, tz = -Math.cos(U.H) * f * sp, ty = up * (alt > 400 ? sp * 0.6 : 10);
    const k = Math.min(1, dt * 2.5); U.v[0] += (tx - U.v[0]) * k; U.v[1] += (ty - U.v[1]) * k; U.v[2] += (tz - U.v[2]) * k;
    let nx = S.x + U.v[0] * dt, ny = S.y + U.v[1] * dt, nz = S.z + U.v[2] * dt;
    if (window.__ukb && __ukb.wall(nx, ny + 1, nz)) { nx = S.x; nz = S.z; U.v[0] = U.v[2] = 0; }
    if (blocked(nx, S.y, S.z)) { nx = S.x; U.v[0] = 0; } if (blocked(nx, S.y, nz)) { nz = S.z; U.v[2] = 0; } if (blocked(nx, ny, nz)) { if (U.v[1] < -6) thump(); ny = S.y; U.v[1] = 0; }
    T.place(nx, ny, nz); P.x = S.x + rel[0]; P.y = S.y + rel[1]; P.z = S.z + rel[2]; P.vy = 0; P.fallTop = null; }
  try { const up = updatePlayer; updatePlayer = function (dt) { const r = up.apply(this, arguments); try { if (U.pilot) { if (!T.inside || DIM.cur) toggle(); else fly(Math.min(0.1, dt || 0.016)); } } catch (e) { ERR('fly', e); } return r; }; } catch (e) { ERR('up', e); }
  // ---------- touch: Fly button and a flight pad ----------
  const fb = document.createElement('button'); fb.className = 'btn'; fb.textContent = 'Fly'; fb.dataset.testid = 'tbox-fly'; fb.style.cssText = 'position:fixed;right:14px;top:46%;z-index:120;display:none';
  fb.addEventListener('click', e => { e.preventDefault(); toggle(); }); document.body.appendChild(fb);
  const pad = document.createElement('div'); pad.style.cssText = 'position:fixed;left:14px;bottom:150px;z-index:121;display:none;grid-template-columns:repeat(3,54px);gap:6px';
  for (const [l, k, v] of [['Up', 'u', 1], ['Fwd', 'f', 1], ['Down', 'u', -1], ['Left', 't', 1], ['Back', 'f', -1], ['Right', 't', -1]]) { const b = document.createElement('button'); b.className = 'btn'; b.textContent = l; b.style.cssText = 'padding:10px 0;font-size:13px';
    const on = e => { e.preventDefault(); e.stopPropagation(); tin[k] = v; }, off = e => { e.preventDefault(); tin[k] = 0; }; b.addEventListener('touchstart', on, {passive: false}); b.addEventListener('touchend', off); b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); pad.appendChild(b); }
  document.body.appendChild(pad);
  let pb = []; setInterval(() => { try { fb.style.display = (U.pilot || atC()) ? 'block' : 'none'; const g = navigator.getGamepads ? [...navigator.getGamepads()].find(p => p) : null; if (g) { if (g.buttons[2] && g.buttons[2].pressed && !pb[2] && (U.pilot || atC())) toggle(); pb = g.buttons.map(x => x.pressed); } } catch (_) {} }, 50);
  // ---------- sounds made in code: whoosh and thump ----------
  let AC = null; const ac = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)()), vol = () => (typeof SET !== 'undefined' ? SET.sfx : 0.8);
  function whoosh(dur, rev) { try { const a = ac(), t = a.currentTime, n = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const s = a.createBufferSource(); s.buffer = n; s.loop = true; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3; const g = a.createGain(); s.connect(f); f.connect(g); g.connect(a.destination);
      f.frequency.setValueAtTime(rev ? 2400 : 200, t); f.frequency.exponentialRampToValueAtTime(rev ? 180 : 2600, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * vol(), t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.start(t); s.stop(t + dur + 0.05);
      const o = a.createOscillator(), og = a.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(rev ? 660 : 140, t); o.frequency.exponentialRampToValueAtTime(rev ? 120 : 720, t + dur); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.12 * vol(), t + dur * 0.5); og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(og); og.connect(a.destination); o.start(t); o.stop(t + dur + 0.05); U.whoosh++; } catch (e) { ERR('wh', e); } }
  function thump() { try { const a = ac(), t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(32, t + 0.35); g.gain.setValueAtTime(0.9 * vol(), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.5); const b = a.createOscillator(), bg = a.createGain(); b.type = 'square'; b.frequency.setValueAtTime(420, t + 0.12); b.frequency.exponentialRampToValueAtTime(840, t + 0.3); bg.gain.setValueAtTime(0.0001, t + 0.1); bg.gain.exponentialRampToValueAtTime(0.06 * vol(), t + 0.16); bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); b.connect(bg); bg.connect(a.destination); b.start(t + 0.1); b.stop(t + 0.45);
      shake(0.35, 0.05); U.thumps++; } catch (e) { ERR('th', e); } }
  U.whooshP = whoosh; U.thump = thump;
  // ---------- teleport with a fade and a landing ----------
  const fd = document.createElement('div'); fd.style.cssText = 'position:fixed;inset:0;z-index:300;pointer-events:none;opacity:0;transition:opacity .9s;background:radial-gradient(circle,#9fd8ff 0%,#1a3a7a 60%,#050a1a 100%)'; document.body.appendChild(fd);
  const top = k => { try { return __c318.top(k); } catch (_) { return null; } };
  const ext = () => T.parts.ext; let busyT = false;
  function flicker(ms, out) { const t0 = performance.now(); const f = () => { const p = (performance.now() - t0) / ms; try { ext().visible = p >= 1 ? !out : Math.sin(p * p * 40) > (out ? p * 2 - 1 : 1 - p * 2); } catch (_) {} if (p < 1) requestAnimationFrame(f); }; f(); }
  const go0 = C2.go; C2.go = function (k, name) { if (busyT) return; if (DIM.cur) return go0.apply(this, arguments); if (U.pilot) toggle(); busyT = true; try { C2.close(); } catch (_) {}
    const planet = k === 'moon' || k === 'mars', rx = P.x - S.x, ry = P.y - S.y, rz = P.z - S.z; whoosh(2.4, false); flicker(2200, true); fd.style.opacity = '0.95';
    if (!planet) { const s0 = [S.x, S.y, S.z]; go0.call(C2, k, name); setTimeout(() => { fd.style.opacity = '0'; flicker(1500, false); if (S.x === s0[0] && S.y === s0[1] && S.z === s0[2]) { busyT = false; return; } whoosh(1.6, true); lift(9); drop(name, 1); }, 2750); return; }
    setTimeout(() => { let ok = false; try { const p = top(k); if (p) { T.inside = false; T.place(p[0], p[1] + 9, p[2]); P.x = S.x + rx; P.y = S.y + ry + 0.02; P.z = S.z + rz; P.vy = 0; P.fallTop = null; T.inside = true; ok = true; } } catch (e) { ERR('tp', e); }
      if (!ok) { try { toast('The box could not land there'); } catch (_) {} fd.style.opacity = '0'; busyT = false; return; }
      whoosh(1.6, true); flicker(1500, false); fd.style.opacity = '0'; drop(name); }, 2300); };
  function lift(h) { const rx = P.x - S.x, ry = P.y - S.y, rz = P.z - S.z; T.place(S.x, S.y + h, S.z); P.x = S.x + rx; P.y = S.y + ry; P.z = S.z + rz; P.vy = 0; }
  function drop(name, quiet) { const y1 = S.y - 9; const t0 = performance.now(); const rx = P.x - S.x, ry = P.y - S.y, rz = P.z - S.z; let landY = y1;
    for (let y = Math.floor(S.y); y > S.y - 40; y--) if (solid(Math.floor(S.x), y, Math.floor(S.z))) { landY = y + 1; break; }
    const f = () => { const p = Math.min(1, (performance.now() - t0) / 1300), e = p * p, y = S.y + (landY - S.y) * e; T.place(S.x, y, S.z); P.x = S.x + rx; P.y = S.y + ry; P.z = S.z + rz; P.vy = 0; P.fallTop = null;
      if (p < 1) requestAnimationFrame(f); else { thump(); busyT = false; U.trips++; if (!quiet) try { toast('Landed: ' + name); } catch (_) {} } }; f(); }
  U.go = C2.go;
})();
