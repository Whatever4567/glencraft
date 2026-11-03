/* ===================== GLX-C150 (v1.0.25): castle decor props (banners, antlers, chandeliers, coffins, cages, throne...) - one atlas, two merged meshes per castle ===================== */
(function c150() {
  const U = window.__c150 = {props: [], st: {}, err: null, groups: new Map(), tiles: {}};
  // ---------- 1. atlas: little pixel-art tiles painted once ----------
  const AW = 512, cvA = document.createElement('canvas'); cvA.width = cvA.height = AW; const g = cvA.getContext('2d');
  let sx = 0, sy = 0, rowH = 0; let seed = 25025; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const TL = U.tiles;
  function tile(name, w, h, fn) { if (sx + w > AW) { sx = 0; sy += rowH; rowH = 0; } const x = sx, y = sy; sx += w; rowH = Math.max(rowH, h);
    g.save(); g.translate(x, y); g.beginPath(); g.rect(0, 0, w, h); g.clip(); fn(w, h); g.restore(); TL[name] = [(x + 0.5) / AW, 1 - (y + h - 0.5) / AW, (x + w - 0.5) / AW, 1 - (y + 0.5) / AW]; }
  const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const noise = (w, h, cols, n, s) => { for (let i = 0; i < n; i++) px((r() * w / s | 0) * s, (r() * h / s | 0) * s, s, s, cols[r() * cols.length | 0]); };
  function tartan(w, h, base, sett) { px(0, 0, w, h, base); g.globalAlpha = 0.7; for (const [c, o, ww] of sett) for (let k = o; k < w; k += 32) px(k, 0, ww, h, c);
    g.globalAlpha = 0.55; for (const [c, o, ww] of sett) for (let k = o; k < h; k += 32) px(0, k, w, ww, c); g.globalAlpha = 0.18; for (let y = 0; y < h; y += 2) for (let x = (y >> 1) & 1 ? 0 : 1; x < w; x += 2) px(x, y, 1, 1, '#000'); g.globalAlpha = 1; }
  const RG = [['#1d5a30', 0, 10], ['#14213d', 12, 3], ['#1d5a30', 18, 4], ['#e0c050', 26, 1]];
  tile('tartan', 64, 64, (w, h) => tartan(w, h, '#a3191f', RG));
  tile('tartanB', 64, 64, (w, h) => tartan(w, h, '#1c3f74', [['#1d5a30', 0, 10], ['#0c0c18', 13, 4], ['#c8262a', 22, 2], ['#e8e0c8', 28, 1]]));
  tile('banT', 32, 96, (w, h) => { tartan(w, h, '#a3191f', RG); px(0, 0, w, 3, '#d8b040'); g.clearRect(0, h - 10, w, 10); g.fillStyle = '#a3191f'; g.beginPath(); g.moveTo(0, h - 10); g.lineTo(w / 2, h - 2); g.lineTo(w, h - 10); g.fill(); px(13, 30, 6, 6, '#e8c860'); px(11, 32, 10, 2, '#e8c860'); });
  tile('banB', 32, 96, (w, h) => { px(0, 0, w, h, '#141216'); noise(w, h, ['#1c1a1f', '#0c0b0d'], 120, 2); px(0, 0, 3, h, '#8a1015'); px(w - 3, 0, 3, h, '#8a1015'); px(0, 0, w, 4, '#8a1015');
    g.fillStyle = '#b3141a'; g.beginPath(); g.moveTo(16, 22); g.lineTo(26, 34); g.lineTo(22, 50); g.lineTo(16, 44); g.lineTo(10, 50); g.lineTo(6, 34); g.closePath(); g.fill(); px(15, 52, 2, 14, '#b3141a'); px(11, 56, 10, 2, '#b3141a');
    g.clearRect(0, h - 14, w, 14); g.fillStyle = '#141216'; g.beginPath(); g.moveTo(0, h - 14); g.lineTo(8, h - 2); g.lineTo(16, h - 12); g.lineTo(24, h - 2); g.lineTo(32, h - 14); g.fill(); });
  tile('banG', 32, 96, (w, h) => { px(0, 0, w, h, '#8a8a84'); noise(w, h, ['#77776f', '#9c9c95', '#6a6a63'], 260, 2); px(0, 0, w, 3, '#55554f');
    for (let i = 0; i < 9; i++) { const x = r() * w | 0, y = 20 + r() * (h - 20) | 0; g.clearRect(x, y, 2 + r() * 5 | 0, 2 + r() * 6 | 0); }
    for (let x = 0; x < w; x += 4) g.clearRect(x, h - 6 - (r() * 26 | 0), 3, 40); });
  tile('iron', 16, 16, (w, h) => { px(0, 0, w, h, '#2c2b2e'); noise(w, h, ['#3a393d', '#1f1e21', '#46444a'], 40, 2); });
  tile('steel', 16, 16, (w, h) => { px(0, 0, w, h, '#b9c0c8'); noise(w, h, ['#d8dee4', '#9aa2ac', '#c8ced6'], 50, 2); });
  tile('gold', 16, 16, (w, h) => { px(0, 0, w, h, '#d6a92c'); noise(w, h, ['#f0cc58', '#a8801a'], 40, 2); });
  tile('wood', 16, 16, (w, h) => { px(0, 0, w, h, '#6b4524'); for (let y = 0; y < h; y += 4) px(0, y, w, 1, '#553519'); noise(w, h, ['#7a512c', '#5b3a1c'], 30, 2); });
  tile('leather', 16, 16, (w, h) => { px(0, 0, w, h, '#4a2c16'); noise(w, h, ['#5a361c', '#3a210f'], 30, 2); });
  tile('wax', 16, 16, (w, h) => { px(0, 0, w, h, '#efe6c8'); noise(w, h, ['#fff6dc', '#d9cfae'], 20, 2); });
  tile('flame', 16, 32, (w, h) => { g.fillStyle = '#ff7a10'; g.beginPath(); g.moveTo(8, 0); g.quadraticCurveTo(16, 18, 14, 26); g.lineTo(2, 26); g.quadraticCurveTo(0, 18, 8, 0); g.fill(); g.fillStyle = '#ffd040'; g.beginPath(); g.moveTo(8, 8); g.quadraticCurveTo(13, 20, 11, 26); g.lineTo(5, 26); g.quadraticCurveTo(3, 20, 8, 8); g.fill(); px(6, 18, 4, 8, '#fff4b0'); });
  tile('ember', 16, 16, (w, h) => { px(0, 0, w, h, '#ff5a10'); noise(w, h, ['#ffb030', '#c02808', '#ffe070'], 60, 2); });
  tile('soul', 16, 16, (w, h) => { px(0, 0, w, h, '#58c8ff'); noise(w, h, ['#a8ecff', '#2a8ad0'], 40, 2); });
  tile('bone', 16, 16, (w, h) => { px(0, 0, w, h, '#e2dcc4'); noise(w, h, ['#cfc7aa', '#f0ead6', '#bdb497'], 50, 2); px(0, 7, w, 1, '#b9b092'); });
  tile('skull', 16, 16, (w, h) => { px(0, 0, w, h, '#e6e0c8'); noise(w, h, ['#d0c8ac', '#f2ecda'], 30, 2); px(3, 6, 4, 4, '#1a1512'); px(9, 6, 4, 4, '#1a1512'); px(7, 10, 2, 2, '#2a221c'); for (let x = 4; x < 12; x += 2) px(x, 13, 1, 2, '#3a3028'); });
  tile('stoneC', 32, 32, (w, h) => { px(0, 0, w, h, '#8d8a82'); noise(w, h, ['#7a776f', '#9d9a92', '#6e6b64'], 160, 2); px(0, 0, w, 2, '#5e5b55'); px(0, h - 2, w, 2, '#5e5b55'); px(0, 0, 2, h, '#5e5b55'); px(w - 2, 0, 2, h, '#5e5b55'); });
  tile('lid', 32, 64, (w, h) => { px(0, 0, w, h, '#9a968c'); noise(w, h, ['#86827a', '#aaa69c', '#7a766e'], 300, 2); px(0, 0, w, 2, '#615e57'); px(0, h - 2, w, 2, '#615e57'); px(0, 0, 2, h, '#615e57'); px(w - 2, 0, 2, h, '#615e57');
    const B = '#d8d1b6'; px(12, 8, 8, 8, B); px(13, 11, 2, 2, '#3a332a'); px(17, 11, 2, 2, '#3a332a'); px(15, 18, 2, 30, B); for (const y of [22, 28, 34]) px(9, y, 14, 2, B); px(7, 46, 6, 2, B); px(19, 46, 6, 2, B); px(8, 50, 3, 8, B); px(21, 50, 3, 8, B); });
  tile('chain', 8, 32, (w, h) => { for (let y = 0; y < h; y += 8) { px(2, y, 4, 1, '#3a3940'); px(2, y + 5, 4, 1, '#3a3940'); px(1, y + 1, 1, 4, '#4a4950'); px(6, y + 1, 1, 4, '#4a4950'); px(3, y + 5, 2, 3, '#55545c'); } });
  tile('bars', 32, 32, (w, h) => { for (let x = 1; x < w; x += 8) px(x, 0, 3, h, '#333238'); px(0, 1, w, 3, '#2a292e'); px(0, h - 4, w, 3, '#2a292e'); px(0, 14, w, 2, '#2a292e'); });
  tile('target', 32, 32, (w, h) => { const c = [['#e8e0d0', 15], ['#c4161c', 12], ['#e8e0d0', 9], ['#c4161c', 6], ['#e8e0d0', 3.5], ['#c4161c', 1.6]]; for (const [col, rr] of c) { g.fillStyle = col; g.beginPath(); g.arc(16, 16, rr, 0, 7); g.fill(); } });
  tile('straw', 16, 16, (w, h) => { px(0, 0, w, h, '#c9a64a'); noise(w, h, ['#e0c060', '#a8862e', '#d8b850'], 60, 1); });
  tile('barrel', 32, 32, (w, h) => { px(0, 0, w, h, '#7a5230'); for (let x = 0; x < w; x += 6) px(x, 0, 1, h, '#4d3219'); px(0, 5, w, 3, '#2f2d30'); px(0, h - 8, w, 3, '#2f2d30'); noise(w, h, ['#8a6038', '#6a4426'], 40, 2); });
  tile('barrelT', 16, 16, (w, h) => { px(0, 0, w, h, '#82593a'); for (let x = 0; x < w; x += 4) px(x, 0, 1, h, '#5a3a20'); px(0, 0, w, 1, '#2f2d30'); px(0, h - 1, w, 1, '#2f2d30'); });
  tile('throne', 32, 32, (w, h) => { px(0, 0, w, h, '#141217'); noise(w, h, ['#1e1b22', '#0a090c', '#26222b'], 120, 2); px(0, 0, w, 2, '#3a1418'); px(14, 0, 4, h, '#1f1c24'); });
  tile('velvet', 16, 16, (w, h) => { px(0, 0, w, h, '#8e0f16'); noise(w, h, ['#a8161e', '#6a080e'], 40, 2); px(0, 0, w, 1, '#d0a040'); });
  tile('redwin', 16, 32, (w, h) => { px(0, 0, w, h, '#ff3418'); noise(w, h, ['#ff7038', '#d81808', '#ffa050'], 70, 2); px(7, 0, 2, h, '#2a0a06'); px(0, 14, w, 2, '#2a0a06'); px(0, 0, w, 2, '#2a0a06'); px(0, 0, 2, h, '#2a0a06'); px(w - 2, 0, 2, h, '#2a0a06'); });
  tile('antler', 32, 32, (w, h) => { const A = '#e8dcc0', S = '#bfae86'; px(14, 22, 4, 8, '#6a4a2a'); for (const s of [-1, 1]) { const o = x => 16 + s * x; for (let i = 0; i < 12; i++) px(o(2 + i) - (s < 0 ? 2 : 0), 22 - i * 1.4 | 0, 2, 2, i % 3 ? A : S);
      px(o(6) - 1, 10, 2, 6, A); px(o(10) - 1, 4, 2, 8, A); px(o(13) - 1, 0, 2, 6, A); px(o(4) - 1, 14, 2, 5, S); } });
  tile('plaque', 16, 16, (w, h) => { px(0, 0, w, h, '#5a3820'); px(1, 1, w - 2, h - 2, '#6e4628'); noise(w, h, ['#7a5230'], 10, 2); });
  tile('ladder', 16, 32, (w, h) => { px(1, 0, 2, h, '#7a5a34'); px(13, 0, 2, h, '#7a5a34'); for (let y = 2; y < h; y += 6) px(1, y, 14, 2, '#8a6a40'); });
  tile('bow', 16, 32, (w, h) => { g.strokeStyle = '#6a4424'; g.lineWidth = 2; g.beginPath(); g.moveTo(4, 1); g.quadraticCurveTo(15, 16, 4, 31); g.stroke(); g.strokeStyle = '#ddd6c0'; g.lineWidth = 1; g.beginPath(); g.moveTo(4, 1); g.lineTo(4, 31); g.stroke(); });
  tile('shield', 16, 16, (w, h) => { g.fillStyle = '#5a3a1c'; g.beginPath(); g.arc(8, 8, 7.5, 0, 7); g.fill(); g.fillStyle = '#c8a040'; g.beginPath(); g.arc(8, 8, 2, 0, 7); g.fill(); for (let a = 0; a < 8; a++) px(8 + Math.cos(a * .785) * 5 | 0, 8 + Math.sin(a * .785) * 5 | 0, 1, 1, '#d8b050'); });
  tile('web', 32, 32, (w, h) => { g.strokeStyle = 'rgba(235,235,235,.85)'; g.lineWidth = 1; for (let a = 0; a < 8; a++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a * 0.2) * 44, Math.sin(a * 0.2) * 44); g.stroke(); } for (let k = 6; k < 40; k += 6) { g.beginPath(); g.arc(0, 0, k, 0, 1.6); g.stroke(); } });
  const TEXA = new THREE.CanvasTexture(cvA); TEXA.magFilter = THREE.NearestFilter; TEXA.minFilter = THREE.NearestFilter; TEXA.generateMipmaps = false; TEXA.flipY = true;
  const matL = new THREE.MeshLambertMaterial({map: TEXA, side: THREE.DoubleSide, alphaTest: 0.5});
  const matG = new THREE.MeshBasicMaterial({map: TEXA, side: THREE.DoubleSide, alphaTest: 0.3, fog: true});
  U.atlas = cvA; U.mats = [matL, matG];
  // ---------- 2. geometry kit (prop frame: cell 0..1, front faces +z) ----------
  function kit() { const L = {p: [], n: [], u: []}, G = {p: [], n: [], u: []};
    let ox = 0, oy = 0, oz = 0, rc = 1, rs = 0;
    const tf = (x, y, z) => { const lx = x - 0.5, lz = z - 0.5; return [ox + 0.5 + lx * rc + lz * rs, oy + y, oz + 0.5 - lx * rs + lz * rc]; };
    const tn = (x, y, z) => [x * rc + z * rs, y, -x * rs + z * rc];
    function quad(a, b, c, d, t, glow, nn) { const A = glow ? G : L, uv = TL[t] || TL.iron, P = [a, b, c, d].map(q => tf(q[0], q[1], q[2])), N = tn(nn[0], nn[1], nn[2]);
      const U2 = [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]];
      for (const i of [0, 1, 2, 0, 2, 3]) { A.p.push(P[i][0], P[i][1], P[i][2]); A.n.push(N[0], N[1], N[2]); A.u.push(U2[i][0], U2[i][1]); } }
    function box(x0, y0, z0, x1, y1, z1, t, glow, tt) { const s = tt || t;
      quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], t, glow, [0, 0, 1]); quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], t, glow, [0, 0, -1]);
      quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], t, glow, [1, 0, 0]); quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], t, glow, [-1, 0, 0]);
      quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], s, glow, [0, 1, 0]); quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], s, glow, [0, -1, 0]); }
    const cross = (cx, cz, y0, h, w, t, glow) => { quad([cx - w, y0, cz], [cx + w, y0, cz], [cx + w, y0 + h, cz], [cx - w, y0 + h, cz], t, glow, [0, 0, 1]); quad([cx, y0, cz - w], [cx, y0, cz + w], [cx, y0 + h, cz + w], [cx, y0 + h, cz - w], t, glow, [1, 0, 0]); };
    const wallQ = (x0, y0, x1, y1, z, t, glow) => quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], t, glow, [0, 0, 1]);
    const flatQ = (x0, z0, x1, z1, y, t) => quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], t, false, [0, 1, 0]);
    const at = (x, y, z, f) => { ox = x; oy = y; oz = z; const a = [Math.PI, -Math.PI / 2, 0, Math.PI / 2][f & 3]; rc = Math.cos(a); rs = Math.sin(a); };
    return {L, G, quad, box, cross, wallQ, flatQ, at}; }
  U.kit = kit;
  // ---------- 3. the props ----------
  const ring = (K, cx, cz, R, y, n, fn) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283; fn(cx + Math.cos(a) * R, cz + Math.sin(a) * R, a); } };
  const DRAW = {
    banT: (K, o) => { K.box(0.02, 0.92, 0.04, 0.98, 1.0, 0.12, 'iron'); K.wallQ(0.06, 1 - (o.L || 2.7), 0.94, 0.95, 0.08, o.v === 1 ? 'banB' : o.v === 2 ? 'banG' : 'banT'); },
    rug: (K, o) => { const w = o.w || 3, d = o.d || 4, y = o.h || 0.03; K.flatQ(0.5 - w / 2, 0.5 - d / 2, 0.5 + w / 2, 0.5 + d / 2, y, o.v === 1 ? 'tartanB' : o.v === 2 ? 'velvet' : 'tartan'); },
    antler: (K) => { K.box(0.25, 0.25, 0, 0.75, 0.75, 0.06, 'plaque'); K.box(0.4, 0.3, 0.06, 0.6, 0.62, 0.3, 'leather'); K.wallQ(-0.45, 0.35, 1.45, 1.6, 0.2, 'antler'); },
    chand: (K, o) => { const R = 0.95, top = o.L || 1.6; K.cross(0.5, 0.5, 0.25, top, 0.06, 'chain'); ring(K, 0.5, 0.5, R, 0, 10, (x, z) => { K.box(x - 0.08, 0.2, z - 0.08, x + 0.08, 0.27, z + 0.08, 'iron'); K.box(x - 0.04, 0.27, z - 0.04, x + 0.04, 0.47, z + 0.04, 'wax'); K.cross(x, z, 0.47, 0.22, 0.05, 'flame', true); });
      for (const [a, b] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) K.box(0.5 + Math.min(0, a) * R - 0.03, 0.2, 0.5 + Math.min(0, b) * R - 0.03, 0.5 + Math.max(0, a) * R + 0.03, 0.25, 0.5 + Math.max(0, b) * R + 0.03, 'iron'); },
    candles: (K) => { for (const [x, z, h] of [[0.3, 0.4, 0.3], [0.55, 0.6, 0.22], [0.7, 0.35, 0.36]]) { K.box(x - 0.04, 0, z - 0.04, x + 0.04, h, z + 0.04, 'wax'); K.cross(x, z, h, 0.16, 0.04, 'flame', true); } },
    armour: (K) => { K.box(0.45, 0, 0.45, 0.55, 1.5, 0.55, 'wood'); K.box(0.2, 0, 0.2, 0.8, 0.06, 0.8, 'wood'); K.box(0.22, 1.0, 0.36, 0.78, 1.55, 0.66, 'steel'); K.box(0.12, 1.4, 0.4, 0.88, 1.56, 0.62, 'steel');
      K.box(0.3, 1.6, 0.33, 0.7, 1.98, 0.67, 'steel'); K.box(0.3, 1.74, 0.66, 0.7, 1.8, 0.68, 'iron'); K.box(0.24, 0.62, 0.38, 0.76, 1.02, 0.64, 'tartan'); K.box(0.45, 1.98, 0.48, 0.55, 2.12, 0.52, 'velvet'); },
    claym: (K) => { K.box(0.25, 0.25, 0.02, 0.75, 0.75, 0.08, 'shield'); for (const s of [-1, 1]) { const q = (u) => [0.5 + s * (u - 0.5) * 1.1, 0.12 + u * 1.3];
        for (let i = 0; i < 10; i++) { const [x, y] = q(i / 10); K.box(x - 0.04, y, 0.09, x + 0.04, y + 0.15, 0.12, i < 2 ? 'leather' : i === 2 ? 'gold' : 'steel'); } } },
    coffin: (K) => { K.box(-0.012, 0, -0.012, 1.012, 0.998, 2.012, 'stoneC', false, 'stoneC'); K.box(-0.06, 1.0, -0.06, 1.06, 1.1, 2.06, 'stoneC', false, 'lid'); },
    bonecol: (K, o) => { const h = o.h || 4; for (let y = 0; y < h; y++) K.box(-0.015, y, -0.015, 1.015, y + 1, 1.015, 'bone'); for (const y of [0.1, h - 0.45]) for (const f of [[0.5, -0.05], [0.5, 1.05], [-0.05, 0.5], [1.05, 0.5]]) K.box(f[0] - 0.18, y, f[1] - 0.18, f[0] + 0.18, y + 0.34, f[1] + 0.18, 'skull', false, 'bone'); },
    skull: (K, o) => { const s = o.w || 0.42, x0 = 0.5 - s / 2; K.box(x0, 0, 0.5 - s / 2, x0 + s, s * 0.9, 0.5 + s / 2, 'skull', false, 'bone'); },
    bones: (K) => { for (const [x, z, a] of [[0.3, 0.4, 0], [0.6, 0.5, 1], [0.45, 0.7, 0]]) K.box(x - (a ? 0.3 : 0.05), 0, z - (a ? 0.05 : 0.3), x + (a ? 0.3 : 0.05), 0.08, z + (a ? 0.05 : 0.3), 'bone'); K.box(0.55, 0, 0.15, 0.85, 0.27, 0.45, 'skull', false, 'bone'); },
    chain: (K, o) => { const L = o.L || 3; K.cross(0.5, o.v ? 0.12 : 0.5, 1 - L, L, 0.07, 'chain'); },
    cage: (K, o) => { const L = o.L || 1.5; K.cross(0.5, 0.5, 1 - L, L, 0.07, 'chain'); const y1 = 1 - L, y0 = y1 - 1.3;
      for (const z of [0.12, 0.88]) K.wallQ(0.12, y0, 0.88, y1, z, 'bars'); K.quad([0.12, y0, 0.12], [0.12, y0, 0.88], [0.12, y1, 0.88], [0.12, y1, 0.12], 'bars', false, [1, 0, 0]); K.quad([0.88, y0, 0.12], [0.88, y0, 0.88], [0.88, y1, 0.88], [0.88, y1, 0.12], 'bars', false, [1, 0, 0]);
      K.box(0.08, y1 - 0.06, 0.08, 0.92, y1, 0.92, 'iron'); K.box(0.08, y0, 0.08, 0.92, y0 + 0.06, 0.92, 'iron'); if (o.v) K.box(0.3, y0 + 0.06, 0.3, 0.62, y0 + 0.34, 0.62, 'skull', false, 'bone'); },
    srack: (K) => { K.box(0, 0.15, 0.02, 1, 0.25, 0.2, 'wood'); K.box(0, 1.3, 0.02, 1, 1.38, 0.2, 'wood'); for (const x of [0.2, 0.5, 0.8]) { K.box(x - 0.03, 0.25, 0.1, x + 0.03, 1.5, 0.14, 'steel'); K.box(x - 0.14, 1.15, 0.08, x + 0.14, 1.2, 0.16, 'iron'); K.box(x - 0.03, 1.2, 0.09, x + 0.03, 1.45, 0.15, 'leather'); } },
    brack: (K) => { K.box(0, 0.9, 0.02, 1, 0.98, 0.16, 'wood'); K.box(0, 0.3, 0.02, 1, 0.38, 0.16, 'wood'); for (const x of [0.08, 0.5]) K.wallQ(x, 0.05, x + 0.4, 1.6, 0.1, 'bow'); K.box(0.82, 0.1, 0.05, 0.98, 0.75, 0.25, 'leather'); },
    target: (K) => { K.box(0.1, 0, 0.35, 0.18, 1.2, 0.45, 'wood'); K.box(0.82, 0, 0.35, 0.9, 1.2, 0.45, 'wood'); K.box(0.02, 0.45, 0.12, 0.98, 1.45, 0.34, 'straw'); K.wallQ(0.04, 0.47, 0.96, 1.43, 0.345, 'target'); },
    barrel: (K, o) => { const h = o.v ? 0.45 : 0.92; K.box(0.12, 0, 0.12, 0.88, h, 0.88, 'barrel', false, o.v ? 'leather' : 'barrelT'); if (o.v) { K.box(0.9, 0, 0.2, 1.0, 0.7, 0.3, 'barrel'); K.box(0.2, 0, 0.92, 0.6, 0.06, 1.05, 'barrel'); } },
    throne: (K) => { K.box(-0.01, 0, -0.01, 1.01, 0.55, 1.01, 'throne'); K.box(0.06, 0.55, 0.12, 0.94, 0.62, 0.9, 'velvet'); K.box(0.04, 0.55, -0.04, 0.96, 3.0, 0.14, 'throne'); K.box(0.12, 0.7, 0.14, 0.88, 2.6, 0.16, 'velvet');
      for (const x of [-0.08, 0.86]) { K.box(x, 0.55, 0.0, x + 0.22, 1.05, 1.0, 'throne'); K.box(x, 1.05, 0.0, x + 0.22, 1.12, 1.04, 'gold'); }
      for (const [x, h] of [[0.04, 0.7], [0.4, 1.1], [0.78, 0.7]]) K.box(x, 3.0, -0.02, x + 0.18, 3.0 + h, 0.12, 'throne'); K.box(0.46, 4.1, 0.0, 0.54, 4.35, 0.1, 'gold'); },
    redwin: (K, o) => { const h = o.h || 2; K.wallQ(0.02, 0.02, 0.98, h - 0.02, 0.5, 'redwin', true); },
    soulgl: (K) => { K.box(0.36, 0.3, 0.36, 0.64, 0.62, 0.64, 'soul', true); },
    brazier: (K) => { for (const [x, z] of [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) K.box(x - 0.04, 0, z - 0.04, x + 0.04, 0.8, z + 0.04, 'iron'); K.box(0.08, 0.8, 0.08, 0.92, 0.98, 0.92, 'iron'); K.box(0.16, 0.98, 0.16, 0.84, 1.06, 0.84, 'ember', true);
      K.cross(0.5, 0.5, 1.0, 0.9, 0.32, 'flame', true); K.cross(0.32, 0.6, 1.0, 0.6, 0.2, 'flame', true); },
    portc: (K, o) => { const w = o.w || 3, h = o.h || 1.6, c = o.v ? 1 : 0.5; K.wallQ(c - w / 2, 1 - h, c + w / 2, 1, 0.5, 'bars'); for (let i = 0; i <= w * 2; i++) { const x = c - w / 2 + i * 0.5; K.box(x - 0.05, 1 - h - 0.3, 0.45, x + 0.05, 1 - h, 0.55, 'iron'); } },
    fire: (K) => { K.cross(0.5, 0.5, 0, 0.95, 0.42, 'flame', true); K.cross(0.25, 0.4, 0, 0.6, 0.25, 'flame', true); K.cross(0.75, 0.6, 0, 0.7, 0.25, 'flame', true); for (const z of [0.3, 0.6]) K.box(0.1, 0, z, 0.9, 0.14, z + 0.14, 'wood'); },
    ladder: (K, o) => { K.wallQ(0.1, 0, 0.9, o.L || 4, 0.06, 'ladder'); },
    web: (K) => { K.wallQ(0, 0, 1, 1, 0.02, 'web'); },
    spike: (K, o) => { const h = o.h || 1.5; K.box(0.44, 0, 0.44, 0.56, h, 0.56, 'iron'); K.box(0.47, h, 0.47, 0.53, h + 0.4, 0.53, 'iron'); },
    flag: (K, o) => { K.box(0.46, 0, 0.46, 0.54, 3, 0.54, 'wood'); K.quad([0.54, 2.0, 0.5], [1.9, 2.0, 0.5], [1.9, 2.9, 0.5], [0.54, 2.9, 0.5], o.v === 1 ? 'banB' : o.v === 2 ? 'banG' : 'tartan', false, [0, 0, 1]); },
    table: (K) => { K.box(0, 0.88, 0, 1, 1.0, 1, 'wood'); },
  };
  U.DRAW = DRAW;
  // ---------- 4. per-castle meshes, built near the player; a prop goes when the block it hangs on is broken ----------
  function buildGroup(ci) { const K = kit(); let n = 0;
    for (const p of U.props) { if (p.c !== ci || p.dead) continue; const d = DRAW[p.t]; if (!d) continue; K.at(p.x, p.y, p.z, p.f); try { d(K, p); n++; } catch (e) { U.err = 'draw ' + p.t + ' ' + e.message; } }
    const grp = new THREE.Group(); grp.name = 'c150-' + ci;
    for (const [A, m] of [[K.L, matL], [K.G, matG]]) { if (!A.p.length) continue; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(A.p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(A.n, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(A.u, 2)); geo.computeBoundingSphere();
      const me = new THREE.Mesh(geo, m); me.matrixAutoUpdate = false; me.frustumCulled = true; grp.add(me); }
    grp.userData.n = n; return grp; }
  function drop(ci) { const g0 = U.groups.get(ci); if (!g0) return; scene.remove(g0); g0.children.forEach(m => m.geometry.dispose()); U.groups.delete(ci); }
  U.rebuild = () => { for (const ci of [...U.groups.keys()]) drop(ci); };
  function tick() { if (typeof started === 'undefined' || !started || DIM.cur || !U.props.length) { if (U.groups.size && (DIM.cur || !U.props.length)) U.rebuild(); return; }
    const cs = (typeof g9castles !== 'undefined' && g9castles) || [];
    for (let ci = 0; ci < cs.length; ci++) { const c = cs[ci], d = Math.hypot(P.x - c[1], P.z - c[2]), has = U.groups.get(ci);
      if (d < 170) { let ch = false; for (const p of U.props) if (p.c === ci && !p.dead && p.a && world[idx(p.a[0], p.a[1], p.a[2])] !== p.a[3]) { p.dead = 1; ch = true; }
        if (!has || ch) { drop(ci); const g2 = buildGroup(ci); scene.add(g2); U.groups.set(ci, g2); } }
      else if (has && d > 230) drop(ci); } }
  setInterval(() => { try { tick(); } catch (e) { U.err = 'tick ' + e.message; } }, 700);
  // ---------- 5. save / load ----------
  const TY = Object.keys(DRAW);
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && U.props.length) d.c150p = U.props.map(p => [TY.indexOf(p.t), p.c, p.x, p.y, p.z, p.f, p.v || 0, p.w || 0, p.d || 0, p.h || 0, p.L || 0, p.a ? p.a.join(',') : '', p.dead ? 1 : 0]); } catch (e) { U.err = 'ser ' + e.message; } return d; };
  const ap = applySave; applySave = function (d) { const res = ap.apply(this, arguments); try { if (d && !d.dim) { U.rebuild(); U.props = (d.c150p || []).map(q => { const o = {t: TY[q[0]], c: q[1], x: q[2], y: q[3], z: q[4], f: q[5]}; if (q[6]) o.v = q[6]; if (q[7]) o.w = q[7]; if (q[8]) o.d = q[8]; if (q[9]) o.h = q[9]; if (q[10]) o.L = q[10]; if (q[11]) o.a = q[11].split(',').map(Number); if (q[12]) o.dead = 1; return o; }).filter(o => o.t); } } catch (e) { U.err = 'load ' + e.message; } return res; };
  const ew = enterWorld; enterWorld = function (save) { try { if (!save) { U.rebuild(); U.props = []; } } catch (_) {} return ew.apply(this, arguments); };
  // ---------- 6. soul lanterns: castle torches tagged soul burn blue ----------
  try { const be = buildEnt; buildEnt = function (type, x, y, z) { const o = be.apply(this, arguments); try { const m = type === T.TORCH && entMeta.get(keyOf(x, y, z)); if (o && m && m.soul && o.g) { const blue = new THREE.Color(0x5ad0ff);
        o.g.traverse(q => { if (q.material && q.material.color && (q.isSprite || q.material.transparent)) { q.material = q.material.clone(); q.material.color = blue.clone(); } }); o.soul = 1; } } catch (_) {} return o; }; } catch (e) { U.err = 'soul ' + e.message; }
})();
