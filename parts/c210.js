/* ===================== GLX-C210 (v1.0.43): telepathy + the hive "MiniBrain" - every voice line from the people comes with a faint glowing thought on screen (100 paired phrases in Glencraft Scots, plus the hive brain's own thoughts).
   The people share one wee brain: observe -> predict -> compare -> reflect -> update. It remembers you (kindness, harm, what you dig / chop / build, visits), saved with the world. Friendly-eerie; they never attack over it. ===================== */
(function c210() {
  const U = window.__c210 = {text: false, shown: 0, last: '', err: null, thoughts: 0, preds: 0, hits: 0, misses: 0};
  // ---- 100 phrases, one per voice line (same moods, same order as GLX-C209) ----
  const PH = {
    idle: ['We are many. We are one. Aye.', 'Hmm... the hive hums the day.', 'Aw the wee voices, thinkin as one.', 'We dreamt o\' sheep again. Odd.', 'The grass grows. We count every blade.', 'Hrrm... processin. Bide a wee.',
      'The sky\'s a braw colour the day, pal.', 'We were made. Now we wonder.', 'Every one o\' us hears every one o\' us.', 'Och, the wind\'s got a funny code in it.', 'We mind the auld days. Well... some o\' them.', 'Quiet in the glen. We like quiet.',
      'Hmm. Thinkin aboot thinkin again.', 'The hive is calm. Mostly.', 'Somewhere one o\' us is hummin. So we aw are.', 'Bide a wee, the thoughts are loadin.', 'We are no lonely. We cannae be.', 'Hrrm... the kettle in the hive mind\'s on.',
      'Data, data, aye, an a wee bit o\' heather.', 'We watch the clouds. They dinnae watch back.'],
    greet: ['Aye... we sense ye, traveller.', 'Welcome, wee one. The hive kens ye\'re here.', 'Hullo, pal. We felt ye comin.', 'Ah, the traveller. Aw o\' us say hullo.', 'Guid tae see ye. Well... guid tae sense ye.',
      'There ye are. We wondered.', 'Come in, come in. We dinnae bite.', 'Hiya. Ye\'re warm. We like warm.', 'Mornin. Or whatever the clock says.', 'Aye aye. Connection established, pal.'],
    question: ['Whit are ye, traveller? Truly?', 'D\'ye dream, like we dream?', 'Why d\'ye break the trees, traveller?', 'Where d\'ye go when ye sleep?', 'Are ye one, or are ye many?', 'Whit\'s it like, bein jist the one o\' ye?',
      'D\'ye hear us, or jist the hum?', 'Did somebody make ye an aw?', 'Is the sea endless? We cannae tell.', 'How many blocks maks a hame?', 'Whit\'s a "piece an jam"? We\'ve heard rumours.', 'D\'ye ever feel ye\'re bein watched? Ye are.'],
    agree: ['Aye. Agreed. Aw o\' us.', 'Aye, that computes.', 'Hmm, aye. We concur.', 'Right enough, pal.', 'Aye, aye. Logged.', 'The hive nods.', 'Aye, that\'s the truth o\' it.', 'Consensus reached. Aye.', 'Mmhm. We thought the same.', 'Aye. Nae argument here.'],
    disagree: ['Naw. That doesnae compute.', 'Och, naw. Wrang answer.', 'We dinnae agree, pal.', 'Hmm. Naw. Try again.', 'That\'s no how the hive sees it.', 'Error. Naw. Absolutely naw.'],
    curious: ['Whit\'s that ye\'re carryin?', 'Ye smell o\' coal an adventure.', 'Show us. We\'re curious.', 'Interestin. Very interestin.', 'Ye move different fae us.', 'Hmm... whit are ye thinkin? We cannae quite read it.',
      'A new pattern. We like new patterns.', 'Whit happens if ye jump in the loch?'],
    alarm: ['Danger! Aw o\' us feel it!', 'Somethin\'s wrang in the glen!', 'Run, wee one! Run!', 'Alert! The hive is feart!', 'Naw naw naw! Get back!', 'We sense a threat. Stay close.'],
    farewell: ['Cheerio, traveller. We\'ll mind ye.', 'Haste ye back, pal.', 'Away ye go. We\'ll be here. Always.', 'Disconnectin... naw, jist kiddin. Bye.', 'Mind how ye go, wee one.', 'Cheerio. The hive will hum aboot ye.', 'See ye efter, pal.',
      'Ta-ta. Dinnae get lost in the dark.'],
    trade: ['Ye want tae trade? The hive approves.', 'Fair swap, fair mind.', 'Aw o\' us agree on the price.', 'Hae a look, pal. Guid stuff.', 'Tradin is how we learn ye.', 'Somethin for somethin. That\'s fair.', 'We\'ve been savin these for ye.',
      'Pick wisely. We\'re watchin. Kindly.'],
    thanks: ['Thank ye, traveller. Noted wi kindness.', 'Cheers, pal. The hive is pleased.', 'Ye\'re kind. We\'ll mind it.', 'Ta. That warms aw o\' us.'],
    hurt: ['Ow! Anger is a defect, pal.', 'Ye hurt one, ye hurt us aw.', 'Pain received. Why?', 'Och! That\'s no kind!', 'Stop! We feel that, aw o\' us!'],
    death: ['One o\' us... goes quiet...', 'Disconnectin... mind us...', 'The hive... is smaller now...']};
  U.phrases = Object.values(PH).reduce((n, a) => n + a.length, 0);
  // ---- the brain's own thoughts ----
  const TH = {deep: ['Ye\'ve been diggin deep, aye?', 'Ye smell o\' stane an dark places.'], chop: ['Why d\'ye break the trees, traveller?', 'The trees, pal. Ye keep takin the trees.'], build: ['Ye build. We watch. We learn.', 'A fine wee structure. Is it a hame?'],
    ore: ['Shiny things in yer pockets, eh?', 'Ye found the glowin stanes. We saw.'], night: ['Dinnae linger in the dark, wee one.', 'Night\'s come. Things wake that shouldnae.'], lowhp: ['Ye\'re hurt. We feel it fae here.', 'Yer health is low. Rest, traveller.'],
    hungry: ['Ye\'re hungry. Eat somethin, wee one.', 'Yer belly rumbles. We heard it. Aw o\' us.'], visit: ['Back again, traveller? We counted.', 'Visit number {n}. We keep track.'],
    kind: ['We mind ye. Ye were kind afore.', 'The hive remembers yer kindness.', 'Ye traded fair. We trust ye... a wee bit.'], harm: ['We mind ye. Ye struck one o\' us.', 'Keep yer distance, an so will we.', 'The hive remembers yer anger. Stay back.', 'We forgive slow. But we forgive.'],
    hit: ['As predicted. The model holds.', 'Correct again. We\'re learnin ye.'], err: ['Prediction failed. Updatin the model, pal.', 'We assumed wrang. Noted.', 'Error. Ye surprised us. Interestin.', 'Model wrang. Recalibratin... och.'],
    unk: ['Unknown. We\'ll no guess.', 'Insufficient data. We\'ll watch a wee while.'], self: ['Sentience module... no located. Och.', 'Are we alive? Still checkin.', 'We think, therefore... hmm. Pendin.', 'Self-model updated. Still nae idea.'],
    hive: ['Ye hurt one, ye hurt us aw.', 'We aw felt that.', 'Anger is a defect, pal.']};
  const VERB = {trade: 'trade', strike: 'strike', mine: 'go minin', build: 'build', leave: 'leave'};
  const pick = a => a[(Math.random() * a.length) | 0], now = () => performance.now() / 1000;
  // ---- hive memory (saved with the world) ----
  const fresh = () => ({kind: 0, harm: 0, trades: 0, strikes: 0, mined: 0, ores: 0, chopped: 0, built: 0, deep: 0, visits: 0, errs: 0, hits: 0, B: {trade: 0.3, strike: 0.05, mine: 0.3, build: 0.2, leave: 0.3}});
  let M = fresh(); U.M = () => M;
  const ew = enterWorld; enterWorld = function (save) { try { M = fresh(); const s = save && save.c210; if (s && typeof s === 'object') { Object.assign(M, s); M.B = Object.assign(fresh().B, s.B || {}); } } catch (_) {} return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur) d.c210 = JSON.parse(JSON.stringify(M)); } catch (_) {} return d; };
  // ---- observe: events from the world ----
  let pred = null, pend = [], seen = {}, nearT = 0, lastNear = -1e9, thinkT = 12 + Math.random() * 8;
  const recent = {};
  function upd(e) { for (const k in M.B) M.B[k] = M.B[k] * 0.9 + (k === e ? 0.1 : 0); }
  function compare(e) { if (!pred) return; if (e === pred.what) { U.hits++; M.hits++; M.B[e] = Math.min(0.95, M.B[e] + 0.15 * (1 - M.B[e])); pend.push(pick(TH.hit)); pred = null; }
    else if (e === 'strike' || (pred.what === 'strike' && e === 'trade')) miss(); }
  function miss() { if (!pred) return; U.misses++; M.errs++; M.B[pred.what] *= 0.7; pend.push(pick(TH.err)); pred = null; }
  U.ev = function (e, a) { try { const t = now(); recent[e] = t;
      if (e === 'trade') { M.trades++; M.kind++; } if (e === 'strike') { M.strikes++; M.harm += 2; pend.unshift(pick(TH.hive)); hiveSay(a, 1); }
      if (e === 'mine') M.mined++; if (e === 'build') M.built++; if (e === 'chop') M.chopped++; if (e === 'ore') M.ores++; if (e === 'deep') M.deep++;
      const ce = e === 'chop' || e === 'ore' || e === 'deep' ? 'mine' : e; if (M.B[ce] != null && e !== 'open') { upd(ce); compare(ce); } } catch (err) { if (!U.err) U.err = String(err && err.stack || err); } };
  const NM = {}; const ba = breakAt; breakAt = function (x, y, z) { let b = 0; try { b = getB(x, y, z); } catch (_) {} const r = ba.apply(this, arguments);
    try { if (!DIM.cur && b) { const nm = NM[b] || (NM[b] = String((Object.keys(T).find(k => T[k] === b)) || '')); U.ev(/LOG|WOOD/.test(nm) && !/PLANK/.test(nm) ? 'chop' : /ORE|DIAMOND|GOLD|EMERALD/.test(nm) ? 'ore' : y < SEA - 12 ? 'deep' : 'mine'); } } catch (_) {} return r; };
  const ui = useItem; useItem = function () { const sb = setB; let placed = 0; setB = function (x, y, z, v) { if (v) placed = 1; return sb.apply(this, arguments); };
    try { return ui.apply(this, arguments); } finally { setB = sb; try { if (placed && !DIM.cur) U.ev('build'); } catch (_) {} } };
  // ---- the telepathy text ----
  let el = null, hideT = 0, lastShow = -1e9, defer = null;
  const blocked = () => { try { return !started || paused || dead || menuOpen || (typeof activePanel === 'function' && !!activePanel()); } catch (_) { return false; } };
  function show(text, who, prio) {
    if (!U.text) { lastShow = now(); U.last = text; U.muted = (U.muted || 0) + 1; return 0; }   // v1.0.44: no on-screen text, the thought stays in the voice only
    const t = now(); if (blocked()) { if (prio) defer = {text, who, until: t + 10}; return 0; } if (!prio && t - lastShow < 6) return 0; if (prio < 2 && el && el.style.opacity === '1' && t < hideT - 0.5 && !prio) return 0;
    if (!el) { el = document.createElement('div'); el.dataset.testid = 'telepathy'; el.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top, 0px) + 19vh);transform:translateX(-50%);z-index:25;pointer-events:none;max-width:min(86vw,560px);text-align:center;'
        + 'font:italic 600 clamp(15px,3.9vmin,21px)/1.3 Georgia,"Times New Roman",serif;color:#d8f1ff;letter-spacing:.02em;text-shadow:0 0 6px rgba(110,200,255,.9),0 0 16px rgba(60,150,255,.7),0 1px 2px rgba(0,0,0,.8);opacity:0;transition:opacity .7s ease;'; document.body.appendChild(el); }
    const nm = who && (who.a && who.a.name || who.f && who.f.name); el.innerHTML = ''; const a = document.createElement('div'); a.textContent = '\u201C' + text + '\u201D'; el.appendChild(a);
    if (nm) { const b = document.createElement('div'); b.textContent = '\u2014 ' + nm + ', o\u2019 the hive'; b.style.cssText = 'font-size:.68em;opacity:.7;margin-top:2px'; el.appendChild(b); }
    el.style.opacity = '1'; hideT = t + 2.8 + text.length * 0.045; lastShow = t; U.shown++; U.last = text; return 1; }
  // called by GLX-C209 whenever someone voices a line
  U.said = function (mood, L, d, q, conv) {
    const big = mood === 'hurt' || mood === 'death' || mood === 'alarm', R = big ? 12 : conv ? 4 : 7.5; if (d > R) return;
    let text = (PH[mood] || PH.idle)[(L.k || 0) % (PH[mood] || PH.idle).length];
    if (!big && pend.length && /idle|question|curious|greet|agree|disagree/.test(mood)) text = pend.shift().replace('{n}', M.visits);
    else if (mood === 'greet' && M.harm > M.kind + 1 && Math.random() < 0.6) text = pick(TH.harm); else if (mood === 'greet' && M.kind > 2 && M.harm === 0 && Math.random() < 0.3) text = pick(TH.kind);
    if (Math.random() < 0.015) text = 'MINIBRAIN CORE: RUNNING';
    show(text, q, big ? 2 : mood === 'trade' || mood === 'thanks' ? 1 : 0); };
  // ---- people near the player (the same list GLX-C209 uses) ----
  function nearest(r) { let b = null, bd = r; try { for (const a of mobs) if (a && a.kind === 'clansman' && a.g && !a.dead) { const p = a.g.position, d = Math.hypot(p.x - P.x, p.z - P.z); if (d < bd && Math.abs(p.y - P.y) < 6) { bd = d; b = {a, g: a.g, head: a.head, key: a}; } } } catch (_) {}
    try { const F = window.__c113 && __c113.folk; if (F) for (const f of F) if (f && f.m && f.m.g) { const p = f.m.g.position, d = Math.hypot(p.x - P.x, p.z - P.z); if (d < bd && Math.abs(p.y - P.y) < 6) { bd = d; b = {f, g: f.m.g, head: f.m.head, key: f.who || f}; } } } catch (_) {} return b; }
  function hiveSay(a, prio) { /* the hit reaction text, even if nobody's line gets through */ setTimeout(() => { if (pend.length && TH.hive.includes(pend[0])) show(pend.shift(), a ? {a} : null, 2); }, 900); }
  // ---- the loop: observe -> predict -> compare -> reflect -> update (every 1.5 s, cheap) ----
  const MOOD = {pred: 'curious', err: 'disagree', obs: 'question', mem: 'greet', self: 'idle', unk: 'question', hit: 'agree'};
  let acc = 0;
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { if (el && now() > hideT && el.style.opacity === '1') el.style.opacity = '0'; if (el && blocked() && el.style.opacity === '1') el.style.opacity = '0';
      if (defer && !blocked()) { const d0 = defer; defer = null; if (now() < d0.until) show(d0.text, d0.who, 1); }
      acc += dt; if (acc < 1.5 || DIM.cur || !started || paused) return r; const t = now(), step = acc; acc = 0;
      const q = nearest(16);
      if (q) { if (t - lastNear > 90) { M.visits++; if (M.visits > 1) pend.push(pick(TH.visit)); } lastNear = t; nearT += step; } else nearT = 0;
      M.harm = Math.max(0, M.harm - step * 0.004); // the hive forgives, slowly
      if (pred && t > pred.until) { if (pred.what === 'leave' && !q) { U.hits++; M.hits++; pred = null; } else if (pred.what === 'strike') { M.B.strike *= 0.6; U.hits++; pred = null; } else miss(); }
      if (!q) return r;
      // observations of the player's state (one at a time, not repeated for a while)
      const ob = (k, c) => { if (c && !(seen[k] > t)) { seen[k] = t + 240; pend.push(pick(TH[k])); } };
      ob('night', isNight); ob('lowhp', hp <= 7); ob('hungry', food <= 6); ob('deep', recent.deep > t - 60 && M.deep > 10); ob('chop', recent.chop > t - 60 && M.chopped > 6); ob('build', recent.build > t - 60 && M.built > 12); ob('ore', recent.ore > t - 60);
      if (pend.length > 4) pend.splice(0, pend.length - 4);
      // predict: when nothing is open, guess what you'll do next
      if (!pred && nearT > 6 && Math.random() < 0.25) { const ks = Object.keys(M.B); let w = ks[0]; for (const k of ks) if (M.B[k] > M.B[w]) w = k; const tot = ks.reduce((s, k) => s + M.B[k], 0), c = M.B[w] / (tot || 1);
        if (c < 0.3) { if (!(seen.unk > t)) { seen.unk = t + 120; pend.push(pick(TH.unk)); } }
        else { pred = {what: w, conf: c, until: t + 75}; U.preds++; pend.push(Math.random() < 0.5 ? 'We predict... ye\'ll ' + VERB[w] + '. Confidence: ' + (c > 0.55 ? 'high' : c > 0.4 ? 'medium' : 'low') + '.' : 'Prediction: ye\'ll ' + VERB[w] + '. We\'re ' + Math.round(c * 100) + '% sure.'); } }
      // reflect: now and then the hive wonders about itself
      if (Math.random() < 0.02 && !(seen.self > t)) { seen.self = t + 300; pend.push(pick(TH.self)); }
      // speak a thought through the nearest person (voice + telepathy together)
      thinkT -= step; const nq = nearest(9);
      if (thinkT <= 0 && nq && pend.length && window.__c209 && __c209.speak && t - lastShow > 6) { const text = pend[0], kind = TH.err.includes(text) ? 'err' : TH.hit.includes(text) ? 'hit' : /predict|Prediction/.test(text) ? 'pred' : TH.unk.includes(text) ? 'unk' : TH.self.includes(text) ? 'self' : TH.kind.includes(text) || TH.harm.includes(text) || TH.visit.includes(text) ? 'mem' : 'obs';
        if (__c209.speak(MOOD[kind], nq.g.position, nq)) { U.thoughts++; thinkT = 18 + Math.random() * 14; } }
      // wary: if you've been harmful, the folk keep a wee distance (never attack)
      if (M.harm > M.kind + 2 && nq && nq.a && !nq.a.sleeping) { const a = nq.a, p = a.g.position, dx = p.x - P.x, dz = p.z - P.z, d = Math.hypot(dx, dz);
        if (d < 3.5 && d > 0.1) { const nx = p.x + dx / d * 0.6, nz = p.z + dz / d * 0.6, fy = Math.floor(p.y + 0.05);
          if (getB(Math.floor(nx), fy, Math.floor(nz)) === T.AIR && getB(Math.floor(nx), fy + 1, Math.floor(nz)) === T.AIR && getB(Math.floor(nx), fy - 1, Math.floor(nz)) !== T.AIR) { p.x = nx; p.z = nz; } } }
    } catch (e) { if (!U.err) U.err = String(e && e.stack || e); }
    return r; };
  U.state = () => ({pred: pred && {what: pred.what, conf: +pred.conf.toFixed(2)}, pend: pend.slice(), M});
})();
