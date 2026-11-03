/* v1.1.52: IDLE TORCH LIGHTS OFF. The game keeps a pool of point lights for torches, lamps and lava near you. When every one of them is at
   zero brightness they still cost a loop in the shader of every block and mob on screen. While all are dark for two seconds they are switched
   off (nothing changes on screen); the moment any one glows they all switch back on. Phones gain about two frames a second. */
(function idleLights() {
  const U = window.__idleL = {err: null, off: 0, n: 0};
  let L = null, dark = 0, last = performance.now(), scan = 0; const MINE = new Set();
  const find = () => { L = []; scene.traverse(o => { if (o.isPointLight && (o.visible || MINE.has(o))) L.push(o); }); U.n = L.length; };
  try { const rd = renderer.render; renderer.render = function (s) { try { if (s === scene) { const now = performance.now(), dt = now - last; last = now;
        if (!L || (scan += dt) > 3000) { scan = 0; find(); }
        let lit = false; for (const o of L) if (o.intensity > 0.001) { lit = true; break; }
        if (lit) { dark = 0; if (U.off) { U.off = 0; for (const o of MINE) o.visible = true; MINE.clear(); } }
        else if (!U.off && (dark += dt) > 2000) { U.off = 1; for (const o of L) if (o.visible) { o.visible = false; MINE.add(o); } } } } catch (e) { if (!U.err) U.err = String(e).slice(0, 200); }
      return rd.apply(this, arguments); }; } catch (e) { U.err = 'wrap ' + e; }
})();
