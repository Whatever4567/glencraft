/* GLX-CAB1222 (v1.2.22): time box cabin.
   1. Flying up and down: the flight code moves you with the box after the camera was already placed for the frame, so the camera was one
      frame behind the room and shook against it in any climb or drop. The camera is placed again after the box moves, with no bob.
   2. Letting go of the stick in the air: the box hovered at part of a block, the cabin floor collision sits on whole blocks, so you sank,
      got pushed back up and could not jump. On letting go the box settles to the nearest whole block (you move with it), so the floor is
      real ground: walk and jump normally. You are only held in the seat while you steer.
   3. Blocks inside the cabin: the room has no block storage of its own, so a block placed or mined in the room went into the outside world
      under the box. That is now stopped with a message; nothing is written outside. */
(function cab1222() {
  const T = window.__tbox, F = () => window.__tbox3; if (!T) return;
  const U = window.__cab1222 = {err: null, cam: 0, settles: 0, blocked: 0, lastDy: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const pil = () => { const f = F(); return !!(f && f.pilot && T.inside); };
  U.inRoom = (x, y, z) => { const S = T.S; if (!S || !S.on || !T.inside) return false; const CZ = T.HW - T.RR, dx = x + 0.5 - S.x, dz = z + 0.5 - (S.z + CZ), fy = Math.floor(S.y + 0.01);
    return dx * dx + dz * dz < (T.RR + 0.6) * (T.RR + 0.6) && z + 0.5 < S.z + T.HW + 0.2 && y >= fy - 1 && y < fy + 9; };
  let was = false;
  U.settle = () => { const S = T.S; if (!S || !S.on || !T.inside) return false; const ty = Math.round(S.y), dy = ty - S.y; if (Math.abs(dy) < 1e-6) return false;
    for (let y = ty; y < ty + 3; y++) { T.__raw = 1; let hit = false; try { hit = solid(Math.floor(S.x), y, Math.floor(S.z)); } finally { T.__raw = 0; } if (hit) return false; }
    const rx = P.x - S.x, ry = P.y - S.y, rz = P.z - S.z; T.place(S.x, ty, S.z); P.x = S.x + rx; P.y = S.y + Math.max(0, ry); P.z = S.z + rz; P.vy = 0; P.fallTop = null; U.settles++; U.lastDy = dy; return true; };
  try { const up = updatePlayer; updatePlayer = function () { const r = up.apply(this, arguments); try { const on = pil();
        if (on) { placeCamera(0, 0, 0, 0); U.cam++; }
        else if (was) U.settle();
        was = on; } catch (e) { ERR('up', e); } return r; }; } catch (e) { ERR('upw', e); }
  const deny = () => { U.blocked++; try { toast('Blocks cannot be placed or mined inside the time box yet'); } catch (_) {} };
  try { const ui = useItem; useItem = function () { try { if (T.inside && T.S && T.S.on && !pil()) { const id = selId; if (PLACEABLE.has(id) && cnt(id) > 0) { const r = raycast(5); const c = r && (r.prev || r.hit); if (c && U.inRoom(c[0], c[1], c[2])) { deny(); return; } } } } catch (e) { ERR('ui', e); } return ui.apply(this, arguments); }; } catch (e) { ERR('uiw', e); }
  try { const cm = canMine; canMine = function (b, y) { try { if (T.inside && T.S && T.S.on) { const r = raycast(5); if (r && r.hit[1] === y && U.inRoom(r.hit[0], r.hit[1], r.hit[2])) { if (!U._mw || performance.now() - U._mw > 3000) { U._mw = performance.now(); deny(); } return false; } } } catch (e) { ERR('cm', e); } return cm.apply(this, arguments); }; } catch (e) { ERR('cmw', e); }
})();
