/* ===================== GLX-C110 (v0.9.91): skeleton arrows hit mobs in the way; a shot giant spider slams the skeleton to bits ===================== */
(function c110() {
  const U = window.__c110 = {tag: 0, mobHits: 0, grabs: 0, smashed: 0, bones: []};
  const isSkel = m => m && m.g && (m.kind === 'skeleton' || m.kind === 'blackskel');
  // ---- tag each new skeleton arrow with the skeleton that fired it (the nearest one to where it starts) ----
  const ap = arrows.push.bind(arrows);
  arrows.push = function (...items) { for (const ar of items) { try { if (ar && ar.m && !ar.src) { const q = ar.m.position; let best = null, bd = 9; for (const m of mobs) if (isSkel(m)) { const p = m.g.position, d = (p.x - q.x) ** 2 + (p.z - q.z) ** 2 + (p.y + 1.2 - q.y) ** 2; if (d < bd) { bd = d; best = m; } } if (best) { ar.src = best; U.tag++; } } } catch (_) {} } return ap(...items); };
  // ---- swept arrow test against mobs (not the shooter) ----
  const ua = updateArrows;
  updateArrows = function (dt) {
    try { for (let i = arrows.length - 1; i >= 0; i--) { const ar = arrows[i]; if (!ar.src || !ar.m) continue; const p = ar.m.position, nx = p.x + ar.v.x * dt, ny = p.y + ar.v.y * dt, nz = p.z + ar.v.z * dt;
        let hit = null;
        for (const m of mobs) { if (m === ar.src || !m.g || m.dead || m.hp <= 0) continue; const q = m.g.position; if (Math.abs(q.x - p.x) > 8 || Math.abs(q.z - p.z) > 8) continue;
          const r = Math.max(0.35, (m.hitR || 0.5) * 0.75), top = q.y + Math.max(0.9, (m.hitY || 0.8) * 2);
          for (let s = 1; s <= 4; s++) { const k = s / 4, x = p.x + (nx - p.x) * k, y = p.y + (ny - p.y) * k, z = p.z + (nz - p.z) * k; if (Math.hypot(x - q.x, z - q.z) < r && y > q.y && y < top) { hit = m; break; } }
          if (hit) break; }
        if (!hit) continue;
        scene.remove(ar.m); arrows.splice(i, 1); U.mobHits++;
        try { damageMob(hit, 3, false); } catch (_) {}
        if (hit.kind === 'nspider' && hit.hp > 0 && mobs.indexOf(ar.src) >= 0) { hit.vic = ar.src; hit.vicT = 25; hit.aggro = 0; try { sfx3d('hiss', hit.g.position, 24); } catch (_) {} } } } catch (e) { if (!U.err) U.err = String(e && e.stack || e); }
    return ua.apply(this, arguments); };
  // ---- the grab and slam ----
  const fwd = new THREE.Vector3();
  U.grab = function (a, sk) { if (a.slam || !sk || !sk.g) return; const p = a.g.position, s = sk.g.position;
    // slam target: the nearest wall within 4 blocks around the skeleton, else the ground in front of the spider
    let best = null, bd = 99; for (let k = 0; k < 8; k++) { const an = k * Math.PI / 4, cx = Math.sin(an), cz = Math.cos(an);
      for (let r = 1; r <= 4; r++) { const x = s.x + cx * r, z = s.z + cz * r; if (solid(Math.floor(x), Math.floor(s.y + 1.2), Math.floor(z))) { if (r < bd) { bd = r; best = [s.x + cx * (r - 0.55), s.y + 1.0, s.z + cz * (r - 0.55)]; } break; } } }
    const fy = (() => { const x = Math.floor(s.x), z = Math.floor(s.z); for (let y = Math.floor(s.y + 0.5); y > 0 && y > s.y - 6; y--) if (solid(x, y - 1, z)) return y; return s.y; })();
    a.slam = {t: 0, sk, to: best || [s.x + Math.sin(a.yawVis) * 0.6, fy + 0.1, s.z + Math.cos(a.yawVis) * 0.6], wall: !!best}; sk.grabbed = true; U.grabs++;
    try { sfx3d('hiss', p, 26); } catch (_) {} };
  function smash(a) { const S = a.slam, sk = S.sk, q = sk.g.position.clone(); a.slam = null; a.vic = null; a.aggro = 0; a.timer = 1.5; a.moving = false;   // spider calms down
    try { burst(q.x, q.y + 0.8, q.z, 0xd8d5cc, 22, 1.2); } catch (_) {}
    const dP = Math.hypot(q.x - P.x, q.z - P.z); if (dP < 18) { try { shake(0.35 * (1 - dP / 18), 0.05); } catch (_) {} }
    try { sfx3d('thud', q, 30); } catch (_) {} clatter(q, 6);
    bones(q, a.g.position, sk);
    const t0 = toast; try { toast = () => {}; killMob(sk); } catch (_) {} finally { toast = t0; }
    U.smashed++; }
  function slamStep(a, dt) { const S = a.slam, sk = S.sk; if (!sk.g || mobs.indexOf(sk) < 0) { a.slam = null; a.vic = null; return; }
    S.t += dt; const p = a.g.position, G = a.gs || 1; fwd.set(Math.sin(a.yawVis), 0, Math.cos(a.yawVis));
    const hold = [p.x + fwd.x * 0.9 * G, p.y + 1.15 * G, p.z + fwd.z * 0.9 * G], s = sk.g.position;
    if (S.t < 0.5) { const k = Math.min(1, S.t / 0.3); s.set(s.x + (hold[0] - s.x) * k, s.y + (hold[1] - s.y) * k, s.z + (hold[2] - s.z) * k); sk.g.rotation.x = -0.5 * k; a.rig.rotation.x = -0.35 * k; }
    else { const k = Math.min(1, (S.t - 0.5) / 0.14), e = k * k; s.set(hold[0] + (S.to[0] - hold[0]) * e, hold[1] + (S.to[1] - hold[1]) * e, hold[2] + (S.to[2] - hold[2]) * e); sk.g.rotation.x = -0.5 + 1.6 * e; a.rig.rotation.x = -0.35 + 0.6 * e;
      if (k >= 1) smash(a); } }
  // ---- bone pieces with simple gravity + bounce ----
  let BM = null, BG = null;
  function bones(q, from, sk) { if (!BM) { BM = new THREE.MeshLambertMaterial({color: 0xe6e1d2}); BG = {skull: new THREE.BoxGeometry(0.42, 0.42, 0.42), rib: new THREE.BoxGeometry(0.5, 0.55, 0.26), pelvis: new THREE.BoxGeometry(0.42, 0.18, 0.22), arm: new THREE.BoxGeometry(0.11, 0.62, 0.11), leg: new THREE.BoxGeometry(0.13, 0.7, 0.13), spine: new THREE.BoxGeometry(0.1, 0.5, 0.1)}; }
    const out = new THREE.Vector3(q.x - from.x, 0, q.z - from.z); if (out.lengthSq() < 0.01) out.set(1, 0, 0); out.normalize();
    const parts = [['skull', 1.75], ['rib', 1.2], ['spine', 0.95], ['pelvis', 0.75], ['arm', 1.2], ['arm', 1.2], ['leg', 0.4], ['leg', 0.4]];
    while (U.bones.length > 24) { const b = U.bones.shift(); scene.remove(b.m); }
    for (const [k, h] of parts) { const m = new THREE.Mesh(BG[k], BM); m.position.set(q.x + (Math.random() - .5) * 0.4, q.y + h, q.z + (Math.random() - .5) * 0.4); m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); scene.add(m);
      const sp = 2 + Math.random() * 3.5, side = (Math.random() - .5) * 2;
      U.bones.push({m, vx: out.x * sp - out.z * side * 2, vy: 3 + Math.random() * 4, vz: out.z * sp + out.x * side * 2, wx: (Math.random() - .5) * 14, wy: (Math.random() - .5) * 14, wz: (Math.random() - .5) * 14, t: 0, hs: k === 'skull' ? 0.21 : k === 'rib' ? 0.2 : 0.08, bn: 0}); } }
  let clT = 0;
  function clatter(q, n) { const d = Math.hypot(q.x - P.x, q.z - P.z); if (d > 28) return; const v = Math.pow(1 - d / 28, 1.3);
    for (let i = 0; i < n; i++) setTimeout(() => { try { sfx('break', v * (0.5 + Math.random() * 0.4), Math.random() < 0.5 ? 'wood' : 'stone'); } catch (_) {} }, i * (35 + Math.random() * 45)); }
  function boneStep(dt) { clT -= dt; for (let i = U.bones.length - 1; i >= 0; i--) { const b = U.bones[i], m = b.m, p = m.position; b.t += dt;
      if (b.t > 5) { const k = 1 - (b.t - 5) / 0.5; if (k <= 0) { scene.remove(m); U.bones.splice(i, 1); continue; } m.scale.setScalar(k); }
      if (b.rest) continue;
      b.vy -= 22 * dt; const nx = p.x + b.vx * dt, nz = p.z + b.vz * dt;
      if (solid(Math.floor(nx), Math.floor(p.y), Math.floor(p.z))) b.vx *= -0.4; else p.x = nx;
      if (solid(Math.floor(p.x), Math.floor(p.y), Math.floor(nz))) b.vz *= -0.4; else p.z = nz;
      p.y += b.vy * dt; m.rotation.x += b.wx * dt; m.rotation.y += b.wy * dt; m.rotation.z += b.wz * dt;
      const fl = Math.floor(p.y - b.hs); if (b.vy < 0 && solid(Math.floor(p.x), fl, Math.floor(p.z))) { p.y = fl + 1 + b.hs; b.vy = -b.vy * 0.38; b.vx *= 0.6; b.vz *= 0.6; b.wx *= 0.5; b.wy *= 0.5; b.wz *= 0.5; b.bn++;
        if (b.bn <= 2 && clT <= 0) { clT = 0.06; clatter(p, 1); }
        if (Math.abs(b.vy) < 0.9) { b.vy = 0; if (Math.hypot(b.vx, b.vz) < 0.4) b.rest = true; } } } }
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { if (!paused) { for (const a of mobs) if (a.slam) slamStep(a, dt); boneStep(dt); } } catch (e) { if (!U.err) U.err = String(e && e.stack || e); }
    return r; };
})();
