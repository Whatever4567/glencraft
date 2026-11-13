/* GLX-TBOX1261 (v1.2.61): larger six-pane windows (~20% of each door), very
   dark navy shell that stays dark under game light, glowing signs and roof
   lamp, a proper plinth and roof stack, a rotor room without the blank
   ceiling disc, a single in-flight hum, and a robust hide of the extra
   touch flight pad (and the leftover gold arrow pad). */
(function tbox1261() {
  const U = window.__tbox1261 = { err: null, built: 0, hum: 0 };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 260); try { console.warn('t1261', w, e); } catch (_) {} };

  function navyMat(hex) {
    /* MeshBasic so daylight / QA lights cannot wash the shell to royal blue. */
    const m = new THREE.MeshBasicMaterial({ color: hex, fog: true });
    try { m.toneMapped = false; } catch (_) {}
    return m;
  }
  function basic(hex, opts) {
    const o = Object.assign({ color: hex, fog: false }, opts || {});
    const m = new THREE.MeshBasicMaterial(o);
    try { m.toneMapped = false; } catch (_) {}
    return m;
  }

  function signTex() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 160;
    const g = c.getContext('2d');
    g.fillStyle = '#050507'; g.fillRect(0, 0, 1024, 160);
    /* faint inner glow */
    const rg = g.createLinearGradient(0, 0, 0, 160);
    rg.addColorStop(0, 'rgba(255,230,160,0.10)');
    rg.addColorStop(0.5, 'rgba(255,230,160,0.02)');
    rg.addColorStop(1, 'rgba(255,230,160,0.10)');
    g.fillStyle = rg; g.fillRect(8, 8, 1008, 144);
    g.fillStyle = '#ffe9a8';
    g.shadowColor = '#ffe9a8'; g.shadowBlur = 14;
    g.font = 'bold 72px "Times New Roman", "Liberation Serif", serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const txt = 'POLICE  PUBLIC  CALL  BOX';
    const tw = g.measureText(txt).width;
    g.save();
    g.translate(512, 84);
    /* Keep ~10% side margins so the corner posts cannot clip P or X. */
    if (tw > 1) g.scale(Math.min(1, 860 / tw), 1);
    g.fillText(txt, 0, 0);
    g.restore();
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.anisotropy = 8; t.needsUpdate = true;
    return t;
  }

  function phoneTex() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 640;
    const g = c.getContext('2d');
    g.fillStyle = '#1a1408'; g.fillRect(0, 0, 512, 640);
    g.fillStyle = '#c9a84a';
    g.font = 'bold 48px "Times New Roman", serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('POLICE', 256, 70);
    g.fillText('TELEPHONE', 256, 128);
    g.font = 'bold 36px "Times New Roman", serif';
    g.fillText('PULL TO OPEN', 256, 560);
    g.strokeStyle = '#c9a84a'; g.lineWidth = 6; g.strokeRect(28, 200, 456, 280);
    g.fillStyle = '#2a2010'; g.fillRect(48, 220, 416, 240);
    /* handset hook suggestion */
    g.fillStyle = '#8a7030'; g.fillRect(200, 300, 112, 80);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
  }

  function box(w, h, d, mat, x, y, z, parent, rx, ry, rz) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx; if (ry) m.rotation.y = ry; if (rz) m.rotation.z = rz;
    m.castShadow = false; m.receiveShadow = false;
    m.userData.t1261 = 1;
    parent.add(m);
    return m;
  }

  /* 3-across × 2-down window. Outer size (fw × fh) includes the thick dark
     frame. Glass is a large proportion of the leaf and ~20% of door height
     once fh is set from PLAN.winH. */
  function sixPane(parent, x, y, z, fw, fh, yaw, mats) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw || 0;
    g.userData.t1261 = 1; parent.add(g);
    const t = 0.028;           /* frame depth, proud of the door */
    const bar = Math.max(fw, fh) * 0.055; /* thick mullions, like the photo */
    const outer = Math.max(fw, fh) * 0.06;
    box(fw, fh, t, mats.frame, 0, 0, 0, g);
    /* recess so panes sit in the frame */
    box(fw - outer * 1.1, fh - outer * 1.1, t * 0.5, mats.frameDark, 0, 0, t * 0.15, g);
    const innerW = fw - outer * 2, innerH = fh - outer * 2;
    const paneW = (innerW - 2 * bar) / 3, paneH = (innerH - bar) / 2;
    const zG = t * 0.42;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const px = (col - 1) * (paneW + bar);
        const py = (row === 0 ? -1 : 1) * (paneH + bar) * 0.5;
        /* bright unlit warm glass — reads as a lit interior at any time of day */
        const glass = box(paneW * 0.98, paneH * 0.98, t * 0.22, mats.glass, px, py, zG, g);
        glass.renderOrder = 2;
        /* soft halo just behind, slightly larger */
        const halo = box(paneW * 1.06, paneH * 1.06, t * 0.08, mats.halo, px, py, zG - t * 0.12, g);
        halo.renderOrder = 1;
      }
    }
    /* mullion bars on top of the glass so the 3×2 grid is clearly framed */
    box(bar * 0.95, innerH, t * 0.45, mats.frame, -(paneW + bar) * 0.5, 0, zG + t * 0.12, g);
    box(bar * 0.95, innerH, t * 0.45, mats.frame, (paneW + bar) * 0.5, 0, zG + t * 0.12, g);
    box(innerW, bar * 0.95, t * 0.45, mats.frame, 0, 0, zG + t * 0.12, g);
    return g;
  }

  function mkDoorFace(parent, PLAN, mats, leafW, doorH, signTex_, phone, yaw) {
    /* One leaf-worth of decoration, centred at the origin, standing on y=0.
       Windows sit in the TOP of the leaf, nearly full leaf width, ~21% of
       door height — matching the real Series box in the reference photo. */
    const g = new THREE.Group(); g.rotation.y = yaw || 0; parent.add(g);
    const frame = mats.frame, navy = mats.navy, navyD = mats.navyD, navyL = mats.navyL;
    const t = 0.022;
    /* leaf slab */
    box(leafW, doorH, t, navy, 0, doorH / 2, 0, g);
    /* stiles and rails */
    const stile = PLAN.postW * 0.28;
    box(stile, doorH, t * 1.4, navyL, -leafW / 2 + stile / 2, doorH / 2, t * 0.4, g);
    box(stile, doorH, t * 1.4, navyL, leafW / 2 - stile / 2, doorH / 2, t * 0.4, g);
    box(leafW, stile * 0.8, t * 1.4, navyL, 0, stile * 0.4, t * 0.4, g);
    box(leafW, stile * 0.8, t * 1.4, navyL, 0, doorH - stile * 0.4, t * 0.4, g);

    const winW = PLAN.winW, winH = PLAN.winH;
    /* window top is a short lintel below the leaf top; the 3×2 sits in the
       upper portion of the door, as in the photo. */
    const lintel = 1.6 * (PLAN.bodyW / 55); /* ~1.6 inches */
    const winCY = doorH - lintel - winH / 2;
    sixPane(g, 0, winCY, t * 0.7, winW, winH, 0, mats);

    /* three recessed panels below the window, stacked, nearly leaf-wide */
    const gap = 0.7 * (PLAN.bodyW / 55);
    const below = winCY - winH / 2 - gap;
    const panelH = (below - gap * 4) / 3;
    const panelW = Math.min(PLAN.panelW, leafW - stile * 2 - 0.01);
    for (let i = 0; i < 3; i++) {
      const py = gap + panelH * (i + 0.5) + gap * i;
      /* frame around a recessed panel */
      box(panelW, panelH, t * 0.9, navyL, 0, py, t * 0.25, g);
      box(panelW - 0.03, panelH - 0.03, t * 0.5, navyD, 0, py, t * 0.05, g);
    }

    if (phone) {
      const pw = PLAN.phoneW, ph = PLAN.phoneH;
      /* sit on the top panel, proud of the door so it is not buried */
      const topPanelY = gap + panelH * 2.5 + gap * 2;
      const brass = basic(0xc9a84a);
      box(pw + 0.02, ph + 0.02, t * 1.2, brass, 0, topPanelY, t * 1.15, g);
      const pm = basic(0xffffff, { map: phoneTex() });
      box(pw, ph, t * 0.6, pm, 0, topPanelY, t * 1.55, g);
    }
    return g;
  }

  function buildShell(T, U0) {
    const HW = T.HW, INCH = (2 * HW) / 55;
    /* Window HEIGHT is two rows of 7 5/8" plus thick bars ≈ 17.75", ~21.6%
       of the 82 1/8" door — the photo measures ~18–20% of door height.
       1.2.60 used a single 7 5/8" which read as a thin strip (~9%). */
    const PLAN = {
      INCH,
      baseW: 60.5 * INCH, bodyW: 55 * INCH, bodyH: 92 * INCH,
      postW: 5 * INCH, postH: 84 * INCH, doorH: 82.125 * INCH, divW: 1.75 * INCH,
      winW: 15.0 * INCH,          /* nearly full leaf (leaf ≈ 21.625") */
      winH: 17.75 * INCH,         /* two 7.625 rows + bars */
      paneGap: 0.9 * INCH,
      panelW: 15.0 * INCH,
      panelH: 16.75 * INCH,
      phoneW: 11.25 * INCH, phoneH: 13.375 * INCH,
      signH: 6.75 * INCH, signW: 43.5 * INCH,
      roof1: 45.75 * INCH, inset: 3.375 * INCH, pitchH: 4.375 * INCH,
      baseH: 8.0 * INCH            /* substantial plinth, like the photo (was 3.5") */
    };
    U.PLAN = PLAN;
    if (U0) U0.PLAN = PLAN;

    /* Near-black navy. Photo samples sit around (24–40, 20–32, 16–28). */
    const mats = {
      navy: navyMat(0x0c1018),
      navyD: navyMat(0x080a10),
      navyL: navyMat(0x161c28),
      frame: navyMat(0x07080c),
      frameDark: navyMat(0x050608),
      glass: basic(0xfff4b8),
      halo: basic(0xffe08a, { transparent: true, opacity: 0.55, depthWrite: false }),
      signBack: navyMat(0x050507),
      brass: basic(0xc9a84a),
      lampGlass: basic(0x9cffff),
      lampMetal: navyMat(0x101418)
    };
    U.mats = mats;

    /* remove a previous 1261 shell, hide the 1260 shell */
    try {
      if (U._shell && U._shell.parent) U._shell.parent.remove(U._shell);
    } catch (_) {}
    try {
      const all = T.parts && T.parts.all;
      if (all) all.traverse(o => {
        if (o.userData && o.userData.t1260 && o !== all) {
          if (o.isMesh || o.isGroup) o.visible = false;
        }
      });
    } catch (_) {}
    try {
      if (T.parts && T.parts.all) {
        const old = T.parts.all.getObjectByName && T.parts.all.getObjectByName('tardis1260');
        if (old) old.visible = false;
      }
    } catch (_) {}

    const shell = new THREE.Group(); shell.name = 'tardis1261'; shell.userData.t1261 = 1;
    U._shell = shell;
    /* T.all is typically centred at the box, y = ground. Plinth sits on y=0. */
    const parent = T.parts && T.parts.all;
    if (!parent) throw new Error('no TARDIS parent');
    parent.add(shell);

    /* ---- plinth (clear step on every side) ---- */
    box(PLAN.baseW, PLAN.baseH, PLAN.baseW, mats.navyD, 0, PLAN.baseH / 2, 0, shell);
    box(PLAN.baseW + 0.02, PLAN.baseH * 0.18, PLAN.baseW + 0.02, mats.navyL, 0, PLAN.baseH - PLAN.baseH * 0.09, 0, shell);
    /* thin lip so the step reads from a 3/4 view */
    box(PLAN.bodyW + 0.04, 0.025, PLAN.bodyW + 0.04, mats.navyL, 0, PLAN.baseH + 0.01, 0, shell);

    /* ---- hollow body core: solid on three sides and above the front
       door, but the doorway itself stays OPEN so you can walk in. A full
       box here would block the entrance. ---- */
    const coreH = PLAN.bodyH;
    const coreY = PLAN.baseH + coreH / 2;
    const bw = PLAN.bodyW, wallT = 0.06;
    box(bw - 0.04, coreH, wallT, mats.navyD, 0, coreY, -(bw / 2) + wallT / 2, shell);
    box(wallT, coreH, bw - 0.04, mats.navyD, -(bw / 2) + wallT / 2, coreY, 0, shell);
    box(wallT, coreH, bw - 0.04, mats.navyD, (bw / 2) - wallT / 2, coreY, 0, shell);
    /* front wall only ABOVE the door (sign band); posts cover the flanks */
    const aboveH = PLAN.bodyH - PLAN.doorH;
    if (aboveH > 0.02) {
      box(bw - 2 * PLAN.postW, aboveH, wallT, mats.navyD,
        0, PLAN.baseH + PLAN.doorH + aboveH / 2, bw / 2 - wallT / 2, shell);
    }

    /* ---- corner posts, proud, full height from the plinth ---- */
    const hw = PLAN.bodyW / 2, pw = PLAN.postW, ph = PLAN.postH;
    const postY = PLAN.baseH + ph / 2;
    const postInset = 0; /* flush with body corners, proud by half the post */
    const pOff = hw - pw / 2;
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
      box(pw, ph, pw, mats.navy, sx * pOff, postY, sz * pOff, shell);
      /* slight cap at the top of each post, under the sign / cornice */
      box(pw + 0.02, 0.04, pw + 0.02, mats.navyL, sx * pOff, PLAN.baseH + ph + 0.01, sz * pOff, shell);
    });

    /* front door opening through the core — filled by the leaves */
    const leafW = (PLAN.bodyW - 2 * pw - PLAN.divW) / 2;
    const doorH = PLAN.doorH;
    const doorY0 = PLAN.baseH;
    const frontZ = hw;
    /* carve is visual: a dark recess around the doorway so leaves sit in it */
    box(leafW * 2 + PLAN.divW + 0.02, doorH + 0.02, 0.03, mats.frameDark, 0, doorY0 + doorH / 2, frontZ - 0.01, shell);

    /* centre divider (mullion between leaves) */
    const div = box(PLAN.divW, doorH, 0.05, mats.navyL, 0, doorY0 + doorH / 2, frontZ + 0.01, shell);

    /* ---- front leaves (openable) ---- */
    const hingeL = -(PLAN.divW / 2 + leafW);
    const hingeR = (PLAN.divW / 2 + leafW);
    const leafL = new THREE.Group(); leafL.name = 'leafL1261';
    leafL.position.set(hingeL, doorY0, frontZ);
    const leafR = new THREE.Group(); leafR.name = 'leafR1261';
    leafR.position.set(hingeR, doorY0, frontZ);
    /* face is centred on the leaf; shift so the hinge is at x=0 of the group */
    const faceL = new THREE.Group(); faceL.position.set(leafW / 2, 0, 0); leafL.add(faceL);
    const faceR = new THREE.Group(); faceR.position.set(-leafW / 2, 0, 0); leafR.add(faceR);
    mkDoorFace(faceL, PLAN, mats, leafW, doorH, null, true, 0);  /* phone on left */
    mkDoorFace(faceR, PLAN, mats, leafW, doorH, null, false, 0);
    shell.add(leafL); shell.add(leafR);
    U.leafL = leafL; U.leafR = leafR;
    if (U0) { U0.leafL = leafL; U0.leafR = leafR; }

    /* ---- signs + sealed elevations on all four sides ---- */
    const sTex = signTex();
    const signM = basic(0xffffff, { map: sTex });
    const signY = PLAN.baseH + PLAN.bodyH - PLAN.signH / 2;
    const sides = [
      { yaw: 0,          z: hw,  x: 0,   front: true },
      { yaw: Math.PI,    z: -hw, x: 0,   front: false },
      { yaw: Math.PI / 2, z: 0,  x: hw,  front: false },
      { yaw: -Math.PI / 2,z: 0,  x: -hw, front: false }
    ];
    sides.forEach(s => {
      const g = new THREE.Group();
      g.position.set(s.x, 0, s.z);
      g.rotation.y = s.yaw;
      shell.add(g);
      /* sign box, flush under the cornice, full 49" width */
      box(PLAN.signW, PLAN.signH, 0.06, mats.signBack, 0, signY, 0.04, g);
      box(PLAN.signW + 0.03, PLAN.signH + 0.03, 0.03, mats.navyL, 0, signY, 0.02, g);
      const sign = box(PLAN.signW - 0.02, PLAN.signH - 0.02, 0.02, signM, 0, signY, 0.12, g);
      sign.renderOrder = 3;
      /* cornice above the sign */
      box(PLAN.bodyW - 0.02, 0.05, 0.08, mats.navyL, 0, PLAN.baseH + PLAN.bodyH + 0.02, 0.03, g);

      if (!s.front) {
        /* sealed elevation: two door-like leaves, same windows and panels */
        const mid = PLAN.divW;
        box(mid, doorH, 0.05, mats.navyL, 0, doorY0 + doorH / 2, 0.02, g);
        const fl = new THREE.Group(); fl.position.set(-(mid / 2 + leafW / 2), doorY0, 0.02); g.add(fl);
        const fr = new THREE.Group(); fr.position.set((mid / 2 + leafW / 2), doorY0, 0.02); g.add(fr);
        mkDoorFace(fl, PLAN, mats, leafW, doorH, null, false, 0);
        mkDoorFace(fr, PLAN, mats, leafW, doorH, null, false, 0);
      }
    });

    /* ---- roof stack, flush, no floating lamp ---- */
    const roofY0 = PLAN.baseH + PLAN.bodyH + 0.04;
    box(PLAN.roof1, 0.07, PLAN.roof1, mats.navy, 0, roofY0 + 0.035, 0, shell);
    const r2 = PLAN.roof1 - 2 * PLAN.inset;
    box(r2, 0.06, r2, mats.navyL, 0, roofY0 + 0.09, 0, shell);
    const pitch = PLAN.pitchH;
    /* stepped pyramid so the cap sits on the roof, no gap */
    box(r2 * 0.78, pitch * 0.55, r2 * 0.78, mats.navy, 0, roofY0 + 0.12 + pitch * 0.27, 0, shell);
    box(r2 * 0.52, pitch * 0.50, r2 * 0.52, mats.navyD, 0, roofY0 + 0.12 + pitch * 0.55 + pitch * 0.25, 0, shell);
    const capTop = roofY0 + 0.12 + pitch * 0.55 + pitch * 0.50;
    /* lantern platform, flush with the cap */
    const plat = 7.5 * INCH;
    box(plat, 0.04, plat, mats.lampMetal, 0, capTop + 0.02, 0, shell);

    /* lamp housing — sits ON the platform */
    const lampH = 8.5 * INCH, lampW = 5.2 * INCH;
    const lampY0 = capTop + 0.04;
    const lamp = new THREE.Group(); lamp.name = 'lamp1261';
    lamp.position.set(0, lampY0, 0); shell.add(lamp);
    box(lampW, 0.04, lampW, mats.lampMetal, 0, 0.02, 0, lamp);
    /* four glowing glass sides */
    const gh = lampH * 0.72, gw = lampW * 0.86, gd = 0.025;
    const glassY = 0.04 + gh / 2;
    [[0, lampW / 2], [0, -lampW / 2], [lampW / 2, 0], [-lampW / 2, 0]].forEach(([lx, lz], i) => {
      const yaw = (i < 2) ? 0 : Math.PI / 2;
      box(gw, gh, gd, mats.lampGlass, lx, glassY, lz, lamp, 0, yaw, 0);
    });
    /* corner posts of the lantern */
    const lw = 0.018;
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
      box(lw, gh, lw, mats.lampMetal, sx * (lampW / 2), glassY, sz * (lampW / 2), lamp);
    });
    /* pyramidal cap, flush on the glass */
    box(lampW * 1.05, 0.03, lampW * 1.05, mats.lampMetal, 0, 0.04 + gh + 0.015, 0, lamp);
    box(lampW * 0.62, lampH * 0.18, lampW * 0.62, mats.lampMetal, 0, 0.04 + gh + 0.03 + lampH * 0.09, 0, lamp);
    box(0.03, lampH * 0.12, 0.03, mats.lampMetal, 0, 0.04 + gh + 0.03 + lampH * 0.18 + lampH * 0.06, 0, lamp);
    /* glowing bulb + light */
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(lampW * 0.22, 12, 10), basic(0xb8ffff));
    bulb.position.set(0, glassY, 0); lamp.add(bulb);
    try {
      if (U._lampLt && U._lampLt.parent) U._lampLt.parent.remove(U._lampLt);
      const lt = new THREE.PointLight(0x66f0ff, 1.6, 8.5);
      lt.position.set(0, glassY, 0); lamp.add(lt); U._lampLt = lt;
    } catch (_) {}

    /* wrap 1260 door animation so it rotates OUR leaves */
    if (U0 && !U0._apply1261) {
      U0._apply1261 = 1;
      const prev = U0.applyDoors;
      U0.applyDoors = function () {
        try { if (typeof prev === 'function') prev.call(U0); } catch (_) {}
        try {
          const k = 1.75;
          if (U.leafL) U.leafL.rotation.y = -(U0.left || 0) * k;
          if (U.leafR) U.leafR.rotation.y = (U0.right || 0) * k;
        } catch (e) { ERR('doors', e); }
      };
    }

    U.built = 1;
    return shell;
  }

  function buildInterior(T, U0) {
    const room = T.parts && T.parts.room; if (!room) return;
    try { if (U0 && U0._inG && U0._inG.parent) U0._inG.parent.remove(U0._inG); } catch (_) {}
    try { if (U._inG && U._inG.parent) U._inG.parent.remove(U._inG); } catch (_) {}
    /* Hide any leftover ceiling DISC (1260 CircleGeometry or the original lid)
       so looking up is not a huge blank lavender plate. */
    try {
      room.traverse(o => {
        if (!o.isMesh && !o.isGroup) return;
        if (o.userData && o.userData.t1261) return;
        const nm = (o.name || '') + '';
        if (nm === 'rotor1260' || (o.userData && o.userData.t1260)) { o.visible = false; return; }
        const gt = o.geometry && (o.geometry.type || '');
        if (/CircleGeometry|CircleBufferGeometry/.test(gt)) {
          /* a large flat disc at the top of the room */
          o.visible = false;
        }
      });
    } catch (_) {}
    if (U0 && typeof U0.buildInterior === 'function' && !U0._int1261) {
      U0.buildInterior = function () { /* 1261 owns the ceiling now */ };
      U0._int1261 = 1;
    }

    const SM = (m) => {
      try {
        if (T.SM) T.SM(m);
        m.stencilFunc = T.camIn ? THREE.AlwaysStencilFunc : THREE.EqualStencilFunc;
        m.fog = false;
        if (T.RM) T.RM.push(m);
      } catch (_) {}
      return m;
    };
    const g = new THREE.Group(); g.name = 'rotor1261'; g.userData.t1261 = 1; U._inG = g;
    if (U0) U0._inG = g;
    const RR = T.RR, HW = T.HW, CZ = HW - RR, RH = T.RH || 16.5;

    /* tall walls — BackSide so we see them from inside */
    const wallCol = SM(new THREE.MeshLambertMaterial({ color: 0x2a1438, emissive: 0x1a0828, emissiveIntensity: 0.35 }));
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(RR - 0.02, RR - 0.02, RH, 48, 1, true), wallCol);
    wall.material.side = THREE.BackSide;
    wall.position.set(0, RH / 2, CZ); wall.frustumCulled = false; wall.renderOrder = 5; g.add(wall);

    /* CEILING: a gallery RING with a hole for the rotor — not a solid disc.
       Looking up, you see the column rise into a lit circular opening. */
    const holeR = 0.95;
    const ceilM = SM(new THREE.MeshLambertMaterial({ color: 0x1a0a24, emissive: 0x2a1038, emissiveIntensity: 0.35 }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(holeR, RR - 0.01, 48), ceilM);
    ring.rotation.x = Math.PI / 2; ring.position.set(0, RH - 0.04, CZ);
    ring.frustumCulled = false; ring.renderOrder = 5; g.add(ring);
    /* underside thickness */
    const ring2 = new THREE.Mesh(new THREE.CylinderGeometry(RR - 0.02, RR - 0.02, 0.12, 48, 1, true), ceilM);
    ring2.position.set(0, RH - 0.10, CZ); ring2.frustumCulled = false; g.add(ring2);

    /* radial ribs on the gallery */
    const ribM = SM(new THREE.MeshLambertMaterial({ color: 0x3a1850, emissive: 0x4a2068, emissiveIntensity: 0.4 }));
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      const rib = new THREE.Mesh(new THREE.BoxGeometry((RR - holeR) * 0.95, 0.06, 0.08), ribM);
      rib.position.set(Math.sin(a) * (holeR + RR) * 0.5, RH - 0.08, CZ + Math.cos(a) * (holeR + RR) * 0.5);
      rib.rotation.y = a; rib.frustumCulled = false; g.add(rib);
    }
    /* glowing collar around the rotor opening */
    const colM = SM(new THREE.MeshLambertMaterial({ color: 0xff88cc, emissive: 0xff66cc, emissiveIntensity: 1.1 }));
    const collar = new THREE.Mesh(new THREE.TorusGeometry(holeR, 0.05, 10, 32), colM);
    collar.rotation.x = Math.PI / 2; collar.position.set(0, RH - 0.05, CZ);
    collar.frustumCulled = false; g.add(collar);
    /* lit shaft ABOVE the hole so you look into light, not a blank lid */
    const shaftM = SM(new THREE.MeshLambertMaterial({ color: 0x3a1060, emissive: 0xaa44cc, emissiveIntensity: 0.7, side: THREE.BackSide }));
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(holeR * 0.98, holeR * 1.05, 3.2, 32, 1, true), shaftM);
    shaft.position.set(0, RH + 1.5, CZ); shaft.frustumCulled = false; g.add(shaft);
    const capM = SM(new THREE.MeshLambertMaterial({ color: 0xffccee, emissive: 0xff88dd, emissiveIntensity: 1.2 }));
    const cap = new THREE.Mesh(new THREE.CircleGeometry(holeR * 1.05, 32), capM);
    cap.rotation.x = Math.PI / 2; cap.position.set(0, RH + 3.1, CZ);
    cap.frustumCulled = false; g.add(cap);

    /* floor rim — keep the tartan visible */
    const rimM = SM(new THREE.MeshLambertMaterial({ color: 0x3a2048, emissive: 0x220818, emissiveIntensity: 0.2 }));
    const rim = new THREE.Mesh(new THREE.RingGeometry(RR - 0.45, RR - 0.02, 48), rimM);
    rim.rotation.x = -Math.PI / 2; rim.position.set(0, 0.02, CZ);
    rim.frustumCulled = false; rim.renderOrder = 5; g.add(rim);

    const hemi = new THREE.HemisphereLight(0xff88cc, 0x220844, 0.7); g.add(hemi);
    const pl = new THREE.PointLight(0xff66cc, 1.15, 22); pl.position.set(0, 4.2, CZ); g.add(pl);
    const pl2 = new THREE.PointLight(0x8844ff, 0.85, 18); pl2.position.set(0, RH - 0.4, CZ); g.add(pl2);
    const pl3 = new THREE.PointLight(0xffccee, 0.9, 8); pl3.position.set(0, RH + 1.2, CZ); g.add(pl3);

    /* roundels — 6 rows × 16 around, skip the doorway */
    const roundelM = SM(new THREE.MeshLambertMaterial({ color: 0x4a2860, emissive: 0xcc66aa, emissiveIntensity: 0.45 }));
    const roundelRim = SM(new THREE.MeshLambertMaterial({ color: 0x8a6070, emissive: 0x662244, emissiveIntensity: 0.2 }));
    const doorGap = Math.asin((T.DW + 0.2) / RR) * 2;
    const cols = 16, rows = 6;
    for (let r = 0; r < rows; r++) {
      const y = 1.35 + r * ((RH - 2.8) / (rows - 1));
      for (let i = 0; i < cols; i++) {
        const a = (i + 0.5) / cols * Math.PI * 2;
        if (a < doorGap * 0.7 || a > Math.PI * 2 - doorGap * 0.7) continue;
        const x = Math.sin(a) * (RR - 0.06);
        const z = CZ + Math.cos(a) * (RR - 0.06);
        const disc = new THREE.Mesh(new THREE.CircleGeometry(0.38, 20), roundelM);
        disc.position.set(x, y, z); disc.lookAt(0, y, CZ);
        disc.frustumCulled = false; disc.renderOrder = 6; g.add(disc);
        const rd = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 8, 20), roundelRim);
        rd.position.copy(disc.position); rd.rotation.copy(disc.rotation);
        rd.frustumCulled = false; rd.renderOrder = 6; g.add(rd);
      }
    }

    /* glowing rotor column — rises through the ceiling hole */
    const rotM = SM(new THREE.MeshLambertMaterial({ color: 0xffaaee, emissive: 0xff66cc, emissiveIntensity: 1.15, transparent: true, opacity: 0.92 }));
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, RH + 1.6, 20), rotM);
    col.position.set(0, (RH + 1.6) / 2, CZ); col.frustumCulled = false; col.name = 'rotorCol1261'; g.add(col);
    const innerM = SM(new THREE.MeshBasicMaterial({ color: 0xffe6ff, transparent: true, opacity: 0.7 }));
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, RH + 1.8, 12), innerM);
    inner.position.set(0, (RH + 1.8) / 2, CZ); inner.frustumCulled = false; g.add(inner);
    U._rotor = col;

    room.add(g);
  }

  /* ---- single hum: keep 1260's, silence v130's 250ms retrigger ---- */
  function silenceV130() {
    window.__glxSingleHum = 1;
    /* build-time also patches the v130 call site; this is a runtime belt. */
    try {
      const v = window.__v130;
      if (!v) return;
      /* If a hum is already going, try to fade any exposed gain. */
      if (v.humGain && v.humGain.gain) v.humGain.gain.value = 0;
    } catch (_) {}
    /* Wrap AudioContext oscillator creation after the fact: when v130's
       interval calls humOn(true), we cannot reach the closure. The build
       patches the condition to also require !window.__glxSingleHum. */
  }

  /* ---- extra touch pads ----
     1. The 3×2 TARDIS flight pad (Up/Fwd/Down/Left/Back/Right). 1.2.60 hid
        it by matching gridTemplateColumns === 'repeat(3, 54px)' WITH a space,
        but the style is set as 'repeat(3,54px)' and Safari computed-ifies it
        to '54px 54px 54px', so the pad came back. Match by button labels and
        any 3-column 54px grid, and lock display to none.
     2. The gold arrow D-pad (#dU/#dL/#dR) sits left of the joystick on
        touch — the leftover up/down/left/right pad the live phone shot still
        showed. Hide those three; keep #bDrop so a player can still drop. */
  function isFlightPad(d) {
    if (!d || !d.style) return false;
    if (d.dataset && d.dataset.t1261pad === '1') return true;
    const g = ((d.style.gridTemplateColumns || '') + ' ' + (d.style.cssText || '')).replace(/\s+/g, '');
    if (/repeat\(3,54px\)/.test(g)) return true;
    let computed = '';
    try { computed = (getComputedStyle(d).gridTemplateColumns || '').replace(/\s+/g, ''); } catch (_) {}
    if (/repeat\(3,54px\)/.test(computed) || /^54px54px54px/.test(computed)) {
      const kids = d.children ? d.children.length : 0;
      if (kids >= 6 && kids <= 9) return true;
    }
    const labels = [];
    try { for (let i = 0; i < (d.children || []).length; i++) labels.push(((d.children[i].textContent) || '').replace(/\s+/g, '')); } catch (_) {}
    if (labels.indexOf('Fwd') >= 0 && labels.indexOf('Back') >= 0) return true;
    if (labels.indexOf('Up') >= 0 && labels.indexOf('Down') >= 0 && labels.indexOf('Left') >= 0 && labels.indexOf('Right') >= 0 && labels.length <= 9) return true;
    return false;
  }
  function lockHidden(el) {
    if (!el || el._t1261lock) return;
    el._t1261lock = 1;
    if (el.dataset) el.dataset.t1261pad = '1';
    const hide = () => {
      try { el.style.setProperty('display', 'none', 'important'); } catch (_) { try { el.style.display = 'none'; } catch (__) {} }
      try { el.style.visibility = 'hidden'; el.hidden = true; } catch (_) {}
    };
    hide();
    /* Do not use a MutationObserver that re-sets style — that queues itself
       forever and freezes the page. The 250ms interval and the fly-toggle
       wrap keep the pad locked hidden. */
  }
  function hideExtraPads() {
    try {
      const nodes = document.querySelectorAll('div,section,nav');
      for (let i = 0; i < nodes.length; i++) {
        if (isFlightPad(nodes[i])) lockHidden(nodes[i]);
      }
      /* gold arrow D-pad (camera / swap / cycle) — leftover extra pad */
      ['dU', 'dL', 'dR'].forEach(id => {
        const el = document.getElementById(id);
        if (el) lockHidden(el);
      });
      /* also any element with class 'dp' that is an arrow and is not drop */
      try {
        document.querySelectorAll('.dp').forEach(el => {
          if (el.id === 'bDrop') return;
          lockHidden(el);
        });
      } catch (_) {}
    } catch (e) { ERR('pad', e); }
  }
  function wrapFlyToggle() {
    try {
      const T = window.__tbox3; if (!T) return;
      const F = T.F || window.tboxF || window.__tboxF;
      if (!F || F._t1261wrap) return;
      if (typeof F.toggle === 'function') {
        const orig = F.toggle.bind(F);
        F.toggle = function () {
          const r = orig();
          try {
            hideExtraPads();
            /* even if toggle just set the 3×2 pad to grid, lock it again */
            hideExtraPads();
          } catch (_) {}
          return r;
        };
        F._t1261wrap = 1;
      }
    } catch (e) { ERR('wrapTog', e); }
  }

  function tickRotor() {
    try {
      if (U._rotor) U._rotor.rotation.y += 0.012;
    } catch (_) {}
  }

  function boot() {
    try {
      if (typeof THREE === 'undefined') { setTimeout(boot, 80); return; }
      const T = window.__tbox;
      const U0 = window.__tbox1260;
      if (!T || !T.parts || !T.parts.all) { setTimeout(boot, 80); return; }
      if (U._booted) {
        /* already built; still keep pads hidden */
        hideExtraPads();
        return;
      }
      U._booted = 1;
      try { if (T.RH < 16) T.RH = 16.5; } catch (_) {}
      buildShell(T, U0);
      buildInterior(T, U0);
      silenceV130();
      hideExtraPads();
      wrapFlyToggle();
      setInterval(hideExtraPads, 250);
      setInterval(tickRotor, 50);
      setInterval(() => {
        try {
          const T = window.__tbox, S = T && T.S, sh = U._shell;
          if (!sh || !T) return;
          const on = !!(S && S.on) && !T.camIn;
          sh.visible = on;
          const old = T.parts && T.parts.all && T.parts.all.getObjectByName('tardis1260');
          if (old) old.visible = false;
        } catch (_) {}
      }, 50);
      /* wrap T.brand so a rebuild of the old box also rebuilds ours */
      try {
        if (T.brand && !T._brand1261) {
          const br = T.brand.bind(T);
          T.brand = function () { const r = br(); try { U._booted = 0; U._shell = null; boot(); } catch (_) {} return r; };
          T._brand1261 = 1;
        }
      } catch (_) {}
    } catch (e) { ERR('boot', e); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 50));
  else setTimeout(boot, 50);
  /* late retry if the TARDIS IIFE has not finished */
  setTimeout(boot, 400);
  setTimeout(boot, 1200);
})();
