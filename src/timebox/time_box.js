/* GLX-TBOX (v1.1.55): THE GLENCRAFT TIME BOX. A blue wooden box with a slate gable roof and a lamp on top that is bigger on the inside.
   Walk up and the doors swing open; walk through and you are in a round wooden room with a tartan floor, brass ribs and a glowing
   console with a crystal column that rises and falls. There is no portal effect: the room is real geometry, only drawn where you can
   see it through the doorway, the outside of the box is hidden once you are in, and the walls switch over at the threshold so it feels
   like walking into an ordinary room. Name and colour can be changed: __tbox.brand(name, colour). It is found near Earth spawn. */
(function tbox() {
  const U = window.__tbox = {err: null, inside: false, camIn: false, door: 0, placed: 0, frames: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const RR = 4.6, RH = 4.4, HW = 0.85, DW = 0.5, DH = 2.05, BH = 2.6;
  let cfg = {name: 'GLENCRAFT TIME BOX', color: 0x1f4e8c}; try { Object.assign(cfg, JSON.parse(localStorage.getItem('glx_tbox_cfg') || '{}')); } catch (_) {}
  U.cfg = cfg; U.RR = RR; U.HW = HW; U.DW = DW;
  const S = U.S = {x: 0, y: 0, z: 0, on: false};
  const key = () => 'glx_tbox_' + ((typeof current !== 'undefined' && current && current.id) || 'w');
  U.save = () => { try { localStorage.setItem(key(), JSON.stringify({x: S.x, y: S.y, z: S.z})); } catch (_) {} };
  const cv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t; };
  const hex = n => '#' + n.toString(16).padStart(6, '0');
  const planks = (base, n) => cv(64, 64, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { g.fillStyle = 'rgba(0,0,0,' + (0.08 + (i % 3) * 0.05) + ')'; g.fillRect(i * w / n, 0, 1, h); }
    for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(255,255,255,' + Math.random() * 0.06 + ')'; g.fillRect(Math.random() * w, Math.random() * h, 1, 3 + Math.random() * 6); } });
  const tartan = cv(64, 64, (g, w, h) => { g.fillStyle = '#1d3b2a'; g.fillRect(0, 0, w, h); g.globalAlpha = 0.55;
    for (const [c, o, s] of [['#a8232e', 0, 16], ['#123a6b', 24, 10], ['#e9d27a', 40, 2], ['#000', 52, 6]]) { g.fillStyle = c; g.fillRect(o, 0, s, h); g.fillRect(0, o, w, s); } });
  tartan.wrapS = tartan.wrapT = THREE.RepeatWrapping; tartan.repeat.set(4, 4);
  // ---------- outside ----------
  const ext = new THREE.Group(), doors = new THREE.Group(), all = new THREE.Group(); all.add(ext); all.add(doors);
  let blueM = null, signT = null;
  function sign() { return cv(256, 32, (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4ecd0'; g.font = 'bold 19px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(cfg.name.slice(0, 24), w / 2, h / 2 + 1); }); }
  function buildExt() {
    ext.clear(); doors.clear();
    const wood = planks(hex(cfg.color), 6); blueM = new THREE.MeshLambertMaterial({color: 0xffffff, map: wood});
    const dark = new THREE.MeshLambertMaterial({color: new THREE.Color(cfg.color).multiplyScalar(0.6)}), slate = new THREE.MeshLambertMaterial({color: 0x3b4048});
    const glass = new THREE.MeshBasicMaterial({color: 0xfff1c4}), B = (w, h, d, m, x, y, z, p) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); (p || ext).add(o); return o; };
    B(2 * HW + 0.12, 0.14, 2 * HW + 0.12, dark, 0, 0.07, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(0.16, BH, 0.16, blueM, sx * (HW - 0.02), BH / 2, sz * (HW - 0.02));
    B(2 * HW - 0.1, BH - 0.2, 0.08, blueM, 0, BH / 2, -HW + 0.04);
    for (const sx of [-1, 1]) B(0.08, BH - 0.2, 2 * HW - 0.1, blueM, sx * (HW - 0.04), BH / 2, 0);
    for (const sx of [-1, 1]) { B(HW - DW, BH - 0.2, 0.08, blueM, sx * (DW + (HW - DW) / 2), BH / 2, HW - 0.04); }
    B(2 * HW, BH - DH - 0.1, 0.08, blueM, 0, (BH + DH) / 2 + 0.05, HW - 0.04);
    signT = sign(); const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.2), new THREE.MeshBasicMaterial({map: signT})); sg.position.set(0, BH - 0.2, HW + 0.01); ext.add(sg);
    const sb = sg.clone(); sb.rotation.y = Math.PI; sb.position.z = -HW - 0.01; ext.add(sb);
    for (const sx of [-1, 1]) for (const r of [0, 1]) { const w = B(0.32, 0.3, 0.02, glass, sx * HW + sx * 0.005, 1.65, (r ? 0.3 : -0.3)); w.rotation.y = Math.PI / 2; }
    for (const sd of [-1, 1]) { const rf = B(2 * HW * 0.78, 0.08, 2 * HW + 0.3, slate, sd * HW * 0.5, BH + 0.32, 0); rf.rotation.z = -sd * 0.62; }
    B(2 * HW - 0.08, 0.5, 0.06, blueM, 0, BH + 0.2, HW - 0.05); B(2 * HW - 0.08, 0.5, 0.06, blueM, 0, BH + 0.2, -HW + 0.05);
    const lamp = B(0.16, 0.24, 0.16, glass, 0, BH + 0.78, 0); lamp.userData.lamp = 1; U.lamp = lamp; B(0.22, 0.05, 0.22, dark, 0, BH + 0.92, 0); B(0.22, 0.05, 0.22, dark, 0, BH + 0.65, 0);
    for (const sx of [-1, 1]) { const hg = new THREE.Group(); hg.position.set(sx * DW, 0.12, HW - 0.04); doors.add(hg);
      const lf = B(DW, DH - 0.12, 0.06, blueM, -sx * DW / 2, (DH - 0.12) / 2, 0, hg);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) B(0.17, 0.2, 0.02, glass, -sx * (0.13 + c * 0.22), DH - 0.45 - r * 0.24, 0.035, hg);
      B(0.03, 0.12, 0.04, dark, -sx * (DW - 0.06), 1.0, 0.05, hg); hg.userData.sx = sx; lf.userData.leaf = 1; }
    all.traverse(o => { o.frustumCulled = false; });
  }
  // ---------- inside (real geometry, drawn only through the doorway) ----------
  const TS = new THREE.Scene(), HS = new THREE.Scene(), room = new THREE.Group(); TS.add(room); const RM = []; TS.autoUpdate = true;
  HS.add(new THREE.HemisphereLight(0xfff0d8, 0x6b4a2a, 1.0)); const dl = new THREE.DirectionalLight(0xffffff, 0.5); dl.position.set(1, 2, 1); HS.add(dl);
  const SM = o => { o.stencilWrite = true; o.stencilRef = 1; o.stencilFunc = THREE.EqualStencilFunc; o.stencilZPass = THREE.KeepStencilOp; o.fog = false; RM.push(o); return o; };
  const mask = new THREE.Mesh(new THREE.PlaneGeometry(2 * DW, DH - 0.1), new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: false, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp}));
  mask.position.set(0, 0.12 + (DH - 0.1) / 2, HW - 0.03); mask.renderOrder = 1; TS.add(mask);
  const farM = new THREE.ShaderMaterial({vertexShader: 'void main(){ gl_Position = vec4(position.xy * 2.0, 0.99999, 1.0); }', fragmentShader: 'void main(){ gl_FragColor = vec4(0.0); }',
    colorWrite: false, depthWrite: true, depthTest: true, depthFunc: THREE.AlwaysDepth, stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc, stencilZPass: THREE.KeepStencilOp});
  const farQ = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), farM); farQ.renderOrder = 2; farQ.frustumCulled = false; TS.add(farQ);
  const RO = 5, CZ = HW - RR;
  function buildRoom() {
    const wallT = planks('#6b4426', 10); wallT.wrapS = THREE.RepeatWrapping; wallT.repeat.set(9, 1);
    const g = Math.asin((DW + 0.04) / RR) * 2, wall = new THREE.Mesh(new THREE.CylinderGeometry(RR, RR, RH, 40, 1, true, g / 2, Math.PI * 2 - g), SM(new THREE.MeshBasicMaterial({map: wallT, side: THREE.BackSide})));
    wall.position.set(0, RH / 2, CZ); room.add(wall);
    const lin = new THREE.Mesh(new THREE.PlaneGeometry(2 * DW + 0.2, RH - DH), SM(new THREE.MeshBasicMaterial({map: wallT, side: THREE.DoubleSide}))); lin.position.set(0, DH + (RH - DH) / 2, HW - 0.02); room.add(lin);
    const fl = new THREE.Mesh(new THREE.CircleGeometry(RR + 0.05, 40), SM(new THREE.MeshBasicMaterial({map: tartan}))); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.01, CZ); room.add(fl);
    const step = new THREE.Mesh(new THREE.BoxGeometry(2 * DW + 0.1, 0.02, 0.9), SM(new THREE.MeshBasicMaterial({color: 0x4a2f1b}))); step.position.set(0, 0.02, HW - 0.45); room.add(step);
    const ce = new THREE.Mesh(new THREE.CircleGeometry(RR + 0.05, 40), SM(new THREE.MeshBasicMaterial({color: 0x241a14}))); ce.rotation.x = Math.PI / 2; ce.position.set(0, RH, CZ); room.add(ce);
    const brass = SM(new THREE.MeshBasicMaterial({color: 0xc9a227})), amber = SM(new THREE.MeshBasicMaterial({color: 0xffc46b})), teal = SM(new THREE.MeshBasicMaterial({color: 0x5ff2d6}));
    for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * Math.PI * 2; if (Math.abs(Math.sin(a / 2)) < 0.2) continue; const r = new THREE.Mesh(new THREE.BoxGeometry(0.14, RH, 0.14), brass); r.position.set(Math.sin(a) * (RR - 0.08), RH / 2, CZ + Math.cos(a) * (RR - 0.08)); room.add(r);
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.04), amber); p.position.set(Math.sin(a + 0.26) * (RR - 0.04), 2.4, CZ + Math.cos(a + 0.26) * (RR - 0.04)); p.rotation.y = a + 0.26; room.add(p); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.06, 6, 40), amber); ring.rotation.x = Math.PI / 2; ring.position.set(0, RH - 0.05, CZ); room.add(ring);
    const oak = SM(new THREE.MeshBasicMaterial({color: 0x5a3a1e})), top = SM(new THREE.MeshBasicMaterial({color: 0x8a6a2a}));
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.95, 6), oak); base.position.set(0, 0.48, CZ); room.add(base);
    const desk = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.75, 0.16, 6), top); desk.position.set(0, 1.02, CZ); room.add(desk);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6, k = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.1), i % 2 ? teal : amber); k.position.set(Math.sin(a) * 0.85, 1.12, CZ + Math.cos(a) * 0.85); room.add(k); }
    const glassR = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.9, 0.04), brass); b.position.set(Math.sin(a) * 0.32, 2.05, CZ + Math.cos(a) * 0.32); room.add(b); glassR.push(b); }
    const col = new THREE.Group(); col.position.set(0, 1.1, CZ); room.add(col); U.col = col;
    for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.2 - i * 0.02), teal); c.position.y = 0.4 + i * 0.4; c.scale.y = 1.6; col.add(c); }
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.1, 12), brass); pipe.position.set(0, 3.0, CZ); room.add(pipe); const pp = pipe.clone(); pp.position.y = RH - 0.4; pp.scale.set(1.3, 8, 1.3); room.add(pp);
    room.traverse(o => { o.frustumCulled = false; if (o.isMesh) o.renderOrder = RO; });
  }
  U.brand = (name, color) => { if (name) cfg.name = String(name); if (color != null) cfg.color = +color; try { localStorage.setItem('glx_tbox_cfg', JSON.stringify(cfg)); } catch (_) {} buildExt(); };
  U.parts = {all, ext, doors, room, mask, farQ, TS};
  try { buildExt(); buildRoom(); all.visible = false; scene.add(all); } catch (e) { ERR('build', e); }
  // ---------- place it: found near Earth spawn ----------
  U.place = (x, y, z) => { S.x = x; S.y = y; S.z = z; S.on = true; all.position.set(x, y, z); all.visible = true; U.placed++; U.save(); };
  function load() { try { const s = JSON.parse(localStorage.getItem(key()) || 'null'); if (s) { S.x = s.x; S.y = s.y; S.z = s.z; S.on = true; all.position.set(s.x, s.y, s.z); all.visible = true; return; }
      const x = Math.floor(W / 2) + 6, z = Math.floor(D / 2) + 4; U.place(x + 0.5, groundTop(x, z) + 1, z + 0.5); } catch (e) { ERR('load', e); } }
  U.load = load; let lk = null;
  // ---------- door, threshold, draw mode ----------
  const cp = new THREE.Vector3(), handOrd = new Map();
  const inRoom = (x, z, pad) => Math.hypot(x - S.x, z - (S.z + CZ)) < RR - (pad || 0);
  const lift = [0, 1].map(() => { const g = new THREE.Group(); g.matrixAutoUpdate = false; HS.add(g); return g; });
  function overlay(r, c) { const L = []; try { if (hand && hand.parent === camera) L.push(hand); } catch (_) {} try { if (worldModel && worldModel.parent && worldModel.visible) L.push(worldModel); } catch (_) {}
    const back = []; L.forEach((o, i) => { const p = o.parent; p.updateMatrixWorld(); lift[i].matrix.copy(p.matrixWorld); lift[i].matrixWorld.copy(p.matrixWorld); back.push([o, p]); lift[i].add(o); });
    try { r.clearDepth(); r.render(HS, c); } finally { for (const [o, p] of back) p.add(o); } }
  let deep = 0; scene.onAfterRender = (function (oa) { return function (r, s, c) { try { if (oa) oa.apply(this, arguments); } catch (_) {}
    if (deep || c !== camera || !S.on || !room.visible || !all.visible) return; deep = 1; const ac = r.autoClear, cp0 = r.clippingPlanes;
    try { r.autoClear = false; r.clippingPlanes = []; r.state.buffers.stencil.setMask(0xff); r.clearStencil(); room.position.copy(all.position); mask.position.x = all.position.x; mask.position.y = all.position.y + 0.12 + (DH - 0.1) / 2; mask.position.z = all.position.z + HW - 0.03;
      r.render(TS, c); if (U.camIn) overlay(r, c); U.passes = (U.passes || 0) + 1; } catch (e) { ERR('ar', e); } finally { r.autoClear = ac; r.clippingPlanes = cp0; deep = 0; } }; })(scene.onAfterRender);
  scene.onBeforeRender = (function (ob) { return function (r, s, c) { try { if (ob) ob.apply(this, arguments); } catch (_) {}
    try { const k = key(); if (started && k !== lk) { lk = k; load(); } if (!S.on || !started) { all.visible = false; room.visible = false; return; } if (c !== camera) return;
      U.frames++; c.getWorldPosition(cp); const fz = S.z + HW, near = Math.hypot(P.x - S.x, P.z - fz - 0.6) < 2.6 && Math.abs(P.y - S.y) < 2.5;
      const camIn = cp.z < fz - 0.02 && inRoom(cp.x, cp.z) && cp.y > S.y - 0.5 && cp.y < S.y + RH && (U.inside || (Math.abs(cp.x - S.x) < HW && cp.z > fz - 2 * HW));
      const want = (near || U.inside || camIn) ? 1 : 0; U.door += Math.max(-0.06, Math.min(0.06, want - U.door));
      for (const hg of doors.children) hg.rotation.y = hg.userData.sx * U.door * 1.75;
      all.visible = Math.hypot(cp.x - S.x, cp.z - S.z) < 160; ext.visible = !camIn; mask.visible = !camIn && U.door > 0.05; room.visible = camIn || U.door > 0.05;
      if (camIn !== U.camIn) { U.camIn = camIn; for (const m of RM) m.stencilFunc = camIn ? THREE.AlwaysStencilFunc : THREE.EqualStencilFunc; farM.stencilFunc = camIn ? THREE.AlwaysStencilFunc : THREE.EqualStencilFunc; for (const m of RM) m.needsUpdate = true; farM.needsUpdate = true; }
      if (U.lamp) U.lamp.material.color.setHSL(0.12, 1, 0.6 + 0.25 * Math.sin(performance.now() / 300) * (U.fly || 0.2));
      const rt = r.getRenderTarget(); if (rt && !rt.stencilBuffer && !rt.__tb) { rt.__tb = 1; U.fixRT = rt; }
    } catch (e) { ERR('rb', e); } }; })(scene.onBeforeRender);
  // the post effect draws into its own buffer: give it a stencil once, between frames
  (function fix() { try { const rt = U.fixRT; if (rt && !rt.stencilBuffer) { rt.stencilBuffer = true; rt.dispose(); U.rtFixed = (U.rtFixed || 0) + 1; } } catch (e) { ERR('rt', e); } requestAnimationFrame(fix); })();
})();
