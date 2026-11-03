/* ===================== GLX-C177 (v1.0.34): COPY and TEMPLATE tools - two extra hotbar squares in the Test World only ===================== */
// The tools are items 701 (Copy) and 702 (Template). They are never used up and can't be dropped; they only exist while you are in a
// world whose name has "test" in it. Templates live in their own IndexedDB database ('glencraft-templates'), so they survive
// Reset world and brand-new maps. COPY: LT corner 1 -> a red see-through box follows your aim -> LT locks it -> RT names + saves, B cancels.
(function c177() {
  const CP = 701, TP = 702, MAXD = 128, MAXV = 1 << 21;
  const U = window.__c177 = {err: null, CP, TP, st: 'idle', c1: null, c2: null, box: null, saved: 0};
  const isTest = () => { try { return !!(started && current && /test/i.test(String(current.name || ''))); } catch (_) { return false; } };
  const isTool = id => id === CP || id === TP;
  U.isTest = isTest; U.isTool = isTool;
  // ---- items + icons ----
  try { NAMES[CP] = 'Copy tool'; NAMES[TP] = 'Template tool'; IT.COPYT = CP; IT.TPLT = TP;
    const icon = (fn) => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); fn(g); return cv.toDataURL(); };
    const cu = icon(g => { g.fillStyle = 'rgba(230,40,30,.35)'; g.fillRect(10, 18, 36, 36); g.strokeStyle = '#ff3b2f'; g.lineWidth = 4; g.strokeRect(10, 18, 36, 36);
      g.setLineDash([6, 4]); g.strokeStyle = '#ffd2c8'; g.lineWidth = 3; g.strokeRect(20, 8, 36, 36); g.setLineDash([]); g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif'; g.fillText('C', 26, 42); });
    const tu = icon(g => { g.fillStyle = 'rgba(80,170,255,.35)'; for (const [x, y] of [[8, 34], [28, 34], [18, 14]]) { g.fillRect(x, y, 22, 22); g.strokeStyle = '#7cc4ff'; g.lineWidth = 3; g.strokeRect(x, y, 22, 22); }
      g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif'; g.fillText('T', 24, 31); });
    const C = window.__c121; for (const [id, u] of [[CP, cu], [TP, tu]]) { if (C && C.setIcon) C.setIcon(id, u); else { ICONS[id] = u; delete ICON_KEY[id]; } }
  } catch (e) { U.err = 'items ' + e; }
  // ---- the two squares: always at the end of the hotbar in the Test World, nowhere else ----
  try { const vi = visibleItems; visibleItems = function () { let r = vi.apply(this, arguments); try { r = r.filter(id => !isTool(id)); if (isTest()) r.push(CP, TP); } catch (_) {} return r; }; } catch (e) { U.err = 'vi ' + e; }
  function keep() { try { if (!started || typeof inv === 'undefined') return; const t = isTest();
      for (const id of [CP, TP]) { if (t) { if (inv[id] !== 1) inv[id] = 1; } else if (inv[id]) delete inv[id]; }
      if (!t && isTool(selId)) { const it = visibleItems(); selId = it.length ? it[0] : T.DIRT; }
      if (!t && U.st !== 'idle') cancel(true); if (!t || paused || menuOpen || dead) U.setHint(''); } catch (e) { U.err = 'keep ' + e; } }
  setInterval(keep, 500);
  try { const dO = dropOne; dropOne = function () { if (isTool(selId)) return; return dO.apply(this, arguments); }; } catch (_) {}
  try { const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && d.inv) { if (Array.isArray(d.inv)) d.inv = d.inv.filter(q => !(q && isTool(q[0]))); else if (typeof d.inv === 'object') { d.inv = Object.assign({}, d.inv); delete d.inv[CP]; delete d.inv[TP]; } } } catch (_) {} return d; }; } catch (_) {}
  // ---- template storage (global, not per world) ----
  let dbp = null;
  function db() { return dbp || (dbp = new Promise((res, rej) => { const r = indexedDB.open('glencraft-templates', 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('tpl')) r.result.createObjectStore('tpl', {keyPath: 'name'}); }; r.onsuccess = () => res(r.result); r.onerror = () => { dbp = null; rej(r.error); }; })); }
  function tx(mode, fn) { return db().then(d => new Promise((res, rej) => { const t = d.transaction('tpl', mode), q = fn(t.objectStore('tpl')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); })); }
  U.all = () => tx('readonly', s => s.getAll()).then(a => (a || []).sort((x, y) => (y.t || 0) - (x.t || 0)));
  U.put = rec => tx('readwrite', s => s.put(rec));
  U.del = name => tx('readwrite', s => s.delete(name));
  // ---- aim + the red box ----
  U.aim = (d) => { try { const r = raycast(d || 64); return r; } catch (_) { return null; } };
  const red = new THREE.MeshBasicMaterial({color: 0xff2a1a, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide});
  const edge = new THREE.LineBasicMaterial({color: 0xff4030, transparent: true, opacity: 0.95, depthTest: false});
  const boxG = new THREE.Group(); boxG.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), red)); boxG.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), edge));
  boxG.children[1].renderOrder = 9; boxG.renderOrder = 8; boxG.visible = false; boxG.frustumCulled = false; for (const c of boxG.children) c.frustumCulled = false;
  try { scene.add(boxG); } catch (_) {}
  const bounds = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])];
  function showBox(bb) { if (!bb) { boxG.visible = false; return; } const w = bb[3] - bb[0] + 1, h = bb[4] - bb[1] + 1, d = bb[5] - bb[2] + 1;
    boxG.position.set(bb[0] + w / 2, bb[1] + h / 2, bb[2] + d / 2); boxG.scale.set(w + 0.04, h + 0.04, d + 0.04); boxG.visible = true; }
  // ---- hint line ----
  const hint = document.createElement('div'); hint.id = 'tplHint'; hint.dataset.testid = 'tool-hint';
  hint.style.cssText = 'position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:30;pointer-events:none;font:600 13px system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.55);padding:5px 10px;border-radius:8px;display:none;white-space:nowrap';
  document.body.appendChild(hint);
  U.setHint = s => { if (hint.textContent !== s) hint.textContent = s; hint.style.display = s ? 'block' : 'none'; };
  const dims = bb => (bb[3] - bb[0] + 1) + ' x ' + (bb[4] - bb[1] + 1) + ' x ' + (bb[5] - bb[2] + 1);
  function cancel(quiet) { U.st = 'idle'; U.c1 = U.c2 = null; showBox(null); if (!quiet) toast('Copy cancelled'); }
  U.cancel = cancel;
  // ---- capture the box into a template record ----
  const SKIP = new Set(['slots', 'items', 'inv', 'loot', 'gen']);
  U.capture = function (bb, name) { const w = bb[3] - bb[0] + 1, h = bb[4] - bb[1] + 1, d = bb[5] - bb[2] + 1, b = new Uint8Array(w * h * d), m = []; let n = 0;
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) { const v = getB(bb[0] + x, bb[1] + y, bb[2] + z); if (!v) continue; const i = (x * h + y) * d + z; b[i] = v; n++;
      const mm = entMeta.get(keyOf(bb[0] + x, bb[1] + y, bb[2] + z)); if (mm) { const o = {}; for (const k in mm) if (!SKIP.has(k) && typeof mm[k] !== 'object') o[k] = mm[k]; if (Object.keys(o).length) m.push([i, o]); } }
    return {name, w, h, d, b, m, n, t: Date.now(), v: 1}; };
  async function save(name) { const bb = bounds(U.c1, U.c2); let nm = String(name || '').trim().slice(0, 24) || 'Build';
    try { const all = await U.all(), have = new Set(all.map(r => r.name)); if (have.has(nm)) { let k = 2; while (have.has(nm + ' (' + k + ')')) k++; nm = nm + ' (' + k + ')'; }
      const rec = U.capture(bb, nm); await U.put(rec); U.saved++; toast('Saved template "' + nm + '" (' + rec.n + ' blocks)'); try { sfx('pop', .5); } catch (_) {} cancel(true);
    } catch (e) { U.err = 'save ' + e; toast('Could not save the template'); } }
  U.save = save;
  function bigOK(bb) { const w = bb[3] - bb[0] + 1, h = bb[4] - bb[1] + 1, d = bb[5] - bb[2] + 1; return w <= MAXD && h <= MAXD && d <= MAXD && w * h * d <= MAXV; }
  // ---- input: LT ----
  U.copyLT = function () { const r = U.aim(); if (!r) { toast('Aim at a block'); return; }
    if (U.st === 'idle' || U.st === 'locked') { U.c1 = r.hit.slice(); U.c2 = r.hit.slice(); U.st = 'sizing'; toast('Corner 1 set - aim at the other corner and press LT'); return; }
    if (U.st === 'sizing') { const bb = bounds(U.c1, r.hit); if (!bigOK(bb)) { toast('Too big - at most ' + MAXD + ' blocks each way'); return; } U.c2 = r.hit.slice(); U.st = 'locked'; toast('Box locked (' + dims(bb) + ') - RT to save, B to cancel'); } };
  U.copyRT = function () { if (U.st === 'sizing') { toast('Press LT to lock the box first'); return; } if (U.st !== 'locked') return;
    if (window.__c178 && __c178.prompt) __c178.prompt('Name this template', 'Build', nm => { if (nm !== null) save(nm); }); else save('Build'); };
  const ui = useItem; useItem = function () { if (isTool(selId) && isTest() && !menuOpen && !paused && !dead && started) { try { if (selId === CP) U.copyLT(); else if (window.__c178) __c178.LT(); } catch (e) { U.err = 'LT ' + e; } return; } return ui.apply(this, arguments); };
  // ---- input: RT (no mining or hitting while a tool is held) ----
  let rtWas = false;
  const uI = updateInteraction; updateInteraction = function (dt) { if (!(isTool(selId) && isTest())) { rtWas = false; return uI.apply(this, arguments); }
    const att = attackMouse || attackPad || attackTouch; try { if (mine) { mine.key = null; mine.t = 0; } if (crackMesh) crackMesh.visible = false; } catch (_) {}
    if (att && !rtWas && !menuOpen && !paused) { try { if (selId === CP) U.copyRT(); else if (window.__c178) __c178.RT(); } catch (e) { U.err = 'RT ' + e; } } rtWas = att; };
  // ---- input: LB / RB rotate a template preview; B (sneak) cancels ----
  const cs = cycleSel; cycleSel = function (dir) { try { if (selId === TP && isTest() && window.__c178 && __c178.active()) { __c178.rotate(dir); return; } } catch (_) {} return cs.apply(this, arguments); };
  let bWas = false;
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments);
    try { const held = isTool(selId) && isTest() && !menuOpen && !paused && !dead, b = !!sneakHeld;
      if (held && b && !bWas) { if (selId === CP && U.st !== 'idle') cancel(); else if (selId === TP && window.__c178) __c178.B(); } bWas = b;
      if (selId !== CP || !held) { if (U.st !== 'idle' && selId !== CP) cancel(true); showBox(null); }
      else { if (U.st === 'sizing') { const a = U.aim(); if (a) U.c2 = a.hit.slice(); } showBox(U.st === 'idle' ? null : bounds(U.c1, U.c2)); }
      let s = '';
      if (held && selId === CP) s = U.st === 'idle' ? 'COPY: LT sets corner 1' : U.st === 'sizing' ? 'COPY ' + dims(bounds(U.c1, U.c2)) + ': LT locks the box, B cancels' : 'COPY ' + dims(bounds(U.c1, U.c2)) + ': RT saves, LT starts again, B cancels';
      else if (held && selId === TP && window.__c178) s = __c178.hint();
      U.setHint(s); if (window.__c178) __c178.frame(dt, held && selId === TP);
    } catch (e) { U.err = 'frame ' + e; } return r; };
})();
