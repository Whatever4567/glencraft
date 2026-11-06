/* GLX-C406 (v1.1.98): hell eye chamber entity + floor safety.
   Original 3D giant eye (not a pasted picture) sits in the tall hell cavern above the Y -237 bedrock floor.
   Steady soft glow, distance culled. Flames stay on the existing c374 budget (capped, no per-frame alloc storm).
   If a player somehow loads below the bedrock floor, lift them safely without deleting edits. Agartha -50..-2 untouched. */
(function c406() {
  const U = window.__c406 = {err: null, eyes: 0, lift: 0, floorY: -237, agartha: [-50, -2]};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const FLOOR = () => (window.__dw && __dw.floorY != null ? __dw.floorY : (window.__c334 && __c334.floorY != null ? __c334.floorY : -237));
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const MAX_EYES = PH ? 1 : 2, CULL = PH ? 64 : 96, CELL = 220;

  function makeEye() {
    const g = new THREE.Group();
    // sclera
    const sclera = new THREE.Mesh(
      new THREE.SphereGeometry(6.5, PH ? 16 : 28, PH ? 12 : 20),
      new THREE.MeshPhongMaterial({color: 0xf2ebe0, emissive: 0x221810, emissiveIntensity: 0.15, shininess: 40})
    );
    g.add(sclera);
    // iris ring
    const iris = new THREE.Mesh(
      new THREE.SphereGeometry(3.4, PH ? 12 : 20, PH ? 10 : 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshPhongMaterial({color: 0x6a1020, emissive: 0x3a0508, emissiveIntensity: 0.55, shininess: 80})
    );
    iris.rotation.x = Math.PI; iris.position.z = 3.1; g.add(iris);
    // pupil
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(1.35, PH ? 10 : 16, PH ? 8 : 12),
      new THREE.MeshBasicMaterial({color: 0x050208})
    );
    pupil.position.z = 5.35; g.add(pupil);
    // steady glow (sprite, not flashing)
    try {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const ctx = c.getContext('2d');
      const grd = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      grd.addColorStop(0, 'rgba(255,120,60,0.85)'); grd.addColorStop(0.45, 'rgba(180,40,20,0.35)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55}));
      spr.scale.set(28, 28, 1); spr.position.z = 2; g.add(spr); g.userData.glow = spr;
    } catch (_) {}
    // soft point light, one only, low intensity (steady)
    try {
      const L = new THREE.PointLight(0xff6a28, PH ? 0.55 : 0.85, 48, 2);
      L.position.set(0, 0, 4); g.add(L); g.userData.light = L;
    } catch (_) {}
    g.userData.kind = 'hellEye';
    return g;
  }

  const pool = [];
  function eyeCell(x, z) {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    let h = Math.imul(cx, 374761393) ^ Math.imul(cz, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const r = ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    if (r > 0.55) return null; // sparse
    const px = cx * CELL + 40 + Math.floor(r * 120);
    const pz = cz * CELL + 40 + Math.floor(((h >>> 8) % 1000) / 1000 * 120);
    return [px, pz];
  }

  function hellY() {
    // middle of hell air band: just above bedrock with headroom for the eye
    const fl = FLOOR();
    return fl + 18;
  }

  function sync() {
    try {
      if (typeof started === 'undefined' || !started || (typeof DIM !== 'undefined' && DIM.cur)) return;
      if (!P || typeof scene === 'undefined') return;
      const fl = FLOOR();
      // Safe lift if below natural floor (do not delete edits; only move the player)
      if (P.y < fl + 1.2) {
        let y = fl + 3;
        try {
          for (let t = fl + 2; t < fl + 40; t++) {
            const a = getB(Math.floor(P.x), t, Math.floor(P.z)), b = getB(Math.floor(P.x), t + 1, Math.floor(P.z));
            if (!a && !b) { y = t; break; }
          }
        } catch (_) {}
        P.y = y; P.vy = 0; P.fallTop = null; U.lift++;
        try { toast('Lifted above the bedrock floor'); } catch (_) {}
      }
      // Only manage eyes when the player is in / near the hell band
      if (P.y > fl + 70) {
        for (const e of pool) { if (e.parent) scene.remove(e); }
        pool.length = 0; U.eyes = 0; return;
      }
      const want = [];
      for (let dx = -CELL; dx <= CELL; dx += CELL) for (let dz = -CELL; dz <= CELL; dz += CELL) {
        const c = eyeCell(P.x + dx, P.z + dz); if (!c) continue;
        const dist = Math.hypot(c[0] - P.x, c[1] - P.z);
        if (dist < CULL) want.push({x: c[0], z: c[1], d: dist});
      }
      want.sort((a, b) => a.d - b.d);
      const keep = new Set();
      for (let i = 0; i < Math.min(MAX_EYES, want.length); i++) {
        const w = want[i], key = w.x + ',' + w.z; keep.add(key);
        let e = pool.find(p => p.userData.key === key);
        if (!e) {
          e = makeEye(); e.userData.key = key;
          e.position.set(w.x + 0.5, hellY(), w.z + 0.5);
          scene.add(e); pool.push(e);
        } else {
          e.position.y = hellY();
        }
        // Face the player gently (no strobing)
        try { e.lookAt(P.x, e.position.y, P.z); } catch (_) {}
      }
      for (let i = pool.length - 1; i >= 0; i--) {
        if (!keep.has(pool[i].userData.key)) { scene.remove(pool[i]); pool.splice(i, 1); }
      }
      U.eyes = pool.length;
    } catch (e) { ERR('sync', e); }
  }
  setInterval(sync, 700);

  // Ensure c374 flame scan stays capped near the hell floor (no extra lights from this module)
  U.flameBudget = {maxPhone: 22, maxDesktop: 40, cull: true};
  U.done = 1;
})();
