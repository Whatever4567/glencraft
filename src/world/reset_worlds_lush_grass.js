/* ===================== GLX-C229 (v1.0.50): new / reset worlds - lush grass round spawn and an ACTIVE VOLCANO where the big skull stood (lava crater, glowing flows, smoke, embers, rumble); menu hint fix ===================== */
(function c229() {
  const U = window.__c229 = {err: null, built: 0, cols: 0, green: 0, flows: 0, at: null, rumbles: 0, puffs: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const PH = typeof touchMode !== 'undefined' && !!touchMode;
  // ---- the menu hint: bigger, clearer text so "Tap" never reads as "Tao" (the p's tail was being cut off) ----
  try { const st = document.createElement('style'); st.textContent = '.menuhint{line-height:1.6!important;padding-bottom:3px!important;overflow:visible!important;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif!important;font-weight:600!important;color:#e8f5e4!important}'; document.head.appendChild(st);
    const fix = () => { for (const e of document.querySelectorAll('.menuhint')) for (const n of e.childNodes) if (n.nodeType === 3 && /ta[op]\s+anywhere/i.test(n.textContent)) n.textContent = n.textContent.replace(/ta[op]\s+anywhere/i, 'Tap anywhere'); }; fix(); setTimeout(fix, 1500); } catch (e) { ERR('css', e); }
  // ---- building (called by GLX-C219 in place of the skull carve, with its safe put()) ----
  const rnd0 = s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const gtop = (x, z) => { for (let y = H - 2; y > 1; y--) { const v = world[idx(x, y, z)]; if (v && v !== T.WATER && !PLANT[v] && !LEAFY[v] && !LOGGY[v]) return y; } return 0; };
  const mine = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i);
  const NAT = new Set([T.GRASS, T.DIRT, T.STONE, T.SAND, T.GRAVEL, T.HEATHER, T.PEAT, T.MUD, T.COBBLE, T.DEEPSLATE, T.COALORE, T.IRONORE, T.COPPERORE, 156, 178, 248, 136, T.LAVA, T.MAGMA].filter(v => v !== undefined));
  const nat = b => !b || NAT.has(b) || PLANT[b] || LEAFY[b] || LOGGY[b];
  function build(put) {
    const ox = (W >> 1) - 128, oz = (D >> 1) - 124, cx = window.__g89 && __g89() ? __c273.volc()[0] : ox + 125, cz = window.__g89 && __g89() ? __c273.volc()[1] : oz + 171, R = 20, RC = 5, R2 = rnd0(((typeof gSeed !== 'undefined' ? gSeed : 7) ^ 0x7015) >>> 0);
    let g0 = 0, k = 0; for (let a = 0; a < 16; a++) { const x = Math.round(cx + Math.sin(a / 16 * 6.283) * R), z = Math.round(cz + Math.cos(a / 16 * 6.283) * R); const t = gtop(x, z); if (t > SEA) { g0 += t; k++; } }
    g0 = k ? Math.round(g0 / k) : 46; const PK = Math.min(H - 12, g0 + 26), rim = PK, floor = rim - 4;
    const hAt = (d, a) => { if (d > R) return -1; const n = Math.sin(a * 5 + 1.3) * 0.9 + Math.sin(a * 11) * 0.5; if (d < RC) return Math.round(floor + (d / RC) * (d / RC) * 3); return Math.round(g0 + (PK - g0) * Math.pow(1 - (d - RC) / (R - RC), 1.35) + n * (d / R)); };
    const flowA = [0.4, 2.5, 4.4].map(a => a + R2() * 0.5); const isFlow = (d, a) => d > RC && flowA.some(f => { const da = Math.abs(((a - f + 9.42) % 6.283) - 3.14); return da * d < 1.1 + Math.sin(d * 0.7 + f) * 0.4; });
    let cols = 0;
    for (let x = cx - R - 1; x <= cx + R + 1; x++) for (let z = cz - R - 1; z <= cz + R + 1; z++) {
      const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz), a = Math.atan2(dx, dz), h = hAt(d, a); if (h < 0) continue;
      const base = gtop(x, z); if (!base) continue; let ok = true; for (let y = base; y <= h + 6; y++) if (!nat(world[idx(x, y, z)])) { ok = false; break; } if (!ok) continue;
      for (let y = Math.min(base, h) - 2; y <= h; y++) { if (y < 2) continue; const top = y === h, r = R2();
        let v = r < 0.5 ? T.DEEPSLATE : r < 0.8 ? T.STONE : 156;
        if (d < RC) v = y >= h - 1 ? T.OBSIDIAN : T.DEEPSLATE;
        else if (d < RC + 2.5 && y >= h - 1) v = r < 0.6 ? T.MAGMA : T.OBSIDIAN;
        else if (top && isFlow(d, a)) { v = T.MAGMA; U.flows++; }
        else if (top && d > R - 4 && r < 0.35) v = T.GRAVEL;
        put(x, y, z, v); }
      for (let y = h + 1; y <= h + 8; y++) { const b = world[idx(x, y, z)]; if (b && b !== T.WATER) put(x, y, z, T.AIR); }
      cols++; }
    // the lava lake in the crater: two deep, always ringed by solid rim
    for (let x = cx - RC; x <= cx + RC; x++) for (let z = cz - RC; z <= cz + RC; z++) { const d = Math.hypot(x - cx, z - cz); if (d > RC - 1.2) continue; for (let y = floor + 1; y <= floor + 2; y++) put(x, y, z, T.LAVA); put(x, floor, z, T.OBSIDIAN); }
    U.cols = cols; U.at = [cx + .5, floor + 3, cz + .5, rim]; if (current) current.c229 = U.at; U.built = 1;
    // ---- lush grass round spawn: bare stone, gravel and grey rock on the surface become grass with a few tufts ----
    const sx = W >> 1, sz = D >> 1; let gr = 0;
    for (let x = sx - 52; x <= sx + 52; x++) for (let z = sz - 52; z <= sz + 52; z++) { if (x < 2 || z < 2 || x >= W - 2 || z >= D - 2) continue; if (Math.hypot(x - sx, z - sz) > 52 || Math.hypot(x - cx, z - cz) < R + 2) continue;
      const t = gtop(x, z); if (t <= SEA) continue; const i = idx(x, t, z), b = world[i]; if (mine(i) || !(b === T.STONE || b === 156 || b === T.GRAVEL || b === T.COBBLE || b === T.DIRT)) continue;
      const ab = world[idx(x, t + 1, z)]; if (ab && !PLANT[ab]) continue; if (world[idx(x, t + 1, z)] === T.WATER) continue;
      if (put(x, t, z, T.GRASS)) { gr++; if (world[idx(x, t - 1, z)] === T.STONE) put(x, t - 1, z, T.DIRT); const r = R2(); if (!ab && r < 0.14) put(x, t + 1, z, r < 0.11 ? T.TALLGRASS : r < 0.125 ? T.DANDELION : T.BLUEBELL); } }
    U.green = gr; }
  U.build = build;
  // ---- the volcano alive: smoke plume, embers, crater glow, rumble ----
  let fx = null, tm = 0, rumT = 12;
  function mkFx(at) { const g = new THREE.Group(); scene.add(g);
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), q = x.createRadialGradient(32, 32, 0, 32, 32, 32); q.addColorStop(0, 'rgba(90,88,86,0.75)'); q.addColorStop(0.6, 'rgba(70,68,66,0.35)'); q.addColorStop(1, 'rgba(60,60,60,0)'); x.fillStyle = q; x.fillRect(0, 0, 64, 64);
    const st = new THREE.CanvasTexture(c), NS = PH ? 6 : 20, puffs = [];
    for (let i = 0; i < NS; i++) { const m = new THREE.SpriteMaterial({map: st, transparent: true, depthWrite: false, opacity: 0, fog: true}); const s = new THREE.Sprite(m); g.add(s); puffs.push({s, t: i / NS * 9, life: 9}); }
    const gc = document.createElement('canvas'); gc.width = gc.height = 64; { const y = gc.getContext('2d'), r = y.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,140,40,0.9)'); r.addColorStop(1, 'rgba(255,60,0,0)'); y.fillStyle = r; y.fillRect(0, 0, 64, 64); }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending})); glow.scale.set(16, 9, 1); glow.position.set(at[0], at[1] + 1.5, at[2]); g.add(glow);
    const NE = PH ? 16 : 60, EP = new Float32Array(NE * 3), EV = new Float32Array(NE * 4), eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(EP, 3)); for (let i = 0; i < NE; i++) EP[i * 3 + 1] = -999;
    const pts = new THREE.Points(eg, new THREE.PointsMaterial({color: 0xff8a30, size: 0.22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending})); pts.frustumCulled = false; g.add(pts);
    return {g, puffs, glow, EP, EV, eg, NE, at}; }
  function rumble(d) { try { if (!AC || AC.state !== 'running') return; const t = AC.currentTime + 0.02, len = 3, n = AC.createBufferSource(), b = AC.createBuffer(1, AC.sampleRate * len | 0, AC.sampleRate), ch = b.getChannelData(0); let l = 0;
      for (let i = 0; i < ch.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; ch[i] = l * 3.2; } n.buffer = b; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 90; const gn = AC.createGain(), v = Math.max(0, 1 - d / 110) * 0.9;
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(Math.max(0.001, v), t + 0.8); gn.gain.exponentialRampToValueAtTime(0.0001, t + len); n.connect(lp); lp.connect(gn); gn.connect(typeof master !== 'undefined' ? master : AC.destination); n.start(t); n.stop(t + len);
      if (d < 45) shake(0.5, 0.02 * (1 - d / 45) + 0.006); U.rumbles++; } catch (e) { ERR('rum', e); } }
  function frame(dt) { let at = current && current.c229; try { if (window.__c320 && __c320.flat) { const v = window.__c342 && __c342.craters && __c342.craters().find(q => q.la === 56.72); at = null; if (v) { const cx = Math.round(v.x), cz = Math.round(v.z); if (!U.uk || U.uk[0] !== cx + .5) { let cy = 0; for (let y = H - 2; y > 0; y--) { const b = getB(cx, y, cz); if (b) { cy = y + 1; break; } } if (cy) U.uk = [cx + .5, cy, cz + .5, 0]; } at = U.uk || null; } } } catch (_) { at = null; } if (!started || DIM.cur || !at) { if (fx) fx.g.visible = false; return; } if (!fx || fx.at !== at) { if (fx) scene.remove(fx.g); fx = mkFx(at); } fx.g.visible = true; tm += dt;
    const d = Math.hypot(P.x - at[0], P.z - at[2]); if (d > 220) { fx.g.visible = false; return; }
    for (const p of fx.puffs) { p.t += dt; if (p.t > p.life) { p.t = 0; U.puffs++; } const k = p.t / p.life, w = (typeof weather !== 'undefined' && weather.wind) || 0.4; p.s.position.set(at[0] + k * 9 * w + Math.sin(p.t + k * 4) * 1.2, at[1] + 2 + k * 30, at[2] + k * 4 * w); const sz = 3 + k * 13; p.s.scale.set(sz, sz, 1); p.s.material.opacity = Math.min(1, k * 6) * (1 - k) * 0.75; }
    fx.glow.material.opacity = 0.65 + 0.25 * Math.sin(tm * 2.3) + 0.1 * Math.sin(tm * 7.1);
    const {EP, EV} = fx; for (let i = 0; i < fx.NE; i++) { const b = i * 3, v = i * 4; if (EV[v + 3] > 0) { EV[v + 3] -= dt; EV[v + 1] -= 9 * dt; EP[b] += EV[v] * dt; EP[b + 1] += EV[v + 1] * dt; EP[b + 2] += EV[v + 2] * dt; if (EV[v + 3] <= 0 || EP[b + 1] < at[1] - 2) { EV[v + 3] = 0; EP[b + 1] = -999; } }
      else if (Math.random() < dt * 1.2) { EP[b] = at[0] + (Math.random() - .5) * 5; EP[b + 1] = at[1]; EP[b + 2] = at[2] + (Math.random() - .5) * 5; EV[v] = (Math.random() - .5) * 4; EV[v + 1] = 7 + Math.random() * 8; EV[v + 2] = (Math.random() - .5) * 4; EV[v + 3] = 1.5 + Math.random() * 1.5; } }
    fx.eg.attributes.position.needsUpdate = true;
    if ((rumT -= dt) <= 0) { rumT = 22 + Math.random() * 26; if (d < 110) rumble(d); } }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { frame(Math.min(0.1, +dt || 0.016)); } catch (e) { ERR('fx', e); } return r; };
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && !DIM.cur && current && current.c229) d.c229 = current.c229; } catch (_) {} return d; }; } catch (e) { ERR('ser', e); }
  try { const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && d.c229 && current) current.c229 = d.c229; } catch (_) {} return r; }; } catch (e) { ERR('ap', e); }
  try { const ew = enterWorld; enterWorld = function (save) { if (!save && current) current.c229 = null; return ew.apply(this, arguments); }; } catch (e) { ERR('ew', e); }
})();
