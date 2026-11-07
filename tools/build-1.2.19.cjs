#!/usr/bin/env node
'use strict';
// v1.2.19: fast flight chunk unloading on top of v1.2.18. Usage: node tools/build-1.2.19.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1219-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.18.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
// v1.2.19 fast flight: (1) every 700 ms the surface pass unloaded EVERY chunk past R + 1.5 in one go (remove + dispose geometry), so
// flying fast across the map dumped a whole band of chunks in a single frame. Now unloading keeps a wider margin (R + 2.5, so edge
// chunks do not flip-flop) and works in slices of about 2 ms, farthest first, checked every 250 ms (sooner while a backlog remains).
// (2) the nearby dirty list was made by copying and filtering the whole dirty set (thousands of far map chunks) every frame something
// was due; now it only looks at the chunk squares within view distance and asks the dirty set about each one (same list, same order).
one("  if (now - streamT > 700) {\n    streamT = now;\n    for (const [id, g] of chunkObjs) if (dist(id) > R + 1.5) {\n      blockGroup.remove(g); g.children.forEach(c => { if (c.isInstancedMesh) c.dispose(); else if (c.geometry) c.geometry.dispose(); });\n      chunkObjs.delete(id); chunkLists.delete(id); dirtyCh.add(id); rebuild._unloaded = true;\n    }\n  }",
"  if (now - streamT > 250) {\n    streamT = now; const far = []; for (const id of chunkObjs.keys()) { const dd = dist(id); if (dd > R + 2.5) far.push([dd, id]); }\n    if (far.length) { far.sort((a, b) => b[0] - a[0]); const tU = performance.now(); let nU = 0;\n      for (const [, id] of far) { const g = chunkObjs.get(id); if (!g) continue; blockGroup.remove(g); g.children.forEach(c => { if (c.isInstancedMesh) c.dispose(); else if (c.geometry) c.geometry.dispose(); });\n        chunkObjs.delete(id); chunkLists.delete(id); dirtyCh.add(id); rebuild._unloaded = true; nU++; if (performance.now() - tU > 2) break; }\n      rebuild._unl = (rebuild._unl || 0) + nU; if (nU < far.length) streamT = now - 250; }\n  }");
one("  let ids = [...dirtyCh].filter(id => dist(id) <= R);","  let ids = []; { const x0 = Math.max(0, Math.floor(pcx - R)), x1 = Math.min(ncx - 1, Math.ceil(pcx + R)), z0 = Math.max(0, Math.floor(pcz - R)), z1 = Math.min(ncz - 1, Math.ceil(pcz + R));\n    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) { const id = cx * 64 + cz; if (dirtyCh.has(id) && dist(id) <= R) ids.push(id); }\n    if (dirtyCh.size < 64) ids = [...dirtyCh].filter(id => dist(id) <= R); }");
one('<!-- glencraft-build: b1218-v1.2.18 -->','<!-- glencraft-build: b1219-v1.2.19 -->');
one("const GAME_VERSION = '1.2.18';","const GAME_VERSION = '1.2.19';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.19',d:'2026-11-07',notes:['Smoother fast flying: far away parts of the map are now cleared a little at a time instead of all at once, and the game looks only at nearby ground when deciding what to build next.']})+',');
fs.writeFileSync(out,s);console.log(crypto.createHash('sha256').update(s).digest('hex'));
