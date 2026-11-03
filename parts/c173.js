/* ===================== GLX-C173 (v1.0.33): a crimson cloudy sky over Hell and the black castle zone ===================== */
// one half-sphere of slow, soft crimson and black cloud (a baked noise texture, no fog, no depth write) just inside the sky dome:
// 1 extra draw call, only while you are in Hell or the black castle's red zone
(function c173() {
  const U = window.__c173 = {on: 0, a: 0, err: null};
  let dome = null;
  function tex() { const Wt = 256, Ht = 96, cv = document.createElement('canvas'); cv.width = Wt; cv.height = Ht; const g = cv.getContext('2d'), im = g.createImageData(Wt, Ht);
    const hs = (x, y) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const vn = (x, y, f) => { const x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0, w = q => q * q * (3 - 2 * q), m = a => ((a % f) + f) % f;
      const a = hs(m(x0), y0), b = hs(m(x0 + 1), y0), c = hs(m(x0), y0 + 1), d = hs(m(x0 + 1), y0 + 1); return (a + (b - a) * w(tx)) * (1 - w(ty)) + (c + (d - c) * w(tx)) * w(ty); };
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) { const u = x / Wt, v = y / Ht;   // v 0 = top of the dome, 1 = horizon
      let n = 0, A = 0.5, F = 6; for (let o = 0; o < 5; o++) { n += A * vn(u * F, v * F * 0.45 + o * 3.1, F); A *= 0.5; F *= 2; }
      const lit = Math.max(0, Math.min(1, (n - 0.45) * 3)), dk = Math.max(0, Math.min(1, (0.5 - n) * 3)), o = (y * Wt + x) * 4, fade = Math.min(1, (1 - v) * 2.2);
      // glowing red-orange cloud tops, near-black cloud bellies, deep crimson between
      im.data[o] = 70 + lit * 150 - dk * 55; im.data[o + 1] = 8 + lit * 42 - dk * 6; im.data[o + 2] = 8 + lit * 18 - dk * 6;
      im.data[o + 3] = Math.max(0, Math.min(255, (0.45 + lit * 0.45 + dk * 0.35) * fade * 255)); }
    g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; return t; }
  function make() { const geo = new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const m = new THREE.MeshBasicMaterial({map: tex(), transparent: true, depthWrite: false, fog: false, side: THREE.BackSide, opacity: 0});
    dome = new THREE.Mesh(geo, m); dome.renderOrder = -5; dome.frustumCulled = false; dome.visible = false; scene.add(dome); }
  let a = 0;
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments);
    try { if (!dome) make(); const hell = typeof DIM !== 'undefined' && DIM.cur === 'hell', k = hell ? 1 : (!DIM.cur && window.__c162 ? __c162.k : 0);
      a = k; U.a = Math.round(k * 100) / 100; dome.visible = k > 0.01 && started; U.on = dome.visible ? 1 : 0;
      if (dome.visible) { const R = camera.far * 0.74; dome.scale.set(R, R * 0.42, R); dome.position.copy(camera.position); dome.position.y -= R * 0.05;
        dome.rotation.y = performance.now() / 1000 * 0.004; const dl = hell ? 1 : 0.35 + 0.65 * Math.max(0, Math.min(1, daylight));
        dome.material.opacity = k * (hell ? 0.95 : 0.85); dome.material.color.setRGB(dl, dl, dl); } } catch (e) { U.err = String(e); }
    return r; };
})();
