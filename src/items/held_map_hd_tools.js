/* ===================== GLX-C112 (v0.9.93): held map (already explored, castles marked), HD tool models + icons from them, fewer tools ===================== */
window.__seaCol = () => [42, 98, 186]; /* v1.1.52: one sea colour for the whole UK map */
(function c112() {
  const U = window.__c112 = {err: null, icons: 0, built: 0, mapDone: false};
  const warn = (k, e) => { if (!U.err) U.err = k + ': ' + String(e && e.stack || e).slice(0, 300); };
  // ---------------- 1. removed tools: wooden shovel, wooden hoe, stone hoe, diamond hoe ----------------
  const GONE = new Set([IT.WSHOVEL, IT.WHOE, IT.SHOE, IT.DHOE]);
  for (let i = RECIPES.length - 1; i >= 0; i--) if (GONE.has(RECIPES[i].out)) RECIPES.splice(i, 1);
  for (const L of [ORDER, typeof CREATIVE_ALL !== 'undefined' ? CREATIVE_ALL : []]) for (let i = L.length - 1; i >= 0; i--) if (GONE.has(L[i])) L.splice(i, 1);
  function purge() { try { for (const id of GONE) if (inv[id] && !FACES[id]) delete inv[id]; if (MODE && MODE.hotbar) MODE.hotbar = MODE.hotbar.map(id => GONE.has(id) && !FACES[id] ? 0 : id); if (GONE.has(selId) && !FACES[selId]) selId = T.DIRT; } catch (_) {} }
  const ap = applySave; applySave = function () { const r = ap.apply(this, arguments); purge(); return r; };
  setInterval(purge, 3000);

  // ---------------- 2. paper + map items ----------------
  const PAPER = 411, MAPI = 410; IT.PAPER = PAPER; IT.MAP = MAPI; NAMES[PAPER] = 'Paper'; NAMES[MAPI] = 'Map';
  ORDER.push(PAPER, MAPI); if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(PAPER, MAPI);
  RECIPES.push(rc('3 Paper', '3 Reeds', PAPER, 3, [[T.REEDS || 239, 3]]), rc('3 Paper (wheat)', '3 Wheat', PAPER, 3, [[IT.WHEAT, 3]]),
    rc('Map', '8 Paper + 1 Redstone', MAPI, 1, [[PAPER, 8], [IT.REDSTONE, 1]], 1));
  ICONS[PAPER] = drawIcon(g => { g.rotate(-0.12); g.fillStyle = '#d9cfb4'; g.fillRect(-20, -24, 40, 48); g.fillStyle = '#f4eedc'; g.fillRect(-20, -24, 38, 46); g.strokeStyle = '#b8ab88'; g.lineWidth = 1.5; for (let y = -14; y < 20; y += 7) { g.beginPath(); g.moveTo(-14, y); g.lineTo(12, y); g.stroke(); } });
  ICONS[MAPI] = drawIcon(g => { g.fillStyle = '#b89c66'; g.fillRect(-27, -27, 54, 54); g.fillStyle = '#efe2bf'; g.fillRect(-23, -23, 46, 46);
    g.fillStyle = '#5a9ad8'; g.fillRect(-23, -23, 46, 46); g.fillStyle = '#6fa64a'; g.beginPath(); g.ellipse(0, 1, 16, 15, 0, 0, 7); g.fill(); g.fillStyle = '#3f7a32'; g.beginPath(); g.ellipse(-4, -2, 7, 6, 0, 0, 7); g.fill();
    for (const [x, y] of [[-17, -17], [17, -16], [16, 17]]) { g.fillStyle = '#7a8a5a'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); g.fillStyle = '#3a3a3a'; g.fillRect(x - 2, y - 3, 4, 4); }
    g.fillStyle = '#d02020'; g.beginPath(); g.moveTo(0, -6); g.lineTo(5, 6); g.lineTo(0, 3); g.lineTo(-5, 6); g.fill(); });
  const mi0 = makeItemMesh; makeItemMesh = function (id) { if (id === MAPI) { const g = new THREE.Group(); g.userData.map = true; return g; } return mi0.apply(this, arguments); };

  // ---------------- 3. the map picture: every column's top block, drawn once per world, in slices ----------------
  const MC = document.createElement('canvas'), TX = document.createElement('canvas'); TX.width = TX.height = 1024; const tg = TX.getContext('2d');
  let mg = null, key = '', row = 0, hm = null, tex = null, refT = 0;
  const hexRGB = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255], COLC = {};
  const topKey = id => { const f = FACES[id]; return Array.isArray(f) ? f[2] : f; };
  const colOf = id => COLC[id] || (COLC[id] = hexRGB((topKey(id) && AVG[topKey(id)]) || 0x777777));
  const sky = id => id === T.AIR || !FACES[id] || PLANT[id] === 1;
  const MPAL = {[T.GRASS]: [112, 178, 76], leaf: [62, 128, 58], [T.SAND]: [232, 214, 150], [T.STONE]: [150, 150, 146], [T.GRAVEL || 202]: [160, 152, 140], [T.DIRT]: [150, 112, 74], [T.HEATHER]: [150, 104, 150], [T.PEAT]: [96, 76, 58], [T.MUD]: [110, 90, 64], [T.DEEPSLATE]: [90, 90, 96], [T.LAVA]: [240, 110, 30], 142: [120, 96, 56], 144: [90, 140, 60], 248: [56, 56, 62]};
  let wm = null; const wAt = (x, z) => { if (x < 0 || z < 0 || x >= W || z >= D) return 1; const i = x * D + z; if (wm[i] < 0) { let y = H - 1; const base = x * H * D + z; for (; y > 0; y--) if (!sky(world[base + y * D])) break; wm[i] = world[base + y * D] === T.WATER ? 1 : 0; } return wm[i]; };
  const wkey = () => ((current && current.id) || 'x') + '@' + (current && current.created) + '|' + W + '|' + (typeof genVer !== 'undefined' ? genVer : 0) + '#' + (window.__mapGen | 0) + '#' + (typeof gSeed !== 'undefined' ? gSeed : 0);
  function column(x, z) { let y = H - 1, b = 0; const base = x * H * D + z; for (; y > 0; y--) { b = world[base + y * D]; if (!sky(b)) break; }
    let dep = 0; if (b === T.WATER) { let yy = y; while (yy > 0 && world[base + yy * D] === T.WATER && dep < 8) { yy--; dep++; } } hm[x * D + z] = y; return [y, b, dep]; }
  function paintRect(x0, z0, w, d) { x0 = Math.max(0, x0); z0 = Math.max(0, z0); w = Math.min(W - x0, w); d = Math.min(D - z0, d); if (w <= 0 || d <= 0) return;
    const im = mg.createImageData(w, d), px = im.data, bio = window.__bio && __bio.info.on ? __bio : null;
    for (let dx = 0; dx < w; dx++) for (let dz = 0; dz < d; dz++) { const x = x0 + dx, z = z0 + dz, [h, b, dep] = column(x, z); let r, g, bb, al = 255;
      // v1.0.12: a cleaner map - flat crisp colours per surface/biome, clear water, a dark coastline, gentle relief only
      if (b === T.WATER) { [r, g, bb] = window.__seaCol(dep); if (UKF()) al = 0;
        if (wAt(x - 1, z) === 0 || wAt(x + 1, z) === 0 || wAt(x, z - 1) === 0 || wAt(x, z + 1) === 0) { r = 30; g = 62; bb = 118; al = 255; } }
      else { const c = MPAL[b] || (LEAFY[b] ? MPAL.leaf : LOGGY[b] ? MPAL.leaf : colOf(b)); r = c[0]; g = c[1]; bb = c[2];
        if (bio && (b === T.GRASS || LEAFY[b] || LOGGY[b])) { const t = bio.tint(x, z); r *= t[0]; g *= t[1]; bb *= t[2]; }
        const hn = z > 0 ? hm[x * D + z - 1] : -1, hw = x > 0 ? hm[(x - 1) * D + z] : -1; const sl = ((hn >= 0 ? h - hn : 0) + (hw >= 0 ? h - hw : 0)) * 0.035;
        const s = 1 + Math.max(-0.16, Math.min(0.16, sl)) + Math.max(-0.1, Math.min(0.14, (h - SEA - 8) * 0.0025)); r *= s; g *= s; bb *= s; }
      const o = (dz * w + dx) * 4; px[o] = r; px[o + 1] = g; px[o + 2] = bb; px[o + 3] = al; }
    mg.putImageData(im, x0, z0); }
  function reset() { key = wkey(); MC.width = W; MC.height = D; mg = MC.getContext('2d'); hm = new Int16Array(W * D).fill(-1); wm = new Int8Array(W * D).fill(-1); row = 0; U.mapDone = false; U.built = 0; }
  function build(ms) { const t0 = performance.now(); while (row < W && performance.now() - t0 < ms) { paintRect(row, 0, 4, D); row += 4; } U.built = row / W; if (row >= W && !U.mapDone) { U.mapDone = true; compose(); } }
  const IN = 40, SZ = 1024 - 2 * IN;   // map area inside the parchment border
  const UKF = () => { const u = window.__c345 && __c345.uk; return u && u.done ? u : null; }; let ukUsed = 0;
  const toC = (x, z) => { const u = UKF(); return u ? [IN + (x - u.X0) / u.S * SZ, IN + (z - u.Z0) / u.S * SZ] : [IN + x / W * SZ, IN + z / D * SZ]; };
  function castleIcon(x, y, col, roof) { tg.save(); tg.translate(x, y); tg.fillStyle = 'rgba(0,0,0,.45)'; tg.fillRect(-15, -11, 32, 26);
    tg.fillStyle = col; tg.fillRect(-14, -6, 28, 18); for (let i = 0; i < 4; i++) tg.fillRect(-14 + i * 8, -12, 5, 7); tg.fillRect(-5, -20, 10, 16); tg.fillRect(-6, -23, 3, 4); tg.fillRect(-1.5, -23, 3, 4); tg.fillRect(3, -23, 3, 4);
    tg.fillStyle = '#1a1410'; tg.fillRect(-4, 3, 8, 9); tg.fillStyle = roof; tg.fillRect(-14, -6, 28, 3); tg.strokeStyle = '#000'; tg.lineWidth = 1.5; tg.strokeRect(-14, -6, 28, 18); tg.restore(); }
  function label(t, x, y) { tg.font = 'bold 34px Georgia,serif'; tg.textAlign = 'center'; tg.lineWidth = 5; tg.strokeStyle = 'rgba(245,235,205,.95)'; tg.strokeText(t, x, y); tg.fillStyle = '#2a1a0c'; tg.fillText(t, x, y); }
  function compose() {
    tg.fillStyle = '#c9ad74'; tg.fillRect(0, 0, 1024, 1024); tg.fillStyle = '#e8d6a8'; tg.fillRect(10, 10, 1004, 1004);
    for (let i = 0; i < 900; i++) { tg.fillStyle = 'rgba(120,90,40,' + (Math.random() * 0.06) + ')'; tg.fillRect(Math.random() * 1024, Math.random() * 1024, 2 + Math.random() * 6, 2 + Math.random() * 6); }
    tg.imageSmoothingEnabled = true; tg.globalAlpha = 0.93; { const u = UKF(); ukUsed = u ? 1 : 0; if (u) { tg.globalAlpha = 1; tg.drawImage(u.cv, IN, IN, SZ, SZ); tg.globalAlpha = 0.93; const [ax, ay] = toC(0, 0), [bx, by] = toC(W, D); tg.drawImage(MC, ax, ay, bx - ax, by - ay); } else tg.drawImage(MC, IN, IN, SZ, SZ); } tg.globalAlpha = 1;
    tg.strokeStyle = '#6a4a22'; tg.lineWidth = 4; tg.strokeRect(IN - 2, IN - 2, SZ + 4, SZ + 4);
    // castles
    const cs = (typeof g9castles !== 'undefined' && g9castles) || [];
    for (const c of cs) { const [x, y] = toC(c[1], c[2]); const fr = (() => { try { return castleFriendly(c); } catch (_) { return c[0] === 'human'; } })();
      const [col, roof, nm] = fr ? ['#d8d2c4', '#2f5fa8', 'Clan Castle'] : c[0] === 'black' ? ['#2a2a30', '#b0301c', 'Blackstone Castle'] : ['#6f8a5a', '#3a4a2a', 'Mossy Skeleton Castle'];
      castleIcon(x, y, col, roof); if (!ukUsed) label(nm, Math.max(150, Math.min(874, x)), y + (y > 900 ? -34 : 44)); }
    try { if (window.__c181 && __c181.on()) { const I = window.__c142 && __c142.sites && __c142.sites.isle; if (I) { const [x, y] = toC(I.c[0], I.c[1]); if (!ukUsed) label('Pyramid Park', x, y); }
        const F = window.__c113 && __c113.isles && __c113.isles().find(q => q.k === 'forest'); if (F) { const [x, y] = toC(F.x, F.z); if (!ukUsed) label('Croft Isle', x, y); } } } catch (_) {}
    if (typeof g9spawn !== 'undefined' && g9spawn) { const [x, y] = toC(g9spawn[0], g9spawn[2]); tg.fillStyle = '#ffd23a'; tg.strokeStyle = '#5a3a00'; tg.lineWidth = 2; tg.beginPath();
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 6 : 14; tg.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } tg.closePath(); tg.fill(); tg.stroke(); label('Spawn', x, y + 38); }
    // v1.0.12 markers: crofts, the 4 ravines, the great cave under the skull
    try { const C13 = window.__c113, fl = C13 && C13.farmsList ? C13.farmsList() : [];
      for (const f of fl) { const [x, y] = toC(f.x0 + 3, f.z0 + 6); tg.save(); tg.translate(x, y); tg.fillStyle = 'rgba(0,0,0,.4)'; tg.fillRect(-9, -5, 19, 14); tg.fillStyle = '#efe4c8'; tg.fillRect(-8, -3, 16, 11); tg.fillStyle = '#9a4a20'; tg.beginPath(); tg.moveTo(-10, -3); tg.lineTo(0, -12); tg.lineTo(10, -3); tg.fill(); tg.fillStyle = '#3a2410'; tg.fillRect(-2, 2, 4, 6); tg.restore(); } } catch (_) {}
    try { const M = !ukUsed && window.__c131 && __c131.marks && __c131.marks(); if (M) {
        for (const r of M.rav || []) { const pts = r.p || []; if (pts.length < 2) continue; tg.save(); tg.lineCap = 'round'; tg.lineJoin = 'round';
          for (const [wd, col] of [[9, 'rgba(40,20,10,.55)'], [4, '#8a3a1a']]) { tg.lineWidth = wd; tg.strokeStyle = col; tg.beginPath(); pts.forEach((q, i) => { const [x, y] = toC(q[0], q[1]); i ? tg.lineTo(x, y) : tg.moveTo(x, y); }); tg.stroke(); }
          const [lx, ly] = toC(r.x, r.z); tg.restore(); tg.font = 'bold 22px Georgia,serif'; tg.textAlign = 'center'; tg.lineWidth = 4; tg.strokeStyle = 'rgba(245,235,205,.95)'; tg.strokeText('Ravine', lx, ly - 18); tg.fillStyle = '#5a200c'; tg.fillText('Ravine', lx, ly - 18); }
        if (M.ent) { const [x, y] = toC(M.ent[0], M.ent[1]); tg.fillStyle = '#1a1210'; tg.beginPath(); tg.arc(x, y + 4, 11, Math.PI, 0); tg.lineTo(x + 11, y + 8); tg.lineTo(x - 11, y + 8); tg.fill(); tg.strokeStyle = '#d8c090'; tg.lineWidth = 2; tg.stroke();
          tg.font = 'bold 22px Georgia,serif'; tg.textAlign = 'center'; tg.lineWidth = 4; tg.strokeStyle = 'rgba(245,235,205,.95)'; tg.strokeText('Great Cave', x, y + 32); tg.fillStyle = '#2a1a0c'; tg.fillText('Great Cave', x, y + 32); } } } catch (_) {}
    if (ukUsed) { const c = window.__c339, L = (t, lat, lon) => { const x = (W >> 1) + (lon - c.LON0) * c.K * Math.cos(lat * Math.PI / 180), z = (D >> 1) + (c.LAT0 - lat) * c.K, q = toC(x, z); label(t, q[0], q[1]); };
      try { L('SCOTLAND', 57.9, -4.6); L('ENGLAND', 52.2, -0.9); L('WALES', 52.4, -4.2); L('IRELAND', 53.2, -8.0); L('Isle of Man', 54.0, -4.5); L('Shetland', 60.6, -0.6); L('Orkney', 59.3, -2.4); } catch (_) {} }
    // north arrow
    tg.fillStyle = '#3a2410'; tg.beginPath(); tg.moveTo(980, 56); tg.lineTo(992, 92); tg.lineTo(968, 92); tg.fill(); label('N', 980, 120);
    if (tex) tex.needsUpdate = true;
  }
  // ---------------- 4. held in ONE hand (v1.0.1): the other hand stays free; sways as you look around ----------------
  const HG = new THREE.Group(); HG.visible = false; camera.add(HG); U.g = HG;
  const MS = 0.34, plane = new THREE.Mesh(new THREE.PlaneGeometry(MS, MS), new THREE.MeshBasicMaterial({color: 0xffffff, depthTest: false, depthWrite: false}));
  HG.add(plane); plane.renderOrder = 20;
  const sh = new THREE.Shape(); sh.moveTo(0, 0.014); sh.lineTo(0.0095, -0.011); sh.lineTo(0, -0.005); sh.lineTo(-0.0095, -0.011); sh.closePath();
  const arrowO = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({color: 0xffffff, depthTest: false, depthWrite: false})); arrowO.scale.setScalar(1.35); arrowO.renderOrder = 21;
  const arrow = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({color: 0xd01818, depthTest: false, depthWrite: false})); arrow.renderOrder = 22; arrow.position.z = 0.0005;
  const mark = new THREE.Group(); mark.add(arrowO); mark.add(arrow); mark.position.z = 0.001; plane.add(mark);
  // v1.0.12: a round close-up of the ground round you (about 96 blocks across), hanging off the bottom edge like a compass
  const IC = document.createElement('canvas'); IC.width = IC.height = 256; const ig = IC.getContext('2d'), itex = new THREE.CanvasTexture(IC); itex.minFilter = THREE.LinearFilter;
  const ISZ = MS * 0.3, inset = new THREE.Mesh(new THREE.PlaneGeometry(ISZ, ISZ), new THREE.MeshBasicMaterial({map: itex, transparent: true, depthTest: false, depthWrite: false}));
  inset.renderOrder = 24; inset.position.set(0, -MS * 0.5 + ISZ * 0.12, 0.002); plane.add(inset);
  const im2 = new THREE.Group(), a2o = new THREE.Mesh(arrowO.geometry, arrowO.material), a2 = new THREE.Mesh(arrow.geometry, arrow.material); a2o.scale.setScalar(1.35); a2o.renderOrder = 25; a2.renderOrder = 26; a2.position.z = 0.0005;
  im2.add(a2o); im2.add(a2); im2.scale.setScalar(1.15); im2.position.z = 0.0006; inset.add(im2); U.inset = inset;
  let insT = 0; function drawInset() { const R = 48, px = P.x, pz = P.z; ig.clearRect(0, 0, 256, 256); ig.save(); ig.beginPath(); ig.arc(128, 128, 120, 0, 7); ig.clip(); ig.fillStyle = '#2f6fc4'; ig.fillRect(0, 0, 256, 256);
    ig.imageSmoothingEnabled = false; try { ig.drawImage(MC, px - R, pz - R, 2 * R, 2 * R, 0, 0, 256, 256); } catch (_) {}
    const cs = (typeof g9castles !== 'undefined' && g9castles) || []; for (const c of cs) { const x = (c[1] - px + R) / (2 * R) * 256, y = (c[2] - pz + R) / (2 * R) * 256; if (x > -20 && y > -20 && x < 276 && y < 276) { ig.fillStyle = '#2a2a30'; ig.fillRect(x - 10, y - 8, 20, 16); ig.fillStyle = '#d8d2c4'; ig.fillRect(x - 8, y - 6, 16, 12); } }
    ig.restore(); ig.lineWidth = 10; ig.strokeStyle = '#6a4a22'; ig.beginPath(); ig.arc(128, 128, 121, 0, 7); ig.stroke(); ig.lineWidth = 3; ig.strokeStyle = '#e8d6a8'; ig.beginPath(); ig.arc(128, 128, 114, 0, 7); ig.stroke();
    ig.font = 'bold 26px Georgia,serif'; ig.textAlign = 'center'; ig.fillStyle = '#e8d6a8'; ig.strokeStyle = '#3a2410'; ig.lineWidth = 4; ig.strokeText('N', 128, 30); ig.fillText('N', 128, 30); itex.needsUpdate = true; }
  // one hand holds the bottom corner (right corner = main hand, left corner = offhand)
  const up = new THREE.Vector3(0, 1, 0), fists = {};
  for (const s of [-1, 1]) { const FG = new THREE.Group(); HG.add(FG); fists[s] = FG;
    const fist = new THREE.Vector3(s * MS * 0.44, -MS * 0.62, 0.014), dir = new THREE.Vector3(s * 0.15, -0.6, 0.65).normalize();
    const add = (geo, m, at) => { const o = new THREE.Mesh(geo, m); o.position.copy(fist).addScaledVector(dir, at); o.quaternion.setFromUnitVectors(up, dir); o.renderOrder = 23; o.material = m; FG.add(o); return o; };
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.075, 0.06), armMat); f.position.copy(fist); f.quaternion.setFromUnitVectors(up, dir); f.renderOrder = 23; FG.add(f);
    const th = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.05, 0.02), armMat); th.position.set(fist.x - s * 0.012, fist.y + 0.028, fist.z + 0.03); th.renderOrder = 24; FG.add(th);
    add(new THREE.CylinderGeometry(0.032, 0.04, 0.2, 12), armMat, 0.13); add(new THREE.CylinderGeometry(0.05, 0.056, 0.34, 14), sleeveMat, 0.38); }
  HG.traverse(o => { if (o.isMesh) { o.frustumCulled = false; if (o.material !== plane.material && o.material.depthTest !== false) { o.material = o.material.clone(); o.material.depthTest = false; o.material.depthWrite = false; } } });
  HG.rotation.x = -0.22;
  const offMap = () => { try { return typeof offhand !== 'undefined' && offhand && offhand.id === MAPI; } catch (_) { return false; } };
  const holding = () => { if (!(started && !dead && !(window.__thirdPerson || (typeof camMode !== 'undefined' && camMode)) && !(typeof menuOpen !== 'undefined' && menuOpen))) return false;
    if (selId === MAPI && cnt(MAPI) > 0) return 'main'; if (offMap()) return 'off'; return false; };
  let bob = 0, lastT = performance.now(), hv = null, lyaw = null, lpitch = 0, swx = 0, swy = 0, swr = 0;
  function frame() {
    const now = performance.now(), dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    const on = holding(); HG.visible = !!on; if (!on) { lyaw = null; return false; }
    if (wkey() !== key) reset();
    try { if (window.__c345 && __c345.uk) { __c345.uk.want = 1; if (U.mapDone && UKF() && !ukUsed) compose(); } } catch (_) {}
    if (!U.mapDone) build(10); else if ((refT -= dt) <= 0) { refT = 4; const px = Math.floor(P.x), pz = Math.floor(P.z); for (let x = Math.max(0, px - 25); x < Math.min(W, px + 25); x++) for (let z = Math.max(0, pz - 25); z < Math.min(D, pz + 25); z++) wm[x * D + z] = -1; paintRect(px - 24, pz - 24, 48, 48); compose(); }
    if (!tex) { tex = new THREE.CanvasTexture(TX); try { tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); } catch (_) { tex.anisotropy = 4; } tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
      try { if (renderer.outputEncoding === THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding; } catch (_) {} plane.material.map = tex; plane.material.needsUpdate = true; if (!U.mapDone) compose(); }
    if (!U.mapDone && (U._pt = (U._pt || 0) + dt) > 0.4) { U._pt = 0; compose(); }
    mark.visible = !(typeof DIM !== 'undefined' && DIM.cur); inset.visible = mark.visible; if (inset.visible && (insT -= dt) <= 0) { insT = 0.25; drawInset(); } im2.rotation.z = P.yaw; const [cx, cy] = toC(P.x, P.z); mark.position.set((cx / 1024 - 0.5) * MS, (0.5 - cy / 1024) * MS, 0.001); mark.rotation.z = P.yaw;
    // sway: the map lags behind when you turn or look up/down, then springs back
    const yaw = P.yaw || 0, pitch = P.pitch || 0; if (lyaw === null) { lyaw = yaw; lpitch = pitch; }
    let dy = yaw - lyaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); const dp = pitch - lpitch; lyaw = yaw; lpitch = pitch;
    const k = 1 - Math.exp(-dt * 9), cl = v => Math.max(-0.06, Math.min(0.06, v));
    swx += (cl(dy * 0.9) - swx) * k; swy += (cl(-dp * 0.9) - swy) * k; swr += (cl(dy * 1.6) - swr) * k;
    const s = on === 'main' ? 1 : -1; fists[1].visible = s === 1; fists[-1].visible = s === -1;
    const mv = Math.hypot(P.vx || 0, P.vz || 0); bob += dt * (mv > 0.5 ? 7 : 1.5);
    // v1.0.23: fit the whole map on screen in landscape and portrait (pull it back on narrow screens), hand below it
    const tf = Math.tan((camera.fov || 75) * Math.PI / 360), asp = camera.aspect || 1, hx = MS * 0.515;
    const dd = Math.max(0.4, hx / (0.78 * tf * asp), MS * 1.02 / (1.62 * tf)), hH = dd * tf, room = Math.max(0, 1.62 * hH - MS * 1.02), ox = Math.max(0, Math.min(0.12 * dd / 0.4, 0.78 * hH * asp - hx));
    U.fit = {d: dd, asp, ox};
    HG.position.set(s * ox + swx + Math.sin(bob) * 0.004, -0.72 * hH + MS * 0.51 + room * 0.25 + swy + Math.abs(Math.cos(bob)) * 0.004, -dd); const nr = Math.min(1, Math.max(0.2, (asp - 0.5) / 0.8)); HG.rotation.set(-0.22 + swy * 1.5, (-s * 0.12 + swx * 2) * nr, (swr * 0.8 + s * 0.04) * nr);   // flatter on a narrow (portrait) screen so no corner runs off
    return on;
  }
  const rr = renderer.render.bind(renderer);
  renderer.render = function (sc, cam) { let hid = null, og = null;
    try { const on = cam === camera ? frame() : false;
      if (on === 'main') { hid = hand.visible; hand.visible = false; }
      else if (on === 'off') { try { camera.children.forEach(c => { if (c !== hand && c !== HG && c.visible && c.children.length && c.userData.c112off !== 0 && !c.isLight && c.children[0] && c.children[0].isMesh && c.children[0].geometry && c.children[0].geometry.parameters && c.children[0].geometry.parameters.depth === 0.55) { og = c; c.visible = false; } }); } catch (_) {} } } catch (e) { warn('map', e); }
    if (cam === camera) window.__mapHide = hid ? [hand] : og ? [og] : [];
    try { return rr(sc, cam); } finally { if (hid) hand.visible = true; if (og) og.visible = true; } };
  U.frame = frame; U.TX = TX;
  // v1.0.23: Reset world / Reset terrain (any regenerate) starts the map afresh
  const bump = () => { window.__mapGen = (window.__mapGen | 0) + 1; };
  try { const g0 = generate; generate = function () { try { return g0.apply(this, arguments); } finally { bump(); } }; } catch (_) {}
  try { const r0 = resetTerrain; resetTerrain = async function () { try { return await r0.apply(this, arguments); } finally { bump(); } }; } catch (_) {}

  // ---------------- 5. HD held tool models ----------------
  const KINDS = new Set(['pick', 'axe', 'sword', 'shovel', 'hoe']);
  const cv = (s, fn) => { const c = document.createElement('canvas'); c.width = c.height = s; fn(c.getContext('2d'), s); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  let TXH = null; const txh = () => TXH || (TXH = {
    brushed: cv(256, (g, s) => { g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, s, s); for (let i = 0; i < 1400; i++) { const v = 170 + Math.random() * 85 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * s, Math.random() * s, 30 + Math.random() * 90, 1); } }),
    stone: cv(256, (g, s) => { for (let i = 0; i < 2600; i++) { const v = 120 + Math.random() * 135 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * s, Math.random() * s, 2 + Math.random() * 9, 2 + Math.random() * 9); } }),
    grain: cv(256, (g, s) => { g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, s, s); for (let i = 0; i < 160; i++) { const v = 150 + Math.random() * 105 | 0; g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 1 + Math.random() * 3; g.beginPath(); const x = Math.random() * s; g.moveTo(x, 0); g.bezierCurveTo(x + 8, s * 0.3, x - 8, s * 0.6, x + 4, s); g.stroke(); } }),
    leather: cv(128, (g, s) => { g.fillStyle = '#3a2416'; g.fillRect(0, 0, s, s); for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${90 + Math.random() * 40 | 0},${55 + Math.random() * 25 | 0},30,.5)`; g.fillRect(Math.random() * s, Math.random() * s, 2, 2); } })});
  const MATS = {};
  function tierMats(mat) { if (MATS[mat]) return MATS[mat]; const X = toolX(), base = headMatFor(mat), T2 = txh(), metal = mat !== 'wood' && mat !== 'stone';
    const head = new THREE.MeshPhongMaterial({color: base.color.clone(), shininess: metal ? (mat === 'diamond' || mat === 'cobalt' ? 150 : 95) : mat === 'stone' ? 10 : 20, specular: metal ? 0xffffff : 0x303030,
      map: mat === 'stone' ? T2.stone : mat === 'wood' ? T2.grain : T2.brushed, emissive: mat === 'diamond' ? 0x06302e : mat === 'cobalt' ? 0x0a1440 : 0x000000});
    if (mat === 'wood') head.color.setHex(0x9a6a3c);
    const edge = new THREE.MeshPhongMaterial({color: base.color.clone().lerp(new THREE.Color(0xffffff), metal ? 0.55 : 0.25), shininess: metal ? 180 : 30, specular: 0xffffff, emissive: mat === 'diamond' ? 0x0c4a46 : 0x000000});
    const dark = new THREE.MeshPhongMaterial({color: base.color.clone().multiplyScalar(0.62), shininess: metal ? 70 : 8, specular: metal ? 0x888888 : 0x111111, map: head.map});
    const wrap = new THREE.MeshPhongMaterial({map: T2.leather, shininess: 12});
    return MATS[mat] = {head, edge, dark, wrap, haft: X.pale, haftD: X.dark, fit: metal ? head : new THREE.MeshPhongMaterial({color: 0x5a5e64, shininess: 70, specular: 0xaaaaaa, map: T2.brushed})};
  }
  const ex = (pts, depth, bev, segs) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
    const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.8, bevelSegments: segs || 3, curveSegments: 10}); g.translate(0, 0, -depth / 2);
    g.computeBoundingBox(); const bb = g.boundingBox, uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - bb.min.x) * 4, (p.getY(i) - bb.min.y) * 4); return g; };
  const lathe = (prof, segs) => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), segs || 14);
  function haftHD(g, M, len, y0, r0, r1, wrapAt) {
    const prof = [[0, 0], [r0 * 0.8, 0], [r0, 0.008], [r0, len * 0.5], [r1, len - 0.008], [r1 * 0.8, len], [0, len]];
    const h = new THREE.Mesh(lathe(prof), M.haft); h.position.y = y0; g.add(h);
    if (wrapAt) { const pts = []; const n = 70, turns = 6; for (let i = 0; i <= n; i++) { const t = i / n, a = t * turns * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * (r0 + 0.003), y0 + wrapAt[0] + t * (wrapAt[1] - wrapAt[0]), Math.sin(a) * (r0 + 0.003))); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, 0.0055, 5, false), M.wrap)); }
    return h; }
  function cap(g, M, y, r) { const c = new THREE.Mesh(lathe([[0, -0.012], [r * 0.7, -0.012], [r, -0.004], [r, 0.006], [r * 0.6, 0.014], [0, 0.016]], 14), M.fit); c.position.y = y; g.add(c); }
  function collar(g, M, w, h, d, x, y) { const b = new THREE.Mesh(ex([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], d, 0.006, 2), M.head); b.position.set(x || 0, y, 0); g.add(b); return b; }
  function buildHD(kind, mat) {
    const M = tierMats(mat), g = new THREE.Group();
    if (kind === 'pick') {
      haftHD(g, M, 0.52, -0.13, 0.024, 0.02, [0.0, 0.13]); cap(g, M, -0.13, 0.027);
      const o = [], inn = [], N = 14; for (let i = 0; i <= N; i++) { const t = i / N * 2 - 1, a = t * 1.05; o.push([Math.sin(a) * 0.25, Math.cos(a) * 0.25 - 0.25 + 0.03]); inn.push([Math.sin(a) * 0.235 * 0.97, Math.cos(a) * 0.225 - 0.25 + 0.03 - 0.03 * (1 - Math.abs(t)) - 0.012]); }
      const pts = o.concat(inn.reverse()); pts[0] = [o[0][0] * 1.04, o[0][1] - 0.012];
      const head = new THREE.Mesh(ex(pts, 0.03, 0.007), M.head); head.position.y = 0.37; g.add(head);
      for (const s of [-1, 1]) { const a = s * 1.05, tip = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 8), M.edge); tip.position.set(Math.sin(a) * 0.252, 0.37 + Math.cos(a) * 0.25 - 0.25 + 0.02, 0); tip.rotation.z = -a - s * Math.PI / 2 * 0.95; g.add(tip); }
      const ridge = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.0035, 4, 30, 1.9), M.edge); ridge.rotation.z = Math.PI / 2 - 0.95; ridge.position.y = 0.37 - 0.22; ridge.position.z = 0.0215; g.add(ridge);
      collar(g, M, 0.056, 0.07, 0.05, 0, 0.36); const w = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.058), M.dark); w.position.y = 0.395; g.add(w);
    } else if (kind === 'axe') {
      haftHD(g, M, 0.48, -0.12, 0.026, 0.02, [0.0, 0.12]); cap(g, M, -0.12, 0.029);
      const head = new THREE.Mesh(ex([[0.04, 0.038], [-0.04, 0.032], [-0.1, 0.078], [-0.15, 0.07], [-0.172, 0.0], [-0.162, -0.09], [-0.132, -0.165], [-0.105, -0.125], [-0.07, -0.05], [-0.035, -0.032], [0.04, -0.038]], 0.022, 0.007), M.head); head.position.y = 0.3; g.add(head);
      const edge = new THREE.Mesh(ex([[-0.152, 0.068], [-0.172, 0.0], [-0.162, -0.09], [-0.132, -0.165], [-0.14, -0.155], [-0.156, -0.09], [-0.164, 0.0], [-0.146, 0.062]], 0.026, 0.003, 2), M.edge); edge.position.y = 0.3; g.add(edge);
      collar(g, M, 0.066, 0.085, 0.054, 0.012, 0.3); const poll = new THREE.Mesh(ex([[0.04, 0.03], [0.07, 0.024], [0.07, -0.024], [0.04, -0.03]], 0.04, 0.006, 2), M.dark); poll.position.y = 0.3; g.add(poll);
      for (const z of [-1, 1]) { const rv = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), M.edge); rv.position.set(-0.06, 0.31, z * 0.016); g.add(rv); }
    } else if (kind === 'sword') {
      const blade = new THREE.Mesh(ex([[-0.03, 0], [0.027, 0], [0.021, 0.3], [0.007, 0.5], [0, 0.535], [-0.013, 0.42], [-0.025, 0.2]], 0.004, 0.0065, 3), M.head); blade.position.y = 0.03; g.add(blade);
      const edge = new THREE.Mesh(ex([[0.022, 0.02], [0.028, 0.02], [0.022, 0.3], [0.008, 0.5], [0.001, 0.535], [0.004, 0.5], [0.017, 0.3]], 0.006, 0.002, 1), M.edge); edge.position.y = 0.03; g.add(edge);
      const ful = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.32, 0.016), M.dark); ful.position.set(0.0, 0.22, 0); g.add(ful);
      const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 12), M.fit); guard.rotation.z = Math.PI / 2; guard.position.y = 0.025; g.add(guard);
      for (const s of [-1, 1]) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), M.fit); k.position.set(s * 0.047, 0.025, 0); g.add(k); }
      const grip = new THREE.Mesh(lathe([[0.018, -0.13], [0.022, -0.11], [0.024, -0.06], [0.022, -0.01], [0.018, 0.012]], 14), M.wrap); g.add(grip);
      for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.0235, 0.003, 5, 16), M.haftD); r.rotation.x = Math.PI / 2; r.position.y = -0.115 + i * 0.026; g.add(r); }
      const pom = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 10), M.fit); pom.scale.y = 0.8; pom.position.y = -0.145; g.add(pom);
      g.userData.sword = true;
    } else if (kind === 'shovel') {
      haftHD(g, M, 0.39, -0.08, 0.02, 0.019, [0.02, 0.12]);
      const dg = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.009, 8, 18, Math.PI), M.haftD); dg.rotation.z = Math.PI; dg.position.y = -0.08; g.add(dg);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.085, 10), M.haftD); bar.rotation.z = Math.PI / 2; bar.position.y = -0.12; g.add(bar);
      const sock = new THREE.Mesh(lathe([[0.022, 0], [0.03, 0.06], [0.034, 0.085], [0.0, 0.086]], 14), M.head); sock.position.y = 0.3; g.add(sock);
      const blade = new THREE.Mesh(ex([[-0.066, 0], [0.066, 0], [0.07, 0.12], [0.045, 0.165], [0, 0.19], [-0.045, 0.165], [-0.07, 0.12]], 0.006, 0.006), M.head); blade.position.y = 0.375; g.add(blade);
      const rid = new THREE.Mesh(ex([[-0.01, 0], [0.01, 0], [0.006, 0.12], [-0.006, 0.12]], 0.012, 0.003, 2), M.dark); rid.position.y = 0.375; g.add(rid);
      const lip = new THREE.Mesh(ex([[0.07, 0.118], [0.074, 0.12], [0.048, 0.17], [0, 0.196], [-0.048, 0.17], [-0.074, 0.12], [-0.07, 0.118], [-0.045, 0.162], [0, 0.185], [0.045, 0.162]], 0.008, 0.002, 1), M.edge); lip.position.y = 0.375; g.add(lip);
    } else if (kind === 'hoe') {
      haftHD(g, M, 0.58, -0.15, 0.019, 0.017, [0.0, 0.12]); cap(g, M, -0.15, 0.022);
      collar(g, M, 0.046, 0.055, 0.042, 0, 0.405);
      const neck = new THREE.Mesh(ex([[0.0, 0.012], [-0.07, 0.01], [-0.075, -0.008], [0.0, -0.012]], 0.026, 0.004, 2), M.head); neck.position.set(-0.01, 0.415, 0); g.add(neck);
      const blade = new THREE.Mesh(ex([[-0.025, 0.012], [0.025, 0.012], [0.033, -0.105], [-0.033, -0.105]], 0.008, 0.004), M.head); blade.position.set(-0.088, 0.415, 0); blade.rotation.y = 0.5; g.add(blade);
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.008, 0.012), M.edge); e.position.set(-0.088, 0.31, 0); e.rotation.y = 0.5; g.add(e);
    } else return null;
    g.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
    return g;
  }
  const bt = buildToolModel; buildToolModel = function (kind, mat) { if (KINDS.has(kind)) { try { const g = buildHD(kind, mat); if (g) return g; } catch (e) { warn('tool', e); } } return bt.apply(this, arguments); };
  U.buildHD = buildHD;

  // ---------------- 6. HD icons rendered from the held models (once, a second after load) ----------------
  function makeIcons() {
    const ids = Object.keys(TOOL).map(Number).filter(id => KINDS.has(TOOL[id][0]) && !GONE.has(id) && id !== IT.CLAYMORE);
    if (!ids.length) return; const S = 256;
    const r2 = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true}); r2.setPixelRatio(1); r2.setSize(S, S, false); r2.setClearColor(0x000000, 0);
    try { if ('outputColorSpace' in renderer) r2.outputColorSpace = renderer.outputColorSpace; else if ('outputEncoding' in renderer) r2.outputEncoding = renderer.outputEncoding; } catch (_) {}
    const sc = new THREE.Scene(); sc.add(new THREE.AmbientLight(0xffffff, 0.55)); const dl = new THREE.DirectionalLight(0xffffff, 0.95); dl.position.set(-1, 2, 3); sc.add(dl); const d2 = new THREE.DirectionalLight(0xbfd8ff, 0.35); d2.position.set(2, -1, 1); sc.add(d2);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10); const bb = new THREE.Box3(), sz = new THREE.Vector3(), ctr = new THREE.Vector3();
    for (const id of ids) { try { const kind = TOOL[id][0], g = buildToolModel(kind, toolMat(id)); if (!g) continue; const piv = new THREE.Group(); piv.add(g);
        g.rotation.set(0.35, kind === 'sword' ? 0.35 : 0.5, 0); piv.rotation.z = -Math.PI / 4;
        sc.add(piv); piv.updateMatrixWorld(true); bb.setFromObject(piv); bb.getSize(sz); bb.getCenter(ctr); const h = Math.max(sz.x, sz.y) * 0.54;
        cam.left = ctr.x - h; cam.right = ctr.x + h; cam.top = ctr.y + h; cam.bottom = ctr.y - h; cam.updateProjectionMatrix();
        r2.render(sc, cam); ICONS[id] = r2.domElement.toDataURL('image/png'); U.icons++; sc.remove(piv); } catch (e) { warn('icon', e); } }
    try { r2.dispose(); r2.forceContextLoss(); } catch (_) {}
    try { renderHotbar(); } catch (_) {}
  }
  setTimeout(() => { try { makeIcons(); } catch (e) { warn('icons', e); } }, 1200);
})();
