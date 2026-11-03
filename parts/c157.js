/* ===================== GLX-C157 (v1.0.26): the classic green creeper, HD - clean four-legged shape, crisp pixel skin; it lives in the caves ===================== */
(function c157() {
  const U = window.__c157 = {made: 0, cave: 0, tries: 0, err: null};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e); };
  // ---- crisp pixel skins: 2 texels per model pixel, nearest filtered, seeded so every creeper wears the same coat ----
  // v1.0.29: same shape, new coat - hazard yellow and red, white warning stripes, a metal cyborg eye plate with a glowing red lens
  const PAL = ['#e6b417', '#f0c22a', '#d8a512', '#f6d24c', '#c99a10', '#c42a22', '#b02018', '#d63a2a', '#fbe27a'], WT = [24, 20, 14, 10, 8, 3, 2, 2, 4];
  let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pick = () => { let r = rnd() * 87, i = 0; while (r > WT[i]) { r -= WT[i]; i++; } return PAL[i]; };
  const RP = ['#c42a22', '#b02018', '#d63a2a', '#a81c16', '#cf3326'], pickR = () => RP[Math.floor(rnd() * RP.length)];   // the red lower half
  const S = 8;   // screen px per texel (so the canvas is big enough to stay sharp)
  function skin(w, h, s, face, hz) { seed = s; const c = document.createElement('canvas'); c.width = w * S; c.height = h * S; const g = c.getContext('2d');
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x * S, y * S, S, S); };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px(x, y, (hz === 'foot' || (hz === 'band' && y >= 15)) ? pickR() : pick());
    if (hz === 'band') for (let y = 10; y < 15; y++) for (let x = 0; x < w; x++) px(x, y, y === 10 || y === 14 ? '#2a2a2a' : ((x + y) & 3) < 2 ? '#f2f2ec' : '#c42a22');   // hazard stripe round the body
    if (hz === 'foot') for (let x = 0; x < w; x++) { px(x, h - 4, '#f2f2ec'); px(x, h - 3, '#c42a22'); px(x, h - 2, '#9a1c14'); px(x, h - 1, '#5a120c'); }
    if (hz === 'top') { for (let x = 0; x < w; x++) { px(x, 0, '#f2f2ec'); px(x, h - 1, '#f2f2ec'); } }
    if (face) { const D1 = '#1a0d0a', D2 = '#2e1610', D3 = '#47231a';
      for (let y = 4; y < 8; y++) for (let x = 2; x < 6; x++) px(x, y, (y === 4 || x === 2) ? D2 : D1);                                  // the one living eye
      for (let y = 3; y < 9; y++) for (let x = 9; x < 15; x++) px(x, y, (y === 3 || y === 8 || x === 9 || x === 14) ? '#4a5056' : (x + y) % 3 ? '#8d959c' : '#a3abb2');   // metal plate
      for (const [x, y] of [[9, 3], [14, 3], [9, 8], [14, 8]]) px(x, y, '#d8dde0');                                                    // rivets
      for (let y = 4; y < 8; y++) for (let x = 10; x < 14; x++) px(x, y, (y === 4 || y === 7 || x === 10 || x === 13) ? '#6a0c08' : '#ff2a1a');   // red lens
      px(11, 5, '#ffb090'); px(12, 6, '#ff6a40');
      for (let y = 8; y < 14; y++) for (let x = 6; x < 10; x++) px(x, y, y === 8 ? D2 : D1);                                            // mouth
      for (let y = 10; y < 16; y++) for (const x of [4, 5, 10, 11]) px(x, y, (x === 4 || x === 11) && y === 10 ? D3 : D1); }
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapNearestFilter; if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t; }
  let MT = null;
  function mats() { if (MT) return MT; const m = t => new THREE.MeshLambertMaterial({map: t}), box = (w, h, d, s, face, hz) => {   // +x -x +y -y +z(front) -z
      const sd = m(skin(d * 2, h * 2, s, false, hz)), fr = face ? m(skin(w * 2, h * 2, s + 7, true)) : m(skin(w * 2, h * 2, s + 7, false, hz)), bk = m(skin(w * 2, h * 2, s + 11, false, hz)), tp = m(skin(w * 2, d * 2, s + 3, false, face ? 'top' : null)), bt = m(skin(w * 2, d * 2, s + 5));
      return [sd, m(skin(d * 2, h * 2, s + 1, false, hz)), tp, bt, fr, bk]; };
    MT = {head: box(8, 8, 8, 11, true), body: box(8, 12, 4, 23, false, 'band'), leg: box(4, 6, 4, 37, false, 'foot')}; return MT; }
  let LENS = null;
  function lens() { if (LENS) return LENS; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, 'rgba(255,90,60,1)'); gr.addColorStop(0.35, 'rgba(255,40,20,.55)'); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    LENS = {core: new THREE.MeshBasicMaterial({color: 0xff3322, toneMapped: false}), halo: new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false})}; return LENS; }
  const u = 1 / 16 * 1.05;   // one model pixel (classic proportions, a touch taller than a block and a half)
  function makeHD() { const M = mats(), g = new THREE.Group(), all = [];
    const mesh = (w, h, d, ms, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w * u, h * u, d * u), ms); o.castShadow = true; (p || g).add(o); return o; };
    const body = mesh(8, 12, 4, M.body); body.position.y = 12 * u;
    const head = mesh(8, 8, 8, M.head); head.position.y = 22 * u;
    const legs = [[-2, 4], [2, 4], [2, -4], [-2, -4]].map(([x, z]) => { const p = new THREE.Group(); p.position.set(x * u, 6 * u, z * u); g.add(p); const l = mesh(4, 6, 4, M.leg, p); l.position.y = -3 * u; return p; });
    // own (cloned) materials per creeper so the fuse flash never lights up its neighbours
    g.traverse(o => { if (o.isMesh) { o.material = o.material.map(x => { const c = x.clone(); all.push(c); return c; }); } });
    try { const L = lens(), z = 4 * u + 0.004; const c = new THREE.Mesh(new THREE.PlaneGeometry(1.6 * u, 1.6 * u), L.core); c.position.set(2 * u, 1 * u, z); head.add(c);
      const h = new THREE.Mesh(new THREE.PlaneGeometry(5 * u, 5 * u), L.halo); h.position.set(2 * u, 1 * u, z + 0.002); h.renderOrder = 6; head.add(h); } catch (e) { ERR(e); }   // the glowing cyborg lens (not in mats, so the fuse flash leaves it alone)
    const dA = new THREE.MeshLambertMaterial(), dB = new THREE.MeshLambertMaterial();   // old code pokes mats[0]/[1] maps: keep them harmless
    U.made++; return {g, legs, arms: [], mats: [dA, dB].concat(all), head, body, cyborg: true, hd: true, speed: 1.25, hp: 5, hitY: 0.9, hitR: 0.55, hostile: true, tall: 2}; }
  U.makeHD = makeHD;
  try { const mc = makeCreeper; makeCreeper = function () { const o = makeHD(); try { const r = mc.apply(this, arguments); for (const k of ['speed', 'hp', 'hitY', 'hitR', 'hostile', 'tall']) if (r[k] !== undefined) o[k] = r[k]; r.g.traverse(x => x.geometry && x.geometry.dispose()); r.mats.forEach(m => m.dispose && m.dispose()); } catch (_) {} return o; }; } catch (e) { ERR(e); }
  // ---- the fuse: a clean white flash and a swell (no robot core) ----
  const under = (p) => { try { return window.__c126 ? __c126.under(p.x, p.y, p.z) : solidTop(Math.floor(p.x), Math.floor(p.z)) > Math.floor(p.y) + 2; } catch (_) { return false; } };
  try { const ct = creeperTick; creeperTick = function (a, dt) { const f0 = window.__c116force, keep = a && a.g && (a.egg || a.eggP || a.home === 'night' || under(a.g.position)); if (keep) window.__c116force = true;   // egg creepers stay wherever they hatch; cave ones by day too; night ones till dawn
      let r; try { r = ct.apply(this, arguments); } finally { window.__c116force = f0; }
      try { if (a && a.hd) { const on = a.arm > 0 ? (0.5 + 0.5 * Math.sin(a.ct * (8 + (1 - a.arm / 4) * 26)) > 0.5 ? 0.25 + 0.45 * (1 - a.arm / 4) : 0) : 0; for (const m of a.mats) if (m.emissive) m.emissive.setScalar(on); } } catch (_) {}
      return r; }; } catch (e) { ERR(e); }
  // ---- natural home: the caves (day or night), two at most, never on top of you, never by torchlight ----
  const roomy = (x, y, z) => !solid(x, y, z) && !solid(x, y + 1, z) && getB(x, y, z) !== T.WATER && getB(x, y, z) !== T.LAVA && getB(x, y + 1, z) !== T.WATER;
  const torch = (x, y, z) => { for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) for (let dy = -3; dy <= 3; dy++) if (getB(x + dx, y + dy, z + dz) === T.TORCH) return true; return false; };
  function caveSpot() { for (let t = 0; t < 20; t++) { const an = Math.random() * 6.283, r = 10 + Math.random() * 10, x = Math.floor(P.x + Math.sin(an) * r), z = Math.floor(P.z + Math.cos(an) * r);
      if (x < 3 || z < 3 || x > W - 4 || z > D - 4) continue;
      for (let k = 0; k < 9; k++) { const y = Math.floor(P.y) + [0, -1, 1, -2, 2, -3, 3, -4, 4][k]; if (y < 3 || !roomy(x, y, z) || !solid(x, y - 1, z) || y > solidTop(x, z) - 4 || torch(x, y, z)) continue; return [x + .5, y, z + .5]; } }
    return null; }
  function caveSpawn() { U.tries++; const sp = caveSpot(); if (!sp) return null; const f = [window.__c116force, window.__caveSpawn, window.__eggSpot]; window.__c116force = true; window.__crOK = true; window.__caveSpawn = sp; window.__eggSpot = [sp[0], sp[1], sp[2], Math.floor(sp[0]), Math.floor(sp[2])]; let a = null;
    try { a = spawnMob('creeper'); } finally { window.__c116force = f[0]; window.__caveSpawn = f[1]; window.__eggSpot = f[2]; window.__crOK = false; } if (a) { a.g.position.set(sp[0], sp[1], sp[2]); a.egg = false; a.home = 'cave'; a.natural = true; U.cave++; } return a; }
  U.caveSpawn = caveSpawn;
  // night: out on the surface too, in the dark away from torches
  function nightSpot() { for (let t = 0; t < 16; t++) { const an = Math.random() * 6.283, r = 18 + Math.random() * 14, x = Math.floor(P.x + Math.sin(an) * r), z = Math.floor(P.z + Math.cos(an) * r);
      if (x < 3 || z < 3 || x > W - 4 || z > D - 4) continue; const y = solidTop(x, z) + 1, b = getB(x, y - 1, z);
      if (y <= SEA || b === T.WATER || b === T.LAVA || LEAFY[b] || !roomy(x, y, z) || Math.abs(y - P.y) > 12 || torch(x, y, z)) continue; return [x + .5, y, z + .5]; } return null; }
  function nightSpawn() { U.tries++; const sp = nightSpot(); if (!sp) return null; const f = [window.__c116force, window.__egg, window.__eggSpot]; window.__c116force = true; window.__crOK = true; window.__egg = true; window.__eggSpot = [sp[0], sp[1], sp[2], Math.floor(sp[0]), Math.floor(sp[2])]; let a = null;
    try { a = spawnMob('creeper'); } finally { window.__c116force = f[0]; window.__egg = f[1]; window.__eggSpot = f[2]; window.__crOK = false; }
    if (a) { a.g.position.set(sp[0], sp[1], sp[2]); a.egg = false; a.eggP = false; a.home = 'night'; a.natural = true; U.night = (U.night || 0) + 1; } return a; }
  U.nightSpawn = nightSpawn;
  // v1.0.28: ONE creeper spawner - only this part's night/cave spawner and the spawn egg make creepers; every older spawner is refused
  U.blocked = 0;
  try { const sm0 = spawnMob; spawnMob = function (kind) { if (kind !== 'creeper' && kind !== 'puffer') return sm0.apply(this, arguments);
      const ok = !!window.__crOK, egg = !ok && !!window.__egg;
      if (!ok && !egg) { U.blocked++; return null; } if (ok && countKind('creeper') >= 2) { U.blocked++; return null; }
      const a = sm0.apply(this, arguments); if (a && a.kind === 'creeper') { a.egg = egg; if (!egg) a.eggP = false; } return a; }; } catch (e) { ERR(e); }
  let T0 = 4, last = 0;
  const dawn = () => { if (isNight) return; for (const a of mobs.slice()) if (a.kind === 'creeper' && a.home === 'night' && !(a.arm > 0) && Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z) > 20) { try { removeMob(a); } catch (_) {} } };
  try { const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
      try { U.ticks = (U.ticks || 0) + 1; U.ck = caveK; const nw = performance.now() / 1000; T0 -= Math.min(0.5, last ? nw - last : 0); last = nw; if (T0 <= 0) { dawn(); U.rolls = (U.rolls || 0) + 1; T0 = 7; if (started && !paused && !dead && !DIM.cur && !(MODE && MODE.name === 'creative') && !(current && current.flat) && countKind('creeper') < 2 && Math.random() < 0.35) { if (caveK > 0.45) caveSpawn(); else if (isNight) nightSpawn(); } } } catch (e) { ERR(e); }
      return r; }; } catch (e) { ERR(e); }
})();
