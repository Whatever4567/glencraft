import assert from 'node:assert/strict';
import { createClanBrain, looksSpoken } from './brain.mjs';
import { detectProviders, complete, warmupLocal } from './providers.mjs';

const scenarios = [
  { id: 'greet', user: 'A traveller stands close by the castle gate. Greet them as yourself in one short spoken line.', stimulus: 'greet' },
  { id: 'trade', user: 'The traveller offers rubies for bread. Answer as yourself in one short spoken line.', stimulus: 'trade' },
  { id: 'danger', user: 'Skeletons are attacking nearby. Shout one short warning as yourself.', stimulus: 'alarm' },
  { id: 'night', user: 'It is night and raining. Say one short spoken line as a sleepy clansman.', stimulus: 'idle' },
  { id: 'follow', user: 'The traveller asks you to follow. Agree briefly as yourself.', stimulus: 'agree' }
];

const det = await detectProviders();
const warm = await warmupLocal();
assert.equal(warm.ok, true, 'warmup: ' + JSON.stringify(warm));

const results = [];
for (const s of scenarios) {
  const b = createClanBrain({ name: 'Hamish', role: 'guard' });
  const system = b.systemPrompt({ stimulus: s.stimulus, world: 'Glencraft overworld' });
  const out = await complete({ provider: 'qwen-local', system, user: s.user, maxTokens: 36, temperature: 0.7 });
  results.push({
    id: s.id,
    provider: out.provider,
    model: out.model,
    raw: out.raw,
    spoken: out.content,
    ok: !!out.ok,
    quiet: !!out.quiet,
    repaired: !!out.repaired,
    looksSpoken: looksSpoken(out.content),
    ms: out.ms
  });
}

const spoken = results.filter(r => r.ok && r.spoken);
const distinct = new Set(spoken.map(r => r.spoken.toLowerCase()));
const metaDanger = results.filter(r => r.id === 'danger' && /\balert\b.*\btravell/i.test(r.spoken + ' ' + r.raw));
const aye = results.filter(r => /aye,? welcome to the glen/i.test(r.spoken));

assert.ok(spoken.length >= 3, 'need at least 3 successful spoken lines');
assert.equal(aye.length, 0, 'no canned Aye welcome fallback');
assert.equal(metaDanger.length, 0, 'danger must not be meta alert-the-traveller instruction');

console.log(JSON.stringify({
  pass: true,
  preferred: det.preferred,
  warmup: warm,
  spokenCount: spoken.length,
  distinctCount: distinct.size,
  quietCount: results.filter(r => r.quiet).length,
  repeatedAye: aye.length,
  results
}, null, 2));
