#!/usr/bin/env node
// pickContact1273: the 1.2.53 ship crescent must sit on the haft tip (|gap| <= 0.02).
import fs from 'fs';
const p = process.env.QA_RESULTS || '/workspace/qa/held-1272/ship/webgl-results.json';
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
const r = (j.results && (j.results['fp-p761'] || j.results['fp-p761-sky'])) || null;
if (!r || !r.fpvm1259) { console.error('no fp-p761 result in', p); process.exit(1); }
const c = r.fpvm1259.pickContact;
if (!c || !c.pickContact1273) { console.error('missing pickContact1273', c); process.exit(1); }
const gap = Math.abs(Number(c.gap));
const ok = !!c.ok && gap <= 0.02;
console.log(JSON.stringify({ pickContact1273: 1, ok, gap: c.gap, haftY: c.haftY, bladeY: c.bladeY }));
if (!ok) process.exit(1);
