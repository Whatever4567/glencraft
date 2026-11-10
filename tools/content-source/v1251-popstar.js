/* GLX-V1251 (v1.2.51): rare giant pop-star meme mob.
   She wanders the overworld by day, dancing a catwalk to her song (the user's
   own AI TikTok, used with permission, trimmed of the TikTok outro / end screen
   and looped). Harmless, single instance, does not change world blocks, first-
   person arms, or other mobs. Footstep thuds and a near-field camera shake are
   procedural. */
(function v1251() {
  const C = (typeof window !== 'undefined' && window.__popstarCore) ? window.__popstarCore : null;
  const U = window.__v1251 = {
    err: null, ver: '1.2.51', spawned: 0, despawned: 0, rolls: 0, hits: 0,
    present: 0, songOn: 0, thuds: 0, shakes: 0, blocked: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  if (!C) { ERR('core', 'missing __popstarCore'); return; }
  U.core = C;

  // Be a friendly, so 1.2.48 spiders / hostiles will not hunt her.
  try { if (window.__v1248 && __v1248.FRIENDLY) __v1248.FRIENDLY.add('popstar'); } catch (e) { ERR('friendly', e); }

  let aLive = null, song = null, shake = 0, lastPlant = -1, songT0 = 0, dayRolled = -1;

  function acOk() {
    try { return typeof AC !== 'undefined' && AC && AC.createGain; } catch (_) { return false; }
  }
  function sfxV() { try { return Math.max(0, Math.min(1, SET.sfx)); } catch (_) { return 0.8; } }
  function musV() { try { return Math.max(0, Math.min(1, SET.music)); } catch (_) { return 0.8; } }
  function songV() { return Math.max(musV(), sfxV() * 0.55); }

  function isOutdoors() {
    try {
      if (typeof caveK === 'number' && caveK > 0.35) return false;
      if (typeof DIM !== 'undefined' && DIM && DIM.cur) return false;
    } catch (_) {}
    return true;
  }

  function isFluid(b) {
    if (typeof T === 'undefined' || T == null || b == null) return false;
    return b === T.WATER || b === T.LAVA || (T.STILL_WATER != null && b === T.STILL_WATER);
  }
  function isLandBlock(b) {
    if (b == null || b === 0) return false;
    if (isFluid(b)) return false;
    try { if (typeof LEAFY !== 'undefined' && LEAFY[b]) return false; } catch (_) {}
    try { if (typeof PLANT !== 'undefined' && PLANT[b]) return false; } catch (_) {}
    return true;
  }
  // A thin floor / roof / battlement: there is a cavity in the 4 blocks under the surface.
  // Natural terrain (dirt hills, solid ground) is filled and returns false.
  function isRoofOrStructure(bx, standY, bz) {
    try {
      const floorY = standY - 1;
      let gaps = 0, filled = 0;
      for (let y = floorY - 1; y >= floorY - 4 && y >= 0; y--) {
        const b = (typeof getB === 'function') ? getB(bx, y, bz) : 0;
        const sol = isLandBlock(b) && (typeof solid !== 'function' || solid(bx, y, bz));
        if (sol) filled++;
        else gaps++;
      }
      return gaps >= 1;
    } catch (e) { ERR('roof', e); return false; }
  }

  // Highest standable surface, including roofs and wall-tops. Used to detect structures
  // sitting above the walkable grade so her footprint cannot clip through them.
  function rawStandY(x, z) {
    try {
      const bx = Math.floor(x), bz = Math.floor(z);
      if (typeof W === 'number' && (bx < 2 || bz < 2 || bx >= W - 2 || bz >= D - 2)) return 0;
      if (typeof getB !== 'function') return 0;
      const Hgt = (typeof H === 'number') ? H : 90;
      for (let y = Hgt - 1; y >= 0; y--) {
        const b = getB(bx, y, bz);
        if (!isLandBlock(b)) continue;
        if (typeof solid === 'function' && !solid(bx, y, bz)) continue;
        const above = getB(bx, y + 1, bz);
        const above2 = getB(bx, y + 2, bz);
        if (isFluid(above) || isFluid(above2)) continue;
        if (typeof solid === 'function' && (solid(bx, y + 1, bz) || solid(bx, y + 2, bz))) continue;
        return y + 1;
      }
    } catch (e) { ERR('rawY', e); }
    return 0;
  }

  // Top of a solid dry-land block she may walk on: not water, lava, leaves, plants,
  // air, or a roof / thin structure floor. 0 if none.
  function landY(x, z) {
    try {
      const bx = Math.floor(x), bz = Math.floor(z);
      if (typeof W === 'number' && (bx < 2 || bz < 2 || bx >= W - 2 || bz >= D - 2)) return 0;
      if (typeof getB !== 'function') return 0;
      const Hgt = (typeof H === 'number') ? H : 90;
      for (let y = Hgt - 1; y >= 0; y--) {
        const b = getB(bx, y, bz);
        if (!isLandBlock(b)) continue;
        if (typeof solid === 'function' && !solid(bx, y, bz)) continue;
        // need two clear non-fluid blocks to stand in
        const above = (typeof getB === 'function') ? getB(bx, y + 1, bz) : 0;
        const above2 = getB(bx, y + 2, bz);
        if (isFluid(above) || isFluid(above2)) continue;
        if (typeof solid === 'function' && (solid(bx, y + 1, bz) || solid(bx, y + 2, bz))) continue;
        if (isRoofOrStructure(bx, y + 1, bz)) continue;
        return y + 1;
      }
    } catch (e) { ERR('land', e); }
    return 0;
  }
  function isDryLand(x, z) { return landY(x, z) > 0; }
  // Kept name: callers and tests use footGround; it now means dry land only (never sea).
  function footGround(x, z) { return landY(x, z); }

  // Search outward from (x,z) for a dry-land column. Used when the player is on a shore or at sea.
  function findLandNear(x, z, maxR) {
    maxR = maxR || 80;
    if (landY(x, z) > 0) return {x: x, y: landY(x, z), z: z};
    for (let r = 2; r <= maxR; r += 2) {
      for (let a = 0; a < 20; a++) {
        const ang = a / 20 * Math.PI * 2;
        const nx = x + Math.cos(ang) * r, nz = z + Math.sin(ang) * r;
        const y = landY(nx, nz);
        if (y > 0) return {x: nx, y: y, z: nz};
      }
    }
    return null;
  }

  function headingVec(yaw) { return { x: Math.sin(yaw), z: Math.cos(yaw) }; }

  function startSong() {
    stopSong();
    if (!acOk()) return;
    try {
      const buf = U.songBuf;
      if (!buf) { loadSong(); return; }
      const src = AC.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = Math.min(buf.duration, C.LOOP);
      const gain = AC.createGain();
      gain.gain.value = 0.0001;
      const panner = AC.createPanner ? AC.createPanner() : null;
      if (panner) {
        try {
          panner.panningModel = 'equalpower';
          panner.distanceModel = 'inverse';
          panner.refDistance = 28;
          panner.maxDistance = 260;
          panner.rolloffFactor = 0.65;
        } catch (_) {}
        src.connect(gain); gain.connect(panner);
        panner.connect((typeof master !== 'undefined' && master) ? master : AC.destination);
      } else {
        src.connect(gain); gain.connect((typeof master !== 'undefined' && master) ? master : AC.destination);
      }
      src.start();
      song = { src: src, gain: gain, panner: panner };
      songT0 = AC.currentTime;
      U.songOn = 1;
    } catch (e) { ERR('song', e); }
  }
  function stopSong() {
    if (!song) return;
    try { song.src.stop(); } catch (_) {}
    try { song.gain.disconnect(); } catch (_) {}
    song = null; U.songOn = 0;
  }
  function loadSong() {
    if (U._loadingSong || !acOk()) return;
    U._loadingSong = 1;
    const tryUrl = (url, next) => {
      fetch(url).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
        .then(b => AC.decodeAudioData(b.slice(0)))
        .then(buf => { U.songBuf = buf; U._loadingSong = 0; if (aLive && !song) startSong(); })
        .catch(() => { if (next) next(); else { U._loadingSong = 0; ERR('decode', url); } });
    };
    tryUrl(C.SONG_OGG, () => tryUrl(C.SONG_MP3, null));
  }

  function thud(wx, wy, wz) {
    if (!acOk() || sfxV() < 0.02) return;
    try {
      const t = AC.currentTime;
      const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = 48;
      const o2 = AC.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 72;
      const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t);
      const dist = (typeof P !== 'undefined' && P) ? Math.hypot((wx - P.x), (wy - (P.y || 0)), (wz - P.z)) : 40;
      const att = Math.min(1, 22 / (dist + 8));
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.7 * sfxV() * att), t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      const flt = AC.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 180;
      o.connect(flt); o2.connect(flt); flt.connect(g);
      if (AC.createPanner) {
        const p = AC.createPanner();
        try { p.panningModel = 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = 16; p.maxDistance = 160; p.rolloffFactor = 0.9; } catch (_) {}
        try { if (p.positionX) { p.positionX.value = wx; p.positionY.value = wy; p.positionZ.value = wz; } } catch (_) {}
        g.connect(p); p.connect((typeof master !== 'undefined' && master) ? master : AC.destination);
      } else g.connect((typeof master !== 'undefined' && master) ? master : AC.destination);
      o.start(t); o2.start(t); o.stop(t + 0.3); o2.stop(t + 0.3);
      U.thuds++;
    } catch (e) { ERR('thud', e); }
  }

  function updateSongPos(pos) {
    if (!song || !acOk()) return;
    const now = AC.currentTime;
    const vol = songV() * 0.55;
    try { song.gain.gain.setTargetAtTime(Math.max(0.0001, vol), now, 0.08); } catch (_) {}
    if (song.panner && song.panner.positionX) {
      try {
        song.panner.positionX.setTargetAtTime(pos.x, now, 0.05);
        song.panner.positionY.setTargetAtTime(pos.y + 16, now, 0.05);
        song.panner.positionZ.setTargetAtTime(pos.z, now, 0.05);
        if (typeof camera !== 'undefined' && AC.listener && AC.listener.positionX) {
          AC.listener.positionX.setTargetAtTime(camera.position.x, now, 0.05);
          AC.listener.positionY.setTargetAtTime(camera.position.y, now, 0.05);
          AC.listener.positionZ.setTargetAtTime(camera.position.z, now, 0.05);
        }
      } catch (_) {}
    }
  }

  function applyShake() {
    if (shake <= 0 || typeof camera === 'undefined') return;
    const s = shake;
    camera.position.x += (Math.random() - 0.5) * s;
    camera.position.y += (Math.random() - 0.5) * s * 0.6;
    camera.position.z += (Math.random() - 0.5) * s;
  }

  function pickSpawn() {
    try {
      if (typeof P === 'undefined' || !P) return null;
      // Prefer a dry-land ring around the player; if the local area is all water, search outward.
      for (let i = 0; i < 40; i++) {
        const ang = Math.random() * Math.PI * 2;
        const r = 28 + Math.random() * 50;
        let x = P.x + Math.sin(ang) * r, z = P.z + Math.cos(ang) * r;
        if (typeof W === 'number') {
          if (x < 8) x = 8; if (z < 8) z = 8;
          if (x > W - 8) x = W - 8; if (z > D - 8) z = D - 8;
        }
        const y = landY(x, z);
        if (y < 1) continue;
        let sky = true;
        try { if (typeof skyTop === 'function' && skyTop(Math.floor(x), Math.floor(z)) > y + 8) sky = false; } catch (_) {}
        if (!sky && i < 24) continue;
        return { x: x, y: y, z: z, yaw: Math.atan2(P.x - x, P.z - z) };
      }
      const near = findLandNear(P.x, P.z, 96);
      if (near) return { x: near.x, y: near.y, z: near.z, yaw: Math.atan2(P.x - near.x, P.z - near.z) };
    } catch (e) { ERR('spot', e); }
    return null;
  }

  function attachToMobs(rec) {
    try {
      if (typeof mobs !== 'undefined' && Array.isArray(mobs) && mobs.indexOf(rec) < 0) mobs.push(rec);
    } catch (_) {}
  }
  function detachFromMobs(rec) {
    try {
      if (typeof mobs === 'undefined') return;
      const i = mobs.indexOf(rec); if (i >= 0) mobs.splice(i, 1);
    } catch (_) {}
  }

  U.spawnAt = function (x, y, z, yaw) {
    if (aLive) U.despawn();
    if (typeof THREE === 'undefined' || typeof scene === 'undefined') { ERR('scene', 'no THREE/scene'); return null; }
    let parts;
    try { parts = C.make(); } catch (e) { ERR('make', e); return null; }
    let gx = x, gz = z, gy = landY(x, z);
    if (gy < 1) {
      const near = findLandNear(x, z, 96);
      if (!near) { ERR('spawn', 'no dry land'); try { /* parts still need cleanup */ } catch (_) {} return null; }
      gx = near.x; gy = near.y; gz = near.z;
    }
    try { if (C.dressVisible) C.dressVisible(parts); } catch (e) { ERR('vis', e); }
    parts.g.position.set(gx, gy, gz);
    parts.g.rotation.y = yaw || 0;
    parts.g.visible = true;
    parts.g.frustumCulled = false;
    scene.add(parts.g);
    const rec = {
      kind: 'popstar', g: parts.g, parts: parts, hostile: false, harmless: true,
      hp: 9999, hitY: 16, hitR: (C.BODY_R || 4.2), tall: C.HEIGHT, speed: C.STRIDE / C.BEAT, supportY: gy,
      flee: 0, angry: 0, mats: parts.mats, named: true,
      yaw: yaw || 0, destYaw: yaw || 0, pathX: gx, pathZ: gz, pathYaw: yaw || 0,
      born: (typeof performance !== 'undefined' ? performance.now() : 0),
      life: 0, tSong: 0, lastStep: -1
    };
    aLive = rec;
    attachToMobs(rec);
    if (U.songBuf) startSong(); else loadSong();
    U.spawned++; U.present = 1;
    try { if (typeof toast === 'function') toast('A giant pop star is strutting through the glen!'); } catch (_) {}
    return rec;
  };

  U.despawn = function () {
    if (!aLive) return;
    try { scene.remove(aLive.g); } catch (_) {}
    try {
      aLive.g.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      (aLive.mats || []).forEach(m => { try { if (m.map) m.map.dispose(); m.dispose(); } catch (_) {} });
    } catch (_) {}
    detachFromMobs(aLive);
    aLive = null; U.present = 0; U.despawned++;
    stopSong();
    shake = 0;
  };

  U.maybeSpawn = function (why) {
    if (aLive) return null;
    if (typeof started !== 'undefined' && !started) return null;
    if (typeof daylight === 'number' && daylight < 0.55) return null;
    if (!isOutdoors()) return null;
    U.rolls++;
    if (Math.random() >= C.SPAWN_CHANCE && why !== 'force') return null;
    const sp = pickSpawn();
    if (!sp) return null;
    return U.spawnAt(sp.x, sp.y, sp.z, sp.yaw);
  };

  function tickPopstar(dt) {
    if (typeof started !== 'undefined' && !started) return;
    if (typeof paused !== 'undefined' && paused) return;
    if (!aLive) return;
    if ((typeof daylight === 'number' && daylight < 0.35) || aLive.life > C.LIFE) {
      U.despawn(); return;
    }
    aLive.life += dt;
    const rec = aLive;
    const parts = rec.parts;
    const yaw = rec.yaw;
    const fwd = headingVec(yaw);

    // Song-synced clock. Prefer the audio clock so steps stay on the beat.
    let tSong;
    if (song && acOk()) tSong = (AC.currentTime - songT0) % C.LOOP;
    else tSong = rec.tSong = (rec.tSong || 0) + dt;
    rec.tSong = tSong;
    const st = C.stepState(tSong);

    // Long straight-ish walk on dry land only; turn back at water, lava, air or a steep drop.
    if (typeof W === 'number') {
      const look = 18;
      const nx = rec.pathX + fwd.x * look, nz = rec.pathZ + fwd.z * look;
      const nearEdge = nx < 6 || nz < 6 || nx > W - 6 || nz > D - 6;
      const aheadY = landY(nx, nz);
      const hereY = landY(rec.pathX, rec.pathZ);
      const maxStep = (C && C.MAX_STEP != null) ? C.MAX_STEP : 1;
      const badAhead = aheadY < 1 || (hereY > 0 && Math.abs(aheadY - hereY) > maxStep);
      if (nearEdge || badAhead) {
        rec.destYaw = yaw + (Math.random() < 0.5 ? 1 : -1) * (Math.PI * (0.6 + Math.random() * 0.6));
        U.turns = (U.turns || 0) + 1;
      }
    }
    // Smooth yaw toward dest
    let dy = rec.destYaw - rec.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    rec.yaw += Math.max(-2.2 * dt, Math.min(2.2 * dt, dy));
    rec.pathYaw = rec.yaw;

    const speed = C.STRIDE / C.BEAT;
    const step = U.proposeStep(rec.pathX, rec.pathZ, rec.yaw, speed * dt);
    if (step.ok) {
      rec.pathX = step.x;
      rec.pathZ = step.z;
    } else {
      rec.destYaw = rec.yaw + Math.PI * (0.7 + Math.random() * 0.4);
      U.turns = (U.turns || 0) + 1;
    }
    if (typeof W === 'number') {
      rec.pathX = Math.max(6, Math.min(W - 6, rec.pathX));
      rec.pathZ = Math.max(6, Math.min(D - 6, rec.pathZ));
    }

    // Ground under each foot and under the body (step over foliage).
    const ca = Math.cos(rec.yaw), sa = Math.sin(rec.yaw);
    function worldFoot(f) {
      // foot in path space (x right, z forward) rotated by yaw, origin at path
      // After applyPose, the model is placed with g at path origin and g.position.z offset...
      const lx = f.x, lz = f.z; // already along the walk in stepState, z is world-along-path
      // We place the group at the current hip world, then applyPose uses z - hipZ
      return { x: rec.pathX + sa * lz - ca * lx, z: rec.pathZ + ca * lz + sa * lx };
    }
    // Actually we place g at the hip's world XZ, y = support, rotation yaw.
    // stepState hipZ is the distance travelled along the path since t=0, which would drift
    // from pathX/pathZ if we also integrate. Better: treat pathX/Z as the hip XZ.
    const hipWX = rec.pathX, hipWZ = rec.pathZ;
    function footWZ(f) {
      // foot relative to hip in path space: (f.x - hipX, f.z - hipZ)
      const rx = f.x - st.hipX, rz = f.z - st.hipZ;
      return { x: hipWX + sa * rz - ca * rx, z: hipWZ + ca * rz + sa * rx };
    }
    const lW = footWZ(st.left), rW = footWZ(st.right);
    const maxStep = (C && C.MAX_STEP != null) ? C.MAX_STEP : 1;
    const gL = landY(lW.x, lW.z), gR = landY(rW.x, rW.z);
    const gH = landY(hipWX, hipWZ);
    // Ignore a foot that landed on a skipped roof or a >1-block jump; that was the castle spaz.
    function stableSample(y, ref) {
      if (!(y > 0)) return 0;
      if (ref > 0 && Math.abs(y - ref) > maxStep) return 0;
      return y;
    }
    const base = gH > 0 ? gH : Math.max(gL, gR);
    const sL = stableSample(gL, base), sR = stableSample(gR, base);
    let support = (sL > 0 && st.left.planted && !st.right.planted) ? sL
      : (sR > 0 && st.right.planted && !st.left.planted) ? sR
      : (base > 0 ? base : Math.max(sL, sR));
    if (rec.supportY > 0 && support > 0) {
      if (support > rec.supportY + maxStep) support = rec.supportY + maxStep;
      if (support < rec.supportY - maxStep) support = rec.supportY - maxStep;
    }
    // Snap feet to the dry surface; never float, sink, stand in water, or pop onto a roof.
    if (support > 0) {
      rec.supportY = support;
      rec.g.position.set(hipWX, support, hipWZ);
    }
    rec.g.rotation.set(0, rec.yaw, 0);
    rec.g.visible = true;
    rec.g.frustumCulled = false;
    try { if (rec.g.parent !== scene && typeof scene !== 'undefined') scene.add(rec.g); } catch (_) {}
    try { if (C.dressVisible) C.dressVisible(parts); } catch (_) {}
    // applyPose expects rig at origin with hipZ subtracted from foot z; we already
    // placed g at the hip, so pass a state whose hipZ is used only relatively.
    const dL = ((sL > 0) ? sL : support) - support;
    const dR = ((sR > 0) ? sR : support) - support;
    C.applyPose(parts, st, { l: dL, r: dR, h: 0 });
    try { U.pushPlayerOut(); } catch (_) {}

    // Footstep events
    if (st.step !== rec.lastStep) {
      rec.lastStep = st.step;
      const f = st.left.planted ? lW : rW;
      const fy = st.left.planted ? gL : gR;
      thud(f.x, fy, f.z);
      try { if (typeof burst === 'function') burst(f.x, fy + 0.2, f.z, 0xc8c0a8, 8, 2.5); } catch (_) {}
      if (typeof P !== 'undefined' && P) {
        const dist = Math.hypot(hipWX - P.x, (support + 4) - (P.y || 0), hipWZ - P.z);
        if (dist < 48) {
          const amt = Math.min(0.55, 6 / (dist + 4));
          shake = Math.max(shake, amt);
          U.shakes++;
        }
      }
    }
    shake *= Math.max(0, 1 - dt * 4.5);

    updateSongPos({ x: hipWX, y: support, z: hipWZ });
  }

  // ---------- hooks (chained after 1.2.48) ----------
  try {
    const up = updatePlayer;
    window.updatePlayer = updatePlayer = function () {
      const r = up.apply(this, arguments);
      try { U.pushPlayerOut(); } catch (e) { ERR('push', e); }
      return r;
    };
  } catch (e) { ERR('upw', e); }

  try {
    const um = updateMobs;
    window.updateMobs = updateMobs = function (dt) {
      const r = um.apply(this, arguments);
      try { tickPopstar(dt); } catch (e) { ERR('tick', e); }
      return r;
    };
  } catch (e) { ERR('um', e); }

  try {
    const pc = placeCamera;
    window.placeCamera = placeCamera = function () {
      const r = pc.apply(this, arguments);
      try { applyShake(); } catch (e) { ERR('shake', e); }
      return r;
    };
  } catch (e) { ERR('pc', e); }

  try {
    const od = onDawn;
    window.onDawn = onDawn = function () {
      const r = od.apply(this, arguments);
      try {
        const n = (typeof dayNum === 'number') ? dayNum : (dayRolled + 1);
        if (n !== dayRolled) { dayRolled = n; U.maybeSpawn('dawn'); }
      } catch (e) { ERR('dawn', e); }
      return r;
    };
  } catch (e) { ERR('od', e); }

  try {
    const ew = enterWorld;
    window.enterWorld = enterWorld = function () {
      try { if (aLive) U.despawn(); dayRolled = -1; } catch (e) { ERR('ew-pre', e); }
      const r = ew.apply(this, arguments);
      try {
        // New / loaded daytime worlds get one roll, not a guaranteed spawn.
        setTimeout(() => {
          try {
            if (typeof dayNum === 'number') dayRolled = dayNum;
            if (typeof daylight === 'number' && daylight > 0.55) U.maybeSpawn('enter');
          } catch (e) { ERR('ew-roll', e); }
        }, 800);
      } catch (e) { ERR('ew', e); }
      return r;
    };
  } catch (e) { ERR('eww', e); }

  try {
    const dm = damageMob;
    window.damageMob = damageMob = function (a, dmg, byPlayer) {
      try {
        if (a && a.kind === 'popstar') { U.hits++; return a; }
      } catch (e) { ERR('dm', e); }
      return dm.apply(this, arguments);
    };
  } catch (e) { ERR('dmw', e); }

  try {
    const ht = hurt;
    window.hurt = hurt = function (n, cause) {
      try {
        if (aLive && cause && (cause === aLive || cause.kind === 'popstar')) { U.blocked++; return; }
      } catch (e) { ERR('hurt', e); }
      return ht.apply(this, arguments);
    };
  } catch (e) { ERR('hw', e); }

  // Don't let her go through the generic remove/attack loops as a normal mob in a bad way.
  try {
    if (typeof NICE !== 'undefined') NICE.popstar = 'Pop star';
  } catch (_) {}


  function standOk(x, y, z) {
    try {
      const yLand = landY(x, z);
      if (yLand < 1) return false;
      if (y != null && Math.abs(yLand - y) > 1.1) return false;
      x = Math.floor(x); z = Math.floor(z); y = Math.floor(yLand);
      if (typeof W === 'number' && (x < 2 || z < 2 || x > W - 3 || z > D - 3)) return false;
      if (typeof H === 'number' && (y < 1 || y > H - 3)) return false;
      return true;
    } catch (e) { ERR('stand', e); return false; }
  }

  U.MAX_STEP = (C && C.MAX_STEP != null) ? C.MAX_STEP : 1;
  U.BODY_R = (C && C.BODY_R != null) ? C.BODY_R : 4.2;
  U.FOOT_R = 2.0;

  // Sample her giant footprint: every point must be walkable terrain within 1 block of yRef.
  function footprintOk(x, z, yRef) {
    const r = U.FOOT_R;
    const pts = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
    for (let i = 0; i < pts.length; i++) {
      const sx = x + pts[i][0] * r, sz = z + pts[i][1] * r;
      const y = landY(sx, sz);
      const raw = rawStandY(sx, sz);
      if (y < 1) return false;
      if (yRef != null && Math.abs(y - yRef) > U.MAX_STEP) return false;
      // A roof, battlement or wall sitting above the walk grade is a structure: refuse.
      if (raw > y) return false;
      if (yRef != null && raw > yRef + U.MAX_STEP) return false;
    }
    return true;
  }

  // One wander step: dry terrain only, max 1-block step-up/down, no roofs or thin structures.
  U.proposeStep = function (x, z, yaw, stepLen) {
    const fwd = headingVec(yaw);
    const nx = x + fwd.x * stepLen, nz = z + fwd.z * stepLen;
    const y0 = landY(x, z), y1 = landY(nx, nz);
    if (y1 < 1 || y0 < 1) {
      return {ok: false, x: x, z: z, y: y0, yaw: yaw, reason: 'water'};
    }
    if (Math.abs(y1 - y0) > U.MAX_STEP) {
      return {ok: false, x: x, z: z, y: y0, yaw: yaw, reason: 'steep'};
    }
    if (!footprintOk(nx, nz, y0)) {
      return {ok: false, x: x, z: z, y: y0, yaw: yaw, reason: 'roof'};
    }
    return {ok: true, x: nx, z: nz, y: y1, yaw: yaw};
  };

  // Keep the player (and first-person camera) out of her body so meshes are never
  // clipped by the near plane and backfaces stay out of view.
  U.pushPlayerOut = function (player, rec) {
    rec = rec || aLive;
    player = player || ((typeof P !== 'undefined') ? P : null);
    if (!rec || !player || !rec.g || !rec.g.position) return { pushed: false };
    const px = player.x, py = player.y || 0, pz = player.z;
    const gx = rec.g.position.x, gy = rec.g.position.y || 0, gz = rec.g.position.z;
    const h = (C && C.HEIGHT) || 32;
    const r = U.BODY_R;
    if (py + 1.8 < gy - 0.5 || py > gy + h + 0.5) {
      return { pushed: false, dist: Math.hypot(px - gx, pz - gz) };
    }
    const dx = px - gx, dz = pz - gz;
    const dist = Math.hypot(dx, dz);
    if (dist >= r) return { pushed: false, dist: dist };
    const ux = (dist < 1e-4) ? 1 : dx / dist, uz = (dist < 1e-4) ? 0 : dz / dist;
    const nx = gx + ux * r, nz = gz + uz * r;
    player.x = nx;
    player.z = nz;
    const y = landY(nx, nz);
    if (y >= 1) player.y = y;
    try { player.kbx = 0; player.kbz = 0; } catch (_) {}
    U.pushed = (U.pushed || 0) + 1;
    return { pushed: true, dist: r, x: nx, y: player.y, z: nz };
  };

  // Distance at which her whole 32-block body fits in a portrait 412x915, ~70° vertical FOV, with margin.
  function framingDist() {
    const h = (C && C.HEIGHT) || 32;
    let fov = 70;
    try { if (typeof camera !== 'undefined' && camera && camera.fov) fov = camera.fov; } catch (_) {}
    const rad = (fov * Math.PI / 180);
    return (h * 1.28) / (2 * Math.tan(rad / 2));
  }

  // A dry-land spot in front of her, far enough that head-to-feet fit in the portrait view.
  function spotInFront(rec, maxD) {
    const ideal = framingDist();
    const lo = Math.max(20, ideal - 6), hi = Math.min(maxD || (ideal + 8), ideal + 8);
    const p = rec.g && rec.g.position ? rec.g.position : {x: rec.pathX || 0, y: 0, z: rec.pathZ || 0};
    const yaw = (typeof rec.yaw === 'number') ? rec.yaw : (rec.g && rec.g.rotation ? rec.g.rotation.y : 0);
    const tryAt = (x, z) => {
      const y = landY(x, z);
      if (y < 1 || !standOk(x, y, z)) return null;
      const d = Math.hypot((x - p.x), (z - p.z));
      if (d < lo - 0.5 || d > hi + 0.5) return null;
      return {x: Math.floor(x) + 0.5, y: y, z: Math.floor(z) + 0.5, dist: d};
    };
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    const dists = [];
    for (let d = Math.round(ideal); d >= Math.ceil(lo); d--) dists.push(d);
    for (let d = Math.round(ideal) + 1; d <= Math.floor(hi); d++) dists.push(d);
    for (const dist of dists) {
      const s = tryAt(p.x + fx * dist, p.z + fz * dist);
      if (s) return s;
    }
    for (let r = Math.ceil(lo); r <= Math.floor(hi); r++) {
      for (let a = 0; a < 24; a++) {
        const ang = yaw + (a / 24) * Math.PI * 2;
        const s = tryAt(p.x + Math.sin(ang) * r, p.z + Math.cos(ang) * r);
        if (s) return s;
      }
    }
    // Last resort: any dry land in front in a slightly wider band.
    for (let r = 16; r <= 48; r++) {
      for (let a = 0; a < 24; a++) {
        const ang = yaw + (a / 24) * Math.PI * 2;
        const y = landY(p.x + Math.sin(ang) * r, p.z + Math.cos(ang) * r);
        if (y > 0) return {x: Math.floor(p.x + Math.sin(ang) * r) + 0.5, y: y, z: Math.floor(p.z + Math.cos(ang) * r) + 0.5, dist: r};
      }
    }
    return null;
  }

  // Pause menu: Teleport to Pop Star. Spawns her nearby if she is not in the world,
  // then puts the player on solid ground a few blocks in front of her, facing her.
  U.teleportTo = function () {
    const R = U.tp || (U.tp = {n: 0, last: null});
    R.n++;
    try {
      if (typeof started !== 'undefined' && !started) {
        R.last = 'noworld';
        try { toast('Start a world first'); } catch (_) {}
        return false;
      }
      if (typeof DIM !== 'undefined' && DIM && DIM.cur) {
        R.last = 'dim';
        try { toast('The pop star is in the overworld - use Return to overworld first'); } catch (_) {}
        return false;
      }
      if (typeof P === 'undefined' || !P) { R.last = 'noplayer'; return false; }
      let rec = aLive;
      if (!rec) {
        let sp = pickSpawn();
        if (!sp) {
          const yaw = (typeof P.yaw === 'number') ? P.yaw : 0;
          const raw = {x: P.x + Math.sin(yaw) * 28, z: P.z + Math.cos(yaw) * 28};
          const land = findLandNear(raw.x, raw.z, 96) || findLandNear(P.x, P.z, 96);
          if (!land) {
            R.last = 'noland';
            try { toast('Could not find dry land for the pop star'); } catch (_) {}
            return false;
          }
          sp = {x: land.x, y: land.y, z: land.z, yaw: yaw + Math.PI};
        }
        rec = U.spawnAt(sp.x, sp.y, sp.z, sp.yaw);
        if (!rec) {
          R.last = 'nospawn';
          try { toast('Could not bring in the pop star'); } catch (_) {}
          return false;
        }
        U.tpSpawned = (U.tpSpawned || 0) + 1;
      }
      const p = rec.g && rec.g.position;
      if (!p) { R.last = 'nobody'; return false; }
      const sp = spotInFront(rec, 42);
      if (!sp) {
        R.last = 'nospot';
        try { toast('Could not find a safe spot by the pop star'); } catch (_) {}
        return false;
      }
      P.x = sp.x; P.y = sp.y; P.z = sp.z; P.vy = 0; P.fallTop = null;
      try { P.kbx = 0; P.kbz = 0; P.onGround = true; } catch (_) {}
      try { if (typeof flying !== 'undefined') flying = false; } catch (_) {}
      P.yaw = Math.atan2(-(p.x - P.x), -(p.z - P.z));
      // Look at mid-torso so head and feet both sit in the portrait frame.
      try {
        const eye = (P.y || 0) + 1.6;
        const mid = (p.y || 0) + ((C && C.HEIGHT) || 32) * 0.5;
        const hd = Math.max(1, Math.hypot(p.x - P.x, p.z - P.z));
        P.pitch = -Math.atan2(mid - eye, hd);
      } catch (_) {}
      try { if (typeof rebuild === 'function') rebuild(); } catch (_) {}
      try { if (typeof setPause === 'function') setPause(false); } catch (_) {}
      try { toast('Teleported to the pop star'); } catch (_) {}
      R.last = 'ok'; R.x = P.x; R.y = P.y; R.z = P.z;
      return true;
    } catch (e) { ERR('tp', e); R.last = 'err'; return false; }
  };
  U.spotInFront = spotInFront;
  U.standOk = standOk;
  U.landY = landY;
  U.rawStandY = rawStandY;
  U.isRoofOrStructure = isRoofOrStructure;
  U.footprintOk = footprintOk;
  U.isDryLand = isDryLand;
  U.isFluid = isFluid;
  U.findLandNear = findLandNear;
  U.framingDist = framingDist;


    U.alive = () => aLive;
  U.tick = tickPopstar;
  U.stopSong = stopSong;
  U.loadSong = loadSong;
  U.footGround = footGround;
  U.isHarmless = a => !!(a && (a.kind === 'popstar' || a.harmless));

  // QA hook: ?qa=popstar after the world has started will force a spawn in front of the player.
  try {
    if (typeof location !== 'undefined' && /[?&]qa=popstar\b/.test(location.search)) {
      const t = setInterval(() => {
        try {
          if (typeof started !== 'undefined' && started && typeof P !== 'undefined' && P && typeof scene !== 'undefined') {
            clearInterval(t);
            const yaw = (typeof P.yaw === 'number') ? P.yaw : 0;
            const rawX = P.x + Math.sin(yaw) * 28, rawZ = P.z + Math.cos(yaw) * 28;
            const land = findLandNear(rawX, rawZ, 96) || findLandNear(P.x, P.z, 96);
            if (land) U.spawnAt(land.x, land.y, land.z, yaw + Math.PI);
            U.qa = 1;
          }
        } catch (e) { ERR('qa', e); }
      }, 400);
    }
  } catch (_) {}

  // Warm the audio buffer once AC exists.
  try {
    const ia = initAudio;
    window.initAudio = initAudio = function () {
      const r = ia.apply(this, arguments);
      try { if (acOk()) loadSong(); } catch (e) { ERR('ia', e); }
      return r;
    };
  } catch (_) {}
})();
