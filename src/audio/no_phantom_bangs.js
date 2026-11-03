/* GLX-C330 (v1.1.35): NO PHANTOM BANGS. Explosion and thunder sounds only play for something real near you. The saucer leaving at dawn used to
   boom wherever you were (fixed in C246); on top of that, while you are in space or inside Agartha a boom only plays if a real blast just
   happened next to you (your bomb, a creeper, your gun), and storm thunder never plays there. */
(function c330() {
  const U = window.__c330 = {blocked: 0, err: null};
  const away = () => { try { if (window.__c317 && __c317.on() && (MXd() > 0)) return 'space'; } catch (_) {} try { if (window.__c332 && __c332.where()) return 'deep'; } catch (_) {} try { if (window.__c295 && __c295.inside === true) return 'agartha'; if (P.z < 0 && P.y < SEA - 6) return 'tunnel'; } catch (_) {} return ''; };
  function MXd() { try { const c = __c320.E(), R = 5000; return Math.max(Math.abs(P.x - c[0]), Math.abs(P.y - c[1]), Math.abs(P.z - c[2])) - R - 300; } catch (_) { return 1; } }
  let gunT = 0, seen = 0; const cnt = () => ((window.__c119 && __c119.booms) || 0) + ((window.__c116 && __c116.booms) || 0);
  try { const gb = gunBang; gunBang = function () { gunT = performance.now(); return gb.apply(this, arguments); }; } catch (e) { U.err = 'gun ' + e; }
  try { const sf = sfx; sfx = function (k) { if (k === 'boom' || k === 'thunder') { const w = away(); if (w) { const c = cnt(), real = k === 'boom' && (c !== seen || performance.now() - gunT < 400); seen = c; if (!real) { U.blocked++; U.last = k + ' ' + w; return; } } } return sf.apply(this, arguments); }; } catch (e) { U.err = 'sfx ' + e; }
})();
