/* ===================== GLX-C105 (v0.9.86): cobalt tools can't be crafted, pause-menu "Reset world" live event ===================== */
(function c105() {
  // ---------- cobalt tools: no recipes (items stay in creative) ----------
  try { const NO = new Set([IT.CPICK, IT.CAXE, IT.CSWORD, IT.CSHOVEL, IT.CHOE]); for (let i = RECIPES.length - 1; i >= 0; i--) if (RECIPES[i] && NO.has(RECIPES[i].out)) RECIPES.splice(i, 1); } catch (e) { console.warn('c105 cobalt', e); }

  // ---------- state ----------
  const R = {phase: null, t: 0, snap: null, oldSeed: 0, list: null, del: 0, total: 0, falling: [], rising: [], hoverY: 0, landY: 0, fromY: 0, liftFrom: 0, done: 0};
  window.__c105 = R;
  const active = () => !!R.phase;

  // ---------- in-game confirm dialog (no browser confirm, never touches fullscreen) ----------
  const ask = document.createElement('div'); ask.id = 'resetAsk'; ask.setAttribute('data-testid', 'reset-confirm');
  ask.style.cssText = 'position:fixed;inset:0;z-index:9000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55)';
  ask.innerHTML = '<div class="panel" style="max-width:420px;text-align:center"><h2 style="margin:0 0 10px">Reset world?</h2><p style="margin:0 0 16px;line-height:1.4">Are you sure you want to reset? This can\'t be undone.</p>' +
    '<div class="btns" style="display:flex;gap:10px;justify-content:center"><button class="btn" id="resetNo" data-testid="reset-no">No</button><button class="btn alt" id="resetYes" data-testid="reset-yes" style="border-color:#c44">Yes</button></div></div>';
  document.body.appendChild(ask);
  const askBtns = () => [document.getElementById('resetNo'), document.getElementById('resetYes')];
  let askOpen = false, aF = 0;
  const askFocus = () => askBtns().forEach((b, i) => b.classList.toggle('focus', i === aF && padConnected));
  function openAsk() { if (active()) return; const nmD = DIM.cur === 'hell' ? 'Hell' : null;   /* v1.0.32: one button - in Hell it resets Hell */
    try { ask.querySelector('h2').textContent = nmD ? 'Reset ' + nmD.replace('the ', 'the ') + '?' : 'Reset world?'; ask.querySelector('p').textContent = nmD ? 'Are you sure you want to reset ' + nmD + '? Only ' + nmD + ' is made new; the overworld is not touched. This can\'t be undone.' : 'Are you sure you want to reset? This can\'t be undone.'; } catch (_) {} askOpen = true; aF = 0; ask.style.display = 'flex'; askFocus(); try { askBtns()[0].focus(); } catch (_) {} }
  function closeAsk() { askOpen = false; ask.style.display = 'none'; try { refocusPause(); } catch (_) {} }
  window.__c105.ask = () => askOpen;
  document.getElementById('resetNo').addEventListener('click', e => { e.preventDefault(); closeAsk(); });
  document.getElementById('resetYes').addEventListener('click', e => { e.preventDefault(); closeAsk(); setPause(false); if (DIM.cur) { window.__dimNoAsk = 1; Promise.resolve(window.__resetDim && __resetDim()).finally(() => { window.__dimNoAsk = 0; }); } else window.__c105.start(); });

  // ---------- pause-menu button ----------
  try {
    const sq = document.getElementById('saveQuit');
    const b = document.createElement('button'); b.className = 'btn alt'; b.id = 'resetWorldBtn'; b.setAttribute('data-testid', 'pause-reset-world-button'); b.textContent = 'Reset world';
    b.addEventListener('click', e => { e.preventDefault(); openAsk(); });
    sq.parentNode.insertBefore(b, sq.nextSibling);
  } catch (e) { console.warn('c105 button', e); }

  // controller: D-pad moves between No / Yes, A presses, B (and Start / Esc) = No
  const pp = padPause; padPause = function (dir, adj, act) {
    if (!askOpen) return pp.apply(this, arguments);
    const d = dir || adj; if (d) { aF = (aF + 1) % 2; askFocus(); }
    if (act) askBtns()[aF].click();
  };
  const sp = setPause; setPause = function (on) {
    if (askOpen && !on) { closeAsk(); return; }
    if (active() && on) return;
    return sp.apply(this, arguments);
  };
  addEventListener('keydown', e => { if (!askOpen) return; if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'Tab') { aF = (aF + 1) % 2; askBtns()[aF].focus(); askFocus(); e.preventDefault(); e.stopImmediatePropagation(); } }, true);

  // ---------- while the event runs: float, no damage, no building/breaking, no saves mid-way ----------
  const hu = hurt; hurt = function () { if (active()) return; return hu.apply(this, arguments); };
  const up = updatePlayer; updatePlayer = function (dt) { if (!active()) return up.apply(this, arguments); hold(); return 0; };
  const ui = updateInteraction; updateInteraction = function () { if (active()) return; return ui.apply(this, arguments); };
  const us = updateSurvival; updateSurvival = function () { if (active()) { hp = 20; food = 20; return; } return us.apply(this, arguments); };
  const um = updateMobs; updateMobs = function () { if (R.phase === 'del' || R.phase === 'lift' || R.phase === 'gen') return; return um.apply(this, arguments); };
  const sw = saveWorld; saveWorld = function () { if (R.phase && R.phase !== 'land') return false; return sw.apply(this, arguments); };
  const rb = rebuild; rebuild = function (budget) {
    if (R.phase === 'del' || R.phase === 'lift') return;
    if (R.phase === 'gen') return rb.call(this, Math.min(budget || 4, PERF ? 3 : 4));   // a few chunks per frame so the land visibly grows outward
    return rb.apply(this, arguments);
  };
  const bc = buildChunk; buildChunk = function (cx, cz) {
    const r = bc.apply(this, arguments);
    if (R.phase === 'gen' || R.phase === 'land') { const g = chunkObjs.get(cx * 64 + cz); if (g && !g.userData.c105) { g.userData.c105 = 1; g.position.y = -14; R.rising.push({g, t: 0}); } }
    return r;
  };
  // the loading screen stays hidden during the event; the land builds in front of you instead
  const ss = showScreen; showScreen = function (name) {
    if (R.phase === 'gen') {
      if (name === 'loading') { screen = 'loading'; return; }
      if (name === 'none') { const r = ss.apply(this, arguments); setTimeout(genDone, 0); return r; }
    }
    return ss.apply(this, arguments);
  };
  const spw = spawnPlayer; spawnPlayer = function () {
    const r = spw.apply(this, arguments);
    if (R.phase === 'gen') { /* v1.0.85: you come back down where you were, on top of the new ground */ try { if (R.px > 2 && R.px < W - 2 && R.pz > 2 && R.pz < D - 2) { P.x = R.px; P.z = R.pz; P.yaw = R.yaw; const g = groundTop(Math.floor(P.x), Math.floor(P.z)) + 1; if (g > 2) P.y = g; } } catch (_) {} R.landY = P.y; R.hoverY = Math.min(H - 3, P.y + 18); P.y = R.hoverY; P.pitch = -0.55; P.vy = 0; }
    return r;
  };
  function hold() {
    P.vy = 0; P.fallTop = null; P.kbx = P.kbz = 0; P.onGround = false;
    if (R.phase === 'lift') P.y = R.liftFrom + (R.hoverY - R.liftFrom) * ease(Math.min(1, R.t / 1.4));
    else if (R.phase === 'land') P.y = R.fromY + (R.landY - R.fromY) * ease(Math.min(1, R.t / 3));
    else P.y = R.hoverY;
  }
  const ease = k => k * k * (3 - 2 * k);

  // ---------- snapshot of what the player carries ----------
  function snap() {
    const s = {inv: JSON.parse(JSON.stringify(inv)), hotbar: MODE.hotbar ? MODE.hotbar.slice() : null, armour: armour.slice(), off: null, xp: 0, lvl: 0, gun: null, sel: typeof selected !== 'undefined' ? selected : null};
    try { s.off = offhand ? {id: offhand.id, n: offhand.n} : null; } catch (_) {}
    try { const d = serialize(); s.xp = d.xp || 0; s.lvl = d.lvl || 0; } catch (_) {}
    try { s.gun = Object.assign({}, window.gunMag); } catch (_) {}
    return s;
  }
  function restore(s) {
    for (const k of Object.keys(inv)) delete inv[k];
    Object.assign(inv, JSON.parse(JSON.stringify(s.inv)));
    if (s.hotbar) MODE.hotbar = s.hotbar.slice();
    for (let i = 0; i < 4; i++) armour[i] = s.armour[i] || 0;
    try { offhand = s.off ? {id: s.off.id, n: s.off.n} : null; } catch (_) {}
    try { if (window.gunMag && s.gun) Object.assign(window.gunMag, s.gun); } catch (_) {}
    try { if (window.__c105xp) window.__c105xp(s.xp, s.lvl); } catch (_) {}
    hp = 20; food = 20; sat = 5;
    try { refreshArmour(); } catch (_) {} try { renderHotbar(); } catch (_) {}
  }

  // ---------- the event ----------
  function startReset() {
    if (active() || !started || dead || !current) return;
    R.snap = snap(); /* v1.0.74: Reset world keeps your inventory, armour and XP again */ R.oldSeed = gSeed; R.t = 0; R.phase = 'lift'; R.falling = []; R.rising = []; R.done = 0;
    R.px = P.x; R.pz = P.z; R.yaw = P.yaw; R.fast = !!window.__c263; R.liftFrom = P.y; R.hoverY = Math.min(H - 3, P.y + 14); hp = 20; food = 20;
    try { mobs.slice().forEach(removeMob); } catch (_) {}
    for (const d of drops) { try { scene.remove(d.m); } catch (_) {} } drops.length = 0;
    toast('Hold on... the glen is being unmade');
    last105 = performance.now(); requestAnimationFrame(loop);
  }
  function beginDelete() {
    R.phase = 'del'; R.t = 0;
    const pcx = P.x / CH - 0.5, pcz = P.z / CH - 0.5, far = [], near = [];
    for (const [id, g] of chunkObjs) { const d = Math.hypot(Math.floor(id / 64) - pcx, id % 64 - pcz); (d > 11 ? far : near).push([id, g, d]); }
    near.sort((a, b) => b[2] - a[2]);   // outside in, so you watch it close in on you
    R.far = far; R.list = near; R.del = 0; R.total = near.length; R.nChunks = chunkObjs.size;
    if (R.fast) { R.far = far.concat(near); R.list = []; R.total = 0; }   /* v1.0.85: behind the loading screen, no show */
  }
  function dropChunk(id, g, anim) {
    chunkObjs.delete(id); try { chunkLists.delete(id); } catch (_) {}
    if (!anim) { disposeG(g); return; }
    R.falling.push({g, t: 0});
  }
  function disposeG(g) { blockGroup.remove(g); g.children.forEach(c => { if (c.isInstancedMesh) c.dispose(); else if (c.geometry) c.geometry.dispose(); }); }
  function beginGen() {
    R.phase = 'gen'; R.t = 0;
    // whatever is left of the old world (entities, chests, crops, boats, lights...)
    try { __clearWorldState(); } catch (e) { console.warn('c105 clear', e); }
    try { crops.clear(); chests.clear(); doorState.clear(); furnaces.clear(); entMeta.clear(); } catch (_) {}
    try { placedSet = new Set(); } catch (_) {}
    spawnPt = null; try { delete current.resetBackup; } catch (_) {}
    toast('Shaping a brand-new glen...');
    // two frames so the message shows before the one heavy step (laying out the new land)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      gSeed = 0; window.__keepXP = 1;
      // v1.0.26: a reset world IS a brand-new world - new birth date (old dates gate the current castles/structures off), no stale unicorn, map or structure records
      try { current.created = Date.now(); current.newCastles = true; localStorage.removeItem('glen_uni_' + current.id); localStorage.removeItem('glen_death_' + current.id); if (window.__c151) __c151.st = {}; if (window.__c113) __c113.bridges = []; } catch (_) {}
      try { enterWorld(null); } catch (e) { console.error('c105 enterWorld', e); }
      window.__keepXP = 0;
      if (gSeed === R.oldSeed) console.warn('c105: same seed');
    }));
  }
  function genDone() {
    if (R.phase !== 'gen') return;
    restore(R.snap);
    R.phase = 'land'; R.t = 0; R.fromY = P.y;
    try { const g = groundTop(Math.floor(P.x), Math.floor(P.z)) + 1; if (g > 2) R.landY = R.fast ? g : Math.max(R.landY, g); } catch (_) {}
  }
  function finish() {
    restore(R.snap);
    P.y = R.landY; P.vy = 0; P.fallTop = null;
    R.phase = null; R.done = 1;
    for (const r of R.rising) r.g.position.y = 0; R.rising = [];
    try { saveWorld(true); } catch (e) { console.warn('c105 save', e); }
    // no backups or side-dimensions of the old world are kept
    const pre = ['dim_' + current.id + '_', 'backup_' + current.id + '_'];
    try { idbDo('worlds', 'readwrite', o => { const q = o.getAllKeys(); q.onsuccess = () => { for (const k of q.result || []) if (typeof k === 'string' && pre.some(p => k.startsWith(p))) o.delete(k); }; return q; }).catch(() => {}); } catch (_) {}
    toast('New world ready!');
  }
  let last105 = 0;
  function loop(now) {
    if (!R.phase && !R.falling.length && !R.rising.length) return;
    const dt = Math.min(0.1, (now - last105) / 1000); last105 = now; R.t += dt;
    try {
      if (R.phase) hold();
      if (R.phase === 'lift' && (R.fast || R.t >= 1.4)) beginDelete();
      if (R.phase === 'del') {
        for (let n = 0; n < 160 && R.far.length; n++) { const [id, g] = R.far.pop(); dropChunk(id, g, false); }
        const DUR = 6, want = Math.min(R.total, Math.ceil(R.total * Math.min(1, R.t / DUR)));
        while (R.del < want) { const [id, g, d] = R.list[R.del++]; if (chunkObjs.get(id) === g) dropChunk(id, g, true); }
        if (R.del >= R.total && !R.far.length && !R.falling.length && R.t > 0.5) beginGen();
      }
      for (let i = R.falling.length - 1; i >= 0; i--) { const f = R.falling[i]; f.t += dt; f.g.position.y = -f.t * f.t * 40; if (f.t > 0.8) { disposeG(f.g); R.falling.splice(i, 1); } }
      for (let i = R.rising.length - 1; i >= 0; i--) { const r = R.rising[i]; r.t += dt; const k = Math.min(1, r.t / 0.7); r.g.position.y = -14 * (1 - k) * (1 - k); if (k >= 1) R.rising.splice(i, 1); }
      if (R.phase === 'land' && R.t >= (R.fast ? 0.2 : 3)) finish();
      if (R.phase === 'gen' && R.t > 90) { console.error('c105: new world took too long'); genDone(); }
    } catch (e) { console.error('c105 loop', e); }
    requestAnimationFrame(loop);
  }
  window.__c105.start = startReset;
})();
