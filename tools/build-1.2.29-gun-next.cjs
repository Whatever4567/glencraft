#!/usr/bin/env node
'use strict';
// Gun next (local candidate on top of v1.2.28, no version change): shot effects reuse their materials, meshes and tracer lines instead
// of making and disposing them on every shot. Usage: node tools/build-1.2.29-gun-next.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1229g-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.28.cjs'),f],{stdio:['ignore','ignore','inherit']});s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
// ---- firing hitch: every shot made new spark and dust materials, a new bullet hole material and a new tracer line (geometry and a
// cloned material) and disposed them a moment later. A material disposed while it is the only user of its shader makes the renderer
// delete that shader, so the next shot compiled it again on the main thread. Now: one cached material per spark or dust colour, pooled
// particle meshes, bullet hole materials and meshes recycled, and a small pool of tracer lines updated in place.
one("const LM = new THREE.LineBasicMaterial({color: 0xffe6a0, transparent: true, opacity: 0.9, depthWrite: false, fog: false}), lines = [];",
    "const LM = new THREE.LineBasicMaterial({color: 0xffe6a0, transparent: true, opacity: 0.9, depthWrite: false, fog: false}), lines = [], LPOOL = [];   /* v1.2.29: tracer lines reused */");
one("const L = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, e]), LM.clone()); L.frustumCulled = false; L.userData.t = 0.09; scene.add(L); lines.push(L);",
    "let L = LPOOL.pop(); if (!L) { L = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, e]), LM.clone()); L.frustumCulled = false; } else { const q = L.geometry.attributes.position; q.setXYZ(0, a.x, a.y, a.z); q.setXYZ(1, e.x, e.y, e.z); q.needsUpdate = true; L.geometry.computeBoundingSphere(); } L.userData.t = 0.09; L.material.opacity = 0.9; scene.add(L); lines.push(L);");
one("if (L.userData.t <= 0) { scene.remove(L); L.geometry.dispose(); L.material.dispose(); lines.splice(i, 1); }",
    "if (L.userData.t <= 0) { scene.remove(L); if (LPOOL.length < 8) LPOOL.push(L); else { L.geometry.dispose(); L.material.dispose(); } lines.splice(i, 1); }");
one("function spray(p, n, col, sp, up, life, size, grav, glow) { const mat = glow ? new THREE.MeshBasicMaterial({color: col, fog: false}) : new THREE.MeshLambertMaterial({color: col});",
    "const SPM = new Map(), SPOOL = [], DFREE = new Map();   /* v1.2.29: spark and dust materials per colour, particle meshes and bullet hole materials reused */\n  function spMat(col, glow) { const k = col + (glow ? 'g' : 'l'); let m = SPM.get(k); if (!m) { m = glow ? new THREE.MeshBasicMaterial({color: col, fog: false}) : new THREE.MeshLambertMaterial({color: col}); m.userData.keep = 1; SPM.set(k, m); } return m; }\n  function rel(o) { const m = o && o.material; if (!m || !m.userData || !m.userData.dk || o.children.length) return kill(o); if (o.parent) o.parent.remove(o); const L = DFREE.get(m.userData.dk) || DFREE.set(m.userData.dk, []).get(m.userData.dk); if (L.length < 80) L.push(o); }\n  function spray(p, n, col, sp, up, life, size, grav, glow) { const mat = spMat(col, glow);");
one("for (let i = 0; i < n; i++) { const m = new THREE.Mesh(BG, mat);","for (let i = 0; i < n; i++) { const m = SPOOL.pop() || new THREE.Mesh(BG, mat); m.material = mat; m.rotation.set(0, 0, 0);");
one("if (f.t > f.life) { scene.remove(f.m); if (f.last) f.mat.dispose(); fx.splice(i, 1); } }",
    "if (f.t > f.life) { scene.remove(f.m); if (f.mat && f.mat.userData && f.mat.userData.keep) { if (SPOOL.length < 160) SPOOL.push(f.m); } else if (f.last) f.mat.dispose(); fx.splice(i, 1); } }");
one("function dmat(tex, col, op) { return new THREE.MeshLambertMaterial(","function dmat(tex, col, op) { return new THREE.MeshLambertMaterial(");   // unchanged maker; recycling is in decal()
one("function decal(x, y, z, n, size, tex, col, op, life, parent) { const m = new THREE.Mesh(PG, dmat(tex, col, op));",
    "function decal(x, y, z, n, size, tex, col, op, life, parent) { const dk = (tex && tex.uuid) + '|' + col, fr = !parent && DFREE.get(dk), m = fr && fr.length ? fr.pop() : new THREE.Mesh(PG, dmat(tex, col, op)); m.material.opacity = op; if (!parent) m.material.userData.dk = dk; m.rotation.set(0, 0, 0);");
one("decals.push({m, t: 0, life, op}); while (decals.length > DCAP) kill(decals.shift().m);","decals.push({m, t: 0, life, op}); while (decals.length > DCAP) rel(decals.shift().m);");
one("if (k <= 0) { kill(d.m); decals.splice(i, 1); continue; }","if (k <= 0) { rel(d.m); decals.splice(i, 1); continue; }");
fs.writeFileSync(out,s);
