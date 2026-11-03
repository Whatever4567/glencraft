/* ===================== GLX-C207 (v1.0.41): templates keep what is inside - chest slots, furnace input / fuel / output and progress, cauldron contents, door open state and all block data are saved with a template and put back when it is placed ===================== */
// Stored in the same IndexedDB record (rec.e = {c, f, k, d, m}: lists of [cell index, data]). Older templates without rec.e place exactly as before.
(function c207() {
  const C = window.__c177, P8 = window.__c178; if (!C || !P8) return;
  const U = window.__c207 = {err: null, saved: 0, put: 0, pendK: 0};
  const clone = o => { try { return JSON.parse(JSON.stringify(o)); } catch (_) { return null; } };
  const cap = C.capture; C.capture = function (bb) { const rec = cap.apply(this, arguments);
    try { const w = bb[3] - bb[0] + 1, h = bb[4] - bb[1] + 1, d = bb[5] - bb[2] + 1, e = {c: [], f: [], k: [], d: [], m: []};
      for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) { const i = (x * h + y) * d + z; if (!rec.b[i]) continue; const k = keyOf(bb[0] + x, bb[1] + y, bb[2] + z);
        const ch = chests.get(k); if (ch && ch.slots && ch.slots.some(s => s)) e.c.push([i, clone(ch.slots)]);
        const fu = furnaces.get(k); if (fu) e.f.push([i, clone(fu)]);
        const ca = typeof cauldrons !== 'undefined' && cauldrons.get(k); if (ca) e.k.push([i, {full: !!ca.full, heat: ca.heat, queue: clone(ca.queue || [])}]);
        if (doorState.has(k)) e.d.push([i, doorState.get(k)]);
        const mm = entMeta.get(k); if (mm) { const o = {}; let any = false; for (const q in mm) if (q !== 'gen' && mm[q] && typeof mm[q] === 'object') { const v = clone(mm[q]); if (v != null) { o[q] = v; any = true; } } if (any) e.m.push([i, o]); } }
      if (e.c.length || e.f.length || e.k.length || e.d.length || e.m.length) { rec.e = e; U.saved++; } } catch (er) { U.err = 'cap ' + er; }
    return rec; };
  // placing: c179 calls onPut for every cell it sets
  const pendK = new Map();
  P8.onPut = function (J, i, X, Y, Z, v) { const t = J.t; if (!t || !t.e) return;
    if (!J.e) { J.e = {}; for (const q of ['c', 'f', 'k', 'd', 'm']) J.e[q] = new Map(t.e[q] || []); }
    const k = keyOf(X, Y, Z), E = J.e;
    chests.delete(k); furnaces.delete(k); doorState.delete(k);
    if (E.c.has(i)) { chests.set(k, {slots: clone(E.c.get(i))}); U.put++; }
    if (E.f.has(i)) { furnaces.set(k, clone(E.f.get(i))); U.put++; }
    if (E.d.has(i)) doorState.set(k, E.d.get(i));
    if (E.k.has(i)) { pendK.set(k, clone(E.k.get(i))); U.put++; }
    if (E.m.has(i)) { const m = entMeta.get(k) || {}; entMeta.set(k, Object.assign(m, clone(E.m.get(i)))); } };
  setInterval(() => { try { if (!pendK.size || typeof cauldrons === 'undefined') return; for (const [k, s] of pendK) { const c = cauldrons.get(k); if (!c) continue; Object.assign(c, s); try { if (c.water) c.water.visible = !!c.full; } catch (_) {} pendK.delete(k); }
      U.pendK = pendK.size; } catch (e) { U.err = 'k ' + e; } }, 500);
  try { const ew = enterWorld; enterWorld = function () { pendK.clear(); return ew.apply(this, arguments); }; } catch (_) {}
})();
