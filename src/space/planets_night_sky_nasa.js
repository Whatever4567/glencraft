/* ===================== GLX-C249 (v1.0.60): planets in the night sky - NASA public-domain images of Jupiter (Pioneer and Hubble), Neptune (Voyager, false colour)
   and the Hourglass Nebula (Hubble) as soft additive billboards that fade in at dusk, out at dawn, and wheel slowly across the sky with the stars. Green in Matrix mode. ===================== */
(function c249() {
  const U = window.__c249 = {err: null, vis: 0, op: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ': ' + (e && e.message || e); };
  // [file, azimuth, elevation, size, brightness, spin]
  const DEF = [['nebula', 0, 0.85, 26, 0.55, 0.004], ['jupiter', 0.22, 0.5, 9, 1, 0.01], ['neptune', -0.22, 0.55, 6.5, 0.95, -0.012], ['jupiter2', 0.08, 1.12, 7.5, 0.85, 0.008]]; // v1.0.62: all four in one band of sky so you see them together
  const grp = new THREE.Group(), items = [], V = new THREE.Vector3(), GREEN = new THREE.Color(0.35, 1, 0.45), WHITE = new THREE.Color(1, 1, 1);
  try { const L = new THREE.TextureLoader();
    for (const [f, az, el, sz, br, sp] of DEF) { const m = new THREE.SpriteMaterial({map: null, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0});
      const s = new THREE.Sprite(m); s.scale.set(sz, sz, 1); s.renderOrder = -5; s.frustumCulled = false; grp.add(s);
      (window.__AM=window.__AM||(f=>{const w=()=>(typeof screen==='string'&&screen!=='boot')?setTimeout(f,400):setTimeout(w,150);w();}))(() => { m.map = L.load('assets/sky/' + f + '.png'); m.needsUpdate = true; }); items.push({s, m, br, sp, d: new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az))}); }
    grp.visible = false; scene.add(grp); } catch (e) { ERR('init', e); }
  const AX = new THREE.Vector3(0, 1, 0);
  function frame() { if (!started || (typeof DIM !== 'undefined' && DIM.cur)) { grp.visible = false; U.vis = 0; return; }
    const night = 1 - (typeof daylight === 'number' ? daylight : 1), k = Math.max(0, Math.min(1, (night - 0.35) / 0.4)); U.op = +k.toFixed(2);
    if (k <= 0.01) { grp.visible = false; U.vis = 0; return; } grp.visible = true; U.vis = 1;
    const ang = (typeof dayClock === 'number' && typeof CYCLE === 'number') ? dayClock / CYCLE * 6.283 : 0, mx = !!(window.__c244 && __c244.on), c = camera.position;
    for (const it of items) { V.copy(it.d).applyAxisAngle(AX, ang * 0.35 + 2.2); it.s.position.set(c.x + V.x * 85, c.y + V.y * 85, c.z + V.z * 85);
      it.m.rotation += it.sp * 0.016; it.m.opacity = k * it.br; it.m.color.copy(mx ? GREEN : WHITE); } }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { frame(); } catch (e) { ERR('fr', e); } return r; };
  U.grp = grp;
})();
