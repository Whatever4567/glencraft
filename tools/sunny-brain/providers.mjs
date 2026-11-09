/** Real LLM providers for Sunny clansmen. Browser/Pages path is primary; no API keys in client. */
import { createClanBrain, sanitizeSpoken, looksSpoken } from './brain.mjs';

let hfPipe = null;
let hfModelId = null;
let hfLoadError = null;

export { looksSpoken, sanitizeSpoken };

export async function detectProviders({ timeoutMs = 800 } = {}) {
  const out = { ollama: false, ollamaModels: [], anthropicEnv: false, qwenLocal: true, preferred: 'qwen-local' };
  out.anthropicEnv = !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim());
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    const r = await fetch('http://127.0.0.1:11434/api/tags', { signal: ac.signal });
    clearTimeout(t);
    if (r.ok) {
      const j = await r.json();
      out.ollama = true;
      out.ollamaModels = (j.models || []).map(m => m.name);
      if (out.ollamaModels.length) out.preferred = 'ollama';
    }
  } catch (_) {}
  return out;
}

async function ensureQwen(model = process.env.SUNNY_QWEN_MODEL || 'onnx-community/Qwen2.5-0.5B-Instruct') {
  if (hfPipe && hfModelId === model) return hfPipe;
  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = true;
  env.useBrowserCache = false;
  hfModelId = model;
  hfPipe = await pipeline('text-generation', model, { dtype: 'q4' });
  return hfPipe;
}

function extractAssistant(generated) {
  if (Array.isArray(generated)) {
    for (let i = generated.length - 1; i >= 0; i--) {
      const m = generated[i];
      if (m && m.role === 'assistant' && m.content) return String(m.content);
    }
    const last = generated.at(-1);
    if (last && last.content) return String(last.content);
  }
  return String(generated || '');
}

async function generateOnce(pipe, system, user, maxTokens, temperature) {
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];
  const res = await pipe(messages, {
    max_new_tokens: Math.min(48, maxTokens),
    temperature,
    do_sample: temperature > 0.05,
    return_full_text: false
  });
  const generated = res?.[0]?.generated_text;
  const raw = extractAssistant(generated);
  return { raw, text: sanitizeSpoken(raw) };
}

export async function complete({ provider, system, user, maxTokens = 40, temperature = 0.7, model }) {
  const det = await detectProviders();
  const p = provider || det.preferred || 'qwen-local';

  if (p === 'ollama' && det.ollamaModels.length) {
    const m = model || process.env.SUNNY_OLLAMA_MODEL || det.ollamaModels[0];
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 30000);
    const r = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST', signal: ac.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: m, stream: false,
        options: { temperature, num_predict: maxTokens },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
      })
    });
    clearTimeout(t);
    if (!r.ok) throw new Error('ollama HTTP ' + r.status);
    const j = await r.json();
    const text = sanitizeSpoken(j.message?.content || '');
    return { provider: p, model: m, content: text, raw: j.message?.content || '', ok: looksSpoken(text), qualityFallback: false };
  }

  if (p === 'qwen-local' || p === 'transformers-local') {
    const pipe = await ensureQwen(model);
    const t0 = Date.now();
    let out = await generateOnce(pipe, system, user, maxTokens, temperature);
    let ok = looksSpoken(out.text);
    let repaired = false;
    if (!ok) {
      // one bounded repair retry with clearer constraint
      const repairSystem = system + ' Answer only with the spoken words. No narration.';
      out = await generateOnce(pipe, repairSystem, user, maxTokens, Math.min(0.9, temperature + 0.1));
      ok = looksSpoken(out.text);
      repaired = true;
    }
    const ms = Date.now() - t0;
    if (!ok) {
      return { provider: 'qwen-local', model: hfModelId, content: '', raw: out.raw, ms, ok: false, quiet: true, repaired, qualityFallback: false };
    }
    return { provider: 'qwen-local', model: hfModelId, content: out.text, raw: out.raw, ms, ok: true, repaired, qualityFallback: false };
  }

  if (p === 'anthropic') {
    throw Object.assign(new Error('Paid Anthropic blocked (no auto spend)'), { code: 'PAID_BLOCKED' });
  }
  throw new Error('Unknown provider ' + p);
}

export async function warmupLocal() {
  try {
    await ensureQwen();
    return { ok: true, model: hfModelId, provider: 'qwen-local' };
  } catch (e) {
    hfLoadError = String(e && e.stack || e);
    return { ok: false, error: hfLoadError };
  }
}

export function providerErrors() { return { hfLoadError }; }
