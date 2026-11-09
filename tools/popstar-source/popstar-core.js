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
  P.SPAWN_CHANCE = 0.18;
  P.LIFE = 120;
  P.SONG_MP3 = 'assets/sfx/popstar_song.mp3';
  P.SONG_OGG = 'assets/sfx/popstar_song.ogg';

  // Body proportions in blocks, y=0 at the sole of a standing boot.
  // Slim long-legged fashion figure: smaller head, longer legs, hourglass torso.
  const PR = P.PR = {
    bootH: 1.65, ankle: 1.65, shin: 8.35, thigh: 9.35,
    hipY: 0, torso: 5.55, shoulderY: 0,
    neck: 0.7, headH: 2.2, scalpY: 0,
    hairTop: 32,
    shoulderW: 3.55, waistW: 2.15, hipW: 4.25,
    thighW: 1.85, thighD: 1.7, shinW: 1.38, shinD: 1.28,
    bootW: 1.95, bootD: 2.55,
    upperArm: 3.55, lowerArm: 3.35, hand: 1.05,
    chestW: 3.55, chestD: 2.05
  };
  PR.hipY = PR.bootH + PR.shin + PR.thigh;          // 19.35
  PR.shoulderY = PR.hipY + PR.torso;                // 24.90
  PR.chinY = PR.shoulderY + PR.neck;                // 25.60
  PR.scalpY = PR.chinY + PR.headH;                  // 27.80
  PR.armLen = PR.upperArm + PR.lowerArm + PR.hand;

  // 1 mic-to-mouth + left at collarbone; 2 left on hip; 3 left on head; 4 both arms high V.
  P.POSE_SEQ = [
    [1, 3], [2, 3], [3, 1], [2, 6], [4, 2], [2, 9], [3, 1], [2, 6], [4, 2]
  ];
  let _poseDur = 0;
  P.POSE_SEQ.forEach(p => { _poseDur += p[1]; });
  P.POSE_CYCLE = _poseDur; // 33 s
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
    const u = beatF - step;
    const leftPlant = (step % 2 === 0);
    const hipZ = tSafe * (stride / beat);
    // Stronger hip pop toward the planted foot, then a slight settle.
    const pop = (u < 0.14) ? (u / 0.14) : (u < 0.75 ? 1 : 1 - 0.18 * (u - 0.75) / 0.25);
    const eased = pop * pop * (3 - 2 * pop);
    const side = leftPlant ? -1 : 1;
    const hipX = side * 1.55 * eased;
    const hipYaw = side * 0.11 * eased;
    const hipRoll = side * 0.24 * eased;
    const torsoRoll = -hipRoll * 0.82;     // counterbalance so the torso stays upright
    const torsoSway = -hipX * 0.22;
    const torsoYaw = -hipYaw * 0.45;
    const headYaw = -hipYaw * 0.25;
    const headNod = 0.035 * Math.sin(beatF * Math.PI * 2);

    function foot(isLeft) {
      const plantedNow = isLeft ? leftPlant : !leftPlant;
      // Catwalk: feet land under the body, slight crossover over the centre line.
      const x = (isLeft ? 1 : -1) * 0.16;
      let z, yLift = 0, planted = plantedNow;
      if (plantedNow) {
        z = (step + 0.5) * stride;
        yLift = 0;
      } else {
        const z0 = (step - 0.5) * stride;
        const z1 = (step + 1.5) * stride;
        const su = u * u * (3 - 2 * u);
        z = z0 + (z1 - z0) * su;
        yLift = Math.sin(u * Math.PI) * 2.45;
        planted = false;
      }
      return { x: x, y: yLift, z: z, planted: planted, isLeft: isLeft };
    }
    const left = foot(true), right = foot(false);
    const pose = P.poseAt(tSafe);
    return {
      t: tSafe, step: step, u: u, beatF: beatF, leftPlant: leftPlant,
      hipX: hipX, hipY: hipY0, hipZ: hipZ, hipYaw: hipYaw, hipRoll: hipRoll,
      torsoRoll: torsoRoll, torsoSway: torsoSway, torsoYaw: torsoYaw,
      headYaw: headYaw, headNod: headNod,
      left: left, right: right, pose: pose.pose, prevPose: pose.prev, poseBlend: pose.blend,
      stride: stride
    };
  };

  P.plantedFootWorldZ = function (t, which) {
    const s = P.stepState(t);
    return which === 'left' ? s.left.z : s.right.z;
  };

  // ---------- materials & model (requires THREE) ----------
  function tagTex(t) {
    try { if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; } catch (_) {}
    try { if (THREE.sRGBEncoding != null) t.encoding = THREE.sRGBEncoding; } catch (_) {}
    t.needsUpdate = true;
    return t;
  }
  function phong(opts) {
    const o = Object.assign({ color: 0xffffff, shininess: 50, specular: 0x333333 }, opts || {});
    if (typeof THREE.MeshPhongMaterial === 'function') return new THREE.MeshPhongMaterial(o);
    return new THREE.MeshLambertMaterial(o);
  }
  function lamb(opts) {
    return new THREE.MeshLambertMaterial(Object.assign({ color: 0xffffff }, opts || {}));
  }

  function sequinMaps() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const e = document.createElement('canvas'); e.width = 256; e.height = 256;
    const g = c.getContext('2d');
    const h = e.getContext('2d');
    // Bright saturated yellow-gold (#f2c518-ish, slightly hotter so lighting doesn't khaki it).
    const lg = g.createLinearGradient(0, 0, 0, 256);
    lg.addColorStop(0, '#ffe34a');
    lg.addColorStop(0.35, '#f2c518');
    lg.addColorStop(0.7, '#ffd21c');
    lg.addColorStop(1, '#e8b40e');
    g.fillStyle = lg; g.fillRect(0, 0, 256, 256);
    h.fillStyle = '#000'; h.fillRect(0, 0, 256, 256);
    // soft vertical folds
    for (let i = 0; i < 10; i++) {
      g.fillStyle = i % 2 ? 'rgba(255,236,120,0.28)' : 'rgba(200,140,10,0.18)';
      g.fillRect(i * 26 + 3, 0, 9, 256);
    }
    const sparks = [
      'rgba(255,255,255,ALP)', 'rgba(255,248,200,ALP)',
      'rgba(255,230,80,ALP)', 'rgba(255,210,40,ALP)'
    ];
    for (let i = 0; i < 2200; i++) {
      const x = Math.random() * 256, y = Math.random() * 256;
      const s = 0.7 + Math.random() * 2.4;
      const a = 0.45 + Math.random() * 0.55;
      g.fillStyle = sparks[i % sparks.length].replace('ALP', a.toFixed(2));
      g.beginPath(); g.arc(x, y, s, 0, 6.3); g.fill();
      if (a > 0.75) {
        h.fillStyle = 'rgba(255,240,160,' + ((a - 0.4) * 1.2).toFixed(2) + ')';
        h.beginPath(); h.arc(x, y, s * 1.15, 0, 6.3); h.fill();
      }
    }
    // a few larger glints
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 256, y = Math.random() * 256;
      g.fillStyle = 'rgba(255,255,255,0.95)';
      g.beginPath(); g.arc(x, y, 2.2, 0, 6.3); g.fill();
      h.fillStyle = 'rgba(255,255,220,0.95)';
      h.beginPath(); h.arc(x, y, 2.6, 0, 6.3); h.fill();
    }
    return { map: tagTex(new THREE.CanvasTexture(c)), emissiveMap: tagTex(new THREE.CanvasTexture(e)) };
  }

  function goldBootTex() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const g = c.getContext('2d');
    const lg = g.createLinearGradient(0, 0, 0, 128);
    lg.addColorStop(0, '#ffe27a');
    lg.addColorStop(0.45, '#f0c44a');
    lg.addColorStop(1, '#c99220');
    g.fillStyle = lg; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 700; i++) {
      const a = 0.45 + Math.random() * 0.55;
      g.fillStyle = Math.random() < 0.55 ? 'rgba(255,255,230,' + a + ')' : 'rgba(255,210,80,' + a + ')';
      g.beginPath(); g.arc(Math.random() * 128, Math.random() * 128, 0.6 + Math.random() * 1.8, 0, 7); g.fill();
    }
    return tagTex(new THREE.CanvasTexture(c));
  }

  function starTex() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#6a4814'; g.fillRect(0, 0, 64, 64);
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
    return tagTex(new THREE.CanvasTexture(c));
  }

  function box(w, h, d, mat, x, y, z, parent, rot) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
    m.castShadow = false; m.receiveShadow = false;
    if (parent) parent.add(m);
    return m;
  }

  P.make = function () {
    if (typeof THREE === 'undefined') throw new Error('THREE required');
    const mats = [];
    const addM = m => { mats.push(m); return m; };

    // Warm light tan skin (not grey-brown).
    const SKIN = 0xf0c49c, SKIN_SH = 0xe0a878;
    const skin = addM(phong({ color: SKIN, shininess: 18, specular: 0x332010 }));
    const skinSh = addM(phong({ color: SKIN_SH, shininess: 14, specular: 0x22180c }));
    const hairA = addM(phong({ color: 0xffe07a, shininess: 42, specular: 0x887744, emissive: 0x2a2208 }));
    const hairB = addM(phong({ color: 0xfff0b8, shininess: 55, specular: 0xaa9966, emissive: 0x33280a }));
    const hairC = addM(phong({ color: 0xe8c45a, shininess: 32, specular: 0x665522, emissive: 0x221a06 }));
    const seq = sequinMaps();
    const dressOpts = {
      color: 0xffd21c, map: seq.map, emissive: 0x7a4a00,
      emissiveMap: seq.emissiveMap, shininess: 110, specular: 0xfff2c0
    };
    try { dressOpts.emissiveIntensity = 0.7; } catch (_) {}
    const dress = addM(phong(dressOpts));
    const dressDark = addM(phong(Object.assign({}, dressOpts, { color: 0xe8b40e, emissive: 0x4a2e00 })));
    const belt = addM(phong({ color: 0x6a4814, shininess: 40, specular: 0x665533 }));
    const starM = addM(phong({ color: 0xffffff, map: starTex(), shininess: 80, specular: 0xffffff, emissive: 0x333322 }));
    const gold = addM(phong({ color: 0xf0c44a, shininess: 90, specular: 0xfff0c0, emissive: 0x3a2800 }));
    const goldShiny = addM(phong({ color: 0xffe07a, shininess: 120, specular: 0xffffff, emissive: 0x5a3a00 }));
    const bootMap = goldBootTex();
    const bootM = addM(phong({ color: 0xffd24a, map: bootMap, shininess: 100, specular: 0xfff3c8, emissive: 0x3a2800 }));
    const bootSole = addM(phong({ color: 0xb88620, shininess: 40, specular: 0x665522 }));
    const lip = addM(phong({ color: 0xc45b6a, shininess: 40, specular: 0x662233 }));
    const lipHi = addM(phong({ color: 0xe07884, shininess: 50, specular: 0x884444 }));
    const eyeW = addM(lamb({ color: 0xfffaf4 }));
    const eyeP = addM(lamb({ color: 0x2a1a12 }));
    const lash = addM(lamb({ color: 0x1a100c }));
    const brow = addM(lamb({ color: 0x5a3a28 }));
    const micBlk = addM(phong({ color: 0x161616, shininess: 40, specular: 0x444444 }));
    const micGrille = addM(phong({ color: 0xc8cdd4, shininess: 80, specular: 0xffffff, emissive: 0x222222 }));

    const g = new THREE.Group();
    g.name = 'popstar';
    const rig = new THREE.Group(); rig.name = 'rig'; g.add(rig);
    const hip = new THREE.Group(); hip.name = 'hip'; hip.position.y = PR.hipY; rig.add(hip);

    // ---- legs (slim, not sticks) ----
    function makeLeg(side) {
      const root = new THREE.Group(); root.position.set(side * PR.hipW * 0.22, 0, 0); hip.add(root);
      const thigh = new THREE.Group(); root.add(thigh);
      box(PR.thighW, PR.thigh, PR.thighD, skin, 0, -PR.thigh / 2, 0, thigh);
      // slight taper at the knee
      box(PR.thighW * 0.88, PR.thigh * 0.35, PR.thighD * 0.88, skinSh, 0, -PR.thigh * 0.82, 0, thigh);
      const knee = new THREE.Group(); knee.position.y = -PR.thigh; thigh.add(knee);
      const shin = new THREE.Group(); knee.add(shin);
      box(PR.shinW, PR.shin, PR.shinD, skinSh, 0, -PR.shin / 2, 0, shin);
      box(PR.shinW * 0.9, PR.shin * 0.4, PR.shinD * 0.9, skin, 0, -PR.shin * 0.28, 0, shin);
      const ankle = new THREE.Group(); ankle.position.y = -PR.shin; shin.add(ankle);
      const boot = new THREE.Group(); ankle.add(boot);
      // chunky gold sparkly ankle boots
      box(PR.bootW * 0.95, PR.bootH * 0.78, PR.bootD * 0.72, bootM, 0, -PR.bootH * 0.38, 0.12, boot);
      box(PR.bootW * 1.08, PR.bootH * 0.42, PR.bootD, bootM, 0, -PR.bootH * 0.82, 0.40, boot);
      box(PR.bootW * 1.12, 0.2, PR.bootD * 1.06, bootSole, 0, -PR.bootH * 1.02, 0.40, boot);
      return { root: root, thigh: thigh, knee: knee, shin: shin, ankle: ankle, boot: boot, side: side };
    }
    const leftLeg = makeLeg(-1), rightLeg = makeLeg(1);

    // ---- torso / fitted strapless tube dress ----
    const torso = new THREE.Group(); torso.name = 'torso'; hip.add(torso);
    // pelvis under the dress
    box(PR.hipW * 0.92, 1.35, 2.15, dress, 0, 0.5, 0.05, torso);
    // hourglass stack: hip -> waist -> underbust -> bust (strapless, no shoulder slab)
    box(PR.hipW * 0.78, 1.15, 1.9, dress, 0, 1.45, 0.04, torso);
    box(PR.waistW, 1.25, 1.55, dressDark, 0, 2.35, 0.02, torso);
    // darker gold belt at the waist + white star buckle
    box(PR.waistW + 0.7, 0.72, 1.82, belt, 0, 2.45, 0.08, torso);
    box(0.95, 0.95, 0.22, starM, 0, 2.45, 1.00, torso);
    // underbust / bust, strapless tube
    box(PR.chestW * 0.88, 1.05, 1.8, dress, 0, 3.35, 0.08, torso);
    box(PR.chestW, 1.7, PR.chestD, dress, 0, 4.5, 0.14, torso);
    // slight bust rounding
    box(PR.chestW * 0.95, 1.05, PR.chestD * 0.7, dress, 0, 4.65, 0.55, torso);

    // fitted skirt to mid-thigh, slight hem flare (child of hip so it hangs with the hips)
    const skirt = new THREE.Group(); hip.add(skirt);
    box(PR.hipW + 0.15, 2.35, 2.25, dress, 0, -0.95, 0.08, skirt);
    box(PR.hipW + 0.05, 1.55, 2.15, dress, 0, -2.25, 0.1, skirt);
    box(PR.hipW + 0.45, 0.85, 2.3, dress, 0, -3.25, 0.12, skirt);

    // ---- shoulders / arms (skin at the joint — dress is strapless) ----
    const chestTop = new THREE.Group(); chestTop.position.y = PR.torso; torso.add(chestTop);
    // collarbone / upper chest skin, not a dress shoulder slab
    box(2.2, 0.45, 1.15, skin, 0, -0.15, 0.15, chestTop);

    function makeArm(side) {
      const sh = new THREE.Group();
      sh.position.set(side * (PR.shoulderW * 0.52), -0.2, 0);
      chestTop.add(sh);
      box(1.15, 1.05, 1.1, skin, side * 0.12, 0, 0, sh);
      const upper = new THREE.Group(); sh.add(upper);
      box(1.05, PR.upperArm, 1.05, skin, 0, -PR.upperArm / 2, 0, upper);
      const elbow = new THREE.Group(); elbow.position.y = -PR.upperArm; upper.add(elbow);
      const lower = new THREE.Group(); elbow.add(lower);
      box(0.92, PR.lowerArm, 0.92, skin, 0, -PR.lowerArm / 2, 0, lower);
      box(1.12, 0.18, 1.12, gold, 0, -0.32, 0, lower);
      box(1.16, 0.16, 1.16, goldShiny, 0, -0.52, 0, lower);
      box(1.1, 0.14, 1.1, gold, 0, -0.7, 0, lower);
      const wrist = new THREE.Group(); wrist.position.y = -PR.lowerArm; lower.add(wrist);
      const hand = new THREE.Group(); wrist.add(hand);
      box(0.72, PR.hand, 0.52, skin, 0, -PR.hand / 2, 0.05, hand);
      for (let i = -1.5; i <= 1.5; i += 1) {
        box(0.16, 0.55, 0.16, skin, i * 0.16, -PR.hand - 0.15, 0.12, hand);
      }
      return { sh: sh, upper: upper, elbow: elbow, lower: lower, wrist: wrist, hand: hand, side: side };
    }
    const leftArm = makeArm(-1), rightArm = makeArm(1);

    // microphone in the right hand: handle in the palm, grille along +Z (aimed at the mouth)
    const mic = new THREE.Group();
    rightArm.hand.add(mic);
    mic.position.set(0.08, -PR.hand * 0.4, 0.15);
    const handle = box(0.2, 0.2, 1.2, micBlk, 0, 0, 0.4, mic);
    const grille = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), micGrille);
    grille.position.set(0, 0, 1.2); mic.add(grille);
    box(0.16, 0.16, 0.16, micBlk, 0, 0, 0.95, mic);

    // ---- neck, faceted head, jewellery ----
    const neck = new THREE.Group(); neck.position.y = PR.torso + PR.neck * 0.15; torso.add(neck);
    box(0.85, PR.neck, 0.85, skin, 0, PR.neck * 0.4, 0, neck);
    box(1.15, 0.26, 1.15, goldShiny, 0, 0.12, 0.04, neck); // choker

    const head = new THREE.Group(); head.position.y = PR.neck; neck.add(head);
    // slightly smaller cranium + a narrower jaw, so the head reads smaller than the body
    const hw = PR.headH * 0.78, hd = PR.headH * 0.76;
    box(hw, PR.headH * 0.72, hd, skin, 0, PR.headH * 0.62, 0, head);           // cranium
    box(hw * 0.9, PR.headH * 0.42, hd * 0.92, skin, 0, PR.headH * 0.22, 0.02, head); // jaw
    // ears + gold hoops
    box(0.22, 0.48, 0.3, skin, -hw * 0.55, PR.headH * 0.5, 0, head);
    box(0.22, 0.48, 0.3, skin, hw * 0.55, PR.headH * 0.5, 0, head);
    const hoopGeo = new THREE.TorusGeometry(0.34, 0.065, 6, 12);
    const hoopL = new THREE.Mesh(hoopGeo, goldShiny); hoopL.position.set(-hw * 0.58, PR.headH * 0.22, 0.04); hoopL.rotation.x = 0.2; head.add(hoopL);
    const hoopR = new THREE.Mesh(hoopGeo, goldShiny); hoopR.position.set(hw * 0.58, PR.headH * 0.22, 0.04); hoopR.rotation.x = 0.2; head.add(hoopR);

    // faceted facial features (readable from the front and the side)
    const eyeY = PR.headH * 0.55, eyeZ = hd * 0.52, eyeX = 0.38;
    function addEye(sx) {
      box(0.42, 0.28, 0.12, eyeW, sx * eyeX, eyeY, eyeZ, head);
      box(0.22, 0.22, 0.08, eyeP, sx * eyeX, eyeY - 0.01, eyeZ + 0.08, head);
      box(0.07, 0.07, 0.04, eyeW, sx * eyeX - 0.05, eyeY + 0.05, eyeZ + 0.12, head);
      box(0.42, 0.08, 0.1, lash, sx * eyeX, eyeY + 0.16, eyeZ + 0.02, head);
      box(0.46, 0.08, 0.12, brow, sx * eyeX, eyeY + 0.28, eyeZ - 0.02, head, [0, 0, sx * -0.18]);
    }
    addEye(-1); addEye(1);
    // nose: bridge + tip, protruding so it reads in profile
    box(0.22, 0.48, 0.32, skinSh, 0, PR.headH * 0.46, eyeZ + 0.16, head);
    box(0.32, 0.22, 0.3, skin, 0, PR.headH * 0.3, eyeZ + 0.32, head);
    // lips
    box(0.58, 0.14, 0.18, lip, 0, PR.headH * 0.18, eyeZ + 0.14, head);
    box(0.48, 0.09, 0.16, lipHi, 0, PR.headH * 0.23, eyeZ + 0.18, head);
    // cheeks
    box(0.35, 0.28, 0.16, addM(phong({ color: 0xeba08a, shininess: 16, specular: 0x331810 })), -0.52, PR.headH * 0.36, eyeZ * 0.7, head);
    box(0.35, 0.28, 0.16, addM(phong({ color: 0xeba08a, shininess: 16, specular: 0x331810 })), 0.52, PR.headH * 0.36, eyeZ * 0.7, head);

    // ---- voluminous wavy blonde hair: many layered strands, not a helmet ----
    const hair = new THREE.Group(); hair.position.y = PR.headH; head.add(hair);
    function lock(x, y, z, w, hh, d, rot, mat) {
      return box(w, hh, d, mat || hairA, x, y, z, hair, rot);
    }
    // crown volume sitting on the scalp (not covering the face)
    lock(0, 0.55, -0.15, 2.15, 1.05, 2.05, null, hairB);
    lock(0, 1.05, -0.25, 1.7, 0.7, 1.6, [0.15, 0, 0], hairA);
    lock(-0.55, 0.7, 0.15, 1.1, 0.7, 1.2, [0.1, 0.2, 0.15], hairB);
    lock(0.55, 0.7, 0.15, 1.1, 0.7, 1.2, [0.1, -0.2, -0.15], hairB);
    // fringe framing the forehead, ending above the eyes
    lock(0, 0.05, 0.95, 0.65, 0.55, 0.35, [0.55, 0, 0], hairB);
    lock(-0.5, 0.0, 0.88, 0.48, 0.6, 0.34, [0.55, 0.2, 0.12], hairA);
    lock(0.5, 0.0, 0.88, 0.48, 0.6, 0.34, [0.55, -0.2, -0.12], hairA);
    lock(-0.95, 0.05, 0.7, 0.42, 0.55, 0.32, [0.45, 0.35, 0.18], hairB);
    lock(0.95, 0.05, 0.7, 0.42, 0.55, 0.32, [0.45, -0.35, -0.18], hairB);
    // side locks — layered wavy clumps falling past the shoulders on both sides
    const sideLocks = [
      // upper
      [-1.35, -0.15, 0.45, 0.7, 1.5, 0.7, [0.25, 0.35, 0.2], hairB],
      [ 1.35, -0.15, 0.45, 0.7, 1.5, 0.7, [0.25, -0.35, -0.2], hairB],
      [-1.55, -0.35, 0.05, 0.75, 1.8, 0.75, [0.2, 0.15, 0.28], hairA],
      [ 1.55, -0.35, 0.05, 0.75, 1.8, 0.75, [0.2, -0.15, -0.28], hairA],
      [-1.7, -1.3, 0.2, 0.7, 2.1, 0.7, [0.35, 0.25, 0.3], hairA],
      [ 1.7, -1.3, 0.2, 0.7, 2.1, 0.7, [0.35, -0.25, -0.3], hairA],
      [-1.85, -2.2, 0.05, 0.72, 2.4, 0.72, [0.45, 0.15, 0.28], hairC],
      [ 1.85, -2.2, 0.05, 0.72, 2.4, 0.72, [0.45, -0.15, -0.28], hairC],
      // mid, past the shoulders
      [-1.65, -3.3, -0.05, 0.7, 2.2, 0.7, [0.55, 0.2, 0.22], hairA],
      [ 1.65, -3.3, -0.05, 0.7, 2.2, 0.7, [0.55, -0.2, -0.22], hairA],
      [-1.95, -3.6, 0.2, 0.62, 2.0, 0.65, [0.6, 0.3, 0.25], hairB],
      [ 1.95, -3.6, 0.2, 0.62, 2.0, 0.65, [0.6, -0.3, -0.25], hairB],
      [-1.4, -4.4, 0.15, 0.6, 1.9, 0.6, [0.7, 0.15, 0.18], hairA],
      [ 1.4, -4.4, 0.15, 0.6, 1.9, 0.6, [0.7, -0.15, -0.18], hairA],
      // lower tips
      [-1.55, -5.3, 0.05, 0.55, 1.6, 0.55, [0.8, 0.2, 0.15], hairC],
      [ 1.55, -5.3, 0.05, 0.55, 1.6, 0.55, [0.8, -0.2, -0.15], hairC],
      [-1.15, -5.7, 0.25, 0.5, 1.35, 0.5, [0.85, 0.1, 0.12], hairB],
      [ 1.15, -5.7, 0.25, 0.5, 1.35, 0.5, [0.85, -0.1, -0.12], hairB],
      // face-framing waves — kept off the cheeks so the face stays open
      [-1.45, -1.0, 0.45, 0.5, 1.8, 0.5, [0.4, 0.45, 0.22], hairB],
      [ 1.45, -1.0, 0.45, 0.5, 1.8, 0.5, [0.4, -0.45, -0.22], hairB],
      [-1.5, -2.2, 0.25, 0.5, 1.7, 0.48, [0.55, 0.35, 0.18], hairA],
      [ 1.5, -2.2, 0.25, 0.5, 1.7, 0.48, [0.55, -0.35, -0.18], hairA]
    ];
    sideLocks.forEach(a => lock.apply(null, a));
    // back curtain, down to mid-back
    const backLocks = [
      [0, -0.4, -1.15, 2.2, 1.8, 0.9, [0.25, 0, 0], hairA],
      [-0.7, -1.5, -1.2, 1.2, 2.2, 0.85, [0.4, 0.12, 0.08], hairC],
      [ 0.7, -1.5, -1.2, 1.2, 2.2, 0.85, [0.4, -0.12, -0.08], hairC],
      [0, -2.6, -1.15, 2.0, 2.4, 0.95, [0.5, 0, 0], hairA],
      [-0.85, -3.6, -0.95, 1.05, 2.2, 0.8, [0.6, 0.15, 0.1], hairA],
      [ 0.85, -3.6, -0.95, 1.05, 2.2, 0.8, [0.6, -0.15, -0.1], hairA],
      [0, -4.5, -0.85, 1.7, 2.0, 0.8, [0.7, 0, 0], hairC],
      [-0.55, -5.5, -0.55, 0.85, 1.6, 0.7, [0.8, 0.1, 0.08], hairB],
      [ 0.55, -5.5, -0.55, 0.85, 1.6, 0.7, [0.8, -0.1, -0.08], hairB],
      [0, -6.2, -0.35, 1.15, 1.3, 0.65, [0.9, 0, 0], hairA]
    ];
    backLocks.forEach(a => lock.apply(null, a));

    const parts = {
      g: g, rig: rig, hip: hip, torso: torso, skirt: skirt, chestTop: chestTop,
      neck: neck, head: head, hair: hair, mic: mic,
      leftLeg: leftLeg, rightLeg: rightLeg, leftArm: leftArm, rightArm: rightArm,
      mats: mats
    };

    P.applyPose(parts, P.stepState(0));
    return parts;
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // Simple 2-bone IK in the thigh-shin plane. Limbs hang along local -Y.
  function ikLeg(leg, hipWorld, footTarget, lenA, lenB, extraBend) {
    const dx = footTarget.x - hipWorld.x;
    const dy = footTarget.y - hipWorld.y;
    const dz = footTarget.z - hipWorld.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const reach = Math.max(0.2, Math.min(lenA + lenB - 0.18, dist));
    const down = Math.max(0.2, hipWorld.y - footTarget.y);
    const thighSwing = Math.atan2(dz, down);
    const abd = clamp(Math.atan2(dx, down), -0.16, 0.16);
    const cosK = (lenA * lenA + lenB * lenB - reach * reach) / (2 * lenA * lenB);
    let kneeBend = Math.PI - Math.acos(clamp(cosK, -1, 1));
    const cosH = (lenA * lenA + reach * reach - lenB * lenB) / (2 * lenA * reach);
    const hipBend = Math.acos(clamp(cosH, -1, 1));
    kneeBend = Math.max(0.16 + (extraBend || 0), kneeBend);
    // Always subtract hipBend: for a rear foot the thigh must go further back so
    // the +rotX knee bend can still reach behind the hip.
    const thighX = thighSwing - hipBend;
    leg.root.rotation.set(0, 0, 0);
    leg.thigh.rotation.set(thighX, 0, abd);
    leg.knee.rotation.set(kneeBend, 0, 0);
    leg.ankle.rotation.set(-(thighX + kneeBend), 0, -abd);
  }

  const _down = /* lazily */ { v: null, tmp: null };
  function v3(x, y, z) { return new THREE.Vector3(x, y, z); }
  function ltw(obj, x, y, z, out) {
    const v = out || v3(0, 0, 0);
    v.set(x || 0, y || 0, z || 0);
    obj.updateWorldMatrix(true, false);
    return obj.localToWorld(v);
  }

  // 2-bone arm IK: point the shoulder's -Y toward the target, bend the elbow toward a pole.
  function ikArm(arm, target, pole, lenA, lenB) {
    const sh = ltw(arm.sh, 0, 0, 0);
    const to = v3(target.x - sh.x, target.y - sh.y, target.z - sh.z);
    const dist = to.length();
    const maxR = lenA + lenB - 0.06;
    const minR = 0.25;
    const reach = clamp(dist, minR, maxR);
    const cosK = (lenA * lenA + lenB * lenB - reach * reach) / (2 * lenA * lenB);
    const kneeBend = Math.PI - Math.acos(clamp(cosK, -1, 1));
    const cosH = (lenA * lenA + reach * reach - lenB * lenB) / (2 * lenA * reach);
    const hipBend = Math.acos(clamp(cosH, -1, 1));
    if (dist > 1e-5) to.multiplyScalar(1 / dist);
    else to.set(0, -1, 0);
    const qAim = new THREE.Quaternion().setFromUnitVectors(v3(0, -1, 0), to);
    const poleDir = v3(pole.x - sh.x, pole.y - sh.y, pole.z - sh.z);
    let axis = v3(0, 0, 0).crossVectors(to, poleDir);
    if (axis.lengthSq() < 1e-6) {
      axis.crossVectors(to, v3(0, 0, 1));
      if (axis.lengthSq() < 1e-6) axis.set(1, 0, 0);
    }
    axis.normalize();
    const qBend = new THREE.Quaternion().setFromAxisAngle(axis, -hipBend);
    qAim.premultiply(qBend);
    const parent = arm.sh.parent;
    parent.updateWorldMatrix(true, false);
    const parentQ = new THREE.Quaternion();
    parent.getWorldQuaternion(parentQ);
    arm.sh.quaternion.copy(parentQ.invert().multiply(qAim));
    arm.elbow.rotation.set(kneeBend, 0, 0);
    arm.elbow.quaternion.setFromEuler(arm.elbow.rotation);
  }

  function lerpV(a, b, t, out) {
    out = out || v3(0, 0, 0);
    out.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
    return out;
  }

  // Hand targets and elbow poles in world space, derived from the posed torso/head.
  function armTargets(parts, poseId) {
    const ct = parts.chestTop, hd = parts.head, hp = parts.hip;
    const mouth = ltw(hd, 0.15, PR.headH * 0.28, PR.headH * 0.58);
    const scalp = ltw(hd, -0.1, PR.headH + 0.25, 0.05);
    const collar = ltw(ct, -0.35, -0.05, 0.9);
    const lHip = ltw(hp, -PR.hipW * 0.62, 0.2, 0.4);
    const lSh = ltw(parts.leftArm.sh, 0, 0, 0);
    const rSh = ltw(parts.rightArm.sh, 0, 0, 0);
    const highL = ltw(ct, -2.05, PR.armLen * 0.95, 0.35);
    const highR = ltw(ct,  2.05, PR.armLen * 0.95, 0.35);
    // mic hand sits just to the right of and slightly below the mouth so the grille can reach the lips
    const micHand = ltw(hd, 0.55, PR.headH * 0.18, PR.headH * 0.45);
    const downL = ltw(parts.leftArm.sh, 0, -(PR.upperArm + PR.lowerArm), 0);
    const downR = ltw(parts.rightArm.sh, 0, -(PR.upperArm + PR.lowerArm), 0);
    const poleLOut = ltw(ct, -3.2, 0.2, -1.2);
    const poleROut = ltw(ct,  3.2, 0.2, -1.2);
    const poleLUp = ltw(ct, -3.4, 2.5, -0.4);
    const poleRUp = ltw(ct,  3.4, 2.5, -0.4);
    const poleLBack = ltw(ct, -2.6, -0.5, -2.0);
    if (poseId === 1) {
      return { L: collar, R: micHand, pL: poleLOut, pR: poleROut, mic: 1 };
    }
    if (poseId === 2) {
      return { L: lHip, R: micHand, pL: poleLBack, pR: poleROut, mic: 1 };
    }
    if (poseId === 3) {
      return { L: scalp, R: micHand, pL: poleLUp, pR: poleROut, mic: 1 };
    }
    if (poseId === 4) {
      return { L: highL, R: highR, pL: poleLUp, pR: poleRUp, mic: 4 };
    }
    return { L: downL, R: downR, pL: poleLOut, pR: poleROut, mic: 0 };
  }


  const ARM = {
    // 1: left at the collarbone, right mic at the mouth
    p1L: { sh: [1.05, 0.55, -0.45], el: [1.55, 0.3, 0.2], wr: [0.3, 0.55, 0.2] },
    p1R: { sh: [1.22, 0.28, -0.42], el: [2.05, 0.15, 0.18], wr: [0.15, 0.2, 0.1] },
    // 2: left on the hip (akimbo), right still singing
    p2L: { sh: [0.25, -0.1, 1.05], el: [1.65, 0.12, 0.45], wr: [0.3, 0.4, 0.55] },
    p2R: { sh: [1.22, 0.28, -0.42], el: [2.05, 0.15, 0.18], wr: [0.15, 0.2, 0.1] },
    // 3: left hand ON TOP of the head (arm up and slightly in, elbow folded over the crown)
    p3L: { sh: [0.35, 0.2, 3.35], el: [1.85, 0.3, -1.2], wr: [0.6, 0.3, 0.2] },
    p3R: { sh: [1.22, 0.28, -0.42], el: [2.05, 0.15, 0.18], wr: [0.15, 0.2, 0.1] },
    // 4: symmetrical high V, both arms nearly straight up, slightly out
    p4L: { sh: [0.1, 0.08, 2.88], el: [0.18, 0, 0.06], wr: [0.1, 0, 0] },
    p4R: { sh: [0.1, -0.08, 2.88], el: [0.18, 0, -0.06], wr: [0.1, 0, 0] }
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
    setEuler(arm.sh, [pose.sh[0], pose.sh[1] * sideSign, pose.sh[2] * sideSign]);
    setEuler(arm.elbow, [pose.el[0], pose.el[1] * sideSign, pose.el[2] * sideSign]);
    setEuler(arm.wrist, [pose.wr[0], pose.wr[1] * sideSign, pose.wr[2] * sideSign]);
  }
  function mixArm(arm, A, B, k, sideSign) {
    setArm(arm, { sh: lerp3(A.sh, B.sh, k), el: lerp3(A.el, B.el, k), wr: lerp3(A.wr, B.wr, k) }, sideSign);
  }

  P.applyPose = function (parts, st, groundY) {
    if (!parts || !st) return;
    const gY = groundY || { l: 0, r: 0, h: 0 };
    parts.hip.position.set(st.hipX, PR.hipY, 0);
    parts.hip.rotation.set(0, st.hipYaw, st.hipRoll);
    parts.torso.position.x = st.torsoSway;
    parts.torso.rotation.set(0.05, st.torsoYaw || 0, st.torsoRoll);
    parts.head.rotation.set(st.headNod, st.headYaw, -st.torsoRoll * 0.3);

    // Legs first, then arms (which need an up-to-date torso/head matrix).
    const u = st.u;
    const cushL = st.left.planted ? ((u < 0.35) ? Math.sin((u / 0.35) * Math.PI) * 0.18 : 0.05) : 0.08;
    const cushR = st.right.planted ? ((u < 0.35) ? Math.sin((u / 0.35) * Math.PI) * 0.18 : 0.05) : 0.08;
    // Solve IK in hip-local space so a rolled/yawed pelvis still plants the feet.
    parts.hip.updateMatrix();
    const hipInv = new THREE.Matrix4().copy(parts.hip.matrix).invert();
    function footInHip(foot, g) {
      const v = new THREE.Vector3(foot.x, g + PR.bootH + foot.y, foot.z - st.hipZ);
      v.applyMatrix4(hipInv);
      return v;
    }
    ikLeg(parts.leftLeg, { x: parts.leftLeg.root.position.x, y: 0, z: 0 }, footInHip(st.left, gY.l), PR.thigh, PR.shin, cushL);
    ikLeg(parts.rightLeg, { x: parts.rightLeg.root.position.x, y: 0, z: 0 }, footInHip(st.right, gY.r), PR.thigh, PR.shin, cushR);

    const k = st.poseBlend == null ? 1 : st.poseBlend;
    const A = POSES[st.prevPose] || POSES[1];
    const B = POSES[st.pose] || POSES[1];
    mixArm(parts.leftArm, A.L, B.L, k, -1);
    mixArm(parts.rightArm, A.R, B.R, k, 1);
    const micKind = (st.pose === 4) ? k : (st.prevPose === 4 ? 1 - k : 0);
    if (parts.mic) parts.mic.rotation.set(-0.2 - 0.3 * micKind, 0.15, 0.2 + 0.1 * micKind);
  };

  P.ikLeg = ikLeg;
  P.ikArm = ikArm;
})(typeof window !== 'undefined' ? window : globalThis);
