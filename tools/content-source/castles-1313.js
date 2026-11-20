/* GLX-C113 (v1.2.113): block-by-block replicas of the three official keep
   paintings. Measured from the visible voxel grid (merlon pitch, tower
   widths, arch, tartan, hill profile, lava-vein paths). Hidden backs and
   sides are mirrored from the facade. Official map-edge positions, doors,
   chests, garrisons and the clan gold portal stay in place. */
(function c1313castles() {
  const U = window.__c1313 = {err: null, ms: 0, ran: 0, gold: null, counts: {}};
  const SLATE = 152, BARS = 163, FEN = 162, PINE = 135, NEED = 146, HEATH = 4;
  const MOSS = () => (T.MOSS || 144);
  const GRAV = () => (T.GRAVEL || 202);
  const POD = () => (T.PODZOL || 142);
  const FERN = () => (T.FERN || 238);
  const HR = () => (T.HELLROCK || 206);
  const MG = () => (T.MAGMA || 208);
  const LV = () => (T.LAVA || 52);
  const BLK = () => (T.BLACKSTONE || 248);
  const OB = () => (T.OBSIDIAN || 189);
  const DS = () => (T.DSBRICK || T.DEEPSLATE || 228);
  const DT = () => (T.DSTILE || 229);
  const HB = () => (T.HELLBRICK || 210);
  const SSAND = () => (T.SOULSAND || 207);
  const WST = () => (T.WSTONE || 156);
  const GP = 227, OAKST = 164, STST = 167;
  const FV = [[0, -1], [-1, 0], [0, 1], [1, 0]];
  const SEA0 = () => (typeof SEA === 'number' ? SEA : 41);

  /* Pixel-matched hunting tartan at block resolution (5 wide × 12 tall),
     sampled from the right-curtain banner in the Clansman painting.
     R red, G dark green, Y gold line, K black intersection, F fringe gap. */
  const TARTAN = [
    'RGRGR',
    'RGRGR',
    'GYKYG',
    'RGRGR',
    'RKRKR',
    'GYKYG',
    'RGRGR',
    'RKRKR',
    'GYKYG',
    'RGRGR',
    'RKRKR',
    'RFRFR'
  ];

  function installSolidWool(id, key, hex, nice) {
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
        if (typeof FACES !== 'undefined') FACES[id] = key;
        if (typeof BLOCK_MATS !== 'undefined') {
          if (typeof mat === 'function') BLOCK_MATS[id] = mat(tex);
          else BLOCK_MATS[id] = new THREE.MeshLambertMaterial({map: tex});
        }
      }
      if (typeof NAMES !== 'undefined') NAMES[id] = nice;
      try { if (typeof PLACEABLE !== 'undefined' && PLACEABLE.add) PLACEABLE.add(id); } catch (_) {}
    } catch (_) {}
  }

  function ensureWool() {
    try {
      if (typeof bootWool === 'function' && (!T.WOOLRED || !T.WOOLGREEN)) bootWool();
    } catch (_) {}
    if (!T.WOOLRED) T.WOOLRED = 256;
    if (!T.WOOLGREEN) T.WOOLGREEN = 257;
    // The late wool boot may have reserved the ids without a texture; paint
    // a solid swatch so the tartan does not render as untextured white.
    const missingR = !(typeof FACES !== 'undefined' && FACES[T.WOOLRED]);
    const missingG = !(typeof FACES !== 'undefined' && FACES[T.WOOLGREEN]);
    if (missingR) installSolidWool(T.WOOLRED, 'wool_red_c1313', '#c62828', 'Red wool');
    if (missingG) installSolidWool(T.WOOLGREEN, 'wool_green_c1313', '#2e7d32', 'Green wool');
  }

  function wool() {
    ensureWool();
    return {
      R: T.WOOLRED || T.WOOLORANGE || T.BRICK || T.WOOL,
      G: T.WOOLGREEN || T.WOOLPURPLE || T.WOOLBLUE || T.WOOL,
      Y: T.WOOLYELLOW || T.WOOL,
      K: BLK() || T.OBSIDIAN || T.WOOLPURPLE || T.WOOL,
      F: 0
    };
  }

  function seaY(K, ly) {
    return ly - (K.gy - SEA0());
  }

  function hook() {
    const C = window.__c151;
    if (!C || !C.ctx || !C.B) return false;
    if (C.__c1313) return true;
    C.__c1313 = 1;
    const oldElig = C.elig;
    C.elig = function () {
      try {
        if (current && current.mode !== 'creative' && current.g25 == null) current.g25 = true;
        if (window.__c102 && !__c102.done && typeof g9castles !== 'undefined' && g9castles && g9castles.length) {
          __c102.done = g9castles.map(function (q) {
            const g = (typeof solidTop === 'function' ? solidTop(q[1], q[2]) : SEA0());
            return {k: q[0], cx: q[1], cz: q[2], gy: g + 1};
          });
        }
      } catch (_) {}
      return oldElig ? oldElig.apply(this, arguments) : true;
    };
    const oldWork = C.work;
    C.work = function (only) {
      const cs = C.clearSite;
      C.clearSite = function (c, gy, R, top) {
        return cs.call(this, c, Math.min(gy, SEA0()), Math.max(R || 0, 44), top || 80);
      };
      const hadPS = (typeof placedSet !== 'undefined' && placedSet);
      const savedPS = hadPS ? placedSet : null;
      try {
        if (hadPS && typeof g9castles !== 'undefined' && g9castles) {
          placedSet = new Set(savedPS);
          const list = only ? g9castles.filter(function (c) { return c[0] === only; }) : g9castles;
          for (let i = 0; i < list.length; i++) {
            const c = list[i], R = 46;
            for (let x = c[1] - R; x <= c[1] + R; x++) for (let z = c[2] - R; z <= c[2] + R; z++) {
              if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1) continue;
              if (Math.hypot(x - c[1], z - c[2]) > R) continue;
              for (let y = 1; y < H - 1; y++) placedSet.delete(idx(x, y, z));
            }
          }
        }
        C.elig();
        const r = oldWork.apply(this, arguments);
        U.ran++;
        U.ms = C.ms;
        return r;
      } catch (e) { U.err = String(e && e.stack || e); throw e; }
      finally {
        C.clearSite = cs;
        if (savedPS) placedSet = savedPS;
      }
    };
    C.B.human = buildClansman;
    C.B.mossy = function (K) { return buildRuin(K, 'mossy'); };
    C.B.black = function (K) { return buildRuin(K, 'black'); };
    return true;
  }

  /* ---------------- primitives (local +z = gate) ---------------- */

  function stone(K, x, y, z, kind) {
    const v = K.h(x, y, z);
    if (kind === 'black') {
      if (v < 0.16) return OB();
      if (v < 0.34) return DS();
      if (v < 0.78) return BLK();
      return HR();
    }
    if (kind === 'mossy') {
      if (v < 0.28) return T.MOSSYBRICK;
      if (v < 0.48) return T.COBBLE;
      if (v < 0.62) return WST();
      if (v < 0.9) return T.STONEBRICK;
      return T.STONE || T.COBBLE;
    }
    if (v < 0.08) return T.MOSSYBRICK;
    if (v < 0.16) return T.COBBLE;
    return T.STONEBRICK;
  }

  function rock(K, x, y, z, kind) {
    const v = K.h(x, y + 40, z);
    if (kind === 'black') {
      if (v < 0.45) return BLK();
      if (v < 0.7) return HR();
      if (v < 0.85) return DS();
      return T.DEEPSLATE || T.STONE || BLK();
    }
    if (v < 0.4) return T.STONE || T.COBBLE;
    if (v < 0.65) return T.COBBLE;
    if (v < 0.82) return T.STONEBRICK;
    return T.MOSSYBRICK;
  }

  function pal(K, kind) {
    return function (x, y, z) { return stone(K, x, y, z, kind); };
  }

  function cyl(K, cx, cz, r, y0, y1, wall, inner) {
    const r2 = r * r, i2 = (r - 1.15) * (r - 1.15);
    const cR = Math.ceil(r);
    for (let a = -cR; a <= cR; a++) for (let q = -cR; q <= cR; q++) {
      const d = a * a + q * q;
      if (d > r2) continue;
      const edge = d >= i2;
      for (let y = y0; y <= y1; y++) {
        if (edge) K.B(cx + a, y, cz + q, typeof wall === 'function' ? wall(cx + a, y, cz + q) : wall);
        else if (inner != null) K.B(cx + a, y, cz + q, typeof inner === 'function' ? inner(cx + a, y, cz + q) : inner);
      }
    }
  }

  function coneRoof(K, cx, cz, r, y0, n, id) {
    const b = typeof id === 'function' ? id : function () { return id; };
    for (let L = 0; L < n; L++) {
      const rr = r - L * (r - 0.35) / Math.max(1, n - 1);
      K.disc(cx, cz, Math.max(0.45, rr), y0 + L, b);
    }
    K.B(cx, y0 + n, cz, typeof id === 'function' ? id(cx, y0 + n, cz) : id);
    return y0 + n;
  }

  function pyramid(K, cx, cz, half, y0, n, id) {
    const b = typeof id === 'function' ? id : function () { return id; };
    for (let L = 0; L < n; L++) {
      const s = Math.max(0, half - (L >> 1));
      K.box(cx - s, y0 + L, cz - s, cx + s, y0 + L, cz + s, b);
    }
    return y0 + n - 1;
  }

  function merlonRect(K, x0, z0, x1, z1, y, wall, opt) {
    opt = opt || {};
    const pitch = opt.pitch || 2, ht = opt.ht || 2, h = opt.h || K.h;
    const broken = opt.broken || 0;
    const cells = [];
    for (let x = x0; x <= x1; x++) { cells.push([x, z0]); if (z1 !== z0) cells.push([x, z1]); }
    for (let z = z0 + 1; z < z1; z++) { cells.push([x0, z]); cells.push([x1, z]); }
    for (let i = 0; i < cells.length; i++) {
      const x = cells[i][0], z = cells[i][1];
      if ((x + z) % pitch) continue;
      if (broken && h(x, y + 3, z) < broken) continue;
      for (let k = 0; k < ht; k++) K.B(x, y + k, z, typeof wall === 'function' ? wall(x, y + k, z) : wall);
    }
  }

  function merlonRing(K, cx, cz, r, y, wall, opt) {
    opt = opt || {};
    const pitch = opt.pitch || 2, ht = opt.ht || 2, h = opt.h || K.h;
    const broken = opt.broken || 0;
    const cR = Math.ceil(r);
    const r2 = r * r, i2 = (r - 1.15) * (r - 1.15);
    let i = 0;
    for (let a = -cR; a <= cR; a++) for (let q = -cR; q <= cR; q++) {
      const d = a * a + q * q;
      if (d > r2 || d < i2) continue;
      i++;
      if (i % pitch) continue;
      if (broken && h(cx + a, y + 3, cz + q) < broken) continue;
      for (let k = 0; k < ht; k++) K.B(cx + a, y + k, cz + q, typeof wall === 'function' ? wall(cx + a, y + k, cz + q) : wall);
    }
  }

  function slit(K, x, y, z, h, w, dz, dx) {
    h = h || 2; w = w || 1; dz = dz || 0; dx = dx || 0;
    for (let a = 0; a < w; a++) for (let b = 0; b < h; b++) K.B(x + a * (dx || (w > 1 ? 1 : 0)), y + b, z + a * dz, T.AIR);
  }

  function banner(K, x0, yTop, z, face, map) {
    const Wl = wool();
    const fv = FV[face & 3];
    const sv = [[-1, 0], [0, -1], [1, 0], [0, 1]][face & 3];
    map = map || TARTAN;
    const Hm = map.length, Wm = map[0].length;
    // oak rod
    for (let c = 0; c < Wm; c++) {
      const hx = x0 + sv[0] * c + fv[0], hz = z + sv[1] * c + fv[1];
      K.log(hx, yTop + 1, hz, T.LOG, 1);
    }
    for (let r = 0; r < Hm; r++) {
      const row = map[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === 'F' && (c & 1)) continue;
        const id = Wl[ch];
        if (!id) continue;
        const hx = x0 + sv[0] * c + fv[0], hz = z + sv[1] * c + fv[1];
        K.B(hx, yTop - r, hz, id);
      }
    }
  }

  function gateArch(K, x0, x1, y0, y1, zFace, depth, wall) {
    for (let d = 0; d < depth; d++) {
      const z = zFace - d;
      for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
          const inset = (y >= y1 ? 2 : y === y1 - 1 ? 1 : 0);
          if (x <= x0 + inset || x >= x1 - inset) {
            if (d === 0 || d === depth - 1) K.B(x, y, z, typeof wall === 'function' ? wall(x, y, z) : wall);
          } else {
            K.B(x, y, z, T.AIR);
          }
        }
        // lintel
        K.B(x, y1 + 1, z, typeof wall === 'function' ? wall(x, y1 + 1, z) : wall);
      }
    }
  }

  function portcullis(K, x0, x1, y0, y1, z) {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      if (((x + y) & 1) === 0) K.B(x, y, z, BARS);
    }
  }

  function ladder(K, x, y0, y1, z) {
    for (let y = y0; y <= y1; y++) {
      K.B(x, y, z, ((y - y0) & 1) === 0 ? T.PLANKS : (T.FENCE || FEN));
    }
  }

  function pine(K, x, z, y0, ht) {
    ht = ht || 8;
    for (let y = 0; y < ht; y++) K.B(x, y0 + y, z, PINE);
    for (let y = 3; y <= ht; y++) {
      const rr = y === ht ? 0.6 : 2.3 - (y - 3) * 1.5 / Math.max(1, ht - 3);
      K.disc(x, z, rr, y0 + y, function (a, yy, b) { return K.G(a, yy, b) === T.AIR ? NEED : K.G(a, yy, b); });
    }
    K.B(x, y0 + ht + 1, z, NEED);
  }

  function deadTree(K, x, z, y0, h) {
    const rot = T.ROTLOG || T.LOG;
    const ht = 7 + (h(x, 3, z) * 3 | 0);
    for (let y = 0; y < ht; y++) K.log(x, y0 + y, z, rot, 2);
    K.log(x + 1, y0 + ht - 2, z, rot, 1);
    K.log(x + 2, y0 + ht - 2, z + (h(x, 4, z) < 0.5 ? 0 : 1), rot, 1);
    K.log(x, y0 + ht - 3, z - 1, rot, 1);
    K.log(x - 1, y0 + ht - 1, z + 1, rot, 1);
    if (h(x, 5, z) < 0.5) K.log(x - 1, y0 + ht - 3, z, rot, 1);
    K.B(x, y0 + ht, z, rot);
  }

  function skelProp(K, x, y, z) {
    const head = WST() || T.SANDSTONE || T.WOOL || T.STONEBRICK;
    const bone = T.SANDSTONE || WST() || T.COBBLE;
    K.B(x, y, z, bone);
    K.B(x, y + 1, z, bone);
    K.B(x, y + 2, z, head);
    K.B(x - 1, y + 1, z, bone);
    K.B(x + 1, y + 1, z, bone);
  }

  function vineStreak(K, x, z, y0, y1, face) {
    const fv = FV[face & 3];
    for (let y = y0; y <= y1; y++) {
      if (K.h(x, y, z) < 0.72) K.B(x + fv[0], y, z + fv[1], MOSS());
    }
  }


  function clearDecor(K) {
    // Wipe worldgen trees and the stock isle palisade in the footprint and
    // the gate approach, so they cannot stand in front of the facade shot.
    // Intentional pines on the loch terraces (local x <= -14) are kept.
    const TREE = new Set([T.LOG, T.PINELOG, T.BIRCHLOG, T.ALDERLOG, T.ROWANLOG, T.YEWLOG, T.ROTLOG, T.LEAVES, T.BLOSSOM, T.NEED, PINE, NEED, T.LPOST, 160].filter(Boolean));
    const y0 = seaY(K, 0), y1 = seaY(K, 55);
    for (let x = -50; x <= 50; x++) for (let z = -50; z <= 50; z++) {
      const r = Math.hypot(x, z);
      if (r > 50) continue;
      const approach = z > 6 && Math.abs(x) < 18 && r < 48;
      const ring = r > 22;
      if (!approach && !ring) continue;
      if (x <= -14 && z < 16 && !approach) continue;
      for (let y = y0; y <= y1; y++) {
        const b = K.G(x, y, z);
        if (TREE.has(b)) K.B(x, y, z, T.AIR);
      }
    }
  }

  /* ---------------- Clansman ---------------- */

  function buildClansman(K) {
    wool();
    const {B, box, h} = K;
    const S = pal(K, 'human');
    const F = seaY(K, 8);
    const slate = function () { return SLATE; };

    // Terraced hillside + loch on local -x / +z (left of the gate in the painting).
    clearDecor(K);
    terraces(K, F, S);

    // Compact keep core the turrets sprout from (hollow, 3 floors).
    const X0 = -8, X1 = 8, Z0 = -5, Z1 = 5;
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
      const e = x === X0 || x === X1 || z === Z0 || z === Z1;
      for (let y = F; y <= F + 16; y++) {
        if (e || y === F || y === F + 8 || y === F + 16) B(x, y, z, S(x, y, z));
        else B(x, y, z, T.AIR);
      }
    }
    // floors already solid; punch a stair well
    for (let k = 0; k < 8; k++) {
      B(-6, F + k, -3, T.AIR);
      K.stair(-6, F + k, -3, 0, STST);
      B(-6, F + 8 + k, -3, T.AIR);
      K.stair(-6, F + 8 + k, -3, 0, STST);
    }

    // Gatehouse: 15 wide, 5 deep, merlon deck 16 above the gate floor.
    // Front face at z=9. Arch 5 wide × 7 high, stepped jambs, deep vault.
    box(-7, F, 5, 7, F + 15, 9, function (x, y, z) {
      const e = x === -7 || x === 7 || z === 5 || z === 9 || y === F || y === F + 15;
      return e ? S(x, y, z) : T.AIR;
    });
    gateArch(K, -2, 2, F, F + 6, 9, 4, S);
    portcullis(K, -2, 2, F + 1, F + 6, 8);
    K.door(-1, F, 7, 2);
    K.door(0, F, 7, 2);
    merlonRect(K, -7, 5, 7, 9, F + 16, S, {pitch: 2, ht: 2});
    // arrow slits on the gatehouse face, above the arch and on the piers
    slit(K, -5, F + 10, 9, 2, 1);
    slit(K, 5, F + 10, 9, 2, 1);
    slit(K, 0, F + 12, 9, 2, 1);
    // mirrored slits on the back of the gatehouse
    slit(K, -5, F + 10, 5, 2, 1);
    slit(K, 5, F + 10, 5, 2, 1);

    // Two large tartan banners flanking the arch, third on the right curtain.
    banner(K, -7, F + 14, 9, 2);
    banner(K, 3, F + 14, 9, 2);

    // Forward bartizan over the gate (small round, conical roof).
    cyl(K, 0, 6, 2, F + 15, F + 22, S, T.AIR);
    coneRoof(K, 0, 6, 2.4, F + 23, 8, slate);
    slit(K, 0, F + 19, 8, 2, 1);

    // Left round conical turret.
    cyl(K, -7, 2, 3, F, F + 20, S, T.AIR);
    coneRoof(K, -7, 2, 3.4, F + 21, 10, slate);
    slit(K, -7, F + 8, 5, 2, 1);
    slit(K, -7, F + 14, 5, 2, 1);
    slit(K, -10, F + 11, 2, 2, 1);
    slit(K, -7, F + 8, -1, 2, 1); // back

    // Mid-left taller square crow-stepped pyramidal roof.
    box(-6, F, -5, 0, F + 24, 1, function (x, y, z) {
      const e = x === -6 || x === 0 || z === -5 || z === 1 || y === F || y === F + 24;
      return e ? S(x, y, z) : T.AIR;
    });
    pyramid(K, -3, -2, 3, F + 25, 10, slate);
    slit(K, -3, F + 12, 1, 2, 1);
    slit(K, -3, F + 18, 1, 2, 1);
    slit(K, -3, F + 12, -5, 2, 1);

    // Mid-right taller square crow-step (slightly higher, uses the sea-to-sky budget).
    box(1, F, -6, 7, F + 26, 0, function (x, y, z) {
      const e = x === 1 || x === 7 || z === -6 || z === 0 || y === F || y === F + 26;
      return e ? S(x, y, z) : T.AIR;
    });
    pyramid(K, 4, -3, 3, F + 27, 10, slate);
    slit(K, 4, F + 14, 0, 2, 1);
    slit(K, 4, F + 20, 0, 2, 1);
    slit(K, 4, F + 14, -6, 2, 1);

    // Right-back round conical turret.
    cyl(K, 7, 1, 3, F, F + 22, S, T.AIR);
    coneRoof(K, 7, 1, 3.4, F + 23, 11, slate);
    slit(K, 7, F + 10, 4, 2, 1);
    slit(K, 7, F + 16, 4, 2, 1);
    slit(K, 10, F + 13, 1, 2, 1);
    slit(K, 7, F + 10, -2, 2, 1);

    // Right curtain wall + merloned round corner tower (no cone), third banner.
    box(8, F, 6, 11, F + 15, 9, function (x, y, z) {
      const e = z === 6 || z === 9 || y === F || y === F + 15 || x === 11;
      return e ? S(x, y, z) : T.AIR;
    });
    merlonRect(K, 8, 6, 11, 9, F + 16, S, {pitch: 2, ht: 2});
    banner(K, 8, F + 14, 9, 2);
    cyl(K, 13, 6, 4, F - 1, F + 17, S, T.AIR);
    merlonRing(K, 13, 6, 4, F + 18, S, {pitch: 2, ht: 2});
    slit(K, 13, F + 8, 10, 2, 1);
    slit(K, 13, F + 13, 10, 2, 1);
    slit(K, 17, F + 10, 6, 2, 1);
    slit(K, 13, F + 8, 2, 2, 1);

    // Interior: chests, lamps, a table. Loot stays kind-specific via the kit.
    K.chest(-4, F + 1, 0, 2, [[IT.BREAD, 4], [IT.IRONINGOT, 3], [T.TORCH, 8]]);
    K.chest(3, F + 9, -1, 1, [[IT.GOLDINGOT, 2], [IT.ARROW, 12], [IT.BOW, 1]]);
    K.lamp(-2, F + 7, 2, -1, {});
    K.lamp(2, F + 15, 0, -1, {});
    try { K.bed(-3, F + 9, 2, 2); } catch (_) {}

    clearDecor(K);
    placeGold(K, 14, -16);
    U.counts.human = {F: F, tip: F + 27 + 10};
    return {kind: 'human', F: F};
  }

  function terraces(K, F, S) {
    const {B, box, h} = K;
    // Solid plinth under the keep, stone-edged, sits at gate-floor level.
    for (let x = -12; x <= 18; x++) for (let z = -10; z <= 12; z++) {
      const r = Math.hypot(x * 0.85, z * 0.9);
      if (r > 20 && x > 4) continue;
      for (let y = seaY(K, 1); y <= F; y++) {
        const edge = y === F || r > 18;
        B(x, y, z, edge ? S(x, y, z) : (h(x, y, z) < 0.7 ? T.STONE : T.COBBLE));
      }
    }
    // Left-hand terraces dropping toward the loch (local -x), 2-block rises,
    // irregular retaining walls, heather, stone steps.
    const bands = [
      {x1: -12, x0: -16, top: F - 2},
      {x1: -16, x0: -20, top: F - 4},
      {x1: -20, x0: -24, top: F - 6},
      {x1: -24, x0: -28, top: F - 8}
    ];
    for (let i = 0; i < bands.length; i++) {
      const b = bands[i];
      for (let x = b.x0; x <= b.x1; x++) for (let z = -8; z <= 18; z++) {
        // leave a loch bite on the front-left (water visible beside the stairs)
        if (x < -18 && z > 10) continue;
        if (x < -24 && z > 4) continue;
        const jag = (h(x, 2, z) * 2 | 0) - 1;
        const top = b.top + jag;
        for (let y = seaY(K, 1); y <= top; y++) {
          const edge = (x === b.x0 || x === b.x1 || y === top);
          B(x, y, z, edge ? S(x, y, z) : T.STONE);
        }
        if (h(x, 6, z) < 0.16) B(x, top + 1, z, HEATH);
        else if (h(x, 7, z) < 0.1) B(x, top + 1, z, T.THISTLE || T.TALLGRASS);
      }
    }
    // Forecourt stairs toward the camera (+z), slightly left, irregular 3-wide.
    for (let s = 0; s <= 10; s++) {
      const y = F - s;
      const z0 = 12 + s;
      const xo = -Math.floor(s / 4);
      for (let x = -2 + xo; x <= 2 + xo; x++) {
        for (let z = z0; z <= z0 + 1; z++) {
          B(x, y, z, S(x, y, z));
          if ((x + z + s) & 1) K.stair(x, y, z, 2, STST);
        }
        // fill under the step so it is not floating
        for (let yb = seaY(K, 1); yb < y; yb++) B(x, yb, z0, T.STONE);
      }
    }
    // Shoreline rocks where terrace meets the loch, water left open beyond.
    for (let x = -30; x <= -14; x++) for (let z = 8; z <= 24; z++) {
      if (x > -20 && z < 14) continue;
      if (h(x, 1, z) < 0.35) {
        const yy = seaY(K, 1);
        B(x, yy, z, h(x, 2, z) < 0.5 ? T.COBBLE : GRAV());
      }
    }
    // Heather clumps on the main terrace and path edge (explicit, from the painting).
    const heath = [[-10, 8], [-11, 10], [-9, 12], [-13, 6], [-12, 14], [-8, 11],
      [-15, 4], [-17, 8], [-14, 16], [-6, 13], [10, 12], [14, 10], [8, 14],
      [-18, 0], [-16, -4], [15, 8]];
    for (let i = 0; i < heath.length; i++) {
      const x = heath[i][0], z = heath[i][1];
      let y = F;
      for (let k = F; k > seaY(K, 0); k--) { if (K.G(x, k, z) && K.G(x, k, z) !== T.AIR) { y = k + 1; break; } }
      B(x, y, z, HEATH);
    }
    // Pines on the left terraces (positions taken from the painting).
    const pines = [[-16, 8, 8], [-20, 2, 9], [-14, 16, 7], [-22, 12, 8], [-18, -2, 6]];
    for (let i = 0; i < pines.length; i++) {
      const p = pines[i];
      let y0 = F - 4;
      for (let k = F; k > seaY(K, 0); k--) { if (K.G(p[0], k, p[1]) && K.G(p[0], k, p[1]) !== T.AIR) { y0 = k + 1; break; } }
      pine(K, p[0], p[1], y0, p[2]);
    }
  }

  function placeGold(K, lx, lz) {
    try {
      const E = window.__egypt1269;
      if (!E || typeof E.placeReturn !== 'function') return;
      const [x, , z] = K.wp(lx, 0, lz);
      if (x < 4 || z < 4 || x >= W - 4 || z >= D - 4) return;
      const g = (typeof solidTop === 'function' ? solidTop(x, z) : K.gy);
      for (let a = -1; a <= 2; a++) for (let b = -1; b <= 1; b++) {
        const xx = x + a, zz = z + b;
        if (xx < 2 || zz < 2 || xx >= W - 2 || zz >= D - 2) continue;
        const t = (typeof solidTop === 'function' ? solidTop(xx, zz) : g);
        for (let y = Math.min(t, g) + 1; y <= g + 6 && y < H - 1; y++) world[idx(xx, y, zz)] = T.AIR;
      }
      E.placeReturn(x, g, z, 0);
      U.gold = [x, g, z];
      try { if (typeof markDirty === 'function') { markDirty(x, z); markDirty(x + 1, z); } } catch (_) {}
    } catch (e) { if (!U.err) U.err = 'gold ' + e; }
  }

  /* ---------------- Skeleton / Black Skeleton (shared silhouette) ---------------- */

  function hillH(K, x, z) {
    // Steep rocky crag, peak under the central tower, filling the lower frame.
    // Measured: hill ~24-26 at the keep, dropping to the sea by r≈32, steeper
    // on the camera face (+z).
    const dx = x - 2, dz = z + 3;
    const r = Math.hypot(dx * 0.8, dz * 0.7);
    let h = 25 * Math.max(0, 1 - r / 30);
    if (z > 2) h *= Math.max(0, 1 - (z - 2) / 20);
    if (z > 14) h *= Math.max(0, 1 - (z - 14) / 14);
    // left shoulder under the ruined turret, right under the gable
    const left = Math.max(0, 16 - Math.hypot(x + 11, z - 4) * 1.1);
    const right = Math.max(0, 15 - Math.hypot(x - 11, z - 2) * 1.15);
    h = Math.max(h, left, right);
    h += (K.h(x, 1, z) * 3 - 1.2);
    if (h < 0.5) return 0;
    return h;
  }

  function buildRuin(K, kind) {
    const {B, box, h} = K;
    const black = kind === 'black';
    const S = pal(K, black ? 'black' : 'mossy');
    const Rk = function (x, y, z) { return rock(K, x, y, z, black ? 'black' : 'mossy'); };
    const Fhill = 24;
    const sea = seaY(K, 0);
    clearDecor(K);

    // Crag: fill from the sea up, leave a little water around the foot.
    for (let x = -32; x <= 28; x++) for (let z = -24; z <= 28; z++) {
      const th = hillH(K, x, z);
      if (th <= 0) continue;
      const top = seaY(K, th);
      for (let y = sea; y <= top; y++) {
        const isTop = y >= top - 1;
        let id = Rk(x, y, z);
        if (isTop) {
          const v = h(x, 9, z);
          if (black) id = v < 0.35 ? BLK() : v < 0.55 ? HR() : v < 0.7 ? SSAND() : GRAV();
          else id = v < 0.4 ? MOSS() : v < 0.6 ? T.MOSSYBRICK : v < 0.8 ? T.COBBLE : T.STONE;
        }
        B(x, y, z, id);
      }
    }

    // Courtyard shelf behind the arch, in front of the central tower.
    const courtY = seaY(K, 18);
    for (let x = -8; x <= 8; x++) for (let z = -2; z <= 8; z++) {
      if (K.G(x, courtY, z) === T.AIR) {
        for (let y = sea; y <= courtY; y++) B(x, y, z, Rk(x, y, z));
      }
    }

    // Large dark arch carved into the LEFT hillside (cobwebs in the vault).
    const aX0 = -9, aX1 = -3, aY0 = courtY - 8, aY1 = courtY + 1, aZ = 9;
    gateArch(K, aX0, aX1, aY0, aY1, aZ, 5, S);
    // deepen / darken the throat
    for (let x = aX0 + 1; x <= aX1 - 1; x++) for (let z = aZ - 5; z <= aZ; z++) {
      for (let y = aY0; y <= aY1; y++) B(x, y, z, T.AIR);
    }
    if (!black) {
      B(-6, aY1 - 1, aZ - 1, T.COBWEB);
      B(-5, aY1, aZ - 2, T.COBWEB);
      B(-7, aY0 + 3, aZ - 1, T.COBWEB);
      B(-4, aY0 + 5, aZ, T.COBWEB);
      B(-8, aY1 - 2, aZ - 3, T.COBWEB);
      vineStreak(K, -9, 9, aY0 + 2, aY1 + 2, 2);
      vineStreak(K, -3, 9, aY0 + 1, aY1 + 3, 2);
    } else {
      B(-6, aY0, aZ - 1, MG());
      B(-5, aY0, aZ - 2, LV());
    }

    // Left ruined turret (broken merlons, moss, jagged crown).
    const LT = seaY(K, 18);
    const LTtop = LT + 11;
    box(-14, LT - 2, 1, -8, LTtop, 7, function (x, y, z) {
      const e = x === -14 || x === -8 || z === 1 || z === 7;
      const jag = e ? (h(x, y, z) * 3 | 0) : 0;
      if (y > LTtop - jag) return T.AIR;
      if (!e && y > LT) return T.AIR;
      return S(x, y, z);
    });
    merlonRect(K, -14, 1, -8, 7, LTtop + 1, S, {pitch: 2, ht: 2, broken: 0.45});
    slit(K, -11, LT + 4, 7, 2, 1);
    slit(K, -11, LT + 8, 7, 2, 1);
    slit(K, -11, LT + 4, 1, 2, 1);
    if (!black) {
      B(-12, LTtop, 7, T.COBWEB);
      B(-9, LTtop - 1, 6, T.COBWEB);
      vineStreak(K, -11, 7, LT + 2, LTtop, 2);
    }

    // Mid crumbling merloned wall between left turret and central keep.
    const midY = seaY(K, 19);
    for (let x = -8; x <= 0; x++) for (let z = 4; z <= 7; z++) {
      const top = midY + 6 - (h(x, 20, z) * 4 | 0) - (x > -2 ? 2 : 0);
      for (let y = midY; y <= top; y++) {
        if (z === 4 || z === 7 || y === midY) B(x, y, z, S(x, y, z));
      }
      if (((x + z) & 1) === 0 && h(x, 21, z) > 0.4) B(x, top + 1, z, S(x, top + 1, z));
      if (!black && h(x, 22, z) < 0.3) B(x, top, z, T.COBWEB);
    }

    // Tall central square tower (~2× the side towers), jagged crown, holes, moss, a dead branch.
    const C0x = 0, C1x = 7, C0z = -8, C1z = -1;
    const baseC = seaY(K, 22);
    const TOP = baseC + 22;
    for (let x = C0x; x <= C1x; x++) for (let z = C0z; z <= C1z; z++) {
      const e = x === C0x || x === C1x || z === C0z || z === C1z;
      const jag = (h(x, 70, z) * 3 | 0) + (x > 5 && z < -5 ? 4 : 0);
      const tt = TOP - jag;
      for (let y = baseC; y <= tt; y++) {
        if (e || (x >= 2 && x <= 5 && z >= -6 && z <= -3 && y < tt - 1 && (y === baseC))) B(x, y, z, S(x, y, z));
        else if (e) B(x, y, z, S(x, y, z));
        else B(x, y, z, T.AIR);
      }
      if (e && ((x + z) & 1) === 0 && jag < 2) B(x, tt + 1, z, S(x, tt + 1, z));
      if (!black && e && h(x, 80, z) < 0.4) B(x, tt, z, T.COBWEB);
    }
    // face holes (and mirrored on the back)
    box(2, baseC + 8, C1z, 4, baseC + 10, C1z, T.AIR);
    box(5, baseC + 15, C1z, 6, baseC + 17, C1z, T.AIR);
    box(2, baseC + 8, C0z, 4, baseC + 10, C0z, T.AIR);
    box(5, baseC + 15, C0z, 6, baseC + 17, C0z, T.AIR);
    if (black) {
      B(3, baseC + 8, C1z, MG());
      B(5, baseC + 15, C1z, MG());
    }
    if (!black) {
      vineStreak(K, 2, C1z, baseC + 4, TOP - 2, 2);
      vineStreak(K, 6, C1z, baseC + 6, TOP - 4, 2);
      B(3, baseC + 12, C1z, T.COBWEB);
    }
    // dead branch sticking out of the +z face
    const rot = T.ROTLOG || T.LOG;
    K.log(6, baseC + 14, 0, rot, 1);
    K.log(6, baseC + 14, 1, rot, 1);
    K.log(7, baseC + 14, 1, rot, 1);
    // interior stair
    for (let k = 0; k < 20; k++) {
      const sx = 2 + (k % 3), sz = -6 + ((k / 3 | 0) % 2);
      K.stair(sx, baseC + k, sz, 2, 165);
    }
    K.lamp(3, TOP - 2, -4, -1, black ? {soul: 1} : {});

    // Right ruined gabled turret, two stacked dark windows, ladder on the inner face.
    const Rbase = seaY(K, 16);
    const Rtop = Rbase + 12;
    box(9, Rbase - 1, -1, 15, Rtop, 5, function (x, y, z) {
      const e = x === 9 || x === 15 || z === -1 || z === 5;
      const jag = e ? (h(x, y, z) * 2 | 0) : 0;
      if (y > Rtop - jag) return T.AIR;
      if (!e && y > Rbase) return T.AIR;
      return S(x, y, z);
    });
    // broken gable on the +z face (and mirrored -z)
    for (let L = 0; L < 5; L++) {
      const s = 3 - L;
      if (s < 0) break;
      for (let x = 12 - s; x <= 12 + s; x++) {
        if (h(x, 40, L) > 0.25) {
          B(x, Rtop + 1 + L, 5, S(x, Rtop + 1 + L, 5));
          B(x, Rtop + 1 + L, -1, S(x, Rtop + 1 + L, -1));
        }
      }
    }
    slit(K, 12, Rbase + 4, 5, 2, 1);
    slit(K, 12, Rbase + 8, 5, 2, 1);
    slit(K, 12, Rbase + 4, -1, 2, 1);
    slit(K, 12, Rbase + 8, -1, 2, 1);
    if (black) { B(12, Rbase + 4, 5, MG()); B(12, Rbase + 8, 5, MG()); }
    // wooden ladder on the inner (-x) face
    ladder(K, 8, Rbase + 1, Rtop - 1, 2);
    if (!black) {
      B(10, Rtop, 5, T.COBWEB);
      vineStreak(K, 14, 5, Rbase + 2, Rtop, 2);
    }

    // Skeleton props on the battlements (the painting shows Minecraft-style
    // skeletons standing on the walls — voxel stand-ins so they are visible
    // in stills without touching garrison caps).
    skelProp(K, -5, midY + 8, 7);
    skelProp(K, -10, LTtop + 2, 4);
    skelProp(K, 3, TOP + 1, -1);

    // Dead bare trees either side of the crag.
    deadTree(K, -20, 12, seaY(K, 4), h);
    deadTree(K, 18, 10, seaY(K, 5), h);
    deadTree(K, -16, -8, seaY(K, 8), h);

    // Dress the court: ferns / cobwebs or magma seeps.
    for (let x = -9; x <= 9; x++) for (let z = -2; z <= 9; z++) {
      const v = h(x, 20, z);
      if (K.G(x, courtY + 1, z) !== T.AIR) continue;
      if (!black && v < 0.1) B(x, courtY + 1, z, FERN());
      else if (!black && v < 0.2) B(x, courtY + 1, z, T.COBWEB);
      else if (black && v < 0.08) B(x, courtY + 1, z, MG());
    }

    // Crypt under the central keep, kind-specific loot.
    const cry = seaY(K, 8);
    for (let x = 1; x <= 6; x++) for (let z = -7; z <= -3; z++) {
      for (let y = cry - 1; y <= cry + 3; y++) {
        const e = x === 1 || x === 6 || z === -7 || z === -3 || y === cry - 1 || y === cry + 3;
        B(x, y, z, e ? Rk(x, y, z) : T.AIR);
      }
    }
    if (black) K.chest(4, cry, -6, 2, [[IT.FLINTSTEEL, 1], [T.OBSIDIAN, 4], [IT.GOLDINGOT, 3]]);
    else K.chest(4, cry, -6, 2, [[IT.IRONINGOT, 3], [IT.BREAD, 3], [IT.POTATO, 4]]);
    // drop into the crypt from the court
    for (let k = 0; k <= 8; k++) {
      B(3, courtY - k, -2, T.AIR);
      if (k < 8) K.stair(3, courtY - 1 - k, -2, 0, 165);
    }

    if (black) {
      lavaVeins(K);
      // unfinished nether portal, off to the side, not on the facade
      blackPortal(K, courtY);
    }

    U.counts[kind] = {court: courtY, central: TOP, left: LTtop, right: Rtop};
    return {kind: kind, courtY: courtY, TOP: TOP};
  }

  /* Vein polylines traced from the Black Skeleton painting: thick bright
     lava running down the tower faces and the hill, pooling at the base. */
  function lavaVeins(K) {
    const paths = [
      // central +z face, left streak from merlons down onto the hill then the foot
      [[1, 44, -1], [1, 36, -1], [0, 28, 0], [0, 22, 2], [-1, 16, 6], [-2, 10, 10], [-2, 4, 14], [-1, 1, 18]],
      // central +z face, right streak
      [[6, 42, -1], [6, 32, -1], [7, 24, 0], [7, 18, 2], [8, 12, 6], [9, 6, 10], [10, 2, 14], [11, 1, 18]],
      // mid front of the keep
      [[3, 38, -1], [3, 30, 0], [3, 22, 1], [2, 14, 5], [2, 8, 10], [3, 3, 16]],
      // left turret front, down the hill left of the arch
      [[-11, 28, 7], [-11, 22, 7], [-12, 16, 8], [-13, 10, 10], [-14, 5, 14], [-15, 2, 18]],
      // right gable front onto the right slope
      [[13, 28, 5], [14, 22, 5], [15, 16, 6], [16, 10, 8], [17, 5, 12], [18, 2, 16]],
      // hill seep left of the arch toward the pool
      [[-6, 16, 9], [-5, 10, 12], [-4, 5, 16], [-3, 2, 20], [-1, 1, 22]],
      // hill seep under the mid wall
      [[-2, 18, 7], [-1, 12, 10], [0, 6, 14], [1, 2, 18], [2, 1, 22]]
    ];
    for (let p = 0; p < paths.length; p++) rasterVein(K, paths[p]);
    // pool at the foot of the crag (front, toward the camera)
    const sea = seaY(K, 1);
    for (let x = -6; x <= 8; x++) for (let z = 16; z <= 24; z++) {
      const d = Math.hypot(x - 1, z - 20);
      if (d > 6) continue;
      Bcap(K, x, sea, z, d < 3.5 ? LV() : MG());
      if (d < 2.2) Bcap(K, x, sea + 1, z, LV());
    }
  }

  function Bcap(K, x, y, z, id) {
    // world y must stay in bounds; seaY already returns a K-local y
    K.B(x, y, z, id);
  }

  function rasterVein(K, pts) {
    const sea = seaY(K, 0);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const ay = seaY(K, a[1]), by = seaY(K, b[1]);
      const n = Math.max(1, Math.abs(b[0] - a[0]), Math.abs(by - ay), Math.abs(b[2] - a[2])) * 2;
      for (let t = 0; t <= n; t++) {
        const u = t / n;
        const x = Math.round(a[0] + (b[0] - a[0]) * u);
        const y = Math.round(ay + (by - ay) * u);
        const z = Math.round(a[2] + (b[2] - a[2]) * u);
        K.B(x, y, z, MG());
        K.B(x + 1, y, z, (K.h(x, y, z) < 0.5 ? LV() : MG()));
        if (K.h(x, y + 3, z) < 0.4) K.B(x, y, z + 1, MG());
        // a dim ember edge so the vein reads thick
        if (K.h(x, y + 5, z) < 0.3) K.B(x - 1, y, z, HR());
      }
    }
  }

  function blackPortal(K, courtY) {
    const x = -16, z = -10, y = courtY;
    const ob = OB();
    for (let a = 0; a < 5; a++) {
      K.B(x + a, y, z, ob);
      K.B(x + a, y + 6, z, a === 1 || a === 3 ? T.AIR : ob); // broken lintel
    }
    for (let b = 1; b <= 5; b++) {
      K.B(x, y + b, z, ob);
      if (b < 5) K.B(x + 4, y + b, z, ob);
    }
  }

  /* Masonry-only touch-up after later generate wraps. Recolour grey stone
     inside the black keep's footprint; never refill the hill or retrace veins. */
  function touchUp() {
    try {
      if (typeof g9castles === 'undefined' || !g9castles) return;
      const black = g9castles.find(function (c) { return c[0] === 'black'; });
      if (!black) return;
      const cx = black[1], cz = black[2], R = 36;
      const grey = new Set([T.STONEBRICK, T.MOSSYBRICK, T.COBBLE, T.STONE, WST(), T.SLATE].filter(Boolean));
      const skip = new Set([T.AIR, T.LAVA, T.MAGMA, T.WATER, LV(), MG(), T.CHEST, T.DOOR, T.DOORTOP, T.COBWEB, T.TORCH, T.BED, T.PORTAL, T.EGYPTPORTAL, T.LOG, T.ROTLOG, T.PLANKS, T.FENCE, T.WOOL, T.WOOLRED, T.WOOLGREEN, T.WOOLYELLOW, T.WOOLORANGE, T.WOOLBLUE, T.WOOLPURPLE].filter(Boolean));
      for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) {
        if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1) continue;
        if (Math.hypot(x - cx, z - cz) > R) continue;
        for (let y = 1; y < H - 1; y++) {
          const i = idx(x, y, z), b = world[i];
          if (!b || skip.has(b)) continue;
          if (grey.has(b)) {
            const v = (window.__c151 && __c151.h3) ? __c151.h3(x, y, z) : ((x * 13 + y * 7 + z * 3) & 255) / 255;
            world[i] = v < 0.18 ? OB() : v < 0.4 ? DS() : v < 0.8 ? BLK() : HR();
          }
        }
        if (typeof setCol === 'function') setCol(x, z);
      }
    } catch (e) { if (!U.err) U.err = 'touch ' + e; }
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
    if (st && st.rot != null) return st.rot;
    try {
      const b = window.__c113 && __c113.bridges && __c113.bridges.find(function (q) { return q.k === c[0]; });
      if (b && b.a) {
        const ux = -b.a[2], uz = -b.a[3];
        // local +z should line up with (ux, uz)
        if (Math.abs(uz) >= Math.abs(ux)) return uz >= 0 ? 0 : 2;
        return ux >= 0 ? 3 : 1;
      }
    } catch (_) {}
    return 0;
  }

  function rebuildAll(only) {
    const C = window.__c151;
    if (!C || !C.ctx || typeof g9castles === 'undefined' || !g9castles) return;
    ensureWool();
    const list = only ? g9castles.filter(function (c) { return c[0] === only; }) : g9castles.slice();
    const saved = unlockFootprint(list, 46);
    const t0 = performance.now();
    try {
      for (let ci = 0; ci < list.length; ci++) {
        const c = list[ci], fn = C.B[c[0]];
        if (!fn) continue;
        const st = (C.st && C.st[c[0]]) || {};
        const gy = st.gy != null ? st.gy : (typeof solidTop === 'function' ? solidTop(c[1], c[2]) : SEA0());
        const rot = rotOf(c, st);
        if (typeof C.clearSite === 'function') C.clearSite(c, Math.min(gy, SEA0()), 44, 80);
        const K = C.ctx(c, ci, gy, rot);
        const ret = fn(K) || {};
        C.st[c[0]] = Object.assign({rot: rot, gy: gy}, ret, {lights: K.lights, chests: K.chestsN, rebuilt: 1});
        if (typeof setCol === 'function') {
          for (let X = c[1] - 47; X <= c[1] + 47; X++) for (let Z = c[2] - 47; Z <= c[2] + 47; Z++) {
            if (X > 0 && Z > 0 && X < W - 1 && Z < D - 1 && Math.hypot(X - c[1], Z - c[2]) <= 47) setCol(X, Z);
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
          touchUp();
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
