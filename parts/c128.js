/* ===================== GLX-C128 (v1.0.10): black + gold theme, bold font, coords, exact grass loading block ===================== */
// Font: "Lilita One" by Juan Montoreano, SIL Open Font License 1.1 (embedded subset, never fetched).
(function c128() {
  const warn = (w, e) => { try { console.warn('c128 ' + w, e); } catch (_) {} };
  const C128 = window.__c128 = {v: 1};
  const F = "'GlenBold',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  const ACC = '#f2c440';
  /* ---------- font + theme ---------- */
  try {
    const pre = document.getElementById('c128theme'), st = pre || document.createElement('style'); st.id = 'c128theme';   // v1.0.54: baked into the page head so the look is right from first paint
    if (!pre) st.textContent = "@font-face{font-family:'GlenBold';src:url(data:font/woff2;base64,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) format('woff2');font-weight:100 900;font-style:normal;font-display:block}" + `
:root{--moss:#f2c440;--glass:rgba(9,10,12,.78);--line:rgba(255,255,255,.13);--txt:#f5f4ef;--muted:#b9b7ae;--warn:#f2c440;--ok:#f2c440;--acc:#f2c440;--acc2:#ffe58e;--pan:rgba(9,10,12,.9);--el:rgba(255,255,255,.06);--elb:rgba(255,255,255,.13);
 --fs:clamp(14px,calc(11px + .45vmin),17px)}
html,body{background:#050506!important}
body,body *{font-family:${F}!important;letter-spacing:.01em}
body *{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
.padok{display:inline-block;font-size:1.05em;line-height:1;vertical-align:middle;filter:grayscale(1) brightness(1.4);opacity:.42;transition:opacity .3s,filter .3s;font-family:'Noto Color Emoji','Apple Color Emoji','Segoe UI Emoji',sans-serif!important}
body.padOn .padok{filter:none;opacity:1}
/* logo */
#scr-title .logo,#scr-boot .logo,#scr-loading .logo{font-family:'GlenBold',Impact,'Arial Black',sans-serif!important;font-weight:400!important;letter-spacing:.035em!important;-webkit-text-stroke:1.6px rgba(70,44,8,.95)!important}
#scr-title .logo small,#scr-boot .logo small{font-family:'GlenBold',sans-serif!important;letter-spacing:.42em!important;-webkit-text-stroke:0!important}
/* menu backdrops */
#scr-title,#scr-worlds,#scr-create{background:linear-gradient(90deg,rgba(0,0,0,.84) 0%,rgba(0,0,0,.6) 46%,rgba(0,0,0,.16) 100%)!important}
#scr-boot,#scr-loading{background:radial-gradient(120% 90% at 50% 40%,#16171a 0%,#050506 72%)!important}
/* tiles (title, worlds) - flat black glass, gold focus */
.tile{background:rgba(10,11,13,.86)!important;border:1px solid var(--elb)!important;border-radius:14px!important;color:#f5f4ef!important;box-shadow:0 10px 26px rgba(0,0,0,.38)!important;filter:none!important;font-size:17px!important}
.tile::after,.tile::before{display:none!important}
.tile b{font-size:21px!important;color:#fff!important;text-shadow:none!important}
.tile small{font-size:14px!important;color:var(--muted)!important;opacity:1!important}
.tile:hover,.tile.focus,.tile:focus-visible{border-color:var(--acc)!important;box-shadow:0 0 0 2px var(--acc),0 0 22px rgba(242,196,64,.35),0 10px 26px rgba(0,0,0,.45)!important;transform:translateX(4px)!important;filter:none!important;outline:none!important}
.tile.play{background:var(--acc)!important;border-color:var(--acc)!important;color:#141006!important;font-size:clamp(30px,5.6vw,52px)!important}
.tile.play small{color:#3b2c06!important;font-size:15px!important}
.tile.play:hover,.tile.play.focus,.tile.play:focus-visible{box-shadow:0 0 0 3px #fff3c4,0 0 30px rgba(242,196,64,.6)!important}
.tile.goldw{background:rgba(242,196,64,.14)!important;border-color:rgba(242,196,64,.55)!important}
.tile.goldw b{color:var(--acc2)!important}
.tile .gold{background:var(--acc)!important;color:#141006!important;box-shadow:none!important;font-size:12px!important}
.tile .gold.cre{background:#2a2b2f!important;color:#fff!important}
.tile .plus{color:var(--acc)!important;opacity:.85!important}
.tile.gear{font-size:32px!important}
.menuhint{font-size:14px!important;color:var(--muted)!important;opacity:1!important;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#padBadge{display:inline-flex!important;margin:0!important;font-size:15px!important;color:var(--muted)!important;gap:6px!important}
#padBadge svg{display:none!important}
.mtitle{font-size:32px!important;color:#fff!important}
#worldName{font-size:20px!important;border:1px solid var(--elb)!important;border-radius:12px!important;background:rgba(10,11,13,.9)!important}
#worldName:focus,#worldName.focus{outline:2px solid var(--acc)!important;outline-offset:2px;border-color:var(--acc)!important}
#modeSeg button{background:rgba(10,11,13,.86)!important;border:1px solid var(--elb)!important;border-radius:12px!important;font-size:20px!important;box-shadow:none!important;color:#f5f4ef!important}
#modeSeg button.on{background:var(--acc)!important;border-color:var(--acc)!important;color:#141006!important}
#modeSeg button.focus{outline:2px solid #fff3c4!important;outline-offset:2px}
#modeInfo{font-size:15px!important;color:var(--muted)!important}
#scr-create button:not(.tile):not(#modeSeg button){font-size:16px}
/* panels */
.panel,#notesUI .npanel{background:var(--pan)!important;border:1px solid var(--elb)!important;border-radius:16px!important;box-shadow:0 24px 64px rgba(0,0,0,.6),0 0 0 1px rgba(242,196,64,.05)!important;color:var(--txt)}
#pause,#notesUI,#craft{background:rgba(0,0,0,.6)!important}
h1,h2,.panel h2,.panel h3{color:var(--acc)!important}
h2{font-size:23px!important}
.sub{font-size:15px!important;color:var(--muted)}
.set{font-size:15px!important;color:var(--muted)!important}.set b{color:#fff!important}
.keys{font-size:14px!important;color:var(--muted)!important}.keys b{color:#fff!important}
.btn{font-size:18px!important;background:var(--el)!important;border:1px solid var(--elb)!important;border-radius:12px!important;color:#fff!important;box-shadow:none!important}
.btn.small{font-size:15px!important}
.btn:hover{border-color:rgba(242,196,64,.6)!important}
#resumeBtn,#createGo,#craftGo,.btn.primary{background:var(--acc)!important;border-color:var(--acc)!important;color:#141006!important}
.seg{border:1px solid var(--elb)!important;background:rgba(255,255,255,.035)!important;border-radius:12px!important}
.seg button{font-size:15px!important;color:var(--muted)!important;background:transparent!important}
.seg button.on{background:var(--acc)!important;color:#141006!important}
.tabs button{font-size:16px!important;background:var(--el)!important;border:1px solid var(--elb)!important;color:var(--muted)!important;border-radius:11px!important;box-shadow:none!important}
.tabs button.on{background:var(--acc)!important;border-color:var(--acc)!important;color:#141006!important}
.rec{background:var(--el)!important;border:1px solid var(--elb)!important;font-size:16px!important}
.rec .tx span{font-size:13px!important}
.gslot,.fslot,.aslot{background:rgba(255,255,255,.045)!important;border:1px solid var(--elb)!important}
.aslot{font-size:13px!important}.aslot b{font-size:14px!important}
.stat{font-size:13px!important}
#charView{background:radial-gradient(120% 90% at 50% 20%,#2a2b30 0%,#121316 60%,#08090a 100%)!important;border:1px solid var(--elb)!important}
#charHint{font-size:13px!important}
input[type=range]{background:rgba(255,255,255,.08)!important;border:1px solid var(--elb)!important}
input[type=range]::-webkit-slider-thumb{background:var(--acc)!important;border:3px solid #0b0b0d!important;box-shadow:0 0 0 2px var(--acc)!important}
/* crisp controller focus */
.focus,.btn.focus,.seg button.focus,.rec.focus,.gslot.focus,.slot.focus,.tabs button.focus,.set.focus,#notesUI .nclose.focus,button:focus-visible{outline:2px solid var(--acc)!important;outline-offset:2px!important;box-shadow:0 0 0 5px rgba(242,196,64,.22)!important}
.tile.focus{outline:none!important}
/* patch notes */
#notesUI .nhead{border-bottom:1px solid var(--elb)!important}#notesUI .nhead b{font-size:22px!important}
#notesUI .nclose{background:var(--el)!important;border:1px solid var(--elb)!important}
#notesUI .nbody{font-size:16px!important}#notesUI .nver h3{color:var(--acc)!important;font-size:19px!important}#notesUI .nfoot{font-size:13px!important;color:var(--muted)!important;border-top:1px solid var(--elb)!important}
/* loading */
.bootbar{background:rgba(255,255,255,.1)!important}
.bootbar i{background-image:linear-gradient(90deg,#d9a52c,#ffe58e,#d9a52c)!important;box-shadow:0 0 12px rgba(242,196,64,.55)!important}
.boottip{font-size:15px!important;color:var(--muted)!important}
#loadPct{font-size:24px!important;color:#fff!important}
/* HUD */
.glass{background:rgba(9,10,12,.74)!important;border:1px solid var(--elb)!important;border-radius:12px!important}
#hotbar{background:rgba(9,10,12,.78)!important;border:1px solid var(--elb)!important;border-radius:14px!important}
.slot{background-color:rgba(255,255,255,.06)!important;border:1px solid rgba(255,255,255,.16)!important;border-radius:9px!important}
.slot.sel{border:2px solid var(--acc)!important;box-shadow:0 0 12px rgba(242,196,64,.55)!important}
.slot b{font-size:13px!important}
#itemName{font-size:16px!important}
#toast{font-size:16px!important;border-left:3px solid var(--acc)!important}
.tbtn{background:rgba(9,10,12,.72)!important;border:1.5px solid rgba(255,255,255,.3)!important;color:#fff!important;font-size:12px!important;box-shadow:0 3px 10px rgba(0,0,0,.35)!important}
#bMine{border-color:var(--acc)!important;color:var(--acc2)!important;font-size:14px!important}
#bJump{font-size:13px!important}
.tbtn.on,#bSprint.on{background:var(--acc)!important;color:#141006!important;border-color:var(--acc)!important}
#stickBase{background:rgba(9,10,12,.5)!important;border:1.5px solid rgba(255,255,255,.28)!important}
#knob{background:rgba(242,196,64,.55)!important;border:2px solid #fff3c4!important}
#fsBtn{background:rgba(9,10,12,.6)!important;border:1px solid var(--elb)!important}
#xpBar{border-color:var(--elb)!important}
#hudXYZ{position:absolute;top:calc(8px + var(--sat));left:calc(10px + var(--sal));padding:4px 10px 4px 9px;border-radius:9px;background:rgba(9,10,12,.68);border:1px solid rgba(255,255,255,.1);border-left:3px solid var(--acc);color:#fff;font-size:15px;line-height:1.2;white-space:nowrap;pointer-events:none;text-shadow:0 1px 2px #000;z-index:2}
#hudXYZ i{font-style:normal;color:var(--acc);margin:0 3px 0 7px}#hudXYZ i:first-child{margin-left:0}
#vitals{top:calc(42px + var(--sat))!important}
.splash{background:rgba(9,10,12,.88)!important;border:1px solid rgba(242,196,64,.65)!important;color:#ffe58e!important;-webkit-text-fill-color:#ffe58e!important;box-shadow:0 0 14px rgba(242,196,64,.28)!important;text-shadow:none!important}
#pnUI .pp,.tp,#enchUI .tp,#tradeUI .tp{background:var(--pan)!important;border:1px solid var(--elb)!important;border-radius:16px!important;color:var(--txt)!important;box-shadow:0 24px 64px rgba(0,0,0,.6)!important;font-size:16px!important}
#pnClose,#pnUI .px{border-color:var(--elb)!important;background:var(--el)!important}
#enchUI button,#tradeUI button{background:var(--el)!important;border:1px solid var(--elb)!important;color:#fff!important;font-size:15px!important}
#enchUI button.focus,#tradeUI button.focus{border-color:var(--acc)!important}
.catbar button{background:var(--el)!important;border:1px solid var(--elb)!important;color:var(--muted)!important;transform:none!important}
.catbar button.on{background:rgba(242,196,64,.16)!important;border-color:var(--acc)!important;color:var(--acc2)!important}
.tb{background:var(--acc)!important}
.gslot.hint{border-color:var(--acc)!important}
.c121cat{color:var(--acc2)!important;border-bottom-color:rgba(242,196,64,.3)!important;font-size:13px!important}
#xpBar{background:rgba(9,10,12,.6)!important}
/* layout: portrait phones */
@media (max-width:520px){
 #scr-title,#scr-worlds,#scr-create{padding:0 calc(14px + var(--sal)) 0 calc(14px + var(--sar))!important;background:rgba(0,0,0,.66)!important}
 .tile.play{height:96px!important}
 .tilerow{gap:10px!important}
 .tile.small{height:66px!important;padding:10px 12px!important}
 .tile.gear{flex:0 0 62px!important}
 .tile b{font-size:18px!important}.tile small{font-size:12.5px!important}
 .panel{padding:14px!important}
 #worldTiles{grid-template-columns:1fr!important}
 #scr-title .logo{font-size:min(15vw,12vh)!important}
 #scr-title .logoWrap{margin-bottom:30px!important}
 .set.inline{flex-wrap:wrap!important;gap:6px 10px!important}
 .set.inline .seg{max-width:100%!important;flex-wrap:wrap!important;margin-left:auto!important}
 .seg button{padding:8px 11px!important}
 #rdSeg input[type=range]{width:min(120px,26vw)!important}#rdVal{min-width:64px!important}
}
/* layout: short landscape phones */
@media (max-height:430px) and (orientation:landscape){
 .tile.play{height:84px!important}
 .tile.small{height:60px!important;padding:8px 14px!important}
 .tile.gear{flex:0 0 60px!important}
 .titlecol{gap:9px!important}
 .tile b{font-size:18px!important}.tile small{font-size:13px!important}
 .mtitle{font-size:26px!important}
 #modeSeg button{height:50px!important}
 .panel{padding:12px 16px!important;max-height:calc(100% - 4px)!important}
 #craft .panel{height:calc(100vh - 20px)!important;max-height:none!important}
 #craft.ovl,#pause.ovl{padding:8px calc(8px + var(--sar)) 8px calc(8px + var(--sal))!important}
}
`;
    document.head.appendChild(st);
    const keepLast = () => { try { if (document.head.lastElementChild !== st) document.head.appendChild(st); } catch (_) {} };
    [400, 1500, 4000, 9000, 20000].forEach(t => setTimeout(keepLast, t));
    C128.keepLast = keepLast;
    try { document.fonts.load("40px 'GlenBold'").then(() => { C128.font = true; }, () => {}); } catch (_) {}
  } catch (e) { warn('theme', e); }

  /* ---------- 1) no Clydebank / map text on screen: credit lives in Settings ---------- */
  try {
    const kill = () => { const d = document.getElementById('osmCredit'); if (d) d.remove(); };
    kill(); setInterval(kill, 2000);
    const note = () => { const pn = document.querySelector('#pause .panel'); if (!pn || document.getElementById('osmNote')) return;
      const d = document.createElement('div'); d.id = 'osmNote'; d.setAttribute('data-testid', 'settings-osm-credit');
      d.style.cssText = 'margin:14px 0 2px;font-size:12px;color:#8f8d86;text-align:center;line-height:1.4';
      d.innerHTML = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" style="color:#c9b57a">OpenStreetMap contributors</a>';
      pn.appendChild(d); };
    note(); setTimeout(note, 1500); setInterval(note, 4000);
  } catch (e) { warn('credit', e); }

  /* ---------- 3/6) controller text -> a tick ---------- */
  try {
    const any = () => { try { const g = navigator.getGamepads ? navigator.getGamepads() : []; for (const p of g) if (p && p.connected) return true; } catch (_) {} return false; };
    const upd = () => document.body.classList.toggle('padOn', any());
    window.addEventListener('gamepadconnected', upd); window.addEventListener('gamepaddisconnected', upd); setInterval(upd, 1500); upd();
    const T = '<span class="padok" title="Controller support">\u2705</span>';
    const fix = () => {
      const b = document.getElementById('padBadge'), h = document.querySelector('#scr-title .menuhint');
      if (b) { if (h && b.parentNode !== h) h.appendChild(b); const s = b.querySelector('span:not(.padok)'); if (s) s.outerHTML = T; }
      document.querySelectorAll('.padhint').forEach(e => { if (e.dataset.c128 !== e.innerHTML) { e.innerHTML = T; e.dataset.c128 = e.innerHTML; } });
      for (const id of ['pauseHint', 'startHint']) { const e = document.getElementById(id); if (e && /Controller:|D-pad|LB\/RB/.test(e.innerHTML)) e.innerHTML = e.innerHTML.replace(/Controller:[\s\S]*$/, T); }
    };
    fix(); setInterval(fix, 1200);
  } catch (e) { warn('pad', e); }

  /* ---------- 2) live coordinates, top left ---------- */
  try {
    const hud = document.getElementById('hud'); const d = document.createElement('div'); d.id = 'hudXYZ'; d.setAttribute('data-testid', 'hud-coords');
    d.innerHTML = '<i>X</i><span>0</span><i>Y</i><span>0</span><i>Z</i><span>0</span>'; if (hud) hud.appendChild(d);
    const sp = d.querySelectorAll('span'); let last = '';
    setInterval(() => { try { if (typeof started === 'undefined' || !started || typeof P === 'undefined' || !P) return;
      const x = Math.floor(P.x), y = Math.floor(P.y), z = Math.floor(P.z), k = x + ',' + y + ',' + z; if (k === last) return; last = k;
      sp[0].textContent = x; sp[1].textContent = y; sp[2].textContent = z; } catch (_) {} }, 200);
    C128.xyz = () => d.textContent;
  } catch (e) { warn('xyz', e); }

  /* ---------- 4) loading block = the exact in-game grass faces ---------- */
  try {
    const KEY = 'glen_cube_v3', S = 256; let sig = '';
    const root = document.documentElement.style;
    const apply = o => { if (!o || !o.t) return; root.setProperty('--cubeT', 'url(' + o.t + ')'); root.setProperty('--cubeS', 'url(' + o.s + ')'); root.setProperty('--cubeB', 'url(' + o.b + ')'); document.documentElement.classList.add('cubeOk'); };
    try { localStorage.removeItem(KEY); } catch (_) {}   // v1.0.54: the loading block is baked into the page head (one block from first paint), never swapped
    const cs = document.createElement('style'); cs.textContent = 'html:not(.cubeOk) .c3d .cube{visibility:hidden}.c3d .cube .f1,.c3d .cube .f2{filter:brightness(.9)!important}.c3d .cube .f3,.c3d .cube .f4{filter:brightness(.76)!important}.c3d .cube .f5{filter:none!important}.c3d .cube .f6{filter:brightness(.55)!important}.c3d .cube i{box-shadow:none!important;image-rendering:auto}';
    if (!document.getElementById('c239cube')) document.head.appendChild(cs);
    const faceMats = () => { try { const bm = BLOCK_MATS[T.GRASS]; const a = Array.isArray(bm) ? bm : [bm, bm, bm, bm, bm, bm]; return {s: a[0], t: a[2], b: a[3]}; } catch (_) { return null; } };
    const tintNow = () => { try { if (typeof started !== 'undefined' && started && window.__bio && typeof P !== 'undefined') return __bio.tint(P.x, P.z) || null; } catch (_) {} return null; };
    const draw = (m, tint) => { const im = m && m.map && m.map.image; if (!im || !(im.width || im.videoWidth) || im.complete === false) return null;
      const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.fillStyle = '#7a5434'; g.fillRect(0, 0, S, S); g.drawImage(im, 0, 0, S, S);   // v1.0.71: never black (jpeg has no alpha)
      try { const d = g.getImageData(0, 0, S, S).data; let L = 0; for (let i = 0; i < d.length; i += 4096) L += d[i] + d[i + 1] + d[i + 2]; if (L / (d.length / 4096) < 60) return null; } catch (_) {}
      const col = m.color; if (col && (col.r < .999 || col.g < .999 || col.b < .999)) { g.globalCompositeOperation = 'multiply'; g.fillStyle = '#' + col.getHexString(); g.fillRect(0, 0, S, S); g.globalCompositeOperation = 'source-over'; }
      if (tint && (tint[0] !== 1 || tint[1] !== 1 || tint[2] !== 1)) { const id = g.getImageData(0, 0, S, S), p = id.data;
        for (let i = 0; i < p.length; i += 4) { const r = p[i], gg = p[i + 1], b = p[i + 2], gm = Math.max(0, Math.min(1, (gg - Math.max(r, b)) / 255 * 10)); if (gm > 0) { p[i] = r + (Math.min(255, r * tint[0]) - r) * gm; p[i + 1] = gg + (Math.min(255, gg * tint[1]) - gg) * gm; p[i + 2] = b + (Math.min(255, b * tint[2]) - b) * gm; } }
        g.putImageData(id, 0, 0); }
      return c.toDataURL('image/jpeg', .9); };
    const ids = new WeakMap(); let idn = 0; const oid = o => { if (!o) return 0; if (!ids.has(o)) ids.set(o, ++idn); return ids.get(o); };
    const refresh = force => { const f = faceMats(); if (!f || !f.t) return false; const tn = tintNow();
      const k = [f.t, f.s, f.b].map(m => oid(m.map && m.map.image) + ':' + (m.map ? m.map.version : 0) + ':' + (m.color ? m.color.getHex() : 0)).join('|') + '|' + (tn ? tn.join(',') : '');
      if (k === sig && !force) return true;
      const o = {t: draw(f.t, tn), s: draw(f.s, tn), b: draw(f.b, null)}; if (!o.t || !o.s || !o.b) return false;
      sig = k; apply(o); C128.cube = {sig: k, at: Date.now()}; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (_) {} return true; };
    { const px = (top, side) => { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); let r = 7;
        const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const k = rnd(); let col;
          if (top) col = k < 0.3 ? '#4f8a2e' : k < 0.7 ? '#5f9e36' : '#73b443'; else if (side && y < 3 + (k < 0.5 ? 1 : 0)) col = k < 0.5 ? '#5f9e36' : '#4f8a2e'; else col = k < 0.3 ? '#6b4a2c' : k < 0.7 ? '#7a5434' : '#8d6440';
          g.fillStyle = col; g.fillRect(x, y, 1, 1); } return c.toDataURL('image/png'); };   // v1.0.71: tiny inline grass so the loading block is never black
      if (!document.documentElement.classList.contains('cubeOk')) apply({t: px(1, 0), s: px(0, 1), b: px(0, 0)}); }
    C128.refreshCube = refresh;
    const loop = () => { let ok = false; try { ok = refresh(); } catch (e) { warn('cube', e); } setTimeout(loop, ok ? 4000 : 700); };
    if (!document.getElementById('c239cube')) setTimeout(loop, 300);
    if (typeof showScreen === 'function') { const ss = showScreen; showScreen = function (n) { if ((n === 'loading' || n === 'boot') && !document.getElementById('c239cube')) { try { refresh(); } catch (_) {} } return ss.apply(this, arguments); }; }
  } catch (e) { warn('cube', e); }
})();
