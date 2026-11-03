/* ===================== GLX-C43 (v0.9.43): guns - hi-res models + icons, magazines, recoil/flash/slide/reload animations, R / touch reload, pistol vs rifle balance, silver bullets ===================== */
(function c43() {
  NAMES[IT.MUSKET] = 'Highland rifle';
  Object.assign(GUN[IT.PISTOL], {dmg: 7, range: 36, rate: 0.25, mag: 12, rl: 1.6, kick: 0.035});
  Object.assign(GUN[IT.MUSKET], {dmg: 20, range: 72, rate: 1.0, mag: 5, rl: 2.4, kick: 0.08});
  for (const r of RECIPES) if (r.out === IT.MUSKET) r.name = 'Highland rifle';
  var gunMag = {[IT.PISTOL]: 0, [IT.MUSKET]: 0}; window.gunMag = gunMag;
  let cool = 0, rlT = 0, rlId = 0, recoil = 0, flashT = 0;
  const se = serialize; serialize = function () { const d = se.apply(this, arguments); d.gunMag = Object.assign({}, gunMag); return d; };
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); if (d && d.gunMag) Object.assign(gunMag, d.gunMag); return r; };
  // ---- textures (512 px) ----
  const cv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const metalT = cv(512, 512, (g, w) => { g.fillStyle = '#2b2e33'; g.fillRect(0, 0, w, w); for (let i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (Math.random() < .5 ? '255,255,255' : '0,0,0') + ',' + Math.random() * .06 + ')'; g.fillRect(Math.random() * w, Math.random() * w, 40 + Math.random() * 120, 1); } });
  const silverT = cv(512, 512, (g, w) => { g.fillStyle = '#9ea6b0'; g.fillRect(0, 0, w, w); for (let i = 0; i < 2200; i++) { g.fillStyle = 'rgba(255,255,255,' + Math.random() * .12 + ')'; g.fillRect(Math.random() * w, Math.random() * w, 60 + Math.random() * 100, 1); } g.strokeStyle = 'rgba(60,60,70,.5)'; g.lineWidth = 3; for (let x = 20; x < w; x += 46) { g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 30, 160, x - 30, 320, x, 512); g.stroke(); } });
  const woodT = cv(512, 512, (g, w) => { const gr = g.createLinearGradient(0, 0, 0, w); gr.addColorStop(0, '#6b3a1a'); gr.addColorStop(1, '#4a2410'); g.fillStyle = gr; g.fillRect(0, 0, w, w); for (let i = 0; i < 160; i++) { g.strokeStyle = 'rgba(' + (Math.random() < .5 ? '30,12,4' : '140,80,40') + ',' + (.15 + Math.random() * .25) + ')'; g.lineWidth = 1 + Math.random() * 2; const y = Math.random() * w; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + (Math.random() - .5) * 40, 340, y + (Math.random() - .5) * 40, 512, y + (Math.random() - .5) * 20); g.stroke(); } });
  const gripT = cv(256, 256, (g, w) => { g.fillStyle = '#1c1c1e'; g.fillRect(0, 0, w, w); g.fillStyle = '#2c2c30'; for (let y = 0; y < w; y += 8) for (let x = (y / 8 % 2) * 4; x < w; x += 8) g.fillRect(x, y, 4, 4); });
  const M = {metal: new THREE.MeshStandardMaterial({map: metalT, roughness: .45, metalness: .7}), silver: new THREE.MeshStandardMaterial({map: silverT, roughness: .35, metalness: .8}),
    wood: new THREE.MeshStandardMaterial({map: woodT, roughness: .7}), grip: new THREE.MeshStandardMaterial({map: gripT, roughness: .9}), brass: new THREE.MeshStandardMaterial({color: 0xc8a050, roughness: .4, metalness: .8}), dark: new THREE.MeshStandardMaterial({color: 0x111111, roughness: .6})};
  const box = (p, m, w, h, d, x, y, z, rx) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); if (rx) b.rotation.x = rx; p.add(b); return b; };
  const cyl = (p, m, r, l, x, y, z) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 12), m); c.rotation.x = Math.PI / 2; c.position.set(x, y, z); p.add(c); return c; };
  function pistolMesh() {   // barrel along -z
    const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
    const frame = box(rig, M.metal, 0.05, 0.035, 0.2, 0, 0, -0.02);
    const slide = new THREE.Group(); rig.add(slide); box(slide, M.silver, 0.052, 0.04, 0.22, 0, 0.035, -0.03); for (let i = 0; i < 6; i++) box(slide, M.dark, 0.054, 0.03, 0.004, 0, 0.037, 0.05 + i * 0.008);
    box(slide, M.dark, 0.01, 0.012, 0.01, 0, 0.06, -0.13); box(slide, M.dark, 0.02, 0.012, 0.01, 0, 0.06, 0.07);
    cyl(rig, M.dark, 0.009, 0.02, 0, 0.035, -0.145);
    const grp = box(rig, M.grip, 0.046, 0.13, 0.055, 0, -0.07, 0.05, 0.22);
    const mag = new THREE.Group(); rig.add(mag); box(mag, M.metal, 0.036, 0.12, 0.045, 0, -0.075, 0.052, 0.22); box(mag, M.brass, 0.012, 0.01, 0.03, 0, -0.012, 0.045);
    const tg = box(rig, M.metal, 0.01, 0.006, 0.06, 0, -0.035, -0.015); box(rig, M.metal, 0.01, 0.03, 0.006, 0, -0.05, -0.045); box(rig, M.dark, 0.006, 0.02, 0.006, 0, -0.03, -0.01);
    const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.035, -0.16); rig.add(muzzle);
    Object.assign(g.userData, {gun: IT.PISTOL, rig, slide, mag, muzzle}); return g;
  }
  function rifleMesh() {
    const g = new THREE.Group(), rig = new THREE.Group(); g.add(rig);
    const stock = new THREE.Group(); rig.add(stock); box(stock, M.wood, 0.05, 0.07, 0.26, 0, -0.02, 0.2); box(stock, M.wood, 0.05, 0.1, 0.06, 0, -0.035, 0.33); box(stock, M.dark, 0.052, 0.104, 0.012, 0, -0.035, 0.365);
    box(rig, M.wood, 0.048, 0.05, 0.3, 0, -0.01, -0.12);
    box(rig, M.metal, 0.044, 0.045, 0.16, 0, 0.03, 0.02);
    cyl(rig, M.metal, 0.012, 0.5, 0, 0.03, -0.32); cyl(rig, M.dark, 0.016, 0.03, 0, 0.03, -0.57);
    const scope = new THREE.Group(); rig.add(scope); cyl(scope, M.dark, 0.016, 0.2, 0, 0.085, 0.0); cyl(scope, M.dark, 0.022, 0.03, 0, 0.085, -0.1); cyl(scope, M.dark, 0.02, 0.03, 0, 0.085, 0.1); box(scope, M.metal, 0.012, 0.03, 0.012, 0, 0.062, -0.05); box(scope, M.metal, 0.012, 0.03, 0.012, 0, 0.062, 0.05);
    const slide = new THREE.Group(); rig.add(slide); box(slide, M.silver, 0.02, 0.012, 0.012, 0.035, 0.035, 0.07); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), M.silver); knob.position.set(0.05, 0.03, 0.07); slide.add(knob);
    const mag = new THREE.Group(); rig.add(mag); box(mag, M.metal, 0.036, 0.07, 0.06, 0, -0.04, 0.0);
    box(rig, M.metal, 0.01, 0.006, 0.07, 0, -0.04, 0.08); box(rig, M.dark, 0.006, 0.025, 0.006, 0, -0.03, 0.085);
    const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.03, -0.6); rig.add(muzzle);
    Object.assign(g.userData, {gun: IT.MUSKET, rig, slide, mag, muzzle}); return g;
  }
  const live = new Set();
  const mi = makeItemMesh;
  makeItemMesh = function (id) {
    if (id === IT.PISTOL || id === IT.MUSKET) { const g = id === IT.PISTOL ? pistolMesh() : rifleMesh(); g.rotation.set(0, Math.PI / 2, 0); live.add(g); return g; }
    return mi.apply(this, arguments);
  };
  // hi-res icons
  const icon = (fn) => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); fn(g); return c.toDataURL(); };
  const metalGrad = (g, y0, y1, a, b) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, a); gr.addColorStop(.5, b); gr.addColorStop(1, a); return gr; };
  ICONS[IT.PISTOL] = icon(g => { g.translate(128, 128); g.rotate(-0.12);
    g.fillStyle = '#1d1d20'; g.beginPath(); g.moveTo(-10, 6); g.lineTo(26, 6); g.lineTo(36, 78); g.lineTo(6, 82); g.closePath(); g.fill(); g.fillStyle = '#2d2d32'; for (let y = 20; y < 76; y += 8) for (let x = 8; x < 30; x += 8) g.fillRect(x + (y - 20) * .15, y, 4, 4);
    g.fillStyle = metalGrad(g, -40, 10, '#6f7680', '#dfe5ec'); g.fillRect(-92, -36, 150, 40); g.fillStyle = '#2b2e33'; g.fillRect(-88, 2, 120, 14);
    g.strokeStyle = '#2b2e33'; g.lineWidth = 6; g.beginPath(); g.arc(-18, 22, 18, 0, Math.PI); g.stroke(); g.fillStyle = '#111'; for (let i = 0; i < 6; i++) g.fillRect(30 + i * 5, -34, 2, 36); g.fillRect(-92, -44, 8, 8); g.fillRect(44, -44, 12, 8); });
  ICONS[IT.MUSKET] = icon(g => { g.translate(128, 128); g.rotate(-0.55);
    g.fillStyle = '#5a2e12'; g.beginPath(); g.moveTo(40, -6); g.lineTo(118, -10); g.lineTo(120, 30); g.lineTo(40, 14); g.closePath(); g.fill(); g.strokeStyle = 'rgba(30,10,0,.5)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(44, -2 + i * 3); g.lineTo(116, -6 + i * 6); g.stroke(); }
    g.fillStyle = '#6b3a1a'; g.fillRect(-60, -6, 100, 18); g.fillStyle = metalGrad(g, -12, 2, '#33363b', '#8b929c'); g.fillRect(-120, -10, 170, 9); g.fillRect(-10, -16, 50, 22);
    g.fillStyle = '#111'; g.fillRect(-14, -32, 56, 12); g.fillRect(-20, -34, 8, 16); g.fillRect(40, -34, 8, 16); g.fillStyle = '#9ea6b0'; g.beginPath(); g.arc(30, 12, 6, 0, 7); g.fill(); g.fillStyle = '#2b2e33'; g.fillRect(4, 8, 16, 20); });
  try { if (typeof iconCache !== 'undefined') { delete iconCache[IT.PISTOL]; delete iconCache[IT.MUSKET]; } } catch (_) {}
  // ---- sounds ----
  const click = (f, dur, vol, type) => { try { if (!AC || (window.__c322 && __c322.snd())) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.4, t + dur); g.gain.setValueAtTime(vol * SET.sfx, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02); } catch (_) {} };
  // ---- muzzle flash ----
  const flash = glowSprite(0xffd27a, 0.9); flash.visible = false; scene.add(flash); const flashL = new THREE.PointLight(0xffc070, 0, 8, 2); scene.add(flashL);
  // ---- magazines, fire rate, reload ----
  function startReload(id) { const G = GUN[id]; if (rlT > 0 || gunMag[id] >= G.mag) return false; if (!MODE.infinite && ammoCount() <= 0) { try { window.__c322 && __c322.dry(); } catch (_) {} toast('No bullets - craft Silver bullets (1 Silver ingot + 1 Gunpowder)'); click(900, .05, .1); return false; }
    rlT = G.rl; rlId = id; click(500, .06, .15); try { window.__c322 && __c322.reload(id, G.rl); } catch (_) {} return true; }
  window.reloadGun = () => { if (GUN[selId] && cnt(selId) > 0) startReload(selId); };
  function finishReload() { const G = GUN[rlId]; let need = G.mag - gunMag[rlId];
    if (MODE.infinite) gunMag[rlId] = G.mag; else while (need > 0 && ammoCount() > 0) { const a = ammoPick(); const take = Math.min(need, inv[a]); inv[a] -= take; need -= take; gunMag[rlId] += take; }
    renderHotbar(); }
  const ui = useItem;
  useItem = function () {
    const id = selId;
    if (!GUN[id] || !(cnt(id) > 0) || menuOpen || paused || dead || !started) return ui.apply(this, arguments);
    if (rlT > 0) return;
    if (cool > 0) return;
    if (gunMag[id] <= 0) { startReload(id); return; }
    fireGun(id); gunMag[id]--; cool = GUN[id].rate; recoil = 1; flashT = 0.06;
    if (gunMag[id] <= 0) setTimeout(() => { if (selId === id) startReload(id); }, 250);
  };
  window.addEventListener('keydown', e => { if (e.code === 'KeyR' && started && !menuOpen) window.reloadGun(); });
  // touch reload button + ammo readout
  const hud = document.createElement('div'); hud.id = 'ammoHud'; hud.style.cssText = 'position:fixed;right:14px;bottom:86px;z-index:6;font:700 15px system-ui;color:#fff;text-shadow:0 1px 3px #000;display:none;pointer-events:none';
  const rb = document.createElement('button'); rb.id = 'reloadBtn'; rb.textContent = 'Reload'; rb.dataset.testid = 'reload-btn'; rb.style.cssText = 'position:fixed;right:14px;bottom:112px;z-index:6;display:none;padding:10px 14px;border-radius:12px;border:1px solid #fff6;background:#0008;color:#fff;font:700 14px system-ui';
  rb.addEventListener('click', e => { e.stopPropagation(); window.reloadGun(); }); rb.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); window.reloadGun(); }, {passive: false});
  document.body.appendChild(hud); document.body.appendChild(rb);
  const up = updatePlayer;
  updatePlayer = function (dt) {
    const r = up.apply(this, arguments);
    try {
      if (cool > 0) cool -= dt;
      if (rlT > 0) { const G = GUN[rlId], t0 = rlT; rlT -= dt; const f = 1 - rlT / G.rl, f0 = 1 - t0 / G.rl;
        if (f0 < 0.25 && f >= 0.25) click(700, .05, .18); if (f0 < 0.55 && f >= 0.55) click(320, .08, .22, 'triangle'); if (f0 < 0.85 && f >= 0.85) { click(1100, .04, .2); click(600, .06, .15); }
        if (rlT <= 0) { finishReload(); rlT = 0; } }
      recoil *= Math.exp(-dt * (GUN[selId] && GUN[selId].rate > 0.5 ? 6 : 12));
      // animate every gun model: recoil kick + eased return, slide/bolt, reload (dip, mag out/in, rack)
      const rf = rlT > 0 ? 1 - rlT / GUN[rlId].rl : 0;
      for (const g of live) { if (!g.parent) { live.delete(g); continue; } const u = g.userData, rig = u.rig; const isP = u.gun === IT.PISTOL;
        const dip = rlT > 0 ? Math.sin(Math.min(1, rf * 1.15) * Math.PI) : 0;
        rig.position.set(0, -0.12 * dip, recoil * (isP ? 0.05 : 0.09)); rig.rotation.set(recoil * (isP ? 0.45 : 0.25) - 0.9 * dip * 0.6, 0, 0.5 * dip);
        const magOut = rlT > 0 ? (rf < 0.25 ? rf / 0.25 : rf < 0.55 ? 1 - (rf - 0.25) / 0.3 : 0) : 0; u.mag.position.y = -0.12 * magOut; u.mag.visible = magOut < 0.98;
        const rack = rlT > 0 && rf > 0.8 ? Math.sin((rf - 0.8) / 0.2 * Math.PI) : 0; u.slide.position.z = (isP ? 0.04 : 0.05) * Math.max(recoil > 0.5 ? (recoil - 0.5) * 2 : 0, rack, gunMag[u.gun] <= 0 && isP ? 1 : 0); }
      if (flashT > 0) { flashT -= dt; const g = [...live].find(q => q.parent === held || (q.parent && q.parent.parent === held)) || [...live][0]; if (g) { const v = new THREE.Vector3(); g.userData.muzzle.getWorldPosition(v); flash.position.copy(v); flashL.position.copy(v); } flash.visible = true; flash.scale.setScalar(0.6 + Math.random() * 0.5); flashL.intensity = 3; }
      else { flash.visible = false; flashL.intensity = 0; }
      const gsel = GUN[selId] && cnt(selId) > 0;
      hud.style.display = gsel ? 'block' : 'none'; if (gsel) hud.textContent = (rlT > 0 ? 'Reloading… ' : '') + gunMag[selId] + ' / ' + GUN[selId].mag + '  ·  ' + ammoCount();
      rb.style.display = gsel && (touchMode || (typeof SET !== 'undefined' && SET.touch)) ? 'block' : 'none';
    } catch (e) {}
    return r;
  };
})();
