/* ===================== GLX-C94 (v0.9.83): the normal world list again - many worlds on this device (IndexedDB 'glencraft-saves'), create / play / delete (with Yes / No).
   The v0.9.72 one-time wipe is gone for good (its flag is also set so no older copy of the code could ever run it); Test World is just a normal world now.
   On start, any world data still on the device that is not in the list (IndexedDB records, backup_ copies, localStorage glen_w_* copies) is put back in the list. ===================== */
(function c94() {
  const R = window.__c94 = {skipped: [], puts: 0, recovered: [], scan: null};
  try { if (!localStorage.getItem('gc_wipe_v0972')) localStorage.setItem('gc_wipe_v0972', 'never'); } catch (_) {}
  // ---- writes: worlds + their dimensions; no new backup_ copies (they used to fill the device) ----
  let lastPut = Promise.resolve();
  const base = idbDo;
  idbDo = function (store, mode, fn) {
    if (store === 'worlds' && mode === 'readwrite') {
      const f = fn;
      fn = o => f({put: (v, k) => { if (typeof k === 'string' && k.indexOf('backup_') === 0) { R.skipped.push(k); return null; } R.puts++; return o.put(v, k); },
        delete: k => o.delete(k), getAllKeys: () => o.getAllKeys(), getAll: () => o.getAll(), clear: () => o.clear(), get: k => o.get(k)});
      const p = base.call(this, store, mode, fn);
      const q = p.catch(e => { toast('Could not save the world: ' + ((e && e.message) || 'storage error')); throw e; });
      lastPut = q.catch(() => {}); q.catch(() => {}); return p;
    }
    return base.apply(this, arguments);
  };
  // ---- saving: IndexedDB only (no big localStorage copy) ----
  const sw = saveWorld;
  saveWorld = function () { const had = window.__autoSave; if (window.indexedDB) window.__autoSave = true; try { return sw.apply(this, arguments); } finally { window.__autoSave = had; } };
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#saveQuit'); if (!b) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (saveWorld()) { const t0 = performance.now(); Promise.race([lastPut.then(() => lastPut), new Promise(r => setTimeout(r, 15000))]).then(() => setTimeout(() => location.reload(), Math.max(0, 600 - (performance.now() - t0)))); }
  }, true);
  // ---- delete: the world, its dimensions and its little extras ----
  deleteWorld = function (id) {
    worldCache = worldList().filter(x => x.id !== id); writeIndex();
    idbDo('worlds', 'readwrite', o => { o.delete(id); const rq = o.openCursor(); rq.onsuccess = () => { const c = rq.result; if (!c) return; if (typeof c.key === 'string' && c.key.indexOf('dim_' + id + '_') === 0) c.delete(); c.continue(); }; }).catch(() => {});
    try { ['glen_w_', 'glen_mapx_', 'glen_tvpos_'].forEach(p => localStorage.removeItem(p + id)); } catch (_) {}
    if (screen === 'worlds') renderWorlds(); return true;
  };
  // ---- recovery scan: anything on the device that looks like a world but is not in the list ----
  const looks = d => d && typeof d === 'object' && typeof d.world === 'string' && d.world.length > 100;
  const entry = (id, d, extra) => Object.assign({id, name: d.name || 'Recovered world', mode: d.mode || 'survival', created: d.created || d.updated || Date.now(), updated: d.updated || Date.now(), day: d.dayNum || 1, gold: d.mode !== 'creative', v: SAVE_VER}, extra || {});
  R.scanP = worldsReady.catch(() => {}).then(async () => {
    const have = new Set(worldList().map(w => w.id)), found = [], st = {idbKeys: 0, backups: 0, ls: 0, dbs: null};
    try { const keys = await idbDo('worlds', 'readonly', o => o.getAllKeys()); st.idbKeys = (keys || []).length;
      for (const k of keys || []) { if (typeof k !== 'string' || k.indexOf('dim_') === 0 || have.has(k)) continue;
        const d = await idbGet('worlds', k); if (!looks(d)) continue;
        if (k.indexOf('backup_') === 0) { st.backups++; const of = d.backupOf || d.id; if (of && (have.has(of) || found.some(w => w.id === of))) continue;   // the world itself is still here
          const id = 'rec' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); d.id = id; d.name = (d.name || 'Recovered world') + ' (recovered)'; await base('worlds', 'readwrite', o => o.put(d, id)); found.push(entry(id, d, {recovered: 1})); }
        else found.push(entry(k, d, {recovered: 1})); have.add(k); } } catch (e) { st.err = String(e); }
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!/^glen_w_/.test(k)) continue; const id = k.slice(6); if (have.has(id)) continue;
        let d = null; try { d = JSON.parse(localStorage.getItem(k)); } catch (_) {} if (!looks(d)) continue; st.ls++;
        await base('worlds', 'readwrite', o => o.put(d, id)); found.push(entry(id, d, {recovered: 1})); have.add(id); } } catch (e) { st.err2 = String(e); }
    try { if (indexedDB.databases) st.dbs = (await indexedDB.databases()).map(d => d.name); } catch (_) {}
    R.scan = st; R.recovered = found.map(w => w.name);
    if (found.length) { worldCache = mergeLists(worldList(), found); await writeIndex(); toast(found.length + ' old world' + (found.length > 1 ? 's' : '') + ' found on this device and put back in your list'); if (screen === 'worlds') renderWorlds(); }
    console.log('[v0.9.83] world scan', JSON.stringify(st), R.recovered);
  });
  // ---- no more "one of everything" starter chests at spawn (a Test World leftover); untouched ones in old worlds are tidied away ----
  const ew = enterWorld;
  enterWorld = function (save) { if (!save && current) current.starterDone = true;
    const r = ew.apply(this, arguments);
    if (save) { const t = setInterval(() => { if (!started) return; clearInterval(t); try { tidyStarter(); } catch (e) { console.warn('starter tidy', e); } }, 500); }
    return r; };
  function tidyStarter() { if (DIM.cur || typeof starterItems !== 'function') return; const all = starterItems(); let n = 0;
    for (const [k, c] of [...chests]) { if (!c || !c.starter) continue; const [x, y, z] = k.split(',').map(Number);
      const want = all.findIndex(q => c.slots.some(s => s && s[0] === q[0])); if (want < 0) continue;   // emptied by you: leave it
      const i0 = Math.floor(want / 27) * 27, ref = all.slice(i0, i0 + 27);
      const same = ref.every((q, j) => c.slots[j] && c.slots[j][0] === q[0] && c.slots[j][1] === q[1]) && c.slots.slice(ref.length).every(s => !s);
      if (!same || world[idx(x, y, z)] !== T.CHEST || (placedSet && placedSet.has(idx(x, y, z)))) continue;
      world[idx(x, y, z)] = T.AIR; chests.delete(k); entMeta.delete(k); markDirty(x, z); n++; }
    R.starterRemoved = n; if (n) { try { rebuild(); } catch (_) {} } }
  R.tidyStarter = tidyStarter;
  // ---- world screen ----
  const st = document.createElement('style'); st.textContent = '#restoreTerrainBtn{display:none!important}.wrow{display:flex;gap:8px;align-items:stretch}.wrow .world{flex:1}.tile.del{flex:0 0 86px;min-height:0!important;padding:8px!important;background:linear-gradient(180deg,#8a2b2b,#5a1717)!important;color:#fff;justify-content:center}' +
    '#scr-confirm .titlecol{max-width:520px}#confirmTxt{font:700 20px system-ui,sans-serif;color:#fff;margin:18px 0;text-align:center}';
  document.head.appendChild(st);
  const nameIn = $('worldName'); if (nameIn) { nameIn.readOnly = false; nameIn.removeAttribute('aria-readonly'); nameIn.style.pointerEvents = ''; nameIn.style.opacity = ''; nameIn.value = 'New World'; }
  const note = document.querySelector('#scr-worlds .titlecol > div:nth-child(2)'); if (note) note.textContent = 'Your worlds are saved on this device. Make as many as you like.';
  // the Yes / No screen (D-pad + A work on it like every menu; B = No)
  const cs = document.createElement('div'); cs.className = 'scr'; cs.id = 'scr-confirm'; cs.dataset.testid = 'confirm-screen';
  cs.innerHTML = '<div class="titlecol"><div class="mtitle">Delete world</div><div id="confirmTxt"></div><div class="tilerow"><button class="tile small" id="confirmNo" style="flex:1" data-testid="confirm-no"><b>No</b></button><button class="tile small" id="confirmYes" style="flex:1;background:linear-gradient(180deg,#b33a3a,#7a1f1f)" data-testid="confirm-yes"><b>Yes</b></button></div></div>';
  const wsc = $('scr-worlds'); wsc.parentNode.insertBefore(cs, wsc.nextSibling);
  let pending = null;
  $('confirmNo').addEventListener('click', () => { pending = null; showScreen('worlds'); });
  $('confirmYes').addEventListener('click', () => { const id = pending; pending = null; if (id) deleteWorld(id); showScreen('worlds'); });
  R.askDelete = w => { pending = w.id; $('confirmTxt').textContent = 'Are you sure you want to delete ' + (w.name || 'this world') + '?'; showScreen('confirm'); };
  const mp = menuPad; menuPad = function (E) { if (screen === 'confirm' && E[1] && $('pause').classList.contains('hidden')) { pending = null; showScreen('worlds'); return; } return mp.apply(this, arguments); };
  renderWorlds = function () {
    const box = $('worldTiles'); box.innerHTML = '';
    const make = (parent, html, cls, fn, tid) => { const b = document.createElement('button'); b.className = 'tile ' + cls; b.innerHTML = html; b.dataset.testid = tid; b.addEventListener('click', fn); parent.appendChild(b); return b; };
    make(box, '<span class="plus">+</span><b>Create new world</b><small>Survival or Creative</small>', 'new', () => { if (nameIn) nameIn.value = 'New World'; showScreen('create'); }, 'world-create-tile');
    const list = worldList();
    for (const w of list) { const row = document.createElement('div'); row.className = 'wrow'; box.appendChild(row); const d = new Date(w.updated || Date.now());
      make(row, '<span class="gold cre">PLAY</span><b>' + escapeHtml(w.name || 'World') + '</b><small>' + (w.mode === 'creative' ? 'Creative' : 'Survival') + ' \u00b7 Day ' + (w.day || 1) + ' \u00b7 ' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) + (w.recovered ? ' \u00b7 recovered' : '') + '</small>', 'world', () => playWorld(w), 'world-tile-' + w.id);
      make(row, '<b>\ud83d\uddd1 Delete</b>', 'del', () => R.askDelete(w), 'world-delete-' + w.id); }
    $('worldEmpty').style.display = list.length ? 'none' : 'block'; $('worldEmpty').textContent = 'No worlds yet. Create your first one.';
    try { refocusMenu(); } catch (_) {}
  };
  const t0 = toast; toast = function (msg) { if (typeof msg === 'string') msg = msg.replace(/\s*Backup saved[^.!]*[.!]?/g, '').replace(/\s*\(Pause > Undo terrain reset\)\.?/g, ''); return t0.call(this, msg); };
})();

/* v0.9.72: Patch Notes button + panel removed from the main menu (window.PATCH_NOTES stays in the code, just hidden). Version tag stays. */
(function c94notes() { const kill = () => { for (const id of ['notesBtn', 'notesUI']) { const el = document.getElementById(id); if (el) el.remove(); } };
  try { const st = document.createElement('style'); st.textContent = '#notesBtn,#notesUI{display:none!important}'; document.head.appendChild(st); } catch (_) {}
  kill(); document.addEventListener('DOMContentLoaded', kill); addEventListener('load', kill); })();
