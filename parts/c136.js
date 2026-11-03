/* ===================== GLX-C136 (v1.0.17): HD models batch 2 + Glencraft dressing (palette recolours, tartan trews, tam o' shanters, sheep fleece colours) ===================== */
(function c136() {
  const U = window.__c135; if (!U) return;
  // ---- helpers usable by any later batch: c.pal (swatch recolour, object or fn(a)), c.mcol (colour by material name), c.op (see-through), c.emis, c.tartan (material names), c.tam ('auto' | true) ----
  const hex = h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  const PT = new Map();
  function palTex(src, pal) { const key = src.uuid + JSON.stringify(pal); if (PT.has(key)) return PT.get(key);
    const im = src.image, cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, cv.width, cv.height), p = d.data, L = Object.entries(pal).map(([f, t]) => [hex(f), hex(t)]);
    for (let i = 0; i < p.length; i += 4) for (const [f, t] of L) if (Math.abs(p[i] - f[0]) < 5 && Math.abs(p[i + 1] - f[1]) < 5 && Math.abs(p[i + 2] - f[2]) < 5) { p[i] = t[0]; p[i + 1] = t[1]; p[i + 2] = t[2]; break; }
    x.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(cv); for (const k of ['flipY', 'encoding', 'magFilter', 'minFilter', 'wrapS', 'wrapT', 'generateMipmaps']) t[k] = src[k]; t.needsUpdate = true; PT.set(key, t); return t; }
  let TT = null; const tartan = () => { if (TT) return TT; try { playerTextures(); } catch (_) {} if (typeof tartanTex === 'undefined' || !tartanTex) return null; TT = tartanTex.clone(); TT.needsUpdate = true; TT.wrapS = TT.wrapT = THREE.RepeatWrapping; TT.repeat.set(1, 1); return TT; };
  const rd = (a, i, c) => { const v = a.isInterleavedBufferAttribute ? a.data.array[i * a.data.stride + a.offset + c] : a.array[i * a.itemSize + c]; if (!a.normalized) return v; const A = a.array, mx = A instanceof Int8Array ? 127 : A instanceof Uint8Array ? 255 : A instanceof Int16Array ? 32767 : A instanceof Uint16Array ? 65535 : 1; return Math.max(v / mx, -1); };
  function planarUV(geo, k) { if (geo.userData.tuv) return; geo.userData.tuv = 1; const p = geo.attributes.position, uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) { const x = rd(p, i, 0), y = rd(p, i, 1), z = rd(p, i, 2); uv[i * 2] = (x + z) * k; uv[i * 2 + 1] = y * k; } geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
  const hasTartan = a => { let t = false; a.g.traverse(o => { if (o.isMesh && !(o.userData && o.userData.hd)) for (const mm of [].concat(o.material)) if (mm && typeof tartanTex !== 'undefined' && tartanTex && mm.map === tartanTex) t = true; }); return t; };
  // top of the head, in the model group's space, from the vertices the head bone moves
  // the procedural tam (a tartan cylinder) gives where the hat sits and how big, in the mob group's space
  function procCap(a) { let cap = null; a.g.updateMatrixWorld(true); a.g.traverse(o => { if (!cap && o.isMesh && !(o.userData && o.userData.hd) && o.geometry && o.geometry.type === 'CylinderGeometry' && (o.geometry.parameters.radiusTop || 0) >= 0.1 && [].concat(o.material).some(mm => mm && mm.map)) cap = o; }); if (!cap) return null;
    const p = new THREE.Vector3(), q = new THREE.Vector3(), gs = new THREE.Vector3(); cap.getWorldPosition(p); cap.getWorldScale(q); a.g.getWorldScale(gs); a.g.worldToLocal(p);
    return {p, r: (cap.geometry.parameters.radiusTop || 0.15) * q.x / (gs.x || 1)}; }
  // head bone + the box of the vertices it moves (rest pose, same space)
  function headTop(m, hd) { let bone = null; m.traverse(o => { if (!bone && o.isBone && /^head$/i.test(o.name)) bone = o; }); if (!bone) return null;
    hd.updateMatrixWorld(true); const v = new THREE.Vector3(), b = new THREE.Box3();
    m.traverse(o => { if (!o.isSkinnedMesh) return; const bi = o.skeleton.bones.indexOf(bone); if (bi < 0) return; const p = o.geometry.attributes.position, si = o.geometry.attributes.skinIndex, sw = o.geometry.attributes.skinWeight;
      for (let i = 0; i < p.count; i++) { let w = 0; for (let k = 0; k < 4; k++) if (rd(si, i, k) === bi) w += rd(sw, i, k); if (w < 0.5) continue;
        b.expandByPoint(v.set(rd(p, i, 0), rd(p, i, 1), rd(p, i, 2)).applyMatrix4(o.bindMatrix).applyMatrix4(o.skeleton.boneInverses[bi]).applyMatrix4(bone.matrixWorld).applyMatrix4(o.bindMatrixInverse).applyMatrix4(o.matrixWorld)); } });
    return b.isEmpty() ? null : {bone, b}; }
  U.headTop = headTop;
  U.rd = rd;
  // recolour one swatch on the head only (e.g. a mallard's green head): vertex colours on head-bone vertices whose texel matches, once per geometry
  const M4 = new THREE.Matrix4(), T3 = new THREE.Vector3(), W3 = new THREE.Vector3();
  function spos(o, i, v) { const A = o.geometry.attributes; v.set(rd(A.position, i, 0), rd(A.position, i, 1), rd(A.position, i, 2)).applyMatrix4(o.bindMatrix); T3.set(0, 0, 0);
    for (let k = 0; k < 4; k++) { const w = rd(A.skinWeight, i, k); if (!w) continue; const bi = rd(A.skinIndex, i, k); M4.multiplyMatrices(o.skeleton.bones[bi].matrixWorld, o.skeleton.boneInverses[bi]); T3.addScaledVector(W3.copy(v).applyMatrix4(M4), w); }
    return v.copy(T3).applyMatrix4(o.bindMatrixInverse).applyMatrix4(o.matrixWorld); }
  U.spos = spos;
  // hc = [texel hex, new hex, top fraction]: with a fraction, vertices in the top part of the model (for rigs with no head bone)
  function headCol(m, hc, hd) { let bone = null; m.traverse(o => { if (!bone && o.isBone && /^head$/i.test(o.name)) bone = o; }); if (!bone && !hc[2]) return; const f = hex(hc[0]), t = hex(hc[1]); hd.updateMatrixWorld(true); const v = new THREE.Vector3();
    m.traverse(o => { if (!o.isSkinnedMesh || o.geometry.userData.hc) return; const g = o.geometry, A = g.attributes, mt = [].concat(o.material)[0], im = mt && mt.map && mt.map.image, col = A.color, bi = bone ? o.skeleton.bones.indexOf(bone) : -1; if (!im || !col || !A.uv || (!hc[2] && bi < 0)) return; g.userData.hc = 1;
      let y0 = 1e9, y1 = -1e9; if (hc[2]) for (let i = 0; i < A.position.count; i++) { const y = spos(o, i, v).y; y0 = Math.min(y0, y); y1 = Math.max(y1, y); } const yc = y0 + (y1 - y0) * (hc[2] || 0);
      const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0); const px = x.getImageData(0, 0, cv.width, cv.height).data, W = cv.width, H = cv.height, fy = mt.map.flipY;
      const ca = col.isInterleavedBufferAttribute ? col.data.array : col.array, st = col.isInterleavedBufferAttribute ? col.data.stride : col.itemSize, of = col.isInterleavedBufferAttribute ? col.offset : 0, sc = ca instanceof Uint8Array ? 255 : ca instanceof Uint16Array ? 65535 : 1;
      for (let i = 0; i < A.position.count; i++) { if (hc[2]) { if (spos(o, i, v).y < yc) continue; } else { let w = 0; for (let k = 0; k < 4; k++) if (rd(A.skinIndex, i, k) === bi) w += rd(A.skinWeight, i, k); if (w < 0.5) continue; }
        let u = rd(A.uv, i, 0), q = rd(A.uv, i, 1); u -= Math.floor(u); q -= Math.floor(q); const X = Math.min(W - 1, (u * W) | 0), Y = Math.min(H - 1, ((fy ? 1 - q : q) * H) | 0), j = (Y * W + X) * 4;
        if (Math.abs(px[j] - f[0]) > 6 || Math.abs(px[j + 1] - f[1]) > 6 || Math.abs(px[j + 2] - f[2]) > 6) continue;
        for (let c = 0; c < 3; c++) ca[i * st + of + c] = Math.round(Math.min(1, t[c] / Math.max(1, f[c])) * sc); }
      (col.isInterleavedBufferAttribute ? col.data : col).needsUpdate = true; }); }
  function addTam(a, m, hd) { const T = tartan(), pc = procCap(a), h = headTop(m, hd); if (!T || !pc || !h) return null; const w = Math.min(h.b.max.x - h.b.min.x, h.b.max.z - h.b.min.z), r = Math.min(0.42 * w, Math.max(pc.r * 1.25, 0.3 * w));
    const tm = new THREE.MeshLambertMaterial({map: T}), pom = new THREE.MeshLambertMaterial({color: 0xc0262d}), g = new THREE.Group();
    const rk = Math.round(r * 100), GC = addTam.G || (addTam.G = {}), gg = GC[rk] || (GC[rk] = [new THREE.CylinderGeometry(rk / 100, rk * 0.0078, rk * 0.0034, 16), new THREE.SphereGeometry(rk * 0.0024, 8, 6)]); const cap = new THREE.Mesh(gg[0], tm); cap.rotation.z = -0.22; g.add(cap);
    const p = new THREE.Mesh(gg[1], pom); p.position.set(r * 0.08, r * 0.3, 0); g.add(p);
    g.position.set((h.b.min.x + h.b.max.x) / 2, h.b.max.y + r * 0.1, (h.b.min.z + h.b.max.z) / 2); g.updateMatrixWorld(true); h.bone.attach(g); g.userData.hd = 1; cap.userData.hd = p.userData.hd = 1; return [tm, pom]; }
  U.post.push((a, c, M, m, hd, s, mats) => {
    let pal = typeof c.pal === 'function' ? c.pal(a) : c.pal;
    for (const nm of mats) {
      if (pal && nm.map && nm.map.image) nm.map = palTex(nm.map, pal);
      if (c.mcol && c.mcol[nm.name] !== undefined) nm.color.setHex(c.mcol[nm.name]);
      if (c.op) { nm.transparent = true; nm.opacity = c.op; nm.depthWrite = false; }
      if (c.emis && nm.emissive) nm.emissive.setHex(c.emis);
      if (c.tartan && c.tartan.includes(nm.name)) { const T = tartan(); if (T) { nm.map = T; nm.color.setHex(0xffffff); } }
    }
    if (c.tartan) m.traverse(o => { if (o.isMesh && [].concat(o.material).some(x => c.tartan.includes(x.name))) planarUV(o.geometry, c.tartanK || 3.2); });
    if (c.headCol) try { headCol(m, c.headCol, hd); } catch (e) { U.err.push('headCol ' + e); }
    if (c.tam === true || (c.tam === 'auto' && procCap(a))) { const tm = addTam(a, m, hd); if (tm) tm.forEach(x => mats.push(x)); }
  });
  // ---- sheep fleece colours: mostly white, some cream / grey / brown / black (picked once per sheep) ----
  const WOOL = [[0.64, 'f2efe6'], [0.78, 'e4d6b4'], [0.88, '8c8a86'], [0.95, '6e5038'], [1, '2e2a28']];
  U.cat.sheep.pal = a => { if (!a.__wool) { const r = Math.random(); a.__wool = WOOL.find(w => r < w[0])[1]; } return {'9f9f9f': a.__wool}; };
  U.cat.sheep.tam = 'auto';
  // v1.0.109: new textured sheep model; fleece colour now tints the whole texture (white sheep stay as painted)
  U.cat.sheep.f = 'sheep2'; U.cat.sheep.yaw = Math.PI; const woolPal = U.cat.sheep.pal; U.cat.sheep.pal = null;
  U.post.push((a, c, M, m) => { if (a.kind !== 'sheep' || c.f !== 'sheep2') return; woolPal(a); const w = a.__wool; if (!w || w === 'f2efe6') return;
    const col = new THREE.Color('#' + w); m.traverse(o => { if (o.isMesh) for (const mm of [].concat(o.material)) mm.color && mm.color.copy(col).lerp(new THREE.Color(1, 1, 1), 0.25); }); });
  if (U.cat.clansman) U.cat.clansman.tartan = ['Pants'];
  U.add({
    pig: {f: 'pig2', k: 1.0},
    duck: {f: 'duck', k: 1.0, pal: {'9f9f9f': 'b3ab9c', '7e2648': '2f7a3e', '895123': 'e0a02a'}, headCol: ['b3ab9c', '2f7a3e', 0.62]},
    haggis: {f: 'haggis', k: 1.0, pal: {'674d3b': '8a6a54', '3c2815': '5c4030'}, tam: 'auto'},
    imp: {f: 'imp', k: 1.0},
    ghost: {f: 'ghost', k: 1.0, mcol: {Ghost_Main: 0xe8e4f0}, op: 0.62},
    blazeskel: {f: 'skeleton', k: 1.0, walk: 'run', mcol: {Skeleton: 0xffa860}, emis: 0x5a1a00},
    dragon: {f: 'dragon', h: 8, walk: 'idle', run: 0}
  });
  // ---- drop cached models from older versions ----
  try { if (window.caches && isSecureContext) caches.open('glencraft-models').then(c => c.keys().then(ks => ks.forEach(r => { if (!r.url.endsWith("?" + U.VER)) c.delete(r); }))).catch(() => {}); } catch (_) {}
})();
