rebuild = function (budget) {
  const ncx = Math.ceil(W / CH), ncz = Math.ceil(D / CH);
  const deepEntry=window.__c324;
  // Only enterWorld's readiness gate may consume this handoff. In particular,
  // never turn dirtyAll into a whole-map surface queue during a deep saved start.
  // C324's independent loader timer builds the near cave while the original
      // enterWorld readiness wait is still active. Surface loading resumes after.
      if((typeof started==='undefined'||!started)&&window.__c324&&__c324.savedEntry&&!__c324.savedEntryDone)return;
  if (dirtyAll) {
    for (const g of chunkObjs.values()) { blockGroup.remove(g); g.children.forEach(c => { if (c.isInstancedMesh) c.dispose(); else if (c.geometry) c.geometry.dispose(); }); }
    chunkObjs.clear(); chunkLists.clear();
    for (let cx = 0; cx < ncx; cx++) for (let cz = 0; cz < ncz; cz++) dirtyCh.add(cx * 64 + cz);
    dirtyAll = false;
  }
  const R = STREAM_R = streamRadius(), pcx = P.x / CH - 0.5, pcz = P.z / CH - 0.5;
  const dist = id => Math.max(Math.abs(Math.floor(id / 64) - pcx), Math.abs(id % 64 - pcz));
  // unload far chunks (they stay "dirty" so they rebuild when you come back)
  const now = performance.now();
  if (now - streamT > 700) {
    streamT = now;
    for (const [id, g] of chunkObjs) if (dist(id) > R + 1.5) {
      blockGroup.remove(g); g.children.forEach(c => { if (c.isInstancedMesh) c.dispose(); else if (c.geometry) c.geometry.dispose(); });
      chunkObjs.delete(id); chunkLists.delete(id); dirtyCh.add(id); rebuild._unloaded = true;
    }
  }
  let ids = [...dirtyCh].filter(id => dist(id) <= R);
  if (!ids.length && !rebuild._unloaded) return;
  rebuild._unloaded = false;
  ids.sort((a, b) => dist(a) - dist(b));
  const tB = performance.now();
  let built = 0; for (const id of ids) { if (budget && built && performance.now() - tB + ((window.__lightStats && __lightStats().avg) || 0) > budget) break; if (budget && performance.now() - tB > budget * 2) break; try { buildChunk(Math.floor(id / 64), id % 64); } catch (e) { if (!window.__chErr) { window.__chErr = String(e && e.stack || e); try { loadErr("chunk " + id, e); } catch (_) {} } } built++; dirtyCh.delete(id); }
  const all = {};
  for (const L of chunkLists.values()) for (const t of [T.CAULDRON, T.CHEST, T.DOOR, T.TORCH, T.TV, T.REDORE, T.FURNACE, T.BED]) if (L[t]) (all[t] || (all[t] = [])).push(...L[t]);
  redOres = all[T.REDORE] || [];
  syncCauldrons(all[T.CAULDRON] || []);
  try { syncEntities(all); } catch (e) { if (!window.__entErr) { window.__entErr = String(e && e.stack || e); try { loadErr("entities", e); } catch (_) {} } }
};
