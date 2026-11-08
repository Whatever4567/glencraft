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
// ---- thinner first person hands (v1.2.29 candidate): slimmer palm and wrist, slimmer finger and thumb segments; joints, finger spacing and grip points unchanged
one("new THREE.BoxGeometry(0.075, 0.095, 0.03, 3, 3, 2), skinM)","new THREE.BoxGeometry(0.07, 0.095, 0.024, 3, 3, 2), skinM)");
one("const a = limb(0.0085, 0.0075, 0.036, skinM, 8)","const a = limb(0.0074, 0.0066, 0.036, skinM, 10)");
one("const b = limb(0.0075, 0.007, 0.017, skinM, 8); k.add(b); k.add(ball(0.0074, skinM));","const b = limb(0.0066, 0.0062, 0.017, skinM, 10); k.add(b); k.add(ball(0.0065, skinM));");
one("dj.add(ball(0.007, skinM)); dj.add(limb(0.007, 0.0062, 0.013, skinM, 8)); const tip = ball(0.0063, skinM);","dj.add(ball(0.0062, skinM)); dj.add(limb(0.0062, 0.0054, 0.013, skinM, 10)); const tip = ball(0.0055, skinM);");
one("const b = ball(0.0098, skinM); b.position.set((i - 1.5) * 0.0215, 0.094, 0.006);","const b = ball(0.0086, skinM); b.position.set((i - 1.5) * 0.0215, 0.094, 0.006);");
one("th.add(limb(0.01, 0.008, 0.05, skinM, 8))","th.add(limb(0.0088, 0.0072, 0.05, skinM, 10))");
one("const wr = limb(0.034, 0.031, 0.045, skinM, 12)","const wr = limb(0.031, 0.028, 0.045, skinM, 12)");
// ---- face shape (v1.2.29 candidate): brow ridge, nose bridge, cheekbones, lip ridge, chin and ear folds as low relief on the skin, so the
// painted face gets real shape. Same skin material and parent, so they merge into the head mesh (no new draw calls); far away they drop out.
one("   // nose\n","   // nose\n    { const F = (geo, x, y, z, sx, sy, sz) => { const o = M(geo, skin, x, y, z, head); o.scale.set(sx, sy, sz); return o; };   /* v1.2.29: face relief */\n      F(rb(0.3, 0.03, 0.03, 0.012), 0, 0.312, 0.208, 1, 1, 1);   // brow ridge\n      F(rb(0.034, 0.075, 0.03, 0.013), 0, 0.268, 0.212, 1, 1, 1);   // nose bridge\n      for (const sx of [-1, 1]) { F(new THREE.SphereGeometry(0.045, 16, 10), sx * 0.125, 0.2, 0.205, 1.25, 0.65, 0.32);   // cheekbones\n        F(new THREE.SphereGeometry(0.03, 12, 8), sx * 0.1, 0.235, 0.214, 1.4, 0.35, 0.2);   // under eye\n        F(new THREE.TorusGeometry(0.018, 0.005, 6, 12, Math.PI * 1.3), sx * 0.243, 0.24, 0.004, 1, 1, 1).rotation.y = sx * Math.PI / 2; }   // ear fold\n      F(new THREE.SphereGeometry(0.05, 16, 8), 0, 0.118, 0.21, 1.15, 0.22, 0.28);   // lip ridge\n      F(new THREE.SphereGeometry(0.055, 16, 10), 0, 0.06, 0.205, 1.25, 0.6, 0.35); }   // chin\n");
fs.writeFileSync(out,s);
