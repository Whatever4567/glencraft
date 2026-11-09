import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

import net from 'node:net';
const PORT = await new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const child = spawn(process.execPath, ['server.mjs'], {
  cwd: new URL('.', import.meta.url).pathname,
  env: { ...process.env, SUNNY_PORT: String(PORT), SUNNY_HOST: '127.0.0.1' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let boot = '';
child.stdout.on('data', d => boot += d);
child.stderr.on('data', d => boot += d);

async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/health`);
      if (r.ok) return await r.json();
    } catch (_) {}
    await sleep(500);
  }
  throw new Error('server not ready: ' + boot.slice(-500));
}

try {
  const health = await waitReady();
  assert.equal(health.ok, true);
  assert.equal(health.providers.transformersLocal, true);
  // warmup
  const w = await fetch(`http://127.0.0.1:${PORT}/warmup`, { method: 'POST' }).then(r => r.json());
  assert.equal(w.ok, true, 'warmup');
  const chat = await fetch(`http://127.0.0.1:${PORT}/chat`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ agentId: 'hamish1', name: 'Hamish', role: 'guard', user: 'A traveller stands close. Greet them briefly.', stimulus: 'greet' })
  }).then(r => r.json());
  assert.equal(chat.ok, true);
  assert.equal(chat.provider, 'transformers-local');
  assert.ok(chat.text && chat.text.length > 1);
  assert.deepEqual(chat.actions, []);
  // second request while ensuring busy/queue semantics: sequential ok
  const chat2 = await fetch(`http://127.0.0.1:${PORT}/chat`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ agentId: 'angus1', name: 'Angus', role: 'miner', user: 'Ask if the traveller needs a torch.', stimulus: 'curious' })
  }).then(r => r.json());
  assert.equal(chat2.ok, true);
  // no secrets in health
  const h2 = await fetch(`http://127.0.0.1:${PORT}/health`).then(r => r.json());
  assert.ok(!JSON.stringify(h2).includes('sk-ant'));
  console.log(JSON.stringify({ pass: true, healthPreferred: health.providers.preferred, sample1: chat.text, sample2: chat2.text, model: chat.model }, null, 2));
} finally {
  child.kill('SIGTERM');
}
