/* GLX-V126X-ALBUM: Glencraft Original Soundtrack (Album mode).
   Per-context playlists, shuffle-bag rotation, Minecraft-like silence gaps,
   lazy-loaded Ogg Vorbis with an MP3 fallback. Does not replace Classic,
   Calm, or the Happy Hardcore remix. */
(function v126xAlbum() {
  const U = window.__v126x = window.__v126x || { err: null, ctx: '', track: null, gap: 0, mode: 'album' };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  const SRC = 'music/album/';
  const SRC_Q = '?v=1.2.54';
  // Batches 1–5. Bounce sides live in their own pool so they do not land in pastoral day/night rotation.
  const POOLS = U.POOLS = {
    menu: ['the_glen_opens'],
    day: ['heather_road', 'drove_road', 'pine_shelter', 'midday_glen', 'bothy_smoke'],
    night: ['watcher_on_the_ridge', 'peat_fire', 'owl_hour', 'northern_quiet'],
    loch: ['still_water'],
    volcano: ['ash_line'],
    blue: ['blue_vault'],
    purple: ['purple_chamber'],
    agartha: ['choir_of_the_hollow', 'inner_sun', 'stone_memory'],
    moor: ['moor_light'],
    high: ['ridge_wind'],
    pine: ['pine_shelter'],
    moon: ['silver_sea'],
    mars: ['red_horizon'],
    space: ['between_worlds'],
    cave1: ['blue_vault'],
    hell: ['below_the_map'],
    snow: ['white_pass'],
    desert: ['long_sand'],
    underwater: ['down_among_the_reeds'],
    creative: ['open_sketch'],
    combat: ['claymore'],
    crystal: ['crystal_hunt'],
    boss: ['boss_of_the_glen'],
    popstar: ['starlight_show'],
    credits: ['last_light'],
    bounce: ['bounce_the_glen', 'nightcore_loch', 'cairn_flash', 'till_the_hills']
  };
  const FALLBACK = {
    purple: 'blue', cave1: 'blue', hell: 'volcano',
    mars: 'moon', space: 'moon',
    snow: 'night', desert: 'day', underwater: 'loch',
    creative: 'day', combat: 'volcano', crystal: 'combat', boss: 'combat',
    popstar: 'day', credits: 'menu', bounce: 'day',
    loch: 'day', volcano: 'day', high: 'day', pine: 'day', moor: 'day'
  };
  const GAP = {
    menu: [4, 12],
    credits: [3, 8],
    blue: [70, 180], purple: [70, 180], agartha: [70, 180], cave1: [70, 180],
    moon: [60, 160], mars: [60, 160], space: [60, 160],
    combat: [8, 20],
    crystal: [8, 20],
    boss: [6, 14],
    popstar: [10, 24],
    bounce: [8, 20],
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

  function creditsOpen() {
    try {
      if (window.__creditsOpen || U.creditsOpen) return true;
      if (typeof location !== 'undefined' && /(?:^|#|&)credits\b/i.test(String(location.hash || ''))) return true;
      const elc = (typeof document !== 'undefined') && (
        document.getElementById('glxCredits') ||
        document.getElementById('creditsRoll') ||
        document.querySelector('[data-screen="credits"]')
      );
      if (elc) {
        const st = (typeof getComputedStyle === 'function') ? getComputedStyle(elc) : null;
        if (elc.offsetParent !== null && (!st || (st.display !== 'none' && st.visibility !== 'hidden'))) return true;
      }
    } catch (_) {}
    return false;
  }

  function isHostileActor(a) {
    if (!a || a.kind === 'popstar') return false;
    try { if (window.__v1248 && __v1248.isHostileMob && __v1248.isHostileMob(a)) return true; } catch (_) {}
    return !!(a.hostile || a.kind === 'nspider' || a.kind === 'spider' || a.kind === 'zombie'
      || a.kind === 'skeleton' || a.kind === 'blackskel' || a.kind === 'creeper'
      || a.kind === 'blazeskel' || a.kind === 'guardian');
  }

  function nearBoss() {
    try {
      if (typeof mobs === 'undefined' || !mobs || typeof P === 'undefined') return false;
      for (let i = 0; i < mobs.length; i++) {
        const m = mobs[i];
        if (!m || m.kind === 'popstar') continue;
        // Ember Wyrm is kind === 'dragon' with boss: true. Some adds store a parent on .boss.
        const isBoss = (m.kind === 'dragon' || m.boss === true);
        if (!isBoss || !m.g || !m.g.position) continue;
        const d = Math.hypot(m.g.position.x - P.x, m.g.position.z - P.z);
        if (d < 56) return true;
      }
    } catch (_) {}
    return false;
  }

  function crystalMood() {
    try {
      const mood = window.__v1248 && __v1248.detectMood && __v1248.detectMood();
      if (mood === 'blue' || mood === 'purple' || mood === 'cave1' || mood === 'agartha') return mood;
    } catch (_) {}
    try { if (typeof DIM !== 'undefined' && DIM && DIM.cur === 'agartha') return 'agartha'; } catch (_) {}
    return null;
  }

  function inCombat() {
    try {
      if (typeof mobs === 'undefined' || !mobs || typeof P === 'undefined') return false;
      for (let i = 0; i < mobs.length; i++) {
        const m = mobs[i];
        if (!isHostileActor(m) || !m.g || !m.g.position) continue;
        const d = Math.hypot(m.g.position.x - P.x, m.g.position.z - P.z);
        if (d < 8) return true;
        if (d < 16 && (m.aggro > 0 || m.vic === P || m.target === P)) return true;
      }
    } catch (_) {}
    return false;
  }

  function nearPopstar() {
    try {
      const u = window.__v1251;
      if (!u) return false;
      const a = u.alive && u.alive();
      if (!a || !a.g || !a.g.position || typeof P === 'undefined') return false;
      const d = Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z);
      return d < 72;
    } catch (_) { return false; }
  }

  // Her diegetic dance song (__v1251.songOn) must not be replaced by Album.
  function popstarSongOn() {
    try { return !!(window.__v1251 && window.__v1251.songOn); } catch (_) { return false; }
  }
  U.popstarSongOn = popstarSongOn;

  function detectContext() {
    try {
      // Credits beat the title-screen menu so a roll can play from either place.
      if (creditsOpen()) return 'credits';
      // Album hardcore sides (never the live remix). Opt-in only: they must
      // not land in ordinary day/night rotation or replace Happy Hardcore mode.
      try {
        if (U.bounce || window.__albumBounce) return 'bounce';
        if (typeof location !== 'undefined' && /(?:^|#|&)bounce\b/i.test(String(location.hash || ''))) return 'bounce';
      } catch (_) {}
      if (typeof started !== 'undefined' && !started) return 'menu';
      // Boss, crystal-cave combat, then general combat, then the pop star.
      if (nearBoss()) return 'boss';
      if (inCombat()) return crystalMood() ? 'crystal' : 'combat';
      if (nearPopstar()) return 'popstar';
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
      // Day-only highland biomes (night already returned above). Loch stays earlier so water wins at night.
      try {
        if (typeof biomeAt === 'function' && typeof P !== 'undefined') {
          const bio = biomeAt(P.x, P.z);
          if (bio === 'high') return 'high';
          if (bio === 'moor') return 'moor';
          if (bio === 'pine') return 'pine';
        }
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
    wanted = false; curId = null; U.track = null; U.ducked = 0;
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
    const a = ensureEl();
    const songOn = popstarSongOn();
    U.songOn = songOn ? 1 : 0;
    U.ctx = detectContext();

    // Her own dance song owns the bed: skip starting Album, and duck/pause
    // anything already playing (including starlight_show) until she stops.
    if (songOn) {
      a.volume = 0;
      if (wanted) { try { a.pause(); } catch (_) {} }
      U.ducked = 1;
      return;
    }
    if (U.ducked) {
      U.ducked = 0;
      const now0 = performance.now();
      const vol0 = hidden ? 0 : albumVol();
      // Resume the same cue if we paused mid-track; otherwise a short gap, then pick.
      if (curId && a && a.src && !a.ended && vol0 >= 0.01) {
        wanted = true;
        a.volume = vol0;
        const p = a.play(); if (p && p.catch) p.catch(() => {});
        gapUntil = now0 + 400;
        return;
      }
      gapUntil = now0 + 800;
    }

    const vol = hidden ? 0 : albumVol();
    a.volume = vol;
    if (hidden || vol < 0.01) { try { a.pause(); } catch (_) {} return; }

    const ctx = U.ctx;
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
