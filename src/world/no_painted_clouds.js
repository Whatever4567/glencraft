/* GLX-NOCL (v1.1.55): the clouds stay off everywhere, phones included: the painted cloud layer in the sky is switched off every frame
   (the plain sky colours, sun, moon and stars stay). */
(function nocl() { try { const us = updateSky; updateSky = function () { const r = us.apply(this, arguments); try { if (skyUniforms.texK) skyUniforms.texK.value = 0; } catch (_) {} return r; }; } catch (_) {} })();
