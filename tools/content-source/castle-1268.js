/* GLX-CASTLE1268 (v1.2.68): black and white skeleton garrisons, and a
   path from the human castle to the farmers with 25 castle folk.
   The gold D-pad is left alone. First-person hands are not touched. */
(function castle1268(WIN) {
  const U = WIN.__castle1268 = {
    on: 0, err: null, version: '1.2.68-garrison',
    black: 0, mossy: 0, humans: 0, visits: 0, pathLen: 0, frames: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };

  const MAX = { black: 100, mossy: 50, human: 25 };
  const LIVE = 28;           /* concurrent live garrison skeletons */
  const HUMAN_LIVE = 25;
  const R_CASTLE = 26;       /* they live around + inside */
  const R_LOAD = 56;         /* only simulate / render in loaded range */
  const R_PATROL = 22;

  function groundAt(x, z) {
    try { if (typeof skyTop === 'function') { const t = skyTop(Math.floor(x), Math.floor(z)); if (t > 1) return t; } } catch (_) {}
    try { if (typeof solidTop === 'function') return solidTop(Math.floor(x), Math.floor(z)) + 1; } catch (_) {}
    try { if (typeof g9top === 'function') return g9top(Math.floor(x), Math.floor(z)) + 1; } catch (_) {}
    return 8;
  }
  function mark(x, z) {
    try { if (typeof markDirty === 'function') markDirty(x, z); } catch (_) {}
    try { if (typeof dirtyAround === 'function') dirtyAround(x, z); } catch (_) {}
  }
  function put(x, y, z, b) {
    if (x < 1 || z < 1 || y < 1) return;
    try { if (typeof W === 'number' && (x >= W - 1 || z >= D - 1 || y >= H - 1)) return; } catch (_) {}
    try {
      if (typeof setB === 'function') setB(x, y, z, b);
      else if (typeof world !== 'undefined' && typeof idx === 'function') world[idx(x, y, z)] = b;
    } catch (_) {}
    mark(x, z);
  }
  function blk(x, y, z) {
    try { if (typeof getB === 'function') return getB(x, y, z) | 0; } catch (_) {}
    return 0;
  }

  function allCastles() {
    try { if (typeof g9castles !== 'undefined' && g9castles && g9castles.length) return g9castles; } catch (_) {}
    return [];
  }
  function castle(k) {
    for (const c of allCastles()) if (c && c[0] === k) return { k: c[0], x: c[1], z: c[2], y: groundAt(c[1], c[2]), raw: c };
    return null;
  }
  function farms() {
    try {
      const C = WIN.__c113;
      if (C && typeof C.farmsList === 'function') {
        const l = C.farmsList();
        if (l && l.length) return l;
      }
    } catch (_) {}
    return [];
  }

  /* ---------- persist kill counts + path ---------- */
  function key() {
    try { return 'glen_garrison_' + ((typeof current !== 'undefined' && current && current.id) || 'default'); } catch (_) { return 'glen_garrison_default'; }
  }
  const ST = { black: { kills: 0 }, mossy: { kills: 0 }, path: null, pathBuilt: 0 };
  function loadST() {
    try {
      const raw = localStorage.getItem(key());
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.black) ST.black.kills = d.black.kills | 0;
      if (d.mossy) ST.mossy.kills = d.mossy.kills | 0;
      if (d.path && Array.isArray(d.path)) { ST.path = d.path; ST.pathBuilt = 1; U.pathLen = d.path.length; }
    } catch (e) { ERR('load', e); }
  }
  function saveST() {
    try {
      localStorage.setItem(key(), JSON.stringify({
        black: { kills: ST.black.kills | 0 },
        mossy: { kills: ST.mossy.kills | 0 },
        path: ST.path,
        pathBuilt: ST.pathBuilt ? 1 : 0
      }));
    } catch (_) {}
  }
  U.save = saveST;
  U.state = ST;

  /* cap: once any are killed, the garrison can never refill to the original lot.
     cap = max(floor(max*0.12), max - kills). After a wipe, ~12% may slowly come back. */
  function cap(k) {
    const max = MAX[k] || 0, kills = (ST[k] && ST[k].kills) || 0;
    if (!kills) return max;
    return Math.max(Math.floor(max * 0.12), max - kills);
  }
  U.cap = cap;

  /* ---------- roster: logical garrison, materialized nearby ---------- */
  const ROSTER = { black: null, mossy: null };
  function seedRoster(k) {
    const c = castle(k);
    if (!c) return null;
    const n = MAX[k], slots = [];
    let s = ((c.x * 7919 + c.z * 104729) >>> 0) || 1;
    const rnd = () => (s = (Math.imul(s, 16807) >>> 0) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) {
      const ang = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * R_CASTLE;
      const x = c.x + Math.cos(ang) * r, z = c.z + Math.sin(ang) * r;
      const inside = rnd() < 0.35; /* some live inside, some around */
      const ir = inside ? rnd() * 10 : r;
      const ix = c.x + Math.cos(ang) * ir, iz = c.z + Math.sin(ang) * ir;
      slots.push({ i: i, x: ix, z: iz, y: groundAt(ix, iz), alive: 1, respawnT: 0, live: null });
    }
    /* apply existing kills: the first `kills` slots start dead, with a slow respawn if under cap */
    const kills = (ST[k] && ST[k].kills) || 0;
    const cmax = cap(k);
    let alive = n;
    for (let i = 0; i < n && alive > cmax; i++) {
      slots[i].alive = 0;
      slots[i].respawnT = 40 + Math.random() * 80;
      alive--;
    }
    return { k: k, c: c, slots: slots };
  }
  function ensureRosters() {
    for (const k of ['black', 'mossy']) {
      if (!ROSTER[k] && castle(k)) ROSTER[k] = seedRoster(k);
    }
  }

  function spawnSkel(kind, x, y, z, home) {
    let m = null;
    try {
      WIN.__egg = true; WIN.__eggSpot = [x, y, z, Math.floor(x), Math.floor(z)];
      if (typeof spawnMob === 'function') m = spawnMob(kind);
    } catch (e) { ERR('spS', e); }
    finally { try { WIN.__egg = false; WIN.__eggSpot = null; } catch (_) {} }
    if (!m) return null;
    m.__1268 = 1;
    m.shaded = 1;
    m.hostile = false;          /* they just live here until attacked */
    m.home = home;
    m.garrison = 1;
    m.kind = kind;
    try { m.g.position.set(x, y, z); } catch (_) {}
    m.ang = Math.random() * Math.PI * 2;
    try { m.g.rotation.y = m.ang; } catch (_) {}
    return m;
  }

  function despawnLive(slot) {
    const a = slot.live;
    if (!a) return;
    try { if (a.g && a.g.parent) a.g.parent.remove(a.g); } catch (_) {}
    try { const i = mobs.indexOf(a); if (i >= 0) mobs.splice(i, 1); } catch (_) {}
    if (a.g) { slot.x = a.g.position.x; slot.z = a.g.position.z; slot.y = a.g.position.y; }
    slot.live = null;
  }

  function materialize(dt) {
    ensureRosters();
    if (typeof P === 'undefined' || !P) return;
    const px = P.x, pz = P.z;
    for (const k of ['black', 'mossy']) {
      const R = ROSTER[k];
      if (!R) continue;
      const kind = k === 'black' ? 'blackskel' : 'skeleton';
      const cmax = cap(k);
      let aliveN = 0;
      for (const sl of R.slots) {
        if (sl.alive) aliveN++;
        else if (sl.respawnT > 0) {
          sl.respawnT -= dt;
          if (sl.respawnT <= 0 && aliveN < cmax) {
            sl.alive = 1; sl.y = groundAt(sl.x, sl.z); aliveN++;
          }
        }
      }
      /* live nearby only */
      let liveN = 0;
      const nearby = [];
      for (const sl of R.slots) {
        if (!sl.alive) { if (sl.live) despawnLive(sl); continue; }
        const d = Math.hypot(sl.x - px, sl.z - pz);
        if (d < R_LOAD) nearby.push({ sl: sl, d: d });
        else if (sl.live) despawnLive(sl);
      }
      nearby.sort((a, b) => a.d - b.d);
      for (let i = 0; i < nearby.length; i++) {
        const sl = nearby[i].sl;
        if (i >= LIVE) { if (sl.live) despawnLive(sl); continue; }
        if (!sl.live || !sl.live.g || sl.live.hp <= 0) {
          if (sl.live && sl.live.hp <= 0) { /* death handled in hook */ }
          sl.live = spawnSkel(kind, sl.x, sl.y || groundAt(sl.x, sl.z), sl.z, [R.c.x, R.c.z]);
          if (sl.live) { sl.live._slot = sl; sl.live._gk = k; liveN++; }
        } else liveN++;
      }
      if (k === 'black') U.black = aliveN; else U.mossy = aliveN;
    }
  }

  /* patrol: wander near home, do not hunt the player unless angry (after being hit) */
  function stepGarrison(a, dt) {
    if (!a || !a.g) return;
    a.shaded = 1;
    a.burning = 0;
    if (a.angry > 0) {
      a.angry -= dt;
      a.hostile = true;
      return; /* let the default hostile AI (already run) chase */
    }
    a.hostile = false;
    if (!a.home) return;
    const p = a.g.position;
    const hd = Math.hypot(p.x - a.home[0], p.z - a.home[1]);
    a.timer = (a.timer || 0) - dt;
    if (hd > R_PATROL) {
      a.ang = Math.atan2(a.home[0] - p.x, a.home[1] - p.z);
      a.moving = true;
    } else if (a.timer <= 0) {
      a.timer = 2 + Math.random() * 5;
      a.moving = Math.random() < 0.55;
      a.ang += (Math.random() - 0.5) * 1.6;
    }
    if (a.moving) {
      const spd = (a.speed || 2.2) * 0.55;
      const nx = p.x + Math.sin(a.ang) * spd * dt, nz = p.z + Math.cos(a.ang) * spd * dt;
      try {
        if (typeof moveMob === 'function') moveMob(a, nx - p.x, nz - p.z);
        else { p.x = nx; p.z = nz; }
      } catch (_) { p.x = nx; p.z = nz; }
      try { a.g.rotation.y = a.ang; } catch (_) {}
    }
    /* keep the slot position in sync so they persist when culled */
    if (a._slot) { a._slot.x = p.x; a._slot.z = p.z; a._slot.y = p.y; }
  }

  function onKilled(a) {
    const k = a._gk, sl = a._slot;
    if (!k || !ST[k]) return;
    ST[k].kills = (ST[k].kills | 0) + 1;
    if (sl) { sl.alive = 0; sl.live = null; sl.respawnT = 50 + Math.random() * 90; }
    saveST();
  }

  /* ---------- path + bridges: human castle to the farmers ---------- */
  const PATH = [];
  U.path = PATH;

  function waterish(x, z) {
    try {
      const t = (typeof solidTop === 'function') ? solidTop(x, z) : groundAt(x, z) - 1;
      const sea = (typeof SEA === 'number') ? SEA : 8;
      const w = (typeof T !== 'undefined' && T.WATER) || 5;
      if (t <= sea) return true;
      if (blk(x, t, z) === w || blk(x, t + 1, z) === w) return true;
      if (t < sea) return true;
    } catch (_) {}
    return false;
  }

  function route(ax, az, bx, bz) {
    const G = 2;
    const x0 = Math.round(ax / G) * G, z0 = Math.round(az / G) * G;
    const x1 = Math.round(bx / G) * G, z1 = Math.round(bz / G) * G;
    const key = (x, z) => x + ',' + z;
    const open = [[0, x0, z0, 0, null]]; /* f, x, z, g, parent */
    const best = new Map();
    best.set(key(x0, z0), 0);
    let found = null, steps = 0;
    const WW = (typeof W === 'number') ? W : 56, DD = (typeof D === 'number') ? D : 56;
    while (open.length && steps++ < 8000) {
      open.sort((a, b) => a[0] - b[0]);
      const cur = open.shift();
      const [, x, z, g] = cur;
      if (Math.abs(x - x1) <= G && Math.abs(z - z1) <= G) { found = cur; break; }
      for (const [dx, dz] of [[G, 0], [-G, 0], [0, G], [0, -G], [G, G], [G, -G], [-G, G], [-G, -G]]) {
        const nx = x + dx, nz = z + dz;
        if (nx < 3 || nz < 3 || nx > WW - 4 || nz > DD - 4) continue;
        const t = groundAt(nx, nz), pt = groundAt(x, z);
        const wet = waterish(nx, nz);
        const dh = Math.abs(t - pt);
        if (dh > 8 && !wet) continue;
        const step = (dx && dz ? 1.41 : 1) + dh * 1.4 + (wet ? 6 : 0) + (dh > 3 ? 3 : 0);
        const ng = g + step;
        const kk = key(nx, nz);
        if (best.has(kk) && best.get(kk) <= ng) continue;
        best.set(kk, ng);
        const h = Math.hypot(nx - x1, nz - z1) / G;
        open.push([ng + h, nx, nz, ng, cur]);
      }
    }
    if (!found) {
      /* fallback straight-ish */
      const out = [];
      const d = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(d / 2));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        out.push({ x: Math.round(x0 + (x1 - x0) * t), z: Math.round(z0 + (z1 - z0) * t) });
      }
      return out;
    }
    const out = [];
    for (let c = found; c; c = c[4]) out.push({ x: c[1], z: c[2] });
    out.reverse();
    return out;
  }

  function layPath(pts) {
    const Tref = (typeof T !== 'undefined') ? T : {};
    const GRAVEL = Tref.GRAVEL || Tref.COBBLE || 3;
    const COBBLE = Tref.COBBLE || 3;
    const PLANKS = Tref.PLANKS || 8;
    const AIR = Tref.AIR || 0;
    const TORCH = Tref.TORCH || 67;
    const STAIR = 167;
    const LAMP = 162;
    const wps = [];
    let lastY = null;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], wet = waterish(p.x, p.z);
      let y;
      if (wet) {
        const sea = (typeof SEA === 'number') ? SEA : 8;
        const prev = wps.length ? wps[wps.length - 1].y : sea + 2;
        y = Math.max(sea + 2, prev);
        /* bridge deck 3-wide, railings, posts */
        for (const sx of [-1, 0, 1]) {
          const x = p.x + sx, z = p.z;
          put(x, y, z, PLANKS);
          for (let yy = y - 1; yy > sea - 4 && yy > 1; yy--) {
            if (blk(x, yy, z) && blk(x, yy, z) !== (Tref.WATER || 5) && blk(x, yy, z) !== AIR) break;
            if ((i + sx) % 3 === 0) put(x, yy, z, COBBLE); /* posts */
          }
          if (sx !== 0) { put(x, y + 1, z, PLANKS); /* low rail */ }
        }
        if (i % 4 === 0) { put(p.x + 2, y + 1, p.z, LAMP); put(p.x + 2, y + 2, p.z, TORCH); }
      } else {
        const t = groundAt(p.x, p.z);
        y = t - 1;
        if (lastY != null && Math.abs(y - lastY) > 0) {
          /* step at most 1 per cell; stairs if going up/down */
          if (y > lastY + 1) y = lastY + 1;
          if (y < lastY - 1) y = lastY - 1;
        }
        const goingUp = lastY != null && y > lastY;
        const goingDn = lastY != null && y < lastY;
        /* 3-wide path, clear vegetation above */
        const dx = (i + 1 < pts.length) ? Math.sign(pts[i + 1].x - p.x) : (i ? Math.sign(p.x - pts[i - 1].x) : 0);
        const dz = (i + 1 < pts.length) ? Math.sign(pts[i + 1].z - p.z) : (i ? Math.sign(p.z - pts[i - 1].z) : 1);
        const rx = -dz, rz = dx; /* right */
        for (const s of [-1, 0, 1]) {
          const x = p.x + rx * s, z = p.z + rz * s;
          for (let yy = y + 1; yy <= y + 4; yy++) {
            const b = blk(x, yy, z);
            if (b && b !== TORCH && b !== LAMP) put(x, yy, z, AIR);
          }
          if (goingUp || goingDn) {
            put(x, goingUp ? y : lastY, z, STAIR);
          } else {
            put(x, y, z, GRAVEL);
          }
          /* fill under */
          for (let yy = y - 1; yy > y - 8 && yy > 1; yy--) {
            const b = blk(x, yy, z);
            if (b && b !== (Tref.WATER || 5) && b !== AIR) break;
            put(x, yy, z, COBBLE);
          }
        }
        if (i % 6 === 0) {
          const x = p.x + rx * 2, z = p.z + rz * 2;
          const ty = groundAt(x, z);
          put(x, ty, z, LAMP); put(x, ty + 1, z, TORCH);
        }
      }
      wps.push({ x: p.x + 0.5, z: p.z + 0.5, y: y + 1 });
      lastY = y;
    }
    return wps;
  }

  function buildPath() {
    if (ST.pathBuilt && ST.path && ST.path.length > 4) {
      PATH.length = 0;
      for (const p of ST.path) PATH.push(p);
      U.pathLen = PATH.length;
      return PATH;
    }
    const h = castle('human');
    const fs = farms();
    if (!h || !fs.length) return null;
    /* nearest farm to the human castle */
    let best = fs[0], bd = 1e18;
    for (const f of fs) {
      const fx = (f.x0 || f.x || 0) + 3, fz = (f.z0 || f.z || 0) + 6;
      const d = Math.hypot(fx - h.x, fz - h.z);
      if (d < bd) { bd = d; best = f; }
    }
    const fx = (best.x0 || best.x || 0) + 3, fz = (best.z0 || best.z || 0) + 6;
    /* start just outside the castle (south of typical gate, fallback toward the farm) */
    const ang = Math.atan2(fx - h.x, fz - h.z);
    const sx = Math.round(h.x + Math.sin(ang) * 14), sz = Math.round(h.z + Math.cos(ang) * 14);
    let pts;
    try { pts = route(sx, sz, Math.round(fx), Math.round(fz)); } catch (e) { ERR('route', e); pts = null; }
    if (!pts || pts.length < 3) {
      pts = [];
      const d = Math.hypot(fx - sx, fz - sz), n = Math.max(4, Math.round(d / 2));
      for (let i = 0; i <= n; i++) pts.push({ x: Math.round(sx + (fx - sx) * i / n), z: Math.round(sz + (fz - sz) * i / n) });
    }
    let wps;
    try { wps = layPath(pts); } catch (e) { ERR('lay', e); wps = pts.map(p => ({ x: p.x + 0.5, z: p.z + 0.5, y: groundAt(p.x, p.z) })); }
    PATH.length = 0;
    for (const p of wps) PATH.push(p);
    ST.path = wps; ST.pathBuilt = 1; U.pathLen = wps.length;
    saveST();
    return PATH;
  }
  U.buildPath = buildPath;

  /* ---------- 25 humans at the human castle; some walk to the farmers ---------- */
  const FOLK = [];
  U.folk = FOLK;
  const NAMES = ['Hamish', 'Mairi', 'Eilidh', 'Calum', 'Isla', 'Fergus', 'Ailsa', 'Rory',
    'Nessa', 'Angus', 'Brigid', 'Lachlan', 'Fiona', 'Ewan', 'Morag', 'Duncan',
    'Sine', 'Alasdair', 'Iona', 'Niall', 'Catriona', 'Kenneth', 'Beatrice', 'Malcolm', 'Una'];

  function spawnHuman(x, y, z, home) {
    let m = null;
    try {
      WIN.__egg = true; WIN.__eggSpot = [x, y, z, Math.floor(x), Math.floor(z)];
      if (typeof spawnMob === 'function') m = spawnMob('clansman');
    } catch (e) { ERR('spH', e); }
    finally { try { WIN.__egg = false; WIN.__eggSpot = null; } catch (_) {} }
    if (!m) return null;
    m.__1268 = 1;
    m.kind = 'clansman';
    m.shaded = 1;
    m.hostile = false;
    m.home = home;
    m.named = NAMES[FOLK.length % NAMES.length] || 'Castle Folk';
    m.visit = 0; /* 0 idle, 1 going, 2 lingering, 3 returning */
    m.wp = 0;
    m.linger = 0;
    try { m.g.position.set(x, y, z); } catch (_) {}
    FOLK.push(m);
    U.humans = FOLK.length;
    return m;
  }

  function ensureHumans() {
    const h = castle('human');
    if (!h) return;
    /* include any pre-existing clansmen at this castle */
    try {
      for (const a of mobs) {
        if (a && a.kind === 'clansman' && !a.__1268 && a.home && a.home[0] === h.x && a.home[1] === h.z) {
          a.__1268 = 1; a.named = a.named || NAMES[FOLK.length % NAMES.length]; a.visit = 0; a.shaded = 1;
          if (FOLK.indexOf(a) < 0) FOLK.push(a);
        }
      }
    } catch (_) {}
    /* cull dead from FOLK */
    for (let i = FOLK.length - 1; i >= 0; i--) {
      const a = FOLK[i];
      if (!a || a.hp <= 0 || !a.g) FOLK.splice(i, 1);
    }
    const want = MAX.human;
    const px = (typeof P !== 'undefined' && P) ? P.x : h.x, pz = (typeof P !== 'undefined' && P) ? P.z : h.z;
    const near = Math.hypot(px - h.x, pz - h.z) < R_LOAD + 20;
    if (!near) {
      /* despawn visuals when far, keep a count */
      for (const a of FOLK.slice()) {
        if (a && a.g && Math.hypot(a.g.position.x - px, a.g.position.z - pz) > R_LOAD + 8) {
          try { if (a.g.parent) a.g.parent.remove(a.g); } catch (_) {}
          try { const i = mobs.indexOf(a); if (i >= 0) mobs.splice(i, 1); } catch (_) {}
          const j = FOLK.indexOf(a); if (j >= 0) FOLK.splice(j, 1);
        }
      }
      U.humans = Math.max(U.humans, FOLK.length);
      return;
    }
    let n = 0;
    const tries = 80;
    while (FOLK.length < want && n++ < tries) {
      const ang = Math.random() * Math.PI * 2, r = 3 + Math.random() * 16;
      const x = h.x + Math.cos(ang) * r, z = h.z + Math.sin(ang) * r;
      const y = groundAt(x, z);
      spawnHuman(x, y, z, [h.x, h.z]);
    }
    U.humans = FOLK.length;
  }

  function stepHuman(a, dt) {
    if (!a || !a.g || a.hp <= 0) return;
    a.shaded = 1; a.hostile = false;
    const p = a.g.position;
    const wps = PATH.length > 4 ? PATH : ST.path;
    /* start a visit: at most 3 at a time, occasionally */
    if (!a.visit && wps && wps.length > 4) {
      const going = FOLK.filter(f => f && f.visit).length;
      if (going < 3 && Math.random() < dt * 0.04) {
        a.visit = 1; a.wp = 0; U.visits++;
      }
    }
    if (a.visit === 1 || a.visit === 3) {
      const dir = a.visit === 1 ? 1 : -1;
      const i = Math.max(0, Math.min((wps.length - 1), a.wp | 0));
      const t = wps[i];
      if (!t) { a.visit = 0; return; }
      const dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz);
      if (d < 0.8) {
        a.wp += dir;
        if (a.visit === 1 && a.wp >= wps.length - 1) { a.visit = 2; a.linger = 8 + Math.random() * 10; a.moving = false; }
        else if (a.visit === 3 && a.wp <= 0) { a.visit = 0; a.moving = false; }
      } else {
        a.ang = Math.atan2(dx, dz);
        a.moving = true;
        const spd = 2.4;
        const nx = p.x + Math.sin(a.ang) * spd * dt, nz = p.z + Math.cos(a.ang) * spd * dt;
        try {
          if (typeof moveMob === 'function') moveMob(a, nx - p.x, nz - p.z);
          else { p.x = nx; p.z = nz; }
        } catch (_) { p.x = nx; p.z = nz; }
        try { a.g.rotation.y = a.ang; } catch (_) {}
      }
      return;
    }
    if (a.visit === 2) {
      a.linger -= dt; a.moving = false;
      if (a.linger <= 0) { a.visit = 3; a.wp = (PATH.length || (ST.path && ST.path.length) || 1) - 1; }
      return;
    }
    /* idle: wander near the castle */
    if (a.home) {
      const hd = Math.hypot(p.x - a.home[0], p.z - a.home[1]);
      a.timer = (a.timer || 0) - dt;
      if (hd > 18) { a.ang = Math.atan2(a.home[0] - p.x, a.home[1] - p.z); a.moving = true; }
      else if (a.timer <= 0) { a.timer = 3 + Math.random() * 5; a.moving = Math.random() < 0.45; a.ang += (Math.random() - 0.5) * 2; }
      if (a.moving) {
        const nx = p.x + Math.sin(a.ang) * 1.8 * dt, nz = p.z + Math.cos(a.ang) * 1.8 * dt;
        try { if (typeof moveMob === 'function') moveMob(a, nx - p.x, nz - p.z); else { p.x = nx; p.z = nz; } } catch (_) { p.x = nx; p.z = nz; }
        try { a.g.rotation.y = a.ang; } catch (_) {}
      }
    }
  }

  /* ---------- hooks ---------- */
  function hook() {
    loadST();
    /* kill tracking */
    try {
      if (typeof damageMob === 'function' && !damageMob.__1268) {
        const dm = damageMob;
        damageMob = function (a, dmg, byPlayer) {
          const r = dm.apply(this, arguments);
          try {
            if (a && a.__1268 && a.garrison && a.hp <= 0) onKilled(a);
            /* hitting a garrison skeleton angers that one (not the whole 100) */
            if (byPlayer && a && a.__1268 && a.garrison && a.hp > 0) { a.angry = 14; a.hostile = true; }
          } catch (e) { ERR('dmg', e); }
          return r;
        };
        damageMob.__1268 = 1;
      }
    } catch (e) { ERR('dm', e); }

    try {
      if (typeof saveWorld === 'function' && !saveWorld.__1268) {
        const sw = saveWorld;
        saveWorld = function () { try { saveST(); } catch (_) {} return sw.apply(this, arguments); };
        saveWorld.__1268 = 1;
        try { WIN.saveWorld = saveWorld; } catch (_) {}
      }
    } catch (e) { ERR('save', e); }

    try {
      if (typeof updateMobs === 'function' && !updateMobs.__1268) {
        const um = updateMobs;
        updateMobs = function (dt) {
          const t = Math.min(0.08, +dt || 0.016);
          const r = um.apply(this, arguments);
          try {
            U.frames++;
            U._pt = (U._pt || 2) - t;
            if (U._pt <= 0) {
              U._pt = 2.5;
              if (!ST.pathBuilt || !PATH.length) {
                try { buildPath(); } catch (e) { ERR('path', e); }
              }
              try { materialize(2.5); } catch (e) { ERR('mat', e); }
              try { ensureHumans(); } catch (e) { ERR('hum', e); }
            }
            /* step our units every frame */
            try {
              if (typeof mobs !== 'undefined') {
                for (const a of mobs) {
                  if (!a || !a.__1268) continue;
                  if (a.garrison) stepGarrison(a, t);
                  else if (a.kind === 'clansman') stepHuman(a, t);
                }
              }
            } catch (e) { ERR('step', e); }
          } catch (e) { ERR('tick', e); }
          return r;
        };
        updateMobs.__1268 = 1;
        try { WIN.updateMobs = updateMobs; } catch (_) {}
      }
    } catch (e) { ERR('um', e); }

    U._hooked = 1;
    U.on = 1;
  }

  U.hook = hook;
  U.castle = castle;
  U.farms = farms;
  U.ROSTER = ROSTER;
  U.ensureRosters = ensureRosters;
  U.materialize = materialize;
  U.ensureHumans = ensureHumans;

  let n = 0;
  const boot = setInterval(function () {
    n++;
    try { hook(); } catch (e) { ERR('boot', e); }
    if (U._hooked || n > 120) {
      clearInterval(boot);
      try { hook(); } catch (_) {}
    }
  }, 50);
  [300, 900, 2000, 4000].forEach(function (ms) {
    setTimeout(function () { try { hook(); if (!ST.pathBuilt) buildPath(); ensureRosters(); } catch (_) {} }, ms);
  });
})(typeof window !== 'undefined' ? window : this);
