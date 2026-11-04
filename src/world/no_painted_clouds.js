/* GLX-NOCL (v1.1.55): the clouds stay off everywhere, phones included: the painted cloud layer in the sky is switched off every frame
   (the plain sky colours, sun, moon and stars stay).
   v1.1.56: below Y0 (not in Agartha, which has its own sun) the daylight fades out, so deep stone is not lit like the surface. */
(function nocl() { let dk = 0; try { const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { if (skyUniforms.texK) skyUniforms.texK.value = 0; } catch (_) {}
  try { const t = started && !DIM.cur && P.y < 1 && !(window.__c298 && __c298.sky) ? Math.min(1, (1 - P.y) / 6) : 0; dk += (t - dk) * Math.min(1, (dt || 0.016) * 3);
    if (dk > 0.01) { hemi.intensity *= 1 - 0.55 * dk; sunL.intensity *= 1 - 0.85 * dk; } } catch (_) {} return r; }; } catch (_) {} })();
