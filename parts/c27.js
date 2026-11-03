
/* ===================== GLX-H4 (v0.9.27): Highland flintlock pistol + musket, and uses for the Scottish ores ===================== */
Object.assign(IT, {PISTOL: 212, MUSKET: 213, CARTRIDGE: 214, SILVERSWORD: 217, BROOCH: 218, QUAICH: 219}); Object.assign(T, {QLANTERN: 216, PEATBRICK: 220});
Object.assign(NAMES, {212: 'Highland pistol', 213: 'Highland musket', 214: 'Shot cartridge', 216: 'Quartz lantern', 217: 'Silver sword', 218: 'Luckenbooth brooch', 219: 'Gold quaich', 220: 'Peat bricks'});
ICONS[IT.PISTOL] = drawIcon(g => { g.rotate(-0.25); g.fillStyle = '#5a3418'; g.beginPath(); g.moveTo(-24, 4); g.lineTo(-6, 2); g.lineTo(-2, 10); g.lineTo(-10, 26); g.lineTo(-20, 24); g.lineTo(-14, 10); g.closePath(); g.fill(); g.fillStyle = '#9aa4ae'; g.fillRect(-6, -4, 32, 7); g.fillStyle = '#c8a040'; g.fillRect(-10, -6, 7, 11); g.fillRect(-26, 1, 5, 6); g.fillStyle = '#3a3a40'; g.fillRect(-4, -10, 4, 7); });
ICONS[IT.MUSKET] = drawIcon(g => { g.rotate(-0.6); g.fillStyle = '#6a3c18'; g.fillRect(-30, -3, 34, 8); g.beginPath(); g.moveTo(-30, -3); g.lineTo(-40, 8); g.lineTo(-30, 10); g.fill(); g.fillStyle = '#9aa4ae'; g.fillRect(0, -3, 38, 5); g.fillStyle = '#c8a040'; g.fillRect(-6, -6, 6, 10); });
ICONS[IT.CARTRIDGE] = drawIcon(g => { g.fillStyle = '#e8dcc0'; g.fillRect(-8, -16, 16, 28); g.fillStyle = '#7a7a82'; g.beginPath(); g.arc(0, -16, 8, Math.PI, 0); g.fill(); g.fillStyle = '#5a4a30'; g.fillRect(-8, 8, 16, 4); });
ICONS[IT.SILVERSWORD] = drawIcon(g => { g.rotate(-Math.PI / 4); g.fillStyle = '#eef2f6'; g.fillRect(-3, -30, 6, 38); g.fillStyle = '#b8c4d0'; g.fillRect(-1, -28, 2, 34); g.fillStyle = '#8a6a9a'; g.fillRect(-11, 8, 22, 4); g.fillStyle = '#4a2a1a'; g.fillRect(-2.5, 12, 5, 12); g.fillStyle = '#cfd6dd'; g.beginPath(); g.arc(0, 26, 4, 0, 7); g.fill(); });
ICONS[IT.BROOCH] = drawIcon(g => { g.strokeStyle = '#dfe6ee'; g.lineWidth = 5; for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * 8, -4, 10, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(-18, 0); g.lineTo(0, 22); g.lineTo(18, 0); g.stroke(); g.fillStyle = '#c03040'; g.beginPath(); g.arc(0, 2, 5, 0, 7); g.fill(); g.fillStyle = '#e8d070'; g.fillRect(-3, -22, 6, 8); });
ICONS[IT.QUAICH] = drawIcon(g => { g.fillStyle = '#e0b040'; g.beginPath(); g.ellipse(0, 2, 20, 12, 0, 0, Math.PI); g.fill(); g.fillRect(-20, -2, 40, 5); g.fillRect(-30, -2, 10, 5); g.fillRect(20, -2, 10, 5); g.fillStyle = '#a07a20'; g.beginPath(); g.ellipse(0, -1, 18, 4, 0, 0, 7); g.fill(); g.fillRect(-6, 12, 12, 4); });
(function () {
  const cv = f => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); let s = 99; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; f(g, r); return c.toDataURL('image/png'); };
  TEX.qlantern = cv((g, r) => { g.fillStyle = '#2a2420'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#d8b878'; g.fillRect(8, 8, 48, 48); for (let i = 0; i < 18; i++) { g.fillStyle = r() < .5 ? '#fff0c8' : '#a87838'; g.fillRect(10 + r() * 40 | 0, 10 + r() * 40 | 0, 6, 6); } g.fillStyle = '#2a2420'; g.fillRect(30, 0, 4, 64); g.fillRect(0, 30, 64, 4); });
  TEX.peatbrick = cv((g, r) => { g.fillStyle = '#2a1a10'; g.fillRect(0, 0, 64, 64); for (let row = 0; row < 4; row++) for (let k = 0; k < 3; k++) { const v = 60 + r() * 26 | 0; g.fillStyle = `rgb(${v},${v * .62 | 0},${v * .4 | 0})`; g.fillRect(((k * 24 + (row % 2) * 12) % 72) - 4, row * 16 + 1, 22, 14); } });
})();
FACES[216] = 'qlantern'; NAMES[216] = 'Quartz lantern'; ICON_KEY[216] = 'qlantern'; HARD[216] = 1; MC_HARD[216] = 1; REQ[216] = 0; PLACEABLE.add(216); ORDER.push(216); BLOCK_MATS[216] = new THREE.MeshBasicMaterial({map: mat('qlantern').map});
FACES[220] = 'peatbrick'; NAMES[220] = 'Peat bricks'; ICON_KEY[220] = 'peatbrick'; HARD[220] = 2; MC_HARD[220] = 2; REQ[220] = 0; PLACEABLE.add(220); ORDER.push(220); BLOCK_MATS[220] = mat('peatbrick');
FUEL[220] = 60; FUEL[T.PEAT] = 60;
TOOL[IT.SILVERSWORD] = ['sword', 3, 1, 6]; TOOLS.add(IT.SILVERSWORD);
if (typeof CREATIVE_ALL !== 'undefined') CREATIVE_ALL.push(212, 213, 214, 216, 217, 218, 219, 220);
RECIPES.push(
  rc('Highland pistol', '2 Iron ingots + 1 Flint + 1 Planks + 1 Gunpowder', IT.PISTOL, 1, [[IT.IRONINGOT, 2], [IT.FLINT, 1], [T.PLANKS, 1], [IT.GUNPOWDER, 1]], 1, 1),
  rc('Highland musket', '4 Iron ingots + 1 Flint + 3 Planks + 2 Gunpowder', IT.MUSKET, 1, [[IT.IRONINGOT, 4], [IT.FLINT, 1], [T.PLANKS, 3], [IT.GUNPOWDER, 2]], 1, 1),
  rc('4 Shot cartridges', '1 Iron ingot + 2 Gunpowder', IT.CARTRIDGE, 4, [[IT.IRONINGOT, 1], [IT.GUNPOWDER, 2]], 1),
  rc('Quartz lantern', '1 Cairngorm + 1 Torch + 2 Iron ingots', T.QLANTERN, 2, [[IT.CAIRNGORM, 1], [T.TORCH, 1], [IT.IRONINGOT, 2]], 1),
  rc('Silver sword', '2 Silver ingots + 1 Stick (deadly to the undead)', IT.SILVERSWORD, 1, [[IT.SILVERINGOT, 2], [IT.STICK, 1]], 1, 1),
  rc('Luckenbooth brooch', '1 Silver ingot + 1 Cairngorm (carry it: ores may drop double)', IT.BROOCH, 1, [[IT.SILVERINGOT, 1], [IT.CAIRNGORM, 1]], 1),
  rc('Gold quaich', '4 Gold nuggets + 1 Gold ingot (drink a Brew from it for a buff)', IT.QUAICH, 1, [[IT.GOLDNUGGET, 4], [IT.GOLDINGOT, 1]], 1),
  rc('4 Peat bricks', '4 Peat', T.PEATBRICK, 4, [[T.PEAT, 4]]));
// ---------- guns ----------
const GUN = {[IT.PISTOL]: {dmg: 12, range: 32, reload: 1.8, kick: 0.05}, [IT.MUSKET]: {dmg: 22, range: 56, reload: 3.2, kick: 0.09}};
var gunLoaded = {[IT.PISTOL]: false, [IT.MUSKET]: false}, gunReload = 0, gunReloadId = 0;
function gunBang(pos) {
  try { if (AC) { const n = AC.createBufferSource(); n.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(5000, AC.currentTime); f.frequency.exponentialRampToValueAtTime(300, AC.currentTime + 0.4); const g = AC.createGain(); g.gain.setValueAtTime(0.9 * SET.sfx, AC.currentTime); g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + 0.6); n.connect(f); f.connect(g); g.connect(master); n.start(); n.stop(AC.currentTime + 0.7); } } catch (_) {}
  try { sfx('boom'); } catch (_) {}
}
function fireGun(id) {
  const G = GUN[id], d = lookDir(), o = new THREE.Vector3(P.x, P.y + EYE, P.z);
  let bt = G.range; for (let t = 0.3; t < G.range; t += 0.1) { if (solid(Math.floor(o.x + d[0] * t), Math.floor(o.y + d[1] * t), Math.floor(o.z + d[2] * t))) { bt = t; break; } }
  let best = null, mt = bt;
  for (const a of mobs) { const c = a.g.position, cy = c.y + (a.hitY || 1); const vx = c.x - o.x, vy = cy - o.y, vz = c.z - o.z, t = vx * d[0] + vy * d[1] + vz * d[2]; if (t < 0 || t > mt) continue;
    const px = o.x + d[0] * t - c.x, py = o.y + d[1] * t - cy, pz = o.z + d[2] * t - c.z; if (Math.hypot(px, py * 0.6, pz) < (a.hitR || 0.6) + 0.15) { best = a; mt = t; } }
  // muzzle smoke + flash, a line of smoke down the shot
  const mz = o.clone().add(new THREE.Vector3(d[0], d[1], d[2]).multiplyScalar(0.8)); burst(mz.x, mz.y - 0.15, mz.z, 0xffd080, 6, 0.3); burst(mz.x, mz.y - 0.1, mz.z, 0xb8b8b8, 14, 0.9);
  for (let t = 1; t < mt; t += 2.5) burst(o.x + d[0] * t, o.y + d[1] * t - 0.1, o.z + d[2] * t, 0xd0d0d0, 1, 0.15);
  gunBang(P); shake(0.15, G.kick); P.pitch = Math.min(1.55, P.pitch + G.kick * 1.5); swing();
  if (best) { const kx = best.g.position.x - P.x, kz = best.g.position.z - P.z, kl = Math.hypot(kx, kz) || 1; if (!best.boss) { best.kbx = kx / kl * 9; best.kbz = kz / kl * 9; } damageMob(best, G.dmg, true); }
  else if (mt < G.range) { const x = o.x + d[0] * mt, y = o.y + d[1] * mt, z = o.z + d[2] * mt; burst(x, y, z, 0x8a8070, 8, 0.4); }
  gunLoaded[id] = false;
}
(function () {
  const ui = useItem;
  useItem = function () {
    if (menuOpen || paused || dead || !started) return ui.apply(this, arguments);
    const id = selId;
    if (GUN[id] && (inv[id] || 0) > 0) {
      if (gunReload > 0) { toast('Reloading...'); return; }
      if (gunLoaded[id]) { fireGun(id); if ((inv[IT.CARTRIDGE] || 0) > 0 || MODE.infinite) { gunReload = GUN[id].reload; gunReloadId = id; } return; }
      if ((inv[IT.CARTRIDGE] || 0) > 0 || MODE.infinite) { gunReload = GUN[id].reload; gunReloadId = id; toast('Loading the ' + NAMES[id].toLowerCase() + '...'); } else toast('You need shot cartridges (1 Iron ingot + 2 Gunpowder)');
      return;
    }
    if (id === IT.QUAICH && (inv[id] || 0) > 0) {
      if ((inv[IT.BREW] || 0) > 0 || (inv[IT.IRONBREW] || 0) > 0) { const b = inv[IT.IRONBREW] ? IT.IRONBREW : IT.BREW; useUp(b); quaichBuff = 90; hp = Math.min(20, hp + 4); try { sfx('drink'); } catch (_) {} toast('Slàinte! You feel braw: stronger and healing for 90 s'); renderHotbar(); }
      else toast('Fill the quaich with a Brew to drink to your health'); return;
    }
    return ui.apply(this, arguments);
  };
  // reload ticks; quaich buff regenerates; silver bites the undead; the brooch brings luck
  var quaichBuff = 0, regenT = 0; window.quaichBuffLeft = () => quaichBuff;
  const up = updatePlayer;
  updatePlayer = function (dt) {
    const r = up.apply(this, arguments);
    if (gunReload > 0) { gunReload -= dt; if (gunReload <= 0) { if (!MODE.infinite) useUp(IT.CARTRIDGE); gunLoaded[gunReloadId] = true; try { sfx('place', .5, 'stone'); } catch (_) {} toast(NAMES[gunReloadId] + ' loaded'); renderHotbar(); } }
    if (quaichBuff > 0) { quaichBuff -= dt; regenT -= dt; if (regenT <= 0) { regenT = 3; if (hp > 0 && hp < 20) hp = Math.min(20, hp + 1); } }
    return r;
  };
  const UNDEAD = new Set(['zombie', 'skeleton', 'blazeskel', 'ghost', 'guardian']);
  const dm = damageMob;
  damageMob = function (a, dmg, byPlayer) { if (byPlayer && !GUN[selId]) { if (selId === IT.SILVERSWORD && UNDEAD.has(a.kind)) { dmg *= 2; burst(a.g.position.x, a.g.position.y + 1, a.g.position.z, 0xe8f0ff, 6, .5); } if (quaichBuff > 0) dmg += 2; } return dm.call(this, a, dmg, byPlayer); };
  const ORES = new Set([T.COALORE, T.IRONORE, T.COPPERORE, T.GOLDORE, T.DIAMONDORE, T.REDORE, 179, 181]);
  const df = dropsFor;
  dropsFor = function (b) { const r = df.apply(this, arguments); if ((inv[IT.BROOCH] || 0) > 0 && ORES.has(b) && Math.random() < 0.25 && r && r.length) { try { toast('The Luckenbooth brooch glints - double drop!'); } catch (_) {} return r.concat(r); } return r; };
})();
