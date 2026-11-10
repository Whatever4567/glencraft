/* GLX-V1257: third-person player must show the approved Scottish base
   (scottish-base-v2 + v15 crystal armour) from 1.2.35–1.2.53, not the
   old v1.2.26 rounded procedural body. That body is only a fallback after
   a genuine GLB load failure. A leftover swap rebuilt worldModel with
   build() whenever userData.hd was unset; the Scottish adapter never set
   hd, so third person kept snapping back to the round mesh. */
(function v1257tp() {
  const U = window.__v1257tp = {err: null, ensured: 0, skipped: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  function genuineLoadError() {
    const p = window.__pilot1235;
    return !!(p && p.error && !p.loaded);
  }
  function hasPilot(model) {
    return !!(model && model.userData && (model.userData.pilot || model.userData.pilotPending));
  }
  function ensure(model) {
    try {
      const p = window.__pilot1235;
      if (!p || !model || hasPilot(model) || genuineLoadError()) return false;
      p.attach(model);
      U.ensured++;
      return true;
    } catch (e) { ERR('ensure', e); return false; }
  }
  U.ensure = ensure;
  U.hasPilot = hasPilot;
  U.genuineLoadError = genuineLoadError;

  try {
    const bpm = buildPlayerModel;
    window.buildPlayerModel = buildPlayerModel = function () {
      const model = bpm.apply(this, arguments);
      try { ensure(model); } catch (e) { ERR('bpm', e); }
      return model;
    };
  } catch (e) { ERR('bpmw', e); }

  function tickEnsure() {
    try {
      if (typeof worldModel !== 'undefined') ensure(worldModel);
      if (typeof charModel !== 'undefined') ensure(charModel);
    } catch (e) { ERR('tick', e); }
  }
  U.tickEnsure = tickEnsure;
  try {
    [0, 200, 800, 1600, 3200].forEach(t => setTimeout(tickEnsure, t));
    setInterval(tickEnsure, 750);
  } catch (e) { ERR('iv', e); }
})();
