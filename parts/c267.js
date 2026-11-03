/* GLX-C267 (v1.0.82): the saucer visits on the first night. Before this it could only spawn while you stood in a desert at night
   (desert-only timer in c243 plus the night gate in c260), so most nights it never came. Until the encounter is finished it now
   arrives 20-45 s into any night, anywhere; it retries every few seconds if it could not spawn. */
(function () {
  const U = window.__c267 = {err: null, t: 0, due: 20 + Math.random() * 25, tries: 0, spawns: 0};
  const night = () => (typeof isNight !== 'undefined' && isNight) || (typeof daylight === 'number' && daylight < 0.3);
  const met = () => { try { return !!((window.__c246b && (__c246b.done || __c246b.on)) || (current && localStorage.getItem('glen_met_' + current.id))); } catch (_) { return false; } };
  let last = performance.now();
  setInterval(() => { try { const now = performance.now(), dt = Math.min(2, (now - last) / 1000); last = now;
    const C = window.__c246; if (!C || !started || paused || dead) return;
    if (!night()) { U.t = 0; return; } if (met() || C.ufo()) return;
    if ((U.t += dt) < U.due) return;
    U.tries++; if (C.spawn()) { U.spawns++; U.t = 0; U.due = 9e9; } else U.due = U.t + 5;
  } catch (e) { U.err = String(e); } }, 1000);
  try { const ew = enterWorld; enterWorld = function () { try { U.t = 0; U.due = 20 + Math.random() * 25; } catch (_) {} return ew.apply(this, arguments); }; } catch (e) { U.err = String(e); }
})();
