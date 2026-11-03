/* ===================== GLX-C141 (v1.0.21): the loch Unicorn (the rideable one) gets the HD model too, with the Glencraft pixel look ===================== */
// The one wild Unicorn from c125 is not in mobs[], so the HD pass never saw it and it kept the old procedural shape.
(function c141() {
  const U = window.__c135, Q = window.__c125; if (!U || !Q || !U.cat.nmunicorn) return;
  // pearly white fur with visible pixel grain (v1.0.20 was so bright the grain washed out)
  U.cat.nmunicorn.gl = {p: 'fur', a: 1.1, b: 0.98, m: {Hair: 'fur', Hooves: 'rock'}};
  U.cat.unicorn = Object.assign({}, U.cat.nmunicorn);
  U.xs = () => { const u = Q.uni; if (!u || !u.proxy || !u.g || !u.g.parent) return []; const p = u.proxy;
    if (!p.head && u.m) p.head = u.m.head || null;
    p.moving = (u.spd || 0) > 0.3; p.flee = u.flee || 0; return [p]; };
})();
