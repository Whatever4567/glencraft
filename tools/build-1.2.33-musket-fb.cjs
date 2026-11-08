#!/usr/bin/env node
'use strict';
// Local (no version change): first person gun fallback while the real GLB is pending or stalled. C350 step showed nothing until the model
// arrived with no time limit, and its renderer.render wrapper hid the built in gun every frame even when the v1.2.26 download-failure
// fallback asked to show it. Now: after 0.5 s pending on the same held gun (or on a flagged failure) the built in gun is shown and marked
// userData.__fb so the wrapper leaves it; when the real model arrives C322 swaps it in place as before. Usage: in.html out.html
const fs=require('node:fs');const [,,inp,out]=process.argv;if(!inp||!out)throw Error('usage: in.html out.html');let s=fs.readFileSync(inp,'utf8');
function rep(x,y){const i=s.indexOf(x);if(i<0||s.indexOf(x,i+1)>=0)throw Error('need exactly one: '+x.slice(0,90));s=s.slice(0,i)+y+s.slice(i+x.length);}
rep("const fl = window.__c322 && __c322.fail && __c322.fail[u.gun === IT.PISTOL ? 'pistol' : 'rifle']; if (fl) { g.visible = true;",
    "const fl = window.__c322 && __c322.fail && __c322.fail[u.gun === IT.PISTOL ? 'pistol' : 'rifle']; u.__pw = (u.__pw || 0) + d; if (fl || u.__pw > 0.5) { u.__fb = 1; g.visible = true; U.pend = 1;");   /* v1.2.33: pending over 0.5 s counts like a failure: show the built in gun */
rep("if (g0 && !g0.userData.c322) g0.visible = false; } catch (_) {}",
    "if (g0 && !g0.userData.c322 && !g0.userData.__fb) g0.visible = false; } catch (_) {}");   /* v1.2.33: the fallback gun is drawn */
fs.writeFileSync(out,s);
