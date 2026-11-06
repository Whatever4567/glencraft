#!/usr/bin/env node
'use strict';
// Source-owned, hash-gated patch applied to the exact integrity checkpoint.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const argv=process.argv.slice(2),preview=argv.includes('--print-hash'),args=argv.filter(x=>x!=='--print-hash');
const basePath=path.join(__dirname,'cave-source/checkpoints/pre-loader.html');
const output=args.length===1&&!preview?path.resolve(args[0]):null;
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const before=fs.readFileSync(basePath),previous=fs.readFileSync(path.join(__dirname,'cave-source/c324-verified-base.js')),next=fs.readFileSync(path.join(__dirname,'cave-source/c324-streamed-surface.js'));
if(sha(before)!=='63e79e6b6a068e730cf5411602dfd89d97d71c2808b075e8e7ff82378e3d2cfb')throw Error('Wrong exact integrity checkpoint '+sha(before));
if(sha(previous)!=='fb5b4d1081a5147c0fd0e79437765542fdcd620529a2cda456754a4520d7f0d9')throw Error('Wrong exact old owner checkpoint');
let original=before.toString('utf8');
const oldText=previous.toString('utf8');
const terrain=fs.readFileSync(path.join(__dirname,'cave-source/deep-world-terrain.js'),'utf8');
new (require('node:vm').Script)(terrain);
const ta=original.indexOf('(function deepWorld()'),tb=original.indexOf('\n/* GLX-AGU',ta);
if(ta<0||tb<0||original.indexOf('(function deepWorld()',ta+1)>=0)throw Error('Exactly one deepWorld required');
original=original.slice(0,ta)+terrain+original.slice(tb);
const position=original.indexOf(oldText);
if(position<0||original.indexOf(oldText,position+1)>=0)throw Error('Exactly one exact C324 owner required');
let result=original.slice(0,position)+next+original.slice(position+oldText.length);
const restore=fs.readFileSync(path.join(__dirname,'cave-source/c317-restore-helper.js'),'utf8');
// Original C321 resets after base enterWorld but still means before i===2 timer;
// no duplicate local-selection transform is introduced by this patch.
const rStart=original.indexOf('(function c317c()'),rEnd=original.indexOf('\n\n/* ===================== GLX-C316',rStart);
const restoreTarget=original.slice(rStart,rEnd);
if(original.indexOf(restoreTarget)!==original.lastIndexOf(restoreTarget)||result.indexOf(restoreTarget)!==result.lastIndexOf(restoreTarget)||result.indexOf(restoreTarget)<0)throw Error('Exactly one C317 restore hook required');
result=result.replace(restoreTarget,restore);
const slots=[
 ['cave-source/enterWorld-cave-save.js','    if (i === 2) {','      loadStep(\'player, hotbar and animals\');',0],
 ['cave-source/b9e-stream-wrapper.js','rebuild = function (budget) {','(function streamTick()',original.indexOf('/* ===================== GLX-B9e')],
 ['cave-source/enterWorld-zero-gate.js','  const chunksReady = () => {','    if (dirtyAll) return false;',original.indexOf('function enterWorld(save)')],
 ['cave-source/chunksReady-cave-entry.js','    if (dirtyAll) return false;','    const pcx = Math.floor(P.x / CH)',original.indexOf('function enterWorld(save)')]
];
for(const [file,begin,end,from]of slots){
 const replacement=fs.readFileSync(path.join(__dirname,file),'utf8');
 const start=original.indexOf(begin,from),stop=original.indexOf(end,start+begin.length);
 if(start<0||stop<0)throw Error('Missing exact production counterpart: '+file);
 const old=original.slice(start,stop),at=result.indexOf(old);
 if(at<0||result.indexOf(old,at+1)>=0)throw Error('Exactly one counterpart required: '+file);
 result=result.slice(0,at)+replacement+result.slice(at+old.length);
}
result=result.replace("const GAME_VERSION = '1.2.1';","const GAME_VERSION = '1.2.2';");
result=result.replace('<!-- glencraft-build: b1201-v1.2.1 -->','<!-- glencraft-build: b1202-v1.2.2 -->');
const releaseNotes={v:'v1.2.2',d:'2026-11-06',notes:[
 'Caves: seven connected underground strata with gray halls, giant fungi, deep dark pillars, basalt magma, molten depths, an abyssal crystal ring and the original giant eye above a dry core bowl.',
 'Fix: digging across Y0 preserves cave mesh ownership while incremental work finishes. Existing loading, lighting and streaming remain incremental.',
 'A dry eastern staircase descends from the gray cave to the core. Surface, Agartha, UFO, existing edits and AIR removals are preserved. No automatic reset.'
]};
if(releaseNotes.notes.some(n=>n.includes("'")))throw Error('No apostrophes in release notes');
result=result.replace('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify(releaseNotes)+',');
const digest=sha(result);
if(preview){console.log(JSON.stringify({base:sha(before),oldOwner:sha(previous),newOwner:sha(next),output:digest,bytes:Buffer.byteLength(result)}));process.exit(0);}
if(process.env.CAVE_EXPECT_SHA!==digest)throw Error('Expected output hash required; nothing written: '+digest);
if(!output)throw Error('Provide an explicit separate output path; no in-place or silent writes');
const tmp=output+'.tmp.'+process.pid;fs.writeFileSync(tmp,result,{flag:'wx'});fs.renameSync(tmp,output);console.log('WROTE '+output+' '+digest);
