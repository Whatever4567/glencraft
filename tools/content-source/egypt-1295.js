/* GLX-EG1295 (v1.2.96): Egypt / sand-realm fixes.
   1. The player's UFO / alien paintings (c268 user_p1-6 and c239 hall murals)
      hang in the Egypt land pyramid again. They were hidden whenever DIM.cur
      was set, which hid them the moment Egypt became its own dimension.
   2. The Agartha saucer (c304) leaves at night for the sand realm, patrols
      over the Egypt pyramid, and never appears in the Glencraft overworld.
   3. Egyptians (c240 hall folk and c259 village folk) only spawn and stay
      visible in the sand realm.
   4. Egypt land gets its own desert sky and matching fog (day, dusk/dawn,
      night with stars). Glencraft, Agartha and space skies are unchanged.
   Cheap WebGL1 uniforms-only tint of the existing sky dome. No geometry is
   deleted. First-person hands, the gold D-pad, and overworld worldgen are
   left alone. */
(function egypt1295(WIN) {
  const U = window.__eg1295 = {
    version: '1.2.96-egypt', err: null, skyOn: 0, evicted: 0, ufoDrop: 0,
    hook: 0, painted: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 280); };
  const NAME = 'egypt';
  const inEgypt = () => { try { return !!(typeof DIM !== 'undefined' && DIM && DIM.cur === NAME); } catch (_) { return false; } };
  const dimNow = () => { try { return (typeof DIM !== 'undefined' && DIM && DIM.cur) || null; } catch (_) { return null; } };
  const inAgartha = () => {
    try {
      if (typeof DIM !== 'undefined' && DIM && DIM.cur === 'agartha') return true;
      if (window.__c295 && __c295.inside) return true;
      const a = window.__agw;
      const b = a && a.ok && Array.isArray(a.box) ? a.box : null;
      if (!b || typeof P === 'undefined' || !P) return false;
      return P.x >= b[0] - 2 && P.x <= b[3] + 2 && P.y >= b[1] - 2 && P.y <= b[4] + 2 && P.z >= b[2] - 2 && P.z <= b[5] + 2;
    } catch (_) { return false; }
  };
  const onGlenSurface = () => { try { return !inEgypt() && !inAgartha() && !dimNow(); } catch (_) { return false; } };

  // Deterministic Egypt-pyramid record (centre of the 256-wide Egypt land).
  // Used by the saucer when the player has not visited Egypt yet.
  function defaultPyr() {
    const SEA0 = (typeof SEA === 'number') ? SEA : 32;
    const cx = 128, cz = 128, G = SEA0 + 3;
    return {
      cx: cx - 8, cy: G + 8, cz: cz, hy: G + 4,
      fx: 1, fz: 0, rx: 0, rz: 1,
      L: (u, v) => [cx + u, cz + v]
    };
  }
  function egyptPyr() {
    try {
      const e = window.__egypt1269 && window.__egypt1269.pyr;
      if (e && e.cx != null) {
        if (!e.L) e.L = (u, v) => [e.cx + u * (e.fx || 1) + v * (e.rx || 0), e.cz + u * (e.fz || 0) + v * (e.rz || 1)];
        return e;
      }
    } catch (_) {}
    return defaultPyr();
  }
  window.__egPyr = egyptPyr;
  U.pyr = egyptPyr;
  U.inEgypt = inEgypt;
  U.inAgartha = inAgartha;
  U.onGlenSurface = onGlenSurface;

  // ---- desert sky (uniforms + fog only; existing WebGL1 sky dome / NSKY) ----
  // Palette is also exposed so tests and the sheet can read it without a frame.
  function desertSky(clock) {
    const CYCLE0 = (typeof CYCLE === 'number' && CYCLE > 0) ? CYCLE : 720;
    const p = (typeof clock === 'number') ? clock : ((typeof dayClock === 'number') ? dayClock / CYCLE0 : 0.25);
    const ang = p * Math.PI * 2;
    const sh = Math.sin(ang) + 0.2;
    const day = (typeof clock !== 'number' && typeof daylight === 'number')
      ? daylight
      : Math.max(0, Math.min(1, (sh + 0.12) / 0.45));
    const dusk = Math.max(0, 1 - Math.abs(sh - 0.05) * 5);
    const night = 1 - day;
    // Day: deep clear blue overhead, pale hazy warm sand horizon, hot sun.
    const dayTop = [0.12, 0.38, 0.78], dayHor = [0.91, 0.82, 0.62], dayFog = [0.86, 0.77, 0.58];
    // Sunset / sunrise: orange and pink.
    const duskTop = [0.78, 0.32, 0.28], duskHor = [0.98, 0.62, 0.42], duskFog = [0.90, 0.52, 0.40];
    const duskPink = [0.95, 0.48, 0.62];
    // Night: dark clear sky, lots of stars.
    const nightTop = [0.02, 0.04, 0.10], nightHor = [0.10, 0.13, 0.22], nightFog = [0.07, 0.09, 0.14];
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    let top = lerp(nightTop, dayTop, day);
    let hor = lerp(nightHor, dayHor, day);
    let fog = lerp(nightFog, dayFog, day);
    if (dusk > 0.02) {
      const k = dusk * (0.45 + 0.55 * (1 - day));
      top = lerp(top, duskTop, k);
      hor = lerp(hor, lerp(duskHor, duskPink, 0.35), k);
      fog = lerp(fog, duskFog, k);
    }
    // Slight heat-haze / dust veil in the day, cheap and stable.
    const dust = 0.14 * day * (1 - dusk * 0.4);
    hor = lerp(hor, [0.93, 0.80, 0.55], dust);
    fog = lerp(fog, [0.90, 0.76, 0.52], dust * 0.8);
    const sunK = Math.max(0, day * 1.15 + dusk * 0.55);
    const sunCol = dusk > 0.2 ? [1, 0.78, 0.45] : [1, 0.95, 0.72];
    const hemi = lerp([0.45, 0.52, 0.70], [1, 0.96, 0.86], day);
    const ground = lerp([0.22, 0.16, 0.12], [0.78, 0.60, 0.36], day);
    const starsK = Math.max(0, night * 1.35 - 0.08);
    const fogNear = 36 + 10 * day;
    const fogFar = (typeof PERF !== 'undefined' && PERF) ? 130 + 20 * day : 170 + 50 * day;
    return { day, dusk, night, sh, top, hor, fog, sunK, sunCol, hemi, ground, starsK, fogNear, fogFar, dust };
  }
  U.desertSky = desertSky;

  function applyDesertSky() {
    if (!inEgypt()) return false;
    const pal = desertSky();
    U.sky = pal;
    U.skyOn++;
    try {
      if (typeof skyUniforms !== 'undefined' && skyUniforms) {
        if (skyUniforms.top && skyUniforms.top.value) skyUniforms.top.value.setRGB(pal.top[0], pal.top[1], pal.top[2]);
        if (skyUniforms.hor && skyUniforms.hor.value) skyUniforms.hor.value.setRGB(pal.hor[0], pal.hor[1], pal.hor[2]);
        if (skyUniforms.sunCol && skyUniforms.sunCol.value && pal.day + pal.dusk > 0.05) {
          skyUniforms.sunCol.value.setRGB(pal.sunCol[0], pal.sunCol[1], pal.sunCol[2]);
        }
        if (skyUniforms.sunK) skyUniforms.sunK.value = Math.max(skyUniforms.sunK.value || 0, pal.sunK);
      }
    } catch (e) { ERR('skyu', e); }
    try {
      if (typeof scene !== 'undefined' && scene) {
        if (scene.fog && scene.fog.color) {
          scene.fog.color.setRGB(pal.fog[0], pal.fog[1], pal.fog[2]);
          scene.fog.near = pal.fogNear;
          scene.fog.far = pal.fogFar;
        }
        if (scene.background && scene.background.setRGB) scene.background.setRGB(pal.fog[0], pal.fog[1], pal.fog[2]);
      }
    } catch (e) { ERR('fog', e); }
    try {
      if (typeof hemi !== 'undefined' && hemi) {
        hemi.color.setRGB(pal.hemi[0], pal.hemi[1], pal.hemi[2]);
        if (hemi.groundColor) hemi.groundColor.setRGB(pal.ground[0], pal.ground[1], pal.ground[2]);
        hemi.intensity = Math.max(hemi.intensity || 0, 0.55 + 0.4 * pal.day);
      }
      if (typeof sunL !== 'undefined' && sunL) {
        if (pal.day + pal.dusk > 0.08) {
          sunL.color.setRGB(pal.sunCol[0], pal.sunCol[1], pal.sunCol[2]);
          sunL.intensity = Math.max(sunL.intensity || 0, 0.55 + 0.55 * pal.day + 0.25 * pal.dusk);
        }
      }
    } catch (e) { ERR('lit', e); }
    try {
      if (typeof stars !== 'undefined' && stars && stars.material) {
        stars.material.opacity = Math.max(stars.material.opacity || 0, pal.starsK);
        stars.visible = pal.starsK > 0.02;
      }
      if (window.__nsky && window.__nsky.dome) {
        const d = window.__nsky.dome;
        if (pal.starsK > 0.02) {
          d.visible = true;
          try { if (d.material && d.material.uniforms && d.material.uniforms.uK) d.material.uniforms.uK.value = Math.max(d.material.uniforms.uK.value || 0, pal.starsK); } catch (_) {}
        }
      }
    } catch (e) { ERR('stars', e); }
    return true;
  }
  U.applyDesertSky = applyDesertSky;

  // ---- keep decorative folk out of Glencraft ----
  function evictEgyptians() {
    if (inEgypt()) return 0;
    let n = 0;
    const lists = [];
    try { if (window.__c240 && Array.isArray(__c240.folk)) lists.push(__c240.folk); } catch (_) {}
    try { if (window.__c259 && typeof __c259.out === 'function') { const r = __c259.out(); if (Array.isArray(r)) lists.push(r); } } catch (_) {}
    try { if (window.__c259 && typeof __c259.all === 'function') { const r = __c259.all(); if (Array.isArray(r)) lists.push(r); } } catch (_) {}
    try {
      const seen = new Set();
      for (const list of lists) {
        for (let i = 0; i < list.length; i++) {
          const f = list[i];
          if (!f || seen.has(f)) continue;
          seen.add(f);
          try {
            if (f.g) {
              f.g.visible = false;
              if (f.g.parent && typeof f.g.parent.remove === 'function') { f.g.parent.remove(f.g); }
              n++;
            }
          } catch (_) {}
        }
      }
      try { if (window.__c240 && Array.isArray(__c240.folk)) __c240.folk.length = 0; } catch (_) {}
      try { if (window.__c259 && typeof __c259.out === 'function') { const r = __c259.out(); if (Array.isArray(r)) r.length = 0; } } catch (_) {}
    } catch (e) { ERR('evict', e); }
    try {
      if (typeof mobs !== 'undefined' && Array.isArray(mobs)) {
        for (let i = mobs.length - 1; i >= 0; i--) {
          const a = mobs[i];
          if (a && (a.kind === 'egyptian' || a.kind === 'egypt' || a.type === 'egyptian' || a.egypt)) {
            try { if (typeof removeMob === 'function') removeMob(a); else if (a.g && a.g.parent) a.g.parent.remove(a.g); } catch (_) {}
            n++;
          }
        }
      }
    } catch (e) { ERR('evictm', e); }
    if (n) U.evicted += n;
    return n;
  }
  U.evictEgyptians = evictEgyptians;

  // The Agartha saucer must never be drawn on the Glencraft surface.
  function hideUfoOnSurface() {
    if (!onGlenSurface()) return false;
    try {
      const c = window.__c246;
      if (c && typeof c.ufo === 'function') {
        const u = c.ufo();
        if (u) {
          try { if (typeof c.drop === 'function') c.drop(); } catch (_) {}
          try { if (u.g) u.g.visible = false; } catch (_) {}
          U.ufoDrop++;
          return true;
        }
      }
    } catch (e) { ERR('ufodrop', e); }
    return false;
  }
  U.hideUfoOnSurface = hideUfoOnSurface;

  // Where the c304 saucer is allowed to be shown.
  function ufoHereTag() {
    if (inEgypt()) return 'egypt';
    if (inAgartha()) return 'ag';
    return null;
  }
  U.ufoHereTag = ufoHereTag;

  function hookSky() {
    if (U.hook) return;
    try {
      if (typeof updateSky !== 'function') return;
      const us = updateSky;
      updateSky = function (dt) {
        const r = us.apply(this, arguments);
        try {
          if (inEgypt()) applyDesertSky();
          evictEgyptians();
          hideUfoOnSurface();
        } catch (e) { ERR('tick', e); }
        return r;
      };
      U.hook = 1;
    } catch (e) { ERR('hook', e); }
  }

  function boot() {
    hookSky();
    try { evictEgyptians(); } catch (_) {}
    try { hideUfoOnSurface(); } catch (_) {}
  }
  U.boot = boot;
  hookSky();
  setTimeout(boot, 200);
  setTimeout(boot, 1200);
  setInterval(() => { try { evictEgyptians(); hideUfoOnSurface(); if (inEgypt()) applyDesertSky(); } catch (e) { ERR('iv', e); } }, 800);
})(typeof window !== 'undefined' ? window : this);
