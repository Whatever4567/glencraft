/* ===================== GLX-C249 (v1.0.60): planets in the night sky - NASA public-domain images of Jupiter (Pioneer and Hubble), Neptune (Voyager, false colour)
   and the Hourglass Nebula (Hubble) as soft additive billboards that fade in at dusk, out at dawn, and wheel slowly across the sky with the stars. Green in Matrix mode. ===================== */
(function c249() {
  const U = window.__c249 = {err: null, vis: 0, op: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ': ' + (e && e.message || e); };
  // [file, azimuth, elevation, size, brightness, spin]
  // v1.1.94: the red ring nebula is gone. Each planet sits low over a castle, the way you would see it from the middle of the map:
  // the blue planet over the black castle, the banded Jupiter over the people castle and the pale planet over the mossy skeleton castle
  const CAZ = k => { try { const c = g9castles.find(q => q[0] === k); if (c) return Math.atan2(c[1] - (W >> 1), c[2] - (D >> 1)); } catch (_) {} return null; };
  const DEF = [['neptune', 'black', 0.42, 8, 0.95, -0.004], ['jupiter', 'human', 0.38, 10, 1, 0.004], ['jupiter2', 'mossy', 0.4, 8, 0.85, 0.003]];
  const grp = new THREE.Group(), items = [], V = new THREE.Vector3(), GREEN = new THREE.Color(0.35, 1, 0.45), WHITE = new THREE.Color(1, 1, 1);
  try { const L = new THREE.TextureLoader();
    for (const [f, ck, el, sz, br, sp] of DEF) { const az = 0; const m = new THREE.SpriteMaterial({map: null, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, opacity: 0});
      const s = new THREE.Sprite(m); s.scale.set(sz, sz, 1); s.renderOrder = -5; s.frustumCulled = false; grp.add(s);
      (window.__AM=window.__AM||(f=>{const w=()=>(typeof screen==='string'&&screen!=='boot')?setTimeout(f,400):setTimeout(w,150);w();}))(() => { m.map = L.load('assets/sky/' + f + '.png'); m.needsUpdate = true; }); items.push({s, m, br, sp, ck, el, d: new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az))}); }
    grp.visible = false; grp.name = "planets"; scene.add(grp); } catch (e) { ERR('init', e); }
  const AX = new THREE.Vector3(0, 1, 0);
  function frame() { if (!started || (typeof DIM !== 'undefined' && DIM.cur)) { grp.visible = false; U.vis = 0; return; }
    const night = 1 - (typeof daylight === 'number' ? daylight : 1), k = Math.max(0, Math.min(1, (night - 0.35) / 0.4)); U.op = +k.toFixed(2);
    if (k <= 0.01) { grp.visible = false; U.vis = 0; return; } grp.visible = true; U.vis = 1;
    const ang = (typeof dayClock === 'number' && typeof CYCLE === 'number') ? dayClock / CYCLE * 6.283 : 0, mx = !!(window.__c244 && __c244.on), c = camera.position;
    for (const it of items) { { const az = CAZ(it.ck); if (az !== null) it.d.set(Math.cos(it.el) * Math.sin(az), Math.sin(it.el), Math.cos(it.el) * Math.cos(az)); } V.copy(it.d); it.s.position.set(c.x + V.x * 85, c.y + V.y * 85, c.z + V.z * 85);
      it.m.rotation += it.sp * 0.016; it.m.opacity = k * it.br; it.m.color.copy(mx ? GREEN : WHITE); } }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { frame(); } catch (e) { ERR('fr', e); } return r; };
  U.grp = grp;
})();
