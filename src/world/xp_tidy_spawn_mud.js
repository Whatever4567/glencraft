/* ===================== GLX-C120 (v1.0.0): XP across worlds, tidy spawn, wet mud, rubies, crafting tabs, HD blocks + icons, fangs, treeman face, butterfly swim ===================== */
(function c120() {
  const U = window.__c120 = {log: [], made: {}};
  const PH = !!touchMode;
  const inB = (x, y, z) => x >= 0 && z >= 0 && x < W && z < D && y >= 0 && y < H;
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };
  const rng = s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const isPlaced = k => { try { return !!(placedSet && placedSet.has(k)); } catch (_) { return false; } };

  /* ---------------- 1) white stack counts ---------------- */
  try { const st = document.createElement('style'); st.id = 'c120css';
    st.textContent = '.slot b,.gslot b,.fslot b,.tile b,.aslot b,.hslot b,#cursorStack b,#hotbar b,.inv b,.cnt{color:#fff!important;text-shadow:0 1px 2px #000,0 0 3px #000,1px 1px 0 #000!important}';
    document.head.appendChild(st); } catch (_) {}

  /* ---------------- 2) XP is shared across every dimension ---------------- */
  try {
    const ap = applySave; applySave = function (d) {
      const keep = (DIM.busy && typeof xpState === 'function') ? xpState() : null; const r = ap.apply(this, arguments);
      if (keep && window.__c105xp) window.__c105xp(keep.xp, keep.lvl);
      if (d && !d.dim && !DIM.busy) U.xpFix = !!(d.c120 && d.c120.xp);
      return r; };
    const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (!DIM.cur) d.c120 = Object.assign({}, d.c120 || {}, U.flags || {}); } catch (_) {} return d; };
  } catch (e) { console.warn('c120 xp', e); }
  async function recoverXP() {
    let best = xpState(); const src = [];
    for (const nm of ['hell']) { let d = null; try { d = await idbGet('worlds', dimKey(nm)); } catch (_) {}
      if (d && (d.lvl | 0) > 0) src.push(d); }
    for (const d of src) if ((d.lvl | 0) > best.lvl || ((d.lvl | 0) === best.lvl && (d.xp | 0) > best.xp)) best = {xp: d.xp | 0, lvl: d.lvl | 0};
    const cur = xpState(); if (best.lvl !== cur.lvl || best.xp !== cur.xp) { window.__c105xp(best.xp, best.lvl); U.log.push('xp ' + best.lvl); try { toast('Your XP is back: level ' + best.lvl); } catch (_) {} }
  }

  /* ---------------- 3) one-off world fixes: spawn tidy, wet mud, rubies ---------------- */
  const REM = 'YAwbAgFhDBcGAWILFwMBYgwWBwFiDRcDAWMLFgMBYwwVBAFjDBsDAWMNFgMBY5soAQRjmykBA2ObKgIBY5woAQRjnCkBA2OcKgMBY50oAQRjnSkBA2OdKgQBY54oAQRjnikBA2OeKgQBY58oAQRjnykBA2OfKgQBY6AoAQRjoCkBA2OgKgQBY6EoAQRjoSkBA2OhKgMBZAsWAgFkDBUDAWQMGwIBZA0WAgFkmicBBGSaKAEDZJopBAFkmycBBGSbKAEDZJspBQFknCcBBGScKAEDZJwpBgFknScBBGSdKAEDZJ0pBwFknicBBGSeKAEDZJ4pBwFknygBBGSfKQEDZJ8qBgFkoCgBBGSgKQEDZKAqBgFkoSgBBGShKQEDZKEqBQFkoigBBGSiKQEDZKIqAwFlChcBAWULFQMBZQwVAwFlDRUDAWUOFwEBZZonAQRlmigBA2WaKQQBZZsmAQRlmycBA2WbKAcBZZwmAQRlnCcBA2WcKAgBZZ0mAQRlnScBA2WdKAoBZZ4nAQRlnigBA2WeKQkBZZ8nAQRlnygBA2WfKQkBZaAoAQRloCkBA2WgKgcBZaEoAQRloSkBA2WhKgYBZaIpAQRloioBA2WiKwMBZgoWAgFmCxUDAWYMFAECZgwVAgFmDRUDAWYOFgIBZpomAQRmmigEAWabJQEEZpsmAQNmmycHAWacJQEEZpwmAQNmnCcJAWadJgEEZp0nAQNmnSgJAWaeJgEEZp4nAQNmnigKAWafJwEEZp8oAQNmnykJAWagJwEEZqAoAQNmoCkJAWahKAEEZqEpAQNmoSoHAWaiKgEEZqIrAQNmoiwDAWcEFAECZwUUAQJnBhUBAWcHFQEBZwgWAQFnCRYBAWcKFgIBZwsVAgFnDBQBAmcMFQEBZw0VAgFnDhYCAWcPFgEBZxAWAQFnERUBAWcSFQEBZxMUAQJnFBQBAmeaJwMBZ5slAQRnmyYBA2ebJwUBZ5wlAQRnnCYBA2ecJwcBZ50lAQRnnSYBA2edJwkBZ54lAQRnniYBA2eeJwoBZ58mAQRnnycBA2efKAkBZ6AnAQRnoCgBA2egKQgBZ6EoAQRnoSkBA2ehKgYBZ6IpAQRnoioBA2eiKwUBZ6MrAQRnoywBA2ejLQIBaAkWAgFoChYBAWgLFAECaAsVAgFoDBQBAmgMFQIBaA0UAQJoDRUCAWgOFgEBaA8WAgFomyQBBGibJQEDaJsmAwFonCUBBGicJgEDaJwnBAFonSUBBGidJgEDaJ0nBQFoniUBBGieJgEDaJ4nCAFonyYBBGifJwEDaJ8oAwFonywDAWigJgEEaKAnAQNooCgHAWihJwEEaKEoAQNooSkHAWiiKQEEaKIqAQNooisGAWijKgEEaKMrAQNooywGAWikKwEEaKQsAQNopC0FAWilLAEEaKUtAQNopS4EAWkJFgIBaQkeAQFpChUCAWkKHQMBaQsUAQJpCxUBAWkLHQMBaQwUAQJpDBUBAWkMHQMBaQ0UAQJpDRUBAWkNHQMBaQ4VAgFpDh0DAWkPFgIBaQ8eAQFpnSQBBGmdJQEDaZ0mAQFpniUBBGmeJgEDaZ4nAgFpnyUBBGmfJgEDaZ8nBAFpoCYBBGmgJwEDaaAoAwFpoScBBGmhKAEDaaEpCAFpoigBBGmiKQEDaaIqCAFpoykBBGmjKgEDaaMrCQFppCoBBGmkKwEDaaQsCQFppSsBBGmlLAEDaaUtCQFppi0BBGmmLgEDaaYvBwFppy0BBGmnLgEDaacvBgFpqC0BBGmoLgEDaagvBQFqBBQBAmoFFAECagYVAQFqBxUBAWoHGwMBagcgAgFqCBYBAWoIGwcBagkWAQFqCRsDAWoJHwMBagoVAgFqChsCAWoKIAIBagsUAQJqCxUBAWoLHAEBagsgAgFqDBQBAmoMFQEBagwcAQFqDCACAWoNFAECag0VAQFqDRwBAWoNIAIBag4VAgFqDhsCAWoOIAIBag8WAQFqDxsDAWoPHwMBahAWAQFqEBsHAWoRFQEBahEbBAFqESACAWoSFQEBahMUAQJqFBQBAmqfJQEEap8mAQNqnycCAWqgJgEEaqAnAQNqoCgDAWqgLAMBaqEmAQRqoScBA2qhKAkBaqInAQRqoigBA2qiKQoBaqMoAQRqoykBA2qjKgsBaqQpAQRqpCoBA2qkKwwBaqUqAQRqpSsBA2qlLAwBaqYrAQRqpiwBA2qmLQwBaqcsAQRqpy0BA2qnLgoBaqgtAQRqqC4BA2qoLwgBaqkuAQRqqS8BA2qpMAQBawYaAQFrBiIBAWsHGgIBawciAQFrCBoBAWsIIgEBawkWAgFrCRoCAWsJIgEBawoVAgFrChoCAWsKIgEBawsUAQJrCxUCAWsLGgIBawsiAQFrDBQBAmsMFQIBawwbAQFrDCIBAWsNFAECaw0VAgFrDRsBAWsNIgEBaw4VAgFrDhoCAWsOIgEBaw8WAgFrDxoCAWsPIgEBaxAaAQFrECIBAWsRGgEBaxEiAQFrEiIBAWufJgEEa58nAQNrnygEAWugJgEEa6AnAQNroCgGAWuhJgEEa6EnAQNroSgIAWuiJwEEa6IoAQNroikKAWujJwEEa6MoAQNroykMAWukKAEEa6QpAQNrpCoOAWulKQEEa6UqAQNrpSsOAWumKgEEa6YrAQNrpiwOAWunKwEEa6csAQNrpy0NAWuoLAEEa6gtAQNrqC4KAWupLgEEa6kvAQNrqTAGAWwGGgEBbAYiAgFsBxgDAWwHIgIBbAgYAQFsCBoBAWwIIgIBbAkWAgFsCRoBAWwJIgIBbAoVAgFsChoBAWwKIgIBbAsUAQJsCxUBAWwLGgEBbAsiAgFsDBQBAmwMFQEBbAwaAQFsDCICAWwNFAECbA0VAQFsDRoBAWwNIgIBbA4VAgFsDhoBAWwOIgIBbA8WAgFsDxoBAWwPIgIBbBAYAwFsECICAWwQJQEBbBEZAgFsESICAWwSIgIBbKAnAQRsoCgBA2ygKQUBbKEmAQRsoScBA2yhKAgBbKImAQRsoicBA2yiKAoBbKMnAQRsoygBA2yjKQsBbKQoAQRspCkBA2ykKg0BbKUpAQRspSoBA2ylKw0BbKYqAQRspisBA2ymLA0BbKcrAQRspywBA2ynLQ0BbKgsAQRsqC0BA2yoLgsBbKktAQRsqS4BA2ypLwgBbKouAQRsqi8BA2yqMAQBbQQUAQJtBRQBAm0GFQEBbQcVAQFtCBYDAW0JFgIBbQoVAgFtCxQBAm0LFQEBbQwUAQJtDBUTAW0NFAECbQ0VAQFtDSYCAW0OFQMBbQ4lAgFtDxYDAW0PJQEBbRAWAQFtEBgBAW0RFQEBbRIVAQFtExQBAm0UFAECbaAnAQRtoCkEAW2hJgEEbaEnAQNtoSgGAW2iJgEEbaInAQNtoigIAW2jJgEEbaMnAQNtoygKAW2kJwEEbaQoAQNtpCkLAW2lKAEEbaUpAQNtpSoMAW2mKQEEbaYqAQNtpisMAW2nKgEEbacrAQNtpywMAW2oKwEEbagsAQNtqC0LAW2pLAEEbaktAQNtqS4IAW2qLgEEbaovAQNtqjAFAW4JFgIBbgoVAgFuCxQBAm4LFQIBbgwUAQJuDBUCAW4NFAECbg0VAgFuDhUCAW4PFgIBbqEmAQRuoScBA26hKAQBbqImAQRuoicBA26iKAYBbqMnAQRuoygBA26jKQYBbqQnAQRupCgBA26kKQcBbqUoAQRupSkBA26lKggBbqYoAQRupikBA26mKgoBbqcpAQRupyoBA26nKwoBbqgqAQRuqCsBA26oLAoBbqkrAQRuqSwBA26pLQgBbqotAQRuqi4BA26qLwYBbqstAQRuqy4BA26rLwQBbqwtAQRurC4BA26sLwMBbq0sAQRurS0BA26tLgIBbq4rAQRuriwBA26uLQIBbwkWAgFvChUCAW8LFAECbwsVAQFvDBQBAm8MFQEBbw0UAQJvDRUBAW8OFQIBbw8WAgFvpCgBBG+kKQEDb6QqAgFvpSkBBG+lKgEDb6UrAQFvpikBBG+mKgEDb6YrBQFvpykBBG+nKgEDb6crBwFvqCoBBG+oKwEDb6gsCAFvqSoBBG+pKwEDb6ksCAFvqisBBG+qLAEDb6otBwFvqywBBG+rLQEDb6suBQFvrCwBBG+sLQEDb6wuBAFvrSsBBG+tLAEDb60tBAFvrisBBG+uLAEDb64tAwFwBBQBAnAFFAECcAYVAQFwBxUBAXAIFgEBcAkWAQFwChYBAXALFAECcAsVAgFwDBQBAnAMFQEBcA0UAQJwDRUCAXAOFgEBcA8WAQFwEBYBAXARFQEBcBIVAQFwExQBAnAUFAECcKYpAQRwpioBA3CmKwMBcKcoAQRwpykBA3CnKgYBcKgpAQRwqCoBA3CoKwcBcKkqAQRwqSsBA3CpLAcBcKoqAQRwqisBA3CqLAcBcKsrAQRwqywBA3CrLQUBcKwrAQRwrCwBA3CsLQUBcK0rAQRwrSwBA3CtLQQBcK4rAQRwriwBA3CuLQMBcQoWAgFxCxQBAnELFQIBcQwUAQJxDBUCAXENFAECcQ0VAgFxDhYCAXGkKAEEcaQpAQNxpCoCAXGlKQEEcaUqAQNxpSsCAXGmKAEEcaYpAQNxpioDAXGnKAEEcacpAQNxpyoEAXGoKAEEcagpAQNxqCoGAXGoMQIBcakpAQRxqSoBA3GpKwUBcakxAwFxqikBBHGqKgEDcaorCgFxqyoBBHGrKwEDcassCQFxrCoBBHGsKwEDcawsBQFxrDIDAXGtKgEEca0rAQNxrSwEAXGtMwEBca4rAQRxriwBA3GuLQMBca8rAQRxrywBA3GvLQIBcbAqAQRxsCsBA3GwLAEBcgoXAQFyCxUCAXIMFAECcgwVAgFyDRUCAXIOFwEBcqIhAQRyoiIBA3KjJgEEcqMnAQNyoygCAXKkJwEEcqQoAQNypCkCAXKlJwEEcqUoAQNypSkDAXKlMQMBcqYnAQRypigBA3KmKQQBcqYvBwFypycBBHKnKAEDcqcpBAFypy4JAXKoKAEEcqgpAQNyqCoOAXKpKAEEcqkpAQNyqSoOAXKqKQEEcqoqAQNyqisNAXKrKQEEcqsqAQNyqysNAXKsKQEEcqwqAQNyrCsNAXKtKgEEcq0rAQNyrSwMAXKuKgEEcq4rAQNyriwLAXKvKgEEcq8rAQNyrywIAXKwKQEEcrAqAQNysCsBAXKxKAEEcrEpAQNysiYBBHKyJwEDcwoXAQFzCxUDAXMMFAECcwwVAgFzDRUDAXMOFwEBc58fAQRzoiIBBHOiIwEDc6MlAQRzozEEAXOkJQEEc6QmAQNzpCcDAXOkLwgBc6UmAQRzpScBA3OlKAQBc6UtCwFzpiYBBHOmJwEDc6YoEQFzpycBBHOnKAEDc6cpEAFzqCcBBHOoKAEDc6gpEQFzqSgBBHOpKQEDc6kqEAFzqigBBHOqKQEDc6oqEAFzqykBBHOrKgEDc6srDwFzrCkBBHOsKgEDc6wrDwFzrSkBBHOtKgEDc60rDwFzrikBBHOuKgEDc64rDwFzrykBBHOvKgEDc68rDgFzsCkBBHOwLA0Bc7EoAQRzsS4HAXOyJgEEc7InAQNzsyYBBHOzKAEBc7QnAQRztCgBA3O0KQIBdAsWAgF0DBUCAXQNFgIBdJ4fAQN0oCkCAXShKQMBdKIjAQR0oioEAXSiMgcBdKMkAQR0oyUBA3SjKhABdKQkAQR0pCUBA3SkJgEBdKQqEAF0pSUBBHSlJgEDdKUnAQF0pSsQAXSmJQEEdKYmAQN0picUAXSnJgEEdKcnAQN0pygUAXSoJwEEdKgoAQN0qCkBAXSoKxEBdKknAQR0qSgBA3SpKRQBdKooAQR0qioTAXSrKAEEdKsqEwF0rCgBBHSsKQEDdKwqEwF0rSkBBHStKgEDdK0rEQF0rikBBHSuKgEDdK4rEQF0rykBBHSvKgEDdK8rEAF0sCgBBHSwKhABdLErDwF0sicBBHSyKAEDdLIpAgF0si0LAXSzJwEEdLMoAQN0sykDAXSzMAUBdLQnAQR0tCgBA3S0KQMBdLUoAQR0tSkBA3S1KgMBdLYpAQR0tioBA3S2KwIBdQsWAgF1DBUGAXUNFgIBdZ8oAwF1oCcFAXWhJwcBdaEwCQF1oiIBBHWiIwEDdaIoEwF1oyMBBHWjJAEDdaMlAQF1oygTAXWkJAEEdaQlAQN1pCYBAXWkKRMBdaUkAQR1pSUBA3WlJgIBdaUpEwF1piUBBHWmJgEDdaYnFgF1pyUBBHWnJgEDdacnAwF1pysSAXWoJgEEdagnAQN1qCgWAXWpJwEEdakoAQN1qSkVAXWqJwEEdaopFQF1qygBBHWrKQEDdasqFAF1rCgBBHWsKQEDdawqFAF1rSgBBHWtKQEDda0qFAF1rigBBHWuKQEDda4qEwF1rykBA3WvKhIBdbApAQN1sCoSAXWxKAEEdbEpAQN1sSoRAXWyKAEEdbIpAQN1sioQAXWzKAEEdbMpAQN1syoQAXW0KAEEdbQpAQN1tCoOAXW1KQEEdbUqAQN1tSsDAXW1MAUBdbYpAQR1tioBA3W2KwMBdbcqAQR1tysBA3W3LAIBdgsXAgF2DBYDAXYMGgEBdg0XAgF2nycFAXafMgUBdqAnBgF2oDEJAXahJwYBdqEyCQF2oiEBBHaiIgEDdqInBwF2ojELAXajIgEEdqMjAQN2oyQCAXajJxYBdqQjAQR2pCQBA3akJQIBdqQoFQF2pSQBBHalJQEDdqUmAgF2pSkUAXamJAEEdqYlAQN2piYYAXanJQEEdqcmAQN2pycCAXanKhQBdqglAQR2qCYBA3aoJwIBdqgqFAF2qSYBBHapJwEDdqkoFwF2qicBBHaqKAEDdqopFgF2qycBBHarKAEDdqspFgF2rCcBBHasKAEDdqwpFgF2rSgBBHatKQEDdq0qFAF2rigBBHauKQEDdq4qFAF2rygBBHavKQEDdq8qFAF2sCgBBHawKQEDdrAqEwF2sSgBBHaxKQEDdrEqEgF2sigBBHayKQEDdrIqEgF2sygBBHazKQEDdrMqEQF2tCgBBHa0KQEDdrQqEAF2tSkBBHa1KgEDdrUrDgF2tikBBHa2KgEDdrYrDAF2tyoBBHa3KwEDdrcsAgF2uCsBBHa4LAEDdrgtAQF3nigDAXefJwUBd58yCAF3oB4BBHegJwUBd6AzCAF3oScGAXehMwkBd6InBwF3ojILAXejIQEEd6MiAQN3oyMCAXejJwcBd6MxDQF3pCIBBHekIwEDd6QkAwF3pCgWAXelIwEEd6UkAQN3pSUZAXemJAEEd6YlAQN3piYCAXemKRYBd6ckAQR3pyUBA3enJgIBd6cqFQF3qCUBBHeoJgEDd6gnGAF3qEECAXepJgEEd6knAQN3qSgXAXeqJgEEd6onAQN3qigXAXerJwEEd6soAQN3qykWAXesJwEEd6woAQN3rCkWAXetJwEEd60oAQN3rSkWAXeuKAEEd64pAQN3rioVAXevKAEEd68pAQN3ryoVAXewKAEEd7ApAQN3sCoUAXexKAEEd7EpAQN3sSoTAXeyKAEEd7IpAQN3sioTAXezKAEEd7MpAQN3syoSAXe0KQEEd7QqAQN3tCsQAXe1KQEEd7UqAQN3tSsPAXe2KgEEd7YrAQN3tiwNAXe3KgEEd7crAQN3tywIAXe4KwEEd7gsAQN3uC0CAXe5KwEEd7ksAQN3uS0CAXieKAQBeJ4zBQF4nycFAXifMwgBeKAeAQR4oCYGAXigMwkBeKEfAQR4oSABA3ihIQEBeKEmBwF4oTMKAXiiIAEEeKIhAQN4oiICAXiiJgcBeKIzCwF4oyIBA3ijIwEBeKMnBwF4ozIMAXikIgEEeKQjAQN4pCQCAXikJxgBeKUjAQR4pSQBA3ilJQIBeKUoFwF4piMBBHimJAEDeKYlAwF4pikWAXinJAEEeKclAQN4pyYCAXinKhYBeKglAQR4qCYBA3ioJxwBeKklAQR4qSYBA3ipJxkBeKomAQR4qicBA3iqKBgBeKsmAQR4qycBA3irKBgBeKwnAQR4rCgBA3isKRcBeK0nAQR4rSgBA3itKRcBeK4nAQR4rigBA3iuKRcBeK8oAQR4rykBA3ivKhUBeLAoAQR4sCkBA3iwKhUBeLEoAQR4sSkBA3ixKhQBeLIoAQR4sikBA3iyKhQBeLMoAQR4sykBA3izKhMBeLQpAQR4tCoBA3i0KxEBeLUpAQR4tSoBA3i1KxABeLYqAQR4tisBA3i2LA4BeLcqAQR4tysBA3i3LA0BeLgrAQR4uCwBA3i4LQIBeLgwAwF4uSsBBHi5LAEDeLktAgF5nBcBBHmdKQEBeZ4bAQR5nicEAXmeMwcBeZ8cAQR5nycFAXmfMwgBeaAdAQR5oB8EAXmgJgYBeaA0CQF5oR4BBHmhIQQBeaEmBgF5oTQKAXmiHwEEeaIjCgF5ojMMAXmjIwoBeaMyDQF5pCIBA3mkIwIBeaQmGgF5pSIBBHmlIwEDeaUkAwF5pSgYAXmmIwEEeaYkAQN5piUCAXmmKRcBeackAQR5pyUBA3mnJhoBeagkAQR5qCUBA3moJh0BeaklAQR5qSYBA3mpJxoBeaolAQR5qiYBA3mqJxoBeasmAQR5qycBA3mrKBkBeawmAQR5rCcBA3msKBkBea0nAQR5rSgBA3mtKRcBea4nAQR5rigBA3muKRcBea8nAQR5rygBA3mvKRcBebAoAQR5sCkBA3mwKhYBebEoAQR5sSkBA3mxKhUBebIoAQR5sikBA3myKhUBebMoAQR5sykBA3mzKhQBebQpAQR5tCoBA3m0KxIBebUpAQR5tSoBA3m1KxEBebYqAQR5tisBA3m2LA8BebcqAQR5tysBA3m3LA4BebgrAQR5uCwBA3m4LQkBebkrAQR5uSwBA3m5LQIBebosAQR5ui0BA3m6LgEBepsXAQR6nBcBBHqdHwIBep0oAwF6nTUCAXqeGwEEep4gAwF6nicEAXqeNAcBep8cAQR6nyAGAXqfJwQBep80CAF6oB0BBHqgIQsBeqA0CQF6oR4BBHqhIgoBeqE0CwF6oiQJAXqiMwwBeqMlCAF6ozIOAXqkJxkBeqUjAQN6pSgYAXqmIgEEeqYjAQN6piQDAXqmKhcBeqcjAQR6pyQBA3qnJRwBeqgkAQR6qCUBA3qoJh0BeqklAQR6qSYBA3qpJxoBeqolAQR6qiYBA3qqJxoBeqsmAQR6qycBA3qrKBkBeqwmAQR6rCcBA3qsKBkBeq0nAQR6rSgBA3qtKRgBeq4nAQR6rigBA3quKRgBeq8nAQR6rygBA3qvKRgBerAnAQR6sCgBA3qwKRcBerEoAQR6sSkBA3qxKhYBerIoAQR6sikBA3qyKhUBerMoAQR6sykBA3qzKhUBerQpAQR6tCoBA3q0KxMBerUpAQR6tSoBA3q1KxIBerYpAQR6tioBA3q2KxEBercqAQR6tysBA3q3LA4BergqAQR6uCsBA3q4LAwBerkrAQR6uSwBA3q5LQgBerorAQR6uiwBA3q6LQIBe5sXAQR7nB8CAXucKQEBe50fBQF7nSgDAXudNAUBe54fDAF7njQHAXufIQoBe580CQF7oCMJAXugNAoBe6EkCAF7oTQLAXuiJgcBe6IzDQF7oyYHAXujMg4Be6QnGgF7pSgZAXumJAIBe6YqFwF7pyMBBHunJAEDe6clAwF7pykYAXunQgEBe6gkAQR7qCUBA3uoJh0Be6kkAQR7qSUBA3upJhsBe6olAQR7qiYBA3uqJxoBe6slAQR7qyYBA3urJxoBe6wmAQR7rCcBA3usKBkBe60mAQR7rScBA3utKBkBe64nAQR7rigBA3uuKRgBe68nAQR7rygBA3uvKRgBe7AnAQR7sCgBA3uwKRgBe7EoAQR7sSkBA3uxKhYBe7IoAQR7sikBA3uyKhYBe7MoAQR7sykBA3uzKhUBe7QoAQR7tCkBA3u0KhQBe7UpAQR7tSoBA3u1KxMBe7YpAQR7tioBA3u2KxIBe7cqAQR7tysBA3u3LA8Be7gqAQR7uCsBA3u4LA0Be7kqAQR7uSsBA3u5LAsBe7orAQR7uiwBA3u6LQIBe7srAQR7uywBA3u7LQEBfJoXAQR8mxcBBHycHwMBfJwpAQF8nDUCAXydHAoBfJ0nBAF8nTQGAXyeHwwBfJ40CAF8nyMIAXyfNAkBfKAlBgF8oDQLAXyhJQcBfKE0CwF8oiYHAXyiMw0BfKMmBwF8ozIPAXykJxoBfKUoGQF8pioXAXynIwEEfKckAQN8pyUCAXynKRoBfKgjAQR8qCQBA3yoJR4BfKkkAQR8qSUBA3ypJhsBfKolAQR8qiYBA3yqJxoBfKslAQR8qyYBA3yrJxoBfKwmAQR8rCcBA3ysKBoBfK0mAQR8rScBA3ytKBoBfK4mAQR8ricBA3yuKBoBfK8nAQR8rygBA3yvKRgBfLAnAQR8sCgBA3ywKRgBfLEnAQR8sSgBA3yxKRgBfLIoAQR8sikBA3yyKhYBfLMoAQR8sykBA3yzKhUBfLQoAQR8tCkBA3y0KhUBfLUpAQR8tSoBA3y1KxMBfLYpAQR8tioBA3y2KxIBfLcpAQR8tyoBA3y3KxABfLgpAQR8uCoBA3y4Kw8BfLkqAQR8uSsBA3y5LAwBfLoqAQR8uisBA3y6LAkBfLsrAQR8uywBA3y7LQEBfZoXAQR9mykBAX2cHgYBfZwoAwF9nDQFAX2dHQ4BfZ0zBwF9niALAX2eNAgBfZ8hCgF9nzQKAX2gIwIBfaAmBQF9oDQLAX2hJAgBfaE0DAF9oiUIAX2iMg4BfaMmCAF9ozEQAX2kJxoBfaUoGQF9pioYAX2nKRoBfagkAQN9qCccAX2pJAEEfaklAQN9qSYbAX2qJAEEfaolAQN9qiYbAX2rJQEEfasmAQN9qycbAX2sJQEEfawmAQN9rCcbAX2tJgEEfa0nAQN9rSgaAX2uJgEEfa4nAQN9rigaAX2vJwEEfa8oAQN9rykZAX2wJwEEfbAoAQN9sCkYAX2xJwEEfbEoAQN9sSkYAX2yKAEEfbIpAQN9sioWAX2zKAEEfbMpAQN9syoWAX20KAEEfbQpAQN9tCoVAX21KAEEfbUpAQN9tSoUAX22KAEEfbYpAQN9tioTAX23KQEEfbcqAQN9tysRAX24KQEEfbgqAQN9uCsPAX25KQEEfbkqAQN9uSsOAX26KQEEfboqAQN9uisLAX27KgEEfbsrAQN9uywCAX28KgEEfbwrAQN9vCwBAX6aFwEEfpsfAgF+mykBAX6cHwgBfpwoBAF+nDQFAX6dHg4Bfp0zCAF+nh8MAX6eMwoBfp8iCQF+nzMLAX6gJQYBfqAzDAF+oSUIAX6hMw0BfqIlCAF+ojEPAX6jJhsBfqQmGwF+pSgZAX6mKhgBfqcpGgF+qCYdAX6pJQEDfqkmGwF+qiUBA36qJhsBfqslAQR+qyYBA36rJxsBfqwlAQR+rCYBA36sJxsBfq0mAQR+rScBA36tKBoBfq4mAQR+ricBA36uKBoBfq8mAQR+rycBA36vKBoBfrAnAQR+sCgBA36wKRgBfrEnAQR+sSgBA36xKRgBfrInAQR+sigBA36yKRcBfrMoAQR+sykBA36zKhYBfrQoAQR+tCkBA360KhUBfrUoAQR+tSkBA361KhQBfrYoAQR+tikBA362KhMBfrcoAQR+tykBA363KhIBfrgoAQR+uCkBA364KhEBfrkoAQR+uSkBA365Kg8BfrooAQR+uikBA366Kg0BfrsoAQR+uykBA367KgMBfrsvBQF+vCgBBH68KQEDfrwqAgF/mhcBBH+bHgQBf5spAgF/mzUCAX+cHBIBf5w0BgF/nR8NAX+dMgkBf54fDQF/njMKAX+fIQEBf58kCAF/nzMLAX+gJAkBf6AzDAF/oSUIAX+hMg4Bf6IlGwF/oyYbAX+kJhsBf6UoGQF/pioYAX+nKRoBf6gmHQF/qSUBA3+pJhsBf6olAQN/qiYbAX+rJQEEf6smAQN/qyccAX+sJQEEf6wmAQN/rCccAX+tJgEEf60nAQN/rSgbAX+uJgEEf64nAQN/rigaAX+vJgEEf68nAQN/rygaAX+wJwEEf7AoAQN/sCkYAX+xJwEEf7EoAQN/sSkYAX+yJwEEf7IoAQN/sikYAX+zJwEEf7MoAQN/sykXAX+0JwEEf7QoAQN/tCkWAX+1KAEEf7UpAQN/tSoVAX+2KAEEf7YpAQN/tioTAX+3KAEEf7cpAQN/tyoSAX+4KAEEf7gpAQN/uCoRAX+5KAEEf7kpAQN/uSoQAX+6KAEEf7opAQN/uioOAX+7JwEEf7soAQN/uykCAX+7LgcBf7wnAQR/vCgBA3+8KQEBgJkXAQSAmhcBBICbHQUBgJspBAGAmzUDAYCcHwYBgJwnCAGAnDMHAYCdHwYBgJ0nFQGAniAeAYCfIhwBgKAlGgGAoSUbAYCiJRsBgKMmGwGApCYbAYClKBoBgKYqGAGApykaAYCoJh0BgKklHAGAqiUBA4CqJhwBgKslAQSAqyYBA4CrJxwBgKwlAQSArCYBA4CsJxwBgK0mAQSArScBA4CtKBsBgK4mAQSAricBA4CuKBsBgK8mAQSArycBA4CvKBoBgLAnAQSAsCgBA4CwKRkBgLEnAQSAsSgBA4CxKRgBgLInAQSAsigBA4CyKRgBgLMnAQSAsygBA4CzKRcBgLQnAQSAtCgBA4C0KRYBgLUnAQSAtSgBA4C1KRYBgLYnAQSAtigBA4C2KRUBgLcnAQSAtygBA4C3KRQBgLgnAQSAuCgBA4C4KRIBgLknAQSAuSgBA4C5KREBgLonAQSAuigBA4C6KQEBgLorDQGAuyYBBIC7JwEDgLsoAQGAuy0IAYC8JgEEgLwnAQOAvCgBAYGZFwEEgZofAQGBmisBAYGbHgUBgZsqBQGBmzQEAYGcHwUBgZwpEQGBnR8FAYGdKRMBgZ4gBQGBnigWAYGfIh0BgaAlGgGBoSQcAYGiJRsBgaMmGwGBpCYbAYGlKBoBgaYqGAGBpygbAYGoJh0BgaklHAGBqiUBA4GqJhwBgaslAQSBqyYBA4GrJxwBgawlAQSBrCYBA4GsJxwBga0lAQSBrSYBA4GtJxwBga4mAQSBricBA4GuKBsBga8mAQSBrycBA4GvKBoBgbAmAQSBsCcBA4GwKBoBgbEnAQSBsSgBA4GxKRgBgbInAQSBsigBA4GyKRgBgbMnAQSBsygBA4GzKRcBgbQnAQSBtCgBA4G0KRYBgbUnAQSBtSgBA4G1KRYBgbYnAQSBtigBA4G2KRUBgbcnAQSBtygBA4G3KRQBgbgnAQSBuCgBA4G4KRMBgbkmAQSBuScBA4G5KBIBgbomAQSBuicBA4G6KAEBgborDQGBuyYBBIG7JwEDgbsoAQGBuy0JAYG8JgEEgbwnAQOBvCgBAYKZFwEEgpodBQGCmioEAYKbHwUBgpsqCAGCmzMFAYKcHwUBgpwqEAGCnR8GAYKdKRMBgp4fBgGCnikVAYKfIAIBgp8jHAGCoCUaAYKhJRsBgqIlGwGCoyYbAYKkJhsBgqUoGgGCpioYAYKnKBsBgqgmHQGCqSUcAYKqJQEDgqomHAGCqyUBBIKrJgEDgqsnHAGCrCUBBIKsJgEDgqwnHAGCrSUBBIKtJgEDgq0nHAGCriYBBIKuJwEDgq4oGwGCryYBBIKvJwEDgq8oGgGCsCYBBIKwJwEDgrAoGgGCsScBBIKxKAEDgrEpGAGCsicBBIKyKAEDgrIpGAGCsycBBIKzKAEDgrMpFwGCtCcBBIK0KAEDgrQpFgGCtScBBIK1KAEDgrUpFgGCticBBIK2KAEDgrYpFQGCtycBBIK3KAEDgrcpFAGCuCYBBIK4JwEDgrgoFAGCuSYBBIK5JwEDgrkoEgGCuiYBBIK6JwEDgrooAQGCuisNAYK7JQEEgrsmAQOCuycCAYK7LQkBgrwlAQSCvCYBA4K8JwIBg5kXAQSDmh4CAYOaKwEBg5sfBAGDmyoFAYObNAQBg5wfBQGDnCkRAYOdHwUBg50pEwGDniAFAYOeKBYBg58iHQGDoCUaAYOhJBwBg6IlGwGDoyYbAYOkJhsBg6UoGgGDpioXAYOnKBsBg6gmHQGDqSUBA4OpJhsBg6olAQODqiYdAYOrJQEEg6smAQODqyccAYOsJQEEg6wmAQODrCccAYOtJQEEg60mAQODrSccAYOuJgEEg64nAQODrigbAYOvJgEEg68nAQODrygaAYOwJgEEg7AnAQODsCgaAYOxJwEEg7EoAQODsSkYAYOyJwEEg7IoAQODsikYAYOzJwEEg7MoAQODsykXAYO0JwEEg7QoAQODtCkWAYO1JwEEg7UoAQODtSkWAYO2JwEEg7YoAQODtikVAYO3JgEEg7cnAQODtygVAYO4JgEEg7gnAQODuCgUAYO5JgEEg7knAQODuSgSAYO6JQEEg7omAQODuicCAYO6Kw0Bg7slAQSDuyYBA4O7JwIBg7stCQGDvCUBBIO8JgEDg7wnAQGEmRcBBISaFwEEhJsdBQGEmykEAYSbNQMBhJwfBgGEnCcIAYScMwcBhJ0fBgGEnScVAYSeIB4BhJ8iHAGEoCUaAYShJRsBhKIlGwGEoyYbAYSkJhsBhKUoGgGEpioXAYSnKRoBhKgmHQGEqSUBA4SpJhsBhKolAQOEqiYdAYSrJQEEhKsmAQOEqyccAYSsJQEEhKwmAQOErCccAYStJgEEhK0nAQOErSgbAYSuJgEEhK4nAQOErigbAYSvJgEEhK8nAQOErygaAYSwJgEEhLAnAQOEsCgaAYSxJwEEhLEoAQOEsSkYAYSyJwEEhLIoAQOEsikYAYSzJwEEhLMoAQOEsykXAYS0JwEEhLQoAQOEtCkWAYS1JwEEhLUoAQOEtSkWAYS2JwEEhLYoAQOEtikVAYS3JgEEhLcnAQOEtygVAYS4JgEEhLgnAQOEuCgTAYS5JgEEhLknAQOEuSgSAYS6JQEEhLomAQOEuicDAYS6Kw0BhLslAQSEuyYBA4S7JwEBhLstCAGEvCQBBIS8JQEDhLwmAgGFmhcBBIWaGAEDhZsdBQGFmykCAYWbNQIBhZwfDwGFnDQGAYWdHw0BhZ0yCQGFnh8NAYWeMwoBhZ8hAQGFnyQIAYWfMwsBhaAkCQGFoDMMAYWhJQgBhaEyDgGFoiUbAYWjJhsBhaQmGwGFpSgZAYWmKhcBhacpGgGFqCYdAYWpJQEDhakmGwGFqiUBA4WqJh0BhaslAQSFqyYBA4WrJxwBhawlAQSFrCYBA4WsJxwBha0mAQSFrScBA4WtKBsBha4mAQSFricBA4WuKBoBha8mAQSFrycBA4WvKBoBhbAmAQSFsCcBA4WwKBkBhbEnAQSFsSgBA4WxKRgBhbInAQSFsigBA4WyKRgBhbMnAQSFsygBA4WzKRcBhbQnAQSFtCgBA4W0KRYBhbUnAQSFtSgBA4W1KRYBhbYnAQSFtigBA4W2KRQBhbcmAQSFtycBA4W3KBQBhbgmAQSFuCcBA4W4KBMBhbkmAQSFuScBA4W5KBIBhbolAQSFuiYBA4W6JxEBhbskAQSFuyUBA4W7JgMBhbsuBwGFvCQBBIaaGAEEhpsfAgGGmykBAYacHwgBhpwoBAGGnDQFAYadHw0Bhp0zCAGGnh8MAYaeMwoBhp8iCQGGnzMLAYagJQYBhqAzDAGGoSUIAYahMw0BhqIlCAGGojEPAYajJhsBhqQmGwGGpSgZAYamKhYBhqcpGgGGqCYdAYapJQEDhqkmGwGGqiUBBIaqJgEDhqonGwGGqyUBBIarJgEDhqsnGwGGrCUBBIasJgEDhqwnGwGGrSYBBIatJwEDhq0oGgGGriYBBIauJwEDhq4oGgGGryYBBIavJwEDhq8oGgGGsCcBBIawKAEDhrApGAGGsScBBIaxKAEDhrEpGAGGsicBBIayKAEDhrIpFwGGsycBBIazKAEDhrMpFwGGtCcBBIa0KAEDhrQpFgGGtScBBIa1KAEDhrUpFQGGticBBIa2KAEDhrYpFAGGtyYBBIa3JwEDhrcoFAGGuCYBBIa4JwEDhrgoEwGGuSYBBIa5JwEDhrkoEQGGuiUBBIa6JgEDhronBAGGuiwLAYa7JQEEhrsmAQOGuycDAYa7LwUBhrwkAQSGvCUBA4a8JgIBh5spAQGHnB4GAYecKAMBh5w0BQGHnR8MAYedMwcBh54gCwGHnjQIAYefIQoBh580CgGHoCMCAYegJgUBh6A0CwGHoSQIAYehNAwBh6IlCAGHojIOAYejJggBh6MxEAGHpCcaAYelKBgBh6YqFgGHpykaAYeoJxwBh6klAQOHqSYcAYeqJQEEh6omAQOHqicbAYerJQEEh6smAQOHqycbAYesJgEEh6wnAQOHrCgaAYetJgEEh60nAQOHrSgaAYeuJgEEh64nAQOHrigaAYevJwEEh68oAQOHrykZAYewJwEEh7AoAQOHsCkYAYexJwEEh7EoAQOHsSkYAYeyJwEEh7IoAQOHsikXAYezJwEEh7MoAQOHsykXAYe0JwEEh7QoAQOHtCkWAYe1JwEEh7UoAQOHtSkVAYe2JwEEh7YoAQOHtikUAYe3JwEEh7coAQOHtykTAYe4JwEEh7goAQOHuCkRAYe5JgEEh7knAQOHuSgRAYe6JgEEh7onAQOHuigEAYe6LQkBh7smAQSHuycBA4e7KAMBh7wlAQSHvCYBA4e8JwIBiJsZAQSInB0BA4icHgQBiJwpAQGInDUCAYidHwcBiJ0nBAGInTQGAYieHwwBiJ40CAGInyMIAYifNAkBiKAlBgGIoDQLAYihJQcBiKE0DAGIoiYHAYiiMw0BiKMmBwGIozIPAYikJxkBiKUoGAGIpioVAYinKRoBiKgnHAGIqSUBBIipJgEDiKknGwGIqiUBBIiqJgEDiKonGwGIqyYBBIirJwEDiKsoGgGIrCYBBIisJwEDiKwoGgGIrSYBBIitJwEDiK0oGgGIricBBIiuKAEDiK4pGQGIrycBBIivKAEDiK8pGAGIsCcBBIiwKAEDiLApGAGIsScBBIixKAEDiLEpGAGIsicBBIiyKAEDiLIpFwGIsycBBIizKAEDiLMpFgGItCcBBIi0KAEDiLQpFgGItScBBIi1KAEDiLUpFQGIticBBIi2KAEDiLYpFAGItycBBIi3KAEDiLcpEgGIuCcBBIi4KAEDiLgpEQGIuScBBIi5KAEDiLkpDwGIuicBBIi6KAEDiLopAwGIui4HAYi7JwEEiLsoAQOIuykCAYmcHgEDiZwfAgGJnCkBAYmdHgEDiZ0fAwGJnSgDAYmdNAUBiZ4eAQSJnh8BA4meIAsBiZ40BwGJnx8BBImfIAEDiZ8hCgGJnzQJAYmgHwEEiaAgAQOJoCELAYmgNAoBiaEgAQSJoSEBA4mhJAgBiaE0CwGJoiYHAYmiMw0BiaMmBwGJozIMAYmkJxgBiaUoFwGJpioVAYmnKRoBiagnHAGJqSYBA4mpJxoBiaomAQSJqicBA4mqKBkBiasmAQSJqycBA4mrKBkBiawmAQSJrCcBA4msKBkBia0nAQSJrSgBA4mtKRgBia4nAQSJrigBA4muKRgBia8nAQSJrygBA4mvKRgBibAnAQSJsCgBA4mwKRgBibEnAQSJsSgBA4mxKRcBibInAQSJsigBA4myKRcBibMnAQSJsygBA4mzKRYBibQnAQSJtCgBA4m0KRUBibUnAQSJtSgBA4m1KRUBibYnAQSJtigBA4m2KRQBibcnAQSJtygBA4m3KRIBibgoAQSJuCkBA4m4Kg8BibkoAQSJuSkBA4m5Kg0BibooAQSJuikBA4m6KgIBibsoAQSJuykBA4m7KgIBipscAQSKmx0BA4qcHgEEipwfAQOKnR4BBIqdHwEDip0gAgGKnSgDAYqdNQIBip4fAQSKniABA4qeIQQBip4nBAGKnjQHAYqfHwEEip8gAQOKnyEFAYqfJwQBip80CAGKoCABBIqgIQEDiqAiCgGKoDQJAYqhIQEEiqEiAQOKoSMJAYqhNAsBiqIhAQSKoiQJAYqiMwwBiqMlCAGKozILAYqkJxcBiqUoFgGKpioUAYqnKRYBiqdCAQGKqCccAYqpJgEEiqknAQOKqSgZAYqqJgEEiqonAQOKqigZAYqrJgEEiqsnAQOKqygZAYqsJwEEiqwoAQOKrCkYAYqtJwEEiq0oAQOKrSkYAYquJwEEiq4oAQOKrikYAYqvJwEEiq8oAQOKrykYAYqwJwEEirAoAQOKsCkXAYqxKAEEirEpAQOKsSoWAYqyKAEEirIpAQOKsioVAYqzKAEEirMpAQOKsyoVAYq0KAEEirQpAQOKtCoUAYq1KAEEirUpAQOKtSoTAYq2KAEEirYpAQOKtioSAYq3KAEEircpAQOKtyoQAYq4KAEEirgpAQOKuCoOAYq5KAEEirkpAQOKuSoDAYq5LgcBiropAQSKuioBA4q6KwIBi5wfAQSLnCABA4ucIQIBi50fAQSLnSABA4udIQMBi50pAQGLnh8BBIueIAEDi54hBAGLnicEAYueMwcBi58gAQSLnyEBA4ufIgQBi58nBQGLnzMIAYugIQEEi6AiAQOLoCMJAYugNAkBi6EhAQSLoSIBA4uhIwkBi6E0CQGLoiIBBIuiIwEDi6IkCQGLojMJAYujIwEEi6MkAQOLoyUIAYujMgoBi6QjAQSLpCQBA4ukJQEBi6QnFQGLpSQBBIulJQEDi6UoFgGLpikVAYunKRYBi6gnAQOLqCgbAYupJgEEi6knAQOLqSgZAYuqJgEEi6onAQOLqigZAYurJwEEi6soAQOLqykYAYusJwEEi6woAQOLrCkYAYutJwEEi60oAQOLrSkXAYuuKAEEi64pAQOLrioWAYuvKAEEi68pAQOLryoWAYuwKAEEi7ApAQOLsCoWAYuxKAEEi7EpAQOLsSoVAYuyKAEEi7IpAQOLsioVAYuzKAEEi7MpAQOLsyoUAYu0KAEEi7QpAQOLtCoTAYu1KAEEi7UpAQOLtSoSAYu2KAEEi7YpAQOLtioRAYu3KAEEi7cpAQOLtyoQAYu4KAEEi7gpAQOLuCoMAYu5KQEEi7kqAQOLuSsCAYu6KQEEi7oqAQOLuisCAYwuGQEBjJwgAQSMnCEBA4ycIgIBjJ0gAQSMnSEBA4ydIgIBjJ4gAQSMniEBA4yeIgMBjJ4oBAGMnjMFAYyfIQEEjJ8iAQOMnyMCAYyfJwUBjJ8zCAGMoCEBBIygIgEDjKAjCQGMoDMJAYyhIgEEjKEjAQOMoSQJAYyhMwgBjKIjAQSMoiQBA4yiJQgBjKIzCAGMoyMBBIyjJAEDjKMlCQGMozIJAYykJAEEjKQlAQOMpCYWAYylJQEEjKUmAQOMpSgXAYymJQEEjKYmAQOMpikVAYynKhYBjKgoGwGMqScBBIypKAEDjKkpFwGMqicBBIyqKAEDjKopFwGMqycBBIyrKAEDjKspFwGMrCgBBIysKQEDjKwqFgGMrSgBBIytKQEDjK0qFgGMrigBBIyuKQEDjK4qFgGMrygBBIyvKQEDjK8qFQGMsCgBBIywKQEDjLAqFQGMsSgBBIyxKQEDjLEqFAGMsigBBIyyKQEDjLIqFAGMsygBBIyzKQEDjLMqEwGMtCgBBIy0KQEDjLQqEgGMtSgBBIy1KQEDjLUqEQGMtigBBIy2KQEDjLYqEAGMtygBBIy3KQEDjLcqDwGMuCkBBIy4KgEDjLgrBAGMuDADAYy5KQEEjLkqAQOMuSsCAY0ZFQEBjRoVAQGNGxUBAY0cFQEBjR0VAQGNHhUBAY0fFQEBjSAVAQGNIRUBAY0iFQEBjSMVAQGNJBUBAY0uGQEBjZ0hAQSNnSIBA42dIwEBjZ4hAQSNniIBA42eIwIBjZ4oAwGNnyEBBI2fIgEDjZ8jAgGNnycFAY2fMggBjaAiAQSNoCMBA42gJAIBjaAnBQGNoDMHAY2hIgEEjaEjAQONoSQJAY2hMwcBjaIjAQSNoiQBA42iJQkBjaIyCAGNoyQBBI2jJQEDjaMmCAGNozEKAY2kJQEEjaQmAQONpCcXAY2lJQEEjaUmAQONpScBAY2lKRUBjaYmAQSNpicBA42mKRYBjacmAQSNpycBA42nKAEBjacqFQGNqCcBBI2oKRYBjaknAQSNqSgBA42pKRYBjaonAQSNqigBA42qKRYBjasoAQSNqykBA42rKhUBjawoAQSNrCkBA42sKhUBja0oAQSNrSkBA42tKhUBja4oAQSNrikBA42uKhUBja8oAQSNrykBA42vKhUBjbAoAQSNsCkBA42wKhQBjbEoAQSNsSkBA42xKhMBjbIoAQSNsikBA42yKhMBjbMoAQSNsykBA42zKhIBjbQoAQSNtCkBA420KhEBjbUoAQSNtSkBA421KhABjbYoAQSNtikBA422Kg8BjbcpAQSNtyoBA423KwkBjbc1AQGNuCkBBI24KgEDjbgrBQGNuSkBBI25KgEDjbkrAwGOGRUBAY4aEAUCjhoVAQGOGxIDAo4bFQEBjhwSAgKOHBUBAY4dEgMCjh0VAQGOHhIDAo4eFQEBjh8TAgKOHxUBAY4gEwECjiAVAQGOIRQBAo4hFQEBjiITAgKOIhUBAY4jFQEBjiQVAQGOJRUBAY4sGAEBji0YAQGOnSEBBI6dIgEDjp0jAQGOniEBBI6eIgEDjp4jAQGOnyIBBI6fIwEDjp8kAQGOnycFAY6fMgUBjqAiAQSOoCMBA46gJAIBjqAnBgGOoDEJAY6hIwEEjqEkAQOOoSUIAY6hMgYBjqIkAQSOoiUBA46iJggBjqIxCAGOoyQBBI6jJQEDjqMmFQGOpCUBBI6kJgEDjqQnFgGOpSYBBI6lJwEDjqUoFQGOpiYBBI6mJwEDjqYoFgGOpycBBI6nKAEDjqcpFQGOqCcBBI6oKAEDjqgqFAGOqSgBBI6pKQEDjqkqFQGOqigBBI6qKQEDjqoqFQGOqygBBI6rKQEDjqsqFQGOrCkBBI6sKgEDjqwrFAGOrSkBBI6tKgEDjq0rEwGOrikBBI6uKgEDjq4rEwGOrykBBI6vKgEDjq8rEwGOsCkBBI6wKgEDjrArEgGOsSkBBI6xKgEDjrErEQGOsikBBI6yKgEDjrIrEQGOsykBBI6zKgEDjrMrEAGOtCgBBI60KQEDjrQqEAGOtSgBBI61KQEDjrUqDwGOtigBBI62KQEDjrYqDQGOtykBBI63KgEDjrcrBgGOtzUBAY64KQEEjrgqAQOOuCsFAY65KQEEjrkqAQOOuSsEAY8ZFQEBjxoSAwKPGhUBAY8bFQEBjxwVAQGPHRUBAY8eFQEBjx8VAQGPIBUBAY8hFQEBjyIVAQGPIxUBAY8kFQEBjyUVAQGPLxkBAY+eIgEEj54jAQOPnyIBBI+fIwEDj58kAQGPnygDAY+gIwEEj6AkAQOPoCUHAY+hJAEEj6ElAQOPoSYIAY+hMAYBj6IkAQSPoiUBA4+iJhIBj6MlAQSPoyYBA4+jJxQBj6QmAQSPpCcBA4+kKBQBj6UmAQSPpScBA4+lKBQBj6YnAQSPpigBA4+mKRQBj6cnAQSPpygBA4+nKQEBj6crEgGPqCgBBI+oKQEDj6gqFAGPqSgBBI+pKQEDj6kqFAGPqikBBI+qKgEDj6orEwGPqykBBI+rKgEDj6srEwGPrCkBBI+sKgEDj6wrEwGPrSkBBI+tKgEDj60rEwGPrikBBI+uKgEDj64rEgGPrykBBI+vKgEDj68rEQGPsCkBBI+wKgEDj7ArEQGPsSkBBI+xKgEDj7ErEAGPsikBBI+yKgEDj7IrDwGPsykBBI+zKgEDj7MrDwGPtCkBBI+0KgEDj7QrDQGPtSkBBI+1KgEDj7UrCgGPtikBBI+2KgEDj7YrBwGPtykBBI+3KgEDj7crBwGPuCkBBI+4KgEDj7grBgGPuSkBBI+5KgEDj7krBAGQGRUBAZAaEgICkBoVAQGQGxUBAZAcFQEBkB0VAQGQHhUBAZAfFAECkB8VAQGQIBUBAZAhFQEBkCIUAQKQIhUBAZAjFQEBkCQVAQGQJRUBAZAmFQEBkC8YAQGQniEBBJCeIgEDkJ8jAQSQnyQBA5CgJAEEkKAlAQOQoCYBAZCgKQIBkKEkAQSQoSUBA5ChJgIBkKEpAwGQoiUBBJCiJgEDkKInAQGQoioEAZCiMgcBkKMmAQSQoycBA5CjKAEBkKMqEAGQpCYBBJCkJwEDkKQoEgGQpScBBJClKAEDkKUpEgGQpigBBJCmKQEDkKYqEQGQpygBBJCnKQEDkKcqEgGQqCkBBJCoKgEDkKgrEQGQqSkBBJCpKgEDkKkrEgGQqikBBJCqKgEDkKorEgGQqykBBJCrKgEDkKsrEgGQrCoBBJCsKwEDkKwsEQGQrSoBBJCtKwEDkK0sEAGQrioBBJCuKwEDkK4sEAGQryoBBJCvKwEDkK8sDwGQsCoBBJCwKwEDkLAsDgGQsSoBBJCxKwEDkLEsDgGQsikBBJCyKgEDkLIrDQGQsykBBJCzKgEDkLMrCgGQtCkBBJC0KgEDkLQrCAGQtSkBBJC1KgEDkLUrCAGQtikBBJC2KgEDkLYrBwGQtykBBJC3KgEDkLcrBwGQuCkBBJC4KgEDkLgrBgGQuSkBBJC5KgEDkLkrBAGRGRUBAZEaEgMCkRoVAQGRGxUBAZEcFQEBkR0VAQGRHhUBAZEfFAECkR8VAQGRIBUBAZEhFQEBkSIUAQKRIhUBAZEjFQEBkSQVAQGRJRQBApElFQEBkSYVAQGRJxUBAZEtFwEBkaAkAQSRoicBA5GjJgEEkaMnAQORoygBAZGjMQQBkaQnAQSRpCgBA5GkKQIBkaQvCAGRpScBBJGlKAEDkaUpAgGRpS4KAZGmKAEEkaYpAQORpioBAZGmLQwBkacpAQSRpyoBA5GnLA0BkagpAQSRqCoBA5GoKw8BkakrAQORqSwOAZGqKgEEkaorAQORqiwOAZGrKgEEkasrAQORqywOAZGsKgEEkawrAQORrCwOAZGtKgEEka0rAQORrSwOAZGuKgEEka4rAQORriwOAZGvKgEEka8rAQORrywNAZGwKgEEkbArAQORsCwNAZGxKgEEkbErAQORsSwJAZGyKgEEkbIrAQORsiwHAZGzKQEEkbMqAQORsysIAZG0KQEEkbQqAQORtCsIAZG1KQEEkbUqAQORtSsHAZG2KQEEkbYqAQORtisHAZG3KQEEkbcqAQORtysGAZG4KQEEkbgqAQORuCsFAZG5KQEEkbkqAQORuSsEAZIZFQEBkhoQBQKSGhUBAZIbEgMCkhsVAQGSHBICApIcFQEBkh0SAwKSHRUBAZIeEQQCkh4VAQGSHxIDApIfFQEBkiASAgKSIBUBAZIhEgMCkiEVAQGSIhMCApIiFQEBkiMTAgKSIxUBAZIjIgEBkiQTAQKSJBUBAZIkIgIBkiUUAQKSJRUBAZImEwICkiYVAQGSJxUBAZIoFQEBki0XAQGSoygBA5KkJwEEkqQoAQOSpCkBAZKlKAEEkqUpAQOSpSoBAZKlMQMBkqYoAQSSpikBA5KmKgEBkqYvBwGSpykBBJKnKgEDkqcwBwGSqCoBBJKoLQsBkqkqAQSSqSsBA5KpLAwBkqorAQSSqiwBA5KqLQsBkqsrAQSSqywBA5KrLQsBkqwrAQSSrCwBA5KsLQsBkq0rAQSSrSwBA5KtLQsBkq4rAQSSriwBA5KuLQoBkq8rAQSSrywBA5KvLQcBkrArAQSSsCwBA5KwLQUBkrEqAQSSsSsBA5KxLAYBkrIqAQSSsisBA5KyLAcBkrMqAQSSsysBA5KzLAcBkrQqAQSStCsBA5K0LAYBkrUpAQSStSoBA5K1KwcBkrYpAQSStioBA5K2KwcBkrcpAQSStyoBA5K3KwYBkrgpAQSSuCoBA5K4KwUBkxkVAQGTGhUBAZMbFQEBkxwVAQGTHRUBAZMeFQEBkx8VAQGTIBUBAZMhFQEBkyIVAQGTIxUBAZMjIgEBkyQVAQGTJCICAZMlFQEBkyYVAQGTJxUBAZMoFQEBk6QpAQGTpSkBA5OmKQEEk6YqAQOTpygBBJOnKQEDk6gqAQSTqCsBA5OoMQIBk6krAQSTqSwBA5OpLQEBk6kxAwGTqisBBJOqLAEDk6otAgGTqjEEAZOrKwEEk6ssAQOTqy0DAZOrMQQBk6wrAQSTrCwBA5OsLQMBk6wyAwGTrSsBBJOtLAEDk60tAwGTrTMBAZOuKwEEk64sAQOTri0DAZOvKwEEk68sAQOTry0EAZOwKwEEk7AsAQOTsC0EAZOxKwEEk7EsAQOTsS0FAZOyKwEEk7IsAQOTsi0FAZOzKgEEk7MrAQOTsywGAZO0KgEEk7QrAQOTtCwGAZO1KQEEk7UqAQOTtSsHAZO2KQEEk7YqAQOTtisGAZO3KQEEk7cqAQOTtysFAZO4KQEEk7gqAQOTuCsDAZQjIgEBlCQiAgGUpygBBJSnKQEDlKgrAQSUqCwBA5SpLAEElKktAQOUqS4BAZSqLAEElKotAQOUqi4CAZSrLAEElKstAQOUqy4CAZSsLAEElKwtAQOUrC4DAZStLAEElK0tAQOUrS4DAZSuLAEElK4tAQOUri4DAZSvLAEElK8tAQOUry4CAZSwLAEElLAtAQOUsC4DAZSxLAEElLEtAQOUsS4DAZSyKwEElLIsAQOUsi0EAZSzKwEElLMsAQOUsy0EAZS0KgEElLQrAQOUtCwFAZS1KgEElLUrAQOUtSwFAZS2KQEElLYqAQOUtisFAZS3KQEElLcqAQOUtysEAZUgFgIBlSEWAgGVIxYCAZUjIQIBlSQWAgGVJCICAZUlFgIBlSYWAgGVJxYCAZWqLQEElaouAQOVqi8BAZWrLQEElasuAQOVqy8CAZWsLQEElawuAQOVrC8CAZWtLQEEla0uAQOVrS8CAZWuLQEEla4uAQOVri8CAZWvLAEEla8tAQOVry4DAZWwLAEElbAtAQOVsC4CAZWxLAEElbEtAQOVsS4CAZWyLAEElbItAQOVsi4CAZWzLAEElbMtAQOVsy4CAZW0KwEElbQsAQOVtC0DAZW1KgEElbUrAQOVtSwEAZW2KgEElbYrAQOVtiwCAZYdFwEBlh4WAgGWHxYCAZYgFgEBliEVAgGWIhUCAZYjFQIBliMhAgGWJBUCAZYkIgIBliUVAwGWJhUCAZYnFQIBligWAQGWKRYCAZYqFwEBlisXAQGWqi0BBJaqLgEDlqovAQGWqy0BBJarLgEDlqsvAgGWrC0BBJasLgEDlqwvAgGWrS0BBJatLgEDlq0vAgGWri0BBJauLgEDlq4vAgGWry0BBJavLgEDlq8vAgGWsC0BBJawLgEDlrAvAQGXGhcDAZcbFgMBlxwWAgGXHRUDAZceFQMBlx8VAgGXIBQBApcgFQIBlyEUAQKXIRUBAZciFAEClyIVAQGXIxQBApcjFQIBlyMhAgGXJBQBApckFQEBlyQiAgGXJRQBApclFQEBlyYUAQKXJhUCAZcnFAEClycVAQGXJyYBAZcoFAEClygVAgGXKCYBAZcpFQIBlyknAQGXKhUCAZcrFQMBlywWAgGXLRYCAZcuFwIBl6ouAQSXqi8BA5eqMAEBl6suAQSXqy8BA5erMAEBl6wuAQSXrC8BA5esMAEBl60uAQSXrS8BA5etMAEBl64uAQSXri8BA5euMAEBl68tAQSXry4BA5evLwIBl7AtAQSXsC4BA5ewLwEBmBgbAgGYGRcGAZgaFgcBmBsVBAGYGxsDAZgcFQMBmBwbAgGYHRUDAZgeFAECmB4VAgGYHxQBApgfFQEBmCAUAQKYIBUCAZghFAECmCEVAQGYIhQBApgiFQEBmCMUAQKYIxUCAZgjIQIBmCQUAQKYJBUBAZgkIgIBmCUUAQKYJRUTAZgmFAECmCYVAgGYJiYCAZgnFAECmCcVAQGYJycBAZgoFAECmCgVAQGYKRQBApgpFQIBmCoVAgGYKxUCAZgsFgEBmC0WBQGYLhcCAZguGgEBmRoXAwGZGxYDAZkcFgIBmR0VAwGZHhUDAZkfFQIBmSAUAQKZIBUCAZkhFAECmSEVAQGZIhQBApkiFQEBmSMUAQKZIxUCAZkjIQIBmSQUAQKZJBUBAZkkIgIBmSUUAQKZJRUBAZkmFAECmSYVAgGZJxQBApknFQEBmSgUAQKZKBUCAZkpFAECmSkVAgGZKhUCAZkrFQMBmSwWAgGZLRYCAZkuFwIBmh0XAQGaHhYCAZofFgIBmiAWAQGaIRUCAZoiFQIBmiMVAgGaIyECAZokFQIBmiQiAgGaJRUDAZomFQIBmicVAgGaKBYBAZopFgIBmioXAQGaKxcBAZsgFgIBmyEWAgGbIxYCAZsjIQIBmyQWAgGbJCICAZslFgIBmyYWAgGbJxYCAZwjIgEBnCQiAgGdIyIBAZ0kIgIBniMiAQGeJCICAd9wFAEC33MUAQLfdhQBAt95FAEC4HAUAQLgcxQBAuB2FAEC4HkUAQLhcBUBAeFzFQEB4XQiAQHhdSICAeF2FQEB4XkVAQHicBUBAeJzFQEB4nMbBAHicyACAeJ0GgEB4nQiAQHidRkCAeJ1IgIB4nYVAQHieRUBAeNwFgEB43MWAQHjcxsHAeN0GgEB43QiAQHjdRgDAeN1IgIB43UlAQHjdhYBAeN2GAEB43kWAQHkcBYBAeRxFgIB5HIWAgHkch4BAeRzFgEB5HMbAwHkcx8DAeR0FgIB5HQaAgHkdCIBAeR1FgIB5HUaAQHkdSICAeR2FgMB5HYlAQHkdxYCAeR4FgIB5HkWAQHlbhcBAeVvFgIB5XAWAgHlcRYBAeVyFQIB5XIdAwHlcxUCAeVzGwIB5XMgAgHldBUCAeV0GgIB5XQiAQHldRUCAeV1GgEB5XUiAgHldhUDAeV2JQIB5XcVAgHleBUCAeV5FgEB5XoWAgHlexcBAeV8FwEB5msXAwHmbBYDAeZtFgIB5m4VAwHmbxUDAeZwFQIB5nEUAQLmcRUCAeZyFAEC5nIVAQHmch0DAeZzFAEC5nMVAQHmcxwBAeZzIAIB5nQUAQLmdBUCAeZ0GwEB5nQiAQHmdRQBAuZ1FQEB5nUaAQHmdSICAeZ2FAEC5nYVAQHmdiYCAeZ3FAEC5ncVAgHmeBQBAuZ4FQEB5nkUAQLmeRUCAeZ6FAEC5noVAgHmexUCAeZ8FQMB5n0WAgHmfhYCAeZ/FwIB52kbAgHnahcGAedrFgcB52wVBAHnbBsDAedtFQMB520bAgHnbhUDAedvFAEC528VAgHncBQBAudwFQEB53EUAQLncRUCAedyFAEC53IVAQHnch0DAedzFAEC53MVAQHncxwBAedzIAIB53QUAQLndBUCAed0GwEB53QiAQHndRQBAud1FQEB53UaAQHndSICAed2FAEC53YVEwHndxQBAud3FQIB53gUAQLneBUBAed5FAEC53kVAQHnehQBAud6FQIB53sUAQLnexUCAed8FAEC53wVAgHnfRUCAed+FQYB538WAwHnfxoBAehrFwMB6GwWAwHobRYCAehuFQMB6G8VAwHocBUCAehxFAEC6HEVAgHochQBAuhyFQEB6HIdAwHocxQBAuhzFQEB6HMcAQHocyACAeh0FAEC6HQVAgHodBoCAeh0IgEB6HUUAQLodRUBAeh1GgEB6HUiAgHodhQBAuh2FQEB6HcUAQLodxUCAeh4FAEC6HgVAQHoeRQBAuh5FQIB6HoUAQLoehUCAeh7FQIB6HwVAwHofRYCAeh+FgIB6H8XAgHpbhcBAelvFgIB6XAWAgHpcRYBAelyFQIB6XIdAwHpcxUCAelzGwIB6XMgAgHpdBUCAel0GgIB6XQiAQHpdRUCAel1GgEB6XUiAgHpdhUCAel3FQIB6XgVAgHpeRYBAel6FgIB6XsXAQHpfBcBAepwFgEB6nEWAgHqchYCAepyHgEB6nMWAQHqcxsDAepzHwMB6nQWAgHqdBoCAep0IgEB6nUWAgHqdRoBAep1IgIB6nYWAgHqdxYCAep4FgIB6nkWAQHrcBYBAetzFgEB63MbBwHrdBoBAet0IgEB63UYAQHrdRoBAet1IgIB63YWAwHreRYBAexwFQEB7HMVAQHscxsDAexzIAIB7HQaAgHsdCIBAex1GAMB7HUiAgHsdhUBAex5FQEB7XAVAQHtcxUBAe10GgEB7XQiAQHtdRoBAe11IgIB7XYVAQHteRUBAQ==';
  const PROBE = [121,164,60,133,156,45,131,160,61,118,159,40,125,165,62,133,161,63,129,156,33,134,158,40,132,170,65,116,168,58,133,162,62,114,169,54,147,169,50,144,162,55,128,181,58,122,159,40,131,170,65,121,163,44,119,176,57,138,165,44,129,155,31,131,158,58,144,162,51,131,166,63];
  const NATL = new Set([0, 255, 5, 6, 13, 2, 3, 1, 12, 202]);
  function tidySpawn(g12) {   // v1.0.12: g12 = new-style world: only the skull goes (its dent becomes the big cave entrance), then the floating bits
    const ox = (W >> 1) - 128, oz = (D >> 1) - 124, b = Uint8Array.from(atob(REM), c => c.charCodeAt(0)); let n = 0; const cols = new Set();
    // is the skull really where we expect it? (if not, only clear obviously man-made blocks)
    let hit = 0; for (let i = 0; i < PROBE.length; i += 3) { const X = ox + PROBE[i], Z = oz + PROBE[i + 1], y = 21 + PROBE[i + 2]; if (inB(X, y, Z)) { const v = world[idx(X, y, Z)]; if (v === 156 || v === 248) hit++; } }
    const sure = hit >= PROBE.length / 6; U.log.push('probe ' + hit);
    const NEWB = [0, 0, T.WATER, T.GRASS, T.DIRT];
    for (let i = 0; i + 4 < b.length; i += 5) { const X = ox + b[i], Z = oz + b[i + 1], y0 = 21 + b[i + 2], L = b[i + 3], ty = b[i + 4]; if (g12 && (ty !== 1 || b[i + 1] < 140)) continue;
      for (let y = y0; y < y0 + L; y++) { if (!inB(X, y, Z)) continue; const k = idx(X, y, Z), o = world[k]; if (isPlaced(k)) continue;
        if (!sure && (NATL.has(o) || ty > 2)) continue; if (o === T.CHEST || o === T.BED || o === T.DOOR || o === T.DOORTOP || o === T.FURNACE) continue;
        const v = NEWB[ty] || 0; if (o === v) continue; if (ty > 2 && !o) continue; world[k] = v; n++; cols.add(X * 4096 + Z); } }
    // floating leftovers: anything not joined to the ground, in the island area
    const x0 = Math.max(1, ox - 6), x1 = Math.min(W - 2, ox + 262), z0 = Math.max(1, oz - 6), z1 = Math.min(D - 2, oz + 262), y0 = Math.max(1, SEA - 8), y1 = H - 1;
    const NX = x1 - x0 + 1, NY = y1 - y0 + 1, NZ = z1 - z0 + 1, vis = new Uint8Array(NX * NY * NZ);
    const li = (x, y, z) => ((x - x0) * NY + (y - y0)) * NZ + (z - z0);
    const sol = (x, y, z) => { const v = world[idx(x, y, z)]; return v && v !== T.WATER && v !== 255; };
    let st = [];
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
      const edge = y === y0 || x === x0 || x === x1 || z === z0 || z === z1; if (!edge) continue; if (sol(x, y, z)) { const l = li(x, y, z); if (!vis[l]) { vis[l] = 1; st.push(x, y, z); } } }
    while (st.length) { const z = st.pop(), y = st.pop(), x = st.pop();
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const X = x + dx, Y = y + dy, Z = z + dz;
        if (X < x0 || X > x1 || Y < y0 || Y > y1 || Z < z0 || Z > z1) continue; const l = li(X, Y, Z); if (vis[l] || !sol(X, Y, Z)) continue; vis[l] = 1; st.push(X, Y, Z); } }
    let fl = 0;
    for (let x = x0 + 1; x < x1; x++) for (let z = z0 + 1; z < z1; z++) for (let y = y0 + 1; y < y1; y++) { const l = li(x, y, z); if (vis[l] || !sol(x, y, z)) continue;
      // gather this loose piece (26-connected)
      const comp = []; let touch = false, keep = false; vis[l] = 2; st = [x, y, z];
      while (st.length) { const cz = st.pop(), cy = st.pop(), cx = st.pop(); comp.push(cx, cy, cz); const k = idx(cx, cy, cz), v = world[k];
        if (isPlaced(k) || (LOGGY && LOGGY[v]) || v === T.CHEST || v === T.BED || v === T.DOOR || v === T.DOORTOP) keep = true;
        if (comp.length > 300) keep = true;
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { if (!dx && !dy && !dz) continue; const X = cx + dx, Y = cy + dy, Z = cz + dz;
          if (X < x0 || X > x1 || Y < y0 || Y > y1 || Z < z0 || Z > z1) continue; const m = li(X, Y, Z); if (!sol(X, Y, Z)) continue; if (vis[m] === 1) { touch = true; continue; } if (vis[m]) continue; vis[m] = 2; st.push(X, Y, Z); } }
      if (touch || keep) continue;
      for (let i = 0; i < comp.length; i += 3) { const k = idx(comp[i], comp[i + 1], comp[i + 2]); world[k] = comp[i + 1] <= SEA ? T.WATER : 0; cols.add(comp[i] * 4096 + comp[i + 2]); fl++; } }
    for (const c of cols) { const X = Math.floor(c / 4096), Z = c % 4096; markDirty(X, Z);
      try { if (typeof g9cols !== 'undefined' && g9cols) { let t = 0; for (let y = H - 2; y > 0; y--) { const v = world[idx(X, y, Z)]; if (v && v !== T.WATER && !(LEAFY && LEAFY[v]) && !(LOGGY && LOGGY[v]) && !(PLANT && PLANT[v] === 1)) { t = y; break; } }
        const ci = (X * D + Z) * 2; g9cols[ci] = t + 1; g9cols[ci + 1] = t + 1 <= SEA ? 5 : 0; } } catch (_) {} }
    U.log.push('spawn ' + n + ' float ' + fl); return n + fl;
  }
  function wetMud() { let n = 0, i = world.indexOf(T.MUD);
    while (i >= 0) { const above = world[i + D]; if (!isPlaced(i) && (!above || (PLANT && PLANT[above] === 1))) { world[i] = 254; n++; const X = Math.floor(i / (H * D)), Z = i % D; markDirty(X, Z); } i = world.indexOf(T.MUD, i + 1); }
    try { if (window.__c118) window.__c118.wref = null; } catch (_) {}
    U.log.push('mud ' + n); return n; }
  function rubies() { const R = rng((gSeed | 0) + 7771 || 99), want = Math.round(W * D / 3200); let v = 0, n = 0, tries = 0;
    while (v < want && tries++ < want * 60) { const x = 2 + Math.floor(R() * (W - 4)), z = 2 + Math.floor(R() * (D - 4)); let top = 0;
      for (let y = H - 2; y > SEA; y--) { const b = world[idx(x, y, z)]; if (b && b !== T.WATER && !(LEAFY && LEAFY[b]) && !(PLANT && PLANT[b] === 1)) { top = y; break; } }
      if (top < SEA + 20) continue;
      let y = R() < 0.5 ? top - 1 - Math.floor(R() * 5) : SEA + 4 + Math.floor(R() * Math.max(1, top - SEA - 10)), cx = x, cz = z, put = 0;
      for (let k = 0, L = 2 + Math.floor(R() * 4); k < L; k++) { if (inB(cx, y, cz)) { const i = idx(cx, y, cz); if (world[i] === T.STONE && !isPlaced(i)) { world[i] = T.RUBYORE; put++; markDirty(cx, cz); } }
        const r = R(); if (r < .3) cx += R() < .5 ? 1 : -1; else if (r < .6) cz += R() < .5 ? 1 : -1; else y += R() < .5 ? 1 : -1; }
      if (put) { v++; n += put; } }
    U.log.push('ruby ' + n + ' in ' + v); return n; }
  U.tidySpawn = tidySpawn; U.wetMud = wetMud; U.rubies = rubies;
  let doneFor = null;
  async function worldFix() {
    if (!started || DIM.cur || DIM.busy || !world || !current) return; if (doneFor === current.id + ':' + world.length) return;
    doneFor = current.id + ':' + world.length;
    let d = null; const F = U.flags = Object.assign({}, U.flagsLoaded || {});
    try { if (!F.isl && g9Island && !(window.__c131 && __c131.on())) { tidySpawn(); } F.isl = 1; } catch (e) { console.warn('c120 isl', e); }
    try { F.mud = 1; /* v1.0.1: no more wet mud */ } catch (e) { console.warn('c120 mud', e); }
    try { if (!F.ruby && typeof genVer !== 'undefined') rubies(); F.ruby = 1; } catch (e) { console.warn('c120 ruby', e); }
    try { if (!F.xp) await recoverXP(); F.xp = 1; } catch (e) { console.warn('c120 xpr', e); }
    try { if (window.autosaveAsync) autosaveAsync(); else saveWorld(true); } catch (_) {}   // v1.0.37: sliced save, no load hitch
  }
  try { const ap2 = applySave; applySave = function (d) { const r = ap2.apply(this, arguments); if (d && !d.dim && !DIM.busy && !DIM.cur) { U.flagsLoaded = Object.assign({}, d.c120 || {}); doneFor = null; } return r; }; } catch (_) {}
  try { const ew = enterWorld; enterWorld = function (save) { U.flagsLoaded = save && save.c120 ? Object.assign({}, save.c120) : {}; doneFor = null; return ew.apply(this, arguments); }; } catch (_) {}
  setInterval(() => { try { if (started && !DIM.cur && !DIM.busy) worldFix(); } catch (_) {} }, 1500);

  /* ---------------- 4) crafting tabs ---------------- */
  try {
    CATS.length = 0; CATS.push(['struct', 'Structures'], ['blocks', 'Blocks'], ['tools', 'Tools'], ['armour', 'Armour'], ['food', 'Food & brews'], ['items', 'Items']);
    CAT_ICON.items = T.TORCH; if (craftCat === 'decor') craftCat = 'struct';
    const nm = id => String(NAMES[id] || '').toLowerCase();
    const TOOLX = new Set([IT.SHEARS, IT.FLINTSTEEL, IT.BUCKET, 212, 213, 140, 410, 330, 185].filter(v => v !== undefined));
    const ARMX = new Set([186, 224, 225, 291]);
    const STRUCT = new Set([T.TABLE, T.FURNACE, T.CHEST, T.DOOR, 65, 170, T.CAULDRON, T.BED, T.TV, 162, 226, 163, 227, 164, 165, 166, 167, 168, 169, 230, 223, 251, 244, 175, 241, 242, 243].filter(v => v !== undefined));
    const LIGHTS = new Set([T.TORCH, 67, 161, 216]);
    const catOf = r => { if (window.categorise) return window.categorise(r.out); const o = r.out, n = nm(o);
      if (LIGHTS.has(o)) return 'items';
      if (TOOL[o] || TOOLX.has(o) || /remote/.test(n)) return 'tools';
      if (ARMOUR[o] || ARMX.has(o) || /shield/.test(n)) return 'armour';
      if (FOOD[o]) return 'food';
      if (STRUCT.has(o) || /fence|gate|door|stairs|ladder|trapdoor/.test(n)) return 'struct';
      if (!PLACEABLE.has(o)) return 'items';
      return 'blocks'; };
    U.catOf = catOf;
    const TYPES = ['pickaxe', 'axe', 'shovel', 'hoe', 'sword', 'bow', 'arrow', 'shears', 'lighter', 'flint', 'bucket', 'rod', 'remote'];
    const MATS = ['wood', 'stone', 'copper', 'iron', 'silver', 'gold', 'diamond', 'ruby', 'cobalt'];
    const SLOTS = ['helmet', 'cap', 'chestplate', 'tunic', 'leggings', 'trousers', 'boots', 'shield'];
    const rank = (n, L) => { for (let i = 0; i < L.length; i++) if (n.includes(L[i])) return i; return L.length; };
    const lastWord = n => n.split(' ').pop();
    const key = (r, c) => { const n = nm(r.out);
      if (c === 'tools') { const t = n.includes('pickaxe') ? 0 : rank(lastWord(n), TYPES); return [t, rank(n, MATS), n]; }
      if (c === 'armour') return [rank(n, SLOTS), rank(n, MATS), n];
      if (c === 'food') return [/brew|bru|ale|whisky/.test(n) ? 1 : 0, n, 0];
      if (c === 'blocks') return [/wool|carpet|tapestry/.test(n) ? 2 : /block of|ingot/.test(r.name.toLowerCase()) ? 1 : 0, n, 0];
      return [0, n, 0]; };
    const cmp = (a, b) => { for (let i = 0; i < 3; i++) { if (a[i] < b[i]) return -1; if (a[i] > b[i]) return 1; } return 0; };
    catRecipes = function () { const out = []; RECIPES.forEach((r, i) => { if (catOf(r) === craftCat) out.push(i); });
      return out.map(i => [i, key(RECIPES[i], craftCat)]).sort((a, b) => cmp(a[1], b[1]) || a[0] - b[0]).map(p => p[0]); };
  } catch (e) { console.warn('c120 cats', e); }

  /* ---------------- 5) Fry Up + HD food icons ---------------- */
  try { NAMES[IT.COOKEDHAGGIS] = 'Cooked haggis'; NAMES[IT.SUPPER] = 'Fry Up';   // v1.0.1: cooked haggis is back; the Fry Up replaces haggis, neeps & tatties
    for (const r of RECIPES) if (r.out === IT.SUPPER) { r.name = 'Fry Up'; }
  } catch (_) {}
  const ICO = window.__c120ICO = {};
  function hd(fn) { const c = cv(256), g = c.getContext('2d'); g.translate(128, 128); g.scale(4, 4); g.lineJoin = g.lineCap = 'round'; fn(g); return c.toDataURL('image/png'); }
  const lg = (g, x0, y0, x1, y1, st) => { const q = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
  const rg = (g, x, y, r0, r1, st, X, Y) => { const q = g.createRadialGradient(x, y, r0, X === undefined ? x : X, Y === undefined ? y : Y, r1); st.forEach(([o, c]) => q.addColorStop(o, c)); return q; };
  ICO[IT.SUPPER] = hd(g => {   // full Scottish breakfast on a plate
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(1, 6, 30, 22, 0, 0, 7); g.fill();
    g.fillStyle = rg(g, -6, -4, 2, 32, [[0, '#ffffff'], [0.7, '#eef0f2'], [1, '#b9c0c8']]); g.beginPath(); g.ellipse(0, 3, 30, 22, 0, 0, 7); g.fill();
    g.strokeStyle = '#9aa3ad'; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 3, 22, 15.5, 0, 0, 7); g.stroke();
    // beans
    g.fillStyle = '#b8401a'; g.beginPath(); g.ellipse(10, 11, 11, 6.5, 0.2, 0, 7); g.fill();
    for (let i = 0; i < 16; i++) { const a = i * 2.4, r = (i % 4) * 2.2; g.fillStyle = i % 3 ? '#e2672a' : '#f08540'; g.beginPath(); g.ellipse(10 + Math.cos(a) * r * 1.6, 11 + Math.sin(a) * r * 0.9, 2, 1.3, a, 0, 7); g.fill(); }
    // toast
    g.fillStyle = '#9a5a1e'; g.beginPath(); g.moveTo(-27, 2); g.lineTo(-10, -8); g.lineTo(-12, 12); g.closePath(); g.fill(); g.fillStyle = '#d8a150'; g.beginPath(); g.moveTo(-24.5, 2.4); g.lineTo(-11.5, -5.4); g.lineTo(-13, 9.6); g.closePath(); g.fill();
    // sausages
    for (const [x, y, a] of [[-6, -13, -0.35], [-2, -8, -0.3]]) { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#5a2a10'; g.beginPath(); g.ellipse(0, 0, 11, 3.6, 0, 0, 7); g.fill();
      g.fillStyle = lg(g, 0, -3, 0, 3, [[0, '#c77a3a'], [0.5, '#9a4c1c'], [1, '#5a2a10']]); g.beginPath(); g.ellipse(0, -0.3, 10.2, 3, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,220,170,.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-6, -1.6); g.lineTo(5, -1.8); g.stroke(); g.restore(); }
    // bacon
    g.save(); g.translate(14, -8); g.rotate(0.35); g.fillStyle = '#f3c8a8'; g.beginPath(); g.moveTo(-10, -3); for (let x = -10; x <= 10; x += 2) g.lineTo(x, -3 + Math.sin(x * 0.7) * 1.2); for (let x = 10; x >= -10; x -= 2) g.lineTo(x, 4 + Math.sin(x * 0.7) * 1.2); g.fill();
    g.fillStyle = '#c0464a'; g.beginPath(); for (let x = -10; x <= 10; x += 2) g.lineTo(x, -1.5 + Math.sin(x * 0.7) * 1.2); for (let x = 10; x >= -10; x -= 2) g.lineTo(x, 2.2 + Math.sin(x * 0.7) * 1.2); g.fill(); g.restore();
    // haggis slice + black pudding
    g.fillStyle = '#4a2a18'; g.beginPath(); g.arc(-3, 9, 6.5, 0, 7); g.fill(); g.fillStyle = '#7a4a2a'; g.beginPath(); g.arc(-3, 8.6, 5.6, 0, 7); g.fill();
    for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#c09060' : '#3a1a0c'; g.fillRect(-7 + (i * 37 % 9), 5 + (i * 23 % 7), 1, 1); }
    g.fillStyle = '#1a0c0c'; g.beginPath(); g.arc(-15, 13, 4.6, 0, 7); g.fill(); g.fillStyle = '#3a1c1c'; g.beginPath(); g.arc(-15, 12.6, 3.8, 0, 7); g.fill(); g.fillStyle = '#e8e0d0'; for (let i = 0; i < 6; i++) g.fillRect(-17 + (i * 3 % 5), 11 + (i * 2 % 4), 0.9, 0.9);
    // fried egg
    g.fillStyle = '#fffdf6'; g.beginPath(); g.moveTo(8, -1); g.bezierCurveTo(16, -6, 26, -2, 24, 4); g.bezierCurveTo(23, 9, 12, 8, 9, 6); g.bezierCurveTo(4, 4, 4, 1, 8, -1); g.fill();
    g.fillStyle = rg(g, 14, 1.6, 0.5, 4.6, [[0, '#ffe58a'], [0.6, '#ffb21a'], [1, '#e08a00']], 15, 2.5); g.beginPath(); g.arc(15, 2.5, 4.4, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(13.6, 1.2, 1.4, 0.8, -0.5, 0, 7); g.fill();
    // half tomato
    g.fillStyle = '#c21a12'; g.beginPath(); g.arc(-20, -9, 5.5, 0, 7); g.fill(); g.fillStyle = '#ff6a4a'; g.beginPath(); g.arc(-20, -9.4, 4.4, 0, 7); g.fill(); g.fillStyle = '#ffd0a0'; for (let i = 0; i < 5; i++) { const a = i * 1.26; g.beginPath(); g.ellipse(-20 + Math.cos(a) * 2.4, -9.4 + Math.sin(a) * 2.4, 1, .6, a, 0, 7); g.fill(); }
  });
  ICO[IT.IRONBREW] = hd(g => {   // tall orange fizzy glass bottle
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2, 29, 14, 3.5, 0, 0, 7); g.fill();
    const body = () => { g.beginPath(); g.moveTo(-4, -26); g.lineTo(4, -26); g.lineTo(4, -17); g.bezierCurveTo(13, -10, 13, -4, 13, 2); g.lineTo(13, 24); g.quadraticCurveTo(13, 29, 8, 29); g.lineTo(-8, 29); g.quadraticCurveTo(-13, 29, -13, 24); g.lineTo(-13, 2); g.bezierCurveTo(-13, -4, -13, -10, -4, -17); g.closePath(); };
    body(); g.fillStyle = lg(g, -13, 0, 13, 0, [[0, '#a83a00'], [0.25, '#ff8a1a'], [0.5, '#ffb040'], [0.8, '#f06a00'], [1, '#8a2c00']]); g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#4a1800'; g.stroke();
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(255,240,200,.7)'; g.beginPath(); g.arc(-9 + (i * 41 % 18), 26 - (i * 29 % 40), 0.5 + (i % 3) * 0.35, 0, 7); g.fill(); }
    g.fillStyle = '#1a3fa8'; g.fillRect(-13, 2, 26, 15); g.fillStyle = '#ffffff'; g.fillRect(-13, 4, 26, 1.6); g.fillRect(-13, 14, 26, 1.6);
    g.save(); g.beginPath(); g.rect(-13, 5.6, 26, 8.4); g.clip(); g.fillStyle = '#2f62e0'; for (let x = -18; x < 16; x += 6) { g.beginPath(); g.moveTo(x, 14); g.lineTo(x + 3, 5.6); g.lineTo(x + 5, 5.6); g.lineTo(x + 2, 14); g.fill(); } g.restore();
    g.fillStyle = '#ffffff'; g.font = 'bold 6px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('IRON', 0, 8); g.fillText('BREW', 0, 12.2);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(-9, -6); g.quadraticCurveTo(-11, 0, -10.5, 24); g.lineTo(-8, 24); g.quadraticCurveTo(-8.5, 0, -6.5, -7); g.fill();
    g.fillStyle = lg(g, -5, 0, 5, 0, [[0, '#7a7a80'], [0.5, '#f0f0f4'], [1, '#6a6a70']]); g.fillRect(-5, -30, 10, 5); g.strokeStyle = '#333'; g.lineWidth = 0.8; g.strokeRect(-5, -30, 10, 5);
  });
  ICO[IT.BREW] = hd(g => {   // frothy pint of brew in a wooden tankard
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2, 28, 22, 4, 0, 0, 7); g.fill();
    g.lineWidth = 5; g.strokeStyle = '#5a3416'; g.beginPath(); g.moveTo(14, -10); g.bezierCurveTo(30, -10, 30, 16, 14, 16); g.stroke(); g.lineWidth = 2.4; g.strokeStyle = '#9a6430'; g.stroke();
    g.fillStyle = lg(g, -18, 0, 16, 0, [[0, '#5a3416'], [0.3, '#a8703a'], [0.55, '#c88a4a'], [1, '#5a3416']]); g.beginPath(); g.moveTo(-17, -14); g.lineTo(15, -14); g.lineTo(14, 26); g.quadraticCurveTo(-1, 30, -16, 26); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,30,10,.7)'; g.lineWidth = 0.8; for (let x = -12; x < 14; x += 5) { g.beginPath(); g.moveTo(x, -13); g.lineTo(x - 0.3, 26); g.stroke(); }
    for (const y of [-6, 18]) { g.fillStyle = lg(g, -18, 0, 16, 0, [[0, '#4a4a50'], [0.5, '#d0d0d6'], [1, '#3a3a40']]); g.fillRect(-17, y, 32, 3.2); }
    g.fillStyle = '#d08a1a'; g.beginPath(); g.ellipse(-1, -14, 16, 3.5, 0, 0, 7); g.fill();
    g.fillStyle = '#fffaf0'; for (const [x, y, r] of [[-12, -17, 6], [-5, -20, 7], [3, -19, 7], [10, -16, 6], [-8, -13, 5], [6, -13, 5], [15, -11, 3.4], [16, -6, 2.6]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(220,205,170,.7)'; for (const [x, y, r] of [[-9, -15, 2], [0, -16, 2.4], [8, -14, 2]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(-6, -22, 2, 0, 7); g.fill();
  });
  ICO[IT.BREAD] = hd(g => {   // crusty scored loaf with a dusting of flour
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(2, 15, 29, 7, 0, 0, 7); g.fill();
    g.fillStyle = lg(g, 0, -16, 0, 16, [[0, '#e8a85a'], [0.45, '#b8692a'], [1, '#6a3410']]); g.beginPath(); g.moveTo(-28, 8); g.bezierCurveTo(-30, -14, 30, -16, 28, 6); g.quadraticCurveTo(27, 15, 0, 15); g.quadraticCurveTo(-27, 15, -28, 8); g.fill();
    g.strokeStyle = '#4a2208'; g.lineWidth = 1.2; g.stroke();
    for (const x of [-16, -5, 6, 17]) { g.save(); g.translate(x, -3); g.rotate(-0.5); g.fillStyle = '#f6d6a0'; g.beginPath(); g.ellipse(0, 0, 6.5, 2.2, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(140,70,20,.6)'; g.beginPath(); g.ellipse(0, 1, 6.5, 1, 0, 0, 3.2); g.fill(); g.restore(); }
    g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 40; i++) { const x = -22 + (i * 37 % 44), y = -10 + (i * 13 % 12); g.beginPath(); g.arc(x, y, 0.4 + (i % 3) * 0.25, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,240,210,.45)'; g.beginPath(); g.ellipse(-8, -9, 12, 2.5, -0.15, 0, 7); g.fill();
  });
  U.icons = ICO;
  let icoN = 0; const icoIv = setInterval(() => { try { if (typeof ICONS === 'undefined' || !ICONS[IT.BREAD]) return; let ch = 0; for (const id in ICO) if (ICONS[id] !== ICO[id]) { ICONS[id] = ICO[id]; ch++; }
    if (ch) { try { renderHotbar(); } catch (_) {} } } catch (_) {} if (++icoN > 80) clearInterval(icoIv); }, 750);

  /* ---------------- 6) HD metal / gem blocks ---------------- */
  const BS = PH ? 512 : 1024;
  function noise(g, S, R, n, a, cols) { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.globalAlpha = a * (0.4 + R() * 0.6); const s = 1 + R() * 2.2 * S / 512; g.fillRect(R() * S, R() * S, s, s); } g.globalAlpha = 1; }
  function bevel(g, x, y, w, h, t, lt, dk) { g.fillStyle = lt; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w - t, y + t); g.lineTo(x + t, y + t); g.lineTo(x + t, y + h - t); g.lineTo(x, y + h); g.fill();
    g.fillStyle = dk; g.beginPath(); g.moveTo(x + w, y + h); g.lineTo(x, y + h); g.lineTo(x + t, y + h - t); g.lineTo(x + w - t, y + h - t); g.lineTo(x + w - t, y + t); g.lineTo(x + w, y); g.fill(); }
  const PAINT = {
    copper_block(S, g, R) {   // polished, shiny brown copper plate
      g.fillStyle = lg(g, 0, 0, S, S, [[0, '#b8683a'], [0.35, '#8e4a26'], [0.6, '#a65a30'], [1, '#6a3016']]); g.fillRect(0, 0, S, S);
      for (let i = 0; i < 900; i++) { const y = R() * S; g.strokeStyle = R() < .5 ? 'rgba(255,210,170,.06)' : 'rgba(40,14,4,.07)'; g.lineWidth = 0.6 + R() * 1.4 * S / 1024; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y + (R() - .5) * 4); g.stroke(); }
      g.fillStyle = rg(g, S * .3, S * .28, 0, S * .55, [[0, 'rgba(255,230,200,.55)'], [0.4, 'rgba(255,190,140,.2)'], [1, 'rgba(255,190,140,0)']]); g.fillRect(0, 0, S, S);
      g.save(); g.translate(S / 2, S / 2); g.rotate(-0.78); g.fillStyle = lg(g, 0, -S * .12, 0, S * .12, [[0, 'rgba(255,240,220,0)'], [0.5, 'rgba(255,235,210,.32)'], [1, 'rgba(255,240,220,0)']]); g.fillRect(-S, -S * .12, 2 * S, S * .24);
      g.fillStyle = lg(g, 0, S * .22, 0, S * .3, [[0, 'rgba(255,240,220,0)'], [0.5, 'rgba(255,235,210,.18)'], [1, 'rgba(255,240,220,0)']]); g.fillRect(-S, S * .22, 2 * S, S * .08); g.restore();
      bevel(g, 0, 0, S, S, S * .035, 'rgba(255,215,180,.45)', 'rgba(40,12,2,.55)'); g.strokeStyle = 'rgba(30,10,2,.6)'; g.lineWidth = S * .006; g.strokeRect(S * .04, S * .04, S * .92, S * .92); },
    gold_block(S, g, R) {   // four bevelled ingot tiles, each with an engraved knot diamond
      g.fillStyle = '#7a4a06'; g.fillRect(0, 0, S, S); const h = S / 2, gap = S * .012;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const x = i * h + gap, y = j * h + gap, w = h - 2 * gap;
        g.fillStyle = lg(g, x, y, x + w, y + w, [[0, '#fff2a0'], [0.3, '#ffd22a'], [0.65, '#f0a812'], [1, '#a8640a']]); g.fillRect(x, y, w, w);
        bevel(g, x, y, w, w, w * .08, 'rgba(255,250,210,.7)', 'rgba(110,60,0,.6)');
        const cx = x + w / 2, cy = y + w / 2, r = w * .3; g.lineWidth = w * .035;
        g.strokeStyle = 'rgba(140,80,0,.85)'; g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.closePath(); g.stroke();
        g.beginPath(); g.arc(cx, cy, r * .55, 0, 7); g.stroke();
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { g.beginPath(); g.arc(cx + dx * r * .55, cy + dy * r * .55, r * .22, 0, 7); g.stroke(); }
        g.strokeStyle = 'rgba(255,250,200,.6)'; g.lineWidth = w * .012; g.beginPath(); g.moveTo(cx - r + w * .02, cy - w * .02); g.lineTo(cx - w * .02, cy - r + w * .02); g.stroke();
        g.fillStyle = 'rgba(255,255,240,.9)'; const sx = x + w * .22, sy = y + w * .2, s = w * .09; g.beginPath(); g.moveTo(sx, sy - s); g.lineTo(sx + s * .2, sy - s * .2); g.lineTo(sx + s, sy); g.lineTo(sx + s * .2, sy + s * .2); g.lineTo(sx, sy + s); g.lineTo(sx - s * .2, sy + s * .2); g.lineTo(sx - s, sy); g.lineTo(sx - s * .2, sy - s * .2); g.closePath(); g.fill(); } },
    iron_block(S, g, R) {   // brushed steel plates with rivets
      g.fillStyle = '#9aa0a8'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 1200; i++) { const x = R() * S; g.strokeStyle = R() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(30,34,40,.08)'; g.lineWidth = 0.6 + R() * S / 1024; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (R() - .5) * 3, S); g.stroke(); }
      const h = S / 2; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const x = i * h, y = j * h;
        g.fillStyle = lg(g, x, y, x + h, y + h, [[0, 'rgba(255,255,255,.18)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.18)']]); g.fillRect(x, y, h, h);
        bevel(g, x, y, h, h, S * .018, 'rgba(240,244,250,.55)', 'rgba(30,34,42,.6)');
        for (const [u, v] of [[.12, .12], [.88, .12], [.12, .88], [.88, .88]]) { const rx = x + u * h, ry = y + v * h, r = S * .022;
          g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(rx + r * .25, ry + r * .3, r * 1.1, 0, 7); g.fill();
          g.fillStyle = rg(g, rx - r * .35, ry - r * .35, r * .1, r, [[0, '#ffffff'], [0.4, '#c8ccd4'], [1, '#585e68']], rx, ry); g.beginPath(); g.arc(rx, ry, r, 0, 7); g.fill(); } }
      g.fillStyle = 'rgba(40,44,52,.8)'; g.fillRect(h - S * .006, 0, S * .012, S); g.fillRect(0, h - S * .006, S, S * .012); },
    cobalt_block(S, g, R) {   // deep blue hexagon tiles with cyan bevels
      g.fillStyle = '#060c34'; g.fillRect(0, 0, S, S); const r = S / 6, hw = r * Math.sqrt(3) / 2;
      for (let row = -1; row < 5; row++) for (let col = -1; col < 5; col++) { const cx = col * hw * 2 + (row & 1 ? hw : 0), cy = row * r * 1.5 + r * .5; if (cx < -r || cy < -r || cx > S + r || cy > S + r) continue;
        const hex = (rr) => { g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); };
        for (const ox of [0]) { hex(r * .93); g.fillStyle = lg(g, cx - r, cy - r, cx + r, cy + r, [[0, '#6f9cff'], [0.3, '#2c52da'], [0.7, '#1530a0'], [1, '#081860']]); g.fill();
          hex(r * .7); g.fillStyle = lg(g, cx - r, cy - r, cx + r, cy + r, [[0, '#3a66f0'], [1, '#0d2280']]); g.fill();
          hex(r * .7); g.strokeStyle = 'rgba(150,230,255,.55)'; g.lineWidth = S * .005; g.stroke();
          g.fillStyle = 'rgba(190,245,255,.8)'; g.beginPath(); g.ellipse(cx - r * .25, cy - r * .3, r * .16, r * .06, -0.6, 0, 7); g.fill(); } } },
    lazurite_block(S, g, R) {   // lapis tiles: veined blue with gold pyrite flecks and dark grout
      g.fillStyle = '#0c1640'; g.fillRect(0, 0, S, S); const n = 4, t = S / n, gp = S * .012;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = i * t + gp, y = j * t + gp, w = t - 2 * gp, sh = R();
        g.fillStyle = lg(g, x, y, x + w, y + w, [[0, sh < .5 ? '#3a62d8' : '#2c4cc0'], [0.6, '#1c3496'], [1, '#12236a']]); g.fillRect(x, y, w, w);
        g.save(); g.beginPath(); g.rect(x, y, w, w); g.clip();
        for (let k = 0; k < 3; k++) { g.strokeStyle = 'rgba(200,215,255,' + (0.12 + R() * .2).toFixed(2) + ')'; g.lineWidth = S * (.002 + R() * .004); g.beginPath(); let px = x + R() * w, py = y; g.moveTo(px, py); for (let s = 0; s < 6; s++) { px += (R() - .5) * w * .4; py += w / 6; g.lineTo(px, py); } g.stroke(); }
        for (let k = 0; k < 9; k++) { const fx = x + R() * w, fy = y + R() * w, fr = S * (.003 + R() * .007); g.fillStyle = R() < .6 ? '#ffd860' : '#fff2b0'; g.beginPath(); g.arc(fx, fy, fr, 0, 7); g.fill(); }
        g.restore(); bevel(g, x, y, w, w, w * .05, 'rgba(170,195,255,.4)', 'rgba(4,8,30,.55)'); } },
    diamond_block(S, g, R) {   // faceted gem tiles
      g.fillStyle = '#0e4a5a'; g.fillRect(0, 0, S, S); const n = 3, t = S / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = i * t, y = j * t, cx = x + t / 2, cy = y + t / 2, r = t * .46, m = t * .2;
        g.fillStyle = lg(g, x, y, x + t, y + t, [[0, '#bff6ff'], [1, '#3ab8d4']]); g.fillRect(x + 2, y + 2, t - 4, t - 4);
        const P = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]], I = [[cx, cy - m], [cx + m, cy], [cx, cy + m], [cx - m, cy]], C = ['#f2ffff', '#7fe2f4', '#2aa2c4', '#a8f2ff'];
        for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(P[k][0], P[k][1]); g.lineTo(P[(k + 1) % 4][0], P[(k + 1) % 4][1]); g.lineTo(I[(k + 1) % 4][0], I[(k + 1) % 4][1]); g.lineTo(I[k][0], I[k][1]); g.closePath(); g.fillStyle = C[k]; g.fill(); }
        g.beginPath(); I.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = '#e8ffff'; g.fill();
        g.strokeStyle = 'rgba(10,60,80,.7)'; g.lineWidth = S * .004; g.beginPath(); P.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.stroke();
        for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(P[k][0], P[k][1]); g.lineTo(I[k][0], I[k][1]); g.stroke(); }
        g.fillStyle = '#fff'; const sx = cx - r * .35, sy = cy - r * .3, s = t * .07; g.beginPath(); g.moveTo(sx, sy - s); g.lineTo(sx + s * .2, sy - s * .2); g.lineTo(sx + s, sy); g.lineTo(sx + s * .2, sy + s * .2); g.lineTo(sx, sy + s); g.lineTo(sx - s * .2, sy + s * .2); g.lineTo(sx - s, sy); g.lineTo(sx - s * .2, sy - s * .2); g.closePath(); g.fill(); }
      g.strokeStyle = 'rgba(8,40,52,.8)'; g.lineWidth = S * .008; for (let k = 0; k <= n; k++) { g.beginPath(); g.moveTo(k * t, 0); g.lineTo(k * t, S); g.stroke(); g.beginPath(); g.moveTo(0, k * t); g.lineTo(S, k * t); g.stroke(); } },
  };
  function paintBlock(key) { const c = cv(BS), g = c.getContext('2d'); PAINT[key](BS, g, rng(key.length * 7919 + key.charCodeAt(0))); return c; }
  function css(key, c) { try { const s = cv(64); s.getContext('2d').drawImage(c, 0, 0, 64, 64);
    let el = document.getElementById('c120tex'); if (!el) { el = document.createElement('style'); el.id = 'c120tex'; document.head.appendChild(el); }
    el.textContent = el.textContent.split('\n').filter(l => l && !l.startsWith('.ic-' + key + '{')).concat('.ic-' + key + '{background-image:url(' + s.toDataURL() + ') !important}').join('\n'); } catch (_) {} }
  // new block: Block of diamond (id 255)
  try { const DB = 255; T.DIAMONDBLOCK = DB; const key = 'diamond_block', c = U.made[key] = paintBlock(key);
    const t = new THREE.Texture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = typeof TEXANISO !== 'undefined' ? TEXANISO : 4; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
    texCache[key] = t; texImg[key] = c; try { const s = cv(1); s.getContext('2d').drawImage(c, 0, 0, 1, 1); const d = s.getContext('2d').getImageData(0, 0, 1, 1).data; AVG[key] = (d[0] << 16) | (d[1] << 8) | d[2]; } catch (_) {}
    FACES[DB] = key; BLOCK_MATS[DB] = mat(key); NAMES[DB] = 'Block of diamond'; ICON_KEY[DB] = key; HARD[DB] = 5.5; MC_HARD[DB] = 5; REQ[DB] = 3; NEEDS_PICK.add(DB); PLACEABLE.add(DB);
    if (!ORDER.includes(DB)) ORDER.push(DB); try { if (typeof CREATIVE_ALL !== 'undefined' && !CREATIVE_ALL.includes(DB)) CREATIVE_ALL.push(DB); } catch (_) {}
    try { if (typeof BUILT_T !== 'undefined') BUILT_T[DB] = 1; } catch (_) {}
    const df = dropsFor; dropsFor = function (b) { if (b === DB) return [[DB, 1]]; return df.apply(this, arguments); };
    RECIPES.push(rc('Block of diamond', '9 Diamonds', DB, 1, [[IT.DIAMOND, 9]], 1)); RECIPES.push(rc('Diamonds (x9)', '1 Block of diamond', IT.DIAMOND, 9, [[DB, 1]]));
    css(key, c);
  } catch (e) { console.warn('c120 diamond block', e); }
  const BKEYS = ['copper_block', 'gold_block', 'iron_block', 'cobalt_block', 'lazurite_block'];
  function bpass() { for (const key of BKEYS) { if (!U.made[key]) { try { U.made[key] = paintBlock(key); css(key, U.made[key]); } catch (e) { console.warn('c120', key, e); continue; } }
      const c = U.made[key], ts = new Set([texCache[key] || tex(key)]);
      try { if (matCache[key] && matCache[key].map) ts.add(matCache[key].map); for (const id in FACES) { const f = FACES[id]; if ((f === key || (Array.isArray(f) && f.includes(key))) && BLOCK_MATS[id]) [].concat(BLOCK_MATS[id]).forEach(m => { if (m && m.map && (m.map === texCache[key] || f === key)) ts.add(m.map); }); } } catch (_) {}
      if (texImg[key] !== c) { texImg[key] = c; css(key, c); }
      for (const t of ts) if (t && t.image !== c) { t.image = c; t.needsUpdate = true; } }
    // copper block: properly shiny
    try { if (!PERF) [].concat(BLOCK_MATS[T.COPPERBLOCK]).forEach(m => { if (m && m.emissive && !m.c120) { m.c120 = 1; m.emissive.setHex(0x1a0802); m.needsUpdate = true; } }); } catch (_) {}
  }
  U.bpass = bpass; let bt = 0; const biv = setInterval(() => { try { bpass(); } catch (e) { console.warn('c120 b', e); } if (++bt > 150) clearInterval(biv); }, 500);

  /* ---------------- 7) spider fangs + scarier face ---------------- */
  function fangSpider(a) { a.c120f = true; const h = a.head; if (!h) return;
    const ivory = new THREE.MeshLambertMaterial({color: 0xe8e0c8}), black = new THREE.MeshLambertMaterial({color: 0x120808}), red = new THREE.MeshBasicMaterial({color: 0xff1a0a}), gum = new THREE.MeshLambertMaterial({color: 0x4a0a0a});
    a.fangs = [];
    for (const s of [-1, 1]) { const pv = new THREE.Group(); pv.position.set(s * 0.09, -0.12, 0.36); h.add(pv);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.1), black); base.position.y = -0.05; pv.add(base);
      const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.2, 6), ivory); f1.position.set(0, -0.2, 0.03); f1.rotation.x = Math.PI + 0.35; f1.rotation.z = -s * 0.25; pv.add(f1);
      const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.1, 5), ivory); f2.position.set(-s * 0.02, -0.31, 0.07); f2.rotation.x = Math.PI + 0.9; f2.rotation.z = s * 0.35; pv.add(f2);
      a.fangs.push(pv); }
    const maw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.03), gum); maw.position.set(0, -0.12, 0.4); h.add(maw);
    for (let i = 0; i < 6; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03 + (i % 2) * 0.01, 6, 4), red); const s = i < 3 ? -1 : 1, k = i % 3;
      e.position.set(s * (0.05 + k * 0.07), 0.16 + (k === 1 ? 0.05 : 0), 0.38 - k * 0.03); h.add(e); }
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.06), black); brow.position.set(0, 0.2, 0.39); brow.rotation.x = -0.3; h.add(brow);
    if (a.mats) a.mats.push(ivory, black, red, gum); }

  /* ---------------- 8) treeman: big glowing eyes in deep sockets, wild twig hair + moss ---------------- */
  try { const mt = makeTreeman; makeTreeman = function () { const r = mt.apply(this, arguments);
    try { const h = r.head, bark = r.mats[0], leaf = r.mats[1], hollow = r.mats[3];
      for (const c of h.children.slice()) { if (Math.abs(c.position.y - 0.72) < 0.01 && c.material === leaf) { c.scale.set(0.92, 0.7, 0.62); c.position.set(0, 0.74, -0.15); }
        else if (Math.abs(c.position.y - 1.02) < 0.01 && c.material === leaf) { c.scale.set(0.8, 0.8, 0.6); c.position.set(0, 0.95, -0.2); }
        else if (c.material === r.eyeM) { c.position.z = 0.3; c.position.y = 0.4; c.scale.set(1.45, 1.9, 1); } }
      for (const ex of [-0.15, 0.15]) { const so = new THREE.Mesh(roundBox(0.22, 0.17, 0.03), hollow); so.position.set(ex, 0.4, 0.288); h.add(so);
        const br = new THREE.Mesh(roundBox(0.26, 0.07, 0.08), bark); br.position.set(ex * 1.05, 0.5, 0.29); br.rotation.z = ex > 0 ? 0.35 : -0.35; h.add(br);
        try { const gl = glowSprite(0xffa030, 0.45); gl.position.set(ex, 0.4, 0.33); h.add(gl); } catch (_) {} }
      const twig = new THREE.MeshLambertMaterial({color: 0x2a1a0e}), moss = new THREE.MeshLambertMaterial({color: 0x3a4a1c}); r.mats.push(twig, moss); const R = rng(77);
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, L = 0.35 + R() * 0.45, g = new THREE.Group(); g.position.set(Math.sin(a) * 0.3, 0.62 + R() * 0.15, Math.cos(a) * 0.24 - 0.05);
        g.rotation.set(Math.cos(a) * (0.6 + R() * 0.5), 0, -Math.sin(a) * (0.6 + R() * 0.5)); h.add(g);
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.03, L, 4), twig); m.position.y = L / 2; g.add(m);
        const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.015, L * 0.45, 3), twig); s2.position.set(0, L * 0.65, 0); s2.rotation.z = (R() < .5 ? 1 : -1) * 0.8; s2.position.x = Math.sin(s2.rotation.z) * -L * 0.1; g.add(s2); }
      for (let i = 0; i < 9; i++) { const a = Math.PI * 0.35 + (i / 8) * Math.PI * 1.3, L = 0.3 + R() * 0.5; const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, L, 0.02), moss);
        m.position.set(Math.sin(a) * 0.33, 0.55 - L / 2, Math.cos(a) * 0.29); m.rotation.y = a; m.rotation.z = (R() - .5) * 0.3; h.add(m); }
    } catch (e) { console.warn('c120 treeman', e); }
    return r; }; } catch (_) {}

  /* ---------------- 9) third-person swimming: face-down, butterfly arms + dolphin kick ---------------- */
  let sk = 0, sph = 0, sLast = performance.now(), smv = 0;
  try { const uw = updateWorldModel; updateWorldModel = function () { const r = uw.apply(this, arguments);
    try { if (!worldModel || !camMode) return r; const u = worldModel.userData, now = performance.now(), dt = Math.min(0.1, (now - sLast) / 1000); sLast = now;
      const deep = !!window.swimDeep && !dead; sk += ((deep ? 1 : 0) - sk) * Math.min(1, dt * 3); if (sk < 0.01) return r;
      const moving = deep && (keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD || (typeof touchMove !== 'undefined' && touchMove && (Math.abs(touchMove.x || 0) + Math.abs(touchMove.y || 0)) > 0.1));
      smv += ((moving ? 1 : 0) - smv) * Math.min(1, dt * 2.5); const m = smv * sk;
      sph += dt * (window.swimLava ? 2.0 : (window.__swimFast ? 5.2 : 3.8)) * (0.4 + 0.6 * smv);
      const pk = window.__swimPlank || 0, lay = Math.max(m, pk * sk), pit = Math.max(-0.9, Math.min(0.9, P.pitch || 0));
      const tx = (Math.PI / 2 - pit * 0.9) + Math.sin(sph * 2) * 0.07 * m;   // positive = face-down (front of the model is +z)
      worldModel.rotation.order = 'YXZ'; worldModel.rotation.x = tx * lay; worldModel.rotation.z = 0;
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), back = 0.85 * lay;
      worldModel.position.set(P.x - fx * back, P.y + 0.55 * lay - 0.1 * sk * (1 - lay) + Math.sin(sph * 2) * 0.04 * m, P.z - fz * back);
      const c = sph % (Math.PI * 2), wide = Math.max(0, Math.sin(c)) * 0.55;   // both arms together: over the back, ahead, then pull under
      if (lay > 0.05) { for (const [i, s] of [[0, 1], [1, -1]]) { const A = u.arms[i]; if (!A) continue; A.rotation.order = 'XYZ'; A.rotation.x = A.rotation.x * (1 - lay) + c * lay; A.rotation.y = 0; A.rotation.z = A.rotation.z * (1 - lay) + s * (0.12 + wide) * lay; } }
      const kick = Math.sin(sph * 2 + 0.6) * 0.38 * m; if (u.legs) { u.legs[0].rotation.x = kick; u.legs[1].rotation.x = kick; }
      if (u.head) u.head.rotation.x = -0.75 * lay + Math.sin(sph * 2) * 0.12 * m;
    } catch (_) {}
    return r; }; } catch (_) {}

  /* ---------------- per-frame hooks ---------------- */
  setInterval(() => { try { for (const a of mobs) if (a.kind === 'nspider' && a.c116s && !a.c120f) fangSpider(a); } catch (_) {} }, 400);
})();
