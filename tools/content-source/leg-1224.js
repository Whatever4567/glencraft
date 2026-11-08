/* GLX-LEG1224 (v1.2.24): the old north extension is gone from the UK world. GLX-C307 (v1.1.17) answered every block north of the old map
   edge (z below 0) from its own zone: old flat ice and the old Agartha tunnel strip. On the flat UK map that zone is never drawn, so
   old saves that still had it switched on walked on invisible ice. In the flat UK world its hook stays off, so those blocks come from the
   real UK land (GLX-C320 earth) like everywhere else. Edits stored in the old zone are left in the save, untouched, just not used. */
(function leg1224() {
  const U = window.__leg1224 = {err: null, off: 0, refused: 0};
  const uk = () => { try { return !!(window.__c320 && __c320.flat && window.__c317 && __c317.on()); } catch (_) { return false; } };
  const X = window.__c307; if (!X || typeof X.hook !== 'function') return;
  const h0 = X.hook; X.hook = function (a) { if (a && uk()) { U.refused++; return h0.call(this, false); } return h0.apply(this, arguments); };
  const off = () => { if (typeof __XG === 'undefined' || !__XG || !uk()) return; h0(false); X.ready = false; U.off++;
    try { if (window.__c324 && __c324.cache) __c324.cache.clear(); const e = window.__c320; e.dirty = 1; e.edgeClr && e.edgeClr(); } catch (_) {} try { if (window.__c307b) __c307b.clear(); } catch (_) {} try { dirtyAll = true; } catch (_) {} };
  U.check = () => { try { off(); } catch (e) { if (!U.err) U.err = String(e).slice(0, 200); } };
  setInterval(U.check, 1000);
})();
