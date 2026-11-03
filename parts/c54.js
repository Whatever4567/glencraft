
/* ===================== GLX-C54 (v0.9.49): many cave entrances winding down to big open caverns; deepslate-cobble caves by the bedrock with a wall-crawling horror ===================== */
(function c54() {
  const DSC = 249; T.DSCOBBLE = DSC;
  { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#2c2c33'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++) { const x = Math.random() * 256, y = Math.random() * 256, r = 14 + Math.random() * 26, v = 38 + Math.random() * 30 | 0; g.fillStyle = `rgb(${v},${v},${v + 8})`; g.beginPath(); g.ellipse(x, y, r, r * 0.75, Math.random() * 3, 0, 7); g.fill(); g.strokeStyle = '#18181c'; g.lineWidth = 4; g.stroke(); }
    TEX.ds_cobble = c.toDataURL(); }
  NAMES[DSC] = 'Deepslate cobble'; FACES[DSC] = 'ds_cobble'; ICON_KEY[DSC] = 'ds_cobble'; BLOCK_MATS[DSC] = mat('ds_cobble'); HARD[DSC] = 2.2; MC_HARD[DSC] = 2.2; REQ[DSC] = 1; PLACEABLE.add(DSC);
  try { __NAT[DSC] = 1; } catch (_) {} if (!ORDER.includes(DSC)) ORDER.push(DSC);
  const isNew = () => current && current.mode !== 'creative' && (current.created > NEW_CASTLES_AT || current.newCastles);
  window.__deepCaves = [];
  function carveCaves() {
    if (!isNew() || DIM.cur || genVer !== GEN9 || W < 200) return null;
    let sd = (gSeed ^ 0x2c1b3c6d) >>> 0 || 7; const rnd = () => (sd = (Math.imul(sd, 16807) >>> 0) % 2147483647) / 2147483647;
    const soft = b => b === T.STONE || b === T.DIRT || b === T.DEEPSLATE || b === T.GRASS || b === T.HEATHER || b === T.SAND || b === T.PEAT || b === T.MUD || b === T.GRAVEL || b === T.COALORE || b === T.IRONORE || b === T.COPPERORE || b === T.GOLDORE || b === T.REDORE || b === T.DIAMONDORE || b === T.COBBLE || b === T.LAVA;
    const wet = (x, y, z) => world[idx(x, y + 1, z)] === T.WATER || world[idx(x + 1, y, z)] === T.WATER || world[idx(x - 1, y, z)] === T.WATER || world[idx(x, y, z + 1)] === T.WATER || world[idx(x, y, z - 1)] === T.WATER;
    const ball = (cx, cy, cz, r, ry, minY) => { const R = Math.ceil(r), Ry = Math.ceil(ry);
      for (let x = Math.max(3, Math.floor(cx - R)); x <= Math.min(W - 4, cx + R); x++) for (let z = Math.max(3, Math.floor(cz - R)); z <= Math.min(D - 4, cz + R); z++) for (let y = Math.max(minY || 3, Math.floor(cy - Ry)); y <= Math.min(H - 3, cy + Ry); y++) {
        const dx = (x - cx) / r, dy = (y - cy) / ry, dz = (z - cz) / r; if (dx * dx + dy * dy + dz * dz > 1) continue; const i = idx(x, y, z); if (!soft(world[i]) || wet(x, y, z)) continue; if (placedSet && placedSet.has(i)) continue; world[i] = T.AIR; } };
    const away = (x, z) => g9castles.every(c => Math.hypot(c[1] - x, c[2] - z) > 34);
    const st = {entrances: 0, caverns: 0, deep: 0};
    const nE = Math.max(12, Math.round(W * D / 9000));
    for (let n = 0, t = 0; n < nE && t < nE * 20; t++) {
      const x0 = 12 + rnd() * (W - 24), z0 = 12 + rnd() * (D - 24); if (!away(x0, z0)) continue; const top = solidTop(Math.floor(x0), Math.floor(z0)); if (top <= SEA + 2 || world[idx(Math.floor(x0), top, Math.floor(z0))] === T.WATER) continue;
      // the path: a winding tunnel stepping down at a walkable slope into a big open cavern
      let x = x0, y = top + 1, z = z0, yaw = rnd() * 6.283; const floorY = 14 + rnd() * 14;
      for (let k = 0; k < 220 && y > floorY; k++) { const r = 1.9 + Math.sin(k * 0.3) * 0.35; ball(x, y, z, r, r * 1.15);
        yaw += (rnd() - 0.5) * 0.35; x += Math.cos(yaw) * 0.85; z += Math.sin(yaw) * 0.85; y -= 0.42; if (x < 12 || z < 12 || x > W - 12 || z > D - 12) { yaw += Math.PI; x = Math.max(13, Math.min(W - 13, x)); z = Math.max(13, Math.min(D - 13, z)); } }
      const r = 9 + rnd() * 6; ball(x + Math.cos(yaw) * r * 0.6, y + 2, z + Math.sin(yaw) * r * 0.6, r, 5 + rnd() * 3); st.caverns++;
      // a couple of side galleries off the cavern
      for (let g = 0; g < 2; g++) { let gx = x, gz = z, gy = y + 1, gyaw = rnd() * 6.283; for (let k = 0; k < 40; k++) { ball(gx, gy, gz, 2.2, 2); gyaw += (rnd() - .5) * 0.4; gx += Math.cos(gyaw); gz += Math.sin(gyaw); gy += (rnd() - 0.5) * 0.4; if (gx < 10 || gz < 10 || gx > W - 10 || gz > D - 10) break; } }
      st.entrances++; n++; }
    // deep caverns by the bedrock, walls of deepslate cobble
    const deep = []; const nD = 3;
    for (let n = 0, t = 0; n < nD && t < 200; t++) { const cx = 30 + rnd() * (W - 60), cz = 30 + rnd() * (D - 60); if (deep.some(d => Math.hypot(d[0] - cx, d[2] - cz) < 60)) continue;
      const cy = 9, r = 11 + rnd() * 5, ry = 5.5; ball(cx, cy, cz, r, ry, 3);
      for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) for (let z = Math.floor(cz - r - 2); z <= cz + r + 2; z++) for (let y = 2; y <= cy + ry + 2; y++) { if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) continue; const i = idx(x, y, z), b = world[i]; if (!b || b === T.WATER) continue;
        if (b === T.LAVA) { world[i] = T.AIR; continue; } const nearAir = !world[idx(x + 1, y, z)] || !world[idx(x - 1, y, z)] || !world[idx(x, y + 1, z)] || !world[idx(x, y - 1, z)] || !world[idx(x, y, z + 1)] || !world[idx(x, y, z - 1)];
        if (nearAir && y > 1 && Math.hypot(x - cx, z - cz) < r + 2) world[i] = DSC; }
      // and a long sloping shaft linking it up to the nearest open cave
      let x = cx, y = cy + 2, z = cz, yaw = rnd() * 6.283; for (let k = 0; k < 90 && y < 26; k++) { ball(x, y, z, 2, 2.2); yaw += (rnd() - .5) * 0.3; x += Math.cos(yaw) * 0.9; z += Math.sin(yaw) * 0.9; y += 0.4; if (x < 10 || z < 10 || x > W - 10 || z > D - 10) yaw += Math.PI; }
      deep.push([cx, cy, cz, r]); st.deep++; }
    window.__deepCaves = deep; return st; }
  const ge = generate; generate = function () { const r = ge.apply(this, arguments); try { const was = c37busy; c37busy = true; window.__c54 = carveCaves(); c37busy = was; } catch (e) { console.warn('c54', e); } return r; };
  const se = serialize; serialize = function () { const d = se.apply(this, arguments); d.deepCaves = window.__deepCaves; return d; };
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); window.__deepCaves = (d && d.deepCaves) || []; return r; };
  // ---- the crawler: a big pale-eyed thing that clings to walls and ceilings ----
  const crawlers = () => mobs.filter(a => a.kind === 'crawler');
  function makeCrawler() { const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
    const skin = new THREE.MeshLambertMaterial({color: 0x1c1a20}), pale = new THREE.MeshLambertMaterial({color: 0x6a6470}), eye = new THREE.MeshBasicMaterial({color: 0xe8f0ff});
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 1.8), skin); body.position.y = 0.45; rig.add(body);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 1.2), pale); back.position.set(0, 0.75, 0.2); rig.add(back);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.7), skin); head.position.set(0, 0.5, -1.15); rig.add(head);
    for (const [x, y] of [[-0.22, 0.12], [0.22, 0.12], [-0.12, -0.05], [0.12, -0.05], [-0.3, -0.08], [0.3, -0.08]]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.02), eye); e.position.set(x, y, -0.36); head.add(e); }
    const legs = []; for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(s * 0.5, 0.45, -0.6 + i * 0.45); rig.add(piv);
      const up = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.12), skin); up.position.x = s * 0.45; up.rotation.z = s * 0.5; piv.add(up);
      const lo = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), pale); lo.position.set(s * 0.9, -0.2, 0); piv.add(lo); legs.push(piv); }
    return {g, rig, head, legs: [], arms: [], cLegs: legs, mats: [skin, pale, eye], speed: 2.6, hp: 40, hitY: 0.6, hitR: 1.2, tall: 1}; }
  function newCrawler(cave) { const a = makeCrawler(); const [cx, cy, cz] = cave; Object.assign(a, {kind: 'crawler', hostile: true, named: true, flee: 0, angry: 0, biteCd: 0, moving: true, ang: 0, timer: 0, flash: 0, kbx: 0, kbz: 0, vy: 0, onGround: true, burning: 0, fire: 0, fireTick: 0, walk: 0, sndT: 3, cave, tgt: null, nrm: new THREE.Vector3(0, 1, 0), crHp: 40});
    a.g.position.set(cx, cy - 4, cz); scene.add(a.g); mobs.push(a); return a; }
  window.newCrawler = newCrawler;
  const isAir = (x, y, z) => !world[idx(x, y, z)];
  function surfacePoint(cx, cy, cz, r) { for (let t = 0; t < 60; t++) { const x = Math.floor(cx + (Math.random() - .5) * r * 2), z = Math.floor(cz + (Math.random() - .5) * r * 2), y = Math.floor(cy + (Math.random() - .5) * 12); if (y < 2 || y >= H - 2) continue;
      if (!isAir(x, y, z)) continue; const n = [[0, -1, 0], [0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]].filter(([a, b, c]) => !isAir(x + a, y + b, z + c)); if (!n.length) continue;
      const [a, b, c] = n[(Math.random() * n.length) | 0]; return {p: new THREE.Vector3(x + .5 + a * 0.25, y + .5 + b * 0.25, z + .5 + c * 0.25), n: new THREE.Vector3(-a, -b, -c)}; } return null; }
  function stepCrawler(a, dt) { const p = a.g.position; a.walk += dt; a.biteCd -= dt;
    const dP = Math.hypot(P.x - p.x, P.y + 1 - p.y, P.z - p.z), hunt = dP < 14 && !dead;
    if (!a.tgt || p.distanceTo(a.tgt.p) < 0.4 || (a.timer -= dt) <= 0) { a.timer = 3; a.tgt = hunt ? (surfacePoint(P.x, P.y + 1, P.z, 3) || surfacePoint(a.cave[0], a.cave[1], a.cave[2], a.cave[3])) : surfacePoint(a.cave[0], a.cave[1], a.cave[2], a.cave[3]); }
    if (a.tgt) { const d = a.tgt.p.clone().sub(p), L = d.length(); const sp = (hunt ? 3.4 : 1.6) * dt; if (L > 0.01) p.addScaledVector(d, Math.min(1, sp / L));
      a.nrm.lerp(a.tgt.n, Math.min(1, dt * 3)).normalize();
      // body belly-down on whatever surface it clings to: floor, wall or ceiling
      const up = a.nrm, fwd = L > 0.01 ? d.clone().normalize() : new THREE.Vector3(0, 0, -1); fwd.addScaledVector(up, -fwd.dot(up)); if (fwd.lengthSq() < 1e-4) fwd.set(1, 0, 0); fwd.normalize();
      const right = new THREE.Vector3().crossVectors(up, fwd.clone().negate()).normalize(); const m = new THREE.Matrix4().makeBasis(right, up, fwd.clone().negate()); const q = new THREE.Quaternion().setFromRotationMatrix(m); a.g.quaternion.slerp(q, Math.min(1, dt * 6)); }
    a.cLegs.forEach((l, i) => { l.rotation.y = Math.sin(a.walk * 9 + i * 1.3) * 0.45; l.rotation.z = Math.cos(a.walk * 9 + i * 1.3) * 0.2; });
    if (dP < 1.9 && a.biteCd <= 0 && !dead) { a.biteCd = 1.3; hurt(5, 'The crawler dragged you into the dark.'); try { shake(0.3, 0.04); sfx3d('hiss', p, 14); } catch (_) {} }
    if (a.flash > 0) a.flash -= dt; }
  const um = updateMobs;
  updateMobs = function (dt) { const cs = []; for (let i = mobs.length - 1; i >= 0; i--) if (mobs[i].kind === 'crawler') { cs.push(mobs[i]); mobs.splice(i, 1); }
    try { return um.apply(this, arguments); } finally { for (const c of cs) mobs.push(c); for (const c of cs) { try { if (Math.hypot(c.g.position.x - P.x, c.g.position.z - P.z) > 70) { removeMob(c); continue; } stepCrawler(c, dt); } catch (_) {} } } };
  const dm = damageMob; damageMob = function (a, dmg, byPlayer) { if (a.kind !== 'crawler') return dm.apply(this, arguments); a.crHp -= dmg; a.flash = 0.25; const p = a.g.position; burst(p.x, p.y + .5, p.z, 0x3a3640, 8, .6); if (a.crHp <= 0) { burst(p.x, p.y + .5, p.z, 0x1c1a20, 30, 1.4); dropItem(IT.DIAMOND, 2, p.x, p.y + .5, p.z, 0, 3, 0, .4); try { dropXP(p.x, p.y, p.z, 60); } catch (_) {} toast('The crawler is dead'); removeMob(a); } };
  const km = killMob; killMob = function (a) { if (a.kind === 'crawler') { removeMob(a); return; } return km.apply(this, arguments); };
  setInterval(() => { if (!started || paused || DIM.cur) return; for (const cv of window.__deepCaves || []) { if (Math.hypot(P.x - cv[0], P.z - cv[2]) < 40 && P.y < 30 && !crawlers().some(c => c.cave === cv || (c.cave && c.cave[0] === cv[0] && c.cave[2] === cv[2]))) newCrawler(cv); } }, 2500);
})();
