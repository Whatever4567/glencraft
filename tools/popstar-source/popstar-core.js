/* GLX-V1251 popstar core: constants, walk math, low-poly model, pose driver.
   Giant pop-star meme mob. Art is original Glencraft low-poly, modelled after the
   user's own AI TikTok (used with permission). No third-party meshes. */
(function (root) {
  const P = root.__popstarCore = root.__popstarCore || {};

  P.BPM = 93.75;
  P.BEAT = 60 / P.BPM;          // 0.64 s
  P.LOOP = 12 * 4 * P.BEAT;     // 30.72 s, matches assets/sfx/popstar_song.*
  P.HEIGHT = 32;                // top of hair, in blocks
  P.STRIDE = 11;                // one step per beat ~ 17.2 blocks/s (~38 mph)
  P.SPAWN_CHANCE = 0.18;        // per in-game dawn, outdoors, daytime, single instance
  P.LIFE = 120;                 // despawn after this many seconds (or at dusk)
  P.SONG_MP3 = 'assets/sfx/popstar_song.mp3';
  P.SONG_OGG = 'assets/sfx/popstar_song.ogg';

  // Body proportions in blocks, y=0 at the sole of a standing boot.
  const PR = P.PR = {
    bootH: 1.55, ankle: 1.55, shin: 7.35, thigh: 8.55,
    hipY: 1.55 + 7.35 + 8.55,          // 17.45
    torso: 6.55, shoulderY: 0,         // filled below
    neck: 0.85, headH: 3.25, scalpY: 0,
    hairTop: 32,
    shoulderW: 4.15, waistW: 2.55, hipW: 3.95,
    thighW: 1.15, shinW: 0.85, bootW: 1.65, bootD: 2.35,
    upperArm: 3.85, lowerArm: 3.55, hand: 1.15,
    chestW: 3.45, chestD: 1.85
  };
  PR.hipY = PR.bootH + PR.shin + PR.thigh;
  PR.shoulderY = PR.hipY + PR.torso;
  PR.chinY = PR.shoulderY + PR.neck;
  PR.scalpY = PR.chinY + PR.headH;
  PR.armLen = PR.upperArm + PR.lowerArm + PR.hand;

  // Upper-body pose sequence (seconds). After the listed cycle it repeats from 1.
  // 1 mic-to-mouth + left at collarbone; 2 left on hip; 3 left on head; 4 both arms high V.
  P.POSE_SEQ = [
    [1, 3], [2, 3], [3, 1], [2, 6], [4, 2], [2, 9], [3, 1], [2, 6], [4, 2]
  ];
  let _poseDur = 0;
  P.POSE_SEQ.forEach(p => { _poseDur += p[1]; });
  P.POSE_CYCLE = _poseDur; // 33 s, independent of the 30.72 s song loop
  P.POSE_BLEND = 0.45;

  P.poseAt = function (t) {
    const cyc = P.POSE_CYCLE;
    let u = ((t % cyc) + cyc) % cyc;
    let acc = 0, prev = P.POSE_SEQ[P.POSE_SEQ.length - 1][0], cur = 1, hold = 0;
    for (let i = 0; i < P.POSE_SEQ.length; i++) {
      const [id, dur] = P.POSE_SEQ[i];
      if (u < acc + dur) { cur = id; hold = u - acc; prev = P.POSE_SEQ[(i + P.POSE_SEQ.length - 1) % P.POSE_SEQ.length][0]; break; }
      acc += dur;
    }
    const k = P.POSE_BLEND <= 0 ? 1 : Math.min(1, hold / P.POSE_BLEND);
    // smootherstep
    const s = k * k * (3 - 2 * k);
    return { pose: cur, prev: prev, blend: s, tIn: hold };
  };

  // Walk / foot-plant state. Forward is +Z, right is +X, up is +Y.
  // Left plants on even beats (1 and 3), right on odd beats (2 and 4).
  P.stepState = function (t, opt) {
    opt = opt || {};
    const beat = P.BEAT, stride = (opt.stride != null ? opt.stride : P.STRIDE);
    const hipY0 = (opt.hipY != null ? opt.hipY : PR.hipY);
    const tSafe = (t == null || !isFinite(t)) ? 0 : t;
    const beatF = tSafe / beat;
    const step = Math.floor(beatF);
    const u = beatF - step; // [0,1) through the current beat
    const leftPlant = (step % 2 === 0);
    // Hip advances at constant speed so a planted foot does not slide.
    const hipZ = tSafe * (stride / beat);
    // Sharp hip pop toward the planted foot, then a slight settle.
    const pop = (u < 0.14) ? (u / 0.14) : (u < 0.75 ? 1 : 1 - 0.18 * (u - 0.75) / 0.25);
    const eased = pop * pop * (3 - 2 * pop);
    const side = leftPlant ? -1 : 1;
    const hipX = side * 1.05 * eased;
    const hipYaw = side * 0.07 * eased;     // slight body yaw into the step
    const hipRoll = side * 0.14 * eased;    // thrust (rot z) — keep the torso mostly upright
    const torsoRoll = -hipRoll * 0.65;      // counterbalance, keep torso upright
    const torsoSway = -hipX * 0.18;
    const headYaw = -hipYaw * 0.35;         // keep the face toward the audience / forward
    const headNod = 0.04 * Math.sin(beatF * Math.PI * 2);

    function foot(isLeft) {
      const plantedNow = isLeft ? leftPlant : !leftPlant;
      const x = (isLeft ? -1 : 1) * (PR.hipW * 0.28);
      let z, yLift = 0, planted = plantedNow;
      if (plantedNow) {
        // Planted at the position it landed at the start of this beat: hip(t0)+0.5*stride
        // hipZ at beat start = step*stride, plant z = step*stride + 0.5*stride
        z = (step + 0.5) * stride;
        yLift = 0;
      } else {
        // Swing from the previous plant (behind) to the next plant (ahead).
        // Previous plant was at (step-1+0.5)*stride, next at (step+1+0.5)*stride
        const z0 = (step - 0.5) * stride;
        const z1 = (step + 1.5) * stride;
        const su = u * u * (3 - 2 * u);
        z = z0 + (z1 - z0) * su;
        yLift = Math.sin(u * Math.PI) * 2.15; // step over terrain / a stylish kick-up
        planted = false;
      }
      return { x: x, y: yLift, z: z, planted: planted, isLeft: isLeft };
    }
    const left = foot(true), right = foot(false);
    const pose = P.poseAt(tSafe);
    return {
      t: tSafe, step: step, u: u, beatF: beatF, leftPlant: leftPlant,
      hipX: hipX, hipY: hipY0, hipZ: hipZ, hipYaw: hipYaw, hipRoll: hipRoll,
      torsoRoll: torsoRoll, torsoSway: torsoSway, headYaw: headYaw, headNod: headNod,
      left: left, right: right, pose: pose.pose, prevPose: pose.prev, poseBlend: pose.blend,
      stride: stride
    };
  };

  // Finite, bounded helpers used by tests.
  P.plantedFootWorldZ = function (t, which) {
    const s = P.stepState(t);
    return which === 'left' ? s.left.z : s.right.z;
  };

  // ---------- materials & model (requires THREE) ----------
  function C(hex) { return new THREE.Color(hex); }
  function lamb(hex, extra) {
    const o = Object.assign({ color: hex }, extra || {});
    return new THREE.MeshLambertMaterial(o);
  }

  function sequinTex(base, spark, n) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    // soft vertical folds
    for (let i = 0; i < 8; i++) {
      g.fillStyle = 'rgba(255,230,140,' + (0.08 + (i % 2) * 0.05) + ')';
      g.fillRect(i * 32 + 4, 0, 10, 256);
    }
    for (let i = 0; i < (n || 1400); i++) {
      const x = Math.random() * 256, y = Math.random() * 256;
      const s = 0.8 + Math.random() * 2.2;
      const a = 0.35 + Math.random() * 0.65;
      g.fillStyle = spark[i % spark.length].replace('ALP', a.toFixed(2));
      g.beginPath(); g.arc(x, y, s, 0, 6.3); g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    t.needsUpdate = true;
    return t;
  }

  function faceTex() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    // skin
    g.fillStyle = '#e2b08a'; g.fillRect(0, 0, 128, 128);
    // slight cheek warmth
    g.fillStyle = 'rgba(220,110,90,0.18)';
    g.beginPath(); g.ellipse(38, 78, 16, 10, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(90, 78, 16, 10, 0, 0, 7); g.fill();
    // brows
    g.fillStyle = '#5a3a28';
    g.save();
    g.translate(38, 48); g.rotate(-0.18); g.fillRect(-14, -2, 26, 4); g.restore();
    g.save();
    g.translate(90, 48); g.rotate(0.18); g.fillRect(-12, -2, 26, 4); g.restore();
    // eyes
    function eye(x) {
      g.fillStyle = '#fffaf4'; g.beginPath(); g.ellipse(x, 60, 11, 8, 0, 0, 7); g.fill();
      g.fillStyle = '#2a1a12'; g.beginPath(); g.ellipse(x, 61, 5.5, 5.5, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 2, 59, 1.8, 0, 7); g.fill();
      // lash
      g.strokeStyle = '#2a1a12'; g.lineWidth = 2;
      g.beginPath(); g.ellipse(x, 60, 11, 8, 0, Math.PI, 0); g.stroke();
    }
    eye(38); eye(90);
    // nose
    g.fillStyle = 'rgba(160,90,70,0.35)';
    g.beginPath(); g.moveTo(64, 62); g.lineTo(58, 80); g.lineTo(70, 80); g.closePath(); g.fill();
    // lips
    g.fillStyle = '#c45b6a';
    g.beginPath(); g.ellipse(64, 96, 13, 5.5, 0, 0, 7); g.fill();
    g.fillStyle = '#e07884';
    g.beginPath(); g.ellipse(64, 94.5, 12, 3.2, 0, Math.PI, 0); g.fill();
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }

  function starTex() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#c9973a'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#fff8ee';
    g.translate(32, 32);
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      const b = a + Math.PI / 5;
      g.lineTo(Math.cos(a) * 26, Math.sin(a) * 26);
      g.lineTo(Math.cos(b) * 11, Math.sin(b) * 11);
    }
    g.closePath(); g.fill();
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }

  function bootTex() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    // silver-ice base with champagne sparkle (reference reads gold in sun, brief asked silver)
    const lg = g.createLinearGradient(0, 0, 0, 128);
    lg.addColorStop(0, '#e8eef6'); lg.addColorStop(0.45, '#c5d0de'); lg.addColorStop(1, '#9aa8b8');
    g.fillStyle = lg; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 500; i++) {
      const gold = Math.random() < 0.45;
      g.fillStyle = gold ? 'rgba(255,220,140,0.7)' : 'rgba(255,255,255,0.75)';
      g.beginPath(); g.arc(Math.random() * 128, Math.random() * 128, 0.6 + Math.random() * 1.6, 0, 7); g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  }

  function box(w, h, d, mat, x, y, z, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = false; m.receiveShadow = false;
    (parent || arguments[7] /*noop*/);
    if (parent) parent.add(m);
    return m;
  }

  P.make = function () {
    if (typeof THREE === 'undefined') throw new Error('THREE required');
    const mats = [];
    const addM = m => { mats.push(m); return m; };
    const skin = addM(lamb(0xe2b08a));
    const skinShadow = addM(lamb(0xc48a68));
    const hairA = addM(lamb(0xf6d56a));
    const hairB = addM(lamb(0xffe8a0));
    const hairC = addM(lamb(0xd4b04a));
    const dressMap = sequinTex('#f0c43a', [
      'rgba(255,255,220,ALP)', 'rgba(255,230,120,ALP)', 'rgba(255,255,255,ALP)', 'rgba(255,200,60,ALP)'
    ], 1600);
    const dress = addM(lamb(0xffffff, { map: dressMap }));
    const dressDark = addM(lamb(0xd8a028, { map: dressMap }));
    const belt = addM(lamb(0xb07d2c));
    const starM = addM(lamb(0xffffff, { map: starTex() }));
    const gold = addM(lamb(0xe6c04a));
    const goldShiny = addM(new THREE.MeshLambertMaterial({ color: 0xffe07a, emissive: 0x3a2a08 }));
    const bootM = addM(lamb(0xffffff, { map: bootTex() }));
    const lip = addM(lamb(0xc45b6a));
    const eyeW = addM(lamb(0xfffaf4));
    const eyeP = addM(lamb(0x2a1a12));
    const micBlk = addM(lamb(0x161616));
    const micGrille = addM(lamb(0xc8cdd4));
    const faceM = addM(lamb(0xffffff, { map: faceTex() }));

    const g = new THREE.Group();
    g.name = 'popstar';
    // Rig root sits at the hips; legs hang down, torso goes up.
    const rig = new THREE.Group(); rig.name = 'rig'; g.add(rig);
    const hip = new THREE.Group(); hip.name = 'hip'; hip.position.y = PR.hipY; rig.add(hip);

    // ---- legs ----
    function makeLeg(side) {
      const root = new THREE.Group(); root.position.set(side * PR.hipW * 0.28, 0, 0); hip.add(root);
      const thigh = new THREE.Group(); root.add(thigh);
      box(PR.thighW, PR.thigh, PR.thighW * 0.95, skin, 0, -PR.thigh / 2, 0, thigh);
      const knee = new THREE.Group(); knee.position.y = -PR.thigh; thigh.add(knee);
      const shin = new THREE.Group(); knee.add(shin);
      box(PR.shinW, PR.shin, PR.shinW * 0.95, skinShadow, 0, -PR.shin / 2, 0, shin);
      const ankle = new THREE.Group(); ankle.position.y = -PR.shin; shin.add(ankle);
      // chunky ankle boot
      const boot = new THREE.Group(); ankle.add(boot);
      box(PR.bootW, PR.bootH * 0.72, PR.bootD * 0.72, bootM, 0, -PR.bootH * 0.36, 0.15, boot);
      box(PR.bootW * 1.08, PR.bootH * 0.42, PR.bootD, bootM, 0, -PR.bootH * 0.82, 0.38, boot); // sole / toe
      box(PR.bootW * 1.12, 0.18, PR.bootD * 1.05, addM(lamb(0x8a96a4)), 0, -PR.bootH * 1.02, 0.38, boot);
      return { root: root, thigh: thigh, knee: knee, shin: shin, ankle: ankle, boot: boot, side: side };
    }
    const leftLeg = makeLeg(-1), rightLeg = makeLeg(1);

    // ---- torso / dress ----
    const torso = new THREE.Group(); torso.name = 'torso'; hip.add(torso);
    // pelvis / hips under the dress
    box(PR.hipW, 1.6, 2.05, dress, 0, 0.55, 0.05, torso);
    // waist
    box(PR.waistW, 1.7, 1.55, dressDark, 0, 1.85, 0.02, torso);
    // wider darker gold belt + white star buckle
    box(PR.waistW + 0.85, 0.85, 1.85, belt, 0, 2.35, 0.08, torso);
    box(0.95, 0.95, 0.22, starM, 0, 2.35, 1.00, torso);
    // bust / upper dress, sleeveless
    box(PR.chestW, 2.7, PR.chestD, dress, 0, 4.15, 0.12, torso);
    // slight flare at the mini hem (mid-thigh)
    const hemY = -(PR.hipY - (PR.bootH + PR.shin + PR.thigh * 0.38));
    // hem is a child of hip, hanging down over the thighs
    const skirt = new THREE.Group(); hip.add(skirt);
    box(PR.hipW + 0.35, 3.4, 2.25, dress, 0, -1.35, 0.08, skirt);
    box(PR.hipW + 0.7, 1.15, 2.4, dress, 0, -2.85, 0.12, skirt);

    // ---- shoulders / arms ----
    const chestTop = new THREE.Group(); chestTop.position.y = PR.torso; torso.add(chestTop);
    box(PR.shoulderW, 0.7, 1.7, dress, 0, -0.1, 0.05, chestTop);

    function makeArm(side) {
      const sh = new THREE.Group();
      sh.position.set(side * (PR.shoulderW * 0.52), -0.15, 0);
      chestTop.add(sh);
      // sleeveless: skin from the shoulder
      box(1.05, 1.05, 1.05, skin, side * 0.1, 0, 0, sh);
      const upper = new THREE.Group(); sh.add(upper);
      box(0.95, PR.upperArm, 0.95, skin, 0, -PR.upperArm / 2, 0, upper);
      const elbow = new THREE.Group(); elbow.position.y = -PR.upperArm; upper.add(elbow);
      const lower = new THREE.Group(); elbow.add(lower);
      box(0.82, PR.lowerArm, 0.82, skin, 0, -PR.lowerArm / 2, 0, lower);
      // stacked gold bangles
      box(1.05, 0.18, 1.05, gold, 0, -0.35, 0, lower);
      box(1.08, 0.16, 1.08, goldShiny, 0, -0.55, 0, lower);
      box(1.02, 0.14, 1.02, gold, 0, -0.72, 0, lower);
      const wrist = new THREE.Group(); wrist.position.y = -PR.lowerArm; lower.add(wrist);
      const hand = new THREE.Group(); wrist.add(hand);
      box(0.7, PR.hand, 0.5, skin, 0, -PR.hand / 2, 0.05, hand);
      // simple fingers
      for (let i = -1.5; i <= 1.5; i += 1) {
        box(0.16, 0.55, 0.16, skin, i * 0.16, -PR.hand - 0.15, 0.12, hand);
      }
      return { sh: sh, upper: upper, elbow: elbow, lower: lower, wrist: wrist, hand: hand, side: side };
    }
    const leftArm = makeArm(-1), rightArm = makeArm(1);

    // microphone in the right hand
    const mic = new THREE.Group();
    rightArm.hand.add(mic);
    mic.position.set(0.15, -PR.hand - 0.1, 0.35);
    box(0.22, 1.55, 0.22, micBlk, 0, 0.4, 0, mic);
    const grille = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), micGrille);
    grille.position.y = 1.35; mic.add(grille);
    box(0.18, 0.18, 0.18, micBlk, 0, 0.95, 0, mic);

    // ---- neck, head, hair, jewellery ----
    const neck = new THREE.Group(); neck.position.y = PR.torso + PR.neck * 0.2; torso.add(neck);
    box(0.95, PR.neck, 0.95, skin, 0, PR.neck * 0.4, 0, neck);
    // chunky gold choker
    box(1.25, 0.28, 1.25, goldShiny, 0, 0.15, 0.05, neck);

    const head = new THREE.Group(); head.position.y = PR.neck; neck.add(head);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(PR.headH * 0.85, PR.headH, PR.headH * 0.8), [
      skin, skin, hairA, skin, faceM, skin
    ]);
    skull.position.y = PR.headH * 0.5; head.add(skull);
    // ears + gold hoops
    box(0.28, 0.55, 0.35, skin, -PR.headH * 0.48, PR.headH * 0.45, 0, head);
    box(0.28, 0.55, 0.35, skin, PR.headH * 0.48, PR.headH * 0.45, 0, head);
    const hoopGeo = new THREE.TorusGeometry(0.38, 0.07, 6, 12);
    const hoopL = new THREE.Mesh(hoopGeo, goldShiny); hoopL.position.set(-PR.headH * 0.52, PR.headH * 0.15, 0.05); hoopL.rotation.x = 0.2; head.add(hoopL);
    const hoopR = new THREE.Mesh(hoopGeo, goldShiny); hoopR.position.set(PR.headH * 0.52, PR.headH * 0.15, 0.05); hoopR.rotation.x = 0.2; head.add(hoopR);

    // voluminous wavy blonde hair — open around the face, full at the sides and back
    const hair = new THREE.Group(); hair.position.y = PR.headH * 0.55; head.add(hair);
    // crown
    box(3.05, 1.35, 2.95, hairB, 0, PR.headH * 0.42, -0.2, hair);
    box(2.35, 0.9, 2.2, hairA, 0, PR.headH * 0.72, -0.25, hair);
    // thin fringe at the hairline, not over the eyes
    box(2.2, 0.45, 0.55, hairB, 0, PR.headH * 0.38, 1.25, hair);
    // side volumes
    function lock(x, y, z, w, h, d, rot, mat) {
      const m = box(w, h, d, mat || hairA, x, y, z, hair);
      if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
      return m;
    }
    lock(-1.95, 0.15, 0.05, 1.25, 3.0, 1.45, [0.2, 0, 0.3], hairA);
    lock(1.95, 0.15, 0.05, 1.25, 3.0, 1.45, [0.2, 0, -0.3], hairA);
    lock(-2.15, -1.4, -0.05, 1.15, 3.5, 1.25, [0.4, 0.1, 0.35], hairC);
    lock(2.15, -1.4, -0.05, 1.15, 3.5, 1.25, [0.4, -0.1, -0.35], hairC);
    // back fall past the shoulders, down to mid-back
    lock(0, -0.3, -1.45, 2.9, 3.2, 1.35, [0.3, 0, 0], hairA);
    lock(0, -2.5, -1.25, 2.7, 3.8, 1.4, [0.5, 0, 0], hairC);
    lock(-1.25, -3.4, -0.7, 1.25, 3.1, 1.15, [0.6, 0.2, 0.2], hairA);
    lock(1.25, -3.4, -0.7, 1.25, 3.1, 1.15, [0.6, -0.2, -0.2], hairA);
    lock(-0.8, -4.8, -0.3, 1.05, 2.3, 1.05, [0.75, 0.15, 0.15], hairB);
    lock(0.8, -4.8, -0.3, 1.05, 2.3, 1.05, [0.75, -0.15, -0.15], hairB);
    // face-framing waves, kept to the sides of the cheeks
    lock(-1.7, -0.7, 0.85, 0.8, 2.1, 0.7, [0.35, 0.45, 0.25], hairB);
    lock(1.7, -0.7, 0.85, 0.8, 2.1, 0.7, [0.35, -0.45, -0.25], hairB);

    const parts = {
      g: g, rig: rig, hip: hip, torso: torso, skirt: skirt, chestTop: chestTop,
      neck: neck, head: head, hair: hair, mic: mic,
      leftLeg: leftLeg, rightLeg: rightLeg, leftArm: leftArm, rightArm: rightArm,
      mats: mats
    };

    P.applyPose(parts, P.stepState(0));
    return parts;
  };

  // Arm rest / pose local rotations. x: forward(+), z: outward for the right arm (mirrored for left).
  const ARM = {
    // hanging
    down: { sh: [0.15, 0, 0.12], el: [0.15, 0, 0], wr: [0, 0, 0] },
    // rotX: +forward, rotZ: +outward (mirrored for the left arm).
    // 1: left near collarbone, right mic at mouth
    p1L: { sh: [0.85, 0.55, -0.55], el: [1.45, 0.35, 0.2], wr: [0.3, 0.6, 0.2] },
    p1R: { sh: [0.85, 0.25, -1.85], el: [1.85, 0.15, 0.2], wr: [0.6, 0.2, 0.15] },
    // 2: left on hip (akimbo), right still singing
    p2L: { sh: [0.2, -0.1, 1.05], el: [1.6, 0.1, 0.35], wr: [0.2, 0.4, 0.55] },
    p2R: { sh: [0.85, 0.25, -1.85], el: [1.85, 0.15, 0.2], wr: [0.6, 0.2, 0.15] },
    // 3: left on top of the head, right singing
    p3L: { sh: [-0.05, 0.2, 2.2], el: [1.55, 0.2, 0.1], wr: [0.45, 0.25, 0] },
    p3R: { sh: [0.85, 0.25, -1.85], el: [1.85, 0.15, 0.2], wr: [0.6, 0.2, 0.15] },
    // 4: high V, mic raised in the right hand
    p4L: { sh: [0.15, 0.1, 2.35], el: [0.45, 0, 0.1], wr: [0.15, 0, 0] },
    p4R: { sh: [0.15, -0.1, 2.35], el: [0.45, 0, -0.1], wr: [0.2, 0, 0] }
  };
  const POSES = {
    1: { L: ARM.p1L, R: ARM.p1R },
    2: { L: ARM.p2L, R: ARM.p2R },
    3: { L: ARM.p3L, R: ARM.p3R },
    4: { L: ARM.p4L, R: ARM.p4R }
  };

  function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function setEuler(o, t) { o.rotation.set(t[0], t[1], t[2]); }
  function setArm(arm, pose, sideSign) {
    // z is mirrored for the left arm (sideSign = -1)
    const sh = [pose.sh[0], pose.sh[1] * sideSign, pose.sh[2] * sideSign];
    const el = [pose.el[0], pose.el[1] * sideSign, pose.el[2] * sideSign];
    const wr = [pose.wr[0], pose.wr[1] * sideSign, pose.wr[2] * sideSign];
    setEuler(arm.sh, sh);
    setEuler(arm.elbow, el);
    setEuler(arm.wrist, wr);
  }
  function mixArm(arm, A, B, k, sideSign) {
    const pose = {
      sh: lerp3(A.sh, B.sh, k),
      el: lerp3(A.el, B.el, k),
      wr: lerp3(A.wr, B.wr, k)
    };
    setArm(arm, pose, sideSign);
  }

  // Simple 2-bone IK in the thigh-shin plane. Limbs hang along local -Y.
  function ikLeg(leg, hipWorld, footTarget, lenA, lenB) {
    const dx = footTarget.x - hipWorld.x;
    const dy = footTarget.y - hipWorld.y;
    const dz = footTarget.z - hipWorld.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const reach = Math.max(0.15, Math.min(lenA + lenB - 0.05, dist));
    // angles in the plane: hip pitch (x rot) and yaw to face the foot
    const yaw = Math.atan2(dx, dz);
    // in the vertical plane, the vector from hip to foot
    const horiz = Math.sqrt(dx * dx + dz * dz);
    const pitch = Math.atan2(-horiz, -dy); // hanging down is 0 if foot is directly below (dy<0, horiz=0) ...
    // When foot is directly below, dx=dz=0, dy=-L, we want thigh.rot = 0 and knee slightly bent.
    // pitch here: atan2(0, L) = 0. Good.
    // When foot is forward (dz>0, dy=-L), atan2(-horiz, -dy)=atan2(-h, L) is negative? 
    // We want thigh to rotate +X (forward) when the foot is forward. In THREE Y-up, +X rotation moves a -Y limb toward +Z.
    // rotX positive: +Y goes to -Z, -Y goes to +Z. Yes, +rotX swings the foot forward.
    // So thigh.rotation.x should be positive when foot is forward of hip.
    // Prefer a forward/back stride (rotX) with only a little abduction (rotZ).
    // A full yaw toward the foot made the swing leg do a sideways split in front view.
    const down = Math.max(0.2, hipWorld.y - footTarget.y);
    const thighSwing = Math.atan2(dz, down); // signed: +dz (forward) => +rotX
    const abd = Math.atan2(dx, down);        // signed: +dx => +rotZ (right)
    const cosK = (lenA * lenA + lenB * lenB - reach * reach) / (2 * lenA * lenB);
    const kneeBend = Math.PI - Math.acos(Math.max(-1, Math.min(1, cosK)));
    const cosH = (lenA * lenA + reach * reach - lenB * lenB) / (2 * lenA * reach);
    const hipBend = Math.acos(Math.max(-1, Math.min(1, cosH)));
    const swingSign = (dz >= 0 ? 1 : 1); // rotX positive swings the -Y limb toward +Z
    leg.root.rotation.set(0, 0, 0);
    leg.thigh.rotation.set(thighSwing - hipBend * Math.sign(dz || 1), 0, abd);
    leg.knee.rotation.set(kneeBend, 0, 0);
    // keep the boot roughly world-upright in the stride plane
    leg.ankle.rotation.set(-(thighSwing - hipBend * Math.sign(dz || 1) + kneeBend), 0, -abd);
  }

  P.applyPose = function (parts, st, groundY) {
    if (!parts || !st) return;
    const gY = groundY || { l: 0, r: 0, h: 0 };
    // Hip sits at hipY above the average of the supporting feet, plus any lift.
    parts.hip.position.set(st.hipX, PR.hipY, 0);
    parts.hip.rotation.set(0, st.hipYaw, st.hipRoll);
    parts.torso.position.x = st.torsoSway;
    parts.torso.rotation.set(0.04, 0, st.torsoRoll);
    parts.head.rotation.set(st.headNod, st.headYaw, -st.torsoRoll * 0.3);

    const k = st.poseBlend == null ? 1 : st.poseBlend;
    const A = POSES[st.prevPose] || POSES[1];
    const B = POSES[st.pose] || POSES[1];
    mixArm(parts.leftArm, A.L, B.L, k, -1);
    mixArm(parts.rightArm, A.R, B.R, k, 1);
    // mic tilts toward the mouth in poses 1-3, held high in pose 4
    const micTilt = (st.pose === 4 || st.prevPose === 4 && k < 1)
      ? (st.pose === 4 ? k : 1 - k)
      : 0;
    if (parts.mic) parts.mic.rotation.set(0.55 - 1.1 * micTilt, 0.15, 0.4);

    // Foot targets in rig space: rig is at world (path origin) with y at ground under the body.
    // We place the rig so hips are at world y = support + hipY, and z follows hipZ.
    // Foot target y = ground at that foot + lift.
    const hipWorld = { x: st.hipX, y: PR.hipY, z: 0 }; // in hip-parent (rig) space, hip at (hipX, hipY, 0) after we move rig
    // In rig space the hip group is at (0, hipY, 0) plus hip.position.x = st.hipX.
    // Feet should be at (foot.x, foot.y + groundOffset, foot.z - hipZ) in rig space
    // because the rig will be placed at world z = hipZ, so plant world z is constant.
    function target(foot, g) {
      // IK aims at the ankle; the boot hangs below it by PR.bootH.
      return {
        x: foot.x,
        y: g + PR.bootH + foot.y,
        z: foot.z - st.hipZ
      };
    }
    const hipW = { x: st.hipX, y: PR.hipY, z: 0 };
    ikLeg(parts.leftLeg, hipW, target(st.left, gY.l), PR.thigh, PR.shin);
    ikLeg(parts.rightLeg, hipW, target(st.right, gY.r), PR.thigh, PR.shin);
  };

  P.ikLeg = ikLeg;
  P.POSES = POSES;
})(typeof window !== 'undefined' ? window : globalThis);
