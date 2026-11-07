/* GLX-CL1222 (v1.2.22): Thunner Cloudie (nm22) zap.
   - The zap now leaves the cloud body itself and runs to the target, and its start follows the cloud while it shows (0.3 s).
   - A warm yellow local light at the strike lights nearby blocks for a moment: one pooled point light that always stays in the scene
     (no new lights, so no shader rebuild), switched off past 64 blocks from you. No screen flash and no exposure change, so the Agartha
     flash guard is untouched.
   - The sky bolt, thunder crack and screen shake for this mob are replaced by a deep low bass impact made in code (sine sweep plus
     filtered noise rumble, no recordings), slow attack, quieter with distance, at most 2 at once, through the game sound volume, silent
     when paused or in another realm.
   - A heavier, layered body: extra dark underside and rolling side puffs on shared low poly spheres (no new textures).
   Damage, cooldown, targeting and Disable Mobs are unchanged (the old strike code still does the damage). */
(function cl1222() {
  const U = window.__cl1222 = {err: null, zaps: 0, booms: 0, boomSkip: 0, light: 0, culled: 0, puffs: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const SEG = 14, MAXB = 3, LIFE = 0.3, LCAP = 0.22, FAR = 64;
  const V = () => new THREE.Vector3();
  let beams = null, light = null, lt = 0;
  function init() { if (beams) return; beams = [];
    const mat = new THREE.LineBasicMaterial({color: 0xfff1a0, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, fog: false});
    for (let i = 0; i < MAXB; i++) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEG * 6), 3)); const L = new THREE.LineSegments(g, mat); L.frustumCulled = false; L.visible = false; scene.add(L); beams.push({L, t: 0, src: null, end: V(), jit: new Float32Array(SEG * 2)}); }
    light = new THREE.PointLight(0xffd24a, 0, 14, 2); light.userData.cl1222 = 1; scene.add(light); }
  U.from = src => { const p = src.g.position, v = V().copy(p); v.y += (src.hitY || 1) * 0.9; return v; };
  function fill(b) { const a = U.from(b.src), e = b.end, P3 = b.L.geometry.attributes.position.array; let px = a.x, py = a.y, pz = a.z;
    for (let k = 0; k < SEG; k++) { const f = (k + 1) / SEG, j = k === SEG - 1 ? 0 : 1; const nx = a.x + (e.x - a.x) * f + b.jit[k * 2] * j, ny = a.y + (e.y - a.y) * f, nz = a.z + (e.z - a.z) * f + b.jit[k * 2 + 1] * j;
      P3.set([px, py, pz, nx, ny, nz], k * 6); px = nx; py = ny; pz = nz; }
    b.L.geometry.attributes.position.needsUpdate = true; b.L.geometry.computeBoundingSphere(); }
  // called by the old strike code: returns a collapsed line (our pooled beam draws the real one)
  U.path = (src, x, y, z) => { try { init(); let b = beams.find(q => q.t <= 0) || beams.reduce((m, q) => q.t < m.t ? q : m); b.src = src; b.end.set(x, y + 1, z); b.t = LIFE;
      for (let i = 0; i < b.jit.length; i++) b.jit[i] = (Math.random() - .5) * 0.9; fill(b); b.L.visible = true; U.zaps++; return [x, y, z, x, y, z]; } catch (e) { ERR('path', e); return null; } };
  U.hit = (src, x, y, z) => { try { init(); const d = Math.hypot(x - P.x, y - P.y, z - P.z); if (d < FAR) { light.position.set(x, y + 1.5, z); light.intensity = 3.2; lt = LCAP; U.light++; } else U.culled++; U.boom(d); } catch (e) { ERR('hit', e); } };
  U.step = dt => { if (!beams) return; if (light.parent !== scene) { scene.add(light); for (const b of beams) scene.add(b.L); } for (const b of beams) if (b.t > 0) { b.t -= dt; if (b.t <= 0 || !b.src || !b.src.g) { b.L.visible = false; b.t = 0; } else { fill(b); b.L.material.opacity = 0.95 * Math.min(1, b.t / LIFE * 1.5); } }
    if (lt > 0) { lt -= dt; light.intensity = lt > 0 ? 3.2 * (lt / LCAP) : 0; } };
  U.state = () => ({beams: beams ? beams.filter(b => b.L.visible).length : 0, light: light ? light.intensity : 0, lights: light ? 1 : 0});
  // deep bass impact
  let voices = 0;
  U.boom = d => { const ac = typeof AC !== 'undefined' ? AC : null; if (!ac || !ac.createOscillator) return false; if ((typeof paused !== 'undefined' && paused) || (typeof started !== 'undefined' && !started)) return false;
    if (voices >= 2 || d > 48) { U.boomSkip++; return false; } voices++;
    try { const t = ac.currentTime, v = 0.55 * Math.max(0, 1 - d / 48), out = ac.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + 0.06); out.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; out.connect(lp); lp.connect(typeof master !== 'undefined' && master ? master : ac.destination);
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(58, t); o.frequency.exponentialRampToValueAtTime(26, t + 1.6); o.connect(out); o.start(t); o.stop(t + 2.3);
      const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = 'triangle'; o2.frequency.setValueAtTime(87, t); o2.frequency.exponentialRampToValueAtTime(40, t + 1.2); g2.gain.value = 0.35; o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 1.8);
      if (typeof noiseBuf !== 'undefined' && noiseBuf) { const n = ac.createBufferSource(), nf = ac.createBiquadFilter(), ng = ac.createGain(); n.buffer = noiseBuf; nf.type = 'lowpass'; nf.frequency.value = 140; ng.gain.value = 0.6; n.connect(nf); nf.connect(ng); ng.connect(out); n.start(t); n.stop(t + 2.2); }
      setTimeout(() => { voices = Math.max(0, voices - 1); }, 2300); U.booms++; return true; } catch (e) { voices = Math.max(0, voices - 1); ERR('boom', e); return false; } };
  // heavier layered body (called from the model builder)
  let PG = null; U.dress = (body, puffs, cm, dk) => { if (!PG) PG = new THREE.SphereGeometry(1, 10, 8); const PH = /Android|iPhone|iPad/i.test(navigator.userAgent), L = PH ? [[0, -0.45, 0, 0.75, dk], [-0.9, -0.3, 0.2, 0.55, dk], [0.9, -0.3, -0.2, 0.55, dk]] :
      [[0, -0.5, 0, 0.8, dk], [-0.95, -0.32, 0.25, 0.6, dk], [0.95, -0.35, -0.2, 0.6, dk], [-0.5, 0.55, -0.35, 0.55, cm], [0.55, 0.6, 0.3, 0.5, cm], [0, 0.85, 0, 0.45, cm], [-1.25, 0.1, -0.3, 0.42, cm], [1.25, 0.15, 0.3, 0.42, cm]];
    L.forEach(([x, y, z, r, m], i) => { const p = new THREE.Mesh(PG, m); p.position.set(x, y, z); p.scale.set(r * 1.25, r * 0.8, r); p.userData.ph = 10 + i * 1.7; body.add(p); puffs.push(p); U.puffs++; }); };
  try { init(); } catch (e) { ERR('init', e); }
  { let last = performance.now(); (function loop() { const n = performance.now(), dt = Math.min(0.1, (n - last) / 1000); last = n; try { U.step(dt); } catch (e) { ERR('step', e); } requestAnimationFrame(loop); })(); }
})();
