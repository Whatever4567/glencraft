#!/usr/bin/env node
'use strict';
// v1.2.27 (local, unreleased) on top of v1.2.26 (the released Agartha residents fix, kept as is): the detailed third person player (GLX-TP-HD build replaced, same rig). Usage: node tools/build-1.2.27.cjs out.html
// Version labels stay 1.2.26 until a release is asked for.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1227-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.26.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
// the TP-HD build() function, start to end, swapped for the detailed one
{const A='  function build(pbr) { try { playerTextures(); } catch (_) {} const T_ = texs(), g = new THREE.Group(); LODS = [];',E='    U.built++; return g; }\n';
 const a=s.indexOf(A);if(a<0||s.indexOf(A,a+1)>=0)throw Error('tp-hd build');const b=s.indexOf(E,a)+E.length;if(b<E.length)throw Error('tp-hd end');
 s=s.slice(0,a)+fs.readFileSync(path.join(__dirname,'content-source','player-detail-1226.js'),'utf8')+s.slice(b);}
// sharper cloth, knit, hair and new sporran fur and tartan weave textures (512, made once and shared by every player model)
one("      hair: tex((g, s) => { g.fillStyle = '#4a2f1c';","      ...(function () { const X = {}; /* v1.2.26 */\n"+
"        X.linen = tex((g, s) => { g.fillStyle = '#eee6d6'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 2) { g.fillStyle = y % 4 ? 'rgba(170,155,130,.14)' : 'rgba(255,255,255,.18)'; g.fillRect(0, y, s, 1); } for (let x = 0; x < s; x += 2) { g.fillStyle = x % 4 ? 'rgba(170,155,130,.1)' : 'rgba(255,255,255,.12)'; g.fillRect(x, 0, 1, s); } for (let i = 0; i < 18; i++) { g.strokeStyle = 'rgba(140,120,90,.13)'; g.lineWidth = 4; g.beginPath(); const x = Math.random() * s; g.moveTo(x, 0); g.bezierCurveTo(x + 30, s / 3, x - 30, s * 2 / 3, x + 14, s); g.stroke(); } }, 512);\n"+
"        X.leather = tex((g, s) => { g.fillStyle = '#4a2e1b'; g.fillRect(0, 0, s, s); for (let i = 0; i < 9000; i++) { const v = Math.random(); g.fillStyle = `rgba(${20 + v * 60 | 0},${12 + v * 34 | 0},8,.3)`; g.beginPath(); g.arc(Math.random() * s, Math.random() * s, 0.6 + Math.random() * 1.6, 0, 6.3); g.fill(); } g.strokeStyle = 'rgba(220,190,140,.45)'; g.setLineDash([6, 5]); g.lineWidth = 2; for (const y of [10, s - 10]) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); } g.setLineDash([]); }, 512);\n"+
"        X.sock = tex((g, s) => { g.fillStyle = '#e6decb'; g.fillRect(0, 0, s, s); for (let x = 0; x < s; x += 8) { g.fillStyle = 'rgba(150,140,120,.32)'; g.fillRect(x, 0, 3, s); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 4, 0, 2, s); } for (let y = 0; y < s; y += 4) { g.fillStyle = 'rgba(120,110,90,.08)'; g.fillRect(0, y, s, 1); } }, 512);\n"+
"        X.weave = tex((g, s) => { g.fillStyle = '#808080'; g.fillRect(0, 0, s, s); for (let y = 0; y < s; y += 4) for (let x = 0; x < s; x += 4) { g.fillStyle = ((x + y) / 4) % 2 ? '#a0a0a0' : '#606060'; g.fillRect(x, y, 4, 2); } }, 256);\n"+
"        X.fur = tex((g, s) => { g.fillStyle = '#d9cfbd'; g.fillRect(0, 0, s, s); for (let i = 0; i < 2600; i++) { const v = 150 + Math.random() * 100 | 0; g.strokeStyle = `rgba(${v},${v - 10},${v - 30},.5)`; g.beginPath(); const x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); g.lineTo(x + Math.random() * 3 - 1.5, y + 6 + Math.random() * 8); g.stroke(); } }, 256);\n"+
"        return X; })(),\n      hair: tex((g, s) => { g.fillStyle = '#4a2f1c';");
// the old linen / leather / sock 256 textures above are now not made at all (the 512 ones replace them)
one("      linen: tex((g, s) => { g.fillStyle = '#eee6d6';","      linen0: null && tex((g, s) => { g.fillStyle = '#eee6d6';");
one("      leather: tex((g, s) => { g.fillStyle = '#4a2e1b';","      leather0: null && tex((g, s) => { g.fillStyle = '#4a2e1b';");
one("      sock: tex((g, s) => { g.fillStyle = '#e6decb';","      sock0: null && tex((g, s) => { g.fillStyle = '#e6decb';");
// ---- weapon switch: a gun model that failed to load once was never asked for again, and the viewmodel hid the gun until it arrived,
// so after one failed download that gun stayed invisible every time you switched to it. Now a failed load is retried with a growing wait
// (2, 4, 8 .. 30 s), and while a gun has failed at least once its plain built in model is shown instead of nothing.
one(".then(g => { const r = g.scene; r.traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; const m = o.material; if (m && m.map) m.map.anisotropy = 4;",".then(g => { const r = g.scene; U.fail[n] = 0; r.traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; const m = o.material; if (m && m.map) m.map.anisotropy = 4;");
one("MOD[n] = r; U.ok[n] = 1; }).catch(e => { ERR('load ' + n, e); }); }","MOD[n] = r; U.ok[n] = 1; }).catch(e => { ERR('load ' + n, e); U.fail[n] = (U.fail[n] || 0) + 1; U.next[n] = performance.now() + Math.min(30, Math.pow(2, U.fail[n])) * 1000; want[n] = 0; }); }   /* v1.2.26: retried, not given up */");
one("function load(n) { if (want[n]) return; want[n] = 1;","function load(n) { if (want[n] || MOD[n] || (U.next[n] && performance.now() < U.next[n])) return; want[n] = 1;");
one("const U = window.__c322 = {err: null, ok: {}, swapped: 0, buf: {}, played: 0, res: ''};","const U = window.__c322 = {err: null, ok: {}, swapped: 0, buf: {}, played: 0, res: '', fail: {}, next: {}};");
one("if (!u.c322) { g.visible = false; U.hidden++; return; }   // real model not in yet: show nothing rather than the old gun","if (!u.c322) { const fl = window.__c322 && __c322.fail && __c322.fail[u.gun === IT.PISTOL ? 'pistol' : 'rifle']; if (fl) { g.visible = true; U.fallback = (U.fallback || 0) + 1; try { __c322.load(u.gun === IT.PISTOL ? 'pistol' : 'rifle'); } catch (_) {} return; } g.visible = false; U.hidden++; return; }   // real model not in yet: show nothing rather than the old gun (v1.2.26: unless its download failed, then the built in gun)");
fs.writeFileSync(out,s);
