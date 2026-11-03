/* GLX-C253 (v1.0.65): new main menu - full-width golden-brown GLENCRAFT logo at the top, just Play + Settings stacked on the left,
   and a slow crossfading slideshow of the player's own pictures behind (first loads at once, the rest lazily). Patch notes live in Settings. */
(() => {
  const U = window.__c253 = {err: null, shown: 0, loaded: 0};
  try {
    const scr = $('scr-title'); scr.classList.add('m65');
    const ss = document.createElement('div'); ss.id = 'm65ss'; ss.setAttribute('data-testid', 'menu-slideshow'); scr.insertBefore(ss, scr.firstChild);
    const sh = document.createElement('div'); sh.id = 'm65sh'; scr.insertBefore(sh, ss.nextSibling);
    const N = 7, els = [];
    const load = i => { if (els[i]) return els[i]; const d = document.createElement('div'); d.className = 'm65i'; const im = new Image(); im.decoding = 'async';
      im.onload = () => { d.style.backgroundImage = 'url(' + im.src + ')'; d.dataset.ok = 1; U.loaded++; }; im.src = 'assets/menu/m' + (i + 1) + '.webp'; ss.appendChild(d); return els[i] = d; };
    let cur = 0; const first = load(0); first.classList.add('on'); U.shown = 1;
    let rest = false; const lazy = () => { if (rest) return; rest = true; for (let i = 1; i < N; i++) setTimeout(() => load(i), i * 600); };
    setInterval(() => { if (typeof screen !== 'undefined' && screen !== 'title' && screen !== 'boot') return; lazy(); const nx = (cur + 1) % N, e = load(nx); if (!e.dataset.ok) return;
      els[cur].classList.remove('on'); e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); cur = nx; U.shown++; }, 13000);
    setTimeout(lazy, 2500);
    // left column: Play + Settings (text)
    const play = $('playBtn'), set = $('setBtn'); play.innerHTML = 'Play'; set.innerHTML = 'Settings'; set.removeAttribute('aria-label');
    const col = scr.querySelector('.titlecol'); const box = document.createElement('div'); box.id = 'm65btns'; box.appendChild(play); box.appendChild(set); col.appendChild(box);
    const fit = () => { const ls = innerWidth > innerHeight; document.querySelectorAll('#scr-title .glogo svg, #scr-boot .glogo svg').forEach(s => s.setAttribute('preserveAspectRatio', ls ? 'none' : 'xMidYMin meet')); }; fit(); addEventListener('resize', fit);
  } catch (e) { U.err = String(e && e.message || e); }
})();
