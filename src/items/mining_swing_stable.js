/* GLX-C399 (v1.1.96): MINING SWING STABLE. The per-frame rewrite of swingT from mine phase fought the
   swing animation and froze during remesh stalls. After each interaction tick we drive one swing pulse
   per break-beat with clamped catch-up, and leave crack / break speed alone. */
(function c399() {
  const U = window.__c399 = {err: null, beats: 0, on: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  let lastKey = null, nextBeatAt = 0;
  try {
    const ui = updateInteraction;
    updateInteraction = function (dt) {
      const r = ui.apply(this, arguments);
      try {
        const attacking = !!(attackMouse || attackPad || attackTouch);
        if (!attacking || !mine || !mine.key) { lastKey = null; U.on = 1; return r; }
        const parts = mine.key.split(',').map(Number);
        const b = getB(parts[0], parts[1], parts[2]);
        if (!b || HARD[b] == null) return r;
        let speed = 1; try { speed = mcMineRate(b); } catch (_) {}
        if (MODE && MODE.instantBreak) speed = 999;
        const tot = HARD[b] / Math.max(1e-6, speed);
        const n = Math.max(1, Math.round(tot / 0.3));
        const per = Math.max(0.05, tot / n);
        if (mine.key !== lastKey) { lastKey = mine.key; nextBeatAt = mine.t; }
        // When mine.t crosses the next beat boundary, fire one visible swing pulse
        while (mine.t >= nextBeatAt) {
          nextBeatAt += per;
          try {
            swingD = per;
            swingT = per;
            if (typeof swingTick !== 'undefined') swingTick = per;
            U.beats++;
          } catch (_) {}
          // Only one pulse per frame to avoid catch-up spam after a stall
          break;
        }
        // If a huge dt stall happened, still show a swing rather than a frozen arm
        try {
          if (swingT <= 0 && attacking) { swingD = per; swingT = Math.min(per, 0.2); }
        } catch (_) {}
        U.on = 1;
      } catch (e) { ERR('fix', e); }
      return r;
    };
  } catch (e) { ERR('wrap', e); }
})();
