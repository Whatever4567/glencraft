/* v1.2.40: first-person musket/pistol reload. The player's own new-character
 * arm (cream sleeve or armour gauntlet) moves to the ramrod/bolt and back —
 * no duplicate striped arm, no 360° flip (shortest-path quaternion slerp),
 * and reload props (ball, magazine, powder) stay small in viewmodel space. */
(function (W) {
  const T = W.THREE || (typeof THREE !== 'undefined' ? THREE : null);
  if (!T) return;
  const U = W.__heldReload1240 = W.__heldReload1240 || {};
  U.MAX_ANG = 0.5;          // rad per 16ms frame; scaled by dt
  U.MAX_PROP_R = 0.11;      // world-space bounding radius for reload props
  U.MUSKET_DIP = 0.28;      // cap on C43 musket rig tip so the wrap does not fill the view
  U.err = null; U.clamped = 0; U.slerps = 0; U.flipsBlocked = 0; U.on = 0; U.arms = 0;

  const _prev = new WeakMap();
  const _idle = new WeakMap();
  const _tmpQ = new T.Quaternion();
  let settle = 0;
  function maxStep(dt) {
    return U.MAX_ANG * Math.max(0.25, (dt || 0.016) / 0.016);
  }
  function rememberIdle(obj) {
    if (!obj || !obj.quaternion) return;
    const q = _idle.get(obj);
    if (q) q.copy(obj.quaternion);
    else _idle.set(obj, obj.quaternion.clone());
  }
  U.rememberIdle = rememberIdle;
  function slerpToward(obj, dt, targetQ) {
    if (!obj || !obj.quaternion) return 0;
    if (targetQ) obj.quaternion.copy(targetQ);
    const max = maxStep(dt);
    const prev = _prev.get(obj);
    if (!prev) { _prev.set(obj, obj.quaternion.clone()); return 0; }
    const a = prev.angleTo(obj.quaternion);
    if (a > max) {
      const t = max / Math.max(a, 1e-8);
      _tmpQ.copy(obj.quaternion);
      obj.quaternion.copy(prev).slerp(_tmpQ, t);
      if (obj.rotation) obj.rotation.setFromQuaternion(obj.quaternion, obj.rotation.order, false);
      U.slerps++;
      if (a > Math.PI * 0.6) U.flipsBlocked++;
    }
    _prev.get(obj).copy(obj.quaternion);
    return a;
  }
  U.slerpToward = slerpToward;
  function slerpToIdle(obj, dt) {
    const idle = _idle.get(obj);
    if (!idle) return slerpToward(obj, dt);
    return slerpToward(obj, dt, idle);
  }
  U.slerpToIdle = slerpToIdle;

  function worldRadius(o) {
    if (!o || !o.isMesh || !o.geometry) return 0;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const s = o.geometry.boundingSphere;
    return (s ? s.radius : 0) * (o.matrixWorld ? o.matrixWorld.getMaxScaleOnAxis() : (o.scale ? Math.max(Math.abs(o.scale.x), Math.abs(o.scale.y), Math.abs(o.scale.z)) : 1));
  }
  U.worldRadius = worldRadius;

  function isPlayerArm(o) {
    for (let p = o; p; p = p.parent) {
      const n = p.name || '';
      if (n === 'Held1240FpArms' || n === 'Held1240ReloadArm') return true;
      if (W.__fpaR && W.__fpaR(p)) return true;
    }
    return false;
  }

  function clampProp(o) {
    if (!o || !o.isMesh || o.visible === false) return false;
    if (isPlayerArm(o)) return false;
    o.updateMatrixWorld(true);
    const r = worldRadius(o);
    if (!(r > U.MAX_PROP_R)) return false;
    const k = U.MAX_PROP_R / r;
    o.scale.multiplyScalar(k);
    o.updateMatrixWorld(true);
    o.userData.held1240Clamped = 1;
    U.clamped++;
    return true;
  }
  U.clampProp = clampProp;

  function countArmRoots(root) {
    if (!root) return 0;
    const names = new Set();
    root.traverse(o => {
      const n = o.name || '';
      if (n === 'Held1240FpArms' || n === 'Held1240ReloadArm') names.add(n + ':' + (o.uuid || ''));
    });
    // FPA rig counts as one (it has R and L children)
    try { if (W.__fpa && W.__fpa.rig && W.__fpa.rig()) names.add('fpa'); } catch (_) {}
    return names.size;
  }
  U.countArmRoots = countArmRoots;

  function reloading() {
    try { if (W.__c43rf > 0 && W.__c43rf <= 1) return {on: 1, rf: W.__c43rf, musket: !!(typeof selId !== 'undefined' && typeof IT !== 'undefined' && selId === IT.MUSKET)}; } catch (_) {}
    try { if (W.__rl && W.__rl.t > 0) return {on: 1, rf: 1 - W.__rl.t / (W.__rl.dur || 1), musket: W.__rl.id === (typeof IT !== 'undefined' ? IT.MUSKET : 213)}; } catch (_) {}
    try { if (typeof gunReload !== 'undefined' && gunReload > 0) return {on: 1, rf: 1 - gunReload / ((GUN[gunReloadId] && GUN[gunReloadId].reload) || 2), musket: gunReloadId === (typeof IT !== 'undefined' ? IT.MUSKET : 213)}; } catch (_) {}
    return {on: 0, rf: 0, musket: false};
  }
  U.reloading = reloading;

  function softenMusketDip(g) {
    if (!g || !g.userData || !g.userData.rig) return;
    const rig = g.userData.rig;
    const cap = U.MUSKET_DIP;
    if (Math.abs(rig.rotation.x) > cap) rig.rotation.x = Math.sign(rig.rotation.x) * cap;
    if (Math.abs(rig.rotation.z) > cap) rig.rotation.z = Math.sign(rig.rotation.z) * cap;
    // keep yaw from wrapping
    if (rig.rotation.y > Math.PI) rig.rotation.y -= Math.PI * 2;
    if (rig.rotation.y < -Math.PI) rig.rotation.y += Math.PI * 2;
  }

  function hideExtraArms(root) {
    if (!root) return 0;
    let hid = 0;
    const official = root.getObjectByName && root.getObjectByName('Held1240FpArms');
    root.traverse(o => {
      if (!o || o === official) return;
      const n = o.name || '';
      if (n === 'Held1240FpArms' || n === 'Held1240ReloadArm') return;
      // Foreign / leftover procedural arms only. Never hide gun parts (wrap, mag, bolt).
      if (/^(FPA|GLX-FPA|GLX-C51|reload.?arm|extra.?arm|striped.?arm)$/i.test(n) || o.userData.held1240ExtraArm) {
        if (official && o.visible) { o.visible = false; hid++; }
      }
    });
    return hid;
  }
  U.hideExtraArms = hideExtraArms;

  function keepPlayerArms() {
    try {
      const cam = (typeof camera !== 'undefined') ? camera : W.camera;
      if (!cam) return;
      const fp = cam.getObjectByName && cam.getObjectByName('Held1240FpArms');
      if (fp) {
        fp.visible = true;
        fp.traverse(o => {
          // never hide the new-character arm / armour meshes we already chose
          if ((o.isMesh || o.isSkinnedMesh) && o.userData && o.userData.held1240Hid) return;
        });
        if (W.__held1240 && W.__held1240.setArmourArms) {
          let on = false;
          try { on = !!(typeof armour !== 'undefined' && armour && armour[1]); } catch (_) {}
          W.__held1240.setArmourArms(fp, on);
        }
      }
      // Hide leftover procedural FPA only when the new arms are up, but keep them
      // if the new clone failed so a reload is never armless.
      if (fp && W.__held1240 && W.__held1240.hideProceduralFp) W.__held1240.hideProceduralFp();
      hideExtraArms(cam);
    } catch (e) { if (!U.err) U.err = 'arms: ' + (e && e.message || e); }
  }

  function gunMesh() {
    try {
      const h = (typeof held !== 'undefined' && held) || W.held;
      if (h && h.children && h.children[0] && h.children[0].userData && h.children[0].userData.gun) return h.children[0];
    } catch (_) {}
    return null;
  }

  U.step = function (dt) {
    const st = reloading();
    if (st.on) settle = 0.28;
    else if (settle > 0) settle = Math.max(0, settle - (dt || 0.016));
    U.on = st.on ? 1 : 0;
    U.settle = settle;
    const g = gunMesh();
    try {
      if (g && g.userData && g.userData.rig) {
        const rig = g.userData.rig;
        if (!st.on && settle <= 0) rememberIdle(rig);
        if (st.on && st.musket) softenMusketDip(g);
        if (settle > 0 && !st.on) slerpToIdle(rig, dt);
        else slerpToward(rig, dt);
        if (g.userData.mag) {
          // Keep the magazine / ball in the viewmodel's local scale.
          if (g.userData.mag.userData.__s0 == null) g.userData.mag.userData.__s0 = g.userData.mag.scale.clone();
          const mx = g.userData.mag.matrixWorld ? g.userData.mag.matrixWorld.getMaxScaleOnAxis() : Math.abs(g.userData.mag.scale.x || 1);
          if (mx > 0.25) {
            const s0 = g.userData.mag.userData.__s0;
            g.userData.mag.scale.copy(s0);
            U.clamped++;
          }
          clampProp(g.userData.mag);
          g.userData.mag.traverse(c => { if (c.isMesh) clampProp(c); });
        }
      }
    } catch (e) { if (!U.err) U.err = 'gun: ' + (e && e.message || e); }
    try {
      if (typeof hand !== 'undefined' && hand) slerpToward(hand, dt);
    } catch (_) {}
    try {
      const cam = (typeof camera !== 'undefined') ? camera : W.camera;
      if (st.on && cam) {
        cam.traverse(o => {
          if (!o.isMesh || o.visible === false) return;
          if (isPlayerArm(o)) return;
          // Ignore the main world / environment: only viewmodel-ish nodes
          // (parented under camera, hand, held, or the gun).
          let under = false, p = o;
          for (; p; p = p.parent) {
            if (p === cam || p === (typeof hand !== 'undefined' ? hand : null) || p === (typeof held !== 'undefined' ? held : null) || p === g) { under = true; break; }
            if (p.name === 'Held1240FpArms') return;
          }
          if (under) clampProp(o);
        });
      }
    } catch (e) { if (!U.err) U.err = 'props: ' + (e && e.message || e); }
    if (st.on || settle > 0) keepPlayerArms();
    try {
      const cam = (typeof camera !== 'undefined') ? camera : W.camera;
      U.arms = countArmRoots(cam);
    } catch (_) {}
    return U;
  };

  U.install = function () {
    if (U.hooked) return U;
    U.hooked = 1;
    const hook = fn => {
      const prev = fn;
      return function () {
        const r = prev.apply(this, arguments);
        try { U.step(typeof arguments[0] === 'number' ? arguments[0] : 0.016); } catch (e) { if (!U.err) U.err = String(e && e.message || e); }
        return r;
      };
    };
    try { if (typeof updateHand === 'function') updateHand = hook(updateHand); } catch (e) { U.err = 'uh: ' + e; }
    try { if (typeof updatePlayer === 'function') updatePlayer = hook(updatePlayer); } catch (e) { if (!U.err) U.err = 'up: ' + e; }
    return U;
  };
  try { U.install(); } catch (e) { U.err = 'install: ' + e; }
})(typeof window !== 'undefined' ? window : this);
