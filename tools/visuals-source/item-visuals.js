/* GLX-V126 (v1.2.6): item visuals. Procedural 256px icons (mobile budget, not a 4K atlas): isometric grass block (grass top,
   dirt sides with grass fringe), isometric chest (planks, iron bands, latch), isometric polished aqua diamond block (its own
   d259 tile on all three visible faces), a folded relief map, a detailed bread loaf and rotten flesh. Blocks keep their real
   3D cube meshes in hand and as drops (BLOCK_MATS); world chest interaction is untouched. */
(function v126() {
  const U = window.__v126 = {err: null, icons: {}, applied: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const S = 256, mk = () => { const c = document.createElement('canvas'); c.width = c.height = S; return c; };
  const rng = seed => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };
  // ---- small face textures (64px) ----
  function tile(fn, seed) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); fn(g, rng(seed)); return c; }
  const speck = (g, R, cols, n, sz) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[R() * cols.length | 0]; g.fillRect(R() * 64 | 0, R() * 64 | 0, sz, sz); } };
  const grassTop = () => tile((g, R) => { g.fillStyle = '#4f9a32'; g.fillRect(0, 0, 64, 64); speck(g, R, ['#3e8226', '#62b03c', '#7cc44a', '#376f22'], 420, 3); }, 11);
  const grassSide = () => tile((g, R) => { g.fillStyle = '#7a5232'; g.fillRect(0, 0, 64, 64); speck(g, R, ['#5e3e24', '#8e6440', '#a07450', '#4c3220'], 300, 3);
    g.fillStyle = '#4f9a32'; g.fillRect(0, 0, 64, 12); for (let x = 0; x < 64; x += 3) { const h = 12 + (R() * 9 | 0); g.fillStyle = R() < .5 ? '#4f9a32' : '#3e8226'; g.fillRect(x, 0, 3, h); } }, 12);
  const plank = (lid) => tile((g, R) => { g.fillStyle = '#9a6a36'; g.fillRect(0, 0, 64, 64); for (let y = 0; y < 64; y += 16) { g.fillStyle = 'rgba(60,34,12,.55)'; g.fillRect(0, y, 64, 2); for (let i = 0; i < 40; i++) { g.fillStyle = R() < .5 ? 'rgba(120,80,40,.5)' : 'rgba(180,130,70,.35)'; g.fillRect(R() * 64 | 0, y + 2 + (R() * 13 | 0), 6 + (R() * 10 | 0), 1); } }
    g.fillStyle = '#3a3a40'; g.fillRect(0, 0, 64, 4); g.fillRect(0, 60, 64, 4); g.fillRect(0, 0, 4, 64); g.fillRect(60, 0, 4, 64);
    if (lid === 'front') { g.fillStyle = '#2a2a30'; g.fillRect(0, 22, 64, 3); g.fillStyle = '#d8b040'; g.fillRect(27, 18, 10, 14); g.fillStyle = '#6a4a10'; g.fillRect(30, 24, 4, 5); g.fillStyle = 'rgba(255,240,180,.8)'; g.fillRect(28, 19, 3, 2); } }, lid === 'front' ? 21 : 22);
  // ---- isometric cube painter ----
  const PJ = (x, y, z) => [S / 2 + (x - z) * S * 0.36, S * 0.5 + (x + z) * S * 0.205 - y * S * 0.42 - S * 0.02];
  function face(g, img, O, A, B, dark) { g.save(); g.beginPath(); g.moveTo(O[0], O[1]); g.lineTo(A[0], A[1]); g.lineTo(A[0] + B[0] - O[0], A[1] + B[1] - O[1]); g.lineTo(B[0], B[1]); g.closePath(); g.clip();
    g.setTransform((A[0] - O[0]) / img.width, (A[1] - O[1]) / img.width, (B[0] - O[0]) / img.height, (B[1] - O[1]) / img.height, O[0], O[1]); g.drawImage(img, -0.5, -0.5, img.width + 1, img.height + 1); g.setTransform(1, 0, 0, 1, 0, 0);
    if (dark) { g.fillStyle = 'rgba(0,0,0,' + dark + ')'; g.fillRect(0, 0, S, S); } g.restore(); }
  function iso(top, front, right) { const c = mk(), g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(S / 2, S * .9, S * .33, S * .06, 0, 0, 7); g.fill();
    face(g, top, PJ(0, 1, 0), PJ(1, 1, 0), PJ(0, 1, 1), 0); face(g, front, PJ(0, 1, 1), PJ(1, 1, 1), PJ(0, 0, 1), .18); face(g, right, PJ(1, 1, 1), PJ(1, 1, 0), PJ(1, 0, 1), .34);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath(); const a = PJ(0, 1, 1), b = PJ(1, 1, 1), d = PJ(1, 1, 0); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(d[0], d[1]); g.stroke(); return c; }
  // ---- flat painted items at 256 ----
  function draw(fn) { const c = mk(), g = c.getContext('2d'); g.translate(S / 2, S / 2); g.scale(4, 4); g.lineJoin = g.lineCap = 'round'; fn(g); return c; }
  const lg = (g, x0, y0, x1, y1, st) => { const r = g.createLinearGradient(x0, y0, x1, y1); for (const [p, c] of st) r.addColorStop(p, c); return r; };
  const mapIcon = () => draw(g => { g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2, 27, 26, 4, 0, 0, 7); g.fill();
    const P = [[-26, -18], [-9, -22], [9, -18], [26, -22], [26, 20], [9, 24], [-9, 20], [-26, 24]];
    const pan = (i, col) => { g.beginPath(); g.moveTo(...P[i]); g.lineTo(...P[i + 1]); g.lineTo(...P[6 - i]); g.lineTo(...P[7 - i]); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = '#5a4020'; g.lineWidth = 1; g.stroke(); };
    pan(0, lg(g, -26, 0, -9, 0, [[0, '#d9c48e'], [1, '#efe0b4']])); pan(1, lg(g, -9, 0, 9, 0, [[0, '#c8b27c'], [1, '#e6d4a2']])); pan(2, lg(g, 9, 0, 26, 0, [[0, '#dccaa0'], [1, '#bfa874']]));
    g.save(); g.beginPath(); P.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.clip();
    g.fillStyle = 'rgba(60,130,200,.55)'; g.beginPath(); g.ellipse(14, 10, 12, 9, 0.4, 0, 7); g.fill();
    g.fillStyle = 'rgba(80,140,60,.6)'; g.beginPath(); g.moveTo(-22, 14); g.bezierCurveTo(-18, -4, -4, -14, 6, -10); g.bezierCurveTo(10, 0, 2, 10, -6, 16); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(110,80,40,.7)'; g.lineWidth = .7; for (const r of [4, 7, 10]) { g.beginPath(); g.ellipse(-8, 0, r, r * .7, -.3, 0, 7); g.stroke(); }
    g.strokeStyle = '#b02020'; g.lineWidth = 1.2; g.setLineDash([2, 2]); g.beginPath(); g.moveTo(-20, 18); g.quadraticCurveTo(-2, 4, 12, 8); g.stroke(); g.setLineDash([]);
    g.strokeStyle = '#c01818'; g.lineWidth = 2; g.beginPath(); g.moveTo(9, 5); g.lineTo(15, 11); g.moveTo(15, 5); g.lineTo(9, 11); g.stroke(); g.restore();
    g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.moveTo(-9, -22); g.lineTo(-6, -21); g.lineTo(-6, 20); g.lineTo(-9, 20); g.fill(); g.beginPath(); g.moveTo(9, -18); g.lineTo(12, -19); g.lineTo(12, 23); g.lineTo(9, 24); g.fill();
    g.fillStyle = '#e8d6a8'; g.font = 'bold 7px Georgia,serif'; g.textAlign = 'center'; g.fillText('N', 20, -12); });
  const bread = () => draw(g => { const R = rng(35); g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2, 18, 28, 5, 0, 0, 7); g.fill();
    g.fillStyle = lg(g, 0, -14, 0, 16, [[0, '#d99a4e'], [0.5, '#b8722e'], [1, '#7a4416']]); g.beginPath(); g.ellipse(0, 3, 28, 15, -0.08, 0, 7); g.fill(); g.strokeStyle = '#5a300e'; g.lineWidth = 1.2; g.stroke();
    g.fillStyle = lg(g, 0, -12, 0, 4, [[0, '#f0c27a'], [1, '#c4843c']]); g.beginPath(); g.ellipse(0, -1, 25, 10, -0.08, Math.PI, 2 * Math.PI); g.fill();
    for (const x of [-15, -5, 5, 15]) { g.save(); g.translate(x, -3); g.rotate(-0.55); g.fillStyle = '#f7dcaa'; g.beginPath(); g.ellipse(0, 0, 6, 2, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(120,60,18,.7)'; g.beginPath(); g.ellipse(0, 1.2, 6, 0.9, 0, 0, Math.PI); g.fill(); g.restore(); }
    for (let i = 0; i < 70; i++) { g.fillStyle = R() < .5 ? 'rgba(255,245,220,.8)' : 'rgba(110,60,20,.45)'; g.beginPath(); g.arc(-24 + R() * 48, -8 + R() * 18, 0.3 + R() * 0.5, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,240,210,.4)'; g.beginPath(); g.ellipse(-9, -8, 11, 2.4, -0.15, 0, 7); g.fill(); });
  const flesh = () => draw(g => { const R = rng(320); g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2, 22, 24, 4, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-22, 6); g.bezierCurveTo(-26, -10, -8, -20, 4, -16); g.bezierCurveTo(18, -20, 26, -6, 22, 6); g.bezierCurveTo(18, 18, -2, 22, -12, 18); g.closePath();
    g.fillStyle = lg(g, -20, -16, 20, 20, [[0, '#9a5a4a'], [0.45, '#7a3e34'], [1, '#4a2a22']]); g.fill(); g.strokeStyle = '#2e1a14'; g.lineWidth = 1.2; g.stroke();
    g.save(); g.clip(); for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(${90 + R() * 40 | 0},${120 + R() * 40 | 0},${50 + R() * 20 | 0},.55)`; g.beginPath(); g.ellipse(-18 + R() * 36, -12 + R() * 26, 3 + R() * 5, 2 + R() * 3, R() * 3, 0, 7); g.fill(); }
      g.strokeStyle = 'rgba(230,200,170,.55)'; g.lineWidth = 1.4; for (let i = 0; i < 4; i++) { g.beginPath(); const y = -10 + i * 7; g.moveTo(-18, y); g.bezierCurveTo(-6, y - 4, 6, y + 4, 18, y - 1); g.stroke(); }
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(40,20,14,.6)'; g.beginPath(); g.arc(-20 + R() * 40, -14 + R() * 30, 0.3 + R() * 0.6, 0, 7); g.fill(); } g.restore();
    g.fillStyle = '#e8dcc0'; g.beginPath(); g.ellipse(17, -8, 4, 3, 0.6, 0, 7); g.fill(); g.strokeStyle = '#7a6a50'; g.lineWidth = .8; g.stroke();
    g.fillStyle = 'rgba(200,230,140,.25)'; g.beginPath(); g.ellipse(-6, -10, 8, 2, -0.3, 0, 7); g.fill(); });
  function build() {
    const out = {};
    const gt = grassTop(), gs = grassSide(); out[T.GRASS] = iso(gt, gs, gs);
    out[T.CHEST] = iso(plank('top'), plank('front'), plank('side'));
    try { const DB = T.DIAMONDBLOCK; if (DB && window.__d259 && __d259.paint) { const d = __d259.paint(128); out[DB] = iso(d, d, d); } } catch (e) { ERR('db', e); }
    if (IT.MAP) out[IT.MAP] = mapIcon(); if (IT.BREAD) out[IT.BREAD] = bread(); if (IT.ROTTEN) out[IT.ROTTEN] = flesh();
    for (const k in out) U.icons[k] = out[k].toDataURL(); U.canvases = out; return U.icons; }
  const set = (id, url) => { try { if (window.__c121 && __c121.setIcon) __c121.setIcon(id, url); } catch (_) {} ICONS[id] = url; try { delete ICON_KEY[id]; } catch (_) {} try { delete spriteMats[id]; } catch (_) {} };
  U.apply = () => { let n = 0; for (const k in U.icons) if (ICONS[k] !== U.icons[k]) { set(+k, U.icons[k]); n++; } if (n) { U.applied += n; try { renderHotbar(); } catch (_) {} } return n; };
  U.build = build;
  // bounded: later icon owners run on timers during boot, so re-assert ours for ~2 minutes, then stop
  let tries = 0; const iv = setInterval(() => { try { if (typeof ICONS === 'undefined' || !ICONS[IT.BREAD]) return; if (!Object.keys(U.icons).length) build(); U.apply(); } catch (e) { ERR('apply', e); } if (++tries > 120) clearInterval(iv); }, 1000);
})();
