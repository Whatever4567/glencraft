/* GLX-C268 (v1.0.83): the players own paintings (user_p1-6.jpg, drawn by the player) hang framed in the two new gallery rooms off the
   pyramid hall (c182). Thin panels only - they never change blocks. Only shows in worlds that have the gallery rooms (new or reset). */
(function () {
  const U = window.__c268 = {err: null, n: 0, rooms: 0};
  const AR = [410 / 512, 420 / 512, 384 / 512, 418 / 512, 384 / 512, 1];
  const grp = new THREE.Group(); grp.userData.__dcR = 1e9; scene.add(grp); let key = null, lastW = null, ld = null;
  const air = (x, y, z) => !world[idx(x, y, z)];
  function clear() { while (grp.children.length) { const m = grp.children.pop(); m.geometry.dispose(); m.material.dispose(); } U.n = 0; U.rooms = 0; }
  function build(o) { clear(); ld = ld || new THREE.TextureLoader(); let i = 0;
    for (const s of [-1, 1]) { const [cx, cz] = o.L(1, 10 * s); if (!air(cx, o.hy + 1, cz) || !air(cx, o.hy + 3, cz)) continue; U.rooms++;
      const nx = -s * o.rx, nz = -s * o.rz;
      for (const u of [-1.5, 1.5, 4.5]) { const k = i++; const [x, z] = o.L(Math.floor(u), 13 * s), fx = (u - Math.floor(u)) - 0.5;
        const [wx, wz] = o.L(Math.floor(u), 14 * s); if (!world[idx(wx, o.hy + 2, wz)] || !world[idx(wx, o.hy + 3, wz)]) continue;   /* v1.0.85: solid wall only, flush on its face */
        const px = x + 0.5 + o.fx * fx - nx * 0.46, pz = z + 0.5 + o.fz * fx - nz * 0.46, h = 2.4, w = h * AR[k], y = o.hy + 2.3;
        const fr = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.24, h + 0.24), new THREE.MeshBasicMaterial({color: 0x5a3a1a, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2}));
        fr.position.set(px, y, pz); fr.rotation.y = Math.atan2(nx, nz); grp.add(fr);
        const tx = ld.load('assets/art/user_p' + (k + 1) + '.jpg'); try { tx.colorSpace = THREE.SRGBColorSpace; } catch (_) {}
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: tx, color: 0xeeeeee, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4}));
        m.position.set(px + nx * 0.02, y, pz + nz * 0.02); m.rotation.y = fr.rotation.y; m.userData.userArt = k + 1; grp.add(m); U.n++; } } }
  setInterval(() => { try { if (!started || DIM.cur) { grp.visible = false; return; }
    const o = window.__c239 && __c239.pyr, k = o ? o.cx + ',' + o.cz + ',' + o.hy : null; if (k !== key || world !== lastW) { key = k; lastW = world; if (o) build(o); else clear(); }
    if (o) { const [x, z] = o.L(1, 0); grp.visible = Math.hypot(P.x - x, P.z - z) < 70; } } catch (e) { if (!U.err) U.err = String(e); } }, 1000);
  try { const ew = enterWorld; enterWorld = function () { try { key = null; clear(); } catch (_) {} return ew.apply(this, arguments); }; } catch (e) { U.err = String(e); }
})();
