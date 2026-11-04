/* GLX-C337 (v1.1.38): GREAT BRITAIN ROUND GLENCRAFT, NO OLD ICE WALL, AND AN AGARTHA TELEPORT.
   1. The real world map is magnified round Glencraft (four times at the middle, easing back to true scale far away), so Glencraft
      sits inside a Scotland you can recognise from the air, with the Highlands, the west coast, the Hebrides and Orkney, England to
      the south and Ireland to the west. Natural Earth outline, public domain.
   2. The old ice wall round the map is gone, in new worlds and old saves (converted once on load). Blocks you placed are kept. The
      ice wall is only the planet wide ring now.
   3. Teleport has an Agartha button that lands you on the city floor beside the lift pad. */
(function c337() {
  const U = window.__c337 = {err: null, cleared: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  // ---------- 1. magnified Britain ----------
  const M = 4, A1 = 0.75;   // magnification at the middle, and the angle (radians) where the map is back to true scale
  if (window.__c329) try { const W9 = window.__c329, ll0 = W9.ll; let n0 = null, nk = '';
    W9.ll = function (nx, ny, nz) { try { const k = W + ',' + D; if (k !== nk) { nk = k; const R = __c320.R, v = [0, R - 250, 750], l = Math.hypot(v[0], v[1], v[2]); n0 = [v[0] / l, v[1] / l, v[2] / l]; }
        const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; const c = Math.max(-1, Math.min(1, nx * n0[0] + ny * n0[1] + nz * n0[2])), a = Math.acos(c);
        if (a < A1 && a > 1e-6) { const t = a / A1, a2 = A1 * (t / M + (1 - 1 / M) * t * t * t), s = Math.sin(a);
          const ux = (nx - n0[0] * c) / s, uy = (ny - n0[1] * c) / s, uz = (nz - n0[2] * c) / s, c2 = Math.cos(a2), s2 = Math.sin(a2);
          nx = n0[0] * c2 + ux * s2; ny = n0[1] * c2 + uy * s2; nz = n0[2] * c2 + uz * s2; }
        // turn the island direction onto Scotland (the middle of the old map frame)
        const cs = n0[1], sn = n0[2]; return ll0(nx, ny * cs + nz * sn, -ny * sn + nz * cs); } catch (e) { ERR('ll', e); } return ll0(nx, ny, nz); };
  } catch (e) { ERR('ll0', e); }
  // ---------- 2. the old ice wall goes ----------
  function clearWall() { if (window.__c341) return 0; const A = window.__c273; if (!A || !A.edgeQ || !A.RE || (A.on && !A.on())) return 0; const RE = A.RE(), WS = A.WS || 40, SN = new Set([T.PACKSNOW, T.SNOW, T.ICE, T.PACKEDICE, T.STONE, 178].filter(Boolean));
    let n = 0; const placed = i => { try { return typeof placedSet !== 'undefined' && placedSet.has(i); } catch (_) { return false; } };
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { const q = A.edgeQ(x, z); if (q < RE - WS - 8) continue; const col = x * H * D + z;
      if (q < RE - WS) { for (let y = H - 2; y > SEA; y--) { const i = col + y * D, b = world[i]; if (!b) continue; if (b === T.PACKSNOW && !placed(i)) { world[i] = T.GRASS; n++; } break; } continue; }
      // the wall band (v1.1.39): open sea with a sand bed, so the map edge meets the real sea and land round it with no flat green ring
      for (let y = H - 2; y >= SEA - 4; y--) { const i = col + y * D, b = world[i]; if (placed(i)) continue;
        const want = y > SEA ? 0 : y > SEA - 4 ? T.WATER : T.SAND; if (b !== want && (y > SEA - 4 || !b || b === T.GRASS || b === T.DIRT || SN.has(b))) { world[i] = want; n++; } }
      try { g9cols[(x * D + z) * 2] = SEA - 3; } catch (_) {} }
    return n; }
  let lastW = null;
  setInterval(() => { try { if (typeof started === 'undefined' || !started || DIM.cur || typeof current === 'undefined' || !current || world === lastW) return; lastW = world;
      const key = 'glx339w:' + current.id; if (localStorage.getItem(key)) return; const n = clearWall(); U.cleared = n; localStorage.setItem(key, '1');
      if (n) { try { dirtyAll = true; } catch (_) {} try { const E = __c320; E.edgeClr && E.edgeClr(); E.dirty = 1; } catch (_) {} if (window.__c324 && __c324.cache) __c324.cache.clear(); } } catch (e) { ERR('wall', e); } }, 1000);
  try { const A = window.__c273; if (A && A.wallTop) A.wallTop = () => SEA - 4; } catch (_) {}
  // ---------- 3. Agartha teleport ----------
  function goAgartha() { try { if (DIM.cur) { toast('Go back to the overworld first'); return; } if (!(window.__c317 && __c317.on()) || !window.__c332 || !__c332.SH()) { toast('Agartha is not in this world. Reset world to get the big map'); return; }
      try { if (window.__c309 && __c309.on) __c309.on = false; } catch (_) {} window.__spaceHud = null; if (__c332.toCity()) { try { setPause(false); } catch (_) {} const ov = document.querySelector('[data-testid=tp-x]'); if (ov) ov.parentNode.parentNode.style.display = 'none'; toast('Agartha'); } } catch (e) { ERR('tp', e); } }
  U.go = goAgartha;
  const add = () => { const x = document.querySelector('[data-testid=tp-x]'); if (!x || document.querySelector('[data-testid=tp-agartha]')) return !!x; const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Agartha'; b.dataset.testid = 'tp-agartha'; b.style.cssText = x.style.cssText.replace(/alt/, '');
    b.addEventListener('click', e => { e.preventDefault(); goAgartha(); }); x.parentNode.insertBefore(b, x); return true; };
  if (!add()) { const iv = setInterval(() => { if (add()) clearInterval(iv); }, 1000); }
})();
