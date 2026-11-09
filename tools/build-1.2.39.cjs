#!/usr/bin/env node
'use strict';
// Approved 1.2.39 release: default graphics preset is 4K UHD when glen_q is unset.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const out=process.argv[2]||path.join(__dirname,'../index.html');
cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.38.cjs'),out],{stdio:'inherit'});
let s=fs.readFileSync(out,'utf8');
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('Need exactly one hotfix seam: '+a.slice(0,100));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.38';","const GAME_VERSION = '1.2.39';");
one('<!-- glencraft-build: b1238-v1.2.38 -->','<!-- glencraft-build: b1239-v1.2.39 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.39',d:'2026-11-09',notes:['Default graphics mode is now 4K UHD.']})+',');
one("fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.38'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.38')",
    "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.39'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.39')");
// Unset glen_q (new players, or anyone who never clicked a quality button) now defaults to 4K UHD on every device.
// An explicitly saved glen_q is still honoured; the default is not written to localStorage automatically.
one("let QUALITY = 'phone';\ntry { QUALITY = localStorage.getItem('glen_q') || (touchMode ? 'phone' : '4k'); } catch (_) { QUALITY = touchMode ? 'phone' : '4k'; }",
    "let QUALITY = '4k';\ntry { QUALITY = localStorage.getItem('glen_q') || '4k'; } catch (_) { QUALITY = '4k'; }");
fs.writeFileSync(out,s);fs.writeFileSync(path.join(path.dirname(path.resolve(out)),'version.json'),JSON.stringify({v:'1.2.39'})+'\n');
console.log('Built approved 1.2.39 graphics-default release: '+out);
