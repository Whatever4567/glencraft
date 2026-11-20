/* GLX-C113 (v1.2.113): block-by-block replicas of the three official keep
   paintings, upscaled to the refs' brick pitch and fully explorable. Models
   live in assets/castles/*.bin and are stamped onto naturally generated
   land (no custom isles, crags or hill stamps). New worlds only: a
   deterministic site picker places Clansman on a slope near water and the
   skeleton keeps on high ground; old saves keep their existing keeps.
   Doors, chests, garrisons and the clan gold portal move with the stamp. */
(function c1313castles() {
  const U = window.__c1313 = {err: null, ms: 0, ran: 0, gold: null, counts: {}, models: null, sites: null};
  const SLATE = 152, BARS = 163, FEN = 162, PINE = 135, NEED = 146, HEATH = 4;
  const MOSS = () => (T.MOSS || 144);
  const BLK = () => (T.BLACKSTONE || 248);
  const OB = () => (T.OBSIDIAN || 189);
  const MG = () => (T.MAGMA || 208);
  const LV = () => (T.LAVA || 52);
  const HR = () => (T.HELLROCK || 206);
  const DS = () => (T.DSBRICK || T.DEEPSLATE || 228);
  const FV = [[0, -1], [-1, 0], [0, 1], [1, 0]];
  const FACE = {'-z': 0, '-x': 1, '+z': 2, '+x': 3};
  const SEA0 = () => (typeof SEA === 'number' ? SEA : 41);
  const MODEL_OF = {human: 'clansman', mossy: 'skeleton', black: 'black-skeleton'};
  const CASTLE_SKY_H = 192;
  const FOOT_R = 110; // unlock / setCol radius (ruin skirt is wider in pass 4)
  // Keep AABBs (and the local +z gate face) so the site picker can demand land
  // under the whole stamp and score the view cone from the facade outward —
  // not from the origin, which sits tens of blocks behind the gate.
  const FOOTPRINT = {
    human: {x0: -66, z0: -17, x1: 66, z1: 55},
    mossy: {x0: -96, z0: -12, x1: 96, z1: 68},
    black: {x0: -99, z0: -15, x1: 99, z1: 66}
  };
  const CAP_R = 400; // convert worldgen lava/magma/glowrock in the visible/remesh band

  function installSolidWool(id, key, hex, nice) {
    // mat() expects a texture KEY string (it calls tex(key) which reads texCache).
    // Passing a THREE.Texture here used to produce a black/empty material, so the
    // tartan banners rendered as black rectangles with only the yellow wool visible.
    try {
      const cnv = document.createElement('canvas');
      cnv.width = cnv.height = 16;
      const g = cnv.getContext('2d');
      g.fillStyle = hex;
      g.fillRect(0, 0, 16, 16);
      for (let i = 0; i < 48; i++) {
        g.fillStyle = 'rgba(0,0,0,' + (0.07 + (i % 5) * 0.03) + ')';
        g.fillRect((i * 7) % 16, (i * 11) % 16, 1, 1);
      }
      if (typeof THREE !== 'undefined') {
        const tex = new THREE.Texture(cnv);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.needsUpdate = true;
        if (typeof texCache !== 'undefined') texCache[key] = tex;
        if (typeof texImg !== 'undefined') texImg[key] = cnv;
        try {
          const rgb = hex.replace('#', '');
          const av = parseInt(rgb.length === 6 ? rgb : '888888', 16);
          if (typeof AVG !== 'undefined') AVG[key] = av;
        } catch (_) {}
        if (typeof FACES !== 'undefined') FACES[id] = key;
        if (typeof BLOCK_MATS !== 'undefined') {
          if (typeof mat === 'function') BLOCK_MATS[id] = mat(key);
          else BLOCK_MATS[id] = new THREE.MeshLambertMaterial({map: tex});
        }
      }
      if (typeof NAMES !== 'undefined') NAMES[id] = nice;
      try { if (typeof ICON_KEY !== 'undefined') ICON_KEY[id] = key; } catch (_) {}
      try { if (typeof HARD !== 'undefined') HARD[id] = (HARD[T.WOOL] || 0.8); } catch (_) {}
      try { if (typeof PLACEABLE !== 'undefined' && PLACEABLE.add) PLACEABLE.add(id); } catch (_) {}
      try { if (typeof BUILT_T !== 'undefined') BUILT_T[id] = 1; } catch (_) {}
    } catch (_) {}
  }

  function ensureWool() {
    try {
      if (typeof bootWool === 'function' && (!T.WOOLRED || !T.WOOLGREEN)) bootWool();
    } catch (_) {}
    if (!T.WOOLRED) T.WOOLRED = 256;
    if (!T.WOOLGREEN) T.WOOLGREEN = 257;
    installSolidWool(T.WOOLRED, 'wool_red', '#c62828', 'Red Wool');
    installSolidWool(T.WOOLGREEN, 'wool_green', '#2e7d32', 'Green Wool');
  }

  function isNewWorld() {
    try {
      if (!current || current.mode === 'creative') return false;
      if (typeof NEW_CASTLES_AT === 'number' && current.created > NEW_CASTLES_AT) return true;
      if (current.newCastles) return true;
    } catch (_) {}
    return false;
  }

  /* ---------- model loader (sync XHR of assets/castles/*.bin) ---------- */
  function parseBin(buf) {
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    if (u8[0] !== 71 || u8[1] !== 67 || u8[2] !== 49 || u8[3] !== 51) throw new Error('bad magic');
    const ver = u8[4];
    const aabb = [dv.getInt16(5, true), dv.getInt16(7, true), dv.getInt16(9, true),
                  dv.getInt16(11, true), dv.getInt16(13, true), dv.getInt16(15, true)];
    const nruns = dv.getUint32(17, true);
    let off = 21;
    const runs = new Array(nruns);
    for (let i = 0; i < nruns; i++) {
      runs[i] = {
        x: dv.getInt16(off, true),
        y: dv.getInt16(off + 2, true),
        z: dv.getInt16(off + 4, true),
        n: dv.getUint16(off + 6, true),
        id: dv.getUint16(off + 8, true)
      };
      off += 10;
    }
    let specials = {}, stats = {runs: nruns, aabb: aabb};
    // optional JSON footer: <json><u32 len>JS13
    if (u8.byteLength >= off + 8) {
      const tail = String.fromCharCode(u8[u8.byteLength - 4], u8[u8.byteLength - 3], u8[u8.byteLength - 2], u8[u8.byteLength - 1]);
      if (tail === 'JS13') {
        const len = dv.getUint32(u8.byteLength - 8, true);
        const jsOff = u8.byteLength - 8 - len;
        if (jsOff >= off) {
          try {
            const txt = new TextDecoder('utf-8').decode(u8.subarray(jsOff, jsOff + len));
            const j = JSON.parse(txt);
            specials = j.specials || {};
            if (j.stats) stats = Object.assign(stats, j.stats);
          } catch (_) {}
        }
      }
    }
    return {runs: runs, specials: specials, stats: stats, aabb: aabb};
  }

  function loadBin(name) {
    const url = 'assets/castles/' + name + '.bin';
    const x = new XMLHttpRequest();
    x.open('GET', url, false);
    // Sync XHR cannot use responseType='arraybuffer' in Chrome; read as a binary string.
    x.overrideMimeType('text/plain; charset=x-user-defined');
    x.send(null);
    if (x.status !== 200 && x.status !== 0) throw new Error('xhr ' + x.status + ' ' + url);
    const s = x.responseText || '';
    const u8 = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i) & 0xff;
    return parseBin(u8);
  }

  function ensureModels() {
    if (U.models) return U.models;
    const out = {};
    const names = Object.keys(MODEL_OF);
    for (let i = 0; i < names.length; i++) {
      const kind = names[i], n = MODEL_OF[kind];
      try {
        out[kind] = loadBin(n);
      } catch (e) {
        if (!U.err) U.err = 'model ' + n + ' ' + e;
      }
    }
    U.models = out;
    return out;
  }

  /* ---------- H expand (new worlds only; never on old saves) ---------- */
  function ensureSky(gy, modelH) {
    const need = (gy | 0) + (modelH | 0) + 6;
    if (typeof H !== 'number' || H >= need) return H;
    const want = Math.max(need, CASTLE_SKY_H);
    try {
      if (window.__v1308 && typeof __v1308.expandWorldH === 'function') {
        const got = __v1308.expandWorldH(want);
        U.skyH = H;
        U.expandMs = __v1308.expandMs;
        U.expandFail = __v1308.expandFail || 0;
        return H;
      }
    } catch (e) { U.expandErr = String(e); }
    return H;
  }

  /* ---------- deterministic natural-terrain site picker (new worlds) ---------- */
  function hAt(x, z) {
    try {
      if (typeof g9cols !== 'undefined' && g9cols) return g9cols[(x * D + z) * 2];
    } catch (_) {}
    try { if (typeof solidTop === 'function') return solidTop(x, z); } catch (_) {}
    return SEA0();
  }
  function kindAt(x, z) {
    try {
      if (typeof g9cols !== 'undefined' && g9cols) return g9cols[(x * D + z) * 2 + 1];
    } catch (_) {}
    return 0;
  }
  function landStats(x, z, r, step) {
    step = step || 4;
    let lo = 1e9, hi = -1e9, sum = 0, n = 0, wet = 0, waterNear = 0;
    const sea = SEA0();
    for (let a = -r; a <= r; a += step) for (let b = -r; b <= r; b += step) {
      const xx = x + a, zz = z + b;
      if (xx < 1 || zz < 1 || xx >= W - 1 || zz >= D - 1) continue;
      const h = hAt(xx, zz), k = kindAt(xx, zz);
      if (!(h > 0)) continue;
      lo = Math.min(lo, h); hi = Math.max(hi, h); sum += h; n++;
      if (k === 5 || h <= sea) wet++;
    }
    // water in a ring 16–40 from the site (loch / shore)
    for (let a = -40; a <= 40; a += 6) for (let b = -40; b <= 40; b += 6) {
      const d = Math.hypot(a, b);
      if (d < 16 || d > 40) continue;
      const xx = x + a, zz = z + b;
      if (xx < 1 || zz < 1 || xx >= W - 1 || zz >= D - 1) continue;
      const h = hAt(xx, zz), k = kindAt(xx, zz);
      if (k === 5 || h <= sea) waterNear++;
    }
    const mean = n ? sum / n : sea;
    return {lo: lo, hi: hi, mean: mean, slope: hi - lo, wet: wet, waterNear: waterNear, n: n};
  }
  function gateDirOf(rot) {
    // local +z = gate; same rotation as C.ctx wp / capture gateDir.
    let x = 0, z = 1;
    for (let i = 0; i < (rot || 0); i++) { const t = x; x = -z; z = t; }
    return [x, z];
  }

  function rotOff(lx, lz, rot) {
    let x = lx, z = lz;
    for (let i = 0; i < (rot || 0); i++) { const t = x; x = -z; z = t; }
    return [x, z];
  }

  function footprintLandOk(x, z, rot, kind) {
    // The rotated AABB must sit on land so the stamped keep (and its
    // foundations) cannot hang over the loch as a rectangular pier.
    const f = FOOTPRINT[kind] || FOOTPRINT.human;
    const sea = SEA0();
    let n = 0, wet = 0, lo = 1e9;
    const step = 4;
    for (let lx = f.x0; lx <= f.x1; lx += step) {
      for (let lz = f.z0; lz <= f.z1; lz += step) {
        const off = rotOff(lx, lz, rot);
        const xx = Math.round(x + off[0]), zz = Math.round(z + off[1]);
        n++;
        if (xx < 1 || zz < 1 || xx >= W - 1 || zz >= D - 1) { wet++; continue; }
        const h = hAt(xx, zz), k = kindAt(xx, zz);
        if (!(h > 0) || k === 5 || h <= sea + 1) wet++;
        else if (h < lo) lo = h;
      }
    }
    return n > 0 && wet <= n * 0.08 && lo >= sea + 2;
  }

  function gateViewScore(x, z, rot, kind) {
    // Score a 60-block cone in front of the GATE FACE (local +z = aabb z1),
    // not the keep origin. A short apron just past the facade must stay on
    // land; beyond that, prefer downhill and water (the official loch).
    const foot = FOOTPRINT[kind] || FOOTPRINT.human;
    const zGate = foot.z1;
    const [gx, gz] = gateDirOf(rot);
    const rx = -gz, rz = gx;
    const ox = x + gx * zGate, oz = z + gz * zGate;
    const gy = hAt(x, z);
    const sea = SEA0();
    let apronN = 0, apronWet = 0;
    for (let d = 2; d <= 14; d += 2) {
      for (let s = -12; s <= 12; s += 3) {
        const xx = Math.round(ox + gx * d + rx * s);
        const zz = Math.round(oz + gz * d + rz * s);
        apronN++;
        if (xx < 1 || zz < 1 || xx >= W - 1 || zz >= D - 1) { apronWet++; continue; }
        const h = hAt(xx, zz), k = kindAt(xx, zz);
        if (k === 5 || h <= sea + 1) apronWet++;
      }
    }
    // A wet apron means the facade hangs over water; reject this rotation.
    if (apronN && apronWet > apronN * 0.2) return -1e15 + (1 - apronWet / apronN) * 100;
    let n = 0, low = 0, water = 0, block = 0, closeBlock = 0, heightSum = 0;
    for (let d = 16; d <= 76; d += 3) {
      const half = Math.max(2, Math.round((d - 14) * 0.55));
      for (let s = -half; s <= half; s += 3) {
        const xx = Math.round(ox + gx * d + rx * s);
        const zz = Math.round(oz + gz * d + rz * s);
        n++;
        if (xx < 1 || zz < 1 || xx >= W - 1 || zz >= D - 1) { block += 2; closeBlock += (d <= 40) ? 1 : 0; continue; }
        const h = hAt(xx, zz);
        const k = kindAt(xx, zz);
        const wet = (k === 5 || h <= sea);
        heightSum += h - gy;
        if (wet) water++;
        if (wet || h <= gy - 1) low++;
        if (!wet && h >= gy + 2) {
          block++;
          if (d <= 40) closeBlock++;
        }
      }
    }
    if (!n) return -1e18;
    return water * 8 + low * 3 - closeBlock * 12 - block * 3 - (heightSum / n) * 2;
  }

  function bestGateRot(x, z, kind) {
    let br = 0, bs = -1e18;
    for (let r = 0; r < 4; r++) {
      const s = gateViewScore(x, z, r, kind);
      if (s > bs) { bs = s; br = r; }
    }
    return {rot: br, s: bs};
  }

  function downhill(x, z, r) {
    // Kept as a fallback: unit-ish step toward the lowest sampled neighbour.
    let bx = 0, bz = 1, bh = 1e9;
    for (let a = -r; a <= r; a += 4) for (let b = -r; b <= r; b += 4) {
      if (!a && !b) continue;
      const h = hAt(x + a, z + b);
      if (h < bh) { bh = h; bx = a; bz = b; }
    }
    if (Math.abs(bz) >= Math.abs(bx)) return bz >= 0 ? 0 : 2;
    return bx >= 0 ? 3 : 1;
  }

  function pickNaturalSites() {
    const cx0 = W >> 1, cz0 = D >> 1;
    const I0 = (window.__c101 && __c101.isl) || (window.__c208 && __c208.isl) || {cx: cx0, cz: cz0, R: 40};
    const exclR = (I0.R || 40) + 50;
    const sp0 = (typeof g9findSpawn === 'function' && g9findSpawn()) || (typeof g9spawn !== 'undefined' && g9spawn) || [cx0, 0, cz0];
    const nearSpawn = (x, z) => Math.hypot(x - (I0.cx || cx0), z - (I0.cz || cz0)) < exclR ||
      Math.hypot(x - sp0[0], z - sp0[2]) < exclR;
    const minSep = 160;
    const ok = (x, z, placed) => x > 90 && z > 90 && x < W - 90 && z < D - 90 &&
      !nearSpawn(x, z) &&
      placed.every(p => Math.hypot(p.x - x, p.z - z) > minSep);
    const sea = SEA0();
    const step = Math.max(8, (W / 108) | 0);

    function best(scoreFn, placed) {
      let bx = -1, bz = -1, bs = -1e18;
      for (let x = 0; x < W; x += step) for (let z = 0; z < D; z += step) {
        if (!ok(x, z, placed)) continue;
        const s = scoreFn(x, z);
        if (s > bs) { bs = s; bx = x; bz = z; }
      }
      return bs > -1e17 ? {x: bx, z: bz, s: bs} : null;
    }

    const placed = [];
    // Clansman: hillside / slope, preferably near water, not a summit, dry centre.
    const human = best((x, z) => {
      const f = landStats(x, z, 18, 4);
      if (f.wet > 2 || f.lo < sea + 2) return -1e18;
      if (f.slope < 3) return -1e18;
      const gv = bestGateRot(x, z, 'human');
      if (!footprintLandOk(x, z, gv.rot, 'human')) return -1e18;
      const slopeFit = -Math.abs(f.slope - 12);          // mid slope, not a cliff or a pad
      const elevFit = -Math.abs(f.mean - (sea + 14));
      // Gate must face open/downhill (ideally a loch beyond the apron).
      return slopeFit * 3 + elevFit + Math.min(8, f.slope) + gv.s * 2;
    }, placed);
    if (!human) return null;
    placed.push({kind: 'human', x: human.x, z: human.z, rot: bestGateRot(human.x, human.z, 'human').rot});

    // Skeleton: local high ground / prominence, dry, far from human.
    const mossy = best((x, z) => {
      const f = landStats(x, z, 16, 4);
      if (f.wet > 1 || f.lo <= sea + 1) return -1e18;
      const ring = landStats(x, z, 36, 6);
      const prom = f.mean - ring.mean;
      const gv = bestGateRot(x, z, 'mossy');
      if (!footprintLandOk(x, z, gv.rot, 'mossy')) return -1e18;
      return f.mean * 3 + prom * 8 + Math.min(10, f.slope) + gv.s * 1.5;
    }, placed);
    if (!mossy) return null;
    placed.push({kind: 'mossy', x: mossy.x, z: mossy.z, rot: bestGateRot(mossy.x, mossy.z, 'mossy').rot});

    // Black: second-best hilltop, far from both.
    const black = best((x, z) => {
      const f = landStats(x, z, 16, 4);
      if (f.wet > 1 || f.lo <= sea + 1) return -1e18;
      const ring = landStats(x, z, 36, 6);
      const prom = f.mean - ring.mean;
      const gv = bestGateRot(x, z, 'black');
      if (!footprintLandOk(x, z, gv.rot, 'black')) return -1e18;
      return f.mean * 3 + prom * 8 + Math.min(10, f.slope) + gv.s * 1.5;
    }, placed);
    if (!black) return null;
    placed.push({kind: 'black', x: black.x, z: black.z, rot: bestGateRot(black.x, black.z, 'black').rot});

    U.sites = placed;
    return placed;
  }

  function hideKeepFootprint(cx, cz, R) {
    // Remove previously stamped keep masonry on an old isle (or a relocated site)
    // without deleting natural land (grass/dirt/stone/water/sand) outside walls.
    const masonry = new Set([T.STONEBRICK, T.MOSSYBRICK, T.COBBLE, T.SLATE, T.WSTONE,
      T.BLACKSTONE, T.DSBRICK, T.DSTILE, T.OBSIDIAN, T.HELLROCK, T.HELLBRICK, T.MAGMA, T.LAVA, T.LAVAROCK,
      T.BARS || BARS, BARS, T.FENCE, T.COBWEB, T.DOOR, T.DOORTOP, T.CHEST, T.TORCH, T.BED,
      T.WOOL, T.WOOLRED, T.WOOLGREEN, T.WOOLYELLOW, T.PLANKS, T.OAKST || 164, 164, 167,
      T.MOSS, PINE, NEED, HEATH, SLATE].filter(Boolean));
    try { if (T.WOOLRED) masonry.add(T.WOOLRED); if (T.WOOLGREEN) masonry.add(T.WOOLGREEN); } catch (_) {}
    const sea = SEA0();
    for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) {
      if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1) continue;
      if (Math.hypot(x - cx, z - cz) > R) continue;
      for (let y = 1; y < H - 1; y++) {
        const i = idx(x, y, z), b = world[i];
        if (!b) continue;
        if (masonry.has(b) && y >= sea - 2) world[i] = 0;
      }
      try { if (typeof setCol === 'function') setCol(x, z); } catch (_) {}
    }
  }

  function wrapPlacement() {
    if (typeof g9PlaceCastles !== 'function') return;
    const prev = g9PlaceCastles;
    if (prev.__c1313) return;
    g9PlaceCastles = function () {
      const r = prev.apply(this, arguments);
      try {
        if (!isNewWorld() || (typeof DIM !== 'undefined' && DIM.cur) || W < 200) return r;
        const old = (g9castles || []).map(c => [c[0], c[1], c[2]]);
        const sites = pickNaturalSites();
        if (!sites || sites.length < 3) { U.siteFail = 1; return r; }
        // hide any keep already raised on the official map-edge isles (new worlds only)
        for (let i = 0; i < old.length; i++) hideKeepFootprint(old[i][1], old[i][2], 36);
        const placed = sites.map(s => [s.kind, s.x, s.z]);
        g9castles = placed;
        U.placed = placed;
        U.rots = {};
        sites.forEach(s => { U.rots[s.kind] = s.rot; });
        // record st so later rebuild uses the new gy/rot
        try {
          const C = window.__c151;
          if (C) {
            C.st = C.st || {};
            sites.forEach(s => {
              const gy = Math.max(SEA0(), hAt(s.x, s.z));
              C.st[s.kind] = {rot: s.rot, gy: gy, natural: 1};
            });
          }
        } catch (_) {}
        return placed;
      } catch (e) {
        if (window.__glenLoad && __glenLoad.isYield && __glenLoad.isYield(e)) throw e;
        if (!U.err) U.err = 'place ' + e;
        return r;
      }
    };
    g9PlaceCastles.__c1313 = 1;
  }

  /* ---------- stamp ---------- */
  function lootFor(tag) {
    const I = (typeof IT !== 'undefined' && IT) || {};
    if (tag === 'treasury') return [[I.GOLDINGOT || T.GOLD, 4], [I.IRONINGOT, 6], [T.TORCH, 8]];
    if (tag === 'hall') return [[I.BREAD, 6], [I.ARROW, 16], [I.BOW, 1]];
    if (tag === 'guard') return [[I.ARROW, 12], [I.IRONINGOT, 3], [T.TORCH, 6]];
    if (tag === 'chamber') return [[I.BREAD, 4], [I.GOLDINGOT || T.GOLD, 1], [T.TORCH, 4]];
    if (tag === 'ruin') return [[I.BONE || 171, 6], [I.ARROW, 8], [I.IRONINGOT, 2]];
    if (tag === 'tower') return [[I.ARROW, 8], [T.TORCH, 4]];
    return [[T.TORCH, 4]];
  }

  function stampModel(K, model) {
    const runs = model.runs;
    const maxY = (typeof H === 'number' ? H - 3 : 200);
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      const y = K.gy + r.y;
      if (y < 1 || y > maxY) continue;
      let id = r.id;
      if (id === (T.LAVA) || id === (T.LAVAB) || id === (T.MAGMA || 208)) id = lavaRockId();
      for (let k = 0; k < r.n; k++) K.B(r.x + k, r.y, r.z, id);
    }
    const sp = model.specials || {};
    // doors
    const doors = sp.door || [];
    for (let i = 0; i < doors.length; i++) {
      const d = doors[i];
      const f = FACE[d.face] != null ? FACE[d.face] : 2;
      try { K.door(d.x, d.y, d.z, f); } catch (_) {}
    }
    const chests = sp.chest || [];
    for (let i = 0; i < chests.length; i++) {
      const c = chests[i];
      const f = FACE[c.face] != null ? FACE[c.face] : 2;
      try { K.chest(c.x, c.y, c.z, f, lootFor(c.loot)); } catch (_) {}
    }
    const lamps = sp.lamp || [];
    for (let i = 0; i < lamps.length; i++) {
      const L = lamps[i];
      try { K.lamp(L.x, L.y, L.z, -1, {}); } catch (_) {}
    }
    const beds = sp.bed || [];
    for (let i = 0; i < beds.length; i++) {
      const b = beds[i];
      const f = FACE[b.face] != null ? FACE[b.face] : 2;
      try { K.bed(b.x, b.y, b.z, f); } catch (_) {}
    }
    return sp;
  }

  function foundations(K, model) {
    // For every column that has a structure block at/near y=0, fill down to natural solid ground.
    const aabb = model.aabb || model.stats && model.stats.aabb;
    if (!aabb) return;
    const [x0, y0, z0, x1, y1, z1] = aabb;
    const fillId = K.kind === 'black' ? (T.BLACKSTONE || 248) : (T.COBBLE || 12);
    const wallId = K.kind === 'black' ? (T.BLACKSTONE || 248) : (T.STONEBRICK || 28);
    const sea = SEA0();
    for (let lx = x0; lx <= x1; lx++) for (let lz = z0; lz <= z1; lz++) {
      const [wx, _wy, wz] = K.wp(lx, 0, lz);
      if (wx < 1 || wz < 1 || wx >= W - 1 || wz >= D - 1) continue;
      // does this column have masonry in the model near the floor?
      let has = false;
      for (let ly = Math.min(0, y0); ly <= 2 && !has; ly++) {
        if (K.G(lx, ly, lz)) has = true;
      }
      if (!has) continue;
      let top = 0;
      try { top = (typeof solidTop === 'function') ? solidTop(wx, wz) : hAt(wx, wz); } catch (_) { top = hAt(wx, wz); }
      // Hang down to natural land only. Never fill water — that built a
      // rectangular pier when the gate faced a loch.
      if (top <= sea) continue;
      const fromY = K.gy - 1;
      const toY = Math.max(2, Math.min(fromY, top));
      for (let y = fromY; y >= toY && y > 0; y--) {
        const i = idx(wx, y, wz);
        const b = world[i];
        if (b === T.WATER || b === T.LAVAB) continue;
        if (!b || b === T.AIR || b === T.LEAVES || b === T.SNOW) {
          world[i] = (fromY - y < 2) ? wallId : fillId;
        }
      }
    }
  }

  function edgeBlend(K, model) {
    // Gentle 1–2 block terracing at the footprint rim only — no new landmass.
    const aabb = model.aabb || model.stats && model.stats.aabb;
    if (!aabb) return;
    const [x0, , z0, x1, , z1] = aabb;
    const sea = SEA0();
    for (let lx = x0 - 2; lx <= x1 + 2; lx++) for (let lz = z0 - 2; lz <= z1 + 2; lz++) {
      const inside = lx >= x0 && lx <= x1 && lz >= z0 && lz <= z1;
      const rim = !inside && lx >= x0 - 2 && lx <= x1 + 2 && lz >= z0 - 2 && lz <= z1 + 2;
      if (!rim) continue;
      const [wx, , wz] = K.wp(lx, 0, lz);
      if (wx < 2 || wz < 2 || wx >= W - 2 || wz >= D - 2) continue;
      let top = 0;
      try { top = solidTop(wx, wz); } catch (_) { top = hAt(wx, wz); }
      if (top <= sea) continue;
      // if the adjacent interior column is much higher/lower, add a single step of dirt/grass
      const [ix, , iz] = K.wp(Math.max(x0, Math.min(x1, lx)), 0, Math.max(z0, Math.min(z1, lz)));
      let itop = top;
      try { itop = solidTop(ix, iz); } catch (_) {}
      const d = itop - top;
      if (d >= 3 && top + 1 < K.gy && top + 1 < H - 2) {
        world[idx(wx, top + 1, wz)] = T.DIRT || 2;
        world[idx(wx, top + 2, wz)] = T.GRASS || 1;
      }
    }
  }



  function installLavaRock() {
    // Static decorative lava: magma albedo, mild emissive, NO LSRC flood, no flow.
    // Replaces T.LAVA / T.MAGMA in the keep so SwiftShader is not buried in
    // MeshBasicMaterial glowMat or liquid light propagation.
    const id = (T.LAVAROCK = T.LAVAROCK || 261);
    try {
      if (typeof FACES !== 'undefined') FACES[id] = 'magma';
      if (typeof NAMES !== 'undefined') NAMES[id] = 'Lava rock';
      if (typeof PLACEABLE !== 'undefined' && PLACEABLE.add) PLACEABLE.add(id);
      if (typeof BLOCK_MATS !== 'undefined' && typeof THREE !== 'undefined') {
        let map = null;
        try { if (typeof mat === 'function' && mat('magma')) map = mat('magma').map; } catch (_) {}
        // MeshBasic is the cheap "lava rock" trick (unlit, no LSRC, no Phong).
        // Fancy's mat('magma') is MeshPhong; cloning it with emissive made
        // 10k+ decorative veins cost seconds per frame on SwiftShader.
        BLOCK_MATS[id] = new THREE.MeshBasicMaterial({map: map, color: 0xff6a22});
      }
      try { if (window.__LSRC) window.__LSRC[id] = 0; } catch (_) {}
    } catch (_) {}
    return id;
  }

  function lavaRockId() {
    return T.LAVAROCK || installLavaRock();
  }

  function capNearbyFluids(K) {
    // Castle magma is a static MeshBasicMaterial "lava rock" (glowMat) — no
    // LSRC flood and no flow ticks. Worldgen T.LAVA / T.LAVAB near a keep
    // would otherwise flood per-block light and tick as a fluid (Black p95
    // was seconds). Convert those in the footprint to MAGMA.
    const lava = T.LAVA, lavab = T.LAVAB, mag = T.MAGMA || 208, glow = T.GLOWROCK || 209, rock = lavaRockId();
    const R = CAP_R;
    const cx = K.cx, cz = K.cz;
    const maxY = (typeof H === 'number' ? H - 2 : 200);
    let n = 0;
    for (let x = cx - R; x <= cx + R; x++) {
      if (x < 1 || x >= W - 1) continue;
      for (let z = cz - R; z <= cz + R; z++) {
        if (z < 1 || z >= D - 1) continue;
        if (Math.hypot(x - cx, z - cz) > R) continue;
        for (let y = 1; y < maxY; y++) {
          const i = idx(x, y, z);
          const b = world[i];
          if (b !== lava && b !== lavab && b !== mag && b !== glow) continue;
          world[i] = rock;
          n++;
          try { if (typeof FLV !== 'undefined' && FLV && FLV.delete) FLV.delete(i); } catch (_) {}
        }
      }
    }
    U.fluidCap = U.fluidCap || {};
    U.fluidCap[K.kind] = n;
  }

  function decorate(K, kind) {
    // Small natural decorations around the footprint (not a stamped hill).
    const h3 = (x, z, s) => {
      let h = Math.imul(x + s, 374761393) ^ Math.imul(z, 668265263);
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    const [cx, cz] = [K.cx, K.cz];
    const sea = SEA0();
    for (let a = -70; a <= 70; a++) for (let b = -50; b <= 70; b++) {
      const x = cx + a, z = cz + b;
      if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) continue;
      const d = Math.hypot(a, b);
      if (d < 12 || d > 78) continue;
      let top = 0;
      try { top = solidTop(x, z); } catch (_) { continue; }
      if (top <= sea) continue;
      // skip if we already placed masonry here
      const above = world[idx(x, top + 1, z)];
      const here = world[idx(x, top, z)];
      if (here === T.STONEBRICK || here === T.BLACKSTONE || here === T.MOSSYBRICK || here === T.SLATE
          || here === T.STONE || here === T.COBBLE || here === T.OBSIDIAN || here === (T.DEEPSLATE || 133)
          || here === (T.WSTONE || 156) || here === (T.MAGMA || 208) || here === (T.HELLROCK || 206) || here === (T.LAVAROCK || 261)) continue;
      if (above && above !== T.AIR && above !== T.GRASS && above !== T.SNOW && above !== HEATH) continue;
      const u = h3(x, z, 19);
      if (kind === 'human') {
        if (u < 0.22) world[idx(x, top + 1, z)] = HEATH;
        else if (u > 0.94 && d > 32) {
          const ht = 6 + ((h3(x, z, 23) * 6) | 0);
          for (let k = 1; k <= ht && top + k < H - 2; k++) {
            world[idx(x, top + k, z)] = k < ht - 2 ? PINE : (NEED || PINE);
          }
        }
      }
    }
  }

  function placeGold(K) {
    if (K.kind !== 'human') return;
    // Must sit within 40 of the keep origin (uk-land portal window) on solid
    // ground at or above the sea. Prefer behind the keep (local -z).
    const sea = SEA0();
    function col(lx, lz) {
      const [x, , z] = K.wp(lx, 0, lz);
      let y = sea;
      try { y = (typeof solidTop === 'function') ? solidTop(x, z) : y; } catch (_) {}
      return {x: x, y: Math.max(sea, y), z: z, dry: y > sea};
    }
    let best = null;
    // scan a small pad behind / beside the keep, keep radius < 36
    for (let lz = -12; lz >= -32; lz--) {
      for (let lx of [0, 8, -8, 14, -14, 20, -20]) {
        if (lx * lx + lz * lz > 36 * 36) continue;
        const c = col(lx, lz);
        if (c.x < 2 || c.z < 2 || c.x >= W - 2 || c.z >= D - 2) continue;
        // skip standing inside a wall
        let blocked = 0;
        try { blocked = world[idx(c.x, c.y + 1, c.z)] && world[idx(c.x, c.y + 1, c.z)] !== T.AIR; } catch (_) {}
        if (blocked) continue;
        // Prefer ground near the gate floor, not a tower roof (solidTop on a
        // keep column is the battlement).
        if (c.dry) {
          c.score = -Math.abs(c.y - (K.gy || c.y));
          if (!best || c.score > best.score) best = c;
        }
      }
    }
    if (!best) best = col(0, -24);
    try {
      if (window.__egypt1269 && typeof __egypt1269.placeReturn === 'function') {
        __egypt1269.placeReturn(best.x, best.y, best.z);
        U.gold = [best.x, best.y, best.z];
      }
    } catch (e) { if (!U.err) U.err = 'gold ' + e; }
  }



  function isCastleVeg(b) {
    if (!b) return false;
    return b === T.GRASS || b === T.LEAVES || b === T.LEAVES2 || b === T.LOG || b === T.LOG2
      || b === T.WOOD || b === T.PINE || b === PINE || b === T.NEED || b === NEED
      || b === T.HEATHER || b === HEATH || b === T.SNOW || b === T.TALLGRASS
      || b === T.FERN || b === T.VINE || b === T.FLOWER || b === T.REDFLOWER
      || b === T.YELFLOWER || b === T.SAPLING || b === T.MUSH || b === T.BROWNMUSH
      || b === T.DEADBUSH || b === T.LILYPAD || b === T.REED || b === T.SHRUB;
  }

  function clearFootprintAndApron(K, model) {
    // Clear trees and worldgen terrain inside the rotated keep AABB, plus a
    // short apron in front of the gate, so the facade is naturally visible.
    // Vegetation is removed at every Y; solids only above the gate floor so
    // foundations can still hang down to natural ground. Not a view-corridor
    // trench and not a flattened pad.
    const aabb = model.aabb || (model.stats && model.stats.aabb);
    if (!aabb || typeof K.wp !== 'function') return;
    const [x0, y0, z0, x1, y1, z1] = aabb;
    const maxY = (typeof H === 'number' ? H - 2 : 200);
    const gy = K.gy;
    const seen = new Set();
    const clearCol = function (wx, wz) {
      if (wx < 1 || wz < 1 || wx >= W - 1 || wz >= D - 1) return;
      const key = wx + ',' + wz;
      if (seen.has(key)) return;
      seen.add(key);
      for (let y = 1; y < maxY; y++) {
        const i = idx(wx, y, wz);
        const b = world[i];
        if (!b) continue;
        if (isCastleVeg(b) || b === T.LEAVES || b === T.SNOW) {
          world[i] = T.AIR || 0;
          continue;
        }
        if (y > gy && b !== T.WATER && b !== T.LAVAB && b !== (T.AIR || 0)) {
          world[i] = T.AIR || 0;
        }
      }
    };
    const pad = 2;
    for (let lx = x0 - pad; lx <= x1 + pad; lx++) {
      for (let lz = z0 - pad; lz <= z1 + pad; lz++) {
        const w = K.wp(lx, 0, lz);
        clearCol(w[0], w[2]);
      }
    }
    // Small apron in front of the gate (local +z), ~14 deep and ~24 wide.
    const APRON_D = 14, APRON_HALF = 12;
    const gx = (0 >= x0 && 0 <= x1) ? 0 : Math.round((x0 + x1) / 2);
    for (let lx = gx - APRON_HALF; lx <= gx + APRON_HALF; lx++) {
      for (let lz = z1 + 1; lz <= z1 + APRON_D; lz++) {
        const w = K.wp(lx, 0, lz);
        clearCol(w[0], w[2]);
      }
    }
    // Height cache only for columns we touched (stamp already setCol's FOOT_R later).
    if (typeof setCol === 'function') {
      seen.forEach(function (key) {
        const parts = key.split(',');
        try { setCol(+parts[0], +parts[1]); } catch (_) {}
      });
    }
  }

  function carveInterior(K, model) {
    // Bins store solid RLE only, so hillside dirt would otherwise fill halls
    // and stairwells. For every column that has model masonry, clear worldgen
    // between that column's lowest and highest model Y so interiors are walkable.
    const runs = model.runs;
    if (!runs || !runs.length) return;
    const col = {};
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      if (!r.id) continue;
      const y = r.y;
      for (let k = 0; k < r.n; k++) {
        const key = (r.x + k) + ',' + r.z;
        const cur = col[key];
        if (!cur) col[key] = [y, y];
        else {
          if (y < cur[0]) cur[0] = y;
          if (y > cur[1]) cur[1] = y;
        }
      }
    }
    const maxY = (typeof H === 'number' ? H - 3 : 200);
    const keys = Object.keys(col);
    for (let i = 0; i < keys.length; i++) {
      const parts = keys[i].split(',');
      const lx = +parts[0], lz = +parts[1];
      const ylo = col[keys[i]][0], yhi = col[keys[i]][1];
      for (let ly = ylo; ly <= yhi; ly++) {
        const wy = K.gy + ly;
        if (wy < 1 || wy > maxY) continue;
        const [wx, , wz] = K.wp(lx, ly, lz);
        if (wx < 1 || wz < 1 || wx >= W - 1 || wz >= D - 1) continue;
        try { world[idx(wx, wy, wz)] = T.AIR || 0; } catch (_) {}
      }
    }
  }

  function buildFromModel(K) {
    ensureWool();
    installLavaRock();
    const models = ensureModels();
    const model = models[K.kind];
    if (!model) return {kind: K.kind, missing: 1};
    const aabb = model.aabb || [0, 0, 0, 0, 0, 0];
    const modelH = aabb[4] - Math.min(0, aabb[1]) + 2;
    ensureSky(K.gy, modelH);
    clearFootprintAndApron(K, model);
    carveInterior(K, model);
    const sp = stampModel(K, model);
    foundations(K, model);
    edgeBlend(K, model);
    decorate(K, K.kind);
    capNearbyFluids(K);
    placeGold(K);
    U.counts[K.kind] = {gy: K.gy, tip: K.gy + (aabb[4] || 0), blocks: (model.stats && model.stats.blocks) || 0, aabb: aabb};
    return {kind: K.kind, gy: K.gy, specials: sp};
  }

  function hook() {
    const C = window.__c151;
    if (!C || C.__c1313) return true;
    C.__c1313 = 1;
    C.B = C.B || {};
    C.B.human = function (K) { return buildFromModel(K); };
    C.B.mossy = function (K) { return buildFromModel(K); };
    C.B.black = function (K) { return buildFromModel(K); };
    wrapPlacement();
    // c151.work() faces the gate at spawn and clearSite()s a flattened pad.
    // New worlds use pickNaturalSites + rebuildAll only.
    if (typeof C.work === 'function' && !C.work.__c1313) {
      const prevWork = C.work;
      C.work = function (only) {
        if (isNewWorld() && U.sites && U.sites.length) return;
        return prevWork.apply(this, arguments);
      };
      C.work.__c1313 = 1;
    }
    return true;
  }

  function unlockFootprint(list, R) {
    if (typeof placedSet === 'undefined' || !placedSet) return null;
    const saved = placedSet;
    placedSet = new Set(saved);
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      for (let x = c[1] - R; x <= c[1] + R; x++) for (let z = c[2] - R; z <= c[2] + R; z++) {
        if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1) continue;
        if (Math.hypot(x - c[1], z - c[2]) > R) continue;
        for (let y = 1; y < H - 1; y++) placedSet.delete(idx(x, y, z));
      }
    }
    return saved;
  }

  function rotOf(c, st) {
    // Prefer the picker result. c151.work() overwrites st.rot with approach()
    // (gate-faces-spawn) before our rebuildAll runs.
    if (U.rots && U.rots[c[0]] != null) return U.rots[c[0]];
    if (st && st.rot != null) return st.rot;
    return 0;
  }

  function rebuildAll(only) {
    const C = window.__c151;
    if (!C || !C.ctx || typeof g9castles === 'undefined' || !g9castles) return;
    ensureWool();
    ensureModels();
    const list = only ? g9castles.filter(function (c) { return c[0] === only; }) : g9castles.slice();
    const saved = unlockFootprint(list, FOOT_R);
    const t0 = performance.now();
    try {
      for (let ci = 0; ci < list.length; ci++) {
        const c = list[ci], fn = C.B[c[0]];
        if (!fn) continue;
        const st = (C.st && C.st[c[0]]) || {};
        const gy = st.gy != null ? st.gy : (typeof solidTop === 'function' ? Math.max(SEA0(), solidTop(c[1], c[2])) : SEA0());
        const rot = rotOf(c, st);
        // Do NOT call C.clearSite — that flattens a pad. Only unlock and stamp;
        // foundations hang down to natural ground.
        const K = C.ctx(c, ci, gy, rot);
        const ret = fn(K) || {};
        C.st[c[0]] = Object.assign({rot: rot, gy: gy}, ret, {lights: K.lights, chests: K.chestsN, rebuilt: 1});
        if (typeof setCol === 'function') {
          for (let X = c[1] - FOOT_R; X <= c[1] + FOOT_R; X++) for (let Z = c[2] - FOOT_R; Z <= c[2] + FOOT_R; Z++) {
            if (X > 0 && Z > 0 && X < W - 1 && Z < D - 1 && Math.hypot(X - c[1], Z - c[2]) <= FOOT_R) setCol(X, Z);
          }
        }
      }
      U.ran++;
      U.ms = Math.round(performance.now() - t0);
    } catch (e) {
      U.err = 'rebuild ' + String(e && e.stack || e);
    } finally {
      if (saved) placedSet = saved;
    }
  }

  try {
    const gen = generate;
    generate = function () {
      if (window.__glenLoad && __glenLoad.skipPost && __glenLoad.skipPost(62)) return gen.apply(this, arguments);
      const r = gen.apply(this, arguments);
      try {
        if (!DIM.cur && !cityGen) {
          rebuildAll();
        }
      } catch (e) {
        if (window.__glenLoad && __glenLoad.isYield && __glenLoad.isYield(e)) throw e;
        if (!U.err) U.err = 'touch ' + e;
      }
      if (window.__glenLoad && __glenLoad.markPost) __glenLoad.markPost(62);
      return r;
    };
  } catch (e) { if (!U.err) U.err = 'genwrap ' + e; }

  hook();
})();
