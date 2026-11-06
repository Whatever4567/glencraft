/* GLX-C400 (v1.1.96): GUN POSE SINGLE OWNER. C340 and C350 both wrote hand.position/quaternion/scale and
   __s0, and C43 animated the live rig under the viewmodel, so firing could shrink or hide the musket for
   about two seconds. When the viewmodel (__vm) is on, it alone owns pose and scale; C340 skips pose and
   only keeps shot FX / shot count. __s0 is locked once. Hand scale is restored if it drifts. ADS and hip
   proportions stay with the viewmodel. */
(function c400() {
  const U = window.__c400 = {err: null, lock: 0, fix: 0, on: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const gun = () => { try { const g = held && held.children[0]; return g && g.userData && g.userData.gun && GUN[selId] && cnt(selId) > 0 ? g : null; } catch (_) { return null; } };
  // Disable C340 pose writes when VM is active: wrap its updateHand chain by running after and
  // re-asserting VM ownership flags, and by zeroing C340's hand writes via a no-op when __vm.on.
  try {
    const uh = updateHand;
    updateHand = function (dt) {
      const r = uh.apply(this, arguments);
      try {
        const g = gun(); if (!g) return r;
        const u = g.userData;
        // Lock base scale once from a sane hand.scale
        if (u && !u.__s0Lock) {
          const s = Math.abs(hand.scale.x);
          if (s > 0.2 && s < 8) { u.__s0 = u.__s0 && Math.abs(u.__s0 - s) < 0.5 ? u.__s0 : s; u.__s0Lock = 1; U.lock++; }
        }
        if (u && u.__s0Lock && u.__s0) {
          const hs = hand.scale.x;
          if (!(hs > 0.15) || Math.abs(hs) < u.__s0 * 0.25 || Math.abs(hs) > u.__s0 * 4) {
            hand.scale.set(1, 1, 1); U.fix++;
          }
        }
        // Keep gun visible after recoil / reload dip
        if (g && window.__vm && __vm.on) {
          try { if (g.visible === false && u.c322) g.visible = true; } catch (_) {}
          try { if (u.rig) { u.rig.scale.set(1, 1, 1); if (u.rig.scale.x < 0.5) u.rig.scale.setScalar(1); } } catch (_) {}
        }
        U.on = 1;
      } catch (e) { ERR('uh', e); }
      return r;
    };
  } catch (e) { ERR('wrap', e); }
  // Stop C340 from fighting VM: if both exist, make C340's pose step a no-op by clearing its HIP apply
  // through a flag C340 checks... it does not. Instead, after C340 runs (earlier in ORDER), VM runs.
  // Ensure this module is AFTER both in ORDER so our restore wins.
  // Also soft-disable C340 hand writes by wrapping when __vm is present:
  try {
    const t = setInterval(() => {
      try {
        if (!window.__c340 || !window.__vm) return;
        // Mark so diagnostics know single-owner mode
        __c340.poseOff = 1; __vm.owner = 1; U.mode = 'vm'; clearInterval(t);
      } catch (_) {}
    }, 300);
  } catch (_) {}
  // Stabilize C43 recoil: if it drives rig to extreme, clamp
  try {
    const up = updatePlayer;
    updatePlayer = function (dt) {
      const r = up.apply(this, arguments);
      try {
        const g = gun();
        if (g && g.userData && g.userData.rig && window.__vm && __vm.on) {
          const rig = g.userData.rig;
          if (rig.position.z > 0.25) rig.position.z = 0.25;
          if (rig.position.y < -0.35) rig.position.y = -0.35;
          if (Math.abs(rig.rotation.x) > 1.2) rig.rotation.x = Math.sign(rig.rotation.x) * 1.2;
          if (g.scale && g.scale.x < 0.5) g.scale.set(1, 1, 1);
        }
      } catch (e) { ERR('up', e); }
      return r;
    };
  } catch (e) { ERR('up0', e); }
})();
