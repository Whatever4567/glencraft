/* ===================== GLX-C316 (v1.1.26): Reset world always makes a fresh world at mainland spawn =====================
   - A Test World (creative) reset now builds the current big map too (it used to rebuild the old small 390 map with the same layout).
   - Space, the Moon, Mars, the UFO and floating-in-space are all cleared first, and you land at mainland spawn, not where you were. */
(function c316() {
  const U = window.__c316 = {err: null, resets: 0, cre: 0, lastW: 0};
  const ERR = (w, e) => { U.err = w + ': ' + (e && e.message || e); console.warn('c316', w, e); };
  function clearSpace() {
    try { const m = window.__c308; if (m && m.mode && m.stop) m.stop(); if (m) m.mode = null; } catch (e) { ERR('m8', e); }
    try { const d = window.__c306; if (d) { d.eva = false; if (d.E) Object.assign(d.E, {vx: 0, vy: 0, vz: 0}); } } catch (e) { ERR('eva', e); }
    try { const u = window.__c309; if (u && u.on) { u.on = false; window.__spaceHud = null; } } catch (e) { ERR('ufo', e); }
    try { const r = window.__c299; if (r && r.on && r.stop) r.stop(); } catch (e) { ERR('rk', e); }
    try { scene.position.set(0, 0, 0); } catch (_) {}
    try { P.vx = P.vy = P.vz = 0; P.fallTop = null; } catch (_) {}
  }
  U.clearSpace = clearSpace;
  try { const st = __c105.start; __c105.start = function () { try { if (!DIM.cur) { clearSpace(); U.resets++; } } catch (e) { ERR('st', e); } return st.apply(this, arguments); }; } catch (e) { ERR('wrap', e); }
  try { const ew = enterWorld; enterWorld = function (save) {
      const R = window.__c105, reset = !save && R && R.phase === 'gen' && !DIM.cur && current;
      if (!reset) return ew.apply(this, arguments);
      let cre = false;
      try { R.px = -1; R.pz = -1; spawnPt = null; clearSpace(); cre = current.mode === 'creative'; if (cre) { current.mode = 'survival'; U.cre++; } } catch (e) { ERR('pre', e); }
      try { return ew.apply(this, arguments); }
      finally { try { if (cre) { current.mode = 'creative'; current.c316 = 1; try { if (typeof setGameMode === 'function') setGameMode('creative'); } catch (_) {} }
          U.lastW = W; } catch (e) { ERR('post', e); } } }; } catch (e) { ERR('ew', e); }
})();
