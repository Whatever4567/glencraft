/* ===================== GLX-C196 (v1.0.37): falling pieces - a chopped tree topples and breaks apart into a few logs on impact (big trees drop far fewer), loose leaves fall and fade away, loose earth drops and lands ===================== */
(function c196() {
  const U = window.__c196 = {bodies: 0, live: 0, logsIn: 0, logsOut: 0, err: null};
  const B = [], CH = [], FL = []; const MAXI = 700;
  const chunkGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
  const logDrops = n => n <= 6 ? n : Math.min(14, Math.round(6 + (n - 6) * 0.35));
  U.logDrops = logDrops;
  // one InstancedMesh per block type, in a group whose origin is the pivot
  function body(blocks, px, py, pz) { const g = new THREE.Group(); g.position.set(px, py, pz); const by = new Map(), m = new THREE.Matrix4(); let n = 0;
    for (const e of blocks) { if (n++ >= MAXI) break; if (!BLOCK_MATS[e[3]]) continue; if (!by.has(e[3])) by.set(e[3], []); by.get(e[3]).push(e); }
    for (const [id, arr] of by) { const im = new THREE.InstancedMesh(blockGeo, BLOCK_MATS[id], arr.length); im.frustumCulled = false;
      arr.forEach(([x, y, z], i) => { m.makeTranslation(x + .5 - px, y + .5 - py, z + .5 - pz); im.setMatrixAt(i, m); }); im.instanceMatrix.needsUpdate = true; g.add(im); }
    scene.add(g); return g; }
  function kill(g) { scene.remove(g); g.children.forEach(c => { try { c.dispose && c.dispose(); } catch (_) {} }); }
  // how far a rigid piece can drop before something stops it
  function dropDist(blocks) { const own = new Set(blocks.map(e => idx(e[0], e[1], e[2]))); let dd = 64;
    for (const [x, y, z] of blocks) { let d = 0; while (d < dd && y - d - 1 > 0) { const j = idx(x, y - d - 1, z); if (own.has(j)) { d = dd; break; } if (solid(x, y - d - 1, z)) break; d++; } if (d < dd) dd = d; }
    return dd; }
  const wpos = (f, x, y, z, v) => v.set(x + .5 - f.px, y + .5 - f.py, z + .5 - f.pz).applyQuaternion(f.g.quaternion).add(f.g.position);
  // ---- impact: logs turn into a handful of drops + wood chunks, leaves into fluttering flakes that fade ----
  const leafMat = () => new THREE.MeshLambertMaterial({map: leafFlakeTex, color: 0x9ec46a, side: THREE.DoubleSide, transparent: true, opacity: 1, alphaTest: 0.05, depthWrite: false});
  function shatter(f) { const v = new THREE.Vector3(), logs = f.blocks.filter(e => LOGGY[e[3]]), leaves = f.blocks.filter(e => LEAFY[e[3]]);
    f.g.updateMatrixWorld();
    if (logs.length) { const want = logDrops(logs.length); U.logsIn += logs.length; U.logsOut += want; const stacks = Math.min(want, 5);
      for (let s = 0; s < stacks; s++) { const e = logs[Math.floor((s + .5) / stacks * logs.length)], cnt = Math.floor(want / stacks) + (s < want % stacks ? 1 : 0); wpos(f, e[0], e[1], e[2], v);
        dropItem(e[3] || T.LOG, cnt, v.x, v.y + 0.4, v.z, (Math.random() - .5) * 1.6, 2.5 + Math.random() * 1.5, (Math.random() - .5) * 1.6, 0.3); }
      if (f.topple) { dropItem(IT.STICK, 1 + Math.floor(Math.random() * 2) + (logs.length > 12 ? 1 : 0), v.x, v.y + 0.6, v.z, 0, 3, 0, 0.4); if (Math.random() < 0.5) dropItem(IT.WSEEDS, 1, v.x, v.y + 0.6, v.z, 0, 3, 0, 0.4); }
      const step = Math.max(1, Math.floor(logs.length / 24));
      for (let k = 0; k < logs.length && CH.length < 90; k += step) { const e = logs[k]; wpos(f, e[0], e[1], e[2], v); for (let n = 0; n < 2; n++) { const m = new THREE.Mesh(chunkGeo, BLOCK_MATS[e[3]]); m.position.copy(v); scene.add(m);
          CH.push({m, vx: (Math.random() - .5) * 5, vy: 2 + Math.random() * 4, vz: (Math.random() - .5) * 5, rx: (Math.random() - .5) * 12, rz: (Math.random() - .5) * 12, t: 0, life: 0.7 + Math.random() * 0.5}); } }
      for (let s = 0; s < logs.length; s += 3) { const e = logs[s]; wpos(f, e[0], e[1], e[2], v); burst(v.x, v.y, v.z, 0x8a6a44, 4, 1.0); } }
    if (leaves.length) flakes(f, leaves, v);
    if (logs.length) { sfx('thud'); try { sfx('leaves', .8); } catch (_) {} shake(0.25, 0.02); } else if (leaves.length) try { sfx('leaves', .5); } catch (_) {} }
  function flakes(f, leaves, v) { const mat = leafMat(), list = [], step = Math.max(1, Math.floor(leaves.length / 45));
    for (let k = 0; k < leaves.length; k += step) { const e = leaves[k]; wpos(f, e[0], e[1], e[2], v); const p = new THREE.Mesh(leafFlakeGeo, mat); p.position.set(v.x + Math.random() - .5, v.y, v.z + Math.random() - .5); p.rotation.set(Math.random() * 6, Math.random() * 6, 0); scene.add(p);
      list.push({m: p, vy: 0.4 + Math.random(), vx: (Math.random() - .5) * 1.4, vz: (Math.random() - .5) * 1.4, ph: Math.random() * 6}); }
    FL.push({mat, list, t: 0}); }
  // ---- earth lands as blocks again ----
  function land(f) { const cols = new Set(); for (const [x, y, z, b] of f.blocks) { if (!TERRB(b)) continue; const Y = y - f.dd; if (Y < 1) continue; const j = idx(x, Y, z), o = world[j];
      if (!o || o === T.WATER || PLANT[o] === 1) { world[j] = b; cols.add(x * 4096 + z); } }
    for (const c of cols) { const X = Math.floor(c / 4096), Z = c % 4096; markDirty(X, Z); try { __c193.fixCol(X, Z); } catch (_) {} } sfx('thud'); }
  const TERRB = b => !!(window.__c193 && __c193.TERR[b]);
  // ---- public: a loose piece starts falling straight down ----
  U.drop = function (blocks, c) { if (!blocks.length) return; let sx = 0, sy = 1e9, sz = 0; for (const e of blocks) { sx += e[0]; sz += e[2]; if (e[1] < sy) sy = e[1]; }
    const px = sx / blocks.length + .5, pz = sz / blocks.length + .5, f = {g: body(blocks, px, sy, pz), blocks, px, py: sy, pz, vy: 0, y0: sy, dd: dropDist(blocks), leafy: !c.logs && !c.terr, t: 0};
    if (f.leafy) f.dd = Math.min(f.dd, 3);   // leaves only drift a little, then fade
    B.push(f); U.bodies++; };
  // ---- the chopped tree: same flood with gravity rules, then a topple away from you ----
  try { fellTree = function (x, y, z) { if (!LOGGY[getB(x, y + 1, z)]) return false;
      const c = __c193.comp(x, y + 1, z, 900, {box: [x, y, z, 7], nosup: true});   // like before: everything of the tree above the cut, within 7 blocks
      if (c.sup || !c.logs) return false;
      const blocks = __c193.lift(c.mem); for (let k = 0; k < blocks.length; k += 4) { const e = blocks[k]; if (k / 4 > 80) break; __c193.queue(e[0], e[1], e[2]); }   /* left-over bits of touching trees get the gravity check */ let dx = x + .5 - P.x, dz = z + .5 - P.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const f = {g: body(blocks, x + .5, y + 1, z + .5), blocks, px: x + .5, py: y + 1, pz: z + .5, topple: true, axis: new THREE.Vector3(dz, 0, -dx), ang: 0.03, vel: 0.3, t: 0};
      B.push(f); U.bodies++; sfx('creak'); try { rebuild(); } catch (_) {} return true; }; } catch (e) { U.err = String(e); }
  // ---- per frame ----
  function tick(dt) { dt = Math.min(dt, 0.05); U.live = B.length;
    for (let i = B.length - 1; i >= 0; i--) { const f = B[i]; f.t += dt; let hit = false;
      if (f.topple) { f.vel += 4.2 * Math.sin(f.ang) * dt + 0.35 * dt; f.ang += f.vel * dt; const lim = Math.PI / 2 - 0.06; if (f.ang >= lim) { f.ang = lim; hit = true; } f.g.quaternion.setFromAxisAngle(f.axis, f.ang); }
      else if (f.fade !== undefined) { f.fade += dt; const s = Math.max(0.01, 1 - f.fade / 0.6); f.g.scale.setScalar(s); if (f.fade > 0.6) { kill(f.g); B.splice(i, 1); } continue; }
      else { f.vy = Math.max(f.leafy ? -3 : -30, f.vy - (f.leafy ? 6 : 22) * dt); const yy = f.g.position.y + f.vy * dt, low = f.y0 - f.dd; if (yy <= low) { f.g.position.y = low; hit = true; } else f.g.position.y = yy; }
      if (f.t > 8) hit = true;
      if (!hit) continue;
      if (f.leafy) { const v = new THREE.Vector3(); f.g.updateMatrixWorld(); flakes(f, f.blocks, v); f.fade = 0; continue; }
      try { if (f.topple || f.blocks.some(e => LOGGY[e[3]] || LEAFY[e[3]])) shatter(f); if (!f.topple && f.blocks.some(e => TERRB(e[3]))) land(f); } catch (e) { U.err = String(e); }
      kill(f.g); B.splice(i, 1); }
    for (let i = CH.length - 1; i >= 0; i--) { const c = CH[i]; c.t += dt; c.vy -= 18 * dt; c.m.position.x += c.vx * dt; c.m.position.y += c.vy * dt; c.m.position.z += c.vz * dt; c.m.rotation.x += c.rx * dt; c.m.rotation.z += c.rz * dt;
      c.m.scale.setScalar(Math.max(0.05, 1 - c.t / c.life)); if (c.t > c.life) { scene.remove(c.m); CH.splice(i, 1); } }
    for (let i = FL.length - 1; i >= 0; i--) { const b = FL[i]; b.t += dt;
      for (const p of b.list) { p.vy = Math.max(-0.8, p.vy - dt * 2.2); p.m.position.y += p.vy * dt; p.m.position.x += (p.vx + Math.sin(b.t * 2.4 + p.ph) * 0.6) * dt; p.m.position.z += (p.vz + Math.cos(b.t * 1.9 + p.ph) * 0.4) * dt; p.m.rotation.x += dt * 2; p.m.rotation.z += dt * 1.6; }
      b.mat.opacity = Math.max(0, 1 - Math.max(0, b.t - 1.6) / 1.2); if (b.t > 2.8) { for (const p of b.list) scene.remove(p.m); b.mat.dispose(); FL.splice(i, 1); } } }
  try { const uf = updateFalling; updateFalling = function (dt) { const r = uf.apply(this, arguments); try { tick(dt); } catch (e) { U.err = String(e); } return r; }; } catch (e) { U.err = String(e); }
  U.state = () => ({bodies: B.length, chunks: CH.length, flakes: FL.length});
})();
