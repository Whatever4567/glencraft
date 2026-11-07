#!/usr/bin/env node
'use strict';
// v1.2.18: surface chunk pass lag fixes on top of v1.2.17. Usage: node tools/build-1.2.18.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1218-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.17.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
// v1.2.18 lag: the surface chunk pass (rebuild, called every frame while any map chunk is still dirty, which on the big UK map is
// always: far chunks stay dirty until you come near) copied and filtered the whole dirty set every frame, and every frame that built
// even one chunk while walking re-gathered every loaded chunk's torches/chests/doors and re-synced all entity, fence, hive and deep
// lists. Now: (1) when you are in the same chunk, the dirty set did not change size and nothing was unloaded, the frame returns at once;
// (2) the full entity sync runs when the nearby build pass is finished, or at most every 300 ms while it is still building;
// (3) the 250 ms walking check reads the dirty count without copying the set.
{ const A1 = "  let ids = [...dirtyCh].filter(id => dist(id) <= R);\n  if (!ids.length && !rebuild._unloaded) return;";
  const i = s.indexOf(A1); if (i < 0 || s.indexOf(A1, i + 1) >= 0) throw Error('rebuild anchor');
  const A2 = "  const all = {};\n  for (const L of chunkLists.values())", j = s.indexOf(A2, i); if (j < 0 || j - i > 1500) throw Error('rebuild anchor 2');
  const mid = s.slice(i + A1.length, j);
  s = s.slice(0, i) + "  const sg18 = Math.floor(pcx) + ',' + Math.floor(pcz) + ',' + dirtyCh.size + ',' + R;\n  if (rebuild._sg === sg18 && !rebuild._unloaded) return;\n  let ids = [...dirtyCh].filter(id => dist(id) <= R);\n  if (!ids.length && !rebuild._unloaded) { rebuild._sg = sg18; return; }\n  rebuild._sg = null;" + mid +
    "  { const left = ids.some(id => dirtyCh.has(id)), nw = performance.now(); if (left && nw - (rebuild._es || 0) < 300) { rebuild._skipSync = (rebuild._skipSync || 0) + 1; return; } rebuild._es = nw; rebuild._syncs = (rebuild._syncs || 0) + 1; }\n" + s.slice(j); }
one("if (c !== lc) { lc = c; if ([...dirtyCh].length) rebuild(8); }","if (c !== lc) { lc = c; if (dirtyCh.size) rebuild(8); }");
one('<!-- glencraft-build: b1217-v1.2.17 -->','<!-- glencraft-build: b1218-v1.2.18 -->');
one("const GAME_VERSION = '1.2.17';","const GAME_VERSION = '1.2.18';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.18',d:'2026-11-07',notes:['Less work while walking: the game no longer rechecks every unbuilt part of the map each frame, and it gathers torches, chests and doors once a new area is built instead of after every single chunk.']})+',');
fs.writeFileSync(out,s);console.log(crypto.createHash('sha256').update(s).digest('hex'));
