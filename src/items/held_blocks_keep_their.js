/* ===================== GLX-C198 (v1.0.37): held blocks keep their real shape - stairs, corner + inner corner stairs, slabs, carpets, panels, doors and trapdoors
   are built from the same boxes as their icons, with world-style texture mapping and the block's own material (every wood type) ===================== */
(function c198() {
  const U = window.__c198 = {err: null, made: 0, doorRot: [0.12, 1.2, 0], stairRot: [0.25, -0.75, 0]};
  const warn = (w, e) => { U.err = w + ' ' + String(e && e.stack || e); console.warn('c198', w, e); };
  const SH = {
    slab: [[0, 0, 0, 1, .5, 1]], carpet: [[0, 0, 0, 1, .1, 1]], panel: [[0, 0, 0, 1, .14, 1]], trapdoor: [[0, 0, 0, 1, .19, 1]],
    stairs: [[0, 0, 0, 1, .5, 1], [0, .5, 0, 1, 1, .5]], corner: [[0, 0, 0, 1, .5, 1], [.5, .5, 0, 1, 1, .5]],
    inner: [[0, 0, 0, 1, .5, 1], [0, .5, 0, 1, 1, .5], [.5, .5, .5, 1, 1, 1]], door: [[.18, 0, .43, .82, 1, .57]]};
  const shapeOf = (id, n) => /inner corner stairs/.test(n) ? 'inner' : /corner stairs/.test(n) ? 'corner' : /carpet/.test(n) ? 'carpet' : /trapdoor/.test(n) ? 'trapdoor'
    : /\bdoor\b/.test(n) ? 'door' : /slab/.test(n) ? 'slab' : /panel/.test(n) ? 'panel' : /stairs/.test(n) || (typeof IS_STAIR !== 'undefined' && IS_STAIR[id] && id !== 145) ? 'stairs' : null;
  U.shapeOf = shapeOf;
  // a box in block units (0..1) with UVs taken from its position, so a half step shows half the texture like in the world
  function boxGeo(x0, y0, z0, x1, y1, z1) { const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    const p = g.attributes.position, nr = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ax = Math.abs(nr.getX(i)), ay = Math.abs(nr.getY(i));
      if (ax > .5) uv.setXY(i, nr.getX(i) > 0 ? 1 - z : z, y); else if (ay > .5) uv.setXY(i, x, nr.getY(i) > 0 ? 1 - z : z); else uv.setXY(i, nr.getZ(i) > 0 ? x : 1 - x, y); }
    uv.needsUpdate = true; return g; }
  const geoCache = {};
  function shapeGeos(s) { return geoCache[s] || (geoCache[s] = SH[s].map(b => boxGeo(...b))); }
  function matOfMesh(m) { let r = null; try { m.traverse(o => { if (!r && o.isMesh && o.material && !o.userData.c117g) r = o.material; }); } catch (_) {} return r; }
  function model(id, mat, s, rot) { const g = new THREE.Group(), inner = new THREE.Group(), S = 0.16; inner.rotation.copy(rot || new THREE.Euler(0.25, 0.75, 0));
    for (const geo of shapeGeos(s)) { const m = new THREE.Mesh(geo, mat); const sy = s === 'door' ? 1.6 : 1; m.scale.set(S, S * sy, S); m.position.set(-S / 2, -S * sy / 2, -S / 2); inner.add(m); }
    g.add(inner); g.userData.block = true; g.userData.c198 = s; U.made++; return g; }
  try { const mi = makeItemMesh; makeItemMesh = function (id) { const base = mi.apply(this, arguments);
      try { if (typeof id !== 'number' || !NAMES[id] || id >= 1000) return base; const n = String(NAMES[id]).toLowerCase(), s = shapeOf(id, n); if (!s) return base;
        let mat = null, rot = null; const C = window.__c187 && __c187.CORN && __c187.CORN[id];
        if (C) mat = matOfMesh(mi.call(this, C.st));
        else if (base && base.userData && base.userData.block) { mat = matOfMesh(base); }
        if (s === 'door') rot = new THREE.Euler(...U.doorRot); else if (s === 'stairs' || s === 'corner' || s === 'inner') rot = new THREE.Euler(...U.stairRot);
        if (!mat) return base;
        if (s === 'door' && Array.isArray(mat)) mat = mat.slice();
        return model(id, mat, s, rot); } catch (e) { warn('mesh' + id, e); return base; } }; } catch (e) { warn('wrap', e); }
  // anything already in the hand gets rebuilt once with the new shapes
  try { setTimeout(() => { try { if (typeof heldId !== 'undefined' && typeof selId !== 'undefined') { heldId = -1; setHeld(selId); } } catch (_) {} }, 1500); } catch (_) {}
})();
