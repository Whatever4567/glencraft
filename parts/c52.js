
/* ===================== GLX-C52 (v0.9.47): black skeletons with a thin blade, skeletons aim with both arms, arrows that stick in you ===================== */
(function c52() {
  // ---- black skeleton: skeleton frame, sooty bone, a thin sharp sword, melee swing ----
  const bladeM = new THREE.MeshPhongMaterial({color: 0xd8dde4, shininess: 90, specular: 0xffffff}), hiltM = new THREE.MeshLambertMaterial({color: 0x2a1a10}), guardM = new THREE.MeshPhongMaterial({color: 0x8a7a50, shininess: 40});
  for (const m of [bladeM, hiltM, guardM]) m.userData.shared = true;
  function sword() { const g = new THREE.Group();
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.85, 0.012), bladeM); bl.position.y = 0.5; g.add(bl);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 4), bladeM); tip.position.y = 0.98; tip.rotation.y = Math.PI / 4; g.add(tip);
    const gd = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.04), guardM); gd.position.y = 0.07; g.add(gd);
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), hiltM); hl.position.y = -0.02; g.add(hl); return g; }
  const sm = spawnMob;
  spawnMob = function (kind) { if (kind !== 'blackskel') return sm.apply(this, arguments);
    const a = sm.call(this, 'skeleton'); if (!a) return null; a.kind = 'blackskel'; a.hp = a.maxHp = 9; a.speed = 1.5;
    if (a.bow) a.bow.visible = false; a.noBow = true;
    a.g.traverse(o => { if (o.isMesh && o.material) [].concat(o.material).forEach(m => { if (m && m.color && !(m.userData && m.userData.shared)) m.color.setHex(0x2b2b30); }); });
    const sw = sword(); sw.position.set(0, -0.68, 0.06); sw.rotation.x = Math.PI / 2; a.arms[1].add(sw); a.sword = sw; return a; };
  const um = updateMobs;
  updateMobs = function (dt) { const r = um.apply(this, arguments);
    for (const a of mobs) {
      if (a.kind === 'blackskel') { if (a.bow) a.bow.visible = false; const sw = a.swing > 0 ? a.swing / 0.45 : 0; a.swPh = sw;
        // raised guard, then a fast overhead-to-forward cut when it attacks
        const cut = sw > 0 ? Math.sin((1 - sw) * Math.PI) : 0, walk = Math.sin(a.walk || 0) * (a.moving ? 0.4 : 0.05);
        a.arms[1].rotation.set(-0.9 - cut * 1.7 + (sw > 0.6 ? -0.8 * (sw - 0.6) / 0.4 : 0), 0, -0.1 - cut * 0.2);
        a.arms[0].rotation.set(walk - 0.2, 0, 0.12); }
      else if (a.kind === 'skeleton' && a.bow) { // always aiming at you with both arms once you're in range
        const p = a.g.position, d = Math.hypot(P.x - p.x, P.z - p.z); if (d < 20 && !dead && (a.aggro > 0 || d < 14)) { const aim = Math.max(-0.6, Math.min(0.6, Math.atan2(P.y + 1.1 - (p.y + 1.4), Math.max(1, d)))); a.aimV = aim;
          a.arms[0].rotation.x = -1.5 - aim; a.arms[1].rotation.x = Math.min(a.arms[1].rotation.x, -1.2 - aim); a.bow.visible = true; if (!(a.aggro > 0)) a.ang = Math.atan2(P.x - p.x, P.z - p.z); } }
    }
    return r; };
  // ---- arrows: a real projectile that sticks where it hits you (arms or body), then falls away ----
  const stuck = []; window.__stuck = stuck;
  const arrowM = new THREE.MeshLambertMaterial({color: 0x5a3e28}), featherM = new THREE.MeshLambertMaterial({color: 0xe8e4dc}), headM = new THREE.MeshLambertMaterial({color: 0x6a6e74});
  function stuckArrow() { const g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.42), arrowM); sh.position.z = -0.2; g.add(sh);
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.06, 0.1), featherM); f.position.z = -0.38; g.add(f); const f2 = f.clone(); f2.rotation.z = Math.PI / 2; g.add(f2); return g; }
  function stick(ar) { const u = worldModel && worldModel.userData; if (!u) return;
    const p = ar.m.position, rel = p.y - P.y; const parts = [];
    if (rel > 0.75 && rel < 1.55) { parts.push(['torso', u.torso], ['armL', u.arms[0]], ['armR', u.arms[1]]); } else if (rel >= 1.55) parts.push(['armR', u.arms[1]], ['torso', u.torso]); else parts.push(['torso', u.torso]);
    const [name, part] = parts[(Math.random() * parts.length) | 0]; if (!part) return;
    worldModel.updateMatrixWorld(true); const g = stuckArrow(); const local = part.worldToLocal(p.clone()); const box = new THREE.Box3().setFromObject(part); const c = new THREE.Vector3(); box.getCenter(c);
    const lc = part.worldToLocal(c.clone()); local.lerp(lc, 0.55); g.position.copy(local);
    const dir = ar.v.clone().normalize(), q = new THREE.Quaternion(); part.getWorldQuaternion(q); const ld = dir.applyQuaternion(q.invert()); g.lookAt(g.position.clone().sub(ld)); part.add(g);
    let fp = null; if (name === 'armR' && !camMode) { fp = stuckArrow(); fp.position.set(0.05, 0.06, 0.05 + Math.random() * 0.2); fp.rotation.set(0.6, 0.8, 0); armPivot.add(fp); }
    stuck.push({g, part, fp, t: 0, name}); while (stuck.length > 8) { const s = stuck.shift(); s.part.remove(s.g); if (s.fp) armPivot.remove(s.fp); } }
  const ua = updateArrows;
  updateArrows = function (dt) {
    for (let i = arrows.length - 1; i >= 0; i--) { const ar = arrows[i], p = ar.m.position;
      const nx = p.x + ar.v.x * dt, ny = p.y + ar.v.y * dt, nz = p.z + ar.v.z * dt;
      // swept test against the player's body so a fast arrow can't skip through
      for (let s = 1; s <= 4; s++) { const k = s / 4, x = p.x + (nx - p.x) * k, y = p.y + (ny - p.y) * k, z = p.z + (nz - p.z) * k;
        if (Math.hypot(x - P.x, z - P.z) < 0.42 && y > P.y + 0.1 && y < P.y + HEIGHT) { p.set(x, y, z); try { stick(ar); } catch (_) {} hurt(3, 'Shot by a skeleton in the mist.'); const l = Math.hypot(ar.v.x, ar.v.z) || 1; knockPlayer(ar.v.x / l, ar.v.z / l, 3, 2); scene.remove(ar.m); arrows.splice(i, 1); break; } } }
    const r = ua.apply(this, arguments);
    for (let i = stuck.length - 1; i >= 0; i--) { const s = stuck[i]; s.t += dt; if (s.t > 25 || dead) { s.part.remove(s.g); if (s.fp) armPivot.remove(s.fp); stuck.splice(i, 1); } }
    return r; };
  window.__stick = stick;
})();
(function c52b() { const km = killMob; killMob = function (a) { if (a.kind !== 'blackskel') return km.apply(this, arguments); const p = a.g.position; burst(p.x, p.y + .8, p.z, 0x2b2b30, 16); dropItem(IT.BONE || 171, 1 + (Math.random() * 2 | 0), p.x, p.y + .5, p.z, 0, 3, 0, .4); if (Math.random() < .5) dropItem(IT.COAL, 1, p.x, p.y + .5, p.z, 1, 3, 0, .4); toast('Black skeleton defeated'); removeMob(a); }; })();
