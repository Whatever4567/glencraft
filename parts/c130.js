/* ===================== GLX-C130 (v1.0.11): spawn eggs for every mob, egg mobs ignore spawn rules, creative = no natural hostiles + persistent egg mobs ===================== */
(function c130() {
  const U = window.__c130 = {added: [], restored: 0, swept: 0, kept: 0};
  const C = window.__c123; if (!C) return;
  const hex = n => '#' + (n >>> 0 & 0xffffff).toString(16).padStart(6, '0');
  const shade = (n, k) => { const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return (f(r) << 16) | (f(g) << 8) | f(b); };
  const lum = n => (((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255;
  // ---- the egg list: every mob that had no egg yet ----
  const L = [];
  for (const k of C.LIST.concat(['nmwizard', 'nmunicorn'])) { const d = C.DEF[k]; if (!d) continue; const a = d.c[0], b = d.glow || (lum(a) > 0.55 ? shade(a, -0.55) : shade(a, 0.6));
    L.push({key: k, name: d.name, a: hex(a), b: hex(b), make: (x, y, z) => { const m = C.spawnKind(k, Math.floor(x), Math.floor(y), Math.floor(z), {grp: Math.random()}); if (m) { m.g.position.set(x, y, z); if (d.eggOnly) m.hostile = false; } return m; }}); }
  const FL = ['__egg', '__c116force', '__c116herd'], flags = on => { for (const k of FL) window[k] = on; };
  const classic = (kind, post) => (x, y, z) => { flags(true); window.__eggSpot = [x, y, z, x, z]; const was = DIM.cur; if (was) DIM.cur = null; let m = null;
    try { m = spawnMob(kind); } finally { DIM.cur = was; flags(false); window.__eggSpot = null; } if (m) { m.g.position.set(x, y, z); if (post) try { post(m); } catch (_) {} } return m; };
  L.push({key: 'blackskel', name: 'Black skeleton', a: '#26262b', b: '#9a9aa4', make: classic('blackskel')});
  L.push({key: 'nspider', name: 'Night spider', a: '#1a1418', b: '#c02030', make: (x, y, z) => { const S = window.__c104s; if (!S || !S.spawnAt) return null; const m = S.spawnAt(Math.floor(x), Math.floor(y), Math.floor(z), false); if (m) m.g.position.set(x, y, z); return m; }});
  L.push({key: 'giant', name: 'Giant spider', a: '#2a2026', b: '#e03020', make: (x, y, z) => { if (!window.__newGiant) return null; window.__giantOK = true; let m = null;
    try { for (const [ox, oz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 2], [-2, 2], [2, -2], [-2, -2], [3, 0], [-3, 0], [0, 3], [0, -3]]) { for (const oy of [0, 1, -1, 2]) { m = __newGiant([x + ox, y + oy, z + oz, 14], x + ox, z + oz); if (m) break; } if (m) break; } } finally { window.__giantOK = false; } return m; }});
  const NICE = {sheep: 'Sheep', haggis: 'Haggis', duck: 'Duck', pig: 'Pig', clansman: 'Clansman', zombie: 'Zombie', skeleton: 'Skeleton', creeper: 'Creeper', spider: 'Spider', guardian: 'Castle guardian', treeman: 'Treeman', puffer: 'Puffer', imp: 'Imp', hound: 'Hell hound', ghost: 'Ghost', blazeskel: 'Blaze skeleton', dragon: 'Dragon', bee: 'Bee'};
  for (const i in NAMES) { const n = NAMES[i]; if (typeof n === 'string' && n.startsWith('Spawn egg: ') && NICE[n.slice(11)]) NAMES[i] = 'Spawn egg: ' + NICE[n.slice(11)]; }
  // ---- items: free ids from 700 up ----
  const EGG = {}, BYKEY = {}; let id = 700;
  const reg = e => { while (NAMES[id] !== undefined || ICONS[id]) id++; e.id = id; EGG[id] = e; BYKEY[e.key] = e; NAMES[id] = 'Spawn egg: ' + e.name; IT['EGG_' + e.key.toUpperCase()] = id;
    ICONS[id] = drawIcon(g => { g.fillStyle = e.a; g.beginPath(); g.ellipse(0, 2, 18, 24, 0, 0, 7); g.fill(); g.fillStyle = e.b; for (let j = 0; j < 9; j++) { g.beginPath(); g.arc(Math.sin(j * 2.4) * 11, Math.cos(j * 1.7) * 15 + 2, 3 + (j % 3), 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(-7, -8, 5, 8, -0.4, 0, 7); g.fill(); });
    U.added.push([id, e.key]); id++; };
  for (const e of L) reg(e);
  // ---- one sorted spawn-egg section in the creative inventory ----
  const isEgg = i => typeof NAMES[i] === 'string' && NAMES[i].startsWith('Spawn egg: ');
  const resort = A => { if (!Array.isArray(A)) return; const all = new Set(A.filter(isEgg).concat(Object.keys(EGG).map(Number))); let at = A.findIndex(isEgg); if (at < 0) at = A.length;
    const rest = A.filter(i => !isEgg(i)); const before = A.slice(0, at).filter(i => !isEgg(i)).length; const eggs = [...all].sort((p, q) => NAMES[p].toLowerCase().localeCompare(NAMES[q].toLowerCase()));
    A.length = 0; A.push(...rest.slice(0, before), ...eggs, ...rest.slice(before)); };
  resort(ORDER); try { resort(CREATIVE_ALL); } catch (_) {}
  U.addEggs = list => { for (const e of list) if (!BYKEY[e.key]) reg(e); resort(ORDER); try { resort(CREATIVE_ALL); } catch (_) {} };   // v1.0.30: later parts (dinosaurs) append eggs; ids continue after the existing ones
  U.eggs = () => ORDER.filter(isEgg).map(i => NAMES[i]);
  // ---- persistent egg mobs (creative) ----
  let lastW = null, doneW = null; const KEEP = new Set(); U.KEEP = KEEP; let RMOK = 0, boomAt = 0;
  const creative = () => !!(MODE && MODE.name === 'creative');
  function mark(m, key) { if (!m || !m.g) return; m.egg = true; m.eggKey = key; if (creative()) { m.eggP = true; m._sh0 = true; m.shaded = true; m.burning = 0; KEEP.add(m); } }
  U.mark = mark;
  const ex = explode; explode = function () { boomAt = performance.now(); return ex.apply(this, arguments); };
  const dmg = damageMob; damageMob = function (a) { if (a) a.__hitAt = performance.now(); const r = dmg.apply(this, arguments); if (a && !(a.hp > 0)) a.__dying = true; return r; };
  const hm = hitMob; hitMob = function (a) { if (a) a.__hitAt = performance.now(); return hm.apply(this, arguments); };
  const km = killMob; killMob = function (a) { if (a) a.__dying = true; return km.apply(this, arguments); };
  const rm = removeMob; removeMob = function (a) {
    if (a && a.eggP && !RMOK && a.hp > 0 && !a.__dying && !(a.beeHp <= 0) && !(a.dieT <= 0) && !(performance.now() - (a.__hitAt || -1e9) < 4000) && !(performance.now() - boomAt < 80)) { U.kept++; return; }
    KEEP.delete(a); return rm.apply(this, arguments); };
  const guard = fn => function () { RMOK++; try { return fn.apply(this, arguments); } finally { RMOK--; } };
  { const ew = enterWorld; enterWorld = guard(function () { lastW = null; doneW = null; for (const m of mobs) if (m) m.eggP = false; KEEP.clear(); return ew.apply(this, arguments); }); }
  try { const cw = window.__clearWorldState; if (cw) window.__clearWorldState = guard(cw); } catch (_) {}
  try { const ge = generate; generate = guard(ge); } catch (_) {}
  U.forceRemove = a => { RMOK++; try { removeMob(a); } finally { RMOK--; } const i = mobs.indexOf(a); if (i >= 0) mobs.splice(i, 1); };
  // ---- creative: evil and hostile mobs never spawn on their own ----
  const HK = new Set(['zombie', 'skeleton', 'creeper', 'spider', 'nspider', 'guardian', 'treeman', 'blackskel', 'puffer', 'giant', 'imp', 'hound', 'ghost', 'blazeskel', 'dragon', 'nmwisp', 'nmdrop']);
  const evil = a => !a.tamed && !a.mounted && (a.hostile || a.hell || a.giant || a.boss || HK.has(a.kind) || (typeof a.kind === 'string' && a.kind.startsWith('nm') && !(C.DEF[a.kind] && C.DEF[a.kind].eggOnly)));
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { if (started && creative()) { for (const a of mobs.slice()) if (a && a.g && !a.egg && evil(a)) { U.forceRemove(a); U.swept++; } }
      for (const a of KEEP) { if (!a.g || a.__dying || !(a.hp > 0)) { KEEP.delete(a); continue; } a.burning = 0; a._sh0 = true; a.shaded = true; if (a.fade) a.fade = 0;
        if (mobs.indexOf(a) < 0) { if (a.g.parent === scene) mobs.push(a); else KEEP.delete(a); } } } catch (e) { U.err = String(e && e.stack || e); }
    return r; };
  // ---- the egg: any biome, water or land, day or night, any dimension, no spawn rules ----
  function spot() { const r = raycast(6), d = lookDir(); let x = P.x + d[0] * 3, y = P.y, z = P.z + d[2] * 3; if (r && r.prev) { x = r.prev[0] + .5; y = r.prev[1]; z = r.prev[2] + .5; } return [x, y, z]; }
  function spawnEgg(key, x, y, z) { const e = BYKEY[key]; let m = null; window.__egg = true; try { m = e ? e.make(x, y, z) : null; } catch (err) { U.err = String(err && err.stack || err); } finally { window.__egg = false; }
    if (m) { mark(m, key); m.egg = true; } return m; }
  U.spawnEgg = spawnEgg;
  const ui = useItem; useItem = function () {
    const e = EGG[selId] || (selId === IT.EGG_SPIDER ? BYKEY.nspider : null), old = !e && isEgg(selId);   // the old cave spider is gone from the game; its egg hatches today's spider
    if ((!e && !old) || menuOpen || paused || dead || !started || !(MODE.infinite || cnt(selId) > 0)) return ui.apply(this, arguments);
    if (old) { const before = new Set(mobs); let r; window.__c116force = window.__c116herd = true; try { r = ui.apply(this, arguments); } finally { window.__c116force = window.__c116herd = false; } for (const a of mobs) if (!before.has(a)) mark(a, a.kind); return r; }
    const [x, y, z] = spot(); spawnEgg(e.key, x, y, z);
    if (!MODE.infinite) useUp(selId); try { swing(); burst(x, y + .5, z, 0xffffff, 8, .4); sfx('pop', .5); renderHotbar(); } catch (_) {} };
  // ---- creative egg mobs survive a reload: saved per world, put back when you return ----
  const sk = () => 'glen_eggm_' + (current && current.id);
  setInterval(() => { try { if (!started || !creative() || !current || !current.id || doneW !== current.id + '|' + (DIM.cur || '')) return; const out = []; for (const a of KEEP) { if (!a.g || !a.eggKey) continue; const p = a.g.position; out.push([a.eggKey, +p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), DIM.cur || '']); if (out.length >= 80) break; }
    localStorage.setItem(sk(), JSON.stringify(out)); } catch (_) {} }, 5000);
  setInterval(() => { try { if (!started || !creative() || !current) { lastW = null; return; } const key = current.id + '|' + (DIM.cur || ''); if (key === lastW) return; lastW = key;
    setTimeout(() => { try { const L2 = JSON.parse(localStorage.getItem(sk()) || '[]'); for (const [k, x, y, z, dm] of L2) { if ((dm || '') !== (DIM.cur || '')) continue; if ([...KEEP].some(a => a.eggKey === k && a.g.position.distanceTo(new THREE.Vector3(x, y, z)) < 0.6)) continue;
        if (BYKEY[k]) spawnEgg(k, x, y, z); else { const HELL = new Set(['imp', 'hound', 'ghost', 'blazeskel', 'dragon']); let m = null; flags(true); window.__eggSpot = [x, y, z, x, z];
          try { if (HELL.has(k)) m = hellMake(k, x, y, z); else { const was = DIM.cur; if (was) DIM.cur = null; try { m = spawnMob(k); } finally { DIM.cur = was; } } } catch (_) {} finally { flags(false); window.__eggSpot = null; }
          if (m && m.g) { m.g.position.set(x, y, z); mark(m, k); } } U.restored++; } } catch (_) {} doneW = key; }, 3000); } catch (_) {} }, 1500);
})();
