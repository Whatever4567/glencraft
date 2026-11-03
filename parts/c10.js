
/* ===================== GLX-E1 (v0.9.10): builds survive Reset Terrain, Teleport to my builds, Restore backup list ===================== */
var buildAreas = null;
function solidTop(x, z) {   // highest natural/solid block, ignoring trees and plants
  for (let y = H - 2; y > 0; y--) { const b = getB(x, y, z); if (b !== T.AIR && b !== T.LEAVES && b !== T.LOG && b !== T.WATER && !PLANT[b]) return y; }
  return 1;
}
(function () {
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); if (buildAreas) d.buildAreas = buildAreas; return d; };
  const ap = applySave; applySave = function (d) { buildAreas = (d && d.buildAreas) || null; return ap.apply(this, arguments); };
})();
// find the player's builds by scanning for player-made blocks (works on any save, including ones reset before this fix)
function scanBuilds() {
  const B = g9BuiltSet(), CS = 8, gx = Math.ceil(W / CS), gz = Math.ceil(D / CS), cnt = new Map(), ys = new Map();
  for (let x = 0; x < W; x++) for (let y = 1; y < H; y++) { const base = (x * H + y) * D; for (let z = 0; z < D; z++) { const b = world[base + z]; if (b && B[b] && b !== T.TORCH) { const c = Math.floor(x / CS) * gz + Math.floor(z / CS); cnt.set(c, (cnt.get(c) || 0) + 1); ys.set(c, (ys.get(c) || 0) + y); } } }
  // castles and the city are made of the same blocks: skip cells near generated castles
  const cs = (typeof g9castles !== 'undefined' && g9castles) || [];
  const seen = new Set(), out = [];
  for (const [c] of cnt) if (!seen.has(c)) {
    const st = [c]; seen.add(c); let n = 0, sx = 0, sz = 0, sy = 0;
    while (st.length) { const q = st.pop(), a = Math.floor(q / gz), b = q % gz, k = cnt.get(q); n += k; sx += (a * CS + 4) * k; sz += (b * CS + 4) * k; sy += ys.get(q);
      for (let da = -1; da <= 1; da++) for (let db = -1; db <= 1; db++) { const r = (a + da) * gz + (b + db); if (cnt.has(r) && !seen.has(r)) { seen.add(r); st.push(r); } } }
    if (n < 12) continue;
    const x = Math.round(sx / n), z = Math.round(sz / n), y = Math.round(sy / n);
    if (cs.some(cc => Math.hypot(cc[1] - x, cc[2] - z) < 34)) continue;
    out.push([x, y, z, n]);
  }
  return out.sort((a, b) => b[3] - a[3]).slice(0, 12);
}
function safeTeleport(x, y, z) {
  // stand on the highest free spot in this column near the build's height (inside a house is fine)
  let best = null;
  for (let r = 0; r < 6 && !best; r++) for (let a = 0; a < 8 && !best; a++) {
    const px = Math.round(x + Math.cos(a * 0.785) * r * 2), pz = Math.round(z + Math.sin(a * 0.785) * r * 2);
    for (let yy = Math.min(H - 3, y + 10); yy > Math.max(1, y - 12); yy--) { const g = getB(px, yy - 1, pz); if (g !== T.AIR && g !== T.WATER && !PLANT[g] && getB(px, yy, pz) === T.AIR && getB(px, yy + 1, pz) === T.AIR) { best = [px + 0.5, yy, pz + 0.5]; break; } }
  }
  if (!best) best = [x + 0.5, solidTop(x, z) + 1, z + 0.5];
  P.x = best[0]; P.y = best[1]; P.z = best[2]; P.vy = 0; P.fallTop = null;
  typeof updateStreaming === 'function' && updateStreaming(); dirtyAll = true;
}
function glxModal(title, items) {   // items: [{label, sub, fn}]
  const old = document.getElementById('glxModal'); if (old) old.remove();
  const el = document.createElement('div'); el.id = 'glxModal';
  el.style.cssText = 'position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;font:15px system-ui,sans-serif';
  const box = document.createElement('div'); box.style.cssText = 'background:#1d261f;color:#f3ead2;border:2px solid #d9b45a;border-radius:14px;padding:16px;max-width:min(520px,92vw);max-height:80vh;overflow:auto';
  box.innerHTML = '<b style="font-size:18px;color:#ffd77a">' + title + '</b>';
  const close = () => el.remove();
  items.concat([{label: 'Close', fn: close}]).forEach((it, i) => {
    const b = document.createElement('button'); b.className = 'btn' + (it.label === 'Close' ? ' alt' : ''); b.style.cssText = 'display:block;width:100%;margin-top:8px;text-align:left';
    b.innerHTML = it.label + (it.sub ? '<br><small style="opacity:.75">' + it.sub + '</small>' : ''); b.onclick = () => { if (it.label !== 'Close') close(); it.fn(); };
    b.setAttribute('data-testid', 'glx-modal-item-' + i); box.appendChild(b);
  });
  if (!items.length) { const p = document.createElement('p'); p.textContent = 'Nothing found.'; box.insertBefore(p, box.lastChild); }
  el.appendChild(box); document.body.appendChild(el);
  setTimeout(() => { const f = box.querySelector('button'); f && f.focus(); }, 30);
  return el;
}
function openTeleportMenu() {
  const list = []; const seen = [];
  (buildAreas || []).forEach(a => { seen.push(a); list.push(a.concat(['saved'])); });
  for (const a of scanBuilds()) if (!seen.some(s => Math.hypot(s[0] - a[0], s[2] - a[2]) < 16)) list.push(a.concat(['found']));
  glxModal('Teleport to my builds', list.map((a, i) => ({label: 'Build ' + (i + 1) + ' \u2022 ' + a[3] + ' blocks', sub: 'at ' + a[0] + ', ' + a[1] + ', ' + a[2] + ' \u2022 ' + Math.round(Math.hypot(a[0] - P.x, a[2] - P.z)) + ' m away',
    fn: () => { safeTeleport(a[0], a[1], a[2]); try { setPause(false); } catch (_) {} toast('Teleported to build ' + (i + 1)); }})));
}
async function openBackupMenu() {
  if (!current) return;
  let keys = []; try { keys = await idbDo('worlds', 'readonly', o => o.getAllKeys()); } catch (_) {}
  keys = (keys || []).filter(k => typeof k === 'string' && k.indexOf('backup_' + current.id) === 0);
  const rows = [];
  for (const k of keys) { const d = await idbGet('worlds', k); if (d) rows.push({k, t: d.backedUp || d.updated || 0, why: /_reset_island/.test(k) ? 'before island move' : /_reset_/.test(k) ? 'before terrain reset' : /_g10_/.test(k) ? 'before Highlands move' : /_g\d+_/.test(k) ? 'before world upgrade' : 'backup'}); }
  rows.sort((a, b) => b.t - a.t);
  glxModal('Restore backup', rows.map(r => ({label: new Date(r.t).toLocaleString(), sub: r.why, fn: async () => {
    if (!confirm('Restore "' + current.name + '" to this backup? (Your current world is backed up first.)')) return;
    const now = serialize(); try { await idbPut('worlds', 'backup_' + current.id + '_prerestore_' + Date.now().toString(36), Object.assign({}, now, {backupOf: current.id, backedUp: Date.now()})); } catch (_) {}
    const d = await idbGet('worlds', r.k); if (!d) { toast('Backup not found'); return; }
    const c = Object.assign({}, d); delete c.backupOf; delete c.backedUp; c.noMigrate = true; if (!c.island) c.noIsland = 1;
    await idbPut('worlds', current.id, c); try { localStorage.removeItem('glen_w_' + current.id); } catch (_) {}
    toast('Restored. Reopening the world...'); try { setPause(false); } catch (_) {} started = false; setTimeout(() => enterWorld(c), 50);
  }})));
}
(function pauseButtons() {
  const rt = $('resetTerrainBtn'); if (!rt) return;
  const mk = (id, txt, fn) => { const b = document.createElement('button'); b.className = 'btn alt'; b.id = id; b.setAttribute('data-testid', 'pause-' + id); b.textContent = txt; b.onclick = fn; return b; };
  const t = mk('teleportBuildsBtn', 'Teleport to my builds', openTeleportMenu), r = mk('restoreBackupBtn', 'Restore backup\u2026', openBackupMenu);
  rt.parentNode.insertBefore(t, rt); rt.parentNode.insertBefore(r, rt.nextSibling);
})();
