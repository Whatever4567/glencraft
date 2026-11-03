/* ===================== GLX-C223 (v1.0.47): the castle people carry things again - a real inventory each (saved with the world, per castle + trade), they pick up useful
   dropped items near them (never the ones at your feet), eat what they carry when hungry, gifts you hand them go into it, everything spills out when they die,
   and the tools, weapons and armour they own are visibly held and worn (procedural and HD models). Throttled, only near you. ===================== */
(function c223() {
  const U = window.__c223 = {S: {}, picked: 0, ate: 0, gifts: 0, spilt: 0, worn: 0, err: null};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e).slice(0, 400); };
  const isF = a => a && a.kind === 'clansman' && a.g && a.hp > 0 && !a.dead;
  const key = a => a.home ? a.home[0] + ',' + a.home[1] + ',' + (a.role || 'x') : null;
  const nm = id => String(NAMES[id] || '');
  // ---- what counts as worth carrying ----
  const SW = [IT.WSWORD, IT.SSWORD, IT.ISWORD, IT.DSWORD], AX = [IT.WAXE, IT.SAXE, IT.IAXE, IT.DAXE], PK = [IT.WPICK, IT.SPICK, IT.IPICK, IT.DPICK];
  const ARMS = [[IT.CHELM, IT.CCHEST, IT.CLEGS, IT.CBOOTS, 1], [IT.GHELM, IT.GCHEST, IT.GLEGS, IT.GBOOTS, 1.5], [IT.IHELM, IT.ICHEST, IT.ILEGS, IT.IBOOTS, 2], [IT.DHELM, IT.DCHEST, IT.DLEGS, IT.DBOOTS, 3]];
  const TOOLS = new Set([...SW, ...AX, ...PK].filter(Boolean)), ARMOUR = new Map(); ARMS.forEach(s => [0, 1, 2, 3].forEach(i => s[i] && ARMOUR.set(s[i], [i, s[4]])));
  const useful = id => !!(FOOD[id] || LOGGY[id] || TOOLS.has(id) || ARMOUR.has(id) || id === IT.STICK || id === T.COBBLE || /planks|ingot|^raw |coal|charcoal|diamond|ruby/i.test(nm(id)));
  U.useful = useful; U.SW = SW; U.AX = AX; U.PK = PK; U.ARMS = ARMS; U.ARMOUR = ARMOUR; U.TOOLS = TOOLS;
  // ---- the bag ----
  const inv = a => { if (!a.__inv) { const k = key(a), s = k && U.S[k]; a.__inv = s && s.inv ? Object.assign({}, s.inv) : {}; } return a.__inv; };
  const sync = a => { const k = key(a); if (k) U.S[k] = {inv: Object.assign({}, inv(a)), food: Math.round(a.food == null ? 16 : a.food)}; };
  const n = (a, id) => inv(a)[id] || 0;
  function add(a, id, c) { const I = inv(a); I[id] = (I[id] || 0) + c; if (I[id] <= 0) delete I[id]; sync(a); a.__gearDirty = 1; return true; }
  const room = (a, id) => n(a, id) < 64 && (n(a, id) > 0 || Object.keys(inv(a)).length < 16);
  U.inv = inv; U.add = add; U.n = n; U.room = room; U.sync = sync;
  const best = (a, list) => { for (let i = list.length - 1; i >= 0; i--) if (list[i] && n(a, list[i]) > 0) return [list[i], i + 1]; return [0, 0]; };
  U.best = best;
  U.tier = (a, list) => best(a, list)[1];
  U.armour = a => { const out = [0, 0, 0, 0], v = [0, 0, 0, 0]; for (const id in inv(a)) { const q = ARMOUR.get(+id); if (q && q[1] > v[q[0]]) { v[q[0]] = q[1]; out[q[0]] = +id; } } return {ids: out, pts: v.reduce((s, x) => s + x, 0)}; };
  // ---- picking things up: walk over, it hops into their hands ----
  U.findDrop = function (a, r) { const p = a.g.position; let b = null, bd = r;
    for (const d of drops) { if (!d || d.delay > 0 || d.pick !== undefined || d.__fk || !useful(d.id) || !room(a, d.id)) continue; if (Math.hypot(d.x - P.x, d.z - P.z) < 3) continue;
      const dd = Math.hypot(d.x - p.x, d.z - p.z); if (dd < bd && Math.abs(d.y - p.y) < 3) { bd = dd; b = d; } } return b; };
  U.grab = function (a, d) { const i = drops.indexOf(d); if (i < 0) return false; drops.splice(i, 1); try { scene.remove(d.m); } catch (_) {}
    add(a, d.id, d.n); U.picked++; a.swingT = 0.25; try { sfx3d('pop', a.g.position, 10); } catch (_) {} return true; };
  // ---- eating from the bag ----
  U.eat = function (a) { let bi = 0, bv = 0; for (const id in inv(a)) { const f = FOOD[id]; if (f && f[0] > bv) { bv = f[0]; bi = +id; } } if (!bi) return false;
    add(a, bi, -1); a.food = Math.min(20, (a.food == null ? 16 : a.food) + bv * 1.5); if (a.hp < a.maxHp) a.hp = Math.min(a.maxHp, a.hp + 2); U.ate++;
    try { sfx3d('eat', a.g.position, 10); } catch (_) {} try { burst(a.g.position.x, a.g.position.y + 1.6, a.g.position.z, 0xc89a5a, 5, 0.3); } catch (_) {} return true; };
  // ---- gifts go into the bag (the hive's own gift reaction is unchanged) ----
  try { const ui = useItem; useItem = function () { const id = selId, c0 = (window.__c213 && __c213.gifts) || 0, had = cnt(id); const r = ui.apply(this, arguments);
      try { if (window.__c213 && __c213.gifts > c0 && cnt(id) < had) { let b = null, bd = 6; for (const m of mobs) if (isF(m)) { const d = Math.hypot(m.g.position.x - P.x, m.g.position.z - P.z); if (d < bd) { bd = d; b = m; } }
          if (b) { add(b, id, 1); U.gifts++; } } } catch (e) { ERR(e); } return r; }; } catch (e) { ERR(e); }
  // ---- everything spills out when one of them dies ----
  try { const km = killMob; killMob = function (a) { try { if (a && a.kind === 'clansman' && a.g) { const p = a.g.position, I = inv(a);
          for (const id in I) { let c = I[id]; while (c > 0) { const t = Math.min(c, 16); c -= t; dropItem(+id, t, p.x, p.y + 0.6, p.z, (Math.random() - .5) * 2.5, 3.5, (Math.random() - .5) * 2.5, 0.6); } }
          a.__inv = {}; const k = key(a); if (k) delete U.S[k]; U.spilt++; } } catch (e) { ERR(e); } return km.apply(this, arguments); }; } catch (e) { ERR(e); }
  // ---- saved with the world ----
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && !DIM.cur) { for (const m of mobs) if (isF(m) && m.__inv) sync(m); d.c223 = JSON.parse(JSON.stringify(U.S)); } } catch (e) { ERR(e); } return d; };
    const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && !d.dim) { U.S = {}; const s = d.c223; if (s && typeof s === 'object') for (const k in s) { const q = s[k]; if (!q || typeof q.inv !== 'object') continue; const I = {};
            for (const id in q.inv) { const c = Math.floor(+q.inv[id]); if (c > 0 && c < 100000 && NAMES[id]) I[id] = Math.min(c, 64); } U.S[k] = {inv: I, food: +q.food || 16}; } for (const m of mobs) if (m && m.kind === 'clansman') m.__inv = null; } } catch (e) { ERR(e); } return r; };
    const ew = enterWorld; enterWorld = function (save) { if (!save) U.S = {}; return ew.apply(this, arguments); }; } catch (e) { ERR(e); }
  // ---- visible gear: held tool / weapon in the right hand, armour pieces worn ----
  const COL = {1: 0xc8743c, 1.5: 0xe8c040, 2: 0xd6dade, 3: 0x5fe0d4};
  const mats = {}; const matOf = v => mats[v] || (mats[v] = new THREE.MeshLambertMaterial({color: COL[v] || 0xcccccc}));
  const bx = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.userData.c223 = 1; return o; };
  function itemMesh(id) { let m = null; try { m = makeItemMesh(id); } catch (_) {} if (!m) return null; m.scale.setScalar(1.6); if (m.userData && m.userData.tool) m.rotation.set(-1.4, 0, 0);
    m.traverse(o => { o.userData.c223 = 1; }); return m; }
  const kill = (g) => { if (!g) return; if (g.parent) g.parent.remove(g); g.traverse(o => { if (o.geometry && o.userData.c223) try { o.geometry.dispose(); } catch (_) {} }); };
  function piecesProc(a, arm) { const G = []; const h = a.head, L = a.legs || [];
    if (arm.ids[0] && h) { const g = new THREE.Group(), m = matOf(ARMOUR.get(arm.ids[0])[1]); g.add(bx(0.56, 0.14, 0.56, m, 0, 0.52, 0), bx(0.56, 0.18, 0.05, m, 0, 0.4, -0.27)); h.add(g); G.push(g); }
    if (arm.ids[1]) { const g = new THREE.Group(), m = matOf(ARMOUR.get(arm.ids[1])[1]); g.add(bx(0.6, 0.5, 0.37, m, 0, 1.2, 0), bx(0.24, 0.12, 0.42, m, -0.36, 1.46, 0), bx(0.24, 0.12, 0.42, m, 0.36, 1.46, 0)); a.g.add(g); G.push(g); }
    if (arm.ids[2]) { const m = matOf(ARMOUR.get(arm.ids[2])[1]); for (const l of L) { const g = new THREE.Group(); g.add(bx(0.235, 0.24, 0.235, m, 0, -0.14, 0)); l.add(g); G.push(g); } }
    if (arm.ids[3]) { const m = matOf(ARMOUR.get(arm.ids[3])[1]); for (const l of L) { const g = new THREE.Group(); g.add(bx(0.26, 0.15, 0.33, m, 0, -0.44, 0.03)); l.add(g); G.push(g); } }
    return G; }
  const V = new THREE.Vector3();
  function boneOf(H, re) { let b = null; H.hd.traverse(o => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; }
  function onBone(H, re, g, s) { const b = boneOf(H, re); if (!b) return null; b.updateMatrixWorld(true); b.getWorldScale(V); const ws = new THREE.Vector3(); H.hd.parent && H.hd.parent.getWorldScale(ws); g.scale.setScalar((s || 1) * (ws.x || 1) / (V.x || 1)); b.add(g); return g; }
  function piecesHD(a, arm, held) { const H = a.__hd, G = []; if (!H || !H.hd) return G;
    if (held) { const g = new THREE.Group(), m = itemMesh(held); if (m) { m.position.set(0, 0.05, 0.02); m.rotation.x += 1.57; g.add(m); if (onBone(H, /^Fist\.?R$/, g)) G.push(g); } }
    if (arm.ids[0]) { const g = new THREE.Group(), m = matOf(ARMOUR.get(arm.ids[0])[1]); g.add(bx(0.52, 0.18, 0.52, m, 0, 0.36, 0)); if (onBone(H, /^Head$/, g)) G.push(g); }
    if (arm.ids[1]) { const g = new THREE.Group(), m = matOf(ARMOUR.get(arm.ids[1])[1]); g.add(bx(0.5, 0.42, 0.34, m, 0, 0.12, 0), bx(0.2, 0.1, 0.34, m, -0.25, 0.27, 0), bx(0.2, 0.1, 0.34, m, 0.25, 0.27, 0)); if (onBone(H, /^Torso$/, g)) G.push(g); }
    for (const s of ['L', 'R']) { if (arm.ids[2]) { const g = new THREE.Group(); g.add(bx(0.2, 0.3, 0.2, matOf(ARMOUR.get(arm.ids[2])[1]), 0, 0.15, 0)); if (onBone(H, new RegExp('^UpperLeg\\.?' + s + '$'), g)) G.push(g); }
      if (arm.ids[3]) { const g = new THREE.Group(); g.add(bx(0.22, 0.16, 0.28, matOf(ARMOUR.get(arm.ids[3])[1]), 0, 0.02, 0.04)); if (onBone(H, new RegExp('^Foot\\.?' + s + '$'), g)) G.push(g); } }
    return G; }
  U.heldFor = a => a.__heldWant || best(a, SW)[0] || best(a, AX)[0] || best(a, PK)[0] || 0;
  function dress(a) { const W = a.__wear || (a.__wear = {sig: '', proc: [], hd: [], hdOn: null}); const arm = U.armour(a), held = U.heldFor(a), sig = held + '|' + arm.ids.join(',') + '|' + !!a.__hd;
    if (sig === W.sig) return; W.sig = sig; W.proc.forEach(kill); W.hd.forEach(kill); W.proc = []; W.hd = [];
    if (held && a.arms && a.arms[1]) { const gr = new THREE.Group(); gr.position.set(0, -0.62, 0.06); const m = itemMesh(held); if (m) { gr.add(m); a.arms[1].add(gr); W.proc.push(gr); } }
    W.proc.push(...piecesProc(a, arm)); try { W.hd.push(...piecesHD(a, arm, held)); } catch (e) { ERR(e); } W.hdOn = null; U.worn++; }
  function show(a) { const W = a.__wear; if (!W) return; const on = !!(a.__hd && a.__hd.on);
    if (W.hdOn === on) return; W.hdOn = on; for (const g of W.proc) { g.visible = !on || !W.hd.length; g.traverse(o => { o.layers.mask = 1; }); } for (const g of W.hd) { g.visible = on; g.traverse(o => { o.layers.mask = 1; }); } }
  U.dress = dress;
  // ---- a cheap tick: food slowly runs down, they eat from the bag, gear is kept dressed ----
  let tT = 0;
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { if (!started || paused || DIM.cur) return r; tT -= dt; const slow = tT <= 0; if (slow) tT = 0.5;
      for (const a of mobs) { if (!isF(a)) continue; const d = Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z); if (d > 48) continue;
        if (slow) { if (a.food == null) { const k = key(a); a.food = (k && U.S[k] && U.S[k].food) || 16; } a.food = Math.max(0, a.food - 0.5 / 40);
          if (a.food < 10 && !a.tgt && !a.sleeping && !((a.__eatT || 0) > performance.now())) { a.__eatT = performance.now() + 4000; U.eat(a); }
          a.__gearDirty = 0; dress(a); }
        show(a); } } catch (e) { ERR(e); }
    return r; };
})();
