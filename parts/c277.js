// c277: UI theme colour (v1.0.90). Every UI accent goes through CSS variables; default GOLD, neon green and others as presets, plus a custom colour. Saved in localStorage.
(function () {
  const KEY = 'glen_uiTheme', DEF = '#f2c14e';
  const PRE = [['Gold', '#f2c14e'], ['Neon green', '#39ff6a'], ['Ice blue', '#7cc8ff'], ['Tartan red', '#ff4a4a'], ['Heather', '#c07cff'], ['Silver', '#dfe6ee']];
  const U = window.__c277 = {key: KEY, def: DEF, presets: PRE, err: null};
  const rgb = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); const n = parseInt(h, 16); return isFinite(n) && h.length === 6 ? [n >> 16 & 255, n >> 8 & 255, n & 255] : null; };
  const mix = (c, t, k) => c.map((v, i) => Math.round(v * (1 - k) + t[i] * k));
  function get() { try { const v = localStorage.getItem(KEY); if (v && rgb(v)) return v; } catch (_) {} return DEF; }
  function apply(h) { const c = rgb(h) || rgb(DEF), s = document.documentElement.style;
    const L = mix(c, [255, 255, 255], .55), D1 = mix(c, [6, 8, 12], .86), D2 = mix(c, [2, 3, 6], .93), M = mix(c, [0, 0, 0], .5);
    s.setProperty('--uiA', c.join(',')); s.setProperty('--uiL', L.join(',')); s.setProperty('--uiD1', D1.join(',')); s.setProperty('--uiD2', D2.join(',')); s.setProperty('--uiM', M.join(',')); s.setProperty('--uiT', mix(c, [255, 255, 255], .18).join(','));
    s.setProperty('--acc', 'rgb(' + c + ')', 'important'); s.setProperty('--moss', 'rgb(' + c + ')', 'important'); U.cur = h;
    document.querySelectorAll('#c277row button[data-c]').forEach(b => b.classList.toggle('on', b.dataset.c.toLowerCase() === String(h).toLowerCase()));
    const ip = document.getElementById('c277pick'); if (ip && ip.value.toLowerCase() !== String(h).toLowerCase()) ip.value = h; }
  function set(h) { if (!rgb(h)) return; try { localStorage.setItem(KEY, h); } catch (_) {} apply(h); }
  U.get = get; U.set = set; U.apply = apply;
  const A = a => 'rgba(var(--uiA),' + a + ')', X = ':not(#z9):not(#z8)';
  const css = [
    'html body :is(.panel,.npanel,#tradeUI .tp,#craft .panel,#furnUI .panel,#chestUI .panel)' + X + '{border:2px solid ' + A(.75) + '!important;background:linear-gradient(180deg,rgba(var(--uiD1),.94),rgba(var(--uiD2),.96))!important;box-shadow:0 0 14px ' + A(.45) + ',inset 0 0 18px ' + A(.12) + ',0 20px 60px rgba(0,0,0,.6)!important}',
    'html body :is(.panel button,.npanel button,#pause button,.tabs button,#tradeUI button,.btn,.tile,.tbtn,.seg button,#m65btns #playBtn,#m65btns #setBtn,#resumeBtn,#createGo,#craftGo,.btn.primary,.btn.alt)' + X + ':not(.gslot):not(.rec2):not(.slot){border:2px solid ' + A(.85) + '!important;background:rgba(var(--uiD1),.84)!important;background-image:none!important;color:rgb(var(--uiT))!important;-webkit-text-fill-color:rgb(var(--uiT))!important;font-family:"Trajan Pro","Cinzel","Palatino Linotype",Palatino,Georgia,serif!important;text-shadow:0 2px 2px rgba(0,0,0,.7)!important;transition:transform .2s cubic-bezier(.2,.8,.3,1.2),box-shadow .2s ease,font-size .2s ease!important;box-shadow:0 0 9px ' + A(.5) + ',inset 0 0 10px ' + A(.15) + '!important;font-weight:800!important}',
    'html body :is(.tabs button.on,#setTabs button.on,.catbar button.on,.seg button.on,#c277row button.on)' + X + '{background:rgba(var(--uiM),.7)!important;border-color:rgb(var(--uiL))!important}',
    'html body :is(.slot,.gslot,.fslot,.rec2,.aslot)' + X + '{border:2px solid ' + A(.4) + '!important;background-color:rgba(var(--uiD1),.88)!important}',
    'html body .slot.sel' + X + '{border-color:rgb(var(--uiL))!important;box-shadow:0 0 12px ' + A(.8) + '!important}',
    'html body :is(#pause .panel,.panel) :is(h1,h2,h3)' + X + ',html body .mtitle' + X + '{color:rgb(var(--uiL))!important;text-shadow:0 0 8px ' + A(.85) + '!important}',
    'html body .panel :is(.sub,.keys,label,span,p)' + X + '{color:rgb(var(--uiL))}html body #pause .panel > div' + X + ',html body .keys b' + X + '{color:rgb(var(--uiL))!important}',
    'html body #pause :is(.focus,button.focus),html body #setTabs button.focus,html body :is(.focus,button:focus-visible,.btn.focus,.seg button.focus,.tabs button.focus)' + X + '{outline:2px solid rgb(var(--uiL))!important;box-shadow:0 0 0 4px ' + A(.35) + ',0 0 16px ' + A(.8) + '!important}',
    'html body #hotbar' + X + '{border:1px solid ' + A(.6) + '!important;box-shadow:0 0 10px ' + A(.35) + '!important;background:rgba(var(--uiD2),.8)!important}',
    // logo: carved gold serif, always gold whatever the accent; Pre Alpha in the accent colour
    'html body .glogo::after{color:#e9b649!important;background:linear-gradient(180deg,#fff2b8 0%,#f3cd63 30%,#c8902a 62%,#8a5a16 100%)!important;-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;filter:drop-shadow(0 2px 0 #4a2f08) drop-shadow(0 4px 6px rgba(0,0,0,.7))!important;text-shadow:none!important}',
    'html body .glogo::before{color:rgb(var(--uiA))!important;text-shadow:0 0 8px ' + A(.6) + '!important;font-weight:800!important;letter-spacing:.32em!important}',
    'html body :is(#verTag,.c277ctl,.c277ctl *,#scr-title [class*=ctrl],#scr-title [id*=ctrl])' + X + '{color:rgb(var(--uiA))!important}html body #scr-title svg [stroke]' + X + '{stroke:rgb(var(--uiA))}',
    'html body #c260pad' + X + '{color:rgb(var(--uiA))!important}html body #c260pad.on' + X + '{color:rgb(var(--uiL))!important;filter:drop-shadow(0 0 6px ' + A(.95) + ') drop-shadow(0 0 14px ' + A(.7) + ')!important}',
    // item 18: the focused / hovered / touched button grows smoothly, others ease back
    'html body :is(.panel button,#pause button,.btn,.tile,.seg button,.tabs button)' + X + ':not(.gslot):not(.slot):is(.focus,:hover,:active,:focus-visible){transform:scale(1.1)!important;z-index:3;position:relative;box-shadow:0 0 18px ' + A(.85) + ',0 0 34px ' + A(.4) + ',inset 0 0 12px ' + A(.25) + '!important;border-color:rgb(var(--uiL))!important}',
    'html body :is(#m65btns .tile,#m65btns button,#scr-title .tile,.wtile)' + X + ':not(#z7):not(#z6):not(#z5):is(.focus,:hover,:active,:focus-visible){transform:scale(1.25)!important}html body #scr-title .tile' + X + '{transform-origin:left center}',
    'html body :is(.focus,.padfocus,.navf,button:focus,button:focus-visible,.tile:focus-visible,.rec.on,.slot.focus,#worldName.focus)' + X + ':not(#z7):not(#z6):not(#z5){outline-color:rgb(var(--uiL))!important}',
    'html body #worldTiles .tile' + X + ':not(#z7):not(#z6):not(#z5):is(.focus,:hover,:active,:focus-visible){transform:scale(1.15)!important}html body #worldTiles' + X + '{overflow:visible!important;padding:10px 14px!important}html body #worldTiles .tile' + X + '{transform-origin:center center}html body :is(#scr-worlds,#scr-worlds .titlecol)' + X + '{overflow:visible!important}',
    '#c277row .sw{display:flex;flex-wrap:wrap;gap:6px;align-items:center}#c277row button[data-c]{width:auto!important;min-width:0!important;padding:6px 10px!important;font-size:12px!important}#c277row button[data-c] i{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:5px;vertical-align:-1px}#c277pick{width:44px;height:32px;border:0;background:none;padding:0}'
  ].join('\n');
  function style() { let st = document.getElementById('c277css'); if (!st) { st = document.createElement('style'); st.id = 'c277css'; } document.head.appendChild(st); st.textContent = css; }
  function tag() { for (const e of document.querySelectorAll('#scr-title span,#scr-title div')) if (!e.children.length && /Controller supported/.test(e.textContent)) { const q = e.parentNode; e.classList.add('c277ctl'); if (q) { q.classList.add('c277ctl'); q.querySelectorAll('svg,svg *').forEach(x => { x.style.color = 'rgb(var(--uiA))'; if (x.getAttribute('stroke')) x.setAttribute('stroke', 'currentColor'); if (x.getAttribute('fill') && x.getAttribute('fill') !== 'none') x.setAttribute('fill', 'currentColor'); }); } } }
  function row() { if (document.getElementById('c277row')) return true; const P = window.__c163 && __c163.panes; const host = P && P.video; if (!host) return false;
    const d = document.createElement('div'); d.className = 'set'; d.id = 'c277row';
    d.innerHTML = '<span>UI colour</span><div class="sw">' + PRE.map(([n, c]) => '<button type="button" data-c="' + c + '" data-testid="ui-colour-' + n.toLowerCase().replace(/ /g, '-') + '"><i style="background:' + c + '"></i>' + n + '</button>').join('') + '<input type="color" id="c277pick" title="Custom colour" data-testid="ui-colour-custom"></div>';
    host.prepend(d);
    d.querySelectorAll('button[data-c]').forEach(b => b.addEventListener('click', ev => { ev.preventDefault(); set(b.dataset.c); }));
    const ip = d.querySelector('#c277pick'); ip.addEventListener('input', () => set(ip.value)); apply(get()); return true; }
  try { style(); apply(get()); } catch (e) { U.err = String(e); }
  // re-append after late stylesheets so ours wins, and add the settings row when the panes exist
  let n = 0; const t = setInterval(() => { try { n++; style(); row(); tag(); if (n > 8) clearInterval(t); } catch (e) { U.err = String(e); } }, 1500);
})();
