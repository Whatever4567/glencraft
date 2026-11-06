'use strict';
// Reuse the production plain/packed mesh parity harness, adding a real extended
// diamond259 cell and distinct atlas layer17. Neither mesh implementation is mocked.
const fs=require('fs'),Module=require('module'),path=require('path');
let t=fs.readFileSync(path.join(__dirname,'cave-mesh-parity-proof.cjs'),'utf8');
t=t.replace('world=new Uint8Array(79*72*79)','world=new Uint16Array(79*72*79)')
 .replace('BLOCK_MATS[1]=',"BLOCK_MATS[259]={diamond:true};BLOCK_MATS[1]=")
 .replace('return {1:[3,3,1,2,1,1],', 'return {259:[17,17,17,17,17,17],1:[3,3,1,2,1,1],')
 .replace('put(29,23,30,4);','put(40,20,40,259);put(29,23,30,4);')
 .replace('const expected=snapshot(a,65);',"const expected=snapshot(a,65);assert.equal(a.world[(40*72+20)*79+40],259);assert(a.chunkLists.get(65)[259].length>0,'plain registry retains259');assert(expected.some(r=>r.attr.lay),'production plain atlas geometry');")
 .replace('const got=snapshot(b,65);',"const got=snapshot(b,65);assert.equal(b.world[(40*72+20)*79+40],259);assert(output.out.value.lists[259].length>0,'packed registry retains259');assert(got.some(r=>r.attr.lay),'production packed atlas geometry');");
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(t,__filename);
