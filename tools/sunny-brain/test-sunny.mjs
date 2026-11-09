import assert from 'node:assert/strict';
import { createClanBrain, sanitizeSpoken } from './brain.mjs';
import { detectProviders, complete, warmupLocal } from './providers.mjs';

const b = createClanBrain({ name: 'Angus', role: 'miner' });
b.remember('traveller waved', 0.3);
const st = b.cycle('idle near');
assert.equal(st.identity.name, 'Angus');
assert.ok(st.internalState.curiosity > 0);
assert.equal(sanitizeSpoken('```rm -rf /```'), '');
assert.equal(sanitizeSpoken('"Aye there, traveller!" Extra sentence here.'), 'Aye there, traveller!');
assert.ok(!sanitizeSpoken('Aye there, traveller!" Extra sentence here.').includes('Extra'));

const det = await detectProviders();
assert.equal(det.transformersLocal, true);
assert.ok(det.preferred === 'transformers-local' || det.preferred === 'ollama');

const w = await warmupLocal();
assert.equal(w.ok, true, 'local model must load');

const out = await complete({
  provider: 'transformers-local',
  system: b.systemPrompt({ stimulus: 'greet' }),
  user: 'A traveller stands close. Greet them briefly.',
  maxTokens: 40,
  temperature: 0.7
});
assert.equal(out.provider, 'transformers-local');
assert.match(out.model, /LaMini|Flan|T5|Qwen|Phi/i);
assert.ok(out.content && out.content.length >= 2, 'real model text required');
assert.equal(out.provider, 'transformers-local');
assert.ok(out.model && /LaMini|Flan|T5/i.test(out.model), 'must be real local model id');
assert.ok(!/NO_PROVIDER|fake llm|procedural only/i.test(out.content));
// Accept either clean speech or explicit qualityFallback from the real model path
assert.ok(out.qualityFallback === true || (/^[A-Za-z ,'.!?-]+$/.test(out.content) && out.content.includes(' ')));

// Paid anthropic must stay blocked without opt-in
const prevKey = process.env.ANTHROPIC_API_KEY; process.env.ANTHROPIC_API_KEY = 'test-key-not-for-use';
delete process.env.SUNNY_ALLOW_PAID;
let blocked = false;
try { await complete({ provider: 'anthropic', system: 'x', user: 'y' }); } catch (e) { blocked = /PAID_BLOCKED|NO_KEY|anthropic/i.test(String(e)); }
if (prevKey == null) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = prevKey;
assert.ok(blocked, 'paid path must not spend by default');

console.log(JSON.stringify({
  pass: true,
  provider: out.provider,
  model: out.model,
  sample: out.content,
  detect: { preferred: det.preferred, ollama: det.ollama, anthropicEnvPresent: !!process.env.ANTHROPIC_API_KEY },
  brainMood: st.internalState.mood
}, null, 2));
