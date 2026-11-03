/* ===================== GLX-C93 (v0.9.71): GTA-style HUD minimap + full map in the pause menu =====================
   Built from the same picture as the established biome map (__bio / bioPNG): the real top block of every column with the
   in-game grass tint per biome, water, castles and the spawn. One cached world-sized canvas filled 16x16 tiles at a time
   (a few ms every 250 ms) only where you have explored; the HUD square is redrawn at 4 Hz and only rotated / slid by CSS
   in between, so it costs next to nothing on the phone. */
(function c93() {
  const TS = 16, RAD = 56;                      // tile size, explore radius (blocks)
  const M = {key: '', tw: 0, td: 0, done: null, seen: null, dirty: null, hm: null, q: [], built: 0, open: false, seenDirty: false};
  window.__map = M;
  const mc = document.createElement('canvas'); let mg = null;
  const hexRGB = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  const topKey = id => { const f = FACES[id]; return Array.isArray(f) ? f[2] : f; };
  const COLC = {};
  const colOf = id => { let c = COLC[id]; if (c) return c; const k = topKey(id); c = COLC[id] = hexRGB((k && AVG[k]) || 0x777777); return c; };
  const GRASS = () => colOf(T.GRASS);
  const sky = id => id === T.AIR || !FACES[id];   // plants, torches, flowers: look through them to the ground
  const wkey = () => ((typeof current !== 'undefined' && current && current.id) || 'x') + (current && current.created ? '@' + current.created : '') + '|' + W + '|' + D + '|' + (typeof genVer !== 'undefined' ? genVer : 0) + '|' + ((typeof DIM !== 'undefined' && DIM.cur) || '');
  function reset() {
    M.key = wkey(); M.tw = Math.ceil(W / TS); M.td = Math.ceil(D / TS); const n = M.tw * M.td;
    M.done = new Uint8Array(n); M.seen = new Uint8Array(n); M.dirty = new Uint8Array(n); M.hm = new Int16Array(W * D).fill(-1); M.q = []; M.built = 0;
    mc.width = W; mc.height = D; mg = mc.getContext('2d'); mg.clearRect(0, 0, W, D);
    try { const s = localStorage.getItem('glen_mapx_' + M.key); if (s) { const b = atob(s); for (let i = 0; i < n && i < b.length * 8; i++) if (b.charCodeAt(i >> 3) & (1 << (i & 7))) M.seen[i] = 1; } } catch (_) {}
    for (let i = 0; i < n; i++) if (M.seen[i]) M.q.push(i);
  }
  function saveSeen() { if (!M.seenDirty || !M.seen) return; M.seenDirty = false; let s = ''; const n = M.seen.length;
    for (let i = 0; i < n; i += 8) { let c = 0; for (let j = 0; j < 8; j++) if (M.seen[i + j]) c |= 1 << j; s += String.fromCharCode(c); }
    try { const me = 'glen_mapx_' + M.key; for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.indexOf('glen_mapx_') === 0 && k !== me) localStorage.removeItem(k); } localStorage.setItem(me, btoa(s)); } catch (_) {} }
  // top of a column: [height, block id, water depth]
  function column(x, z) { let y = H - 1, b = 0;
    for (; y > 0; y--) { b = world[idx(x, y, z)]; if (!sky(b)) break; }
    let dep = 0; if (b === T.WATER) { let yy = y; while (yy > 0 && world[idx(x, yy, z)] === T.WATER) { yy--; dep++; } }
    M.hm[x * D + z] = y; return [y, b, dep]; }
  const hAt = (x, z) => { if (x < 0 || z < 0 || x >= W || z >= D) return -1; const h = M.hm[x * D + z]; return h >= 0 ? h : column(x, z)[0]; };
  function paintTile(i) {
    const tx = (i / M.td) | 0, tz = i % M.td, x0 = tx * TS, z0 = tz * TS, w = Math.min(TS, W - x0), d = Math.min(TS, D - z0);
    if (w <= 0 || d <= 0) return; const im = mg.createImageData(w, d), px = im.data;
    const bio = window.__bio && __bio.info.on ? __bio : null, g = GRASS();
    for (let dx = 0; dx < w; dx++) for (let dz = 0; dz < d; dz++) {
      const x = x0 + dx, z = z0 + dz, [h, b, dep] = column(x, z); let r, gg, bb;
      if (b === T.WATER) { const k = Math.min(1, dep / 7); r = 70 - 40 * k; gg = 130 - 60 * k; bb = 215 - 50 * k; }
      else { let c = b === T.GRASS ? g : colOf(b); r = c[0]; gg = c[1]; bb = c[2];
        if (bio && (b === T.GRASS || b === T.LEAVES)) { const t = bio.tint(x, z); r *= t[0]; gg *= t[1]; bb *= t[2]; }
        const hn = hAt(x, z - 1), hw = hAt(x - 1, z); const sl = ((hn >= 0 ? h - hn : 0) + (hw >= 0 ? h - hw : 0)) * 0.07;
        const s = 1 + Math.max(-0.3, Math.min(0.3, sl)) + (h - SEA) * 0.004; r *= s; gg *= s; bb *= s; }
      const o = (dz * w + dx) * 4; px[o] = r; px[o + 1] = gg; px[o + 2] = bb; px[o + 3] = 255; }
    mg.putImageData(im, x0, z0); M.done[i] = 1; M.dirty[i] = 0; M.built++;
  }
  // a changed block repaints its tile (if it is on the map already)
  const sb = setB; setB = function (x, y, z, b) { const r = sb.apply(this, arguments);
    if (M.done && x >= 0 && z >= 0 && x < W && z < D) { const i = ((x / TS) | 0) * M.td + ((z / TS) | 0); if (M.done[i]) M.dirty[i] = 1; } return r; };
  let refreshT = 0, saveT = 0;
  function tick() {
    if (!started) return; if (wkey() !== M.key) reset();
    const px = Math.floor(P.x), pz = Math.floor(P.z), ptx = Math.floor(px / TS), ptz = Math.floor(pz / TS), rt = Math.ceil(RAD / TS);
    for (let a = -rt; a <= rt; a++) for (let c = -rt; c <= rt; c++) { const tx = ptx + a, tz = ptz + c; if (tx < 0 || tz < 0 || tx >= M.tw || tz >= M.td) continue;
      if (Math.hypot((tx + 0.5) * TS - px, (tz + 0.5) * TS - pz) > RAD + 8) continue; const i = tx * M.td + tz; if (!M.seen[i]) { M.seen[i] = 1; M.seenDirty = true; M.q.push(i); } }
    if ((refreshT += 0.25) > 3) { refreshT = 0; for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) { const tx = ptx + a, tz = ptz + c; if (tx >= 0 && tz >= 0 && tx < M.tw && tz < M.td && M.done[tx * M.td + tz]) M.dirty[tx * M.td + tz] = 1; } }
    if ((saveT += 0.25) > 10) { saveT = 0; saveSeen(); }
    const t0 = performance.now(), budget = M.open ? 12 : 3;
    // nearest pending first
    const dist = i => Math.abs(((i / M.td) | 0) - ptx) + Math.abs(i % M.td - ptz);
    if (M.q.length > 1) M.q.sort((a, b) => dist(b) - dist(a));
    while (M.q.length && performance.now() - t0 < budget) { const i = M.q.pop(); if (!M.done[i]) paintTile(i); }
    for (let i = 0; i < M.dirty.length && performance.now() - t0 < budget + 1; i++) if (M.dirty[i]) paintTile(i);
    drawMini(); if (M.open) drawBig();
  }
  setInterval(() => { try { tick(); } catch (e) { if (!M.err) { M.err = 1; console.warn('map', e); } } }, 250);
  window.addEventListener('pagehide', saveSeen);
  const castles = () => (typeof g9castles !== 'undefined' && g9castles) || [];
  const spawn = () => (typeof g9spawn !== 'undefined' && g9spawn) || null;
  const cname = n => (n[0].toUpperCase() + n.slice(1)).replace(/^Black$/, 'Blackstone') + ' Castle';

  // ---------------- HUD minimap ----------------
  const st = document.createElement('style'); st.textContent = `
#miniMap{position:fixed;left:calc(12px + var(--sal,0px));bottom:calc(12px + var(--sab,0px));width:var(--mm,132px);height:var(--mm,132px);z-index:6;border-radius:12px;overflow:hidden;
  background:#1b2330;border:3px solid rgba(15,18,24,.85);box-shadow:0 2px 10px rgba(0,0,0,.45);pointer-events:none;contain:strict}
body.touch #miniMap{bottom:auto;top:calc(12px + var(--sat,0px))}
#miniMap canvas{position:absolute!important;left:50%;top:50%;inset:auto;image-rendering:pixelated;will-change:transform}
#miniMap .arw{position:absolute;left:50%;top:50%;width:0;height:0;margin:-9px 0 0 -7px;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:16px solid #fff;filter:drop-shadow(0 0 2px #000)}
#miniMap .nn{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:#c0262d;color:#fff;font:800 11px/18px system-ui,sans-serif;text-align:center;box-shadow:0 0 3px #000}
#miniMap.off,body.inmenu #miniMap{display:none}
#mapOv{position:fixed;inset:0;z-index:300;background:#141b26;touch-action:none;user-select:none}
#mapOv.hidden{display:none}
#mapOv canvas{position:absolute!important;inset:0;width:100%;height:100%;cursor:grab}
#mapOv .mt{position:absolute;left:50%;top:calc(10px + var(--sat,0px));transform:translateX(-50%);color:#fff;font:800 18px system-ui,sans-serif;text-shadow:0 1px 3px #000;pointer-events:none}
#mapOv .mh{position:absolute;left:50%;bottom:calc(8px + var(--sab,0px));transform:translateX(-50%);color:#dfe6ee;background:rgba(0,0,0,.55);padding:5px 12px;border-radius:10px;font:600 12px system-ui,sans-serif;white-space:nowrap;max-width:96vw;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
#mapOv .mb{position:absolute;right:calc(12px + var(--sar,0px));display:flex;flex-direction:column;gap:8px;top:calc(12px + var(--sat,0px))}
#mapOv .mb button{width:46px;height:46px;border-radius:12px;border:2px solid rgba(255,255,255,.25);background:rgba(20,26,36,.85);color:#fff;font:800 20px system-ui,sans-serif}
`; document.head.appendChild(st);
  const mm = document.createElement('div'); mm.id = 'miniMap'; mm.dataset.testid = 'minimap'; mm.className = 'off';
  const mcv = document.createElement('canvas'); const arw = document.createElement('div'); arw.className = 'arw'; const nn = document.createElement('div'); nn.className = 'nn'; nn.textContent = 'N';
  mm.append(mcv, arw, nn); document.body.appendChild(mm);
  const Z = 1.7;     // HUD px per block
  let S = 132, C2 = 0, mcx = 0, mcz = 0, lastTf = '';
  function sizeMini() { S = Math.round(Math.max(104, Math.min(190, Math.min(innerWidth, innerHeight) * 0.32))); mm.style.setProperty('--mm', S + 'px'); C2 = Math.ceil(S * 1.5 + 24); mcv.width = mcv.height = C2; mcv.style.width = mcv.style.height = C2 + 'px'; }
  sizeMini(); addEventListener('resize', sizeMini);
  const miniOn = () => SET.mini !== 0 && started && !dead && !paused && !(window.__arcade && __arcade.mode) && !M.open;
  function icon(g, x, y, kind, s) { g.save(); g.translate(x, y);
    if (kind === 'castle') { g.fillStyle = '#ddd'; g.strokeStyle = '#000'; g.lineWidth = 1.5; g.beginPath(); const k = s; g.moveTo(-k, k); g.lineTo(-k, -k * .4); g.lineTo(-k * .6, -k * .4); g.lineTo(-k * .6, -k); g.lineTo(-k * .2, -k); g.lineTo(-k * .2, -k * .4);
      g.lineTo(k * .2, -k * .4); g.lineTo(k * .2, -k); g.lineTo(k * .6, -k); g.lineTo(k * .6, -k * .4); g.lineTo(k, -k * .4); g.lineTo(k, k); g.closePath(); g.fill(); g.stroke(); }
    else { g.fillStyle = '#ffd400'; g.strokeStyle = '#000'; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? s * .45 : s; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); }
    g.restore(); }
  function drawMini() {
    const on = miniOn(); mm.classList.toggle('off', !on); if (!on || !mg) return;
    const g = mcv.getContext('2d'); mcx = P.x; mcz = P.z; const half = C2 / 2 / Z;
    g.fillStyle = '#1b2330'; g.fillRect(0, 0, C2, C2); g.imageSmoothingEnabled = false;
    g.drawImage(mc, mcx - half, mcz - half, half * 2, half * 2, 0, 0, C2, C2);
    const toC = (x, z) => [(x - mcx) * Z + C2 / 2, (z - mcz) * Z + C2 / 2];
    for (const k of castles()) { const [x, y] = toC(k[1], k[2]); if (x > -10 && y > -10 && x < C2 + 10 && y < C2 + 10) icon(g, x, y, 'castle', 7); }
    const sp = spawn(); if (sp) { const [x, y] = toC(sp[0], sp[2]); if (x > -10 && y > -10 && x < C2 + 10 && y < C2 + 10) icon(g, x, y, 'spawn', 7); }
    M.miniDraws = (M.miniDraws || 0) + 1; lastTf = ''; placeMini();
  }
  function placeMini() {
    if (mm.classList.contains('off')) return; const a = P.yaw, tx = (mcx - P.x) * Z, tz = (mcz - P.z) * Z;
    const tf = 'translate(-50%,-50%) rotate(' + a.toFixed(3) + 'rad) translate(' + tx.toFixed(1) + 'px,' + tz.toFixed(1) + 'px)';
    if (tf === lastTf) return; lastTf = tf; mcv.style.transform = tf;
    const dx = Math.sin(a), dy = -Math.cos(a), k = (S / 2 - 12) / Math.max(Math.abs(dx), Math.abs(dy));
    nn.style.left = (S / 2 + dx * k - 3) + 'px'; nn.style.top = (S / 2 + dy * k - 3) + 'px';
  }
  const bf = frame; frame = function () { const r = bf.apply(this, arguments); try { placeMini(); } catch (_) {} return r; };

  // ---------------- settings: Minimap on / off ----------------
  if (SET.mini === undefined) SET.mini = 1;
  const row = document.createElement('div'); row.className = 'set inline';
  row.innerHTML = '<span>Minimap</span><div class="seg" id="miniSeg"><button data-v="1" data-testid="settings-minimap-on">On</button><button data-v="0" data-testid="settings-minimap-off">Off</button></div>';
  const bob = $('bobSeg'); (bob ? bob.closest('.set') : $('qSeg2').closest('.set')).after(row);
  const syncRow = () => row.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.v === (SET.mini === 0 ? 0 : 1)));
  row.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { SET.mini = +b.dataset.v; saveSet(); syncRow(); toast('Minimap ' + (SET.mini ? 'on' : 'off')); }));
  const ss = syncSettingsUI; syncSettingsUI = function () { const r = ss.apply(this, arguments); syncRow(); return r; }; syncRow();

  // ---------------- full map (pause menu) ----------------
  const ov = document.createElement('div'); ov.id = 'mapOv'; ov.className = 'hidden'; ov.dataset.testid = 'map-overlay';
  ov.innerHTML = '<canvas data-testid="map-canvas"></canvas><div class="mt">Map</div><div class="mb"><button data-a="x" data-testid="map-close" aria-label="Close">\u2715</button><button data-a="in" data-testid="map-zoom-in">+</button><button data-a="out" data-testid="map-zoom-out">\u2212</button><button data-a="me" data-testid="map-centre" aria-label="Centre">\u25ce</button></div><div class="mh" id="mapHint"></div>';
  document.body.appendChild(ov); const bc = ov.querySelector('canvas'); const V = {x: 0, z: 0, z0: 2, dirty: true};
  const ZMIN = 0.35, ZMAX = 10;
  const pb = document.createElement('button'); pb.className = 'btn alt'; pb.id = 'mapBtn'; pb.dataset.testid = 'pause-map-button'; pb.textContent = '\ud83d\uddfa\ufe0f Map';
  $('resumeBtn').after(pb); pb.addEventListener('click', () => openMap());
  function hint() { $('mapHint').textContent = padConnected ? 'Left stick: move \u00b7 RT / LT or RB / LB: zoom \u00b7 Y: centre on you \u00b7 B: back' : (document.body.classList.contains('touch') ? 'Drag to move \u00b7 pinch or + / \u2212 to zoom \u00b7 \u25ce centre' : 'Drag to move \u00b7 wheel or + / \u2212 to zoom \u00b7 C centre \u00b7 Esc / M back'); }
  function openMap() { if (!started) return; if (!paused) setPause(true); M.open = true; ov.classList.remove('hidden'); V.x = P.x; V.z = P.z; V.z0 = Math.max(ZMIN, Math.min(ZMAX, Math.min(innerWidth, innerHeight) / 220)); V.dirty = true; hint(); tick(); drawBig(); }
  function closeMap() { M.open = false; ov.classList.add('hidden'); saveSeen(); }
  M.openMap = openMap; M.closeMap = closeMap;
  const zoomAt = (f, sx, sy) => { const r = bc.getBoundingClientRect(); sx = sx === undefined ? r.width / 2 : sx; sy = sy === undefined ? r.height / 2 : sy;
    const wx = V.x + (sx - r.width / 2) / V.z0, wz = V.z + (sy - r.height / 2) / V.z0; V.z0 = Math.max(ZMIN, Math.min(ZMAX, V.z0 * f));
    V.x = wx - (sx - r.width / 2) / V.z0; V.z = wz - (sy - r.height / 2) / V.z0; clampV(); V.dirty = true; };
  const clampV = () => { V.x = Math.max(0, Math.min(W, V.x)); V.z = Math.max(0, Math.min(D, V.z)); };
  function drawBig() {
    if (!M.open || !mg) return; const w = innerWidth, h = innerHeight; if (bc.width !== w || bc.height !== h) { bc.width = w; bc.height = h; }
    const g = bc.getContext('2d'); g.fillStyle = '#141b26'; g.fillRect(0, 0, w, h);
    const toS = (x, z) => [(x - V.x) * V.z0 + w / 2, (z - V.z) * V.z0 + h / 2];
    // the world's edge, unexplored = fog
    const [ex, ey] = toS(0, 0); g.fillStyle = '#2a3442'; g.fillRect(ex, ey, W * V.z0, D * V.z0);
    g.save(); g.globalAlpha = 0.18; g.strokeStyle = '#8796aa'; g.lineWidth = 1; const step = 64 * V.z0; if (step > 24) { g.beginPath();
      for (let x = 0; x <= W; x += 64) { const [sx] = toS(x, 0); g.moveTo(sx, ey); g.lineTo(sx, ey + D * V.z0); } for (let z = 0; z <= D; z += 64) { const [, sy] = toS(0, z); g.moveTo(ex, sy); g.lineTo(ex + W * V.z0, sy); } g.stroke(); } g.restore();
    g.imageSmoothingEnabled = V.z0 < 1; g.drawImage(mc, ex, ey, W * V.z0, D * V.z0);
    g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 2; g.strokeRect(ex, ey, W * V.z0, D * V.z0);
    g.font = '700 13px system-ui,sans-serif'; g.textBaseline = 'middle';
    const label = (t, x, y) => { g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(t, x, y); g.fillStyle = '#fff'; g.fillText(t, x, y); };
    for (const k of castles()) { const i = ((k[1] / TS) | 0) * M.td + ((k[2] / TS) | 0); const [x, y] = toS(k[1], k[2]); icon(g, x, y, 'castle', 9); if (M.seen && M.seen[i]) label(cname(k[0]), x + 13, y); }
    const sp = spawn(); if (sp) { const [x, y] = toS(sp[0], sp[2]); icon(g, x, y, 'spawn', 9); label('Spawn', x + 13, y); }
    const [px, py] = toS(P.x, P.z); g.save(); g.translate(px, py); g.rotate(-P.yaw); g.fillStyle = '#fff'; g.strokeStyle = '#c0262d'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(0, -12); g.lineTo(8, 9); g.lineTo(0, 4); g.lineTo(-8, 9); g.closePath(); g.fill(); g.stroke(); g.restore();
    // compass
    g.fillStyle = '#c0262d'; g.beginPath(); g.arc(30, h - 60, 14, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '800 14px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText('N', 30, h - 59); g.textAlign = 'left';
    g.beginPath(); g.moveTo(30, h - 88); g.lineTo(36, h - 76); g.lineTo(24, h - 76); g.closePath(); g.fill();
    V.dirty = false; M.bigDraws = (M.bigDraws || 0) + 1;
  }
  ov.querySelectorAll('.mb button').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const a = b.dataset.a;
    if (a === 'x') closeMap(); else if (a === 'in') zoomAt(1.5); else if (a === 'out') zoomAt(1 / 1.5); else { V.x = P.x; V.z = P.z; V.dirty = true; } drawBig(); }));
  // drag / pinch / wheel
  const pts = new Map(); let pinch = 0;
  bc.addEventListener('pointerdown', e => { pts.set(e.pointerId, [e.clientX, e.clientY]); try { bc.setPointerCapture(e.pointerId); } catch (_) {} if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  bc.addEventListener('pointermove', e => { const o = pts.get(e.pointerId); if (!o) return;
    if (pts.size === 1) { V.x -= (e.clientX - o[0]) / V.z0; V.z -= (e.clientY - o[1]) / V.z0; clampV(); }
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) zoomAt(d / pinch, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch = d; }
    drawBig(); });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; };
  bc.addEventListener('pointerup', up); bc.addEventListener('pointercancel', up);
  bc.addEventListener('wheel', e => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY); drawBig(); }, {passive: false});
  window.addEventListener('keydown', e => {
    if (M.open) { if (e.code === 'Escape' || e.code === 'KeyM') { e.preventDefault(); e.stopImmediatePropagation(); closeMap(); }
      else if (e.code === 'KeyC') { V.x = P.x; V.z = P.z; drawBig(); } else if (e.code === 'Equal' || e.code === 'NumpadAdd') { zoomAt(1.5); drawBig(); } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') { zoomAt(1 / 1.5); drawBig(); }
      return; }
    if (e.code === 'KeyM' && !e.repeat && started && !dead && !menuOpen && !(window.__arcade && __arcade.mode)) { e.preventDefault(); openMap(); }
  }, true);
  // controller while the map is open
  let lastT = 0;
  const rp = readPad; readPad = function () {
    if (!M.open) return rp.apply(this, arguments);
    const gp = pickPad(), none = {lx: 0, ly: 0, rx: 0, ry: 0}; if (!gp) return none; padConnected = true;
    const pr = i => { const b = gp.buttons[i]; return !!(b && (b.pressed || b.value > 0.4)); }, E = [];
    for (let i = 0; i < 17; i++) { const n = pr(i); E[i] = n && !gpPrev[i]; gpPrev[i] = n; }
    const now = performance.now(), dt = Math.min(0.1, (now - (lastT || now)) / 1000); lastT = now;
    const dz = v => Math.abs(v) < 0.15 ? 0 : v, lx = dz(gp.axes[0] || 0), ly = dz(gp.axes[1] || 0), rx = dz(gp.axes[2] || 0), ry = dz(gp.axes[3] || 0);
    const sp = 520 * dt / V.z0; let ch = false;
    if (lx || ly || rx || ry) { V.x += (lx + rx) * sp; V.z += (ly + ry) * sp; clampV(); ch = true; }
    const val = i => (gp.buttons[i] && gp.buttons[i].value) || 0, rt = val(7), lt = val(6);
    if (rt > 0.1 || lt > 0.1) { zoomAt(Math.exp((rt - lt) * 2.2 * dt)); ch = true; }
    if (E[5]) { zoomAt(1.5); ch = true; } if (E[4]) { zoomAt(1 / 1.5); ch = true; }
    if (E[12] || E[13] || E[14] || E[15]) { V.x += ((E[15] ? 1 : 0) - (E[14] ? 1 : 0)) * 48 / V.z0 * 2; V.z += ((E[13] ? 1 : 0) - (E[12] ? 1 : 0)) * 48 / V.z0 * 2; clampV(); ch = true; }
    if (E[3]) { V.x = P.x; V.z = P.z; ch = true; }
    if (E[1] || E[9] || E[8]) closeMap(); else if (ch) drawBig();
    if (!M._hp && padConnected) { M._hp = 1; hint(); }
    return none;
  };
  // pause closes the map too
  const sp0 = setPause; setPause = function (on) { if (!on && M.open) closeMap(); return sp0.apply(this, arguments); };
  window.__mapT = {tick, drawBig, V, mc};
})();
