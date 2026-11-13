/* GLX-FIX1273 (v1.2.73): pistol magazine in the well, RT release stops
   the swing, gun ADS and musket reload stay together, TARDIS speed cap,
   and rare tree-near Scottish dog packs.
   (1) The Highland pistol's magazine is seated in the grip in hip fire
   and ADS, on every gun that has a magazine. The spare that sits beside
   the body in the asset is moved fully into the well (the old +0.085
   nudge left it short).
   (2) Letting go of the on-screen RT / Mine button clears attackTouch,
   including when the pointer-up is lost by #lookZone, a failed
   setPointerCapture, a pointerId mismatch, pointercancel, touchcancel
   or lostpointercapture. Hold-to-mine still works while that finger is
   down. Two-finger LOOK + RT is unchanged. Animations only run on real
   input. The pickaxe sleeve stays a connected forearm, cuff and hand
   in first person — not a floating cream stump.
   (3) A musket or rifle no longer treats a nameless mesh as its
   magazine, so reload cannot slide, hide or spin the gun itself.
   Musket ADS keeps the forearm visible so the arms stay attached.
   1.2.71 skin and material are kept.
   (4) TARDIS flight is capped at 100,000 miles per hour (1 block = 1 m,
   so 44,704 blocks/s). Pilot velocity and boost cannot exceed that.
   While you are flying it, speed is shown in mph.
   (5) Wild 1267 canine packs (the path that becomes Scottish dogs)
   only spawn near trees, in groups of at most 3, 4-8 blocks apart,
   at about a tenth of the old rate, with a lower per-chunk cap.
   First-person hands stay hidden in third person. The gold D-pad is
   left alone. */
(function fix1273() {
  const U = window.__fix1273 = {
    err: null, on: 1, version: '1.2.73',
    seated: 0, magRepair: 0, rtClears: 0, rtHook: 0, flyHud: 0,
    lastClear: '', rtIds: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };

  const MPH_CAP = 100000;
  const M_PER_MILE = 1609.344;
  const MAX_V = MPH_CAP * M_PER_MILE / 3600; /* 44704.0 blocks/s */
  U.MAX_V = MAX_V;
  U.mph = (blocksPerSec) => (blocksPerSec || 0) * 3600 / M_PER_MILE;
  U.clampV = function (v) {
    if (!v) return 0;
    const spd = Math.hypot(v[0] || 0, v[1] || 0, v[2] || 0);
    if (spd > MAX_V && spd > 0) {
      const s = MAX_V / spd;
      v[0] *= s; v[1] *= s; v[2] *= s;
      return MAX_V;
    }
    return spd;
  };

  function isTp() {
    try { return !!(window.__thirdPerson || (typeof camMode !== 'undefined' && camMode)); } catch (_) { return false; }
  }
  function T3() { try { return window.THREE; } catch (_) { return null; } }

  /* ---------- (1) seat the pistol magazine in the well ---------- */
  function modelBox(root, o) {
    const T = T3();
    if (!T || !root || !o) return null;
    const b = new T.Box3(), v = new T.Vector3(), X = new T.Matrix4();
    const inv = new T.Matrix4().copy(root.matrixWorld).invert();
    o.traverse(function (c) {
      if (!c.isMesh || !c.geometry || !c.geometry.attributes || !c.geometry.attributes.position) return;
      X.multiplyMatrices(inv, c.matrixWorld);
      const q = c.geometry.attributes.position;
      for (let i = 0; i < q.count; i++) b.expandByPoint(v.fromBufferAttribute(q, i).applyMatrix4(X));
    });
    return b.isEmpty() ? null : b;
  }

  function seatMag(root) {
    const T = T3();
    if (!T || !root) return 0;
    let F = null, M = null;
    try {
      root.traverse(function (o) {
        if (!o.isMesh || !o.name) return;
        if (/pistol_a$/.test(o.name) || /rifle_a$/.test(o.name)) F = o;
        if (/magazine_loaded$/.test(o.name) || /magazine$/.test(o.name)) M = o;
      });
    } catch (e) { ERR('seat-find', e); return 0; }
    if (!F || !M) return 0;
    try { root.updateMatrixWorld(true); } catch (_) {}
    const bf = modelBox(root, F), bm = modelBox(root, M);
    if (!bf || !bm) return 0;
    const bodyCx = (bf.min.x + bf.max.x) / 2;
    const magCx = (bm.min.x + bm.max.x) / 2;
    const dx = bodyCx - magCx;
    /* Already in the well: the mag's X extent overlaps the body's, and
       the centres are close. */
    const overlapX = bm.max.x > bf.min.x + 0.002 && bm.min.x < bf.max.x - 0.002;
    if (overlapX && Math.abs(dx) < 0.012) {
      M.userData.__seated1273 = 1;
      return 2;
    }
    if (Math.abs(dx) < 1e-5) return 2;
    try {
      const t = new T.Object3D(), par = M.parent;
      root.add(t);
      t.attach(M);
      M.position.x += dx;
      if (par) par.attach(M);
      else root.attach(M);
      root.remove(t);
      M.userData.__seated1273 = 1;
      U.seated++;
      return 1;
    } catch (e) { ERR('seat', e); return 0; }
  }
  U.seatMag = seatMag;

  function hookMagFix() {
    try {
      const G = window.__gs1222;
      if (G && typeof G.magFix === 'function' && !G.magFix.__fix1273) {
        const prev = G.magFix;
        G.magFix = function (m) {
          let r = 0;
          try { r = prev.apply(this, arguments); } catch (e) { ERR('magFix0', e); }
          try { const s = seatMag(m); if (s) r = s; } catch (e) { ERR('magFix1', e); }
          return r;
        };
        G.magFix.__fix1273 = 1;
      }
    } catch (e) { ERR('hookMag', e); }
  }

  function eachGun(fn) {
    const roots = [];
    try { if (typeof held !== 'undefined' && held) roots.push(held); } catch (_) {}
    try { if (typeof hand !== 'undefined' && hand) roots.push(hand); } catch (_) {}
    try { if (window.__vm && __vm.vs) roots.push(__vm.vs); } catch (_) {}
    try { if (typeof scene !== 'undefined' && scene) roots.push(scene); } catch (_) {}
    const seen = new Set();
    for (let i = 0; i < roots.length; i++) {
      const r = roots[i];
      if (!r || !r.traverse) continue;
      try {
        r.traverse(function (o) {
          const u = o.userData;
          if (!u || !u.gun || !u.rig || seen.has(o)) return;
          seen.add(o);
          fn(o, u);
        });
      } catch (e) { ERR('eachGun', e); }
    }
  }

  function isRealMag(holder) {
    let ok = false;
    if (!holder || !holder.traverse) return false;
    try {
      holder.traverse(function (o) {
        if (o.isMesh && /magazine/i.test(o.name || '')) ok = true;
      });
    } catch (_) {}
    return ok;
  }

  function repairGuns() {
    eachGun(function (g, u) {
      try {
        const isP = (typeof IT !== 'undefined' && u.gun === IT.PISTOL) || u.gun === 212;
        if (u.mag && !isRealMag(u.mag) && !isP && !u.__mag1273) {
          try { u.mag.visible = true; u.mag.position.y = 0; } catch (_) {}
          try { u.mag.traverse(function (o) { if (o.visible === false) o.visible = true; }); } catch (_) {}
          try { u.mag = new (T3().Group)(); } catch (_) { u.mag = { position: { y: 0 }, visible: true, traverse: function () {} }; }
          u.__mag1273 = 1;
          U.magRepair++;
        }
        if (isP || isRealMag(g) || isRealMag(u.rig) || isRealMag(u.mag)) {
          seatMag(g);
          if (u.rig) seatMag(u.rig);
        }
      } catch (e) { ERR('repair', e); }
    });
  }

  /* ---------- (2) RT / Mine release clears attackTouch ---------- */
  const rtIds = new Set();

  function bMine() {
    try { return document.getElementById('bMine'); } catch (_) { return null; }
  }
  function setRt(id, on) {
    if (id == null) return;
    if (on) rtIds.add(id);
    else rtIds.delete(id);
    U.rtIds = rtIds.size;
    try { attackTouch = rtIds.size > 0; } catch (_) {}
    const el = bMine();
    if (el && el.classList) {
      if (rtIds.size) el.classList.add('on');
      else el.classList.remove('on');
    }
  }
  function clearRt(id, why) {
    const had = (id == null) ? rtIds.size : rtIds.has(id);
    if (id == null) {
      rtIds.clear();
      try { if (typeof attackTouch !== 'undefined' && attackTouch) attackTouch = false; } catch (_) {}
      const el = bMine();
      if (el) el.classList.remove('on');
      U.rtIds = 0;
    } else {
      setRt(id, false);
    }
    if (had) { U.rtClears++; U.lastClear = why || ''; }
  }
  U.clearRt = clearRt;

  function fromMine(e) {
    try {
      const t = e && (e.target || e.srcElement);
      if (t && t.closest && t.closest('#bMine')) return true;
      if (t && t.id === 'bMine') return true;
    } catch (_) {}
    return false;
  }

  function hookMine(el) {
    if (!el || el.__fix1273rt) return;
    el.__fix1273rt = 1;
    U.rtHook = 1;
    el.addEventListener('pointerdown', function (e) {
      try {
        if (e.button != null && e.button !== 0) return;
        setRt(e.pointerId, true);
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
      } catch (err) { ERR('rtdn', err); }
    }, true);
    function end(e) {
      try {
        if (!e || e.pointerId == null) return;
        if (rtIds.has(e.pointerId) || fromMine(e)) clearRt(e.pointerId, e.type);
      } catch (err) { ERR('rtend', err); }
    }
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) {
      el.addEventListener(ev, end, true);
    });
  }

  function mineTouchStillDown(e) {
    try {
      const ts = e && e.touches;
      if (!ts || !ts.length) return false;
      for (let i = 0; i < ts.length; i++) {
        const t = ts[i];
        if (rtIds.has(t.identifier)) return true;
        const tgt = t.target;
        if (tgt && tgt.closest && tgt.closest('#bMine')) return true;
        try {
          const el = document.elementFromPoint(t.clientX, t.clientY);
          if (el && el.closest && el.closest('#bMine')) return true;
        } catch (_) {}
      }
    } catch (_) {}
    return false;
  }

  function installRt() {
    if (U._rt) return;
    U._rt = 1;
    hookMine(bMine());
    function winEnd(e) {
      try {
        if (!e) return;
        if (e.pointerId != null && rtIds.has(e.pointerId)) {
          clearRt(e.pointerId, 'win-' + e.type);
          return;
        }
        /* Fallback for a press our hook missed (button rebuilt, or the
           original handler set attackTouch without us seeing the id):
           a non-mouse release, no tracked RT finger, and the event is
           not a leftover look-zone hold, clears a stuck attackTouch. */
        if (e.pointerType && e.pointerType !== 'mouse' && rtIds.size === 0) {
          let hold = false;
          try { if (window.__c245 && __c245.hold) hold = true; } catch (_) {}
          if (!hold && !fromMine(e)) {
            /* only clear if nothing is still down on #bMine */
            const el = bMine();
            let down = false;
            try { if (el && typeof el.hasPointerCapture === 'function' && e.pointerId != null && el.hasPointerCapture(e.pointerId)) down = true; } catch (_) {}
            if (!down) {
              try {
                if (typeof attackTouch !== 'undefined' && attackTouch) {
                  attackTouch = false;
                  if (el) el.classList.remove('on');
                  U.rtClears++;
                  U.lastClear = 'win-fallback-' + e.type;
                }
              } catch (_) {}
            }
          }
        }
      } catch (err) { ERR('winEnd', err); }
    }
    try { window.addEventListener('pointerup', winEnd, true); } catch (_) {}
    try { window.addEventListener('pointercancel', winEnd, true); } catch (_) {}
    try { window.addEventListener('lostpointercapture', winEnd, true); } catch (_) {}
    function touchEnd(e) {
      try {
        const live = new Set();
        try { const ts = e.touches; for (let i = 0; i < (ts && ts.length); i++) live.add(ts[i].identifier); } catch (_) {}
        const ids = [];
        rtIds.forEach(function (id) { ids.push(id); });
        for (let i = 0; i < ids.length; i++) {
          if (!live.has(ids[i])) clearRt(ids[i], e.type);
        }
        if (rtIds.size === 0 && !mineTouchStillDown(e)) {
          try {
            if (typeof attackTouch !== 'undefined' && attackTouch) {
              /* Look-zone long-press (C245) may also use attackTouch;
                 only clear if this touch was on #bMine or we tracked it. */
              let ours = false;
              try {
                const ch = e.changedTouches;
                for (let i = 0; ch && i < ch.length; i++) {
                  const t = ch[i];
                  if (t.target && t.target.closest && t.target.closest('#bMine')) ours = true;
                }
              } catch (_) {}
              if (ours) {
                attackTouch = false;
                const el = bMine();
                if (el) el.classList.remove('on');
                U.rtClears++;
                U.lastClear = e.type;
              }
            }
          } catch (_) {}
        }
      } catch (err) { ERR('te', err); }
    }
    try { window.addEventListener('touchend', touchEnd, true); } catch (_) {}
    try { window.addEventListener('touchcancel', touchEnd, true); } catch (_) {}
    try {
      window.addEventListener('blur', function () { clearRt(null, 'blur'); }, true);
      document.addEventListener('visibilitychange', function () {
        try { if (document.hidden) clearRt(null, 'hidden'); } catch (_) {}
      });
    } catch (_) {}
  }

  /* ---------- connected tool arm (no floating cream stump) ---------- */
  function connectToolArm() {
    if (isTp()) return;
    let kind = '';
    try {
      const id = (typeof selId !== 'undefined') ? selId : null;
      if (typeof IT !== 'undefined' && id != null) {
        if (id === IT.TORCH || id === 67) kind = 'torch';
        else if (id === IT.BUCKET || id === IT.WATERB || id === 39 || id === 48) kind = 'bucket';
        else if (id === 761 || id === IT.PCPICK || (IT.PICK && id === IT.PICK) ||
                 (IT.WPICK && id === IT.WPICK) || (IT.SPICK && id === IT.SPICK) ||
                 (IT.IPICK && id === IT.IPICK) || (IT.GPICK && id === IT.GPICK)) kind = 'pick';
      }
      const n = (typeof NAMES !== 'undefined' && id != null && NAMES[id]) ? String(NAMES[id]).toLowerCase() : '';
      if (!kind && /pick/.test(n)) kind = 'pick';
      if (!kind && /torch/.test(n)) kind = 'torch';
      if (!kind && /bucket/.test(n)) kind = 'bucket';
    } catch (_) {}
    if (!kind) return;
    const roots = [];
    try { if (typeof hand !== 'undefined' && hand) roots.push(hand); } catch (_) {}
    try { if (window.__vm && __vm.vs) roots.push(__vm.vs); } catch (_) {}
    for (let i = 0; i < roots.length; i++) {
      const r = roots[i];
      if (!r || !r.traverse) continue;
      try {
        r.traverse(function (arm) {
          const p = arm.userData && arm.userData.p;
          if (!p) return;
          if (p.fo) p.fo.visible = true;
          if (p.h) p.h.visible = true;
          if (p.cuff) {
            p.cuff.visible = true;
            /* Undo a stale sword cuff trim if it was left on a pick/torch/bucket. */
            if (p.cuff.userData && p.cuff.userData._cS0 && kind !== 'sword') {
              const s0 = p.cuff.userData._cS0, p0 = p.cuff.userData._cP0;
              if (s0 && p0) {
                p.cuff.scale.set(s0.x, s0.y, s0.z);
                p.cuff.position.set(p0.x, p0.y, p0.z);
              }
            }
          }
        });
      } catch (e) { ERR('cuff', e); }
    }
  }

  /* ---------- (4) TARDIS mph HUD (flight cap is inlined in fly) ---------- */
  function livePilot() {
    try {
      if (document.body && document.body.classList && document.body.classList.contains('tboxPilot')) return true;
    } catch (_) {}
    try {
      const F = window.__tbox3, T = window.__tbox, S = T && T.S;
      if (F && F.pilot && S && S.on) return true;
    } catch (_) {}
    return false;
  }
  function currentMph() {
    try {
      const A = window.__tbox1260;
      if (A && A.speedMph != null) return A.speedMph;
      if (A && typeof A.speed === 'number') return U.mph(A.speed);
    } catch (_) {}
    try {
      const F = window.__tbox3;
      if (F && F.v) return U.mph(Math.hypot(F.v[0], F.v[1], F.v[2]));
    } catch (_) {}
    return 0;
  }
  function ensureMphHud() {
    let el = document.getElementById('tboxMph');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'tboxMph';
    el.setAttribute('data-testid', 'tardis-speed-mph');
    el.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:85;pointer-events:none;color:#d7ecff;font:600 15px/1.2 system-ui,sans-serif;letter-spacing:.02em;text-shadow:0 1px 4px #000,0 0 8px #052;display:none;';
    try { (document.body || document.documentElement).appendChild(el); } catch (_) {}
    return el;
  }
  function tickMph() {
    try {
      const on = livePilot();
      const el = ensureMphHud();
      if (!el) return;
      if (!on) { el.style.display = 'none'; el.textContent = ''; return; }
      const mph = currentMph();
      el.style.display = 'block';
      const n = Math.max(0, Math.round(mph));
      el.textContent = n.toLocaleString('en-GB') + ' mph';
      U.flyHud = 1;
    } catch (e) { ERR('mph', e); }
  }

  /* Clamp after any fly tick (safety net; the inlined cap runs first). */
  function hookFly() {
    function wrap(obj, key) {
      try {
        if (!obj || typeof obj[key] !== 'function' || obj[key].__fix1273) return;
        const orig = obj[key];
        obj[key] = function (dt) {
          const r = orig.apply(this, arguments);
          try {
            const F = arguments[1] || null;
            /* fly closes over F; after it returns F.v is already applied.
               Still clamp for the next frame if something raced. */
            const hosts = [window.__tbox1264, window.__tbox1260];
            for (let i = 0; i < hosts.length; i++) {
              const H = hosts[i];
              if (!H) continue;
              if (H.speed > MAX_V) {
                /* cannot reach F.v from here if it is not on H */
              }
            }
          } catch (_) {}
          try { tickMph(); } catch (_) {}
          return r;
        };
        obj[key].__fix1273 = 1;
      } catch (e) { ERR('flyw', e); }
    }
    try { wrap(window.__tbox1264, 'fly'); } catch (_) {}
    try { wrap(window.__tbox1260, 'fly'); } catch (_) {}
    try {
      const A = window.__tbox1264;
      if (A) wrap(A, 'fly');
    } catch (_) {}
  }

  /* ---------- boot ---------- */
  function tick() {
    hookMagFix();
    hookMine(bMine());
    hookFly();
    try { repairGuns(); } catch (e) { ERR('rg', e); }
    try { connectToolArm(); } catch (e) { ERR('cta', e); }
    try { tickMph(); } catch (e) { ERR('mh', e); }
  }

  installRt();
  tick();
  try {
    let n = 0;
    const iv = setInterval(function () {
      tick();
      if (++n > 80) clearInterval(iv);
    }, 50);
  } catch (_) {}
  try {
    const loop = function () {
      try { connectToolArm(); tickMph(); repairGuns(); hookMine(bMine()); } catch (_) {}
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  } catch (_) {}
})();
