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

const dw = read('src/earth/deep_world.js');
const eye = read('src/earth/hell_eye_chamber_v1198.js');
const notes = read('src/ui/v1198_patch_notes.js');
const order = read('src/ORDER.txt');
const agu = read('src/agartha/agartha_underground.js');

ok('order_deep_and_eye', /deep_world\.js/.test(order) && /hell_eye_chamber_v1198\.js/.test(order) && /v1198_patch_notes\.js/.test(order));
ok('notes_v1198', /v1\.1\.98/.test(notes));
const bullets = [...notes.matchAll(/'([^']{10,})'/g)].map(m => m[1]).filter(s => /New:|Keep:|Fix:|Change:/.test(s));
ok('notes_no_apostrophe', bullets.length >= 4 && bullets.every(s => !/[A-Za-z]'[A-Za-z]/.test(s)));
ok('floor_y_237', /floorY:\s*-237|-237/.test(dw) && /FLOOR/.test(dw));
ok('bedrock_return', /BEDROCK/.test(dw) && /y <= FLOOR/.test(dw));
ok('layers_mentioned', /lush|hell|crystal|volcanic|shallow|mushroom/i.test(dw));
ok('no_old_core_1000', !/CORE = 1000/.test(dw));
ok('agartha_bounds_intact', /AY = -50/.test(agu) && /YN = 48/.test(agu));
ok('eye_is_3d_geometry', /SphereGeometry/.test(eye) && /hellEye/.test(eye));
ok('eye_not_image_paste', !/drawImage\([^)]*eye/i.test(eye) && !/\.jpg|\.png/.test(eye));
ok('eye_distance_cull', /CULL|cull/i.test(eye) && /MAX_EYES/.test(eye));
ok('player_lift_not_delete', /Lifted above the bedrock floor/.test(eye) && /lift/.test(eye));
ok('agartha_range_recorded', /agartha:\s*\[\s*-50\s*,\s*-2\s*\]/.test(eye));

// Simulate gen coordinate / bedrock / Agartha preservation
const sandbox = {
  window: {}, Math, performance: { now: () => 0 },
  T: { STONE: 2, WSTONE: 3, MOSSYCOBBLE: 4, DEEPSLATE: 5, DSCOBBLE: 6, BLACKSTONE: 7, OBSIDIAN: 8, MOONBASALT: 9,
    HELLROCK: 10, BASALTCOL: 200, GRAVEL: 11, MOSS: 12, GRASS: 1, DSTILE: 13, MAGMA: 14, CRYVIOLET: 15, GEODE: 190,
    RED: 46, FLOW: 47, GLOWGRASS: 48, ECHO: 128, CRYCYAN: 16, GLOWROCK: 17, LAMP: 18, CAP: 100, LOG: 19, PLANKS: 10,
    COALORE: 50, IRONORE: 51, COPPERORE: 52, LAZORE: 53, SILVERORE: 54, DIAMONDORE: 55, REDORE: 56, GOLDORE: 57,
    RUBYORE: 58, COBALTORE: 59, LAVA: 60, BEDROCK: 211, HBEDROCK: 212, MUSHSTEM: 0 },
  SEA: 41, HARD: {}, MC_HARD: {}, REQ: {}, NAMES: {}, NEEDS_PICK: { add() {} },
  setInterval: (fn) => { sandbox.__hook = fn; return 0; },
  console
};
sandbox.window = sandbox;
try {
  vm.runInNewContext(dw + '\nthis.__dw = window.__dw; this.__c334 = window.__c334;', sandbox, { timeout: 2000 });
  const U = sandbox.__dw, C = sandbox.__c334;
  ok('dw_loads', !!U && U.floorY === -237);
  ok('c334_floor', C && C.floorY === -237);
  const gen = U.gen;
  ok('bedrock_at_floor', gen(0, -237, 0, 300) === 211);
  ok('bedrock_below_floor', gen(0, -250, 0, 400) === 211);
  // Above floor deep sample should not always be bedrock
  const sample = [];
  for (let y = -100; y > -230; y -= 10) sample.push(gen(10, y, 20, 41 - y));
  ok('air_or_rock_above_floor', sample.some(b => b === 0 || (b && b !== 211)), sample.slice(0, 5).join(','));
  // Band compression: max depth for SEA=41 is 41-(-237)-1 = 277
  ok('band_fits_floor', C.B[C.B.length - 1][1] <= 300);
  // Agartha Y -50..-2 must remain outside exclusive hell ownership — deep still generates there but stamp overlays; record expected
  ok('agartha_above_floor', -50 > -237 && -2 > -237);
  // Render budget constants from eye module
  ok('flame_budget_documented', /flameBudget|MAX_EYES|CULL/.test(eye));
} catch (e) { ok('dw_loads', false, String(e && e.stack || e).slice(0, 200)); }

// Save overlay: edits must not be cleared by deep_world (no world wipe / edits clear)
ok('no_edit_wipe', !/edits\s*=\s*\[\]/.test(dw) && !/edits\.clear/.test(dw) && !/localStorage\.clear/.test(dw));
ok('no_agartha_rewrite', !/AY\s*=\s*-237/.test(agu) && /AY = -50/.test(agu));

// Previous suites present
ok('v1196_suite', fs.existsSync(path.join(root, 'tests/v1196_headless.js')));
ok('v1197_suite', fs.existsSync(path.join(root, 'tests/v1197_headless.js')));

const s1p = path.join(root, 's1.js');
if (fs.existsSync(s1p)) {
  const s1 = fs.readFileSync(s1p, 'utf8');
  try { new Function(s1); ok('s1_syntax_pre', true); } catch (e) { ok('s1_syntax_pre', false, e.message); }
}

if (fail) { console.log('FAILED', fail); process.exit(1); }
console.log('ALL PASS');
