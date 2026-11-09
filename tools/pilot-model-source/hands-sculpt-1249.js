/* v1.2.49 hands-sculpt: richer first-person anatomy on the existing
   __fpa pivots (knuckles, nails, palm pads, cloth-like linen). Does not
   replace the animation rig. Items keep their authored grips. */
(function handsSculpt1249(W) {
  const U = W.__hands1249 = {on: 0, err: null, version: '1.2.49'};
  const T = W.THREE;
  if (!T) return;
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  function tex(sz, fn) {
    const c = document.createElement('canvas'); c.width = c.height = sz;
    const g = c.getContext('2d'); fn(g, c);
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }
  function skinTex() {
    return tex(256, (g) => {
      const grd = g.createLinearGradient(0, 0, 256, 256);
      grd.addColorStop(0, '#e0b08a'); grd.addColorStop(0.45, '#d4a07a'); grd.addColorStop(1, '#c48a68');
      g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 1800; i++) {
        const v = 160 + Math.random() * 50 | 0;
        g.fillStyle = `rgba(${v},${v - 40},${v - 70},${0.06 + Math.random() * 0.08})`;
        g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1);
      }
      // faint palmar / knuckle warmth
      g.fillStyle = 'rgba(180,70,50,0.07)';
      g.beginPath(); g.ellipse(80, 160, 50, 30, 0.3, 0, 7); g.fill();
      g.beginPath(); g.ellipse(180, 90, 40, 22, -0.2, 0, 7); g.fill();
    });
  }
  function linenTex() {
    return tex(256, (g) => {
      g.fillStyle = '#efe8dc'; g.fillRect(0, 0, 256, 256);
      // warp / weft
      for (let y = 0; y < 256; y += 2) {
        g.fillStyle = y % 4 === 0 ? 'rgba(120,100,80,0.16)' : 'rgba(255,250,240,0.12)';
        g.fillRect(0, y, 256, 1);
      }
      for (let x = 0; x < 256; x += 2) {
        g.fillStyle = x % 4 === 0 ? 'rgba(100,85,70,0.12)' : 'rgba(255,252,245,0.08)';
        g.fillRect(x, 0, 1, 256);
      }
      // slubs and folds
      for (let i = 0; i < 40; i++) {
        g.strokeStyle = `rgba(90,70,50,${0.08 + Math.random() * 0.1})`;
        g.lineWidth = 1 + Math.random() * 2;
        g.beginPath();
        const x = Math.random() * 256, y = Math.random() * 256;
        g.moveTo(x, y); g.quadraticCurveTo(x + 20, y + 40, x - 10, y + 80);
        g.stroke();
      }
    });
  }

  const SKIN_MAP = skinTex();
  const LINEN_MAP = linenTex();
  LINEN_MAP.repeat.set(2, 3);

  function skinMat() {
    return new T.MeshPhongMaterial({
      color: 0xd8a886, map: SKIN_MAP, shininess: 18, specular: 0x332820
    });
  }
  function linenMat() {
    return new T.MeshPhongMaterial({
      color: 0xf2ece3, map: LINEN_MAP, shininess: 8, specular: 0x222222
    });
  }
  function nailMat() {
    return new T.MeshPhongMaterial({
      color: 0xf3e2d4, shininess: 70, specular: 0x886655
    });
  }

  function foldCloth(mesh, amount) {
    if (!mesh || !mesh.geometry) return;
    const g = mesh.geometry;
    const p = g.attributes.position;
    if (!p) return;
    // In-place wrinkle: circumferential sine + a couple of length-wise folds.
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x), r = Math.hypot(x, z) || 1e-6;
      const wr = 1 + amount * (0.045 * Math.sin(a * 6 + y * 28) + 0.03 * Math.sin(a * 11 - y * 16) + 0.02 * Math.sin(y * 40));
      p.setX(i, x / r * r * wr);
      p.setZ(i, z / r * r * wr);
    }
    p.needsUpdate = true;
    g.computeVertexNormals();
  }

  function addNail(parent, y, sideR) {
    const n = new T.Mesh(new T.BoxGeometry(sideR * 1.15, 0.0055, sideR * 0.85, 2, 1, 2), nailMat());
    // Flatten the front slightly so it reads as a nail plate on the finger back.
    n.position.set(0, y, sideR * 0.55);
    n.rotation.x = -0.15;
    n.userData.nail1249 = 1;
    parent.add(n);
    return n;
  }

  function pad(mat, rx, ry, rz) {
    const m = new T.Mesh(new T.SphereGeometry(1, 10, 8), mat);
    m.scale.set(rx, ry, rz);
    return m;
  }

  function upgradeHand(h, side) {
    if (!h || h.userData.sculpt1249) return;
    h.userData.sculpt1249 = 1;
    const sm = skinMat();
    h.traverse(o => {
      if (o.isMesh && o.material && !o.userData.nail1249) {
        const n = (o.material && o.material.color && o.material.color.getHex()) || 0;
        // Leave shirt/cuff materials alone; retarget skin-like meshes.
        if (!o.material.map || n > 0x800000) {
          if (!o.parent || !/cuff|shirt|up/i.test(o.name || '')) o.material = sm;
        }
      }
    });
    // Thenar (thumb) and hypothenar pads, palmar bulge.
    const thenar = pad(sm, 0.016, 0.012, 0.01);
    thenar.position.set(side * 0.02, 0.032, 0.008);
    h.add(thenar);
    const hypo = pad(sm, 0.012, 0.01, 0.009);
    hypo.position.set(-side * 0.02, 0.03, 0.006);
    h.add(hypo);
    const palmPad = pad(sm, 0.02, 0.012, 0.007);
    palmPad.position.set(0, 0.052, 0.009);
    h.add(palmPad);
    // Nails on distal finger tips and thumb.
    const fingers = h.userData.f || [];
    for (let i = 0; i < fingers.length; i++) {
      const k = fingers[i] && fingers[i][1];
      const d = k && k.userData && k.userData.d;
      if (d) addNail(d, 0.012, 0.0042);
    }
    const th = h.userData.th;
    const td = th && th.userData && th.userData.k && th.userData.k.userData && th.userData.k.userData.d;
    if (td) addNail(td, 0.013, 0.005);
  }

  function upgradeArm(arm) {
    if (!arm || !arm.userData || !arm.userData.p) return;
    const p = arm.userData.p;
    const lm = linenMat();
    if (p.up) { p.up.material = lm; foldCloth(p.up, 1); }
    if (p.el && p.el.material) p.el.material = lm;
    if (p.cuff) { p.cuff.material = lm; foldCloth(p.cuff, 1.35); }
    if (p.h) upgradeHand(p.h, arm.userData.side || 1);
  }

  function apply() {
    try {
      const fpa = W.__fpa;
      const rig = fpa && (typeof fpa.rig === 'function' ? fpa.rig() : fpa.g);
      if (!rig) return false;
      if (rig.userData && rig.userData.sculpt1249) { U.on = 1; return true; }
      if (rig.userData.R) upgradeArm(rig.userData.R);
      if (rig.userData.L) upgradeArm(rig.userData.L);
      if (rig.userData) rig.userData.sculpt1249 = 1;
      U.on = 1;
      return true;
    } catch (e) { ERR('apply', e); return false; }
  }

  let n = 0;
  const boot = setInterval(function () {
    n++;
    if (apply() || n > 80) clearInterval(boot);
  }, 120);
  W.addEventListener && W.addEventListener('load', apply);
})(typeof window !== 'undefined' ? window : this);
