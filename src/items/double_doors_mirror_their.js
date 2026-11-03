/* ===================== GLX-C227 (v1.0.49): double doors mirror their picture - the handles meet in the middle ===================== */
(function c227() {
  const U = window.__c227 = {err: null, flipped: 0, rebuilt: 0};
  const ERR = e => { U.err = String(e && e.stack || e).slice(0, 300); };
  try {
    const pOf = (x, y, z) => { try { return window.__c226 && __c226.partnerOf(x, y, z); } catch (_) { return null; } };
    // the door picture has its hinges on the left and the handle on the right: the right-hand door of a pair (hinge 1) shows it mirrored
    function flipUV(mesh) {
      const g = mesh.geometry.clone(), uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
      uv.needsUpdate = true; mesh.geometry = g;
    }
    function rebuild(x, y, z) {
      const k = keyOf(x, y, z), o = entObjs.get(k);
      try { if (o) { scene.remove(o.g); entObjs.delete(k); } const e = buildEnt(T.DOOR, x, y, z); if (e) entObjs.set(k, e); U.rebuilt++; } catch (e) { ERR(e); }
    }
    const later = new Set(); let tm = 0;
    const check = () => { tm = 0; for (const s of later) { const [x, y, z] = s.split(',').map(Number); if (getB(x, y, z) !== T.DOOR) continue;
      const o = entObjs.get(keyOf(x, y, z)), m = entMeta.get(keyOf(x, y, z)) || {}; if (!o) continue;
      const want = !!(m.hinge && pOf(x, y, z)); if (!!o.flip !== want) rebuild(x, y, z); } later.clear(); };
    const soon = (x, y, z) => { later.add(x + ',' + y + ',' + z); if (!tm) tm = setTimeout(check, 30); };
    const around = (x, y, z) => { for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (getB(x + dx, y, z + dz) === T.DOOR) soon(x + dx, y, z + dz); };
    U.check = check;
    const be = buildEnt;
    buildEnt = function (type, x, y, z) {
      const o = be.apply(this, arguments);
      try {
        if (type === T.DOOR && o && o.pivot) {
          const m = entMeta.get(keyOf(x, y, z)) || {}, pm = o.pivot.children[0];
          if (m.hinge && pOf(x, y, z) && pm && pm.geometry && pm.geometry.attributes.uv) { flipUV(pm); o.flip = true; U.flipped++; }
          around(x, y, z);   // a partner built before this one (loading a world) gets its picture fixed too
        }
      } catch (e) { ERR(e); }
      return o;
    };
    // placing or breaking a door: its neighbours re-check (an unpaired door goes back to normal)
    const sb = setB;
    setB = function (x, y, z, v) {
      let was = 0; try { was = getB(x, y, z); } catch (_) {}
      const r = sb.apply(this, arguments);
      try { if ((was === T.DOOR) !== (v === T.DOOR)) around(x, y, z); } catch (e) { ERR(e); }
      return r;
    };
  } catch (e) { ERR(e); }
})();
