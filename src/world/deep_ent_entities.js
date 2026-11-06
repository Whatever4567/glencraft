/* GLX-C398 (v1.1.96): DEEP ENT ENTITIES. Deep TV/chest/torch/door(+top)/furnace/bed live in __c320.edits
   but never entered surface chunkLists. Maintains a chunk-indexed deep ENT map (built once from edits on
   load, updated on setB) and syncs only nearby chunks. Save format unchanged. */
(function c398() {
  const U = window.__c398 = {err: null, n: 0, deep: 0, idxN: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const CS = () => (typeof CH === 'number' ? CH : 16);
  const isEnt = b => {
    try {
      if (!b) return false;
      if (b === T.DOORTOP || b === T.DOOR || b === T.CHEST || b === T.TORCH || b === T.TV) return true;
      if (b === T.FURNACE || b === T.BED) return true;
      return !!(typeof ENT !== 'undefined' && ENT[b]);
    } catch (_) { return false; }
  };
  // chunkKey -> Map(keyOf -> type) for y < 0 only
  const byChunk = new Map();
  const chunkOf = (x, z) => Math.floor(x / CS()) + ',' + Math.floor(z / CS());
  function idxSet(x, y, z, v) {
    if (!(y < 0) || !isEnt(v)) return;
    const ck = chunkOf(x, z), k = keyOf(x, y, z);
    let m = byChunk.get(ck); if (!m) byChunk.set(ck, m = new Map());
    m.set(k, v); U.idxN++;
  }
  function idxDel(x, y, z) {
    const ck = chunkOf(x, z), m = byChunk.get(ck); if (!m) return;
    m.delete(keyOf(x, y, z)); if (!m.size) byChunk.delete(ck);
  }
  function rebuildIndex() {
    byChunk.clear(); U.idxN = 0;
    try {
      const e = window.__c320; if (!e || !e.edits) return;
      for (const [k, v] of e.edits) {
        if (!isEnt(v)) continue;
        const p = k.split(',').map(Number);
        if (p[1] < 0) idxSet(p[0], p[1], p[2], v);
      }
    } catch (e) { ERR('rebuild', e); }
    U.rebuilt = (U.rebuilt || 0) + 1;
  }
  function makeEnt(t, x, y, z) {
    if (t === T.TV) return buildTV(x, y, z);
    if (t === T.FURNACE && typeof buildFurnace === 'function') return buildFurnace(x, y, z);
    if (t === T.BED && typeof buildBed === 'function') return buildBed(x, y, z);
    if (t === T.DOORTOP) return null; // model hangs on door lower half
    return buildEnt(t === T.DOOR ? T.DOOR : t, x, y, z);
  }
  const RN = 3; // chunks
  function syncNear() {
    try {
      if (typeof started === 'undefined' || !started || DIM.cur) return;
      const e = window.__c320; if (!e) return;
      const pcx = Math.floor(P.x / CS()), pcz = Math.floor(P.z / CS());
      const want = new Map();
      for (let cx = pcx - RN; cx <= pcx + RN; cx++) for (let cz = pcz - RN; cz <= pcz + RN; cz++) {
        const m = byChunk.get(cx + ',' + cz); if (!m) continue;
        for (const [k, t] of m) {
          const [x, y, z] = k.split(',').map(Number);
          if (Math.abs(y - P.y) > 64) continue;
          // edits + getB must agree (broken/removed)
          try { if (getB(x, y, z) !== t) { idxDel(x, y, z); continue; } } catch (_) { continue; }
          if (t === T.DOORTOP) continue;
          want.set(k, t);
        }
      }
      for (const [k, o] of [...entObjs]) {
        if (!o || !(o.y < 0)) continue;
        if (!want.has(k) || want.get(k) !== o.type) {
          try { scene.remove(o.g); if (typeof disposeObj === 'function') disposeObj(o.g); } catch (_) {}
          entObjs.delete(k); U.n++;
        }
      }
      for (const [k, t] of want) {
        if (entObjs.has(k) && entObjs.get(k).type === t) continue;
        const [x, y, z] = k.split(',').map(Number);
        try {
          const o = makeEnt(t, x, y, z);
          if (o) { entObjs.set(k, o); U.deep++; U.n++; }
        } catch (err) { ERR('build', err); }
      }
      U.on = 1;
    } catch (e) { ERR('sync', e); }
  }
  try {
    const se = syncEntities;
    syncEntities = function (lists) {
      const r = se.apply(this, arguments);
      try { if (P && P.y < 12) syncNear(); } catch (e) { ERR('se', e); }
      return r;
    };
  } catch (e) { ERR('wrap', e); }
  try {
    const s0 = setB;
    setB = function (x, y, z, v) {
      const y0 = Math.floor(y), x0 = Math.floor(x), z0 = Math.floor(z);
      let prev = 0; try { if (y0 < 0) prev = getB(x0, y0, z0); } catch (_) {}
      const r = s0.apply(this, arguments);
      try {
        if (y0 < 0) {
          if (isEnt(prev)) idxDel(x0, y0, z0);
          if (isEnt(v)) idxSet(x0, y0, z0, v);
          else if (!v && isEnt(prev)) {
            // door pair cleanup: if lower door removed, drop top from index
            if (prev === T.DOOR) idxDel(x0, y0 + 1, z0);
            if (prev === T.DOORTOP) idxDel(x0, y0 - 1, z0);
          }
          clearTimeout(U.t); U.t = setTimeout(syncNear, 30);
        }
      } catch (_) {}
      return r;
    };
  } catch (e) { ERR('setB', e); }
  try {
    const ew = enterWorld;
    enterWorld = function (save) {
      const r = ew.apply(this, arguments);
      try { setTimeout(rebuildIndex, 0); setTimeout(syncNear, 50); } catch (_) {}
      return r;
    };
  } catch (e) { ERR('ew', e); }
  setInterval(() => { try { if (typeof started !== 'undefined' && started && !DIM.cur && P.y < 12) syncNear(); } catch (e) { ERR('tick', e); } }, 900);
  setTimeout(rebuildIndex, 800);
})();
