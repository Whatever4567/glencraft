/* ===================== GLX-C232 (v1.0.51): clansfolk - a real mouth that moves with every tone, the rune higher, they rush to grab what you drop, their own goals back (building up a tower at home over time, the old raid on the skeleton castles), sturdier walking (A* budget, 1-block step hops, stuck -> re-plan -> give up), and POV vision (a cheap view cone) fed to the SUNNY brain, which picks their tones ===================== */
(function c232() {
  const U = window.__c232 = {err: null, mouths: 0, grabs: 0, rush: 0, built: 0, stuck: 0, hops: 0, gaveUp: 0, pov: 0, raid: 0, sel: 0};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e).slice(0, 300); };
  const now = () => performance.now() / 1000, PH = () => !!(window.SET && (SET.q === 'phone' || SET.quality === 'phone')) || /Mobi|Android/i.test(navigator.userAgent);
  const isC = a => a && a.kind === 'clansman' && a.g && !a.dead && a.hp > 0;
  // ---------------- face: lips + mouth hole + brows; the mouth opens with each tone ----------------
  const LIP = new THREE.MeshLambertMaterial({color: 0x9a4a40}), HOLE = new THREE.MeshBasicMaterial({color: 0x2a0d0a}), BROW = new THREE.MeshLambertMaterial({color: 0x3a2414});
  function face(s) { const g = new THREE.Group(), m = new THREE.Group();
    const lip = new THREE.Mesh(new THREE.BoxGeometry(0.11 * s, 0.022 * s, 0.012 * s), LIP), hole = new THREE.Mesh(new THREE.BoxGeometry(0.085 * s, 0.03 * s, 0.01 * s), HOLE);
    hole.position.z = 0.002 * s; m.add(hole); lip.position.y = 0.017 * s; m.add(lip); const lo = lip.clone(); lo.position.y = -0.017 * s; m.add(lo); m.userData.lo = lo; m.userData.hole = hole; g.add(m);
    for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.075 * s, 0.018 * s, 0.012 * s), BROW); b.position.set(sx * 0.065 * s, 0.13 * s, 0); b.rotation.z = -sx * 0.12; g.add(b); }
    g.userData.mouth = m; return g; }
  function setMouth(a, open) { const m = a.__c232m; if (!m) return; const o = Math.max(0, Math.min(1, open)); m.userData.hole.scale.y = 0.2 + o * 1.6; m.userData.lo.position.y = m.userData.hole.geometry.parameters.height * (-0.55 - o * 0.9); }
  try { const H = window.__c135; if (H && H.post) H.post.push(function (a, c, M, m, hd) { if (a.kind !== 'clansman') return; let b = null; m.traverse(o => { if (!b && o.isBone && /^Head$/.test(o.name)) b = o; }); if (!b) return;
      hd.updateMatrixWorld(true); const IV = new THREE.Vector3(), IQ = new THREE.Quaternion(), IS = new THREE.Vector3(); b.matrixWorld.decompose(IV, IQ, IS); const g = face(1); const w = new THREE.Group(); w.quaternion.copy(IQ).invert(); w.scale.setScalar(1 / (IS.x || 1)); g.position.set(0, -0.01, 0.302); w.add(g); b.add(w); a.__c232hdm = g.userData.mouth; U.mouths++; }); } catch (e) { ERR(e); }
  function procFace(a) { if (a.__c232f || !a.head) return; a.__c232f = 1; const g = face(1.6); g.position.set(0, 0.11, 0.258); a.head.add(g); a.__c232pm = g.userData.mouth; U.mouths++; }
  // ---------------- player drops: they rush over, pick them up, and are pleased ----------------
  const seen = new WeakSet(), mine = [];
  function scanDrops() { if (typeof drops === 'undefined') return; for (const d of drops) { if (seen.has(d)) continue; seen.add(d); if (d && Math.hypot(d.x - P.x, d.z - P.z) < 3.5 && Math.abs(d.y - P.y) < 3) mine.push({d, t: now()}); }
    for (let i = mine.length - 1; i >= 0; i--) if (drops.indexOf(mine[i].d) < 0 || now() - mine[i].t > 60) mine.splice(i, 1); }
  function rush(a, dt) { if (!mine.length || a.sleeping || a.trading || a.angryT > 0 || a.act === 'fight') return false; const p = a.g.position; let b = null, bd = 22;
    for (const o of mine) { if (o.who && o.who !== a && mobs.includes(o.who)) continue; const d = Math.hypot(o.d.x - p.x, o.d.z - p.z); if (d < bd) { bd = d; b = o; } }
    if (!b) return false; if (!b.who) { b.who = a; U.rush++; a.mood = 'smile'; a.moodT = 3; try { window.__c209 && __c209.speak('happy', p, {a, g: a.g, head: a.head, key: a}, 1); } catch (_) {} }
    if (bd < 1.4) { try { if (window.__c223 && __c223.grab) __c223.grab(a, b.d); else { const k = drops.indexOf(b.d); if (k >= 0) { try { scene.remove(b.d.m || b.d.mesh); } catch (_) {} drops.splice(k, 1); } } } catch (e) { ERR(e); } mine.splice(mine.indexOf(b), 1); U.grabs++; a.wp = null; try { window.__c161 && __c161.gift(a, 3); } catch (_) {} return true; }
    if (!a.wp || Math.abs(a.wp[0] - b.d.x) + Math.abs(a.wp[1] - b.d.z) > 0.3) a.wp = [b.d.x, b.d.z]; a.wpY = Math.floor(b.d.y + 0.05); a.wpRef = a.wp; a.wpT = 6; a.idle = 0; a.ang = Math.atan2(b.d.x - p.x, b.d.z - p.z); a.__rush = 1; a.speedMul = 1.45; return true; }
  // ---------------- walking: stuck detection, step hops, re-plans, give up ----------------
  const solidAt = (x, y, z) => { try { return solid(Math.floor(x), Math.floor(y), Math.floor(z)); } catch (_) { return false; } };
  function unstick(a, dt) { const p = a.g.position, s = a.__ws || (a.__ws = {x: p.x, z: p.z, t: 0, n: 0}); const busy = !!(a.wp || (a.job && a.job.type !== 'wait' && !a.job.dance) || a.path || a.__task); a.pathLimit = Math.max(a.pathLimit || 0, 1400);
    if (!busy || a.sleeping || a.trading || a.skipPhys) { s.t = 0; s.x = p.x; s.z = p.z; return; }
    // 1-block step right in front: hop it
    const ax = Math.sin(a.ang || 0), az = Math.cos(a.ang || 0), fy = Math.floor(p.y + 0.05);
    if (a.onGround !== false && solidAt(p.x + ax * 0.7, fy, p.z + az * 0.7) && !solidAt(p.x + ax * 0.7, fy + 1, p.z + az * 0.7) && !solidAt(p.x + ax * 0.7, fy + 2, p.z + az * 0.7) && !solidAt(p.x, fy + 2, p.z) && (a.__hopT || 0) < now()) { a.vy = 6.6; a.onGround = false; a.__hopT = now() + 0.5; U.hops++; }
    s.t += dt; if (s.t < 3) return; const mv = Math.hypot(p.x - s.x, p.z - s.z); s.x = p.x; s.z = p.z; s.t = 0;
    if (mv > 0.7) { s.n = 0; return; }
    s.n++; U.stuck++; a.repath = true; a.path = null; if (a.job && a.job.way) a.job.way = null; if (a.__w) a.__w.way = null;
    if (s.n === 2) { a.ang = (a.ang || 0) + (Math.random() < 0.5 ? 1.6 : -1.6); a.kbx = (a.kbx || 0) + Math.sin(a.ang) * 1.5; a.kbz = (a.kbz || 0) + Math.cos(a.ang) * 1.5; }
    if (s.n >= 3) { s.n = 0; U.gaveUp++; a.wp = null; a.__task = null; if (a.job && a.job.type === 'walk') a.job = null; if (a.__goal) a.__goal = null; } }
  // ---------------- POV vision: a 100 degree cone, a few rays, things in sight ----------------
  const NM = n => { try { return (typeof NAMES !== 'undefined' && NAMES[n]) || ('item ' + n); } catch (_) { return 'item'; } };
  function look(a) { const p = a.g.position, yaw = a.yawVis !== undefined ? a.yawVis : (a.ang || 0), ey = p.y + 1.6, NR = PH() ? 7 : 11, see = {blocks: {}, mobs: {}, people: 0, player: 0, held: null, act: null, near: 99}, v = a.__povV || (a.__povV = new Float32Array(16));
    for (let r = 0; r < NR; r++) { const an = yaw + (r / (NR - 1) - 0.5) * 1.75, dx = Math.sin(an), dz = Math.cos(an), dy = (r % 3 - 1) * 0.18;
      for (let s = 1; s <= 16; s++) { const x = p.x + dx * s, y = ey + dy * s, z = p.z + dz * s; if (y < 1 || y >= H) break; const b = world[idx(Math.floor(x), Math.floor(y), Math.floor(z))] | 0; if (b && b !== T.WATER && !(PLANT && PLANT[b])) { see.blocks[b] = (see.blocks[b] || 0) + 1; see.near = Math.min(see.near, s); break; } } }
    const inCone = q => { const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz); if (d > 18 || d < 0.3) return 0; let da = Math.atan2(dx, dz) - yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > 0.88) return 0;
      for (let s = 1; s < d; s += 1) { const k = s / d; if (solidAt(p.x + dx * k, ey + ((q.y + 1.4) - ey) * k, p.z + dz * k)) return 0; } return d; };
    const dp = inCone({x: P.x, y: P.y, z: P.z}); if (dp) { see.player = dp; try { see.held = typeof selId !== 'undefined' && selId ? NM(selId) : null; } catch (_) {} see.act = (window.attackMouse || window.attackTouch || window.attackPad) ? 'swinging' : (P.vy > 2 ? 'jumping' : null); }
    for (const m of mobs) { if (m === a || !m.g) continue; const d = inCone(m.g.position); if (!d) continue; if (m.kind === 'clansman') see.people++; else see.mobs[m.kind] = (see.mobs[m.kind] || 0) + 1; }
    const nb = Object.keys(see.blocks).length, nh = Object.keys(see.mobs).filter(k => { const m = mobs.find(o => o.kind === k); return m && m.hostile; }).length;
    v[0] = see.player ? 1 - see.player / 18 : 0; v[1] = see.held ? 1 : 0; v[2] = see.act ? 1 : 0; v[3] = Math.min(1, nh / 3); v[4] = Math.min(1, Object.keys(see.mobs).length / 4); v[5] = Math.min(1, see.people / 3); v[6] = 1 - Math.min(16, see.near) / 16; v[7] = Math.min(1, nb / 6);
    for (let i = 8; i < 16; i++) v[i] = 0; for (const b in see.blocks) v[8 + (b % 8)] += see.blocks[b] / NR;
    const ws = []; if (see.player) ws.push('the traveller ' + Math.round(see.player) + ' blocks off' + (see.held ? ' holding ' + see.held : '') + (see.act ? ', ' + see.act : '')); for (const k in see.mobs) ws.push(see.mobs[k] + ' ' + k); if (see.people) ws.push(see.people + ' of us');
    a.__pov = ws.join(', ') || 'quiet ground'; a.__see = see; U.pov++; }
  // ---------------- SUNNY picks the tone: mood/curiosity/energy + what they see + their kernel ----------------
  window.__c232sel = function (q, n, tries, st) { U.sel++; const a = q && q.a, s = st && st.internalState || {}, v = a && a.__povV, k = a && a.__kern;
    let h = ((s.mood || 0) + 1) * 0.5 * 0.45 + (s.curiosity || 0.5) * 0.25 + (s.energy != null ? s.energy : 0.5) * 0.1 + (v ? v[0] * 0.08 + v[3] * 0.07 + v[6] * 0.05 : 0) + (k ? k.gold * 0.1 + k.phase * 0.05 : 0);
    h = (h * 7.31 + (a && a.__vk || 1) * 3.7 + tries * 0.618) % 1; return Math.floor(h * n); };
  // ---------------- own goals: build up a tower at home, and the old raid ----------------
  const BS = () => current && (current.c232 || (current.c232 = {t: {}, pt: 0}));
  const okG = b => b === T.GRASS || b === T.DIRT || b === T.SAND || b === T.STONE || b === 156;
  function site(ci) { const s = BS(), k = Math.round(ci.cx) + ',' + Math.round(ci.cz); if (s.t[k]) return s.t[k];
    for (let r = 13; r <= 20; r += 2) for (let i = 0; i < 12; i++) { const an = i / 12 * 6.283, x = Math.floor(ci.cx + Math.sin(an) * r), z = Math.floor(ci.cz + Math.cos(an) * r); if (x < 4 || z < 4 || x > W - 5 || z > D - 5) continue;
      let y = H - 2; while (y > 2 && !world[idx(x, y, z)]) y--; let ok = true; for (let dx = -1; dx <= 1 && ok; dx++) for (let dz = -1; dz <= 1 && ok; dz++) { const j = idx(x + dx, y, z + dz); if (!okG(world[j]) || world[idx(x + dx, y + 1, z + dz)] || placedSet.has(j)) ok = false; }
      if (ok) return (s.t[k] = {x, y: y + 1, z, n: 0}); }
    return (s.t[k] = {none: 1}); }
  const RING = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
  function build(a) { const ci = a.ci; if (!ci || a.sleeping || isNight) return; const t = site(ci); if (t.none || t.n >= 8 * 8) return; const p = a.g.position, d = Math.hypot(t.x + .5 - p.x, t.z + .5 - p.z);
    if (d > 4.5) { if (!a.wp && !a.__task) { a.wp = [t.x + 2.5, t.z + .5]; a.wpT = 10; } return; }
    const lv = Math.floor(t.n / 8), c = RING[t.n % 8], x = t.x + c[0], y = t.y + lv, z = t.z + c[1], j = idx(x, y, z); if (y >= H - 2) { t.n = 99; return; }
    if (!world[j] && !placedSet.has(j) && !(Math.abs(x + .5 - P.x) < 0.9 && Math.abs(z + .5 - P.z) < 0.9)) { world[j] = lv === 7 ? (T.PLANKS || 10) : (lv === 3 && c[0] === 0 ? T.AIR : T.COBBLE); markDirty(x, z); try { rebuild(); } catch (_) {} a.swingT = 0.4; a.ang = Math.atan2(x + .5 - p.x, z + .5 - p.z); U.built++; }
    t.n++; }
  let tA = 0, tB = 0, tC = 0, builder = 0;
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { if (!started || paused || DIM.cur) return r; const t = now(), ph = PH(); const dosee = t - tA > (ph ? 0.8 : 0.5); if (dosee) tA = t; if (t - tC > 0.3) { tC = t; scanDrops(); }
      const s = BS(); if (s) s.pt += dt;
      for (const a of mobs) { if (!isC(a)) continue; const p = a.g.position, dP = Math.hypot(p.x - P.x, p.z - P.z);
        if (!a.__hd || !a.__hd.on) procFace(a); a.__c232m = (a.__hd && a.__hd.on) ? a.__c232hdm : a.__c232pm;
        const talk = (typeof AC !== 'undefined' && AC && a.__vT && a.__vT - 1.2 > AC.currentTime) || (a.dancing || (a.job && a.job.dance)); const ph2 = (a.__mph = (a.__mph || 0) + dt * (11 + Math.sin(t * 2.3) * 3));
        setMouth(a, talk ? 0.35 + 0.65 * Math.abs(Math.sin(ph2)) * (0.6 + 0.4 * Math.sin(ph2 * 0.37)) : 0);
        if (a.__rush && !mine.length) { a.__rush = 0; a.speedMul = 1; }
        if (dP < 40) { rush(a, dt); if (!window.__c234) unstick(a, dt); }
        if (dosee && dP < (ph ? 32 : 48)) look(a); }
      if (t - tB > 25) { tB = t; const cs = mobs.filter(isC).filter(a => a.ci && Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z) < 70); if (cs.length) build(cs[builder++ % cs.length]); }
      // the raid on the skeleton castles: after a good while in a world, they set off even if not fully geared
      const B = window.__bots; if (B && B.team && s && s.pt > 1200 && (B.team.phase === 'survive' || B.team.phase === 'mine') && B.ff) { B.ff('war'); U.raid++; s.raided = 1; }
    } catch (e) { ERR(e); }
    return r; };
  // the build site walk: keep walking there until close (wp is consumed elsewhere)
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && current && current.c232) d.c232 = current.c232; } catch (_) {} return d; }; } catch (e) { ERR(e); }
  try { const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && d.c232 && current) current.c232 = d.c232; } catch (_) {} return r; }; } catch (e) { ERR(e); }
  try { const ew = enterWorld; enterWorld = function (save) { if (!save && current) current.c232 = null; return ew.apply(this, arguments); }; } catch (e) { ERR(e); }
})();
