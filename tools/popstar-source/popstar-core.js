/* GLX-V1251 popstar core: constants, walk math, low-poly model, pose driver.
   Giant pop-star meme mob. Art is original Glencraft low-poly, modelled after the
   user's own AI TikTok (used with permission). No third-party meshes. */
(function (root) {
  const P = root.__popstarCore = root.__popstarCore || {};

  P.BPM = 93.75;
  P.BEAT = 60 / P.BPM;          // 0.64 s
  P.LOOP = 12 * 4 * P.BEAT;     // 30.72 s, matches assets/sfx/popstar_song.*
  P.HEIGHT = 32;                // top of hair, in blocks
  P.STRIDE = 3;                 // slow walk: 3 blocks per beat ~ 4.7 blocks/s
  P.MAX_STEP = 1;               // max step-up / step-down, in blocks
  P.BODY_R = 4.2;               // keep-out radius so the camera cannot enter her
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
    shoulderW: 3.45, waistW: 1.88, hipW: 4.55,
    thighW: 1.92, thighD: 1.7, shinW: 1.48, shinD: 1.28,
    bootW: 1.95, bootD: 2.55,
    upperArm: 3.55, lowerArm: 3.35, hand: 1.05,
    chestW: 3.65, chestD: 2.15
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

  // Dense blonde cap texture with fine strands flowing away from a soft side part.
  function hairCapMap() {
    const S = 512;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const g = c.getContext('2d');
    const lg = g.createLinearGradient(0, 0, S, 0);
    lg.addColorStop(0, '#c4923a');
    lg.addColorStop(0.18, '#e8c45a');
    lg.addColorStop(0.42, '#ffe08a');
    lg.addColorStop(0.55, '#fff3c0');
    lg.addColorStop(0.72, '#f0d078');
    lg.addColorStop(1, '#c4923a');
    g.fillStyle = lg; g.fillRect(0, 0, S, S);
    // Soft side-part groove around u=0.38 (aligned by rotating the cap mesh).
    const partU = 0.38 * S;
    g.fillStyle = 'rgba(120,80,20,0.28)';
    g.fillRect(partU - 7, 0, 14, S);
    g.fillStyle = 'rgba(80,50,10,0.18)';
    g.fillRect(partU - 3, 0, 6, S);
    let seed = 31;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    // Fine strands flowing away from the part on both sides.
    for (let i = 0; i < 140; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const x0 = partU + side * (10 + rnd() * (S * 0.55));
      const w = 0.7 + rnd() * 1.6;
      g.strokeStyle = rnd() < 0.35 ? 'rgba(255,248,220,0.40)' : 'rgba(140,90,25,0.28)';
      g.lineWidth = w;
      g.beginPath();
      g.moveTo(x0, 0);
      g.quadraticCurveTo(x0 + side * (8 + rnd() * 14), S * 0.5, x0 + side * (rnd() * 8 - 4), S);
      g.stroke();
    }
    const map = tagTex(new THREE.CanvasTexture(c));
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1, 2);
    map.anisotropy = 8;
    return map;
  }

  function sequinMaps() {
    const S = 1024;
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const e = document.createElement('canvas'); e.width = S; e.height = S;
    const n = document.createElement('canvas'); n.width = S; n.height = S;
    const g = c.getContext('2d');
    const h = e.getContext('2d');
    const k = n.getContext('2d');
    g.fillStyle = '#c8960c'; g.fillRect(0, 0, S, S);
    h.fillStyle = '#000'; h.fillRect(0, 0, S, S);
    k.fillStyle = '#8080ff'; k.fillRect(0, 0, S, S);
    const imgN = k.getImageData(0, 0, S, S);
    const nd = imgN.data;
    function setN(x, y, nx, ny, nz) {
      const i = (y * S + x) * 4;
      nd[i]     = Math.max(0, Math.min(255, (nx * 0.5 + 0.5) * 255));
      nd[i + 1] = Math.max(0, Math.min(255, (ny * 0.5 + 0.5) * 255));
      nd[i + 2] = Math.max(0, Math.min(255, (nz * 0.5 + 0.5) * 255));
      nd[i + 3] = 255;
    }
    let seed = 19;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    // Relaxed random packing — jittered positions, not a regular grid.
    const pts = [];
    const minD = 11;
    for (let tries = 0; tries < 18000 && pts.length < 4200; tries++) {
      const x = rnd() * S, y = rnd() * S;
      let ok = true;
      for (let j = pts.length - 1; j >= 0 && j >= pts.length - 28; j--) {
        const dx = x - pts[j][0], dy = y - pts[j][1];
        if (dx * dx + dy * dy < minD * minD) { ok = false; break; }
      }
      if (ok) pts.push([x, y, 4.4 + rnd() * 3.6, rnd()]);
    }
    for (let i = 0; i < pts.length; i++) {
      const cx = Math.round(pts[i][0]), cy = Math.round(pts[i][1]);
      const rad = pts[i][2], u = pts[i][3];
      const ir = Math.ceil(rad) + 1;
      const hue = 38 + u * 18;
      const lit = 55 + rnd() * 32;
      g.fillStyle = 'hsl(' + hue.toFixed(0) + ',94%,' + lit.toFixed(0) + '%)';
      g.beginPath(); g.arc(cx, cy, rad, 0, 6.3); g.fill();
      g.fillStyle = 'rgba(255,248,210,0.88)';
      g.beginPath(); g.arc(cx - rad * 0.30, cy - rad * 0.30, rad * 0.36, 0, 6.3); g.fill();
      g.strokeStyle = 'rgba(80,50,0,0.28)';
      g.lineWidth = 0.7;
      g.beginPath(); g.arc(cx, cy, rad, 0, 6.3); g.stroke();
      const hot = u < 0.22 || rnd() < 0.10;
      if (hot) {
        const a = 0.60 + rnd() * 0.40;
        h.fillStyle = 'rgba(255,240,170,' + a.toFixed(2) + ')';
        h.beginPath(); h.arc(cx, cy, rad * 0.75, 0, 6.3); h.fill();
        if (u < 0.08) {
          // plus-shaped sparkle
          g.fillStyle = 'rgba(255,255,245,0.95)';
          const r = rad * 1.6;
          g.fillRect(cx - r * 2.0, cy - r * 0.22, r * 4.0, r * 0.44);
          g.fillRect(cx - r * 0.22, cy - r * 2.0, r * 0.44, r * 4.0);
          h.fillStyle = 'rgba(255,250,220,0.95)';
          h.fillRect(cx - r * 1.6, cy - r * 0.18, r * 3.2, r * 0.36);
          h.fillRect(cx - r * 0.18, cy - r * 1.6, r * 0.36, r * 3.2);
        }
      }
      for (let dy = -ir; dy <= ir; dy++) {
        for (let dx = -ir; dx <= ir; dx++) {
          const px = cx + dx, py = cy + dy;
          if (px < 0 || py < 0 || px >= S || py >= S) continue;
          const d = Math.sqrt(dx * dx + dy * dy) / rad;
          if (d >= 1) continue;
          const nz = Math.sqrt(Math.max(0, 1 - d * d));
          setN(px, py, dx / rad, -dy / rad, nz);
        }
      }
    }
    k.putImageData(imgN, 0, 0);
    const map = tagTex(new THREE.CanvasTexture(c));
    const emissiveMap = tagTex(new THREE.CanvasTexture(e));
    const normalMap = new THREE.CanvasTexture(n);
    try { if (THREE.LinearSRGBColorSpace) normalMap.colorSpace = THREE.LinearSRGBColorSpace; } catch (_) {}
    try { if (THREE.LinearEncoding != null) normalMap.encoding = THREE.LinearEncoding; } catch (_) {}
    normalMap.needsUpdate = true;
    [map, emissiveMap, normalMap].forEach(t => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2.2, 2.2);
      t.anisotropy = 8;
      t.needsUpdate = true;
    });
    return { map: map, emissiveMap: emissiveMap, normalMap: normalMap };
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

    // Warm, light peach-tan skin (lighter than the previous muddy tan).
    const SKIN = 0xf9d6b0, SKIN_SH = 0xefc09a;
    const skin = addM(phong({ color: SKIN, shininess: 12, specular: 0x4a2e18 }));
    const skinSh = addM(phong({ color: SKIN_SH, shininess: 10, specular: 0x3a2414 }));
    const hairMap = hairMaps();
    const hairA = addM(phong({ color: 0xffe08a, map: hairMap, shininess: 14, specular: 0x554422, emissive: 0x2a2208 }));
    const hairB = addM(phong({ color: 0xfff6d8, map: hairMap, shininess: 22, specular: 0xaa9966, emissive: 0x3a2c0c }));
    const hairC = addM(phong({ color: 0xe8c45a, map: hairMap, shininess: 18, specular: 0x554422, emissive: 0x221a06 }));
    const capMap = hairCapMap();
    const hairCap = addM(phong({ color: 0xffe08a, map: capMap, shininess: 16, specular: 0x665522, emissive: 0x2a2208 }));
    const hairPart = addM(phong({ color: 0xc4923a, map: capMap, shininess: 10, specular: 0x443318, emissive: 0x1a1404 }));
    const seq = sequinMaps();
    const dressOpts = {
      color: 0xf0c010, map: seq.map, emissive: 0xaa7700,
      emissiveMap: seq.emissiveMap, normalMap: seq.normalMap,
      shininess: 48, specular: 0xffe08a
    };
    try { dressOpts.emissiveIntensity = 1.45; } catch (_) {}
    try { dressOpts.normalScale = new THREE.Vector2(1.35, 1.35); } catch (_) {}
    const dress = addM(phong(dressOpts));
    const dressDark = addM(phong(Object.assign({}, dressOpts, { color: 0xe8b40e, emissive: 0x4a2e00 })));
    const belt = addM(phong({ color: 0x6a4814, shininess: 40, specular: 0x665533 }));
    const starM = addM(phong({ color: 0xffffff, map: starTex(), shininess: 80, specular: 0xffffff, emissive: 0x333322 }));
    const gold = addM(phong({ color: 0xf0c44a, shininess: 90, specular: 0xfff0c0, emissive: 0x3a2800 }));
    const goldShiny = addM(phong({ color: 0xffe07a, shininess: 120, specular: 0xffffff, emissive: 0x5a3a00 }));
    const bootMap = goldBootTex();
    const bootM = addM(phong({ color: 0xffd24a, map: bootMap, shininess: 100, specular: 0xfff3c8, emissive: 0x3a2800 }));
    const bootSole = addM(phong({ color: 0xb88620, shininess: 40, specular: 0x665522 }));
    const lip = addM(phong({ color: 0xde8492, shininess: 78, specular: 0xffd4dc }));
    const lipHi = addM(phong({ color: 0xf4b8c0, shininess: 95, specular: 0xfff0f4 }));
    const eyeW = addM(lamb({ color: 0xfffaf4 }));
    const eyeP = addM(lamb({ color: 0x1a120e }));
    const irisM = addM(phong({ color: 0x5a7a62, shininess: 40, specular: 0xaac8b8 }));
    const irisRing = addM(lamb({ color: 0x3a4e40 }));
    const lash = addM(lamb({ color: 0x1a100c }));
    const brow = addM(lamb({ color: 0x3a2418 }));
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
      // Shaped calf: thicker in the upper third, tapering to a slim ankle.
      lathe([
        [PR.shinW * 0.30, -0.05],
        [PR.shinW * 0.44, -0.9],
        [PR.shinW * 0.54, -2.15],
        [PR.shinW * 0.48, -3.6],
        [PR.shinW * 0.30, -6.2],
        [PR.shinW * 0.20, -PR.shin + 0.12]
      ], skinSh, shin, 14);
      const ankle = new THREE.Group(); ankle.position.y = -PR.shin; shin.add(ankle);
      const boot = new THREE.Group(); ankle.add(boot);
      boot.position.y = -0.58;
      // Gold high-heel: slim ankle cuff, pointed toe, stiletto post to the ground.
      const cuff = sphere(0.36, bootM, 0, -0.08, 0.04, boot, 10);
      cuff.scale.set(1.05, 0.7, 1.0);
      const vamp = sphere(0.38, bootM, 0, -0.55, 0.38, boot, 10);
      vamp.scale.set(0.95, 0.55, 1.55);
      const toe = sphere(0.20, bootM, 0, -PR.bootH + 0.16, 0.88, boot, 8);
      toe.scale.set(0.85, 0.42, 1.25);
      box(0.50, 0.07, 0.70, bootSole, 0, -PR.bootH, 0.58, boot);
      const heel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.10, PR.bootH * 0.78, 8), bootM);
      heel.position.set(0, -PR.bootH * 0.50, -0.22); boot.add(heel);
      sphere(0.08, bootSole, 0, -PR.bootH, -0.22, boot, 6);
      return { root: root, thigh: thigh, knee: knee, shin: shin, ankle: ankle, boot: boot, side: side };
    }
    const leftLeg = makeLeg(-1), rightLeg = makeLeg(1);

    // ---- torso / sequinned mini-dress: defined waist, hips, spaghetti straps ----
    const torso = new THREE.Group(); torso.name = 'torso'; hip.add(torso);
    lathe([
      [PR.hipW * 0.54, -0.20],
      [PR.hipW * 0.52, 0.25],
      [PR.hipW * 0.46, 1.05],
      [PR.waistW * 0.44, 2.20],
      [PR.waistW * 0.42, 2.70],
      [PR.chestW * 0.40, 3.45],
      [PR.chestW * 0.52, 4.40],
      [PR.chestW * 0.55, 4.95],
      [PR.chestW * 0.48, 5.38],
      [PR.chestW * 0.32, 5.55]
    ], dress, torso, 28);
    const bustL = sphere(0.88, dress, -0.68, 4.58, 0.58, torso, 12);
    bustL.scale.set(1.08, 0.88, 0.92);
    const bustR = sphere(0.88, dress,  0.68, 4.58, 0.58, torso, 12);
    bustR.scale.set(1.08, 0.88, 0.92);
    // Spaghetti straps over the shoulders (as in the t1136 ref).
    function strapPts(side) {
      return [
        [side * 0.62, 4.85, 0.55],
        [side * 0.95, 5.55, 0.18],
        [side * 1.12, 5.82, -0.12],
        [side * 0.70, 5.05, -0.58],
        [side * 0.40, 4.55, -0.50]
      ];
    }
    hairRibbon(strapPts(-1), 0.075, 0.065, dress, torso, 12, 6);
    hairRibbon(strapPts( 1), 0.075, 0.065, dress, torso, 12, 6);
    // Brown belt + a real 5-point star buckle on the front.
    const beltM = new THREE.Mesh(new THREE.TorusGeometry(PR.waistW * 0.50, 0.16, 8, 24), belt);
    beltM.rotation.x = Math.PI / 2; beltM.position.set(0, 2.35, 0.06); torso.add(beltM);
    const starShape = new THREE.Shape();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      const b = a + Math.PI / 5;
      const fn = i === 0 ? 'moveTo' : 'lineTo';
      starShape[fn](Math.cos(a) * 0.42, Math.sin(a) * 0.42);
      starShape.lineTo(Math.cos(b) * 0.17, Math.sin(b) * 0.17);
    }
    starShape.closePath();
    let starGeo;
    try {
      starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.10, bevelEnabled: false, steps: 1, amount: 0.10 });
    } catch (_) {
      starGeo = new THREE.CircleGeometry(0.42, 5);
    }
    const starBuckle = new THREE.Mesh(starGeo, starM);
    starBuckle.position.set(0, 2.35, 1.08);
    starBuckle.scale.set(1.15, 1.15, 1);
    torso.add(starBuckle);

    const skirt = new THREE.Group(); hip.add(skirt);
    lathe([
      [PR.hipW * 0.54,  0.30],
      [PR.hipW * 0.55, -0.85],
      [PR.hipW * 0.56, -1.85],
      [PR.hipW * 0.58, -2.55],
      [PR.hipW * 0.62, -3.25],
      [PR.hipW * 0.52, -3.45]
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

    // ---- shoulders / rounded arms ----
    const chestTop = new THREE.Group(); chestTop.position.y = PR.torso; torso.add(chestTop);
    // collarbone / upper chest skin
    const collar = sphere(0.7, skin, 0, -0.15, 0.20, chestTop, 10);
    collar.scale.set(1.8, 0.45, 1.0);

    // A 3-phalanx finger. Local -Y is along the finger; curlX bends it closed.
    function makeFinger(parent, x, y, z, rot, r, lens, curls) {
      const root = new THREE.Group();
      root.position.set(x, y, z);
      root.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
      parent.add(root);
      let node = root;
      for (let i = 0; i < lens.length; i++) {
        const len = lens[i], rr = r * (1 - i * 0.12);
        capsule(rr, len, skin, 0, -len / 2, 0, node, 6);
        if (i < lens.length - 1) {
          const nxt = new THREE.Group();
          nxt.position.y = -len;
          nxt.rotation.x = curls[i] || 0;
          node.add(nxt);
          node = nxt;
        }
      }
      return root;
    }
    function makeArm(side, grip) {
      const sh = new THREE.Group();
      sh.position.set(side * (PR.shoulderW * 0.52), -0.2, 0);
      chestTop.add(sh);
      // Slim shoulder: a mild taper at the top of the upper arm, not a lumpy ball.
      const deltoid = sphere(0.38, skin, side * 0.03, -0.16, 0, sh, 12);
      deltoid.scale.set(1.02, 1.12, 1.00);
      const upper = new THREE.Group(); sh.add(upper);
      capsule(0.40, PR.upperArm * 0.92, skin, 0, -PR.upperArm / 2, 0, upper, 10);
      const capBlend = sphere(0.40, skin, 0, -0.08, 0, upper, 10);
      capBlend.scale.set(1.04, 0.80, 1.00);
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
      // Compact palm so it does not swallow the fingers into a mitten.
      const palm = sphere(0.20, skin, 0, -0.30, 0.00, hand, 10);
      palm.scale.set(grip ? 0.90 : 0.80, 1.05, grip ? 0.70 : 0.55);
      const heel = sphere(0.13, skin, 0, -0.14, -0.02, hand, 8);
      heel.scale.set(0.80, 0.65, 0.60);
      if (grip) {
        // Handle along +Z at (0, -0.44). Align each finger so local X = handle axis,
        // then curl around X (around the mic), leaving a visible gap between fingers.
        function wrapFinger(zK, aroundAng, r, lens, curls) {
          const g = new THREE.Group();
          g.position.set(0, -0.44, zK);
          g.rotation.order = 'YXZ';
          g.rotation.set(aroundAng, Math.PI / 2, 0);
          hand.add(g);
          const lift = 0.085 + r; // handle radius ~0.08 plus finger
          makeFinger(g, 0, -lift, 0, [0, 0, 0], r, lens, curls);
        }
        // Open C-curl so each phalanx reads; knuckles spaced along the handle.
        wrapFinger( 0.34,  0.50, 0.085, [0.26, 0.18, 0.13], [-0.95, -1.00]); // index
        wrapFinger( 0.18,  0.62, 0.090, [0.28, 0.18, 0.13], [-1.00, -1.05]);
        wrapFinger( 0.02,  0.70, 0.088, [0.26, 0.17, 0.12], [-1.00, -1.05]);
        wrapFinger(-0.12,  0.58, 0.078, [0.22, 0.15, 0.11], [-0.95, -0.98]); // pinky
        // Thumb opposes from the other side, kept short so it does not poke out.
        wrapFinger( 0.16, -0.75, 0.088, [0.20, 0.14, 0.10], [-0.80, -0.70]);
        palm.position.set(0.10, -0.28, 0.00);
        palm.scale.set(0.75, 0.95, 0.62);
      } else {
        // Relaxed, slightly curved fingers (not a sausage stump).
        const curls = [0.35, 0.30];
        makeFinger(hand, -0.16, -0.58, 0.06, [0.15, 0,  0.08], 0.052, [0.24, 0.16, 0.12], curls);
        makeFinger(hand, -0.05, -0.60, 0.08, [0.18, 0,  0.02], 0.055, [0.26, 0.17, 0.13], curls);
        makeFinger(hand,  0.06, -0.60, 0.07, [0.18, 0, -0.02], 0.053, [0.25, 0.16, 0.12], curls);
        makeFinger(hand,  0.16, -0.56, 0.04, [0.14, 0, -0.08], 0.046, [0.20, 0.14, 0.10], curls);
        makeFinger(hand,  0.16, -0.32, 0.10, [0.35, 0.7, -0.6], 0.056, [0.18, 0.14, 0.10], [0.40, 0.35]);
      }
      return { sh: sh, upper: upper, elbow: elbow, lower: lower, wrist: wrist, hand: hand, side: side };
    }
    const leftArm = makeArm(-1, false), rightArm = makeArm(1, true);

    // Slim handheld mic, parented in the right fist. +Z is the grille.
    // Fingers are built around this local pose — aimMic must not twist it out of the grip.
    const mic = new THREE.Group();
    rightArm.hand.add(mic);
    mic.position.set(0.00, -0.44, 0.08);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.088, 0.92, 12), micBlk);
    handle.rotation.x = Math.PI / 2; handle.position.set(0, 0, 0.36); mic.add(handle);
    const grille = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 10), micGrille);
    grille.position.set(0, 0, 0.90); grille.scale.set(0.95, 0.95, 1.12); mic.add(grille);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.080, 0.070, 0.10, 10), micBlk);
    cap.rotation.x = Math.PI / 2; cap.position.set(0, 0, 0.74); mic.add(cap);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.016, 6, 14), micBlk);
    ring.position.set(0, 0, 0.78); mic.add(ring);

    // ---- neck + smoother head ----
    const neck = new THREE.Group(); neck.position.y = PR.torso + PR.neck * 0.15; torso.add(neck);
    // Tapered neck that blends into the jaw — no hard collar cut.
    capsule(0.36, PR.neck * 0.85, skin, 0, PR.neck * 0.42, 0.02, neck, 14);
    const neckTop = sphere(0.42, skin, 0, PR.neck * 0.78, 0.04, neck, 14);
    neckTop.scale.set(0.92, 0.62, 0.90);
    const choker = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.06, 6, 16), goldShiny);
    choker.rotation.x = Math.PI / 2; choker.position.set(0, 0.14, 0.04); neck.add(choker);

    const head = new THREE.Group(); head.position.y = PR.neck; neck.add(head);
    const hw = PR.headH * 0.74, hd = PR.headH * 0.76;
    // Soft oval cranium + a small tapered chin, overlapped so the jaw is not a second ball.
    const cranium = sphere(PR.headH * 0.50, skin, 0, PR.headH * 0.50, 0.04, head, 22);
    cranium.scale.set(0.88, 1.12, 0.94);
    const jaw = sphere(PR.headH * 0.28, skin, 0, PR.headH * 0.20, 0.10, head, 18);
    jaw.scale.set(0.78, 0.68, 0.86);
    const chin = sphere(0.22, skin, 0, PR.headH * 0.06, 0.16, head, 14);
    chin.scale.set(0.85, 0.70, 0.90);
    // Smooth joint: a throat sphere sits between neck top and the chin.
    const throat = sphere(0.34, skin, 0, -0.06, 0.08, head, 14);
    throat.scale.set(0.80, 0.70, 0.78);
    const earL = sphere(0.18, skin, -hw * 0.54, PR.headH * 0.48, 0.00, head, 10);
    earL.scale.set(0.50, 1.05, 0.70);
    const earR = sphere(0.18, skin,  hw * 0.54, PR.headH * 0.48, 0.00, head, 10);
    earR.scale.set(0.50, 1.05, 0.70);
    // Thin gold hoops hanging from the lobes, not a chunky ball at the jaw.
    const hoopGeo = new THREE.TorusGeometry(0.16, 0.028, 6, 16);
    const hoopL = new THREE.Mesh(hoopGeo, goldShiny);
    hoopL.position.set(-hw * 0.56, PR.headH * 0.34, 0.02); hoopL.rotation.x = 0.15; head.add(hoopL);
    const hoopR = new THREE.Mesh(hoopGeo, goldShiny);
    hoopR.position.set( hw * 0.56, PR.headH * 0.34, 0.02); hoopR.rotation.x = 0.15; head.add(hoopR);

    const eyeY = PR.headH * 0.54, eyeZ = hd * 0.58, eyeX = 0.34;
    const shadowM = addM(phong({ color: 0xe0b8a4, shininess: 8, specular: 0x221810 }));
    function addEye(sx) {
      // Almond eye white — the iris is smaller and partly covered by the upper lid,
      // so it does not read as a googly black dot on a white ball.
      const w = sphere(0.20, eyeW, sx * eyeX, eyeY - 0.01, eyeZ + 0.06, head, 12);
      w.scale.set(1.26, 0.78, 0.52);
      const iris = sphere(0.078, irisM, sx * eyeX, eyeY - 0.018, eyeZ + 0.155, head, 12);
      iris.scale.set(1.04, 0.98, 0.72);
      const ring = sphere(0.080, irisRing, sx * eyeX, eyeY - 0.018, eyeZ + 0.148, head, 10);
      ring.scale.set(1.06, 1.00, 0.55);
      sphere(0.030, eyeP, sx * eyeX, eyeY - 0.020, eyeZ + 0.198, head, 10);
      sphere(0.015, eyeW, sx * eyeX - 0.026, eyeY + 0.000, eyeZ + 0.232, head, 6);
      const lidMk = sphere(0.20, shadowM, sx * eyeX, eyeY + 0.07, eyeZ + 0.04, head, 8);
      lidMk.scale.set(1.38, 0.34, 0.55);
      // Slight upper lid over the top of the iris, not a sleepy droop.
      const lid = sphere(0.185, skin, sx * eyeX, eyeY + 0.08, eyeZ + 0.13, head, 10);
      lid.scale.set(1.32, 0.34, 0.55);
      const line = sphere(0.16, lash, sx * eyeX, eyeY + 0.10, eyeZ + 0.15, head, 6);
      line.scale.set(1.40, 0.15, 0.48);
      // Individual lashes fanning up and out.
      for (let i = -2; i <= 2; i++) {
        const u = i / 2;
        const lx = sx * eyeX + sx * u * 0.18;
        const ly = eyeY + 0.15 + 0.02 * Math.abs(u);
        const lz = eyeZ + 0.15;
        const ls = capsule(0.012, 0.11, lash, lx, ly, lz, head, 5);
        ls.rotation.z = sx * (-0.25 - u * 0.28);
        ls.rotation.x = -0.28;
      }
      // Soft continuous arch: peak above the iris, inner slightly up, outer gently down.
      const by = eyeY + 0.30, bz = eyeZ + 0.03;
      hairRibbon([
        [sx * (eyeX - 0.20), by + 0.000, bz - 0.01],
        [sx * (eyeX - 0.07), by + 0.055, bz + 0.02],
        [sx * (eyeX + 0.07), by + 0.050, bz + 0.02],
        [sx * (eyeX + 0.21), by - 0.018, bz - 0.02]
      ], 0.030, 0.016, brow, head, 10, 6);
    }
    addEye(-1); addEye(1);
    // Nose blended into the face: a shallow skin-colored ridge, barely proud of the
    // cheeks — not a darker detached ball floating in front of the mouth.
    const n0 = sphere(0.10, skin, 0, PR.headH * 0.50, eyeZ + 0.04, head, 10);
    n0.scale.set(0.50, 0.90, 0.48);
    const n1 = sphere(0.105, skin, 0, PR.headH * 0.42, eyeZ + 0.08, head, 10);
    n1.scale.set(0.55, 1.05, 0.62);
    const n2 = sphere(0.10, skin, 0, PR.headH * 0.345, eyeZ + 0.12, head, 10);
    n2.scale.set(0.72, 0.70, 0.70);
    // Slight smile: wider, softer pink lips with lifted corners.
    const mouth = sphere(0.135, lip, 0, PR.headH * 0.168, eyeZ + 0.18, head, 10);
    mouth.scale.set(1.38, 0.28, 0.55);
    const lowerLip = sphere(0.115, lip, 0, PR.headH * 0.148, eyeZ + 0.19, head, 10);
    lowerLip.scale.set(1.18, 0.24, 0.52);
    const cL = sphere(0.052, lip, -0.165, PR.headH * 0.178, eyeZ + 0.155, head, 8);
    cL.scale.set(1.05, 0.55, 0.70);
    const cR = sphere(0.052, lip,  0.165, PR.headH * 0.178, eyeZ + 0.155, head, 8);
    cR.scale.set(1.05, 0.55, 0.70);
    const mouthHi = sphere(0.085, lipHi, 0, PR.headH * 0.178, eyeZ + 0.25, head, 8);
    mouthHi.scale.set(1.15, 0.20, 0.45);
    // Soft blended blush — large, flat, close to the new lighter skin.
    const cheekM = addM(phong({ color: 0xf0c8b4, shininess: 10, specular: 0x332018 }));
    const chL = sphere(0.32, cheekM, -0.42, PR.headH * 0.34, eyeZ * 0.62, head, 10);
    chL.scale.set(1.15, 0.80, 0.55);
    const chR = sphere(0.32, cheekM,  0.42, PR.headH * 0.34, eyeZ * 0.62, head, 10);
    chR.scale.set(1.15, 0.80, 0.55);

    // ---- long wavy blonde hair: side-parted, past the chest, face left clear ----
    const hair = new THREE.Group(); hair.position.y = PR.headH; head.add(hair);
    // Solid dense blonde cap covering the whole scalp. Shifted slightly back so
    // the front edge is a hairline above the brows, not a visor over the eyes.
    const scalp = sphere(1.26, hairCap, 0, -1.00, -0.28, hair, 24);
    scalp.scale.set(1.12, 1.10, 1.00);
    // Rotate so the painted side-part in the cap texture sits on her left.
    scalp.rotation.y = 0.36;
    // A little extra volume on top — skull-shaped, not a flat disc lid.
    const topVol = sphere(0.85, hairCap, 0.04, -0.18, -0.22, hair, 20);
    topVol.scale.set(1.16, 0.55, 1.05);
    topVol.rotation.y = 0.36;
    const sideR = sphere(0.62, hairCap,  0.62, -0.58, -0.22, hair, 16);
    sideR.scale.set(1.06, 0.90, 0.95);
    const sideL = sphere(0.56, hairCap, -0.58, -0.60, -0.20, hair, 16);
    sideL.scale.set(1.04, 0.88, 0.95);
    // Soft side part: a shallow darker-blonde groove, cap stays solid underneath.
    hairRibbon([
      [-0.22, -0.52,  0.72],
      [-0.30, -0.08,  0.20],
      [-0.28, -0.02, -0.25],
      [-0.18, -0.30, -0.80]
    ], 0.028, 0.022, hairPart, hair, 12, 6);

    // Hair grows from a side parting over the scalp. Skull in hair-space:
    // centre (0, -1.08, -0.08). lon 0 = +Z (front), +PI/2 = +X (her right).
    function skullPt(lat, lon, R) {
      R = R == null ? 1.20 : R;
      const cx = 0, cy = -1.08, cz = -0.22;
      return [
        cx + R * Math.sin(lat) * Math.sin(lon),
        cy + R * Math.cos(lat),
        cz + R * Math.sin(lat) * Math.cos(lon)
      ];
    }
    const PART_LON = -0.36; // side part on her left
    function lockFromPart(lat0, lon0, dLon, drop, n, hug) {
      const pts = [];
      n = n || 14;
      hug = hug == null ? 0.58 : hug;
      // Buried root so the open tube end is hidden inside the under-scalp (no horn).
      pts.push(skullPt(lat0, lon0, 0.92));
      pts.push(skullPt(lat0, lon0, 1.08));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        // Stay on the crown (small lat) while moving in lon to the side;
        // only then drop down — never sweep across the face.
        const lon = lon0 + dLon * Math.min(1, t * 1.05);
        const lat = lat0 + Math.pow(Math.max(0, t - 0.38), 1.35) * 1.15;
        let p = skullPt(Math.min(lat, 1.35), lon, 1.22);
        if (t > hug) {
          const k = (t - hug) / (1 - hug);
          p = [p[0] + dLon * 0.15 * k, p[1] - drop * k * k, p[2] - 0.12 * k];
        }
        pts.push(p);
      }
      return pts;
    }
    // A few highlight strands lying on the solid cap — not coverage, the cap is the volume.
    const CROWN = [
      { lat: 0.18, lon: PART_LON + 0.10, dLon:  0.90, drop: 2.4, r0: 0.07, r1: 0.03, mat: hairB, n: 14, hug: 0.62 },
      { lat: 0.36, lon: PART_LON + 0.10, dLon:  1.10, drop: 3.0, r0: 0.07, r1: 0.03, mat: hairB, n: 14, hug: 0.58 },
      { lat: 0.22, lon: PART_LON - 0.10, dLon: -0.55, drop: 2.2, r0: 0.06, r1: 0.028, mat: hairB, n: 12, hug: 0.60 }
    ];
    CROWN.forEach(L => {
      hairRibbon(lockFromPart(L.lat, L.lon, L.dLon, L.drop, L.n, L.hug), L.r0, L.r1, L.mat, hair, 24, 8);
    });

    function wavePts(x0, y0, z0, len, side, phase, flare, amp, n, zAmp) {
      n = n || 14;
      zAmp = zAmp == null ? 0.28 : zAmp;
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const te = t * t * (3 - 2 * t);
        const tw = Math.pow(t, 0.55);
        const y = y0 - t * len;
        const x = x0 + side * flare * te + side * amp * tw * Math.sin(phase + t * Math.PI * 5.2);
        const z = z0 + zAmp * tw * Math.sin(phase * 0.7 + t * Math.PI * 3.4) - 0.18 * te;
        pts.push([x, y, z]);
      }
      return pts;
    }
    const LOCKS = [
      { x: 0.28, y: -0.28, z: -0.05, len: 12.2, ph: 0.2, fl: 0.85, amp: 0.62, r0: 0.28, r1: 0.12, mat: hairB, za: 0.30, side:  1 },
      { x: 0.46, y: -0.34, z:  0.22, len: 11.6, ph: 1.3, fl: 0.70, amp: 0.56, r0: 0.24, r1: 0.11, mat: hairA, za: 0.26, side:  1 },
      { x: 0.62, y: -0.38, z: -0.15, len: 11.8, ph: 2.1, fl: 0.55, amp: 0.50, r0: 0.22, r1: 0.10, mat: hairC, za: 0.24, side:  1 },
      { x: 0.78, y: -0.42, z:  0.18, len: 10.8, ph: 0.7, fl: 0.40, amp: 0.38, r0: 0.20, r1: 0.10, mat: hairA, za: 0.20, side:  1 },
      { x: 0.92, y: -0.46, z:  0.02, len: 10.2, ph: 1.8, fl: 0.28, amp: 0.32, r0: 0.16, r1: 0.08, mat: hairB, za: 0.16, side:  1 },
      // lighter side of the part (her left)
      { x: -0.48, y: -0.32, z:  0.10, len: 11.4, ph: 0.5, fl: 0.65, amp: 0.52, r0: 0.22, r1: 0.10, mat: hairA, za: 0.24, side: -1 },
      { x: -0.66, y: -0.38, z: -0.12, len: 11.0, ph: 1.6, fl: 0.48, amp: 0.40, r0: 0.20, r1: 0.10, mat: hairC, za: 0.20, side: -1 },
      { x: -0.84, y: -0.44, z:  0.16, len: 10.4, ph: 2.4, fl: 0.30, amp: 0.34, r0: 0.16, r1: 0.08, mat: hairB, za: 0.16, side: -1 }
    ];
    LOCKS.forEach(L => {
      hairRibbon(wavePts(L.x, L.y, L.z, L.len, L.side, L.ph, L.fl, L.amp, 20, L.za), L.r0, L.r1, L.mat, hair, 32, 8);
    });
    // Face-framing ripples — thinner, tighter S-curves so the sides are not a flat curtain.
    const FACE_FRAME = [
      { x: 0.58, y: -0.36, z:  0.18, len: 11.2, ph: 0.4, fl: 0.35, amp: 0.58, r0: 0.14, r1: 0.06, za: 0.28, side:  1 },
      { x: 0.72, y: -0.40, z:  0.08, len: 10.8, ph: 1.8, fl: 0.28, amp: 0.50, r0: 0.12, r1: 0.055, za: 0.24, side:  1 },
      { x: -0.55, y: -0.26, z:  0.36, len: 11.0, ph: 0.9, fl: 0.32, amp: 0.54, r0: 0.15, r1: 0.07, za: 0.30, side: -1 }
    ];
    FACE_FRAME.forEach(L => {
      hairRibbon(wavePts(L.x, L.y, L.z, L.len, L.side, L.ph, L.fl, L.amp, 22, L.za), L.r0, L.r1, hairB, hair, 28, 7);
    });
    // Highlight strands: thinner, paler, higher-frequency ripples woven through the mass.
    const HI = [
      { x: 0.30, y: -0.20, z:  0.12, len: 12.0, ph: 0.9, fl: 0.75, amp: 0.62, r0: 0.11, r1: 0.05, za: 0.30, side:  1 },
      { x: 0.60, y: -0.26, z: -0.05, len: 11.4, ph: 2.6, fl: 0.50, amp: 0.55, r0: 0.10, r1: 0.045, za: 0.26, side:  1 },
      { x: -0.50, y: -0.24, z:  0.08, len: 11.2, ph: 1.4, fl: 0.52, amp: 0.58, r0: 0.10, r1: 0.045, za: 0.28, side: -1 }
    ];
    HI.forEach(L => {
      hairRibbon(wavePts(L.x, L.y, L.z, L.len, L.side, L.ph, L.fl, L.amp, 22, L.za), L.r0, L.r1, hairB, hair, 28, 6);
    });
    // Side-swept fringe from the left part, across the forehead, ending beside the right eye.
    // Stays ABOVE the eyes so the face stays clear.
    hairRibbon([
      [-0.32, -0.22, 0.48], [-0.04, -0.38, 0.82], [0.26, -0.58, 0.78], [0.50, -0.90, 0.42]
    ], 0.055, 0.03, hairB, hair, 14, 7);
    hairRibbon([
      [-0.24, -0.28, 0.40], [0.08, -0.48, 0.70], [0.36, -0.78, 0.52], [0.52, -1.10, 0.26]
    ], 0.045, 0.025, hairA, hair, 14, 7);
    // Back / side curtains, long past the chest.
    const BACK = [
      { x: 0.00, y: -0.10, z: -0.95, len: 12.4, ph: 0.3, fl: 0.08, amp: 0.22, r0: 0.70, r1: 0.20, mat: hairA, side: 1, za: 0.14 },
      { x: 0.45, y: -0.18, z: -0.92, len: 12.0, ph: 1.1, fl: 0.30, amp: 0.28, r0: 0.48, r1: 0.16, mat: hairC, side: 1, za: 0.16 },
      { x: 0.45, y: -0.18, z: -0.92, len: 12.0, ph: 1.8, fl: 0.30, amp: 0.28, r0: 0.48, r1: 0.16, mat: hairB, side: -1, za: 0.16 }
    ];
    BACK.forEach(L => {
      hairRibbon(wavePts(L.x * (L.side === -1 ? -1 : 1), L.y, L.z, L.len, L.side, L.ph, L.fl, L.amp, 20, L.za), L.r0, L.r1, L.mat, hair, 32, 8);
    });

    const parts = {
      g: g, rig: rig, hip: hip, torso: torso, skirt: skirt, chestTop: chestTop,
      neck: neck, head: head, hair: hair, mic: mic, glints: glints,
      leftLeg: leftLeg, rightLeg: rightLeg, leftArm: leftArm, rightArm: rightArm,
      mats: mats, dressMat: dress
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
      try {
        const ds = (typeof THREE !== 'undefined' && THREE.DoubleSide != null) ? THREE.DoubleSide : 2;
        m.side = ds;
      } catch (_) {}
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
    p1R: { sh: [0.78, 0.38, 0.12], el: [1.98, 0.22, 0.14], wr: [0.20, 0.48, 0.08] },
    // 2: left on the hip (akimbo), right still singing
    p2L: { sh: [0.25, -0.1, 1.05], el: [1.65, 0.12, 0.45], wr: [0.3, 0.4, 0.55] },
    p2R: { sh: [0.78, 0.38, 0.12], el: [1.98, 0.22, 0.14], wr: [0.20, 0.48, 0.08] },
    // 3: left hand ON TOP of the head (arm up and slightly in, elbow folded over the crown)
    p3L: { sh: [0.35, 0.2, 3.35], el: [1.85, 0.3, -1.2], wr: [0.6, 0.3, 0.2] },
    p3R: { sh: [0.78, 0.38, 0.12], el: [1.98, 0.22, 0.14], wr: [0.20, 0.48, 0.08] },
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
    // Mic stays in a fixed grip pose inside the hand (fingers are built around it).
    parts.mic.position.set(0.00, -0.44, 0.08);
    parts.mic.rotation.set(0, 0, 0);
    parts.mic.scale.set(1, 1, 1);
    if (micKind > 0.85) return;
    // Rotate the HAND so the wrist-to-grille axis points at a spot just to the
    // right of the lips. Fingers, being children of the hand, stay wrapped.
    const hand = parts.rightArm.hand;
    const wrist = parts.rightArm.wrist;
    parts.head.updateWorldMatrix(true, false);
    wrist.updateWorldMatrix(true, false);
    const targetW = ltw(parts.head, 0.28, PR.headH * 0.17, PR.headH * 0.60);
    const wristW = new THREE.Vector3();
    wrist.getWorldPosition(wristW);
    const worldAim = targetW.clone().sub(wristW);
    if (worldAim.length() < 0.2) worldAim.set(0.3, 0.15, 0.9);
    worldAim.normalize();
    // Wrist-to-grille in hand-local (mic at (0,-0.44,0.08), grille at local z=0.92).
    const localAim = new THREE.Vector3(0, -0.44, 1.00).normalize();
    const qAlign = new THREE.Quaternion().setFromUnitVectors(localAim, worldAim);
    const wristQ = new THREE.Quaternion();
    wrist.getWorldQuaternion(wristQ);
    hand.quaternion.copy(wristQ.invert().multiply(qAlign));
    // Twist around the mic axis so the curled fingers face up / toward the camera
    // rather than hiding on the far side of a mitten.
    const twist = new THREE.Quaternion().setFromAxisAngle(localAim, 0.35);
    hand.quaternion.multiply(twist);
  }

  function twinkleGlints(parts, st) {
    const t = (st && (st.t != null ? st.t : st.u)) || 0;
    const pose = (st && st.pose) || 0;
    if (parts.glints && parts.glints.length) {
      for (let i = 0; i < parts.glints.length; i++) {
        const g = parts.glints[i];
        const pulse = 0.45 + 0.55 * Math.max(0, Math.sin(t * 7.5 + i * 1.73 + pose));
        g.scale.setScalar(0.65 + 0.70 * pulse);
      }
    }
    if (parts.dressMat) {
      try {
        parts.dressMat.emissiveIntensity = 1.15 + 0.50 * (0.5 + 0.5 * Math.sin(t * 9.2));
      } catch (_) {}
    }
  }

  P.debugArm = function (parts, sh, el, wr) {
    setArm(parts.rightArm, { sh: sh, el: el, wr: wr || [0.2, 0.3, 0.1] }, 1);
    aimMic(parts, 0);
  };
  P.ikLeg = ikLeg;
  P.ikArm = ikArm;
})(typeof window !== 'undefined' ? window : globalThis);
