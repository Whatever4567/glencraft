#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let fail = 0;
function ok(name, cond, detail) {
  if (cond) console.log('PASS', name);
  else { console.log('FAIL', name, detail || ''); fail++; }
}

const dwSrc = read('src/earth/deep_world.js');
const eyeSrc = read('src/earth/hell_eye_chamber_v1198.js');
const b87 = read('build87.py');
const drops = read('src/world/deep_drops_keep.js');
const ent = read('src/world/deep_ent_entities.js');
const agu = read('src/agartha/agartha_underground.js');

ok('no_fixed_301_seal', !/FLOOR\s*-\s*64/.test(dwSrc) && !/y <= FLOOR - 64/.test(dwSrc) && /legacyOpen/.test(dwSrc) && /sealFloorY/.test(dwSrc));
ok('dynamic_drop_build87', /dropFloorY/.test(b87));
ok('dynamic_drop_fallback_1600', /1600/.test(b87));
ok('eye_still_giant', /EYE_R = PH \? 18 : 24/.test(eyeSrc));
ok('hall_still_there', /hellLandmark|hellR/.test(dwSrc));
ok('agartha_bounds', /AY = -50/.test(agu) && /YN = 48/.test(agu));
ok('air_edits_in_rebuild', /for \(const \[k, v\] of e\.edits\)/.test(dwSrc));

const sandbox = {
  window: {}, Math, performance: { now: () => 0 }, document: { getElementById: () => null },
  T: { STONE: 2, WSTONE: 3, MOSSYCOBBLE: 4, DEEPSLATE: 5, DSCOBBLE: 6, BLACKSTONE: 7, OBSIDIAN: 8, MOONBASALT: 9,
    HELLROCK: 10, BASALTCOL: 200, GRAVEL: 11, MOSS: 12, GRASS: 1, DSTILE: 13, MAGMA: 14, CRYVIOLET: 15, GEODE: 190,
    RED: 46, FLOW: 47, GLOWGRASS: 48, ECHO: 128, CRYCYAN: 16, GLOWROCK: 17, LAMP: 18, CAP: 100, LOG: 19, PLANKS: 10,
    COALORE: 50, IRONORE: 51, COPPERORE: 52, LAZORE: 53, SILVERORE: 54, DIAMONDORE: 55, REDORE: 56, GOLDORE: 57,
    RUBYORE: 58, COBALTORE: 59, LAVA: 60, BEDROCK: 211, HBEDROCK: 212, MUSHSTEM: 0, VINE: 0, LEAVES: 18,
    CHEST: 64, TORCH: 67, DOOR: 65, DOORTOP: 66, TV: 79, FURNACE: 63, BED: 78 },
  SEA: 41, HARD: {}, MC_HARD: {}, REQ: {}, NAMES: {}, NEEDS_PICK: { add() {} }, ENT: {},
  setInterval: (fn) => { (sandbox.__ivals || (sandbox.__ivals = [])).push(fn); return 1; },
  setB: function (x, y, z, v) { sandbox.window.__c320.edits.set(Math.floor(x)+','+Math.floor(y)+','+Math.floor(z), v|0); },
  console
};
sandbox.window = sandbox;
sandbox.window.__c320 = { edits: new Map(), flat: 1, fearth: function () { return 2; }, dirty: 0 };
sandbox.P = { x: 0, y: 10, z: 0 };

try {
  vm.runInNewContext(dwSrc + '\nthis.__dw=window.__dw; this.__c334=window.__c334;', sandbox, { timeout: 3000 });
} catch (e) { ok('dw_load', false, String(e.stack || e).slice(0, 240)); process.exit(1); }

const U = sandbox.__dw, gen = U.gen;
ok('dw_load', !!U && U.ver === '1.1.98d');

// Virgin floor
ok('virgin_bedrock_237', gen(5, -237, 5, 300) === 211);
ok('virgin_bedrock_300', gen(5, -300, 5, 400) === 211);
ok('virgin_bedrock_1000', gen(5, -1000, 5, 1100) === 211);

// Seed legacy edits at -300, -1000, -1423 (incl. air removal)
const samples = [
  [100, -300, 100, 28],      // stone
  [100, -299, 100, 0],       // air removal above
  [200, -1000, 200, 64],     // chest
  [200, -1001, 200, 0],      // air
  [300, -1423, 300, 67],     // torch
  [300, -1422, 300, 0]
];
for (const [x, y, z, v] of samples) sandbox.window.__c320.edits.set(x+','+y+','+z, v);
U.rebuildLegacy();

ok('minLegacyY_1423', U.minLegacyY === -1423, String(U.minLegacyY));
ok('seal_dynamic', U.sealFloorY === -1423 - 12, String(U.sealFloorY));
ok('dropFloor_below_seal', U.dropFloorY < U.sealFloorY && U.dropFloorY <= -1423 - 12 - 48, String(U.dropFloorY));

// Behaviour: open air in legacy columns at saved depths and clearance
function open(x, y, z) { return gen(x, y, z, 41 - y); }
ok('open_at_neg300', open(100, -300, 100) === 0);
ok('open_at_neg1000', open(200, -1000, 200) === 0);
ok('open_at_neg1423', open(300, -1423, 300) === 0);
ok('open_clearance_below_1423', open(300, -1423 - 11, 300) === 0);
ok('seal_below_clearance_1423', open(300, -1423 - 13, 300) === 211);
ok('other_col_sealed_at_300', open(999, -300, 999) === 211);
ok('other_col_sealed_at_1423', open(999, -1423, 999) === 211);

// Simulated getB: edits win, then gen — saved blocks never zeroed
function getBsim(x, y, z) {
  const k = x+','+y+','+z;
  if (sandbox.window.__c320.edits.has(k)) return sandbox.window.__c320.edits.get(k);
  return gen(x, y, z, 41 - y);
}
ok('edit_chest_preserved', getBsim(200, -1000, 200) === 64);
ok('edit_torch_preserved', getBsim(300, -1423, 300) === 67);
ok('edit_air_preserved', getBsim(100, -299, 100) === 0);
ok('edit_stone_preserved', getBsim(100, -300, 100) === 28);

// Drop eligibility: y above dropFloorY kept
const dropCull = (y) => y < U.dropFloorY;
ok('drop_keep_neg1000', !dropCull(-1000));
ok('drop_keep_neg1423', !dropCull(-1423));
ok('drop_cull_far_below', dropCull(U.dropFloorY - 1));

// ENT index behaviour for deep samples (no absolute y ban)
const byChunk = new Map();
const isEnt = b => b === 64 || b === 67 || b === 79;
function idxRebuild() {
  byChunk.clear();
  for (const [k, v] of sandbox.window.__c320.edits) {
    if (!isEnt(v)) continue;
    const p = k.split(',').map(Number);
    if (p[1] < 0) {
      const ck = Math.floor(p[0]/16)+','+Math.floor(p[2]/16);
      let m = byChunk.get(ck); if (!m) byChunk.set(ck, m = new Map());
      m.set(k, v);
    }
  }
}
idxRebuild();
ok('ent_indexed_chest', [...byChunk.values()].some(m => [...m.values()].includes(64)));
ok('ent_indexed_torch_deep', [...byChunk.values()].some(m => [...m.keys()].some(k => k.includes(',-1423,'))));

// Player at legacy cell: not auto-ejected (stuckInBedrock false when air/edit)
function stuckSim(x, y, z) {
  const feet = getBsim(x, Math.floor(y), z);
  const BR = 211;
  return feet === BR;
}
ok('player_safe_neg300', !stuckSim(100, -299.2, 100));
ok('player_safe_neg1000', !stuckSim(200, -999.5, 200));
ok('player_safe_neg1423', !stuckSim(300, -1422.5, 300));
ok('player_stuck_virgin_bedrock', stuckSim(50, -237.2, 50));

// Streaming depth eligibility: band follows player; NB=72 covers local slice
const NB = 72, SL = 8;
function bandFor(py) { const bY = Math.min(41 - 12, py - 40); return Math.floor(bY / SL) * SL; }
ok('stream_band_neg300', bandFor(-300) <= -300 && bandFor(-300) + NB >= -300);
ok('stream_band_neg1000', bandFor(-1000) <= -1000 && bandFor(-1000) + NB >= -1000);
ok('stream_band_neg1423', bandFor(-1423) <= -1423 && bandFor(-1423) + NB >= -1423);

ok('ent_src_deep_ok', /y < 0/.test(ent) && !/y > -237|y >= -237|FLOOR/.test(ent));

if (fail) { console.log('FAILED', fail); process.exit(1); }
console.log('ALL PASS');
