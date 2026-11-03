/* ===================== GLX-C109 (v0.9.90): quick torch is placed with the LEFT hand ===================== */
(function c109() {
  const U = window.__c109 = {n: 0, t: -1, f: 0};

  const g = new THREE.Group(); g.visible = false; camera.add(g); U.g = g;
  const piv = new THREE.Group(); g.add(piv);
  const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.07, 0.42, 14), sleeveMat); sl.rotation.x = Math.PI / 2; sl.position.set(-0.02, -0.03, 0.25); piv.add(sl);
  const roll = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.014, 8, 18), sleeveMat); roll.position.set(-0.02, -0.03, 0.04); piv.add(roll);
  const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.052, 0.2, 12), armMat); fore.rotation.x = Math.PI / 2; fore.position.set(-0.02, -0.03, -0.05); piv.add(fore);
  const fist = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.11), armMat); fist.position.set(-0.02, -0.02, -0.17); piv.add(fist);
  let torch = null; try { torch = makeItemMesh(T.TORCH); torch.scale.multiplyScalar(0.85); torch.position.set(-0.02, 0.05, -0.2); piv.add(torch); } catch (e) { console.warn('c109 torch', e); }
  g.traverse(o => { if (o.isMesh) { o.renderOrder = 10; o.frustumCulled = false; } });
  const ease = x => x * x * (3 - 2 * x);
  window.__qtSwing = function () { U.t = 0; U.n++; };
  let last = performance.now();
  function pose() { U.f++;
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (U.t < 0) { g.visible = false; return 0; }
    U.t += dt / (U.dur || 0.42); if (U.t >= 1) { U.t = -1; g.visible = false; return 0; }
    const t = U.t, up = t < 0.3 ? ease(t / 0.3) : t > 0.72 ? 1 - ease((t - 0.72) / 0.28) : 1, sw = t < 0.3 ? 0 : t < 0.55 ? ease((t - 0.3) / 0.25) : t < 0.72 ? 1 : 1 - ease((t - 0.72) / 0.28) * 0.5;
    g.visible = !(window.__thirdPerson || (typeof camMode !== 'undefined' && camMode)); 
    // mirror the right hand's resting pose onto the left side, then rise in and reach forward to place
    g.position.set(-Math.abs(hand.position.x) + 0.05 * sw, hand.position.y - 0.45 * (1 - up) - 0.05 * sw, hand.position.z - 0.14 * sw);
    g.rotation.set(hand.rotation.x, -hand.rotation.y, -hand.rotation.z);
    piv.position.set(-armPivot.position.x, armPivot.position.y, armPivot.position.z);
    piv.rotation.set(armPivot.rotation.x + 0.12 - 0.9 * sw, -armPivot.rotation.y, -armPivot.rotation.z);
    if (torch) torch.visible = t < 0.56;
    return sw;
  }
  // third person: the player model's left arm swings forward too (just for the frame being drawn)
  const rr = renderer.render.bind(renderer);
  renderer.render = function (sc, cam) {
    let sw = 0; try { sw = pose(); } catch (_) {}
    let a = null, rx = 0;
    try { if (sw > 0 && typeof worldModel !== 'undefined' && worldModel && worldModel.visible && worldModel.userData.arms && worldModel.userData.arms[0]) { a = worldModel.userData.arms[0]; rx = a.rotation.x; a.rotation.x = rx - 1.3 * sw; } } catch (_) { a = null; }
    try { return rr(sc, cam); } finally { if (a) a.rotation.x = rx; }
  };
})();
