/* GLX-V126X-ALBUM: Glencraft Original Soundtrack (Album mode).
   Per-context playlists, shuffle-bag rotation, Minecraft-like silence gaps,
   lazy-loaded Ogg Vorbis with an MP3 fallback. Does not replace Classic,
   Calm, or the Happy Hardcore remix. */
(function v126xAlbum() {
  const U = window.__v126x = window.__v126x || { err: null, ctx: '', track: null, gap: 0, mode: 'album' };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  const SRC = 'music/album/';
  const SRC_Q = '?v=1.2.54';
  // Batches 1–2. Later batches append; fallbacks remain for unfilled contexts.
  const POOLS = U.POOLS = {
    menu: ['the_glen_opens'],
    day: ['heather_road', 'drove_road'],
    night: ['watcher_on_the_ridge', 'peat_fire'],
    loch: ['still_water'],
    volcano: ['ash_line'],
    blue: ['blue_vault'],
    purple: ['purple_chamber'],
    agartha: ['choir_of_the_hollow'],
    moon: ['silver_sea'],
    mars: ['red_horizon'],
    space: ['between_worlds'],
    cave1: ['blue_vault'],
    hell: ['ash_line'],
    snow: ['white_pass'],
    desert: ['long_sand'],
    underwater: ['down_among_the_reeds'],
    creative: ['heather_road', 'drove_road'],
    combat: ['ash_line'],
    popstar: ['the_glen_opens'],
    credits: ['the_glen_opens']
  };
  const FALLBACK = {
    purple: 'blue', cave1: 'blue', hell: 'volcano',
    mars: 'moon', space: 'moon',
    snow: 'night', desert: 'day', underwater: 'loch',
    creative: 'day', combat: 'volcano', popstar: 'day', credits: 'menu',
    loch: 'day', volcano: 'day', high: 'day', pine: 'day', moor: 'day'
  };
  const GAP = {
    menu: [4, 12],
    credits: [3, 8],
    blue: [70, 180], purple: [70, 180], agartha: [70, 180], cave1: [70, 180],
    moon: [60, 160], mars: [60, 160], space: [60, 160],
    combat: [8, 20],
    default: [50, 160]
  };

  let el = null, wanted = false, curId = null, curCtx = '', bag = {}, gapUntil = 0;

  function masterVol() {
    try { return Math.max(0, Math.min(1, SET && SET.music != null ? SET.music : 0.7)); } catch (_) { return 0.7; }
  }
  function albumVol() { return Math.max(0, Math.min(1, masterVol() * 0.78)); }

  function poolFor(ctx) {
    let c = ctx, guard = 0;
    while (c && (!POOLS[c] || !POOLS[c].length) && FALLBACK[c] && guard++ < 8) c = FALLBACK[c];
    return (POOLS[c] && POOLS[c].length) ? { ctx: c, ids: POOLS[c].slice() } : { ctx: 'day', ids: (POOLS.day || []).slice() };
  }

  function detectContext() {
    try {
      if (typeof started !== 'undefined' && !started) return 'menu';
      if (typeof DIM !== 'undefined' && DIM && DIM.cur) {
        if (DIM.cur === 'moon') return 'moon';
        if (DIM.cur === 'mars') return 'mars';
        if (DIM.cur === 'agartha') return 'agartha';
        if (DIM.cur === 'hell') return 'hell';
      }
      try { if (window.__vac && __vac()) return 'space'; } catch (_) {}
      // underwater: head in water
      try {
        if (typeof getB === 'function' && typeof P !== 'undefined' && typeof T !== 'undefined') {
          const b = getB(Math.floor(P.x), Math.floor((P.y || 0) + 0.4), Math.floor(P.z));
          if (b === T.WATER || (T.STILL_WATER != null && b === T.STILL_WATER)) return 'underwater';
        }
      } catch (_) {}
      // cave / crystal layers reuse the existing mood detector
      try {
        const mood = window.__v1248 && __v1248.detectMood && __v1248.detectMood();
        if (mood === 'blue' || mood === 'purple' || mood === 'agartha' || mood === 'hell' || mood === 'cave1') return mood;
      } catch (_) {}
      // volcano: near the active crater
      try {
        const at = window.__c229 && __c229.at;
        if (at && typeof P !== 'undefined') {
          const d = Math.hypot(P.x - at[0], P.z - at[2]);
          const r = (at[3] || 20) + 28;
          if (d < r) return 'volcano';
        }
      } catch (_) {}
      // desert
      try { if (window.__c243 && __c243.isDesert && __c243.isDesert()) return 'desert'; } catch (_) {}
      // snow underfoot
      try {
        if (typeof getB === 'function' && typeof P !== 'undefined' && typeof T !== 'undefined') {
          const y = Math.floor((P.y || 0) - 0.6);
          const b = getB(Math.floor(P.x), y, Math.floor(P.z));
          if (b === T.SNOW || b === T.PACKSNOW || b === T.ICE) return 'snow';
        }
      } catch (_) {}
      // loch / highlands
      try {
        if (typeof biomeAt === 'function' && typeof P !== 'undefined') {
          const bio = biomeAt(P.x, P.z);
          if (bio === 'loch') return 'loch';
        }
      } catch (_) {}
      try {
        if (typeof isNight !== 'undefined' && isNight) return 'night';
      } catch (_) {}
      try {
        if (typeof MODE !== 'undefined' && MODE && MODE.name === 'creative') return 'creative';
      } catch (_) {}
      return 'day';
    } catch (e) { ERR('ctx', e); return 'day'; }
  }
  U.detectContext = detectContext;

  function ensureEl() {
    if (el) return el;
    el = new Audio();
    el.preload = 'auto';
    el.addEventListener('ended', () => {
      const ctx = curCtx || 'day';
      const g = GAP[ctx] || GAP.default;
      gapUntil = performance.now() + (g[0] + Math.random() * (g[1] - g[0])) * 1000;
      wanted = false; curId = null; U.track = null; U.gap = 1;
    });
    el.addEventListener('error', () => {
      if (el && el.src && el.src.indexOf('.ogg') >= 0 && curId) {
        try { el.src = SRC + curId + '.mp3' + SRC_Q; el.load(); const p = el.play(); if (p && p.catch) p.catch(() => {}); return; } catch (_) {}
      }
      gapUntil = performance.now() + 8000;
      wanted = false; curId = null;
    });
    return el;
  }

  function playId(id) {
    const a = ensureEl();
    const ogg = SRC + id + '.ogg' + SRC_Q;
    curId = id; wanted = true; U.track = id; U.gap = 0;
    a.volume = albumVol();
    // Prefer Ogg; the error handler falls back to MP3.
    if (a.src.indexOf(ogg) < 0 && a.src.indexOf(id + '.mp3') < 0) {
      a.src = ogg; a.load();
    } else {
      try { a.currentTime = 0; } catch (_) {}
    }
    const p = a.play(); if (p && p.catch) p.catch(() => {});
  }

  function pick(ctx) {
    const { ctx: c, ids } = poolFor(ctx);
    if (!bag[c] || !bag[c].length) {
      bag[c] = ids.filter(id => id !== curId);
      if (!bag[c].length) bag[c] = ids.slice();
    }
    const i = (Math.random() * bag[c].length) | 0;
    const id = bag[c].splice(i, 1)[0] || ids[0];
    return id;
  }

  function stop() {
    wanted = false; curId = null; U.track = null;
    if (el) try { el.pause(); } catch (_) {}
  }
  function pause() {
    if (el) try { el.pause(); } catch (_) {}
  }
  U.stop = stop;
  U.pause = pause;

  function samePool(ctxA, ctxB) {
    const a = poolFor(ctxA).ids.join(',');
    const b = poolFor(ctxB).ids.join(',');
    return a === b;
  }

  function tick() {
    const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const vol = hidden ? 0 : albumVol();
    const a = ensureEl();
    a.volume = vol;
    if (hidden || vol < 0.01) { try { a.pause(); } catch (_) {} return; }

    const ctx = detectContext();
    U.ctx = ctx;
    const now = performance.now();

    const playing = wanted && a && !a.paused && !a.ended;
    if (playing) {
      // Context change: only retarget if the new pool would not already include this track
      if (curCtx && !samePool(ctx, curCtx)) {
        try { a.pause(); } catch (_) {}
        wanted = false; curId = null; U.track = null;
        gapUntil = now + 1200; // short cross-gap, then the new place
        curCtx = ctx;
        return;
      }
      return;
    }

    if (!gapUntil) gapUntil = now + (ctx === 'menu' ? 400 : 1500);
    if (now < gapUntil) return;

    curCtx = ctx;
    const id = pick(ctx);
    if (!id) { gapUntil = now + 8000; return; }
    playId(id);
    gapUntil = now + 4000; // debounce
  }
  U.tick = tick;
})();
