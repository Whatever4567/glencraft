/* GLX-RIFLE1392 (t1392): delete the wrong rifle that still appears on screen.
   1) Lock-hide the leftover bolt-action scope and its glass ("screens").
      c322 already tries to hide them with visible=false, but later measurement
      passes keep GLB meshes visible (fp1347 hides by layer only), so the scope
      glass can leak. This locks them off.
   2) When first-person look-down shows the body/legs (pitch < -0.5), hide the
      third-person held musket so a second rifle does not sit in the view.
      Applied just before renderer.render so later arm-loop wrappers cannot
      put it back in the same frame. Arms and legs are left as they are.
   window.__noRifle1392 = 1 before load restores the 1.2.139 look.
   Does not change the __fpa rig, flintlock geometry, or 1.2.119 wood/steel maps. */
(function rifle1392(W) {
  const U = W.__rifle1392 = {err: null, on: 0, hidScreen: 0, hidGun: 0, hooks: 0, renderHook: 0, version: '1.2.140'};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const off = () => !!W.__noRifle1392;

  function isScopeScreen(o) {
    if (!o) return false;
    const mat = o.material && (Array.isArray(o.material) ? o.material[0] : o.material);
    const nm = ((o.name || '') + ' ' + ((mat && mat.name) || '')).toLowerCase();
    if (/bolt_action_rifle_7_62_scope|_scope$/.test(nm)) return true;
    if (/accesories_glass|accessories_glass/.test(nm)) return true;
    return false;
  }

  function underGun(o) {
    let p = o;
    while (p) {
      const u = p.userData || {};
      if (u.gun === 213 || u.gun === 212 || u.fp1347 === 'musket' || u.fp1347 === 'pistol' || u.c322) return true;
      if (/bolt_action_rifle_7_62/.test(p.name || '')) return true;
      p = p.parent;
    }
    return false;
  }

  function lockHide(o) {
    try {
      o.visible = false;
      Object.defineProperty(o, 'visible', {get() { return false; }, set(_) {}, configurable: true});
      try { if (o.layers && o.layers.set) o.layers.set(31); } catch (_) {}
    } catch (_) {}
  }

  function hideScreens(root) {
    if (!root || off()) return 0;
    let n = 0;
    try {
      root.traverse(o => {
        if (!o.isMesh && !o.isGroup && !o.isObject3D) return;
        if (isScopeScreen(o) && underGun(o)) { lockHide(o); n++; }
      });
    } catch (e) { ERR('screens', e); }
    U.hidScreen += n;
    return n;
  }

  function isHeldGun(o) {
    if (!o || o === (typeof worldModel !== 'undefined' ? worldModel : null)) return false;
    const u = o.userData || {};
    if (u.gun === 213 || u.gun === 212 || u.fp1347 === 'musket' || u.fp1347 === 'pistol') return true;
    if (/bolt_action_rifle_7_62/.test(o.name || '')) return true;
    return false;
  }

  function gunRoot(o) {
    let root = null, p = o;
    const wm = (typeof worldModel !== 'undefined') ? worldModel : null;
    while (p && p !== wm) {
      if (isHeldGun(p)) root = p;
      p = p.parent;
    }
    return root;
  }

  function hideFpBodyGun(on) {
    if (off()) return 0;
    let n = 0;
    try {
      const wm = (typeof worldModel !== 'undefined') ? worldModel : null;
      if (!wm) return 0;
      const roots = new Set();
      wm.traverse(o => {
        if (isHeldGun(o)) {
          const r = gunRoot(o) || o;
          if (r && r !== wm) roots.add(r);
        }
      });
      roots.forEach(o => {
        if (on) {
          if (o.userData._vis1392 == null) o.userData._vis1392 = o.visible !== false;
          o.visible = false;
          n++;
        } else if (o.userData._vis1392 != null) {
          o.visible = !!o.userData._vis1392;
          delete o.userData._vis1392;
          n++;
        }
      });
    } catch (e) { ERR('bodyGun', e); }
    if (on) U.hidGun += n;
    return n;
  }

  function lookDownOn() {
    return !off() && (typeof camMode !== 'undefined' && camMode === 0) &&
      (typeof P !== 'undefined' && P.pitch < -0.5) &&
      !(W.__swimHide) && !(typeof MODE !== 'undefined' && MODE.fly && typeof flying !== 'undefined' && flying);
  }

  function sweep() {
    if (off()) { U.on = 0; return; }
    try { if (typeof held !== 'undefined' && held) hideScreens(held); } catch (_) {}
    try { if (typeof worldModel !== 'undefined' && worldModel) hideScreens(worldModel); } catch (_) {}
    try { if (typeof scene !== 'undefined' && scene) hideScreens(scene); } catch (_) {}
    U.on = 1;
  }

  function apply() {
    if (off()) return;
    sweep();
    hideFpBodyGun(lookDownOn());
  }

  function hook() {
    if (off()) return;
    try {
      if (!U.hooks) {
        const uw = updateWorldModel;
        updateWorldModel = function () {
          const r = uw.apply(this, arguments);
          try { apply(); } catch (e) { ERR('uw', e); }
          return r;
        };
        U.hooks = 1;
      }
    } catch (e) { ERR('hook', e); }
    try {
      if (!U.renderHook && typeof renderer !== 'undefined' && renderer && renderer.render) {
        const rr = renderer.render.bind(renderer);
        renderer.render = function (s, c) {
          try { apply(); } catch (e) { ERR('render', e); }
          return rr(s, c);
        };
        U.renderHook = 1;
      }
    } catch (e) { ERR('renderHook', e); }
  }

  try { hook(); apply(); } catch (e) { ERR('start', e); }
  try { setInterval(() => { hook(); apply(); }, 500); } catch (_) {}
})(typeof window !== 'undefined' ? window : this);
