/* GLX-HANDSFP1285 (v1.2.85): first-person uses the actual third-person
   GLOVE hand mesh (HeadSkin, 1.2.83 crease/knuckle/nail shading) attached
   to the existing __fpa wrist, coming out of the cream linen cuff.
   Old box/tube __fpa hand and finger pieces are hidden, not deleted.
   Finger bones curl around each held item. The 1.2.65-style prism box
   pieces are hidden, not deleted (U.prism / U.cuffFolds = 0; helper code
   is kept). Knuckles, tendons, veins, palm creases and nails are drawn
   with subtle shading on the smooth glove: a hand-space coordinate
   (aHand1285) is baked per vertex in bind pose, and the fragment shader
   builds a low-amplitude height field from it (soft bump + small albedo
   cues) without recolouring the pale HeadSkin. The glove stays seated
   on the __fpa cuff; it is not slid off the wrist. Arm animations, item
   positions and torch/pick jitter are unchanged. Third-person is not
   patched. */
(function handsFp1285() {
  const W = window;
  const U = W.__handsFp1285 = {
    err: null, on: 1, version: '1.2.89-red',
    /* t1225: blocky prism pieces off; detail lives in the skin shader. */
    prism: 0, cuffFolds: 0, bump: 0,
    /* C350 viewmodel + FRAME.pistol own the hip spot. Chasing the gun
       with a world delta threw the __fpa wrists off-camera once the
       viewmodel moved `held`. Left off; the safer push stays in the file. */
    pistolPush: 0,
    /* gripLock can slide the glove off the cuff when the handle is far
       from the fist; left off so the hand stays on the linen sleeve.
       Tight fists come from bone curls; the pistol stays visible because
       the 1.2.80 FRAME rest nudge is zeroed in sculpt-1280. */
    gripLock: 0,
    /* t1246: per-frame seeks / snaps / clamps are off. A solved,
       scale-correct constant table (HELD_OFF) seats the grip in the
       palm; optional VIEW_OFF is a constant camera-space nudge. */
    pistolGrip: 0,
    musketSeek: 0,
    handleSeek: 0,
    /* held-parent-local translation, solved so the grip-region centroid
       lands on the palm centre. Applied from the game's own held base
       so the 1251/1261 jitter-fix writes stay intact. */
    HELD_OFF: {
      /* t1248 best-of: 8be741a / align2 tables (torch 0.0096, pistol
         0.0051, bucket 0.0086, sword 0.0133). Later pistol/block
         offsets and VIEW_OFF nudges regressed torch and pistol, so
         they stay zero. Pick uses the 1359f1c step (finger 0.071),
         the best verified pick row. */
      empty: [0, 0, 0],
      block: [0, 0, 0],
      bucket: [0, 0, 0],
      torch: [0.045, -0.0368, -0.0314],
      sword: [0.0167, -0.1172, 0.0589],
      pistol: [0, 0, 0],
      musket: [-0.0607, -0.0058, -0.0175],
      map: [0, 0, 0],
      pick: [0.0414, -0.0522, -0.2143],
      p761: [0.0414, -0.0522, -0.2143],
      p760: [0.0414, -0.0522, -0.2143]
    },
    VIEW_OFF: {
      /* 8be741a / align2: right musket wrist in front of the lens
         without the later -0.36 nudge that reopened a poke. */
      musket: [0, 0, -0.23]
    },
    /* Bake each held-item fist into a non-skinned mesh so the glove
       skeleton is not skinned or walked every frame. Hidden, not deleted.
       t1231: kept in the file but off — bake still punched holes in
       the map palm and doubled the pick fist, even after filtering
       the cuff and baking one mesh per side. */
    bakePose: 0,
    gunGripF: 0.30,
    attached: 0, hidden: 0, loaded: 0, kind: '',
    tune: { scale: 1, x: 0, y: -0.012, z: 0, rx: 0, ry: 3.14159, rz: 0 },
    /* Per-kind wrap offset on top of tune, in p.h space (Y along fingers).
       empty/block/map flip to a palm-up seat; fists keep the 37aa5cf grip
       direction so held items stay in the hand. */
    seat: {
      empty:  { sx: -1, rx: -0.50, x: 0, y: 0.00, z: 0.00 },
      block:  { sx: -1, rx: -0.42, x: 0.00, y: -0.02, z: 0.04 },
      map:    { sx: -1, rx: -0.72, x: 0.00, y: 0.00, z: 0.03 },
      bucket: { x: 0, y: 0.01, z: 0.00 },
      torch:  { x: 0, y: 0.01, z: 0.00 },
      sword:  { x: 0.00, y: 0.01, z: 0.02 },
      pick:   { x: 0.06, y: -0.02, z: 0.08 },
      p761:   { x: 0.06, y: -0.02, z: 0.08 },
      p760:   { x: 0.06, y: -0.02, z: 0.08 },
      pistol: { x: 0.076, y: 0.131, z: -0.048, cuffFollow: 1, cuffNx: -0.01 },
      musket: { x: 0.021, y: -0.015, z: -0.017 },
      /* Left wrap onto the forestock (p.h space). Translation only —
         a seat rotation drove the forearm into the near plane. */
      musketL:{ x: 0.04, y: -0.02, z: 0.00 }
    }
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 260); };

  const FINGER = /^(finger[LR]\d\d\d|thumb[LR]\d\d)$/;
  const HANDB = /^hand[LR]$/;
  const TIP = /^(finger[LR]\d02|thumb[LR]02)$/;
  const sideOf = nm => { const m = /^[a-z]+([LR])/.exec(nm || ''); return m ? m[1] : 'R'; };
  const norm = n => String(n || '').replace(/\./g, '');

  /* Extra flex (and thumb Y/Z) on top of the bind pose, in radians.
     Positive flex is toward the palm, around the bind-pose flex axis
     (along × palmar) derived from the bone's joint-to-child direction
     and the hand's dorsal PCA. */
  const S = 1;
  /* Tight closed fist with a wrapped thumb; curls stay short of a skin collapse. */
  /* Slightly tighter than the 45e632a fist, still short of a skin
     collapse: a little more proximal and distal curl, thumb wraps over
     the index instead of standing up or dropping through the palm. */
  const fist = () => ({
    p: [1.40, 1.50, 1.50, 1.36].map(v => S * v),
    d: [1.46, 1.56, 1.56, 1.42].map(v => S * v),
    t: [1.14 * S, 1.02 * S], tY: 0.78, tZ: 0.54
  });
  const POSES = {
    empty: {
      p: [0.22, 0.28, 0.34, 0.42].map(v => S * v),
      d: [0.16, 0.20, 0.26, 0.32].map(v => S * v),
      t: [0.12 * S, 0.14 * S], tY: 0.22, tZ: 0.06
    },
    block: {
      p: [0.78, 0.88, 0.90, 0.76].map(v => S * v),
      d: [0.60, 0.68, 0.70, 0.58].map(v => S * v),
      t: [0.50 * S, 0.36 * S], tY: 0.28, tZ: 0.14
    },
    bucket: fist(),
    torch: fist(),
    /* Tight closed fist around the hilt. Curls stay under ~1.65 rad so
       the glove does not collapse and open holes between the fingers. */
    sword: {
      p: [1.56, 1.62, 1.62, 1.52].map(v => S * v),
      d: [1.60, 1.66, 1.66, 1.56].map(v => S * v),
      t: [1.22 * S, 1.12 * S], tY: 0.94, tZ: 0.62
    },
    /* Vice-tight wrap around the pick shaft, short of a skin collapse. */
    pick: {
      p: [1.56, 1.66, 1.66, 1.52].map(v => S * v),
      d: [1.64, 1.74, 1.74, 1.60].map(v => S * v),
      t: [1.24 * S, 1.16 * S], tY: 0.96, tZ: 0.64
    },
    axe: fist(),
    shovel: fist(),
    hoe: fist(),
    /* Middle/ring/pinky wrap the grip; index rests on the trigger guard. */
    pistol: {
      p: [0.62, 1.56, 1.60, 1.48].map(v => S * v),
      d: [0.48, 1.40, 1.44, 1.32].map(v => S * v),
      t: [1.08 * S, 0.82 * S], tY: 0.62, tZ: 0.40
    },
    musket: {
      p: [0.36, 1.44, 1.48, 1.36].map(v => S * v),
      d: [0.24, 1.24, 1.28, 1.16].map(v => S * v),
      t: [0.88 * S, 0.60 * S], tY: 0.40, tZ: 0.24
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
    },
    /* Left hand wraps the musket forestock (not the open support pose). */
    forestock: {
      p: [1.48, 1.58, 1.58, 1.44].map(v => S * v),
      d: [1.32, 1.44, 1.44, 1.28].map(v => S * v),
      t: [1.10 * S, 0.82 * S], tY: 0.64, tZ: 0.40
    }
  };
  POSES.p761 = POSES.pick;
  POSES.p760 = POSES.pick;
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

  /* glTF / meshopt often stores positions as normalized Int16. Three r128
     Vector3.fromBufferAttribute does not apply the accessor scale (the
     game's own C322 sight baker multiplies by nq for the same reason). */
  function attrQuant(attr) {
    if (!attr || !attr.normalized) return 1;
    const A = attr.array;
    if (A instanceof Int16Array) return 1 / 32767;
    if (A instanceof Int8Array) return 1 / 127;
    if (A instanceof Uint16Array) return 1 / 65535;
    if (A instanceof Uint8Array) return 1 / 255;
    return 1;
  }
  function fromPos(attr, i, target) {
    target.fromBufferAttribute(attr, i);
    const q = attrQuant(attr);
    if (q !== 1) target.multiplyScalar(q);
    return target;
  }


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
  function isLinenSleeve(o) {
    const u = o.userData || {};
    if (u.fpForearm1285 || u.fpForearm1280 || u.fpForearm1279) return true;
    if (u.slim1271 || u.folded1249) return true;
    const n = (o.name || '').toLowerCase();
    return /cuff|sleeve|linen|forearm/.test(n);
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
      /* Keep the cream linen cuff / sleeve so it shows at the wrist. */
      if (isLinenSleeve(o)) return;
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
    g.userData.dorsalW = dorsalW;
    return true;
  }

  /* t1225: per-vertex hand-space coordinate for the shader-drawn detail.
     aHand1285 = (a, f, n, L): a = distance from the wrist along the hand
     (0 wrist .. 1 knuckle line, >1 fingers), f = finger lane (0 index ..
     3 little finger, <0 toward the thumb), n = bind normal . dorsal
     (+back / -palm), L = wrist-to-knuckle length in metres. Bind-pose
     values ride with the skin like a UV, so the detail follows the bones. */
  function handDorsalPCA(mesh, T, side, names) {
    const g = mesh.geometry, pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const hv = [];
    for (let i = 0; i < pos.count; i++) if (sw.getX(i) > 0.9 && names[si.getX(i)] === 'hand' + side) hv.push(i);
    if (hv.length < 12) return null;
    const c = new T.Vector3(), p = new T.Vector3();
    for (const i of hv) { p.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix); c.add(p); }
    c.multiplyScalar(1 / hv.length);
    let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0;
    for (const i of hv) { p.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix).sub(c); xx += p.x * p.x; xy += p.x * p.y; xz += p.x * p.z; yy += p.y * p.y; yz += p.y * p.z; zz += p.z * p.z; }
    let inv3; try { inv3 = new T.Matrix3().set(xx, xy, xz, xy, yy, yz, xz, yz, zz).invert(); } catch (_) { return null; }
    if (!isFinite(inv3.elements[0])) return null;
    const e = new T.Vector3(0.3, 0.5, 0.8);
    for (let k = 0; k < 30; k++) e.applyMatrix3(inv3).normalize();
    return e;
  }
  function bakeHandFrame(mesh, T) {
    const g = mesh.geometry;
    if (!g || !g.attributes.position || !g.attributes.skinIndex || !mesh.skeleton) return;
    if (g.attributes.aHand1285) return;
    const bones = mesh.skeleton.bones, inv = mesh.skeleton.boneInverses;
    const names = bones.map(function (b) { return norm(b.name || ''); });
    const bpos = function (bi) { return new T.Vector3().setFromMatrixPosition(new T.Matrix4().copy(inv[bi]).invert()); };
    const frames = {};
    for (const side of ['L', 'R']) {
      const hi = names.indexOf('hand' + side);
      if (hi < 0) continue;
      const prox = [];
      for (let i = 0; i < 4; i++) { const bi = names.indexOf('finger' + side + i + '01'); if (bi >= 0) prox.push(bpos(bi)); }
      const ti = names.indexOf('thumb' + side + '01');
      if (prox.length < 4) continue;
      const O = bpos(hi);
      const K = prox.reduce(function (acc, v) { return acc.add(v); }, new T.Vector3()).multiplyScalar(0.25);
      const along = K.clone().sub(O); const L = along.length() || 0.08; along.normalize();
      let dors = (g.userData && g.userData.dorsalW && g.userData.dorsalW[side]) ? g.userData.dorsalW[side].clone() : handDorsalPCA(mesh, T, side, names);
      if (!dors) continue;
      dors.addScaledVector(along, -dors.dot(along)).normalize();
      const thumb = ti >= 0 ? bpos(ti) : null;
      /* Dorsal sign: the thumb base sits a little palm-side of the knuckle plane. */
      if (thumb && thumb.clone().sub(O).dot(dors) > 0.004) dors.negate();
      const lat = new T.Vector3().crossVectors(along, dors).normalize();
      let l = prox.map(function (v) { return v.clone().sub(O).dot(lat); });
      /* Lane 0 = the finger nearest the thumb (index). */
      if (thumb) {
        const lt = thumb.clone().sub(O).dot(lat);
        if (Math.abs(l[3] - lt) < Math.abs(l[0] - lt)) { l = l.slice().reverse(); }
      }
      const sgn = l[3] > l[0] ? 1 : -1;
      frames[side] = { O: O, along: along, dors: dors, lat: lat, L: L, l: l.map(function (x) { return x * sgn; }), sgn: sgn };
    }
    const pos = g.attributes.position, nr = g.attributes.normal, si = g.attributes.skinIndex;
    const n = pos.count, out = new Float32Array(n * 4);
    const v = new T.Vector3(), nn = new T.Vector3(), d = new T.Vector3();
    const nmat = new T.Matrix3().getNormalMatrix(mesh.bindMatrix);
    for (let i = 0; i < n; i++) {
      const fr = frames[sideOf(names[si.getX(i)])] || frames.R || frames.L;
      if (!fr) { out[i * 4 + 2] = 0; out[i * 4 + 3] = 0.08; out[i * 4] = -1; continue; }
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix);
      d.copy(v).sub(fr.O);
      const a = d.dot(fr.along) / fr.L;
      const x = d.dot(fr.lat) * fr.sgn;
      const l = fr.l;
      let f;
      if (x <= l[1]) f = (x - l[0]) / ((l[1] - l[0]) || 1e-4);
      else if (x <= l[2]) f = 1 + (x - l[1]) / ((l[2] - l[1]) || 1e-4);
      else f = 2 + (x - l[2]) / ((l[3] - l[2]) || 1e-4);
      let nd = 0;
      if (nr) { nn.fromBufferAttribute(nr, i).applyMatrix3(nmat).normalize(); nd = nn.dot(fr.dors); }
      out[i * 4] = a; out[i * 4 + 1] = f; out[i * 4 + 2] = nd; out[i * 4 + 3] = fr.L;
    }
    g.setAttribute('aHand1285', new T.BufferAttribute(out, 4));
    U.handFrame = {};
    for (const k in frames) U.handFrame[k] = { L: +frames[k].L.toFixed(4), l: frames[k].l.map(function (x) { return +x.toFixed(4); }) };
  }

  /* On the FP clone only: keep vertices weighted to this side's hand /
     finger / thumb bones, and discard the TP forearm/upper-arm skin so
     the cream linen __fpa cuff shows at the wrist. Geometry is not
     deleted (the source mesh and the hidden __fpa pieces stay). */
  function bakeCuffMask(mesh, T, side, srcSkel, srcMesh) {
    const g = mesh.geometry;
    if (!g || !g.attributes.position) return;
    /* Use the source bind (character space) so hand-local Y is reliable. */
    const skel = srcSkel || mesh.skeleton;
    const bones = skel && skel.bones;
    if (!bones) return;
    const hand = bones.find(function (b) { return norm(b.name) === 'hand' + side || b.name === 'hand' + side; });
    const hi = hand ? bones.indexOf(hand) : -1;
    const n = g.attributes.position.count;
    const mask = new Float32Array(n);
    const v = new T.Vector3();
    const pos = g.attributes.position;
    const invs = skel.boneInverses;
    const bm = (srcMesh && srcMesh.bindMatrix) || mesh.bindMatrix;
    let minY = 1e9, maxY = -1e9, cut = 0;
    if (hi >= 0 && invs && invs[hi]) {
      const inv = invs[hi];
      for (let i = 0; i < n; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(bm).applyMatrix4(inv);
        if (v.y < minY) minY = v.y;
        if (v.y > maxY) maxY = v.y;
        /* Store hand-local Y. The fragment shader discards below uFpCuffCut
           so tools can show the linen cuff at the wrist, while musket keeps
           enough forearm to leave the frame (no clipped stump). Vertices
           and normals stay as in the bind; collapsing them and calling
           computeVertexNormals() was re-lighting the palm as dirty tan. */
        mask[i] = v.y;
        if (v.y < -0.022) cut++;
      }
    } else {
      for (let i = 0; i < n; i++) mask[i] = 1;
    }
    g.setAttribute('aFpHand1285', new T.BufferAttribute(mask, 1));
    U.cuffStats = { side: side, minY: +minY.toFixed(3), maxY: +maxY.toFixed(3), cut: cut, n: n, hi: hi };
  }

  function cuffCutValue() {
    /* Keep the wrist cut off the play camera. Musket looks down the
       forearm; pick / sword / guns also showed a sliced stump with the
       short -0.022 cut. The linen cuff still sits on the kept forearm. */
    if (U.kind === 'musket') return -0.05;
    if (U.kind === 'pistol') return -0.05;
    if (U.kind === 'pick' || U.kind === 'p761' || U.kind === 'p760') return -0.14;
    if (U.kind === 'sword' || U.kind === 'torch' || U.kind === 'bucket' || U.kind === 'axe' || U.kind === 'shovel' || U.kind === 'hoe') return -0.12;
    return -0.08;
  }
  function syncCuffCut() {
    const v = cuffCutValue();
    const list = U._cuffUni;
    if (!list) return;
    for (let i = 0; i < list.length; i++) if (list[i]) list[i].value = v;
  }

  function patchMat(m, skin) {
    if (!m) return;
    if (m.onBeforeCompile && m.onBeforeCompile.__handsFp1285) return;
    const prev = m.onBeforeCompile;
    const prevKey = m.customProgramCacheKey;
    m.onBeforeCompile = function (sh, r) {
      if (typeof prev === 'function') prev.call(this, sh, r);
      if (sh.vertexShader.indexOf('aFpHand1285') < 0) {
        const declV = 'attribute float aFpHand1285;\nvarying float vFpHand1285;';
        const declF = 'varying float vFpHand1285;\nuniform float uFpCuffCut;';
        function injectDecl(src, decl) {
          if (src.indexOf('#include <common>') >= 0)
            return src.replace('#include <common>', '#include <common>\n' + decl);
          return src.replace(/^((?:\s*#version[^\n]*\n)?(?:\s*precision[^\n]*\n)*)/, function (m) { return m + decl + '\n'; });
        }
        sh.vertexShader = injectDecl(sh.vertexShader, declV);
        if (sh.vertexShader.indexOf('#include <begin_vertex>') >= 0)
          sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFpHand1285 = aFpHand1285;');
        else
          sh.vertexShader = sh.vertexShader.replace(/void main\s*\(\s*\)\s*\{/, 'void main() {\nvFpHand1285 = aFpHand1285;');
        sh.fragmentShader = injectDecl(sh.fragmentShader, declF);
        if (!sh.uniforms.uFpCuffCut) sh.uniforms.uFpCuffCut = { value: cuffCutValue() };
        U._cuffUni = U._cuffUni || [];
        U._cuffUni.push(sh.uniforms.uFpCuffCut);
        sh.fragmentShader = sh.fragmentShader.replace(/void main\s*\(\s*\)\s*\{/, 'void main() {\nif (vFpHand1285 < uFpCuffCut) discard;');
        U.shaderHook = 1;
      }
      if (!skin) return;
      if (sh.vertexShader.indexOf('aCrease1282') >= 0) return;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aCrease1282;\nattribute float aNail1282;\nattribute float aKnk1282;\nattribute vec4 aHand1285;\nvarying float vCrease1282;\nvarying float vNail1282;\nvarying float vKnk1282;\nvarying vec4 vHand1285;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCrease1282 = aCrease1282; vNail1282 = aNail1282; vKnk1282 = aKnk1282; vHand1285 = aHand1285;');
      let frag = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vCrease1282;\nvarying float vNail1282;\nvarying float vKnk1282;\nvarying vec4 vHand1285;');
      if (U.bump && frag.indexOf('#include <normal_fragment_maps>') >= 0) { frag = frag.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + DETAIL_GLSL); U.detailHook = (U.detailHook || 0) + 1; }
      frag = frag.replace('#include <lights_physical_fragment>', `
        {
          float cr = smoothstep(0.22, 0.85, vCrease1282);
          /* Fold AO kept mild and cool so it does not dirty the cream skin. */
          diffuseColor.rgb *= mix(vec3(1.0), vec3(0.90, 0.87, 0.85), cr * 0.32);
          float kn = clamp(vKnk1282 * 1.8, 0.0, 1.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.12 + vec3(0.03, 0.03, 0.03), kn);
          float nl = smoothstep(0.12, 0.55, vNail1282);
          vec3 nailC = diffuseColor.rgb * vec3(1.16, 1.12, 1.10) + vec3(0.08, 0.07, 0.07);
          nailC = mix(nailC, nailC + vec3(0.08, 0.08, 0.08), smoothstep(0.7, 1.0, vNail1282));
          diffuseColor.rgb = mix(diffuseColor.rgb, min(nailC, vec3(1.0)), nl * 0.85);
          roughnessFactor = mix(roughnessFactor, 0.70, smoothstep(0.15, 0.75, vNail1282) * 0.40);
          roughnessFactor = mix(roughnessFactor, min(1.0, roughnessFactor + 0.30), smoothstep(0.08, 0.85, vCrease1282));
          /* Subtle tendon / knuckle / vein / palm-crease shading on the
             pale HeadSkin (no normal mapping — same method as 1.2.83). */
          float hA = vHand1285.x, hF = vHand1285.y, hN = vHand1285.z;
          float dors = smoothstep(0.12, 0.40, hN);
          float palmH = smoothstep(0.12, 0.40, -hN);
          float laneM = smoothstep(-0.50, -0.15, hF) * (1.0 - smoothstep(3.15, 3.50, hF));
          float back = dors * smoothstep(0.10, 0.28, hA) * (1.0 - smoothstep(0.90, 1.00, hA));
          float g = 1.5 + (hF - 1.5) / mix(0.55, 1.0, clamp(hA, 0.0, 1.0));
          float gM = smoothstep(-0.40, 0.00, g) * (1.0 - smoothstep(3.00, 3.40, g));
          float tend = back * gM * pow(max(0.0, cos(6.2832 * g)), 4.0);
          float kb = dors * laneM * exp(-pow((hA - 1.0) / 0.10, 2.0)) * pow(max(0.0, cos(6.2832 * hF)), 1.5);
          float vM = back * smoothstep(0.12, 0.30, hA) * (1.0 - smoothstep(0.62, 0.82, hA));
          float vein = vM * (exp(-pow((hF - (1.80 + 0.35 * sin(hA * 4.0 + 0.8))) / 0.14, 2.0)) + 0.6 * exp(-pow((hF - (0.50 + 0.22 * sin(hA * 5.0 + 2.1))) / 0.12, 2.0)));
          float pc = palmH * smoothstep(0.12, 0.24, hA) * (1.0 - smoothstep(0.92, 1.00, hA));
          float heart = exp(-pow((hA - (0.86 - 0.045 * hF)) / 0.018, 2.0)) * smoothstep(-0.10, 0.60, hF);
          float headL = exp(-pow((hA - (0.66 + 0.05 * (hF - 1.2))) / 0.018, 2.0)) * smoothstep(-0.40, 0.20, hF) * (1.0 - smoothstep(2.40, 3.00, hF));
          float lifeF = 0.95 - 1.25 * pow(clamp((hA - 0.12) / 0.78, 0.0, 1.0), 1.5);
          float life = exp(-pow((hF - lifeF) / 0.09, 2.0)) * smoothstep(0.14, 0.28, hA) * (1.0 - smoothstep(0.82, 0.92, hA));
          float pcr = pc * max(max(heart, headL), life);
          diffuseColor.rgb *= 1.0 + tend * 0.035 + kb * 0.03;
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.92, 0.93, 0.96), clamp(vein, 0.0, 1.0) * 0.08);
          diffuseColor.rgb *= 1.0 - clamp(pcr * 0.06, 0.0, 0.06);
          /* Do not polish knuckles / tendons: shine was reading as wet skin. */
          roughnessFactor = mix(roughnessFactor, min(1.0, roughnessFactor + 0.08), clamp(kb + tend * 0.4, 0.0, 1.0) * 0.30);
          /* Porcelain-cream grade toward the 45e632a glove and t1214 refs.
             v1 desat 0.82 went chalk-white; this pass desats less, uses a
             warmer cream, and keeps a roughness floor so the palm stays matte.
             A cheap wrap/peach term (GPU Gems ch.16 idea, no LUT) warms the
             terminator so the hand does not read as plaster. */
          {
            float luma = dot(diffuseColor.rgb, vec3(0.30, 0.54, 0.16));
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(luma), 0.58);
            vec3 cream = vec3(0.89, 0.82, 0.75);
            diffuseColor.rgb = mix(diffuseColor.rgb, cream, 0.36);
            diffuseColor.rgb *= vec3(1.05, 1.03, 1.01);
            float wrap = smoothstep(0.08, 0.42, luma) * (1.0 - smoothstep(0.42, 0.75, luma));
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.05, 0.96, 0.90) + vec3(0.03, 0.008, 0.0), wrap * 0.28);
            diffuseColor.rgb = min(diffuseColor.rgb, vec3(1.0));
            roughnessFactor = max(roughnessFactor, 0.72);
          }
        }
        #include <lights_physical_fragment>`);
      sh.fragmentShader = frag;
    };
    try { if (prev) for (const k of Object.keys(prev)) m.onBeforeCompile[k] = prev[k]; } catch (_) {}
    m.onBeforeCompile.__handsFp1285 = 1;
    m.onBeforeCompile.__hands1282 = 1;
    m.customProgramCacheKey = function () {
      const k = typeof prevKey === 'function' ? prevKey.call(this) : '';
      return k + '|handsFp1285skinF' + (skin ? 'S' : 'C') + (U.bump ? 'b' : '');
    };
    if (skin) {
      try { if (m.roughness != null) m.roughness = Math.max(+m.roughness || 0, 0.74); } catch (_) {}
      try { if (m.metalness != null) m.metalness = 0; } catch (_) {}
      try { if (m.shininess != null) m.shininess = Math.min(+m.shininess || 30, 8); } catch (_) {}
      try { if (m.envMapIntensity != null) m.envMapIntensity = Math.min(+m.envMapIntensity || 1, 0.15); } catch (_) {}
      try { if (m.specular && m.specular.setRGB) m.specular.setRGB(0.01, 0.01, 0.01); } catch (_) {}
    }
    try { if (skin) { m.extensions = m.extensions || {}; m.extensions.derivatives = true; } } catch (_) {}
    m.needsUpdate = true;
  }

  function isSkinMat(m) { return m && /Skin/i.test(m.name || ''); }

  /* t1224: older rig passes (1.2.60 protectRig atlas paint, 1.2.40
     hardenMeshMats -> Phong) re-material every mesh under the __fpa rig,
     which silently threw away the HeadSkin material and the crease / nail /
     detail shader on this clone. Pin this clone's own material: foreign
     writes are ignored (same idea as lockHidden for .visible). */
  function lockMaterial(mesh) {
    if (!mesh || (mesh.userData && mesh.userData.__fpMatLock)) return;
    mesh.userData.__fpMatLock = 1;
    mesh.userData.__fpMat = mesh.material;
    try {
      Object.defineProperty(mesh, 'material', {
        get: function () { return this.userData.__fpMat; },
        set: function (v) { U.matBlocked = (U.matBlocked || 0) + 1; },
        configurable: true,
        enumerable: true
      });
    } catch (_) {}
  }

  /* t1225 shader-drawn skin detail on the smooth glove (no extra geometry).
     Height field in bind-space metres from aHand1285, turned into a bump
     with screen-space derivatives, plus small albedo cues. */
  const DETAIL_GLSL = `
  {
    float hA = vHand1285.x, hF = vHand1285.y, hN = vHand1285.z;
    float dors = smoothstep(0.12, 0.40, hN);
    float palm = smoothstep(0.12, 0.40, -hN);
    float laneM = smoothstep(-0.50, -0.15, hF) * (1.0 - smoothstep(3.15, 3.50, hF));
    float back = dors * smoothstep(0.10, 0.28, hA) * (1.0 - smoothstep(0.90, 1.00, hA));
    /* Soft extensor tendons, low frequency so derivatives stay stable. */
    float g = 1.5 + (hF - 1.5) / mix(0.55, 1.0, clamp(hA, 0.0, 1.0));
    float gM = smoothstep(-0.40, 0.00, g) * (1.0 - smoothstep(3.00, 3.40, g));
    float tend = back * gM * pow(max(0.0, cos(6.2832 * g)), 4.0);
    /* Knuckle domes along the knuckle line. */
    float kb = dors * laneM * exp(-pow((hA - 1.0) / 0.10, 2.0)) * pow(max(0.0, cos(6.2832 * hF)), 1.5);
    /* Faint dorsal veins. */
    float vM = back * smoothstep(0.12, 0.30, hA) * (1.0 - smoothstep(0.62, 0.82, hA));
    float fv1 = 1.80 + 0.35 * sin(hA * 4.0 + 0.8);
    float fv2 = 0.50 + 0.22 * sin(hA * 5.0 + 2.1);
    float vein = vM * (exp(-pow((hF - fv1) / 0.14, 2.0)) + 0.6 * exp(-pow((hF - fv2) / 0.12, 2.0)));
    /* Thin palm creases (heart, head, life). */
    float pc = palm * smoothstep(0.12, 0.24, hA) * (1.0 - smoothstep(0.92, 1.00, hA));
    float heart = exp(-pow((hA - (0.86 - 0.045 * hF)) / 0.018, 2.0)) * smoothstep(-0.10, 0.60, hF);
    float headL = exp(-pow((hA - (0.66 + 0.05 * (hF - 1.2))) / 0.018, 2.0)) * smoothstep(-0.40, 0.20, hF) * (1.0 - smoothstep(2.40, 3.00, hF));
    float lifeF = 0.95 - 1.25 * pow(clamp((hA - 0.12) / 0.78, 0.0, 1.0), 1.5);
    float life = exp(-pow((hF - lifeF) / 0.09, 2.0)) * smoothstep(0.14, 0.28, hA) * (1.0 - smoothstep(0.82, 0.92, hA));
    float pcr = pc * max(max(heart, headL), life);
    /* Height in metres: a fraction of a millimetre, lighting stays stable. */
    float H = (tend * 0.45 + kb * 0.70 + vein * 0.25 + vKnk1282 * 0.25) - pcr * 0.20;
    H *= 0.00045;
    vec3 sP = -vViewPosition;
    vec3 sX = dFdx(sP), sY = dFdy(sP);
    vec2 dHv = vec2(dFdx(H), dFdy(H));
    if (dot(dHv, dHv) < 4.0e-9) {
    } else {
      vec3 r1 = cross(sY, normal), r2 = cross(normal, sX);
      float det = dot(sX, r1);
      if (abs(det) > 1.0e-8) {
        vec3 grd = sign(det) * (dHv.x * r1 + dHv.y * r2);
        vec3 nB = normalize(abs(det) * normal - grd);
        normal = normalize(mix(normal, nB, 0.40));
      }
    }
    /* Keep the pale HeadSkin colour: tiny tendon/knuckle lift, cool vein, faint crease AO. */
    diffuseColor.rgb *= 1.0 + tend * 0.04 + kb * 0.035;
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.90, 0.92, 0.97), clamp(vein, 0.0, 1.0) * 0.12);
    diffuseColor.rgb *= 1.0 - clamp(pcr * 0.10, 0.0, 0.10);
  }`;

  /* ---- 1.2.65-style prism/cube sculpt on the FP clone only (not TP) ---- */
  function pushBox(bag, x, y, z, w, h, d, col, rx, ry, rz) {
    const hx = w / 2, hy = h / 2, hz = d / 2;
    const faces = [
      [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz], [0, 0, 1]],
      [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz], [0, 0, -1]],
      [[-hx, hy, -hz], [-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [0, 1, 0]],
      [[-hx, -hy, hz], [-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, hz], [0, -1, 0]],
      [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz], [1, 0, 0]],
      [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz], [-1, 0, 0]]
    ];
    /* typo fix: palm-down face should use -hy for last two? keep 1265 winding */
    faces[3] = [[-hx, -hy, hz], [-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [0, -1, 0]];
    const cr = Math.cos(rx || 0), sr = Math.sin(rx || 0);
    const cy = Math.cos(ry || 0), sy = Math.sin(ry || 0);
    const ck = Math.cos(rz || 0), sk = Math.sin(rz || 0);
    function rot(px, py, pz) {
      let x0 = px, y0 = py * cr - pz * sr, z0 = py * sr + pz * cr;
      let x1 = x0 * cy + z0 * sy, y1 = y0, z1 = -x0 * sy + z0 * cy;
      return [x1 * ck - y1 * sk, x1 * sk + y1 * ck, z1];
    }
    function rotN(nx, ny, nz) {
      const r = rot(nx, ny, nz);
      const l = Math.hypot(r[0], r[1], r[2]) || 1;
      return [r[0] / l, r[1] / l, r[2] / l];
    }
    for (let f = 0; f < 6; f++) {
      const F = faces[f];
      const n = rotN(F[4][0], F[4][1], F[4][2]);
      const v = [];
      for (let i = 0; i < 4; i++) {
        const r = rot(F[i][0], F[i][1], F[i][2]);
        v.push([r[0] + x, r[1] + y, r[2] + z]);
      }
      const tri = [0, 1, 2, 0, 2, 3];
      const uvs = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]];
      for (let i = 0; i < 6; i++) {
        const pt = v[tri[i]];
        bag.pos.push(pt[0], pt[1], pt[2]);
        bag.nrm.push(n[0], n[1], n[2]);
        bag.uv.push(uvs[i][0], uvs[i][1]);
        bag.col.push(col[0], col[1], col[2]);
      }
    }
  }
  function bagToGeo(T, bag) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(bag.pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(bag.nrm, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(bag.uv, 2));
    g.setAttribute('color', new T.Float32BufferAttribute(bag.col, 3));
    return g;
  }
  function skinCol(k) {
    /* Warm Highlander skin stops, slightly varied per piece kind. */
    const pal = {
      skin: [0.83, 0.64, 0.52],
      knk: [0.86, 0.66, 0.54],
      pad: [0.80, 0.55, 0.48],
      vein: [0.70, 0.50, 0.50],
      tend: [0.80, 0.62, 0.51],
      wrist: [0.84, 0.65, 0.54],
      nail: [0.93, 0.82, 0.78],
      nailTip: [0.97, 0.90, 0.86],
      linen: [0.90, 0.85, 0.74],
      linenFold: [0.78, 0.72, 0.60],
      linenHi: [0.96, 0.92, 0.82]
    };
    return pal[k] || pal.skin;
  }
  function sculptMat(T, kind) {
    let map = null, src = null;
    try {
      const H71 = W.__hands1271, H65 = W.__hands1265;
      if (kind === 'linen') src = (H71 && H71._linen) || (H65 && H65._linen);
      else if (kind === 'nail') src = (H71 && H71._nail) || (H65 && H65._nail);
      else if (kind === 'knuckle') src = (H71 && (H71._kn || H71._knuckle)) || (H65 && H65._kn);
      else src = (H71 && (H71._skin || H71._hand)) || (H65 && H65._skin);
      if (src && src.map) map = src.map;
    } catch (_) {}
    const col = skinCol(kind === 'linen' || kind === 'linenFold' || kind === 'linenHi' ? kind : (kind === 'nail' || kind === 'nailTip' ? kind : (kind === 'knuckle' ? 'knk' : kind)));
    const m = new T.MeshLambertMaterial({
      color: 0xffffff,
      vertexColors: true,
      map: map || undefined,
      transparent: false,
      depthWrite: true
    });
    if (!map) m.color.setRGB(col[0], col[1], col[2]);
    m.name = 'fpSculpt1285-' + kind;
    return m;
  }
  function mkMesh(T, geo, mat) {
    const m = new T.Mesh(geo, mat);
    m.userData.fpTpHand1285 = 1;
    m.userData.fpSculpt1285 = 1;
    m.frustumCulled = false;
    m.castShadow = false;
    m.renderOrder = 3;
    return m;
  }
  function boneLen(b) {
    if (!b) return 0.03;
    let best = 0;
    const kids = b.children || [];
    for (let i = 0; i < kids.length; i++) {
      const k = kids[i];
      if (k && k.isBone) {
        const L = Math.hypot(k.position.x, k.position.y, k.position.z);
        if (L > best) best = L;
      }
    }
    return best || 0.03;
  }

  /* Bake 1.2.65-style prism/cube pieces into the skinned mesh. Each box
     is authored in the bone's bind-pose frame (along = joint-to-child,
     dorsal from the hand PCA, side = along × dorsal) and written as
     extra vertices fully weighted to that bone, so they move with the
     finger and cannot float. One skinned mesh, no extra draw calls. */
  function boneToMesh(mesh, bi, T) {
    const inv = mesh.skeleton.boneInverses[bi];
    const bmInv = mesh.bindMatrixInverse || new T.Matrix4().copy(mesh.bindMatrix).invert();
    return new T.Matrix4().multiplyMatrices(bmInv, inv.clone().invert());
  }
  function boneBasis(mesh, bone, bi, dorsalW, side, T) {
    let along = new T.Vector3(0, 1, 0);
    let len = 0.03;
    const kids = bone.children || [];
    for (let i = 0; i < kids.length; i++) {
      const k = kids[i];
      if (k && k.isBone) {
        const L = Math.hypot(k.position.x, k.position.y, k.position.z);
        if (L > 1e-6) { along = k.position.clone().multiplyScalar(1 / L); len = L; break; }
      }
    }
    let dorsal = new T.Vector3(0, 0, 1);
    const dw = dorsalW && dorsalW[side];
    if (dw && mesh && bi >= 0 && mesh.skeleton && mesh.skeleton.boneInverses[bi]) {
      const bw = new T.Matrix4().copy(mesh.skeleton.boneInverses[bi]).multiply(mesh.bindMatrix);
      const m3 = new T.Matrix3().setFromMatrix4(bw);
      const d = dw.clone().applyMatrix3(m3);
      if (d.lengthSq() > 1e-8) dorsal = d.normalize();
    }
    dorsal = dorsal.addScaledVector(along, -dorsal.dot(along));
    if (dorsal.lengthSq() < 1e-8) {
      dorsal = new T.Vector3(0, 0, 1);
      dorsal.addScaledVector(along, -dorsal.dot(along));
    }
    if (dorsal.lengthSq() < 1e-8) dorsal = new T.Vector3(1, 0, 0);
    else dorsal.normalize();
    const sideV = new T.Vector3().crossVectors(along, dorsal).normalize();
    if (sideV.lengthSq() < 1e-8) {
      sideV.crossVectors(along, new T.Vector3(1, 0, 0));
      if (sideV.lengthSq() < 1e-8) sideV.crossVectors(along, new T.Vector3(0, 0, 1));
      sideV.normalize();
    }
    dorsal = new T.Vector3().crossVectors(sideV, along).normalize();
    /* flex = along × palmar = along × (-dorsal); +angle curls the tip to the palm.
       If the axis comes out near +X, negate so a positive angle matches the
       historical rotateX(-θ) toward-palm convention on this rig. */
    const flex = new T.Vector3().crossVectors(along, dorsal).multiplyScalar(-1);
    if (flex.lengthSq() < 1e-8) flex.set(1, 0, 0);
    else flex.normalize();
    if (flex.x > 0.5) flex.negate();
    const basis = new T.Matrix4().makeBasis(sideV, along, dorsal);
    return { along: along, dorsal: dorsal, side: sideV, flex: flex, len: len, basis: basis };
  }
  function boneRadius(mesh, bi, along, T) {
    const g = mesh.geometry;
    if (!g || !g.attributes.position || !g.attributes.skinIndex) return 0.008;
    const pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const toBone = new T.Matrix4().copy(mesh.skeleton.boneInverses[bi]).multiply(mesh.bindMatrix);
    const v = new T.Vector3();
    let acc = 0, n = 0;
    for (let i = 0; i < pos.count; i++) {
      if (si.getX(i) !== bi || sw.getX(i) < 0.55) continue;
      v.fromBufferAttribute(pos, i).applyMatrix4(toBone);
      const r = v.addScaledVector(along, -v.dot(along)).length();
      if (r > 1e-5) { acc += r; n++; }
    }
    const raw = n ? acc / n : 0.008;
    U.sculptRad = U.sculptRad || [];
    if (U.sculptRad.length < 24) U.sculptRad.push(+raw.toFixed(4));
    /* Finger half-width is ~8–12mm. Clamp so a bad bind-space read cannot
       emit the giant cubes we saw when the radius came back too large. */
    return Math.min(0.012, Math.max(0.0045, raw));
  }
  function pushBoxBind(bag, toMesh, basis, x, y, z, w, h, d, col, rx, ry, rz, tags, T) {
    const tmp = { pos: [], nrm: [], uv: [], col: [] };
    pushBox(tmp, x, y, z, w, h, d, col, rx, ry, rz);
    const M = new T.Matrix4().multiplyMatrices(toMesh, basis);
    const M3 = new T.Matrix3().setFromMatrix4(M);
    const v = new T.Vector3(), nrm = new T.Vector3();
    const nail = (tags && tags.nail) || 0;
    const knk = (tags && tags.knk) || 0;
    const crease = (tags && tags.crease) || 0;
    for (let i = 0; i < tmp.pos.length; i += 3) {
      v.set(tmp.pos[i], tmp.pos[i + 1], tmp.pos[i + 2]).applyMatrix4(M);
      nrm.set(tmp.nrm[i], tmp.nrm[i + 1], tmp.nrm[i + 2]).applyMatrix3(M3).normalize();
      bag.pos.push(v.x, v.y, v.z);
      bag.nrm.push(nrm.x, nrm.y, nrm.z);
      bag.uv.push(tmp.uv[(i / 3) * 2], tmp.uv[(i / 3) * 2 + 1]);
      bag.bone.push(tags.bone);
      bag.nail.push(nail);
      bag.knk.push(knk);
      bag.crease.push(crease);
    }
  }
  function appendSculpt(mesh, bag, T) {
    const nAdd = (bag.pos.length / 3) | 0;
    if (!nAdd) return 0;
    const g = mesh.geometry;
    const nOld = g.attributes.position.count;
    function ext(name, itemSize, addArr, fill) {
      const attr = g.getAttribute(name);
      if (!attr && !addArr && fill == null) return;
      const Ctor = attr ? attr.array.constructor : (addArr ? addArr.constructor : Float32Array);
      const out = new Ctor((nOld + nAdd) * itemSize);
      if (attr) out.set(attr.array.subarray(0, nOld * itemSize));
      else if (fill != null) {
        for (let i = 0; i < nOld; i++) {
          for (let k = 0; k < itemSize; k++) out[i * itemSize + k] = fill[k] != null ? fill[k] : fill[0] || 0;
        }
      }
      if (addArr) out.set(addArr, nOld * itemSize);
      else if (fill != null) {
        for (let i = 0; i < nAdd; i++) {
          for (let k = 0; k < itemSize; k++) out[(nOld + i) * itemSize + k] = fill[k] != null ? fill[k] : fill[0] || 0;
        }
      }
      const ba = new T.BufferAttribute(out, itemSize);
      if (attr && attr.normalized) ba.normalized = true;
      g.setAttribute(name, ba);
    }
    ext('position', 3, new Float32Array(bag.pos));
    ext('normal', 3, new Float32Array(bag.nrm));
    ext('uv', 2, new Float32Array(bag.uv), [0, 0]);
    const SiCtor = g.attributes.skinIndex ? g.attributes.skinIndex.array.constructor : Uint16Array;
    const si = new SiCtor(nAdd * 4);
    const sw = new Float32Array(nAdd * 4);
    for (let i = 0; i < nAdd; i++) {
      si[i * 4] = bag.bone[i];
      sw[i * 4] = 1;
    }
    ext('skinIndex', 4, si, [0, 0, 0, 0]);
    ext('skinWeight', 4, sw, [1, 0, 0, 0]);
    ext('aCrease1282', 1, new Float32Array(bag.crease), [0]);
    ext('aNail1282', 1, new Float32Array(bag.nail), [0]);
    ext('aKnk1282', 1, new Float32Array(bag.knk), [0]);
    ext('aFpHand1285', 1, null, [1]);
    if (g.index) {
      const old = g.index.array;
      const out = new Uint32Array(old.length + nAdd);
      out.set(old);
      for (let i = 0; i < nAdd; i++) out[old.length + i] = nOld + i;
      g.setIndex(new T.BufferAttribute(out, 1));
    }
    try { g.computeBoundingSphere(); } catch (_) {}
    return nAdd;
  }
  function bakeSculpt(mesh, state, T) {
    const g = mesh.geometry;
    if (!g || g.userData.sculpt1285 || !mesh.skeleton) return 0;
    const dorsalW = (g.userData && g.userData.dorsalW) || {};
    const bag = { pos: [], nrm: [], uv: [], bone: [], nail: [], knk: [], crease: [] };
    const bones = mesh.skeleton.bones;
    function frameOf(bone) {
      if (!bone) return null;
      const bi = bones.indexOf(bone);
      if (bi < 0) return null;
      const fr = boneBasis(mesh, bone, bi, dorsalW, state.side, T);
      fr.bi = bi;
      fr.toMesh = boneToMesh(mesh, bi, T);
      fr.r = boneRadius(mesh, bi, fr.along, T);
      if (bone === state.hand) fr.r = Math.min(0.030, Math.max(fr.r, 0.016));
      return fr;
    }
    function box(fr, x, y, z, w, h, d, col, rx, ry, rz, tags) {
      tags = tags || {};
      tags.bone = fr.bi;
      pushBoxBind(bag, fr.toMesh, fr.basis, x, y, z, w, h, d, col, rx, ry, rz, tags, T);
    }
    for (let i = 0; i < 4; i++) {
      const prox = frameOf(state.prox[i]);
      const dist = frameOf(state.dist[i]);
      const slim = 0.88 - i * 0.06;
      if (prox) {
        const L = prox.len, r = prox.r * slim, z = r + 0.0018;
        box(prox, 0, L * 0.08, z, r * 1.70, r * 0.95, r * 0.80, skinCol('knk'), 0.10, 0, 0, { knk: 1 });
        box(prox, 0, L * 0.18, z * 0.90, r * 1.25, r * 0.55, r * 0.50, skinCol('knk'), 0.06, 0, 0, { knk: 0.7 });
        box(prox, 0, L * 0.52, z * 0.78, r * 0.72, L * 0.62, r * 0.42, skinCol('tend'), 0.04, 0, 0, { knk: 0.35 });
        box(prox, r * 0.15, L * 0.48, z * 0.70, r * 0.32, L * 0.40, r * 0.22, skinCol('vein'), 0.08, 0.04, 0, { crease: 0.45 });
      }
      if (dist) {
        const L = Math.max(dist.len, 0.024), r = (prox ? prox.r : dist.r) * slim * 0.92, z = r + 0.0016;
        box(dist, 0, L * 0.08, z, r * 1.55, r * 0.80, r * 0.65, skinCol('knk'), 0.08, 0, 0, { knk: 0.85 });
        box(dist, 0, L * 0.48, -(r + 0.0012), r * 1.55, L * 0.55, r * 0.70, skinCol('pad'), -0.06, 0, 0, { crease: 0.4 });
        box(dist, 0, L * 0.78, z + 0.0006, r * 1.55, L * 0.32, r * 0.42, skinCol('nail'), -0.10, 0, 0, { nail: 1 });
        box(dist, 0, L * 0.92, z + 0.0008, r * 1.35, L * 0.16, r * 0.32, skinCol('nailTip'), -0.04, 0, 0, { nail: 1 });
      }
    }
    const th0 = frameOf(state.thumb[0]);
    const th1 = frameOf(state.thumb[1]);
    if (th0) {
      const L = th0.len, r = th0.r * 1.05, z = r + 0.0018;
      box(th0, 0, L * 0.12, z, r * 2.10, r * 1.20, r * 1.05, skinCol('knk'), 0.10, 0, 0, { knk: 1 });
      box(th0, 0, L * 0.55, -(r + 0.0010), r * 1.70, L * 0.50, r * 0.75, skinCol('pad'), -0.08, 0, 0, { crease: 0.35 });
    }
    if (th1) {
      const L = Math.max(th1.len, 0.022), r = (th0 ? th0.r : th1.r) * 0.95, z = r + 0.0016;
      box(th1, 0, L * 0.10, z, r * 1.80, r * 0.95, r * 0.85, skinCol('knk'), 0.08, 0, 0, { knk: 0.8 });
      box(th1, 0, L * 0.50, -(r + 0.0010), r * 1.50, L * 0.48, r * 0.65, skinCol('pad'), -0.06, 0, 0, { crease: 0.35 });
      box(th1, 0, L * 0.76, z + 0.0006, r * 1.50, L * 0.30, r * 0.40, skinCol('nail'), -0.12, 0, 0, { nail: 1 });
      box(th1, 0, L * 0.90, z + 0.0008, r * 1.28, L * 0.16, r * 0.30, skinCol('nailTip'), -0.04, 0, 0, { nail: 1 });
    }
    const hand = frameOf(state.hand);
    if (hand) {
      const L = Math.max(hand.len, 0.07), r = Math.max(hand.r, 0.018), z = r * 0.62 + 0.002;
      const xs = [-0.014, -0.005, 0.005, 0.014];
      for (let i = 0; i < xs.length; i++) {
        box(hand, xs[i], L * 0.42, z, 0.0024, L * 0.70, 0.0022, skinCol('tend'), 0.08, 0, 0, { knk: 0.4 });
        box(hand, xs[i] * 0.92, L * 0.78, z + 0.0006, 0.0032, 0.012, 0.0026, skinCol('tend'), 0.04, 0, 0, { knk: 0.55 });
      }
      box(hand, -0.009, L * 0.28, z - 0.0006, 0.0014, L * 0.50, 0.0013, skinCol('vein'), 0.12, 0.06, 0, { crease: 0.55 });
      box(hand, 0.008, L * 0.22, z - 0.0008, 0.0012, L * 0.40, 0.0012, skinCol('vein'), 0.08, -0.05, 0, { crease: 0.5 });
      box(hand, -r * 0.95, -0.008, r * 0.20, 0.009, 0.012, 0.008, skinCol('wrist'), 0.18, 0, 0.12, { knk: 0.5 });
      box(hand, r * 0.95, -0.008, r * 0.16, 0.008, 0.011, 0.007, skinCol('wrist'), 0.14, 0, -0.12, { knk: 0.5 });
      box(hand, 0, -0.004, z * 0.75, r * 1.70, 0.0020, 0.0024, skinCol('tend'), 0.05, 0, 0, { crease: 0.6 });
      box(hand, 0, -0.009, z * 0.68, r * 1.55, 0.0016, 0.0020, skinCol('tend'), 0.02, 0, 0, { crease: 0.55 });
      box(hand, 0, L * 0.38, -(z * 0.85), r * 1.55, 0.0018, 0.0020, skinCol('pad'), 0.04, 0, 0, { crease: 0.8 });
      box(hand, 0.002, L * 0.52, -(z * 0.80), r * 1.25, 0.0015, 0.0018, skinCol('pad'), 0.10, 0.08, 0, { crease: 0.75 });
      box(hand, -0.004, L * 0.24, -(z * 0.82), r * 1.35, 0.0015, 0.0018, skinCol('pad'), -0.06, 0, 0, { crease: 0.7 });
    }
    const added = appendSculpt(mesh, bag, T);
    g.userData.sculpt1285 = 1;
    U.sculpted = (U.sculpted || 0) + 1;
    U.sculptVerts = (U.sculptVerts || 0) + added;
    return added;
  }

  /* Rolled linen cuff + fold facets + weave ridges on the existing __fpa
     sleeve, in the sleeve mesh's own local space (not glove-bone space). */
  function sleeveHost(p) {
    if (!p) return null;
    let found = null;
    const root = p.h || p.cuff || p.fo;
    if (root && root.traverse) {
      root.traverse(function (o) {
        if (found) return;
        if (!o.isMesh) return;
        if (o.userData && (o.userData.fpTpHand1285 || o.userData.fpSculpt1285)) return;
        if (isLinenSleeve(o)) found = o;
      });
    }
    return found || p.cuff || p.fo || null;
  }
  function dressCuff(p, T, side) {
    if (!p || p.__cuff1285) return;
    p.__cuff1285 = 1;
    const host = sleeveHost(p);
    if (!host) return;
    let along = new T.Vector3(0, 1, 0);
    let mid = new T.Vector3();
    let rad = 0.044, half = 0.07, wristAlong = 0;
    try {
      const geo = host.geometry;
      if (geo) {
        if (!geo.boundingBox) geo.computeBoundingBox();
        const bb = geo.boundingBox;
        if (bb) {
          const size = new T.Vector3();
          bb.getSize(size);
          bb.getCenter(mid);
          if (size.x >= size.y && size.x >= size.z) { along.set(1, 0, 0); half = size.x * 0.5; rad = Math.max(size.y, size.z) * 0.5; }
          else if (size.z >= size.x && size.z >= size.y) { along.set(0, 0, 1); half = size.z * 0.5; rad = Math.max(size.x, size.y) * 0.5; }
          else { along.set(0, 1, 0); half = size.y * 0.5; rad = Math.max(size.x, size.z) * 0.5; }
          /* 1280 sleeves run along -Y from the wrist, so the hem is the +along end. */
          wristAlong = mid.dot(along) + (along.y < 0 ? -half : half);
        }
      }
    } catch (_) {}
    if (rad < 0.02 || rad > 0.06) rad = 0.044;
    if (half < 0.03 || half > 0.14) half = 0.07;
    const a = along.clone().normalize();
    let u = new T.Vector3(1, 0, 0);
    if (Math.abs(a.dot(u)) > 0.9) u.set(0, 0, 1);
    u.addScaledVector(a, -u.dot(a)).normalize();
    const v = new T.Vector3().crossVectors(a, u).normalize();
    const basis = new T.Matrix4().makeBasis(u, a, v);
    const bag = { pos: [], nrm: [], uv: [], col: [] };
    function foldBox(x, y, z, w, h, d, col, rx, ry, rz) {
      const tmp = { pos: [], nrm: [], uv: [], col: [] };
      pushBox(tmp, x, y, z, w, h, d, col, rx, ry, rz);
      const M3 = new T.Matrix3().setFromMatrix4(basis);
      const p3 = new T.Vector3(), n3 = new T.Vector3();
      for (let i = 0; i < tmp.pos.length; i += 3) {
        p3.set(tmp.pos[i], tmp.pos[i + 1], tmp.pos[i + 2]).applyMatrix4(basis);
        n3.set(tmp.nrm[i], tmp.nrm[i + 1], tmp.nrm[i + 2]).applyMatrix3(M3).normalize();
        bag.pos.push(p3.x, p3.y, p3.z);
        bag.nrm.push(n3.x, n3.y, n3.z);
        bag.uv.push(tmp.uv[(i / 3) * 2], tmp.uv[(i / 3) * 2 + 1]);
        bag.col.push(tmp.col[i], tmp.col[i + 1], tmp.col[i + 2]);
      }
    }
    const RAD = 12, tube = Math.max(0.0055, rad * 0.14);
    for (let i = 0; i < RAD; i++) {
      const ang = (i / RAD) * Math.PI * 2;
      const fold = 1 - 0.16 * Math.max(0, Math.sin(ang * 4));
      const col = fold < 0.92 ? skinCol('linenFold') : skinCol('linenHi');
      const x = Math.cos(ang) * rad * fold, z = Math.sin(ang) * rad * fold;
      foldBox(x, wristAlong - tube * 0.2, z, tube * 1.7, tube * 1.9, tube * 1.7, col, 0, -ang, 0.18);
    }
    const body = Math.min(half * 1.4, 0.12);
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + 0.18;
      const x = Math.cos(ang) * rad * 1.02, z = Math.sin(ang) * rad * 1.02;
      const col = (i % 2) ? skinCol('linenFold') : skinCol('linenHi');
      foldBox(x, wristAlong - body * 0.52, z, 0.0042, body, 0.0036, col, 0.03, -ang, 0);
    }
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      const x = Math.cos(ang) * rad * 1.04, z = Math.sin(ang) * rad * 1.04;
      foldBox(x, wristAlong - 0.016, z, 0.016, 0.026, 0.0042, skinCol('linen'), 0, -ang, 0);
    }
    const mat = sculptMat(T, 'linen');
    const mesh = mkMesh(T, bagToGeo(T, bag), mat);
    mesh.userData.fpForearm1285 = 1;
    mesh.userData.fpSculpt1285 = 1;
    mesh.name = 'fpLinenCuff1285' + (side || '');
    try { host.add(mesh); } catch (_) { if (p.h) p.h.add(mesh); }
    U.cuffDressed = (U.cuffDressed || 0) + 1;
  }

  /* ---- clone the loaded GLOVE + a trimmed bind-pose skeleton onto p.h ---- */
  function inSubtree(b, root) {
    let x = b;
    while (x) { if (x === root) return true; x = x.parent; }
    return false;
  }
  function dropMorphs(mesh) {
    try {
      mesh.morphTargetInfluences = [];
      mesh.morphTargetDictionary = {};
      if (mesh.geometry) {
        mesh.geometry.morphAttributes = {};
        mesh.geometry.morphTargetsRelative = false;
      }
    } catch (_) {}
  }
  function remapSkin(geo, srcToNew, handNew) {
    const si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
    if (!si || !sw) return;
    const n = si.count;
    for (let i = 0; i < n; i++) {
      const idx = [si.getX(i), si.getY(i), si.getZ(i), si.getW(i)];
      const wt = [sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i)];
      const acc = {};
      for (let j = 0; j < 4; j++) {
        if (wt[j] <= 0) continue;
        let ni = (idx[j] >= 0 && idx[j] < srcToNew.length) ? srcToNew[idx[j]] : -1;
        if (ni < 0) ni = handNew;
        acc[ni] = (acc[ni] || 0) + wt[j];
      }
      const keys = Object.keys(acc).map(Number).sort(function (a, b) { return acc[b] - acc[a]; });
      let sx = 0, sy = 0, sz = 0, sw0 = 0, wx = 0, wy = 0, wz = 0, ww = 0;
      if (keys[0] != null) { sx = keys[0]; wx = acc[keys[0]]; }
      if (keys[1] != null) { sy = keys[1]; wy = acc[keys[1]]; }
      if (keys[2] != null) { sz = keys[2]; wz = acc[keys[2]]; }
      if (keys[3] != null) { sw0 = keys[3]; ww = acc[keys[3]]; }
      const sum = wx + wy + wz + ww || 1;
      si.setXYZW(i, sx, sy, sz, sw0);
      sw.setXYZW(i, wx / sum, wy / sum, wz / sum, ww / sum);
    }
    si.needsUpdate = true;
    sw.needsUpdate = true;
  }
  function bindFlex(state, T) {
    const mesh = (state.meshes || []).find(function (m) {
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      return mats.some(isSkinMat);
    }) || (state.meshes && state.meshes[0]);
    if (!mesh || !mesh.skeleton) return;
    const dorsalW = (mesh.geometry && mesh.geometry.userData && mesh.geometry.userData.dorsalW) || {};
    const list = [].concat(state.prox, state.dist, state.thumb, [state.hand]);
    for (let i = 0; i < list.length; i++) {
      const bone = list[i];
      if (!bone) continue;
      const bi = mesh.skeleton.bones.indexOf(bone);
      const fr = boneBasis(mesh, bone, bi, dorsalW, state.side, T);
      bone.userData.along = fr.along;
      bone.userData.dorsal = fr.dorsal;
      bone.userData.flex = fr.flex;
      bone.userData.len = fr.len;
    }
  }

  function buildSide(srcScene, srcMeshes, srcSkel, side, T) {
    srcScene.updateMatrixWorld(true);
    const srcBones = srcSkel.bones;
    /* Keep this side's hand/finger/thumb bones AND their ancestors (forearm
       through root) so the bind layout still places the wrist at wrap origin.
       Drop the other arm, legs and head. Ancestor bones stay frozen in bind. */
    const keepRe = new RegExp('^(hand|finger|thumb)' + side, 'i');
    const keepSet = new Set();
    for (let i = 0; i < srcBones.length; i++) {
      if (!keepRe.test(norm(srcBones[i].name))) continue;
      let x = srcBones[i];
      while (x) {
        keepSet.add(x);
        x = x.parent && srcBones.indexOf(x.parent) >= 0 ? x.parent : null;
      }
    }
    const keepSrc = [];
    const srcToNew = [];
    for (let i = 0; i < srcBones.length; i++) {
      if (keepSet.has(srcBones[i])) {
        srcToNew[i] = keepSrc.length;
        keepSrc.push(srcBones[i]);
      } else srcToNew[i] = -1;
    }
    const copies = [];
    const map = new Map();
    for (let i = 0; i < keepSrc.length; i++) {
      const s = keepSrc[i];
      const b = new T.Bone();
      b.name = norm(s.name);
      b.position.copy(s.position);
      b.quaternion.copy(s.quaternion);
      b.scale.copy(s.scale);
      map.set(s, b);
      copies.push(b);
    }
    for (let i = 0; i < keepSrc.length; i++) {
      const s = keepSrc[i];
      const kids = s.children || [];
      for (let k = 0; k < kids.length; k++) {
        const c = map.get(kids[k]);
        if (c) copies[i].add(c);
      }
    }
    const hand = copies.find(function (b) { return b.name === 'hand' + side; });
    if (!hand) throw new Error('no hand' + side);
    const handNew = copies.indexOf(hand);
    U['skelTrim' + side] = copies.length;

    const wrap = new T.Group();
    wrap.name = 'fpTpHand' + side;
    wrap.userData.fpTpHand1285 = 1;
    const align = new T.Group();
    align.userData.fpTpHand1285 = 1;
    wrap.add(align);
    hookAlignBake(align, T);

    const srcHand = srcBones.find(function (b) { return norm(b.name) === 'hand' + side; });
    const invH = new T.Matrix4().copy(srcHand.matrixWorld).invert();
    invH.decompose(align.position, align.quaternion, align.scale);

    for (let i = 0; i < keepSrc.length; i++) {
      if (!keepSrc[i].parent || !map.get(keepSrc[i].parent)) align.add(copies[i]);
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
      dropMorphs(mesh);
      remapSkin(mesh.geometry, srcToNew, handNew);
      align.add(mesh);
      outMeshes.push(mesh);
    }
    align.updateMatrixWorld(true);

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

    for (let i = 0; i < outMeshes.length; i++) {
      const mesh = outMeshes[i];
      mesh.bind(newSkel);
      if (!mesh.geometry.attributes.aCrease1282) bake(mesh, T);
      try { bakeHandFrame(mesh, T); } catch (e) { ERR('handFrame', e); }
      try { bakeCuffMask(mesh, T, side, srcSkel, srcMeshes[i]); }
      catch (e) { U.cuffStats = { err: String(e && e.message || e) }; }
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (U.prism && mats.some(isSkinMat)) {
        try { bakeSculpt(mesh, state, T); }
        catch (e) { ERR('sculpt', e); }
      }
      for (let j = 0; j < mats.length; j++) patchMat(mats[j], isSkinMat(mats[j]));
      lockMaterial(mesh);
    }

    U['bones' + side] = {
      names: state.names.filter(function (n) { return /hand|finger|thumb/i.test(n); }),
      prox: state.prox.map(function (b) { return b && b.name; }),
      dist: state.dist.map(function (b) { return b && b.name; }),
      thumb: state.thumb.map(function (b) { return b && b.name; })
    };
    copies.forEach(function (b) {
      b.userData.bindQ = b.quaternion.clone();
      /* Freeze everything that is not a posed hand/finger/thumb bone. */
      if (!/^(hand|finger|thumb)/i.test(b.name)) {
        b.matrixAutoUpdate = false;
        b.userData.fpFrozen1285 = 1;
      }
    });
    bindFlex(state, T);
    function beforeDraw() {
      if (!U.on) return;
      const stamp = (typeof performance !== 'undefined' && performance.now) ? (performance.now() | 0) : Date.now();
      if (U._poseStamp === stamp) return;
      U._poseStamp = stamp;
      fpRun('beforeDraw');
      /* t1251: poseKind/applyTune used to run here every frame (once
         per ms), which re-curled every finger and rewrote the wrist
         seat after tick() had already been gated to item switch.
         Seat, cuff-follow and curls stay on the once-per-switch
         path. Only restamp HELD_OFF so a 1251/1261 freeze rewrite
         cannot drop the constant table mid-draw. */
      try { if (typeof drawOffOn === 'function') drawOffOn(); } catch (_) {}
      try { applyViewOff(T); } catch (_) {}
    }
    for (let i = 0; i < outMeshes.length; i++) outMeshes[i].onBeforeRender = beforeDraw;
    return state;
  }


  /* Constant cuff translation in the same parent space as the glove
     wrap, so a wrist seat that reaches a bail/shaft does not open a
     10 cm cuff gap. Base is captured once per cuff; not a per-frame seek. */
  function applyCuffFollow(state, seat) {
    const T = T3(); if (!T) return;
    const R = rig();
    const arm = R && R.userData && R.userData[state.side];
    if (!arm) return;
    const follow = !!(seat && seat.cuffFollow);
    const fk = (U.kind || '') + ':' + state.side + ':' + (follow ? 1 : 0)
      + ':' + ((seat && seat.x) || 0) + ',' + ((seat && seat.y) || 0) + ',' + ((seat && seat.z) || 0)
      + ':' + ((seat && seat.cuffScale) || 1) + ':' + ((seat && seat.cuffNx) || 0) + ',' + ((seat && seat.cuffNy) || 0) + ',' + ((seat && seat.cuffNz) || 0);
    /* Once per kind/seat. The t1249 confirm pass re-walked the arm and
       called updateMatrixWorld after the viewmodel parent scale had
       already started drifting (0.56–0.84), which dirtied matrices
       every time the scale changed. */
    if (state._cuffFk === fk) return;
    state._cuffFk = fk;
    fpRun('cuffBody');
    const wrap = state.wrap;
    /* Wrist-local (p.h) delta, not a world delta. A world bake includes
       the current parent scale, so a later scale change (c350 / fpa)
       either reopens the cuff or forces a recompute. Local wrap.matrix
       already lives in p.h space; common-ancestor scale then cancels
       in the relative matrix for nested linen. (Three.js: divide out
       parent scale / work in the parent's local frame; see also
       viewmodel attach under a scaled parent.) */
    let dPh = null;
    const tmp = U._cuffTmp || (U._cuffTmp = {
      a: new T.Vector3(), b: new T.Vector3(), loc: new T.Vector3(0, -0.03, 0),
      d: new T.Vector3(), p0: new T.Vector3(), p1: new T.Vector3(),
      mat: new T.Matrix4(), inv: new T.Matrix4()
    });
    if (follow && wrap && wrap.parent) {
      const t = U.tune || {};
      const px = wrap.position.x, py = wrap.position.y, pz = wrap.position.z;
      const rx = wrap.rotation.x, ry = wrap.rotation.y, rz = wrap.rotation.z;
      const sx = wrap.scale.x, sy = wrap.scale.y, sz = wrap.scale.z;
      const sc = (t.scale == null ? 1 : t.scale);
      const tsx = (t.sx == null ? 1 : t.sx);
      wrap.position.set(t.x || 0, t.y || 0, t.z || 0);
      wrap.rotation.set(t.rx || 0, t.ry || 0, t.rz || 0);
      wrap.scale.set(sc * tsx, sc, sc);
      wrap.updateMatrix();
      tmp.a.copy(tmp.loc).applyMatrix4(wrap.matrix);
      wrap.position.set(px, py, pz);
      wrap.rotation.set(rx, ry, rz);
      wrap.scale.set(sx, sy, sz);
      wrap.updateMatrix();
      tmp.b.copy(tmp.loc).applyMatrix4(wrap.matrix);
      dPh = tmp.d.copy(tmp.b).sub(tmp.a);
      const boost = (seat && seat.cuffScale != null) ? seat.cuffScale : 1;
      if (boost !== 1) dPh.multiplyScalar(boost);
      dPh.x += (seat && seat.cuffNx) || 0;
      dPh.y += (seat && seat.cuffNy) || 0;
      dPh.z += (seat && seat.cuffNz) || 0;
      if (dPh.lengthSq() < 1e-12) dPh = null;
    }
    const wrist = wrap && wrap.parent;
    const visit = function (o) {
      if (!o || !o.isMesh || !o.parent) return;
      if (state.wrap && (o === state.wrap || o.parent === state.wrap)) return;
      const n = (o.name || '') + ' ' + ((o.userData && o.userData.name) || '');
      const linen = (typeof isLinenSleeve === 'function') && isLinenSleeve(o);
      if (!linen && !/cuff|sleeve|linen|forearm/i.test(n) && !(arm.userData && arm.userData.p && o === arm.userData.p.cuff)) return;
      if (!o.userData._fpCuffBase1285) o.userData._fpCuffBase1285 = o.position.clone();
      o.position.copy(o.userData._fpCuffBase1285);
      if (!dPh || !wrist) return;
      if (o.parent === wrist) { o.position.add(dPh); return; }
      /* Delta in wrist space -> o.parent space: invert the local chain
         from the wrist down to the cuff's parent. */
      tmp.mat.identity();
      let node = o.parent, hops = 0, under = 0;
      while (node && hops++ < 8) {
        if (node === wrist) { under = 1; break; }
        tmp.mat.premultiply(node.matrix);
        node = node.parent;
      }
      if (under) {
        tmp.mat.invert();
      } else {
        try { wrist.updateMatrixWorld(true); o.parent.updateMatrixWorld(true); } catch (_) {}
        tmp.mat.copy(wrist.matrixWorld).premultiply(tmp.inv.copy(o.parent.matrixWorld).invert());
      }
      tmp.p0.set(0, 0, 0).applyMatrix4(tmp.mat);
      tmp.p1.copy(dPh).applyMatrix4(tmp.mat);
      o.position.add(tmp.p1.sub(tmp.p0));
    };
    if (arm.traverse) arm.traverse(visit);
    else visit(arm.userData && arm.userData.p && arm.userData.p.cuff);
  }

  function applyTune(state) {
    const _pt = profBegin('applyTune');
    const t = U.tune || {};
    const ONE_HAND = { pick: 1, p761: 1, p760: 1, sword: 1, torch: 1, bucket: 1, axe: 1, shovel: 1, hoe: 1, block: 1, map: 1, pistol: 1 };
    let seat = (U.seat && U.seat[U.kind]) || (U.seat && U.seat.empty) || {};
    /* Seat offsets are for the holding hand. Applying them to the left
       glove slid it into the play camera (two overlapping fists). */
    if (state.side === 'L' && ONE_HAND[U.kind]) seat = (U.seat && U.seat.empty) || {};
    if (state.side === 'L' && U.kind === 'musket' && U.seat && U.seat.musketL) seat = U.seat.musketL;
    const sc = (seat.scale != null ? seat.scale : (t.scale == null ? 1 : t.scale));
    const sx = (seat.sx != null ? seat.sx : (t.sx == null ? 1 : t.sx));
    const tk = (U.kind || '') + ':' + state.side
      + ':' + ((t.x || 0) + (seat.x || 0)) + ',' + ((t.y || 0) + (seat.y || 0)) + ',' + ((t.z || 0) + (seat.z || 0))
      + ':' + ((t.rx || 0) + (seat.rx || 0)) + ',' + ((t.ry || 0) + (seat.ry || 0)) + ',' + ((t.rz || 0) + (seat.rz || 0))
      + ':' + sc + ',' + sx
      + ':' + ((seat.cuffScale) || 1) + ':' + ((seat.cuffNx) || 0) + ',' + ((seat.cuffNy) || 0) + ',' + ((seat.cuffNz) || 0)
      + ':' + (seat.cuffFollow ? 1 : 0);
    /* Once per item/seat. Rewriting wrap.position every frame dirtied
       the arm subtree (and, under a drifting viewmodel scale, forced
       matrix updates) after the cuff-follow itself was already cached. */
    if (state._tuneFk === tk) {
      if (state.side === 'R') {
        try { drawOffOn(); } catch (e) { ERR('itemGrip', e); }
      }
      profEnd('applyTune', _pt);
      return;
    }
    state._tuneFk = tk;
    fpRun('applyTuneBody');
    if (state.wrap) state.wrap.visible = !(state.side === 'L' && ONE_HAND[U.kind]);
    state.wrap.position.set((t.x || 0) + (seat.x || 0), (t.y || 0) + (seat.y || 0), (t.z || 0) + (seat.z || 0));
    state.wrap.rotation.set((t.rx || 0) + (seat.rx || 0), (t.ry || 0) + (seat.ry || 0), (t.rz || 0) + (seat.rz || 0));
    state.wrap.scale.set(sc * sx, sc, sc);
    try { applyCuffFollow(state, seat); } catch (e) { ERR('cuffFollow', e); }

    if (state.side === 'R') {
      if (U._tubeKind !== U.kind) {
        try {
          hideGunSleeveTubes(state);
          if (U.sides && U.sides.L) hideGunSleeveTubes(U.sides.L);
        } catch (e) { ERR('hideTube', e); }
        U._tubeKind = U.kind;
      }
      try { const _ph = profBegin('applyHeldOffsets'); applyHeldOffsets(); profEnd('applyHeldOffsets', _ph); } catch (e) { ERR('itemGrip', e); }
    }
    profEnd('applyTune', _pt);
  }

  /* t1225 grip lock: slide the glove (translation only, in p.h space) so
     the hole of the fist sits on the held item's handle. The held item and
     the __fpa arm keep their own animation; only the glove follows. The
     handle point is found once per item from its geometry (long axis, 15%
     up from the end nearer the bottom of the screen; bucket: top of bail). */
  const GRIP_KINDS = { pistol: 1, torch: 1, sword: 1, pick: 1, p761: 1, p760: 1, axe: 1, shovel: 1, hoe: 1, bucket: 1 };
  function heldGripLocal(T, h, kind) {
    const key = kind + ':' + h.children.map(function (c) { return c.uuid; }).join(',');
    if (U._gripKey === key) return U._grip;
    U._gripKey = key; U._grip = null;
    h.updateMatrixWorld(true);
    const hi = new T.Matrix4().copy(h.matrixWorld).invert();
    const pts = [];
    h.traverse(function (o) {
      if (!o.isMesh || !o.visible || !o.geometry || !o.geometry.attributes.position) return;
      const m = new T.Matrix4().multiplyMatrices(hi, o.matrixWorld);
      const p = o.geometry.attributes.position;
      const step = Math.max(1, (p.count / 300) | 0);
      for (let i = 0; i < p.count; i += step) pts.push(fromPos(p, i, new T.Vector3()).applyMatrix4(m));
    });
    if (pts.length < 4) return null;
    const c = new T.Vector3();
    for (let i = 0; i < pts.length; i++) c.add(pts[i]);
    c.multiplyScalar(1 / pts.length);
    if (kind === 'bucket') {
      const bb = new T.Box3().setFromPoints(pts);
      U._grip = new T.Vector3((bb.min.x + bb.max.x) / 2, bb.max.y - 0.012, (bb.min.z + bb.max.z) / 2);
      return U._grip;
    }
    let ax = new T.Vector3(0, 1, 0);
    const d = new T.Vector3();
    for (let it = 0; it < 16; it++) {
      const n = new T.Vector3();
      for (let i = 0; i < pts.length; i++) { d.copy(pts[i]).sub(c); n.addScaledVector(d, d.dot(ax)); }
      if (n.lengthSq() < 1e-12) break;
      ax = n.normalize();
    }
    let lo = Infinity, hi2 = -Infinity;
    for (let i = 0; i < pts.length; i++) { const t = d.copy(pts[i]).sub(c).dot(ax); if (t < lo) lo = t; if (t > hi2) hi2 = t; }
    const eA = c.clone().addScaledVector(ax, lo), eB = c.clone().addScaledVector(ax, hi2);
    const cam = (typeof camera !== 'undefined' && camera) || W.camera;
    let base = eA, tip = eB;
    if (cam) {
      cam.updateMatrixWorld(true);
      const ci = new T.Matrix4().copy(cam.matrixWorld).invert();
      const ya = eA.clone().applyMatrix4(h.matrixWorld).applyMatrix4(ci).y;
      const yb = eB.clone().applyMatrix4(h.matrixWorld).applyMatrix4(ci).y;
      if (yb < ya) { base = eB; tip = eA; }
    }
    U._grip = base.clone().lerp(tip, 0.15);
    return U._grip;
  }
  /* Gun grip (C350 viewmodel guns): the magazine mesh sits inside the grip,
     so its long axis is the grip axis. Cached in the mesh's own space. */
  function gunGrip(T, h) {
    const key = 'gun:' + h.children.map(function (c) { return c.uuid; }).join(',');
    if (U._gunKey === key) return U._gun;
    U._gunKey = key; U._gun = null;
    let mag = null;
    h.traverse(function (o) { if (!mag && o.isMesh && /magazine/i.test(o.name || '')) mag = o; });
    if (!mag || !mag.geometry) return null;
    /* Don't trust geometry.boundingBox: quantized Int16 boxes are huge. */
    const pos = mag.geometry.attributes.position;
    const tmp = new T.Vector3();
    const bb = new T.Box3();
    const step = Math.max(1, (pos.count / 400) | 0);
    for (let i = 0; i < pos.count; i += step) bb.expandByPoint(fromPos(pos, i, tmp));
    const c = bb.getCenter(new T.Vector3()), sz = bb.getSize(new T.Vector3());
    const k = sz.x > sz.y ? (sz.x > sz.z ? 'x' : 'z') : (sz.y > sz.z ? 'y' : 'z');
    const A = c.clone(), B = c.clone();
    A[k] = bb.min[k]; B[k] = bb.max[k];
    U._gun = { mesh: mag, A: A, B: B };
    return U._gun;
  }
  function gripLock(state) {
    const T = T3(); if (!T) return;
    let h = null;
    try { if (typeof held !== 'undefined') h = held; } catch (_) {}
    const ph = state.wrap.parent;
    if (!h || !ph || !h.children || !h.children.length || !h.visible) return;
    const tmp = U._gripTmp || (U._gripTmp = { m: new T.Matrix4(), a: new T.Vector3(), b: new T.Vector3(), c: new T.Vector3(), q: new T.Quaternion(), pi: new T.Matrix4() });
    tmp.pi.copy(ph.matrixWorld).invert();
    const gun = U.kind === 'pistol';
    let axisPh = null;
    if (gun) {
      const gg = gunGrip(T, h);
      if (!gg || !gg.mesh.visible) return;
      tmp.m.multiplyMatrices(tmp.pi, gg.mesh.matrixWorld);
      const A = tmp.a.copy(gg.A).applyMatrix4(tmp.m), B = tmp.c.copy(gg.B).applyMatrix4(tmp.m);
      /* top = end nearer the slide (higher on screen, p.h +y is not screen up, so use world). */
      const Aw = gg.A.clone().applyMatrix4(gg.mesh.matrixWorld), Bw = gg.B.clone().applyMatrix4(gg.mesh.matrixWorld);
      const cam = (typeof camera !== 'undefined' && camera) || W.camera;
      let top = A, bot = B;
      if (cam) { const ci = U._camInv || (U._camInv = new T.Matrix4()); ci.copy(cam.matrixWorld).invert(); if (Bw.applyMatrix4(ci).y > Aw.applyMatrix4(ci).y) { top = B; bot = A; } }
      axisPh = bot.clone().sub(top).normalize();
      tmp.b.copy(top).lerp(bot, U.gunGripF);
    } else {
      const g = heldGripLocal(T, h, U.kind);
      if (!g) return;
      tmp.m.multiplyMatrices(tmp.pi, h.matrixWorld);
      tmp.b.copy(g).applyMatrix4(tmp.m);
    }
    /* Fist hole (and index-to-little lane) in wrap-local space, cached per pose kind. */
    if (state._holeKind !== U.kind || !state._hole) {
      state.wrap.updateMatrixWorld(true);
      const wi = new T.Matrix4().copy(state.wrap.matrixWorld).invert();
      const K = new T.Vector3(), D = new T.Vector3(), v = new T.Vector3();
      const f0 = gun ? 1 : 0;
      for (let i = f0; i < 4; i++) {
        if (state.prox[i]) K.add(state.prox[i].getWorldPosition(v));
        if (state.dist[i]) D.add(state.dist[i].getWorldPosition(v));
      }
      const n = 4 - f0;
      state._hole = K.multiplyScalar(1 / n).add(D.multiplyScalar(1 / n)).multiplyScalar(0.5).applyMatrix4(wi);
      const p0 = state.prox[f0].getWorldPosition(new T.Vector3()).applyMatrix4(wi);
      const p3 = state.prox[3].getWorldPosition(new T.Vector3()).applyMatrix4(wi);
      state._lane = p3.sub(p0).normalize();
      state._holeKind = U.kind;
    }
    if (axisPh) {
      /* Turn the glove so the finger lane runs down the grip (index under the slide). */
      const lanePh = state._lane.clone().applyQuaternion(state.wrap.quaternion);
      tmp.q.setFromUnitVectors(lanePh.normalize(), axisPh);
      state.wrap.quaternion.premultiply(tmp.q);
    }
    state.wrap.updateMatrix();
    const hPh = tmp.a.copy(state._hole).applyMatrix4(state.wrap.matrix);
    const d = tmp.b.sub(hPh);
    if (d.lengthSq() > 0.25) return; /* > 0.5 m: not our item, leave it */
    state.wrap.position.add(d);
    U.gripD = +d.length().toFixed(3);
  }


  /* Shared, translation-only, clamped slide of the glove so a cached
     fist-hole (wrap-local) sits on a target already in p.h space. */
  function seekWrapTo(state, targetPh, maxD, tag) {
    const T = T3(); if (!T || !state || !state.wrap) return;
    const tmp = U._gripTmp || (U._gripTmp = { m: new T.Matrix4(), a: new T.Vector3(), b: new T.Vector3(), c: new T.Vector3(), q: new T.Quaternion(), pi: new T.Matrix4() });
    const skipIndex = (tag === 'pistol-seek');
    if (state._holeKind !== tag || !state._hole) {
      state.wrap.updateMatrixWorld(true);
      const wi = new T.Matrix4().copy(state.wrap.matrixWorld).invert();
      const K = new T.Vector3(), D = new T.Vector3(), v = new T.Vector3();
      const f0 = skipIndex ? 1 : 0;
      let n = 0;
      for (let i = f0; i < 4; i++) {
        if (state.prox[i]) { K.add(state.prox[i].getWorldPosition(v)); n++; }
        if (state.dist[i]) { D.add(state.dist[i].getWorldPosition(v)); }
      }
      if (!n) return;
      state._hole = K.multiplyScalar(1 / n).add(D.multiplyScalar(1 / n)).multiplyScalar(0.5).applyMatrix4(wi);
      state._holeKind = tag;
    }
    state.wrap.updateMatrix();
    state.wrap.updateMatrixWorld(true);
    const hPh = tmp.a.copy(state._hole).applyMatrix4(state.wrap.matrix);
    const d = tmp.b.copy(targetPh).sub(hPh);
    if (d.length() > maxD) d.setLength(maxD);
    if (d.lengthSq() < 1e-8) return;
    /* Wrist-local IK: translate p.h (the __fpa wrist) in its parent (forearm)
       space so the linen cuff rides with the glove. Shoulder / upper-arm
       bones are not touched. Restore from a per-frame base so the __fpa
       animation is not accumulated. */
    const wrist = state.wrap.parent;
    if (wrist && wrist.parent) {
      /* d is in wrist (p.h) space. Convert to a world-metre delta and
         reuse addWristWorld so parent scale cannot inflate the travel
         (a 5-10 cm seek must not become a 1 m jump). */
      const want = Math.min(d.length(), maxD);
      wrist.updateMatrixWorld(true);
      tmp.a.copy(d).transformDirection(wrist.matrixWorld);
      if (tmp.a.lengthSq() > 1e-12) tmp.a.setLength(want);
      addWristWorld(state, tmp.a, T);
      U.wristSnapD = +want.toFixed(3);
    } else {
      state.wrap.position.add(d);
    }
    return d.length();
  }

  /* Clamped, translation-only: slide the right glove so the fist hole
     sits on the pistol grip. The held item and the __fpa rig stay put.
     Max travel 0.045 m so the cuff cannot slide off the sleeve. */
  function seekPistolGrip(state) {
    const T = T3(); if (!T) return;
    let h = null;
    try { if (typeof held !== 'undefined') h = held; } catch (_) {}
    const ph = state.wrap.parent;
    if (!h || !ph || !h.children || !h.children.length || !h.visible) return;
    const gg = gunGrip(T, h);
    if (!gg || !gg.mesh || !gg.mesh.visible) return;
    const tmp = U._gripTmp || (U._gripTmp = { m: new T.Matrix4(), a: new T.Vector3(), b: new T.Vector3(), c: new T.Vector3(), q: new T.Quaternion(), pi: new T.Matrix4() });
    tmp.pi.copy(ph.matrixWorld).invert();
    tmp.m.multiplyMatrices(tmp.pi, gg.mesh.matrixWorld);
    const A = tmp.a.copy(gg.A).applyMatrix4(tmp.m), B = tmp.c.copy(gg.B).applyMatrix4(tmp.m);
    const Aw = gg.A.clone().applyMatrix4(gg.mesh.matrixWorld), Bw = gg.B.clone().applyMatrix4(gg.mesh.matrixWorld);
    const cam = (typeof camera !== 'undefined' && camera) || W.camera;
    let top = A, bot = B;
    if (cam) {
      const ci = U._camInv || (U._camInv = new T.Matrix4());
      ci.copy(cam.matrixWorld).invert();
      const ay = Aw.clone().applyMatrix4(ci).y, by = Bw.clone().applyMatrix4(ci).y;
      if (by > ay) { top = B; bot = A; }
    }
    tmp.b.copy(top).lerp(bot, U.gunGripF);
    const d = seekWrapTo(state, tmp.b, 0.06, 'pistol-seek');
    if (d != null) U.pistolSeekD = +d.toFixed(3);
  }

  /* Clamped, translation-only: move the left glove onto the musket
     forestock (about 40% of the way from the stock to the muzzle).
     The long-axis target is cached per held-item children. */
  function musketForestockLocal(T, h) {
    const key = 'musket:' + h.children.map(function (c) { return c.uuid; }).join(',');
    if (U._musketKey === key) return U._musket;
    U._musketKey = key; U._musket = null;
    const pts = [];
    const hi = new T.Matrix4().copy(h.matrixWorld).invert();
    h.updateMatrixWorld(true);
    h.traverse(function (o) {
      if (!o.isMesh || !o.visible || !o.geometry || !o.geometry.attributes.position) return;
      const m = new T.Matrix4().multiplyMatrices(hi, o.matrixWorld);
      const p = o.geometry.attributes.position;
      const step = Math.max(1, (p.count / 240) | 0);
      for (let i = 0; i < p.count; i += step) pts.push(fromPos(p, i, new T.Vector3()).applyMatrix4(m));
    });
    if (pts.length < 6) return null;
    const c = new T.Vector3();
    for (let i = 0; i < pts.length; i++) c.add(pts[i]);
    c.multiplyScalar(1 / pts.length);
    let ax = new T.Vector3(0, 0, 1);
    const d = new T.Vector3();
    for (let it = 0; it < 12; it++) {
      const n = new T.Vector3();
      for (let i = 0; i < pts.length; i++) { d.copy(pts[i]).sub(c); n.addScaledVector(d, d.dot(ax)); }
      if (n.lengthSq() < 1e-12) break;
      ax = n.normalize();
    }
    let lo = Infinity, hi2 = -Infinity;
    for (let i = 0; i < pts.length; i++) { const t = d.copy(pts[i]).sub(c).dot(ax); if (t < lo) lo = t; if (t > hi2) hi2 = t; }
    U._musket = { eA: c.clone().addScaledVector(ax, lo), eB: c.clone().addScaledVector(ax, hi2) };
    return U._musket;
  }
  function seekForestock(state) {
    const T = T3(); if (!T) return;
    let h = null;
    try { if (typeof held !== 'undefined') h = held; } catch (_) {}
    const ph = state.wrap.parent;
    if (!h || !ph || !h.visible) return;
    h.updateMatrixWorld(true);
    ph.updateMatrixWorld(true);
    const ends = musketForestockLocal(T, h);
    if (!ends) return;
    let stock = ends.eA, muzzle = ends.eB;
    const stR = U.sides && U.sides.R;
    if (stR && (stR.hand || stR.wrap)) {
      const rw = new T.Vector3();
      (stR.hand || stR.wrap).getWorldPosition(rw);
      const aW = ends.eA.clone().applyMatrix4(h.matrixWorld);
      const bW = ends.eB.clone().applyMatrix4(h.matrixWorld);
      if (bW.distanceToSquared(rw) < aW.distanceToSquared(rw)) { stock = ends.eB; muzzle = ends.eA; }
    }
    const targetW = stock.clone().lerp(muzzle, 0.40).applyMatrix4(h.matrixWorld);
    const targetPh = ph.worldToLocal(targetW);
    const d = seekWrapTo(state, targetPh, 0.08, 'musket-seek');
    if (d != null) U.musketSeekD = +d.toFixed(3);
  }

  /* Clamped seek of the right fist onto the pick shaft or sword hilt.
     Pick grips mid-shaft (0.40); sword grips near the guard (0.22). */
  function seekHandle(state) {
    const T = T3(); if (!T) return;
    let h = null;
    try { if (typeof held !== 'undefined') h = held; } catch (_) {}
    const ph = state.wrap.parent;
    if (!h || !ph || !h.children || !h.children.length || !h.visible) return;
    const g = heldGripLocal(T, h, U.kind);
    if (!g) return;
    const tmp = U._gripTmp || (U._gripTmp = { m: new T.Matrix4(), a: new T.Vector3(), b: new T.Vector3(), c: new T.Vector3(), q: new T.Quaternion(), pi: new T.Matrix4() });
    tmp.pi.copy(ph.matrixWorld).invert();
    tmp.m.multiplyMatrices(tmp.pi, h.matrixWorld);
    /* heldGripLocal is 15% up the shaft; pick wants mid-shaft, so slide
       further along the same cached point by re-deriving from g when
       kind is pick. Cheapest: just use g and a slightly larger clamp. */
    const targetPh = tmp.b.copy(g).applyMatrix4(tmp.m);
    if (U.kind === 'pick' || U.kind === 'p761' || U.kind === 'p760') {
      /* Grip the shaft nearest the current fist hole, not mid-length of a
         ~1 m pick (that target sat 20 cm past the hand). Fall back to the
         15% heldGripLocal point if the hole is missing. */
      state.wrap.updateMatrixWorld(true);
      const holeW = new T.Vector3();
      if (state.prox[1] && state.dist[1]) {
        const a = state.prox[1].getWorldPosition(new T.Vector3());
        const b = state.dist[1].getWorldPosition(new T.Vector3());
        holeW.copy(a).add(b).multiplyScalar(0.5);
      } else {
        state.wrap.getWorldPosition(holeW);
      }
      const holePh = holeW.clone();
      ph.worldToLocal(holePh);
      /* Slide target along the shaft (held origin <-> g) to the closest point to the hole. */
      const originPh = tmp.a.set(0, 0, 0).applyMatrix4(tmp.m);
      const axis = originPh.clone().sub(tmp.b.copy(g).applyMatrix4(tmp.m));
      if (axis.lengthSq() > 1e-8) {
        const base = tmp.b.copy(g).applyMatrix4(tmp.m);
        const t = holePh.clone().sub(base).dot(axis) / axis.lengthSq();
        const tt = Math.max(-0.15, Math.min(0.55, t));
        targetPh.copy(base).addScaledVector(axis, tt);
      }
    }
    /* Wrist snap keeps the cuff on the glove, so a slightly larger clamp is safe. */
    const maxD = (U.kind === 'pick' || U.kind === 'p761' || U.kind === 'p760') ? 0.10 : 0.05;
    const d = seekWrapTo(state, targetPh, maxD, 'handle-seek-' + U.kind);
    if (d != null) U.handleSeekD = +d.toFixed(3);
  }

  /* Keep the glove from sliding into the near plane (v1 musket left
     hand ended 4 cm from the camera and filled the lens with sleeve).
     Pistol viewmodels sit closer by design; others stay >= 20 cm. */
  function clampCamZ(state) {
    const T = T3(); if (!T || !state || !state.wrap || !state.wrap.parent) return;
    const cam = (typeof camera !== 'undefined' && camera) || W.camera;
    if (!cam) return;
    let minDist = 0.12;
    if (U.kind === 'pistol') minDist = 0.10;
    if (U.kind === 'musket' && state.side === 'L') minDist = 0.14;
    if (U.kind === 'musket' && state.side === 'R') minDist = 0.10;
    cam.updateMatrixWorld(true);
    const ci = U._camInv || (U._camInv = new T.Matrix4());
    ci.copy(cam.matrixWorld).invert();
    const tmp = U._gripTmp || (U._gripTmp = { m: new T.Matrix4(), a: new T.Vector3(), b: new T.Vector3(), c: new T.Vector3(), q: new T.Quaternion(), pi: new T.Matrix4() });
    state.wrap.updateMatrixWorld(true);
    const w = tmp.a;
    state.wrap.getWorldPosition(w).applyMatrix4(ci);
    /* Camera looks down -Z: more-negative z is further in front. Push the
       wrist (not wrap.position) so the linen cuff rides with the glove. */
    const dz0 = w.z - (-minDist);
    if (dz0 <= 0) return;
    const dz = Math.min(0.03, dz0);
    tmp.b.set(0, 0, -1).transformDirection(cam.matrixWorld).setLength(dz);
    addWristWorld(state, tmp.b, T);
    U.camZClamp = +dz.toFixed(3);
  }

  /* Translate p.h in its parent by a world-space delta, folding the
     local step into _snapOff so applyTune can restore it next frame. */
  function addWristWorld(state, dWorld, T) {
    const wrist = state.wrap && state.wrap.parent;
    if (!wrist || !wrist.parent) return;
    const tmp = U._gripTmp || (U._gripTmp = { m: new T.Matrix4(), a: new T.Vector3(), b: new T.Vector3(), c: new T.Vector3(), q: new T.Quaternion(), pi: new T.Matrix4() });
    const shift = function (obj, store) {
      if (!obj || !obj.parent) return;
      if (obj.userData && obj.userData.__fpHideLock) return;
      obj.updateMatrixWorld(true);
      obj.parent.updateMatrixWorld(true);
      tmp.c.copy(obj.position);
      obj.getWorldPosition(tmp.a).add(dWorld);
      obj.parent.worldToLocal(tmp.a);
      const step = tmp.a.sub(tmp.c);
      if (step.lengthSq() < 1e-12) return;
      if (step.length() > 0.20) step.setLength(0.20);
      obj.position.add(step);
      if (store) {
        if (!state[store]) state[store] = step.clone();
        else state[store].add(step);
      }
    };
    shift(wrist, '_snapOff');
    /* The linen cuff is a sibling of p.h, not a child, so it must be
       translated by the same world delta or the seam opens. */
    try {
      const R = rig();
      const arm = R && R.userData && R.userData[state.side];
      const p = arm && arm.userData && arm.userData.p;
      if (p && p.cuff && p.cuff !== wrist) shift(p.cuff, '_cuffSnapOff');
    } catch (_) {}
  }

  /* Hide the long beige __fpa forearm / upper-arm tube in first person
     for guns only. Geometry is locked hidden, never deleted. The cuff
     and the 1285 glove stay visible. */
  function hideGunSleeveTubes(state) {
    const guns = (U.kind === 'musket' || U.kind === 'pistol');
    const R = rig();
    const arm = R && R.userData && R.userData[state.side];
    const p = arm && arm.userData && arm.userData.p;
    if (!p) return;
    const hide = guns && state.side === 'L';
    const roots = [p.fo, p.up, p.el, hide ? p.cuff : null];
    const visit = function (o) {
      if (!o) return;
      /* Leave the glove wrap visible. The leftover beige cuff tube on
         the musket left arm is hidden with the other gun tubes. */
      if (state.wrap && (o === state.wrap || (o.parent === state.wrap))) return;
      if (!hide && p.cuff && o === p.cuff) return;
      if (p.h && o === p.h) return;
      if (hide) {
        if (o.userData && o.userData.__fpHideLock) return;
        if (o.visible) {
          o.userData = o.userData || {};
          o.userData.__hidGunTube1285 = 1;
        }
        o.visible = false;
      } else if (o.userData && o.userData.__hidGunTube1285) {
        o.visible = true;
        o.userData.__hidGunTube1285 = 0;
      }
    };
    roots.forEach(visit);
    /* Also tuck any leftover linen / forearm meshes on the left arm
       (1280 sleeves live under the wrist or forearm). */
    const root = arm;
    if (root && root.traverse) {
      root.traverse(function (o) {
        if (!o.isMesh) return;
        if (o.userData && o.userData.__fpHideLock) return;
        if (isLinenSleeve(o) || /forearm|upperarm|sleeve/i.test(o.name || '')) visit(o);
      });
    }
  }

  /* If the musket right hand sits at or behind the camera (the 1.2.88
     hip), push the right wrist, left wrist and `held` by the same world
     delta so the grip stays together. Capped, restored via _snapOff /
     _fpGrip-style tags, no shoulder-chain edit. */
  function pushMusketFront(state) {
    if (U.kind !== 'musket' || state.side !== 'R') { if (U.kind !== 'musket') U.musketFrontD = 0; return; }
    const T = T3(); if (!T) return;
    const cam = (typeof camera !== 'undefined' && camera) || W.camera;
    if (!cam) return;
    cam.updateMatrixWorld(true);
    const ci = U._camInv || (U._camInv = new T.Matrix4());
    ci.copy(cam.matrixWorld).invert();
    const tmp = U._gripTmp || (U._gripTmp = { m: new T.Matrix4(), a: new T.Vector3(), b: new T.Vector3(), c: new T.Vector3(), q: new T.Quaternion(), pi: new T.Matrix4() });
    state.wrap.updateMatrixWorld(true);
    const z = state.wrap.getWorldPosition(tmp.a).applyMatrix4(ci).z;
    const want = -0.12;
    if (z <= want) return;
    const dz = Math.min(0.20, z - want);
    tmp.b.set(0, 0, -1).transformDirection(cam.matrixWorld).setLength(dz);
    addWristWorld(state, tmp.b, T);
    const stL = U.sides && U.sides.L;
    if (stL) addWristWorld(stL, tmp.b, T);
    U._heldFront = tmp.b.clone();
    U.musketFrontD = +dz.toFixed(3);
  }

  /* Compose the static grip-point offset and any musket-front delta onto
     `held` in one write. 1251 / 1261 keep writing their mesh-local freeze
     (torch/pick jitter-fix); we never edit those tables. Restore-if-
     unchanged so a live write from them is not accumulated, then add a
     constant held-parent translation. */
  function heldOffOf(kind) {
    const tab = U.HELD_OFF;
    if (!tab) return null;
    return tab[kind] || tab[kind === 'p761' || kind === 'p760' ? 'pick' : ''] || null;
  }

  /* O(1): compose the solved HELD_OFF (parent-local) and VIEW_OFF
     (camera-space, applied to the __fpa rig and to `held` as the same
     world delta) onto the game's own bases. Restore-if-unchanged so a
     live 1251/1261 write is not accumulated. No vertex walk, no seek. */
  function applyHeldOffsets() {
    const T = T3(); if (!T) return;
    applyViewRig(T);
    let h = null;
    try { if (typeof held !== 'undefined') h = held; } catch (_) {}
    if (!h || !h.parent) return;
    /* Item mesh (held.children[0]) in held-local space. 1251/1261 write
       it from scratch each frame (or copy the torch freeze), and the
       __fpa arm aims at `held`, not at this child, so a constant here
       is not chased. Restore-if-unchanged keeps it from accumulating. */
    /* t1247: HELD_OFF on every top-level held child (guns may be a
       Group, not a single mesh). Restore-if-unchanged so a freeze
       rewrite is not accumulated; re-applied from each held mesh's
       onBeforeRender after any earlier hook. The arm aims at `held`. */
    const t = heldOffOf(U.kind);
    const ox = t ? (t[0] || 0) : 0, oy = t ? (t[1] || 0) : 0, oz = t ? (t[2] || 0) : 0;
    U._drawOff = (t && (ox || oy || oz)) ? { x: ox, y: oy, z: oz } : null;
    U.itemGripD = t ? +Math.hypot(ox, oy, oz).toFixed(3) : 0;
    /* Once per item switch (or table-row edit): drop the previous
       row so we recapture the 1251/1261 base, then bake the new
       constant. Later ticks only re-apply if a freeze rewrite
       clobbered the child. */
    const offKey = (U.kind || '') + ':' + ox + ',' + oy + ',' + oz;
    if (U._offKey !== offKey) {
      drawOffOff();
      U._offKind = U.kind;
      U._offKey = offKey;
      hookDrawOff();
      fpRun('heldHook');
    } else {
      /* Re-hook only if 1251 replaced a child (new uuid, no hook). */
      let h = null;
      try { if (typeof held !== 'undefined') h = held; } catch (_) {}
      const c0 = h && h.children && h.children[0];
      if (c0 && !c0.__fpOffHook1285) hookDrawOff();
    }
    drawOffOn();
    const v = (U.VIEW_OFF && U.VIEW_OFF[U.kind]) || [0, 0, 0];
    const vx = v[0] || 0, vy = v[1] || 0, vz = v[2] || 0;
    const hr = h.userData._fpView1285;
    const hsame = hr && h.position.distanceToSquared(hr.out) < 1e-12;
    if (hsame && hr.kind === U.kind && hr.vx === vx && hr.vy === vy && hr.vz === vz) return;
    if (hsame) h.position.copy(hr.base);
    h.userData._fpView1285 = null;
    U.musketFrontD = +Math.hypot(vx, vy, vz).toFixed(3);
    if (!(vx || vy || vz)) return;
    const cam = (typeof camera !== 'undefined' && camera) || W.camera;
    if (!cam) return;
    cam.updateMatrixWorld(true);
    h.parent.updateMatrixWorld(true);
    h.updateMatrixWorld(true);
    const dW = new T.Vector3(vx, vy, vz).transformDirection(cam.matrixWorld).setLength(Math.hypot(vx, vy, vz));
    const base = h.position.clone();
    const w = h.getWorldPosition(new T.Vector3()).add(dW);
    h.parent.worldToLocal(w);
    h.position.copy(w);
    h.userData._fpView1285 = { base: base, out: h.position.clone(), kind: U.kind, vx: vx, vy: vy, vz: vz };
  }

  function eachHeldChild(fn) {
    let h = null;
    try { if (typeof held !== 'undefined') h = held; } catch (_) {}
    if (!h || !h.children) return;
    for (let i = 0; i < h.children.length; i++) fn(h.children[i]);
  }
  function restoreChildOff(m) {
    const rec = m.userData && m.userData._fpHeldOff1285;
    if (!rec) return;
    if (m.position.distanceToSquared(rec.out) < 1e-12) m.position.copy(rec.base);
    m.userData._fpHeldOff1285 = null;
  }
  /* Idempotent. Restore-if-unchanged, then add the current table row.
     Safe to call twice in one draw and after a freeze rewrite. */
  function drawOffOn() {
    const d = U._drawOff;
    eachHeldChild(function (m) {
      if (!d) { restoreChildOff(m); return; }
      const rec = m.userData && m.userData._fpHeldOff1285;
      if (rec && rec.kind === U.kind && rec.x === d.x && rec.y === d.y && rec.z === d.z
          && m.position.distanceToSquared(rec.out) < 1e-12) return;
      if (rec && m.position.distanceToSquared(rec.out) < 1e-12) m.position.copy(rec.base);
      const base = m.position.clone();
      m.position.set(base.x + d.x, base.y + d.y, base.z + d.z);
      m.userData = m.userData || {};
      m.userData._fpHeldOff1285 = { base: base, out: m.position.clone(), kind: U.kind, x: d.x, y: d.y, z: d.z };
    });
    U._drawOffOn = d || null;
  }
  function drawOffOff() {
    eachHeldChild(restoreChildOff);
    U._drawOffOn = null;
  }
  U.drawOffOn = drawOffOn; U.drawOffOff = drawOffOff;
  function hookChildOff(m) {
    if (!m) return;
    if (m.isMesh && !m.__fpOffHook1285) {
      const prevB = m.onBeforeRender;
      m.onBeforeRender = function () {
        if (typeof prevB === 'function') prevB.apply(this, arguments);
        const cur = W.__handsFp1285;
        if (cur && cur.drawOffOn) cur.drawOffOn();
      };
      m.__fpOffHook1285 = 1;
    }
    const kids = m.children;
    if (kids) for (let i = 0; i < kids.length; i++) hookChildOff(kids[i]);
  }
  function hookDrawOff() {
    let h = null;
    try { if (typeof held !== 'undefined') h = held; } catch (_) {}
    if (h && h.children) for (let i = 0; i < h.children.length; i++) hookChildOff(h.children[i]);
    /* Guns: c350 places the viewmodel from the un-offset child, so the
       table shift must be on only while the frame is drawn, then cleared
       before the next viewmodel step. A last-draw sentinel on the rig
       (it rides into the gun view pass) does that without wrapping the
       WebGLRenderer draw entry. Tools keep a persistent offset. */
    if (U.kind === 'pistol' || U.kind === 'musket') ensureGunSentinel();
    else if (U._gunSent) U._gunSent.visible = false;
  }
  function ensureGunSentinel() {
    const T = T3(); if (!T) return;
    const R = rig(); if (!R) return;
    if (!U._gunSent) {
      const mat = new T.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false, fog: false });
      const geo = new T.PlaneGeometry(0.002, 0.002);
      const m = new T.Mesh(geo, mat);
      m.frustumCulled = false;
      m.renderOrder = 2e9;
      m.onAfterRender = function () {
        const cur = W.__handsFp1285;
        /* Leave the table on while QA is measuring, and for any
           caller that set _keepDrawOff (once-per-switch tools path). */
        if (cur && cur._keepDrawOff) return;
        if (cur && (cur.kind === 'pistol' || cur.kind === 'musket') && cur.drawOffOff) cur.drawOffOff();
      };
      U._gunSent = m;
    }
    if (U._gunSent.parent !== R) R.add(U._gunSent);
    U._gunSent.visible = true;
  }

  function applyViewRig(T) {
    const R = rig();
    const v = (U.VIEW_OFF && U.VIEW_OFF[U.kind]) || [0, 0, 0];
    const vx = v[0] || 0, vy = v[1] || 0, vz = v[2] || 0;
    if (!R) return;
    const rec = R.userData._fpViewOff1285;
    if (!(vx || vy || vz)) {
      if (rec && R.position.distanceToSquared(rec.out) < 1e-12) R.position.copy(rec.base);
      R.userData._fpViewOff1285 = null;
      return;
    }
    if (rec && rec.kind === U.kind && rec.vx === vx && rec.vy === vy && rec.vz === vz
        && R.position.distanceToSquared(rec.out) < 1e-12) return;
    if (rec && R.position.distanceToSquared(rec.out) < 1e-12) R.position.copy(rec.base);
    const base = R.position.clone();
    R.position.set(base.x + vx, base.y + vy, base.z + vz);
    R.userData._fpViewOff1285 = { base: base, out: R.position.clone(), kind: U.kind, vx: vx, vy: vy, vz: vz };
  }

  function applyViewOffConst() { /* folded into applyHeldOffsets */ }

  function itemGripOff(T, h) {
    const st = U.sides && U.sides.R;
    if (!st || !st.wrap) return null;
    const uid = (h.children[0] && h.children[0].uuid) || h.uuid;
    const key = U.kind + ':' + uid;
    if (U._itemGripKey === key) return U._itemGripOff;
    try {
      st.wrap.updateMatrixWorld(true);
      h.updateMatrixWorld(true);
      const holeW = new T.Vector3();
      if (st.prox[1] && st.dist[1]) {
        const a = st.prox[1].getWorldPosition(new T.Vector3());
        const b = st.dist[1].getWorldPosition(new T.Vector3());
        holeW.copy(a).add(b).multiplyScalar(0.5);
      } else {
        st.wrap.getWorldPosition(holeW);
      }
      const g = heldGripLocal(T, h, U.kind);
      if (!g) return null;
      const gripW = g.clone().applyMatrix4(h.matrixWorld);
      const dW = holeW.clone().sub(gripW);
      const dist = dW.length();
      /* Wait for a sane first sample. A stale 1-2 m pick/sword reading
         must not be cached as a 14 cm tug in the wrong place. */
      if (dist > 0.28) return null;
      if (dist < 0.012) {
        U._itemGripKey = key;
        U._itemGripOff = null;
        return null;
      }
      if (dist > 0.14) dW.setLength(0.14);
      h.parent.updateMatrixWorld(true);
      const end = h.getWorldPosition(new T.Vector3()).add(dW);
      h.parent.worldToLocal(end);
      const off = end.sub(h.position.clone());
      if (off.lengthSq() < 1e-10) return null;
      U._itemGripKey = key;
      U._itemGripOff = off.clone();
      return U._itemGripOff;
    } catch (e) { ERR('itemGripOff', e); return null; }
  }

  /* Pull the pistol off the near plane in camera space, moving the held
     item and both wrists by the same world delta so the grip stays together.
     The __fpa rig is not reparented (that would break parent-is-camera and
     leave the held item behind). */
  function restorePush(obj) {
    if (!obj || !obj.userData) return;
    if (obj.userData._fpPushOut && obj.userData._fpPushIn && obj.position.distanceToSquared(obj.userData._fpPushOut) < 1e-10) {
      obj.position.copy(obj.userData._fpPushIn);
    }
    obj.userData._fpPushOut = obj.userData._fpPushIn = obj.userData._fpPushTag = null;
  }
  function pushByWorld(obj, dWorld, tag, T) {
    if (!obj || !obj.parent) return;
    const tmp = viewTmp(T);
    /* Capture the unpushed rest once. Re-copying the already-pushed
       position into _fpPushIn accumulated a huge world delta and sent
       the wrists off-camera (hand at camera-space ~400). */
    if (obj.userData._fpPushTag !== tag || !obj.userData._fpPushIn) {
      obj.userData._fpPushIn = obj.position.clone();
      obj.userData._fpPushTag = tag;
    }
    obj.position.copy(obj.userData._fpPushIn);
    obj.parent.updateWorldMatrix(true, false);
    obj.getWorldPosition(tmp.w).add(dWorld);
    obj.parent.worldToLocal(tmp.w);
    obj.position.copy(tmp.w);
    if (!obj.userData._fpPushOut) obj.userData._fpPushOut = obj.position.clone();
    else obj.userData._fpPushOut.copy(obj.position);
  }
  function viewTmp(T) {
    return U._viewTmp || (U._viewTmp = {
      cur: new T.Vector3(), target: new T.Vector3(0.16, -0.22, -0.30),
      inv: new T.Matrix4(), q: new T.Quaternion(), w: new T.Vector3(),
      wrists: []
    });
  }
  function hookGunDraw(T) {
    if (!U.pistolPush) return;
    const objs = [];
    try { if (typeof held !== 'undefined' && held) objs.push(held); } catch (_) {}
    try {
      const vm = W.__vm;
      if (vm) {
        if (vm.vs) objs.push(vm.vs);
        if (vm.grp) objs.push(vm.grp);
        if (vm.root) objs.push(vm.root);
      }
    } catch (_) {}
    /* Hook the root only — applyViewOff already moves held + both wrists.
       Traversing every child and attaching onBeforeRender made it run once
       per gun mesh per frame, with a fresh Matrix4/Vector3 each time. */
    for (let i = 0; i < objs.length; i++) {
      const o = objs[i];
      if (!o || (o.userData && o.userData._fpViewHook)) continue;
      o.userData = o.userData || {};
      o.userData._fpViewHook = 1;
      const prev = o.onBeforeRender;
      o.onBeforeRender = function () {
        if (typeof prev === 'function') prev.apply(this, arguments);
        applyViewOff(T);
      };
    }
  }
  function applyViewOff(T) {
    try {
      if (!T) return;
      let frame = -1;
      try { if (typeof renderer !== 'undefined' && renderer && renderer.info && renderer.info.render) frame = renderer.info.render.frame; } catch (_) {}
      if (frame >= 0 && U._viewFrame === frame) return;
      U._viewFrame = frame;
      const cam = (typeof camera !== 'undefined' && camera) || W.camera;
      let heldObj = null;
      try { if (typeof held !== 'undefined') heldObj = held; } catch (_) {}
      const tmp = viewTmp(T);
      const wrists = tmp.wrists;
      wrists.length = 0;
      try {
        const R = rig();
        if (R && R.userData) {
          if (R.userData.R && R.userData.R.userData && R.userData.R.userData.p && R.userData.R.userData.p.h) wrists.push(R.userData.R.userData.p.h);
          if (R.userData.L && R.userData.L.userData && R.userData.L.userData.p && R.userData.L.userData.p.h) wrists.push(R.userData.L.userData.p.h);
        }
      } catch (_) {}
      if (U.kind !== 'pistol' || !U.pistolPush) {
        if (!U._pushed) return;
        U._pushed = 0;
        if (heldObj) restorePush(heldObj);
        for (let i = 0; i < wrists.length; i++) restorePush(wrists[i]);
        return;
      }
      if (!cam || !heldObj || !heldObj.parent) return;
      try { if (W.__vm && W.__vm.on) return; } catch (_) {}
      cam.updateMatrixWorld(true);
      /* Measure from the unpushed rest so the delta is stable. */
      if (heldObj.userData && heldObj.userData._fpPushIn) heldObj.position.copy(heldObj.userData._fpPushIn);
      for (let i = 0; i < wrists.length; i++) {
        const wri = wrists[i];
        if (wri && wri.userData && wri.userData._fpPushIn) wri.position.copy(wri.userData._fpPushIn);
      }
      heldObj.updateMatrixWorld(true);
      tmp.inv.copy(cam.matrixWorld).invert();
      heldObj.getWorldPosition(tmp.cur).applyMatrix4(tmp.inv);
      /* Natural hip height, bottom-right, clearly in front of the near plane. */
      tmp.target.set(0.14, -0.12, -0.32);
      tmp.w.copy(tmp.target).sub(tmp.cur);
      if (tmp.w.lengthSq() < 1e-8) return;
      cam.getWorldQuaternion(tmp.q);
      tmp.w.applyQuaternion(tmp.q);
      const tag = 'pistol';
      U._pushed = 1;
      pushByWorld(heldObj, tmp.w, tag, T);
      for (let i = 0; i < wrists.length; i++) pushByWorld(wrists[i], tmp.w, tag, T);
      U.viewOff = 1;
    } catch (e) { ERR('view', e); }
  }

  /* Bake the posed glove into a non-skinned mesh (one cache entry per
     held kind). The SkinnedMesh and its bone graph stay in memory but
     are hidden / skipped, so finger skinning is not paid every frame.
     The baked mesh is parented to the same align group, so it still
     follows the __fpa wrist and arm animations. */
  function bakeSkinnedMesh(mesh, T) {
    if (!mesh || !mesh.isSkinnedMesh || !mesh.skeleton || !mesh.geometry) return null;
    const src = mesh.geometry;
    const si = src.attributes.skinIndex, sw = src.attributes.skinWeight;
    const spos = src.attributes.position;
    if (!si || !sw || !spos) return null;
    const geo = src.clone();
    const pos = geo.attributes.position;
    const snrm = src.attributes.normal;
    const nrm = geo.attributes.normal;
    const bones = mesh.skeleton.bones, invs = mesh.skeleton.boneInverses;
    const bind = mesh.bindMatrix, bindI = mesh.bindMatrixInverse;
    const skinM = [];
    const nM = [];
    const tmpM = new T.Matrix4();
    for (let i = 0, n = bones.length; i < n; i++) {
      const M = new T.Matrix4();
      M.multiplyMatrices(bones[i] ? bones[i].matrixWorld : tmpM, invs[i] || tmpM);
      M.multiply(bind);
      skinM[i] = M;
      nM[i] = new T.Matrix3().getNormalMatrix(M);
    }
    const bindIN = new T.Matrix3().getNormalMatrix(bindI);
    const v = new T.Vector3(), acc = new T.Vector3(), tV = new T.Vector3();
    const n = new T.Vector3(), nacc = new T.Vector3();
    for (let i = 0, vn = spos.count; i < vn; i++) {
      const ix = si.getX(i), iy = si.getY(i), iz = si.getZ(i), iw = si.getW(i);
      const wx = sw.getX(i), wy = sw.getY(i), wz = sw.getZ(i), ww = sw.getW(i);
      v.fromBufferAttribute(spos, i);
      acc.set(0, 0, 0);
      if (wx > 0) acc.addScaledVector(tV.copy(v).applyMatrix4(skinM[ix] || tmpM), wx);
      if (wy > 0) acc.addScaledVector(tV.copy(v).applyMatrix4(skinM[iy] || tmpM), wy);
      if (wz > 0) acc.addScaledVector(tV.copy(v).applyMatrix4(skinM[iz] || tmpM), wz);
      if (ww > 0) acc.addScaledVector(tV.copy(v).applyMatrix4(skinM[iw] || tmpM), ww);
      acc.applyMatrix4(bindI);
      pos.setXYZ(i, acc.x, acc.y, acc.z);
      if (snrm && nrm) {
        n.fromBufferAttribute(snrm, i);
        nacc.set(0, 0, 0);
        if (wx > 0) nacc.addScaledVector(tV.copy(n).applyMatrix3(nM[ix]), wx);
        if (wy > 0) nacc.addScaledVector(tV.copy(n).applyMatrix3(nM[iy]), wy);
        if (wz > 0) nacc.addScaledVector(tV.copy(n).applyMatrix3(nM[iz]), wz);
        if (ww > 0) nacc.addScaledVector(tV.copy(n).applyMatrix3(nM[iw]), ww);
        nacc.applyMatrix3(bindIN);
        const len = nacc.length() || 1;
        nrm.setXYZ(i, nacc.x / len, nacc.y / len, nacc.z / len);
      }
    }
    pos.needsUpdate = true;
    if (nrm) nrm.needsUpdate = true;
    /* Drop triangles that the cuff discard would punch through, then
       raise the mask so the baked material never opens holes in the
       palm. The cut itself stays off-screen (see cuffCutValue). */
    try {
      const mask = geo.getAttribute('aFpHand1285');
      const cutY = (typeof cuffCutValue === 'function') ? cuffCutValue() : -0.12;
      const idxAttr = geo.getIndex();
      const vn = pos.count;
      let idx;
      if (idxAttr) idx = idxAttr.array;
      else {
        idx = new (vn > 65535 ? Uint32Array : Uint16Array)(vn);
        for (let t = 0; t < vn; t++) idx[t] = t;
      }
      const keep = [];
      const ya = mask ? mask.array : null;
      for (let t = 0; t + 2 < idx.length; t += 3) {
        const a = idx[t], b = idx[t + 1], c = idx[t + 2];
        if (ya && (ya[a] < cutY || ya[b] < cutY || ya[c] < cutY)) continue;
        keep.push(a, b, c);
      }
      if (keep.length >= 3) {
        geo.setIndex(keep.length > 65535 ? new T.Uint32BufferAttribute(keep, 1) : new T.Uint16BufferAttribute(keep, 1));
      }
      if (mask) {
        const arr = mask.array;
        for (let t = 0; t < arr.length; t++) arr[t] = 1;
        mask.needsUpdate = true;
      }
    } catch (e) { ERR('bakeCut', e); }
    let mat = mesh.material;
    if (Array.isArray(mat)) mat = mat.map(function (m) { return m.clone(); });
    else if (mat && mat.clone) mat = mat.clone();
    const mats = Array.isArray(mat) ? mat : [mat];
    for (let j = 0; j < mats.length; j++) {
      if (!mats[j]) continue;
      mats[j].skinning = false;
      mats[j].needsUpdate = true;
      const prevKey = mats[j].customProgramCacheKey;
      mats[j].customProgramCacheKey = function () {
        const k = typeof prevKey === 'function' ? prevKey.call(this) : '';
        return k + '|fpBake';
      };
    }
    const out = new T.Mesh(geo, mat);
    out.name = (mesh.name || 'fpHand') + 'Baked';
    out.userData.fpTpHand1285 = 1;
    out.userData.fpBaked1285 = 1;
    out.frustumCulled = false;
    out.castShadow = false;
    out.renderOrder = 2;
    out.position.copy(mesh.position);
    out.quaternion.copy(mesh.quaternion);
    out.scale.copy(mesh.scale);
    return out;
  }
  function hookAlignBake(align, T) {
    if (!align || align.updateMatrixWorld.__fpBake) return;
    const prev = align.updateMatrixWorld;
    align.updateMatrixWorld = function (force) {
      if (this.userData && this.userData.fpBakedPose) {
        if (this.matrixAutoUpdate) this.updateMatrix();
        if (this.parent === null) this.matrixWorld.copy(this.matrix);
        else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
        const ch = this.children;
        for (let i = 0; i < ch.length; i++) {
          const c = ch[i];
          if (!c || c.isBone) continue;
          if (c.isSkinnedMesh && c.visible === false) continue;
          c.updateMatrixWorld(force);
        }
        return;
      }
      return prev.call(this, force);
    };
    align.updateMatrixWorld.__fpBake = 1;
  }
  function bakeSidePose(state, T) {
    if (!state || !U.bakePose || !T) return;
    const kind = U.kind || 'empty';
    const poseName = (state.side === 'L' && (kind === 'pistol' || kind === 'musket')) ? 'support' : kind;
    const key = kind + ':' + poseName;
    if (state.bakedKey === key) return;
    if (state.align && state.align.userData) state.align.userData.fpBakedPose = 0;
    try { state.align.updateMatrixWorld(true); } catch (_) {}
    try { if (state.skeleton && state.skeleton.update) state.skeleton.update(); } catch (_) {}
    if (!state.bakedByKind) state.bakedByKind = {};
    let bag = state.bakedByKind[key];
    if (!bag) {
      bag = { meshes: [] };
      /* One source mesh per side — baking both LODs / GLOVE copies
         doubled the fist. Prefer the densest skin mesh. */
      let src = null, best = -1;
      for (let i = 0; i < state.meshes.length; i++) {
        const m = state.meshes[i];
        const n = (m && m.geometry && m.geometry.attributes && m.geometry.attributes.position && m.geometry.attributes.position.count) || 0;
        if (n > best) { best = n; src = m; }
      }
      if (src) {
        try {
          const baked = bakeSkinnedMesh(src, T);
          if (baked) { state.align.add(baked); bag.meshes.push(baked); }
        } catch (e) { ERR('bake', e); }
      }
      state.bakedByKind[key] = bag;
      U.baked = (U.baked || 0) + 1;
    }
    const hide = !!(state.wrap && state.wrap.visible === false);
    for (const k in state.bakedByKind) {
      const show = k === key && !hide;
      const ms = state.bakedByKind[k].meshes;
      for (let i = 0; i < ms.length; i++) ms[i].visible = show;
    }
    for (let i = 0; i < state.meshes.length; i++) state.meshes[i].visible = false;
    if (state.align && state.align.userData) state.align.userData.fpBakedPose = 1;
    state.bakedKey = key;
  }

  function poseState(state, name) {
    const pose = POSES[name] || POSES.empty;
    function curl(bone, amt, ay, az) {
      if (!bone || !bone.userData.bindQ) return;
      bone.quaternion.copy(bone.userData.bindQ);
      if (amt && bone.userData.flex) bone.rotateOnAxis(bone.userData.flex, amt);
      else if (amt) bone.rotateX(-amt);
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

  function v3cam(T, obj, camInv) {
    const w = new T.Vector3();
    obj.updateMatrixWorld(true);
    obj.getWorldPosition(w);
    w.applyMatrix4(camInv);
    return { x: +w.x.toFixed(3), y: +w.y.toFixed(3), z: +w.z.toFixed(3) };
  }
  function debugSeat() {
    const out = { kind: U.kind, cuff: U.cuffStats || null, sculpted: U.sculpted || 0, sculptVerts: U.sculptVerts || 0, cuffDressed: U.cuffDressed || 0, baked: U.baked || 0, bakePose: U.bakePose, pistolSeekD: U.pistolSeekD || 0, musketSeekD: U.musketSeekD || 0, handleSeekD: U.handleSeekD || 0, camZClamp: U.camZClamp || 0, version: U.version };
    try {
      const T = T3(); if (!T || !U.sides || !U.sides.R) return out;
      const st = U.sides.R;
      out.skelTrimR = U.skelTrimR || (st.skeleton && st.skeleton.bones.length);
      const h = st.wrap && st.wrap.parent;
      if (!h) return out;
      h.updateMatrixWorld(true);
      const inv = h.matrixWorld.clone().invert();
      const handW = new T.Vector3();
      (st.hand || st.wrap).getWorldPosition(handW);
      const handL = handW.clone().applyMatrix4(inv);
      out.hand = { x: +handL.x.toFixed(3), y: +handL.y.toFixed(3), z: +handL.z.toFixed(3) };
      out.bones = { prox: st.prox.map(function (b) { return b && b.name; }), thumb: st.thumb.map(function (b) { return b && b.name; }) };
      if (st.prox[1] && st.prox[1].userData.bindQ) {
        const q = st.prox[1].quaternion.clone().multiply(st.prox[1].userData.bindQ.clone().invert());
        const e = new T.Euler().setFromQuaternion(q, 'XYZ');
        out.curlMid = { x: +e.x.toFixed(3), y: +e.y.toFixed(3), z: +e.z.toFixed(3) };
        const f = st.prox[1].userData.flex;
        if (f) out.flexMid = { x: +f.x.toFixed(3), y: +f.y.toFixed(3), z: +f.z.toFixed(3) };
      }
      let heldObj = null;
      try { if (typeof held !== 'undefined') heldObj = held; } catch (_) {}
      if (heldObj) {
        heldObj.updateMatrixWorld(true);
        const hw = new T.Vector3();
        heldObj.getWorldPosition(hw);
        const heldL = hw.applyMatrix4(inv);
        out.held = { x: +heldL.x.toFixed(3), y: +heldL.y.toFixed(3), z: +heldL.z.toFixed(3) };
        out.delta = { x: +(out.held.x - out.hand.x).toFixed(3), y: +(out.held.y - out.hand.y).toFixed(3), z: +(out.held.z - out.hand.z).toFixed(3) };
      }
      try {
        if (typeof camera !== 'undefined' && camera) {
          camera.updateMatrixWorld(true);
          const camInv = camera.matrixWorld.clone().invert();
          out.camHand = v3cam(T, st.hand || st.wrap, camInv);
          if (U.sides.L && U.sides.L.hand) out.camHandL = v3cam(T, U.sides.L.hand, camInv);
          if (heldObj) out.camHeld = v3cam(T, heldObj, camInv);
        }
      } catch (_) {}
    } catch (e) { out.err = String(e); }
    return out;
  }
  U.debugSeat = debugSeat;

  function poseKind(kind) {
    if (!U.sides) return;
    const right = POSES[kind] ? kind : 'empty';
    if (U.sides.R) poseState(U.sides.R, right);
    if (U.sides.L) {
      const ONE_HAND = { pick: 1, p761: 1, p760: 1, sword: 1, torch: 1, bucket: 1, axe: 1, shovel: 1, hoe: 1, block: 1, map: 1, pistol: 1 };
      const left = (kind === 'musket') ? 'forestock' : (ONE_HAND[kind] ? 'empty' : right);
      poseState(U.sides.L, left);
    }
    U.kind = kind;
    syncCuffCut();
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
        if (U.cuffFolds) try { dressCuff(arm.userData.p.h && arm.userData.p, T, side); }
        catch (e) { ERR('cuff', e); }
        U.sides[side] = st;
        U.attached++;
      }
      poseKind(currentKind());
      applyViewOff(T);
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


  function profBegin(name) {
    if (!U._profOn) return 0;
    return performance.now();
  }
  function profEnd(name, t0) {
    if (!U._profOn || !t0) return;
    const dt = performance.now() - t0;
    const p = U._prof || (U._prof = {});
    const s = p[name] || (p[name] = {n: 0, ms: 0, max: 0});
    s.n++; s.ms += dt; if (dt > s.max) s.max = dt;
  }
  function fpRun(name) {
    const c = U._fpRun || (U._fpRun = {});
    c[name] = (c[name] || 0) + 1;
    U._fpTickN = (U._fpTickN || 0) + (name === 'tick' ? 1 : 0);
    try { if (typeof performance !== 'undefined' && performance.mark) performance.mark('fp-' + name); } catch (_) {}
  }
  U.fpRunReset = function () { U._fpRun = {}; U._fpTickN = 0; };
  U.fpRunSnap = function () {
    const n = U._fpTickN || 0;
    const c = U._fpRun || {};
    const out = { ticks: n };
    Object.keys(c).forEach(function (k) {
      out[k] = c[k];
      out[k + 'PerTick'] = n ? +(c[k] / n).toFixed(3) : 0;
    });
    return out;
  };
  U.profStart = function () { U._profOn = 1; U._prof = {}; };
  U.profSnap = function () {
    const out = {};
    const p = U._prof || {};
    Object.keys(p).forEach(function (k) {
      const s = p[k];
      out[k] = {n: s.n, totalMs: +s.ms.toFixed(2), meanMs: +(s.ms / Math.max(1, s.n)).toFixed(3), maxMs: +s.max.toFixed(3)};
    });
    return out;
  };


  /* t1252: one-time per-kind finger bake. align2's poseState is identical
     to now, but the old glove onBeforeRender path re-curled every frame
     after the wrist seat and world matrices were current. We do that
     second curl once, after applyTune, then (for non-gun kinds) a
     clamped one-shot fist-to-handle slide, then freeze the finger
     bones so a later arm update cannot undo the bake. Pistol is not
     slid; its locked seat stays as-is. */
  function fingerBones(state) {
    return [].concat((state && state.prox) || [], (state && state.dist) || [], (state && state.thumb) || []);
  }
  function setFingerAuto(state, on) {
    const bones = fingerBones(state);
    for (let i = 0; i < bones.length; i++) {
      const b = bones[i]; if (!b) continue;
      if (!on) { try { b.updateMatrix(); } catch (_) {} }
      b.matrixAutoUpdate = !!on;
    }
  }
  function refreshSkel(state) {
    if (!state) return;
    try { if (state.wrap) state.wrap.updateMatrixWorld(true); } catch (_) {}
    try { if (state.skeleton && state.skeleton.update) state.skeleton.update(); } catch (_) {}
  }
  function heldReady() {
    let h = null;
    try { if (typeof held !== 'undefined') h = held; } catch (_) {}
    return !!(h && h.children && h.children.length);
  }
  /* Shift linen/cuff meshes by the same p.h-local delta as a fist-close
     wrap slide, once. Bucket/torch/sword seats have cuffFollow off, so
     without this a 5 mm–12 cm slide would open the cuff past 5 mm. */
  function applyCuffDelta(state, dPh) {
    if (!state || !dPh || dPh.lengthSq() < 1e-12) return;
    const T = T3(); if (!T) return;
    const R = rig();
    const arm = R && R.userData && R.userData[state.side];
    if (!arm) return;
    const wrap = state.wrap;
    const wrist = wrap && wrap.parent;
    if (!wrist) return;
    const tmp = U._cuffTmp || (U._cuffTmp = {
      a: new T.Vector3(), b: new T.Vector3(), loc: new T.Vector3(0, -0.03, 0),
      d: new T.Vector3(), p0: new T.Vector3(), p1: new T.Vector3(),
      mat: new T.Matrix4(), inv: new T.Matrix4()
    });
    const visit = function (o) {
      if (!o || !o.isMesh || !o.parent) return;
      if (wrap && (o === wrap || o.parent === wrap)) return;
      const n = (o.name || '') + ' ' + ((o.userData && o.userData.name) || '');
      const linen = (typeof isLinenSleeve === 'function') && isLinenSleeve(o);
      if (!linen && !/cuff|sleeve|linen|forearm/i.test(n) && !(arm.userData && arm.userData.p && o === arm.userData.p.cuff)) return;
      if (o.parent === wrist) { o.position.add(dPh); return; }
      tmp.mat.identity();
      let node = o.parent, hops = 0, under = 0;
      while (node && hops++ < 8) {
        if (node === wrist) { under = 1; break; }
        tmp.mat.premultiply(node.matrix);
        node = node.parent;
      }
      if (under) {
        tmp.mat.invert();
      } else {
        try { wrist.updateMatrixWorld(true); o.parent.updateMatrixWorld(true); } catch (_) {}
        tmp.mat.copy(wrist.matrixWorld).premultiply(tmp.inv.copy(o.parent.matrixWorld).invert());
      }
      tmp.p0.set(0, 0, 0).applyMatrix4(tmp.mat);
      tmp.p1.copy(dPh).applyMatrix4(tmp.mat);
      o.position.add(tmp.p1.sub(tmp.p0));
    };
    if (arm.traverse) arm.traverse(visit);
    else visit(arm.userData && arm.userData.p && arm.userData.p.cuff);
  }
  /* Clamped p.h-local slide of the wrap so the mid-finger hole sits on
     the held grip. Cached per kind+mesh. Never used for pistol/musket. */
  function bakeFistClose(state) {

    if (!state || !state.wrap || !state.wrap.parent) return 0;
    const k = U.kind || '';
    if (k === 'pistol' || k === 'musket') return 1;
    const T = T3(); if (!T) return 0;
    let h = null;
    try { if (typeof held !== 'undefined') h = held; } catch (_) {}
    if (!h || !h.children || !h.children.length) return 0;
    const uid = (h.children[0] && h.children[0].uuid) || h.uuid;
    const key = k + ':' + uid;
    if (U._fistBakeKey === key) return 1;
    try {
      state.wrap.updateMatrixWorld(true);
      h.updateMatrixWorld(true);
      const holeW = new T.Vector3();
      if (state.prox[1] && state.dist[1]) {
        const a = state.prox[1].getWorldPosition(new T.Vector3());
        const b = state.dist[1].getWorldPosition(new T.Vector3());
        holeW.copy(a).add(b).multiplyScalar(0.5);
      } else {
        state.wrap.getWorldPosition(holeW);
      }
      const g = heldGripLocal(T, h, k);
      if (!g) return 0;
      const gripW = g.clone().applyMatrix4(h.matrixWorld);
      const dW = holeW.clone().sub(gripW);
      const dist = dW.length();
      /* Not ready: a 1–2 m first sample must not be baked. */
      if (dist > 0.22) return 0;
      U._fistBakeKey = key;
      if (dist < 0.006) return 1;
      const maxD = (k === 'torch') ? 0.12 : (k === 'bucket' ? 0.025 : 0.035);
      const ph = state.wrap.parent;
      ph.updateMatrixWorld(true);
      const inv = new T.Matrix4().copy(ph.matrixWorld).invert();
      /* Parent-local delta (ancestor scale cancels). */
      const holeL = holeW.clone().applyMatrix4(inv);
      const gripL = gripW.clone().applyMatrix4(inv);
      const dPh = holeL.sub(gripL);
      if (dPh.length() > maxD) dPh.setLength(maxD);
      state.wrap.position.add(dPh);
      try { applyCuffDelta(state, dPh); } catch (e) { ERR('fistCuff', e); }
      /* Seat cache still describes the pre-slide wrap; leave _tuneFk so
         a later applyTune cannot pull the wrap back to the bare seat. */
      fpRun('fistClose');
      U.handleSeekD = +dPh.length().toFixed(3);
      return 1;
    } catch (e) { ERR('fistClose', e); return 0; }
  }
  function bakeKindFingers(kind) {
    const _pk = profBegin('bakeKindFingers');
    fpRun('poseKind');
    const R = U.sides && U.sides.R, L = U.sides && U.sides.L;
    if (R) setFingerAuto(R, 1);
    if (L) setFingerAuto(L, 1);
    poseKind(kind);
    if (R) applyTune(R);
    if (L) applyTune(L);
    /* Second curl after the wrist seat and matrices are current — this
       is the step the old per-frame beforeDraw path kept applying. */
    if (R) refreshSkel(R);
    if (L) refreshSkel(L);
    poseKind(kind);
    if (R) refreshSkel(R);
    if (L) refreshSkel(L);
    let closed = 1;
    if (R && kind !== 'pistol' && kind !== 'musket') closed = bakeFistClose(R);
    if (R) refreshSkel(R);
    if (closed) {
      poseKind(kind);
      if (R) refreshSkel(R);
      if (L) refreshSkel(L);
      if (R) setFingerAuto(R, 0);
      if (L) setFingerAuto(L, 0);
      U._fistPending = 0;
    } else {
      U._fistPending = 1;
    }
    profEnd('bakeKindFingers', _pk);
  }

  function tick() {

    const _pt = profBegin('tick');
    try {
      if (!U.on) return;
      if (!U.src) loadGlb();
      if (U.src && !U.attached) attach();
      if (U.attached) {
        const k = currentKind();
        const switched = (U._tickKind !== k);
        fpRun('tick');
        if (switched) {
          const _ph = profBegin('hideBoth'); hideBoth(); profEnd('hideBoth', _ph);
          U._tickKind = k;
          if (U.sides && U.sides.R) { U.sides.R._tuneFk = null; U.sides.R._cuffFk = null; }
          if (U.sides && U.sides.L) { U.sides.L._tuneFk = null; U.sides.L._cuffFk = null; }
          U._offKey = null;
          U._fistBakeKey = null;
          U._fistPending = 1;
          U._fistTries = 0;
          bakeKindFingers(k);
          const _pg = profBegin('hookGunDraw'); hookGunDraw(T3()); profEnd('hookGunDraw', _pg);
        } else {
          if (U.sides) {
            if (U.sides.R) applyTune(U.sides.R);
            if (U.sides.L) applyTune(U.sides.L);
          }
          /* Held meshes can appear a tick after the switch. Finish only
             the fist-close then (not a full re-pose), and give up after
             a few tries so this cannot become a per-frame path. */
          if (U._fistPending && U.sides && U.sides.R) {
            U._fistTries = (U._fistTries || 0) + 1;
            const done = (U._fistTries > 20) ? 1 : bakeFistClose(U.sides.R);
            if (done) {
              poseKind(k);
              refreshSkel(U.sides.R);
              if (U.sides.L) refreshSkel(U.sides.L);
              setFingerAuto(U.sides.R, 0);
              if (U.sides.L) setFingerAuto(U.sides.L, 0);
              U._fistPending = 0;
            }
          }
        }
        const _pv = profBegin('applyViewOff'); applyViewOff(T3()); profEnd('applyViewOff', _pv);
      }
    } catch (e) { ERR('tick', e); }
    finally { profEnd('tick', _pt); }
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
