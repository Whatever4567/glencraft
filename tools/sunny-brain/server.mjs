#!/usr/bin/env node
/** Localhost-only Sunny brain HTTP adapter. Never embeds secrets in responses. */
import http from 'node:http';
import { createClanBrain, sanitizeSpoken } from './brain.mjs';
import { detectProviders, complete, warmupLocal } from './providers.mjs';

const PORT = Number(process.env.SUNNY_PORT || 8787);
const HOST = process.env.SUNNY_HOST || '127.0.0.1';
const brains = new Map();
const stats = { req: 0, chat: 0, err: 0, inflight: 0, maxInflight: 1, rejected: 0 };

function brainFor(id, meta = {}) {
  const k = String(id || 'default');
  if (!brains.has(k)) brains.set(k, createClanBrain(meta));
  return brains.get(k);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on('data', c => { n += c.length; if (n > 20000) { reject(new Error('body too large')); req.destroy(); return; } chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function send(res, code, obj) {
  const b = JSON.stringify(obj);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(b);
}

const server = http.createServer(async (req, res) => {
  stats.req++;
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      const providers = await detectProviders();
      return send(res, 200, { ok: true, service: 'sunny-brain', providers, stats, note: 'Local adapter for Glencraft clansmen. No secrets returned.' });
    }
    if (req.method === 'POST' && url.pathname === '/warmup') {
      const w = await warmupLocal();
      return send(res, w.ok ? 200 : 500, w);
    }
    if (req.method === 'POST' && url.pathname === '/chat') {
      if (stats.inflight >= stats.maxInflight) { stats.rejected++; return send(res, 429, { ok: false, error: 'busy' }); }
      stats.inflight++;
      try {
        const body = await readJson(req);
        const id = body.agentId || body.name || 'clansman';
        const b = brainFor(id, { name: body.name || 'Clansman', role: body.role || 'villager' });
        const system = b.systemPrompt({ stimulus: body.stimulus || body.user || '', world: body.world || '' });
        const user = String(body.user || body.stimulus || 'A traveller stands nearby.').slice(0, 400);
        const providers = await detectProviders();
        const provider = body.provider || providers.preferred;
        if (!provider) return send(res, 503, { ok: false, error: 'NO_PROVIDER', need: 'Install Ollama locally, or allow transformers-local warmup, or set ANTHROPIC_API_KEY with SUNNY_ALLOW_PAID=1' });
        const out = await complete({ provider, system, user, maxTokens: Math.min(64, Number(body.maxTokens) || 48), temperature: 0.7, model: body.model });
        b.remember('said: ' + out.content, 0.1);
        stats.chat++;
        return send(res, 200, {
          ok: true,
          provider: out.provider,
          model: out.model,
          text: sanitizeSpoken(out.content),
          mood: b.state.mood,
          curiosity: b.state.curiosity,
          qualityFallback: !!out.qualityFallback,
          actions: [] // deliberately empty: dialogue cannot execute world actions
        });
      } finally { stats.inflight--; }
    }
    send(res, 404, { ok: false, error: 'not found' });
  } catch (e) {
    stats.err++;
    send(res, 500, { ok: false, error: String(e && e.message || e) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(JSON.stringify({ sunny_brain: 'listening', host: HOST, port: PORT }));
});
