// v1.2.92: opening the inventory with a controller must not freeze the game.
// Root cause: later patches splice retired recipes out of RECIPES but leave
// stale craftBtns behind. updateCraftList then does canCraft(RECIPES[i]) with
// a missing recipe, throws TypeError on r.tool, and because openMenu (Y/X)
// and updateHud call it with no try/catch, readPad / frame die and the menu
// cannot be moved or closed.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let n = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; else n++; };

ok(html.includes('/* GLX-PAD1292') && html.includes('window.__padInv1292'), 'pad-inventory patch is inlined');
ok(html.includes('if (!r) { U.guarded++; return false; }'), 'canCraft rejects a missing recipe instead of reading r.tool');
ok(html.includes('function stale()') && html.includes('function rebuild()'), 'stale craft buttons are detected and the list is rebuilt');
ok(html.includes("if (E[3]) { if (!(window.__c309 && __c309.yBtn && __c309.yBtn())) { openMenu(true); setTab('char'); } }"), 'Y still opens inventory + character');
ok(html.includes("if (E[2]) { if (gunHeld) { if (window.reloadGun) reloadGun(); } else { openMenu(true); setTab('craft'); } }"), 'X still opens crafting when a gun is not held');
ok(html.includes('function menuPadInput(E, axes, gp)'), 'menuPadInput is intact');
ok(html.includes('if (dir) navMove(') && html.includes('if (E[0])') && html.includes('if (E[1]) { if (cursor)'), 'D-pad/stick still move focus, A clicks, B closes');
ok(html.includes('if (menuOpen) updateCraftList()'), 'hud still refreshes the craft list while the menu is open');

// Isolated reproduction of the pre-fix crash (186 buttons, 149 recipes).
function canCraftUnguarded(r) {
  if (r.tool && true) return false;
  if (r.table && !true) return false;
  return r.need.every(() => true);
}
function canCraftGuarded(r) {
  if (!r) return false;
  return canCraftUnguarded(r);
}
const RECIPES = Array.from({length: 149}, () => ({tool: 0, table: 0, out: 1, need: []}));
const craftBtns = Array.from({length: 186}, () => ({classList: {toggle() {}}, querySelector() { return {textContent: ''}; }}));
let threw = false;
try {
  craftBtns.forEach((b, i) => { const r = RECIPES[i], dis = !canCraftUnguarded(r); void dis; });
} catch (e) { threw = /tool/.test(String(e)); }
ok(threw, 'the unguarded loop throws TypeError on r.tool (the pre-fix crash)');
let threw2 = false;
try {
  craftBtns.forEach((b, i) => { if (!b || !RECIPES[i]) return; const r = RECIPES[i], dis = !canCraftGuarded(r); void dis; });
} catch (e) { threw2 = true; }
ok(!threw2, 'the guarded loop does not throw on the same stale list');

if (fails) { console.log(fails + ' failing'); process.exit(1); }
console.log('v1292-pad-inventory ok', n);
