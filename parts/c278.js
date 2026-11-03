/* GLX-C278 (v1.0.91): Upload world (Test World only), New World from the published default map, Random world toggle, UFO only over the pyramid desert at night. */
(function () {
  const U = window.__c278 = {err: null, tpl: 0, ups: 0, ufoBlock: 0, last: null};
  const ERR = (w, e) => { U.err = w + ': ' + (e && e.message || e); };
  const TW = () => !!(current && String(current.name || '').trim().toLowerCase() === 'test world') /* v1.0.93: any spelling */;
  // ---------- Upload world ----------
  async function gz(txt) { if (!window.CompressionStream) return null; const s = new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip')); return await new Response(s).blob(); }
  function note(msg) { let o = document.getElementById('c278ov'); if (!o) { o = document.createElement('div'); o.id = 'c278ov'; o.className = 'panel';
      o.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9999;max-width:min(92vw,460px);padding:18px 20px;text-align:center;font:600 15px/1.4 system-ui,sans-serif';
      document.body.appendChild(o); }
    o.innerHTML = '<div style="margin-bottom:12px">' + msg + '</div><button class="btn" id="c278ok" data-testid="upload-world-ok">OK</button>'; o.style.display = 'block';
    o.querySelector('#c278ok').onclick = () => { o.style.display = 'none'; }; }
  async function upload() { if (!TW()) return; try { try { saveWorld(true); } catch (_) {}
      const d = serialize(); d.tpl = 1; d.inv = {}; d.armour = []; d.hp = 20; d.food = 20; d.prog = {}; d.P = Object.assign({}, d.P); delete d.hotbar;
      const txt = JSON.stringify(d); let blob = await gz(txt), name = 'world_default.json.gz'; if (!blob) { blob = new Blob([txt], {type: 'application/json'}); name = 'world_default.json'; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      U.ups++; U.last = {name, size: blob.size};
      note('Saved <b>' + name + '</b> (' + (blob.size / 1048576).toFixed(1) + ' MB) to your downloads.<br><br>Send this file to Grok Bot - it becomes the map for everyone&#39;s new worlds.');
    } catch (e) { ERR('up', e); note('Upload world failed: ' + (e && e.message || e)); } }
  U.upload = upload;
  function btn() { let b = document.getElementById('c278up'); const P = window.__c163 && __c163.panes; if (!b && P && P.world) { b = document.createElement('button'); b.id = 'c278up'; b.className = 'btn'; b.type = 'button';
      b.textContent = 'Upload world'; b.setAttribute('data-testid', 'upload-world-button'); b.onclick = ev => { ev.preventDefault(); upload(); }; P.world.appendChild(b); }
    if (b) b.style.display = false && TW() && typeof started !== 'undefined' && started ? '' : 'none'; }
  try { const sp = setPause; setPause = function (on) { const r = sp.apply(this, arguments); try { btn(); } catch (e) { ERR('btn', e); } return r; }; } catch (e) { ERR('sp', e); }
  setInterval(() => { try { btn(); } catch (_) {} }, 2000);
  // ---------- New World: published default map, or random ----------
  let RND = false; /* v1.0.93: no Random world option - new survival worlds always use the published map when there is one */
  function toggle() { if (document.getElementById('c278rnd')) return; const seg = document.getElementById('modeSeg'); if (!seg) return;
    const l = document.createElement('label'); l.id = 'c278rnd'; l.className = 'set'; l.style.cssText = 'display:flex;gap:8px;align-items:center;justify-content:center;margin:6px 0;font:600 14px system-ui,sans-serif';
    l.innerHTML = '<input type="checkbox" data-testid="create-random-world"' + (RND ? ' checked' : '') + '> Random world (ignore the published map)'; seg.after(l);
    l.querySelector('input').onchange = ev => { RND = ev.target.checked; try { localStorage.setItem('glen_rndWorld', RND ? '1' : '0'); } catch (_) {} }; }
  try { const o = document.getElementById('c278rnd'); if (o) o.remove(); } catch (_) {}
  async function fetchTpl() { const base = 'assets/world_default.json';
    try { const r = await fetch(base + '.gz', {cache: 'no-cache'}); if (r.ok && window.DecompressionStream) { const b = await r.arrayBuffer(); const u8 = new Uint8Array(b);
        const s = u8[0] === 0x1f && u8[1] === 0x8b ? new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip')) : new Blob([b]).stream(); return JSON.parse(await new Response(s).text()); } } catch (_) {}
    try { const r = await fetch(base, {cache: 'no-cache'}); if (r.ok) return await r.json(); } catch (_) {} return null; }
  U.fetchTpl = fetchTpl;
  try { const cw = createWorld; createWorld = async function () { const args = arguments;
      if (RND || newMode === 'creative') return cw.apply(this, args);
      let t = null; try { showScreen('loading'); t = await fetchTpl(); } catch (_) {}
      if (!t || !t.world) return cw.apply(this, args);
      const name = ($('worldName').value || '').trim().slice(0, 28) || 'My Glen';
      current = {id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, mode: newMode, created: Date.now()};
      t.id = current.id; t.name = name; t.mode = newMode; t.created = current.created; t.updated = Date.now(); t.inv = {}; U.tpl++;
      enterWorld(t); const w = setInterval(() => { if (started) { clearInterval(w); setTimeout(() => { try { window.__c260kit && __c260kit(); saveWorld(true); } catch (_) {} }, 700); } }, 300); }; } catch (e) { ERR('cw', e); }
  // ---------- UFO: only at night over the pyramid desert ----------
  const night = () => (typeof isNight !== 'undefined' && isNight) || (typeof daylight === 'number' && daylight < 0.3);
  const inDes = () => { try { return window.__c258 && __c258.inArea ? __c258.inArea() : true; } catch (_) { return true; } };
  U.ufoOk = () => night() && inDes();
  const hook = () => { const C = window.__c246; if (!C || C.__c278) return !!C; const sp = C.spawn; C.spawn = function () { if (!U.ufoOk()) { U.ufoBlock++; return false; } return sp.apply(this, arguments); }; C.__c278 = 1; return true; };
  if (!hook()) { const t = setInterval(() => { if (hook()) clearInterval(t); }, 1000); }
})();
