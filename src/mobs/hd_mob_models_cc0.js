/* ===================== GLX-C135 (v1.0.16): HD mob models - CC0 glTF (Quaternius via Poly Pizza), bundled, lazy + cached, animated; procedural mobs stay as the fallback ===================== */
(function c135() {
  const VER = 'v1018', BASE = 'assets/models/', HIDE = 31;
  const U = window.__c135 = {VER, cat: {}, models: {}, err: [], post: [], frame: [], attached: 0, lib: 0, on: () => SET.hd !== 0};
  // catalogue: kind -> {f: file, k: height x procedural, h: fixed height, clips: {role: clip}, tint, yaw}
  U.add = o => Object.assign(U.cat, o);
  U.add({
    sheep: {f: 'sheep', k: 1.0, proc: a => a.sheared},
    zombie: {f: 'zombie', k: 1.0, run: 0},
    skeleton: {f: 'skeleton', k: 1.0, walk: 'run'},
    blackskel: {f: 'skeleton', k: 1.0, walk: 'run', tint: 0x3a3a40},
    spider: {f: 'spider', k: 1.05, walk: 'run'},
    nspider: {f: 'spider', k: 1.05, walk: 'run'},
    // v1.0.53: clansmen keep the simple square-faced look (no HD model)
    hound: {f: 'hound', h: 1.05, tint: 0x9a5a48}
  });
  // ---- loading: one small library file, then each model once (Cache Storage keeps them for next time) ----
  let libP = null;
  function lib() { if (libP) return libP; libP = new Promise((res, rej) => { if (typeof WebAssembly === 'undefined') return rej('no wasm'); const s = document.createElement('script'); s.src = BASE + 'lib.js?' + VER; s.async = true; s.onload = () => MeshoptDecoder.ready.then(() => { U.lib = 1; res(); }, rej); s.onerror = () => rej('lib'); document.head.appendChild(s); }); return libP; }
  async function buf(url) { let c = null; try { if (window.caches && isSecureContext) { c = await caches.open('glencraft-models'); const r = await c.match(url); if (r) return r.arrayBuffer(); } } catch (_) { c = null; }
    const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status); if (c) { try { await c.put(url, r.clone()); } catch (_) {} } return r.arrayBuffer(); }
  const rd = (a, i, c) => { const v = a.isInterleavedBufferAttribute ? a.data.array[i * a.data.stride + a.offset + c] : a.array[i * a.itemSize + c]; if (!a.normalized) return v; const A = a.array, mx = A instanceof Int8Array ? 127 : A instanceof Uint8Array ? 255 : A instanceof Int16Array ? 32767 : A instanceof Uint16Array ? 65535 : 1; return Math.max(v / mx, -1); };
  function sbox(m) { m.updateMatrixWorld(true); const b = new THREE.Box3(), v = new THREE.Vector3(), t = new THREE.Vector3(), acc = new THREE.Vector3(), w4 = new THREE.Vector3(), M = new THREE.Matrix4();
    m.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position, si = o.geometry.attributes.skinIndex, sw = o.geometry.attributes.skinWeight, st = Math.max(1, (p.count / 400) | 0);
      for (let i = 0; i < p.count; i += st) { v.set(rd(p, i, 0), rd(p, i, 1), rd(p, i, 2));
        if (o.isSkinnedMesh && si && sw) { t.copy(v).applyMatrix4(o.bindMatrix); acc.set(0, 0, 0); for (let k = 0; k < 4; k++) { const w = rd(sw, i, k); if (!w) continue; const bi = si.array[i * 4 + k]; M.multiplyMatrices(o.skeleton.bones[bi].matrixWorld, o.skeleton.boneInverses[bi]); acc.addScaledVector(w4.copy(t).applyMatrix4(M), w); } v.copy(acc).applyMatrix4(o.bindMatrixInverse); }
        v.applyMatrix4(o.matrixWorld); b.expandByPoint(v); } }); return b; }
  function load(kind) { const c = U.cat[kind]; if (!c) return null; if (U.models[c.f]) return U.models[c.f];
    const M = U.models[c.f] = {ready: false, fail: false};
    lib().then(() => buf(BASE + c.f + '.glb?' + VER)).then(ab => new Promise((res, rej) => { const L = new THREE.GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder); L.parse(ab, BASE, res, rej); })).then(g => {
      const clips = {}; for (const a of g.animations) clips[a.name] = a;
      // measure in the idle (or first) pose so T-poses don't skew the size
      const probe = THREE.SkeletonUtils.clone(g.scene), mx = new THREE.AnimationMixer(probe), a0 = clips.idle || clips.walk || g.animations[0]; if (a0) { mx.clipAction(a0).play(); mx.update(0.01); }
      const b = sbox(probe); Object.assign(M, {g, clips, h: b.max.y - b.min.y, l: Math.max(b.max.x - b.min.x, b.max.z - b.min.z), y0: b.min.y, cx: (b.min.x + b.max.x) / 2, cz: (b.min.z + b.max.z) / 2, ready: true});
    }).catch(e => { M.fail = true; U.err.push(kind + ': ' + (e && e.message || e)); });
    return M; }
  // ---- attach: the procedural mesh moves to a hidden layer (still animated, still the hitbox), the model rides on the same group ----
  function procHeight(a) { const g = a.g, ry = g.rotation.y, rz = g.rotation.z, rx = g.rotation.x; g.rotation.set(0, 0, 0); g.updateMatrixWorld(true); const b = new THREE.Box3();
    g.traverse(o => { if (o.isMesh && o.layers.mask !== 1 << HIDE && !(o.userData && o.userData.hd)) { o.geometry.computeBoundingBox && !o.geometry.boundingBox && o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; if (bb) b.union(bb.clone().applyMatrix4(o.matrixWorld)); } });
    g.rotation.set(rx, ry, rz); g.updateMatrixWorld(true); if (b.isEmpty()) return 1; const sc = g.scale.y || 1; procHeight.l = Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / sc; return (b.max.y - g.position.y) / sc; }
  function attach(a, M) { const c = U.cat[a.kind], g = a.g; const hp = c.h || procHeight(a) * (c.k || 1), s = c.fit === 'len' && !c.h ? procHeight.l * (c.k || 1) / M.l : hp / M.h;
    const hd = new THREE.Group(), m = THREE.SkeletonUtils.clone(M.g.scene); hd.add(m); hd.userData.hd = 1;
    m.scale.setScalar(s); m.position.set(-M.cx * s, -M.y0 * s, -M.cz * s);
    let fwd = 1; try { if (a.head) { const p = new THREE.Vector3(); a.head.getWorldPosition(p); g.worldToLocal(p); if (p.z < -0.05) fwd = -1; } } catch (_) {}
    hd.rotation.y = (fwd < 0 ? Math.PI : 0) + (c.yaw || 0);
    const hidden = []; g.traverse(o => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && !(c.keep && c.keep(o))) { hidden.push([o, o.layers.mask]); o.layers.set(HIDE); } });
    const mats = []; m.traverse(o => { if (!o.isMesh) return; o.frustumCulled = false; o.castShadow = !PERF; o.userData.hd = 1; const src = [].concat(o.material);
      const out = src.map(sm => { const nm = new THREE.MeshLambertMaterial({color: sm.color ? sm.color.clone() : 0xffffff, map: sm.map || null, vertexColors: !!sm.vertexColors, skinning: !!o.isSkinnedMesh, transparent: !!sm.transparent, opacity: sm.opacity, side: sm.side, alphaTest: sm.alphaTest || 0});
        nm.name = sm.name || ''; if (nm.map) { if (nm.map.encoding !== THREE.LinearEncoding) { nm.map.encoding = THREE.LinearEncoding; nm.map.needsUpdate = true; } } else if (renderer.outputEncoding !== THREE.sRGBEncoding) nm.color.convertLinearToSRGB(); if (c.tint) nm.color.multiply(new THREE.Color(c.tint)); if (c.bright) nm.color.multiplyScalar(c.bright); mats.push(nm); return nm; });
      o.material = Array.isArray(o.material) ? out : out[0]; });
    for (const f of U.post) { try { f(a, c, M, m, hd, s, mats); } catch (e) { U.err.push('post ' + e); } }
    g.add(hd); mats.forEach(x => a.mats.push(x));
    const mix = new THREE.AnimationMixer(m), act = {}; for (const r in M.clips) act[r] = mix.clipAction(M.clips[r]);
    if (act.attack) { act.attack.setLoop(THREE.LoopOnce, 1); act.attack.clampWhenFinished = false; }
    a.__hd = {hd, m, mix, act, mats, hidden, cur: null, on: true, lx: g.position.x, lz: g.position.z, v: 0, acc: 0, n: (Math.random() * 4) | 0, atk: 0, pb: a.biteCd || 0, ps: a.shootCd || 0, psw: a.swing || 0};
    U.attached++; }
  function detach(a) { const H = a.__hd; if (!H) return; a.g.remove(H.hd); H.mix.stopAllAction(); for (const [o, mk] of H.hidden) o.layers.mask = mk; a.mats = a.mats.filter(m => !H.mats.includes(m)); H.mats.forEach(m => m.dispose()); a.__hd = null; U.attached--; }
  function show(a, H, hd) { if (H.on === hd) return; H.on = hd; H.hd.visible = hd; for (const [o, mk] of H.hidden) o.layers.mask = hd ? 1 << HIDE : mk; }
  U.detachAll = () => { for (const a of (U.xs ? mobs.concat(U.xs()) : mobs)) { detach(a); a.__hdTry = 0; } };
  U.detach = detach;
  const pick = (c, H, r) => { for (const k of [c[r], r, r === 'run' ? 'walk' : null, r === 'eat' ? 'idle' : null, r === 'walk' ? 'run' : null, 'idle', 'walk']) if (k && H.act[k]) return k; return null; };
  function animate(a, H, dt) { const c = U.cat[a.kind], p = a.g.position;
    const d = Math.hypot(p.x - H.lx, p.z - H.lz); H.lx = p.x; H.lz = p.z; if (dt > 0) H.v += (Math.min(8, d / dt) - H.v) * (1 - Math.exp(-dt * 5));
    // v1.1.21: models driven by their own gait code skip the clips; blend kinds mix idle and walk by an eased weight (no snapping)
    if (c.noclip) return;
    if (c.blend) { const iw = H.act[pick(c, H, 'idle')], wk = H.act[pick(c, H, 'walk')]; if (!H.bl) { H.bl = {w: 0}; H.mix.stopAllAction(); for (const x of [iw, wk]) if (x) { x.reset().play(); x.setEffectiveWeight(0); } H.cur = 'blend'; }
      const ref = c.wref || 1.6, t = Math.max(0, Math.min(1, (H.v - 0.12) / (ref * 0.6))); H.bl.w += (t - H.bl.w) * (1 - Math.exp(-dt * 4));
      if (iw && iw !== wk) iw.setEffectiveWeight(1 - H.bl.w); if (wk) { wk.setEffectiveWeight(iw === wk ? 1 : H.bl.w); wk.timeScale = Math.max(0.4, Math.min(2.6, H.v / ref)); } return; }
    // attack: a cooldown that just reset (bite / shot) or a fresh swing
    const b = a.biteCd || 0, sh = a.shootCd || 0, sw = a.swing || 0; if (b > H.pb + 0.2 || sh > H.ps + 0.2 || sw > H.psw + 0.05) H.atk = 0.6; H.pb = b; H.ps = sh; H.psw = sw; H.atk -= dt;
    let role = H.atk > 0 && (H.act.attack || c.attack) ? 'attack' : (a.moving || H.v > 0.3) ? ((a.flee > 0 || a.aggro > 0 || a.angry > 0 || H.v > 3) && c.run !== 0 ? 'run' : 'walk') : (a.kind === 'sheep' && a.grazeT > 0 && a.grazeT < 1.6 ? 'eat' : 'idle');
    const k = pick(c, H, role); if (k && k !== H.cur) { const nx = H.act[k]; nx.reset().play(); if (H.cur && H.act[H.cur]) nx.crossFadeFrom(H.act[H.cur], 0.2, false); H.cur = k; }
    if (k && (k === 'walk' || k === 'run')) H.act[k].timeScale = Math.max(0.5, Math.min(2, H.v / (k === 'run' ? 3.2 : 1.3))); }
  function tick(dt) { if (!U.on()) return; const far = PERF ? 24 : 40;
    for (const a of (U.xs ? mobs.concat(U.xs()) : mobs)) { if (!a || !a.g) continue;
      if (!a.__hd) { if (a.__hdTry === 2 || !U.cat[a.kind]) continue; const M = load(a.kind); if (!M) continue; if (M.fail) { a.__hdTry = 2; continue; } if (M.ready) { try { attach(a, M); } catch (e) { a.__hdTry = 2; U.err.push(a.kind + ' attach ' + e); } } continue; }
      const H = a.__hd, c = U.cat[a.kind]; show(a, H, !(c.proc && c.proc(a))); if (!H.on) continue; const d = Math.hypot(a.g.position.x - P.x, a.g.position.z - P.z); H.acc += dt; if (d > far && (++H.n & 3)) continue; if (d > far * 2.5) { H.acc = 0; continue; }
      try { animate(a, H, H.acc); H.mix.update(H.acc); for (const f of U.frame) f(a, H, c); } catch (e) { U.err.push('anim ' + e); } H.acc = 0; } }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { if (started) tick(Math.min(0.1, +dt || 0.016)); } catch (e) { if (U.err.length < 20) U.err.push(String(e)); } return r; };
  const rm = removeMob; removeMob = function (a) { try { if (a && a.__hd) { const H = a.__hd; a.g.remove(H.hd); H.mix.stopAllAction(); a.__hd = null; U.attached--; } } catch (_) {} return rm.apply(this, arguments); };
  // ---- settings: on/off (no reload) + the credit line ----
  try { const pr = document.getElementById('perfSeg'), row = pr && pr.closest('.set'); if (row) {
      const d = document.createElement('div'); d.className = 'set inline'; d.innerHTML = '<span>HD mob models</span><div class="seg" id="hdSeg"><button data-v="1" data-testid="settings-hd-1">On</button><button data-v="0" data-testid="settings-hd-0">Off</button></div>';
      const cr = document.createElement('div'); cr.className = 'set'; cr.id = 'hdCredit'; cr.style.cssText = 'font-size:12px;opacity:.8;line-height:1.35'; cr.textContent = 'Mob models: Quaternius (CC0 1.0, quaternius.com) via Poly Pizza. Full list in CREDITS.md.';
      row.after(d); d.after(cr);
      d.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { SET.hd = Number(b.dataset.v); saveSet(); if (!SET.hd) U.detachAll(); else for (const a of mobs) a.__hdTry = 0; syncSettingsUI(); }));
      const bs = syncSettingsUI; syncSettingsUI = function () { bs.apply(this, arguments); document.querySelectorAll('#hdSeg button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === (SET.hd === 0 ? 0 : 1))); }; syncSettingsUI(); } } catch (e) { U.err.push('settings ' + e); }
  U.sbox = sbox; U.models = U.models;
})();
