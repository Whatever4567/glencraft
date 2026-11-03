/* GLX-C284 (v1.0.93): alien abduction fades out every game, biome and desert tune and plays the trippy alien music, then the normal music comes back;
   YEAR 24000 is the real desert and pyramid around you turned solid shiny silver (block shader), with no see-through overlays. */
(function c284() {
  const U = window.__c284 = {err: null, abd: 0, fut: 0, opq: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const abducted = () => { try { return !!((window.__c246b && __c246b.on) || (window.__c248 && __c248.y === 1)); } catch (_) { return false; } };
  try { const am = applyMusicVol; applyMusicVol = function () { const l = musicLvl; musicLvl = l * (1 - U.abd); try { return am.apply(this, arguments); } finally { musicLvl = l; } }; } catch (e) { ERR('amv', e); }
  let last = performance.now(), was = 0;
  setInterval(() => { try { const now = performance.now(), dt = Math.min(0.5, (now - last) / 1000); last = now; const a = abducted();
      const p = U.abd; U.abd += Math.max(-dt / 3, Math.min(dt / 2.5, (a ? 1 : 0) - U.abd)); if (U.abd !== p) { try { applyMusicVol(); } catch (_) {} }
      if (a && !was && window.__c248 && __c248.music) { try { __c248.music(); } catch (_) {} }
      if (!a && was && window.__c248 && __c248.stopMusic) { try { __c248.stopMusic(); } catch (_) {} }
      was = a ? 1 : 0;
      // YEAR 24000: silver blocks, opaque props
      const y24 = !!(window.__c248 && __c248.y === 1), F = window.__c282 && __c282.uFut; U.fut += ((y24 ? 1 : 0) - U.fut) * Math.min(1, dt * 1.5); if (U.fut < 0.002) U.fut = 0; if (F) F.value = U.fut;
      if (y24) { try { if (scene.fog) { scene.fog.color.setRGB(0.42, 0.45, 0.55); if (!scene.fog.isFogExp2) { scene.fog.near = Math.max(scene.fog.near, 60); scene.fog.far = Math.max(scene.fog.far, 260); } } } catch (_) {} }
      if (y24) { const G = __c248.g; if (G) G.traverse(o => { if (!o.isMesh || o.userData.c284) return; o.userData.c284 = 1;
          if (o.geometry && o.geometry.type === 'CircleGeometry') { o.visible = false; return; } /* the real dunes show, not a flat disc */
          for (const m of [].concat(o.material || [])) { if (!m || m.isSpriteMaterial || m.isPointsMaterial || m.blending === THREE.AdditiveBlending) continue; if (m.transparent) { m.transparent = false; m.opacity = 1; m.depthWrite = true; m.needsUpdate = true; U.opq++; } } }); } } catch (e) { ERR('t', e); } }, 100);
})();
