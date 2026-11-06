/* GLX-RLA (v1.1.99): Manual Reload always plays the full reload motion (button, KeyR, controller X,
   touch craft-as-reload) even when unlimited ammo keeps the magazine full. Auto dry-reload only when
   empty. Unequip or switch weapon cancels reload state so motion does not stick. Arms and gun stay visible. */
(function rla() {
  const U = window.__rl = {err: null, t: 0, dur: 0, id: 0, n: 0, manual: 0, cancel: 0};
  const clear = () => { U.t = 0; U.manual = 0; U.cancel++; try { if (window.__rlCoreClear) window.__rlCoreClear(); } catch (_) {} };
  const go = (id, manual) => { try { const G = GUN[id]; if (!G || U.t > 0) return false;
      U.dur = Math.max(0.9, Math.min(2.2, +(G.rl || G.reload) || 1.4)); U.t = U.dur; U.id = id; U.n++; U.manual = manual ? 1 : 0; return true; } catch (e) { U.err = String(e); return false; } };
  try { const o = window.reloadGun; window.reloadGun = function () {
      const id = selId; let r;
      try { r = o ? o.apply(this, arguments) : undefined; } catch (e) { U.err = String(e); }
      try {
        if (!(GUN[id] && cnt(id) > 0 && started && !menuOpen)) return r;
        go(id, true);
      } catch (e) { U.err = String(e); }
      return r;
    }; } catch (e) { U.err = String(e); }
  try { const uh = updateHand; updateHand = function (dt) {
      try {
        const holding = !!(GUN[selId] && cnt(selId) > 0);
        if (!holding || (U.t > 0 && U.id !== selId)) clear();
        else if (U.t > 0) { U.t -= Math.min(0.05, dt || 0.016); if (U.t < 0) U.t = 0; }
        else if (holding && window.gunMag && gunMag[selId] <= 0 && (MODE.infinite || ammoCount() > 0)) go(selId, false);
      } catch (_) {}
      return uh.apply(this, arguments);
    }; } catch (e) { U.err = String(e); }
})();
