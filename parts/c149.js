/* ===================== GLX-C149 (v1.0.24): every biome has its own Scottish undergrowth - the tall grass of each wood grows as its own plant:
   bracken (pine / birch / rowan / oak edges), gorse in bloom (rowan, hawthorn, blackthorn), bog cotton (alder carr, juniper moor), heather sprigs (moor),
   blaeberry (pine, yew). One texture strip, one draw per chunk as before; new worlds get thicker undergrowth ===================== */
(function c149() {
  const U = window.__c149 = {err: null, st: {chunks: 0, inst: 0, by: [0, 0, 0, 0, 0, 0], gen: null}, ok: false};
  const NV = 6, TG = T.TALLGRASS, NAMES6 = ['grass', 'bracken', 'gorse', 'bog cotton', 'heather', 'blaeberry'];
  // [scale height, scale width] per variant
  const SC = [[1, 1], [1.3, 1.25], [1.2, 1.3], [1.05, 0.95], [0.78, 1.05], [0.72, 1.1]];
  // per biome: list of [variant, share] (oak keeps the liked grass with a little bracken)
  const MIX = {oak: [[0, .86], [1, .14]], pine: [[5, .55], [1, .45]], birch: [[1, .55], [0, .45]], rowan: [[2, .45], [1, .35], [0, .2]], alder: [[3, .7], [0, .3]],
    yew: [[5, .5], [0, .5]], juniper: [[4, .6], [3, .4]], hawthorn: [[2, .5], [0, .5]], blackthorn: [[2, .4], [0, .6]]};
  const hs = (x, z, s) => { let h = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ Math.imul(s, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function variantAt(x, z) { const B = window.__bio; if (!B || !B.info.on) return 0; const L = MIX[B.at(x, z)]; if (!L) return 0; let q = hs(x, z, 77); for (const [v, p] of L) { if (q < p) return v; q -= p; } return L[L.length - 1][0]; }
  U.variantAt = variantAt; U.NAMES = NAMES6;
  // ---------- painters (256 px, transparent) ----------
  const S = 256;
  function paint(k) { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); let sd = 91 + k * 37; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }; g.lineCap = 'round';
    const rgb = (r, gg, b, v) => `rgb(${r * v | 0},${gg * v | 0},${b * v | 0})`;
    if (k === 1) { // bracken: arching fronds, green with a few russet tips
      for (let f = 0; f < 6; f++) { const a = -Math.PI / 2 + (f / 5 - .5) * 2.0 + (R() - .5) * .3, L = 150 + R() * 60, bx = S / 2 + (R() - .5) * 30, v = .8 + R() * .35, rust = R() < .3;
        const pt = t => { const aa = a + (a + Math.PI / 2) * t * 1.1; return [bx + Math.cos(aa) * L * t, S - 2 + Math.sin(aa) * L * t + t * t * 46]; };
        g.strokeStyle = rgb(70, 92, 40, v); g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 20; i++) { const [x, y] = pt(i / 20); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
        for (let i = 4; i < 20; i++) { const t = i / 20, [x, y] = pt(t), [x2, y2] = pt(Math.min(1, t + .05)), dx = x2 - x, dy = y2 - y, dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl, pl = (1 - t) * 34 + 6;
          const late = rust && t > .55; g.strokeStyle = late ? rgb(168, 98, 40, v) : rgb(96 + R() * 20, 132 + R() * 24, 46, v); g.lineWidth = 4.5;
          for (const s of [1, -1]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + nx * pl * s * .6, y + ny * pl * s * .6 - 4, x + nx * pl * s + dx * .4, y + ny * pl * s + dy * .4 + 6); g.stroke(); } } } }
    else if (k === 2) { // gorse: a dense spiny bush covered in yellow flowers
      for (let i = 0; i < 260; i++) { const a = -Math.PI / 2 + (R() - .5) * 2.6, r0 = R() * 70, x = S / 2 + Math.cos(a) * r0 * 1.5, y = S - 6 + Math.sin(a) * r0 * 2.6, L = 10 + R() * 14, b = a + (R() - .5) * 1.2;
        g.strokeStyle = rgb(48, 74, 30, .8 + R() * .4); g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * L, y + Math.sin(b) * L); g.stroke(); }
      for (let i = 0; i < 120; i++) { const a = -Math.PI / 2 + (R() - .5) * 2.5, r0 = 20 + R() * 60, x = S / 2 + Math.cos(a) * r0 * 1.45, y = S - 10 + Math.sin(a) * r0 * 2.4;
        g.fillStyle = R() < .25 ? '#e8a818' : '#f6cf2c'; g.beginPath(); g.ellipse(x, y, 4 + R() * 2.5, 3 + R() * 2, R() * 3, 0, 7); g.fill(); } }
    else if (k === 3) { // bog cotton: fine sedge with white fluffy heads
      for (let i = 0; i < 26; i++) { const x = S * (.2 + R() * .6), h = 60 + R() * 70, bend = (R() - .5) * 40; g.strokeStyle = rgb(110, 128, 64, .8 + R() * .4); g.lineWidth = 2.4; g.beginPath(); g.moveTo(x, S); g.quadraticCurveTo(x, S - h * .5, x + bend, S - h); g.stroke(); }
      for (let i = 0; i < 9; i++) { const x = S * (.18 + R() * .64), h = 150 + R() * 80, bend = (R() - .5) * 30, tx = x + bend, ty = S - h;
        g.strokeStyle = '#7a8048'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, S); g.quadraticCurveTo(x, S - h * .6, tx, ty); g.stroke();
        for (let j = 0; j < 14; j++) { g.fillStyle = j < 4 ? '#d8d6cc' : '#f7f6f0'; g.beginPath(); g.arc(tx + (R() - .5) * 18, ty - 4 + (R() - .5) * 18, 4 + R() * 4, 0, 7); g.fill(); } } }
    else if (k === 4) { // heather sprigs: woody stems, purple bells
      for (let i = 0; i < 16; i++) { const x = S * (.15 + R() * .7), h = 120 + R() * 110, bend = (R() - .5) * 60, tx = x + bend, ty = S - h;
        g.strokeStyle = '#5a4030'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, S); g.quadraticCurveTo(x, S - h * .5, tx, ty); g.stroke();
        for (let j = 0; j < 18; j++) { const t = .35 + R() * .65, px = x + (tx - x) * t * t + (R() - .5) * 10, py = S - h * t; g.fillStyle = R() < .5 ? '#a8509a' : R() < .5 ? '#c879b8' : '#7e3a78'; g.beginPath(); g.arc(px, py, 3 + R() * 3, 0, 7); g.fill(); }
        for (let j = 0; j < 8; j++) { const t = R() * .5, px = x + (tx - x) * t * t, py = S - h * t; g.strokeStyle = '#3e5a2e'; g.lineWidth = 2; g.beginPath(); g.moveTo(px, py); g.lineTo(px + (R() - .5) * 14, py - 6); g.stroke(); } } }
    else if (k === 5) { // blaeberry: low leafy shrub with dark blue berries
      for (let i = 0; i < 14; i++) { const x = S * (.2 + R() * .6), h = 90 + R() * 90, bend = (R() - .5) * 70; g.strokeStyle = '#4a6a2c'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, S); g.quadraticCurveTo(x, S - h * .5, x + bend, S - h); g.stroke(); }
      for (let i = 0; i < 170; i++) { const a = -Math.PI / 2 + (R() - .5) * 2.6, r0 = R() * 70, x = S / 2 + Math.cos(a) * r0 * 1.5, y = S - 8 + Math.sin(a) * r0 * 2.3;
        g.fillStyle = rgb(78, 122, 52, .75 + R() * .45); g.beginPath(); g.ellipse(x, y, 6 + R() * 3, 3.5 + R() * 1.5, R() * 3, 0, 7); g.fill(); }
      for (let i = 0; i < 26; i++) { const x = S / 2 + (R() - .5) * 170, y = S - 20 - R() * 120; g.fillStyle = R() < .5 ? '#2a3466' : '#3a4a80'; g.beginPath(); g.arc(x, y, 4 + R() * 2, 0, 7); g.fill(); g.fillStyle = 'rgba(200,210,255,.5)'; g.fillRect(x - 1, y - 2, 2, 2); } }
    return c; }
  // ---------- one atlas: tile 0 = the existing tall grass picture, tiles 1..5 the new plants ----------
  const tiles = [null]; for (let k = 1; k < NV; k++) try { tiles.push(paint(k)); } catch (e) { U.err = 'paint ' + e.message; tiles.push(null); }
  U.tiles = tiles;
  const M = PLANT_MATS[TG]; let atlas = null, srcImg = null;
  let orig = null;
  function build() { if (M.map && M.map !== atlas) orig = M.map; const t = orig, im = t && t.image; if (!im || (atlas && M.map === atlas && im === srcImg)) return; const w = im.width || 0; if (!(w > 8) || im.complete === false) return;
    const ts = Math.min(512, w), c = document.createElement('canvas'); c.width = ts * NV; c.height = ts; const g = c.getContext('2d'); g.drawImage(im, 0, 0, ts, ts);
    for (let k = 1; k < NV; k++) if (tiles[k]) g.drawImage(tiles[k], k * ts, 0, ts, ts);
    srcImg = im; const nt = t.clone(); nt.image = c; nt.needsUpdate = true; atlas = nt; M.map = nt; M.needsUpdate = true; U.atlas = c.width + 'x' + c.height; }
  // the shader: instanceColor.r carries the plant (k/8), the texture strip is sampled at tile k
  const RV = parseInt(THREE.REVISION) || 0, UVN = /vMapUv/.test(THREE.ShaderChunk.uv_vertex || '') ? 'vMapUv' : 'vUv';
  const VS = THREE.ShaderLib.lambert && THREE.ShaderLib.lambert.vertexShader || '';
  U.ok = !!M && RV >= 122 && VS.includes('#include <color_vertex>') && VS.includes('#include <uv_vertex>');
  if (U.ok) { const prev = M.onBeforeCompile; M.onBeforeCompile = function (sh, r) { if (prev) prev.call(this, sh, r);
      sh.vertexShader = sh.vertexShader.replace('#include <color_vertex>', '#include <color_vertex>\n#ifdef USE_MAP\n{ float k149 = 0.0;\n#ifdef USE_INSTANCING_COLOR\n k149 = floor(instanceColor.r * 8.0 + 0.5); vColor = vec3(1.0);\n#endif\n ' + UVN + '.x = (k149 + 0.02 + clamp(' + UVN + '.x, 0.0, 1.0) * 0.96) / ' + NV.toFixed(1) + '; }\n#endif'); U.sh = 1; };
    let ck = ''; try { const d = Object.getOwnPropertyDescriptor(M, 'customProgramCacheKey'); const f = d && d.get ? d.get.call(M) : M.customProgramCacheKey; ck = f ? f.call(M) : ''; } catch (_) {}
    Object.defineProperty(M, 'customProgramCacheKey', {get() { return () => ck + 'c149'; }, set() {}, configurable: true}); M.needsUpdate = true;
    const tick = () => { try { build(); } catch (e) { U.err = 'atlas ' + e.message; } }; tick(); setInterval(tick, 1500); }
  // ---------- meshing: the chunk's tall grass instances get their biome's plant ----------
  const m4 = new THREE.Matrix4(), ps = new THREE.Vector3(), qq = new THREE.Quaternion(), sc = new THREE.Vector3(), col = new THREE.Color();
  function dress(cx, cz) { const grp = chunkObjs.get(cx * 64 + cz); if (!grp) return;
    // every grass mesh sharing the material carries instance colours (a mix with and without breaks the shared shader program)
    for (const im of grp.children) if (im.isInstancedMesh && im.material === M && !im.instanceColor && im.count > 0) { col.setRGB(0, 1, 1); for (let j = 0; j < im.count; j++) im.setColorAt(j, col); im.instanceColor.needsUpdate = true; }
    if (!atlas || M.map !== atlas) return;
    for (const im of grp.children) { if (!im.isInstancedMesh || im.material !== M || im.userData.c149) continue; im.userData.c149 = 1; let any = false; const n = im.count;
      for (let i = 0; i < n; i++) { im.getMatrixAt(i, m4); m4.decompose(ps, qq, sc); const v = variantAt(Math.floor(ps.x), Math.floor(ps.z)); U.st.by[v]++;
        if (v) { sc.x *= SC[v][1]; sc.z *= SC[v][1]; sc.y *= SC[v][0]; m4.compose(ps, qq, sc); im.setMatrixAt(i, m4); any = true; }
        if (any || v) { if (!im.instanceColor) { for (let j = 0; j < i; j++) { col.setRGB(0, 1, 1); im.setColorAt(j, col); } } col.setRGB(v / 8, 1, 1); im.setColorAt(i, col); } }
      if (!any) continue;
      im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; U.st.inst += n; } U.st.chunks++; }
  const bc = buildChunk; buildChunk = function (cx, cz) { const r = bc.apply(this, arguments); try { if (U.ok) dress(cx, cz); } catch (e) { U.err = 'dress ' + e.message; } return r; };
  // the atlas arrives a moment after boot: re-mesh once it is in
  let had = false; setInterval(() => { if (!had && atlas && M.map === atlas) { had = true; try { dirtyAll = true; } catch (_) {} } }, 1000);
  // ---------- new worlds: thicker undergrowth per biome (only air above soil, never on anything built) ----------
  const DENS = {oak: 0.01, pine: 0.05, birch: 0.06, rowan: 0.07, alder: 0.07, yew: 0.03, juniper: 0.08, hawthorn: 0.05, blackthorn: 0.05};
  const elig = () => { try { return !!(current && current.g24 && current.mode !== 'creative' && genVer === GEN9 && !cityGen && !DIM.cur && W > 100 && window.__bio && __bio.info.on); } catch (_) { return false; } };
  const ew = enterWorld; enterWorld = function (save) { try { if (current) current.g24 = save ? !!save.c149 : true; } catch (_) {} return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && current && current.g24) d.c149 = 1; } catch (_) {} return d; };
  function grow() { const t0 = performance.now(), SOIL = new Set([T.GRASS, T.PEAT, T.MUD, T.HEATHER, 142, 144].filter(v => v !== undefined)); let n = 0;
    for (let x = 3; x < W - 3; x++) for (let z = 3; z < D - 3; z++) { const sp = __bio.at(x, z), p = DENS[sp] || 0; if (!(hs(x, z, 151) < p)) continue;
      let y = H - 2; while (y > SEA && world[idx(x, y, z)] === T.AIR) y--; if (y <= SEA + 1 || y >= H - 3) continue;
      const b = world[idx(x, y, z)]; if (!SOIL.has(b) || world[idx(x, y + 1, z)] !== T.AIR || world[idx(x, y + 2, z)] !== T.AIR) continue;
      let wet = false; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nb = world[idx(x + dx, y + 1, z + dz)]; if (nb === T.WATER || nb === T.LAVA) wet = true; } if (wet) continue;
      world[idx(x, y + 1, z)] = TG; n++; }
    U.st.gen = {n, ms: Math.round(performance.now() - t0)}; }
  const gen = generate; generate = function () { const r = gen.apply(this, arguments); if (elig()) { try { grow(); dirtyAll = true; } catch (e) { U.err = 'grow ' + e.message; } } return r; };
})();
