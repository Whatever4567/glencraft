/* GLX-TBOX1262 (v1.2.62): When a time-box door leaf is open, the doorway
   shows only that open leaf and the rotor room — the leftover closed door
   face behind it is gone, and you can walk in and back out. A closed leaf
   still blocks. Each leaf still toggles on its own from LT and from a tap. */
(function tbox1262() {
  const U = window.__tbox1262 = { err: null, on: 1, version: '1.2.62', frames: 0, walked: 0 };
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String((e && e.stack) || e).slice(0, 260); };

  function T0() { return window.__tbox; }
  function U0() { return window.__tbox1260; }
  function U1() { return window.__tbox1261; }

  /* Keep the 1.2.60 shell and the original hinged faces hidden. 1.2.61 hid
     them, but the 1.2.60 render hook kept turning the old shell back on, so
     a closed door face sat in the opening behind the swinging 1.2.61 leaf. */
  function hideLeftovers() {
    try {
      const T = T0();
      const all = T && T.parts && T.parts.all;
      if (all) {
        const old = all.getObjectByName && all.getObjectByName('tardis1260');
        if (old) {
          old.visible = false;
          if (!old._hid1262) {
            old._hid1262 = 1;
            old.traverse(o => {
              try {
                o.visible = false;
                if (o.isMesh) o.raycast = function () {};
              } catch (_) {}
            });
          }
        }
        all.traverse(o => {
          if (o && o.userData && o.userData.t1260 && o.name !== 'tardis1261') {
            try { o.visible = false; } catch (_) {}
          }
        });
      }
      if (T && T.parts && T.parts.doors) {
        T.parts.doors.visible = false;
        T.parts.doors.traverse(o => {
          try { o.visible = false; if (o.isMesh) o.raycast = function () {}; } catch (_) {}
        });
      }
      /* 1.2.60's own handle: force-hide even if its onBeforeRender unhides. */
      const A = U0();
      if (A) {
        ['leafL', 'leafR', '_leafL0', '_leafR0'].forEach(k => {
          const g = A[k];
          const u1 = U1();
          if (g && g !== (u1 && u1.leafL) && g !== (u1 && u1.leafR)) {
            try { g.visible = false; g.traverse(o => { o.visible = false; }); } catch (_) {}
          }
        });
      }
    } catch (e) { ERR('hide', e); }
  }

  /* The 1.2.61 "carve" is a thin slab the size of the whole doorway, sitting
     just inside the leaves — a second closed door surface. Hide only that
     front-doorway filler; leave the mullion, posts, lintel and the sealed
     faces on the other three sides. */
  function hideDoorwaySlab() {
    try {
      const u1 = U1();
      const shell = u1 && (u1._shell || (u1.leafL && u1.leafL.parent));
      if (!shell || shell._slab1262) return;
      const leafL = u1.leafL, leafR = u1.leafR;
      const T = window.THREE;
      if (!T) return;
      const wp = new T.Vector3();
      shell.traverse(o => {
        if (!o.isMesh || !o.geometry) return;
        let p = o, underLeaf = false;
        while (p) {
          if (p === leafL || p === leafR || /leaf[LR]1261/.test(p.name || '')) { underLeaf = true; break; }
          p = p.parent;
        }
        if (underLeaf) return;
        try {
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          const bb = o.geometry.boundingBox;
          if (!bb) return;
          const w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y, d = bb.max.z - bb.min.z;
          /* doorway-filling: wide, tall, thin */
          if (!(w > 0.7 && h > 1.4 && d < 0.09)) return;
          o.getWorldPosition(wp);
          /* only the FRONT opening (shell-local +Z), not the back wall */
          const loc = wp.clone();
          shell.worldToLocal(loc);
          if (loc.z < 0.4) return;
          o.visible = false;
          o.userData.doorSlab1262 = 1;
          o.raycast = function () {};
          U.hidSlab = (U.hidSlab || 0) + 1;
        } catch (_) {}
      });
      shell._slab1262 = 1;
    } catch (e) { ERR('slab', e); }
  }

  function applyLeaves() {
    try {
      const A = U0(), B = U1();
      if (!A || !B) return;
      const k = 1.75;
      if (B.leafL) { B.leafL.visible = true; B.leafL.rotation.y = -(A.left || 0) * k; }
      if (B.leafR) { B.leafR.visible = true; B.leafR.rotation.y = (A.right || 0) * k; }
      const T = T0();
      if (T) T.door = Math.max(A.left || 0, A.right || 0);
      /* keep the stencil mask over only the open half, so the rotor room
         shows through the opening and not through a shut leaf. */
      try {
        const mask = T && T.parts && T.parts.mask;
        if (mask && T && T.S) {
          const open = T.door > 0.05;
          const DW = T.DW || 0.5;
          if ((A.left || 0) > 0.05 && (A.right || 0) < 0.05) { mask.position.x = -DW / 2; mask.scale.set(0.5, 1, 1); }
          else if ((A.right || 0) > 0.05 && (A.left || 0) < 0.05) { mask.position.x = DW / 2; mask.scale.set(0.5, 1, 1); }
          else { mask.position.x = 0; mask.scale.set(1, 1, 1); }
          mask.visible = open && !T.camIn;
        }
      } catch (_) {}
    } catch (e) { ERR('leaves', e); }
  }

  function leafOpen(side) {
    const A = U0();
    if (!A) return false;
    return side === 'left' ? (A.left || 0) > 0.55 : (A.right || 0) > 0.55;
  }
  U.leafOpen = leafOpen;

  /* Walk through an open leaf, in or out. A shut leaf still blocks that
     half. Runs LAST so it wins over the older whole-doorway walls(). */
  function doorPhysics() {
    try {
      const T = T0(), A = U0();
      if (!T || !T.S || !T.S.on || !A) return;
      if (typeof DIM !== 'undefined' && DIM.cur) return;
      try {
        const F = window.__tbox3 || (T && T.F);
        const raw = F && F.pilot;
        const pil = raw === true || raw === 1;
        if (pil) return;
        if (A._F && A._F.pilot === true) return;
      } catch (_) {}
      const S = T.S, HW = T.HW, DW = T.DW || 0.5, R = 0.32;
      const fz = S.z + HW;
      const dx = P.x - S.x;
      const leftOpen = (A.left || 0) > 0.55, rightOpen = (A.right || 0) > 0.55;
      const thisOpen = dx < 0 ? leftOpen : rightOpen;
      const atDoorX = Math.abs(dx) < DW - R + 0.1;
      const atDoorY = Math.abs(P.y - S.y) < 0.85;
      const atDoorZ = P.z > fz - 1.05 && P.z < fz + 0.75;

      if (T.inside) {
        if (P.z > fz - 0.08 && atDoorX && thisOpen && atDoorY) {
          if (P.z > fz + 0.12) { T.inside = false; U.walked++; }
          return;
        }
        if (P.z > fz - 0.04) {
          /* closed leaf, or off to the side of the opening: stay in */
          P.z = fz - 0.06;
          try { if (P.vz) P.vz = 0; } catch (_) {}
        }
        return;
      }

      if (atDoorX && atDoorZ && atDoorY && thisOpen) {
        if (P.z < fz - 0.02) { T.inside = true; U.walked++; }
        return;
      }

      /* closed half of the doorway, or the rest of the front: bounce out
         if the older walls() let us through because T.door was set by the
         other leaf being open. */
      if (atDoorZ && atDoorY && Math.abs(dx) < DW + R) {
        if (!thisOpen || !atDoorX) {
          if (P.z < fz + R && P.z > fz - 0.4 && !T.inside) {
            P.z = fz + R + 0.01;
            try { if (P.vz) P.vz = 0; } catch (_) {}
          }
        }
      }
    } catch (e) { ERR('phys', e); }
  }
  U.doorPhysics = doorPhysics;

  /* Doorway volume is not solid when that leaf is open, from either side,
     so world-block leftovers cannot pin you in the opening. The floor and
     a shut leaf stay solid. */
  function wrapSolid() {
    try {
      if (typeof solid !== 'function' || solid._t1262) return;
      const so = solid;
      solid = function (x, y, z) {
        try {
          const T = T0(), A = U0();
          if (T && T.S && T.S.on && !T.__raw && A) {
            const S = T.S, HW = T.HW, DW = T.DW || 0.5;
            const fz = S.z + HW;
            const wx = x + 0.5, wz = z + 0.5;
            if (Math.abs(wx - S.x) < DW + 0.2 && wz > fz - 0.7 && wz < fz + 0.7 &&
                y >= Math.floor(S.y) && y < Math.floor(S.y) + 3) {
              const open = (wx < S.x) ? (A.left || 0) > 0.55 : (A.right || 0) > 0.55;
              if (open) {
                const fy = Math.floor(S.y + 0.01);
                if (y === fy - 1) return so.apply(this, arguments);
                return false;
              }
            }
          }
        } catch (e) { ERR('so', e); }
        return so.apply(this, arguments);
      };
      solid._t1262 = 1;
      window.solid = solid;
    } catch (e) { ERR('sow', e); }
  }

  function wrapUpdate() {
    try {
      if (typeof updatePlayer !== 'function' || updatePlayer._t1262) return;
      const up = updatePlayer;
      updatePlayer = function () {
        const r = up.apply(this, arguments);
        try { doorPhysics(); } catch (e) { ERR('up', e); }
        return r;
      };
      updatePlayer._t1262 = 1;
      window.updatePlayer = updatePlayer;
    } catch (e) { ERR('upw', e); }
  }

  function wrapRender() {
    try {
      if (typeof scene === 'undefined' || !scene || scene._t1262br) return;
      const prev = scene.onBeforeRender;
      scene.onBeforeRender = function (r, s, c) {
        try { if (prev) prev.apply(this, arguments); } catch (_) {}
        try {
          U.frames++;
          hideLeftovers();
          hideDoorwaySlab();
          applyLeaves();
        } catch (e) { ERR('br', e); }
      };
      scene._t1262br = 1;
    } catch (e) { ERR('rw', e); }
  }

  function boot() {
    try {
      if (typeof THREE === 'undefined') { setTimeout(boot, 80); return; }
      const T = T0();
      if (!T || !T.parts) { setTimeout(boot, 80); return; }
      hideLeftovers();
      hideDoorwaySlab();
      wrapSolid();
      wrapUpdate();
      wrapRender();
      applyLeaves();
      U.booted = 1;
    } catch (e) { ERR('boot', e); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 80));
  else setTimeout(boot, 80);
  setTimeout(boot, 400);
  setTimeout(boot, 1400);
})();
