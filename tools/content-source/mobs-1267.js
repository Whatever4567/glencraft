/* GLX-MOBS1267 (v1.2.67): wild wolf packs and Scottish tamed dogs;
   Moss Hag Morag gets a paler hag head with long grey hair and
   sunken glowing eyes, a quieter randomised voice, and a black cat
   that follows her. The gold D-pad is left alone. First-person
   hands are not touched. */
(function mobs1267(WIN) {
  const U = WIN.__mobs1267 = {
    on: 0, err: null, version: '1.2.67-wolf-hag',
    wolves: 0, dogs: 0, cats: 0, packs: 0, tamed: 0, sits: 0,
    hagUp: 0, frames: 0
  };
  const T3 = WIN.THREE;
  if (!T3) return;
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  const BONE_ID = () => { try { return (typeof IT !== 'undefined' && IT.BONE) || 171; } catch (_) { return 171; } };

  /* ---------- procedural paletted textures (Bayer dither, AO) ---------- */
  const BAYER8 = [
    0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21
  ];
  const TEX = {};
  function hexRgb(h) { return [(h >> 16) & 255, (h >> 8) & 255, h & 255]; }
  function makeTex(key, paint, n) {
    if (TEX[key]) return TEX[key];
    n = n || 64;
    const c = document.createElement('canvas'); c.width = c.height = n;
    const g = c.getContext('2d');
    paint(g, n);
    const tex = new T3.CanvasTexture(c);
    tex.magFilter = T3.NearestFilter; tex.minFilter = T3.NearestFilter;
    tex.wrapS = tex.wrapT = T3.RepeatWrapping;
    tex.generateMipmaps = false;
    TEX[key] = tex;
    return tex;
  }
  function ditherFill(g, n, ramp, aoFn) {
    const img = g.getImageData(0, 0, n, n), d = img.data;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let t = (typeof aoFn === 'function' ? aoFn(x / n, y / n) : 0.55);
      t += (BAYER8[(y & 7) * 8 + (x & 7)] / 64 - 0.5) * 0.12;
      t = Math.max(0, Math.min(0.999, t));
      const i = Math.min(ramp.length - 1, (t * ramp.length) | 0);
      const c = hexRgb(ramp[i]), o = (y * n + x) * 4;
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  const WOLF_RAMP = [0x2a2420, 0x3a3430, 0x524840, 0x6a5e52, 0x8a7c6c, 0xa89884, 0xc4b49a];
  const WOLF_BELLY = [0x5a5044, 0x7a6e60, 0x9a8c7a, 0xb8a890, 0xd0c4b0];
  const COLLIE_BLK = [0x0c0c0e, 0x16161a, 0x222228, 0x32323a, 0x4a4a54];
  const COLLIE_WHT = [0xb8b0a4, 0xd0cac0, 0xe8e4dc, 0xf4f2ec, 0xffffff];
  const COLLIE_TAN = [0x6a3a18, 0x8a5220, 0xb06a2c, 0xc88440, 0xe0a060];
  const CAT_RAMP = [0x050506, 0x0c0c10, 0x16161c, 0x24242c, 0x3a3a44];
  const HAG_SKIN = [0x8a7e70, 0xa89888, 0xc0b09c, 0xd4c6b0, 0xe4d8c4, 0xf0e8d8];
  const HAG_HAIR = [0x4a4a48, 0x6a6a66, 0x888880, 0xa4a49a, 0xc0c0b6];

  function furTex(key, ramp, dens) {
    return makeTex(key, function (g, n) {
      ditherFill(g, n, ramp, function (u, v) {
        const stripe = Math.sin(u * 28 + v * 6) * 0.04;
        const edge = Math.min(u, 1 - u, v, 1 - v) * 2;
        return 0.48 + stripe - (1 - Math.min(1, edge)) * 0.18 + (dens || 0);
      });
      /* sparse longer-fur strokes */
      g.globalAlpha = 0.18;
      for (let i = 0; i < n * 2; i++) {
        g.strokeStyle = i % 2 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.4)';
        g.beginPath();
        const x = Math.random() * n, y = Math.random() * n;
        g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 3, y + 3 + Math.random() * 5);
        g.stroke();
      }
      g.globalAlpha = 1;
    }, 64);
  }
  function hagSkinTex() {
    return makeTex('hag-skin', function (g, n) {
      ditherFill(g, n, HAG_SKIN, function (u, v) {
        const wrinkle = Math.abs(Math.sin(v * 18)) * 0.07;
        const socket = (function () {
          const dx = Math.abs(u - 0.32), dy = Math.abs(v - 0.42);
          const a = Math.hypot(dx * 1.6, dy * 2.1);
          const dx2 = Math.abs(u - 0.68), b = Math.hypot(dx2 * 1.6, dy * 2.1);
          return Math.max(0, 0.55 - Math.min(a, b) * 1.4);
        })();
        return 0.62 - wrinkle - socket * 0.7 - (v < 0.18 ? 0.1 : 0);
      });
    }, 128);
  }
  function hagHairTex() {
    return makeTex('hag-hair', function (g, n) {
      ditherFill(g, n, HAG_HAIR, function (u, v) { return 0.4 + Math.sin(u * 40) * 0.08 - v * 0.15; });
    }, 64);
  }

  function mat(map, color, opts) {
    const m = new T3.MeshLambertMaterial({
      map: map || null,
      color: color != null ? color : 0xffffff,
      flatShading: true,
      transparent: !!(opts && opts.trans),
      opacity: opts && opts.op != null ? opts.op : 1
    });
    if (opts && opts.em != null) {
      m.emissive = new T3.Color(opts.em);
      m.emissiveIntensity = opts.ei != null ? opts.ei : 0.65;
    }
    return m;
  }

  const GEO = {};
  function box(w, h, d) {
    const k = 'b' + [w, h, d].join(',');
    if (!GEO[k]) GEO[k] = new T3.BoxGeometry(w, h, d);
    return GEO[k];
  }
  function addBox(parent, w, h, d, material, x, y, z, rx, ry, rz) {
    const m = new T3.Mesh(box(w, h, d), material);
    m.position.set(x || 0, y || 0, z || 0);
    if (rx) m.rotation.x = rx; if (ry) m.rotation.y = ry; if (rz) m.rotation.z = rz;
    m.castShadow = false; m.frustumCulled = false;
    parent.add(m);
    return m;
  }

  /* ---------- canine / cat kit ---------- */
  function looksFor(style) {
    if (style === 'dog') {
      return {
        body: mat(furTex('collie-blk', COLLIE_BLK), 0x222228),
        belly: mat(furTex('collie-wht', COLLIE_WHT), 0xe8e4dc),
        tan: mat(furTex('collie-tan', COLLIE_TAN), 0xb06a2c),
        ruff: mat(furTex('collie-wht2', COLLIE_WHT, 0.08), 0xf0ece4),
        eye: mat(null, 0x2a1a0a),
        glow: null,
        nose: mat(null, 0x1a1210)
      };
    }
    if (style === 'cat') {
      return {
        body: mat(furTex('cat-blk', CAT_RAMP), 0x121216),
        belly: mat(furTex('cat-blk2', CAT_RAMP, -0.05), 0x1a1a22),
        tan: mat(furTex('cat-blk3', CAT_RAMP), 0x16161c),
        ruff: null,
        eye: mat(null, 0xf0d050, { em: 0xc8a020, ei: 0.55 }),
        glow: null,
        nose: mat(null, 0x2a1a18)
      };
    }
    return {
      body: mat(furTex('wolf-fur', WOLF_RAMP), 0x6a5e52),
      belly: mat(furTex('wolf-belly', WOLF_BELLY), 0xb8a890),
      tan: mat(furTex('wolf-fur2', WOLF_RAMP, -0.05), 0x524840),
      ruff: null,
      eye: mat(null, 0xd0b040, { em: 0x887010, ei: 0.35 }),
      glow: null,
      nose: mat(null, 0x1a1210)
    };
  }

  function buildCanine(style) {
    const cat = style === 'cat';
    const S = cat ? 0.48 : 1;
    const L = looksFor(style);
    const mats = [L.body, L.belly, L.tan, L.nose, L.eye];
    if (L.ruff) mats.push(L.ruff);
    const g = new T3.Group();
    const body = new T3.Group(); body.position.y = 0.42 * S; g.add(body);
    /* torso: chest + loin, slightly arched */
    const chest = addBox(body, 0.36 * S, 0.34 * S, 0.44 * S, L.body, 0, 0.04 * S, 0.08 * S);
    const loin = addBox(body, 0.32 * S, 0.30 * S, 0.38 * S, L.body, 0, 0.00 * S, -0.28 * S);
    const belly = addBox(body, 0.26 * S, 0.16 * S, 0.50 * S, L.belly, 0, -0.12 * S, -0.06 * S);
    if (L.ruff) addBox(body, 0.42 * S, 0.28 * S, 0.28 * S, L.ruff, 0, 0.10 * S, 0.22 * S);
    /* neck + head */
    const neck = addBox(body, 0.18 * S, 0.18 * S, 0.22 * S, L.body, 0, 0.12 * S, 0.30 * S, -0.35);
    const head = new T3.Group(); head.position.set(0, 0.22 * S, 0.46 * S); body.add(head);
    addBox(head, 0.26 * S, 0.24 * S, 0.26 * S, L.body, 0, 0, 0);
    if (style === 'dog') addBox(head, 0.10 * S, 0.16 * S, 0.22 * S, L.ruff, 0, 0.04 * S, 0.02 * S); /* blaze */
    const snout = addBox(head, 0.14 * S, 0.12 * S, 0.20 * S, style === 'dog' ? L.ruff : L.belly, 0, -0.04 * S, 0.18 * S);
    const jaw = addBox(head, 0.12 * S, 0.06 * S, 0.16 * S, L.belly, 0, -0.10 * S, 0.16 * S);
    addBox(head, 0.07 * S, 0.05 * S, 0.06 * S, L.nose, 0, -0.01 * S, 0.28 * S);
    /* ears: wolf upright pointed; collie half-fold; cat tall triangles as boxes */
    const earH = cat ? 0.16 : (style === 'dog' ? 0.12 : 0.16);
    const earL = addBox(head, 0.08 * S, earH * S, 0.06 * S, style === 'dog' ? L.tan : L.body, -0.10 * S, 0.16 * S, -0.04 * S, style === 'dog' ? 0.5 : 0.15, 0, -0.2);
    const earR = addBox(head, 0.08 * S, earH * S, 0.06 * S, style === 'dog' ? L.tan : L.body,  0.10 * S, 0.16 * S, -0.04 * S, style === 'dog' ? 0.5 : 0.15, 0,  0.2);
    const eyeL = addBox(head, 0.05 * S, 0.04 * S, 0.03 * S, L.eye, -0.07 * S, 0.05 * S, 0.13 * S);
    const eyeR = addBox(head, 0.05 * S, 0.04 * S, 0.03 * S, L.eye,  0.07 * S, 0.05 * S, 0.13 * S);
    if (style === 'dog') {
      addBox(head, 0.06 * S, 0.03 * S, 0.02 * S, L.tan, -0.08 * S, 0.09 * S, 0.12 * S); /* tan brow */
      addBox(head, 0.06 * S, 0.03 * S, 0.02 * S, L.tan,  0.08 * S, 0.09 * S, 0.12 * S);
    }
    /* legs: 0 FL, 1 FR, 2 BL, 3 BR. Pivot at the top of the upper leg. */
    const legs = [];
    const feet = [];
    const places = [
      [-0.13, 0.06,  0.22],
      [ 0.13, 0.06,  0.22],
      [-0.13, 0.04, -0.36],
      [ 0.13, 0.04, -0.36]
    ];
    for (let i = 0; i < 4; i++) {
      const lg = new T3.Group();
      const p = places[i];
      lg.position.set(p[0] * S, p[1] * S, p[2] * S);
      body.add(lg);
      const rear = i >= 2;
      const upperMat = (style === 'dog' && rear) ? L.tan : L.body;
      const lowerMat = style === 'dog' ? L.tan : L.body;
      const uh = (rear ? 0.24 : 0.22) * S, lh = 0.22 * S;
      addBox(lg, 0.09 * S, uh, 0.10 * S, upperMat, 0, -uh * 0.5, 0);
      const low = new T3.Group(); low.position.y = -uh; lg.add(low);
      addBox(low, 0.08 * S, lh, 0.09 * S, lowerMat, 0, -lh * 0.5, 0);
      const paw = addBox(low, 0.10 * S, 0.05 * S, 0.14 * S, style === 'dog' ? L.ruff || L.belly : L.belly, 0, -lh, 0.02 * S);
      legs.push(lg);
      feet.push({ low: low, paw: paw, uh: uh, lh: lh });
    }
    /* tail */
    const tail = new T3.Group();
    tail.position.set(0, 0.10 * S, -0.48 * S);
    body.add(tail);
    const tailMat = style === 'dog' ? L.ruff || L.body : (cat ? L.body : L.body);
    addBox(tail, cat ? 0.05 * S : 0.08 * S, cat ? 0.05 * S : 0.08 * S, cat ? 0.28 * S : 0.36 * S, tailMat, 0, 0, -0.16 * S);
    if (style === 'dog') addBox(tail, 0.07 * S, 0.07 * S, 0.16 * S, L.ruff, 0, 0.01 * S, -0.32 * S);
    if (cat) tail.rotation.x = -0.9; else tail.rotation.x = -0.35;

    const parts = { body: body, head: head, jaw: jaw, legs: legs, feet: feet, tail: tail, ears: [earL, earR], eyes: [eyeL, eyeR], S: S, style: style };
    return { g: g, mats: mats, parts: parts, hitY: 0.50 * S + 0.15, hitR: 0.42 * S + 0.15, tall: (cat ? 0.55 : 0.95) };
  }

  function applyLook(a, style) {
    try {
      const built = buildCanine(style);
      /* swap the visual child graph, keep the root group and world pose */
      const old = a.g;
      const pos = old.position.clone(), rot = old.rotation.clone();
      while (old.children.length) old.remove(old.children[0]);
      while (built.g.children.length) old.add(built.g.children[0]);
      a.parts = built.parts;
      a.mats = built.mats;
      a.look = style;
      a.g.position.copy(pos); a.g.rotation.copy(rot);
      /* keep a.legs / a.head so a generic pass is safe if we are ever left in the array */
      a.legs = built.parts.legs;
      a.head = built.parts.head;
    } catch (e) { ERR('look', e); }
  }

  function animateCanine(a, dt) {
    const p = a.parts; if (!p) return;
    const S = p.S || 1;
    const sit = !!a.sitting;
    const moving = !!a.moving && !sit;
    const bite = a.biteAnim || 0;
    const sniff = a.sniff || 0;
    const tilt = a.tilt || 0;
    a.walk = (a.walk || 0) + (moving ? dt * (a.gait || 8) : 0);
    const w = a.walk;
    /* trot: diagonal pairs */
    for (let i = 0; i < 4; i++) {
      const lg = p.legs[i], ft = p.feet[i];
      if (!lg) continue;
      const phase = w + ((i === 0 || i === 3) ? 0 : Math.PI);
      const swing = moving ? Math.sin(phase) * 0.55 : 0;
      const sitK = sit ? (i >= 2 ? 1 : 0.35) : 0;
      lg.rotation.x = swing * (1 - sitK) + sitK * (i >= 2 ? 1.15 : 0.35);
      if (ft && ft.low) ft.low.rotation.x = (moving ? Math.max(0, -Math.sin(phase)) * 0.35 : 0) + sitK * (i >= 2 ? 0.8 : 0.15);
    }
    /* body sit: lower and tilt */
    const wantY = sit ? 0.22 * S : 0.42 * S;
    p.body.position.y += (wantY - p.body.position.y) * Math.min(1, dt * 8);
    p.body.rotation.x += (((sit ? -0.28 : 0) + (a.moving ? Math.sin(w) * 0.03 : 0)) - p.body.rotation.x) * Math.min(1, dt * 8);
    /* tail wag */
    const wag = (sit || (a.tamed && !a.angry)) ? 6 : (moving ? 10 : 2.2);
    const wagA = sit ? 0.55 : (a.tamed ? 0.35 : 0.18);
    p.tail.rotation.z = Math.sin((a.t0 || 0) * wag) * wagA;
    p.tail.rotation.x = (p.style === 'cat' ? -0.9 : -0.35) + (sit ? 0.2 : 0) + Math.sin((a.t0 || 0) * 3) * 0.08;
    /* head tilt, sniff, bite */
    p.head.rotation.z += (tilt - p.head.rotation.z) * Math.min(1, dt * 6);
    p.head.rotation.x += ((sniff * 0.7 + bite * -0.35 + (sit ? 0.15 : 0)) - p.head.rotation.x) * Math.min(1, dt * 8);
    if (p.jaw) p.jaw.rotation.x = bite * 0.6 + Math.sin((a.t0 || 0) * 1.4) * 0.03;
  }

  /* ---------- spawn a wolf / dog / cat into `mobs` ---------- */
  function makeAnimal(style, opts) {
    opts = opts || {};
    const built = buildCanine(style);
    const a = {
      kind: style === 'cat' ? 'blackcat' : 'wolf',
      look: style,
      __1267: 1,
      g: built.g,
      mats: built.mats,
      parts: built.parts,
      legs: built.parts.legs,
      head: built.parts.head,
      hp: style === 'cat' ? 6 : (style === 'dog' ? 16 : 12),
      maxHp: style === 'cat' ? 6 : (style === 'dog' ? 16 : 12),
      hitY: built.hitY,
      hitR: built.hitR,
      tall: built.tall,
      speed: style === 'cat' ? 3.6 : 4.4,
      hostile: false,
      shaded: 1,          /* never catch fire in daylight */
      named: style === 'cat' ? 'Black Cat' : null,
      tamed: style === 'dog' ? 1 : 0,
      sitting: 0,
      packId: opts.packId || null,
      owner: opts.owner || null,
      temper: 0,
      angry: 0,
      moving: false,
      ang: Math.random() * Math.PI * 2,
      yawVis: 0,
      timer: 1 + Math.random() * 3,
      flash: 0, kbx: 0, kbz: 0, vy: 0, onGround: true,
      burning: 0, fire: 0, fireTick: 0,
      walk: Math.random() * 6, sndT: 2 + Math.random() * 6,
      biteCd: 0, biteAnim: 0, sniff: 0, tilt: 0, t0: Math.random() * 20,
      skipPhys: false,
      flee: 0, goal: null, path: null
    };
    if (style === 'dog') { a.named = 'Scottish Dog'; U.dogs++; U.tamed++; }
    else if (style === 'cat') U.cats++;
    else U.wolves++;
    return a;
  }

  function placeAnimal(a, x, y, z) {
    a.g.position.set(x, y, z);
    try { if (typeof scene !== 'undefined' && scene) scene.add(a.g); } catch (_) {}
    try { if (typeof mobs !== 'undefined' && mobs) mobs.push(a); } catch (_) {}
    return a;
  }

  function groundAt(x, z) {
    try {
      const gx = Math.floor(x), gz = Math.floor(z);
      if (typeof solidTop === 'function') return solidTop(gx, gz) + 1;
      if (typeof skyTop === 'function') return skyTop(gx, gz) + 1;
      if (typeof groundTop === 'function') return groundTop(gx, gz) + 1;
    } catch (_) {}
    try { return P.y; } catch (__) { return 8; }
  }

  function findPackSpot() {
    try {
      const baseY = P.yaw || 0;
      for (let t = 0; t < 14; t++) {
        const ang = baseY + (Math.random() - 0.5) * 2.6 + (t % 2 ? Math.PI : 0);
        const r = 16 + Math.random() * 16;
        const x = P.x + Math.sin(ang) * r, z = P.z + Math.cos(ang) * r;
        const gx = Math.floor(x), gz = Math.floor(z);
        const WW = (typeof W === "number") ? W : 56, DD = (typeof D === "number") ? D : 56;
        if (gx < 4 || gz < 4 || gx >= WW - 4 || gz >= DD - 4) continue;
        const y = groundAt(x, z);
        if (!(y > 2)) continue;
        let id = 0;
        try { id = (typeof getBlock === 'function' ? getBlock(gx, y - 1, gz) : getB(gx, y - 1, gz)) | 0; } catch (_) {}
        const water = (typeof T !== 'undefined' && T.WATER) || 5;
        if (id === water) continue;
        return [x, y, z];
      }
    } catch (e) { ERR('spot', e); }
    return null;
  }

  function spawnPack() {
    /* 1.2.73: only near trees (log or leaves), groups of at most 3, 4-8 blocks apart. */
    function nearTree(x, y, z, radius) {
      radius = radius || 5;
      const gx = Math.floor(x), gy = Math.floor(y || 0), gz = Math.floor(z);
      const leafy = (typeof LEAFY !== 'undefined') ? LEAFY : null;
      const loggy = (typeof LOGGY !== 'undefined') ? LOGGY : null;
      const Tref = (typeof T !== 'undefined') ? T : {};
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (dx * dx + dz * dz > radius * radius) continue;
          for (let dy = -3; dy <= 8; dy++) {
            let id = 0;
            try { id = (typeof getBlock === 'function' ? getBlock(gx + dx, gy + dy, gz + dz) : (typeof getB === 'function' ? getB(gx + dx, gy + dy, gz + dz) : 0)) | 0; } catch (_) {}
            if (!id) continue;
            if (loggy && loggy[id]) return true;
            if (leafy && leafy[id]) return true;
            if (Tref && (id === Tref.LOG || id === Tref.LEAVES)) return true;
          }
        }
      }
      return false;
    }
    function chunkCount(x, z) {
      const cx = Math.floor(x / 16), cz = Math.floor(z / 16);
      try {
        return mobs.filter(function (a) {
          if (!a || !a.__1267 || a.kind !== 'wolf' || a.tamed) return false;
          const p = a.g && a.g.position;
          if (!p) return false;
          return Math.floor(p.x / 16) === cx && Math.floor(p.z / 16) === cz;
        }).length;
      } catch (_) { return 0; }
    }
    let spot = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const s = findPackSpot();
      if (s && nearTree(s[0], s[1], s[2], 5) && chunkCount(s[0], s[2]) < 3) { spot = s; break; }
    }
    if (!spot) return null;
    const n = Math.min(3, 1 + Math.floor(Math.random() * 3));
    const packId = 'w' + Date.now().toString(36) + Math.floor(Math.random() * 999);
    const out = [];
    const used = [];
    for (let i = 0; i < n; i++) {
      let px = spot[0], pz = spot[2], ok = false;
      for (let t = 0; t < 20; t++) {
        const ang = (i / Math.max(1, n)) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        const r = 4 + Math.random() * 4;
        px = spot[0] + Math.cos(ang) * r;
        pz = spot[2] + Math.sin(ang) * r;
        ok = used.every(function (u) { return Math.hypot(px - u[0], pz - u[1]) >= 4; });
        if (ok || !used.length) { ok = true; break; }
      }
      if (!ok && used.length) {
        const ang = (i / Math.max(1, n)) * Math.PI * 2;
        px = spot[0] + Math.cos(ang) * 6;
        pz = spot[2] + Math.sin(ang) * 6;
      }
      const a = makeAnimal('wolf', { packId: packId });
      placeAnimal(a, px, groundAt(px, pz), pz);
      a.ang = Math.random() * Math.PI * 2;
      a.g.rotation.y = a.ang;
      out.push(a);
      used.push([px, pz]);
    }
    U.packs++;
    U.on = 1;
    return out;
  }

  function wildCount() {
    try { return mobs.filter(function (a) { return a && a.__1267 && a.kind === 'wolf' && !a.tamed; }).length; } catch (_) { return 0; }
  }

  /* ---------- AI ---------- */
  U.attacker = null;
  function stepAnimal(a, dt) {
    a.t0 = (a.t0 || 0) + dt;
    a.biteCd = Math.max(0, (a.biteCd || 0) - dt);
    a.biteAnim = Math.max(0, (a.biteAnim || 0) - dt * 3);
    a.timer = (a.timer || 0) - dt;
    if (a.flash > 0) a.flash -= dt;
    const p = a.g.position;
    /* gravity / floor */
    try {
      if (typeof mobPhysics === 'function' && !a.skipPhys) mobPhysics(a, dt);
      else {
        const fl = (typeof floorBelow === 'function') ? floorBelow(p.x, p.y, p.z) : groundAt(p.x, p.z);
        if (p.y > fl + 0.02) { a.vy = (a.vy || 0) - 22 * dt; p.y += a.vy * dt; a.onGround = false; }
        else { p.y = fl; a.vy = 0; a.onGround = true; }
      }
    } catch (_) {}

    if (a.kind === 'blackcat') { stepCat(a, dt); animateCanine(a, dt); return; }

    if (a.tamed) stepDog(a, dt);
    else stepWolf(a, dt);
    animateCanine(a, dt);
    /* face direction */
    const want = a.ang || 0;
    a.yawVis = a.yawVis == null ? want : a.yawVis + Math.atan2(Math.sin(want - a.yawVis), Math.cos(want - a.yawVis)) * Math.min(1, dt * 6);
    a.g.rotation.y = a.yawVis;
    /* flash */
    if (a.mats) a.mats.forEach(function (m) {
      if (!m || !m.emissive) return;
      if (a.flash > 0) m.emissive.setRGB(0.55, 0, 0);
      else if (m.userData && m.userData.e0) m.emissive.copy(m.userData.e0);
      else m.emissive.setRGB(0, 0, 0);
    });
  }

  function goToward(a, tx, tz, spd, dt) {
    const p = a.g.position;
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d < 0.35) { a.moving = false; return 0; }
    a.ang = Math.atan2(dx, dz);
    a.moving = true;
    a.gait = 7 + spd;
    const step = Math.min(d, spd * dt);
    const nx = p.x + Math.sin(a.ang) * step, nz = p.z + Math.cos(a.ang) * step;
    let moved = false;
    try {
      if (typeof moveMob === 'function') moved = !!moveMob(a, nx - p.x, nz - p.z);
    } catch (_) {}
    if (!moved) { p.x = nx; p.z = nz; }
    return d;
  }

  function stepWolf(a, dt) {
    const p = a.g.position;
    const dx = P.x - p.x, dz = P.z - p.z, dist = Math.hypot(dx, dz);
    /* ambient howl / growl */
    a.sndT = (a.sndT || 4) - dt;
    if (a.sndT <= 0) {
      a.sndT = (a.angry > 0 ? 2.2 : 7) + Math.random() * 6;
      try { sfx3d(a.angry > 0 ? 'nm:wolfgrowl:1' : (Math.random() < 0.45 ? 'nm:howl:1' : 'nm:wolfgrowl:0.85'), p, a.angry > 0 ? 20 : 28); } catch (_) {}
    }
    /* idle sniff / tilt */
    if (a.timer <= 0 && !a.angry) {
      a.timer = 2 + Math.random() * 5;
      if (Math.random() < 0.35) { a.sniff = 1; setTimeout(function () { a.sniff = 0; }, 900 + Math.random() * 800); }
      if (Math.random() < 0.25) { a.tilt = (Math.random() < 0.5 ? -1 : 1) * 0.35; setTimeout(function () { a.tilt = 0; }, 700 + Math.random() * 600); }
    }
    if (a.angry > 0) {
      a.angry -= dt;
      a.hostile = true;
      if (dist > 1.5) goToward(a, P.x, P.z, a.speed * 1.25, dt);
      else a.moving = false;
      if (dist < 1.7 && Math.abs(P.y - p.y) < 1.6 && a.biteCd <= 0 && !dead) {
        a.biteCd = 1.15; a.biteAnim = 1;
        try { hurt(2, 'A wolf bit you.'); } catch (_) {}
        try { sfx3d('nm:wolfgrowl:1.2', p, 16); } catch (_) {}
      }
      return;
    }
    a.hostile = false;
    /* pack wander */
    if (a.timer <= 0) {
      a.timer = 3 + Math.random() * 5;
      a.moving = Math.random() < 0.55;
      a.ang += (Math.random() - 0.5) * 1.8;
    }
    if (a.moving) goToward(a, p.x + Math.sin(a.ang) * 4, p.z + Math.cos(a.ang) * 4, a.speed * 0.55, dt);
  }

  function stepDog(a, dt) {
    const p = a.g.position;
    a.hostile = false;
    a.sndT = (a.sndT || 5) - dt;
    if (a.sndT <= 0) {
      a.sndT = 6 + Math.random() * 8;
      if (!a.sitting) { try { sfx3d('nm:bark:1', p, 18); } catch (_) {} }
    }
    if (a.sitting) {
      a.moving = false;
      if (Math.random() < dt * 0.15) a.tilt = (Math.random() < 0.5 ? -1 : 1) * 0.28;
      return;
    }
    /* attack only the mob that harmed the player */
    const tgt = U.attacker;
    const tgtOk = tgt && tgt.g && tgt.hp > 0 && tgt !== a && !(tgt.__1267 && tgt.tamed);
    if (tgtOk) {
      const q = tgt.g.position;
      const td = Math.hypot(q.x - p.x, q.z - p.z);
      if (td > 1.3) goToward(a, q.x, q.z, a.speed * 1.2, dt);
      else {
        a.moving = false;
        if (a.biteCd <= 0) {
          a.biteCd = 0.85; a.biteAnim = 1;
          try { if (typeof damageMob === 'function') damageMob(tgt, 3, false); } catch (_) {}
          try { sfx3d('nm:bark:1.25', p, 16); } catch (_) {}
        }
      }
      return;
    }
    /* follow player, teleport if far */
    const dx = P.x - p.x, dz = P.z - p.z, dist = Math.hypot(dx, dz);
    if (dist > 24) {
      const behind = (P.yaw || 0) + Math.PI;
      const tx = P.x + Math.sin(behind) * 2.2, tz = P.z + Math.cos(behind) * 2.2;
      p.set(tx, groundAt(tx, tz), tz);
      a.ang = P.yaw || 0;
      return;
    }
    if (dist > 3.2) goToward(a, P.x, P.z, a.speed, dt);
    else if (dist < 1.6) { a.moving = false; a.ang = Math.atan2(dx, dz); }
    else a.moving = false;
    /* idle life */
    if (!a.moving && a.timer <= 0) {
      a.timer = 2 + Math.random() * 4;
      if (Math.random() < 0.4) { a.sniff = 1; setTimeout(function () { a.sniff = 0; }, 800); }
      if (Math.random() < 0.3) a.tilt = (Math.random() < 0.5 ? -1 : 1) * 0.3;
      else a.tilt = 0;
    }
  }

  function stepCat(a, dt) {
    const hag = a.witch && a.witch.g && a.witch.hp > 0 ? a.witch : findHag();
    a.witch = hag;
    const p = a.g.position;
    a.sndT = (a.sndT || 8) - dt;
    if (a.sndT <= 0) { a.sndT = 10 + Math.random() * 10; try { sfx3d('nm:mew:1', p, 12); } catch (_) {} }
    if (!hag) {
      if (a.timer <= 0) { a.timer = 3 + Math.random() * 4; a.ang += (Math.random() - 0.5) * 2; a.moving = Math.random() < 0.5; }
      if (a.moving) goToward(a, p.x + Math.sin(a.ang) * 3, p.z + Math.cos(a.ang) * 3, a.speed * 0.5, dt);
      return;
    }
    const q = hag.g.position;
    const d = Math.hypot(q.x - p.x, q.z - p.z);
    if (d > 18) { p.set(q.x + 0.9, groundAt(q.x + 0.9, q.z + 0.6), q.z + 0.6); return; }
    if (d > 1.6) goToward(a, q.x + Math.sin((a.t0 || 0) * 0.4) * 0.8, q.z + Math.cos((a.t0 || 0) * 0.4) * 0.8, a.speed, dt);
    else { a.moving = false; a.ang = Math.atan2(q.x - p.x, q.z - p.z); }
  }

  function findHag() {
    try {
      for (const m of mobs) {
        if (!m || !m.g) continue;
        if (m.kind === 'nm11' || (m.def && (m.def.id === '11' || m.kind === 'hag')) || m.spec === 'hag') return m;
      }
    } catch (_) {}
    return null;
  }

  /* ---------- taming ---------- */
  function heartsAt(x, y, z, n) {
    try { if (typeof burst === 'function') burst(x, y, z, 0xff6688, n || 10, 0.85); } catch (_) {}
    try { if (typeof mistPuff === 'function') mistPuff(x, y, z, 0xff88aa, 6); } catch (_) {}
  }
  function tryFeed(wolf) {
    if (!wolf || wolf.tamed || wolf.kind !== 'wolf') return false;
    const id = BONE_ID();
    try {
      if (typeof cnt === 'function' && cnt(id) <= 0) { toast('You need bones to tame a wolf.'); return false; }
      if (typeof take === 'function') take(id, 1);
      else if (typeof inv !== 'undefined' && inv[id]) inv[id]--;
    } catch (_) {}
    wolf.temper = (wolf.temper || 0) + 22 + Math.floor(Math.random() * 18);
    const p = wolf.g.position;
    heartsAt(p.x, p.y + 0.9, p.z, wolf.temper >= 100 ? 14 : 6);
    try { sfx3d('nm:chime:1.2', p, 14); } catch (_) {}
    if (wolf.temper >= 100 || (wolf.temper >= 55 && Math.random() * 100 < wolf.temper * 0.55)) {
      tameWolf(wolf);
      return true;
    }
    try { toast('The wolf sniffs the bone (trust ' + Math.min(99, wolf.temper) + '%)'); } catch (_) {}
    return true;
  }
  function tameWolf(a) {
    a.tamed = 1; a.hostile = false; a.angry = 0; a.sitting = 0;
    a.named = 'Scottish Dog'; a.owner = (typeof current !== 'undefined' && current && current.name) || 'you';
    a.hp = Math.max(a.hp, 16); a.maxHp = 16;
    applyLook(a, 'dog');
    U.tamed++; U.dogs++; U.wolves = Math.max(0, U.wolves - 1);
    const p = a.g.position;
    heartsAt(p.x, p.y + 1.1, p.z, 16);
    try { toast('The wolf is a Scottish dog now! LT to sit.'); } catch (_) {}
    try { sfx3d('nm:bark:1.15', p, 18); } catch (_) {}
    saveDogs();
  }
  U.tameWolf = tameWolf;
  U.tryFeed = tryFeed;

  function nearestTamedDog(maxD) {
    maxD = maxD || 5.5;
    let best = null, bd = maxD;
    try {
      /* prefer the one we are looking at */
      if (typeof reachMob === 'function') {
        const r = reachMob(maxD);
        if (r && r.__1267 && r.tamed && r.kind === 'wolf') return r;
      }
      for (const a of mobs) {
        if (!a || !a.__1267 || !a.tamed || a.kind !== 'wolf' || !a.g) continue;
        const q = a.g.position, d = Math.hypot(q.x - P.x, q.z - P.z);
        if (d < bd) { bd = d; best = a; }
      }
    } catch (_) {}
    return best;
  }
  function tryToggleSit() {
    const d = nearestTamedDog(6);
    if (!d) return false;
    d.sitting = d.sitting ? 0 : 1;
    U.sits++;
    try { toast(d.sitting ? 'The dog sits and stays.' : 'The dog is up and following.'); } catch (_) {}
    try { sfx3d(d.sitting ? 'nm:bark:0.85' : 'nm:bark:1.1', d.g.position, 14); } catch (_) {}
    saveDogs();
    return true;
  }
  U.tryToggleSit = tryToggleSit;

  /* ---------- hag upgrade ---------- */
  function upgradeHagVisual(root) {
    if (!root || root.userData && root.userData.hag1267) return false;
    const skinMap = hagSkinTex(), hairMap = hagHairTex();
    const pale = mat(skinMap, 0xe4d8c4);
    const hairM = mat(hairMap, 0xa4a49a);
    const sockM = mat(null, 0x1a1018);
    const glowM = mat(null, 0xf0e080, { em: 0xffee88, ei: 1.1 });
    const head = (root.H && root.H.head) || root.head || null;
    const host = head || (root.g || root.root || root);
    if (!host || !host.traverse) return false;
    /* paler skin on existing head meshes */
    host.traverse(function (o) {
      if (!o.isMesh || !o.material) return;
      const c = o.material.color && o.material.color.getHex ? o.material.color.getHex() : 0;
      /* original crone skin is 0x9aa080-ish or cloth; retint fleshy / grey-green skins */
      const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
      if (r > 80 && g > 80 && r + g > b + 40 && r < 210) {
        o.material = pale;
      }
    });
    /* sunken sockets + glowing pupils */
    const sockL = new T3.Mesh(box(0.13, 0.09, 0.06), sockM);
    sockL.position.set(-0.11, 0.10, 0.18); host.add(sockL);
    const sockR = sockL.clone(); sockR.position.x = 0.11; host.add(sockR);
    const glL = new T3.Mesh(box(0.045, 0.04, 0.03), glowM);
    glL.position.set(-0.11, 0.10, 0.21); host.add(glL);
    const glR = glL.clone(); glR.position.x = 0.11; host.add(glR);
    /* long grey hair — hanging strands around the back and sides */
    for (let i = 0; i < 11; i++) {
      const a = -0.2 + (i / 10) * (Math.PI + 0.4);
      const sg = new T3.Group();
      sg.position.set(Math.sin(a) * 0.22, 0.28, Math.cos(a) * 0.16 - 0.04);
      sg.rotation.x = 0.35 + Math.abs(Math.sin(a)) * 0.25;
      sg.rotation.z = Math.sin(a) * 0.35;
      const len = 0.75 + (i % 3) * 0.12;
      const strand = new T3.Mesh(box(0.07, len, 0.05), hairM);
      strand.position.y = -len * 0.5;
      sg.add(strand);
      host.add(sg);
    }
    /* a little more hair over the shoulders */
    for (const sx of [-1, 1]) {
      const fall = new T3.Mesh(box(0.1, 0.95, 0.08), hairM);
      fall.position.set(sx * 0.22, -0.15, -0.02);
      fall.rotation.z = sx * 0.18;
      host.add(fall);
    }
    host.userData = host.userData || {};
    host.userData.hag1267 = 1;
    if (root.userData) root.userData.hag1267 = 1;
    else root.userData = { hag1267: 1 };
    U.hagUp++;
    return true;
  }

  function ensureHagModelWrap() {
    try {
      const C = WIN.__c123;
      if (!C || !C.MODELS || !C.MODELS.nm11 || C.MODELS.nm11.__1267) return;
      const prev = C.MODELS.nm11;
      C.MODELS.nm11 = function (K) {
        const r = prev.apply(this, arguments);
        try { upgradeHagVisual(r); } catch (e) { ERR('hagM', e); }
        return r;
      };
      C.MODELS.nm11.__1267 = 1;
      if (C.DEF && C.DEF.nm11) {
        C.DEF.nm11.snd = 'hagvoice';
        C.DEF.nm11._snd1267 = 1;
      }
    } catch (e) { ERR('hagW', e); }
  }
  function upgradeLiveHags() {
    try {
      for (const m of mobs) {
        if (!m || !m.g) continue;
        const isHag = m.kind === 'nm11' || m.spec === 'hag' || (m.def && m.def.id === '11');
        if (!isHag) continue;
        if (m.g.userData && m.g.userData.hag1267) { ensureCat(m); continue; }
        try { upgradeHagVisual({ H: m.H || (m.g && m.g.userData), head: m.head, g: m.g, root: m.rig || m.g }); } catch (_) {}
        m.g.userData = m.g.userData || {}; m.g.userData.hag1267 = 1;
        if (m.def) m.def.snd = 'hagvoice';
        ensureCat(m);
      }
    } catch (e) { ERR('hagL', e); }
  }
  function ensureCat(hag) {
    if (!hag || hag._cat1267) return;
    /* already has a cat pointing at her? */
    try {
      for (const m of mobs) if (m && m.__1267 && m.kind === 'blackcat' && m.witch === hag) { hag._cat1267 = m; return; }
    } catch (_) {}
    const p = hag.g.position;
    const c = makeAnimal('cat');
    c.witch = hag; c.named = 'Black Cat';
    placeAnimal(c, p.x + 0.9, groundAt(p.x + 0.9, p.z + 0.7), p.z + 0.7);
    hag._cat1267 = c;
  }

  /* ---------- sounds ---------- */
  function acx() {
    try { if (typeof AC !== 'undefined' && AC) return AC; } catch (_) {}
    try {
      if (!U._ac) {
        const Ctx = WIN.AudioContext || WIN.webkitAudioContext;
        if (Ctx) U._ac = new Ctx();
      }
      return U._ac || null;
    } catch (_) { return null; }
  }
  function tone(type, f0, f1, dur, peak, delay) {
    const a = acx(); if (!a) return;
    try {
      const t0 = a.currentTime + (delay || 0);
      const o = a.createOscillator(), g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(Math.max(1, f0), t0);
      o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(a.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    } catch (_) {}
  }
  function hiss(dur, freq, peak, delay, type) {
    const a = acx(); if (!a) return;
    try {
      const t0 = a.currentTime + (delay || 0);
      const n = a.sampleRate, len = Math.max(1, (dur * n) | 0);
      const buf = a.createBuffer(1, len, n), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const s = a.createBufferSource(); s.buffer = buf;
      const f = a.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq || 600;
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(a.destination);
      s.start(t0); s.stop(t0 + dur + 0.02);
    } catch (_) {}
  }
  const hagCool = { t: 0 };
  function playHagVoice(vol, pan, k) {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now - (hagCool.t || 0) < 4500) return; /* cooldown so she is not annoying */
    hagCool.t = now;
    const v = Math.min(1, vol || 0.4) * 0.32; /* quieter than the old square cackle */
    k = k || 1;
    const which = Math.random();
    if (which < 0.4) {
      /* soft cackle — short breathy triangle hops, not a square buzz */
      for (let i = 0; i < 4; i++) {
        const f = (260 + (i % 2 ? 70 : 0) + Math.random() * 50) * k;
        tone('triangle', f, f * 0.85, 0.11, v * 0.45, i * 0.09);
        tone('sine', f * 0.5, f * 0.4, 0.12, v * 0.25, i * 0.09);
      }
    } else if (which < 0.75) {
      /* mutter — low filtered vowels */
      tone('sine', 170 * k, 150 * k, 0.35, v * 0.4, 0);
      tone('triangle', 220 * k, 190 * k, 0.3, v * 0.28, 0.12);
      hiss(0.4, 700 * k, v * 0.22, 0, 'lowpass');
    } else {
      /* a shorter, gentler laugh */
      for (let i = 0; i < 3; i++) tone('sine', (300 + i * 25) * k, (280 + i * 20) * k, 0.15, v * 0.35, i * 0.11);
      hiss(0.2, 900, v * 0.16, 0, 'bandpass');
    }
  }
  function playBark(vol, pan, k) {
    const v = Math.min(1, vol || 0.5) * 0.55; k = k || 1;
    tone('triangle', 420 * k, 280 * k, 0.09, v * 0.8, 0);
    tone('square', 240 * k, 180 * k, 0.07, v * 0.18, 0);
    hiss(0.08, 1100 * k, v * 0.4, 0, 'bandpass');
    tone('triangle', 360 * k, 240 * k, 0.08, v * 0.5, 0.09);
  }
  function playHowl(vol, pan, k) {
    const v = Math.min(1, vol || 0.5) * 0.5; k = k || 1;
    tone('sine', 280 * k, 520 * k, 0.85, v * 0.7, 0);
    tone('sine', 520 * k, 240 * k, 1.1, v * 0.65, 0.7);
    tone('triangle', 200 * k, 180 * k, 1.5, v * 0.25, 0.2);
  }
  function playWolfGrowl(vol, pan, k) {
    const v = Math.min(1, vol || 0.5) * 0.5; k = k || 1;
    tone('sawtooth', 90 * k, 60 * k, 0.55, v * 0.7, 0);
    hiss(0.5, 380 * k, v * 0.55, 0, 'lowpass');
  }
  function playMew(vol, pan, k) {
    const v = Math.min(1, vol || 0.4) * 0.35; k = k || 1;
    tone('sine', 820 * k, 1100 * k, 0.12, v * 0.55, 0);
    tone('sine', 1100 * k, 700 * k, 0.16, v * 0.45, 0.1);
  }
    function hookSounds() {
    try {
      if (typeof playSound !== 'function' || playSound.__1267) return;
      const ps = playSound;
      playSound = function (kind, vol, pan, m) {
        if (typeof kind === 'string' && kind.slice(0, 3) === 'nm:') {
          const parts = kind.split(':'), ty = parts[1], k = +parts[2] || 1;
          if (ty === 'hagvoice' || ty === 'hagcackle' || ty === 'hagmutter') { playHagVoice(vol, pan, k); return; }
          if (ty === 'bark') { playBark(vol, pan, k); return; }
          if (ty === 'howl') { playHowl(vol, pan, k); return; }
          if (ty === 'wolfgrowl') { playWolfGrowl(vol, pan, k); return; }
          if (ty === 'mew') { playMew(vol, pan, k); return; }
        }
        /* hag-only remap of the old harsh cackle: if a nearby hag is the likely source and her def is hagvoice, we're already covered.
           Leave 'cackle' itself for Merry Mischanter / Sneerin' Swaddle. */
        return ps.apply(this, arguments);
      };
      playSound.__1267 = 1;
    } catch (e) { ERR('snd', e); }
  }

  /* ---------- persist tamed dogs ---------- */
  function dogKey() {
    try { return 'glen_dogs_' + ((typeof current !== 'undefined' && current && current.id) || 'default'); } catch (_) { return 'glen_dogs_default'; }
  }
  function saveDogs() {
    try {
      const list = [];
      for (const a of mobs) {
        if (!a || !a.__1267 || !a.tamed || a.kind !== 'wolf' || !a.g) continue;
        const p = a.g.position;
        list.push({ x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), sitting: a.sitting ? 1 : 0, hp: a.hp, name: a.named || 'Scottish Dog', owner: a.owner || '' });
      }
      localStorage.setItem(dogKey(), JSON.stringify(list));
    } catch (_) {}
  }
  function loadDogs() {
    try {
      const raw = localStorage.getItem(dogKey());
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      /* don't double-spawn */
      const have = mobs.filter(function (a) { return a && a.__1267 && a.tamed; }).length;
      if (have >= list.length) return;
      for (const d of list) {
        const a = makeAnimal('dog', { owner: d.owner });
        a.sitting = d.sitting ? 1 : 0;
        a.hp = d.hp || 16;
        a.named = d.name || 'Scottish Dog';
        placeAnimal(a, d.x, d.y, d.z);
      }
    } catch (e) { ERR('load', e); }
  }
  U.saveDogs = saveDogs;
  U.loadDogs = loadDogs;

  /* ---------- hooks ---------- */
  let prevLT = 0;
  function pollPadLT() {
    try {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      let lt = false;
      for (let i = 0; i < pads.length; i++) {
        const g = pads[i];
        if (g && g.connected && g.buttons[6] && (g.buttons[6].pressed || g.buttons[6].value > 0.5)) lt = true;
      }
      if (lt && !prevLT) {
        if (tryToggleSit()) U._dogLT = 1;
        else U._dogLT = 0;
      }
      if (!lt) U._dogLT = 0;
      prevLT = lt;
    } catch (_) {}
  }

  function hook() {
    hookSounds();
    ensureHagModelWrap();
    /* updateMobs: pull our animals out so classic wander/legs AI cannot fight us, then step them. */
    try {
      if (typeof updateMobs === 'function' && !updateMobs.__1267) {
        const um = updateMobs;
        updateMobs = function (dt) {
          const mine = [];
          try {
            if (typeof mobs !== 'undefined') {
              for (let i = mobs.length - 1; i >= 0; i--) {
                if (mobs[i] && mobs[i].__1267) { mine.push(mobs[i]); mobs.splice(i, 1); }
              }
            }
          } catch (_) {}
          const r = um.apply(this, arguments);
          try { for (let i = mine.length - 1; i >= 0; i--) mobs.push(mine[i]); } catch (_) {}
          try {
            const t = Math.min(0.08, +dt || 0.016);
            for (const a of mine) {
              if (!a || !a.g) continue;
              if (a.hp <= 0) { try { despawnAnimal(a); } catch (_) {} continue; }
              try {
                if (!a.tamed && a.kind === 'wolf' && !(a.angry > 0) && typeof P !== 'undefined') {
                  const dd = Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z);
                  if (dd > 80) { despawnAnimal(a); continue; }
                }
              } catch (_) {}
              stepAnimal(a, t);
            }
            U.frames++;
            U._spT = (U._spT || 4) - t;
            if (U._spT <= 0) {
              U._spT = 8 + Math.random() * 6;
              try {
                if (started && !paused && !(typeof DIM !== 'undefined' && DIM.cur) && wildCount() < 3 && Math.random() < 0.1) spawnPack();
              } catch (_) {}
            }
            upgradeLiveHags();
            pollPadLT();
          } catch (e) { ERR('step', e); }
          return r;
        };
        updateMobs.__1267 = 1;
        try { WIN.updateMobs = updateMobs; } catch (_) {}
      }
    } catch (e) { ERR('um', e); }

    /* feeding bones */
    try {
      if (typeof useItem === 'function' && !useItem.__1267feed) {
        const ui = useItem;
        useItem = function () {
          try {
            const id = (typeof selId !== 'undefined') ? selId : 0;
            if (id === BONE_ID() && typeof reachMob === 'function') {
              const m = reachMob(3.6);
              if (m && m.__1267 && m.kind === 'wolf' && !m.tamed) {
                try { if (typeof swing === 'function') swing(); } catch (_) {}
                tryFeed(m);
                return;
              }
            }
          } catch (e) { ERR('feed', e); }
          return ui.apply(this, arguments);
        };
        useItem.__1267feed = 1;
        try { WIN.useItem = useItem; } catch (_) {}
      }
    } catch (e) { ERR('ui', e); }

    /* pack aggro on player hit */
    try {
      if (typeof damageMob === 'function' && !damageMob.__1267) {
        const dm = damageMob;
        damageMob = function (a, dmg, byPlayer) {
          const r = dm.apply(this, arguments);
          try {
            if (byPlayer && a && a.__1267 && a.kind === 'wolf' && !a.tamed && a.hp > 0) {
              const pid = a.packId;
              for (const m of mobs) {
                if (m && m.__1267 && m.kind === 'wolf' && !m.tamed && (m.packId === pid || m === a)) {
                  m.angry = 18; m.hostile = true;
                }
              }
              try { toast('The pack turns on you!'); } catch (_) {}
              try { sfx3d('nm:wolfgrowl:1.15', a.g.position, 22); } catch (_) {}
            }
            if (a && a.__1267 && a.hp <= 0) {
              try {
                if (a.kind === 'wolf' && typeof dropItem === 'function') {
                  const p = a.g.position;
                  if (Math.random() < 0.85) dropItem(BONE_ID(), 1 + (Math.random() < 0.4 ? 1 : 0), p.x, p.y + 0.3, p.z, (Math.random() - 0.5) * 2, 3, (Math.random() - 0.5) * 2, 0.4);
                }
              } catch (_) {}
            }
          } catch (e) { ERR('dmg', e); }
          return r;
        };
        damageMob.__1267 = 1;
      }
    } catch (e) { ERR('dm', e); }

    /* remember who hurt the player (tamed dogs only bite that mob) */
    try {
      if (typeof hurt === 'function' && !hurt.__1267) {
        const hu = hurt;
        hurt = function (n, msg) {
          try {
            let best = null, bd = 3.4;
            for (const m of mobs) {
              if (!m || !m.g || m.__1267 && (m.tamed || m.kind === 'blackcat')) continue;
              if (!(m.hp > 0)) continue;
              const q = m.g.position, d = Math.hypot(q.x - P.x, q.z - P.z);
              const hostile = m.hostile || m.angry > 0 || (m.def && m.def.dmg > 0 && m.kind !== 'wolf');
              if (hostile && d < bd) { bd = d; best = m; }
            }
            if (best) U.attacker = best;
          } catch (_) {}
          return hu.apply(this, arguments);
        };
        hurt.__1267 = 1;
      }
    } catch (e) { ERR('hurt', e); }

    /* LT: touch path via 1261.onLTEdge; gamepad via poll + toggleDoor mute */
    try {
      const T61 = WIN.__tbox1261;
      if (T61 && typeof T61.onLTEdge === 'function' && !T61.onLTEdge.__1267) {
        const prev = T61.onLTEdge.bind(T61);
        T61.onLTEdge = function () {
          try { if (tryToggleSit()) { T61._ltLatch = 1; return true; } } catch (e) { ERR('lt', e); }
          return prev.apply(this, arguments);
        };
        T61.onLTEdge.__1267 = 1;
      }
    } catch (e) { ERR('lt61', e); }
    try {
      const T60 = WIN.__tbox1260;
      if (T60 && typeof T60.toggleDoor === 'function' && !T60.toggleDoor.__1267) {
        const td = T60.toggleDoor.bind(T60);
        T60.toggleDoor = function () {
          if (U._dogLT) return;
          return td.apply(this, arguments);
        };
        T60.toggleDoor.__1267 = 1;
      }
    } catch (e) { ERR('lt60', e); }

    /* save / load */
    try {
      if (typeof saveWorld === 'function' && !saveWorld.__1267) {
        const sw = saveWorld;
        saveWorld = function () { try { saveDogs(); } catch (_) {} return sw.apply(this, arguments); };
        saveWorld.__1267 = 1;
        try { WIN.saveWorld = saveWorld; } catch (_) {}
      }
    } catch (e) { ERR('save', e); }
    try {
      if (typeof enterWorld === 'function' && !enterWorld.__1267) {
        const ew = enterWorld;
        enterWorld = function () {
          const r = ew.apply(this, arguments);
          setTimeout(function () { try { loadDogs(); } catch (_) {} }, 900);
          return r;
        };
        enterWorld.__1267 = 1;
        try { WIN.enterWorld = enterWorld; } catch (_) {}
      }
    } catch (e) { ERR('ew', e); }

    U._hooked = 1;
  }

  function despawnAnimal(a) {
    try { if (a.g && a.g.parent) a.g.parent.remove(a.g); } catch (_) {}
    try { const i = mobs.indexOf(a); if (i >= 0) mobs.splice(i, 1); } catch (_) {}
  }

  /* public QA helpers */
  U.spawnPack = spawnPack;
  U.makeAnimal = makeAnimal;
  U.placeAnimal = placeAnimal;
  U.upgradeLiveHags = upgradeLiveHags;
  U.applyLook = applyLook;
  U.hook = hook;

  let n = 0;
  const boot = setInterval(function () {
    n++;
    hook();
    if ((U._hooked && WIN.__c123) || n > 120) {
      clearInterval(boot);
      try { hook(); ensureHagModelWrap(); upgradeLiveHags(); loadDogs(); } catch (_) {}
      U.on = 1;
    }
  }, 50);
  [200, 600, 1400, 2500, 4000].forEach(function (ms) {
    setTimeout(function () { try { hook(); ensureHagModelWrap(); upgradeLiveHags(); } catch (_) {} }, ms);
  });
  if (WIN.addEventListener) WIN.addEventListener('load', function () { hook(); ensureHagModelWrap(); });
})(typeof window !== 'undefined' ? window : this);
