/* GLX-C400 (v1.1.96): GUN POSE OWNER. Viewmodel owns FP pose when present (C340 poseOff). Scale uses
   immutable userData.__s0Base in fp_viewmodel / guns_held_properly — never hand.scale.set(1) after
   decompose. Soft clamp on C43 rig recoil only. */
(function c400() {
  const U = window.__c400 = {err: null, on: 0};
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
      } catch (e) { ERR('rig', e); }
      return r;
    };
  } catch (e) { ERR('up', e); }
})();
