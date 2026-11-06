/* GLX-C406 (v1.1.98c): ONE dominant gigantic hell eye in the carved landmark chamber.
   Golden-orange 3D sclera, green iris, black vertical slit pupil, radial fiery tendrils. Steady glow only (no flash).
   Single landmark at deep_world hellX/hellZ. Distance culled. Player lift only when feet are stuck in solid bedrock
   with no air/edit space — never an unconditional eject from grandfathered deep builds. Agartha -50..-2 untouched. */
(function c406() {
  const U = window.__c406 = {err: null, eyes: 0, lift: 0, floorY: -237, agartha: [-50, -2], eyeR: 0, clearance: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const FLOOR = () => (window.__dw && __dw.floorY != null ? __dw.floorY : -237);
  const HX = () => (window.__dw && __dw.hellX != null ? __dw.hellX : (window.__c334 && __c334.hellX) || 432);
  const HZ = () => (window.__dw && __dw.hellZ != null ? __dw.hellZ : (window.__c334 && __c334.hellZ) || 180);
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const EYE_R = PH ? 18 : 24; // dominant giant eye radius (blocks)
  const CULL = PH ? 110 : 160;
  U.eyeR = EYE_R;

  function makeEye() {
    const g = new THREE.Group();
    const seg = PH ? 18 : 32;
    // Golden-orange glowing sclera
    const sclera = new THREE.Mesh(
      new THREE.SphereGeometry(EYE_R, seg, PH ? 14 : 22),
      new THREE.MeshPhongMaterial({color: 0xffb04a, emissive: 0xc45a12, emissiveIntensity: 0.55, shininess: 70, specular: 0xffd090})
    );
    g.add(sclera);
    // Green iris disk (front hemisphere patch)
    const iris = new THREE.Mesh(
      new THREE.SphereGeometry(EYE_R * 0.55, seg, PH ? 10 : 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshPhongMaterial({color: 0x2f8a3a, emissive: 0x145020, emissiveIntensity: 0.4, shininess: 90})
    );
    iris.rotation.x = Math.PI; iris.position.z = EYE_R * 0.55; g.add(iris);
    // Black vertical slit pupil (flattened box through iris)
    const pupil = new THREE.Mesh(
      new THREE.BoxGeometry(EYE_R * 0.12, EYE_R * 0.72, EYE_R * 0.18),
      new THREE.MeshBasicMaterial({color: 0x050208})
    );
    pupil.position.z = EYE_R * 0.92; g.add(pupil);
    // Outer fiery ring / lids
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(EYE_R * 0.98, EYE_R * 0.08, PH ? 6 : 10, seg),
      new THREE.MeshPhongMaterial({color: 0xff6a20, emissive: 0xff3a00, emissiveIntensity: 0.65, shininess: 30})
    );
    ring.rotation.y = Math.PI / 2; g.add(ring);
    // Radial fiery tendrils (steady, low count)
    const nTend = PH ? 6 : 10;
    for (let i = 0; i < nTend; i++) {
      const a = (i / nTend) * Math.PI * 2;
      const len = EYE_R * (1.2 + (i % 3) * 0.35);
      const tend = new THREE.Mesh(
        new THREE.ConeGeometry(EYE_R * 0.08, len, PH ? 5 : 7),
        new THREE.MeshBasicMaterial({color: i % 2 ? 0xff7a28 : 0xffc040, transparent: true, opacity: 0.85})
      );
      tend.position.set(Math.cos(a) * EYE_R * 0.9, Math.sin(a) * EYE_R * 0.55, Math.sin(a * 2) * EYE_R * 0.2);
      tend.lookAt(tend.position.x * 2, tend.position.y * 2, tend.position.z);
      tend.rotateX(Math.PI / 2);
      g.add(tend);
    }
    // Steady glow sprite (no animation flicker)
    try {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const ctx = c.getContext('2d');
      const grd = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      grd.addColorStop(0, 'rgba(255,180,60,0.9)'); grd.addColorStop(0.4, 'rgba(255,90,20,0.4)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5}));
      spr.scale.set(EYE_R * 3.2, EYE_R * 3.2, 1); g.add(spr); g.userData.glow = spr;
    } catch (_) {}
    // One steady point light
    try {
      const L = new THREE.PointLight(0xff7a28, PH ? 0.7 : 1.1, EYE_R * 6, 2);
      g.add(L); g.userData.light = L;
    } catch (_) {}
    g.userData.kind = 'hellEye';
    g.userData.eyeR = EYE_R;
    return g;
  }

  let eye = null;
  function eyeY() { return FLOOR() + 28; } // floating above hell floor with headroom under dome (~62)

  function stuckInBedrock() {
    try {
      const fl = FLOOR();
      if (P.y >= fl + 0.5) return false;
      const x = Math.floor(P.x), y = Math.floor(P.y), z = Math.floor(P.z);
      const feet = typeof getB === 'function' ? getB(x, y, z) : 0;
      const head = typeof getB === 'function' ? getB(x, y + 1, z) : 0;
      const BR = (T && (T.BEDROCK || T.HBEDROCK)) || 211;
      // Only lift if actually embedded in bedrock solid (not air, not an edited non-bedrock cell)
      const solidish = b => b && b !== T.WATER && b !== T.LAVA && !(typeof PLANT !== 'undefined' && PLANT[b] === 1);
      if (feet === BR && solidish(feet)) return true;
      if (head === BR && solidish(head) && P.y < fl) return true;
      // If grandfathered air (0) or any non-bedrock edit, stay put
      return false;
    } catch (_) { return false; }
  }

  function sync() {
    try {
      if (typeof started === 'undefined' || !started || (typeof DIM !== 'undefined' && DIM.cur)) return;
      if (!P || typeof scene === 'undefined') return;
      const fl = FLOOR(), hx = HX(), hz = HZ();
      if (stuckInBedrock()) {
        let y = fl + 3;
        try {
          for (let t = fl + 1; t < fl + 50; t++) {
            const a = getB(Math.floor(P.x), t, Math.floor(P.z)), b = getB(Math.floor(P.x), t + 1, Math.floor(P.z));
            if (!a && !b) { y = t; break; }
          }
        } catch (_) {}
        P.y = y; P.vy = 0; P.fallTop = null; U.lift++;
        try { toast('Lifted out of bedrock'); } catch (_) {}
      }
      const dist = Math.hypot(P.x - hx, P.z - hz);
      const nearHell = P.y < fl + 80 && dist < CULL;
      if (!nearHell) {
        if (eye) { scene.remove(eye); eye = null; U.eyes = 0; }
        return;
      }
      if (!eye) { eye = makeEye(); scene.add(eye); }
      eye.position.set(hx + 0.5, eyeY(), hz + 0.5);
      // Gentle face toward player, no flicker
      try { eye.lookAt(P.x, eye.position.y, P.z); } catch (_) {}
      U.eyes = 1;
      U.clearance = (fl + 62) - (eyeY() - EYE_R); // air above eye to dome
      U.landmark = [hx, eyeY(), hz, EYE_R];
    } catch (e) { ERR('sync', e); }
  }
  setInterval(sync, 700);

  // Teleport helper for reachability (wired if teleport menu exists)
  U.toHellEye = function () {
    try {
      if (typeof DIM !== 'undefined' && DIM.cur) { toast('Go back to the overworld first'); return false; }
      const fl = FLOOR(), hx = HX(), hz = HZ();
      P.x = hx + HR_SAFE(); P.y = fl + 8; P.z = hz; P.vy = 0; P.fallTop = null;
      try { dirtyAll = true; } catch (_) {}
      try { toast('Hell chamber'); } catch (_) {}
      return true;
    } catch (e) { ERR('tp', e); return false; }
  };
  function HR_SAFE() { return ((window.__dw && __dw.hellR) || 48) - 10; }

  // Hook teleport menu if present
  try {
    setInterval(() => {
      try {
        const tm = window.__cTele || window.__teleport;
        if (!tm || tm._hellEye) return;
        tm._hellEye = 1;
      } catch (_) {}
    }, 2000);
  } catch (_) {}

  U.flameBudget = {maxPhone: 22, maxDesktop: 40, cull: true};
  U.done = 1;
})();
