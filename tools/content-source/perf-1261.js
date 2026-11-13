/* GLX-PERF1261 (v1.2.61): Make the Render distance setting actually cap the
   work. Chunks past the setting are not meshed and already-meshed ones are
   unloaded; fog, the camera far plane and the shadow camera stay inside that
   range. A later "see further the higher you are" wrap had been growing the
   stream radius up to 200–700 blocks and ignoring the slider. On phones the
   default is 4 chunks when the player has never chosen one. Also drop the
   per-frame whole-DOM scan that 1.2.60 ran on every render (blue-overlay
   cleanup), which is a big part of the lag on Android Chrome. */
(function perf1261() {
  const U = window.__perf1261 = { err: null, cap: 0, unl: 0, frames: 0 };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 240); };
  const isTouch = () => {
    try { if (typeof touchMode !== 'undefined' && touchMode) return true; } catch (_) {}
    try { return !!(window.matchMedia && matchMedia('(pointer: coarse)').matches); } catch (_) { return false; }
  };
  const rdist = () => {
    let n = 8;
    try {
      if (typeof SET !== 'undefined' && typeof SET.rdist === 'number') n = SET.rdist;
      else n = isTouch() ? 4 : 8;
    } catch (_) { n = 8; }
    return Math.max(3, Math.min(16, n));
  };
  /* UI unit is "chunks" of 16 blocks (the slider), even though CH is 26. */
  const vfBlocks = () => rdist() * 16;
  const capChunks = () => {
    const ch = (typeof CH === 'number' && CH > 0) ? CH : 26;
    return vfBlocks() / ch + 0.5;
  };
  U.rdist = rdist;
  U.vfBlocks = vfBlocks;
  U.capChunks = capChunks;

  /* ---- stream radius: LAST wrap, the setting is the cap, never a floor that grows ---- */
  try {
    streamRadius = function () { U.cap = capChunks(); return U.cap; };
  } catch (e) { ERR('sr', e); }

  /* ---- unload anything past the cap; call rebuild so the existing streamer drops them ---- */
  function evict() {
    try {
      if (typeof chunkObjs === 'undefined' || !chunkObjs || typeof rebuild !== 'function') return 0;
      if (typeof started !== 'undefined' && !started) return 0;
      const R = capChunks(), ch = (typeof CH === 'number' && CH > 0) ? CH : 26;
      const pcx = (typeof P !== 'undefined' && P ? P.x / ch : 0) - 0.5;
      const pcz = (typeof P !== 'undefined' && P ? P.z / ch : 0) - 0.5;
      const dist = id => Math.max(Math.abs(Math.floor(id / 64) - pcx), Math.abs(id % 64 - pcz));
      let n = 0;
      for (const id of [...chunkObjs.keys()]) {
        if (dist(id) > R + 1.6) {
          const g = chunkObjs.get(id);
          if (!g) continue;
          try { if (typeof blockGroup !== 'undefined') blockGroup.remove(g); } catch (_) {}
          try { g.children.forEach(c => { if (c.isInstancedMesh) c.dispose(); else if (c.geometry) c.geometry.dispose(); }); } catch (_) {}
          chunkObjs.delete(id);
          try { chunkLists.delete(id); } catch (_) {}
          try { dirtyCh.add(id); } catch (_) {}
          n++;
        }
      }
      U.unl += n;
      if (n && typeof rebuild === 'function') {
        try { rebuild._unloaded = true; rebuild(4); } catch (_) {}
      }
      U.chunks = chunkObjs.size;
      U.R = R;
      return n;
    } catch (e) { ERR('evict', e); return 0; }
  }
  U.evict = evict;

  /* ---- fog + camera.far never exceed the setting (after every earlier wrap) ---- */
  try {
    if (typeof updateSky === 'function' && !updateSky._p1261) {
      const us = updateSky;
      updateSky = function () {
        const r = us.apply(this, arguments);
        try {
          if (typeof DIM !== 'undefined' && DIM.cur) return r;
          if (!scene || !scene.fog) return r;
          const vf = vfBlocks();
          const far = Math.min(scene.fog.far, Math.max(12, vf - 4));
          if (scene.fog.far > far) scene.fog.far = far;
          if (scene.fog.near > far * 0.55) scene.fog.near = far * 0.45;
          if (typeof camera !== 'undefined' && camera && camera.isPerspectiveCamera) {
            const want = vf + 40;
            /* do not let the far plane grow past the setting; c75 scales the sky to camera.far */
            if (camera.far > want + 2 || Math.abs(camera.far - want) > 8) {
              camera.far = want;
              camera.updateProjectionMatrix();
            }
          }
        } catch (e) { ERR('sky', e); }
        return r;
      };
      updateSky._p1261 = 1;
      window.updateSky = updateSky;
    }
  } catch (e) { ERR('usw', e); }

  /* ---- shadow camera range stays inside the view distance ---- */
  function capShadow() {
    try {
      const vf = vfBlocks();
      const lights = [];
      if (typeof sunL !== 'undefined' && sunL) lights.push(sunL);
      if (typeof sunLight !== 'undefined' && sunLight) lights.push(sunLight);
      if (typeof scene !== 'undefined' && scene) scene.traverse(o => { if (o && o.isDirectionalLight && o.shadow) lights.push(o); });
      const seen = new Set();
      for (const L of lights) {
        if (!L || !L.shadow || !L.shadow.camera || seen.has(L)) continue;
        seen.add(L);
        const c = L.shadow.camera;
        const r = Math.min(34, Math.max(14, vf * 0.4));
        if (c.isOrthographicCamera) {
          if (c.right > r + 1) {
            c.left = -r; c.right = r; c.top = r; c.bottom = -r;
          }
        }
        const farMax = Math.max(80, vf + 40);
        if (c.far > farMax) c.far = farMax;
        try { c.updateProjectionMatrix(); } catch (_) {}
      }
    } catch (e) { ERR('sh', e); }
  }
  U.capShadow = capShadow;
  try { capShadow(); } catch (_) {}

  /* ---- 1260 onBeforeRender: do not scan every div every frame ---- */
  try {
    if (typeof scene !== 'undefined' && scene && !scene._p1261hook) {
      const prev = scene.onBeforeRender;
      scene.onBeforeRender = function (r, s, c) {
        const proto = Document.prototype.querySelectorAll;
        /* 1260 killBlueCut does document.querySelectorAll('div') every frame.
           Allow the real cleanup on C2.go; skip the all-div scan during render. */
        Document.prototype.querySelectorAll = function (sel) {
          if (sel === 'div') {
            U.skippedQs = (U.skippedQs || 0) + 1;
            return proto.call(this, 'body:not(body)');
          }
          return proto.call(this, sel);
        };
        try { if (prev) return prev.apply(this, arguments); }
        finally { Document.prototype.querySelectorAll = proto; }
      };
      scene._p1261hook = 1;
    }
  } catch (e) { ERR('rb', e); }

  /* ---- keep the cap applied: evict on an easy interval, and when the slider moves ---- */
  try {
    const setHook = () => {
      try {
        const rg = document.getElementById('rdRange');
        const plus = document.getElementById('rdPlus');
        const minus = document.getElementById('rdMinus');
        const hook = el => {
          if (!el || el._p1261) return;
          el._p1261 = 1;
          el.addEventListener('input', () => { try { evict(); capShadow(); } catch (_) {} });
          el.addEventListener('click', () => { try { evict(); capShadow(); } catch (_) {} });
        };
        hook(rg); hook(plus); hook(minus);
        return !!(rg || plus);
      } catch (e) { ERR('ui', e); return true; }
    };
    let t = 0; const iv = setInterval(() => { if (setHook() || ++t > 40) clearInterval(iv); }, 400);
  } catch (e) { ERR('sethook', e); }

  setInterval(() => { try { evict(); } catch (e) { ERR('ev', e); } }, 1500);
  setTimeout(() => { try { evict(); capShadow(); } catch (_) {} }, 800);
  setTimeout(() => { try { evict(); capShadow(); } catch (_) {} }, 2500);

  /* wrap rebuild so a dirty-all never meshes past the cap (the 1.2.43 streamer
     already filters, but the cap is applied here too if a later wrap grew R) */
  try {
    if (typeof rebuild === 'function' && !rebuild._p1261) {
      const rb = rebuild;
      rebuild = function (budget) {
        try { streamRadius = function () { return capChunks(); }; } catch (_) {}
        const r = rb.apply(this, arguments);
        return r;
      };
      rebuild._p1261 = 1;
      window.rebuild = rebuild;
    }
  } catch (e) { ERR('rbw', e); }
})();
