/* GLX-AG1222 (v1.2.22): Agartha and deep cave calm and lighter.
   1. No sky flashes underground: storm lightning (the full screen flash layer, the brighter haze and lights it drives) and far flash lights
      (volcano ash lightning, zaps) no longer reach you while you are deep under ground or in Agartha. Near lights such as your torch stay.
   2. Plants in deep caves and the Agartha tunnel are only drawn within 40 blocks of you while you are under ground (they stay in the world).
   3. The seven Agarthans: a fallback ring from the city when the stamp pass had none, each one stands on the real floor it finds under it,
      and the reason they are hidden is kept for checks. One shared painted atlas for their linen, faces and blue and white headdress. */
(function ag1222() {
  const U = window.__ag1222 = {err: null, deep: 0, flashCut: 0, lightsCut: 0, plantsHid: 0, plantsAll: 0, atlas: 0, why: ''};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const deep = () => { try { if (DIM.cur === 'agartha') return true; if (DIM.cur) return false; return typeof P !== 'undefined' && P.y < SEA - 20; } catch (_) { return false; } };
  U.isDeep = deep;
  // ---- 1. flashes ----
  try { const uw = updateWeather; updateWeather = function () { const r = uw.apply(this, arguments); try { U.deep = deep() ? 1 : 0; if (U.deep) { if (flashA > 0) U.flashCut++; flashA = 0; const fl = document.getElementById('flash'); if (fl && fl.style.opacity !== '0') fl.style.opacity = '0'; } } catch (e) { ERR('wx', e); } return r; }; } catch (e) { ERR('wxw', e); }
  const cut = [], wp = new THREE.Vector3(), cp = new THREE.Vector3();
  try { const rd = renderer.render; renderer.render = function (s, c) { if (s !== scene || !c || !U.deep) return rd.apply(this, arguments); cut.length = 0;
      try { for (const o of scene.children) if (o.isPointLight && o.intensity > 0 && o.visible) { o.getWorldPosition(wp); if (wp.distanceTo(c.getWorldPosition(cp)) > 48 || wp.y > SEA - 4) { cut.push([o, o.intensity]); o.intensity = 0; } } U.lightsCut = cut.length; } catch (e) { ERR('lc', e); }
      try { return rd.apply(this, arguments); } finally { for (const [o, v] of cut) o.intensity = v; } }; } catch (e) { ERR('rdw', e); }
  // ---- 2. plant draw distance under ground ----
  const cen = im => { let c = im.userData.__pc; if (c) return c; c = new THREE.Vector3(); const m = new THREE.Matrix4(), v = new THREE.Vector3(); const n = Math.max(1, im.count); for (let i = 0; i < n; i++) { im.getMatrixAt(i, m); c.add(v.setFromMatrixPosition(m)); } c.divideScalar(n); im.userData.__pc = c; return c; };
  let plantOff = [];
  U.plants = () => { const on = U.deep; if (!on) { for (const o of plantOff) o.visible = true; plantOff = []; U.plantsHid = 0; return; } const cam = camera.getWorldPosition(cp); let all = 0, hid = 0; const keep = [];
    scene.traverse(o => { if (!o.isInstancedMesh || o.geometry !== crossGeo) return; all++; const w = o.localToWorld(cen(o).clone()); const far = w.distanceTo(cam) > 40 + 12; if (far) { if (o.visible || o.userData.__ph) { o.visible = false; o.userData.__ph = 1; keep.push(o); hid++; } } else if (o.userData.__ph) { o.visible = true; o.userData.__ph = 0; } });
    for (const o of plantOff) if (!keep.includes(o) && o.userData.__ph) { o.visible = true; o.userData.__ph = 0; } plantOff = keep; U.plantsAll = all; U.plantsHid = hid; };
  setInterval(() => { try { if (typeof started !== 'undefined' && started) { U.deep = deep() ? 1 : 0; U.plants(); } } catch (e) { ERR('pl', e); } }, 300);
  // ---- 3. Agarthans: floor finder, fallback ring, visibility reason ----
  const solidAt = (x, y, z) => { try { const e = window.__c320; let b; if (e && e.earth) b = e.earth(x, y, z); else if (y >= 0 && y < H) b = world[idx(x, y, z)]; return !!b && !(PLANT[b]) && b !== T.WATER && b !== T.LAVA; } catch (_) { return false; } };
  U.floorAt = (x, z, y0) => { x = Math.floor(x); z = Math.floor(z); y0 = Math.round(y0); for (let d = 0; d <= 24; d++) for (const y of d ? [y0 + d, y0 - d] : [y0]) if (solidAt(x, y - 1, z) && !solidAt(x, y, z) && !solidAt(x, y + 1, z)) return y; return null; };
  U.ring = () => { const A = window.__ag1220; if (A && A.ring) return A.ring; const l = window.__agw && window.__agw.L; if (!l || !l.city) return null; const r = {X: l.city[0] + 0.5, Z: l.city[1] + 0.5, R: Math.max(6, l.city[2] * 0.5), ok: 0, Y: l.FL, fb: 1}; if (A) A.ring = r; return r; };
  // ---- shared atlas for the Agarthans (one texture, painted once) ----
  U.atlasSize = () => { try { const mx = renderer.capabilities.maxTextureSize || 2048, ph = matchMedia && matchMedia('(pointer:coarse)').matches; return Math.min(mx, ph ? 1024 : 2048); } catch (_) { return 1024; } };
  // tiles (u0, v0, u1, v1) on a 4 x 4 grid
  const TL = {linen: [0, 0], sash: [1, 0], skin: [2, 0], face: [3, 0], nemes: [0, 1], band: [1, 1], legs: [2, 1], hair: [3, 1]};
  U.tile = k => { const t = TL[k] || TL.linen; return [t[0] / 4, 1 - (t[1] + 1) / 4, (t[0] + 1) / 4, 1 - t[1] / 4]; };
  function paint(N) { const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), Q = N / 4; let sd = 1222; const r = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296;
    const at = (k, f) => { const t = TL[k]; g.save(); g.translate(t[0] * Q, t[1] * Q); g.beginPath(); g.rect(0, 0, Q, Q); g.clip(); f(Q); g.restore(); };
    const weave = (q, base, dark) => { g.fillStyle = base; g.fillRect(0, 0, q, q); for (let y = 0; y < q; y += 2) { g.fillStyle = `rgba(${dark},${0.05 + r() * 0.05})`; g.fillRect(0, y, q, 1); } for (let x = 0; x < q; x += 3) { g.fillStyle = `rgba(${dark},0.04)`; g.fillRect(x, 0, 1, q); } for (let i = 0; i < q * 2; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.08})`; g.fillRect(r() * q, r() * q, 1 + r() * 3, 1); } };
    at('linen', q => { weave(q, '#e6ecf3', '90,100,120'); for (let x = q * 0.08; x < q; x += q / 9) { const gr = g.createLinearGradient(x, 0, x + q / 18, 0); gr.addColorStop(0, 'rgba(120,135,160,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, 0, q / 18, q); } g.fillStyle = '#2f5fb8'; g.fillRect(0, q * 0.02, q, q * 0.05); g.fillStyle = '#9fc0ea'; g.fillRect(0, q * 0.075, q, q * 0.012); });
    at('legs', q => { weave(q, '#dfe6ee', '90,100,120'); for (let x = 0; x < q; x += q / 7) { g.fillStyle = 'rgba(110,125,150,0.16)'; g.fillRect(x, 0, q / 40, q); } });
    at('sash', q => { g.fillStyle = '#2a58b4'; g.fillRect(0, 0, q, q); for (let x = 0; x < q; x += q / 8) { g.fillStyle = '#e8eef6'; g.fillRect(x, 0, q / 32, q); g.fillStyle = '#cfe0f5'; g.fillRect(x + q / 16, 0, q / 64, q); } });
    at('skin', q => { g.fillStyle = '#b98a62'; g.fillRect(0, 0, q, q); for (let i = 0; i < q * 3; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '90,60,40' : '230,190,150'},${r() * 0.06})`; g.fillRect(r() * q, r() * q, 1 + r() * 2, 1 + r() * 2); } });
    at('face', q => { g.fillStyle = '#b98a62'; g.fillRect(0, 0, q, q); const ey = q * 0.42; for (const s of [-1, 1]) { const ex = q / 2 + s * q * 0.2; g.fillStyle = '#f2f4f8'; g.beginPath(); g.ellipse(ex, ey, q * 0.1, q * 0.045, 0, 0, 6.283); g.fill(); g.fillStyle = '#2a6e9e'; g.beginPath(); g.arc(ex, ey, q * 0.035, 0, 6.283); g.fill(); g.strokeStyle = '#141018'; g.lineWidth = q * 0.016; g.beginPath(); g.moveTo(ex - s * q * 0.12, ey - q * 0.01); g.quadraticCurveTo(ex, ey - q * 0.07, ex + s * q * 0.16, ey + q * 0.02); g.stroke(); g.fillStyle = '#1a1420'; g.fillRect(ex - q * 0.1, ey - q * 0.1, q * 0.2, q * 0.022); }
      g.fillStyle = 'rgba(120,80,55,0.55)'; g.fillRect(q * 0.47, q * 0.46, q * 0.06, q * 0.16); g.fillStyle = '#7a4a3a'; g.fillRect(q * 0.4, q * 0.72, q * 0.2, q * 0.03); g.fillStyle = '#2a58b4'; g.fillRect(q * 0.44, q * 0.86, q * 0.12, q * 0.14); });
    at('nemes', q => { for (let y = 0; y < q; y += q / 10) { g.fillStyle = ((y / (q / 10)) | 0) % 2 ? '#e8eef6' : '#2a58b4'; g.fillRect(0, y, q, q / 10); } g.fillStyle = '#cfe0f5'; g.fillRect(0, q * 0.9, q, q * 0.1); });
    at('band', q => { for (let y = 0; y < q; y += q / 8) { g.fillStyle = ((y / (q / 8)) | 0) % 2 ? '#f0f4fa' : '#3a6ad0'; g.fillRect(0, y, q, q / 8); } });
    at('hair', q => { g.fillStyle = '#16141c'; g.fillRect(0, 0, q, q); });
    const t = new THREE.CanvasTexture(c); try { t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); } catch (_) {} t.generateMipmaps = true; return t; }
  // box faces: +x, -x, +y, -y, +z (front), -z
  U.remap = (geo, tiles) => { const uv = geo.attributes.uv; for (let f = 0; f < 6; f++) { const [u0, v0, u1, v1] = U.tile(tiles[f] || tiles[0]); for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0)); } } uv.needsUpdate = true; return geo; };
  let ATL = null; U.mats = () => { if (!ATL) { const N = U.atlasSize(); ATL = new THREE.MeshBasicMaterial({map: paint(N)}); U.atlas = N; } return ATL; };
})();
