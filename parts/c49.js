
/* ===================== GLX-C49 (v0.9.45): bees (bespectacled cartoon head on a striped honeybee body) + wild beehives, honeycomb, honey ===================== */
(function c49() {
  const HIVE = 244, COMB = 245, BOTTLE = 246, HONEY = 247, BEE_EGG = 318;
  T.BEEHIVE = HIVE; IT.HONEYCOMB = COMB; IT.BOTTLE = BOTTLE; IT.HONEYBOTTLE = HONEY; IT.EGG_BEE = BEE_EGG;
  // ---- hive texture: our own pixel-art layered wax dome (drawn on a 32 grid, scaled crisp) ----
  function hiveTex(front, top) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const s = 8; g.fillStyle = '#7a4a14'; g.fillRect(0, 0, 256, 256);
    const band = ['#f6c21c', '#f0a91c', '#f8d13a', '#e8961a'];
    for (let r = 0; r < 32; r++) { const w = top ? 30 : Math.round(30 * Math.sqrt(Math.max(0, 1 - Math.pow((r - 16) / 17, 2)))) ; const x0 = 16 - (w >> 1);
      const b = band[(r >> 2) % 4]; g.fillStyle = b; g.fillRect(x0 * s, r * s, w * s, s);
      if (r % 4 === 3) { g.fillStyle = '#c87414'; g.fillRect(x0 * s, r * s, w * s, s); }
      if (r % 4 === 0 && w > 8) { g.fillStyle = '#ffe98a'; g.fillRect((x0 + 3 + (r % 3)) * s, r * s, Math.max(2, (w >> 2)) * s, s); } }
    if (top) { g.fillStyle = '#c87414'; for (let i = 0; i < 6; i++) g.fillRect(0, i * 40 + 12, 256, 6); }
    if (front) { g.fillStyle = '#3a1c08'; const hole = [[13, 17, 6], [12, 18, 8], [12, 19, 8], [12, 20, 8], [12, 21, 8], [13, 22, 6]]; for (const [x, y, w] of hole) g.fillRect(x * s, y * s, w * s, s); g.fillStyle = '#5a2e10'; g.fillRect(13 * s, 17 * s, 6 * s, s); }
    return c.toDataURL(); }
  TEX.beehive_side = hiveTex(false, false); TEX.beehive_front = hiveTex(true, false); TEX.beehive_top = hiveTex(false, true);
  FACES[HIVE] = ['beehive_side', 'beehive_side', 'beehive_top', 'beehive_top', 'beehive_front', 'beehive_side'];
  BLOCK_MATS[HIVE] = FACES[HIVE].map(k => mat(k)); ICON_KEY[HIVE] = 'beehive_front'; NAMES[HIVE] = 'Beehive';
  HARD[HIVE] = 0.6; MC_HARD[HIVE] = 0.6; REQ[HIVE] = 0; PLACEABLE.add(HIVE);
  try { __NAT[HIVE] = 1; } catch (_) {}
  NAMES[COMB] = 'Honeycomb'; NAMES[BOTTLE] = 'Glass bottle'; NAMES[HONEY] = 'Honey bottle'; NAMES[BEE_EGG] = 'Spawn egg: bee';
  ICONS[COMB] = drawIcon(g => { for (const [x, y] of [[-9, -8], [9, -8], [0, 7], [-18, 7], [18, 7], [-9, 22], [9, 22]]) { g.fillStyle = '#e8a01a'; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.lineTo(x + Math.cos(a) * 10, y - 8 + Math.sin(a) * 10); } g.closePath(); g.fill(); g.fillStyle = '#ffd24a'; g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.lineTo(x + Math.cos(a) * 6.5, y - 8 + Math.sin(a) * 6.5); } g.closePath(); g.fill(); } });
  const bottle = fill => drawIcon(g => { g.fillStyle = 'rgba(200,230,255,.35)'; g.strokeStyle = '#dfefff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-6, -26); g.lineTo(6, -26); g.lineTo(6, -12); g.quadraticCurveTo(20, -4, 18, 14); g.quadraticCurveTo(16, 28, 0, 28); g.quadraticCurveTo(-16, 28, -18, 14); g.quadraticCurveTo(-20, -4, -6, -12); g.closePath(); g.fill(); g.stroke();
    if (fill) { g.fillStyle = '#f0a010'; g.beginPath(); g.moveTo(-16, 4); g.quadraticCurveTo(0, 0, 16, 4); g.quadraticCurveTo(16, 26, 0, 26); g.quadraticCurveTo(-16, 26, -16, 4); g.fill(); g.fillStyle = 'rgba(255,240,160,.7)'; g.fillRect(-10, 8, 4, 10); }
    g.fillStyle = '#8a5a2a'; g.fillRect(-7, -32, 14, 7); });
  ICONS[BOTTLE] = bottle(false); ICONS[HONEY] = bottle(true);
  ICONS[BEE_EGG] = drawIcon(g => { g.fillStyle = '#f2c21a'; g.beginPath(); g.ellipse(0, 2, 18, 24, 0, 0, 7); g.fill(); g.fillStyle = '#1a1a1a'; for (const y of [-8, 4, 16]) g.fillRect(-18, y, 36, 5); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(-6, -10, 5, 8, -0.4, 0, 7); g.fill(); });
  for (const id of [HIVE, COMB, BOTTLE, HONEY, BEE_EGG]) { if (!ORDER.includes(id)) ORDER.push(id); if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(id); }
  FOOD[HONEY] = [6, 1.2];
  RECIPES.push(rc('3 Glass bottles', '3 Glass', BOTTLE, 3, [[T.GLASS, 3]], 0));
  RECIPES.push(rc('Beehive', '6 Planks + 3 Honeycomb', HIVE, 1, [[T.PLANKS, 6], [COMB, 3]], 1));
  try { buildCraftList(); } catch (_) {}
  // ---- bee model ----
  const BM = {};
  function stripeTex() { const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
    for (let x = 0; x < 128; x++) { const k = Math.floor(x / 21) % 2; g.fillStyle = k ? '#2a1a0c' : '#e0a628'; g.fillRect(x, 0, 1, 128); }
    for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,220,140,.35)' : 'rgba(60,30,0,.35)'; g.fillRect(Math.random() * 128, Math.random() * 128, 1, 2 + Math.random() * 3); }
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t; }
  function faceTex() { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#f7d81e'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#e2bf10'; g.fillRect(0, 100, 128, 28);
    g.strokeStyle = '#1a1a1a'; g.lineWidth = 6; g.fillStyle = 'rgba(235,245,255,.95)'; for (const x of [36, 92]) { g.beginPath(); g.arc(x, 54, 20, 0, 7); g.fill(); g.stroke(); }
    g.beginPath(); g.moveTo(56, 52); g.lineTo(72, 52); g.stroke(); g.fillStyle = '#111'; for (const x of [40, 88]) g.fillRect(x - 4, 52, 7, 7);
    g.lineWidth = 4; g.beginPath(); g.moveTo(52, 102); g.quadraticCurveTo(64, 96, 76, 102); g.stroke(); g.fillStyle = '#d8a810'; g.fillRect(58, 72, 12, 16);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.LinearFilter; return t; }
  function makeBee() {
    if (!BM.body) { BM.body = new THREE.MeshLambertMaterial({map: stripeTex()}); BM.face = new THREE.MeshLambertMaterial({map: faceTex()}); BM.yellow = new THREE.MeshLambertMaterial({color: 0xf2d01c}); BM.hair = new THREE.MeshLambertMaterial({color: 0x161616});
      BM.wing = new THREE.MeshBasicMaterial({color: 0xdfefff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false}); BM.leg = new THREE.MeshLambertMaterial({color: 0x6a2e14}); BM.fur = new THREE.MeshLambertMaterial({color: 0xc88a2a});
      for (const k in BM) BM[k].userData.shared = true; }
    const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
    const box = (w, h, d, m, x, y, z, par) => { const ms = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); ms.position.set(x, y, z); (par || rig).add(ms); return ms; };
    // striped abdomen (along +z = back), fuzzy thorax, cartoon head in front (-z)
    const abd = box(0.2, 0.2, 0.3, [BM.body, BM.body, BM.body, BM.body, BM.fur, BM.body], 0, 0, 0.14); abd.rotation.x = 0.25;
    box(0.06, 0.06, 0.06, BM.hair, 0, -0.04, 0.31);
    box(0.17, 0.17, 0.14, BM.fur, 0, 0.02, -0.06);
    const head = new THREE.Group(); head.position.set(0, 0.1, -0.2); rig.add(head);
    box(0.2, 0.2, 0.17, [BM.yellow, BM.yellow, BM.yellow, BM.yellow, BM.yellow, BM.face], 0, 0, 0, head);
    box(0.22, 0.07, 0.2, BM.hair, 0, 0.12, 0.0, head); const quiff = box(0.16, 0.07, 0.09, BM.hair, 0, 0.15, -0.09, head); quiff.rotation.x = -0.5;
    box(0.04, 0.05, 0.04, BM.yellow, 0.115, 0.0, 0.02, head); box(0.04, 0.05, 0.04, BM.yellow, -0.115, 0.0, 0.02, head);
    const wings = []; for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(0.07 * s, 0.11, -0.03); rig.add(piv); const w = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.11), BM.wing); w.rotation.x = -Math.PI / 2; w.position.set(0.13 * s, 0, 0.05); piv.add(w); wings.push(piv); }
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const l = box(0.02, 0.1, 0.02, BM.leg, 0.07 * s, -0.1, -0.1 + i * 0.07); l.rotation.z = 0.4 * s; }
    g.scale.setScalar(1.3);
    return {g, rig, head, wings, mats: [], speed: 2, hp: 3, hitY: 0.1, hitR: 0.35, tall: 1};
  }
  window.makeBee = makeBee;
  // ---- bee brains (kept out of the ground-mob physics) ----
  const FLOWERS = new Set([T.HEATHER, T.DANDELION, T.DAFFODIL, T.BLUEBELL, T.THISTLE].filter(v => v !== undefined));
  const bees = () => mobs.filter(a => a.kind === 'bee');
  function newBee(x, y, z, home) {
    const a = makeBee(); Object.assign(a, {kind: 'bee', flee: 0, angry: 0, biteCd: 0, moving: true, ang: Math.random() * 6.28, timer: 0, flash: 0, kbx: 0, kbz: 0, vy: 0, onGround: false, burning: 0, fire: 0, fireTick: 0, walk: 0, sndT: 3, home, tgt: null, st: 'wander', stT: 0, ph: Math.random() * 6, named: true, beeHp: 3, stung: false});
    a.g.position.set(x, y, z); scene.add(a.g); mobs.push(a); return a; }
  window.newBee = newBee;
  const sm = spawnMob; spawnMob = function (kind) { if (kind !== 'bee') return sm.apply(this, arguments); const s = window.__eggSpot || [P.x + 2, P.y + 1, P.z]; return newBee(s[0], s[1] + 0.8, s[2], null); };
  const keyH = (x, y, z) => x + ',' + y + ',' + z;
  function findFlower(cx, cy, cz) { for (let t = 0; t < 30; t++) { const x = Math.round(cx + (Math.random() - .5) * 16), z = Math.round(cz + (Math.random() - .5) * 16); for (let y = Math.round(cy) + 4; y > cy - 10; y--) { const b = getB(x, y, z); if (FLOWERS.has(b)) return [x + .5, y + .6, z + .5]; if (b && b !== T.LEAVES && b !== HIVE) break; } } return null; }
  function hiveMeta(h) { const k = keyH(...h); let m = entMeta.get(k); if (!m || m.honey === undefined) { m = Object.assign(m || {}, {honey: 5}); entMeta.set(k, m); } return m; }
  function stepBee(a, dt) {
    const p = a.g.position; a.ph += dt; a.stT -= dt;
    a.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (0.3 + Math.sin(a.ph * 70) * 0.55); });
    a.rig.position.y = Math.sin(a.ph * 3) * 0.04;
    if (a.home && getB(...a.home) !== HIVE) a.home = null;
    let goal = null, spd = 1.6;
    if (a.angry > 0 && !dead) { a.angry -= dt; goal = [P.x, P.y + 1.1, P.z]; spd = 4.2;
      if (Math.hypot(P.x - p.x, P.y + 1.1 - p.y, P.z - p.z) < 0.9 && !a.stung) { a.stung = true; a.angry = 0; try { hurt(2, 'Stung by a bee'); } catch (_) {} sfx('hit', 0.4); a.dieT = 8; } }
    else if (a.st === 'flower' && a.tgt) { goal = a.tgt; if (Math.hypot(goal[0] - p.x, goal[1] - p.y, goal[2] - p.z) < 0.5) { if (a.stT < -3.5 || a.stT > 0) a.stT = 3; if (Math.random() < dt * 5) burst(p.x, p.y - 0.15, p.z, 0xfff070, 1, .15); if (a.stT <= 0.05 && a.stT > -1) { a.pollen = true; a.st = 'home'; a.stT = 0; } } }
    else if (a.st === 'home' && a.home) { goal = [a.home[0] + .5, a.home[1] - 0.4, a.home[2] + .5]; if (Math.hypot(goal[0] - p.x, goal[1] - p.y, goal[2] - p.z) < 0.6) { if (a.pollen) { const m = hiveMeta(a.home); m.honey = Math.min(5, (m.honey || 0) + 1); a.pollen = false; } a.st = 'wander'; a.stT = 2 + Math.random() * 3; } }
    else { if (a.stT <= 0) { const c = a.home ? [a.home[0], a.home[1] - 1, a.home[2]] : [p.x, p.y, p.z]; if (Math.random() < 0.55) { const f = findFlower(...c); if (f) { a.st = 'flower'; a.tgt = f; a.stT = 99; } } if (a.st === 'wander') { a.tgt = [c[0] + (Math.random() - .5) * 8, c[1] + Math.random() * 2.5 - 0.5, c[2] + (Math.random() - .5) * 8]; a.stT = 2 + Math.random() * 3; if (a.home && Math.random() < 0.3) { a.st = 'home'; } } } goal = a.tgt; }
    if (goal) { const dx = goal[0] - p.x, dy = goal[1] - p.y, dz = goal[2] - p.z, d = Math.hypot(dx, dy, dz) || 1, sp = Math.min(spd, d * 3);
      let nx = p.x + dx / d * sp * dt, ny = p.y + dy / d * sp * dt + Math.sin(a.ph * 5) * 0.003, nz = p.z + dz / d * sp * dt;
      if (solid(Math.floor(nx), Math.floor(ny), Math.floor(nz))) { ny = p.y + 1.5 * dt; nx = p.x; nz = p.z; a.stT = Math.min(a.stT, 0.3); }
      p.set(nx, ny, nz); if (Math.hypot(dx, dz) > 0.05) { const want = Math.atan2(-dx, -dz); let df = want - a.g.rotation.y; df = Math.atan2(Math.sin(df), Math.cos(df)); a.g.rotation.y += df * Math.min(1, dt * 6); } }
    if (a.dieT !== undefined) { a.dieT -= dt; if (a.dieT <= 0) { burst(p.x, p.y, p.z, 0xe0a628, 6, .3); removeMob(a); return; } }
    if (a.flash > 0) a.flash -= dt;
  }
  const um = updateMobs;
  updateMobs = function (dt) { const bs = []; for (let i = mobs.length - 1; i >= 0; i--) if (mobs[i].kind === 'bee') { bs.push(mobs[i]); mobs.splice(i, 1); }
    try { return um.apply(this, arguments); } finally { for (const b of bs) mobs.push(b); for (const b of bs) { try { if (Math.hypot(b.g.position.x - P.x, b.g.position.z - P.z) > 90 && b.home) { removeMob(b); continue; } stepBee(b, dt); } catch (e) {} } buzz(); } };
  // a passive bee only stings once you hit it (and its friends join in)
  const dm = damageMob; damageMob = function (a, dmg, byPlayer) { if (a.kind !== 'bee') return dm.apply(this, arguments);
    a.beeHp -= dmg; a.flash = 0.25; const p = a.g.position; burst(p.x, p.y, p.z, 0xe0a628, 4, .3);
    if (a.beeHp <= 0) { removeMob(a); try { dropXP(p.x, p.y, p.z, 2); } catch (_) {} return; }
    if (byPlayer && !a.stung) { a.angry = 20; for (const b of bees()) if (b !== a && !b.stung && b.home && a.home && b.home.join() === a.home.join()) b.angry = 20; } };
  const km = killMob; killMob = function (a) { if (a.kind === 'bee') { removeMob(a); return; } return km.apply(this, arguments); };
  // quiet buzz: one shared voice whose loudness follows the nearest bee
  let bz = null;
  function buzz() { if (!AC) return; let dmin = 99; for (const b of mobs) if (b.kind === 'bee') { const q = b.g.position; dmin = Math.min(dmin, Math.hypot(q.x - P.x, q.y - P.y - 1, q.z - P.z)); }
    if (!bz) { if (dmin > 10) return; const o = AC.createOscillator(), o2 = AC.createOscillator(), lf = AC.createOscillator(), lg = AC.createGain(), g = AC.createGain(), f = AC.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = 218; o2.type = 'sawtooth'; o2.frequency.value = 223; lf.frequency.value = 23; lg.gain.value = 14; lf.connect(lg); lg.connect(o.frequency); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 1.2; o.connect(f); o2.connect(f); f.connect(g); g.gain.value = 0; g.connect(AC.destination); o.start(); o2.start(); lf.start(); bz = {g}; }
    const v = dmin < 10 ? 0.022 * SET.sfx * Math.pow(1 - dmin / 10, 2) : 0; bz.g.gain.setTargetAtTime(paused || menuOpen ? 0 : v, AC.currentTime, 0.15); }
  // ---- wild hives: hanging under trees near flowers, 2-3 bees each ----
  function placeHives() { if (DIM.cur) return 0; let n = 0; const want = 14;
    for (let t = 0; t < 6000 && n < want; t++) { const x = 6 + Math.floor(Math.random() * (W - 12)), z = 6 + Math.floor(Math.random() * (D - 12));
      let y = H - 3; while (y > 2 && world[idx(x, y, z)] !== T.LEAVES) { if (world[idx(x, y, z)] && world[idx(x, y, z)] !== T.LEAVES) { y = 0; break; } y--; } if (y < 4) continue;
      let ly = y; while (ly > 2 && world[idx(x, ly - 1, z)] === T.LEAVES) ly--;   // bottom leaf of the canopy
      if (world[idx(x, ly - 1, z)] !== T.AIR || world[idx(x, ly - 2, z)] !== T.AIR) continue;
      let fl = 0; for (let a = -6; a <= 6; a++) for (let c = -6; c <= 6; c++) { const g = solidTop(x + a, z + c); const b = world[idx(x + a, g + 1, z + c)]; if (FLOWERS.has(b) || FLOWERS.has(world[idx(x + a, g, z + c)])) fl++; } if (fl < 2) continue;
      world[idx(x, ly - 1, z)] = HIVE; entMeta.set(keyH(x, ly - 1, z), {honey: 5, face: Math.floor(Math.random() * 4)}); n++; }
    return n; }
  const ge = generate; generate = function () { const r = ge.apply(this, arguments); try { const was = c37busy; c37busy = true; window.__hives = placeHives(); c37busy = was; } catch (e) { console.warn('c49', e); } return r; };
  // bees for nearby hives (respawned as you wander)
  setInterval(() => { if (!started || DIM.cur || paused) return; try { const px = Math.floor(P.x), pz = Math.floor(P.z); let total = bees().length; if (total > (PERF ? 9 : 15)) return;
    for (let x = Math.max(1, px - 40); x < Math.min(W - 1, px + 40); x += 1) for (let z = Math.max(1, pz - 40); z < Math.min(D - 1, pz + 40); z += 1) { const base = (x * H) * D + z; for (let y = 3; y < H - 2; y++) { if (world[base + y * D] !== HIVE) continue;
      const h = [x, y, z], hk = h.join(); const mine = bees().filter(b => b.home && b.home.join() === hk).length, m = hiveMeta(h); if (m.beesN === undefined) m.beesN = 2 + (Math.random() < .5 ? 1 : 0);
      for (let i = mine; i < m.beesN && total < 15; i++, total++) newBee(x + .5 + (Math.random() - .5), y - 0.5, z + .5 + (Math.random() - .5), h); } } } catch (_) {} }, 3000);
  // ---- harvesting: shears -> honeycomb, bottle -> honey ----
  const ui = useItem;
  useItem = function () {
    if (!menuOpen && !paused && !dead && started) { const r = raycast(5); if (r && r.hit && getB(...r.hit) === HIVE) { const m = hiveMeta(r.hit), [x, y, z] = r.hit;
      if (selId === IT.SHEARS && cnt(IT.SHEARS)) { if (m.honey >= 3) { m.honey = 0; dropItem(COMB, 3, x + .5, y - .2, z + .5, 0, 1, 0, .2); sfx('pop', .5); toast('Honeycomb!'); } else toast('The hive needs more honey (' + m.honey + '/3) - let the bees visit flowers'); swing(); return; }
      if (selId === BOTTLE && cnt(BOTTLE)) { if (m.honey >= 1) { m.honey--; useUp(BOTTLE); addItem(HONEY, 1); sfx('pop', .5); renderHotbar(); toast('Honey bottle'); } else toast('The hive is empty'); swing(); return; }
      if (selId === BEE_EGG) {} } }
    if (selId === BEE_EGG && cnt(BEE_EGG) && started && !menuOpen && !paused) { const d = lookDir(); newBee(P.x + d[0] * 2, P.y + 1.4, P.z + d[2] * 2, null); if (!MODE.infinite) useUp(BEE_EGG); renderHotbar(); sfx('pop', .5); return; }
    return ui.apply(this, arguments);
  };
  window.__beeHive = {placeHives, hiveMeta, stepBee};
})();
