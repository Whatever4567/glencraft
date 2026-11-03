/* ===================== GLX-C115 (v0.9.95): HD jetpack icon rendered from a 3D model of the worn jetpack (twin tanks, nozzles, straps, metal shading) ===================== */
(function c115() {
  const U = window.__c115 = {done: false, err: null};
  function model() {
    const g = new THREE.Group(), M = (c, sh, sp) => new THREE.MeshPhongMaterial({color: c, shininess: sh, specular: sp});
    const body = M(0x6f767f, 60, 0x666666), dark = M(0x34383f, 40, 0x444444), red = M(0xc23a2a, 60, 0x553333), tank = M(0x8a929e, 90, 0xbbbbbb), brass = M(0xc8a050, 90, 0x886633), strap = M(0x4a3524, 8, 0x111111);
    const add = (geo, m, x, y, z, rx) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); if (rx) o.rotation.x = rx; g.add(o); return o; };
    add(new THREE.BoxGeometry(0.42, 0.5, 0.16), body, 0, 0, 0); add(new THREE.BoxGeometry(0.44, 0.06, 0.18), dark, 0, 0.26, 0); add(new THREE.BoxGeometry(0.44, 0.04, 0.18), dark, 0, -0.24, 0);
    add(new THREE.BoxGeometry(0.12, 0.1, 0.02), red, 0, 0.08, 0.09); add(new THREE.BoxGeometry(0.05, 0.05, 0.02), brass, 0.12, 0.08, 0.09);
    for (const sx of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.085, 0.085, 0.5, 20), tank, sx * 0.17, -0.02, 0.13); add(new THREE.SphereGeometry(0.085, 20, 10, 0, 6.29, 0, 1.58), tank, sx * 0.17, 0.23, 0.13);
      add(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 20), brass, sx * 0.17, 0.12, 0.13); add(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 20), brass, sx * 0.17, -0.16, 0.13);
      add(new THREE.CylinderGeometry(0.06, 0.095, 0.1, 16), dark, sx * 0.17, -0.32, 0.13); add(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 16), M(0xff9a30, 10, 0x000000), sx * 0.17, -0.375, 0.13);
      // shoulder straps over the front
      add(new THREE.BoxGeometry(0.05, 0.5, 0.02), strap, sx * 0.08, 0.0, -0.09);
      add(new THREE.BoxGeometry(0.05, 0.05, 0.03), brass, sx * 0.08, -0.12, -0.1);
    }
    add(new THREE.BoxGeometry(0.42, 0.05, 0.02), strap, 0, -0.18, -0.09);
    return g;
  }
  function make() {
    const id = IT.JETPACK; if (!id) return; const S = 256;
    const r2 = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true}); r2.setPixelRatio(1); r2.setSize(S, S, false); r2.setClearColor(0x000000, 0);
    try { if ('outputColorSpace' in renderer) r2.outputColorSpace = renderer.outputColorSpace; else if ('outputEncoding' in renderer) r2.outputEncoding = renderer.outputEncoding; } catch (_) {}
    const sc = new THREE.Scene(); sc.add(new THREE.AmbientLight(0xffffff, 0.3)); const dl = new THREE.DirectionalLight(0xffffff, 0.75); dl.position.set(-1.5, 2, 3); sc.add(dl); const d2 = new THREE.DirectionalLight(0xbfd8ff, 0.4); d2.position.set(2, -1, 1); sc.add(d2);
    const g = model(); g.rotation.set(0.25, 0.6, 0); sc.add(g); g.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(g), sz = new THREE.Vector3(), c = new THREE.Vector3(); bb.getSize(sz); bb.getCenter(c); const h = Math.max(sz.x, sz.y) * 0.56;
    const cam = new THREE.OrthographicCamera(c.x - h, c.x + h, c.y + h, c.y - h, -10, 10);
    r2.render(sc, cam); ICONS[id] = r2.domElement.toDataURL('image/png'); U.done = true;
    try { r2.dispose(); r2.forceContextLoss(); } catch (_) {} try { renderHotbar(); } catch (_) {}
  }
  U.make = make;
  setTimeout(() => { try { make(); } catch (e) { U.err = String(e); } }, 1500);
})();
