#!/usr/bin/env node
'use strict';
// Approved 1.2.40 release: third-person held-item sockets + first-person/swim arms from the new character.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const out=process.argv[2]||path.join(__dirname,'../index.html');
cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.39.cjs'),out],{stdio:'inherit'});
let s=fs.readFileSync(out,'utf8');
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('Need exactly one hotfix seam: '+a.slice(0,100));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.39';","const GAME_VERSION = '1.2.40';");
one('<!-- glencraft-build: b1239-v1.2.39 -->','<!-- glencraft-build: b1240-v1.2.40 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.40',d:'2026-11-09',notes:['Held items in first and third person now follow the new character hand sockets: every tool and held item faces forward, stays a sensible size, stays visible in the hand and keeps its own material. The purple crystal pickaxe is thin and reasonably sized.','First-person and swimming arms now come from the new character, including the crystal vambrace and gauntlet when armour is on.','First-person musket reload uses the player\'s own new-model right arm (cream sleeve or armour gauntlet) on the ramrod, with no duplicate arm and no 360° flip back to idle. Pistol reload no longer spawns a huge sphere at the muzzle.']})+',');
one("fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.39'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.39')",
    "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.40'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.40')");
const helper=fs.readFileSync(path.join(__dirname,'pilot-model-source/held-fp-1240.js'),'utf8');
const reload=fs.readFileSync(path.join(__dirname,'pilot-model-source/reload-1240.js'),'utf8');
one('  U.ready().catch(()=>{});\n})();\n\n</script>',
    '  U.ready().catch(()=>{});\n})();\n'+helper+'\n'+reload+'\n</script>');
fs.writeFileSync(out,s);fs.writeFileSync(path.join(path.dirname(path.resolve(out)),'version.json'),JSON.stringify({v:'1.2.40'})+'\n');
console.log('Built approved 1.2.40 held-item, first-person arms and reload-fix release: '+out);
