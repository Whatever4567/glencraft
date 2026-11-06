#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),cp=require('node:child_process'),os=require('node:os');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function transform(s){
 if(!(arguments[1]&&arguments[1].anyBase)&&sha(s)!=='704ada4b094f31594c0f0165954f6877b9aa1586db2ab2968da1d0076d42229b')throw Error('Requires exact cave1.2.2 artifact');
 // Only block CELL buffers and lookup tables widen. Pixels, atlas layer indices, lighting remain byte arrays.
 s=s.replace(/world = new Uint8Array\(W \* H \* D\)/g,'world = new Uint16Array(W * H * D)');
 const cells=['W * oldH * D','EH','ZW * EH * ZD','PW * EH * PW','PW * N * PW','SW * SL * SW','PW*NB*PW','w * h * d','sw * sd * H','sx * sy * sz','C * C * N','SW * YN * SD'];
 for(const expr of cells)s=s.split('new Uint8Array('+expr+')').join('new Uint16Array('+expr+')');
 s=s.replace('const newCh = () => { const a = new Uint8Array(N);','const newCh = () => { const a = new Uint16Array(N);');
 // Incremental autosave must also preserve high bits, without introducing a synchronous world scan.
 s=s.replace('if (o + 2 > b.length)', 'if (o + (a.BYTES_PER_ELEMENT===2?3:2) > b.length)');
 s=s.replace('b[o++] = v; b[o++] = n;', 'b[o++] = v & 255; if(a.BYTES_PER_ELEMENT===2)b[o++] = v >>> 8; b[o++] = n;');
 s=s.replace('const toB64 = parts =>', 'const toB64 = (parts,wide=false) =>');
 s=s.replace('return btoa(s); };\n  const re = rleEncode;', "return (wide?'u16:':'')+btoa(s); };\n  const re = rleEncode;");
 s=s.replace('pre = toB64(parts);', 'pre = toB64(parts,a.BYTES_PER_ELEMENT===2);');

 // Type registries (not atlas/pixel buffers): extended ids need known opaque defaults for AO and lighting.
 s=s.replace(/new Uint8Array\(256\)/g,'new Uint8Array(1024)');
 // Known loops initialize leaf/plant metadata only; diamond default zero means opaque nonplant.
 const a=s.indexOf('function rleEncode(a)'),b=s.indexOf('let current = null;',a);
 if(a<0||b<0)throw Error('Missing RLE');s=s.slice(0,a)+fs.readFileSync(path.join(__dirname,'diamond-source/block-rle.js'),'utf8')+'\n'+s.slice(b);
 s=s.replace('const DB = 255; T.DIAMONDBLOCK = DB;','const DB = 259; T.DIAMONDBLOCK = DB;');
 s=s.replace('const DB = (T && T.DIAMONDBLOCK) || 255;','const DB = (T && T.DIAMONDBLOCK) || 259;');
 const module=fs.readFileSync(path.join(__dirname,'diamond-source/diamond-block.js'),'utf8');new vm.Script(module);
 // Put registration after C287 but before later atlas/cave use; preserve its lexical game scope.
 const anchor='/* GLX-C288';const at=s.indexOf(anchor);if(at<0)throw Error('Missing C288 anchor');
 s=s.slice(0,at)+module+'\n'+s.slice(at);
 s=s.replace("const GAME_VERSION = '1.2.2';","const GAME_VERSION = '1.2.3';").replace('b1202-v1.2.2','b1203-v1.2.3');
 s=s.replace('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.3',d:'2026-11-06',notes:['Added Block of diamond: own polished cyan faceted tile, creative and inventory access, nine diamonds to a block and back. Snow and juniper ids preserved.','Extended block storage with legacy-byte save decoding; existing 1.2.2 caves and Y0 repair retained.']})+',');
 return s;
}
module.exports={transform};
if(require.main===module){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'diamond-build-')),base=path.join(dir,'base.html');
 try{const h=JSON.parse(cp.execFileSync(process.execPath,[path.join(__dirname,'build-cave-patch.cjs'),'--print-hash']));
 cp.execFileSync(process.execPath,[path.join(__dirname,'build-cave-patch.cjs'),base],{env:{...process.env,CAVE_EXPECT_SHA:h.output}});
 const result=transform(fs.readFileSync(base,'utf8'));if(!process.argv[2])throw Error('Explicit output path required');
 fs.writeFileSync(process.argv[2],result);console.log(sha(result));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
