/* GLX-HANDSFP1285 (v1.2.85): first-person uses the actual third-person
   GLOVE hand mesh (HeadSkin, 1.2.83 crease/knuckle/nail shading) attached
   to the existing __fpa wrist, coming out of the cream linen cuff.
   Old box/tube __fpa hand and finger pieces are hidden, not deleted.
   Finger bones curl around each held item. On the FP clone only, the
   1.2.65/1.2.71 prism-and-cube sculpt (knuckles, tendons, pads, nails,
   veins, wrist bones, palm creases, linen cuff folds and weave) is
   baked into the skinned geometry in each bone's bind-pose frame so
   the pieces move with the fingers and cannot float, plus stronger
   crease/AO/nail shading. Arm animations, item positions and torch/pick
   jitter are unchanged. Third-person is not patched. */
(function handsFp1285() {
  const W = window;
  const U = W.__handsFp1285 = {
    err: null, on: 1, version: '1.2.85-tp-hand',
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
      sword:  { x: 0, y: 0.02, z: 0.00 },
      pick:   { x: 0, y: 0.03, z: 0.00 },
      p761:   { x: 0, y: 0.03, z: 0.00 },
      p760:   { x: 0, y: 0.03, z: 0.00 },
      pistol: { x: 0.02, y: -0.08, z: -0.02 },
      musket: { x: 0, y: 0.02, z: 0.01 }
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
  const fist = (a, tY) => ({
    p: [1.22, 1.30, 1.30, 1.16].map(v => S * v),
    d: [1.08, 1.16, 1.16, 1.02].map(v => S * v),
    t: [0.92 * S, 0.78 * S], tY: tY == null ? 0.55 : tY, tZ: 0.28
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
    bucket: fist(1, 0.46),
    torch: fist(1, 0.42),
    sword: fist(1, 0.42),
    pick: fist(1, 0.46),
    p761: fist(1, 0.46),
    p760: fist(1, 0.46),
    axe: fist(1, 0.42),
    shovel: fist(1, 0.42),
    hoe: fist(1, 0.42),
    /* Index almost straight for the trigger; remaining fingers and thumb wrap the grip. */
    pistol: {
      p: [0.18, 1.26, 1.30, 1.18].map(v => S * v),
      d: [0.12, 1.10, 1.14, 1.02].map(v => S * v),
      t: [0.70 * S, 0.48 * S], tY: 0.36, tZ: 0.16
    },
    musket: {
      p: [0.38, 1.16, 1.20, 1.10].map(v => S * v),
      d: [0.24, 1.00, 1.04, 0.94].map(v => S * v),
      t: [0.62 * S, 0.40 * S], tY: 0.26, tZ: 0.12
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
        /* +Y along fingers, -Y down the forearm. Keep the wrist, clip the
           long TP forearm so the cream linen cuff can show under it. */
        mask[i] = v.y < -0.022 ? 0 : 1;
        if (!mask[i]) cut++;
      }
    } else {
      for (let i = 0; i < n; i++) mask[i] = 1;
    }
    g.setAttribute('aFpHand1285', new T.BufferAttribute(mask, 1));
    /* Collapse discarded forearm verts to a short wrist stump on the clone
       only, so the cream linen cuff shows even if the discard shader misses. */
    if (hi >= 0 && invs && invs[hi] && cut > 0) {
      const toHand = new T.Matrix4().multiplyMatrices(invs[hi], bm);
      const toBind = toHand.clone().invert();
      const cutY = -0.022;
      for (let i = 0; i < n; i++) {
        if (mask[i] > 0.5) continue;
        v.fromBufferAttribute(pos, i).applyMatrix4(toHand);
        /* Collapse to a wrist-ring, not a needle, so the cuff can sit around it. */
        const rad = Math.hypot(v.x, v.z) || 1e-6;
        const r = Math.min(0.028, rad * 0.55);
        v.x = v.x / rad * r;
        v.z = v.z / rad * r;
        v.y = cutY;
        v.applyMatrix4(toBind);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      pos.needsUpdate = true;
      if (g.computeVertexNormals) g.computeVertexNormals();
    }
    U.cuffStats = { side: side, minY: +minY.toFixed(3), maxY: +maxY.toFixed(3), cut: cut, n: n, hi: hi };
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
        const declF = 'varying float vFpHand1285;';
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
        sh.fragmentShader = sh.fragmentShader.replace(/void main\s*\(\s*\)\s*\{/, 'void main() {\nif (vFpHand1285 < 0.28) discard;');
        U.shaderHook = 1;
      }
      if (!skin) return;
      if (sh.vertexShader.indexOf('aCrease1282') >= 0) return;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aCrease1282;\nattribute float aNail1282;\nattribute float aKnk1282;\nvarying float vCrease1282;\nvarying float vNail1282;\nvarying float vKnk1282;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCrease1282 = aCrease1282; vNail1282 = aNail1282; vKnk1282 = aKnk1282;');
      let frag = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vCrease1282;\nvarying float vNail1282;\nvarying float vKnk1282;');
      frag = frag.replace('#include <lights_physical_fragment>', `
        {
          float cr = smoothstep(0.22, 0.85, vCrease1282);
          /* Fold AO, warm blood in the crease, knuckle sheen, pale glossy nails. */
          diffuseColor.rgb *= mix(vec3(1.0), vec3(0.62, 0.48, 0.44), cr);
          float kn = clamp(vKnk1282 * 1.8, 0.0, 1.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.22 + vec3(0.05, 0.03, 0.025), kn);
          float nl = smoothstep(0.12, 0.55, vNail1282);
          vec3 nailC = diffuseColor.rgb * vec3(1.28, 1.10, 1.04) + vec3(0.12, 0.07, 0.06);
          nailC = mix(nailC, nailC + vec3(0.12, 0.10, 0.08), smoothstep(0.7, 1.0, vNail1282));
          diffuseColor.rgb = mix(diffuseColor.rgb, min(nailC, vec3(1.0)), nl * 0.85);
          roughnessFactor = mix(roughnessFactor, 0.18, smoothstep(0.15, 0.75, vNail1282));
          roughnessFactor = mix(roughnessFactor, min(1.0, roughnessFactor + 0.22), smoothstep(0.08, 0.85, vCrease1282));
        }
        #include <lights_physical_fragment>`);
      sh.fragmentShader = frag;
    };
    try { if (prev) for (const k of Object.keys(prev)) m.onBeforeCompile[k] = prev[k]; } catch (_) {}
    m.onBeforeCompile.__handsFp1285 = 1;
    m.onBeforeCompile.__hands1282 = 1;
    m.customProgramCacheKey = function () {
      const k = typeof prevKey === 'function' ? prevKey.call(this) : '';
      return k + '|handsFp1285skin' + (skin ? 'S' : 'C');
    };
    m.needsUpdate = true;
  }

  function isSkinMat(m) { return m && /Skin/i.test(m.name || ''); }

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
      try { bakeCuffMask(mesh, T, side, srcSkel, srcMeshes[i]); }
      catch (e) { U.cuffStats = { err: String(e && e.message || e) }; }
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (mats.some(isSkinMat)) {
        try { bakeSculpt(mesh, state, T); }
        catch (e) { ERR('sculpt', e); }
      }
      for (let j = 0; j < mats.length; j++) patchMat(mats[j], isSkinMat(mats[j]));
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
      poseKind(currentKind());
      if (U.sides) {
        if (U.sides.R) applyTune(U.sides.R);
        if (U.sides.L) applyTune(U.sides.L);
      } else applyTune(state);
      hookGunDraw(T);
      applyViewOff(T);
    }
    for (let i = 0; i < outMeshes.length; i++) outMeshes[i].onBeforeRender = beforeDraw;
    return state;
  }

  function applyTune(state) {
    const t = U.tune;
    const seat = (U.seat && U.seat[U.kind]) || (U.seat && U.seat.empty) || {};
    state.wrap.position.set((t.x || 0) + (seat.x || 0), (t.y || 0) + (seat.y || 0), (t.z || 0) + (seat.z || 0));
    state.wrap.rotation.set((t.rx || 0) + (seat.rx || 0), (t.ry || 0) + (seat.ry || 0), (t.rz || 0) + (seat.rz || 0));
    const s = (seat.scale != null ? seat.scale : (t.scale == null ? 1 : t.scale));
    const sx = (seat.sx != null ? seat.sx : (t.sx == null ? 1 : t.sx));
    state.wrap.scale.set(s * sx, s, s);
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
    const cur = obj.position;
    if (obj.userData._fpPushTag === tag && obj.userData._fpPushOut && cur.distanceToSquared(obj.userData._fpPushOut) < 1e-10) return;
    obj.userData._fpPushIn = cur.clone();
    obj.parent.updateWorldMatrix(true, false);
    const w = obj.getWorldPosition(new T.Vector3()).add(dWorld);
    obj.position.copy(obj.parent.worldToLocal(w.clone()));
    obj.userData._fpPushOut = obj.position.clone();
    obj.userData._fpPushTag = tag;
  }
  function hookGunDraw(T) {
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
    for (let i = 0; i < objs.length; i++) {
      const o = objs[i];
      if (!o || o.userData._fpViewHook) continue;
      o.userData._fpViewHook = 1;
      const prev = o.onBeforeRender;
      o.onBeforeRender = function () {
        if (typeof prev === 'function') prev.apply(this, arguments);
        applyViewOff(T);
      };
      if (o.traverse) o.traverse(function (c) {
        if (c === o || !c.isMesh || c.userData._fpViewHook) return;
        c.userData._fpViewHook = 1;
        const p2 = c.onBeforeRender;
        c.onBeforeRender = function () {
          if (typeof p2 === 'function') p2.apply(this, arguments);
          applyViewOff(T);
        };
      });
    }
  }
  function applyViewOff(T) {
    try {
      if (!T) return;
      const cam = (typeof camera !== 'undefined' && camera) || W.camera;
      let heldObj = null;
      try { if (typeof held !== 'undefined') heldObj = held; } catch (_) {}
      const wrists = [];
      try {
        const R = rig();
        if (R && R.userData) {
          if (R.userData.R && R.userData.R.userData && R.userData.R.userData.p && R.userData.R.userData.p.h) wrists.push(R.userData.R.userData.p.h);
          if (R.userData.L && R.userData.L.userData && R.userData.L.userData.p && R.userData.L.userData.p.h) wrists.push(R.userData.L.userData.p.h);
        }
      } catch (_) {}
      if (U.kind !== 'pistol') {
        if (heldObj) restorePush(heldObj);
        for (let i = 0; i < wrists.length; i++) restorePush(wrists[i]);
        return;
      }
      if (!cam || !heldObj || !heldObj.parent) return;
      cam.updateMatrixWorld(true);
      heldObj.updateMatrixWorld(true);
      const cur = heldObj.getWorldPosition(new T.Vector3()).applyMatrix4(cam.matrixWorld.clone().invert());
      /* Low, large, bottom-right, and clearly in front of the near plane. */
      const target = new T.Vector3(0.16, -0.22, -0.30);
      const dCam = target.sub(cur);
      if (dCam.lengthSq() < 1e-8) return;
      const dWorld = dCam.applyQuaternion(cam.getWorldQuaternion(new T.Quaternion()));
      const tag = 'pistol';
      pushByWorld(heldObj, dWorld, tag, T);
      for (let i = 0; i < wrists.length; i++) pushByWorld(wrists[i], dWorld, tag, T);
      U.viewOff = 1;
    } catch (e) { ERR('view', e); }
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
    const out = { kind: U.kind, cuff: U.cuffStats || null, sculpted: U.sculpted || 0, sculptVerts: U.sculptVerts || 0, cuffDressed: U.cuffDressed || 0 };
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
        try { dressCuff(arm.userData.p.h && arm.userData.p, T, side); }
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
        hookGunDraw(T3());
        applyViewOff(T3());
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
