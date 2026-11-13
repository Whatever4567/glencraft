/* GLX-HANDS1262 (v1.2.62): Remove the 1.2.61 voxel-arm replacement and
   restore the 1.2.60 first-person arm (__fpVm1259 + sculpted 1.2.49/1260
   hands) with its existing swing, mine, place, idle-bob and per-item
   grips. Only the rest-pose transform and hold offsets are adjusted so
   the forearm comes in from the bottom-right, the sleeve sits at the
   edge, the empty hand is palm-up, and each item has a sensible grip.
   The view-model is hidden in third person. No new geometry or animation
   system is added. */
(function hands1262() {
  const U = window.__hands1262 = { err: null, on: 0, version: '1.2.62', restored: 0 };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 260); };

  /* Rest-pose wrist in the 1259 NDC frame: [ndcX, ndcY, zCam].
     +X right, -Y down, z toward the camera is negative. These are
     written onto the existing POSES objects (haft/curl/face kept). */
  const WR = {
    empty:  [0.30, -0.30, -0.40],
    block:  [0.16, -0.32, -0.40],
    map:    [0.16, -0.30, -0.44],
    bucket: [0.40, -0.16, -0.40],
    torch:  [0.32, -0.28, -0.42],
    sword:  [0.32, -0.28, -0.42],
    claymore:[0.32, -0.28, -0.42],
    p761:   [0.38, -0.28, -0.42],
    pick:   [0.38, -0.28, -0.42],
    p760:   [0.38, -0.28, -0.42],
    pistol: [0.34, -0.26, -0.44],
    musket: [0.34, -0.26, -0.46],
    other:  [0.30, -0.28, -0.42]
  };

  function hideVoxelArm() {
    try {
      const H = window.__hands1261;
      if (!H) return;
      H.on = 0;
      try { if (H.R) { H.R.visible = false; if (H.R.parent) H.R.parent.remove(H.R); } } catch (_) {}
      try { if (H.L) { H.L.visible = false; if (H.L.parent) H.L.parent.remove(H.L); } } catch (_) {}
      if (typeof H.apply === 'function' && !H._noop1262) {
        H.apply = function () { try { if (H.R) H.R.visible = false; if (H.L) H.L.visible = false; } catch (_) {} };
        H._noop1262 = 1;
      }
    } catch (e) { ERR('hideVox', e); }
  }

  function restore1259() {
    try {
      const vm = window.__fpVm1259;
      if (!vm) return false;
      vm.disabled = 0;
      vm._h1261dis = 0;
      if (typeof vm.enable === 'function') {
        /* 1.2.61 replaced enable() with a no-op; put a real enable back. */
        if (vm._h1261en || (vm.enable.length === 0 && /disabled = 1/.test(String(vm.enable)))) {
          vm.enable = function () { vm.disabled = 0; };
          vm._h1261en = 0;
        }
        try { vm.enable(); } catch (_) { vm.disabled = 0; }
      }
      /* Keep every item on the 1.2.60 allow-list so sculpted grips stay on. */
      try {
        const H0 = window.__hands1260;
        if (H0 && typeof H0.enableKinds === 'function') H0.enableKinds();
        else if (vm.newFpKinds) {
          ['empty', 'p761', 'p760', 'pick', 'sword', 'claymore', 'torch', 'block', 'bucket', 'map', 'pistol', 'musket'].forEach(k => { vm.newFpKinds[k] = 1; });
        }
      } catch (_) {}
      U.restored = 1;
      return true;
    } catch (e) { ERR('rst', e); return false; }
  }

  function shiftPoses() {
    try {
      const vm = window.__fpVm1259;
      const P = vm && vm.POSES;
      if (!P) return;
      for (const k of Object.keys(WR)) {
        const pose = P[k];
        if (!pose || !pose.R) continue;
        const wr = WR[k];
        pose.R.wr = wr.slice();
        /* empty hand: palm faces the camera, fingers relaxed. */
        if (k === 'empty' || k === 'block' || k === 'map') {
          pose.R.face = 'palmUp';
        }
      }
      /* 1.2.59 pickaxe stays further right. */
      try {
        if (P.p761 && P.p761.R && P.p761.R.wr && P.p761.R.wr[0] < 0.36) P.p761.R.wr[0] = 0.36;
        if (P.pick && P.pick.R && P.pick.R.wr && P.pick.R.wr[0] < 0.36) P.pick.R.wr[0] = 0.36;
      } catch (_) {}
      /* pistol / musket two-handed wrap from 1.2.60 stays; only R wrist moves. */
      U.posed = 1;
    } catch (e) { ERR('poses', e); }
  }

  function hideInThirdPerson() {
    try {
      const tp = !!(window.__thirdPerson || (typeof camMode !== 'undefined' && camMode));
      const vm = window.__fpVm1259;
      if (tp) {
        if (vm) {
          vm.active = 0;
          if (vm.rig) vm.rig.visible = false;
          if (vm.armR) vm.armR.visible = false;
          if (vm.armL) vm.armL.visible = false;
        }
        try { if (window.__fpTpArm1270 && __fpTpArm1270.hideAll) __fpTpArm1270.hideAll(); } catch (_) {}
        hideVoxelArm();
      }
    } catch (e) { ERR('tp', e); }
  }

  function apply() {
    try {
      hideVoxelArm();
      restore1259();
      hideInThirdPerson();
    } catch (e) { ERR('apply', e); }
  }
  U.apply = apply;
  U.shiftPoses = shiftPoses;
  U.restore1259 = restore1259;

  function hook() {
    try {
      if (typeof updatePlayer === 'function' && !updatePlayer._h1262r) {
        const up = updatePlayer;
        updatePlayer = function () {
          const r = up.apply(this, arguments);
          try { hideInThirdPerson(); } catch (_) {}
          return r;
        };
        updatePlayer._h1262r = 1;
        window.updatePlayer = updatePlayer;
      }
    } catch (_) {}
    try {
      if (typeof placeCamera === 'function' && !placeCamera._h1262r) {
        const pc = placeCamera;
        placeCamera = function () {
          const r = pc.apply(this, arguments);
          try { hideInThirdPerson(); } catch (_) {}
          return r;
        };
        placeCamera._h1262r = 1;
        window.placeCamera = placeCamera;
      }
    } catch (_) {}
  }

  function boot() {
    try {
      hideVoxelArm();
      if (!restore1259()) { setTimeout(boot, 120); return; }
      shiftPoses();
      hook();
      apply();
      U.on = 1;
      try {
        const H0 = window.__hands1260;
        if (H0 && typeof H0.apply === 'function') H0.apply();
      } catch (_) {}
    } catch (e) { ERR('boot', e); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 40));
  else setTimeout(boot, 40);
  setTimeout(boot, 300);
  setTimeout(boot, 1000);
})();
