#!/usr/bin/env node
'use strict';
// LOCAL only. Ports the unpublished v12 pale-ice crystal + pack-halo hooks onto
// live 1.2.52. Does not bump GAME_VERSION, does not touch first-person viewmodel
// code, __fpa drivers, world blocks, or adaptive 4K. Never publish/merge this.
const fs = require('node:fs');
const path = require('node:path');
const out = process.argv[2] || path.join(__dirname, '../index.html');
const srcPath = path.join(__dirname, 'pilot-model-source/crystal-rim-1237.js');
let s = fs.readFileSync(out, 'utf8');
function one(a, b, label) {
  const i = s.indexOf(a);
  if (i < 0) throw new Error('missing ' + (label || a.slice(0, 80)));
  if (s.indexOf(a, i + 1) >= 0) throw new Error('not unique ' + (label || a.slice(0, 80)));
  s = s.slice(0, i) + b + s.slice(i + a.length);
}
if (!s.includes("const GAME_VERSION = '1.2.52';")) {
  throw new Error('expected 1.2.52 base (feature/v1.2.6x-player-armour is branched from main fdd2bb7)');
}
const src = fs.readFileSync(srcPath, 'utf8').replace(/\s+$/, '') + '\n    ';
// Replace the live 1.2.37 crystalRim1237 block with the v12 source (crystal + pack halo).
const startTok = '    // v1.2.37: cheap crystal look for the faceted armour (r128 MeshStandardMaterial only, flat-shaded GLB; untested on GPU).';
const startTokAlt = '    // v12 local: pale icy glass for faceted armour (r128 MeshStandardMaterial).';
const endTok = '    function installPilotDisplayTransfer(material) {';
let start = s.indexOf(startTok);
if (start < 0) start = s.indexOf(startTokAlt);
if (start < 0) throw new Error('missing crystalRim comment block');
const end = s.indexOf(endTok, start);
if (end < 0) throw new Error('missing installPilotDisplayTransfer after crystalRim');
s = s.slice(0, start) + src + s.slice(end);

one(
  '      if(material.onBeforeCompile.pilotDisplayTransfer1236)return material;',
  '      if(material.onBeforeCompile.pilotDisplayTransfer1236)return packHalo1238(crystalRim1237(material));',
  'display-transfer early return'
);
one(
  "      material.customProgramCacheKey=function(){return previousKey+'|pilot-display-transfer-1236';};\n      material.needsUpdate=true;return material;\n    }",
  "      material.customProgramCacheKey=function(){return previousKey+'|pilot-display-transfer-1236';};\n      material.needsUpdate=true;return packHalo1238(crystalRim1237(material));\n    }",
  'display-transfer return'
);
one(
  "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.52'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.52')",
  "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.6x-p2'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.6x-p2')",
  'model cache query'
);
if (!s.includes('function packHalo1238')) throw new Error('packHalo1238 not inserted');
if (!s.includes('CRYSTAL_RIM_1237') || !s.includes('crSpark')) throw new Error('v12 crystal shader not inserted');
if (s.includes('?v=1.2.52') && s.includes("scottish-base-with-jetpack.glb')+'?v=1.2.52")) {
  throw new Error('cache query not updated');
}
fs.writeFileSync(out, s);
console.log('Built LOCAL v1.2.6x player/armour candidate on 1.2.52: ' + out);
