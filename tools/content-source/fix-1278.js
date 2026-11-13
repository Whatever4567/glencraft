/* GLX-FIX1278 (v1.2.78): Less lag: rain, drops, animations and mobs only run near you.
   Ores get more common the deeper you go; diamonds common near y -200.
   Removed obsidian/gold portal blocks from deep caves.

   Simulation-distance pass only. Chunk meshing, view distance, the far
   plane, fog, the render-distance slider and its defaults are not
   touched (they stay as 1.2.75 / 1.2.77 left them). Guns, muskets,
   and the 1.2.75 potion-style pickaxe / bucket / torch grip are not
   touched. This IIFE never wraps held-frame apply / repose or
   renderer.render. First-person hands stay hidden in third person.
   The gold D-pad is left alone. The 1.2.76 map seating is left as
   1.2.77 shipped it (the pinch grip is not in this build). */
(function fix1278() {
  const SPAWN_RADIUS = 100;
  const DESPAWN_RADIUS = 150;
  const ORE_DEPTH_MIN = 0;
  const ORE_DEPTH_MAX = -236;
  const DIAMOND_PEAK_Y = -200;
  const DROP_NEAR = 16;
  const ABY = 773;
  const U = window.__fix1278 = {
    SPAWN_RADIUS: SPAWN_RADIUS,
    DESPAWN_RADIUS: DESPAWN_RADIUS,
    ORE_DEPTH_MIN: ORE_DEPTH_MIN,
    ORE_DEPTH_MAX: ORE_DEPTH_MAX,
    DIAMOND_PEAK_Y: DIAMOND_PEAK_Y,
    err: null, nSpawnBlock: 0, nDespawn: 0, nOre: 0, nPortal: 0,
    nScrub: 0, ft: null, on: 1
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const PH = (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && !!PERF)
    || (typeof navigator !== 'undefined' && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || ''));
  const dim = () => (typeof DIM !== 'undefined' && DIM && DIM.cur) || null;
  const overworld = () => !dim();
  const inNether = () => dim() === 'hell';
  const inEgypt = () => { const d = dim(); return !!(d && /egypt/i.test(String(d))); };
  const agBox = () => { try { const a = window.__agw; return a && a.ok && Array.isArray(a.box) ? a.box : null; } catch (_) { return null; } };
  const inAgBox = (x, y, z) => { const b = agBox(); return !!(b && x >= b[0] - 2 && x <= b[3] + 2 && y >= b[1] - 2 && y <= b[4] + 2 && z >= b[2] - 2 && z <= b[5] + 2); };
  const playerInAgartha = () => { try { if (dim() === 'agartha') return true; const b = agBox(); if (!b || typeof P === 'undefined' || !P) return false; return inAgBox(P.x, P.y, P.z); } catch (_) { return false; } };
  const d3 = (x, y, z) => Math.hypot(x - P.x, y - P.y, z - P.z);
  const ready = () => !!(typeof started !== 'undefined' && started && typeof P !== 'undefined' && P);

  /* ---------- spawn gate: nothing is created beyond SPAWN_RADIUS ---------- */
  try {
    const sm = spawnMob;
    spawnMob = function (kind) {
      try {
        if (ready() && !window.__fix1278ok) {
          const s = window.__eggSpot;
          if (s && s.length) {
            const y = s[1] != null ? s[1] : P.y;
            if (d3(s[0], y, s[2]) > SPAWN_RADIUS) { U.nSpawnBlock++; return null; }
          }
        }
      } catch (e) { ERR('sm', e); }
      return sm.apply(this, arguments);
    };
  } catch (e) { ERR('smw', e); }

  try {
    if (typeof window.hellSpawn === 'function') {
      const hs = window.hellSpawn;
      window.hellSpawn = function () {
        if (!inNether()) { U.nSpawnBlock++; return; }
        if (ready() && arguments.length >= 3) {
          /* some callers pass a position; the usual hellSpawn picks a near build itself */
        }
        return hs.apply(this, arguments);
      };
    }
    if (typeof window.hellPopulate === 'function') {
      const hp = window.hellPopulate;
      window.hellPopulate = function () {
        if (!inNether()) return;
        return hp.apply(this, arguments);
      };
    }
  } catch (e) { ERR('hell', e); }

  /* ---------- despawn / freeze / dim gates ---------- */
  function isKept(a) {
    return !!(a && (a.named || a.tamed || a.tame || a.owner || a.leash || a.noDespawn
      || a === (typeof heldBy !== 'undefined' ? heldBy : null)
      || (a.kind === 'treeman' && (a.state === 'chase' || a.state === 'grab' || a.state === 'twist'))
      || a.kind === 'saucer' || a.kind === 'ufo' || a.popstar || a.kind === 'popstar' || a.kind === 'unicorn'));
  }
  function inHomeDim(a) {
    if (a.hell && !inNether()) return false;
    if ((a.egypt || a.kind === 'egyptian' || a.kind === 'egypt') && !inEgypt()) return false;
    if ((a.agartha || a.kind === 'agarthan') && !playerInAgartha()) return false;
    return true;
  }
  function park(a) {
    a.__park1278 = 1;
    try { if (a.g) a.g.visible = false; } catch (_) {}
  }
  function unpark(a) {
    if (!a.__park1278) return;
    a.__park1278 = 0;
    try { if (a.g) a.g.visible = true; } catch (_) {}
  }
  function radiusPass() {
    if (!ready() || typeof mobs === 'undefined' || !mobs) return;
    for (let i = mobs.length - 1; i >= 0; i--) {
      const a = mobs[i];
      if (!a || !a.g) continue;
      const p = a.g.position, d = d3(p.x, p.y, p.z);
      if (!inHomeDim(a) || d > DESPAWN_RADIUS) {
        if (isKept(a) || a.__1268 || a.garrison || (a.kind === 'clansman' && (a.ci || a.home))) { park(a); continue; }
        try {
          if (typeof removeMob === 'function') removeMob(a);
          else { try { scene.remove(a.g); } catch (_) {} mobs.splice(i, 1); }
          U.nDespawn++;
        } catch (e) { ERR('rm', e); }
        continue;
      }
      if (d <= SPAWN_RADIUS) { unpark(a); a.__freeze1278 = 0; }
      else a.__freeze1278 = 1;
    }
    /* Egyptians (decorative, not always in mobs) */
    try {
      const C = window.__c259, ok = inEgypt();
      const list = C && typeof C.all === 'function' ? C.all() : null;
      if (list) for (let i = 0; i < list.length; i++) {
        const e = list[i]; if (!e || !e.g) continue;
        const p = e.g.position, d = d3(p.x, p.y, p.z);
        e.g.visible = !!(ok && d <= DESPAWN_RADIUS);
        e.__freeze1278 = !ok || d > SPAWN_RADIUS;
      }
    } catch (e) { ERR('eg', e); }
    /* Agarthans: hide the city folk root when you are not there / not in range */
    try {
      const sun = typeof scene !== 'undefined' && scene.getObjectByName && scene.getObjectByName('agsun');
      if (sun && sun.parent) {
        const ok = playerInAgartha();
        const d = d3(sun.position.x, sun.position.y, sun.position.z);
        sun.parent.visible = !!(ok && d <= DESPAWN_RADIUS);
      }
    } catch (e) { ERR('ag', e); }
  }

  try {
    const um = updateMobs;
    updateMobs = function (dt) {
      const held = [];
      try {
        if (ready() && typeof mobs !== 'undefined' && mobs) {
          for (let i = mobs.length - 1; i >= 0; i--) {
            const a = mobs[i]; if (!a || !a.g) continue;
            if (a.__park1278) { held.push(mobs.splice(i, 1)[0]); continue; }
            const p = a.g.position, d = d3(p.x, p.y, p.z);
            /* AI and walk animations only inside SPAWN_RADIUS; mid-range (100-150) is frozen until despawn */
            if (d > SPAWN_RADIUS) { a.__freeze1278 = 1; held.push(mobs.splice(i, 1)[0]); }
          }
        }
      } catch (e) { ERR('hold', e); }
      let r;
      try { r = um.apply(this, arguments); }
      finally {
        try { for (let i = 0; i < held.length; i++) mobs.push(held[i]); } catch (_) {}
        try { radiusPass(); } catch (e) { ERR('rp', e); }
      }
      return r;
    };
  } catch (e) { ERR('um', e); }

  /* ---------- rain: already camera-local; cap streaks and drop the outer sheet on phones ---------- */
  try {
    const ur = updateRain;
    const RAIN_CAP = PH ? 80 : 200;
    updateRain = function (dt) {
      let restore = null;
      try {
        if (typeof weather !== 'undefined' && weather && typeof WEATHER !== 'undefined' && WEATHER[weather.type]) {
          const w = WEATHER[weather.type];
          if (w && w.drops > RAIN_CAP) { restore = [w, w.drops]; w.drops = RAIN_CAP; }
        }
      } catch (_) {}
      const r = ur.apply(this, arguments);
      try { if (restore) restore[0].drops = restore[1]; } catch (_) {}
      try {
        const C = window.__c164;
        if (C && C.sheets && C.sheets[1] && C.sheets[1].o && PH) C.sheets[1].o.visible = false;
        if (C && C.lines && C.lines.geometry && C.lines.geometry.setDrawRange) {
          const cap = (PH ? 160 : 400) * 2;
          const geo = C.lines.geometry;
          if (geo.drawRange && geo.drawRange.count > cap) geo.setDrawRange(0, cap);
        }
      } catch (_) {}
      return r;
    };
  } catch (e) { ERR('rain', e); }

  /* ---------- dropped items: tick / animate within DROP_NEAR, cap, merge, despawn old ---------- */
  try {
    const ud = updateDrops;
    const DROP_CAP = PH ? 32 : 64;
    const DROP_AGE = 120;
    updateDrops = function (dt) {
      if (typeof drops === 'undefined' || !drops || !ready()) return ud.apply(this, arguments);
      try {
        for (let i = 0; i < drops.length; i++) {
          const a = drops[i]; if (!a || a.pick !== undefined) continue;
          for (let j = i + 1; j < drops.length; j++) {
            const b = drops[j]; if (!b || b.id !== a.id || b.pick !== undefined) continue;
            if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1.15) {
              a.n += b.n;
              try { scene.remove(b.m); } catch (_) {}
              drops.splice(j, 1); j--;
            }
          }
        }
        while (drops.length > DROP_CAP) {
          let far = 0, fd = -1;
          for (let i = 0; i < drops.length; i++) {
            const d = drops[i]; if (d.pick !== undefined) continue;
            const dist = Math.hypot(d.x - P.x, d.y - P.y, d.z - P.z);
            if (dist > fd) { fd = dist; far = i; }
          }
          if (fd < 0) break;
          try { scene.remove(drops[far].m); } catch (_) {}
          drops.splice(far, 1);
        }
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i];
          const dist = Math.hypot(d.x - P.x, d.y - P.y, d.z - P.z);
          if (d.age > DROP_AGE && dist > 4 && d.pick === undefined) {
            try { scene.remove(d.m); } catch (_) {}
            drops.splice(i, 1); continue;
          }
          if (dist > DROP_NEAR && d.pick === undefined) {
            if (d.m) d.m.visible = false;
            d.__skip1278 = 1;
            d.age += dt;
          } else {
            if (d.m) d.m.visible = true;
            d.__skip1278 = 0;
          }
        }
        const hold = [];
        for (let i = drops.length - 1; i >= 0; i--) if (drops[i].__skip1278) hold.push(drops.splice(i, 1)[0]);
        try { return ud.apply(this, arguments); }
        finally { for (let i = 0; i < hold.length; i++) drops.push(hold[i]); }
      } catch (e) { ERR('drops', e); return ud.apply(this, arguments); }
    };
  } catch (e) { ERR('dw', e); }

  /* ---------- ore depth (new chunks / procedural deep only) ---------- */
  function h3(x, y, z) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483647);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function depthMult(y) {
    if (y > ORE_DEPTH_MIN || y < ORE_DEPTH_MAX) return 1;
    const t = (ORE_DEPTH_MIN - y) / (ORE_DEPTH_MIN - ORE_DEPTH_MAX);
    return 1 + 3 * Math.max(0, Math.min(1, t));
  }
  function diamondAmt(y) {
    if (y > -150 || y < ORE_DEPTH_MAX) return 0;
    if (y <= DIAMOND_PEAK_Y) return 1;
    return (-150 - y) / (-150 - DIAMOND_PEAK_Y);
  }
  function maybeOre(x, y, z, b) {
    if (y > ORE_DEPTH_MIN || y < ORE_DEPTH_MAX) return b;
    if (!b) return b;
    if (inAgBox(x, y, z)) return b;
    const ST = T.STONE, DS = T.DEEPSLATE || ST;
    const GLO = 771, TILE = T.DSTILE || DS;
    const BS = T.BLACKSTONE || 0;
    const HR = T.HELLROCK || 0;
    const ok = b === ST || b === DS || b === GLO || b === TILE || (BS && b === BS) || (HR && b === HR)
      || b === T.ANDESITE || b === T.GRANITE || b === T.DIORITE || b === T.TUFF;
    if (!ok) return b;
    const m = depthMult(y);
    const dk = diamondAmt(y);
    const h = h3(x, y, z);
    /* at the peak, about 1.4 % of eligible stone is diamond — visibly common */
    if (dk > 0 && h < 0.014 * dk) { U.nOre++; return T.DIAMONDORE; }
    const h2 = h3(x + 19, y - 7, z + 3);
    const rate = 0.016 * m;
    if (h2 >= rate) return b;
    U.nOre++;
    const pick = h3(z, x, y + 11);
    if (pick < 0.22) return T.COALORE;
    if (pick < 0.40) return T.IRONORE;
    if (pick < 0.52) return T.COPPERORE || T.IRONORE;
    if (pick < 0.62) return T.GOLDORE;
    if (pick < 0.72) return T.REDORE || T.GOLDORE;
    if (pick < 0.82) return T.SILVERORE || T.IRONORE;
    if (pick < 0.90) return T.LAZORE || T.COALORE;
    return T.COALORE;
  }
  U.depthMult = depthMult;
  U.diamondAmt = diamondAmt;
  U.maybeOre = maybeOre;

  /* ---------- deep-cave obsidian / gold portal blocks ----------
     Crystal-layer fill used block 773 (ABY), which 1.2.69 reused as the
     Egypt gold portal, so deep caves grew obsidian / gold-portal masses
     that blocked (and could teleport) the path. New gen emits stone
     instead. Already-meshed chunks are flushed once; a cheap approach
     scrub turns leftover frames into air so they no longer block. */
  function isPortalFluid(b) {
    if (!b) return false;
    if (b === ABY || b === (T.EGYPTPORTAL || ABY)) return true;
    if (typeof T.PORTAL === 'number' && b === T.PORTAL) return true;
    return false;
  }
  function stripPortalGen(x, y, z, b) {
    if (y >= 0 || y < ORE_DEPTH_MAX) return b;
    if (dim()) return b;
    if (inAgBox(x, y, z)) return b;
    if (isPortalFluid(b)) { U.nPortal++; return T.DEEPSLATE || T.STONE; }
    return b;
  }
  function hookGen() {
    try {
      const V = window.__v1217;
      if (V && typeof V.gen === 'function' && !V.gen.f1278) {
        const g0 = V.gen;
        const g = function (x, y, z) {
          let b = g0.apply(this, arguments);
          b = stripPortalGen(x, y, z, b);
          b = maybeOre(x, y, z, b);
          return b;
        };
        g.f1278 = 1;
        V.gen = g;
      }
    } catch (e) { ERR('vgen', e); }
    try {
      const e = window.__c320;
      if (e && typeof e.fearth === 'function' && !e.fearth.f1278) {
        const f0 = e.fearth;
        const f = function (x, y, z) {
          let b = f0.apply(this, arguments);
          if (y < 0 && y >= ORE_DEPTH_MAX && overworld() && !inAgBox(x, y, z)) {
            b = stripPortalGen(x, y, z, b);
            b = maybeOre(x, y, z, b);
          }
          return b;
        };
        for (const k in f0) try { f[k] = f0[k]; } catch (_) {}
        f.f1278 = 1;
        e.fearth = f;
      }
    } catch (e) { ERR('fe', e); }
  }
  let flushed = 0;
  function flushDeep() {
    if (flushed) return;
    flushed = 1;
    try { if (window.__c324 && __c324.cache) __c324.cache.clear(); } catch (_) {}
    try { const e = window.__c320; if (e) { e.dirty = 1; e.edgeClr && e.edgeClr(); } } catch (_) {}
  }
  hookGen();
  flushDeep();

  /* leftover frames: on entering a deep chunk, replace portal fluid and
     a tight obsidian / gold frame around it with air so the path opens. */
  let lastScrub = '';
  function scrubNear() {
    if (!ready() || !overworld() || P.y >= 0 || typeof getB !== 'function' || typeof setB !== 'function') return;
    const cx = Math.floor(P.x / 16), cz = Math.floor(P.z / 16), cy = Math.floor(P.y / 16);
    const key = cx + ',' + cy + ',' + cz;
    if (key === lastScrub) return;
    lastScrub = key;
    const OB = T.OBSIDIAN, GOLD = T.GOLDBLOCK || 75;
    const isFrame = b => b === OB || b === GOLD;
    const x0 = (cx << 4) - 2, x1 = x0 + 19, z0 = (cz << 4) - 2, z1 = z0 + 19;
    const y0 = Math.max(ORE_DEPTH_MAX, (cy << 4) - 4), y1 = Math.min(-1, (cy << 4) + 20);
    const seen = new Set();
    const air = 0;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
      let b;
      try { b = getB(x, y, z); } catch (_) { continue; }
      if (!isPortalFluid(b)) continue;
      const k = x + ',' + y + ',' + z;
      if (seen.has(k)) continue;
      /* clear the fluid, and any adjoining 2-6 wide / 3-6 tall frame */
      try { setB(x, y, z, air); U.nScrub++; } catch (_) {}
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 5; dy++) for (let dz = -1; dz <= 1; dz++) {
        if (!dx && !dy && !dz) continue;
        const xx = x + dx, yy = y + dy, zz = z + dz;
        if (yy >= 0 || yy < ORE_DEPTH_MAX) continue;
        let q;
        try { q = getB(xx, yy, zz); } catch (_) { continue; }
        if (isPortalFluid(q) || isFrame(q)) {
          try { setB(xx, yy, zz, air); U.nScrub++; } catch (_) {}
          seen.add(xx + ',' + yy + ',' + zz);
        }
      }
    }
  }

  /* already-generated fluid must not block walking, even before a remesh */
  try {
    const so = solid;
    solid = function (x, y, z) {
      try {
        if (overworld() && y < 0 && y >= ORE_DEPTH_MAX && !inAgBox(x, y, z) && typeof getB === 'function') {
          const b = getB(x, y, z);
          if (isPortalFluid(b)) return false;
        }
      } catch (_) {}
      return so.apply(this, arguments);
    };
  } catch (e) { ERR('solid', e); }

  /* cheap first-person hide of the player's own world-model when looking up.
     Looking-down (P.pitch < -0.5) already shows the body on purpose. */
  try {
    const up = updatePlayer;
    updatePlayer = function (dt) {
      const r = up.apply(this, arguments);
      try {
        const third = (typeof thirdPerson !== 'undefined' && thirdPerson)
          || (typeof camMode !== 'undefined' && camMode)
          || (typeof SET !== 'undefined' && SET && SET.third);
        if (!third && typeof P !== 'undefined' && P && !(P.pitch < -0.5)) {
          const m = (typeof worldModel !== 'undefined' && worldModel)
            || (typeof playerModel !== 'undefined' && playerModel)
            || (typeof bodyMesh !== 'undefined' && bodyMesh)
            || (window.__c100 && __c100.body);
          if (m && m.visible && m !== (window.__fpa && (window.__fpa.rig || window.__fpa))) {
            /* only hide a clearly-tagged world body, never the FP arms */
            if (m.name === 'player' || m.userData && (m.userData.worldBody || m.userData.playerBody)) m.visible = false;
          }
        }
      } catch (_) {}
      return r;
    };
  } catch (e) { ERR('fp', e); }

  setInterval(() => {
    try { hookGen(); } catch (e) { ERR('hg', e); }
    try { if (ready()) { radiusPass(); scrubNear(); } } catch (e) { ERR('iv', e); }
  }, 400);

  /* optional frame-time sample (does not wrap renderer.render) */
  try {
    if (typeof loop === 'function') {
      const lp = loop;
      let last = 0, acc = 0, n = 0;
      loop = function (now) {
        if (last && now) {
          const ft = now - last;
          if (ft > 0 && ft < 1000) { acc += ft; n++; if (n % 45 === 0) U.ft = { avg: acc / n, n: n, ms: +(acc / n).toFixed(2) }; }
        }
        last = now;
        return lp.apply(this, arguments);
      };
    }
  } catch (_) {}
})();
