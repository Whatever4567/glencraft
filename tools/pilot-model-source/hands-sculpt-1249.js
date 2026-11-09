/* v1.2.49 hands-sculpt: replace sausage finger/palm meshes with sculpted
   anatomy on the existing __fpa pivots (knuckles, tapered jointed fingers,
   thenar pad, nails, forearm taper, linen folds). Animation drivers stay
   untouched. Retexture/harden are hooked so paint cannot strip the sculpt. */
(function handsSculpt1249(W) {
  const U = W.__hands1249 = {on: 0, err: null, version: '1.2.49', sculpted: 0};
  const T = W.THREE;
  if (!T) return;
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  const GEO = {};
  function geoKey() { return Array.prototype.join.call(arguments, ','); }
  function share(key, build) {
    if (!GEO[key]) GEO[key] = build();
    return GEO[key];
  }

  function tex(w, h, fn) {
    const c = document.createElement('canvas'); c.width = w; c.height = h || w;
    const g = c.getContext('2d'); fn(g, c);
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }
  function skinTex() {
    return tex(512, 512, (g) => {
      const grd = g.createLinearGradient(0, 0, 512, 512);
      grd.addColorStop(0, '#e8bc9a');
      grd.addColorStop(0.4, '#e0b08a');
      grd.addColorStop(0.7, '#d4a07a');
      grd.addColorStop(1, '#c48a68');
      g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 3000; i++) {
        const v = 150 + Math.random() * 70 | 0;
        g.fillStyle = 'rgba(' + v + ',' + (v - 45) + ',' + (v - 75) + ',' + (0.04 + Math.random() * 0.07) + ')';
        g.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2, 1);
      }
      // pores
      for (let i = 0; i < 1200; i++) {
        g.fillStyle = 'rgba(90,50,30,' + (0.04 + Math.random() * 0.06) + ')';
        g.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
      }
      // warmth / blood
      g.fillStyle = 'rgba(180,70,50,0.10)';
      g.beginPath(); g.ellipse(160, 300, 90, 50, 0.3, 0, 7); g.fill();
      g.beginPath(); g.ellipse(360, 180, 70, 40, -0.2, 0, 7); g.fill();
      // faint crease lines
      g.strokeStyle = 'rgba(120,70,50,0.12)'; g.lineWidth = 1.2;
      for (let i = 0; i < 14; i++) {
        g.beginPath();
        const x = 40 + Math.random() * 400, y = 40 + Math.random() * 400;
        g.moveTo(x, y); g.quadraticCurveTo(x + 40, y + 10, x + 80, y - 6);
        g.stroke();
      }
    });
  }
  function skinBump() {
    return tex(512, 512, (g) => {
      g.fillStyle = '#808080'; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 3500; i++) {
        const v = 118 + Math.random() * 22 | 0;
        g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
        g.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 1.5, 1);
      }
      g.strokeStyle = 'rgba(70,70,70,0.35)'; g.lineWidth = 1;
      for (let i = 0; i < 40; i++) {
        g.beginPath();
        const x = Math.random() * 512, y = Math.random() * 512;
        g.moveTo(x, y); g.quadraticCurveTo(x + 30, y + 20, x + 70, y);
        g.stroke();
      }
    });
  }
  function linenTex() {
    return tex(512, 512, (g) => {
      g.fillStyle = '#efe8dc'; g.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 512; y += 2) {
        g.fillStyle = y % 4 === 0 ? 'rgba(120,100,80,0.16)' : 'rgba(255,250,240,0.14)';
        g.fillRect(0, y, 512, 1);
      }
      for (let x = 0; x < 512; x += 2) {
        g.fillStyle = x % 4 === 0 ? 'rgba(100,85,70,0.12)' : 'rgba(255,252,245,0.10)';
        g.fillRect(x, 0, 1, 512);
      }
      for (let i = 0; i < 18; i++) {
        g.strokeStyle = 'rgba(90,70,50,' + (0.04 + Math.random() * 0.06) + ')';
        g.lineWidth = 1;
        g.beginPath();
        const x = Math.random() * 512, y = Math.random() * 512;
        g.moveTo(x, y); g.quadraticCurveTo(x + 20, y + 40, x - 8, y + 80);
        g.stroke();
      }
    });
  }

  function skinTexFp() {
    return tex(512, 512, (g) => {
      const grd = g.createLinearGradient(0, 0, 512, 512);
      grd.addColorStop(0, '#e4c4ae');
      grd.addColorStop(0.35, '#d5a88c');
      grd.addColorStop(0.7, '#c48c70');
      grd.addColorStop(1, '#a8725a');
      g.fillStyle = grd; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 2800; i++) {
        const v = 140 + Math.random() * 50 | 0;
        g.fillStyle = 'rgba(' + v + ',' + (v - 30) + ',' + (v - 42) + ',' + (0.05 + Math.random() * 0.06) + ')';
        g.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2, 1);
      }
      for (let i = 0; i < 1000; i++) {
        g.fillStyle = 'rgba(80,55,40,' + (0.04 + Math.random() * 0.05) + ')';
        g.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
      }
      g.strokeStyle = 'rgba(90,60,45,0.16)'; g.lineWidth = 1.3;
      for (let i = 0; i < 18; i++) {
        g.beginPath();
        const x = 30 + Math.random() * 420, y = 30 + Math.random() * 420;
        g.moveTo(x, y); g.quadraticCurveTo(x + 36, y + 8, x + 72, y - 5);
        g.stroke();
      }
    });
  }
  const SKIN_MAP = skinTex();
  const SKIN_MAP_FP = skinTexFp();
  const SKIN_BUMP = skinBump();
  const LINEN_MAP = linenTex();
  LINEN_MAP.repeat.set(2, 3);
  U.SKIN_MAP = SKIN_MAP; U.SKIN_BUMP = SKIN_BUMP; U.LINEN_MAP = LINEN_MAP;

  function skinMat() {
    const m = new T.MeshPhongMaterial({
      color: 0xe2b494, map: SKIN_MAP, bumpMap: SKIN_BUMP, bumpScale: 0.06,
      shininess: 28, specular: 0x6a4838
    });
    m.userData.sculptKeep = 1;
    return m;
  }
  function linenMat() {
    const m = new T.MeshPhongMaterial({
      color: 0xf4efe6, map: LINEN_MAP, bumpMap: LINEN_MAP, bumpScale: 0.18,
      shininess: 6, specular: 0x222222
    });
    m.userData.sculptKeep = 1;
    return m;
  }
  U.linenMat = linenMat;
  function knuckleMatFp() {
    const m = new T.MeshPhongMaterial({
      color: 0xd4a090, map: SKIN_MAP_FP, bumpMap: SKIN_BUMP, bumpScale: 0.05,
      shininess: 22, specular: 0x5a3a32
    });
    m.userData.sculptKeep = 1;
    m.userData.knuckleFp1263 = 1;
    return m;
  }
  function skinMatFp() {
    // 0xc6b399 was the 1262 desaturated tan; 1263 is a warmer, more saturated mid.
    const m = new T.MeshPhongMaterial({
      color: 0xd2a07c, map: SKIN_MAP_FP, bumpMap: SKIN_BUMP, bumpScale: 0.045,
      shininess: 18, specular: 0x5a3c30
    });
    m.userData.sculptKeep = 1;
    m.userData.skinFp1262 = 1;
    return m;
  }
  function linenMatFp() {
    const m = new T.MeshPhongMaterial({
      color: 0xe8e2d6, map: LINEN_MAP, bumpMap: LINEN_MAP, bumpScale: 0.28,
      shininess: 4, specular: 0x1a1814
    });
    m.userData.sculptKeep = 1;
    m.userData.linenFp1262 = 1;
    return m;
  }
  U.skinMatFp = skinMatFp;
  U.knuckleMatFp = knuckleMatFp;
  U.linenMatFp = linenMatFp;
  function tartanTex() {
    if (U._tartan) return U._tartan;
    U._tartan = tex(256, 256, (g) => {
      g.fillStyle = '#1c3a24'; g.fillRect(0, 0, 256, 256);
      const cols = ['#1c3a24', '#245c38', '#0c1a20', '#7a1c28', '#d8d0c0'];
      for (let i = 0; i < 16; i++) {
        const x = i * 16;
        g.fillStyle = cols[i % cols.length];
        g.fillRect(x, 0, (i % 4 === 0 ? 5 : 2), 256);
        g.fillRect(0, x, 256, (i % 4 === 0 ? 5 : 2));
      }
    });
    return U._tartan;
  }
  function tartanMat() {
    const m = new T.MeshPhongMaterial({
      color: 0xffffff, map: tartanTex(), bumpMap: tartanTex(), bumpScale: 0.12,
      shininess: 8, specular: 0x222222
    });
    m.userData.sculptKeep = 1;
    m.userData.tartan1251 = 1;
    return m;
  }
  U.tartanMat = tartanMat;
  function nailMat() {
    const m = new T.MeshPhongMaterial({
      color: 0xedd3c4, shininess: 55, specular: 0x886655
    });
    m.userData.nail1249 = 1;
    m.userData.sculptKeep = 1;
    return m;
  }

  // Tapered oval capsule along +Y from 0..len, squashed in Z (palmar/dorsal).
  function fingerSegGeo(len, r0, r1, ovalZ, segs, rad, knuckle) {
    const key = geoKey('fseg', len, r0, r1, ovalZ, segs, rad, knuckle);
    return share(key, function () {
      segs = segs || 8; rad = rad || 10;
      const pos = [], nrm = [], uv = [], ix = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs, y = t * len;
        let r = r0 + (r1 - r0) * Math.pow(t, 0.85);
        if (knuckle && t < 0.18) r *= 1 + 0.12 * (1 - t / 0.18) * Math.sin((1 - t / 0.18) * Math.PI);
        // slight belly on the palmar mid-section
        if (t > 0.25 && t < 0.8) r *= 1.04;
        for (let k = 0; k < rad; k++) {
          const a = (k / rad) * Math.PI * 2;
          const ox = Math.cos(a), oz = Math.sin(a) * (ovalZ || 0.72);
          pos.push(ox * r, y, oz * r);
          const n = new T.Vector3(ox, 0, oz).normalize();
          nrm.push(n.x, n.y, n.z);
          uv.push(k / rad, t);
        }
      }
      // tip cap
      const tip = pos.length / 3;
      pos.push(0, len + r1 * 0.7, 0); nrm.push(0, 1, 0); uv.push(0.5, 1);
      for (let i = 0; i < segs; i++) {
        for (let k = 0; k < rad; k++) {
          const a = i * rad + k, b = i * rad + (k + 1) % rad;
          const c = (i + 1) * rad + k, d = (i + 1) * rad + (k + 1) % rad;
          ix.push(a, c, b, b, c, d);
        }
      }
      const base = segs * rad;
      for (let k = 0; k < rad; k++) ix.push(base + k, base + (k + 1) % rad, tip);
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      geo.setIndex(ix);
      geo.computeVertexNormals();
      return geo;
    });
  }
  function knuckleGeo(r) {
    return share(geoKey('kns', r), function () {
      const g = new T.SphereGeometry(r, 16, 14);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i), z = p.getZ(i);
        p.setZ(i, z * 0.48);
        if (y > 0) p.setY(i, y * 0.55);
        p.setX(i, p.getX(i) * 0.92);
      }
      g.computeVertexNormals();
      return g;
    });
  }
  function creaseMat() {
    const m = new T.MeshPhongMaterial({
      color: 0x7a5c4a, shininess: 6, specular: 0x2a1c14
    });
    m.userData.sculptKeep = 1;
    m.userData.crease1262 = 1;
    return m;
  }
  function creaseRing(parent, y, r, mat) {
    const m = new T.Mesh(new T.TorusGeometry(Math.max(0.002, r * 0.90), Math.max(0.0006, r * 0.14), 6, 14), mat);
    m.rotation.x = Math.PI / 2;
    m.position.set(0, y, 0);
    mark(m);
    parent.add(m);
    return m;
  }
  function palmGeo() {
    return share('palm1263', function () {
      const g = new T.BoxGeometry(0.070, 0.10, 0.030, 12, 12, 8);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const yn = (y + 0.05) / 0.10; // 0 bottom (wrist) .. 1 top (fingers)
        const xn = x / 0.035;
        const zn = z / 0.015;
        // Stronger side rounding so it does not read as a box.
        const side = 1 - 0.32 * xn * xn;
        const wrist = 1 - 0.26 * (1 - yn) * (1 - yn);
        const distal = 1 - 0.10 * Math.max(0, yn - 0.82) / 0.18;
        x *= side * wrist * distal;
        z *= (1 - Math.abs(xn) * 0.48) * (1 - 0.12 * (1 - yn) * (1 - yn));
        // Round the dorsal / palmar "corners" of the box.
        const edge = Math.max(0, Math.abs(zn) - 0.55) / 0.45;
        x *= 1 - 0.12 * edge * edge;
        if (z < 0) z *= 0.78 + 0.18 * (1 - yn);
        if (yn > 0.82 && z > 0) z += 0.002;
        p.setXYZ(i, x, y, z);
      }
      g.computeVertexNormals();
      // Drop the BoxGeometry type tag so leftover-dirt filters cannot hide the palm.
      const out = g.toNonIndexed ? g.clone() : g;
      out.type = 'BufferGeometry';
      return out;
    });
  }
  function nailGeo(w, h, d) {
    return share(geoKey('nail', w, h, d), function () {
      const g = new T.BoxGeometry(w, h, d, 3, 2, 2);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i), z = p.getZ(i);
        // curve the plate slightly and taper the free edge ( +Y )
        if (y > 0) p.setX(i, p.getX(i) * 0.88);
        p.setZ(i, z + y * y * 18);
      }
      g.computeVertexNormals();
      return g;
    });
  }

  function foldCloth(mesh, amount) {
    if (!mesh || !mesh.geometry) return;
    if (mesh.userData.folded1249) return;
    const g = mesh.geometry.clone();
    const p = g.attributes.position;
    if (!p) return;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x), r = Math.hypot(x, z) || 1e-6;
      const wr = 1 + amount * (0.06 * Math.sin(a * 6 + y * 28) + 0.04 * Math.sin(a * 11 - y * 16) + 0.025 * Math.sin(y * 40));
      p.setX(i, x / r * r * wr);
      p.setZ(i, z / r * r * wr);
    }
    p.needsUpdate = true;
    g.computeVertexNormals();
    mesh.geometry = g;
    mesh.userData.folded1249 = 1;
  }

  function hideOld(mesh) {
    if (!mesh || !mesh.isMesh) return;
    mesh.visible = false;
    mesh.userData.sculptHidden = 1;
    try { mesh.scale.set(0, 0, 0); } catch (_) {}
  }
  function mark(o) {
    if (!o) return o;
    o.userData = o.userData || {};
    o.userData.sculptKeep = 1;
    o.userData.sculpt1249 = 1;
    o.frustumCulled = false;
    o.castShadow = false;
    o.renderOrder = 2;
    return o;
  }
  function addMesh(parent, geo, mat, x, y, z) {
    const m = new T.Mesh(geo, mat);
    if (x || y || z) m.position.set(x || 0, y || 0, z || 0);
    mark(m);
    parent.add(m);
    return m;
  }

  function hideOriginalLimbs(root) {
    root.traverse(o => {
      if (!o.isMesh) return;
      if (o.userData.sculpt1249 || o.userData.nail1249) return;
      const typ = o.geometry && o.geometry.type;
      if (typ === 'CylinderGeometry' || typ === 'SphereGeometry' || typ === 'BoxGeometry') hideOld(o);
    });
  }

  function upgradeHand(h, side) {
    if (!h || h.userData.sculptGeo1249) return;
    h.userData.sculptGeo1249 = 1;
    const sm = skinMat();
    hideOriginalLimbs(h);

    // Sculpted palm (replace the box)
    const palm = addMesh(h, palmGeo(), sm, 0, 0.05, 0);
    palm.name = 'PalmSculpt';

    // Thenar (thumb) and hypothenar pads, palmar bulge.
    const thenar = addMesh(h, new T.SphereGeometry(1, 12, 10), sm);
    thenar.scale.set(0.020, 0.016, 0.013);
    thenar.position.set(side * 0.022, 0.030, -0.004);
    const hypo = addMesh(h, new T.SphereGeometry(1, 10, 8), sm);
    hypo.scale.set(0.014, 0.012, 0.010);
    hypo.position.set(-side * 0.022, 0.028, -0.002);
    const palmPad = addMesh(h, new T.SphereGeometry(1, 10, 8), sm);
    palmPad.scale.set(0.024, 0.014, 0.008);
    palmPad.position.set(0, 0.048, -0.008);

    // Short dorsal tendon ridges — never long sticks poking past the knuckles.
    for (let i = 0; i < 4; i++) {
      const t = addMesh(h, share(geoKey('tend2', i), () => {
        const g = new T.CylinderGeometry(0.0012, 0.0016, 0.028, 8);
        g.translate(0, 0.014, 0);
        return g;
      }), sm, (i - 1.5) * 0.016, 0.072, 0.011);
      t.rotation.z = (i - 1.5) * -0.03;
    }

    const fingers = h.userData.f || [];
    // Proximal lengths match the original pivot spacing (0.036, 0.017, 0.013)
    const widths = [0.0082, 0.0078, 0.0072, 0.0064];
    for (let i = 0; i < fingers.length; i++) {
      const pair = fingers[i];
      if (!pair) continue;
      const f = pair[0], k = pair[1];
      const r = widths[i] || 0.007;
      const cm = creaseMat();
      // proximal on f
      addMesh(f, fingerSegGeo(0.038, r * 1.02, r * 0.84, 0.48, 14, 14, 1), sm);
      addMesh(f, knuckleGeo(r * 0.42), sm, 0, 0.001, 0.0006).userData.knuckle1263 = 1;
      creaseRing(f, 0.001, r * 0.95, cm);
      if (k) {
        addMesh(k, fingerSegGeo(0.018, r * 0.86, r * 0.76, 0.46, 12, 14, 1), sm);
        addMesh(k, knuckleGeo(r * 0.36), sm, 0, 0.001, 0.0006).userData.knuckle1263 = 1;
        creaseRing(k, 0.0008, r * 0.82, cm);
        const d = k.userData && k.userData.d;
        if (d) {
          addMesh(d, fingerSegGeo(0.014, r * 0.76, r * 0.54, 0.44, 12, 14, 0), sm);
          addMesh(d, knuckleGeo(r * 0.28), sm, 0, 0.001, 0.0005).userData.knuckle1263 = 1;
          creaseRing(d, 0.0006, r * 0.70, cm);
          // nail on the dorsal distal
          const nail = addMesh(d, nailGeo(r * 1.05, 0.0055, r * 0.28), nailMat(), 0, 0.010, r * 0.38);
          nail.rotation.x = -0.12;
          nail.userData.nail1249 = 1;
        }
      }
    }

    const th = h.userData.th;
    if (th) {
      const tcm = creaseMat();
      addMesh(th, fingerSegGeo(0.05, 0.0096, 0.0080, 0.78, 10, 12, 1), sm);
      creaseRing(th, 0.001, 0.0090, tcm);
      const tk = th.userData && th.userData.k;
      if (tk) {
        addMesh(tk, fingerSegGeo(0.018, 0.0082, 0.0076, 0.78, 9, 12, 1), sm);
        creaseRing(tk, 0.0008, 0.0076, tcm);
        const td = tk.userData && tk.userData.d;
        if (td) {
          addMesh(td, fingerSegGeo(0.014, 0.0076, 0.0064, 0.76, 9, 12, 0), sm);
          const tn = addMesh(td, nailGeo(0.008, 0.006, 0.0024), nailMat(), 0, 0.010, 0.0044);
          tn.rotation.x = -0.12;
          tn.userData.nail1249 = 1;
        }
      }
    }

    // Wrist
    addMesh(h, fingerSegGeo(0.048, 0.030, 0.026, 0.82, 10, 14, 0), sm, 0, -0.048, 0);
    // Dorsal knuckles at the finger roots (replace the old balls)
    if (h.userData.kn) {
      for (const b of h.userData.kn) hideOld(b);
    }
    const kn = [];
    for (let i = 0; i < 4; i++) {
      const b = addMesh(h, knuckleGeo(0.0052 - i * 0.0003), sm, (i - 1.5) * 0.0215, 0.096, 0.007);
      b.userData.knuckle1263 = 1;
      kn.push(b);
    }
    h.userData.kn = kn;
  }

  function upgradeArm(arm) {
    if (!arm || !arm.userData || !arm.userData.p) return;
    const p = arm.userData.p;
    const lm = linenMat();
    const sm = skinMat();
    if (p.up) { p.up.material = lm; foldCloth(p.up, 1.15); mark(p.up); }
    if (p.el) { p.el.material = lm; mark(p.el); }
    if (p.cuff) { p.cuff.material = lm; foldCloth(p.cuff, 1.45); mark(p.cuff);
      if (!p.cuff.userData.roll1251 && p.cuff.parent) {
        const roll = new T.Mesh(new T.TorusGeometry(0.028, 0.007, 8, 16), lm);
        roll.rotation.x = Math.PI / 2;
        // Sit the roll at the cuff, slightly toward the camera.
        roll.position.copy(p.cuff.position);
        roll.position.y += 0.01;
        roll.userData.folded1249 = 1;
        roll.userData.sculptKeep = 1;
        p.cuff.parent.add(roll);
        const roll2 = new T.Mesh(new T.TorusGeometry(0.024, 0.005, 8, 14), lm);
        roll2.rotation.x = Math.PI / 2;
        roll2.position.copy(p.cuff.position);
        roll2.position.y += 0.022;
        roll2.userData.folded1249 = 1;
        roll2.userData.sculptKeep = 1;
        p.cuff.parent.add(roll2);
        p.cuff.userData.roll1251 = 1;
      }
    }
    if (p.fo) {
      // Keep the existing forearm mesh (already tapered) but paint + slightly reshape.
      p.fo.material = sm;
      mark(p.fo);
      if (!p.fo.userData.tapered1254 && p.fo.geometry) {
        const g = p.fo.geometry.clone();
        const pos = g.attributes.position;
        if (pos) {
          let ymin = Infinity, ymax = -Infinity;
          for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
          const span = (ymax - ymin) || 1;
          for (let i = 0; i < pos.count; i++) {
            const y = (pos.getY(i) - ymin) / span;
            // y=0 elbow, y=1 wrist: mid-forearm muscle belly, narrow wrist, not a cone.
            const muscle = 1.0 + 0.14 * Math.sin(y * Math.PI);
            const wrist = 1.0 - 0.38 * y * y;
            const s = muscle * wrist;
            pos.setX(i, pos.getX(i) * s);
            pos.setZ(i, pos.getZ(i) * (s * 0.88));
          }
          pos.needsUpdate = true;
          g.computeVertexNormals();
          p.fo.geometry = g;
          p.fo.userData.tapered1254 = 1;
        }
      }
    }
    if (p.h) upgradeHand(p.h, arm.userData.side || 1);
  }

  function applyMaterials() {
    try {
      const fpa = W.__fpa;
      const rig = fpa && (typeof fpa.rig === 'function' ? fpa.rig() : fpa.g);
      if (!rig) return false;
      const sm = skinMat(), lm = linenMat(), nm = nailMat();
      rig.traverse(o => {
        if (!(o.isMesh || o.isSkinnedMesh) || !o.material) return;
        if (o.userData && o.userData.sculptHidden) { o.visible = false; return; }
        if (o.userData && o.userData.nail1249) { o.material = nm; o.visible = true; return; }
        if (o.userData && (o.userData.sculptKeep || o.userData.sculpt1249 || o.userData.folded1249)) {
          const n = (o.name || '') + (o.parent && o.parent.name || '');
          const isSleeve = /cuff|shirt|up|sleeve|el/i.test(n) || (o.parent && o.parent.userData && o.parent.userData.p && (o === o.parent.userData.p.up || o === o.parent.userData.p.el || o === o.parent.userData.p.cuff));
          // Prefer linen only on known sleeve parts.
          let sleeve = false;
          try {
            const arm = o.parent;
            const p = arm && arm.userData && arm.userData.p;
            if (p && (o === p.up || o === p.el || o === p.cuff)) sleeve = true;
          } catch (_) {}
          o.material = sleeve ? lm : (isSleeve && !o.userData.nail1249 ? lm : sm);
          if (o.userData.folded1249 || sleeve) o.material = lm;
          if (o.userData.nail1249) o.material = nm;
          o.visible = true;
        }
      });
      // Walk known sleeve refs so we don't mis-paint.
      function fixArm(arm) {
        const p = arm && arm.userData && arm.userData.p;
        if (!p) return;
        if (p.up) p.up.material = lm;
        if (p.el) p.el.material = lm;
        if (p.cuff) p.cuff.material = lm;
        if (p.fo) p.fo.material = (p.fo.userData && p.fo.userData.sleevePaint1254) ? lm : sm;
      }
      if (rig.userData.R) fixArm(rig.userData.R);
      if (rig.userData.L) fixArm(rig.userData.L);
      return true;
    } catch (e) { ERR('mats', e); return false; }
  }

  function apply() {
    try {
      const fpa = W.__fpa;
      const rig = fpa && (typeof fpa.rig === 'function' ? fpa.rig() : fpa.g);
      if (!rig) return false;
      if (!(rig.userData && rig.userData.sculptGeo1249)) {
        if (rig.userData.R) upgradeArm(rig.userData.R);
        if (rig.userData.L) upgradeArm(rig.userData.L);
        if (rig.userData) rig.userData.sculptGeo1249 = 1;
        U.sculpted = 1;
      }
      applyMaterials();
      hookPaint();
      U.on = 1;
      return true;
    } catch (e) { ERR('apply', e); return false; }
  }

  // Standalone sculpted hand for the 1259 first-person viewmodel.
  // Finger pivots match __fpa mkHand so curl can drive the same joints.
  U.buildHand = function (side) {
    side = side || 1;
    const h = new T.Group();
    h.name = side > 0 ? 'FpHandR' : 'FpHandL';
    h.userData.fpHand1259 = 1;
    h.userData.side = side;
    h.userData.f = [];
    for (let i = 0; i < 4; i++) {
      const f = new T.Group();
      f.position.set((i - 1.5) * 0.0215, 0.097 - Math.abs(i - 1.2) * 0.006, 0.004);
      f.rotation.z = (i - 1.5) * -0.05;
      const k = new T.Group();
      k.position.y = 0.036;
      const d = new T.Group();
      d.position.y = 0.017;
      k.add(d);
      k.userData.d = d;
      f.add(k);
      f.userData.k = k;
      h.add(f);
      h.userData.f.push([f, k]);
    }
    const th = new T.Group();
    th.position.set(side * 0.038, 0.028, 0.01);
    th.rotation.set(0.85, side * 0.55, side * 0.85);
    const tk = new T.Group();
    tk.position.y = 0.05;
    const td = new T.Group();
    td.position.y = 0.018;
    tk.add(td);
    tk.userData.d = td;
    th.add(tk);
    th.userData.k = tk;
    h.userData.th = th;
    h.add(th);
    upgradeHand(h, side);
    return h;
  };

  function hookPaint() {
    if (U._hooked) return;
    try {
      const H = W.__held1240;
      if (H && typeof H.retextureProceduralArms === 'function') {
        const prev = H.retextureProceduralArms.bind(H);
        H.retextureProceduralArms = function () {
          const r = prev.apply(this, arguments);
          try { apply(); } catch (_) {}
          return r;
        };
        U._hooked = 1;
      }
      if (H && typeof H.hardenFpa === 'function' && !H.__sculptHarden) {
        const prevH = H.hardenFpa.bind(H);
        H.hardenFpa = function () {
          const r = prevH.apply(this, arguments);
          try { applyMaterials(); } catch (_) {}
          return r;
        };
        H.__sculptHarden = 1;
      }
      if (H && typeof H.paintMesh !== 'function') {
        // paintMesh is closed over; we also tag materials so a later patch can skip them.
      }
    } catch (e) { ERR('hook', e); }
  }

  let n = 0;
  const boot = setInterval(function () {
    n++;
    hookPaint();
    if (apply() || n > 80) clearInterval(boot);
  }, 120);
  W.addEventListener && W.addEventListener('load', function () { hookPaint(); apply(); });
})(typeof window !== 'undefined' ? window : this);
