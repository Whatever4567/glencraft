/* GLX-HELDVM-1249: depth-cleared first-person viewmodel pass for tools,
 * blocks and empty hands. Guns already have this in GLX-C350; when the
 * gun pass is on we leave it alone. Also forces the #c121hand overlay
 * off (`__handHD = 0`) so only one solid arm is drawn (t1119 ghost). */
(function heldVm1249() {
  const U = window.__heldVm1249 = {err: null, on: 0};
  try { window.__handHD = 0; } catch (_) {}
  try { if (window.__c121 && typeof __c121.handOn === 'function') __c121.handOn(false); } catch (_) {}
  const tp = function () { try { return typeof camMode !== 'undefined' && !!camMode; } catch (_) { return false; } };
  const vs = new THREE.Scene(), vc = new THREE.PerspectiveCamera(70, 1, 0.01, 20);
  const amb = new THREE.AmbientLight(0xffffff, 0.6), sun = new THREE.DirectionalLight(0xffffff, 0.8);
  vs.add(amb, sun, sun.target, vc); U.vs = vs;
  function collect() {
    const objs = [];
    try { if (typeof hand !== 'undefined' && hand) objs.push(hand); } catch (_) {}
    try {
      const R = window.__fpa && __fpa.rig && __fpa.rig();
      if (R && typeof camera !== 'undefined' && (R.parent === camera || (typeof hand !== 'undefined' && R.parent === hand))) objs.push(R);
    } catch (_) {}
    return objs;
  }
  try {
    const rd = renderer.render;
    renderer.render = function (sc0, cam) {
      if ((window.__vm && window.__vm.on) || sc0 !== scene || cam !== camera || tp())
        return rd.apply(this, arguments);
      const objs = collect();
      if (!objs.length) return rd.apply(this, arguments);
      U.on = 1;
      for (const o of objs) { try { camera.remove(o); } catch (_) {} }
      let r;
      try { r = rd.apply(this, arguments); } catch (e) {
        for (const o of objs) { try { camera.add(o); } catch (_) {} }
        throw e;
      }
      try {
        camera.updateMatrixWorld();
        vc.matrixAutoUpdate = false;
        vc.matrix.copy(camera.matrixWorld);
        vc.matrixWorld.copy(camera.matrixWorld);
        vc.fov = camera.fov; vc.aspect = camera.aspect; vc.updateProjectionMatrix();
        let ai = 0, ac = new THREE.Color(0, 0, 0), dl = null;
        scene.traverseVisible(function (o) {
          if (!o.isLight) return;
          if (o.isAmbientLight || o.isHemisphereLight) { ai += o.intensity; ac.add(o.color.clone().multiplyScalar(o.intensity)); }
          else if (o.isDirectionalLight && (!dl || o.intensity > dl.intensity)) dl = o;
        });
        amb.intensity = Math.max(0.25, Math.min(1.4, ai || 0.6));
        if (ai > 0) amb.color.copy(ac.multiplyScalar(1 / ai));
        if (dl) {
          sun.intensity = dl.intensity; sun.color.copy(dl.color);
          const w = new THREE.Vector3(), t = new THREE.Vector3();
          dl.getWorldPosition(w); dl.target.getWorldPosition(t);
          const cp = new THREE.Vector3().setFromMatrixPosition(vc.matrixWorld);
          sun.position.copy(cp).add(w.sub(t).normalize());
          sun.target.position.copy(cp); sun.target.updateMatrixWorld();
        }
        for (const o of objs) vc.add(o);
        const ac0 = this.autoClear; this.autoClear = false; this.clearDepth();
        try { rd.call(this, vs, vc); } finally { this.autoClear = ac0; }
      } catch (e) { if (!U.err) U.err = String(e && e.message || e); }
      for (const o of objs) { try { camera.add(o); } catch (_) {} }
      return r;
    };
  } catch (e) { U.err = 'rd ' + e; }
  try {
    setInterval(function () {
      try {
        window.__handHD = 0;
        const el = document.getElementById('c121hand');
        if (el) { el.style.visibility = 'hidden'; el.style.display = 'none'; }
      } catch (_) {}
    }, 1500);
  } catch (_) {}
})();
