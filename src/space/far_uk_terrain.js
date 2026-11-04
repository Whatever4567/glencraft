/* GLX-FUK (v1.1.66): THE UK FROM SPACE AND THE MOON (item 44). Out past the map the UK was only drawn as real blocks near you, so from high
   up or from the Moon it vanished. Now a light long range terrain mesh is built from the real world heightmap and block colours (the same
   ground the chunks use, top surface only, one merged mesh, built a bit at a time). It only shows when you are high up or in space, never
   near the ground, and the camera far plane is raised while it is in view so nothing is cut off. */
(function () {
  const U = window.__fuk = {err: null, rows: 0, done: false, shown: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent) || (typeof PERF !== 'undefined' && PERF), ST = PH ? 24 : 16;
  const X0 = -1500, X1 = 1760, Z0 = -720, Z1 = 2740, NX = Math.ceil((X1 - X0) / ST) + 1, NZ = Math.ceil((Z1 - Z0) / ST) + 1;
  const CC = {}, rgb = h => [(h >> 16) / 255, (h >> 8 & 255) / 255, (h & 255) / 255], SEAC = [0.16, 0.34, 0.55];
  function colB(b) { if (CC[b]) return CC[b]; let c = null; try { if (b === T.GRASS) c = [0.34, 0.55, 0.24]; else if (/snow|ice/i.test(NAMES[b] || '')) c = [0.9, 0.93, 0.97]; else { const f = FACES[b], k = f && [].concat(f)[0], a = AVG[k]; if (a !== undefined) c = rgb(a); } } catch (_) {} return (CC[b] = c || [0.45, 0.48, 0.4]); }
  let mesh = null, pos = null, colA = null, row = 0;
  function make() { const g = new THREE.BufferGeometry(); pos = new Float32Array(NX * NZ * 3); colA = new Float32Array(NX * NZ * 3); const ix = [];
    for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i; ix.push(a, a + NX, a + 1, a + 1, a + NX, a + NX + 1); }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const k = (j * NX + i) * 3; pos[k] = X0 + i * ST; pos[k + 1] = SEA - 0.2; pos[k + 2] = Z0 + j * ST; colA[k] = SEAC[0]; colA[k + 1] = SEAC[1]; colA[k + 2] = SEAC[2]; }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colA, 3)); g.setIndex(ix);
    mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({vertexColors: true, fog: false})); mesh.name = 'farUK'; mesh.frustumCulled = false; mesh.visible = false; mesh.renderOrder = -3; scene.add(mesh); }
  function rows(n) { const C = window.__c339; if (!C || !C.col) return; for (let r = 0; r < n && row < NZ; r++, row++) { for (let i = 0; i < NX; i++) { const x = X0 + i * ST, z = Z0 + row * ST, k = (row * NX + i) * 3;
        if (x > -8 && x < W + 8 && z > -8 && z < D + 8) { pos[k + 1] = SEA - 6; continue; }   // the map draws itself
        let g; try { g = C.col(x, z); } catch (_) { g = [-5, 0]; } const h = g[0]; if (h <= 0) { pos[k + 1] = SEA - 0.2; continue; }
        pos[k + 1] = SEA + h; const c = colB(g[1]), s = 0.85 + Math.min(0.3, h / 120); colA[k] = c[0] * s; colA[k + 1] = c[1] * s; colA[k + 2] = c[2] * s; } }
    U.rows = row; mesh.geometry.attributes.position.needsUpdate = true; mesh.geometry.attributes.color.needsUpdate = true; if (row >= NZ) { U.done = true; mesh.geometry.computeBoundingSphere(); } }
  let wFor = null;
  setInterval(() => { try { if (typeof started === 'undefined' || !started) return; const e = window.__c320; if (!e || !e.flat) { if (mesh) mesh.visible = false; return; }
      if (!mesh) make(); if (world !== wFor) { wFor = world; row = 0; U.done = false; } if (!U.done) rows(PH ? 3 : 6); } catch (e) { ERR('b', e); } }, 120);
  const want = c => { try { if (!mesh || DIM.cur) return false; const y = c.getWorldPosition(new THREE.Vector3()).y; return y > SEA + 140; } catch (_) { return false; } };
  try { const rd = renderer.render; renderer.render = function (s, c) { if (s !== scene || !mesh) return rd.apply(this, arguments); const on = want(c); mesh.visible = on; let f0 = 0;
      if (on && c && c.far < 9000) { f0 = c.far; c.far = 9000; c.updateProjectionMatrix(); U.shown++; }
      try { return rd.apply(this, arguments); } finally { if (f0) { c.far = f0; c.updateProjectionMatrix(); } } }; } catch (e) { ERR('wrap', e); }
})();
