s=open('s1.js').read()
def R(a,b,c=1):
    global s
    n=s.count(a); assert n==c,(n,a[:60]); s=s.replace(a,b)
# 1 jump
R("  const wantJump = jumpBuf > 0 || jumpHeld || jumpHeldPad || keys.Space;\n  jumpBuf -= dt;",
  "  // GLX-B2: only a fresh press jumps (holding no longer auto-repeats); holding still swims/flies up\n  const holdJump = jumpHeld || jumpHeldPad || !!keys.Space;\n  const wantJump = jumpBuf > 0;\n  jumpBuf -= dt;")
R("if (MODE.fly && flying) { P.vy = (wantJump ? 7 : 0)","if (MODE.fly && flying) { P.vy = (holdJump ? 7 : 0)")
R("P.vy += (wantJump ? 14 : -5) * dt;","P.vy += (holdJump ? 14 : -5) * dt;")
R("if (wantJump && bodyB !== T.WATER","if ((wantJump || holdJump) && bodyB !== T.WATER")
R("if (e.code === 'Space') { jumpReq = true;","if (e.code === 'Space') { if (!e.repeat) jumpReq = true;")
R("  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => jb.addEventListener(ev, jEnd));",
  "  ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave'].forEach(ev => jb.addEventListener(ev, jEnd));\n  window.addEventListener('pointerup', jEnd); window.addEventListener('blur', jEnd);\n  document.addEventListener('visibilitychange', jEnd);")
# 2/4 pad mapping
R("  if (E[12]) toggleCamera();\n","  if (E[12]) dropOne();\n  if (E[13]) toggleCamera();\n")
R("  if (E[3]) openMenu(true);\n","  if (E[3]) useItem();\n  if (E[6]) { invTab = 'craft'; openMenu(true); }\n")
R("  if (E[6]) useItem();\n  if (E[13]) dropOne();\n","")
R("  if (Math.abs(axes.lx) + Math.abs(axes.ly) < 0.1) sprintPad = false;","  if (Math.abs(axes.lx) + Math.abs(axes.ly) < 0.1 && nowT - padFwdT > 350) sprintPad = false;\n  if (axes.ly > -0.3) { if (sprintPad && axes.ly > 0.2) sprintPad = false; }")
# 3 sprint: easier double tap (lower threshold, wider window), faster speed
R("const fwd = axes.ly < -0.75, nowT = performance.now();\n  if (fwd && !padFwd) { if (nowT - padFwdT < 350) sprintPad = true; padFwdT = nowT; }",
  "const fwd = axes.ly < (padFwd ? -0.45 : -0.6), nowT = performance.now();\n  if (fwd && !padFwd) { if (nowT - padFwdT < 450) { sprintPad = true; toast('Sprinting'); } padFwdT = nowT; }")
R("sprinting ? 9.2 : 4.6)","sprinting ? 10.5 : 4.6)")
R("  if (inCraft && (E[6] || E[7])) { const i","  if (inCraft && E[6]) { openMenu(false); return; }\n  if (inCraft && E[7]) { const i")
R("<b>LT</b> place / use (hoe, seeds, bucket) · <b>D-pad down</b> drop one · <b>A</b> jump · <b>X</b> eat · <b>Y</b> craft",
  "<b>LT</b> crafting table · <b>Y</b> place / use (hoe, seeds, bucket) · <b>D-pad down</b> 3rd person · <b>D-pad up</b> drop one · <b>A</b> jump · <b>X</b> eat · <b>LS forward x2</b> sprint")
# 6 mobs
R("      if (a.onGround) { a.vy = 6.4; a.onGround = false; }","      if (a.onGround) { a.vy = 7.4; a.onGround = false; }")
R("""  const r = moveMob(a, Math.sin(hd) * spd * dt, Math.cos(hd) * spd * dt);
  if (r === false) {
    if (wander) { a.ang += Math.PI * (0.5 + Math.random()); a.timer = 0.8; }""",
"""  const mx = Math.sin(hd) * spd * dt, mz = Math.cos(hd) * spd * dt;
  let r = moveMob(a, mx, mz);
  // GLX-B2: slide along walls instead of stopping dead on corners
  if (r === false) r = Math.abs(mx) > Math.abs(mz) ? (moveMob(a, mx, 0) || moveMob(a, 0, mz)) : (moveMob(a, 0, mz) || moveMob(a, mx, 0));
  if (r === false) {
    // re-pick a direction only once in a while, so a blocked mob doesn't spin on the spot
    if (wander) { if (!(a.blockCd > 0)) { a.ang += (Math.random() < .5 ? 1 : -1) * Math.PI * (0.5 + Math.random() * 0.4); a.timer = 1.5; a.blockCd = 1.0; } }""")
R("    if (a.detourT > 0) a.detourT -= dt;\n","    if (a.detourT > 0) a.detourT -= dt;\n    if (a.blockCd > 0) a.blockCd -= dt;\n")
R("if (!dead && started && dist < 14 && canSee(a, 13)) a.aggro = 4;","if (!dead && started && dist <= 13 && canSee(a, 13)) a.aggro = 3;")
R("if (a.shootCd <= 0 && dist < 13) {","if (a.shootCd <= 0 && dist < 13 && canSee(a, 13)) {")
# 8 treeman
R("a.head.rotation.y = Math.sin(now * 20) * 0.5; a.eyeM","a.head.rotation.y = Math.sin(now * 3) * 0.4; a.eyeM")
R("""  a.head.rotation.y = Math.sin(now * 15) * 0.6 * a.twist;
  a.head.rotation.z = Math.sin(now * 7.5) * 0.22 * a.twist;
  a.head.rotation.x = a.twist * 0.15;""",
"""  // GLX-B2: smooth, creepy side-to-side sway (slow when idle, wider when angry) instead of a glitchy whip
  const swayAmp = 0.12 + 0.38 * a.twist, swayF = 1.1 + 1.4 * a.twist;
  a.head.rotation.y += (Math.sin(now * swayF + a.walk * 0.1) * swayAmp - a.head.rotation.y) * Math.min(1, dt * 6);
  a.head.rotation.z += (Math.sin(now * swayF * 0.5) * 0.08 * (0.4 + a.twist) - a.head.rotation.z) * Math.min(1, dt * 6);
  a.head.rotation.x += (a.twist * 0.15 - a.head.rotation.x) * Math.min(1, dt * 6);
  if (a.state === 'stare' && dist < 18 && started) { a.idleGrowl = (a.idleGrowl === undefined ? 3 + Math.random() * 5 : a.idleGrowl) - dt; if (a.idleGrowl <= 0) { a.idleGrowl = 6 + Math.random() * 8; sfx3d('growl', a.g.position, 18); } }""")
R("a.head.position.x = (Math.random() - .5) * 0.04; a.head.rotation.z = (Math.random() - .5) * 0.15; }",
  "a.head.rotation.y = Math.sin(t * 2.4) * 0.35; a.head.rotation.z = Math.sin(t * 1.2) * 0.08; }")
open('s1.js','w').write(s)
