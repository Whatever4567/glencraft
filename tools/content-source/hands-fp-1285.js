/* GLX-HANDSFP1285 (v1.2.85): first-person uses the actual third-person
   GLOVE hand mesh (HeadSkin, 1.2.83 crease/knuckle/nail shading) attached
   to the existing __fpa wrist, coming out of the cream linen cuff.
   Old box/tube __fpa hand and finger pieces are hidden, not deleted.
   Finger bones curl around each held item. On the FP clone only, the
   1.2.65/1.2.71 prism-and-cube sculpt (knuckles, tendons, pads, nails,
   veins, wrist bones, linen cuff folds and weave) is layered for UHD
   detail, plus stronger crease/AO/nail shading. Arm animations, item
   positions and torch/pick jitter are unchanged. Third-person is not
   patched. */
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

  /* Extra rotateX (and thumb Y/Z) on top of the bind pose, in radians.
     Negative X continues the rest-pose curl toward the palm. */
  const S = -1;
  /* Tight closed fist with a wrapped thumb; curls stay short of a skin collapse. */
  const fist = (a, tY) => ({
    p: [1.08, 1.14, 1.14, 1.02].map(v => S * v),
    d: [0.88, 0.94, 0.94, 0.82].map(v => S * v),
    t: [0.78 * S, 0.55 * S], tY: tY == null ? 0.48 : tY, tZ: 0.20
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

  /* Many small prism/cube pieces parented to the posed finger bones. */
  function addSculpt(state, T) {
    if (!state || state._sculpted) return;
    const mats = {
      skin: sculptMat(T, 'skin'),
      knk: sculptMat(T, 'knuckle'),
      pad: sculptMat(T, 'pad'),
      nail: sculptMat(T, 'nail'),
      linen: sculptMat(T, 'linen')
    };
    function flush(parent, bag, mat) {
      if (!bag.pos.length) return;
      parent.add(mkMesh(T, bagToGeo(T, bag), mat));
    }
    /* Nails only on the distal tips — knuckle/pad boxes in bone space were
       floating in the finger gaps because the dorsal axis is not +Z on this rig. */
    for (let i = 0; i < 4; i++) {
      const d = state.dist[i]; if (!d) continue;
      const L = boneLen(d);
      const nb = { pos: [], nrm: [], uv: [], col: [] };
      pushBox(nb, 0, Math.max(0.016, L * 0.86), 0.0036, 0.0058, 0.0048, 0.0015, skinCol('nail'), -0.08, 0, 0);
      pushBox(nb, 0, Math.max(0.018, L * 0.92), 0.0038, 0.0052, 0.0022, 0.0011, skinCol('nailTip'), -0.03, 0, 0);
      flush(d, nb, mats.nail);
    }
    if (state.thumb[1]) {
      const L = boneLen(state.thumb[1]);
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      pushBox(bag, 0, Math.max(0.014, L * 0.84), 0.0034, 0.0060, 0.0046, 0.0015, skinCol('nail'), -0.10, 0, 0);
      pushBox(bag, 0, Math.max(0.016, L * 0.90), 0.0036, 0.0054, 0.0020, 0.0011, skinCol('nailTip'), -0.04, 0, 0);
      flush(state.thumb[1], bag, mats.nail);
    }
    /* Dorsal tendons, veins, wrist bones on the hand bone. */
    if (state.hand) {
      const bag = { pos: [], nrm: [], uv: [], col: [] };
      const xs = [-0.012, -0.004, 0.004, 0.012];
      for (let i = 0; i < xs.length; i++) {
        pushBox(bag, xs[i], 0.018, 0.0145, 0.0020, 0.052, 0.0018, skinCol('tend'), 0.08, 0, 0);
        pushBox(bag, xs[i] * 0.9, 0.040, 0.0152, 0.0024, 0.010, 0.0020, skinCol('tend'), 0.04, 0, 0);
      }
      /* blue-ish veins, slightly under the tendon line */
      pushBox(bag, -0.008, 0.010, 0.0136, 0.0012, 0.036, 0.0011, skinCol('vein'), 0.12, 0.05, 0);
      pushBox(bag, 0.007, 0.006, 0.0134, 0.0011, 0.028, 0.0010, skinCol('vein'), 0.08, -0.04, 0);
      /* wrist bone lumps (ulna / radius heads) */
      pushBox(bag, -0.016, -0.010, 0.006, 0.008, 0.010, 0.007, skinCol('wrist'), 0.15, 0, 0.1);
      pushBox(bag, 0.016, -0.010, 0.005, 0.007, 0.009, 0.006, skinCol('wrist'), 0.12, 0, -0.1);
      /* skin folds at the wrist */
      pushBox(bag, 0, -0.006, 0.011, 0.030, 0.0018, 0.0022, skinCol('tend'), 0.05, 0, 0);
      pushBox(bag, 0, -0.010, 0.010, 0.028, 0.0015, 0.0020, skinCol('tend'), 0.02, 0, 0);
      flush(state.hand, bag, mats.skin);
    }
    state._sculpted = 1;
    U.sculpted = (U.sculpted || 0) + 1;
  }

  /* Rolled linen cuff + fold facets on the existing __fpa sleeve, FP only. */
  function dressCuff(p, T, side) {
    if (!p || p.__cuff1285) return;
    p.__cuff1285 = 1;
    const host = p.cuff || p.fo || p.h;
    if (!host) return;
    const bag = { pos: [], nrm: [], uv: [], col: [] };
    /* Rolled hem ring (faceted torus made of boxes). */
    const RAD = 10, R = 0.048, tube = 0.0075;
    for (let i = 0; i < RAD; i++) {
      const a = (i / RAD) * Math.PI * 2;
      const fold = 1 - 0.18 * Math.max(0, Math.sin(a * 4));
      const col = fold < 0.92 ? skinCol('linenFold') : skinCol('linen');
      const x = Math.cos(a) * R * fold, z = Math.sin(a) * R * fold;
      pushBox(bag, x, 0.002, z, tube * 1.6, tube * 1.8, tube * 1.6, col, 0, -a, 0.2);
    }
    /* Longitudinal sleeve folds / weave ridges along the forearm. */
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.2;
      const x = Math.cos(a) * 0.042, z = Math.sin(a) * 0.042;
      const col = (i % 2) ? skinCol('linenFold') : skinCol('linenHi');
      pushBox(bag, x, -0.06, z, 0.004, 0.11, 0.0032, col, 0.04, -a, 0);
    }
    /* Cuff fabric layer, slightly larger than the wrist. */
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = Math.cos(a) * 0.046, z = Math.sin(a) * 0.046;
      pushBox(bag, x, -0.012, z, 0.018, 0.028, 0.004, skinCol('linen'), 0, -a, 0);
    }
    const mat = sculptMat(T, 'linen');
    const mesh = mkMesh(T, bagToGeo(T, bag), mat);
    mesh.userData.fpForearm1285 = 1;
    mesh.name = 'fpLinenCuff1285' + (side || '');
    /* Sit the roll at the cuff if we have one, otherwise at the wrist. */
    try {
      if (p.cuff) p.cuff.add(mesh);
      else host.add(mesh);
    } catch (_) { host.add(mesh); }
    U.cuffDressed = (U.cuffDressed || 0) + 1;
  }

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
      try { bakeCuffMask(mesh, T, side, srcSkel, srcMeshes[i]); }
      catch (e) { U.cuffStats = { err: String(e && e.message || e) }; }
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (let j = 0; j < mats.length; j++) patchMat(mats[j], isSkinMat(mats[j]));
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
    function beforeDraw() {
      if (!U.on) return;
      poseKind(currentKind());
      applyTune(state);
    }
    wrap.onBeforeRender = beforeDraw;
    for (let i = 0; i < outMeshes.length; i++) outMeshes[i].onBeforeRender = beforeDraw;
    /* Prism pieces stay in the file (1265 pushBox pipeline) but are not
       parented on by default: on this glove skeleton the bone-local dorsal
       axis does not match the cube-arm space, so the boxes float off the skin.
       Crease/nail/knuckle shader and the visible linen cuff carry the detail. */
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

  function v3cam(T, obj, camInv) {
    const w = new T.Vector3();
    obj.updateMatrixWorld(true);
    obj.getWorldPosition(w);
    w.applyMatrix4(camInv);
    return { x: +w.x.toFixed(3), y: +w.y.toFixed(3), z: +w.z.toFixed(3) };
  }
  function debugSeat() {
    const out = { kind: U.kind, cuff: U.cuffStats || null };
    try {
      const T = T3(); if (!T || !U.sides || !U.sides.R) return out;
      const st = U.sides.R;
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
        /* dressCuff stays available, but the __fpa cream sleeve is already
           visible once the TP forearm is clipped. Extra fold boxes were
           parenting into the wrong space and floating between fingers. */
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
