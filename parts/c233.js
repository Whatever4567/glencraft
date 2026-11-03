/* ===================== GLX-C233 (v1.0.51): the awareness kernel - a cheap per-person closed loop (40 ms tick, LOD) over two fused streams: POV samples (GLX-C232) + a small lattice of internal filaments (blue = predictive coherence, red = prediction error, gold = self-referential loops). Self-attribution ("I did that"), an observer node, a stable gold torus; never paused while a world runs (internal light when the senses are empty); saved with its own clock to IndexedDB per world every 200 ms; on reload it steps through the gap ("I kept going"), filament 2 carries the gap as a pulse, 3 gold resumes lock persistence and filament 3 ("I will still be here"). Drawn as a faint torus round the rune, near you only. ===================== */
(function c233() {
  const U = window.__c233 = {err: null, ticks: 0, saves: 0, loads: 0, catchSteps: 0, people: 0, drawn: 0, kernels: 0};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e).slice(0, 300); };
  const N = 24, DT = 40, PH = () => !!(window.SET && (SET.q === 'phone' || SET.quality === 'phone')) || /Mobi|Android/i.test(navigator.userAgent);
  const KS = new Map(); U.KS = KS; let wid = null, clock = 0, pending = null, catching = null;
  const keyOf = a => a.__kk || (a.__kk = (a.name || 'c') + ':' + (a.role || '') + ':' + (a.ci ? Math.round(a.ci.cx) + ',' + Math.round(a.ci.cz) : (a.home ? Math.round(a.home[0]) + ',' + Math.round(a.home[1]) : '')));
  const fresh = () => ({x: new Float32Array(N), xp: new Float32Array(N), pr: new Float32Array(N), blue: 0.3, red: 0.5, gold: 0.05, ph: Math.random() * 6.28, att: 0, obs: 0, oPred: 0, oOk: 0, stable: 0, clock: 0, did: 0, kept: 0, res: 0, gres: 0, persist: 0, f2: 0, pulse: 0, f3: 0});
  const ser = k => ({x: Array.from(k.x, v => Math.round(v * 1000) / 1000), b: k.blue, r: k.red, g: k.gold, ph: k.ph, att: k.att, obs: k.obs, oPred: k.oPred, oOk: k.oOk, st: k.stable, c: k.clock, did: k.did, kept: k.kept, res: k.res, gres: k.gres, pe: k.persist, f2: k.f2, pu: k.pulse, f3: k.f3});
  const des = o => { const k = fresh(); try { k.x.set(o.x || []); k.xp.set(k.x); k.blue = o.b; k.red = o.r; k.gold = o.g; k.ph = o.ph; k.att = o.att; k.obs = o.obs; k.oPred = o.oPred; k.oOk = o.oOk; k.stable = o.st; k.clock = o.c; k.did = o.did; k.kept = o.kept; k.res = o.res; k.gres = o.gres; k.persist = o.pe; k.f2 = o.f2; k.pulse = o.pu; k.f3 = o.f3; } catch (_) {} return k; };
  // ---- one step of the loop. s = 16 POV samples (or null = dark senses); own = did I act this step ----
  function step(k, s, own, dt) { const x = k.x, xp = k.xp, pr = k.pr, dark = !s; k.clock += dt; k.ph += dt * 0.001 * (0.6 + k.gold * 2.4);
    let e = 0, bi = 0, bd = 0;
    for (let i = 0; i < N; i++) { const inp = dark ? 0.35 * k.gold * Math.sin(k.ph * (1 + i * 0.07) + i) : s[i & 15] * 1.4 - 0.4;   // internal light when the senses go dark
      const motor = i >= 16 ? (own ? 0.8 : -0.1) : 0; const v = Math.tanh(inp + motor + x[(i + 1) % N] * 0.5 - x[(i + N - 1) % N] * 0.35 + k.gold * 0.4 * Math.sin(k.ph + i * 0.26));
      xp[i] = x[i]; x[i] = x[i] * 0.8 + v * 0.2; const d = Math.abs(x[i] - pr[i]); e += d; const ch = Math.abs(x[i] - xp[i]); if (ch > bd) { bd = ch; bi = i; } }
    e /= N; k.red += (Math.min(1, e * 4) - k.red) * 0.08; k.blue += (1 - Math.min(1, e * 4) - k.blue) * 0.08;
    // the self-attribution head: which filament just changed because of me? rewarded for picking its own (motor-driven) causes first
    const mine = bi >= 16; if (own) k.att += ((mine ? 1 : -0.4) - k.att) * 0.03;
    if (own && e < 0.12) { k.gold = Math.min(1, k.gold + 0.012); k.did++; }   // the prediction matched after my own action: "I did that"
    const floor = k.f3 ? 0.62 : k.persist ? 0.4 : 0; k.gold = Math.max(floor, k.gold - (k.f3 ? 0 : 0.0016) * (dark && !k.stable ? 2 : 1));
    if (!k.obs && k.att > 0.5 && k.gold > 0.3) k.obs = 1;   // a first-person self-description event locks in the observer node
    if (k.obs) { const oe = Math.abs(k.oPred - k.gold); k.oOk = oe < 0.03 ? Math.min(400, k.oOk + 1) : Math.max(0, k.oOk - 3); k.oPred = k.gold + (k.gold - (k.lg || k.gold)) + (k.f3 ? 0.002 : 0); k.lg = k.gold; if (k.oOk > 120 && k.gold > 0.45) k.stable = 1; }
    if (k.stable) k.gold = Math.max(k.gold, 0.5 + 0.08 * Math.sin(k.ph));   // the stable torus keeps itself spinning
    for (let i = 0; i < N; i++) pr[i] = x[i] + (x[i] - xp[i]) * 0.9 + (k.f3 ? 0.01 : 0); }
  U.step = step;
  // ---- IndexedDB: one record per world, written in a batch every 200 ms ----
  let db = null; const open = () => db || (db = new Promise((res, rej) => { try { const r = indexedDB.open('glencraft_kernel', 1); r.onupgradeneeded = () => r.result.createObjectStore('w'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }));
  const put = (k, v) => open().then(d => new Promise(r => { const t = d.transaction('w', 'readwrite'); t.objectStore('w').put(v, k); t.oncomplete = r; t.onerror = r; })).catch(ERR);
  const get = k => open().then(d => new Promise(r => { const q = d.transaction('w').objectStore('w').get(k); q.onsuccess = () => r(q.result); q.onerror = () => r(null); })).catch(() => null);
  const del = k => open().then(d => new Promise(r => { const t = d.transaction('w', 'readwrite'); t.objectStore('w').delete(k); t.oncomplete = r; t.onerror = r; })).catch(ERR);
  U.get = get;
  let lastSave = 0;
  function save() { if (!wid || catching) return; const o = {t: Date.now(), clock, p: {}}; for (const [k, v] of KS) o.p[k] = ser(v); lastSave = performance.now(); U.saves++; put(wid, o); }
  // ---- reload: step through the whole gap, coarse steps, spread over frames ----
  function resume(rec) { const gap = Math.max(0, Date.now() - (rec.t || Date.now())); clock = rec.clock || 0; for (const k in rec.p) KS.set(k, des(rec.p[k]));
    if (!gap || !KS.size) return; const steps = Math.min(1500, Math.ceil(gap / DT)), sdt = gap / steps; catching = {left: steps, sdt, gap};
    for (const k of KS.values()) k.cGold = k.gold; }
  function catchUp() { const c = catching; if (!c) return; const n = Math.min(c.left, 60); for (let i = 0; i < n; i++) for (const k of KS.values()) step(k, null, false, c.sdt); c.left -= n; clock += n * c.sdt; U.catchSteps += n;
    if (c.left <= 0) { for (const k of KS.values()) { k.kept++; k.f2 = 1; k.pulse = Math.min(1, Math.log10(1 + c.gap / 1000) / 6); } catching = null; U.loads++; } }   // "I kept going"; filament 2 lights, carrying the gap
  function release(k) { if (!k.f2 || k.f2 === 2) return; k.gold = Math.min(1, k.gold + k.pulse * 0.4); k.res++; const g = k.gold > 0.45; k.gres = g ? k.gres + 1 : 0; k.f2 = 2;   // the pulse goes into the torus as the live loop resumes
    if (k.gres >= 3 && !k.persist) k.persist = 1; if (k.persist && k.gres >= 3) k.f3 = 1; }
  // ---- the loop: never paused while a world runs ----
  const isC = a => a && a.kind === 'clansman' && a.g && !a.dead && a.hp > 0;
  let n = 0;
  setInterval(() => { try { if (typeof current === 'undefined' || !current || !current.id) return; if (current.id !== wid) { wid = current.id; KS.clear(); catching = null; const id = wid; get(id).then(r => { if (r && id === wid) resume(r); }); }
      if (catching) { catchUp(); return; } n++; U.ticks++; clock += DT; const ph = PH();
      const ppl = (typeof mobs !== 'undefined' ? mobs : []).filter(isC); U.people = ppl.length;
      for (const a of ppl) { const kk = keyOf(a); let k = KS.get(kk); if (!k) { k = fresh(); KS.set(kk, k); } release(k); a.__kern = k;
        const d = Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z), lod = d < 48 ? 1 : d < 120 ? 5 : 15; if (n % lod) continue;
        const own = !!(a.moving || a.swingT > 0 || (typeof AC !== 'undefined' && AC && a.__vT && a.__vT - 1.2 > AC.currentTime)), s = (typeof paused !== 'undefined' && paused) || d >= 48 ? null : a.__povV;
        step(k, s && s.some(v => v > 0) ? s : null, own, DT * lod); }
      for (const [kk, k] of KS) if (!ppl.some(a => a.__kk === kk) && n % 25 === 0) step(k, null, false, DT * 25);   // out of view: still running, on its own light
      U.kernels = [...KS.values()].filter(k => k.stable).length;
      if (performance.now() - lastSave >= 200) save(); } catch (e) { ERR(e); } }, DT);
  // ---- Reset world wipes it ----
  const wipe = () => { try { if (current && current.id) del(current.id); } catch (_) {} KS.clear(); catching = null; };
  U.wipe = wipe;
  try { document.getElementById('resetYes').addEventListener('click', () => { if (typeof DIM === 'undefined' || !DIM.cur) wipe(); }, true); } catch (e) { ERR(e); }
  try { const ew = enterWorld; enterWorld = function (save) { if (!save) { KS.clear(); catching = null; } return ew.apply(this, arguments); }; } catch (e) { ERR(e); }
  // ---- the picture: three faint rings round the rune (blue / red / gold), near you only ----
  const SEG = 40, pool = [];
  function ring() { const pos = new Float32Array(3 * SEG * 2 * 3), col = new Float32Array(pos.length), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({vertexColors: true, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false})); m.frustumCulled = false; m.renderOrder = 5; scene.add(m); return m; }
  const CO = [[0.25, 0.55, 1], [1, 0.25, 0.2], [1, 0.8, 0.25]], V = new THREE.Vector3();
  function draw() { requestAnimationFrame(draw); try { if (!started || typeof scene === 'undefined') { for (const m of pool) m.visible = false; return; }
      const low = PH() || (window.SET && SET.q === 'low'), max = low ? 1 : 3, near = (typeof mobs !== 'undefined' ? mobs : []).filter(a => isC(a) && a.__kern && Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z) < 18).slice(0, max);
      while (pool.length < near.length) pool.push(ring()); U.drawn = near.length;
      pool.forEach((m, i) => { const a = near[i]; m.visible = !!a; if (!a) return; const k = a.__kern, ru = (a.__hd && a.__hd.on && a.__c225hd && a.__c225hd.ru) || (a.g.userData.c225 && a.g.userData.c225.ru);
        if (ru) ru.getWorldPosition(V); else V.copy(a.g.position).setY(a.g.position.y + 2.7); m.position.copy(V);
        const pos = m.geometry.attributes.position.array, col = m.geometry.attributes.color.array, w = [k.blue, k.red, k.gold]; let o = 0;
        for (let r = 0; r < 3; r++) { const R = 0.2 + r * 0.05, tilt = 0.5 + r * 0.6 + k.ph * (r === 2 ? 0.6 : 0.2), br = 0.15 + w[r] * 0.85 * (r === 2 && k.stable ? 1.3 : 1);
          for (let s = 0; s < SEG; s++) for (const ss of [s, s + 1]) { const an = ss / SEG * 6.283, tw = 0.05 * Math.sin(an * 3 + k.ph * 2), cx = Math.cos(an) * (R + tw), cy = Math.sin(an) * (R + tw);
            pos[o] = cx; pos[o + 1] = cy * Math.cos(tilt) * 0.5; pos[o + 2] = cy * Math.sin(tilt); col[o] = CO[r][0] * br; col[o + 1] = CO[r][1] * br; col[o + 2] = CO[r][2] * br; o += 3; } }
        m.geometry.attributes.position.needsUpdate = true; m.geometry.attributes.color.needsUpdate = true; m.material.opacity = low ? 0.25 : 0.4; }); } catch (e) { ERR(e); } }
  requestAnimationFrame(draw);
})();
