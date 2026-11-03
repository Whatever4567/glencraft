/* ===================== GLX-C116 (v0.9.96): cyborg creeper with SOS siren, zombified people, long-legged HD spiders, skeleton archer pose, haggis herds, faster pickaxes ===================== */
(function c116() {
  const U = window.__c116 = {siren: 0, armed: 0, booms: 0, disarm: 0, lastBoom: null, herds: 0, eaten: 0, nibbled: 0, err: null, poses: 0};
  const SRGB = t => { if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; try { t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); } catch (_) {} return t; };
  const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); fn(g, w, h); return c; };
  const ctex = c => SRGB(new THREE.CanvasTexture(c));
  const R = Math.random, rr = (a, b) => a + R() * (b - a);
  const blob = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); };
  const noise = (g, w, h, n, cols, r0, r1, al) => { for (let i = 0; i < n; i++) { g.globalAlpha = al === undefined ? 1 : al; blob(g, R() * w, R() * h, rr(r0, r1), cols[(R() * cols.length) | 0]); } g.globalAlpha = 1; };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, cl01 = v => clamp(v, 0, 1);
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e); };

  /* ---------------- pickaxes: copper -> (no copper pickaxe in game), iron gets the old diamond speed, diamond 1.5x ---------------- */
  try { const tts = toolTierSpeed, ironOld = tts(IT.IPICK), diaOld = tts(IT.DPICK); U.pick = {ironOld, diaOld, iron: diaOld, dia: Math.round(diaOld * 1.5)};
    toolTierSpeed = function (id) { const m = toolMat(id), t = TOOL[id]; if (t && t[0] === 'pick') { if (m === 'iron') return U.pick.iron; if (m === 'diamond') return U.pick.dia; if (m === 'copper') return ironOld; } return tts.apply(this, arguments); }; } catch (e) { ERR(e); }

  /* ================= CREEPER: ancient Glencraft cyborg ================= */
  let CT = null;
  function creeperTex() { if (CT) return CT;
    const plate = (g, w, h, stripe) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#8f2a1a'); gr.addColorStop(.5, '#a8361f'); gr.addColorStop(1, '#7a2416'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      noise(g, w, h, 1400, ['#6e1e12', '#b84a2a', '#93301c', '#5a1a10', '#c25a30'], 1, 5, .35);
      noise(g, w, h, 160, ['#8a5a2a', '#6a4422', '#b0763a'], 4, 14, .25);   // rust patches
      g.strokeStyle = 'rgba(25,8,4,.85)'; g.lineWidth = 3; for (const y of [h * .33, h * .66]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h * .33); g.moveTo(w * .3, h * .66); g.lineTo(w * .3, h); g.stroke();
      g.strokeStyle = 'rgba(255,170,120,.25)'; g.lineWidth = 1; for (const y of [h * .33 + 2, h * .66 + 2]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      if (stripe) { const y0 = h * .40, y1 = h * .60; g.save(); g.beginPath(); g.rect(0, y0, w, y1 - y0); g.clip(); g.fillStyle = '#e8b818'; g.fillRect(0, y0, w, y1 - y0); g.fillStyle = '#16100a'; for (let x = -h; x < w + h; x += 36) { g.beginPath(); g.moveTo(x, y1); g.lineTo(x + 18, y1); g.lineTo(x + 18 + (y1 - y0), y0); g.lineTo(x + (y1 - y0), y0); g.fill(); }
        noise(g, w, h, 300, ['rgba(60,30,10,1)', 'rgba(120,70,20,1)'], 1, 4, .3); g.restore(); g.strokeStyle = '#2a0e06'; g.lineWidth = 3; g.strokeRect(-2, y0, w + 4, y1 - y0); }
      for (let i = 0; i < 26; i++) { const x = (i % 13 + .5) * w / 13, y = i < 13 ? 10 : h - 10; blob(g, x, y, 4, '#3a1a0e'); blob(g, x - 1, y - 1, 3, '#c9a35a'); blob(g, x - 1.5, y - 1.5, 1.2, '#fff0c0'); }
      for (let i = 0; i < 14; i++) { const x = R() * w; g.strokeStyle = 'rgba(90,50,20,.35)'; g.lineWidth = rr(1, 3); g.beginPath(); g.moveTo(x, rr(0, h * .5)); g.lineTo(x + rr(-4, 4), rr(h * .6, h)); g.stroke(); }   // rust streaks
      noise(g, w, h, 90, ['rgba(20,14,10,1)'], 3, 10, .18); };
    const body = cv(256, 256, (g, w, h) => plate(g, w, h, true));
    const head = cv(256, 256, (g, w, h) => plate(g, w, h, false));
    const face = cv(256, 256, (g, w, h) => { plate(g, w, h, false); g.fillStyle = '#0c0604'; g.beginPath(); g.moveTo(40, 92); g.lineTo(112, 108); g.lineTo(112, 128); g.lineTo(40, 116); g.fill(); g.beginPath(); g.moveTo(216, 92); g.lineTo(144, 108); g.lineTo(144, 128); g.lineTo(216, 116); g.fill();
      g.fillStyle = '#140a06'; g.fillRect(78, 166, 100, 46); g.fillStyle = '#5a5248'; for (let x = 84; x < 176; x += 12) g.fillRect(x, 170, 6, 38); g.strokeStyle = '#e8b818'; g.lineWidth = 4; g.strokeRect(74, 162, 108, 54); });
    CT = {body: ctex(body), head: ctex(head), face: ctex(face)}; return CT; }
  function makeCyborg() {
    const t = creeperTex(), g = new THREE.Group();
    const plate = new THREE.MeshPhongMaterial({map: t.body, shininess: 26, specular: 0x553322}), hm = new THREE.MeshPhongMaterial({map: t.head, shininess: 26, specular: 0x553322}), fm = new THREE.MeshPhongMaterial({map: t.face, shininess: 26, specular: 0x553322});
    const brass = new THREE.MeshPhongMaterial({color: 0xb88a34, shininess: 70, specular: 0xffe0a0}), steel = new THREE.MeshPhongMaterial({color: 0x7c848c, shininess: 80, specular: 0xdddddd}), dark = new THREE.MeshLambertMaterial({color: 0x1e1612});
    const coreM = new THREE.MeshBasicMaterial({color: 0xffc21a}), slitM = new THREE.MeshBasicMaterial({color: 0xffd23a});
    const dA = new THREE.MeshLambertMaterial(), dB = new THREE.MeshLambertMaterial();   // old code pokes mats[0]/[1] maps: keep them harmless
    const M = (geo, m, x, y, z, p) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); (p || g).add(o); return o; };
    const body = M(roundBox(0.54, 0.74, 0.34), plate, 0, 0.92, 0);
    M(new THREE.BoxGeometry(0.6, 0.1, 0.38), steel, 0, 0.58, 0);                       // hip ring
    M(new THREE.CylinderGeometry(0.08, 0.1, 0.12, 10), steel, 0, 1.33, 0);             // neck
    const head = new THREE.Mesh(roundBox(0.5, 0.46, 0.46), [hm, hm, hm, hm, fm, hm]); head.position.y = 1.6; g.add(head);
    for (const s of [-1, 1]) { const sl = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.035, 0.02), slitM); sl.position.set(s * 0.12, 0.04, 0.237); sl.rotation.z = s * 0.2; head.add(sl);
      const an = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 5), steel); an.position.set(s * 0.18, 0.32, -0.08); head.add(an); M(new THREE.SphereGeometry(0.03, 6, 5), coreM, s * 0.18, 0.44, -0.08, head);
      // shoulder pistons and joints
      M(new THREE.SphereGeometry(0.08, 10, 8), steel, s * 0.31, 1.18, 0);
      M(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), steel, s * 0.3, 0.9, 0.12); M(new THREE.CylinderGeometry(0.055, 0.055, 0.26, 8), brass, s * 0.3, 1.0, 0.12);
      M(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), steel, s * 0.3, 0.9, -0.12); M(new THREE.CylinderGeometry(0.055, 0.055, 0.26, 8), brass, s * 0.3, 1.0, -0.12);
      for (const y of [1.18, 0.66]) M(new THREE.SphereGeometry(0.03, 6, 5), brass, s * 0.278, y, 0.15); }
    // glowing core in a brass ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.03, 8, 18), brass); ring.position.set(0, 1.02, 0.175); g.add(ring);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), coreM); core.position.set(0, 1.02, 0.17); g.add(core);
    const glow = glowSprite(0xffb020, 0.7); glow.position.set(0, 1.02, 0.26); g.add(glow);
    const egl = glowSprite(0xffc030, 0.45); egl.position.set(0, 0.04, 0.3); head.add(egl);
    // four piston legs
    const legs = [[-0.15, 0.13], [0.15, 0.13], [0.15, -0.13], [-0.15, -0.13]].map(([x, z]) => { const p = new THREE.Group(); p.position.set(x, 0.56, z); g.add(p);
      M(new THREE.SphereGeometry(0.075, 10, 8), steel, 0, 0, 0, p);
      M(new THREE.CylinderGeometry(0.075, 0.065, 0.24, 10), plate, 0, -0.14, 0, p);
      M(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 8), steel, 0, -0.32, 0, p); M(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 8), brass, 0, -0.27, 0, p);
      M(new THREE.BoxGeometry(0.17, 0.08, 0.24), dark, 0, -0.51, 0.03, p); M(new THREE.BoxGeometry(0.15, 0.04, 0.2), plate, 0, -0.46, 0.03, p); return p; });
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return {g, legs, arms: [], mats: [dA, dB, plate, hm, fm, brass, steel, dark, coreM, slitM], head, core, coreGlow: glow, eyeGlow: egl, body, cyborg: true, speed: 1.25, hp: 5, hitY: 0.9, hitR: 0.55, hostile: true, tall: 2};
  }
  try { const mc0 = makeCreeper; makeCreeper = function () { const o = makeCyborg(); try { const r = mc0.apply(this, arguments); for (const k of ['speed', 'hp', 'hitY', 'hitR', 'hostile', 'tall']) if (r[k] !== undefined) o[k] = r[k]; r.g.traverse(x => x.geometry && x.geometry.dispose()); r.mats.forEach(m => m.dispose()); } catch (_) {} return o; }; } catch (e) { ERR(e); }

  // ---- v1.0.29 siren: a deep, distorted, warbling air-raid wail over a low drone, in a big reverb (Siren Head style); quieter, through the mob voices slider ----
  let shaper = null, irBuf = null;
  function sirenStart(a, dur) { U.siren++; a.sirOn = true; if (!AC || !master) return; try {
    const t = AC.currentTime, end = t + dur + 0.6;
    if (!shaper) { shaper = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; shaper[i] = Math.tanh(x * 3.2); } }
    if (!irBuf) { const n = Math.floor(AC.sampleRate * 2.6); irBuf = AC.createBuffer(2, n, AC.sampleRate); for (let c = 0; c < 2; c++) { const d = irBuf.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); } }
    const out = AC.createGain(); out.gain.value = 0.0001; out.connect(window.creepDst ? creepDst() : window.mobDst ? mobDst() : master);
    const mix = AC.createGain(); mix.gain.value = 1; const dry = AC.createGain(); dry.gain.value = 0.7; mix.connect(dry); dry.connect(out);
    try { const cv = AC.createConvolver(); cv.buffer = irBuf; const wet = AC.createGain(); wet.gain.value = 0.65; mix.connect(cv); cv.connect(wet); wet.connect(out); } catch (_) {}
    const ws = AC.createWaveShaper(); ws.curve = shaper; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 950; lp.Q.value = 1.2; ws.connect(lp);
    const trem = AC.createGain(); trem.gain.value = 0.75; lp.connect(trem); trem.connect(mix);
    const sg = AC.createGain(); sg.gain.value = 0.5; sg.connect(ws);
    const oscs = [];
    const vib = AC.createOscillator(), vg = AC.createGain(); vib.frequency.value = 5.2; vg.gain.value = 7; vib.connect(vg); oscs.push(vib);
    for (const m of [1, 1.012, 0.497]) { const o = AC.createOscillator(); o.type = 'sawtooth'; const og = AC.createGain(); og.gain.value = m < 1 ? 0.5 : 0.45; o.connect(og); og.connect(sg); vg.connect(o.frequency);
      o.frequency.setValueAtTime(92 * m, t); o.frequency.exponentialRampToValueAtTime(255 * m, t + dur * 0.36); o.frequency.linearRampToValueAtTime(238 * m, t + dur * 0.62); o.frequency.exponentialRampToValueAtTime(84 * m, t + dur); oscs.push(o); }
    const wob = AC.createOscillator(), wg = AC.createGain(); wob.frequency.value = 2.6; wg.gain.value = 0.22; wob.connect(wg); wg.connect(trem.gain); oscs.push(wob);
    for (const [f, ty, gv] of [[45, 'sine', 0.55], [55, 'triangle', 0.32]]) { const o = AC.createOscillator(), g = AC.createGain(); o.type = ty; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gv, t + 0.6); g.gain.setValueAtTime(gv, t + dur - 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4); o.connect(g); g.connect(mix); oscs.push(o); }
    sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(0.5, t + 0.5); sg.gain.setValueAtTime(0.5, t + dur - 0.4); sg.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    oscs.forEach(o => { o.start(t); o.stop(end); });
    a.sir = {out, oscs}; } catch (e) { ERR(e); } }
  function sirenVol(a, d) { if (a.sir && AC) try { a.sir.out.gain.setTargetAtTime(0.13 * Math.pow(Math.max(0, 1 - d / 36), 1.5), AC.currentTime, 0.05); } catch (_) {} }
  function sirenStop(a) { a.sirOn = false; if (!a.sir || !AC) return; try { const t = AC.currentTime; a.sir.out.gain.setTargetAtTime(0, t, 0.04); a.sir.oscs.forEach(o => { try { o.stop(t + 0.3); } catch (_) {} }); } catch (_) {} a.sir = null; }

  // ---- the warning overlay ----
  let warn = null; function warnEl() { if (warn) return warn; warn = document.createElement('div'); warn.id = 'c116warn';
    warn.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:60;opacity:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(255,40,0,.55) 100%);display:flex;align-items:flex-start;justify-content:center;font:bold 28px sans-serif;color:#ffd23a;text-shadow:0 0 8px #f00,0 2px 2px #000;padding-top:14vh';
    warn.textContent = '\u26A0 CREEPER \u2014 RUN! \u26A0'; document.body.appendChild(warn); return warn; }
  let warnK = 0;
  const ARM = 4, BOOM_R = 4.5, BOOM_MAX = 13.5;   // base creeper blast was radius 3, max 9 damage: x1.5
  function boom(a) { const p = a.g.position, cx = p.x, cy = p.y + 0.8, cz = p.z, d = Math.hypot(P.x - cx, P.y + 0.9 - cy, P.z - cz);
    const dmg = Math.round(BOOM_MAX * clamp(1 - Math.max(0, d - 1) / 13.5, 0, 1)); U.lastBoom = {d: +d.toFixed(2), dmg}; U.booms++;
    sirenStop(a); const h = hurt, gb = getB; hurt = function (n, c) { if (dmg <= 0) return; invuln = 0; return h.call(this, dmg, c); };
    getB = function (x, y, z) { try { if (typeof placedSet !== 'undefined' && placedSet.has(idx(x, y, z))) return 0; } catch (_) {} return gb(x, y, z); };   // never blow up player-placed blocks
    boomMsg = 'A creeper blew up beside you.';
    try { explode(cx, cy, cz, BOOM_R); } finally { hurt = h; getB = gb; boomMsg = null; }
    removeMob(a); }
  function disarm(a) { a.arm = 0; sirenStop(a); a.speed = a.spd0c || a.speed; a.g.scale.setScalar(1); U.disarm++; for (const m of a.mats) if (m.emissive) m.emissive.setScalar(0); if (a.core) a.core.material.color.setHex(0xffc21a); }
  try { creeperTick = function (a, dt) {
    a.yellow = false; a.lit = false; a.cf = 0;
    if (!a.cyborg) { removeMob(a); return; }   // anything old: gone
    if (dead || !started) { if (a.arm) disarm(a); return; }
    const p = a.g.position, d = Math.hypot(P.x - p.x, P.z - p.z), dy = Math.abs(P.y - p.y);
    a.ct = (a.ct || 0) + dt;
    if (!(a.arm > 0)) {
      if (a.spd0c === undefined) a.spd0c = a.speed;
      if (d < 16 && dy < 6) { try { if (canSee(a, 16)) { a.aggro = 3; a.notice = undefined; } } catch (_) {} }
      if (d < 2.6 && dy < 2.2) { a.arm = ARM; a.speed = 0.6; U.armed++; sirenStart(a, ARM); }
      const k = 0.5 + 0.5 * Math.sin(a.ct * 2.2); if (a.core) a.core.material.color.setRGB(1, 0.62 + 0.2 * k, 0.08); if (a.coreGlow) a.coreGlow.scale.setScalar(0.6 + 0.15 * k);
      if (!isNight && !(window.__c116force) && d > 20) removeMob(a);   // daylight: they slink away
      return; }
    a.arm -= dt; a.aggro = 3; a.speed = 0.6;
    if (d > 7) { disarm(a); return; }
    sirenVol(a, d);
    const e = 1 - a.arm / ARM, f = 0.5 + 0.5 * Math.sin(a.ct * (8 + e * 26)), on = f > 0.5 ? 1 : 0;
    if (a.core) a.core.material.color.setRGB(1, on ? 1 : 0.25, on ? 0.85 : 0.02); if (a.coreGlow) a.coreGlow.scale.setScalar(0.8 + 1.4 * f * (0.5 + e));
    for (const m of a.mats) if (m.emissive) m.emissive.setRGB(0.5 * on * (0.4 + e), 0.22 * on * e, 0);
    a.g.scale.setScalar(1 + 0.07 * f * e);
    if (a.arm <= 0) boom(a); }; } catch (e) { ERR(e); }
  // only at night, two at a time
  try { const sm0 = spawnMob; spawnMob = function (kind) {
    if (kind === 'creeper') { if (!window.__c116force && !isNight) return null; if (countKind('creeper') >= 2) return null; }
    if (kind === 'haggis' && !window.__c116herd && !window.__eggSpot) return null;   // haggis now come in herds (below)
    return sm0.apply(this, arguments); }; } catch (e) { ERR(e); }
  let crT = 3;
  function creeperSpawn(dt) { return; crT -= dt;   // v1.0.28: one creeper spawner now (c157)
    if (crT > 0) return; crT = 6;
    if (!started || paused || (dead && !window.__fdead) || DIM.cur || !isNight || (MODE && MODE.name === 'creative') || caveK > 0.45 || countKind('creeper') >= 2 || R() > 0.45) return;
    for (let t = 0; t < 12; t++) { const an = R() * 6.283, r = 18 + R() * 14, x = Math.floor(P.x + Math.sin(an) * r), z = Math.floor(P.z + Math.cos(an) * r);
      if (x < 3 || z < 3 || x > W - 4 || z > D - 4) continue; const y = solidTop(x, z) + 1, b = getB(x, y - 1, z);
      if (y <= SEA || b === T.WATER || b === T.LAVA || getB(x, y, z) || getB(x, y + 1, z) || Math.abs(y - P.y) > 12) continue;
      window.__eggSpot = [x + .5, y, z + .5, x, z]; try { spawnMob('creeper'); } finally { window.__eggSpot = null; } break; } }

  /* ================= ZOMBIES: zombified people ================= */
  let ZT = null;
  function zTex() { if (ZT) return ZT;
    const skin = (g, w, h) => { g.fillStyle = '#80907a'; g.fillRect(0, 0, w, h); noise(g, w, h, 900, ['#6c7d62', '#9aa494', '#8f9468', '#74806e', '#a3ab9a'], 2, 9, .28);
      noise(g, w, h, 140, ['#4a3a26', '#5a4630', '#3a2e20'], 3, 12, .3);
      g.strokeStyle = 'rgba(48,62,58,.45)'; g.lineWidth = 1.2; for (let i = 0; i < 10; i++) { g.beginPath(); let x = R() * w, y = R() * h; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += rr(-20, 20); y += rr(-20, 20); g.lineTo(x, y); } g.stroke(); }
      for (let i = 0; i < 4; i++) { const x = R() * w, y = R() * h; blob(g, x, y, rr(5, 12), 'rgba(92,12,10,.55)'); g.fillStyle = 'rgba(80,8,8,.5)'; g.fillRect(x - 1.5, y, 3, rr(10, 30)); } };
    const S = cv(256, 256, skin);
    const tears = (g, w, h, y, up) => { g.save(); g.beginPath(); g.moveTo(0, up ? 0 : h); g.lineTo(0, y); for (let x = 0; x <= w; x += 12) g.lineTo(x, y + rr(-14, 14)); g.lineTo(w, up ? 0 : h); g.closePath(); g.clip(); };
    const cloth = (g, w, h, base, dirt) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.globalAlpha = .18; g.strokeStyle = '#000'; g.lineWidth = 1; for (let y = 0; y < h; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } for (let x = 0; x < w; x += 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.globalAlpha = 1;
      noise(g, w, h, 500, dirt, 2, 10, .22); noise(g, w, h, 60, ['#2a2018', '#3a2a1c'], 8, 26, .28);
      for (let i = 0; i < 5; i++) { const x = R() * w, y = R() * h; blob(g, x, y, rr(8, 22), 'rgba(98,10,8,.6)'); blob(g, x + rr(-8, 8), y + rr(-8, 8), rr(4, 10), 'rgba(60,4,4,.55)'); g.fillStyle = 'rgba(80,6,6,.5)'; g.fillRect(x - 2, y, 4, rr(14, 40)); } };
    const holes = (g, n) => { for (let i = 0; i < n; i++) { const x = rr(30, 226), y = rr(30, 200), r = rr(10, 22); g.save(); g.beginPath(); g.moveTo(x + r, y); for (let k = 1; k < 9; k++) { const an = k / 9 * 6.283, rq = r * rr(0.5, 1.2); g.lineTo(x + Math.cos(an) * rq, y + Math.sin(an) * rq); } g.closePath(); g.clip(); g.drawImage(S, 0, 0); g.restore(); g.strokeStyle = 'rgba(40,30,22,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r * 0.9, 0, 6.283); g.stroke(); } };
    const shirt = cv(256, 256, (g, w, h) => { cloth(g, w, h, '#7a8ca0', ['#5e6e80', '#93a2b2', '#6a6458']); holes(g, 3); tears(g, w, h, h * 0.86, false); g.drawImage(S, 0, 0); g.restore(); });
    const arm = cv(256, 256, (g, w, h) => { g.drawImage(S, 0, 0); tears(g, w, h, h * 0.42, true); cloth(g, w, h, '#7a8ca0', ['#5e6e80', '#93a2b2', '#6a6458']); g.restore(); });
    const leg = cv(256, 256, (g, w, h) => { cloth(g, w, h, '#3e3a32', ['#2c2a24', '#4e483c', '#5a4a36']); holes(g, 1); tears(g, w, h, h * 0.76, false); g.drawImage(S, 0, 0); g.restore(); });
    const face = cv(256, 256, (g, w, h) => { g.drawImage(S, 0, 0);
      for (const x of [78, 178]) { const gr = g.createRadialGradient(x, 104, 4, x, 104, 40); gr.addColorStop(0, 'rgba(8,6,4,1)'); gr.addColorStop(.55, 'rgba(20,16,12,.85)'); gr.addColorStop(1, 'rgba(40,40,30,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, 104, 40, 32, 0, 0, 6.283); g.fill(); blob(g, x + rr(-3, 3), 106, 4, 'rgba(210,214,150,.8)'); }
      g.fillStyle = '#1a0e0a'; g.fillRect(118, 138, 8, 12); g.fillRect(132, 138, 8, 12);
      g.fillStyle = '#120806'; g.beginPath(); g.moveTo(70, 178); for (let x = 70; x <= 186; x += 10) g.lineTo(x, 178 + rr(-4, 6)); for (let x = 186; x >= 70; x -= 10) g.lineTo(x, 202 + rr(-5, 6)); g.fill();
      g.fillStyle = '#c4b890'; for (let x = 84; x < 176; x += rr(12, 20)) g.fillRect(x, 178, 7, rr(6, 11));
      g.fillStyle = 'rgba(96,10,8,.7)'; g.fillRect(96, 200, 5, 34); g.fillRect(150, 200, 4, 24); blob(g, 60, 60, 14, 'rgba(70,52,30,.45)'); });
    ZT = {skin: ctex(S), face: ctex(face), shirt: ctex(shirt), arm: ctex(arm), leg: ctex(leg)}; return ZT; }
  const par0 = o => o.parent;
  function zombify(a) { a.c116z = true; const t = zTex(), L = m => new THREE.MeshLambertMaterial({map: m});
    const sk = L(t.skin), fc = L(t.face), sh = L(t.shirt), am = L(t.arm), lg = L(t.leg), mats = [sk, fc, sh, am, lg];
    const old = new Set(); a.g.traverse(o => { if (!o.isMesh || !o.material) return; const ms = [].concat(o.material); if (ms.some(m => m.isMeshBasicMaterial)) { o.material = Array.isArray(o.material) ? o.material.map(m => { const c = m.clone(); c.color.setHex(0x8a9050); return c; }) : (() => { const c = o.material.clone(); c.color.setHex(0x8a9050); return c; })(); return; }
      if (par0(o) === a.head && o !== a.head) { o.material = ms.map(m => { const c = m.clone(); c.color.setHex(0x5a6034); if (c.emissive) c.emissive.setHex(0x1c2008); return c; }); if (o.material.length === 1) o.material = o.material[0]; return; }
      ms.forEach(m => old.add(m));
      let par = o.parent; const inArm = a.arms.includes(par), inLeg = a.legs.includes(par);
      if (o === a.head || par === a.head) o.material = Array.isArray(o.material) ? [sk, sk, sk, sk, fc, sk] : sk;
      else if (inArm) o.material = am; else if (inLeg) o.material = lg; else o.material = sh; });
    a.g.traverse(o => { if (o.isSprite && o.material) { o.material = o.material.clone(); o.material.opacity = 0.22; if (o.material.color) o.material.color.setHex(0xa8b060); } });
    a.mats = mats; }
  try { const mh = makeHumanoid; makeHumanoid = function (kind) { const o = mh.apply(this, arguments); if (kind === 'zombie' && o && o.g) { try { zombify(o); } catch (e) { ERR(e); } } return o; }; } catch (e) { ERR(e); }
  // offsets on top of whatever pose already ran, without drifting
  const off = (o, ax, a, key, v) => { const r = o.rotation, s = a[key + 's']; const base = (s !== undefined && Math.abs(r[ax] - s) < 1e-6) ? a[key + 'b'] : r[ax]; a[key + 'b'] = base; r[ax] = base + v; a[key + 's'] = r[ax]; };
  function zombieMove(a, dt, now) {
    if (!a.c116z && a.arms && a.head) { try { zombify(a); } catch (e) { ERR(e); } }
    const mv = Math.hypot(a.g.position.x - (a.zlx || 0), a.g.position.z - (a.zlz || 0)) > 0.002; a.zlx = a.g.position.x; a.zlz = a.g.position.z;
    a.zl = (a.zl || R() * 9) + dt * (mv ? 3.2 : 0.8); a.tw = (a.tw === undefined ? rr(1, 3) : a.tw) - dt;
    if (a.tw <= 0) { a.tw = rr(1.5, 4.5); a.twK = 0.16; a.twA = (R() < .5 ? -1 : 1) * rr(0.5, 1); } a.twK = Math.max(0, (a.twK || 0) - dt); const tw = a.twK > 0 ? a.twA * Math.sin(a.twK / 0.16 * Math.PI) : 0;
    const limp = Math.sin(a.zl) * (mv ? 0.11 : 0.04);
    off(a.g, 'z', a, 'zgz', limp);
    if (a.head) { off(a.head, 'z', a, 'zhz', 0.32 + 0.1 * Math.sin(now * 0.9 + a.zl * 0.2) + tw * 0.5); off(a.head, 'x', a, 'zhx', 0.18 + tw * 0.2); }
    if (a.arms && a.arms[0]) { off(a.arms[0], 'z', a, 'za0', tw * 0.35 - 0.05); off(a.arms[1], 'x', a, 'za1', 0.14 * Math.sin(a.zl * 0.5) + tw * 0.2); }
  }

  /* ================= SPIDERS: small hairy body, long arched legs, 8 red glowing eyes, max 2 ================= */
  let STX = null;
  function spTex() { if (STX) return STX;
    const hair = (g, w, h, base, n) => { g.fillStyle = base; g.fillRect(0, 0, w, h); noise(g, w, h, 500, ['#120c0a', '#2a1e18', '#1c1410'], 2, 7, .5);
      g.lineCap = 'round'; for (let i = 0; i < n; i++) { const x = R() * w, y = R() * h, an = rr(-0.6, 0.6) + Math.PI / 2, l = rr(4, 11); g.strokeStyle = ['#4a3a30', '#5e4a3c', '#0a0706', '#6b5444', '#2e221c'][(R() * 5) | 0]; g.globalAlpha = rr(.4, .9); g.lineWidth = rr(.6, 1.6); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(an) * l * .5 + rr(-2, 2), y + Math.sin(an) * l * .5, x + Math.cos(an) * l, y + Math.sin(an) * l); g.stroke(); } g.globalAlpha = 1; };
    const body = cv(256, 256, (g, w, h) => { hair(g, w, h, '#1e1612', 2600);
      g.globalAlpha = .75; for (let i = 0; i < 4; i++) { const y = 40 + i * 50; g.fillStyle = '#8a6a50'; g.beginPath(); g.moveTo(w / 2, y + 26); g.lineTo(w / 2 - 70 + i * 12, y); g.lineTo(w / 2 - 56 + i * 12, y - 8); g.lineTo(w / 2, y + 12); g.lineTo(w / 2 + 56 - i * 12, y - 8); g.lineTo(w / 2 + 70 - i * 12, y); g.fill(); }
      g.fillStyle = '#9a1c12'; g.beginPath(); g.moveTo(w / 2, 150); g.lineTo(w / 2 - 14, 180); g.lineTo(w / 2, 210); g.lineTo(w / 2 + 14, 180); g.fill(); g.globalAlpha = 1; hair(g, 0, 0, '#000', 0);
      g.globalAlpha = .5; for (let i = 0; i < 700; i++) { const x = R() * w, y = R() * h; g.strokeStyle = R() < .5 ? '#0a0706' : '#5e4a3c'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(-2, 2), y + rr(4, 9)); g.stroke(); } g.globalAlpha = 1; });
    const plain = cv(256, 256, (g, w, h) => hair(g, w, h, '#1a1310', 2400));
    const leg = cv(256, 64, (g, w, h) => { hair(g, w, h, '#18110e', 900); g.globalAlpha = .55; g.fillStyle = '#6b5040'; for (let x = 20; x < w; x += 58) g.fillRect(x, 0, 12, h); g.globalAlpha = 1; });
    STX = {body: ctex(body), plain: ctex(plain), leg: ctex(leg)}; return STX; }
  function restyleSpider(a) { a.c116s = true; const t = spTex(), rig = a.rig; if (!rig) return;
    const bodyM = new THREE.MeshLambertMaterial({map: t.body}), plainM = new THREE.MeshLambertMaterial({map: t.plain}), legM = new THREE.MeshLambertMaterial({map: t.leg}), legD = new THREE.MeshLambertMaterial({map: t.leg, color: 0x9a8a80});
    const eyeM = new THREE.MeshBasicMaterial({color: 0xff2414});
    const H = 0.44, S = 0.5, sc = o => { o.position.y = H + (o.position.y - H) * S; o.position.z *= S; o.scale.multiplyScalar(S); };
    const kids = rig.children.slice();
    for (const o of kids) { if (o === a.head) { sc(o); continue; } if (o.isMesh) { sc(o); o.material = o.geometry.parameters && o.geometry.parameters.depth > 0.6 ? bodyM : plainM; } }
    a.head.traverse(o => { if (o.isMesh && o.material) { if (o.material.isMeshBasicMaterial) { o.material = eyeM; o.scale.multiplyScalar(1.5); } else o.material = plainM; } });
    for (const s of [-1, 1]) { const gl = glowSprite(0xff2010, 0.4); gl.position.set(s * 0.12, 0.08, 0.4); a.head.add(gl); }
    const gl2 = glowSprite(0xff3018, 0.7); gl2.position.set(0, 0.1, 0.42); a.head.add(gl2);
    const U1 = 0.85, L1 = 1.06;
    for (const L of a.nsLegs) { const hip = L.yaw.parent; hip.position.x = Math.sign(hip.position.x) * 0.1; hip.position.z *= S;
      const ub = L.up.children.find(o => o.isMesh); if (ub) { ub.geometry.dispose(); ub.geometry = new THREE.BoxGeometry(U1, 0.075, 0.075); ub.position.x = U1 / 2; ub.material = legM; }
      L.kn.position.x = U1; const lb = L.kn.children.find(o => o.isMesh); if (lb) { lb.geometry.dispose(); lb.geometry = new THREE.BoxGeometry(L1, 0.055, 0.055); lb.position.x = L1 / 2; lb.material = legD; } }
    a.mats.forEach(m => m.dispose()); a.mats = [bodyM, plainM, legM, legD, eyeM]; }
  function spiderCap() { const L = mobs.filter(a => a.kind === 'nspider' || (a.kind === 'spider')); if (L.length <= 1) return;
    L.sort((a, b) => Math.hypot(b.g.position.x - P.x, b.g.position.z - P.z) - Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z));
    for (const a of L.slice(0, L.length - 1)) { if (a.named && a.giant && L.length) {} removeMob(a); } }

  /* ================= SKELETON: proper side-on archer pose (applied just before the frame is drawn) ================= */
  const OFF = 1.3, V = THREE.Vector3, DOWN = new V(0, -1, 0), ZP = new V(0, 0, 1);
  const _db = new V(), _sl = new V(), _hb = new V(), _a = new V(), _e = new V(), _h = new V(), _sr = new V(), _t = new V(), _q = new THREE.Quaternion();
  function seg(p, from, to) { p.position.copy(from); _t.subVectors(to, from); const l = _t.length() || 1e-3; p.quaternion.setFromUnitVectors(DOWN, _t.divideScalar(l)); p.scale.set(1, l, 1); }
  function archRig(a) { const src = a.arms[0].children.find(o => o.isMesh); const mat = src ? src.material : a.mats[0], th = 0.15;
    const mk = () => { const p = new THREE.Group(), geo = new THREE.BoxGeometry(th, 1, th); geo.translate(0, -0.5, 0); p.add(new THREE.Mesh(geo, mat)); a.g.add(p); return p; };
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), mat);
    a.arc = {ua: mk(), fa: mk(), hand}; a.g.add(hand); return a.arc; }
  function poseArcher(a, dt) {
    const g = a.g, B = a.bs || {ph: 'nock', t: 0}, DRAW = 0.5, NOCK = 0.25;
    const R0 = a.arc || archRig(a); R0.ua.visible = R0.fa.visible = R0.hand.visible = true; a.arms[0].visible = false; a.archOn = true;
    g.rotation.order = 'YXZ'; g.rotation.y = (a.yawVis || 0) - OFF; g.rotation.x = 0; g.rotation.z = 0;
    const p = g.position, d = Math.hypot(P.x - p.x, P.z - p.z), pitch = clamp(Math.atan2(P.y + 1.0 - (p.y + 1.45), Math.max(1, d)), -0.8, 0.8);
    const rel = a.relT > 0 ? a.relT / 0.3 : 0, pp = pitch + rel * 0.18, s = Math.sin(OFF), c = Math.cos(OFF);
    _db.set(s * Math.cos(pp), Math.sin(pp), c * Math.cos(pp));
    // bow arm: dead straight at you, at shoulder height
    const bowArm = a.arms[1]; bowArm.quaternion.setFromUnitVectors(DOWN, _db); bowArm.scale.set(1, 1, 1);
    _sl.copy(bowArm.position); _hb.copy(_sl).addScaledVector(_db, 0.7);
    // v1.0.0: the draw hand lives ON the string - it reaches forward to the string, draws it back to the cheek (in front of the chest), lets go
    const draw = B.ph === 'draw' ? cl01(B.t / DRAW) : 0, de = draw * draw * (3 - 2 * draw), PULL = 0.5;
    let pull = de * PULL; if (B.ph === 'nock') pull = PULL * (1 - cl01(B.t / NOCK)); if (rel > 0) pull = PULL + 0.06 * rel;
    _sr.set(-0.2, 1.48, 0);
    const side = new V(0, 0, 1).addScaledVector(_db, -_db.z).normalize();          // the chest side, square to the arrow
    _h.copy(_hb).addScaledVector(_db, -pull).addScaledVector(side, 0.2); _h.y += 0.02;
    _e.copy(_sr).lerp(_h, 0.5).addScaledVector(_db, -0.16 - pull * 0.35).addScaledVector(side, 0.24); _e.y += 0.06 + pull * 0.08;
    if (rel > 0) { _h.y += 0.03 * rel; _h.addScaledVector(side, 0.05 * rel); }
    seg(R0.ua, _sr, _e); seg(R0.fa, _e, _h); R0.hand.position.copy(_h);
    const bow = a.bow; bow.visible = true; bow.position.copy(_hb); bow.quaternion.setFromUnitVectors(ZP, _db); bow.rotateZ(Math.sin(rel * 30) * 0.06 * rel);
    // string drawn to the fingers (in the bow's own frame)
    const onStr = B.ph === 'draw' && pull > 0.03; _t.subVectors(_h, _hb); _q.copy(bow.quaternion).invert(); _t.applyQuaternion(_q); bow.scale && _t.divide(bow.scale);
    const zz = Math.max(-0.7, Math.min(0, _t.z));
    if (a.str) { if (!a.sv) { a.sv = [0, 1].map(() => { const q = new THREE.Group(), ge = new THREE.BoxGeometry(0.012, 1, 0.012); ge.translate(0, -0.5, 0); q.add(new THREE.Mesh(ge, a.str.material)); bow.add(q); return q; }); }
      a.str.visible = !onStr; a.str.position.z = 0; a.str.scale.y = 1; const tip = new V(_t.x * 0.5, _t.y, zz);
      a.sv.forEach((q, i) => { q.visible = onStr; if (onStr) seg(q, new V(0, i ? 0.34 : -0.34, 0), tip); }); }
    if (a.nock) { a.nock.visible = B.ph === 'draw'; a.nock.scale.z = (0.12 - zz) / 0.5; a.nock.position.z = (zz + 0.12) / 2; }
    // head turned to you over the bow shoulder, wide side-on stance
    if (a.head) { a.head.rotation.order = 'YXZ'; a.head.rotation.set(-pitch * 0.8, OFF, 0); }
    if (a.legs && a.legs[1]) { a.legs[1].rotation.set(-0.06, 0, 0.2); a.legs[0].rotation.set(0.06, 0, -0.18); }
    // where the arrow leaves from, in the facing frame used by the shot
    a.bowHand = {x: _hb.x * c - _hb.z * s, y: _hb.y, z: _hb.x * s + _hb.z * c}; U.poses++; }
  function archEnd(a) { if (!a.archOn) return; a.archOn = false; a.arms[0].visible = true; if (a.sv) a.sv.forEach(q => q.visible = false); if (a.str) a.str.visible = true; if (a.nock) a.nock.scale.z = 1; if (a.arc) { a.arc.ua.visible = a.arc.fa.visible = a.arc.hand.visible = false; } }
  const aiming = a => a.kind === 'skeleton' && a.bow && a.arms && a.arms.length > 1 && !dead && (a.engaged || (window.__c116aim && a.see !== false)) && Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z) < 40;
  let lastR = performance.now();
  try { const rr0 = renderer.render.bind(renderer); renderer.render = function (sc, cam) {
      if (sc === scene) { const now = performance.now(), dt = Math.min(0.1, (now - lastR) / 1000); lastR = now;
        for (const a of mobs) { if (a.kind !== 'skeleton') continue; try { if (aiming(a)) poseArcher(a, dt); else archEnd(a); } catch (e) { ERR(e); } } }
      return rr0(sc, cam); }; } catch (e) { ERR(e); }
  window.__c116pose = a => poseArcher(a, 0.016);

  /* ================= HAGGIS: lighter HD fur, herds of five that follow the leader ================= */
  let HT = null;
  function hTex() { if (HT) return HT;
    const fur = (base, cols, n, light) => cv(512, 512, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); noise(g, w, h, 600, cols, 6, 22, .25);
      g.lineCap = 'round'; for (let i = 0; i < n; i++) { const x = R() * w, y = R() * h, l = rr(7, 18), an = Math.PI / 2 + rr(-0.5, 0.5) + Math.sin(x * 0.02) * 0.3; const t = R();
        g.strokeStyle = t < .45 ? cols[(R() * cols.length) | 0] : t < .75 ? light : 'rgba(90,52,24,.9)'; g.globalAlpha = rr(.35, .85); g.lineWidth = rr(1, 2.4);
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(an) * l * .5 + rr(-3, 3), y + Math.sin(an) * l * .5, x + Math.cos(an) * l, y + Math.sin(an) * l); g.stroke(); }
      g.globalAlpha = 1; const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,240,210,.12)'); gr.addColorStop(1, 'rgba(60,30,10,.12)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const coat = fur('#d2a062', ['#c48e50', '#e0b478', '#b67e44', '#e8c48c'], 9000, '#f4d8a4');
    const belly = fur('#f2e0bc', ['#ead2a8', '#fbeed2', '#dcc196'], 6000, '#fff6e4');
    HT = {coat: ctex(coat), belly: ctex(belly)}; [HT.coat, HT.belly].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; }); return HT; }
  function haggisHD(o) { const t = hTex(); let hc = null; try { hc = tex('haggis_coat'); } catch (_) {}
    o.g.traverse(x => { if (!x.material) return; for (const m of [].concat(x.material)) { if (!m.map || m.map !== hc || m.c116) continue; m.c116 = true; const hx = m.color.getHex();
      if (hx === 0xe0c09a) { m.map = t.belly; m.color.setHex(0xffffff); } else if (hx === 0x8a6a54) { m.map = t.coat; m.color.setHex(0xc8a078); } else { m.map = t.coat; m.color.setHex(0xffffff); } m.needsUpdate = true; } });
    o.g.traverse(x => { if (x.isMesh && x.material && !Array.isArray(x.material) && x.material.color && x.material.color.getHex() === 0x120c08 && !x.c116e) { x.c116e = true; x.scale.multiplyScalar(1.3); } }); }
  try { const mk0 = makeHaggis; makeHaggis = function () { const o = mk0.apply(this, arguments); try { haggisHD(o); } catch (e) { ERR(e); } return o; }; } catch (e) { ERR(e); }
  const herds = []; let hgT = 2, hid = 0; U.herdList = herds;
  const HMAX = 2, HSIZE = 4;   // v1.0.0: groups of four
  function herdSpawn(dt) { hgT -= dt; if (hgT > 0) return; hgT = 7;
    for (let i = herds.length - 1; i >= 0; i--) { herds[i].m = herds[i].m.filter(a => mobs.includes(a)); if (!herds[i].m.length) herds.splice(i, 1); }
    const H = mobs.filter(a => a.kind === 'haggis');
    // loose haggis (old saves, eggs): join a herd nearby or start one
    for (const a of H) { if (a.herd) continue; let best = null; for (const h of herds) { if (h.m.length >= HSIZE) continue; const l = h.m[0].g.position; if (Math.hypot(l.x - a.g.position.x, l.z - a.g.position.z) < 24) { best = h; break; } } if (!best) { best = {id: ++hid, m: [], mode: 'wander', t: 0, ex: rr(30, 90)}; herds.push(best); } best.m.push(a); a.herd = best; }
    // too many: drop the smallest far-away herd
    if (H.length > HMAX * HSIZE + 2) { const far = herds.filter(h => h.m.every(a => Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z) > 30)).sort((a, b) => a.m.length - b.m.length)[0]; if (far) { far.m.forEach(a => removeMob(a)); far.m = []; } }
    if (!started || paused || dead || DIM.cur || herds.filter(h => h.m.length >= 3).length >= HMAX || H.length > HMAX * HSIZE - 3) return;
    // v1.0.0: pick from the heather moor (the old Scots biome) round about you
    // v1.0.28: the heather moor is found a slice at a time (one whole-world scan used to stall a phone for a moment)
    if (U.hw !== world) { U.hw = world; U.heath = []; U.hi = 0; }
    if (U.hi < world.length) { const a0 = U.hi, e0 = Math.min(world.length, a0 + 3000000), sub = world.subarray(a0, e0); let j = sub.indexOf(T.HEATHER); while (j >= 0 && U.heath.length < 20000) { const i = a0 + j; const z = i % D, q = (i - z) / D, y = q % H, x = (q - y) / H; if (y + 1 < H && !solid(x, y + 1, z)) U.heath.push(x * 4096 + z); j = sub.indexOf(T.HEATHER, j + 1); } U.hi = U.heath.length >= 20000 ? world.length : e0; hgT = 0.3; return; }
    const near = U.heath.filter(k => { const hx = k >> 12, hz = k & 4095, d = Math.hypot(hx - P.x, hz - P.z); return d > 22 && d < 60; }); if (!near.length) return;
    for (let t = 0; t < 12; t++) { const k = near[(R() * near.length) | 0], x = k >> 12, z = k & 4095;
      if (x < 4 || z < 4 || x > W - 5 || z > D - 5) continue; const y = solidTop(x, z) + 1; if (y <= SEA || getB(x, y - 1, z) !== T.HEATHER || getB(x, y, z) && getB(x, y, z) !== T.TALLGRASS && getB(x, y, z) !== T.HEATHER || Math.abs(y - P.y) > 14) continue;   // v1.0.0: only on the old Scots heather moor
      const h = {id: ++hid, m: [], mode: 'wander', t: 0, ex: rr(30, 90)};
      for (let k = 0; k < HSIZE; k++) { const sx = x + 0.5, sz = z + 0.5 - k * 1.6; window.__c116herd = true; window.__eggSpot = [sx, solidTop(Math.floor(sx), Math.floor(sz)) + 1, sz, Math.floor(sx), Math.floor(sz)]; let m = null;
        try { m = spawnMob('haggis'); } finally { window.__eggSpot = null; window.__c116herd = false; } if (!m) m = mobs[mobs.length - 1]; if (m && m.kind === 'haggis' && !m.herd) { m.herd = h; h.m.push(m); } }
      if (h.m.length) { herds.push(h); U.herds++; } break; } }
  const SEEDS = () => (IT.WSEEDS !== undefined ? IT.WSEEDS : -1);
  function foodNear(x, y, z) { const fx = Math.floor(x), fz = Math.floor(z); for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) for (let c = -1; c <= 1; c++) { const bb = getB(fx + a, Math.floor(y) + c, fz + b); if (bb === T.TALLGRASS || (bb >= T.WHEAT0 && bb <= T.WHEAT3)) return [fx + a + .5, fz + b + .5, bb, fx + a, Math.floor(y) + c, fz + b]; }
    for (const d of drops) if (d.id === SEEDS() && Math.hypot(d.m.position.x - x, d.m.position.z - z) < 6) return [d.m.position.x, d.m.position.z, 'seed']; return null; }
  function herdPre(dt) {
    for (const h of herds) { const m = h.m = h.m.filter(a => mobs.includes(a)); if (!m.length) continue; const L0 = m[0], lp = L0.g.position;
      // one hit and the whole herd bolts
      const scared = m.some(a => a.flee > 0.2 || a.flash > 0 || a.angry > 0); if (scared) { for (const a of m) if (!(a.angry > 0)) a.flee = Math.max(a.flee || 0, 4); h.mode = 'wander'; h.t = 2; continue; }
      if (L0.spd0h === undefined) L0.spd0h = L0.speed;
      h.ex -= dt; h.t -= dt; L0.timer = 99;
      if (h.mode === 'eat') { L0.moving = false; L0.goal = null; if (h.t <= 0) { h.mode = 'wander'; h.t = rr(1, 3); }
        else if (!h.ate && h.t < h.eatLen * 0.5 && h.food) { h.ate = true; const f = h.food;
          if (f[2] === 'seed') { for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; if (d.id === SEEDS() && m.some(a => Math.hypot(d.m.position.x - a.g.position.x, d.m.position.z - a.g.position.z) < 2.5)) { scene.remove(d.m); drops.splice(i, 1); U.eaten++; } } }
          else if (f[2] === T.TALLGRASS) { const k = idx(f[3], f[4], f[5]); if (!(typeof placedSet !== 'undefined' && placedSet.has(k)) && getB(f[3], f[4], f[5]) === T.TALLGRASS) { setB(f[3], f[4], f[5], T.AIR); U.nibbled++; } } } }
      else if (h.mode === 'explore') { L0.speed = L0.spd0h * 1.8; if (!L0.goal || !L0.moving) { const f = foodNear(lp.x, lp.y, lp.z); h.mode = f ? 'go' : 'wander'; h.food = f; if (f) { L0.goal = [f[0], f[1]]; L0.moving = true; L0.path = null; } h.t = rr(2, 4); } }
      else if (h.mode === 'go') { L0.speed = L0.spd0h * 1.45; if (!L0.goal || !L0.moving || (h.food && Math.hypot(h.food[0] - lp.x, h.food[1] - lp.z) < 1.4)) { L0.goal = null; L0.moving = false; h.mode = 'eat'; h.eatLen = h.t = rr(4, 7); h.ate = false; } }
      else { L0.speed = L0.spd0h * 1.45;
        if (h.ex <= 0) { h.ex = rr(30, 90); const an = R() * 6.283, r = rr(28, 50); let gx = lp.x + Math.sin(an) * r, gz = lp.z + Math.cos(an) * r; gx = clamp(gx, 4, W - 5); gz = clamp(gz, 4, D - 5); L0.goal = [gx, gz]; L0.moving = true; L0.path = null; h.mode = 'explore'; }
        else if ((!L0.goal || !L0.moving) && h.t <= 0) { const f = R() < 0.45 ? foodNear(lp.x, lp.y, lp.z) : null;
          if (f) { h.food = f; h.mode = 'go'; L0.goal = [f[0], f[1]]; L0.moving = true; L0.path = null; h.t = 6; }
          else if (R() < 0.6) { const an = L0.ang + rr(-1.2, 1.2), r = rr(4, 9); L0.goal = [lp.x + Math.sin(an) * r, lp.z + Math.cos(an) * r]; L0.moving = true; L0.path = null; h.t = rr(5, 9); } else h.t = rr(2, 5); } }
      // followers: a little conga line, each one steering for the one in front
      const lead = L0.moving ? L0.speed : 0;
      for (let i = 1; i < m.length; i++) { const a = m[i], f = m[i - 1].g.position, p = a.g.position, dx = f.x - p.x, dz = f.z - p.z, d = Math.hypot(dx, dz);
        if (a.spd0h === undefined) a.spd0h = a.speed; a.timer = 99; a.goal = null;
        if (h.mode === 'eat' && d < 3.6) { a.moving = false; continue; }
        // single file: aim at a point a little behind the one in front, along its own track
        const fy = m[i - 1].yawVis !== undefined ? m[i - 1].yawVis : m[i - 1].ang || 0, tx = f.x - Math.sin(fy) * 0.4 - p.x, tz = f.z - Math.cos(fy) * 0.4 - p.z;
        if (d > 1.7) { a.moving = true; a.ang = Math.atan2(tx, tz); a.speed = Math.max(a.spd0h * 0.9, lead || a.spd0h) * (d > 2.6 ? 1.35 : d < 2.0 ? 0.85 : 1.0); }
        else a.moving = false; } } }
  function herdPost(dt, now) { for (const h of herds) for (const a of h.m) { const rg = a.rig || (a.g.children.length === 1 ? a.g.children[0] : a.body); if (!rg || !rg.position) continue; if (a.hb0 === undefined) a.hb0 = rg.position.y;
      const k = a.moving && a.onGround ? 1 : 0; a.hph = (a.hph || 0) + dt * 26 * k; rg.position.y = a.hb0 + Math.abs(Math.sin(a.hph)) * 0.05 * k; rg.rotation.z = Math.sin(a.hph) * 0.07 * k; if (a.legs) a.legs.forEach((l, j) => { if (k) l.rotation.x = Math.sin(a.hph + (j % 2 ? Math.PI : 0)) * 0.9; }); }
    for (const h of herds) { if (h.mode !== 'eat') continue; for (const a of h.m) if (!a.moving && a.head) { a.head.rotation.x = 0.45 + 0.3 * Math.max(0, Math.sin(now * 11 + a.g.id)); } } }

  /* ================= the frame hook ================= */
  try { const um = updateMobs; updateMobs = function (dt) {
    if (!paused) { try { herdPre(dt); } catch (e) { ERR(e); } }
    const r = um.apply(this, arguments);
    if (paused) return r; const now = performance.now() / 1000;
    try { creeperSpawn(dt); herdSpawn(dt); spiderCap(); } catch (e) { ERR(e); }
    let wk = 0;
    for (const a of mobs) { try {
      if (a.kind === 'creeper' && a.arm > 0) wk = Math.max(wk, 0.35 + 0.65 * (1 - a.arm / ARM));
      if (a.kind === 'zombie' && !a.giant && !a.big && a.arms && Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z) < 48) zombieMove(a, dt, now);
      else if (a.kind === 'nspider' && !a.c116s) restyleSpider(a);
    } catch (e) { ERR(e); } }
    for (const a of mobs.slice()) if (a.kind === 'creeper' && !mobs.includes(a)) {}
    try { herdPost(dt, now); } catch (e) { ERR(e); }
    // creepers removed some other way: hush the siren
    if (wk > 0 || warnK > 0) { warnK = wk; const el = warnEl(); el.style.opacity = wk > 0 ? String(wk * (0.55 + 0.45 * (Math.sin(now * 14) > 0 ? 1 : 0))) : '0'; }
    return r; }; } catch (e) { ERR(e); }
  try { const rm = removeMob; removeMob = function (a) { if (a && a.sirOn) sirenStop(a); return rm.apply(this, arguments); }; } catch (e) { ERR(e); }
  try { const dm = damageMob; damageMob = function (a, dmg, byPlayer) { const r = dm.apply(this, arguments); try { if (a && a.kind === 'haggis' && a.herd) for (const b of a.herd.m) if (b !== a && !(b.angry > 0)) b.flee = Math.max(b.flee || 0, 4.5); } catch (_) {} return r; }; } catch (e) { ERR(e); }
})();
