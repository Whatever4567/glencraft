/* ===================== GLX-C121 (v1.0.1): lazurite replaces cobalt, iron becomes silver, wood types, HD tiles, ponds + ducks, bees, bag, jetpack slot, crisp held items ===================== */
(function c121() {
  const U = window.__c121 = {log: [], errs: []};
  const warn = (w, e) => { try { U.errs.push(w + ': ' + String(e && e.message || e)); console.warn('c121 ' + w, e); } catch (_) {} };
  const PHN = !!touchMode, BS = PHN ? 512 : 1024;
  window.__seaNow = () => SEA;
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };
  const rng = s => { s = (s | 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; };
  const lg = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
  const rg = (g, x, y, r0, r1, st, x1, y1) => { const q = g.createRadialGradient(x, y, r0, x1 === undefined ? x : x1, y1 === undefined ? y : y1, r1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
  const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  const shade = (h, k) => { const n = parseInt(h.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };
  function noise(g, S, R, n, a, cols, sz) { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.globalAlpha = a * (0.4 + R() * 0.6); const s = (sz || 1) * (1 + R() * 2.2) * S / 512; g.fillRect(R() * S, R() * S, s, s); } g.globalAlpha = 1; }
  function bevel(g, x, y, w, h, t, lt, dk) { g.fillStyle = lt; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w - t, y + t); g.lineTo(x + t, y + t); g.lineTo(x + t, y + h - t); g.lineTo(x, y + h); g.fill();
    g.fillStyle = dk; g.beginPath(); g.moveTo(x + w, y + h); g.lineTo(x, y + h); g.lineTo(x + t, y + h - t); g.lineTo(x + w - t, y + h - t); g.lineTo(x + w - t, y + t); g.lineTo(x + w, y); g.fill(); }
  const ANI = () => typeof TEXANISO !== 'undefined' ? TEXANISO : 4;
  function mkTex(c, rep) { const t = new THREE.Texture(c); if (rep !== false) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = ANI(); t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t; }
  const thumbCss = {};
  function css(key, c) { try { const s = cv(96); const g = s.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, 96, 96); thumbCss[key] = '.ic-' + key + '{background-image:url(' + s.toDataURL('image/png') + ') !important}';
    let el = document.getElementById('c121tex'); if (!el) { el = document.createElement('style'); el.id = 'c121tex'; document.head.appendChild(el); } el.textContent = Object.values(thumbCss).join('\n'); } catch (_) {} }
  const avgOf = c => { try { const s = cv(1); s.getContext('2d').drawImage(c, 0, 0, 1, 1); const d = s.getContext('2d').getImageData(0, 0, 1, 1).data; return (d[0] << 16) | (d[1] << 8) | d[2]; } catch (_) { return 0x888888; } };
  // a brand-new face key (own texture + material)
  function regKey(key, c) { texCache[key] = mkTex(c); texImg[key] = c; AVG[key] = avgOf(c); css(key, c); return key; }
  // an existing face key: swap the picture on every texture that uses it
  const SWAP = {};
  function swapKey(key, c) { SWAP[key] = c; doSwap(key); }
  function doSwap(key) { const c = SWAP[key]; if (!c) return 0; let n = 0;
    try { if (window.__c120 && __c120.made && key in __c120.made) __c120.made[key] = c; } catch (_) {}
    const ts = new Set(); if (texCache[key]) ts.add(texCache[key]); if (matCache[key] && matCache[key].map) ts.add(matCache[key].map);
    for (const id in FACES) { const f = FACES[id]; if (!(f === key || (Array.isArray(f) && f.includes(key)))) continue; const ms = BLOCK_MATS[id]; if (!ms) continue;
      [].concat(ms).forEach((m, i) => { if (m && m.map && (f === key || f[i] === key)) ts.add(m.map); }); }
    for (const t of ts) if (t && t.image !== c) { t.image = c; t.anisotropy = Math.max(t.anisotropy || 1, ANI()); t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true; n++; }
    if (texImg[key] !== c) { texImg[key] = c; AVG[key] = avgOf(c); } if (!thumbCss[key]) css(key, c); return n; }
  U.swapAll = () => { for (const k in SWAP) doSwap(k); };
  function icon(fn, S) { S = S || 256; const c = cv(S); const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.lineJoin = g.lineCap = 'round'; g.save(); g.scale(S / 64, S / 64); g.translate(32, 32); fn(g, rng(S + 7)); g.restore(); return c.toDataURL('image/png'); }
  const ICO = U.ICO = {};
  const setIcon = (id, url) => { ICO[id] = url; ICONS[id] = url; delete ICON_KEY[id]; try { if (window.__c120ICO) __c120ICO[id] = url; } catch (_) {} };
  U.setIcon = setIcon;
  /* ---------- painters ---------- */
  const WOODS = U.WOODS = [
    null,
    {w: 1, n: 'Scots pine', log: 135, pl: 229, key: 'planks_pine', c: '#c08a55', d: '#7a4a26', l: '#e2b27a', knots: 1},
    {w: 2, n: 'Silver birch', log: 136, pl: 220, key: 'planks_birch', c: '#e2d2a6', d: '#a8946a', l: '#f6ead0', fine: 1},
    {w: 3, n: 'Rowan', log: 137, pl: 254, key: 'planks_rowan', c: '#b0603e', d: '#6c3220', l: '#d68a66'},
    {w: 4, n: 'Alder', log: 139, pl: 237, key: 'planks_alder', c: '#c9803e', d: '#86481c', l: '#e8a868'},
    {w: 5, n: 'Yew', log: 143, pl: 234, key: 'planks_yew', c: '#86422a', d: '#4a1e10', l: '#b46a48', swirl: 1},
    {w: 6, n: 'Rotting alder', log: 138, pl: 141, key: 'planks_rot', c: '#7f7a5e', d: '#4a4636', l: '#a8a284', rot: 1},
    {w: 7, n: 'Wisteria', log: 191, pl: 193, key: 'planks_wisteria', c: '#d6b9ae', d: '#8f6c6e', l: '#f0dcd2', fine: 1}];   // v1.0.47 (ids 191-193)
  const OAK = {w: 0, n: 'Oak', pl: 10, key: 'planks', c: '#b48a52', d: '#6e4e2a', l: '#d8b47c'};
  const woodOf = w => (w && WOODS[w]) || OAK;
  function grain(g, x, y, w, h, W, R, S) {   // wood grain inside a board rect
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = lg(g, x, y, x, y + h, [[0, W.l], [0.25, W.c], [0.75, W.c], [1, W.d]]); g.fillRect(x, y, w, h);
    const tone = R(); g.fillStyle = tone < .33 ? 'rgba(255,240,210,.10)' : tone < .66 ? 'rgba(40,20,0,.10)' : 'rgba(0,0,0,0)'; g.fillRect(x, y, w, h);
    const lines = W.fine ? 26 : 16;
    for (let i = 0; i < lines; i++) { const yy = y + R() * h, amp = h * (W.swirl ? .18 : .05), ph = R() * 6, fr = (W.swirl ? 3 : 1.4) + R() * 2;
      g.strokeStyle = R() < .6 ? hexA(W.d.length === 7 ? W.d : '#553311', .18 + R() * .25) : 'rgba(255,245,220,.12)'; g.lineWidth = (W.fine ? .6 : 1) * (0.6 + R() * 1.8) * S / 512;
      g.beginPath(); for (let s = 0; s <= 40; s++) { const xx = x + w * s / 40, yv = yy + Math.sin(ph + s / 40 * fr * 6.283) * amp + Math.sin(s * .9 + ph) * h * .01; s ? g.lineTo(xx, yv) : g.moveTo(xx, yv); } g.stroke(); }
    if (W.fine) for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(40,30,20,' + (.25 + R() * .3) + ')'; g.fillRect(x + R() * w, y + R() * h, (4 + R() * 14) * S / 512, (1 + R()) * S / 512); }
    if (W.knots || W.swirl) for (let i = 0; i < (W.knots ? 2 : 1); i++) if (R() < .7) { const kx = x + R() * w, ky = y + h * (.3 + R() * .4), kr = h * (.12 + R() * .1);
      g.fillStyle = rg(g, kx, ky, 0, kr, [[0, hexA(W.d, .95)], [0.5, hexA(W.d, .5)], [1, hexA(W.d, 0)]]); g.beginPath(); g.ellipse(kx, ky, kr * 1.6, kr, 0, 0, 7); g.fill();
      g.strokeStyle = hexA(W.d, .35); g.lineWidth = S / 512; for (let r = 1; r < 4; r++) { g.beginPath(); g.ellipse(kx, ky, kr * 1.6 * (1 + r * .5), kr * (1 + r * .5), 0, 0, 7); g.stroke(); } }
    if (W.rot) { for (let i = 0; i < 90; i++) { g.fillStyle = R() < .5 ? 'rgba(60,80,40,.25)' : 'rgba(20,20,10,.3)'; g.beginPath(); g.arc(x + R() * w, y + R() * h, (1 + R() * 5) * S / 512, 0, 7); g.fill(); }
      for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(20,16,10,.6)'; g.lineWidth = 2 * S / 512; g.beginPath(); let px = x + R() * w, py = y + R() * h; g.moveTo(px, py); for (let s = 0; s < 5; s++) { px += (R() - .3) * w * .12; py += (R() - .5) * h * .3; g.lineTo(px, py); } g.stroke(); } }
    noise(g, S, R, 600 * S / 512 | 0, .08, ['#000', '#fff'], .6);
    g.restore(); }
  function paintPlanks(W, S) { S = S || BS; const c = cv(S), g = c.getContext('2d'), R = rng(W.w * 977 + 13), rows = 4, bh = S / rows;
    for (let r = 0; r < rows; r++) { const off = (r % 2 ? .5 : 0) + R() * .2 - .1; const y = r * bh;
      const cuts = [off * S - S, off * S, off * S + S].map(v => ((v % S) + S) % S).sort((a, b) => a - b); let xs = [0, ...cuts.filter(v => v > S * .05 && v < S * .95), S];
      for (let i = 0; i < xs.length - 1; i++) { const x0 = xs[i], x1 = xs[i + 1]; grain(g, x0, y, x1 - x0, bh, W, R, S); bevel(g, x0, y, x1 - x0, bh, S * .008, 'rgba(255,240,210,.22)', 'rgba(20,10,0,.38)');
        for (const nx of [x0 + S * .03, x1 - S * .03]) if (x1 - x0 > S * .2) for (const ny of [y + bh * .25, y + bh * .75]) { g.fillStyle = 'rgba(30,26,22,.7)'; g.beginPath(); g.arc(nx, ny, S * .006, 0, 7); g.fill(); g.fillStyle = 'rgba(200,200,200,.35)'; g.beginPath(); g.arc(nx - S * .002, ny - S * .002, S * .0025, 0, 7); g.fill(); } }
      g.fillStyle = 'rgba(15,8,2,.55)'; g.fillRect(0, y + bh - S * .004, S, S * .008); }
    return c; }
  // doors: each wood has its own design (256 x 512, transparent window holes where there is glass-free cut-outs)
  function paintDoor(W) { const w = PHN ? 256 : 512, h = w * 2, c = cv(w, h), g = c.getContext('2d'), R = rng(W.w * 331 + 5), u = w / 16;
    const board = (x, y, bw, bh, vert) => { g.save(); if (vert) { g.translate(x, y + bh); g.rotate(-Math.PI / 2); grain(g, 0, 0, bh, bw, W, R, w); } else grain(g, x, y, bw, bh, W, R, w); g.restore(); bevel(g, x, y, bw, bh, u * .25, 'rgba(255,240,210,.25)', 'rgba(15,8,0,.45)'); };
    const frame = () => { board(0, 0, u * 2, h, true); board(w - u * 2, 0, u * 2, h, true); board(u * 2, 0, w - u * 4, u * 2); board(u * 2, h - u * 2, w - u * 4, u * 2); };
    const hole = (x, y, ww, hh) => { g.save(); g.globalCompositeOperation = 'destination-out'; g.fillRect(x, y, ww, hh); g.restore(); };
    const panel = (x, y, ww, hh) => { board(x, y, ww, hh, true); g.strokeStyle = 'rgba(10,5,0,.45)'; g.lineWidth = u * .3; g.strokeRect(x + u * .6, y + u * .6, ww - u * 1.2, hh - u * 1.2); g.strokeStyle = 'rgba(255,240,210,.2)'; g.strokeRect(x + u * .9, y + u * .9, ww - u * 1.8, hh - u * 1.8); };
    const knob = (y) => { const kx = w - u * 3, ky = y; g.fillStyle = rg(g, kx - u * .3, ky - u * .3, 0, u * .9, [[0, '#fff4c0'], [0.4, '#c8962a'], [1, '#5a3a08']]); g.beginPath(); g.arc(kx, ky, u * .8, 0, 7); g.fill(); g.fillStyle = '#2a1a06'; g.fillRect(kx - u * .15, ky + u * 1.2, u * .3, u * .9); };
    const hinge = (y) => { g.fillStyle = '#2a2826'; g.fillRect(0, y, u * 3, u * .9); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, y, u * 3, u * .2); for (const x of [u * .8, u * 2.2]) { g.fillStyle = '#777'; g.beginPath(); g.arc(x, y + u * .45, u * .18, 0, 7); g.fill(); } };
    const iron = (x, y, ww, hh) => { g.fillStyle = '#26262a'; g.fillRect(x, y, ww, hh); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x, y, ww, hh * .25); };
    g.clearRect(0, 0, w, h);
    if (W.w === 1) {   // Scots pine: vertical boards, two small square windows, iron bands
      for (let i = 0; i < 4; i++) board(u * 2 + i * u * 3, 0, u * 3, h, true); frame();
      hole(u * 3.5, u * 4, u * 3.5, u * 4); hole(u * 9, u * 4, u * 3.5, u * 4); iron(u * 2, u * 13, w - u * 4, u * .8); iron(u * 2, h - u * 6, w - u * 4, u * .8); knob(h * .53);
    } else if (W.w === 2) {   // Silver birch: pale, four-pane window on top, two raised panels below
      frame(); board(u * 2, u * 2, w - u * 4, h - u * 4, true); hole(u * 3, u * 3, u * 4.6, u * 5); hole(u * 8.4, u * 3, u * 4.6, u * 5); hole(u * 3, u * 8.6, u * 4.6, u * 5); hole(u * 8.4, u * 8.6, u * 4.6, u * 5);
      panel(u * 3, u * 16, u * 10, u * 6.5); panel(u * 3, u * 23.5, u * 10, u * 6); knob(h * .5);
    } else if (W.w === 3) {   // Rowan: reddish, arched window, diagonal cross brace below
      for (let i = 0; i < 3; i++) board(u * 2 + i * u * 4, 0, u * 4, h, true); frame();
      g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(u * 4, u * 11); g.lineTo(u * 4, u * 6); g.arc(u * 8, u * 6, u * 4, Math.PI, 0); g.lineTo(u * 12, u * 11); g.closePath(); g.fill(); g.restore();
      g.save(); g.translate(w / 2, h * .7); g.rotate(Math.atan2(h * .35, w)); board(-w * .55, -u, w * 1.1, u * 2); g.restore(); g.save(); g.translate(w / 2, h * .7); g.rotate(-Math.atan2(h * .35, w)); board(-w * .55, -u, w * 1.1, u * 2); g.restore();
      board(u * 2, h * .52, w - u * 4, u * 1.6); hinge(u * 5); hinge(h - u * 6); knob(h * .48);
    } else if (W.w === 4) {   // Alder: barn door with Z brace, no window
      for (let i = 0; i < 4; i++) board(i * u * 4, 0, u * 4, h, true);
      board(0, u * 3, w, u * 2.4); board(0, h - u * 5.4, w, u * 2.4); board(0, h * .5 - u * 1.2, w, u * 2.4);
      g.save(); g.translate(w / 2, h * .25 + u * .6); g.rotate(-Math.atan2(h * .5 - u * 8, w)); board(-w * .62, -u * 1.1, w * 1.24, u * 2.2); g.restore();
      g.save(); g.translate(w / 2, h * .75 - u * .6); g.rotate(-Math.atan2(h * .5 - u * 8, w)); board(-w * .62, -u * 1.1, w * 1.24, u * 2.2); g.restore();
      hinge(u * 3.7); hinge(h - u * 4.7); knob(h * .44);
    } else if (W.w === 5) {   // Yew: dark, six raised panels and a small round porthole
      frame(); board(u * 2, u * 2, w - u * 4, h - u * 4, true);
      g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(w / 2, u * 6, u * 3, 0, 7); g.fill(); g.restore(); g.strokeStyle = '#c8962a'; g.lineWidth = u * .6; g.beginPath(); g.arc(w / 2, u * 6, u * 3.2, 0, 7); g.stroke();
      for (let r = 0; r < 3; r++) for (let s = 0; s < 2; s++) panel(u * 3 + s * u * 5.2, u * 11 + r * u * 6.6, u * 4.8, u * 6); knob(h * .5);
    } else {   // Rotting alder: weathered boards with gaps and a broken corner
      for (let i = 0; i < 5; i++) { board(i * u * 3.2 + u * .15, (i === 4 ? u * 3 : 0), u * 2.9, h - (i === 4 ? u * 3 : 0), true); }
      board(0, u * 5, w, u * 2); board(0, h - u * 7, w, u * 2); hole(u * 13, 0, u * 3, u * 3); g.fillStyle = 'rgba(40,60,30,.35)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(R() * w, h * (.75 + R() * .25), u * (.2 + R() * .5), 0, 7); g.fill(); }
      iron(u * 1, h * .5, u * 4, u * .7); knob(h * .5);
    }
    return c; }
  // round straw bee skep texture
  function paintStraw(S) { const c = cv(S, S), g = c.getContext('2d'), R = rng(4242); g.fillStyle = '#c99a48'; g.fillRect(0, 0, S, S);
    const rows = 8, rh = S / rows; for (let r = 0; r < rows; r++) { const y = r * rh; g.fillStyle = lg(g, 0, y, 0, y + rh, [[0, '#6a4a1c'], [0.18, '#d8aa58'], [0.5, '#f0c870'], [0.82, '#c08a3a'], [1, '#5a3c14']]); g.fillRect(0, y, S, rh);
      for (let i = 0; i < 70; i++) { g.strokeStyle = R() < .5 ? 'rgba(255,230,160,.35)' : 'rgba(90,60,20,.3)'; g.lineWidth = (0.6 + R()) * S / 512; const x = R() * S; g.beginPath(); g.moveTo(x, y + rh * (.15 + R() * .2)); g.lineTo(x + rh * (.6 + R()), y + rh * (.6 + R() * .3)); g.stroke(); }
      for (let x = (r % 2) * rh * .5; x < S; x += rh * 1.4) { g.strokeStyle = 'rgba(90,60,25,.55)'; g.lineWidth = S / 300; g.beginPath(); g.moveTo(x, y + rh * .1); g.lineTo(x + rh * .25, y + rh * .9); g.stroke(); } }
    return c; }
  /* ---------- 1) items: cobalt -> lazurite, iron -> silver, meat, removed + disabled things ---------- */
  const SILV = 183, RAWS = 182, SORE = 181, LAZ = 261, LZORE = 233, LZBLK = 236;
  // items that no longer exist -> what you get instead (inventory, chests, drops)
  const CONV = U.CONV = {54: RAWS, 80: SILV, 94: 217, 177: 30, 178: 86, 262: LAZ, 263: LAZ};
  // block ids that were freed up and reused (converted once per save)
  const ONCE = U.ONCE = {234: LZORE, 237: LZBLK, 229: 228, 220: 78, 254: 79};
  const HIDE = U.HIDE = new Set([94, 54, 80, 177, 178, 262, 263, 212, 117, 77, 168, 70, 71, 72, 73, 50]);   // not craftable, not in creative
  const REMOVED = new Set([94, 54, 80, 177, 178, 262, 263]);
  try {
    T.COBALTORE = LZORE;   // Hell veins make lazurite now
    Object.assign(NAMES, {30: 'Meat', 86: 'Cooked meat', 50: 'Silver ore', 74: 'Block of iron'});
    const ren = {264: 'Lazurite pickaxe', 265: 'Lazurite axe', 266: 'Lazurite sword', 267: 'Lazurite shovel', 268: 'Lazurite hoe', 269: 'Lazurite helmet', 270: 'Lazurite chestplate', 271: 'Lazurite leggings', 272: 'Lazurite boots',
      92: 'Silver pickaxe', 93: 'Silver axe', 95: 'Silver hoe', 102: 'Silver shovel', 108: 'Silver helmet', 109: 'Silver chestplate', 110: 'Silver leggings', 111: 'Silver boots', 225: 'Silver shield'};
    Object.assign(NAMES, ren);
    // iron ore blocks already in the world look like silver ore and give raw silver (same places, same amounts)
    FACES[50] = FACES[SORE]; BLOCK_MATS[50] = BLOCK_MATS[SORE]; if (ICON_KEY[SORE]) ICON_KEY[50] = ICON_KEY[SORE]; HARD[50] = HARD[SORE]; MC_HARD[50] = MC_HARD[SORE]; REQ[50] = REQ[SORE];
    const df = dropsFor; dropsFor = function (b) { if (b === 50) return [[RAWS, 1]]; const r = df.apply(this, arguments); return Array.isArray(r) ? r.map(q => q && CONV[q[0]] ? [CONV[q[0]], q[1]] : q) : r; };
    delete SMELT[54]; delete SMELT[177]; delete SMELT[262]; SMELT[RAWS] = SILV; SMELT[30] = 86;
    // drops / pickups of removed items turn into their replacement
    const di = dropItem; dropItem = function (id) { if (CONV[id]) arguments[0] = CONV[id]; return di.apply(this, arguments); };
    const ai = addItem; addItem = function (id) { if (CONV[id]) arguments[0] = CONV[id]; return ai.apply(this, arguments); };
  } catch (e) { warn('items', e); }
  function fixRecipes() {
    const txt = s => String(s || '').replace(/Cobalt ingots?/g, m => m.endsWith('s') ? 'Lazurite' : 'Lazurite').replace(/Cobalt/g, 'Lazurite').replace(/Iron ingots/g, 'Silver ingots').replace(/Iron ingot/g, 'Silver ingot').replace(/Raw iron/g, 'Raw silver').replace(/mutton/gi, m => m[0] === 'M' ? 'Meat' : 'meat').replace(/pork/gi, 'meat');
    const out = [];
    for (const r of RECIPES) {
      if (HIDE.has(r.out) || r.out === 237 || r.out === 229 || r.out === 220 || r.out === 254 || r.out === 234) continue;
      if (r.need.some(([id]) => id === 237 || id === 229 || id === 220 || id === 177 || id === 178 || (id >= 70 && id <= 73) || id === 77)) continue;
      r.need = r.need.map(([id, c]) => [id === 80 ? SILV : id === 54 ? RAWS : id === 263 ? LAZ : id === 262 ? LAZ : id, c]);
      if (r.out === 80) r.out = SILV;
      r.name = txt(r.name); r.hint = txt(r.hint);
      if (r.out === 74) r.hint = '9 Silver ingots';
      out.push(r); }
    // no duplicates (same output + same needs)
    const seen = new Set(); const fin = out.filter(r => { const k = r.out + '|' + r.n + '|' + JSON.stringify(r.need); if (seen.has(k)) return false; seen.add(k); return true; });
    RECIPES.length = 0; fin.forEach(r => RECIPES.push(r));
  }
  U.fixRecipes = fixRecipes;
  function hideCreative() { try { if (typeof CREATIVE_ALL !== 'undefined') for (let i = CREATIVE_ALL.length - 1; i >= 0; i--) { const id = CREATIVE_ALL[i]; if (HIDE.has(id) || id === 237 && NAMES[237] !== 'Alder planks' || id === 234 && NAMES[234] !== 'Yew planks') CREATIVE_ALL.splice(i, 1); } } catch (_) {} }
  try { const si = window.starterItems; if (si) window.starterItems = function () { return si.apply(this, arguments).filter(q => q && !HIDE.has(q[0]) && !CONV[q[0]]); }; } catch (e) { warn('starter', e); }
  // inventory / hotbar / chests: removed items -> replacement (runs all the time, cheap)
  function convList(map, slotsObj) { let n = 0;
    for (const k in inv) { const id = +k, to = map[id]; if (to === undefined) continue; const c = inv[k]; delete inv[k]; if (to && c > 0) inv[to] = (inv[to] || 0) + c; n++; }
    try { if (MODE.hotbar) MODE.hotbar = MODE.hotbar.map(h => map[h] !== undefined ? (map[h] || 0) : h); } catch (_) {}
    try { if (typeof offhand !== 'undefined' && offhand && map[offhand.id] !== undefined) { if (map[offhand.id]) offhand.id = map[offhand.id]; else { offhand.id = 0; offhand.n = 0; } } } catch (_) {}
    if (map[selId] !== undefined && map[selId]) selId = map[selId];
    if (slotsObj) { try { for (const c of chests.values()) if (c && c.slots) c.slots.forEach((s, i) => { if (s && map[s[0]] !== undefined) { if (map[s[0]]) s[0] = map[s[0]]; else c.slots[i] = null; n++; } }); } catch (_) {}
      try { for (const f of furnaces.values()) for (const s of ['inp', 'fuel', 'out']) if (f && f[s] && map[f[s][0]] !== undefined) { if (map[f[s][0]]) f[s][0] = map[f[s][0]]; else f[s] = null; n++; } } catch (_) {} }
    return n; }
  U.convList = convList;
  let sanT = 0;
  // v1.0.1: loot chests never hand out removed/disabled things (pistol, shears, wool, old iron/cobalt): convert or drop them; same random sequence so worlds generate the same
  try { const lc0 = lootChest; lootChest = function (x, y, z) { const r = lc0.apply(this, arguments); try { const c = chests.get(keyOf(x, y, z)); if (c && c.slots) { let any = false;
        for (let i = 0; i < c.slots.length; i++) { const sl = c.slots[i]; if (!sl) continue; if (CONV[sl[0]] !== undefined) sl[0] = CONV[sl[0]]; if (HIDE.has(sl[0])) c.slots[i] = null; else any = true; }
        if (!any) c.slots[3] = [IT.BREAD || 29, 2]; } } catch (_) {} return r; }; } catch (e) { warn('loot', e); }
  setInterval(() => { try { if (!started) return; const n = convList(CONV, (++sanT % 5) === 0); if (n) { try { renderHotbar(); } catch (_) {} } } catch (_) {} }, 1000);
  /* ---------- 2) wood types: planks, stairs, slabs, doors, fences, gates, boats ---------- */
  const BASES = {600: 164, 610: 145, 620: T.DOOR, 630: 162, 640: 226, 650: 173};
  const KIND = {600: 'stairs', 610: 'slab', 620: 'door', 630: 'fence', 640: 'gate', 650: 'boat'};
  const VARI = U.VARI = {};   // item id -> {base, w, kind}
  const PLIDS = [10, 229, 220, 254, 237, 234, 141, 193];
  const PLMAT = U.PLMAT = {}; const PLC = U.PLC = {};
  const plMat = w => (w && PLMAT[w]) || BLOCK_MATS[10];
  U.woodCount = () => PLIDS.reduce((s, id) => s + cnt(id), 0);
  function woodMatOf(w) { return w ? plMat(w) : BLOCK_MATS[10]; }
  const STAIRB = 164, SLAB = 145, FENCE = 162, GATE = 226, BOAT = IT.BOAT || 173;
  const WOODB = new Set([STAIRB, SLAB, T.DOOR, T.DOORTOP, FENCE, GATE]);
  const WK = U.WK = new Set();   // cells whose entMeta carries .wood
  try {
    // oak slab (block 145 was a stair-like spare slot: now a half block)
    NAMES[SLAB] = 'Oak slab'; FACES[SLAB] = 'planks'; BLOCK_MATS[SLAB] = BLOCK_MATS[10]; ICON_KEY[SLAB] = 'planks'; HARD[SLAB] = HARD[10]; MC_HARD[SLAB] = MC_HARD[10]; delete REQ[SLAB]; NEEDS_PICK.delete(SLAB); AXE_ON.add(SLAB);
    PLACEABLE.add(SLAB); ENT[SLAB] = 1; IS_STAIR[SLAB] = 1; if (!ORDER.includes(SLAB)) ORDER.push(SLAB); if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(SLAB)) CREATIVE_ALL.push(SLAB);
    Object.assign(NAMES, {65: 'Oak door', 162: 'Oak fence', 226: 'Oak fence gate', 173: 'Oak boat'});
    for (let w = 1; w < WOODS.length; w++) { const W = WOODS[w];
      const c = paintPlanks(W); PLC[w] = c;
      if (W.pl === 141) { swapKey('planks_rot', c); PLMAT[w] = BLOCK_MATS[141]; }
      else { regKey(W.key, c); FACES[W.pl] = W.key; BLOCK_MATS[W.pl] = mat(W.key); ICON_KEY[W.pl] = W.key; delete ICONS[W.pl]; PLMAT[w] = BLOCK_MATS[W.pl];
        NAMES[W.pl] = W.n + ' planks'; HARD[W.pl] = HARD[10]; MC_HARD[W.pl] = MC_HARD[10]; delete REQ[W.pl]; NEEDS_PICK.delete(W.pl); AXE_ON.add(W.pl); PLACEABLE.add(W.pl); ENT[W.pl] = 0; IS_STAIR[W.pl] = 0;
        if (FUEL && FUEL[10]) FUEL[W.pl] = FUEL[10]; if (!ORDER.includes(W.pl)) ORDER.push(W.pl); if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(W.pl)) CREATIVE_ALL.push(W.pl);
        try { if (window.__NAT) __NAT[W.pl] = 0; } catch (_) {} }
      for (const b in BASES) { const id = +b + w; VARI[id] = {base: BASES[b], w, kind: KIND[b]};
        NAMES[id] = W.n + ' ' + {stairs: 'stairs', slab: 'slab', door: 'door', fence: 'fence', gate: 'fence gate', boat: 'boat'}[KIND[b]];
        if (!ORDER.includes(id)) ORDER.push(id); if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(id)) CREATIVE_ALL.push(id); if (FUEL && FUEL[BASES[b]]) FUEL[id] = FUEL[BASES[b]]; } }
    const om = matOf; matOf = function (b) { if (b === SLAB || PLIDS.includes(b)) return 'wood'; return om.apply(this, arguments); };
    setInterval(() => { if (!chunkST) return; chunkST[SLAB] = 1; for (const w of [1, 2, 3, 4, 5, 7]) chunkST[WOODS[w].pl] = 0; }, 300);
  } catch (e) { warn('wood-blocks', e); }
  // recipes
  function woodRecipes() {
    const add = r => { if (!RECIPES.some(q => q.out === r.out && q.n === r.n && JSON.stringify(q.need) === JSON.stringify(r.need))) RECIPES.push(r); };
    add(rc('6 Oak slabs', '3 Planks', SLAB, 6, [[10, 3]], 1));
    for (let w = 1; w < WOODS.length; w++) { const W = WOODS[w], P = W.n + ' planks';
      if (W.pl !== 141) add(rc('4 ' + P, '1 ' + W.n + ' log', W.pl, 4, [[W.log, 1]]));
      add(rc('4 ' + W.n + ' stairs', '6 ' + P, 600 + w, 4, [[W.pl, 6]], 1));
      add(rc('6 ' + W.n + ' slabs', '3 ' + P, 610 + w, 6, [[W.pl, 3]], 1));
      add(rc(W.n + ' door', '6 ' + P, 620 + w, 1, [[W.pl, 6]], 1));
      add(rc('3 ' + W.n + ' fences', '4 ' + P + ' + 2 Sticks', 630 + w, 3, [[W.pl, 4], [T.STICK || 11, 2]], 1));
      add(rc(W.n + ' fence gate', '4 Sticks + 2 ' + P, 640 + w, 1, [[T.STICK || 11, 4], [W.pl, 2]], 1));
      add(rc(W.n + ' boat', '5 ' + P, 650 + w, 1, [[W.pl, 5]], 1)); }
    // the old log -> planks recipe only takes oak logs; other logs now make their own planks
    for (let i = RECIPES.length - 1; i >= 0; i--) { const r = RECIPES[i]; if (r.out === 10 && r.need.length === 1 && [135, 136, 137, 139, 143, 191].includes(r.need[0][0])) RECIPES.splice(i, 1); }
  }
  // any planks work for general recipes (sticks, tables, chests ...); the per-wood things need their own planks
  const EXACT = new Set([T.DOOR, STAIRB, SLAB, BOAT, FENCE, GATE]);
  const pooled = r => r && !EXACT.has(r.out) && !VARI[r.out] && r.need.some(q => q[0] === 10);
  try {
    const cc = canCraft; canCraft = function (r) { if (!pooled(r) || MODE.infinite) return cc.apply(this, arguments); const save = inv[10]; inv[10] = U.woodCount(); try { return cc.apply(this, arguments); } finally { if (save === undefined) delete inv[10]; else inv[10] = save; } };
    const cr = craft; craft = function (i) { try { const r = RECIPES[i]; if (pooled(r) && !MODE.infinite) { const need = r.need.find(q => q[0] === 10)[1]; let lack = need - cnt(10);
      if (lack > 0 && canCraft(r, nearTable())) for (const id of [229, 220, 254, 237, 234, 141, 193]) { if (lack <= 0) break; const t = Math.min(lack, cnt(id)); if (t > 0) { inv[id] -= t; inv[10] = cnt(10) + t; lack -= t; } } } } catch (_) {} return cr.apply(this, arguments); };
  } catch (e) { warn('pool', e); }
  // stairs + slabs: grouped by wood for the mesher (hooks added to the chunk builder)
  window.__stGroups = function (L) { const out = [];
    const split = (k, a) => { const by = {}; for (let i = 0; i < a.length; i += 3) { const m = entMeta.get(a[i] + ',' + a[i + 1] + ',' + a[i + 2]); const w = (m && m.wood) || 0; (by[w] || (by[w] = [])).push(a[i], a[i + 1], a[i + 2]); } for (const w in by) out.push([k, by[w], +w]); };
    for (const k in STAIRS) { const a = L[k]; if (!a || !a.length) continue; if (+k === STAIRB) split(k, a); else out.push([k, a, 0]); }
    const s = L[SLAB]; if (s && s.length) split(String(SLAB), s);
    return out; };
  window.__stMat = function (w, k) { k = +k; if (k === SLAB || k === STAIRB) return w ? plMat(w) : BLOCK_MATS[10]; return BLOCK_MATS[k]; };
  try { const sh = shapeHit; shapeHit = function (b, x, y, z, px, py, pz) { if (b === SLAB) return py - y < 0.5; return sh.apply(this, arguments); }; } catch (e) { warn('slabhit', e); }
  // placing a wood variant = place the oak base, then remember the wood type on that cell
  let cap = null;
  try { const sb = setB; setB = function (x, y, z, v) {
      if (cap && v === cap.base) cap.cells.push([x, y, z]);
      else if (WK.size) { const k = keyOf(x, y, z); if (WK.has(k)) { WK.delete(k); const m = entMeta.get(k); if (m) delete m.wood; } }
      return sb.apply(this, arguments); }; } catch (e) { warn('setB', e); }
  const plainBase = id => id === T.DOOR ? T.DOOR : id;
  function refreshCell(x, y, z, base) { const k = keyOf(x, y, z);
    try { const o = entObjs.get(k); if (o) { scene.remove(o.g || o); entObjs.delete(k); } } catch (_) {}
    try { const o = fenceObjs.get(k); if (o) { scene.remove(o.g); fenceObjs.delete(k); } } catch (_) {}
    try { dirtyAround(x, z); } catch (_) {} try { (window.syncFences || syncFences)(); } catch (_) {} }
  U.refreshCell = refreshCell;
  function placeVariant(args, ui) { const v = selId, I = VARI[v]; if (!I) return ui.apply(this, args);
    if (!MODE.infinite && cnt(v) < 1) return ui.apply(this, args);
    const base = I.base, saveB = inv[base], nb = boats.length; inv[base] = MODE.infinite ? (saveB || 1) : 1; selId = base; cap = {base: base === T.DOOR ? T.DOOR : base, cells: []}; U.boatW = I.kind === 'boat' ? I.w : 0;
    let r; try { r = ui.apply(this, args); } finally { const used = !MODE.infinite && cnt(base) < 1; if (saveB === undefined) delete inv[base]; else inv[base] = saveB; selId = v; const cells = cap.cells; cap = null; U.boatW = 0;
      const placed = I.kind === 'boat' ? boats.length > nb : cells.length > 0;
      if (placed) { if (used) inv[v] = Math.max(0, cnt(v) - 1);
        if (I.kind === 'boat') { for (let i = nb; i < boats.length; i++) { boats[i].wood = I.w; tintBoat(boats[i]); } }
        else for (const [x, y, z] of cells) { const k = keyOf(x, y, z); let m = entMeta.get(k); if (!m) { m = {}; entMeta.set(k, m); } m.wood = I.w; WK.add(k); refreshCell(x, y, z, base); } }
      try { renderHotbar(); } catch (_) {} }
    return r; }
  U.placeVariant = placeVariant;
  // breaking: give back the right wood
  let brk = null;
  try { const ba = breakAt; breakAt = function (x, y, z) { let b = 0; try { b = getB(x, y, z); } catch (_) {}
      if (!WOODB.has(b)) return ba.apply(this, arguments);
      const ly = b === T.DOORTOP ? y - 1 : y, k = keyOf(x, ly, z), m = entMeta.get(k); const prev = brk; brk = {w: (m && m.wood) || 0};
      try { return ba.apply(this, arguments); } finally { brk = prev; try { const nb = getB(x, ly, z); if (!WOODB.has(nb)) { const mm = entMeta.get(k); if (mm) delete mm.wood; WK.delete(k); } } catch (_) {} } }; } catch (e) { warn('breakAt', e); }
  const OUT2V = {164: 600, 145: 610, 65: 620, 162: 630, 226: 640};
  try { const df = dropsFor; dropsFor = function (b) { const r = df.apply(this, arguments);
      let w = brk && brk.w; try { const ctx = dropsFor.ctx || df.ctx; if (!w && ctx && ctx.wood && (b === T.DOOR || b === T.DOORTOP)) w = ctx.wood; } catch (_) {}
      if (PLIDS.includes(b) && b !== 10 && (!r || !r.length || r[0][0] !== b) && NAMES[b] && /planks/.test(NAMES[b])) return [[b, 1]];
      if (!w || !Array.isArray(r)) return r; return r.map(q => q && OUT2V[q[0]] ? [OUT2V[q[0]] + w, q[1]] : q); };
    Object.defineProperty(dropsFor, 'ctx', {get() { return window.__c121dctx; }, set(v) { window.__c121dctx = v; }, configurable: true}); } catch (e) { warn('drops', e); }
  // looks: doors
  const DOORC = {}, DOORM = {};
  function woodDoorMat(w) { if (DOORM[w]) return DOORM[w]; const c = DOORC[w] || (DOORC[w] = paintDoor(WOODS[w]));
    const mm = doorMat.clone(); mm.map = mkTex(c, false); mm.alphaTest = 0.5; mm.transparent = false; mm.side = THREE.DoubleSide; if (mm.color) mm.color.set(0xffffff); mm.needsUpdate = true; return (DOORM[w] = mm); }
  U.doorMat = woodDoorMat;
  try { const be = buildEnt; buildEnt = function (t, x, y, z) { const o = be.apply(this, arguments);
      try { if (t === T.DOOR && o) { const m = entMeta.get(keyOf(x, y, z)); const w = m && m.wood; if (w) { const root = o.g || o; const piv = o.pivot || (root.children && root.children.find(c => c.children && c.children.length));
        const panel = piv && piv.children ? piv.children[0] : null; const dm = woodDoorMat(w), pm = plMat(w); if (panel && panel.isMesh) { panel.material = Array.isArray(panel.material) ? panel.material.map((q, i) => i >= 4 ? dm : pm) : dm; }
        root.traverse && root.traverse(c => { if (c.isMesh && c !== panel && c.material && !Array.isArray(c.material) && c.material.map && c.material === BLOCK_MATS[10]) c.material = pm; }); } } } catch (e) { warn('door-look', e); }
      return o; }; } catch (e) { warn('buildEnt', e); }
  // fences + gates
  function paintFences() { try { for (const [k, o] of fenceObjs) { if (!o || !o.g || (o.t !== FENCE && o.t !== GATE)) continue; if (o.g === o.c121g) continue; o.c121g = o.g;
      const m = entMeta.get(k); const w = m && m.wood; if (!w) continue; const pm = plMat(w); const pm1 = Array.isArray(pm) ? pm[0] : pm;
      o.g.traverse(c => { if (c.isMesh) c.material = pm1; }); } } catch (e) { warn('fence-look', e); } }
  // boats
  const BOATM = {};
  function tintBoat(b) { try { const w = b.wood; if (!w || !b.g) return; if (!BOATM[w]) { const W = WOODS[w]; const t = mkTex(PLC[w]); BOATM[w] = [new THREE.MeshLambertMaterial({map: t, color: 0xffffff}), new THREE.MeshLambertMaterial({map: t, color: new THREE.Color(W.d).lerp(new THREE.Color(0xffffff), .35)})]; }
      b.g.traverse(c => { if (!c.isMesh) return; if (c.material === boatMat) c.material = BOATM[w][0]; else if (c.material === boatMat2) c.material = BOATM[w][1]; }); } catch (e) { warn('boat-look', e); } }
  U.tintBoat = tintBoat;
  try { const ab = addBoat; addBoat = function () { const b = ab.apply(this, arguments); if (U.boatW && b) { b.wood = U.boatW; tintBoat(b); } return b; }; } catch (e) { warn('addBoat', e); }
  function boatPickupWrap(args, ui) { const mine = boats.filter(b => b.wood); const before = cnt(BOAT); const r = ui.apply(this, args);
    for (const b of mine) if (!boats.includes(b) && cnt(BOAT) > before) { inv[BOAT] = cnt(BOAT) - 1; inv[650 + b.wood] = cnt(650 + b.wood) + 1; try { renderHotbar(); } catch (_) {} break; }
    return r; }
  /* ---------- 3) HD block tiles ---------- */
  function paintBricks(S, P) { const c = cv(S), g = c.getContext('2d'), R = rng(P.seed || 9); const rows = P.rows || 8, per = P.per || 3, bh = S / rows, bw = S / per, gap = S * (P.gap || .022);
    g.fillStyle = P.mortar; g.fillRect(0, 0, S, S); noise(g, S, R, 2600 * S / 1024 | 0, .35, P.mortarN, .7);
    for (let r = 0; r < rows; r++) { const off = (r % 2) * bw * .5 + (P.jit ? (R() - .5) * bw * .12 : 0);
      for (let i = -1; i < per; i++) { const x = off + i * bw, y = r * bh; const col = P.cols[(R() * P.cols.length) | 0];
        for (const sx of [0, x + bw > S ? -S : 0]) { if (sx === 0 && i < 0 && x + bw <= 0) continue; const X = x + sx + gap / 2, Y = y + gap / 2, w = bw - gap, h = bh - gap;
          g.save(); g.beginPath(); const rr = S * .006; g.roundRect ? g.roundRect(X, Y, w, h, rr) : g.rect(X, Y, w, h); g.clip();
          g.fillStyle = lg(g, X, Y, X, Y + h, [[0, shade(col, 1.12)], [.5, col], [1, shade(col, .78)]]); g.fillRect(X, Y, w, h);
          noise(g, S, R, (P.speck || 900) * S / 1024 | 0, .5, P.speckC, .9);
          for (let k = 0; k < 3; k++) { g.fillStyle = R() < .5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.08)'; g.beginPath(); g.ellipse(X + R() * w, Y + R() * h, w * (.1 + R() * .25), h * (.2 + R() * .3), 0, 0, 7); g.fill(); }
          if (P.fire) { g.fillStyle = 'rgba(30,10,5,' + (R() * .25) + ')'; g.fillRect(X, Y, w, h); }
          bevel(g, X, Y, w, h, S * .007, 'rgba(255,255,255,' + (P.hl || .22) + ')', 'rgba(0,0,0,.42)');
          for (let k = 0; k < 2; k++) if (R() < .5) { g.fillStyle = P.mortar; g.beginPath(); const cx = R() < .5 ? X : X + w, cy = Y + R() * h; g.arc(cx, cy, S * (.004 + R() * .008), 0, 7); g.fill(); }
          g.restore(); } } }
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let r = 0; r < rows; r++) g.fillRect(0, r * bh + bh - gap * .35, S, gap * .35);
    return c; }
  function paintIronBlock(S) { const c = cv(S), g = c.getContext('2d'), R = rng(74);
    g.fillStyle = lg(g, 0, 0, S, S, [[0, '#d4d8dc'], [.5, '#9aa0a6'], [1, '#6e747a']]); g.fillRect(0, 0, S, S);
    for (let i = 0; i < 160; i++) { g.strokeStyle = R() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)'; g.lineWidth = S / 512; const y = R() * S; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y + (R() - .5) * 6); g.stroke(); }
    const b = S * .1, n = 6, cell = (S - 2 * b) / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const cx = b + (i + .5) * cell, cy = b + (j + .5) * cell, a = ((i + j) % 2 ? 1 : -1) * Math.PI / 4, L = cell * .42, W = cell * .1;
      g.save(); g.translate(cx, cy); g.rotate(a); g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(S * .003, S * .004, L, W, 0, 0, 7); g.fill();
      g.fillStyle = lg(g, 0, -W, 0, W, [[0, '#f4f6f8'], [.5, '#b6bcc2'], [1, '#5c6268']]); g.beginPath(); g.ellipse(0, 0, L, W, 0, 0, 7); g.fill(); g.restore(); }
    bevel(g, 0, 0, S, S, b * .55, 'rgba(255,255,255,.45)', 'rgba(0,0,0,.5)'); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = S * .006; g.strokeRect(b * .62, b * .62, S - b * 1.24, S - b * 1.24);
    for (const [x, y] of [[b * .3, b * .3], [S - b * .3, b * .3], [b * .3, S - b * .3], [S - b * .3, S - b * .3]]) { g.fillStyle = rg(g, x - S * .006, y - S * .006, 0, S * .022, [[0, '#ffffff'], [.4, '#a8aeb4'], [1, '#2e3236']]); g.beginPath(); g.arc(x, y, S * .02, 0, 7); g.fill(); }
    return c; }
  function paintLazBlock(S) { const c = cv(S), g = c.getContext('2d'), R = rng(236);
    g.fillStyle = lg(g, 0, 0, S, S, [[0, '#2f56c8'], [.5, '#1a3592'], [1, '#0e1f5e']]); g.fillRect(0, 0, S, S);
    for (let i = 0; i < 40; i++) { g.fillStyle = R() < .5 ? 'rgba(90,140,255,.18)' : 'rgba(5,10,40,.2)'; g.beginPath(); g.ellipse(R() * S, R() * S, S * (.03 + R() * .12), S * (.02 + R() * .06), R() * 3, 0, 7); g.fill(); }
    for (let v = 0; v < 6; v++) { g.strokeStyle = 'rgba(240,200,90,.85)'; g.lineWidth = S * (.003 + R() * .004); g.beginPath(); let x = R() * S, y = R() * S; g.moveTo(x, y); for (let s = 0; s < 8; s++) { x += (R() - .5) * S * .18; y += (R() - .5) * S * .18; g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 260 * S / 1024; i++) { const x = R() * S, y = R() * S, r = S * (.002 + R() * .004); g.fillStyle = rg(g, x, y, 0, r * 2, [[0, '#fff6c0'], [.5, '#e0b040'], [1, 'rgba(160,110,20,0)']]); g.beginPath(); g.arc(x, y, r * 2, 0, 7); g.fill(); }
    const b = S * .08; bevel(g, 0, 0, S, S, b, 'rgba(160,190,255,.45)', 'rgba(0,0,20,.55)');
    g.strokeStyle = '#d8a838'; g.lineWidth = S * .012; g.strokeRect(b * 1.2, b * 1.2, S - b * 2.4, S - b * 2.4); g.strokeStyle = 'rgba(255,240,180,.6)'; g.lineWidth = S * .003; g.strokeRect(b * 1.2 - S * .004, b * 1.2 - S * .004, S - b * 2.4, S - b * 2.4);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(b * 1.3, b * 1.3); g.lineTo(S * .55, b * 1.3); g.lineTo(b * 1.3, S * .55); g.fill();
    return c; }
  function paintRubyBlock(S) { const c = cv(S), g = c.getContext('2d'), R = rng(235);
    g.fillStyle = lg(g, 0, 0, S, S, [[0, '#f0d27a'], [.5, '#b88a2a'], [1, '#6e4e10']]); g.fillRect(0, 0, S, S);
    const m = S * .06, n = 3, cw = (S - 2 * m) / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = m + i * cw + S * .012, y = m + j * cw + S * .012, w = cw - S * .024, h = cw - S * .024, vert = (i + j) % 2 === 0;
      const gw = vert ? w * .62 : w, gh = vert ? h : h * .62, gx = x + (w - gw) / 2, gy = y + (h - gh) / 2, ins = Math.min(gw, gh) * .22;
      g.fillStyle = '#4a0610'; g.fillRect(gx - S * .004, gy - S * .004, gw + S * .008, gh + S * .008);
      const f = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([a, b], k) => k ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.fill(); };
      f([[gx, gy], [gx + gw, gy], [gx + gw - ins, gy + ins], [gx + ins, gy + ins]], '#ff5a72');
      f([[gx + gw, gy], [gx + gw, gy + gh], [gx + gw - ins, gy + gh - ins], [gx + gw - ins, gy + ins]], '#a0101e');
      f([[gx, gy + gh], [gx + gw, gy + gh], [gx + gw - ins, gy + gh - ins], [gx + ins, gy + gh - ins]], '#6a0612');
      f([[gx, gy], [gx, gy + gh], [gx + ins, gy + gh - ins], [gx + ins, gy + ins]], '#d0263c');
      g.fillStyle = lg(g, gx + ins, gy + ins, gx + gw - ins, gy + gh - ins, [[0, '#ff8094'], [.45, '#d81e36'], [1, '#86081a']]); g.fillRect(gx + ins, gy + ins, gw - 2 * ins, gh - 2 * ins);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(gx + ins * 1.6, gy + ins * 1.5, ins * .5, ins * .22, -.6, 0, 7); g.fill();
      for (const [px, py] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) { g.fillStyle = rg(g, px - 1, py - 1, 0, S * .014, [[0, '#fff2b0'], [1, '#7a5410']]); g.beginPath(); g.arc(px, py, S * .012, 0, 7); g.fill(); } }
    bevel(g, 0, 0, S, S, m * .7, 'rgba(255,245,200,.55)', 'rgba(60,40,0,.55)');
    return c; }
  function paintGlass(S) { const c = cv(S), g = c.getContext('2d'); g.clearRect(0, 0, S, S);
    g.fillStyle = 'rgba(200,230,245,.13)'; g.fillRect(0, 0, S, S);
    const f = S * .035; g.fillStyle = 'rgba(235,248,255,.85)'; g.fillRect(0, 0, S, f); g.fillRect(0, S - f, S, f); g.fillRect(0, 0, f, S); g.fillRect(S - f, 0, f, S);
    g.fillStyle = 'rgba(120,160,180,.6)'; g.fillRect(f, f, S - 2 * f, S * .006); g.fillRect(f, f, S * .006, S - 2 * f);
    g.save(); g.beginPath(); g.rect(f, f, S - 2 * f, S - 2 * f); g.clip();
    for (const [o, w, a] of [[.18, .07, .32], [.3, .025, .26], [.62, .045, .18]]) { g.fillStyle = 'rgba(255,255,255,' + a + ')'; g.beginPath(); g.moveTo(S * o, 0); g.lineTo(S * (o + w), 0); g.lineTo(S * (o + w) - S, S); g.lineTo(S * o - S, S); g.fill(); g.beginPath(); g.moveTo(S * o + S * .5, 0); g.lineTo(S * (o + w) + S * .5, 0); g.lineTo(S * (o + w) - S * .5, S); g.lineTo(S * o - S * .5, S); g.globalAlpha = .35; g.fill(); g.globalAlpha = 1; }
    g.restore(); return c; }
  function paintLazOre(S) { const c = cv(S), g = c.getContext('2d'), R = rng(233);
    try { const st = texImg['stone']; if (st && st.width) { g.imageSmoothingQuality = 'high'; g.drawImage(st, 0, 0, S, S); } else throw 0; } catch (_) { g.fillStyle = '#7d7d7d'; g.fillRect(0, 0, S, S); noise(g, S, R, 3000, .5, ['#5a5a5a', '#9a9a9a'], 1.2); }
    const spots = [[.22, .25], [.7, .2], [.45, .55], [.18, .78], [.78, .72], [.55, .88]];
    for (const [sx, sy] of spots) { const n = 3 + (R() * 3 | 0); for (let k = 0; k < n; k++) { const x = (sx + (R() - .5) * .12) * S, y = (sy + (R() - .5) * .12) * S, r = S * (.025 + R() * .03);
      g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(x + r * .2, y + r * .25, r * 1.05, 0, 7); g.fill();
      g.fillStyle = rg(g, x - r * .35, y - r * .35, r * .1, r, [[0, '#9cc0ff'], [.35, '#3a66e0'], [.8, '#1a2f8a'], [1, '#0c1650']]); g.beginPath();
      for (let a = 0; a < 6; a++) { const aa = a / 6 * 6.283 + R() * .4, rr = r * (.8 + R() * .3); a ? g.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr) : g.moveTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); } g.closePath(); g.fill();
      if (R() < .6) { g.fillStyle = '#f0c850'; g.beginPath(); g.arc(x + (R() - .5) * r, y + (R() - .5) * r, r * .14, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(x - r * .4, y - r * .4, r * .16, 0, 7); g.fill(); } }
    return c; }
  function swapId(id, c) { const f = FACES[id]; if (!f) return; [...new Set([].concat(f))].forEach(k => swapKey(k, c)); }
  const BRK = {
    stone: {mortar: '#5c5a56', mortarN: ['#4a4844', '#6e6c68'], cols: ['#8e8d89', '#83827e', '#9a9894', '#7a7975', '#908a84'], speckC: ['#5e5d5a', '#b4b2ae'], seed: 28, per: 3, hl: .22},
    deep: {mortar: '#121214', mortarN: ['#0a0a0c', '#1e1e22'], cols: ['#2e2e34', '#34343a', '#28282e', '#3a3a40', '#2a2a30'], speckC: ['#18181c', '#55555e'], seed: 228, per: 3, hl: .14},
    house: {mortar: '#c4bba8', mortarN: ['#a8a090', '#dad2c0'], cols: ['#9c3c28', '#a8462e', '#8a3222', '#b0503a', '#943a2a', '#7e2e20', '#a24a36'], speckC: ['#5a1c10', '#d07a60', '#3a1a10'], seed: 78, per: 3, hl: .2, fire: 1, jit: 1}};
  function hdBlocks() {
    try { swapId(74, paintIronBlock(BS)); } catch (e) { warn('iron', e); }
    try { swapId(LZBLK, paintLazBlock(BS)); } catch (e) { warn('lazblk', e); }
    try { swapId(235, paintRubyBlock(BS)); } catch (e) { warn('ruby', e); }
    try { swapId(T.STONEBRICK, paintBricks(BS, BRK.stone)); } catch (e) { warn('sbrick', e); }
    try { swapId(228, paintBricks(BS, BRK.deep)); } catch (e) { warn('dbrick', e); }
    try { swapId(T.BRICK, paintBricks(BS, BRK.house)); } catch (e) { warn('hbrick', e); }
    try { swapId(T.GLASS, paintGlass(BS)); } catch (e) { warn('glass', e); }
    try { swapId(LZORE, paintLazOre(BS)); } catch (e) { warn('lzore', e); }
  }
  U.paint = {paintBricks, paintIronBlock, paintLazBlock, paintRubyBlock, paintGlass, paintLazOre, paintPlanks, paintDoor, paintStraw};
  /* ---------- 4) HD icons + furniture ---------- */
  const IS = PHN ? 128 : 256;
  const pat = (g, img, sc) => { const p = g.createPattern(img, 'repeat'); if (p && p.setTransform && sc) p.setTransform(new DOMMatrix().scale(sc)); return p; };
  function isoBox(g, img, x, y, z, w, h, d, s) {   // unit iso box textured with img on all 3 visible faces
    const P = (X, Y, Z) => [(X - Z) * .866 * s, (X + Z) * .5 * s - Y * s];
    const face = (p0, p1, p3, dark) => { g.save(); g.transform((p1[0] - p0[0]), (p1[1] - p0[1]), (p3[0] - p0[0]), (p3[1] - p0[1]), p0[0], p0[1]); g.drawImage(img, 0, 0, 1, 1); if (dark) { g.fillStyle = 'rgba(0,0,0,' + dark + ')'; g.fillRect(0, 0, 1, 1); }
      g.lineWidth = 0.02; g.strokeStyle = 'rgba(20,10,0,.5)'; g.strokeRect(0, 0, 1, 1); g.restore(); };
    face(P(x, y + h, z), P(x + w, y + h, z), P(x, y + h, z + d), 0);              // top
    face(P(x, y + h, z + d), P(x + w, y + h, z + d), P(x, y, z + d), .22);       // front-left (z+)
    face(P(x + w, y + h, z + d), P(x + w, y + h, z), P(x + w, y, z + d), .4); }  // front-right (x+)
  const ofs = (g, fn) => { g.save(); g.translate(0, 8); fn(); g.restore(); };
  function iconStairs(img) { return icon(g => ofs(g, () => { g.translate(0, -4); isoBox(g, img, -.5, 0, -.5, 1, .5, 1, 30); isoBox(g, img, -.5, .5, -.5, 1, .5, .5, 30); }), IS); }
  function iconSlab(img) { return icon(g => ofs(g, () => { isoBox(g, img, -.5, 0, -.5, 1, .5, 1, 30); }), IS); }
  function woodRect(g, img, x, y, w, h, vert) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); if (vert) { g.translate(x, y + h); g.rotate(-Math.PI / 2); g.drawImage(img, 0, 0, h * 2, h * 2); } else g.drawImage(img, x, y, w * 2, w * 2); g.restore();
    g.fillStyle = lg(g, x, y, x + w, y, [[0, 'rgba(255,240,210,.25)'], [.5, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.35)']]); g.fillRect(x, y, w, h); g.strokeStyle = 'rgba(20,10,0,.75)'; g.lineWidth = 1.2; g.strokeRect(x, y, w, h); }
  function iconFence(img) { return icon(g => { woodRect(g, img, -22, -26, 9, 54, 1); woodRect(g, img, 13, -26, 9, 54, 1); woodRect(g, img, -28, -16, 56, 7); woodRect(g, img, -28, 6, 56, 7); woodRect(g, img, -22, -26, 9, 54, 1); woodRect(g, img, 13, -26, 9, 54, 1); }, IS); }
  function iconGate(img) { return icon(g => { woodRect(g, img, -30, -22, 8, 50, 1); woodRect(g, img, 22, -22, 8, 50, 1); woodRect(g, img, -22, -16, 44, 7); woodRect(g, img, -22, 8, 44, 7);
    woodRect(g, img, -3.5, -16, 7, 31, 1); g.save(); g.translate(0, -4); g.rotate(-.5); woodRect(g, img, -24, -3, 48, 6); g.restore(); woodRect(g, img, -30, -22, 8, 50, 1); woodRect(g, img, 22, -22, 8, 50, 1); }, IS); }
  function iconDoor(c) { return icon(g => { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-14, -28, 30, 58); g.drawImage(c, -16, -30, 30, 60); g.strokeStyle = 'rgba(20,10,0,.8)'; g.lineWidth = 1.2; g.strokeRect(-16, -30, 30, 60); }, IS); }
  function iconBoat(img, W) { return icon(g => { g.save(); g.beginPath(); g.moveTo(-30, -4); g.lineTo(30, -4); g.lineTo(22, 12); g.quadraticCurveTo(0, 18, -22, 12); g.closePath(); g.clip(); g.drawImage(img, -32, -8, 64, 64); g.fillStyle = lg(g, 0, -4, 0, 16, [[0, 'rgba(255,240,210,.2)'], [1, 'rgba(0,0,0,.45)']]); g.fillRect(-32, -6, 64, 26); g.restore();
    g.strokeStyle = shade(W.d, .7); g.lineWidth = 3; g.beginPath(); g.moveTo(-31, -5); g.lineTo(31, -5); g.stroke(); g.strokeStyle = 'rgba(20,10,0,.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-30, -4); g.lineTo(30, -4); g.lineTo(22, 12); g.quadraticCurveTo(0, 18, -22, 12); g.closePath(); g.stroke();
    g.fillStyle = shade(W.c, .8); g.fillRect(-6, -9, 12, 5); g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(10, -6); g.lineTo(26, -22); g.stroke(); g.fillStyle = shade(W.c, .9); g.beginPath(); g.ellipse(27, -23, 3, 6, .8, 0, 7); g.fill(); }, IS); }
  function woodIcons() { const oakImg = texImg['planks'];
    for (let w = 0; w < WOODS.length; w++) { const W = woodOf(w), img = w ? PLC[w] : oakImg; if (!img) continue;
      try { if (w) { setIcon(600 + w, iconStairs(img)); setIcon(610 + w, iconSlab(img)); setIcon(620 + w, iconDoor(DOORC[w] || (DOORC[w] = paintDoor(W)))); setIcon(650 + w, iconBoat(img, W)); }
        else { setIcon(SLAB, iconSlab(img)); }
        setIcon(w ? 630 + w : FENCE, iconFence(img)); setIcon(w ? 640 + w : GATE, iconGate(img)); } catch (e) { warn('woodicon' + w, e); } } }
  // bed: HD tartan in the same colours + single-bed tile
  function tartanHD(base, sett, S) { const c = cv(S), g = c.getContext('2d'), k = S / 256; g.fillStyle = base; g.fillRect(0, 0, S, S);
    g.globalAlpha = .62; for (const [col, o, w] of sett) { g.fillStyle = col; for (let r = 0; r < 256; r += 128) g.fillRect((o + r) * k, 0, w * k, S); }
    g.globalAlpha = .5; for (const [col, o, w] of sett) { g.fillStyle = col; for (let r = 0; r < 256; r += 128) g.fillRect(0, (o + r) * k, S, w * k); }
    g.globalAlpha = .13; g.fillStyle = '#000'; const st = 4 * k / 2; for (let i = -S; i < S; i += st * 2) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.lineTo(i + S + st, S); g.lineTo(i + st, 0); g.fill(); }
    g.globalAlpha = 1; const R = rng(19); for (let i = 0; i < S * 6; i++) { g.strokeStyle = R() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; g.lineWidth = k * .6; const x = R() * S, y = R() * S; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 6 * k, y + (R() - .5) * 6 * k); g.stroke(); }
    return c; }
  function cotton(S) { const c = cv(S), g = c.getContext('2d'), R = rng(5); g.fillStyle = '#f4f2ee'; g.fillRect(0, 0, S, S); const st = S / 128;
    for (let i = 0; i < S; i += st) { g.fillStyle = 'rgba(0,0,0,.035)'; g.fillRect(i, 0, st * .5, S); g.fillRect(0, i, S, st * .5); } noise(g, S, R, S * 4, .12, ['#d8d4cc', '#ffffff'], .5); return c; }
  const BEDSETT = ['#b01c22', [['#0b3d1e', 8, 26], ['#0e2a5a', 44, 14], ['#0b0b0b', 66, 4], ['#f2d43a', 84, 3], ['#ffffff', 100, 2], ['#0b3d1e', 108, 10]]];
  let bedDone = false;
  function hdBed() { if (bedDone || !bedMats || !bedMats.tartan) return; bedDone = true; const S = PHN ? 512 : 1024;
    try { const t1 = mkTex(tartanHD(BEDSETT[0], BEDSETT[1], S)); bedMats.blanket.map = t1; bedMats.blanket.needsUpdate = true;
      const t2 = mkTex(tartanHD('#5a0e12', [['#0b2a16', 10, 20], ['#0a1a3a', 50, 10]], S / 2)); bedMats.trim.map = t2; bedMats.trim.needsUpdate = true;
      const ct = mkTex(cotton(S / 2)); bedMats.sheet.map = ct; bedMats.pillow.map = ct; bedMats.sheet.needsUpdate = bedMats.pillow.needsUpdate = true;
      const wm = BLOCK_MATS[10]; const wmap = (Array.isArray(wm) ? wm[0] : wm).map; if (wmap) { bedMats.wood.map = wmap; bedMats.wood.needsUpdate = true; } } catch (e) { warn('bedhd', e); } }
  try { const bb = buildBed; buildBed = function () { const r = bb.apply(this, arguments); if (!bedDone) hdBed(); return r; }; } catch (e) { warn('bed', e); }
  const tartanSmall = tartanHD(BEDSETT[0], BEDSETT[1], 256);
  function iconBed() { return icon(g => { const W = OAK;
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(2, 22, 30, 4, 0, 0, 7); g.fill();
    g.fillStyle = lg(g, 0, 8, 0, 22, [[0, '#a87a44'], [1, '#5a3c1c']]); g.fillRect(-28, 8, 58, 7); g.fillRect(-28, 14, 5, 8); g.fillRect(25, 14, 5, 8);   // frame + legs
    g.fillStyle = lg(g, -30, 0, -22, 0, [[0, '#c09058'], [1, '#6a4422']]); g.beginPath(); g.moveTo(-30, 22); g.lineTo(-30, -14); g.quadraticCurveTo(-26, -20, -22, -14); g.lineTo(-22, 22); g.fill(); g.strokeStyle = '#3a2410'; g.lineWidth = 1; g.stroke();
    g.fillStyle = lg(g, 0, -2, 0, 9, [[0, '#ffffff'], [1, '#d6d2ca']]); g.beginPath(); g.roundRect ? g.roundRect(-22, -2, 52, 11, 3) : g.rect(-22, -2, 52, 11); g.fill();   // mattress
    g.fillStyle = lg(g, 0, -9, 0, -1, [[0, '#ffffff'], [1, '#d8d4cc']]); g.beginPath(); g.ellipse(-14, -4, 8, 4.5, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.stroke();   // pillow
    g.save(); g.beginPath(); g.moveTo(-5, -5); g.quadraticCurveTo(12, -8, 31, -5); g.lineTo(31, 10); g.lineTo(-5, 10); g.closePath(); g.clip(); g.drawImage(tartanSmall, -5, -8, 40, 40); g.fillStyle = lg(g, 0, -6, 0, 10, [[0, 'rgba(255,255,255,.18)'], [1, 'rgba(0,0,0,.3)']]); g.fillRect(-6, -9, 40, 20); g.restore();
    g.fillStyle = '#7a1518'; g.fillRect(-6, -6, 3, 16); }, IS); }
  // TV
  function veneer(S, a, b) { const c = cv(S), g = c.getContext('2d'), R = rng(120); g.fillStyle = a; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 60; i++) { g.strokeStyle = R() < .6 ? hexA(b, .3 + R() * .3) : 'rgba(255,230,190,.08)'; g.lineWidth = (1 + R() * 3) * S / 512; const y = R() * S, ph = R() * 6; g.beginPath(); for (let s = 0; s <= 30; s++) { const x = S * s / 30, yy = y + Math.sin(ph + s / 5) * S * .015; s ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
    noise(g, S, R, S * 3, .1, ['#000', '#fff'], .5); return c; }
  function screenGlass(S) { const c = cv(S, S * .7 | 0), g = c.getContext('2d'), H = c.height; g.fillStyle = rg(g, S * .5, H * .5, 0, S * .6, [[0, '#1e2a30'], [.7, '#0c1216'], [1, '#040608']]); g.fillRect(0, 0, S, H);
    g.fillStyle = 'rgba(255,255,255,.09)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(S * .55, 0); g.quadraticCurveTo(S * .3, H * .3, 0, H * .55); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(S * .22, H * .18, S * .1, H * .05, -.4, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = S * .03; g.strokeRect(0, 0, S, H); return c; }
  function hdTV() { try { const S = PHN ? 256 : 512;
      tvBodyMat.map = mkTex(veneer(S, '#4a2e1a', '#1e1008')); tvBodyMat.color.setHex(0xffffff); tvBodyMat.needsUpdate = true;
      tvTrimMat.map = mkTex(veneer(S / 2, '#b08a54', '#5a3a18')); tvTrimMat.color.setHex(0xffffff); tvTrimMat.needsUpdate = true;
      tvOffMat.map = mkTex(screenGlass(S), false); tvOffMat.color.setHex(0xffffff); tvOffMat.needsUpdate = true; } catch (e) { warn('tvhd', e); } }
  function iconTV() { const vb = veneer(128, '#4a2e1a', '#1e1008'), sg = screenGlass(128); return icon(g => {
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 24, 26, 3.5, 0, 0, 7); g.fill();
    g.fillStyle = '#c8a060'; g.fillRect(-20, 17, 4, 7); g.fillRect(16, 17, 4, 7);
    g.save(); g.beginPath(); g.roundRect ? g.roundRect(-28, -20, 56, 38, 5) : g.rect(-28, -20, 56, 38); g.clip(); g.drawImage(vb, -28, -20, 56, 56); g.fillStyle = lg(g, 0, -20, 0, 18, [[0, 'rgba(255,240,210,.2)'], [1, 'rgba(0,0,0,.35)']]); g.fillRect(-28, -20, 56, 38); g.restore();
    g.strokeStyle = '#1e1008'; g.lineWidth = 1.2; g.beginPath(); g.roundRect ? g.roundRect(-28, -20, 56, 38, 5) : g.rect(-28, -20, 56, 38); g.stroke();
    g.save(); g.beginPath(); g.roundRect ? g.roundRect(-23, -15, 36, 27, 6) : g.rect(-23, -15, 36, 27); g.clip(); g.drawImage(sg, -23, -15, 36, 27); g.restore(); g.strokeStyle = '#c8a060'; g.lineWidth = 1.5; g.beginPath(); g.roundRect ? g.roundRect(-23.5, -15.5, 37, 28, 6) : g.rect(-23.5, -15.5, 37, 28); g.stroke();
    for (const y of [-9, 1]) { g.fillStyle = rg(g, 20, y - 1, 0, 4, [[0, '#fff0c0'], [.5, '#c8962a'], [1, '#5a3a08']]); g.beginPath(); g.arc(20.5, y, 3.2, 0, 7); g.fill(); }
    g.fillStyle = '#e02020'; g.fillRect(18.5, 9, 4, 2); g.fillStyle = '#c8a060'; g.fillRect(-28, 15, 56, 3); }, IS); }
  // buckets, flint & steel, rifle, Brew, hive, pane
  function iconBucket(fill) { return icon(g => {
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 26, 20, 3.5, 0, 0, 7); g.fill();
    g.strokeStyle = lg(g, -20, 0, 20, 0, [[0, '#6a7076'], [.5, '#e8ecf0'], [1, '#50565c']]); g.lineWidth = 2.6; g.beginPath(); g.arc(0, -10, 20, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.fillStyle = lg(g, -19, 0, 19, 0, [[0, '#5c6268'], [.22, '#c8ced4'], [.4, '#f4f6f8'], [.6, '#a8aeb4'], [1, '#464c52']]); g.beginPath(); g.moveTo(-20, -12); g.lineTo(20, -12); g.lineTo(15, 24); g.quadraticCurveTo(0, 28, -15, 24); g.closePath(); g.fill();
    for (const y of [-3, 14]) { g.strokeStyle = 'rgba(40,44,48,.55)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-19 + (y + 12) * .14, y); g.quadraticCurveTo(0, y + 3, 19 - (y + 12) * .14, y); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = .7; g.beginPath(); g.moveTo(-19 + (y + 12) * .14, y - 1.2); g.quadraticCurveTo(0, y + 1.8, 19 - (y + 12) * .14, y - 1.2); g.stroke(); }
    g.fillStyle = '#7a8086'; g.beginPath(); g.ellipse(0, -12, 20, 5, 0, 0, 7); g.fill(); g.strokeStyle = '#e8ecf0'; g.lineWidth = 1.3; g.stroke();
    g.fillStyle = fill === 'water' ? rg(g, -4, -13, 0, 18, [[0, '#9ad8ff'], [.5, '#3a8ad8'], [1, '#1a4a9a']]) : fill === 'lava' ? rg(g, -4, -13, 0, 18, [[0, '#fff2a0'], [.4, '#ff9a20'], [1, '#b02a08']]) : fill === 'milk' ? rg(g, -4, -13, 0, 18, [[0, '#ffffff'], [1, '#d8d4cc']]) : rg(g, 0, -12, 0, 18, [[0, '#1a1c1e'], [1, '#3a3e42']]);
    g.beginPath(); g.ellipse(0, -11.5, 17.5, 3.8, 0, 0, 7); g.fill();
    if (fill) { g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-6, -12.5, 5, 1, 0, 0, 7); g.fill(); }
    for (const x of [-19.5, 19.5]) { g.fillStyle = '#2e3236'; g.beginPath(); g.arc(x, -10, 2, 0, 7); g.fill(); } }, IS); }
  function iconFlint() { return icon(g => {
    g.save(); g.rotate(-.5); g.fillStyle = lg(g, 0, -6, 0, 6, [[0, '#e8ecf0'], [.5, '#8a9096'], [1, '#3a3e42']]); g.beginPath(); g.moveTo(-6, -22); g.lineTo(6, -22); g.lineTo(6, 4); g.quadraticCurveTo(14, 8, 14, 18); g.lineTo(-14, 18); g.quadraticCurveTo(-14, 8, -6, 4); g.closePath(); g.fill(); g.strokeStyle = '#2a2e32'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.ellipse(0, -13, 2.4, 5, 0, 0, 7); g.fill(); g.restore();
    g.save(); g.translate(14, 8); g.rotate(.5); g.fillStyle = lg(g, -10, -10, 10, 10, [[0, '#6a6460'], [.5, '#2a2624'], [1, '#121010']]); g.beginPath(); g.moveTo(-10, -4); g.lineTo(-2, -12); g.lineTo(10, -6); g.lineTo(9, 7); g.lineTo(-4, 11); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(-8, -4); g.lineTo(-2, -10); g.lineTo(2, -6); g.closePath(); g.fill(); g.restore();
    for (let i = 0; i < 7; i++) { const a = -1.2 + i * .35, r = 6 + (i % 3) * 3; g.fillStyle = i % 2 ? '#ffd040' : '#ff8a20'; g.beginPath(); g.arc(-2 + Math.cos(a) * r, -2 + Math.sin(a) * r * .6, 1.2, 0, 7); g.fill(); } }, IS); }
  function walnut(S) { return veneer(S, '#6a3a1e', '#2a1408'); }
  function iconRifle() { const wn = walnut(128); return icon(g => { g.rotate(-.62);
    g.save(); g.beginPath(); g.moveTo(-34, -1); g.lineTo(-10, -2); g.lineTo(-4, 1); g.lineTo(-22, 7); g.lineTo(-34, 9); g.closePath(); g.moveTo(-10, -2); g.lineTo(26, -1.5); g.lineTo(26, 1.5); g.lineTo(-4, 2.5); g.closePath(); g.clip(); g.drawImage(wn, -36, -12, 64, 64);
    g.fillStyle = lg(g, 0, -3, 0, 9, [[0, 'rgba(255,230,190,.35)'], [1, 'rgba(0,0,0,.4)']]); g.fillRect(-36, -4, 64, 14); g.restore();
    g.fillStyle = lg(g, 0, -3.5, 0, -.5, [[0, '#8a9aac'], [.5, '#2a3442'], [1, '#10161e']]); g.fillRect(-10, -3.6, 44, 2.8); g.fillStyle = 'rgba(200,220,255,.6)'; g.fillRect(-10, -3.4, 44, .5);
    g.fillStyle = '#c8a050'; g.fillRect(4, -3.9, 2, 6); g.fillRect(18, -3.9, 2, 6); g.fillRect(-34, -1, 1.6, 10);
    g.fillStyle = '#1a1e24'; g.fillRect(-12, -5, 6, 4); g.beginPath(); g.moveTo(-9, -5); g.lineTo(-11, -9); g.lineTo(-8.5, -9); g.closePath(); g.fill();
    g.strokeStyle = '#2a2e34'; g.lineWidth = 1.2; g.beginPath(); g.arc(-8, 4.5, 3, 0, Math.PI); g.stroke(); g.fillStyle = '#c8a050'; g.fillRect(33, -4.4, 1.5, 3.6); }, IS); }
  function iconBrew() { return icon(g => {
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(0, 27, 15, 3, 0, 0, 7); g.fill();
    const body = lg(g, -14, 0, 14, 0, [[0, '#8a3a06'], [.18, '#f08a1e'], [.36, '#ffd08a'], [.5, '#ff9a2a'], [.8, '#c05a0a'], [1, '#6a2a04']]);
    g.fillStyle = body; g.fillRect(-14, -18, 28, 42); const R = rng(121); for (let i = 0; i < 160; i++) { g.fillStyle = R() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(80,30,0,.12)'; g.fillRect(-14 + R() * 28, -18 + R() * 42, .6 + R(), .3); }
    g.fillStyle = lg(g, -14, 0, 14, 0, [[0, '#0a2a6a'], [.35, '#3a7ae0'], [.5, '#8ab8ff'], [1, '#08204e']]); g.beginPath(); g.moveTo(-14, -2); g.quadraticCurveTo(0, -8, 14, -2); g.lineTo(14, 8); g.quadraticCurveTo(0, 2, -14, 8); g.closePath(); g.fill();
    const gold = lg(g, -14, 0, 14, 0, [[0, '#6a4a08'], [.3, '#ffe9a0'], [.5, '#f4c640'], [.75, '#b0820e'], [1, '#5a3e06']]);
    g.fillStyle = gold; g.fillRect(-14, -4.5, 28, 2); g.fillRect(-14, 7.5, 28, 2); g.fillRect(-14, 19, 28, 5); g.fillRect(-14.5, -22, 29, 4);
    g.fillStyle = '#ffffff'; g.font = 'bold 7px sans-serif'; g.textAlign = 'center'; g.fillText('BREW', 0, 5.5); g.fillStyle = gold; g.font = 'bold 5px serif'; g.fillText('IRN', 0, -8);
    g.fillStyle = lg(g, -13, 0, 13, 0, [[0, '#7a7e84'], [.5, '#eef0f2'], [1, '#6a6e74']]); g.beginPath(); g.ellipse(0, -22, 14.5, 3.5, 0, 0, 7); g.fill(); g.fillStyle = '#9aa0a6'; g.beginPath(); g.ellipse(3, -22.3, 4, 1.4, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-8, -16, 2.5, 38); }, IS); }
  const strawC = paintStraw(PHN ? 256 : 512);
  function iconHive() { return icon(g => {
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 26, 26, 4, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.moveTo(-24, 24); g.bezierCurveTo(-26, -6, -14, -26, 0, -26); g.bezierCurveTo(14, -26, 26, -6, 24, 24); g.closePath(); g.clip(); g.drawImage(strawC, -26, -28, 52, 52);
    g.fillStyle = rg(g, -8, -12, 2, 34, [[0, 'rgba(255,240,200,.2)'], [1, 'rgba(40,20,0,.45)']]); g.fillRect(-26, -28, 52, 54); g.restore();
    g.fillStyle = '#1a0e04'; g.beginPath(); g.ellipse(0, 20, 6, 4.5, 0, Math.PI, 0); g.lineTo(6, 24); g.lineTo(-6, 24); g.fill();
    for (const [x, y] of [[14, -14], [-17, -4]]) { g.fillStyle = '#f2c020'; g.beginPath(); g.ellipse(x, y, 3, 2.2, 0, 0, 7); g.fill(); g.fillStyle = '#1a1a1a'; g.fillRect(x - .6, y - 2.2, 1.2, 4.4); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(x - 1, y - 3, 2, 1.2, -.4, 0, 7); g.fill(); } }, IS); }
  function iconPane() { const gc = paintGlass(256); return icon(g => { g.fillStyle = 'rgba(180,220,240,.18)'; g.fillRect(-20, -28, 40, 56); g.drawImage(gc, -20, -28, 40, 56); g.strokeStyle = 'rgba(90,120,140,.9)'; g.lineWidth = 1.2; g.strokeRect(-20, -28, 40, 56); }, IS); }
  function itemIcons() {
    const t = (id, f) => { try { if (id != null) setIcon(id, f()); } catch (e) { warn('icon' + id, e); } };
    t(T.BED, iconBed); t(T.TV, iconTV); t(IT.BUCKET || 39, () => iconBucket(null)); t(48, () => iconBucket('water'));
    t(201, () => iconBucket(/lava/i.test(NAMES[201] || '') ? 'lava' : /milk/i.test(NAMES[201] || '') ? 'milk' : 'water'));
    t(IT.FLINTSTEEL || 116, iconFlint); t(IT.MUSKET || 213, iconRifle); t(IT.BREW || 121, iconBrew); t(244, iconHive); t(227, iconPane); }
  // the rifle model: walnut stock + blued steel
  function hdRifle(root) { try { const wt = mkTex(walnut(PHN ? 256 : 512)); root.traverse(c => { if (!c.isMesh || !c.material || Array.isArray(c.material)) return; const m = c.material; if (m.c121) return; let base = m.color ? m.color.clone() : new THREE.Color(0x888888); try { const im = m.map && m.map.image; if (im && im.getContext) { const d = im.getContext('2d').getImageData(Math.floor(im.width / 2), Math.floor(im.height / 2), 1, 1).data; base = new THREE.Color(d[0] / 255, d[1] / 255, d[2] / 255).multiply(m.color || new THREE.Color(1, 1, 1)); } } catch (_) {}
      const col = base.getHSL({});
      const nm = new THREE.MeshPhongMaterial({color: 0xffffff}); nm.c121 = 1;
      if (col.s > .25 && col.l < .6 && base.r > base.b) { nm.map = wt; nm.shininess = 30; nm.specular = new THREE.Color(0x332211); }
      else if (col.l < .55) { nm.color.setHex(0x2a3442); nm.shininess = 110; nm.specular = new THREE.Color(0x9ab0cc); }
      else { nm.color.copy(base); nm.shininess = 90; nm.specular = new THREE.Color(0x887744); }
      c.material = nm; }); } catch (e) { warn('rifle', e); } }
  /* ---------- 5) glass pane that looks right ---------- */
  const PTH = 0.0625;
  const HIDEM = new THREE.MeshBasicMaterial({visible: false});
  const EDGEM = new THREE.MeshLambertMaterial({color: 0xd6ecf2, transparent: true, opacity: 0.75, depthWrite: false});
  let PANEM = null;
  function paneMat() { if (PANEM && PANEM.map === [].concat(BLOCK_MATS[T.GLASS])[0].map) return PANEM; const g0 = [].concat(BLOCK_MATS[T.GLASS])[0]; PANEM = g0.clone(); PANEM.transparent = true; PANEM.depthWrite = false; PANEM.side = THREE.FrontSide; PANEM.opacity = 1; PANEM.alphaTest = 0.01; return PANEM; }
  function paneBox(g, x0, z0, x1, z1, hide) {   // hide: [+x,-x,+z,-z] faces to skip
    const w = x1 - x0, d = z1 - z0, geo = new THREE.BoxGeometry(w, 1, d); geo.translate(x0 + w / 2, 0.5, z0 + d / 2);
    const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) { const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i), nx = nor.getX(i), nz = nor.getZ(i); if (Math.abs(nz) > .5) uv.setXY(i, nz > 0 ? px : 1 - px, py); else if (Math.abs(nx) > .5) uv.setXY(i, nx > 0 ? 1 - pz : pz, py); }
    uv.needsUpdate = true; const pm = paneMat(), along = w >= d;
    const big = f => along ? (f === 4 || f === 5) : (f === 0 || f === 1);
    const mats = [0, 1, 2, 3, 4, 5].map(f => { if (f === 2 || f === 3) return EDGEM; if (big(f)) return pm; const side = [0, 1, -1, -1, 2, 3][f]; return hide[side] ? HIDEM : EDGEM; });
    const m = new THREE.Mesh(geo, mats); m.renderOrder = 2; g.add(m); }
  function paneGroup(o, m) { const g = new THREE.Group(); g.position.set(o.x, o.y, o.z); const c0 = 0.5 - PTH / 2, c1 = 0.5 + PTH / 2;
    const E = m & 1, Wd = m & 2, S = m & 4, N = m & 8;
    const xs = E || Wd, zs = S || N;
    if (!zs) paneBox(g, 0, c0, 1, c1, [E, Wd, 0, 0]);
    else if (!xs) paneBox(g, c0, 0, c1, 1, [0, 0, S, N]);
    else { paneBox(g, c0, c0, c1, c1, [E, Wd, S, N]);
      if (E) paneBox(g, c1, c0, 1, c1, [1, 1, 0, 0]); if (Wd) paneBox(g, 0, c0, c0, c1, [1, 1, 0, 0]); if (S) paneBox(g, c0, c1, c1, 1, [0, 0, 1, 1]); if (N) paneBox(g, c0, 0, c1, c0, [0, 0, 1, 1]); }
    return g; }
  function fixPanes() { for (const [k, o] of fenceObjs) { if (o.t !== 227 || !o.g || o.g === o.c121g) continue;
      try { const m = window.paneConn ? paneConn(o.x, o.y, o.z) : (o.pm || 0); const g = paneGroup(o, m); scene.remove(o.g); scene.add(g); o.g = g; o.c121g = g; o.pm = m; } catch (e) { warn('pane', e); } } }
  try { const sf = window.syncFences; if (sf) { window.syncFences = function () { const r = sf.apply(this, arguments); fixPanes(); paintFences(); return r; }; try { syncFences = window.syncFences; } catch (_) {} } } catch (e) { warn('syncFences', e); }

  /* ---------- 6) round straw beehive ---------- */
  const HIVE = 244, hiveObjs = new Map(); let hiveGeo = null, hiveMat = null, hiveDark = null;
  function hiveParts() { if (hiveGeo) return; const pts = []; const prof = [[.44, 0], [.47, .1], [.47, .3], [.43, .52], [.34, .72], [.2, .87], [.06, .96], [0, .97]];
    for (let i = 0; i < prof.length - 1; i++) for (let s = 0; s < 6; s++) { const t = s / 6, a = prof[i], b = prof[i + 1]; pts.push(new THREE.Vector2(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)); } pts.push(new THREE.Vector2(0, .97));
    hiveGeo = [new THREE.LatheGeometry(pts, PHN ? 20 : 32)]; const t = mkTex(strawC); t.repeat.set(3, 1); hiveMat = new THREE.MeshLambertMaterial({map: t});
    const rings = [[.465, .08], [.47, .22], [.455, .36], [.42, .5], [.37, .62], [.3, .73], [.22, .83], [.13, .9]];
    for (const [r, y] of rings) { const tg = new THREE.TorusGeometry(r, .03, 6, PHN ? 20 : 32); tg.rotateX(Math.PI / 2); tg.translate(0, y, 0); hiveGeo.push(tg); }
    hiveDark = new THREE.MeshBasicMaterial({color: 0x140a02}); }
  function buildHive(x, y, z) { hiveParts(); const g = new THREE.Group(); g.position.set(x + .5, y, z + .5); const m = entMeta.get(keyOf(x, y, z)); g.rotation.y = ((m && m.face) || 0) * Math.PI / 2;
    for (const geo of hiveGeo) g.add(new THREE.Mesh(geo, hiveMat));
    const door = new THREE.Mesh(new THREE.CircleGeometry(.1, 12, 0, Math.PI), hiveDark); door.position.set(0, .02, .475); g.add(door);
    const board = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .04, PHN ? 16 : 24), BLOCK_MATS[10] && !Array.isArray(BLOCK_MATS[10]) ? BLOCK_MATS[10] : hiveMat); board.position.y = .0; g.add(board);
    scene.add(g); return g; }
  function syncHives() { const want = new Set(); try { for (const L of chunkLists.values()) { const a = L[HIVE]; if (a) for (let i = 0; i < a.length; i += 3) want.add(keyOf(a[i], a[i + 1], a[i + 2])); } } catch (_) { return; }
    for (const [k, g] of hiveObjs) if (!want.has(k)) { scene.remove(g); hiveObjs.delete(k); }
    for (const k of want) if (!hiveObjs.has(k)) { const [x, y, z] = k.split(',').map(Number); hiveObjs.set(k, buildHive(x, y, z)); } }
  U.syncHives = syncHives; U.hiveObjs = hiveObjs;
  try { ENT[HIVE] = 1; const se = syncEntities; syncEntities = function () { const r = se.apply(this, arguments); try { syncHives(); } catch (e) { warn('hive', e); } return r; }; } catch (e) { warn('hiveSE', e); }
  setInterval(() => { if (chunkST && chunkST[HIVE] !== 1) { chunkST[HIVE] = 1; try { for (const [x, , z] of [...hiveObjs.keys()].map(k => k.split(',').map(Number))) dirtyAround(x, z); } catch (_) {} } }, 400);

  /* ---------- 7) curious bees: stare, smile, fly off ---------- */
  let smileMat = null;
  function smileFor(m) { if (smileMat) return smileMat; try { const src = m.map && m.map.image; const c = cv(128); const g = c.getContext('2d'); if (src) g.drawImage(src, 0, 0, 128, 128); else { g.fillStyle = '#f7d81e'; g.fillRect(0, 0, 128, 128); }
      g.fillStyle = '#f7d81e'; g.fillRect(34, 86, 60, 14); g.fillStyle = '#e2bf10'; g.fillRect(34, 100, 60, 14);
      g.strokeStyle = '#1a1a1a'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(44, 90); g.quadraticCurveTo(64, 116, 84, 90); g.stroke();
      g.fillStyle = 'rgba(255,110,120,.55)'; for (const x of [18, 110]) { g.beginPath(); g.arc(x, 88, 10, 0, 7); g.fill(); }
      g.fillStyle = '#fff'; for (const x of [42, 90]) g.fillRect(x - 3, 50, 3, 3);
      const t = new THREE.CanvasTexture(c); t.magFilter = THREE.LinearFilter; smileMat = m.clone(); smileMat.map = t; smileMat.userData = {shared: true}; } catch (e) { warn('smile', e); smileMat = m; } return smileMat; }
  function headOf(a) { if (a.c121h !== undefined) return a.c121h; let h = null; a.g.traverse(c => { if (h || !c.isMesh || !Array.isArray(c.material) || c.material.length !== 6) return; const M = c.material; if (M[0] === M[1] && M[1] === M[2] && M[2] === M[3] && M[3] === M[4] && M[5] !== M[0]) h = c; }); return (a.c121h = h); }
  function endCur(a) { const s = a.c121; s.st = 0; s.cd = 25 + Math.random() * 10; const h = headOf(a); if (h && s.face) { h.material[5] = s.face; } }
  try { const um = updateMobs; updateMobs = function (dt) { const hold = [];
      try { for (const a of mobs) { if (a.kind !== 'bee' || !a.g) continue; const s = a.c121 || (a.c121 = {st: 0, cd: 2 + Math.random() * 6, t: 0}); s.cd -= dt; const p = a.g.position;
        const d = Math.hypot(P.x - p.x, P.y + 1.5 - p.y, P.z - p.z);
        if (!s.st && s.cd <= 0 && !(a.angry > 0) && d < 5 && !dead && started) { s.st = 1; s.t = 0; }
        if (s.st) { if (a.angry > 0 || d > 9) { endCur(a); continue; } hold.push([a, p.x, p.y, p.z]); } } } catch (_) {}
      const r = um.apply(this, arguments);
      for (const [a, x, y, z] of hold) { try { const s = a.c121; s.t += dt; a.g.position.set(x, y + (s.st === 2 ? Math.sin(s.t * 6) * dt * 0.15 : 0), z);
        const dx = P.x - x, dz = P.z - z, want = Math.atan2(-dx, -dz); let df = want - a.g.rotation.y; df = Math.atan2(Math.sin(df), Math.cos(df)); a.g.rotation.y += df * Math.min(1, dt * 5);
        if (a.st !== 'wander') a.st = 'wander'; a.stT = 3;
        if (s.st === 1 && s.t > 2) { s.st = 2; const h = headOf(a); if (h) { s.face = h.material[5]; h.material = h.material.slice(); h.material[5] = smileFor(s.face); } }
        else if (s.st === 2 && s.t > 5) { endCur(a); const ang = Math.atan2(x - P.x, z - P.z) + (Math.random() - .5); a.tgt = [x + Math.sin(ang) * 10, y + 1 + Math.random() * 2, z + Math.cos(ang) * 10]; a.st = 'wander'; a.stT = 4; } } catch (_) {} }
      return r; }; } catch (e) { warn('bees', e); }
  // hive honey without shears (shears are disabled): use an empty hand or any tool on a full hive
  function hiveWrap(args, ui) { try { if (!menuOpen && !paused && !dead && started && selId !== IT.SHEARS && !(PLACEABLE.has(selId) && cnt(selId) > 0) && selId !== (IT.BOTTLE || -1)) {
        const r = raycast(5); if (r && r.hit && getB(...r.hit) === HIVE && !/bottle/i.test(NAMES[selId] || '') && !/egg/i.test(NAMES[selId] || '')) { const s = selId, sv = inv[IT.SHEARS]; selId = IT.SHEARS; inv[IT.SHEARS] = 1; try { return ui.apply(this, args); } finally { selId = s; if (sv === undefined) delete inv[IT.SHEARS]; else inv[IT.SHEARS] = sv; } } } } catch (_) {}
    return ui.apply(this, args); }
  /* ---------- 8) ponds with ducks ---------- */
  const PD = U.ponds = {list: [], pend: null, need: false, wref: null};
  const topAt = (x, z) => { for (let y = H - 2; y > 1; y--) { const b = world[idx(x, y, z)]; if (b && b !== T.WATER && !PLANT[b] && !LEAFY[b] && !ENT[b]) return y; } return -1; };
  function digPonds(n) { const made = []; if (DIM.cur) return made; const R = Math.random, near = (x, z, r) => PD.list.some(p => Math.hypot(p[0] - x, p[1] - z) < r);
    for (let t = 0; t < 900 && made.length < n; t++) { const x = 8 + (R() * (W - 16) | 0), z = 8 + (R() * (D - 16) | 0), r = 3 + R() * 1.4, ri = Math.ceil(r);
      if (Math.hypot(x - P.x, z - P.z) < 22 || near(x, z, 34)) continue; const h = topAt(x, z); if (h < 3 || world[idx(x, h, z)] !== T.GRASS) continue; if (window.__c131 && __c131.cavey && __c131.cavey(x, z, ri + 1, h)) continue;   // v1.0.14: no pond over a cave
      let ok = true; for (let dx = -ri - 1; dx <= ri + 1 && ok; dx++) for (let dz = -ri - 1; dz <= ri + 1 && ok; dz++) { const X = x + dx, Z = z + dz; if (X < 1 || Z < 1 || X >= W - 1 || Z >= D - 1) { ok = false; break; }
        const th = topAt(X, Z); if (Math.abs(th - h) > (Math.hypot(dx, dz) < r ? 0 : 1)) ok = false; const b = world[idx(X, th, Z)]; if (b !== T.GRASS && b !== T.DIRT) ok = false;
        for (let y = th - 2; y <= th + 3 && ok; y++) if (placedSet.has(idx(X, y, Z))) ok = false; }
      if (!ok) continue;
      for (let dx = -ri; dx <= ri; dx++) for (let dz = -ri; dz <= ri; dz++) { const d = Math.hypot(dx, dz) + (R() - .5) * .5; if (d >= r) continue; const X = x + dx, Z = z + dz;
        for (let y = h + 1; y < h + 4; y++) { const b = world[idx(X, y, Z)]; if (b && (PLANT[b] || b === T.LEAVES)) world[idx(X, y, Z)] = T.AIR; }
        world[idx(X, h, Z)] = T.WATER; if (d < r * .6) { world[idx(X, h - 1, Z)] = T.WATER; if (!world[idx(X, h - 2, Z)]) world[idx(X, h - 2, Z)] = T.DIRT; } else if (!world[idx(X, h - 1, Z)]) world[idx(X, h - 1, Z)] = T.DIRT;
        if (d > r - 1.2 && R() < .25 && world[idx(X, h - 1, Z)] !== T.WATER) world[idx(X, h - 1, Z)] = T.SAND; }
      for (let dx = -ri - 1; dx <= ri + 1; dx += 4) for (let dz = -ri - 1; dz <= ri + 1; dz += 4) markDirty(x + dx, z + dz); markDirty(x + ri, z + ri); markDirty(x - ri, z - ri);
      const p = [x, z, h + 1, r]; PD.list.push(p); made.push(p); }
    return made; }
  U.digPonds = digPonds;
  function clusterCells(cells) { const out = []; for (const [x, y, z] of cells) { let c = out.find(q => Math.hypot(q.sx / q.n - x, q.sz / q.n - z) < 7 && q.wl === y + 1); if (!c) { c = {sx: 0, sz: 0, n: 0, wl: y + 1, r: 1}; out.push(c); } c.sx += x; c.sz += z; c.n++; }
    return out.filter(c => c.n >= 2).map(c => [Math.round(c.sx / c.n), Math.round(c.sz / c.n), c.wl, Math.max(1.5, Math.sqrt(c.n / Math.PI) + .5)]); }
  try { const fp = findPondSpot; findPondSpot = function () { try { if (!DIM.cur && PD.list.length) { const ps = PD.list.filter(p => Math.hypot(p[0] - P.x, p[1] - P.z) < 70); const L = ps.length ? ps : PD.list;
          for (let t = 0; t < 60; t++) { const [px, pz, wl, pr] = L[Math.random() * L.length | 0]; const x = Math.floor(px + (Math.random() - .5) * pr * 1.6), z = Math.floor(pz + (Math.random() - .5) * pr * 1.6);
            if (getB(x, wl - 1, z) === T.WATER && getB(x, wl, z) === T.AIR) { PD.pend = wl; return [x + .5, wl - 0.2, z + .5]; } } } } catch (_) {}
      PD.pend = null; return fp.apply(this, arguments); }; } catch (e) { warn('pond', e); }
  try { const sm = spawnMob; spawnMob = function (kind) { const n0 = mobs.length; const r = sm.apply(this, arguments); try { if (kind === 'duck' && PD.pend != null) { for (let i = n0; i < mobs.length; i++) if (mobs[i].kind === 'duck') mobs[i].wl = PD.pend; if (r && r.kind === 'duck') r.wl = PD.pend; } } catch (_) {} PD.pend = null; return r; }; } catch (e) { warn('spawnMob', e); }
  setInterval(() => { try { if (!started || DIM.cur || !world) return; if (PD.need) { PD.need = false; digPonds(Math.max(0, 6 - PD.list.length)); }
      if (PD.list.length && countKind('duck') < 2 && Math.random() < .5) spawnMob('duck'); } catch (e) { warn('pondtick', e); } }, 9000);

  /* ---------- 9) snow looks like snow ---------- */
  let flakeT = null;
  function flakeTex() { if (flakeT) return flakeT; const c = cv(64), g = c.getContext('2d'); g.fillStyle = rg(g, 32, 32, 0, 30, [[0, 'rgba(255,255,255,1)'], [.35, 'rgba(255,255,255,.9)'], [.7, 'rgba(235,245,255,.35)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2.5; for (let a = 0; a < 3; a++) { g.beginPath(); g.moveTo(32 + Math.cos(a * 1.047) * 22, 32 + Math.sin(a * 1.047) * 22); g.lineTo(32 - Math.cos(a * 1.047) * 22, 32 - Math.sin(a * 1.047) * 22); g.stroke(); }
    flakeT = new THREE.CanvasTexture(c); return flakeT; }
  setInterval(() => { try { scene.traverse(o => { if (!o.isPoints || !o.material || o.material.c121) return; const m = o.material; if (!m.isPointsMaterial) return; const col = m.color ? m.color.getHex() : 0;
      if (Math.abs(m.size - 0.14) < 0.015 && !m.map) { m.map = flakeTex(); m.transparent = true; m.alphaTest = 0.05; m.depthWrite = false; m.size = Math.max(m.size, 0.2); m.sizeAttenuation = true; m.c121 = 1; m.needsUpdate = true; } }); } catch (_) {} }, 3000);

  /* ---------- 10) UI: no pad hint text, bag in categories, jetpack slot ---------- */
  try { const st = document.createElement('style'); st.textContent = '#padHints{display:none!important}.c121cat{grid-column:1/-1;font:bold 12px sans-serif;color:#e8d8a8;opacity:.9;padding:6px 2px 2px;border-bottom:1px solid rgba(232,216,168,.3);margin-bottom:2px;letter-spacing:.06em;text-transform:uppercase}'; document.head.appendChild(st); } catch (_) {}
  const CATN = {struct: 'Building', blocks: 'Blocks', tools: 'Tools & weapons', armour: 'Armour', food: 'Food', decor: 'Decoration', items: 'Items'};
  const CATO = ['blocks', 'tools', 'armour', 'food', 'items', 'struct', 'decor'];
  function catOf(id) { try { if (window.categorise) return window.categorise(id); if (VARI[id]) return VARI[id].kind === 'boat' ? 'items' : 'struct'; if (ARMOUR && ARMOUR[id]) return 'armour'; const c = window.__c120 && __c120.catOf ? __c120.catOf({out: id}) : null; if (c && CATN[c]) return c; } catch (_) {} return PLACEABLE.has(id) ? 'blocks' : 'items'; }
  U.catOf = catOf;
  try { const rb = renderBag; renderBag = function () { const r = rb.apply(this, arguments); try { const g = $('invGrid'); if (!g) return r;if (window.__bagSkip) return r; const items = bagItems(); const btns = [...g.querySelectorAll('button[data-testid^="bag-item-"]')]; if (!btns.length) return r;
        const by = {}; btns.forEach(b => { const i = +b.dataset.testid.slice(9); const id = items[i]; const c = catOf(id); (by[c] || (by[c] = [])).push(b); });
        g.innerHTML = ''; for (const c of CATO) if (by[c]) { const h = document.createElement('div'); h.className = 'c121cat'; h.textContent = CATN[c] + ' (' + by[c].length + ')'; g.appendChild(h); by[c].forEach(b => g.appendChild(b)); }
        try { navRefresh(); } catch (_) {} } catch (e) { warn('bag', e); } return r; }; } catch (e) { warn('bagwrap', e); }
  function jetEl() { let el = document.querySelector('[data-testid="armour-slot-jetpack"]'); if (el) return el; const ch = document.querySelector('[data-testid="armour-slot-chest"]'); if (!ch) return null;
    el = ch.cloneNode(true); el.setAttribute('data-testid', 'armour-slot-jetpack'); ch.parentNode.insertBefore(el, ch.nextSibling); return el; }
  try { const ua = updateArmourSlots; updateArmourSlots = function () { const r = ua.apply(this, arguments); try { const el = jetEl(); if (el) { const id = armour[4];
        el.querySelector('div').innerHTML = '<b>Jetpack</b>' + (id ? NAMES[id] : 'Empty'); const i = el.querySelector('i'); i.setAttribute('style', id ? iconStyle(id) + ';background-size:cover;opacity:1' : ''); i.textContent = id ? '' : '\u2014'; el.onclick = () => unequip(4); }
        const ch = document.querySelector('[data-testid="armour-slot-chest"] div b'); if (ch) ch.textContent = 'Chest armour'; } catch (e) { warn('jetslot', e); } return r; }; } catch (e) { warn('armslots', e); }
  /* ---------- 11) crisp held items: HD hand pass, HD torch, smooth filtering ---------- */
  function torchTexWood(S) { const c = cv(S / 2, S), g = c.getContext('2d'), R = rng(67), w = S / 2; g.fillStyle = lg(g, 0, 0, w, 0, [[0, '#4a3018'], [.5, '#7a5634'], [1, '#4a3018']]); g.fillRect(0, 0, w, S);
    for (let i = 0; i < 40; i++) { g.strokeStyle = R() < .6 ? 'rgba(40,22,8,.45)' : 'rgba(200,160,110,.18)'; g.lineWidth = (1 + R() * 2.5) * S / 512; const x = R() * w, ph = R() * 6; g.beginPath(); for (let s = 0; s <= 30; s++) { const y = S * s / 30, xx = x + Math.sin(ph + s / 4) * w * .03; s ? g.lineTo(xx, y) : g.moveTo(xx, y); } g.stroke(); }
    g.fillStyle = lg(g, 0, 0, 0, S * .35, [[0, 'rgba(10,6,2,.85)'], [1, 'rgba(10,6,2,0)']]); g.fillRect(0, 0, w, S * .35); noise(g, S, R, S * 2, .12, ['#000', '#fff'], .5); return c; }
  function torchTexCloth(S) { const c = cv(S, S / 2), g = c.getContext('2d'), R = rng(68), h = S / 2; g.fillStyle = '#8a7a5a'; g.fillRect(0, 0, S, h);
    for (let i = -4; i < 12; i++) { g.fillStyle = i % 2 ? 'rgba(60,46,28,.45)' : 'rgba(210,190,150,.25)'; g.beginPath(); g.moveTo(i * S / 8, 0); g.lineTo(i * S / 8 + S / 16, 0); g.lineTo(i * S / 8 + S / 16 + h * .6, h); g.lineTo(i * S / 8 + h * .6, h); g.fill(); }
    g.fillStyle = lg(g, 0, 0, 0, h, [[0, 'rgba(20,10,4,.9)'], [.55, 'rgba(30,16,6,.35)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, S, h); noise(g, S, R, S * 3, .2, ['#2a1a0a', '#c8b088'], .6); return c; }
  function torchTexEmber(S) { const c = cv(S, S / 2), g = c.getContext('2d'), R = rng(69), h = S / 2; g.fillStyle = '#1a0a04'; g.fillRect(0, 0, S, h);
    for (let i = 0; i < 60; i++) { const x = R() * S, y = R() * h; g.strokeStyle = R() < .5 ? '#ff7a1a' : '#ffc040'; g.globalAlpha = .4 + R() * .6; g.lineWidth = (1 + R() * 3) * S / 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * S * .12, y + (R() - .5) * h * .3); g.stroke(); }
    g.globalAlpha = 1; for (let i = 0; i < 30; i++) { g.fillStyle = rg(g, 0, 0, 0, 1, [[0, '#fff0a0'], [1, '#ff5a10']]); g.fillStyle = R() < .5 ? '#ffd060' : '#ff8a2a'; g.beginPath(); g.arc(R() * S, R() * h, (1 + R() * 3) * S / 256, 0, 7); g.fill(); } return c; }
  function flameTex(S, core) { const c = cv(S), g = c.getContext('2d'); g.save(); g.translate(S / 2, S * .92);
    const L = core ? [[0, 'rgba(255,255,240,1)'], [.4, 'rgba(255,240,160,.95)'], [1, 'rgba(255,200,80,0)']] : [[0, 'rgba(255,230,140,1)'], [.35, 'rgba(255,150,40,.9)'], [.7, 'rgba(230,70,10,.45)'], [1, 'rgba(160,20,0,0)']];
    g.fillStyle = rg(g, 0, -S * .22, 0, S * .52, L, 0, -S * .3); g.beginPath(); g.moveTo(0, -S * .86); g.bezierCurveTo(S * .1, -S * .55, S * .32, -S * .35, S * .3, -S * .16); g.bezierCurveTo(S * .28, S * .02, S * .1, S * .06, 0, S * .06); g.bezierCurveTo(-S * .1, S * .06, -S * .28, S * .02, -S * .3, -S * .16); g.bezierCurveTo(-S * .32, -S * .35, -S * .1, -S * .55, 0, -S * .86); g.fill(); g.restore();
    const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; return t; }
  function glowTex(S) { const c = cv(S), g = c.getContext('2d'); g.fillStyle = rg(g, S / 2, S / 2, 0, S / 2, [[0, 'rgba(255,200,110,.9)'], [.3, 'rgba(255,150,60,.35)'], [1, 'rgba(255,120,30,0)']]); g.fillRect(0, 0, S, S); return new THREE.CanvasTexture(c); }
  let TM = null;
  function torchHD() { const S = PHN ? 256 : 512, seg = PHN ? 14 : 22;
    if (!TM) { const wt = mkTex(torchTexWood(S)), ct = mkTex(torchTexCloth(S)), et = mkTex(torchTexEmber(S));
      TM = {wood: new THREE.MeshPhongMaterial({map: wt, shininess: 8, specular: 0x221a10}), cloth: new THREE.MeshPhongMaterial({map: ct, shininess: 2, specular: 0x000000}),
        iron: new THREE.MeshPhongMaterial({color: 0x3a3836, shininess: 110, specular: 0xb0aaa0}), ember: new THREE.MeshPhongMaterial({map: et, color: 0xffffff, emissive: 0xff6a20, emissiveMap: et, emissiveIntensity: 1.1, shininess: 10}),
        flameT: flameTex(S / 2), coreT: flameTex(S / 4, 1), glowT: glowTex(S / 4)}; }
    const M = TM, g = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.033, 0.52, seg), M.wood); shaft.position.y = 0.26; g.add(shaft);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.033, seg, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.wood); cap.position.y = 0; g.add(cap);
    for (const by of [0.3, 0.41]) { const band = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.032, seg), M.iron); band.position.y = by; g.add(band);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.006, 6, seg), M.iron); rim.rotation.x = Math.PI / 2; rim.position.y = by + .016; g.add(rim); }
    const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.055, 0.12, seg), M.cloth); wrap.position.y = 0.5; g.add(wrap);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.064, 0.09, seg), M.ember); head.position.y = 0.6; g.add(head);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.07, seg, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.ember); dome.position.y = 0.645; g.add(dome);
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({map: M.flameT, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true})); flame.scale.set(0.34, 0.5, 1); flame.position.y = 0.82; g.add(flame);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({map: M.coreT, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .9})); core.scale.set(0.5, 0.55, 1); core.position.y = -0.08; flame.add(core);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({map: M.glowT, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6})); glow.scale.set(0.75, 0.75, 1); glow.position.y = 0.68; g.add(glow);
    return {g, flame, glow, head}; }
  U.torchHD = torchHD;
  try { const mt = makeTorchModel; makeTorchModel = function () { try { return torchHD(); } catch (e) { warn('torch', e); return mt.apply(this, arguments); } }; } catch (e) { warn('torchwrap', e); }
  // held models
  const MAXA = (() => { try { return renderer.capabilities.getMaxAnisotropy(); } catch (_) { return 4; } })();
  function smoothMaps(root) { root.traverse(c => { if (!c.isMesh && !c.isSprite) return; [].concat(c.material || []).forEach(m => { const t = m && m.map; if (!t || t.c121s) return; t.c121s = 1;
      if (t.magFilter === THREE.NearestFilter || t.minFilter === THREE.NearestFilter || t.minFilter === THREE.NearestMipmapNearestFilter) { t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; }
      t.anisotropy = Math.max(t.anisotropy || 1, Math.min(8, MAXA)); t.needsUpdate = true; }); }); }
  try { const mi = makeItemMesh; makeItemMesh = function (id) { const I = VARI[id];
      if (I) { const sv = ICONS[I.base], si = ICONS[I.base] === undefined; ICONS[I.base] = ICONS[id]; let m; try { m = mi.call(this, I.base); } finally { if (si) delete ICONS[I.base]; else ICONS[I.base] = sv; }
        try { if (I.kind === 'stairs' || I.kind === 'slab' || I.kind === 'fence' || I.kind === 'gate') { const pm = plMat(I.w); m.traverse(c => { if (c.isMesh && c.material && !Array.isArray(c.material) && c.material.map && !c.material.transparent) c.material = Array.isArray(pm) ? pm[0] : pm; else if (c.isMesh && Array.isArray(c.material)) c.material = c.material.map(() => Array.isArray(pm) ? pm[0] : pm); }); }
          if (I.kind === 'boat') m.traverse(c => { if (c.isMesh && (c.material === boatMat || c.material === boatMat2)) { tintBoat({g: m, wood: I.w}); } }); } catch (_) {}
        return m; }
      const m = mi.apply(this, arguments);
      try { if (id === (IT.MUSKET || 213)) hdRifle(m);
        if (id === 43) m.scale.multiplyScalar(0.72);
        if (id === 217) { m.scale.set(m.scale.x * 0.7, m.scale.y * 1.08, m.scale.z * 0.7); m.traverse(c => { if (!c.isMesh || !c.material || Array.isArray(c.material)) return; const o = c.material; const hsl = o.color ? o.color.getHSL({}) : {l: 0}; if (hsl.l < .45) return;
            const n = new THREE.MeshPhongMaterial({map: o.map || null, color: o.color ? o.color.clone().lerp(new THREE.Color(0xffffff), .35) : 0xffffff, shininess: 250, specular: 0xffffff, emissive: 0x1a1c20}); c.material = n; }); }
        smoothMaps(m); } catch (e) { warn('heldfx', e); }
      return m; }; } catch (e) { warn('itemmesh', e); }
  // second, sharp render pass just for what is in your hands (the phone renders the world at a low resolution with no anti-aliasing)
  const HO = U.hand = {on: false, r: null, c: null, f: -1, lights: [], lk: '', err: null, top: 0.36};
  function wantHD() { try { if (window.__handHD === 0) return false; if (window.__handHD) return true; const pr = renderer.getPixelRatio(), aa = renderer.getContextAttributes && renderer.getContextAttributes().antialias;
      return !!(PHN || (typeof PERF !== 'undefined' && PERF) || !aa || pr < Math.min(DPR, 2) * 0.9); } catch (_) { return false; } }
  function handSetup() { if (HO.r || HO.err) return !!HO.r; try { const main = renderer.domElement, c = document.createElement('canvas'); c.id = 'c121hand'; c.dataset.testid = 'hand-hd';
      const zi = getComputedStyle(main).zIndex; Object.assign(c.style, {position: 'fixed', pointerEvents: 'none', left: '0px', top: '0px', zIndex: zi && zi !== 'auto' ? zi : '0'});
      main.parentNode.insertBefore(c, main.nextSibling);
      const r = new THREE.WebGLRenderer({canvas: c, alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: !!window.__handKeep}); r.setClearColor(0x000000, 0);
      r.outputEncoding = renderer.outputEncoding; r.toneMapping = renderer.toneMapping; r.toneMappingExposure = renderer.toneMappingExposure; try { r.physicallyCorrectLights = renderer.physicallyCorrectLights; } catch (_) {} r.shadowMap.enabled = false;
      HO.r = r; HO.c = c; return true; } catch (e) { HO.err = String(e && e.message || e); return false; } }
  let rcC = null, rcT = 0; function sizeHand() { const main = renderer.domElement, now9 = performance.now(); if (!rcC || now9 - rcT > 500) { rcC = main.getBoundingClientRect(); rcT = now9; } const rc = rcC,   /* v1.1.38: the canvas size is read twice a second, not every frame (it forced a page layout each frame) */ pr = PHN ? Math.min(DPR, 1.5) : Math.min(DPR, 2), top = HO.top;
    const w = Math.round(rc.width), h = Math.round(rc.height * (1 - top)), k = w + 'x' + h + '@' + pr + ':' + rc.left + ',' + rc.top;
    if (HO.sk !== k) { HO.sk = k; HO.r.setPixelRatio(pr); HO.r.setSize(w, h, false); Object.assign(HO.c.style, {left: rc.left + 'px', top: (rc.top + rc.height * top) + 'px', width: w + 'px', height: h + 'px'}); }
    return [rc.width, rc.height]; }
  const tmpV = new THREE.Vector3();
  function lightProxies() { const now = performance.now(); if (!HO.src || now - HO.srcT > 1000) { HO.srcT = now; const L = []; scene.traverse(o => { if (o.isLight && !isUnderCam(o)) L.push(o); }); HO.src = L; } const src = HO.src; const key = src.map(l => l.type).join(',');
    if (key !== HO.lk) { HO.lights.forEach(p => { camera.remove(p.p); if (p.p.target) camera.remove(p.p.target); }); HO.lights = []; HO.lk = key;
      for (const l of src) { let p; if (l.isAmbientLight) p = new THREE.AmbientLight(); else if (l.isHemisphereLight) p = new THREE.HemisphereLight(); else if (l.isDirectionalLight) p = new THREE.DirectionalLight(); else if (l.isSpotLight) p = new THREE.SpotLight(); else if (l.isPointLight) p = new THREE.PointLight(); else continue;
        p.layers.set(1); camera.add(p); if (p.target) { camera.add(p.target); p.target.layers.set(1); } HO.lights.push({p, l}); } }
    for (const {p, l} of HO.lights) { p.color.copy(l.color); p.intensity = l.visible && l.parent ? l.intensity : 0; if (l.groundColor) p.groundColor.copy(l.groundColor);
      if (l.distance !== undefined) { p.distance = l.distance; p.decay = l.decay; } if (l.angle !== undefined) { p.angle = l.angle; p.penumbra = l.penumbra; }
      if (!l.isAmbientLight) { l.getWorldPosition(tmpV); p.position.copy(camera.worldToLocal(tmpV)); if (l.target && p.target) { l.target.getWorldPosition(tmpV); p.target.position.copy(camera.worldToLocal(tmpV)); } } } }
  function isUnderCam(o) { for (let q = o; q; q = q.parent) if (q === camera) return true; return false; }
  function tagHand() { let any = false; const tg = new Set(); for (const ch of camera.children) if (ch.isLight && ch.target) tg.add(ch.target);
    for (const ch of camera.children) { if (HO.lights.some(p => p.p === ch || p.p.target === ch)) continue;
      if (ch.isLight || tg.has(ch)) { ch.layers.mask = 3; continue; }
      ch.traverse(o => { o.layers.mask = 2; }); if (ch.visible) any = true; } return any; }
  U.tagHand = tagHand;
  let rWrapped = false;
  function wrapRender() { if (rWrapped) return; rWrapped = true; const orr = renderer.render.bind(renderer);
    renderer.render = function (sc, cam) {
      if (sc !== scene || cam !== camera || !HO.on) return orr(sc, cam);
      let vis = false; try { vis = tagHand(); } catch (_) {}
      const m0 = camera.layers.mask; camera.layers.mask = 1; try { orr(sc, cam); } finally { camera.layers.mask = m0; }
      try { const f = renderer.info && renderer.info.render ? renderer.info.render.frame : performance.now(); if (f === HO.f) return; HO.f = f;
        if (!vis || (typeof thirdPerson !== 'undefined' && thirdPerson)) { if (HO.c.style.visibility !== 'hidden') { HO.r.clear(); HO.c.style.visibility = 'hidden'; } return; }
        HO.c.style.visibility = 'visible'; const [w, h] = sizeHand(); lightProxies();
        camera.layers.mask = 2; camera.setViewOffset(w, h, 0, h * HO.top, w, h * (1 - HO.top)); const hz = (window.__mapHide || []).filter(o => o && o.visible); hz.forEach(o => { o.visible = false; }); try { HO.r.render(camera, camera); } finally { hz.forEach(o => { o.visible = true; }); } } catch (e) { HO.err = String(e && e.stack || e); HO.on = false; try { HO.c.style.display = 'none'; } catch (_) {} restoreHand(); }
      finally { camera.layers.mask = m0; try { camera.clearViewOffset(); } catch (_) {} } }; }
  function restoreHand() { try { for (const ch of camera.children) ch.traverse(o => { o.layers.mask = 1; }); HO.lights.forEach(p => { p.p.intensity = 0; }); } catch (_) {} }
  U.handOn = v => { HO.on = !!v && handSetup(); if (HO.on) wrapRender(); else { restoreHand(); try { HO.c && (HO.c.style.visibility = 'hidden'); } catch (_) {} } return HO.on; };
  setInterval(() => { try { const w = wantHD(); if (w !== HO.on && !HO.err) U.handOn(w); if (HO.on) smoothMaps(hand); } catch (_) {} }, 1000);
  /* ---------- 12) one useItem hook: wood variants, boat pickup, hive honey ---------- */
  try { const ui0 = useItem; useItem = function () { const a = arguments, self = this;
      if (VARI[selId] && (MODE.infinite || cnt(selId) > 0) && !menuOpen && !paused && !dead) return placeVariant.call(self, a, ui0);
      return boatPickupWrap.call(self, a, {apply: (t, args) => hiveWrap.call(self, args, ui0)}); }; } catch (e) { warn('useItem', e); }

  /* ---------- 13) old saves: convert once, never crash ---------- */
  function migrate(d) { const st = {cells: 0, ponds: 0};
    const map = {234: LZORE, 237: LZBLK, 229: 228, 220: T.BRICK, 254: T.WATER}; const wc = [];
    const N = world.length, wd = W, dd = D, hh = H;
    for (let i = 0; i < N; i++) { const v = world[i]; if (v < 220) continue; const to = map[v]; if (to === undefined) continue; world[i] = to; st.cells++;
      if (v === 254) { const z = i % dd, t = (i - z) / dd, y = t % hh, x = (t - y) / hh; wc.push([x, y, z]); } }
    convList(ONCE, true); convList(CONV, true);
    try { while (armour.length < 5) armour.push(0); if (armour[1] === 291) { if (!armour[4]) armour[4] = 291; armour[1] = 0; } } catch (_) {}
    if (!DIM.cur) { PD.list = clusterCells(wc); st.ponds = PD.list.length; PD.need = PD.list.length < 6;
      try { const c = window.__c118; if (c) { c.needAdd = true; c.wref = null; } } catch (_) {} }
    if (st.cells) { try { for (let cx = 0; cx < W; cx += 16) for (let cz = 0; cz < D; cz += 16) markDirty(cx, cz); } catch (_) {} }
    U.migrated = st; return st; }
  U.migrate = migrate;
  try { const as = applySave; applySave = function (d) { const old = !!d && !d.c121; const r = as.apply(this, arguments);
      try { WK.clear(); for (const [k, m] of entMeta) if (m && m.wood) WK.add(k); } catch (_) {}
      try { if (old) migrate(d); else if (d && !DIM.cur) { PD.list = ((d.c121 && d.c121.ponds) || []).map(p => p.slice()); PD.need = !PD.list.length; } } catch (e) { warn('migrate', e); }
      try { const bw = d && d.c121boats; if (bw) bw.forEach((w, i) => { if (w && boats[i]) { boats[i].wood = w; tintBoat(boats[i]); } }); } catch (_) {}
      try { if (d && Array.isArray(d.armour) && d.armour.length < 5) { while (armour.length < 5) armour.push(0); } } catch (_) {}
      return r; }; } catch (e) { warn('applySave', e); }
  try { const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { d.c121 = {v: 1, ponds: PD.list.map(p => p.slice())}; d.c121boats = boats.map(b => b.wood || 0); } catch (_) {} return d; }; } catch (e) { warn('serialize', e); }
  try { const gen = generate; generate = function () { const r = gen.apply(this, arguments); try { if (!DIM.cur) { PD.list = []; PD.need = true; } WK.clear(); } catch (_) {} return r; }; } catch (e) { warn('generate', e); }
  // dig ponds soon after a world opens (not at the exact load moment)
  setInterval(() => { try { if (started && PD.need && !DIM.cur && world && PD.wref !== world) { PD.wref = world; PD.need = false; const m = digPonds(Math.max(0, 6 - PD.list.length)); U.dug = m.length;
        if (PD.list.length) for (let i = 0; i < 2; i++) if (countKind('duck') < 2) spawnMob('duck'); } } catch (e) { warn('dig', e); } }, 1500);

  /* ---------- 14) start + keep things in place (other parts set things on timers too) ---------- */
  const REN = {}; ['30', '86', '50', '74', '264', '265', '266', '267', '268', '269', '270', '271', '272', '92', '93', '95', '102', '108', '109', '110', '111', '225', '145', '65', '162', '226', '173'].forEach(k => REN[k] = NAMES[k]);
  function recipesDirty() { return RECIPES.some(r => HIDE.has(r.out) || r.out === 80 || r.need.some(q => q[0] === 80 || q[0] === 54 || q[0] === 177 || q[0] === 178)) || !RECIPES.some(r => r.out === 650 + 1); }
  function keep() { try { Object.assign(NAMES, REN); FACES[50] = FACES[SORE]; BLOCK_MATS[50] = BLOCK_MATS[SORE]; T.COBALTORE = LZORE;
      for (const id in ICO) if (ICONS[id] !== ICO[id]) { ICONS[id] = ICO[id]; delete ICON_KEY[id]; }
      U.swapAll(); hideCreative(); paintFences();
      if (recipesDirty()) { fixRecipes(); woodRecipes(); try { buildCraftList(); } catch (_) {} }
      try { if (window.__c120ICO && ICO[IT.BREW || 121]) __c120ICO[IT.BREW || 121] = ICO[IT.BREW || 121]; } catch (_) {}
      if (HO.on) smoothMaps(hand); } catch (e) { warn('keep', e); } }
  U.keep = keep;
  try { hideCreative(); fixRecipes(); woodRecipes(); } catch (e) { warn('recipes', e); }
  try { hdBlocks(); } catch (e) { warn('hd', e); } try { hdTV(); } catch (e) { warn('tv', e); }
  try { buildCraftList(); } catch (_) {}
  let iconsDone = false;
  function icons() { if (iconsDone) return; const pi = texImg['planks']; if (!pi || (pi.complete === false) || !(pi.width > 1)) return; iconsDone = true; try { itemIcons(); woodIcons(); } catch (e) { warn('icons', e); } try { renderHotbar(); } catch (_) {} }
  let kt = 0; const ki = setInterval(() => { kt++; icons(); keep(); if (kt > 120) { clearInterval(ki); setInterval(() => { icons(); keep(); }, 10000); } }, 1000);
  setTimeout(icons, 300);
  U.ready = 1;
})();
