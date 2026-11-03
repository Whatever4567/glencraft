
/* ===================== GLX-C124 (v1.0.7): Friendly Mobs setting - evil mobs ignore you ===================== */
(function c124() {
  if (SET.friendly === undefined) SET.friendly = 0;
  const U = window.__c124 = {blocked: 0, on: () => !!SET.friendly};
  const MOBCAUSE = /got you|skeleton|treeman|zombie|guardian|fireball|dragon|hound|imp\b|huntsman|spider|creeper|cyborg|bitten|clawed|mauled|zapped|stung|rammed|dragged|hooked|screamed|spooked|seared|held you|poisoned in the night|struck by the (?!lightning)|blown up|sky-high by a creeper/i;
  // calm everything that was already after you
  function calm() { for (const a of mobs) { if (!a || !a.hostile) continue; a.aggro = 0; a.notice = undefined; if (a.mad > 0) a.mad = 0; if (a.state === 'grab' || a.state === 'lunge' || a.state === 'threat' || a.state === 'chase') a.state = 'idle'; }
    try { if (heldBy) { heldBy.state = 'stare'; heldBy.cool = 6; heldBy = null; } } catch (_) {} }
  U.calm = calm;
  function setF(v) { v = v ? 1 : 0; if (v === (SET.friendly ? 1 : 0)) return; SET.friendly = v; saveSet(); if (v) calm(); try { U.sync && U.sync(); } catch (_) {}
    toast(v ? 'Friendly Mobs ON - evil mobs will ignore you' : 'Friendly Mobs OFF - evil mobs will hunt you again'); }
  U.set = setF;
  // settings row: the title and pause menus share this panel
  try { const g = document.querySelector('#immSeg') || document.querySelector('#gfxSeg') || document.querySelector('#perfSeg'); const row = g && g.parentElement && g.parentElement.closest('.row, .setrow, div');
    if (row) { const r2 = row.cloneNode(true); r2.setAttribute('data-testid', 'friendly-row'); const seg = r2.querySelector('[id$="Seg"]'); seg.id = 'friendSeg'; const lab = r2.querySelector('label, span, b'); if (lab) lab.textContent = 'Friendly Mobs (evil mobs ignore me)';
      seg.innerHTML = '<button data-v="1" data-testid="friendly-on">On</button><button data-v="0" data-testid="friendly-off">Off</button>'; row.after(r2);
      const sync = () => seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === (SET.friendly ? 1 : 0))); sync(); U.sync = sync;
      seg.querySelectorAll('button').forEach(b => b.addEventListener('click', e => { e.preventDefault(); setF(Number(b.dataset.v)); })); } } catch (e) { console.warn('friendly row', e); }
  // mobs think as if you were not there (spawning, wandering and animation carry on); nothing they do can hurt you
  const um = updateMobs; updateMobs = function () { if (!SET.friendly || dead || !started) return um.apply(this, arguments);
    window.__fdead = 1; dead = true; try { return um.apply(this, arguments); } finally { dead = false; window.__fdead = 0; } };
  const ua = updateArrows; updateArrows = function () { if (!SET.friendly || dead || !started) return ua.apply(this, arguments);
    window.__fdead = 1; dead = true; try { return ua.apply(this, arguments); } finally { dead = false; window.__fdead = 0; } };
  let skipKnock = false;
  const h0 = hurt; hurt = function (n, cause) { if (SET.friendly && MOBCAUSE.test(String(cause || ''))) { U.blocked++; skipKnock = true; Promise.resolve().then(() => { skipKnock = false; }); return; } return h0.apply(this, arguments); };
  const k0 = knockPlayer; knockPlayer = function () { if (SET.friendly && (skipKnock || window.__fdead)) return; return k0.apply(this, arguments); };
  // creepers never arm near a friendly player
  let t = 0; setInterval(() => { if (!SET.friendly || !started) return; for (const a of mobs) if (a && a.hostile && (a.arm > 0 || a.lit)) { a.lit = false; a.cf = 0; } }, 250);
})();
