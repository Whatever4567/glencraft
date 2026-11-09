#!/usr/bin/env node
'use strict';
// Approved 1.2.37 release: refined Scottish base v2, blue-core jetpack fit, crystal armour v9, secondary motion/face life.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const out=process.argv[2]||path.join(__dirname,'../index.html');
cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.36.cjs'),out],{stdio:'inherit'});
let s=fs.readFileSync(out,'utf8');
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('Need exactly one hotfix seam: '+a.slice(0,100));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.36';","const GAME_VERSION = '1.2.37';");
one('<!-- glencraft-build: b1236-v1.2.36 -->','<!-- glencraft-build: b1237-v1.2.37 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.37',d:'2026-11-09',notes:['Refined Scottish character: groomed hair, finished face with blinking eyelids, anatomical hands, sewn shirt, pleated kilt and sporran.','Natural hip, shoulder, wrist and foot motion while walking, plus idle breathing.','The jetpack is a gunmetal pack with a glowing blue core and a leather harness, and it fits over the base outfit or the armour.','Armour is now a faceted crystal set using the same equipment slots.']})+',');
const helper=fs.readFileSync(path.join(__dirname,'pilot-model-source/secondary-1237.js'),'utf8');
one('    function pose(model,r){',helper+'\n    function pose(model,r){');
one("      rotate('spine.001',torso);\n      rotate('head',torso.clone().multiply(u.head.quaternion));\n",
    "      if(O.scottish&&O.life!==false)secondaryBody(model,r,rootQ);\n      rotate('spine.001',torso);\n      if(O.scottish&&O.life!==false)secondaryUpper(model,r,rootQ);\n      rotate('head',torso.clone().multiply(u.head.quaternion));\n      if(O.scottish&&O.life!==false)secondaryShoulders(model,r,rootQ);\n");
one("      model.updateMatrixWorld(true);\n    }\n    function visibility(model,r){",
    "      if(O.scottish&&O.life!==false){secondaryLimbs(model,r,rootQ);faceLife(model,r);}\n      if(O.scottish){packFit(model,r);helmFit(model,r);}\n      model.updateMatrixWorld(true);\n    }\n    function visibility(model,r){");
one("fetch('assets/models/scottish-base-v1/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.36'),fetch('assets/models/pilot-v1/'+name+'?v=1.2.35')",
    "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.37'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.37')");
// refined kilt hem sits at y=.581: the base legs carry an 'under_kilt' slim morph (thigh band under the kilt pulled up to 18% toward
// its own centre). Enable it on the kilt-wearing legs and cull only from y>.68 (was .63), so no dark hole/sliver shows under the
// swinging hem and the thigh still cannot poke through the apron. Armoured leg copies are made before this and keep influence 0.
one("/3>.63)occludedTriangles++","/3>.68)occludedTriangles++");
one("ge.setIndex(keep);o.geometry=ge;","ge.setIndex(keep);o.geometry=ge;if(o.morphTargetDictionary&&o.morphTargetDictionary.under_kilt!==undefined)o.morphTargetInfluences[o.morphTargetDictionary.under_kilt]=1;");
// pleated kilt: the flat front apron follows the striding thigh more (up to 60%), back pleats keep the approved 35%
one("w=.35*t*t*(3-2*t)","fz=Math.max(0,Math.min(1,p.z/.10)),w=(.35+.25*fz*fz*(3-2*fz))*t*t*(3-2*t)");
// crystal armour: fresnel rim + fake inner depth on the tintable crystal material (authored and tier variants)
one('    function installPilotDisplayTransfer(material) {',fs.readFileSync(path.join(__dirname,'pilot-model-source/crystal-rim-1237.js'),'utf8')+'    function installPilotDisplayTransfer(material) {');
one('const c=installPilotDisplayTransfer(m.clone());c.userData.pilotOriginalColor','const c=crystalRim1237(installPilotDisplayTransfer(m.clone()));c.userData.pilotOriginalColor');
one('if(!r.tintVariants.has(tier)){const m=installPilotDisplayTransfer(original.clone()),','if(!r.tintVariants.has(tier)){const m=crystalRim1237(installPilotDisplayTransfer(original.clone())),');
fs.writeFileSync(out,s);fs.writeFileSync(path.join(path.dirname(path.resolve(out)),'version.json'),JSON.stringify({v:'1.2.37'})+'\n');
console.log('Built approved 1.2.37 character release: '+out);
