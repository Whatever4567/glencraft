#!/usr/bin/env node
'use strict';
// v1.2.17: four open deep layers on top of v1.2.16. Usage: node tools/build-1.2.17.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1217-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.16.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
const mod=fs.readFileSync(path.join(__dirname,'content-source/layers-1217.js'),'utf8');new vm.Script(mod);
one('/* GLX-C400',mod+'\n/* GLX-C400');
one("function gen(x, y, z, d) { try { U.n++;","function gen(x, y, z, d) { try { U.n++; if (y < 0 && window.__v1217 && __v1217.on()) return __v1217.gen(x, y, z);");
one("const f = function (x, y, z) { const a = y - SEA; if (a < -40) {","const f = function (x, y, z) { const a = y - SEA; if (a < -40 || (y < 0 && window.__v1217 && __v1217.on())) {");
one("if (!DIM.cur && !cityGen && H >= 40) { U.conv = U.strata(); U.chamber(); }","if (!DIM.cur && !cityGen && H >= 40 && !window.__v1217) { U.conv = U.strata(); U.chamber(); }");
// v1.2.17 lag guard (GLX-C324): on the UK world the deep mesher kept building chunks under the old map while you walk on the surface,
// up to a 33 x 33 chunk square every 70 ms with a 14 ms budget, though those chunks sit under solid ground at y 0 and are never seen.
// Now, while you are above y 12, chunks fully inside the map footprint are not queued (nearby out-of-map ground and anything you are
// close to underground still is); the hold for the chunk under you ignores a skipped chunk; the normal desktop slice is 8 ms not 14.
one("const want = []; for (let cx = pcx - RN; cx <= pcx + RN; cx++) for (let cz = pcz - RN; cz <= pcz + RN; cz++) { const k = cx + ',' + cz; if (!meshes.has(k)","const Z0s = (typeof __XZ !== 'undefined' && __XZ) ? __XZ : 0, upS = e.flat && P.y >= 12; if (U.opW !== world) { U.opW = world; U.op.clear(); } const OPEN = (cx, cz) => { const k = cx + ',' + cz; let o = U.op.get(k); if (o === undefined) { o = false; for (let x = cx * C; x < cx * C + C && !o; x++) for (let z = cz * C; z < cz * C + C; z++) { const b = world[idx(x, 0, z)]; if (!b || b === T.WATER || b === T.LAVA) { o = true; break; } } U.op.set(k, o); } return o; }, SKIP = (cx, cz) => upS && Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz)) > 1 && cx * C >= 0 && (cx + 1) * C <= W && cz * C >= Z0s && (cz + 1) * C <= D && !OPEN(cx, cz); U.skipUp = upS; const want = []; for (let cx = pcx - RN; cx <= pcx + RN; cx++) for (let cz = pcz - RN; cz <= pcz + RN; cz++) { const k = cx + ',' + cz; if (SKIP(cx, cz)) continue; if (!meshes.has(k)");
one("U.hold = !meshes.has(mk) || near > 0;","U.hold = (!meshes.has(mk) && !SKIP(pcx, pcz)) || near > 0;");
one("bud = U.hold ? (PH ? 10 : 14) : e.flat ? (PH ? 6 : 14) : (PH ? 5 : 8);","bud = U.hold ? (PH ? 10 : 14) : e.flat ? (PH ? 6 : 8) : (PH ? 5 : 8);");
// v1.2.17 chest world textures: the v1.2.6 chest painter was inserted just BEFORE the const TEX object, so its TEX.chest_* lines hit the
// temporal dead zone and threw (caught): the world, hand and drop chest kept the old pictures. Apply them right after TEX is defined.
one('"};\nconst $ = id => document.getElementById(id);','"};\ntry { if (window.__v126c) { TEX.chest_front = __v126c.front; TEX.chest_top = __v126c.top; TEX.chest_side = __v126c.side; window.__v1217tex = 1; } } catch (e) { window.__v1217texErr = String(e); }\nconst $ = id => document.getElementById(id);');
// the surface skip keeps any chunk whose y 0 layer has an opening (air, water or lava: a dug hole, a cave shaft, a spiral stair entrance),
// plus the 3 x 3 chunks round you. Openings are found once per chunk (256 cells at y 0) and cached; a block change at y 0 or 1 forgets
// that chunk's answer and marks it for redraw, and a new world clears the cache.
one("U.dirty = new Set(); const eB = {k: null, v: null, m: null};","U.dirty = new Set(); U.op = new Map(); const eB = {k: null, v: null, m: null};");
one("if (y >= 0 && y <= 1) { const t = '|' + Math.floor(x / C)","if (y >= 0 && y <= 1) { try { const ck = Math.floor(x / C) + ',' + Math.floor(z / C); U.op.delete(ck); U.dirty.add(ck); } catch (_) {} const t = '|' + Math.floor(x / C)");
one('<!-- glencraft-build: b1216-v1.2.16 -->','<!-- glencraft-build: b1217-v1.2.17 -->');
one("const GAME_VERSION = '1.2.16';","const GAME_VERSION = '1.2.17';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.17',d:'2026-11-07',notes:['New UK worlds: the ground now goes down to unbreakable bedrock at y -237, with normal caves down to y 0 and four big open cave layers below.','Layer 1 is green nature caves with grass, moss and mushroom trees. Layer 2 is deep blue caves with water pools and soft dripping sounds. Layer 3 is crystal geode caves. Layer 4 is the tallest, a fire layer with basalt columns, lava lakes and the Watcher eye shrine.','Old Watcher brick spiral stairs lead down through every layer.','The stacked bands of new blocks near the bottom of the island are gone from new worlds.','Fixed: chests in the world now use the new chest textures, and the new chest icon and other new item icons no longer change back to the old ones after a few minutes.','Less work while walking on the surface: the game no longer builds hidden underground chunks under the map while you are above ground.','Older worlds keep their own underground.']})+',');
fs.writeFileSync(out,s);console.log(crypto.createHash('sha256').update(s).digest('hex'));
