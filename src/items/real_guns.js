/* GLX-C322 (v1.1.99): REAL GUNS. The Highland rifle and the Highland pistol use real scanned style models with full PBR textures
   (Bolt Action Rifle 7.62 and Service Pistol by Mateusz Sadek, Poly Haven, CC0): 4K textures on computers, 2K on phones, loaded only when
   you first hold a gun. Real recorded sounds (CC0, OpenGameArt): the shot, the reload, the bolt and an empty click. The old blocky guns stay
   as the fallback and when HD is off. Aiming lines up on the new iron sights (the pistol is centred by C288, the rifle by C145). */
(function c322() {
  const U = window.__c322 = {err: null, ok: {}, swapped: 0, buf: {}, played: 0, res: ''};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const PH = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || (typeof touchMode !== 'undefined' && touchMode && innerWidth < 1000);
  const RES = U.res = PH ? '2k' : '4k', BASE = 'assets/guns/', VER = 'g1129';
  const hd = () => { try { return SET.hd !== 0; } catch (_) { return true; } };
  // ---------- sounds ----------
  const SND = {ps: 'gun_pistol_shot', rs: 'gun_rifle_shot', pr: 'gun_pistol_reload', rb: 'gun_rifle_bolt', rl: 'gun_rifle_load', dry: 'gun_dry'};
  let sl = false; function loadS() { if (sl || typeof AC === 'undefined' || !AC) return; sl = true; for (const k in SND) fetch(BASE + SND[k] + '.mp3?' + VER).then(r => r.arrayBuffer()).then(a => AC.decodeAudioData(a)).then(b => { U.buf[k] = b; }).catch(e => ERR('snd ' + k, e)); }
  function play(k, vol, at) { try { const b = U.buf[k]; if (!b || !AC) return false; const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = b; g.gain.value = (vol || 1) * (SET.sfx == null ? 1 : SET.sfx);
      s.connect(g); g.connect(AC.destination); s.start(AC.currentTime + (at || 0)); U.played++; return true; } catch (e) { ERR('play', e); return false; } }
  U.snd = () => !!(U.buf.ps && U.buf.pr);
  U.dry = () => play('dry', 0.9);
  U.reload = (id, t) => { if (id === IT.PISTOL) play('pr', 0.9, Math.max(0, t - 1.65)); else { play('rb', 0.8); play('rl', 0.8, t * 0.45); play('rb', 0.8, Math.max(0.3, t - 0.5)); } };
  try { const gb = gunBang; gunBang = function (pos) { const k = selId === IT.PISTOL ? 'ps' : 'rs'; if (U.buf[k]) { play(k, k === 'rs' ? 1 : 0.85); try { sfx('boom', 0.25); } catch (_) {} return; } return gb.apply(this, arguments); }; } catch (e) { ERR('bang', e); }
  setInterval(() => { try { if (typeof started !== 'undefined' && started) loadS(); } catch (_) {} }, 1000);
  // ---------- models ----------
  const MOD = {}, want = {}; let libP = null;
  function lib() { if (window.THREE && THREE.GLTFLoader && window.MeshoptDecoder) return MeshoptDecoder.ready; if (libP) return libP;
    libP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'assets/models/lib.js?v1018'; s.onload = () => MeshoptDecoder.ready.then(res, rej); s.onerror = () => rej('lib'); document.head.appendChild(s); }); return libP; }
  function load(n) { if (want[n]) return; want[n] = 1; lib().then(() => new Promise((res, rej) => { const L = new THREE.GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder); L.load(BASE + 'gun_' + n + '_' + RES + '.glb?' + VER, res, null, rej); }))
      .then(g => { const r = g.scene; r.traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; const m = o.material; if (m && m.map) m.map.anisotropy = 4; if (m && /glass/i.test(m.name)) o.visible = false; } if (/_scope$/.test(o.name)) o.visible = false; });
        MOD[n] = r; U.ok[n] = 1; }).catch(e => { ERR('load ' + n, e); }); }
  U.load = load;
  const BB = new THREE.Box3(), V = new THREE.Vector3();
  const box = (o, rel) => { const b = new THREE.Box3(); o.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(rel.matrixWorld).invert();
    o.traverse(m => { if (m.isMesh && m.visible && m.geometry) { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld).applyMatrix4(inv)); } }); return b; };
  function swap(g) { const u = g.userData, isP = u.gun === IT.PISTOL, n = isP ? 'pistol' : 'rifle', M = MOD[n]; if (!M || u.c322) return;
    // Hide procedural gun before asset swap so old textures never flash; reveal only after final mesh is parented
    try { g.visible = false; if (u.rig) u.rig.visible = false; } catch (_) {}
    const rig = u.rig; rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0); rig.updateMatrixWorld(true); const ob = box(rig, rig); if (ob.isEmpty()) { try { g.visible = true; if (rig) rig.visible = true; } catch (_) {} return; }
    const m = M.clone(true); m.rotation.y = Math.PI / 2; const hold = new THREE.Group(); hold.add(m); const nb = box(hold, hold), L0 = ob.max.z - ob.min.z, L1 = nb.max.z - nb.min.z, k = L0 / L1;
    hold.scale.setScalar(k); m.position.set(0, 0, 0); const nb2 = box(hold, hold); m.position.set(-(nb2.min.x + nb2.max.x) / 2 / k, ((ob.min.y + ob.max.y) / 2 - (nb2.min.y + nb2.max.y) / 2) / k + (isP ? 0 : (ob.max.y - ob.min.y) * 0.08 / k), (ob.max.z - nb2.max.z) / k);
    while (rig.children.length) rig.remove(rig.children[0]); rig.add(hold); hold.updateMatrixWorld(true);
    // moving parts in their own holders (C43 moves the holder, the part keeps its spot)
    const part = re => { let f = null; m.traverse(o => { if (!f && re.test(o.name)) f = o; }); if (!f) return new THREE.Group(); const h = new THREE.Group(); f.parent.add(h); h.attach(f); const w = new THREE.Group(); hold.add(w); w.attach(h); return w; };
    u.slide = part(isP ? /slide_a$/ : /bolt_a$/); u.mag = part(isP ? /magazine_loaded$/ : /^$/);
    const fb = box(hold, rig), mz = new THREE.Object3D(); mz.position.set((fb.min.x + fb.max.x) / 2, isP ? fb.max.y - (fb.max.y - fb.min.y) * 0.18 : fb.max.y - (fb.max.y - fb.min.y) * 0.3, fb.min.z - 0.01); rig.add(mz); u.muzzle = mz;
    // the sights: highest point over the front end of the barrel, at the back of the gun
    rig.updateMatrixWorld(true); let fy = -1e9; const P0 = new THREE.Vector3(), inv = new THREE.Matrix4().copy(rig.matrixWorld).invert(), zc = fb.min.z + (fb.max.z - fb.min.z) * (isP ? 0.25 : 0.06);
    hold.traverse(o => { if (!o.isMesh || !o.visible) return; const p = o.geometry.attributes.position; const A = p.array, nq = p.normalized ? (A instanceof Int16Array ? 1 / 32767 : A instanceof Int8Array ? 1 / 127 : A instanceof Uint16Array ? 1 / 65535 : A instanceof Uint8Array ? 1 / 255 : 1) : 1; for (let i = 0; i < p.count; i += 1) { P0.fromBufferAttribute(p, i).multiplyScalar(nq).applyMatrix4(o.matrixWorld).applyMatrix4(inv); if (P0.z < zc && Math.abs(P0.x - mz.position.x) < 0.01 && P0.y > fy && P0.y <= fb.max.y + 1e-3) fy = P0.y; } });
    if (fy > -1e8) { u.sight = new THREE.Vector3(mz.position.x, fy + (isP ? 0 : 0.008), isP ? fb.max.z : 0.04); u.frontY = fy; }
    u.c322 = 1; u.__s0Base = u.__s0Base || null; try { rig.visible = true; g.visible = true; } catch (_) {} U.swapped++; U.last = {n, k: +k.toFixed(3), L0: +L0.toFixed(3), sight: u.sight && u.sight.toArray().map(v => +v.toFixed(4))}; }
  U.swap = swap;
  setInterval(() => { try { if (typeof started === 'undefined' || !started || !hd()) return; const h = typeof held !== 'undefined' ? held : null; if (!h) return;
      h.traverse(o => { const u = o.userData; if (!u || !u.rig || !u.gun || u.c322) return; const n = u.gun === IT.PISTOL ? 'pistol' : 'rifle'; if (!MOD[n]) load(n); else swap(o); }); } catch (e) { ERR('scan', e); } }, 250);
})();
