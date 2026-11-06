/* GLX-C400 (v1.1.99): ONE FPS RIG OWNER. Viewmodel (__vm) owns FP gun pose and scale via immutable __s0Base.
   C340 poseOff; C288 aim yields when __vm.on. Soft clamp on C43-style recoil only. Recoil and ADS are
   deltas from the bind pose inside fp_viewmodel - never compound matrix or scale overrides here. */
(function c400() {
  const U = window.__c400 = {err: null, on: 0, owner: 'vm'};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  try {
    const t = setInterval(() => {
      try {
        if (!window.__c340 || !window.__vm) return;
        __c340.poseOff = 1; __vm.owner = 1; U.mode = 'vm'; U.on = 1; clearInterval(t);
      } catch (_) {}
    }, 200);
  } catch (e) { ERR('boot', e); }
  try {
    const up = updatePlayer;
    updatePlayer = function (dt) {
      const r = up.apply(this, arguments);
      try {
        if (!(window.__vm && __vm.on)) return r;
        const g = held && held.children[0];
        if (!g || !g.userData || !g.userData.gun || !g.userData.rig) return r;
        const rig = g.userData.rig;
        if (rig.position.z > 0.25) rig.position.z = 0.25;
        if (rig.position.y < -0.35) rig.position.y = -0.35;
        if (Math.abs(rig.rotation.x) > 1.2) rig.rotation.x = Math.sign(rig.rotation.x) * 1.2;
        // Never let hand scale go singular or mirrored while VM owns pose
        try { const sx = hand.scale.x, sy = hand.scale.y, sz = hand.scale.z;
          if (!(sx > 0.05 && sy > 0.05 && sz > 0.05) || sx < 0 || sy < 0 || sz < 0) {
            const b = (g.userData.__s0Base > 0.05 && g.userData.__s0Base < 20) ? g.userData.__s0Base : 1;
            hand.scale.set(b, b, b);
          }
        } catch (_) {}
      } catch (e) { ERR('rig', e); }
      return r;
    };
  } catch (e) { ERR('up', e); }
})();
