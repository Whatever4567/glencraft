/* GLX-GORE (v1.1.54): DEATHS THAT STAY. Any kill now drops the body instead of making it vanish: animals and people topple in the
   direction the hit came from, legs and arms go limp, and the body settles on the ground with a wound mark where the shot went in.
   A dark pool spreads under it and a few drops land around it; a gun kill next to a wall splats the wall. Skeletons have no blood:
   they fall apart into a heap of bones. Bodies stay for minutes (oldest fade first, at most 16, 8 on phones). Drops still fall as before.
   Bullets now hit things properly: sparks off stone and metal, dust off dirt, sand and wood, a bullet hole left on the block, and a
   blood puff when a shot hits an animal (bone chips for skeletons). Treemen now wake at oak trees: at night there is a chance one
   steps out beside an oak near you. */
(function gore() {
  const U = window.__gore = {err: null, corpses: 0, bones: 0, decals: 0, sparks: 0, dust: 0, puffs: 0, holes: 0, oak: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const CAP = () => (typeof PERF !== 'undefined' && PERF) ? 8 : 16, LIFE = 240, DCAP = 70, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const SKEL = a => /skel|bone/i.test(a.kind || ''), NOBLOOD = a => SKEL(a) || /treeman|bee|ghost|wisp|golem|puffer/i.test(a.kind || '');
  const SKIP = a => /treeman|bee/i.test(a.kind || '') || !a.g;
  const bloodCol = a => /zombie|creeper/i.test(a.kind || '') ? 0x3a2a12 : /spider/i.test(a.kind || '') ? 0x4a5a18 : 0x6a0a08;
  // ---- textures drawn once ----
  function cv(draw) { const c = document.createElement('canvas'); c.width = c.height = 64; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); return t; }
  const TS = cv(g => { g.fillStyle = '#fff'; for (let i = 0; i < 14; i++) { const r = 4 + Math.random() * 10, a = Math.random() * 6.28, d = Math.random() * 16; g.beginPath(); g.arc(32 + Math.cos(a) * d, 32 + Math.sin(a) * d, r, 0, 7); g.fill(); } g.beginPath(); g.arc(32, 32, 15, 0, 7); g.fill(); });
  const TH = cv(g => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 30); r.addColorStop(0, 'rgba(10,8,6,1)'); r.addColorStop(0.35, 'rgba(25,20,16,0.95)'); r.addColorStop(0.6, 'rgba(60,50,40,0.5)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  const PG = new THREE.PlaneGeometry(1, 1), BG = new THREE.BoxGeometry(1, 1, 1), decals = [], corpses = [], fx = [];
  function dmat(tex, col, op) { return new THREE.MeshLambertMaterial({map: tex, color: col, transparent: true, opacity: op, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2}); }
  function decal(x, y, z, n, size, tex, col, op, life, parent) { const m = new THREE.Mesh(PG, dmat(tex, col, op)); m.scale.setScalar(size); m.position.set(x, y, z).addScaledVector(n, 0.012);
    m.quaternion.setFromUnitVectors(V(0, 0, 1), n); m.rotateZ(Math.random() * 6.28); m.renderOrder = 2; (parent || scene).add(m); if (parent) return m;
    decals.push({m, t: 0, life, op}); while (decals.length > DCAP) kill(decals.shift().m); U.decals = decals.length; return m; }
  function kill(o) { if (!o) return; if (o.parent) o.parent.remove(o); o.traverse(c => { if (c.material && c.material.map !== TS && c.material.map !== TH) { try { c.material.dispose(); } catch (_) {} } else if (c.material) c.material.dispose(); }); }
  const sol = (x, y, z) => { try { return solid(Math.floor(x), Math.floor(y), Math.floor(z)); } catch (_) { return false; } };
  function groundY(x, y, z) { for (let k = 0; k < 12; k++) { if (sol(x, y - 0.05 - k, z)) return Math.floor(y - 0.05 - k) + 1; } return y - 1; }
  // ---- particles: sparks, dust, blood puffs ----
  function spray(p, n, col, sp, up, life, size, grav, glow) { const mat = glow ? new THREE.MeshBasicMaterial({color: col, fog: false}) : new THREE.MeshLambertMaterial({color: col});
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(BG, mat); m.scale.setScalar(size * (0.6 + Math.random() * 0.8)); m.position.copy(p); scene.add(m);
      const v = V(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(sp * (0.4 + Math.random())).addScaledVector(up, sp * 0.8); fx.push({m, v, t: 0, life: life * (0.6 + Math.random() * 0.7), grav, mat, last: i === n - 1}); } }
  // ---- hit tracking: which way the last blow came from, and was it a bullet ----
  let shot = null;
  try { const fg = fireGun; fireGun = function (id) { const d = lookDir(), o = V(P.x, P.y + EYE, P.z); shot = {t: performance.now(), d: V(d[0], d[1], d[2]), o, hit: null}; const r = fg.apply(this, arguments);
      try { if (!shot.hit) impact(o, shot.d, (GUN[id] && GUN[id].range) || 60); } catch (e) { ERR('imp', e); } shot = null; return r; }; } catch (e) { ERR('fg', e); }
  try { const dm = damageMob; damageMob = function (a, dmg, byPlayer) { try { if (a && a.g) { const p = a.g.position, hy = a.hitY || 0.8; if (shot) { shot.hit = a; a.__hd = shot.d.clone(); a.__hd.y = 0; a.__gun = 1;
          const hp = V(p.x, p.y + hy, p.z); if (NOBLOOD(a)) spray(hp, 5, SKEL(a) ? 0xe8e2cc : 0x6a5a40, 2.2, V(0, 0.3, 0), 0.5, 0.05, true); else spray(hp.addScaledVector(shot.d, -0.25), 9, bloodCol(a), 2.4, shot.d.clone().multiplyScalar(-0.6), 0.55, 0.06, true); U.puffs++; a.__hp = V(0, hy, 0); }
        else if (byPlayer) { a.__hd = V(p.x - P.x, 0, p.z - P.z); a.__gun = 0; } } } catch (e) { ERR('dm', e); } return dm.apply(this, arguments); }; } catch (e) { ERR('dmw', e); }
  function impact(o, d, range) { let t = range, prev = null, cell = null; for (let s = 0.3; s < range; s += 0.08) { const x = o.x + d.x * s, y = o.y + d.y * s, z = o.z + d.z * s; const c = [Math.floor(x), Math.floor(y), Math.floor(z)];
      if (sol(x, y, z)) { t = s; cell = c; break; } prev = c; } if (!cell || !prev) return;
    const n = V(prev[0] - cell[0], prev[1] - cell[1], prev[2] - cell[2]); if (n.lengthSq() !== 1) { const ax = Math.abs(d.x) > Math.abs(d.y) ? (Math.abs(d.x) > Math.abs(d.z) ? 0 : 2) : (Math.abs(d.y) > Math.abs(d.z) ? 1 : 2); n.set(0, 0, 0).setComponent(ax, -Math.sign(d.getComponent(ax))); }
    const p = o.clone().addScaledVector(d, t); const ax = Math.abs(n.x) ? 'x' : Math.abs(n.y) ? 'y' : 'z'; p[ax] = cell[ax === 'x' ? 0 : ax === 'y' ? 1 : 2] + (n[ax] > 0 ? 1 : 0);
    let b = 0; try { b = getB(cell[0], cell[1], cell[2]); } catch (_) {} const mt = typeof matOf === 'function' ? matOf(b) : 'stone';
    if (mt === 'stone' || mt === 'metal' || mt === 'glass') { spray(p, mt === 'metal' ? 10 : 7, 0xffd27a, 5.5, n, 0.22, 0.025, true, true); spray(p, 3, 0x9a968c, 1.2, n, 0.6, 0.05, false); U.sparks++; }
    else { const col = mt === 'wood' ? 0x8a6a42 : mt === 'sand' ? 0xd8c890 : mt === 'leaves' ? 0x4a7a32 : mt === 'grass' ? 0x6a8a42 : 0x6a5038; spray(p, 9, col, 1.6, n, 0.8, 0.06, true); U.dust++; }
    if (mt !== 'leaves' && mt !== 'glass' && mt !== 'wool') { decal(p.x, p.y, p.z, n, 0.16, TH, 0xffffff, 0.95, 90); U.holes++; } }
  // ---- deaths ----
  try { const km = killMob; killMob = function (a) { if (a && !SKIP(a)) a.__gk = 1; try { return km.apply(this, arguments); } finally { if (a) a.__gk = 0; } }; } catch (e) { ERR('km', e); }
  try { const rm = removeMob; removeMob = function (a) { if (!a || !a.__gk || SKIP(a)) return rm.apply(this, arguments); a.__gk = 0; try { corpse(a); return; } catch (e) { ERR('corpse', e); } return rm.apply(this, arguments); }; } catch (e) { ERR('rm', e); }
  function corpse(a) { const i = mobs.indexOf(a); if (i >= 0) mobs.splice(i, 1); if (typeof heldBy !== 'undefined' && heldBy === a) heldBy = null;
    const g = a.g; g.traverse(o => { if (o.isSprite || o.isPoints) o.visible = false; }); const p = g.position, gy = groundY(p.x, p.y + 0.3, p.z);
    let dir = a.__hd && a.__hd.lengthSq() > 1e-4 ? a.__hd.clone().normalize() : V(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(); const gun = !!a.__gun;
    if (SKEL(a)) return bones(a, dir, gy);
    const biped = (a.legs ? a.legs.length : 0) === 2 && (a.arms ? a.arms.length : 0) >= 2 && !/sheep|haggis|duck|spider|puffer|cow|deer|dog|horse|pig/i.test(a.kind || '');
    const fwd = V(Math.sin(a.g.rotation.y), 0, Math.cos(a.g.rotation.y)), side = V(0, 1, 0).cross(dir).normalize();  // animals roll onto their side, people fall back the way the shot pushes
    const C = {a, g, kind: 'body', t: 0, dir, axis: biped ? side : fwd.multiplyScalar(fwd.clone().cross(V(0, 1, 0)).dot(dir) > 0 ? 1 : -1), ang: 0, w: gun ? 2.5 : 1.2, slide: gun ? 1.6 : 0.6, gy, q0: g.quaternion.clone(), pooled: 0, blood: !NOBLOOD(a), col: bloodCol(a), settle: 0};
    if (C.blood && a.__hp) { const w = g.localToWorld(a.__hp.clone()), n = dir.clone().negate(); const lp = g.worldToLocal(w.clone().addScaledVector(n, 0.2)); decal(lp.x, lp.y, lp.z, V(0, 0, 1).applyQuaternion(g.quaternion.clone().invert().multiply(new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), n))), 0.22, TS, C.col, 0.95, 0, g); }
    if (C.blood && gun) { const hp = V(p.x, p.y + (a.hitY || 0.8), p.z); for (let s = 0.4; s < 2.6; s += 0.2) { const q = hp.clone().addScaledVector(dir, s); if (sol(q.x, q.y, q.z)) { const n = dir.clone().negate(), ax = Math.abs(dir.x) > Math.abs(dir.z) ? 'x' : 'z'; n.set(0, 0, 0); n[ax] = -Math.sign(dir[ax]); q[ax] = Math.floor(q[ax]) + (n[ax] > 0 ? 1 : 0); decal(q.x, q.y, q.z, n, 0.7 + Math.random() * 0.4, TS, C.col, 0.9, LIFE); break; } } }
    const lim = [].concat(a.legs || [], a.arms || []); C.limbs = lim.filter(l => l && l.rotation).map(l => ({l, x: (Math.random() - 0.5) * 1.2, z: (Math.random() - 0.5) * 0.8}));
    corpses.push(C); cap(); U.corpses = corpses.length; }
  function bones(a, dir, gy) { const g = a.g; g.updateMatrixWorld(true); const ms = []; g.traverse(o => { if (o.isMesh && o.visible) ms.push(o); });
    const C = {a, g: new THREE.Group(), kind: 'bones', t: 0, gy, pcs: []}; scene.add(C.g);
    const bm = (ms[0] && (Array.isArray(ms[0].material) ? ms[0].material[0] : ms[0].material)) || new THREE.MeshLambertMaterial({color: 0xe8e2cc}), p0 = g.position;  // extra loose bones and a skull so it reads as a heap
    for (let k = 0; k < 16; k++) { const m = new THREE.Mesh(BG, bm); const sk = k === 0, rib = k === 1 || k === 2; m.scale.set(sk ? 0.3 : rib ? 0.34 : 0.1, sk ? 0.3 : rib ? 0.08 : 0.1, sk ? 0.3 : rib ? 0.22 : 0.34 + Math.random() * 0.25); m.position.set(p0.x + (Math.random() - 0.5) * 0.4, p0.y + 0.4 + Math.random() * 1.2, p0.z + (Math.random() - 0.5) * 0.4); m.rotation.y = Math.random() * 6.28; C.g.add(m);
      C.pcs.push({m, v: V((Math.random() - 0.5) * 2.5 + dir.x, Math.random() * 2, (Math.random() - 0.5) * 2.5 + dir.z), w: V(Math.random() - 0.5, 0, Math.random() - 0.5).multiplyScalar(8), rest: 0}); }
    scene.remove(g); spray(V(g.position.x, gy + 0.6, g.position.z), 8, 0xe8e2cc, 1.5, V(0, 1, 0), 0.6, 0.05, true); corpses.push(C); cap(); U.bones++; U.corpses = corpses.length; }
  function cap() { while (corpses.length > CAP()) { const c = corpses.find(c => !c.fade) || corpses[0]; if (c.fade) { drop(c); } else c.fade = 1; if (corpses.filter(c => !c.fade).length <= CAP()) break; } }
  function drop(c) { const i = corpses.indexOf(c); if (i >= 0) corpses.splice(i, 1); kill(c.g); if (c.pool) kill(c.pool); try { (c.a.mats || []).forEach(m => m.dispose()); } catch (_) {} U.corpses = corpses.length; }
  function fadeMats(o, k) { o.traverse(c => { if (!c.material) return; if (!c.userData.gfm) { c.material = c.material.clone(); c.material.transparent = true; c.userData.gfm = 1; c.userData.op = c.material.opacity; } c.material.opacity = c.userData.op * k; }); }
  // ---- per frame ----
  let last = performance.now();
  function tick() { requestAnimationFrame(tick); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; try { step(dt); } catch (e) { ERR('tick', e); } }
  function step(dt) {
    for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.t += dt; if (f.grav) f.v.y -= 14 * dt; f.m.position.addScaledVector(f.v, dt); if (sol(f.m.position.x, f.m.position.y, f.m.position.z)) { f.v.multiplyScalar(-0.25); f.m.position.addScaledVector(f.v, dt * 2); }
      if (f.t > f.life) { scene.remove(f.m); if (f.last) f.mat.dispose(); fx.splice(i, 1); } }
    for (let i = decals.length - 1; i >= 0; i--) { const d = decals[i]; d.t += dt; if (d.life && d.t > d.life) { const k = 1 - (d.t - d.life) / 4; if (k <= 0) { kill(d.m); decals.splice(i, 1); continue; } d.m.material.opacity = d.op * k; } } U.decals = decals.length;
    for (let i = corpses.length - 1; i >= 0; i--) { const c = corpses[i]; c.t += dt; if (c.t > LIFE && !c.fade) c.fade = 1;
      if (c.fade) { c.fade = Math.max(0.001, c.fade - dt / 4); fadeMats(c.g, c.fade); if (c.pool) c.pool.material.opacity = 0.85 * c.fade; if (c.fade <= 0.001) { drop(c); continue; } }
      if (c.kind === 'bones') { for (const b of c.pcs) { if (b.rest) continue; b.v.y -= 14 * dt; b.m.position.addScaledVector(b.v, dt); b.m.rotation.x += b.w.x * dt; b.m.rotation.z += b.w.z * dt;
          if (b.m.position.y < c.gy + 0.06) { b.m.position.y = c.gy + 0.06; b.v.y *= -0.3; b.v.x *= 0.5; b.v.z *= 0.5; b.w.multiplyScalar(0.5); if (Math.abs(b.v.y) < 0.4) { b.rest = 1; b.m.rotation.x = Math.round(b.m.rotation.x / 1.5708) * 1.5708 + (Math.random() - 0.5) * 0.3; } } } continue; }
      if (c.settle < 1) { c.w += 7 * dt; c.ang = Math.min(Math.PI / 2, c.ang + c.w * dt); c.slide *= Math.exp(-dt * 5); c.g.position.addScaledVector(c.dir, c.slide * dt);
        c.g.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(c.axis, c.ang).multiply(c.q0)); for (const L of c.limbs) { L.l.rotation.x += (L.x - L.l.rotation.x) * Math.min(1, dt * 6); L.l.rotation.z += (L.z - L.l.rotation.z) * Math.min(1, dt * 6); }
        const bx = new THREE.Box3().setFromObject(c.g); c.g.position.y += (c.gy + 0.02 - bx.min.y) * Math.min(1, dt * 18);
        if (c.ang >= Math.PI / 2) { c.settle = Math.min(1, c.settle + dt * 3); if (c.settle >= 1 && c.blood && !c.pool) { const p = c.g.position, cy = bx.getCenter(V(0, 0, 0)); c.pool = decal(cy.x, c.gy, cy.z, V(0, 1, 0), 0.1, TS, c.col, 0.85, 0); decals.pop(); c.pool.userData.k = 0;
            for (let k = 0; k < 4; k++) { const r = 0.5 + Math.random() * 0.9, an = Math.random() * 6.28; decal(cy.x + Math.cos(an) * r, groundY(cy.x + Math.cos(an) * r, c.gy + 0.5, cy.z + Math.sin(an) * r), cy.z + Math.sin(an) * r, V(0, 1, 0), 0.12 + Math.random() * 0.15, TS, c.col, 0.85, LIFE); } } } }
      if (c.pool && c.pool.userData.k < 1) { c.pool.userData.k = Math.min(1, c.pool.userData.k + dt / 5); c.pool.scale.setScalar(0.2 + 1.3 * Math.sqrt(c.pool.userData.k)); } } }
  requestAnimationFrame(tick);
  // ---- treemen step out beside oak trees at night ----
  function oakSpot() { const OAK = T.LOG; for (let tries = 0; tries < 80; tries++) { const an = Math.random() * 6.28, r = 14 + Math.random() * 26, tx = Math.floor(P.x + Math.cos(an) * r), tz = Math.floor(P.z + Math.sin(an) * r);
      let ty = -1; for (let y = Math.floor(P.y) + 16; y > Math.floor(P.y) - 16; y--) { let b = 0; try { b = getB(tx, y, tz); } catch (_) {} if (b === OAK) { let yy = y; while (getB(tx, yy - 1, tz) === OAK) yy--; if (solid(tx, yy - 1, tz)) ty = yy; break; } if (b && !LEAFY[b] && !isPlant(b)) break; }
      if (ty < 0) continue; for (let k = 0; k < 8; k++) { const a2 = Math.random() * 6.28, cx = Math.floor(tx + 0.5 + Math.sin(a2) * 3), cz = Math.floor(tz + 0.5 + Math.cos(a2) * 3); let fy = -1; for (let y = ty + 2; y >= ty - 3; y--) if (solid(cx, y, cz)) { fy = y + 1; break; }
        if (fy < 0 || LEAFY[getB(cx, fy - 1, cz)]) continue; let ok = true; for (let q = 0; q < 4; q++) { const b = getB(cx, fy + q, cz); if (b !== T.AIR && !isPlant(b)) ok = false; } if (!ok || Math.hypot(cx - P.x, cz - P.z) < 12) continue;
        if (mobs.some(m => m.kind === 'treeman' && Math.hypot(m.g.position.x - cx, m.g.position.z - cz) < 6)) continue; U.oak++; return [cx + 0.5, fy, cz + 0.5, tx + 0.5, tz + 0.5]; } } return null; }
  try { findTreeSpot = oakSpot; } catch (e) { ERR('fts', e); }
  setInterval(() => { try { if (!started || !isNight || (typeof DIM !== 'undefined' && DIM.cur)) return; if (Math.random() < 0.12 && countKind('treeman') < MAX_TREEMEN) spawnMob('treeman'); } catch (e) { ERR('tm', e); } }, 20000);
  U.test = { corpse: a => { a.__gk = 1; removeMob(a); }, impact: (o, d) => impact(V(...o), V(...d).normalize(), 60), list: () => corpses.map(c => c.kind + (c.pcs ? "#" + c.pcs.length + "r" + c.pcs.filter(b => b.rest).length + "y" + (c.pcs[0] ? c.pcs[0].m.position.y.toFixed(1) : "") + "gy" + c.gy : "") + ":" + [c.g.position.x, c.g.position.y, c.g.position.z].map(v => v.toFixed(1)).join(",")) };
})();
