
/* ===================== GLX-G5 (v0.9.23): see-through painting doorways (live render-to-texture view, seamless walk-through) ===================== */
// Backrooms layout as a pure function, so a preview of the arrival hall can be built while you're still in the Highlands
function brBlockAt(x, y, z) {
  const lx = ((x % BR_P) + BR_P) % BR_P, lz = ((z % BR_P) + BR_P) % BR_P, cx = lx >> 2, cz = lz >> 2, ox = lx & 3, oz = lz & 3;
  if (y === 0) return T.STONE;
  if (lx >= 72 && lx < 112 && lz >= 72 && lz < 112) {
    const edge = lx === 72 || lx === 111 || lz === 72 || lz === 111;
    if (y === 1) { const gx = (lx - 72) % 13, gz = (lz - 72) % 13, path = gx < 2 || gz < 2 || Math.hypot(lx - 92, lz - 92) < 5; return edge ? T.BRWHITE : path ? T.BRPAVE : T.BRGRASS; }
    if (y >= 2 && y < 31) { if (!edge || ((lx === 92 || lz === 92) && y < 5)) return 0; return ((y - 2) % 5 === 2) && ((lx + lz) % 4 === 1) ? T.BRWINDOW : T.BRWHITE; }
    return y === 31 ? ((lx % 6 === 3 && lz % 6 === 3) ? T.BRLIGHT : T.BRCEIL) : y === 32 ? T.STONE : 0;
  }
  if (y === 1) return T.BRCARPET;
  if (y === 6) return ((lx % 8 === 2 || lx % 8 === 3) && (lz % 8 === 2 || lz % 8 === 3)) && brHash(lx >> 3, lz >> 3, 91) < 0.82 ? T.BRLIGHT : T.BRCEIL;
  if (y === 7) return T.STONE;
  if (y > 7) return 0;
  if (brHash(cx >> 2, cz >> 2, 17) < 0.3) return (ox < 2 && oz < 2 && (cx & 1) === 0 && (cz & 1) === 0) ? T.BRPILLAR : 0;
  let wall = false;
  if (ox === 0 && brHash(cx, cz, 3) < 0.42 && !(oz >= 1 && oz <= 2 && brHash(cx, cz, 5) < 0.55)) wall = true;
  if (oz === 0 && brHash(cx, cz, 7) < 0.42 && !(ox >= 1 && ox <= 2 && brHash(cx, cz, 9) < 0.55)) wall = true;
  if (ox === 0 && oz === 0 && brHash(cx, cz, 11) < 0.5) wall = true;
  return wall ? T.BRWALL : 0;
}
// the arrival doorway: a 1 x 2 painting set in a wall, facing -z, with open floor in front
const BR_ARR = (() => { const x0 = BR_P + 36, z0 = BR_P + 36;
  for (let r = 0; r < 40; r++) for (let a = 0; a < 12; a++) { const x = Math.round(x0 + Math.cos(a) * r), z = Math.round(z0 + Math.sin(a) * r);
    if (!brBlockAt(x, 2, z) && !brBlockAt(x, 3, z) && !brBlockAt(x, 2, z + 1) && !brBlockAt(x, 3, z + 1) && !brBlockAt(x, 2, z - 1)) return [x, z + 2]; } return [x0, z0 + 2]; })();
genBackrooms = function () {
  H = 34; setWorldSize(BR_P * 2);
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) world[idx(x, y, z)] = brBlockAt(x, y, z);
  const door = (x, z) => { for (let y = 2; y < 6; y++) world[idx(x, y, z)] = T.BRWALL; world[idx(x, 2, z)] = T.PAINTB; world[idx(x, 3, z)] = T.PAINTB; };
  for (let k = 0; k < 3; k++) { const lx = 8 + Math.floor(brHash(k, 1, 41) * 56), lz = 8 + Math.floor(brHash(k, 2, 41) * 56); for (const p of [0, BR_P]) for (const q of [0, BR_P]) door(lx + p, lz + q); }
  door(BR_ARR[0], BR_ARR[1]);
};
spawnBackrooms = function () { P.x = BR_ARR[0] + 0.5; P.z = BR_ARR[1] - 1.5; P.y = 2; P.yaw = 0; P.pitch = 0; };
// ---------- painting frames ----------
// a frame = the outward face of a painting doorway: o (centre), n (outward normal), h (1 or 2 tall)
function paintFrame(x, y, z, px, pz) {
  while (getB(x, y - 1, z) === T.PAINTB) y--;
  const h = getB(x, y + 1, z) === T.PAINTB ? 2 : 1; let best = null, bd = -9;
  for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const open = !solid(x + nx, y, z + nz) && getB(x + nx, y, z + nz) !== T.PAINTB; if (!open) continue;
    const d = (px - (x + .5)) * nx + (pz - (z + .5)) * nz + (solid(x - nx, y, z - nz) ? 0.5 : 0); if (d > bd) { bd = d; best = [nx, nz]; } }
  if (!best) return null;
  return {key: x + ',' + y + ',' + z, x, y, z, h, n: best, o: new THREE.Vector3(x + .5 + best[0] * .5, y + h / 2, z + .5 + best[1] * .5), yaw: Math.atan2(best[0], best[1])};
}
const frameMat = f => new THREE.Matrix4().compose(f.o, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), f.yaw), new THREE.Vector3(1, 1, 1));
function portalXf(src, dst) { return frameMat(dst).multiply(new THREE.Matrix4().makeRotationY(Math.PI)).multiply(frameMat(src).invert()); }
const BR_DST = {x: BR_ARR[0], y: 2, z: BR_ARR[1], h: 2, n: [0, -1], o: new THREE.Vector3(BR_ARR[0] + .5, 3, BR_ARR[1]), yaw: Math.atan2(0, -1)};
// ---------- tiny preview worlds (one merged mesh per block type, face-culled) ----------
function miniScene(get, x0, y0, z0, sx, sy, sz, sky, fogC, hemiI, hemiC) {
  const sc = new THREE.Scene(); sc.background = new THREE.Color(sky); sc.fog = new THREE.Fog(fogC, 6, 40);
  const hl = new THREE.HemisphereLight(hemiC, 0x605840, hemiI); sc.add(hl);
  const op = b => b && b !== T.WATER && PLANT[b] !== 1 && b !== T.PAINTB && b !== T.PORTAL && b !== T.GLASS && b !== T.LEAVES ? 1 : 0;
  const A = new Uint8Array(sx * sy * sz), id = (x, y, z) => (x * sy + y) * sz + z;
  for (let x = 0; x < sx; x++) for (let y = 0; y < sy; y++) for (let z = 0; z < sz; z++) A[id(x, y, z)] = get(x0 + x, y0 + y, z0 + z);
  const FQ = chunkFQ || [[[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]]];
  const FN = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], faces = {};
  for (let x = 0; x < sx; x++) for (let y = 0; y < sy; y++) for (let z = 0; z < sz; z++) { const b = A[id(x, y, z)]; if (!b || (!op(b) && b !== T.WATER && b !== T.LEAVES)) continue;
    for (let d = 0; d < 6; d++) { const nx = x + FN[d][0], ny = y + FN[d][1], nz = z + FN[d][2]; const n = nx < 0 || ny < 0 || nz < 0 || nx >= sx || ny >= sy || nz >= sz ? 0 : A[id(nx, ny, nz)]; if (op(n) || (n === b && b === T.WATER)) continue; (faces[b] || (faces[b] = [[], [], [], [], [], []]))[d].push(x0 + x, y0 + y, z0 + z); } }
  for (const t in faces) { const F = faces[t]; let nf = 0; for (let d = 0; d < 6; d++) nf += F[d].length / 3;
    const pos = new Float32Array(nf * 12), nor = new Float32Array(nf * 12), uv = new Float32Array(nf * 8), ind = new Uint32Array(nf * 6), g = new THREE.BufferGeometry(); let f = 0; const multi = Array.isArray(BLOCK_MATS[t]);
    for (let d = 0; d < 6; d++) { const st = f * 6; for (let k = 0; k < F[d].length; k += 3, f++) { for (let v = 0; v < 4; v++) { const o = f * 12 + v * 3; pos[o] = F[d][k] + FQ[d][v][0]; pos[o + 1] = F[d][k + 1] + FQ[d][v][1]; pos[o + 2] = F[d][k + 2] + FQ[d][v][2]; nor[o] = FN[d][0]; nor[o + 1] = FN[d][1]; nor[o + 2] = FN[d][2]; uv[f * 8 + v * 2] = v === 1 || v === 2 ? 1 : 0; uv[f * 8 + v * 2 + 1] = v >= 2 ? 1 : 0; }
        const b4 = f * 4, o6 = f * 6; ind.set([b4, b4 + 1, b4 + 2, b4, b4 + 2, b4 + 3], o6); } if (multi && f * 6 > st) g.addGroup(st, f * 6 - st, d); }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(ind, 1));
    const m = +t === T.WATER ? new THREE.MeshLambertMaterial({color: 0x3a6a8a}) : BLOCK_MATS[t]; sc.add(new THREE.Mesh(g, m)); }
  return sc;
}
// ---------- live doorway rendering ----------
const PV = {rt: null, mat: null, vcam: new THREE.PerspectiveCamera(), portals: new Map(), scanT: 0, frame: 0, stride: PERF ? 2 : 1, ema: 16, brScene: null, owScene: null, owSnap: null, active: null, lastPos: new Map(), fast: false};
PV.rt = new THREE.WebGLRenderTarget(PERF ? 160 : 288, PERF ? 160 : 288, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter});
PV.mat = new THREE.ShaderMaterial({uniforms: {map: {value: PV.rt.texture}, res: {value: new THREE.Vector2(1, 1)}, t: {value: 0}, tint: {value: new THREE.Color(0xd8c860)}},
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D map; uniform vec2 res; uniform float t; uniform vec3 tint; varying vec2 vUv;\n' +
    'void main(){ vec2 s = gl_FragCoord.xy / res; float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)); float k = 1.0 - smoothstep(0.0, 0.2, e);\n' +
    ' s += k * 0.025 * vec2(sin(vUv.y * 37.0 + t * 3.1), cos(vUv.x * 41.0 + t * 2.6)) + 0.002 * vec2(sin(t * 1.7 + vUv.y * 9.0), 0.0);\n' +
    ' vec3 c = texture2D(map, clamp(s, 0.001, 0.999)).rgb; float w = 0.5 + 0.5 * sin(t * 4.0 + (vUv.x + vUv.y) * 18.0);\n' +
    ' c = mix(c, tint, k * (0.35 + 0.3 * w)); gl_FragColor = vec4(c, 1.0); }', side: THREE.FrontSide});
BLOCK_MATS[T.PAINTB].visible = false;
(function () {
  const so = solid; solid = function (x, y, z) { if (y >= 0 && y < H && x >= 0 && z >= 0 && x < W && z < D && world[idx(x, y, z)] === T.PAINTB) return false; return so.apply(this, arguments); };
  const bc = buildChunk; buildChunk = function () { if (chunkST && chunkST[T.PAINTB] !== 1) chunkST[T.PAINTB] = 1; const r = bc.apply(this, arguments); if (chunkST && chunkST[T.PAINTB] !== 1) { chunkST[T.PAINTB] = 1; return bc.apply(this, arguments); } return r; };
  const rb = rebuild; rebuild = function (b) { return rb.call(this, b || (PV.fast ? 30 : b)); };
})();
const frameWood = new THREE.MeshLambertMaterial({color: 0x6b4a22});
function portalMesh(f) {
  const g = new THREE.Group(); g.position.copy(f.o); g.rotation.y = f.yaw;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.96, f.h - 0.04), PV.mat); pl.position.z = 0.005; g.add(pl);
  for (const [w, h, x, y] of [[1.08, 0.08, 0, f.h / 2], [1.08, 0.08, 0, -f.h / 2], [0.08, f.h + 0.08, 0.5, 0], [0.08, f.h + 0.08, -0.5, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), frameWood); b.position.set(x, y, 0.02); g.add(b); }
  scene.add(g); return g;
}
function destFor() { return DIM.cur === 'backrooms' ? (DIM.linkFrame || null) : !DIM.cur ? BR_DST : null; }
function previewScene() {
  if (DIM.cur === 'backrooms') return PV.owScene;
  if (!PV.brScene) PV.brScene = miniScene(brBlockAt, BR_ARR[0] - 22, 0, BR_ARR[1] - 24, 44, 8, 44, 0x9c9458, 0x9c9458, 1.05, 0xfff8d0);
  return PV.brScene;
}
function scanPortals() {
  const seen = new Set(), x0 = Math.floor(P.x), y0 = Math.floor(P.y), z0 = Math.floor(P.z), R = 14;
  if (destFor()) for (let x = Math.max(0, x0 - R); x < Math.min(W, x0 + R); x++) for (let z = Math.max(0, z0 - R); z < Math.min(D, z0 + R); z++) for (let y = Math.max(1, y0 - 4); y < Math.min(H - 1, y0 + 5); y++) {
    if (world[idx(x, y, z)] !== T.PAINTB || world[idx(x, y - 1, z)] === T.PAINTB) continue;
    const f = paintFrame(x, y, z, P.x, P.z); if (!f) continue; seen.add(f.key);
    const old = PV.portals.get(f.key); if (old && old.f.yaw === f.yaw && old.f.h === f.h) continue;
    if (old) scene.remove(old.g); PV.portals.set(f.key, {f, g: portalMesh(f)});
  }
  for (const [k, p] of PV.portals) if (!seen.has(k)) { scene.remove(p.g); PV.portals.delete(k); PV.lastPos.delete(k); }
  // preload the Backrooms save so walking through needs no wait
  if (!DIM.cur && PV.portals.size && DIM.pre === undefined && current) { DIM.pre = 'loading'; idbGet('worlds', dimKey('backrooms')).then(d => { DIM.pre = d || null; }).catch(() => { DIM.pre = null; }); }
}
function renderPortal() {
  PV.mat.uniforms.t.value = performance.now() / 1000;
  const dst = destFor(), sc = dst && previewScene(); if (!sc || !PV.portals.size) return;
  let best = null, bd = 1e9; const cp = camera.position;
  for (const p of PV.portals.values()) { const d = cp.distanceTo(p.f.o); const toC = new THREE.Vector3().subVectors(cp, p.f.o); if (toC.x * p.f.n[0] + toC.z * p.f.n[1] < -0.05) continue; if (d < bd) { bd = d; best = p; } }
  if (!best || bd > 18) return;
  if (++PV.frame % PV.stride) return;
  const M = portalXf(best.f, dst); camera.updateMatrixWorld();
  const vc = PV.vcam; vc.projectionMatrix.copy(camera.projectionMatrix); vc.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
  vc.matrixAutoUpdate = false; vc.matrix.multiplyMatrices(M, camera.matrixWorld); vc.matrixWorldNeedsUpdate = true; vc.updateMatrixWorld(true);
  const n = new THREE.Vector3(dst.n[0], 0, dst.n[1]), pl = new THREE.Plane(n, -n.dot(dst.o) + 0.02);
  renderer.getDrawingBufferSize(PV.mat.uniforms.res.value);
  const t0 = performance.now(); renderer.clippingPlanes = [pl]; renderer.setRenderTarget(PV.rt); renderer.clear(); renderer.render(sc, vc); renderer.setRenderTarget(null); renderer.clippingPlanes = [];
  PV.cost = performance.now() - t0;
}
// fallback: if the frame rate sags while a doorway is on screen, the view updates less often (an animated preview, the shimmer keeps moving)
(function () {
  const rr = renderer.render.bind(renderer); let inside = false, lastT = performance.now();
  renderer.render = function (s, c) {
    if (s === scene && !inside && started) { inside = true; try { const now = performance.now(), dt = now - lastT; lastT = now; if (PV.portals.size) { PV.ema = PV.ema * 0.95 + dt * 0.05; PV.stride = PV.ema > 70 ? 10 : PV.ema > 45 ? 4 : PERF ? 2 : 1; } renderPortal(); } catch (e) { console.warn(e); } inside = false; }
    return rr(s, c);
  };
})();
// ---------- seamless crossing ----------
function snapOverworld(f) {   // a small copy of the land around the painting, used to show the Highlands through the exit doorways
  const sx = 44, sy = 36, sz = 44, x0 = Math.max(0, Math.floor(f.o.x) - 22), y0 = Math.max(0, f.y - 14), z0 = Math.max(0, Math.floor(f.o.z) - 22);
  const sky = 0x8fb8e0; PV.owScene = miniScene((x, y, z) => getB(x, y, z), x0, y0, z0, sx, sy, sz, sky, 0xc8d8e4, 0.9 + daylight * 0.4, 0xffffff);
}
function crossTo(src, isEnter) {
  const M = portalXf(src, isEnter ? BR_DST : DIM.linkFrame);
  const p = new THREE.Vector3(P.x, P.y, P.z).applyMatrix4(M), dyaw = (isEnter ? BR_DST : DIM.linkFrame).yaw + Math.PI - src.yaw, nyaw = P.yaw + dyaw, npitch = P.pitch;
  PV.fast = true;
  try {
    if (isEnter) {
      DIM.link = [src.x, src.y, src.z]; DIM.linkFrame = src; snapOverworld(src);
      // the overworld is parked in memory; its compressed save is written just after the crossing
      const re = rleEncode; rleEncode = () => ''; let ow; try { ow = serialize(); } finally { rleEncode = re; }
      ow.P = Object.assign({}, ow.P); DIM.ow = ow; DIM.owWorld = world; DIM.owDims = [W, H, D];
      const keepInv = Object.assign({}, inv), keep = {hp, food, sat, armour: armour.slice()};
      mobs.slice().forEach(removeMob); try { clearBoats(); } catch (_) {} for (const [, o] of entObjs) scene.remove(o.g); entObjs.clear();
      const pre = DIM.pre && DIM.pre !== 'loading' && DIM.pre.brv === 2 && DIM.pre.world && DIM.pre.W === BR_P * 2 ? DIM.pre : null;
      DIM.cur = 'backrooms'; g9Island = false; weather.type = 'clear'; weather.pending = null;
      if (pre) { H = pre.H; applySave(pre); genVer = 1; } else { crops.clear(); chests.clear(); doorState.clear(); furnaces.clear(); entMeta.clear(); genBackrooms(); genVer = 1; }
      for (const k in inv) delete inv[k]; Object.assign(inv, keepInv); hp = keep.hp; food = keep.food; sat = keep.sat; keep.armour.forEach((id, i) => armour[i] = id);
      const owW = DIM.owWorld; setTimeout(() => { try { const g0 = genVer; genVer = DIM.ow && DIM.ow.gen || g0; DIM.ow.world = rleEncode(owW); genVer = g0; carryPlayerInto(DIM.ow); idbPut('worlds', current.id, DIM.ow).catch(() => {}); } catch (e) { console.warn(e); } }, 400);
    } else {
      const dd = (() => { try { return serialize(); } catch (_) { return null; } })(); const nm = DIM.cur; setTimeout(() => { if (dd) idbPut('worlds', dimKey(nm), dd).catch(() => {}); }, 300);
      const ow = DIM.ow; carryPlayerInto(ow); mobs.slice().forEach(removeMob); for (const [, o] of entObjs) scene.remove(o.g); entObjs.clear();
      DIM.cur = null; H = ow.H || H; g9Island = !!ow.island;
      const raw = DIM.owWorld && DIM.owDims && DIM.owDims[1] === H ? DIM.owWorld : null, rd = rleDecode;
      if (raw) rleDecode = (b, t) => t.set(raw);
      try { applySave(ow); } finally { rleDecode = rd; }
      genVer = ow.gen || GEN9; gSeed = ow.gseed || gSeed; try { G9P = g9perm(gSeed); } catch (_) {} if (ow.g9castles) g9castles = ow.g9castles;
      DIM.ow = null; DIM.owWorld = null; DIM.pre = undefined; PV.owScene = null;
    }
    P.x = p.x; P.y = p.y; P.z = p.z; P.yaw = nyaw; P.pitch = npitch; P.vy = 0; P.fallTop = null;
    for (const [, q] of PV.portals) scene.remove(q.g); PV.portals.clear(); PV.lastPos.clear(); portalArm = false;
    dirtyAll = true; rebuild(30); scanPortals(); renderHotbar();
  } finally { PV.fast = false; }
}
(function () {
  const up = updatePlayer;
  updatePlayer = function (dt) {
    const r = up.apply(this, arguments);
    if (!started || DIM.busy) return r;
    PV.scanT -= dt; if (PV.scanT <= 0) { PV.scanT = 0.6; scanPortals(); }
    const body = new THREE.Vector3(P.x, P.y + 0.9, P.z);
    for (const [k, p] of PV.portals) {
      const loc = body.clone().applyMatrix4(frameMat(p.f).invert()), prev = PV.lastPos.get(k); PV.lastPos.set(k, loc.z);
      if (prev !== undefined && prev > 0 && loc.z <= 0 && Math.abs(loc.x) < 0.6 && Math.abs(loc.y) < p.f.h / 2 + 1.0 && destFor() && (DIM.cur !== 'backrooms' || DIM.ow)) { crossTo(p.f, !DIM.cur); break; }
    }
    return r;
  };
  // the old "use the painting" path still works; it now also records the frame so the exit doorways can show the way home
  const ed = enterDim; enterDim = function (name) { if (name === 'backrooms' && DIM.link) { const f = paintFrame(DIM.link[0], DIM.link[1], DIM.link[2], P.x, P.z); if (f) { DIM.linkFrame = f; snapOverworld(f); } } return ed.apply(this, arguments); };
  const ex = exitDim; exitDim = function () { DIM.owWorld = null; DIM.pre = undefined; PV.owScene = null; return ex.apply(this, arguments); };
  const ew = enterWorld; enterWorld = function () { DIM.owWorld = null; DIM.linkFrame = null; DIM.pre = undefined; for (const [, q] of PV.portals) scene.remove(q.g); PV.portals.clear(); return ew.apply(this, arguments); };
})();
window.GLEN_PV = PV;
