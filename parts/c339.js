/* GLX-C339 (v1.1.44): THE UK. Earth is now just Great Britain and Ireland on a normal flat world, with Glencraft laid onto Scotland and its spawn
   unchanged, then open sea all round and a field of sea ice past it. No globe, no disc, no dome. Agartha and the saucer home are on a small
   snowy island far north of Scotland. Under the land the diggable layers, the caves and Agartha are still there, and under them the hollow
   Earth. The Moon and Mars are still round and work exactly as before. */
(function c339() {
  const U = window.__c339 = {err: null, px: 0, tex: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const K = U.K = 300, LAT0 = U.LAT0 = 57.45, LON0 = U.LON0 = -3.75, RD = U.RD = 1e9, WT = 0, WH = 0, IR = U.IR = 2600, OR = U.OR = 3100, UZ = 885;
  const E = () => window.__c320, big = () => { try { return !!(window.__c317 && __c317.on()); } catch (_) { return false; } };
  let PX = 0, PZ = 0; const e3flat = () => { const e = E(); return !!(e && e.flat); };
  // map spot -> latitude and longitude (polar map, magnified round Glencraft)
  function fll(x, z) { const lat = LAT0 - (z - (D >> 1)) / K, lon = LON0 + (x - (W >> 1)) / (K * Math.cos(lat * Math.PI / 180));
    if (lat < 49.85 || lat > 61.2 || lon < -11 || lon > 2.2 || (lat < 51.1 && lon > 1.45)) return [0, -150]; return [lat, lon]; }
  const dU = (x, z) => Math.hypot(x + 0.5 - (W >> 1), z + 0.5 - ((D >> 1) + UZ));
  U.fll = fll; U.col = (x, z) => col(x, z); U.pix = (x, z) => { const s = 2 * IA / IN, i = Math.floor((x - (W >> 1) + IA) / s), j = Math.floor((z - (D >> 1) - UZ + IA) / s), o = (j * IN + i) * 4; return [iimg.data[o], iimg.data[o + 1], iimg.data[o + 2], iimg.data[o + 3], irow]; }; U.fresh = () => { GC.clear(); const e = E(); try { e && e.edgeClr && e.edgeClr(); } catch (_) {} try { __c324.cache.clear(); } catch (_) {} if (e) e.dirty = 1; irow = 0; }; U.fe = (x, y, z) => fearth(x, y, z);
  const GC = new Map(); const col = (x, z) => { const k = x * 131072 + z; let g = GC.get(k); if (!g) { g = E().ground(x, SEA, z, 0, 1, 0); GC.set(k, g); if (GC.size > 300000) GC.clear(); } return g; };
  const DS = () => T.DEEPSLATE || T.STONE, ICE = () => T.PACKSNOW || T.ICE || T.SNOW;
  function hollow(x, y, z, d) { if (d < 1000) return DS(); const C2 = window.__c332, ig = C2 && C2.ig ? C2.ig(x, SEA, z, 0) : 2, top = 1200 - ig;
    if (d < top) return d > 1200 ? T.WATER : 0; const dd = d - top; if (d > 1450) return 0;
    if (dd < 1) { const sh = C2 && C2.SH && C2.SH(); if (sh && Math.abs(x - sh.x - 14) <= 1 && Math.abs(z - sh.z) <= 1) return T.GLOWROCK || T.LAMP; return ig < 0.6 ? T.SAND : T.GRASS; } return dd < 4 ? (ig < 0.6 ? T.SAND : T.DIRT) : dd > 60 ? DS() : T.STONE; }
  function fearth(x, y, z) { try { const e = E(), a = y - SEA, dP = Math.hypot(x + 0.5 - PX, z + 0.5 - PZ);
      if (dP >= RD) return dP < RD + WT && a < WH && a > -60 ? ICE() : 0;
      { const u = dU(x, z); if (u > OR) return 0; if (a < 0 && a >= -2 && u > IR) return ICE(); }
      if (a >= -40 && a < 40 && e.pit) { const q = e.pit(x, y, z); if (q !== undefined) return q; }
      if (a > 32) return 0;
      if (a >= -40) { const g = col(x, z); if (a < g[0]) return e.layer(e.R, g[0] - a, g[1], x, y, z); return a < 0 ? T.WATER : 0; }
      const d = -a; if (d < 930 && e.hol) return e.hol(x, y, z, 0, e.R - d, 0, e.R - d); return hollow(x, y, z, d); } catch (er) { ERR('fe', er); return 0; } }
  // ---------- drawing: the sea, the painted continents far away, the ice wall and the dome ----------
  let built = '', G = null, FG = null;
  const uC = {value: new THREE.Vector3()}, uRn = {value: 56};
  const IA = 3200, IN = 768; let icv = null, ictx = null, iimg = null, itx = null, irow = 0;
  const topB = (x, z) => { for (let y = SEA + 40; y > SEA - 12; y--) { const b = getB(x, y, z); if (b && b !== T.WATER && !(T.LEAVES && b === T.LEAVES && y > SEA + 30)) return [b, y]; if (b === T.WATER) return [T.WATER, y]; } return [T.WATER, SEA]; };
  function paintIn(t0) { if (!U.paint) { irow = IN; return; } const s = 2 * IA / IN, cx = W >> 1, cz = (D >> 1) + UZ, d = iimg.data; while (irow < IN && performance.now() - t0 < 4) { const z = cz - IA + (irow + 0.5) * s;
      for (let i = 0; i < IN; i++) { const x = cx - IA + (i + 0.5) * s, o = (irow * IN + i) * 4; let c = null;
        if (x >= 0 && x < W && z >= 0 && z < D) { const t = topB(Math.floor(x), Math.floor(z)), b = t[0]; if (b !== T.WATER) c = b === T.SAND ? [214, 196, 140] : (b === T.STONE || b === T.GRAVEL) ? [128, 128, 122] : b === T.HEATHER ? [120, 92, 118] : t[1] > SEA + 22 ? [96, 108, 78] : [70, 122, 56]; }
        else if (dU(x, z) > OR) c = null; else if (dU(x, z) > IR) c = [232, 240, 246]; else { const g = col(Math.floor(x), Math.floor(z)); if (g[0] > 0) c = g[0] > 14 ? [96, 108, 78] : g[0] < 2 ? [205, 190, 135] : [70 + 3 * g[0], 124, 56]; }
        if (c) { d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; } else d[o + 3] = 0; } irow++; }
    ictx.putImageData(iimg, 0, 0); itx.needsUpdate = true; U.itex = irow; }
  function build() { const k = [W, D, SEA, PX, PZ].join(); if (built === k) return; built = k; drop();
    icv = document.createElement('canvas'); icv.width = icv.height = IN; ictx = icv.getContext('2d'); iimg = ictx.createImageData(IN, IN); irow = 0; itx = new THREE.CanvasTexture(icv); itx.anisotropy = 4;
    const cx = W >> 1, cz = (D >> 1) + UZ; G = new THREE.Group(); G.name = 'uk339'; G.userData.sys = 1;
    const sea = new THREE.Mesh(new THREE.CircleGeometry(IR, 96), new THREE.MeshBasicMaterial({color: 0x2f6db0, fog: false})); sea.rotation.x = -Math.PI / 2; sea.position.set(cx, SEA - 0.2, cz); sea.renderOrder = -3;
    const lm = new THREE.MeshBasicMaterial({map: itx, transparent: true, alphaTest: 0.5, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8}); lm.onBeforeCompile = sh => { sh.uniforms.uC = uC; sh.uniforms.uRn = uRn;
      sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying vec3 vW339;\nvoid main() {').replace('#include <project_vertex>', '#include <project_vertex>\nvW339 = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform vec3 uC; uniform float uRn; varying vec3 vW339;\nvoid main() {\nif (length(vW339.xz - uC.xz) < uRn) discard;'); };
    const land = new THREE.Mesh(new THREE.PlaneGeometry(2 * IA, 2 * IA), lm); land.rotation.x = -Math.PI / 2; land.position.set(cx, SEA + 0.25, cz);
    const ice = new THREE.Mesh(new THREE.RingGeometry(IR, OR, 96, 1), new THREE.MeshBasicMaterial({color: 0xe8f0f6, fog: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2})); ice.rotation.x = -Math.PI / 2; ice.position.set(cx, SEA, cz);
    for (const m of [sea, ice]) { m.frustumCulled = false; m.userData.sys = 1; G.add(m); } land.renderOrder = -2; try { __c317.FAR.add(G); } catch (_) { scene.add(G); } U.ice = ice; }
  function drop() { for (const g of [G, FG]) if (g) { g.parent && g.parent.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } G = FG = null; }
  setInterval(() => { try { const e = E(); if (!e) return; const f = big(); if (f) { PX = W >> 1; PZ = -400; e.FP = [PX, PZ]; U.px = PX; }
      if (e.flat !== f) { e.flat = f; e.fll = fll; e.fearth = fearth; GC.clear(); try { e.edgeClr && e.edgeClr(); } catch (_) {} try { __c324.cache.clear(); } catch (_) {} e.dirty = 1; }
      const a = typeof started !== 'undefined' && started && f; if (a) build(); try { const b = __c317.FAR.getObjectByName('earth326'); if (b) b.material.visible = !f; for (const n of ['sea320', 'floor320', 'seaBall320', 'floorBall320', 'dome309']) scene.traverse(o => { if (o.name === n && o.material) o.material.visible = !f; }); if (typeof seaRing !== 'undefined' && seaRing) seaRing.children.forEach(o => { o.material.visible = !f; }); } catch (_) {} if (G) { let hi = 0; try { const w = window.__c321 ? __c321.pw() : P; hi = w.y - SEA > 150; } catch (_) {} G.visible = a; } if (FG) FG.visible = a;
      if (a && irow < IN) { paintIn(performance.now()); setTimeout(() => { if (irow < IN) paintIn(performance.now()); }, 80); setTimeout(() => { if (irow < IN) paintIn(performance.now()); }, 160); } else if (a && U.rep && performance.now() > U.rep) { irow = 0; U.rep = 0; }
      if (a && !U.rep && irow >= IN) U.rep = performance.now() + 60000;
      if (a && !U.safe) { U.safe = 1; const w = window.__c321 ? __c321.pw() : P, off = !(w.x >= 0 && w.x < W && w.z >= 0 && w.z < D); if (off && w.y < SEA - 1500 && !(window.__c332 && __c332.where() === 'city')) { try { __c321.leave(); } catch (_) {} P.x = (W >> 1) + 0.5; P.z = (D >> 1) + 0.5; P.y = groundTop(W >> 1, D >> 1) + 1; P.vy = 0; P.fallTop = null; U.moved = 1; } } } catch (er) { ERR('loop', er); } }, 250);
  try { const r0 = renderer.render; renderer.render = function (s, c) { let fg0 = null; try { if (!window.__c346 && G && e3flat() && s === scene && s.fog && (window.__c321 ? __c321.pw() : P).y - SEA > 250) { fg0 = [s.fog.near, s.fog.far, s.fog.density]; s.fog.near = 1e6; s.fog.far = 2e6; if (s.fog.density !== undefined) s.fog.density = 0; } } catch (_) {} try { if (G) { try { if (e3flat()) { const b = __c317.FAR.getObjectByName('earth326'); if (b) b.visible = false; if (typeof seaRing !== 'undefined' && seaRing) seaRing.visible = false; } const w = window.__c321 ? __c321.pw() : P; uC.value.set(w.x, w.y, w.z);
        const PH = /Android|iPhone|iPad/i.test(navigator.userAgent) || (typeof PERF !== 'undefined' && PERF); uRn.value = ((PH ? 2 : 3) + 0.5) * CH * (w.y - SEA > 100 ? 0 : 1); } catch (_) {} } } finally { } const rr = r0.apply(this, arguments); if (fg0 && s.fog) { s.fog.near = fg0[0]; s.fog.far = fg0[1]; if (fg0[2] !== undefined) s.fog.density = fg0[2]; } return rr; }; } catch (er) { ERR('rd', er); }
})();
