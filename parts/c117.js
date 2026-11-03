/* ===================== GLX-C117 (v0.9.97): HD bookshelf + books, enchanting table with a working enchant menu, glint, cobalt pick 27, dim zombie eyes ===================== */
(function () {
  const U = window.__c117 = {err: null, made: {}};
  const cv = n => { const c = document.createElement('canvas'); c.width = c.height = n; return c; };
  const rng = s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const PH = !!touchMode; const BOOK = 412; IT.BOOK = BOOK; const ET = 251; T.ENCHTABLE = ET;
  // ---------------- textures ----------------
  function grain(g, S, r, base, dark, lite, seed, vert) { const R = rng(seed); g.fillStyle = base; g.fillRect(0, 0, S, S);
    for (let i = 0; i < S * 1.6; i++) { const p = R() * S, w = 0.6 + R() * 1.6; g.fillStyle = R() < .55 ? dark : lite; g.globalAlpha = 0.08 + R() * 0.2; if (vert) g.fillRect(p, 0, w, S); else g.fillRect(0, p, S, w); }
    g.globalAlpha = 1; }
  function paintShelf() { const S = 256, c = cv(S), g = c.getContext('2d'), R = rng(7741);
    grain(g, S, R, '#3a2412', '#24150a', '#5a3a1e', 11, false);
    const COLS = ['#7a1c1c', '#1f4a2a', '#1d2c5a', '#5a3216', '#8a6a1e', '#4a1f5a', '#1d5656', '#6a1830', '#2a3a22', '#8a3a14'];
    const row = (y0, y1) => { g.fillStyle = '#120a05'; g.fillRect(14, y0, S - 28, y1 - y0);
      let x = 16; while (x < S - 18) { let w = 11 + (R() * 12 | 0); if (x + w > S - 16) w = S - 16 - x; if (w < 6) break; const h = (y1 - y0) * (0.72 + R() * 0.27), top = y1 - h, col = COLS[R() * COLS.length | 0];
        if (R() < 0.08) { x += w * 0.6 | 0; continue; }   // a gap
        const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(.25, 'rgba(255,255,255,.18)'); gr.addColorStop(.6, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)');
        g.fillStyle = col; g.fillRect(x, top, w - 1, h); g.fillStyle = gr; g.fillRect(x, top, w - 1, h);
        // leather speckle
        for (let i = 0; i < w * h / 14; i++) { g.fillStyle = R() < .5 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.07)'; g.fillRect(x + R() * (w - 1), top + R() * h, 1, 1); }
        // gold bands + lettering
        const gold = (yy, hh) => { const gg = g.createLinearGradient(x, 0, x + w, 0); gg.addColorStop(0, '#7a5a12'); gg.addColorStop(.35, '#ffe28a'); gg.addColorStop(.7, '#c9962a'); gg.addColorStop(1, '#6a4a0e'); g.fillStyle = gg; g.fillRect(x + 1, yy, w - 3, hh); };
        gold(top + 5, 2); gold(top + 9, 1); gold(y1 - 8, 2);
        if (R() < .8) { g.fillStyle = '#e8c35a'; const cx = x + w / 2 - 1; for (let yy = top + 16; yy < top + h * 0.62; yy += 5) if (R() < .8) g.fillRect(cx - 1 + (R() * 2 | 0), yy, 2 + (R() * 2 | 0), 2 + (R() < .3 ? 1 : 0)); }
        if (R() < .35) { g.fillStyle = '#1a1208'; g.fillRect(x + 2, top + h * .66, w - 5, 7); g.fillStyle = '#d9b450'; g.fillRect(x + 3, top + h * .66 + 3, w - 7, 1); }
        x += w + (R() < .2 ? 1 : 0); }
      // shadow under the shelf above
      const sg = g.createLinearGradient(0, y0, 0, y0 + 14); sg.addColorStop(0, 'rgba(0,0,0,.6)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(14, y0, S - 28, 14); };
    row(22, 122); row(136, 236);
    // frame: posts, top, middle shelf, bottom (dark oak with bevels)
    const plank = (x, y, w, h) => { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); grain(g, S, R, '#4a2e16', '#2a180a', '#6e4824', (R() * 1e6) | 0, w < h); g.restore();
      g.fillStyle = 'rgba(255,220,170,.16)'; g.fillRect(x, y, w, 2); g.fillRect(x, y, 2, h); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x, y + h - 2, w, 2); g.fillRect(x + w - 2, y, 2, h); };
    plank(0, 0, S, 22); plank(0, 122, S, 14); plank(0, 236, S, 20); plank(0, 22, 14, 100); plank(S - 14, 22, 14, 100); plank(0, 136, 14, 100); plank(S - 14, 136, 14, 100);
    for (const [x, y] of [[6, 10], [S - 7, 10], [6, 246], [S - 7, 246], [6, 129], [S - 7, 129]]) { g.fillStyle = '#1a1006'; g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); g.fillStyle = '#9a8a6a'; g.fillRect(x - 1, y - 1, 1, 1); }
    return c; }
  function obsidian(g, S, seed) { const R = rng(seed); g.fillStyle = '#120a1c'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 90; i++) { const x = R() * S, y = R() * S, r = 8 + R() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, r); const v = R(); gr.addColorStop(0, v < .3 ? 'rgba(70,40,110,.5)' : v < .6 ? 'rgba(30,16,48,.6)' : 'rgba(4,2,8,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 40; i++) { const x = R() * S, y = R() * S; g.strokeStyle = 'rgba(160,120,230,' + (0.12 + R() * .25) + ')'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 26, y + (R() - .5) * 26); g.stroke(); }
    for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(220,200,255,' + R() * .35 + ')'; g.fillRect(R() * S, R() * S, 1, 1); } }
  function goldLine(g, x0, y0, x1, y1, w) { const gr = g.createLinearGradient(x0, y0 - w, x0, y0 + w); gr.addColorStop(0, '#6a4a0e'); gr.addColorStop(.45, '#ffe594'); gr.addColorStop(1, '#8a6214'); g.strokeStyle = gr; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  function cloth(g, x, y, w, h, seed) { const R = rng(seed); g.fillStyle = '#8e1420'; g.fillRect(x, y, w, h);
    for (let i = 0; i < w; i += 2) { g.fillStyle = 'rgba(0,0,0,' + (0.06 + R() * .08) + ')'; g.fillRect(x + i, y, 1, h); }
    for (let j = 0; j < h; j += 2) { g.fillStyle = 'rgba(255,120,120,' + (0.03 + R() * .05) + ')'; g.fillRect(x, y + j, w, 1); } }
  function paintEnchSide() { const S = 256, c = cv(S), g = c.getContext('2d'); obsidian(g, S, 991);
    // red cloth draped over the top quarter, gold trim and a zig-zag hem
    cloth(g, 0, 0, S, 58, 13); g.fillStyle = '#8e1420';
    g.beginPath(); g.moveTo(0, 58); for (let x = 0; x <= S; x += 32) { g.lineTo(x + 16, 72); g.lineTo(x + 32, 58); } g.lineTo(S, 50); g.lineTo(0, 50); g.fill();
    goldLine(g, 0, 52, S, 52, 4); for (let x = 0; x < S; x += 32) { goldLine(g, x, 58, x + 16, 72, 2.5); goldLine(g, x + 16, 72, x + 32, 58, 2.5); g.fillStyle = '#ffd86a'; g.beginPath(); g.arc(x + 16, 74, 3, 0, 7); g.fill(); }
    goldLine(g, 0, 6, S, 6, 3);
    for (let x = 16; x < S; x += 32) { g.fillStyle = '#e8c050'; g.beginPath(); g.moveTo(x, 22); g.lineTo(x + 8, 30); g.lineTo(x, 38); g.lineTo(x - 8, 30); g.closePath(); g.fill(); g.fillStyle = '#7a1018'; g.fillRect(x - 2, 28, 4, 4); }
    // faint carved glyphs glowing in the obsidian
    const R = rng(55); g.strokeStyle = 'rgba(170,110,255,.45)'; g.lineWidth = 2;
    for (let i = 0; i < 7; i++) { const x = 30 + i * 32, y = 150 + (R() * 50 | 0); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y); g.lineTo(x + 8, y + 10); g.moveTo(x + 4, y - 6); g.lineTo(x + 4, y + 14); g.stroke(); }
    // bottom gold rim
    goldLine(g, 0, 248, S, 248, 4);
    return c; }
  function paintEnchTop() { const S = 256, c = cv(S), g = c.getContext('2d'); obsidian(g, S, 4422); cloth(g, 10, 10, S - 20, S - 20, 77);
    const vg = g.createRadialGradient(128, 128, 30, 128, 128, 170); vg.addColorStop(0, 'rgba(255,255,255,.06)'); vg.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = vg; g.fillRect(10, 10, S - 20, S - 20);
    for (const o of [16, 28]) { goldLine(g, o, o, S - o, o, o === 16 ? 4 : 2); goldLine(g, o, S - o, S - o, S - o, o === 16 ? 4 : 2); g.save(); g.translate(0, 0); g.restore();
      const gr = g.createLinearGradient(o - 2, 0, o + 2, 0); gr.addColorStop(0, '#6a4a0e'); gr.addColorStop(.5, '#ffe594'); gr.addColorStop(1, '#8a6214'); g.fillStyle = gr; g.fillRect(o - (o === 16 ? 2 : 1), o, o === 16 ? 4 : 2, S - 2 * o); g.fillRect(S - o - (o === 16 ? 2 : 1), o, o === 16 ? 4 : 2, S - 2 * o); }
    for (const [x, y] of [[22, 22], [S - 22, 22], [22, S - 22], [S - 22, S - 22]]) { g.fillStyle = '#ffd86a'; g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x + 10, y); g.lineTo(x, y + 10); g.lineTo(x - 10, y); g.closePath(); g.fill(); g.fillStyle = '#a01822'; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
    // a gold rune circle in the middle
    g.strokeStyle = 'rgba(240,200,90,.55)'; g.lineWidth = 2; g.beginPath(); g.arc(128, 128, 62, 0, 7); g.stroke(); g.beginPath(); g.arc(128, 128, 50, 0, 7); g.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.save(); g.translate(128 + Math.cos(a) * 56, 128 + Math.sin(a) * 56); g.rotate(a + 1.57); g.fillStyle = 'rgba(255,220,120,.7)'; g.fillRect(-1, -4, 2, 8); g.fillRect(-3, -1, 6, 2); g.restore(); }
    return c; }
  function isoTile(top, side, front) { const c = cv(128), g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    const cx = 64, s = 54, h = 30;   // rhombus top, two side faces
    g.save(); g.setTransform(s / 256, h / 256, -s / 256, h / 256, cx, 6); g.drawImage(top, 0, 0); g.restore();
    g.save(); g.setTransform(s / 256, -h / 256, 0, 62 / 256, cx - s + 0, 6 + h + 0); g.transform(1, 0, 0, 1, 0, 0); g.restore();
    // left face
    g.save(); g.setTransform(s / 256, h / 256, 0, 62 / 256, cx - s, 6 + h); g.drawImage(front, 0, 0); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, 0, 256, 256); g.restore();
    // right face
    g.save(); g.setTransform(s / 256, -h / 256, 0, 62 / 256, cx, 6 + 2 * h); g.drawImage(side, 0, 0); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, 256, 256); g.restore();
    return c.toDataURL(); }
  // ---------------- book item ----------------
  NAMES[BOOK] = 'Book'; ORDER.push(BOOK); if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(BOOK);
  ICONS[BOOK] = drawIcon(g => { g.rotate(-0.18);
    g.fillStyle = '#efe6cc'; g.fillRect(-15, -22, 32, 44); g.fillStyle = '#c9bc98'; for (let y = -20; y < 22; y += 2.2) g.fillRect(14, y, 3, 1);   // page block
    const lg = g.createLinearGradient(-20, 0, 16, 0); lg.addColorStop(0, '#3a1c0c'); lg.addColorStop(.2, '#7a4022'); lg.addColorStop(.6, '#8e4c28'); lg.addColorStop(1, '#5a2c14');
    g.fillStyle = lg; g.strokeStyle = '#1e0e05'; g.lineWidth = 1.6; g.beginPath(); g.roundRect ? g.roundRect(-20, -25, 34, 48, 3) : g.rect(-20, -25, 34, 48); g.fill(); g.stroke();
    g.fillStyle = '#2e1608'; g.fillRect(-20, -25, 6, 48);   // spine
    for (let i = 0; i < 70; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(0,0,0,.18)' : 'rgba(255,220,180,.08)'; g.fillRect(-14 + Math.random() * 27, -24 + Math.random() * 46, 1, 1); }
    g.strokeStyle = '#e8c35a'; g.lineWidth = 1.4; g.strokeRect(-11, -21, 22, 40);
    g.fillStyle = '#ffd86a'; for (const [x, y] of [[-11, -21], [11, -21], [-11, 19], [11, 19]]) { g.beginPath(); g.moveTo(x, y - 3); g.lineTo(x + 3, y); g.lineTo(x, y + 3); g.lineTo(x - 3, y); g.fill(); }
    g.beginPath(); g.moveTo(0, -9); g.lineTo(6, -1); g.lineTo(0, 7); g.lineTo(-6, -1); g.closePath(); g.fill(); g.fillStyle = '#7a3a18'; g.beginPath(); g.arc(0, -1, 2, 0, 7); g.fill();
    g.fillStyle = '#e8c35a'; g.fillRect(-19, -16, 4, 1.5); g.fillRect(-19, 14, 4, 1.5); });
  RECIPES.push(rc('Book', '3 Paper + 1 Wool', BOOK, 1, [[IT.PAPER || 411, 3], [T.WOOL, 1]]));
  // ---------------- bookshelf: HD, 6 planks + 3 books, drops 3 books, quick with an axe ----------------
  for (const r of RECIPES) if (r.out === T.BOOKSHELF) { r.need = [[T.PLANKS, 6], [BOOK, 3]]; r.hint = '6 Planks + 3 Books'; }
  if (!ORDER.includes(T.BOOKSHELF)) ORDER.push(T.BOOKSHELF);
  if (!RECIPES.some(r => r.out === T.BOOKSHELF)) RECIPES.push(rc('Bookshelf', '6 Planks + 3 Books', T.BOOKSHELF, 1, [[T.PLANKS, 6], [BOOK, 3]], 1));
  const shelfC = paintShelf(); U.made.bookshelf = shelfC;
  // ---------------- enchanting table block ----------------
  const eside = paintEnchSide(), etop = paintEnchTop();
  function regTex(key, c) { const t = new THREE.Texture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = TEXANISO; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
    texCache[key] = t; texImg[key] = c; const s = cv(1), sg = s.getContext('2d'); sg.drawImage(c, 0, 0, 1, 1); const d = sg.getImageData(0, 0, 1, 1).data; AVG[key] = (d[0] << 16) | (d[1] << 8) | d[2]; }
  regTex('ench_side', eside); regTex('ench_top', etop);
  FACES[ET] = ['ench_side', 'ench_side', 'ench_top', 'obsidian', 'ench_side', 'ench_side']; BLOCK_MATS[ET] = FACES[ET].map(mat);
  NAMES[ET] = 'Enchanting table'; ICON_KEY[ET] = 'ench_icon'; HARD[ET] = 5.5; MC_HARD[ET] = 5; REQ[ET] = 1; NEEDS_PICK.add(ET); PLACEABLE.add(ET); ORDER.push(ET);
  if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(ET);
  RECIPES.push(rc('Enchanting table', '1 Book + 2 Diamonds + 4 Obsidian', ET, 1, [[BOOK, 1], [IT.DIAMOND, 2], [T.OBSIDIAN, 4]], 1));
  // bookshelf: plank top/bottom, books on the sides
  FACES[T.BOOKSHELF] = ['bookshelf', 'bookshelf', 'planks', 'planks', 'bookshelf', 'bookshelf'];
  BLOCK_MATS[T.BOOKSHELF] = FACES[T.BOOKSHELF].map(mat);
  // tiles
  const st = document.createElement('style'); st.id = 'c117css'; document.head.appendChild(st);
  function tiles() { const pl = texImg.planks && texImg.planks.width ? texImg.planks : shelfC;
    st.textContent = 'body .ic-bookshelf{background-image:url(' + isoTile(pl, shelfC, shelfC) + ') !important}\nbody .ic-ench_icon{background-image:url(' + isoTile(etop, eside, eside) + ') !important}\n' +
      '.c117g{overflow:hidden}.c117g::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:linear-gradient(115deg,rgba(150,60,255,0) 30%,rgba(170,90,255,.55) 44%,rgba(235,190,255,.75) 50%,rgba(170,90,255,.55) 56%,rgba(150,60,255,0) 70%);background-size:320% 100%;animation:c117g 2.6s linear infinite;mix-blend-mode:screen}' +
      '@keyframes c117g{0%{background-position:120% 0}100%{background-position:-120% 0}}' +
      '#enchUI.hidden{display:none!important}#enchUI .tp{background:rgba(22,14,30,.96);color:#efe4ff;border:2px solid #b07aff;border-radius:14px;padding:12px 14px;width:min(480px,94vw);max-height:90vh;overflow:auto;font:14px/1.35 system-ui,sans-serif;box-shadow:0 0 30px rgba(140,60,255,.35)}' +
      '#enchUI h3{margin:0 0 6px;color:#e6c25a;font-size:17px}#enchUI .sec{margin:8px 0 2px;font-weight:700;color:#c9a8ff;font-size:12px;text-transform:uppercase;letter-spacing:.06em}' +
      '#enchUI button{display:flex;align-items:center;gap:6px;width:100%;margin:4px 0;padding:6px 8px;background:#2a1c3a;color:#f3eaff;border:2px solid #4a3466;border-radius:8px;font:600 14px system-ui;cursor:pointer;text-align:left}' +
      '#enchUI button.sel{background:#3e2a5c;border-color:#b07aff}#enchUI button.focus{border-color:#ffd86a;box-shadow:0 0 0 2px #ffd86a55}#enchUI button:disabled{opacity:.45}' +
      '#enchUI .ii{width:26px;height:26px;flex:0 0 26px;background:center/cover no-repeat;border-radius:4px;position:relative}#enchUI .cost{margin-left:auto;font-size:12px;color:#9cff6a;white-space:nowrap}#enchUI .cost.no{color:#ff8a7a}';
  }
  tiles(); setTimeout(tiles, 4000);
  function pass() { const keys = {bookshelf: shelfC, ench_side: eside, ench_top: etop};
    for (const key in keys) { const c = keys[key], ts = new Set([texCache[key] || tex(key)]);
      try { if (matCache[key] && matCache[key].map) ts.add(matCache[key].map); for (const id of [T.BOOKSHELF, ET]) for (const m of [].concat(BLOCK_MATS[id] || [])) if (m && m.map && FACES[id] && [].concat(FACES[id])[[].concat(BLOCK_MATS[id]).indexOf(m)] === key) ts.add(m.map); } catch (_) {}
      texImg[key] = c; for (const t of ts) if (t.image !== c) { t.image = c; t.needsUpdate = true; } } }
  pass(); let tries = 0; const iv = setInterval(() => { try { pass(); } catch (e) { U.err = 'pass ' + e.message; } if (++tries > 150) clearInterval(iv); }, 500);
  // drops + mining speed
  const df = dropsFor; dropsFor = function (b) { if (b === T.BOOKSHELF) return [[BOOK, 3]]; if (b === ET) return [[ET, 1]]; return df.apply(this, arguments); };
  const AXT = {wood: .55, stone: .4, iron: .3, gold: .2, diamond: .22, cobalt: .18};
  const mbs = mcBreakSeconds; mcBreakSeconds = function (b) { const r = mbs.apply(this, arguments);
    if (b === T.BOOKSHELF) { try { const id = heldToolId(), t = id && TOOL[id]; if (t && t[0] === 'axe') return Math.min(r, AXT[toolMat(id)] || .4); } catch (_) {} } return r; };
  // ---------------- cobalt pickaxe 27 (stays above diamond 24) ----------------
  const tts = toolTierSpeed; toolTierSpeed = function (id) { const t = TOOL[id]; let v = (t && t[0] === 'pick' && toolMat(id) === 'cobalt') ? 27 : tts.apply(this, arguments);
    const e = ENCH[id]; if (e && e.eff) v += e.eff * e.eff + 1; return v; };
  // ---------------- enchantments ----------------
  const ENCH = {}; U.ENCH = ENCH; let seed = 1;
  const EN = {eff: ['Efficiency', 5], sharp: ['Sharpness', 5], prot: ['Protection', 4], howk: ['Howk', 1]}; U.EN = EN;   // v1.0.48: Howk (Scots 'to dig') - a pickaxe mines 2 x 3 at once (c226)
  const ROM = ['', 'I', 'II', 'III', 'IV', 'V'];
  const enchText = id => { const e = ENCH[id]; if (!e) return ''; return Object.keys(EN).filter(k => e[k]).map(k => EN[k][0] + ' ' + ROM[e[k]]).join(', '); };
  U.enchText = enchText;
  function kindsFor(id) { if (ARMOUR[id]) return ['prot']; const t = TOOL[id]; if (!t) return []; const k = t[0];
    if (k === 'sword' || k === 'claymore') return ['sharp']; if (k === 'axe') return ['eff', 'sharp']; if (k === 'pick') return ['eff', 'howk']; if (k === 'shovel' || k === 'hoe') return ['eff']; return []; }
  function candidates() { const s = new Set(); for (const a of armour) if (a && kindsFor(a).length) s.add(a); for (const k in inv) { const id = +k; if (inv[k] > 0 && kindsFor(id).length && NAMES[id]) s.add(id); } return [...s]; }
  const mca = mcAttack; mcAttack = function () { const r = mca.apply(this, arguments); try { const id = heldToolId(), e = id && ENCH[id]; if (e && e.sharp && r) return Object.assign({}, r, {dmg: r.dmg + 0.5 * e.sharp + 0.5}); } catch (_) {} return r; };
  const hu = hurt; hurt = function (n, cause) { try { let epf = 0; for (const a of armour) if (a && ENCH[a] && ENCH[a].prot) epf += ENCH[a].prot; if (epf && n > 0) n = n * (1 - Math.min(0.8, epf * 0.04)); } catch (_) {} return hu.call(this, n, cause); };
  // glint: inventory tiles, held model, item name
  const icl = iconClass; iconClass = function (id) { const r = icl.apply(this, arguments); return ENCH[id] ? r + ' c117g' : r; };
  const stripe = (() => { const c = cv(64), g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 64, 64); gr.addColorStop(0, '#000'); gr.addColorStop(.42, '#000'); gr.addColorStop(.5, '#fff'); gr.addColorStop(.58, '#000'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  const glintM = new THREE.MeshBasicMaterial({map: stripe, color: 0xb060ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1});
  U.glintM = glintM;
  const mim = makeItemMesh; makeItemMesh = function (id) { const m = mim.apply(this, arguments);
    try { if (ENCH[id] && m) { const list = []; m.traverse(o => { if (o.isMesh && !o.isInstancedMesh && o.geometry && o.material !== glintM) list.push(o); }); for (const o of list) { const gm = new THREE.Mesh(o.geometry, glintM); gm.renderOrder = 5; gm.userData.c117g = 1; o.add(gm); } m.userData.c117g = list.length; } } catch (e) { U.err = 'glint ' + e.message; }
    return m; };
  const sin = showItemName; showItemName = function () { const r = sin.apply(this, arguments); try { const t = enchText(selId); if (t) { const el = $('itemName'); const s = document.createElement('span'); s.style.cssText = 'color:#c99aff;display:block;font-size:.82em'; s.textContent = t; el.appendChild(s); } } catch (_) {} return r; };
  setInterval(() => { try { if (!menuOpen) return; for (const el of document.querySelectorAll('.c117g')) { const d = el.title ? el : el.parentElement; if (!d || !d.title) continue; const id = +Object.keys(NAMES).find(k => NAMES[k] === d.title.split(' (')[0]); if (id && ENCH[id] && !d.title.includes('(')) d.title += ' (' + enchText(id) + ')'; } } catch (_) {} }, 800);
  function refreshItems() { try { itemsSig = ''; } catch (_) {} try { heldId = -1; } catch (_) {} try { renderHotbar(); } catch (_) {} }
  // save / load
  const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { d.c117 = {ench: JSON.parse(JSON.stringify(ENCH)), seed}; } catch (_) {} return d; };
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments);
    try { if (d && d.c117) { for (const k in ENCH) delete ENCH[k]; const e = d.c117.ench || {}; for (const k in e) { const o = {}; for (const n in EN) if (e[k][n] > 0) o[n] = Math.min(EN[n][1], e[k][n] | 0); if (Object.keys(o).length) ENCH[k] = o; } seed = d.c117.seed | 0 || 1; refreshItems(); } else if (d && !d.dim) { for (const k in ENCH) delete ENCH[k]; } } catch (_) {}
    return r; };
  const ew = enterWorld; enterWorld = function (save) { if (!save) { for (const k in ENCH) delete ENCH[k]; seed = 1; } hideE(); return ew.apply(this, arguments); };
  // ---------------- enchant menu ----------------
  let ui = null, at = null, sel = 0, focus = 0;
  function shelvesAt(x, y, z) { let n = 0; for (let dy = 0; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== 2) continue; if (getB(x + dx, y + dy, z + dz) === T.BOOKSHELF) n++; } return Math.min(15, n); }
  U.shelvesAt = shelvesAt;
  function offers(id, shelves) { const R = rng((seed * 7919 + id * 104729 + shelves * 31) >>> 0); const ks = kindsFor(id); if (!ks.length) return [];
    const base = 1 + (R() * 8 | 0) + (shelves >> 1) + (R() * (shelves + 1) | 0);
    const req = [Math.max(Math.floor(base / 3), 1), Math.floor(base * 2 / 3) + 1, Math.max(base, shelves * 2)];
    return req.map((q, i) => { const k = ks[R() * ks.length | 0], mx = EN[k][1]; const lv = Math.max(1, Math.min(mx, Math.ceil(q * mx / 30))); return {k, lv, req: q, cost: i + 1}; }); }
  U.offers = offers;
  const xl = () => { try { return xpState().lvl | 0; } catch (_) { return 0; } };
  const icon = id => '<i class="ii' + iconClass(id) + '" style="' + iconStyle(id) + '"></i>';
  function build() { ui = document.createElement('div'); ui.id = 'enchUI'; ui.className = 'hidden'; ui.dataset.testid = 'enchant-menu';
    ui.style.cssText = 'position:fixed;inset:0;z-index:66;display:flex;align-items:center;justify-content:center;background:rgba(10,0,20,.45)'; document.body.appendChild(ui);
    ui.addEventListener('click', e => { if (e.target === ui) closeE(); }); }
  function render() { if (!ui || !at) return; const c = candidates(); if (sel >= c.length) sel = 0; const id = c[sel], sh = shelvesAt(...at), L = xl();
    let h = '<div class="tp"><h3>Enchanting table</h3><div>Your level <b style="color:#9cff6a">' + L + '</b> &middot; bookshelves nearby <b>' + sh + '</b>/15</div>';
    h += '<div class="sec">Pick an item</div>';
    if (!c.length) h += '<div style="opacity:.75">Bring a pickaxe, axe, shovel, sword or a piece of armour.</div>';
    c.forEach((cid, i) => { const worn = armour.includes(cid) && !(inv[cid] > 0); h += '<button data-i="' + i + '" data-testid="ench-item-' + i + '" class="' + (i === sel ? 'sel' : '') + '">' + icon(cid) + (NAMES[cid] || '?') + (worn ? ' (worn)' : '') + (ENCH[cid] ? ' <span style="color:#c99aff;font-size:12px">' + enchText(cid) + '</span>' : '') + '</button>'; });
    if (id) { h += '<div class="sec">Offers</div>';
      offers(id, sh).forEach((o, i) => { const ok = L >= o.req && L >= o.cost; h += '<button data-o="' + i + '" data-testid="ench-offer-' + i + '"' + (ok ? '' : ' disabled') + '>&#10022; ' + EN[o.k][0] + ' ' + ROM[o.lv] + '<span class="cost' + (ok ? '' : ' no') + '">needs level ' + o.req + ' &middot; costs ' + o.cost + ' level' + (o.cost > 1 ? 's' : '') + '</span></button>'; }); }
    h += '<button data-x="1" style="justify-content:center;margin-top:8px">Close</button><div style="font-size:11px;opacity:.6;margin-top:4px">More bookshelves (2 blocks away) give stronger offers. <span class="padok" title="Controller support">\u2705</span></div></div>';
    ui.innerHTML = h;
    ui.querySelectorAll('button').forEach(b => b.onclick = e => { e.preventDefault(); if (b.dataset.i) { sel = +b.dataset.i; render(); } else if (b.dataset.o) doEnch(+b.dataset.o); else closeE(); });
    refocus(); }
  const items = () => ui ? [...ui.querySelectorAll('button')] : [];
  function refocus() { const it = items(); if (!it.length) return; focus = Math.max(0, Math.min(focus, it.length - 1)); it.forEach((b, i) => b.classList.toggle('focus', i === focus)); try { it[focus].scrollIntoView({block: 'nearest'}); } catch (_) {} }
  function chime() { try { if (!AC) return; const t = AC.currentTime; [784, 988, 1175, 1568, 1976].forEach((f, i) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + i * .07); g.gain.exponentialRampToValueAtTime(0.12 * (SET.sfx || 1), t + i * .07 + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * .07 + .8); o.connect(g); g.connect(AC.destination); o.start(t + i * .07); o.stop(t + i * .07 + .85); }); } catch (_) {} }
  function doEnch(i) { const c = candidates(), id = c[sel]; if (!id || !at) return; const o = offers(id, shelvesAt(...at))[i]; const s = xpState(), L = s.lvl | 0;
    if (!o || L < o.req || L < o.cost) { toast('Not enough levels'); return; }
    __c105xp(s.xp, L - o.cost); const e = ENCH[id] || (ENCH[id] = {}); e[o.k] = Math.max(e[o.k] || 0, o.lv); seed = (seed + 1 + (Math.random() * 1000 | 0)) >>> 0;
    U.last = {id, k: o.k, lv: o.lv}; chime(); toast(NAMES[id] + ': ' + EN[o.k][0] + ' ' + ROM[o.lv]); burst(); refreshItems(); render(); }
  function openE(x, y, z) { if (!ui) build(); at = [x, y, z]; focus = 0; const c = candidates(); const hi = c.indexOf(selId); sel = hi >= 0 ? hi : 0;
    menuOpen = true; attackMouse = attackPad = attackTouch = false; ui.classList.remove('hidden'); render(); try { sfx('chestOpen', .3); } catch (_) {}
    if (document.pointerLockElement) document.exitPointerLock(); }
  function hideE() { at = null; if (ui) ui.classList.add('hidden'); }
  function closeE() { hideE(); openMenu(false); }
  U.open = openE; U.close = closeE; U.isOpen = () => !!at;
  const cp = closePanels; closePanels = function () { hideE(); return cp.apply(this, arguments); };
  const mpi = menuPadInput; menuPadInput = function (E, axes, gp) { if (!at) return mpi.apply(this, arguments);
    if (E[1]) { closeE(); return; } const n = items().length;
    if (E[12] || E[14]) { focus = (focus - 1 + n) % n; refocus(); } if (E[13] || E[15]) { focus = (focus + 1) % n; refocus(); }
    if (E[0]) { const b = items()[focus]; if (b && !b.disabled) b.click(); } };
  addEventListener('keydown', e => { if (!at) return; if (e.key === 'Escape' || e.key === 'Backspace' || e.code === 'KeyE') { closeE(); e.preventDefault(); e.stopImmediatePropagation(); }
    else if (/^(ArrowDown|ArrowUp)$/.test(e.key)) { const n = items().length; focus = (focus + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; refocus(); e.preventDefault(); e.stopImmediatePropagation(); }
    else if (e.key === 'Enter' || e.key === ' ') { const b = items()[focus]; if (b && !b.disabled) b.click(); e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  const ui0 = useItem; useItem = function () {
    if (!menuOpen && !paused && !dead && started && !sneakHeld) { try { const r = raycast(5); if (r && getB(...r.hit) === ET) { openE(...r.hit); return; } } catch (e) { U.err = 'use ' + e.message; } }
    return ui0.apply(this, arguments); };
  // ---------------- floating book + glyphs ----------------
  const leatherT = (() => { const c = cv(64), g = c.getContext('2d'); g.fillStyle = '#6e3a1c'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 400; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(0,0,0,.2)' : 'rgba(255,210,160,.08)'; g.fillRect(Math.random() * 64, Math.random() * 64, 1, 1); }
    g.strokeStyle = '#e8c35a'; g.lineWidth = 3; g.strokeRect(5, 5, 54, 54); const t = new THREE.CanvasTexture(c); return t; })();
  const pageT = (() => { const c = cv(64), g = c.getContext('2d'); g.fillStyle = '#f2ead2'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#5a3a6a'; for (let y = 8; y < 58; y += 5) for (let x = 6; x < 58;) { const w = 2 + Math.random() * 7; g.fillRect(x, y, w, 1.5); x += w + 2; } return new THREE.CanvasTexture(c); })();
  const coverM = new THREE.MeshLambertMaterial({map: leatherT}), pageM = new THREE.MeshLambertMaterial({map: pageT, emissive: 0x2a1a40});
  const edgeM = new THREE.MeshLambertMaterial({color: 0xe8ddc0});
  function makeBook() { const root = new THREE.Group(), tilt = new THREE.Group(); root.add(tilt); const halves = [];
    for (const s of [-1, 1]) { const h = new THREE.Group(); const cvr = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.018, 0.4), coverM); cvr.position.set(s * 0.15, -0.012, 0);
      const pg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.37), [edgeM, edgeM, pageM, edgeM, edgeM, edgeM]); pg.position.set(s * 0.145, 0.012, 0); h.add(cvr, pg); tilt.add(h); halves.push(h); }
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.4), coverM); spine.position.y = -0.015; tilt.add(spine);
    root.userData = {tilt, halves, yaw: 0, open: 0.3, t: Math.random() * 6}; return root; }
  const glyphMats = (() => { const out = []; for (let k = 0; k < 8; k++) { const c = cv(32), g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.lineCap = 'round'; const R = rng(k * 977 + 3); g.beginPath();
      for (let s = 0; s < 3; s++) { const x0 = 6 + R() * 20, y0 = 6 + R() * 20; g.moveTo(x0, y0); g.lineTo(6 + R() * 20, 6 + R() * 20); } g.stroke(); g.fillStyle = '#fff'; g.fillRect(14, 14, 3, 3);
      out.push(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), color: 0xa878ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0})); } return out; })();
  const tables = new Map(); U.tables = tables; const glyphs = []; U.glyphs = glyphs; let scanT = 0;
  function scan() { if (!started) return; const px = Math.floor(P.x), py = Math.floor(P.y), pz = Math.floor(P.z), R = PH ? 8 : 11, seen = new Set();
    for (let x = px - R; x <= px + R; x++) for (let z = pz - R; z <= pz + R; z++) for (let y = py - 5; y <= py + 5; y++) if (getB(x, y, z) === ET) { const k = x + ',' + y + ',' + z; seen.add(k);
      if (!tables.has(k) && tables.size < 4) { const b = makeBook(); b.position.set(x + .5, y + 1.32, z + .5); scene.add(b); tables.set(k, {b, x, y, z, sh: shelvesAt(x, y, z), shT: 0}); } }
    for (const [k, o] of tables) if (!seen.has(k)) { scene.remove(o.b); tables.delete(k); } }
  let lastF = 0; const rrnd = renderer.render; renderer.render = function (sc, cam) { const nowF = performance.now(), dt = Math.min(0.05, (nowF - (lastF || nowF)) / 1000); lastF = nowF;
    if (sc === scene) try { scanT -= dt; if (scanT <= 0) { scanT = 1; scan(); try { fixEyes(); } catch (_) {} }
      const now = performance.now() / 1000;
      for (const [, o] of tables) { const b = o.b, u = b.userData; u.t += dt; const dx = P.x - (o.x + .5), dz = P.z - (o.z + .5), d = Math.hypot(dx, dz, P.y - o.y);
        const near = d < 6; const want = near ? Math.atan2(dx, dz) : u.yaw + dt * 0.4; let dy = want - u.yaw; while (dy > Math.PI) dy -= 6.283; while (dy < -Math.PI) dy += 6.283; u.yaw += dy * Math.min(1, dt * (near ? 3 : 1));
        u.open += ((near ? 1.05 : 0.18) - u.open) * Math.min(1, dt * 2.5);
        b.rotation.y = u.yaw; b.position.y = o.y + 1.32 + Math.sin(u.t * 1.6) * 0.07; u.tilt.rotation.x = -0.5 * u.open;   // pages tilt toward you
        u.halves[0].rotation.z = u.open * 0.55 + Math.sin(u.t * 3) * 0.03 * u.open; u.halves[1].rotation.z = -u.open * 0.55 - Math.sin(u.t * 3.3) * 0.03 * u.open;
        o.shT -= dt; if (o.shT <= 0) { o.shT = 3; o.sh = shelvesAt(o.x, o.y, o.z); o.shelfList = []; for (let dy2 = 0; dy2 <= 1; dy2++) for (let ax = -2; ax <= 2; ax++) for (let az = -2; az <= 2; az++) if (Math.max(Math.abs(ax), Math.abs(az)) === 2 && getB(o.x + ax, o.y + dy2, o.z + az) === T.BOOKSHELF) o.shelfList.push([o.x + ax, o.y + dy2, o.z + az]); }
        if (d < 10 && o.shelfList && o.shelfList.length && glyphs.length < (PH ? 14 : 30) && Math.random() < dt * (0.8 + o.shelfList.length * 0.5)) {
          const s = o.shelfList[Math.random() * o.shelfList.length | 0], sp = new THREE.Sprite(glyphMats[Math.random() * 8 | 0].clone()); sp.scale.setScalar(0.16 + Math.random() * .08);
          const from = new THREE.Vector3(s[0] + .5 + (Math.random() - .5) * .6, s[1] + .6 + Math.random() * .5, s[2] + .5 + (Math.random() - .5) * .6); sp.position.copy(from); scene.add(sp);
          glyphs.push({sp, from, to: new THREE.Vector3(o.x + .5, o.y + 1.35, o.z + .5), t: 0, dur: 1.4 + Math.random() * .8, lift: 0.6 + Math.random() * .6}); } }
      for (let i = glyphs.length - 1; i >= 0; i--) { const gl = glyphs[i]; gl.t += dt; const k = gl.t / gl.dur; if (k >= 1) { scene.remove(gl.sp); gl.sp.material.dispose(); glyphs.splice(i, 1); continue; }
        const e = k * k * (3 - 2 * k); gl.sp.position.lerpVectors(gl.from, gl.to, e); gl.sp.position.y += Math.sin(k * Math.PI) * gl.lift; gl.sp.material.opacity = Math.sin(k * Math.PI) * 0.9; gl.sp.material.rotation = gl.t * 1.5; }
      stripe.offset.x = (now * 0.35) % 1; stripe.offset.y = (now * 0.2) % 1;
    } catch (e) { U.err = 'tick ' + e.message; }
    return rrnd.apply(this, arguments); };
  { const cw = __clearWorldState; __clearWorldState = function () { try { for (const [, o] of tables) scene.remove(o.b); tables.clear(); for (const g of glyphs) scene.remove(g.sp); glyphs.length = 0; } catch (_) {} return cw.apply(this, arguments); }; }
  function burst() { try { if (!at || glyphs.length > 40) return; const [x, y, z] = at; for (let i = 0; i < 14; i++) { const sp = new THREE.Sprite(glyphMats[i % 8].clone()); sp.scale.setScalar(0.2); const from = new THREE.Vector3(x + .5, y + 1.35, z + .5); sp.position.copy(from); scene.add(sp);
      const a = i / 14 * 6.283; glyphs.push({sp, from, to: new THREE.Vector3(x + .5 + Math.cos(a) * 1.6, y + 1.8, z + .5 + Math.sin(a) * 1.6), t: 0, dur: 1.1, lift: .4}); } } catch (_) {} }
  // ---------------- zombies: dim, sunken eyes with only a faint glow ----------------
  const eyeM = new THREE.MeshPhongMaterial({color: 0x101108, emissive: 0x181a08, shininess: 40, specular: 0x222218});
  function fixEyes() { for (const a of mobs) { if (a.kind !== 'zombie' || !a.head) continue;
      for (const c of a.head.children) { if (c.isMesh && !c.userData.c117eye && Math.abs(Math.abs(c.position.x) - 0.12) < 0.03 && c.position.z > 0.2) { c.userData.c117eye = 1; c.position.z -= 0.018; c.scale.set(0.85, 0.8, 1); }
        if (c.isMesh && c.userData.c117eye && c.material !== eyeM) c.material = eyeM;
        if (c.isSprite && !c.userData.c117eye) { c.userData.c117eye = 1; c.material = c.material.clone(); c.material.opacity = 0.07; c.scale.multiplyScalar(0.7); } } a.c117eyes = 1; } }
  U.fixEyes = fixEyes;
})();
