(function c317c() { const U = window.__c317;
  try { const se = serialize; serialize = function () { const o = se.apply(this, arguments); try { if (o && !(window.__c299 && __c299.on) && !DIM.cur && U.on() && !(window.__c309 && __c309.on) && !U.foot(P.x, P.z) || (o && !DIM.cur && U.on() && (P.y < -2 || P.y > H + 60))) o.c317 = {p: [P.x, P.y, P.z]}; } catch (_) {} return o; }; } catch (e) { U.err = U.err || 'ser ' + e; }
  try { const ew = enterWorld; enterWorld = function (save) {
    const q = save && save.c317 && save.c317.p, gen = window.__c105 && __c105.phase === 'gen';
    // Existing C317 formula and ordinary dimensions guard; no new coordinates.
    const restore=U.restoreSavePosition=()=>{ if (!q || gen || !q.every(isFinite) || !U.on()) return false;
      if (!(typeof current!=='undefined' && current && current.mode && typeof W!=='undefined' && !DIM.cur)) return false;
      P.x=q[0];P.y=q[1]+0.05;P.z=q[2];P.vy=0;P.fallTop=null;U.soft=true;return true;};
    const r = ew.apply(this, arguments);
    // Normal C321 world-frame restoration remains exactly in its own wrapper. The
    // new loader only asks this helper for an actual flat-world saved cave once.
    // C321's original reset precedes applySave; no new frame operation is needed here.
    // The later timer restores exactly the same saved point on normal saved loads.
    try { if (q && !gen && q.every(isFinite)) { let n = 0; const iv = setInterval(() => { if (++n > 60) clearInterval(iv); if (typeof started === 'undefined' || !started || !U.on()) return; clearInterval(iv); restore(); }, 100); } } catch (e) { U.err = U.err || 'ew ' + e; } return r; }; } catch (e) { U.err = U.err || 'ew0 ' + e; } })();
