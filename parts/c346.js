/* GLX-C346 (v1.1.49): THE REAL BLOCKS FROM THE AIR. No stand-in ground: when you fly up the game keeps drawing the real block chunks and
   sees further the higher you are (up to 300 blocks round you on a phone, 700 on a computer), with the haze pushed out to match. */
(function c346() {
  const U = window.__c346 = {err: null, R: 0, far: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const PH = () => /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || (typeof PERF !== 'undefined' && PERF);
  try { const rd = renderer.render; renderer.render = function (s, c) { if (s !== scene || !c || !c.isPerspectiveCamera || typeof started === 'undefined' || !started || DIM.cur || !s.fog) return rd.apply(this, arguments);
      let f0 = null, cf = 0, hh = null; try { if (typeof held !== 'undefined' && held && held.visible && MODE.fly && flying && P.pitch < -1.1) { hh = held; held.visible = false; } const hi = Math.max(P.y, c.position.y) - SEA; if (hi > 30) {
          const base = s.fog.far, R = Math.min(PH() ? 300 : 700, Math.max(base, base + (hi - 30) * 1.6)); U.R = R | 0;
          f0 = [s.fog.near, s.fog.far]; s.fog.far = R; s.fog.near = R * 0.6; cf = c.far; const need = Math.hypot(R, hi) + 40; if (c.far < need) { c.far = need; c.updateProjectionMatrix(); } U.far = c.far | 0; } else { U.R = 0; U.why = [Math.round(hi), !!(window.__c317 && __c317.space)]; } } catch (e) { ERR('pre', e); }
      try { return rd.apply(this, arguments); } finally { if (hh) hh.visible = true; if (f0) { s.fog.near = f0[0]; s.fog.far = f0[1]; } if (cf && c.far !== cf) { c.far = cf; c.updateProjectionMatrix(); } } }; } catch (e) { ERR('rw', e); }
  const FR = new THREE.Frustum(), MM = new THREE.Matrix4(), BX = new THREE.Box3();
  try { const cc0 = cullChunks; cullChunks = function (cam) { const r = cc0.apply(this, arguments); try { if (!U.R) return r; MM.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); FR.setFromProjectionMatrix(MM);
        const px = cam.position.x, pz = cam.position.z, R2 = U.R * U.R; let n = 0;
        for (const [id, g] of chunkObjs) { if (g.visible) { n++; continue; } const x0 = Math.floor(id / 64) * CH, z0 = (id % 64) * CH, dx = Math.max(0, x0 - px, px - x0 - CH), dz = Math.max(0, z0 - pz, pz - z0 - CH);
          if (dx * dx + dz * dz > R2) continue; BX.min.set(x0 - 1, -64, z0 - 1); BX.max.set(x0 + CH + 1, H, z0 + CH + 1); if (!FR.intersectsBox(BX)) continue; g.visible = true; n++;
          }
        U.vis = n; } catch (e) { ERR('cull', e); } return r; }; } catch (e) { ERR('cc', e); }
  try { const sr0 = streamRadius; streamRadius = function () { const a = sr0.apply(this, arguments); return U.R ? Math.max(a, U.R / CH + 0.5) : a; }; } catch (e) { ERR('sr', e); }
})();
