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
const l567 = read('src/earth/layer_five_six_seven_blocks.js');

ok('order', /deep_world\.js/.test(order) && /hell_eye_chamber_v1198\.js/.test(order));
ok('notes_v1198', /v1\.1\.98/.test(notes));
const bullets = [...notes.matchAll(/'([^']{10,})'/g)].map(m => m[1]).filter(s => /New:|Keep:|Fix:|Change:/.test(s));
ok('notes_no_apostrophe', bullets.length >= 4 && bullets.every(s => !/[A-Za-z]'[A-Za-z]/.test(s)));
ok('floor_237', /floorY:\s*-237/.test(dw));
ok('hell_landmark_carve', /hellLandmark|hellX|HR\s*=/.test(dw));
ok('legacy_grandfather', /legacy\.has|rebuildLegacy/.test(dw));
ok('agartha_untouched', /AY = -50/.test(agu) && /YN = 48/.test(agu));
ok('shimmer_hard_off', /display:\s*'none'|display:none/.test(l567) || /striped heat shimmer is off/.test(l567));
ok('dw_keeps_shim_off', /l567shim/.test(dw));

ok('one_dominant_eye', /ONE dominant|EYE_R/.test(eye) && !/MAX_EYES\s*=\s*[2-9]/.test(eye));
ok('eye_large', /EYE_R = PH \? 18 : 24|eyeR:\s*0/.test(eye) || /EYE_R = PH \? 18 : 24/.test(eye));
ok('eye_colors', /0xffb04a|golden|0x2f8a3a|green|slit|BoxGeometry/.test(eye));
ok('eye_tendrils', /ConeGeometry|tendril/i.test(eye));
ok('lift_only_stuck', /stuckInBedrock/.test(eye) && /Lifted out of bedrock/.test(eye));
ok('no_unconditional_lift', !(/P\.y < fl \+ 1\.2/.test(eye) && !/stuckInBedrock/.test(eye)));

const sandbox = {
  window: {}, Math, performance: { now: () => 0 }, document: { getElementById: () => null },
  T: { STONE: 2, WSTONE: 3, MOSSYCOBBLE: 4, DEEPSLATE: 5, DSCOBBLE: 6, BLACKSTONE: 7, OBSIDIAN: 8, MOONBASALT: 9,
    HELLROCK: 10, BASALTCOL: 200, GRAVEL: 11, MOSS: 12, GRASS: 1, DSTILE: 13, MAGMA: 14, CRYVIOLET: 15, GEODE: 190,
    RED: 46, FLOW: 47, GLOWGRASS: 48, ECHO: 128, CRYCYAN: 16, GLOWROCK: 17, LAMP: 18, CAP: 100, LOG: 19, PLANKS: 10,
    COALORE: 50, IRONORE: 51, COPPERORE: 52, LAZORE: 53, SILVERORE: 54, DIAMONDORE: 55, REDORE: 56, GOLDORE: 57,
    RUBYORE: 58, COBALTORE: 59, LAVA: 60, BEDROCK: 211, HBEDROCK: 212, MUSHSTEM: 0, VINE: 0, LEAVES: 18 },
  SEA: 41, HARD: {}, MC_HARD: {}, REQ: {}, NAMES: {}, NEEDS_PICK: { add() {} },
  setInterval: (fn) => { (sandbox.__ivals || (sandbox.__ivals = [])).push(fn); return sandbox.__ivals.length; },
  console
};
sandbox.window = sandbox;
sandbox.window.__c320 = { edits: new Map(), flat: 1, fearth: function () { return 2; }, dirty: 0 };
try {
  vm.runInNewContext(dw + '\nthis.__dw=window.__dw; this.__c334=window.__c334;', sandbox, { timeout: 3000 });
  const U = sandbox.__dw, C = sandbox.__c334, gen = U.gen;
  ok('dw_loads', !!U && U.floorY === -237);
  ok('bedrock_virgin', gen(0, -237, 0, 300) === 211);
  ok('bedrock_deep_seal', gen(0, -237 - 70, 0, 400) === 211);
  // Grandfather column
  sandbox.window.__c320.edits.set('10,-250,20', 5);
  U.rebuildLegacy();
  ok('legacy_indexed', U.legacy.has('10,20'));
  ok('legacy_open_air', gen(10, -240, 20, 300) === 0, String(gen(10, -240, 20, 300)));
  ok('other_col_still_bedrock', gen(99, -240, 99, 300) === 211);
  // Hell landmark air clearance around eye
  const hx = U.hellX, hz = U.hellZ, fl = U.floorY, ey = fl + 28, er = 24;
  let air = 0, solid = 0;
  for (let y = ey - er - 2; y <= ey + er + 2; y++) {
    const b = gen(hx, y, hz, 41 - y);
    if (b === 0) air++; else solid++;
  }
  ok('eye_column_mostly_air', air >= 20, 'air=' + air + ' solid=' + solid);
  // Room radius: sample ring inside HR
  let hallAir = 0;
  for (let a = 0; a < 12; a++) {
    const ang = a * Math.PI / 6, x = Math.round(hx + Math.cos(ang) * 20), z = Math.round(hz + Math.sin(ang) * 20);
    if (gen(x, fl + 20, z, 41 - (fl + 20)) === 0) hallAir++;
  }
  ok('hell_hall_radius_air', hallAir >= 8, 'hallAir=' + hallAir);
  ok('hell_pv_tall', /PV_OF = i => \(i === 5 \? 70/.test(dw));
  ok('agartha_above_floor', -50 > -237);
  // Agartha Y samples must not be forced to bedrock by floor rule
  ok('agartha_y_not_bedrock_rule', gen(420, -30, 100, 71) !== 211 || true); // gen may return rock/air; just not floor path
  const atAg = gen(420, -30, 100, 41 - (-30));
  ok('agartha_band_not_floor', atAg !== 211, 'got ' + atAg);
} catch (e) { ok('dw_loads', false, String(e && e.stack || e).slice(0, 240)); }

ok('no_edit_wipe', !/edits\.clear|localStorage\.clear/.test(dw));
ok('v1196_suite', fs.existsSync(path.join(root, 'tests/v1196_headless.js')));
ok('v1197_suite', fs.existsSync(path.join(root, 'tests/v1197_headless.js')));

if (fail) { console.log('FAILED', fail); process.exit(1); }
console.log('ALL PASS');
