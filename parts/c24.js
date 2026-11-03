
/* ===================== GLX-H1 (v0.9.24): robust Backrooms doorways (any painting, any save), Return-to-overworld, safe arrival ===================== */
(function () { const s = serialize; serialize = function () { const d = s.apply(this, arguments); if (DIM.cur === 'backrooms') d.brv = 2; return d; }; })();
// rebuild the arrival hall + its exit doorway from the pure layout, every time you arrive (old or damaged saves can't strand you)
function brStampArrival() {
  if (DIM.cur !== 'backrooms' || W !== BR_P * 2) return;
  const [ax, az] = BR_ARR;
  for (let x = ax - 7; x <= ax + 7; x++) for (let z = az - 10; z <= az + 4; z++) for (let y = 0; y < 8; y++) world[idx(x, y, z)] = brBlockAt(x, y, z);
  for (let x = ax - 2; x <= ax + 2; x++) for (let z = az - 4; z <= az - 1; z++) for (let y = 2; y < 6; y++) world[idx(x, y, z)] = 0;   // an open landing in front of the door
  for (let y = 2; y < 6; y++) world[idx(ax, y, az)] = T.BRWALL; world[idx(ax, 2, az)] = T.PAINTB; world[idx(ax, 3, az)] = T.PAINTB;
  for (let x = ax - 7; x <= ax + 7; x += CH) for (let z = az - 10; z <= az + 4; z += CH) markDirty(x, z); markDirty(ax + 7, az + 4); markDirty(ax - 7, az - 10); markDirty(ax + 7, az - 10); markDirty(ax - 7, az + 4);
}
// find a standable spot near (x, y, z): never inside walls, never under the floor
function safeLand(x, y, z) {
  const fx = Math.floor(x), fz = Math.floor(z), ok = yy => yy >= 1 && yy < H - 2 && !solid(fx, yy, fz) && !solid(fx, yy + 1, fz) && solid(fx, yy - 1, fz);
  const y0 = Math.floor(y + 0.01); for (const d of [0, 1, -1, 2, -2, 3, 4, -3, 5, 6]) if (ok(y0 + d)) return y0 + d;
  return null;
}
function brSafeArrival() {
  if (DIM.cur !== 'backrooms') return;
  brStampArrival();
  const [ax, az] = BR_ARR, inHall = Math.abs(P.x - ax - .5) < 6 && P.z > az - 9 && P.z < az;
  if (!inHall || safeLand(P.x, P.y, P.z) === null) { P.x = ax + 0.5; P.z = az - 1.5; P.yaw = 0; }
  P.y = safeLand(P.x, 2, P.z) || 2; P.vy = 0; P.fallTop = null;
}
function owSafeArrival() { if (DIM.cur) return; const y = safeLand(P.x, P.y, P.z); if (y !== null) P.y = y; else if (typeof safeTeleport === 'function') try { safeTeleport(P.x, P.z); } catch (_) {} P.vy = 0; P.fallTop = null; }
(function () {
  // every way in ends at the stamped hall; every way out lands on solid ground
  const ct = crossTo;
  crossTo = function (src, isEnter) {
    if (!isEnter && !DIM.linkFrame) { exitDim(); return; }
    const was = DIM.cur;
    try { ct.apply(this, arguments); }
    catch (e) { console.warn('doorway', e); toast('Doorway error: ' + (e && e.message || e)); if (was === null && DIM.cur === 'backrooms' && W !== BR_P * 2) { DIM.cur = null; } }
    if (DIM.cur === 'backrooms') { brSafeArrival(); dirtyAll = true; rebuild(30); }
    else owSafeArrival();
  };
  const ed = enterDim;
  enterDim = async function (name) { const r = await ed.apply(this, arguments); if (DIM.cur === 'backrooms') { brSafeArrival(); dirtyAll = true; rebuild(); } return r; };
  const ex = exitDim;
  exitDim = async function () {
    if (DIM.cur && !DIM.ow) {   // lost the parked overworld (e.g. reloaded mid-trip): fetch it from storage
      let d = null; try { d = await idbGet('worlds', current.id); } catch (_) {}
      if (!d || !d.world) try { d = JSON.parse(localStorage.getItem('glen_w_' + current.id) || 'null'); } catch (_) {}
      if (!d || !d.world) { toast('Could not find your overworld save'); return; }
      DIM.ow = d;
    }
    const r = await ex.apply(this, arguments); owSafeArrival(); return r;
  };
  // using (tapping) a painting goes through the same doorway code as walking through it
  window.paintUse = function (hit) {
    const f = paintFrame(hit[0], hit[1], hit[2], P.x, P.z);
    if (DIM.cur === 'backrooms') { if (f && DIM.ow && DIM.linkFrame) { P.x = f.o.x + f.n[0] * 0.8; P.z = f.o.z + f.n[1] * 0.8; P.y = f.y; crossTo(f, false); } else exitDim(); return; }
    if (DIM.cur) return;
    if (!f) { DIM.link = hit.slice(); enterDim('backrooms', genBackrooms, spawnBackrooms); return; }
    P.x = f.o.x + f.n[0] * 0.8; P.z = f.o.z + f.n[1] * 0.8; P.y = f.y; P.yaw = f.yaw; crossTo(f, true); if (DIM.cur === "backrooms") P.yaw += Math.PI;
  };
  // old single-block paintings grow into proper 1 x 2 doorways when you come near
  const sp = scanPortals;
  scanPortals = function () {
    if (!DIM.cur || DIM.cur === 'backrooms') { const x0 = Math.floor(P.x), y0 = Math.floor(P.y), z0 = Math.floor(P.z);
      for (let x = Math.max(0, x0 - 10); x < Math.min(W, x0 + 10); x++) for (let z = Math.max(0, z0 - 10); z < Math.min(D, z0 + 10); z++) for (let y = Math.max(2, y0 - 3); y < Math.min(H - 2, y0 + 4); y++) {
        if (world[idx(x, y, z)] !== T.PAINTB || world[idx(x, y + 1, z)] === T.PAINTB || world[idx(x, y - 1, z)] === T.PAINTB) continue;
        if (world[idx(x, y - 1, z)] === T.AIR && solid(x, y - 2, z)) world[idx(x, y - 1, z)] = T.PAINTB; else if (world[idx(x, y + 1, z)] === T.AIR) world[idx(x, y + 1, z)] = T.PAINTB; else continue;
        markDirty(x, z); } }
    return sp.apply(this, arguments);
  };
})();
// pause menu: Return to overworld (shown whenever you're in another dimension)
(function () {
  const rt = $('resetTerrainBtn'); if (!rt) return;
  const b = document.createElement('button'); b.className = 'btn'; b.id = 'returnOwBtn'; b.setAttribute('data-testid', 'pause-returnOwBtn'); b.textContent = 'Return to overworld'; b.style.display = 'none';
  b.onclick = () => { try { setPause(false); } catch (_) {} exitDim(); };
  rt.parentNode.insertBefore(b, rt.parentNode.firstChild);
  setInterval(() => { const on = !!DIM.cur; if ((b.style.display !== 'none') !== on) b.style.display = on ? '' : 'none'; }, 500);
})();
