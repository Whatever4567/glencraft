/* GLX-HANDS1263 (v1.2.63): Restore first-person arms to the pre-1.2.60
   version — commit 1e9db15 (Build 1.2.59), the last release before the
   1.2.60 sculpted-hands re-enable. First-person items, including pistol
   and musket hip and ADS, use the 1.2.49 __fpa path with the 1.2.57–1.2.58
   sculpt and the 1.2.59 torch-pose freeze and pickaxe shift. The 1.2.60
   __fpVm1259 allow-list (NEW_FP_KINDS all on) and two-handed gun wraps,
   and the 1.2.62 wrist-pose shifts, are turned off. The 1.2.61 voxel arm
   stays removed. The first-person view-model stays hidden in third person
   (the 1.2.62 hide is kept). TARDIS, doors, torso sides, render distance,
   and the singer toggle are untouched. The gold D-pad is left alone. */
(function hands1263() {
  const U = window.__hands1263 = {
    err: null, on: 0, version: '1.2.63',
    restoredFrom: '1e9db15',
    restoredFromLabel: '1.2.59',
    frozen: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 260); };
  const KINDS = ['empty', 'p761', 'p760', 'pick', 'sword', 'claymore', 'torch', 'block', 'bucket', 'map', 'pistol', 'musket'];

  /* 1.2.59 left NEW_FP_KINDS at 0 for every item, so applyPose always
     falls through to the 1.2.49 __fpa / held-frame path. Freeze those
     keys at 0 so 1260.enableKinds and 1262.restore1259 cannot turn the
     1.2.60 baked-fist / 1282 gun rig back on. usesNewFp closes over the
     same object, so the getter is what applyPose sees. */
  function freezeKinds(obj) {
    if (!obj) return;
    try {
      for (const k of KINDS) {
        try { obj[k] = 0; } catch (_) {}
        try {
          Object.defineProperty(obj, k, {
            get() { return 0; },
            set() {},
            enumerable: true,
            configurable: true
          });
        } catch (_) { try { obj[k] = 0; } catch (__) {} }
      }
      U.frozen = 1;
    } catch (e) { ERR('frz', e); }
  }

  function drop1259() {
    try {
      const vm = window.__fpVm1259;
      if (!vm) return false;
      freezeKinds(vm.newFpKinds);
      /* Keep the 1259 IIFE enabled so applyPose still runs and takes the
         usesNewFp === false branch (same as 1.2.59). Do not set disabled. */
      try { if (typeof vm.enable === 'function') vm.enable(); } catch (_) { vm.disabled = 0; }
      if (typeof vm.apply === 'function') {
        try { vm.apply(); } catch (e) { ERR('apply1259', e); }
      }
      if (vm.rig) vm.rig.visible = false;
      if (vm.armR) vm.armR.visible = false;
      if (vm.armL) vm.armL.visible = false;
      vm.active = 0;
      vm.fallback1249 = 1;
      try { if (window.__fpTpArm1270 && __fpTpArm1270.hideAll) __fpTpArm1270.hideAll(); } catch (_) {}
      U.dropped = 1;
      return true;
    } catch (e) { ERR('drop', e); return false; }
  }

  function neutralize() {
    try {
      const H0 = window.__hands1260;
      if (H0 && typeof H0.enableKinds === 'function' && !H0._h1263) {
        const orig = H0.enableKinds;
        H0.enableKinds = function () {
          const r = orig.apply(this, arguments);
          try { drop1259(); } catch (_) {}
          return r;
        };
        H0._h1263 = 1;
      }
    } catch (e) { ERR('n1260', e); }
    try {
      const H2 = window.__hands1262;
      if (H2 && !H2._h1263) {
        /* Undo the 1.2.62 wrist-pose tweak. The closed-over boot() may
           still have run shiftPoses once; that only writes 1259 POSES,
           which are unused while NEW_FP_KINDS stays 0. */
        if (typeof H2.shiftPoses === 'function') {
          H2.shiftPoses = function () { U.shiftSkipped = 1; };
        }
        if (typeof H2.restore1259 === 'function') {
          const rst = H2.restore1259;
          H2.restore1259 = function () {
            const r = rst.apply(this, arguments);
            try { drop1259(); } catch (_) {}
            return r;
          };
        }
        H2._h1263 = 1;
      }
    } catch (e) { ERR('n1262', e); }
  }

  function hideVoxel() {
    try {
      const H = window.__hands1261;
      if (!H) return;
      H.on = 0;
      try { if (H.R) { H.R.visible = false; if (H.R.parent) H.R.parent.remove(H.R); } } catch (_) {}
      try { if (H.L) { H.L.visible = false; if (H.L.parent) H.L.parent.remove(H.L); } } catch (_) {}
    } catch (e) { ERR('vox', e); }
  }

  function apply() {
    try {
      hideVoxel();
      neutralize();
      drop1259();
      /* Re-run 1262's apply for third-person hiding, then drop 1259 again
         in case restore1259 turned the allow-list back on. */
      try {
        const H2 = window.__hands1262;
        if (H2 && typeof H2.apply === 'function') H2.apply();
      } catch (_) {}
      drop1259();
      U.on = 1;
    } catch (e) { ERR('apply', e); }
  }
  U.apply = apply;
  U.drop1259 = drop1259;
  U.freezeKinds = freezeKinds;

  function boot() { apply(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 50); });
  else setTimeout(boot, 50);
  /* 1260 / 1262 also boot at 40, 300 and 1000 ms — win those races. */
  setTimeout(boot, 360);
  setTimeout(boot, 1100);
  setTimeout(boot, 2000);
})();
