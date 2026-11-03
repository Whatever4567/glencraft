/* ===================== GLX-C102 (v0.9.83): jetpack (chestplate slot) ===================== */
(function c102jet() {
  const JET = 291; IT.JETPACK = JET;
  NAMES[JET] = 'Jetpack'; ARMOUR[JET] = {slot: 4, mat: 'jet', pts: 2}; ARMOUR_COL.jet = 0x70757e; MATCOL.jet = '#7a808a';
  ICONS[JET] = drawIcon(g => {
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    r(70, 40, 116, 26, '#3a3e46'); r(62, 60, 132, 120, '#8a9098'); r(70, 66, 116, 108, '#a9afb8'); r(116, 70, 24, 100, '#5c626c');
    for (const x of [52, 152]) { r(x, 84, 52, 120, '#4c525c'); r(x + 6, 88, 40, 112, '#6c737e'); r(x + 4, 196, 44, 18, '#2a2d33'); }
    g.fillStyle = '#ffb030'; for (const x of [78, 178]) { g.beginPath(); g.moveTo(x - 18, 214); g.lineTo(x + 18, 214); g.lineTo(x, 252); g.fill(); }
    g.fillStyle = '#fff2a0'; for (const x of [78, 178]) { g.beginPath(); g.moveTo(x - 8, 214); g.lineTo(x + 8, 214); g.lineTo(x, 236); g.fill(); }
    r(96, 110, 64, 14, '#c23a2a'); });
  RECIPES.push(rc('Jetpack', '4 Iron ingots, 2 Redstone, 2 Coal', JET, 1, [[IT.IRONINGOT, 4], [IT.REDSTONE, 2], [IT.COAL, 2]], 1));
  if (!ORDER.includes(JET)) ORDER.push(JET); try { if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(JET)) CREATIVE_ALL.push(JET); } catch (_) {}
  // ---- the model on your back: a pack and two thrusters with flames ----
  const mBody = new THREE.MeshLambertMaterial({color: 0x8a9098}), mDark = new THREE.MeshLambertMaterial({color: 0x3a3e46}), mRed = new THREE.MeshLambertMaterial({color: 0xc23a2a});
  const mFl = new THREE.MeshBasicMaterial({color: 0xffa030, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending});
  const flames = [];
  const dm = dressModel; dressModel = function (model) {
    if (!model || armour[4] !== JET) return dm.apply(this, arguments);
    armour[4] = 0; let r; try { r = dm.apply(this, arguments); } finally { armour[4] = JET; }
    const u = model.userData, add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; u.torso.add(o); u.armourParts.push(o); return o; };
    add(new THREE.BoxGeometry(0.42, 0.5, 0.16), mBody, 0, 1.2, -0.27); add(new THREE.BoxGeometry(0.44, 0.06, 0.18), mDark, 0, 1.46, -0.27); add(new THREE.BoxGeometry(0.1, 0.1, 0.02), mRed, 0, 1.28, -0.36);
    for (const sx of [-1, 1]) { add(new THREE.CylinderGeometry(0.075, 0.075, 0.5, 10), mBody, sx * 0.15, 1.1, -0.4); add(new THREE.CylinderGeometry(0.06, 0.09, 0.08, 10), mDark, sx * 0.15, 0.82, -0.4);
      const f = add(new THREE.ConeGeometry(0.07, 0.34, 8), mFl, sx * 0.15, 0.62, -0.4); f.rotation.x = Math.PI; f.castShadow = false; f.visible = false; f.userData.jetFlame = 1; }
    for (let i = flames.length - 1; i >= 0; i--) if (!flames[i].parent) flames.splice(i, 1); u.armourParts.forEach(o => { if (o.userData.jetFlame) flames.push(o); });
    return r; };
  // ---- particles + sound ----
  const pGeo = new THREE.BoxGeometry(0.09, 0.09, 0.09), parts = [];
  const pMats = [0xfff0a0, 0xffb030, 0xff6a20, 0x8a8a8a].map(c => new THREE.MeshBasicMaterial({color: c, transparent: true, opacity: 0.9, depthWrite: false}));
  function puff(dt) { const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    for (let n = 0; n < 2; n++) for (const sx of [-1, 1]) { let p = parts.find(q => !q.visible); if (!p) { if (parts.length > 90) continue; p = new THREE.Mesh(pGeo, pMats[0]); scene.add(p); parts.push(p); }
      p.visible = true; p.userData.t = 0; p.userData.life = 0.35 + Math.random() * 0.25; p.material = pMats[1];   /* GLX-C118: no pale square sitting at each nozzle */
      p.position.set(P.x - fx * 0.42 + rx * sx * 0.15 + (Math.random() - .5) * 0.08, P.y + 0.5 - Math.random() * 0.35, P.z - fz * 0.42 + rz * sx * 0.15 + (Math.random() - .5) * 0.08);
      p.userData.v = [(Math.random() - .5) * 1.2, -6 - Math.random() * 3, (Math.random() - .5) * 1.2]; } }
  function stepParts(dt) { for (const p of parts) { if (!p.visible) continue; const u = p.userData; u.t += dt; if (u.t > u.life) { p.visible = false; continue; }
    const k = u.t / u.life; p.material = pMats[Math.min(3, 1 + Math.floor(k * 3))]; p.position.x += u.v[0] * dt; p.position.y += u.v[1] * dt; p.position.z += u.v[2] * dt; u.v[1] *= 0.9; p.scale.setScalar(1 + k * 2.5); } }
  let snd = null;
  function sound(on) { try { if (!AC || !noiseBuf) return; if (!snd) { const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 180; bp.Q.value = 0.7;
        const g = AC.createGain(); g.gain.value = 0; s.connect(lp); lp.connect(g); s.connect(bp); bp.connect(g); g.connect(master); s.start(); snd = {g, lp}; }
      const t = AC.currentTime; snd.g.gain.setTargetAtTime(on ? 0.55 : 0, t, on ? 0.05 : 0.12); snd.lp.frequency.setTargetAtTime(on ? 1400 : 600, t, 0.1); } catch (_) {} }
  // ---- flight ----
  const S = window.__c102j = {boost: false, air: 0, maxH: 0};
  const up = updatePlayer;
  updatePlayer = function (dt, mx, mz) {
    const on = armour[4] === JET && !(MODE.fly && flying) && !heldBy && !(typeof riding !== 'undefined' && riding);
    if (!on) { if (S.boost) { S.boost = false; sound(false); flames.forEach(f => f.visible = false); } return up.apply(this, arguments); }
    if (!P.onGround) P.fallTop = P.y;   // no fall damage while you wear it
    const r = up.apply(this, arguments);
    const hold = jumpHeld || jumpHeldPad || !!keys.Space;
    S.air = P.onGround ? 0 : S.air + dt;
    const boost = hold && !swimming && (S.air > 0.12 || !P.onGround);
    if (boost) { /* v1.0.116: no ceiling, the jetpack climbs faster the higher you go, on up through the firmament and the atmosphere to space */ const vm = P.y > H ? Math.min(70, 12 + (P.y - H) * 0.12) : 12; P.vy = Math.min(vm, P.vy + 52 * dt); P.fallTop = null; puff(dt); }
    else if (!P.onGround && !swimming && S.air > 0.25 && P.vy < -3.5) P.vy = -3.5;   // gentle glide down
    if (!P.onGround && !swimming && S.air > 0.15) {   // steering in the air at about three times sprint speed
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
      let dx = rx * mx + fx * mz, dz = rz * mx + fz * mz; const l = Math.hypot(dx, dz); if (l > 1) { dx /= l; dz /= l; }
      const extra = (17.5 - (sprinting ? 5.8 : 4.3)) * dt; moveAxis(dx * extra, 0); moveAxis(0, dz * extra); }
    if (P.onGround) P.fallTop = null;
    if (boost !== S.boost) { S.boost = boost; sound(boost); flames.forEach(f => f.visible = boost); }
    if (boost) flames.forEach(f => { f.scale.y = 0.8 + Math.random() * 0.5; });
    S.maxH = Math.max(S.maxH, P.y);
    return r; };
  let lt = performance.now(); (function loop() { const t = performance.now(), dt = Math.min(0.1, (t - lt) / 1000); lt = t; try { if (parts.length) stepParts(dt); } catch (_) {} requestAnimationFrame(loop); })();
  const hurtW = hurt; hurt = function (n, why) { if (armour[4] === JET && typeof why === 'string' && /fall/i.test(why) && !/out of the world/.test(why)) return; return hurtW.apply(this, arguments); };
  S.JET = JET;
})();

/* ===================== GLX-C102b (v0.9.83): each castle on its own island (its own ground), and the three castles rebuilt (new worlds only) =====================
   Style taken from the MHkitpvp spawn island: a stone base course, pale walls with trims, plank bands, tiled roofs, glass panes, wool banners. */
(function c102castles() {
  const V83_AT = 1792915200000;
  const S = window.__c102 = {done: null, err: null};
  const isNew = () => current && current.created > V83_AT && genVer === GEN9 && !cityGen && !DIM.cur && W >= 600 && current.mode !== 'creative';
  const BLK = T.BLACKSTONE || 248, MOSS = T.MOSS || 144, POD = T.PODZOL || 142, FERN = 238, WST = 156, RT = 153, GP = 227, FEN = 162, QL = 216, DSB = 228, HR = T.HELLROCK || 206, SS = T.SOULSAND || 207, MG = T.MAGMA || 208, AL = 138;
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const inb = (x, y, z) => x > 0 && z > 0 && x < W - 1 && z < D - 1 && y > 0 && y < H - 1;
  const mine = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i);
  const put = (x, y, z, b) => { if (!inb(x, y, z)) return; const i = idx(x, y, z); if (mine(i)) return; world[i] = b; };
  const get = (x, y, z) => inb(x, y, z) ? world[idx(x, y, z)] : 0;
  const smooth = u => u * u * (3 - 2 * u);
  function setCol(X, Z) { let t = 0; for (let y = H - 2; y > 0; y--) { const b = world[idx(X, y, Z)]; if (b && b !== T.WATER && !LEAFY[b] && !LOGGY[b] && PLANT[b] !== 1) { t = y; break; } }
    const ci = (X * D + Z) * 2, b = world[idx(X, t, Z)]; g9cols[ci] = t + 1; g9cols[ci + 1] = t + 1 <= SEA ? 5 : b === T.SAND ? 4 : b === T.STONE ? 3 : 0; }
  // ---------- 1. the island ----------
  function island(c, all, gy) {
    const [k, cx, cz] = c, RI0 = 42, CH = 12, BL = 14, ph = h3(cx, 1, cz) * 6.283, I = window.__c101 && __c101.isl;
    const rI = a => RI0 + 4 * Math.sin(3 * a + ph) + 2.5 * Math.sin(5 * a + ph * 2);
    const M = RI0 + 8 + CH + BL;
    for (let X = Math.max(1, cx - M); X <= Math.min(W - 2, cx + M); X++) for (let Z = Math.max(1, cz - M); Z <= Math.min(D - 2, cz + M); Z++) {
      const r = Math.hypot(X - cx, Z - cz); if (r > M) continue;
      if (all.some(o => o !== c && Math.hypot(X - o[1], Z - o[2]) < r)) continue;   // nearer another castle: theirs
      if (I && Math.hypot(X - I.cx, Z - I.cz) < I.R + 6) continue;                  // never into the spawn island
      const ri = rI(Math.atan2(Z - cz, X - cx)), hv = h3(X, 3, Z);
      let tg, zone;
      if (r <= 24) { tg = gy - 1; zone = 'core'; }
      else if (window.__g12) { const h0 = g9cols[(X * D + Z) * 2] - 1; if (h0 <= SEA) continue; const u = Math.min(1, (r - 24) / (M - 24)); tg = Math.max(SEA + 1, Math.round(gy - 1 + (h0 - (gy - 1)) * smooth(u))); if (u >= 1 && tg === h0) continue; zone = u < 0.7 ? 'land' : 'blend'; }   // v1.0.12: the castle already stands on a big island - its hill just eases back into the land, no islet ring
      else if (r <= ri) { const u = (r - 24) / (ri - 24); tg = Math.round(gy - 1 - (gy - 1 - (SEA + 1)) * smooth(u) + (k !== 'human' && u < 0.8 ? (hv < 0.15 ? 1 : 0) : 0)); tg = Math.max(SEA + 1, tg); zone = ri - r < 3 ? 'beach' : 'land'; }
      else if (r <= ri + CH) { tg = SEA - 3 - (hv < 0.4 ? 1 : 0) - (Math.abs(r - ri - CH / 2) < 3 ? 1 : 0); zone = 'sea'; }
      else { const h0 = g9cols[(X * D + Z) * 2] - 1; if (h0 <= SEA) continue; const u = (r - ri - CH) / BL; tg = Math.round(SEA - 1 + (h0 - (SEA - 1)) * smooth(u)); if (h0 <= tg) continue; zone = 'blend'; }
      for (let y = tg + 1; y < H - 1; y++) put(X, y, Z, y <= SEA ? T.WATER : T.AIR);
      const surf = zone === 'sea' ? (hv < 0.5 ? T.SAND : (T.GRAVEL || T.SAND)) : zone === 'blend' ? (tg <= SEA + 1 ? T.SAND : (get(X, tg, Z) === T.STONE ? T.STONE : T.GRASS)) : zone === 'beach' ? (k === 'black' ? (T.GRAVEL || T.SAND) : T.SAND) : ground(k, X, Z, hv);
      put(X, tg, Z, surf);
      const deep = zone === 'core' ? 12 : 3;
      for (let y = tg - 1; y >= Math.max(1, tg - 14); y--) { const b = get(X, y, Z), soft = !b || b === T.WATER || LEAFY[b] || LOGGY[b] || PLANT[b] === 1 || b === T.CHEST || b === T.PLANKS || b === T.COBWEB || b === T.TORCH || b === FEN;
        if (tg - y <= deep || soft) put(X, y, Z, tg - y <= 3 ? (zone === 'sea' || zone === 'beach' ? T.SAND : k === 'black' ? T.DIRT : T.DIRT) : T.STONE); else break; }
      if (zone === 'land' && r > 20) deco(k, X, tg, Z, hv);
      setCol(X, Z); }
    return {ri: rI};
  }
  function ground(k, X, Z, hv) { const v = h3(X, 9, Z);
    if (k === 'human') return T.GRASS;
    if (k === 'mossy') return v < 0.55 ? MOSS : v < 0.85 ? T.GRASS : POD;
    return v < 0.35 ? POD : v < 0.6 ? T.DIRT : v < 0.75 ? (T.GRAVEL || T.DIRT) : v < 0.92 ? BLK : SS; }
  function deco(k, X, y, Z, hv) { const v = h3(X, 17, Z), a = y + 1;
    if (get(X, a, Z) !== T.AIR) return;
    if (k === 'human') { if (v < 0.05) put(X, a, Z, [T.DANDELION, T.DAFFODIL, T.BLUEBELL][Math.floor(v * 60) % 3]); else if (v < 0.13) put(X, a, Z, T.TALLGRASS); return; }
    if (k === 'mossy') { if (v < 0.12) put(X, a, Z, FERN); else if (v < 0.2) put(X, a, Z, T.TALLGRASS);
      else if (v < 0.205) { for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) put(X + dx, a, Z + dz, h3(X + dx, 5, Z + dz) < 0.6 ? T.MOSSYBRICK : T.COBBLE); if (v < 0.202) put(X, a + 1, Z, T.MOSSYBRICK); }
      else if (v < 0.208) { for (let d = 0; d < 4; d++) put(X + d, a, Z, AL); }   // a fallen log
      return; }
    // Blackstone: dead alder trunks and bare ground
    if (v < 0.012) { const h = 4 + Math.floor(v * 400) % 3; for (let t = 0; t < h; t++) put(X, a + t, Z, AL); if (v < 0.008) { put(X + 1, a + h - 2, Z, AL); put(X - 1, a + h - 1, Z, AL); } }
    else if (v < 0.03) put(X, a, Z, T.COBBLE); }
  // ---------- 2. the castles ----------
  function build(c, gy) {
    const [k, cx, cz] = c, RU = k !== 'human';
    const B = (dx, y, dz, b) => put(cx + dx, gy + y, cz + dz, b), G = (dx, y, dz) => get(cx + dx, gy + y, cz + dz);
    const wallM = (dx, y, dz) => { const v = h3(cx + dx, gy + y, cz + dz);
      if (k === 'human') return y === 0 ? T.STONEBRICK : WST;
      if (k === 'mossy') return v < 0.45 ? T.MOSSYBRICK : v < 0.8 ? T.STONEBRICK : T.COBBLE;
      return v < 0.68 ? BLK : v < 0.9 ? DSB : (T.DEEPSLATE || BLK); };
    const trimM = (dx, y, dz) => k === 'human' ? T.STONEBRICK : wallM(dx, y + 7, dz);
    const WALL = 13, WH = 6, TH = 10, TOW = [[-13, -13], [13, -13], [-13, 13], [13, 13]];
    const inTower = (dx, dz) => TOW.some(([tx, tz]) => (dx - tx) ** 2 + (dz - tz) ** 2 <= 10.5);
    // courtyard floor + clear air
    for (let dx = -WALL; dx <= WALL; dx++) for (let dz = -WALL; dz <= WALL; dz++) { const v = h3(cx + dx, 7, cz + dz);
      B(dx, -1, dz, k === 'human' ? (Math.abs(dx) <= 1 && dz > -2 ? T.STONEBRICK : T.GRASS) : k === 'mossy' ? (v < 0.5 ? MOSS : v < 0.8 ? T.COBBLE : T.GRASS) : (v < 0.5 ? BLK : v < 0.75 ? (T.GRAVEL || BLK) : POD)); }
    // curtain walls
    for (let dx = -WALL; dx <= WALL; dx++) for (let dz = -WALL; dz <= WALL; dz++) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== WALL || inTower(dx, dz)) continue;
      for (let y = 0; y < WH; y++) B(dx, y, dz, y === WH - 1 ? trimM(dx, y, dz) : (k === 'human' && y === 3 ? T.PLANKS : wallM(dx, y, dz)));
      if ((dx + dz) % 2 === 0) B(dx, WH, dz, trimM(dx, WH, dz)); }
    if (k === 'human') for (let dx = -12; dx <= 12; dx++) for (let dz = -12; dz <= 12; dz++) if (Math.max(Math.abs(dx), Math.abs(dz)) === 12 && !inTower(dx, dz)) B(dx, WH - 2, dz, T.PLANKS);   // wall walk
    // corner towers
    for (const [tx, tz] of TOW) { const top = TH - (RU ? Math.floor(h3(cx + tx, 2, cz + tz) * 4) : 0);
      for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) { const d2 = a * a + b * b; if (d2 > 10.5) continue; const shell = d2 >= 5;
        B(tx + a, -1, tz + b, k === 'human' ? T.PLANKS : wallM(tx + a, -1, tz + b));
        for (let y = 0; y < top; y++) B(tx + a, y, tz + b, shell ? (k === 'human' && (Math.abs(a) === 3 || Math.abs(b) === 3) && Math.abs(a) + Math.abs(b) === 4 ? T.STONEBRICK : wallM(tx + a, y, tz + b)) : (y === 5 ? T.PLANKS : T.AIR));
        if (shell && (a + b) % 2 === 0) B(tx + a, top, tz + b, trimM(tx + a, top, tz + b)); }
      const sx = Math.sign(tx), sz = Math.sign(tz);
      for (const y of [2, 3, 7]) { if (y < top - 1) { B(tx + sx * 3, y, tz, GP); B(tx, y, tz + sz * 3, GP); } }
      B(tx - sx * 2, 0, tz - sz * 2, T.AIR); B(tx - sx * 2, 1, tz - sz * 2, T.AIR); B(tx - sx * 1, 0, tz - sz * 1, T.AIR); B(tx - sx * 1, 1, tz - sz * 1, T.AIR);   // way in from the yard
      B(tx, 6, tz, T.AIR);   // hatch through the upper floor
      if (k === 'human') { for (let L = 0; L <= 4; L++) { const rr = 3.6 - L * 0.85; for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) if (a * a + b * b <= rr * rr) B(tx + a, TH + 1 + L, tz + b, RT); }
        B(tx, TH + 6, tz, FEN); B(tx, TH + 7, tz, FEN); B(tx + 1, TH + 7, tz, T.WOOLBLUE); B(tx + 1, TH + 6, tz, T.WOOLBLUE); B(tx + 2, TH + 7, tz, T.WOOL); }
      else if (k === 'mossy' && h3(cx + tx, 4, cz + tz) < 0.5) { for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (a * a + b * b <= 5 && h3(cx + tx + a, 5, cz + tz + b) < 0.45) B(tx + a, top + 1, tz + b, RT); } }
    // gate (south side): double doors, gatehouse pillars and an arch
    for (const px of [-2, 1]) for (let y = 0; y <= WH + 2; y++) for (const pz of [13, 14]) B(px, y, pz, y >= WH + 1 && (px + pz) % 2 ? T.AIR : trimM(px, y, pz));
    for (let dx = -2; dx <= 1; dx++) { B(dx, WH, 14, trimM(dx, WH, 14)); B(dx, WH - 1, 14, trimM(dx, WH - 1, 14)); B(dx, 2, 13, k === 'human' ? T.PLANKS : wallM(dx, 2, 13)); }
    for (const dx of [-1, 0]) { B(dx, 0, 13, T.AIR); B(dx, 1, 13, T.AIR); B(dx, 0, 14, T.AIR); B(dx, 1, 14, T.AIR); B(dx, 2, 14, T.AIR); }
    const door = (dx, y, dz) => { const x = cx + dx, Y = gy + y, z = cz + dz; if (!inb(x, Y, z)) return; put(x, Y, z, T.DOOR); put(x, Y + 1, z, T.DOORTOP); entMeta.set(keyOf(x, Y, z), {face: 0}); doorState.set(keyOf(x, Y, z), false); };
    door(-1, 0, 13); if (k !== 'black') door(0, 0, 13);   // the Blackstone gate lost a door long ago
    if (k === 'human') { for (const bx of [-4, 3]) { B(bx, 5, 14, T.WOOLBLUE); B(bx, 4, 14, T.WOOLBLUE); B(bx, 3, 14, T.WOOLBLUE); B(bx, 2, 14, T.WOOLYELLOW); } }
    // path from the gate to the shore + a little jetty
    for (let dz = 15; dz <= 46; dz++) for (let dx = -2; dx <= 1; dx++) { const x = cx + dx, z = cz + dz; if (!inb(x, 2, z)) continue; let t = H - 2; while (t > 1 && (!world[idx(x, t, z)] || PLANT[world[idx(x, t, z)]] === 1)) t--; const b = world[idx(x, t, z)];
      if (b === T.WATER) { if (dx === -2 || dx === 1) { put(x, SEA, z, LOGGY[AL] ? AL : T.LOG); } put(x, SEA + 1, z, k === 'black' && h3(x, 1, z) < 0.3 ? T.AIR : T.PLANKS); continue; }
      if (t >= gy - 6) { put(x, t, z, k === 'human' ? T.STONEBRICK : k === 'mossy' ? (h3(x, 2, z) < 0.5 ? T.COBBLE : MOSS) : (T.GRAVEL || BLK)); put(x, t + 1, z, T.AIR); } }
    // the keep: x -8..8, z -11..-2, a gabled tiled roof
    const KX = 8, KZ0 = -11, KZ1 = -2, KH = 6;
    for (let dx = -KX; dx <= KX; dx++) for (let dz = KZ0; dz <= KZ1; dz++) { const edge = Math.abs(dx) === KX || dz === KZ0 || dz === KZ1;
      B(dx, -1, dz, k === 'human' ? T.PLANKS : k === 'mossy' ? (h3(cx + dx, 3, cz + dz) < 0.5 ? T.STONEBRICK : T.COBBLE) : BLK);
      for (let y = 0; y < KH; y++) { if (!edge) { B(dx, y, dz, y === KH - 1 ? T.PLANKS : T.AIR); continue; }
        const corner = Math.abs(dx) === KX && (dz === KZ0 || dz === KZ1);
        B(dx, y, dz, corner ? (k === 'human' ? T.LOG : trimM(dx, y, dz)) : y === 0 ? trimM(dx, y, dz) : y === KH - 1 ? (k === 'human' ? T.PLANKS : wallM(dx, y, dz)) : wallM(dx, y, dz)); } }
    for (let kk = 0; kk < 7; kk++) { const za = KZ0 - 1 + kk, zb = KZ1 + 1 - kk; if (za > zb) break; const y = KH + kk;
      for (let dx = -KX - 1; dx <= KX + 1; dx++) { B(dx, y, za, k === 'human' ? RT : k === 'mossy' ? T.MOSSYBRICK : BLK); B(dx, y, zb, k === 'human' ? RT : k === 'mossy' ? T.MOSSYBRICK : BLK); }
      for (let dz = za + 1; dz < zb; dz++) for (const dx of [-KX, KX]) B(dx, y, dz, k === 'human' ? T.PLANKS : wallM(dx, y, dz)); }
    // keep windows + doors
    for (const dx of [-6, -5, 4, 5]) for (const y of [2, 3]) { B(dx, y, KZ1, GP); B(dx, y, KZ0, GP); }
    for (const dz of [-8, -5]) for (const y of [2, 3]) { B(-KX, y, dz, GP); B(KX, y, dz, GP); }
    for (const dx of [-1, 0]) { B(dx, 0, KZ1, T.AIR); B(dx, 1, KZ1, T.AIR); }
    door(-1, 0, KZ1); if (k === 'human') door(0, 0, KZ1);
    // ---- inside ----
    const chestAt = (dx, dz, loot) => { const x = cx + dx, y = gy, z = cz + dz; put(x, y, z, T.CHEST); const slots = new Array(27).fill(null); loot.forEach(([id, n], j) => { if (id) slots[[4, 10, 13, 16, 22][j]] = [id, n]; }); chests.set(keyOf(x, y, z), {slots, castle: k}); entMeta.set(keyOf(x, y, z), {face: 0}); return [x, y, z]; };
    const out = {k, cx, cz, gy};
    if (k === 'human') {
      const beds = [];
      for (const bx of [-6, -3]) { const x = cx + bx, y = gy, zf = cz - 9, zh = cz - 10; put(x, y, zf, T.BED); entMeta.set(keyOf(x, y, zf), {face: 0, bed: 'foot'}); put(x, y, zh, T.BED); entMeta.set(keyOf(x, y, zh), {face: 0, bed: 'head'}); beds.push([x, y, zf, 0, [x, y, zf + 1]]); }
      out.chest = chestAt(1, -10, [[IT.IRONINGOT, 6], [IT.BREAD, 6], [IT.COOKEDMUTTON || IT.MUTTON, 4], [IT.DIAMOND, 3]]);
      const fx = cx + 4, tx = cx + 6, y = gy, z = cz - 10; put(fx, y, z, T.FURNACE); entMeta.set(keyOf(fx, y, z), {face: 0}); put(tx, y, z, T.TABLE);
      for (const [a, b] of [[-7, -3], [7, -3]]) { B(a, 0, b, FEN); B(a, 1, b, QL); }
      for (const [a, b] of [[-5, 4], [4, 4], [-5, 10], [4, 10]]) { B(a, 0, b, FEN); B(a, 1, b, QL); }
      for (let dz = 2; dz <= 10; dz++) for (const dx of [-10, 9]) if (h3(cx + dx, 6, cz + dz) < 0.6) B(dx, 0, dz, [T.DANDELION, T.DAFFODIL, T.BLUEBELL][dz % 3]);
      try { C78.saved[cx + ',' + cz] = {made: 1, beds, furn: [fx, y, z], table: [tx, y, z]}; C78.castles.delete(cx + ',' + cz); } catch (_) {}
      out.beds = beds.length;
    } else {
      out.chest = chestAt(1, -10, k === 'mossy' ? [[IT.IRONINGOT, 3], [IT.BREAD, 3], [IT.POTATO, 4]] : [[IT.FLINTSTEEL, 1], [T.OBSIDIAN, 4]]);
      ruin(k, cx, cz, gy, B, G, WALL, WH, KX, KZ0, KZ1, KH, out);
    }
    return out;
  }
  // ---------- 3. ruin: holes, a collapsed stretch, cobwebs round holes and in corners, overgrowth ----------
  function ruin(k, cx, cz, gy, B, G, WALL, WH, KX, KZ0, KZ1, KH, out) {
    let s = (cx * 73856093 ^ cz * 19349663) >>> 0 || 3; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    const solidAt = (dx, y, dz) => { const b = G(dx, y, dz); return b && b !== T.AIR && b !== T.WATER && b !== T.COBWEB && PLANT[b] !== 1; };
    const webs = []; const web = (dx, y, dz) => { if (G(dx, y, dz) === T.AIR && G(dx, y - 1, dz) !== T.DOOR) { B(dx, y, dz, T.COBWEB); webs.push(1); } };
    // jagged wall tops
    for (let dx = -WALL; dx <= WALL; dx++) for (let dz = -WALL; dz <= WALL; dz++) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== WALL) continue; const v = h3(cx + dx, 8, cz + dz);
      const drop = v < 0.12 ? 3 : v < 0.35 ? 1 : 0; for (let y = WH + 1 - drop; y <= WH; y++) if (G(dx, y, dz) !== T.DOOR && G(dx, y, dz) !== T.DOORTOP) B(dx, y, dz, T.AIR); }
    // a collapsed stretch of one wall, rubble both sides
    const side = Math.floor(rnd() * 3); const seg = [];
    for (let t = -6; t <= 3; t++) { const [dx, dz] = side === 0 ? [-WALL, t] : side === 1 ? [WALL, t] : [t, -WALL]; seg.push([dx, dz]); const keep = 1 + Math.floor(h3(cx + dx, 9, cz + dz) * 2); for (let y = keep; y <= WH; y++) B(dx, y, dz, T.AIR); }
    for (const [dx, dz] of seg) for (const o of [-2, -1, 1, 2]) { const ax = side < 2 ? dx + o : dx, az = side < 2 ? dz : dz + o; if (rnd() < 0.55 && !solidAt(ax, 0, az)) B(ax, 0, az, k === 'mossy' ? (rnd() < 0.5 ? T.COBBLE : T.MOSSYBRICK) : (rnd() < 0.6 ? BLK : T.COBBLE)); }
    // holes punched through the walls and the keep (cobwebs gather round them)
    const cand = [];
    for (let dx = -WALL; dx <= WALL; dx++) for (let dz = -WALL; dz <= WALL; dz++) if (Math.max(Math.abs(dx), Math.abs(dz)) === WALL && Math.abs(dx) < WALL - 4 + (Math.abs(dz) === WALL ? 4 : 0) && !(dz === WALL && dx > -4 && dx < 3)) cand.push([dx, dz]);
    for (let dx = -KX; dx <= KX; dx++) for (const dz of [KZ0, KZ1]) if (Math.abs(dx) < KX - 1 && Math.abs(dx) > 2) cand.push([dx, dz]);
    for (let dz = KZ0 + 2; dz <= KZ1 - 2; dz++) for (const dx of [-KX, KX]) cand.push([dx, dz]);
    const nH = k === 'black' ? 11 : 9;
    for (let n = 0; n < nH && cand.length; n++) { const [hx, hz] = cand[Math.floor(rnd() * cand.length)], hy = 1 + Math.floor(rnd() * 3), R = 1.1 + rnd() * 0.9;
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (let y = -2; y <= 2; y++) if (a * a + b * b + y * y <= R * R && hy + y >= 0) { const g = G(hx + a, hy + y, hz + b); if (g && g !== T.DOOR && g !== T.DOORTOP && g !== T.CHEST && g !== T.WATER) B(hx + a, hy + y, hz + b, T.AIR); }
      for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) for (let y = -2; y <= 3; y++) { if (G(hx + a, hy + y, hz + b) !== T.AIR || hy + y < 0) continue; const d = Math.hypot(a, b, y); if (d > R + 1.6) continue;
        let nb = 0; for (const [p, q, r] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) if (solidAt(hx + a + p, hy + y + q, hz + b + r)) nb++;
        if (nb >= 2 && rnd() < 0.42) web(hx + a, hy + y, hz + b); } }
    // the keep roof has fallen in in places
    for (let kk = 0; kk < 7; kk++) for (let dx = -KX - 1; dx <= KX + 1; dx++) for (const dz of [KZ0 - 1 + kk, KZ1 + 1 - kk]) if (h3(cx + dx, KH + kk, cz + dz) < (k === 'black' ? 0.45 : 0.32)) B(dx, KH + kk, dz, T.AIR);
    for (let dx = -KX + 1; dx < KX; dx++) for (let dz = KZ0 + 1; dz < KZ1; dz++) if (h3(cx + dx, 44, cz + dz) < 0.3) B(dx, KH - 1, dz, T.AIR);
    // cobwebs in the corners of rooms and towers
    for (let dx = -WALL; dx <= WALL; dx++) for (let dz = -WALL; dz <= WALL; dz++) for (let y = 0; y < 10; y++) { if (G(dx, y, dz) !== T.AIR) continue;
      const wx = solidAt(dx + 1, y, dz) || solidAt(dx - 1, y, dz), wz = solidAt(dx, y, dz + 1) || solidAt(dx, y, dz - 1), up = solidAt(dx, y + 1, dz);
      if (wx && wz && (up || y >= 3) && h3(cx + dx, gy + y, cz + dz) < 0.55) web(dx, y, dz); else if (wx && wz && h3(cx + dx, gy + y + 50, cz + dz) < 0.12) web(dx, y, dz); }
    // overgrowth (mossy) / dead scorch (black)
    for (let dx = -WALL - 1; dx <= WALL + 1; dx++) for (let dz = -WALL - 1; dz <= WALL + 1; dz++) { let t = 16; while (t > -1 && (!G(dx, t, dz) || G(dx, t, dz) === T.COBWEB)) t--; if (t < 1) continue; const b = G(dx, t, dz), v = h3(cx + dx, 21, cz + dz);
      if (k === 'mossy') { if ((b === T.MOSSYBRICK || b === T.STONEBRICK || b === T.COBBLE || b === RT) && v < 0.3) { B(dx, t + 1, dz, T.LEAVES); if (v < 0.08 && !G(dx + 1, t, dz)) { B(dx + 1, t, dz, T.LEAVES); B(dx + 1, t - 1, dz, T.LEAVES); } } }
      else if (b === BLK && v < 0.04) B(dx, t, dz, MG); }
    if (k === 'mossy') for (let dx = -12; dx <= 12; dx++) for (let dz = -12; dz <= 12; dz++) if (!G(dx, 0, dz) && (G(dx, -1, dz) === MOSS || G(dx, -1, dz) === T.GRASS)) { const v = h3(cx + dx, 31, cz + dz); if (v < 0.18) B(dx, 0, dz, FERN); else if (v < 0.3) B(dx, 0, dz, T.TALLGRASS); }
    // Blackstone: the broken Hell portal (2 obsidian missing) in the yard, Hell ground round it and a lava pool
    if (k === 'black') { const px = -2, pz = 5;
      for (let a = -6; a <= 8; a++) for (let b = -4; b <= 5; b++) { const v = h3(cx + px + a, 61, cz + pz + b); if (v < 0.72 && Math.hypot(a - 1, b) < 6.5) B(px + a, -1, pz + b, v < 0.42 ? HR : v < 0.6 ? SS : MG); for (let y = 0; y < 6; y++) if (G(px + a, y, pz + b) === T.COBWEB || PLANT[G(px + a, y, pz + b)] === 1) B(px + a, y, pz + b, T.AIR); }
      for (let a = -1; a <= 2; a++) B(px + a, -1, pz, HR);
      let n = 0; for (let a = -1; a <= 2; a++) for (let y = 0; y <= 4; y++) { const edge = a === -1 || a === 2 || y === 0 || y === 4; const miss = (a === 2 && y === 4) || (a === -1 && y === 2); B(px + a, y, pz, edge && !miss ? T.OBSIDIAN : T.AIR); if (edge && !miss) n++; }
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) B(6 + a, -1, 5 + b, T.LAVA);
      for (let a = -1; a <= 2; a++) for (let b = -1; b <= 2; b++) if ((a < 0 || a > 1 || b < 0 || b > 1)) { B(6 + a, -1, 5 + b, (T.HELLBRICK || 210)); if (G(6 + a, 0, 5 + b) === T.COBWEB) B(6 + a, 0, 5 + b, T.AIR); }
      out.portal = [cx + px, gy, cz + pz, n]; out.lava = [cx + 6, gy - 1, cz + 5]; }
    out.webs = webs.length;
  }
  // ---------- run after everything else in world generation ----------
  function work() {
    if (!isNew() || !g9castles || !g9castles.length) return null;
    const cs = g9castles.filter(c => c[0] === 'human' || c[0] === 'mossy' || c[0] === 'black'); if (!cs.length) return null;
    const t0 = performance.now(), res = [];
    // old castle entities on the islands go (chests, doors, furnaces, beds)
    const near = key => { const p = String(key).split(','); if (p.length < 3) return false; const x = +p[0], z = +p[2]; return cs.some(c => Math.hypot(x - c[1], z - c[2]) < 72); };
    for (const m of [chests, entMeta, doorState, furnaces]) { try { for (const key of [...m.keys()]) if (near(key)) { const p = key.split(',').map(Number); if (!mine(idx(p[0], p[1], p[2]))) m.delete(key); } } catch (_) {} }
    for (const c of cs) { const gy = SEA + (c[0] === 'human' ? 5 : 6);
      try { island(c, cs, gy); res.push(build(c, gy)); } catch (e) { S.err = String(e && e.stack || e); console.warn('c102 castle', c, e); } }
    for (const c of cs) { const M = 75; for (let X = Math.max(1, c[1] - M); X <= Math.min(W - 2, c[1] + M); X++) for (let Z = Math.max(1, c[2] - M); Z <= Math.min(D - 2, c[2] + M); Z++) if (Math.hypot(X - c[1], Z - c[2]) < 32) setCol(X, Z); }
    try { scanLights(); validateLights(); } catch (_) {}
    S.ms = Math.round(performance.now() - t0); return res;
  }
  const ge = generate; generate = function () { const r = ge.apply(this, arguments); try { const was = c37busy; c37busy = true; try { S.done = work(); } finally { c37busy = was; } } catch (e) { S.err = String(e && e.stack || e); console.warn('c102', e); } return r; };
  // ---------- mist drifting over the mossy castle's island ----------
  const mistTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(235,240,238,.55)'); gr.addColorStop(1, 'rgba(235,240,238,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const mistMat = new THREE.SpriteMaterial({map: mistTex, transparent: true, depthWrite: false, opacity: 0.5, fog: true}); const mist = [];
  setInterval(() => { try {
    const m = started && !DIM.cur && typeof g9castles !== 'undefined' && g9castles && current && current.created > V83_AT ? g9castles.find(c => c[0] === 'mossy') : null;
    const on = m && Math.hypot(P.x - m[1], P.z - m[2]) < 110;
    if (on && !mist.length) for (let i = 0; i < 26; i++) { const s = new THREE.Sprite(mistMat); const a = Math.random() * 6.283, r = Math.random() * 40; s.position.set(m[1] + Math.cos(a) * r, SEA + 3 + Math.random() * 7, m[2] + Math.sin(a) * r); s.scale.set(14 + Math.random() * 10, 5 + Math.random() * 3, 1); s.userData.v = (Math.random() - .5) * 0.6; scene.add(s); mist.push(s); }
    if (!on && mist.length) { mist.forEach(s => scene.remove(s)); mist.length = 0; }
    for (const s of mist) { s.position.x += s.userData.v; if (Math.hypot(s.position.x - m[1], s.position.z - m[2]) > 44) s.userData.v *= -1; }
  } catch (_) {} }, 250);
  S.work = work;
})();
