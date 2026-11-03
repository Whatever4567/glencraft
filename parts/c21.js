
/* ===================== GLX-G3 (v0.9.21): gravel + flint, flint & steel fire, obsidian portal, the Hell dimension (terrain + fortress) ===================== */
Object.assign(T, {GRAVEL: 202, FIRE: 204, PORTAL: 205, HELLROCK: 206, SOULSAND: 207, MAGMA: 208, GLOWROCK: 209, HELLBRICK: 210, HBEDROCK: 211}); IT.FLINT = 203;
(function () {
  const cv = (n, f) => { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); let s = 1234 + n; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; f(g, r); return c; };
  const px = (base, vary, extra) => cv(64, (g, r) => { for (let y = 0; y < 64; y += 4) for (let x = 0; x < 64; x += 4) { const k = r(); const c = base.map((v, i) => Math.max(0, Math.min(255, v + (k - .5) * vary[i]))); g.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; g.fillRect(x, y, 4, 4); } if (extra) extra(g, r); }).toDataURL('image/png');
  TEX.gravel = px([128, 122, 116], [70, 70, 70], (g, r) => { for (let i = 0; i < 40; i++) { const v = 70 + r() * 110 | 0; g.fillStyle = `rgb(${v},${v - 6},${v - 10})`; g.fillRect(r() * 60 | 0, r() * 60 | 0, 4 + (r() * 2 | 0) * 4, 4); } });
  TEX.hellrock = px([112, 36, 34], [50, 26, 22], (g, r) => { for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(60,10,12,.6)'; g.fillRect(r() * 60 | 0, r() * 60 | 0, 8, 4); } });
  TEX.soulsand = px([86, 64, 50], [36, 30, 26], (g, r) => { g.fillStyle = 'rgba(30,18,12,.85)'; for (let i = 0; i < 7; i++) { const x = r() * 52 | 0, y = r() * 52 | 0; g.fillRect(x, y, 4, 4); g.fillRect(x + 8, y, 4, 4); g.fillRect(x + 2, y + 8, 8, 4); } });
  TEX.magma = px([90, 30, 14], [40, 20, 10], (g, r) => { for (let i = 0; i < 26; i++) { g.fillStyle = r() < .5 ? '#ff7a18' : '#ffb030'; g.fillRect(r() * 60 | 0, r() * 60 | 0, 4 + (r() * 2 | 0) * 4, 4); } });
  TEX.glowrock = px([236, 196, 110], [40, 50, 60], (g, r) => { for (let i = 0; i < 30; i++) { g.fillStyle = r() < .5 ? '#fff2c0' : '#b07a2a'; g.fillRect(r() * 60 | 0, r() * 60 | 0, 4, 4); } });
  TEX.hellbrick = cv(64, (g, r) => { g.fillStyle = '#2a1014'; g.fillRect(0, 0, 64, 64); for (let row = 0; row < 4; row++) for (let k = 0; k < 3; k++) { const v = 52 + r() * 22 | 0; g.fillStyle = `rgb(${v + 14},${v * .35 | 0},${v * .4 | 0})`; g.fillRect(((k * 24 + (row % 2) * 12) % 72) - 4, row * 16 + 1, 22, 14); } }).toDataURL('image/png');
  TEX.hbedrock = px([44, 40, 42], [60, 60, 60]);
  TEX.fire = cv(64, (g, r) => { for (let x = 0; x < 64; x += 4) { const h = 26 + r() * 34; for (let y = 64 - h; y < 64; y += 4) { const k = (64 - y) / h; g.fillStyle = k > .75 ? '#ffd23a' : k > .4 ? '#ff8a1a' : '#d0360e'; g.globalAlpha = Math.min(1, (64 - y) / 10 + .2); g.fillRect(x, y, 4, 4); } } }).toDataURL('image/png');
  TEX.portal = cv(128, (g, r) => { g.fillStyle = '#3a0848'; g.fillRect(0, 0, 128, 128); g.translate(64, 64); for (let a = 0; a < 360; a += 4) { const t = a / 360 * Math.PI * 8; g.fillStyle = a % 8 ? 'rgba(200,60,220,.55)' : 'rgba(255,60,60,.6)'; g.beginPath(); g.arc(Math.cos(t) * a / 6.5, Math.sin(t) * a / 6.5, 3 + a / 60, 0, 7); g.fill(); } }).toDataURL('image/png');
})();
const glowMat = key => { const m = mat(key); return new THREE.MeshBasicMaterial({map: m.map}); };
[[202, 'gravel', 'Gravel', 2, 0], [206, 'hellrock', 'Hellrock', 3, 1], [207, 'soulsand', 'Soul sand', 2, 0], [208, 'magma', 'Magma block', 4, 1], [209, 'glowrock', 'Glowrock', 1.5, 0], [210, 'hellbrick', 'Hell brick', 6, 1], [211, 'hbedrock', 'Bedrock', 1e9, 0]].forEach(([id, key, name, hard, pick]) => {
  FACES[id] = key; NAMES[id] = name; ICON_KEY[id] = key; HARD[id] = hard; MC_HARD[id] = hard; REQ[id] = id === 211 ? 99 : pick ? 1 : 0; if (pick) NEEDS_PICK.add(id); PLACEABLE.add(id); ORDER.push(id);
  BLOCK_MATS[id] = id === 208 || id === 209 ? glowMat(key) : mat(key);
});
PLACEABLE.delete(211);
NAMES[IT.FLINT] = 'Flint';
ICONS[IT.FLINT] = drawIcon(g => { g.fillStyle = '#2c2c34'; g.beginPath(); g.moveTo(-14, 18); g.lineTo(-18, -4); g.lineTo(-2, -22); g.lineTo(16, -10); g.lineTo(14, 14); g.closePath(); g.fill(); g.fillStyle = '#5a5a68'; g.beginPath(); g.moveTo(-8, -6); g.lineTo(-2, -16); g.lineTo(8, -8); g.closePath(); g.fill(); });
// fire: a cross-shaped flickering block that burns out
NAMES[T.FIRE] = 'Fire'; PLANT[T.FIRE] = 1; PLANT_H[T.FIRE] = 0.95; PLANT_W[T.FIRE] = 1.0; HARD[T.FIRE] = 0.05; MC_HARD[T.FIRE] = 0.05; REQ[T.FIRE] = 0;
const fireTex = mat('fire').map; fireTex.wrapT = THREE.RepeatWrapping;
PLANT_MATS[T.FIRE] = new THREE.MeshBasicMaterial({map: fireTex, transparent: true, alphaTest: 0.15, side: THREE.DoubleSide, depthWrite: false});
// the portal: a swirling purple/red sheet, walk-through
NAMES[T.PORTAL] = 'Portal'; HARD[T.PORTAL] = 1e9; MC_HARD[T.PORTAL] = 1e9; REQ[T.PORTAL] = 99; FACES[T.PORTAL] = 'portal';
const portalTex = mat('portal').map; portalTex.center.set(0.5, 0.5);
BLOCK_MATS[T.PORTAL] = new THREE.MeshBasicMaterial({map: portalTex, transparent: true, opacity: 0.78, side: THREE.DoubleSide, depthWrite: false});
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(202, 206, 207, 208, 209, 210, IT.FLINT);
RECIPES.push(rc('2 Gravel', '1 Cobblestone + 1 Sand', T.GRAVEL, 2, [[T.COBBLE, 1], [T.SAND, 1]]));
for (const r of RECIPES) if (r.out === IT.FLINTSTEEL) { r.need = [[IT.IRONINGOT, 1], [IT.FLINT, 1]]; r.hint = '1 Iron ingot + 1 Flint'; }
RECIPES.push(rc('Hell brick', '4 Hellrock', T.HELLBRICK, 4, [[T.HELLROCK, 4]], 1));
const FLAMMABLE = new Set([T.LOG, T.PLANKS, T.LEAVES, T.WOOL, T.WOOLPURPLE, T.WOOLBLUE, T.WOOLYELLOW, T.WOOLORANGE, T.TALLGRASS, T.BLOSSOM, T.TABLE, T.CHEST === 64 ? -1 : -1, 164, 165, 166, 167, 168, 169]);
const ETERNAL = new Set([T.HELLROCK, T.MAGMA, T.SOULSAND]);
var fires = new Map(), fireT = 0, portalT = 0, portalArm = true;
(function () {
  // solid()/collision: fire and portal are walk-through
  const so = solid; solid = function (x, y, z) { if (y >= 0 && y < H && x >= 0 && z >= 0 && x < W && z < D) { const b = world[idx(x, y, z)]; if (b === T.PORTAL || b === T.FIRE) return false; } return so.apply(this, arguments); };
  const bc = buildChunk; buildChunk = function () { const r = bc.apply(this, arguments); if (chunkST && chunkST[T.PORTAL] !== 2) { chunkST[T.PORTAL] = 2; chunkST[T.FIRE] = 1; return bc.apply(this, arguments); } return r; };
  const df = dropsFor; dropsFor = function (b) { if (b === T.GRAVEL) return Math.random() < 0.15 ? [[IT.FLINT, 1]] : [[T.GRAVEL, 1]]; if (b === T.FIRE || b === T.PORTAL) return []; if (b === T.GLOWROCK) return [[T.GLOWROCK, 1]]; return df.apply(this, arguments); };
  // gravel in new worlds: riverbeds / loch floors and underground pockets (older worlds get it from the crafting recipe, so their reset baseline is untouched)
  const ge = generate;
  generate = function () {
    const r = ge.apply(this, arguments);
    if (DIM.cur || !(current && current.created > 1792555200000)) return r;
    let s = (gSeed || 9) ^ 0x6a7e1; const rnd = () => (s = (Math.imul(s, 16807) >>> 0) % 2147483647) / 2147483647;
    for (let n = 0; n < W * D / 900; n++) { const cx = 4 + rnd() * (W - 8) | 0, cz = 4 + rnd() * (D - 8) | 0, rr = 1.5 + rnd() * 2.5;
      for (let x = cx - 4; x <= cx + 4; x++) for (let z = cz - 4; z <= cz + 4; z++) { if (Math.hypot(x - cx, z - cz) > rr) continue;
        for (let y = H - 2; y > 2; y--) { const b = world[idx(x, y, z)]; if (b === T.AIR) continue; if (b === T.WATER) continue; if ((b === T.SAND || b === T.DIRT) && world[idx(x, y + 1, z)] === T.WATER) world[idx(x, y, z)] = T.GRAVEL; break; } } }
    for (let n = 0; n < W * D / 1400; n++) { const cx = 3 + rnd() * (W - 6) | 0, cz = 3 + rnd() * (D - 6) | 0, cy = 4 + rnd() * (SEA - 6) | 0;
      for (let x = cx - 2; x <= cx + 2; x++) for (let y = cy - 1; y <= cy + 1; y++) for (let z = cz - 2; z <= cz + 2; z++) if (x > 0 && z > 0 && x < W && z < D && world[idx(x, y, z)] === T.STONE && rnd() < 0.7) world[idx(x, y, z)] = T.GRAVEL; }
    return r;
  };
})();
// ---------- the portal frame: any closed obsidian loop, 2..21 wide, 3..21 tall, in either vertical plane ----------
function portalFill(x, y, z, check) {
  for (const ax of [0, 1]) {
    const seen = new Set(), st = [[x, y, z]], cells = []; let ok = true;
    while (st.length && ok) { const [cx, cy, cz] = st.pop(); const k = cx + ',' + cy + ',' + cz; if (seen.has(k)) continue; seen.add(k);
      const b = getB(cx, cy, cz);
      if (b === T.OBSIDIAN) continue;
      if (b !== T.AIR && b !== T.FIRE && !(check && b === T.PORTAL)) { ok = false; break; }
      cells.push([cx, cy, cz]); if (cells.length > 441 || cy <= 0 || cy >= H - 1) { ok = false; break; }
      st.push([cx, cy + 1, cz], [cx, cy - 1, cz]); if (ax === 0) st.push([cx + 1, cy, cz], [cx - 1, cy, cz]); else st.push([cx, cy, cz + 1], [cx, cy, cz - 1]); }
    if (!ok || !cells.length) continue;
    const ys = cells.map(c => c[1]), hs = cells.map(c => ax === 0 ? c[0] : c[2]);
    if (Math.max(...ys) - Math.min(...ys) + 1 < 3 || Math.max(...hs) - Math.min(...hs) + 1 < 2) continue;
    if (check) return cells;
    for (const [cx, cy, cz] of cells) setB(cx, cy, cz, T.PORTAL); return cells;
  }
  return null;
}
function lightPortal(x, y, z) { const cells = portalFill(x, y, z); if (!cells) return false; rebuild(); sfx3d('growl', {x, y, z}, 24); for (const c of cells) burst(c[0] + .5, c[1] + .5, c[2] + .5, Math.random() < .5 ? 0xb040e0 : 0xff4040, 2, .6); toast('The portal roars into life!'); return true; }
// flint & steel: light a portal frame or start a fire; still sets Treemen alight
(function () {
  const ui = useItem;
  useItem = function () {
    if (menuOpen || paused || dead || !started || selId !== IT.FLINTSTEEL || !(cnt(IT.FLINTSTEEL) > 0)) return ui.apply(this, arguments);
    const r = raycast(5);
    if (!r || !r.prev || (typeof reachMob === 'function' && reachMob(3.5))) return ui.apply(this, arguments);
    const [x, y, z] = r.prev; swing(); try { sfx('place', .5, 'stone'); } catch (_) {}
    if (getB(x, y, z) !== T.AIR) return;
    if (getB(...r.hit) === T.OBSIDIAN && DIM.cur !== 'backrooms' && lightPortal(x, y, z)) return;
    setB(x, y, z, T.FIRE); fires.set(idx(x, y, z), 6 + Math.random() * 6); rebuild();
    if (typeof igniteTreeman === 'function') try { igniteTreeman(); } catch (_) {}
  };
})();
// fire tick: modest spread to flammable neighbours, burns them out, dies after a while (rain puts it out)
function fireTick() {
  if (!fires.size) { for (const _ of []) ; }
  const rain = weather.type !== 'clear' && !DIM.cur, add = [];
  for (const [i, life] of fires) {
    const x = Math.floor(i / (H * D)), y = Math.floor(i / D) % H, z = i % D;
    if (world[i] !== T.FIRE) { fires.delete(i); continue; }
    const base = y > 0 ? world[i - D] : 0, eternal = ETERNAL.has(base) && DIM.cur === 'hell';
    let nl = eternal ? life : life - 0.5; if (rain && Math.random() < 0.4) nl = 0;
    if (FLAMMABLE.has(base) && Math.random() < 0.08) { world[i - D] = T.FIRE; markDirty(x, z); add.push(i - D); }
    if (fires.size + add.length < 40) for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]]) {
      const nx = x + dx, ny = y + dy, nz = z + dz; if (nx < 0 || nz < 0 || nx >= W || nz >= D || ny < 1 || ny >= H) continue; const j = idx(nx, ny, nz);
      if (FLAMMABLE.has(world[j]) && Math.random() < 0.05) { world[j] = T.FIRE; markDirty(nx, nz); add.push(j); }
    }
    if (nl <= 0) { world[i] = T.AIR; markDirty(x, z); fires.delete(i); if (FLAMMABLE.has(base) && Math.random() < 0.5) { world[i - D] = T.AIR; markDirty(x, z); } }
    else fires.set(i, nl);
  }
  for (const j of add) fires.set(j, 4 + Math.random() * 5);
  if (add.length || fires.size) rebuild();
}
(function () {
  let portalFx = null;
  const us = updateSky;
  updateSky = function (dt) {
    const r = us.apply(this, arguments);
    portalTex.rotation += dt * 0.9; fireTex.offset.y = (performance.now() / 1000 * 0.6) % 1;
    if (started && !paused) { fireT += dt; if (fireT > 0.5) { fireT = 0; if (fires.size) fireTick(); } }
    if (DIM.cur) { try { cloudMat.opacity = 0; stars.material.opacity = 0; } catch (_) {} }
    if (DIM.cur === 'hell') {
      const f = 0.9 + Math.sin(performance.now() / 900) * 0.05;
      scene.fog.color.setRGB(0.27, 0.06, 0.035); scene.background.copy(scene.fog.color); scene.fog.near = 8; scene.fog.far = PERF ? 44 : 62;
      hemi.intensity = 0.95 * f; hemi.color.setRGB(1, 0.6, 0.42); hemi.groundColor.setRGB(0.6, 0.2, 0.08); sunL.intensity = 0.15; try { skyUniforms.dark.value = 1; } catch (_) {}
    }
    // standing in a portal: purple haze builds, then you're pulled through
    if (started && !paused && !DIM.busy) {
      const fb = getB(Math.floor(P.x), Math.floor(P.y + 0.2), Math.floor(P.z)), bb = getB(Math.floor(P.x), Math.floor(P.y + 1.2), Math.floor(P.z));
      const inP = fb === T.PORTAL || bb === T.PORTAL;
      if (!portalFx) { portalFx = document.createElement('div'); portalFx.style.cssText = 'position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle,rgba(160,40,200,.15),rgba(120,10,60,.85));opacity:0;transition:opacity .2s;z-index:5'; document.body.appendChild(portalFx); }
      if (inP && portalArm && DIM.cur !== 'backrooms') {
        portalT += dt; portalFx.style.opacity = Math.min(1, portalT / 2);
        if (portalT > (current && current.mode === 'creative' ? 0.8 : 2.2)) { portalT = 0; portalArm = false; portalFx.style.opacity = 0;
          if (DIM.cur === 'hell') exitDim(); else enterDim('hell', genHell, spawnHell); }
      } else { if (!inP) portalArm = true; portalT = 0; portalFx.style.opacity = 0; }
    }
    return r;
  };
  // fire burns the player standing in it
  let burnCd = 0;
  const up = updatePlayer;
  updatePlayer = function (dt) { const r = up.apply(this, arguments); burnCd -= dt; if (burnCd <= 0 && !MODE.noDamage && getB(Math.floor(P.x), Math.floor(P.y + 0.2), Math.floor(P.z)) === T.FIRE) { burnCd = 0.6; hurt(1, 'Burned to a crisp.'); } return r; };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); if (fires.size) d.fires = [...fires]; return d; };
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); fires = new Map(d && d.fires || []); return r; };
  const ge = generate; generate = function () { fires = new Map(); return ge.apply(this, arguments); };
})();
// ---------- Hell: hellrock caverns over a lava sea, soul sand, magma, glowrock, a hellbrick fortress ----------
const HELL_W = 160, HELL_H = 64, HELL_LAVA = 14;
var hellFort = null;
function genHell() {
  H = HELL_H; setWorldSize(HELL_W); world.fill(0);
  const seed = ((gSeed || 7) ^ 0x5e11a) >>> 0;
  const hsh = (a, b, c) => { let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483587) ^ seed; h = Math.imul(h ^ (h >>> 13), 1274126177); return (((h ^ (h >>> 16)) >>> 0) / 4294967296) * 2 - 1; };
  // coarse lattice noise, trilinear: cheap enough for a phone
  const lat = (sx, sy, salt) => { const nx = Math.ceil(HELL_W / sx) + 2, ny = Math.ceil(HELL_H / sy) + 2, a = new Float32Array(nx * ny * nx); for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nx; k++) a[(i * ny + j) * nx + k] = hsh(i + salt, j, k); return {a, nx, ny, sx, sy}; };
  const L1 = lat(16, 12, 0), L2 = lat(7, 6, 999);
  const smp = (L, x, y, z) => { const fx = x / L.sx, fy = y / L.sy, fz = z / L.sx, i = fx | 0, j = fy | 0, k = fz | 0, u = fx - i, v = fy - j, w = fz - k, nx = L.nx, ny = L.ny, A = L.a;
    const g = (a, b, c) => A[((i + a) * ny + j + b) * nx + k + c];
    const x00 = g(0, 0, 0) + (g(1, 0, 0) - g(0, 0, 0)) * u, x10 = g(0, 1, 0) + (g(1, 1, 0) - g(0, 1, 0)) * u, x01 = g(0, 0, 1) + (g(1, 0, 1) - g(0, 0, 1)) * u, x11 = g(0, 1, 1) + (g(1, 1, 1) - g(0, 1, 1)) * u;
    const y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v; return y0 + (y1 - y0) * w; };
  for (let x = 0; x < HELL_W; x++) for (let z = 0; z < HELL_W; z++) for (let y = 0; y < HELL_H; y++) {
    const i = idx(x, y, z);
    if (y === 0 || y === HELL_H - 1) { world[i] = T.HBEDROCK; continue; }
    let bias = -0.22; if (y < 22) bias += (22 - y) / 22 * 0.75; if (y > 48) bias += (y - 48) / 14 * 1.1; if (y < 4) bias += 2;
    const edge = Math.min(x, z, HELL_W - 1 - x, HELL_W - 1 - z); if (edge < 6) bias += (6 - edge) * 0.35;
    const n = smp(L1, x, y, z) * 0.65 + smp(L2, x, y, z) * 0.35 + bias;
    world[i] = n > 0.1 ? T.HELLROCK : y <= HELL_LAVA ? T.LAVA : T.AIR;
  }
  const r2 = (x, z, s) => (hsh(x, s, z) + 1) / 2;
  for (let x = 1; x < HELL_W - 1; x++) for (let z = 1; z < HELL_W - 1; z++) for (let y = HELL_H - 2; y > 1; y--) {
    const i = idx(x, y, z), b = world[i]; if (b !== T.HELLROCK) continue;
    const above = world[i + D], below = world[i - D];
    if (above === T.AIR || above === T.LAVA) {
      if (y <= HELL_LAVA + 2 && r2(x, z, y) < 0.35) world[i] = T.MAGMA;
      else if (smp(L2, x * 1.7, 3, z * 1.7) > 0.25) { world[i] = T.SOULSAND; if (world[i - D] === T.HELLROCK) world[i - D] = T.SOULSAND; }
    }
    if (below === T.AIR && y > 34 && r2(x, z, y + 7) < 0.012) { const len = 1 + (r2(z, x, 3) * 4 | 0); for (let k = 1; k <= len; k++) { if (world[i - k * D] !== T.AIR) break; world[i - k * D] = T.GLOWROCK; if (r2(x + k, z, 5) < 0.4 && world[i - k * D + 1] === T.AIR) world[i - k * D + 1] = T.GLOWROCK; } }
    if (r2(x, z, y + 99) < 0.006) world[i] = T.GOLDORE;
  }
  // fortress: two crossing hellbrick bridges, a keep at the crossing, rooms at the ends with loot
  const fx = 108, fz = 100, fy = 34; hellFort = {x: fx, y: fy + 1, z: fz};
  const put = (x, y, z, b) => { if (x > 0 && z > 0 && x < HELL_W - 1 && z < HELL_W - 1 && y > 0 && y < HELL_H - 1) world[idx(x, y, z)] = b; };
  const bridge = (x0, z0, x1, z1) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const ex = (x1 - x0 > z1 - z0) ? (z === z0 || z === z1) : (x === x0 || x === x1);
      put(x, fy, z, T.HELLBRICK); for (let y = fy + 1; y <= fy + 4; y++) put(x, y, z, T.AIR); if (ex) put(x, fy + 1, z, ((x + z) % 4) ? T.HELLBRICK : T.AIR);
      if ((x1 - x0 > z1 - z0 ? x % 9 === 0 : z % 9 === 0) && !ex) for (let y = fy - 1; y > 1 && world[idx(x, y, z)] !== T.HELLROCK && world[idx(x, y, z)] !== T.SOULSAND; y--) put(x, y, z, T.HELLBRICK); } };
  bridge(52, fz - 2, 150, fz + 2); bridge(fx - 2, 46, fx + 2, 150);
  const room = (cx, cz, r, hgt) => { for (let x = cx - r; x <= cx + r; x++) for (let z = cz - r; z <= cz + r; z++) { const wall = Math.abs(x - cx) === r || Math.abs(z - cz) === r;
      put(x, fy, z, T.HELLBRICK); put(x, fy + hgt, z, T.HELLBRICK); for (let y = fy + 1; y < fy + hgt; y++) put(x, y, z, wall ? T.HELLBRICK : T.AIR); }
    for (const [dx, dz] of [[r, 0], [-r, 0], [0, r], [0, -r]]) for (let y = fy + 1; y <= fy + 3; y++) for (let k = -1; k <= 1; k++) put(cx + dx + (dz ? k : 0), y, cz + dz + (dx ? k : 0), T.AIR);
    put(cx, fy + hgt - 1, cz, T.GLOWROCK); for (let y = fy - 1; y > 1 && world[idx(cx, y, cz)] !== T.HELLROCK; y--) for (const [a, b] of [[-r, -r], [r, -r], [-r, r], [r, r]]) put(cx + a, y, cz + b, T.HELLBRICK); };
  room(fx, fz, 6, 7); room(148 - 4, fz, 4, 5); room(fx, 148 - 4, 4, 5); room(56, fz, 4, 5);
  let s = seed; const rnd = () => (s = (Math.imul(s, 16807) >>> 0) % 2147483647) / 2147483647;
  const LOOT = [[IT.DIAMOND, 2, 0.45], [IT.GOLDINGOT, 5, 0.7], [T.OBSIDIAN, 6, 0.5], [IT.FLINTSTEEL, 1, 0.35], [IT.IRONINGOT, 6, 0.6], [IT.LAVAB, 1, 0.25], [IT.CLAYMORE || IT.ISWORD, 1, 0.2], [T.GLOWROCK, 6, 0.5], [IT.PAINTING, 1, 0.05]];
  try { crops.clear(); chests.clear(); doorState.clear(); furnaces.clear(); entMeta.clear(); } catch (_) {}
  for (const [x, z] of [[fx - 4, fz - 4], [fx + 4, fz + 4], [144, fz + 2], [fx + 2, 144], [56, fz - 2]]) lootChest(x, fy + 1, z, LOOT, rnd);
  for (const [x, z] of [[fx + 5, fz - 5], [fx - 5, fz + 5]]) put(x, fy + 1, z, T.FIRE);
}
function spawnHell() {
  const ax = 40, az = 50; let fy = -1;
  for (let y = 40; y > HELL_LAVA + 2; y--) if (world[idx(ax, y, az)] !== T.AIR && world[idx(ax, y, az)] !== T.LAVA && world[idx(ax, y + 1, az)] === T.AIR) { fy = y; break; }
  if (fy < 0) fy = 30;
  // a safe hellrock platform with a lit return portal behind you
  for (let x = ax - 4; x <= ax + 4; x++) for (let z = az - 5; z <= az + 4; z++) { world[idx(x, fy, z)] = T.HELLROCK; for (let y = fy + 1; y <= fy + 5; y++) world[idx(x, y, z)] = T.AIR; }
  const pz = az - 4;
  for (let x = ax - 1; x <= ax + 2; x++) for (let y = fy + 1; y <= fy + 5; y++) { const edge = x === ax - 1 || x === ax + 2 || y === fy + 1 || y === fy + 5; world[idx(x, y, pz)] = edge ? T.OBSIDIAN : T.PORTAL; }
  P.x = ax + 1; P.z = az + 0.5; P.y = fy + 1; P.yaw = 0; P.pitch = 0; portalArm = true;
  try { if (typeof hellPopulate === 'function') hellPopulate(); } catch (_) {}
}
(function () { const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); if (d && d.dim === 'hell') hellFort = d.hellFort || {x: 108, y: 35, z: 100}; return r; };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); if (DIM.cur === 'hell' && hellFort) d.hellFort = hellFort; return d; }; })();
