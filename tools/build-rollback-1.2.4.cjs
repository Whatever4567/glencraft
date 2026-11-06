#!/usr/bin/env node
'use strict';
// v1.2.4: restore pre-cave-rework (v1.1.97, last build before v1.1.98 layered caves) cave
// generation/render/lighting/streaming, re-apply v1.1.99 FPS rig + v1.1.100/1.2.0 portal,
// then the v1.2.3 diamond259 + Uint16 cell storage/u16 save transform. Usage: node tools/build-rollback-1.2.4.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rb124-')),f=path.join(dir,'index.html');
try{
 fs.writeFileSync(f,cp.execFileSync('git',['show','00f6940:index.html'],{cwd:root,maxBuffer:1<<28}));
 // Only the two version-marker hunks reject; they are replaced below.
 try{cp.execFileSync('patch',['-p1','-r','-','--no-backup-if-mismatch',f,path.join(__dirname,'rollback-source/fps-portal-v1.1.99-v1.2.0.diff')],{stdio:'pipe'});}catch(e){}
 let s=fs.readFileSync(f,'utf8');
 if(!s.includes('YEAR 24000')&&!/24000/.test(s))throw Error('portal patch missing');
 s=s.replace('<!-- glencraft-build: b1197-v1.1.97 -->','<!-- glencraft-build: b1204-v1.2.4 -->').replace(/^const GAME_VERSION = '1\.1\.97';/m,"const GAME_VERSION = '1.2.4';");
 s=require('./build-diamond-patch.cjs').transform(s,{anyBase:true});
 // 1.1.97 rotated-chunk block buffer (spaced form not covered by the 1.2.2-targeted transform) must hold ids>255.
 if(!s.includes('TMP = new Uint8Array(PW * NB * PW)'))throw Error('missing TMP cell buffer');s=s.replace('TMP = new Uint8Array(PW * NB * PW)','TMP = new Uint16Array(PW * NB * PW)');
 // Save passthrough: keys written by 1.2.0-1.2.3 (e.g. deepCaves) that 1.1.97 code does not know are kept, not dropped on autosave.
 const keep="/* GLX-R124 save passthrough */\n(function r124(){ let src=null; const se=serialize, ap=applySave;\n applySave=function(d){ src=(d&&typeof d==='object')?d:null; return ap.apply(this,arguments); };\n serialize=function(){ const d=se.apply(this,arguments); if(src&&d&&typeof d==='object'&&src.id===d.id)for(const k in src)if(!(k in d))d[k]=src[k]; return d; };\n})();\n";
 const at2=s.indexOf('/* GLX-C288');if(at2<0)throw Error('anchor');s=s.slice(0,at2)+keep+s.slice(at2);
 s=s.replace('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.4',d:'2026-11-06',notes:['Caves rolled back to how they were before today\'s cave rework (generation, rendering, lighting, chunk streaming). Diamond block, portal, guns, inventory kept. Saves kept.']})+',');
 s=s.replace('<!-- glencraft-build:','<!-- glencraft-cave-rollback: v1.1.97-caves -->\n<!-- glencraft-build:');
 fs.writeFileSync(out,s);console.log(crypto.createHash('sha256').update(s).digest('hex'));
}finally{fs.rmSync(dir,{recursive:true,force:true});}
