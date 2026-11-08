  function build(pbr) { try { playerTextures(); } catch (_) {} const T_ = texs(), g = new THREE.Group(); LODS = [];
    /* v1.2.26: the detailed player. Same kilted Highlander, same pivots, hand grips, knee and elbow joints and eyelids as before, with a
       slimmer build (narrower chest and waist, thinner arms and legs), tapered round limbs, a shirt collar and rolled cuffs, a pleated kilt with
       a hem, kilt pin, belt buckle, sporran with tassels, sock flashes, a sgian dubh, brogues with soles and laces, ears, brows and layered
       hair, and finer cloth, leather and knit textures with bump and shine. Low detail copies of every round part swap in far away. */
    const rb = rbox;   // every rounded box goes through the low detail wrapper
    const std = o => new THREE.MeshStandardMaterial(Object.assign({roughness: .7, metalness: 0}, o));
    const skin = std({color: 0xe0ac86, roughness: .48}), shirt = std({map: T_.linen, bumpMap: T_.linen, bumpScale: 0.6, roughness: .88}), leather = std({map: T_.leather, bumpMap: T_.leather, bumpScale: 0.8, roughness: .38, metalness: .05}),
      sole = std({color: 0x1c120b, roughness: .6}), sock = std({map: T_.sock, bumpMap: T_.sock, bumpScale: 0.9, roughness: .95}), hair = std({map: T_.hair, bumpMap: T_.hair, bumpScale: 1, roughness: .55}), fur = std({map: T_.fur, roughness: .9});
    let faceM = skin, kiltM = leather; try { faceM = std({map: faceTexP, roughness: .48}); } catch (_) {} try { kiltM = std({map: tartanTex, bumpMap: T_.weave, bumpScale: 0.5, roughness: .74, side: THREE.DoubleSide}); } catch (_) {}
    const metal = std({color: 0xd9dde0, metalness: .9, roughness: .25}), dark = std({color: 0x15100c, roughness: .4});
    const M = (geo, m, x, y, z, par) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; (par || g).add(o); return o; };
    // a round tapered limb: profile [y, r] from bottom to top, closed with round ends; a low detail copy for distance
    const lathe = (prof, sx, sz, seg) => { const mk = n => { const pts = prof.map(([y, r]) => new THREE.Vector2(r, y)); const ge = new THREE.LatheGeometry(pts, n); ge.scale(sx || 1, 1, sz || 1); ge.computeVertexNormals(); return ge; };
      const hi = mk(seg || 20); if (LODS) LODS.push([hi, mk(8)]); return hi; };
    const capP = (y0, y1, r0, r1, bul) => { const P = [[y0 - r0 * 0.9, 0.001], [y0 - r0 * 0.75, r0 * 0.6], [y0 - r0 * 0.35, r0 * 0.93], [y0, r0]]; for (let i = 1; i < 6; i++) { const t = i / 6; P.push([y0 + (y1 - y0) * t, r0 + (r1 - r0) * t + (bul || 0) * Math.sin(Math.PI * t)]); } P.push([y1, r1], [y1 + r1 * 0.35, r1 * 0.93], [y1 + r1 * 0.75, r1 * 0.6], [y1 + r1 * 0.9, 0.001]); return P; };
    // head: same block head with the face (eyelids line up with it), now with ears, brows, a fuller nose and layered hair
    const head = new THREE.Group(); head.position.y = 1.5; g.add(head);
    M(rb(0.44, 0.48, 0.44, 0.09), [skin, skin, hair, skin, faceM, hair], 0, 0.25, 0, head);
    M(rb(0.47, 0.12, 0.47, 0.06), hair, 0, 0.475, -0.01, head); M(rb(0.47, 0.3, 0.08, 0.04), hair, 0, 0.3, -0.21, head);
    for (let i = 0; i < 7; i++) { const s = M(rb(0.075, 0.06, 0.05, 0.02), hair, -0.18 + i * 0.06, 0.43 - (i % 2) * 0.012, 0.205, head); s.rotation.z = (i - 3) * 0.08; s.rotation.x = -0.25; }   // fringe locks
    for (const sx of [-1, 1]) { M(rb(0.05, 0.22, 0.3, 0.02), hair, sx * 0.225, 0.36, -0.06, head); const b = M(rb(0.09, 0.022, 0.02, 0.009), hair, sx * 0.1, 0.335, 0.222, head); b.rotation.z = -sx * 0.12; }   // sideburns, brows
    M(lathe([[-0.04, 0.001], [-0.035, 0.02], [0, 0.03], [0.04, 0.018], [0.05, 0.001]], 0.85, 1.1, 14), skin, 0, 0.2, 0.235, head).rotation.x = -Math.PI / 2 + 0.25;   // nose
    for (const sx of [-1, 1]) { const e = M(new THREE.SphereGeometry(0.05, 14, 10), skin, sx * 0.226, 0.24, 0, head); e.scale.set(0.35, 1.05, 0.7); M(new THREE.TorusGeometry(0.03, 0.008, 6, 14), skin, sx * 0.24, 0.24, 0.002, head).rotation.y = Math.PI / 2; }   // ears
    M(lathe([[0, 0.085], [0.07, 0.075], [0.14, 0.08]], 1, 1, 20), skin, 0, 1.4, 0);   // neck
    // torso: slimmer, tapered chest (waist 0.4 wide, chest 0.44), collar, sash, belt and buckle, kilt pin
    const torso = new THREE.Group(); g.add(torso);
    M(lathe([[0.86, 0.001], [0.865, 0.19], [0.95, 0.2], [1.1, 0.215], [1.28, 0.22], [1.4, 0.2], [1.45, 0.14], [1.47, 0.001]], 1, 0.62, 28), shirt, 0, 0, 0, torso);
    M(new THREE.TorusGeometry(0.085, 0.022, 8, 20, Math.PI * 1.6), shirt, 0, 1.43, 0.01, torso).rotation.set(Math.PI / 2, 0, Math.PI * 0.7);   // open collar
    M(rb(0.012, 0.3, 0.01, 0.004), shirt, 0, 1.24, 0.138, torso);   // placket
    const sash = M(rb(0.1, 0.76, 0.3, 0.03), kiltM, 0, 1.18, 0.004, torso); sash.rotation.z = 0.62;
    M(lathe([[0, 0.205], [0.075, 0.205]], 1, 0.64, 32), leather, 0, 0.845, 0, torso);
    M(rb(0.08, 0.065, 0.02, 0.008), metal, 0, 0.88, 0.135, torso); M(rb(0.05, 0.04, 0.024, 0.006), dark, 0, 0.88, 0.136, torso);
    // pleated kilt: 18 sharp box pleats (more round steps than before), a hem band, kilt pin on the apron
    const kg = new THREE.CylinderGeometry(0.235, 0.33, 0.44, 108, 3, true), kp = kg.attributes.position; for (let i = 0; i < kp.count; i++) { const a = Math.atan2(kp.getZ(i), kp.getX(i)), ph = (a / (Math.PI * 2) * 18 + 18) % 1, saw = ph < 0.5 ? ph * 2 : (1 - ph) * 2, back = Math.max(0, -Math.sin(a)), f = 1 + 0.05 * saw * back * (0.6 - kp.getY(i) / 0.44); kp.setX(i, kp.getX(i) * f); kp.setZ(i, kp.getZ(i) * f); } kg.computeVertexNormals();
    const kilt = M(kg, kiltM, 0, 0.64, 0, torso); kilt.scale.z = 0.64; const kilts = [kilt];
    kilts.push(M(lathe([[0, 0.338], [0.03, 0.336]], 1, 0.64, 48), kiltM, 0, 0.42, 0, torso));
    M(rb(0.012, 0.09, 0.01, 0.004), metal, 0.12, 0.55, 0.22, torso);
    // sporran: pouch, flap, cantle and three tassels
    M(lathe([[0.62, 0.001], [0.63, 0.06], [0.68, 0.08], [0.74, 0.075], [0.79, 0.06], [0.8, 0.001]], 1, 0.32, 18), fur, 0, 0, 0.21, torso);
    M(rb(0.15, 0.06, 0.03, 0.012), leather, 0, 0.77, 0.228, torso); M(rb(0.15, 0.02, 0.035, 0.008), metal, 0, 0.8, 0.228, torso);
    for (const sx of [-0.04, 0, 0.04]) { M(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6), leather, sx, 0.69, 0.245, torso); M(new THREE.SphereGeometry(0.016, 10, 8), hair, sx, 0.645, 0.245, torso).scale.y = 1.5; }
    const arms = [], legs = [], fore = [], shin = [];
    // arms: same shoulder pivot, elbow at -0.32 and hand grip; thinner tapered sleeves and forearms, rolled cuff
    for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * 0.33, 1.42, 0); g.add(piv);
      M(new THREE.SphereGeometry(0.085, 18, 12), shirt, -sx * 0.01, -0.02, 0, piv); M(lathe(capP(-0.3, -0.04, 0.058, 0.07, 0.006), 1, 1, 18), shirt, 0, 0, 0, piv);
      const el = new THREE.Group(); el.position.y = -0.32; piv.add(el);
      M(lathe(capP(-0.27, -0.02, 0.043, 0.054, 0.007), 1, 1, 18), skin, 0, 0, 0, el); M(new THREE.TorusGeometry(0.056, 0.018, 8, 18), shirt, 0, -0.02, 0, el).rotation.x = Math.PI / 2;
      const hnd = M(rb(0.1, 0.12, 0.065, 0.03), skin, 0, -0.32, 0.005, el); hnd.userData.hand = 1;
      const grip = new THREE.Group(); grip.position.set(0, -0.33, 0.04); el.add(grip); piv.userData.grip = grip; piv.userData.el = el; arms.push(piv); fore.push(el); }
    // legs: same hip pivot and knee; slim thigh under the kilt, ribbed sock with calf, flashes, sgian dubh, brogue with sole, toe cap and laces
    for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * 0.12, 0.62, 0); g.add(piv);
      M(lathe(capP(-0.19, 0.0, 0.07, 0.085), 1, 1, 18), skin, 0, 0, 0, piv); kilts.push(M(lathe([[-0.2, 0.077], [-0.17, 0.08]], 1, 1, 18), kiltM, 0, 0, 0, piv));
      const kn = new THREE.Group(); kn.position.y = -0.2; piv.add(kn);
      M(lathe(capP(-0.3, -0.02, 0.05, 0.068, 0.012), 1, 1, 18), sock, 0, 0, 0, kn); M(lathe([[-0.06, 0.07], [-0.02, 0.071]], 1, 1, 18), sock, 0, 0, 0, kn);
      for (const dz of [-0.025, 0.025]) M(rb(0.012, 0.07, 0.02, 0.004), kiltM, sx * 0.071, -0.09, dz, kn);   // garter flashes
      if (sx > 0) { M(rb(0.018, 0.06, 0.022, 0.007), dark, 0.066, -0.04, 0.02, kn); M(new THREE.SphereGeometry(0.009, 8, 6), metal, 0.066, -0.005, 0.02, kn); }   // sgian dubh
      M(rb(0.14, 0.024, 0.3, 0.01), sole, 0, -0.4025, 0.04, kn); M(rb(0.125, 0.075, 0.27, 0.035), leather, 0, -0.355, 0.035, kn);
      const toe = M(new THREE.SphereGeometry(0.064, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), leather, 0, -0.39, 0.13, kn); toe.scale.set(1, 0.7, 1.05);
      for (let i = 0; i < 3; i++) M(rb(0.07, 0.008, 0.012, 0.003), dark, 0, -0.315 + i * 0.002, 0.06 + i * 0.03, kn).rotation.x = -0.3;
      piv.userData.kn = kn; legs.push(piv); shin.push(kn); }
    const lids = []; for (const sx of [-1, 1]) { const l = M(new THREE.SphereGeometry(0.052, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), skin, sx * 0.1, 0.27, 0.205, head); l.rotation.x = Math.PI / 2; l.scale.set(1, 0.35, 0.02); l.visible = false; l.castShadow = false; lids.push(l); }
    // v1.2.26: fewer draw calls. Inside each moving part (head, torso, each arm, elbow, leg, knee) the static pieces that share a material are
    // baked into one mesh. Near: every piece. Far (over 16 blocks): the low detail round parts and no small extras (laces, tassels, flashes ..).
    // Kept separate: the face block (6 materials), hands and fingers (they move), eyelids (blink), kilt pieces (leggings hide them).
    { const lo0 = new Map(LODS.map(([a, b]) => [a, b])), keep = new Set([...kilts, ...lids]), merged = [];
      // low detail copies of the plain round pieces (spheres, rings, rods) from their own parameters
      const EMPTY = new THREE.BufferGeometry(); EMPTY.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3)); EMPTY.setIndex([]);   // all pieces are small extras: nothing far away
      const loGeo = ge => { const q = ge.parameters || {}; try { if (ge.type === 'SphereGeometry') return new THREE.SphereGeometry(q.radius, 8, 5, q.phiStart, q.phiLength, q.thetaStart, q.thetaLength); if (ge.type === 'TorusGeometry') return new THREE.TorusGeometry(q.radius, q.tube, 4, 8, q.arc); if (ge.type === 'CapsuleGeometry') return new THREE.CapsuleGeometry(q.radius, q.length ?? q.height, 2, 5); if (ge.type === 'CylinderGeometry') return new THREE.CylinderGeometry(q.radiusTop, q.radiusBottom, q.height, 6, 1, q.openEnded); } catch (_) {} return ge; };
      const bake = (list, far) => { let nv = 0, ni = 0; const parts = []; for (const o of list) { let ge = far ? (lo0.get(o.geometry) || loGeo(o.geometry)) : o.geometry; if (far) { const g0 = o.geometry; if (!g0.boundingSphere) g0.computeBoundingSphere(); if (g0.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z) < 0.045) continue; }   /* small extras are left out far away */ parts.push([ge, o]); nv += ge.attributes.position.count; ni += ge.index ? ge.index.count : ge.attributes.position.count; }
        if (!parts.length) return null; const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), UV = new Float32Array(nv * 2), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni), v = new THREE.Vector3(), mx = new THREE.Matrix4(), nm = new THREE.Matrix3(); let vo = 0, io = 0;
        for (const [ge, o] of parts) { o.updateMatrix(); mx.copy(o.matrix); nm.getNormalMatrix(mx); const pa = ge.attributes.position, na = ge.attributes.normal, ua = ge.attributes.uv;
          for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(mx); P.set([v.x, v.y, v.z], (vo + i) * 3); if (na) { v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); N.set([v.x, v.y, v.z], (vo + i) * 3); } if (ua) { UV[(vo + i) * 2] = ua.getX(i); UV[(vo + i) * 2 + 1] = ua.getY(i); } }
          if (ge.index) for (let i = 0; i < ge.index.count; i++) I[io++] = ge.index.getX(i) + vo; else for (let i = 0; i < pa.count; i++) I[io++] = i + vo; vo += pa.count; }
        const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); out.setIndex(new THREE.BufferAttribute(I, 1)); out.computeBoundingSphere(); return out; };
      const pars = []; g.traverse(o => { if (o.isGroup || o === g) pars.push(o); });
      for (const par of pars) { const by = new Map(); for (const o of par.children) { if (!o.isMesh || Array.isArray(o.material) || keep.has(o) || o.userData.hand || o.children.length) continue; const k = o.material; (by.get(k) || by.set(k, []).get(k)).push(o); }
        for (const [mat, list] of by) { if (list.length < 2) continue; const hi = bake(list, false), lo = bake(list, true); for (const o of list) par.remove(o); const m = new THREE.Mesh(hi, mat); m.castShadow = true; m.receiveShadow = true; m.userData.merged = list.length; par.add(m); merged.push([m, hi, lo]); } }
      LODS.push(...merged.map(([m, hi, lo]) => [hi, lo || EMPTY]));
      const has = new Set(LODS.map(e => e[0])); g.traverse(o => { if (o.isMesh && !has.has(o.geometry)) { const l = loGeo(o.geometry); if (l !== o.geometry) { LODS.push([o.geometry, l]); has.add(o.geometry); } } }); }
    g.userData = {arms, legs, head, torso, pbr, armourParts: [], fore, shin, hd: 1, kilts, lids, blk: 1 + Math.random() * 3, detail: 1226};
    const lm = new Map(LODS.map(([a, b]) => [a, b])); g.userData.lod = []; g.traverse(o => { if (o.isMesh) { o.castShadow = true; const lo = lm.get(o.geometry); if (lo) g.userData.lod.push([o, o.geometry, lo]); } }); LODS = null; g.userData.lv = 0;
    // hands: four fingers and a thumb, a touch slimmer to match the hand
    for (const el of fore) { const hn = el.children.find(c => c.userData.hand); if (!hn) continue; for (let i = 0; i < 4; i++) { const f = M((THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.0115, 0.05, 3, 8) : new THREE.CylinderGeometry(0.0115, 0.0115, 0.073, 8)), skin, -0.033 + i * 0.022, -0.085, 0.01, hn); f.rotation.x = 0.35; (hn.userData.fg || (hn.userData.fg = [])).push(f); } const t = M((THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.014, 0.04, 3, 8) : new THREE.CylinderGeometry(0.014, 0.014, 0.068, 8)), skin, 0.05, -0.03, 0.026, hn); t.rotation.z = 0.6; t.rotation.x = 0.4; }
    { const cl = new Map(); for (const el of fore) el.traverse(o => { if (o.isMesh && o.geometry.type === 'CapsuleGeometry' && !g.userData.lod.some(e => e[0] === o)) { const q = o.geometry.parameters; let l = cl.get(o.geometry); if (!l) cl.set(o.geometry, l = new THREE.CapsuleGeometry(q.radius, q.length ?? q.height, 2, 5)); g.userData.lod.push([o, o.geometry, l]); } }); }   // fingers: low detail far away
    U.built++; return g; }
