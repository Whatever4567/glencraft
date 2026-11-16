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
    err: null
  };

  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  function $(id) { return document.getElementById(id); }

  /* MessageChannel yields a macrotask without setTimeout's 4ms/1s clamp.
     One rAF after that lets the browser composite the DOM bar — no 3D. */
  const _mc = new MessageChannel();
  _mc.port1.start();
  function yieldPaint() {
    try { paint(U.shown); } catch (_) {}
    // Kick a frame so the already-updated DOM bar can composite, but do
    // not wait for rAF — headless and background tabs throttle it, and
    // awaiting it was adding seconds of idle time between slices.
    try { requestAnimationFrame(function () {}); } catch (_) {}
    return new Promise(function (res) {
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

  function setReal(n, label, cap) {
    n = +n;
    if (!Number.isFinite(n)) return;
    if (U.done) {
      U.real = 100;
      return;
    }
    if (cap != null) U.cap = cap;
    const next = Math.max(U.real, Math.min(U.done ? 100 : U.cap, n));
    U.real = next;
    /* During generate the lerp tick cannot run; keep shown within 5% of real
       and never jump more than ~10% in one paint. */
    if (U.held && U.shown < next - 5) U.shown = Math.min(next - 5, U.shown + 10);
    try { if (U.held) paint(U.shown); } catch (_) {}
    if (label) U.label = label;
    U.creepT = performance.now();
    const tip = $('loadTip');
    if (tip && label) tip.textContent = label;
  }
  U.setReal = setReal;
  U.touch = setReal;

  function finish() {
    U.done = 1;
    U.cap = 100;
    U.real = 100;
    /* Do not snap shown to 100 — tick/lerp fills the last few percent so
       the bar does not jump 88→100 in one paint. */
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
    if (!U.done && U.real < U.cap) {
      const idle = now - (U.creepT || now);
      if (idle > 180) {
        const room = U.cap - U.real;
        const step = Math.min(room * 0.018, Math.max(0.07, room * 0.004));
        U.real = Math.min(U.cap - 0.15, U.real + step);
      }
    }
    const target = U.done ? 100 : U.real;
    let shown = U.shown;
    if (target > shown) {
      const k = U.done ? 0.22 : 0.16;
      shown += (target - shown) * k;
      if (target - shown < 0.04) shown = target;
    }
    if (shown > target) shown = target;
    if (shown < 0) shown = 0;
    if (U.done && shown > 99.4) shown = 100;
    if (!U.done && shown > 99.2) shown = 99.2;
    U.shown = shown;
    paint(shown);
    if (U.live) requestAnimationFrame(tick);
  }

  function start(label) {
    ensureDom();
    U.live = 1;
    U.done = 0;
    U.real = Math.max(U.real, 0.5);
    U.shown = Math.max(U.shown, 0);
    U.cap = 92;
    U.creepT = performance.now();
    U.t0 = U.t0 || performance.now();
    if (label) setReal(U.real, label);
    paint(U.shown);
    requestAnimationFrame(tick);
  }
  U.start = start;

  function stop() {
    U.done = 1;
    U.real = 100;
    U.shown = 100;
    paint(100);
    U.live = 0;
  }
  U.stop = stop;

  U.boot = async function (label) {
    try { if (typeof showScreen === 'function') showScreen('loading'); } catch (_) {}
    start(label || 'Preparing your glen…');
    await yieldPaint();
  };

  U.maybeYield = function () {
    if (!U.held) return false;
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
    if (U.held && label) try { U.touch(p, label, 92); } catch (_) {}
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
  };
  U.skipPost = function (id) {
    return !!(U.held && U.genDone && U._passed && U._passed['w:' + id]);
  };

  U.pulse = function (id, i, n, label, p0, p1) {
    if (!U.held) return;
    if (U._loop) U._loop[id] = i + 1;
    if (label && n != null) {
      const a = p0 != null ? p0 : U.real, b = p1 != null ? p1 : a;
      try { U.touch(a + (b - a) * (i + 1) / Math.max(1, n), label, 92); } catch (_) {}
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
          /* Catch the bar up to real on each yield so the painted % tracks the work. */
          try {
            if (U.real > U.shown) {
              U.shown += (U.real - U.shown) * 0.35;
              if (U.real - U.shown < 0.35) U.shown = U.real;
            }
          } catch (_) {}
          await yieldPaint();
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
            finish();
            paint(100);
            setTimeout(function () { try { U.stop(); } catch (_) {} }, 80);
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
