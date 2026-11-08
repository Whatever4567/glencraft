/* GLX-LOOK1226 (v1.2.26 local, unreleased): character look save schema, foundation only. Stores the chosen look on this device under
   localStorage glen_look (never inside a world save). Nothing here changes the player model yet: every option is marked with what it needs.
   'asset' options wait for the real customizable avatar model (Sunbox Games Stylized Customizable Avatar Male, not in the game yet) and are
   kept in the save but never offered as working choices until a model reports it can show them (__look.bind). */
(function () {
  const KEY = 'glen_look', V = 1;
  const HEX = /^#[0-9a-f]{6}$/;
  // one line per option: kind, default, allowed values (list) or range, and what it needs before a menu may offer it
  const OPT = {
    body:    {kind: 'range', def: 0.5, min: 0, max: 1, needs: 'asset', label: 'Body weight'},
    muscle:  {kind: 'range', def: 0.5, min: 0, max: 1, needs: 'asset', label: 'Muscle'},
    skin:    {kind: 'color', def: '#e0ac86', needs: 'asset', label: 'Skin colour'},
    eyes:    {kind: 'color', def: '#5a3a22', needs: 'asset', label: 'Eye colour'},
    hairCol: {kind: 'color', def: '#4a2f1c', needs: 'asset', label: 'Hair colour'},
    hair:    {kind: 'list', def: 'none', vals: ['none', 'crewcut'], needs: 'asset', label: 'Hair'},
    face:    {kind: 'list', def: 'none', vals: ['none', 'beard', 'goatee'], needs: 'asset', label: 'Facial hair'},
    hat:     {kind: 'list', def: 'none', vals: ['none'], open: 1, needs: 'asset', label: 'Hat'},
    top:     {kind: 'list', def: 'none', vals: ['none'], open: 1, needs: 'asset', label: 'Top'},
    bottom:  {kind: 'list', def: 'none', vals: ['none'], open: 1, needs: 'asset', label: 'Bottom'},
    shoes:   {kind: 'list', def: 'none', vals: ['none'], open: 1, needs: 'asset', label: 'Shoes'},
    glasses: {kind: 'list', def: 'none', vals: ['none'], open: 1, needs: 'asset', label: 'Glasses'}
  };
  const ID = /^[a-z0-9_-]{1,32}$/;   // 'open' slots keep any item id the model later lists (an item saved now is kept, not thrown away)
  function clean1(k, v) { const o = OPT[k];
    if (o.kind === 'range') { const n = +v; return Number.isFinite(n) ? Math.max(o.min, Math.min(o.max, n)) : o.def; }
    if (o.kind === 'color') { const s = String(v == null ? '' : v).toLowerCase(); return HEX.test(s) ? s : o.def; }
    const s = String(v == null ? '' : v); return o.vals.includes(s) || (o.open && ID.test(s)) ? s : o.def; }
  function defaults() { const L = {v: V}; for (const k in OPT) L[k] = OPT[k].def; return L; }
  function sanitize(raw) { const L = defaults(); if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return L;
    for (const k in OPT) if (k in raw) L[k] = clean1(k, raw[k]);
    if (raw.v > V && raw.extra == null) L.extra = Object.fromEntries(Object.entries(raw).filter(([k]) => !(k in OPT) && k !== 'v' && typeof raw[k] !== 'object').slice(0, 16));   // a newer save keeps its unknown fields
    else if (raw.extra && typeof raw.extra === 'object') L.extra = raw.extra;
    return L; }
  function load() { let raw = null; try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { raw = null; } return sanitize(raw); }
  let cur = load(), caps = {};   // caps: what the current player model can really show, set by the model code through bind()
  const U = window.__look = {KEY, V, OPT, defaults, sanitize, load,
    get: () => JSON.parse(JSON.stringify(cur)),
    set(k, v) { if (!(k in OPT)) return false; cur[k] = clean1(k, v); U.save(); return true; },
    save() { try { localStorage.setItem(KEY, JSON.stringify(cur)); return true; } catch (_) { return false; } },
    reset() { cur = defaults(); U.save(); },
    // the model says which options it can show, and for list slots which item ids it has (beyond 'none')
    bind(c) { caps = {}; for (const k in (c || {})) if (k in OPT) caps[k] = c[k]; },
    // what a menu may offer as a working choice now: only options the current model has bound
    offered() { return Object.keys(OPT).filter(k => caps[k]).map(k => { const o = OPT[k]; return o.kind === 'list' ? {k, label: o.label, vals: ['none', ...[].concat(caps[k] === true ? o.vals : caps[k]).filter(x => x !== 'none')]} : {k, label: o.label, kind: o.kind}; }); },
    waiting: () => Object.keys(OPT).filter(k => !caps[k])};
})();
