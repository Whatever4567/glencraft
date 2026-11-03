
/* ===================== GLX-C29 (v0.9.29): hi-res cohesive textures for the newer blocks, missing icons, modern hold-to-mine, new castles via Reset Terrain ===================== */
(function hiResPass() {
  const N = 256;
  const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  // tileable value noise + fbm, so every texture wraps seamlessly
  const vn = (x, y, p, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), m = q => ((q % p) + p) % p;
    const a = hash(m(xi), m(yi), s), b = hash(m(xi + 1), m(yi), s), c = hash(m(xi), m(yi + 1), s), d = hash(m(xi + 1), m(yi + 1), s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const fbm = (x, y, s, o = 5, f0 = 4) => { let t = 0, a = 0.5, f = f0, n = 0; for (let i = 0; i < o; i++) { t += vn(x * f / N, y * f / N, f, s + i * 17) * a; n += a; a *= 0.5; f *= 2; } return t / n; };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const ramp = cols => { const c = cols.map(hex); return t => { t = Math.max(0, Math.min(0.9999, t)) * (c.length - 1); const i = t | 0, f = t - i; return [0, 1, 2].map(k => c[i][k] + (c[i + 1][k] - c[i][k]) * f); }; };
  const mk = (fn) => { const cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d'); fn(g, cv); return cv; };
  const pix = (g, f) => { const im = g.getImageData(0, 0, N, N), d = im.data; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = f(x, y), i = (y * N + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3] === undefined ? 255 : c[3]; } g.putImageData(im, 0, 0); };
  // shared "Glencraft" lighting: soft bevel on each tile edge so every block reads as a chunky hand-cut block
  const bevel = (g, k = 0.18) => { const gr = (x0, y0, x1, y1, c) => { const l = g.createLinearGradient(x0, y0, x1, y1); l.addColorStop(0, c); l.addColorStop(1, 'rgba(0,0,0,0)'); return l; };
    g.fillStyle = gr(0, 0, 0, 14, `rgba(255,255,255,${k})`); g.fillRect(0, 0, N, 14); g.fillStyle = gr(0, 0, 14, 0, `rgba(255,255,255,${k * .7})`); g.fillRect(0, 0, 14, N);
    g.fillStyle = gr(0, N, 0, N - 14, `rgba(0,0,0,${k * 1.4})`); g.fillRect(0, N - 14, N, 14); g.fillStyle = gr(N, 0, N - 14, 0, `rgba(0,0,0,${k})`); g.fillRect(N - 14, 0, 14, N); };
  const rock = (cols, s, crack = 0.5) => (x, y) => { const n = fbm(x, y, s), r = fbm(x + 99, y, s + 5, 3, 8), cr = Math.abs(fbm(x, y + 50, s + 9, 3, 3) - 0.5) < 0.012 * crack ? 0.55 : 1; const c = ramp(cols)(n * 0.85 + r * 0.25 - 0.05); return c.map(v => v * cr); };
  const ore = (cols, gem, s) => g => { pix(g, rock(cols, s)); let sd = s; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 9; i++) { const cx = rnd() * N, cy = rnd() * N; for (let j = 0; j < 6; j++) { const x = cx + (rnd() - .5) * 46, y = cy + (rnd() - .5) * 46, r = 5 + rnd() * 9; for (const [ox, oy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) {
      g.fillStyle = gem[2]; g.beginPath(); g.moveTo(x + ox, y + oy - r - 2); g.lineTo(x + ox + r * .8 + 2, y + oy); g.lineTo(x + ox, y + oy + r + 2); g.lineTo(x + ox - r * .8 - 2, y + oy); g.fill();
      g.fillStyle = gem[0]; g.beginPath(); g.moveTo(x + ox, y + oy - r); g.lineTo(x + ox + r * .8, y + oy); g.lineTo(x + ox, y + oy + r); g.lineTo(x + ox - r * .8, y + oy); g.fill();
      g.fillStyle = gem[1]; g.beginPath(); g.moveTo(x + ox, y + oy - r); g.lineTo(x + ox + r * .8, y + oy); g.lineTo(x + ox, y + oy); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x + ox - 2, y + oy - r * .5, 3, 3); } } } bevel(g, .12); };
  const bricks = (cols, mortar, s, rows = 4, cols2 = 2) => g => { const bh = N / rows, bw = N / cols2; pix(g, (x, y) => { const row = Math.floor(y / bh), off = row % 2 ? bw / 2 : 0, bx = Math.floor(((x + off) % N) / bw), lx = (x + off) % bw, ly = y % bh;
    const m = lx < 5 || ly < 5; if (m) { const t = fbm(x, y, s + 3, 3, 16); return hex(mortar).map(v => v * (0.85 + t * 0.3)); }
    const t = fbm(x, y, s) * 0.7 + hash(bx + row * 7, row, s) * 0.45, e = Math.min(lx - 5, ly - 5, bw - lx, bh - ly); const c = ramp(cols)(t); const sh = e < 6 ? 0.82 + e * 0.03 : 1; return c.map(v => v * sh * (ly < 10 ? 1.08 : 1)); }); };
  const weave = (cols, s, border) => g => { pix(g, (x, y) => { const w = ((x >> 2) + (y >> 2)) % 2 ? 1.06 : 0.94, n = fbm(x, y, s, 4, 8); let c = ramp(cols)(n); if (border) { const d = Math.min(x, y, N - 1 - x, N - 1 - y); if (d > 12 && d < 22) c = hex(border).map(v => v * (0.8 + n * 0.4)); } return c.map(v => v * w); }); };
  const T29 = {
    gravel: g => { pix(g, rock(['#5a5650', '#7c766e', '#9a948a'], 11, 0)); let sd = 77; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 170; i++) { const x = rnd() * N, y = rnd() * N, rx = 6 + rnd() * 12, ry = 5 + rnd() * 9, a = rnd() * 3, l = 90 + rnd() * 90 | 0, tint = rnd() < .3 ? [12, 0, -10] : [0, 0, 0];
        g.fillStyle = 'rgba(30,26,22,.55)'; g.beginPath(); g.ellipse(x + 2, y + 3, rx, ry, a, 0, 7); g.fill(); const gr = g.createRadialGradient(x - rx * .3, y - ry * .4, 1, x, y, rx); gr.addColorStop(0, `rgb(${l + 50 + tint[0]},${l + 46},${l + 40 + tint[2]})`); gr.addColorStop(1, `rgb(${l - 20 + tint[0]},${l - 24},${l - 28 + tint[2]})`); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, 7); g.fill(); } bevel(g, .1); },
    hellrock: g => { pix(g, rock(['#3a0c0c', '#6e1a16', '#8e2a20', '#5a1210'], 21, 1.6)); bevel(g, .1); },
    soulsand: g => { pix(g, (x, y) => { const n = fbm(x, y, 31, 5, 8), f = fbm(x, y, 37, 2, 4); const c = ramp(['#2e2016', '#4e3624', '#6a4c34'])(n); const face = f < 0.32 ? 0.6 : 1; return c.map(v => v * face); }); bevel(g, .08); },
    magma: g => { pix(g, (x, y) => { const n = fbm(x, y, 41, 4, 4), e = Math.abs(fbm(x, y, 43, 3, 6) - 0.5); if (e < 0.05) { const h = 1 - e / 0.05; return ramp(['#a02008', '#ff7a10', '#ffe070'])(h); } return ramp(['#1e0a06', '#3e1408', '#5a200c'])(n); }); },
    glowrock: g => { pix(g, (x, y) => { const n = fbm(x, y, 51, 5, 6), b = fbm(x, y, 53, 3, 10); return b > 0.55 ? ramp(['#c08a2a', '#ffd870', '#fff6c8'])((b - 0.55) * 3) : ramp(['#6a4a1e', '#9a6e2c', '#c08a3a'])(n); }); },
    hellbrick: bricks(['#2a0a0e', '#4a1218', '#62202a'], '#140406', 61, 4, 2),
    hbedrock: g => { pix(g, (x, y) => { const n = fbm(x, y, 71, 5, 6), q = hash(x >> 4, y >> 4, 71) > 0.6 ? 0.6 : 1; return ramp(['#151515', '#3a3a3a', '#6a6a6a', '#2a2a2a'])(n).map(v => v * q); }); bevel(g, .1); },
    obsidian: g => { pix(g, (x, y) => { const n = fbm(x, y, 81, 5, 5), s2 = fbm(x, y, 83, 3, 12); const c = ramp(['#07050d', '#1a1230', '#2e1f52', '#120c22'])(n); return s2 > 0.72 ? c.map((v, i) => v + [70, 50, 110][i] * (s2 - 0.72) * 3) : c; }); bevel(g, .14); },
    cairngorm_ore: ore(['#6a6a6c', '#8e8e90', '#a8a8aa'], ['#9a6a34', '#d8a058', '#3e2410'], 91),
    silver_ore: ore(['#6a6a6c', '#8e8e90', '#a8a8aa'], ['#c8d0da', '#ffffff', '#5a6270'], 97),
    peatbrick: bricks(['#2a1a10', '#4a3020', '#5e3e26'], '#1a120a', 101, 4, 2),
    rcarpet: weave(['#5a0a0e', '#8e1418', '#b4262a'], 111, '#d4a43a'),
    tapestry: g => { pix(g, (x, y) => { const n = fbm(x, y, 121, 3, 8), w = ((x >> 2) + (y >> 2)) % 2 ? 1.05 : 0.95; const tx = (x % 64), ty = (y % 64); let c = hex('#1e3a6e'); if (tx < 18 || ty < 18) c = hex('#1e5a3a'); if (tx < 18 && ty < 18) c = hex('#123020'); if (tx === 40 || ty === 40 || tx === 41 || ty === 41) c = hex('#c82a2a'); if (tx === 9 || ty === 9) c = hex('#e8d070'); return c.map(v => v * w * (0.8 + n * 0.4)); });
      g.strokeStyle = '#d4a43a'; g.lineWidth = 6; g.strokeRect(6, 6, N - 12, N - 12); },
    bookshelf: g => { pix(g, (x, y) => { const n = fbm(x * 0.25, y * 3, 131, 4, 4); return ramp(['#4a2e14', '#6e4a24', '#8a6232'])(n); }); let sd = 9; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      const shelf = [16, 128, 240]; g.fillStyle = '#2e1c0c'; for (const y of shelf) g.fillRect(0, y - 8, N, 16); g.fillRect(0, 0, 10, N); g.fillRect(N - 10, 0, 10, N);
      const cols = ['#7a1a1a', '#1a3a6a', '#2a5a2a', '#6a4a1a', '#4a1a4a', '#8a6a2a', '#2a2a2a', '#a03a1a'];
      for (const [y0, y1] of [[24, 120], [136, 232]]) { let x = 12; while (x < N - 14) { const w = 10 + rnd() * 12 | 0, h = (y1 - y0) * (0.72 + rnd() * 0.28) | 0, c = cols[rnd() * cols.length | 0]; if (x + w > N - 12) break;
        const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(0,0,0,.35)'); gr.addColorStop(0.35, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = c; g.fillRect(x, y1 - h, w, h); g.fillStyle = gr; g.fillRect(x, y1 - h, w, h);
        g.fillStyle = 'rgba(230,200,110,.8)'; g.fillRect(x + 2, y1 - h + 10, w - 4, 3); g.fillRect(x + 2, y1 - 14, w - 4, 3); x += w + (rnd() < .15 ? 6 : 1); } } bevel(g, .1); },
    qlantern: g => { g.fillStyle = '#2a2a2e'; g.fillRect(0, 0, N, N); const gr = g.createRadialGradient(N / 2, N / 2, 8, N / 2, N / 2, N * .45); gr.addColorStop(0, '#fffbe8'); gr.addColorStop(0.4, '#ffd88a'); gr.addColorStop(1, '#c0782a'); g.fillStyle = gr; g.fillRect(28, 28, N - 56, N - 56);
      g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(N / 2, N / 2); g.lineTo(N / 2 + Math.cos(i) * 90, N / 2 + Math.sin(i * 1.7) * 90); g.lineTo(N / 2 + Math.cos(i + .3) * 70, N / 2 + Math.sin(i * 1.7 + .3) * 70); g.fill(); }
      g.strokeStyle = '#1a1a1e'; g.lineWidth = 14; g.strokeRect(21, 21, N - 42, N - 42); g.lineWidth = 8; g.beginPath(); g.moveTo(N / 2, 21); g.lineTo(N / 2, N - 21); g.moveTo(21, N / 2); g.lineTo(N - 21, N / 2); g.stroke(); g.fillStyle = '#4a4a52'; for (const [x, y] of [[21, 21], [N - 21, 21], [21, N - 21], [N - 21, N - 21]]) { g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); } },
  };
  const css = [];
  for (const k in T29) { try {
    const c = mk(T29[k]); const url = c.toDataURL('image/png'); TEX[k] = url; texImg[k] = c;
    const s = document.createElement('canvas'); s.width = s.height = 1; const sg = s.getContext('2d'); sg.drawImage(c, 0, 0, 1, 1); const d = sg.getImageData(0, 0, 1, 1).data; AVG[k] = (d[0] << 16) | (d[1] << 8) | d[2];
    const t = texCache[k]; if (t) { t.image = c; t.needsUpdate = true; }
    css.push('.ic-' + k + '{background-image:url(' + url + ') !important}');
  } catch (e) { console.warn('tex29', k, e); } }
  // magma and glowrock glow a little in the dark
  for (const id of [208, 209]) { const m = BLOCK_MATS[id]; if (m && m.emissive) { m.emissive.setHex(id === 208 ? 0xff5010 : 0xffc860); m.emissiveMap = m.map; m.emissiveIntensity = 0.55; m.needsUpdate = true; } }
  const st = document.createElement('style'); st.textContent = css.join('\n'); document.head.appendChild(st);
  // ---- missing icons: tall grass, crops, door top, fire ----
  ICON_KEY[15] = ICON_KEY[15] || 'tall_grass';
  for (const id of [20, 21, 22, 23]) ICON_KEY[id] = 'wheat_crop';
  for (const id of [24, 25, 26, 27]) ICON_KEY[id] = 'potato_crop';
  for (const id of [56, 57, 58, 59]) ICON_KEY[id] = 'neep_crop';
  if (!ICON_KEY[66]) ICON_KEY[66] = ICON_KEY[T.DOOR] || 'door';
  ICONS[204] = drawIcon(g => { for (const [c, s] of [['#c02808', 1], ['#ff7a10', .78], ['#ffd040', .52], ['#fff6c0', .26]]) { g.fillStyle = c; g.beginPath(); g.moveTo(-22 * s, 26); g.quadraticCurveTo(-30 * s, -4, -6 * s, -30 * s - 2); g.quadraticCurveTo(-4 * s, -10, 6 * s, -16 * s); g.quadraticCurveTo(10 * s, -30 * s, 14 * s, -36 * s); g.quadraticCurveTo(34 * s, -4, 22 * s, 26); g.closePath(); g.fill(); } });
})();

// ---- modern hold-to-mine: RT / left mouse / break button keep breaking; a short 0.3 s gap between blocks (like Minecraft's 6-tick delay) so creative can't tunnel by accident ----
(function holdMine() {
  let gap = 0, lastKey = null;
  const ob = breakAt;
  breakAt = function (x, y, z) { const r = ob.apply(this, arguments); gap = 0.3; lastKey = x + ',' + y + ',' + z; return r; };
  const ui = updateInteraction;
  updateInteraction = function (dt) {
    const attacking = attackMouse || attackPad || attackTouch;
    if (!attacking) { gap = 0; return ui.call(this, dt); }
    if (gap > 0) { gap -= dt; if (gap > 0) { const r = raycast(5), rs = raycast(5, true); if (r && !reachMob(Math.min(3.4, rs ? rs.t : 3.4))) { mine.t = 0; return; } } }
    return ui.call(this, dt);
  };
})();

// ---- new castles for existing worlds: Reset Terrain switches the world to the v0.9.28 castle layout ----
(function newCastlesOnReset() {
  if (typeof cityBackMigrate !== 'function') return;
  const cb = cityBackMigrate;
  cityBackMigrate = function () { if (current) current.newCastles = true; return cb.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); if (d && current && current.newCastles) d.newCastles = true; return d; };
  const ap = applySave; applySave = function (d) { if (d && d.newCastles && current) current.newCastles = true; return ap.apply(this, arguments); };
})();
