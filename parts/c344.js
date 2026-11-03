/* GLX-C344 (v1.1.49): LT with a gun only aims. While a gun is held, nothing the use button does can place a block. */
(function c344() {
  const U = window.__c344 = {err: null, blocked: 0};
  const gunHeld = () => { try { return !!(typeof GUN !== 'undefined' && GUN[selId] && cnt(selId) > 0); } catch (_) { return false; } };
  let inUse = 0;
  try { const ui0 = useItem; useItem = function () { if (!gunHeld()) return ui0.apply(this, arguments); inUse++; try { return ui0.apply(this, arguments); } finally { inUse--; } }; } catch (e) { U.err = 'ui ' + e; }
  try { const sb0 = setB; setB = function (x, y, z, v) { if (inUse && gunHeld() && v) { U.blocked++; return; } return sb0.apply(this, arguments); }; } catch (e) { U.err = 'sb ' + e; }
})();
