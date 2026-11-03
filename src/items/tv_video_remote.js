
/* ===================== GLX-C91: TV plays your own video + TV Remote transport (v0.9.70) ===================== */
// The video file you pick stays on this device only (IndexedDB 'files'/'tv'); nothing is uploaded.
(function tvRemoteV2() {
  const REM = IT.REMOTE, A = window.__arcade || {};
  const R = window.__tvr = {file: null, osdT: 0, hold: null, pend: null, lastKey: null, pos: {}, saveT: 0, gamePaused: false, inView: true, lastSeek: 0};
  const POSK = 'glen_tvpos_v1';
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const mb = n => (n / 1048576).toFixed(0) + ' MB';
  const isFile = () => !!tvFileURL && tvCurSrc === tvFileURL;
  const wid = () => (typeof current !== 'undefined' && current && current.id) || 'w';
  let posLS = {}; try { posLS = JSON.parse(localStorage.getItem(POSK) || '{}') || {}; } catch (_) {}
  function savedPos(k) { const m = entMeta.get(k) || {}; if (Number.isFinite(m.vt)) return m.vt; const v = posLS[wid() + '|' + k]; return Number.isFinite(v) ? v : 0; }
  function storePos(k, t) {
    if (!k || !Number.isFinite(t)) return; const m = entMeta.get(k); if (m) m.vt = +t.toFixed(1);
    posLS[wid() + '|' + k] = +t.toFixed(1); const ks = Object.keys(posLS); if (ks.length > 200) delete posLS[ks[0]];
    try { localStorage.setItem(POSK, JSON.stringify(posLS)); } catch (_) {}
  }
  R.savedPos = savedPos;

  // ---- the stored file: name/size for the menu; your video is now what TVs play by default ----
  (async () => { try { const f = A.fget ? await A.fget('tv') : null; if (f && f.size) { R.file = {name: f.name || 'your video', size: f.size}; tvName = R.file.name; if (!tvFileURL) tvFileURL = URL.createObjectURL(f); } } catch (_) {} })();
  tvSrcFor = (function (base) { return function (k) { const m = entMeta.get(k) || {}; if (tvFileURL && m.video !== 'default') return tvFileURL; return base.apply(this, arguments); }; })(tvSrcFor);
  tvSetSrc = (function (base) { return function (src) { const r = base.apply(this, arguments); if (src === tvFileURL) { tvVideo.loop = true; if (R.file) tvName = R.file.name; } return r; }; })(tvSetSrc);

  const vin = document.createElement('input'); vin.type = 'file'; vin.accept = 'video/mp4,video/webm,video/*,.mp4,.webm,.m4v,.mov'; vin.style.display = 'none'; vin.dataset.testid = 'tv-video-file'; document.body.appendChild(vin);
  R.input = vin;
  vin.addEventListener('change', async () => {
    const f = vin.files && vin.files[0]; vin.value = ''; if (!f) return;
    if (!/^video\//.test(f.type) && !/\.(mp4|webm|m4v|mov)$/i.test(f.name)) { vmsg("That isn't a video file (pick an .mp4 or .webm)"); return; }
    vmsg('Saving "' + f.name + '" on this device…');
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (_) {}
    try { await A.fput('tv', f); } catch (e) { vmsg('Could not store the video on this device (not enough space?)'); return; }
    const was = tvOnKey && isFile();
    if (tvFileURL) { try { if (tvCurSrc === tvFileURL) { tvVideo.pause(); tvCurSrc = ''; } URL.revokeObjectURL(tvFileURL); } catch (_) {} }
    tvFileURL = URL.createObjectURL(f); R.file = {name: f.name, size: f.size}; tvName = f.name;
    for (const [k, m] of entMeta) if (m && m.vt !== undefined) delete m.vt;      // new video: every TV starts from the beginning
    posLS = {}; try { localStorage.removeItem(POSK); } catch (_) {}
    vmsg('Saved "' + f.name + '" on this device. Every TV now plays it.');
    vrow(); if (was) tvSetSrc(tvFileURL);
    if (pick && !pick.classList.contains('hidden') && tvPendingKey) { const k = tvPendingKey; pick.classList.add('hidden'); menuOpen = false; const m = entMeta.get(k) || {}; m.video = 'file'; entMeta.set(k, m); tvOn(k); }
  });

  // ---- TV menu row: Choose video ----
  const st = document.createElement('style');
  st.textContent = `.arcVid{display:flex;align-items:center;gap:10px;background:#1d232c;border:2px solid #303845;border-radius:12px;padding:8px 10px}
.arcVid .ic{font-size:22px}.arcVid .tx{flex:1;min-width:0;font-size:12.5px;line-height:1.3}.arcVid .tx b{font-size:14px}
#tvOsd{position:fixed;left:50%;bottom:calc(118px + var(--sab,0px));transform:translateX(-50%);z-index:60;background:rgba(10,12,16,.82);color:#fff;border-radius:12px;padding:7px 14px;display:flex;align-items:center;gap:10px;font:600 14px system-ui,sans-serif;pointer-events:none;transition:opacity .25s;min-width:260px}
#tvOsd.off{opacity:0}#tvOsd .i{font-size:20px;width:24px;text-align:center}#tvOsd .bar{flex:1;height:5px;background:#ffffff33;border-radius:3px;overflow:hidden;min-width:90px}#tvOsd .bar i{display:block;height:100%;background:#e8473b;width:0}
#tvOsd .t{font-variant-numeric:tabular-nums;white-space:nowrap}
#tvRem{position:fixed;left:50%;top:calc(10px + var(--sat,0px));transform:translateX(-50%);z-index:59;display:flex;gap:8px}
#tvRem.hidden{display:none}#tvRem button{width:54px;height:44px;border-radius:12px;border:2px solid #ffffff55;background:rgba(20,22,28,.7);color:#fff;font-size:19px;touch-action:none;user-select:none;-webkit-user-select:none}
#tvRem button:active{background:rgba(232,71,59,.75)}
body.inmenu #tvRem,body.inmenu #tvOsd{visibility:hidden}`;
  document.head.appendChild(st);
  // the TV video picker lives in the Remote flow (sneak + use the remote), not in the Gamepad / DS path
  const pick = document.getElementById('tvPick');
  if (pick) {
    pick.querySelector('h2').textContent = 'TV video';
    pick.querySelector('.sub').innerHTML = '<span id="tvPickSt"></span><br><span class="padok" title="Controller support">\u2705</span>';
    const ch = pick.querySelector('#tvChoose'), df = pick.querySelector('#tvDefault');
    const nc = ch.cloneNode(true); nc.textContent = '🎬 Choose video'; nc.dataset.testid = 'tv-choose-video'; ch.replaceWith(nc); nc.addEventListener('click', () => vin.click());
    const w = document.createElement('button'); w.className = 'btn'; w.id = 'tvWatch'; w.dataset.testid = 'tv-watch'; w.textContent = '▶ Play my video';
    nc.parentNode.insertBefore(w, nc); w.addEventListener('click', () => { const k = tvPendingKey; pick.classList.add('hidden'); menuOpen = false; if (k) { const m = entMeta.get(k) || {}; m.video = 'file'; entMeta.set(k, m); if (tvFileURL) tvOn(k); else toast('Choose a video first'); } });
    new MutationObserver(() => { if (!pick.classList.contains('hidden')) vrow(); }).observe(pick, {attributes: true, attributeFilter: ['class']});
  }
  // controller on the picker: A = play my video, X = choose file, Y = playlist, B = cancel
  const baseRead0 = readPad;
  readPad = function () {
    if (pick && !pick.classList.contains('hidden') && started && !paused) {
      const gp = pickPad();
      if (gp) { const E = []; for (let i = 0; i < 4; i++) { const b = gp.buttons[i], now = !!(b && (b.pressed || b.value > 0.4)); E[i] = now && !gpPrev[i]; gpPrev[i] = now; }
        if (E[0]) pick.querySelector('#tvWatch').click(); else if (E[2]) vin.click(); else if (E[3]) tvChoose(tvPendingKey, 'default'); else if (E[1]) { pick.classList.add('hidden'); menuOpen = false; }
        return {lx: 0, ly: 0, rx: 0, ry: 0}; }
    }
    return baseRead0.apply(this, arguments);
  };
  function vmsg(t) { const m = document.getElementById('tvPickSt'); if (m && pick && !pick.classList.contains('hidden')) m.textContent = t; toast(t); }
  function vrow() {
    const s = document.getElementById('tvPickSt'), w = document.getElementById('tvWatch'); if (!s) return;
    if (R.file) { const k = tvPendingKey, p = k ? savedPos(k) : 0; s.textContent = 'Your video: ' + R.file.name + ' · ' + mb(R.file.size) + ' · stored on this device' + (p > 5 ? ' · this TV is at ' + fmt(p) : ''); w.classList.remove('hidden'); }
    else { s.textContent = 'Pick a video from this device (mp4 / webm). It stays on this device only and every TV plays it.'; w.classList.add('hidden'); }
  }
  R.vrow = vrow;

  // ---- OSD + touch/mouse remote bar ----
  const osd = document.createElement('div'); osd.id = 'tvOsd'; osd.className = 'off'; osd.dataset.testid = 'tv-osd';
  osd.innerHTML = '<span class="i">▶</span><span class="t">0:00 / 0:00</span><span class="bar"><i></i></span>'; document.body.appendChild(osd);
  const rem = document.createElement('div'); rem.id = 'tvRem'; rem.className = 'hidden'; rem.dataset.testid = 'tv-remote-bar';
  rem.innerHTML = '<button data-a="-1" data-testid="tv-rew" title="Rewind 10 s (hold = faster)">⏪</button><button data-a="0" data-testid="tv-playpause" title="Play / pause">⏯</button><button data-a="1" data-testid="tv-ff" title="Forward 10 s (hold = faster)">⏩</button>';
  document.body.appendChild(rem);
  rem.querySelectorAll('button').forEach(b => {
    const a = +b.dataset.a;
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const k = remoteTV(); if (!k) return; if (a === 0) toggle(k); else holdStart(a); });
    const up = e => { e.stopPropagation(); if (a) holdStop(a); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    b.addEventListener('click', e => e.stopPropagation()); b.addEventListener('mousedown', e => e.stopPropagation()); b.addEventListener('touchstart', e => e.stopPropagation(), {passive: true});
  });
  function showOsd() { R.osdT = performance.now() + 2000; osd.classList.remove('off'); paintOsd(); }
  function paintOsd() {
    const d = tvVideo.duration, t = tvVideo.currentTime;
    osd.querySelector('.i').textContent = tvVideo.paused ? '❚❚' : '▶';
    osd.querySelector('.t').textContent = fmt(t) + ' / ' + (Number.isFinite(d) ? fmt(d) : '--:--');
    osd.querySelector('.bar i').style.width = (Number.isFinite(d) && d > 0 ? Math.min(100, t / d * 100) : 0) + '%';
  }
  R.showOsd = showOsd;

  // ---- which TV the remote talks to ----
  function remoteTV() {
    if (!started || dead || paused || menuOpen || window.__arcadeOpen || selId !== REM || cnt(REM) <= 0) return null;
    if (tvOnKey && entObjs.has(tvOnKey)) { const [x, y, z] = tvOnKey.split(',').map(Number); if (Math.hypot(x + .5 - P.x, y + .5 - P.y, z + .5 - P.z) <= 8.5) return tvOnKey; }
    const o = tvNearest(8.5); return o ? keyOf(o.x, o.y, o.z) : null;
  }
  R.remoteTV = remoteTV;
  function tvOn(k) {
    if (tvOnKey && tvOnKey !== k && isFile()) storePos(tvOnKey, tvVideo.currentTime);
    tvOnKey = k; tvSetSrc(tvSrcFor(k)); tvVideo.muted = false; tvPlay(); showOsd();
    toast(isFile() ? 'TV on: ' + (R.file ? R.file.name : 'your video') : 'TV on (sneak + use the remote to choose your own video)');
  }
  R.tvOn = tvOn;
  function toggle(k) {
    if (tvOnKey !== k) { tvOn(k); return; }
    if (tvVideo.muted && !tvVideo.paused) { tvVideo.muted = false; showOsd(); return; }
    if (tvVideo.paused) { tvStart(); } else { tvVideo.pause(); if (isFile()) storePos(k, tvVideo.currentTime); }
    sfx('pop', .25); showOsd();
  }
  R.toggle = toggle;
  function seek(s) {
    if (!tvOnKey) return; const d = tvVideo.duration; let t = (tvVideo.currentTime || 0) + s;
    t = Math.max(0, Number.isFinite(d) ? Math.min(d - 0.5, t) : t);
    try { tvVideo.currentTime = t; } catch (_) {}
    R.lastSeek = t; if (isFile()) storePos(tvOnKey, t); tvNewFrame = true; showOsd();
  }
  R.seek = seek;
  function holdStart(dir) { const k = remoteTV(); if (!k) return; if (tvOnKey !== k) { tvOn(k); return; } R.hold = {dir, t0: performance.now(), next: performance.now() + 450}; seek(10 * dir); }
  function holdStop(dir) { if (R.hold && (!dir || R.hold.dir === dir)) R.hold = null; }
  R.holdStart = holdStart; R.holdStop = holdStop;
  function holdTick(now) {
    const h = R.hold; if (!h) return;
    if (!remoteTV()) { R.hold = null; return; }
    if (now >= h.next) { const held = now - h.t0; seek(h.dir * (held < 2000 ? 10 : held < 4000 ? 30 : 60)); h.next = now + 180; }
  }

  // ---- LT / use: play-pause (sneak + use = TV menu) ----
  const baseUse = useItem;
  useItem = function () {
    if (!(menuOpen || paused || dead || !started) && selId === REM && cnt(REM) > 0) {
      const r = raycast(12), tb = r ? getB(...r.hit) : 0;
      let k = tb === T.TV ? keyOf(r.hit[0], r.hit[1], r.hit[2]) : remoteTV();
      swing();
      if (!k) { toast('Get within 8 blocks of a TV to use the remote'); return; }
      if (sneakHeld) { tvOpenPicker(k); return; }
      toggle(k); return;
    }
    return baseUse.apply(this, arguments);
  };

  // ---- controller: LB/RB and D-pad left/right seek while the TV is on (hold B to use them normally) ----
  const SEEKB = {4: -1, 14: -1, 5: 1, 15: 1};
  const baseRead = readPad;
  readPad = function () {
    try {
      const k = remoteTV(), gp = k && tvOnKey === k ? pickPad() : null;
      if (gp) {
        const pr = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.4));
        if (!pr(1)) for (const i in SEEKB) { const now = pr(i); if (now && !gpPrev[i]) holdStart(SEEKB[i]); else if (!now && gpPrev[i] && R.hold && R.hold.btn === +i) holdStop(); if (now && R.hold && !R.hold.btn) R.hold.btn = +i; gpPrev[i] = now; }
      } else if (R.hold && R.hold.btn !== undefined) holdStop();
    } catch (_) {}
    return baseRead.apply(this, arguments);
  };
  // keyboard: , and . (or [ and ]) seek, K play/pause
  const KEYS = {Comma: -1, BracketLeft: -1, Period: 1, BracketRight: 1};
  addEventListener('keydown', e => {
    if (!(e.code in KEYS) && e.code !== 'KeyK') return; const k = remoteTV(); if (!k) return;
    if (e.code === 'KeyK') { if (!e.repeat) toggle(k); } else if (!e.repeat) holdStart(KEYS[e.code]);
    e.preventDefault();
  }, true);
  addEventListener('keyup', e => { if (e.code in KEYS) holdStop(KEYS[e.code]); }, true);

  // ---- per-frame: position memory, view-gated texture, distance fade, game pause, remote bar ----
  const fr = new THREE.Frustum(), pm = new THREE.Matrix4(), sph = new THREE.Sphere(new THREE.Vector3(), 0.8);
  const baseTick = tvTick;
  tvTick = function (dt) {
    if (tvOnKey && entObjs.has(tvOnKey)) {
      const o = entObjs.get(tvOnKey);
      pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); fr.setFromProjectionMatrix(pm);
      sph.center.set(o.x + .5, o.y + .45, o.z + .5); R.inView = fr.intersectsSphere(sph);
      if (!R.inView) { tvNewFrame = false; tvLastVT = tvVideo.currentTime; R.skipped = (R.skipped || 0) + 1; }
    }
    return baseTick.apply(this, arguments);
  };
  const baseUpd = updateTV;
  updateTV = function (dt) {
    const k = tvOnKey;
    if (k !== R.lastKey) { if (R.lastKey && R.wasFile) storePos(R.lastKey, R.lastT); R.pend = k ? savedPos(k) : null; R.lastKey = k; }
    const r = baseUpd.apply(this, arguments);
    if (k && isFile()) {
      if (R.pend !== null) { if (tvVideo.readyState >= 1) { if (Math.abs(tvVideo.currentTime - R.pend) > 1) { try { tvVideo.currentTime = R.pend; } catch (_) {} } R.pend = null; } }
      else { R.lastT = tvVideo.currentTime; R.wasFile = true; const now = performance.now(); if (now - R.saveT > 3000 && !tvVideo.paused) { R.saveT = now; storePos(k, R.lastT); } }
    } else { R.wasFile = false; if (!k) R.pend = null; }
    if (k && tvGain && entObjs.has(k)) {
      const [x, y, z] = k.split(',').map(Number), d = Math.hypot(x + .5 - P.x, y + .5 - P.y, z + .5 - P.z);
      const v = clamp(Number(SET.sfx), 0, 1), fade = d <= 14 ? 1 : Math.max(0, 1 - (d - 14) / 14);
      tvGain.gain.value = (Number.isFinite(v) ? v : 0.8) * fade; R.fade = fade; R.dist = d;
    }
    return r;
  };
  const baseFrame = frame;
  frame = function (now) {
    // game paused -> TV paused; resumes with the game
    if ((paused || document.hidden) && tvOnKey && !tvVideo.paused && !window.__arcadeOpen) { tvVideo.pause(); R.gamePaused = true; if (isFile()) storePos(tvOnKey, tvVideo.currentTime); }
    else if (R.gamePaused && !paused && !document.hidden && !window.__arcadeOpen) { R.gamePaused = false; if (tvOnKey) tvStart(); }
    holdTick(now || performance.now());
    if (R.osdT && (now || performance.now()) > R.osdT) { R.osdT = 0; osd.classList.add('off'); } else if (R.osdT) paintOsd();
    const show = !!remoteTV() && (touchShown || !document.pointerLockElement);
    if (show === rem.classList.contains('hidden')) rem.classList.toggle('hidden', !show);
    return baseFrame.apply(this, arguments);
  };
  addEventListener('pagehide', () => { if (tvOnKey && isFile()) storePos(tvOnKey, tvVideo.currentTime); });
})();
