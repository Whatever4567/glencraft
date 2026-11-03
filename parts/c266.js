/* GLX-C266 (v1.0.78): Settings > Audio > Custom dance music - pick your own track; it is kept only on this device (IndexedDB) and never uploaded */
(() => {
  const U = window.__c266 = {err: null, has: 0, name: ''};
  try {
    const DB = 'glen_custom', ST = 'files', KEY = 'dance';
    const db = () => new Promise((res, rej) => { const q = indexedDB.open(DB, 1); q.onupgradeneeded = () => q.result.createObjectStore(ST); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    const tx = (mode, fn) => db().then(d => new Promise((res, rej) => { const t = d.transaction(ST, mode), r = fn(t.objectStore(ST)); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }));
    const get = k => tx('readonly', s => s.get(k)).then(v => v && v.ab ? v : null).catch(() => null);
    const put = (k, name, ab) => tx('readwrite', s => s.put({name, ab, at: Date.now()}, k)), del = k => tx('readwrite', s => s.delete(k));
    U.get = () => get(KEY); U.set = (n, ab) => put(KEY, n, ab); U.clear = () => del(KEY);
    function mkRow(k, label, id, reset) {
      const row = document.createElement('div'); row.className = 'set'; row.id = id + 'row'; row.setAttribute('data-testid', 'custom-' + k + '-music');
      row.innerHTML = '<span>' + label + '</span><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button type="button" class="btn alt">Choose file</button><button type="button" class="btn alt">Use built-in</button><small style="opacity:.8"></small></div><input type="file" accept="audio/*" hidden>';
      const panel = document.querySelector('#pause .panel'); (panel || document.body).appendChild(row);
      const [pick, clr] = row.querySelectorAll('button'), nm = row.querySelector('small'), inp = row.querySelector('input');
      const show = () => get(k).then(v => { if (k === KEY) { U.has = v ? 1 : 0; U.name = v ? v.name : ''; } nm.textContent = v ? 'Using: ' + v.name + ' (only on this device)' : 'Built-in tune'; });
      const changed = () => { try { reset(); } catch (_) {} show(); };
      pick.addEventListener('click', e => { e.preventDefault(); inp.click(); });
      clr.addEventListener('click', e => { e.preventDefault(); del(k).then(changed); });
      inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; if (!f) return; if (f.size > 40e6) { toast('That file is too big (40 MB max)'); return; }
        f.arrayBuffer().then(ab => put(k, f.name, ab)).then(() => { toast(label + ' saved on this device'); changed(); }).catch(e => { U.err = String(e); toast('Could not save that file'); }); inp.value = ''; });
      show(); }
    mkRow(KEY, 'Custom dance music', 'c266', () => window.__c259 && __c259.reset && __c259.reset());
  } catch (e) { U.err = String(e && e.message || e); }
})();
