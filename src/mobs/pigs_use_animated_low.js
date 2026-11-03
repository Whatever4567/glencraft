/* GLX-C257 (v1.0.69): pigs use the animated low-poly Pig (Quaternius, CC0, walk / idle / eat / run) instead of the photo blob,
   re-skinned with the players own pig photo: the face and snout are projected onto the head from the front, the rest of the body
   gets the photo's pink wrinkled skin. Hitbox, AI, sounds and mud rolling are untouched. */
(() => {
  const U = window.__c257 = {on: 1, err: null, done: 0};
  const C = window.__c135; if (!C || !C.post) { U.on = 0; return; }
  const rd = (a, i, c) => { const v = a.isInterleavedBufferAttribute ? a.data.array[i * a.data.stride + a.offset + c] : a.array[i * a.itemSize + c]; if (!a.normalized) return v; const A = a.array, mx = A instanceof Int8Array ? 127 : A instanceof Uint8Array ? 255 : A instanceof Int16Array ? 32767 : A instanceof Uint16Array ? 65535 : 1; return Math.max(v / mx, -1); };
  function remap(geo) { if (geo.userData.c257) return; geo.userData.c257 = 1; const p = geo.attributes.position, n = p.count, uv = new Float32Array(n * 2);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9; for (let i = 0; i < n; i++) { const x = rd(p, i, 0), y = rd(p, i, 1), z = rd(p, i, 2); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const zh = z0 + (z1 - z0) * 0.68; let hx = 0, hy0 = 1e9, hy1 = -1e9; for (let i = 0; i < n; i++) if (rd(p, i, 2) > zh) { hx = Math.max(hx, Math.abs(rd(p, i, 0))); hy0 = Math.min(hy0, rd(p, i, 1)); hy1 = Math.max(hy1, rd(p, i, 1)); }
    hx = hx || 1; const hh = Math.max(1e-3, hy1 - hy0);
    for (let i = 0; i < n; i++) { const x = rd(p, i, 0), y = rd(p, i, 1), z = rd(p, i, 2); let u, v;
      if (z > zh) { u = 0.47 + (x / hx) * 0.47; v = 0.04 + ((y - hy0) / hh) * 0.9; }   // face: snout centre-left, eyes top
      else { const t = (z - z0) / Math.max(1e-3, zh - z0), w = (y - y0) / Math.max(1e-3, y1 - y0); u = 0.62 + t * 0.3 * (x >= 0 ? 1 : 0.85); v = 0.08 + w * 0.42; }  // body: pink wrinkled cheek skin
      uv[i * 2] = Math.min(0.99, Math.max(0.01, u)); uv[i * 2 + 1] = Math.min(0.99, Math.max(0.01, v)); }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
  C.post.push((a, c, M, m, hd, s, mats) => { if (a.kind !== 'pig' || c.f !== 'pig' || !U.on) return; const T = window.__c238 && __c238.tex; if (!T) return;
    try { m.traverse(o => { if (!o.isMesh) return; remap(o.geometry); for (const mm of [].concat(o.material)) { mm.map = T; mm.vertexColors = false; mm.color.setRGB(1, 1, 1); mm.needsUpdate = true; } }); U.done++; } catch (e) { U.err = String(e).slice(0, 200); } });
})();
