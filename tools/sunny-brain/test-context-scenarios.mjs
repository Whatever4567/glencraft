import assert from 'node:assert/strict';
import { createClanBrain } from './brain.mjs';
import { detectProviders, complete, warmupLocal, looksSpoken } from './providers.mjs';

const scenarios = [
  { id: 'greet', user: 'A traveller stands close by the castle gate. Greet them briefly.', stimulus: 'greet' },
  { id: 'trade', user: 'The traveller wants to trade rubies for bread. Answer as a clansman trader.', stimulus: 'trade' },
  { id: 'danger', user: 'Skeletons are attacking the glen. Warn the traveller in one short line.', stimulus: 'alarm' },
  { id: 'night', user: 'It is night and raining. Comment briefly as a sleepy clansman.', stimulus: 'idle' },
  { id: 'follow', user: 'The traveller jumps and asks you to follow. Agree briefly.', stimulus: 'agree' }
];

const det = await detectProviders();
const warm = await warmupLocal();
assert.equal(warm.ok, true, 'warmup must succeed: ' + JSON.stringify(warm));

const results = [];
for (const s of scenarios) {
  const b = createClanBrain({ name: 'Hamish', role: 'guard' });
  const system = b.systemPrompt({ stimulus: s.stimulus, world: 'Glencraft overworld castle folk' });
  const t0 = Date.now();
  const out = await complete({ provider: det.preferred, system, user: s.user, maxTokens: 40, temperature: 0.7 });
  const ms = Date.now() - t0;
  results.push({
    id: s.id,
    provider: out.provider,
    model: out.model,
    raw: out.raw,
    spoken: out.content,
    looksSpoken: looksSpoken(out.content),
    qualityFallback: !!out.qualityFallback,
    ms: out.ms || ms
  });
}

const okCount = results.filter(r => r.spoken && r.spoken.length > 2).length;
assert.ok(okCount === scenarios.length, 'every scenario needs a spoken string');
const distinct = new Set(results.map(r => r.spoken.toLowerCase()));
// Prefer context-following variety; allow some repeats but flag them
console.log(JSON.stringify({
  pass: true,
  preferred: det.preferred,
  warmup: warm,
  distinctCount: distinct.size,
  repeatedAye: results.filter(r => /aye,? welcome to the glen/i.test(r.spoken)).length,
  results
}, null, 2));
