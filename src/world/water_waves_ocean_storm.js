/* GLX-C369 (v1.1.70, item 40): water behaves by kind. Only the open sea has waves. Rivers keep their one way flowing stream and
   ponds and lakes lie still, rippling in rings only when you step or fall in. In a thunderstorm the sea waves get big and wild and
   a strong wind pushes you about when you are out in the open. */
(function c369() {
  const U = window.__c369 = {err: null, oc: 0, st: 0};
  const u = {uWv: {value: 1}, uRp: {value: new THREE.Vector4(0, 0, -99, 0)}};
  const col = new Map(); let lastW = null;
  function ocean(x, z) { const k = x * 4096 + z; let v = col.get(k); if (v !== undefined) return v; let n = 0;
    for (let a = 0; a < 8; a++) { const q = a * Math.PI / 4; if (getB(Math.round(x + Math.cos(q) * 9), SEA - 1, Math.round(z + Math.sin(q) * 9)) === T.WATER) n++; }
    v = n >= 7 ? 1 : 0; col.set(k, v); return v; }
  try { const bw = buildWaterGeo; buildWaterGeo = function (arr) { const g = bw.apply(this, arguments); try { if (!g) return g; if (world !== lastW) { lastW = world; col.clear(); }
      const p = g.attributes.position, fl = g.attributes.aFl, o = new Float32Array(p.count);
      for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (Math.abs(y - SEA) > 0.6 || (fl && fl.getZ(i) > 0.01)) continue; o[i] = ocean(Math.floor(p.getX(i) - 0.01), Math.floor(p.getZ(i) - 0.01)); }
      g.setAttribute('aOc', new THREE.BufferAttribute(o, 1)); } catch (e) { U.err = 'g ' + e; } return g; }; } catch (e) { U.err = 'w ' + e; }
  try { const ob = waterMat.onBeforeCompile; waterMat.onBeforeCompile = function (sh, r) { if (ob) ob.call(this, sh, r); Object.assign(sh.uniforms, u);
      let v = sh.vertexShader; const a = v.length;
      v = 'attribute float aOc;\nuniform float uWv;\nuniform vec4 uRp;\n' + v.replace('objectNormal = normalize(vec3(-dx, 1.0, -dz));', 'objectNormal = normalize(vec3(-dx * aOc * uWv, 1.0, -dz * aOc * uWv));')
        .replace('transformed.y += aSurf * (', `{ float rr = distance(position.xz, uRp.xy), rt = uTime - uRp.z; transformed.y += aSurf * (1.0 - aOc) * uRp.w * sin(rr * 3.2 - rt * 6.0) * exp(-rr * 0.35) * exp(-rt * 1.1) * step(rr, rt * 2.2 + 0.5); }
      transformed.y += aSurf * aOc * uWv * (`);
      U.sh = v.length > a + 60 && v.includes('aOc * uWv * (') ? 1 : 0; sh.vertexShader = v; };
    const ck = waterMat.customProgramCacheKey; waterMat.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + 'c369'; }; waterMat.needsUpdate = true; } catch (e) { U.err = 's ' + e; }
  // ripple when you enter still water; storm waves and wind
  let inW = false, wv = 1;
  setInterval(() => { try { if (typeof started === 'undefined' || !started || DIM.cur) return; const fx = Math.floor(P.x), fz = Math.floor(P.z), fy = Math.floor(P.y);
      const w = getB(fx, fy, fz) === T.WATER || getB(fx, fy - 1, fz) === T.WATER && P.y - fy < 0.2;
      if (w && !inW) u.uRp.value.set(P.x, P.z, waterUniforms.uTime.value, Math.min(0.22, 0.08 + Math.abs(P.vy || 0) * 0.02)); inW = w;
      const st = typeof weather !== 'undefined' && weather.type === 'thunder' ? 1 : 0; U.st = st; wv += ((st ? 4 : 1) - wv) * 0.05; u.uWv.value = wv;
      if (st && !(window.__c320 && __c320.inA)) { let open = true; for (let y = fy + 2; y < Math.min(H, fy + 14); y++) if (getB(fx, y, fz)) { open = false; break; }
        if (open && !(typeof flying !== 'undefined' && flying)) { const t = performance.now() / 1000, ang = 0.6 + Math.sin(t * 0.07) * 0.8, g = 0.055 * (0.6 + 0.4 * Math.sin(t * 1.3) * Math.sin(t * 0.37));
          const nx = P.x + Math.cos(ang) * g, nz = P.z + Math.sin(ang) * g, ok = (x, z) => !getB(Math.floor(x), fy, Math.floor(z)) && !getB(Math.floor(x), fy + 1, Math.floor(z));
          if (ok(nx + Math.cos(ang) * 0.35, P.z)) P.x = nx; if (ok(P.x, nz + Math.sin(ang) * 0.35)) P.z = nz; U.push = (U.push || 0) + 1; } } } catch (e) { U.err = 'l ' + e; } }, 50);
})();
