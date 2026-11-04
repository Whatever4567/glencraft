/* GLX-AGR (v1.1.84): THE ORIGINAL AGARTHA IS BACK. The crystal city in its great cavern under its own sky, with the tall Agarthans
   (light blue clothes, blond hair, big glowing blue eyes), its own glowing inner sun, haze and drifting sparkles, and the long overgrown
   tube tunnel that leads to it. The way in is where the saucer lives: a snowy island with a spiral cave that winds down to a glowing pad.
   Stand on the pad and you arrive at the big tube tunnel entrance. The Agartha teleport (and the time box) takes you to the same spot.
   Walk back out of the tunnel mouth to come home to the island. The dark rock city from the hollow Earth is gone. */
(function agr() {
  const U = window.__agr = {err: null, went: 0, back: 0, pad: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const A = () => window.__c294, D = () => window.__dw;
  let busy = false, was = null;
  function spawnAg() { const g = A().AG; P.x = g.CX + 0.5; P.z = 10.5; P.y = 13.05; P.yaw = Math.PI; P.pitch = 0; P.vy = 0; P.fallTop = null; }
  async function go() { if (busy) return false; if (DIM.cur === 'agartha') { spawnAg(); return true; } if (DIM.cur) { try { toast('Go back to the overworld first'); } catch (_) {} return false; }
    const a = A(); if (!a || !a.genAg || typeof enterDim !== 'function') return false; busy = true;
    try { try { if (window.__c309 && __c309.on) __c309.on = false; } catch (_) {} try { if (window.__c321 && __c321.on && __c321.on()) __c321.leave(); } catch (_) {}
      await enterDim('agartha', a.genAg, spawnAg); if (DIM.cur === 'agartha') { spawnAg(); U.went++; try { dirtyAll = true; } catch (_) {} try { toast('Agartha: the great tube tunnel'); } catch (_) {} } }
    catch (e) { ERR('go', e); } finally { busy = false; } return DIM.cur === 'agartha'; }
  U.go = go; U.spawnAg = spawnAg;
  function home() { const p = D() && D().PO; if (!p) return; P.x = p.x + 13.5; P.z = p.z + 0.5; P.y = p.top + 0.05; P.vy = 0; P.fallTop = null; U.back++; try { toast('Back on the snowy island'); } catch (_) {} }
  U.home = home;
  setInterval(() => { try { if (typeof started === 'undefined' || !started) return; const cur = DIM.cur || null;
      was = cur;
      if (cur === 'agartha' && P.z < 4 && !busy && !DIM.busy && !paused && !dead) { busy = true; Promise.resolve(exitDim()).then(() => { busy = false; was = null; home(); }).catch(e => { busy = false; ERR('exit', e); }); return; }
      if (cur || paused || dead || busy) { U.pad = 0; return; } const d = D(); if (!d || !d.PO) return; const p = d.PO, ex = p.x + 8 * Math.cos(4 * Math.PI), ez = p.z + 8 * Math.sin(4 * Math.PI), fy = p.top - 1 - 34 - 3.3 + 1;
      if (Math.hypot(P.x - ex, P.z - ez) < 2.4 && Math.abs(P.y - fy) < 2.5) { U.pad++; if (U.pad === 5) go(); } else U.pad = 0; } catch (e) { ERR('tick', e); } }, 200);
})();
