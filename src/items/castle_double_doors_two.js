/* ===================== GLX-C98 (v0.9.78): castle double doors - two doors side by side work as a pair (mirrored hinges, open together) ===================== */
(function () {
  const isD = (x, y, z) => getB(x, y, z) === T.DOOR;
  const mine = (x, y, z) => { try { return placedSet.has(idx(x, y, z)); } catch (_) { return false; } };
  function rebuild(x, y, z) { const k = keyOf(x, y, z), o = entObjs.get(k); if (!o) return; scene.remove(o.g); disposeObj(o.g); entObjs.delete(k); entObjs.set(k, buildEnt(T.DOOR, x, y, z)); }
  function fixPair(x, ly, z) {
    if (!isD(x, ly, z)) return null;
    let q = null; const mA = entMeta.get(keyOf(x, ly, z)) || {face: 0};
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (isD(x + dx, ly, z + dz)) { const mB = entMeta.get(keyOf(x + dx, ly, z + dz)); if (!q || (mB && (mB.face || 0) === (mA.face || 0))) q = [x + dx, z + dz]; }
    if (!q) return null;
    const kA = keyOf(x, ly, z), kB = keyOf(q[0], ly, q[1]), mB = entMeta.get(kB) || {face: 0};
    if (mine(x, ly, z) || mine(q[0], ly, q[1])) return (mA.face || 0) === (mB.face || 0) && !!mA.hinge !== !!mB.hinge ? q : null;   // your own doors: left as you placed them
    const alongX = q[0] !== x, ok = f => alongX ? f % 2 === 0 : f % 2 === 1;
    const f = ok(mA.face || 0) ? (mA.face || 0) : ok(mB.face || 0) ? (mB.face || 0) : (alongX ? 0 : 1);
    const hA = toLocal(q[0] + .5, q[1] + .5, x, z, f)[0] > 0 ? 0 : 1, hB = 1 - hA;
    if ((mA.face || 0) !== f || (mA.hinge ? 1 : 0) !== hA || (mB.face || 0) !== f || (mB.hinge ? 1 : 0) !== hB) {
      mA.face = f; mA.hinge = hA; mB.face = f; mB.hinge = hB; entMeta.set(kA, mA); entMeta.set(kB, mB);
      doorState.set(kB, !!doorState.get(kA)); rebuild(x, ly, z); rebuild(q[0], ly, q[1]); }
    return q;
  }
  window.doorPartner = (x, ly, z) => { try { return fixPair(x, ly, z); } catch (e) { return null; } };
  const td = toggleDoor;
  toggleDoor = function (x, y, z) { try { const ly = getB(x, y, z) === T.DOORTOP ? y - 1 : y; fixPair(x, ly, z); } catch (_) {} return td.apply(this, arguments); };
  // castle doors near you get paired up (old worlds too); cheap: a few door entities every 2 s
  setInterval(() => { try { if (typeof started === 'undefined' || !started || screen !== 'none' || window.__safeLoad) return; for (const o of [...entObjs.values()]) if (o.type === T.DOOR && Math.abs(o.x - P.x) < 32 && Math.abs(o.z - P.z) < 32) fixPair(o.x, o.y, o.z); } catch (e) {} }, 2000);
})();
