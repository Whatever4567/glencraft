/* GLX-PERF1286: frame-rate work for phones, TVs and 120Hz screens (t1226/t1227/t1228).
   1) Bone textures are re-uploaded only when a skeleton's matrices really changed
      (the FP hand clone and the TP player were uploading the same bones several
      times a frame, once per render pass).
   2) Adaptive quality governor: measures the display refresh rate and holds it.
      When frames keep missing the display's budget it lowers the pixel ratio
      (GPU-bound) and, only once that is at its floor, trims the chunk stream
      radius by up to one chunk. It gives them back when there is headroom.
      The frame rate itself is never capped here. The older c79 phone dynres
      (which only reacted below ~28fps) stands down while this runs.
   Look, models, animations and settings are unchanged; nothing is saved. */
(function perf1286(WIN) {
  const U = WIN.__perf1286 = {
    on: 1, version: 'perf-1286', err: null,
    hz: 60, budget: 1000 / 60, hzSamples: 0,
    pr: null, prMax: null, prMin: null, rdDrop: 0, rdDropMax: 1,
    js: 0, jsAvg: 0, intAvg: 0, windows: 0, good: 0, need: 3, lastUp: -99, hold: 0, steps: [],
    skel: { upd: 0, skip: 0 }
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const T3 = () => (typeof THREE !== 'undefined' && THREE) || WIN.THREE || null;

  /* ---- 1) bone texture uploads only on change ---- */
  try {
    const T = T3();
    const SK = T && T.Skeleton && T.Skeleton.prototype;
    if (SK && typeof SK.update === 'function' && !SK.update.__perf1286) {
      const orig = SK.update;
      const M = new T.Matrix4(), I = new T.Matrix4();
      const fr = Math.fround;
      SK.update = function () {
        const bt = this.boneTexture, out = this.boneMatrices, bones = this.bones, inv = this.boneInverses;
        if (!bt || !out || !bones || !inv || U.on !== 1) return orig.apply(this, arguments);
        let changed = this.__pf1286 !== bt;
        for (let i = 0, n = bones.length; i < n; i++) {
          M.multiplyMatrices(bones[i] ? bones[i].matrixWorld : I, inv[i]);
          const e = M.elements, o = i * 16;
          for (let j = 0; j < 16; j++) { const v = fr(e[j]); if (out[o + j] !== v) { out[o + j] = v; changed = true; } }
        }
        this.__pf1286 = bt;
        if (changed) { bt.needsUpdate = true; U.skel.upd++; } else U.skel.skip++;
      };
      SK.update.__perf1286 = 1;
    }
  } catch (e) { ERR('skel', e); }

  /* ---- 2) adaptive quality governor ---- */
  const touch = (function () { try { return !!touchMode; } catch (_) { return false; } })() || /Android|iPhone|iPad|Mobile/i.test((typeof navigator !== 'undefined' && navigator.userAgent) || '');
  const DPRv = WIN.devicePixelRatio || 1;
  const perfMode = (function () { try { return !!PERF; } catch (_) { return false; } })();
  U.phone = touch ? 1 : 0;
  U.prMax = touch ? Math.min(DPRv, 1.5) : Math.min(DPRv, 2);
  U.prMin = Math.min(U.prMax, touch ? 0.8 : 0.85);
  if (perfMode) { U.prMax = Math.min(U.prMax, (function () { try { return renderer.getPixelRatio(); } catch (_) { return 1; } })()); U.prMin = Math.min(U.prMin, U.prMax); }

  function getPR() { try { return renderer.getPixelRatio(); } catch (_) { return 1; } }
  function setPR(v) {
    v = Math.max(U.prMin, Math.min(U.prMax, v));
    if (Math.abs(v - getPR()) < 0.02) return false;
    try { renderer.setPixelRatio(v); if (typeof resize === 'function') resize(); } catch (e) { ERR('pr', e); return false; }
    U.pr = +v.toFixed(2);
    return true;
  }
  /* Cap at boot: phones were allowed up to 1.6x (4K UHD label), TVs up to devicePixelRatio. */
  try { if (getPR() > U.prMax + 0.01) setPR(U.prMax); U.pr = +getPR().toFixed(2); } catch (e) { ERR('cap', e); }

  /* Stream radius trim (chunks) — wraps whatever streamRadius is now. */
  try {
    if (typeof streamRadius === 'function' && !streamRadius.__perf1286) {
      const sr0 = streamRadius;
      streamRadius = function () {
        const r = sr0.apply(this, arguments);
        return U.rdDrop > 0 ? Math.max(2.5, r - U.rdDrop) : r;
      };
      streamRadius.__perf1286 = 1;
    }
  } catch (e) { ERR('sr', e); }

  /* Main-loop JS time (wraps the outermost frame). */
  try {
    if (typeof frame === 'function' && !frame.__perf1286) {
      const f0 = frame;
      frame = function () {
        const t = performance.now();
        try { return f0.apply(this, arguments); } finally { U.js = performance.now() - t; }
      };
      frame.__perf1286 = 1;
    }
  } catch (e) { ERR('frame', e); }

  const HZ = [30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 240];
  function snapHz(ms) { const f = 1000 / ms; let b = 60, d = 1e9; for (const h of HZ) { const x = Math.abs(h - f); if (x < d) { d = x; b = h; } } return b; }
  function setHz(h) { U.hz = h; U.budget = 1000 / (perfMode ? Math.min(h, 30) : h); }

  let last = 0, ints = [], jsAcc = 0, n = 0, intAcc = 0, slow = 0, cal = [];
  function active() {
    try { return !!started && !paused && (typeof screen === 'undefined' || screen !== 'loading') && document.visibilityState !== 'hidden' && !WIN.__noGov1286; } catch (_) { return false; }
  }
  function decide() {
    const avg = intAcc / n, js = jsAcc / n, B = U.budget;
    U.intAvg = +avg.toFixed(2); U.jsAvg = +js.toFixed(2); U.windows++;
    intAcc = 0; jsAcc = 0; const sl = slow; slow = 0; n = 0;
    if (U.hold > 0) { U.hold--; return; }
    const pr = getPR();
    const over = avg > B * 1.18 || sl > 6;
    const under = avg < B * 1.06 && sl <= 1;
    if (over) {
      U.good = 0;
      const gpuBound = js < avg * 0.65;
      let did = false;
      /* GPU-bound: fewer pixels. CPU-bound: fewer chunks (pixel ratio would not help). */
      if (gpuBound) did = setPR(pr * (avg > B * 1.6 ? 0.85 : 0.92));
      if (!did && U.rdDrop < U.rdDropMax && (!gpuBound || pr <= U.prMin + 0.02)) { U.rdDrop = Math.min(U.rdDropMax, U.rdDrop + 0.5); did = true; }
      if (did) {
        if (U.windows - U.lastUp < 6) U.need = Math.min(24, U.need * 2);   /* it was not really headroom: wait longer next time */
        U.hold = 2; U.steps.push(['down', +getPR().toFixed(2), U.rdDrop, U.intAvg, U.jsAvg]);
      }
    } else if (under) {
      if (++U.good < U.need) return;
      U.good = 0;
      let did = false;
      if (U.rdDrop > 0) { U.rdDrop = Math.max(0, U.rdDrop - 0.5); did = true; }
      else did = setPR(pr * 1.06);
      if (did) { U.lastUp = U.windows; U.hold = 3; U.steps.push(['up', +getPR().toFixed(2), U.rdDrop, U.intAvg, U.jsAvg]); }
    } else U.good = 0;
    if (U.steps.length > 30) U.steps.splice(0, U.steps.length - 30);
  }
  function tick(ts) {
    requestAnimationFrame(tick);
    try {
      const dt = last ? ts - last : 0; last = ts;
      if (!(dt > 0) || dt > 400) return;
      /* Refresh rate: the fastest steady interval we ever see (light menu frames
         first, then refined in play if the screen proves faster). */
      cal.push(dt);
      if (cal.length >= 60) {
        const s = cal.slice().sort((a, b) => a - b); cal = [];
        const q = s[Math.floor(s.length * 0.2)];
        const h = snapHz(q);
        if (U.hzSamples === 0 || h > U.hz) setHz(Math.max(60, h));   /* never assume a screen slower than 60Hz */
        U.hzSamples++;
      }
      if (U.on !== 1 || !active()) { intAcc = 0; jsAcc = 0; n = 0; slow = 0; return; }
      WIN.__noDynRes = 1;
      intAcc += dt; jsAcc += U.js; n++; if (dt > U.budget * 1.9) slow++;
      if (intAcc >= 1000) decide();
    } catch (e) { ERR('tick', e); }
  }
  requestAnimationFrame(tick);
  U.state = function () { return { hz: U.hz, budget: +U.budget.toFixed(2), pr: +getPR().toFixed(2), prMax: U.prMax, prMin: U.prMin, rdDrop: U.rdDrop, intAvg: U.intAvg, jsAvg: U.jsAvg, steps: U.steps.slice(-8), skel: U.skel, err: U.err }; };
})(typeof window !== 'undefined' ? window : this);
