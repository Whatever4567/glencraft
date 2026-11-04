# v1.1.78: the Backrooms and the Mystery painting are cut out of the base game (the DIM framework stays for Hell)
def cut(s, a, b, rep=''):
    i = s.index(a); assert s.count(a) == 1, a; j = s.index(b, i) + len(b); return s[:i] + rep + s[j:]
def strip(s):
    s = cut(s, 'Object.assign(TEX, {"br_wallpaper"', "BLOCK_MATS[id] = m;\n});\n")
    s = cut(s, '// ---------- the Backrooms: an endless', "  const df = dropsFor; dropsFor = function (b) { if (b === T.PAINTB) return [[IT.PAINTING, 1]]; return df.apply(this, arguments); };\n})();\n")
    i = s.index('/* ===================== GLX-G5 (v0.9.23): see-through painting doorways'); j = s.index('// pause menu: Return to overworld', i); blk = s[i:j]
    sl = blk[blk.index('function safeLand('):blk.index('function brSafeArrival()')]
    ow = blk[blk.index('function owSafeArrival()'):]; ow = ow[:ow.index('\n') + 1]
    ex = blk[blk.index('  const ex = exitDim;\n'):blk.index('  // using (tapping) a painting')]
    s = s[:i] + '/* v1.1.78: safe landing when you come back from Hell */\n' + sl + ow + '(function () {\n' + ex + '})();\n' + s[j:]
    for a, b in [("toast(name === 'backrooms' ? 'You step through the painting...' : 'The portal pulls you in...');", "toast('The portal pulls you in...');"),
                 (" && (name !== 'backrooms' || d.brv === 2)", ""), ("if (DIM.cur === 'backrooms') return null; ", ""),
                 ("DIM.cur === 'backrooms' ? 'Level 0' : ", ""), ("&& DIM.cur !== 'backrooms' && lightPortal", "&& lightPortal"),
                 ("if (inP && portalArm && DIM.cur !== 'backrooms') {", "if (inP && portalArm) {"),
                 ("const nm = DIM.cur === 'hell' ? 'Hell' : 'the Backrooms';", "const nm = 'Hell';"),
                 ("      else { genBackrooms(); genVer = 1; brSafeArrival(); }\n", ""),
                 ("if (DIM.cur === 'hell' || DIM.cur === 'backrooms') return resetDim();", "if (DIM.cur === 'hell') return resetDim();"),
                 ("DIM.cur === 'backrooms' ? 'Reset Backrooms' : ", ""),
                 ("    try { for (const [, q] of PV.portals) scene.remove(q.g); PV.portals.clear(); PV.lastPos.clear(); } catch (_) {}\n", ""),
                 ("dimensions framework + the Backrooms (Mystery painting)", "dimensions framework"),
                 ("Backrooms + Mystery painting removed", "Hell music"),
                 ("(Hell / Backrooms resets stay)", "(Hell reset stays)"),
                 ("DIM.cur === 'backrooms' ? 'the Backrooms' : ", ""), ("DIM.cur === 'backrooms' ? 0.36 : ", ""), ("(a bit higher in Hell and the Backrooms)", "(a bit higher in Hell)"),
                 ("for (const nm of ['hell', 'backrooms'])", "for (const nm of ['hell'])"),
                 ("if (DIM.cur === 'hell' || DIM.cur === 'backrooms') return rt.apply(this, arguments);", "if (DIM.cur === 'hell') return rt.apply(this, arguments);")]:
        n = s.count(a); s = s.replace(a, b)
        if not n: print('strip miss', a[:60])
    s = cut(s, '  // ---- Backrooms and the Mystery painting are removed ----\n', "  setInterval(() => { try { if (started && typeof DIM !== 'undefined' && DIM.cur === 'backrooms' && !DIM.busy) exitDim(); } catch (_) {} }, 1500);\n",
            "  // v1.1.78: an old save left in another dimension that no longer exists comes back to the overworld\n  const ew = enterWorld; enterWorld = function (save) { if (save && save.dim && save.dim !== 'hell') { delete save.dim; delete save.dimCur; } return ew.apply(this, arguments); };\n")
    return s
