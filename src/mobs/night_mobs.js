// ===== v1.0.5: NIGHT MOBS - 29 original Glencraft night creatures (night-only spawns, capped, procedural models / textures / sounds) =====
(function () {
  const U = window.__c123 = {spawned: 0, killed: 0, err: null, hits: 0, kinds: {}, shots: 0, strikes: 0};
  const PH = typeof touchMode !== 'undefined' && !!touchMode, TS = PH ? 128 : 256;
  const RNG = s => { let x = (s | 0) % 2147483647 || 7; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
  const TEX = {};
  // ---- procedural HD textures (cached per pattern+colour) ----
  function paint(kind, base, seed, n) {
    const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), r = RNG(seed || 11);
    const col = new THREE.Color(base), hx = l => '#' + col.clone().offsetHSL(0, 0, l).getHexString();
    g.fillStyle = hx(0); g.fillRect(0, 0, n, n);
    const speck = (k, a, w, h) => { for (let i = 0; i < n * k; i++) { g.fillStyle = hx((r() - .5) * a); g.fillRect(r() * n | 0, r() * n | 0, 1 + r() * w | 0, 1 + r() * h | 0); } };
    if (kind === 'cloth') { speck(3, .09, 2, 6); g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 0; y < n; y += 4) g.fillRect(0, y, n, 1); for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(r() * n, 0, 1 + r() * 2, n); } }
    else if (kind === 'bandage') { const h = n / 9; for (let y = -h; y < n + h; y += h) { g.save(); g.translate(0, y); g.rotate((r() - .5) * .18); g.fillStyle = hx((r() - .65) * .14); g.fillRect(-8, 0, n + 16, h - 1); g.fillStyle = 'rgba(70,50,25,.35)'; g.fillRect(-8, h - 2, n + 16, 1); g.restore(); }
      for (let i = 0; i < n / 2; i++) { g.fillStyle = 'rgba(95,70,30,' + (r() * .28).toFixed(2) + ')'; g.fillRect(r() * n, r() * n, 2 + r() * 5, 1 + r() * 3); } }
    else if (kind === 'fur') { for (let i = 0; i < n * 7; i++) { const x = r() * n, y = r() * n; g.strokeStyle = hx((r() - .5) * .24); g.lineWidth = 1 + (n > 64 ? r() : 0); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 3, y + 2 + r() * 6); g.stroke(); } }
    else if (kind === 'metal') { const gr = g.createLinearGradient(0, 0, 0, n); gr.addColorStop(0, hx(.13)); gr.addColorStop(.5, hx(0)); gr.addColorStop(1, hx(-.12)); g.fillStyle = gr; g.fillRect(0, 0, n, n);
      for (let i = 0; i < n * 2; i++) { g.fillStyle = 'rgba(255,255,255,' + (r() * .07).toFixed(3) + ')'; g.fillRect(r() * n, r() * n, 1 + r() * 9, 1); }
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, n * .48, n, Math.max(1, n / 40));
      for (let i = 0; i < 10; i++) { const x = r() * n, y = r() * n, s = n / 40 + 1; g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.arc(x - s * .3, y - s * .3, s * .5, 0, 7); g.fill(); }
      for (let i = 0; i < n / 3; i++) { g.fillStyle = 'rgba(120,60,20,' + (r() * .22).toFixed(2) + ')'; g.fillRect(r() * n, r() * n, 2 + r() * 6, 2 + r() * 6); } }
    else if (kind === 'skin') { speck(4, .1, 3, 3); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(0,0,0,.1)'; g.beginPath(); g.arc(r() * n, r() * n, 2 + r() * n / 10, 0, 7); g.fill(); } }
    else if (kind === 'bone') { speck(3, .1, 3, 1); g.strokeStyle = 'rgba(80,60,40,.4)'; for (let i = 0; i < 7; i++) { g.beginPath(); let x = r() * n, y = r() * n; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .5) * 10; y += r() * 8; g.lineTo(x, y); } g.stroke(); } }
    else if (kind === 'slime') { for (let i = 0; i < n / 2; i++) { const x = r() * n, y = r() * n, s = 2 + r() * n / 7, gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, hx(.16)); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); }
      for (let i = 0; i < 9; i++) { g.fillStyle = hx(-.16); g.fillRect(r() * n, r() * n * .5, 2 + r() * 3, n * .2 + r() * n * .5); } }
    else if (kind === 'weed') { speck(4, .1, 2, 2); for (let i = 0; i < 16; i++) { g.strokeStyle = ['#2f5a26', '#4c7a2c', '#5e6b22'][i % 3]; g.lineWidth = 1 + r() * n / 32; g.beginPath(); let x = r() * n; g.moveTo(x, 0); for (let y = 0; y <= n; y += n / 8) { x += (r() - .5) * 7; g.lineTo(x, y); } g.stroke(); } }
    else if (kind === 'wood') { for (let y = 0; y < n; y++) { g.fillStyle = hx(Math.sin(y * .45 + r()) * .05); g.fillRect(0, y, n, 1); } g.strokeStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, r() * n); g.bezierCurveTo(n / 3, r() * n, 2 * n / 3, r() * n, n, r() * n); g.stroke(); } }
    else if (kind === 'rock') { speck(5, .16, 4, 4); g.strokeStyle = 'rgba(0,0,0,.4)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(r() * n, r() * n); g.lineTo(r() * n, r() * n); g.stroke(); } }
    else if (kind === 'stars') { const gr = g.createLinearGradient(0, 0, n, n); gr.addColorStop(0, hx(.06)); gr.addColorStop(1, hx(-.1)); g.fillStyle = gr; g.fillRect(0, 0, n, n); for (let i = 0; i < n / 2; i++) { g.fillStyle = 'rgba(255,255,255,' + (.4 + r() * .6).toFixed(2) + ')'; const s = r() < .1 ? 2 : 1; g.fillRect(r() * n, r() * n, s, s); } }
    else if (kind === 'wisp') { for (let i = 0; i < 30; i++) { const x = r() * n, y = r() * n, s = n / 5 + r() * n / 4, gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, hx(.22)); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, n, n); } g.fillStyle = 'rgba(255,255,255,.08)'; for (let y = 0; y < n; y += 3) g.fillRect(0, y, n, 1); }
    else if (kind === 'leather') { speck(3, .12, 3, 2); g.strokeStyle = 'rgba(0,0,0,.35)'; g.setLineDash([2, 2]); g.strokeRect(2, 2, n - 4, n - 4); g.setLineDash([]); }
    else if (kind === 'stripes') { speck(2, .08, 2, 2); for (let y = 0; y < n; y += n / 8) { g.fillStyle = 'rgba(240,235,220,.85)'; g.fillRect(0, y, n, n / 16); } speck(1, .1, 3, 3); for (let i = 0; i < n / 4; i++) { g.fillStyle = 'rgba(40,60,40,' + (r() * .35).toFixed(2) + ')'; g.fillRect(r() * n, r() * n, 2 + r() * 8, 2 + r() * 8); } }
    else if (kind === 'eyeball') { const gr = g.createRadialGradient(n * .5, n * .5, n * .05, n * .5, n * .5, n * .7); gr.addColorStop(0, '#fbf6ee'); gr.addColorStop(.7, '#eadccf'); gr.addColorStop(1, '#c99a8a'); g.fillStyle = gr; g.fillRect(0, 0, n, n);
      g.strokeStyle = 'rgba(170,30,30,.55)'; for (let i = 0; i < 26; i++) { g.lineWidth = .6 + r() * 1.4; g.beginPath(); let a = r() * 6.28, x = n / 2 + Math.cos(a) * n * .5, y = n / 2 + Math.sin(a) * n * .5; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (n / 2 - x) * .16 + (r() - .5) * 8; y += (n / 2 - y) * .16 + (r() - .5) * 8; g.lineTo(x, y); } g.stroke(); }
      const ir = g.createRadialGradient(n * .5, n * .5, 0, n * .5, n * .5, n * .2); ir.addColorStop(0, '#000'); ir.addColorStop(.4, '#000'); ir.addColorStop(.45, hx(.1)); ir.addColorStop(.9, hx(-.1)); ir.addColorStop(1, '#201010'); g.fillStyle = ir; g.beginPath(); g.arc(n * .5, n * .5, n * .2, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 30; i++) { const a = r() * 6.28; g.beginPath(); g.moveTo(n / 2 + Math.cos(a) * n * .09, n / 2 + Math.sin(a) * n * .09); g.lineTo(n / 2 + Math.cos(a) * n * .19, n / 2 + Math.sin(a) * n * .19); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(n * .44, n * .43, n * .035, 0, 7); g.fill(); }
    else if (kind === 'scales') { for (let y = 0; y < n; y += n / 12) for (let x = (y / (n / 12)) % 2 ? n / 24 : 0; x < n; x += n / 12) { const gr = g.createRadialGradient(x, y, 0, x, y, n / 14); gr.addColorStop(0, hx(.12)); gr.addColorStop(1, hx(-.12)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, n / 18, 0, Math.PI); g.fill(); } speck(1, .08, 2, 2); }
    else speck(2, .06, 2, 2);
    return c;
  }
  function tex(kind, base, seed) { const k = kind + ':' + base + ':' + (seed || 0); if (TEX[k]) return TEX[k];
    const t = new THREE.CanvasTexture(paint(kind, base, seed, TS)); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
    return TEX[k] = t; }
  // a face texture: base pattern + painted features (cached per mob kind)
  function faceTex(key, kind, base, fn) { const k = 'face:' + key; if (TEX[k]) return TEX[k];
    const c = paint(kind, base, key.length * 7 + 3, TS), g = c.getContext('2d'); try { fn(g, TS); } catch (_) {}
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; return TEX[k] = t; }
  U.TEX = TEX; U.paint = paint; U.tex = tex; U.faceTex = faceTex; U.PH = PH;
  // face painting helpers (coords 0..1)
  const F = {
    eye(g, n, x, y, r, col, pupil) { g.fillStyle = col || '#fff'; g.beginPath(); g.ellipse(x * n, y * n, r * n, r * n * .9, 0, 0, 7); g.fill(); if (pupil) { g.fillStyle = pupil; g.beginPath(); g.arc(x * n, y * n, r * n * .45, 0, 7); g.fill(); } },
    glow(g, n, x, y, r, col) { const gr = g.createRadialGradient(x * n, y * n, 0, x * n, y * n, r * n * 2); gr.addColorStop(0, '#fff'); gr.addColorStop(.3, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x * n - r * n * 2, y * n - r * n * 2, r * n * 4, r * n * 4); },
    hole(g, n, x, y, w, h, col) { g.fillStyle = col || '#0a0606'; g.beginPath(); g.ellipse(x * n, y * n, w * n, h * n, 0, 0, 7); g.fill(); },
    teeth(g, n, x, y, w, h, k, col) { g.fillStyle = '#120808'; g.fillRect((x - w / 2) * n, (y - h / 2) * n, w * n, h * n); g.fillStyle = col || '#efe6c8'; const tw = w / k; for (let i = 0; i < k; i++) { g.beginPath(); g.moveTo((x - w / 2 + i * tw) * n, (y - h / 2) * n); g.lineTo((x - w / 2 + (i + 1) * tw) * n, (y - h / 2) * n); g.lineTo((x - w / 2 + (i + .5) * tw) * n, (y - h / 2 + h * .55) * n); g.fill();
      g.beginPath(); g.moveTo((x - w / 2 + i * tw) * n, (y + h / 2) * n); g.lineTo((x - w / 2 + (i + 1) * tw) * n, (y + h / 2) * n); g.lineTo((x - w / 2 + (i + .5) * tw) * n, (y + h / 2 - h * .5) * n); g.fill(); } },
    brow(g, n, x0, y0, x1, y1, w, col) { g.strokeStyle = col || '#1a1010'; g.lineWidth = w * n; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0 * n, y0 * n); g.lineTo(x1 * n, y1 * n); g.stroke(); },
    rect(g, n, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x * n, y * n, w * n, h * n); },
  };
  U.F = F;
  // ---- model kit ----
  function kit(mats) {
    const M = (base, pat, o) => { o = o || {}; let m;
      if (o.basic) m = new THREE.MeshBasicMaterial({color: base, transparent: !!o.op, opacity: o.op || 1, depthWrite: !o.op, side: o.ds ? THREE.DoubleSide : THREE.FrontSide});
      else { m = new THREE.MeshLambertMaterial({color: o.tint || 0xffffff, map: pat ? tex(pat, base, o.seed) : null, transparent: !!o.op, opacity: o.op || 1, depthWrite: !o.op, side: o.ds ? THREE.DoubleSide : THREE.FrontSide});
        if (!pat) m.color.set(base); m.emissive.set(o.em || 0x1c1c22); m.userData.e0 = m.emissive.clone(); }
      mats.push(m); return m; };
    const face = (key, pat, base, fn, o) => { o = o || {}; const m = new THREE.MeshLambertMaterial({map: faceTex(key, pat, base, fn), transparent: !!o.op, opacity: o.op || 1}); if (o.em) m.emissive.set(o.em); m.userData.e0 = m.emissive.clone(); mats.push(m); return m; };
    const box = (w, h, d, m, x, y, z, p) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x || 0, y || 0, z || 0); if (p) p.add(b); return b; };
    const sph = (r, m, x, y, z, p, sx, sy, sz, seg) => { const s = seg || (PH ? 10 : 14), b = new THREE.Mesh(new THREE.SphereGeometry(r, s, Math.max(6, s * 0.7 | 0)), m); b.position.set(x || 0, y || 0, z || 0); if (sx) b.scale.set(sx, sy || sx, sz || sx); if (p) p.add(b); return b; };
    const cyl = (rt, rb, h, m, x, y, z, p, seg, open) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || (PH ? 8 : 12), 1, !!open), m); b.position.set(x || 0, y || 0, z || 0); if (p) p.add(b); return b; };
    const cone = (r, h, m, x, y, z, p, seg) => { const b = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || (PH ? 6 : 10)), m); b.position.set(x || 0, y || 0, z || 0); if (p) p.add(b); return b; };
    const grp = (x, y, z, p) => { const q = new THREE.Group(); q.position.set(x || 0, y || 0, z || 0); if (p) p.add(q); return q; };
    // head box with a painted front face (+z)
    const head = (w, h, d, side, front, x, y, z, p) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, side, side, front, side]); b.position.set(x || 0, y || 0, z || 0); if (p) p.add(b); return b; };
    return {M, face, box, sph, cyl, cone, grp, head};
  }
  U.kit = kit;
  // standard humanoid rig: legs pivot at hips, arms at shoulders, head group on the neck. Faces +z.
  // o: {s, legs:[col,pat], body:[col,pat], arm:[col,pat], hand:[col,pat], headSide, headFront, hw,hh,hd, bw, bh, bd, robe, hunch, armL, noLegs}
  function humanoid(K, o) {
    const g = new THREE.Group(), rig = K.grp(0, 0, 0, g), P = {g, rig};
    const legH = o.noLegs ? 0 : (o.legH || 0.72), bw = o.bw || 0.56, bh = o.bh || 0.74, bd = o.bd || 0.32;
    const mL = K.M(o.legs[0], o.legs[1]), mB = K.M(o.body[0], o.body[1]), mA = K.M((o.arm || o.body)[0], (o.arm || o.body)[1]), mH = o.hand ? K.M(o.hand[0], o.hand[1]) : mA;
    P.mL = mL; P.mB = mB; P.mA = mA;
    if (!o.noLegs) { P.ll = K.grp(-bw * 0.25, legH, 0, rig); P.rl = K.grp(bw * 0.25, legH, 0, rig);
      for (const L of [P.ll, P.rl]) { K.box(bw * 0.44, legH, bd * 0.9, mL, 0, -legH / 2, 0, L); if (o.boots) K.box(bw * 0.48, 0.16, bd * 1.05, K.M(o.boots, 'leather'), 0, -legH + 0.08, 0.02, L); } }
    else if (o.robe) { const rb = K.cyl(bw * 0.42, bw * 0.95, o.robeH || 0.9, K.M(o.robe[0], o.robe[1], {ds: true}), 0, (o.robeH || 0.9) / 2 + (o.robeY || 0), 0, rig, PH ? 8 : 12, true); P.robe = rb; }
    const by = (o.noLegs ? (o.robeY || 0) + (o.robeH || 0.9) * 0.85 : legH);
    P.body = K.grp(0, by, 0, rig); K.box(bw, bh, bd, mB, 0, bh / 2, 0, P.body);
    if (o.hunch) P.body.rotation.x = o.hunch;
    const sy = bh - 0.08, aL = o.armL || 0.7, aw = o.aw || bw * 0.34;
    P.la = K.grp(-bw / 2 - aw / 2, sy, 0, P.body); P.ra = K.grp(bw / 2 + aw / 2, sy, 0, P.body);
    for (const A of [P.la, P.ra]) { K.box(aw, aL * 0.78, aw, mA, 0, -aL * 0.39, 0, A); K.box(aw * 1.04, aL * 0.24, aw * 1.04, mH, 0, -aL * 0.88, 0, A); A.hand = K.grp(0, -aL, 0, A); }
    const hw = o.hw || 0.5, hh = o.hh || 0.5, hd = o.hd || 0.5;
    P.head = K.grp(0, bh, 0, P.body);
    if (o.headSide) P.headM = K.head(hw, hh, hd, o.headSide, o.headFront || o.headSide, 0, hh / 2 + 0.02, 0, P.head);
    P.top = bh + hh + 0.02 + by; P.hw = hw; P.hh = hh; P.hd = hd; P.bw = bw; P.bh = bh; P.bd = bd; P.legH = legH;
    return P;
  }
  U.humanoid = humanoid;
  // ---- PLACEHOLDER SKINS: the user's friend's pictures (placeholders/nightmobs/NN.jpg). Set to false (or delete the folder) to fall back to plain procedural faces. ----
  const NM_PLACEHOLDERS = false;   // v1.0.6: real models are the default now
  U.placeholders = NM_PLACEHOLDERS;
  const PIC = {}, ASP = {};
  function pic(id) { if (!NM_PLACEHOLDERS) return null; if (PIC[id]) return PIC[id];
    const t = new THREE.TextureLoader().load('placeholders/nightmobs/' + id + '.jpg', tt => { try { ASP[id] = tt.image.width / tt.image.height; } catch (_) {} }, undefined, () => { PIC[id].failed = true; });
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return PIC[id] = t; }
  U.pic = pic; for (let i = 1; i <= 29; i++) try { pic(String(i).padStart(2, '0')); } catch (_) {}
  // ---- the 29 (original names; behaviours in c.js) ----
  // body: man | big | robe | sheet | orb | blob | dog | cloud ; move: walk | float | swim | hop ; place: land | water | shore | cave
  const NMD = [
    ['01', 'Rivet Reiver', {body: 'man',   c: [0x8a8f96, 'metal'], move: 'walk',  spd: 2.2, hp: 30, ai: 'shield',   dmg: 3, homes: ['human','mossy'],  snd: 'clank',   drop: [[54, 1, 2]]}],
    ['02', 'Dreich Gnawer', {body: 'robe',  c: [0x1c1a1f, 'cloth'], move: 'walk',  spd: 3.6, hp: 16, ai: 'lunge',    dmg: 2, homes: ['alder'],  snd: 'shriek',  drop: [[320, 1, 2]]}],
    ['03', 'Govan Gearheid', {body: 'man',   c: [0x9aa3ab, 'metal'], move: 'walk',  spd: 2.0, hp: 20, ai: 'zap',      dmg: 2, homes: ['human','mossy','oak'],  snd: 'beep',    drop: [[118, 1, 3], [54, 0, 1]]}],
    ['04', 'Tangle Tam', {body: 'man',   c: [0x4f6a4a, 'weed'],  move: 'swim',  spd: 2.6, hp: 18, ai: 'drag',     dmg: 2, homes: ['ocean'], snd: 'gurgle',  drop: [[55, 1, 2]]}],
    ['05', 'Merry Mischanter', {body: 'robe',  c: [0x6c5d8a, 'cloth'], move: 'float', spd: 3.0, hp: 14, ai: 'blink',    dmg: 2, homes: ['oak','juniper','rowan'],  snd: 'cackle',  drop: [[321, 0, 1]]}],
    ['06', 'Cowl Creepie', {body: 'robe',  c: [0x2a2a30, 'cloth'], move: 'float', spd: 3.4, hp: 10, ai: 'orbit',    dmg: 2, homes: ['hawthorn','birch','rowan','yew'],  snd: 'whisper', drop: [[11, 1, 2]], group: 2}],
    ['07', 'Snaw Brute', {body: 'big',   c: [0xd8d6d0, 'fur'],   move: 'walk',  spd: 3.0, hp: 26, ai: 'charge',   dmg: 3, homes: ['mountain','snow'],  snd: 'growl',   drop: [[32, 1, 3]]}],
    ['08', 'Timmer Tiki', {body: 'big',   c: [0x7a5a3a, 'wood'],  move: 'walk',  spd: 2.4, hp: 26, ai: 'stomp',    dmg: 3, homes: ['yew','rowan','hawthorn'],  snd: 'drum',    drop: [[118, 1, 2], [123, 0, 1, 0.06]]}],
    ['09', 'Barrow Bandager', {body: 'man',   c: [0xcdbf9c, 'bandage'], move: 'walk', spd: 1.9, hp: 22, ai: 'slowgrab', dmg: 2, homes: ['cave'], snd: 'moan',    drop: [[32, 1, 2], [320, 0, 1]]}],
    ['10', 'Linen Ghaist', {body: 'sheet', c: [0xf2f2f2, 'cloth'], move: 'float', spd: 4.0, hp: 8,  ai: 'scare',    dmg: 1, homes: ['juniper','birch'],  snd: 'moan',    drop: [[32, 1, 2]], phase: 1}],
    ['11', 'Moss Hag Morag', {body: 'robe',  c: [0x2d3a2a, 'cloth'], move: 'walk',  spd: 2.2, hp: 16, ai: 'hex',      dmg: 2, homes: ['alder','shore'],  snd: 'cackle',  drop: [[118, 1, 2]]}],
    ['12', 'Admiral Skelp', {body: 'man',   c: [0x2b2b3a, 'cloth'], move: 'walk',  spd: 2.6, hp: 24, ai: 'parry',    dmg: 3, homes: ['beach'], snd: 'growl',   drop: [[171, 1, 3], [83, 0, 2]]}],
    ['13', 'Sneerin\' Swaddle', {body: 'man',   c: [0xd9cfb2, 'bandage'], move: 'walk', spd: 3.0, hp: 18, ai: 'leap',     dmg: 2, homes: ['cave'], snd: 'cackle',  drop: [[32, 1, 2], [171, 0, 1]]}],
    ['14', 'Lang Hat Lurker', {body: 'robe', c: [0x101014, 'cloth'], move: 'walk',  spd: 6.5, hp: 14, ai: 'stalk',    dmg: 3, homes: ['alder','pine'],  snd: 'whisper', drop: [[53, 1, 2]]}],
    ['15', 'Crag Gruff', {body: 'big',   c: [0x8c8a7e, 'skin'],  move: 'walk',  spd: 1.8, hp: 30, ai: 'rock',     dmg: 3, homes: ['mountain','pine'],  snd: 'growl',   drop: [[54, 1, 2]]}],
    ['16', 'Glower Orb', {body: 'orb',   c: [0x3a2a2a, 'skin'],  move: 'float', spd: 2.4, hp: 16, ai: 'beam',     dmg: 3, homes: ['cave'],  snd: 'zap',     drop: [[118, 1, 2]], hover: 2.2}],
    ['17', 'Anvil Heid', {body: 'big',   c: [0x4a4d55, 'metal'], move: 'walk',  spd: 2.0, hp: 28, ai: 'armour',   dmg: 3, homes: ['black'],  snd: 'clank',   drop: [[80, 1, 2]]}],
    ['18', 'Sludge Sooker', {body: 'blob',  c: [0x6f8a5a, 'slime'], move: 'hop',   spd: 2.6, hp: 14, ai: 'split',    dmg: 2, homes: ['shore'],  snd: 'gurgle',  drop: [[11, 0, 1]]}],
    ['19', 'Thistle Phantom', {body: 'robe',  c: [0x9a7ad8, 'wisp'],  move: 'float', spd: 2.8, hp: 16, ai: 'homing',   dmg: 2, homes: ['hawthorn','birch','blackthorn'],  snd: 'chime',   drop: [[321, 1, 1]], glow: 0x40206a, phase: 1}],
    ['20', 'Mist Moaner', {body: 'sheet', c: [0xd0d6dc, 'wisp'],  move: 'float', spd: 2.6, hp: 12, ai: 'haze',     dmg: 2, homes: ['yew','mossy','pine','beach'],  snd: 'whisper', drop: [[321, 0, 1]], phase: 1}],
    ['21', 'Pest Corbie', {body: 'man',   c: [0x5a5f58, 'metal'], move: 'walk',  spd: 2.4, hp: 24, ai: 'aura',     dmg: 2, homes: ['black','blackthorn'],  snd: 'clank',   drop: [[54, 1, 2], [320, 0, 1]]}],
    ['22', 'Thunner Cloudie', {body: 'cloud', c: [0xb8c4d8, 'wisp'],  move: 'float', spd: 2.2, hp: 18, ai: 'storm',    dmg: 3, homes: ['mountain','snow'],  snd: 'thunder', drop: [[118, 1, 3]], hover: 5, glow: 0x203050}],
    ['23', 'Glaikit Goggler', {body: 'orb',   c: [0x6a7a80, 'metal'], move: 'swim',  spd: 2.2, hp: 18, ai: 'bubble',   dmg: 2, homes: ['ocean'], snd: 'gurgle',  drop: [[55, 1, 2]]}],
    ['24', 'Skull Seer', {body: 'robe',  c: [0x5a3a2a, 'cloth'], move: 'walk',  spd: 2.2, hp: 20, ai: 'summon',   dmg: 2, homes: ['black','blackthorn'],  snd: 'drum',    drop: [[171, 1, 3]]}],
    ['25', 'Puddock Gob', {body: 'man',   c: [0x6a7a5a, 'skin'],  move: 'walk',  spd: 3.2, hp: 16, ai: 'hop',      dmg: 2, homes: ['shore','beach'], snd: 'croak',   drop: [[320, 1, 2]]}],
    ['26', 'Sunken Swabbies', {body: 'man',   c: [0x4a5a4a, 'cloth'], move: 'swim',  spd: 2.4, hp: 8,  ai: 'crew',     dmg: 2, homes: ['ocean'], snd: 'moan',    drop: [[320, 0, 1], [83, 0, 1]], group: 3}],
    ['27', 'Cleek Jack', {body: 'robe',  c: [0x9fb4bf, 'wisp'],  move: 'swim', spd: 2.6, hp: 16, ai: 'hook',     dmg: 2, homes: ['ocean'], snd: 'moan',    drop: [[54, 1, 1], [321, 0, 1]], phase: 1}],
    ['28', 'Comet Collie', {body: 'dog',   c: [0x2a3a6a, 'stars'], move: 'float', spd: 5.5, hp: 14, ai: 'circle',   dmg: 2, homes: ['oak','juniper','snow'],  snd: 'howl',    drop: [[171, 1, 2]], hover: 0.5, glow: 0x203a70}],
    ['29', 'Greetin\' Bairn', {body: 'sheet', c: [0xe6eef2, 'wisp'],  move: 'float', spd: 0,   hp: 12, ai: 'weep',     dmg: 2, homes: ['shore','beach'],  snd: 'shriek',  drop: [[321, 1, 1]], phase: 1}],
    ['30', 'Crackle Conger', {body: 'eel',   c: [0x2a4a3a, 'scales'], move: 'swim', spd: 3.2, hp: 14, ai: 'eel',    dmg: 2, homes: ['ocean'], snd: 'zap',     drop: [[118, 1, 2]], flat: 1}],
    ['31', 'Moonlit Selkie', {body: 'robe',  c: [0x8a96a0, 'fur'],    move: 'swim', spd: 2.4, hp: 12, ai: 'lure',   dmg: 2, homes: ['ocean'], snd: 'whisper', drop: [[32, 1, 2], [321, 0, 1]], phase: 1, flat: 1}],
    ['32', 'Wraith Jeelie', {body: 'blob',  c: [0xb080ff, 'wisp'],    move: 'swim', spd: 1.4, hp: 8,  ai: 'sting',  dmg: 1, homes: ['ocean'], snd: 'chime',   drop: [[321, 1, 1]], flat: 1, glow: 0x6030a0}],
    ['33', 'Deep Beastie', {body: 'big',   c: [0x3a5a48, 'scales'],   move: 'swim', spd: 2.8, hp: 30, ai: 'ram',    dmg: 3, homes: ['ocean'], snd: 'growl',   drop: [[171, 1, 3], [123, 0, 1]], flat: 1}],
    ['34', 'Drookit Kelpie', {body: 'dog',   c: [0x22343a, 'weed'],   move: 'swim', spd: 3.4, hp: 20, ai: 'snatch', dmg: 2, homes: ['ocean'], snd: 'howl',    drop: [[32, 1, 1], [55, 1, 2]], flat: 1}],
  ];
  const DEF = {}; for (const [id, name, o] of NMD) DEF['nm' + id] = Object.assign({id, name, kind: 'nm' + id}, o);
  // minions (not counted in the 29): bone shaman's skull wisps and the drip blob's droplets
  DEF.nmwisp = {id: '24', name: 'Skull Wisp', kind: 'nmwisp', body: 'orb', c: [0xe8e0c8, 'bone'], move: 'float', spd: 4, hp: 4, ai: 'chase', dmg: 2, snd: 'chime', drop: [], minion: 1, small: 0.45, phase: 1, hover: 1.2};
  DEF.nmdrop = {id: '18', name: 'Droplet', kind: 'nmdrop', body: 'blob', c: [0x6f8a5a, 'slime'], move: 'hop', spd: 3, hp: 4, ai: 'chase', dmg: 2, snd: 'gurgle', drop: [], minion: 1, small: 0.5};
  DEF.nm08.off = 1;   // v1.0.72: Timmer Tiki (the knocking totem) is switched off - code kept, never spawns
  U.DEF = DEF; U.LIST = NMD.map(d => 'nm' + d[0]);
  try { for (const k in DEF) MOB_HP[k] = DEF[k].hp; } catch (_) {}
  // ---- build: real models (v1.0.6) or, with NM_PLACEHOLDERS on, the old picture boards ----
  function build(def) {
    if (NM_PLACEHOLDERS || !MODELS[def.kind]) return buildPic(def);
    const mats = [], K = kit(mats), S = def.small || 1, g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
    const m = MODELS[def.kind](K, def), H = m.H || {};
    rig.add(m.root);
    if (def.move === 'swim' && !def.flat) { rig.position.y = 0.9; m.root.position.y -= 0.9; }   // swimmers pivot at the waist
    if (def.phase) for (const q of mats) if (!q.transparent) { q.transparent = true; q.opacity = 0.85; q.depthWrite = true; }
    const lod = []; g.traverse(o => { if (o.isMesh) { o.castShadow = !PH; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); if (o.geometry.boundingSphere.radius < 0.13) lod.push(o); } });
    g.scale.setScalar(S);
    const top = (m.top || 2) * S;
    return {g, rig, mats, legs: [], arms: [], speed: def.spd, hp: def.hp, maxHp: def.hp, hitY: top * 0.5, hitR: (m.r || 0.6) * S, tall: Math.max(1, Math.ceil(top)), hostile: true, topH: top,
      la: H.la || m.la, ra: H.ra || m.ra, ll: H.ll || m.ll, rl: H.rl || m.rl, head: H.head || m.head, body: H.body || m.body, legs4: m.legs4, manim: m.anim, lod, model: m};
  }
  // ---- cheap 3D bodies with the picture on the front ----
  function buildPic(def) {
    const mats = [], K = kit(mats), S = def.small || 1, c = def.c, g = new THREE.Group(), rig = K.grp(0, 0, 0, g);
    const t0 = pic(def.id), t = t0 && !t0.failed ? t0 : null, asp = ASP[def.id] || 0.9;
    const front = t ? (() => { const m = new THREE.MeshLambertMaterial({map: t, emissiveMap: t}); m.emissive.set(def.glow || 0x8a8a8a); m.userData.e0 = m.emissive.clone(); mats.push(m); return m; })() : K.face(def.kind, c[1], c[0], (q, n) => { F.glow(q, n, .32, .42, .07, '#ff4020'); F.glow(q, n, .68, .42, .07, '#ff4020'); F.teeth(q, n, .5, .72, .5, .14, 6); }, {em: def.glow});
    const side = K.M(c[0], c[1], {em: def.glow || 0x1c1c22}), ghost = def.phase ? 0.82 : 0;
    let P = {g, rig}, panelW = 0.82, top = 2;
    const panel = (w, cx, cy, cz, p) => { const h = w / asp, b = K.head(w, h, Math.min(0.5, w * 0.6), side, front, cx, cy + h / 2, cz, p); return h; };
    if (def.body === 'man' || def.body === 'big') { const big = def.body === 'big';
      const H = humanoid(K, {legs: [c[0], c[1]], body: [c[0], c[1]], bw: big ? 0.9 : 0.58, bh: big ? 0.9 : 0.72, bd: big ? 0.5 : 0.32, legH: big ? 0.8 : 0.72, armL: big ? 1.0 : 0.7, aw: big ? 0.3 : 0.2});
      rig.add(H.rig); Object.assign(P, H, {g, rig});
      const hh = panel(big ? 1.0 : 0.82, 0, 0, 0.02, P.head); top = P.top + hh; }
    else if (def.body === 'robe') { const H = humanoid(K, {noLegs: 1, robe: [c[0], c[1]], legs: [c[0], c[1]], body: [c[0], c[1]], bw: 0.6, bh: 0.6, bd: 0.34, robeH: 1.0, robeY: 0.05, armL: 0.8, aw: 0.18});
      rig.add(H.rig); Object.assign(P, H, {g, rig}); const hh = panel(0.86, 0, 0, 0.02, P.head); top = P.top + hh; }
    else if (def.body === 'sheet') { const sh = K.cyl(0.42, 0.62, 1.3, side, 0, 0.75, 0, rig, 10, true); const hd = K.sph(0.44, side, 0, 1.45, 0, rig); P.head = K.grp(0, 1.05, 0.28, rig); const hh = panel(0.8, 0, 0, 0.1, P.head); top = 1.1 + hh; P.body = rig; }
    else if (def.body === 'orb' || def.body === 'blob' || def.body === 'cloud') { const r = def.body === 'cloud' ? 0.9 : 0.62; const core = K.sph(r, side, 0, r, 0, rig, def.body === 'blob' ? 1.1 : def.body === 'cloud' ? 1.5 : 1, def.body === 'blob' ? 0.85 : 0.8, 1);
      if (def.body === 'cloud') { K.sph(r * 0.7, side, -r * 1.1, r * 1.1, 0, rig); K.sph(r * 0.7, side, r * 1.1, r * 1.05, 0, rig); for (let i = 0; i < 3; i++) { const b = K.box(0.08, 0.7, 0.08, K.M(0xfff2a0, null, {basic: 1}), -0.5 + i * 0.5, -0.1, 0.2, rig); b.rotation.z = 0.4 * (i - 1); } }
      if (def.body === 'blob') for (let i = 0; i < 4; i++) K.cone(0.1, 0.35, side, -0.4 + i * 0.27, 0.15, 0.3, rig).rotation.x = Math.PI;
      P.head = K.grp(0, r * 0.45, r * 0.78, rig); const hh = panel(r * 1.4, 0, 0, 0, P.head); top = r * 2; P.body = rig; }
    else if (def.body === 'dog') { const body = K.box(0.5, 0.45, 1.1, side, 0, 0.75, 0, rig); P.legs4 = [];
      for (const [x, z] of [[-.18, .4], [.18, .4], [-.18, -.4], [.18, -.4]]) { const L = K.grp(x, 0.55, z, rig); K.box(0.14, 0.55, 0.14, side, 0, -0.27, 0, L); P.legs4.push(L); }
      const tail = K.box(0.1, 0.1, 0.5, side, 0, 0.95, -0.75, rig); tail.rotation.x = -0.6;
      P.head = K.grp(0, 0.75, 0.6, rig); const hh = panel(0.72, 0, 0, 0.1, P.head); top = 0.75 + hh; P.body = rig; }
    if (def.body === 'man' && /Diver/.test(def.name)) { /* brass dive helmet ring behind the picture */ K.cyl(0.5, 0.5, 0.15, K.M(0xb08a3a, 'metal'), 0, 0.05, 0, P.head); }
    if (ghost) for (const m of mats) { m.transparent = true; m.opacity = ghost; m.depthWrite = false; }
    g.traverse(o => { if (o.isMesh) { o.castShadow = !PH; } });
    g.scale.setScalar(S);
    return Object.assign(P, {g, rig, mats, legs: [], arms: [], speed: def.spd, hp: def.hp, maxHp: def.hp, hitY: top * S * 0.5, hitR: (def.body === 'big' || def.body === 'cloud' ? 0.9 : 0.6) * S, tall: Math.max(1, Math.ceil(top * S)), hostile: true, topH: top * S});
  }
  U.build = build;
  // ===== v1.0.6: real procedural HD models for the 29 (multi-mesh, HD canvas textures, glowing eyes, per-mob animation) =====
  const MODELS = {};
  const glow = (K, col, op) => K.M(col, null, {basic: 1, op});
  function eyes(K, p, y, z, sep, r, col, o) { o = o || {}; const m = glow(K, col); const out = [];
    for (const s of [-1, 1]) { const e = K.sph(r, m, s * sep, y, z, p, o.sx || 1, o.sy || 1, o.sz || 0.5, 8); out.push(e); if (o.halo && !PH) { const h = K.sph(r * 1.9, glow(K, col, 0.22), s * sep, y, z - 0.005, p, 1, 1, 0.2, 8); out.push(h); } } return out; }
  function strands(K, p, mat, n, o) { const L = []; for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + (o.a0 || 0), rr = o.r || 0.3, len = (o.len || 0.6) * (0.7 + 0.6 * ((i * 37 % 11) / 11));
      const piv = K.grp(Math.sin(a) * rr * (o.sx || 1), o.y || 0, Math.cos(a) * rr * (o.sz || 1), p); piv.rotation.y = a;
      K.box(o.w || 0.08, len, 0.02, mat, 0, -len / 2, 0, piv); piv.rotation.x = o.tilt || 0.15; piv.userData.ph = i * 1.7; L.push(piv); } return L; }
  function claws(K, hand, mat, n, len) { for (let i = 0; i < n; i++) { const c = K.cone(0.035, len || 0.2, mat, (i - (n - 1) / 2) * 0.06, -0.08, 0.05, hand, 5); c.rotation.x = Math.PI * 0.85; } }
  function blade(K, hand, len, mat, hilt) { const g = K.grp(0, -0.02, 0.06, hand); g.rotation.x = -Math.PI / 2; K.box(0.06, len, 0.015, mat, 0, len / 2 + 0.08, 0, g); K.box(0.22, 0.04, 0.06, hilt, 0, 0.08, 0, g); K.box(0.05, 0.14, 0.05, hilt, 0, 0.0, 0, g); return g; }
  function man(K, o) { const H = humanoid(K, o); return H; }
  const sway = (L, t, amp, sp) => { if (L) for (const s of L) s.rotation.z = Math.sin(t * (sp || 2) + s.userData.ph) * (amp || 0.15); };
  // face painters
  const FACE = {
    ghoul(g, n) { F.rect(g, n, 0, 0, 1, .22, '#2a1d18'); F.eye(g, n, .32, .42, .12, '#fffbe8', '#111'); F.eye(g, n, .68, .42, .12, '#fffbe8', '#111'); F.brow(g, n, .18, .27, .45, .33, .05); F.brow(g, n, .82, .27, .55, .33, .05);
      F.teeth(g, n, .5, .76, .5, .14, 7, '#e8e0c0'); F.brow(g, n, .45, .5, .5, .62, .03, 'rgba(60,30,20,.6)'); for (let i = 0; i < 6; i++) F.brow(g, n, .1 + i * .16, .9, .15 + i * .16, .99, .02, 'rgba(0,0,0,.3)'); },
    clown(g, n) { F.rect(g, n, 0, 0, 1, 1, '#f1ece4'); F.hole(g, n, .3, .4, .1, .07, '#1a1a2a'); F.hole(g, n, .7, .4, .1, .07, '#1a1a2a'); F.eye(g, n, .3, .41, .045, '#fff6a0'); F.eye(g, n, .7, .41, .045, '#fff6a0');
      F.brow(g, n, .15, .22, .42, .32, .05, '#2a1030'); F.brow(g, n, .85, .22, .58, .32, .05, '#2a1030'); g.strokeStyle = '#b01828'; g.lineWidth = n * .06; g.beginPath(); g.arc(n * .5, n * .55, n * .3, .2, Math.PI - .2); g.stroke(); F.teeth(g, n, .5, .8, .36, .07, 8); },
    tiki(g, n) { g.fillStyle = '#3a2410'; for (const [x, y] of [[.3, .36], [.7, .36]]) { g.beginPath(); g.ellipse(x * n, y * n, .14 * n, .1 * n, 0, 0, 7); g.fill(); } F.eye(g, n, .3, .36, .06, '#f8d040', '#300'); F.eye(g, n, .7, .36, .06, '#f8d040', '#300');
      F.rect(g, n, .44, .4, .12, .22, '#5a3818'); F.rect(g, n, .15, .66, .7, .24, '#2a1608'); for (let i = 0; i < 7; i++) { F.rect(g, n, .17 + i * .095, .66, .07, .1, '#efe2c0'); F.rect(g, n, .17 + i * .095, .8, .07, .1, '#efe2c0'); }
      for (let i = 0; i < 4; i++) F.brow(g, n, .05, .15 + i * .05, .95, .15 + i * .05, .015, 'rgba(30,15,5,.5)'); },
    mummy(g, n) { F.hole(g, n, .34, .42, .08, .05, '#140c06'); F.glow(g, n, .66, .42, .05, '#ffd040'); F.hole(g, n, .5, .72, .16, .05, '#140c06'); },
    grin(g, n) { F.eye(g, n, .32, .38, .09, '#ffe680', '#401000'); F.eye(g, n, .68, .38, .09, '#ffe680', '#401000'); F.teeth(g, n, .5, .7, .74, .22, 10, '#f5ecd0'); },
    crone(g, n) { F.rect(g, n, 0, 0, 1, 1, '#9aa080'); F.glow(g, n, .32, .4, .05, '#9cff40'); F.glow(g, n, .68, .4, .05, '#9cff40'); F.brow(g, n, .15, .28, .42, .34, .05, '#ddd'); F.brow(g, n, .85, .28, .58, .34, .05, '#ddd');
      g.strokeStyle = '#2a1a10'; g.lineWidth = n * .03; g.beginPath(); g.arc(n * .5, n * .62, n * .22, .3, Math.PI - .3); g.stroke(); F.rect(g, n, .38, .72, .05, .08, '#e8e0c0'); F.rect(g, n, .58, .72, .05, .08, '#e8e0c0'); for (let i = 0; i < 9; i++) F.brow(g, n, Math.random(), Math.random(), Math.random(), Math.random(), .006, 'rgba(40,40,20,.4)'); },
    skull(g, n) { F.rect(g, n, 0, 0, 1, 1, '#e6dcc0'); F.hole(g, n, .3, .42, .13, .12); F.hole(g, n, .7, .42, .13, .12); F.glow(g, n, .3, .43, .04, '#ff3020'); F.glow(g, n, .7, .43, .04, '#ff3020');
      g.fillStyle = '#0a0606'; g.beginPath(); g.moveTo(n * .5, n * .55); g.lineTo(n * .44, n * .66); g.lineTo(n * .56, n * .66); g.fill(); F.teeth(g, n, .5, .82, .5, .12, 7, '#f0e8d0'); },
    shaman(g, n) { F.rect(g, n, 0, 0, 1, 1, '#ece2c8'); F.hole(g, n, .3, .4, .14, .14); F.hole(g, n, .7, .4, .14, .14); F.glow(g, n, .3, .41, .05, '#60ff70'); F.glow(g, n, .7, .41, .05, '#60ff70');
      g.strokeStyle = '#a02010'; g.lineWidth = n * .03; for (const x of [.15, .85]) { g.beginPath(); g.moveTo(x * n, .55 * n); g.lineTo(x * n, .8 * n); g.stroke(); } F.teeth(g, n, .5, .78, .44, .14, 6); },
    troll(g, n) { F.eye(g, n, .32, .38, .07, '#ffcc40', '#300'); F.eye(g, n, .68, .38, .07, '#ffcc40', '#300'); F.brow(g, n, .15, .28, .45, .34, .07, '#ddd'); F.brow(g, n, .85, .28, .55, .34, .07, '#ddd'); F.hole(g, n, .5, .74, .25, .08, '#200c08'); },
    iron(g, n) { F.rect(g, n, .14, .36, .3, .06, '#050505'); F.rect(g, n, .56, .36, .3, .06, '#050505'); F.glow(g, n, .3, .39, .035, '#ff5020'); F.glow(g, n, .7, .39, .035, '#ff5020'); for (let i = 0; i < 6; i++) F.rect(g, n, .22 + i * .1, .62, .04, .22, '#0a0a0a'); },
    gowk(g, n) { F.hole(g, n, .5, .74, .34, .12, '#2a0808'); F.rect(g, n, .38, .64, .06, .05, '#f0f0d0'); F.rect(g, n, .56, .64, .06, .05, '#f0f0d0'); F.rect(g, n, .45, .84, .1, .04, '#c06060'); },
    zombie(g, n) { F.glow(g, n, .32, .42, .05, '#ff3020'); F.glow(g, n, .68, .42, .05, '#ff3020'); F.hole(g, n, .5, .72, .2, .09, '#1a0a06'); F.teeth(g, n, .5, .72, .3, .1, 5, '#d8d0a0'); F.rect(g, n, .6, .2, .2, .06, 'rgba(40,20,10,.6)'); },
    sailor(g, n) { F.hole(g, n, .32, .42, .09, .08, '#0a1a24'); F.hole(g, n, .68, .42, .09, .08, '#0a1a24'); F.glow(g, n, .32, .42, .04, '#b0f0ff'); F.glow(g, n, .68, .42, .04, '#b0f0ff'); },
    girl(g, n) { F.rect(g, n, 0, 0, 1, 1, '#f2f2ee'); for (let i = 0; i < 30; i++) F.brow(g, n, i / 30, 0, i / 30 + (Math.random() - .5) * .05, 1, .02, 'rgba(200,205,210,.7)'); F.glow(g, n, .62, .5, .03, '#a0e0ff'); },
    hatman(g, n) { F.rect(g, n, 0, 0, 1, 1, '#08080a'); F.glow(g, n, .34, .45, .05, '#ffe040'); F.glow(g, n, .66, .45, .05, '#ffe040'); },
    void(g, n) { F.rect(g, n, 0, 0, 1, 1, '#050507'); F.glow(g, n, .34, .5, .06, '#e8f0ff'); F.glow(g, n, .66, .5, .06, '#e8f0ff'); },
    shade(g, n) { F.rect(g, n, 0, 0, 1, 1, '#a080e0'); F.brow(g, n, .15, .3, .45, .4, .06, '#301050'); F.brow(g, n, .85, .3, .55, .4, .06, '#301050'); F.eye(g, n, .32, .46, .07, '#fff', '#401070'); F.eye(g, n, .68, .46, .07, '#fff', '#401070'); F.teeth(g, n, .5, .76, .4, .12, 6); },
    haar(g, n) { g.clearRect(0, 0, n, n); F.hole(g, n, .32, .42, .1, .14, 'rgba(20,24,30,.85)'); F.hole(g, n, .68, .42, .1, .14, 'rgba(20,24,30,.85)'); F.hole(g, n, .5, .76, .1, .14, 'rgba(20,24,30,.75)'); },
    storm(g, n) { F.brow(g, n, .15, .3, .45, .42, .07, '#202838'); F.brow(g, n, .85, .3, .55, .42, .07, '#202838'); F.glow(g, n, .32, .48, .06, '#c0f0ff'); F.glow(g, n, .68, .48, .06, '#c0f0ff'); g.strokeStyle = '#202838'; g.lineWidth = n * .04; g.beginPath(); g.moveTo(n * .3, n * .76); for (let i = 1; i <= 6; i++) g.lineTo(n * (.3 + i * .066), n * (i % 2 ? .7 : .78)); g.stroke(); },
    sheet(g, n) { F.hole(g, n, .34, .4, .09, .13); F.hole(g, n, .66, .4, .09, .13); F.hole(g, n, .5, .7, .08, .1); },
    dog(g, n) { F.glow(g, n, .3, .36, .06, '#80e0ff'); F.glow(g, n, .7, .36, .06, '#80e0ff'); F.hole(g, n, .5, .7, .14, .09, '#101020'); },
    robot(g, n) { F.rect(g, n, .1, .1, .8, .8, 'rgba(0,0,0,.25)'); for (let i = 0; i < 5; i++) F.rect(g, n, .2 + i * .13, .7, .08, .1, i % 2 ? '#ff4030' : '#40ff80'); F.rect(g, n, .3, .25, .4, .3, '#203040'); F.glow(g, n, .5, .4, .06, '#80f0ff'); },
  };
  U.FACE = FACE;
  const hd = (K, key, pat, base, w, h, d, p, y, z, o) => K.head(w, h, d, K.M(base, pat, o), K.face(key, pat, base, FACE[key], o), 0, y, z || 0, p);
  // ---- the 29 models. Each returns {root, parts..., top, r, anim(a, dt, s)} ; s = {mv, atk, t, d} ----
  const RR = Math.PI;
  MODELS.nm01 = K => { // Clank Warden: round domed helm with slits, plate armour, kite shield + mace
    const steel = 0x9aa2ab, H = man(K, {legs: [steel, 'metal'], body: [steel, 'metal'], boots: 0x3a3a40, bw: 0.62, bh: 0.76, bd: 0.36, aw: 0.22});
    const mS = K.M(steel, 'metal'), dark = K.M(0x2a2c30, 'metal');
    const helm = K.sph(0.34, mS, 0, 0.3, 0, H.head, 1, 1.05, 1); K.cyl(0.36, 0.36, 0.06, dark, 0, 0.12, 0, H.head);
    for (const x of [-0.12, 0.12]) K.box(0.05, 0.2, 0.05, glow(K, 0x101010), x, 0.32, 0.31, H.head); K.box(0.26, 0.05, 0.05, glow(K, 0x101010), 0, 0.36, 0.31, H.head);
    eyes(K, H.head, 0.33, 0.27, 0.12, 0.025, 0xff3a20);
    K.cone(0.05, 0.3, K.M(0xa02020, 'cloth'), 0, 0.7, -0.05, H.head).rotation.x = -0.4;
    for (const s of [-1, 1]) K.sph(0.2, mS, s * 0.36, 0.72, 0, H.body, 1, 0.7, 1.1);
    K.box(0.66, 0.1, 0.4, K.M(0x4a3020, 'leather'), 0, 0.06, 0, H.body);
    const sh = K.grp(-0.05, -0.35, 0.14, H.la); const sm = K.cyl(0.34, 0.34, 0.06, K.M(0x6a4a2a, 'wood'), 0, 0, 0, sh, 16); sm.rotation.x = RR / 2; K.cyl(0.36, 0.36, 0.04, dark, 0, 0, -0.01, sh, 16, true).rotation.x = RR / 2; K.sph(0.08, mS, 0, 0, 0.05, sh);
    const mace = K.grp(0, -0.68, 0.05, H.ra); mace.rotation.x = -RR / 2; K.cyl(0.03, 0.03, 0.6, K.M(0x4a3020, 'wood'), 0, 0.3, 0, mace); const hd0 = K.sph(0.1, dark, 0, 0.62, 0, mace); for (let i = 0; i < 6; i++) { const c = K.cone(0.03, 0.1, mS, 0, 0.62, 0, mace, 4); c.rotation.z = i * 1.05; c.translateY(0.11); }
    return {root: H.rig, H, top: H.top + 0.7, r: 0.6, anim(a, dt, s) { H.la.rotation.x = -0.9 + (s.atk ? -0.2 : 0); H.la.rotation.z = 0.25; if (s.atk) H.ra.rotation.x = -2.4 + s.atk * 5; } }; };
  MODELS.nm02 = K => { // Gloam Ghoul: black cloak, wild white eyes, shock of hair, long clawed hands
    const blk = 0x1a181d, H = man(K, {noLegs: 1, robe: [blk, 'cloth'], legs: [blk, 'cloth'], body: [blk, 'cloth'], arm: [0x2a272e, 'cloth'], hand: [0xb4ab96, 'skin'], bw: 0.58, bh: 0.62, bd: 0.32, robeH: 1.0, armL: 0.9, aw: 0.17});
    hd(K, 'ghoul', 'skin', 0xbdb39b, 0.46, 0.52, 0.44, H.head, 0.28, 0);
    const hair = K.M(0x3a2a20, 'fur'); K.box(0.52, 0.16, 0.5, hair, 0, 0.58, -0.02, H.head); for (const s of [-1, 1]) K.box(0.08, 0.36, 0.42, hair, s * 0.26, 0.36, -0.04, H.head);
    const cloak = K.grp(0, 0.62, -0.17, H.body); const cm = K.M(0x111014, 'cloth', {ds: 1}); const cp = K.box(0.9, 1.5, 0.03, cm, 0, -0.72, 0, cloak); cloak.rotation.x = 0.1;
    K.box(0.7, 0.16, 0.36, cm, 0, 0.62, 0, H.body);
    for (const A of [H.la, H.ra]) claws(K, A.hand, K.M(0x2a2018, 'bone'), 4, 0.22);
    return {root: H.rig, H, top: H.top + 0.6, r: 0.55, anim(a, dt, s) { cloak.rotation.x = 0.15 + (s.mv ? 0.35 + Math.sin(s.t * 9) * 0.12 : Math.sin(s.t * 1.5) * 0.05); H.la.rotation.x = -1.2 + Math.sin(s.t * 3) * 0.2; H.ra.rotation.x = -1.2 - Math.cos(s.t * 3) * 0.2 - s.atk * 3; H.la.rotation.z = 0.3; H.ra.rotation.z = -0.3; } }; };
  MODELS.nm03 = K => { // Domeskull Unit: barrel steel body, glass dome with a skull inside, antenna, claw arms
    const g = K.grp(0, 0, 0), mS = K.M(0xa8b0b8, 'metal'), dark = K.M(0x30343a, 'metal'), red = K.M(0x9a2a20, 'metal');
    const legs = []; for (const s of [-1, 1]) { const L = K.grp(s * 0.22, 0.55, 0, g); K.box(0.2, 0.5, 0.24, dark, 0, -0.27, 0, L); K.box(0.28, 0.12, 0.38, mS, 0, -0.5, 0.04, L); legs.push(L); }
    const body = K.grp(0, 0.55, 0, g); K.cyl(0.42, 0.36, 0.8, mS, 0, 0.4, 0, body, 14); K.cyl(0.44, 0.44, 0.08, red, 0, 0.55, 0, body, 14); K.cyl(0.44, 0.44, 0.08, red, 0, 0.12, 0, body, 14);
    const pan = K.box(0.36, 0.22, 0.05, K.face('robot', 'metal', 0x606870, FACE.robot), 0, 0.33, 0.38, body);
    const head = K.grp(0, 0.82, 0, body); K.cyl(0.3, 0.36, 0.1, dark, 0, 0.04, 0, head, 14);
    const sk = K.grp(0, 0.28, 0, head); hd(K, 'skull', 'bone', 0xe6dcc0, 0.3, 0.3, 0.28, sk, 0, 0);
    const dome = K.sph(0.36, K.M(0xa0e0ff, null, {op: 0.28}), 0, 0.3, 0, head, 1, 1, 1, PH ? 12 : 18);
    const ant = K.grp(0.2, 0.55, 0, head); K.cyl(0.015, 0.015, 0.35, dark, 0, 0.17, 0, ant, 5); const bulb = K.sph(0.05, glow(K, 0xff3020), 0, 0.37, 0, ant, 1, 1, 1, 8);
    const arms = []; for (const s of [-1, 1]) { const A = K.grp(s * 0.5, 0.65, 0, body); K.sph(0.11, red, 0, 0, 0, A); K.box(0.12, 0.5, 0.12, mS, 0, -0.28, 0, A); const c = K.grp(0, -0.55, 0, A); for (const t of [-1, 1]) { const f = K.box(0.04, 0.16, 0.12, dark, t * 0.05, -0.06, 0, c); f.rotation.z = t * 0.3; } arms.push(A); }
    return {root: g, head, ll: legs[0], rl: legs[1], la: arms[0], ra: arms[1], body, top: 2.0, r: 0.6, anim(a, dt, s) { head.rotation.y = Math.sin(s.t * 0.8) * 0.4; bulb.material.color.setHex((s.t * 2 | 0) % 2 ? 0xff3020 : 0x401010); sk.position.y = 0.28 + Math.sin(s.t * 3) * 0.02; if (s.atk) arms[1].rotation.x = -1.5; } }; };
  MODELS.nm04 = K => { // Kelp Diver: brass dive helmet with 3 portholes, canvas suit draped in kelp, lead boots, air hose
    const can = 0x7a6c50, H = man(K, {legs: [can, 'cloth'], body: [can, 'cloth'], boots: 0x34302a, bw: 0.62, bh: 0.74, bd: 0.4, aw: 0.24});
    const brass = K.M(0xb08a3a, 'metal'), glass = K.M(0x2a5a50, null, {em: 0x0a3a30});
    const helm = K.sph(0.36, brass, 0, 0.3, 0, H.head, 1, 1.05, 1); K.cyl(0.4, 0.42, 0.12, brass, 0, 0.02, 0, H.head, 14);
    const port = (x, y, z, ry) => { const q = K.grp(x, y, z, H.head); q.rotation.y = ry; const r = K.cyl(0.11, 0.11, 0.06, brass, 0, 0, 0, q, 12); r.rotation.x = RR / 2; const gl = K.cyl(0.085, 0.085, 0.07, glass, 0, 0, 0.005, q, 12); gl.rotation.x = RR / 2; for (const t of [-1, 1]) K.box(0.012, 0.18, 0.012, brass, t * 0.03, 0, 0.04, q); };
    port(0, 0.3, 0.33, 0); port(-0.32, 0.3, 0.05, -RR / 2); port(0.32, 0.3, 0.05, RR / 2);
    eyes(K, H.head, 0.3, 0.33, 0.04, 0.025, 0x80ffd0);
    const hose = K.grp(0, 0.35, -0.3, H.head); for (let i = 0; i < 4; i++) K.cyl(0.05, 0.05, 0.25, K.M(0x3a3a34, 'leather'), 0, -i * 0.2, -i * 0.06, hose, 6).rotation.x = 0.3;
    const kelp = K.M(0x3f6a2e, 'weed', {ds: 1}); const S1 = strands(K, H.body, kelp, PH ? 6 : 10, {y: 0.75, r: 0.33, len: 0.9, w: 0.1}); const S2 = strands(K, H.head, kelp, PH ? 4 : 7, {y: 0.5, r: 0.3, len: 0.5, w: 0.08, tilt: 0.4});
    return {root: H.rig, H, top: H.top + 0.7, r: 0.6, anim(a, dt, s) { sway(S1, s.t, 0.25, 1.5); sway(S2, s.t, 0.3, 1.8); } }; };
  MODELS.nm05 = K => { // Gurnin' Jester: floating clown phantom, white face, red nose, ruff, two-bell cap
    const pur = 0x5a3a7a, H = man(K, {noLegs: 1, robe: [pur, 'cloth'], legs: [pur, 'cloth'], body: [0x7a4a9a, 'cloth'], hand: [0xf0f0f0, 'cloth'], bw: 0.6, bh: 0.62, bd: 0.34, robeH: 0.9, robeY: 0.1, armL: 0.75, aw: 0.18});
    hd(K, 'clown', 'skin', 0xf1ece4, 0.5, 0.52, 0.46, H.head, 0.3, 0, {em: 0x202020}); K.sph(0.07, K.M(0xd01020, null, {em: 0x400000}), 0, 0.28, 0.25, H.head);
    const ruff = K.M(0xf4f0e6, 'cloth'); for (let i = 0; i < (PH ? 8 : 12); i++) { const c = K.cone(0.09, 0.22, ruff, 0, 0.0, 0, H.head, 5); const an = i / (PH ? 8 : 12) * 6.283; c.position.set(Math.sin(an) * 0.3, 0.02, Math.cos(an) * 0.3); c.rotation.set(Math.cos(an) * 1.5, 0, -Math.sin(an) * 1.5); }
    const bells = []; for (const s of [-1, 1]) { const q = K.grp(s * 0.12, 0.55, 0, H.head); q.rotation.z = -s * 0.9; K.cone(0.13, 0.5, K.M(s < 0 ? 0xc02030 : 0x2040a0, 'cloth'), 0, 0.25, 0, q, 8); K.sph(0.06, K.M(0xe0c040, 'metal', {em: 0x302000}), 0, 0.52, 0, q); bells.push(q); }
    return {root: H.rig, H, top: H.top + 0.9, r: 0.55, anim(a, dt, s) { bells.forEach((b, i) => b.rotation.z = (i ? -1 : 1) * (0.9 + Math.sin(s.t * 4 + i) * 0.15)); H.head.rotation.z = Math.sin(s.t * 1.7) * 0.15; if (s.atk) { H.ra.rotation.x = -2 + s.atk * 4; } } }; };
  MODELS.nm06 = K => { // Hooded Bodach: tall peaked hood, a void face with two white eyes, long hooked claws
    const c = 0x26262c, H = man(K, {noLegs: 1, robe: [c, 'cloth'], legs: [c, 'cloth'], body: [c, 'cloth'], hand: [0x8a8070, 'bone'], bw: 0.58, bh: 0.7, bd: 0.34, robeH: 1.1, armL: 0.95, aw: 0.16});
    hd(K, 'void', 'cloth', 0x050507, 0.42, 0.46, 0.4, H.head, 0.26, 0.02);
    const hood = K.M(0x2c2c34, 'cloth', {ds: 1}); K.box(0.56, 0.6, 0.52, hood, 0, 0.3, -0.04, H.head).scale.set(1, 1, 1); K.cone(0.28, 0.5, hood, 0, 0.78, -0.12, H.head, 4).rotation.x = -0.35;
    for (const A of [H.la, H.ra]) claws(K, A.hand, K.M(0x1a1410, 'bone'), 3, 0.32);
    const tail = strands(K, H.rig, K.M(c, 'cloth', {ds: 1}), PH ? 4 : 7, {y: 0.15, r: 0.36, len: 0.4, w: 0.18, tilt: 0.1});
    return {root: H.rig, H, top: H.top + 0.9, r: 0.5, anim(a, dt, s) { sway(tail, s.t, 0.3, 3); H.la.rotation.x = -0.8 + Math.sin(s.t * 2.5) * 0.4; H.ra.rotation.x = -0.8 - Math.sin(s.t * 2.5) * 0.4 - s.atk * 3; H.head.rotation.y = Math.sin(s.t * 0.7) * 0.4; } }; };
  MODELS.nm07 = K => { // Corrie Yeti: huge shaggy white beast, dark face, round eyes, fangs, long knuckle-walking arms
    const fur = 0xe4e2dc, H = man(K, {legs: [fur, 'fur'], body: [fur, 'fur'], hand: [0x6a6a70, 'skin'], bw: 1.0, bh: 0.95, bd: 0.62, legH: 0.75, armL: 1.15, aw: 0.32, hunch: 0.25});
    const head = K.grp(0, 0.05, 0.12, H.head); K.box(0.66, 0.6, 0.6, K.M(fur, 'fur'), 0, 0.32, 0, head);
    const face = K.box(0.5, 0.42, 0.06, K.M(0x4a4a56, 'skin'), 0, 0.3, 0.3, head);
    eyes(K, head, 0.38, 0.34, 0.12, 0.07, 0xffffff, {halo: 1}); eyes(K, head, 0.38, 0.37, 0.12, 0.035, 0x101010);
    const jaw = K.grp(0, 0.16, 0.3, head); K.box(0.4, 0.1, 0.12, K.M(0x3a1010, 'skin'), 0, -0.05, 0, jaw); for (const x of [-0.13, 0.13]) K.cone(0.04, 0.16, K.M(0xf4f0e0, 'bone'), x, -0.12, 0.05, jaw, 5).rotation.x = RR;
    const shag = strands(K, H.body, K.M(0xd8d6d0, 'fur', {ds: 1}), PH ? 6 : 12, {y: 0.2, r: 0.5, sz: 0.65, len: 0.4, w: 0.18, tilt: 0.2});
    return {root: H.rig, H, top: 2.9, r: 0.95, anim(a, dt, s) { jaw.rotation.x = s.atk ? 0.6 : 0.1 + Math.sin(s.t * 2) * 0.08; sway(shag, s.t, 0.12, 4);
        if (a.chg > 0) { H.la.rotation.x = H.ra.rotation.x = -0.4; H.body.rotation.x = 0.6; } else if (a.cd2 < 0.9 && a.cd2 > 0) { H.la.rotation.x = -2.2 + Math.sin(s.t * 18) * 0.5; H.ra.rotation.x = -2.2 - Math.sin(s.t * 18) * 0.5; } else H.body.rotation.x = 0.25; } }; };
  MODELS.nm08 = K => { // Totem Thumper: carved yew-wood brute, tall tiki mask with a glowing gem headband, grass skirt
    const wood = 0x8a6038, H = man(K, {legs: [0x6a4a30, 'skin'], body: [0x7a5838, 'skin'], bw: 0.95, bh: 0.85, bd: 0.55, legH: 0.7, armL: 0.95, aw: 0.3});
    hd(K, 'tiki', 'wood', wood, 0.75, 0.95, 0.4, H.head, 0.45, 0.08);
    K.box(0.8, 0.1, 0.46, K.M(0x2a6a40, 'cloth'), 0, 0.72, 0.08, H.head); const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), K.M(0xff2040, null, {em: 0x801020})); gem.position.set(0, 0.72, 0.33); H.head.add(gem);
    for (let i = 0; i < 5; i++) { const f = K.cone(0.06, 0.4, K.M([0xd04020, 0xe0c030, 0x30a050][i % 3], 'cloth'), -0.3 + i * 0.15, 1.05, 0.05, H.head, 4); f.rotation.z = (i - 2) * 0.2; }
    const skirt = strands(K, H.body, K.M(0xa09040, 'weed', {ds: 1}), PH ? 8 : 14, {y: 0.08, r: 0.5, sz: 0.62, len: 0.55, w: 0.12, tilt: 0.25});
    return {root: H.rig, H, top: 3.1, r: 0.9, anim(a, dt, s) { gem.rotation.y += dt * 2; sway(skirt, s.t, 0.2, 5); if (a.slam) { H.la.rotation.x = H.ra.rotation.x = -2.8; } } }; };
  MODELS.nm09 = K => { // Cairn Mummy: bandaged from head to toe, one glowing eye, trailing wraps
    const b = 0xcdbf9c, H = man(K, {legs: [b, 'bandage'], body: [b, 'bandage'], bw: 0.56, bh: 0.74, bd: 0.32});
    hd(K, 'mummy', 'bandage', b, 0.48, 0.5, 0.46, H.head, 0.27, 0); eyes(K, H.head, 0.29, 0.24, 0.0, 0, 0xffd040);
    const wraps = K.M(0xc0b08a, 'bandage', {ds: 1}); const W1 = strands(K, H.la, wraps, 2, {y: -0.5, r: 0.06, len: 0.5, w: 0.06}); const W2 = strands(K, H.body, wraps, PH ? 3 : 5, {y: 0.1, r: 0.3, sz: 0.6, len: 0.5, w: 0.07});
    return {root: H.rig, H, top: H.top + 0.5, r: 0.55, anim(a, dt, s) { sway(W1, s.t, 0.4, 3); sway(W2, s.t, 0.3, 2.5); H.head.rotation.z = 0.2 + Math.sin(s.t) * 0.05; } }; };
  MODELS.nm10 = K => { // Bedsheet Bogle: a wavy lathe-shaped sheet with dark eye holes, gently glowing
    const g = K.grp(0, 0, 0), m = K.M(0xf4f4f0, 'cloth', {em: 0x303438, ds: 1}); const pts = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(i === 12 ? 0.001 : 0.62 - t * 0.12 - Math.pow(Math.max(0, t - 0.6) / 0.4, 2) * 0.48, t * 1.7)); }
    const sheet = new THREE.Mesh(new THREE.LatheGeometry(pts, PH ? 12 : 20), m); g.add(sheet);
    const pos = sheet.geometry.attributes.position; const base = pos.array.slice(); sheet.userData.base = base;
    const face = K.grp(0, 1.25, 0.46, g); const fm = K.face('sheet', 'cloth', 0xf4f4f0, FACE.sheet, {em: 0x303438}); fm.transparent = true; const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), fm); face.add(fp); face.rotation.x = -0.25;
    const arms = []; for (const s of [-1, 1]) { const A = K.grp(s * 0.5, 1.0, 0, g); K.cone(0.14, 0.5, m, 0, -0.2, 0, A, 6); A.rotation.z = s * 2.4; arms.push(A); }
    return {root: g, head: face, la: arms[0], ra: arms[1], top: 1.75, r: 0.55, anim(a, dt, s) { const arr = pos.array; for (let i = 0; i < arr.length; i += 3) { const y = base[i + 1]; if (y < 0.45) { const k = (0.45 - y) / 0.45, ang = Math.atan2(base[i], base[i + 2]); arr[i + 1] = y + Math.sin(ang * 5 + s.t * 4) * 0.08 * k; } } pos.needsUpdate = true;
        arms.forEach((A, i) => A.rotation.z = (i ? 1 : -1) * (2.3 + Math.sin(s.t * 3 + i) * 0.25 + (s.atk ? 0.6 : 0))); } }; };
  MODELS.nm11 = K => { // Cailleach of the Moss: hunched crone in a mossy cloak, tall crooked hat, grey hair, a blackthorn cane
    const c = 0x2f3d2a, H = man(K, {noLegs: 1, robe: [c, 'cloth'], legs: [c, 'cloth'], body: [c, 'cloth'], hand: [0x9aa080, 'skin'], bw: 0.56, bh: 0.6, bd: 0.34, robeH: 1.0, armL: 0.75, aw: 0.16, hunch: 0.4});
    hd(K, 'crone', 'skin', 0x9aa080, 0.44, 0.48, 0.42, H.head, 0.26, 0.04); K.cone(0.06, 0.24, K.M(0x8a9070, 'skin'), 0, 0.24, 0.3, H.head, 6).rotation.x = RR / 2 + 0.3;
    const hat = K.grp(0, 0.5, 0, H.head); const hm = K.M(0x1a1c18, 'cloth'); K.cyl(0.42, 0.42, 0.04, hm, 0, 0, 0, hat, 16); const tip = K.grp(0, 0, 0, hat); K.cone(0.24, 0.7, hm, 0, 0.35, 0, tip, 10); tip.rotation.x = -0.25; K.cyl(0.25, 0.25, 0.06, K.M(0x6a2a2a, 'cloth'), 0, 0.05, 0, hat, 12);
    const hair = strands(K, H.head, K.M(0xc8c8c0, 'fur', {ds: 1}), PH ? 6 : 10, {y: 0.45, r: 0.24, len: 0.55, w: 0.08, a0: 0.6});
    const cane = K.grp(0, -0.75, 0.05, H.ra); K.cyl(0.03, 0.025, 1.0, K.M(0x2a1a10, 'wood'), 0, 0.1, 0.15, cane, 6); const orb = K.sph(0.06, glow(K, 0x9cff40), 0, 0.62, 0.15, cane);
    return {root: H.rig, H, top: 2.4, r: 0.5, anim(a, dt, s) { sway(hair, s.t, 0.12, 2); tip.rotation.z = Math.sin(s.t * 1.3) * 0.1; if (s.atk) { H.la.rotation.x = -2.6 + s.atk * 3; } orb.scale.setScalar(1 + Math.sin(s.t * 5) * 0.2); } }; };
  MODELS.nm12 = K => { // Captain Bonebeard: skull face, huge grey beard, tricorn with skull & bones, navy coat, cutlass
    const coat = 0x23284a, H = man(K, {legs: [0x3a2a20, 'cloth'], body: [coat, 'cloth'], hand: [0xe6dcc0, 'bone'], boots: 0x1a1410, bw: 0.62, bh: 0.78, bd: 0.36, aw: 0.21});
    hd(K, 'skull', 'bone', 0xe6dcc0, 0.46, 0.5, 0.44, H.head, 0.27, 0);
    const beard = K.grp(0, 0.18, 0.2, H.head); const bm = K.M(0xbcb8b0, 'fur'); K.box(0.46, 0.4, 0.14, bm, 0, -0.18, 0, beard); K.cone(0.2, 0.5, bm, 0, -0.55, 0, beard, 6).rotation.x = RR;
    const hat = K.grp(0, 0.55, 0, H.head); const hm = K.M(0x15151c, 'leather'); K.cyl(0.46, 0.5, 0.08, hm, 0, 0, 0, hat, 3).rotation.y = RR / 6; K.cyl(0.27, 0.3, 0.26, hm, 0, 0.14, 0, hat, 12);
    K.box(0.18, 0.16, 0.02, K.face('skull', 'bone', 0xe6dcc0, FACE.skull), 0, 0.15, 0.29, hat);
    for (let i = 0; i < 4; i++) K.sph(0.035, K.M(0xe0b040, 'metal', {em: 0x302000}), 0.12, 0.6 - i * 0.15, 0.19, H.body); K.box(0.66, 0.08, 0.4, K.M(0x7a1a1a, 'cloth'), 0, 0.3, 0, H.body);
    blade(K, H.ra.hand, 0.7, K.M(0xd0d4d8, 'metal'), K.M(0xc09030, 'metal'));
    const tails = strands(K, H.body, K.M(coat, 'cloth', {ds: 1}), 3, {y: 0.05, r: 0.2, sz: 1.2, len: 0.5, w: 0.2, a0: 2.6});
    return {root: H.rig, H, beard, top: H.top + 0.8, r: 0.6, anim(a, dt, s) { beard.rotation.x = Math.sin(s.t * 2) * 0.06; sway(tails, s.t, 0.15, 3); if (s.atk) H.ra.rotation.x = -2.5 + s.atk * 6; if (a.parryT > 0) { a.parryT -= dt; H.ra.rotation.x = -1.6; H.ra.rotation.z = 0.8; } else H.ra.rotation.z = 0; } }; };
  MODELS.nm13 = K => { // Girnin' Wrap: lanky hunched mummy with a huge toothy grin and yellow eyes
    const b = 0xd9cfb2, H = man(K, {legs: [b, 'bandage'], body: [b, 'bandage'], bw: 0.5, bh: 0.72, bd: 0.3, armL: 0.9, aw: 0.17, hunch: 0.35});
    const head = hd(K, 'grin', 'bandage', b, 0.56, 0.56, 0.5, H.head, 0.3, 0.1); eyes(K, H.head, 0.38, 0.36, 0.13, 0.04, 0xffe060);
    const wraps = strands(K, H.head, K.M(0xc8bc9c, 'bandage', {ds: 1}), PH ? 2 : 4, {y: 0.5, r: 0.25, len: 0.5, w: 0.07, a0: 3});
    for (const A of [H.la, H.ra]) claws(K, A.hand, K.M(0x3a2a18, 'bone'), 3, 0.14);
    return {root: H.rig, H, top: 2.3, r: 0.5, anim(a, dt, s) { sway(wraps, s.t, 0.4, 3); H.head.rotation.z = Math.sin(s.t * 6) * (s.mv ? 0.12 : 0.04); if (!a.onGround) { H.la.rotation.x = H.ra.rotation.x = -2.6; } } }; };
  MODELS.nm14 = K => { // Hatman of the Haar: tall thin silhouette, wide-brimmed hat, long coat, two yellow eyes
    const c = 0x0c0c10, H = man(K, {legs: [c, 'cloth'], body: [c, 'cloth'], bw: 0.5, bh: 0.95, bd: 0.28, legH: 1.0, armL: 0.95, aw: 0.14});
    hd(K, 'hatman', 'cloth', 0x08080a, 0.4, 0.48, 0.4, H.head, 0.26, 0); eyes(K, H.head, 0.3, 0.21, 0.08, 0.035, 0xffe040, {halo: 1});
    const hm = K.M(0x060608, 'leather'); K.cyl(0.55, 0.55, 0.04, hm, 0, 0.52, 0, H.head, 18); K.cyl(0.25, 0.27, 0.32, hm, 0, 0.68, 0, H.head, 12);
    const coat = K.grp(0, 0.1, 0, H.body); const cm = K.M(0x0a0a0e, 'cloth', {ds: 1}); const tails = strands(K, coat, cm, 4, {y: 0.1, r: 0.18, sz: 1.2, len: 1.0, w: 0.24, a0: 2.4});
    return {root: H.rig, H, top: 3.0, r: 0.45, anim(a, dt, s) { sway(tails, s.t, s.mv ? 0.3 : 0.06, 6); if (a.seen) { H.ll.rotation.x = H.rl.rotation.x = 0; H.la.rotation.x = H.ra.rotation.x = 0; } } }; };
  MODELS.nm15 = K => { // Ben Troll: hulking grey ogre with a wild white mane, tusks and a boulder
    const sk = 0x8a8c7a, H = man(K, {legs: [0x5a4a3a, 'leather'], body: [sk, 'skin'], hand: [sk, 'skin'], bw: 1.05, bh: 1.0, bd: 0.65, legH: 0.85, armL: 1.15, aw: 0.34, hunch: 0.2});
    hd(K, 'troll', 'skin', sk, 0.64, 0.6, 0.56, H.head, 0.3, 0.1); K.sph(0.11, K.M(0x7a7c6a, 'skin'), 0, 0.28, 0.4, H.head, 1, 0.8, 1);
    for (const x of [-0.18, 0.18]) K.cone(0.04, 0.18, K.M(0xf0ead0, 'bone'), x, 0.16, 0.38, H.head, 5);
    const mane = strands(K, H.head, K.M(0xeeeee8, 'fur', {ds: 1}), PH ? 8 : 14, {y: 0.62, r: 0.3, len: 0.7, w: 0.14, a0: 0.5}); K.box(0.7, 0.2, 0.64, K.M(0xeeeee8, 'fur'), 0, 0.62, 0.06, H.head);
    K.box(1.1, 0.18, 0.7, K.M(0x4a3a2a, 'leather'), 0, 0.08, 0, H.body);
    const rock = K.sph(0.26, K.M(0x7a7468, 'rock'), 0, -0.1, 0.1, H.ra.hand, 1, 0.85, 1, 8); rock.visible = false;
    return {root: H.rig, H, top: 3.3, r: 1.0, anim(a, dt, s) { sway(mane, s.t, 0.1, 2); rock.visible = a.cd2 < 1.0; if (a.cd2 < 1.0) H.ra.rotation.x = -2.6; } }; };
  MODELS.nm16 = K => { // Gnasher Eye: a great veined eyeball with lids, a toothed jaw beneath and dangling nerves
    const g = K.grp(0, 0, 0), body = K.grp(0, 0.9, 0, g), skin = K.M(0x4a2a2a, 'skin');
    const ball = K.sph(0.6, K.M(0xb04040, 'eyeball', {em: 0x200808}), 0, 0, 0, body, 1, 1, 1, PH ? 14 : 22); ball.rotation.y = -RR / 2;
    const lidT = K.grp(0, 0, 0, body), lidB = K.grp(0, 0, 0, body); const lt = new THREE.Mesh(new THREE.SphereGeometry(0.64, PH ? 12 : 18, 8, 0, RR * 2, 0, RR * 0.42), skin); lidT.add(lt); const lb = new THREE.Mesh(new THREE.SphereGeometry(0.64, PH ? 12 : 18, 8, 0, RR * 2, RR * 0.62, RR * 0.38), skin); lidB.add(lb);
    const jaw = K.grp(0, -0.62, 0.15, body); K.box(0.8, 0.12, 0.5, skin, 0, 0, 0, jaw); const tm = K.M(0xf0e8d0, 'bone'); for (let i = 0; i < 7; i++) K.cone(0.04, 0.16, tm, -0.3 + i * 0.1, 0.12, 0.22, jaw, 5);
    const top = K.grp(0, -0.48, 0.15, body); K.box(0.8, 0.08, 0.5, skin, 0, 0, 0, top); for (let i = 0; i < 7; i++) K.cone(0.04, 0.16, tm, -0.3 + i * 0.1, -0.1, 0.22, top, 5).rotation.x = RR;
    const nerves = strands(K, body, K.M(0x8a3030, 'skin', {ds: 1}), PH ? 5 : 8, {y: -0.6, r: 0.25, len: 0.7, w: 0.05});
    return {root: g, head: body, top: 1.6, r: 0.7, anim(a, dt, s) { const bl = (s.t % 4) < 0.15 ? 1 : 0; lidT.rotation.x = -0.2 + bl * 0.9 - (a.beamT ? 0.3 : 0); lidB.rotation.x = 0.2 - bl * 0.9 + (a.beamT ? 0.3 : 0); jaw.position.y = -0.62 - (s.atk || Math.sin(s.t * 7) > 0.7 ? 0.12 : 0); body.rotation.x = Math.sin(s.t) * 0.08; sway(nerves, s.t, 0.4, 2.5);
        if (a.beamT) ball.scale.setScalar(1 + Math.sin(s.t * 40) * 0.03); } }; };
  MODELS.nm17 = K => { // Ironjaw: massive brute in an iron face-cage, spiked pauldrons, chains and huge fists
    const sk = 0x6a5a50, H = man(K, {legs: [0x2a2a2e, 'leather'], body: [sk, 'skin'], hand: [0x3a3c42, 'metal'], bw: 1.1, bh: 1.0, bd: 0.66, legH: 0.85, armL: 1.15, aw: 0.36});
    hd(K, 'iron', 'metal', 0x4a4d55, 0.6, 0.62, 0.56, H.head, 0.3, 0.05); const mS = K.M(0x4a4d55, 'metal');
    for (const s of [-1, 1]) { K.sph(0.3, mS, s * 0.62, 0.9, 0, H.body, 1, 0.6, 1); for (let i = 0; i < 3; i++) K.cone(0.05, 0.22, K.M(0x8a8e96, 'metal'), s * (0.5 + i * 0.1), 1.08, -0.1 + i * 0.1, H.body, 5); }
    const ch = K.M(0x6a6c70, 'metal'); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 4, 8), ch); l.position.set(-0.45 + i * 0.18, 0.8 - i * 0.12, 0.34); l.rotation.y = i % 2 ? RR / 2 : 0; H.body.add(l); }
    for (const A of [H.la, H.ra]) K.box(0.42, 0.36, 0.42, K.M(0x3a3c42, 'metal'), 0, -1.05, 0, A);
    return {root: H.rig, H, top: 3.2, r: 1.0, anim(a, dt, s) { if (s.atk) { H.ra.rotation.x = -1.8 + s.atk * 4; H.la.rotation.x = -1.8 + s.atk * 4; } H.body.rotation.y = Math.sin(s.t * 4) * (s.mv ? 0.12 : 0.03); } }; };
  MODELS.nm18 = K => { // Glaur Blob: translucent bog slime with a single bobbing eye and dripping lumps
    const g = K.grp(0, 0, 0), body = K.grp(0, 0, 0, g), sl = K.M(0x6f8a4a, 'slime', {op: 0.82, em: 0x1a2a0a});
    K.sph(0.62, sl, 0, 0.55, 0, body, 1.1, 0.85, 1, PH ? 12 : 18); K.sph(0.3, K.M(0x3a5a20, 'slime'), 0.1, 0.45, -0.1, body);
    const eye = K.grp(0, 0.7, 0.4, body); K.sph(0.2, K.M(0xffffff, 'eyeball', {em: 0x202020}), 0, 0, 0, eye).rotation.y = -RR / 2;
    const drips = []; for (let i = 0; i < (PH ? 4 : 7); i++) { const an = i * 0.9; const d = K.cone(0.07, 0.3, sl, Math.sin(an) * 0.55, 0.2, Math.cos(an) * 0.5, body, 6); d.rotation.x = RR; d.userData.ph = i; drips.push(d); }
    return {root: g, head: eye, body, top: 1.2, r: 0.7, anim(a, dt, s) { eye.position.y = 0.7 + Math.sin(s.t * 3) * 0.04; eye.rotation.y = Math.sin(s.t * 0.7) * 0.5; drips.forEach(d => d.scale.y = 1 + Math.sin(s.t * 3 + d.userData.ph) * 0.35); } }; };
  MODELS.nm19 = K => { // Heather Shade: glowing purple phantom, sharp brows and grin, swirling tail, splayed hands
    const pu = 0x9a7ad8, H = man(K, {noLegs: 1, robe: [pu, 'wisp'], legs: [pu, 'wisp'], body: [pu, 'wisp'], bw: 0.56, bh: 0.62, bd: 0.3, robeH: 0.8, robeY: 0.3, armL: 0.85, aw: 0.16});
    for (const m of [H.mL, H.mB, H.mA]) m.emissive.set(0x40206a), m.userData.e0 = m.emissive.clone();
    hd(K, 'shade', 'wisp', 0xa080e0, 0.48, 0.5, 0.44, H.head, 0.27, 0, {em: 0x40206a});
    const tail = K.grp(0, 0.3, 0, H.rig); K.cone(0.3, 0.7, K.M(pu, 'wisp', {em: 0x40206a, op: 0.8}), 0, -0.2, 0, tail, 8).rotation.x = RR;
    const orbs = []; for (let i = 0; i < 3; i++) orbs.push(K.sph(0.06, glow(K, 0xe0c0ff), 0, 1.4, 0, H.rig, 1, 1, 1, 6));
    for (const A of [H.la, H.ra]) claws(K, A.hand, K.M(0xc0a0ff, null, {em: 0x6040a0}), 4, 0.16);
    return {root: H.rig, H, top: 2.4, r: 0.5, anim(a, dt, s) { tail.rotation.z = Math.sin(s.t * 3) * 0.3; orbs.forEach((o, i) => { const q = s.t * 2 + i * 2.09; o.position.set(Math.sin(q) * 0.6, 1.4 + Math.sin(q * 2) * 0.2, Math.cos(q) * 0.6); }); H.la.rotation.z = 0.6 + Math.sin(s.t * 2) * 0.2; H.ra.rotation.z = -0.6 - Math.sin(s.t * 2) * 0.2; } }; };
  MODELS.nm20 = K => { // Haar Wraith: a column of drifting sea-mist puffs with a hollow-eyed face
    const g = K.grp(0, 0, 0), puffs = [], mm = K.M(0xd8dee4, 'wisp', {op: 0.45, em: 0x404850});
    for (let i = 0; i < (PH ? 6 : 10); i++) { const p = K.sph(0.35 + (i % 3) * 0.1, mm, Math.sin(i * 2.1) * 0.25, 0.3 + i * 0.18, Math.cos(i * 2.1) * 0.2, g, 1, 0.8, 1, 10); p.userData.ph = i; puffs.push(p); }
    const face = K.grp(0, 1.65, 0.38, g); const fm = K.face('haar', 'wisp', 0xd8dee4, FACE.haar); fm.transparent = true; face.add(new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), fm));
    const arms = []; for (const s of [-1, 1]) { const A = K.grp(s * 0.4, 1.4, 0.1, g); for (let i = 0; i < 3; i++) K.sph(0.13 - i * 0.03, mm, s * i * 0.18, -i * 0.12, 0.1, A, 1, 1, 1, 8); arms.push(A); }
    return {root: g, head: face, la: arms[0], ra: arms[1], top: 2.1, r: 0.55, anim(a, dt, s) { puffs.forEach(p => { const k = p.userData.ph; p.position.x = Math.sin(k * 2.1 + s.t * 0.8) * 0.28; p.scale.setScalar(1 + Math.sin(s.t * 1.5 + k) * 0.12); }); arms.forEach((A, i) => A.rotation.z = (i ? -1 : 1) * Math.sin(s.t + i) * 0.3 + (s.atk ? (i ? 1 : -1) : 0)); } }; };
  MODELS.nm21 = K => { // Plaguebeak Knight: dark plate armour, long beaked mask with green lenses, cape, a smoking censer
    const st = 0x50554e, H = man(K, {legs: [st, 'metal'], body: [st, 'metal'], boots: 0x202420, bw: 0.64, bh: 0.8, bd: 0.38, aw: 0.22});
    const mS = K.M(st, 'metal'), lth = K.M(0x2a2018, 'leather'); K.box(0.48, 0.5, 0.46, lth, 0, 0.27, 0, H.head);
    const beak = K.cone(0.12, 0.55, K.M(0x3a2e22, 'leather'), 0, 0.22, 0.48, H.head, 8); beak.rotation.x = RR / 2 + 0.25;
    for (const x of [-0.12, 0.12]) { const l = K.cyl(0.08, 0.08, 0.05, mS, x, 0.34, 0.24, H.head, 10); l.rotation.x = RR / 2; K.sph(0.06, glow(K, 0x80ff60), x, 0.34, 0.27, H.head, 1, 1, 0.4, 8); }
    K.cyl(0.32, 0.35, 0.2, mS, 0, 0.58, 0, H.head, 12); K.cyl(0.42, 0.42, 0.03, mS, 0, 0.5, 0, H.head, 16);
    for (const s of [-1, 1]) K.sph(0.2, mS, s * 0.38, 0.76, 0, H.body, 1, 0.7, 1.1);
    const cape = K.grp(0, 0.75, -0.2, H.body); K.box(0.8, 1.4, 0.03, K.M(0x2a3a22, 'cloth', {ds: 1}), 0, -0.68, 0, cape);
    const cen = K.grp(0, -0.72, 0.05, H.la); for (let i = 0; i < 3; i++) K.cyl(0.008, 0.008, 0.15, mS, 0, -0.08 - i * 0.15, 0, cen, 4); const pot = K.sph(0.1, mS, 0, -0.5, 0, cen); K.sph(0.06, glow(K, 0x80ff40), 0, -0.47, 0.07, cen, 1, 1, 0.5, 6);
    return {root: H.rig, H, top: H.top + 0.7, r: 0.6, anim(a, dt, s) { cape.rotation.x = 0.1 + (s.mv ? 0.25 : 0) + Math.sin(s.t * 2) * 0.04; cen.rotation.x = Math.sin(s.t * 3) * 0.5; H.la.rotation.x = -0.4; if (Math.random() < dt * 4) try { const v = new THREE.Vector3(); pot.getWorldPosition(v); burst(v.x, v.y, v.z, 0x7ac040, 1, 0.15); } catch (_) {} } }; };
  MODELS.nm22 = K => { // Storm Bogle: a boiling thundercloud with a scowling face, crackling bolts underneath
    const g = K.grp(0, 0, 0), body = K.grp(0, 1.2, 0, g), cm = K.M(0x8a96aa, 'wisp', {em: 0x182030}), dk = K.M(0x5a6478, 'wisp', {em: 0x101828}), puffs = [];
    const spots = [[0, 0, 0, 0.8], [-0.75, -0.1, 0, 0.55], [0.75, -0.05, 0, 0.6], [-0.35, 0.45, -0.1, 0.5], [0.4, 0.4, -0.1, 0.5], [0, -0.3, -0.3, 0.6], [-1.15, -0.25, -0.1, 0.35], [1.15, -0.2, -0.1, 0.38]];
    spots.slice(0, PH ? 6 : 8).forEach(([x, y, z, r], i) => { const p = K.sph(r, i % 2 ? dk : cm, x, y, z, body, 1, 0.8, 0.9, 12); p.userData.ph = i; puffs.push(p); });
    const face = K.grp(0, 0.05, 0.66, body); face.add(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), (() => { const m = K.face('storm', 'wisp', 0x8a96aa, FACE.storm, {em: 0x182030}); m.transparent = true; return m; })()));
    const bolts = []; const bm = glow(K, 0xfff4a0); for (let i = 0; i < 4; i++) { const b = K.grp(-0.6 + i * 0.4, -0.5, 0.1, body); let y = 0; for (let k = 0; k < 3; k++) { const s = K.box(0.05, 0.3, 0.05, bm, (k % 2 ? 0.06 : -0.06), y - 0.13, 0, b); s.rotation.z = k % 2 ? 0.5 : -0.5; y -= 0.26; } bolts.push(b); }
    return {root: g, head: face, body, top: 2.2, r: 1.0, anim(a, dt, s) { puffs.forEach(p => p.scale.setScalar(1 + Math.sin(s.t * 2 + p.userData.ph) * 0.08)); bolts.forEach((b, i) => b.visible = ((s.t * 7 + i * 3) | 0) % 4 === 0 || a.cd2 < 0.5); body.rotation.y = Math.sin(s.t * 0.5) * 0.15; } }; };
  MODELS.nm23 = K => { // Bigeye Diver: diving suit whose helmet glass holds one enormous staring eye, flippers, harpoon
    const suit = 0x52626a, H = man(K, {legs: [suit, 'leather'], body: [suit, 'leather'], hand: [0x2a3034, 'leather'], bw: 0.62, bh: 0.74, bd: 0.4, aw: 0.24});
    const brass = K.M(0x9a8a60, 'metal'); K.cyl(0.42, 0.44, 0.12, brass, 0, 0.02, 0, H.head, 14);
    const eye = K.grp(0, 0.34, 0, H.head); const ball = K.sph(0.32, K.M(0x40a0c0, 'eyeball', {em: 0x101818}), 0, 0, 0, eye, 1, 1, 1, PH ? 14 : 20); ball.rotation.y = -RR / 2;
    K.sph(0.38, K.M(0xb0e8ff, null, {op: 0.25}), 0, 0.34, 0, H.head, 1, 1, 1, PH ? 12 : 18);
    for (const L of [H.ll, H.rl]) { const f = K.box(0.3, 0.04, 0.5, K.M(0x1a2a30, 'leather'), 0, -0.72, 0.2, L); }
    const tank = K.cyl(0.13, 0.13, 0.55, K.M(0xc0a040, 'metal'), 0, 0.42, -0.28, H.body, 10);
    const hp = K.grp(0, -0.7, 0.05, H.ra); hp.rotation.x = -RR / 2; K.cyl(0.02, 0.02, 1.0, K.M(0x5a4a30, 'wood'), 0, 0.3, 0, hp, 5); K.cone(0.05, 0.16, K.M(0xb0b8c0, 'metal'), 0, 0.86, 0, hp, 5);
    return {root: H.rig, H, top: H.top + 0.7, r: 0.6, anim(a, dt, s) { const dx = P.x - a.g.position.x, dz = P.z - a.g.position.z; eye.rotation.y = Math.max(-0.6, Math.min(0.6, Math.atan2(dx, dz) - a.yawVis)); eye.rotation.x = Math.sin(s.t * 0.9) * 0.15; } }; };
  MODELS.nm24 = K => { // Bane Shaman: robed in hides, bone necklace, skull mask with a feather crown, glowing skull staff
    const c = 0x5a3a2a, H = man(K, {noLegs: 1, robe: [c, 'leather'], legs: [c, 'leather'], body: [0x6a4a32, 'leather'], hand: [0x5a4030, 'skin'], bw: 0.6, bh: 0.7, bd: 0.36, robeH: 1.0, armL: 0.8, aw: 0.18});
    hd(K, 'shaman', 'bone', 0xece2c8, 0.5, 0.56, 0.46, H.head, 0.29, 0);
    const fe = [0x202020, 0xc03020, 0xe0d0a0]; for (let i = 0; i < (PH ? 5 : 9); i++) { const an = -1.1 + i * (2.2 / ((PH ? 5 : 9) - 1)); const f = K.box(0.06, 0.5, 0.02, K.M(fe[i % 3], 'cloth'), Math.sin(an) * 0.24, 0.75, -0.05 + Math.cos(an) * 0.1, H.head); f.rotation.z = -an * 0.6; }
    const bone = K.M(0xe8e0c8, 'bone'); for (let i = 0; i < 7; i++) { const an = -1.2 + i * 0.4; const b = K.cyl(0.025, 0.02, 0.12, bone, Math.sin(an) * 0.3, 0.6 - Math.cos(an) * 0.12, 0.19, H.body, 5); }
    const st = K.grp(0, -0.75, 0.05, H.ra); K.cyl(0.03, 0.03, 1.5, K.M(0x3a2410, 'wood'), 0, 0.3, 0.1, st, 6); const sk = K.grp(0, 1.1, 0.1, st); hd(K, 'shaman', 'bone', 0xece2c8, 0.18, 0.2, 0.18, sk, 0, 0); const sg = K.sph(0.16, glow(K, 0x60ff70, 0.3), 0, 0.1, 0, sk, 1, 1, 1, 8);
    return {root: H.rig, H, top: 2.6, r: 0.55, anim(a, dt, s) { sg.scale.setScalar(1 + Math.sin(s.t * 4) * 0.25); H.ra.rotation.x = -0.3 + (a.cd2 < 1 ? -1.2 : 0) + s.atk * 2; H.la.rotation.x = a.cd2 < 1 ? -2.4 + Math.sin(s.t * 12) * 0.3 : H.la.rotation.x; } }; };
  MODELS.nm25 = K => { // Bog Gowk: squat swamp ghoul, huge bulging bug eyes, gaping mouth, webbed feet, reeds stuck to it
    const sk = 0x6a7a52, H = man(K, {legs: [sk, 'skin'], body: [0x4a5a3a, 'cloth'], hand: [sk, 'skin'], bw: 0.66, bh: 0.6, bd: 0.4, legH: 0.5, armL: 0.75, aw: 0.2, hunch: 0.3});
    hd(K, 'gowk', 'skin', sk, 0.6, 0.48, 0.52, H.head, 0.24, 0.05);
    const ey = []; for (const s of [-1, 1]) { const e = K.grp(s * 0.18, 0.45, 0.2, H.head); K.sph(0.15, K.M(0xffffff, 'eyeball', {em: 0x202020}), 0, 0, 0.02, e).rotation.y = -RR / 2; ey.push(e); }
    for (const L of [H.ll, H.rl]) K.box(0.3, 0.05, 0.36, K.M(0x4a5a32, 'skin'), 0, -0.48, 0.1, L);
    const reeds = strands(K, H.body, K.M(0x7a7a3a, 'weed', {ds: 1}), PH ? 3 : 6, {y: 0.6, r: 0.3, sz: 0.7, len: 0.5, w: 0.04, tilt: -0.3});
    return {root: H.rig, H, top: 1.8, r: 0.55, anim(a, dt, s) { ey.forEach((e, i) => e.scale.setScalar(1 + Math.sin(s.t * 5 + i) * 0.08)); sway(reeds, s.t, 0.2, 2); if (!a.onGround) { H.ll.rotation.x = -0.9; H.rl.rotation.x = -0.9; H.la.rotation.x = H.ra.rotation.x = -2.2; } } }; };
  MODELS.nm26 = K => { // Drowned Deckhand: waterlogged pirate in a striped shirt and bandana, barnacles, glowing red eyes
    const sk = 0x5a7a62, H = man(K, {legs: [0x2a3040, 'cloth'], body: [0x3a4a6a, 'stripes'], hand: [sk, 'skin'], bw: 0.56, bh: 0.72, bd: 0.32});
    hd(K, 'zombie', 'skin', sk, 0.48, 0.5, 0.46, H.head, 0.27, 0);
    K.box(0.52, 0.14, 0.5, K.M(0x9a2020, 'cloth'), 0, 0.48, 0, H.head); const knot = K.grp(0, 0.45, -0.26, H.head); K.box(0.1, 0.25, 0.03, K.M(0x9a2020, 'cloth'), 0.05, -0.12, 0, knot).rotation.z = 0.3;
    const bm = K.M(0xc8c0a8, 'rock'); for (let i = 0; i < (PH ? 4 : 8); i++) K.sph(0.04 + (i % 3) * 0.015, bm, -0.25 + (i * 0.17) % 0.5, 0.15 + (i * 0.23) % 0.6, 0.17, H.body, 1, 0.6, 1, 6);
    const weed = strands(K, H.body, K.M(0x3a5a2a, 'weed', {ds: 1}), PH ? 2 : 4, {y: 0.7, r: 0.3, sz: 0.6, len: 0.6, w: 0.06});
    blade(K, H.ra.hand, 0.45, K.M(0x8a7a5a, 'metal'), K.M(0x4a3020, 'wood'));
    return {root: H.rig, H, top: H.top + 0.55, r: 0.55, anim(a, dt, s) { sway(weed, s.t, 0.3, 1.6); H.head.rotation.z = Math.sin(s.t * 1.2 + (a.slot || 0)) * 0.12; } }; };
  MODELS.nm27 = K => { // Hookhand Haunt: see-through ghost sailor, sou'wester hat, pipe and beard, an iron hook for a hand
    const c = 0x9fb4bf, H = man(K, {noLegs: 1, robe: [c, 'wisp'], legs: [c, 'wisp'], body: [0x7a92a0, 'cloth'], hand: [c, 'wisp'], bw: 0.6, bh: 0.72, bd: 0.36, robeH: 0.85, robeY: 0.2, armL: 0.8, aw: 0.2});
    for (const m of [H.mL, H.mB, H.mA]) m.emissive.set(0x203440), m.userData.e0 = m.emissive.clone();
    hd(K, 'sailor', 'wisp', 0xb8ccd6, 0.48, 0.5, 0.44, H.head, 0.27, 0, {em: 0x203440});
    const hat = K.M(0xd8b040, 'leather', {em: 0x302810}); K.cyl(0.4, 0.44, 0.05, hat, 0, 0.52, -0.04, H.head, 14).rotation.x = -0.15; K.sph(0.27, hat, 0, 0.55, 0, H.head, 1, 0.7, 1);
    const beard = K.box(0.48, 0.3, 0.12, K.M(0xe0e8ec, 'fur', {em: 0x202830}), 0, 0.04, 0.2, H.head);
    const pipe = K.grp(0.12, 0.14, 0.28, H.head); K.cyl(0.015, 0.015, 0.2, K.M(0x3a2410, 'wood'), 0, 0, 0.08, pipe, 5).rotation.x = RR / 2; K.cyl(0.04, 0.035, 0.08, K.M(0x3a2410, 'wood'), 0, 0.03, 0.18, pipe, 6);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 12, RR * 1.3), K.M(0x6a6c70, 'metal')); hook.position.set(0, -0.18, 0.02); hook.rotation.y = RR / 2; H.ra.hand.add(hook);
    const rope = K.cyl(0.015, 0.015, 1, K.M(0x8a7a50, 'cloth'), 0, 0, 0, null, 4); rope.visible = false; H.rig.add(rope);
    return {root: H.rig, H, top: 2.3, r: 0.55, anim(a, dt, s) { if (a.hookT > 0) { H.ra.rotation.x = -2.6; hook.scale.setScalar(1.4); } else { hook.scale.setScalar(1); H.ra.rotation.x = -0.4 + Math.sin(s.t * 2) * 0.2; } pipe.rotation.z = Math.sin(s.t) * 0.1; if (Math.random() < dt * 0.5) try { const v = new THREE.Vector3(); pipe.getWorldPosition(v); mistPuff ? mistPuff(v.x, v.y + 0.1, v.z, 0xb8c0c0, 2) : 0; } catch (_) {} } }; };
  MODELS.nm28 = K => { // Star Hound: ghostly cù-sìth made of night sky - starry coat, glowing eyes and collar tag, a comet tail
    const g = K.grp(0, 0, 0), sm = K.M(0x2a3a6a, 'stars', {em: 0x203a70}), dk = K.M(0x1a2448, 'stars', {em: 0x102040});
    const body = K.grp(0, 0.75, 0, g); K.box(0.52, 0.48, 1.1, sm, 0, 0, 0, body); K.box(0.56, 0.5, 0.4, sm, 0, 0.04, 0.38, body);
    const legs = []; for (const [x, z] of [[-.18, .4], [.18, .4], [-.18, -.4], [.18, -.4]]) { const L = K.grp(x, -0.18, z, body); K.box(0.15, 0.55, 0.15, dk, 0, -0.27, 0, L); K.box(0.18, 0.08, 0.22, dk, 0, -0.55, 0.03, L); legs.push(L); }
    const head = K.grp(0, 0.2, 0.62, body); K.box(0.42, 0.38, 0.4, sm, 0, 0.05, 0, head); K.box(0.26, 0.2, 0.3, dk, 0, -0.04, 0.3, head); K.box(0.1, 0.08, 0.06, glow(K, 0x101020), 0, 0.02, 0.46, head);
    eyes(K, head, 0.12, 0.2, 0.11, 0.045, 0x80e0ff, {halo: 1}); for (const s of [-1, 1]) K.cone(0.08, 0.26, dk, s * 0.14, 0.34, -0.05, head, 4);
    const jaw = K.grp(0, -0.14, 0.2, head); K.box(0.24, 0.06, 0.28, dk, 0, 0, 0.08, jaw);
    K.cyl(0.24, 0.24, 0.06, K.M(0xc03030, 'leather'), 0, 0.1, 0.5, body, 10).rotation.x = RR / 2 - 0.4; K.sph(0.05, glow(K, 0xffe080), 0, -0.06, 0.64, body, 1, 1, 0.4, 6);
    const tail = K.grp(0, 0.15, -0.55, body); K.cone(0.12, 0.7, K.M(0x80b0ff, 'wisp', {em: 0x4060a0, op: 0.7}), 0, 0.3, 0, tail, 6); tail.rotation.x = -0.9;
    return {root: g, head, body, legs4: legs, top: 1.4, r: 0.6, anim(a, dt, s) { tail.rotation.z = Math.sin(s.t * 8) * 0.4; jaw.rotation.x = s.atk ? 0.7 : 0.05; head.rotation.x = a.sndT > 4.5 ? -0.6 : 0; body.position.y = 0.75 + Math.sin(s.t * 3) * 0.05; } }; };
  MODELS.nm29 = K => { // Rain Wean: small pale ghost girl, long white hair over her face, white smock, a little raincloud overhead
    const c = 0xeef2f4, H = man(K, {noLegs: 1, robe: [c, 'cloth'], legs: [c, 'cloth'], body: [c, 'cloth'], hand: [0xdfe6ea, 'skin'], bw: 0.44, bh: 0.5, bd: 0.26, robeH: 0.8, robeY: 0.05, armL: 0.55, aw: 0.12});
    for (const m of [H.mL, H.mB, H.mA]) { m.emissive.set(0x303840); m.userData.e0 = m.emissive.clone(); }
    hd(K, 'girl', 'skin', 0xdfe6ea, 0.38, 0.42, 0.36, H.head, 0.22, 0, {em: 0x303840});
    const hm = K.M(0xf4f6f8, 'fur', {ds: 1, em: 0x404850}); K.box(0.42, 0.12, 0.4, hm, 0, 0.45, 0, H.head);
    const hair = strands(K, H.head, hm, PH ? 8 : 14, {y: 0.44, r: 0.2, len: 0.75, w: 0.07});
    const cloud = K.grp(0, 2.3, 0, H.rig); const cm = K.M(0x6a7480, 'wisp', {em: 0x101418}); for (const [x, y, r] of [[0, 0, 0.35], [-0.35, -0.05, 0.25], [0.35, -0.04, 0.27]]) K.sph(r, cm, x, y, 0, cloud, 1, 0.7, 0.9, 10);
    const drops = []; const dm = glow(K, 0xb0d0ff, 0.7); for (let i = 0; i < (PH ? 6 : 12); i++) { const d = K.box(0.015, 0.12, 0.015, dm, (Math.random() - .5) * 0.8, -0.3, (Math.random() - .5) * 0.6, cloud); d.userData.ph = Math.random() * 2; drops.push(d); }
    return {root: H.rig, H, top: 2.1, r: 0.45, anim(a, dt, s) { sway(hair, s.t, 0.06, 1.2); drops.forEach(d => { d.position.y = -0.3 - ((s.t * 1.6 + d.userData.ph) % 2) * 0.9; }); H.head.rotation.x = 0.35 + Math.sin(s.t * 6) * 0.03; H.la.rotation.x = -1.8; H.ra.rotation.x = -1.8; H.la.rotation.z = -0.5; H.ra.rotation.z = 0.5;
        if (a.cd > 5) { H.head.rotation.x = -0.4; H.la.rotation.x = H.ra.rotation.x = -2.8; } } }; };
  // minions
  MODELS.nmwisp = K => { const g = K.grp(0, 0, 0), sk = K.grp(0, 0.5, 0, g); hd(K, 'shaman', 'bone', 0xece2c8, 0.4, 0.42, 0.38, sk, 0, 0); const h = K.sph(0.34, glow(K, 0x60ff70, 0.25), 0, 0.2, 0, sk, 1, 1, 1, 8); const t = K.cone(0.18, 0.5, glow(K, 0x60ff70, 0.3), 0, 0.0, -0.25, sk, 6); t.rotation.x = -RR / 2;
    return {root: g, head: sk, top: 1.0, r: 0.4, anim(a, dt, s) { h.scale.setScalar(1 + Math.sin(s.t * 8) * 0.15); sk.rotation.z = Math.sin(s.t * 4) * 0.2; } }; };
  MODELS.nmdrop = K => { const m = MODELS.nm18(K); m.root.scale.setScalar(0.5); m.top = 0.6; m.r = 0.35; return m; };
  // ===== v1.0.7: new deep-water night mobs =====
  Object.assign(FACE, {
    selkie(g, n) { F.rect(g, n, 0, 0, 1, 1, '#c8d4dc'); F.eye(g, n, .32, .44, .11, '#0a1018'); F.eye(g, n, .68, .44, .11, '#0a1018'); F.glow(g, n, .3, .41, .025, '#e0f4ff'); F.glow(g, n, .66, .41, .025, '#e0f4ff');
      F.brow(g, n, .45, .58, .5, .62, .02, 'rgba(60,70,80,.6)'); g.strokeStyle = '#506070'; g.lineWidth = n * .02; g.beginPath(); g.arc(n * .5, n * .66, n * .1, .4, Math.PI - .4); g.stroke(); for (let i = 0; i < 5; i++) F.rect(g, n, .2 + i * .14, .86, .03, .1, 'rgba(120,150,170,.4)'); },
    kelpie(g, n) { F.glow(g, n, .25, .3, .06, '#40ffd0'); F.glow(g, n, .75, .3, .06, '#40ffd0'); F.hole(g, n, .35, .8, .06, .05, '#05100c'); F.hole(g, n, .65, .8, .06, .05, '#05100c'); F.teeth(g, n, .5, .93, .5, .08, 7, '#d8e8d0'); },
    beastie(g, n) { F.eye(g, n, .22, .4, .09, '#ffe060', '#200'); F.eye(g, n, .78, .4, .09, '#ffe060', '#200'); F.hole(g, n, .5, .78, .3, .07, '#140a06'); F.teeth(g, n, .5, .78, .34, .08, 6, '#e8e0c0'); F.hole(g, n, .42, .6, .03, .02); F.hole(g, n, .58, .6, .03, .02); },
    eel(g, n) { F.glow(g, n, .25, .35, .07, '#80e0ff'); F.glow(g, n, .75, .35, .07, '#80e0ff'); F.hole(g, n, .5, .78, .4, .12, '#0a0606'); F.teeth(g, n, .5, .78, .44, .14, 8, '#f0f0e0'); },
  });
  MODELS.nm30 = K => { // Crackle Conger: long scaly eel serpent, glowing blue lateral lights, frilled fins, crackling jaw
    const g = K.grp(0, 0.5, 0), sc = K.M(0x2a4a3a, 'scales', {em: 0x0a1814}), belly = K.M(0x8aa080, 'scales'), fin = K.M(0x5a9a8a, 'wisp', {op: 0.75, ds: 1}), lt = glow(K, 0x80e0ff);
    const head = K.grp(0, 0, 0.5, g); hd(K, 'eel', 'scales', 0x2a4a3a, 0.34, 0.28, 0.5, head, 0, 0.0);
    const jaw = K.grp(0, -0.12, 0.05, head); K.box(0.3, 0.07, 0.42, belly, 0, -0.03, 0.08, jaw); K.box(0.04, 0.16, 0.3, fin, 0, 0.2, -0.05, head);
    const N = PH ? 7 : 10, segs = [];
    for (let i = 0; i < N; i++) { const r = 0.17 * (1 - i / N * 0.75); const s = K.grp(0, 0, -i * 0.3, g); K.sph(r, sc, 0, 0, 0, s, 1, 0.95, 1.6, PH ? 8 : 10); K.sph(r * 0.8, belly, 0, -r * 0.3, 0, s, 1, 0.6, 1.5, 6);
      if (i % 2 === 0) for (const x of [-1, 1]) K.sph(0.025, lt, x * r * 0.95, 0.02, 0, s, 1, 1, 1, 4); K.box(0.02, r * 1.1, 0.3, fin, 0, r + 0.04, 0, s); segs.push(s); }
    const z0 = segs.map(s => s.position.z);
    return {root: g, head, top: 0.9, r: 0.5, anim(a, dt, s) { const sp = s.mv ? 7 : 3.5, amp = s.mv ? 0.28 : 0.14; let px = 0;
      for (let i = 0; i < N; i++) { const x = Math.sin(s.t * sp - i * 0.75) * amp * (0.3 + i / N); segs[i].position.x = x; segs[i].rotation.y = Math.cos(s.t * sp - i * 0.75) * 0.5 * (i / N); px = x; }
      head.position.x = Math.sin(s.t * sp + 0.7) * amp * 0.25; jaw.rotation.x = s.atk > 0 ? 0.6 : 0.08 + Math.sin(s.t * 3) * 0.06;
      const z = a.shockT > 0 ? (a.shockT -= dt, 1) : 0; lt.color.setHex(z && Math.random() < 0.5 ? 0xffffff : 0x80e0ff); } }; };
  MODELS.nm31 = K => { // Moonlit Selkie: pale sea-woman with a spotted seal-skin cloak, long dark hair and a seal tail
    const H = man(K, {noLegs: 1, robe: [0x8a96a0, 'fur'], legs: [0x6a7680, 'fur'], body: [0xb8c8d0, 'skin'], hand: [0xc8d4dc, 'skin'], bw: 0.46, bh: 0.62, bd: 0.3, robeH: 0.5, aw: 0.15, armL: 0.7});
    hd(K, 'selkie', 'skin', 0xc8d4dc, 0.42, 0.48, 0.4, H.head, 0.26, 0, {op: 0.92});
    const hair = K.M(0x1a1a22, 'fur'); K.box(0.46, 0.14, 0.44, hair, 0, 0.52, -0.01, H.head); const locks = strands(K, H.head, hair, PH ? 6 : 10, {y: 0.5, r: 0.21, len: 0.9, w: 0.09, tilt: 0.08, a0: 1.2, sz: 0.9});
    const cloak = K.M(0x6a7884, 'fur', {ds: 1}); const cp = K.grp(0, 0.6, -0.17, H.body); K.box(0.6, 1.1, 0.04, cloak, 0, -0.5, 0, cp);
    for (let i = 0; i < 8; i++) K.sph(0.04, K.M(0x3a4650, null), (i % 3 - 1) * 0.18, -0.2 - i * 0.1, -0.03, cp, 1, 1, 0.3, 5);
    const tail = K.grp(0, -0.05, 0, H.rig); K.cone(0.22, 0.9, K.M(0x5a6670, 'fur'), 0, -0.4, 0, tail, 8).rotation.x = Math.PI; const fl = K.grp(0, -0.85, 0, tail); K.box(0.5, 0.04, 0.24, K.M(0x3a444c, 'leather'), 0, 0, 0, fl);
    const shine = glow(K, 0xd0e8ff, 0.5); K.sph(0.06, shine, 0, 0.9, 0.3, H.head, 1, 1, 1, 6);
    return {root: H.rig, H, top: H.top + 0.4, r: 0.45, anim(a, dt, s) { const sp = s.mv ? 5 : 2; tail.rotation.x = Math.sin(s.t * sp) * 0.35; fl.rotation.x = Math.sin(s.t * sp - 1) * 0.5; sway(locks, s.t, 0.25, 1.5); cp.rotation.x = 0.15 + Math.sin(s.t * 1.7) * 0.12;
      if (a.singT > 0) { H.la.rotation.x = -2.2 + Math.sin(s.t * 3) * 0.2; H.ra.rotation.x = -2.2 - Math.sin(s.t * 3) * 0.2; H.la.rotation.z = -0.5; H.ra.rotation.z = 0.5; shine.opacity = 0.9; } else { H.la.rotation.z = -0.1; H.ra.rotation.z = 0.1; shine.opacity = 0.35; } } }; };
  MODELS.nm32 = K => { // Wraith Jeelie: ghostly glowing jellyfish bell with a skull-shaped core, frilled oral arms and long trailing tentacles
    const g = K.grp(0, 1.1, 0), bellM = K.M(0xb080ff, null, {basic: 1, op: 0.45, ds: 1}), rim = K.M(0xe0c0ff, null, {basic: 1, op: 0.7}), core = glow(K, 0xf0e0ff, 0.85);
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.55, PH ? 12 : 18, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), bellM); g.add(bell);
    const rr = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.035, 5, PH ? 14 : 22), rim); rr.rotation.x = Math.PI / 2; rr.position.y = -0.08; g.add(rr);
    const sk = K.grp(0, 0.18, 0, g); K.sph(0.2, core, 0, 0, 0, sk, 1, 0.9, 1, 8); for (const x of [-1, 1]) K.sph(0.05, K.M(0x301050, null, {basic: 1}), x * 0.08, 0.02, 0.16, sk, 1, 1.2, 0.5, 6); K.box(0.12, 0.03, 0.02, K.M(0x301050, null, {basic: 1}), 0, -0.09, 0.18, sk);
    const tm = K.M(0xd0a0ff, 'wisp', {op: 0.6, ds: 1, em: 0x6030a0}); const ten = strands(K, g, tm, PH ? 8 : 12, {y: -0.1, r: 0.4, len: 1.4, w: 0.04, tilt: 0.05});
    const arms = strands(K, g, K.M(0xf0d0ff, 'wisp', {op: 0.7, ds: 1, em: 0x8050c0}), 4, {y: -0.05, r: 0.1, len: 0.9, w: 0.14, tilt: 0.02});
    return {root: g, top: 1.8, r: 0.55, anim(a, dt, s) { const k = Math.sin(s.t * 2.4); g.scale.set(1 + k * 0.12, 1 - k * 0.15, 1 + k * 0.12); g.position.y = 1.1 + Math.sin(s.t * 2.4 - 1) * 0.15;
      for (const t of ten) t.rotation.x = 0.05 + Math.max(0, -k) * 0.35 + Math.sin(s.t * 1.3 + t.userData.ph) * 0.08; sway(arms, s.t, 0.2, 1.1); core.opacity = 0.6 + 0.35 * (s.atk > 0 ? 1 : (k + 1) / 2); sk.rotation.y = Math.sin(s.t * 0.5) * 0.4; } }; };
  MODELS.nm33 = K => { // Deep Beastie: loch monster - humped scaly body, long swaying neck, small horned head, four paddling flippers, long tail
    const g = K.grp(0, 0.8, 0), sc = K.M(0x3a5a48, 'scales', {em: 0x0c140f}), bel = K.M(0x9aa878, 'scales'), fl = K.M(0x2a4436, 'leather');
    K.sph(0.75, sc, 0, 0, 0, g, 1, 0.62, 1.4, PH ? 12 : 16); K.sph(0.7, bel, 0, -0.18, 0, g, 0.9, 0.4, 1.3, 10); for (let i = 0; i < 4; i++) K.cone(0.09, 0.22, fl, 0, 0.44, 0.5 - i * 0.32, g, 5);
    const neck = [], N = PH ? 5 : 7; let par = K.grp(0, 0.2, 0.85, g); par.rotation.x = -0.7; neck.push(par);
    for (let i = 0; i < N; i++) { const r = 0.24 - i * 0.018; K.cyl(r * 0.85, r, 0.34, sc, 0, 0.17, 0, par, PH ? 7 : 10); const nx = K.grp(0, 0.32, 0, par); nx.rotation.x = 0.1; neck.push(nx); par = nx; }
    const head = K.grp(0, 0.05, 0, par); head.rotation.x = 1.0; hd(K, 'beastie', 'scales', 0x3a5a48, 0.36, 0.3, 0.5, head, 0.05, 0.12);
    const jaw = K.grp(0, -0.08, 0.1, head); K.box(0.3, 0.07, 0.42, bel, 0, -0.03, 0.12, jaw); for (const x of [-1, 1]) K.cone(0.04, 0.18, K.M(0xd8d0b0, 'bone'), x * 0.1, 0.27, -0.05, head, 5);
    const flips = []; for (const [x, z] of [[-1, .5], [1, .5], [-1, -.55], [1, -.55]]) { const p = K.grp(x * 0.55, -0.15, z, g); K.box(0.7, 0.06, 0.3, fl, x * 0.35, 0, 0, p); flips.push([p, x]); }
    const tail = K.grp(0, 0, -0.95, g); K.cone(0.28, 1.2, sc, 0, 0, -0.55, tail, PH ? 7 : 10).rotation.x = -Math.PI / 2;
    return {root: g, head, top: 2.4, r: 1.0, anim(a, dt, s) { const sp = a.chg > 0 ? 9 : s.mv ? 4 : 1.6; for (const [p, x] of flips) p.rotation.z = Math.sin(s.t * sp + (p.position.z > 0 ? 0 : 1.5)) * 0.5 * x;
      for (let i = 1; i < neck.length; i++) { neck[i].rotation.z = Math.sin(s.t * 1.1 - i * 0.5) * 0.08; neck[i].rotation.x = a.chg > 0 ? 0.2 : 0.1 + Math.sin(s.t * 0.8 - i * 0.4) * 0.05; }
      neck[0].rotation.x = a.chg > 0 ? -1.2 : -0.7; tail.rotation.y = Math.sin(s.t * sp * 0.6) * 0.35; jaw.rotation.x = s.atk > 0 || a.chg > 0 ? 0.6 : 0.05; g.rotation.x = Math.sin(s.t * 1.2) * 0.05; } }; };
  MODELS.nm34 = K => { // Drookit Kelpie: water-horse spirit - dark wet coat, kelp mane and tail, glowing sea-green eyes, dripping water, shell-crusted hooves
    const g = K.grp(0, 0, 0), coat = K.M(0x22343a, 'leather', {em: 0x0a1416}), dk = K.M(0x101c20, 'leather'), weed = K.M(0x3a6a3a, 'weed', {ds: 1}), hoof = K.M(0xa0a8a0, 'rock');
    const body = K.grp(0, 1.05, 0, g); K.box(0.6, 0.6, 1.3, coat, 0, 0, 0, body); K.box(0.62, 0.5, 0.5, coat, 0, 0.05, 0.5, body);
    const neck = K.grp(0, 0.2, 0.62, body); neck.rotation.x = 0.6; K.box(0.32, 0.8, 0.36, coat, 0, 0.35, 0, neck);
    const head = K.grp(0, 0.75, 0.05, neck); head.rotation.x = 0.6; hd(K, 'kelpie', 'leather', 0x22343a, 0.3, 0.3, 0.62, head, 0.0, 0.18); for (const x of [-1, 1]) K.cone(0.05, 0.16, dk, x * 0.09, 0.2, -0.1, head, 4);
    const mane = strands(K, neck, weed, PH ? 5 : 9, {y: 0.7, r: 0.02, len: 0.5, w: 0.12, tilt: 0.4, sz: 4}); mane.forEach((m, i) => { m.position.set(0, 0.75 - i * 0.08, -0.17); m.rotation.y = Math.PI; });
    const tail = K.grp(0, 0.15, -0.65, body); const tl = strands(K, tail, weed, PH ? 4 : 7, {y: 0, r: 0.06, len: 0.9, w: 0.1, tilt: 0.5});
    const legs = []; for (const [x, z] of [[-.2, .5], [.2, .5], [-.2, -.5], [.2, -.5]]) { const L = K.grp(x, -0.25, z, body); K.box(0.15, 0.45, 0.17, coat, 0, -0.22, 0, L); const k = K.grp(0, -0.44, 0, L); K.box(0.12, 0.38, 0.13, dk, 0, -0.18, 0, k); K.box(0.16, 0.1, 0.18, hoof, 0, -0.38, 0.02, k); legs.push([L, k]); }
    const drip = glow(K, 0x90d0e0, 0.6); const drops = []; for (let i = 0; i < (PH ? 2 : 4); i++) drops.push(K.sph(0.03, drip, (i - 1.5) * 0.15, -0.3, 0.2, body, 1, 1.6, 1, 4));
    return {root: g, head, top: 2.2, r: 0.7, legs4: legs.map(l => l[0]), anim(a, dt, s) { const sp = s.mv ? 9 : 2, k = s.mv ? 0.7 : 0.08;
      legs.forEach(([L, kn], i) => { const ph = s.t * sp + (i === 0 || i === 3 ? 0 : Math.PI); L.rotation.x = Math.sin(ph) * k; kn.rotation.x = Math.max(0, -Math.cos(ph)) * k * 1.2; });
      sway(mane, s.t, 0.3, 2.2); sway(tl, s.t, 0.35, 1.8); body.rotation.x = a.grabT > 0 ? -0.5 : s.atk > 0 ? -0.35 : Math.sin(s.t * sp) * 0.03; neck.rotation.x = a.grabT > 0 ? 1.1 : 0.6 + Math.sin(s.t * 1.3) * 0.06;
      for (const d of drops) { d.position.y -= dt * 1.2; if (d.position.y < -0.9) d.position.y = -0.3; } } }; };
  // ===== v1.0.7: friendly folk - the wizard duo and the unicorn =====
  Object.assign(FACE, {
    wizard(g, n) { F.rect(g, n, 0, 0, 1, 1, '#d9a888'); F.rect(g, n, 0, .62, 1, .38, '#e8e4dc'); for (let i = 0; i < 26; i++) F.brow(g, n, Math.random(), .62 + Math.random() * .1, Math.random(), 1, .015, 'rgba(160,160,165,.5)');
      F.eye(g, n, .32, .42, .07, '#fff', '#3a5a90'); F.eye(g, n, .68, .42, .07, '#fff', '#3a5a90'); F.brow(g, n, .14, .3, .44, .33, .07, '#f0f0f0'); F.brow(g, n, .86, .3, .56, .33, .07, '#f0f0f0');
      F.rect(g, n, .44, .44, .12, .18, '#c88a70'); F.brow(g, n, .2, .5, .3, .52, .02, 'rgba(120,60,40,.35)'); F.brow(g, n, .8, .5, .7, .52, .02, 'rgba(120,60,40,.35)'); F.brow(g, n, .3, .64, .5, .6, .05, '#f4f4f0'); F.brow(g, n, .7, .64, .5, .6, .05, '#f4f4f0'); },
    unicorn(g, n) { F.eye(g, n, .22, .3, .08, '#1a2a4a', '#060810'); F.eye(g, n, .78, .3, .08, '#1a2a4a', '#060810'); F.glow(g, n, .2, .27, .02, '#e0f0ff'); F.glow(g, n, .76, .27, .02, '#e0f0ff');
      F.hole(g, n, .36, .84, .05, .04, '#9a8a90'); F.hole(g, n, .64, .84, .05, .04, '#9a8a90'); F.rect(g, n, .2, .7, .6, .3, 'rgba(240,210,220,.5)'); },
  });
  MODELS.wizard = (K, o) => { // old wizard: long robe, white beard and hair, tall pointed hat with a brim (and a patterned band)
    const robe = o.robe, H = man(K, {noLegs: 1, robe: [robe, 'cloth'], legs: [robe, 'cloth'], body: [robe, 'cloth'], hand: [0xd9a888, 'skin'], bw: 0.56, bh: 0.72, bd: 0.36, robeH: 1.05, armL: 0.8, aw: 0.19});
    hd(K, 'wizard', 'skin', 0xd9a888, 0.46, 0.5, 0.44, H.head, 0.27, 0);
    const wh = K.M(0xe8e6e0, 'fur'), gr = K.M(0xc8c8c8, 'fur');
    const beard = K.grp(0, 0.08, 0.2, H.head); K.box(0.4, 0.3, 0.12, wh, 0, -0.08, 0, beard); K.box(0.32, 0.36, 0.1, wh, 0, -0.38, 0.0, beard); K.box(0.2, 0.3, 0.08, gr, 0, -0.68, 0, beard); K.cone(0.1, 0.24, wh, 0, -0.92, 0, beard, 6).rotation.x = Math.PI;
    K.box(0.5, 0.7, 0.12, wh, 0, -0.05, -0.24, H.head); for (const x of [-1, 1]) K.box(0.08, 0.55, 0.3, gr, x * 0.25, 0.05, -0.05, H.head);
    const hm = K.M(o.hat, 'cloth'); const hat = K.grp(0, 0.5, 0, H.head); K.cyl(0.46, 0.46, 0.04, hm, 0, 0, 0, hat, PH ? 12 : 18);
    K.cyl(0.18, 0.26, 0.5, hm, 0, 0.27, 0, hat, PH ? 10 : 14); const tip = K.grp(0, 0.5, 0, hat); K.cone(0.18, 0.75, hm, 0, 0.36, 0, tip, PH ? 10 : 14); tip.rotation.x = -0.25; tip.rotation.z = 0.12;
    if (o.band) K.cyl(0.265, 0.265, 0.1, K.M(o.band, 'stripes'), 0, 0.08, 0, hat, PH ? 10 : 14);
    K.box(0.6, 0.08, 0.38, K.M(0x4a3220, 'leather'), 0, 0.3, 0, H.body);   // belt
    let staff = null; if (o.staff) { staff = K.grp(0, -0.7, 0.05, H.ra); K.cyl(0.03, 0.035, 1.9, K.M(0x6a4a2a, 'wood'), 0, 0.3, 0, staff, 6); }
    const lap = K.grp(0, 0.18, 0.15, H.rig); lap.visible = false; for (const x of [-1, 1]) { const k = K.box(0.34, 0.2, 0.6, K.M(robe, 'cloth'), x * 0.2, 0, 0.12, lap); k.rotation.y = -x * 0.5; }
    const W = {root: H.rig, H, head: H.head, top: 2.9, r: 0.5, lap, beard, tip, staff, pose: 'stand',
      anim(dt, t, mv) { const L = H.la, R = H.ra; beard.rotation.x = Math.sin(t * 1.3) * 0.04; tip.rotation.z = 0.12 + Math.sin(t * 0.9) * 0.05;
        const p = W.pose; lap.visible = p === 'sit'; H.rig.position.y = p === 'sit' ? -0.62 : 0;
        if (p === 'sit') { L.rotation.x = -0.9; R.rotation.x = -0.9; L.rotation.z = 0.35; R.rotation.z = -0.35; H.head.rotation.x = 0.05 + Math.sin(t * 0.5) * 0.04; }
        else if (p === 'rune') { L.rotation.x = -2.5 + Math.sin(t * 2) * 0.1; R.rotation.x = -2.5 - Math.sin(t * 2) * 0.1; L.rotation.z = -0.25; R.rotation.z = 0.25; H.head.rotation.x = -0.15; }
        else { const w = mv ? Math.sin(t * 3.2) * 0.35 : Math.sin(t * 0.8) * 0.05; L.rotation.x = w; R.rotation.x = o.staff ? -0.5 : -w; L.rotation.z = -0.05; R.rotation.z = 0.05; H.head.rotation.x = mv ? 0.12 : Math.sin(t * 0.4) * 0.06;
          H.rig.position.y = mv ? Math.abs(Math.sin(t * 3.2)) * 0.03 : 0; H.rig.rotation.z = mv ? Math.sin(t * 3.2) * 0.03 : 0; } } };
    return W; };
  MODELS.unicorn = K => { // white unicorn: pearly coat, silvery flowing mane and tail, spiral golden-pearl horn, silver hooves
    const g = K.grp(0, 0, 0), coat = K.M(0xf4f2f6, 'fur', {em: 0x2a2a34}), pale = K.M(0xe2e0ea, 'fur', {em: 0x24242e}), mn = K.M(0xd8e4f4, 'wisp', {ds: 1, em: 0x506080}), hoof = K.M(0xb8c0d0, 'metal'), hornM = K.M(0xf0e0b0, 'metal', {em: 0x6a5a30});
    const body = K.grp(0, 1.15, 0, g); K.box(0.62, 0.62, 1.4, coat, 0, 0, 0, body); K.box(0.64, 0.56, 0.5, coat, 0, 0.05, 0.55, body); K.box(0.6, 0.5, 0.4, pale, 0, 0.02, -0.6, body);
    const neck = K.grp(0, 0.22, 0.68, body); neck.rotation.x = 0.55; K.box(0.32, 0.86, 0.38, coat, 0, 0.38, 0, neck);
    const head = K.grp(0, 0.82, 0.05, neck); head.rotation.x = 0.65; hd(K, 'unicorn', 'fur', 0xf4f2f6, 0.32, 0.32, 0.66, head, 0, 0.18);
    for (const x of [-1, 1]) K.cone(0.05, 0.17, pale, x * 0.1, 0.22, -0.1, head, 4);
    const horn = K.grp(0, 0.2, 0.12, head); horn.rotation.x = -0.75; K.cone(0.06, 0.62, hornM, 0, 0.31, 0, horn, PH ? 6 : 10);
    if (!PH) for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.05 - i * 0.01, 0.008, 4, 10), hornM); r.rotation.x = Math.PI / 2; r.position.y = 0.08 + i * 0.12; horn.add(r); }
    const hg = glow(K, 0xfff0c0, 0.35); K.sph(0.09, hg, 0, 0.62, 0, horn, 1, 1, 1, 6);
    const mane = strands(K, neck, mn, PH ? 6 : 11, {y: 0.8, r: 0.02, len: 0.55, w: 0.14, tilt: 0.35, sz: 4}); mane.forEach((m, i) => { m.position.set(0, 0.82 - i * 0.075, -0.19); m.rotation.y = Math.PI; });
    const tail = K.grp(0, 0.18, -0.72, body); const tl = strands(K, tail, mn, PH ? 5 : 9, {y: 0, r: 0.05, len: 1.0, w: 0.12, tilt: 0.45});
    const legs = []; for (const [x, z] of [[-.2, .55], [.2, .55], [-.2, -.55], [.2, -.55]]) { const L = K.grp(x, -0.27, z, body); K.box(0.16, 0.48, 0.18, coat, 0, -0.23, 0, L); const k = K.grp(0, -0.46, 0, L); K.box(0.13, 0.4, 0.14, pale, 0, -0.19, 0, k); K.box(0.17, 0.1, 0.19, hoof, 0, -0.4, 0.02, k); legs.push([L, k]); }
    const U2 = {root: g, body, neck, head, horn, top: 2.3, r: 0.7, rear: 0,
      anim(dt, t, sp) { const run = sp > 7, k = sp > 0.3 ? (run ? 0.85 : 0.45) : 0.05, f = run ? 13 : sp > 0.3 ? 7 : 1.5;
        legs.forEach(([L, kn], i) => { const ph = t * f + (run ? (i < 2 ? 0 : 1.2) + (i % 2) * 0.3 : (i === 0 || i === 3 ? 0 : Math.PI)); L.rotation.x = Math.sin(ph) * k; kn.rotation.x = Math.max(0, -Math.cos(ph)) * k * 1.3; });
        sway(mane, t, run ? 0.5 : 0.25, run ? 4 : 1.6); sway(tl, t, run ? 0.5 : 0.3, run ? 4 : 1.4); tail.rotation.x = run ? -0.6 : -0.1;
        body.rotation.x = U2.rear > 0 ? -0.6 * Math.min(1, U2.rear) : run ? Math.sin(t * f) * 0.05 : 0; body.position.y = 1.15 + (run ? Math.abs(Math.sin(t * f)) * 0.08 : 0);
        neck.rotation.x = U2.graze ? 1.5 : run ? 0.75 : 0.55 + Math.sin(t * 0.7) * 0.05; hg.opacity = 0.25 + 0.2 * Math.sin(t * 3); } };
    return U2; };
  // v1.0.11: egg-only kinds (not in LIST/HOMES, so they never spawn naturally): a wandering wizard and a white unicorn
  const WIZC = [{robe: 0xc4622a, hat: 0xb0561f, band: 0xd8b040, staff: 1}, {robe: 0x6a2a22, hat: 0x5a221c}];
  MODELS.nmwizard = K => { const W = MODELS.wizard(K, WIZC[Math.random() < 0.5 ? 0 : 1]), f = W.anim; return Object.assign({}, W, {anim: (a, dt, o) => f(dt, o.t, o.mv)}); };
  MODELS.nmunicorn = K => { const M = MODELS.unicorn(K), f = M.anim; return Object.assign({}, M, {anim: (a, dt, o) => f(dt, o.t, o.mv ? 1.6 : 0)}); };
  DEF.nmwizard = {id: 'wz', name: 'Wizard', kind: 'nmwizard', body: 'robe', c: [0xc4622a, 'cloth'], move: 'walk', spd: 1.2, hp: 20, ai: 'wander', dmg: 0, snd: 'mystic', drop: [], eggOnly: 1, tame: 1};
  DEF.nmunicorn = {id: 'un', name: 'Unicorn', kind: 'nmunicorn', body: 'horse', c: [0xf4f2f6, 'fur'], move: 'walk', spd: 1.6, hp: 20, ai: 'wander', dmg: 0, snd: 'neigh', drop: [], eggOnly: 1, tame: 1};
  try { MOB_HP.nmwizard = 20; MOB_HP.nmunicorn = 20; } catch (_) {}
  U.MODELS = MODELS; U.hd = hd; U.strands = strands; U.glow = glow; U.sway = sway; U.PH = PH;
  // ---- helpers ----
  const isNM = a => a && typeof a.kind === 'string' && a.kind.startsWith('nm') && !!DEF[a.kind];
  const roomy = (x, y, z) => !solid(x, y, z) && !solid(x, y + 1, z);
  const near = (x, y, z, r, id) => { for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let c = -2; c <= 2; c++) if (getB(x + a, y + c, z + b) === id) return true; return false; };
  const waterNear = (x, y, z, r) => { for (let a = -r; a <= r; a += 2) for (let b = -r; b <= r; b += 2) for (let c = -3; c <= 1; c++) if (getB(x + a, y + c, z + b) === T.WATER) return true; return false; };
  const inWater = p => getB(Math.floor(p.x), Math.floor(p.y + 0.4), Math.floor(p.z)) === T.WATER;
  const all = () => mobs.filter(isNM);
  const CAP = PH || PERF ? 3 : 5, HARD = PH || PERF ? 6 : 10;
  const friendly = () => !!(typeof SET !== 'undefined' && SET.friendly);
  const ok = () => started && !paused && (!dead || window.__fdead) && !DIM.cur && !(MODE && MODE.name === 'creative') && !(current && current.flat);
  const sees = (p, cosMin) => { try { const v = new THREE.Vector3(); camera.getWorldDirection(v); const dx = p.x - camera.position.x, dy = p.y + 1 - camera.position.y, dz = p.z - camera.position.z, d = Math.hypot(dx, dy, dz) || 1; return (v.x * dx + v.y * dy + v.z * dz) / d > (cosMin || 0.75); } catch (_) { return false; } };
  const snd = (a, pitch) => { try { sfx3d('nm:' + a.def.snd + ':' + (pitch || 1) * (a.pit || 1), a.g.position, 26); } catch (_) {} };
  const hit = (a, n, msg) => { if (dead || friendly()) return; hurt(Math.min(4, n), msg || (a.def.name + ' got you.')); U.hits++; };
  // ---- projectiles ----
  const PR = [];
  function shoot(a, col, spd, dmg, o) { o = o || {}; if (PR.length > 8) return; const p = a.g.position, y = p.y + (a.hitY || 1) * 1.2;
    const m = new THREE.Mesh(new THREE.SphereGeometry(o.r || 0.16, 8, 6), new THREE.MeshBasicMaterial({color: col})); m.position.set(p.x, y, p.z); scene.add(m);
    const dx = P.x - p.x, dy = P.y + 1.1 - y, dz = P.z - p.z, d = Math.hypot(dx, dy, dz) || 1, v = new THREE.Vector3(dx / d * spd, dy / d * spd, dz / d * spd);
    if (o.lob) { const h = Math.hypot(dx, dz), tt = h / spd; v.set(dx / tt, (dy + 6 * tt * tt) / tt, dz / tt); }
    PR.push({m, v, life: o.life || 3.5, dmg, o, src: a.def.name}); U.shots++; }
  function stepShots(dt) { for (let i = PR.length - 1; i >= 0; i--) { const s = PR[i], q = s.m.position; s.life -= dt;
      if (s.o.homing) { const dx = P.x - q.x, dy = P.y + 1.1 - q.y, dz = P.z - q.z, d = Math.hypot(dx, dy, dz) || 1, sp = s.v.length(); s.v.lerp(new THREE.Vector3(dx / d * sp, dy / d * sp, dz / d * sp), Math.min(1, dt * 1.6)); }
      if (s.o.lob) s.v.y -= 12 * dt; q.addScaledVector(s.v, dt);
      let done = s.life <= 0 || solid(Math.floor(q.x), Math.floor(q.y), Math.floor(q.z));
      if (!done && Math.hypot(P.x - q.x, P.y + 1 - q.y, P.z - q.z) < 0.75) { done = true; if (!dead && !friendly()) { hurt(s.dmg, s.src + ' got you.'); U.hits++; if (s.o.slow) slowT = Math.max(slowT, s.o.slow); } }
      if (done) { try { burst(q.x, q.y, q.z, s.m.material.color.getHex(), 6, 0.4); } catch (_) {} scene.remove(s.m); s.m.geometry.dispose(); s.m.material.dispose(); PR.splice(i, 1); } } }
  // ---- player effects: slow (grabs), poison (aura, never below 2 hearts), haze vignette ----
  let slowT = 0, lx = null, lz = 0, poisonT = 0, poisonTick = 0, hazeK = 0, fog = null;
  function effects(dt) {
    if (slowT > 0 && lx !== null && !dead) { slowT -= dt; P.x = lx + (P.x - lx) * 0.45; P.z = lz + (P.z - lz) * 0.45; }
    lx = P.x; lz = P.z;
    if (friendly()) { poisonT = 0; slowT = 0; }
    if (poisonT > 0) { poisonT -= dt; poisonTick -= dt; if (poisonTick <= 0) { poisonTick = 1.2; if (hp > 4 && !dead) { hurt(1, 'Poisoned in the night.'); } } }
    let hz = 0; for (const a of mobs) if (a.kind === 'nm20') { const d = Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z); hz = Math.max(hz, 1 - d / 14); }
    hazeK += (Math.max(0, hz) - hazeK) * Math.min(1, dt * 2);
    if (hazeK > 0.01 && !fog) { fog = document.createElement('div'); fog.id = 'c123haze'; fog.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:5;background:radial-gradient(ellipse at center,rgba(200,210,220,0) 35%,rgba(200,210,220,.85) 100%)'; document.body.appendChild(fog); }
    if (fog) fog.style.opacity = (Math.min(0.5, hazeK * 0.6) * (dead || paused ? 0 : 1)).toFixed(3); }
  // ---- lightning (storm bogle): telegraphed ring, then a bolt; never sets fires or touches blocks ----
  const BOLTS = [];
  function callBolt(x, z, tg) { const y = (typeof groundTop === 'function' ? groundTop(Math.floor(x), Math.floor(z)) : P.y - 1) + 1;
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 24), new THREE.MeshBasicMaterial({color: 0x9fd0ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false})); ring.rotation.x = -Math.PI / 2; ring.position.set(x, y + 0.05, z); scene.add(ring);
    BOLTS.push({ring, x, y, z, t: 1.0, bolt: null, tg}); }
  function stepBolts(dt) { for (let i = BOLTS.length - 1; i >= 0; i--) { const b = BOLTS[i]; b.t -= dt; b.ring.material.opacity = 0.35 + 0.35 * Math.sin(b.t * 30);
      if (b.t <= 0 && !b.bolt) { const pts = []; let x = b.x, z = b.z; for (let y = b.y + 30; y > b.y; y -= 3) { const nx = x + (Math.random() - .5) * 1.4, nz = z + (Math.random() - .5) * 1.4; pts.push(x, y, z, nx, Math.max(b.y, y - 3), nz); x = nx; z = nz; }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); b.bolt = new THREE.LineSegments(g, new THREE.LineBasicMaterial({color: 0xe8f4ff})); scene.add(b.bolt); b.life = 0.25; U.strikes++;
        try { playSound('nm:thunder:1', 0.7, 0); shake(0.25, 0.03); } catch (_) {}
        for (const m of mobs.slice()) { if (!m || !m.g || !m.hostile || m.kind === 'nm22' || !(m.hp > 0)) continue; const q = m.g.position; if (Math.hypot(q.x - b.x, q.z - b.z) < 2.4 && Math.abs(q.y - b.y) < 4) { try { damageMob(m, 6, false); U.zaps = (U.zaps || 0) + 1; burst(q.x, q.y + 1, q.z, 0x9fd0ff, 12, 1.2); } catch (_) {} } } }
      if (b.bolt) { b.life -= dt; if (b.life <= 0) { for (const o of [b.ring, b.bolt]) { scene.remove(o); o.geometry.dispose(); o.material.dispose(); } BOLTS.splice(i, 1); } } } }
  function clearFx() { for (const s of PR) { scene.remove(s.m); s.m.geometry.dispose(); s.m.material.dispose(); } PR.length = 0; for (const b of BOLTS) for (const o of [b.ring, b.bolt]) if (o) { scene.remove(o); o.geometry.dispose(); o.material.dispose(); } BOLTS.length = 0; slowT = 0; poisonT = 0; }
  // ---- spawning ----
  function spawnKind(kind, x, y, z, o) { const def = DEF[kind], m = build(def);
    const a = Object.assign(m, {kind, def, flash: 0, kbx: 0, kbz: 0, vy: 0, onGround: true, burning: 0, ang: Math.random() * 6.28, yawVis: 0, walk: 0, cd: 1 + Math.random(), cd2: 2 + Math.random() * 2, sndT: 1 + Math.random() * 3, timer: 0, fade: 0, t: Math.random() * 10, pit: 0.9 + Math.random() * 0.2}, o || {});
    a.yawVis = a.ang; a.g.position.set(x + 0.5, y, z + 0.5); a.g.rotation.y = a.ang; scene.add(a.g); mobs.push(a); U.spawned++; U.kinds[kind] = (U.kinds[kind] || 0) + 1; return a; }
  U.spawnKind = spawnKind;
  const lastSeen = {}; let spT = 3;
  // ---- homes: each night mob belongs to a part of the glen ----
  const HOMES = {}; for (const k of U.LIST) for (const h of DEF[k].homes || ['moor']) (HOMES[h] = HOMES[h] || []).push(k); U.HOMES = HOMES;
  // v1.0.8: every surface biome has its own night mobs (castles > coast > snow/mountain > the tree-species woods)
  function homeOf(x, y, z) {
    try { for (const c of (typeof g9castles !== 'undefined' && g9castles) || []) if (Math.hypot(x - c[1], z - c[2]) < (c[0] === 'citadel' ? 36 : 30)) return c[0] === 'black' ? 'black' : c[0] === 'human' ? 'human' : 'mossy'; } catch (_) {}
    const top = getB(x, y - 1, z);
    if (top === T.SAND && y <= SEA + 4) return 'beach';
    if ((T.PEAT !== undefined && top === T.PEAT) || (T.MUD !== undefined && top === T.MUD) || (y <= SEA + 3 && waterNear(x, y, z, 6))) return 'shore';
    if ((T.SNOW !== undefined && top === T.SNOW) || y > SEA + 34) return 'snow';
    if (y > SEA + 22 || top === T.STONE || (typeof biomeAt === 'function' && biomeAt(x, z) === 'high' && y > SEA + 12)) return 'mountain';
    const sp = window.__bio && __bio.at ? __bio.at(x, z) : 'oak';
    return HOMES[sp] ? sp : 'oak'; }
  U.homeOf = homeOf;
  // deep water: at least 4 blocks of water over the bed
  // v1.0.8: the 'ocean' is ALL open surface water - sea, lochs, rivers - but not cave pools (under a roof) or small ponds
  const isW = (x, y, z) => getB(x, y, z) === T.WATER;
  function openWater(x, z) { if (x < 3 || z < 3 || x > W - 4 || z > D - 4) return null; const bed = solidTop(x, z); let w = 0; for (let k = 1; k < 14; k++) if (isW(x, bed + k, z)) w++; else break;
    if (w < 2) return null; const sy = bed + w;   // water surface; solidTop is the highest solid block, so open sky above is guaranteed
    if (getB(x, sy + 1, z) !== 0) return null;
    let n = 0; for (let k = 0; k < 8; k++) { const a = k * 0.785, xx = Math.round(x + Math.sin(a) * 5), zz = Math.round(z + Math.cos(a) * 5); if (isW(xx, sy, zz)) n++; }
    if (n < 6) return null; let m = 0; for (let k = 0; k < 8; k++) { const a = k * 0.785 + 0.39, xx = Math.round(x + Math.sin(a) * 9), zz = Math.round(z + Math.cos(a) * 9); if (isW(xx, sy, zz)) m++; }
    if (m < 3) return null; return [x, bed + 1 + Math.min(Math.max(0, w - 2), (w / 2) | 0), z, w]; }
  U.openWater = openWater;
  function deepSpot() { for (let t = 0; t < 24; t++) { const an = Math.random() * 6.283, r = 10 + Math.random() * 22, x = Math.floor(P.x + Math.sin(an) * r), z = Math.floor(P.z + Math.cos(an) * r);
      const s = openWater(x, z); if (s) return [s[0], s[1], s[2]]; } return null; }
  function findSpot(home, under) {
    if (home === 'ocean') return deepSpot();
    for (let t = 0; t < 16; t++) { const an = Math.random() * 6.283, r = under ? 10 + Math.random() * 12 : 18 + Math.random() * 14, x = Math.floor(P.x + Math.sin(an) * r), z = Math.floor(P.z + Math.cos(an) * r);
      if (x < 3 || z < 3 || x > W - 4 || z > D - 4) continue;
      if (under) { const y = Math.floor(P.y) + ((Math.random() * 9) | 0) - 4; if (y < 2 || !roomy(x, y, z) || !solid(x, y - 1, z) || y > solidTop(x, z) - 4 || near(x, y, z, 4, T.TORCH)) continue; return [x, y, z]; }
      const top = solidTop(x, z), y = top + 1, b = getB(x, top, z);
      if (b === T.WATER || b === T.LAVA || getB(x, y, z) || getB(x, y + 1, z) || Math.abs(y - P.y) > 14 || near(x, y, z, 4, T.TORCH)) continue;
      return [x, y, z]; }
    return null; }
  function trySpawn(dt) { spT -= dt; if (spT > 0) return; spT = 3;
    if (!ok() || !isNight || Math.random() > 0.8) return;
    const L = all(), groups = new Set(L.filter(a => !a.def.minion).map(a => a.grp)).size; if (groups >= CAP || L.length >= HARD) return;
    const under = caveK > 0.45, alive = new Set(L.map(a => a.kind));
    let s = null, home = null;
    if (!under && Math.random() < (swimming || P.y < SEA + 3 ? 0.7 : 0.45)) { s = deepSpot(); if (s) home = 'ocean'; }
    if (!s) { s = findSpot(under ? 'cave' : 'land', under); if (!s) return; home = under ? 'cave' : homeOf(s[0], s[1], s[2]); }
    const pool = (HOMES[home] || []).filter(k => !alive.has(k) && !(DEF[k] && DEF[k].off)); if (!pool.length) return;
    pool.sort((p, q) => (lastSeen[p] || 0) - (lastSeen[q] || 0) + (Math.random() - .5) * 60000); const kind = pool[0], def = DEF[kind];
    lastSeen[kind] = Date.now(); U.lastHome = home; { const C = U.census = U.census || {}; const h = C[home] = C[home] || {}; h[kind] = (h[kind] || 0) + 1; }
    const gid = Math.random(), n = Math.min(def.group || 1, HARD - L.length);
    for (let i = 0; i < n; i++) spawnKind(kind, s[0] + (i ? (Math.random() * 3 | 0) - 1 : 0), s[1], s[2] + (i ? (Math.random() * 3 | 0) - 1 : 0), {grp: gid, slot: i, home});
    try { snd(mobs[mobs.length - 1], 0.9); } catch (_) {} }
  U.forceSpawn = kind => { const def = DEF[kind]; const s = findSpot(def.homes[0] === 'ocean' ? 'ocean' : 'land', caveK > 0.45) || [Math.floor(P.x) + 4, Math.floor(P.y), Math.floor(P.z) + 4]; return spawnKind(kind, s[0], s[1], s[2], {grp: Math.random()}); };
  // test helper: line all 29 up in front of the player, frozen
  U.lineup = (cols) => { cols = cols || 10; const out = []; const fx = Math.sin(P.yaw + Math.PI), fz = Math.cos(P.yaw + Math.PI), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    U.LIST.forEach((k, i) => { const c = i % cols, r = (i / cols) | 0, d = 6 + r * 3.2, s = (c - (cols - 1) / 2) * 2.1; const x = P.x + fx * d + rx * s, z = P.z + fz * d + rz * s;
      const a = spawnKind(k, Math.floor(x), Math.floor(P.y), Math.floor(z), {frozen: true, grp: i}); a.g.position.set(x, P.y, z); a.ang = a.yawVis = Math.atan2(P.x - x, P.z - z); a.g.rotation.y = a.ang; out.push(a); }); return out.length; };
  // ---- movement ----
  function walkMove(a, spd, dt, ang) { const p = a.g.position, mx = Math.sin(ang) * spd * dt, mz = Math.cos(ang) * spd * dt;
    const mv1 = (x, z) => { const og = a.onGround; a.onGround = false; let q = moveMob(a, x, z); a.onGround = og;
      if (q === 'step' && og) { const y0 = p.y; p.y = Math.floor(p.y + 0.05) + 1; a.vy = 0; q = moveMob(a, x, z); if (q !== true) p.y = y0; } return q === true; };
    const r = mv1(mx, mz) || mv1(mx, 0) || mv1(0, mz);
    if (!r && a.onGround && (a.jumpCd = (a.jumpCd || 0) - dt) <= 0) { a.vy = 6.5; a.onGround = false; a.jumpCd = 0.8; } return r; }
  function floatMove(a, spd, dt, ang, ty) { const p = a.g.position, hh = Math.max(0.9, Math.min(a.topH || 1.8, 2.8));
    // v1.0.11: floaters collide like every other mob — the whole body column must be free of solid blocks (no phasing through walls, no rising through roofs)
    const clear = (x, y, z) => { const fx = Math.floor(x), fz = Math.floor(z); if (fx < 1 || fz < 1 || fx >= W - 1 || fz >= D - 1) return false;
      for (let yy = Math.floor(y + 0.05), y1 = Math.floor(y + hh - 0.05); yy <= y1; yy++) if (solid(fx, yy, fz)) return false; return true; };
    if (!clear(p.x, p.y, p.z)) { for (let k = 1; k <= 6; k++) { if (clear(p.x, p.y + k, p.z)) { p.y = Math.floor(p.y + 0.05) + k; break; } if (p.y - k > 1 && clear(p.x, p.y - k, p.z)) { p.y = Math.floor(p.y + 0.05) - k; break; } } }
    const mx = Math.sin(ang) * spd * dt, mz = Math.cos(ang) * spd * dt;
    if (mx || mz) { if (clear(p.x + mx, p.y, p.z + mz)) { p.x += mx; p.z += mz; } else { if (clear(p.x + mx, p.y, p.z)) p.x += mx; else if (clear(p.x, p.y, p.z + mz)) p.z += mz; else a.blocked = (a.blocked || 0) + dt; } }
    const fl = floorBelow(Math.floor(p.x), p.y + 0.5, Math.floor(p.z)); if (fl < P.y + 6) ty = Math.max(ty, fl + 0.2);
    const ny = p.y + (ty - p.y) * Math.min(1, dt * 2.5); if (clear(p.x, ny, p.z)) p.y = ny; else if (ny < p.y) p.y = Math.max(ny, fl); }
  function swimMove(a, spd, dt, ang, ty) { const p = a.g.position, nx = p.x + Math.sin(ang) * spd * dt, nz = p.z + Math.cos(ang) * spd * dt, ny = p.y + Math.max(-1, Math.min(1, ty - p.y)) * spd * 0.6 * dt;
    const wet = (x, y, z) => getB(Math.floor(x), Math.floor(y + 0.4), Math.floor(z)) === T.WATER && !solid(Math.floor(x), Math.floor(y + 1.3), Math.floor(z)) && !solid(Math.floor(x), Math.floor(y + 0.05), Math.floor(z));   // v1.0.11: whole body must be in open water
    if (wet(nx, p.y, nz)) { p.x = nx; p.z = nz; } if (wet(p.x, ny, p.z)) p.y = ny;
    if (!wet(p.x, p.y, p.z)) mobPhysics(a, dt); }
  // ---- per-mob behaviour ----
  const CORPSES = [];
  const DEATH = k => { const d = DEF[k]; return d.move === 'swim' ? 'sink' : d.body === 'blob' ? 'pop' : (d.phase || d.move === 'float') ? 'fade' : 'fall'; };
  function corpse(a) { const i = mobs.indexOf(a); if (i >= 0) mobs.splice(i, 1); if (a.beam) { try { scene.remove(a.beam); a.beam.geometry.dispose(); a.beam.material.dispose(); } catch (_) {} a.beam = null; }
    for (const m of a.mats) { m.transparent = true; } CORPSES.push({a, t: 0, style: DEATH(a.kind), y0: a.g.position.y, s0: a.g.scale.x}); if (CORPSES.length > 6) endCorpse(CORPSES.shift()); }
  function endCorpse(c) { const a = c.a; scene.remove(a.g); a.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); a.mats.forEach(m => m.dispose()); }
  function stepCorpses(dt) { for (let i = CORPSES.length - 1; i >= 0; i--) { const c = CORPSES[i], a = c.a, k = Math.min(1, (c.t += dt) / 1.1), p = a.g.position;
      if (c.style === 'fall') { a.rig.rotation.x = -k * k * 1.5; if (a.la) a.la.rotation.x = -2.5 * k; if (a.ra) a.ra.rotation.x = -2.5 * k; }
      else if (c.style === 'fade') { p.y = c.y0 + k * 1.4; a.rig.rotation.y += dt * 8; a.g.scale.setScalar(c.s0 * (1 - k * 0.6)); }
      else if (c.style === 'sink') { p.y = c.y0 - k * 1.5; a.rig.rotation.z = k * 1.2; }
      else if (c.style === 'pop') { a.g.scale.set(c.s0 * (1 + k * 0.6), c.s0 * (1 - k * 0.8), c.s0 * (1 + k * 0.6)); }
      const op = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45; for (const m of a.mats) m.opacity = Math.min(m.opacity, Math.max(0, op));
      if (c.t >= 1.1) { endCorpse(c); CORPSES.splice(i, 1); } } }
  U.stepCorpses = stepCorpses; U.CORPSES = CORPSES;
  function kill(a, quiet, anim) { if (anim) { try { corpse(a); } catch (_) { } if (mobs.indexOf(a) < 0 && CORPSES.some(c => c.a === a)) return; } if (!quiet) { const p = a.g.position; try { burst(p.x, p.y + 0.8, p.z, 0x9aa0b0, 10, 0.8); } catch (_) {} } try { removeMob(a); } catch (_) {} const i = mobs.indexOf(a); if (i >= 0) mobs.splice(i, 1); }
  function blinkTo(a, behind) { const p = a.g.position; try { burst(p.x, p.y + 1, p.z, 0x8a70c0, 10, 0.6); } catch (_) {}
    const yaw = P.yaw, s = behind ? 1 : (Math.random() < .5 ? 1 : -1); const ang = behind ? yaw : yaw + s * 1.6, r = behind ? 2.6 : 5;
    const x = P.x + Math.sin(ang) * r, z = P.z + Math.cos(ang) * r, fx = Math.floor(x), fz = Math.floor(z), fy = Math.floor(P.y + 0.2);
    let ok = fx > 1 && fz > 1 && fx < W - 1 && fz < D - 1; for (let k = 0; ok && k < Math.max(2, a.tall || 2); k++) if (solid(fx, fy + k, fz)) ok = false;   // v1.0.11: feet-to-head clear, never into a wall
    if (ok) { p.x = x; p.z = z; p.y = Math.max(floorBelow(fx, P.y + 0.2, fz), P.y - 1); a.vy = 0; } }
  function step(a, dt) { const def = a.def, p = a.g.position; a.t += dt; if (a.flash > 0) a.flash -= dt; a.cd -= dt; a.cd2 -= dt;
    const dx = P.x - p.x, dz = P.z - p.z, dy = P.y - p.y, d = Math.hypot(dx, dz) || 0.001, d3 = Math.hypot(dx, dz, dy);
    // despawn: daylight (fade), far away, other dimension, creative
    if ((d > 60 && !a.eggP) || p.y < -6 || (DIM.cur && !a.egg) || (MODE && MODE.name === 'creative' && !a.egg)) return kill(a, true);   // v1.0.11: egg mobs are kept (creative: persistent)
    if (!isNight && !a.frozen && !a.egg) { a.fade += dt; if (a.fade > 1.5) return kill(a, true); }
    let ang = Math.atan2(dx, dz), spd = 0, ty = P.y + (def.hover || 0.6) + Math.sin(a.t * 2) * 0.2, face = true, ai = def.ai;
    if (a.frozen) ai = 'idle'; else if (friendly()) ai = 'wander'; else if (dead) ai = 'idle';
    const close = d3 < (def.body === 'big' ? 2.0 : 1.6);
    const melee = (n, cd) => { if (close && a.cd <= 0) { a.cd = cd || 1.1; hit(a, n || def.dmg); a.swing = 0.35; try { knockPlayer(dx / d, dz / d, 3, 2); } catch (_) {} snd(a, 1.15); return true; } return false; };
    switch (ai) {
      case 'idle': spd = 0; break;
      case 'wander': if (a.beam) { try { scene.remove(a.beam); a.beam.geometry.dispose(); a.beam.material.dispose(); } catch (_) {} a.beam = null; }
        if ((a.wT = (a.wT || 0) - dt) <= 0) { a.wT = 2 + Math.random() * 3; a.wA = Math.random() * 6.283; a.wS = Math.random() < 0.35 ? 0 : 1; }
        ang = a.wA; spd = def.spd * 0.45 * a.wS; ty = def.move === 'swim' ? p.y + Math.sin(a.t) * 0.3 : floorBelow(Math.floor(p.x), p.y + 0.5, Math.floor(p.z)) + (def.hover || 0.6) + Math.sin(a.t * 2) * 0.2; break;
      case 'eel': if (inWater(P) && d3 < 14) { ty = P.y + 0.2; spd = def.spd; if (a.cd2 <= 0 && d3 < 8) { a.cd2 = 3.5; a.dart = 0.6; snd(a, 1.3); } if (a.dart > 0) { a.dart -= dt; spd = def.spd * 3; }
          if (close && a.cd <= 0) { a.cd = 2.2; a.swing = 0.4; a.shockT = 0.5; hit(a, 2, 'Zapped by the ' + def.name + '.'); slowT = Math.max(slowT, 1.5); try { burst(P.x, P.y + 1, P.z, 0x80e0ff, 10, 0.6); } catch (_) {} } }
        else { spd = def.spd * 0.5; ang = a.ang + Math.sin(a.t * 0.7) * 0.6; ty = p.y + Math.sin(a.t) * 0.4; } break;
      case 'lure': if (d3 < 16) { ty = P.y; spd = d > 3.5 ? def.spd : 0; if (a.cd2 <= 0) { a.cd2 = 7; a.singT = 2.2; snd(a, 1.1); }
          if (a.singT > 0) { a.singT -= dt; if (Math.random() < dt * 2.5 && d > 2) try { knockPlayer(-dx / d, -dz / d, 2.2, inWater(P) ? 0.4 : 0); } catch (_) {} if (Math.random() < dt * 6) try { burst(p.x, p.y + 1.6, p.z, 0xc8e0ff, 1, 0.3); } catch (_) {} }
          melee(2, 1.6); } else { spd = def.spd * 0.4; ang = a.ang + Math.sin(a.t * 0.5) * 0.5; ty = p.y; } break;
      case 'sting': spd = d3 < 12 ? def.spd * (0.6 + 0.6 * Math.max(0, Math.sin(a.t * 2.4))) : def.spd * 0.3; ty = d3 < 12 ? P.y + 0.6 : p.y + Math.sin(a.t) * 0.5; if (d3 >= 12) ang = a.ang + Math.sin(a.t * 0.4) * 0.4;
        if (d3 < 1.9 && a.cd <= 0) { a.cd = 2; a.swing = 0.3; hit(a, 1, 'Stung by the ' + def.name + '.'); poisonT = Math.max(poisonT, 3); } break;
      case 'ram': if (a.chg > 0) { a.chg -= dt; ang = a.ca; spd = 8; if (d3 < 2.6 && a.cd <= 0) { a.cd = 2.5; a.chg = 0; a.swing = 0.5; hit(a, 3, 'Rammed by the ' + def.name + '.'); knockPlayer(dx / d, dz / d, 8, 7); shake(0.25, 0.03); } }
        else if (inWater(P) && d3 < 18) { ty = P.y; spd = d > 7 ? def.spd : def.spd * 0.3; if (a.cd2 <= 0 && d3 < 12) { a.cd2 = 5; a.chg = 1.1; a.ca = ang; snd(a, 0.7); } }
        else { spd = def.spd * 0.5; ang = a.ang + Math.sin(a.t * 0.3) * 0.5; ty = p.y; } break;
      case 'snatch': if (a.grabT > 0) { a.grabT -= dt; spd = 1; ty = p.y - 2; if (inWater(P) && d3 < 3) { P.vy = Math.min(P.vy, -2.5); slowT = Math.max(slowT, 0.5); } if (a.grabT <= 0) a.away = 2; }
        else if (a.away > 0) { a.away -= dt; spd = -def.spd; ty = p.y; }
        else if (inWater(P) && d3 < 16) { ty = P.y; spd = def.spd; if (close && a.cd <= 0) { a.cd = 5; a.grabT = 1.4; a.swing = 0.5; hit(a, 2, 'Dragged down by the ' + def.name + '.'); snd(a, 1.0); } }
        else { spd = def.spd * 0.5; ang = a.ang + Math.sin(a.t * 0.6) * 0.6; ty = p.y; } break;
      case 'shield': spd = d > 1.4 ? def.spd : 0; if (melee(3, 1.4)) shake(0.15, 0.02); break;          // heavy, front armour (see damage wrap)
      case 'lunge': spd = d > 1.2 ? def.spd : 0; if (a.onGround && a.cd2 <= 0 && d < 6 && d > 2.5) { a.cd2 = 2.5; a.vy = 6; a.onGround = false; a.kbx = dx / d * 8; a.kbz = dz / d * 8; snd(a, 1.3); } melee(); break;
      case 'zap': spd = d > 9 ? def.spd : d < 5 ? -def.spd : 0; if (a.cd2 <= 0 && d < 16) { a.cd2 = 2.2; shoot(a, 0x80e0ff, 14, 2); snd(a, 1.2); } melee(); break;
      case 'drag': if (inWater(P) && d3 < 14) { spd = def.spd; ty = P.y + 0.2; if (close && a.cd <= 0) { a.cd = 1.6; hit(a, 2, 'Dragged under by ' + def.name + '.'); P.vy = Math.min(P.vy, -3); slowT = 1.2; snd(a, 0.8); } } else { spd = def.spd * 0.4; ang = a.ang + Math.sin(a.t) * 0.5; ty = p.y; } break;
      case 'blink': spd = d > 1.4 ? def.spd : 0; if (a.cd2 <= 0 && d < 20) { a.cd2 = 4 + Math.random() * 2; blinkTo(a, true); snd(a, 1); } melee(); break;
      case 'orbit': { const o = a.t * 1.3 + (a.slot || 0) * Math.PI, R = a.cd <= 0.4 ? 0.8 : 3.2, tx = P.x + Math.sin(o) * R, tz = P.z + Math.cos(o) * R; ang = Math.atan2(tx - p.x, tz - p.z); spd = Math.min(def.spd * 1.5, Math.hypot(tx - p.x, tz - p.z) * 3); ty = P.y + 0.7; if (d > 10) { ang = Math.atan2(dx, dz); spd = def.spd; } melee(2, 2.2); break; }
      case 'charge': if (a.chg > 0) { a.chg -= dt; ang = a.ca; spd = 10; if (close && a.cd <= 0) { a.cd = 1.5; hit(a, 3); knockPlayer(dx / d, dz / d, 9, 4); a.chg = 0; } }
        else if (a.stun > 0) { a.stun -= dt; spd = 0; }
        else { spd = d > 1.6 ? def.spd : 0; if (a.cd2 <= 0 && d < 12 && d > 4) { a.cd2 = 5; a.chg = 1.2; a.ca = ang; snd(a, 0.8); } melee(); } break;
      case 'stomp': spd = d > 2.6 ? def.spd : 0; if (a.cd2 <= 0 && d < 4.5) { a.cd2 = 3.5; a.vy = 7; a.onGround = false; a.slam = true; snd(a, 0.8); }
        if (a.slam && a.onGround && a.vy <= 0) { a.slam = false; shake(0.3, 0.04); try { burst(p.x, p.y + 0.2, p.z, 0x8a7a5a, 16, 2.5); } catch (_) {} if (d < 3.6 && P.onGround !== false && Math.abs(dy) < 1.5) { hit(a, 3, 'Flattened by the Tiki Thumper.'); knockPlayer(dx / d, dz / d, 7, 5); } } break;
      case 'slowgrab': spd = d > 1.2 ? def.spd : 0; if (close && a.cd <= 0) { a.cd = 1.6; hit(a, 2, def.name + ' held you.'); slowT = 2; a.swing = 0.4; snd(a, 0.9); } break;
      case 'scare': if (a.flee > 0) { a.flee -= dt; ang = Math.atan2(-dx, -dz); spd = def.spd; } else { spd = def.spd; ang = Math.atan2(dx, dz) + Math.sin(a.t * 1.5) * 0.6;
          if (close && a.cd <= 0) { a.cd = 3; a.flee = 3; hit(a, 1, 'Spooked by the ' + def.name + '.'); knockPlayer(dx / d, dz / d, 8, 4); snd(a, 1.6); } } ty = P.y + 0.5 + Math.sin(a.t * 3) * 0.4; break;
      case 'hex': spd = d > 8 ? def.spd : d < 4 ? -def.spd : 0; if (a.cd2 <= 0 && d < 14) { a.cd2 = 3; shoot(a, 0x70ff60, 9, 2, {lob: 1, slow: 2}); snd(a, 1); } melee(); break;
      case 'parry': spd = 0; break;                                                                        // v1.0.36: the Admiral never attacks - he stands on his ship and stares                                    // parries every third hit (damage wrap)
      case 'leap': spd = d > 1.2 ? def.spd : 0; if (a.onGround && a.cd2 <= 0 && d < 7 && d > 2) { a.cd2 = 2; a.vy = 7.5; a.onGround = false; a.kbx = dx / d * 7; a.kbz = dz / d * 7; snd(a, 1.2); } melee(); break;
      case 'stalk': { const seen = sees(p, 0.6) && d < 40; a.seen = seen; spd = seen ? 0 : d > 1.2 ? def.spd : 0; if (!seen) melee(3, 1.5); face = !seen || a.yawVis === undefined; break; }
      case 'rock': spd = d > 7 ? def.spd : 0; if (a.cd2 <= 0 && d < 18 && d > 3) { a.cd2 = 3.2; a.swing = 0.5; shoot(a, 0x7a7468, 11, 3, {lob: 1, r: 0.3}); snd(a, 0.7); } melee(3, 1.6); break;
      case 'beam': spd = d > 8 ? def.spd : d < 5 ? -def.spd : 0; ty = P.y + 2.2 + Math.sin(a.t) * 0.3;
        if (a.cd2 <= 0 && d < 14 && !a.beamT) { a.beamT = 1.0; snd(a, 0.6); }
        if (a.beamT) { a.beamT -= dt; if (!a.beam) { a.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 6), new THREE.MeshBasicMaterial({color: 0xff3020, transparent: true, opacity: 0.4})); scene.add(a.beam); }
          const mid = new THREE.Vector3((p.x + P.x) / 2, (p.y + 1 + P.y + 1.2) / 2, (p.z + P.z) / 2); a.beam.position.copy(mid); a.beam.scale.y = d3; a.beam.lookAt(P.x, P.y + 1.2, P.z); a.beam.rotateX(Math.PI / 2); a.beam.material.opacity = a.beamT < 0.15 ? 1 : 0.3;
          if (a.beamT <= 0) { a.beamT = 0; a.cd2 = 3.5; if (d < 15) { hit(a, 3, 'Seared by the ' + def.name + '.'); snd(a, 1.4); } scene.remove(a.beam); a.beam.geometry.dispose(); a.beam.material.dispose(); a.beam = null; } }
        melee(2, 1.5); break;
      case 'armour': spd = d > 1.8 ? def.spd : 0; if (close && a.cd <= 0) { a.cd = 2; hit(a, 3); knockPlayer(dx / d, dz / d, 10, 5); shake(0.2, 0.03); a.swing = 0.4; snd(a, 0.8); } break;
      case 'split': case 'chase': if (def.move === 'hop') { if (a.onGround && a.cd2 <= 0 && d > 1) { a.cd2 = 0.9; a.vy = 5; a.onGround = false; a.kbx = dx / d * 4; a.kbz = dz / d * 4; snd(a, 1.2); } spd = 0; } else spd = d > 1.2 ? def.spd : 0; melee(); break;
      case 'homing': spd = d > 9 ? def.spd : 0; ty = P.y + 1.5 + Math.sin(a.t * 1.3) * 0.5; if (a.cd2 <= 0 && d < 18) { a.cd2 = 3.5; shoot(a, 0xc080ff, 5, 2, {homing: 1, life: 5}); snd(a, 1); } if (a.cd <= -6 && d < 12) { a.cd = 0; blinkTo(a, false); } break;
      case 'haze': { const vis = d < 7 ? 1 : 0.15; a.vis = (a.vis || 0) + (vis - (a.vis || 0)) * Math.min(1, dt * 2); for (const m of a.mats) { m.transparent = true; m.opacity = 0.85 * a.vis; } spd = d > 1.3 ? def.spd : 0; melee(2, 1.6); break; }
      case 'aura': spd = d > 1.4 ? def.spd : 0; if (d < 3.2 && Math.abs(dy) < 2) { a.auraT = (a.auraT || 0) + dt; if (a.auraT > 1) { poisonT = Math.max(poisonT, 3); a.auraT = 0; } if (Math.random() < dt * 6) try { burst(p.x + (Math.random() - .5) * 3, p.y + 0.4, p.z + (Math.random() - .5) * 3, 0x7ac040, 2, 0.3); } catch (_) {} } melee(2, 1.4); break;
      case 'storm': { // v1.0.50: the Thunner Cloudie never strikes you - it drifts near you and zaps hostile mobs close by
        let tg = null, bd = 18; for (const m of mobs) { if (!m || m === a || m.dead || !(m.hp > 0) || !m.hostile || m.kind === a.kind || !m.g) continue; const q = m.g.position, dd = Math.hypot(q.x - p.x, q.z - p.z); if (dd < bd && Math.hypot(q.x - P.x, q.z - P.z) > 2.6) { bd = dd; tg = m; } }
        if (tg) { const q = tg.g.position; ang = Math.atan2(q.x - p.x, q.z - p.z); spd = bd > 3 ? def.spd : 0; ty = Math.max(q.y + 5, p.y - 0.5); if (a.cd2 <= 0 && bd < 10) { a.cd2 = 3 + Math.random() * 1.5; callBolt(q.x, q.z, tg); snd(a, 1.2); } }
        else { spd = d > 6 ? def.spd : 0; ty = Math.max(P.y + 5, p.y - 0.5); } break; }
      case 'bubble': if (d3 < 16) { spd = d > 6 ? def.spd : 0; ty = Math.min(P.y, p.y + 1); if (a.cd2 <= 0) { a.cd2 = 2.6; shoot(a, 0xbfe8ff, 9, 2, {lob: 1, r: 0.22}); snd(a, 1.3); } } else { spd = def.spd * 0.4; ang = a.ang + Math.sin(a.t) * 0.5; ty = p.y; } break;
      case 'summon': spd = d > 9 ? def.spd : d < 5 ? -def.spd : 0; if (a.cd2 <= 0 && d < 18) { a.cd2 = 9; const mine = mobs.filter(m => m.kind === 'nmwisp' && m.boss === a).length;
          if (mine < 2 && all().length < HARD) { const w = spawnKind('nmwisp', Math.floor(p.x), Math.floor(p.y + 1.5), Math.floor(p.z), {grp: a.grp}); w.boss = a; snd(a, 0.9); try { burst(p.x, p.y + 1.5, p.z, 0xd0ffd0, 10, 0.8); } catch (_) {} } else { shoot(a, 0x50ff90, 8, 2); } } melee(); break;
      case 'hop': if (a.onGround && a.cd2 <= 0 && d > 1.2 && d < 18) { a.cd2 = 1.1; a.vy = 7; a.onGround = false; a.kbx = dx / d * 6; a.kbz = dz / d * 6; snd(a, 1); } spd = 0; if (close && a.cd <= 0) { a.cd = 1.2; hit(a, 2); slowT = Math.max(slowT, 1); } break;
      case 'crew': spd = d > 1.2 ? def.spd : 0; ang += ((a.slot || 0) - 1) * 0.35 * Math.min(1, d / 8); melee(2, 1.3); break;
      case 'hook': spd = d > 5 ? def.spd : 0; if (a.cd2 <= 0 && d < 8 && d > 2.5) { a.cd2 = 4.5; a.hookT = 0.5; snd(a, 1.2); }
        if (a.hookT > 0) { a.hookT -= dt; if (a.hookT <= 0 && d < 9) { hit(a, 2, 'Hooked by ' + def.name + '.'); knockPlayer(-dx / d, -dz / d, 9, 3); } } melee(); break;
      case 'circle': { const o = a.t * 1.8, R = a.cd <= 0.3 ? 0.6 : 5, tx = P.x + Math.sin(o) * R, tz = P.z + Math.cos(o) * R; ang = Math.atan2(tx - p.x, tz - p.z); spd = Math.min(def.spd * 1.4, Math.hypot(tx - p.x, tz - p.z) * 3); if (d > 12) { ang = Math.atan2(dx, dz); spd = def.spd; } ty = P.y + 0.5; melee(2, 2.4); break; }
      case 'weep': spd = 0; face = false; a.ang = Math.atan2(-dx, -dz);                                   // back turned, sobbing; scream + vanish if you come close
        if ((d < 4.5 || a.angry) && a.cd <= 0) { a.cd = 6; a.angry = false; snd(a, 1.2); hit(a, 2, 'The ' + def.name + ' screamed.'); knockPlayer(dx / d, dz / d, 9, 4); shake(0.2, 0.03); blinkTo(a, false); const q = a.g.position; const an = Math.random() * 6.28; q.x = Math.max(2, Math.min(W - 2, P.x + Math.sin(an) * 14)); q.z = Math.max(2, Math.min(D - 2, P.z + Math.cos(an) * 14)); q.y = solidTop(Math.floor(q.x), Math.floor(q.z)) + 1.2; }
        ty = floorBelow(Math.floor(p.x), p.y + 0.5, Math.floor(p.z)) + 0.2; if (Math.random() < dt * 8) try { burst(p.x + (Math.random() - .5) * 2, p.y + 2.5, p.z + (Math.random() - .5) * 2, 0x9ab8d0, 1, 0.1); } catch (_) {} break;
    }
    // v1.0.11: walkers chase like the creeper — along the cached A* path round walls, not in a straight line through them
    if (def.move === 'walk' && spd > 0 && !a.frozen && ai !== 'wander' && d > 1.3 && Math.abs(ang - Math.atan2(dx, dz)) < 1e-6) { let pa = null; try { pa = pathAngle(a, P.x, P.z, P.y); } catch (_) {} if (pa !== null && isFinite(pa)) ang = pa; }
    if (face) a.ang = spd < 0 ? Math.atan2(dx, dz) : ang;
    a.yawVis = turnToward(a.yawVis, a.ang, dt * 6); a.g.rotation.y = a.yawVis;
    const mvAng = spd < 0 ? ang + Math.PI : ang, sp = Math.abs(spd);
    if (!a.frozen) {
      if (def.move === 'walk' || def.move === 'hop') { if (sp && !walkMove(a, sp, dt, mvAng) && ai === 'wander') a.wT = Math.min(a.wT || 0, 0.25); mobPhysics(a, dt); if (a.chg > 0 && a.lastX !== undefined && Math.hypot(p.x - a.lastX, p.z - a.lastZ) < sp * dt * 0.2) { a.chg = 0; a.stun = 1.5; shake(0.15, 0.02); } a.lastX = p.x; a.lastZ = p.z; }
      else if (def.move === 'float') floatMove(a, sp, dt, mvAng, ty);
      else if (def.move === 'swim') swimMove(a, sp, dt, mvAng, ty); }
    // idle sounds
    a.sndT -= dt; if (a.sndT <= 0) { a.sndT = 5 + Math.random() * 6; if (d < 24) snd(a, 1); }
    // animation
    const moving = sp > 0 || !a.onGround; a.walk += dt * (moving ? 8 : 0); const sw = moving ? Math.sin(a.walk) * 0.6 : 0;
    if (a.ll) { a.ll.rotation.x = sw; a.rl.rotation.x = -sw; }
    if (a.legs4) a.legs4.forEach((L, i) => L.rotation.x = (i === 0 || i === 3 ? 1 : -1) * Math.sin(a.t * 14) * 0.6);
    if (a.swing > 0) a.swing -= dt;
    if (a.la) { const reach = /walk/.test(def.move) && /^nm(09|13|26)$/.test(a.kind) ? -1.4 : 0; const sk = a.swing > 0 ? -1.6 : 0;
      a.la.rotation.x = reach + (reach ? 0 : -sw * 0.8) + Math.sin(a.t * 2) * 0.05; a.ra.rotation.x = reach + sk + (reach ? 0 : sw * 0.8); if (def.move === 'float') { a.la.rotation.x = -0.6 + Math.sin(a.t * 2) * 0.2; a.ra.rotation.x = -0.6 + sk + Math.cos(a.t * 2) * 0.2; } }
    if (def.move === 'float') a.rig.rotation.z = Math.sin(a.t * 1.6) * 0.06;
    if (def.move === 'swim' && !def.flat) { const wet = inWater(p), sw2 = wet && sp > 0.3 ? 1.15 : wet ? 0.35 : 0; a.swimK = (a.swimK || 0) + (sw2 - (a.swimK || 0)) * Math.min(1, dt * 3); a.rig.rotation.x = a.swimK; a.rig.rotation.z = Math.sin(a.t * 1.6) * 0.08;
      if (wet && a.ll) { const k = Math.sin(a.t * 9) * 0.5; a.ll.rotation.x = k; a.rl.rotation.x = -k; } if (wet && a.la && sp > 0.3) { a.la.rotation.x = -2.6 + Math.sin(a.t * 3) * 0.6; a.ra.rotation.x = -2.6 - Math.sin(a.t * 3) * 0.6; }
      if (wet && Math.random() < dt * 2) try { burst(p.x, p.y + 1.6, p.z, 0xd0f0ff, 1, 0.1); } catch (_) {} }
    if (a.manim) try { a.manim(a, dt, {mv: moving, atk: a.swing > 0 ? a.swing : 0, t: a.t, d}); } catch (e) { if (!U.err) U.err = 'anim ' + a.kind + ' ' + String(e && e.stack || e); }
    if ((a.lodT = (a.lodT || 0) - dt) <= 0 && a.lod) { a.lodT = 0.5; const v = d < (PH ? 14 : 22); if (v !== a.lodOn) { a.lodOn = v; for (const o of a.lod) o.visible = v; } }
    if (def.body === 'blob') { const k = a.onGround ? 1 + Math.sin(a.t * 6) * 0.06 : 1.15; a.rig.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k)); }
    if (a.fade > 0) for (const m of a.mats) { m.transparent = true; m.opacity = Math.max(0, 1 - a.fade / 1.5); }
    const f = a.flash > 0 ? 1 : 0; for (const m of a.mats) if (m.emissive && m.userData.e0) { if (f) m.emissive.setRGB(0.6, 0, 0); else m.emissive.copy(m.userData.e0); } }
  // ---- procedural sounds: 'nm:<type>:<pitch>' ----
  const ps = playSound; playSound = function (kind, vol, pan, m) {
    if (typeof kind !== 'string' || kind.slice(0, 3) !== 'nm:') return ps.apply(this, arguments);
    try { if (!AC || vol <= 0.001) return; const [, ty, pq] = kind.split(':'), k = +pq || 1, t = AC.currentTime, out = outNode(Math.min(1, vol) * 0.55, pan || 0);
      switch (ty) {
        case 'moan': osc('triangle', 210 * k, 150 * k, t, 1.2, out, 0.35); osc('sine', 105 * k, 80 * k, t + 0.1, 1.1, out, 0.2); noiseHit(t, 1.0, 'lowpass', 500, out, 0.08); break;
        case 'growl': osc('sawtooth', 95 * k, 60 * k, t, 0.7, out, 0.3); noiseHit(t, 0.6, 'lowpass', 320 * k, out, 0.25); break;
        case 'shriek': osc('sawtooth', 900 * k, 1500 * k, t, 0.45, out, 0.18); osc('square', 1200 * k, 700 * k, t + 0.1, 0.4, out, 0.08); noiseHit(t, 0.4, 'bandpass', 2500, out, 0.12, 2); break;
        case 'clank': noiseHit(t, 0.12, 'bandpass', 2600 * k, out, 0.4, 3); osc('triangle', 320 * k, 300 * k, t, 0.35, out, 0.25); osc('square', 640 * k, 610 * k, t + 0.01, 0.15, out, 0.06); break;
        case 'gurgle': for (let i = 0; i < 6; i++) osc('sine', (150 + Math.random() * 250) * k, (120 + Math.random() * 300) * k, t + i * 0.08, 0.07, out, 0.25); break;
        case 'cackle': for (let i = 0; i < 6; i++) osc('square', (i % 2 ? 520 : 640) * k, (i % 2 ? 470 : 560) * k, t + i * 0.11, 0.08, out, 0.12); break;
        case 'beep': osc('square', 1000 * k, 1000 * k, t, 0.08, out, 0.12); osc('square', 1400 * k, 1400 * k, t + 0.12, 0.08, out, 0.1); break;
        case 'zap': osc('sawtooth', 1300 * k, 200 * k, t, 0.28, out, 0.18); noiseHit(t, 0.2, 'highpass', 3000, out, 0.15); break;
        case 'whisper': noiseHit(t, 1.1, 'bandpass', 2800 * k, out, 0.22, 4, 1800 * k); noiseHit(t + 0.3, 0.8, 'bandpass', 3600 * k, out, 0.12, 5); break;
        case 'mystic': osc('sine', 523 * k, 530 * k, t, 1.8, out, 0.1); osc('sine', 659 * k, 665 * k, t + 0.25, 1.6, out, 0.08); osc('sine', 784 * k, 790 * k, t + 0.5, 1.5, out, 0.07); osc('triangle', 1046 * k, 1050 * k, t + 0.8, 1.2, out, 0.04); break;
        case 'neigh': osc('sawtooth', 520 * k, 900 * k, t, 0.25, out, 0.1); osc('sawtooth', 900 * k, 420 * k, t + 0.22, 0.7, out, 0.11); osc('triangle', 300 * k, 260 * k, t + 0.1, 0.8, out, 0.08); noiseHit(t, 0.6, 'bandpass', 1400 * k, out, 0.05, 3); break;
        case 'chime': osc('sine', 880 * k, 870 * k, t, 1.1, out, 0.15); osc('sine', 1320 * k, 1310 * k, t + 0.15, 1.0, out, 0.1); osc('sine', 1760 * k, 1750 * k, t + 0.3, 0.9, out, 0.06); break;
        case 'drum': for (let i = 0; i < 3; i++) { osc('sine', 120 * k, 50, t + i * 0.18, 0.22, out, 0.45); noiseHit(t + i * 0.18, 0.06, 'lowpass', 900, out, 0.2); } break;
        case 'thunder': noiseHit(t, 2.2, 'lowpass', 220, out, 0.6); osc('sine', 60, 30, t, 1.2, out, 0.4); noiseHit(t, 0.15, 'highpass', 2000, out, 0.3); break;
        case 'croak': for (let i = 0; i < 2; i++) osc('sawtooth', 140 * k, 90 * k, t + i * 0.22, 0.18, out, 0.25); break;
        case 'howl': osc('sine', 380 * k, 700 * k, t, 0.6, out, 0.2); osc('sine', 700 * k, 450 * k, t + 0.55, 0.9, out, 0.2); osc('triangle', 760 * k, 900 * k, t, 1.2, out, 0.04); break;
        default: osc('triangle', 300 * k, 200 * k, t, 0.4, out, 0.2); } } catch (_) {} };
  // ---- hooks into the mob system (same pattern as the night spider) ----
  const um = updateMobs; updateMobs = function (dt) { const sp = []; for (let i = mobs.length - 1; i >= 0; i--) if (isNM(mobs[i])) { sp.push(mobs[i]); mobs.splice(i, 1); }
    try { return um.apply(this, arguments); } finally { for (const a of sp) mobs.push(a); if (!paused) { for (const a of sp) { if (mobs.indexOf(a) < 0) continue; try { step(a, dt); } catch (e) { if (!U.err) U.err = String(e && e.stack || e); } }
        try { stepCorpses(dt); stepShots(dt); stepBolts(dt); effects(dt); trySpawn(dt); } catch (e) { if (!U.err) U.err = String(e && e.stack || e); } } } };
  const dmO = damageMob; damageMob = function (a, dmg, byPlayer) { if (isNM(a)) { const p = a.g.position;
      if (a.kind === 'nm01') { const fx = Math.sin(a.yawVis), fz = Math.cos(a.yawVis), dx = P.x - p.x, dz = P.z - p.z, d = Math.hypot(dx, dz) || 1; if ((fx * dx + fz * dz) / d > 0.3) { dmg *= 0.5; snd(a, 1.4); } }
      else if (a.kind === 'nm17') { dmg *= 0.6; snd(a, 1.3); }
      else if (a.kind === 'nm12' && byPlayer) { a.hits = (a.hits || 0) + 1; if (a.hits % 3 === 0) { snd(a, 1.5); a.parryT = 0.4; try { playSound('nm:clank:1.3', 0.6, 0); burst(p.x, p.y + 1.4, p.z, 0xfff0a0, 6, 0.5); } catch (_) {} return; } }
      else if (a.kind === 'nm05' && byPlayer && Math.random() < 0.4) { a.cd2 = Math.min(a.cd2, 0.3); }
      else if (a.kind === 'nm29') a.angry = true;
      else if (a.kind === 'nm14') a.seenHit = 1;
      if (a.frozen) a.frozen = false; }
    return dmO.call(this, a, dmg, byPlayer); };
  const drop = (id, n, p) => { if (n > 0 && id && (typeof NAMES === 'undefined' || NAMES[id])) dropItem(id, n, p.x, p.y + 0.6, p.z, (Math.random() - .5) * 2.5, 3.5, (Math.random() - .5) * 2.5, 0.4); };
  const km = killMob; killMob = function (a) { if (isNM(a)) { const p = a.g.position.clone(), def = a.def; U.killed++;
      try { burst(p.x, p.y + 0.8, p.z, 0xb0b8c8, 16, 1); snd(a, 0.7); } catch (_) {}
      try { for (const [id, lo, hi, ch] of def.drop || []) { if (ch && Math.random() > ch) continue; drop(id === 11 ? IT.STICK : id, lo + Math.floor(Math.random() * (hi - lo + 1)), p); } } catch (_) {}
      try { if (window.dropXP) dropXP(p.x, p.y, p.z, def.minion ? 1 : 6); } catch (_) {}
      if (a.kind === 'nm18') for (let i = 0; i < 2; i++) { const b = spawnKind('nmdrop', Math.floor(p.x), Math.floor(p.y), Math.floor(p.z), {grp: a.grp}); b.kbx = (i ? 1 : -1) * 3; b.vy = 4; b.onGround = false; }
      kill(a, true, true); return; }
    return km.apply(this, arguments); };
  const rmO = removeMob; removeMob = function (a) { if (a && a.beam) { try { scene.remove(a.beam); a.beam.geometry.dispose(); a.beam.material.dispose(); } catch (_) {} a.beam = null; } return rmO.apply(this, arguments); };
  const ew = enterWorld; enterWorld = function () { for (let i = mobs.length - 1; i >= 0; i--) if (isNM(mobs[i])) { try { removeMob(mobs[i]); } catch (_) {} } while (CORPSES.length) endCorpse(CORPSES.pop()); clearFx(); return ew.apply(this, arguments); };
  U.clear = () => { for (let i = mobs.length - 1; i >= 0; i--) if (isNM(mobs[i])) { try { removeMob(mobs[i]); } catch (_) {} } while (CORPSES.length) endCorpse(CORPSES.pop()); clearFx(); };
  U.state = () => ({alive: all().map(a => a.kind), shots: PR.length, bolts: BOLTS.length, slowT, poisonT, err: U.err});
})();
