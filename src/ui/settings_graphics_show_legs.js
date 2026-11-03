/* GLX-C291 (v1.0.97): Settings - Graphics - Show legs in first person (default on); recipes you cannot craft yet are tinted red;
   armour and jetpack equip without a lag spike (every armour material, the jetpack and their shadow versions are compiled once at
   world start, so equipping only adds small meshes that are already warmed up). */
(function c291() {
  const U = window.__c291 = {err: null, warm: 0, warmMs: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  if (SET.legs === undefined) SET.legs = 1;
  function row() { try { if (document.getElementById('legsSeg')) return; const ref = document.querySelector('#vfxSeg') || document.querySelector('#gfxSeg') || document.querySelector('#perfSeg'); const r0 = ref && ref.parentElement && ref.parentElement.closest('.row, .setrow, div'); if (!r0) return;
      const r2 = r0.cloneNode(true); r2.setAttribute('data-testid', 'legs-row'); const seg = r2.querySelector('[id$="Seg"]'); seg.id = 'legsSeg'; const lab = r2.querySelector('label, span, b'); if (lab) lab.textContent = 'Show legs in first person';
      seg.innerHTML = '<button data-v="0" data-testid="legs-off">Off</button><button data-v="1" data-testid="legs-on">On</button>'; const vp = window.__c163 && __c163.panes && __c163.panes.video; if (vp) vp.appendChild(r2); else r0.after(r2);
      const sync = () => seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === (SET.legs ? 1 : 0))); sync();
      seg.querySelectorAll('button').forEach(b => b.addEventListener('click', e => { e.preventDefault(); SET.legs = Number(b.dataset.v); try { saveSet(); } catch (_) {} sync(); })); } catch (e) { ERR('row', e); } }
  row(); setTimeout(row, 1500); setTimeout(row, 5000);
  const st = document.createElement('style'); st.textContent = '.rec.no{background:linear-gradient(rgba(170,30,30,.42),rgba(120,20,20,.42))!important;border-color:#a33!important;filter:saturate(.7)}.rec.no img,.rec.no i{opacity:.75}'; document.head.appendChild(st);
  // ---------- warm up armour + jetpack shaders ----------
  let done = null;
  setInterval(() => { try { if (!started || done === current.id) return; done = current.id; const t0 = performance.now(); const keep = armour.slice(); const g = new THREE.Group(); scene.add(g);
      const m = buildPlayerModel(false); g.add(m); m.position.set(P.x, P.y, P.z - 3);
      const ids = Object.keys(ARMOUR).map(Number), mats = [...new Set(ids.map(i => ARMOUR[i].mat))];
      for (const mt of mats) { for (let s = 0; s < 4; s++) armour[s] = 0; for (const i of ids) if (ARMOUR[i].mat === mt && ARMOUR[i].slot < 4) armour[ARMOUR[i].slot] = i; const jet = ids.find(i => ARMOUR[i].slot === 4); if (jet !== undefined) armour[4] = jet;
        const c = buildPlayerModel(false); try { dressModel(c); } catch (_) {} c.position.copy(m.position); g.add(c); }
      for (let i = 0; i < keep.length; i++) armour[i] = keep[i];
      try { renderer.compile(scene, camera); } catch (e) { ERR('compile', e); }
      requestAnimationFrame(() => requestAnimationFrame(() => { scene.remove(g); }));
      U.warm++; U.warmMs = Math.round(performance.now() - t0); } catch (e) { ERR('warm', e); } }, 1000);
})();
