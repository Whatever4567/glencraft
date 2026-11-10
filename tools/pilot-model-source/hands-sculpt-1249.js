/* v1.2.57-sculpt: upgrade the existing __fpa cube-arm meshes in place
   (subdivide, round, better palm/fingers/nails/wrist, skin and linen).
   Animation drivers, joints, pivots and grip positions stay untouched.
   Retexture/harden are hooked so paint cannot strip the sculpt. */
(function handsSculpt1249(W) {
  const U = W.__hands1249 = {on: 0, err: null, version: '1.2.57-sculpt-p2', sculpted: 0};
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
    t.generateMipmaps = true;
    t.minFilter = T.LinearMipmapLinearFilter;
    t.magFilter = T.LinearFilter;
    t.anisotropy = 8;
    try { if (T.sRGBEncoding) t.encoding = T.sRGBEncoding; } catch (_) {}
    return t;
  }
  function skinTex() {
    // Smooth tanned skin, no speckled pits. Soft warmth, faint pores, crease hints.
    return tex(1024, 1024, (g) => {
      const grd = g.createLinearGradient(0, 0, 1024, 1024);
      grd.addColorStop(0, '#e6c4a6');
      grd.addColorStop(0.35, '#dcb394');
      grd.addColorStop(0.7, '#c99a76');
      grd.addColorStop(1, '#c09070');
      g.fillStyle = grd; g.fillRect(0, 0, 1024, 1024);
      // very soft blotches of warmth (blood) and cooler shadow
      for (let i = 0; i < 18; i++) {
        const x = Math.random() * 1024, y = Math.random() * 1024;
        const r = 80 + Math.random() * 160;
        const rad = g.createRadialGradient(x, y, 0, x, y, r);
        const warm = Math.random() < 0.6;
        rad.addColorStop(0, warm ? 'rgba(180,70,45,0.10)' : 'rgba(90,60,50,0.07)');
        rad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rad; g.fillRect(0, 0, 1024, 1024);
      }
      // faint pores (tiny, low contrast)
      for (let i = 0; i < 1800; i++) {
        g.fillStyle = 'rgba(90,50,30,' + (0.03 + Math.random() * 0.04) + ')';
        g.fillRect(Math.random() * 1024, Math.random() * 1024, 1, 1);
      }
      // soft crease strokes
      g.strokeStyle = 'rgba(110,65,45,0.10)'; g.lineWidth = 1.4;
      g.lineCap = 'round';
      for (let i = 0; i < 16; i++) {
        g.beginPath();
        const x = 40 + Math.random() * 900, y = 40 + Math.random() * 900;
        g.moveTo(x, y); g.quadraticCurveTo(x + 50, y + 14, x + 110, y - 8);
        g.stroke();
      }
    });
  }
  function skinBump() {
    return tex(512, 512, (g) => {
      g.fillStyle = '#8a8a8a'; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 900; i++) {
        const v = 132 + Math.random() * 16 | 0;
        g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
        g.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
      }
    });
  }
  function linenTex() {
    // Cream linen: soft warp/weft, broad fold shadows, no moire grid.
    return tex(512, 512, (g) => {
      g.fillStyle = '#efe8d8'; g.fillRect(0, 0, 512, 512);
      // loose fibres
      for (let i = 0; i < 140; i++) {
        const v = 210 + Math.random() * 30 | 0;
        g.strokeStyle = 'rgba(' + v + ',' + (v - 8) + ',' + (v - 20) + ',' + (0.07 + Math.random() * 0.08) + ')';
        g.lineWidth = 1 + Math.random() * 2;
        g.beginPath();
        const x = Math.random() * 512, y = Math.random() * 512;
        g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 80, y + 20 + Math.random() * 40);
        g.stroke();
      }
      // soft woven bands
      for (let y = 0; y < 512; y += 7) {
        g.fillStyle = 'rgba(160,145,120,' + (0.03 + (y % 14 === 0 ? 0.03 : 0)) + ')';
        g.fillRect(0, y, 512, 2);
      }
      for (let x = 0; x < 512; x += 9) {
        g.fillStyle = 'rgba(160,145,120,0.025)';
        g.fillRect(x, 0, 1, 512);
      }
      // a few broad fold shadows
      for (let i = 0; i < 6; i++) {
        g.strokeStyle = 'rgba(90,70,50,' + (0.05 + Math.random() * 0.06) + ')';
        g.lineWidth = 10 + Math.random() * 14;
        g.beginPath();
        const x = Math.random() * 512, y = Math.random() * 200;
        g.moveTo(x, y); g.quadraticCurveTo(x + 80, y + 120, x - 20, y + 280);
        g.stroke();
      }
    });
  }

  const SKIN_MAP = skinTex();
  const SKIN_BUMP = skinBump();
  const LINEN_MAP = linenTex();
  LINEN_MAP.repeat.set(1, 1.4);
  U.SKIN_MAP = SKIN_MAP; U.SKIN_BUMP = SKIN_BUMP; U.LINEN_MAP = LINEN_MAP;

  function std(opts) {
    const m = new T.MeshStandardMaterial(opts);
    m.userData.sculptKeep = 1;
    try { if (T.sRGBEncoding) m.envMapIntensity = 0.25; } catch (_) {}
    return m;
  }
  function skinMat() {
    const m = std({
      color: 0xffffff, map: SKIN_MAP, bumpMap: SKIN_BUMP, bumpScale: 0.008,
      roughness: 0.55, metalness: 0.0
    });
    return m;
  }
  function linenMat() {
    const m = std({
      color: 0xf2eee4, map: LINEN_MAP, bumpMap: LINEN_MAP, bumpScale: 0.018,
      roughness: 0.86, metalness: 0.0
    });
    return m;
  }
  U.linenMat = linenMat;
  U.skinMat = skinMat;
  function skinMatFp() { return skinMat(); }
  function linenMatFp() { return linenMat(); }
  U.skinMatFp = skinMatFp;
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
    const m = std({
      color: 0xffffff, map: tartanTex(), bumpMap: tartanTex(), bumpScale: 0.08,
      roughness: 0.82, metalness: 0.0
    });
    m.userData.tartan1251 = 1;
    return m;
  }
  function nailMat() {
    const m = std({
      color: 0xf0d8c8, roughness: 0.28, metalness: 0.04
    });
    m.userData.nail1249 = 1;
    return m;
  }

  // Tapered oval capsule along +Y from 0..len, squashed in Z (palmar/dorsal).
  function fingerSegGeo(len, r0, r1, ovalZ, segs, rad, knuckle) {
    const key = geoKey('fseg2', len, r0, r1, ovalZ, segs, rad, knuckle);
    return share(key, function () {
      segs = segs || 12; rad = rad || 16;
      const pos = [], nrm = [], uv = [], ix = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs, y = t * len;
        let r = r0 + (r1 - r0) * Math.pow(t, 0.85);
        if (knuckle && t < 0.28) r *= 1 + 0.22 * (1 - t / 0.28) * Math.sin((1 - t / 0.28) * Math.PI);
        if (t > 0.25 && t < 0.8) r *= 1.05;
        for (let k = 0; k < rad; k++) {
          const a = (k / rad) * Math.PI * 2;
          const ox = Math.cos(a), oz = Math.sin(a) * (ovalZ || 0.72);
          pos.push(ox * r, y, oz * r);
          const n = new T.Vector3(ox, 0, oz).normalize();
          nrm.push(n.x, n.y, n.z);
          uv.push(k / rad, t);
        }
      }
      const tip = pos.length / 3;
      pos.push(0, len + r1 * 0.85, 0); nrm.push(0, 1, 0); uv.push(0.5, 1);
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
    return share(geoKey('kn2', r), function () {
      const g = new T.SphereGeometry(r, 16, 14);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i), z = p.getZ(i);
        p.setZ(i, z * 0.78);
        if (y > 0) p.setY(i, y * 0.72);
      }
      g.computeVertexNormals();
      return g;
    });
  }
  function palmGeo() {
    return share('palm2', function () {
      const g = new T.BoxGeometry(0.078, 0.102, 0.036, 12, 12, 6);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const yn = (y + 0.051) / 0.102;
        const xn = x / 0.039;
        const side = 1 - 0.18 * xn * xn;
        const wrist = 1 - 0.22 * (1 - yn) * (1 - yn);
        x *= side * wrist;
        z *= (1 - Math.abs(xn) * 0.32);
        // palmar hollow
        if (z < 0) z *= 0.78 + 0.28 * yn;
        // dorsal camber and knuckle row
        if (z > 0) z *= 0.92 + 0.12 * yn;
        if (yn > 0.82 && z > 0) z += 0.0035;
        // round the corners
        const edge = Math.max(Math.abs(xn) - 0.55, 0) + Math.max(Math.abs(yn - 0.5) - 0.42, 0);
        if (edge > 0) {
          const k = 1 - 0.35 * Math.min(1, edge);
          x *= k; z *= k;
        }
        p.setXYZ(i, x, y, z);
      }
      g.computeVertexNormals();
      const out = g.clone();
      out.type = 'BufferGeometry';
      return out;
    });
  }
  function nailGeo(w, h, d) {
    return share(geoKey('nail2', w, h, d), function () {
      const g = new T.BoxGeometry(w, h, d, 5, 3, 2);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i), z = p.getZ(i);
        if (y > 0) p.setX(i, p.getX(i) * 0.86);
        p.setZ(i, z + y * y * 22);
      }
      g.computeVertexNormals();
      return g;
    });
  }

  // Broad, cloth-like folds on a tapered sleeve (low frequency, high segs).
  function sleeveGeo(r0, r1, len, rad, segs, folds) {
    const key = geoKey('slv', r0, r1, len, rad, segs, folds);
    return share(key, function () {
      rad = rad || 24; segs = segs || 16; folds = folds || 3;
      const pos = [], nrm = [], uv = [], ix = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs, y = t * len;
        const rBase = r0 + (r1 - r0) * t;
        for (let k = 0; k < rad; k++) {
          const a = (k / rad) * Math.PI * 2;
          // two to three broad longitudinal folds plus a slow twist
          const wr = 1
            + 0.055 * Math.sin(a * folds + t * 1.6)
            + 0.028 * Math.sin(a * (folds + 2) - t * 2.4)
            + 0.016 * Math.sin(a * 2 + t * 5.0);
          const r = rBase * wr;
          const ox = Math.cos(a), oz = Math.sin(a);
          pos.push(ox * r, y, oz * r);
          nrm.push(ox, 0, oz);
          uv.push(k / rad, t);
        }
      }
      for (let i = 0; i < segs; i++) {
        for (let k = 0; k < rad; k++) {
          const a = i * rad + k, b = i * rad + (k + 1) % rad;
          const c = (i + 1) * rad + k, d = (i + 1) * rad + (k + 1) % rad;
          ix.push(a, c, b, b, c, d);
        }
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      geo.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      geo.setIndex(ix);
      geo.computeVertexNormals();
      return geo;
    });
  }
  function cuffHemGeo(r, tube) {
    const key = geoKey('hem', r, tube);
    return share(key, function () {
      const g = new T.TorusGeometry(r, tube, 12, 28);
      return g;
    });
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

    const palm = addMesh(h, palmGeo(), sm, 0, 0.05, 0);
    palm.name = 'PalmSculpt';

    // Thenar (thumb) and hypothenar pads, palmar bulge — slightly fuller.
    const thenar = addMesh(h, new T.SphereGeometry(1, 16, 12), sm);
    thenar.scale.set(0.022, 0.018, 0.014);
    thenar.position.set(side * 0.024, 0.030, -0.005);
    const hypo = addMesh(h, new T.SphereGeometry(1, 14, 10), sm);
    hypo.scale.set(0.015, 0.013, 0.011);
    hypo.position.set(-side * 0.023, 0.028, -0.003);
    const palmPad = addMesh(h, new T.SphereGeometry(1, 14, 10), sm);
    palmPad.scale.set(0.026, 0.015, 0.009);
    palmPad.position.set(0, 0.050, -0.009);

    const fingers = h.userData.f || [];
    // Proximal lengths stay on the original pivot spacing (0.036, 0.017, 0.013)
    const widths = [0.0088, 0.0084, 0.0076, 0.0068];
    for (let i = 0; i < fingers.length; i++) {
      const pair = fingers[i];
      if (!pair) continue;
      const f = pair[0], k = pair[1];
      const r = widths[i] || 0.0075;
      addMesh(f, fingerSegGeo(0.036, r, r * 0.88, 0.70, 12, 16, 1), sm);
      addMesh(f, knuckleGeo(r * 1.18), sm, 0, 0.001, 0.0012);
      if (k) {
        addMesh(k, fingerSegGeo(0.017, r * 0.88, r * 0.80, 0.70, 10, 16, 1), sm);
        addMesh(k, knuckleGeo(r * 0.98), sm, 0, 0.001, 0.001);
        const d = k.userData && k.userData.d;
        if (d) {
          addMesh(d, fingerSegGeo(0.013, r * 0.80, r * 0.62, 0.68, 10, 16, 0), sm);
          addMesh(d, knuckleGeo(r * 0.86), sm, 0, 0.001, 0.001);
          const nail = addMesh(d, nailGeo(r * 1.12, 0.0062, r * 0.32), nailMat(), 0, 0.0095, r * 0.42);
          nail.rotation.x = -0.14;
          nail.userData.nail1249 = 1;
        }
      }
    }

    const th = h.userData.th;
    if (th) {
      addMesh(th, fingerSegGeo(0.05, 0.0102, 0.0084, 0.78, 12, 16, 1), sm);
      const tk = th.userData && th.userData.k;
      if (tk) {
        addMesh(tk, fingerSegGeo(0.018, 0.0086, 0.0078, 0.78, 10, 16, 1), sm);
        const td = tk.userData && tk.userData.d;
        if (td) {
          addMesh(td, fingerSegGeo(0.014, 0.0078, 0.0066, 0.76, 10, 16, 0), sm);
          const tn = addMesh(td, nailGeo(0.0086, 0.0064, 0.0026), nailMat(), 0, 0.010, 0.0048);
          tn.rotation.x = -0.14;
          tn.userData.nail1249 = 1;
        }
      }
    }

    // Wrist — slightly more defined, tapered into the palm
    addMesh(h, fingerSegGeo(0.048, 0.031, 0.026, 0.82, 12, 18, 0), sm, 0, -0.048, 0);
    if (h.userData.kn) {
      for (const b of h.userData.kn) hideOld(b);
    }
    const kn = [];
    for (let i = 0; i < 4; i++) {
      const b = addMesh(h, knuckleGeo(0.0082 - i * 0.0004), sm, (i - 1.5) * 0.0215, 0.096, 0.010);
      kn.push(b);
    }
    h.userData.kn = kn;
  }

  function upgradeArm(arm) {
    if (!arm || !arm.userData || !arm.userData.p) return;
    const p = arm.userData.p;
    const lm = linenMat();
    const sm = skinMat();
    if (p.up) {
      if (!p.up.userData.sleeve1257) {
        // LU = 0.38, original limb(0.07, 0.06, LU)
        p.up.geometry = sleeveGeo(0.07, 0.06, 0.38, 24, 16, 3);
        p.up.userData.sleeve1257 = 1;
      }
      p.up.material = lm; mark(p.up);
    }
    if (p.el) { p.el.material = lm; mark(p.el); }
    if (p.cuff) {
      if (!p.cuff.userData.sleeve1257) {
        // Cuff in the same local frame as the original limb ( +Y along the forearm ).
        // A slight flare at the wrist end reads as a rolled hem, with no extra torus.
        p.cuff.geometry = sleeveGeo(0.062, 0.070, 0.12, 24, 12, 3);
        const g = p.cuff.geometry.clone();
        const pos = g.attributes.position;
        let ymin = Infinity, ymax = -Infinity;
        for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
        const span = (ymax - ymin) || 1;
        for (let i = 0; i < pos.count; i++) {
          const t = (pos.getY(i) - ymin) / span;
          // swell the last 18% into a soft rolled lip
          if (t > 0.82) {
            const k = (t - 0.82) / 0.18;
            const fl = 1 + 0.22 * k * k;
            pos.setX(i, pos.getX(i) * fl);
            pos.setZ(i, pos.getZ(i) * fl);
          }
        }
        pos.needsUpdate = true;
        g.computeVertexNormals();
        p.cuff.geometry = g;
        p.cuff.userData.sleeve1257 = 1;
      }
      p.cuff.material = lm; mark(p.cuff);
      p.cuff.userData.roll1251 = 1; // do not add the old 1251 torus pair
      // Hide any leftover world-space torus rolls from earlier passes / remounts.
      if (p.cuff.parent) {
        try {
          p.cuff.parent.children.forEach(function (ch) {
            if (ch === p.cuff) return;
            if (ch.userData && (ch.userData.roll1257 || ch.userData.folded1249) && ch.geometry && /Torus/.test(ch.geometry.type || '')) hideOld(ch);
          });
        } catch (_) {}
      }
    }
    if (p.fo) {
      p.fo.material = sm;
      mark(p.fo);
      if (!p.fo.userData.tapered1257 && p.fo.geometry) {
        // Rebuild the forearm as a smoother tapered capsule, same length.
        p.fo.geometry = sleeveGeo(0.054, 0.034, 0.36, 20, 14, 0);
        // A light muscle swell instead of cloth folds: squeeze the "folds" to 0
        // already done (folds=0). Add a slight belly mid-shaft.
        const g = p.fo.geometry.clone();
        const pos = g.attributes.position;
        let ymin = Infinity, ymax = -Infinity;
        for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
        const span = (ymax - ymin) || 1;
        for (let i = 0; i < pos.count; i++) {
          const t = (pos.getY(i) - ymin) / span;
          const belly = 1 + 0.08 * Math.sin(t * Math.PI) * (t < 0.85 ? 1 : 0.4);
          const wrist = 1 - 0.08 * t * t;
          pos.setX(i, pos.getX(i) * belly * wrist);
          pos.setZ(i, pos.getZ(i) * belly * wrist * 0.92);
        }
        pos.needsUpdate = true;
        g.computeVertexNormals();
        p.fo.geometry = g;
        p.fo.userData.tapered1257 = 1;
        p.fo.userData.tapered1249 = 1;
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
        if (o.userData && (o.userData.sculptKeep || o.userData.sculpt1249 || o.userData.folded1249 || o.userData.roll1257)) {
          const n = (o.name || '') + (o.parent && o.parent.name || '');
          const isSleeve = /cuff|shirt|up|sleeve|el/i.test(n) || (o.parent && o.parent.userData && o.parent.userData.p && (o === o.parent.userData.p.up || o === o.parent.userData.p.el || o === o.parent.userData.p.cuff));
          let sleeve = false;
          try {
            const arm = o.parent;
            const p = arm && arm.userData && arm.userData.p;
            if (p && (o === p.up || o === p.el || o === p.cuff)) sleeve = true;
          } catch (_) {}
          if (o.userData.roll1257 || o.userData.folded1249) sleeve = true;
          o.material = sleeve || isSleeve ? lm : sm;
          if (o.userData.nail1249) o.material = nm;
          o.visible = true;
        }
      });
      function fixArm(arm) {
        const p = arm && arm.userData && arm.userData.p;
        if (!p) return;
        if (p.up) p.up.material = lm;
        if (p.el) p.el.material = lm;
        if (p.cuff) p.cuff.material = lm;
        if (p.fo) p.fo.material = sm;
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
  // Used only as an invisible driver once the 1270 TP-arm clone is ready.
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
    } catch (e) { ERR('hook', e); }
  }

  U.apply = apply;

  function hookStep() {
    if (U._stepHooked) return;
    const fpa = W.__fpa;
    if (!fpa || typeof fpa.step !== 'function') return;
    const prev = fpa.step.bind(fpa);
    fpa.step = function () {
      const r = prev.apply(this, arguments);
      try { if (!U.sculpted) apply(); } catch (_) {}
      return r;
    };
    U._stepHooked = 1;
  }

  let n = 0;
  const boot = setInterval(function () {
    n++;
    hookPaint();
    hookStep();
    if (apply() || n > 80) clearInterval(boot);
  }, 50);
  W.addEventListener && W.addEventListener('load', function () { hookPaint(); hookStep(); apply(); });
})(typeof window !== 'undefined' ? window : this);
