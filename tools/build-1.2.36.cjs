#!/usr/bin/env node
'use strict';
// Approved combined release: display transfer, Scottish base, armour removal, portrait layout.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const out=process.argv[2]||path.join(__dirname,'../index.html');
cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.35.cjs'),out],{stdio:'inherit'});
let s=fs.readFileSync(out,'utf8');
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('Need exactly one hotfix seam: '+a.slice(0,100));s=s.slice(0,i)+b+s.slice(i+a.length);}
one("const GAME_VERSION = '1.2.35';","const GAME_VERSION = '1.2.36';");
one('<!-- glencraft-build: b1235-v1.2.35 -->','<!-- glencraft-build: b1236-v1.2.36 -->');
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.36',d:'2026-11-09',notes:['Corrected the pilot model display colour transfer in the legacy world renderer.','The approved character assets, equipment, skeleton and gameplay are unchanged.']})+',');
const helper=fs.readFileSync(path.join(__dirname,'pilot-model-source/display-transfer-1236.js'),'utf8');
one('    function rig(template) {',helper+'\n    function rig(template) {');
one('const c=m.clone();c.userData.pilotOriginalColor','const c=installPilotDisplayTransfer(m.clone());c.userData.pilotOriginalColor');
one('const m=original.clone(),hex=','const m=installPilotDisplayTransfer(original.clone()),hex=');
// Approved Scottish base integration; legacy factory mode remains available for fallback/regressions.
one("    const names = ['visual_head_hair_eyes'", "    const names = O.scottish ? ['visual_head_hair_eyes','visual_arm_slot0_hand','visual_arm_slot1_hand','visual_torso_outfit','visual_leg_slot0','visual_leg_slot1','visual_kilt_clothing','visual_sporran_clothing','armoured_leg_slot0','armoured_leg_slot1','gear_helmet','gear_chest_harness','gear_chest_slot0','gear_chest_slot1','gear_legs_slot0','gear_legs_slot1','gear_boots_slot0','gear_boots_slot1','gear_white_pack'] : ['visual_head_hair_eyes'");
one("        rotate('thigh.'+side,leg.quaternion);rotate('shin.'+side,leg.quaternion.clone().multiply(knee?knee.quaternion:Q()));", "        const legPose=O.scottish&&!u.pilot.equipment[2]?Q().setFromEuler(new T.Euler(Math.max(-.52,Math.min(.52,leg.rotation.x)),leg.rotation.y,Math.max(-.24,Math.min(.24,leg.rotation.z)))):leg.quaternion;rotate('thigh.'+side,legPose);rotate('shin.'+side,legPose.clone().multiply(knee?knee.quaternion:Q()));");
one("        r.regions[n].o.visible=visible;", "        if(O.scottish){if(n==='visual_kilt_clothing'||n==='visual_sporran_clothing'||n==='visual_leg_slot0'||n==='visual_leg_slot1')visible=!p.equipment[2];if(n==='armoured_leg_slot0'||n==='armoured_leg_slot1')visible=!!p.equipment[2];}r.regions[n].o.visible=visible;");
one("if(material.name==='PackWhite'){", "if(material.name==='PackWhite'||(O.scottish&&material.name.startsWith('08 • ceramic white tank'))){");
const combine=fs.readFileSync(path.join(__dirname,'scottish-source/combine.js'),'utf8');
one('/* Install after the final production animation/equipment wrappers. */',combine+'\n/* Install after the final production animation/equipment wrappers. */');
one('    ensureLibrary,\n    load:name=>new Promise((resolve,reject)=>new THREE.GLTFLoader().load(\'assets/models/pilot-v1/\'+name+\'?v=1.2.35\',resolve,undefined,reject)),', `    ensureLibrary,scottish:true,
    load:name=>{const far=name==='pilot-far.glb',fetch=p=>new Promise((resolve,reject)=>new THREE.GLTFLoader().load(p,resolve,undefined,reject));return Promise.all([fetch('assets/models/scottish-base-v1/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.36'),fetch('assets/models/pilot-v1/'+name+'?v=1.2.35')]).then(([base,gear])=>window.__mergeScottish1236(THREE,base,gear,far));},`);
// Occupied slots MUST remove first, not keep or silently upgrade equipment.
one("    if (b && (!cur || U.rank(b) > U.rank(cur))) { equipArmour(b); U.equips++; return 'equip'; }\n    if (cur) { U.kept = (U.kept || 0) + 1; return 'kept'; }", "    if (cur) { unequip(s); return 'off'; }\n    if (b) { equipArmour(b); U.equips++; return 'equip'; }");
one("U.jetTap = () => { const cur = armour[4]; if (cur === JET) { unequip(4); return 'off'; }", "U.jetTap = () => { const cur = armour[4]; if (cur) { unequip(4); return 'off'; }");
one("if (!s) return; try { if (typeof cursor !== 'undefined' && cursor && ARMOUR[cursor.id])", "if (!s) return; const slot=['helmet','chest','legs','boots','jetpack'].indexOf(s.dataset.testid.slice(12));if(slot>=0&&armour[slot])return; try { if (typeof cursor !== 'undefined' && cursor && ARMOUR[cursor.id])");
one("if (s >= 0) U.slotTap(s); else U.jetTap(); } catch (er)","if (s >= 0) U.slotTap(s); else U.jetTap(); if(typeof updateCharStats==='function')updateCharStats(); } catch (er)");
// The UI22 wrapper did not grow inside charTab, collapsing the absolute canvas to zero width.
one('#ui22row{display:flex;gap:8px;align-items:stretch;min-height:0}#ui22row>#charView{flex:1 1 auto}#ui22off{display:flex;flex-direction:column;gap:8px;width:96px}', '#ui22row{display:flex;gap:8px;align-items:stretch;min-height:240px;min-width:0;flex:1 1 auto;width:100%;align-self:stretch}#ui22row>#charView{flex:1 1 0%;min-width:0}#ui22row>#armour{flex:0 0 clamp(82px,16vw,118px);width:auto}#ui22off{display:flex;flex-direction:column;gap:8px;flex:0 0 clamp(48px,12vw,96px);width:auto}#charCv{touch-action:none;pointer-events:auto}');
// Accurate combined notes, without changing any earlier release history.
one('Corrected the pilot model display colour transfer in the legacy world renderer.','Corrected character display colour transfer in the legacy world renderer.');
one('The approved character assets, equipment, skeleton and gameplay are unchanged.','The approved Scottish base is restored; a jetpack adds only the pack. Occupied armour slots now remove their item and return it to the inventory. The character portrait now fills the available panel and accepts drag rotation.');
fs.writeFileSync(out,s);fs.writeFileSync(path.join(path.dirname(path.resolve(out)),'version.json'),JSON.stringify({v:'1.2.36'})+'\n');
console.log('Built approved combined 1.2.36 character/equipment release: '+out);
