/* GLX-RLA (v1.1.99): Reload plays the full hand animation on deliberate Reload (button, X, craft-btn gun path)
   even when the magazine is already full - unlimited ammo tops the mag every tick so a full-mag check used to
   make Reload do nothing. Auto dry reload still only runs when the mag is empty. Finite ammo still needs
   reserve for a real refill; animation always runs on manual input. Arms stay visible. */
(function rla() {
  const U = window.__rl = {err: null, t: 0, dur: 0, id: 0, n: 0, manual: 0};
  const go = (id, manual) => { try { const G = GUN[id]; if (!G || U.t > 0) return false;
      U.dur = Math.max(0.9, Math.min(2.2, +(G.rl || G.reload) || 1.4)); U.t = U.dur; U.id = id; U.n++; U.manual = manual ? 1 : 0; return true; } catch (e) { U.err = String(e); return false; } };
  try { const o = window.reloadGun; window.reloadGun = function () {
      const id = selId; let r;
      try { r = o ? o.apply(this, arguments) : undefined; } catch (e) { U.err = String(e); }
      try {
        if (!(GUN[id] && cnt(id) > 0 && started && !menuOpen)) return r;
        // Deliberate manual: always play visible reload motion (mag may already be full under unlimited ammo)
        go(id, true);
      } catch (e) { U.err = String(e); }
      return r;
    }; } catch (e) { U.err = String(e); }
  try { const uh = updateHand; updateHand = function (dt) {
      try {
        if (U.t > 0) { U.t -= Math.min(0.05, dt || 0.016); if (U.t < 0 || U.id !== selId) U.t = 0; }
        else if (GUN[selId] && cnt(selId) > 0 && window.gunMag && gunMag[selId] <= 0 && (MODE.infinite || ammoCount() > 0)) go(selId, false);
      } catch (_) {}
      return uh.apply(this, arguments);
    }; } catch (e) { U.err = String(e); }
})();
