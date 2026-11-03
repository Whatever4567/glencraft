/* GLX-C343 (v1.1.48): REAL LAND FROM THE AIR. The painted map picture is gone, so what you see from high up and far away is a simple
   low-detail mesh built from the real ground: inside the map it is read from the actual blocks (your builds included, refreshed a few
   seconds after blocks change), outside it uses the same terrain as the blocks you walk on. Near you the normal blocks draw over it. */
(function c343() {
  const U = window.__c343 = {err: null, wRows: 0, oRows: 0, rebuilt: 0, on: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const SW = 4, SO = 24;
  const C = {}; const cof = b => { if (C[b]) return C[b]; let c = [70, 122, 56];
    if (b === T.WATER) c = [47, 109, 176]; else if (b === T.SAND) c = [214, 196, 140]; else if (b === T.STONE || b === T.GRAVEL || b === T.COBBLE) c = [128, 128, 122]; else if (b === T.HEATHER) c = [120, 92, 118];
    else if (b === T.PACKSNOW || b === T.SNOW || b === T.ICE) c = [236, 241, 246]; else if (b === T.BLACKSTONE) c = [48, 45, 52]; else if (b === T.DEEPSLATE) c = [72, 72, 78]; else if (b === T.LAVA || b === T.MAGMA) c = [235, 95, 25];
    else if (b === T.DIRT || b === T.PEAT || b === T.MUD || b === T.PODZOL) c = [110, 84, 60]; else if (/LEAVES/.test(NAMES && NAMES[b] || '') || b === T.LEAVES) c = [44, 88, 42]; else if (b === T.GRASS) c = [70, 122, 56]; else c = [150, 140, 128];
    return (C[b] = c.map(v => v / 255)); };
  const KC = {1: [70, 122, 56], 2: [236, 241, 246], 0: [214, 196, 140], 10: [120, 92, 118], 11: [128, 128, 122], 12: [48, 45, 52], 15: [235, 95, 25], 3: [214, 196, 140]};
  let G = null, wG = null, oG = null, wr = 0, orr = 0, dirty = 0, last = 0, ON = 0, OX = 0, OZ = 0;
  const uC = {value: new THREE.Vector3()}, uRn = {value: 0};
  const mat = new THREE.MeshBasicMaterial({vertexColors: true, fog: false});
  mat.onBeforeCompile = sh => { sh.uniforms.uC = uC; sh.uniforms.uRn = uRn;
    sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying vec3 vW343;\nvoid main() {').replace('#include <project_vertex>', '#include <project_vertex>\nvW343 = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform vec3 uC; uniform float uRn; varying vec3 vW343;\nvoid main() {\nif (length(vW343.xz - uC.xz) < uRn) discard;'); };
  function grid(nx, nz) { const g = new THREE.BufferGeometry(), n = nx * nz; g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const ix = new Uint32Array((nx - 1) * (nz - 1) * 6); let k = 0; for (let i = 0; i < nx - 1; i++) for (let j = 0; j < nz - 1; j++) { const a = i * nz + j, b = a + nz; ix[k++] = a; ix[k++] = a + 1; ix[k++] = b; ix[k++] = b; ix[k++] = a + 1; ix[k++] = b + 1; }
    g.setIndex(new THREE.BufferAttribute(ix, 1)); return g; }
  const topB = (x, z) => { for (let y = H - 2; y > 1; y--) { const b = getB(x, y, z); if (b) return [b, y]; } return [T.STONE, 1]; };
  function build() { const c = window.__c339; if (!c || !c.IR) return; G = new THREE.Group(); G.name = 'lod343'; G.userData.sys = 1;
    const nwx = Math.floor((W - 1) / SW) + 1, nwz = Math.floor((D - 1) / SW) + 1; wG = new THREE.Mesh(grid(nwx, nwz), mat); wG.userData = {nx: nwx, nz: nwz, sys: 1}; wr = 0;
    const R = c.IR, cx = W >> 1, cz = (D >> 1) + 885 * (c.K / 300); OX = cx - R; OZ = cz - R; ON = Math.floor(2 * R / SO) + 1; oG = new THREE.Mesh(grid(ON, ON), mat); oG.userData = {nx: ON, nz: ON, sys: 1}; orr = 0;
    for (const m of [wG, oG]) { m.frustumCulled = false; G.add(m); } LS.add(G); U.on = 1; }
  function wRow(i) { const g = wG.geometry, p = g.attributes.position.array, cl = g.attributes.color.array, nz = wG.userData.nz, x = Math.min(W - 1, i * SW);
    for (let j = 0; j < nz; j++) { const z = Math.min(D - 1, j * SW), t = topB(x, z), o = (i * nz + j) * 3, cc = cof(t[0]), sh = t[0] === T.WATER ? 1 : 0.82 + 0.18 * Math.min(1, Math.max(0, (t[1] - SEA) / 40));
      p[o] = x + 0.5; p[o + 1] = t[1] + 0.4; p[o + 2] = z + 0.5; cl[o] = cc[0] * sh; cl[o + 1] = cc[1] * sh; cl[o + 2] = cc[2] * sh; } }
  function oRow(i) { const e = window.__c320, g = oG.geometry, p = g.attributes.position.array, cl = g.attributes.color.array, x = OX + i * SO, cx = W >> 1, cz = OZ + (ON - 1) * SO / 2, R = window.__c339.IR;
    for (let j = 0; j < ON; j++) { const z = OZ + j * SO, o = (i * ON + j) * 3; let y = SEA - 3, cc = [0.18, 0.43, 0.69];
      const inW = x >= -SO && x < W + SO && z >= -SO && z < D + SO, far = Math.hypot(x - cx, z - cz) > R;
      if (!far && !inW) { const q = e.ground(x, SEA, z, 0, 1, 0), gg = q[0]; if (gg > 0) { y = SEA + gg - 0.6; let k = KC[q[1]] || KC[1]; try { const tb = q[1] >= 30 ? e.layer(e.R || 5000, 0.5, q[1], x, SEA + gg, z) : 0; if (tb) k = cof(tb); } catch (_) {} const sh = 0.8 + 0.2 * Math.min(1, gg / 40); cc = k.map(v => v / 255 * sh); } else y = SEA - 0.3; }
      else if (inW) y = SEA - 6; else y = SEA - 2;
      p[o] = x; p[o + 1] = y; p[o + 2] = z; cl[o] = cc[0]; cl[o + 1] = cc[1]; cl[o + 2] = cc[2]; } }
  try { const sb = setB; setB = function () { dirty = 1; return sb.apply(this, arguments); }; } catch (e) { ERR('sb', e); }
  (function loop() { requestAnimationFrame(loop); try { if (typeof started === 'undefined' || !started || DIM.cur || !(window.__c320 && __c320.flat) || !window.__c342 || !__c320.g342) { if (G) G.visible = false; return; }
      if (!U.hk && window.__c339 && __c339.fresh) { U.hk = 1; const f0 = __c339.fresh; __c339.fresh = function () { U.fresh(); return f0.apply(this, arguments); }; }
      if (!G) build(); if (!G) return; const t0 = performance.now();
      while (wr < wG.userData.nx && performance.now() - t0 < 3) wRow(wr++); if (wr >= wG.userData.nx && U.wRows !== wr) { U.wRows = wr; for (const a of ['position', 'color']) wG.geometry.attributes[a].needsUpdate = true; wG.geometry.computeVertexNormals(); }
      while (wr >= wG.userData.nx && orr < ON && performance.now() - t0 < 3) oRow(orr++); if (orr >= ON && U.oRows !== orr) { U.oRows = orr; for (const a of ['position', 'color']) oG.geometry.attributes[a].needsUpdate = true; oG.geometry.computeVertexNormals(); }
      if (dirty && t0 - last > 8000 && wr >= wG.userData.nx) { dirty = 0; last = t0; wr = 0; U.wRows = 0; U.rebuilt++; }
      const w = window.__c321 ? __c321.pw() : P, hi = w.y - SEA; G.visible = w.y > SEA - 20; const PH = /Android|iPhone|iPad/i.test(navigator.userAgent) || (typeof PERF !== 'undefined' && PERF);
      uC.value.set(w.x, w.y, w.z); uRn.value = hi > 90 ? 0 : ((PH ? 2 : 3) + 0.5) * CH; } catch (e) { ERR('loop', e); } })();
  const LS = new THREE.Scene(); LS.add(new THREE.HemisphereLight(0xffffff, 0x667766, 0.9)); { const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(1, 2, 1); LS.add(dl); }
  const DF = new THREE.Fog(0x87b8e8, 1e6, 2e6);
  const lc = new THREE.PerspectiveCamera(70, 1, 1, 30000); U.passes = 0;
  try { const rd = renderer.render; renderer.render = function (s, c) { if (s !== scene || !G || !U.on || !c || !c.isPerspectiveCamera) return rd.apply(this, arguments);
      let ac, bg, hid = []; try { const w = window.__c321 ? __c321.pw() : P, F = window.__c317 && __c317.FAR;
        if (window.__c317 && __c317.space && F) { if (G.parent !== F) F.add(G); return rd.apply(this, arguments); } if (G.parent !== LS) LS.add(G);
        if (w.y - SEA < 60) return rd.apply(this, arguments);
        lc.position.copy(c.position); lc.quaternion.copy(c.quaternion); if (lc.fov !== c.fov || lc.aspect !== c.aspect) { lc.fov = c.fov; lc.aspect = c.aspect; lc.updateProjectionMatrix(); } lc.updateMatrixWorld(true);
        bg = scene.background; LS.background = bg && bg.isColor ? bg : new THREE.Color(0x87b8e8); ac = renderer.autoClear; renderer.autoClear = true; { const f0 = scene.fog; if (!f0) scene.fog = DF; try { rd.call(this, LS, lc); } finally { scene.fog = f0; } } U.passes++;
        for (const o of [window.skyDome, window.stars]) if (o && o.visible) { o.visible = false; hid.push(o); } try { if (typeof skyDome !== 'undefined' && skyDome.visible) { skyDome.visible = false; hid.push(skyDome); } } catch (_) {}
        renderer.autoClear = false; renderer.clearDepth(); } catch (e) { ERR('pass', e); return rd.apply(this, arguments); }
      try { return rd.apply(this, arguments); } finally { scene.background = bg; renderer.autoClear = ac === undefined ? true : ac; for (const o of hid) o.visible = true; } }; } catch (e) { ERR('rw', e); }
  U.fresh = () => { wr = 0; orr = 0; U.wRows = U.oRows = 0; };
})();
