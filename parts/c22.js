
/* ===================== GLX-G4 (v0.9.22): Hell mobs (imps, demon hounds, ghosts, blazing skeletons) + giant fire-breathing dragon bosses ===================== */
var HELL_KINDS = new Set(['imp', 'hound', 'ghost', 'blazeskel', 'dragon']);
const HB = (w, h, d, m, x, y, z, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o; };
function hellModel(kind) {
  const g = new THREE.Group(), L = c => new THREE.MeshLambertMaterial({color: c}), E = c => new THREE.MeshBasicMaterial({color: c});
  if (kind === 'imp') {
    const sk = L(0xb0281c), dk = L(0x4a0c08), ey = E(0xffd040);
    const head = new THREE.Group(); head.position.y = 1.0; g.add(head); HB(0.42, 0.38, 0.38, sk, 0, 0, 0, head);
    for (const sx of [-1, 1]) { HB(0.07, 0.05, 0.02, ey, sx * 0.1, 0.03, 0.2, head); const h = HB(0.06, 0.22, 0.06, dk, sx * 0.15, 0.25, 0, head); h.rotation.z = -sx * 0.35; }
    HB(0.36, 0.42, 0.22, sk, 0, 0.62, 0, g); const t = HB(0.05, 0.05, 0.5, dk, 0, 0.45, -0.32, g); t.rotation.x = 0.5;
    const arms = [limb(g, 0.1, 0.38, 0.1, sk, -0.24, 0.8, 0), limb(g, 0.1, 0.38, 0.1, sk, 0.24, 0.8, 0)], legs = [limb(g, 0.12, 0.42, 0.12, dk, -0.09, 0.42, 0), limb(g, 0.12, 0.42, 0.12, dk, 0.09, 0.42, 0)];
    return {g, head, arms, legs, mats: [sk, dk, ey], hp: 6, hitY: 0.6, hitR: 0.5, tall: 1, spd: 3.3, dmg: 2};
  }
  if (kind === 'hound') {
    const fur = L(0x2a0a0a), red = L(0x8a1a10), ey = E(0xff5020);
    HB(0.5, 0.5, 1.1, fur, 0, 0.75, 0, g); HB(0.52, 0.12, 1.0, red, 0, 1.02, 0, g);
    const head = new THREE.Group(); head.position.set(0, 0.95, 0.65); g.add(head); HB(0.42, 0.38, 0.45, fur, 0, 0, 0, head); HB(0.26, 0.2, 0.3, red, 0, -0.08, 0.3, head);
    for (const sx of [-1, 1]) { HB(0.08, 0.06, 0.02, ey, sx * 0.12, 0.08, 0.23, head); HB(0.08, 0.16, 0.06, fur, sx * 0.14, 0.25, -0.05, head); }
    const tl = HB(0.08, 0.08, 0.5, red, 0, 0.95, -0.75, g); tl.rotation.x = -0.6;
    const legs = [[-0.17, 0.38], [0.17, 0.38], [-0.17, -0.38], [0.17, -0.38]].map(([x, z]) => limb(g, 0.13, 0.55, 0.13, fur, x, 0.55, z));
    return {g, head, arms: [], legs, mats: [fur, red, ey], hp: 8, hitY: 0.8, hitR: 0.7, tall: 1, spd: 4.4, dmg: 3};
  }
  if (kind === 'ghost') {
    const sh = new THREE.MeshLambertMaterial({color: 0xe8e4f0, transparent: true, opacity: 0.55, emissive: 0x302838}), ey = E(0x201018);
    const head = new THREE.Group(); head.position.y = 1.4; g.add(head); HB(0.7, 0.7, 0.7, sh, 0, 0, 0, head);
    for (const sx of [-1, 1]) HB(0.16, 0.2, 0.02, ey, sx * 0.16, 0.05, 0.36, head); HB(0.22, 0.12, 0.02, ey, 0, -0.18, 0.36, head);
    HB(0.8, 0.9, 0.6, sh, 0, 0.6, 0, g); const tails = []; for (let k = 0; k < 4; k++) tails.push(HB(0.18, 0.5, 0.18, sh, -0.27 + k * 0.18, -0.05, 0, g));
    return {g, head, arms: [], legs: [], tails, mats: [sh, ey], hp: 8, hitY: 1.0, hitR: 0.75, tall: 2, fly: true, spd: 1.6, dmg: 0};
  }
  if (kind === 'blazeskel') {
    const a = makeHumanoid('skeleton'); a.mats.forEach(m => { if (m.emissive) m.emissive.setHex(0x5a1a00); if (m.color) m.color.multiplyScalar(0.75); });
    const fl = glowSprite(0xff7a1a, 1.4); fl.position.y = 1.2; a.g.add(fl);
    return Object.assign(a, {hp: 12, hitY: 1.1, hitR: 0.6, tall: 2, spd: 1.9, dmg: 3, hostile: false});
  }
  // dragon: ~14 blocks nose to tail, wings ~16 across
  const sc = L(0x5a0e0c), bel = L(0xb0582a), hn = L(0x2a2420), ey = E(0xffe040), mem = new THREE.MeshLambertMaterial({color: 0x7a1a14, side: THREE.DoubleSide});
  sc.emissive = new THREE.Color(0x1a0200);
  const body = new THREE.Group(); g.add(body);
  HB(2.0, 1.7, 5.0, sc, 0, 0, 0, body); HB(1.6, 0.4, 4.4, bel, 0, -0.85, 0, body); for (let k = 0; k < 6; k++) HB(0.25, 0.5, 0.4, hn, 0, 1.05, -2 + k * 0.8, body);
  const neck = []; let prev = body, z0 = 2.4;
  for (let k = 0; k < 3; k++) { const s = new THREE.Group(); s.position.set(0, k ? 0.1 : 0.4, k ? 1.0 : z0); prev.add(s); HB(1.1 - k * 0.12, 1.0 - k * 0.1, 1.2, sc, 0, 0, 0.5, s); neck.push(s); prev = s; }
  const head = new THREE.Group(); head.position.set(0, 0.1, 1.1); prev.add(head);
  HB(1.2, 0.9, 1.6, sc, 0, 0, 0.6, head); const jaw = new THREE.Group(); jaw.position.set(0, -0.35, 0.1); head.add(jaw); HB(1.0, 0.3, 1.5, bel, 0, -0.1, 0.65, jaw);
  for (const sx of [-1, 1]) { HB(0.2, 0.14, 0.05, ey, sx * 0.38, 0.22, 1.1, head); const h = HB(0.18, 0.18, 1.0, hn, sx * 0.4, 0.55, -0.3, head); h.rotation.x = -0.5; }
  const tail = []; prev = body;
  for (let k = 0; k < 5; k++) { const s = new THREE.Group(); s.position.set(0, k ? 0 : 0.1, k ? -1.1 : -2.5); prev.add(s); HB(1.2 - k * 0.2, 1.0 - k * 0.16, 1.2, sc, 0, 0, -0.5, s); tail.push(s); prev = s; }
  const wings = [];
  for (const sx of [-1, 1]) { const w = new THREE.Group(); w.position.set(sx * 1.0, 0.6, 0.6); body.add(w);
    const arm = HB(4.0, 0.25, 0.3, hn, sx * 2.0, 0, 0, w); const tip = new THREE.Group(); tip.position.set(sx * 4.0, 0, 0); w.add(tip); HB(3.6, 0.2, 0.25, hn, sx * 1.8, 0, 0, tip);
    const m1 = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 3.6), mem); m1.rotation.x = -Math.PI / 2; m1.position.set(sx * 2.0, 0, -1.7); w.add(m1);
    const m2 = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.0), mem); m2.rotation.x = -Math.PI / 2; m2.position.set(sx * 1.8, 0, -1.4); tip.add(m2); wings.push({w, tip, sx}); }
  g.scale.setScalar(1.25);
  return {g, head, jaw, neck, tail, wings, body, arms: [], legs: [], mats: [sc, bel, hn, ey, mem], hp: 160, hitY: 1.0, hitR: 4.2, tall: 3, fly: true, spd: 11, dmg: 6, boss: true};
}
function hellMake(kind, x, y, z) {
  const a = hellModel(kind);
  Object.assign(a, {kind, flee: 0, angry: 0, biteCd: 0, shootCd: 2 + Math.random() * 2, moving: false, ang: Math.random() * 6.28, timer: Math.random() * 3, flash: 0, kbx: 0, kbz: 0, vy: 0, onGround: true, burning: 0, fire: 0, fireTick: 0, walk: 0, sndT: 3, hostile: false, hell: true});
  a.g.position.set(x, y, z); scene.add(a.g); mobs.push(a); return a;
}
// ---------- fireballs (ghosts, blazing skeletons) ----------
const fballs = [], fbGeo = new THREE.SphereGeometry(0.28, 8, 6), fbMat = new THREE.MeshBasicMaterial({color: 0xff8a20});
function shootFire(from, tx, ty, tz, speed, dmg) {
  if (fballs.length > 14) return; const m = new THREE.Mesh(fbGeo, fbMat); const gs = glowSprite(0xff6a10, 1.1); m.add(gs); m.position.copy(from); scene.add(m);
  const dx = tx - from.x, dy = ty - from.y, dz = tz - from.z, l = Math.hypot(dx, dy, dz) || 1; fballs.push({m, vx: dx / l * speed, vy: dy / l * speed, vz: dz / l * speed, life: 4, dmg}); try { sfx3d('swoosh', from, 20); } catch (_) {}
}
function updateFire(dt) {
  for (let i = fballs.length - 1; i >= 0; i--) { const f = fballs[i], p = f.m.position; f.life -= dt;
    const px = p.x, py = p.y, pz = p.z; p.x += f.vx * dt; p.y += f.vy * dt; p.z += f.vz * dt;
    if (Math.random() < dt * 20) burst(p.x, p.y, p.z, Math.random() < .5 ? 0xff6a00 : 0xffc040, 1, .2);
    const hitP = Math.hypot(p.x - P.x, p.y - (P.y + 1), p.z - P.z) < 0.9;
    const hitB = solid(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
    if (hitP || hitB || f.life <= 0) {
      if (hitP && !MODE.noDamage) hurt(f.dmg, 'Scorched by a fireball.');
      burst(p.x, p.y, p.z, 0xff7a1a, 10, .8);
      if (hitB && Math.random() < 0.3) { const x = Math.floor(px), y = Math.floor(py), z = Math.floor(pz); if (getB(x, y, z) === T.AIR && solid(x, y - 1, z)) { setB(x, y, z, T.FIRE); fires.set(idx(x, y, z), 5); rebuild(); } }
      scene.remove(f.m); fballs.splice(i, 1); }
  }
}
// ---------- dragon fire breath: a pooled cone of embers ----------
const breathP = [], breathMat = new THREE.SpriteMaterial({color: 0xff8a20, transparent: true, opacity: 0.85, depthWrite: false});
function breath(a, dt) {
  const head = a.head, mp = new THREE.Vector3(0, -0.1, 1.6); head.localToWorld(mp); const fw = new THREE.Vector3(0, 0, 1).transformDirection(head.matrixWorld);
  for (let k = 0; k < 3; k++) { let s = breathP.find(q => !q.on); if (!s) { if (breathP.length > (PERF ? 30 : 60)) break; s = {sp: new THREE.Sprite(breathMat.clone()), on: false}; breathP.push(s); scene.add(s.sp); }
    s.on = true; s.t = 0; s.sp.visible = true; s.sp.position.copy(mp); s.v = fw.clone().multiplyScalar(14).add(new THREE.Vector3((Math.random() - .5) * 3, (Math.random() - .5) * 3, (Math.random() - .5) * 3)); }
  // damage if you're in the cone
  const to = new THREE.Vector3(P.x - mp.x, P.y + 1 - mp.y, P.z - mp.z), d = to.length();
  if (d < 15 && to.normalize().dot(fw) > 0.88) { a.brCd = (a.brCd || 0) - dt; if (a.brCd <= 0 && !MODE.noDamage) { a.brCd = 0.45; hurt(2, 'Roasted by a dragon.'); } }
  if (Math.random() < dt * 2) { const x = Math.floor(mp.x + fw.x * 10), z = Math.floor(mp.z + fw.z * 10); for (let y = Math.floor(mp.y + fw.y * 10); y > 1 && y > mp.y - 20; y--) if (solid(x, y - 1, z)) { if (getB(x, y, z) === T.AIR) { setB(x, y, z, T.FIRE); fires.set(idx(x, y, z), 4); rebuild(); } break; } }
}
function updateBreath(dt) { for (const s of breathP) { if (!s.on) continue; s.t += dt; s.sp.position.addScaledVector(s.v, dt); const k = s.t / 0.8; s.sp.scale.setScalar(0.4 + k * 2.4); s.sp.material.opacity = Math.max(0, 0.9 - k); s.sp.material.color.setHex(k < .3 ? 0xffe070 : k < .6 ? 0xff7a1a : 0x802010); if (s.t > 0.8) { s.on = false; s.sp.visible = false; } } }
// ---------- AI ----------
let bossBar = null;
function hellAI(a, dt) {
  const p = a.g.position, dx = P.x - p.x, dz = P.z - p.z, dist = Math.hypot(dx, dz), dy = P.y - p.y;
  a.biteCd = Math.max(0, a.biteCd - dt); a.shootCd -= dt;
  if (a.flash > 0) { a.flash -= dt; a.mats.forEach(m => m.emissive && m.emissive.setHex(a.flash > 0 ? 0xaa2000 : (a.kind === 'blazeskel' ? 0x5a1a00 : a.kind === 'dragon' ? 0x1a0200 : a.kind === 'ghost' ? 0x302838 : 0))); }
  if (dist > 70 && a.kind !== 'dragon') { removeMob(a); return; }
  const see = !dead && dist < 26;
  if (a.kind === 'imp' || a.kind === 'hound' || a.kind === 'blazeskel') {
    let spd = 0;
    if (see && dist < (a.kind === 'hound' ? 22 : 16)) { a.ang = Math.atan2(dx, dz); spd = a.kind === 'blazeskel' && dist < 7 ? -a.spd * 0.6 : dist > 1.3 ? a.spd : 0;
      if (a.kind === 'blazeskel') { if (spd < 0) { a.ang += Math.PI; spd = -spd; } if (a.shootCd <= 0 && dist < 18 && canSee(a, 18)) { a.shootCd = 2.2 + Math.random(); shootFire(new THREE.Vector3(p.x, p.y + 1.5, p.z), P.x, P.y + 1, P.z, 10, 3); } }
      else if (dist < 1.6 && Math.abs(dy) < 1.6 && a.biteCd <= 0) { a.biteCd = a.kind === 'hound' ? 0.8 : 1.0; if (!MODE.noDamage) hurt(a.dmg, a.kind === 'hound' ? 'Mauled by a demon hound.' : 'Clawed by an imp.'); }
      if (a.kind === 'hound' && a.onGround && dist < 6 && dist > 2.5 && Math.random() < dt * 1.2) a.vy = 7;
    } else { a.timer -= dt; if (a.timer <= 0) { a.timer = 2 + Math.random() * 3; a.ang += (Math.random() - .5) * 3; a.wan = Math.random() < 0.6; } spd = a.wan ? a.spd * 0.35 : 0; }
    if (spd) stepMob(a, spd, dt, !see); mobPhysics(a, dt);
    if (p.y < 2) { removeMob(a); return; }
    a.walk += dt * spd * 3; const sw = Math.sin(a.walk) * Math.min(1, spd) * 0.7; a.legs.forEach((l, i) => l.rotation.x = (i % 2 ? sw : -sw) * (a.kind === 'hound' && i > 1 ? -1 : 1)); a.arms.forEach((l, i) => l.rotation.x = i ? sw : -sw);
    a.g.rotation.y = a.ang; return;
  }
  if (a.kind === 'ghost') {
    a.ph = (a.ph || Math.random() * 6) + dt; const ty = P.y + 3.5 + Math.sin(a.ph) * 0.8;
    a.ang = Math.atan2(dx, dz); const want = dist > 14 ? 1 : dist < 8 ? -1 : 0;
    const nx = p.x + Math.sin(a.ang) * want * a.spd * dt + Math.cos(a.ph * 0.5) * dt * 0.6, nz = p.z + Math.cos(a.ang) * want * a.spd * dt, ny = p.y + (ty - p.y) * Math.min(1, dt);
    if (!solid(Math.floor(nx), Math.floor(ny + 1), Math.floor(nz)) && !solid(Math.floor(nx), Math.floor(ny), Math.floor(nz))) p.set(nx, ny, nz); else p.y += dt * 1.5;
    a.tails.forEach((t, i) => t.rotation.x = Math.sin(a.ph * 3 + i) * 0.3); a.g.rotation.y = a.ang;
    if (see && a.shootCd <= 0 && dist < 24 && canSee(a, 24)) { a.shootCd = 3 + Math.random() * 2; shootFire(new THREE.Vector3(p.x, p.y + 1.3, p.z), P.x, P.y + 1, P.z, 8, 3); try { sfx3d('growl', p, 20); } catch (_) {} }
    return;
  }
  // dragon: circles high, swoops at you, hovers and breathes fire
  a.ph = (a.ph || 0) + dt; a.stT = (a.stT || 0) - dt; if (!a.st) a.st = 'circle';
  if (a.stT <= 0) { a.st = a.st === 'circle' ? (Math.random() < 0.5 ? 'swoop' : 'hover') : 'circle'; a.stT = a.st === 'circle' ? 6 + Math.random() * 5 : a.st === 'hover' ? 4 : 5; if (a.st !== 'circle') try { sfx3d('growl', p, 60); shake(0.12, 0.02); } catch (_) {} }
  let tx, ty, tz;
  if (a.st === 'circle') { const r = 22, w = a.ph * 0.35; tx = P.x + Math.cos(w) * r; tz = P.z + Math.sin(w) * r; ty = P.y + 12; }
  else if (a.st === 'swoop') { tx = P.x; tz = P.z; ty = P.y + 4; }
  else { const k = 10 / Math.max(1, dist); tx = P.x - dx * k; tz = P.z - dz * k; ty = P.y + 6; }
  tx = Math.max(8, Math.min(W - 8, tx)); tz = Math.max(8, Math.min(D - 8, tz)); ty = Math.min(H - 6, ty);
  const vx = tx - p.x, vy = ty - p.y, vz = tz - p.z, vl = Math.hypot(vx, vy, vz) || 1, sp = (a.st === 'swoop' ? 14 : a.st === 'hover' ? 5 : 10) * Math.min(1, vl / 3);
  p.x += vx / vl * sp * dt; p.z += vz / vl * sp * dt; p.y += vy / vl * sp * dt;
  if (solid(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)) || solid(Math.floor(p.x), Math.floor(p.y - 2), Math.floor(p.z))) p.y += 9 * dt;   // pulls up over rock
  const face = a.st === 'hover' || (a.st === 'swoop' && dist < 18) ? Math.atan2(dx, dz) : Math.atan2(vx, vz);
  a.ang = turnToward(a.ang, face, dt * 2.2); a.g.rotation.y = a.ang; a.body.rotation.x = -Math.max(-0.4, Math.min(0.4, vy / vl)) * 0.6;
  const flap = Math.sin(a.ph * (a.st === 'hover' ? 7 : 4.5)); a.wings.forEach(({w, tip, sx}) => { w.rotation.z = sx * flap * 0.55; tip.rotation.z = sx * flap * 0.35; });
  a.tail.forEach((s, i) => s.rotation.y = Math.sin(a.ph * 2 - i * 0.6) * 0.18); a.neck.forEach((s, i) => s.rotation.x = 0.05 + Math.sin(a.ph * 1.3 + i) * 0.06);
  const breathing = (a.st === 'hover' || (a.st === 'swoop' && dist < 14)) && dist < 18;
  a.jaw.rotation.x = breathing ? 0.5 : 0.05; if (breathing) breath(a, dt);
  if (dist < 5 && Math.abs(dy) < 4 && a.biteCd <= 0) { a.biteCd = 1.6; if (!MODE.noDamage) hurt(a.dmg, 'Crushed by a dragon.'); }
}
(function () {
  let spT = 2, dragonT = 45, inHell = 0;
  const um = updateMobs;
  updateMobs = function (dt) {
    const hell = mobs.filter(a => a.hell); if (hell.length) for (const a of hell) mobs.splice(mobs.indexOf(a), 1);
    try { um.apply(this, arguments); } finally { for (const a of hell) mobs.push(a); }
    updateFire(dt); updateBreath(dt);
    if (!started) return;
    for (const a of hell) if (mobs.includes(a)) hellAI(a, dt);
    // boss bar
    const dr = mobs.find(a => a.kind === 'dragon');
    if (!bossBar) { bossBar = document.createElement('div'); bossBar.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);width:min(60vw,420px);z-index:6;pointer-events:none;display:none;font:600 13px sans-serif;color:#ffd0a0;text-align:center;text-shadow:0 1px 2px #000'; bossBar.innerHTML = '<div>Ember Wyrm</div><div style="height:9px;background:#300;border:1px solid #a33;border-radius:5px;overflow:hidden"><div id="bossFill" style="height:100%;width:100%;background:linear-gradient(#ff6a2a,#a01808)"></div></div>'; document.body.appendChild(bossBar); }
    bossBar.style.display = dr && Math.hypot(dr.g.position.x - P.x, dr.g.position.z - P.z) < 70 ? 'block' : 'none'; if (dr) $('bossFill').style.width = Math.max(0, dr.hp / 160 * 100) + '%';
    if (DIM.cur !== 'hell') return;
    inHell += dt; spT -= dt; dragonT -= dt;
    if (spT <= 0) { spT = 3; const n = mobs.filter(a => a.hell && a.kind !== 'dragon').length; if (n < (PERF ? 7 : 11)) hellSpawn(); }
    if (dragonT <= 0 && !dr) { dragonT = 30; const ang = Math.random() * 6.28; const x = Math.max(10, Math.min(W - 10, P.x + Math.cos(ang) * 40)), z = Math.max(10, Math.min(D - 10, P.z + Math.sin(ang) * 40)); hellMake('dragon', x, Math.min(H - 8, P.y + 16), z); toast('A great roar echoes across the lava sea...'); try { sfx3d('growl', P, 80); } catch (_) {} }
  };
  const km = killMob;
  killMob = function (a) {
    if (!a.hell) return km.apply(this, arguments);
    const p = a.g.position, toss = (id, n) => dropItem(id, n, p.x, p.y + .6, p.z, (Math.random() - .5) * 3, 4, (Math.random() - .5) * 3, .4);
    burst(p.x, p.y + 1, p.z, a.kind === 'ghost' ? 0xe8e4f0 : 0xff6a1a, a.boss ? 60 : 14, a.boss ? 3 : 0.8);
    if (a.kind === 'imp') { if (Math.random() < .5) toss(IT.GOLDNUGGET || IT.GOLDINGOT, 2); }
    else if (a.kind === 'hound') toss(IT.PORKRAW || 177, 1);
    else if (a.kind === 'ghost') { if (Math.random() < .6) toss(IT.GUNPOWDER || 172, 1); }
    else if (a.kind === 'blazeskel') { toss(IT.BONE || 171, 2); if (Math.random() < .3) toss(IT.FLINT, 2); }
    else if (a.kind === 'dragon') { toss(IT.DIAMOND, 5); toss(IT.GOLDINGOT, 8); toss(T.OBSIDIAN, 6); toss(T.GLOWROCK, 8); toast('The Ember Wyrm crashes into the lava sea! It drops its hoard.'); dragonT = 480; try { shake(0.3, 0.05); } catch (_) {} }
    removeMob(a);
  };
  window.hellSpawn = function () {
    const near = hellFort && Math.hypot(P.x - hellFort.x, P.z - hellFort.z) < 45, r = Math.random();
    const kind = near && r < 0.5 ? 'blazeskel' : r < 0.4 ? 'imp' : r < 0.65 ? 'hound' : r < 0.85 ? 'ghost' : 'blazeskel';
    for (let k = 0; k < 20; k++) {
      const an = Math.random() * 6.28, rr = 14 + Math.random() * 16, x = Math.floor(P.x + Math.cos(an) * rr), z = Math.floor(P.z + Math.sin(an) * rr); if (x < 3 || z < 3 || x >= W - 3 || z >= D - 3) continue;
      if (kind === 'ghost') { const y = Math.floor(P.y + 4); if (!solid(x, y, z) && !solid(x, y + 1, z) && getB(x, y, z) !== T.LAVA) { hellMake('ghost', x + .5, y, z + .5); return; } continue; }
      for (let y = Math.min(H - 3, Math.floor(P.y + 8)); y > Math.max(2, P.y - 10); y--) { const f = getB(x, y - 1, z); if (solid(x, y - 1, z) && f !== T.LAVA && !solid(x, y, z) && !solid(x, y + 1, z) && getB(x, y, z) !== T.LAVA) { hellMake(kind, x + .5, y, z + .5); return; } }
    }
  };
  window.hellPopulate = function () { for (let k = 0; k < 4; k++) hellSpawn(); };
  // enterDim clears mobs; fireballs / embers too
  const ed = exitDim; exitDim = async function () { fballs.splice(0).forEach(f => scene.remove(f.m)); breathP.forEach(s => { s.on = false; s.sp.visible = false; }); return ed.apply(this, arguments); };
})();
