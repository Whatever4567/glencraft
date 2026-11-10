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

  function hairMaps() {
    const S = 256;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const g = c.getContext('2d');
    const lg = g.createLinearGradient(0, 0, S, 0);
    lg.addColorStop(0, '#d4a84a');
    lg.addColorStop(0.22, '#f0d078');
    lg.addColorStop(0.5, '#fff3c0');
    lg.addColorStop(0.78, '#f0d078');
    lg.addColorStop(1, '#c4923a');
    g.fillStyle = lg; g.fillRect(0, 0, S, S);
    // soft strand lines
    for (let i = 0; i < 40; i++) {
      const x = (i + 0.3) * (S / 40);
      g.strokeStyle = i % 3 === 0 ? 'rgba(255,255,230,0.28)' : 'rgba(160,110,30,0.18)';
      g.lineWidth = 1 + (i % 2);
      g.beginPath();
      g.moveTo(x, 0);
      g.quadraticCurveTo(x + 4, S * 0.5, x, S);
      g.stroke();
    }
    const map = tagTex(new THREE.CanvasTexture(c));
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(2, 4);
    return map;
  }

  function sequinMaps() {
    const S = 1024;
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
    for (let i = 0; i < 18; i++) {
      g.fillStyle = i % 2 ? 'rgba(255,236,120,0.18)' : 'rgba(200,140,10,0.12)';
      g.fillRect(i * 56 + 6, 0, 16, S);
    }
    // Dense fine sequin field — tiny discs, not chunky sparks.
    for (let i = 0; i < 28000; i++) {
      const x = Math.random() * S, y = Math.random() * S;
      const sz = 0.35 + Math.random() * 0.95;
      const a = 0.40 + Math.random() * 0.55;
      const hot = Math.random() < 0.22;
      g.fillStyle = hot ? ('rgba(255,255,245,' + a.toFixed(2) + ')')
                        : (Math.random() < 0.5 ? ('rgba(255,230,90,' + a.toFixed(2) + ')')
                                               : ('rgba(255,248,200,' + a.toFixed(2) + ')'));
      g.beginPath(); g.arc(x, y, sz, 0, 6.3); g.fill();
      if (hot && a > 0.7) {
        h.fillStyle = 'rgba(255,240,170,' + ((a - 0.25) * 0.9).toFixed(2) + ')';
        h.beginPath(); h.arc(x, y, sz * 1.15, 0, 6.3); h.fill();
      }
    }
    // A few slightly larger but still fine glints
    for (let i = 0; i < 220; i++) {
      const x = Math.random() * S, y = Math.random() * S;
      const r = 0.9 + Math.random() * 1.3;
      g.fillStyle = 'rgba(255,255,255,0.92)';
      g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill();
      g.fillRect(x - r * 2.2, y - r * 0.28, r * 4.4, r * 0.56);
      g.fillRect(x - r * 0.28, y - r * 2.2, r * 0.56, r * 4.4);
      h.fillStyle = 'rgba(255,248,210,0.9)';
      h.beginPath(); h.arc(x, y, r * 1.2, 0, 6.3); h.fill();
    }
    const map = tagTex(new THREE.CanvasTexture(c));
    const emissiveMap = tagTex(new THREE.CanvasTexture(e));
    [map, emissiveMap].forEach(t => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(4.0, 4.0);
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
  function sphere(r, mat, x, y, z, parent, seg) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg || 12, seg || 10), mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = false; m.receiveShadow = false;
    if (parent) parent.add(m);
    return m;
  }
  // Rounded limb: cylinder with spherical caps. Works on THREE r128 (no CapsuleGeometry).
  function capsule(r, len, mat, x, y, z, parent, seg) {
    seg = seg || 10;
    const g = new THREE.Group();
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r, r, Math.max(len, 0.05), seg), mat);
    const top = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, (seg / 2) | 0)), mat);
    const bot = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, (seg / 2) | 0)), mat);
    top.position.y = len / 2; bot.position.y = -len / 2;
    g.add(cyl); g.add(top); g.add(bot);
    g.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(g);
    return g;
  }
  function lathe(profile, mat, parent, segs, x, y, z) {
    const pts = profile.map(p => new THREE.Vector2(p[0], p[1]));
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, segs || 24), mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = false; m.receiveShadow = false;
    if (parent) parent.add(m);
    return m;
  }
  // A few large tapered ribbon locks along a gentle S-curve (not a cloud of boxes).
  function hairRibbon(pts, r0, r1, mat, parent, tubular, radial) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    tubular = tubular || 20; radial = radial || 8;
    const geo = new THREE.TubeGeometry(curve, tubular, r0, radial, false);
    const pos = geo.attributes.position;
    for (let i = 0; i <= tubular; i++) {
      const t = i / tubular;
      const r = r0 * (1 - t) + r1 * t;
      const scale = r / r0;
      const c = curve.getPoint(t);
      for (let j = 0; j <= radial; j++) {
        const k = (i * (radial + 1) + j) * 3;
        pos.array[k]     = c.x + (pos.array[k]     - c.x) * scale;
        pos.array[k + 1] = c.y + (pos.array[k + 1] - c.y) * scale;
        pos.array[k + 2] = c.z + (pos.array[k + 2] - c.z) * scale;
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
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
    const hairMap = hairMaps();
    const hairA = addM(phong({ color: 0xffe08a, map: hairMap, shininess: 22, specular: 0x665533, emissive: 0x2a2208 }));
    const hairB = addM(phong({ color: 0xfff3c4, map: hairMap, shininess: 28, specular: 0x776644, emissive: 0x33280a }));
    const hairC = addM(phong({ color: 0xe8c45a, map: hairMap, shininess: 18, specular: 0x554422, emissive: 0x221a06 }));
    const seq = sequinMaps();
    const dressOpts = {
      color: 0xffd21c, map: seq.map, emissive: 0xcc8800,
      emissiveMap: seq.emissiveMap, shininess: 70, specular: 0xeedd88
    };
    try { dressOpts.emissiveIntensity = 1.35; } catch (_) {}
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

    // ---- legs: rounded capsules, not raw boxes ----
    function makeLeg(side) {
      const root = new THREE.Group(); root.position.set(side * PR.hipW * 0.22, 0, 0); hip.add(root);
      const thigh = new THREE.Group(); root.add(thigh);
      capsule(PR.thighW * 0.48, PR.thigh * 0.92, skin, 0, -PR.thigh / 2, 0, thigh, 12);
      const knee = new THREE.Group(); knee.position.y = -PR.thigh; thigh.add(knee);
      sphere(PR.thighW * 0.42, skinSh, 0, 0, 0, knee, 10);
      const shin = new THREE.Group(); knee.add(shin);
      capsule(PR.shinW * 0.48, PR.shin * 0.90, skinSh, 0, -PR.shin / 2, 0, shin, 12);
      const ankle = new THREE.Group(); ankle.position.y = -PR.shin; shin.add(ankle);
      const boot = new THREE.Group(); ankle.add(boot);
      // chunky gold ankle boots, slightly rounded
      sphere(PR.bootW * 0.48, bootM, 0, -PR.bootH * 0.28, 0.10, boot, 10);
      capsule(PR.bootW * 0.46, PR.bootH * 0.55, bootM, 0, -PR.bootH * 0.55, 0.22, boot, 10);
      const toe = sphere(PR.bootW * 0.42, bootM, 0, -PR.bootH * 0.78, 0.55, boot, 10);
      toe.scale.set(1.15, 0.7, 1.35);
      box(PR.bootW * 1.05, 0.16, PR.bootD * 1.02, bootSole, 0, -PR.bootH * 1.00, 0.36, boot);
      return { root: root, thigh: thigh, knee: knee, shin: shin, ankle: ankle, boot: boot, side: side };
    }
    const leftLeg = makeLeg(-1), rightLeg = makeLeg(1);

    // ---- torso / fitted strapless tube dress (lathed hourglass, not stacked boxes) ----
    const torso = new THREE.Group(); torso.name = 'torso'; hip.add(torso);
    lathe([
      [PR.hipW * 0.48, -0.25],
      [PR.hipW * 0.46, 0.15],
      [PR.hipW * 0.42, 0.9],
      [PR.waistW * 0.52, 2.15],
      [PR.waistW * 0.50, 2.6],
      [PR.chestW * 0.42, 3.35],
      [PR.chestW * 0.50, 4.35],
      [PR.chestW * 0.52, 4.85],
      [PR.chestW * 0.48, 5.35],
      [PR.chestW * 0.40, 5.52]
    ], dress, torso, 28);
    // soft bust rounding
    const bustL = sphere(0.85, dress, -0.62, 4.55, 0.55, torso, 12);
    bustL.scale.set(1.05, 0.85, 0.9);
    const bustR = sphere(0.85, dress,  0.62, 4.55, 0.55, torso, 12);
    bustR.scale.set(1.05, 0.85, 0.9);
    // darker gold belt + white star buckle
    const beltM = new THREE.Mesh(new THREE.TorusGeometry(PR.waistW * 0.54, 0.18, 8, 24), belt);
    beltM.rotation.x = Math.PI / 2; beltM.position.set(0, 2.45, 0.04); torso.add(beltM);
    sphere(0.42, starM, 0, 2.45, 1.05, torso, 8);

    const skirt = new THREE.Group(); hip.add(skirt);
    lathe([
      [PR.hipW * 0.48,  0.35],
      [PR.hipW * 0.50, -0.85],
      [PR.hipW * 0.52, -1.85],
      [PR.hipW * 0.55, -2.65],
      [PR.hipW * 0.62, -3.35],
      [PR.hipW * 0.58, -3.55]
    ], dress, skirt, 28);

    // Fine twinkling glints — small, many, not chunky plus signs
    const glints = [];
    const glintMat = new THREE.MeshBasicMaterial({
      color: 0xfff8d8, fog: false, transparent: true, opacity: 0.85,
      depthWrite: false, depthTest: true
    });
    function addGlint(parent, x, y, z, s) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(s, 6, 6), glintMat);
      m.position.set(x, y, z);
      parent.add(m);
      glints.push(m);
    }
    const GLINTS = [
      [torso, -0.85, 4.55, 1.18, 0.045], [torso,  0.70, 4.85, 1.20, 0.05],
      [torso,  0.15, 4.20, 1.16, 0.04],  [torso, -0.40, 3.40, 1.02, 0.045],
      [torso,  1.05, 3.55, 0.92, 0.04],  [torso, -1.10, 4.15, 0.88, 0.04],
      [torso,  0.55, 2.50, 0.85, 0.035], [torso, -0.20, 1.55, 1.00, 0.04],
      [torso,  1.25, 4.60, 0.50, 0.035], [torso, -1.30, 4.70, 0.48, 0.03],
      [torso,  0.90, 5.10, 0.70, 0.035], [torso, -0.70, 5.00, 0.72, 0.03],
      [skirt, -1.10, -0.70, 1.18, 0.045], [skirt,  0.90, -1.10, 1.20, 0.05],
      [skirt,  0.10, -1.85, 1.14, 0.04],  [skirt, -0.70, -2.40, 1.12, 0.04],
      [skirt,  1.20, -2.55, 1.05, 0.035], [skirt,  0.35, -3.15, 1.16, 0.045],
      [skirt, -1.35, -1.50, 0.68, 0.035], [skirt,  1.40, -1.70, 0.62, 0.03],
      [skirt, -0.20, -0.40, 1.22, 0.04],  [skirt,  0.60, -2.90, 1.10, 0.035]
    ];
    GLINTS.forEach(a => addGlint.apply(null, a));

    // ---- shoulders / rounded arms (dress is strapless) ----
    const chestTop = new THREE.Group(); chestTop.position.y = PR.torso; torso.add(chestTop);
    // collarbone / upper chest skin
    const collar = sphere(0.7, skin, 0, -0.15, 0.20, chestTop, 10);
    collar.scale.set(1.8, 0.45, 1.0);

    function makeArm(side) {
      const sh = new THREE.Group();
      sh.position.set(side * (PR.shoulderW * 0.52), -0.2, 0);
      chestTop.add(sh);
      sphere(0.62, skin, side * 0.10, 0, 0, sh, 10);
      const upper = new THREE.Group(); sh.add(upper);
      capsule(0.48, PR.upperArm * 0.92, skin, 0, -PR.upperArm / 2, 0, upper, 10);
      const elbow = new THREE.Group(); elbow.position.y = -PR.upperArm; upper.add(elbow);
      sphere(0.42, skin, 0, 0, 0, elbow, 8);
      const lower = new THREE.Group(); elbow.add(lower);
      capsule(0.40, PR.lowerArm * 0.90, skin, 0, -PR.lowerArm / 2, 0, lower, 10);
      // gold bangles as thin toruses
      for (const [yy, rr] of [[-0.32, 0.50], [-0.52, 0.52], [-0.70, 0.48]]) {
        const b = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.06, 6, 14), goldShiny);
        b.rotation.x = Math.PI / 2; b.position.y = yy; lower.add(b);
      }
      const wrist = new THREE.Group(); wrist.position.y = -PR.lowerArm; lower.add(wrist);
      const hand = new THREE.Group(); wrist.add(hand);
      const palm = sphere(0.38, skin, 0, -PR.hand * 0.35, 0.06, hand, 8);
      palm.scale.set(0.95, 1.15, 0.7);
      for (let i = -1.5; i <= 1.5; i += 1) {
        capsule(0.08, 0.42, skin, i * 0.14, -PR.hand - 0.05, 0.10, hand, 6);
      }
      return { sh: sh, upper: upper, elbow: elbow, lower: lower, wrist: wrist, hand: hand, side: side };
    }
    const leftArm = makeArm(-1), rightArm = makeArm(1);

    // Microphone stays IN the right hand. Grille is small and sits near, not over, the mouth.
    const mic = new THREE.Group();
    rightArm.hand.add(mic);
    mic.position.set(0.10, -PR.hand * 0.15, 0.22);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.05, 8), micBlk);
    handle.rotation.x = Math.PI / 2; handle.position.set(0, 0, 0.42); mic.add(handle);
    const grille = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 8), micGrille);
    grille.position.set(0, 0, 1.00); grille.scale.set(1.0, 1.0, 1.15); mic.add(grille);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.14, 8), micBlk);
    cap.rotation.x = Math.PI / 2; cap.position.set(0, 0, 0.82); mic.add(cap);

    // ---- neck + smoother head ----
    const neck = new THREE.Group(); neck.position.y = PR.torso + PR.neck * 0.15; torso.add(neck);
    capsule(0.38, PR.neck * 0.7, skin, 0, PR.neck * 0.4, 0, neck, 10);
    const choker = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.08, 6, 16), goldShiny);
    choker.rotation.x = Math.PI / 2; choker.position.set(0, 0.12, 0.04); neck.add(choker);

    const head = new THREE.Group(); head.position.y = PR.neck; neck.add(head);
    const hw = PR.headH * 0.78, hd = PR.headH * 0.76;
    // Smooth cranium + slightly narrower jaw, not two boxes.
    const cranium = sphere(PR.headH * 0.48, skin, 0, PR.headH * 0.55, 0.02, head, 18);
    cranium.scale.set(0.95, 1.05, 0.96);
    const jaw = sphere(PR.headH * 0.36, skin, 0, PR.headH * 0.26, 0.06, head, 14);
    jaw.scale.set(0.95, 0.85, 0.92);
    // ears + gold hoops
    const earL = sphere(0.22, skin, -hw * 0.52, PR.headH * 0.50, 0.00, head, 8);
    earL.scale.set(0.55, 1.15, 0.8);
    const earR = sphere(0.22, skin,  hw * 0.52, PR.headH * 0.50, 0.00, head, 8);
    earR.scale.set(0.55, 1.15, 0.8);
    const hoopGeo = new THREE.TorusGeometry(0.30, 0.055, 6, 14);
    const hoopL = new THREE.Mesh(hoopGeo, goldShiny); hoopL.position.set(-hw * 0.55, PR.headH * 0.22, 0.04); hoopL.rotation.x = 0.2; head.add(hoopL);
    const hoopR = new THREE.Mesh(hoopGeo, goldShiny); hoopR.position.set( hw * 0.55, PR.headH * 0.22, 0.04); hoopR.rotation.x = 0.2; head.add(hoopR);

    const eyeY = PR.headH * 0.55, eyeZ = hd * 0.50, eyeX = 0.36;
    function addEye(sx) {
      const w = sphere(0.20, eyeW, sx * eyeX, eyeY, eyeZ + 0.02, head, 8);
      w.scale.set(1.15, 0.85, 0.55);
      sphere(0.11, eyeP, sx * eyeX, eyeY - 0.01, eyeZ + 0.12, head, 8);
      sphere(0.035, eyeW, sx * eyeX - 0.04, eyeY + 0.04, eyeZ + 0.18, head, 6);
      const b = sphere(0.16, lash, sx * eyeX, eyeY + 0.14, eyeZ + 0.02, head, 6);
      b.scale.set(1.3, 0.28, 0.6);
      const br = sphere(0.16, brow, sx * eyeX, eyeY + 0.26, eyeZ - 0.02, head, 6);
      br.scale.set(1.4, 0.25, 0.55);
      br.rotation.z = sx * -0.18;
    }
    addEye(-1); addEye(1);
    // nose
    const bridge = sphere(0.12, skinSh, 0, PR.headH * 0.46, eyeZ + 0.22, head, 8);
    bridge.scale.set(0.7, 1.5, 0.9);
    sphere(0.13, skin, 0, PR.headH * 0.30, eyeZ + 0.34, head, 8);
    // lips
    const mouth = sphere(0.22, lip, 0, PR.headH * 0.18, eyeZ + 0.16, head, 8);
    mouth.scale.set(1.35, 0.45, 0.7);
    const mouthHi = sphere(0.16, lipHi, 0, PR.headH * 0.22, eyeZ + 0.20, head, 8);
    mouthHi.scale.set(1.25, 0.35, 0.6);
    // soft cheeks
    const cheekM = addM(phong({ color: 0xeba08a, shininess: 16, specular: 0x331810 }));
    const chL = sphere(0.20, cheekM, -0.48, PR.headH * 0.36, eyeZ * 0.72, head, 8);
    chL.scale.set(1.1, 0.85, 0.7);
    const chR = sphere(0.20, cheekM,  0.48, PR.headH * 0.36, eyeZ * 0.72, head, 8);
    chR.scale.set(1.1, 0.85, 0.7);

    // ---- long wavy blonde hair: parted continuous mass of large tapered ribbons ----
    const hair = new THREE.Group(); hair.position.y = PR.headH; head.add(hair);
    // A modest scalp under the locks (matte, mostly hidden).
    // Skull-hugging cap + a flattened crown lid that buries tube roots
    // without puffing into a mushroom bowl.
    const scalp = sphere(1.18, hairA, 0, -0.85, -0.08, hair, 18);
    scalp.scale.set(1.12, 1.00, 1.16);
    const lid = sphere(1.08, hairB, 0, -0.08, 0.02, hair, 16);
    lid.scale.set(1.14, 0.50, 1.16);

    function wavePts(x0, y0, z0, len, side, phase, flare, amp, n, zAmp) {
      n = n || 10;
      zAmp = zAmp == null ? 0.22 : zAmp;
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        // Ease out so roots sit on the scalp; waves only grow as the lock falls.
        const te = t * t * (3 - 2 * t);
        const y = y0 - t * len;
        const x = x0 + side * flare * te + side * amp * te * Math.sin(phase + t * Math.PI * 2.2);
        const z = z0 + zAmp * te * Math.sin(phase * 0.6 + t * Math.PI * 1.7) - 0.15 * te;
        pts.push([x, y, z]);
      }
      return pts;
    }
    // Crown locks start at the part (x ≈ ±0.12) and flow out over the head, then down
    // past the shoulders in a gentle S — a mass, not a cloud of boxes or a helmet.
    const LOCKS = [
      // Start beside a clean centre part (not piled on the apex) and fall past the shoulders.
      { x: 0.28, y: -0.06, z:  0.30, len: 7.0, ph: 0.2, fl: 0.70, amp: 0.32, r0: 0.36, r1: 0.14, mat: hairB, za: 0.16 },
      { x: 0.36, y: -0.10, z: -0.08, len: 6.8, ph: 1.1, fl: 0.85, amp: 0.30, r0: 0.34, r1: 0.13, mat: hairA, za: 0.14 },
      { x: 0.42, y: -0.12, z:  0.42, len: 6.2, ph: 2.2, fl: 0.55, amp: 0.26, r0: 0.28, r1: 0.12, mat: hairC, za: 0.14 },
      { x: 0.70, y: -0.16, z:  0.08, len: 6.5, ph: 0.7, fl: 0.40, amp: 0.28, r0: 0.32, r1: 0.13, mat: hairA, za: 0.16 },
      { x: 0.85, y: -0.20, z: 0.38, len: 5.6, ph: 0.4, fl: 0.22, amp: 0.22, r0: 0.22, r1: 0.10, mat: hairB, za: 0.10 }
    ];
    LOCKS.forEach(L => {
      hairRibbon(wavePts( L.x, L.y, L.z, L.len,  1, L.ph, L.fl, L.amp, 11, L.za), L.r0, L.r1, L.mat, hair, 24, 8);
      hairRibbon(wavePts(-L.x, L.y, L.z, L.len, -1, L.ph + 0.2, L.fl, L.amp, 11, L.za), L.r0, L.r1, L.mat, hair, 24, 8);
    });
    // Soft fringe / face-frame, starting at the hairline not the crown apex.
    hairRibbon([
      [-0.12, 0.08, 0.95], [-0.32, -0.15, 1.10], [-0.50, -0.48, 0.88], [-0.52, -0.85, 0.48]
    ], 0.18, 0.09, hairB, hair, 12, 7);
    hairRibbon([
      [ 0.12, 0.08, 0.95], [ 0.32, -0.15, 1.10], [ 0.50, -0.48, 0.88], [ 0.52, -0.85, 0.48]
    ], 0.18, 0.09, hairB, hair, 12, 7);
    // Wide crown sheets that drape from either side of the part over the head.
    hairRibbon([
      [0.16, -0.08, 0.22], [0.45, -0.18, 0.00], [0.72, -0.55, -0.28], [0.88, -1.55, -0.12]
    ], 0.30, 0.13, hairA, hair, 16, 8);
    hairRibbon([
      [-0.16, -0.08, 0.22], [-0.45, -0.18, 0.00], [-0.72, -0.55, -0.28], [-0.88, -1.55, -0.12]
    ], 0.30, 0.13, hairA, hair, 16, 8);
    // Back curtain, mid-back.
    const BACK = [
      { x: 0.00, y: 0.35, z: -0.85, len: 6.6, ph: 0.3, fl: 0.05, amp: 0.16, r0: 0.72, r1: 0.22, mat: hairA, side: 1, za: 0.10 },
      { x: 0.40, y: 0.20, z: -0.90, len: 6.3, ph: 1.0, fl: 0.25, amp: 0.22, r0: 0.50, r1: 0.16, mat: hairC, side: 1, za: 0.12 },
      { x: 0.40, y: 0.20, z: -0.90, len: 6.3, ph: 1.5, fl: 0.25, amp: 0.22, r0: 0.50, r1: 0.16, mat: hairB, side: -1, za: 0.12 }
    ];
    BACK.forEach(L => {
      hairRibbon(wavePts(L.x * L.side, L.y, L.z, L.len, L.side, L.ph, L.fl, L.amp, 11, L.za), L.r0, L.r1, L.mat, hair, 24, 8);
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
    const micHand = ltw(hd, 0.70, PR.headH * 0.12, PR.headH * 0.78);
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
    p1R: { sh: [1.12, 0.38, 0.62], el: [2.08, 0.16, 0.18], wr: [0.12, 0.28, 0.12] },
    // 2: left on the hip (akimbo), right still singing
    p2L: { sh: [0.25, -0.1, 1.05], el: [1.65, 0.12, 0.45], wr: [0.3, 0.4, 0.55] },
    p2R: { sh: [1.12, 0.38, 0.62], el: [2.08, 0.16, 0.18], wr: [0.12, 0.28, 0.12] },
    // 3: left hand ON TOP of the head (arm up and slightly in, elbow folded over the crown)
    p3L: { sh: [0.35, 0.2, 3.35], el: [1.85, 0.3, -1.2], wr: [0.6, 0.3, 0.2] },
    p3R: { sh: [1.12, 0.38, 0.62], el: [2.08, 0.16, 0.18], wr: [0.12, 0.28, 0.12] },
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

  // Keep the mic in the hand. Point the grille toward a spot just to the right
  // of and slightly in front of the lips — never covering the mouth like a gag.
  function aimMic(parts, micKind) {
    if (!parts.mic || !parts.head || !parts.rightArm || !parts.rightArm.hand) return;
    if (micKind > 0.85) {
      parts.mic.position.set(0.10, -PR.hand * 0.15, 0.22);
      parts.mic.rotation.set(-0.55, 0.20, 0.25);
      parts.mic.scale.set(1, 1, 1);
      return;
    }
    // Stay parented to the palm. Only rotate so +Z (grille) aims at the
    // right-of-mouth target; do not teleport the handle out of the hand.
    parts.head.updateWorldMatrix(true, false);
    parts.rightArm.hand.updateWorldMatrix(true, false);
    const targetW = ltw(parts.head, 0.55, PR.headH * 0.18, PR.headH * 0.95);
    const handW = new THREE.Vector3();
    parts.rightArm.hand.getWorldPosition(handW);
    const dir = targetW.clone().sub(handW);
    if (dir.length() < 0.15) dir.set(0.3, 0.15, 0.9);
    dir.normalize();
    // Local +Z of the mic should follow dir. Build a basis, then convert to hand space
    // while keeping the mic origin in the palm.
    const z = dir;
    const tmp = Math.abs(z.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const x = tmp.clone().cross(z).normalize();
    const y = z.clone().cross(x).normalize();
    const mat = new THREE.Matrix4().makeBasis(x, y, z);
    const handInv = new THREE.Matrix4().copy(parts.rightArm.hand.matrixWorld).invert();
    const local = new THREE.Matrix4().multiplyMatrices(handInv, mat);
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    local.decompose(pos, quat, scl);
    parts.mic.position.set(0.10, -PR.hand * 0.15, 0.22);
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
