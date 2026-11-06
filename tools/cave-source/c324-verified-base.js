(function c324() {
  const U = window.__c324 = {err: null, meshed: 0, ms: 0, n: 0, ticks: 0, deferred: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); console.warn('c324', w, e); };
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent) || (typeof PERF !== 'undefined' && PERF), C = CH, PW = 3 * C + 1, NB = 72; let RN = PH ? 2 : 3; const RN0 = RN;
  const E = () => window.__c320, F = () => window.__c321, on = () => { try { return !!(window.__c317 && __c317.on()); } catch (_) { return false; } };
  const MS = [[[0, -1, 0], [1, 0, 0], [0, 0, 1]], [[0, 1, 0], [-1, 0, 0], [0, 0, 1]], [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[1, 0, 0], [0, -1, 0], [0, 0, -1]], [[1, 0, 0], [0, 0, 1], [0, -1, 0]], [[1, 0, 0], [0, 0, -1], [0, 1, 0]]];
  const QS = MS.map(m => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...m[0]), new THREE.Vector3(...m[1]), new THREE.Vector3(...m[2]))));
  const root = new THREE.Group(); root.name = 'earth324'; scene.add(root); const meshes = new Map(); let fAx = -1, fPiv = '', band = null, TMP = null, meshHost = null, partial = new Map();
  const drop = k => { abandonLight(k);const g = meshes.get(k); meshes.delete(k); if (!g) return; root.remove(g); g.traverse(o => { if (o.isInstancedMesh) o.dispose(); else if (o.geometry) o.geometry.dispose(); }); };
  const dropAll = () => { for(const k of [...pendingLight.keys()])abandonLight(k); for (const k of [...meshes.keys()]) drop(k); stale.clear(); U.dirty.clear(); };
  U.dirty = new Set(); const eB = {k: null, v: null, m: null}; const stale = new Set();
  // One generation owns every coarse and near-field cave producer. Only the confirmed
  // existing C105 reset entry or a new world buffer advances it, never travel/travel ticks.
  let generation=1;U.generation=generation;
  function invalidateGenerationWithoutGuard(next){
    if(!Number.isSafeInteger(next)||next<generation)return false;
    generation=next;U.generation=next;U.invalidated=next;
    dropAll();cache.clear();partial.clear();meshHost=null;TMP=null;eV=-1;eL=[];eB.k=eB.v=eB.m=null;band=null;
    lightEpoch++;
    return true;
  }
  U.invalidateGeneration=next=>{
    return Number.isSafeInteger(next)&&next>generation&&invalidateGenerationWithoutGuard(next);
  };
  // v1.1.38: generated blocks are cached in 8 high slabs per chunk column, so digging, walking and going down rebuild from the cache, not from the noise
  const SL = 8, SW = C + 2, cache = new Map(); let eV = -1, eL = [];
  function slab(ax, piv, cx, cz, sy) { const key = ax + '|' + piv.join() + '|' + cx + ',' + cz + ',' + sy; let A = cache.get(key); if (A) { cache.delete(key); cache.set(key, A); return A; }
    const e = E(), c = e.E(), R = e.R, m = MS[ax], Z0 = (typeof __XZ !== 'undefined' && __XZ) ? __XZ : 0; A = new Uint8Array(SW * SL * SW); U.gen = (U.gen || 0) + 1;
    for (let i = 0; i < SW; i++) for (let k = 0; k < SW; k++) { const lx = cx * C - 1 + i, lz = cz * C - 1 + k, ox = lx + 0.5 - piv[0], oz = lz + 0.5 - piv[2]; let gk = null;
      for (let j = 0; j < SL; j++) { const oy = sy + j + 0.5 - piv[1], wx = Math.round(m[0][0] * ox + m[1][0] * oy + m[2][0] * oz + piv[0] - 0.5), wy = Math.round(m[0][1] * ox + m[1][1] * oy + m[2][1] * oz + piv[1] - 0.5), wz = Math.round(m[0][2] * ox + m[1][2] * oy + m[2][2] * oz + piv[2] - 0.5);
        if (wx >= 0 && wx < W && wz < D && wz >= Z0 && wy >= 0) { continue; }   /* v1.1.96: surface owns Y0+ mesh; deep never dual-draws it. Y0 underside seal is __YB / bottom faces */
        if (e.flat) { const ft = e.fearth && e.fearth.top; if (ft && wy - SEA > ft(wx, wz)) continue; const fb = e.earth(wx, wy, wz); if (fb) A[(i * SL + j) * SW + k] = fb; continue; }   /* v1.1.42: the flat Earth */
        const dx = wx + 0.5 - c[0], dy = wy + 0.5 - c[1], dz = wz + 0.5 - c[2], r = Math.sqrt(dx * dx + dy * dy + dz * dz), a = Math.max(wy - SEA, r - R); if (a > 32) continue;
        let b; if (e.tOn && a >= -40 && wy - SEA < r - R - 1) { b = e.terr(wx, wy, wz, dx, dy, dz, r); if (!b || b === T.WATER) continue; } else if (a < -40) { b = e.hol ? e.hol(wx, wy, wz, dx, dy, dz, r) : e.layer(r, 99, 0, wx, wy, wz); if (!b) continue; } else { if (!gk) gk = e.ground(wx, wy, wz, dx / r, dy / r, dz / r); if (a >= gk[0]) continue; b = e.layer(r, gk[0] - a, gk[1], wx, wy, wz); }
        A[(i * SL + j) * SW + k] = b; } }
    cache.set(key, A); if (cache.size > (PH ? 1500 : 3000)) cache.delete(cache.keys().next().value); return A; }
  U.cache = cache; U.slab = slab; U.fill = fill;
  U.inspect = () => ({partial: partial.size, meshes: meshes.size, deferred: U.deferred, ticks: U.ticks});
  // Pauses retain the partially assembled cells. At most one uncached eight-block slab
  // is started per tick and lighting owns a single synchronous mesh in that same tick.
  function fill(ax, piv, cx, cz, y0, t1, bud) { const e = E(), pk=ax+'|'+piv.join()+'|'+cx+','+cz+','+y0, job=partial.get(pk)||{any:false,done:0}; let any=job.any; TMP=job.data||(job.data=new Uint8Array(PW*NB*PW));
    for (let s0 = job.done; s0 < NB; s0 += SL) { const A = slab(ax, piv, cx, cz, y0 + s0);
      for (let i = 0; i < SW; i++) for (let j = 0; j < SL; j++) { const src = (i * SL + j) * SW, dst = ((C - 1 + i) * NB + s0 + j) * PW + C - 1; TMP.set(A.subarray(src, src + SW), dst);
        if (!any && i > 0 && i <= C) for (let k = 1; k <= C; k++) if (A[src + k]) { any = true; break; } } job.done=s0+SL;job.any=any;partial.set(pk,job);if(performance.now()-t1>=bud){
      // Cancelled views must not accumulate 448 KiB pending slices forever.
      if(partial.size>32){const oldest=partial.keys().next().value;if(oldest!==pk)partial.delete(oldest);}
      U.deferred++;return null;
    }}partial.delete(pk);
    // dug or placed blocks: the edits list is read once per change, not once per block
    if (e.edits.size) { if (eV === -1) { eV = 0; eL = []; for (const [k, v] of e.edits) { const q = k.split(',').map(Number); q[3] = v | 0; eL.push(q); } }
      const m = MS[ax], bk = ax + '|' + piv.join(); if (eB.k !== bk || eB.v !== eL) { eB.k = bk; eB.v = eL; eB.m = new Map();   /* v1.1.86: edits are sorted by chunk once, so each chunk only looks at its own (was every edit for every chunk) */
        for (const q of eL) { const vx = q[0] + 0.5 - piv[0], vy = q[1] + 0.5 - piv[1], vz = q[2] + 0.5 - piv[2];
          const lx = Math.round(m[0][0] * vx + m[0][1] * vy + m[0][2] * vz + piv[0] - 0.5), ly = Math.round(m[1][0] * vx + m[1][1] * vy + m[1][2] * vz + piv[1] - 0.5), lz = Math.round(m[2][0] * vx + m[2][1] * vy + m[2][2] * vz + piv[2] - 0.5);
          const r = [lx, ly, lz, q[3]]; for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) { const kk = Math.floor((lx + ox) / C) + ',' + Math.floor((lz + oz) / C); let L = eB.m.get(kk); if (!L) eB.m.set(kk, L = []); if (!L.includes(r)) L.push(r); } } }
      for (const r of (eB.m.get(cx + ',' + cz) || [])) { const lx = r[0], ly = r[1], lz = r[2], q = [0, 0, 0, r[3]];
        const Z0e = (typeof __XZ !== 'undefined' && __XZ) ? __XZ : 0; if (ly >= 0 && lx >= 0 && lx < W && lz < D && lz >= Z0e) continue;   /* v1.1.96: surface owns in-bounds Y>=0 */
        const tx = lx - cx * C + C, ty = ly - y0, tz = lz - cz * C + C; if (tx >= C - 1 && tx <= 2 * C && tz >= C - 1 && tz <= 2 * C && ty >= 0 && ty < NB) { TMP[(tx * NB + ty) * PW + tz] = q[3]; if (q[3]) any = true; } } }   /* v1.1.55: placed blocks out on the planet, deep down and in Agartha are drawn (they were drawn as air) */
    return any; }
  // Fill can stop after each slab, or return a complete slice for the real mesher to render.
  U.slice = (ax,piv,cx,cz,y0,t1,bud) => { const ok=fill(ax,piv,cx,cz,y0,t1,bud);return ok===null?null:{any:ok,data:TMP.slice()}; };
  function mesh(ax, piv, cx, cz, y0, fk, data) { const t0 = performance.now(), k = cx + ',' + cz; drop(k); U.fm = Math.round(performance.now() - t0); if (!fk) { meshes.set(k, null); return; }
    const sv = [world, W, H, D], cc = window.__caveCull, o = chunkObjs.get(65), ol = chunkLists.get(65); let g = null;
    chunkObjs.delete(65); chunkLists.delete(65); window.__caveCull = null; window.__c317mesh = 1; window.__deepMeshY0 = y0;
    try { world = data; W = PW; H = NB; D = PW; __bcBase(1, 1); g = chunkObjs.get(65); if (g && window.__caveLightBake) window.__caveLightBake(g, 1, 1); } catch (e) { ERR('bc', e); }
    finally { world = sv[0]; W = sv[1]; H = sv[2]; D = sv[3]; window.__caveCull = cc; window.__c317mesh = 0; delete window.__deepMeshY0; chunkObjs.delete(65); chunkLists.delete(65); if (o) chunkObjs.set(65, o); if (ol) chunkLists.set(65, ol); }
    if (!g) { meshes.set(k, null); return; } blockGroup.remove(g); g.position.set(cx * C - C - piv[0], y0 - piv[1], cz * C - C - piv[2]); root.add(g); meshes.set(k, g); U.meshed++; U.ms = Math.round(performance.now() - t0); (U.mt = U.mt || []).push([U.ms, U.fm]); if (U.mt.length > 400) U.mt.shift(); }
  U.mesh = mesh;
function* deepMeshGenerator(cx,cz,job=undefined) {
    let expiry=Infinity,lastYield=-1;
    // One private owner per suspended exact original chunk algorithm.
    if(!job)throw new Error("unowned suspended cave geometry");
      let grp=null,complete=false;
    try {
    if (!chunkST) {
      chunkST = new Uint8Array(256);
      for (let i = 0; i < 256; i++) if (PLANT[i] === 1 || ENT[i] === 1) chunkST[i] = 1;
      chunkST[T.AIR] = 1; chunkST[T.BED] = 1; chunkST[T.COBWEB] = 1; chunkST[T.WATER] = 2; chunkST[T.LAVA] = 2; chunkST[T.GLASS] = 2; chunkST[T.LEAVES] = 3; chunkST[134] = 3; for (let i = 0; i < 256; i++) if (LEAFY[i]) chunkST[i] = 3;
      chunkFQ = [[[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
        [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]]];
    }
    const ST = chunkST, FQ = chunkFQ, HD = H * D, FN = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    const lists = {}, faces = {};
    const x0 = cx * CH, z0 = cz * CH, x1 = Math.min(W, x0 + CH), z1 = Math.min(D, z0 + CH);
    // GLX-C79: cave culling - faces that look into dark, closed caves (no sky light, no block light) are not meshed while you are up on the surface
    const cav = window.__caveCull ? window.__caveCull(cx, cz) : null, cS = cav && cav.S, cBk = cav && cav.B, cX0 = cav ? cav.x0 : 0, cZ0 = cav ? cav.z0 : 0, cRS = cav ? cav.RS : 0; let cavN = 0;
    let scans=0; for (let x = x0; x < x1; x++) for (let y = 0; y < H; y++) for (let z = z0; z < z1; z++) { if ((++scans & 31)===0 && performance.now()>=expiry) { if(lastYield!==job.rev) { lastYield=job.rev; yield null; expiry=job.expiry; } };
      const i = (x * H + y) * D + z, b = world[i];
      if (!b) continue;
      if (b === T.WATER || ENT[b] || PLANT[b] === 1 || b === T.FURNACE || b === T.BED) { (lists[b] || (lists[b] = [])).push(x, y, z); continue; }
      let any = false;
      for (let d = 0; d < 6; d++) {
        let n;
        if (d === 0) { if (x + 1 >= W) continue; n = world[i + HD]; }
        else if (d === 1) { if (x === 0) { if (window.__c317mesh) n = T.STONE; else continue; } else n = world[i - HD]; }
        else if (d === 2) n = y + 1 >= H ? aboveWorld() : world[i + D];
        else if (d === 3) { if (y === 0) { if (window.__c317mesh) { if (i < D) continue; n = world[i - D]; } else if (window.__deepMeshY0 !== undefined) { n = getB(x, window.__deepMeshY0 - 1, z); } else { if (!window.__YB) continue; n = __YB(x, z); } } else n = world[i - D]; }
        else if (d === 4) { if (z + 1 >= D) continue; n = world[i + 1]; }
        else { if (z === 0) { if (window.__c317mesh) n = T.STONE; else { if (!__XN) continue; n = __XN(x, y); } } else n = world[i - 1]; }
        let s = ST[n]; if (s === 3 && (n === 9 || n === 134 || LEAFY[n]) && window.FASTLEAF !== false) s = 0;   // leaves and blossom are solid 'fast' leaves: no faces between them or behind them
        if (!s || (s > 1 && n === b)) continue;
        if (cS && y > 0) { const fx = d === 0 ? x + 1 : d === 1 ? x - 1 : x, fy = d === 2 ? y + 1 : d === 3 ? y - 1 : y, fz = d === 4 ? z + 1 : d === 5 ? z - 1 : z;
          if (fy < H) { const ci = ((fx - cX0) * cRS + (fz - cZ0)) * H + fy; if (cS[ci] === 0 && cBk[ci] === 0) { cavN++; continue; } } }
        const F = faces[b] || (faces[b] = [[], [], [], [], [], []]);
        F[d].push(x, y, z); any = true;
      }
      if (any) (lists[b] || (lists[b] = [])).push(x, y, z);
    }

    grp = new THREE.Group(); grp.userData.cav = cav ? 1 : 0; grp.userData.cavN = cavN;
    // GLX-C79: Sodium-style - every plain opaque block type goes into ONE mesh per chunk (texture array + one shared material = one draw call), packed vertex attributes
    const TAx = window.__TA && window.__TA.on ? window.__TA : null;
    if (TAx) { let nf = 0; const mg = [];
      for (const t in faces) { const L = TAx.layers(+t); if (!L) continue; const F = faces[t]; for (let d = 0; d < 6; d++) nf += F[d].length / 3; mg.push([F, L]); delete faces[t]; }
      if (nf) { const pos = new Float32Array(nf * 12), nor = new Int8Array(nf * 12), uv = new Uint8Array(nf * 8), lay = new Uint8Array(nf * 4), ind = nf * 4 > 65535 ? new Uint32Array(nf * 6) : new Uint16Array(nf * 6);
        let f = 0;
        for (const [F, L] of mg) for (let d = 0; d < 6; d++) { const A = F[d], q = FQ[d], nn = FN[d], ly = L[d];
          for (let k = 0; k < A.length; k += 3, f++) { const x = A[k], y = A[k + 1], z = A[k + 2];
            for (let v = 0; v < 4; v++) { const o = f * 12 + v * 3; pos[o] = x + q[v][0]; pos[o + 1] = y + q[v][1]; pos[o + 2] = z + q[v][2]; nor[o] = nn[0]; nor[o + 1] = nn[1]; nor[o + 2] = nn[2];
              uv[f * 8 + v * 2] = v === 1 || v === 2 ? 1 : 0; uv[f * 8 + v * 2 + 1] = v >= 2 ? 1 : 0; lay[f * 4 + v] = ly; }
            const b4 = f * 4, o6 = f * 6; ind[o6] = b4; ind[o6 + 1] = b4 + 1; ind[o6 + 2] = b4 + 2; ind[o6 + 3] = b4; ind[o6 + 4] = b4 + 2; ind[o6 + 5] = b4 + 3; if ((f & 255)===0 && performance.now()>=expiry) { if(lastYield!==job.rev) { lastYield=job.rev; yield null; expiry=job.expiry; } }; } }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('lay', new THREE.BufferAttribute(lay, 1));
        g.setIndex(new THREE.BufferAttribute(ind, 1)); g.computeBoundingSphere();
        const m = new THREE.Mesh(g, TAx.mat); m.userData.merged = 1; grp.add(m); } }
    for (const t in faces) {
      const tid = Number(t), F = faces[t];
      let nf = 0; for (let d = 0; d < 6; d++) nf += F[d].length / 3;
      const pos = new Float32Array(nf * 12), nor = new Float32Array(nf * 12), uv = new Float32Array(nf * 8), ind = new Uint32Array(nf * 6);
      const g = new THREE.BufferGeometry(), multi = Array.isArray(BLOCK_MATS[t]);
      let f = 0;
      for (let d = 0; d < 6; d++) {
        const A = F[d], q = FQ[d], nn = FN[d], start = f * 6;
        for (let k = 0; k < A.length; k += 3, f++) {
          const x = A[k], y = A[k + 1], z = A[k + 2];
          for (let v = 0; v < 4; v++) {
            const o = f * 12 + v * 3; pos[o] = x + q[v][0]; pos[o + 1] = y + q[v][1]; pos[o + 2] = z + q[v][2]; nor[o] = nn[0]; nor[o + 1] = nn[1]; nor[o + 2] = nn[2];
            uv[f * 8 + v * 2] = v === 1 || v === 2 ? 1 : 0; uv[f * 8 + v * 2 + 1] = v >= 2 ? 1 : 0;
          }
          const b4 = f * 4, o6 = f * 6; ind[o6] = b4; ind[o6 + 1] = b4 + 1; ind[o6 + 2] = b4 + 2; ind[o6 + 3] = b4; ind[o6 + 4] = b4 + 2; ind[o6 + 5] = b4 + 3; if ((f & 255)===0 && performance.now()>=expiry) { if(lastYield!==job.rev) { lastYield=job.rev; yield null; expiry=job.expiry; } };
        }
        if (multi && f * 6 > start) g.addGroup(start, f * 6 - start, d);
      }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setIndex(new THREE.BufferAttribute(ind, 1)); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, BLOCK_MATS[t]); if (tid === T.GLASS) m.renderOrder = 2;
      grp.add(m);
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (const t in lists) {
      const tid = Number(t), arr = lists[t];
      if (tid === T.WATER) { const wg = buildWaterGeo(arr); if (wg) { const wm = new THREE.Mesh(wg, waterMat); wm.renderOrder = 3; grp.add(wm); } continue; }
      if (!isPlant(tid) || ENT[tid]) continue;
      const n = arr.length / 3, im = new THREE.InstancedMesh(crossGeo, PLANT_MATS[tid], n);
      for (let i = 0; i < n; i++) {
        const x = arr[i * 3], y = arr[i * 3 + 1], z = arr[i * 3 + 2], hs = PLANT_H[tid], j = ((x * 73856093) ^ (z * 19349663)) >>> 0;
        q.setFromAxisAngle(up, (j % 628) / 100); sc.set(PLANT_W[tid], hs, PLANT_W[tid]);
        ps.set(x + 0.5 + ((j >> 3) % 20 - 10) / 100, y, z + 0.5 + ((j >> 6) % 20 - 10) / 100);
        m4.compose(ps, q, sc); im.setMatrixAt(i, m4); if ((i & 255)===0 && performance.now()>=expiry) { if(lastYield!==job.rev) { lastYield=job.rev; yield null; expiry=job.expiry; } };
      }
      im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; grp.add(im);
    }
    complete=true; return {group:grp,lists};
    } finally { if(!complete && grp) grp.traverse(o=>{if(o.isInstancedMesh)o.dispose();else if(o.geometry)o.geometry.dispose();}); }
  }

  const pendingLight=new Map();let lightEpoch=0;
  const deepGeometryStep=(j,until,budget)=>{
    if(j.g||j.lists)return {group:j.g,lists:j.lists};
    j.rev=(j.rev||0)+1;j.expiry=until+budget;const r=j.geo.next();
    if(!r.done)return null;
    j.geo=null;j.lists=r.value.lists;j.g=r.value.group;
    return r.value;
  };
  const abandonGeometry=j=>{if(j.geo){const geo=j.geo;j.geo=null;geo.return();}j.lists=null;};
  const disposeLight=g=>{if(!g)return;g.traverse(o=>{if(o.isInstancedMesh)o.dispose();else if(o.geometry)o.geometry.dispose();});};
  function abandonLight(k){const j=pendingLight.get(k);if(!j)return;pendingLight.delete(k);abandonGeometry(j);disposeLight(j.g);j.g=j.data=j.light=j.buf=null;}
  function beginLight(ax,piv,cx,cz,y0,fk,data){
    const k=cx+','+cz;abandonLight(k);if(!fk){drop(k);meshes.set(k,null);return true;}
    if(!window.__deepLightStep||!window.__deepAOStep){mesh(ax,piv,cx,cz,y0,fk,data);return true;}
    pendingLight.set(k,{key:k,ax,piv:piv.slice(),cx,cz,y0,data,g:null,light:null,epoch:lightEpoch,pivot:fPiv,world:world,deep:true,generation:U.generation,geo:null,lists:null,rev:0,expiry:Infinity,t0:performance.now()});return false;
  }
  function resumeLight(k,until,budget){
    const j=pendingLight.get(k);if(!j)return true;
    if(j.epoch!==lightEpoch||j.generation!==U.generation||j.world!==world||j.pivot!==fPiv||j.y0!==band||DIM.cur){abandonLight(k);return false;}
    const saved=[world,W,H,D],cc=window.__caveCull,cm=window.__c317mesh;
    try{
      world=j.data;W=PW;H=NB;D=PW;window.__caveCull=null;window.__c317mesh=1;
      if(!j.lists){
        const tg=performance.now(),o=chunkObjs.get(65),ol=chunkLists.get(65);
        chunkObjs.delete(65);chunkLists.delete(65);window.__deepMeshY0=j.y0;
        try{if(!j.geo&&!j.lists)j.geo=deepMeshGenerator(1,1,j);const geo=deepGeometryStep(j,until,budget);if(!geo)return false;j.g=geo.group;U.geoMs=performance.now()-tg;
          if(!j.g){pendingLight.delete(k);abandonGeometry(j);drop(k);meshes.set(k,null);return true;}
          if(performance.now()>=until+budget)return false;
        }finally{delete window.__deepMeshY0;chunkObjs.delete(65);chunkLists.delete(65);if(o)chunkObjs.set(65,o);if(ol)chunkLists.set(65,ol);}
      }
      if(!j.light)j.light=window.__deepLightJob(1,1);
      if(!window.__deepLightStep(j.light,until,budget))return false;
      if(performance.now()>=until+budget)return false;
      if(!window.__deepAOStep(j.light,j.g,until,budget))return false;
      const old=meshes.get(k);if(old){root.remove(old);disposeLight(old);}
      blockGroup.remove(j.g);j.g.position.set(j.cx*C-C-j.piv[0],j.y0-j.piv[1],j.cz*C-C-j.piv[2]);root.add(j.g);meshes.set(k,j.g);
      U.meshed++;U.ms=Math.round(performance.now()-j.t0);pendingLight.delete(k);abandonGeometry(j);j.rev++;j.g=j.data=j.light=null;return true;
    }catch(e){abandonLight(k);ERR('light',e);return false;}
    finally{world=saved[0];W=saved[1];H=saved[2];D=saved[3];window.__caveCull=cc;window.__c317mesh=cm;}
  }
  U.meshIncremental=beginLight;U.resumeLight=resumeLight;U.abandonLight=abandonLight;U.pendingLight=()=>[...pendingLight.keys()];U.pendingJob=()=>pendingLight.values().next().value||null;
  // The existing C105 in-game Yes executes this start; asking does not regenerate anything.
  try { const start=window.__c105&&__c105.start;
    if(typeof start==='function')__c105.start=function(){
      // Match C105's refusals before doing anything irreversible. C105's existing
      // No button never calls start; only an accepted Yes can reach this point.
      if(__c105.phase||!started||!current||(typeof dead!=='undefined'&&dead))return;
      const oldGeneration=generation;
      if(!U.invalidateGeneration(oldGeneration+1))return;
      try { return start.apply(this,arguments); }
      catch(error) { invalidateGenerationWithoutGuard(oldGeneration);throw error; }
      finally { if(!__c105.phase)invalidateGenerationWithoutGuard(oldGeneration); }
    };
  } catch(e) { ERR('resetHook',e); }

  setInterval(() => { try { const f = F(), e = E(); if (typeof started === 'undefined' || !started || DIM.cur || !on() || !f || !e) { for(const k of [...pendingLight.keys()])abandonLight(k);root.visible = false; return; }
      const w = f.pw(); if ((!e.flat && e.alt(w.x, w.y, w.z) > 120) || (e.flat && w.y - SEA > 1400) || (window.__c309 && __c309.on)) { for(const k of [...pendingLight.keys()])abandonLight(k);root.visible = false; if (meshes.size) dropAll(); band = null; return; } root.visible = true;
      const ax = f.ax, piv = ax === 2 ? [0, 0, 0] : f.piv.slice(), pk = ax + ':' + piv.join();
      if(meshHost&&Math.abs(P.x-meshHost[0])+Math.abs(P.y-meshHost[1])+Math.abs(P.z-meshHost[2])>160){dropAll();cache.clear();partial.clear();band=null;U.teleports=(U.teleports||0)+1;}meshHost=[P.x,P.y,P.z];
      if (pk !== fPiv) { dropAll(); partial.clear(); fPiv = pk; fAx = ax; band = null; root.position.set(piv[0], piv[1], piv[2]); root.quaternion.copy(QS[ax]); root.updateMatrixWorld(true); }
      { const vd = (typeof vf === 'function' ? vf() : 96), hh = Math.max(0, P.y - SEA - 30); RN = e.flat ? Math.min(PH ? 7 : 16, Math.max(RN0, Math.ceil(Math.max(vd, (scene.fog && scene.fog.far < 1e5 ? scene.fog.far : 0), (window.__c346 && __c346.R) || 0) / C) + 1)) : RN0; if (e.flat && P.y < SEA - 30) RN = Math.min(RN, PH ? 3 : 5); }   /* v1.1.81: underground only the chunks round you are built */
      const bY = e.flat ? Math.min(SEA - 12, P.y - 68) : P.y - 68;   /* v1.1.91: the slice drawn always holds your own depth, also just under sea level where caves were left undrawn */ if (band === null || Math.abs(bY + 40 - (band + 40)) > 14) { const nb = Math.floor(bY / SL) * SL; if (band === null) dropAll(); else for (const k of meshes.keys()) stale.add(k); band = nb; }   /* v1.1.38: old chunks stay drawn until rebuilt, no remesh storm */
      if(U.wv!==world){U.wv=world;U.invalidateGeneration(U.generation+1);}band=Math.floor(bY/SL)*SL; if (e.dirty) { e.dirty = 0; eV = -1; lightEpoch++;for(const k of [...pendingLight.keys()])abandonLight(k); }   /* v1.1.38: an edit no longer redraws every chunk at once; the chunk you changed is redrawn first */
      const pp=f.pw(), pcx = Math.floor(pp.x / C), pcz = Math.floor(pp.z / C);
      for (const k of new Set([...meshes.keys(),...pendingLight.keys()])) { const [cx, cz] = k.split(',').map(Number); if (Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz)) > RN + 1) drop(k); }
      const want = []; for (let cx = pcx - RN; cx <= pcx + RN; cx++) for (let cz = pcz - RN; cz <= pcz + RN; cz++) { const k = cx + ',' + cz; if (!pendingLight.has(k) && (!meshes.has(k) || U.dirty.has(k) || stale.has(k))) want.push([Math.hypot(cx - pcx, cz - pcz) - (U.dirty.has(k) ? 99 : 0) + (stale.has(k) && meshes.get(k) ? 0.5 : 0), cx, cz, k]); }
      want.sort((a, b) => a[0] - b[0]); const mk = pcx + ',' + pcz; U.hold = !meshes.has(mk);
      const t1 = performance.now(), bud = U.hold ? (PH ? 3 : 4) : (PH ? 2 : 3);
      for(const [k,j] of pendingLight)if(j.epoch!==lightEpoch||j.generation!==U.generation||j.world!==world||j.pivot!==fPiv||j.y0!==band||DIM.cur)abandonLight(k);
      // A job owns its key until complete: no fresh geometry/data rebuild while its old mesh stays visible.
      if(pendingLight.size){const k=pendingLight.keys().next().value;if(resumeLight(k,t1,PH?1:2)){const ix=want.findIndex(q=>q[3]===k);if(ix>=0)want.splice(ix,1);}}
      for (let i = 0; i < want.length; i++) { const q = want[i]; if (performance.now() - t1 >= bud) break; TMP = null; const fk = fill(ax, piv, q[1], q[2], band, t1, bud); if (fk === null) break; const data = TMP; U.dirty.delete(q[3]); stale.delete(q[3]); beginLight(ax,piv,q[1],q[2],band,fk,data);break; }
      U.ticks++; U.n = meshes.size; U.band = band; U.mk = meshes.has(mk); U.tk = Math.round(performance.now() - t1); U.partial = partial.size; } catch (e) { ERR('loop', e); } }, PH ? 70 : 50);
  setTimeout(() => { try { const up = updatePlayer; updatePlayer = function (dt) { try { const e = E(); if (U.hold && root.visible && !flying && e) { const w = F().pw(); const al = e.alt(w.x, w.y, w.z); if (al < 60 && al > -60 && P.vy < 0 && (U.hf || 0) < 90) { P.vy = 0; U.held = (U.held || 0) + 1; U.hf = (U.hf || 0) + 1; } } else U.hf = 0; } catch (_) {} return up.apply(this, arguments); }; } catch (e) { ERR('hold', e); } }, 3200);
  // blocks you dig or place out on the planet: redraw that chunk
  try { const s0 = setB; setB = function (x, y, z, v) { const r = s0.apply(this, arguments); try { if (y >= 0 && y <= 1) { const t = '|' + Math.floor(x / C) + ',' + Math.floor(z / C) + ','; for (const kk of [...cache.keys()]) if (kk.includes(t)) cache.delete(kk); } } catch (_) {} try { const f = F(); if (f && on() && meshes.size) { const mx = ((Math.floor(x) % C) + C) % C, mz = ((Math.floor(z) % C) + C) % C; for (const [ax, az] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if ((ax === 0 || (ax > 0 ? mx === C - 1 : mx === 0)) && (az === 0 || (az > 0 ? mz === C - 1 : mz === 0))) U.dirty.add(Math.floor((Math.floor(x) + ax) / C) + ',' + Math.floor((Math.floor(z) + az) / C)); } } catch (_) {} return r; }; } catch (e) { ERR('setB', e); }
  // no grey ground fog in space or near the Moon and Mars
  // the icy edge tint (for the old ice wall round the map) stays on the map and the north ice plain, not out on the Earth, the Moon or Mars
  const uIceB = {value: new THREE.Vector4(0, 0, 0, 0)}, IA = 'if (uIce.w > 0.5) {';
  setInterval(() => { try { const m = window.__TA && __TA.mat; if (!m) return; if (!m.__c324 && m.fragmentShader.includes(IA)) { m.uniforms.uIceB = uIceB;
        m.fragmentShader = m.fragmentShader.replace('uniform vec4 uIce;', 'uniform vec4 uIce; uniform vec4 uIceB;').replace(IA, 'if (uIce.w > 0.5 && (uIceB.w < 0.5 || (vIceW.y > -90.0 && vIceW.y < uIceB.w && vIceW.x > -2.0 && vIceW.x < uIceB.x && vIceW.z > uIceB.y && vIceW.z < uIceB.z))) {');
        m.__c324 = 1; m.needsUpdate = true; U.ice = 1; }
      const Z0 = (typeof __XZ !== 'undefined' && __XZ) ? __XZ : 0; if (on()) uIceB.value.set(W + 2, Z0 - 2, D + 2, H + 200); else uIceB.value.w = 0; } catch (e) { ERR('ice', e); } }, 1000);
  const spaceNow = () => { try { const f = F(), b = f && f.body; if (!on() || DIM.cur || !f) return false; if (b === 'moon' || b === 'mars') return true; const w = f.pw(); return !!(E() && E().space(w.x, w.y, w.z)); } catch (_) { return false; } };
  try { const us = updateSky; updateSky = function () { const r = us.apply(this, arguments); try { const fg = scene.fog; if (fg && spaceNow()) { fg.near = Math.max(fg.near, 260); fg.far = Math.max(fg.far, 1400); fg.color.setHex(0x05060a); U.fogN = (U.fogN || 0) + 1; } } catch (e) { ERR('fog', e); } return r; }; } catch (e) { ERR('fog0', e); }
})();

// v1.1.33: zero clipping - swept move with sub steps and push out, for walking, jetpack and flying, plus a fresh version check
