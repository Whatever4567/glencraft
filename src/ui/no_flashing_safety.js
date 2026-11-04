/* GLX-SAFE (v1.1.90): NO FLASHING SCREEN, EVER. A safety guard for photosensitive players.
   In Agartha two systems fought over the haze colour every frame (the Agartha warm haze and the dark cave haze), so the view flashed light
   and dark many times a second. Agartha now owns its sky while you are inside it, and on top of that this guard sits just before every
   frame is drawn: the sky colour, the haze colour and the strength of the main lights can only ease towards a new value (they take about
   a third of a second), so nothing can make the whole screen flash faster than about 3 times a second, anywhere in the game. */
(function safe() {
  const U = window.__safe = {err: null, on: 1, clamped: 0};
  const TAU = 0.16; let last = performance.now();
  const sm = new Map(); const keyOf = (o, k) => o.uuid ? o.uuid + k : k;
  const cs = [], ls = [];
  function smoothColor(c, k, a) { if (!c || !c.isColor) return null; let s = sm.get(k); const t = c.clone(); if (!s) { s = c.clone(); sm.set(k, s); return [c, t]; }
    if (Math.abs(s.r - t.r) + Math.abs(s.g - t.g) + Math.abs(s.b - t.b) > 0.02) U.clamped++; s.lerp(t, a); c.copy(s); return [c, t]; }
  try { const rd = renderer.render; renderer.render = function (s, cam) { if (s !== scene || !U.on) return rd.apply(this, arguments);
      const now = performance.now(), dt = Math.min(0.25, (now - last) / 1000); last = now; const a = 1 - Math.exp(-dt / TAU); cs.length = 0; ls.length = 0;
      try { if (window.__c295 && __c295.sky && !DIM.cur) __c295.sky(); } catch (_) {}
      try { const b = scene.background; if (b && b.isColor) { const r = smoothColor(b, 'bg', a); if (r) cs.push(r); }
        if (scene.fog) { const r = smoothColor(scene.fog.color, 'fog', a); if (r) cs.push(r); }
        for (const o of scene.children) if (o.isAmbientLight || o.isHemisphereLight || o.isDirectionalLight) { const k = keyOf(o, 'i'), t = o.intensity; let v = sm.get(k); if (v === undefined) v = t; else v += (t - v) * a; sm.set(k, v); ls.push([o, t]); o.intensity = v;
          const r = smoothColor(o.color, keyOf(o, 'c'), a); if (r) cs.push(r); } } catch (e) { if (!U.err) U.err = String(e).slice(0, 200); }
      try { U.bg = scene.background && scene.background.isColor ? scene.background.getHex() : -1; U.fog = scene.fog ? scene.fog.color.getHex() : -1; } catch (_) {}
      try { return rd.apply(this, arguments); } finally { for (const [c, t] of cs) c.copy(t); for (const [o, t] of ls) o.intensity = t; } }; } catch (e) { U.err = 'wrap ' + e; }
})();
