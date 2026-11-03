/* GLX-C285 (v1.0.94): Builder Tool for Test World - mark corner A and corner B (gold wireframe box), pick which generator structure the
   build replaces, and it is saved to a local prefab library (view / delete / recapture). Pause menu Upload builds downloads
   builds_default.json for Grok Bot to publish; c286 places the prefabs in new random worlds. */
(function c285() {
  const U = window.__c285 = {err: null, A: null, B: null, saves: 0, ups: 0, open: 0, last: null};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const TW = () => !!(current && String(current.name || '').trim().toLowerCase() === 'test world');
  const BT = 991; U.id = BT;
  try { IT.BUILDER = BT; NAMES[BT] = 'Builder Tool'; ICON_KEY[BT] = ICON_KEY[T.TABLE]; if (ICONS[T.TABLE]) ICONS[BT] = ICONS[T.TABLE]; } catch (e) { ERR('item', e); }
  // the structure types the generator builds (live = swappable in new Highlands worlds)
  const TYPES = U.TYPES = [
    {k: 'croft', n: 'Village hut / croft house', d: 'The farm houses with a field in front (front = the field side)', live: 1},
    {k: 'hut', n: 'Hag hut (by the black castle)', d: 'The mossy witch hut near the black castle', live: 1},
    {k: 'bridge', n: 'Bridge', d: 'Spans river and loch gaps - the middle is repeated to fit each gap', live: 1},
    {k: 'landmark', n: 'Landmark (scattered)', d: 'Placed on 3 flat spots in every new world - towers, wells, ruins, anything', live: 1},
    {k: 'castle', n: 'Castle pieces', d: 'Fixed - castles hold the quests and mobs, not swappable yet'},
    {k: 'pyramid', n: 'Pyramid / desert temple', d: 'Fixed - the pyramid holds the Egyptians, tomb and alien story'},
    {k: 'volcano', n: 'Volcano', d: 'Fixed - it is terrain, not a build'}];
  // ---------- library (localStorage) ----------
  const LK = 'glen_prefabs_v1';
  const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); };
  const unb64 = s => { const t = atob(s), u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; };
  U.b64 = b64; U.unb64 = unb64;
  function lib() { try { return JSON.parse(localStorage.getItem(LK) || '{}') || {}; } catch (_) { return {}; } }
  function setLib(L) { localStorage.setItem(LK, JSON.stringify(L)); }
  U.lib = lib; U.setLib = setLib;
  // ---------- capture ----------
  const MAXS = 64;
  function box() { const A = U.A, B = U.B || U.aim; if (!A || !B) return null; return [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.min(A[2], B[2]), Math.max(A[0], B[0]), Math.max(A[1], B[1]), Math.max(A[2], B[2])]; }
  function capture(type) { const b = box(); if (!b) return null; const sx = b[3] - b[0] + 1, sy = b[4] - b[1] + 1, sz = b[5] - b[2] + 1, u = new Uint8Array(sx * sy * sz); let n = 0;
    for (let x = 0; x < sx; x++) for (let y = 0; y < sy; y++) for (let z = 0; z < sz; z++) { const v = getB(b[0] + x, b[1] + y, b[2] + z); u[(x * sy + y) * sz + z] = v; if (v) n++; }
    // front = the side of the box the player is standing on when saving (0 +z, 1 +x, 2 -z, 3 -x)
    const cx = (b[0] + b[3] + 1) / 2, cz = (b[2] + b[5] + 1) / 2, dx = P.x - cx, dz = P.z - cz, f = Math.abs(dz) >= Math.abs(dx) ? (dz >= 0 ? 0 : 2) : (dx >= 0 ? 1 : 3);
    return {type, sx, sy, sz, f, n, b: b64(u), at: Date.now()}; }
  U.capture = capture;
  function save(type) { const pf = capture(type); if (!pf) return; const L = lib(); L[type] = pf; try { setLib(L); } catch (e) { note('Could not save - the library is full (' + e.message + ')'); return; }
    U.saves++; U.last = type; U.A = U.B = null; const t = TYPES.find(q => q.k === type);
    note('Saved <b>' + t.n + '</b> (' + pf.sx + ' x ' + pf.sy + ' x ' + pf.sz + ', ' + pf.n + ' blocks).<br>Make a new world called test world to try it, or use Upload builds in the pause menu.'); }
  U.save = save;
  // ---------- wireframe ----------
  let wire = null;
  function drawWire() { try { if (!wire) { wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({color: 0xffc844, depthTest: false, transparent: true}));
        wire.renderOrder = 999; wire.frustumCulled = false; scene.add(wire); }
      const b = U.A && started && selId === BT ? box() || [U.A[0], U.A[1], U.A[2], U.A[0], U.A[1], U.A[2]] : null; wire.visible = !!b; if (!b) return;
      wire.scale.set(b[3] - b[0] + 1.02, b[4] - b[1] + 1.02, b[5] - b[2] + 1.02); wire.position.set((b[0] + b[3] + 1) / 2, (b[1] + b[4] + 1) / 2, (b[2] + b[5] + 1) / 2);
      wire.material.color.setHex(U.B ? 0x6cff8a : 0xffc844); } catch (e) { ERR('wire', e); } }
  setInterval(() => { try { if (U.A && !U.B && started && selId === BT) { const r = raycast(8); U.aim = r ? r.hit.slice() : null; } drawWire(); } catch (_) {} }, 80);
  // ---------- the tool: LT / right click ----------
  function mark() { const r = raycast(8); if (!r) { toast('Builder Tool: aim at a block'); return; } const h = r.hit.slice();
    if (!U.A || U.B) { U.A = h; U.B = null; toast('Corner A marked - now mark the opposite top corner (B)'); return; }
    const s = [0, 1, 2].map(i => Math.abs(h[i] - U.A[i]) + 1); if (s.some(v => v > MAXS)) { toast('Too big - keep the box under ' + MAXS + ' blocks each way'); return; }
    U.B = h; toast('Corner B marked'); menu(); }
  U.mark = mark;
  /* v1.0.95: corners are marked with RT (left click) in GLX-C288, LT is free for the guns */
  // give the tool in Test World
  let gave = null; setInterval(() => { try { if (!started || !TW() || cnt(BT) > 0 || gave === current.id) return; gave = current.id; addItem(BT, 1); renderHotbar(); toast('Builder Tool added - see How to use Builder Tool in the pause menu'); } catch (_) {} }, 2000);
  // ---------- themed overlay with its own controller navigation ----------
  let ov = null;
  function overlay(html) { if (!ov) { ov = document.createElement('div'); ov.id = 'c285ov'; ov.className = 'panel'; ov.setAttribute('data-testid', 'builder-menu');
      ov.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9998;width:min(94vw,520px);max-height:88vh;overflow:auto;padding:16px 18px;font:600 14px/1.35 system-ui,sans-serif;text-align:center';
      document.body.appendChild(ov); }
    ov.innerHTML = html; ov.style.display = 'block'; menuOpen = true; U.open = 1; try { document.exitPointerLock && document.exitPointerLock(); } catch (_) {}
    const bs = [...ov.querySelectorAll('button:not([disabled])')]; if (bs[0]) bs[0].focus(); return ov; }
  function close() { if (ov) ov.style.display = 'none'; U.open = 0; menuOpen = false; }
  U.close = close;
  function note(msg) { const o = overlay('<div style="margin-bottom:12px">' + msg + '</div><button class="btn" data-a="x">OK</button>'); o.querySelector('[data-a=x]').onclick = close; }
  U.note = note;
  let pv = {};
  setInterval(() => { try { if (!U.open || !ov) return; const g = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(q => q && q.connected); if (!g) return;
      const k = {up: g.buttons[12] && g.buttons[12].pressed || g.axes[1] < -0.6, dn: g.buttons[13] && g.buttons[13].pressed || g.axes[1] > 0.6, a: g.buttons[0] && g.buttons[0].pressed, b: g.buttons[1] && g.buttons[1].pressed};
      const bs = [...ov.querySelectorAll('button:not([disabled])')], i = bs.indexOf(document.activeElement);
      if (k.up && !pv.up) (bs[i - 1] || bs[bs.length - 1]).focus(); if (k.dn && !pv.dn) (bs[i + 1] || bs[0]).focus();
      if (k.a && !pv.a && bs[i]) bs[i].click(); if (k.b && !pv.b) close(); pv = k; } catch (_) {} }, 90);
  const esc = s => String(s).replace(/[<>&]/g, c => ({'<': '&lt;', '>': '&gt;', '&': '&amp;'})[c]);
  function menu() { const b = box(), L = lib(); if (!b) return;
    let h = '<div style="font-size:18px;margin-bottom:4px">Builder Tool</div><div style="opacity:.8;margin-bottom:10px">Box ' + (b[3] - b[0] + 1) + ' x ' + (b[4] - b[1] + 1) + ' x ' + (b[5] - b[2] + 1) + ' - which build does it replace?</div>';
    for (const t of TYPES) h += '<button class="btn" style="display:block;width:100%;margin:5px 0" data-t="' + t.k + '"' + (t.live ? '' : ' disabled') + '>' + esc(t.n) + (L[t.k] ? ' (replace saved)' : '') + '<br><small style="opacity:.75;font-weight:500">' + esc(t.d) + '</small></button>';
    h += '<button class="btn" data-a="lib">My builds library</button> <button class="btn" data-a="help">How to use</button> <button class="btn" data-a="x">Cancel</button>';
    const o = overlay(h); o.querySelectorAll('[data-t]').forEach(e => e.onclick = () => save(e.dataset.t));
    o.querySelector('[data-a=lib]').onclick = library; o.querySelector('[data-a=help]').onclick = help; o.querySelector('[data-a=x]').onclick = () => { close(); U.A = U.B = null; }; }
  U.menu = menu;
  function thumb(pf) { const c = document.createElement('canvas'), s = Math.max(2, Math.floor(160 / Math.max(pf.sx, pf.sy))); c.width = pf.sx * s; c.height = pf.sy * s; const g = c.getContext('2d'), u = unb64(pf.b);
    for (let x = 0; x < pf.sx; x++) for (let y = 0; y < pf.sy; y++) for (let z = 0; z < pf.sz; z++) { const v = u[(x * pf.sy + y) * pf.sz + z]; if (!v) continue;
      g.fillStyle = 'hsl(' + (v * 47 % 360) + ',35%,' + (40 + z * 30 / pf.sz) + '%)'; g.fillRect(x * s, (pf.sy - 1 - y) * s, s, s); break; }
    return c.toDataURL(); }
  function library() { const L = lib(); let h = '<div style="font-size:18px;margin-bottom:8px">My builds library</div>';
    const have = TYPES.filter(t => L[t.k]); if (!have.length) h += '<div style="margin:10px 0">No builds saved yet. Mark corner A and corner B with the Builder Tool.</div>';
    for (const t of have) { const pf = L[t.k]; h += '<div style="border:1px solid rgba(255,200,68,.35);border-radius:8px;padding:8px;margin:6px 0"><b>' + esc(t.n) + '</b> - ' + pf.sx + ' x ' + pf.sy + ' x ' + pf.sz + ', ' + pf.n + ' blocks<br>' +
      '<img alt="side view" style="image-rendering:pixelated;max-width:100%;margin:6px 0;background:#0004" src="' + thumb(pf) + '"><br><button class="btn" data-d="' + t.k + '">Delete</button> <button class="btn" data-r="' + t.k + '">Recapture</button></div>'; }
    h += '<button class="btn" data-a="x">Close</button>'; const o = overlay(h);
    o.querySelectorAll('[data-d]').forEach(e => e.onclick = () => { const L2 = lib(); delete L2[e.dataset.d]; setLib(L2); library(); });
    o.querySelectorAll('[data-r]').forEach(e => e.onclick = () => { if (box() && U.B) { save(e.dataset.r); return; } close(); U.A = U.B = null; toast('Recapture: walk up to the green outline and press Save piece'); });
    o.querySelector('[data-a=x]').onclick = close; }
  U.library = library;
  function help() { const o = overlay('<div style="font-size:18px;margin-bottom:8px">How to use Builder Tool</div><div style="text-align:left">' +
      '1. In a world called test world you start holding the Builder Tool. Keep it in your hotbar.<br>' +
      '2. Pause - World - My builds library, then the Game structures tab lists every structure in the game. Press Open on one and you are taken to it in edit mode.<br>' +
      '3. Change it with normal blocks, or hold a block and press Paint all with held block to recolour the whole thing.<br>' +
      '4. Press Save. Every new world you make uses your edited version. Reset in the list puts the original back.<br>' +
      '5. You can still mark corner A and corner B with RT to save your own build into the My builds tab.</div><br><button class="btn" data-a="x">OK</button>');
    o.querySelector('[data-a=x]').onclick = close; }
  U.help = help;
  // ---------- Upload builds ----------
  async function gz(txt) { if (!window.CompressionStream) return null; return await new Response(new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip'))).blob(); }
  async function upload() { if (!TW()) return; try { const L = lib(), n = Object.keys(L).length; if (!n) { note('No builds saved yet - use the Builder Tool first.'); return; }
      const txt = JSON.stringify({v: 1, made: Date.now(), builds: L}); let blob = new Blob([txt], {type: 'application/json'}), name = 'builds_default.json';
      if (txt.length > 400000) { const z = await gz(txt); if (z) { blob = z; name = 'builds_default.json.gz'; } }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      U.ups++; U.lastUp = {name, size: blob.size, n};
      note('Saved <b>' + name + '</b> (' + n + ' builds, ' + Math.max(1, Math.round(blob.size / 1024)) + ' KB) to your downloads.<br><br>Send this file to Grok Bot - your builds go into everyone&#39;s new worlds.'); } catch (e) { ERR('up', e); note('Upload builds failed: ' + (e && e.message || e)); } }
  U.upload = upload;
  function btns() { const P2 = window.__c163 && __c163.panes; if (!P2 || !P2.world) return; const show = TW() && typeof started !== 'undefined' && started;
    for (const [id, txt, fn, tid] of [ /* v1.0.111: no Upload builds button */ ['c285lib', 'My builds library', library, 'builds-library-button'], ['c285help', 'How to use Builder Tool', help, 'builder-help-button']]) {
      let b = document.getElementById(id); if (!b) { b = document.createElement('button'); b.id = id; b.className = 'btn'; b.type = 'button'; b.textContent = txt; b.setAttribute('data-testid', tid);
        b.onclick = ev => { ev.preventDefault(); try { setPause(false); } catch (_) {} setTimeout(fn, 60); }; P2.world.appendChild(b); }
      b.style.display = show ? '' : 'none'; } }
  try { const sp = setPause; setPause = function () { const r = sp.apply(this, arguments); try { btns(); } catch (e) { ERR('btn', e); } return r; }; } catch (e) { ERR('sp', e); }
  setInterval(() => { try { btns(); } catch (_) {} }, 2000);
})();
