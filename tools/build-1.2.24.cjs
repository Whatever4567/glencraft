#!/usr/bin/env node
'use strict';
// v1.2.24 (local candidate, unpublished) on top of v1.2.23: stability. Usage: node tools/build-1.2.24.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1224-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.23.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
// time box screen: the picture plane sat exactly on the front face of its brown frame box (both at z 0.035), so they z-fought and the
// screen flashed brown squares; the plane now sits 4 mm in front and wins the depth test
one("scr.position.z = 0.035; g.add(scr);","scr.position.z = 0.039; sm.polygonOffset = true; sm.polygonOffsetFactor = -1; sm.polygonOffsetUnits = -2; g.add(scr); /* v1.2.24: off the frame face (it z-fought, flashing brown) */");
one('/* GLX-GRIP1222',fs.readFileSync(path.join(__dirname,'content-source','foliage-1224.js'),'utf8')+'\n/* GLX-GRIP1222');
one("const GAME_VERSION = '1.2.23';","const GAME_VERSION = '1.2.24';");
one('<!-- glencraft-build: b1223-v1.2.23 -->','<!-- glencraft-build: b1224-v1.2.24 -->');
// time box room ceiling: walls() held you inside the round room sideways and above the floor but had no top, so a jetpack or creative
// flight carried you up through the 8.8 high room and out of the box (then you fell back in). Now the head stops under the ceiling.
one("if (P.y < S.y) { P.y = S.y; if (P.vy < 0) P.vy = 0; } return; }","if (P.y < S.y) { P.y = S.y; if (P.vy < 0) P.vy = 0; } if (P.y > S.y + (T.RH || 8.8) - 1.8) { P.y = S.y + (T.RH || 8.8) - 1.8; if (P.vy > 0) P.vy = 0; } return; }   /* v1.2.24: room ceiling */");
// space is silent (user: nature sounds in deep space): one vacuum test, used by each nature sound owner
one('/* GLX-GRIP1222',fs.readFileSync(path.join(__dirname,'content-source','vac-1224.js'),'utf8')+'\n/* GLX-GRIP1222');
one("const outdoor = dim && !U.enc ? 1","const outdoor = (window.__vac && __vac()) ? 0 : dim && !U.enc ? 1");
one("function duck() { try { if (window.__c259 && __c259.on) return 0;","function duck() { try { if (window.__vac && __vac()) return 0; if (window.__c259 && __c259.on) return 0;");
one("const w = hid || pz ? 0 : U.RB_LEVEL;","const w = hid || pz || (window.__vac && __vac()) ? 0 : U.RB_LEVEL;");
one("U.thunder = vol => { if (!U.bus()","U.thunder = vol => { if (window.__vac && __vac()) { U.vacSkip = (U.vacSkip || 0) + 1; return true; } if (!U.bus()");
one("h.gain.setTargetAtTime(tgt, AC.currentTime, 0.6);","h.gain.setTargetAtTime((window.__vac && __vac()) ? 0 : tgt, AC.currentTime, 0.6);");
// below bedrock is an empty void (user): bedrock y -237 (GLX-V1217 BOT) to -240 stays solid, nothing is generated under it. Old saves and
// the fail closed path (GLX-DEEP old layers ran on down to the core about 1450 below the sea, with no bedrock) get the same bedrock band.
one("function gen(x, y, z, d) { try { U.n++; if (y < 0 && window.__v1217 && __v1217.on()) return __v1217.gen(x, y, z);","function gen(x, y, z, d) { try { if (y < -240) { U.voidQ = (U.voidQ || 0) + 1; return 0; } if (y < -233 && !(window.__v1217 && __v1217.on())) return T.BEDROCK || T.HBEDROCK || 211;   /* v1.2.24: void under the bedrock */ U.n++; if (y < 0 && window.__v1217 && __v1217.on()) return __v1217.gen(x, y, z);");
// ---- source removal (user: old tunnel Agartha, its ice map and north extension gone completely) ----
// cut a whole GLX block (from its marker to the next block marker); every other reference to it is already guarded (window.__x && ...)
const cutBlock=k=>{const a=s.indexOf('/* GLX-'+k+' ');if(a<0||s.indexOf('/* GLX-'+k+' ',a+1)>=0)throw Error('block '+k);const b=s.indexOf('/* GLX-',a+8);const n=b-a;s=s.slice(0,a)+'/* v1.2.24: GLX-'+k+' removed (obsolete) */\n'+s.slice(b);return n;};
const REMOVED={};
REMOVED.C307=cutBlock('C307');     // the north extension: flat ice zone, its chunks, save field, edge push, hooks into generate / enterWorld / serialize
REMOVED.C307b=cutBlock('C307b');   // its chunk drawing
// GLX-C294: the old separate Agartha world entry (walk into the ice wall mouth -> enterDim('agartha')) and the extension carver genExt
{const a=s.indexOf('  // walking into the back of the mouth (the map edge)'),b=s.indexOf("}, 250);\n",a)+9;if(a<0||b<9)throw Error('c294 entry');REMOVED.c294entry=b-a;s=s.slice(0,a)+'  /* v1.2.24: the old tunnel entry into the separate Agartha world is removed; Agartha is under Scotland (GLX-AGU). Kept from the removed GLX-C307: a NEW world whose flag turned on after generate still gets its mouth record once (GLX-V1214 and the Watcher bowl use it as the Agartha keep out). */\n  let fresh7 = false; try { const g7 = generate; generate = function () { fresh7 = true; return g7.apply(this, arguments); }; const e7 = enterWorld; enterWorld = function (save) { fresh7 = !save || !!(save && save.tpl); return e7.apply(this, arguments); }; } catch (e) { ERR(\'f7\', e); }\n  setInterval(() => { try { if (!fresh7 || U.M || !started || DIM.cur || W < 600 || !on()) return; fresh7 = false; build(); } catch (e) { ERR(\'ens\', e); } }, 1000);\n'+s.slice(b);}
{const a=s.indexOf('  // v1.1.17: Agartha in the SAME world - GLX-C307 swaps in a zone array'),b=s.indexOf('  U.genExt = genExt;\n',a)+'  U.genExt = genExt;\n'.length;if(a<0||b<30)throw Error('genExt');REMOVED.genExt=b-a;s=s.slice(0,a)+s.slice(b);}
console.error('removed bytes',JSON.stringify(REMOVED),Object.values(REMOVED).reduce((x,y)=>x+y,0));
fs.writeFileSync(out,s);
