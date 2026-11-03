/* GLX-C301 (v1.0.108): responsive menus - every panel, dialog and the HUD fit phones in portrait and landscape and desktop:
   flexible widths, heights capped to the visible screen (dvh), scrolling inside instead of cutting off, tab buttons that shrink to fit. */
(function c301() {
  const st = document.createElement('style'); st.textContent = `
.panel{max-width:96vw!important;max-height:94vh!important;max-height:94dvh!important;box-sizing:border-box!important;overflow-y:auto;overscroll-behavior:contain}
#craft .panel{overflow:hidden}
#craft .panel>.tabs{display:flex!important;flex-wrap:nowrap!important;width:100%}
#craft .panel>.tabs>button{flex:1 1 0!important;min-width:0!important;padding:4px 6px!important;font-size:clamp(11px,3.1vw,14px)!important;white-space:normal!important;line-height:1.1}
#craft #invPane,#craft #charTab,#craft #craftTab,#craft #recipes,#craft #recGrid{min-width:0}
#craft #charTab{overflow-y:auto!important}
#pause .panel .btns[style*="none"]{display:none!important}
#pause .panel{width:min(560px,96vw)!important}
#pause .panel .btn{min-width:0!important}
#setTabs{display:flex!important;flex-wrap:wrap!important;gap:6px}
#setTabs>button{flex:1 1 auto!important;min-width:0!important}
img,canvas.ui{max-width:100%}
@media (orientation:portrait){#craft .panel{width:96vw!important;height:92vh!important;height:92dvh!important}#craft #charTab{flex-direction:column!important}#craft #charView{min-height:200px}}
@media (max-height:460px){.panel{padding:8px 10px!important}#pause .panel .btn{padding-top:6px!important;padding-bottom:6px!important}}`;
  document.head.appendChild(st);
})();
