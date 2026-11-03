s=open('s1.js').read()
def R(a,b):
    global s
    assert s.count(a)==1,a[:60]; s=s.replace(a,b)
R("  if (E[12]) dropOne();\n  if (E[13]) toggleCamera();\n","  if (E[12]) toggleCamera();\n")
R("  if (E[3]) useItem();\n  if (E[6]) { invTab = 'craft'; openMenu(true); }\n","  if (E[3]) openMenu(true);\n")
R("  if (E[5] || E[15]) cycleSel(1);\n","  if (E[5] || E[15]) cycleSel(1);\n  if (E[6]) useItem();\n  if (E[13]) dropOne();\n")
R("  if (inCraft && E[6]) { openMenu(false); return; }\n  if (inCraft && E[7]) { const i","  if (inCraft && (E[6] || E[7])) { const i")
R("<b>LT</b> crafting table · <b>Y</b> place / use (hoe, seeds, bucket) · <b>D-pad down</b> 3rd person · <b>D-pad up</b> drop one · <b>A</b> jump · <b>X</b> eat · <b>LS forward x2</b> sprint",
  "<b>LT</b> place / use (hoe, seeds, bucket) · <b>D-pad down</b> drop one · <b>A</b> jump · <b>X</b> eat · <b>Y</b> craft")
open('s1.js','w').write(s)
