
/* ===================== GLX-G2 (v0.9.20): Minecraft-style water + lava flow, buckets of lava, HUD label in other dimensions ===================== */
// Levels live in a side map (idx -> 1..7 flowing); a water/lava block with no entry is a source. Only changed cells are queued, so idle seas cost nothing.
var FLV = new Map(), FLQ = new Set(), flGen = false, flT = 0, flLavaT = 0;
IT.LAVAB = 201; NAMES[IT.LAVAB] = 'Lava bucket';
ICONS[IT.LAVAB] = drawIcon(g => { g.strokeStyle = '#3b2a1a'; g.lineWidth = 3; g.beginPath(); g.arc(0, -8, 18, Math.PI, 0); g.stroke(); g.fillStyle = '#8a6239'; g.beginPath(); g.moveTo(-18, -8); g.lineTo(18, -8); g.lineTo(13, 24); g.lineTo(-13, 24); g.closePath(); g.fill(); g.fillStyle = '#ff7a1a'; g.beginPath(); g.ellipse(0, -8, 17, 5, 0, 0, 7); g.fill(); g.fillStyle = '#ffd040'; g.fillRect(-6, -10, 5, 2); });
FUEL[IT.LAVAB] = 400;
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(IT.LAVAB);
const isFl = b => b === T.WATER || b === T.LAVA;
function flPush(i) { if (FLQ.size < 20000) FLQ.add(i); }
function flQueue(x, y, z) {
  const i = idx(x, y, z); if (isFl(world[i])) flPush(i);
  if (x > 0 && isFl(world[i - H * D])) flPush(i - H * D); if (x < W - 1 && isFl(world[i + H * D])) flPush(i + H * D);
  if (y > 0 && isFl(world[i - D])) flPush(i - D); if (y < H - 1 && isFl(world[i + D])) flPush(i + D);
  if (z > 0 && isFl(world[i - 1])) flPush(i - 1); if (z < D - 1 && isFl(world[i + 1])) flPush(i + 1);
}
const flInto = b => b === T.AIR || (PLANT[b] === 1 && b !== T.COBWEB && b !== 205);
function flSet(x, y, z, b, lv) { const i = idx(x, y, z); world[i] = b; if (lv) FLV.set(i, lv); else FLV.delete(i); markDirty(x, z); if (y > 0) markDirty(x, z); flQueue(x, y, z); }
function flFizz(x, y, z) { try { burst(x + .5, y + 1, z + .5, 0xcccccc, 6, .5); sfx3d('splash', {x, y, z}, 14); } catch (_) {} }
function flowCell(i) {
  const b = world[i]; if (!isFl(b)) { FLV.delete(i); return; }
  const x = Math.floor(i / (H * D)), y = Math.floor(i / D) % H, z = i % D;
  const lava = b === T.LAVA, max = lava ? (DIM.cur === 'hell' ? 6 : 3) : 7;
  let lv = FLV.get(i) || 0;
  const HZ = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  if (lava) for (const [dx, dz] of HZ.concat([[0, 0]])) {   // lava touching water hardens: source -> obsidian, flowing -> cobble
    const yy = dx || dz ? y : y + 1; if (yy >= H) continue; const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= W || nz >= D) continue;
    if (world[idx(nx, yy, nz)] === T.WATER) { flSet(x, y, z, lv ? T.COBBLE : T.OBSIDIAN, 0); flFizz(x, y, z); return; }
  }
  if (lv > 0) {
    let want = 99;
    if (y + 1 < H && world[i + D] === b) want = 1;
    else for (const [dx, dz] of HZ) { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= W || nz >= D) continue; const j = idx(nx, y, nz); if (world[j] === b) want = Math.min(want, (FLV.get(j) || 0) + 1); }
    if (!lava) { let s = 0; for (const [dx, dz] of HZ) { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= W || nz >= D) continue; const j = idx(nx, y, nz); if (world[j] === T.WATER && !FLV.has(j)) s++; }
      if (s >= 2 && y > 0 && (solid(x, y - 1, z) || (world[i - D] === T.WATER && !FLV.has(i - D)))) want = 0; }   // infinite water source
    if (want > max) { world[i] = T.AIR; FLV.delete(i); markDirty(x, z); flQueue(x, y, z); return; }
    if (want !== lv) { if (want) FLV.set(i, want); else FLV.delete(i); markDirty(x, z); flQueue(x, y, z); lv = want; }
  }
  if (y > 0) {
    const bb = world[i - D];
    if (flInto(bb)) { flSet(x, y - 1, z, b, 1); return; }
    if (!lava && bb === T.LAVA) { flSet(x, y - 1, z, FLV.has(i - D) ? T.COBBLE : T.OBSIDIAN, 0); flFizz(x, y - 1, z); return; }
    if (lava && bb === T.WATER) { flSet(x, y - 1, z, T.STONE, 0); flFizz(x, y - 1, z); return; }
    if (bb === b) return;   // falling onto itself: no sideways spread
  }
  if (lv + 1 > max) return;
  for (const [dx, dz] of HZ) {
    const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx >= W || nz >= D) continue; const j = idx(nx, y, nz), nb = world[j];
    if (flInto(nb)) flSet(nx, y, nz, b, lv + 1);
    else if (nb === b && FLV.has(j) && FLV.get(j) > lv + 1) flPush(j);
    else if (lava && nb === T.WATER) { flSet(x, y, z, lv ? T.COBBLE : T.OBSIDIAN, 0); flFizz(x, y, z); return; }
  }
}
function flowTick(lavaToo) {
  if (!FLQ.size) return;
  const batch = []; for (const i of FLQ) { const b = world[i]; if (b === T.WATER || (lavaToo && b === T.LAVA) || !isFl(b)) batch.push(i); if (batch.length >= (PERF ? 160 : 320)) break; }
  for (const i of batch) FLQ.delete(i);
  for (const i of batch) flowCell(i);
}
(function () {
  const sb = setB;
  setB = function (x, y, z, v) { const r = sb.apply(this, arguments); if (started && !flGen && x >= 0 && z >= 0 && x < W && z < D && y >= 0 && y < H) { const i = idx(x, y, z); if (!isFl(v)) FLV.delete(i); flQueue(x, y, z); } return r; };
  const ge = generate;
  generate = function () { flGen = true; try { return ge.apply(this, arguments); } finally { flGen = false; FLV.clear(); FLQ.clear(); } };
  const ser = serialize;
  serialize = function () { const d = ser.apply(this, arguments); if (FLV.size) { const a = []; for (const [k, v] of FLV) a.push(k, v); d.flv = a; } return d; };
  const ap = applySave;
  applySave = function (d) { flGen = true; try { return ap.apply(this, arguments); } finally { flGen = false; FLV.clear(); FLQ.clear(); if (d && d.flv) for (let k = 0; k < d.flv.length; k += 2) { FLV.set(d.flv[k], d.flv[k + 1]); FLQ.add(d.flv[k]); } } };
  // ticks: water every 0.25 s, lava every 1.5 s (0.5 s in Hell), in small batches
  const us = updateSky;
  updateSky = function (dt) {
    const r = us.apply(this, arguments);
    if (started && !paused) { flT += dt; flLavaT += dt; const lt = DIM.cur === 'hell' ? 0.5 : 1.5; if (flT >= 0.25) { flT = 0; const lavaNow = flLavaT >= lt; if (lavaNow) flLavaT = 0; flowTick(lavaNow); } }
    if (DIM.cur) { weather.type = 'clear'; weather.pending = null; const t = DIM.cur === 'backrooms' ? 'Level 0' : DIM.cur === 'hell' ? 'Hell' : DIM.cur; if ($('clockTx').textContent !== t) $('clockTx').textContent = t; $('sunIc').classList.add('moon'); }
    return r;
  };
  // flowing water / lava pushes you and items downstream
  const flowVec = (x, y, z) => {
    if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1 || y < 0 || y >= H) return null; const i = idx(x, y, z), b = world[i]; if (!isFl(b) || !FLV.has(i)) return null;
    const lv = FLV.get(i); let fx = 0, fz = 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = idx(x + dx, y, z + dz), nb = world[j]; let nl; if (nb === b) nl = FLV.get(j) || 0; else if (flInto(nb)) nl = 8; else continue; fx += dx * (nl - lv); fz += dz * (nl - lv); }
    const m = Math.hypot(fx, fz); return m ? [fx / m, fz / m, b === T.LAVA ? 0.6 : 2.0] : null;
  };
  const up = updatePlayer;
  updatePlayer = function (dt) {
    const r = up.apply(this, arguments);
    if (FLV.size && !riding && !MODE.fly) { const v = flowVec(Math.floor(P.x), Math.floor(P.y + 0.2), Math.floor(P.z));
      if (v) { /* v1.0.93: the current checks your whole body width, so it can never shove you into a block */ const nx = P.x + v[0] * v[2] * dt, nz = P.z + v[1] * v[2] * dt, fr = (x, z) => { for (const y of [P.y + 0.2, P.y + 1.2, P.y + 1.7]) for (const ox of [-0.29, 0.29]) for (const oz of [-0.29, 0.29]) if (solid(Math.floor(x + ox), Math.floor(y), Math.floor(z + oz))) return false; return true; }; if (fr(nx, P.z)) P.x = nx; if (fr(P.x, nz)) P.z = nz; } }
    if (FLV.size) for (const d of drops) { const v = flowVec(Math.floor(d.x), Math.floor(d.y), Math.floor(d.z)); if (v && !solid(Math.floor(d.x + v[0] * 0.4), Math.floor(d.y), Math.floor(d.z + v[1] * 0.4))) { d.x += v[0] * v[2] * dt; d.z += v[1] * v[2] * dt; if (d.m) { d.m.position.x = d.x; d.m.position.z = d.z; } } }
    return r;
  };
  // buckets: scoop a source of water or lava, pour it anywhere (water boils away in Hell)
  const flRay = () => { const d = lookDir(), ox = P.x, oy = P.y + EYE, oz = P.z; let prev = null;
    for (let t = 0; t < 5; t += 0.05) { const x = Math.floor(ox + d[0] * t), y = Math.floor(oy + d[1] * t), z = Math.floor(oz + d[2] * t), b = getB(x, y, z);
      if (isFl(b)) return {hit: [x, y, z], b, src: !FLV.has(idx(x, y, z)), prev}; if (b !== T.AIR && PLANT[b] !== 1) return {hit: [x, y, z], b, solid: true, prev}; prev = [x, y, z]; } return null; };
  const ui = useItem;
  useItem = function () {
    if (menuOpen || paused || dead || !started) return ui.apply(this, arguments);
    const id = selId, have = cnt(id) > 0;
    if (have && id === IT.BUCKET) {
      const h = flRay();
      if (h && !h.solid) {
        if (!h.src) { toast('That is flowing - find the source block'); return; }
        const [x, y, z] = h.hit; world[idx(x, y, z)] = T.AIR; FLV.delete(idx(x, y, z)); markDirty(x, z); flQueue(x, y, z); rebuild();
        useUp(IT.BUCKET); const nid = h.b === T.LAVA ? IT.LAVAB : IT.WATERB; addItem(nid, 1); selId = nid; swing(); try { sfx('splash'); } catch (_) {} renderHotbar();
        toast(h.b === T.LAVA ? 'Filled the bucket with lava - careful!' : 'Filled the bucket with water'); return;
      }
    }
    if (have && (id === IT.WATERB || id === IT.LAVAB)) {
      const h = flRay();
      if (h && h.solid && h.b === T.CAULDRON && id === IT.WATERB) return ui.apply(this, arguments);
      const at = h ? (h.solid ? h.prev : h.hit) : null;
      if (at && flInto(getB(...at)) || at && isFl(getB(...at))) {
        const [x, y, z] = at;
        if (id === IT.WATERB && DIM.cur === 'hell') { flFizz(x, y, z); toast('The water boils away instantly!'); }
        else { world[idx(x, y, z)] = id === IT.LAVAB ? T.LAVA : T.WATER; FLV.delete(idx(x, y, z)); markDirty(x, z); flQueue(x, y, z); rebuild(); }
        useUp(id); addItem(IT.BUCKET, 1); selId = IT.BUCKET; swing(); try { sfx('splash'); } catch (_) {} renderHotbar(); return;
      }
      toast('Aim at a block to pour it on'); return;
    }
    return ui.apply(this, arguments);
  };
})();
