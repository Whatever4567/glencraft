// GLX-ONEM v1.1.67: one Moon. The sky moon disc is drawn exactly in the direction of the real landable Moon,
// at the same size it really looks from where you stand, so the moon you see at night is the one you can fly to.
(() => {
  const U = window.__c367 = {on: 0, err: null};
  let C = null; const d = new THREE.Vector3();
  function centre() { if (C) return C; try { const t = __c318.top('moon'); if (t) C = new THREE.Vector3(t[0], t[1] - 120, t[2]); } catch (_) {} return C; }
  const R0 = renderer.render.bind(renderer);
  renderer.render = function (s, cam) {
    try { if (s === scene && cam === camera && !DIM.cur && typeof moonDisc !== 'undefined' && centre()) {
      d.copy(C).sub(camera.position); const dist = d.length(); d.normalize();
      if (d.y < 0.02 || camera.position.y > SEA + 140) { moonDisc.visible = false; try { moonHalo.visible = false; } catch (_) {} }
      else if (moonDisc.visible) {
        moonDisc.position.copy(camera.position).addScaledVector(d, 90); moonDisc.lookAt(camera.position);
        moonDisc.scale.setScalar(Math.max(0.6, 120 / dist * 90 / 3.4 * 1.6));
        try { moonHalo.position.copy(moonDisc.position); moonHalo.lookAt(camera.position); } catch (_) {}
        U.on = 1; } } } catch (e) { U.err = String(e); }
    return R0(s, cam);
  };
})();
