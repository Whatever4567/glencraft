/* ===================== GLX-C179 (v1.0.34): TEMPLATE tool - ghost preview, LB/RB turning, placing spread across frames ===================== */
(function c179() {
  const U = window.__c178; if (!U) return;
  const C = () => window.__c177;
  const ghostM = new THREE.MeshBasicMaterial({color: 0x59b4ff, transparent: true, opacity: 0.3, depthWrite: false});
  const edgeM = new THREE.LineBasicMaterial({color: 0x8fd0ff, transparent: true, opacity: 0.95, depthTest: false});
  const cube = new THREE.BoxGeometry(0.96, 0.96, 0.96), M4 = new THREE.Matrix4();
  const G = new THREE.Group(); G.visible = false; G.frustumCulled = false; try { scene.add(G); } catch (_) {}
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), edgeM); outline.renderOrder = 9; outline.frustumCulled = false; G.add(outline);
  let inst = null, cells = null, origin = null; const CAP = 40000;
  // rotation: one step maps (x, z) in a w x d footprint to (d-1-z, x); a facing f turns to (f+3)%4 (doors only have 2 ways: f^1)
  function rotXZ(x, z, w, d, k) { for (let i = 0; i < k; i++) { const nx = d - 1 - z; z = x; x = nx; const t = w; w = d; d = t; } return [x, z]; }
  const rdims = (t, k) => k & 1 ? [t.d, t.w] : [t.w, t.d];
  function rotMeta(o, k) { const m = Object.assign({}, o); if (typeof m.face === 'number' && k) { if ('open' in m) m.face = (m.face ^ (k & 1)); else m.face = (m.face + 3 * k) % 4; } return m; }
  U.rotMeta = rotMeta; U.rotXZ = rotXZ;
  function buildGhost() { const t = U.tpl; if (inst) { G.remove(inst); inst.dispose && inst.dispose(); inst = null; } if (!t) return;
    const {w, h, d, b} = t, at = (x, y, z) => x < 0 || y < 0 || z < 0 || x >= w || y >= h || z >= d ? 0 : b[(x * h + y) * d + z]; const list = [];
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) { if (!at(x, y, z)) continue;
      if (at(x + 1, y, z) && at(x - 1, y, z) && at(x, y + 1, z) && at(x, y - 1, z) && at(x, y, z + 1) && at(x, y, z - 1)) continue; list.push(x, y, z); }
    const n = list.length / 3, step = Math.max(1, Math.ceil(n / CAP)), cnt = Math.ceil(n / step); inst = new THREE.InstancedMesh(cube, ghostM, Math.max(1, cnt)); inst.frustumCulled = false; inst.renderOrder = 7;
    let j = 0; for (let i = 0; i < n; i += step) { const [rx, rz] = rotXZ(list[i * 3], list[i * 3 + 2], w, d, U.rot); M4.makeTranslation(rx + 0.5, list[i * 3 + 1] + 0.5, rz + 0.5); inst.setMatrixAt(j++, M4); }
    inst.count = j; inst.instanceMatrix.needsUpdate = true; G.add(inst); const [W2, D2] = rdims(t, U.rot); outline.scale.set(W2 + .04, h + .04, D2 + .04); outline.position.set(W2 / 2, h / 2, D2 / 2); cells = j; }
  U.use = function (r) { if (!r || !r.b) return; U.tpl = r; U.rot = 0; origin = null; buildGhost(); toast('Template "' + r.name + '" - RT places it, LB/RB turn it, B puts it away'); };
  U.rotate = function (dir) { U.rot = (U.rot + (dir > 0 ? 1 : 3)) % 4; buildGhost(); try { sfx('pop', .3); } catch (_) {} };
  U.active = () => !!U.tpl && !U.job;
  U.LT = function () { if (U.job) { toast('Still placing the last template'); return; } U.list(); };
  U.B = function () { if (U.job) { U.job = null; toast('Placing stopped'); try { rebuild(); } catch (_) {} return; } if (U.tpl) { U.tpl = null; buildGhost(); toast('Template put away'); } };
  function aimOrigin() { const t = U.tpl, r = C().aim(64); if (!r) return origin; const base = r.prev || [r.hit[0], r.hit[1] + 1, r.hit[2]], [W2, D2] = rdims(t, U.rot);
    return [base[0] - (W2 >> 1), base[1], base[2] - (D2 >> 1)]; }
  U.RT = function () { if (U.job) return; if (!U.tpl) { toast('LT to choose a template'); return; } const o = aimOrigin(); if (!o) { toast('Aim at the ground'); return; }
    const t = U.tpl; U.job = {t, o: o.slice(), rot: U.rot, y: 0, x: 0, n: 0, skip: 0, meta: new Map(t.m || []), dim: !!DIM.cur}; toast('Placing "' + t.name + '"...'); };
  function work(budget) { const J = U.job, t = J.t, {w, h, d, b} = t, t0 = performance.now();
    while (J.y < h) { for (; J.x < w; J.x++) { for (let z = 0; z < d; z++) { const i = (J.x * h + J.y) * d + z, v = b[i], [rx, rz] = rotXZ(J.x, z, w, d, J.rot), X = J.o[0] + rx, Y = J.o[1] + J.y, Z = J.o[2] + rz;
          if (X < 0 || Z < 0 || X >= W || Z >= D || Y < 1 || Y >= H - 1) continue; const cur = getB(X, Y, Z); if (cur === v) continue;
          if (cur && (J.dim || placedSet.has(idx(X, Y, Z)))) { J.skip++; continue; }   // never replace your own blocks (in Hell: only fill air)
          if (!v) { if (cur !== T.WATER && cur !== T.LAVA) setB(X, Y, Z, T.AIR); continue; }
          setB(X, Y, Z, v); J.n++; const m = J.meta.get(i); if (m) entMeta.set(keyOf(X, Y, Z), rotMeta(m, J.rot)); if (U.onPut) try { U.onPut(J, i, X, Y, Z, v); } catch (e) { U.err = 'put ' + e; } }
        if (performance.now() - t0 > budget) { J.x++; return false; } }
      J.x = 0; J.y++; }
    return true; }
  U.frame = function (dt, held) { try {
      if (U.job) { const done = work(typeof PERF !== 'undefined' && PERF ? 4 : 7); if (done) { const J = U.job; U.job = null; U.placed++; try { rebuild(); } catch (_) {} try { if (window.syncFences) syncFences(); } catch (_) {}
          toast('Placed "' + J.t.name + '" (' + J.n + ' blocks' + (J.skip ? ', ' + J.skip + ' of your own blocks kept' : '') + ')'); try { sfx('place', 1); } catch (_) {} } }
      if (!held || !U.tpl || U.job) { G.visible = false; return; } const o = aimOrigin(); if (!o) { G.visible = false; return; } origin = o; G.position.set(o[0], o[1], o[2]); G.visible = true;
    } catch (e) { U.err = 'frame ' + e; U.job = null; } };
  U.hint = () => U.job ? 'TEMPLATE: placing ' + Math.round(U.job.y / U.job.t.h * 100) + '% - B stops' : U.tpl ? 'TEMPLATE "' + U.tpl.name + '": RT places, LB/RB turn, LT list, B puts away' : 'TEMPLATE: LT opens your templates';
  U.cells = () => cells;
})();
