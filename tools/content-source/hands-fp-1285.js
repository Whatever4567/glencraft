/* GLX-HANDSFP1285 (v1.2.85): first-person uses the actual third-person
   GLOVE hand mesh (HeadSkin, 1.2.83 crease/knuckle/nail shading) attached
   to the existing __fpa wrist, coming out of the cream linen cuff.
   Old box/tube __fpa hand and finger pieces are hidden, not deleted.
   Finger bones curl around each held item. Arm animations, item
   positions and torch/pick jitter are unchanged. Third-person is not
   patched. */
(function handsFp1285() {
  const W = window;
  const U = W.__handsFp1285 = {
    err: null, on: 1, version: '1.2.85-tp-hand',
    attached: 0, hidden: 0, loaded: 0, kind: '',
    tune: { scale: 1, x: 0, y: -0.012, z: 0, rx: 0, ry: 3.14159, rz: 0 },
    /* Per-kind wrap offset on top of tune, in p.h space (Y along fingers). */
    seat: {
      empty:  { x: 0, y: 0.00, z: 0.00 },
      block:  { x: 0, y: -0.03, z: 0.03 },
      bucket: { x: 0, y: 0.01, z: 0.00 },
      torch:  { x: 0, y: 0.01, z: 0.00 },
      sword:  { x: 0, y: 0.02, z: 0.00 },
      pick:   { x: 0, y: 0.03, z: 0.00 },
      p761:   { x: 0, y: 0.03, z: 0.00 },
      p760:   { x: 0, y: 0.03, z: 0.00 },
      pistol: { x: 0, y: 0.02, z: 0.01 },
      musket: { x: 0, y: 0.02, z: 0.01 },
      map:    { x: 0, y: 0.01, z: 0.02 }
    }
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 260); };

  const FINGER = /^(finger[LR]\d\d\d|thumb[LR]\d\d)$/;
  const HANDB = /^hand[LR]$/;
  const TIP = /^(finger[LR]\d02|thumb[LR]02)$/;
  const sideOf = nm => { const m = /^[a-z]+([LR])/.exec(nm || ''); return m ? m[1] : 'R'; };
  const norm = n => String(n || '').replace(/\./g, '');

  /* Extra rotateX (and thumb Y/Z) on top of the bind pose, in radians.
     Negative X continues the rest-pose curl toward the palm. */
  const S = -1;
  const fist = (a, tY) => ({
    p: [1.20, 1.25, 1.25, 1.15].map(v => S * v),
    d: [1.05, 1.10, 1.10, 1.00].map(v => S * v),
    t: [0.85 * S, 0.65 * S], tY: tY == null ? 0.35 : tY, tZ: 0.18
  });
  const POSES = {
    empty: {
      p: [0.22, 0.28, 0.34, 0.44].map(v => S * v),
      d: [0.18, 0.22, 0.28, 0.34].map(v => S * v),
      t: [0.12 * S, 0.16 * S], tY: 0.12, tZ: 0.06
    },
    block: {
      p: [0.70, 0.80, 0.82, 0.72].map(v => S * v),
      d: [0.55, 0.62, 0.64, 0.55].map(v => S * v),
      t: [0.45 * S, 0.35 * S], tY: 0.22, tZ: 0.12
    },
    bucket: fist(1, 0.40),
    torch: fist(1, 0.36),
    sword: fist(1, 0.36),
    pick: fist(1, 0.40),
    p761: fist(1, 0.40),
    p760: fist(1, 0.40),
    axe: fist(1, 0.36),
    shovel: fist(1, 0.36),
    hoe: fist(1, 0.36),
    /* Index slightly open for the trigger; thumb over the grip. */
    pistol: {
      p: [0.32, 1.15, 1.20, 1.10].map(v => S * v),
      d: [0.22, 1.00, 1.05, 0.95].map(v => S * v),
      t: [0.50 * S, 0.30 * S], tY: 0.28, tZ: 0.08
    },
    musket: {
      p: [0.38, 1.10, 1.15, 1.05].map(v => S * v),
      d: [0.24, 0.95, 1.00, 0.90].map(v => S * v),
      t: [0.52 * S, 0.32 * S], tY: 0.22, tZ: 0.08
    },
    map: {
      p: [0.42, 0.44, 0.48, 0.50].map(v => S * v),
      d: [0.32, 0.34, 0.36, 0.38].map(v => S * v),
      t: [0.28 * S, 0.18 * S], tY: 0.06, tZ: 0.04
    },
    support: {
      p: [0.70, 0.76, 0.80, 0.74].map(v => S * v),
      d: [0.50, 0.55, 0.55, 0.50].map(v => S * v),
      t: [0.40 * S, 0.28 * S], tY: 0.18, tZ: 0.10
    }
  };
  POSES.default = POSES.empty;

  const KIND_BY_ID = {
    0: 'empty', 1: 'block', 2: 'block', 10: 'block', 12: 'block',
    39: 'bucket', 48: 'bucket', 201: 'bucket',
    67: 'torch', 257: 'torch',
    94: 'sword', 42: 'sword', 43: 'sword', 98: 'sword', 126: 'sword', 266: 'sword', 217: 'sword',
    212: 'pistol', 213: 'musket', 410: 'map',
    761: 'p761', 760: 'p760',
    40: 'pick', 41: 'pick', 92: 'pick', 96: 'pick', 124: 'pick', 264: 'pick'
  };

  function T3() { return (typeof THREE !== 'undefined' && THREE) || W.THREE || null; }

  function currentKind() {
    let id = 0, got = 0;
    try { if (typeof selId !== 'undefined') { id = selId; got = 1; } } catch (_) {}
    if (got && (id === 0 || id === '0' || !id)) return 'empty';
    id = +id;
    if (KIND_BY_ID[id]) return KIND_BY_ID[id];
    try {
      const list = (typeof ITEM !== 'undefined' && ITEM) || (typeof ITEMS !== 'undefined' && ITEMS);
      const rec = list && (list[id] || (list.find && list.find(function (x) { return x && x.id === id; })));
      if (rec && rec.kind) return rec.kind;
    } catch (_) {}
    return id ? 'block' : 'empty';
  }

  function rig() {
    try { return W.__fpa && typeof W.__fpa.rig === 'function' ? W.__fpa.rig() : null; } catch (_) { return null; }
  }

  function isHeldItem(o) {
    let x = o, heldObj = null;
    try { if (typeof held !== 'undefined') heldObj = held; } catch (_) {}
    for (let i = 0; i < 8 && x; i++) {
      if (heldObj && x === heldObj) return true;
      const n = x.name || '';
      if (n === 'held' || n === 'grabHaggis') return true;
      x = x.parent;
    }
    return false;
  }

  /* Hide (do not delete) every old box/tube hand mesh under p.h.
     Later sculpts keep setting .visible back to true each frame, so
     lock the property once the first time we hide a mesh. */
  function lockHidden(o) {
    if (o.userData && o.userData.__fpHideLock) return;
    o.userData = o.userData || {};
    o.userData.__fpHideLock = 1;
    try { o.visible = false; } catch (_) {}
    try {
      Object.defineProperty(o, 'visible', {
        get: function () { return false; },
        set: function () {},
        configurable: true,
        enumerable: true
      });
    } catch (_) { try { o.visible = false; } catch (e2) {} }
    U.hidden++;
  }
  function hideOld(h) {
    if (!h) return;
    h.traverse(function (o) {
      if (!o.isMesh) return;
      if (o.userData && o.userData.fpTpHand1285) {
        try { if (o.visible === false) o.visible = true; } catch (_) {}
        return;
      }
      if (isHeldItem(o)) return;
      lockHidden(o);
    });
  }

  function hideBoth() {
    try {
      const R = rig(); if (!R || !R.userData) return;
      if (R.userData.R && R.userData.R.userData && R.userData.R.userData.p) hideOld(R.userData.R.userData.p.h);
      if (R.userData.L && R.userData.L.userData && R.userData.L.userData.p) hideOld(R.userData.L.userData.p.h);
    } catch (e) { ERR('hide', e); }
  }

  /* ---- 1.2.83 crease / nail / knuckle bake + skin shader (clone only) ---- */
  function bake(mesh, T) {
    const g = mesh.geometry;
    if (!g || g.userData.handsTp1282 || !g.attributes.skinIndex || !mesh.skeleton) return !!(g && g.userData.handsTp1282);
    const bones = mesh.skeleton.bones, inv = mesh.skeleton.boneInverses;
    const names = bones.map(b => norm(b.name || ''));
    const pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const n = pos.count;
    const crease = new Float32Array(n), nail = new Float32Array(n), knk = new Float32Array(n);
    const v = new T.Vector3();
    const tipInfo = {};
    const handVerts = { L: [], R: [] };
    for (let i = 0; i < n; i++) {
      const b = si.getX(i), w = sw.getX(i), nm = names[b];
      if (w > 0.85 && TIP.test(nm)) {
        v.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix).applyMatrix4(inv[b]);
        const t = tipInfo[b] || (tipInfo[b] = { c: new T.Vector3(), n: 0, verts: [] });
        t.c.add(v); t.n++; t.verts.push(i);
      }
      if (w > 0.9 && HANDB.test(nm)) handVerts[sideOf(nm)].push(i);
    }
    const dorsalW = {};
    for (const side of ['L', 'R']) {
      const hv = handVerts[side]; if (hv.length < 12) continue;
      const c = new T.Vector3(); const p = new T.Vector3();
      for (const i of hv) { p.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix); c.add(p); } c.multiplyScalar(1 / hv.length);
      let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
      for (const i of hv) { p.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix).sub(c); xx += p.x * p.x; xy += p.x * p.y; xz += p.x * p.z; yy += p.y * p.y; yz += p.y * p.z; zz += p.z * p.z; }
      const M = new T.Matrix3().set(xx, xy, xz, xy, yy, yz, xz, yz, zz);
      let inv3; try { inv3 = new T.Matrix3().copy(M).invert(); } catch (_) { inv3 = null; }
      if (!inv3 || !isFinite(inv3.elements[0])) continue;
      const e = new T.Vector3(0.3, 0.5, 0.8);
      for (let k = 0; k < 30; k++) e.applyMatrix3(inv3).normalize();
      let tt = null;
      for (const b in tipInfo) if (names[b] === 'thumb' + side + '02') {
        tt = new T.Vector3();
        for (const i of tipInfo[b].verts) { p.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix); tt.add(p); }
        tt.multiplyScalar(1 / tipInfo[b].verts.length);
      }
      if (tt && tt.clone().sub(c).dot(e) > 0) e.negate();
      dorsalW[side] = e;
    }
    for (const b in tipInfo) {
      const t = tipInfo[b]; t.c.multiplyScalar(1 / t.n);
      t.len = t.c.length() * 2;
      t.axis = t.c.clone().normalize();
      const dw = dorsalW[sideOf(names[b])];
      if (dw) {
        const bw = new T.Matrix4().copy(inv[b]).multiply(mesh.bindMatrix);
        const m3 = new T.Matrix3().setFromMatrix4(bw);
        t.dorsal = dw.clone().applyMatrix3(m3).normalize();
      }
    }
    const p2 = new T.Vector3();
    for (let i = 0; i < n; i++) {
      const b0 = si.getX(i), b1 = si.getY(i), w0 = sw.getX(i), w1 = sw.getY(i);
      const n0 = names[b0], n1 = names[b1];
      const f0 = FINGER.test(n0) || HANDB.test(n0), f1 = FINGER.test(n1) || HANDB.test(n1);
      if (b0 !== b1 && (FINGER.test(n0) || FINGER.test(n1)) && (f0 || f1) && w1 > 0.05) {
        crease[i] = Math.min(1, Math.pow(4 * w0 * w1, 1.6));
      }
      const t = tipInfo[b0];
      if (t && w0 > 0.85 && t.dorsal) {
        p2.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix).applyMatrix4(inv[b0]);
        const along = p2.dot(t.axis) / Math.max(1e-4, t.len);
        const rad = p2.clone().sub(t.axis.clone().multiplyScalar(p2.dot(t.axis)));
        const rl = rad.length();
        const d = rl > 1e-5 ? rad.dot(t.dorsal) / rl : 0;
        const a = Math.max(0, Math.min(1, (along - 0.45) / 0.12)) * Math.max(0, Math.min(1, (0.95 - along) / 0.08));
        const s = Math.max(0, Math.min(1, (d - 0.6) / 0.25));
        nail[i] = Math.min(1, a * s * 1.2);
      }
      if (b0 !== b1 && ((HANDB.test(n0) && /01$/.test(n1)) || (HANDB.test(n1) && /01$/.test(n0)))) {
        const side = HANDB.test(n0) ? sideOf(n0) : sideOf(n1);
        const dw = dorsalW[side];
        if (dw) {
          const nr = g.attributes.normal;
          if (nr) { p2.fromBufferAttribute(nr, i).transformDirection(mesh.bindMatrix); knk[i] = Math.max(0, p2.dot(dw)) * Math.min(1, 4 * w0 * w1); }
        }
      }
    }
    g.setAttribute('aCrease1282', new T.BufferAttribute(crease, 1));
    g.setAttribute('aNail1282', new T.BufferAttribute(nail, 1));
    g.setAttribute('aKnk1282', new T.BufferAttribute(knk, 1));
    g.userData.handsTp1282 = 1;
    return true;
  }

  function patchMat(m) {
    if (!m || (m.onBeforeCompile && m.onBeforeCompile.__hands1282)) return;
    const prev = m.onBeforeCompile;
    const prevKey = m.customProgramCacheKey;
    m.onBeforeCompile = function (sh, r) {
      if (typeof prev === 'function') prev.call(this, sh, r);
      if (sh.vertexShader.indexOf('aCrease1282') >= 0) return;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aCrease1282;\nattribute float aNail1282;\nattribute float aKnk1282;\nvarying float vCrease1282;\nvarying float vNail1282;\nvarying float vKnk1282;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCrease1282 = aCrease1282; vNail1282 = aNail1282; vKnk1282 = aKnk1282;');
      let frag = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vCrease1282;\nvarying float vNail1282;\nvarying float vKnk1282;');
      frag = frag.replace('#include <lights_physical_fragment>', `
        {
          float cr = smoothstep(0.45, 1.0, vCrease1282);
          diffuseColor.rgb *= mix(vec3(1.0), vec3(0.80, 0.70, 0.66), cr);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.12 + vec3(0.03, 0.02, 0.02), clamp(vKnk1282 * 1.4, 0.0, 1.0));
          float nl = smoothstep(0.2, 0.7, vNail1282);
          vec3 nailC = diffuseColor.rgb * vec3(1.18, 1.05, 1.02) + vec3(0.07, 0.04, 0.04);
          nailC = mix(nailC, nailC + vec3(0.08, 0.07, 0.06), smoothstep(0.85, 1.0, vNail1282));
          diffuseColor.rgb = mix(diffuseColor.rgb, min(nailC, vec3(1.0)), nl * 0.7);
          roughnessFactor = mix(roughnessFactor, 0.28, smoothstep(0.2, 0.8, vNail1282));
          roughnessFactor = mix(roughnessFactor, min(1.0, roughnessFactor + 0.15), smoothstep(0.1, 0.9, vCrease1282));
        }
        #include <lights_physical_fragment>`);
      sh.fragmentShader = frag;
    };
    try { if (prev) for (const k of Object.keys(prev)) m.onBeforeCompile[k] = prev[k]; } catch (_) {}
    m.onBeforeCompile.__hands1282 = 1;
    m.customProgramCacheKey = function () {
      const k = typeof prevKey === 'function' ? prevKey.call(this) : '';
      return k + '|handsFp1285skin';
    };
    m.needsUpdate = true;
  }

  function isSkinMat(m) { return m && /Skin/i.test(m.name || ''); }

  /* ---- clone the loaded GLOVE + a bind-pose skeleton onto p.h ---- */
  function inSubtree(b, root) {
    let x = b;
    while (x) { if (x === root) return true; x = x.parent; }
    return false;
  }

  function buildSide(srcScene, srcMeshes, srcSkel, side, T) {
    srcScene.updateMatrixWorld(true);
    const srcBones = srcSkel.bones;
    const copies = [];
    const map = new Map();
    for (let i = 0; i < srcBones.length; i++) {
      const s = srcBones[i];
      const b = new T.Bone();
      b.name = norm(s.name);
      b.position.copy(s.position);
      b.quaternion.copy(s.quaternion);
      b.scale.copy(s.scale);
      map.set(s, b);
      copies.push(b);
    }
    for (let i = 0; i < srcBones.length; i++) {
      const s = srcBones[i];
      const kids = s.children || [];
      for (let k = 0; k < kids.length; k++) {
        const c = map.get(kids[k]);
        if (c) copies[i].add(c);
      }
    }
    const hand = copies.find(b => b.name === 'hand' + side);
    if (!hand) throw new Error('no hand' + side);

    /* Wrist at the wrapper origin: invert the bind-world of the source hand
       so the cloned hand bone sits at the __fpa wrist. */
    const wrap = new T.Group();
    wrap.name = 'fpTpHand' + side;
    wrap.userData.fpTpHand1285 = 1;
    const align = new T.Group();
    align.userData.fpTpHand1285 = 1;
    wrap.add(align);

    const srcHand = srcBones.find(b => norm(b.name) === 'hand' + side);
    const invH = new T.Matrix4().copy(srcHand.matrixWorld).invert();
    invH.decompose(align.position, align.quaternion, align.scale);

    /* Forest roots of the copied skeleton go under align. */
    for (let i = 0; i < srcBones.length; i++) {
      if (!srcBones[i].parent || !map.get(srcBones[i].parent)) align.add(copies[i]);
    }

    const newSkel = new T.Skeleton(copies);
    const outMeshes = [];
    for (let i = 0; i < srcMeshes.length; i++) {
      const src = srcMeshes[i];
      const mesh = src.clone();
      mesh.geometry = src.geometry.clone();
      mesh.material = Array.isArray(src.material) ? src.material.map(function (m) { return m.clone(); }) : src.material.clone();
      mesh.userData.fpTpHand1285 = 1;
      mesh.frustumCulled = false;
      mesh.castShadow = false;
      mesh.renderOrder = 2;
      mesh.position.set(0, 0, 0);
      mesh.quaternion.identity();
      mesh.scale.set(1, 1, 1);
      align.add(mesh);
      outMeshes.push(mesh);
    }
    /* Bind in the already-aligned space so the wrist sits at wrap origin. */
    align.updateMatrixWorld(true);
    for (let i = 0; i < outMeshes.length; i++) {
      const mesh = outMeshes[i];
      mesh.bind(newSkel);
      if (!mesh.geometry.attributes.aCrease1282) bake(mesh, T);
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (let j = 0; j < mats.length; j++) if (isSkinMat(mats[j])) patchMat(mats[j]);
    }

    const state = {
      wrap: wrap, align: align, skeleton: newSkel, meshes: outMeshes, side: side,
      prox: [], dist: [], thumb: [], hand: hand, names: copies.map(function (b) { return b.name; })
    };
    function findB(kind, idx, seg) {
      const mid = (idx == null || idx === '') ? '' : String(idx);
      const exact = kind + side + mid + seg;
      let b = copies.find(function (x) { return x.name === exact; });
      if (b) return b;
      const re = new RegExp('^' + kind + '[._]?' + side + '[._]?' + (mid ? mid + '[._]?' : '') + seg + '$', 'i');
      return copies.find(function (x) { return re.test(x.name); }) || null;
    }
    for (let i = 0; i < 4; i++) {
      state.prox[i] = findB('finger', i, '01');
      state.dist[i] = findB('finger', i, '02');
    }
    state.thumb[0] = findB('thumb', '', '01');
    state.thumb[1] = findB('thumb', '', '02');
    U['bones' + side] = {
      names: state.names.filter(function (n) { return /hand|finger|thumb/i.test(n); }),
      prox: state.prox.map(function (b) { return b && b.name; }),
      dist: state.dist.map(function (b) { return b && b.name; }),
      thumb: state.thumb.map(function (b) { return b && b.name; })
    };
    copies.forEach(function (b) {
      b.userData.bindQ = b.quaternion.clone();
    });
    return state;
  }

  function applyTune(state) {
    const t = U.tune;
    const seat = (U.seat && U.seat[U.kind]) || (U.seat && U.seat.empty) || {};
    state.wrap.position.set((t.x || 0) + (seat.x || 0), (t.y || 0) + (seat.y || 0), (t.z || 0) + (seat.z || 0));
    state.wrap.rotation.set((t.rx || 0) + (seat.rx || 0), (t.ry || 0) + (seat.ry || 0), (t.rz || 0) + (seat.rz || 0));
    const s = (seat.scale != null ? seat.scale : (t.scale == null ? 1 : t.scale));
    state.wrap.scale.setScalar(s);
  }

  function poseState(state, name) {
    const pose = POSES[name] || POSES.empty;
    function curl(bone, ax, ay, az) {
      if (!bone || !bone.userData.bindQ) return;
      bone.quaternion.copy(bone.userData.bindQ);
      if (ax) bone.rotateX(ax);
      if (ay) bone.rotateY(ay);
      if (az) bone.rotateZ(az);
    }
    for (let i = 0; i < 4; i++) {
      curl(state.prox[i], pose.p[i], 0, 0);
      curl(state.dist[i], pose.d[i], 0, 0);
    }
    const ty = state.side === 'L' ? -(pose.tY || 0) : (pose.tY || 0);
    const tz = state.side === 'L' ? -(pose.tZ || 0) : (pose.tZ || 0);
    curl(state.thumb[0], pose.t[0], ty, tz);
    curl(state.thumb[1], pose.t[1], 0, 0);
  }

  function poseKind(kind) {
    if (!U.sides) return;
    const right = POSES[kind] ? kind : 'empty';
    if (U.sides.R) poseState(U.sides.R, right);
    if (U.sides.L) {
      const left = (kind === 'pistol' || kind === 'musket') ? 'support' : right;
      poseState(U.sides.L, left);
    }
    U.kind = kind;
  }

  function attach() {
    if (U.attached || !U.src || !U.on) return;
    const T = T3(); if (!T) return;
    const R = rig();
    if (!R || !R.userData || !R.userData.R || !R.userData.R.userData || !R.userData.R.userData.p) return;
    try {
      U.sides = {};
      const arms = { R: R.userData.R, L: R.userData.L };
      for (const side of ['R', 'L']) {
        const arm = arms[side];
        if (!arm || !arm.userData || !arm.userData.p || !arm.userData.p.h) continue;
        const st = buildSide(U.src.scene, U.src.bySide[side], U.src.skel, side, T);
        applyTune(st);
        arm.userData.p.h.add(st.wrap);
        hideOld(arm.userData.p.h);
        U.sides[side] = st;
        U.attached++;
      }
      poseKind(currentKind());
      if (U.err === 'load no GLTFLoader') U.err = null;
    } catch (e) { ERR('attach', e); }
  }

  function collectGloves(root) {
    const bySide = { R: [], L: [] };
    let skel = null;
    root.traverse(function (o) {
      if (!o.isSkinnedMesh) return;
      const n = (o.name || '') + '|' + ((o.parent && o.parent.name) || '');
      let side = null;
      if (/visual_arm_slot0/.test(n) || /GLOVE\s*\|\s*R\b/.test(n)) side = 'R';
      else if (/visual_arm_slot1/.test(n) || /GLOVE\s*\|\s*L\b/.test(n)) side = 'L';
      if (!side) return;
      bySide[side].push(o);
      if (!skel && o.skeleton) skel = o.skeleton;
    });
    return { bySide: bySide, skel: skel, scene: root };
  }

  function onGltf(gltf) {
    try {
      const found = collectGloves(gltf.scene);
      if (!found.skel || (!found.bySide.R.length && !found.bySide.L.length)) {
        ERR('load', 'no GLOVE meshes');
        return;
      }
      U.src = found;
      U.loaded = found.bySide.R.length + found.bySide.L.length;
      attach();
    } catch (e) { ERR('gltf', e); }
  }

  function loadGlb() {
    if (U._loading || U.src) return;
    const T = T3();
    if (!T || !T.GLTFLoader) { ERR('load', 'no GLTFLoader'); return; }
    U._loading = 1;
    try {
      const L = new T.GLTFLoader();
      try { if (W.MeshoptDecoder && L.setMeshoptDecoder) L.setMeshoptDecoder(W.MeshoptDecoder); } catch (_) {}
      L.load('assets/models/scottish-base-v2/scottish-base.glb', function (g) {
        U._loading = 0;
        onGltf(g);
      }, null, function (e) {
        U._loading = 0;
        ERR('glb', e);
      });
    } catch (e) { U._loading = 0; ERR('load', e); }
  }

  function tick() {
    try {
      if (!U.on) return;
      if (!U.src) loadGlb();
      if (U.src && !U.attached) attach();
      if (U.attached) {
        hideBoth();
        const k = currentKind();
        poseKind(k);
        if (U.sides) {
          if (U.sides.R) applyTune(U.sides.R);
          if (U.sides.L) applyTune(U.sides.L);
        }
      }
    } catch (e) { ERR('tick', e); }
  }

  function hook1271() {
    try {
      const H = W.__hands1271;
      if (!H || H.__fp1285) return;
      const prev = H.apply;
      if (typeof prev === 'function') {
        H.apply = function () {
          const r = prev.apply(this, arguments);
          try { tick(); } catch (e) { ERR('apply', e); }
          return r;
        };
      }
      H.__fp1285 = 1;
    } catch (e) { ERR('hook', e); }
  }

  hook1271();
  loadGlb();
  [300, 800, 2000, 5000, 12000].forEach(function (t) { setTimeout(function () { hook1271(); tick(); }, t); });
  setInterval(tick, 200);
  U.tick = tick;
  U.poseKind = poseKind;
  U.POSES = POSES;
})(typeof window !== 'undefined' ? window : this);
