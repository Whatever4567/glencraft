/* ===================== GLX-C122 (v1.0.3): textures update - HD painted icons + 3D card drops/held items, sharper block textures, new HUD, real-world menu backgrounds, ALPHA tag, 3D spinner, logo, one categorise() rule ===================== */
(function c122() {
  const U = window.__c122 = {log: [], errs: [], painted: 0, finished: 0, iso: 0};
  const warn = (w, e) => { try { U.errs.push(w + ': ' + String(e && e.message || e)); console.warn('c122 ' + w, e); } catch (_) {} };
  const PHN = !!touchMode, IS = PHN ? 256 : 512;   // painted icon size
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };
  const rng = s => { s = (s | 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; };
  const lg = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
  const rg = (g, x, y, r0, r1, st, x1, y1) => { const q = g.createRadialGradient(x, y, r0, x1 === undefined ? x : x1, y1 === undefined ? y : y1, r1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
  const shade = (h, k) => { const n = parseInt(h.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };
  const nm = id => String(NAMES[id] || '').toLowerCase();
  const ICO = (window.__c121 && __c121.ICO) || {};
  const setIcon = (id, url) => { try { if (window.__c121 && __c121.setIcon) __c121.setIcon(id, url); else { ICONS[id] = url; delete ICON_KEY[id]; } ICO[id] = url; if (window.__c120ICO) __c120ICO[id] = url; delete spriteMats[id]; } catch (e) { warn('setIcon', e); } };
  U.setIcon = setIcon;
  /* paint in a 100x100 space */
  const paint = (fn, S) => { S = S || IS; const c = cv(S), g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.scale(S / 100, S / 100); g.lineJoin = 'round'; g.lineCap = 'round'; fn(g); return c; };
  const path = (g, pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
  /* finishing pass shared by every icon: soft drop shadow, dark rim, light from the top left */
  function finish(src, S) { S = S || IS; const c = cv(S), g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    const k = S / 100, m = 4 * k, w = S - 2 * m;
    const b = cv(S), bg = b.getContext('2d'); bg.imageSmoothingQuality = 'high'; bg.drawImage(src, m, m, w, w);
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 3.2 * k; g.shadowOffsetY = 2.2 * k; g.drawImage(b, 0, 0); g.restore();
    g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 0.9 * k; g.drawImage(b, 0, 0); g.restore();
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = lg(g, 0, 0, S, S, [[0, 'rgba(255,255,255,.16)'], [.45, 'rgba(255,255,255,0)'], [.7, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.2)']]); g.fillRect(0, 0, S, S);
    g.globalCompositeOperation = 'source-over';
    /* the same art with no drop shadow or halo, for the 3D models (a model casts its own shading) */
    try { const q = cv(S), qg = q.getContext('2d'); qg.drawImage(b, 0, 0); qg.globalCompositeOperation = 'source-atop'; qg.fillStyle = lg(qg, 0, 0, S, S, [[0, 'rgba(255,255,255,.12)'], [.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.14)']]); qg.fillRect(0, 0, S, S); U.lastClean = q; } catch (_) {}
    return c; }
  const url = c => c.toDataURL('image/png');
  /* material palettes: hi, mid, dark, trim */
  const PAL = {wood: ['#f0c88a', '#b07a40', '#5a3818', '#3a2410'], stone: ['#d8d8d2', '#8e8e88', '#4a4a46', '#2e2e2c'], copper: ['#ffd2a8', '#d47a42', '#6e3014', '#f2c440'],
    silver: ['#ffffff', '#c6ced6', '#5c646c', '#3a4048'], gold: ['#fff6c0', '#f2c440', '#8a5a0e', '#5a3a06'], diamond: ['#f0ffff', '#62e4e0', '#127880', '#0a4a50'],
    lazurite: ['#a8c2ff', '#2f58cc', '#0c1c5a', '#e0b040'], ruby: ['#ffc0c8', '#d4203c', '#560614', '#f2c440'], cairngorm: ['#f0d8b0', '#8a5a34', '#2e1a0c', '#d8b070']};
  const matOf = id => { const n = nm(id); for (const k of ['copper', 'silver', 'gold', 'diamond', 'lazurite', 'ruby', 'cobalt', 'iron', 'stone', 'wood']) if (n.includes(k)) return k === 'iron' ? 'silver' : k === 'cobalt' ? 'lazurite' : k;
    try { const m = toolMat(id); return m === 'iron' ? 'silver' : m === 'cobalt' ? 'lazurite' : m; } catch (_) { return 'silver'; } };
  const metalG = (g, p, x0, y0, x1, y1) => lg(g, x0, y0, x1, y1, [[0, p[0]], [.28, p[1]], [.46, p[0]], [.62, p[1]], [1, p[2]]]);
  const outline = (g, p, lw) => { g.lineWidth = lw || 1.6; g.strokeStyle = shade(p[2].length === 7 ? p[2] : '#333333', .55); g.stroke(); };
  function speck(g, R, n, x, y, w, h, cols, a) { for (let i = 0; i < n; i++) { g.globalAlpha = a * (.4 + R() * .6); g.fillStyle = cols[i % cols.length]; const s = .4 + R() * 1.1; g.fillRect(x + R() * w, y + R() * h, s, s); } g.globalAlpha = 1; }
  function sparkle(g, x, y, r) { g.save(); g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill();
    g.fillStyle = rg(g, x, y, 0, r * .7, [[0, 'rgba(255,255,255,.8)'], [1, 'rgba(255,255,255,0)']]); g.beginPath(); g.arc(x, y, r * .7, 0, 7); g.fill(); g.restore(); }
  /* ---------- 1) HD painters ---------- */
  function pIngot(p) { return paint(g => {
    const A = [16, 50], B = [54, 32], C = [84, 46], D = [46, 64], A2 = [10, 64], C2 = [90, 60], D2 = [44, 82];
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(50, 84, 40, 8, 0, 0, 7); g.fill();
    path(g, [A, D, D2, A2]); g.fillStyle = lg(g, 10, 50, 46, 82, [[0, p[1]], [.5, shade(p[1].length === 7 ? p[1] : '#888888', .85)], [1, p[2]]]); g.fill(); outline(g, p);
    path(g, [D, C, C2, D2]); g.fillStyle = lg(g, 46, 64, 90, 60, [[0, p[2]], [1, shade(p[1], .7)]]); g.fill(); outline(g, p);
    path(g, [A, B, C, D]); g.fillStyle = metalG(g, p, 20, 34, 76, 62); g.fill(); outline(g, p);
    /* stamped mark + bevel shine */
    g.save(); path(g, [A, B, C, D]); g.clip(); g.translate(50, 48); g.transform(1, -.44, 1, .48, 0, 0); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.4; g.strokeRect(-12, -6, 24, 12); g.strokeStyle = 'rgba(255,255,255,.45)'; g.strokeRect(-11.4, -5.4, 24, 12); g.restore();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(A[0] + 3, A[1]); g.lineTo(B[0], B[1] + 1.5); g.lineTo(C[0] - 4, C[1]); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(A2[0] + 2, A2[1] - 1); g.lineTo(D2[0], D2[1] - 2); g.stroke();
    sparkle(g, 60, 38, 6); }); }
  function pGem(p, cut) { return paint(g => {
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(50, 90, 26, 5, 0, 0, 7); g.fill();
    const G = [[10, 38], [28, 18], [72, 18], [90, 38]], Bt = [50, 90], T = [[34, 18], [66, 18], [76, 32], [24, 32]];
    path(g, [G[0], G[1], G[2], G[3], Bt]); g.fillStyle = p[1]; g.fill();
    const tri = (pts, c) => { path(g, pts); g.fillStyle = c; g.fill(); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = .6; g.stroke(); };
    /* crown */
    tri([G[1], T[0], T[3], G[0]], p[0]); tri([T[1], G[2], G[3], T[2]], shade(p[1], .9)); tri([T[0], T[1], T[2], T[3]], lg(g, 24, 18, 76, 32, [[0, p[0]], [.5, '#ffffff'], [1, p[1]]]));
    tri([G[0], T[3], [50, 38]], shade(p[1], 1.1)); tri([T[3], T[2], [50, 38]], p[1]); tri([T[2], G[3], [50, 38]], shade(p[1], .75));
    /* pavilion */
    tri([G[0], [50, 38], [30, 54]], shade(p[1], 1.15)); tri([G[0], [30, 54], Bt], p[2]); tri([[30, 54], [50, 38], Bt], p[1]);
    tri([[50, 38], [70, 54], Bt], shade(p[1], .85)); tri([[50, 38], G[3], [70, 54]], p[0]); tri([[70, 54], G[3], Bt], p[2]);
    path(g, [G[0], G[1], G[2], G[3], Bt]); g.lineWidth = 1.8; g.strokeStyle = p[3] && cut === 'ruby' ? '#3a0410' : shade(p[2], .6); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.5)'; path(g, [[30, 21], [44, 21], [36, 29], [27, 29]]); g.fill();
    sparkle(g, 70, 22, 9); sparkle(g, 26, 52, 4.5); }); }
  function pLazurite() { const p = PAL.lazurite; return paint(g => { const R = rng(261);
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(50, 86, 36, 7, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(16, 56); g.bezierCurveTo(10, 30, 36, 14, 58, 16); g.bezierCurveTo(84, 18, 92, 42, 86, 60); g.bezierCurveTo(80, 80, 50, 86, 32, 80); g.bezierCurveTo(22, 76, 18, 68, 16, 56); g.closePath();
    g.fillStyle = rg(g, 40, 34, 2, 60, [[0, '#7aa0ff'], [.35, p[1]], [1, p[2]]]); g.fill(); g.save(); g.clip();
    for (let i = 0; i < 18; i++) { g.fillStyle = R() < .5 ? 'rgba(120,160,255,.22)' : 'rgba(5,10,40,.25)'; g.beginPath(); g.ellipse(14 + R() * 74, 16 + R() * 66, 4 + R() * 12, 2 + R() * 6, R() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 46; i++) { const x = 16 + R() * 70, y = 18 + R() * 62, r = .5 + R() * 1.2; g.fillStyle = rg(g, x, y, 0, r * 2, [[0, '#fff6c0'], [.5, '#e0b040'], [1, 'rgba(160,110,20,0)']]); g.beginPath(); g.arc(x, y, r * 2, 0, 7); g.fill(); }
    g.fillStyle = rg(g, 36, 30, 0, 22, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(0, 0, 100, 100); g.restore();
    g.lineWidth = 1.8; g.strokeStyle = '#08123a'; g.stroke(); sparkle(g, 34, 30, 6); }); }
  function pCairngorm() { return paint(g => {
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(50, 88, 28, 6, 0, 0, 7); g.fill();
    const fac = [[[36, 30], [50, 6], [50, 34]], [[50, 6], [64, 30], [50, 34]], [[36, 30], [50, 34], [50, 86], [34, 80]], [[50, 34], [64, 30], [66, 80], [50, 86]]];
    const cols = ['#e8c89a', '#a87444', lg(g, 34, 40, 50, 80, [[0, 'rgba(210,170,120,.95)'], [1, 'rgba(90,52,24,.95)']]), lg(g, 50, 40, 66, 80, [[0, 'rgba(130,84,46,.95)'], [1, 'rgba(46,24,10,.95)']])];
    fac.forEach((f, i) => { path(g, f); g.fillStyle = cols[i]; g.fill(); g.lineWidth = .8; g.strokeStyle = 'rgba(255,240,210,.35)'; g.stroke(); });
    path(g, [[36, 30], [50, 6], [64, 30], [66, 80], [50, 86], [34, 80]]); g.lineWidth = 1.8; g.strokeStyle = '#24140a'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.4)'; path(g, [[39, 36], [44, 36], [42, 74], [38, 72]]); g.fill();
    /* small side crystal */
    path(g, [[66, 56], [78, 40], [84, 58], [80, 84], [68, 84]]); g.fillStyle = lg(g, 66, 40, 84, 84, [[0, '#d8b080'], [1, '#3a200c']]); g.fill(); g.lineWidth = 1.4; g.strokeStyle = '#24140a'; g.stroke();
    sparkle(g, 48, 16, 6); }); }
  function pNugget(p, seed) { return paint(g => { const R = rng(seed || 55);
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(50, 84, 38, 8, 0, 0, 7); g.fill();
    const blob = (cx, cy, r, base) => { g.beginPath(); const n = 9; for (let i = 0; i <= n; i++) { const a = i / n * 6.283, rr = r * (.78 + R() * .32), x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * .82; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath();
      g.fillStyle = rg(g, cx - r * .4, cy - r * .5, 1, r * 1.4, [[0, base[0]], [.4, base[1]], [1, base[2]]]); g.fill(); g.lineWidth = 1.4; g.strokeStyle = 'rgba(20,14,10,.85)'; g.stroke(); };
    const rock = ['#a49c94', '#6e6862', '#36322e'];
    blob(34, 62, 20, rock); blob(66, 64, 18, rock); blob(50, 40, 22, rock);
    for (const [x, y, r] of [[48, 38, 11], [36, 60, 9], [66, 62, 9], [58, 50, 6], [28, 50, 5]]) blob(x, y, r, p);
    if (p === PAL.copper) for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(70,170,140,.75)'; g.beginPath(); g.arc(24 + R() * 52, 34 + R() * 40, 1 + R() * 1.8, 0, 7); g.fill(); }
    speck(g, R, 60, 20, 26, 60, 50, ['rgba(255,255,255,.7)', 'rgba(0,0,0,.4)'], .6); sparkle(g, 44, 32, 5); }); }
  function pShieldWood() { return paint(g => { const R = rng(224);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(50, 92, 34, 5, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(50, 50, 40, 0, 7); g.clip();
    const cols = ['#b07a40', '#9a6634', '#c08a4c', '#a87038', '#8e5c2e'];
    for (let i = 0; i < 5; i++) { const x = 10 + i * 16; g.fillStyle = lg(g, x, 0, x + 16, 0, [[0, shade(cols[i], .8)], [.5, cols[i]], [1, shade(cols[i], .72)]]); g.fillRect(x, 0, 16, 100);
      for (let k = 0; k < 7; k++) { g.strokeStyle = 'rgba(60,34,14,.35)'; g.lineWidth = .5; g.beginPath(); const xx = x + 2 + R() * 12; g.moveTo(xx, 8); g.bezierCurveTo(xx + 2, 40, xx - 2, 60, xx + 1, 94); g.stroke(); }
      g.fillStyle = 'rgba(30,16,6,.6)'; g.fillRect(x + 15.4, 0, .8, 100); }
    g.fillStyle = rg(g, 40, 36, 4, 50, [[0, 'rgba(255,255,255,.18)'], [1, 'rgba(0,0,0,.25)']]); g.fillRect(0, 0, 100, 100); g.restore();
    g.lineWidth = 6; g.strokeStyle = lg(g, 10, 10, 90, 90, [[0, '#e4e8ec'], [.5, '#8a9096'], [1, '#3e4448']]); g.beginPath(); g.arc(50, 50, 38, 0, 7); g.stroke();
    g.lineWidth = 1.2; g.strokeStyle = '#1e2226'; g.beginPath(); g.arc(50, 50, 41, 0, 7); g.stroke(); g.beginPath(); g.arc(50, 50, 35, 0, 7); g.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, x = 50 + Math.cos(a) * 38, y = 50 + Math.sin(a) * 38; g.fillStyle = rg(g, x - .6, y - .6, 0, 2, [[0, '#ffffff'], [1, '#4a5056']]); g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }
    g.fillStyle = rg(g, 46, 45, 1, 14, [[0, '#ffffff'], [.35, '#b8c0c6'], [1, '#2e3438']]); g.beginPath(); g.arc(50, 50, 11, 0, 7); g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#1a1e22'; g.stroke(); }); }
  function pShieldSilver() { return paint(g => {
    const sh = (k) => { g.beginPath(); g.moveTo(50 - 34 * k, 50 - 36 * k); g.lineTo(50 + 34 * k, 50 - 36 * k); g.lineTo(50 + 34 * k, 50 - 6 * k); g.quadraticCurveTo(50 + 32 * k, 50 + 26 * k, 50, 50 + 42 * k); g.quadraticCurveTo(50 - 32 * k, 50 + 26 * k, 50 - 34 * k, 50 - 6 * k); g.closePath(); };
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(50, 94, 26, 4, 0, 0, 7); g.fill();
    sh(1); g.fillStyle = metalG(g, PAL.silver, 16, 14, 84, 92); g.fill(); g.lineWidth = 1.8; g.strokeStyle = '#2a3036'; g.stroke();
    g.save(); sh(.8); g.clip(); g.fillStyle = lg(g, 0, 20, 0, 90, [[0, '#2a5cc8'], [1, '#0c2470']]); g.fillRect(0, 0, 100, 100);
    g.strokeStyle = lg(g, 20, 20, 80, 80, [[0, '#ffffff'], [.5, '#c6ced6'], [1, '#8a949c']]); g.lineWidth = 9; g.beginPath(); g.moveTo(16, 18); g.lineTo(84, 92); g.moveTo(84, 18); g.lineTo(16, 92); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.moveTo(20, 20); g.lineTo(60, 20); g.lineTo(20, 60); g.fill(); g.restore();
    sh(.8); g.lineWidth = 1.4; g.strokeStyle = '#1a1e24'; g.stroke(); sh(.88); g.lineWidth = .8; g.strokeStyle = 'rgba(255,255,255,.55)'; g.stroke();
    for (const [x, y] of [[22, 20], [78, 20], [22, 46], [78, 46], [50, 88]]) { g.fillStyle = rg(g, x - .5, y - .5, 0, 2.2, [[0, '#ffffff'], [1, '#56606a']]); g.beginPath(); g.arc(x, y, 1.8, 0, 7); g.fill(); }
    sparkle(g, 30, 22, 5); }); }
  function pTarge() { return paint(g => { const R = rng(186);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(50, 92, 34, 5, 0, 0, 7); g.fill();
    g.beginPath(); g.arc(50, 50, 41, 0, 7); g.fillStyle = rg(g, 40, 36, 4, 50, [[0, '#8a5a32'], [.6, '#5e3a1c'], [1, '#2e1a0a']]); g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#180c04'; g.stroke();
    speck(g, R, 160, 12, 12, 76, 76, ['rgba(0,0,0,.4)', 'rgba(255,220,170,.2)'], .5);
    g.lineWidth = 2.2; g.strokeStyle = '#2a1608'; for (const r of [36, 26, 16]) { g.beginPath(); g.arc(50, 50, r, 0, 7); g.stroke(); }
    const stud = (x, y, s) => { g.fillStyle = rg(g, x - s * .3, y - s * .3, 0, s, [[0, '#fff3b0'], [.45, '#e0a830'], [1, '#6a4408']]); g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); };
    for (const [r, n, s] of [[38.5, 20, 1.8], [31, 14, 1.7], [21, 10, 1.6]]) for (let i = 0; i < n; i++) { const a = i / n * 6.283 + r; stud(50 + Math.cos(a) * r, 50 + Math.sin(a) * r, s); }
    /* knotwork cross in brass */
    g.strokeStyle = lg(g, 30, 30, 70, 70, [[0, '#fff0a0'], [.5, '#d8a030'], [1, '#7a5008']]); g.lineWidth = 3;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.beginPath(); g.ellipse(50 + Math.cos(a) * 7, 50 + Math.sin(a) * 7, 7, 3.4, a, 0, 7); g.stroke(); }
    g.fillStyle = rg(g, 47, 46, 0, 8, [[0, '#ffffff'], [.3, '#e8eef2'], [1, '#5a6066']]); g.beginPath(); g.arc(50, 50, 6, 0, 7); g.fill(); g.lineWidth = 1; g.strokeStyle = '#22262a'; g.stroke(); }); }
  function pArmour(slot, p) { return paint(g => {
    const trim = p[3] || p[2]; const sh = () => { g.fill(); g.lineWidth = 1.8; g.strokeStyle = shade(p[2], .5); g.stroke(); };
    const fill = (x0, y0, x1, y1) => { g.fillStyle = metalG(g, p, x0, y0, x1, y1); };
    const rivet = (x, y) => { g.fillStyle = rg(g, x - .5, y - .5, 0, 2, [[0, '#ffffff'], [1, shade(p[2], .8)]]); g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); };
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(50, 92, 34, 5, 0, 0, 7); g.fill();
    if (slot === 'helmet') {
      g.beginPath(); g.moveTo(16, 66); g.quadraticCurveTo(12, 18, 50, 14); g.quadraticCurveTo(88, 18, 84, 66); g.lineTo(70, 66); g.lineTo(70, 50); g.quadraticCurveTo(50, 42, 30, 50); g.lineTo(30, 66); g.closePath(); fill(16, 14, 84, 66); sh();
      g.beginPath(); g.moveTo(17, 46); g.quadraticCurveTo(50, 34, 83, 46); g.lineTo(83, 52); g.quadraticCurveTo(50, 40, 17, 52); g.closePath(); g.fillStyle = trim; g.fill(); g.lineWidth = .8; g.strokeStyle = 'rgba(0,0,0,.5)'; g.stroke();
      g.beginPath(); g.moveTo(46, 44); g.lineTo(54, 44); g.lineTo(53, 72); g.lineTo(47, 72); g.closePath(); fill(46, 44, 54, 72); sh();
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(30, 26); g.quadraticCurveTo(40, 18, 52, 18); g.stroke();
      g.strokeStyle = shade(p[2], .7); g.lineWidth = 1.2; g.beginPath(); g.moveTo(50, 15); g.lineTo(50, 40); g.stroke();
      [[22, 58], [78, 58], [24, 46], [76, 46]].forEach(q => rivet(q[0], q[1]));
    } else if (slot === 'chestplate') {
      g.beginPath(); g.moveTo(28, 16); g.lineTo(40, 14); g.quadraticCurveTo(50, 26, 60, 14); g.lineTo(72, 16); g.lineTo(90, 30); g.lineTo(82, 48); g.lineTo(74, 44); g.lineTo(74, 84); g.quadraticCurveTo(50, 92, 26, 84); g.lineTo(26, 44); g.lineTo(18, 48); g.lineTo(10, 30); g.closePath(); fill(12, 14, 88, 88); sh();
      g.strokeStyle = trim; g.lineWidth = 2.4; g.beginPath(); g.moveTo(40, 15); g.quadraticCurveTo(50, 27, 60, 15); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2; for (const y of [56, 68]) { g.beginPath(); g.moveTo(27, y); g.quadraticCurveTo(50, y + 6, 73, y); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; for (const y of [57.5, 69.5]) { g.beginPath(); g.moveTo(28, y); g.quadraticCurveTo(50, y + 6, 72, y); g.stroke(); }
      g.strokeStyle = shade(p[2], .8); g.lineWidth = 1.4; g.beginPath(); g.moveTo(50, 26); g.lineTo(50, 86); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(30, 24); g.lineTo(44, 26); g.lineTo(34, 48); g.lineTo(28, 46); g.fill();
      [[14, 32], [86, 32], [30, 80], [70, 80]].forEach(q => rivet(q[0], q[1]));
    } else if (slot === 'leggings') {
      g.beginPath(); g.moveTo(24, 14); g.lineTo(76, 14); g.lineTo(78, 88); g.lineTo(58, 88); g.lineTo(52, 38); g.lineTo(48, 38); g.lineTo(42, 88); g.lineTo(22, 88); g.closePath(); fill(22, 14, 78, 88); sh();
      g.fillStyle = trim; g.fillRect(24, 14, 52, 8); g.lineWidth = .8; g.strokeStyle = 'rgba(0,0,0,.5)'; g.strokeRect(24, 14, 52, 8);
      for (const [x, s] of [[32, 1], [68, -1]]) { g.beginPath(); g.ellipse(x, 56, 8, 6, 0, 0, 7); fill(x - 8, 50, x + 8, 62); sh(); }
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(27, 26, 3, 56); g.fillRect(55, 40, 2.4, 44);
      [[30, 18], [50, 18], [70, 18]].forEach(q => rivet(q[0], q[1]));
    } else {
      for (const x of [14, 56]) { g.beginPath(); g.moveTo(x, 28); g.lineTo(x + 18, 28); g.lineTo(x + 18, 62); g.quadraticCurveTo(x + 30, 64, x + 30, 76); g.lineTo(x + 30, 82); g.lineTo(x - 2, 82); g.lineTo(x, 28); g.closePath(); fill(x, 28, x + 30, 82); sh();
        g.fillStyle = trim; g.fillRect(x, 28, 18, 6); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - 2, 78, 32, 4); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + 3, 36, 2.4, 30); rivet(x + 9, 46); }
    }
    if (p === PAL.diamond || p === PAL.lazurite || p === PAL.gold) sparkle(g, 34, 26, 5); }); }
  function pTool(kind, mat) { const p = PAL[mat] || PAL.silver; return paint(g => { const R = rng(kind.length * 31 + mat.length);
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(52, 90, 34, 5, 0, 0, 7); g.fill();
    g.translate(50, 50); g.rotate(Math.PI / 4);
    const head = (fn, x0, y0, x1, y1) => { fn(); g.fillStyle = mat === 'stone' ? lg(g, x0, y0, x1, y1, [[0, '#c4c4be'], [.5, '#8a8a84'], [1, '#4e4e4a']]) : metalG(g, p, x0, y0, x1, y1); g.fill();
      if (mat === 'stone') { g.save(); g.clip(); speck(g, R, 140, x0, y0, x1 - x0, y1 - y0, ['#3a3a38', '#e8e8e2', '#6a6a66'], .7); g.restore(); fn(); }
      if (mat === 'wood') { g.save(); g.clip(); g.fillStyle = 'rgba(80,46,18,.3)'; for (let i = 0; i < 8; i++) g.fillRect(x0, y0 + R() * (y1 - y0), x1 - x0, .6); g.restore(); fn(); }
      g.lineWidth = 1.7; g.strokeStyle = shade(p[2], .5); g.stroke(); };
    const handle = (y0, y1, w) => { g.beginPath(); g.roundRect ? g.roundRect(-w / 2, y0, w, y1 - y0, w / 2) : g.rect(-w / 2, y0, w, y1 - y0);
      g.fillStyle = lg(g, -w / 2, 0, w / 2, 0, [[0, '#4a2a12'], [.3, '#c08850'], [.5, '#e6bc86'], [.75, '#9a6834'], [1, '#3e220e']]); g.fill(); g.lineWidth = 1.4; g.strokeStyle = '#24140a'; g.stroke();
      g.strokeStyle = 'rgba(70,40,16,.45)'; g.lineWidth = .5; for (let i = 0; i < 4; i++) { const x = -w / 2 + 1 + R() * (w - 2); g.beginPath(); g.moveTo(x, y0 + 2); g.lineTo(x + (R() - .5), y1 - 2); g.stroke(); }
      /* leather wrap near the end */
      for (let y = y1 - 15; y < y1 - 3; y += 3) { g.fillStyle = y % 2 ? '#3a2214' : '#5a3620'; g.beginPath(); g.moveTo(-w / 2 - .6, y); g.lineTo(w / 2 + .6, y - 1.6); g.lineTo(w / 2 + .6, y + 1.4); g.lineTo(-w / 2 - .6, y + 3); g.closePath(); g.fill(); }
      g.beginPath(); g.arc(0, y1, w * .62, 0, 7); g.fillStyle = metalG(g, mat === 'wood' || mat === 'stone' ? PAL.silver : p, -w, y1 - w, w, y1 + w); g.fill(); g.lineWidth = 1; g.strokeStyle = '#1e1e1e'; g.stroke(); };
    if (kind === 'sword') {
      head(() => { g.beginPath(); g.moveTo(-5.5, 8); g.lineTo(5.5, 8); g.lineTo(4.6, -34); g.lineTo(0, -44); g.lineTo(-4.6, -34); g.closePath(); }, -6, -44, 6, 8);
      g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, 4); g.lineTo(0, -32); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-3.2, 4); g.lineTo(-3, -32); g.lineTo(-.4, -40); g.stroke();
      g.beginPath(); g.roundRect ? g.roundRect(-15, 8, 30, 5.4, 2.4) : g.rect(-15, 8, 30, 5.4); g.fillStyle = metalG(g, mat === 'wood' || mat === 'stone' ? PAL.gold : (p[3] && p[3][0] === '#' && mat !== 'silver' ? PAL.gold : PAL.silver), -15, 8, 15, 14); g.fill(); g.lineWidth = 1.3; g.strokeStyle = '#2a1a08'; g.stroke();
      g.beginPath(); g.rect(-3.4, 13.4, 6.8, 18); g.fillStyle = '#3a2214'; g.fill(); g.strokeStyle = '#140a04'; g.lineWidth = 1.2; g.stroke();
      g.strokeStyle = '#7a5434'; g.lineWidth = .9; for (let y = 16; y < 31; y += 3.2) { g.beginPath(); g.moveTo(-3.4, y); g.lineTo(3.4, y - 2); g.stroke(); }
      g.beginPath(); g.arc(0, 35, 4.6, 0, 7); g.fillStyle = rg(g, -1.4, 33.6, 0, 5, [[0, '#ffffff'], [.4, p === PAL.wood || p === PAL.stone ? '#f2c440' : p[1]], [1, '#2a2a2a']]); g.fill(); g.lineWidth = 1.1; g.strokeStyle = '#141414'; g.stroke();
    } else {
      handle(-30, 40, 6.4);
      if (kind === 'pick') {
        head(() => { g.beginPath(); g.moveTo(-38, -16); g.quadraticCurveTo(-20, -40, 0, -40); g.quadraticCurveTo(20, -40, 38, -16); g.lineTo(34, -15); g.quadraticCurveTo(18, -31, 0, -31); g.quadraticCurveTo(-18, -31, -34, -15); g.closePath(); }, -38, -40, 38, -15);
        head(() => { g.beginPath(); g.rect(-6, -42, 12, 13); }, -6, -42, 6, -29);
        g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-30, -24); g.quadraticCurveTo(-16, -37, 0, -38); g.stroke();
      } else if (kind === 'axe') {
        head(() => { g.beginPath(); g.moveTo(-3, -40); g.lineTo(-14, -42); g.quadraticCurveTo(-36, -38, -36, -18); g.quadraticCurveTo(-32, -8, -24, -6); g.lineTo(-14, -20); g.lineTo(-3, -22); g.closePath(); }, -36, -42, -3, -6);
        head(() => { g.beginPath(); g.rect(-4, -43, 11, 22); }, -4, -43, 7, -21);
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-15, -39.5); g.quadraticCurveTo(-33, -36, -33, -18); g.stroke();
      } else if (kind === 'shovel') {
        head(() => { g.beginPath(); g.moveTo(-12, -24); g.lineTo(12, -24); g.lineTo(12, -38); g.quadraticCurveTo(12, -46, 0, -50); g.quadraticCurveTo(-12, -46, -12, -38); g.closePath(); }, -12, -50, 12, -24);
        head(() => { g.beginPath(); g.rect(-4, -26, 8, 8); }, -4, -26, 4, -18);
        g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-8, -27); g.lineTo(-8, -40); g.stroke();
      } else {
        head(() => { g.beginPath(); g.rect(-4, -40, 9, 9); }, -4, -40, 5, -31);
        head(() => { g.beginPath(); g.moveTo(-4, -40); g.lineTo(-22, -40); g.quadraticCurveTo(-26, -36, -26, -26); g.lineTo(-20, -24); g.lineTo(-18, -32); g.lineTo(-4, -32); g.closePath(); }, -26, -40, -4, -24);
        g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-6, -38.5); g.lineTo(-21, -38.5); g.stroke();
      }
    }
    if (mat === 'diamond' || mat === 'lazurite' || mat === 'ruby') { g.rotate(-Math.PI / 4); sparkle(g, -6, -28, 5); }
  }); }
  function pHaggis(cooked) { return paint(g => { const R = rng(cooked ? 87 : 31);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(50, 84, 40, 8, 0, 0, 7); g.fill();
    if (cooked) { g.beginPath(); g.ellipse(50, 74, 46, 14, 0, 0, 7); g.fillStyle = lg(g, 0, 60, 0, 90, [[0, '#ffffff'], [.6, '#dfe4ea'], [1, '#9aa2aa']]); g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#5a6068'; g.stroke();
      g.beginPath(); g.ellipse(50, 72, 38, 10, 0, 0, 7); g.strokeStyle = '#2a4a8a'; g.lineWidth = 1.2; g.stroke(); }
    g.save(); g.translate(50, cooked ? 56 : 56); g.rotate(-.12);
    g.scale(1.12, 1.12); g.beginPath(); g.ellipse(0, 0, 34, 25, 0, 0, 7);
    g.fillStyle = cooked ? rg(g, -12, -12, 2, 40, [[0, '#e8a860'], [.4, '#a8602a'], [1, '#4a2410']]) : rg(g, -12, -12, 2, 40, [[0, '#f8d4c4'], [.45, '#d49484'], [1, '#7a3a30']]); g.fill();
    g.save(); g.clip();
    for (let i = 0; i < 14; i++) { g.strokeStyle = cooked ? 'rgba(60,24,6,.35)' : 'rgba(150,50,50,.32)'; g.lineWidth = .5 + R() * .7; g.beginPath(); let x = -30 + R() * 60, y = -20 + R() * 40; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - .5) * 14; y += (R() - .5) * 10; g.lineTo(x, y); } g.stroke(); }
    speck(g, R, cooked ? 140 : 70, -34, -25, 68, 50, cooked ? ['#2a1206', '#f0c890', '#5a2a0c'] : ['#fff4ec', '#b06a60'], .55);
    if (cooked) { g.beginPath(); g.moveTo(-14, -18); g.quadraticCurveTo(0, -8, 16, -19); g.quadraticCurveTo(2, -26, -14, -18); g.fillStyle = '#4a2a14'; g.fill(); speck(g, R, 50, -14, -24, 30, 14, ['#e8d0a0', '#c8a060', '#1a0a04'], .9); }
    g.fillStyle = rg(g, -14, -12, 0, 16, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(-34, -25, 68, 50);
    g.restore(); g.beginPath(); g.ellipse(0, 0, 34, 25, 0, 0, 7); g.lineWidth = 1.8; g.strokeStyle = cooked ? '#2a1206' : '#4a1a14'; g.stroke();
    /* tied ends */
    for (const s of [-1, 1]) { g.save(); g.translate(s * 34, -2); g.fillStyle = cooked ? '#6a3a18' : '#c08878'; g.beginPath(); g.moveTo(0, -5); g.quadraticCurveTo(s * 9, -2, s * 10, 0); g.quadraticCurveTo(s * 9, 3, 0, 5); g.closePath(); g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#2a1206'; g.stroke();
      g.strokeStyle = '#e8dcb0'; g.lineWidth = 2; g.beginPath(); g.moveTo(s * 1, -5.5); g.lineTo(s * 1.6, 5.5); g.stroke(); g.lineWidth = 1.2; g.beginPath(); g.moveTo(s * 1.4, 4); g.quadraticCurveTo(s * 4, 12, s * 1, 14); g.stroke(); g.restore(); }
    g.restore();
    if (cooked) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2.2; for (const x of [38, 52, 64]) { g.beginPath(); g.moveTo(x, 28); g.bezierCurveTo(x - 6, 20, x + 6, 14, x, 6); g.stroke(); } }
  }); }
  function pNeeps() { return paint(g => { const R = rng(88);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(50, 86, 40, 7, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(10, 50); g.quadraticCurveTo(14, 86, 50, 86); g.quadraticCurveTo(86, 86, 90, 50); g.closePath(); g.fillStyle = lg(g, 0, 50, 0, 86, [[0, '#f4f6f8'], [1, '#9aa2aa']]); g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#4a525a'; g.stroke();
    g.fillStyle = '#1e4a8a'; g.fillRect(14, 62, 72, 3); g.fillStyle = '#b02030'; g.fillRect(16, 67, 68, 1.6);
    g.beginPath(); g.ellipse(50, 50, 40, 10, 0, 0, 7); g.fillStyle = '#e8ecf0'; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(14, 50); g.bezierCurveTo(18, 30, 36, 24, 50, 26); g.bezierCurveTo(66, 24, 84, 32, 86, 50); g.quadraticCurveTo(50, 60, 14, 50); g.closePath();
    g.fillStyle = rg(g, 40, 32, 2, 40, [[0, '#ffc070'], [.5, '#e88a28'], [1, '#a04a10']]); g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#6a2a08'; g.stroke();
    g.strokeStyle = 'rgba(120,50,10,.5)'; g.lineWidth = 1.4; for (let i = 0; i < 6; i++) { g.beginPath(); const x = 24 + R() * 50, y = 32 + R() * 14; g.arc(x, y, 4 + R() * 5, 3.4, 5.8); g.stroke(); }
    g.strokeStyle = 'rgba(255,230,180,.6)'; g.lineWidth = 1; for (let i = 0; i < 5; i++) { g.beginPath(); const x = 26 + R() * 46, y = 30 + R() * 12; g.arc(x, y, 3 + R() * 4, 3.6, 5.2); g.stroke(); }
    speck(g, R, 40, 20, 28, 60, 20, ['#2a1a0a'], .8);
    g.beginPath(); g.roundRect ? g.roundRect(44, 24, 14, 9, 2) : g.rect(44, 24, 14, 9); g.fillStyle = lg(g, 44, 24, 58, 33, [[0, '#fff8c0'], [1, '#f0c840']]); g.fill(); g.lineWidth = .8; g.strokeStyle = '#a08020'; g.stroke();
    g.fillStyle = 'rgba(255,236,120,.7)'; g.beginPath(); g.ellipse(52, 34, 9, 3, 0, 0, 7); g.fill(); }); }
  function pTorch(unlit) { return paint(g => {
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(46, 92, 16, 3.4, 0, 0, 7); g.fill();
    g.save(); g.translate(50, 54); g.rotate(-.18);
    g.beginPath(); g.rect(-4.6, -10, 9.2, 46); g.fillStyle = lg(g, -4.6, 0, 4.6, 0, [[0, '#3a220e'], [.35, '#b8844a'], [.55, '#e0b47c'], [1, '#4a2c12']]); g.fill(); g.lineWidth = 1.3; g.strokeStyle = '#1e1006'; g.stroke();
    g.fillStyle = '#2a1a0e'; g.fillRect(-5.6, -14, 11.2, 7); g.fillStyle = 'rgba(255,170,60,.6)'; g.fillRect(-5.6, -14, 11.2, 1.6);
    g.restore();
    if (unlit) { g.fillStyle = '#1a1410'; g.beginPath(); g.ellipse(44, 39, 6, 4, -.2, 0, 7); g.fill(); g.strokeStyle = 'rgba(200,200,200,.35)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(44, 36); g.bezierCurveTo(40, 28, 48, 22, 44, 14); g.stroke(); return; }
    g.fillStyle = rg(g, 44, 34, 0, 30, [[0, 'rgba(255,220,120,.8)'], [.35, 'rgba(255,150,40,.35)'], [1, 'rgba(255,120,20,0)']]); g.beginPath(); g.arc(44, 34, 30, 0, 7); g.fill();
    const fl = (s, c) => { g.beginPath(); g.moveTo(44, 40 - 28 * s); g.bezierCurveTo(44 + 14 * s, 26, 44 + 10 * s, 42, 44, 44); g.bezierCurveTo(44 - 10 * s, 42, 44 - 12 * s, 30, 44, 40 - 28 * s); g.fillStyle = c; g.fill(); };
    fl(1, '#ff7a1a'); fl(.72, '#ffc23a'); fl(.42, '#fff6c8'); }); }
  /* isometric boxes for block icons */
  const half = {}; const smallFace = key => { const s = texImg[key]; if (!s || !s.width) return null; if (half[key] && half[key].src === s) return half[key].c;
    let c = s; while (c.width > 256) { const n = cv(c.width / 2); const g = n.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, n.width, n.width); c = n; } half[key] = {src: s, c}; return c; };
  const ISO = 256, PJ = (x, y, z) => [ISO * (.5 + (x - z) * .44), ISO * (.04 + (x + z) * .22 + (1 - y) * .5)];
  function face(g, img, O, Ua, Va, u0, u1, v0, v1, dark) { if (!img) return; const w = img.width, sx = u0 * w, sy = v0 * w, sw = Math.max(1, (u1 - u0) * w), sh = Math.max(1, (v1 - v0) * w);
    g.save(); g.beginPath(); g.moveTo(O[0], O[1]); g.lineTo(Ua[0], Ua[1]); g.lineTo(Ua[0] + Va[0] - O[0], Ua[1] + Va[1] - O[1]); g.lineTo(Va[0], Va[1]); g.closePath(); g.clip();
    g.setTransform((Ua[0] - O[0]) / sw, (Ua[1] - O[1]) / sw, (Va[0] - O[0]) / sh, (Va[1] - O[1]) / sh, O[0], O[1]); g.drawImage(img, sx, sy, sw, sh, -.6, -.6, sw + 1.2, sh + 1.2); g.setTransform(1, 0, 0, 1, 0, 0);
    if (dark) { g.fillStyle = 'rgba(0,0,0,' + dark + ')'; g.fill(); } g.restore();
    g.beginPath(); g.moveTo(O[0], O[1]); g.lineTo(Ua[0], Ua[1]); g.lineTo(Ua[0] + Va[0] - O[0], Ua[1] + Va[1] - O[1]); g.lineTo(Va[0], Va[1]); g.closePath(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(0,0,0,.35)'; g.stroke(); }
  function box(g, F, x0, y0, z0, x1, y1, z1) { const [top, front, right] = F;
    face(g, top, PJ(x0, y1, z0), PJ(x1, y1, z0), PJ(x0, y1, z1), x0, x1, z0, z1, 0);
    face(g, front, PJ(x0, y1, z1), PJ(x1, y1, z1), PJ(x0, y0, z1), x0, x1, 1 - y1, 1 - y0, .2);
    face(g, right, PJ(x1, y1, z1), PJ(x1, y1, z0), PJ(x1, y0, z1), 1 - z1, 1 - z0, 1 - y1, 1 - y0, .38);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.4; g.beginPath(); const a = PJ(x0, y1, z1), b = PJ(x1, y1, z1), c = PJ(x1, y1, z0); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.stroke(); }
  const facesOf = id => { let f = FACES[id]; if (!f) return null; if (!Array.isArray(f)) f = [f, f, f, f, f, f]; const t = smallFace(f[2]), fr = smallFace(f[4]), r = smallFace(f[0]); return t && fr && r ? [t, fr, r] : null; };
  function isoIcon(F, stairs) { const c = cv(ISO), g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(ISO / 2, ISO * .93, ISO * .34, ISO * .06, 0, 0, 7); g.fill();
    if (stairs) { box(g, F, 0, 0, 0, 1, .5, 1); box(g, F, 0, .5, 0, 1, 1, .5); } else box(g, F, 0, 0, 0, 1, 1, 1);
    return c; }
  function pDoor() { const pl = smallFace('planks'); return paint(g => {
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(50, 94, 26, 4, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.rect(26, 6, 48, 86); g.clip(); if (pl) { g.save(); g.translate(26, 6); g.rotate(0); g.drawImage(pl, 0, 0, 48, 43); g.drawImage(pl, 0, 43, 48, 43); g.restore(); } else { g.fillStyle = '#a87440'; g.fillRect(26, 6, 48, 86); }
    g.fillStyle = 'rgba(40,20,6,.25)'; g.fillRect(26, 6, 48, 86); g.fillStyle = 'rgba(30,14,4,.6)'; for (const x of [38, 50, 62]) g.fillRect(x, 6, .8, 86);
    g.fillStyle = rg(g, 50, 26, 2, 20, [[0, '#d8f0ff'], [1, '#6a9ac0']]); g.fillRect(31, 11, 38, 26); g.strokeStyle = '#3a2410'; g.lineWidth = 2.6; g.strokeRect(31, 11, 38, 26); g.beginPath(); g.moveTo(50, 11); g.lineTo(50, 37); g.moveTo(31, 24); g.lineTo(69, 24); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(33, 13); g.lineTo(42, 13); g.lineTo(33, 22); g.fill();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(26, 6, 6, 86); g.restore();
    g.lineWidth = 2; g.strokeStyle = '#2a1608'; g.strokeRect(26, 6, 48, 86);
    for (const y of [20, 74]) { g.fillStyle = metalG(g, PAL.silver, 26, y, 40, y + 5); g.fillRect(25, y, 14, 4.4); }
    g.fillStyle = rg(g, 65, 55, 0, 4, [[0, '#ffffff'], [.4, '#c0c8d0'], [1, '#3a4048']]); g.beginPath(); g.arc(66, 56, 3.2, 0, 7); g.fill(); }); }
  function pEnchant() { const ob = smallFace('obsidian') || smallFace('deepslate') || smallFace('stone'); const c = cv(ISO), g = c.getContext('2d');
    const red = cv(128), rg2 = red.getContext('2d'); rg2.fillStyle = '#8a1424'; rg2.fillRect(0, 0, 128, 128); rg2.strokeStyle = '#f2c440'; rg2.lineWidth = 6; rg2.strokeRect(10, 10, 108, 108); rg2.fillStyle = '#62e4e0'; for (const [x, y] of [[14, 14], [114, 14], [14, 114], [114, 114]]) { rg2.beginPath(); rg2.arc(x, y, 9, 0, 7); rg2.fill(); }
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(ISO / 2, ISO * .93, ISO * .34, ISO * .06, 0, 0, 7); g.fill();
    box(g, [red, ob, ob], 0, 0, 0, 1, .75, 1);
    /* open book floating above */
    const [bx, by] = PJ(.5, 1.05, .5); g.save(); g.translate(bx, by - 18); g.fillStyle = '#5a2a10'; g.beginPath(); g.moveTo(-44, 4); g.lineTo(0, 18); g.lineTo(44, 4); g.lineTo(0, -10); g.closePath(); g.fill();
    g.fillStyle = '#f4ead0'; g.beginPath(); g.moveTo(-40, 0); g.lineTo(0, 12); g.lineTo(0, -14); g.lineTo(-38, -24); g.closePath(); g.fill(); g.beginPath(); g.moveTo(40, 0); g.lineTo(0, 12); g.lineTo(0, -14); g.lineTo(38, -24); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(90,60,30,.6)'; g.lineWidth = 1.4; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-32, -14 + i * 6); g.lineTo(-6, -6 + i * 6); g.moveTo(32, -14 + i * 6); g.lineTo(6, -6 + i * 6); g.stroke(); }
    g.fillStyle = 'rgba(160,120,255,.45)'; g.beginPath(); g.arc(0, -10, 26, 0, 7); g.fill(); g.restore(); return c; }
  /* ---------- 2) apply: painted icons first, block icons once the textures are in, then the finishing pass for the rest ---------- */
  const MINE = U.MINE = {}, OLD = {}, SKIP = id => (id >= 600 && id < 660) || [145, 162, 164, 173, 226].includes(id);
  function put(id, u) { id = +id; if (ICONS[id] && ICONS[id] !== MINE[id]) OLD[id] = ICONS[id]; MINE[id] = u; ICONS[id] = u; try { const MU = U.MODEL = U.MODEL || {}; if (U.lastClean) MU[id] = U.lastClean.toDataURL(); else delete MU[id]; } catch (_) {} U.lastClean = null; delete ICON_KEY[id];
    try { if (window.__c121 && __c121.ICO && (id in __c121.ICO)) __c121.ICO[id] = u; if (window.__c120ICO && (id in __c120ICO)) __c120ICO[id] = u; } catch (_) {}
    delete spriteMats[id]; dirty = true; }
  let dirty = false;
  const fin = (id, c) => { try { put(id, url(finish(c))); U.painted++; } catch (e) { warn('paint' + id, e); } };
  function paintAll() {
    const job = [];
    [[80, 'silver'], [81, 'copper'], [82, 'gold'], [183, 'silver'], [263, 'lazurite']].forEach(([id, m]) => job.push([id, () => pIngot(PAL[m])]));
    job.push([123, () => pGem(PAL.diamond)], [260, () => pGem(PAL.ruby, 'ruby')], [261, pLazurite], [180, pCairngorm]);
    [[55, 'copper', 55], [83, 'gold', 83], [182, 'silver', 182], [54, 'silver', 54], [262, 'lazurite', 262]].forEach(([id, m, s]) => job.push([id, () => pNugget(PAL[m], s)]));
    job.push([224, pShieldWood], [225, pShieldSilver], [186, pTarge], [31, () => pHaggis(false)], [87, () => pHaggis(true)], [88, pNeeps], [67, () => pTorch(false)], [257, () => pTorch(true)]);
    for (const k in NAMES) { const id = +k, n = nm(id); if (!n || SKIP(id)) continue;
      const sl = /helmet|cap\b/.test(n) ? 'helmet' : /chestplate|tunic/.test(n) ? 'chestplate' : /leggings|trousers/.test(n) ? 'leggings' : /boots/.test(n) ? 'boots' : null;
      if (sl && (ARMOUR[id] || /copper|silver|gold|diamond|lazurite|iron|cobalt/.test(n))) { const m = matOf(id); job.push([id, () => pArmour(sl, PAL[m] || PAL.silver)]); continue; }
      const t = TOOL[id]; if (t && ['pick', 'axe', 'shovel', 'hoe', 'sword'].includes(t[0]) && !/bat\b|claymore/.test(n)) { const m = matOf(id); job.push([id, () => pTool(t[0], PAL[m] ? m : 'silver')]); } }
    const step = () => { const t0 = performance.now(); while (job.length && performance.now() - t0 < 3) {   /* v1.1.39: small slices in idle time */ const [id, f] = job.shift(); if (!NAMES[id] && ![80, 263, 262, 54].includes(id)) continue; try { fin(id, f()); } catch (e) { warn('p' + id, e); } } if (job.length) (window.requestIdleCallback ? requestIdleCallback(() => step(), {timeout: 600}) : setTimeout(step, 40)); else { U.log.push('painted ' + U.painted); setTimeout(blocks, 400); } };
    step(); }
  const NONCUBE = /door|fence|gate|pane|railing|torch|lamp|cobweb|carpet|slab|stairs|bed|cauldron|\btv\b|hive|enchant|ladder|lever|painting|marker|activator|water|lava|portal|wheat|potato|neep|farmland|reed|fern|flower|grass\b|thistle|sapling|bluebell|daffodil|dandelion/;
  function blocks() { try {
    const job = [];
    for (const k in ICON_KEY) { const id = +k, n = nm(id); if (!n || SKIP(id) || MINE[id]) continue; if (!BLOCK_MATS[id] || (typeof isPlant === 'function' && isPlant(id))) continue; if (NONCUBE.test(n) && id !== 1 && id !== 198) continue; job.push([id, 0]); }
    for (const k in STAIRS) { const id = +k; if (SKIP(id)) continue; job.push([id, STAIRS[k][0]]); }
    job.push([65, 'door'], [66, 'door'], [251, 'ench']);
    const step = () => { const t0 = performance.now(); while (job.length && performance.now() - t0 < 3) {   /* v1.1.39: small slices in idle time */ const [id, b] = job.shift(); try {
        if (b === 'door') { if (NAMES[id]) put(id, url(finish(pDoor()))); continue; }
        if (b === 'ench') { if (NAMES[id]) put(id, url(pEnchant())); continue; }
        const F = facesOf(b || id); if (!F) continue; put(id, url(isoIcon(F, !!b))); U.iso++; } catch (e) { warn('iso' + id, e); } }
      if (job.length) (window.requestIdleCallback ? requestIdleCallback(() => step(), {timeout: 600}) : setTimeout(step, 40)); else { U.log.push('iso ' + U.iso); setTimeout(rest, 300); } };
    setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(() => step(), {timeout: 600}) : setTimeout(step, 40)), 12000); } catch (e) { warn('blocks', e); } }
  function rest() { const ids = Object.keys(ICONS).map(Number).filter(id => !SKIP(id) && !MINE[id] && typeof ICONS[id] === 'string' && ICONS[id].startsWith('data:image'));
    let i = 0; const next = () => { if (i >= ids.length) { U.log.push('finished ' + U.finished); U.ready = 1; return; } const id = ids[i++], src = ICONS[id];
      const im = new Image(); im.onload = () => { try { if (ICONS[id] === src && !MINE[id]) { put(id, url(finish(im))); U.finished++; } } catch (e) { warn('fin' + id, e); } (window.requestIdleCallback ? requestIdleCallback(() => next(), {timeout: 600}) : setTimeout(next, 40)); }; im.onerror = () => setTimeout(next, 4); im.src = src; };
    next(); }
  /* keep ours when an older part re-asserts its old icon */
  setInterval(() => { try { let ch = 0; for (const id in MINE) if (ICONS[id] !== MINE[id] && (ICONS[id] === OLD[id] || ICON_KEY[id])) { ICONS[id] = MINE[id]; delete ICON_KEY[id]; ch++; }
    if (ch || dirty) { dirty = false; try { renderHotbar(); } catch (_) {} } } catch (_) {} }, 1500);
  const texReady = () => typeof texDone !== 'undefined' && texDone >= texTotal && texImg.grass_top && texImg.stone && (!window.__c121 || __c121.ready);
  let tries = 0; const go = () => { if (!texReady() && tries++ < 60) return setTimeout(go, 500); paintAll(); };
  setTimeout(go, 300);
  U.repaint = () => { paintAll(); };
  /* ---------- 3) 3D card models: the HD icon with real thickness, for drops and any held item that was a flat sprite ---------- */
  /* v1.0.4: real extruded models - lit front/back faces plus side walls traced from the icon's own outline, so the depth shows from every angle (walking, swaying, third person) */
  const cardTex = {}, MR = PHN || PERF ? 32 : 48, TH = 0.085, masks = {};
  const modelU = id => (U.MODEL && U.MODEL[id]) || ICONS[id];
  function cardMats(id) { const u = modelU(id); if (!u) return null; const c = cardTex[id]; if (c && c.u === u) return c.m;
    const t = new THREE.TextureLoader().load(u); try { if (renderer.outputEncoding === THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; } catch (_) {}
    t.anisotropy = Math.min(PHN ? 4 : 8, (renderer.capabilities.getMaxAnisotropy && renderer.capabilities.getMaxAnisotropy()) || 1); t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
    const front = new THREE.MeshLambertMaterial({map: t, alphaTest: 0.45, side: THREE.DoubleSide, emissive: 0x1a1a1a});
    const edge = new THREE.MeshLambertMaterial({map: t, color: 0xa8a8a8, emissive: 0x101010, side: THREE.DoubleSide});
    cardTex[id] = {u, m: [front, edge]}; return cardTex[id].m; }
  function sideGeo(a) { const P = [], N = [], UV = [], R = MR, h = TH / 2, on = (i, j) => i >= 0 && j >= 0 && i < R && j < R && a[j * R + i];
    const quad = (p, n, u, v) => { for (const k of [0, 1, 2, 0, 2, 3]) { P.push(...p[k]); N.push(...n); UV.push(u, v); } };
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) { if (!on(i, j)) continue; const x0 = -.5 + i / R, x1 = x0 + 1 / R, y1 = .5 - j / R, y0 = y1 - 1 / R, u = (i + .5) / R, v = 1 - (j + .5) / R;
      if (!on(i - 1, j)) quad([[x0, y0, -h], [x0, y0, h], [x0, y1, h], [x0, y1, -h]], [-1, 0, 0], u, v);
      if (!on(i + 1, j)) quad([[x1, y0, h], [x1, y0, -h], [x1, y1, -h], [x1, y1, h]], [1, 0, 0], u, v);
      if (!on(i, j - 1)) quad([[x0, y1, h], [x1, y1, h], [x1, y1, -h], [x0, y1, -h]], [0, 1, 0], u, v);
      if (!on(i, j + 1)) quad([[x0, y0, -h], [x1, y0, -h], [x1, y0, h], [x0, y0, h]], [0, -1, 0], u, v); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.computeBoundingSphere(); return g; }
  function maskFor(u, cb) { let m = masks[u]; if (m && m.geo) return cb(m.geo); if (!m) { m = masks[u] = {cbs: []}; const im = new Image();
      im.onload = () => { try { const c = cv(MR), g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, MR, MR); const d = g.getImageData(0, 0, MR, MR).data, a = new Uint8Array(MR * MR);
          for (let k = 0; k < MR * MR; k++) a[k] = d[k * 4 + 3] > 115 ? 1 : 0; m.geo = sideGeo(a); U.sides = (U.sides || 0) + 1; } catch (e) { warn('mask', e); m.geo = new THREE.BufferGeometry(); } m.cbs.splice(0).forEach(f => { try { f(m.geo); } catch (_) {} }); };
      im.src = u; } m.cbs.push(cb); }
  const planeG = new THREE.PlaneGeometry(1, 1), emptyG = new THREE.BufferGeometry();
  function cardMesh(id, size, thick) { const M = cardMats(id); if (!M) return null; const tk = thick || 1; const root = new THREE.Mesh(emptyG, M[1]); const fz = TH / 2;
    const f = new THREE.Mesh(planeG, M[0]); f.position.z = fz; root.add(f); const b = new THREE.Mesh(planeG, M[0]); b.position.z = -fz; b.rotation.y = Math.PI; root.add(b);
    maskFor(modelU(id), g => { root.geometry = g; });
    root.scale.set(size, size, size * tk); root.userData.c122card = id; return root; }
  const isShield = id => /shield|targe/i.test(String(NAMES[id] || '')) || [186, 224, 225].includes(+id);
  U.cardMesh = cardMesh;
  /* warm up the models for whatever is on the hotbar so switching items never shows an empty hand while the texture loads */
  setInterval(() => { try { if (!started || !U.ready) return; const hb = (typeof MODE !== 'undefined' && MODE.hotbar) || []; for (const id of hb) { if (id == null || id < 0) continue; const u = modelU(id); if (!u) continue; cardMats(id); maskFor(u, () => {}); } } catch (_) {} }, 1500);
  try { const di = dropItem; dropItem = function (id) { const n0 = drops.length, last = drops[drops.length - 1]; const r = di.apply(this, arguments);
      try { const d = drops[drops.length - 1]; if (d && d !== last && d.m && d.m.isSprite) { const c = cardMesh(d.id, 0.36); if (c) { c.position.copy(d.m.position); scene.remove(d.m); scene.add(c); d.m = c; } } } catch (e) { warn('drop', e); }
      return r; }; } catch (e) { warn('dropwrap', e); }
  try { const mi = makeItemMesh; makeItemMesh = function (id) { const g = mi.apply(this, arguments);
      try { if (g && g.children && !(g.userData && (g.userData.block || g.userData.map))) { const kids = g.children.slice();
          if (!ICONS[id] && !(U.MODEL && U.MODEL[id])) for (const s of kids) { const im = s.isSprite && s.material && s.material.map && s.material.map.image; if (!im || !im.width) continue;
            try { const c = cv(Math.max(128, Math.min(512, im.width))), x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height); (U.MODEL = U.MODEL || {})[id] = c.toDataURL(); } catch (_) {} break; }
          for (const s of kids) if (s.isSprite && s.material && s.material.blending !== THREE.AdditiveBlending && s.material.map) { const sh = isShield(id), c = cardMesh(id, s.scale.x * (sh ? 1.0 : 0.95), sh ? 1.7 : 1); if (!c) continue;
            if (sh) { /* worn on the forearm: side-on and angled, with a leather strap and grip on the back */ c.position.set(-0.07, 0.0, 0.03); c.rotation.set(0.06, -0.55, 0.06); c.scale.multiplyScalar(1.35);
              const strapM = new THREE.MeshLambertMaterial({color: 0x4a2e18}); const st = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.05), strapM); st.position.z = -0.075; c.add(st);
              const gr = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.3, 0.06), strapM); gr.position.z = -0.09; c.add(gr); g.userData.shield = true; }
            else { c.position.set(0, -0.005, 0.05); c.rotation.set(0.1, -0.7, 0.06); c.scale.multiplyScalar(1.15); }
            g.remove(s); g.add(c); g.userData.c122card = true; } } } catch (e) { warn('held', e); }
      return g; }; } catch (e) { warn('miwrap', e); }
  /* ---------- 4) sharper block textures: everything below the target size is re-sampled up and given fine detail; max anisotropy ---------- */
  const TGT = PERF ? 512 : PHN ? 512 : 1024; U.target = TGT;
  let ANI = 1; try { ANI = Math.min(PHN ? 8 : 16, renderer.capabilities.getMaxAnisotropy()); } catch (_) {}
  U.aniso = ANI;
  function upscale() { let n = 0; try {
    for (const k in texCache) { const t = texCache[k], c = t.image; if (!c || !c.width || c.width !== c.height || c.width >= TGT || !(c instanceof HTMLCanvasElement)) continue; if (/^(br_|keep_|portal|water|lava)/.test(k)) continue;
      const d = cv(TGT), g = d.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      /* step up in two passes so the edges stay crisp, then a fine grain that only lands on opaque pixels */
      const mid = cv(Math.min(TGT, c.width * 2)), mg = mid.getContext('2d'); mg.imageSmoothingQuality = 'high'; mg.drawImage(c, 0, 0, mid.width, mid.width);
      g.drawImage(mid, 0, 0, TGT, TGT); g.globalCompositeOperation = 'source-atop'; const R = rng(k.length * 97 + c.width);
      for (let i = 0; i < TGT * 6; i++) { g.fillStyle = R() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; const s = 1 + R() * 2; g.fillRect(R() * TGT, R() * TGT, s, s); }
      g.globalCompositeOperation = 'source-over';
      texImg[k] = d; t.image = d; t.anisotropy = ANI; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true; n++; }
    for (const k in texCache) { const t = texCache[k]; if (t.anisotropy < ANI) { t.anisotropy = ANI; t.needsUpdate = true; } }
  } catch (e) { warn('upscale', e); } U.up = (U.up || 0) + n; return n; }
  let upT = 0; const upIv = setInterval(() => { if (!texReady()) return; upscale(); if (++upT >= 3) clearInterval(upIv); }, 4000);
  /* ---------- 5) HUD: glass panels, glossy hearts + drumsticks, gold selection, richer XP bar; no clock banner ---------- */
  function heart(kind) { return url(paint(g => { const pth = () => { g.beginPath(); g.moveTo(50, 88); g.bezierCurveTo(14, 64, 4, 40, 14, 24); g.bezierCurveTo(24, 8, 44, 10, 50, 26); g.bezierCurveTo(56, 10, 76, 8, 86, 24); g.bezierCurveTo(96, 40, 86, 64, 50, 88); g.closePath(); };
    pth(); g.fillStyle = 'rgba(30,6,10,.85)'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#1a0406'; g.stroke();
    if (kind) { g.save(); pth(); g.clip(); if (kind === 1) { g.beginPath(); g.rect(0, 0, 50, 100); g.clip(); }
      g.fillStyle = rg(g, 36, 30, 2, 70, [[0, '#ff9aa4'], [.3, '#f03a4c'], [.75, '#b0142a'], [1, '#600814']]); g.fillRect(0, 0, 100, 100);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(30, 30, 10, 6, -.6, 0, 7); g.fill(); g.restore(); }
    else { g.save(); pth(); g.clip(); g.fillStyle = rg(g, 40, 30, 2, 70, [[0, '#5a3a3e'], [1, '#26161a']]); g.fillRect(0, 0, 100, 100); g.restore(); }
    pth(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.18)'; g.stroke(); }, 64)); }
  function drum(kind) { return url(paint(g => { const meat = () => { g.beginPath(); g.ellipse(58, 40, 30, 24, -.7, 0, 7); };
    const on = kind === 2, full = c => on ? c : kind === 1 ? c : '#3a2a20';
    g.save(); g.translate(0, 0); g.lineWidth = 9; g.strokeStyle = '#1a0e06'; g.beginPath(); g.moveTo(40, 60); g.lineTo(20, 80); g.stroke();
    g.lineWidth = 6; g.strokeStyle = kind ? '#f4eee0' : '#5a5248'; g.stroke();
    for (const [x, y] of [[14, 78], [22, 88]]) { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fillStyle = kind ? '#f4eee0' : '#5a5248'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1a0e06'; g.stroke(); }
    meat(); g.lineWidth = 6; g.strokeStyle = '#1a0e06'; g.stroke();
    meat(); g.fillStyle = kind ? rg(g, 50, 28, 2, 44, [[0, '#ffc070'], [.4, '#d8742c'], [1, '#7a3410']]) : rg(g, 50, 30, 2, 44, [[0, '#4a3828'], [1, '#2a1c12']]); g.fill();
    if (kind === 1) { g.save(); meat(); g.clip(); g.fillStyle = 'rgba(30,20,14,.85)'; g.fillRect(0, 0, 54, 100); g.restore(); }
    if (kind) { g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(54, 26, 9, 5, -.7, 0, 7); g.fill(); } g.restore(); }, 64)); }
  try { const H = {f: heart(2), h: heart(1), e: heart(0)}, D = {f: drum(2), h: drum(1), e: drum(0)}; U.hudIcons = {H, D};
    const st = document.createElement('style'); st.id = 'c122hud';
    st.textContent =
      '#clockW{display:none!important}' +
      '#hotbar{background:linear-gradient(180deg,rgba(34,44,38,.82),rgba(8,12,10,.9))!important;border:1px solid rgba(242,214,140,.42)!important;border-radius:14px!important;box-shadow:0 8px 22px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.14),inset 0 -2px 0 rgba(0,0,0,.4)!important;padding:6px!important;gap:5px!important}' +
      '.slot{background-color:#0e1511!important;border:1.5px solid rgba(255,255,255,.16)!important;border-radius:9px!important;box-shadow:inset 0 3px 6px rgba(0,0,0,.65),inset 0 -1px 0 rgba(255,255,255,.08)!important;background-size:86% 86%!important;background-position:center!important}' +
      '.slot.sel{border-color:#f2c440!important;box-shadow:0 0 0 2px rgba(242,196,64,.3),0 0 16px rgba(242,196,64,.6),inset 0 0 10px rgba(242,196,64,.25)!important;transform:translateY(-4px) scale(1.06)!important}' +
      '.slot b{font-size:12px!important}' +
      '#statBar .ht,.ht{color:transparent!important;font-size:0!important;background:url(' + H.e + ') center/100% 100% no-repeat!important;image-rendering:auto!important}' +
      '#statBar .ht.on,.ht.on{background-image:url(' + H.f + ')!important}#statBar .ht.half,.ht.half{background-image:url(' + H.h + ')!important}' +
      '#statBar .hg{background:url(' + D.e + ') center/100% 100% no-repeat!important;image-rendering:auto!important}#statBar .hg.on{background-image:url(' + D.f + ')!important}#statBar .hg.half{background-image:url(' + D.h + ')!important}' +
      '#statBar .row{gap:2px!important;filter:drop-shadow(0 1px 2px rgba(0,0,0,.7))!important}' +
      '#xpBar{height:8px!important;border-radius:5px!important;background:linear-gradient(180deg,rgba(0,0,0,.7),rgba(20,30,20,.7))!important;border:1px solid rgba(242,214,140,.5)!important;box-shadow:0 2px 6px rgba(0,0,0,.5)!important;overflow:visible}' +
      '#xpBar>i{border-radius:5px!important;background:linear-gradient(180deg,#e4ff9a 0%,#8ef040 45%,#3c9a18 100%)!important;box-shadow:0 0 8px rgba(140,255,64,.55);position:relative;overflow:hidden}' +
      '#xpBar>i:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.55) 50%,transparent 100%);background-size:60px 100%;background-repeat:no-repeat;animation:c122xp 2.4s linear infinite}' +
      '@keyframes c122xp{from{background-position:-60px 0}to{background-position:420px 0}}' +
      '#xpBar>b{font:900 15px/1 system-ui,sans-serif!important;color:#b8ff60!important;text-shadow:0 0 4px #000,0 1px 0 #1a3a08,0 0 10px rgba(140,255,64,.6)!important}' +
      '#vitals,#goal{border-radius:12px}#itemName{font-weight:800;letter-spacing:.03em;text-shadow:0 2px 4px #000,0 0 10px rgba(242,196,64,.35)}';
    document.head.appendChild(st); } catch (e) { warn('hud', e); }
  /* ---------- 6) menus: real in-game shots behind the title + loading screens, ALPHA tag, short OSM credit, 3D block spinner ---------- */
  try { const SH = ['castle', 'sunset', 'isle', 'mossy'];
    const st = document.createElement('style'); st.id = 'c122menu';
    st.textContent = '#scr-title,#scr-loading,#scr-boot,#scr-worlds,#scr-create{isolation:isolate}' +
      '.c122bg{position:absolute;inset:0;z-index:-1;overflow:hidden;background:#0a120c;pointer-events:none}' +
      '.c122bg i{position:absolute;inset:-4%;background:center/cover no-repeat;opacity:0;transition:opacity 1.8s ease;will-change:opacity,transform}' +
      '.c122bg i.on{opacity:1;animation:c122kb 16s ease-in-out infinite alternate}' +
      '.scr:not(.on) .c122bg i{animation:none!important}' +
      '@keyframes c122kb{from{transform:scale(1.02) translate(0,0)}to{transform:scale(1.12) translate(-2%,-1.5%)}}' +
      '.c122bg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,10,8,.82) 0%,rgba(6,10,8,.5) 40%,rgba(6,10,8,.08) 100%),linear-gradient(0deg,rgba(0,0,0,.45),transparent 40%)}' +
      '#scr-loading .c122bg:after,#scr-boot .c122bg:after{background:radial-gradient(90% 80% at 50% 45%,rgba(6,10,8,.35) 0%,rgba(6,10,8,.82) 100%)}' +
      '#osmCredit{font-size:10px!important;opacity:.55!important;left:auto!important;right:12px!important;max-width:40vw!important;text-align:right}';
    document.head.appendChild(st);
    const mk = (sc, start) => { const el = document.getElementById(sc); if (!el || el.querySelector('.c122bg')) return; const d = document.createElement('div'); d.className = 'c122bg'; d.setAttribute('aria-hidden', 'true'); d.dataset.testid = 'menu-background';
      SH.forEach((n, i) => { const im = document.createElement('i'); const probe = new Image(); probe.onload = () => { im.style.backgroundImage = 'url(bg/' + n + '.webp)'; im.dataset.ok = 1; }; probe.src = 'bg/' + n + '.webp'; d.appendChild(im); });
      el.insertBefore(d, el.firstChild); let k = start; const show = () => { const L = [...d.children].filter(x => x.dataset.ok); d.querySelectorAll('i').forEach(x => x.classList.remove('on')); if (!L.length) return; L[k % L.length].classList.add('on'); k++; };
      setTimeout(show, 400); setInterval(() => { if (el.classList.contains('on')) show(); }, 8000); };
    mk('scr-title', 0); mk('scr-loading', 1); mk('scr-boot', 2); mk('scr-worlds', 3); mk('scr-create', 3);
  } catch (e) { warn('bg', e); }
  try { const st = document.createElement('style'); st.id = 'c122alpha';
    st.textContent = '#scr-title .logoWrap,#scr-boot .logoWrap{max-width:none!important}#scr-title .logo{font-size:min(9.5vw,14vh)!important}.splash{left:calc(100% + 14px)!important;right:auto!important;top:50%!important;bottom:auto!important;transform:translateY(-50%)!important;font:800 clamp(12px,2.2vw,18px)/1 system-ui,"Segoe UI",sans-serif!important;letter-spacing:.32em!important;' +
      'color:#dff6f4!important;padding:6px 10px 6px 13px;border:1px solid rgba(160,230,224,.55);border-radius:999px;background:linear-gradient(135deg,rgba(40,90,96,.55),rgba(12,30,34,.7));' +
      'text-shadow:0 0 8px rgba(120,230,220,.6),0 1px 2px #000!important;box-shadow:0 0 14px rgba(90,210,200,.35);animation:c122alpha 2.6s ease-in-out infinite!important}' +
      '@keyframes c122alpha{0%,100%{box-shadow:0 0 8px rgba(90,210,200,.25);opacity:.85;transform:translateY(-50%)}50%{box-shadow:0 0 20px rgba(120,240,230,.6);opacity:1;transform:translateY(calc(-50% - 3px))}}' +
      '@media (max-width:640px){.splash{left:auto!important;right:0!important;top:auto!important;bottom:-1.9em!important;transform:none!important;animation:c122alpha2 2.6s ease-in-out infinite!important}}' +
      '@keyframes c122alpha2{0%,100%{opacity:.8}50%{opacity:1}}';
    document.head.appendChild(st);
    const fix = () => document.querySelectorAll('.splash').forEach(s => { if (s.textContent !== 'ALPHA') s.textContent = 'ALPHA'; });
    fix(); setInterval(fix, 1500);
    const credit = () => { const d = document.getElementById('osmCredit'); if (d && !d.dataset.c122) { d.dataset.c122 = 1; d.innerHTML = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" style="color:#bfe3a8">OpenStreetMap contributors</a>'; } };
    credit(); setTimeout(credit, 3200); setInterval(credit, 5000);
  } catch (e) { warn('alpha', e); }
  /* spinner faces from the real HD block textures */
  try { const faceUrl = key => { const s = smallFace(key); if (!s) return null; const c = cv(128); c.getContext('2d').drawImage(s, 0, 0, 128, 128); return c.toDataURL('image/jpeg', .85); };
    const sp = () => { const t = faceUrl('grass_top'), s = faceUrl('grass_side'), d = faceUrl('dirt'); if (!t || !s) return setTimeout(sp, 800);
      const r = document.documentElement.style; r.setProperty('--cubeT', 'url(' + t + ')'); r.setProperty('--cubeS', 'url(' + s + ')'); if (d) r.setProperty('--cubeB', 'url(' + d + ')'); };
    setTimeout(sp, 500); } catch (e) { warn('spin', e); }
  /* ---------- 7) one rule for every category (crafting tabs + bag) ---------- */
  const OVR = {330: 'tools'};   // gamepad sits with the remote
  function categorise(item) { const id = +(item && item.out !== undefined ? item.out : item); if (OVR[id]) return OVR[id]; const n = nm(id);
    let VARI = null; try { VARI = window.__c121 && __c121.VARI; } catch (_) {}
    if ((VARI && VARI[id]) || /\b(stairs|slab|door|trapdoor|fence|gate|boat|motorboat|bricks?)\b/.test(n)) return 'blocks';
    if (TOOL[id] || (typeof GUN !== 'undefined' && GUN[id]) || /remote|sword|blade|claymore|pickaxe|\baxe\b|shovel|\bhoe\b|shears|bucket|lighter|flint and steel|pistol|rifle|musket|\bbomb\b|\bbow\b|fishing rod/.test(n)) return 'tools';
    if (ARMOUR[id] || /shield|targe|helmet|chestplate|leggings|boots|jetpack/.test(n)) return 'armour';
    if (FOOD[id] || DRINKS.has(id)) return 'food';
    if (PLACEABLE.has(id) || /\bore\b/.test(n) || (FACES[id] && BLOCK_MATS[id] && id < 300 && !(typeof isPlant === 'function' && isPlant(id)) && !/water|lava|portal|farmland|wheat|potato|neep|tall grass|fire/.test(n))) return 'blocks';
    return 'items'; }
  window.categorise = categorise; U.categorise = categorise;
  try { CATS.length = 0; CATS.push(['blocks', 'Blocks'], ['tools', 'Tools'], ['armour', 'Armour'], ['food', 'Food & brews'], ['items', 'Items']);
    if (!CAT_ICON.blocks) CAT_ICON.blocks = T.STONEBRICK || 28; if (!['blocks', 'tools', 'armour', 'food', 'items'].includes(craftCat)) craftCat = 'blocks'; try { if (typeof buildCraftList === 'function' && document.getElementById('recipes')) buildCraftList(); } catch (e2) { warn('cats2', e2); } } catch (e) { warn('cats', e); }
  try { const stale = () => { const b = document.querySelector('[data-testid=craft-categories]'); return !b || !!b.querySelector('[data-testid=craft-cat-struct]') || !b.querySelector('[data-testid=craft-cat-items]'); };
    const fix = () => { try { if (stale() && typeof buildCraftList === 'function' && document.getElementById('recipes')) { if (!['blocks', 'tools', 'armour', 'food', 'items'].includes(craftCat)) craftCat = 'blocks'; buildCraftList(); U.rebuilt = (U.rebuilt || 0) + 1; } } catch (e) { warn('fixbar', e); } };
    const st = setTab; setTab = function (t) { if (t === 'craft') fix(); return st.apply(this, arguments); };
    setInterval(fix, 2000); } catch (e) { warn('tabhook', e); }
  U.done = 1;
})();
/* ===================== v1.0.4: freeze time really freezes - the clock, sun/moon, sky and lighting hold still while it is on ===================== */
(function c122k() {
  const U = window.__c122 || (window.__c122 = {errs: []});
  try { const us = updateSky; updateSky = function (dt) { let fz = false; try { fz = !!(window.__c68 && __c68().freeze); } catch (_) {}
      if (!fz) return us.apply(this, arguments);
      const c = dayClock, n = typeof dayNum !== 'undefined' ? dayNum : null; let r;
      try { r = us.apply(this, arguments); } finally { dayClock = c; if (n !== null && dayNum !== n) dayNum = n; }
      return r; };
    U.freezeFix = 1; } catch (e) { (U.errs || []).push('freeze: ' + (e && e.message || e)); }
})();
