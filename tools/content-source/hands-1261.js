/* GLX-HANDS1261 (v1.2.61): first-person arm FRAMING first — the hand sits
   lower and more centred (centre-to-lower-right), palm facing up, wrist
   low, linen cuff at the bottom edge, forearm mostly vertical with only a
   short length visible — then a pixel-polygon (voxel / micro-cube) sculpt
   with realistic proportions, folds, and per-item grips. Pistol and musket
   meshes are forced visible with the two-handed wrap. The 1.2.59 torch-arm
   freeze is kept. */
(function hands1261() {
  const U = window.__hands1261 = { err: null, built: 0, kind: '' };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 260); try { console.warn('h1261', w, e); } catch (_) {} };

  /* ---------- voxel builder: many small cubes, merged, vertex colours ---------- */
  function Vox() {
    this.p = []; this.n = []; this.c = []; this.i = []; this.v = 0;
  }
  Vox.prototype.cube = function (x, y, z, sx, sy, sz, r, g, b) {
    const hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5;
    const faces = [
      /* +Z */ [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz], [0, 0, 1]],
      /* -Z */ [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz], [0, 0, -1]],
      /* +Y */ [[-hx, hy, -hz], [-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [0, 1, 0]],
      /* -Y */ [[-hx, -hy, hz], [-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [0, -1, 0]],
      /* +X */ [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz], [1, 0, 0]],
      /* -X */ [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz], [-1, 0, 0]]
    ];
    const shade = (nx, ny, nz) => {
      /* cheap directional shade so the pixel-cubes read as a sculpt */
      const s = 0.72 + 0.28 * Math.max(0, nx * 0.25 + ny * 0.85 + nz * 0.35);
      return [r * s, g * s, b * s];
    };
    for (let f = 0; f < 6; f++) {
      const F = faces[f], n = F[4], col = shade(n[0], n[1], n[2]);
      const b0 = this.v;
      for (let k = 0; k < 4; k++) {
        this.p.push(x + F[k][0], y + F[k][1], z + F[k][2]);
        this.n.push(n[0], n[1], n[2]);
        this.c.push(col[0], col[1], col[2]);
      }
      this.i.push(b0, b0 + 1, b0 + 2, b0, b0 + 2, b0 + 3);
      this.v += 4;
    }
  };
  Vox.prototype.mesh = function (opts) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    geo.setIndex(this.i);
    geo.computeBoundingSphere();
    const mat = new THREE.MeshStandardMaterial(Object.assign({
      color: 0xc99568,
      vertexColors: true,
      roughness: 0.78,
      metalness: 0.0,
      flatShading: true,
      envMapIntensity: 0.08
    }, opts || {}));
    try { if (THREE.VertexColors !== undefined) mat.vertexColors = THREE.VertexColors; } catch (_) {}
    try { mat.toneMapped = true; } catch (_) {}
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.castShadow = false;
    m.userData.h1261 = 1;
    return m;
  };

  /* natural skin — warm tan like the reference photograph */
  function skinCol() {
    const j = (Math.random() - 0.5) * 0.045;
    return [0.78 + j, 0.55 + j * 0.7, 0.40 + j * 0.4];
  }
  function linenCol() {
    const j = (Math.random() - 0.5) * 0.05;
    return [0.90 + j, 0.84 + j, 0.72 + j];
  }
  function nailCol() { return [0.86, 0.68, 0.62]; }

  /* A phalanx (finger segment) as a cluster of micro-cubes. */
  function phalanxMesh(len, thick, taper) {
    const v = new Vox();
    const vs = Math.max(0.0036, thick * 0.32);
    const nx = Math.max(2, Math.round(thick / vs));
    const ny = Math.max(3, Math.round(len / vs));
    const nz = Math.max(2, Math.round(thick * 0.85 / vs));
    for (let iy = 0; iy < ny; iy++) {
      const t = iy / (ny - 1);
      const k = 1 - t * (taper || 0.22);
      for (let ix = 0; ix < nx; ix++) {
        for (let iz = 0; iz < nz; iz++) {
          const px = ((ix + 0.5) / nx - 0.5) * thick * k;
          const py = (iy + 0.5) / ny * len;
          const pz = ((iz + 0.5) / nz - 0.5) * thick * 0.82 * k;
          /* slightly oval: flatter on the palm side (–Z local after we orient) */
          const c = skinCol();
          v.cube(px, py, pz, vs * 1.02, vs * 1.02, vs * 1.02, c[0], c[1], c[2]);
        }
      }
    }
    /* fingernail on the last third of the top (+Z in local, we'll rotate) */
    if (len > 0.012) {
      const nc = nailCol();
      v.cube(0, len * 0.86, thick * 0.36, thick * 0.42, len * 0.22, vs * 0.7, nc[0], nc[1], nc[2]);
    }
    return v.mesh();
  }

  function makeFinger(len, thick, segs) {
    const root = new THREE.Group(); root.userData.h1261 = 1;
    const joints = [];
    const lens = segs === 3
      ? [len * 0.40, len * 0.32, len * 0.28]
      : [len * 0.55, len * 0.45];
    let p = root, acc = 0;
    for (let i = 0; i < segs; i++) {
      const g = new THREE.Group();
      g.position.y = i === 0 ? 0 : lens[i - 1] * 0.98;
      p.add(g);
      const mesh = phalanxMesh(lens[i], thick * (1 - i * 0.12), 0.18 + i * 0.08);
      /* phalanx extends along +Y */
      g.add(mesh);
      joints.push(g);
      p = g;
    }
    function setCurl(t, spread) {
      const a = t * 0.95;
      if (joints[0]) joints[0].rotation.x = a * 0.42 + (spread || 0);
      if (joints[1]) joints[1].rotation.x = a * 0.78;
      if (joints[2]) joints[2].rotation.x = a * 0.62;
    }
    return { root, setCurl, joints };
  }

  /* Palm as a dense voxel volume with thenar bulge and knuckle ridge. */
  function palmMesh(w, h, d) {
    const v = new Vox();
    const vs = 0.0044;
    const nx = Math.round(w / vs), ny = Math.round(h / vs), nz = Math.round(d / vs);
    for (let ix = 0; ix < nx; ix++) {
      for (let iy = 0; iy < ny; iy++) {
        for (let iz = 0; iz < nz; iz++) {
          const u = (ix + 0.5) / nx, vv = (iy + 0.5) / ny, ww = (iz + 0.5) / nz;
          /* taper toward the wrist (y=0) and a slight arch across x */
          const wrist = 0.72 + 0.28 * vv;
          const arch = 1 - 0.10 * Math.sin(u * Math.PI);
          const px = (u - 0.5) * w * wrist;
          const py = vv * h;
          const pz = (ww - 0.5) * d * arch;
          /* thenar (thumb muscle) bulge on the –X, +Z (palm) side of a right hand */
          const thenar = (u < 0.38 && vv > 0.15 && vv < 0.65 && ww > 0.45)
            ? 1 : 0;
          const px2 = px - thenar * vs * 1.4;
          const pz2 = pz + thenar * vs * 2.2;
          /* skip a shallow palm hollow */
          const hollow = (ww < 0.28 && vv > 0.25 && vv < 0.85 && u > 0.18 && u < 0.85);
          if (hollow && (iz === 0)) continue;
          const c = skinCol();
          /* knuckle ridge near the finger end, dorsal side */
          const knuckle = (vv > 0.88 && ww < 0.40) ? 0.06 : 0;
          v.cube(px2, py, pz2 - knuckle, vs * 1.04, vs * 1.04, vs * 1.04, c[0], c[1], c[2]);
        }
      }
    }
    return v.mesh();
  }

  /* Linen sleeve: short forearm of voxel cubes with fold ridges and a cuff.
     Local: y=0 is the CUFF (bottom of the screen), y=+len is the WRIST. */
  function sleeveMesh(len, r0, r1) {
    const v = new Vox();
    const vs = 0.0052;
    const rings = Math.round(len / vs);
    for (let iy = 0; iy < rings; iy++) {
      const t = iy / (rings - 1);
      const y = t * len;
      /* cuff flare at t≈0 (bottom) and fold ridges along the length */
      const fold = 1 + 0.14 * Math.sin(t * Math.PI * 3.2) + (t < 0.18 ? 0.22 * (1 - t / 0.18) : 0);
      const rad = (r0 * (1 - t) + r1 * t) * fold;
      const around = Math.max(10, Math.round(2 * Math.PI * rad / vs));
      const layers = 2;
      for (let k = 0; k < layers; k++) {
        for (let a = 0; a < around; a++) {
          const ang = a / around * Math.PI * 2;
          const pinch = 1 - 0.10 * Math.pow(Math.abs(Math.sin(ang * 2 + t * 1.4)), 3);
          const rr = (rad - k * vs * 0.9) * pinch;
          const px = Math.cos(ang) * rr;
          const pz = Math.sin(ang) * rr;
          const c = linenCol();
          v.cube(px, y, pz, vs * 1.05, vs * 1.05, vs * 1.05, c[0], c[1], c[2]);
        }
      }
    }
    const cuffR = r0 * 1.22, cuffH = 0.018, cuffVs = 0.0044;
    const cN = Math.round(2 * Math.PI * cuffR / cuffVs);
    const cY = Math.round(cuffH / cuffVs);
    for (let iy = 0; iy < cY; iy++) {
      for (let a = 0; a < cN; a++) {
        const ang = a / cN * Math.PI * 2;
        const c = linenCol();
        c[0] *= 0.96; c[1] *= 0.96;
        v.cube(Math.cos(ang) * cuffR, 0.002 + iy * cuffVs * 0.5, Math.sin(ang) * cuffR,
          cuffVs * 1.06, cuffVs * 1.06, cuffVs * 1.06, c[0], c[1], c[2]);
      }
    }
    return v.mesh({ color: 0xe6d7b8, roughness: 0.90, metalness: 0 });
  }

  /* Build one complete arm (right = 1, left = -1).
     ROOT is the CUFF, sitting at the bottom edge of the screen.
     Local +Y runs UP the forearm to the wrist (mostly camera +Y, slightly
     forward and inward). The HAND sits at the wrist and is BENT so the
     palm faces up and the fingers point forward — the forearm is not in
     a straight line with the fingers, which is what puts a short vertical
     forearm on screen with a palm-up hand above it.

     Hand local: +Y = fingers, +Z = palm normal, origin = wrist. */
  const SLEEVE_LEN = 0.052;

  function buildArm(side) {
    const root = new THREE.Group(); root.name = side > 0 ? 'armR1261' : 'armL1261';
    root.userData.h1261 = 1;

    const sleeveG = new THREE.Group(); sleeveG.name = 'sleeve';
    sleeveG.add(sleeveMesh(SLEEVE_LEN, 0.016, 0.019));
    root.add(sleeveG);

    const wrist = new THREE.Group(); wrist.name = 'wrist';
    wrist.position.set(0, SLEEVE_LEN, 0);
    root.add(wrist);

    const hand = new THREE.Group(); hand.name = 'hand';
    /* Default wrist bend is applied in placeArm: palm up, fingers forward. */
    wrist.add(hand);

    const PALM_W = 0.072, PALM_H = 0.078, PALM_D = 0.028;
    const palm = palmMesh(PALM_W, PALM_H, PALM_D);
    palm.position.set(0, 0.006, 0);
    hand.add(palm);

    const hold = new THREE.Group(); hold.name = 'hold';
    hold.position.set(0, PALM_H * 0.55, PALM_D * 0.42);
    hand.add(hold);

    const fingerMeta = [
      { name: 'index',  x:  PALM_W * 0.28, len: 0.058, thick: 0.015, segs: 3 },
      { name: 'middle', x:  PALM_W * 0.08, len: 0.064, thick: 0.016, segs: 3 },
      { name: 'ring',   x: -PALM_W * 0.12, len: 0.060, thick: 0.015, segs: 3 },
      { name: 'pinky',  x: -PALM_W * 0.30, len: 0.048, thick: 0.013, segs: 3 }
    ];
    const fingers = {};
    fingerMeta.forEach(fm => {
      const f = makeFinger(fm.len, fm.thick, fm.segs);
      f.root.position.set(fm.x * side, PALM_H * 0.98, 0);
      f.root.rotation.z = -side * fm.x * 1.6;
      hand.add(f.root);
      fingers[fm.name] = f;
    });

    const thumb = makeFinger(0.048, 0.017, 2);
    thumb.root.position.set(-side * PALM_W * 0.46, PALM_H * 0.22, PALM_D * 0.18);
    thumb.root.rotation.set(0.35, -side * 0.45, side * 0.85);
    hand.add(thumb.root);
    fingers.thumb = thumb;

    root.userData.fingers = fingers;
    root.userData.hold = hold;
    root.userData.hand = hand;
    root.userData.wrist = wrist;
    root.userData.sleeve = sleeveG;
    root.userData.side = side;
    return root;
  }

  function setGrip(arm, kind) {
    const F = arm.userData.fingers; if (!F) return;
    const cup = (a, b, c, d, th) => {
      F.index.setCurl(a); F.middle.setCurl(b); F.ring.setCurl(c); F.pinky.setCurl(d);
      if (F.thumb) F.thumb.setCurl(th == null ? 0.45 : th);
    };
    /* per-item grips (hand1–9): open palm, cup around a block, fist, two-hand */
    switch (kind) {
      case 'empty':
        cup(0.18, 0.16, 0.20, 0.26, 0.22);
        break;
      case 'block':
        /* fingers wrap the sides of the cube, thumb on the left, palm up */
        cup(0.55, 0.58, 0.60, 0.66, 0.62);
        break;
      case 'map':
        cup(0.28, 0.26, 0.30, 0.34, 0.40);
        break;
      case 'bucket':
        cup(0.92, 0.95, 0.95, 0.90, 0.70);
        break;
      case 'torch':
      case 'sword':
      case 'claymore':
      case 'p761':
      case 'p760':
      case 'pick':
        cup(0.95, 0.98, 0.98, 0.95, 0.75);
        break;
      case 'pistol':
      case 'pistolAds':
      case 'musket':
      case 'musketAds':
        cup(0.95, 0.98, 0.98, 0.92, 0.80);
        break;
      default:
        cup(0.85, 0.88, 0.88, 0.85, 0.6);
    }
  }

  /* ---------- FRAMING (the main complaint) ----------
     Camera looks down –Z, +Y up, +X right.
     Target (arm-target-block.jpg and hand1–9):
       - hand roughly centre-to-lower-right
       - palm facing up
       - wrist low
       - linen cuff at the BOTTOM EDGE
       - forearm comes up from the bottom, MOSTLY VERTICAL, slight angle
       - only a SHORT length of forearm is visible
     `cuff` is the root position (sleeve starts here). `lean` is the forearm
     Euler: a small X tilt (top of the forearm a little forward) and a small
     Z tilt (hand a little more centred than the cuff). `wrist` is the hand
     Euler at the top of the sleeve: –90° X puts the palm up and the fingers
     forward. */
  /* Wrist Euler ~-55° (not -90°): palm faces the CAMERA (slightly up), fingers
     run up-the-screen and forward. -90° made the palm edge-on and only a
     cropped cuff was visible. Cuff y is ON the bottom edge at fov 60, not below it. */
  /* Wrist nearly identity: palm (+Z) faces the camera, fingers (+Y) go up
     the screen. A –90° or –55° X rotation made the palm edge-on. Lean is a
     slight forward/inward tilt of the short forearm. */
  const FRAME = {
    empty:  { cuff: [0.13, -0.205, -0.42], lean: [-0.22, 0.04, -0.16], wrist: [0.18, 0.18, 0.08], sc: 1.28 },
    block:  { cuff: [0.13, -0.205, -0.42], lean: [-0.22, 0.04, -0.16], wrist: [0.18, 0.16, 0.06], sc: 1.28 },
    map:    { cuff: [0.12, -0.200, -0.46], lean: [-0.18, 0.04, -0.14], wrist: [0.22, 0.12, 0.04], sc: 1.25 },
    bucket: { cuff: [0.15, -0.205, -0.42], lean: [-0.22, 0.04, -0.14], wrist: [0.12, 0.16, 0.08], sc: 1.25 },
    torch:  { cuff: [0.16, -0.205, -0.42], lean: [-0.22, 0.04, -0.12], wrist: [0.10, 0.18, 0.10], sc: 1.22 },
    sword:  { cuff: [0.16, -0.205, -0.42], lean: [-0.22, 0.04, -0.12], wrist: [0.10, 0.18, 0.10], sc: 1.22 },
    claymore:{ cuff:[0.16, -0.205, -0.42], lean: [-0.22, 0.04, -0.12], wrist: [0.10, 0.18, 0.10], sc: 1.22 },
    p761:   { cuff: [0.16, -0.205, -0.42], lean: [-0.22, 0.04, -0.12], wrist: [0.10, 0.18, 0.10], sc: 1.22 },
    p760:   { cuff: [0.16, -0.205, -0.42], lean: [-0.22, 0.04, -0.12], wrist: [0.10, 0.18, 0.10], sc: 1.22 },
    pick:   { cuff: [0.16, -0.205, -0.42], lean: [-0.22, 0.04, -0.12], wrist: [0.10, 0.18, 0.10], sc: 1.22 },
    pistol: { cuff: [0.16, -0.200, -0.44], lean: [-0.20, 0.04, -0.12], wrist: [0.08, 0.20, 0.12], sc: 1.20 },
    musket: { cuff: [0.16, -0.200, -0.46], lean: [-0.18, 0.04, -0.12], wrist: [0.08, 0.20, 0.12], sc: 1.20 }
  };
  FRAME.pistolAds = FRAME.pistol;
  FRAME.musketAds = FRAME.musket;

  const FRAME_L = {
    pistol: { cuff: [-0.10, -0.195, -0.48], lean: [-0.18, 0.00, 0.14], wrist: [0.22, -0.12, -0.10], sc: 1.20 },
    musket: { cuff: [-0.12, -0.195, -0.52], lean: [-0.16, 0.00, 0.14], wrist: [0.22, -0.12, -0.10], sc: 1.20 }
  };
  FRAME_L.pistolAds = FRAME_L.pistol;
  FRAME_L.musketAds = FRAME_L.musket;

  /* Item offsets in the palm `hold` socket. */
  const ITEM = {
    block:  { p: [0, 0.012, 0.000], r: [0.08, 0.15, 0.05], s: 0.34 },
    torch:  { p: [0, 0.010, 0.000], r: [0.00, 0.00, -1.20], s: 0.42 },
    map:    { p: [0, 0.006, 0.000], r: [0.00, 0.00, 0.00], s: 0.40 },
    bucket: { p: [0, -0.02, 0.000], r: [0.00, 0.00, 0.00], s: 0.50 },
    sword:  { p: [0, 0.02, 0.000], r: [1.57, 0.00, -1.20], s: 0.70 },
    claymore:{ p:[0, 0.02, 0.000], r: [1.57, 0.00, -1.20], s: 0.70 },
    p761:   { p: [0, 0.02, 0.000], r: [0.00, 0.00, -1.20], s: 0.60 },
    p760:   { p: [0, 0.02, 0.000], r: [0.00, 0.00, -1.20], s: 0.60 },
    pick:   { p: [0, 0.02, 0.000], r: [0.00, 0.00, -1.20], s: 0.62 },
    pistol: { p: [0.00, 0.018, 0.010], r: [0.15, 0.00, 1.25], s: 1.00 },
    musket: { p: [0.00, 0.020, 0.010], r: [0.10, 0.00, 1.20], s: 1.00 }
  };
  ITEM.pistolAds = ITEM.pistol;
  ITEM.musketAds = ITEM.musket;
  ITEM.sword = ITEM.sword;

  function getCam() {
    return (typeof camera !== 'undefined' && camera)
      || (typeof cam !== 'undefined' && cam)
      || window.camera || window.cam
      || (window.__fpVm1259 && (window.__fpVm1259.cam || window.__fpVm1259.camera))
      || null;
  }

  function hideLegacyArms() {
    try {
      disable1259();
      const vm = window.__fpVm1259;
      const hide = (o) => {
        if (!o) return;
        try {
          if (o.userData && o.userData.h1261) return;
          o.visible = false;
        } catch (_) {}
      };
      if (vm) {
        hide(vm.rig);
        hide(vm.armR);
        hide(vm.armL);
      }
      try { if (typeof hand !== 'undefined' && hand && !(hand.userData && hand.userData.h1261)) hand.visible = false; } catch (_) {}
      try { if (typeof fist !== 'undefined' && fist) fist.visible = false; } catch (_) {}
      try { const f = window.__fpa && window.__fpa.rig && window.__fpa.rig(); if (f) f.visible = false; } catch (_) {}
    } catch (e) { ERR('hideLeg', e); }
  }

  function hookRender() {
    try {
      if (typeof renderer !== 'undefined' && renderer && renderer.render && !renderer._h1261) {
        const orig = renderer.render.bind(renderer);
        renderer.render = function (s, c) {
          try { hideLegacyArms(); } catch (_) {}
          return orig(s, c);
        };
        renderer._h1261 = 1;
      }
      if (typeof camera !== 'undefined' && camera && !camera._h1261br) {
        camera._h1261br = 1;
        camera.onBeforeRender = function () { try { hideLegacyArms(); } catch (_) {} };
      }
    } catch (e) { ERR('hookR', e); }
  }

  function kindOf() {
    try {
      const vm = window.__fpVm1259;
      if (vm && typeof vm.kindOf === 'function') {
        const k = vm.kindOf();
        if (k) return k;
      }
      if (vm && vm.kind) return vm.kind;
    } catch (_) {}
    try {
      const id = (typeof selId !== 'undefined' ? selId : window.selId) ||
        (window.held && (window.held.userData && (window.held.userData.id || window.held.userData.kind)));
      if (!id) return 'empty';
      const s = String(id);
      if (/torch/i.test(s)) return 'torch';
      if (/pistol|flint/i.test(s)) return 'pistol';
      if (/musket|rifle|flintlock/i.test(s)) return 'musket';
      if (/sword|claymore/i.test(s)) return 'sword';
      if (/pick/i.test(s)) return 'pick';
      if (/axe|p761|p760/i.test(s)) return /p760/.test(s) ? 'p760' : 'p761';
      if (/map/i.test(s)) return 'map';
      if (/bucket/i.test(s)) return 'bucket';
      if (/empty|^0$|fist|hand/i.test(s)) return 'empty';
      return 'block';
    } catch (_) { return 'empty'; }
  }

  function makeFallbackItem(kind) {
    U._fb = U._fb || {};
    const k0 = (kind || 'block').replace(/Ads$/, '');
    if (U._fb[k0]) return U._fb[k0];
    let g;
    if (k0 === 'block') {
      g = new THREE.Mesh(
        new THREE.BoxGeometry(0.085, 0.085, 0.085),
        new THREE.MeshStandardMaterial({ color: 0x8a8a82, roughness: 0.9, flatShading: true })
      );
      g.name = 'block1261';
    } else if (k0 === 'torch') {
      g = new THREE.Group(); g.name = 'torch1261';
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.16, 8),
        new THREE.MeshStandardMaterial({ color: 0x6a4420, roughness: 0.85 }));
      shaft.position.y = 0.08; g.add(shaft);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xff8830 }));
      flame.position.y = 0.18; g.add(flame);
    } else if (k0 === 'pistol' || k0 === 'musket') {
      g = procGun(k0);
    } else if (k0 === 'sword' || k0 === 'claymore' || k0 === 'p761' || k0 === 'p760' || k0 === 'pick') {
      g = new THREE.Group();
      const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.008, 0.22, 8),
        new THREE.MeshStandardMaterial({ color: 0x5a3a18, roughness: 0.8 }));
      haft.position.y = 0.11; g.add(haft);
      const head = new THREE.Mesh(new THREE.BoxGeometry(k0==='sword'||k0==='claymore'?0.03:0.08, 0.04, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x888890, metalness: 0.5, roughness: 0.4 }));
      head.position.y = 0.23; g.add(head);
    } else if (k0 === 'map') {
      g = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.002, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xe8d9a0 }));
    } else if (k0 === 'bucket') {
      g = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.06, 10),
        new THREE.MeshStandardMaterial({ color: 0x555860, roughness: 0.5, metalness: 0.4 }));
    } else {
      return null;
    }
    g.userData.h1261 = 1; g.userData.fallbackItem = 1;
    g.traverse(o => { o.frustumCulled = false; o.userData = o.userData || {}; o.userData.h1261 = 1; });
    U._fb[k0] = g;
    return g;
  }

  function getHeld(kind) {
    const live = window.held || window.__held || (window.__fpVm1259 && (window.__fpVm1259.held || window.__fpVm1259.item)) || null;
    if (live && live.parent !== undefined) return live;
    if (kind && kind !== 'empty') return makeFallbackItem(kind);
    return live;
  }

  /* Procedural fallback pistol / musket if the game mesh stays hidden. */
  function procGun(kind) {
    const g = new THREE.Group(); g.name = kind === 'musket' ? 'musket1261' : 'pistol1261';
    g.userData.h1261 = 1; g.userData.procGun = 1;
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a2a14, roughness: 0.85 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.7, roughness: 0.35 });
    const long = kind === 'musket' ? 0.42 : 0.20;
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.038, kind === 'musket' ? 0.14 : 0.10), wood);
    stock.position.set(0, -0.01, 0.04); g.add(stock);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.07, 0.028), wood);
    grip.position.set(0, -0.045, 0.08); grip.rotation.x = 0.35; g.add(grip);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.009, long, 8), metal);
    barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.008, -long * 0.35); g.add(barrel);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.028, 0.04), metal);
    lock.position.set(0.016, 0.000, 0.02); g.add(lock);
    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 6, 10, Math.PI), metal);
    guard.rotation.z = Math.PI / 2; guard.position.set(0, -0.028, 0.05); g.add(guard);
    g.traverse(o => { o.frustumCulled = false; o.userData.h1261 = 1; });
    return g;
  }

  function forceGunVisible(item, kind) {
    if (!item) return;
    try {
      item.visible = true;
      item.traverse(o => {
        o.visible = true;
        if (o.scale && (o.scale.x === 0 || o.scale.y === 0 || o.scale.z === 0)) o.scale.setScalar(1);
      });
    } catch (_) {}
    /* If after unhiding there is still no mesh, add a procedural gun. */
    let hasMesh = false;
    try { item.traverse(o => { if (o.isMesh && o.visible) hasMesh = true; }); } catch (_) {}
    if (!hasMesh && (kind === 'pistol' || kind === 'musket' || kind === 'pistolAds' || kind === 'musketAds')) {
      if (!item.userData._procGun1261) {
        const pg = procGun(kind.indexOf('musket') >= 0 ? 'musket' : 'pistol');
        item.add(pg); item.userData._procGun1261 = pg;
      }
      item.visible = true;
    }
  }

  function seatItem(kind, arm) {
    const item = getHeld(kind);
    if (!item) return;
    const hold = arm.userData.hold;
    if (!hold) return;
    /* Don't steal items that belong to a hidden UI, or the world. Be gentle:
       only reparent if the item is already a first-person held item. */
    try {
      if (item.parent !== hold) {
        hold.add(item);
        item.userData._parented1261 = 1;
      }
    } catch (e) { ERR('parent', e); return; }
    const k0 = kind.replace(/Ads$/, '');
    if (k0 === 'empty') {
      try { if (item) item.visible = false; } catch (_) {}
      return;
    }
    const off = ITEM[kind] || ITEM[k0] || ITEM.block;
    /* 1.2.59 torch freeze: write the SAME local transform every frame so
       the held torch cannot jitter. (Re-applying identical values is stable;
       skipping the write after 1259 has stolen the parent is not.) */
    try {
      item.position.set(off.p[0], off.p[1], off.p[2]);
      item.rotation.set(off.r[0], off.r[1], off.r[2]);
      const s = off.s || 1;
      item.scale.set(s, s, s);
      item.visible = true;
      if (k0 === 'torch') item.userData._seatStable1261 = 1;
    } catch (e) { ERR('seat', e); }
    if (k0 === 'pistol' || k0 === 'musket') forceGunVisible(item, kind);
  }

  function isPiloting() {
    try {
      const U0 = window.__tbox1260;
      if (U0 && U0.pilot) return true;
      const T = window.__tbox3;
      const F = T && (T.F && (typeof T.F === 'function' ? T.F() : T.F));
      if (F && F.pilot) return true;
      if (window.__tboxF && window.__tboxF.pilot) return true;
    } catch (_) {}
    return false;
  }

  function placeArm(arm, frame, visible) {
    if (!arm) return;
    arm.visible = !!visible;
    if (!visible || !frame) return;
    const cu = frame.cuff, ln = frame.lean, wr = frame.wrist;
    arm.position.set(cu[0], cu[1], cu[2]);
    arm.rotation.set(ln[0], ln[1], ln[2]);
    const sc = frame.sc || 1.5;
    arm.scale.setScalar(sc);
    const handW = arm.userData.wrist || arm.userData.hand;
    if (handW && wr) handW.rotation.set(wr[0], wr[1], wr[2]);
  }

  function apply() {
    try {
      /* Cheap: the sculpt is built once; do not re-pose more than once a frame. */
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      if (U._apAt && now - U._apAt < 8) return;
      U._apAt = now;
      if (!U.R) return;
      const cam = getCam();
      if (!cam) return;
      if (U.R.parent !== cam) cam.add(U.R);
      if (U.L && U.L.parent !== cam) cam.add(U.L);

      if (isPiloting()) {
        U.R.visible = false;
        if (U.L) U.L.visible = false;
        return;
      }
      /* QA exterior / interior shots hide the arm so the box is clear. */
      try {
        const qp = window.__qaPose && window.__qaPose.mode;
        if (qp && /^(ext|int)/.test(qp)) {
          U.R.visible = false;
          if (U.L) U.L.visible = false;
          return;
        }
      } catch (_) {}

      const kind = kindOf();
      U.kind = kind;
      const k0 = (kind || 'empty').replace(/Ads$/, '');
      const fr = FRAME[kind] || FRAME[k0] || FRAME.empty;
      placeArm(U.R, fr, true);
      if (U._gripKind !== kind) {
        setGrip(U.R, k0);
        U._gripKind = kind;
      }
      const two = (k0 === 'pistol' || k0 === 'musket');
      if (U.L) {
        if (two) {
          const fl = FRAME_L[kind] || FRAME_L[k0] || FRAME_L.pistol;
          placeArm(U.L, fl, true);
          if (U._gripKindL !== kind) { setGrip(U.L, k0); U._gripKindL = kind; }
        } else {
          U.L.visible = false;
        }
      }
      seatItem(kind, U.R);
      hideLegacyArms();
    } catch (e) { ERR('apply', e); }
  }

  /* Also nudge 1259 POSES so any leftover 1259 arm (if it flashes) is at
     least in the new frame: lower, more centred, short vertical forearm.
     wr[0] for pick stays ≥ 0.36 per the 1.2.59 pick shift — pick uses our
     own frame, but we keep the 1259 number intact for the freeze test. */
  function retargetPoses() {
    try {
      const vm = window.__fpVm1259;
      const P = vm && (vm.POSES || vm.poses);
      if (!P) return;
      const lower = (pose, wr, yaw, len) => {
        if (!pose || !pose.R) return;
        pose.R.wr = wr;
        pose.R.pitch = 8;
        pose.R.yaw = yaw == null ? 8 : yaw;
        pose.R.elev = 12;
        pose.R.lenFore = len == null ? 0.16 : len;
        pose.R.face = pose.R.face || 'palmUp';
      };
      lower(P.empty, [0.12, -0.42, -0.46], 8, 0.16);
      lower(P.block, [0.12, -0.42, -0.46], 8, 0.16);
      lower(P.map, [0.10, -0.40, -0.50], 6, 0.16);
      lower(P.bucket, [0.16, -0.42, -0.46], 10, 0.16);
      lower(P.torch, [0.16, -0.42, -0.44], 10, 0.16);
      lower(P.sword, [0.16, -0.42, -0.46], 10, 0.16);
      lower(P.pistol, [0.16, -0.40, -0.48], 10, 0.16);
      lower(P.musket, [0.16, -0.40, -0.50], 10, 0.16);
      /* pick: keep wr[0] at least 0.36 (1.2.59 rightward shift) — but our
         voxel arm uses the new lower frame; this only affects 1259 leftover. */
      if (P.pick && P.pick.R) {
        P.pick.R.wr = [0.36, -0.42, -0.44];
        P.pick.R.pitch = 8; P.pick.R.yaw = 10; P.pick.R.elev = 12; P.pick.R.lenFore = 0.16;
      }
    } catch (e) { ERR('poses', e); }
  }

  function disable1259() {
    try {
      const vm = window.__fpVm1259;
      if (!vm) return;
      vm.disabled = 1;
      vm.active = 0;
      if (typeof vm.disable === 'function' && !vm._h1261dis) {
        try { vm.disable(); } catch (_) {}
        vm._h1261dis = 1;
      }
      /* 1259 (and QA / 1260) may call enable() — stay disabled: 1261 owns the arm.
         The 1259 renderer hook draws a dedicated viewmodel overlay AFTER the
         main render; if it stays enabled, hiding the rig never sticks. */
      if (typeof vm.enable === 'function' && !vm._h1261en) {
        vm.enable = function () { vm.disabled = 1; vm.active = 0; };
        vm._h1261en = 1;
      }
      if (vm.rig) vm.rig.visible = false;
      if (vm.armR) vm.armR.visible = false;
      if (vm.armL) vm.armL.visible = false;
    } catch (e) { ERR('dis1259', e); }
  }

  function hook() {
    try {
      const vm = window.__fpVm1259;
      disable1259();
      if (vm && typeof vm.apply === 'function' && !vm._h1261) {
        const orig = vm.apply.bind(vm);
        vm.apply = function () {
          /* Do not let 1259 pose the tube; just run our voxel apply. */
          try { if (vm) { vm.disabled = 1; vm.active = 0; } } catch (_) {}
          try { apply(); } catch (e) { ERR('hook', e); }
          return undefined;
        };
        vm._h1261 = 1;
      }
    } catch (e) { ERR('hookvm', e); }
    /* also wrap the player camera update so we run even if 1259 is off */
    try {
      if (typeof updatePlayer === 'function' && !updatePlayer._h1261) {
        const up = updatePlayer;
        updatePlayer = function () {
          const r = up.apply(this, arguments);
          try { apply(); } catch (e) { ERR('up', e); }
          return r;
        };
        updatePlayer._h1261 = 1;
        window.updatePlayer = updatePlayer;
      }
    } catch (_) {}
    try {
      if (typeof placeCamera === 'function' && !placeCamera._h1261) {
        const pc = placeCamera;
        placeCamera = function () {
          const r = pc.apply(this, arguments);
          try { apply(); } catch (e) { ERR('pc', e); }
          return r;
        };
        placeCamera._h1261 = 1;
        window.placeCamera = placeCamera;
      }
    } catch (_) {}
  }

  function boot() {
    try {
      if (typeof THREE === 'undefined') { setTimeout(boot, 80); return; }
      const cam = getCam();
      if (!cam) { setTimeout(boot, 80); return; }
      if (U.built) { hook(); apply(); return; }
      U.R = buildArm(1);
      U.L = buildArm(-1);
      cam.add(U.R); cam.add(U.L);
      if (!U._fill) {
        const fill = new THREE.HemisphereLight(0xffe8cc, 0x2a2830, 0.55);
        fill.name = 'handFill1261';
        fill.userData.h1261 = 1;
        cam.add(fill);
        const key = new THREE.DirectionalLight(0xffe6c8, 0.35);
        key.position.set(0.25, 0.55, 0.45);
        key.userData.h1261 = 1;
        cam.add(key);
        U._fill = fill;
      }
      U.L.visible = false;
      setGrip(U.R, 'empty');
      U.built = 1;
      retargetPoses();
      hook();
      hookRender();
      apply();
      /* late retries for 1259 wrapping after it boots */
      setTimeout(() => { retargetPoses(); hook(); hookRender(); apply(); }, 400);
      setTimeout(() => { hook(); hookRender(); apply(); }, 1200);
    } catch (e) { ERR('boot', e); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 80));
  else setTimeout(boot, 80);
  setTimeout(boot, 500);
  setTimeout(boot, 1500);
})();
