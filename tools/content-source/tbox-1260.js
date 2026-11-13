/* GLX-TBOX1260 (v1.2.60): Series 1-4 police-box shell, tall rotor room,
   new flight controls, independent doors, cabin lock, hum, no blue travel cut. */
(function tbox1260() {
  const T = window.__tbox, C2 = window.__tbox2, F = window.__tbox3;
  if (!T || !T.parts) return;
  const U = window.__tbox1260 = {
    err: null, on: 1, version: '1.2.60', builtExt: 0, builtIn: 0,
    left: 0, right: 0, speed: 0, hum: 0, locked: 0, frames: 0
  };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const S = T.S;
  const THREE = window.THREE;
  if (!THREE) return;
  const INCH = (2 * (T.HW || 0.85)) / 55; /* body 55" maps to current box width */
  const PLAN = {
    baseW: 60.5 * INCH, bodyW: 55 * INCH, bodyH: 92 * INCH,
    postW: 5 * INCH, postH: 84 * INCH, doorH: 82.125 * INCH, divW: 1.75 * INCH,
    winW: 14.25 * INCH, winH: 7.625 * INCH, paneGap: 0.35 * INCH,
    panelW: 14.5 * INCH, panelH: 16.75 * INCH,
    phoneW: 11.25 * INCH, phoneH: 13.375 * INCH,
    signH: 6.75 * INCH, signW: 49 * INCH,
    roof1: 45.75 * INCH, inset: 3.375 * INCH, pitchH: 4.375 * INCH,
    baseH: 3.5 * INCH
  };
  U.PLAN = PLAN;
  T.RH = 16.5;
  const NAVY = 0x0a1638, NAVY_D = 0x071028, NAVY_P = 0x0d1d48, FRAME = 0x091022;
  const WARM = 0xffe1a8, BRASS = 0xc9a84a, BLUE_LAMP = 0x4a8cff;
  const cv = (w, h, fn) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    fn(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true; t.anisotropy = 8;
    return t;
  };
  const panelTex = cv(256, 256, (g, w, h) => {
    g.fillStyle = '#0c1a42'; g.fillRect(0, 0, w, h);
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, 'rgba(30,50,110,0.35)'); grd.addColorStop(1, 'rgba(0,0,0,0.25)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 6;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.strokeStyle = 'rgba(80,110,180,0.18)'; g.lineWidth = 2;
    g.strokeRect(16, 16, w - 32, h - 32);
    for (let i = 0; i < 80; i++) {
      g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.03) + ')';
      g.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 4);
    }
  });
  const navyM = () => new THREE.MeshLambertMaterial({ color: 0xffffff, map: panelTex });
  const navySolid = (hex) => new THREE.MeshLambertMaterial({ color: hex });
  const glassM = () => new THREE.MeshLambertMaterial({
    color: WARM, emissive: 0xcc9955, emissiveIntensity: 0.85, transparent: true, opacity: 0.92
  });
  const brassM = () => new THREE.MeshLambertMaterial({ color: BRASS, emissive: 0x3a2a08, emissiveIntensity: 0.25 });

  function signCallBox() {
    return cv(1024, 160, (g, w, h) => {
      g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#161616'; g.fillRect(8, 8, w - 16, h - 16);
      g.fillStyle = '#f4f1e6'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = 'bold 72px "Times New Roman", Times, serif';
      g.fillText('POLICE', w * 0.16, h * 0.54);
      g.fillText('BOX', w * 0.84, h * 0.54);
      g.font = 'bold 36px "Times New Roman", Times, serif';
      g.fillText('PUBLIC', w * 0.50, h * 0.36);
      g.fillText('CALL', w * 0.50, h * 0.68);
    });
  }
  function signPhone() {
    const t = cv(1024, 1280, (g, w, h) => {
      g.fillStyle = '#0a0804'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#d8b44a'; g.fillRect(16, 16, w - 32, h - 32);
      g.fillStyle = '#0a0804'; g.fillRect(36, 36, w - 72, h - 72);
      g.fillStyle = '#f6e6b0'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const lines = [
        [100, 'bold 86px sans-serif', 'POLICE TELEPHONE'],
        [78, 'bold 52px sans-serif', 'FREE FOR USE OF'],
        [100, 'bold 96px sans-serif', 'PUBLIC'],
        [68, 'bold 48px sans-serif', 'ADVICE & ASSISTANCE'],
        [68, 'bold 48px sans-serif', 'OBTAINABLE IMMEDIATELY'],
        [68, 'bold 48px sans-serif', 'OFFICERS & CARS'],
        [78, 'bold 48px sans-serif', 'RESPOND TO ALL CALLS'],
        [90, 'bold 72px sans-serif', 'PULL TO OPEN']
      ];
      let y = 130;
      for (const [sp, font, text] of lines) { g.font = font; g.fillText(text, w / 2, y); y += sp; }
    });
    t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
    return t;
  }

  const box = (w, h, d, m, x, y, z, p) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z); o.frustumCulled = false; (p || shell).add(o); return o;
  };

  let shell = null, leafL = null, leafR = null, lampMesh = null, signT = null, phoneT = null;
  let rotorCore = null, rotorGlow = null, driveArms = null;

  function hideOldShell() {
    try {
      const ext = T.parts.ext, doors = T.parts.doors;
      if (ext) ext.traverse(o => { if (o.isMesh && !(o.userData && o.userData.t1260)) o.visible = false; });
      if (doors) doors.traverse(o => { if (o.isMesh && !(o.userData && o.userData.t1260)) o.visible = false; });
      if (ext) ext.visible = true;
    } catch (e) { ERR('hide', e); }
  }

  function sixPane(parent, x, y, z, w, h, depth, yaw) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw || 0; parent.add(g);
    const frame = navySolid(FRAME);
    const glass = glassM();
    const t = 0.012, bar = 0.010;
    box(w, h, depth, frame, 0, 0, 0, g);
    const iw = w - t * 2, ih = h - t * 2;
    const cw = (iw - 2 * bar) / 3, ch = (ih - bar) / 2;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const px = (c - 1) * (cw + bar), py = (r === 0 ? 1 : -1) * (ch + bar) * 0.5;
      box(cw * 0.96, ch * 0.96, depth + 0.006, glass, px, py, depth * 0.35, g);
    }
    box(w + 0.004, t, depth + 0.008, frame, 0, 0, 0, g);
    box(bar, ih, depth + 0.008, frame, -cw * 0.5 - bar * 0.5, 0, 0, g);
    box(bar, ih, depth + 0.008, frame, cw * 0.5 + bar * 0.5, 0, 0, g);
    return g;
  }

  function recessedPanel(parent, x, y, z, w, h, d, yaw) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw || 0; parent.add(g);
    box(w, h, d, navySolid(NAVY_D), 0, 0, 0, g);
    box(w - 0.03, h - 0.03, d + 0.006, navyM(), 0, 0, 0.004, g);
    return g;
  }

  function buildElevation(parent, yaw, isFront) {
    const g = new THREE.Group(); g.rotation.y = yaw; parent.add(g);
    const hw = PLAN.bodyW / 2, faceZ = hw + 0.004;
    const midY = PLAN.baseH + PLAN.doorH / 2;
    const divX = 0;
    const doorW = (PLAN.bodyW - 2 * PLAN.postW - PLAN.divW) / 2;
    const leftC = -PLAN.divW / 2 - doorW / 2;
    const rightC = PLAN.divW / 2 + doorW / 2;
    const winY = PLAN.baseH + PLAN.doorH - PLAN.winH / 2 - 1.2 * INCH;
    const p1y = winY - PLAN.winH / 2 - 0.8 * INCH - PLAN.panelH / 2;
    const p2y = p1y - PLAN.panelH - 0.7 * INCH;
    const p3y = p2y - PLAN.panelH - 0.7 * INCH;
    box(PLAN.divW, PLAN.doorH, 0.06, navySolid(NAVY_D), 0, PLAN.baseH + PLAN.doorH / 2, faceZ, g);
    const mkDoorFace = (cx, leaf) => {
      const host = leaf || g;
      const lz = leaf ? 0 : faceZ;
      const lyOff = leaf ? PLAN.baseH : 0;
      sixPane(host, leaf ? (cx > 0 ? -doorW / 2 : doorW / 2) + (cx - (cx > 0 ? rightC : leftC)) : cx, winY - lyOff, lz, PLAN.winW, PLAN.winH, 0.05, 0);
      const panels = [p1y, p2y, p3y];
      for (let i = 0; i < 3; i++) {
        const isPhone = isFront && cx < 0 && i === 0;
        const px = leaf ? (cx < 0 ? -doorW / 2 + doorW / 2 : doorW / 2 - doorW / 2) : cx;
        /* leaf-local x is -sx * doorW/2 from hinge: we place in leaf space below */
        recessedPanel(host, leaf ? (cx < 0 ? doorW / 2 * 0 + (leftC - cx) : (rightC - cx)) : cx,
          panels[i] - lyOff, lz, PLAN.panelW, PLAN.panelH, 0.045, 0);
        if (isPhone) {
          const pl = new THREE.Mesh(new THREE.PlaneGeometry(PLAN.phoneW, PLAN.phoneH),
            new THREE.MeshLambertMaterial({ map: phoneT, color: 0xffffff }));
          pl.position.set(leaf ? 0 : cx, panels[i] - lyOff, (leaf ? 0 : faceZ) + 0.028);
          pl.frustumCulled = false; pl.userData.t1260 = 1; host.add(pl);
        }
      }
    };
    if (isFront) {
      /* lintel between the door tops and the sign box; leaves fill the opening */
      box(PLAN.bodyW - 2 * PLAN.postW, 2.2 * INCH, 0.06, navySolid(NAVY_P), 0, PLAN.baseH + PLAN.doorH + 1.1 * INCH, faceZ, g);
    } else {
      box(PLAN.bodyW - 2 * PLAN.postW, PLAN.doorH, 0.05, navyM(), 0, PLAN.baseH + PLAN.doorH / 2, faceZ - 0.02, g);
      mkDoorFace(leftC, null);
      mkDoorFace(rightC, null);
    }
    /* sign box */
    const signY = PLAN.baseH + PLAN.bodyH - PLAN.signH / 2;
    box(PLAN.signW, PLAN.signH, 0.14, navySolid(NAVY_D), 0, signY, faceZ + 0.05, g);
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(PLAN.signW - 0.04, PLAN.signH - 0.04),
      new THREE.MeshLambertMaterial({ map: signT, color: 0xffffff }));
    sg.position.set(0, signY, faceZ + 0.125); sg.frustumCulled = false; sg.userData.t1260 = 1; g.add(sg);
    return { g, leftC, rightC, doorW, faceZ, winY, p1y, p2y, p3y, midY };
  }

  function makeLeaf(sx, ev) {
    const hg = new THREE.Group();
    const hingeX = sx < 0 ? ev.leftC - ev.doorW / 2 : ev.rightC + ev.doorW / 2;
    hg.position.set(hingeX, 0, ev.faceZ);
    hg.userData.sx = sx; hg.userData.t1260 = 1;
    const leaf = new THREE.Group(); leaf.position.set(-sx * ev.doorW / 2, 0, 0); hg.add(leaf);
    const navy = navyM(), dark = navySolid(NAVY_D), gl = glassM();
    box(ev.doorW, PLAN.doorH, 0.055, navy, 0, PLAN.baseH + PLAN.doorH / 2, 0, leaf);
    sixPane(leaf, 0, ev.winY, 0.03, PLAN.winW, PLAN.winH, 0.05, 0);
    const panels = [ev.p1y, ev.p2y, ev.p3y];
    for (let i = 0; i < 3; i++) {
      recessedPanel(leaf, 0, panels[i], 0.02, PLAN.panelW, PLAN.panelH, 0.04, 0);
      if (sx < 0 && i === 0) {
        /* plaque sits clearly in front of the recessed panel (which ends ~z=0.047) */
        const frame = box(PLAN.phoneW + 0.028, PLAN.phoneH + 0.028, 0.016, brassM(), 0, panels[i], 0.052, leaf);
        frame.userData.t1260 = 1;
        const pl = new THREE.Mesh(
          new THREE.BoxGeometry(PLAN.phoneW, PLAN.phoneH, 0.012),
          new THREE.MeshLambertMaterial({
            map: phoneT, color: 0xffffff, emissive: 0x3a2e10, emissiveIntensity: 0.28
          })
        );
        pl.position.set(0, panels[i], 0.062);
        pl.frustumCulled = false; pl.userData.t1260 = 1; pl.userData.phone1260 = 1;
        leaf.add(pl);
      }
    }
    const handle = box(0.025, 0.09, 0.04, brassM(), -sx * (ev.doorW / 2 - 0.06), PLAN.baseH + 1.05, 0.04, leaf);
    handle.userData.t1260 = 1;
    hg.traverse(o => { if (o.isMesh) { o.userData.t1260 = 1; o.frustumCulled = false; } });
    return hg;
  }

  function buildShell() {
    try {
      const all = T.parts.all; if (!all) return;
      if (shell && shell.parent) shell.parent.remove(shell);
      shell = new THREE.Group(); shell.name = 'tardis1260'; shell.userData.t1260 = 1;
      signT = signT || signCallBox(); phoneT = phoneT || signPhone();
      const navy = navyM(), dark = navySolid(NAVY_D), postM = navySolid(NAVY_P);
      const hw = PLAN.bodyW / 2, pw = PLAN.postW;
      /* base plinth */
      box(PLAN.baseW, PLAN.baseH, PLAN.baseW, dark, 0, PLAN.baseH / 2, 0, shell);
      /* corner posts */
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box(pw, PLAN.postH, pw, postM, sx * (hw - pw / 2 + 0.004), PLAN.baseH + PLAN.postH / 2, sz * (hw - pw / 2 + 0.004), shell);
      }
      /* four elevations: front +Z, back -Z, right +X, left -X */
      const evF = buildElevation(shell, 0, true);
      buildElevation(shell, Math.PI, false);
      buildElevation(shell, Math.PI / 2, false);
      buildElevation(shell, -Math.PI / 2, false);
      leafL = makeLeaf(-1, evF); leafR = makeLeaf(1, evF);
      shell.add(leafL); shell.add(leafR);
      U.leafL = leafL; U.leafR = leafR;
      /* roof steps and shallow pitch */
      const roofY0 = PLAN.baseH + PLAN.bodyH;
      box(PLAN.roof1, 0.06, PLAN.roof1, dark, 0, roofY0 + 0.03, 0, shell);
      const r2 = PLAN.roof1 - 2 * PLAN.inset;
      box(r2, 0.05, r2, dark, 0, roofY0 + 0.08, 0, shell);
      /* shallow pitched roof (~12.4 degrees) as a low pyramid of boxes */
      const pitch = PLAN.pitchH;
      box(r2 * 0.72, pitch, r2 * 0.72, navySolid(0x1a2240), 0, roofY0 + 0.10 + pitch / 2, 0, shell);
      box(r2 * 0.42, pitch * 0.55, r2 * 0.42, navySolid(0x1a2240), 0, roofY0 + 0.10 + pitch + pitch * 0.2, 0, shell);
      /* lantern + blue lamp */
      const ly = roofY0 + 0.10 + pitch + 0.08;
      box(0.16, 0.04, 0.16, dark, 0, ly, 0, shell);
      const lantern = box(0.13, 0.22, 0.13, glassM(), 0, ly + 0.14, 0, shell);
      lantern.material = new THREE.MeshLambertMaterial({ color: BLUE_LAMP, emissive: BLUE_LAMP, emissiveIntensity: 1.1 });
      lantern.userData.lamp = 1; lampMesh = lantern; U.lamp = lantern; T.lamp = lantern;
      box(0.16, 0.04, 0.16, dark, 0, ly + 0.28, 0, shell);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.10, 4), navySolid(NAVY_D));
      cap.position.set(0, ly + 0.36, 0); cap.rotation.y = Math.PI / 4; cap.frustumCulled = false; shell.add(cap);
      try {
        if (!U.light) {
          U.light = new THREE.PointLight(BLUE_LAMP, 0.9, 8);
          U.light.position.set(0, ly + 0.14, 0);
          shell.add(U.light);
        }
      } catch (_) {}
      shell.traverse(o => { o.frustumCulled = false; if (o.isMesh) o.userData.t1260 = 1; });
      all.add(shell);
      hideOldShell();
      U.builtExt = 1;
    } catch (e) { ERR('ext', e); }
  }

  /* ---------- tall rotor-room interior ---------- */
  function hideOldInteriorPieces() {
    try {
      const room = T.parts.room; if (!room) return;
      room.traverse(o => {
        if (!o.isMesh) return;
        if (o.userData && (o.userData.t1260 || o.userData.cab)) return;
        const n = (o.name || '') + (o.parent && o.parent.name || '');
        /* keep console desk, screen, stick — hide short old walls, tartan only if we replace */
      });
    } catch (e) { ERR('hideIn', e); }
  }

  function buildInterior() {
    try {
      const room = T.parts.room; if (!room) return;
      if (U._inG && U._inG.parent) U._inG.parent.remove(U._inG);
      const SM = (m) => { try { if (T.SM) T.SM(m); m.stencilFunc = T.camIn ? THREE.AlwaysStencilFunc : THREE.EqualStencilFunc; m.fog = false; if (T.RM) T.RM.push(m); } catch (_) {} return m; };
      const g = new THREE.Group(); g.name = 'rotor1260'; g.userData.t1260 = 1; U._inG = g;
      const RR = T.RR, HW = T.HW, CZ = HW - RR, RH = T.RH;
      /* hide the original short cylinder wall and ceiling by covering them with taller ones */
      const wallCol = SM(new THREE.MeshLambertMaterial({ color: 0x2a1438, emissive: 0x1a0828, emissiveIntensity: 0.35 }));
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(RR - 0.02, RR - 0.02, RH, 48, 1, true), wallCol);
      wall.material.side = THREE.BackSide;
      wall.position.set(0, RH / 2, CZ); wall.frustumCulled = false; wall.renderOrder = 5; g.add(wall);
      /* ceiling */
      const ceilM = SM(new THREE.MeshLambertMaterial({ color: 0x1a0a24, emissive: 0x3a1048, emissiveIntensity: 0.4 }));
      const ceil = new THREE.Mesh(new THREE.CircleGeometry(RR, 48), ceilM);
      ceil.rotation.x = Math.PI / 2; ceil.position.set(0, RH - 0.02, CZ);
      ceil.frustumCulled = false; ceil.renderOrder = 5; g.add(ceil);
      /* floor ring (keep tartan visible; add a dark coral rim) */
      const rimM = SM(new THREE.MeshLambertMaterial({ color: 0x3a2048, emissive: 0x220818, emissiveIntensity: 0.2 }));
      const rim = new THREE.Mesh(new THREE.RingGeometry(RR - 0.45, RR - 0.02, 48), rimM);
      rim.rotation.x = -Math.PI / 2; rim.position.set(0, 0.02, CZ);
      rim.frustumCulled = false; rim.renderOrder = 5; g.add(rim);
      /* purple / pink lighting */
      const hemi = new THREE.HemisphereLight(0xff88cc, 0x220844, 0.7);
      g.add(hemi);
      const pl = new THREE.PointLight(0xff66cc, 1.15, 22);
      pl.position.set(0, 4.2, CZ); g.add(pl);
      const pl2 = new THREE.PointLight(0x8844ff, 0.7, 18);
      pl2.position.set(0, 11, CZ); g.add(pl2);
      /* roundels lining the walls — 5 rows x 16 around, skip the doorway sector */
      const roundelM = SM(new THREE.MeshLambertMaterial({ color: 0x4a2860, emissive: 0xcc66aa, emissiveIntensity: 0.45 }));
      const roundelRim = SM(new THREE.MeshLambertMaterial({ color: 0x8a6070, emissive: 0x662244, emissiveIntensity: 0.2 }));
      const doorGap = Math.asin((T.DW + 0.2) / RR) * 2;
      const cols = 16, rows = 5;
      for (let r = 0; r < rows; r++) {
        const y = 1.5 + r * ((RH - 2.6) / (rows - 1));
        for (let i = 0; i < cols; i++) {
          const a = (i + 0.5) / cols * Math.PI * 2;
          /* doorway is toward +Z in room space? door at z=HW, center at CZ, so door angle is toward +Z from room center = 0 if cos is +Z */
          const towardDoor = Math.atan2(0 - 0, HW - CZ); /* +Z */
          let ang = a;
          const dAng = Math.atan2(Math.sin(a - 0), Math.cos(a)); /* a is from +X? Cylinder: we place with sin(a)*R on X, cos(a)*R on Z, so a=0 is +Z (door). */
          if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < doorGap * 0.7 && a < doorGap * 0.7 || a > Math.PI * 2 - doorGap * 0.7) {
            /* skip doorway column on the front */
            if (r < 2) continue;
          }
          const x = Math.sin(a) * (RR - 0.06), z = CZ + Math.cos(a) * (RR - 0.06);
          const disc = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), roundelM);
          disc.position.set(x, y, z); disc.lookAt(0, y, CZ);
          disc.frustumCulled = false; disc.renderOrder = 6; g.add(disc);
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.04, 6, 24), roundelRim);
          ring.position.copy(disc.position); ring.quaternion.copy(disc.quaternion);
          ring.frustumCulled = false; ring.renderOrder = 6; g.add(ring);
        }
      }
      /* tall glowing time-rotor column to the ceiling */
      const rotor = new THREE.Group(); rotor.position.set(0, 0, CZ); g.add(rotor);
      const glass = SM(new THREE.MeshPhongMaterial({
        color: 0xeeaacc, emissive: 0x661144, transparent: true, opacity: 0.28,
        shininess: 140, specular: 0xffddee, side: THREE.DoubleSide
      }));
      const tubeH = RH - 1.35;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, tubeH, 24, 1, true), glass);
      tube.position.y = 1.15 + tubeH / 2; tube.frustumCulled = false; tube.renderOrder = 7; rotor.add(tube);
      const energy = SM(new THREE.MeshBasicMaterial({ color: 0xff66cc, transparent: true, opacity: 0.85 }));
      rotorCore = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, tubeH - 0.3, 12), energy);
      rotorCore.position.y = 1.15 + tubeH / 2; rotorCore.frustumCulled = false; rotorCore.renderOrder = 7; rotor.add(rotorCore);
      const glowM = SM(new THREE.MeshBasicMaterial({ color: 0xaa44ff, transparent: true, opacity: 0.35 }));
      rotorGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, tubeH - 0.5, 12), glowM);
      rotorGlow.position.y = rotorCore.position.y; rotorGlow.frustumCulled = false; rotorGlow.renderOrder = 7; rotor.add(rotorGlow);
      const chrome = SM(new THREE.MeshPhongMaterial({ color: 0xd8dde8, emissive: 0x2a1040, shininess: 160, specular: 0xffffff }));
      for (const yy of [1.15, 1.15 + tubeH]) {
        const t = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.055, 8, 24), chrome);
        t.rotation.x = Math.PI / 2; t.position.y = yy; t.frustumCulled = false; t.renderOrder = 7; rotor.add(t);
      }
      /* inner rings travelling up the column (animated) */
      U._rings = [];
      for (let i = 0; i < 4; i++) {
        const rg = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.025, 6, 16),
          SM(new THREE.MeshBasicMaterial({ color: 0xff99dd, transparent: true, opacity: 0.8 })));
        rg.rotation.x = Math.PI / 2; rg.frustumCulled = false; rg.renderOrder = 8;
        rotor.add(rg); U._rings.push(rg);
      }
      U.rotor = rotor;
      /* hide the short original crystal column if present */
      try { if (T.col) T.col.visible = false; } catch (_) {}
      try {
        const v = window.__v130 && window.__v130.parts && window.__v130.parts();
        /* leave the pilot stick; the short tube is a sibling at room origin — hide short cylinders near console top */
      } catch (_) {}
      room.add(g);
      U.builtIn = 1;
    } catch (e) { ERR('int', e); }
  }

  /* ---------- doors: both start shut, LT / USE toggles the one you look at ---------- */
  U.left = 0; U.right = 0;
  function applyDoors() {
    const k = 1.75;
    try { if (leafL) leafL.rotation.y = -U.left * k; } catch (_) {}
    try { if (leafR) leafR.rotation.y = U.right * k; } catch (_) {}
    T.door = Math.max(U.left, U.right);
    try {
      const mask = T.parts.mask;
      if (mask) {
        const open = T.door > 0.05;
        /* if only one leaf is open, slide the mask to that half */
        const DW = T.DW || 0.5, DH = 2.05, HW = T.HW;
        if (U.left > 0.05 && U.right < 0.05) { mask.position.x = -DW / 2; mask.scale.set(0.5, 1, 1); }
        else if (U.right > 0.05 && U.left < 0.05) { mask.position.x = DW / 2; mask.scale.set(0.5, 1, 1); }
        else { mask.position.x = 0; mask.scale.set(1, 1, 1); }
        mask.visible = open && !T.camIn;
      }
    } catch (_) {}
  }
  function lookingAtDoor() {
    try {
      if (!S.on) return null;
      const eye = (typeof EYE === 'number' ? EYE : 1.62);
      const ox = P.x, oy = P.y + eye, oz = P.z;
      let lx = 0, ly = 0, lz = 1;
      try {
        if (typeof lookDir === 'function') { const d = lookDir(); lx = d.x; ly = d.y; lz = d.z; }
        else { lx = -Math.sin(P.yaw) * Math.cos(P.pitch); ly = Math.sin(P.pitch); lz = -Math.cos(P.yaw) * Math.cos(P.pitch); }
      } catch (_) {}
      const HW = T.HW, DW = T.DW || 0.5;
      const fz = S.z + HW;
      const candidates = [
        { id: 'left', x: S.x - DW / 2, y: S.y + 1.1, z: fz },
        { id: 'right', x: S.x + DW / 2, y: S.y + 1.1, z: fz }
      ];
      let best = null, bestS = 0.55;
      for (const c of candidates) {
        const dx = c.x - ox, dy = c.y - oy, dz = c.z - oz;
        const dist = Math.hypot(dx, dy, dz) || 1;
        if (dist > 4.2) continue;
        const nd = (dx * lx + dy * ly + dz * lz) / dist;
        if (nd > bestS) { bestS = nd; best = c.id; }
      }
      return best;
    } catch (e) { ERR('look', e); return null; }
  }
  U.lookingAtDoor = lookingAtDoor;
  function toggleDoor(which) {
    if (!which) return;
    if (which === 'left') U.left = U.left > 0.5 ? 0 : 1;
    else U.right = U.right > 0.5 ? 0 : 1;
    applyDoors();
    U.toggles = (U.toggles || 0) + 1;
    try { toast(which === 'left' ? (U.left > 0.5 ? 'Left door open' : 'Left door shut') : (U.right > 0.5 ? 'Right door open' : 'Right door shut')); } catch (_) {}
  }
  U.toggleDoor = toggleDoor;
  try {
    const ui = useItem;
    useItem = function () {
      try {
        if (!(typeof menuOpen !== 'undefined' && menuOpen) && !(typeof paused !== 'undefined' && paused) && !(F && F.pilot)) {
          const d = lookingAtDoor();
          if (d) { toggleDoor(d); return; }
        }
      } catch (e) { ERR('use', e); }
      return ui.apply(this, arguments);
    };
  } catch (e) { ERR('uiw', e); }
  let prevLT = 0;
  function pollLT() {
    try {
      const g = navigator.getGamepads ? [...navigator.getGamepads()].find(p => p) : null;
      const lt = g && g.buttons[6] && (g.buttons[6].pressed || g.buttons[6].value > 0.5);
      if (lt && !prevLT && !(F && F.pilot)) {
        const d = lookingAtDoor(); if (d) toggleDoor(d);
      }
      prevLT = lt;
    } catch (_) {}
  }

  /* wrap walls so you only walk through an open leaf, and can't be ejected while piloting */
  try {
    const up0 = updatePlayer;
    updatePlayer = function (dt) {
      const pil = !!(F && F.pilot && T.inside && S.on);
      const pre = pil ? { x: S.x, y: S.y, z: S.z, H: F.H, Pt: F.Pt, v: F.v && F.v.slice ? F.v.slice() : [0, 0, 0] } : null;
      if (pil) {
        T.inside = true;
        const CZ = T.HW - T.RR;
        P.x = S.x; P.y = S.y; P.z = S.z + CZ + 2.0; P.vy = 0; P.fallTop = null;
      }
      /* skip the original fly, we own it */
      const was = pil ? F.pilot : false;
      if (was) F.pilot = false;
      const r = up0.apply(this, arguments);
      if (was) F.pilot = true;
      try {
        if (was) {
          /* undo any accidental box move from a leftover, then our fly */
          fly1260(Math.min(0.1, dt || 0.016));
          lockSeat();
          U.locked++;
          try { placeCamera(0, 0, 0, 0); } catch (_) {}
        } else if (T.inside && S.on) {
          /* free walk: if doors are shut, bounce at the threshold */
          doorWalls();
        }
      } catch (e) { ERR('up', e); }
      return r;
    };
  } catch (e) { ERR('upw', e); }

  function doorWalls() {
    if (!S.on || (typeof DIM !== 'undefined' && DIM.cur)) return;
    if (F && F.pilot) return;
    const HW = T.HW, DW = T.DW || 0.5, R = 0.32, fz = S.z + HW, dx = P.x - S.x;
    const leftOpen = U.left > 0.6, rightOpen = U.right > 0.6;
    const atDoor = Math.abs(dx) < DW && P.z > fz - 0.9 && P.z < fz + 0.5;
    if (T.inside) {
      if (P.z > fz + 0.02) {
        const allow = (dx < 0 && leftOpen) || (dx >= 0 && rightOpen);
        if (allow) T.inside = false;
        else { P.z = fz - 0.02; if (P.vz) P.vz = 0; }
        return;
      }
    } else {
      if (atDoor && ((dx < 0 && leftOpen) || (dx >= 0 && rightOpen))) {
        if (P.z < fz - 0.02 && Math.abs(P.y - S.y) < 0.6) T.inside = true;
      }
    }
  }

  function lockSeat() {
    if (!(F && F.pilot) || !S.on) return;
    const CZ = T.HW - T.RR;
    T.inside = true;
    P.x = S.x; P.y = S.y; P.z = S.z + CZ + 2.0;
    P.vy = 0; P.fallTop = null;
    try { P.yaw = 0; P.pitch = -0.06; } catch (_) {}
  }
  U.lockSeat = lockSeat;

  /* ---------- flight: left stick fly, right turn/tilt, Jump up, Down sink, LS/Sprint x10, no cap, ease ---------- */
  const K = U._keys = U._keys || {};
  try {
    addEventListener('keydown', e => { K[e.code] = 1; }, true);
    addEventListener('keyup', e => { K[e.code] = 0; }, true);
  } catch (_) {}
  const blocked = (x, y, z) => {
    T.__raw = 1;
    try {
      const HW = T.HW;
      for (const [ox, oz] of [[-HW, -HW], [HW, -HW], [-HW, HW], [HW, HW], [0, 0]])
        for (const oy of [0.1, 1.3, 2.5])
          if (typeof solid === 'function' && solid(Math.floor(x + ox), Math.floor(y + oy), Math.floor(z + oz))) return true;
    } finally { T.__raw = 0; }
    return false;
  };
  U.turnV = 0; U.pitchV = 0;
  function fly1260(dt) {
    const g = navigator.getGamepads ? [...navigator.getGamepads()].find(p => p) : null;
    const ax = i => g && Math.abs(g.axes[i] || 0) > 0.15 ? g.axes[i] : 0;
    const bt = i => g && g.buttons[i] && g.buttons[i].pressed ? 1 : 0;
    const LSb = bt(10);
    let sprint = false;
    try { sprint = !!(typeof sprintTouch !== 'undefined' && sprintTouch) || !!(typeof sprinting !== 'undefined' && sprinting) || !!(typeof sprintPad !== 'undefined' && sprintPad) || !!(typeof sprintShift !== 'undefined' && sprintShift); } catch (_) {}
    const boost = (LSb || sprint) ? 10 : 1;
    const lx = ax(0), ly = ax(1), rx = ax(2), ry = ax(3);
    const st = lx;                       /* left stick X: strafe */
    const f = -ly + ((K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0)); /* left stick Y / WS: fly */
    const tr = -rx + ((K.KeyA ? 1 : 0) - (K.KeyD ? 1 : 0)); /* right stick X: turn */
    const pr = -ry + ((K.ArrowUp ? 1 : 0) - (K.ArrowDown ? 1 : 0)); /* right stick Y: tilt */
    const up = (K.Space ? 1 : 0) - (K.ShiftLeft || K.ShiftRight ? 1 : 0) + bt(0) - bt(1);
    /* ease turn and pitch, quicker than the old 1.3 rad/s */
    const turnT = tr * 2.6, pitchT = pr * 1.8;
    const ease = 1 - Math.exp(-dt * 9);
    U.turnV += (turnT - U.turnV) * ease;
    U.pitchV += (pitchT - U.pitchV) * ease;
    F.H = (F.H || 0) + U.turnV * dt;
    F.Pt = Math.max(-1.48, Math.min(1.48, (F.Pt || 0) + U.pitchV * dt));
    F.inp = [Math.max(-1, Math.min(1, -tr)), Math.max(-1, Math.min(1, -pr))];
    /* accelerate with no top speed while the stick is held */
    const cP = Math.cos(F.Pt || 0), sP = Math.sin(F.Pt || 0);
    const fwdX = -Math.sin(F.H) * cP, fwdY = sP, fwdZ = -Math.cos(F.H) * cP;
    const rightX = Math.cos(F.H), rightZ = -Math.sin(F.H);
    const wishX = fwdX * f + rightX * st;
    const wishY = fwdY * f + up * 0.85;
    const wishZ = fwdZ * f + rightZ * st;
    const wLen = Math.hypot(wishX, wishY, wishZ);
    if (!F.v) F.v = [0, 0, 0];
    const acc = 16 * boost;
    if (wLen > 0.08) {
      F.v[0] += (wishX / wLen) * acc * dt;
      F.v[1] += (wishY / wLen) * acc * dt;
      F.v[2] += (wishZ / wLen) * acc * dt;
    } else {
      const damp = Math.exp(-dt * 1.6);
      F.v[0] *= damp; F.v[1] *= damp; F.v[2] *= damp;
    }
    U.speed = Math.hypot(F.v[0], F.v[1], F.v[2]);
    if (LSb && !U._ls) { try { F.whooshP && F.whooshP(0.9); } catch (_) {} try { window.__v130 && __v130.boosts++; } catch (_) {} }
    U._ls = LSb;
    let nx = S.x, ny = S.y, nz = S.z;
    const ddx = F.v[0] * dt, ddy = F.v[1] * dt, ddz = F.v[2] * dt;
    const n = Math.min(64, Math.max(1, Math.ceil(Math.max(Math.abs(ddx), Math.abs(ddy), Math.abs(ddz)) / 1.0)));
    for (let k = 0; k < n; k++) {
      const ax = nx + ddx / n, ay = ny + ddy / n, az = nz + ddz / n;
      if (window.__ukb && __ukb.wall && __ukb.wall(ax, ay + 1, az)) { F.v[0] = F.v[2] = 0; break; }
      if (F.v[0] && blocked(ax, ny, nz)) F.v[0] = 0; else if (F.v[0]) nx = ax;
      if (F.v[2] && blocked(nx, ny, az)) F.v[2] = 0; else if (F.v[2]) nz = az;
      if (F.v[1] && blocked(nx, ay, nz)) { if (F.v[1] < -6) try { F.thump && F.thump(); } catch (_) {} F.v[1] = 0; }
      else if (F.v[1]) ny = ay;
    }
    T.place(nx, ny, nz);
    lockSeat();
    engineTick();
  }
  U.fly = fly1260;

  /* hide the extra up/down/left/right touch pad */
  try {
    document.querySelectorAll('div').forEach(d => {
      if (d.style && d.style.gridTemplateColumns === 'repeat(3, 54px)') d.style.display = 'none';
    });
  } catch (_) {}
  try {
    const t0 = F && F.toggle;
    if (t0 && !F.__t1260) {
      F.toggle = function () {
        const r = t0.apply(this, arguments);
        try {
          document.querySelectorAll('div').forEach(d => {
            if (d.style && d.style.gridTemplateColumns === 'repeat(3, 54px)') d.style.display = 'none';
          });
        } catch (_) {}
        return r;
      };
      F.__t1260 = 1;
    }
  } catch (_) {}

  /* drive-mode arms at the bottom, hands hidden */
  function ensureDriveArms() {
    if (driveArms) return driveArms;
    try {
      driveArms = new THREE.Group(); driveArms.name = 'driveArms1260'; driveArms.userData.t1260 = 1;
      const linen = new THREE.MeshLambertMaterial({ color: 0xf0ebe0 });
      for (const side of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.052, 0.55, 12), linen);
        arm.position.set(side * 0.30, -0.48, -0.38);
        arm.rotation.x = 1.22; arm.rotation.z = side * -0.12;
        arm.frustumCulled = false; driveArms.add(arm);
      }
      driveArms.visible = false;
    } catch (e) { ERR('arms', e); }
    return driveArms;
  }
  function placeDriveArms(on) {
    try {
      const a = ensureDriveArms();
      const cam = (typeof camera !== 'undefined') ? camera : null;
      if (cam && a && a.parent !== cam) cam.add(a);
      if (a) a.visible = !!on;
      /* hide cab1221 T-grip hands */
      try { if (window.__cab1221 && __cab1221.place) __cab1221.place(false); } catch (_) {}
    } catch (e) { ERR('darm', e); }
  }
  try {
    const c = window.__cab1221;
    if (c && c.place && !c.__t1260) {
      const p0 = c.place.bind(c);
      c.place = function (on) { return p0(false); };
      c.__t1260 = 1;
    }
  } catch (_) {}

  /* ---------- audio: hum when in or near; harsher engine with speed; teleport = travel sound only ---------- */
  let AC = null, humN = null;
  const ac = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
  const vol = () => (typeof SET !== 'undefined' ? SET.sfx : 0.8);
  function nearBox() {
    if (!S.on) return false;
    if (T.inside) return true;
    try { return Math.hypot(P.x - S.x, P.y - S.y, P.z - S.z) < 6.5; } catch (_) { return false; }
  }
  function humSet(on) {
    try {
      if (on && !humN) {
        const a = ac(), o1 = a.createOscillator(), o2 = a.createOscillator(), o3 = a.createOscillator();
        const f = a.createBiquadFilter(), g = a.createGain(), lf = a.createOscillator(), lg = a.createGain();
        o1.type = 'sawtooth'; o1.frequency.value = 48;
        o2.type = 'triangle'; o2.frequency.value = 96.5;
        o3.type = 'sine'; o3.frequency.value = 145;
        f.type = 'lowpass'; f.frequency.value = 380;
        lf.frequency.value = 0.55; lg.gain.value = 22; lf.connect(lg); lg.connect(f.frequency);
        g.gain.value = 0.0001;
        o1.connect(f); o2.connect(f); o3.connect(f); f.connect(g); g.connect(a.destination);
        o1.start(); o2.start(); o3.start(); lf.start();
        g.gain.setTargetAtTime(0.06 * vol(), a.currentTime, 0.5);
        humN = { o: [o1, o2, o3, lf], g, f }; U.hum++;
      } else if (!on && humN) {
        const h = humN; humN = null;
        h.g.gain.setTargetAtTime(0.0001, AC.currentTime, 0.4);
        setTimeout(() => { for (const o of h.o) try { o.stop(); } catch (_) {} }, 900);
      }
    } catch (e) { ERR('hum', e); }
  }
  function engineTick() {
    if (!humN) return;
    try {
      const sp = U.speed || 0;
      const harsh = Math.min(1, sp / 80);
      humN.f.frequency.setTargetAtTime(380 + harsh * 2200, AC.currentTime, 0.08);
      humN.g.gain.setTargetAtTime((0.06 + harsh * 0.18) * vol(), AC.currentTime, 0.08);
      if (humN.o[0].frequency) humN.o[0].frequency.setTargetAtTime(48 + harsh * 90, AC.currentTime, 0.1);
    } catch (_) {}
  }
  U.engineTick = engineTick;

  /* strip the blue travel overlay; keep whoosh / wheeze */
  function killBlueCut() {
    try {
      document.querySelectorAll('div').forEach(d => {
        const bg = (d.style && (d.style.background || d.style.backgroundImage)) || '';
        if (/9fd8ff|#9fd8ff|1a3a7a/.test(bg)) { d.style.display = 'none'; d.style.opacity = '0'; d.style.pointerEvents = 'none'; }
      });
    } catch (_) {}
  }
  try {
    if (C2 && C2.go && !C2.__t1260) {
      const go0 = C2.go;
      C2.go = function (k, name) {
        const r = go0.apply(this, arguments);
        killBlueCut();
        setTimeout(killBlueCut, 50);
        setTimeout(killBlueCut, 400);
        setTimeout(killBlueCut, 1200);
        setTimeout(killBlueCut, 2800);
        return r;
      };
      C2.__t1260 = 1;
    }
  } catch (e) { ERR('go', e); }

  /* wrap solid so the taller room is empty of world blocks */
  try {
    const so = solid;
    solid = function (x, y, z) {
      try {
        if (T.inside && S.on && !T.__raw) {
          const RR = T.RR, CZ = T.HW - T.RR, RH = T.RH || 16.5;
          const dx = x + 0.5 - S.x, dz = z + 0.5 - (S.z + CZ);
          if (dx * dx + dz * dz < (RR + 0.6) * (RR + 0.6) && z + 0.5 < S.z + T.HW + 0.2) {
            const fy = Math.floor(S.y + 0.01);
            if (y === fy - 1) return true;
            if (y >= fy && y < fy + Math.ceil(RH) + 1) return false;
          }
        }
      } catch (e) { ERR('so', e); }
      return so.apply(this, arguments);
    };
  } catch (e) { ERR('sow', e); }

  /* scene hook: door anim, hide old, lamp blue pulse, rotor anim, drive arms, hum */
  let tA = 0;
  try {
    const prev = scene.onBeforeRender;
    scene.onBeforeRender = function (r, s, c) {
      try { if (prev) prev.apply(this, arguments); } catch (_) {}
      try {
        if (c !== camera) return;
        U.frames++;
        hideOldShell();
        if (shell && T.parts.all) shell.visible = !!S.on && T.parts.all.visible && !T.camIn;
        /* when inside, hide the shell (same as old ext) */
        if (shell) shell.visible = !!S.on && !T.camIn && (T.parts.ext ? T.parts.ext.visible !== false || !T.camIn : !T.camIn);
        if (T.camIn && shell) shell.visible = false;
        applyDoors();
        tA += 0.016;
        if (lampMesh && lampMesh.material) {
          const pulse = 0.55 + 0.3 * Math.sin(performance.now() / 280) * (T.fly || (F && F.pilot) ? 1 : 0.35);
          if (lampMesh.material.emissive) lampMesh.material.emissive.setHSL(0.62, 1, pulse);
          lampMesh.material.color.setHSL(0.62, 1, 0.45 + pulse * 0.25);
        }
        if (rotorCore) {
          rotorCore.material.opacity = 0.65 + 0.3 * Math.sin(tA * 5);
          rotorCore.scale.x = rotorCore.scale.z = 1 + 0.18 * Math.sin(tA * 7);
          rotorCore.rotation.y = tA * 1.2;
        }
        if (rotorGlow) rotorGlow.rotation.y = -tA * 0.7;
        if (U._rings) {
          const H = (T.RH || 16.5) - 1.5;
          for (let i = 0; i < U._rings.length; i++) {
            const p = ((tA * 0.35 + i / U._rings.length) % 1);
            U._rings[i].position.y = 1.4 + p * H;
            U._rings[i].material.opacity = 0.35 + 0.5 * Math.sin(p * Math.PI);
          }
        }
        placeDriveArms(!!(F && F.pilot && T.inside));
        pollLT();
        const wantHum = nearBox();
        if (wantHum !== !!humN) humSet(wantHum);
        if (humN && F && F.pilot) engineTick();
        else if (humN) {
          try { humN.f.frequency.setTargetAtTime(380, AC.currentTime, 0.3); humN.g.gain.setTargetAtTime(0.055 * vol(), AC.currentTime, 0.3); } catch (_) {}
        }
        killBlueCut();
      } catch (e) { ERR('rb', e); }
    };
  } catch (e) { ERR('rbw', e); }

  try {
    const brand0 = T.brand;
    T.brand = function () {
      const r = brand0 ? brand0.apply(this, arguments) : undefined;
      try { hideOldShell(); buildShell(); } catch (e) { ERR('brand', e); }
      return r;
    };
  } catch (_) {}

  /* QA helpers for screenshots */
  window.__qa1260 = U;
  U.buildShell = buildShell;
  U.buildInterior = buildInterior;
  U.applyDoors = applyDoors;
  U.nearBox = nearBox;
  U.killBlueCut = killBlueCut;
  U.placeLook = function (mode) {
    if (!S.on) { try { const x = Math.floor(W / 2) + 6, z = Math.floor(D / 2) + 4; T.place(x + 0.5, (typeof groundTop === 'function' ? groundTop(x, z) : 10) + 1, z + 0.5); } catch (_) {} }
    const HW = T.HW;
    if (mode === 'ext') {
      T.inside = false; U.left = 0; U.right = 0; applyDoors();
      P.x = S.x; P.y = S.y; P.z = S.z + HW + 3.4; P.yaw = Math.PI; P.pitch = 0.18; P.vy = 0;
    } else if (mode === 'extOpen') {
      T.inside = false; U.left = 1; U.right = 0; applyDoors();
      P.x = S.x; P.y = S.y; P.z = S.z + HW + 3.4; P.yaw = Math.PI; P.pitch = 0.18; P.vy = 0;
    } else if (mode === 'int') {
      U.left = 1; applyDoors();
      const CZ = T.HW - T.RR;
      T.inside = true; T.camIn = true;
      P.x = S.x + 2.2; P.y = S.y; P.z = S.z + CZ + 4.5;
      P.yaw = Math.PI; P.pitch = 0.35; P.vy = 0;
    }
    try { placeCamera(0, 0, 0, 0); } catch (_) {}
  };

  try { buildShell(); buildInterior(); applyDoors(); killBlueCut(); } catch (e) { ERR('boot', e); }
  setTimeout(() => { try { buildShell(); buildInterior(); hideOldShell(); } catch (_) {} }, 400);
  setTimeout(() => { try { if (!U.builtIn) buildInterior(); hideOldShell(); } catch (_) {} }, 1500);
})();
