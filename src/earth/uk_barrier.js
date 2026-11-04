/* GLX-UKB (v1.1.79): THE UK BARRIER. The world is only the UK now. A frosty ice wall runs all round the edge of the UK, from far below the
   ground up to high in the sky, and you cannot walk, swim, fly or dig past it. Past the wall there is nothing: no old Earth map, no sea and
   no ice ring. Space above the wall stays open, so the time box, UFO and jetpack can still fly up and out to the Moon and Mars. */
(function ukb() {
  const U = window.__ukb = {err: null, on: 0, pushed: 0, X0: -1216, X1: 1484, Z0: -628, Z1: 2756, YB: -2000, YT: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const live = () => !DIM.cur && W >= 600 && window.__c320 && __c320.flat;
  const out = U.out = (x, z) => x < U.X0 || x >= U.X1 || z < U.Z0 || z >= U.Z1;
  const band = y => y >= U.YB && y < U.YT;
  U.YT = SEA + 400;
  U.wall = (x, y, z) => live() && out(Math.floor(x), Math.floor(z)) && band(y);
  // nothing outside the UK: no land, sea or ice from the old map
  const iv = setInterval(() => { try { const e = window.__c320; if (!e || !e.earth || e.earth.ukb) return; clearInterval(iv); const e0 = e.earth;
      const f = function (x, y, z) { if (e.flat && out(x, z)) return 0; return e0.apply(this, arguments); }; for (const k in e0) f[k] = e0[k]; f.ukb = 1; e.earth = f;
      if (e.fearth && e.fearth.top && !e.fearth.top.ukb) { const t0 = e.fearth.top; const t = function (x, z) { if (e.flat && out(x, z)) return -9999; return t0.apply(this, arguments); }; t.ukb = 1; e.fearth.top = t; }
      U.on = 1; try { if (window.__c324 && __c324.cache) __c324.cache.clear(); e.dirty = 1; } catch (_) {} } catch (er) { ERR('earth', er); } }, 300);
  try { const g0 = getB; getB = function (x, y, z) { if (live() && out(Math.floor(x), Math.floor(z))) { if (band(y)) return T.ICE || T.BEDROCK || T.STONE || 1; } return g0.apply(this, arguments); }; } catch (e) { ERR('getB', e); }
  try { const so = solid; solid = function (x, y, z) { if (U.wall(x, y, z)) return true; return so.apply(this, arguments); }; } catch (e) { ERR('solid', e); }
  try { const s0 = setB; setB = function (x, y, z) { if (U.wall(x, y, z)) return; return s0.apply(this, arguments); }; } catch (e) { ERR('setB', e); }
  // if anything ever puts you past the wall inside the band, you are pushed back in
  const M = 1.5;
  try { const up = updatePlayer; updatePlayer = function () { const r = up.apply(this, arguments); try { if (live() && started && band(P.y)) { const w = window.__c321 && __c321.pW ? __c321.pW(P.x, P.y, P.z) : [P.x, P.y, P.z];
        if (Math.abs(w[0] - P.x) + Math.abs(w[1] - P.y) + Math.abs(w[2] - P.z) < 1 && out(Math.floor(P.x), Math.floor(P.z))) { P.x = Math.max(U.X0 + M, Math.min(U.X1 - M, P.x)); P.z = Math.max(U.Z0 + M, Math.min(U.Z1 - M, P.z)); U.pushed++; } } } catch (e) { ERR('upd', e); } return r; }; } catch (e) { ERR('upd0', e); }
  // the frosty ice wall you can see
  let G = null;
  function mk() { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const q = g.createLinearGradient(0, 0, 0, 256); q.addColorStop(0, 'rgba(200,235,255,.15)'); q.addColorStop(1, 'rgba(160,210,245,.55)'); g.fillStyle = q; g.fillRect(0, 0, 256, 256);
    let s = 7; const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); g.strokeStyle = 'rgba(255,255,255,.45)'; for (let i = 0; i < 60; i++) { g.lineWidth = 1 + r() * 2; g.beginPath(); let x = r() * 256, y = r() * 256; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; const m = new THREE.MeshBasicMaterial({map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false});
    G = new THREE.Group(); const y0 = SEA - 80, y1 = U.YT, h = y1 - y0, X0 = U.X0, X1 = U.X1, Z0 = U.Z0, Z1 = U.Z1;
    const side = (len, x, z, ry) => { const tt = t.clone(); tt.needsUpdate = true; tt.repeat.set(len / 64, h / 64); const mm = m.clone(); mm.map = tt; const p = new THREE.Mesh(new THREE.PlaneGeometry(len, h), mm); p.position.set(x, y0 + h / 2, z); p.rotation.y = ry; p.frustumCulled = false; p.renderOrder = 5; G.add(p); };
    side(X1 - X0, (X0 + X1) / 2, Z0, 0); side(X1 - X0, (X0 + X1) / 2, Z1, 0); side(Z1 - Z0, X0, (Z0 + Z1) / 2, Math.PI / 2); side(Z1 - Z0, X1, (Z0 + Z1) / 2, Math.PI / 2); scene.add(G); }
  setInterval(() => { try { const s = live() && typeof started !== 'undefined' && started; if (s && !G) mk(); if (G) G.visible = !!s; } catch (e) { ERR('vis', e); } }, 1000);
})();
