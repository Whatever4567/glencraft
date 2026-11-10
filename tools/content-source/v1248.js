/* GLX-V1248 (v1.2.50): spiders no longer hunt friendly NPCs; pigs get mud pools,
   a slightly pinker upscaled skin, a bigger model, fuller movement, quieter voices;
   sparse Scottish birds; relaxing Glencraft mood music and rare cave one-shots;
   a spatialised UFO hover hum; selectable soundtrack (Calm / Classic / Happy Hardcore).
   1.2.50: Happy Hardcore is a 170 BPM UK-bounce remix (clean kick, off-beat donk,
   long drops, pitched-up Glencraft synth chops; no piano). Blue/purple crystal-cave
   and Agartha Calm beds are beatless liminal choir pads. cave1 and hell stay distinct.
   Procedural Web Audio plus the game's own music/ assets only. No third-party recordings. */
(function v1248() {
  const U = window.__v1248 = {
    err: null, ver: '1.2.50', blocked: 0, pools: 0, pigs: 0, voices: 0, squeals: 0,
    birds: 0, music: null, caveFx: 0, ufoOn: 0, mood: 'day'
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const FRIENDLY = U.FRIENDLY = new Set(['clansman', 'farmer', 'villager', 'piper', 'chief', 'agarthan', 'paladien']);
  U.isFriendly = a => !!(a && FRIENDLY.has(a.kind));
  U.isHostileMob = a => !!(a && (a.hostile || a.kind === 'nspider' || a.kind === 'spider' || a.kind === 'zombie' || a.kind === 'skeleton' || a.kind === 'blackskel' || a.kind === 'creeper' || a.kind === 'blazeskel'));

  // ---------- 1. spiders / hostiles must not target or damage friendly NPCs ----------
  function clearBadHunt(a) {
    if (!a) return;
    if (U.isFriendly(a.vic)) { a.vic = null; a.prey = false; U.blocked++; }
    if (U.isFriendly(a.target)) a.target = null;
    if (a.job && a.job.tgt && U.isFriendly(a.job.tgt)) a.job.tgt = null;
  }
  try {
    const um = updateMobs;
    window.updateMobs = updateMobs = function (dt) {
      const r = um.apply(this, arguments);
      try {
        for (const a of mobs) {
          if (U.isHostileMob(a) || a.kind === 'nspider' || a.kind === 'spider') clearBadHunt(a);
        }
      } catch (e) { ERR('hunt', e); }
      try { tickPigs1248(dt); } catch (e) { ERR('pigs', e); }
      try { tickAudio1248(dt); } catch (e) { ERR('audio', e); }
      return r;
    };
  } catch (e) { ERR('um', e); }
  try {
    const dm = damageMob;
    window.damageMob = damageMob = function (a, dmg, byPlayer) {
      try {
        if (a && U.isFriendly(a) && !byPlayer) {
          let hunter = false;
          for (const m of mobs) {
            if ((U.isHostileMob(m) || m.kind === 'nspider' || m.kind === 'spider') && m.vic === a) { hunter = true; break; }
          }
          if (hunter) { U.blocked++; return a; }
        }
        if (a && a.kind === 'pig' && byPlayer) pigSqueal(a);
      } catch (e) { ERR('dm', e); }
      return dm.apply(this, arguments);
    };
  } catch (e) { ERR('dmw', e); }

  // ---------- 2. pigs: scale, upright unless wallowing, love-mud, quieter voices ----------
  const PIG_SCALE = 1.4;
  try {
    if (window.__c136 && __c136.cat && __c136.cat.pig) __c136.cat.pig.k = PIG_SCALE;
    if (window.__c1018 && __c1018.cat && __c1018.cat.pig) __c1018.cat.pig.k = PIG_SCALE;
    // the live HD catalogue lives on the first module that set U.cat.pig
    const cats = [window.__c135, window.__c136, window.__hd, window.__c257];
    for (const C of cats) if (C && C.cat && C.cat.pig) C.cat.pig.k = PIG_SCALE;
  } catch (e) { ERR('scale-cat', e); }
  // walk the known catalogue object used by the HD loader (GLX-C135 / later U.add)
  try {
    for (const k of Object.keys(window)) {
      const o = window[k];
      if (o && o.cat && o.cat.pig && o.cat.pig.f === 'pig2') { o.cat.pig.k = PIG_SCALE; U.pigCat = k; }
    }
  } catch (e) { ERR('scale-scan', e); }

  try {
    const mp = makePig;
    window.makePig = makePig = function () {
      const a = mp.apply(this, arguments);
      try {
        if (a) {
          a.hitY = (a.hitY || 0.55) * PIG_SCALE;
          a.hitR = (a.hitR || 0.7) * PIG_SCALE;
          a.tall = (a.tall || 1) * PIG_SCALE;
          U.pigs++;
        }
      } catch (e) { ERR('mkpig', e); }
      return a;
    };
  } catch (e) { ERR('mpw', e); }

  const TMP = {q: null, v: null};
  function ensureTmp() {
    if (typeof THREE === 'undefined') return false;
    if (!TMP.q) { TMP.q = new THREE.Quaternion(); TMP.v = new THREE.Vector3(); }
    return true;
  }

  function pigOnMud(a) {
    try {
      const p = a.g.position, x = Math.floor(p.x), z = Math.floor(p.z), y = Math.floor(p.y - 0.5);
      const b = (typeof getB === 'function') ? getB(x, y, z) : 0;
      return b === T.MUD || b === T.PEAT;
    } catch (_) { return false; }
  }

  // Snap the procedural rig and the HD overlay back onto their feet.
  // The old 1 s interval (and leftover S.r) could leave a pig on its side on grass.
  function forceUpright(a) {
    const S = a.p8;
    if (S) {
      S.r = 0; S.sink = 0;
      if (S.st === 'down' || S.st === 'lie' || S.st === 'roll' || S.st === 'up') {
        S.st = 'roam'; S.t = 0; S.next = 4 + Math.random() * 6; S.upFast = 0;
      }
    }
    if (a.rig) { a.rig.rotation.z = 0; a.rig.position.x = 0; /* y is set by tickPig; zero the roll offset */ a.rig.position.y = 0; }
    const H = a.__hd;
    if (H && H.hd) { H.hd.rotation.z = 0; H.hd.position.x = 0; }
    a.wallow = 0;
  }

  function pigWallowingOnMud(a) {
    const S = a.p8;
    if (!S) return false;
    const st = S.st;
    if (!(st === 'down' || st === 'lie' || st === 'roll' || (st === 'up' && Math.abs(S.r) > 0.05))) return false;
    return pigOnMud(a);
  }

  // four-leg diagonal gait + idle / trot / root blends; no per-frame allocs
  function posePig(a, dt) {
    const S = a.p8 || (a.p8 = {home: null, st: 'roam', t: 0, r: 0, side: 1, mud: 0, next: 6, tw: 1, twT: 0, snd: 8 + Math.random() * 12, sink: 0, g1248: 0, idleT: Math.random() * 10, rootT: 0, earT: 0, blend: 0});
    const G8 = S.g1248 || (S.g1248 = {w: 0, b: 0, root: 0, ear: 0, ear2: 0, tail: 0, nod: 0});
    S.t = (S.t || 0) + dt;
    S.idleT = (S.idleT || 0) + dt;
    const fleeing = a.flee > 0;
    const moving = !!(a.moving || fleeing) && S.st !== 'down' && S.st !== 'lie' && S.st !== 'roll' && S.st !== 'up' && S.st !== 'down';
    const wallow = S.st === 'down' || S.st === 'lie' || S.st === 'roll' || S.st === 'up';
    const onMud = pigOnMud(a);
    // Never stay on their side on grass — snap them upright this frame, no 0.3 s side-roll leftover.
    if (!onMud) {
      forceUpright(a);
      if (S.mud) S.mud = Math.max(0, S.mud - dt / 10);
    }

    const want = moving ? (fleeing ? 2 : 1) : 0;
    G8.w += ((want ? 1 : 0) - G8.w) * Math.min(1, dt * 6);
    G8.b += ((want === 0 && !wallow ? 1 : 0) - G8.b) * Math.min(1, dt * 4);

    // rooting / sniffing now and then while idle or wandering slowly
    if (!wallow && !fleeing && G8.root <= 0 && Math.random() < dt * 0.08) { G8.root = 1.6 + Math.random() * 1.4; if (Math.random() < 0.6) pigVoice(a, 'snuffle'); }
    if (G8.root > 0) G8.root -= dt;
    const rootK = G8.root > 0 ? Math.min(1, G8.root, (1.6 - Math.min(1.6, G8.root))) * 2 * (G8.root < 1.4 ? 1 : 0) : 0;
    const rootAmt = Math.max(0, Math.min(1, G8.root > 0 ? Math.sin(Math.min(1, G8.root / 0.4) * 1.57) * Math.sin(Math.min(1, Math.max(0, G8.root) / 1.2) * 1.57) : 0));

    const spd = fleeing ? 10.5 : 6.5;
    if (moving) S.walk = (S.walk || a.walk || 0) + dt * spd * (0.7 + 0.3 * G8.w);
    const ph = S.walk || a.walk || 0;
    const amp = (fleeing ? 0.72 : 0.48) * G8.w;
    // diagonal gait: FL+BR together, FR+BL together
    // legs: 0 FL, 1 FR, 2 BR, 3 BL
    if (a.legs && a.legs.length >= 4 && !wallow) {
      const a0 = Math.sin(ph) * amp, a1 = Math.sin(ph + Math.PI) * amp;
      a.legs[0].rotation.x = a0;
      a.legs[2].rotation.x = a0;
      a.legs[1].rotation.x = a1;
      a.legs[3].rotation.x = a1;
      // slight lift on the advancing hip
      a.legs[0].position && (a.legs[0].position.y = (a.legs[0].userData._y0 || (a.legs[0].userData._y0 = a.legs[0].position.y)));
    }

    // idle: head bob, ear and tail flicks
    G8.nod = Math.sin(S.idleT * 1.4) * 0.06 * G8.b;
    const sniff = -0.55 * rootAmt;
    if (a.head && !wallow) a.head.rotation.x = G8.nod + sniff + Math.sin(ph * 0.5) * 0.04 * G8.w;
    if (a.tail) a.tail.rotation.z = Math.sin(S.idleT * (wallow ? 9 : moving ? 8 : 3.2)) * (wallow ? 0.4 : 0.28);

    if (G8.ear <= 0 && Math.random() < dt * 0.35) G8.ear = 0.28;
    if (G8.ear > 0) G8.ear -= dt;
    const earFlick = G8.ear > 0 ? Math.sin((0.28 - G8.ear) / 0.28 * Math.PI) * 0.45 : 0;

    // HD skeleton extras: ears (Bone.016 / Bone.018 or oci), snout (Bone.003)
    const H = a.__hd;
    if (H && H.hd) {
      if (!H.b1248) {
        const b = H.b1248 = {earL: null, earR: null, snout: null, rest: {}};
        H.hd.traverse(o => {
          const n = o.name || '';
          if (n === 'Bone.016' || n === 'oci') b.earL = o;
          else if (n === 'Bone.018' || n === 'oci2') b.earR = o;
          else if (n === 'Bone.003') b.snout = o;
        });
        for (const k of ['earL', 'earR', 'snout']) if (b[k]) b.rest[k] = b[k].rotation.z;
      }
      const b = H.b1248;
      if (b.earL) b.earL.rotation.z = (b.rest.earL || 0) + earFlick;
      if (b.earR) b.earR.rotation.z = (b.rest.earR || 0) - earFlick * 0.85;
      if (b.snout) b.snout.rotation.x = (b.rest.snout || 0) + Math.sin(S.idleT * 9) * 0.12 * rootAmt;
    }

    // love mud: if roaming and a pool is near, wander to it (tickPig already does goMud; nudge more often)
    if (S.st === 'roam' && !fleeing && S.next > 2 && onMud && Math.random() < dt * 0.05) {
      S.st = 'down'; S.t = 0; S.side = Math.random() < 0.5 ? 1 : -1; pigVoice(a, 'happy');
    }
  }

  function tickPigs1248(dt) {
    if (typeof mobs === 'undefined') return;
    const d = Math.min(0.1, dt || 0.016);
    for (const a of mobs) {
      if (!a || a.kind !== 'pig') continue;
      posePig(a, d);
      // quieter, sparser voices
      schedulePigVoice(a, d);
    }
  }

  // Drive the pig2 GLB walk clip (c310 set noclip, so c135.animate never plays it, then
  // c302/c310 overwrite the bones). Run last on the HD frame list so the clip wins, and
  // so a leftover side-roll from the rig cannot be copied onto the visible model on grass.
  function drivePigClip(a, H, wallow) {
    if (H.mix && (!H.act || !(H.act.walk || H.act.Walk))) {
      try {
        const _pm = window.__c135 && window.__c135.models; const clips = (_pm && ((_pm.pig3 && _pm.pig3.clips) || (_pm.pig2 && _pm.pig2.clips))) || {};
        H.act = H.act || {};
        for (const r in clips) if (!H.act[r]) H.act[r] = H.mix.clipAction(clips[r]);
      } catch (_) {}
    }
    const walk = H.act && (H.act.walk || H.act.Walk);
    if (!walk || !H.mix) return;
    if (!H._p1248clip) {
      try { H.mix.stopAllAction(); } catch (_) {}
      walk.reset().play();
      walk.setLoop(THREE.LoopRepeat, Infinity);
      walk.setEffectiveWeight(0);
      H._p1248clip = 1;
    }
    const idle = H.act && (H.act.idle || H.act.Idle);
    if (idle && !H._pIdleOn) {
      try { idle.reset().play(); idle.setLoop(THREE.LoopRepeat, Infinity); idle.setEffectiveWeight(0); H._pIdleOn = 1; } catch (_) {}
    }
    const moving = !wallow && !!(a.moving || a.flee > 0 || (H.v || 0) > 0.25);
    if (wallow) { walk.setEffectiveWeight(0); if (idle) idle.setEffectiveWeight(0); }
    else {
      walk.setEffectiveWeight(moving ? 1 : 0);
      if (idle) idle.setEffectiveWeight(moving ? 0 : 1);
      if (moving) walk.timeScale = Math.max(0.55, Math.min(2.2, (H.v || a.speed || 1) / 1.3));
    }
    // Do not reset pig2 bones to bind: that drops the Armature transform and hangs the mesh.
    try { H.mix.update(0); } catch (_) {}
  }

  function hookPigHdFrame() {
    const C = window.__c135;
    if (!C || !C.frame) return false;
    if (C.__v1248pig) return true;
    C.__v1248pig = 1;
    try { if (C.cat && C.cat.pig) C.cat.pig.k = PIG_SCALE; } catch (_) {}
    C.frame.push(function (a, H, c) {
      if (!a || a.kind !== 'pig' || !H || !H.hd) return;
      try {
        const onMud = pigOnMud(a);
        const wallow = pigWallowingOnMud(a);
        // The pig2 GLB faces along X; the hidden procedural body faces +Z, and
        // tickPig rolls around Z to lie on its side. Yaw the model once so a
        // Z roll is a side-lie, not a somersault.
        if (!H._yaw1248 && H.m && typeof THREE !== 'undefined') {
          const tip = H.m.getObjectByName('Bone003') || H.m.getObjectByName('Bone002') || (c && c.f !== 'pig3' ? H.m.getObjectByName('Snout') : null);
          if (tip && a.g) {
            a.g.updateMatrixWorld(true); H.m.updateMatrixWorld(true);
            const w = tip.getWorldPosition(new THREE.Vector3());
            const l = a.g.worldToLocal(w.clone());
            if (Math.abs(l.x) > Math.abs(l.z) + 0.05) {
              H.m.rotation.y += (l.x < 0 ? Math.PI / 2 : -Math.PI / 2);
              H.m.updateMatrixWorld(true);
            }
          }
          H._yaw1248 = 1;
        }
        if (!wallow) {
          if (a.rig) { a.rig.rotation.z = 0; a.rig.position.x = 0; }
          H.hd.rotation.z = 0;
          H.hd.position.x = 0;
          if (a.rig) H.hd.position.y = a.rig.position.y || 0;
        }
        drivePigClip(a, H, wallow);
      } catch (e) { ERR('hdframe', e); }
    });
    return true;
  }
  if (!hookPigHdFrame()) {
    const t = setInterval(() => { if (hookPigHdFrame()) clearInterval(t); }, 200);
  }
  U.hookPigHdFrame = hookPigHdFrame;
  U.forceUpright = forceUpright;
  U.pigWallowingOnMud = pigWallowingOnMud;
  U.drivePigClip = drivePigClip;

  // ----- pig voices: 8-25 s each, global cap, quiet, spatialised -----
  const pigLive = U.pigLive = [];
  const PIG_VOL = 0.16; // noticeably quieter than other mobs
  function outPig(vol, pan) {
    if (typeof AC === 'undefined' || !AC) return null;
    const g = AC.createGain(); g.gain.value = Math.max(0, vol);
    if (AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = pan || 0; g.connect(p); p.connect(typeof master !== 'undefined' && master ? master : AC.destination); }
    else g.connect(typeof master !== 'undefined' && master ? master : AC.destination);
    return g;
  }
  function pigPan(a) {
    try {
      if (!a || !a.g || typeof camera === 'undefined') return 0;
      const dx = a.g.position.x - camera.position.x, dz = a.g.position.z - camera.position.z;
      const d = Math.hypot(dx, dz) || 1;
      const fx = -Math.sin(P.yaw || 0), fz = -Math.cos(P.yaw || 0);
      const rx = fz, rz = -fx;
      return Math.max(-0.9, Math.min(0.9, (dx * rx + dz * rz) / Math.max(4, d)));
    } catch (_) { return 0; }
  }
  function pigDistGain(a) {
    try {
      if (!a || !a.g) return 0.4;
      const d = Math.hypot(a.g.position.x - P.x, a.g.position.y - P.y, a.g.position.z - P.z);
      if (d > 42) return 0;
      return 1 / (1 + d * d / 64);
    } catch (_) { return 0.3; }
  }
  function procPig(kind, a) {
    if (typeof AC === 'undefined' || !AC) return false;
    try {
      if (AC.state === 'suspended') try { AC.resume(); } catch (_) {}
      const t = AC.currentTime + 0.02, v = PIG_VOL * pigDistGain(a) * (typeof SET !== 'undefined' ? (SET.sfx == null ? 0.8 : SET.sfx) : 0.8);
      if (v < 0.002) return false;
      if (pigLive.length >= 2 && kind !== 'squeal') return false;
      const out = outPig(1, pigPan(a)); if (!out) return false;
      const osc = (type, f0, f1, dur, g0) => {
        const o = AC.createOscillator(), g = AC.createGain(); o.type = type;
        o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(g0 * v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = (f0 + (f1 || f0)) * 0.5; f.Q.value = 1.4;
        o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
      };
      const noise = (dur, freq, q, g0) => {
        const n = Math.ceil(AC.sampleRate * dur), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
        let lp = 0; for (let i = 0; i < n; i++) { lp = lp * 0.92 + (Math.random() * 2 - 1) * 0.2; d[i] = lp; }
        const s = AC.createBufferSource(); s.buffer = b;
        const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
        const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(g0 * v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.02);
      };
      if (kind === 'snuffle') { noise(0.18, 900, 0.8, 0.7); noise(0.12, 1400, 1.1, 0.4); }
      else if (kind === 'happy') { osc('sawtooth', 160, 220, 0.22, 0.55); osc('sine', 320, 280, 0.18, 0.2); }
      else if (kind === 'squeal') { osc('sawtooth', 620, 880, 0.28, 0.7); osc('square', 980, 700, 0.22, 0.2); noise(0.2, 1800, 0.7, 0.25); }
      else if (kind === 'snort') { noise(0.14, 520, 1.6, 0.8); osc('sawtooth', 90, 70, 0.12, 0.25); }
      else { osc('sawtooth', 130 + Math.random() * 25, 85, 0.28, 0.65); osc('sine', 70, 55, 0.26, 0.2); } // oink
      pigLive.push(1); setTimeout(() => pigLive.pop(), 400);
      U.voices++; U.lastVoice = kind; return true;
    } catch (e) { ERR('vox', e); return false; }
  }
  function pigVoice(a, kind) { procPig(kind, a); }
  function pigSqueal(a) { if (a && a._sq1248 && performance.now() - a._sq1248 < 400) return; if (a) a._sq1248 = performance.now(); U.squeals++; pigVoice(a, 'squeal'); }
  U.pigVoice = pigVoice; U.pigSqueal = pigSqueal; U.PIG_VOL = PIG_VOL;

  function schedulePigVoice(a, dt) {
    const S = a.p8; if (!S) return;
    S.snd = (S.snd == null ? 8 + Math.random() * 17 : S.snd) - dt;
    if (S.snd > 0) return;
    S.snd = 8 + Math.random() * 17;
    if (pigLive.length >= 2) { S.snd = 2 + Math.random() * 3; return; }
    if (S.st === 'lie' || S.st === 'roll' || S.st === 'down') pigVoice(a, 'happy');
    else if (S.g1248 && S.g1248.root > 0) pigVoice(a, 'snuffle');
    else pigVoice(a, Math.random() < 0.45 ? 'snort' : 'oink');
  }

  // lower any existing pig recordings / procedural oinks
  try {
    const ps = playSound;
    window.playSound = playSound = function (kind, vol, pan, m) {
      if (kind === 'oink' || kind === 'oink2' || kind === 'snort') {
        const v = (vol == null ? 1 : vol) * 0.28;
        // prefer our quiet procedural voice when a nearby pig exists
        let a = null; try { for (const m2 of mobs) if (m2.kind === 'pig') { a = m2; break; } } catch (_) {}
        if (procPig(kind === 'oink2' ? 'oink' : kind, a || {g: {position: {x: P.x, y: P.y, z: P.z + 4}}})) return;
        return ps.call(this, kind, v, pan, m);
      }
      return ps.apply(this, arguments);
    };
  } catch (e) { ERR('ps', e); }
  try {
    const s3 = typeof sfx3d === 'function' ? sfx3d : null;
    if (s3) {
      window.sfx3d = function (kind, pos, range) {
        if (kind === 'oink' || kind === 'oink2' || kind === 'snort') {
          const a = {g: {position: pos || {x: P.x, y: P.y, z: P.z}}};
          if (procPig(kind === 'oink2' ? 'oink' : kind, a)) return;
        }
        return s3.apply(this, arguments);
      };
    }
  } catch (e) { ERR('s3', e); }

  // ---------- mud pools: deterministic, grassland + farmland, skip player edits ----------
  function rng(s) { return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
  function worldSeed() {
    try { if (typeof NSEED === 'number' && NSEED) return NSEED >>> 0; } catch (_) {}
    try { if (typeof gSeed === 'number' && gSeed) return gSeed >>> 0; } catch (_) {}
    return 0x5eed10;
  }
  function isEdit(x, y, z) {
    try { if (typeof isPlaced === 'function' && isPlaced(idx(x, y, z))) return true; } catch (_) {}
    try { if (typeof placedSet !== 'undefined' && placedSet && placedSet.has(idx(x, y, z))) return true; } catch (_) {}
    try { const e = window.__c320 && __c320.edits; if (e && e.has && e.has(x + ',' + y + ',' + z)) return true; } catch (_) {}
    return false;
  }
  function groundOk(b) { return b === T.GRASS || b === T.FARM || b === (T.DIRT); }
  function placePools1248(maxN, safe) {
    if (typeof world === 'undefined' || !world || typeof W !== 'number') return [];
    const R = rng((worldSeed() ^ 0x12480d) >>> 0), made = [], changed = [];
    const want = Math.max(6, Math.min(36, maxN || Math.round((W * D) / 90000)));
    const minD = Math.max(48, Math.min(90, Math.sqrt(W * D) / 14));
    for (let tries = 0; tries < 8000 && made.length < want; tries++) {
      const x = 16 + (R() * (W - 32)) | 0, z = 16 + (R() * (D - 32)) | 0;
      if (made.some(m => Math.hypot(m[0] - x, m[1] - z) < minD)) continue;
      let h = 0;
      try { h = typeof groundTop === 'function' ? groundTop(x, z) : ((typeof topAt === 'function' ? topAt(x, z) : 0) | 0); } catch (_) { continue; }
      if (h < SEA + 1 || h > SEA + 12) continue;
      const top = world[idx(x, h, z)];
      if (!(top === T.GRASS || top === T.FARM)) continue;
      if (safe && !safe(x, h, z)) continue;
      const rad = 2.2 + R() * 3.0, ext = Math.ceil(rad * 1.4) + 1;
      const p1 = R() * 6.28, p2 = R() * 6.28, ox = (R() - 0.5), oz = (R() - 0.5);
      const cells = [];
      for (let dx = -ext; dx <= ext; dx++) for (let dz = -ext; dz <= ext; dz++) {
        const d = Math.hypot(dx + ox, dz + oz), th = Math.atan2(dz + oz, dx + ox);
        const lim = rad * (1 + 0.22 * Math.sin(2 * th + p1) + 0.12 * Math.sin(3 * th + p2));
        if (d > lim) continue;
        const X = x + dx, Z = z + dz; if (X < 2 || Z < 2 || X >= W - 2 || Z >= D - 2) continue;
        if (world[idx(X, h, Z)] !== top) continue;
        if (isEdit(X, h, Z)) continue;
        let clear = true;
        for (let y = h + 1; y <= h + 2; y++) {
          const b = world[idx(X, y, Z)];
          if (b && b !== T.AIR && !(typeof PLANT !== 'undefined' && PLANT[b] === 1)) { clear = false; break; }
        }
        if (clear) cells.push([X, Z]);
      }
      if (cells.length < 10) continue;
      for (const [X, Z] of cells) {
        world[idx(X, h, Z)] = T.MUD;
        const ab = world[idx(X, h + 1, Z)];
        if (ab && typeof PLANT !== 'undefined' && PLANT[ab] === 1) world[idx(X, h + 1, Z)] = T.AIR;
        changed.push([X, Z]);
        try { markDirty(X, Z); } catch (_) {}
      }
      made.push([x, z, h, cells.length]);
    }
    U.pools = (U.pools || 0) + made.length; U.placed = made;
    try { if (window.__c118) { __c118.flag = 1; __c118.wref = null; __c118.cdirty = 1; } } catch (_) {}
    return changed;
  }
  U.placePools = placePools1248;
  try {
    const gen = generate;
    window.generate = generate = function () {
      const r = gen.apply(this, arguments);
      try {
        if (!DIM.cur && !cityGen && W >= 200) {
          const have = window.__c118 && __c118.placed && __c118.placed.length;
          if (!have || __c118.placed.length < 4) placePools1248();
          U.genPools = 1;
        }
      } catch (e) { ERR('gen', e); }
      return r;
    };
  } catch (e) { ERR('genw', e); }
  try {
    const ew = enterWorld;
    window.enterWorld = enterWorld = function (save) {
      const r = ew.apply(this, arguments);
      try {
        U.needPools = !!(save && !save.v1248pools && !DIM.cur);
        if (!save) U.needPools = false; // new worlds go through generate
      } catch (e) { ERR('ew', e); }
      return r;
    };
    const ser = serialize;
    window.serialize = serialize = function () {
      const d = ser.apply(this, arguments);
      try { if (d && !DIM.cur) d.v1248pools = 1; } catch (_) {}
      return d;
    };
  } catch (e) { ERR('save', e); }
  setInterval(() => {
    try {
      if (!U.needPools || !started || DIM.cur || typeof world === 'undefined' || !world) return;
      U.needPools = false;
      const safe = (x, y, z) => {
        if (Math.hypot(x - P.x, z - P.z) < 16) return false;
        return !isEdit(x, y, z);
      };
      placePools1248(8, safe);
    } catch (e) { ERR('oldp', e); }
  }, 1200);

  // ---------- 3. audio director: music, rare cave one-shots, UFO hover ----------
  let mus = null, musMood = '', musNext = 0, musGapUntil = 0, fadeOut = null;
  let caveNext = 0, ufoNodes = null, ufoLast = 0, lastPos = {x: 0, y: 0, z: 0, t: 0};

  function acOk() {
    if (typeof AC === 'undefined' || !AC) return false;
    if (AC.state === 'suspended') try { AC.resume(); } catch (_) {}
    return AC.state !== 'suspended';
  }
  function masterVol() {
    try { return Math.max(0, Math.min(1, SET && SET.music != null ? SET.music : 0.7)); } catch (_) { return 0.7; }
  }
  function sfxVol() {
    try { return Math.max(0, Math.min(1, SET && SET.sfx != null ? SET.sfx : 0.8)); } catch (_) { return 0.8; }
  }

  function detectMood() {
    try {
      if (typeof DIM !== 'undefined' && DIM && DIM.cur === 'hell') return 'hell';
      if (typeof DIM !== 'undefined' && DIM && DIM.cur === 'agartha') return 'agartha';
      const night = typeof isNight !== 'undefined' && isNight;
      const cave = window.__uks && __uks.cave;
      let layer = 0;
      if (window.__v1217 && typeof __v1217.layer === 'function' && typeof P !== 'undefined') layer = __v1217.layer(P.y);
      else if (window.__uks && __uks.band >= 0) {
        const b = __uks.band;
        layer = b <= 1 ? 1 : (b === 4 || b === 1 ? 2 : b >= 3 && b !== 4 && b < 6 ? 4 : 3);
      }
      if (cave || (typeof P !== 'undefined' && P.y < 0 && window.__uks && __uks.enc)) {
        if (layer >= 4 || (typeof P !== 'undefined' && P.y < -153)) return 'hell';
        if (layer === 3 || (typeof P !== 'undefined' && P.y < -100)) return 'purple';
        if (layer === 2 || (typeof P !== 'undefined' && P.y < -50)) return 'blue';
        return 'cave1';
      }
      return night ? 'night' : 'day';
    } catch (_) { return 'day'; }
  }
  U.detectMood = detectMood;

  function stopBed(node, sec) {
    if (!node || !node.gain) return;
    try {
      const t = AC.currentTime, g = node.gain.gain;
      g.cancelScheduledValues(t); g.setTargetAtTime(0.0001, t, Math.max(0.05, sec / 3));
      setTimeout(() => { try { node.stop && node.stop(); node.gain.disconnect(); } catch (_) {} }, (sec + 0.4) * 1000);
    } catch (_) {}
  }

  // Liminal crystal-cave / Agartha beds (1.2.50): beatless, no hook, no percussion.
  // Breath choir pad, sparse glassy bells, sub drone, long cavernous reverb.
  // Blue, purple and Agartha share the style but not the key, vowel or pace.
  // cave1 and hell keep their 1.2.48 character and stay distinct.
  const LIMINAL = {
    blue: {
      chords: [
        [69.30, 103.83, 155.56, 207.65, 311.13],
        [65.41, 110.00, 164.81, 220.00, 329.63],
        [51.91, 103.83, 155.56, 207.65, 311.13],
        [61.74, 123.47, 185.00, 246.94, 369.99]
      ],
      formants: [780, 1450, 2450], sub: 34.65,
      bells: [1108.7, 1318.5, 1661.2, 1975.5, 2217.5, 2637.0],
      ir: 6.5, wet: 0.78, lp: 2800, lfo: 0.055, bellGap: [6, 14], chordSec: [12, 18]
    },
    purple: {
      chords: [
        [92.50, 110.00, 138.59, 185.00, 277.18],
        [73.42, 110.00, 146.83, 220.00, 293.66],
        [82.41, 103.83, 155.56, 207.65, 311.13],
        [82.41, 123.47, 164.81, 246.94, 329.63]
      ],
      formants: [620, 1180, 2100], sub: 30.87,
      bells: [830.6, 987.8, 1244.5, 1480.0, 1661.2, 1975.5],
      ir: 7.0, wet: 0.8, lp: 2200, lfo: 0.042, bellGap: [8, 16], chordSec: [13, 20]
    },
    agartha: {
      chords: [
        [73.42, 110.00, 146.83, 164.81, 220.00],
        [77.78, 110.00, 155.56, 196.00, 233.08],
        [87.31, 110.00, 174.61, 220.00, 261.63],
        [65.41, 110.00, 130.81, 196.00, 261.63]
      ],
      formants: [520, 980, 1800], sub: 36.71,
      bells: [587.3, 698.5, 880.0, 1174.7, 1396.9],
      ir: 8.5, wet: 0.84, lp: 1800, lfo: 0.033, bellGap: [10, 20], chordSec: [16, 24]
    }
  };
  function makeCaveIR(sec) {
    const n = Math.floor(AC.sampleRate * sec);
    const b = AC.createBuffer(2, n, AC.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) {
        const e = Math.pow(1 - i / n, 2.5);
        d[i] = (Math.random() * 2 - 1) * e;
      }
    }
    return b;
  }
  const MOOD_FILE = {blue: 'music/mood_blue.ogg?v=1.2.54', purple: 'music/mood_purple.ogg?v=1.2.54', agartha: 'music/mood_agartha.ogg?v=1.2.54'};
  let moodBufs = {}, moodLoads = {};
  function loadMoodLoop(mood) {
    const src = MOOD_FILE[mood];
    if (!src) return Promise.resolve(null);
    if (moodLoads[mood]) return moodLoads[mood];
    if (!acOk()) return Promise.resolve(null);
    const trySrc = s => fetch(s).then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => AC.decodeAudioData(b.slice(0)));
    moodLoads[mood] = trySrc(src).catch(() => trySrc(src.replace('.ogg', '.mp3')))
      .then(buf => { moodBufs[mood] = buf; return buf; }).catch(() => null);
    return moodLoads[mood];
  }
  function startMoodFile(mood, out, bag, t0) {
    const startBuf = buf => {
      if (mus !== bag || !buf) return false;
      try {
        const src = AC.createBufferSource();
        src.buffer = buf; src.loop = true;
        src.connect(out); src.start(t0 || AC.currentTime);
        bag.osc.push({ stop() { try { src.stop(); } catch (_) {} } });
        bag.src = src; U.moodMode = 'loop';
        return true;
      } catch (_) { return false; }
    };
    if (moodBufs[mood] && startBuf(moodBufs[mood])) return true;
    loadMoodLoop(mood).then(buf => { if (buf && mus === bag && !bag.src) startBuf(buf); });
    return !!moodBufs[mood];
  }
  try { ['blue', 'purple', 'agartha'].forEach(m => { try { loadMoodLoop(m); } catch (_) {} }); } catch (_) {}

  function startLiminalBed(mood, out, bag, t0) {

    const spec = LIMINAL[mood];
    if (!spec) return;
    const bus = AC.createGain();
    const dry = AC.createGain(); dry.gain.value = Math.max(0.18, 1 - spec.wet * 0.85);
    const wet = AC.createGain(); wet.gain.value = spec.wet;
    const conv = AC.createConvolver();
    try { conv.buffer = makeCaveIR(spec.ir); } catch (_) {}
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = spec.lp;
    bus.connect(lp); lp.connect(dry); dry.connect(out);
    try { lp.connect(conv); conv.connect(wet); wet.connect(out); } catch (_) { /* convolver optional */ }
    bag.osc.push({ stop() { try { conv.disconnect(); } catch (_) {} try { bus.disconnect(); } catch (_) {} } });

    // Breath choir: 5 voices, 2-3 oscillators each, formant bandpass, slow swell LFO.
    // Frequencies drift to the next modal chord and never cadence home.
    const voices = [];
    const chord0 = spec.chords[0];
    for (let i = 0; i < chord0.length; i++) {
      const f0 = chord0[i];
      const vg = AC.createGain(); vg.gain.value = 0.07 / (1 + 0.06 * i);
      const bp = AC.createBiquadFilter(); bp.type = 'bandpass';
      bp.frequency.value = spec.formants[1]; bp.Q.value = 1.1;
      const bp2 = AC.createBiquadFilter(); bp2.type = 'bandpass';
      bp2.frequency.value = spec.formants[0]; bp2.Q.value = 0.9;
      const mix = AC.createGain(); mix.gain.value = 1;
      const o1 = AC.createOscillator(); o1.type = 'sine'; o1.frequency.value = f0;
      const o2 = AC.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f0 * 1.0035;
      const o3 = AC.createOscillator(); o3.type = 'sine'; o3.frequency.value = f0 * 0.9965;
      o1.connect(mix); o2.connect(mix); o3.connect(mix);
      mix.connect(bp); mix.connect(bp2); bp.connect(vg); bp2.connect(vg); vg.connect(bus);
      const lfo = AC.createOscillator(); lfo.frequency.value = spec.lfo * (0.85 + 0.3 * i / 5);
      const lg = AC.createGain(); lg.gain.value = vg.gain.value * 0.35;
      lfo.connect(lg); lg.connect(vg.gain);
      // tiny pitch drift
      const pLfo = AC.createOscillator(); pLfo.frequency.value = 0.03 + 0.01 * i;
      const pg = AC.createGain(); pg.gain.value = f0 * 0.003;
      pLfo.connect(pg); pg.connect(o1.frequency); pg.connect(o2.frequency);
      o1.start(t0); o2.start(t0); o3.start(t0); lfo.start(t0); pLfo.start(t0);
      bag.osc.push(o1, o2, o3, lfo, pLfo);
      voices.push({o1, o2, o3, f0});
    }
    // Subtle breath hiss
    try {
      const nn = Math.ceil(AC.sampleRate * 4), nb = AC.createBuffer(1, nn, AC.sampleRate), nd = nb.getChannelData(0);
      for (let i = 0; i < nn; i++) nd[i] = Math.random() * 2 - 1;
      const ns = AC.createBufferSource(); ns.buffer = nb; ns.loop = true;
      const nbp = AC.createBiquadFilter(); nbp.type = 'bandpass'; nbp.frequency.value = spec.formants[1]; nbp.Q.value = 0.7;
      const ng = AC.createGain(); ng.gain.value = 0.012;
      ns.connect(nbp); nbp.connect(ng); ng.connect(bus); ns.start(t0);
      bag.osc.push({ stop() { try { ns.stop(); } catch (_) {} } });
    } catch (_) {}

    // Deep sub drone
    const sub = AC.createOscillator(); sub.type = 'sine'; sub.frequency.value = spec.sub;
    const sg = AC.createGain(); sg.gain.value = 0.16;
    const sLfo = AC.createOscillator(); sLfo.frequency.value = 0.03;
    const sLg = AC.createGain(); sLg.gain.value = spec.sub * 0.004;
    sLfo.connect(sLg); sLg.connect(sub.frequency);
    const sLp = AC.createBiquadFilter(); sLp.type = 'lowpass'; sLp.frequency.value = 80;
    sub.connect(sLp); sLp.connect(sg); sg.connect(out);
    sub.start(t0); sLfo.start(t0); bag.osc.push(sub, sLfo);

    // Slow chord drift (never a V–i landing — just cycle the modal set)
    let cix = 0;
    const retune = () => {
      if (mus !== bag) return;
      if (!acOk()) return;
      cix = (cix + 1) % spec.chords.length;
      const ch = spec.chords[cix], t = AC.currentTime, ramp = 5.5;
      for (let i = 0; i < voices.length && i < ch.length; i++) {
        const f = ch[i];
        try {
          voices[i].o1.frequency.linearRampToValueAtTime(f, t + ramp);
          voices[i].o2.frequency.linearRampToValueAtTime(f * 1.0035, t + ramp);
          voices[i].o3.frequency.linearRampToValueAtTime(f * 0.9965, t + ramp);
        } catch (_) {}
      }
      const wait = spec.chordSec[0] + Math.random() * (spec.chordSec[1] - spec.chordSec[0]);
      bag._chordTimer = setTimeout(retune, wait * 1000);
    };
    bag._chordTimer = setTimeout(retune, (spec.chordSec[0] + Math.random() * 3) * 1000);

    // Sparse glassy crystal bells that drip and fade — not a melody
    const ding = () => {
      if (mus !== bag) return;
      if (!acOk()) return;
      const t = AC.currentTime;
      const f = spec.bells[(Math.random() * spec.bells.length) | 0] * Math.pow(2, (Math.random() * 0.3 - 0.15) / 12);
      const dur = mood === 'agartha' ? 8 : 6.5;
      const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const oH = AC.createOscillator(); oH.type = 'sine'; oH.frequency.value = f * 2.003;
      const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime((mood === 'agartha' ? 0.045 : 0.06) * masterVol(), t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const pan = (AC.createStereoPanner ? AC.createStereoPanner() : null);
      if (pan) pan.pan.value = Math.random() * 1.4 - 0.7;
      o.connect(g); oH.connect(g);
      if (pan) { g.connect(pan); pan.connect(bus); } else g.connect(bus);
      o.start(t); oH.start(t); o.stop(t + dur + 0.05); oH.stop(t + dur + 0.05);
      const gap = spec.bellGap[0] + Math.random() * (spec.bellGap[1] - spec.bellGap[0]);
      bag._bellTimer = setTimeout(ding, gap * 1000);
    };
    bag._bellTimer = setTimeout(ding, (2 + Math.random() * 3) * 1000);

    const _stop = bag.stop;
    bag.stop = function () {
      try { clearTimeout(bag._chordTimer); clearTimeout(bag._bellTimer); } catch (_) {}
      _stop && _stop.call(bag);
    };
  }
  // Celtic / Scottish ambient beds: soft pads, harp-like plucks, low whistle or drone
  function startBed(mood) {
    if (!acOk()) return null;
    const t0 = AC.currentTime, out = AC.createGain();
    const VOL = {day: 0.11, night: 0.09, cave1: 0.1, blue: 0.055, purple: 0.05, agartha: 0.055, hell: 0.11}[mood] || 0.1;
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.linearRampToValueAtTime(VOL * masterVol(), t0 + 3.5);
    out.connect(typeof master !== 'undefined' && master ? master : AC.destination);
    const bag = {gain: out, osc: [], stop() { for (const o of bag.osc) try { o.stop(); } catch (_) {} try { out.disconnect(); } catch (_) {} }, mood};

    const pad = (freqs, type, gain, lfoHz) => {
      for (const f of freqs) {
        const o = AC.createOscillator(); o.type = type || 'sine'; o.frequency.value = f;
        const g = AC.createGain(); g.gain.value = gain;
        const f1 = AC.createBiquadFilter(); f1.type = 'lowpass'; f1.frequency.value = mood === 'hell' ? 420 : mood === 'night' ? 900 : 1400;
        if (lfoHz) {
          const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = lfoHz; lg.gain.value = f * 0.004;
          l.connect(lg); lg.connect(o.frequency); l.start(t0); bag.osc.push(l);
        }
        o.connect(f1); f1.connect(g); g.connect(out); o.start(t0); bag.osc.push(o);
      }
    };
    // scale tones (Hz) — D mixolydian-ish / pentatonic
    if (mood === 'day') {
      pad([73, 110, 146.8, 220], 'sine', 0.22, 0.07);
      pad([329.6, 392], 'triangle', 0.06, 0.11);
    } else if (mood === 'night') {
      pad([55, 82.4, 123.5], 'sine', 0.28, 0.05);
      pad([196], 'triangle', 0.05, 0.08);
    } else if (mood === 'cave1') {
      pad([65.4, 98, 146.8], 'sine', 0.26, 0.04);
    } else if (mood === 'blue' || mood === 'purple' || mood === 'agartha') {
      if (!startMoodFile(mood, out, bag, t0)) { startLiminalBed(mood, out, bag, t0); if (!bag.src) bag.src = 'procedural'; }
    } else {
      pad([36.7, 49, 73.4, 92.5], 'sine', 0.3, 0.04);
      pad([110], 'triangle', 0.06, 0.07);
    }

    // occasional harp / whistle notes over the pad (not busy)
    const roots = {
      day: [220, 246.9, 293.7, 329.6, 370, 392, 440],
      night: [164.8, 196, 220, 246.9, 293.7],
      cave1: [146.8, 174.6, 196, 220],
      blue: [246.9, 277.2, 329.6, 370, 415.3],
      purple: [207.7, 246.9, 311.1, 349.2],
      hell: [73.4, 87.3, 98, 110]
    }[mood] || [220, 330];
    let nextN = t0 + 2 + Math.random() * 3;
    const tick = () => {
      if (mus !== bag) return;
      if (!acOk()) return;
      const t = AC.currentTime;
      if (t >= nextN) {
        nextN = t + (mood === 'day' ? 1.6 + Math.random() * 2.4 : 2.4 + Math.random() * 3.5);
        if (mood === 'blue' || mood === 'purple' || mood === 'agartha') {
          /* bells are scheduled inside startLiminalBed; no harp hook */
        } else if (Math.random() < 0.75 && masterVol() > 0.02) {
          const f = roots[(Math.random() * roots.length) | 0];
          const o = AC.createOscillator(); o.type = mood === 'day' ? 'triangle' : 'sine';
          o.frequency.setValueAtTime(f, t);
          const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime((mood === 'hell' ? 0.08 : 0.12) * masterVol(), t + 0.04);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2 + Math.random());
          const f1 = AC.createBiquadFilter(); f1.type = 'lowpass'; f1.frequency.value = 1800;
          o.connect(f1); f1.connect(g); g.connect(out); o.start(t); o.stop(t + 2.2);
        }
      }
      bag._raf = requestAnimationFrame(tick);
    };
    bag._raf = requestAnimationFrame(tick);
    bag.dur = 28 + Math.random() * 18;
    bag.t0 = t0;
    return bag;
  }

  function caveShot(mood) {
    if (!acOk()) return;
    const t = AC.currentTime + 0.02, v = 0.14 * sfxVol() * masterVol();
    if (v < 0.002) return;
    const pan = AC.createStereoPanner ? AC.createStereoPanner() : null;
    if (pan) pan.pan.value = (Math.random() * 1.6 - 0.8);
    const dest = pan || (typeof master !== 'undefined' && master ? master : AC.destination);
    if (pan) pan.connect(typeof master !== 'undefined' && master ? master : AC.destination);
    const g0 = AC.createGain(); g0.connect(dest);
    const noiseBuf = (sec) => {
      const n = Math.ceil(AC.sampleRate * sec), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
      let lp = 0; for (let i = 0; i < n; i++) { lp = lp * 0.97 + (Math.random() * 2 - 1) * 0.15; d[i] = lp; }
      return b;
    };
    const tone = (f0, f1, dur, type, g) => {
      const o = AC.createOscillator(); o.type = type || 'sine';
      o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      const gg = AC.createGain(); gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(g * v, t + 0.02); gg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gg); gg.connect(g0); o.start(t); o.stop(t + dur + 0.05);
    };
    const nz = (dur, freq, q, g, delay) => {
      const s = AC.createBufferSource(); s.buffer = noiseBuf(dur + 0.05);
      const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      const gg = AC.createGain(); const t1 = t + (delay || 0);
      gg.gain.setValueAtTime(0.0001, t1); gg.gain.exponentialRampToValueAtTime(g * v, t1 + 0.02); gg.gain.exponentialRampToValueAtTime(0.0001, t1 + dur);
      s.connect(f); f.connect(gg); gg.connect(g0); s.start(t1); s.stop(t1 + dur + 0.05);
    };
    if (mood === 'cave1') {
      const k = Math.random();
      if (k < 0.45) { tone(1400, 700, 0.12, 'sine', 0.5); tone(1100, 500, 0.1, 'sine', 0.25); } // drip
      else if (k < 0.75) nz(0.35, 900, 0.8, 0.55); // pebble
      else { tone(85, 70, 1.8, 'sine', 0.35); nz(1.6, 280, 0.5, 0.25); } // wind moan
    } else if (mood === 'blue') {
      const k = Math.random();
      if (k < 0.55) { tone(2217, 2217, 5.5, 'sine', 0.14); tone(1661, 1661, 6.0, 'sine', 0.08); } // glassy drip
      else if (k < 0.85) { tone(2637, 1975, 4.8, 'sine', 0.12); }
      else { tone(1318, 1108, 4.0, 'sine', 0.1); }
    } else if (mood === 'purple') {
      if (Math.random() < 0.6) { tone(1661, 1480, 5.5, 'sine', 0.12); tone(987, 987, 6.0, 'sine', 0.08); }
      else { tone(207.7, 185, 3.5, 'sine', 0.1); nz(2.4, 900, 0.4, 0.08); }
    } else if (mood === 'agartha') {
      if (Math.random() < 0.55) { tone(196, 164, 3.2, 'sine', 0.16); tone(146.8, 146.8, 3.6, 'sine', 0.1); }
      else { tone(880, 698, 2.8, 'sine', 0.12); } // distant bronze drip
    } else if (mood === 'hell') {
      const k = Math.random();
      if (k < 0.4) nz(1.8, 70, 0.7, 0.6); // rumble
      else if (k < 0.75) { nz(0.9, 180, 0.6, 0.45); tone(90, 60, 0.8, 'sine', 0.2); } // lava
      else tone(55, 40, 2.2, 'sine', 0.45); // groan
    }
    U.caveFx++; U.lastCave = mood;
  }
  U.caveShot = caveShot;

  function findUfo() {
    try {
      const u = window.__c246 && __c246.ufo && __c246.ufo();
      if (u && u.g && u.st && u.st !== 'gone') return u.g.position;
    } catch (_) {}
    try {
      const u = window.__c243 && __c243.ufo && __c243.ufo();
      if (u && u.g) return u.g.position;
    } catch (_) {}
    try {
      const C = window.__c309; if (C && C.on && C.pos && !C.landed) return C.pos;
    } catch (_) {}
    return null;
  }

  function setUfoHover(pos, dt) {
    if (!acOk()) return;
    const now = AC.currentTime;
    if (!pos) {
      if (ufoNodes) {
        try { ufoNodes.gain.gain.setTargetAtTime(0.0001, now, 0.25); } catch (_) {}
        if (now - ufoLast > 2) { try { ufoNodes.stop(); } catch (_) {} ufoNodes = null; U.ufoOn = 0; }
      }
      return;
    }
    const dx = pos.x - P.x, dy = (pos.y || 0) - P.y, dz = pos.z - P.z;
    const dist = Math.hypot(dx, dy, dz);
    ufoLast = now;
    if (dist > 90) { if (ufoNodes) { ufoNodes.gain.gain.setTargetAtTime(0.0001, now, 0.4); } U.ufoOn = 0; return; }
    if (!ufoNodes) {
      const out = AC.createGain(); out.gain.value = 0.0001;
      const panner = (AC.createPanner ? AC.createPanner() : null);
      if (panner) {
        try { panner.panningModel = 'equalpower'; panner.distanceModel = 'inverse'; panner.refDistance = 10; panner.maxDistance = 90; panner.rolloffFactor = 1.1; } catch (_) {}
        out.connect(panner); panner.connect(typeof master !== 'undefined' && master ? master : AC.destination);
      } else out.connect(typeof master !== 'undefined' && master ? master : AC.destination);
      const o1 = AC.createOscillator(); o1.type = 'sine'; o1.frequency.value = 196;
      const o2 = AC.createOscillator(); o2.type = 'sine'; o2.frequency.value = 294;
      const lfo = AC.createOscillator(); lfo.frequency.value = 0.7;
      const lg = AC.createGain(); lg.gain.value = 7;
      lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
      const throb = AC.createOscillator(); throb.frequency.value = 2.2;
      const tg = AC.createGain(); tg.gain.value = 0.35;
      const g1 = AC.createGain(); g1.gain.value = 0.45;
      const g2 = AC.createGain(); g2.gain.value = 0.22;
      const low = AC.createOscillator(); low.type = 'sine'; low.frequency.value = 48;
      const lg2 = AC.createGain(); lg2.gain.value = 0.35;
      throb.connect(tg); tg.connect(g1.gain);
      o1.connect(g1); o2.connect(g2); low.connect(lg2); g1.connect(out); g2.connect(out); lg2.connect(out);
      o1.start(); o2.start(); lfo.start(); throb.start(); low.start();
      ufoNodes = {gain: out, panner, o1, o2, low, base1: 196, base2: 294, stop() { try { o1.stop(); o2.stop(); lfo.stop(); throb.stop(); low.stop(); out.disconnect(); } catch (_) {} }};
    }
    const att = Math.min(1, 14 / (dist + 6));
    const vol = 0.07 * sfxVol() * att;
    ufoNodes.gain.gain.setTargetAtTime(vol, now, 0.15);
    if (ufoNodes.panner && ufoNodes.panner.positionX) {
      try {
        ufoNodes.panner.positionX.setTargetAtTime(pos.x, now, 0.05);
        ufoNodes.panner.positionY.setTargetAtTime(pos.y || 0, now, 0.05);
        ufoNodes.panner.positionZ.setTargetAtTime(pos.z, now, 0.05);
        if (typeof camera !== 'undefined') {
          AC.listener.positionX && AC.listener.positionX.setTargetAtTime(camera.position.x, now, 0.05);
          AC.listener.positionY && AC.listener.positionY.setTargetAtTime(camera.position.y, now, 0.05);
          AC.listener.positionZ && AC.listener.positionZ.setTargetAtTime(camera.position.z, now, 0.05);
        }
      } catch (_) {}
    }
    // cheap Doppler
    const dtm = Math.max(0.016, now - (lastPos.t || now));
    const vx = (pos.x - lastPos.x) / dtm, vz = (pos.z - lastPos.z) / dtm;
    const inv = 1 / Math.max(1, dist);
    const vr = (vx * dx + vz * dz) * inv; // radial speed toward player is negative if approaching
    const dop = Math.max(0.92, Math.min(1.08, 1 - vr / 80));
    try { ufoNodes.o1.frequency.setTargetAtTime(ufoNodes.base1 * dop, now, 0.08); ufoNodes.o2.frequency.setTargetAtTime(ufoNodes.base2 * dop, now, 0.08); } catch (_) {}
    lastPos.x = pos.x; lastPos.y = pos.y || 0; lastPos.z = pos.z; lastPos.t = now;
    U.ufoOn = 1; U.ufoDist = dist;
  }
  U.findUfo = findUfo;

  // ---------- 4. soundtrack modes: Calm / Classic / Happy Hardcore ----------
  const OST_MODES = ['calm', 'classic', 'hardcore', 'album'];
  const CLASSIC_TRACKS = U.CLASSIC_TRACKS = [
    {id: 'mist', src: 'music/highland_mist.mp3'},
    {id: 'theme_ext', src: 'music/glencraft_theme_extended.mp3'},
    {id: 'dawn', src: 'music/glen_dawn.mp3'},
    {id: 'loch', src: 'music/loch_night.mp3', night: 1},
    {id: 'air', src: 'music/heather_air.mp3'},
    {id: 'cave', src: 'music/under_the_glen.mp3', cave: 1},
    {id: 'pine', src: 'music/old_pine.mp3'},
    {id: 'skye', src: 'music/skye_embers.mp3'},
    {id: 'stone', src: 'music/stone_and_peat.mp3'},
    {id: 'cairn', src: 'music/cairn.mp3'},
    {id: 'embersea', src: 'music/ember_sea.mp3', cave: 1}
  ];
  const HC_BPM = U.HC_BPM = 170;
  const HC_SPB = 60 / HC_BPM;
  // Uplifting I–V–vi–IV in D major, as note lists in Hz (D4, A4, B3, G4 voicings)
  const HC_CHORDS = [
    [146.83, 185.00, 220.00, 293.66], // D
    [220.00, 277.18, 329.63, 440.00], // A
    [123.47, 185.00, 246.94, 293.66], // Bm
    [196.00, 246.94, 293.66, 392.00]  // G
  ];
  const HC_BASS = [73.42, 110.00, 61.74, 98.00]; // D2, A2, B1, G2
  // A short Glencraft-flavoured hook in D mixolydian (from the old highland melody shape)
  const HC_HOOK = [293.66, 329.63, 369.99, 440.00, 392.00, 369.99, 329.63, 293.66];

  function soundtrack() {
    try {
      const v = SET && SET.soundtrack;
      if (v === 'classic' || v === 'hardcore' || v === 'album') return v;
    } catch (_) {}
    return 'calm';
  }
  function setSoundtrack(mode) {
    if (!OST_MODES.includes(mode)) mode = 'calm';
    try { SET.soundtrack = mode; saveSet(); } catch (_) {}
    U.ost = mode;
    applyOst(mode);
    syncOstUI();
    return mode;
  }
  U.soundtrack = soundtrack;
  U.setSoundtrack = setSoundtrack;

  try { if (typeof SET !== 'undefined' && SET && !SET.soundtrack) SET.soundtrack = 'calm'; } catch (_) {}

  function syncOstUI() {
    const seg = typeof document !== 'undefined' && document.getElementById('ostSeg');
    if (!seg) return;
    const cur = soundtrack();
    seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.ost === cur));
  }
  function bindOstUI() {
    const seg = typeof document !== 'undefined' && document.getElementById('ostSeg');
    if (!seg || seg.dataset.bound) return;
    seg.dataset.bound = '1';
    seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => setSoundtrack(b.dataset.ost)));
    try {
      const ss = syncSettingsUI;
      window.syncSettingsUI = syncSettingsUI = function () {
        const r = ss.apply(this, arguments);
        try { syncOstUI(); } catch (_) {}
        return r;
      };
    } catch (_) {}
    try {
      const as = applySet;
      window.applySet = applySet = function () {
        const r = as.apply(this, arguments);
        try { applyOstVol(); } catch (_) {}
        return r;
      };
    } catch (_) {}
    syncOstUI();
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindOstUI);
    else bindOstUI();
  }

  let classicEl = null, classicBag = [], classicCur = null, classicGap = 0, classicWanted = false;
  let hc = null, hcBufs = null, hcLoad = null;

  function stopClassic() {
    classicWanted = false;
    if (classicEl) try { classicEl.pause(); } catch (_) {}
    classicCur = null;
  }
  function classicVol() {
    return Math.max(0, Math.min(1, masterVol() * 0.72));
  }
  function tickClassic() {
    if (!classicEl) {
      classicEl = new Audio();
      classicEl.preload = 'auto';
      classicEl.addEventListener('ended', () => {
        classicGap = performance.now() + (60 + Math.random() * 120) * 1000;
        classicCur = null; classicWanted = false;
      });
      classicEl.addEventListener('error', () => {
        classicGap = performance.now() + 8000;
        classicCur = null; classicWanted = false;
      });
    }
    classicEl.volume = classicVol();
    const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    if (hidden || classicVol() < 0.01) { try { classicEl.pause(); } catch (_) {} return; }
    const playing = !classicEl.paused && !classicEl.ended && classicWanted;
    if (playing) return;
    const now = performance.now();
    if (!classicGap) classicGap = now + 1500;
    if (now < classicGap) return;
    if (!classicBag.length) {
      classicBag = CLASSIC_TRACKS.map(t => t.id).filter(id => id !== (classicCur && classicCur.id));
    }
    const mood = detectMood();
    const under = mood === 'cave1' || mood === 'blue' || mood === 'purple' || mood === 'hell';
    const night = mood === 'night';
    let id = null;
    if (under && classicBag.includes('cave')) id = 'cave';
    else if (under && classicBag.includes('embersea') && Math.random() < 0.45) id = 'embersea';
    else {
      let pool = classicBag.filter(i => (i !== 'cave' && i !== 'embersea') || under || classicBag.length === 1);
      if (!pool.length) pool = classicBag.slice();
      if (night && pool.includes('loch') && Math.random() < 0.55) id = 'loch';
      else id = pool[(Math.random() * pool.length) | 0];
    }
    const ix = classicBag.indexOf(id); if (ix >= 0) classicBag.splice(ix, 1);
    const t = CLASSIC_TRACKS.find(x => x.id === id) || CLASSIC_TRACKS[0];
    classicCur = t; classicWanted = true; U.classic = t.id;
    if (classicEl.src.indexOf(t.src) < 0) { classicEl.src = t.src; classicEl.load(); }
    else classicEl.currentTime = 0;
    const p = classicEl.play(); if (p && p.catch) p.catch(() => {});
    classicGap = now + 4000;
  }

  function stopHardcore() {
    if (!hc) return;
    const node = hc;
    hc = null;
    try {
      const t = AC.currentTime, g = node.gain.gain;
      g.cancelScheduledValues(t); g.setTargetAtTime(0.0001, t, 0.12);
      setTimeout(() => { try { node.src && node.src.stop(); node.stop && node.stop(); node.gain.disconnect(); } catch (_) {} }, 600);
    } catch (_) {}
    try { if (node.timer) clearTimeout(node.timer); } catch (_) {}
  }

  // Baked 170 BPM loop is the in-game path (cheap on Android). Procedural fallback
  // keeps the same kick + off-beat donk groove if the file is missing.
  const HC_FILE = 'music/hardcore_remix.mp3?v=1.2.54';
  const HC_FILE_OGG = 'music/hardcore_remix.ogg?v=1.2.54';
  let hcLoopBuf = null, hcLoopLoad = null;

  function loadHcLoop() {
    if (hcLoopLoad) return hcLoopLoad;
    if (!acOk()) return Promise.resolve(null);
    const trySrc = src => fetch(src).then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => AC.decodeAudioData(b.slice(0)));
    hcLoopLoad = trySrc(HC_FILE).catch(() => trySrc(HC_FILE_OGG)).then(buf => { hcLoopBuf = buf; return buf; }).catch(() => null);
    return hcLoopLoad;
  }
  function loadHcSamples() { return loadHcLoop(); }

  function hcOutVol() { return 0.55 * masterVol(); }

  function startHcFallback(state, out) {
    // Rhythm-first procedural fallback: kick, loud off-beat donk, hats, clap, no piano.
    U.hcMode = 'procedural';
    const kick = (t) => {
      const o = AC.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(47, t + 0.09);
      const g = AC.createGain(); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.18);
    };
    const donk = (t, f) => {
      const o = AC.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f * 2.1, t); o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.08);
      const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.85, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      const saw = AC.createOscillator(); saw.type = 'sawtooth'; saw.frequency.value = f;
      const sg = AC.createGain(); sg.gain.setValueAtTime(0.0001, t); sg.gain.linearRampToValueAtTime(0.45, t + 0.12); sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 620;
      o.connect(g); g.connect(out);
      saw.connect(lp); lp.connect(sg); sg.connect(out);
      o.start(t); o.stop(t + 0.18); saw.start(t); saw.stop(t + 0.3);
    };
    const clap = (t) => {
      const n = AC.sampleRate * 0.22, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (AC.sampleRate * 0.04));
      const src = AC.createBufferSource(); src.buffer = b;
      const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.7;
      const g = AC.createGain(); g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      src.connect(bp); bp.connect(g); g.connect(out); src.start(t);
    };
    const hat = (t, open) => {
      const n = AC.sampleRate * 0.16, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = AC.createBufferSource(); src.buffer = b;
      const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
      const g = AC.createGain(); const dur = open ? 0.12 : 0.04;
      g.gain.setValueAtTime(open ? 0.1 : 0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(hp); hp.connect(g); g.connect(out); src.start(t); src.stop(t + dur + 0.02);
    };
    const chop = (t, f) => {
      const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 1.2;
      const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(bp); bp.connect(g); g.connect(out); o.start(t); o.stop(t + 0.18);
    };
    const hookA = [587.33, 659.25, 739.99, 880.00, 987.77, 880.00, 739.99, 659.25];
    const sched = (t, beat) => {
      const bar = Math.floor(beat / 4);
      const sec = bar % 144;
      const inDrop = (sec >= 16 && sec < 64) || (sec >= 80 && sec < 136);
      const inBuild = (sec >= 8 && sec < 16) || (sec >= 72 && sec < 80);
      const inBreak = (sec >= 64 && sec < 72);
      const ci = bar % 4;
      kick(t);
      donk(t + HC_SPB * 0.5, HC_BASS[ci] || 73.42);
      if (beat % 2 === 1 && (inDrop || inBuild)) clap(t);
      hat(t, false);
      if (inDrop || inBuild) hat(t + HC_SPB * 0.5, true);
      if (inDrop) chop(t, hookA[beat % 8]);
    };
    const ahead = 0.35;
    const tick = () => {
      if (hc !== state) return;
      if (!acOk()) return;
      const now = AC.currentTime;
      while (state.next < now + ahead) {
        sched(state.next, state.beat);
        state.bar = Math.floor(state.beat / 4);
        state.beat++;
        state.next += HC_SPB;
      }
      try { out.gain.setTargetAtTime(hcOutVol(), now, 0.08); } catch (_) {}
      state.timer = setTimeout(tick, 40);
    };
    tick();
  }

  function startHardcore() {
    if (hc || !acOk()) return hc;
    const t0 = AC.currentTime;
    const out = AC.createGain(); out.gain.setValueAtTime(0.0001, t0); out.gain.linearRampToValueAtTime(hcOutVol(), t0 + 0.4);
    const comp = AC.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.12;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 14000;
    out.connect(lp); lp.connect(comp);
    comp.connect(typeof master !== 'undefined' && master ? master : AC.destination);
    const state = {
      gain: out, beat: 0, next: t0 + 0.05, bar: 0, timer: 0, src: null,
      stop() { try { state.src && state.src.stop(); out.disconnect(); } catch (_) {} if (state.timer) clearTimeout(state.timer); }
    };
    hc = state; U.ostPlaying = 'hardcore';
    const startBuf = buf => {
      if (hc !== state || !buf) return;
      try {
        const src = AC.createBufferSource();
        src.buffer = buf; src.loop = true;
        src.connect(out); src.start(AC.currentTime);
        state.src = src; U.hcMode = 'loop';
      } catch (_) { startHcFallback(state, out); }
    };
    if (hcLoopBuf) startBuf(hcLoopBuf);
    else {
      loadHcLoop().then(buf => {
        if (hc !== state) return;
        if (buf) startBuf(buf);
        else startHcFallback(state, out);
      });
    }
    return state;
  }
  U.startHardcore = startHardcore;

  function applyOst(mode) {
    mode = mode || soundtrack();
    U.ost = mode;
    if (mode !== 'calm' && mus) { stopBed(mus, 1.2); mus = null; }
    if (mode !== 'classic') stopClassic();
    if (mode !== 'hardcore') stopHardcore();
    if (mode !== 'album') { try { window.__v126x && __v126x.stop && __v126x.stop(); } catch (_) {} }
    if (mode === 'hardcore' && acOk()) startHardcore();
  }
  function applyOstVol() {
    if (classicEl) classicEl.volume = classicVol();
    if (hc && hc.gain && acOk()) try { hc.gain.gain.setTargetAtTime(hcOutVol(), AC.currentTime, 0.08); } catch (_) {}
  }
  U.applyOst = applyOst;

  // Keep the retired file-player (c132 / highland_mist Audio) paused when we own the music,
  // and let Classic / Happy Hardcore run on their own nodes.
  try {
    const bt = bgmTick;
    window.bgmTick = bgmTick = function () {
      const mode = soundtrack();
      if (mode === 'classic' || mode === 'hardcore') {
        try { if (typeof music !== 'undefined' && music && !music.paused) music.pause(); } catch (_) {}
        return;
      }
      return bt.apply(this, arguments);
    };
  } catch (_) {}

  function tickAudio1248(dt) {
    if (typeof started !== 'undefined' && !started) {
      if (soundtrack() === 'album') { try { window.__v126x && __v126x.tick && __v126x.tick(dt); } catch (e) { ERR('album', e); } }
      return;
    }
    if (typeof paused !== 'undefined' && paused) return;
    const mood = detectMood();
    U.mood = mood;
    const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    const vol = hidden ? 0 : masterVol();
    const ost = soundtrack();
    U.ost = ost;
    const now = (typeof AC !== 'undefined' && AC) ? AC.currentTime : 0;

    if (ost === 'album') {
      if (mus) { stopBed(mus, 1.2); mus = null; }
      stopClassic();
      stopHardcore();
      if (vol > 0.01 && !hidden) { try { window.__v126x && __v126x.tick && __v126x.tick(dt); } catch (e) { ERR('album', e); } }
      else { try { window.__v126x && __v126x.pause && __v126x.pause(); } catch (_) {} }
    } else if (ost !== 'calm') {
      if (mus) { stopBed(mus, 1.2); mus = null; }
    } else if (acOk() && vol > 0.01) {
      // Calm: crossfade on mood change, pieces of ~30-45s, then a gap of silence
      if (!mus || mus.mood !== mood) {
        if (mus) { stopBed(mus, 4); mus = null; }
        mus = startBed(mood); musMood = mood; musGapUntil = 0;
        U.music = mood;
      } else if (mus && mus.t0 && now - mus.t0 > mus.dur && musGapUntil === 0) {
        stopBed(mus, 3.5); musGapUntil = now + 8 + Math.random() * 12; mus = null; U.music = 'gap';
      } else if (!mus && musGapUntil && now >= musGapUntil) {
        mus = startBed(mood); musGapUntil = 0; U.music = mood;
      }
      if (mus && mus.gain) mus.gain.gain.setTargetAtTime((({day: 0.11, night: 0.09, cave1: 0.1, blue: 0.055, purple: 0.05, agartha: 0.055, hell: 0.11}[mood] || 0.1) * vol), now, 0.6);
    } else if (mus) {
      stopBed(mus, 1); mus = null;
    }

    if (ost === 'classic' && vol > 0.01 && !hidden) tickClassic();
    else if (ost !== 'classic') stopClassic();

    if (ost === 'hardcore' && vol > 0.01 && !hidden) {
      if (!hc) startHardcore();
      else applyOstVol();
    } else if (ost !== 'hardcore') stopHardcore();

    // rare cave one-shots (all soundtrack modes — they sit under the music)
    if (mood === 'cave1' || mood === 'blue' || mood === 'purple' || mood === 'agartha' || mood === 'hell') {
      if (!caveNext) caveNext = now + 8 + Math.random() * 20;
      if (now >= caveNext) { caveShot(mood); caveNext = now + 45 + Math.random() * 135; }
    } else caveNext = 0;

    setUfoHover(findUfo(), dt);
  }
  U.tickAudio = tickAudio1248;
  U.startBed = startBed;

  // expose a tiny debug hook
  U.forceMood = m => { U.mood = m; if (mus) { stopBed(mus, 1); mus = null; } mus = startBed(m); };
})();
