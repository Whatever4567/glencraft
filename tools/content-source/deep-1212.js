/* GLX-V1212 (v1.2.12): deep cave strata for NEW worlds, inside the existing depth range (the 1.1.97 world: roughly
   y 1-20 below the old deepslate line; no vertical expansion, no change to the cave carver or chunk loading).
   Natural stone/deepslate only is recoloured into bands that blend through a smooth noise edge, not random mixing:
     y ~17-20 Fungal loam, y ~12-16 Gloamstone, y ~7-11 Ember basalt, y ~2-6 Abyss crystal rock.
   One sealed Watcher chamber is carved under the island centre (away from the Agartha cave): a bowl of Watcher brick
   with radial Ember basalt pillars, a lava ring, and a single giant fiery eye mesh (no lights, shown only nearby).
   Generation runs once on a freshly generated overworld, before any save is applied, so saved worlds/edits are untouched. */
(function v1212() {
  const U = window.__v1212 = {err: null, conv: 0, eye: null, ids: {}};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const rng = s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const B = [
    {id: 770, key: 'v1212_fungal', n: 'Fungal loam', base: '#2c4a3a', spots: ['#4fa070', '#7fd0a0', '#1c3026', '#c8e070'], vein: null, glow: 0},
    {id: 771, key: 'v1212_gloam', n: 'Gloamstone', base: '#16263a', spots: ['#22385a', '#0e1828', '#2a4a70'], vein: '#3ae0ff', glow: 0.25},
    {id: 772, key: 'v1212_ember', n: 'Ember basalt', base: '#26211f', spots: ['#3a3230', '#18141290', '#4a3a34'], vein: '#ff7a1a', glow: 0.35},
    {id: 773, key: 'v1212_abyss', n: 'Abyss crystal rock', base: '#2a1a40', spots: ['#3c2660', '#1a1028', '#6a3aa8'], vein: '#c88aff', glow: 0.3, gems: 1},
    {id: 774, key: 'v1212_watcher', n: 'Watcher brick', base: '#2a2622', spots: ['#3a342e', '#1c1814'], vein: '#e0b040', glow: 0.15, brick: 1}];
  function paint(b, S) { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), R = rng(b.id * 977), k = S / 64;
    g.fillStyle = b.base; g.fillRect(0, 0, S, S); for (let i = 0; i < 260; i++) { g.fillStyle = b.spots[R() * b.spots.length | 0]; const s = (1 + R() * 3) * k; g.fillRect(R() * S, R() * S, s, s); }
    if (b.brick) { g.fillStyle = 'rgba(0,0,0,.55)'; for (let y = 0; y < 64; y += 16) { g.fillRect(0, y * k, S, 1.5 * k); for (let x = (y / 16 & 1) * 16; x < 64; x += 32) g.fillRect(x * k, y * k, 1.5 * k, 16 * k); }
      g.strokeStyle = b.vein; g.globalAlpha = .7; g.lineWidth = k; g.beginPath(); g.ellipse(32 * k, 40 * k, 7 * k, 3.5 * k, 0, 0, 7); g.stroke(); g.fillStyle = b.vein; g.fillRect(31 * k, 37 * k, 2 * k, 6 * k); g.globalAlpha = 1; }
    else if (b.vein) { g.strokeStyle = b.vein; g.lineWidth = 1.2 * k; g.globalAlpha = .85; for (let v = 0; v < 3; v++) { let x = R() * S, y = R() * S; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (R() - .5) * 22 * k; y += (R() - .5) * 22 * k; g.lineTo(x, y); } g.stroke(); } g.globalAlpha = 1; }
    if (b.gems) for (let i = 0; i < 5; i++) { const x = R() * S, y = R() * S, r = (3 + R() * 4) * k; g.fillStyle = '#d8a8ff'; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * .6, y); g.lineTo(x, y + r); g.lineTo(x - r * .6, y); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(x - k * .5, y - r * .6, k, r * .5); }
    if (!b.brick && !b.vein && !b.gems) { g.fillStyle = '#e8f0a0'; for (let i = 0; i < 10; i++) { const x = R() * S, y = R() * S; g.fillRect(x, y, 1.5 * k, 3 * k); g.beginPath(); g.arc(x + .75 * k, y, 2 * k, Math.PI, 0); g.fill(); } }
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = k; g.strokeRect(0, 0, S, S); return c; }
  function bind(b) { const S = (typeof PERF !== 'undefined' && PERF) ? 128 : 256, c = paint(b, S), id = b.id;
    if (NAMES[id] !== undefined && NAMES[id] !== b.n) throw Error('id taken ' + id);
    NAMES[id] = b.n; FACES[id] = b.key; ICON_KEY[id] = b.key; HARD[id] = b.brick ? 3 : 2; MC_HARD[id] = b.brick ? 3 : 1.5; try { NEEDS_PICK.add(id); } catch (_) {}
    PLACEABLE.add(id); if (!ORDER.includes(id)) ORDER.push(id); try { if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(id)) CREATIVE_ALL.push(id); } catch (_) {}
    try { if (typeof BUILT_T !== 'undefined') BUILT_T[id] = 1; } catch (_) {}
    const t = new THREE.Texture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
    try { texCache[b.key] = t; texImg[b.key] = c; } catch (_) {}
    try { const s = document.createElement('canvas'); s.width = s.height = 1; s.getContext('2d').drawImage(c, 0, 0, 1, 1); const d = s.getContext('2d').getImageData(0, 0, 1, 1).data; AVG[b.key] = (d[0] << 16) | (d[1] << 8) | d[2]; } catch (_) {}
    const m = new THREE.MeshLambertMaterial({map: t, emissive: new THREE.Color(b.vein || '#000000'), emissiveIntensity: b.glow});
    BLOCK_MATS[id] = m; matCache[b.key] = m; try { ICONS[id] = c.toDataURL(); } catch (_) {} U.ids[b.n] = id; }
  try { for (const b of B) bind(b); const df = dropsFor; dropsFor = function (b) { if (b >= 770 && b <= 774) return [[b, 1]]; return df.apply(this, arguments); }; } catch (e) { ERR('bind', e); }
  // ---- strata ----
  const N2 = (x, z) => { const s = Math.sin(x * 0.043 + z * 0.017) * 1.2 + Math.sin(z * 0.051 - x * 0.023) * 1.0 + Math.sin((x + z) * 0.011) * 0.8; return s; };   // smooth, -3..3
  U.band = (y, x, z) => { const e = y + N2(x, z) * 0.6; return e > 20.5 ? 0 : e > 16.5 ? 770 : e > 11.5 ? 771 : e > 6.5 ? 772 : e > 1.5 ? 773 : 0; };
  const ROCK = () => new Set([T.STONE, T.DEEPSLATE, 133].filter(v => v != null));
  U.strata = () => { const R = ROCK(); let n = 0; const top = Math.min(H - 1, 21);
    for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) for (let y = 1; y <= top; y++) { const i = idx(x, y, z); if (!R.has(world[i])) continue; const b = U.band(y, x, z); if (b) { world[i] = b; n++; } } return n; };
  // ---- the Watcher chamber ----
  U.chamber = () => { const cx0 = (typeof ISL_C !== 'undefined' && ISL_C) ? ISL_C[0] : W >> 1, cz0 = (typeof ISL_C !== 'undefined' && ISL_C) ? ISL_C[1] : D >> 1; let cx = cx0, cz = cz0;
    try { const a = window.__agu && (__agu.mouth || __agu.pos); if (a && Math.hypot((a[0] ?? a.x) - cx, (a[2] ?? a.z) - cz) < 90) cz += 120; } catch (_) {}
    const Rr = 13, cy = 10; if (cx < Rr + 4 || cz < Rr + 4 || cx > W - Rr - 4 || cz > D - Rr - 4 || H < 30) return null;
    for (let x = cx - Rr - 1; x <= cx + Rr + 1; x++) for (let z = cz - Rr - 1; z <= cz + Rr + 1; z++) for (let y = 2; y <= cy + 9; y++) {
      const dx = x - cx, dz = z - cz, dy = (y - cy) * 1.4, d = Math.sqrt(dx * dx + dz * dz + dy * dy), r = Math.hypot(dx, dz), i = idx(x, y, z);
      if (d <= Rr) world[i] = y <= 4 ? (r > Math.sqrt(Math.max(0, Rr * Rr - dy * dy)) - 3 ? T.LAVA : 774) : T.AIR; else if (d <= Rr + 1.2) world[i] = 774; }
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, px = Math.round(cx + Math.cos(a) * (Rr - 6)), pz = Math.round(cz + Math.sin(a) * (Rr - 6)); for (let y = 3; y <= cy + 7; y++) for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) world[idx(px + ox, y, pz + oz)] = 772; }
    U.eye = [cx + 0.5, cy + 1.5, cz + 0.5]; try { if (current) current.v1212eye = U.eye; } catch (_) {} return U.eye; };
  try { const g = generate; generate = function () { const r = g.apply(this, arguments); try { if (!DIM.cur && !cityGen && H >= 40) { U.conv = U.strata(); U.chamber(); } } catch (e) { ERR('gen', e); } return r; }; } catch (e) { ERR('gw', e); }
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && !DIM.cur && U.eye) d.v1212eye = U.eye; } catch (_) {} return d; }; const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && !d.dim) U.eye = Array.isArray(d.v1212eye) ? d.v1212eye : null; } catch (_) {} return r; }; } catch (e) { ERR('save', e); }
  // ---- the eye: one bounded mesh (two planes + a ring), emissive, shown within 70 blocks, slow look-at and blink ----
  let eye = null, t = 0;
  function mkEye() { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const rg = g.createRadialGradient(128, 128, 10, 128, 128, 126); rg.addColorStop(0, '#fff6a0'); rg.addColorStop(.35, '#e8c020'); rg.addColorStop(.6, '#6aa020'); rg.addColorStop(.85, '#c03a08'); rg.addColorStop(1, 'rgba(120,20,0,0)'); g.fillStyle = rg; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
    g.strokeStyle = 'rgba(80,40,0,.5)'; g.lineWidth = 2; for (let a = 0; a < 64; a++) { const q = a / 64 * 6.283; g.beginPath(); g.moveTo(128 + Math.cos(q) * 30, 128 + Math.sin(q) * 30); g.lineTo(128 + Math.cos(q) * 100, 128 + Math.sin(q) * 100); g.stroke(); }
    g.fillStyle = '#0a0400'; g.beginPath(); g.ellipse(128, 128, 14, 92, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,220,.85)'; g.beginPath(); g.ellipse(100, 92, 12, 8, -.5, 0, 7); g.fill();
    const tex = new THREE.CanvasTexture(c), m = new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide});
    const grp = new THREE.Group(); const disc = new THREE.Mesh(new THREE.CircleGeometry(6, 40), m); grp.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(6.3, 0.5, 8, 40), new THREE.MeshBasicMaterial({color: 0xff5a10})); grp.add(ring); grp.userData.disc = disc; grp.visible = false; scene.add(grp); return grp; }
  setInterval(() => { try { const e = U.eye, on = !!(e && started && !DIM.cur && Math.hypot(P.x - e[0], P.y - e[1], P.z - e[2]) < 70); if (on && !eye) eye = mkEye(); if (eye) { eye.visible = on; if (on) eye.position.set(e[0], e[1], e[2]); } } catch (e2) { ERR('eye', e2); } }, 500);
  try { const up = updatePlayer; updatePlayer = function (dt) { const r = up.apply(this, arguments); try { if (eye && eye.visible) { t += dt || 0.016; eye.lookAt(P.x, P.y + 1.6, P.z); const bl = (t % 9) > 8.7 ? Math.max(0.08, Math.abs(Math.cos(((t % 9) - 8.7) / 0.3 * Math.PI))) : 1; eye.userData.disc.scale.y = bl; } } catch (_) {} return r; }; } catch (e) { ERR('up', e); }
})();
