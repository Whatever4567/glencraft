/* GLX-C111 (v1.2.111): the three keeps upgraded on the C151 kit to the new
   concept-art silhouettes (Clansman terraces + conical central keep,
   Skeleton ruin on a steep crag, Black Skeleton the same shape in
   blackstone with lava veins). Positions, doors, chests, garrison
   rosters and the clan gold portal stay in place. */
(function c1311castles() {
  const U = window.__c1311 = {err: null, ms: 0, ran: 0, gold: null, portal: null};
  const SLATE = 152, BARS = 163, FEN = 162, PINE = 135, NEED = 146;
  const MOSS = () => (T.MOSS || 144);
  const GRAV = () => (T.GRAVEL || 202);
  const POD = () => (T.PODZOL || 142);
  const FERN = 238, HR = () => (T.HELLROCK || 206);
  const MG = () => (T.MAGMA || 208);
  const SSAND = () => (T.SOULSAND || 207);
  const BLK = () => (T.BLACKSTONE || 248);
  const OB = () => (T.OBSIDIAN || 189);
  const GP = 227, OAKST = 164, STST = 167;

  function hook() {
    const C = window.__c151;
    if (!C || !C.ctx || !C.B) return false;
    if (C.__c1311) return true;
    C.__c1311 = 1;
    const oldElig = C.elig;
    C.elig = function () {
      try {
        if (current && current.mode !== 'creative' && current.g25 == null) current.g25 = true;
        if (window.__c102 && !__c102.done && typeof g9castles !== 'undefined' && g9castles && g9castles.length) {
          __c102.done = g9castles.map(function (q) {
            const g = (typeof solidTop === 'function' ? solidTop(q[1], q[2]) : (typeof SEA === 'number' ? SEA : 40));
            return {k: q[0], cx: q[1], cz: q[2], gy: g + 1};
          });
        }
      } catch (_) {}
      return oldElig ? oldElig.apply(this, arguments) : true;
    };
    const oldWork = C.work;
    C.work = function (only) {
      const cs = C.clearSite;
      C.clearSite = function (c, gy, R, top) { return cs.call(this, c, gy, Math.max(R || 0, 28), top || 72); };
      // c53 locks the whole keep column in placedSet before the bare keep is
      // built, so the C151 kit (mine() skips those cells) cannot replace it.
      // Drop that lock for the duration of the rebuild; restore it after so
      // later terrain passes still leave the keep alone.
      const hadPS = (typeof placedSet !== 'undefined' && placedSet);
      const savedPS = hadPS ? placedSet : null;
      try {
        if (hadPS && typeof g9castles !== 'undefined' && g9castles) {
          placedSet = new Set(savedPS);
          const list = only ? g9castles.filter(function (c) { return c[0] === only; }) : g9castles;
          for (let i = 0; i < list.length; i++) {
            const c = list[i], R = 32;
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
    C.B.human = buildHuman;
    C.B.mossy = function (K) { return buildRuin(K, 'mossy'); };
    C.B.black = function (K) { return buildRuin(K, 'black'); };
    return true;
  }

  function tartan(K, x, y0, z, face, len) {
    const WR = T.WOOLRED || T.WOOLORANGE || T.WOOL, WB = T.WOOLBLUE || T.WOOL, WW = T.WOOL;
    const fv = [[0, -1], [-1, 0], [0, 1], [1, 0]][face & 3];
    const sv = [[-1, 0], [0, -1], [1, 0], [0, 1]][face & 3];
    for (let w = 0; w <= 1; w++) {
      const hx = x + fv[0] + sv[0] * w, hz = z + fv[1] + sv[1] * w;
      for (let i = 0; i < (len || 7); i++) {
        const b = ((i + w) & 1) ? WR : ((i & 2) ? WB : WW);
        K.B(hx, y0 - i, hz, b);
      }
    }
  }

  function portcullis(K, x0, x1, y0, y1, z) {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) K.B(x, y, z, BARS);
  }

  function pine(K, x, z, y0, h) {
    if (K.G(x, y0, z) && K.G(x, y0, z) !== T.AIR && K.G(x, y0, z) !== T.HEATHER && K.G(x, y0, z) !== T.TALLGRASS && K.G(x, y0, z) !== T.GRASS) return;
    const Hgt = 5 + (h(x, 3, z) * 3 | 0);
    for (let y = 0; y < Hgt; y++) K.B(x, y0 + y, z, PINE);
    for (let L = 0; L < 4; L++) {
      const r = Math.max(1, 2 - (L >> 1));
      for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) {
        if (a * a + b * b <= r * r + 0.4) K.B(x + a, y0 + Hgt - 2 + L, z + b, NEED);
      }
    }
  }

  function deadTree(K, x, z, y0, h) {
    const Hgt = 3 + (h(x, 4, z) * 3 | 0);
    const log = 138;
    for (let y = 0; y < Hgt; y++) K.B(x, y0 + y, z, log);
    if (h(x, 5, z) < 0.5) K.B(x + 1, y0 + Hgt - 1, z, log);
    if (h(x, 6, z) < 0.4) K.B(x, y0 + Hgt - 1, z - 1, log);
  }

  function merlonRing(K, x0, x1, z0, z1, y, wall) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const e = x === x0 || x === x1 || z === z0 || z === z1;
      if (!e) continue;
      K.B(x, y, z, wall(x, y, z));
      if (((x + z) & 1) === 0) K.B(x, y + 1, z, wall(x, y + 1, z));
    }
  }

  function coneRoof(K, tx, tz, R, y0, n, b) {
    K.cone(tx, tz, R, y0, n, b);
    K.B(tx, y0 + n, tz, b);
  }

  function buildHuman(K) {
    const {B, box, h} = K, F = 2;
    const st = (x, y, z) => h(x, y, z) < 0.08 ? T.MOSSYBRICK : h(x, y, z) < 0.18 ? T.COBBLE : T.STONEBRICK;
    const t0 = performance.now();

    // plinth
    for (let x = -16; x <= 16; x++) for (let z = -16; z <= 18; z++) {
      if (z > 16 && (x < -5 || x > 4)) continue;
      const e = Math.max(Math.abs(x), Math.abs(z > 16 ? 16 : z)) >= 16;
      for (let y = 0; y < F; y++) B(x, y, z, e ? st(x, y, z) : (y === F - 1 ? T.GRASS : T.DIRT));
    }
    // steps up to the gate
    for (let x = -2; x <= 1; x++) { K.stair(x, 1, 19, 0, STST); B(x, 0, 19, T.STONEBRICK); K.stair(x, 0, 20, 0, STST); }
    for (const x of [-3, 2]) { B(x, 0, 19, T.STONEBRICK); B(x, 1, 19, T.STONEBRICK); B(x, 0, 20, T.STONEBRICK); }
    // cobble path
    for (let z = -2; z <= 18; z++) for (let x = -2; x <= 1; x++) B(x, F - 1, z, (x === -2 || x === 1) ? GRAV() : T.COBBLE);

    // curtain wall, 2 thick, walk + merlons
    const WT = F + 5;
    for (let x = -15; x <= 15; x++) for (let z = -15; z <= 15; z++) {
      const d = Math.max(Math.abs(x), Math.abs(z));
      if (d < 14) continue;
      for (let y = F; y <= WT; y++) B(x, y, z, st(x, y, z));
      if (d === 15) { B(x, WT + 1, z, st(x, WT + 1, z)); if (((x + z) & 1) === 0) B(x, WT + 2, z, st(x, WT + 2, z)); }
    }
    for (const s of [-1, 1]) for (let k = 0; k <= 5; k++) {
      const x = s < 0 ? -5 - k : 4 + k;
      K.stair(x, F + k, 13, s < 0 ? 1 : 3, STST);
      for (let y = F; y < F + k; y++) B(x, y, 13, T.STONEBRICK);
    }

    // four round corner turrets + conical slate roofs
    for (const [tx, tz] of [[-15, -15], [15, -15], [-15, 15], [15, 15]]) {
      const top = F + 11;
      K.tower(tx, tz, 3.4, F, top, st, T.AIR);
      K.disc(tx, tz, 2.2, F + 5, T.PLANKS);
      for (const y of [F + 2, F + 7]) for (const [a, q] of [[Math.sign(tx) * 3, 0], [0, Math.sign(tz) * 3]]) B(tx + a, y, tz + q, GP);
      K.disc(tx, tz, 3.0, top, T.STONEBRICK);
      // open a doorway off the wall-walk
      for (let a = -3; a <= 3; a++) for (let q = -3; q <= 3; q++) {
        if (Math.max(Math.abs(tx + a), Math.abs(tz + q)) === 14 && a * a + q * q <= 12) {
          for (let y = WT + 1; y <= WT + 2; y++) B(tx + a, y, tz + q, T.AIR);
        }
      }
      // conical slate cap sitting on the turret (the silhouette the art asks for)
      coneRoof(K, tx, tz, 4.0, top + 1, 7, SLATE);
      K.lamp(tx, F, tz, -1, {});
    }

    // gatehouse + portcullis + oak doors + tartan banners
    const GT = F + 12;
    for (let x = -6; x <= 5; x++) for (let z = 14; z <= 18; z++) {
      for (let y = 0; y < F; y++) B(x, y, z, T.STONEBRICK);
      for (let y = F; y <= GT; y++) B(x, y, z, st(x, y, z));
      if (x === -6 || x === 5 || z === 14 || z === 18) {
        B(x, GT + 1, z, st(x, GT + 1, z));
        if (((x + z) & 1) === 0) B(x, GT + 2, z, st(x, GT + 2, z));
      }
    }
    box(-2, F, 14, 1, F + 3, 18, T.AIR);
    K.door(-1, F, 16, 2); K.door(0, F, 16, 2);
    portcullis(K, -2, 1, F + 3, F + 5, 18);
    // twin conical bartizans on the gate
    for (const tx of [-6, 5]) { coneRoof(K, tx, 18, 2.8, GT + 1, 6, SLATE); }
    tartan(K, -4, F + 10, 18, 2, 7);
    tartan(K, 3, F + 10, 18, 2, 7);
    for (const [x, z, f] of [[-10, 15, 2], [10, 15, 2], [15, -6, 3], [15, 6, 3], [-15, -6, 1], [-15, 6, 1], [-6, -15, 0], [6, -15, 0]]) {
      tartan(K, x, WT + 1, z, f, 6);
    }
    K.lamp(-3, F + 1, 19, 0, {}); K.lamp(2, F + 1, 19, 0, {});

    // ---- tall central keep with a conical slate roof ----
    const X0 = -6, X1 = 5, Z0 = -8, Z1 = 3, KH = F + 22;
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
      const e = x === X0 || x === X1 || z === Z0 || z === Z1;
      B(x, F - 1, z, e ? T.STONEBRICK : T.PLANKS);
      for (let y = F; y <= KH; y++) B(x, y, z, e ? st(x, y, z) : (y === F + 8 || y === F + 15 ? T.PLANKS : T.AIR));
    }
    // windows
    for (const y of [F + 3, F + 11, F + 18]) {
      for (const x of [-4, -1, 2]) { B(x, y, Z0, GP); B(x, y + 1, Z0, GP); }
      for (const z of [-6, -2, 1]) { B(X0, y, z, GP); B(X0, y + 1, z, GP); B(X1, y, z, GP); B(X1, y + 1, z, GP); }
    }
    // door from courtyard into the hall
    box(-1, F, Z1, 0, F + 2, Z1, T.AIR);
    K.door(-1, F, Z1, 2); K.door(0, F, Z1, 2);
    // floors / stair
    for (let k = 0; k <= 7; k++) { K.stair(4, F + k, 2 - k, 0, OAKST); for (let y = F; y < F + k; y++) B(4, y, 2 - k, T.PLANKS); }
    for (let k = 0; k <= 6; k++) { K.stair(4, F + 8 + k, -5 - (k % 5), 0, OAKST); }
    // eave, then the tall conical slate crown sitting on the keep
    K.disc(0, -2, 8.8, KH, SLATE);
    for (let x = X0 - 1; x <= X1 + 1; x++) for (let z = Z0 - 1; z <= Z1 + 1; z++) {
      const e = x === X0 - 1 || x === X1 + 1 || z === Z0 - 1 || z === Z1 + 1;
      if (e) B(x, KH, z, st(x, KH, z));
    }
    coneRoof(K, 0, -2, 9.0, KH + 1, 12, SLATE);
    // a slightly lower hall roof ridge toward the gate so the cone reads as the crown
    for (let z = 2; z <= 3; z++) for (let x = X0 + 1; x < X1; x++) B(x, KH, z, SLATE);

    // hall furniture / loot / beds
    K.chest(-4, F, -6, 2, [[IT.IRONINGOT, 6], [IT.BREAD, 6], [IT.COOKEDMUTTON || IT.MUTTON, 4], [IT.DIAMOND, 3]]);
    K.chest(3, F + 9, -6, 2, [[IT.GOLDINGOT, 3], [IT.SILVERINGOT || IT.GOLDINGOT, 2], [IT.DIAMOND, 2]]);
    K.bed(-3, F + 16, -6, 2); K.bed(1, F + 16, -6, 2);
    K.lamp(0, F + 2, -6, -1, {}); K.lamp(0, F + 10, -6, -1, {}); K.lamp(0, F + 17, -6, -1, {});
    // flags on the cone
    B(0, KH + 13, -2, T.WOOLRED || T.WOOL);
    B(0, KH + 14, -2, T.WOOLBLUE || T.WOOL);

    // terraces + heather + pines, stepping down toward the nearest water
    terraces(K, st, h, F);
    placeGold(K);
    U.humanMs = Math.round(performance.now() - t0);
    return {keep: KH, lights: K.lights, chests: K.chestsN};
  }

  function terraces(K, st, h, F) {
    // walk the four cardinals in world space to find water / downhill
    let best = 2, bd = 1e9;
    const gy = K.gy;
    for (let f = 0; f < 4; f++) {
      const [dx, dz] = [[0, 1], [-1, 0], [0, -1], [1, 0]][f];
      for (let r = 16; r <= 36; r += 2) {
        const [x, y, z] = K.wp(dx * r, 0, dz * r);
        if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) continue;
        let wet = 0, lo = 1e9;
        for (let a = -2; a <= 2; a++) {
          const xx = x + a, zz = z + a;
          if (xx < 1 || zz < 1 || xx >= W - 1 || zz >= D - 1) continue;
          const t = (typeof solidTop === 'function' ? solidTop(xx, zz) : gy);
          lo = Math.min(lo, t);
          const b = (typeof getB === 'function' ? getB(xx, t, zz) : 0);
          if (t <= (typeof SEA === 'number' ? SEA : 40) || b === T.WATER) wet++;
        }
        const score = (wet ? 0 : 80) + (gy - lo) * -2 + r * 0.1;
        if (score < bd) { bd = score; best = f; }
      }
    }
    const [ux, uz] = [[0, 1], [-1, 0], [0, -1], [1, 0]][best];
    const seaY = (typeof SEA === 'number' ? SEA : 40) - K.gy;
    // 5 terrace bands stepping down to the water, wrapping the keep
    for (let band = 0; band < 5; band++) {
      const r0 = 16 + band * 3, r1 = r0 + 3, drop = band + 1;
      const yTop = Math.max(seaY + 1, F - 1 - drop);
      for (let x = -24; x <= 24; x++) for (let z = -24; z <= 26; z++) {
        const r = Math.max(Math.abs(x), Math.abs(z));
        if (r < r0 || r > r1) continue;
        // prefer the downhill / water half, but still wrap a little
        const along = x * ux + z * uz;
        if (along < -6 && band > 1) continue;
        const yy = yTop;
        const edge = r === r1 || r === r0;
        for (let y = Math.min(yy - 2, seaY - 1); y <= yy; y++) {
          const cur = K.G(x, y, z);
          if (cur === T.STONEBRICK || cur === T.DOOR || cur === T.DOORTOP || cur === T.CHEST || cur === T.EGYPTPORTAL) continue;
          const nearWater = y <= seaY + 1;
          K.B(x, y, z, edge && y === yy ? st(x, y, z) : (y === yy ? T.GRASS : (nearWater ? (T.SAND || T.DIRT) : T.DIRT)));
        }
        if (!edge && h(x, 30 + band, z) < 0.62) K.B(x, yy + 1, z, T.HEATHER);
        else if (!edge && h(x, 31 + band, z) < 0.14) K.B(x, yy + 1, z, T.THISTLE || T.TALLGRASS);
        if (r === r1 && ((x + z) & 1) === 0 && along > 0) K.stair(x, yy, z, 0, STST);
      }
    }
    // pines on the outer terraces, not on the path or walls
    for (let i = 0; i < 10; i++) {
      const a = (i * 2.2 + h(i, 40, 0) * 3) % 6.283;
      const rr = 19 + (h(i, 41, 0) * 5);
      const x = Math.round(Math.cos(a) * rr), z = Math.round(Math.sin(a) * rr);
      if (Math.abs(x) < 5 && z > 10) continue;
      if (Math.max(Math.abs(x), Math.abs(z)) < 16) continue;
      const y0 = F - 1 - Math.max(0, Math.max(Math.abs(x), Math.abs(z)) - 16);
      pine(K, x, z, y0 + 1, h);
    }
  }

  function placeGold(K) {
    try {
      const E = window.__egypt1269;
      if (!E || typeof E.placeReturn !== 'function') return;
      const [x, , z] = K.wp(-6, 0, 22);
      if (x < 4 || z < 4 || x >= W - 4 || z >= D - 4) return;
      const g = (typeof solidTop === 'function' ? solidTop(x, z) : K.gy);
      for (let a = -1; a <= 2; a++) for (let b = -1; b <= 1; b++) {
        const xx = x + a, zz = z + b;
        if (xx < 2 || zz < 2 || xx >= W - 2 || zz >= D - 2) continue;
        const t = (typeof solidTop === 'function' ? solidTop(xx, zz) : g);
        for (let y = Math.min(t, g) + 1; y <= g + 6 && y < H - 1; y++) {
          if (typeof inb === 'function') {}
          world[idx(xx, y, zz)] = T.AIR;
        }
      }
      E.placeReturn(x, g, z, 0);
      U.gold = [x, g, z];
      try { if (typeof markDirty === 'function') { markDirty(x, z); markDirty(x + 1, z); } } catch (_) {}
    } catch (e) { if (!U.err) U.err = 'gold ' + e; }
  }

  function buildRuin(K, kind) {
    const {B, box, h} = K;
    const black = kind === 'black';
    const CH = 14; // steeper crag than the old CH=9
    const F = CH + 1;
    const pale = (x, y, z) => {
      const v = h(x, y, z);
      if (black) {
        if (v < 0.18) return OB();
        if (v < 0.78) return BLK();
        return HR();
      }
      return v < 0.32 ? T.STONEBRICK : v < 0.5 ? (T.WSTONE || 156) : v < 0.76 ? T.MOSSYBRICK : v < 0.92 ? T.COBBLE : T.STONE;
    };
    const rock = (x, y, z) => {
      const v = h(x, y + 40, z);
      if (black) return v < 0.55 ? BLK() : v < 0.8 ? HR() : (T.DEEPSLATE || T.STONE);
      return v < 0.5 ? T.STONE : v < 0.7 ? T.COBBLE : v < 0.85 ? (T.DEEPSLATE || T.STONE) : T.MOSSYBRICK;
    };
    const surf = (x, z, t, isTop) => {
      const v = h(x, 9, z);
      if (black) return v < 0.35 ? BLK() : v < 0.55 ? HR() : v < 0.7 ? SSAND() : GRAV();
      return isTop ? (v < 0.4 ? MOSS() : v < 0.62 ? T.COBBLE : v < 0.8 ? GRAV() : POD()) : (v < 0.35 ? MOSS() : v < 0.5 ? GRAV() : rock(x, t, z));
    };

    // steep rocky / scorched hill from the waterline up: flat top r<=12, falls to the loch by r~22
    const seaY = (typeof SEA === 'number' ? SEA : 40) - K.gy;
    const top = (x, z) => {
      const r = Math.max(Math.abs(x), Math.abs(z)) * 0.5 + Math.hypot(x, z) * 0.5 + (h(x, 7, z) - 0.5) * 1.4;
      return r <= 12.5 ? CH : Math.round(CH - (r - 12.5) * 1.25);
    };
    for (let x = -24; x <= 24; x++) for (let z = -24; z <= 24; z++) {
      const t = top(x, z);
      if (t < seaY - 1 || Math.hypot(x, z) > 24) continue;
      const y0 = Math.min(0, seaY - 1);
      for (let y = y0; y <= t; y++) B(x, y, z, rock(x, y, z));
      B(x, t, z, surf(x, z, t, t === CH));
    }
    // steps + a ladder (fence posts) up the crag to the gate
    for (let k = 0; k <= CH + 1; k++) for (let x = -2; x <= 1; x++) {
      const z = 14 + k, y = CH - 1 - k;
      if (y < -1) continue;
      for (let yy = y + 1; yy <= CH + 3; yy++) B(x, yy, z, T.AIR);
      if (y >= 0) { K.stair(x, y, z, 0, 165); for (let yy = 0; yy < y; yy++) B(x, yy, z, rock(x, yy, z)); }
    }
    for (let k = 0; k <= CH; k++) {
      const z = 14 + k, y = Math.max(0, CH - k);
      B(-4, y, z, FEN); B(-4, y + 1, z, FEN);
    }

    // crumbling curtain
    const WT = F + 5;
    for (let x = -11; x <= 11; x++) for (let z = -11; z <= 11; z++) {
      const d = Math.max(Math.abs(x), Math.abs(z));
      if (d < 10) continue;
      const v = h(x, 11, z), gap = h(Math.floor(x / 3), 12, Math.floor(z / 3)) < 0.28;
      const tt = gap ? F + (v < 0.5 ? 0 : 1) : WT - (v < 0.25 ? 3 : v < 0.5 ? 2 : v < 0.75 ? 1 : 0);
      for (let y = F - 1; y <= tt; y++) B(x, y, z, pale(x, y, z));
      if (d === 11 && !gap && ((x + z) & 1) === 0 && v > 0.3) B(x, tt + 1, z, pale(x, tt + 1, z));
      if (!black && h(x, 50, z) < 0.28 && d >= 10) B(x, Math.min(tt, WT), z, T.COBWEB);
      if (!black && h(x, 51, z) < 0.32 && d === 11) B(x, tt, z, MOSS());
      if (!black && h(x, 52, z) < 0.2 && d === 11 && tt > F + 2) B(x, tt - 1, z, T.COBWEB);
    }

    // four broken corner towers
    for (const [tx, tz] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) {
      const th = F + 10 + (h(tx, 13, tz) * 4 | 0);
      for (let a = -2; a <= 2; a++) for (let q = -2; q <= 2; q++) {
        const e = Math.abs(a) === 2 || Math.abs(q) === 2;
        const cut = th - (Math.abs(a + q * 0.7) * 1.4 + h(tx + a, 14, tz + q) * 3 | 0) - (a * Math.sign(tx) < 0 ? 3 : 0);
        for (let y = F - 1; y <= cut; y++) B(tx + a, y, tz + q, e ? pale(tx + a, y, tz + q) : T.AIR);
      }
      for (const y of [F + 2, F + 6]) { B(tx + Math.sign(tx) * 2, y, tz, T.AIR); B(tx, y, tz + Math.sign(tz) * 2, T.AIR); }
    }

    // broken arch gate, one door hanging on
    for (const tx of [-3, 2]) for (let a = -1; a <= 1; a++) for (let q = -1; q <= 1; q++) {
      const ht = F + 7 - (tx < 0 ? 0 : 3) - (h(tx + a, 15, q) * 2 | 0);
      for (let y = F - 1; y <= ht; y++) B(tx + a, y, 11 + q, pale(tx + a, y, 11 + q));
    }
    box(-1, F, 10, 0, F + 2, 12, T.AIR);
    box(-1, F + 3, 10, 0, F + 3, 12, function (x, y, z) { return pale(x, y, z); });
    if (!black) K.door(-1, F, 11, 2);
    else {
      // black gate lost a door long ago — iron bars stubs
      B(-1, F + 2, 11, BARS);
    }

    // tall ruined central keep
    const x0 = 0, x1 = 6, z0 = -9, z1 = -3, TOP = F + 22;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const e = x === x0 || x === x1 || z === z0 || z === z1;
      const core = x >= 2 && x <= 4 && z >= -7 && z <= -5;
      const tt = TOP - (h(x, 70, z) * 3 | 0) - (x > 4 && z < -6 ? 5 : 0);
      for (let y = F; y <= tt + 1; y++) B(x, y, z, e ? pale(x, y, z) : (core && y < F + 20 ? pale(x, y, z) : T.AIR));
      if (e && tt >= TOP - 1 && ((x + z) & 1) === 0 && x < x1) B(x, tt + 2, z, pale(x, tt + 2, z));
      if (!black && e && h(x, 80, z) < 0.45) B(x, tt, z, T.COBWEB);
      if (!black && e && h(x, 81, z) < 0.3) B(x, F + 8 + (h(x, 82, z) * 8 | 0), z, T.COBWEB);
      if (!black && e && h(x, 83, z) < 0.25) B(x, tt - 1, z, MOSS());
    }
    // bite the south-east keep: walls open from mid-height, jagged crown
    for (let x = 5; x <= 6; x++) for (let z = -9; z <= -3; z++) {
      for (let y = F + 12; y <= F + 26; y++) if (h(x, y, z) > 0.25) B(x, y, z, T.AIR);
    }
    for (let y = F; y <= F + 2; y++) for (const x of [3, 4]) B(x, y, z1, T.AIR);
    const ring = [];
    for (let z = -4; z >= -8; z--) ring.push([1, z]);
    for (let x = 2; x <= 5; x++) ring.push([x, -8]);
    for (let z = -7; z <= -4; z++) ring.push([5, z]);
    for (let x = 4; x >= 2; x--) ring.push([x, -4]);
    const fc = (a, b) => b[0] > a[0] ? 3 : b[0] < a[0] ? 1 : b[1] > a[1] ? 2 : 0;
    for (let k = 0; k < 20; k++) { const c = ring[k % 16], n = ring[(k + 1) % 16]; K.stair(c[0], F + k, c[1], fc(c, n), 165); }
    K.lamp(3, F + 21, -6, -1, black ? {soul: 1} : {});

    // courtyard + dead trees / moss / webs
    for (let x = -9; x <= 9; x++) for (let z = -2; z <= 9; z++) {
      if (Math.abs(x + 0.5) < 2) continue;
      const v = h(x, 20, z);
      if (K.G(x, F, z) !== T.AIR) continue;
      if (!black && v < 0.1) B(x, F, z, FERN);
      else if (!black && v < 0.22) B(x, F, z, T.COBWEB);
      else if (black && v < 0.1) B(x, F, z, MG());
    }
    for (const [tx, tz] of [[-8, 6], [8, 5], [-7, -1], [9, 2], [-5, 8], [6, -2]]) {
      deadTree(K, tx, tz, F, h);
    }
    // a couple of blasted trees on the outer slope
    for (const [tx, tz] of [[-16, 8], [15, 10], [-14, -12]]) {
      const ty = Math.max(0, (typeof top === 'function' ? top(tx, tz) : F - 8));
      deadTree(K, tx, tz, ty, h);
    }

    // crypt chest under the crag (loot stays kind-specific)
    for (let k = 0; k <= 8; k++) { B(0, CH - k, -6, T.AIR); B(1, CH - k, -6, T.AIR); if (k < 8) K.stair(0, CH - 1 - k, -6, 0, 165); }
    for (let x = -3; x <= 4; x++) for (let z = -8; z <= -4; z++) {
      for (let y = -1; y <= 3; y++) {
        const e = x === -3 || x === 4 || z === -8 || z === -4 || y === -1 || y === 3;
        B(x, y, z, e ? rock(x, y, z) : T.AIR);
      }
    }
    if (black) K.chest(2, 0, -7, 2, [[IT.FLINTSTEEL, 1], [T.OBSIDIAN, 4], [IT.GOLDINGOT, 3]]);
    else K.chest(2, 0, -7, 2, [[IT.IRONINGOT, 3], [IT.BREAD, 3], [IT.POTATO, 4]]);
    if (!black) { B(-2, 1, -8, T.COBWEB); B(3, 2, -8, T.COBWEB); B(0, 3, -6, T.COBWEB); }

    if (black) {
      lavaVeins(K, pale, CH, F);
      blackPortal(K, F);
      // recolour any leftover pale masonry so the keep reads as blackstone
      for (let x = -16; x <= 16; x++) for (let z = -16; z <= 16; z++) {
        for (let y = F - 2; y <= F + 28; y++) {
          const b = K.G(x, y, z);
          if (b === T.STONEBRICK || b === T.MOSSYBRICK || b === T.COBBLE || b === T.STONE || b === (T.WSTONE || 156))
            B(x, y, z, pale(x, y, z));
        }
      }
    }
    return {crag: CH, kind};
  }

  function lavaVeins(K, pale, CH, F) {
    // deterministic magma/lava rivulets down the keep, curtain and hill
    const seeds = [[3, F + 20, -6], [0, F + 16, -9], [6, F + 14, -3], [-8, WT(F), 0], [8, WT(F), 0], [0, WT(F), -11], [-11, F + 8, 8], [11, F + 7, -8]];
    function WT(F0) { return F0 + 5; }
    for (let i = 0; i < 14; i++) {
      let x = (K.h(i, 90, 0) * 20 | 0) - 10;
      let z = (K.h(i, 91, 0) * 20 | 0) - 10;
      let y = F + 8 + (K.h(i, 92, 0) * 16 | 0);
      for (let s = 0; s < 18; s++) {
        const v = K.h(x, y + 3, z + i);
        K.B(x, y, z, v < 0.35 ? T.LAVA : MG());
        // occasionally a side drip
        if (v > 0.7) K.B(x + (v < 0.85 ? 1 : -1), y, z, MG());
        y--;
        if (v < 0.33) x += 1; else if (v < 0.66) x -= 1;
        if (K.h(x, 93, z) < 0.5) z += (v < 0.5 ? 1 : -1);
        if (y < -2) break;
      }
    }
    // hill rivulets from the rim down the outer slope
    for (let i = 0; i < 10; i++) {
      const a = i * 0.62 + K.h(i, 94, 0);
      let x = Math.round(Math.cos(a) * 13), z = Math.round(Math.sin(a) * 13), y = CH;
      for (let s = 0; s < 16; s++) {
        K.B(x, y, z, (s & 1) ? MG() : T.LAVA);
        y--;
        x = Math.round(x + Math.cos(a) * 0.8);
        z = Math.round(z + Math.sin(a) * 0.8);
        if (y < -3) break;
      }
    }
  }

  function blackPortal(K, F) {
    // unfinished nether portal just outside the gate, 2 obsidian missing
    const px = -1, pz = 16, g = F - 1;
    for (let x = px - 2; x <= px + 3; x++) for (let z = pz - 2; z <= pz + 2; z++) {
      K.B(x, g, z, HR());
      for (let y = g + 1; y <= g + 6; y++) K.B(x, y, z, T.AIR);
    }
    let n = 0;
    for (let a = -1; a <= 2; a++) for (let y = 0; y <= 4; y++) {
      const edge = a === -1 || a === 2 || y === 0 || y === 4;
      const miss = (a === 2 && y === 4) || (a === -1 && y === 2);
      if (edge && !miss) { K.B(px + a, g + 1 + y, pz, OB()); n++; }
    }
    K.B(px + 4, g, pz, T.LAVA);
    U.portal = n;
  }

  function rawKit(c, gy, rot) {
    const C = window.__c151;
    const K = C.ctx(c, 0, gy, rot);
    const wp = K.wp;
    K.B = (dx, y, dz, b) => {
      const [x, Y, z] = wp(dx, y, dz);
      if (x <= 0 || z <= 0 || x >= W - 1 || z >= D - 1 || Y <= 0 || Y >= H - 2) return;
      world[idx(x, Y, z)] = (typeof b === 'function' ? b(dx, y, dz) : b);
    };
    K.G = (dx, y, dz) => {
      const [x, Y, z] = wp(dx, y, dz);
      if (x <= 0 || z <= 0 || x >= W - 1 || z >= D - 1 || Y <= 0 || Y >= H - 2) return 0;
      return world[idx(x, Y, z)];
    };
    return K;
  }

  function touchRuin(K, black) {
    const h = K.h, B = K.B, F = 15, CH = 14;
    const pale = (x, y, z) => {
      const v = h(x, y, z);
      if (black) {
        if (v < 0.18) return OB();
        if (v < 0.78) return BLK();
        return HR();
      }
      return v < 0.32 ? T.STONEBRICK : v < 0.5 ? (T.WSTONE || 156) : v < 0.76 ? T.MOSSYBRICK : v < 0.92 ? T.COBBLE : T.STONE;
    };
    const rock = (x, y, z) => {
      const v = h(x, y + 40, z);
      if (black) return v < 0.55 ? BLK() : v < 0.8 ? HR() : (T.DEEPSLATE || T.STONE);
      return v < 0.5 ? T.STONE : v < 0.7 ? T.COBBLE : v < 0.85 ? (T.DEEPSLATE || T.STONE) : T.MOSSYBRICK;
    };
    // late passes can re-skin the black keep as pale masonry; write through
    // placedSet here so the walls stay blackstone. Do not re-run hill fill or
    // lava veins — those buried the keep when they ran a second time.
    if (black) {
      for (let x = -16; x <= 16; x++) for (let z = -16; z <= 16; z++) {
        for (let y = F - 1; y <= F + 28; y++) {
          const b = K.G(x, y, z);
          if (b === T.STONEBRICK || b === T.MOSSYBRICK || b === T.COBBLE || b === (T.WSTONE || 156))
            B(x, y, z, pale(x, y, z));
        }
      }
    } else {
      for (let x = -12; x <= 12; x++) for (let z = -12; z <= 12; z++) {
        for (let y = F + 2; y <= F + 24; y++) {
          const b = K.G(x, y, z);
          if (!b || b === T.AIR || b === T.DOOR || b === T.DOORTOP || b === T.CHEST) continue;
          if (K.G(x, y + 1, z) === T.AIR && h(x, y + 90, z) < 0.38) B(x, y + 1, z, T.COBWEB);
          if (h(x, y + 91, z) < 0.18 && b !== T.COBWEB) B(x, y, z, MOSS());
        }
      }
    }
  }

  function touchUp() {
    const C = window.__c151;
    if (!C || !C.ctx || typeof g9castles !== 'object' || !g9castles) return;
    if (typeof DIM !== 'undefined' && DIM.cur) return;
    const t0 = performance.now();
    for (let i = 0; i < g9castles.length; i++) {
      const c = g9castles[i];
      if (c[0] !== 'black' && c[0] !== 'mossy') continue;
      const st = C.st && C.st[c[0]];
      const gy = (st && st.gy) || (typeof solidTop === 'function' ? solidTop(c[1], c[2]) + 1 : 46);
      const rot = (st && st.rot) || 0;
      touchRuin(rawKit(c, gy, rot), c[0] === 'black');
    }
    U.touchMs = Math.round(performance.now() - t0);
  }

  try {
    const gen = generate;
    generate = function () {
      if (window.__glenLoad && __glenLoad.skipPost && __glenLoad.skipPost(60)) return gen.apply(this, arguments);
      const r = gen.apply(this, arguments);
      try { if (!DIM.cur && !cityGen) touchUp(); } catch (e) {
        if (window.__glenLoad && __glenLoad.isYield && __glenLoad.isYield(e)) throw e;
        if (!U.err) U.err = 'touch ' + e;
      }
      if (window.__glenLoad && __glenLoad.markPost) __glenLoad.markPost(60);
      return r;
    };
  } catch (e) { if (!U.err) U.err = 'genwrap ' + e; }

  hook();
})();
