#!/usr/bin/env node
'use strict';
// v1.2.13: pre-rendered visitor voice + generated Agartha clip on top of v1.2.12. Usage: node tools/build-1.2.13.cjs out.html
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),crypto=require('node:crypto'),vm=require('node:vm');
const out=process.argv[2];if(!out)throw Error('output path required');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b1213-')),f=path.join(dir,'b.html');let s;
try{cp.execFileSync(process.execPath,[path.join(__dirname,'build-1.2.12.cjs'),f]);s=fs.readFileSync(f,'utf8');}finally{fs.rmSync(dir,{recursive:true,force:true});}
function one(a,b){const i=s.indexOf(a);if(i<0||s.indexOf(a,i+1)>=0)throw Error('need exactly one: '+a.slice(0,80));s=s.slice(0,i)+b+s.slice(i+a.length);}
// generated Agartha artwork replaces the solar flare clip in the encounter montage
one("'assets/video/v6_flare.mp4'","'assets/video/v6_agartha.mp4'");
// visitor speaks with pre-rendered voice files (assets/voice/agarthaN.mp3) for its own lines; browser speech stays as fallback
one("    if (ttsOn) { try { const u = new SpeechSynthesisUtterance(line)","    { const vi = LINES.indexOf(line); if (vi >= 0) { try { const a = new Audio('assets/voice/agartha' + (vi + 1) + '.mp3'); a.volume = Math.min(1, (typeof SET !== 'undefined' ? SET.sfx : 0.8) + 0.2); window.__v1213a = a; let done = false; const next = d => { if (done) return; done = true; setTimeout(say, d); };\n      a.onended = () => next(700); a.onerror = () => { done = true; if (ttsOn) { try { const u = new SpeechSynthesisUtterance(line); u.onend = () => setTimeout(say, 700); speechSynthesis.speak(u); return; } catch (_) {} } setTimeout(say, 4000); };\n      const pr = a.play(); if (pr && pr.catch) pr.catch(() => a.onerror()); U.tts++; return; } catch (_) {} } }\n    if (ttsOn) { try { const u = new SpeechSynthesisUtterance(line)");
one("try { speechSynthesis.cancel(); } catch (_) {} stopBed();","try { speechSynthesis.cancel(); } catch (_) {} try { if (window.__v1213a) { window.__v1213a.onended = window.__v1213a.onerror = null; window.__v1213a.pause(); window.__v1213a = null; } } catch (_) {} stopBed();");
one('<!-- glencraft-build: b1212-v1.2.12 -->','<!-- glencraft-build: b1213-v1.2.13 -->');
one("const GAME_VERSION = '1.2.12';","const GAME_VERSION = '1.2.13';");
one('window.PATCH_NOTES = [','window.PATCH_NOTES = [\n'+JSON.stringify({v:'v1.2.13',d:'2026-11-07',notes:['The visitor now speaks with a smoother, calmer computer-made voice instead of the browser voice.','The montage during the encounter shows new Agartha artwork (an inner sun, crystal spires and blue-robed keepers) in place of the solar flare clip.']})+',');
fs.writeFileSync(out,s);console.log(crypto.createHash('sha256').update(s).digest('hex'));
