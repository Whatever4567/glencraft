/* ===================== GLX-C97 (v0.9.76): minimap + full map removed; world loading made robust =====================
   The c93 map is gone from the build. Its leftovers (explored-map bitmaps in localStorage, the settings flag) are cleaned up.
   If an optional piece of a save (bot snapshot c95, bot campaign c96) still breaks applySave, it is dropped and the load retried. */
(function c97() {
  try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.indexOf('glen_mapx_') === 0) localStorage.removeItem(k); } } catch (_) {}
  try { if (typeof SET !== 'undefined' && SET && 'mini' in SET) { delete SET.mini; if (typeof saveSet === 'function') saveSet(); } } catch (_) {}
  const OPT = ['c95', 'c96'];
  const ap = applySave;
  applySave = function (d) {
    try { return ap.apply(this, arguments); } catch (e) {
      window.__loadErr = String(e && e.stack || e); console.warn('[v0.9.76] world load: optional data reset', e);
      if (!d || typeof d !== 'object') throw e;
      const c = Object.assign({}, d); OPT.forEach(k => delete c[k]);
      return ap.call(this, c);
    }
  };
})();
