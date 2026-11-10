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
  // Always fully opaque, never faded by scene fog or distance alpha.
  const VIS = { fog: false, transparent: false, opacity: 1, depthWrite: true, depthTest: true, alphaTest: 0 };
  function phong(opts) {
    const o = Object.assign({ color: 0xffffff, shininess: 50, specular: 0x333333 }, VIS, opts || {}, VIS);
    if (typeof THREE.MeshPhongMaterial === 'function') return new THREE.MeshPhongMaterial(o);
    return new THREE.MeshLambertMaterial(o);
  }
  function lamb(opts) {
    return new THREE.MeshLambertMaterial(Object.assign({ color: 0xffffff }, VIS, opts || {}, VIS));
  }

  function sequinMaps() {
    const S = 512;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const e = document.createElement('canvas'); e.width = S; e.height = S;
    const g = c.getContext('2d');
    const h = e.getContext('2d');
    const lg = g.createLinearGradient(0, 0, 0, S);
    lg.addColorStop(0, '#ffe34a');
    lg.addColorStop(0.35, '#f2c518');
    lg.addColorStop(0.7, '#ffd21c');
    lg.addColorStop(1, '#e8b40e');
    g.fillStyle = lg; g.fillRect(0, 0, S, S);
    h.fillStyle = '#000'; h.fillRect(0, 0, S, S);
    for (let i = 0; i < 14; i++) {
      g.fillStyle = i % 2 ? 'rgba(255,236,120,0.28)' : 'rgba(200,140,10,0.18)';
      g.fillRect(i * 36 + 4, 0, 12, S);
    }
    function plus(ctx, x, y, r, fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(x - r * 3.1, y - r * 0.45, r * 6.2, r * 0.9);
      ctx.fillRect(x - r * 0.45, y - r * 3.1, r * 0.9, r * 6.2);
      ctx.beginPath(); ctx.arc(x, y, r * 1.1, 0, 6.3); ctx.fill();
    }
    const sparks = [
      'rgba(255,255,255,ALP)', 'rgba(255,248,200,ALP)',
      'rgba(255,230,80,ALP)', 'rgba(255,210,40,ALP)'
    ];
    for (let i = 0; i < 4200; i++) {
      const x = Math.random() * S, y = Math.random() * S;
      const sz = 0.7 + Math.random() * 2.2;
      const a = 0.50 + Math.random() * 0.50;
      g.fillStyle = sparks[i % sparks.length].replace('ALP', a.toFixed(2));
      g.beginPath(); g.arc(x, y, sz, 0, 6.3); g.fill();
      if (a > 0.78) {
        h.fillStyle = 'rgba(255,240,160,' + ((a - 0.35) * 1.25).toFixed(2) + ')';
        h.beginPath(); h.arc(x, y, sz * 1.25, 0, 6.3); h.fill();
      }
    }
    // Gold sequin glints: 4-point sparkles, not just soft dots.
    for (let i = 0; i < 160; i++) {
      const x = Math.random() * S, y = Math.random() * S;
      const r = 1.6 + Math.random() * 2.4;
      plus(g, x, y, r, 'rgba(255,255,255,0.98)');
      plus(h, x, y, r * 1.25, 'rgba(255,248,200,1)');
    }
    const map = tagTex(new THREE.CanvasTexture(c));
    const emissiveMap = tagTex(new THREE.CanvasTexture(e));
    [map, emissiveMap].forEach(t => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2.4, 2.4);
      t.anisotropy = 8;
      t.needsUpdate = true;
    });
    return { map, emissiveMap };
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
      color: 0xffd21c, map: seq.map, emissive: 0xcc8800,
      emissiveMap: seq.emissiveMap, shininess: 140, specular: 0xfff8d8
    };
    try { dressOpts.emissiveIntensity = 1.55; } catch (_) {}
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

    // Discrete gold sequin glints (plus-shaped sprites) that catch the light.
    const glints = [];
    const glintMat = new THREE.MeshBasicMaterial({
      color: 0xfff6c8, fog: false, transparent: true, opacity: 0.95,
      depthWrite: false, depthTest: true
    });
    function addGlint(parent, x, y, z, s) {
      const grp = new THREE.Group();
      const arm = new THREE.Mesh(new THREE.BoxGeometry(s * 3.4, s * 0.38, s * 0.16), glintMat);
      const upright = new THREE.Mesh(new THREE.BoxGeometry(s * 0.38, s * 3.4, s * 0.16), glintMat);
      const core = new THREE.Mesh(new THREE.BoxGeometry(s * 1.1, s * 1.1, s * 0.2), glintMat);
      core.rotation.z = Math.PI / 4;
      grp.add(arm); grp.add(upright); grp.add(core);
      grp.position.set(x, y, z);
      parent.add(grp);
      glints.push(grp);
    }
    // Chest / bodice front
    addGlint(torso, -0.85, 4.55, 1.22, 0.10);
    addGlint(torso,  0.70, 4.85, 1.24, 0.12);
    addGlint(torso,  0.15, 4.20, 1.20, 0.09);
    addGlint(torso, -0.40, 3.40, 1.08, 0.11);
    addGlint(torso,  1.10, 3.55, 1.00, 0.08);
    addGlint(torso, -1.15, 4.15, 0.95, 0.09);
    addGlint(torso,  0.55, 2.50, 0.88, 0.08);
    addGlint(torso, -0.20, 1.55, 1.05, 0.10);
    // Skirt front and sides
    addGlint(skirt, -1.10, -0.70, 1.22, 0.11);
    addGlint(skirt,  0.90, -1.10, 1.24, 0.13);
    addGlint(skirt,  0.10, -1.85, 1.18, 0.09);
    addGlint(skirt, -0.70, -2.40, 1.16, 0.10);
    addGlint(skirt,  1.25, -2.55, 1.10, 0.08);
    addGlint(skirt,  0.35, -3.15, 1.20, 0.12);
    addGlint(skirt, -1.40, -1.50, 0.70, 0.09);
    addGlint(skirt,  1.50, -1.70, 0.65, 0.08);
    addGlint(skirt, -0.20, -0.40, 1.26, 0.10);
    addGlint(torso,  1.40, 4.60, 0.55, 0.08);
    addGlint(torso, -1.35, 4.70, 0.50, 0.07);

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
    mic.position.set(0.10, -PR.hand * 0.25, 0.35);
    const handle = box(0.2, 0.2, 1.2, micBlk, 0, 0, 0.4, mic);
    const grille = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), micGrille);
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

    // ---- long wavy blonde hair: chained S-curve locks, face left open for the mic ----
    const hair = new THREE.Group(); hair.position.y = PR.headH; head.add(hair);
    function lock(x, y, z, w, hh, d, rot, mat) {
      return box(w, hh, d, mat || hairA, x, y, z, hair, rot);
    }
    // Crown volume on the scalp — does not come forward over the face.
    lock(0, 0.55, -0.20, 2.15, 1.05, 2.00, null, hairB);
    lock(0, 1.08, -0.30, 1.70, 0.70, 1.55, [0.15, 0, 0], hairA);
    lock(-0.60, 0.72, 0.00, 1.05, 0.68, 1.10, [0.10, 0.22, 0.15], hairB);
    lock( 0.60, 0.72, 0.00, 1.05, 0.68, 1.10, [0.10, -0.22, -0.15], hairB);
    // Short fringe ending above the eyes; sides kept out of the mouth/mic lane.
    lock(0, 0.08, 0.92, 0.62, 0.50, 0.32, [0.55, 0, 0], hairB);
    lock(-0.52, 0.02, 0.82, 0.44, 0.52, 0.30, [0.55, 0.22, 0.12], hairA);
    lock( 0.52, 0.02, 0.82, 0.44, 0.52, 0.30, [0.55, -0.22, -0.12], hairA);
    lock(-1.00, 0.06, 0.58, 0.40, 0.50, 0.28, [0.42, 0.38, 0.16], hairB);
    lock( 1.00, 0.06, 0.58, 0.40, 0.50, 0.28, [0.42, -0.38, -0.16], hairB);

    // One falling lock as overlapping boxes along an S-curve in X and a slower Z wave.
    function waveStrand(x0, y0, z0, segs, len, w, d, phase, side, mat, flare) {
      const fl = flare == null ? 0.22 : flare;
      for (let i = 0; i < segs; i++) {
        const t = (i + 0.5) / segs;
        const amp = 0.16 + t * 0.46;
        const wx = Math.sin(phase + t * Math.PI * 2.25) * amp * side;
        const wz = Math.cos(phase * 0.8 + t * Math.PI * 1.65) * (0.08 + t * 0.16);
        const x = x0 + side * t * fl + wx;
        const y = y0 - t * len;
        const z = z0 + wz;
        const taper = 1 - t * 0.34;
        const pitch = 0.22 + t * 0.42 + wz * 0.45;
        const yaw = side * 0.10 + wx * 0.40;
        const roll = side * (0.16 + t * 0.10) + wx * 0.55;
        lock(x, y, z, w * taper, (len / segs) * 1.18, d * taper, [pitch, yaw, roll], mat);
      }
    }
    // Side and face-framing waves: start beside the temples, fall past the shoulders.
    // z starts near 0 / slightly back so the front view keeps the mic and face clear.
    const STRANDS = [
      // outer side curtain
      { x: 1.62, y: -0.10, z: -0.05, segs: 8, len: 6.4, w: 0.46, d: 0.42, ph: 0.2, mat: hairA, fl: 0.28 },
      { x: 1.78, y: -0.20, z:  0.10, segs: 8, len: 6.1, w: 0.42, d: 0.40, ph: 1.4, mat: hairB, fl: 0.32 },
      { x: 1.48, y: -0.05, z: -0.22, segs: 7, len: 5.8, w: 0.44, d: 0.40, ph: 2.2, mat: hairC, fl: 0.20 },
      { x: 1.95, y: -0.35, z:  0.00, segs: 7, len: 5.6, w: 0.40, d: 0.38, ph: 3.1, mat: hairA, fl: 0.36 },
      // mid-side volume
      { x: 1.55, y: -0.15, z:  0.18, segs: 7, len: 5.5, w: 0.40, d: 0.36, ph: 0.8, mat: hairB, fl: 0.24 },
      { x: 1.70, y: -0.55, z: -0.15, segs: 6, len: 5.2, w: 0.42, d: 0.38, ph: 2.7, mat: hairC, fl: 0.26 },
      // face-framing — pulled out to the side (x>=1.45) and not past z=0.22
      { x: 1.45, y: -0.20, z:  0.16, segs: 7, len: 5.0, w: 0.36, d: 0.34, ph: 0.5, mat: hairB, fl: 0.18 }
    ];
    STRANDS.forEach(st => {
      waveStrand( st.x, st.y, st.z, st.segs, st.len, st.w, st.d, st.ph,  1, st.mat, st.fl);
      waveStrand(-st.x, st.y, st.z, st.segs, st.len, st.w, st.d, st.ph + 0.35, -1, st.mat, st.fl);
    });
    // Back curtain, also in S-curve strands down to mid-back.
    const BACK = [
      { x: 0.00, y: -0.25, z: -1.15, segs: 8, len: 6.3, w: 0.70, d: 0.55, ph: 0.4, mat: hairA, fl: 0.00 },
      { x: 0.55, y: -0.30, z: -1.10, segs: 8, len: 6.1, w: 0.50, d: 0.48, ph: 1.1, mat: hairC, fl: 0.08 },
      { x: 0.95, y: -0.40, z: -0.95, segs: 7, len: 5.7, w: 0.46, d: 0.44, ph: 2.0, mat: hairA, fl: 0.12 },
      { x: 0.30, y: -0.20, z: -1.22, segs: 7, len: 5.9, w: 0.52, d: 0.50, ph: 2.8, mat: hairB, fl: 0.04 }
    ];
    BACK.forEach(st => {
      waveStrand( st.x, st.y, st.z, st.segs, st.len, st.w, st.d, st.ph,  1, st.mat, st.fl);
      if (st.x !== 0) waveStrand(-st.x, st.y, st.z, st.segs, st.len, st.w, st.d, st.ph + 0.4, -1, st.mat, st.fl);
    });

    const parts = {
      g: g, rig: rig, hip: hip, torso: torso, skirt: skirt, chestTop: chestTop,
      neck: neck, head: head, hair: hair, mic: mic, glints: glints,
      leftLeg: leftLeg, rightLeg: rightLeg, leftArm: leftArm, rightArm: rightArm,
      mats: mats
    };

    P.applyPose(parts, P.stepState(0));
    P.dressVisible(parts);
    return parts;
  };

  // Keep her crisp and fully visible at any distance: no fog, no fade, not culled,
  // and her own fill light so the gold dress and blonde hair stay vivid.
  P.dressVisible = function (parts) {
    const g = parts && parts.g;
    if (!g) return parts;
    const mats = parts.mats || [];
    const applyMat = m => {
      if (!m) return;
      m.fog = false;
      m.transparent = false;
      m.opacity = 1;
      m.depthWrite = true;
      m.depthTest = true;
      try { m.alphaTest = 0; } catch (_) {}
      try { if (m.alphaMap) m.alphaMap = null; } catch (_) {}
      try { m.toneMapped = false; } catch (_) {}
    };
    mats.forEach(applyMat);
    g.name = g.name || 'popstar';
    g.frustumCulled = false;
    g.traverse(function (o) {
      o.frustumCulled = false;
      if (o.material) [].concat(o.material).forEach(applyMat);
      if (o.geometry) {
        try {
          o.geometry.computeBoundingSphere();
          if (o.geometry.boundingSphere) {
            o.geometry.boundingSphere.radius = Math.max(o.geometry.boundingSphere.radius, 48);
          }
        } catch (_) {}
      }
    });
    try {
      if (typeof THREE !== 'undefined' && THREE.Sphere) {
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 16, 0), 56);
      }
    } catch (_) {}
    if (!parts.light && typeof THREE !== 'undefined' && THREE.PointLight) {
      const lit = new THREE.PointLight(0xfff2c8, 1.6, 90, 1.2);
      lit.position.set(0, 18, 5);
      lit.frustumCulled = false;
      lit.name = 'popstarFill';
      g.add(lit);
      parts.light = lit;
    }
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
    const micHand = ltw(hd, 0.62, PR.headH * 0.16, PR.headH * 0.92);
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
    aimMic(parts, micKind);
    twinkleGlints(parts, st);
  };

  // Place the grille at the mouth, in front of the face — never buried in the hair.
  function aimMic(parts, micKind) {
    if (!parts.mic || !parts.head || !parts.rightArm || !parts.rightArm.hand) return;
    if (micKind > 0.85) {
      parts.mic.position.set(0.10, -PR.hand * 0.25, 0.35);
      parts.mic.rotation.set(-0.50, 0.15, 0.30);
      parts.mic.scale.set(1, 1, 1);
      return;
    }
    parts.head.updateWorldMatrix(true, false);
    parts.rightArm.hand.updateWorldMatrix(true, false);
    const mouthW = ltw(parts.head, 0.32, PR.headH * 0.18, PR.headH * 0.92);
    const handW = new THREE.Vector3();
    parts.rightArm.hand.getWorldPosition(handW);
    const dir = mouthW.clone().sub(handW);
    if (dir.length() < 0.15) dir.set(0, 0.1, 1);
    dir.normalize();
    const originW = mouthW.clone().addScaledVector(dir, -1.2);
    const z = dir;
    const tmp = Math.abs(z.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const x = tmp.clone().cross(z).normalize();
    const y = z.clone().cross(x).normalize();
    const mat = new THREE.Matrix4().makeBasis(x, y, z);
    mat.setPosition(originW);
    const local = new THREE.Matrix4().copy(parts.rightArm.hand.matrixWorld).invert().multiply(mat);
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    local.decompose(pos, quat, scl);
    parts.mic.position.copy(pos);
    parts.mic.quaternion.copy(quat);
    parts.mic.scale.set(1, 1, 1);
  }

  function twinkleGlints(parts, st) {
    if (!parts.glints || !parts.glints.length) return;
    const t = (st && (st.t != null ? st.t : st.u)) || 0;
    const pose = (st && st.pose) || 0;
    for (let i = 0; i < parts.glints.length; i++) {
      const g = parts.glints[i];
      const pulse = 0.45 + 0.55 * Math.max(0, Math.sin(t * 7.5 + i * 1.73 + pose));
      g.scale.setScalar(0.65 + 0.70 * pulse);
    }
  }

  P.ikLeg = ikLeg;
  P.ikArm = ikArm;
})(typeof window !== 'undefined' ? window : globalThis);
