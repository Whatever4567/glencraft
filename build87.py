import sys
s=open('/workspace/s1_0968final.js').read().replace("GAME_VERSION = 'v0.9.68'","GAME_VERSION = '%s'"%sys.argv[1])
R=[("BROOCH: 218, QUAICH: 219","BROOCH: 325, QUAICH: 326"),
("218: 'Luckenbooth brooch', 219: 'Gold quaich'","325: 'Luckenbooth brooch', 326: 'Gold quaich'"),
("CREATIVE_ALL.push(212, 213, 214, 216, 217, 218, 219, 220)","CREATIVE_ALL.push(212, 213, 214, 216, 217, 325, 326, 220)"),
("const HIVE = 244, COMB = 245, BOTTLE = 246, HONEY = 247, BEE_EGG = 318;","const HIVE = 244, COMB = 322, BOTTLE = 323, HONEY = 324, BEE_EGG = 318;"),
("    a.gruntT = (a.gruntT == null ? 4 + Math.random() * 8 : a.gruntT) - dt; if (a.gruntT <= 0) { a.gruntT = 9 + Math.random() * 16; if (dist < 18) voice(a, Math.random() < .5 ? 'hrr' : 'hmm'); }","    // v0.9.92: idle chatter lives in C111"),
('let xp = 0, lvl = 0;','let xp = 0, lvl = 0; window.__c105xp = (a, b) => { xp = a | 0; lvl = b | 0; };'),
('if (!save) { xp = 0; lvl = 0; }','if (!save && !window.__keepXP) { xp = 0; lvl = 0; }'),
# v0.9.87: hostiles spot you from ~32 blocks, zombies hit harder with a real knockback and attack from arm's length
('const sees = !dead && started && dist <= 8 && canSee(a, 8);',"const sees = !dead && started && (a.kind === 'zombie' || a.kind === 'skeleton' ? (dist <= 7 || (dist <= 32 && ((a.losT = (a.losT || 0) - dt) > 0 ? a.los : (a.losT = 0.2, a.los = canSee(a, 32))))) : dist <= 8 && canSee(a, 8));   // v0.9.87: clear line of sight up to 32 blocks, or really close"),
('if (a.aggro > 0 && dist < 22 && !dead) {','if (a.aggro > 0 && dist < 34 && !dead) {'),
('spd = dist > 1.0 ? a.speed : 0;',"spd = dist > (a.kind === 'zombie' ? 1.2 : 1.0) ? a.speed : 0;"),
("a.kind === 'zombie' && dist < 1.4","a.kind === 'zombie' && dist < 1.75"),
("hurt(3, 'A mossy zombie got you.'); a.swing = .3; knockPlayer(dpx / (dist || 1), dpz / (dist || 1), 5, 3);","hurt(5, 'A mossy zombie got you.'); a.swing = .3; knockPlayer(dpx / (dist || 1), dpz / (dist || 1), 8.5, 4.6); try { shake(0.12, 0.02); } catch (_) {}"),
("hurt(a.dmg, a.kind === 'hound' ? 'Mauled by a demon hound.' : 'Clawed by an imp.'); }","hurt(a.dmg, a.kind === 'hound' ? 'Mauled by a demon hound.' : 'Clawed by an imp.'); try { const q = a.g.position, l = Math.hypot(P.x - q.x, P.z - q.z) || 1; knockPlayer((P.x - q.x) / l, (P.z - q.z) / l, 4.5, 2.6); } catch (_) {} }"),
# v0.9.88: quick-torch on LT with a tool / non-placeable item / empty hand
("function useItem() {\n  if (menuOpen || paused || dead || !started) return;\n  const id = selId, have = cnt(id) > 0;","function useItem() {\n  if (menuOpen || paused || dead || !started) return;\n  let id = selId, have = cnt(id) > 0, qtUse = false;"),
("  if (!PLACEABLE.has(id)) { if (have) toast(NAMES[id] + \" can't be placed\"); return; }","  if ((!PLACEABLE.has(id) || !have) && r && (MODE.infinite || cnt(T.TORCH) > 0) && visibleItems().indexOf(T.TORCH) >= 0) { id = T.TORCH; have = true; qtUse = true; }\n  if (!PLACEABLE.has(id)) return;"),
# v0.9.89: Minecraft-style light - 1 level per block, torch 14 / lava & lamps 15, max(block, sky) with a never-pitch-black floor
("const LM = 8, SFALL = 2, BFALL = 2, RS = CH + LM * 2;","const LM = 14, SFALL = 1, BFALL = 1, RS = CH + LM * 2; const LATT = window.__LATT = new Uint8Array(256); try { LATT[T.WATER] = 1; for (let i = 0; i < 256; i++) if (LEAFY[i]) LATT[i] = 1; LATT[T.LEAVES] = 1; LATT[134] = 1; } catch (_) {}"),
("LCURVE[i] = 0.14 + 0.86 * Math.pow(f, 1.4); BCURVE[i] = Math.pow(f, 1.5);","LCURVE[i] = Math.pow(f, 1.4); BCURVE[i] = Math.pow(f, 1.4);"),
("let sum = l0 < 0 ? 0.14 : l0, bs = b0, cnt = 1;","let sum = l0 < 0 ? 0 : l0, bs = b0, cnt = 1;"),
("  vDif = k * (dir + ind * RECIPROCAL_PI * ls + vec3(1.0, 0.6, 0.3) * litB * uFlick * 0.6);","  vec3 skL = dir * ls + ind * RECIPROCAL_PI * ls, blL = vec3(1.0, 0.74, 0.46) * litB * uFlick * 1.05;\n  vDif = k * max(max(skL, blL), vec3(uLMin));"),
("uniform vec3 uEm[${NEM}]; uniform float uEmL[${NEM}]; uniform float uWet; uniform float uFlick;","uniform vec3 uEm[${NEM}]; uniform float uEmL[${NEM}]; uniform float uWet; uniform float uFlick; uniform float uLMin;"),
("  mat.userData.tmat = 1;","  mat.userData.tmat = 1; mat.uniforms.uLMin = window.__lminU || (window.__lminU = {value: 0.3});"),
("totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.6, 0.3) * vLitB * uFlick * 0.6;","totalEmissiveRadiance += diffuseColor.rgb * (vec3(1.0, 0.74, 0.46) * vLitB * uFlick * 0.9 + vec3(0.2 * (1.0 - vLitS)));"),
('        if (A[ci] >= l) continue; if (useTop && ny > LTOP[nx * RS + nz]) continue; if (lop(LX0 + nx, ny, LZ0 + nz)) continue; A[ci] = l; LQ[qn++] = ci; } } }','        const wx = LX0 + nx, wz = LZ0 + nz, wv = (wx < 0 || wz < 0 || wx >= W || wz >= D) ? 0 : world[(wx * H + ny) * D + wz]; if (wv !== 0 && !chunkST[wv]) continue; const l2 = l - LATT[wv]; if (l2 <= 0 || A[ci] >= l2) continue; if (useTop && ny > LTOP[nx * RS + nz]) continue; A[ci] = l2; LQ[qn++] = ci; } } }'),
# v0.9.90: quick torch is silent when it can't place, and the LEFT hand does the placing
("  swing('place'); placeT = 0.2; sfx('place', 1, matOf(id));","  if (qtUse) { try { if (window.__qtSwing) window.__qtSwing(); } catch (_) {} } else { swing('place'); placeT = 0.2; } sfx('place', 1, matOf(id));"),
("toast('Torches go on the ground, a wall or a ceiling'); return; }","if (!qtUse) toast('Torches go on the ground, a wall or a ceiling'); return; }"),
("{ toast(NAMES[id] + ' needs solid ground below'); return; }","{ if (!qtUse) toast(NAMES[id] + ' needs solid ground below'); return; }"),
# v0.9.91: giant spiders are neutral - only fight back when you hit them, and go after a skeleton that shoots them
("    if (a.flee > 0) { a.flee -= dt; a.state = 'scuttle'; a.tgtAng = Math.atan2(-dx, -dz); }","    if (a.mad > 0) a.mad -= dt * (dP > 22 ? 1.6 : 0.12);\n    if (a.vic && window.__c110 && __c110.hunt(a, dt)) { }\n    else if (a.mad > 0 && !dead && dP >= 7 && dP < 44) { a.state = 'scuttle'; a.st = 0.4; a.tgtAng = Math.atan2(dx, dz); }\n    else if (a.flee > 0) { a.flee -= dt; a.state = 'scuttle'; a.tgtAng = Math.atan2(-dx, -dz); }"),
("    else if (near && dP < 7 && a.state !== 'lunge') {","    else if (near && a.mad > 0 && dP < 7 && a.state !== 'lunge') {"),
("    if (!dead && dP < 3.4 && Math.abs(P.y - p.y) < 3 && a.biteCd <= 0 && (a.state === 'lunge' || a.state === 'threat')) {","    if (!dead && a.mad > 0 && !a.vic && dP < 3.4 * (a.g.scale.x || 1) && Math.abs(P.y - p.y) < 3 * (a.g.scale.x || 1) && a.biteCd <= 0 && (a.state === 'lunge' || a.state === 'threat')) {"),
("const SP = 110, nx = Math.ceil(W / SP)","const SP = (window.__c113 && __c113.bigBio()) ? ((window.__c131 && __c131.on()) ? 205 : 150) : 110, nx = Math.ceil(W / SP)"),
# v1.0.12: c131 worlds carve their own connected cave network instead of these passes
("if (genVer === GEN9 && W > 200) { try { const t = performance.now(); g9Underground();","if (genVer === GEN9 && W > 200 && !window.__g12) { try { const t = performance.now(); g9Underground();"),
("window.__c54 = carveCaves();","if (!window.__g12) window.__c54 = carveCaves();"),
("if (d > 0.36 + depthK * 0.35 || (t < 0.045 && y > 8)) world[col + y * D] = y <= 6 ? T.LAVA : T.AIR;","if (!window.__g12 && (d > 0.36 + depthK * 0.35 || (t < 0.045 && y > 8))) world[col + y * D] = y <= 6 ? T.LAVA : T.AIR;"),
("for (let n = 0; n < Math.round(A * 0.6); n++) {","for (let n = 0; n < (window.__g12 ? 0 : Math.round(A * 0.6)); n++) {"),
("try { st.caves = linkCaves(); }","try { if (!window.__g12) st.caves = linkCaves(); }"),
# v1.0.15: gentler G2 current (rivers add their own gentle push in c134)
("return m ? [fx / m, fz / m, b === T.LAVA ? 0.6 : 2.0] : null;","return m ? [fx / m, fz / m, b === T.LAVA ? 0.6 : 1.2] : null;"),
# v1.0.14: Reset terrain builds the new world with the new (c131) generator
("cityGen = false; gSeed = ((Math.random() * 2 ** 31) | 0) || 12345; cityEdits = new Map();","cityGen = false; gSeed = ((Math.random() * 2 ** 31) | 0) || 12345; cityEdits = new Map(); try { if (current && current.mode !== 'creative') { current.l94 = true; current.g12 = true; current.g15 = true; current.g21 = true; } } catch (_) {}"),
("cityGen = false; castleAvoid = []; gSeed = ((Math.random() * 2 ** 31) | 0) || 4242; cityEdits = new Map();","cityGen = false; castleAvoid = []; gSeed = ((Math.random() * 2 ** 31) | 0) || 4242; cityEdits = new Map(); try { if (current && current.mode !== 'creative') { current.l94 = true; current.g12 = true; current.g15 = true; current.g21 = true; } } catch (_) {}"),
("const i = gx * gd + gz, b = sites[bi].b;","const i = gx * gd + gz, b = window.__c113 ? __c113.bioOv(x, z, sites[bi].b) : sites[bi].b;"),
# v1.0.1
('const armour = [0, 0, 0, 0];','const armour = [0, 0, 0, 0, 0];'),
("if (caveK > 0.25 && countKind('spider') < 3) spawnMob('spider');","if (caveK > 0.25 && countKind('spider') + countKind('nspider') < 1) spawnMob('spider');"),
('const MOB_CAP = {passive: 5, hostile: 4, spider: 2, total: 12}','const MOB_CAP = {passive: 5, hostile: 4, spider: 1, total: 12}'),
('const wy = SEA - 0.18, inWater = getB(Math.floor(pos.x), SEA - 1, Math.floor(pos.z)) === T.WATER && pos.y < SEA + 0.3;','const SEA = a.wl || window.__seaNow(); const wy = SEA - 0.18, inWater = getB(Math.floor(pos.x), SEA - 1, Math.floor(pos.z)) === T.WATER && pos.y < SEA + 0.3;'),
('sn = raining && high && FANCY','sn = raining && high'),
('for (const k in STAIRS) { const a = L[k]; if (!a || !a.length) continue;','for (const [k, a, wv] of (window.__stGroups ? __stGroups(L) : Object.keys(STAIRS).map(k => [k, L[k], 0]))) { if (!a || !a.length) continue;'),
('const mm = BLOCK_MATS[k];','const mm = window.__stMat ? __stMat(wv, +k) : BLOCK_MATS[k];'),
('box(A, q[0], y + 0.5, q[1], q[2], y + 1, q[3]);','{ const qm = +k !== 145 && window.__stQ ? __stQ(x, y, z) : 0; if (qm) { for (let qb = 0; qb < 4; qb++) if (qm >> qb & 1) { const qx = x + (qb & 1) * 0.5, qz = z + (qb >> 1) * 0.5; box(A, qx, y + 0.5, qz, qx + 0.5, y + 1, qz + 0.5); } } else if (+k !== 145) box(A, q[0], y + 0.5, q[1], q[2], y + 1, q[3]); }'),
# v1.0.7: Friendly Mobs - spawning keeps going while mobs update with the player "unseen"
("  if (!isNight || dead) return;\n  nightT += dt;","  if (!isNight || (dead && !window.__fdead)) return;\n  nightT += dt;"),
("if (guardT > 0 || !started || dead) return; guardT = 4;","if (guardT > 0 || !started || (dead && !window.__fdead)) return; guardT = 4;"),
("    if (!started || paused || dead || DIM.cur || !chunkST) return;","    if (!started || paused || (dead && !window.__fdead) || DIM.cur || !chunkST) return;"),
  ("      const kind = pickKind(), why = check(L, x, y, z, kind === 'giant');", "      const kind = pickKind(), why = check(L, x, y, z, kind === 'giant');\n      if (!why && solidTop(x, z) <= y + 2) { no('surface'); continue; }   // v1.0.8: the classic four live underground only"),
("const add = () => { const t = $('scr-title'); if (!t || $('osmCredit')) return;", "const add = () => { return; const t = $('scr-title'); if (!t || $('osmCredit')) return;"),
("tip.textContent = 'Fetching the map of Clydebank...';", "tip.textContent = 'Building your world...';"),
("tip.textContent = 'Fetching the 1 m map of Dalmuir, Duntocher and Mountblow...';", "tip.textContent = 'Building your world...';"),
("tip.textContent = 'Fetching the 2-blocks-per-metre map of Dalmuir, Mountblow, Duntocher and Clydebank...';", "tip.textContent = 'Building your world...';"),
("toast('Could not load the Clydebank map, using the Highlands')", "toast('Could not load the town map, using the Highlands')"),
("toast('Could not load the Clydebank map')", "toast('Could not load the town map')"),
("const HINT_PAD = 'Controller: ", "const HINT_PAD = '<span class=\"padok\" title=\"Controller support\">\\u2705</span>' || '"),
("(controller: A = shuffle playlist, X = file, B = cancel)", "<span class=\"padok\">\\u2705</span>"),
("<span>Bluetooth controller support included</span>", "<span class=\"padok\" title=\"Controller support\">\\u2705</span>"),
("e.innerHTML = 'LB / RB: tabs &nbsp; LT / RT: category &nbsp; D-pad: choose &nbsp; A: pick up / craft &nbsp; X: half &nbsp; Y: quick-move &nbsp; B: back';", "e.innerHTML = '<span class=\"padok\">\\u2705</span>';"),
("spawnMob = function (kind) { if (kind === 'puffer') kind = 'creeper'; return sm.call(this, kind); };","spawnMob = function (kind) { if (kind === 'puffer' && !window.__egg) kind = 'creeper'; return sm.call(this, kind); };"),
("spawnMob = function (kind) { if (kind === 'guardian') return null; return sm.apply(this, arguments); };","spawnMob = function (kind) { if (kind === 'guardian' && !window.__egg) return null; return sm.apply(this, arguments); };"),
("const clear = () => { for (const a of mobs.slice()) if (a.kind === 'guardian') removeMob(a); };","const clear = () => { for (const a of mobs.slice()) if (a.kind === 'guardian' && !a.egg) removeMob(a); };"),
# v1.0.28: the texture array grows straight to the size a world needs (c160 pre-warm) instead of re-uploading every layer at each step
("alloc(Math.min(256, Math.max(PHONE ? 24 : 40, Math.ceil(cap * 1.5))))","alloc(Math.min(256, Math.max(PHONE ? 24 : 40, Math.ceil(cap * 1.5), window.__taNeed | 0)))"),
# v1.0.31: a bigger Hell (384 at 1:2.25 for the big Highlands, 224 otherwise)
("    HELL_W = ORE18 ? 288 : 160;\n    const ow = DIM.ow && DIM.ow.P; window.__hellAt = ORE18 && ow ? [Math.max(14, Math.min(HELL_W - 15, Math.round(ow.x / 3))), Math.max(14, Math.min(HELL_W - 15, Math.round(ow.z / 3)))] : null;",
 "    HELL_W = ORE18 ? 384 : 224;\n    const ow = DIM.ow && DIM.ow.P; window.__hellAt = ORE18 && ow ? [Math.max(14, Math.min(HELL_W - 15, Math.round(ow.x / 2.25))), Math.max(14, Math.min(HELL_W - 15, Math.round(ow.z / 2.25)))] : null;"),
# v1.0.32: one reset button (Reset world / Reset Hell) - the old separate button is hidden, and the in-menu ask replaces the native confirm
("setInterval(() => { const b = $('resetTerrainBtn'); if (b) b.style.display = DIM.cur ? '' : 'none'; }, 500);","setInterval(() => { const b = $('resetTerrainBtn'); if (b && b.style.display !== 'none') b.style.display = 'none'; const w = $('resetWorldBtn'); if (w) { const t = DIM.cur === 'hell' ? 'Reset Hell' : DIM.cur === 'backrooms' ? 'Reset Backrooms' : 'Reset world'; if (w.textContent !== t) w.textContent = t; } }, 400);"),
("if (!confirm('Reset ' + nm + '?","if (!window.__dimNoAsk && !confirm('Reset ' + nm + '?"),
# v1.0.32: Hell is always the new big size (not only for the newest Highlands saves), mapped from the overworld by its width
("    HELL_W = ORE18 ? 384 : 224;\n    const ow = DIM.ow && DIM.ow.P; window.__hellAt = ORE18 && ow ? [Math.max(14, Math.min(HELL_W - 15, Math.round(ow.x / 2.25))), Math.max(14, Math.min(HELL_W - 15, Math.round(ow.z / 2.25)))] : null;",
 "    HELL_W = 384;\n    const ow = DIM.ow && DIM.ow.P, hs = HELL_W / ((DIM.ow && DIM.ow.W) || BIG); window.__hellAt = ow ? [Math.max(14, Math.min(HELL_W - 15, Math.round(ow.x * hs))), Math.max(14, Math.min(HELL_W - 15, Math.round(ow.z * hs)))] : null;"),
# v1.0.42: the new map (GLX-C208) - beach sand, marsh peat and mud, tree cover by region
("else if (h <= SEA + 1 && c.glen > 0.4) {","else if ((h <= SEA + 1 && c.glen > 0.4) || (c.sand && h <= SEA + 4)) {"),
("else if (c.glen > 0.6 && bog > 0.18) {","else if ((c.glen > 0.6 && bog > 0.18) || (c.mar && bog > -0.03)) {"),
("if (kind === 1 && sp !== 'juniper') p *= 0.35; else if (kind === 2) p *= 0.4;","if (kind === 1 && sp !== 'juniper') p *= 0.35; else if (kind === 2) p *= 0.4; if (window.__treeP) p *= __treeP(x, z);"),
("if (invTab === 'char' && !$('craft').classList.contains('hidden')) charYaw += axes.rx * 0.08;","if ((invTab === 'char' || invTab === 'bag') && !$('craft').classList.contains('hidden')) { const tv = axes.rx * 3.2 * (SET.pad || 1.8) / 1.8, v0 = window.__ryv || 0; window.__ryv = v0 + (tv - v0) * 0.22; charYaw += window.__ryv / 60; }"),
("  const hb = $('invHot'); hb.innerHTML = '';\n  (MODE.hotbar || []).forEach((id, i) => {","  const hb = $('invHot'); const sigH = (MODE.hotbar || []).map(q => q + ':' + cnt(q)).join(',') + '|' + selId + '|' + !!MODE.infinite; const skipH = hb.__sig === sigH && hb.children.length; hb.__sig = sigH; if (!skipH) hb.innerHTML = '';\n  if (!skipH) (MODE.hotbar || []).forEach((id, i) => {"),("  const g = $('invGrid'); g.innerHTML = '';\n  bagItems().forEach((id, i) => {","  const g = $('invGrid'); const BI = bagItems(), sigG = BI.map(q => q + ':' + cnt(q)).join(',') + '|' + (MODE.hotbar || []).join(','); window.__bagSkip = g.__sig === sigG && g.children.length > 0; g.__sig = sigG; if (!window.__bagSkip) g.innerHTML = '';\n  if (!window.__bagSkip) BI.forEach((id, i) => {")
,("const TABS = ['bag', 'craft', 'char'];","const TABS = ['bag', 'craft'];"),("if (!charR || !menuOpen || invTab !== 'char' ||","if (!charR || !menuOpen || (invTab !== 'char' && invTab !== 'bag') ||")
]
# v1.1.17: the north extension (GLX-C307) - the block helpers answer for z < 0 through __XG/__XS, map edge faces look north via __XN
R+=[("const idx = (x, y, z) => (x * H + y) * D + z;","var __XG = null, __XS = null, __XN = null, __XZ = 0;\nconst idx = (x, y, z) => (x * H + y) * D + z;"),
("function getB(x, y, z) {\n  if (x < 0","function getB(x, y, z) {\n  if (z < 0 && __XG && x >= 0 && x < W) return __XG(x, y, z);\n  if (x < 0"),
("function setB(x, y, z, v) {\n  if (x < 0","function setB(x, y, z, v) {\n  if (z < 0 && __XS && x >= 0 && x < W) { __XS(x, y, z, v); return; }\n  if (x < 0"),
("  if (y >= H) return false;\n  if (x < 0 || x >= W || z < 0 || z >= D) return true;\n  const b = world[idx(x, y, z)];","  if (y >= H) return false;\n  if (z < 0 && __XG && x >= 0 && x < W) { if (z < __XZ) return true; const e = __XG(x, y, z); return e !== T.AIR && e !== T.WATER && e !== T.LAVA && e !== T.TORCH && PLANT[e] !== 1; }\n  if (x < 0 || x >= W || z < 0 || z >= D) return true;\n  const b = world[idx(x, y, z)];"),
("function groundTop(x, z) {\n  if (x < 0 || x >= W || z < 0 || z >= D) return 0;","function groundTop(x, z) {\n  if (x < 0 || x >= W || (z < 0 && !(__XG && z >= __XZ)) || z >= D) return 0;"),
("function colTop(x, z) { return (x < 0 || x >= W || z < 0 || z >= D) ? 0","function colTop(x, z) { return (x < 0 || x >= W || (z < 0 && !(__XG && z >= __XZ)) || z >= D) ? 0"),
("function skyTop(x, z) {\n  if (x < 0 || x >= W || z < 0 || z >= D) return 0;","function skyTop(x, z) {\n  if (x < 0 || x >= W || (z < 0 && !(__XG && z >= __XZ)) || z >= D) return 0;"),
("  if (E[3]) { openMenu(true); setTab('char'); }","  if (E[3]) { if (!(window.__c309 && __c309.yBtn && __c309.yBtn())) { openMenu(true); setTab('char'); } }"),
("  if (y >= H - 1) return;\n","  if (y >= H - 1 && !(window.__c317 && __c317.on() && !__c317.foot(x, z))) return;\n"),
("else { if (z === 0) continue; n = world[i - 1]; }","else { if (z === 0) { if (!__XN) continue; n = __XN(x, y); } else n = world[i - 1]; }"),
("  blockGroup.add(grp); chunkObjs.set(id, grp);\n}\n\n/* ===================== GLX-B8b","  blockGroup.add(grp); chunkObjs.set(id, grp);\n}\nvar __bcBase = buildChunk;\n\n/* ===================== GLX-B8b")]
R.append(("        const x = a[i], y = a[i + 1], z = a[i + 2], f = stairFace(x, y, z);\n","        const x = a[i], y = a[i + 1], z = a[i + 2], f = stairFace(x, y, z);\n        if (+k !== 145 && window.__rampSt && __rampSt(x, y, z, A)) continue;\n"))
for a,b in R:
  assert s.count(a)==1,a; s=s.replace(a,b)
parts=[l.strip() for l in open('/workspace/game/src/ORDER.txt') if l.strip() and not l.startswith('#')]
import os
for _n in os.environ.get('DROP','').split(','):
    if _n in parts: parts.remove(_n)
open('/workspace/game/s1.js','w').write(s+'\n'+'\n'.join(open('/workspace/game/src/'+n).read() for n in parts))
