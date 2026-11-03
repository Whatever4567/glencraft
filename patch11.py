import re
s=open('s1.js').read()
def R(a,b):
    global s
    assert s.count(a)==1,(s.count(a),a[:70]); s=s.replace(a,b)
# rounded forms in mob builders
def roundify(fname):
    global s
    i=s.index('function '+fname+'('); j=s.index('\n}\n',i)
    body=s[i:j].replace('new THREE.BoxGeometry(','roundBox(')
    s=s[:i]+body+s[j:]
for f in ['makeSheep','makeHumanoid','limb','makeTreeman']: roundify(f)
# sheep: rounder, fuller fleece body
R("""  const body = new THREE.Mesh(roundBox(0.95, 0.68, 1.22), wool); body.position.y = 0.78; fleece.add(body);""",
  """  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), wool); body.scale.set(0.98, 0.74, 1.28); body.position.y = 0.8; fleece.add(body);
  for (const [x, y, z, r] of [[0, 1.08, 0.25, .3], [0, 1.06, -0.3, .32], [-0.3, 0.85, 0, .3], [0.3, 0.85, 0, .3], [0, 0.82, 0.52, .26], [0, 0.85, -0.55, .26]]) { const p = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), wool); p.position.set(x, y, z); fleece.add(p); }""")
# calmer passive wandering + goals
R("""      } else if (a.timer <= 0) {
        a.timer = 2 + Math.random() * 4;
        a.moving = Math.random() < 0.6;
        if (a.moving) a.ang = a.ang + (Math.random() - .5) * 2.4;
        if (a.moving && a.kind === 'sheep') { const gd = grassDir(a); if (gd !== null && Math.random() < 0.65) a.ang = gd; }
      }
      if (a.moving) stepMob(a, spd, dt, a.flee <= 0);""","""      } else if (a.timer <= 0) {
        // GLX-B6: calm grazing animals: long idle pauses, short purposeful strolls to a nearby spot
        if (a.moving) { a.moving = false; a.goal = null; a.timer = 7 + Math.random() * 12; }
        else if (Math.random() < 0.4) {
          let ga = a.ang + (Math.random() - .5) * 2.2;
          if (a.kind === 'sheep') { const gd = grassDir(a); if (gd !== null && Math.random() < 0.65) ga = gd; }
          const r = 3 + Math.random() * 5; a.goal = [pos.x + Math.sin(ga) * r, pos.z + Math.cos(ga) * r]; a.moving = true; a.timer = 5 + Math.random() * 4; a.path = null;
        } else a.timer = 4 + Math.random() * 7;
      }
      if (a.moving && a.flee <= 0 && a.goal) {
        const an = pathAngle(a, a.goal[0], a.goal[1]);
        if (an === null || Math.hypot(a.goal[0] - pos.x, a.goal[1] - pos.z) < 0.6) { a.moving = false; a.goal = null; a.timer = 6 + Math.random() * 10; }
        else a.ang = an;
      }
      if (a.moving) stepMob(a, spd * (a.flee > 0 ? 1 : 0.7), dt, false);""")
# hostile chase via path
R("""        a.ang = Math.atan2(dpx, dpz) + (a.detourT > 0 ? a.detour : 0);""","""        { const pa = pathAngle(a, P.x, P.z); a.ang = pa !== null ? pa : Math.atan2(dpx, dpz) + (a.detourT > 0 ? a.detour : 0); }""")
R("""        if (a.timer <= 0) { a.timer = 2 + Math.random() * 3; a.moving = Math.random() < 0.5; a.ang = Math.random() * Math.PI * 2; }
        spd = a.moving ? a.speed * 0.45 : 0;""","""        if (a.timer <= 0) { a.timer = 4 + Math.random() * 5; a.moving = Math.random() < 0.3; a.ang += (Math.random() - .5) * 1.6; }
        spd = a.moving ? a.speed * 0.35 : 0;""")
R("""    a.yawVis = turnToward(a.yawVis === undefined ? a.ang : a.yawVis, a.ang, dt * (a.kind === 'treeman' ? 4 : 7));""",
  """    a.yawVis = turnToward(a.yawVis === undefined ? a.ang : a.yawVis, a.ang, dt * (a.kind === 'treeman' ? 4 : a.hostile ? (a.aggro > 0 ? 5 : 2.5) : (a.flee > 0 ? 6 : 2.6)));""")
R("""function stepMob(a, spd, dt, wander) {""","""// GLX-B6: rounded box (bevelled corners) so mobs read as soft forms rather than hard cubes
const _rbCache = new Map();
function roundBox(w, h, d) {
  const k = w + '|' + h + '|' + d; if (_rbCache.has(k)) return _rbCache.get(k).clone();
  const g = new THREE.BoxGeometry(w, h, d, 3, 3, 3), r = Math.min(w, h, d) * 0.22, p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); c.set(clamp(v.x, -hx, hx), clamp(v.y, -hy, hy), clamp(v.z, -hz, hz));
    v.sub(c); if (v.lengthSq() > 1e-8) v.setLength(r); v.add(c); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); _rbCache.set(k, g); return g.clone();
}
// ---- grid A* over walkable voxels (steps up 1, drops up to 3), budgeted per frame and cached per mob ----
let pathBudget = 3;
function walkCell(x, y, z, tall) {
  if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1 || y < 1 || y >= H - 2) return false;
  if (!solid(x, y - 1, z)) return false;
  const fb = getB(x, y - 1, z), b = getB(x, y, z); if (fb === T.LAVA || b === T.WATER || b === T.LAVA) return false;
  for (let k = 0; k < tall; k++) if (solid(x, y + k, z)) return false;
  return true;
}
function findPath(sx, sy, sz, tx, tz, tall, limit) {
  if (!walkCell(sx, sy, sz, tall)) { if (walkCell(sx, sy + 1, sz, tall)) sy++; else return null; }
  const key = (x, y, z) => (x * 64 + z) * 64 + y, open = [], g = new Map(), from = new Map(), ys = new Map();
  const h = (x, z) => Math.abs(x - tx) + Math.abs(z - tz);
  const push = n => { open.push(n); let i = open.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (open[p][0] <= n[0]) break; open[i] = open[p]; open[p] = n; i = p; } };
  const pop = () => { const top = open[0], last = open.pop(); if (open.length) { open[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < open.length && open[l][0] < open[m][0]) m = l; if (r < open.length && open[r][0] < open[m][0]) m = r; if (m === i) break; [open[i], open[m]] = [open[m], open[i]]; i = m; } } return top; };
  const k0 = key(sx, sy, sz); g.set(k0, 0); push([h(sx, sz), sx, sy, sz]);
  let best = [h(sx, sz), sx, sy, sz], n = 0;
  while (open.length && n++ < limit) {
    const [, x, y, z] = pop(), kc = key(x, y, z), gc = g.get(kc);
    const hh = h(x, z); if (hh < best[0]) best = [hh, x, y, z];
    if (x === tx && z === tz) { best = [0, x, y, z]; break; }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      let ny = null;
      if (walkCell(nx, y, nz, tall)) ny = y;
      else if (!solid(x, y + tall, z) && walkCell(nx, y + 1, nz, tall)) ny = y + 1;
      else for (let dd = 1; dd <= 3; dd++) { if (solid(nx, y - dd + tall, nz) || solid(nx, y, nz)) break; if (walkCell(nx, y - dd, nz, tall)) { ny = y - dd; break; } }
      if (ny === null) continue;
      const kn = key(nx, ny, nz), gn = gc + 1 + (ny !== y ? 0.6 : 0);
      if (g.has(kn) && g.get(kn) <= gn) continue;
      g.set(kn, gn); from.set(kn, kc); ys.set(kn, [nx, ny, nz]); push([gn + h(nx, nz) * 1.1, nx, ny, nz]);
    }
  }
  if (best[1] === sx && best[3] === sz) return null;
  const out = []; let k = key(best[1], best[2], best[3]);
  while (k !== k0 && from.has(k)) { out.push(ys.get(k)); k = from.get(k); }
  return out.reverse();
}
// heading for a mob to walk toward (tx, tz) along a cached path; null when there is no way
function pathAngle(a, tx, tz) {
  const p = a.g.position, now = performance.now(), cx = Math.floor(tx), cz = Math.floor(tz);
  const direct = Math.hypot(tx - p.x, tz - p.z);
  if (direct < 1.6) return Math.atan2(tx - p.x, tz - p.z);
  const stale = !a.path || !a.path.length || now - a.pathAt > 2500 || (a.pathGoal && Math.abs(a.pathGoal[0] - cx) + Math.abs(a.pathGoal[1] - cz) > 2);
  if (stale && pathBudget > 0 && !(a.pathFailUntil > now)) {
    pathBudget--;
    a.path = findPath(Math.floor(p.x), Math.floor(p.y + 0.05), Math.floor(p.z), cx, cz, a.hostile ? 2 : 1, a.hostile ? 700 : 350);
    a.pathAt = now; a.pathGoal = [cx, cz];
    if (!a.path) { a.pathFailUntil = now + 1500; return null; }
  }
  if (!a.path || !a.path.length) return a.pathFailUntil > now ? null : Math.atan2(tx - p.x, tz - p.z);
  while (a.path.length && Math.hypot(a.path[0][0] + .5 - p.x, a.path[0][2] + .5 - p.z) < 0.45) a.path.shift();
  if (!a.path.length) return Math.atan2(tx - p.x, tz - p.z);
  // look one waypoint ahead when it is on the same level, so corners are cut smoothly
  const w = a.path.length > 1 && a.path[1][1] === a.path[0][1] ? a.path[1] : a.path[0];
  return Math.atan2(w[0] + .5 - p.x, w[2] + .5 - p.z);
}
function stepMob(a, spd, dt, wander) {""")
R("""function mobDirector(dt) {
  if (!started) return;""","""function mobDirector(dt) {
  pathBudget = 3;
  if (!started) return;""")
# per-pixel materials for mobs + calmer speeds, in the spawn wrapper
R("""  const a = spawnMobBase(kind);
  if (a) { a.bornAt""","""  const a = spawnMobBase(kind);
  if (a) upgradeMobMaterials(a);
  if (a && PASSIVE_KINDS.has(kind)) a.speed *= 0.8; else if (a && a.hostile) a.speed *= 0.9;
  if (a) { a.bornAt""")
s += r"""
// GLX-B6: per-pixel lit, mip-mapped, anisotropic mob materials so the 1024px painted fur/skin reads crisply
function upgradeMobMaterials(a) {
  const swap = new Map();
  const conv = m => {
    if (!m || !m.isMeshLambertMaterial) return m;
    if (swap.has(m)) return swap.get(m);
    const n = new THREE.MeshPhongMaterial({map: m.map, color: m.color, emissive: m.emissive, transparent: m.transparent, opacity: m.opacity, side: m.side, shininess: 6, specular: 0x111111});
    if (n.map) { n.map.anisotropy = Math.max(n.map.anisotropy || 1, HIGH ? 8 : 4); n.map.needsUpdate = true; }
    swap.set(m, n); return n;
  };
  a.g.traverse(o => { if (o.material) o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material); });
  for (const k in a) { const v = a[k]; if (v && v.isMaterial && swap.has(v)) a[k] = swap.get(v); }
  if (Array.isArray(a.mats)) a.mats = a.mats.map(m => swap.get(m) || m);
  swap.forEach((n, o) => o.dispose());
}
"""
open('s1.js','w').write(s)
