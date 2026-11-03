/* ===================== GLX-D2 (v0.9.6): mobs fixed (skeleton bones, blob creeper + gunpowder, zombies), castle guardians, torch light ===================== */
IT.BONE = 171; IT.GUNPOWDER = 172;
NAMES[IT.BONE] = 'Bone'; NAMES[IT.GUNPOWDER] = 'Gunpowder';
ICONS[IT.BONE] = drawIcon(g => { g.rotate(-Math.PI / 4); g.fillStyle = '#efe9d8'; g.strokeStyle = '#6b6352'; g.lineWidth = 1.6;
  g.beginPath(); g.roundRect ? g.roundRect(-4, -18, 8, 36, 3) : g.rect(-4, -18, 8, 36); g.fill(); g.stroke();
  for (const [x, y] of [[-5, -20], [5, -20], [-5, 20], [5, 20]]) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.stroke(); }
  g.fillStyle = '#efe9d8'; g.fillRect(-3.4, -18, 6.8, 36); });
ICONS[IT.GUNPOWDER] = drawIcon(g => { for (let i = 0; i < 70; i++) { const a = Math.random() * 6.28, r = Math.pow(Math.random(), 0.7) * 20; const v = 50 + Math.random() * 70 | 0;
  g.fillStyle = `rgb(${v},${v},${v + 6})`; g.beginPath(); g.arc(Math.cos(a) * r * 1.1, Math.sin(a) * r * 0.7 + 6, 1.6 + Math.random() * 2.6, 0, 7); g.fill(); } });
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(IT.BONE, IT.GUNPOWDER);
// the creeper is the green blob (grass-dome shape) wearing the creeper texture; the four-legged thistle model is retired
makeCreeper = function () {
  const g = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({map: tex('creeper_skin')}), face = new THREE.MeshLambertMaterial({map: tex('creeper_face')});
  const rig = new THREE.Group(); g.add(rig);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.5, 16), skin); base.position.y = 0.36; rig.add(base);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.47, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), skin); dome.position.y = 0.6; dome.scale.y = 0.85; rig.add(dome);
  const fc = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), face); fc.position.set(0, 0.62, 0.465); rig.add(fc);
  const head = new THREE.Group(); head.position.y = 0.62; rig.add(head);
  const legs = [[-0.2, 0.2], [0.2, 0.2], [0.2, -0.2], [-0.2, -0.2]].map(([x, z]) => limb(g, 0.2, 0.18, 0.2, skin, x, 0.18, z));
  return {g, legs, arms: [], rig, mats: [skin, face], head, speed: 1.25, hp: 5, hitY: 0.6, hitR: 0.6, hostile: true, tall: 1};
};
(function () {
  const sm = spawnMob;
  spawnMob = function (kind) { if (kind === 'puffer') kind = 'creeper'; return sm.call(this, kind); };
  // drops: skeleton -> bones, creeper -> gunpowder, guardian -> bones + coal (+ a rare diamond)
  const km = killMob;
  killMob = function (a) {
    const pos = a.g.position, x = pos.x, y = pos.y + .4, z = pos.z;
    const toss = (id, n) => n > 0 && dropItem(id, n, x, y, z, (Math.random() - .5) * 2.5, 3.5, (Math.random() - .5) * 2.5, 0.4);
    if (a.kind === 'creeper') { burst(x, y + .3, z, 0x3d8a3a, 16); toss(IT.GUNPOWDER, Math.floor(Math.random() * 3)); toast('Creeper defeated'); removeMob(a); return; }
    if (a.kind === 'skeleton') { burst(x, y + .6, z, 0xd8d5cc, 16); toss(IT.BONE, Math.floor(Math.random() * 3)); toast('Skeleton defeated'); removeMob(a); return; }
    if (a.kind === 'guardian') { burst(x, y + .8, z, 0x111114, 24, 1.3); toss(IT.BONE, 1 + Math.floor(Math.random() * 3)); toss(IT.COAL, Math.floor(Math.random() * 2)); if (Math.random() < 0.12) toss(IT.DIAMOND, 1); toast('The castle guardian falls'); removeMob(a); return; }
    if (a.kind === 'zombie') { toss(IT.MUTTON, Math.random() < 0.3 ? 1 : 0); }
    return km.apply(this, arguments);
  };
})();
if (typeof MOB_HP !== 'undefined') MOB_HP.guardian = 40;
// zombies: a touch of their own glow so they read at night, spawn closer, and also in dark caves
(function () {
  const mh = makeHumanoid;
  makeHumanoid = function (kind) {
    if (kind === 'guardian') {
      const o = mh.call(this, 'skeleton');
      if (o.bow) { o.g.remove(o.bow); delete o.bow; delete o.str; delete o.nock; }
      const black = new THREE.MeshPhongMaterial({color: 0x18181c, shininess: 30, specular: 0x333333, map: tex('bone_skin')});
      o.g.traverse(m => { if (m.isMesh && m.material) { if (Array.isArray(m.material)) m.material = m.material.map((mm, i) => { if (i === 4 && mm.map && m === o.head) { const f = mm.clone(); f.color = new THREE.Color(0x3a3a40); return f; } return black; }); else m.material = black; } });
      o.mats = [black];
      // red eyes
      const eyeM = new THREE.MeshBasicMaterial({color: 0xff2a1a});
      for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.02), eyeM); e.position.set(sx * 0.12, 0.04, 0.26); o.head.add(e); }
      const gl = glowSprite(0xff3020, 0.5); gl.position.set(0, 0.04, 0.3); o.head.add(gl);
      // giant black sword in the right hand
      const sw = new THREE.Group(), sm = new THREE.MeshPhongMaterial({color: 0x0c0c0e, shininess: 90, specular: 0x666677});
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.03), sm); blade.position.y = -1.05; sw.add(blade);
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.08), sm); guard.position.y = -0.3; sw.add(guard);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.06), sm); grip.position.y = -0.17; sw.add(grip);
      sw.rotation.x = -Math.PI / 2 + 0.3; sw.position.set(0, -0.62, 0.05); (o.arms[1].children[0] ? o.arms[1] : o.arms[0]).add(sw);
      sw.scale.set(1.4, -1.4, 1.4); o.sword = sw;
      o.g.scale.setScalar(1.25); Object.assign(o, {speed: 1.55, hp: 40, hitY: 1.4, hitR: .75, hostile: true, tall: 3});
      return o;
    }
    const o = mh.apply(this, arguments);
    if (kind === 'zombie') o.mats.forEach(m => { if (m.emissive) m.emissive.setHex(0x0e1a0c); });
    return o;
  };
})();
function guardianSwing(a) { if (a.arms && a.arms[1]) { a.arms[1].rotation.x = -2.6; } try { sfx3d('swoosh', a.g.position, 12); } catch (_) {} }
function guardianRoar(pos) {
  if (!AC || !master) return; const d = Math.hypot(pos.x - P.x, pos.y - P.y, pos.z - P.z); if (d > 28) return;
  const t = AC.currentTime, v = 0.35 * Math.pow(1 - d / 28, 1.2), out = AC.createGain(); out.gain.value = v; out.connect(master);
  // low rattling growl + a cold metallic scrape
  const o = AC.createOscillator(), og = AC.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(42, t + 1.6);
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.9, t + 0.15); og.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 23; lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency);
  o.connect(lp); lp.connect(og); og.connect(out); o.start(t); lfo.start(t); o.stop(t + 1.9); lfo.stop(t + 1.9);
  for (let i = 0; i < 6; i++) grain(t + 0.3 + i * 0.07, 5200 + Math.random() * 2000, 9, 0.12, 0.15, out, 'bandpass');
}
// ---- castle guardians: only inside / around the castles, up to 3 per castle, day and night ----
var guardT = 0;
(function () {
  const um = updateMobs;
  updateMobs = function (dt) {
    um.apply(this, arguments);
    for (const a of mobs) if (a.kind === 'guardian') { a.burning = 0; if (a.arms && a.arms[1] && a.arms[1].rotation.x < -0.3) a.arms[1].rotation.x += dt * 5; if (!a.home) continue;
      const hd = Math.hypot(a.g.position.x - a.home[0], a.g.position.z - a.home[1]); if (hd > 34 && !(a.aggro > 0)) a.ang = Math.atan2(a.home[0] - a.g.position.x, a.home[1] - a.g.position.z); }
    guardT -= dt; if (guardT > 0 || !started || dead) return; guardT = 4;
    const cs = (typeof g9castles !== 'undefined' && genVer === GEN9) ? g9castles : (genVer === GEN10 && CLY && CLY.castles) ? CLY.castles : [];
    for (const c of cs) {
      const cx = c[1], cz = c[2]; if (Math.hypot(P.x - cx, P.z - cz) > 60) continue;
      const here = mobs.filter(a => a.kind === 'guardian' && a.home && a.home[0] === cx && a.home[1] === cz).length;
      if (here >= 3) continue;
      // a floor cell inside the walls, out of the player's view
      for (let k = 0; k < 40; k++) {
        const x = Math.floor(cx + (Math.random() - .5) * 22), z = Math.floor(cz + (Math.random() - .5) * 22); if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) continue;
        let y = -1; for (let yy = Math.min(H - 3, g9top(x, z) + 1); yy > 2; yy--) if (solid(x, yy - 1, z) && !solid(x, yy, z) && !solid(x, yy + 1, z) && !solid(x, yy + 2, z)) { y = yy; break; }
        if (y < 0 || Math.hypot(P.x - x, P.z - z) < 8) continue;
        const n = mobs.length; const a = spawnMob('guardian'); const m = a || mobs[n]; if (!m || m.kind !== 'guardian') break;
        m.g.position.set(x + .5, y, z + .5); m.home = [cx, cz]; m.hp = MOB_HP.guardian || 40; break;
      }
    }
  };
})();
// castles are remembered in the save (they used to be lost on reload)
(function () {
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); if (genVer === GEN9 && g9castles && g9castles.length) d.g9castles = g9castles; return d; };
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); if (d && d.g9castles) g9castles = d.g9castles; return r; };
})();
// ---- held torch / lamp = light around the player; far torches and lamps glow through the distance ----
var handLight = new THREE.PointLight(0xffa458, 0, 13, 1.25); scene.add(handLight);
var farGlow = null, lightSrc = new Map();
(function () {
  const sb = setB;
  setB = function (x, y, z, v) { const k = (x * 4096 + z) * 256 + y; const old = world[idx(x, y, z)]; const r = sb.apply(this, arguments);
    if (v === T.TORCH || v === 161) lightSrc.set(k, [x + .5, y + (v === T.TORCH ? .7 : .5), z + .5, v]); else if (old === T.TORCH || old === 161) lightSrc.delete(k); farGlow && (farGlow.userData.dirty = true); return r; };
})();
function scanLights() {
  lightSrc.clear();
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { const b0 = (x * H + y) * D; for (let z = 0; z < D; z++) { const b = world[b0 + z]; if (b === T.TORCH || b === 161) lightSrc.set((x * 4096 + z) * 256 + y, [x + .5, y + (b === T.TORCH ? .7 : .5), z + .5, b]); } }
  if (farGlow) farGlow.userData.dirty = true;
}
(function () {
  const ew = enterWorld; enterWorld = function () { const r = ew.apply(this, arguments); const w = setInterval(() => { if (started) { clearInterval(w); scanLights(); } }, 500); return r; };
  if (typeof c1Shift === 'function') { const cs = c1Shift; c1Shift = function () { const r = cs.apply(this, arguments); scanLights(); return r; }; }
})();
function glowTexture() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.25, 'rgba(255,190,110,.75)'); gr.addColorStop(1, 'rgba(255,140,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
(function () {
  const ul = updateLights;
  updateLights = function (dt) {
    ul.apply(this, arguments);
    // hand light follows the camera a little in front and below
    const hold = started && !dead && (selId === T.TORCH || selId === 161) && (MODE.infinite || inv[selId] > 0);
    handLight.userData.k = (handLight.userData.k || 0) + ((hold ? 1 : 0) - (handLight.userData.k || 0)) * Math.min(1, dt * 8);
    const now = performance.now() / 1000, fl = Math.sin(now * 13) * 0.08 + Math.sin(now * 21) * 0.05;
    handLight.intensity = handLight.userData.k * (1.6 + fl);
    if (handLight.userData.k > 0.01) { const d = lookDir(); handLight.position.set(P.x + d[0] * 0.6 + Math.cos(P.yaw) * 0.3, P.y + EYE - 0.25, P.z + d[2] * 0.6 - Math.sin(P.yaw) * 0.3); }
    // distant light LOD: additive glow points (not fogged) for every torch / lamp 24..220 blocks away
    if (!farGlow) {
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 4096), 3)); geo.setDrawRange(0, 0);
      farGlow = new THREE.Points(geo, new THREE.PointsMaterial({map: glowTexture(), size: 2.2, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.9}));
      farGlow.frustumCulled = false; farGlow.userData = {dirty: true, t: 0}; scene.add(farGlow);
    }
    farGlow.userData.t -= dt;
    if (farGlow.userData.t <= 0 || farGlow.userData.dirty) {
      farGlow.userData.t = 0.5; farGlow.userData.dirty = false;
      const pos = farGlow.geometry.attributes.position.array; let n = 0;
      const night = 1 - Math.min(1, Math.max(0, (daylight - 0.25) / 0.5));
      for (const v of lightSrc.values()) { const d = Math.hypot(v[0] - P.x, v[2] - P.z); if (d < 22 || d > 230) continue; if (n >= 4096) break; pos[n * 3] = v[0]; pos[n * 3 + 1] = v[1]; pos[n * 3 + 2] = v[2]; n++; }
      farGlow.geometry.setDrawRange(0, n); farGlow.geometry.attributes.position.needsUpdate = true;
      farGlow.material.opacity = 0.25 + 0.75 * Math.max(night, caveK);
    }
  };
})();
