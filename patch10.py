s=open('s1.js').read()
def R(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:70]); s=s.replace(a,b)
# (c) old night spawner off (managed below)
R("""  nightSpawn += dt;
  if (isNight && nightSpawn > 5 && started) {
    nightSpawn = 0;
    if (countKind('zombie') + countKind('skeleton') < 5) spawnMob(Math.random() < .55 ? 'zombie' : 'skeleton');
  }""","""  mobDirector(dt);""")
R("""    if (countKind('haggis') < 14) spawnMob('haggis');
    if (countKind('sheep') < 8 && Math.random() < .5) spawnMob('sheep');
    if (countKind('duck') < 6) spawnMob('duck');
    if (countKind('puffer') < 4 && Math.random() < .4) spawnMob('puffer');
    if (caveK > 0.25 && countKind('spider') < 5) spawnMob('spider');""","""    if (countKind('haggis') < 4) spawnMob('haggis');
    if (countKind('sheep') < 3 && Math.random() < .5) spawnMob('sheep');
    if (countKind('duck') < 2) spawnMob('duck');
    if (countKind('puffer') < 1 && Math.random() < .4) spawnMob('puffer');
    if (caveK > 0.25 && countKind('spider') < 3) spawnMob('spider');""")
# (d) aggro 8 blocks + notice delay
R("""      if (!dead && started && dist <= 13 && canSee(a, 13)) a.aggro = 3;
      else a.aggro = Math.max(0, (a.aggro || 0) - dt);""","""      // GLX-B6: notices you within 8 blocks with line of sight, telegraphs for ~1 s, then attacks
      const sees = !dead && started && dist <= 8 && canSee(a, 8);
      if (sees && !(a.aggro > 0)) {
        if (a.notice === undefined) { a.notice = 1.0; a.ang = Math.atan2(dpx, dpz); sfx3d(a.kind === 'zombie' ? 'groan' : 'bow', pos, 14); if (a.head) a.head.rotation.x = -0.3; }
        a.notice -= dt; if (a.notice <= 0) { a.aggro = 3; a.notice = undefined; }
      } else if (sees) a.aggro = 3;
      else { a.aggro = Math.max(0, (a.aggro || 0) - dt); if (a.notice !== undefined && !sees) { a.notice += dt * 0.5; if (a.notice > 1.2) a.notice = undefined; } }
      if (a.notice !== undefined && !(a.aggro > 0)) { a.ang = Math.atan2(dpx, dpz); a.moving = false; }""")
# (e) LOD tick
R("""    let spd = 0;

    if (a.hostile && day && !a.burning) a.burning = 1.8;""","""    let spd = 0;
    // GLX-B6: far mobs only think a couple of times a second
    if (dist > 30 && a.kind !== 'treeman' && !a.burning && !(a.fire > 0)) { a.lodT = (a.lodT || 0) + dt; if (a.lodT < 0.5) continue; dt = a.lodT; a.lodT = 0; }
    else if (a.lodDt) { dt = a.lodDt; }

    if (a.hostile && day && !a.burning) a.burning = 1.8;""")
s += r"""
/* ===================== PERF B6: mob caps, despawning, night director ===================== */
const MOB_CAP = {passive: 8, hostile: 5, spider: 3, total: 18}, PASSIVE_KINDS = new Set(['sheep', 'haggis', 'duck', 'puffer']);
const countGroup = g => mobs.filter(a => g === 'passive' ? PASSIVE_KINDS.has(a.kind) : g === 'hostile' ? a.hostile : a.kind === g).length;
const spawnMobBase = spawnMob;
spawnMob = function (kind) {
  const grp = PASSIVE_KINDS.has(kind) ? 'passive' : (kind === 'zombie' || kind === 'skeleton') ? 'hostile' : kind;
  if (mobs.length >= MOB_CAP.total || (MOB_CAP[grp] !== undefined && countGroup(grp) >= MOB_CAP[grp])) return null;
  const a = spawnMobBase(kind);
  if (a) { a.bornAt = performance.now(); a.prog = {x: a.g.position.x, z: a.g.position.z, t: 0}; a.unseenT = 0; }
  return a;
};
// free GPU memory properly: geometries and every material on the model
const removeMobBase = removeMob;
removeMob = function (a) {
  a.g.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (!m.map || !m.map.image || m.map.isCanvasTexture) m.dispose(); }); });
  removeMobBase(a);
};
const _frus = new THREE.Frustum(), _pm = new THREE.Matrix4(), _sph = new THREE.Sphere();
function inView(a) {
  _pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _frus.setFromProjectionMatrix(_pm);
  _sph.center.copy(a.g.position); _sph.center.y += 1; _sph.radius = 1.5; return _frus.intersectsSphere(_sph);
}
const keepMob = a => a.named || a.tamed || heldBy === a || (a.kind === 'treeman' && (a.state === 'chase' || a.state === 'grab' || a.state === 'twist'));
var nightT = 0, graceT = 30, directorT = 0, despawnT = 0, wasNightD = false;
function despawnPass(dt) {
  for (let i = mobs.length - 1; i >= 0; i--) {
    const a = mobs[i]; if (keepMob(a)) continue;
    const p = a.g.position, d = Math.hypot(p.x - P.x, p.z - P.z);
    if (d > 40) { removeMob(a); continue; }
    const vis = inView(a);
    a.unseenT = vis ? 0 : (a.unseenT || 0) + dt;
    if (!vis && d > 16 && a.unseenT > 10) { removeMob(a); continue; }
    // stuck: no real progress for ~8 s while trying to move, and not near you
    a.prog = a.prog || {x: p.x, z: p.z, t: 0}; a.prog.t += dt;
    if (a.prog.t > 8) { const moved = Math.hypot(p.x - a.prog.x, p.z - a.prog.z); if (a.moving && moved < 0.6 && d > 12) { removeMob(a); continue; } a.prog = {x: p.x, z: p.z, t: 0}; }
  }
}
// hostiles appear 20-40 blocks away, never where you can see them
function hostileSpot() {
  let best = null;
  for (let tries = 0; tries < 120; tries++) {
    const ang = Math.random() * Math.PI * 2, r = 20 + Math.random() * 20;
    const x = Math.floor(P.x + Math.sin(ang) * r), z = Math.floor(P.z + Math.cos(ang) * r);
    if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) continue;
    const top = groundTop(x, z), b = getB(x, top, z);
    if (top < SEA || b === T.LEAVES || b === T.WATER || b === T.LOG || solid(x, top + 1, z) || solid(x, top + 2, z)) continue;
    const fake = {g: {position: new THREE.Vector3(x + .5, top + 1, z + .5)}};
    if (inView(fake) || canSee(fake, 48)) continue;
    return [x + .5, top + 1, z + .5];
  }
  return best;
}
function mobDirector(dt) {
  if (!started) return;
  despawnT += dt; if (despawnT > 0.5) { despawnPass(despawnT); despawnT = 0; }
  if (isNight && !wasNightD) { nightT = 0; graceT = 30; }
  wasNightD = isNight;
  if (graceT > 0) graceT -= dt;
  if (!isNight || dead) return;
  nightT += dt;
  if (graceT > 0) return;
  // gradual ramp: 1 hostile allowed after the grace period, +1 every 25 s, up to the cap
  const allowed = Math.min(MOB_CAP.hostile, 1 + Math.floor((nightT - 30) / 25));
  directorT += dt;
  if (directorT < 12) return;
  directorT = 0;
  if (countGroup('hostile') >= allowed) return;
  const spot = hostileSpot(); if (!spot) return;
  const a = spawnMob(Math.random() < .55 ? 'zombie' : 'skeleton');
  if (a) { a.g.position.set(spot[0], spot[1], spot[2]); a.prog = {x: spot[0], z: spot[2], t: 0}; }
}
(function hookRespawn() { const base = respawn; respawn = function () { const r = base.apply(this, arguments); graceT = 30; return r; }; })();
"""
open('s1.js','w').write(s)
