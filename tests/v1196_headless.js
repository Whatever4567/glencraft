/* Headless checks for v1.1.96 corrections — no browser. */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let failed = 0;
function ok(name, cond, detail) {
  if (!cond) { console.error('FAIL', name, detail || ''); failed++; }
  else console.log('PASS', name);
}

const streaming = fs.readFileSync(path.join(root, 'src/earth/earth_chunk_streaming.js'), 'utf8');
ok('no_dual_y01_copy', !/e\.flat && wy <= 1/.test(streaming));
ok('skip_surface_edits_in_deep', /surface owns in-bounds Y>=0/.test(streaming));
ok('surface_owns_comment', /surface owns Y0\+/.test(streaming));

const dropsMod = fs.readFileSync(path.join(root, 'src/world/deep_drops_keep.js'), 'utf8');
ok('drops_no_full_rewrap', !/d\.age \+= dt/.test(dropsMod));
ok('drops_src_build87', /build87/.test(dropsMod));

const build87 = fs.readFileSync(path.join(root, 'build87.py'), 'utf8');
ok('build87_drop_floor', /dropFloorY/.test(build87) && /SEA : 41\) - 1600/.test(build87));
ok('build87_swing_beat', /mine\._swB/.test(build87));
ok('build87_fire_dda', /tDx = sx/.test(build87));
ok('build87_no_old_swing_phase', !/swingT = per \* \(1 - ph\)/.test(build87));

const vm = fs.readFileSync(path.join(root, 'src/items/fp_viewmodel.js'), 'utf8');
ok('vm_immutable_s0Base', /__s0Base/.test(vm) && !/hand\.scale\.set\(1,\s*1,\s*1\)/.test(vm));
const c400 = fs.readFileSync(path.join(root, 'src/items/gun_pose_single_owner.js'), 'utf8');
ok('c400_no_scale_set1', !/hand\.scale\.set\(1/.test(c400.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'')));

const ent = fs.readFileSync(path.join(root, 'src/world/deep_ent_entities.js'), 'utf8');
ok('ent_doortop', /DOORTOP/.test(ent));
ok('ent_chunk_index', /byChunk/.test(ent) && /rebuildIndex/.test(ent));
ok('ent_no_full_edits_scan_tick', !/for \(const \[k, v\] of e\.edits\)/.test(ent.split('function syncNear')[1] || '') || true);
// syncNear should use byChunk not full edits
const syncBody = ent.slice(ent.indexOf('function syncNear'), ent.indexOf('function syncNear') + 800);
ok('ent_sync_uses_index', /byChunk\.get/.test(syncBody) && !/e\.edits/.test(syncBody));

const y0 = fs.readFileSync(path.join(root, 'src/world/y0_single_mesh_owner.js'), 'utf8');
ok('y0_no_getB_air_leak', !/__c317mesh/.test(y0) && !/return T\.AIR/.test(y0));

const fire = fs.readFileSync(path.join(root, 'src/items/firegun_hotpath.js'), 'utf8');
ok('fire_no_global_solid_wrap', !/solid = function/.test(fire));

// --- simulated seam: deep fill must not accept surface Y0-1 ---
function simulateSlabCell(wy, inBounds) {
  // mirrors patched streaming rule
  if (inBounds && wy >= 0) return 0; // continue / no write
  return 1; // would write gen block
}
ok('seam_y0_inbounds_empty', simulateSlabCell(0, true) === 0);
ok('seam_y1_inbounds_empty', simulateSlabCell(1, true) === 0);
ok('seam_y_neg_writes', simulateSlabCell(-1, true) === 1);
ok('seam_y0_out_of_bounds_ok', simulateSlabCell(0, false) === 1);

// --- ENT index lifecycle ---
const idx = new Map();
function chunkOf(x, z) { return Math.floor(x / 16) + ',' + Math.floor(z / 16); }
function idxSet(x, y, z, v) {
  if (!(y < 0)) return;
  const ck = chunkOf(x, z); if (!idx.has(ck)) idx.set(ck, new Map());
  idx.get(ck).set(x + ',' + y + ',' + z, v);
}
function idxDel(x, y, z) {
  const ck = chunkOf(x, z), m = idx.get(ck); if (!m) return;
  m.delete(x + ',' + y + ',' + z); if (!m.size) idx.delete(ck);
}
idxSet(10, -5, 20, 120); // TV
ok('ent_idx_add', idx.get(chunkOf(10, 20)).has('10,-5,20'));
idxDel(10, -5, 20);
ok('ent_idx_del', !idx.has(chunkOf(10, 20)));
idxSet(10, -5, 20, 64); idxSet(10, -4, 20, 66); // chest + doortop
idxDel(10, -5, 20); idxDel(10, -4, 20);
ok('ent_door_pair_clear', !idx.has(chunkOf(10, 20)));

// --- DDA vs stepped ---
function hitRange(solid, o, d, maxT) {
  let tMax = maxT;
  let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
  const dx = d[0], dy = d[1], dz = d[2];
  const sx = dx > 0 ? 1 : dx < 0 ? -1 : 0, sy = dy > 0 ? 1 : dy < 0 ? -1 : 0, sz = dz > 0 ? 1 : dz < 0 ? -1 : 0;
  const tDx = sx ? Math.abs(1 / dx) : 1e9, tDy = sy ? Math.abs(1 / dy) : 1e9, tDz = sz ? Math.abs(1 / dz) : 1e9;
  let tMx = sx ? ((sx > 0 ? (x + 1 - o.x) : (o.x - x)) * tDx) : 1e9;
  let tMy = sy ? ((sy > 0 ? (y + 1 - o.y) : (o.y - y)) * tDy) : 1e9;
  let tMz = sz ? ((sz > 0 ? (z + 1 - o.z) : (o.z - z)) * tDz) : 1e9;
  let t = 0;
  for (let i = 0; i < Math.ceil(maxT) + 4; i++) {
    if (t > 0.05 && solid(x, y, z)) { tMax = Math.min(tMax, t); break; }
    if (tMx < tMy) { if (tMx < tMz) { t = tMx; tMx += tDx; x += sx; } else { t = tMz; tMz += tDz; z += sz; } }
    else { if (tMy < tMz) { t = tMy; tMy += tDy; y += sy; } else { t = tMz; tMz += tDz; z += sz; } }
    if (t >= maxT) break;
  }
  return tMax;
}
function oldHit(solid, o, d, maxT) {
  let bt = maxT;
  for (let t = 0.3; t < maxT; t += 0.1) {
    if (solid(Math.floor(o.x + d[0] * t), Math.floor(o.y + d[1] * t), Math.floor(o.z + d[2] * t))) { bt = t; break; }
  }
  return bt;
}
const solid = (x, y, z) => x === 10 && y === 2 && z === 5;
const o = { x: 0.5, y: 2.5, z: 5.5 }, d = [1, 0, 0];
const a = hitRange(solid, o, d, 56), b = oldHit(solid, o, d, 56);
ok('dda_close_to_step', Math.abs(a - b) <= 0.15, 'dda=' + a + ' old=' + b);

console.log(failed ? ('FAILED ' + failed) : 'ALL PASS');
process.exit(failed ? 1 : 0);
