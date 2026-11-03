import base64
s=open('s1.js').read()
def R(a,b,c=1):
    global s
    assert s.count(a)==c,(s.count(a),a[:70]); s=s.replace(a,b)
b64=base64.b64encode(open('diamond_ore.jpeg','rb').read()).decode()
R('const TEX = {"bed_top":','const TEX = {"diamond_ore": "data:image/jpeg;base64,'+b64+'", "bed_top":')
R("BRICK:78, MUD:79, COBWEB:90, REDORE:91, TV:120};","BRICK:78, MUD:79, COBWEB:90, REDORE:91, TV:120, DIAMONDORE:69};")
R("FLINTSTEEL:116, SHEARS:117, REDSTONE:118, BREW:119, IRONBREW:121, BRICKITEM:122};",
  "FLINTSTEEL:116, SHEARS:117, REDSTONE:118, BREW:119, IRONBREW:121, BRICKITEM:122,\n  DIAMOND:123, DPICK:124, DAXE:125, DSWORD:126, DSHOVEL:127, DHOE:128, DHELM:129, DCHEST:130, DLEGS:131, DBOOTS:132};")
R("  78:'house_brick', 79:'mud', 91:'redstone_ore'\n};","  78:'house_brick', 79:'mud', 91:'redstone_ore', 69:'diamond_ore'\n};")
R("const ICON_KEY = {","const ICON_KEY = {69:'diamond_ore',")
R("const HARD = {","const HARD = {69:3.4, ")
R("const REQ = {","const REQ = {69:3, ")
R("100:['shovel',1,2,1.5], 101:['shovel',2,3,2], 102:['shovel',3,4.5,2.5], 103:['shovel',1,6,1.5]};",
  "100:['shovel',1,2,1.5], 101:['shovel',2,3,2], 102:['shovel',3,4.5,2.5], 103:['shovel',1,6,1.5],\n  // diamond: mines everything, fastest (gold-like speed but full level), hits hardest\n  124:['pick',4,7.5,5], 125:['axe',4,7.5,7], 126:['sword',4,1,7.5], 127:['shovel',4,7.5,3], 128:['hoe',4,1.5,1]};")
R("const HOES = new Set([IT.WHOE, IT.SHOE, IT.IHOE, IT.GHOE]);","const HOES = new Set([IT.WHOE, IT.SHOE, IT.IHOE, IT.GHOE, IT.DHOE]);")
R("const toolMat = id => (id >= 92","const toolMat = id => (id >= 124 && id <= 128) ? 'diamond' : (id >= 92")
R("['gold', 112, [2, 5, 3, 1]]].forEach(([m, b, pts]) => {","['gold', 112, [2, 5, 3, 1]], ['diamond', 129, [3, 8, 6, 3]]].forEach(([m, b, pts]) => {")
R("const ARMOUR_COL = {copper: 0xc8703f, iron: 0xd4d8dc, gold: 0xf2c440};","const ARMOUR_COL = {copper: 0xc8703f, iron: 0xd4d8dc, gold: 0xf2c440, diamond: 0x5fe0dc};")
R("const MATCOL = {wood: '#b48a52', stone: '#9a9ea2', iron: '#e2e5e8', gold: '#f2c440', copper: '#d0773f'};","const MATCOL = {wood: '#b48a52', stone: '#9a9ea2', iron: '#e2e5e8', gold: '#f2c440', copper: '#d0773f', diamond: '#6ff0ea'};")
R("const TOOL_COL = {wood: 0xb08a55, stone: 0x8e9398, iron: 0xdfe3e8, gold: 0xf4c542};","const TOOL_COL = {wood: 0xb08a55, stone: 0x8e9398, iron: 0xdfe3e8, gold: 0xf4c542, diamond: 0x6ff0ea};")
R("  const metal = mat === 'iron' || mat === 'gold';","  const metal = mat === 'iron' || mat === 'gold' || mat === 'diamond';")
R("const PLACEABLE = new Set([1,","const PLACEABLE = new Set([69,1,")
R("  ['Gold', IT.GOLDINGOT, 'Gold ingots', [IT.GPICK, IT.GAXE, IT.GSWORD, IT.GSHOVEL, IT.GHOE]]];",
  "  ['Gold', IT.GOLDINGOT, 'Gold ingots', [IT.GPICK, IT.GAXE, IT.GSWORD, IT.GSHOVEL, IT.GHOE]],\n  ['Diamond', IT.DIAMOND, 'Diamonds', [IT.DPICK, IT.DAXE, IT.DSWORD, IT.DSHOVEL, IT.DHOE]]];")
R("[['Copper', IT.COPPERINGOT, 104], ['Iron', IT.IRONINGOT, 108], ['Gold', IT.GOLDINGOT, 112]].forEach(([lbl, m, b]) => {\n  [['helmet', 5], ['chestplate', 8], ['leggings', 7], ['boots', 4]].forEach(([pn, c], s) => RECIPES.push(rc(lbl + ' ' + pn, c + ' ' + lbl + ' ingots', b + s, 1, [[m, c]], 1, 1)));",
  "[['Copper', IT.COPPERINGOT, 104], ['Iron', IT.IRONINGOT, 108], ['Gold', IT.GOLDINGOT, 112], ['Diamond', IT.DIAMOND, 129]].forEach(([lbl, m, b]) => {\n  [['helmet', 5], ['chestplate', 8], ['leggings', 7], ['boots', 4]].forEach(([pn, c], s) => RECIPES.push(rc(lbl + ' ' + pn, c + ' ' + (lbl === 'Diamond' ? 'Diamonds' : lbl + ' ingots'), b + s, 1, [[m, c]], 1, 1)));")
R("  IT.CHELM, IT.CCHEST, IT.CLEGS, IT.CBOOTS, IT.IHELM, IT.ICHEST, IT.ILEGS, IT.IBOOTS, IT.GHELM, IT.GCHEST, IT.GLEGS, IT.GBOOTS,\n  IT.SHEARS",
  "  IT.DPICK, IT.DAXE, IT.DSWORD, IT.DSHOVEL, IT.DHOE,\n  IT.CHELM, IT.CCHEST, IT.CLEGS, IT.CBOOTS, IT.IHELM, IT.ICHEST, IT.ILEGS, IT.IBOOTS, IT.GHELM, IT.GCHEST, IT.GLEGS, IT.GBOOTS, IT.DHELM, IT.DCHEST, IT.DLEGS, IT.DBOOTS,\n  IT.SHEARS")
R("IT.COPPERINGOT, IT.IRONINGOT, IT.GOLDINGOT, IT.REDSTONE, IT.BRICKITEM];","IT.COPPERINGOT, IT.IRONINGOT, IT.GOLDINGOT, IT.DIAMOND, T.DIAMONDORE, IT.REDSTONE, IT.BRICKITEM];")
R("  if (b === T.GOLDORE) return [[IT.RAWGOLD, 1]];","  if (b === T.GOLDORE) return [[IT.RAWGOLD, 1]];\n  if (b === T.DIAMONDORE) return [[IT.DIAMOND, 1]];")
R("    else if (r < 0.0198 && y >= 2 && y <= BASE - 12) vein(x, y, z, T.REDORE, 2 + Math.floor(Math.random() * 4));",
  "    else if (r < 0.0198 && y >= 2 && y <= BASE - 12) vein(x, y, z, T.REDORE, 2 + Math.floor(Math.random() * 4));\n    else if (r < 0.0206 && y >= 1 && y <= 7) vein(x, y, z, T.DIAMONDORE, 1 + Math.floor(Math.random() * 3));   // rare, small, deepest layers only")
R("    if (b === T.IRONORE || b === T.GOLDORE) {","    if (b === T.IRONORE || b === T.GOLDORE || b === T.DIAMONDORE) {")
R("  ICONS[IT.IRONINGOT] = ingot(","""  ICONS[IT.DIAMOND] = drawIcon(g => {
    g.strokeStyle = '#0c3b44'; g.lineWidth = 2.5;
    g.fillStyle = '#4fd8d6'; g.beginPath(); g.moveTo(-20, -8); g.lineTo(-10, -20); g.lineTo(10, -20); g.lineTo(20, -8); g.lineTo(0, 22); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#b8fffa'; g.beginPath(); g.moveTo(-10, -20); g.lineTo(0, -8); g.lineTo(10, -20); g.closePath(); g.fill();
    g.fillStyle = '#2aa7b0'; g.beginPath(); g.moveTo(0, -8); g.lineTo(20, -8); g.lineTo(0, 22); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.fillRect(-12, -14, 4, 4); g.fillRect(14, -24, 3, 9); g.fillRect(11, -21, 9, 3);
  });
  ICONS[IT.IRONINGOT] = ingot(""")
R("['zombie_skin', 'bone_skin', 'haggis_fur', 'treeman_bark'].forEach(tex);","""['zombie_skin', 'bone_skin', 'haggis_fur', 'treeman_bark'].forEach(tex);
// diamond ore glints: a soft cyan shimmer that pulses so it catches your eye in the dark
(function diamondGlint() {
  const m = BLOCK_MATS[69]; if (!m || !m.emissive) return;
  m.emissive.setHex(0x1a6f78); m.emissiveMap = m.map; m.needsUpdate = true;
  setInterval(() => { const t = performance.now() / 1000; m.emissiveIntensity = 0.35 + 0.3 * Math.max(0, Math.sin(t * 2.3)) + 0.25 * Math.max(0, Math.sin(t * 7.1 + 1)) ** 8; }, 60);
})();""")
s=s.replace("\n  ['Diamond'","\n  ['Diamond'")
# names
R("const ICON_KEY = {","Object.assign(NAMES, {69: 'Diamond ore', 123: 'Diamond', 124: 'Diamond pickaxe', 125: 'Diamond axe', 126: 'Diamond sword', 127: 'Diamond shovel', 128: 'Diamond hoe',\n  129: 'Diamond helmet', 130: 'Diamond chestplate', 131: 'Diamond leggings', 132: 'Diamond boots'});\nconst ICON_KEY = {")
open('s1.js','w').write(s)
