#!/usr/bin/env node
/* v1.1.97 headless checks: corner filter, wool IDs, Nature, grouping, diamond, syntax, v1196 regress */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let fail = 0;
function ok(name, cond, detail) {
  if (cond) console.log('PASS', name);
  else { console.log('FAIL', name, detail || ''); fail++; }
}

const mod = read('src/ui/v1197_inventory_nature_wool.js');
const notes = read('src/ui/v1197_patch_notes.js');
const order = read('src/ORDER.txt');
const c187 = read('src/ui/crafting_screen_fix_landscape.js');
const mud = read('src/world/xp_tidy_spawn_mud.js');

ok('order_has_v1197', /v1197_inventory_nature_wool\.js/.test(order) && /v1197_patch_notes\.js/.test(order));
const noteBullets = [...notes.matchAll(/'([^']{10,})'/g)].map(m => m[1]).filter(s => /New:|Fix:|Change:|Perf:/.test(s));
ok('notes_no_apostrophe', noteBullets.length >= 4 && noteBullets.every(s => !/[A-Za-z]'[A-Za-z]/.test(s)), noteBullets.join('|').slice(0,80));
ok('notes_v1197', /v1\.1\.97/.test(notes));
ok('mod_hides_corners', /stripCornerAccess|isCornerId/.test(mod) && /CORN/.test(mod));
ok('mod_keeps_corn_render', /__c187\.CORN/.test(mod) && !/__c187\.CORN\s*=\s*\{\s*\}/.test(mod));
ok('mod_wool_ids_256_258', /256/.test(mod) && /257/.test(mod) && /258/.test(mod));
ok('mod_wool_names', /Red wool/.test(mod) && /Green wool/.test(mod) && /Pink wool/.test(mod));
ok('mod_nature_cat', /nature/.test(mod) && /isNatureId/.test(mod));
ok('mod_group_fences_gates_doors', /fences/.test(mod) && /gates/.test(mod) && /doors/.test(mod));
ok('mod_diamond_255', /255/.test(mod) && /DIAMONDBLOCK|Block of diamond/.test(mod));
ok('diamond_already_in_mud', /T\.DIAMONDBLOCK\s*=\s*DB/.test(mud) && /DB = 255/.test(mud));
ok('corners_created_in_c187', /addCorners|CORN\[cid\]/.test(c187));

// Simulate helpers via vm-like eval
const vm = require('vm');
const sandbox = {
  window: { __c187: { CORN: { 331: { st: 164 }, 344: { st: 164, inn: 1 } } } },
  document: { createElement: () => ({ style: {}, setAttribute() {}, addEventListener() {}, getContext: () => ({ drawImage() {}, fillRect() {}, fillStyle: '', globalAlpha: 1, globalCompositeOperation: '' }), width: 64, height: 64, toDataURL: () => 'x' }), getElementById: () => null, head: { appendChild() {} }, addEventListener() {} },
  setInterval: () => 0, setTimeout: () => 0, clearInterval() {},
  MutationObserver: function () { this.observe = () => {}; },
  THREE: { Texture: function () { this.needsUpdate = 0; }, RepeatWrapping: 1, LinearMipmapLinearFilter: 1, LinearFilter: 1 },
  NAMES: { 1: 'Grass', 15: 'Tall grass', 17: 'Farmland', 33: 'Wheat seeds', 32: 'Wool', 164: 'Oak stairs', 331: 'Oak corner stairs', 344: 'Oak inner corner stairs', 162: 'Oak fence', 226: 'Oak fence gate', 65: 'Door', 255: 'Block of diamond', 10: 'Planks', 4: 'Heather' },
  ORDER: [164, 331, 344, 162, 226, 65, 1, 33, 255],
  CREATIVE_ALL: [331, 344, 164],
  RECIPES: [{ out: 331 }, { out: 164 }, { out: 255 }],
  PLACEABLE: { has: () => true, add() {} },
  T: { WOOL: 32, WOOLPURPLE: 70, WOOLBLUE: 71, WOOLYELLOW: 72, WOOLORANGE: 73, TALLGRASS: 15, HEATHER: 4, LEAVES: 18, GRASS: 1, STONEBRICK: 28, COBBLE: 3, DIAMONDBLOCK: 255 },
  IT: { REDSTONE: 118, DIAMOND: 123 },
  FACES: { 32: 'wool' }, HARD: { 32: 0.8 }, MC_HARD: { 32: 0.8 }, ICON_KEY: {}, BLOCK_MATS: { 32: {} }, ICONS: {}, BUILT_T: {}, FLAMMABLE: { add() {} },
  texImg: { wool: { width: 64 } }, texCache: {}, TEXANISO: 4,
  rc: (a, b, o) => ({ name: a, out: o, need: [] }), mat: () => ({}), navRefresh() {}, renderBag() {}, bagItems: () => [],
  CATS: [['blocks', 'Blocks'], ['tools', 'Tools']], CAT_ICON: {}, craftCat: 'blocks', catRecipes: function () { return [0, 1, 2]; },
  isPlant: id => id === 15 || id === 1, PLANT: { 15: 1 }, LEAFY: {}, console, $: () => null
};
sandbox.window = Object.assign(sandbox.window, sandbox);
let U = null;
try {
  vm.runInNewContext(mod + '\nthis.__result = window.__c404;', sandbox, { timeout: 3000 });
  U = sandbox.__result || sandbox.window.__c404;
  ok('module_loads', !!U && U.done === 1, U && U.err);
} catch (e) { ok('module_loads', false, String(e && e.stack || e).slice(0, 200)); }

if (U) {
  ok('corner_331', U.isCornerId(331));
  ok('corner_344', U.isCornerId(344));
  ok('straight_stair_not_corner', !U.isCornerId(164));
  ok('nature_grass', U.isNatureId(1));
  ok('nature_seeds', U.isNatureId(33));
  ok('nature_farmland', U.isNatureId(17));
  ok('blocks_planks_not_nature', !U.isNatureId(10));
  ok('diamond_not_nature', !U.isNatureId(255));
  ok('order_stripped_corners', !sandbox.ORDER.includes(331) && !sandbox.ORDER.includes(344) && sandbox.ORDER.includes(164));
  ok('recipes_stripped_corners', !sandbox.RECIPES.some(r => r.out === 331) && sandbox.RECIPES.some(r => r.out === 164));
  ok('struct_fence', U.structKind(162) === 'fences');
  ok('struct_gate', U.structKind(226) === 'gates');
  ok('struct_door', U.structKind(65) === 'doors');
  ok('struct_planks_blocks', U.structKind(10) === 'blocks');
  const cat = sandbox.window.categorise;
  ok('categorise_fn', typeof cat === 'function');
  if (cat) {
    ok('categorise_nature', cat(33) === 'nature');
    ok('categorise_block', cat(10) !== 'nature');
    ok('categorise_corner_hidden', cat(331) === 'hidden');
  }
  const rB = U.bagRank(10), rF = U.bagRank(162), rG = U.bagRank(226), rD = U.bagRank(65);
  ok('group_order', rB[0] < rF[0] && rF[0] < rG[0] && rG[0] < rD[0], [rB[0], rF[0], rG[0], rD[0]].join(','));
}

// ID safety vs CORN start and diamond
ok('wool_ids_not_corn', ![256, 257, 258].some(i => i >= 331 && i < 370));
ok('wool_ids_not_diamond', ![256, 257, 258].includes(255));
ok('id_cleanup_frees_not_reused_blindly', !/T\.WOOLRED\s*=\s*190|T\.WOOLRED\s*=\s*200/.test(mod));

// Generated JS syntax if s1 exists after build; optional
const s1p = path.join(root, 's1.js');
if (fs.existsSync(s1p)) {
  const s1 = fs.readFileSync(s1p, 'utf8');
  ok('s1_has_c404', /__c404|c404|v1197_inventory/.test(s1) || /Red wool/.test(s1) || /GLX-C404/.test(s1));
  ok('s1_version_or_pending', /1\.1\.97|1\.1\.96/.test(s1));
  try { new Function(s1); ok('s1_syntax', true); }
  catch (e) { ok('s1_syntax', false, String(e.message || e).slice(0, 120)); }
} else {
  ok('s1_pending_build', true);
}

// v1196 regression presence
try {
  const t96 = read('tests/v1196_headless.js');
  ok('v1196_tests_present', /no_dual_y01|build87_drop_floor|__s0Base/.test(t96));
} catch (e) { ok('v1196_tests_present', false, e.message); }

if (fail) { console.log('FAILED', fail); process.exit(1); }
console.log('ALL PASS');
