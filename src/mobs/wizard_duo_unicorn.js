
/* ===================== GLX-C125 (v1.0.7): the Wizard Duo by the loch, and the one Unicorn ===================== */
(function c125() {
  const C = window.__c123; if (!C || !C.MODELS) return;
  const U = window.__c125 = {wiz: null, uni: null};
  const PH = C.PH, TAU = Math.PI * 2;
  const key = () => (current && (current.seed || current.id)) || 'w';
  const hashS = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; };
  const rng = s => { let x = hashS(s) % 2147483646 + 1; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
  const load = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };
  const wet = (x, z) => getB(x, solidTop(x, z) + 1, z) === T.WATER;
  const topY = (x, z) => solidTop(Math.floor(x), Math.floor(z)) + 1;
  const inb = (x, z) => x > 4 && z > 4 && x < W - 5 && z < D - 5;
  const near = (o, r) => o && Math.hypot(o.x - P.x, o.z - P.z) < r;
  // ---------- shared bits: canvas sprites, sparkles, speech bubble ----------
  function cv(n, fn) { const c = document.createElement('canvas'); c.width = c.height = n; fn(c.getContext('2d'), n); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }
  const glowT = cv(64, (g, n) => { const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,240,190,.8)'); r.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = r; g.fillRect(0, 0, n, n); });
  const starT = cv(128, (g, n) => { const c = n / 2; const r = g.createRadialGradient(c, c, 0, c, c, c); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.12, 'rgba(220,235,255,.9)'); r.addColorStop(1, 'rgba(160,190,255,0)'); g.fillStyle = r; g.fillRect(0, 0, n, n);
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; for (const a of [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]) { const l = a % (Math.PI / 2) ? c * 0.5 : c * 0.95; g.beginPath(); g.moveTo(c - Math.cos(a) * l, c - Math.sin(a) * l); g.lineTo(c + Math.cos(a) * l, c + Math.sin(a) * l); g.stroke(); } });
  const runeT = cv(256, (g, n) => { const c = n / 2; g.strokeStyle = '#ffd860'; g.shadowColor = '#ffb020'; g.shadowBlur = 10; g.lineWidth = 5; g.beginPath(); g.arc(c, c, c * 0.88, 0, TAU); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(c, c, c * 0.66, 0, TAU); g.stroke();
    g.font = 'bold 26px serif'; g.fillStyle = '#ffe890'; g.textAlign = 'center'; g.textBaseline = 'middle'; const R = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.save(); g.translate(c + Math.cos(a) * c * 0.77, c + Math.sin(a) * c * 0.77); g.rotate(a + Math.PI / 2); g.fillText(R[i], 0, 0); g.restore(); }
    g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * TAU * 2 / 5; const x = c + Math.cos(a) * c * 0.6, y = c + Math.sin(a) * c * 0.6; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); });
  const sprite = (t, s, col, op) => { const m = new THREE.SpriteMaterial({map: t, color: col || 0xffffff, transparent: true, opacity: op == null ? 1 : op, depthWrite: false, blending: THREE.AdditiveBlending}); const sp = new THREE.Sprite(m); sp.scale.setScalar(s); return sp; };
  function sparkles(n, col, size) { const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), seed = new Float32Array(n); for (let i = 0; i < n; i++) seed[i] = Math.random() * 100;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const m = new THREE.PointsMaterial({color: col, size: size || 0.12, map: glowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending});
    const p = new THREE.Points(geo, m); p.frustumCulled = false; p.userData = {pos, seed, n}; return p; }
  let bub = null, bubT = 0, bubO = null; const v3 = new THREE.Vector3();
  function say(obj, who, txt, h) { if (!bub) { bub = document.createElement('div'); bub.dataset.testid = 'wizard-bubble'; bub.style.cssText = 'position:fixed;left:0;top:0;z-index:40;pointer-events:none;max-width:260px;padding:6px 11px;border-radius:12px;background:rgba(250,246,232,.96);color:#3a2a50;font:bold 14px Georgia,serif;box-shadow:0 2px 8px rgba(40,20,80,.45);transform:translate(-50%,-100%);display:none;text-align:center'; document.body.appendChild(bub); }
    bub.textContent = who + ': ' + txt; bubO = {o: obj, h: h || 3}; bubT = 4.5; U.said = bub.textContent; }
  function bubStep(dt) { if (!bub || bubT <= 0) return; bubT -= dt; if (bubT <= 0 || !bubO || screen !== 'game') { bub.style.display = 'none'; return; }
    v3.copy(bubO.o.position); v3.y += bubO.h; v3.project(camera); if (v3.z > 1 || Math.abs(v3.x) > 1.1 || Math.abs(v3.y) > 1.1) { bub.style.display = 'none'; return; }
    bub.style.display = 'block'; bub.style.left = ((v3.x + 1) / 2 * innerWidth) + 'px'; bub.style.top = ((1 - v3.y) / 2 * innerHeight) + 'px'; }
  const hearts = (x, y, z, n) => { for (let i = 0; i < (n || 6); i++) try { burst(x + (Math.random() - .5) * 0.8, y + Math.random() * 0.5, z + (Math.random() - .5) * 0.8, Math.random() < .5 ? 0xff4070 : 0xff90b0, 1, 0.5); } catch (_) {} };
  function dispose(g) { if (!g) return; scene.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); }); }

  // =================== WIZARD DUO ===================
  const NAMES2 = ['Old Fergus', 'Auld Tormod'];
  const LINES = {
    sit: ['The loch keeps every secret it is told.', 'Hush now, the water is listening.', 'Sit a while. The stars are in no hurry.', 'Look - the orb sees further than we do.'],
    rune: ['Stand back, the old stone is waking!', 'Ancient words, older than the hills.', 'Mind the runes, they bite the careless.', 'Gold for the stone, peace for the glen.'],
    hill: ['Follow the bright star, it never lies.', 'Slowly now, my knees are older than this hill.', 'Up top, the sky is close enough to touch.'],
    day: ['A fine day for a wee think.', 'Have you seen a white horse with a horn? No? Hmph.', 'Magic sleeps in the daylight, like a cat.', 'Be kind to the glen, and the glen is kind to you.'],
  };
  const nearCastle = (x, z) => { try { for (const c of (typeof g9castles !== 'undefined' && g9castles) || []) if (Math.hypot(x - c[1], z - c[2]) < 48) return true; } catch (_) {} return false; };
  const dryLine = (ax, az, bx, bz) => { const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 1.5); let py = solidTop(ax, az); for (let i = 1; i <= n; i++) { const x = Math.round(ax + (bx - ax) * i / n), z = Math.round(az + (bz - az) * i / n); if (wet(x, z)) return false; const y = solidTop(x, z); if (Math.abs(y - py) > 2) return false; py = y; } return true; };
  function findWizSpot() { const r = rng(key() + ':wiz');
    for (let tries = 0; tries < 2500; tries++) { const x = 8 + Math.floor(r() * (W - 16)), z = 8 + Math.floor(r() * (D - 16)); if (!inb(x, z) || wet(x, z)) continue;
      const y = solidTop(x, z); if (y < SEA - 1 || y > SEA + 5) continue;
      { const tb = getB(x, y, z); if (tb !== T.GRASS && tb !== T.DIRT && tb !== T.SAND) continue; if (nearCastle(x, z)) continue; }
      let wd = -1; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, wx = Math.round(x + Math.sin(a) * 3), wz = Math.round(z + Math.cos(a) * 3); if (inb(wx, wz) && wet(wx, wz) && wet(Math.round(x + Math.sin(a) * 6), Math.round(z + Math.cos(a) * 6))) { wd = a; break; } } if (wd < 0) continue;
      let flat = true; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]]) { const xx = Math.round(x + Math.cos(wd) * dx - Math.sin(wd) * dz), zz = Math.round(z - Math.sin(wd) * dx - Math.cos(wd) * dz); if (wet(xx, zz) || Math.abs(solidTop(xx, zz) - y) > 1) flat = false; } if (!flat) continue;
      // standing stone 6 blocks along the shore, hill = highest ground within 40
      const sa = wd + Math.PI / 2; let stx = Math.round(x + Math.sin(sa) * 6), stz = Math.round(z + Math.cos(sa) * 6); if (wet(stx, stz)) { stx = Math.round(x - Math.sin(wd) * 5); stz = Math.round(z - Math.cos(wd) * 5); } if (wet(stx, stz)) continue;
      let hx = x, hz = z, hy = y; for (let i = 0; i < 160; i++) { const a = r() * TAU, d = 12 + r() * 30, xx = Math.round(x + Math.sin(a) * d), zz = Math.round(z + Math.cos(a) * d); if (!inb(xx, zz) || wet(xx, zz) || nearCastle(xx, zz)) continue; const yy = solidTop(xx, zz); if (yy > hy && dryLine(x, z, xx, zz)) { hy = yy; hx = xx; hz = zz; } }
      return {x: x + 0.5, z: z + 0.5, wd, stx: stx + 0.5, stz: stz + 0.5, hx: hx + 0.5, hz: hz + 0.5}; }
    return null; }
  function buildWiz(sp) { const mats = [], K = C.kit(mats), grp = new THREE.Group(); scene.add(grp);
    const A = C.MODELS.wizard(K, {robe: 0xc4622a, hat: 0xb0561f, band: 0xd8b040, staff: 1}), B = C.MODELS.wizard(K, {robe: 0x6a2a22, hat: 0x5a221c});
    const ga = new THREE.Group(), gb = new THREE.Group(); ga.add(A.root); gb.add(B.root); grp.add(ga, gb); ga.scale.setScalar(0.95); gb.scale.setScalar(0.92);
    for (const m of mats) if (m.emissive) { m.emissive.setHex(0x2a2430); m.userData.e0 = m.emissive.clone(); }
    // standing stone (a mesh, the world blocks are never touched) with moss and a rune circle
    const stone = new THREE.Group(); const sm = K.M(0x8a8a84, 'rock'), moss = K.M(0x4a7a30, 'weed'); const s1 = K.box(0.9, 2.9, 0.55, sm, 0, 1.4, 0, stone); s1.rotation.z = 0.05; K.box(0.7, 0.5, 0.5, sm, 0.04, 3.0, 0, stone).rotation.z = 0.12;
    K.box(0.92, 0.6, 0.57, moss, 0, 0.25, 0, stone); K.box(0.5, 0.3, 0.58, moss, -0.2, 2.2, 0.0, stone); K.box(0.3, 0.6, 0.58, moss, 0.32, 1.2, 0, stone);
    const rm = new THREE.MeshBasicMaterial({map: runeT, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide});
    const rune = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), rm); rune.position.set(0, 1.6, 0.3); stone.add(rune); const rune2 = rune.clone(); rune2.position.z = -0.3; rune2.rotation.y = Math.PI; stone.add(rune2);
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), rm); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; stone.add(ring);
    stone.position.set(sp.stx, topY(sp.stx, sp.stz) - 0.1, sp.stz); stone.rotation.y = sp.wd + Math.PI / 2; grp.add(stone);
    // orb over the loch edge + sparkling reflection trail on the water
    const orb = sprite(glowT, 1.2, 0xfff0c0); const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({color: 0xfffbe8})); orb.add(core); grp.add(orb);
    const trail = sparkles(PH ? 30 : 60, 0xffe8a0, 0.22); grp.add(trail); const hand = sparkles(PH ? 14 : 28, 0xffe070, 0.1); grp.add(hand);
    const star = sprite(starT, 9, 0xe8f0ff); star.position.set(sp.hx, solidTop(Math.floor(sp.hx), Math.floor(sp.hz)) + 34, sp.hz); grp.add(star);
    const lg = new THREE.PointLight(0xffd890, 0, 9); if (!PH) grp.add(lg);
    U.wiz = {sp, grp, A, B, ga, gb, stone, rune, rm, orb, trail, hand, star, lg, st: 'day', stT: 0, t: 0, x: sp.stx + 1.5, z: sp.stz + 1.5, path: null, pi: 0, sayT: 3, sndT: 2, wasNight: false, hide: false}; }
  // lead walker goes along a list of points; the two stay side by side
  function walk(w, dt, spd) { if (!w.path || w.pi >= w.path.length) return true; const [tx, tz] = w.path[w.pi], dx = tx - w.x, dz = tz - w.z, d = Math.hypot(dx, dz);
    if (d < 0.3) { w.pi++; return w.pi >= w.path.length; } const s = Math.min(d, spd * dt); w.x += dx / d * s; w.z += dz / d * s; w.yaw = Math.atan2(dx, dz); w.mv = true; return false; }
  const line = (ax, az, bx, bz, n) => { const L = []; for (let i = 1; i <= n; i++) L.push([ax + (bx - ax) * i / n, az + (bz - az) * i / n]); return L; };
  function go(w, st, tx, tz) { w.st = st; w.path = line(w.x, w.z, tx, tz, Math.max(1, Math.ceil(Math.hypot(tx - w.x, tz - w.z) / 2))); w.pi = 0; }
  // v1.0.11: each wizard walks with the creeper's own collision (moveMob: walls block, 1-block step-up, no clipping) and gravity (mobPhysics) instead of snapping to column tops
  const roomAt = (x, y, z, tall) => { const fx = Math.floor(x), fz = Math.floor(z), fy = Math.floor(y + 0.05); for (let k = 0; k < tall; k++) if (solid(fx, fy + k, fz)) return false; return true; };
  function body(g, x, z, dt) { const q = g.userData.mob || (g.userData.mob = {g, tall: 2, onGround: false, vy: 0, kbx: 0, kbz: 0, stuck: 0}), p = g.position;
    if (!q.init) { q.init = 1; p.set(x, topY(x, z), z); }
    const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz);
    if (d > 0.02) { const s = Math.min(d, 2.2 * dt), mx = dx / d * s, mz = dz / d * s; let r = moveMob(q, mx, mz); if (r !== true) r = moveMob(q, mx, 0) === true || moveMob(q, 0, mz) === true; q.stuck = r ? 0 : q.stuck + dt; }
    mobPhysics(q, dt);
    // hopelessly stuck or left far behind: hop to the spot only if there's room for the whole body there
    if ((q.stuck > 4 || d > 6) && !(p.y < -50)) { const ty = topY(x, z); if (roomAt(x, ty, z, 2)) { p.set(x, ty, z); q.vy = 0; q.stuck = 0; } }
    if (!roomAt(p.x, p.y, p.z, 1)) p.y = Math.floor(p.y + 0.05) + 1; }
  function wizStep(dt) { const w = U.wiz; if (!w) return; const sp = w.sp, far = Math.hypot(w.x - P.x, w.z - P.z) > 90 || DIM.cur;
    w.grp.visible = !far; if (far) return; w.t += dt; w.mv = false;
    if (isNight && !w.wasNight) { go(w, 'tosit', sp.x - Math.sin(sp.wd) * 0.3, sp.z - Math.cos(sp.wd) * 0.3); } if (!isNight && w.wasNight) go(w, 'today', sp.stx + Math.sin(sp.wd) * -2, sp.stz - Math.cos(sp.wd) * 2); w.wasNight = isNight;
    const s = w.st; w.stT += dt;
    if (s === 'tosit' || s === 'tostone' || s === 'hill' || s === 'down' || s === 'today') { const done = walk(w, dt, s === 'hill' ? 0.9 : 1.2); if (done) { w.stT = 0; w.st = s === 'tosit' ? 'sit' : s === 'tostone' ? 'rune' : s === 'hill' ? 'top' : s === 'down' ? (isNight ? 'sit' : 'day') : 'day'; if (w.st === 'sit') w.yaw = sp.wd; if (w.st === 'rune') w.yaw = Math.atan2(sp.stx - w.x, sp.stz - w.z); } }
    else if (s === 'sit' && w.stT > 70) { w.stT = 0; go(w, 'tostone', sp.stx - Math.sin(sp.wd) * 1.6, sp.stz - Math.cos(sp.wd) * 1.6); }
    else if (s === 'rune' && w.stT > 45) { w.stT = 0; const hx = sp.hx, hz = sp.hz; w.st = 'hill'; w.path = line(w.x, w.z, hx, hz, Math.max(2, Math.ceil(Math.hypot(hx - w.x, hz - w.z) / 2))); w.pi = 0; }
    else if (s === 'top' && w.stT > 25) { w.stT = 0; go(w, 'down', sp.x - Math.sin(sp.wd) * 0.3, sp.z - Math.cos(sp.wd) * 0.3); }
    else if (s === 'day' && w.stT > 9) { w.stT = 0; const a = Math.random() * TAU; const tx = sp.stx + Math.sin(a) * 3, tz = sp.stz + Math.cos(a) * 3; if (!wet(Math.floor(tx), Math.floor(tz))) go(w, 'today', tx, tz); }
    if (!isNight && (w.st === 'sit' || w.st === 'rune' || w.st === 'top')) go(w, 'today', sp.stx - Math.sin(sp.wd) * 2, sp.stz - Math.cos(sp.wd) * 2);
    // place the pair: side by side, perpendicular to their heading (in the rune they flank the stone)
    const yaw = w.yaw || 0, px = Math.cos(yaw), pz = -Math.sin(yaw), sep = w.st === 'rune' ? 1.5 : w.st === 'sit' ? 0.75 : 0.7;
    let ax = w.x + px * sep, az = w.z + pz * sep, bx = w.x - px * sep, bz = w.z - pz * sep;
    if (w.st === 'rune') { const sa = Math.atan2(sp.stx - w.x, sp.stz - w.z); ax = sp.stx - Math.sin(sa) * 1.0 + Math.cos(sa) * 1.3; az = sp.stz - Math.cos(sa) * 1.0 - Math.sin(sa) * 1.3; bx = sp.stx - Math.sin(sa) * 1.0 - Math.cos(sa) * 1.3; bz = sp.stz - Math.cos(sa) * 1.0 + Math.sin(sa) * 1.3; }
    for (const [g, m, x, z] of [[w.ga, w.A, ax, az], [w.gb, w.B, bx, bz]]) { body(g, x, z, dt);
      const fy = w.st === 'rune' ? Math.atan2(sp.stx - x, sp.stz - z) : yaw; g.rotation.y = turnToward(g.rotation.y, fy, dt * 3); m.pose = w.st === 'sit' ? 'sit' : w.st === 'rune' ? 'rune' : 'stand'; m.anim(dt, w.t + (m === w.B ? 1.3 : 0), w.mv); }
    // the magic
    const night = isNight, sit = w.st === 'sit', rn = w.st === 'rune'; const op = rn ? Math.min(1, w.stT / 3) * (0.75 + 0.25 * Math.sin(w.t * 3)) : Math.max(0, w.rm.opacity - dt);
    w.rm.opacity = op; w.rune.rotation.z += dt * 0.4;
    const ox = w.x + Math.sin(sp.wd) * 1.6, oz = w.z + Math.cos(sp.wd) * 1.6, oy = (w.ga.position.y + w.gb.position.y) / 2 + 2.3 + Math.sin(w.t * 1.4) * 0.12;
    w.orb.visible = sit || (night && w.st === 'tosit'); w.orb.position.set(ox, oy, oz); w.orb.material.opacity = 0.75 + 0.25 * Math.sin(w.t * 2.2);
    w.lg.intensity = sit ? 0.9 : rn ? 1.1 * op : 0; w.lg.position.copy(rn ? w.stone.position : w.orb.position); if (rn) w.lg.position.y += 1.6;
    w.trail.visible = sit; w.hand.visible = sit || rn || w.st === 'top'; w.star.visible = night; w.star.material.opacity = 0.8 + 0.2 * Math.sin(w.t * 1.7);
    if (Math.hypot(w.x - P.x, w.z - P.z) < 45) { const T0 = w.trail.userData, wy = SEA + 0.05; // water surface (the loch might sit higher than the sea)
      const sy = (() => { const bx0 = Math.floor(ox + Math.sin(sp.wd) * 2), bz0 = Math.floor(oz + Math.cos(sp.wd) * 2); const bed = solidTop(bx0, bz0); let y = bed + 1; while (getB(bx0, y, bz0) === T.WATER && y < bed + 20) y++; return y + 0.02; })();
      if (sit) for (let i = 0; i < T0.n; i++) { const s0 = T0.seed[i], d = ((s0 * 7.3 + w.t * 0.6) % 14), sw = (Math.sin(s0 * 13 + w.t * 0.8) * 0.5) * (0.3 + d * 0.12); T0.pos[i * 3] = ox + Math.sin(sp.wd) * d + Math.cos(sp.wd) * sw; T0.pos[i * 3 + 1] = sy + Math.abs(Math.sin(w.t * 4 + s0)) * 0.05; T0.pos[i * 3 + 2] = oz + Math.cos(sp.wd) * d - Math.sin(sp.wd) * sw; }
      if (sit) w.trail.geometry.attributes.position.needsUpdate = true; void wy;
      if (w.hand.visible) { const H0 = w.hand.userData, cx = rn ? w.stone.position.x : w.st === 'top' ? w.x : ox, cy = rn ? w.stone.position.y + 1.6 : w.st === 'top' ? w.ga.position.y + 2.6 : oy, cz = rn ? w.stone.position.z : w.st === 'top' ? w.z : oz;
        for (let i = 0; i < H0.n; i++) { const s0 = H0.seed[i], k = (s0 + w.t * 0.5) % 1, a = s0 * 5 + w.t * (1 + (i % 3) * 0.3), r = (rn ? 1.0 : 0.6) + k * 0.6; H0.pos[i * 3] = cx + Math.cos(a) * r; H0.pos[i * 3 + 1] = cy + (k - 0.5) * 1.4; H0.pos[i * 3 + 2] = cz + Math.sin(a) * r; }
        w.hand.geometry.attributes.position.needsUpdate = true; } }
    const dP = Math.hypot(w.x - P.x, w.z - P.z);
    if ((w.sndT -= dt) <= 0) { w.sndT = 5 + Math.random() * 4; if ((sit || rn) && dP < 22) try { sfx3d(rn ? 'nm:mystic:0.8' : 'nm:mystic:1.2', w.orb.visible ? w.orb.position : w.stone.position, 22); } catch (_) {} }
    if ((w.sayT -= dt) <= 0 && dP < 7 && started && !paused) { w.sayT = 9 + Math.random() * 5; const L = LINES[sit ? 'sit' : rn ? 'rune' : (w.st === 'hill' || w.st === 'top') ? 'hill' : 'day'], i = Math.random() < 0.5 ? 0 : 1; say(i ? w.gb.position : w.ga.position, NAMES2[i], L[(Math.random() * L.length) | 0], 3.1); U.lastLine = U.said; } }
  U.talk = () => { const w = U.wiz; if (w) w.sayT = 0; };

  // =================== THE UNICORN ===================
  const UKEY = () => 'glen_uni_' + key();
  function findUniSpot() { const r = rng(key() + ':uni'); // one random area, then the highest dry ground in it
    for (let t = 0; t < 400; t++) { const cx = 20 + Math.floor(r() * (W - 40)), cz = 20 + Math.floor(r() * (D - 40)); if (Math.hypot(cx - W / 2, cz - D / 2) < 40) continue; let best = null, by = -1;
      for (let i = 0; i < 60; i++) { const x = Math.round(cx + (r() - .5) * 50), z = Math.round(cz + (r() - .5) * 50); if (!inb(x, z) || wet(x, z)) continue; const y = solidTop(x, z); if (y > by && y > SEA + 1 && y < SEA + 40) { by = y; best = [x + 0.5, z + 0.5]; } }
      if (best) return best; } return [W / 2 + 30, D / 2 + 30]; }
  function buildUni(s) { const mats = [], K = C.kit(mats), g = new THREE.Group(); const m = C.MODELS.unicorn(K); g.add(m.root); scene.add(g);
    for (const q of mats) if (q.emissive && !q.userData.keep) { q.userData.e0 = q.emissive.clone(); }
    const trail = sparkles(PH ? 24 : 48, 0xe8f0ff, 0.14); scene.add(trail); const tp = trail.userData; tp.i = 0; tp.life = new Float32Array(tp.n); for (let i = 0; i < tp.n; i++) tp.pos[i * 3 + 1] = -999;
    const u = U.uni = {s, g, m, mats, trail, hp: 30, t: 0, ang: Math.random() * TAU, tgt: null, wT: 0, spd: 0, flee: 0, buck: 0, flash: 0, saveT: 5, hill: false, proxy: null};
    u.proxy = {g, hitY: 1.2, hitR: 0.9, hostile: false, kind: 'unicorn', burning: 0, isUnicorn: true, mats: []};
    g.position.set(s.x, topY(s.x, s.z), s.z); }
  const saveU = () => { const u = U.uni; if (!u) return; const s = u.s; if (u.g) { s.x = +u.g.position.x.toFixed(1); s.z = +u.g.position.z.toFixed(1); } store(UKEY(), s); };
  let ride = false;
  U.riding = () => ride;
  function mount() { const u = U.uni; if (!u || ride) return; ride = true; P.x = u.g.position.x; P.z = u.g.position.z; P.y = Math.max(P.y, u.g.position.y); u.buck = u.s.tamed ? 0 : 1.6 + Math.random() * 1.4; P.yaw = u.g.rotation.y + Math.PI;
    if (u.s.tamed) toast('Riding ' + (u.s.name || 'the Unicorn') + ' - move to gallop, jump to leap, sneak to get off'); else toast('The unicorn is not sure about you...'); try { sfx3d('nm:neigh:1.1', u.g.position, 20); } catch (_) {} }
  function dismount(throwOff) { const u = U.uni; if (!ride) return; ride = false; const a = (u ? u.g.rotation.y : 0) + Math.PI / 2; const x = P.x + Math.sin(a) * 1.3, z = P.z + Math.cos(a) * 1.3;
    if (!collides(x, P.y + 0.2, z)) { P.x = x; P.z = z; } P.y += 0.3; if (throwOff) { P.vy = 5; try { knockPlayer(Math.sin(a), Math.cos(a), 4, 3); } catch (_) {} } saveU(); }
  U.mount = mount; U.dismount = dismount;
  function tameTry() { const u = U.uni; u.s.temper = (u.s.temper || 0) | 0; if (Math.random() * 100 < u.s.temper) { u.s.tamed = 1; u.s.owner = (current && current.name) || 'you'; u.buck = 0; saveU(); hearts(u.g.position.x, u.g.position.y + 2, u.g.position.z, 12);
      toast('The unicorn trusts you now! Ride it any time.'); try { sfx3d('nm:mystic:1.5', u.g.position, 20); } catch (_) {} return true; }
    u.s.temper = Math.min(100, u.s.temper + 8); saveU(); try { mistPuff(u.g.position.x, u.g.position.y + 0.3, u.g.position.z, 0xf0f0ff, 4); } catch (_) {} return false; }
  function feed(id) { const u = U.uni, add = id === IT.BREAD ? 15 : 10; useUp(id, 1); try { renderHotbar(); } catch (_) {} u.s.temper = Math.min(100, (u.s.temper || 0) + add); u.flee = 0; u.m.graze = 1; setTimeout(() => { if (U.uni) U.uni.m.graze = 0; }, 1500);
    hearts(u.g.position.x, u.g.position.y + 2, u.g.position.z, 5); saveU(); toast(u.s.tamed ? 'The unicorn munches happily' : 'The unicorn likes that (trust ' + Math.round(u.s.temper) + '%)'); try { sfx3d('nm:chime:1.3', u.g.position, 14); } catch (_) {} }
  function uniStep(dt) { const u = U.uni; if (!u) return; const s = u.s, g = u.g, p = g.position;
    if (s.dead) { g.visible = false; u.trail.visible = false; return; }
    const hidden = !!DIM.cur; g.visible = !hidden; if (hidden) { if (ride) dismount(); return; }
    u.t += dt; if (u.flash > 0) { u.flash -= dt; for (const q of u.mats) if (q.emissive) q.emissive.setHex(u.flash > 0 ? 0x803030 : (q.userData.e0 ? q.userData.e0.getHex() : 0)); }
    const dP = Math.hypot(p.x - P.x, p.z - P.z); let sp = 0;
    if (ride) {
      if (dead || heldBy) { dismount(); return; }
      if (u.buck > 0) { u.buck -= dt; u.m.rear = Math.max(0, Math.sin(u.t * 6)); g.rotation.y += Math.sin(u.t * 5) * dt * 3; if (Math.random() < dt * 3) try { shake(0.12, 0.02); } catch (_) {}
        if (u.buck <= 0) { u.m.rear = 0; if (!tameTry()) { dismount(true); toast('Bucked off! Keep trying, or bring wheat or bread'); u.flee = 2; } } }
      p.x = P.x; p.z = P.z; p.y = P.y; if (!(u.buck > 0)) g.rotation.y = turnToward(g.rotation.y, P.yaw + Math.PI, dt * 10);
      sp = u.rideSp || 0; if (sneakHeld && !(u.buck > 0)) dismount();
    } else {
      // tonight it might stand on the starlit hilltop by the wizards' walk (still the only one)
      const w = U.wiz; if (!s.tamed && w && isNight && u.night !== U.nights) { u.night = U.nights; u.hill = Math.random() < 0.3 && Math.hypot(w.sp.hx - P.x, w.sp.hz - P.z) > 40 && dP > 40; if (u.hill) { p.x = w.sp.hx + 2; p.z = w.sp.hz + 1; p.y = topY(p.x, p.z); } }
      if (!isNight && u.hill) { u.hill = false; if (dP > 40) { p.x = s.hx; p.z = s.hz; p.y = topY(p.x, p.z); } }
      const hx = u.hill && w ? w.sp.hx : s.tamed ? p.x : s.hx, hz = u.hill && w ? w.sp.hz : s.tamed ? p.z : s.hz;
      if (dP < 64) { if (u.flee > 0) { u.flee -= dt; u.ang = Math.atan2(p.x - P.x, p.z - P.z); sp = 7; }
        else { if ((u.wT -= dt) <= 0) { u.wT = 3 + Math.random() * 4; const home = Math.hypot(p.x - hx, p.z - hz) > 9; u.ang = home ? Math.atan2(hx - p.x, hz - p.z) : Math.random() * TAU; u.go = home || Math.random() < 0.55; u.m.graze = !u.go && Math.random() < 0.6 ? 1 : 0; }
          sp = u.go ? 1.6 : 0; if (!s.tamed && dP < 4 && sprinting) { u.flee = 1.5; } }
        // v1.0.11: the creeper's movement — moveMob (walls, step-up, no cliffs or water) + mobPhysics (gravity onto the real floor below, not the roof above)
        if (u.tall === undefined) Object.assign(u, {tall: 2, onGround: false, vy: 0, kbx: 0, kbz: 0});
        if (sp) { const mx = Math.sin(u.ang) * sp * dt, mz = Math.cos(u.ang) * sp * dt; let r = inb(p.x + mx, p.z + mz) && moveMob(u, mx, mz); if (r !== true) r = moveMob(u, mx, 0) === true || moveMob(u, 0, mz) === true; if (!r) { u.wT = 0; sp = 0; } }
        mobPhysics(u, dt); if (!roomAt(p.x, p.y, p.z, 1)) p.y = Math.floor(p.y + 0.05) + 1; g.rotation.y = turnToward(g.rotation.y, u.ang, dt * 4); }
      if (s.tamed && (u.saveT -= dt) <= 0) { u.saveT = 6; saveU(); }
    }
    if (dP < 70) u.m.anim(dt, u.t, sp);
    // sparkle trail while galloping
    const tp = u.trail.userData; u.trail.visible = dP < 60; if (sp > 6 && Math.random() < dt * 30) { const i = tp.i = (tp.i + 1) % tp.n; tp.pos[i * 3] = p.x + (Math.random() - .5) * 0.6; tp.pos[i * 3 + 1] = p.y + 0.4 + Math.random() * 1.2; tp.pos[i * 3 + 2] = p.z + (Math.random() - .5) * 0.6; tp.life[i] = 1.2; }
    for (let i = 0; i < tp.n; i++) if (tp.life[i] > 0) { tp.life[i] -= dt; tp.pos[i * 3 + 1] += dt * 0.3; if (tp.life[i] <= 0) tp.pos[i * 3 + 1] = -999; } u.trail.geometry.attributes.position.needsUpdate = true;
    if (Math.random() < dt * 0.06 && dP < 24 && !ride) try { sfx3d('nm:neigh:' + (0.9 + Math.random() * 0.3).toFixed(2), p, 24); } catch (_) {}
  }
  function uniHit() { const u = U.uni; if (!u || u.s.dead) return; u.hp -= 2; u.flash = 0.25; u.flee = 4; try { sfx3d('nm:neigh:1.4', u.g.position, 20); burst(u.g.position.x, u.g.position.y + 1.2, u.g.position.z, 0xf0f0ff, 6, 0.6); } catch (_) {}
    if (u.s.tamed) { u.s.temper = Math.max(0, (u.s.temper || 0) - 5); }
    if (u.hp <= 0) { u.s.dead = 1; u.s.deadAt = U.nights || 0; u.s.tamed = 0; u.s.temper = 0; saveU(); if (ride) dismount(); try { mistPuff(u.g.position.x, u.g.position.y + 1, u.g.position.z, 0xf8f0ff, 18); window.dropXP && dropXP(u.g.position.x, u.g.position.y + 1, u.g.position.z, 20); } catch (_) {} toast('The unicorn fades into starlight... it may return after many nights'); } }
  // hooks: look/hit/use, riding speed + jump, camera height, fall safety
  const rm0 = reachMob; reachMob = function (maxT) { const best = rm0.apply(this, arguments); const u = U.uni; if (!u || u.s.dead || ride || !u.g.visible) return best;
    const d = lookDir(), o = [P.x, P.y + EYE, P.z], c = u.g.position, cx = c.x, cy = c.y + 1.2, cz = c.z, vx = cx - o[0], vy = cy - o[1], vz = cz - o[2], t = vx * d[0] + vy * d[1] + vz * d[2];
    if (t < 0 || t > maxT) return best; if (Math.hypot(o[0] + d[0] * t - cx, (o[1] + d[1] * t - cy) * 0.7, o[2] + d[2] * t - cz) > 1.0) return best;
    if (best) { const b = best.g.position; if (Math.hypot(b.x - o[0], b.y + (best.hitY || 1) - o[1], b.z - o[2]) < t) return best; } return u.proxy; };
  const hm0 = hitMob; hitMob = function (a) { if (a && a.isUnicorn) { uniHit(); return; } return hm0.apply(this, arguments); };
  const dm0 = damageMob; damageMob = function (a) { if (a && a.isUnicorn) { uniHit(); return; } return dm0.apply(this, arguments); };
  const ui0 = useItem; useItem = function () { try { if (!menuOpen && !paused && !dead && started) { const u = U.uni;
      if (ride) { if (u && !(u.buck > 0)) dismount(); return; }
      const m = u && !u.s.dead ? reachMob(4) : null;
      if (m && m.isUnicorn) { if (cnt(selId) > 0 && (selId === IT.WHEAT || selId === IT.BREAD)) { swing(); feed(selId); } else mount(); return; }
      const w = U.wiz; if (w && w.grp.visible && Math.min(Math.hypot(w.ga.position.x - P.x, w.ga.position.z - P.z), Math.hypot(w.gb.position.x - P.x, w.gb.position.z - P.z)) < 3.5 && !raycast(3)) { w.sayT = 0; return; } } } catch (e) { console.warn('c125 use', e); }
    return ui0.apply(this, arguments); };
  const up0 = updatePlayer; updatePlayer = function (dt, mx, mz) { if (!ride) return up0.apply(this, arguments); const u = U.uni, ox = P.x, oz = P.z, vy0 = P.vy;
    if (u && u.buck > 0) { mx = 0; mz = 0; } const r = up0.call(this, dt, mx, mz);
    const ddx = P.x - ox, ddz = P.z - oz, boost = (sprinting ? 1.6 : 1.25) * (swimming ? 0.3 : 1); moveAxis(ddx * boost, 0); moveAxis(0, ddz * boost);
    if (P.vy > 7 && vy0 <= 0.5 && !swimming) P.vy += 4;   // a big unicorn leap
    if (u) u.rideSp = Math.hypot(P.x - ox, P.z - oz) / Math.max(dt, 1e-3); P.fallTop = null; return r; };
  const pc0 = placeCamera; placeCamera = function (bx, by, rx, rz) { return pc0.call(this, bx, (by || 0) + (ride ? 0.85 : 0), rx, rz); };
  const wm0 = updateWorldModel; updateWorldModel = function () { const r = wm0.apply(this, arguments); try { if (ride && worldModel) worldModel.position.y = P.y + 0.85; } catch (_) {} return r; };
  const h0 = hurt; hurt = function (n, cause) { if (ride && /long fall/i.test(String(cause || ''))) return; return h0.apply(this, arguments); };

  // =================== world hook-up ===================
  U.nights = 0; let wasN = false, setupFor = null;
  function clearAll() { if (U.wiz) dispose(U.wiz.grp); U.wiz = null; if (U.uni) { dispose(U.uni.g); dispose(U.uni.trail); } U.uni = null; ride = false; if (bub) bub.style.display = 'none'; }
  function setup() { clearAll(); setupFor = key(); if (current && current.flat) return;
    try { const wk = 'glen_wiz_' + key(); let sp = load(wk); if (!sp) { sp = findWizSpot(); if (sp) store(wk, sp); } if (sp) buildWiz(sp); } catch (e) { console.warn('wizards', e); }
    try { let s = load(UKEY()); if (!s) { const [x, z] = findUniSpot(); s = {hx: x, hz: z, x, z, temper: 0, tamed: 0, dead: 0}; store(UKEY(), s); } U.nights = s.nights || 0;
      if (s.dead && U.nights - (s.deadAt || 0) >= 7) { s.dead = 0; s.x = s.hx; s.z = s.hz; store(UKEY(), s); }   // comes back after 7 nights, wild again
      buildUni(s); } catch (e) { console.warn('unicorn', e); } }
  U.setup = setup; U.clear = clearAll;
  const ew = enterWorld; enterWorld = function () { clearAll(); setupFor = null; return ew.apply(this, arguments); };
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { if (started && current && setupFor !== key()) setup();
      if (started && !paused) { if (isNight && !wasN) { U.nights++; if (U.uni) { U.uni.s.nights = U.nights; saveU(); } } wasN = isNight; wizStep(dt); uniStep(dt); bubStep(dt); } } catch (e) { if (!U.err) U.err = String(e && e.stack || e); } return r; };
})();
