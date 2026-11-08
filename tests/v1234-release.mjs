// Exact f85aef4 art preservation, not a visual-quality assertion.
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';const hash=s=>crypto.createHash('sha256').update(s).digest('hex'),html=fs.readFileSync('index.html','utf8');
assert.equal(hash(fs.readFileSync('tools/pilot-source/fit.js')),'897252bc55a37b54f9debb227fdf3f336a95b1168f3999bc6a8fe5f5c5b5c9c6');assert.equal(JSON.parse(fs.readFileSync('version.json')).v,'1.2.34');assert.equal(html.split("const GAME_VERSION = '1.2.34';").length,2);assert(html.includes('<!-- glencraft-build: b1234-v1.2.34 -->'));
const re=/window\.PATCH_NOTES = \[\n(\{[^\n]+\}),/,m=html.match(re);assert(m);assert.deepEqual(JSON.parse(m[1]),{v:'v1.2.34',d:'2026-11-08',notes:[
 'Pilot armour has a fitted collar and helmet details, curved brown webbing, buckles and hip pouches.',
 'The worn white jetpack has a shaped casing, frame, hoses and red indicator. Native pack fitting returns when the pilot chest is removed.',
 'The face, hands, underlying body, rig, gold jetpack, combat and saves are unchanged.'
]});
const approved=html.replace("const GAME_VERSION = '1.2.34';","const GAME_VERSION = '1.2.33';").replace('<!-- glencraft-build: b1234-v1.2.34 -->','<!-- glencraft-build: b1233-v1.2.33 -->').replace(re,'window.PATCH_NOTES = [');assert.equal(hash(approved),'ae92c50e933d6c6848e24b594cd911fe1922b7c9bad4b52611fb1e1549c08947','entire approved preview byte-identical except release metadata');console.log('v1234-release PASS: exact approved source/preview, matching version/marker/notes/metadata.');
