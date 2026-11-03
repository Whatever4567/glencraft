
/* ===================== GLX-E3 (v0.9.12): simple blocky first-person arm (Minecraft-style), tool gripped in the fist ===================== */
(function blockyArm() {
  const pix = (base, n, seed) => { const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); let s = seed;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { s = (s * 16807) % 2147483647; const v = 1 + ((s % 1000) / 1000 - 0.5) * n; const col = new THREE.Color(base).multiplyScalar(v); g.fillStyle = '#' + col.getHexString(); g.fillRect(x, y, 1, 1); }
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; return t; };
  const skinM = new THREE.MeshLambertMaterial({map: pix(0xe2b08e, 0.08, 7)}), sleeveM = new THREE.MeshLambertMaterial({map: pix(0xe9e4da, 0.06, 11)}), cuffM = new THREE.MeshLambertMaterial({map: pix(0x3b5f8a, 0.1, 3)});
  // retire the old sculpted arm/hand/fingers: everything in the hand rig except the held item and the grabbed haggis
  const keep = new Set([held, typeof grabHaggis !== 'undefined' ? grabHaggis : null]);
  hand.children.slice().forEach(c => { if (!keep.has(c)) hand.remove(c); });
  if (held.parent !== hand) { held.parent && held.parent.remove(held); hand.add(held); }
  if (typeof grabHaggis !== 'undefined' && grabHaggis.parent !== hand) { grabHaggis.parent && grabHaggis.parent.remove(grabHaggis); hand.add(grabHaggis); }
  const arm = new THREE.Group(); arm.name = 'mcArm';
  const box = (w, h, d, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.z = z; arm.add(o); return o; };
  box(0.13, 0.13, 0.36, -0.06, skinM);                 // forearm + fist (one cuboid, like the block game)
  box(0.145, 0.145, 0.05, 0.13, cuffM);               // cuff band
  box(0.145, 0.145, 0.42, 0.36, sleeveM);             // sleeve to the shoulder
  arm.position.set(0, 0.0, 0.02); hand.add(arm);
  window.mcArm = arm;
  // the fist is the end of the cuboid at z = -0.24: put the held item's grip right there
  held.position.set(0, 0.02, -0.21);
  if (typeof fist !== 'undefined') fist.visible = false;
  const uh = updateHand;
  updateHand = function () { const r = uh.apply(this, arguments); if (typeof fist !== 'undefined') fist.visible = false; arm.visible = true; return r; };
  // tools: handle runs through the fist at a slight forward angle; blocks/items sit on top of the fist
  const sh = setHeld;
  setHeld = function (id) {
    const before = heldId; const r = sh.apply(this, arguments);
    if (heldId !== before) {
      const c = held.children[0];
      if (c && c.userData.tool) { c.position.set(0, 0.0, 0.0); c.rotation.set(c.userData.kind === 'sword' ? -0.8 : -0.75, 0, 0.35); c.scale.setScalar(0.85); }
      else if (c && c.userData.block) { c.position.set(0, 0.06, -0.02); }
      else if (c) c.position.set(0, 0.06, -0.02);
    }
    return r;
  };
  heldId = null; try { setHeld(selId); } catch (_) {}
})();
