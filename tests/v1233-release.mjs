// The user approved precisely 25a66b68's armour. Only release metadata may differ from that preview.
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');const html=fs.readFileSync('index.html','utf8');
assert.equal(hash(fs.readFileSync('tools/armour-source/refined.js')),'7925baca9b3b625467a7611e141058fb70916cf4a9dd8ee6b81b10079038e0b3');
assert.equal(JSON.parse(fs.readFileSync('version.json')).v,'1.2.33');assert.equal(html.split("const GAME_VERSION = '1.2.33';").length,2);assert(html.includes('<!-- glencraft-build: b1233-v1.2.33 -->'));
const re=/window\.PATCH_NOTES = \[\n(\{[^\n]+\}),/,m=html.match(re);assert(m);const note=JSON.parse(m[1]);assert.deepEqual(note,{v:'v1.2.33',d:'2026-11-08',notes:[
 'Fitted armour has a shaped chest, tapered limb plates and restrained diamond surfaces with clean edge trim.',
 'Armour tiers keep their colours, and worn jetpack straps fit over the new plates.',
 'The head, body underneath, rig, combat and saves are unchanged.'
]});
const approved=html.replace("const GAME_VERSION = '1.2.33';","const GAME_VERSION = '1.2.32';").replace('<!-- glencraft-build: b1233-v1.2.33 -->','<!-- glencraft-build: b1232-v1.2.32 -->').replace(re,'window.PATCH_NOTES = [');
assert.equal(hash(approved),'c0ac954f68dc003f79a448acbb08a75e3ffaf628dd6207a913fffdb2a2c950bf','release is byte-identical to the exact approved preview except version/marker/release note');
assert(!html.includes('const armourSculpt ='),'rejected runtime absent');
console.log('v1233-release PASS: exact approved art and entire preview preserved, version.json/version/marker/notes agree, rejected art absent.');
