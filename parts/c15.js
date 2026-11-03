
/* ===================== GLX-F1 (v0.9.15): neutral haggis (heather only), grazing sheep, pigs in the mud ===================== */
// haggis: never clamps onto your arm any more; only when hit does it rage, leaping and biting again and again
haggisGrab = function (a) {
  if (dead || !started || MODE.noDamage) return;
  hurt(2, 'A raging haggis bit you.'); sfx3d('squeal', a.g.position, 13); shake(0.18, 0.02);
  const dx = P.x - a.g.position.x, dz = P.z - a.g.position.z, l = Math.hypot(dx, dz) || 1; knockPlayer(dx / l, dz / l, 3, 2.5);
  a.angry = Math.max(a.angry, 12); a.biteCd = 0.9 + Math.random() * 0.5;
};
(function () {
  const dm = damageMob;
  damageMob = function (a, dmg, byPlayer) { const r = dm.apply(this, arguments); if (a.kind === 'haggis' && byPlayer && a.hp > 0) { a.angry = 20; a.flee = 0; } return r; };
  // biome-bound spawning: haggis on heather (the purple moor), sheep on grass, pigs on mud
  const WANT = {haggis: [T.HEATHER], sheep: [T.GRASS], pig: [T.MUD, T.PEAT]};
  let want = null;
  const fs = findSpot;
  findSpot = function () {
    if (!want) return fs.apply(this, arguments);
    for (let i = 0; i < 40; i++) { const s = fs.apply(this, arguments); if (!s) return null; const b = getB(Math.floor(s[0]), Math.floor(s[1] - 0.5), Math.floor(s[2])); if (want.includes(b)) return s; }
    if (want.includes(T.MUD)) for (let i = 0; i < 20; i++) { const s = fs.apply(this, arguments); if (s && getB(Math.floor(s[0]), Math.floor(s[1] - 0.5), Math.floor(s[2])) === T.GRASS) return s; }   // pigs: grass if no mud nearby
    return null;
  };
  const sm = spawnMob;
  spawnMob = function (kind) { want = (genVer >= GEN9 && WANT[window.__pigSpawn ? 'pig' : kind]) || null; try { return sm.apply(this, arguments); } finally { want = null; } };
})();
// sheep eat the grass they graze (it turns to dirt for a while and grows back); eating regrows their wool
var eatenGrass = [];
(function () {
  const sg = sheepGraze;
  sheepGraze = function (a, dt) {
    const p = a.g.position, x = Math.floor(p.x), y = Math.floor(p.y + 0.1), z = Math.floor(p.z);
    const tall = getB(x, y, z) === T.TALLGRASS;
    sg.apply(this, arguments);
    if (!tall && getB(x, y - 1, z) === T.GRASS) { if (a.sheared) { a.sheared = false; a.regrow = 0; if (a.fleece) a.fleece.visible = true; } setB(x, y - 1, z, T.DIRT); eatenGrass.push([x, y - 1, z, performance.now() + 60000 + Math.random() * 90000]); burst(p.x, p.y + 0.2, p.z, 0x6aa040, 6, .4); }
  };
})();
setInterval(() => { const now = performance.now(); for (let i = eatenGrass.length - 1; i >= 0; i--) { const e = eatenGrass[i]; if (now > e[3]) { if (getB(e[0], e[1], e[2]) === T.DIRT && getB(e[0], e[1] + 1, e[2]) === T.AIR) setB(e[0], e[1], e[2], T.GRASS); eatenGrass.splice(i, 1); } } }, 5000);
// ---------- pigs ----------
IT.PORK = 177; IT.COOKEDPORK = 178; NAMES[IT.PORK] = 'Raw pork'; NAMES[IT.COOKEDPORK] = 'Cooked pork';
FOOD[IT.PORK] = [3, 1.8]; FOOD[IT.COOKEDPORK] = [8, 12.8]; SMELT[IT.PORK] = IT.COOKEDPORK;
ICONS[IT.PORK] = drawIcon(g => { g.fillStyle = '#f0a0a0'; g.beginPath(); g.ellipse(0, 0, 24, 15, -0.3, 0, 7); g.fill(); g.fillStyle = '#fff2e8'; g.beginPath(); g.ellipse(-8, -3, 8, 5, -0.3, 0, 7); g.fill(); g.strokeStyle = '#b06060'; g.lineWidth = 2; g.stroke(); });
ICONS[IT.COOKEDPORK] = drawIcon(g => { g.fillStyle = '#a0603a'; g.beginPath(); g.ellipse(0, 0, 24, 15, -0.3, 0, 7); g.fill(); g.fillStyle = '#e8c890'; g.beginPath(); g.ellipse(-8, -3, 8, 5, -0.3, 0, 7); g.fill(); g.strokeStyle = '#5a3018'; g.lineWidth = 2; g.stroke(); });
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(IT.PORK, IT.COOKEDPORK);
PASSIVE_KINDS.add('pig');
function makePig() {
  const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
  const skin = new THREE.MeshLambertMaterial({color: 0xeaa0a0}), dark = new THREE.MeshLambertMaterial({color: 0xc07878}), mud = new THREE.MeshLambertMaterial({color: 0x5a4030}), eye = new THREE.MeshLambertMaterial({color: 0x1a1010});
  const box = (w, h, d, x, y, z, m, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (p || rig).add(o); return o; };
  box(0.62, 0.5, 0.95, 0, 0.55, 0, skin); box(0.64, 0.22, 0.5, 0, 0.42, -0.1, mud);   // body with a muddy flank
  const head = new THREE.Group(); head.position.set(0, 0.65, 0.5); rig.add(head);
  box(0.5, 0.46, 0.42, 0, 0, 0.18, skin, head); box(0.24, 0.16, 0.08, 0, -0.06, 0.42, dark, head);
  box(0.06, 0.06, 0.02, -0.14, 0.08, 0.4, eye, head); box(0.06, 0.06, 0.02, 0.14, 0.08, 0.4, eye, head);
  box(0.12, 0.12, 0.05, -0.19, 0.26, 0.08, dark, head); box(0.12, 0.12, 0.05, 0.19, 0.26, 0.08, dark, head);
  const legs = [[-0.2, 0.3], [0.2, 0.3], [0.2, -0.3], [-0.2, -0.3]].map(([x, z]) => limb(rig, 0.18, 0.32, 0.18, skin, x, 0.32, z));
  const tail = box(0.05, 0.12, 0.05, 0, 0.7, -0.5, dark);
  return {g, legs, arms: [], rig, mats: [skin, dark, mud, eye], head, tail, speed: 1.0, hp: 5, hitY: 0.55, hitR: 0.7, tall: 1};
}
(function () {
  const sm = spawnMob;
  spawnMob = function (kind) {
    if (kind !== 'pig') return sm.apply(this, arguments);
    const mk = makeSheep; makeSheep = makePig;   // reuse the generic passive path with the pig body
    window.__pigSpawn = true; try { const a = sm.call(this, 'sheep'); if (a) { a.kind = 'pig'; a.fleece = a.fleece || {visible: true}; a.grazeT = 1e9; } return a; } finally { makeSheep = mk; window.__pigSpawn = false; }
  };
  const km = killMob;
  killMob = function (a) {
    if (a.kind !== 'pig') return km.apply(this, arguments);
    const p = a.g.position; burst(p.x, p.y + 0.4, p.z, 0xeaa0a0, 12); dropItem(IT.PORK, 1 + Math.floor(Math.random() * 2), p.x, p.y + 0.4, p.z, (Math.random() - .5) * 2, 3.5, (Math.random() - .5) * 2, 0.4);
    removeMob(a);
  };
})();
// pigs wallow in mud now and then; grunt
setInterval(() => {
  if (!started) return;
  for (const a of mobs) if (a.kind === 'pig' && !a.c118) {   // v1.1.39: HD pigs have their own mud roll (C118)
    const p = a.g.position, under = getB(Math.floor(p.x), Math.floor(p.y - 0.5), Math.floor(p.z));
    if (!a.wallow && (under === T.MUD || under === T.PEAT) && Math.random() < 0.12) { a.wallow = 4 + Math.random() * 3; a.spd0 = a.speed; a.speed = 0; }
    if (a.wallow) { a.wallow -= 1; a.rig.rotation.z = a.wallow > 0 ? Math.sin(a.wallow * 2.2) * 1.2 : 0; if (a.wallow <= 0) { a.wallow = 0; a.speed = a.spd0 || 1; a.rig.rotation.z = 0; } if (Math.random() < 0.3) burst(p.x, p.y + 0.2, p.z, 0x5a4030, 4, .4); }
  }
  if (genVer >= GEN9 && !isNight && countKind('pig') < 4 && Math.random() < 0.15) spawnMob('pig');
}, 1000);
// mud wallows: a few muddy patches by lochs and the sea shore for pigs
(function () {
  const g = generate;
  generate = function () {
    const r = g.apply(this, arguments);
    if (genVer === GEN9 && !cityGen && g9cols) {
      let made = 0; const rnd = (n) => Math.floor(Math.random() * n);
      for (let t = 0; t < 4000 && made < 30; t++) {
        const x = 6 + rnd(W - 12), z = 6 + rnd(D - 12), h = g9cols[(x * D + z) * 2];
        if (h < SEA + 2 || h > SEA + 9 || world[idx(x, h - 1, z)] !== T.GRASS) continue;
        const rr = 2 + rnd(3);
        for (let dx = -rr; dx <= rr; dx++) for (let dz = -rr; dz <= rr; dz++) { if (dx * dx + dz * dz > rr * rr + 1) continue; const xx = x + dx, zz = z + dz, hh = g9top(xx, zz); if (Math.abs(hh - (h - 1)) <= 1 && world[idx(xx, hh, zz)] === T.GRASS) { world[idx(xx, hh, zz)] = T.MUD; if (world[idx(xx, hh + 1, zz)] !== T.AIR && PLANT[world[idx(xx, hh + 1, zz)]]) world[idx(xx, hh + 1, zz)] = T.AIR; } }
        made++;
      }
    }
    return r;
  };
})();
