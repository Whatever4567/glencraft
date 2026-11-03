/* ===================== GLX-C95 (v0.9.73): the two castle folk are player-like - player model + animations, trews (no more bare legs), full visible armour, held tools, animated eyes; exactly 2, saved with the world ===================== */
(function c95() {
  const C95 = window.__c95 = {snap: null, respawned: 0};
  const START_ARM = [104, 105, 106, 107];   // copper set (there is no leather in the game); upgraded later as they craft
  const isBot = a => a && a.kind === 'clansman';
  // ---- the model: the player's own body, wearing trews, eyes that move ----
  function dress(a) {
    if (!a || !a.g || !a.g.userData || !a.g.userData.armourParts) return;
    const keep = armour.slice(); for (let i = 0; i < 4; i++) armour[i] = (a.armour && a.armour[i]) || 0;
    try { dressModel(a.g); } catch (e) { console.warn('c95 dress', e); } finally { for (let i = 0; i < 4; i++) armour[i] = keep[i]; }
    a.dressed = (a.armour || []).join(',');
  }
  C95.dress = dress;
  C95.held = id => held(id);
  function held(id) { let m = null; try { m = makeItemMesh(id); } catch (_) { return null; } if (!m) return null;
    m.scale.setScalar(1.6); m.position.set(0, -0.04, 0.06); m.rotation.set(Math.PI / 2 - 0.25, Math.PI / 2, 0); m.visible = false; return m; }
  function eyeRig(o) {
    const white = new THREE.MeshLambertMaterial({color: 0xf4f1ea}), iris = new THREE.MeshLambertMaterial({color: [0x2f6fb0, 0x4a7a3a, 0x6a4a2a][Math.random() * 3 | 0]}),
      pup = new THREE.MeshLambertMaterial({color: 0x101418}), lidM = new THREE.MeshLambertMaterial({color: 0xd29a74});
    o.mats.push(white, iris, pup, lidM); o.eyes = [];
    [-1, 1].forEach((sx, i) => {
      const g = new THREE.Group(); g.position.set(sx * 0.109, 0.27, 0.257); o.head.add(g);
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.004), white); g.add(w);
      const ir = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.054, 0.004), iris); ir.position.z = 0.003; g.add(ir);
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.032, 0.004), pup); p.position.z = 0.003; ir.add(p);
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.009, 0.004), white); hl.position.set(-0.008, 0.01, 0.005); ir.add(hl);
      const lg = new THREE.BoxGeometry(0.106, 0.066, 0.006); lg.translate(0, -0.033, 0);
      const lid = new THREE.Mesh(lg, lidM); lid.position.set(0, 0.033, 0.007); lid.scale.y = 0.02; lid.visible = false; g.add(lid);
      o.eyes.push({ir, lid}); o['_ew' + i] = w; o['_ei' + i] = ir; o['_ep' + i] = p; o['_eh' + i] = hl; o['_el' + i] = lid;   // kept out of mergeStatic
    });
    o.eyeA = {blink: 1 + Math.random() * 3, x: 0, y: 0, tx: 0, ty: 0, sac: 0};
  }
  makeClansman = function () {
    const g = buildPlayerModel(false), u = g.userData, mats = new Set();
    g.traverse(c => { if (c.isMesh) for (const m of [].concat(c.material)) if (m) mats.add(m); });
    const trews = new THREE.MeshLambertMaterial(tartanTex ? {map: tartanTex} : {color: 0x2b4f8a}); mats.add(trews);
    u.legs.forEach(l => l.children.forEach(c => { const pr = c.isMesh && c.geometry && c.geometry.parameters; if (pr && (Math.abs(pr.height - 0.16) < 1e-3 || Math.abs(pr.height - 0.28) < 1e-3)) c.material = trews; }));
    const o = {g, legs: u.legs, arms: u.arms, head: u.head, mats: [...mats], speed: 0, hp: 24, maxHp: 24, hitY: 1.1, hitR: .55, hostile: false, tall: 2, isBot: true};
    eyeRig(o);
    const grip = u.arms[1].userData.grip;
    o.pickG = held(IT.IPICK || IT.SPICK); o.swordG = held(IT.ISWORD || IT.SSWORD); o.axeG = held(IT.IAXE || IT.SAXE); o.hoeG = null; o.shieldG = null;
    for (const m of [o.pickG, o.swordG, o.axeG]) if (m) grip.add(m);
    return o;
  };
  // ---- eyes: curious glances, looking at you or at whatever they're working on, blinking ----
  const rel = v => { if (!isFinite(v)) return 0; if (Math.abs(v) > 20) v = v % 6.283; if (!isFinite(v)) v = 0; else if (Math.abs(v) > 20) v %= 6.283185307179586; while (v > Math.PI) v -= 6.283; while (v < -Math.PI) v += 6.283; return v; };
  function eyes(a, dt, dist) {
    const E = a.eyeA; if (!E || !a.eyes) return;
    const p = a.g.position, hy = (a.yawVis || 0) + (a.head ? a.head.rotation.y : 0);
    let tgt = null;
    const j = a.job;
    if (j && j.m && j.m !== 'player' && j.m.g) tgt = j.m.g.position; else if (j && j.m === 'player') tgt = P;
    else if (dist < 7) tgt = P;
    if (tgt && !a.sleeping) { E.tx = clamp(rel(Math.atan2(tgt.x - p.x, tgt.z - p.z) - hy) * 0.05, -0.024, 0.024); E.ty = clamp(Math.atan2((tgt.y + (tgt === P ? 1.5 : 0.8)) - (p.y + 1.77), Math.max(1, Math.hypot(tgt.x - p.x, tgt.z - p.z))) * 0.04, -0.012, 0.012); }
    else { E.sac -= dt; if (E.sac <= 0) { E.sac = 0.5 + Math.random() * 1.8; E.tx = (Math.random() - .5) * 0.046; E.ty = (Math.random() - .5) * 0.02; if (a.act === 'dig' || a.act === 'cook') E.ty = -0.01; } }
    const k = Math.min(1, dt * 14); E.x += (E.tx - E.x) * k; E.y += (E.ty - E.y) * k;
    E.blink -= dt; let lid = 0.02; if (E.blink < 0.16) lid = Math.max(0.02, Math.sin(Math.max(0, E.blink) / 0.16 * Math.PI)); if (E.blink <= 0) E.blink = (Math.random() < 0.2 ? 0.35 : 2 + Math.random() * 3.5);
    const busy = j && ((j.type === 'field' && (j.ph === 'smelt' || j.ph === 'craft')) || (j.type === 'craft' && j.ph === 'use') || (j.type === 'cook' && j.ph === 'work'));   // v0.9.80: eyes shut while crafting / smelting
    a.busyEyes = !!busy;
    if (a.sleeping || busy) lid = 1; else if (a.act === 'dig') lid = Math.max(lid, 0.35);
    for (const e of a.eyes) { e.ir.position.x = E.x; e.ir.position.y = E.y; e.ir.visible = lid < 0.9; e.lid.scale.y = lid; e.lid.visible = lid > 0.05; }
  }
  // ---- what they hold: the tool for the job, the sword in a fight ----
  function tools(a, dt) {
    const act = a.act, r = a.role, fight = act === 'fight' || (a.job && (a.job.type === 'fight' || a.job.type === 'hunt'));
    const job = a.job && a.job.type, digging = act === 'dig' || (a.digKT > 0) || job === 'mine' || job === 'dig';
    let want = a.sleeping ? null : fight ? 'sword' : digging ? (a.digK || 'pick') : (act === 'chop' || job === 'chop') ? 'axe' : r === 'hunter' ? 'sword' : r === 'miner' ? 'pick' : null;
    // v0.9.78: no flip-flopping - a new tool only once the want has held for 0.7 s (a fight switches at once)
    if (a.digKT > 0) a.digKT -= dt || 0;
    if (a.toolK === undefined) a.toolK = want;
    if (want !== a.toolK) { a.toolW = want === a.toolWk ? (a.toolW || 0) + (dt || 0) : 0; a.toolWk = want; if (a.toolW > 0.7 || (fight && want === 'sword') || a.sleeping) { a.toolK = want; a.toolW = 0; } } else a.toolW = 0;
    want = a.toolK;
    if (a.pickG) a.pickG.visible = want === 'pick'; if (a.swordG) a.swordG.visible = want === 'sword'; if (a.axeG) a.axeG.visible = want === 'axe';
  }
  const ca = clanAI;
  clanAI = function (a, dt) {
    const r = (C95.brain && a.role && !C95.off) ? C95.brain(a, dt) : ca.apply(this, arguments);
    try { if (!a.armour) { a.armour = START_ARM.slice(); } if (a.dressed !== a.armour.join(',')) dress(a);
      const dist = Math.hypot(P.x - a.g.position.x, P.z - a.g.position.z);
      if (dist < 40) { tools(a, dt); eyes(a, dt, dist); } } catch (e) { if (!C95.err) { C95.err = 1; console.warn('c95', e); } }
    return r;
  };
  // ---- exactly two, and they stay: their state lives in the save and comes back after Hell trips and reloads ----
  const sm = spawnMob;
  spawnMob = function (kind) { if (kind === 'clansman' && !C95.force && mobs.filter(isBot).length >= 2) return null; return sm.apply(this, arguments); };
  function snapOf(m) { const p = m.g.position; return {role: m.role, pos: [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)], hp: Math.round((m.hp || 24) * 10) / 10, food: Math.round((m.food || 16) * 10) / 10,
    bag: (m.bag || []).map(q => q.slice()), armour: (m.armour || START_ARM).slice(), home: m.home ? m.home.slice() : null, inv: m.inv ? JSON.parse(JSON.stringify(m.inv)) : undefined, brain: m.brain ? JSON.parse(JSON.stringify(m.brain)) : undefined}; }
  function takeSnap() { if (DIM.cur || !started) return; const b = mobs.filter(m => isBot(m) && m.role); if (!b.length && !C95.snap) return; const o = C95.snap || {}; for (const m of b) o[m.role] = snapOf(m); C95.snap = o; }
  function restore() {
    if (!C95.snap || DIM.cur || !started) return;
    for (const role of Object.keys(C95.snap)) {
      const s = C95.snap[role]; if (!s || !s.pos || mobs.some(m => isBot(m) && m.role === role)) continue;
      const [x, y, z] = s.pos; if (!(x > 1 && z > 1 && x < W - 1 && z < D - 1)) continue;
      C95.force = true; window.__egg = true; window.__eggSpot = [x, y, z, Math.floor(x), Math.floor(z)]; let m = null;
      try { m = spawnMob('clansman'); } finally { C95.force = false; window.__egg = false; window.__eggSpot = null; }
      if (!m) continue;
      m.g.position.set(x, Math.max(y, floorBelow(Math.floor(x), y + 1, Math.floor(z))), z);
      Object.assign(m, {role, home: s.home || null, hp: s.hp || 24, food: s.food == null ? 16 : s.food, bag: (s.bag || []).map(q => q.slice()), armour: (s.armour || START_ARM).slice(), shaded: true, tall: 2, pathLimit: 600,
        bedIdx: role === 'hunter' ? 0 : 1, thinkT: Math.random() * 0.5, glanceCd: 4 + Math.random() * 6});
      if (s.inv) m.inv = s.inv; if (s.brain) m.brain = s.brain;
      m.g.rotation.order = 'YXZ'; C95.respawned++;
    }
  }
  C95.restore = restore; C95.takeSnap = takeSnap;
  let snapT = 0;
  const um = updateMobs;
  updateMobs = function (dt) {
    if (started && !DIM.cur) { try { restore(); } catch (e) { console.warn('c95 restore', e); } }
    const r = um.apply(this, arguments);
    snapT -= dt; if (snapT <= 0) { snapT = 1; try { takeSnap(); } catch (_) {} }
    return r;
  };
  const km = killMob;
  killMob = function (a) { if (isBot(a) && a.role && C95.snap) delete C95.snap[a.role]; return km.apply(this, arguments); };
  const se = serialize;
  serialize = function () { const d = se.apply(this, arguments); if (!DIM.cur) { try { takeSnap(); } catch (_) {} if (C95.snap) d.c95 = C95.snap; } else if (C95.snap) d.c95 = C95.snap; return d; };
  const ap = applySave;
  applySave = function (d) { const r = ap.apply(this, arguments); if (d && !d.dim) { try { C95.snap = cleanSnap(d.c95); } catch (e) { C95.snap = null; console.warn('c95 bot save reset', e); } } return r; };
  // v0.9.76: a bad / old bot record is dropped (fresh bots settle) instead of breaking the world load
  function cleanSnap(o) { if (!o || typeof o !== 'object' || Array.isArray(o)) return null; const out = {}; const num = v => typeof v === 'number' && isFinite(v);
    for (const role of ['hunter', 'miner']) { const q = o[role]; if (!q || typeof q !== 'object' || !Array.isArray(q.pos) || q.pos.length < 3 || !q.pos.every(num)) continue;
      const c = {role, pos: q.pos.slice(0, 3), hp: num(q.hp) && q.hp > 0 ? q.hp : 24, food: num(q.food) ? q.food : 16,
        bag: Array.isArray(q.bag) ? q.bag.filter(b => Array.isArray(b)).map(b => b.slice()) : [], armour: Array.isArray(q.armour) && q.armour.length === 4 && q.armour.every(v => num(v) || v == null) ? q.armour.slice() : undefined,
        home: Array.isArray(q.home) && q.home.length >= 2 && num(q.home[0]) && num(q.home[1]) ? q.home.slice(0, 2) : null};
      if (q.inv && typeof q.inv === 'object' && !Array.isArray(q.inv)) { c.inv = {}; for (const k in q.inv) if (num(q.inv[k]) && q.inv[k] > 0) c.inv[k] = Math.floor(q.inv[k]); }
      if (q.brain && typeof q.brain === 'object') c.brain = q.brain; if (!c.armour) delete c.armour; out[role] = c; }
    return Object.keys(out).length ? out : null; }
  const ew = enterWorld;
  enterWorld = function (save) { if (!save) C95.snap = null; return ew.apply(this, arguments); };
  window.__c95s = () => mobs.filter(isBot).map(m => ({role: m.role, job: m.job && m.job.type, act: m.act, hp: m.hp, food: Math.round(m.food || 0), armour: m.armour, pos: [m.g.position.x, m.g.position.y, m.g.position.z].map(v => Math.round(v * 10) / 10), sleeping: !!m.sleeping, bag: m.bag}));
})();
