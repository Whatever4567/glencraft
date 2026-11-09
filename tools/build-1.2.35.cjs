#!/usr/bin/env node
/* User-approved frozen pilot v1 only. Never read mutable asset authoring workspaces. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),output=process.argv[2]||path.join(root,'index.html');
cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.34.cjs'),output],{stdio:'inherit'});
let html=fs.readFileSync(output,'utf8');
const replace=(a,b)=>{if(!html.includes(a))throw Error('Pilot integration seam missing: '+a.slice(0,100));html=html.replace(a,b);};
replace("const GAME_VERSION = '1.2.34'","const GAME_VERSION = '1.2.35'");
replace('<!-- glencraft-build: b1234-v1.2.34 -->','<!-- glencraft-build: b1235-v1.2.35 -->');
replace('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.35',d:'2026-11-09',notes:[
 'The approved fitted pilot model replaces the previous third person and inventory avatar after its cached assets load.',
 'Native skinning, independent portrait rigs, removable equipment and distance LOD are adapted to the game.',
 'The frozen asset has 85107 near and 11295 far triangles before optional flame effects. MakeHuman CC0 graphical data credits are bundled.'
]})+',');
// Recalibrate only the new native rig. Legacy fallback retains every old pose constant.
replace('function ik(arm, T, side, len1, len2, fwd) { const S = V();',`function ik(arm, T, side, len1, len2, fwd) { if(arm.userData.pilot){len1=arm.userData.pilot.length1;len2=arm.userData.pilot.length2;arm.userData.pilotTarget={position:T.clone(),side:side.clone(),forward:fwd.clone()};} const S = V();`);
replace('U.on = 1; const u = worldModel.userData;','U.on = 1; const u = worldModel.userData; if(u.pilot)for(const a of u.arms)delete a.userData.pilotTarget;');
replace('isP && !aim ? 0.3 : 0.16','isP && !aim ? (u.pilot ? .22 : .3) : (u.pilot ? .10 : .16)');
replace('isP && !aim ? 0.15 : 0.22','isP && !aim ? .15 : (u.pilot ? .14 : .22)');
replace('isP && aim ? 0.35 : 0.05','isP && aim ? (u.pilot ? .22 : .35) : (u.pilot ? 0 : .05)');
replace('grip.clone().add(V().set(0, -0.03, 0)), R, 0.32','grip.clone().add(V().set(0, u.pilot ? 0 : -0.03, 0)), R, 0.32');
replace('grip.clone().addScaledVector(look, 0.42)','grip.clone().addScaledVector(look, u.pilot ? .24 : .42)');
replace('const gp = V(); a.userData.grip.getWorldPosition(gp);','if(u.pilot&&window.__pilot1235)window.__pilot1235.sync(worldModel); const gp = V(); a.userData.grip.getWorldPosition(gp);');
replace('p.position.set(P.x - fx * 0.42 + rx * sx * 0.15 + (Math.random() - .5) * 0.08, P.y + 0.5 - Math.random() * 0.35, P.z - fz * 0.42 + rz * sx * 0.15 + (Math.random() - .5) * 0.08);',`{const anchor=window.__pilot1235&&window.__pilot1235.nozzleWorld(worldModel,sx<0?0:1);if(anchor)p.position.copy(anchor).add(new THREE.Vector3((Math.random()-.5)*.08,-Math.random()*.35,(Math.random()-.5)*.08));else p.position.set(P.x - fx * 0.42 + rx * sx * 0.15 + (Math.random() - .5) * 0.08, P.y + 0.5 - Math.random() * 0.35, P.z - fz * 0.42 + rz * sx * 0.15 + (Math.random() - .5) * 0.08);}`);
const source=['runtime.js','install.js'].map(n=>fs.readFileSync(path.join(__dirname,'pilot-model-source',n),'utf8')).join('\n');
const end=html.lastIndexOf('</body>');if(end<0)throw Error('Body terminator missing');html=html.slice(0,end)+'<script>\n/* GLX-APPROVED-PILOT-1235 */\n'+source+'\n</script>\n'+html.slice(end);
for(const [name,sha]of Object.entries({'pilot.glb':'1e91f94225cee58c4ff5b0d0c42ea39ee1356bbdaf256784fc909af5b7a809a0','pilot-far.glb':'3b6a836790fe501fe89ff5c23d865188af3c2764c72715c02ca836714a7d263c'})){
 const bytes=fs.readFileSync(path.join(root,'assets/models/pilot-v1',name));if(crypto.createHash('sha256').update(bytes).digest('hex')!==sha)throw Error('Approved asset changed: '+name);
}
fs.writeFileSync(output,html);fs.writeFileSync(path.join(path.dirname(output),'version.json'),JSON.stringify({v:'1.2.35'})+'\n');console.log('Built approved pilot v1 / 1.2.35: '+output);
