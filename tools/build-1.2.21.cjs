#!/usr/bin/env node
'use strict';
// v1.2.21: time box cabin fixes on top of v1.2.20. Usage: node tools/build-1.2.21.cjs out.html
// Causes found: (1) while you are inside, GLX-TBOX2 makes solid() report empty space in the whole room circle, which also covers the box shell,
// so the flight collision test never saw terrain: the box flew straight into hills and rock and the cabin filled with blocks (the cannot see
// state). (2) moves were applied in one jump per frame (up to 40+ blocks at top speed). (3) the walking head bob and step dip read the box
// speed as running. (4) the cockpit parts, wall finish and screen were only made after you first stepped inside.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1221-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.20.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
// (1) collision sees the real world
one("if (T.inside && S.on) { const dx = x + 0.5 - S.x","if (T.inside && S.on && !T.__raw) { const dx = x + 0.5 - S.x");
one("const blocked = (x, y, z) => { for (const [ox, oz] of [[-HW, -HW], [HW, -HW], [-HW, HW], [HW, HW], [0, 0]]) for (const oy of [0.1, 1.3, 2.5]) if (solid(Math.floor(x + ox), Math.floor(y + oy), Math.floor(z + oz))) return true; return false; };",
 "const blocked = (x, y, z) => { T.__raw = 1; try { for (const [ox, oz] of [[-HW, -HW], [HW, -HW], [-HW, HW], [HW, HW], [0, 0]]) for (const oy of [0.1, 1.3, 2.5]) if (solid(Math.floor(x + ox), Math.floor(y + oy), Math.floor(z + oz))) return true; } finally { T.__raw = 0; } return false; };");
// (2) sub-steps of at most 1 block
one("let nx = S.x + U.v[0] * dt, ny = S.y + U.v[1] * dt, nz = S.z + U.v[2] * dt;\n    if (window.__ukb && __ukb.wall(nx, ny + 1, nz)) { nx = S.x; nz = S.z; U.v[0] = U.v[2] = 0; }\n    if (blocked(nx, S.y, S.z)) { nx = S.x; U.v[0] = 0; } if (blocked(nx, S.y, nz)) { nz = S.z; U.v[2] = 0; } if (blocked(nx, ny, nz)) { if (U.v[1] < -6) thump(); ny = S.y; U.v[1] = 0; }\n    ",
 "let nx = S.x, ny = S.y, nz = S.z; { const ddx = U.v[0] * dt, ddy = U.v[1] * dt, ddz = U.v[2] * dt, n = Math.min(64, Math.max(1, Math.ceil(Math.max(Math.abs(ddx), Math.abs(ddy), Math.abs(ddz)) / 1.0))); U.subs = n;\n      for (let k = 0; k < n; k++) { const ax = nx + ddx / n, ay = ny + ddy / n, az = nz + ddz / n;\n        if (window.__ukb && __ukb.wall(ax, ay + 1, az)) { U.v[0] = U.v[2] = 0; break; }\n        if (U.v[0] && blocked(ax, ny, nz)) U.v[0] = 0; else if (U.v[0]) nx = ax; if (U.v[2] && blocked(nx, ny, az)) U.v[2] = 0; else if (U.v[2]) nz = az; if (U.v[1] && blocked(nx, ay, nz)) { if (U.v[1] < -6) thump(); U.v[1] = 0; } else if (U.v[1]) ny = ay; } }\n    ");
// (4) parts made as soon as the box exists, so the doorway shows the finished room before you step in
one("if (T.inside) build();","build();");
one("if (!room || !T.inside) return;","if (!room) return;");
one("if (!inR && s === scene && c === camera && T.inside) { inR = 1; try { if (!rt) build(); shoot(renderer); }","if (!inR && s === scene && c === camera && (T.inside || (S.on && T.door > 0.02))) { inR = 1; try { if (!rt) build(); if (T.inside) shoot(renderer); }");
// pilot layout: seat on the door side of the console facing it, big screen on the console, T grip stick between you and the screen
one("rel = U.pilot ? [0, 0, CZ - 1.6] : null;","rel = U.pilot ? [0, 0, CZ + 2.0] : null;");
one("new THREE.BoxGeometry(1.3, 0.78, 0.06)","new THREE.BoxGeometry(2.08, 1.2, 0.07)");
one("new THREE.PlaneGeometry(1.22, 0.686)","new THREE.PlaneGeometry(1.96, 1.1)");
one("new THREE.BoxGeometry(0.1, 1.25, 0.1), fm); st.position.y = -0.95;","new THREE.BoxGeometry(0.12, 0.5, 0.12), fm); st.position.y = -0.8; g.rotation.x = -0.12;");
one("U.SEAT = [0, 0, CZ - 1.6];\n    g.position.set(0, 1.62, CZ - 3.1);","U.SEAT = [0, 0, CZ + 2.0];\n    g.position.set(0, 1.78, CZ + 0.85);");
one("sg.position.set(0.42, 0.55, CZ - 2.05);","sg.position.set(0, 0.55, CZ + 1.5);");
// v1.2.10 single hand replaced by the two hand grip below; the stick parts are shared with it
one("U.lean = [0, 0];","U.lean = [0, 0]; U.parts = () => ({stick, knob});");
one("U.pinned = () => {","U.pinned = () => false; U.pinned0 = () => {");
// t915u part 2: first person hands (GLX-FPA). Causes: the hand was turned by an Euler clamp in arm space that flips near its limits (the
// spazz) and bends the hand away from the forearm (the wrist break); the forearm ended thicker than the wrist (ring gap); the pistol
// fingers curled deeper than the grip is thick; the rifle support hand sat 3 cm under the barrel so its fingers closed on air; tools were
// held at the item origin, which is the top of the handle for axes and picks. Item sizes, recoil, reload and swing are unchanged.
one("try { const e = new THREE.Euler().setFromQuaternion(p.h.quaternion, 'YXZ'); e.x = Math.max(-1.15, Math.min(1.0, e.x)); e.z = Math.max(-0.85, Math.min(0.85, e.z)); p.h.quaternion.setFromEuler(e); } catch (_) {} }",
 "try { const hq = p.h.quaternion; if (!isFinite(hq.x + hq.y + hq.z + hq.w)) hq.copy(p.fo.quaternion); const fdw = V3(0, 1, 0).applyQuaternion(p.fo.quaternion), hy = V3(0, 1, 0).applyQuaternion(hq), ang = Math.acos(Math.max(-1, Math.min(1, fdw.dot(hy)))), MX = 0.9;\n      if (ang > MX) { const r = new THREE.Quaternion().setFromUnitVectors(hy, fdw); hq.premultiply(new THREE.Quaternion().slerp(r, (ang - MX) / ang)); } U.wrist = Math.min(ang, MX); } catch (_) {} }");
one("const up = limb(0.078, 0.066, LU, shirtM); a.add(up); const el = ball(0.066, shirtM); a.add(el); const fo = limb(0.06, 0.042, LF, skinM); a.add(fo);",
 "const up = limb(0.07, 0.06, LU, shirtM); a.add(up); const el = ball(0.06, shirtM); a.add(el); const fo = limb(0.054, 0.036, LF, skinM); a.add(fo);");
one("const cuff = limb(0.07, 0.066, 0.12, cuffM);","const cuff = limb(0.064, 0.06, 0.12, cuffM);");
one("const wr = limb(0.03, 0.028, 0.03, skinM, 12); wr.position.y = -0.02;","const wr = limb(0.034, 0.031, 0.045, skinM, 12); wr.position.y = -0.035; { const kn = []; for (let i = 0; i < 4; i++) { const b = ball(0.0098, skinM); b.position.set((i - 1.5) * 0.0215, 0.094, 0.006); h.add(b); kn.push(b); } h.userData.kn = kn; }");
one("function grip(G, pn, fd, c) { const z = pn.clone().normalize(), y = fd.clone().addScaledVector(z, -fd.dot(z)).normalize(), x = V3(0, 0, 0).crossVectors(y, z); O = {x, y, z, c}; return G.clone().addScaledVector(y, -0.075).addScaledVector(z, -0.032); }",
 "function grip(G, pn, fd, c, oz) { const z = pn.clone().normalize(), y = fd.clone().addScaledVector(z, -fd.dot(z)).normalize(), x = V3(0, 0, 0).crossVectors(y, z); O = {x, y, z, c}; return G.clone().addScaledVector(y, -0.075).addScaledVector(z, -(oz == null ? 0.032 : oz)); }");
one("[isP ? 0.7 : 0.95, isP ? 0.95 : 1.15, isP ? 1.0 : 1.2, isP ? 1.05 : 1.25]); OR = O;","[isP ? 0.55 : 0.95, isP ? 0.72 : 1.15, isP ? 0.76 : 1.2, isP ? 0.8 : 1.25], isP ? 0.044 : 0.032); OR = O;");
one("const c = TR.clone().lerp(mz, f); c.y -= 0.03;","const c = TR.clone().lerp(mz, f); c.y -= 0.006;");
one("if (c.distanceTo(SL) <= LU + LF - 0.01) { TL = c; break; } } if (!TL) { TL = TR.clone().lerp(mz, 0.15); TL.y -= 0.03; } }","if (c.distanceTo(SL) <= LU + LF - 0.01) { TL = c; break; } } if (!TL) { TL = TR.clone().lerp(mz, 0.15); TL.y -= 0.006; } }");
one("grip(TL, V3(0.05, 1, 0.1), V3(0.85, 0.2, 0).addScaledVector(fw, -0.25), [0.8, 0.88, 0.92, 0.98]); if (O) O.t = isP ? 0.85 : 0.7;","grip(TL, V3(0.05, 1, 0.1), V3(0.85, 0.2, 0).addScaledVector(fw, -0.25), [1.0, 1.08, 1.12, 1.18], 0.026); if (O) O.t = isP ? 0.85 : 0.95;");
one("} else if (held.children.length) { TR = local(held, V3(0, 0, 0)); TR.y -= held.children[0].userData.block ? 0.1 : 0.03; TR.z += 0.03; }",
 "} else if (held.children.length) { TR = local(held, V3(0, 0, 0)); TR.y -= held.children[0].userData.block ? 0.1 : 0.03; TR.z += 0.03;\n      try { const it = held.children[0]; if (!it.userData.block && window.__hg1221) { const h2 = __hg1221(held, it, camera); if (h2) TR = h2; } } catch (_) {} }");
s=s.replace('/* GLX-C400',fs.readFileSync(path.join(__dirname,'content-source','cabin-1221.js'),'utf8')+'\n/* GLX-C400');
one('<!-- glencraft-build: b1220-v1.2.20 -->','<!-- glencraft-build: b1221-v1.2.21 -->');
one("const GAME_VERSION = '1.2.20';","const GAME_VERSION = '1.2.21';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.21',d:'2026-11-07',notes:['Time box flying is solid now: the box can no longer fly into hills or rock at high speed (it stops at them, checked block by block), and if you ever end up outside the room or stuck in stone the game puts you back in the pilot seat or lifts the box clear.','No more bobbing while you fly: the walking head bob and step dip are off while you hold the stick.','Pilot mode: you sit facing the console with a big live screen mounted on it, both hands hold a T grip on the stick and move with it, and the HUD, your normal hand and any tool are hidden until you let go.','Looking in through the open doors now shows the finished room before you step inside.','First person hands: no more twitching or bent wrists, the wrist joins the forearm smoothly, sleeves are slimmer, pistol fingers no longer go through the grip, the rifle and musket front hand closes on the barrel, and axes, picks and other tools are held lower on the handle. Fingers have knuckles.']})+',');
fs.writeFileSync(out,s);console.log(crypto.createHash('sha256').update(s).digest('hex'));
