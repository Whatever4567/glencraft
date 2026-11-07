/* GLX-VOX1222 (v1.2.22): one alien voice. Every spoken alien line now plays a recording made with the same local voice and the same
   effect chain as the opening lines (tools/media-source-agartha-voice.py config: en_GB alba medium, length 1.08, pitch lift, chorus, echo).
   Before, only the 9 opening lines had recordings; the YEAR 24000 lines and Brace for impact fell back to the browser voice, which sounds
   different on every device. If a recording cannot load, the browser voice is used for that line with one fixed choice and setting. */
(function vox1222() {
  const U = window.__vox1222 = {err: null, hits: 0, miss: 0, fb: 0};
  const EXTRA = {'This is your world, in the year twenty four thousand.': 'y1', 'The machines walk where your cities stood. They do not remember you.': 'y2',
    'The sky burns. The seas are gone. Only the old stones remain.': 'y3', 'This does not have to happen. Choose differently. Take care of the Earth.': 'y4', 'Brace for impact.': 'brace'};
  U.EXTRA = EXTRA;
  U.clip = (line, LINES) => { const i = LINES ? LINES.indexOf(line) : -1; if (i >= 0) { U.hits++; return 'assets/voice/agartha' + (i + 1) + '.mp3'; } const k = EXTRA[line]; if (k) { U.hits++; return 'assets/voice/agartha_' + k + '.mp3'; } U.miss++; return null; };
  let fv;
  U.voice = () => { if (fv !== undefined && fv) return fv; try { const vs = speechSynthesis.getVoices(); fv = vs.find(v => /en/i.test(v.lang) && /natural|online|neural|premium|enhanced/i.test(v.name)) || vs.find(v => /en/i.test(v.lang) && /female|zira|samantha|google uk english female|karen|moira/i.test(v.name)) || vs.find(v => /en/i.test(v.lang)) || null; } catch (_) { fv = null; } return fv; };
  U.fallback = u => { U.fb++; try { const v = U.voice(); if (v) u.voice = v; } catch (_) {} u.pitch = 1.0; u.rate = 0.94; u.volume = 1; return u; };
  U.brace = () => { try { const a = new Audio(U.clip('Brace for impact.')); a.volume = Math.min(1, (typeof SET !== 'undefined' ? SET.sfx : 0.8) + 0.2); const tts = () => { try { if (window.speechSynthesis) { speechSynthesis.cancel(); speechSynthesis.speak(U.fallback(new SpeechSynthesisUtterance('Brace for impact.'))); } } catch (_) {} };
      a.onerror = tts; const p = a.play(); if (p && p.catch) p.catch(tts); return a; } catch (e) { if (!U.err) U.err = String(e); return null; } };
})();
