/* ===================== GLX-C250 (v1.0.62): a big detailed Moon (NASA LRO nearside photo, public domain) about 2.8x the biggest planet with a soft halo, phases kept;
   clouds fade out smoothly over the desert (clear desert sky) and back in outside, instead of popping away in the sandstorm haze ===================== */
(function c250() {
  const U = window.__c250 = {err: null, moon: 0, cl: 0, dust: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ': ' + (e && e.message || e); };
  const MS = 2.8 * 9 / 85 * 90 / (2 * 3.4); // moon diameter = 2.8 x Jupiter's 9 at 85, moon disc r 3.4 at 90
  try { (window.__AM=window.__AM||(f=>{const w=()=>(typeof screen==='string'&&screen!=='boot')?setTimeout(f,400):setTimeout(w,150);w();}))(() => new THREE.TextureLoader().load('assets/sky/moon.png', t => { moonDisc.material.map = t; moonDisc.material.needsUpdate = true; U.moon = 1; })); } catch (e) { ERR('moon', e); }
  const DUST = new THREE.Color(0xd9bf94), hooked = new WeakSet(); let ht = 0, saved = null, fadeK = 1;
  function hook() { scene.traverse(o => { if (o.isMesh && o.material === cloudMat && !hooked.has(o)) { hooked.add(o); U.cl++;
      o.onBeforeRender = () => { try { const f = scene.fog, w = window.__c243; if (!f || f.isFogExp2 || !w || !(w.storm > 0.01) || !w.baseFar) return; saved = [f.near, f.far]; f.far = Math.max(f.far, w.baseFar); f.near = Math.min(saved[0], f.far * 0.5); } catch (_) {} };
      o.onAfterRender = () => { if (saved) { try { scene.fog.near = saved[0]; scene.fog.far = saved[1]; } catch (_) {} saved = null; } }; } }); }
  function frame(dt) { if (!started) return; if ((ht -= dt) <= 0) { ht = 3; hook(); }
    const n = fullMoon() ? 1.35 : 0.9; moonDisc.scale.multiplyScalar(MS); // v1.0.64: moon only at night - rises at dusk, sets at dawn, fully hidden by day
    const mk = DIM.cur ? 1 : Math.max(0, Math.min(1, (0.45 - daylight) / 0.3)), up = moonDisc.position.y - camera.position.y > -4; U.mk = +mk.toFixed(2);
    if (!(mk > 0.02 && up) || DIM.cur === 'moon' || DIM.cur === 'mars') { moonDisc.visible = false; try { moonHalo.visible = false; } catch (_) {} } else { moonDisc.material.transparent = true; moonDisc.material.opacity = mk; try { if (moonHalo.material) moonHalo.material.opacity = Math.min(moonHalo.material.opacity, mk); } catch (_) {} }
    try { moonHalo.scale.setScalar(26 * MS * 0.9 * n); } catch (_) {}
    // v1.0.62: the desert sky is clear - clouds fade out smoothly (about 8-10 s) as you cross into the desert and fade back in when you leave
    const w = window.__c243, dk = w && w.dK ? +w.dK() || 0 : 0, tgt = 1 - Math.max(0, Math.min(1, dk / 0.6)); fadeK += (tgt - fadeK) * Math.min(1, dt / 3); if (Math.abs(tgt - fadeK) < 0.002) fadeK = tgt; U.fade = +fadeK.toFixed(2);
    if (!(typeof DIM !== 'undefined' && DIM.cur)) { cloudMat.opacity *= fadeK; const v = cloudMat.opacity > 0.01; if (cloudMat.visible !== v) cloudMat.visible = v; } }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { frame(Math.min(0.25, +dt || 0.016)); } catch (e) { ERR('fr', e); } return r; };
})();
