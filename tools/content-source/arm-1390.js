/* GLX-ARM1390 (t1390): sculpt the existing GLOVE finger meshes on the
   __fpa / 1285 / 1347 / 1380 / 1389 rig. Chopped fingertip nail wells are
   closed into rounded pulps on the same vertices, bones and weights.
   The original geometry is kept and restored by window.__noArm1390 = 1.
   Does not replace the arms model, the guns, or earlier arm flags. */
(function arm1390() {
  const W = window;
  const U = W.__arm1390 = {
    ver: 'arm-1390', err: null, on: 1, applied: 0, n: 0
  };
  U.active = function () { return !W.__noArm1390; };
  const ERR = function (w, e) {
    if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240);
  };

  const SKIN_N = 2220;
  const PATH = {
    R: 'assets/models/fp-hands-1390/skin-R-pos.bin',
    L: 'assets/models/fp-hands-1390/skin-L-pos.bin'
  };
  const pos = { R: null, L: null };

  function loadBins() {
    if (pos.R && pos.L) return Promise.resolve();
    return Promise.all(['R', 'L'].map(function (side) {
      return fetch(PATH[side] + '?v=1390')
        .then(function (r) {
          if (!r.ok) throw new Error('fetch ' + side + ' ' + r.status);
          return r.arrayBuffer();
        })
        .then(function (b) {
          const f = new Float32Array(b);
          if (f.length !== SKIN_N * 3) throw new Error(side + ' count ' + f.length);
          pos[side] = f;
        });
    })).then(function () { U.n++; }).catch(function (e) { ERR('load', e); });
  }

  function sideOf(mesh) {
    const n = String((mesh && mesh.name) || '');
    if (/_R_articulated|GLOVE_\|_R_|visual_arm_slot0|\| R\b/.test(n)) return 'R';
    if (/_L_articulated|GLOVE_\|_L_|visual_arm_slot1|\| L\b/.test(n)) return 'L';
    return null;
  }

  function isSkin(mesh) {
    if (!mesh || !mesh.isMesh || !mesh.geometry || !mesh.geometry.attributes || !mesh.geometry.attributes.position) return false;
    if (mesh.geometry.attributes.position.count !== SKIN_N) return false;
    const n = String(mesh.name || '');
    if (/finger_0_1/.test(n)) return true;
    const mat = mesh.material;
    const mn = Array.isArray(mat) ? (mat[0] && mat[0].name) : (mat && mat.name);
    return /HeadSkin/i.test(String(mn || ''));
  }

  function applyMesh(mesh) {
    try {
      const side = sideOf(mesh);
      if (!side || !pos[side] || !isSkin(mesh)) return 0;
      const g = mesh.geometry;
      const attr = g.attributes.position;
      if (attr.count !== SKIN_N) return 0;
      if (!g.userData) g.userData = {};
      if (!g.userData._pos137) {
        g.userData._pos137 = new Float32Array(attr.array);
        g.userData._pos137.set(attr.array);
      }
      const src = U.active() ? pos[side] : g.userData._pos137;
      attr.array.set(src);
      attr.needsUpdate = true;
      if (typeof g.computeVertexNormals === 'function') g.computeVertexNormals();
      U.applied++;
      return 1;
    } catch (e) { ERR('apply', e); return 0; }
  }

  function walk(o) {
    let n = 0;
    if (!o) return 0;
    if (o.traverse) o.traverse(function (c) { n += applyMesh(c); });
    else if (Array.isArray(o)) { for (let i = 0; i < o.length; i++) n += walk(o[i]); }
    else if (o.isMesh) n += applyMesh(o);
    else if (typeof o === 'object') {
      if (o.scene) n += walk(o.scene);
      if (o.wrap) n += walk(o.wrap);
      if (o.meshes) n += walk(o.meshes);
      if (o.bySide) n += walk(o.bySide);
      if (o.R) n += walk(o.R);
      if (o.L) n += walk(o.L);
    }
    return n;
  }

  function applyAll() {
    if (!pos.R || !pos.L) return 0;
    let n = 0;
    try {
      const H = W.__handsFp1285;
      if (H) { n += walk(H.src); n += walk(H.sides); }
    } catch (e) { ERR('fp', e); }
    try { if (typeof worldModel !== 'undefined' && worldModel) n += walk(worldModel); } catch (e) {}
    try {
      const f = W.__fpa && __fpa.rig && __fpa.rig();
      if (f) n += walk(f);
    } catch (e) {}
    return n;
  }

  function hook() {
    try {
      const H = W.__handsFp1285;
      if (H && typeof H.updateHand === 'function' && !H.updateHand.__arm1390) {
        const prev = H.updateHand;
        H.updateHand = function () {
          const r = prev.apply(this, arguments);
          try { if (U._want && U.applied < 1) applyAll(); } catch (e) { ERR('tick', e); }
          return r;
        };
        H.updateHand.__arm1390 = 1;
      }
    } catch (e) { ERR('hook', e); }
  }

  function start() {
    hook();
    loadBins().then(function () {
      U._want = 1;
      applyAll();
    });
  }

  try { start(); } catch (e) { ERR('start', e); }
  try { setInterval(function () { hook(); if (pos.R && U._want && U.applied < 1) applyAll(); }, 1000); } catch (_) {}
})();
