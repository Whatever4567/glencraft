/* GLX-RLA (v1.1.57): Reload plays the reload animation whenever the mag is not full (with unlimited bullets too; a full mag does not reload), and the
   automatic reload when the mag runs dry now shows the hands working the gun too. The first person arms read __rl for the motion. */
(function rla() {
  const R = window.__rl = {t: 0, dur: 1, id: 0, n: 0};
  const go = id => { try { const G = GUN[id]; if (!G || R.t > 0) return; R.dur = Math.max(0.9, Math.min(2.2, +(G.rl || G.reload) || 1.4)); R.t = R.dur; R.id = id; R.n++; } catch (_) {} };
  try { const o = window.reloadGun; window.reloadGun = function () { const id = selId, r = o ? o.apply(this, arguments) : undefined; try { if (GUN[id] && cnt(id) > 0 && started && !menuOpen && window.gunMag && gunMag[id] < GUN[id].mag) go(id); } catch (_) {} return r; }; } catch (_) {}
  try { const uh = updateHand; updateHand = function (dt) { try { if (R.t > 0) { R.t -= Math.min(0.05, dt || 0.016); if (R.t < 0 || R.id !== selId) R.t = 0; }
        else if (GUN[selId] && cnt(selId) > 0 && window.gunMag && gunMag[selId] <= 0 && (MODE.infinite || ammoCount() > 0)) go(selId); } catch (_) {} return uh.apply(this, arguments); }; } catch (_) {}
})();
