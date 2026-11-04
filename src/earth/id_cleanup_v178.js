/* GLX-IDC (v1.1.78): BLOCK ID CLEAN UP. The Backrooms and the Mystery painting are gone from the game, so their ids are free again:
   190 (the painting item) and 200 (the painting block). The gold nugget item moved from 184 to 327, so 184 is free too. Old saves are
   fixed once on load: any old painting block becomes air, painting items are dropped from the bag, chests, furnaces and hotbar, and gold
   nuggets keep their count under the new id. Saves get a flag so the new blocks in those ids are never touched again. */
(function idc() {
  const U = window.__idc = {err: null, air: 0, items: 0, moved: 0, fixed: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const GONE = new Set([190, 200]), MOVE = {184: 327};
  const fixSlot = v => { if (Array.isArray(v)) { if (v.length >= 2 && typeof v[0] === 'number' && typeof v[1] === 'number') { if (GONE.has(v[0])) { U.items++; return null; } if (MOVE[v[0]]) { v[0] = MOVE[v[0]]; U.moved++; } return v; } for (let i = 0; i < v.length; i++) v[i] = fixSlot(v[i]); return v; }
    if (v && typeof v === 'object') { for (const k in v) { if (k === 'id' && typeof v[k] === 'number') { if (GONE.has(v[k])) { U.items++; v[k] = 0; } else if (MOVE[v[k]]) { v[k] = MOVE[v[k]]; U.moved++; } } else v[k] = fixSlot(v[k]); } } return v; };
  const fixEdits = a => Array.isArray(a) ? a.map(([k, b]) => [k, GONE.has(b) || b === 184 ? 0 : b]) : a;
  let pend = false;
  try { const ap = applySave; applySave = function (d) { pend = false; try { if (d && !d.idc78) { pend = true; U.fixed++;
        if (d.inv) { for (const g of GONE) if (d.inv[g]) { delete d.inv[g]; U.items++; } for (const k in MOVE) if (d.inv[k]) { d.inv[MOVE[k]] = (d.inv[MOVE[k]] || 0) + d.inv[k]; delete d.inv[k]; U.moved++; } }
        for (const f of ['chests', 'furnaces', 'offhand', 'off']) if (d[f]) d[f] = fixSlot(d[f]);
        if (Array.isArray(d.hotbar)) d.hotbar = d.hotbar.map(i => GONE.has(i) ? 0 : MOVE[i] || i);
        if (d.c320 && d.c320.e) d.c320.e = fixEdits(d.c320.e);
        if (d.c318 && d.c318.e) for (const k in d.c318.e) d.c318.e[k] = fixEdits(d.c318.e[k]); } } catch (e) { ERR('pre', e); }
      const r = ap.apply(this, arguments);
      try { if (pend && world) { for (let i = 0; i < world.length; i++) { const b = world[i]; if (b === 190 || b === 200 || b === 184) { world[i] = 0; U.air++; } } if (U.air) dirtyAll = true; } pend = false; } catch (e) { ERR('post', e); }
      return r; }; } catch (e) { ERR('ap', e); }
  try { const se = serialize; serialize = function () { const o = se.apply(this, arguments); try { if (o && typeof o === 'object') o.idc78 = 1; } catch (_) {} return o; }; } catch (e) { ERR('ser', e); }
})();
