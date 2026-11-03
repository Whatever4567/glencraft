
/* ===================== GLX-C51 (v0.9.46): first-person swim strokes (both arms) ===================== */
(function c51() {
  const g = new THREE.Group(); camera.add(g); g.visible = false; const arms = [];
  for (const s of [-1, 1]) { const piv = new THREE.Group(); g.add(piv); const sl = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.5), sleeveMat); sl.position.z = 0.1; piv.add(sl);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.16), armMat); hd.position.z = -0.22; piv.add(hd); piv.userData.s = s; arms.push(piv); }
  let k = 0, ph = 0, last = performance.now();
  window.__swim1p = () => ({vis: g.visible, k: +k.toFixed(2), handVis: hand.visible});
  // [phase, x, y, z, rotX, rotY, rotZ] - recovery over the top, entry, catch, pull, push out past the hips
  const FLY = [[0, 0.62, 0.05, 0.05, 1.1, 0.9, 0.9], [0.22, 0.42, 0.16, -0.42, 0.55, 0.35, 0.5], [0.36, 0.24, -0.06, -0.66, -0.05, 0.08, 0.1], [0.5, 0.3, -0.18, -0.6, -0.25, 0.18, 0.2],
    [0.68, 0.14, -0.36, -0.36, -0.75, -0.1, -0.1], [0.84, 0.3, -0.52, -0.05, -1.2, 0.3, 0.2], [1, 0.62, 0.05, 0.05, 1.1, 0.9, 0.9]];
  const up = updatePlayer;
  updatePlayer = function () { const r = up.apply(this, arguments);
    try { const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      const on = !!window.swimDeep && !camMode && !dead; k += ((on ? 1 : 0) - k) * Math.min(1, dt * 5);
      const moving = on && (keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD || (typeof touchMove !== 'undefined' && touchMove && (Math.abs(touchMove.x || 0) + Math.abs(touchMove.y || 0)) > 0.1));
      ph += dt * (moving ? (window.swimLava ? 2.0 : 4.0) : 1.6);
      g.visible = on && k > 0.03; if (on && k >= 0.5) { hand.visible = false; g.userData.hid = true; } else if (g.userData.hid) { hand.visible = true; g.userData.hid = false; }
      if (g.visible) for (const a of arms) { const s = a.userData.s;
        if (moving) { // v1.0.0 butterfly: both arms sweep over the top together, dive in ahead, then pull down and back
          const c = (ph % (Math.PI * 2)) / (Math.PI * 2), K = FLY;
          let i = 0; while (i < K.length - 2 && c > K[i + 1][0]) i++; const A = K[i], B = K[i + 1], t0 = Math.min(1, Math.max(0, (c - A[0]) / (B[0] - A[0]))), t = t0 * t0 * (3 - 2 * t0), L = (j) => A[j] + (B[j] - A[j]) * t;
          a.position.set(s * L(1), L(2), L(3)); a.rotation.set(L(4), s * L(5), s * L(6)); }
        else { const w = Math.sin(ph * 2 + (s > 0 ? 0 : Math.PI)); a.position.set(s * (0.3 + w * 0.06), -0.3 + Math.cos(ph * 2) * 0.03, -0.38); a.rotation.set(0.1, s * (0.5 + w * 0.3), s * 0.25); }
        a.position.y -= (1 - k) * 0.4; }
    } catch (_) {}
    return r; };
})();
