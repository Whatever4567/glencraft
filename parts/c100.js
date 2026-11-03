/* ===================== GLX-C100 (v0.9.81): the two clansmen - new looks with painted faces + moods, gruff Scottish voices (synthesised), trading for rubies ===================== */
(function c100() {
  const S = window.__c100 = {trades: 0};
  const ID = k => (IT[k] !== undefined ? IT[k] : T[k]);
  // ---------- faces: one painted texture per look x mood (no separate eye pieces -> nothing can poke through) ----------
  const LOOKS = {
    hunter: {skin: '#e3b08c', hair: '#141414', brow: '#141414', iris: '#2f6fb0', stubble: null, shirt: 0x2f4f7a, hairHex: 0x141414, skinHex: 0xe3b08c},   // Hamish: black hair, no beard
    miner: {skin: '#b97c52', hair: '#3a2414', brow: '#2a180c', iris: '#2f6fb0', stubble: '#5a3a26', shirt: 0x6a4a2a, hairHex: 0x3a2414, skinHex: 0xb97c52}   // Angus: tanned, stubble
  };
  const texC = new Map();
  function faceTex(role, mood) {
    const L = LOOKS[role] || LOOKS.hunter, k = role + mood; if (texC.has(k)) return texC.get(k);
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    px(0, 0, 32, 32, L.skin);
    px(0, 0, 32, 5, L.hair); if (role === 'hunter') { px(0, 5, 3, 5, L.hair); px(29, 5, 3, 5, L.hair); px(4, 5, 7, 1, L.hair); }
    if (L.stubble) { g.globalAlpha = .55; for (let y = 19; y < 32; y++) for (let x = 3; x < 29; x++) if (((x * 7 + y * 13) % 5) < 2 && !(y < 23 && x > 12 && x < 19)) px(x, y, 1, 1, L.stubble); g.globalAlpha = 1; }
    // eyes (white, iris, pupil) - closed when asleep
    const eyeY = 13;
    for (const ex of [7, 19]) {
      if (mood === 'sleep') { px(ex, eyeY + 2, 6, 1, '#5a3a2a'); continue; }
      px(ex, eyeY, 6, 4, '#f4f1ea'); const ix = ex === 7 ? ex + 2 : ex + 1; px(ix, eyeY, 3, 4, L.iris); px(ix + 1, eyeY + 1, 1, 2, '#0c0e10');
    }
    // brows
    const b = (x, y, w, col) => px(x, y, w, 2, col || L.brow);
    if (mood === 'angry') { b(6, 10, 3); b(8, 11, 4); b(20, 11, 4); b(23, 10, 3); }
    else if (mood === 'confused') { b(6, 8, 7); b(19, 11, 7); }   // one brow way up: "huh?"
    else if (mood === 'smile') { b(6, 10, 7); b(19, 10, 7); }
    else if (mood === 'sleep') { b(6, 11, 7); b(19, 11, 7); }
    else { b(6, 11, 7); b(19, 11, 7); }   // focused: low, straight
    // nose shadow
    px(14, 17, 4, 4, 'rgba(90,50,30,.25)');
    // mouth
    const m = '#6a2a22';
    if (mood === 'smile') { px(11, 23, 10, 1, m); px(10, 22, 1, 1, m); px(21, 22, 1, 1, m); px(12, 24, 8, 1, '#f0e8e0'); px(12, 25, 8, 1, m); }
    else if (mood === 'angry') { px(11, 25, 10, 1, m); px(10, 26, 1, 1, m); px(21, 26, 1, 1, m); px(12, 24, 8, 1, '#f0e8e0'); px(12, 23, 8, 1, m); }
    else if (mood === 'confused') { px(17, 23, 4, 3, m); px(18, 24, 2, 1, '#2a0c08'); }
    else if (mood === 'sleep') { px(14, 24, 4, 2, m); }
    else { px(10, 23, 12, 3, '#b8665a'); px(11, 24, 10, 1, '#2a0806'); }   // focused: lips you can see (v1.0.28)
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
    texC.set(k, t); return t;
  }
  // ---------- the model: blocky, kilted, two looks (set once the role is known) ----------
  S.model = function () {
    try { playerTextures(); } catch (_) {}
    const g = new THREE.Group(), L = LOOKS.hunter, mats = [];
    const M = o => { const m = new THREE.MeshLambertMaterial(o); mats.push(m); return m; };
    const skin = M({color: L.skinHex}), hair = M({color: L.hairHex}), faceM = M({map: faceTex('hunter', 'focused')}), shirt = M({color: L.shirt});
    const kiltM = M(tartanTex ? {map: tartanTex, side: THREE.DoubleSide} : {color: 0x2b4f8a, side: THREE.DoubleSide}), leather = M({color: 0x3e2716}), sock = M({color: 0x6a6a5a}), metal = M({color: 0xc8ccd0});
    const box = (w, h, d, m, x, y, z, par) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); (par || g).add(b); return b; };
    const head = new THREE.Group(); head.position.y = 1.5; g.add(head);
    const hm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), [skin, skin, hair, skin, faceM, hair]); hm.position.y = 0.25; head.add(hm);
    const cap = box(0.54, 0.1, 0.54, hair, 0, 0.53, 0, head), back = box(0.54, 0.3, 0.06, hair, 0, 0.34, -0.25, head);
    const nose = box(0.07, 0.09, 0.05, skin, 0, 0.2, 0.27, head);
    // v0.9.82: two outfits, shown by role - Hamish: long charcoal coat, brass buttons, dark trousers, black boots;
    //          Angus: short heather-grey wool jacket, tartan sash, brown belt, moleskin trousers, brown boots, a bit broader
    const OF = {hunter: [], miner: []}, grp = k => { const o = new THREE.Group(); OF[k].push(o); return o; };
    const coat = M({color: 0x34363b}), brass = M({color: 0xc9a23e}), trousH = M({color: 0x1c1f26}), bootH = M({color: 0x0e0e10});
    const jack = M({color: 0x9c98a6}), belt = M({color: 0x6b4423}), trousA = M({color: 0x5b5340}), bootA = M({color: 0x5e3818});
    { const o = grp('hunter'); g.add(o);
      box(0.52, 0.64, 0.3, coat, 0, 1.17, 0, o); box(0.56, 0.44, 0.33, coat, 0, 0.66, 0, o);   // coat body + long skirt to the knee
      box(0.56, 0.1, 0.34, coat, 0, 1.47, 0, o);   // collar
      for (const y of [1.36, 1.22, 1.08, 0.94, 0.8]) box(0.05, 0.05, 0.02, brass, 0, y, 0.165, o);
      box(0.02, 0.4, 0.02, trousH, 0, 0.66, 0.17, o); }   // the coat's front opening
    { const o = grp('miner'); g.add(o);
      box(0.58, 0.6, 0.31, jack, 0, 1.17, 0, o);   // short jacket, broader
      box(0.6, 0.08, 0.33, belt, 0, 0.88, 0, o); box(0.09, 0.07, 0.02, metal, 0, 0.88, 0.17, o);
      const sh = box(0.12, 0.84, 0.33, kiltM, 0, 1.17, 0.005, o); sh.rotation.z = 0.62;   // tartan sash
      box(0.44, 0.38, 0.27, trousA, 0, 0.66, 0, o); }   // seat of the trousers under the jacket
    box(0.44, 0.38, 0.25, trousH, 0, 0.66, 0, OF.hunter[0]);
    const arms = [], legs = [];
    for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * 0.35, 1.44, 0); g.add(piv);
      const h = grp('hunter'); piv.add(h); box(0.2, 0.5, 0.2, coat, 0, -0.25, 0, h); box(0.21, 0.06, 0.21, brass, 0, -0.47, 0, h);
      const a = grp('miner'); piv.add(a); box(0.23, 0.5, 0.23, jack, 0, -0.25, 0, a);
      box(0.18, 0.18, 0.18, skin, 0, -0.58, 0, piv); arms.push(piv); }
    for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * 0.12, 0.5, 0); g.add(piv);
      const h = grp('hunter'); piv.add(h); box(0.2, 0.36, 0.2, trousH, 0, -0.18, 0, h); box(0.23, 0.14, 0.3, bootH, 0, -0.43, 0.03, h);
      const a = grp('miner'); piv.add(a); box(0.21, 0.34, 0.21, trousA, 0, -0.17, 0, a); box(0.24, 0.16, 0.3, bootA, 0, -0.42, 0.03, a); box(0.25, 0.04, 0.31, belt, 0, -0.33, 0.03, a);
      legs.push(piv); }
    for (const o of OF.miner) o.visible = false;
    // a plain dirk on the belt (no tool system any more)
    box(0.04, 0.26, 0.04, metal, 0.22, 0.74, 0.14);
    return {g, legs, arms, head, mats, speed: 0, hp: 24, maxHp: 24, hitY: 1.1, hitR: .55, hostile: false, tall: 2, isBot: true, look: {skin, hair, faceM, shirt, back, OF, arms}};
  };
  function setFace(a) {
    const lk = a.look; if (!lk) return;
    const role = a.role === 'miner' ? 'miner' : 'hunter';
    if (a.lookRole !== role) { a.lookRole = role; const L = LOOKS[role]; lk.skin.color.setHex(L.skinHex); lk.hair.color.setHex(L.hairHex); lk.shirt.color.setHex(L.shirt); lk.back.scale.y = role === 'hunter' ? 1 : 0.6; if (lk.OF) { for (const k in lk.OF) for (const o of lk.OF[k]) o.visible = k === role; lk.arms.forEach((p, i) => { p.position.x = (i ? 1 : -1) * (role === 'miner' ? 0.385 : 0.35); }); } a.moodShown = null; }
    const mood = a.mood || 'focused';
    if (a.moodShown !== mood) { a.moodShown = mood; lk.faceM.map = faceTex(role, mood); lk.faceM.needsUpdate = true; }
  }
  // ---------- voices: gruff Scottish grunts, made from a buzzing "voice" through vowel filters (no recordings) ----------
  const VOW = {a: [750, 1200, 2500], o: [500, 900, 2400], u: [350, 800, 2300], e: [550, 1500, 2500], m: [260, 1100, 2400], i: [320, 2100, 2800]};
  function syl(t, dur, f0a, f0b, v1, v2, out, roll, gain) {
    const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0a, t); o.frequency.linearRampToValueAtTime(f0b, t + dur);
    const vib = AC.createOscillator(), vg = AC.createGain(); vib.frequency.value = 5.5; vg.gain.value = f0a * 0.025; vib.connect(vg); vg.connect(o.frequency);
    const env = AC.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(gain || 0.5, t + 0.03); env.gain.setValueAtTime(gain || 0.5, t + dur * 0.7); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let src = o;
    if (roll) { const am = AC.createGain(); am.gain.value = 0.55; const lfo = AC.createOscillator(); lfo.type = 'square'; lfo.frequency.value = roll; const lg = AC.createGain(); lg.gain.value = 0.45; lfo.connect(lg); lg.connect(am.gain); o.connect(am); src = am; lfo.start(t); lfo.stop(t + dur + 0.05); }
    const A = VOW[v1], B = VOW[v2 || v1];
    for (let i = 0; i < 3; i++) { const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = i ? 9 : 6; f.frequency.setValueAtTime(A[i], t); f.frequency.linearRampToValueAtTime(B[i], t + dur); const fg = AC.createGain(); fg.gain.value = [1, 0.55, 0.25][i]; src.connect(f); f.connect(fg); fg.connect(env); }
    env.connect(out); o.start(t); vib.start(t); o.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
  }
  function breath(t, dur, out, g) { const n = Math.floor(AC.sampleRate * dur), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = AC.createBufferSource(); s.buffer = b; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.2; const e = AC.createGain(); e.gain.value = g || 0.25; s.connect(f); f.connect(e); e.connect(out); s.start(t); }
  S.voice = function (kind, pos) {
    if (!AC) return; let vol = 0.9, pan = 0;
    if (pos) { const dx = pos.x - P.x, dz = pos.z - P.z, d = Math.hypot(dx, pos.y - P.y, dz); if (d > 28) return; vol = Math.pow(1 - d / 28, 0.85); const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); pan = d > 0.1 ? (dx * rx + dz * rz) / d * 0.8 : 0; }
    const out = (window.mobOut || outNode)(vol * 0.55, pan), t = AC.currentTime + 0.01, k = 0.92 + Math.random() * 0.16;
    switch (kind) {
      case 'hrr': breath(t, 0.06, out, 0.15); syl(t + 0.04, 0.42, 105 * k, 82 * k, 'e', 'u', out, 27, 0.5); break;                         // "hrrrm"
      case 'hmm': syl(t, 0.5, 115 * k, 98 * k, 'm', 'm', out, 0, 0.6); syl(t + 0.52, 0.22, 100 * k, 88 * k, 'm', 'm', out, 0, 0.35); break;   // "hmm-m"
      case 'huh': breath(t, 0.08, out, 0.3); syl(t + 0.06, 0.34, 115 * k, 215 * k, 'a', 'u', out, 0, 0.55); break;                     // "huh??" (rising)
      case 'grr': syl(t, 0.35, 92 * k, 78 * k, 'u', 'a', out, 31, 0.5); break;
      case 'happy': syl(t, 0.2, 140 * k, 160 * k, 'o', 'o', out, 0, 0.5); syl(t + 0.24, 0.42, 175 * k, 120 * k, 'a', 'i', out, 0, 0.55); break;   // "och-aye!"
      case 'grumble': syl(t, 0.3, 95 * k, 85 * k, 'm', 'o', out, 22, 0.45); syl(t + 0.32, 0.4, 100 * k, 70 * k, 'a', 'u', out, 26, 0.45); break;   // "mmph... naw"
    }
  };
  // ---------- trading ----------
  const LV = [0, 5, 12];   // trades needed for level 1 / 2 / 3
  const level = () => S.trades >= LV[2] ? 3 : S.trades >= LV[1] ? 2 : 1;
  const SELL = [['LOG', 8, 'logs'], ['COAL', 8, 'coal'], ['MUTTON', 4, 'raw mutton'], ['HAGGIS', 3, 'haggis'], ['WHEAT', 8, 'wheat'], ['WOOL', 6, 'wool']];
  const BUY = [[1, 'IHELM', 1, 4], [2, 'TORCH', 16, 8], [2, 'BED', 1, 8], [2, 'IPICK', 1, 8], [3, 'DPICK', 1, 12]];
  const logIds = () => Object.keys(LOGGY).map(Number).filter(id => NAMES[id] && /log/i.test(NAMES[id]));
  function sellId(k) { if (k !== 'LOG') return ID(k); let best = T.LOG, n = 0; for (const id of logIds()) if (cnt(id) > n) { n = cnt(id); best = id; } return best; }
  let ui = null, who = null, focus = 0;
  const icon = id => { const s = ICONS[id]; return typeof s === 'string' ? '<img src="' + s + '" style="width:22px;height:22px;vertical-align:middle;margin:0 3px;image-rendering:auto">' : ''; };
  function build() {
    ui = document.createElement('div'); ui.id = 'tradeUI'; ui.className = 'hidden'; ui.dataset.testid = 'trade-menu';
    ui.style.cssText = 'position:fixed;inset:0;z-index:66;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45)';
    document.body.appendChild(ui);
    const st = document.createElement('style'); st.textContent = '#tradeUI.hidden{display:none!important}#tradeUI .tp{background:rgba(24,30,24,.96);color:#f3ead2;border:2px solid #d9b45a;border-radius:14px;padding:12px 14px;width:min(460px,94vw);max-height:90vh;overflow:auto;font:14px/1.35 system-ui,sans-serif}#tradeUI button{display:flex;align-items:center;width:100%;margin:4px 0;padding:6px 8px;border-radius:9px;border:1px solid #6a5a3a;background:#2e3a2c;color:#f3ead2;font:600 14px system-ui;text-align:left;cursor:pointer}#tradeUI button[disabled]{opacity:.45}#tradeUI button.focus{outline:2px solid #ffd35a;outline-offset:1px}#tradeUI h3{margin:2px 0 6px;font-size:17px}#tradeUI .sec{margin:8px 0 2px;font-weight:800;opacity:.85}#tradeUI .bar{height:9px;border-radius:5px;background:#3a3a30;overflow:hidden;margin:3px 0 2px}#tradeUI .bar i{display:block;height:100%;background:linear-gradient(90deg,#c8142e,#ff6a7a)}';
    document.head.appendChild(st);
  }
  function render() {
    if (!ui || !who) return;
    const lv = level(), nx = LV[lv] , pr = lv >= 3 ? 1 : (S.trades - LV[lv - 1]) / (nx - LV[lv - 1]);
    let h = '<div class="tp"><h3>' + (who.name || 'Clansman') + ' - trading</h3>';
    h += '<div>Trade level <b>' + lv + '</b>' + (lv < 3 ? ' &middot; ' + (S.trades - LV[lv - 1]) + '/' + (nx - LV[lv - 1]) + ' trades to level ' + (lv + 1) : ' &middot; top level') + '</div><div class="bar" data-testid="trade-level-bar"><i style="width:' + Math.round(pr * 100) + '%"></i></div>';
    h += '<div>You have ' + icon(IT.RUBY) + '<b>' + cnt(IT.RUBY) + '</b> rubies</div>';
    h += '<div class="sec">Sell to him</div>';
    SELL.forEach(([k, n, lab], i) => { const id = sellId(k); if (id === undefined) return; const have = cnt(id); h += '<button data-s="' + i + '"' + (have < n ? ' disabled' : '') + '>' + icon(id) + n + ' ' + lab + ' &rarr; ' + icon(IT.RUBY) + '1 ruby <span style="margin-left:auto;opacity:.7">(have ' + have + ')</span></button>'; });
    h += '<div class="sec">Buy from him</div>';
    BUY.forEach(([l, k, n, price], i) => { const id = ID(k); if (id === undefined) return; const lock = lv < l; h += '<button data-b="' + i + '"' + (lock ? ' disabled' : '') + '>' + icon(id) + (n > 1 ? n + ' ' : '') + (NAMES[id] || k) + ' &larr; ' + icon(IT.RUBY) + price + (lock ? ' <span style="margin-left:auto">(level ' + l + ')</span>' : '') + '</button>'; });
    h += '<button data-x="1" style="justify-content:center;margin-top:8px">Close</button>';
    h += '<div style="font-size:11px;opacity:.6;margin-top:4px"><span class="padok" title="Controller support">\u2705</span></div></div>';
    ui.innerHTML = h;
    ui.querySelectorAll('button').forEach(b => b.onclick = () => { if (b.dataset.s) sell(+b.dataset.s); else if (b.dataset.b) buy(+b.dataset.b); else closeTrade(); });
    refocus();
  }
  const items = () => ui ? [...ui.querySelectorAll('button')] : [];
  function refocus() { const it = items(); if (!it.length) return; focus = Math.max(0, Math.min(focus, it.length - 1)); it.forEach((b, i) => b.classList.toggle('focus', i === focus)); try { it[focus].scrollIntoView({block: 'nearest'}); } catch (_) {} }
  function react(ok) { if (!who) return; who.mood = ok ? 'smile' : 'angry'; who.moodT = ok ? 1.6 : 1.2; S.voice(ok ? 'aye' : 'ach', who.g.position); }
  function done() { const before = level(); S.trades++; if (level() > before) { toast((who.name || 'He') + ' trusts you more: trade level ' + level()); try { sfx('levelup'); } catch (_) {} } try { renderHotbar(); } catch (_) {} render(); }
  function sell(i) { const [k, n] = SELL[i], id = sellId(k); if (cnt(id) < n) { react(false); return; } inv[id] = cnt(id) - n; addItem(IT.RUBY, 1); react(true); done(); }
  function buy(i) { const [l, k, n, price] = BUY[i], id = ID(k); if (level() < l || cnt(IT.RUBY) < price) { react(false); if (cnt(IT.RUBY) < price) toast('Not enough rubies'); return; } inv[IT.RUBY] = cnt(IT.RUBY) - price; addItem(id, n); react(true); done(); }
  function openTrade(m) {
    if (!ui) build(); who = m; m.trading = true; focus = 0;
    menuOpen = true; attackMouse = attackPad = attackTouch = false; ui.classList.remove('hidden'); render(); S.voice('open', m.g.position);
    if (document.pointerLockElement) document.exitPointerLock();
  }
  function hideTrade() { if (who) who.trading = false; who = null; if (ui) ui.classList.add('hidden'); }
  function closeTrade() { hideTrade(); openMenu(false); }
  S.openTrade = openTrade; S.closeTrade = closeTrade; S.isOpen = () => !!who;
  const cp = closePanels; closePanels = function () { hideTrade(); return cp.apply(this, arguments); };
  const mpi = menuPadInput; menuPadInput = function (E, axes, gp) {
    if (!who) return mpi.apply(this, arguments);
    if (E[1]) { closeTrade(); return; }
    if (E[12] || E[14]) { focus = (focus - 1 + items().length) % items().length; refocus(); }
    if (E[13] || E[15]) { focus = (focus + 1) % items().length; refocus(); }
    if (E[0]) { const b = items()[focus]; if (b && !b.disabled) b.click(); else react(false); }
  };
  // LT / right click / the USE button on a clansman opens trading (before anything else gets the press)
  const ui0 = useItem; useItem = function () {
    if (!menuOpen && !paused && !dead && started) { let m = null; try { m = reachMob(4); } catch (_) {}
      if (m && m.kind === 'clansman') { if (m.sleeping) { toast((m.name || 'He') + ' is fast asleep'); return; } if (m.tgt) { toast((m.name || 'He') + ' is busy fighting'); return; } openTrade(m); return; } }
    return ui0.apply(this, arguments);
  };
  // faces follow the mood (cheap: only a texture swap when the mood changes)
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments); for (const a of mobs) if (a.kind === 'clansman' && a.look) setFace(a); return r; };
  // trade level is saved with the world
  const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (!DIM.cur) d.c100 = {trades: S.trades}; } catch (_) {} return d; };
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); if (d && !d.dim) S.trades = (d.c100 && +d.c100.trades) || 0; return r; };
  const ew = enterWorld; enterWorld = function (save) { if (!save) S.trades = 0; hideTrade(); return ew.apply(this, arguments); };
})();
