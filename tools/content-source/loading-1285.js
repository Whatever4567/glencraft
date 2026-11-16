/* GLX-LOAD1285: liquid world-loading meter + cooperative generate yields.
   1.2.88: compositor-only fill (transform: scaleX) and shimmer, so the
   bar keeps moving even while the main thread is busy. No version bump. */
(function load1285(WIN) {
  const YIELD = {__glenYield: 1};
  const U = WIN.__glenLoad = {
    on: 1,
    version: 'load-1288',
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
    /* MessageChannel is the reliable macrotask yield (no setTimeout 4ms
       clamp). scheduler.yield() in this Chrome resolved too early and
       the pump never gave the event loop a turn, freezing the % text
       for the whole generate. */
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
        '#scr-loading #loadW.liquid1285{width:min(72vw,440px);height:18px;border-radius:11px;border:2px solid #e0a548;background:#120c06;overflow:hidden;position:relative;box-shadow:inset 0 1px 3px rgba(0,0,0,.65),0 0 0 1px rgba(0,0,0,.35);margin:4px 0 8px;transform:translateZ(0)}',
        '#scr-loading #loadW.liquid1285 .load-fill, #scr-loading #loadW.liquid1285 > i{display:block;position:absolute;left:0;top:0;bottom:0;height:100%;width:100%;max-width:100%;background:linear-gradient(180deg,#fff1b0 0%,#ffe58e 18%,#f0c24a 48%,#d9a52c 76%,#a66b12 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 0 14px rgba(242,196,64,.45)!important;background-image:none!important;background-size:auto!important;transition:none!important;border-radius:0 8px 8px 0;transform:scaleX(0);transform-origin:left center;will-change:transform;backface-visibility:hidden}',
        '#scr-loading #loadW.liquid1285 .load-wave,#scr-loading #loadW.liquid1285 .load-shimmer{position:absolute;top:0;bottom:0;left:0;width:42%;pointer-events:none;display:block;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0) 10%,rgba(255,255,255,.55) 50%,rgba(255,255,255,0) 90%,transparent 100%);transform:translateX(-120%) translateZ(0);will-change:transform;backface-visibility:hidden;animation:load1288shine 1.2s linear infinite}',
        '#scr-loading #loadW.liquid1285.load1285done .load-wave, #scr-loading #loadW.liquid1285.load1285done .load-shimmer, #scr-loading:not(.on) #loadW .load-wave, #scr-loading:not(.on) #loadW .load-shimmer{animation:none!important;-webkit-animation:none!important;display:none!important}',
        '@keyframes load1288shine{from{transform:translateX(-120%) translateZ(0)}to{transform:translateX(280%) translateZ(0)}}',
        '@keyframes load1288fill{from{transform:scaleX(0)}to{transform:scaleX(0.97)}}',
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

  /* Displayed % blends real work with an ETA from the real-progress rate.
     Below 90% the label is an integer; past 90% it shows one decimal so
     the number still moves every 1-2s on a long load. Pace follows the
     ETA (99 only when almost ready) and never goes backwards. The 60s
     time curve is only used to bake the compositor fill, not the number. */
  const NEAR_REAL = 99;
  const NEAR_ETA = 2500;

  function noteReal(now) {
    if (!U._rate) U._rate = [];
    const r = Math.max(0, Math.min(100, U.real || 0));
    const last = U._rate.length ? U._rate[U._rate.length - 1] : null;
    if (!last || now - last.t > 250 || Math.abs(r - last.r) > 0.3) {
      U._rate.push({t: now, r: r});
      if (U._rate.length > 12) U._rate.shift();
    }
  }

  function workReal() {
    const w = U._workReal;
    return Math.max(0, Math.min(100, w != null ? w : (U.real || 0)));
  }

  function etaMs(now) {
    const elapsed = Math.max(1, now - (U.t0 || now));
    const real = workReal();
    let rate = real / elapsed;
    const rs = U._rate || [];
    if (rs.length >= 2) {
      const a = rs[0], b = rs[rs.length - 1];
      if (b.t > a.t + 400 && b.r > a.r + 0.5) {
        rate = 0.6 * ((b.r - a.r) / (b.t - a.t)) + 0.4 * rate;
      }
    }
    let eta;
    if (rate < 1e-6) eta = Math.max(elapsed * 3, 20000);
    else {
      const target = 100;
      eta = elapsed + Math.max(0, (target - Math.min(real, target)) / rate) + 400;
    }
    /* A front-loaded real % (mountains jump to ~60% in a few seconds)
       would otherwise claim we are 2s from done. Floor remaining time
       by half the expected duration times work left. */
    const expect = Math.max(30000, U.expectMs || EXPECT_DEFAULT);
    const minRemain = (100 - real) / 100 * expect * 0.5;
    eta = Math.max(eta, elapsed + minRemain);
    if (U._eta) {
      if (eta < U._eta) eta = U._eta * 0.85 + eta * 0.15;
      else eta = U._eta * 0.7 + eta * 0.3;
    }
    U._eta = eta;
    return eta;
  }

  function displayAim(now) {
    now = now || performance.now();
    noteReal(now);
    const elapsed = Math.max(0, now - (U.t0 || now));
    const real = workReal();
    const eta = etaMs(now);
    const fromReal = Math.min(98.5, real * 0.985);
    const fromEta = eta > 0 ? Math.min(98.9, 98.9 * Math.min(1, elapsed / eta)) : 0;
    let aim = Math.max(fromReal, fromEta, U.shown || 0);
    const remain = Math.max(0, eta - elapsed);
    const nearly = real >= NEAR_REAL || (real >= 96 && remain <= NEAR_ETA);
    if (nearly && !U.finishing && !U.done) aim = Math.max(aim, 99);
    if (aim >= 99 && !U.finishing && !U.done && !nearly) aim = 98.9;
    aim = Math.min((U.finishing || U.done) ? 100 : (nearly ? 99 : 98.9), aim);
    if (aim < (U.shown || 0) && !U.finishing) aim = U.shown;
    return aim;
  }
  U.displayAim = displayAim;
  U.etaMs = etaMs;

  const TAIL_MS = 120000;

  function fillEl() {
    const bar = $('loadW');
    return bar && (bar.querySelector('.load-fill') || bar.firstElementChild);
  }

  function stopFillAnim() {
    if (U._fillAnim) {
      try { U._fillAnim.cancel(); } catch (_) {}
      U._fillAnim = null;
    }
  }

  /* Compositor-only fill: keyframes are baked from timeCurve so the bar
     eases to 97% over the expected duration, then creeps toward 99%,
     without any further JS. will-change: transform keeps it on the GPU. */
  function keyframesForCurve(T, tail) {
    const total = Math.max(1, (T || EXPECT_DEFAULT) + (tail || TAIL_MS));
    const frames = [];
    const push = (t) => {
      const off = Math.min(1, Math.max(0, t / total));
      const p = Math.max(0, Math.min(0.9895, timeCurve(t, T) / 100));
      if (frames.length && Math.abs(frames[frames.length - 1].offset - off) < 1e-6) return;
      frames.push({transform: 'scaleX(' + p.toFixed(5) + ')', offset: off});
    };
    push(0);
    for (let i = 1; i <= 40; i++) push((i / 40) * T);
    for (let i = 1; i <= 20; i++) push(T + (i / 20) * tail);
    if (frames[frames.length - 1].offset < 1) {
      frames.push({transform: 'scaleX(0.9895)', offset: 1});
    }
    return {frames: frames, total: total};
  }

  function startFillAnim() {
    const fill = fillEl();
    if (!fill) return;
    stopFillAnim();
    const T = U.expectMs || EXPECT_DEFAULT;
    const baked = keyframesForCurve(T, TAIL_MS);
    try {
      fill.style.width = '100%';
      fill.style.transformOrigin = 'left center';
      fill.style.willChange = 'transform';
      U._fillAnim = fill.animate(baked.frames, {duration: baked.total, easing: 'linear', fill: 'forwards'});
      const elapsed = Math.max(0, performance.now() - (U.t0 || performance.now()));
      if (elapsed > 16) {
        const jump = Math.min(baked.total, elapsed);
        const cur = U._fillAnim.currentTime || 0;
        if (jump > cur) U._fillAnim.currentTime = jump;
      }
    } catch (e) { ERR('anim', e); }
  }

  function resyncFillAnim() {
    const anim = U._fillAnim;
    if (!anim || U.finishing || U.done) return;
    const T = U.expectMs || EXPECT_DEFAULT;
    const total = T + TAIL_MS;
    const elapsed = Math.max(0, performance.now() - (U.t0 || performance.now()));
    try {
      const cur = anim.currentTime || 0;
      if (elapsed > cur + 50) anim.currentTime = Math.min(total, elapsed);
    } catch (_) {}
  }

  function glideTo100() {
    const fill = fillEl();
    const from = Math.max(0, Math.min(0.99, (U.finishFrom != null ? U.finishFrom : (U.shown || 0)) / 100));
    stopFillAnim();
    if (!fill) return;
    try {
      U._fillAnim = fill.animate(
        [{transform: 'scaleX(' + from.toFixed(5) + ')'}, {transform: 'scaleX(1)'}],
        {duration: GLIDE_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards'}
      );
    } catch (_) {
      try { fill.style.transform = 'scaleX(1)'; } catch (e) {}
    }
  }
  U.startFillAnim = startFillAnim;
  U.keyframesForCurve = keyframesForCurve;


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
    const timed = displayAim(now);
    U.timed = timed;
    let aim = Math.max(U.shown, timed, Math.min(U.real || 0, TIMED_CAP));
    aim = Math.min(TIMED_CAP, aim);
    /* Floor creep so a flat time-curve tail, or a tick after a long task,
       still moves the bar. The rate tapers as shown nears 99 so the last
       2% is not burned in ~25s, leaving the bar frozen until ready.
       Catch-up after a hitch is capped at 8% per second (and 8% in one
       paint) so two rAF frames cannot snap the bar 16%. */
    const cap = TIMED_CAP - 0.02;
    if (U.shown < cap) {
      const room = cap - U.shown;
      const floorRate = Math.min(0.08, Math.max(0, room * 0.02));
      const floor = floorRate * (dt / 1000);
      const maxStep = Math.min(8, Math.max(floor, 8 * (dt / 1000)));
      const stepped = Math.min(cap, U.shown + floor);
      if (aim > U.shown) {
        U.shown = Math.min(cap, Math.max(stepped, Math.min(aim, U.shown + maxStep)));
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
    U._workReal = next;
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
    /* Do not snap shown to 100 — applyDisplay and the fill animation glide in ~400ms. */
    try { glideTo100(); } catch (e) { ERR('glide', e); }
  }
  U.finish = finish;

  function paint(shown) {
    /* The fill is driven by a compositor transform animation, not width.
       JS only updates the % label from the ETA blend, never backwards,
       and may nudge the animation currentTime forward after a hitch.
       Past 90% the label shows one decimal so it keeps ticking on long loads. */
    try { resyncFillAnim(); } catch (_) {}
    const pct = $('loadPct');
    if (!pct) return;
    const now = performance.now();
    const prev = U._pctShown || 0;
    let v, text;
    if (U.finishing || (U.done && (shown || 0) >= 99.5)) {
      v = Math.min(100, Math.max(prev, shown || 0));
      const n = Math.min(100, Math.max(Math.round(prev), Math.round(v)));
      v = n;
      text = n + '%';
    } else {
      const aim = Math.max(shown || 0, displayAim(now));
      v = Math.min(99, Math.max(prev, aim));
      if (v < 90) {
        const n = Math.min(89, Math.floor(v + 1e-9));
        v = n;
        text = n + '%';
      } else {
        const d = Math.floor(v * 10 + 1e-9) / 10;
        v = d;
        text = d.toFixed(1) + '%';
      }
    }
    if (v < prev) v = prev;
    if (v !== prev) U._pctShownAt = now;
    U._pctShown = v;
    U._pctInt = Math.floor(v + 1e-9);
    pct.textContent = text;
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
  tick.__tgFree = 1;

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
    U._pctInt = 0;
    U._pctIntAt = U.t0;
    U._pctShown = 0;
    U._pctShownAt = U.t0;
    U._workReal = U.real;
    U._rate = [];
    U._eta = 0;
    if (label) setReal(U.real, label);
    applyDisplay();
    try { startFillAnim(); } catch (e) { ERR('startAnim', e); }
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
    try { stopFillAnim(); } catch (_) {}
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
          fill.style.willChange = 'auto';
          fill.style.transform = 'scaleX(1)';
          fill.style.width = '100%';
        }
      }
    } catch (_) {}
  }
  U.stop = stop;

  U.boot = async function (label) {
    U.gateHold = 1; U.gateUntil = performance.now() + 3000;
    try { if (typeof showScreen === 'function') showScreen('loading'); } catch (_) {}
    start(label || 'Preparing your glen…');
    await yieldPaint();
  };

  /* Shared wall budget for in-generate yield checks (ores, keeps, plants). */
  U.sliceMs = function () {
    const n = U._sliceMs || 350;
    return n < 300 ? 300 : (n > 400 ? 400 : n);
  };
  WIN.__SLB = function () {
    try { return U.sliceMs(); } catch (_) { return 350; }
  };
  U.maybeYield = function () {
    if (!U.held && !U._softHold) return false;
    if (performance.now() - (U._tSlice || 0) > U.sliceMs()) {
      U._tSlice = performance.now();
      throw U.YIELD;
    }
    return false;
  };
  /* Run a wrapper post-stage once, then yield if the adaptive slice is used up.
     On resume the cached result is returned so caves/settle/plant are not redone. */
  U.coop = function (id, label, p, fn) {
    if (!U._passed) U._passed = Object.create(null);
    if (!U._ret) U._ret = Object.create(null);
    if (U._passed[id]) return U._ret[id];
    if (U.held && label) try { U.touch(p, label, 99); } catch (_) {}
    /* Resume this post directly after a yield. Re-entering the 50+ generate
       wrappers each slice was the 6x load-time blow-up (settle 4.5s → 107s). */
    U._postResume = function () { return U.coop(id, label, p, fn); };
    try {
      const r = fn();
      U._ret[id] = r;
      U._passed[id] = 1;
      U._postResume = null;
      /* Do not yield here — markPost yields after the wrapper is marked so
         a resume can skip this wrapper's pre-apply work. */
      return r;
    } catch (e) {
      if (!U.isYield(e)) U._postResume = null;
      throw e;
    }
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
    const due = performance.now() - (U._tSlice || 0) > U.sliceMs();
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
    U._postResume = null;
    U._sliceMs = 350;
    try { window.__c77 = null; } catch (_) {}
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
          if (guarded > 100000) {
            U.held = 0;
            throw new Error('generate yield overflow');
          }
          /* Catch the displayed bar up from the time curve and real work. */
          try { applyDisplay(); } catch (_) {}
          _randGap = 1;
          const y0 = performance.now();
          try { await yieldPaint(); }
          finally { _randGap = 0; }
          /* Grow the slice toward 400ms if yield overhead is large
             (CPU throttle makes a small wall budget too small); keep a
             300ms floor so progress stays visible without letting
             per-yield cost dominate. */
          const yMs = performance.now() - y0;
          let b = U._sliceMs || 350;
          if (yMs > 40) b = Math.min(400, b + 50);
          else if (yMs < 8 && b > 300) b = Math.max(300, b - 25);
          U._sliceMs = b;
          /* Fresh work budget after the yield. Otherwise the
             wrapper-chain / paint time already burns the slice and
             a loop like placePools does one try per yield. */
          U._tSlice = performance.now();
        }
      }
    }
    /* After the first slice, resume the innermost GEN9 directly so the 50+
       wrapper preambles are not paid again (that was most of the +7.7s). */
    /* Keep generate's Math.random sequence isolated from timers/rAF that
       run in MessageChannel yield gaps. Otherwise placeOreVeins/placeHives
       (and any other Math.random stages) diverge from a synchronous run. */
    const _origRandom = Math.random;
    let _randGap = 0, _gapS = 0xC0FFEE;
    Math.random = function () {
      if (_randGap) {
        _gapS = (Math.imul(_gapS, 1664525) + 1013904223) >>> 0;
        return _gapS / 4294967296;
      }
      return _origRandom.call(Math);
    };
    U._randGap = function (on) { _randGap = on ? 1 : 0; };
    let r;
    try {
    /* GLX-LOAD1289: resuming the innermost GEN9 skips the wrapper preambles,
       whose finally blocks already reset their flags on the first yield.
       Re-establish the flags those wrappers hold around the inner call
       (c37busy from the c37 wrapper, __g12 from the c167 wrapper) so the
       resumed slices behave exactly like one synchronous call. */
    U._g12 = undefined;
    const resume9 = function () {
      let wasB, wasG;
      try { wasB = c37busy; c37busy = true; } catch (_) {}
      try { wasG = window.__g12; if (U._g12 !== undefined) window.__g12 = U._g12; } catch (_) {}
      try { return U._gen9.apply(null, arguments); }
      finally { try { c37busy = wasB; } catch (_) {} try { window.__g12 = wasG; } catch (_) {} }
    };
    const rInner = await pump(function () { return (!U.genDone && U._gen9) ? resume9 : outer; });
    r = rInner;
    if (U.genDone) r = await pump(function () {
      /* After GEN9, resume the in-flight post-stage (settle, ores, …)
         instead of walking the wrapper chain every 200ms. When the post
         finishes, fall through to outer so later posts still run. */
      if (U._postResume) {
        return function () {
          const out = U._postResume();
          if (!U._postResume) return outer.apply(null, args);
          return out;
        };
      }
      return outer;
    });
    } finally {
      _randGap = 0;
      Math.random = _origRandom;
      U._randGap = null;
    }
    U.held = 0;
    U._postResume = null;
    U.gateHold = 0;
    try { if (window.__tgate && __tgate.flush) __tgate.flush(); } catch (_) {}
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
        U._pctInt = 0;
        U._pctShown = 0;
        U.done = 0;
        start(save ? 'Restoring your world…' : 'Preparing your glen…');
      } catch (e) { ERR('start', e); }
      U.gateHold = 1; U.gateUntil = performance.now() + 3000;
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
        } finally {
          if (U.gateHold) { U.gateHold = 0; try { if (window.__tgate && __tgate.flush) __tgate.flush(); } catch (_) {} }
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

  /* Mute render/step for the whole loading screen, not just generate.
     First present is already deferred until after enter (setTimeout 0).
     Unmuting after generate paid a cold compile/render bill that blocked
     the Ready→start glide for a minute at 6x throttle. rebuild() still
     meshes as usual — only the 3D present is held back. */
  function quiet3d() {
    if (U.held) return true;
    try { if (typeof screen !== 'undefined' && screen === 'loading') return true; } catch (_) {}
    return false;
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
