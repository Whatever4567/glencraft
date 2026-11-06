/* GLX-C398 (v1.1.96): DEEP ENT ENTITIES. TV, chest, torch, door, furnace and bed placed below Y0 live in
   __c320.edits, but syncEntities only saw surface chunk lists, so deep entities were invisible and not
   usable. This keeps a nearby deep ENT set in sync for visibility, use, persistence and removal. Surface
   ents are unchanged. IDs and saves stay. */
(function c398() {
  const U = window.__c398 = {err: null, n: 0, deep: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const TYPES = () => {
    const a = [T.CHEST, T.DOOR, T.TORCH, T.TV];
    try { if (T.FURNACE) a.push(T.FURNACE); } catch (_) {}
    try { if (T.BED) a.push(T.BED); } catch (_) {}
    return a;
  };
  const isEnt = b => { try { return !!(b && (ENT[b] || b === T.FURNACE || b === T.BED || b === T.TV || b === T.CHEST || b === T.DOOR || b === T.TORCH)); } catch (_) { return false; } };
  const R = 48;
  const deepWant = new Map(); // k -> type, only y < 0
  function scan() {
    try {
      const e = window.__c320; if (!e || !e.edits || typeof started === 'undefined' || !started || DIM.cur) return;
      const px = Math.floor(P.x), py = Math.floor(P.y), pz = Math.floor(P.z);
      const next = new Map();
      for (const [k, v] of e.edits) {
        if (!v || !isEnt(v)) continue;
        const p = k.split(',').map(Number); const x = p[0], y = p[1], z = p[2];
        if (!(y < 0)) continue;
        if (Math.abs(x - px) > R || Math.abs(z - pz) > R || Math.abs(y - py) > R + 24) continue;
        // still present in edits and getB agrees
        if (getB(x, y, z) !== v) continue;
        next.set(keyOf(x, y, z), v);
      }
      // remove deep ents that left the set (do not touch surface y>=0)
      for (const [k, o] of [...entObjs]) {
        if (!o || !(o.y < 0)) continue;
        if (!next.has(k) || next.get(k) !== o.type) {
          try { scene.remove(o.g); if (typeof disposeObj === 'function') disposeObj(o.g); } catch (_) {}
          entObjs.delete(k); U.n++;
        }
      }
      for (const [k, t] of next) {
        if (entObjs.has(k) && entObjs.get(k).type === t) continue;
        const [x, y, z] = k.split(',').map(Number);
        try {
          let o;
          if (t === T.TV) o = buildTV(x, y, z);
          else if (t === T.FURNACE && typeof buildFurnace === 'function') o = buildFurnace(x, y, z);
          else if (t === T.BED && typeof buildBed === 'function') o = buildBed(x, y, z);
          else o = buildEnt(t, x, y, z);
          if (o) { entObjs.set(k, o); U.deep++; U.n++; }
        } catch (e) { ERR('build', e); }
      }
      deepWant.clear(); for (const [k, t] of next) deepWant.set(k, t);
      U.on = 1;
    } catch (e) { ERR('scan', e); }
  }
  // After surface syncEntities, re-apply deep ents so surface rebuilds cannot wipe them without rescan
  try {
    const se = syncEntities;
    syncEntities = function (lists) {
      const r = se.apply(this, arguments);
      try { scan(); } catch (e) { ERR('se', e); }
      return r;
    };
  } catch (e) { ERR('wrap', e); }
  // Placement / break below Y0: refresh soon
  try {
    const s0 = setB;
    setB = function (x, y, z, v) {
      const r = s0.apply(this, arguments);
      try {
        if (y < 0 && (isEnt(v) || isEnt(getB(x, y, z)) || !v)) {
          clearTimeout(U.t); U.t = setTimeout(scan, 40);
        }
      } catch (_) {}
      return r;
    };
  } catch (e) { ERR('setB', e); }
  setInterval(() => { try { if (typeof started !== 'undefined' && started && !DIM.cur && P.y < 8) scan(); } catch (e) { ERR('tick', e); } }, 700);
})();
