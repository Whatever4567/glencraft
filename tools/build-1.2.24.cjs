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
one('/* GLX-GRIP1222',fs.readFileSync(path.join(__dirname,'content-source','keep-1224.js'),'utf8')+'\n/* GLX-GRIP1222');   // old c307 save data kept, inert
REMOVED.C307=cutBlock('C307');     // the north extension: flat ice zone, its chunks, save field, edge push, hooks into generate / enterWorld / serialize
REMOVED.C307b=cutBlock('C307b');   // its chunk drawing
// GLX-C294: the old separate Agartha world entry (walk into the ice wall mouth -> enterDim('agartha')) and the extension carver genExt
{const a=s.indexOf('  // walking into the back of the mouth (the map edge)'),b=s.indexOf("}, 250);\n",a)+9;if(a<0||b<9)throw Error('c294 entry');REMOVED.c294entry=b-a;s=s.slice(0,a)+'  /* v1.2.24: the old tunnel entry into the separate Agartha world is removed; Agartha is under Scotland (GLX-AGU). The mouth record (GLX-V1214 and the Watcher bowl keep out) now only comes from an old save (c294 v3). */\n'+s.slice(b);}
{const a=s.indexOf('  // v1.1.17: Agartha in the SAME world - GLX-C307 swaps in a zone array'),b=s.indexOf('  U.genExt = genExt;\n',a)+'  U.genExt = genExt;\n'.length;if(a<0||b<30)throw Error('genExt');REMOVED.genExt=b-a;s=s.slice(0,a)+s.slice(b);}

// ---- v1.2.24 checkpoint: the original Highlands ice wall and the old Agartha tunnel mouth carving, removed from the shipped source ----
const cut=(k,a0,b0,rep)=>{const a=s.indexOf(a0);if(a<0||s.indexOf(a0,a+1)>=0)throw Error('cut start '+k);const b=s.indexOf(b0,a);if(b<0)throw Error('cut end '+k);const e=b+b0.length;REMOVED[k]=(REMOVED[k]||0)+e-a-rep.length;s=s.slice(0,a)+rep+s.slice(e);};
// GLX-C273: wall() (the snow staircase round the map edge and its snow capped land), wallFn, wallTop, the (already empty) ice cladding mesh and
// its 1 s poll, and the generate hook that ran wall(). Kept: edgeQ / RE / WS / at / MT / volc (the shared map shape other blocks read) and the
// 250 ms world bounds clamp (the current map bounds, not the wall).
cut('C273wall','  // ---------- after generation: the ice wall ----------\n',"} catch (e) { ERR('gen', e); } return r; };\n",
  "  U.WS = 40;   /* v1.2.24: the ice wall builder is removed; WS stays as the old edge band width the shared shape helpers use */\n  const gen = generate; generate = function () { CAS = null; return gen.apply(this, arguments); };\n");
// GLX-C282: the icy wall tint in the block shader, the frost overlay and the (switched off) edge freeze. Kept: the w92 save flag and the
// YEAR 24000 silver block shading (uFut) that shares the shader patch.
one("'uniform vec4 uIce; uniform float uFut; varying vec3 vIceW;","'uniform float uFut; varying vec3 vIceW;");
cut('C282tint',"      'if (uIce.w > 0.5) { vec2 dI","gl_FragColor.rgb = mix(gl_FragColor.rgb, iI, 0.62 * kI); } }\\n' +\n","");
one("m.uniforms.uIce = uIce; m.uniforms.uFut = uFut; m.__c282 = 1;","m.uniforms.uFut = uFut; m.__c282 = 1;");
one("const uIce = {value: new THREE.Vector4(0, 0, 0, 0)}, uFut = U.uFut","const uFut = U.uFut");
cut('C282freeze','  // ---- frost overlay ----\n',"} catch (e) { U.err = String(e && e.message || e); } }, 200);\n","  setInterval(() => { try { patch(); } catch (e) { U.err = String(e && e.message || e); } }, 200);   /* v1.2.24: icy wall tint, frost overlay and edge freeze removed */\n");
// GLX-C324: the clip box for that icy tint
cut('C324tint','  // the icy edge tint (for the old ice wall round the map)',"} catch (e) { ERR('ice', e); } }, 1000);\n","");
// GLX-C341: clearWall (returned 0 whenever GLX-C341 itself is loaded, i.e. always) with its 1 s poll, and the wallTop override
cut('C341clear','  // ---------- 2. the old ice wall goes ----------\n',"try { const A = window.__c273; if (A && A.wallTop) A.wallTop = () => SEA - 4; } catch (_) {}\n","");
// GLX-C294: mouth() / carveMouth() (the hole in the ice wall behind Blackstone Castle). build() only ever reached them when the GLX-C317 flag
// was off on a W >= 600 home world, which cannot happen (that flag is on for every such world), so no current world was carved. Kept: WP,
// the restored record only mouth metadata (save.c294 v3 -> __c294.M) GLX-V1214 and the Watcher keep out read, ball / dress / clearLane / tree for genAg.
cut('C294mouth','  // ---------- overworld: the mouth in the ice wall behind Blackstone Castle ----------\n','  // the saucer flies this lane','  const WP = (M, d, a) => M.e === \'N\' ? [M.c + a, d] : M.e === \'S\' ? [M.c + a, D - 1 - d] : M.e === \'W\' ? [d, M.c + a] : [W - 1 - d, M.c + a];   /* v1.2.24: mouth() / carveMouth() removed; WP reads the saved mouth record */\n  // the saucer flies this lane');
{const a="  const big = () => { try { return !!(window.__c317 && __c317.on()); } catch (_) { return false; } };",b="U.ms = Math.round(performance.now() - t); }\n";const i=s.indexOf(a),j=s.indexOf(b,i)+b.length;if(i<0||s.indexOf(a,i+1)>=0||j<b.length)throw Error('c294 build');const r="  function build() { U.M = null; U.Lw = null; }   /* v1.2.24: a new world gets no mouth (it never did on a W >= 600 home world) */\n";REMOVED.C294build=j-i-r.length;s=s.slice(0,i)+r+s.slice(j);}
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({"v": "v1.2.24", "d": "2026-11-08", "notes": ["New setting: Disable foliage (Settings). It hides grass tufts, flowers, saplings, leaf blocks and other small plants everywhere, and turning it off brings them all back at once. Not covered yet: logs and wood, grass block ground, fire, cobwebs and far away low detail terrain. Plant items you hold or drop stay visible.", "Time box: jetpack or creative flight inside the room can no longer lift you up through the ceiling and out of the box. This is a partial fix for the time box flight glitch; other flight glitches may still need work.", "Time box screen no longer flashes brown squares (it sat exactly on its frame).", "Ragdolls rest on the ground they fall on instead of a fixed floor height.", "Space is quiet: birds, wind, nature music, rain, thunder and the snow hush stop above the space line and come back when you return.", "The old ice wall round the map edge and the old tunnel into the separate Agartha world are retired. Agartha is reached as before through the Teleport menu and the pyramid. No invisible old ice blocks north of the map any more.", "Below the bedrock there is now an empty void instead of old caves.", "Saves are kept: old worlds load with all your builds, and data from the retired north ice area is stored unchanged in your save."]})+',');
console.error('removed bytes',JSON.stringify(REMOVED),Object.values(REMOVED).reduce((x,y)=>x+y,0));
fs.writeFileSync(out,s);
