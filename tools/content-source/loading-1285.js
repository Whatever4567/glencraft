/* GLX-LOAD1285: liquid world-loading meter + cooperative generate yields.
   No version bump. Folded into 1.2.85 later. */
(function load1285(WIN) {
  const YIELD = {__glenYield: 1};
  const U = WIN.__glenLoad = {
    on: 1,
    version: 'load-1285',
    YIELD: YIELD,
    isYield: function (e) { return e === YIELD || (e && e.__glenYield); },
    real: 0,
    shown: 0,
    done: 0,
    live: 0,
    held: 0,
    genX: 0,
    _g9: null,
    cap: 92,
    label: '',
    creepT: 0,
    t0: 0,
    expectMs: 60000,
    timed: 0,
    finishing: 0,
    finishT: 0,
    finishFrom: 0,
    err: null
  };

  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  function $(id) { return document.getElementById(id); }

  /* MessageChannel yields a macrotask without setTimeout's 4ms/1s clamp.
     One rAF after that lets the browser composite the DOM bar — no 3D. */
  const _mc = new MessageChannel();
  _mc.port1.start();
  let _mcLive = 1;
  let _raf = 0;
  function yieldPaint() {
    if (!U.live) return Promise.resolve();
    try { applyDisplay(); paint(U.shown); } catch (_) {}
    // Kick a frame so the already-updated DOM bar can composite, but do
    // not wait for rAF — headless and background tabs throttle it, and
    // awaiting it was adding seconds of idle time between slices.
    try { if (U.live) requestAnimationFrame(function () {}); } catch (_) {}
    return new Promise(function (res) {
      if (!_mcLive || !U.live) { res(); return; }
      try { _mc.port1.onmessage = function () { res(); }; _mc.port2.postMessage(0); }
      catch (_) { res(); }
    });
  }
  U.yieldPaint = yieldPaint;

  function ensureDom() {
    const bar = $('loadW');
    if (!bar) return;
    if (!bar.classList.contains('liquid1285')) {
      bar.classList.add('liquid1285');
      let fill = bar.querySelector('.load-fill') || bar.firstElementChild;
      if (!fill) {
        fill = document.createElement('i');
        bar.insertBefore(fill, bar.firstChild);
      }
      fill.classList.add('load-fill');
      if (!bar.querySelector('.load-wave')) {
        const w = document.createElement('b');
        w.className = 'load-wave';
        w.setAttribute('aria-hidden', 'true');
        fill.appendChild(w);
      }
    }
    if (!$('load1285css')) {
      const st = document.createElement('style');
      st.id = 'load1285css';
      st.textContent = [
        '#scr-loading #loadW.liquid1285{width:min(72vw,440px);height:18px;border-radius:11px;border:2px solid #e0a548;background:#120c06;overflow:hidden;position:relative;box-shadow:inset 0 1px 3px rgba(0,0,0,.65),0 0 0 1px rgba(0,0,0,.35);margin:4px 0 8px}',
        '#scr-loading #loadW.liquid1285 .load-fill, #scr-loading #loadW.liquid1285 > i{display:block;position:absolute;left:0;top:0;bottom:0;height:100%;width:0;max-width:100%;background:linear-gradient(180deg,#fff1b0 0%,#ffe58e 18%,#f0c24a 48%,#d9a52c 76%,#a66b12 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 0 14px rgba(242,196,64,.45)!important;animation:none!important;background-image:none!important;background-size:auto!important;transition:none!important;border-radius:0 8px 8px 0}',
        '#scr-loading #loadW.liquid1285 .load-wave{position:absolute;top:-7px;left:-40%;right:-40%;height:14px;pointer-events:none;display:block;background:radial-gradient(ellipse 18px 8px at 12% 70%,rgba(255,249,220,.95) 0%,rgba(255,249,220,0) 70%),radial-gradient(ellipse 22px 9px at 36% 40%,rgba(255,236,170,.9) 0%,rgba(255,236,170,0) 70%),radial-gradient(ellipse 16px 8px at 58% 75%,rgba(255,249,220,.95) 0%,rgba(255,249,220,0) 70%),radial-gradient(ellipse 20px 9px at 82% 45%,rgba(255,236,170,.9) 0%,rgba(255,236,170,0) 70%);animation:load1285wave 1.15s linear infinite;opacity:.95;filter:drop-shadow(0 1px 0 rgba(80,40,0,.25))}',
        '#scr-loading #loadW.liquid1285 .load-fill::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.28) 45%,rgba(255,255,255,.02) 60%,transparent 100%);background-size:140% 100%;animation:load1285shine 2.2s linear infinite;pointer-events:none;mix-blend-mode:soft-light}',
        '#scr-loading #loadW.liquid1285.load1285done .load-wave, #scr-loading #loadW.liquid1285.load1285done .load-fill::before, #scr-loading:not(.on) #loadW .load-wave, #scr-loading:not(.on) #loadW .load-fill::before{animation:none!important;-webkit-animation:none!important;display:none!important}',
        '@keyframes load1285wave{from{transform:translateX(0)}to{transform:translateX(20%)}}',
        '@keyframes load1285shine{from{background-position:-40% 0}to{background-position:140% 0}}',
        '#scr-loading #loadPct{font:800 clamp(20px,5.2vw,28px) GlenBold,system-ui,sans-serif;color:#fff6cf!important;letter-spacing:.04em;margin-top:2px;text-shadow:0 0 12px rgba(224,165,72,.55),0 2px 6px #000}',
        '@media (orientation:landscape) and (max-height:500px){#scr-loading #loadW.liquid1285{height:14px;width:min(60vw,480px)}#scr-loading #loadPct{font-size:clamp(16px,3.6vh,22px)}}',
        '@media (min-width:1200px) and (min-height:700px){#scr-loading #loadW.liquid1285{height:22px;width:min(46vw,560px);border-width:3px}}'
      ].join('\n');
      document.head.appendChild(st);
    }
  }
  U.ensureDom = ensureDom;

  /* Time-driven displayed progress, separate from real work.
     displayed = max(real-based, time curve). The curve eases toward 97% over
     the expected load, then creeps asymptotically toward 99% so the bar never
     freezes if the world takes longer. Expected duration starts at 60s and
     adapts from the last few actual loads in localStorage. When the world is
     ready, shown glides to 100 over ~400ms and the rAF tick then stops. */
  const LS_KEY = 'glenLoadTimes';
  const EXPECT_DEFAULT = 60000;
  const EXPECT_MIN = 30000;
  const EXPECT_MAX = 120000;
  const TIMED_AT_T = 97;
  const TIMED_CAP = 99;
  const GLIDE_MS = 400;

  function readExpect() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      const times = (raw && Array.isArray(raw.times) ? raw.times : [])
        .map(Number).filter(function (t) { return t >= 8000 && t <= 180000; });
      if (!times.length) return EXPECT_DEFAULT;
      const last = times.slice(-5);
      const avg = last.reduce(function (a, b) { return a + b; }, 0) / last.length;
      return Math.max(EXPECT_MIN, Math.min(EXPECT_MAX, avg));
    } catch (_) { return EXPECT_DEFAULT; }
  }
  function rememberLoad(ms) {
    ms = Math.round(ms);
    if (!Number.isFinite(ms) || ms < 8000 || ms > 180000) return;
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null') || {};
      const times = Array.isArray(raw.times) ? raw.times.slice() : [];
      times.push(ms);
      while (times.length > 5) times.shift();
      localStorage.setItem(LS_KEY, JSON.stringify({times: times, v: 1}));
    } catch (_) {}
  }
  /* Pure. elapsed and T in ms. Ease to 97% at t=T, then exp creep toward 99%. */
  function timeCurve(elapsed, T) {
    T = Math.max(1, T || EXPECT_DEFAULT);
    const t = Math.max(0, elapsed);
    if (t <= T) {
      const u = t / T;
      /* Mostly linear so the last seconds of T still move; a little ease so it is not a hard corner. */
      const e = 0.8 * u + 0.2 * (u * u * (3 - 2 * u));
      return TIMED_AT_T * e;
    }
    const over = t - T;
    const tau = 45000;
    return Math.min(TIMED_CAP - 0.05, TIMED_AT_T + (TIMED_CAP - TIMED_AT_T) * (1 - 1 / (1 + over / tau)));
  }
  U.timeCurve = timeCurve;
  U.readExpect = readExpect;

  function applyDisplay(now) {
    now = now || performance.now();
    const prevT = U._tickAt || now;
    const dt = Math.max(0, Math.min(3000, now - prevT));
    U._tickAt = now;
    if (U.finishing) {
      const u = Math.min(1, (now - (U.finishT || now)) / GLIDE_MS);
      const e = 1 - (1 - u) * (1 - u);
      let shown = (U.finishFrom || 0) + (100 - (U.finishFrom || 0)) * e;
      if (u >= 1) shown = 100;
      if (shown < U.shown) shown = U.shown;
      U.shown = shown;
      return U.shown;
    }
    if (!U.t0) U.t0 = now;
    const timed = timeCurve(now - U.t0, U.expectMs || EXPECT_DEFAULT);
    U.timed = timed;
    let aim = Math.max(U.shown, timed, Math.min(U.real || 0, TIMED_CAP));
    aim = Math.min(TIMED_CAP, aim);
    /* Floor creep so a flat time-curve tail, or a tick after a long task,
       still moves the bar. 0.08%/s is visible over 3s and lasts ~25s after T
       before nearing the 99 cap. Always apply this as a minimum; do not
       follow a flatter time-curve increment instead. */
    const cap = TIMED_CAP - 0.05;
    const floor = 0.08 * (dt / 1000);
    if (U.shown < cap) {
      const stepped = Math.min(cap, U.shown + floor);
      if (aim > U.shown) {
        /* Never jump more than 8% in one paint if a long task delayed ticks. */
        U.shown = Math.min(cap, Math.max(stepped, Math.min(aim, U.shown + 8)));
      } else {
        U.shown = stepped;
      }
    }
    if (U.shown < 0) U.shown = 0;
    return U.shown;
  }
  U.applyDisplay = applyDisplay;

  function setReal(n, label, cap) {
    n = +n;
    if (!Number.isFinite(n)) return;
    if (U.done && !U.finishing) {
      U.real = 100;
      return;
    }
    if (U.finishing) return;
    if (cap != null) U.cap = cap;
    const next = Math.max(U.real, Math.min(U.done ? 100 : U.cap, n));
    U.real = next;
    try { applyDisplay(); paint(U.shown); } catch (_) {}
    if (label) U.label = label;
    U.creepT = performance.now();
    const tip = $('loadTip');
    if (tip && label) tip.textContent = label;
  }
  U.setReal = setReal;
  U.touch = setReal;

  function finish() {
    if (U.finishing) return;
    const now = performance.now();
    U.done = 1;
    U.cap = 100;
    U.real = 100;
    U.finishing = 1;
    U.finishT = now;
    U.finishFrom = Math.max(0, Math.min(99, U.shown || 0));
    try { rememberLoad(now - (U.t0 || now)); } catch (_) {}
    /* Do not snap shown to 100 — applyDisplay glides the last stretch in ~400ms. */
  }
  U.finish = finish;

  function paint(shown) {
    const bar = $('loadW');
    if (!bar) return;
    const fill = bar.querySelector('.load-fill') || bar.firstElementChild;
    if (fill) fill.style.width = shown.toFixed(2) + '%';
    const pct = $('loadPct');
    if (pct) pct.textContent = Math.round(shown) + '%';
  }

  function tick() {
    if (!U.live) return;
    const now = performance.now();
    if (!U.done && !U.finishing && U.real < U.cap) {
      const idle = now - (U.creepT || now);
      if (idle > 180) {
        const room = Math.min(U.cap, TIMED_CAP) - U.real;
        const step = Math.min(room * 0.018, Math.max(0.07, room * 0.004));
        U.real = Math.min(Math.min(U.cap, TIMED_CAP) - 0.15, U.real + step);
      }
    }
    applyDisplay(now);
    paint(U.shown);
    if (U.finishing && (U.shown >= 99.95 || (now - (U.finishT || now)) >= GLIDE_MS + 50)) {
      stop();
      return;
    }
    if (U.live) _raf = requestAnimationFrame(tick);
    else _raf = 0;
  }

  function start(label) {
    ensureDom();
    try {
      const bar = $('loadW');
      if (bar) bar.classList.remove('load1285done');
    } catch (_) {}
    _mcLive = 1;
    try { if (_raf) cancelAnimationFrame(_raf); } catch (_) {}
    _raf = 0;
    U.live = 1;
    U.done = 0;
    U.finishing = 0;
    U.real = Math.max(U.real, 0.5);
    U.shown = Math.max(U.shown, 0);
    U.cap = 99;
    U.creepT = performance.now();
    U.t0 = U.t0 || performance.now();
    U.expectMs = readExpect();
    U._tickAt = U.t0;
    if (label) setReal(U.real, label);
    applyDisplay();
    paint(U.shown);
    _raf = requestAnimationFrame(tick);
  }
  U.start = start;

  function stop() {
    U.done = 1;
    U.real = 100;
    U.shown = 100;
    U.finishing = 0;
    U.live = 0;
    try { if (_raf) cancelAnimationFrame(_raf); } catch (_) {}
    _raf = 0;
    _mcLive = 0;
    try { _mc.port1.onmessage = null; } catch (_) {}
    try { paint(100); } catch (_) {}
    try {
      const bar = $('loadW');
      if (bar) {
        bar.classList.add('load1285done');
        const wave = bar.querySelector('.load-wave');
        if (wave) {
          wave.style.animation = 'none';
          wave.style.webkitAnimation = 'none';
          wave.style.display = 'none';
        }
        const fill = bar.querySelector('.load-fill') || bar.firstElementChild;
        if (fill) {
          fill.style.animation = 'none';
          fill.style.webkitAnimation = 'none';
        }
      }
    } catch (_) {}
  }
  U.stop = stop;

  U.boot = async function (label) {
    try { if (typeof showScreen === 'function') showScreen('loading'); } catch (_) {}
    start(label || 'Preparing your glen…');
    await yieldPaint();
  };

  U.maybeYield = function () {
    if (!U.held && !U._softHold) return false;
    if (performance.now() - (U._tSlice || 0) > 200) {
      U._tSlice = performance.now();
      throw U.YIELD;
    }
    return false;
  };
  /* Run a wrapper post-stage once, then yield if the 200ms slice is used up.
     On resume the cached result is returned so caves/settle/plant are not redone. */
  U.coop = function (id, label, p, fn) {
    if (!U._passed) U._passed = Object.create(null);
    if (!U._ret) U._ret = Object.create(null);
    if (U._passed[id]) return U._ret[id];
    if (U.held && label) try { U.touch(p, label, 99); } catch (_) {}
    const r = fn();
    U._ret[id] = r;
    U._passed[id] = 1;
    /* Do not yield here — markPost yields after the wrapper is marked so
       a resume can skip this wrapper's pre-apply work. */
    return r;
  };
  /* After a yield in the outer post chain, skip wrapper post-bodies that
     already finished so uncached posts are not redone on every slice. */
  U.markPost = function (id) {
    if (!U._passed) U._passed = Object.create(null);
    U._passed['w:' + id] = 1;
    /* Yield only after the wrapper is marked so a resume skips its post. */
    try { applyDisplay(); paint(U.shown); } catch (_) {}
    U.maybeYield();
  };
  U.skipPost = function (id) {
    return !!(U.held && U.genDone && U._passed && U._passed['w:' + id]);
  };

  U.pulse = function (id, i, n, label, p0, p1) {
    if (!U.held) return;
    if (U._loop) U._loop[id] = i + 1;
    /* Only paint when a yield is due — touching the DOM on every loop
       iteration (e.g. 6000 placePools tries) stalls a throttled phone
       for minutes and the world never reaches ready. */
    const due = performance.now() - (U._tSlice || 0) > 200;
    if (due && label && n != null) {
      const a = p0 != null ? p0 : U.real, b = p1 != null ? p1 : a;
      try { U.touch(a + (b - a) * (i + 1) / Math.max(1, n), label, 99); } catch (_) {}
    }
    U.maybeYield();
  };

  U.generate = async function () {
    U.held = 1;
    U.genDone = 0;
    U.genX = 0;
    U._g9 = null;
    U._gen9 = null;
    U._featX = 0;
    U._plant = null;
    U._pools = null;
    U._p1248 = null;
    U._passed = Object.create(null);
    U._ret = Object.create(null);
    U._loop = Object.create(null);
    U._tSlice = performance.now();
    if (typeof generate !== 'function') throw new Error('generate missing');
    const outer = generate;
    const args = arguments;
    let guarded = 0;
    const t0 = performance.now();
    async function pump(pick) {
      while (true) {
        try {
          return pick().apply(null, args);
        } catch (e) {
          if (!U.isYield(e)) {
            U.held = 0;
            U._g9 = null;
            throw e;
          }
          guarded++;
          U._yields = guarded;
          if (guarded > 20000) {
            U.held = 0;
            throw new Error('generate yield overflow');
          }
          /* Catch the displayed bar up from the time curve and real work. */
          try { applyDisplay(); } catch (_) {}
          await yieldPaint();
          /* Fresh 200ms work budget after the yield. Otherwise the
             wrapper-chain / paint time already burns the slice and
             a loop like placePools does one try per yield. */
          U._tSlice = performance.now();
        }
      }
    }
    /* After the first slice, resume the innermost GEN9 directly so the 50+
       wrapper preambles are not paid again (that was most of the +7.7s). */
    const rInner = await pump(function () { return (!U.genDone && U._gen9) ? U._gen9 : outer; });
    let r = rInner;
    if (U.genDone) r = await pump(function () { return outer; });
    U.held = 0;
    U._g9 = null;
    U.genX = 0;
    setReal(Math.max(U.real, 88), 'Building the land around you…', 99);
    try { console.log('load: generate ' + Math.round(performance.now() - t0) + ' ms, ' + guarded + ' yields'); } catch (_) {}
    return r;
  };

  /* Mud pools are not needed to enter. Running them inside generate() on a
     throttled phone never finished (wrapper resume + 6000 site scans), so
     they are deferred until after the world is playable and stepped with
     soft yields so they do not hitch the first seconds of play. */
  U.runDeferredPools = async function () {
    if (!U._deferPools) return;
    U._deferPools = 0;
    U._softHold = 1;
    U._tSlice = performance.now();
    try {
      while (true) {
        try {
          const ch = typeof placePools1248 === 'function' ? placePools1248() : (typeof placePools === 'function' ? placePools(7, null) : []);
          try {
            if (Array.isArray(ch) && typeof markDirty === 'function') {
              for (let i = 0; i < ch.length; i++) markDirty(ch[i][0], ch[i][1]);
            }
          } catch (_) {}
          break;
        } catch (e) {
          if (!U.isYield(e)) throw e;
          await new Promise(function (res) {
            try {
              const mc = new MessageChannel();
              mc.port1.onmessage = function () { res(); };
              mc.port2.postMessage(0);
            } catch (_) { res(); }
          });
          U._tSlice = performance.now();
        }
      }
    } catch (e) { ERR('pools', e); }
    U._softHold = 0;
  };

  /* Take over the original enterWorld rAF lerp so both sources share one meter. */
  const _ew = typeof enterWorld === 'function' ? enterWorld : null;
  if (_ew && !_ew.__load1285) {
    enterWorld = function (save) {
      try {
        if (typeof showScreen === 'function') showScreen('loading');
        U.t0 = performance.now();
        U.real = 0;
        U.shown = 0;
        U.done = 0;
        start(save ? 'Restoring your world…' : 'Preparing your glen…');
      } catch (e) { ERR('start', e); }
      const self = this, args = arguments;
      const run = async function () {
        try { await yieldPaint(); } catch (_) {}
        try {
          const r = _ew.apply(self, args);
          if (r && typeof r.then === 'function') await r;
          return r;
        } catch (e) {
          ERR('ew', e);
          throw e;
        }
      };
      const p = run();
      return p;
    };
    enterWorld.__load1285 = 1;
    try { WIN.enterWorld = enterWorld; } catch (_) {}
  }

  /* When the original loader marks ready, hold 100% for a beat then stop. */
  try {
    if (typeof showScreen === 'function' && !showScreen.__load1285) {
      const ss = showScreen;
      showScreen = function (name) {
        try {
          if (name === 'loading') {
            ensureDom();
            if (!U.live) start();
          } else if (U.live && name !== 'loading') {
            if (!U.finishing) finish();
            /* Do not snap the bar — the 400ms glide should already be at 100. */
            if (U.shown >= 99.5) {
              try { paint(U.shown); } catch (_) {}
              setTimeout(function () { try { U.stop(); } catch (_) {} }, 80);
            }
          }
        } catch (e) { ERR('ss', e); }
        return ss.apply(this, arguments);
      };
      showScreen.__load1285 = 1;
    }
  } catch (e) { ERR('ssw', e); }

  /* Also creep-report from applySave so saved worlds are not a silent gap. */
  /* During generate, do not mesh or draw the 3D scene — only the DOM bar.
     Unbounded rebuild() on the loading screen is capped to the same 150ms
     budget the loader already uses; rebuild(150) is left alone so land
     meshing is not slower than 1.2.84. */
  try {
    if (typeof rebuild === 'function' && !rebuild.__load1285) {
      const rb = rebuild;
      rebuild = function (budget) {
        if (U.held) return;
        if (U.live && budget == null) budget = 150;
        return rb.apply(this, arguments);
      };
      rebuild.__load1285 = 1;
      try { WIN.rebuild = rebuild; } catch (_) {}
    }
  } catch (e) { ERR('rb', e); }

  /* Only mute the 3D scene while generate() itself is on the stack.
     After that the loader must mesh and present like 1.2.84, or the first
     enter-frame pays a huge cold compile/render bill. */
  function quiet3d() {
    return !!U.held;
  }
  U.quiet3d = quiet3d;
  try {
    if (typeof render === 'function' && !render.__load1285) {
      const rd = render;
      render = function () {
        if (quiet3d()) return;
        return rd.apply(this, arguments);
      };
      render.__load1285 = 1;
    }
  } catch (e) { ERR('rd', e); }
  try {
    if (typeof step === 'function' && !step.__load1285) {
      const st = step;
      step = function () {
        if (quiet3d()) return 0;
        return st.apply(this, arguments);
      };
      step.__load1285 = 1;
    }
  } catch (e) { ERR('st', e); }

  try {
    if (typeof applySave === 'function' && !applySave.__load1285) {
      const ap = applySave;
      applySave = function () {
        try { if (U.live) setReal(Math.max(U.real, 12), 'Restoring the save…', 90); } catch (_) {}
        const r = ap.apply(this, arguments);
        try { if (U.live) setReal(Math.max(U.real, 62), 'Building the land around you…', 99); } catch (_) {}
        return r;
      };
      applySave.__load1285 = 1;
    }
  } catch (e) { ERR('ap', e); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { try { ensureDom(); } catch (e) { ERR('dom', e); } });
  } else {
    try { ensureDom(); } catch (e) { ERR('dom', e); }
  }
})(typeof window !== 'undefined' ? window : this);
