<script id="glx-fps1414">
/* ===================== GLX-FPS1414 (t1414, v1.2.151): frame-rate work for 90/120 Hz phones and TVs.
   - Performance mode no longer caps at 30 fps (edit in frame() and the GLX-PERF1286 budget).
   - Scope-glass sweep (GLX-RIFLE1392) runs its whole-scene pass once per frame (frame id below).
   - Chunk meshing budget per frame is scaled by 60 / refresh rate on screens of 90 Hz and up, so the meshing work per
     second is the same as at 60 Hz but each 120 Hz frame stays short. Terrain blocks and cave shapes are not touched.
   Nothing is saved. Off switch for all of it: window.__noFps1414 = 1 before load
   (single parts: __noUncap1414, __noBudget1414). ===================== */
(function fps1414(WIN) {
  const U = WIN.__fps1414 = {version: 'fps-1414', err: null, fid: 0, budget: {scaled: 0, last: null}};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const off = () => !!WIN.__noFps1414;
  /* frame id (for once-per-frame work) */
  try {
    if (typeof frame === 'function' && !frame.__fps1414) {
      const f0 = frame;
      frame = function () { U.fid = (U.fid + 1) | 0; return f0.apply(this, arguments); };
      for (const k in f0) try { frame[k] = f0[k]; } catch (_) {}
      frame.__fps1414 = 1;
    }
  } catch (e) { ERR('frame', e); }

  /* ---- chunk meshing budget on fast screens ---- */
  try {
    if (typeof rebuild === 'function' && !rebuild.__fps1414) {
      const rb = rebuild;
      const f = function (budget) {
        if (!off() && !WIN.__noBudget1414 && arguments.length === 1 && typeof budget === 'number' && budget > 0 && budget <= 16) {
          try {
            const G = WIN.__perf1286, hz = G && G.on === 1 ? G.hz : 60;
            if (hz >= 90 && typeof started !== 'undefined' && started && !(typeof screen !== 'undefined' && screen === 'loading')) {
              const b = Math.max(2, budget * 60 / hz);
              U.budget.scaled++; U.budget.last = [budget, +b.toFixed(2), hz];
              return rb.call(this, b);
            }
          } catch (e) { ERR('budget', e); }
        }
        return rb.apply(this, arguments);
      };
      for (const k of Object.keys(rb)) if (k.startsWith('__') || k.startsWith('_p')) try { f[k] = rb[k]; } catch (_) {}
      f.__fps1414 = 1;
      rebuild = f;
      try { WIN.rebuild = rebuild; } catch (_) {}
    }
  } catch (e) { ERR('rebuild', e); }
})(typeof window !== 'undefined' ? window : this);
</script>
