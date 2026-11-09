/* v1.2.42: adaptive 4K UHD preset.
 * Keeps the 4K UHD label and visual features (materials, prism, lighting), but on
 * weak / mobile / Android devices (and whenever measured FPS dips) scales the
 * effective pixel ratio, shadow size, view distance, AA and particle budget to
 * hold around 50–60 FPS. Steps down quickly, back up slowly. No popup. */
(function adaptive4k1242(W) {
  'use strict';
  const U = W.__adapt4k1242 = W.__adapt4k1242 || {version: '1.2.42', err: null, on: 0};
  const nav = (typeof navigator !== 'undefined') ? navigator : {};
  const ua = String(nav.userAgent || '');
  const cores = +nav.hardwareConcurrency || 0;
  const mem = +nav.deviceMemory || 0;

  const WEAK_GPU = /adreno \(tm\) [1-5]|adreno [1-5]|mali-[234]|mali-t|powervr|apple gpu|intel\(r\) hd|intel\(r\) uhd graphics 6|intel\(r\) iris\(r\) (plus )?6|swiftshader|llvmpipe|microsoft basic render/i;
  const STRONG_GPU = /geforce rtx|radeon rx|quadro|apple m[1-9]|adreno \(tm\) [7-9]|adreno [7-9]|mali-g7|mali-g[89]|xclipse/i;

  U.isAndroid = /Android/i.test(ua);
  U.isMobileUA = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  U.isTouch = !!(W.touchMode || (typeof touchMode !== 'undefined' && touchMode) || ('ontouchstart' in (W || {})) || (W.matchMedia && W.matchMedia('(pointer: coarse)').matches));

  U.gpuString = function () {
    try {
      const r = (typeof renderer !== 'undefined' && renderer) || W.renderer;
      if (!r || !r.getContext) return U._gpu || '';
      const gl = r.getContext();
      if (!gl) return U._gpu || '';
      const ext = gl.getExtension && gl.getExtension('WEBGL_debug_renderer_info');
      const s = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '') : String(gl.getParameter(gl.RENDERER) || '');
      U._gpu = s;
      return s;
    } catch (_) { return U._gpu || ''; }
  };

  // Tiers: full (desktop/strong), balanced (typical phone), light (weak).
  U.pickTier = function (info) {
    info = info || {};
    const android = info.android != null ? !!info.android : U.isAndroid;
    const mobile = info.mobile != null ? !!info.mobile : (U.isMobileUA || U.isTouch);
    const c = info.cores != null ? info.cores : cores;
    const m = info.mem != null ? info.mem : mem;
    const gpu = String(info.gpu != null ? info.gpu : U.gpuString() || '');
    if (STRONG_GPU.test(gpu) && !android) return 'full';
    if (WEAK_GPU.test(gpu) || (android && c && c <= 4) || (m && m <= 2) || (mobile && c && c <= 4 && m && m <= 4)) return 'light';
    if (android || mobile || (c && c <= 6) || (m && m <= 4) || WEAK_GPU.test(gpu)) return 'balanced';
    if (c && c <= 4) return 'balanced';
    return 'full';
  };

  U.TIER = {
    full:     {prMax: 2.5, prMin: 1.0, shadow: 2048, rdist: 8, particles: 1.0, aa: 1},
    balanced: {prMax: 1.35, prMin: 0.85, shadow: 1024, rdist: 6, particles: 0.55, aa: 0},
    light:    {prMax: 1.1, prMin: 0.7, shadow: 512, rdist: 5, particles: 0.35, aa: 0}
  };

  U.capsFor = function (tier) {
    const t = U.TIER[tier] || U.TIER.balanced;
    const dpr = (typeof DPR !== 'undefined' ? DPR : (W.devicePixelRatio || 1)) || 1;
    return {
      tier: tier,
      prMax: Math.min(dpr, t.prMax),
      prMin: Math.min(dpr, t.prMin),
      shadow: t.shadow,
      rdist: t.rdist,
      particles: t.particles,
      aa: t.aa
    };
  };

  function applyCaps(caps, reason) {
    U.caps = caps;
    U.reason = reason || U.reason || '';
    try {
      if (typeof renderer !== 'undefined' && renderer && renderer.setPixelRatio) {
        const cur = renderer.getPixelRatio ? renderer.getPixelRatio() : caps.prMax;
        const next = Math.max(caps.prMin, Math.min(caps.prMax, cur || caps.prMax));
        if (Math.abs(next - cur) > 0.02) {
          renderer.setPixelRatio(next);
          try { if (typeof resize === 'function') resize(); } catch (_) {}
        }
        U.pr = next;
      }
    } catch (e) { if (!U.err) U.err = 'pr ' + e; }
    try {
      if (typeof SET !== 'undefined' && SET && typeof caps.rdist === 'number') {
        // Only pull view distance down, never force it above a player-chosen higher value on strong machines mid-session.
        if (SET.rdist == null || SET.rdist > caps.rdist) SET.rdist = caps.rdist;
      }
    } catch (_) {}
    try {
      if (typeof sunL !== 'undefined' && sunL && sunL.shadow && sunL.shadow.mapSize) {
        const s = caps.shadow;
        if (sunL.shadow.mapSize.x !== s) {
          sunL.shadow.mapSize.set(s, s);
          if (sunL.shadow.map) { try { sunL.shadow.map.dispose(); } catch (_) {} sunL.shadow.map = null; }
        }
      }
    } catch (_) {}
    try { W.__adaptParticles = caps.particles; } catch (_) {}
    try { W.__adaptAA = caps.aa; } catch (_) {}
  }

  U.applyTier = function (tier, reason) {
    U.tier = tier;
    applyCaps(U.capsFor(tier), reason || tier);
    return U.caps;
  };

  // Dynamic scaler: target ~55 FPS. Drop fast, raise slowly. No popup.
  U.ema = 55;
  U.hold = 0;
  U.samples = 0;
  U.tick = function (dt) {
    if (!U.on) return U;
    if (!(dt > 0) || dt > 0.5) return U;
    try {
      if (typeof started !== 'undefined' && !started) return U;
      if (typeof paused !== 'undefined' && paused) return U;
      if (typeof QUALITY !== 'undefined' && QUALITY !== '4k' && !U.force) return U;
    } catch (_) {}
    const fps = 1 / dt;
    U.ema += (fps - U.ema) * Math.min(1, dt * 2.5);
    U.samples++;
    if (U.hold > 0) { U.hold--; return U; }
    const caps = U.caps || U.capsFor(U.tier || 'balanced');
    let pr = (typeof renderer !== 'undefined' && renderer.getPixelRatio) ? renderer.getPixelRatio() : caps.prMax;
    let next = pr;
    // Step down quickly when under ~50 FPS.
    if (U.ema < 48 || fps < 40) {
      next = Math.max(caps.prMin, pr * 0.82);
      U.hold = 2;
      // Also tighten view distance one step if still struggling after a few samples.
      if (U.ema < 42 && typeof SET !== 'undefined' && SET && SET.rdist > Math.max(3, caps.rdist - 2)) {
        try { SET.rdist = Math.max(3, SET.rdist - 1); } catch (_) {}
      }
    } else if (U.ema > 58 && fps > 55 && U.samples > 90) {
      // Raise slowly only with sustained headroom.
      next = Math.min(caps.prMax, pr * 1.04);
      U.hold = 8;
    }
    if (Math.abs(next - pr) > 0.02) {
      try {
        renderer.setPixelRatio(next);
        if (typeof resize === 'function') resize();
        U.pr = next;
        U.history = U.history || [];
        U.history.push(+next.toFixed(2));
        if (U.history.length > 24) U.history.shift();
      } catch (e) { if (!U.err) U.err = 'tick ' + e; }
    }
    return U;
  };

  U.install = function () {
    if (U.hooked) return U;
    U.hooked = 1;
    try {
      const high = (typeof HIGH !== 'undefined') ? HIGH : (typeof QUALITY !== 'undefined' && QUALITY === '4k');
      if (!high && !U.force) { U.on = 0; U.tier = 'full'; return U; }
      U.on = 1;
      // Initial tier from UA / memory / cores; refine with GPU string once available.
      let tier = U.pickTier();
      try { const g = U.gpuString(); if (g) tier = U.pickTier({gpu: g}); } catch (_) {}
      U.applyTier(tier, 'boot');
      // Disable legacy phone-only dynres fighting us when we own HIGH scaling.
      try { if (tier !== 'full') W.__noDynRes = 1; } catch (_) {}
    } catch (e) { U.err = 'install ' + e; }
    try {
      const hook = (fn) => {
        if (typeof fn !== 'function' || fn.__adapt4k) return fn;
        const wrap = function (dt) {
          const r = fn.apply(this, arguments);
          try { U.tick(typeof dt === 'number' ? dt : 0.016); } catch (_) {}
          return r;
        };
        wrap.__adapt4k = 1;
        return wrap;
      };
      if (typeof updateLights === 'function') updateLights = hook(updateLights);
      else if (typeof updatePlayer === 'function') updatePlayer = hook(updatePlayer);
    } catch (e) { if (!U.err) U.err = 'hook ' + e; }
    return U;
  };

  try { U.install(); } catch (e) { U.err = 'boot ' + e; }
})(typeof window !== 'undefined' ? window : this);
