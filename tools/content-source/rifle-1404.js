/* GLX-RIFLE1404 (t1404): restore the 1.2.1 rifle texture.
   At 1.2.1 (5ef42ac) c322 swapped in gun_rifle_{2k|4k}.glb — the same CC0
   Poly Haven files still in the tree — with native MeshStandard PBR maps
   on the bolt-action UVs. Later fp1347 hides that GLB by render layer 31
   and paints atlas crops onto a procedural flintlock. Those crops cannot
   carry the 1.2.1 look: the UVs are different, and the crops drop the
   metal/rough/normal maps. A later held-item pass also converts the hidden
   GLB materials to Phong, which drops those maps.
   This shows the original GLB again, hides the flintlock musket (not
   deleted), copies Standard materials back from a fresh GLB load, and
   leaves the 1.2.140 scope/glass lock-hide in place.
   window.__noRifle1404 = 1 before load restores the 1.2.142 flintlock look.
   Does not change the __fpa rig, the fingers, or the pistol. */
(function rifle1404(W) {
  const U = W.__rifle1404 = {err: null, on: 0, hooks: 0, renderHook: 0, shown: 0, hidFlint: 0, mats: 0, version: '1.2.143'};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const off = () => !!W.__noRifle1404;

  function isScope(o) {
    if (!o) return false;
    const mat = o.material && (Array.isArray(o.material) ? o.material[0] : o.material);
    const nm = ((o.name || '') + ' ' + ((mat && mat.name) || '')).toLowerCase();
    return /bolt_action_rifle_7_62_scope|_scope$|accesories_glass|accessories_glass/.test(nm);
  }

  function underMusket(o) {
    let p = o;
    while (p) {
      const u = p.userData || {};
      if (u.gun === 213 || u.fp1347 === 'musket') return true;
      if (/bolt_action_rifle_7_62/.test(p.name || '')) return true;
      p = p.parent;
    }
    return false;
  }

  function isGlbMusketMesh(o) {
    if (!o || !o.isMesh) return false;
    if (isScope(o)) return false;
    if (!underMusket(o)) return false;
    if (o.userData && o.userData.fp1347Hid) return true;
    if (/bolt_action_rifle_7_62/.test(o.name || '')) return true;
    return false;
  }

  function isFlintMusketMesh(o) {
    if (!o || !o.isMesh) return false;
    if (o.userData && o.userData.fp1347Hid) return false;
    if (!o.userData || !o.userData.fp1347) return false;
    let p = o;
    while (p) {
      const u = p.userData || {};
      if (u.fp1347 === 'musket' || u.gun === 213) return true;
      p = p.parent;
    }
    return false;
  }

  function layerMask(o, mask) {
    try {
      let L = o.layers;
      if (!L) return;
      try { L.mask = mask; } catch (_) {}
    } catch (_) {}
  }

  function paintMats(o) {
    if (!U.matSrc || isScope(o)) return;
    const src = U.matSrc[o.name];
    if (!src) return;
    const cur = Array.isArray(o.material) ? o.material[0] : o.material;
    if (cur && cur.isMeshStandardMaterial && cur.map && (cur.metalnessMap || cur.normalMap)) return;
    try {
      o.material = Array.isArray(src) ? src.map(m => m) : src;
      if (o.material) o.material.needsUpdate = true;
      U.mats++;
    } catch (e) { ERR('paint', e); }
  }

  function loadMats() {
    if (U.matSrc || U.loadingMats) return;
    U.loadingMats = 1;
    try {
      const T = W.THREE || (typeof THREE !== 'undefined' ? THREE : null);
      if (!T || !T.GLTFLoader) { U.loadingMats = 0; return; }
      const res = (W.__c322 && __c322.res) || '4k';
      const L = new T.GLTFLoader();
      try { if (typeof MeshoptDecoder !== 'undefined') L.setMeshoptDecoder(MeshoptDecoder); } catch (_) {}
      L.load('assets/guns/gun_rifle_' + res + '.glb?g1129', g => {
        const by = {};
        try {
          g.scene.traverse(o => {
            if (o.isMesh && o.material && o.name) by[o.name] = o.material;
          });
        } catch (e) { ERR('matWalk', e); }
        U.matSrc = by;
        U.loadingMats = 0;
        apply();
      }, null, e => { ERR('matLoad', e); U.loadingMats = 0; });
    } catch (e) { ERR('matStart', e); U.loadingMats = 0; }
  }

  function wrapHarden() {
    if (U.hooks) return;
    try {
      for (const k of Object.keys(W)) {
        const u = W[k];
        if (!u || typeof u.hardenMeshMats !== 'function' || u.hardenMeshMats.__rifle1404) continue;
        const orig = u.hardenMeshMats;
        u.hardenMeshMats = function (root, pred) {
          return orig.call(this, root, function (o) {
            if (!off() && isGlbMusketMesh(o)) return false;
            return pred ? pred(o) : true;
          });
        };
        u.hardenMeshMats.__rifle1404 = 1;
        U.hooks = 1;
      }
    } catch (e) { ERR('harden', e); }
  }

  function apply() {
    wrapHarden();
    if (!off()) loadMats();
    const roots = [];
    try { if (typeof held !== 'undefined' && held) roots.push(held); } catch (_) {}
    try { if (typeof worldModel !== 'undefined' && worldModel) roots.push(worldModel); } catch (_) {}
    if (!roots.length) return;
    let shown = 0, hid = 0;
    const walk = (root) => {
      root.traverse(o => {
        if (!o.isMesh) return;
        if (off()) {
          if (isGlbMusketMesh(o)) layerMask(o, 1 << 31);
          if (isFlintMusketMesh(o) && o.userData._mask1404 != null) {
            layerMask(o, o.userData._mask1404);
            delete o.userData._mask1404;
          }
          return;
        }
        if (isGlbMusketMesh(o)) {
          layerMask(o, 1);
          paintMats(o);
          shown++;
        } else if (isFlintMusketMesh(o)) {
          if (o.userData._mask1404 == null) {
            try { o.userData._mask1404 = o.layers ? o.layers.mask : 1; } catch (_) { o.userData._mask1404 = 1; }
          }
          layerMask(o, 1 << 31);
          hid++;
        }
      });
    };
    try { roots.forEach(walk); } catch (e) { ERR('apply', e); }
    U.shown += shown;
    U.hidFlint += hid;
    U.on = off() ? 0 : 1;
  }

  function hook() {
    try {
      if (typeof renderer === 'undefined' || !renderer || !renderer.render) return;
      const r = renderer.render;
      if (r.__rifle1404) return;
      const wrap = function (s, c) {
        try { apply(); } catch (e) { ERR('render', e); }
        return r.call(this, s, c);
      };
      wrap.__rifle1404 = 1;
      renderer.render = wrap;
      U.renderHook = 1;
    } catch (e) { ERR('hook', e); }
  }

  try { hook(); apply(); } catch (e) { ERR('start', e); }
  try { setInterval(() => { hook(); apply(); }, 250); } catch (_) {}
})(typeof window !== 'undefined' ? window : this);
