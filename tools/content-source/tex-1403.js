/* GLX-TEX1403 (t1396 follow-up): richer maps for the remaining flatter blocks
   (stone, sand, sandstone, peat, cobblestone, stone_bricks, gold_ore, and a
   unique deepslate). Same identities and palettes, not a copy of the grass
   photo, and not a black map. Grass top and dirt from 1.2.139 are left alone.
   The original TEX maps and the 1393 assets are kept.
   Off switch: window.__noTex1403 = 1 restores the 1.2.139 maps. */
(function tex1403(WIN) {
  const U = WIN.__tex1403 = {on: 0, keys: [], err: null, restored: 0, applied: 0};
  U.active = function () { return !WIN.__noTex1403; };
  const MAP = {
    stone: 'assets/tex/stone-1403.webp',
    sand: 'assets/tex/sand-1403.webp',
    sandstone: 'assets/tex/sandstone-1403.webp',
    peat: 'assets/tex/peat-1403.webp',
    cobblestone: 'assets/tex/cobblestone-1403.webp',
    stone_bricks: 'assets/tex/stone_bricks-1403.webp',
    gold_ore: 'assets/tex/gold_ore-1403.webp',
    deepslate: 'assets/tex/deepslate-1403.webp'
  };
  const OLD = {};
  const CAN = {};

  function toCanvas(img) {
    const c = document.createElement('canvas');
    c.width = img.width || img.naturalWidth;
    c.height = img.height || img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c;
  }

  function avgOf(canvas) {
    try {
      const s = document.createElement('canvas'); s.width = s.height = 1;
      const g = s.getContext('2d'); g.drawImage(canvas, 0, 0, 1, 1);
      const d = g.getImageData(0, 0, 1, 1).data;
      return (d[0] << 16) | (d[1] << 8) | d[2];
    } catch (_) { return null; }
  }

  function mapsFor(key) {
    const ts = new Set();
    try { if (typeof texCache !== 'undefined' && texCache[key]) ts.add(texCache[key]); } catch (_) {}
    try { if (typeof matCache !== 'undefined' && matCache[key] && matCache[key].map) ts.add(matCache[key].map); } catch (_) {}
    try {
      if (typeof FACES !== 'undefined' && typeof BLOCK_MATS !== 'undefined') {
        for (const id in FACES) {
          const f = FACES[id];
          const hit = Array.isArray(f) ? f.indexOf(key) >= 0 : f === key;
          if (!hit) continue;
          const mm = BLOCK_MATS[id];
          [].concat(mm || []).forEach(function (m) { if (m && m.map) ts.add(m.map); });
        }
      }
    } catch (_) {}
    return ts;
  }

  function applyKey(key, canvas) {
    if (!OLD[key]) {
      try { OLD[key] = {img: (typeof texImg !== 'undefined' && texImg[key]) || (texCache && texCache[key] && texCache[key].image)}; } catch (_) { OLD[key] = {img: null}; }
    }
    try { if (typeof texImg !== 'undefined') texImg[key] = canvas; } catch (_) {}
    const ts = mapsFor(key);
    ts.forEach(function (t) {
      if (t && t.image !== canvas) { t.image = canvas; t.needsUpdate = true; }
    });
    try { const a = avgOf(canvas); if (a != null && typeof AVG !== 'undefined') AVG[key] = a; } catch (_) {}
  }

  function pinRuntime() {
    try {
      if (WIN.__c190 && CAN.sandstone) WIN.__c190.c = CAN.sandstone;
    } catch (_) {}
    try {
      const C = WIN.__c107;
      if (C && CAN.gold_ore && typeof texImg !== 'undefined' && texImg.stone) {
        C.made = C.made || {};
        C.mb = C.mb || {};
        C.made.gold_ore = CAN.gold_ore;
        C.mb.gold_ore = texImg.stone;
      }
    } catch (_) {}
  }

  function hookPainters() {
    try {
      const C = WIN.__c107;
      if (C && C.pass && !U._hooked107) {
        U._hooked107 = 1;
        const orig = C.pass;
        C.pass = function () {
          const r = orig.apply(this, arguments);
          if (U.active() && CAN.gold_ore) {
            applyKey('gold_ore', CAN.gold_ore);
            pinRuntime();
          }
          return r;
        };
      }
    } catch (_) {}
    try { if (WIN.__c190 && CAN.sandstone) WIN.__c190.c = CAN.sandstone; } catch (_) {}
  }

  function applyAll(imgs) {
    if (!U.active()) { U.on = 0; return; }
    const keys = Object.keys(MAP);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      CAN[k] = toCanvas(imgs[k]);
    }
    // Stone first so C107 can sit other ores on the new stone, then gold is pinned.
    applyKey('stone', CAN.stone);
    try { if (WIN.__c107 && WIN.__c107.pass) WIN.__c107.pass(); } catch (_) {}
    for (let i = 0; i < keys.length; i++) applyKey(keys[i], CAN[keys[i]]);
    hookPainters();
    pinRuntime();
    U.on = 1; U.applied = 1; U.keys = keys.slice();
    try { if (WIN.__TA && __TA.flush) __TA.flush(); } catch (_) {}
  }

  function restore() {
    const keys = Object.keys(OLD);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i], img = OLD[k] && OLD[k].img;
      if (!img) continue;
      try { if (typeof texImg !== 'undefined') texImg[k] = img; } catch (_) {}
      mapsFor(k).forEach(function (t) {
        try { if (t) { t.image = img; t.needsUpdate = true; } } catch (_) {}
      });
    }
    try { if (WIN.__c190 && OLD.sandstone && OLD.sandstone.img) WIN.__c190.c = OLD.sandstone.img; } catch (_) {}
    // Let C107 redraw gold (and the other ores) onto the restored 1.2.139 stone.
    try {
      const C = WIN.__c107;
      if (C) {
        if (C.made) delete C.made.gold_ore;
        if (C.mb) delete C.mb.gold_ore;
        if (C.pass) C.pass();
      }
    } catch (_) {}
    U.on = 0; U.restored = 1;
    try { if (WIN.__TA && __TA.flush) __TA.flush(); } catch (_) {}
  }
  U.restore = restore;

  function loadOne(key, url) {
    return new Promise(function (res, rej) {
      const im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { rej(new Error('load ' + key)); };
      const v = (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : 't1403');
      im.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'v=' + v;
    });
  }

  function boot() {
    if (!U.active()) { U.on = 0; return; }
    let started = 0;
    const begin = function () {
      if (started) return true;
      const ready = typeof texDone !== 'undefined' && typeof texTotal !== 'undefined' && texDone >= texTotal && typeof texImg !== 'undefined' && texImg.stone && texImg.sand;
      if (!ready) return false;
      started = 1;
      Promise.all(Object.keys(MAP).map(function (k) { return loadOne(k, MAP[k]).then(function (im) { return [k, im]; }); }))
        .then(function (pairs) {
          if (!U.active()) return;
          const imgs = {};
          for (let i = 0; i < pairs.length; i++) imgs[pairs[i][0]] = pairs[i][1];
          applyAll(imgs);
          // C190 / paintBricks / C107 may still overwrite for a while — re-assert.
          let n = 0;
          const iv = setInterval(function () {
            if (!U.active() || !U.applied) { clearInterval(iv); return; }
            const keys = Object.keys(MAP);
            for (let i = 0; i < keys.length; i++) applyKey(keys[i], CAN[keys[i]]);
            pinRuntime();
            try { if (WIN.__TA && __TA.flush) __TA.flush(); } catch (_) {}
            if (++n > 90) clearInterval(iv);
          }, 500);
        })
        .catch(function (e) { U.err = String(e && e.message || e).slice(0, 200); });
      return true;
    };
    if (!begin()) {
      let n = 0;
      const iv = setInterval(function () { if (begin() || ++n > 160) clearInterval(iv); }, 250);
    }
    try {
      setInterval(function () {
        if (WIN.__noTex1403 && U.on) restore();
      }, 1000);
    } catch (_) {}
  }

  try { boot(); } catch (e) { U.err = String(e && e.message || e).slice(0, 200); }
})(typeof window !== 'undefined' ? window : this);
