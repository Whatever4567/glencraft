
/* ===================== GLX-F4 (v0.9.18): friendly clan castles (armoured Scots) vs abandoned castles (guardians, big skeletons, rare loot) ===================== */
Object.assign(T, {OBSIDIAN: 189}); IT.PAINTING = 190;
TEX.obsidian = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); let s = 77; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < 64; y += 4) for (let x = 0; x < 64; x += 4) { const v = 14 + r() * 18 | 0; g.fillStyle = `rgb(${v},${v - 4},${v + 14})`; g.fillRect(x, y, 4, 4); }
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(${90 + r() * 60 | 0},40,${150 + r() * 80 | 0},.7)`; g.fillRect(r() * 60 | 0, r() * 60 | 0, 4, 4); } return c.toDataURL('image/png'); })();
FACES[189] = 'obsidian'; BLOCK_MATS[189] = mat('obsidian'); NAMES[189] = 'Obsidian'; ICON_KEY[189] = 'obsidian'; HARD[189] = 40; MC_HARD[189] = 35; REQ[189] = 4; NEEDS_PICK.add(189); PLACEABLE.add(189); ORDER.push(189);
NAMES[IT.PAINTING] = 'Mystery painting';
ICONS[IT.PAINTING] = drawIcon(g => { g.fillStyle = '#6b4a22'; g.fillRect(-26, -20, 52, 40); g.fillStyle = '#d8c060'; g.fillRect(-21, -15, 42, 30); g.fillStyle = '#b8a040'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-21 + i * 7, -15); g.lineTo(-17.5 + i * 7, -10); g.lineTo(-14 + i * 7, -15); g.fill(); } g.fillStyle = '#e8e0a0'; g.fillRect(-6, -4, 12, 19); g.fillStyle = '#5a4a20'; g.fillRect(-3, 0, 6, 15); });
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(189, IT.PAINTING);
function castleFriendly(c) {
  if (!c || c[0] === 'peak') return false; if (c[0] === 'citadel') return true;
  let h = Math.imul(c[1], 374761393) ^ Math.imul(c[2], 668265263) ^ (gSeed || 7); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 < 0.5;
}
// loot in the abandoned castles' upper rooms (generated with the castle)
(function () {
  const pc = g9PlaceCastles;
  g9PlaceCastles = function () {
    castleChestSpots.length = 0;
    const r = pc.apply(this, arguments);
    let s = (gSeed ^ 0x2545f491) >>> 0 || 3; const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    const LOOT = [[T.OBSIDIAN, 4, 0.55], [IT.DIAMOND, 2, 0.4], [IT.IPICK, 1, 0.3], [IT.ISWORD, 1, 0.3], [109, 1, 0.25], [110, 1, 0.2], [IT.IRONINGOT, 5, 0.6], [IT.GOLDINGOT, 3, 0.4], [IT.SILVERINGOT, 2, 0.3], [IT.PAINTING, 1, 0.08], [IT.FLARE, 2, 0.3]];
    for (const sp of castleChestSpots) {
      const c = g9castles.find(cc => Math.hypot(cc[1] - sp[0], cc[2] - sp[2]) < 34);
      if (!c || castleFriendly(c)) { chests.set(keyOf(sp[0], sp[1], sp[2]), {slots: [[IT.BREAD, 4], [T.TORCH, 6]].concat(new Array(25).fill(null))}); continue; }
      lootChest(sp[0], sp[1], sp[2], LOOT, rnd);
    }
    return r;
  };
})();
// abandoned castles only: guardians (+ big skeletons). Friendly castles: clansmen.
(function () {
  const um = updateMobs;
  let clanT = 0;
  updateMobs = function (dt) {
    const all = typeof g9castles !== 'undefined' ? g9castles : null;
    if (all && genVer === GEN9) g9castles = all.filter(c => !castleFriendly(c));
    try { um.apply(this, arguments); } finally { if (all) g9castles = all; }
    if (!started) return;
    for (const a of mobs) if (a.kind === 'clansman') clanAI(a, dt);
    clanT -= dt; if (clanT > 0 || genVer !== GEN9 || !all) return; clanT = 3;
    for (const c of all) {
      const cx = c[1], cz = c[2]; if (Math.hypot(P.x - cx, P.z - cz) > 64) continue;
      const fr = castleFriendly(c), kind = fr ? 'clansman' : 'bigskel', want = fr ? 4 : 2;
      const here = mobs.filter(a => (a.kind === (fr ? 'clansman' : 'skeleton')) && a.home && a.home[0] === cx && a.home[1] === cz).length;
      if (here >= want) continue;
      for (let k = 0; k < 30; k++) {
        const x = Math.floor(cx + (Math.random() - .5) * 24), z = Math.floor(cz + (Math.random() - .5) * 24); if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) continue;
        let y = -1; for (let yy = Math.min(H - 3, g9top(x, z) + 1); yy > 2; yy--) if (solid(x, yy - 1, z) && !solid(x, yy, z) && !solid(x, yy + 1, z)) { y = yy; break; }
        if (y < 0 || (!fr && Math.hypot(P.x - x, P.z - z) < 10)) continue;
        const m = spawnMob(fr ? 'clansman' : 'skeleton'); if (!m) break;
        m.g.position.set(x + .5, y, z + .5); m.home = [cx, cz];
        if (!fr) { m.g.scale.setScalar(1.45); m.hp = 26; m.big = true; m.hitY *= 1.45; m.hitR *= 1.3; }
        break;
      }
    }
  };
})();
function makeClansman() {
  const g = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({color: 0xe0b090}), steel = new THREE.MeshLambertMaterial({color: 0xb8c0c8}), tart = new THREE.MeshLambertMaterial(tartanTex ? {map: tartanTex} : {color: 0x2b4f8a}), dark = new THREE.MeshLambertMaterial({color: 0x3a2a18}), hair = new THREE.MeshLambertMaterial({color: [0x8a3a1a, 0x3a2a1a, 0xc08040][Math.floor(Math.random() * 3)]});
  const box = (w, h, d, x, y, z, m, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (p || g).add(o); return o; };
  const head = new THREE.Group(); head.position.y = 1.75; g.add(head);
  box(0.46, 0.46, 0.46, 0, 0, 0, skin, head); box(0.5, 0.16, 0.5, 0, 0.2, 0, steel, head);   // face + helm
  box(0.46, 0.16, 0.06, 0, -0.17, 0.22, hair, head);                                              // beard
  for (const sx of [-1, 1]) box(0.07, 0.05, 0.02, sx * 0.11, 0.04, 0.235, dark, head);
  box(0.52, 0.5, 0.28, 0, 1.25, 0, steel); box(0.54, 0.3, 0.3, 0, 0.9, 0, tart);               // mail shirt + kilt
  box(0.1, 0.62, 0.05, 0.12, 1.25, 0.15, tart);                                                    // plaid sash
  const arms = [limb(g, 0.18, 0.7, 0.18, steel, -0.36, 1.48, 0), limb(g, 0.18, 0.7, 0.18, steel, 0.36, 1.48, 0)];
  const legs = [limb(g, 0.2, 0.75, 0.2, skin, -0.13, 0.75, 0), limb(g, 0.2, 0.75, 0.2, skin, 0.13, 0.75, 0)];
  const sw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.03), steel); sw.position.set(0, -0.95, 0.12); sw.rotation.x = 1.4; arms[1].add(sw);
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 14), dark); shield.rotation.z = Math.PI / 2; shield.position.set(-0.1, -0.45, 0); arms[0].add(shield);
  return {g, legs, arms, mats: [skin, steel, tart, dark, hair], head, speed: 0, hp: 24, hitY: 1.1, hitR: .55, hostile: false, tall: 2};
}
(function () {
  const mh = makeHumanoid;
  makeHumanoid = function (kind) { if (kind === 'clansman') return makeClansman(); return mh.apply(this, arguments); };
  const dm = damageMob;
  damageMob = function (a, dmg, byPlayer) { if (a.kind === 'clansman' && byPlayer) { a.mad = 30; a.flee = 0; } return dm.apply(this, arguments); };
  const km = killMob;
  killMob = function (a) { if (a.kind === 'clansman') { const p = a.g.position; burst(p.x, p.y + 1, p.z, 0xb03020, 14); dropItem(IT.IRONINGOT, 1, p.x, p.y + .5, p.z, 0, 3, 0, .4); if (Math.random() < 0.3) dropItem(IT.BREAD, 2, p.x, p.y + .5, p.z, 0, 3, 0, .4); removeMob(a); return; }
    if (a.big) { const p = a.g.position; dropItem(IT.BONE, 3, p.x, p.y + .5, p.z, 0, 3, 0, .4); if (Math.random() < 0.15) dropItem(T.OBSIDIAN, 1, p.x, p.y + .5, p.z, 0, 3, 0, .4); }
    return km.apply(this, arguments); };
})();
// clansmen: wander the castle, look at you, chop/quarry near home, fight hostile mobs; only fight you if you hit them
function clanAI(a, dt) {
  const p = a.g.position; a.flee = 0; a.speed = 0; a.burning = 0;
  const dpx = P.x - p.x, dpz = P.z - p.z, dist = Math.hypot(dpx, dpz);
  if (a.mad > 0) a.mad -= dt;
  a.cd = (a.cd || 0) - dt; a.task = (a.task || 0) - dt;
  let target = null, td = 14;
  if (a.mad > 0 && !dead) { target = 'player'; td = dist; }
  else for (const m of mobs) if (m.hostile && m.kind !== 'clansman') { const d = Math.hypot(m.g.position.x - p.x, m.g.position.z - p.z); if (d < td) { td = d; target = m; } }
  let spd = 0;
  if (target) {
    const tx = target === 'player' ? P.x : target.g.position.x, tz = target === 'player' ? P.z : target.g.position.z;
    a.ang = Math.atan2(tx - p.x, tz - p.z); spd = td > 1.6 ? 3.4 : 0;
    if (td < 2.1 && a.cd <= 0) { a.cd = 0.9; if (a.arms[1]) a.arms[1].rotation.x = -2.4; try { sfx3d('swoosh', p, 12); } catch (_) {}
      if (target === 'player') hurt(4, 'A clansman taught you some manners.'); else damageMob(target, 5, false); }
  } else {
    const hx = a.home ? a.home[0] : p.x, hz = a.home ? a.home[1] : p.z, hd = Math.hypot(p.x - hx, p.z - hz);
    if (hd > 18) { a.ang = Math.atan2(hx - p.x, hz - p.z); spd = 1.4; }
    else if (dist < 6) { a.ang = Math.atan2(dpx, dpz); spd = 0; if (a.head) a.head.rotation.y = 0; }   // glance at the visitor
    else { if (a.task <= 0) { a.task = 3 + Math.random() * 6; a.mode = Math.random() < 0.35 ? 'work' : 'walk'; a.ang += (Math.random() - .5) * 2.5; } spd = a.mode === 'walk' ? 1.2 : 0;
      if (a.mode === 'work' && Math.random() < dt * 1.5) { if (a.arms[1]) a.arms[1].rotation.x = -2.0; const fx = p.x + Math.sin(a.ang) * 0.8, fz = p.z + Math.cos(a.ang) * 0.8; burst(fx, p.y + 0.8, fz, Math.random() < 0.5 ? 0x8a6a3a : 0x8a8a8a, 3, .4); try { sfx3d('dig', p, 10); } catch (_) {} } }
  }
  if (a.arms[1] && a.arms[1].rotation.x < -0.2) a.arms[1].rotation.x += dt * 5;
  if (spd) stepMob(a, spd, dt, !target); a.moving = spd > 0;
}
