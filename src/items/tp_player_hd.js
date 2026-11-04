/* GLX-TPH (v1.1.54): THIRD PERSON HD PLAYER. A new smooth model with real proportions: rounded head with the face, hair, neck, shaped chest
   with a linen shirt, sash, belt, sporran and a pleated tartan kilt, two part arms with elbows and hands, two part legs with knees, socks
   and brogues. HD armour pieces are fitted to it (helmet, breastplate, pauldrons and sleeves, greaves, boots). Held items sit the same way
   they do in first person (tools upright, guns along the view), rifles are held with both hands and pistols two handed when aiming. */
(function tph() {
  const U = window.__tph = {err: null, built: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  // a box with rounded edges (keeps the six face material groups, so the face texture still maps to the front)
  let rbox = function (w, h, d, r, seg) { seg = seg || 4; const g = new THREE.BoxGeometry(w, h, d, seg, seg, seg), p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
    const nr = g.attributes.normal, ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r; for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); c.set(Math.max(-ix, Math.min(ix, v.x)), Math.max(-iy, Math.min(iy, v.y)), Math.max(-iz, Math.min(iz, v.z)));
      const o = v.clone().sub(c); if (o.lengthSq() > 1e-9) o.setLength(r); v.copy(c).add(o); p.setXYZ(i, v.x, v.y, v.z); nr.setXYZ(i, o.x / r || 0, o.y / r || 0, o.z / r || 0); } g.attributes.normal.needsUpdate = true; return g; }
  // v1.1.61: smooth shading (the normal at every point is the true rounded normal, so no hard creases) and two levels of detail per part
  const RB = rbox; let LODS = null; rbox = function (w, h, d, r, seg) { const hi = RB(w, h, d, Math.min(r * 1.35, Math.min(w, h, d) * 0.48), seg || 8); if (LODS) { const lo = RB(w, h, d, Math.min(r * 1.35, Math.min(w, h, d) * 0.48), 3); LODS.push([hi, lo]); } return hi; };
  U.rbox = rbox;
  function tex(fn, s) { const c = document.createElement('canvas'); c.width = c.height = s || 256; fn(c.getContext('2d'), s || 256); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
  let TX = null; function texs() { if (TX) return TX; TX = {
      linen: tex((g, s) => { g.fillStyle = '#eee6d6'; g.fillRect(0, 0, s, s); for (let i = 0; i < 4000; i++) { const v = 205 + Math.random() * 40 | 0; g.fillStyle = `rgba(${v},${v - 6},${v - 18},.4)`; g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 3, 1); }
        for (let i = 0; i < 14; i++) { g.strokeStyle = 'rgba(150,130,100,.12)'; g.lineWidth = 3; g.beginPath(); const x = Math.random() * s; g.moveTo(x, 0); g.bezierCurveTo(x + 20, s / 3, x - 20, s * 2 / 3, x + 10, s); g.stroke(); } }),
      leather: tex((g, s) => { g.fillStyle = '#4a2e1b'; g.fillRect(0, 0, s, s); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${30 + Math.random() * 50 | 0},${18 + Math.random() * 30 | 0},10,.35)`; g.fillRect(Math.random() * s, Math.random() * s, 2, 2); } }),
      sock: tex((g, s) => { g.fillStyle = '#e6decb'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 6) for (let x = 0; x < s; x += 6) { g.fillStyle = (x + y) % 12 ? 'rgba(160,150,130,.25)' : 'rgba(255,255,255,.2)'; g.fillRect(x, y, 5, 5); } }),
      hair: tex((g, s) => { g.fillStyle = '#4a2f1c'; g.fillRect(0, 0, s, s); for (let i = 0; i < 1800; i++) { g.strokeStyle = `rgba(${40 + Math.random() * 50 | 0},${25 + Math.random() * 25 | 0},12,.6)`; g.beginPath(); const x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); g.lineTo(x + Math.random() * 4 - 2, y + 8 + Math.random() * 10); g.stroke(); } }) };
    return TX; }
  function build(pbr) { try { playerTextures(); } catch (_) {} const T_ = texs(), g = new THREE.Group(); LODS = [];
    const std = o => { const m = new THREE.MeshStandardMaterial(Object.assign({roughness: .7, metalness: 0}, o)); return m; };
    const skin = std({color: 0xe0ac86, roughness: .5}), shirt = std({map: T_.linen, roughness: .9}), leather = std({map: T_.leather, roughness: .45}), sock = std({map: T_.sock, roughness: .95}), hair = std({map: T_.hair, roughness: .6});
    let faceM = skin, kiltM = leather; try { faceM = std({map: faceTexP, roughness: .5}); } catch (_) {} try { kiltM = std({map: tartanTex, roughness: .78, side: THREE.DoubleSide}); } catch (_) {}
    const metal = std({color: 0xd9dde0, metalness: .9, roughness: .3});
    const M = (geo, m, x, y, z, par) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; (par || g).add(o); return o; };
    const head = new THREE.Group(); head.position.y = 1.5; g.add(head);
    M(rbox(0.44, 0.48, 0.44, 0.09), [skin, skin, hair, skin, faceM, hair], 0, 0.25, 0, head);
    M(rbox(0.47, 0.13, 0.47, 0.06), hair, 0, 0.47, -0.01, head); M(rbox(0.47, 0.3, 0.08, 0.04), hair, 0, 0.3, -0.21, head);
    M(rbox(0.06, 0.08, 0.05, 0.02), skin, 0, 0.2, 0.235, head); for (const sx of [-1, 1]) M(rbox(0.04, 0.1, 0.07, 0.018), skin, sx * 0.235, 0.24, 0, head);
    M(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 14), skin, 0, 1.47, 0);
    const torso = new THREE.Group(); g.add(torso);
    M(rbox(0.5, 0.6, 0.27, 0.08), shirt, 0, 1.17, 0, torso);
    const sash = M(rbox(0.11, 0.78, 0.29, 0.03), kiltM, 0, 1.18, 0.006, torso); sash.rotation.z = 0.62;
    M(rbox(0.52, 0.08, 0.3, 0.03), leather, 0, 0.88, 0, torso); M(rbox(0.09, 0.07, 0.02, 0.01), metal, 0, 0.88, 0.155, torso);
    const kg = new THREE.CylinderGeometry(0.29, 0.37, 0.44, 40, 2, true), kp = kg.attributes.position; for (let i = 0; i < kp.count; i++) { const a = Math.atan2(kp.getZ(i), kp.getX(i)), f = 1 + 0.035 * Math.abs(Math.sin(a * 10)) * (0.5 - kp.getY(i) / 0.44); kp.setX(i, kp.getX(i) * f); kp.setZ(i, kp.getZ(i) * f); } kg.computeVertexNormals();
    const kilt = M(kg, kiltM, 0, 0.64, 0, torso); kilt.scale.z = 0.64; const kilts = [kilt];
    M(rbox(0.16, 0.18, 0.05, 0.03), leather, 0, 0.71, 0.21, torso); for (const sx of [-0.04, 0.04]) M(new THREE.SphereGeometry(0.018, 8, 6), hair, sx, 0.64, 0.24, torso);
    const arms = [], legs = [], fore = [], shin = [];
    for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * 0.33, 1.42, 0); g.add(piv);
      M(new THREE.SphereGeometry(0.1, 14, 10), shirt, 0, -0.02, 0, piv); M(rbox(0.17, 0.32, 0.17, 0.07), shirt, 0, -0.17, 0, piv);
      const el = new THREE.Group(); el.position.y = -0.32; piv.add(el); M(rbox(0.145, 0.27, 0.145, 0.06), skin, 0, -0.13, 0, el); M(rbox(0.165, 0.06, 0.165, 0.03), shirt, 0, -0.01, 0, el);
      const hnd = M(rbox(0.12, 0.13, 0.08, 0.035), skin, 0, -0.32, 0.005, el); hnd.userData.hand = 1;
      const grip = new THREE.Group(); grip.position.set(0, -0.33, 0.04); el.add(grip); piv.userData.grip = grip; piv.userData.el = el; arms.push(piv); fore.push(el); }
    for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * 0.12, 0.62, 0); g.add(piv);
      M(rbox(0.19, 0.2, 0.2, 0.08), skin, 0, -0.08, 0, piv); kilts.push(M(rbox(0.205, 0.04, 0.205, 0.02), kiltM, 0, -0.19, 0, piv));
      const kn = new THREE.Group(); kn.position.y = -0.2; piv.add(kn); M(rbox(0.2, 0.3, 0.2, 0.08), sock, 0, -0.15, 0, kn);
      M(rbox(0.22, 0.11, 0.32, 0.05), leather, 0, -0.36, 0.04, kn); piv.userData.kn = kn; legs.push(piv); shin.push(kn); }
    const lids = []; for (const sx of [-1, 1]) { const l = M(new THREE.SphereGeometry(0.052, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), skin, sx * 0.1, 0.27, 0.205, head); l.rotation.x = Math.PI / 2; l.scale.set(1, 0.35, 0.02); l.visible = false; l.castShadow = false; lids.push(l); }
    g.userData = {arms, legs, head, torso, pbr, armourParts: [], fore, shin, hd: 1, kilts, lids, blk: 1 + Math.random() * 3};
    const lm = new Map(LODS.map(([a, b]) => [a, b])); g.userData.lod = []; g.traverse(o => { if (o.isMesh) { o.castShadow = true; const lo = lm.get(o.geometry); if (lo) g.userData.lod.push([o, o.geometry, lo]); } }); LODS = null; g.userData.lv = 0;
    // hands get fingers and a thumb
    for (const el of fore) { const hn = el.children.find(c => c.userData.hand); if (!hn) continue; for (let i = 0; i < 4; i++) { const f = M((THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.014, 0.05, 3, 8) : new THREE.CylinderGeometry(0.014, 0.014, 0.078, 8)), skin, -0.039 + i * 0.026, -0.085, 0.012, hn); f.rotation.x = 0.35; } const t = M((THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.016, 0.04, 3, 8) : new THREE.CylinderGeometry(0.016, 0.016, 0.072, 8)), skin, 0.058, -0.03, 0.03, hn); t.rotation.z = 0.6; t.rotation.x = 0.4; }
    U.built++; return g; }
  // HD armour fitted to the new body
  try { const fp0 = fitPiece; fitPiece = function (add, u, slot, m) { if (!u.hd) return fp0.apply(this, arguments);
      const P_ = (par, geo, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; par.add(o); u.armourParts.push(o); return o; };
      if (slot === 0) { P_(u.head, rbox(0.52, 0.3, 0.52, 0.12), 0, 0.42, -0.01); P_(u.head, rbox(0.5, 0.06, 0.06, 0.02), 0, 0.42, 0.25); P_(u.head, rbox(0.04, 0.14, 0.04, 0.015), 0, 0.3, 0.26); for (const sx of [-1, 1]) P_(u.head, rbox(0.05, 0.3, 0.42, 0.02), sx * 0.25, 0.25, -0.02); P_(u.head, rbox(0.5, 0.36, 0.05, 0.02), 0, 0.3, -0.25); }
      if (slot === 1) { P_(u.torso, rbox(0.55, 0.56, 0.33, 0.1), 0, 1.2, 0); P_(u.torso, rbox(0.57, 0.07, 0.35, 0.03), 0, 0.93, 0); P_(u.torso, rbox(0.2, 0.3, 0.05, 0.03), 0, 1.22, 0.155);
        u.arms.forEach(a => { P_(a, new THREE.SphereGeometry(0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0.0, 0); P_(a, rbox(0.19, 0.24, 0.19, 0.07), 0, -0.18, 0); if (a.userData.el) P_(a.userData.el, rbox(0.165, 0.2, 0.165, 0.06), 0, -0.12, 0); }); }
      if (slot === 2) { const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.38, 0.3, 28, 1, true), m); sk.scale.z = 0.64; sk.position.y = 0.72; m.side = THREE.DoubleSide; u.torso.add(sk); u.armourParts.push(sk); u.legs.forEach(l => P_(l, rbox(0.22, 0.16, 0.22, 0.06), 0, -0.1, 0)); }
      if (slot === 3) u.legs.forEach(l => { const k = l.userData.kn || l; P_(k, rbox(0.23, 0.13, 0.34, 0.05), 0, -0.36, 0.04); P_(k, rbox(0.22, 0.2, 0.22, 0.06), 0, -0.2, 0); P_(k, rbox(0.12, 0.1, 0.06, 0.03), 0, -0.02, 0.1); });
    }; } catch (e) { ERR('fit', e); }
  // v1.1.57: the new model blinks again, every 2 to 6 seconds, a quick soft close and open of the eyelids
  try { const uw = updateWorldModel; let lt = performance.now(); updateWorldModel = function () { const r = uw.apply(this, arguments); try { const now = performance.now(), dt = Math.min(0.1, (now - lt) / 1000); lt = now;
      for (const m of [typeof worldModel !== 'undefined' && worldModel, typeof charModel !== 'undefined' && charModel]) { const u = m && m.userData; if (!u || !u.lids) continue; u.blk -= dt; let k = 0; if (u.blk < 0.16) k = Math.sin(Math.max(0, u.blk) / 0.16 * Math.PI); if (u.blk <= 0) u.blk = 2 + Math.random() * 4;
        for (const l of u.lids) { l.visible = k > 0.05; l.scale.z = Math.max(0.02, k); } } try { const wm = typeof worldModel !== 'undefined' && worldModel, u2 = wm && wm.userData; if (u2 && u2.lod) { const d = camera.getWorldPosition(new THREE.Vector3()).distanceTo(wm.position), lv = d > 16 ? 1 : 0; if (lv !== u2.lv) { u2.lv = lv; for (const [m, hi, lo] of u2.lod) m.geometry = lv ? lo : hi; } U.lv = lv; } } catch (_) {} } catch (_) {} return r; }; } catch (e) { ERR('blink', e); }
  // v1.1.57: leggings hide the kilt (it clipped through them) and taking them off brings it back
  try { const dm0 = dressModel; dressModel = function (m) { const r = dm0.apply(this, arguments); try { const ks = m && m.userData && m.userData.kilts; if (ks) { const on = !(armour && armour[2]); for (const k of ks) k.visible = on; } } catch (_) {} return r; }; } catch (e) { ERR('kilt', e); }
  try { buildPlayerModel = function (pbr) { return build(pbr); }; } catch (e) { ERR('bpm', e); }
  // swap any model already made
  setTimeout(function swap() { try { if (typeof worldModel !== 'undefined' && worldModel && !worldModel.userData.hd) { const v = worldModel.visible; scene.remove(worldModel); worldModel = build(false); worldModel.visible = v; scene.add(worldModel); dressModel(worldModel); heldId = -1; try { setHeld(selId); } catch (_) {} }
      if (typeof charModel !== 'undefined' && charModel && !charModel.userData.hd && typeof charScene !== 'undefined') { charScene.remove(charModel); charModel = build(true); charScene.add(charModel); dressModel(charModel); } } catch (e) { ERR('swap', e); } setTimeout(swap, 3000); }, 1500);
})();
