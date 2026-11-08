#!/usr/bin/env node
'use strict';
// Local first person parity patch (no version change): the first person HD arms (GLX-FPA) used their own old flat skin (0xd4a07a, rough .62)
// and old fabric sleeve, so the v1.2.30-32 player look never reached the hands and forearms you see in first person. The third person
// builder (tph) now exposes its skin and linen shirt material recipe (U.fpMats, sharing its cached linen texture) and FPA make() uses it.
// Geometry, rig, IK, grips, poses and armour sleeves are untouched. Usage: node tools/build-1.2.33-fp.cjs in.html out.html
const fs=require('node:fs');const [,,inp,out]=process.argv;if(!inp||!out)throw Error('usage: in.html out.html');let s=fs.readFileSync(inp,'utf8');
function rep(x,y){const i=s.indexOf(x);if(i<0||s.indexOf(x,i+1)>=0)throw Error('need exactly one: '+x.slice(0,90));s=s.slice(0,i)+y+s.slice(i+x.length);}
rep("  const U = window.__tph = {err: null, built: 0};\n",
 "  const U = window.__tph = {err: null, built: 0};\n  U.fpMats = () => { const T_ = texs(); return {skin: new THREE.MeshStandardMaterial({color: 0xe0ac86, roughness: .48, metalness: 0}), shirt: new THREE.MeshStandardMaterial({map: T_.linen, bumpMap: T_.linen, bumpScale: 0.6, roughness: .88, metalness: 0}), fp: 1233}; };   /* v1.2.33 local: first person arms wear the same skin and linen as the third person player */\n");
rep("  function make() { skinM = new THREE.MeshStandardMaterial({color: 0xd4a07a, roughness: 0.62, metalness: 0.02}); shirtM = new THREE.MeshStandardMaterial({map: fabric(), roughness: 0.9}); cuffM = shirtM;",
 "  function make() { let SM = null; try { SM = window.__tph && __tph.fpMats ? __tph.fpMats() : null; } catch (e) { ERR('mats', e); } if (SM) { skinM = SM.skin; shirtM = SM.shirt; U.mats = 1233; } else { skinM = new THREE.MeshStandardMaterial({color: 0xd4a07a, roughness: 0.62, metalness: 0.02}); shirtM = new THREE.MeshStandardMaterial({map: fabric(), roughness: 0.9}); U.mats = 0; } cuffM = shirtM;");
fs.writeFileSync(out,s);
