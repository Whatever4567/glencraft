/* ===================== GLX-C77a (v0.9.62): ruby, lazurite, cobalt - ores, gems, blocks, cobalt tools + armour (a tier above diamond) ===================== */
(function c77a() {
  Object.assign(T, {RUBYORE: 232, LAZORE: 233, COBALTORE: 234, RUBYBLOCK: 235, LAZBLOCK: 236, COBALTBLOCK: 237});
  Object.assign(IT, {RUBY: 260, LAZURITE: 261, RAWCOBALT: 262, COBALTINGOT: 263, CPICK: 264, CAXE: 265, CSWORD: 266, CSHOVEL: 267, CHOE: 268, KHELM: 269, KCHEST: 270, KLEGS: 271, KBOOTS: 272});
  // ---- textures: pixel recolours of the pack's own diamond ore / iron block (same shapes), made once those images load ----
  const gemRule = {ruby: (r, g, b) => [Math.max(g, b), r * 0.85, r * 0.95], laz: (r, g, b) => [r * 0.35, g * 0.42, b], cobalt: (r, g, b) => [g * 0.42, g * 0.5, b]};
  const tint = {ruby: [1.05, 0.22, 0.26], laz: [0.22, 0.36, 1.0], cobalt: [0.42, 0.5, 1.0]};
  const JOBS = [['ruby_ore', 'diamond_ore', 'ruby', 0], ['lazurite_ore', 'diamond_ore', 'laz', 0], ['cobalt_ore', 'diamond_ore', 'cobalt', 1], ['ruby_block', 'iron_block', 'ruby', 2], ['lazurite_block', 'iron_block', 'laz', 2], ['cobalt_block', 'iron_block', 'cobalt', 2]];
  for (const [k] of JOBS) { const t = new THREE.Texture(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = TEXANISO; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; texCache[k] = t; }
  const isGem = (r, g, b) => (g + b) / 2 - r > 26 && Math.min(g, b) > r;
  function recolour(src, mode, kind, under) {
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const g = c.getContext('2d'); g.drawImage(src, 0, 0);
    const im = g.getImageData(0, 0, c.width, c.height), d = im.data; let ud = null;
    if (under) { const u = document.createElement('canvas'); u.width = c.width; u.height = c.height; const ug = u.getContext('2d'); ug.drawImage(under, 0, 0, c.width, c.height); ud = ug.getImageData(0, 0, c.width, c.height).data; }
    for (let i = 0; i < d.length; i += 4) { const r = d[i], gg = d[i + 1], b = d[i + 2];
      if (kind === 2) { const l = (r * 0.3 + gg * 0.59 + b * 0.11) * 1.08, t = tint[mode]; d[i] = Math.min(255, l * t[0]); d[i + 1] = Math.min(255, l * t[1]); d[i + 2] = Math.min(255, l * t[2]); continue; }
      if (isGem(r, gg, b)) { const o = gemRule[mode](r, gg, b); d[i] = Math.min(255, o[0]); d[i + 1] = Math.min(255, o[1]); d[i + 2] = Math.min(255, o[2]); }
      else if (ud) { d[i] = ud[i]; d[i + 1] = ud[i + 1]; d[i + 2] = ud[i + 2]; } }
    g.putImageData(im, 0, 0); return c; }
  const done = new Map();
  function texPass() { let left = 0;
    for (const [k, base, mode, kind] of JOBS) { const src = texImg[base]; const und = kind === 1 ? texImg[FACES[T.HELLROCK]] : null;
      if (!src || (kind === 1 && !und)) { left++; continue; } if (done.get(k) === src) continue;
      try { const c = recolour(src, mode, kind, und); texImg[k] = c; const t = texCache[k]; t.image = c; t.needsUpdate = true; done.set(k, src);
        const s = document.createElement('canvas'); s.width = s.height = 64; s.getContext('2d').drawImage(c, 0, 0, 64, 64); AVG[k] = AVG[base] || 0x777777;
        let st = document.getElementById('c77css'); if (!st) { st = document.createElement('style'); st.id = 'c77css'; document.head.appendChild(st); }
        st.textContent = st.textContent.split('\n').filter(l => l && !l.startsWith('.ic-' + k + '{')).concat('.ic-' + k + '{background-image:url(' + s.toDataURL() + ') !important}').join('\n'); } catch (e) { console.warn('c77 tex', k, e); } }
    return left; }
  let tries = 0; const iv = setInterval(() => { texPass(); if (++tries > 120) clearInterval(iv); }, 500);
  window.__c77tex = texPass;
  // ---- blocks ----
  const BL = [[232, 'ruby_ore', 'Ruby ore', 3, 3, 1], [233, 'lazurite_ore', 'Lazurite ore', 3, 2, 1], [234, 'cobalt_ore', 'Cobalt ore', 30, 4, 1],
    [235, 'ruby_block', 'Block of ruby', 5, 3, 0], [236, 'lazurite_block', 'Block of lazurite', 3, 2, 0], [237, 'cobalt_block', 'Block of cobalt', 50, 4, 0]];
  for (const [id, key, name, hd, req, nat] of BL) { FACES[id] = key; BLOCK_MATS[id] = mat(key); NAMES[id] = name; ICON_KEY[id] = key; HARD[id] = hd * 1.1; MC_HARD[id] = hd; REQ[id] = req; NEEDS_PICK.add(id); PLACEABLE.add(id);
    if (!ORDER.includes(id)) ORDER.push(id); try { if (nat) __NAT[id] = 1; } catch (_) {} }
  // ruby ore glints red like diamond ore glints cyan
  (function () { const m = BLOCK_MATS[232]; if (!m || !m.emissive) return; m.emissive.setHex(0x7a1a22); m.emissiveMap = m.map; m.needsUpdate = true;
    setInterval(() => { const t = performance.now() / 1000; m.emissiveIntensity = 0.3 + 0.3 * Math.max(0, Math.sin(t * 2.1 + 2)) + 0.2 * Math.max(0, Math.sin(t * 6.3)) ** 8; }, 80); })();
  // ---- items ----
  Object.assign(NAMES, {[IT.RUBY]: 'Ruby', [IT.LAZURITE]: 'Lazurite', [IT.RAWCOBALT]: 'Raw cobalt', [IT.COBALTINGOT]: 'Cobalt ingot', [IT.CPICK]: 'Cobalt pickaxe', [IT.CAXE]: 'Cobalt axe', [IT.CSWORD]: 'Cobalt sword',
    [IT.CSHOVEL]: 'Cobalt shovel', [IT.CHOE]: 'Cobalt hoe', [IT.KHELM]: 'Cobalt helmet', [IT.KCHEST]: 'Cobalt chestplate', [IT.KLEGS]: 'Cobalt leggings', [IT.KBOOTS]: 'Cobalt boots'});
  MATCOL.cobalt = '#5a72e0'; ARMOUR_COL.cobalt = 0x4a62d8; TOOL_COL.cobalt = 0x5a72e0;
  [[IT.CPICK, 'pick', 9, 6], [IT.CAXE, 'axe', 9, 8], [IT.CSWORD, 'sword', 1, 8], [IT.CSHOVEL, 'shovel', 9, 3.5], [IT.CHOE, 'hoe', 1.5, 1]].forEach(([id, k, s, d]) => { TOOL[id] = [k, 5, s, d]; TOOLS.add(id); TOOL_MATX[id] = 'cobalt'; ICONS[id] = toolIcon(k, MATCOL.cobalt); });
  HOES.add(IT.CHOE);
  [IT.KHELM, IT.KCHEST, IT.KLEGS, IT.KBOOTS].forEach((id, s) => { ARMOUR[id] = {slot: s, mat: 'cobalt', pts: [3, 8, 6, 3][s]}; ICONS[id] = armourIcon(s, MATCOL.cobalt); });
  ICONS[IT.LAZURITE] = lump('#2448b8', '#6f8ff0', '#e2c25a'); ICONS[IT.RAWCOBALT] = lump('#33406e', '#7488d8', '#1c2340'); ICONS[IT.COBALTINGOT] = ingot('#4a62d8', '#a8b8ff');
  ICONS[IT.RUBY] = ICONS[IT.DIAMOND];
  (function rubyIcon() { const src = ICONS[IT.DIAMOND]; if (typeof src !== 'string') return; const im = new Image(); im.onload = () => { const c = recolour(im, 'ruby', 0, null); ICONS[IT.RUBY] = c.toDataURL(); try { renderHotbar(); } catch (_) {} }; im.src = src; })();
  // held 3D tool heads: steel-look like diamond, cobalt blue
  const hm = headMatFor; headMatFor = function (m) { if (m !== 'cobalt') return hm.apply(this, arguments); const r = hm.call(this, 'diamond'); r.color.setHex(0x6a84f0); r.needsUpdate = true; return r; };
  // ---- drops + smelting ----
  const df = dropsFor; dropsFor = function (b) {
    if (b === T.RUBYORE) return [[IT.RUBY, 1]];
    if (b === T.LAZORE) return [[IT.LAZURITE, 4 + (Math.random() * 6 | 0)]];
    if (b === T.COBALTORE) return [[IT.RAWCOBALT, Math.random() < 0.5 ? 2 : 1]];
    return df.apply(this, arguments); };
  SMELT[IT.RAWCOBALT] = IT.COBALTINGOT;
  // ---- recipes ----
  const R = (n, h, o, c, need, tool) => RECIPES.push(rc(n, h, o, c, need, 1, tool));
  R('Block of ruby', '9 Rubies', T.RUBYBLOCK, 1, [[IT.RUBY, 9]]); R('Rubies (x9)', '1 Block of ruby', IT.RUBY, 9, [[T.RUBYBLOCK, 1]]);
  R('Block of lazurite', '9 Lazurite', T.LAZBLOCK, 1, [[IT.LAZURITE, 9]]); R('Lazurite (x9)', '1 Block of lazurite', IT.LAZURITE, 9, [[T.LAZBLOCK, 1]]);
  R('Block of cobalt', '9 Cobalt ingots', T.COBALTBLOCK, 1, [[IT.COBALTINGOT, 9]]); R('Cobalt ingots (x9)', '1 Block of cobalt', IT.COBALTINGOT, 9, [[T.COBALTBLOCK, 1]]);
  if (T.WOOLBLUE !== undefined) R('Blue wool', '1 Wool + 1 Lazurite (blue dye)', T.WOOLBLUE, 1, [[T.WOOL, 1], [IT.LAZURITE, 1]]);
  [[IT.CPICK, 124, 'pickaxe', 2], [IT.CAXE, 125, 'axe', 2], [IT.CSWORD, 126, 'sword', 2], [IT.CSHOVEL, 127, 'shovel', 1], [IT.CHOE, 128, 'hoe', 1]].forEach(([o, d, n, k]) =>
    R('Cobalt ' + n, 'Diamond ' + n + ' + ' + k + ' Cobalt ingot' + (k > 1 ? 's' : '') + ' + 1 Ruby', o, 1, [[d, 1], [IT.COBALTINGOT, k], [IT.RUBY, 1]], 1));
  [[IT.KHELM, 129, 'helmet', 2], [IT.KCHEST, 130, 'chestplate', 4], [IT.KLEGS, 131, 'leggings', 3], [IT.KBOOTS, 132, 'boots', 2]].forEach(([o, d, n, k]) =>
    R('Cobalt ' + n, 'Diamond ' + n + ' + ' + k + ' Cobalt ingots + 1 Ruby', o, 1, [[d, 1], [IT.COBALTINGOT, k], [IT.RUBY, 1]], 1));
  if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(232, 233, 234, 235, 236, 237, IT.RUBY, IT.LAZURITE, IT.RAWCOBALT, IT.COBALTINGOT, IT.CPICK, IT.CAXE, IT.CSWORD, IT.CSHOVEL, IT.CHOE, IT.KHELM, IT.KCHEST, IT.KLEGS, IT.KBOOTS);
  // ---- mining speed: Minecraft tiers (hand 1, wood 2, stone 4, iron 6, diamond 8, cobalt 9, gold 12) and the diamond pickaxe doubled (cobalt pickaxe kept above it) ----
  const tts = toolTierSpeed; toolTierSpeed = function (id) { const m = toolMat(id), t = TOOL[id];
    if (m === 'cobalt') return t && t[0] === 'pick' ? 18 : 9;
    if (m === 'diamond' && t && t[0] === 'pick') return 16;
    return tts.apply(this, arguments); };
  // combat: cobalt hits one point harder than diamond, same attack speed
  const CD = {sword: 8, axe: 10, pick: 6, shovel: 6.5, hoe: 1};
  const ma = mcAttack; mcAttack = function () { const id = heldToolId(), t = id && TOOL[id]; if (t && toolMat(id) === 'cobalt') return {dmg: CD[t[0]] || 1, cd: 1 / MC_SPD[t[0]][4], kind: t[0]}; return ma.apply(this, arguments); };
  // cobalt armour: like Minecraft netherite, each piece takes 10% off knockback
  try { const kp = knockPlayer; knockPlayer = function (dx, dz, h, v) { const n = armour.filter(id => id && ARMOUR[id] && ARMOUR[id].mat === 'cobalt').length; if (n) { h *= 1 - 0.1 * n; v *= 1 - 0.1 * n; } return kp.call(this, dx, dz, h, v); }; } catch (_) {}
})();
