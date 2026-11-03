
/* ===================== GLX-C90 (v0.9.69): Gamepad item + TV game library =====================
   Gamepad (item 330): use it within ~4 blocks of a TV (or use a TV while holding it) to open the
   Glencraft TV game library. The world is frozen (no frames, no sim) while the TV is open.
   Slot 1: "DS Game (load your own)" - the player's own .nds/.zip, kept only in this browser's IndexedDB,
           run by EmulatorJS (GPL-3, melonDS core) loaded at runtime from cdn.emulatorjs.org inside an iframe.
           Nothing of the emulator loads until Play. In-game saves (SRAM) persist via EmulatorJS's IDBFS and a
           backup copy in our IndexedDB; leaving the game stores a resume state per game.
   v0.9.70: Haggis Hop removed; the Gamepad launches the stored DS game straight away (resuming the last state). */
(function c90() {
  const GP = 330; IT.GAMEPAD = GP; NAMES[GP] = 'Gamepad';
  if (!ORDER.includes(GP)) ORDER.push(GP);
  if (!CREATIVE_ALL.includes(GP)) CREATIVE_ALL.push(GP);
  RECIPES.push(rc('Gamepad', '2 Iron ingots + 1 Redstone dust + 1 Lever + 1 Coal', GP, 1, [[IT.IRONINGOT, 2], [IT.REDSTONE, 1], [IT.LEVER, 1], [IT.COAL, 1]], 1));
  // original pixel icon: a little dark controller with coloured face buttons (no logos)
  const MAP = ['..OOOOOOOOOOOO..', '.OHHHHHHHHHHHHO.', 'OHBBBBBBBBBBYBBO', 'OBSSBBBWBBBXBRBO', 'OBSSBBBBBBBBGBBO', 'OBBBBDBBBBSSBBBO',
    'OBBBDDDBBBSSBBBO', 'OBBBBDBBBBBBBBBO', 'OBBBOOOOOOOOBBBO', '.OBBO......OBBO.', '..OO........OO..'];
  const PAL = {O: '#0d0e10', H: '#5a5f6a', B: '#30343b', S: '#121316', D: '#0b0b0c', W: '#cfd6de', X: '#2f6fdf', R: '#e0322a', Y: '#f2c230', G: '#3cb043'};
  ICONS[GP] = drawIcon(g => { g.imageSmoothingEnabled = false; const s = 3.2, W = 16, H = MAP.length;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = MAP[y][x]; if (c === '.') continue; g.fillStyle = PAL[c]; g.fillRect((x - W / 2) * s, (y - H / 2) * s, s + 0.25, s + 0.25); } });
  try { const base = makeItemMesh; makeItemMesh = function (id) {
    if (id !== GP) return base.apply(this, arguments);
    const g = new THREE.Group(), body = new THREE.MeshPhongMaterial({color: 0x30343b, shininess: 50}), dark = new THREE.MeshPhongMaterial({color: 0x121316});
    const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
    box(0.17, 0.075, 0.035, body, 0, 0.1, 0);
    box(0.05, 0.07, 0.034, body, -0.058, 0.055, 0).rotation.z = -0.35; box(0.05, 0.07, 0.034, body, 0.058, 0.055, 0).rotation.z = 0.35;
    box(0.02, 0.02, 0.012, dark, -0.05, 0.115, 0.02); box(0.02, 0.02, 0.012, dark, 0.022, 0.085, 0.02);
    box(0.024, 0.007, 0.01, dark, -0.022, 0.085, 0.02); box(0.007, 0.024, 0.01, dark, -0.022, 0.085, 0.02);
    [[0x3cb043, 0.05, 0.1], [0xe0322a, 0.062, 0.112], [0x2f6fdf, 0.038, 0.112], [0xf2c230, 0.05, 0.124]].forEach(([c, x, y]) => box(0.009, 0.009, 0.01, new THREE.MeshPhongMaterial({color: c, emissive: c, emissiveIntensity: 0.15}), x, y, 0.02));
    g.userData.tool = true; g.userData.kind = 'gamepad'; return g;
  }; } catch (_) {}

  const A = window.__arcade = {open: false, mode: null, tvKey: null, EJS_PATH: 'https://cdn.emulatorjs.org/4.2.3/data/', ds: null, dsWin: null, exiting: false};
  A.vol = () => { const v = Number(SET.sfx); return Number.isFinite(v) ? clamp(v, 0, 1) : 0.6; };
  // ---------- storage (same 'glencraft' IndexedDB 'files' store the TV video uses) ----------
  const tx = (mode, fn) => idb().then(db => new Promise((res, rej) => { const t = db.transaction('files', mode), q = fn(t.objectStore('files')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }));
  const fget = k => tx('readonly', o => o.get(k)).catch(() => undefined);
  const fput = (k, v) => tx('readwrite', o => o.put(v, k));
  const fdel = k => tx('readwrite', o => o.delete(k)).catch(() => {});
  A.fget = fget; A.fput = fput;
  const romKey = (name, size) => (name.replace(/\.(nds|zip)$/i, '') + '_' + size).replace(/[^\w\-]+/g, '_').slice(0, 90);
  const mb = n => (n / 1048576).toFixed(1) + ' MB';
  const persist = () => { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(v => { A.persisted = v; }).catch(() => {}); } catch (_) {} };
  A.persist = persist;

  // ---------- UI ----------
  const css = document.createElement('style');
  css.textContent = `
#arcUI{position:fixed;inset:0;z-index:100000;background:radial-gradient(ellipse at center,#1d2733 0%,#07090c 78%);display:flex;align-items:center;justify-content:center;color:#eef2f8;touch-action:none;user-select:none;-webkit-user-select:none;font-family:inherit}
#arcUI.hidden,#arcStage.hidden,#arcUI .hidden{display:none!important}
.arcTV{width:min(94vw,780px);max-height:94vh;box-sizing:border-box;background:#14181e;border:10px solid #2a2622;border-radius:18px;box-shadow:0 0 0 3px #000,inset 0 0 50px rgba(90,160,255,.18);padding:14px 16px;display:flex;flex-direction:column;gap:10px;overflow:auto}
.arcHead{display:flex;align-items:center;gap:10px;font-weight:700}
.arcLogo{background:#3cb043;color:#06200a;padding:3px 8px;border-radius:6px;letter-spacing:.08em;font-size:12px}
.arcTitle{flex:1;font-size:18px}
.arcSlots{display:grid;grid-template-columns:1fr;gap:12px}
.arcSlot canvas{max-width:200px}
.arcBtn.big{font-size:18px;padding:16px 22px;min-height:60px;width:100%}
.arcSlot{background:#1d232c;border:2px solid #303845;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px;min-width:0}
#arcUI canvas{position:static;inset:auto}
.arcSlot canvas{width:100%;height:auto;aspect-ratio:3/2;image-rendering:pixelated;border-radius:8px;background:#000;flex:0 0 auto}
.arcInfo{display:flex;flex-direction:column;gap:6px;min-width:0;flex:1}
.arcInfo b{font-size:16px}.arcInfo b small{font-weight:400;opacity:.75;font-size:12px}
.arcSt{font-size:12.5px;opacity:.88;line-height:1.35;overflow-wrap:anywhere}
.arcRow{display:flex;flex-wrap:wrap;gap:6px}
.arcBtn{font:inherit;font-size:13px;font-weight:700;color:#eef2f8;background:#2d3644;border:2px solid #45536a;border-radius:9px;padding:8px 11px;cursor:pointer;min-height:38px}
.arcBtn.main{background:#2f7d32;border-color:#5fbf63}
.arcBtn.focus{outline:3px solid #ffd54a;outline-offset:1px}
.arcFoot{font-size:11.5px;opacity:.7;text-align:center}
.arcMsg{font-size:12.5px;color:#9fe870;text-align:center;min-height:1em}
#arcStage{position:absolute;inset:0;background:#000;display:flex;align-items:center;justify-content:center}
#arcStage iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}
#arcExit{position:absolute;top:8px;right:8px;z-index:5;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;border:2px solid rgba(255,255,255,.4);font-size:18px;cursor:pointer;opacity:.75}
#arcLoad{position:absolute;z-index:4;color:#cde;font-size:15px;text-align:center;padding:20px;pointer-events:none;max-width:80%}
#arcHint{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);z-index:5;background:rgba(0,0,0,.7);padding:6px 12px;border-radius:8px;font-size:13px;pointer-events:none;opacity:0;transition:opacity .25s;white-space:nowrap}
@media (max-height:460px){.arcTV{padding:8px 10px;gap:6px;border-width:6px;max-height:98vh}.arcSlot{padding:7px;gap:8px;flex-direction:row}.arcSlot canvas{width:32%}.arcTitle{font-size:15px}.arcBtn{padding:5px 9px;min-height:34px;font-size:12px}.arcInfo b{font-size:14px}.arcSt{font-size:11.5px}}`;
  document.head.appendChild(css);
  const ui = document.createElement('div'); ui.id = 'arcUI'; ui.className = 'hidden'; ui.dataset.testid = 'arcade';
  ui.innerHTML = `<div class="arcTV" id="arcMenu" data-testid="arcade-menu">
  <div class="arcHead"><span class="arcLogo">GLENCRAFT TV</span><span class="arcTitle">DS on the TV</span><button class="arcBtn" id="arcBack" data-testid="arcade-close">✕ Back to Glencraft</button></div>
  <div class="arcSlots">
    <div class="arcSlot" data-testid="arcade-slot-ds"><canvas id="arcThumbDs" width="96" height="64"></canvas><div class="arcInfo"><b>DS Game <small>(your own game file, kept on this device)</small></b><div class="arcSt" id="arcDsSt">…</div><div class="arcRow" id="arcDsBtns"></div></div></div>
  </div>
  <div class="arcMsg" id="arcMsg"></div>
  <div class="arcFoot">Tap ✕ to save and go back to Glencraft <span class="padok">✅</span></div>
</div>
<div id="arcStage" class="hidden"><div id="arcLoad"></div><button id="arcExit" data-testid="arcade-exit" title="Save and go back to Glencraft">✕</button><div id="arcHint"></div></div>`;
  document.body.appendChild(ui);
  const fileIn = document.createElement('input'); fileIn.type = 'file'; fileIn.style.display = 'none'; fileIn.dataset.testid = 'arcade-ds-file'; ui.appendChild(fileIn);
  const $a = id => document.getElementById(id), stage = $a('arcStage'), menu = $a('arcMenu');
  const msg = t => { $a('arcMsg').textContent = t || ''; };
  const hint = (t, on) => { const h = $a('arcHint'); if (t) h.textContent = t; h.style.opacity = on ? 1 : 0; };

  // thumbnails (original pixel art)
  (function thumbs() {
    let g = $a('arcThumbDs').getContext('2d'); g.fillStyle = '#20262f'; g.fillRect(0, 0, 96, 64);
    g.fillStyle = '#b9c0ca'; g.fillRect(24, 4, 48, 56); g.fillStyle = '#8d95a1'; g.fillRect(24, 31, 48, 2);
    g.fillStyle = '#0d1016'; g.fillRect(29, 8, 38, 20); g.fillRect(29, 36, 38, 20);
    g.fillStyle = '#4a90e2'; g.fillRect(31, 10, 34, 16); g.fillStyle = '#6cc04a'; g.fillRect(31, 21, 34, 5); g.fillStyle = '#ffd54a'; g.fillRect(40, 16, 4, 5);
    g.fillStyle = '#e8eef5'; g.fillRect(31, 38, 34, 16); g.fillStyle = '#3cb043'; g.fillRect(35, 41, 26, 4); g.fillStyle = '#9aa3ae'; g.fillRect(35, 47, 26, 4);
    g.fillStyle = '#2b2f36'; g.fillRect(18, 42, 3, 9); g.fillRect(15, 45, 9, 3); [[77, 42, '#3cb043'], [81, 46, '#e0322a'], [73, 46, '#2f6fdf'], [77, 50, '#f2c230']].forEach(([x, y, c]) => { g.fillStyle = c; g.fillRect(x, y, 3, 3); });
  })();
  // ---------- menu state ----------
  let focus = 0;
  const items = () => [...menu.querySelectorAll('.arcBtn')].filter(b => b.offsetParent !== null);
  const refocus = () => { const it = items(); if (focus >= it.length) focus = it.length - 1; if (focus < 0) focus = 0; it.forEach((b, i) => b.classList.toggle('focus', i === focus && A.padUsed)); };
  async function refresh() {
    const rec = await fget('ds_rom'), st = rec ? await fget('ds_state:' + rec.key) : null, box = $a('arcDsBtns');
    box.innerHTML = '';
    const mk = (id, t, main) => { const b = document.createElement('button'); b.className = 'arcBtn' + (main ? ' main' : ''); b.id = id; b.dataset.testid = 'arcade-' + id.replace(/^arc/, '').toLowerCase(); b.textContent = t; box.appendChild(b); return b; };
    if (!rec) { $a('arcDsSt').textContent = 'Pick your .nds or .zip once. It stays on this device only (never uploaded); after that the Gamepad starts it straight away.';
      const b = mk('arcDsPick', '📂 Pick your DS game file (one time only)', true); b.classList.add('big'); b.onclick = () => fileIn.click(); }
    else { $a('arcDsSt').textContent = rec.name + ' · ' + mb(rec.size) + ' · stored on this device' + (st ? ' · resume point saved' : '');
      mk('arcDsPlay', st ? '▶ Resume' : '▶ Play', true).onclick = () => playDS(false);
      if (st) mk('arcDsFresh', '⟲ Restart game', false).onclick = () => playDS(true);
      mk('arcDsPick', '📂 Change file', false).onclick = () => fileIn.click();
      mk('arcDsForget', '🗑 Remove', false).onclick = async () => { await fdel('ds_rom'); msg('Game file removed from this device (its saves are kept)'); refresh(); }; }
    refocus();
  }
  A.refresh = refresh;
  fileIn.addEventListener('change', async () => {
    const f = fileIn.files && fileIn.files[0]; fileIn.value = ''; if (!f) return;
    if (!/\.(nds|zip)$/i.test(f.name)) { msg('That is not a .nds or .zip file'); return; }
    if (f.size > 700 * 1048576) { msg('That file is too big'); return; }
    try { const rec = {blob: new Blob([f], {type: 'application/octet-stream'}), name: f.name, size: f.size, key: romKey(f.name, f.size), added: Date.now()};
      await fput('ds_rom', rec); persist(); msg('Saved "' + f.name + '" on this device. Starting…'); refresh(); playDS(false); return; }
    catch (e) { msg('Could not store the file on this device (storage full?)'); }
    refresh();
  });
  $a('arcBack').onclick = () => closeArcade();
  $a('arcExit').onclick = () => leaveGame();

  // ---------- open / close, world freeze ----------
  let mute = null;
  function freezeWorld(on) {
    if (on) { mute = {music: typeof music !== 'undefined' && !music.paused, tv: typeof tvVideo !== 'undefined' && !!tvOnKey && !tvVideo.paused, mg: master ? master.gain.value : null};
      try { if (mute.music) music.pause(); } catch (_) {} try { if (mute.tv) tvVideo.pause(); } catch (_) {} try { if (master) master.gain.value = 0; } catch (_) {} }
    else if (mute) { try { if (master) master.gain.value = SET.sfx; } catch (_) {} try { if (mute.music) music.play().catch(() => {}); } catch (_) {} try { if (mute.tv && tvOnKey) tvVideo.play().catch(() => {}); } catch (_) {} mute = null; }
  }
  const fr0 = frame; frame = function (now) { if (window.__arcadeOpen) { last = now; requestAnimationFrame(frame); return; } return fr0.apply(this, arguments); };
  function openArcade(k) {
    if (A.open) return; A.open = true; window.__arcadeOpen = true; A.tvKey = k; menuOpen = true;
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (_) {}
    freezeWorld(true); ui.classList.remove('hidden'); stage.classList.add('hidden'); menu.classList.remove('hidden'); A.mode = null; focus = 0; msg('');
    syncPrev(); refresh(); requestAnimationFrame(poll); try { sfx('pop', .3); } catch (_) {}
  }
  function closeArcade() {
    if (!A.open) return; if (A.mode) { leaveGame(true); }
    ui.classList.add('hidden'); A.open = false; window.__arcadeOpen = false; menuOpen = false; freezeWorld(false);
    try { const gp = pickPad(); if (gp) for (let i = 0; i < 17; i++) { const b = gp.buttons[i]; gpPrev[i] = !!(b && (b.pressed || b.value > 0.4)); } } catch (_) {}
    try { for (const k in keys) keys[k] = false; } catch (_) {}
    last = performance.now();
  }
  A.openArcade = openArcade; A.close = closeArcade;
  async function launchDS(k, wantMenu) {
    persist(); if (A.mode === 'ds') return; A.tvKey = k;
    const rec = await fget('ds_rom');
    if (rec && rec.blob && !wantMenu) playDS(false); else openArcade(k);
  }
  A.launchDS = launchDS;
  function showStage(mode) { A.mode = mode; menu.classList.add('hidden'); stage.classList.remove('hidden'); $a('arcLoad').textContent = ''; hint('', false); }
  function backToMenu() { A.mode = null; stage.classList.add('hidden'); menu.classList.remove('hidden'); syncPrev(); refresh(); }
  function leaveGame(quick) { if (A.mode === 'ds') return exitDS(quick); }

  // gamepad item use: aim at a TV or stand within ~4 blocks of one
  const baseUse = useItem;
  useItem = function () {
    if (!(menuOpen || paused || dead || !started) && selId === GP && cnt(GP) > 0) {
      const r = raycast(8), tb = r ? getB(...r.hit) : 0;
      const o = tb === T.TV ? {x: r.hit[0], y: r.hit[1], z: r.hit[2]} : tvNearest(4.6);
      swing();
      if (!o) { toast('Stand next to a TV to play games on it (within 4 blocks)'); return; }
      launchDS(keyOf(o.x, o.y, o.z), sneakHeld); return;
    }
    return baseUse.apply(this, arguments);
  };

  // ---------- controller polling while the TV is open ----------
  const prev = []; let stickT = 0, lastP = 0;
  function padNow() { try { return pickPad(); } catch (_) { return null; } }
  function syncPrev() { const gp = padNow(); for (let i = 0; i < 17; i++) { const b = gp && gp.buttons[i]; prev[i] = !!(b && (b.pressed || b.value > 0.4)); } }
  function poll(now) {
    if (!A.open) return; requestAnimationFrame(poll);
    const dt = lastP ? Math.min(0.1, (now - lastP) / 1000) : 0; lastP = now;
    const gp = padNow(), P = [], E = [];
    for (let i = 0; i < 17; i++) { const b = gp && gp.buttons[i], p = !!(b && (b.pressed || b.value > 0.4)); P[i] = p; E[i] = p && !prev[i]; prev[i] = p; }
    if (gp && P.some(Boolean)) { if (!A.padUsed) { A.padUsed = true; refocus(); } }
    const ax = gp ? gp.axes[0] || 0 : 0, ay = gp ? gp.axes[1] || 0 : 0;
    // menu navigation
    let dx = E[14] ? -1 : E[15] ? 1 : 0, dy = E[12] ? -1 : E[13] ? 1 : 0;
    if (Math.abs(ax) > 0.55 || Math.abs(ay) > 0.55) { stickT -= dt; if (stickT <= 0) { stickT = stickT < -1 ? 0.3 : 0.18; if (Math.abs(ax) > Math.abs(ay)) dx = Math.sign(ax); else dy = Math.sign(ay); } } else stickT = 0;
    if (dx || dy) moveFocus(dx, dy);
    if (E[0]) { const b = items()[focus]; if (b) b.click(); }
    if (E[1]) closeArcade();
  }
  function moveFocus(dx, dy) {
    const it = items(); if (!it.length) return; A.padUsed = true;
    const cur = it[focus] || it[0], r0 = cur.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    let best = -1, bd = 1e9;
    it.forEach((b, i) => { if (i === focus) return; const r = b.getBoundingClientRect(), x = r.left + r.width / 2 - cx, y = r.top + r.height / 2 - cy;
      const along = dx ? x * dx : y * dy, side = dx ? Math.abs(y) : Math.abs(x); if (along <= 4) return; const d = along + side * 2.2; if (d < bd) { bd = d; best = i; } });
    if (best < 0) best = (focus + (dx || dy) + it.length) % it.length;
    focus = best; refocus(); try { sfx('click', .15); } catch (_) {}
  }
  addEventListener('keydown', e => { if (A.mode === 'ds' && !A.open) { if (!e.repeat) A.dsKey(e, true); e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  addEventListener('keyup', e => { if (A.mode === 'ds' && !A.open) { A.dsKey(e, false); e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  addEventListener('keydown', e => {
    if (!A.open) return;
    const it = items();
    if (e.key === 'Escape' || e.key === 'Backspace') closeArcade();
    else if (/^Arrow/.test(e.key)) moveFocus(e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0, e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0);
    else if (e.key === 'Enter' || e.key === ' ') { if (A.padUsed && it[focus]) it[focus].click(); else return; }
    else { e.stopImmediatePropagation(); return; }
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);
  addEventListener('keyup', e => { if (!A.open) return; e.stopImmediatePropagation(); }, true);
  ui.addEventListener('mousedown', e => e.stopPropagation()); ui.addEventListener('pointerdown', e => e.stopPropagation());

  // ---------- DS via EmulatorJS, shown ON the in-world TV screen (v0.9.70) ----------
  // The emulator runs in a hidden same-origin iframe (opacity 0, behind the game canvas, still rendering). Its canvas is
  // the texture of the TV's screen; its sound goes through Glencraft's audio context with a panner at the TV.
  const DS_DOC = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden;touch-action:none}#wrap{position:absolute;inset:0}#game{width:100%;height:100%}</style></head>
<body><div id="wrap"><div id="game"></div></div><script>
(async function () {
  var P = parent.__arcade, d = P.ds;
  try { Object.defineProperty(window, 'devicePixelRatio', {get: function () { return 1; }}); } catch (e) {}
  // the TV reads the emulator canvas after it has drawn: keep the drawing buffer
  var gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, o) { if (/webgl/.test(t)) { o = Object.assign({}, o || {}, {preserveDrawingBuffer: true}); } return gc.call(this, t, o); };
  // sound: use Glencraft's (already unlocked) audio context, routed through a panner at the TV
  var shared = P.dsAudioCtx && P.dsAudioCtx();
  if (shared) {
    var Fake = function () { return shared.ctx; };
    window.AudioContext = Fake; window.webkitAudioContext = Fake;
  }
  var buf = await d.rec.blob.arrayBuffer();
  window.EJS_player = '#game'; window.EJS_core = 'nds'; window.EJS_pathtodata = P.EJS_PATH;
  window.EJS_gameUrl = new File([buf], d.rec.name); window.EJS_gameName = d.key;
  window.EJS_startOnLoaded = true; window.EJS_color = '#3cb043'; window.EJS_backgroundColor = '#000'; window.EJS_volume = 1;
  window.EJS_defaultOptions = Object.assign({'melonds_screen_layout': 'Left/Right', 'melonds_touch_mode': 'Touch', 'lockMouse': 'disabled', 'save-state-location': 'browser', 'save-save-interval': '10', 'virtual-gamepad': 'disabled'}, P.dsOpts || {});
  window.EJS_Buttons = {exitEmulation: false, cacheManager: false, fullscreen: false};
  if (d.state) window.EJS_loadStateURL = new Uint8Array(d.state);
  window.EJS_onGameStart = function () { P.dsStarted(window); };
  var s = document.createElement('script'); s.src = P.EJS_PATH + 'loader.js'; s.onerror = function () { P.dsFail('Could not download the emulator (are you online?)'); }; document.body.appendChild(s);
})().catch(function (e) { parent.__arcade.dsFail('Could not start: ' + (e && e.message || e)); });
<\/script></body></html>`;
  const dcss = document.createElement('style');
  dcss.textContent = `#arcFrame{position:fixed;left:0;top:0;width:768px;height:288px;border:0;opacity:0;pointer-events:none;z-index:-5}
#dsHud{position:fixed;left:50%;bottom:calc(10px + var(--sab,0px));transform:translateX(-50%);z-index:80;background:rgba(0,0,0,.72);color:#fff;font:600 13px system-ui,sans-serif;padding:6px 12px;border-radius:10px;transition:opacity .4s;pointer-events:none;text-align:center;max-width:92vw}
#dsHud.off{opacity:0}
#dsX{position:fixed;top:calc(10px + var(--sat,0px));right:calc(10px + var(--sar,0px));z-index:81;width:44px;height:44px;border-radius:50%;border:2px solid #ffffff66;background:rgba(0,0,0,.55);color:#fff;font-size:20px}
#dsX.hidden{display:none}`;
  document.head.appendChild(dcss);
  const dsHud = document.createElement('div'); dsHud.id = 'dsHud'; dsHud.className = 'off'; dsHud.dataset.testid = 'ds-hud'; document.body.appendChild(dsHud);
  const dsX = document.createElement('button'); dsX.id = 'dsX'; dsX.className = 'hidden'; dsX.textContent = '✕'; dsX.title = 'Save and stop playing'; dsX.dataset.testid = 'ds-exit'; document.body.appendChild(dsX);
  dsX.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); exitDS(); });
  let hudT = 0;
  const dsHint = (t, ms) => { dsHud.textContent = t; dsHud.classList.remove('off'); clearTimeout(hudT); if (ms) hudT = setTimeout(() => dsHud.classList.add('off'), ms); };
  A.dsAudioCtx = () => {
    try { initAudio(); } catch (_) {}
    if (!AC) return null;
    if (!A.dsAud) { const g = AC.createGain(), pn = AC.createPanner(); pn.panningModel = 'equalpower'; pn.distanceModel = 'inverse'; pn.refDistance = 2.5; pn.rolloffFactor = 1.1; pn.maxDistance = 40;
      g.connect(pn); pn.connect(AC.destination); A.dsAud = {g, pn}; }
    // emscripten connects to ctx.destination: hand it a context view whose destination is our panner chain
    const ctx = new Proxy(AC, {get(t, p) { if (p === 'destination') return A.dsAud.g; if (p === 'close') return () => Promise.resolve(); const v = t[p]; return typeof v === 'function' ? v.bind(t) : v; }});
    try { if (AC.state === 'suspended') AC.resume(); } catch (_) {}
    return {ctx};
  };
  async function playDS(fresh) {
    const rec = await fget('ds_rom'); if (!rec || !rec.blob) { if (!A.open) openArcade(A.tvKey); msg('Pick a game file first'); refresh(); return; }
    const k = A.tvKey && entObjs.has(A.tvKey) ? A.tvKey : null; if (!k) { toast('Use the Gamepad next to a TV'); return; }
    const state = fresh ? null : await fget('ds_state:' + rec.key);
    if (A.open) closeArcade();
    if (A.mode === 'ds') return;
    A.ds = {rec, key: rec.key, state: state || null, pad: !!padNow(), t0: performance.now()};
    A.mode = 'ds'; A.tvPlay = {k, t0: performance.now()}; menuOpen = true; freezeWorld(true);
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (_) {}
    dsX.classList.remove('hidden'); dsHint('Starting the DS on the TV… (the first time it downloads about 2 MB)');
    const f = document.createElement('iframe'); f.id = 'arcFrame'; f.setAttribute('allow', 'autoplay; gamepad'); f.dataset.testid = 'arcade-ds-frame'; f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    f.srcdoc = DS_DOC; document.body.appendChild(f); A.frame = f;
    A.dsTimer = setTimeout(() => { if (A.mode === 'ds' && !A.dsWin) dsHint('Still loading… (a slow connection can take a minute)'); }, 25000);
    if (A.onTVStart) A.onTVStart(k);
  }
  A.playDS = playDS;
  A.dsFail = t => { if (A.mode !== 'ds') return; dsHint(t + ' · hold View + Menu or tap ✕ to stop'); };
  A.dsStarted = async w => {
    clearTimeout(A.dsTimer); A.dsWin = w; A.ds.started = performance.now();
    const E = w.EJS_emulator; A.dsCanvas = E && E.canvas;
    try { const gm = E.gameManager, p = gm.getSaveFilePath(), bk = await fget('ds_sram:' + A.ds.key);
      if (bk && p && !gm.FS.analyzePath(p).exists) { try { gm.FS.mkdirTree ? gm.FS.mkdirTree(p.replace(/\/[^/]*$/, '')) : 0; } catch (_) {} gm.FS.writeFile(p, new Uint8Array(bk)); gm.loadSaveFiles(); A.ds.restored = true; } } catch (_) {}
    try { window.focus(); } catch (_) {}
    dsHint('Playing on the TV · hold View + Menu (or tap ✕) to save and stop', 5000);
    if (A.onDSCanvas) A.onDSCanvas(A.dsCanvas);
  };
  // controller -> emulator (RetroArch pad ids: 0 B,1 Y,2 Select,3 Start,4-7 Up/Down/Left/Right,8 A,9 X,10 L,11 R)
  const PADMAP = {0: 8, 1: 0, 2: 9, 3: 1, 4: 10, 5: 11, 8: 2, 9: 3, 12: 4, 13: 5, 14: 6, 15: 7};
  const dsHeld = {};
  function dsSend(id, on) { if (!!dsHeld[id] === on) return; dsHeld[id] = on; try { A.dsWin.EJS_emulator.gameManager.simulateInput(0, id, on ? 1 : 0); } catch (_) {} }
  A.dsSend = dsSend;
  A.dsPad = (gp) => {
    const P = []; for (let i = 0; i < 17; i++) { const b = gp && gp.buttons[i]; P[i] = !!(b && (b.pressed || b.value > 0.4)); }
    dsCombo(P, null, 0);
    if (!A.dsWin || A.exiting) return;
    const ax = gp ? gp.axes[0] || 0 : 0, ay = gp ? gp.axes[1] || 0 : 0, st = {12: ay < -0.5, 13: ay > 0.5, 14: ax < -0.5, 15: ax > 0.5};
    const want = {}; for (const i in PADMAP) { const id = PADMAP[i]; want[id] = !!(want[id] || P[i] || (st[i] || false)); }
    if (P[8] && P[9]) { want[2] = false; want[3] = false; }      // the exit combo isn't sent to the game
    for (const id in want) dsSend(+id, want[id]);
  };
  const KEYMAP = {ArrowUp: 4, ArrowDown: 5, ArrowLeft: 6, ArrowRight: 7, KeyX: 8, KeyZ: 0, KeyS: 9, KeyA: 1, KeyQ: 10, KeyW: 11, Enter: 3, ShiftRight: 2, ShiftLeft: 2, Backspace: 2};
  A.dsKey = (e, down) => { if (e.code === 'Escape') { if (down) exitDS(); return true; } const id = KEYMAP[e.code]; if (id === undefined) return true; dsSend(id, down); return true; };
  let guidePrev = false, comboFrom = 0;
  function dsCombo(P, E, dt) {
    if (A.exiting || A.mode !== 'ds') return;
    const now = performance.now();
    if (P[8] && P[9]) { if (!comboFrom) comboFrom = now; dsHint('Keep holding to save and stop…'); if (now - comboFrom > 800) { comboFrom = 0; exitDS(); } }
    else if (comboFrom && now - comboFrom > 120) { comboFrom = 0; dsHud.classList.add('off'); }
    if (P[16] && !guidePrev) exitDS(); guidePrev = !!P[16];
  }
  async function exitDS(quick) {
    if (A.exiting || A.mode !== 'ds') return; A.exiting = true;
    const w = A.dsWin; let E = null; try { E = w && w.EJS_emulator; } catch (_) {}
    dsHint('Saving…');
    for (const id in dsHeld) dsSend(+id, false);
    try { if (E && E.started && E.gameManager) {
      const gm = E.gameManager;
      try { gm.saveSaveFiles(); } catch (_) {}
      try { const sv = gm.getSaveFile(false); if (sv && sv.length) await fput('ds_sram:' + A.ds.key, sv.slice().buffer); } catch (_) {}
      try { const st = gm.getState(); if (st && st.length) { await fput('ds_state:' + A.ds.key, st.slice().buffer); A.lastStateBytes = st.length; } } catch (_) {}
      await new Promise(r => { let done = false; const fin = () => { if (!done) { done = true; r(); } }; try { gm.FS.syncfs(false, fin); } catch (_) { fin(); } setTimeout(fin, quick ? 600 : 2500); });
    } } catch (_) {}
    clearTimeout(A.dsTimer);
    try { E && E.pause && E.pause(); } catch (_) {}
    try { A.frame.src = 'about:blank'; } catch (_) {} try { A.frame.remove(); } catch (_) {}
    A.frame = null; A.dsWin = null; A.dsCanvas = null; A.exiting = false;
    const k = A.tvPlay && A.tvPlay.k; A.tvPlay = null; A.mode = null; menuOpen = false; freezeWorld(false); dsX.classList.add('hidden');
    try { const gp = pickPad(); if (gp) for (let i = 0; i < 17; i++) { const b = gp.buttons[i]; gpPrev[i] = !!(b && (b.pressed || b.value > 0.4)); } } catch (_) {}
    try { for (const kk in keys) keys[kk] = false; } catch (_) {}
    if (A.onTVEnd) A.onTVEnd(k);
    dsHint('DS game saved · use the Gamepad on the TV to carry on', 2500);
  }
  A.exitDS = exitDS;

  try { localStorage.removeItem('glen_hop_v1'); } catch (_) {}   // Haggis Hop was removed in v0.9.70: drop its save data
})();
