/* GLX-C350 (v1.1.99): the first person gun viewmodel, done the way shooters do it.
   One owner for the gun pose: each gun has a fixed hip spot and a fixed aim spot, the gun is turned so its barrel runs straight
   down the view, and in aim the sight line sits exactly on the screen centre. Sway, bob, breathing and kick move only this root and
   are smoothed. The arms are solved after the gun is placed, so the hands follow the grips instead of fighting them.
   The gun and arms draw in their own pass after the world with the depth cleared, with their own camera (fixed field of view and a
   tiny near plane), so they never clip into walls and the aim zoom does not stretch them. The real models load at start and a gun
   stays hidden until its real model is in, so the old blocky gun never flashes. */
(function c350() {
  const U = window.__vm = {err: null, on: 0, k: 0, pre: 0, hidden: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const relTo = (o, top, out) => { out.identity(); for (let x = o; x && x !== top; x = x.parent) { x.updateMatrix(); out.premultiply(x.matrix); if (x.parent === top) return true; } return false; };
  const gun = () => { try { const g = held && held.children[0]; return g && g.userData && g.userData.gun && GUN[selId] && cnt(selId) > 0 ? g : null; } catch (_) { return null; } };
  const tp = () => !!(window.__thirdPerson || (typeof camMode !== 'undefined' && camMode));
  const aim = () => { try { return !!((window.__c288 && __c288.aiming) || (window.__c145 && __c145.hold)); } catch (_) { return false; } };
  // per gun: hip spot of the sight point, aim spot of the sight point (on the view axis), hip turn, aim zoom, kick
  const PRE = {pistol: {hip: [0.08, -0.12, -0.42], ads: [0, -0.0035, -0.47], sk: 0, yaw: 0.06, roll: 0.03, zoom: 0.10, kz: 0.045, kr: 0.22},
               rifle: {hip: [0.085, -0.125, -0.42], ads: [0, -0.003, -0.42], sk: 0.62, yaw: 0.05, roll: 0.02, zoom: 0.18, kz: 0.06, kr: 0.12}};
  const M1 = new THREE.Matrix4(), Mr = new THREE.Matrix4(), Md = new THREE.Matrix4(), B = new THREE.Matrix4(), v = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  let k = 0, kick = 0, shots = -1, tm = 0, lyaw = 0, lpit = 0, sx = 0, sy = 0, bx = 0, by = 0, sel = -1, sw = 1, baseFov = 0, ready = null;
  // preload both real guns once the game runs
  const pre = setInterval(() => { try { if (typeof started !== 'undefined' && started && window.__c322 && __c322.load) { __c322.load('pistol'); __c322.load('rifle'); U.pre = 1; clearInterval(pre); } } catch (_) {} }, 300);
  const warm = g => { try { g.traverse(o => { if (o.isMesh && o.material) for (const m of [].concat(o.material)) for (const t of [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.emissiveMap, m.aoMap]) if (t && !t.__w) { t.__w = 1; renderer.initTexture && renderer.initTexture(t); } }); } catch (_) {} };
  try { const uh = updateHand; updateHand = function (dt) { const r = uh.apply(this, arguments); try { step(Math.min(0.1, dt || 0.016)); } catch (e) { ERR('step', e); } return r; }; } catch (e) { ERR('uh', e); }
  function step(d) { const g = gun(); U.on = 0; if (!g || tp() || !hand.visible) { ready = null; return; }
    const u = g.userData;
    if (!u.c322) { try { if (__c322.swap) __c322.swap(g); } catch (_) {} }
    if (!u.c322) { g.visible = false; U.hidden++; return; }   // real model not in yet: show nothing rather than the old gun
    if (ready !== g) { ready = g; warm(g); g.visible = false; U.hidden++; return; }   // one frame to upload its textures
    g.visible = true; U.on = 1; tm += d;
    const isP = u.gun === IT.PISTOL, C = PRE[isP ? 'pistol' : 'rifle'];
    k += ((aim() ? 1 : 0) - k) * (1 - Math.exp(-d * 16)); U.k = +k.toFixed(2); const e = k * k * (3 - 2 * k);
    const sh = window.__c340 ? __c340.shots || 0 : 0; if (shots >= 0 && sh > shots) kick = 1; shots = sh; kick *= Math.exp(-d * 12);
    if (selId !== sel) { sel = selId; sw = 0; } sw = Math.min(1, sw + d * 3.5); const dip = (1 - Math.sin(sw * Math.PI / 2)) * 0.25;
    // smoothed sway (lags the view a little), bob and breathing, much smaller while aiming
    let dy = P.yaw - lyaw; if (dy > Math.PI) dy -= 2 * Math.PI; if (dy < -Math.PI) dy += 2 * Math.PI; const dp = P.pitch - lpit; lyaw = P.yaw; lpit = P.pitch;
    const f = 1 - Math.exp(-d * 8), am = 1 - 0.85 * e; sx += (Math.max(-0.03, Math.min(0.03, -dy * 0.25)) - sx) * f; sy += (Math.max(-0.025, Math.min(0.025, -dp * 0.25)) - sy) * f;
    const wp = typeof walkPhase === 'number' ? walkPhase : 0, bo = (typeof bobAmt === 'number' ? Math.min(1, bobAmt * 8) : 0);
    bx += (Math.cos(wp) * 0.008 * bo - bx) * f; by += (-Math.abs(Math.sin(wp)) * 0.007 * bo - by) * f; const br = Math.sin(tm * 1.5) * 0.0025;
    // gun frame: rig axes inside g
    if (!relTo(g, hand, M1)) return; M1.decompose(v, q, sc);
    if (!u.__s0Base) { const s0 = Math.abs(sc.x * (hand.scale.x || 1)); if (s0 > 0.05 && s0 < 20) u.__s0Base = s0; }
    let s = u.__s0 = u.__s0Base || 1;
    if (C.sk) s *= C.sk;   // long guns a bit smaller so the stock meets the shoulder
    relTo(u.rig, g, Mr); const sg = (u.sight ? u.sight.clone() : V(0, 0.04, 0)).applyMatrix4(Mr);
    const dir = V(0, 0, -1).transformDirection(Mr), up0 = V(0, 1, 0).transformDirection(Mr), rt = dir.clone().cross(up0).normalize(), up = rt.clone().cross(dir).normalize();
    B.makeBasis(rt, up, dir.clone().negate()); const Q0 = new THREE.Quaternion().setFromRotationMatrix(B).invert();   // barrel down the view, sights up
    const hp = C.hip, asp = Math.min(1, (camera.aspect || 1.6) / 1.2), hx = hp[0] * (0.6 + 0.4 * asp) * (isP ? 1 : 1);
    const T = V(hx + (C.ads[0] - hx) * e, hp[1] + (C.ads[1] - hp[1]) * e, hp[2] + (C.ads[2] - hp[2]) * e);
    T.x += (sx + bx) * am; T.y += (sy + by + br) * am - dip + 0.006 * kick * (1 - 0.5 * e); T.z += C.kz * kick;
    const Qa = new THREE.Quaternion().setFromEuler(new THREE.Euler(C.kr * kick + sy * 1.5 * am - dip, C.yaw * (1 - e) + sx * 1.5 * am, -C.roll * (1 - e) - sx * 2 * am, 'YXZ'));
    const Q = Qa.multiply(Q0); const pos = T.clone().sub(sg.clone().multiplyScalar(s).applyQuaternion(Q));
    const ss = Math.max(0.08, Math.min(8, Math.abs(s) || 1)); Md.compose(pos, Q, V(ss, ss, ss)); Md.multiply(M1.clone().invert()); Md.decompose(v, q, sc); hand.position.copy(v); hand.quaternion.copy(q); hand.scale.set(Math.abs(sc.x) || ss, Math.abs(sc.y) || ss, Math.abs(sc.z) || ss);
    U.sight = T.toArray().map(x => +x.toFixed(4));
    try { if (window.__fpa && __fpa.step) { __fpa.fromVm = 1; __fpa.step(d); __fpa.fromVm = 0; } } catch (e2) { ERR('fpa', e2); }
    // world zoom: small, the gun itself never zooms
    if (typeof SET !== 'undefined' && SET.fov) { baseFov = SET.fov; const fv = baseFov * (1 - C.zoom * e); if (Math.abs(camera.fov - fv) > 0.01) { camera.fov = fv; camera.updateProjectionMatrix(); } }
  }
  // the viewmodel pass
  const vs = new THREE.Scene(), vc = new THREE.PerspectiveCamera(70, 1, 0.01, 20), amb = new THREE.AmbientLight(0xffffff, 0.6), sun = new THREE.DirectionalLight(0xffffff, 0.8);
  vs.add(amb, sun, sun.target, vc); U.vs = vs;
  try { const rd = renderer.render; renderer.render = function (sc0, cam) {
      try { const g0 = sc0 === scene && gun(); if (g0 && !g0.userData.c322) g0.visible = false; } catch (_) {}   // never draw the old gun, even for the frame it is made
      if (!U.on || sc0 !== scene || cam !== camera || tp()) return rd.apply(this, arguments);
      const R = window.__fpa && __fpa.rig ? __fpa.rig() : null, objs = [hand].concat(R && R.parent === camera ? [R] : []);
      for (const o of objs) camera.remove(o);
      let r; try { r = rd.apply(this, arguments); } catch (e) { for (const o of objs) camera.add(o); throw e; }
      try { camera.updateMatrixWorld(); vc.matrixAutoUpdate = false; vc.matrix.copy(camera.matrixWorld); vc.matrixWorld.copy(camera.matrixWorld);
        vc.fov = baseFov || camera.fov; vc.aspect = camera.aspect; vc.updateProjectionMatrix();
        let ai = 0, ac = new THREE.Color(0, 0, 0), dl = null; scene.traverseVisible(o => { if (!o.isLight) return; if (o.isAmbientLight || o.isHemisphereLight) { ai += o.intensity; ac.add(o.color.clone().multiplyScalar(o.intensity)); } else if (o.isDirectionalLight && (!dl || o.intensity > dl.intensity)) dl = o; });
        amb.intensity = Math.max(0.25, Math.min(1.4, ai)); if (ai > 0) amb.color.copy(ac.multiplyScalar(1 / ai));
        if (dl) { sun.intensity = dl.intensity; sun.color.copy(dl.color); const w = new THREE.Vector3(), t = new THREE.Vector3(); dl.getWorldPosition(w); dl.target.getWorldPosition(t); const cp = new THREE.Vector3().setFromMatrixPosition(vc.matrixWorld); sun.position.copy(cp).add(w.sub(t).normalize()); sun.target.position.copy(cp); sun.target.updateMatrixWorld(); }
        for (const o of objs) vc.add(o);
        const ac0 = this.autoClear; this.autoClear = false; this.clearDepth(); try { rd.call(this, vs, vc); } finally { this.autoClear = ac0; }
      } catch (e) { ERR('pass', e); }
      for (const o of objs) camera.add(o);
      return r; }; } catch (e) { ERR('rd', e); }
})();
