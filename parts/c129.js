/* ===================== GLX-C129 (v1.0.10): phone layout (portrait + landscape, no page scroll) + mini Xbox touch controls ===================== */
(function c129() {
  const warn = (w, e) => { try { console.warn('c129 ' + w, e); } catch (_) {} };
  const C = window.__c129 = {};
  const CSS = `
html,body{position:fixed!important;inset:0!important;width:100%!important;height:var(--vvh,100dvh)!important;max-width:100vw;overflow:hidden!important;overscroll-behavior:none!important}
#menu,.ovl,#notesUI,#pnUI{max-width:100vw;max-height:var(--vvh,100dvh)}
.ovl{height:var(--vvh,100dvh)!important}
.panel{max-width:min(440px,calc(100vw - 16px - var(--sal) - var(--sar)))}
#craft .panel{max-width:min(520px,calc(100vw - 12px - var(--sal) - var(--sar)))!important}
.panel.wide{max-width:min(560px,calc(100vw - 12px - var(--sal) - var(--sar)))!important}
#invPane .hb{grid-template-columns:repeat(9,minmax(0,1fr))!important;gap:4px!important}
#invPane .hb .gslot{height:auto!important;aspect-ratio:1;min-width:0}
.grid{grid-template-columns:repeat(auto-fill,minmax(min(48px,calc((100vw - 80px) / 6)),1fr))!important}
.gslot{min-width:0}
#hotbar{max-width:calc(100vw - 12px - var(--sal) - var(--sar))!important}
/* ---- mini Xbox controller ---- */
#touch{--u:clamp(44px,12.5vmin,58px);--by:calc(var(--slot) + 34px + var(--sab) + var(--statH,0px));--sx:calc(12px + var(--sal));--ex:calc(12px + var(--sar));--d:calc(var(--u) * .8);--st:calc(var(--u) * 2.2)}
body.padOn #touch{display:none!important}
body.touch #touch #acts{position:absolute!important;inset:0!important;width:auto!important;height:auto!important;bottom:0!important;pointer-events:none}
#touch .xb{position:absolute!important;box-sizing:border-box;width:var(--u)!important;height:var(--u)!important;border-radius:50%!important;padding:0!important;margin:0!important;
 background:rgba(6,7,9,.62)!important;border:2px solid var(--c,rgba(255,255,255,.55))!important;color:var(--c,#fff)!important;opacity:.38;font-size:calc(var(--u) * .42)!important;line-height:1!important;
 display:flex!important;align-items:center;justify-content:center;box-shadow:none!important;transform:none!important;filter:none!important;transition:opacity .08s,background-color .08s;touch-action:none;text-shadow:none!important;pointer-events:auto}
#touch .xb.prs,#touch .xb.on{opacity:.92;background:rgba(6,7,9,.82)!important}
#touch .xb.on{box-shadow:0 0 0 3px var(--c,#fff)!important}
#bJump.xb{--c:#6fd33f;right:calc(var(--ex) + var(--u) * .8)!important;bottom:var(--by)!important}
#bB.xb{--c:#ff5a4f;right:var(--ex)!important;bottom:calc(var(--by) + var(--u) * .8)!important}
#bCraft.xb{--c:#45a3ff;right:calc(var(--ex) + var(--u) * 1.6)!important;bottom:calc(var(--by) + var(--u) * .8)!important}
#bY.xb{--c:#f2c440;right:calc(var(--ex) + var(--u) * .8)!important;bottom:calc(var(--by) + var(--u) * 1.6)!important}
#touch .xb.sh{width:calc(var(--u) * 1.3)!important;height:calc(var(--u) * .74)!important;border-radius:calc(var(--u) * .3)!important;font-size:calc(var(--u) * .3)!important;--c:#e9e9e4;top:calc(58px + var(--sat))!important;bottom:auto!important}
#touch .xb.trig{border-radius:calc(var(--u) * .3) calc(var(--u) * .3) calc(var(--u) * .16) calc(var(--u) * .16)!important;height:calc(var(--u) * .86)!important}
#bPlace.xb{left:var(--sx)!important;right:auto!important}
#bLB.xb{left:calc(var(--sx) + var(--u) * 1.3 + 8px)!important;right:auto!important}
#bMine.xb{right:var(--ex)!important;left:auto!important}
#bRB.xb{right:calc(var(--ex) + var(--u) * 1.3 + 8px)!important;left:auto!important}
#touch .xb.dp{width:var(--d)!important;height:var(--d)!important;border-radius:22%!important;font-size:calc(var(--d) * .38)!important;--c:#e9e9e4;left:calc(var(--L0) + var(--dx) * var(--d))!important;bottom:calc(var(--B0) + var(--dy) * var(--d))!important;right:auto!important;top:auto!important}
#touch{--L0:calc(var(--sx) + var(--st) + var(--u) * .35);--B0:var(--by)}
#dU{--dx:1;--dy:2}#bDrop{--dx:1;--dy:0}#dL{--dx:0;--dy:1}#dR{--dx:2;--dy:1}
#touch .xb.sm{width:calc(var(--u) * .86)!important;height:calc(var(--u) * .58)!important;border-radius:calc(var(--u) * .29)!important;font-size:calc(var(--u) * .3)!important;--c:#e9e9e4;top:calc(8px + var(--sat))!important;bottom:auto!important;right:auto!important}
#bCam.xb{left:calc(50% - var(--u) * .86 - 6px)!important}
#bPause.xb{left:calc(50% + 6px)!important}
#bSprint.xb{width:calc(var(--u) * .74)!important;height:calc(var(--u) * .74)!important;font-size:calc(var(--u) * .26)!important;--c:#e9e9e4;left:calc(var(--sx) + var(--st) - var(--u) * .5)!important;bottom:calc(var(--by) + var(--st) - var(--u) * .3)!important;right:auto!important;top:auto!important}
#bSprint.xb.on{--c:#f2c440}
#bEat,#bDown{display:none!important}
#touch #stickBase{left:var(--sx)!important;bottom:var(--by)!important;width:var(--st)!important;height:var(--st)!important;opacity:.5;background:rgba(6,7,9,.45)!important;border:2px solid rgba(255,255,255,.4)!important}
#rStick{position:absolute;right:calc(var(--ex) + var(--u) * 2.75);bottom:var(--by);width:calc(var(--u) * 1.55);height:calc(var(--u) * 1.55);border-radius:50%;border:2px solid rgba(255,255,255,.32);background:radial-gradient(circle,rgba(255,255,255,.14) 0 34%,rgba(6,7,9,.4) 36%);opacity:.5;pointer-events:none;box-sizing:border-box}
#rStick b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:calc(var(--u) * .24);color:rgba(255,255,255,.7)}
body.touch:not(.inmenu) #fsBtn{top:calc(8px + var(--sat))!important;right:calc(10px + var(--sar))!important}
@media (orientation:portrait){
 #touch{--L0:calc(var(--sx) + (var(--st) - var(--d) * 3) / 2);--B0:calc(var(--by) + var(--st) + 16px)}
 #bSprint.xb{left:calc(var(--sx) + var(--st) + 6px)!important;bottom:var(--by)!important}
 #rStick{right:calc(var(--ex) + var(--u) * .52);bottom:calc(var(--by) + var(--u) * 2.75)}
}
@media (orientation:portrait) and (max-width:430px){
 #touch #bPause.xb.sm{left:auto!important;right:calc(58px + var(--sar))!important}
 #touch #bCam.xb.sm{left:auto!important;right:calc(64px + var(--sar) + var(--u) * .86)!important}
}
`;
  try { const th = document.getElementById('c128theme'); if (th) th.textContent += CSS; else { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); } } catch (e) { warn('css', e); }
  /* real visible size (address bar, keyboard) - never let the page scroll */
  try { const vv = window.visualViewport; const fit = () => { const h = vv ? vv.height : innerHeight; document.documentElement.style.setProperty('--vvh', Math.round(h) + 'px'); if (scrollX || scrollY) scrollTo(0, 0); const de = document.documentElement; if (de.scrollTop) de.scrollTop = 0; if (document.body.scrollTop) document.body.scrollTop = 0; if (de.scrollLeft) de.scrollLeft = 0; };
    fit(); if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); } addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 250)); addEventListener('scroll', fit, {passive: true}); C.fit = fit; } catch (e) { warn('vv', e); }
  /* touch pad */
  try {
    const acts = document.getElementById('acts'), touch = document.getElementById('touch'); if (!acts || !touch) return;
    const buzz = () => { if (navigator.vibrate) try { navigator.vibrate(12); } catch (_) {} };
    const live = () => typeof started !== 'undefined' && started && !dead && !paused && !menuOpen;
    const mk = (id, label, cls, tid) => { let b = document.getElementById(id); if (!b) { b = document.createElement('button'); b.id = id; acts.appendChild(b); } b.className = 'tbtn xb ' + (cls || ''); b.innerHTML = label; if (tid) b.dataset.testid = tid; return b; };
    const tap = (b, fn) => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); buzz(); try { fn(); } catch (er) { warn('btn', er); } });
    // existing buttons keep their own handlers (same as the controller already)
    mk('bJump', 'A', 'face'); mk('bMine', 'RT', 'sh trig'); mk('bPlace', 'LT', 'sh trig'); mk('bDrop', '&#9660;', 'dp'); mk('bCam', 'View', 'sm'); mk('bPause', 'Menu', 'sm'); mk('bSprint', 'LS', '');
    const bX = mk('bCraft', 'X', 'face');
    bX.addEventListener('pointerdown', e => { e.preventDefault(); e.stopImmediatePropagation(); buzz(); if (!live()) return;
      const gun = typeof GUN !== 'undefined' && GUN[selId] && cnt(selId) > 0; if (gun) { if (window.reloadGun) reloadGun(); } else { openMenu(true); setTab('craft'); } }, true);
    tap(mk('bY', 'Y', 'face', 'touch-y-button'), () => { if (live()) { openMenu(true); setTab('char'); } });
    const bB = mk('bB', 'B', 'face', 'touch-b-button');
    bB.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); buzz(); sneakHeld = true; bB.classList.add('prs'); try { bB.setPointerCapture(e.pointerId); } catch (_) {} });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) bB.addEventListener(ev, () => { sneakHeld = false; bB.classList.remove('prs'); });
    tap(mk('bLB', 'LB', 'sh', 'touch-lb-button'), () => { if (live()) cycleSel(-1); });
    tap(mk('bRB', 'RB', 'sh', 'touch-rb-button'), () => { if (live()) cycleSel(1); });
    tap(mk('dU', '&#9650;', 'dp', 'touch-dpad-up'), () => { if (live()) toggleCamera(); });
    tap(mk('dL', '&#9664;', 'dp', 'touch-dpad-left'), () => { if (live() && window.swapHands) swapHands(); });
    tap(mk('dR', '&#9654;', 'dp', 'touch-dpad-right'), () => { if (live()) cycleSel(1); });
    if (!document.getElementById('rStick')) { const r = document.createElement('div'); r.id = 'rStick'; r.innerHTML = '<b>LOOK</b>'; touch.insertBefore(r, acts); }
    // press feedback on every face
    touch.addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('.xb'); if (b) b.classList.add('prs'); }, true);
    const up = e => { const b = e.target.closest && e.target.closest('.xb'); if (b && b.id !== 'bB') b.classList.remove('prs'); };
    touch.addEventListener('pointerup', up, true); touch.addEventListener('pointercancel', up, true);
    addEventListener('pointerup', () => document.querySelectorAll('#touch .xb.prs').forEach(b => { if (b.id !== 'bB') b.classList.remove('prs'); }));
    C.ok = true;
  } catch (e) { warn('pad', e); }
})();
