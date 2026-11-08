/* GLX-VAC1224 (v1.2.24): space is silent. One test for "in the vacuum of space" (the flat Earth's own space height, GLX-C320 space(),
   outside any realm), used by the nature sounds: outdoor birds, planes, owls and wind (GLX-UKS), the nature ambience music (GLX-C132),
   the rain bed and thunder (GLX-WX1222) and the snow hush. They fade out above the space line and come back when you return to Earth.
   UI clicks, the time box and machine sounds, guns, tools and your own actions are not touched. */
(function vac1224() {
  const U = window.__vac1224 = {err: null, on: 0, flips: 0};
  window.__vac = () => { try { if (typeof DIM !== 'undefined' && DIM.cur) return false; const e = window.__c320; const v = !!(e && typeof e.space === 'function' && typeof P !== 'undefined' && e.space(P.x, P.y, P.z)); if (v !== !!U.on) { U.on = v ? 1 : 0; U.flips++; } return v; } catch (e) { if (!U.err) U.err = String(e).slice(0, 200); return false; } };
})();
