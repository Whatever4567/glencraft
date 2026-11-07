#!/usr/bin/env node
'use strict';
// v1.2.20: lighter water on top of v1.2.19. Usage: node tools/build-1.2.20.cjs out.html
// (1) ripple shader: every water pixel looped over all 8 (4 on phones) ripple slots each frame even when none was alive.
//     A uniform u41End (latest ripple end time) now skips the whole loop when no ripple is alive (same for all pixels, so no divergence).
//     Inside the loop a ring further than its own reach (k > 1.2, contribution below e^-31) is skipped before the exp math.
// (2) sky shine: pow(x, 3.0) replaced with x*x*x (same value).
// (3) flSet marked the same chunk dirty twice (markDirty(x,z) then again if y > 0); the duplicate call is removed (dirty set, same result).
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1220-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.19.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("u41Rip: {value: RIP}};","u41Rip: {value: RIP}, u41End: {value: -1}};");
one("r.set(x, z, u.u41T.value, a); U.rips++; };","r.set(x, z, u.u41T.value, a); u.u41End.value = u.u41T.value + 2.6; U.rips++; };");
one("f = 'uniform float u41T; uniform vec4 u41Rip['","f = 'uniform float u41T; uniform float u41End; uniform vec4 u41Rip['");
one(" { float rr = 0.0; for (int i = 0; i < ${NR}; i++) { vec4 q = u41Rip[i]; float age = u41T - q.z; if (age < 0.0 || age > 2.6) continue; float d = distance(v41W.xz, q.xy);\n     float k = d - age * 1.5; rr +="," if (u41T < u41End) { float rr = 0.0; for (int i = 0; i < ${NR}; i++) { vec4 q = u41Rip[i]; float age = u41T - q.z; if (age < 0.0 || age > 2.6) continue; float d = distance(v41W.xz, q.xy);\n     float k = d - age * 1.5; if (k > 1.2) continue; rr +=");
one("float fr = pow(1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), 3.0);","float fr0 = 1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), fr = fr0 * fr0 * fr0;");
one("markDirty(x, z); if (y > 0) markDirty(x, z); flQueue(x, y, z); }","markDirty(x, z); flQueue(x, y, z); }");
// t907u: (a) item id tag in slot icons for hover names, (b) hell biome name pop up removed, (c) new world first save waits 4 s after entry
one("function slotHTML(id, n) { return id ? '<div class=\"ic' + iconClass(id) + '\" style=","function slotHTML(id, n) { return id ? '<div data-gid=\"' + id + '\" class=\"ic' + iconClass(id) + '\" style=");
one("if (bi >= 0) toast(C.BIOME[bi]);","");
one("if (!save) saveWorld(true);","if (!save) { const cw = current; setTimeout(() => { try { if (started && current === cw) saveWorld(true); } catch (_) {} }, 4000); }");
s=s.replace('/* GLX-C400',fs.readFileSync(path.join(__dirname,'content-source','quiet-1220.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'content-source','tardis-1220.js'),'utf8')+'\n/* GLX-C400');
// t909u: time box pilot mode. Room radius 6.5 -> 9.2 (2x the original 4.6), a 55 inch screen on a stand in front of the pilot seat,
// Fly puts you in the pilot seat facing it; left stick moves, right stick steers and climbs, triggers up/down, LS boost, X lets go.
one('const RR = 6.5, RH = 8.8, HW = 0.85','const RR = 9.2, RH = 8.8, HW = 0.85');
one("const fr = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.0, 0.12), fm); g.add(fr); scr = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.75), sm); scr.position.z = 0.07; g.add(scr);\n    g.position.set(0, 2.35, CZ - RR + 0.45); room.add(g);",
 "const fr = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.78, 0.06), fm); g.add(fr); scr = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.686), sm); scr.position.z = 0.035; g.add(scr);\n    { const st = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.25, 0.1), fm); st.position.y = -0.95; g.add(st); } U.scr = scr; U.SEAT = [0, 0, CZ - 1.6];\n    g.position.set(0, 1.62, CZ - 3.1); room.add(g);");
one("function toggle() { if (busyT) return; U.pilot = !U.pilot; rel = U.pilot ? [P.x - S.x, P.y - S.y, P.z - S.z] : null;",
 "function toggle() { if (busyT) return; U.pilot = !U.pilot; rel = U.pilot ? [0, 0, CZ - 1.6] : null; U.Pt = 0; if (U.pilot) U._cam = [P.yaw, P.pitch]; else if (U._cam) { P.yaw = U._cam[0]; P.pitch = U._cam[1]; U._cam = null; }");
one("const LSb = bt(10), st = ax(2), f = (K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0) + tin.f + (LSb ? 1 : 0), tr = (K.KeyA ? 1 : 0) - (K.KeyD ? 1 : 0) - ax(0) + tin.t, up = (K.Space ? 1 : 0) - (K.ShiftLeft || K.ShiftRight ? 1 : 0) + bt(0) - bt(1) - ax(3) + tin.u;\n    U.inp = [st, ax(3)];",
 "const tg = i => g && g.buttons[i] ? (g.buttons[i].value || (g.buttons[i].pressed ? 1 : 0)) : 0, LSb = bt(10), lx = ax(0), ly = ax(1), rx = ax(2), ry = ax(3);\n    const st = (K.ArrowRight ? 1 : 0) - (K.ArrowLeft ? 1 : 0) + lx, f = (K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0) + tin.f - ly + (LSb ? 1 : 0), tr = (K.KeyA ? 1 : 0) - (K.KeyD ? 1 : 0) - rx + tin.t, pr = (K.ArrowUp ? 1 : 0) - (K.ArrowDown ? 1 : 0) - ry, up = (K.Space ? 1 : 0) - (K.ShiftLeft || K.ShiftRight ? 1 : 0) + bt(0) - bt(1) + (tg(7) > 0.3 ? 1 : 0) - (tg(6) > 0.3 ? 1 : 0) + tin.u;\n    U.Pt = Math.max(-1.48, Math.min(1.48, (U.Pt || 0) + pr * dt * 1.1)); U.inp = [Math.max(-1, Math.min(1, -tr)), Math.max(-1, Math.min(1, -pr))];");
one("T.place(nx, ny, nz); P.x = S.x + rel[0]; P.y = S.y + rel[1]; P.z = S.z + rel[2]; P.vy = 0; P.fallTop = null; }",
 "T.place(nx, ny, nz); P.x = S.x + rel[0]; P.y = S.y + rel[1]; P.z = S.z + rel[2]; P.vy = 0; P.fallTop = null; P.yaw = 0; P.pitch = -0.06; }");
one("if (U.pilot) { if (!T.inside || DIM.cur) toggle();","if (U.pilot) { if (!T.inside || DIM.cur || (typeof dead !== 'undefined' && dead) || !started) toggle();");
one("toast(U.pilot ? 'You have the stick. Right stick: up/down and left/right. Left stick: spin. LS: boost. X to let go (keys: W S A D, Space, Shift, G)' : 'You let go of the stick')",
 "toast(U.pilot ? 'Pilot mode. Right stick: point the box any way (turn and tilt up or down). Left stick: fly where it points and sideways. RT up, LT down, LS boost, X to let go (keys: W S fly, A D turn, arrow up and down tilt, arrow left and right sideways, Space up, Shift down, G let go)' : 'You let go of the stick')");
one("sg.position.set(0.95, 0.95, CZ + 0.85)","sg.position.set(0.42, 0.55, CZ - 2.05); { const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.55, 12), chrome); ped.position.y = -0.275; sg.add(ped); }");
// t911u: right stick turns the box (yaw and pitch, pitch held inside +-85 degrees), left stick moves along where the box points
one("tx = -Math.sin(U.H) * f * sp + Math.cos(U.H) * st * sp, tz = -Math.cos(U.H) * f * sp - Math.sin(U.H) * st * sp, ty = up * (alt > 400 ? sp * 0.6 : 10);",
 "cP = Math.cos(U.Pt || 0), sP = Math.sin(U.Pt || 0), tx = -Math.sin(U.H) * cP * f * sp + Math.cos(U.H) * st * sp, tz = -Math.cos(U.H) * cP * f * sp - Math.sin(U.H) * st * sp, ty = sP * f * sp + up * (alt > 400 ? sp * 0.6 : 10);");
one("const pitch = U.pilot ? Math.max(-0.5, Math.min(0.5, U.v[1] * 0.02)) : -0.08;","const pitch = U.pilot ? (U.Pt || 0) : -0.08;");
// t910u: controller inventory speed. Base menus: stick first step at once, repeat after 200 ms (was 300) then every 70 ms (was 90);
// d-pad now repeats while held (200 ms then 70 ms; before it moved once per press). Inventory free pointer: 1100 px/s over slots
// (was 520) and 1700 elsewhere (was 900), response curve 1.15 (was 1.6, so half tilt was very slow); the pointer follows d-pad repeats.
one("if (!dir && st) { if (st !== navDir) { dir = st; navRep = now + 300; } else if (now > navRep) { dir = st; navRep = now + 90; } }",
 "if (!dir && st) { if (st !== navDir) { dir = st; navRep = now + 200; } else if (now > navRep) { dir = st; navRep = now + 70; } }\n  { const pb = i => !!(gp && gp.buttons && gp.buttons[i] && gp.buttons[i].pressed), hd = pb(12) ? 'u' : pb(13) ? 'd' : pb(14) ? 'l' : pb(15) ? 'r' : '';\n    if (E[12] || E[13] || E[14] || E[15]) menuPadInput.__dr = now + 200; else if (hd && !dir && !st && now > (menuPadInput.__dr || 0)) { dir = hd; menuPadInput.__dr = now + 70; } }");
one("sp = (over ? 520 : 900) * Math.pow(Math.min(1, mag), 1.6);","sp = (over ? 1100 : 1700) * Math.pow(Math.min(1, mag), 1.15);");
one("    const r = mpi.call(this, E, Object.assign({}, axes, {lx: 0, ly: 0}), gp);\n    if (dpad && navEl) {","    const nb0 = navEl, r = mpi.call(this, E, Object.assign({}, axes, {lx: 0, ly: 0}), gp);\n    if ((dpad || navEl !== nb0) && navEl) {");
// t910u: GLX-C122 painter skips the crystal picks (its palette has no crystal, so it painted them silver and re-asserted that for ever)
one("const t = TOOL[id]; if (t && ['pick', 'axe', 'shovel', 'hoe', 'sword'].includes(t[0]) && !/bat\\b|claymore/.test(n))","const t = TOOL[id]; if (t && ['pick', 'axe', 'shovel', 'hoe', 'sword'].includes(t[0]) && !/bat\\b|claymore|crystal/.test(n))");
one('<!-- glencraft-build: b1219-v1.2.19 -->','<!-- glencraft-build: b1220-v1.2.20 -->');
one("const GAME_VERSION = '1.2.19';","const GAME_VERSION = '1.2.20';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.20',d:'2026-11-07',notes:['Lighter water: the ripple rings are only worked out while a ripple is actually spreading, rings skip water they cannot reach, and flowing water no longer asks for the same rebuild twice. Waves, flow, foam, shine and splashes look the same.','Fewer pop ups: the welcome, tip, weather and biome messages that appeared on their own are gone. Messages about what you just did, warnings and save problems still show.','Hover over any item in your inventory, a chest, creative tabs or the hotbar to see its name straight away.','Entering a brand new world no longer saves the whole world in the same moment you arrive; the first save follows a few seconds later.','Time box inside: chrome, purple and blue panelled walls and a dark blue floor instead of wooden planks, the blue glass column with yellow energy is now the main console column, and the live outside view screen is a 55 inch screen at eye height.','Time box pilot mode: press Fly (or X at the console) to sit at the stick facing a 55 inch live screen of the view outside. Right stick points the box any way you like, turning and tilting up or down, and the screen shows that view; left stick flies where it points and sideways, RT goes up, LT goes down, LS boosts and X lets go. The room inside is now twice as wide as the first time box.','Faster controller menus: moving through the inventory, chests and lists with the stick or d-pad is quicker, and holding the d-pad keeps moving. The name of the selected item shows next to it.','The Purple crystal pickaxe now has its own purple icon in the inventory, and the Blue crystal pickaxe keeps its blue one.']})+',');
fs.writeFileSync(out,s);console.log(crypto.createHash('sha256').update(s).digest('hex'));
