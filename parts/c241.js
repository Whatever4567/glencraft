/* ===================== GLX-C241 (v1.0.56): living water - gentle ocean swell, slow tides, slower lazier rivers, ripples round anything moving in still water
   and raindrops on it, wet ground with puddles while it rains (they dry out after), and a soft relaxing rain bed under the rain sound ===================== */
(function c241() {
  const U = window.__c241 = {err: null, rips: 0, puddles: 0, wet: 0, tide: 0, sh: 0, snd: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const PH = typeof touchMode !== 'undefined' && !!touchMode, LOW = PH || (typeof PERF !== 'undefined' && PERF);
  const NR = LOW ? 4 : 8, RIP = []; for (let i = 0; i < NR; i++) RIP.push(new THREE.Vector4(0, 0, -99, 0));
  const u = {u41T: {value: 0}, u41Tide: {value: 0}, u41Sea: {value: (typeof SEA !== 'undefined' ? SEA : 40) + 1}, u41Rip: {value: RIP}};
  let ri = 0; const ripple = (x, z, a) => { const r = RIP[ri = (ri + 1) % NR]; r.set(x, z, u.u41T.value, a); U.rips++; };
  U.ripple = ripple;
  // ---------- water shader: swell + tide on top faces, ripples, slower river scroll ----------
  try { const ob = waterMat.onBeforeCompile; waterMat.onBeforeCompile = function (sh, r) { if (ob) ob.call(this, sh, r); Object.assign(sh.uniforms, u);
      let v = sh.vertexShader, f = sh.fragmentShader;
      v = v.replace(/fract\(uTime \* aScr\.x\), fract\(uTime \* aScr\.y\)/, 'fract(uTime * 0.5 * aScr.x), fract(uTime * 0.5 * aScr.y)');
      v = 'uniform float u41T; uniform float u41Tide; uniform float u41Sea;\nvarying vec3 v41W;\n' + v.replace('#include <begin_vertex>', `#include <begin_vertex>
 { vec3 w41 = (modelMatrix * vec4(transformed, 1.0)).xyz; if (objectNormal.y > 0.5) { float sea = 1.0 - smoothstep(0.6, 1.6, abs(w41.y - u41Sea));
   float sw = sin(w41.x * 0.31 + u41T * 0.9) * 0.55 + sin(w41.z * 0.23 - u41T * 0.7 + w41.x * 0.05) * 0.45 + sin((w41.x + w41.z) * 0.9 + u41T * 1.7) * 0.18;
   transformed.y += sw * (0.025 + 0.06 * sea) + u41Tide * sea; } v41W = (modelMatrix * vec4(transformed, 1.0)).xyz; }`);
      f = f.replace('uTime * 4.2', 'uTime * 2.2');
      f = 'uniform float u41T; uniform vec4 u41Rip[' + NR + '];\nvarying vec3 v41W;\n' + f.replace('#include <map_fragment>', `#include <map_fragment>
 { float rr = 0.0; for (int i = 0; i < ${NR}; i++) { vec4 q = u41Rip[i]; float age = u41T - q.z; if (age < 0.0 || age > 2.6) continue; float d = distance(v41W.xz, q.xy);
     float k = d - age * 1.5; rr += (exp(-k * k * 22.0) + 0.5 * exp(-(k + 0.35) * (k + 0.35) * 30.0)) * (1.0 - age / 2.6) * q.w; }
   diffuseColor.rgb += vec3(0.3, 0.33, 0.36) * min(rr, 1.2); }`);
      sh.vertexShader = v; sh.fragmentShader = f; U.sh = 1; };
    const ck = waterMat.customProgramCacheKey; waterMat.customProgramCacheKey = function () { return (ck ? ck.call(this) : '') + 'c241'; }; waterMat.needsUpdate = true; } catch (e) { ERR('sh', e); }
  // ---------- rain state ----------
  const raining = () => { try { const w = WEATHER[weather.type]; return !!(w && w.drops) && !DIM.cur && !(window.__snowWx && __snowWx()); } catch (_) { return false; } };
  const inten = () => { try { return weather.type === 'light' ? 0.5 : weather.type === 'thunder' ? 1 : 0.8; } catch (_) { return 0.7; } };
  const wAt = (x, y, z) => { x = Math.floor(x); y = Math.floor(y); z = Math.floor(z); if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return 0; return world[idx(x, y, z)]; };
  // ---------- puddles: dark glossy patches on flat open ground while it rains ----------
  const pc = document.createElement('canvas'); pc.width = pc.height = 64; { const g = pc.getContext('2d'), q = g.createRadialGradient(32, 32, 4, 32, 32, 31); q.addColorStop(0, 'rgba(70,90,110,0.85)'); q.addColorStop(0.7, 'rgba(60,80,100,0.55)'); q.addColorStop(1, 'rgba(50,60,70,0)'); g.fillStyle = q; g.beginPath(); g.ellipse(32, 32, 30, 24, 0.4, 0, 6.3); g.fill(); }
  const pMat = new THREE.MeshStandardMaterial({map: new THREE.CanvasTexture(pc), transparent: true, depthWrite: false, roughness: 0.08, metalness: 0.35, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2});
  const pGeo = new THREE.PlaneGeometry(1, 1); pGeo.rotateX(-Math.PI / 2);
  const NP = LOW ? 10 : 26, PUD = [];
  const pg = new THREE.Group(); pg.userData.__dcR = 1e9; pg.userData.__dcK = 1; scene.add(pg);
  for (let i = 0; i < NP; i++) { const m = new THREE.Mesh(pGeo, pMat); m.visible = false; m.userData.__dcR = 1e9; m.userData.__dcK = 1; m.renderOrder = 3; pg.add(m); PUD.push(m); }
  const FLAT = () => new Set([T.GRASS, T.DIRT, T.STONE, T.COBBLE, T.GRAVEL, T.SAND, T.MUD, T.PEAT, 156].filter(v => v !== undefined));
  let FL = null;
  function placePud(m) { if (!FL) FL = FLAT(); for (let k = 0; k < 6; k++) { const x = Math.floor(P.x + (Math.random() - .5) * 36), z = Math.floor(P.z + (Math.random() - .5) * 36);
      if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1) continue; let y = H - 2; while (y > 1 && !world[idx(x, y, z)]) y--; const b = world[idx(x, y, z)]; if (!FL.has(b)) continue;
      if (Math.abs(y - P.y) > 10) continue; let ok = true; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (world[idx(x + dx, y, z + dz)] !== b && !FL.has(world[idx(x + dx, y, z + dz)])) ok = false; if (!ok) continue;
      const s = 0.9 + Math.random() * 1.8; m.scale.set(s, 1, s * (0.6 + Math.random() * 0.5)); m.rotation.y = Math.random() * 3; m.position.set(x + .5, y + 1.012, z + .5); m.visible = true; return true; } return false; }
  // ---------- relaxing rain bed: soft pink noise through a gentle low-pass, plus the odd soft drip ----------
  let bed = null, dripT = 1;
  function mkBed() { try { if (!AC || AC.state !== 'running') return null; const len = 4, b = AC.createBuffer(1, AC.sampleRate * len | 0, AC.sampleRate), ch = b.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < ch.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527; ch[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11; }
      const n = AC.createBufferSource(); n.buffer = b; n.loop = true; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 120;
      const g = AC.createGain(); g.gain.value = 0; n.connect(hp); hp.connect(lp); lp.connect(g); g.connect(typeof master !== 'undefined' ? master : AC.destination); n.start(); U.snd = 1; return {g, lp}; } catch (e) { ERR('bed', e); return null; } }
  function drip(v) { try { const t = AC.currentTime + 0.01, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; const f = 900 + Math.random() * 900; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.02 * v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(typeof master !== 'undefined' ? master : AC.destination); o.start(t); o.stop(t + 0.25); } catch (_) {} }
  // ---------- per frame ----------
  let tm = 0, mobT = 0, rainRipT = 0, pudT = 0, wet = 0, lastP = null;
  function frame(dt) { tm += dt; u.u41T.value = tm;
    u.u41Tide.value = U.tide = Math.sin(tm / 360 * 6.283) * 0.16;   // a slow tide: in and out every six minutes
    if (!started) return; const rain = raining(), cov = typeof rainCover === 'number' ? rainCover : 0;
    wet = Math.max(0, Math.min(1, wet + (rain ? dt / 25 : -dt / 90))); U.wet = +wet.toFixed(2);
    // ripples from you and the mobs moving in water
    if (lastP) { const sp = Math.hypot(P.x - lastP[0], P.z - lastP[1]) / Math.max(dt, 1e-3); if (sp > 0.6 && wAt(P.x, P.y + 0.2, P.z) === T.WATER && Math.random() < dt * 5) ripple(P.x, P.z, 0.9); }
    lastP = [P.x, P.z];
    if ((mobT -= dt) <= 0) { mobT = 0.35; try { for (const a of mobs) { const p = a.g.position; if (Math.abs(p.x - P.x) > 30 || Math.abs(p.z - P.z) > 30) continue; if (wAt(p.x, p.y + 0.2, p.z) === T.WATER || wAt(p.x, p.y - 0.4, p.z) === T.WATER) { const lp = a.__c241 || (a.__c241 = [p.x, p.z]); if (Math.hypot(p.x - lp[0], p.z - lp[1]) > 0.15) ripple(p.x, p.z, 0.7); lp[0] = p.x; lp[1] = p.z; } } } catch (_) {} }
    // raindrops ring the water near you
    if (rain && (rainRipT -= dt) <= 0) { rainRipT = LOW ? 0.18 : 0.09; for (let k = 0; k < 3; k++) { const x = P.x + (Math.random() - .5) * 16, z = P.z + (Math.random() - .5) * 16; let y = Math.min(H - 2, Math.floor(P.y) + 6); while (y > Math.floor(P.y) - 8 && !world[idx(Math.floor(x), y, Math.floor(z))]) y--; if (wAt(x, y, z) === T.WATER) { ripple(x, z, 0.35); break; } } }
    // puddles grow while wet, fade as it dries
    if ((pudT -= dt) <= 0) { pudT = 0.5; let n = 0; for (const m of PUD) { if (m.visible && (Math.abs(m.position.x - P.x) > 26 || Math.abs(m.position.z - P.z) > 26)) m.visible = false; if (m.visible) n++; }
      const want = Math.round(NP * Math.min(1, wet * 1.4)); for (const m of PUD) { if (n >= want) break; if (!m.visible && placePud(m)) n++; } if (n > want + 2) for (const m of PUD) if (m.visible && n > want) { m.visible = false; n--; } U.puddles = n; }
    pMat.opacity = Math.min(0.75, wet * 1.1); pg.visible = wet > 0.02 && !DIM.cur;
    // relaxing rain bed
    if (rain && !bed) bed = mkBed();
    if (bed) { const tgt = rain ? (0.10 + 0.08 * inten()) * (1 - 0.6 * cov) : 0; bed.g.gain.value += (tgt - bed.g.gain.value) * Math.min(1, dt * 0.8); bed.lp.frequency.value = 900 + 900 * (1 - cov);
      if (rain && (dripT -= dt) <= 0) { dripT = 0.6 + Math.random() * 2.2; drip(cov > 0.3 ? 1 : 0.5); } } }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { frame(Math.min(0.1, +dt || 0.016)); } catch (e) { ERR('fr', e); } return r; };
})();
