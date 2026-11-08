// probe (not a pass/fail test): what the first person musket shows while its real GLB has not arrived and no failure is flagged (C350 step: hidden, by design)
import {make} from './lib/hands-harness.mjs';
const {G, H, IT, MOD} = await make(); G.scene.add(G.camera); const keep = G.MOD.rifle; delete G.MOD.rifle;
H.setSel(IT.MUSKET); let hid = 0, shown = 0; G.__c288.aiming = true; for (let i = 0; i < 300; i++) { H.frame(1/60,false); const g = H.held.children[0]; let v = true; for (let a = g; a; a = a.parent) if (!a.visible) v = false; v ? shown++ : hid++; }
console.log('rifle model never arrives, aiming 5 s: hidden', hid, 'shown', shown, 'c322', JSON.stringify({fail: G.__c322.fail, hidden: G.__vm.hidden}));
G.MOD.rifle = keep; for (let i = 0; i < 30; i++) H.frame(1/60,false); const g = H.held.children[0]; console.log('after model arrives: swapped', !!g.userData.c322, 'visible', g.visible);
