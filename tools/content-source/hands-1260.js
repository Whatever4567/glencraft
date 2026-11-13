/* GLX-HANDS1260 (v1.2.60): turn the sculpted first-person hands back on for
   every item, restore per-item grips, lit hand-atlas skin, and stop later
   paint from replacing them. The 1.2.59 torch-pose freeze and pickaxe
   rightward shift stay in place. */
(function hands1260(W) {
  const U = W.__hands1260 = { on: 0, err: null, version: '1.2.60-hands', painted: 0, kinds: 0 };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const T = W.THREE;
  const KINDS = ['empty', 'p761', 'p760', 'pick', 'sword', 'claymore', 'torch', 'block', 'bucket', 'map', 'pistol', 'musket'];

  function enableKinds() {
    try {
      const vm = W.__fpVm1259;
      if (vm && vm.newFpKinds) {
        for (const k of KINDS) vm.newFpKinds[k] = 1;
        U.kinds = 1;
      }
      if (vm && vm.POSES) {
        const L = { wr: [-0.22, -0.22, -0.48], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'palmUnder', haft: [-0.90, 0.18, 0.05], curl: 1, sleeve: 'linen', hs: 1.18, rs: 0.88 };
        if (vm.POSES.pistol) { vm.POSES.pistol.two = 1; if (!vm.POSES.pistol.L) vm.POSES.pistol.L = Object.assign({}, L); }
        if (vm.POSES.musket) { vm.POSES.musket.two = 1; if (!vm.POSES.musket.L) vm.POSES.musket.L = Object.assign({}, L, { wr: [-0.22, -0.22, -0.50] }); }
        /* keep the 1.2.59 pickaxe further right (bottom-right corner) */
        if (vm.POSES.p761 && vm.POSES.p761.R && vm.POSES.p761.R.wr) {
          if (vm.POSES.p761.R.wr[0] < 0.36) vm.POSES.p761.R.wr[0] = 0.36;
        }
      }
    } catch (e) { ERR('kinds', e); }
  }

  function litAtlas(mesh, kind) {
    if (!mesh || !T) return;
    try {
      const H = W.__hands1249;
      let mat = null;
      if (H) {
        if (kind === 'hand' && typeof H.handMat === 'function') mat = H.handMat();
        else if (kind === 'finger' && typeof H.fingerMat === 'function') mat = H.fingerMat();
        else if (kind === 'linen' && typeof H.linenMat === 'function') mat = H.linenMat();
        else if (typeof H.skinMat === 'function') mat = H.skinMat();
      }
      if (!mat) {
        const map = H && (kind === 'hand' ? H.HAND_ATLAS : kind === 'finger' ? H.FINGER_ATLAS : kind === 'linen' ? H.LINEN_MAP : H.SKIN_MAP);
        const opts = { color: 0xffffff, roughness: 0.68, metalness: 0.0 };
        if (map) opts.map = map;
        if (kind === 'linen') opts.color = 0xf2eee4;
        mat = new T.MeshStandardMaterial(opts);
      }
      mat.userData = mat.userData || {};
      mat.userData.sculptKeep = 1;
      mat.userData.hands1260 = 1;
      mesh.material = mat;
      mesh.userData = mesh.userData || {};
      mesh.userData.sculptKeep = 1;
      mesh.userData.hands1260 = 1;
    } catch (e) { ERR('mat', e); }
  }

  function protectRig(root) {
    if (!root || !root.traverse) return;
    try {
      root.traverse(function (o) {
        if (!(o.isMesh || o.isSkinnedMesh) || !o.material) return;
        o.userData = o.userData || {};
        o.userData.sculptKeep = 1;
        const n = String(o.name || '');
        const ud = o.userData;
        if (ud.palmAtlas || ud.pad1249 || /Palm|palm|FistPalm|OpenPalm/.test(n)) litAtlas(o, 'hand');
        else if (ud.fingerAtlas || /finger|Finger|thumb|Thumb|Wrap/.test(n)) litAtlas(o, 'finger');
        else if (ud.sleeveCap || ud.sleeveFo21 || /cuff|shirt|sleeve|Sleeve|up|fore/.test(n)) litAtlas(o, 'linen');
        else if (ud.nail1249) return;
        else litAtlas(o, 'skin');
      });
      U.painted++;
    } catch (e) { ERR('prot', e); }
  }

  function applyAll() {
    enableKinds();
    try {
      const vm = W.__fpVm1259;
      if (vm) {
        if (vm.armR) protectRig(vm.armR);
        if (vm.armL) protectRig(vm.armL);
        if (vm.rig) protectRig(vm.rig);
      }
    } catch (e) { ERR('vm', e); }
    try {
      const H = W.__hands1249;
      if (H && typeof H.apply === 'function') H.apply();
      if (H && typeof H.applyMaterials === 'function') {}
    } catch (e) { ERR('sc', e); }
    hookPaint();
    U.on = 1;
  }

  function hookPaint() {
    if (U._hooked) return;
    try {
      const H = W.__held1240;
      if (H && typeof H.retextureProceduralArms === 'function' && !H.__hands1260) {
        const prev = H.retextureProceduralArms.bind(H);
        H.retextureProceduralArms = function () {
          const r = prev.apply(this, arguments);
          try { applyAll(); } catch (_) {}
          return r;
        };
        H.__hands1260 = 1;
        U._hooked = 1;
      }
      if (H && typeof H.hardenFpa === 'function' && !H.__hands1260h) {
        const prevH = H.hardenFpa.bind(H);
        H.hardenFpa = function () {
          const r = prevH.apply(this, arguments);
          try { applyAll(); } catch (_) {}
          return r;
        };
        H.__hands1260h = 1;
      }
      if (H && typeof H.hardenMeshMats === 'function' && !H.__hands1260m) {
        const prevM = H.hardenMeshMats.bind(H);
        H.hardenMeshMats = function (root) {
          /* do not flatten protected sculpt / viewmodel hands */
          try {
            if (root && root.traverse) {
              root.traverse(function (o) {
                if (o.userData && (o.userData.sculptKeep || o.userData.hands1260 || o.userData.sculpt1249 || o.userData.fpHand1259)) {
                  if (o.material) {
                    const mats = Array.isArray(o.material) ? o.material : [o.material];
                    mats.forEach(m => { if (m && m.userData) m.userData.sculptKeep = 1; });
                  }
                }
              });
            }
          } catch (_) {}
          return prevM.apply(this, arguments);
        };
        H.__hands1260m = 1;
      }
    } catch (e) { ERR('hook', e); }
  }

  U.apply = applyAll;
  U.enableKinds = enableKinds;
  let n = 0;
  const boot = setInterval(function () {
    n++;
    try { applyAll(); } catch (_) {}
    if ((U.kinds && U.on) || n > 80) clearInterval(boot);
  }, 50);
  W.addEventListener && W.addEventListener('load', function () { applyAll(); });
})(typeof window !== 'undefined' ? window : this);
