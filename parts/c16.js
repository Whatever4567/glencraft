
/* ===================== GLX-F2 (v0.9.16): Scottish ores & items (Cairngorm quartz, silver, river gold, claymore, targe, kilt), Highland Flare ===================== */
function procTex(base, spots, seed) {   // 64px stone-like tile with coloured mineral flecks
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < 64; y += 4) for (let x = 0; x < 64; x += 4) { const v = base + (rnd() - 0.5) * 30 | 0; g.fillStyle = `rgb(${v},${v},${v + 2})`; g.fillRect(x, y, 4, 4); }
  for (const [col, n, sz] of spots) for (let i = 0; i < n; i++) { const x = rnd() * 56 + 4, y = rnd() * 56 + 4; g.fillStyle = col; g.beginPath(); g.moveTo(x, y - sz); g.lineTo(x + sz * 0.7, y); g.lineTo(x, y + sz); g.lineTo(x - sz * 0.7, y); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - 1, y - sz * 0.5, 2, 2); }
  return c.toDataURL('image/png');
}
Object.assign(T, {CAIRNORE: 179, SILVERORE: 181});
Object.assign(IT, {CAIRNGORM: 180, RAWSILVER: 182, SILVERINGOT: 183, GOLDNUGGET: 184, CLAYMORE: 185, TARGE: 186, KILT: 187, FLARE: 188});
TEX.cairngorm_ore = procTex(118, [['#6b4a32', 7, 6], ['#9a7450', 5, 4], ['#3a2a20', 4, 3]], 31);
TEX.silver_ore = procTex(120, [['#dfe6ee', 9, 4], ['#aab4c0', 6, 3]], 57);
for (const [id, key, name, hd] of [[179, 'cairngorm_ore', 'Cairngorm quartz ore', 3.2], [181, 'silver_ore', 'Silver ore', 3]]) {
  FACES[id] = key; BLOCK_MATS[id] = mat(key); NAMES[id] = name; ICON_KEY[id] = key; HARD[id] = hd * 1.1; MC_HARD[id] = hd; REQ[id] = 2; NEEDS_PICK.add(id); PLACEABLE.add(id); ORDER.push(id);
}
Object.assign(NAMES, {[IT.CAIRNGORM]: 'Cairngorm (smoky quartz)', [IT.RAWSILVER]: 'Raw silver', [IT.SILVERINGOT]: 'Silver ingot', [IT.GOLDNUGGET]: 'Scottish gold nugget',
  [IT.CLAYMORE]: 'Claymore', [IT.TARGE]: 'Targe shield', [IT.KILT]: 'Tartan kilt', [IT.FLARE]: 'Highland Flare'});
ICONS[IT.CAIRNGORM] = drawIcon(g => { const gr = g.createLinearGradient(-10, -24, 10, 24); gr.addColorStop(0, '#c49a70'); gr.addColorStop(1, '#4a3020'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, -26); g.lineTo(12, -10); g.lineTo(10, 22); g.lineTo(-10, 22); g.lineTo(-12, -10); g.closePath(); g.fill(); g.strokeStyle = '#2a1a10'; g.lineWidth = 2; g.stroke(); g.fillStyle = 'rgba(255,240,220,.5)'; g.fillRect(-6, -12, 4, 26); });
ICONS[IT.RAWSILVER] = drawIcon(g => { g.fillStyle = '#9aa4ae'; g.beginPath(); g.moveTo(-18, 6); g.lineTo(-8, -16); g.lineTo(12, -14); g.lineTo(20, 4); g.lineTo(6, 18); g.lineTo(-12, 16); g.fill(); g.fillStyle = '#e0e8f0'; g.fillRect(-6, -8, 6, 6); g.fillRect(6, 2, 5, 5); });
ICONS[IT.SILVERINGOT] = drawIcon(g => { g.fillStyle = '#e6ecf2'; g.beginPath(); g.moveTo(-24, 8); g.lineTo(-14, -8); g.lineTo(24, -8); g.lineTo(14, 8); g.closePath(); g.fill(); g.fillStyle = '#b8c2cc'; g.beginPath(); g.moveTo(-24, 8); g.lineTo(14, 8); g.lineTo(14, 14); g.lineTo(-24, 14); g.fill(); g.strokeStyle = '#6a7480'; g.lineWidth = 2; g.strokeRect(-24, 8, 38, 6); });
ICONS[IT.GOLDNUGGET] = drawIcon(g => { for (const [x, y, r] of [[-6, 4, 9], [7, -3, 8], [3, 10, 6]]) { g.fillStyle = '#f2c440'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#fff2a0'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, 7); g.fill(); } });
ICONS[IT.CLAYMORE] = drawIcon(g => { g.rotate(-Math.PI / 4); g.fillStyle = '#d8dee4'; g.fillRect(-3, -30, 6, 40); g.fillStyle = '#7a8088'; g.fillRect(-1, -28, 2, 36); g.fillStyle = '#c0a050'; g.fillRect(-14, 10, 28, 4); g.fillStyle = '#5a3a1a'; g.fillRect(-3, 14, 6, 12); g.fillStyle = '#c0a050'; g.beginPath(); g.arc(0, 28, 4, 0, 7); g.fill(); for (const s of [-1, 1]) { g.fillRect(s * 14 - 2, 6, 4, 4); } });
ICONS[IT.TARGE] = drawIcon(g => { g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fill(); g.strokeStyle = '#2a1a0a'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#c0c6cc'; for (let a = 0; a < 12; a++) { g.beginPath(); g.arc(Math.cos(a * 0.524) * 18, Math.sin(a * 0.524) * 18, 2.2, 0, 7); g.fill(); } g.beginPath(); g.arc(0, 0, 7, 0, 7); g.fill(); g.strokeStyle = '#8a6a3a'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.stroke(); });
ICONS[IT.KILT] = drawIcon(g => { const cols = ['#1f3f7a', '#2f6f3a', '#1f3f7a', '#b02a2a']; for (let i = 0; i < 8; i++) { g.fillStyle = cols[i % 4]; g.fillRect(-22 + i * 5.5, -14, 5.5, 34); } g.globalAlpha = .45; for (let j = 0; j < 6; j++) { g.fillStyle = cols[(j + 1) % 4]; g.fillRect(-22, -14 + j * 6, 44, 3); } g.globalAlpha = 1; g.fillStyle = '#3a2a14'; g.fillRect(-23, -20, 46, 7); g.fillStyle = '#c0a050'; g.fillRect(-4, -19, 8, 5); });
ICONS[IT.FLARE] = drawIcon(g => { g.rotate(-0.5); g.fillStyle = '#c0392b'; g.fillRect(-6, -18, 12, 34); g.fillStyle = '#f0e0c0'; g.fillRect(-6, -4, 12, 6); g.fillStyle = '#ffcc40'; g.beginPath(); g.moveTo(-6, -18); g.lineTo(0, -28); g.lineTo(6, -18); g.fill(); g.fillStyle = '#6b4a22'; g.fillRect(-2, 16, 4, 10); });
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(179, 181, IT.CAIRNGORM, IT.RAWSILVER, IT.SILVERINGOT, IT.GOLDNUGGET, IT.CLAYMORE, IT.TARGE, IT.KILT, IT.FLARE);
SMELT[IT.RAWSILVER] = IT.SILVERINGOT;
TOOL[IT.CLAYMORE] = ['sword', 3, 1, 8]; TOOLS.add(IT.CLAYMORE);
ARMOUR_COL.tartan = 0x2f4f7a; ARMOUR[IT.KILT] = {slot: 2, mat: 'tartan', pts: 4};
RECIPES.push(rc('Claymore', '3 Iron ingots + 1 Silver ingot + 2 Sticks', IT.CLAYMORE, 1, [[IT.IRONINGOT, 3], [IT.SILVERINGOT, 1], [IT.STICK, 2]], 1, 1));
RECIPES.push(rc('Targe shield', '4 Planks + 2 Iron ingots + 1 Wool', IT.TARGE, 1, [[T.PLANKS, 4], [IT.IRONINGOT, 2], [T.WOOL, 1]], 1));
RECIPES.push(rc('Tartan kilt', '5 Wool + 1 Silver ingot', IT.KILT, 1, [[T.WOOL, 5], [IT.SILVERINGOT, 1]], 1));
RECIPES.push(rc('Highland Flare (x2)', '1 Gunpowder + 1 Stick + 1 Redstone', IT.FLARE, 2, [[IT.GUNPOWDER, 1], [IT.STICK, 1], [IT.REDSTONE, 1]], 1));
RECIPES.push(rc('Gold ingot', '9 Scottish gold nuggets', IT.GOLDINGOT, 1, [[IT.GOLDNUGGET, 9]], 1));
RECIPES.push(rc('Cairngorm brooch lamp', '1 Cairngorm + 1 Silver ingot + 1 Torch', T.LAMP || T.TORCH, 2, [[IT.CAIRNGORM, 1], [IT.SILVERINGOT, 1], [T.TORCH, 1]], 1));
(function () {
  const df = dropsFor;
  dropsFor = function (b) {
    if (b === T.CAIRNORE) return [[IT.CAIRNGORM, 1 + (Math.random() < 0.3 ? 1 : 0)]];
    if (b === T.SILVERORE) return [[IT.RAWSILVER, 1]];
    const r = df.apply(this, arguments);
    if ((b === T.SAND || b === T.DIRT) && Math.random() < 0.06) { const p = P; if (getB(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)) === T.WATER || p.y < SEA + 2) return (r || []).concat([[IT.GOLDNUGGET, 1]]); }   // panning river gold
    return r;
  };
  const g = generate;
  generate = function () { const r = g.apply(this, arguments); if (genVer >= GEN9 && !cityGen && W > 200) { try { placeOreVeins(T.SILVERORE, Math.round(9 * W * D / 3136), 6, 34, 2, 5); placeOreVeins(T.CAIRNORE, Math.round(5 * W * D / 3136), 30, 70, 1, 3); } catch (e) { console.warn(e); } } return r; };
  // claymore looks like a big iron sword
  const mi = makeItemMesh;
  makeItemMesh = function (id) { if (id === IT.CLAYMORE) { const m = mi.call(this, IT.ISWORD); m.scale.set(1.15, 1.6, 1.15); return m; } return mi.apply(this, arguments); };
  // targe: carried in your pack, it turns aside a quarter of every blow
  const h = hurt;
  hurt = function (n, cause) { if (cnt(IT.TARGE) > 0 && n > 1) n = n * 0.75; return h.call(this, n, cause); };
})();
// ---------- Highland Flare: thrown in an arc, bursts and floats down lighting ~24 blocks for 60 s ----------
var flares = [], flareLights = [0, 1].map(() => { const l = new THREE.PointLight(0xff6a3a, 0, 30, 1.1); scene.add(l); return l; });
const flareTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,220,1)'); gr.addColorStop(0.3, 'rgba(255,120,60,.8)'); gr.addColorStop(1, 'rgba(255,60,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
function throwFlare() {
  const d = lookDir(), s = new THREE.Sprite(new THREE.SpriteMaterial({map: flareTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true}));
  s.scale.setScalar(0.6); s.position.set(P.x + d[0] * 0.8, P.y + EYE + d[1] * 0.8, P.z + d[2] * 0.8); scene.add(s);
  flares.push({s, v: [d[0] * 22, d[1] * 22 + 6, d[2] * 22], t: 0, burst: false, life: 60, light: null});
  try { sfx('swoosh', 0.8); } catch (_) {}
}
function updateFlares(dt) {
  for (let i = flares.length - 1; i >= 0; i--) {
    const f = flares[i], p = f.s.position; f.t += dt;
    if (!f.burst) {
      f.v[1] -= 14 * dt; const nx = p.x + f.v[0] * dt, ny = p.y + f.v[1] * dt, nz = p.z + f.v[2] * dt;
      const hit = getB(Math.floor(nx), Math.floor(ny), Math.floor(nz)); const solidHit = hit !== T.AIR && hit !== T.WATER && !PLANT[hit];
      if (!solidHit) p.set(nx, ny, nz);
      if (f.t > 1.4 || solidHit || f.v[1] < -2) {
        f.burst = true; f.s.scale.setScalar(5); burst(p.x, p.y, p.z, 0xffa040, 24, 1.6); try { sfx('boom', 0.35); } catch (_) {}
        const free = flareLights.find(l => !flares.some(o => o.light === l)) || flareLights[0]; f.light = free;
      }
    } else {
      f.life -= dt; const k = Math.min(1, f.life / 8);
      if (getB(Math.floor(p.x), Math.floor(p.y - 0.6), Math.floor(p.z)) === T.AIR) p.y -= dt * 0.9;   // floats down on a wee parachute
      p.x += Math.sin(f.t * 0.7) * dt * 0.3;
      f.s.material.opacity = (0.8 + Math.sin(f.t * 23) * 0.1 + Math.sin(f.t * 7) * 0.1) * k;
      if (f.light) { f.light.position.copy(p); f.light.intensity = (2.6 + Math.sin(f.t * 19) * 0.3) * k; f.light.distance = 30; }
      if (Math.random() < dt * 8) burst(p.x, p.y - 0.2, p.z, 0xff7040, 1, 0.4);
      if (f.life <= 0) { if (f.light) f.light.intensity = 0; scene.remove(f.s); flares.splice(i, 1); }
    }
  }
}
(function () {
  const ui = useItem;
  useItem = function () { if (selId === IT.FLARE && cnt(IT.FLARE) > 0 && !riding) { throwFlare(); if (!MODE.infinite) { inv[IT.FLARE]--; if (inv[IT.FLARE] <= 0) delete inv[IT.FLARE]; } renderHotbar(); swing('place'); return; } return ui.apply(this, arguments); };
  const up = updatePlayer;
  updatePlayer = function (dt) { try { updateFlares(dt); } catch (_) {} return up.apply(this, arguments); };
})();
