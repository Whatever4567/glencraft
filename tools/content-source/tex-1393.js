/* GLX-TEX1393 (t1393): the grass block's top uses the same rich turf already
   visible on its sides (blades, moss, clover — a top-down view, not a second
   cutaway and not a black map). Dirt uses the soil from those same sides.
   The original TEX maps are kept. Off switch: window.__noTex1393 = 1. */
(function tex1393(WIN) {
  const U = WIN.__tex1393 = {on: 0, keys: [], err: null, restored: 0, applied: 0};
  U.active = function () { return !WIN.__noTex1393; };
  const MAP = {
    grass_top: 'assets/tex/grass_top-1393.webp',
    dirt: 'assets/tex/dirt-1393.webp'
  };
  const OLD = {};

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

  function applyKey(key, canvas) {
    if (typeof texCache !== 'undefined' && texCache[key]) {
      if (!OLD[key]) OLD[key] = {img: texCache[key].image, map: (typeof matCache !== 'undefined' && matCache[key] && matCache[key].map) || texCache[key]};
      texCache[key].image = canvas;
      texCache[key].needsUpdate = true;
    }
    if (typeof texImg !== 'undefined') {
      if (!OLD[key]) OLD[key] = {img: texImg[key]};
      texImg[key] = canvas;
    }
    if (typeof matCache !== 'undefined' && matCache[key] && matCache[key].map) {
      matCache[key].map.image = canvas;
      matCache[key].map.needsUpdate = true;
    }
    try { const a = avgOf(canvas); if (a != null && typeof AVG !== 'undefined') AVG[key] = a; } catch (_) {}
  }

  function restore() {
    for (const k of Object.keys(OLD)) {
      const o = OLD[k], img = o && o.img;
      if (!img) continue;
      try { if (typeof texCache !== 'undefined' && texCache[k]) { texCache[k].image = img; texCache[k].needsUpdate = true; } } catch (_) {}
      try { if (typeof texImg !== 'undefined') texImg[k] = img; } catch (_) {}
      try { if (typeof matCache !== 'undefined' && matCache[k] && matCache[k].map) { matCache[k].map.image = img; matCache[k].map.needsUpdate = true; } } catch (_) {}
    }
    U.on = 0; U.restored = 1;
    try { if (WIN.__TA && __TA.flush) __TA.flush(); } catch (_) {}
  }
  U.restore = restore;

  function loadOne(key, url) {
    return new Promise(function (res, rej) {
      const im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { rej(new Error('load ' + key)); };
      const v = (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : 't1393');
      im.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'v=' + v;
    });
  }

  function applyAll(imgs) {
    if (!U.active()) { U.on = 0; return; }
    const keys = Object.keys(MAP);
    for (let i = 0; i < keys.length; i++) applyKey(keys[i], toCanvas(imgs[keys[i]]));
    U.on = 1; U.applied = 1; U.keys = keys.slice();
    try { if (WIN.__TA && __TA.flush) __TA.flush(); } catch (_) {}
  }

  function boot() {
    if (!U.active()) { U.on = 0; return; }
    let started = 0;
    const begin = function () {
      if (started) return true;
      const ready = typeof texDone !== 'undefined' && typeof texTotal !== 'undefined' && texDone >= texTotal && typeof texImg !== 'undefined' && texImg.grass_top && texImg.dirt;
      if (!ready) return false;
      started = 1;
      Promise.all(Object.keys(MAP).map(function (k) { return loadOne(k, MAP[k]).then(function (im) { return [k, im]; }); }))
        .then(function (pairs) {
          if (!U.active()) return;
          const imgs = {};
          for (let i = 0; i < pairs.length; i++) imgs[pairs[i][0]] = pairs[i][1];
          applyAll(imgs);
        })
        .catch(function (e) { U.err = String(e && e.message || e).slice(0, 200); });
      return true;
    };
    if (!begin()) {
      let n = 0;
      const iv = setInterval(function () { if (begin() || ++n > 160) clearInterval(iv); }, 250);
    }
    // If the flag is flipped on later, put the live maps back.
    try {
      setInterval(function () {
        if (WIN.__noTex1393 && U.on) restore();
      }, 1000);
    } catch (_) {}
  }

  try { boot(); } catch (e) { U.err = String(e && e.message || e).slice(0, 200); }
})(typeof window !== 'undefined' ? window : this);
