/* ===================== GLX-C242 (v1.0.56): VOLCANO ERUPTION - shoot the volcano and it blows: huge blasts, a lava fountain, flaming lava bombs that smash craters
   and set the land alight, fast fiery lava rivers racing down the slopes, the spawn island wrecked - then it calms to slow glowing flows. Cooldown before it can blow again.
   Never touches your own placed blocks (placedSet). Saved with the world. ===================== */
(function c242() {
  const U = window.__c242 = {err: null, ph: 'idle', bombs: 0, hits: 0, craters: 0, lava: 0, burnt: 0, fires: 0, fronts: 0, t: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const LOW = (typeof touchMode !== 'undefined' && !!touchMode) || (typeof PERF !== 'undefined' && PERF);
  const ERUPT = 45, CALM = 90, COOL = 600;
  const mine = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i);
  const inB = (x, y, z) => x > 0 && z > 0 && y > 1 && x < W - 1 && z < D - 1 && y < H - 1;
  const NATS = () => new Set([T.GRASS, T.DIRT, T.STONE, T.SAND, T.GRAVEL, T.HEATHER, T.PEAT, T.MUD, T.COBBLE, T.DEEPSLATE, T.COALORE, T.IRONORE, T.COPPERORE, T.MAGMA, T.OBSIDIAN, T.SNOW, 156, 178, 248, 136].filter(v => v !== undefined));
  let NAT = null; const nat = b => { if (!NAT) NAT = NATS(); return NAT.has(b) || PLANT[b] || LEAFY[b] || LOGGY[b]; };
  const S = () => current && current.c242;
  function put(x, y, z, v) { if (!inB(x, y, z)) return false; const i = idx(x, y, z), b = world[i]; if (b === v || mine(i)) return false; if (b && b !== T.FIRE && !nat(b) && b !== T.LAVA && b !== T.WATER) return false;
    world[i] = v; try { if (typeof FLV !== 'undefined') FLV.delete(i); markDirty(x, z); if (v === T.LAVA || !v) flQueue(x, y, z); } catch (_) {} try { dirty = true; } catch (_) {} return true; }
  const top = (x, z) => { for (let y = H - 2; y > 1; y--) { const v = world[idx(x, y, z)]; if (v && v !== T.FIRE && !PLANT[v]) return y; } return 0; };
  const ign = (x, y, z) => { try { if (window.__c237 && __c237.ignite && __c237.ignite(x + .5, y + 1.02, z + .5)) U.fires++; } catch (_) {} };
  // ---------- sounds ----------
  function boom(pos, big) { try { if (!AC || AC.state !== 'running') return; const d = Math.hypot(pos.x - P.x, pos.y - P.y, pos.z - P.z), v = Math.max(0, 1 - d / (big ? 400 : 140)) * (big ? 0.3 : 0.2); if (v < 0.02) return;
      const t = AC.currentTime + Math.min(1.2, d / 340), len = big ? 4 : 1.6, n = AC.createBufferSource(), b = AC.createBuffer(1, AC.sampleRate * len | 0, AC.sampleRate), ch = b.getChannelData(0); let l = 0;
      for (let i = 0; i < ch.length; i++) { l = (l + 0.05 * (Math.random() * 2 - 1)) / 1.05; ch[i] = (l * 4 + (Math.random() * 2 - 1) * 0.25 * Math.exp(-i / AC.sampleRate * 6)); }
      n.buffer = b; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(big ? 900 : 1400, t); lp.frequency.exponentialRampToValueAtTime(70, t + len); const g = AC.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.002, v), t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + len); n.connect(lp); lp.connect(g); g.connect(typeof master !== 'undefined' ? master : AC.destination); n.start(t); n.stop(t + len); } catch (e) { ERR('boom', e); } }
  // ---------- visuals: bombs, fountain, flash ----------
  let fx = null;
  function mkFx() { const g = new THREE.Group(); g.userData.__dcR = 1e9; g.userData.__dcK = 1; scene.add(g);
    const bm = new THREE.MeshBasicMaterial({color: 0xff6a1a, fog: false}), bg = new THREE.IcosahedronGeometry(0.8, 0), bombs = [];
    for (let i = 0; i < (LOW ? 8 : 16); i++) { const m = new THREE.Mesh(bg, bm); m.visible = false; m.userData.__dcR = 1e9; m.userData.__dcK = 1; g.add(m); bombs.push({m, on: false}); }
    const NF = LOW ? 90 : 260, FP = new Float32Array(NF * 3), FV = new Float32Array(NF * 4), fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(FP, 3)); for (let i = 0; i < NF; i++) FP[i * 3 + 1] = -999;
    const pts = new THREE.Points(fg, new THREE.PointsMaterial({color: 0xff7a22, size: LOW ? 1.3 : 1.0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false})); pts.frustumCulled = false; pts.userData.__dcR = 1e9; pts.userData.__dcK = 1; g.add(pts);
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), q = x.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(255,220,140,1)'); q.addColorStop(0.4, 'rgba(255,120,30,0.7)'); q.addColorStop(1, 'rgba(255,60,0,0)'); x.fillStyle = q; x.fillRect(0, 0, 64, 64);
    const flash = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false})); flash.userData.__dcR = 1e9; flash.userData.__dcK = 1; g.add(flash);
    const sc = document.createElement('canvas'); sc.width = sc.height = 64; { const y = sc.getContext('2d'), r = y.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(40,36,34,0.85)'); r.addColorStop(1, 'rgba(40,36,34,0)'); y.fillStyle = r; y.fillRect(0, 0, 64, 64); }
    const smk = [], sm = new THREE.SpriteMaterial({map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, opacity: 0.8});
    for (let i = 0; i < (LOW ? 8 : 18); i++) { const s = new THREE.Sprite(sm.clone()); s.visible = false; s.userData.__dcR = 1e9; s.userData.__dcK = 1; g.add(s); smk.push({s, t: i * 0.9, life: 14}); }
    return {g, bombs, FP, FV, fg, NF, flash, smk, pts}; }
  // ---------- impacts ----------
  function crater(x, y, z, r) { const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), R = Math.ceil(r); let n = 0;
    for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) for (let dz = -R; dz <= R; dz++) { const d = Math.hypot(dx, dy * 1.2, dz); if (d > r) continue; const b = inB(X + dx, Y + dy, Z + dz) && world[idx(X + dx, Y + dy, Z + dz)]; if (!b || b === T.WATER) continue; if (put(X + dx, Y + dy, Z + dz, 0)) n++; }
    // the floor glows: a little molten lava pool and scorched rock round the rim
    let fy = Y; while (fy > 2 && !world[idx(X, fy - 1, Z)]) fy--; if (world[idx(X, fy - 1, Z)] !== T.WATER && put(X, fy, Z, T.LAVA)) U.lava++;
    for (let k = 0; k < 14; k++) { const a = Math.random() * 6.283, rr = r + 0.5 + Math.random() * 2.5, sx = Math.floor(X + Math.sin(a) * rr), sz = Math.floor(Z + Math.cos(a) * rr), sy = top(sx, sz); if (!sy) continue; const b = world[idx(sx, sy, sz)];
      if (b === T.GRASS || b === T.DIRT || b === T.HEATHER || b === T.PEAT) { if (put(sx, sy, sz, Math.random() < 0.6 ? 156 : T.GRAVEL)) U.burnt++; } if (Math.random() < 0.6) ign(sx, sy, sz); }
    if (n) U.craters++; try { burst(x, y + 1, z, 0xff7020, LOW ? 12 : 24, 2.4); burst(x, y + 1.5, z, 0x3a3634, LOW ? 8 : 18, 2.8); } catch (_) {}
    const d = Math.hypot(x - P.x, y - P.y, z - P.z); if (d < 26) try { shake(0.6, 0.12 * (1 - d / 26) + 0.02); } catch (_) {} if (d < r + 2.2) try { hurt(Math.round(8 * (1 - d / (r + 2.2))) + 2, 'lava bomb'); } catch (_) {}
    boom({x, y, z}, false); }
  // ---------- lava rivers: fronts that race downhill from the crater, setting all they touch alight ----------
  function step(f) { let best = null, bh = 1e9; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const nx = f.x + dx, nz = f.z + dz; if (!inB(nx, 5, nz)) continue; const h = top(nx, nz) + (f.last && f.last[0] === nx && f.last[1] === nz ? 99 : 0) + Math.random() * 0.8 + ((dx * f.dx + dz * f.dz) < 0 ? 1.5 : 0); if (h < bh) { bh = h; best = [nx, nz]; } }
    if (!best) return false; const [nx, nz] = best, ny = top(nx, nz); if (!ny || world[idx(nx, ny, nz)] === T.WATER) return false; if (ny > f.y + 1) return false;
    f.last = [f.x, f.z]; f.dx = nx - f.x; f.dz = nz - f.z; f.x = nx; f.z = nz; f.y = ny; f.n++;
    const b = world[idx(nx, ny, nz)]; if (LOGGY[b] || LEAFY[b] || PLANT[b]) put(nx, ny, nz, 0); if (put(nx, ny + 1, nz, T.LAVA)) U.lava++; else if (world[idx(nx, ny + 1, nz)] !== T.LAVA) put(nx, ny, nz, T.MAGMA);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const sx = nx + dx, sz = nz + dz, sy = top(sx, sz); if (sy && Math.random() < 0.4) ign(sx, sy, sz); } return f.n < 90; }
  // ---------- start / run ----------
  function erupt(blue) { const at = current && current.c229; if (!at || DIM.cur) return false; const s = S(); if (s && (blue ? s.ph === 'erupt' : s.ph !== 'idle')) return false;
    current.c242 = {ph: 'erupt', t: 0, cool: 0, blue: !!blue}; if (!blue) current.c242ever = 1; U.ph = 'erupt'; fronts = []; const cx = Math.floor(at[0]), cz = Math.floor(at[2]);
    for (let k = 0; k < (LOW ? 4 : 6); k++) { const a = k / (LOW ? 4 : 6) * 6.283 + Math.random() * 0.5; const x = Math.round(cx + Math.sin(a) * 6), z = Math.round(cz + Math.cos(a) * 6); fronts.push({x, z, y: top(x, z), dx: Math.sign(Math.sin(a)), dz: Math.sign(Math.cos(a)), n: 0, last: null}); }
    U.fronts = fronts.length; boom({x: at[0], y: at[1], z: at[2]}, true); setTimeout(() => boom({x: at[0], y: at[1], z: at[2]}, true), 900);
    try { shake(2.5, 0.25); } catch (_) {} try { toast(blue ? 'The volcano erupts BLUE...' : 'The volcano is erupting! Run!'); } catch (_) {} if (fx) fx.flash.material.opacity = 1; return true; }
  U.erupt = erupt;
  let fronts = [], bombT = 0, frontT = 0, extraT = 0, ashT = 0;
  function launch(at, s) { const b = fx.bombs.find(q => !q.on); if (!b) return; const sp = window.__g89 && __g89() ? [at[0] + (Math.random() - .5) * 90, at[2] + (Math.random() - .5) * 90] : [W >> 1, D >> 1], toSpawn = Math.random() < 0.7; b.sp = toSpawn;
    const a = Math.random() * 6.283, r = toSpawn ? Math.random() * 42 : 8 + Math.random() * 50, tx = (toSpawn ? sp[0] : at[0]) + Math.sin(a) * r, tz = (toSpawn ? sp[1] : at[2]) + Math.cos(a) * r;
    const ty = top(Math.floor(tx), Math.floor(tz)) + 1, T0 = 3 + Math.random() * 2.5, y0 = at[3] + 2, g = 9.8;
    b.on = true; b.p = [at[0], y0, at[2]]; b.v = [(tx - at[0]) / T0, (ty - y0 + 0.5 * g * T0 * T0) / T0, (tz - at[2]) / T0]; b.g = g; b.m.visible = true; b.m.scale.setScalar(0.8 + Math.random() * 0.9); U.bombs++; }
  function frame(dt) { const s = S(), at = current && current.c229; if (!started || DIM.cur || !at || !s || s.ph === 'idle') { if (fx) fx.g.visible = false; return; }
    if (!fx) fx = mkFx(); fx.g.visible = true; s.t += dt; { const c = s.blue ? 0x30b8ff : 0xff6a1a; fx.bombs[0].m.material.color.setHex(c); fx.pts.material.color.setHex(s.blue ? 0x40d0ff : 0xff7a22); fx.flash.material.color.setHex(s.blue ? 0x60c0ff : 0xffffff); } U.t = +s.t.toFixed(1); U.ph = s.ph;
    if (s.ph === 'cool') { fx.g.visible = false; s.cool -= dt; if (s.cool <= 0) { s.ph = 'idle'; U.ph = 'idle'; } return; }
    const er = s.ph === 'erupt', k = er ? 1 : Math.max(0, 1 - (s.t - ERUPT) / CALM);
    // flash
    fx.flash.position.set(at[0], at[3] + 4, at[2]); fx.flash.scale.set(42, 42, 1); fx.flash.material.opacity = Math.max(0, fx.flash.material.opacity - dt * 0.8) + (er ? 0.14 + 0.08 * Math.sin(s.t * 9) : 0.08 * k);
    // fountain
    const {FP, FV} = fx; for (let i = 0; i < fx.NF; i++) { const b = i * 3, v = i * 4; if (FV[v + 3] > 0) { FV[v + 3] -= dt; FV[v + 1] -= 9.8 * dt; FP[b] += FV[v] * dt; FP[b + 1] += FV[v + 1] * dt; FP[b + 2] += FV[v + 2] * dt; if (FV[v + 3] <= 0) { FV[v + 3] = 0; FP[b + 1] = -999; } }
      else if (Math.random() < dt * 6 * k) { FP[b] = at[0] + (Math.random() - .5) * 6; FP[b + 1] = at[3]; FP[b + 2] = at[2] + (Math.random() - .5) * 6; FV[v] = (Math.random() - .5) * 9; FV[v + 1] = 14 + Math.random() * 18 * k; FV[v + 2] = (Math.random() - .5) * 9; FV[v + 3] = 2 + Math.random() * 2; } }
    fx.fg.attributes.position.needsUpdate = true;
    // ash cloud
    for (const p of fx.smk) { p.t += dt; if (p.t > p.life) p.t = 0; const q = p.t / p.life; p.s.visible = k > 0.05; p.s.position.set(at[0] + q * 14 + Math.sin(p.t) * 2, at[3] + 4 + q * 45, at[2] + q * 6); const z = 6 + q * 30; p.s.scale.set(z, z, 1); p.s.material.opacity = Math.min(1, q * 5) * (1 - q) * 0.85 * k; }
    // bombs
    if (er && (bombT -= dt) <= 0) { bombT = (LOW ? 0.7 : 0.35) + Math.random() * 0.4; launch(at, s); }
    for (const b of fx.bombs) { if (!b.on) continue; b.v[1] -= b.g * dt; b.p[0] += b.v[0] * dt; b.p[1] += b.v[1] * dt; b.p[2] += b.v[2] * dt; b.m.position.set(b.p[0], b.p[1], b.p[2]); b.m.rotation.x += dt * 5;
      if (Math.random() < dt * 14) try { burst(b.p[0], b.p[1], b.p[2], 0xff8a30, 1, 0.2); } catch (_) {}
      const X = Math.floor(b.p[0]), Y = Math.floor(b.p[1]), Z = Math.floor(b.p[2]); if (b.v[1] < 0 && (Y < 2 || (inB(X, Y, Z) && world[idx(X, Y, Z)] && world[idx(X, Y, Z)] !== T.FIRE && !PLANT[world[idx(X, Y, Z)]]))) { b.on = false; b.m.visible = false; U.hits++; if (Y >= 2) crater(b.p[0], b.p[1], b.p[2], b.sp ? 2.4 + Math.random() * 1.6 : 1.6 + Math.random() * 1.6); } }
    // lava rivers: fast while erupting, slowing right down as it calms
    if ((frontT -= dt) <= 0) { frontT = er ? 0.25 : 1 + 6 * (1 - k); if (k > 0.02) fronts = fronts.filter(f => step(f)); U.fronts = fronts.length; }
    if (er && typeof flowTick === 'function' && (extraT -= dt) <= 0) { extraT = LOW ? 0.3 : 0.15; try { flowTick(true); } catch (_) {} }   // lava runs fast while it erupts
    // ash fall wrecks the spawn island: grass scorched, trees catch light
    if (er && (ashT -= dt) <= 0) { ashT = LOW ? 0.08 : 0.04; for (let q = 0; q < 3; q++) { const G8 = window.__g89 && __g89(), sx = (G8 ? Math.floor(at[0]) : (W >> 1)) + Math.floor((Math.random() - .5) * (G8 ? 110 : 90)), sz = (G8 ? Math.floor(at[2]) : (D >> 1)) + Math.floor((Math.random() - .5) * 90), sy = top(sx, sz); if (sy) { const b = world[idx(sx, sy, sz)];
        if (b === T.GRASS || b === T.HEATHER) { if (put(sx, sy, sz, Math.random() < 0.5 ? 156 : T.DIRT)) U.burnt++; } else if (LEAFY[b] || LOGGY[b] || PLANT[b]) { if (Math.random() < 0.5) put(sx, sy, sz, 0); else ign(sx, sy - 1, sz); } else if ((b === 156 || b === T.DIRT || b === T.GRAVEL || b === T.STONE) && Math.random() < 0.25) put(sx, sy, sz, 0); if (Math.random() < 0.3) ign(sx, sy, sz); } } }
    if (er && s.t > ERUPT) { s.ph = 'calm'; try { toast('The eruption is calming down...'); } catch (_) {} }
    if (s.ph === 'calm' && s.t > ERUPT + CALM) { s.ph = 'cool'; s.cool = COOL; fronts = []; } }
  // ---------- shooting the volcano sets it off ----------
  function hitsVolcano(o, d) { const at = current && current.c229; if (!at) return false; for (let t = 1; t < 200; t += 0.5) { const x = o.x + d[0] * t, y = o.y + d[1] * t, z = o.z + d[2] * t, hd = Math.hypot(x - at[0], z - at[2]);
      if (hd < 22 && y < at[3] + 3 && y > at[3] - 30) { const b = world[idx(Math.floor(x), Math.floor(y), Math.floor(z))]; if (b || hd < 6) return true; }
      if (inB(Math.floor(x), Math.floor(y), Math.floor(z)) && solid(Math.floor(x), Math.floor(y), Math.floor(z)) && hd >= 22) return false; } return false; }
  try { const fg = fireGun; fireGun = function (id) { const r = fg.apply(this, arguments); try { if (hitsVolcano(new THREE.Vector3(P.x, P.y + 1.62, P.z), lookDir()) && erupt()) U.shotTrigger = 1; } catch (e) { ERR('hit', e); } return r; }; } catch (e) { ERR('fg', e); }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { frame(Math.min(0.1, +dt || 0.016)); } catch (e) { ERR('fx', e); } return r; };
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && !DIM.cur && current && current.c242) d.c242 = current.c242; if (d && current && current.c242ever) d.c242ever = 1; } catch (_) {} return d; }; } catch (e) { ERR('ser', e); }
  try { const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && current) current.c242ever = d.c242ever || (d.c242 ? 1 : 0); if (d && current) current.c242 = d.c242 && d.c242.ph === 'cool' ? d.c242 : d.c242 ? {ph: 'calm', t: ERUPT + CALM * 0.8, cool: 0} : null; } catch (_) {} return r; }; } catch (e) { ERR('ap', e); }
  try { const ew = enterWorld; enterWorld = function (save) { if (!save && current) { current.c242 = null; current.c242ever = 0; } return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
})();
