/* GLX-C396 (v1.1.96): Y0-1 surface mesh owner. Dual draw removed in earth_chunk_streaming. This only
   ensures the Y0 underside seal (__YB) stays available so deep caves keep a solid roof. */
(function c396() {
  const U = window.__c396 = {err: null, on: 0};
  try {
    if (!window.__YB) {
      window.__YB = (x, z) => { try { const b = getB(x, -1, z); return b || T.STONE; } catch (_) { return T.STONE; } };
    }
    U.on = 1;
  } catch (e) { U.err = String(e && e.stack || e).slice(0, 200); }
})();
