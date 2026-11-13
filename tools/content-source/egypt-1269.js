/* GLX-EG1269 (v1.2.69): EGYPT LAND. The old pyramid island (sandstone pyramid with a gold capstone,
   hall and galleries, chest room, the Great Sphinx) is restored as its own Earth-like dimension -
   sky, sun, sea and sand - reached by a gold-block portal (the Nether portal method, with the
   portal surface recoloured gold). A return portal sits by the pyramid, and the pause menu can
   teleport you there. The Egyptian people move out of Glencraft and live at the pyramid in Egypt
   land. Dimension state and the player's being there are remembered with the world.
   First-person hands and the gold D-pad are left alone. The view-model stays hidden in third person. */
(function egypt1269(WIN) {
  const U = window.__egypt1269 = {
    version: '1.2.69-egypt', err: null, pyr: null, nFolk: 0, evicted: 0, entered: 0, built: 0,
    portalId: 773, goldTex: null
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 280); };
  const EGYPT_W = 256;
  const PORTAL_ID = 773;
  U.portalId = PORTAL_ID;
  const NAME = 'egypt';

  // ---- register the gold portal block (nether portal texture, recoloured gold) ----
  function goldMap() {
    try {
      const src = (typeof portalTex !== 'undefined' && portalTex) || (typeof mat === 'function' && mat('portal') && mat('portal').map);
      let img = src && src.image;
      const c = document.createElement('canvas');
      const w = (img && (img.width || img.naturalWidth)) || 16, h = (img && (img.height || img.naturalHeight)) || 16;
      c.width = w; c.height = h;
      const g = c.getContext('2d');
      if (img) try { g.drawImage(img, 0, 0, w, h); } catch (_) { img = null; }
      if (!img) {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const t = ((x * 3 + y * 5) % 7) / 7, v = 0.35 + 0.65 * t;
          g.fillStyle = 'rgb(' + Math.round(80 + v * 175) + ',' + Math.round(50 + v * 140) + ',' + Math.round(8 + v * 40) + ')';
          g.fillRect(x, y, 1, 1);
        }
      } else {
        const d = g.getImageData(0, 0, w, h);
        for (let i = 0; i < d.data.length; i += 4) {
          const r = d.data[i], g0 = d.data[i + 1], b = d.data[i + 2], a = d.data[i + 3];
          if (a < 8) continue;
          const l = (r * 0.28 + g0 * 0.45 + b * 0.27) / 255;
          d.data[i]     = Math.min(255, Math.round(70 + l * 210));
          d.data[i + 1] = Math.min(255, Math.round(42 + l * 175));
          d.data[i + 2] = Math.min(255, Math.round(6 + l * 50));
        }
        g.putImageData(d, 0, 0);
      }
      const t = new THREE.CanvasTexture(c);
      t.magFilter = t.minFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      t.center.set(0.5, 0.5);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.needsUpdate = true;
      return t;
    } catch (e) { ERR('tex', e); return null; }
  }
  function installBlock() {
    try {
      if (typeof T === 'undefined') return false;
      T.EGYPTPORTAL = PORTAL_ID;
      if (typeof NAMES !== 'undefined') NAMES[PORTAL_ID] = 'Egypt portal';
      if (typeof HARD !== 'undefined') HARD[PORTAL_ID] = 1e9;
      if (typeof MC_HARD !== 'undefined') MC_HARD[PORTAL_ID] = 1e9;
      if (typeof REQ !== 'undefined') REQ[PORTAL_ID] = 99;
      if (typeof FACES !== 'undefined') FACES[PORTAL_ID] = 'egyptportal';
      if (!U.goldTex) U.goldTex = goldMap();
      if (typeof BLOCK_MATS !== 'undefined') {
        const map = U.goldTex;
        BLOCK_MATS[PORTAL_ID] = new THREE.MeshBasicMaterial({
          map: map || undefined, color: map ? 0xffffff : 0xe8b53a,
          transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false
        });
      }
      return true;
    } catch (e) { ERR('blk', e); return false; }
  }

  // gold-block frame, same closed-loop rules as the obsidian nether portal (2..21 wide, 3..21 tall)
  function goldFill(x, y, z, check) {
    const FRAME = (typeof T !== 'undefined' && T.GOLDBLOCK) || 75;
    const AIR = (typeof T !== 'undefined' && T.AIR) || 0;
    const FIRE = (typeof T !== 'undefined' && T.FIRE) || 204;
    for (const ax of [0, 1]) {
      const seen = new Set(), st = [[x, y, z]], cells = []; let ok = true;
      while (st.length && ok) {
        const [cx, cy, cz] = st.pop(); const k = cx + ',' + cy + ',' + cz;
        if (seen.has(k)) continue; seen.add(k);
        const b = getB(cx, cy, cz);
        if (b === FRAME) continue;
        if (b !== AIR && b !== FIRE && b !== PORTAL_ID && !(check && b === PORTAL_ID)) { ok = false; break; }
        cells.push([cx, cy, cz]);
        if (cells.length > 441 || cy <= 0 || cy >= H - 1) { ok = false; break; }
        st.push([cx, cy + 1, cz], [cx, cy - 1, cz]);
        if (ax === 0) st.push([cx + 1, cy, cz], [cx - 1, cy, cz]);
        else st.push([cx, cy, cz + 1], [cx, cy, cz - 1]);
      }
      if (!ok || !cells.length) continue;
      const ys = cells.map(c => c[1]), hs = cells.map(c => ax === 0 ? c[0] : c[2]);
      if (Math.max(...ys) - Math.min(...ys) + 1 < 3 || Math.max(...hs) - Math.min(...hs) + 1 < 2) continue;
      if (check) return cells;
      for (const [cx, cy, cz] of cells) setB(cx, cy, cz, PORTAL_ID);
      return cells;
    }
    return null;
  }
  function lightGold(x, y, z) {
    const cells = goldFill(x, y, z);
    if (!cells) return false;
    try { rebuild(); } catch (_) {}
    try { sfx3d('growl', {x, y, z}, 24); } catch (_) {}
    try { for (const c of cells) burst(c[0] + .5, c[1] + .5, c[2] + .5, Math.random() < .5 ? 0xe8c040 : 0xfff0a0, 2, .6); } catch (_) {}
    try { toast('The gold portal roars into life!'); } catch (_) {}
    return true;
  }
  U.goldFill = goldFill;
  U.lightGold = lightGold;

  // place a standard 4-wide, 5-tall gold frame with a lit portal, standing in plane ax (0=X, 1=Z)
  function placeReturn(cx, gy, cz, ax) {
    const FRAME = T.GOLDBLOCK || 75;
    ax = ax || 0;
    const du = ax === 0 ? 1 : 0, dv = ax === 0 ? 0 : 1;
    // interior is 2 wide, 3 tall; frame around it
    const set = (x, y, z, b) => { try { if (x > 1 && z > 1 && x < W - 2 && z < D - 2 && y > 0 && y < H - 1) { world[idx(x, y, z)] = b; } } catch (_) {} };
    for (let i = -1; i <= 2; i++) for (let y = gy; y <= gy + 4; y++) {
      const x = cx + i * du, z = cz + i * dv;
      const edge = (i === -1 || i === 2 || y === gy || y === gy + 4);
      set(x, y, z, edge ? FRAME : PORTAL_ID);
    }
    // clear a little floor in front
    for (let i = 0; i <= 1; i++) {
      const x = cx + i * du, z = cz + i * dv;
      const fx = x + (ax === 0 ? 0 : 1), fz = z + (ax === 0 ? 1 : 0);
      try { if (getB(fx, gy, fz) && getB(fx, gy, fz) !== T.SAND && getB(fx, gy, fz) !== T.SANDSTONE) { /* leave */ } } catch (_) {}
    }
    U.returnAt = [cx + 0.5, gy + 1, cz + 0.5];
    return U.returnAt;
  }
  U.placeReturn = placeReturn;

  // ---- compatible island kit so we can call the original U.pyramid / U.sphinx ----
  function makeKit(ox, oz, fx, fz, isle, G, rnd) {
    const rx = -fz, rz = fx;
    const N = (x, z) => x * D + z;
    const inW = (x, z) => x > 2 && z > 2 && x < W - 3 && z < D - 3;
    const K = {ox, oz, fx, fz, rx, rz, isle, G, rnd, n: 0};
    K.L = (u, v) => [ox + u * fx + v * rx, oz + u * fz + v * rz];
    K.ok = (u, v) => { const [x, z] = K.L(u, v); return inW(x, z) && (!isle || isle.has(N(x, z))); };
    K.B = (u, y, v, b) => {
      const [x, z] = K.L(u, v);
      if (!inW(x, z) || y < 1 || y >= H - 1) return;
      world[idx(x, y, z)] = b; K.n++;
    };
    K.get = (u, y, v) => { const [x, z] = K.L(u, v); return inW(x, z) && y > 0 && y < H ? world[idx(x, y, z)] : 0; };
    K.box = (u0, y0, v0, u1, y1, v1, b) => {
      for (let u = Math.min(u0, u1); u <= Math.max(u0, u1); u++)
        for (let v = Math.min(v0, v1); v <= Math.max(v0, v1); v++)
          for (let y = y0; y <= y1; y++) K.B(u, y, v, typeof b === 'function' ? b(u, y, v) : b);
    };
    K.Z = (key, base, u0, y0, v0, u1, y1, v1) => {
      try {
        const [ax, az] = K.L(u0, v0), [bx, bz] = K.L(u1, v1);
        const zones = (window.__c181 && __c181.zones) || (U.zones = U.zones || []);
        zones.push([key, base, Math.min(ax, bx), Math.min(y0, y1), Math.min(az, bz), Math.max(ax, bx), Math.max(y0, y1), Math.max(az, bz)]);
      } catch (_) {}
    };
    K.S = () => {};
    K.torch = (u, y, v) => {
      const [x, z] = K.L(u, v); if (!inW(x, z) || y < 1 || y >= H - 1) return;
      world[idx(x, y, z)] = T.TORCH;
      try { lightSrc.set((x * 4096 + z) * 256 + y, [x + .5, y + .7, z + .5, T.TORCH]); } catch (_) {}
    };
    K.lamp = (u, y, v) => K.torch(u, y, v);
    const sF = (typeof stairF === 'function') ? stairF : ((dx, dz) => dz < 0 ? 0 : dx < 0 ? 1 : dz > 0 ? 2 : 3);
    K.face = (du, dv) => sF(du * fx + dv * rx, du * fz + dv * rz);
    K.stair = (u, y, v, b, du, dv) => {
      K.B(u, y, v, b);
      const [x, z] = K.L(u, v);
      try { entMeta.set(keyOf(x, y, z), {face: K.face(du, dv)}); } catch (_) {}
    };
    K.chest = (u, y, v, L) => { const [x, z] = K.L(u, v); try { lootChest(x, y, z, L, rnd); } catch (_) {} };
    K.W = (u, y, v) => { const [x, z] = K.L(u, v); return [x + .5, y, z + .5]; };
    K.carve = (cells, yTop) => {
      const S = new Set(cells.map(([u, y, v]) => { const [x, z] = K.L(u, v); return idx(x, y, z); }));
      for (const i of S) {
        const z = i % D, r = (i - z) / D, y = r % H, x = (r - y) / H;
        for (const [a, b, c] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
          const X = x + a, Y = y + b, Z = z + c; if (!inW(X, Z)) continue;
          const j = idx(X, Y, Z); if (S.has(j) || Y > yTop) continue;
          const q = world[j];
          if (q === T.WATER || q === T.LAVA || !q || q === T.CHEST) world[j] = T.SANDSTONE;
        }
      }
      for (const i of S) world[i] = 0;
      return S.size;
    };
    return K;
  }
  U.makeKit = makeKit;

  // modest fallback if the original pyramid builder is missing
  function fallbackPyramid(K, G) {
    const P = T.SANDSTONE, B = 20, HT = 26, PU = -8, ST = 168;
    const hk = k => Math.round(B * (1 - k / HT));
    for (let k = 0; k < HT; k++) {
      const h = hk(k), hn = k + 1 < HT ? hk(k + 1) : -1, y = G + 1 + k;
      K.box(PU - h, y, -h, PU + h, y, h, P);
      if (hn < h && h > 0) for (let i = -h; i <= h; i++)
        for (const [u, v, du, dv] of [[PU + h, i, -1, 0], [PU - h, i, 1, 0], [PU + i, h, 0, -1], [PU + i, -h, 0, 1]]) {
          if (du === -1 && Math.abs(v) <= 5 && y >= G + 3 && y <= G + 10) continue;
          K.stair(u, y, v, ST, du, dv);
        }
    }
    K.B(PU, G + 1 + HT, 0, T.GOLDBLOCK);
    K.box(PU + B - 3, G + 1, -5, PU + B + 3, G + 3, 5, P);
    K.box(PU + 3, G + 4, -3, PU + B + 3, G + 8, 3, 0);
    K.box(PU - 4, G + 4, -5, PU + 6, G + 11, 5, 0);
    return {u: PU, ty: G + 3 - 18, door: K.W(PU + B + 4, G + 4, 0)};
  }

  // ---- Egypt land generator: Earth-like sea, sand island, the old pyramid + sphinx ----
  function genEgypt() {
    const SEA0 = (typeof SEA === 'number') ? SEA : 32;
    setWorldSize(EGYPT_W);
    world.fill(0);
    const seed = ((gSeed || 7) ^ 0xE619) >>> 0;
    let s = seed || 1;
    const rnd = () => { s = (Math.imul(s, 16807) >>> 0) % 2147483647; return s / 2147483647; };
    const hs = (i, j) => { const t = Math.sin(i * 127.1 + j * 311.7 + 9.2) * 43758.5453; return t - Math.floor(t); };
    const cx = EGYPT_W >> 1, cz = EGYPT_W >> 1, R = 90;
    const G = SEA0 + 3;
    const isle = new Set();
    const N = (x, z) => x * D + z;
    const SAND = T.SAND, SS = T.SANDSTONE, STN = T.STONE, WTR = T.WATER, BED = T.BEDROCK || T.STONE;
    for (let x = 0; x < EGYPT_W; x++) for (let z = 0; z < EGYPT_W; z++) {
      const dx = x + 0.5 - cx, dz = z + 0.5 - cz, d = Math.hypot(dx, dz);
      const dune = (Math.sin(x * 0.17 + 1.2) * Math.cos(z * 0.13) + Math.sin(x * 0.07 - z * 0.09) * 0.7) * 2.2
        + (hs(x * 0.4, z * 0.4) - 0.5) * 2;
      let h, land = false;
      if (d < R - 1) {
        const edge = Math.max(0, (R - 8 - d) / (R - 8));
        h = d > R - 9 ? SEA0 + 1 + (d > R - 5 ? 0 : 1) : Math.round(G + dune * Math.min(1, edge * 1.4));
        if (h < SEA0 + 1) h = SEA0 + 1;
        land = true;
        isle.add(N(x, z));
      } else {
        h = SEA0 - 5 - Math.floor(hs(x, z) * 2);
        if (d < R + 6) h = SEA0 - 2; // shallow shelf
      }
      for (let y = 0; y < H; y++) {
        let b = 0;
        if (y === 0) b = BED;
        else if (y <= h) {
          const dd = h - y;
          b = land ? (dd === 0 ? SAND : dd < 4 ? SAND : dd < 10 ? SS : STN) : (dd === 0 ? SAND : STN);
        } else if (y < SEA0) b = WTR;
        world[idx(x, y, z)] = b;
      }
    }
    // a few palm-like trees (log + leaf crown) on the dunes, clear of the pyramid footprint
    const LOG = T.LOG, LV = T.LEAVES;
    for (let n = 0; n < 18; n++) {
      const a = rnd() * Math.PI * 2, rr = 38 + rnd() * 42;
      const x = Math.round(cx + Math.cos(a) * rr), z = Math.round(cz + Math.sin(a) * rr);
      if (!isle.has(N(x, z))) continue;
      let gy = 0;
      for (let y = H - 2; y > SEA0; y--) if (world[idx(x, y, z)] === SAND) { gy = y; break; }
      if (!gy) continue;
      const th = 4 + (rnd() * 3) | 0;
      for (let y = 1; y <= th; y++) world[idx(x, gy + y, z)] = LOG;
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = -1; dy <= 1; dy++) {
        if (dx * dx + dz * dz + dy * dy * 2 > 5) continue;
        const xx = x + dx, zz = z + dz, yy = gy + th + dy;
        if (xx > 2 && zz > 2 && xx < W - 3 && zz < D - 3 && yy < H - 1 && !world[idx(xx, yy, zz)]) world[idx(xx, yy, zz)] = LV;
      }
    }

    const K = makeKit(cx, cz, 1, 0, isle, G, rnd);
    U.K = K;
    const st = {};
    const C = window.__c181;
    let pyr = null;
    try { if (C && typeof C.pyramid === 'function') pyr = C.pyramid(K, st); } catch (e) { ERR('pyr', e); }
    if (!pyr) try { pyr = fallbackPyramid(K, G); } catch (e) { ERR('fbpyr', e); }
    try { if (C && typeof C.sphinx === 'function') U.sphinx = C.sphinx(K, st); } catch (e) { ERR('sphinx', e); }
    try { if (C && typeof C.dune === 'function') C.dune(K, st); } catch (_) {}

    // return gold portal on the porch, a few blocks in front of the doors, facing Z (walk along X through it? frame in Z plane = ax 1, walk along X)
    // porch is at local u = PU+B+4 = 16, v=0. Place frame at u=22, v=0, plane ax=1 (Z-varying, walk in X).
    let door = pyr && pyr.door;
    const [dx, , dz] = door || K.W(16, G + 4, 0);
    const px = Math.round(dx + 5), pz = Math.round(dz);
    let py = G;
    try { for (let y = H - 2; y > 2; y--) { const b = getB(px, y, pz); if (b && b !== T.WATER && b !== T.AIR) { py = y; break; } } } catch (_) { py = G; }
    placeReturn(px, py, pz, 1);

    // player lands on the porch, looking at the pyramid (toward -X, yaw = PI/2)
    const [sx, sy, sz] = door || K.W(18, G + 4, 0);
    P.x = sx + 3; P.z = sz; P.y = (typeof sy === 'number' ? sy : G + 4) + 0.1;
    P.yaw = Math.PI / 2; P.pitch = -0.12; P.vy = 0; P.fallTop = null;

    // record the pyramid so the Egyptian folk systems can find it
    const rec = {
      cx: cx - 8, cy: G + 8, cz: cz, hy: G + 4,
      fx: 1, fz: 0, rx: 0, rz: 1,
      L: (u, v) => [cx + u, cz + v]
    };
    rec.cx = K.L(-8, 0)[0]; rec.cz = K.L(-8, 0)[1];
    U.pyr = rec;
    U.built = 1;
    U.st = st;
    U.G = G;
    try { markDirty(cx, cz); } catch (_) {}
    return rec;
  }
  U.gen = genEgypt;

  function bindPyr(rec) {
    try {
      if (!rec) rec = U.pyr;
      if (!rec) return;
      if (!rec.L) rec.L = (u, v) => [rec.cx + u * (rec.fx || 1) + v * (rec.rx || 0), rec.cz + u * (rec.fz || 0) + v * (rec.rz || 1)];
      if (window.__c239) __c239.pyr = rec;
    } catch (e) { ERR('bind', e); }
  }

  function spawnEgypt() {
    const rec = U.pyr;
    bindPyr(rec);
    try {
      if (rec && window.__c240 && typeof __c240.spawnAt === 'function') __c240.spawnAt(rec);
    } catch (e) { ERR('spawn', e); }
    try { U.nFolk = (window.__c240 && __c240.folk && __c240.folk.length) || 0; } catch (_) {}
  }
  U.spawn = spawnEgypt;

  async function enterEgypt() {
    if (typeof enterDim !== 'function') return;
    if (DIM.busy) return;
    if (DIM.cur === NAME) return;
    try { if (DIM.ow) DIM.ow.resumeEgypt = 1; } catch (_) {}
    await enterDim(NAME, genEgypt, spawnEgypt);
    try {
      if (DIM.ow) { DIM.ow.resumeEgypt = 1; DIM.ow.lastDim = NAME; }
      bindPyr(U.pyr);
      setTimeout(spawnEgypt, 400);
      U.entered++;
    } catch (e) { ERR('enter', e); }
  }
  U.enter = enterEgypt;

  // ---- move Egyptians out of the Glencraft overworld ----
  function folkLists() {
    const out = [];
    try { if (window.__c240 && Array.isArray(__c240.folk)) out.push(__c240.folk); } catch (_) {}
    try {
      if (window.__c259) {
        const a = __c259.all;
        if (Array.isArray(a)) out.push(a);
        else if (typeof a === 'function') { const r = a(); if (Array.isArray(r)) out.push(r); }
        if (typeof __c259.out === 'function') { const r = __c259.out(); if (Array.isArray(r)) out.push(r); }
      }
    } catch (_) {}
    return out;
  }
  function evictFolk() {
    if (typeof DIM !== 'undefined' && DIM.cur === NAME) return 0;
    let n = 0;
    try {
      for (const list of folkLists()) {
        for (let i = 0; i < list.length; i++) {
          const f = list[i];
          if (f && f.g && f.g.parent) { f.g.parent.remove(f.g); n++; }
        }
        try { if (window.__c240 && list === __c240.folk) list.length = 0; } catch (_) {}
      }
      // regular egyptian mobs (if any wandered in)
      if (typeof mobs !== 'undefined' && Array.isArray(mobs)) {
        for (let i = mobs.length - 1; i >= 0; i--) {
          const a = mobs[i];
          if (a && (a.kind === 'egyptian' || a.kind === 'egypt' || a.type === 'egyptian')) {
            try { if (typeof removeMob === 'function') removeMob(a); else if (a.g && a.g.parent) a.g.parent.remove(a.g); } catch (_) {}
            n++;
          }
        }
      }
    } catch (e) { ERR('evict', e); }
    if (n) U.evicted += n;
    return n;
  }
  U.evictFolk = evictFolk;

  function wrapFolkSpawn() {
    try {
      if (window.__c240 && __c240.spawnAt && !__c240._1269) {
        const orig = __c240.spawnAt;
        __c240.spawnAt = function (o) {
          if (typeof DIM === 'undefined' || DIM.cur !== NAME) return;
          return orig.apply(this, arguments);
        };
        __c240._1269 = 1;
      }
    } catch (e) { ERR('wrap240', e); }
  }

  // ---- hooks: flint & steel, walk-through, sky / clock, menu, persist, solid ----
  function installHooks() {
    try {
      const ui = useItem;
      useItem = function () {
        try {
          if (!(typeof menuOpen !== 'undefined' && menuOpen) && !(typeof paused !== 'undefined' && paused)
              && !(typeof dead !== 'undefined' && dead) && started
              && typeof selId !== 'undefined' && selId === IT.FLINTSTEEL && typeof cnt === 'function' && cnt(IT.FLINTSTEEL) > 0) {
            const r = typeof raycast === 'function' ? raycast(5) : null;
            if (r && r.prev && r.hit && getB(r.prev[0], r.prev[1], r.prev[2]) === (T.AIR || 0)
                && getB(r.hit[0], r.hit[1], r.hit[2]) === T.GOLDBLOCK) {
              if (lightGold(r.prev[0], r.prev[1], r.prev[2])) {
                try { swing(); } catch (_) {}
                return;
              }
            }
          }
        } catch (e) { ERR('use', e); }
        return ui.apply(this, arguments);
      };
    } catch (e) { ERR('ui', e); }

    try {
      const so = solid;
      solid = function (x, y, z) {
        try {
          if (y >= 0 && y < H && x >= 0 && z >= 0 && x < W && z < D) {
            const b = world[idx(x, y, z)];
            if (b === PORTAL_ID) return false;
          }
        } catch (_) {}
        return so.apply(this, arguments);
      };
    } catch (e) { ERR('solid', e); }

    try {
      const df = dropsFor;
      dropsFor = function (b) { if (b === PORTAL_ID) return []; return df.apply(this, arguments); };
    } catch (_) {}

    try {
      const bc = buildChunk;
      buildChunk = function () {
        const r = bc.apply(this, arguments);
        try {
          if (typeof chunkST !== 'undefined' && chunkST && chunkST[PORTAL_ID] !== 2) {
            chunkST[PORTAL_ID] = 2;
            return bc.apply(this, arguments);
          }
        } catch (_) {}
        return r;
      };
    } catch (_) {}

    // gold haze + travel, Egypt clock, gold texture spin, evict overworld folk
    let goldT = 0, goldArm = true, goldFx = null;
    try {
      const us = updateSky;
      updateSky = function (dt) {
        const r = us.apply(this, arguments);
        try {
          if (U.goldTex) U.goldTex.rotation += (dt || 0) * 0.9;
          if (typeof DIM !== 'undefined' && DIM.cur === NAME) {
            try { const el = $('clockTx'); if (el) el.textContent = 'Egypt land'; } catch (_) {}
            try { const sun = $('sunIc'); if (sun) sun.classList.remove('moon'); } catch (_) {}
            // Earth-like air: a gentle desert haze, far enough to see the island, the sea and the sky
            try {
              if (scene && scene.fog) {
                scene.fog.color.setRGB(0.72, 0.80, 0.88);
                scene.fog.near = 28;
                scene.fog.far = PERF ? 140 : 210;
              }
              if (typeof hemi !== 'undefined' && hemi) { hemi.intensity = Math.max(hemi.intensity, 0.85); hemi.color.setRGB(1, 0.97, 0.9); hemi.groundColor.setRGB(0.72, 0.62, 0.42); }
              if (typeof sunL !== 'undefined' && sunL) { sunL.intensity = Math.max(sunL.intensity, 0.7); }
            } catch (_) {}
          }
          if (started && !paused && typeof DIM !== 'undefined' && !DIM.busy) {
            const fb = getB(Math.floor(P.x), Math.floor(P.y + 0.2), Math.floor(P.z));
            const bb = getB(Math.floor(P.x), Math.floor(P.y + 1.2), Math.floor(P.z));
            const inG = fb === PORTAL_ID || bb === PORTAL_ID;
            if (!goldFx) {
              goldFx = document.createElement('div');
              goldFx.style.cssText = 'position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle,rgba(230,180,50,.18),rgba(120,70,10,.8));opacity:0;transition:opacity .2s;z-index:5';
              document.body.appendChild(goldFx);
            }
            if (inG && goldArm) {
              goldT += dt || 0; goldFx.style.opacity = Math.min(1, goldT / 2);
              const need = (current && current.mode === 'creative') ? 0.8 : 2.2;
              if (goldT > need) {
                goldT = 0; goldArm = false; goldFx.style.opacity = 0;
                if (DIM.cur === NAME) { try { if (DIM.ow) DIM.ow.resumeEgypt = 0; } catch (_) {} exitDim(); }
                else enterEgypt();
              }
            } else {
              if (!inG) goldArm = true;
              goldT = 0; goldFx.style.opacity = 0;
            }
          }
        } catch (e) { ERR('sky', e); }
        return r;
      };
    } catch (e) { ERR('skyw', e); }

    // persist "player was in Egypt"
    try {
      const sw = saveWorld;
      saveWorld = function (quiet) {
        try {
          if (typeof DIM !== 'undefined' && DIM.cur === NAME && DIM.ow) {
            DIM.ow.resumeEgypt = 1; DIM.ow.lastDim = NAME;
          }
        } catch (_) {}
        return sw.apply(this, arguments);
      };
    } catch (_) {}
    try {
      const ew = enterWorld;
      enterWorld = function (save) {
        let flag = !!(save && (save.resumeEgypt || save.lastDim === NAME));
        const r = ew.apply(this, arguments);
        try {
          if (!flag && current && (current.resumeEgypt || current.lastDim === NAME)) flag = true;
          if (flag) setTimeout(() => { try { if (started && typeof DIM !== 'undefined' && !DIM.cur && !DIM.busy) enterEgypt(); } catch (_) {} }, 700);
        } catch (_) {}
        return r;
      };
    } catch (e) { ERR('ew', e); }

    // wrap exitDim to clear the resume flag when the player leaves on purpose
    try {
      const ex = exitDim;
      exitDim = async function () {
        try { if (DIM && DIM.ow && DIM.cur === NAME) DIM.ow.resumeEgypt = 0; } catch (_) {}
        return ex.apply(this, arguments);
      };
    } catch (_) {}

    addMenu();
  }

  function addMenu() {
    try {
      if (typeof document === 'undefined') return;
      if ($('egyptLandBtn')) return;
      const t = $('teleportBuildsBtn') || $('saveQuit') || $('restoreBackupBtn');
      if (!t || !t.parentNode) return;
      const b = document.createElement('button');
      b.className = (t.className || 'btn alt');
      b.id = 'egyptLandBtn';
      b.setAttribute('data-testid', 'pause-egypt-land-button');
      b.textContent = 'Teleport to Egypt land';
      b.addEventListener('click', () => {
        try {
          if (typeof DIM !== 'undefined' && DIM.cur === NAME) {
            if (DIM.ow) DIM.ow.resumeEgypt = 0;
            exitDim();
          } else enterEgypt();
          try { setPause(false); } catch (_) {}
        } catch (e) { ERR('menu', e); }
      });
      t.parentNode.insertBefore(b, t);
      U.menu = 1;
    } catch (e) { ERR('menuadd', e); }
  }
  U.addMenu = addMenu;

  // ---- boot ----
  let boots = 0;
  function boot() {
    boots++;
    try { installBlock(); } catch (e) { ERR('iblk', e); }
    try { if (boots === 1) installHooks(); } catch (e) { ERR('ihook', e); }
    try { wrapFolkSpawn(); } catch (_) {}
    try { addMenu(); } catch (_) {}
    try { evictFolk(); } catch (_) {}
    try {
      const btn = $('egyptLandBtn');
      if (btn) btn.textContent = (typeof DIM !== 'undefined' && DIM.cur === NAME) ? 'Return from Egypt land' : 'Teleport to Egypt land';
    } catch (_) {}
  }
  const iv = setInterval(() => { try { boot(); } catch (e) { ERR('boot', e); } if (boots > 120) clearInterval(iv); }, 50);
  setTimeout(() => { try { boot(); } catch (_) {}; }, 300);
  setTimeout(() => { try { boot(); } catch (_) {}; }, 1500);
  setTimeout(() => { try { boot(); evictFolk(); } catch (_) {}; }, 4000);
  // keep evicting overworld folk in case a later tick respawns them (c270)
  setInterval(() => { try { wrapFolkSpawn(); evictFolk(); } catch (_) {}; }, 1500);
})(typeof window !== 'undefined' ? window : this);
