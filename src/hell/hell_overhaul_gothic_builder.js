/* ===================== GLX-C168 (v1.0.31): Hell overhaul 2 - the gothic builder: blackstone cathedral-castles with tall spires, glowing red lancet windows, chains, lava moats and portals ===================== */
(function c168() {
  const U = window.__c168 = {err: null};
  const {BS, DB, DC, DT, OB, HR, SS, MG, GR, HB} = window.__c167.ids, BARS = 163, GL = T.GLASS || 63, DBS = 230;
  // four styles: wall mix, accent, floor, facade towers (top, spire layers, radius), great spire, nave height, pinnacles
  const KIND = {
    cathedral: {w: (v, y) => y % 6 === 0 ? DB : v < 0.62 ? BS : v < 0.86 ? DB : v < 0.95 ? DC : OB, a: OB, fl: (x, z) => ((x + z) & 1) ? DB : OB, ft: 20, fn: 14, fR: 2.4, gs: 24, gn: 16, gR: 3.2, nt: 13, pin: 12, mid: true},
    abbey: {w: (v, y) => y % 5 === 0 ? DT : v < 0.55 ? DC : v < 0.85 ? DT : BS, a: BS, fl: (x, z) => ((x + z) & 1) ? DT : DC, ft: 16, fn: 13, fR: 2.2, gs: 21, gn: 18, gR: 2.8, nt: 11, pin: 10, soul: true},
    keep: {w: (v, y) => y % 4 === 0 ? OB : v < 0.7 ? HB : v < 0.9 ? BS : MG, a: OB, fl: (x, z) => ((x + z) & 1) ? HB : MG, ft: 22, fn: 12, fR: 2.8, gs: 18, gn: 12, gR: 4.0, nt: 14, pin: 14, mid: true},
    bastion: {w: (v, y) => y % 5 === 0 ? OB : v < 0.5 ? DT : v < 0.85 ? BS : DC, a: OB, fl: (x, z) => ((x + z) & 1) ? DT : BS, ft: 15, fn: 10, fR: 3.0, gs: 17, gn: 11, gR: 3.4, nt: 10, pin: 15, big: true}};
  U.KIND = KIND;
  const LOOT = {cathedral: [[IT.DIAMOND, 3], [IT.GOLDINGOT, 6], [OB, 6], [IT.FLINTSTEEL, 1], [GR, 8]], abbey: [[IT.SOUL || IT.GOLDINGOT, 3], [IT.DIAMOND, 2], [IT.GOLDINGOT, 4], [SS, 8], [GR, 6]],
    keep: [[IT.GOLDINGOT, 8], [IT.IRONINGOT, 8], [IT.LAVAB || IT.GOLDINGOT, 1], [GR, 10], [IT.DIAMOND, 1]], bastion: [[IT.GOLDINGOT, 10], [IT.DIAMOND, 2], [IT.PORKRAW || IT.BONE, 4], [OB, 8], [IT.IRONINGOT, 5]]};
  U.build = function (K, kind) { const S = KIND[kind] || KIND.cathedral, {B, box, h} = K, F = 1, X0 = -6, X1 = 6, Z0 = -15, Z1 = 5, RT = F + S.nt;
    const wl = (x, y, z) => S.w(h(x, y, z), y);
    const prop = (t, x, y, z, f, o, an) => { try { K.prop(t, x, y, z, f, o, an); } catch (e) { U.err = 'prop ' + e.message; } };
    // ground: platform, the lava moat, a bridge in at the front
    for (let x = -23; x <= 23; x++) for (let z = -23; z <= 23; z++) { const r = Math.hypot(x, z); if (r > 22.5) continue;
      if (r <= 17.5) { for (let y = -3; y <= 0; y++) B(x, y, z, y === 0 ? S.fl(x, z) : BS); if (kind === 'abbey' && r > 8 && h(x, 61, z) < 0.5) B(x, 0, z, SS); }
      else if (r <= 20.6) { B(x, 0, z, 0); B(x, -1, z, T.LAVA); B(x, -2, z, BS); B(x, -3, z, BS); }
      else if (h(x, 62, z) < 0.05) prop('fire', x, 1, z, 2, {}, 'floor'); }
    for (let z = 16; z <= 22; z++) for (let x = -2; x <= 1; x++) B(x, 0, z, (z & 3) === 0 ? S.a : DB);
    for (const x of [-3, 2]) for (let z = 17; z <= 21; z++) { B(x, 0, z, BS); B(x, 1, z, BARS); }
    for (let z = 6; z <= 16; z++) for (let x = -1; x <= 0; x++) B(x, 0, z, DB);
    // the nave: tall walls, a steep gabled roof, buttresses with pinnacles, lancet windows glowing red
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) { const e = x === X0 || x === X1 || z === Z0 || z === Z1; B(x, 0, z, S.fl(x, z)); for (let y = F; y < RT; y++) B(x, y, z, e ? wl(x, y, z) : 0); }
    for (let k = 0; k <= 8; k++) { const xa = X0 - 1 + k, xb = X1 + 1 - k, y = RT + k; if (xa > xb) break; for (let z = Z0 - 1; z <= Z1 + 1; z++) { B(xa, y, z, (k & 1) ? S.a : BS); B(xb, y, z, (k & 1) ? S.a : BS); }
      for (const z of [Z0, Z1]) for (let x = xa + 1; x < xb; x++) B(x, y, z, wl(x, y, z)); }
    for (let z = Z0 + 1; z <= Z1; z += 4) for (const sx of [-1, 1]) { const x = sx * (X1 + 2); for (let y = F; y <= F + S.nt - 3; y++) B(x, y, z, y > F + S.nt - 5 ? S.a : wl(x, y, z)); B(x - sx, F + S.nt - 4, z, S.a); prop('spike', x, F + S.nt - 2, z, 2, {h: 1.6}, 'floor'); }
    const win = (x, y0, z, n, f) => { for (let y = y0; y < y0 + n; y++) __rpane(K, x, y, z); };   // v1.0.33: red glass panes
    for (let z = Z0 + 3; z <= Z1 - 1; z += 4) { win(X0, F + 3, z, 6, 1); win(X1, F + 3, z, 6, 3); }
    // facade: pointed door, a rose of red glass, banners
    for (let y = F; y <= F + 4; y++) for (let x = -1; x <= 0; x++) B(x, y, Z1, 0); B(-1, F + 5, Z1, 0); B(0, F + 5, Z1, 0);
    for (const x of [-2, -1, 0, 1]) win(x, F + 8, Z1, x === -2 || x === 1 ? 2 : 4, 2);
    // towers: twin facade towers, the great spire behind, pinnacles round the platform
    const tower = (tx, tz, R, top, sR, sn, wall) => { K.tower(tx, tz, R, F, top, (x, y, z) => (y - F) % 5 === 4 ? S.a : wall(x, y, z), 0); const ap = K.cone(tx, tz, sR, top + 1, sn, (x, y, z) => (y & 1) ? S.a : BS); prop('spike', tx, ap, tz, 2, {h: 2.4}, 'floor'); return ap; };
    for (const tx of [-6, 6]) { tower(tx, 6, S.fR, F + S.ft, S.fR + 0.7, S.fn, wl); const r = Math.floor(S.fR);
      win(tx, F + S.ft - 6, 6 + r, 4, 2); win(tx + Math.sign(tx) * r, F + S.ft - 6, 6, 4, tx > 0 ? 3 : 1); win(tx, F + 6, 6 + r, 3, 2);
      // the great chains: from a corbel high on the tower down to the bridge-side ground
      const cx = tx + Math.sign(tx) * (r + 1); B(cx, F + S.ft - 1, 6, S.a); prop('chain', cx, F + S.ft - 2, 6, 2, {L: S.ft - 1}, [cx, F + S.ft - 1, 6]); }
    const gz = Z0 + 2; tower(0, gz, S.gR, F + S.gs, S.gR + 0.5, S.gn, wl);
    for (const [x, z, f] of [[0, gz - Math.floor(S.gR), 0], [Math.floor(S.gR), gz, 3], [-Math.floor(S.gR), gz, 1]]) { win(x, F + S.gs - 7, z, 5, f); win(x, F + S.nt + 2, z, 3, f); }
    for (let y = F; y <= RT - 2; y++) for (let x = -1; x <= 1; x++) B(x, y, gz + Math.floor(S.gR), 0);
    const pins = [[-12, -11], [12, -11], [-12, 9], [12, 9]].concat(S.mid ? [[-14, -2], [14, -2]] : []);
    for (const [px, pz] of pins) { const R = S.big ? 2.2 : 1.6; tower(px, pz, R, F + S.pin, R + 0.6, S.big ? 7 : 8, wl); win(px, F + S.pin - 4, pz + Math.floor(R), 3, 2); win(px, F + S.pin - 4, pz - Math.floor(R), 3, 0);
      const cz = pz + Math.floor(R) + 1; B(px, F + S.pin - 1, cz, S.a); prop('chain', px, F + S.pin - 2, cz, 2, {L: S.pin - 1}, [px, F + S.pin - 1, cz]); }
    // inside: lamps (real light), braziers, a chandelier, the altar or throne, a loot chest
    for (let z = Z0 + 2; z <= Z1 - 2; z += 4) { K.lamp(X0 + 1, F + 3, z, 1, {soul: !!S.soul}); K.lamp(X1 - 1, F + 3, z, 3, {soul: !!S.soul}); }
    for (const [x, z] of [[-3, 2], [2, 2], [-3, -8], [2, -8]]) { B(x, F, z, S.a); prop(S.soul ? 'soulgl' : 'brazier', x, F + 1, z, 2, {}, 'floor'); }
    prop('chand', 0, RT - 1, -5, 2, {L: 1.2}, [0, RT, -5]); prop('chand', 0, RT - 1, 1, 2, {L: 1.2}, [0, RT, 1]);
    B(-1, F, Z0 + 1, S.a); B(0, F, Z0 + 1, S.a); prop('throne', 0, F + 1, Z0 + 1, 2, {}, 'floor');
    K.chest(-4, F, Z0 + 1, 2, LOOT[kind] || LOOT.cathedral); K.chest(3, F, Z0 + 1, 2, (LOOT[kind] || LOOT.cathedral).slice(1));
    if (kind === 'abbey') { for (const [x, z] of [[-4, -3], [3, -3], [-4, -11], [3, -11]]) prop('bonecol', x, F, z, 2, {h: S.nt - 1}, 'floor'); for (const [x, z] of [[-2, -1], [1, -6], [-9, 12], [9, 12]]) prop('skull', x, F, z, 2, {}, 'floor'); }
    if (kind === 'bastion') { for (const [x, z] of [[-4, -1], [3, -1], [-4, -6], [3, -6], [-4, -11], [3, -11]]) prop('cage', x, RT - 1, z, 2, {L: 3, v: 1}, [x, RT, z]); for (const [x, z] of [[-10, 12], [10, 12], [-2, -4], [1, 0]]) prop('bones', x, F, z, 2, {}, 'floor'); }
    if (kind === 'keep') { for (let z = Z0 + 2; z <= Z1 - 2; z += 4) { B(X0, F + 1, z, GR); B(X1, F + 1, z, GR); } for (const [x, z] of [[-10, 0], [10, 0], [-10, -9], [10, -9]]) { B(x, 0, z, T.LAVA); } }
    if (kind === 'cathedral') for (const [x, z] of [[-9, 12], [8, 12], [-12, 0], [11, 0]]) prop('brazier', x, F, z, 2, {}, 'floor');
    // the portal (purple, lit: step in to go home), on the left as you come in
    for (let x = -13; x <= -10; x++) for (let y = F; y <= F + 4; y++) { const e = x === -13 || x === -10 || y === F || y === F + 4; B(x, y, 3, e ? OB : T.PORTAL); }
    for (let x = -14; x <= -9; x++) for (let z = 2; z <= 4; z++) B(x, 0, z, OB);
    // v1.0.33: no banners outside; the interior (rooms, floors, banners) is c175
    try { if (window.__c175) __c175.hell(K, kind, {F, X0, X1, Z0, Z1, RT, S, wl, prop}); } catch (e) { U.err = 'c175 ' + e.message; }
  };
})();
