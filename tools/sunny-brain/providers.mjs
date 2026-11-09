/** Real LLM providers for Sunny clansmen. No API keys in client HTML. */
import { sanitizeSpoken } from './brain.mjs';

let hfPipe = null;
let hfModelId = null;
let hfLoadError = null;
let xenovaPipe = null;

/** Soft gate: keep intelligible short speech; do not over-reject Scots flavour. */
export function looksSpoken(s) {
  if (!s || s.length < 2) return false;
  if (/```|https?:|javascript:|localStorage|eval\(|\brm -\w|sudo /i.test(s)) return false;
  if (/inappropriate|as an ai language model|i cannot provide a response/i.test(s)) return false;
  const weird = [...s].filter(c => c.charCodeAt(0) < 9 || (c.charCodeAt(0) > 13 && c.charCodeAt(0) < 32) || c.charCodeAt(0) > 126).length;
  if (weird > 3) return false;
  const letters = [...s].filter(c => /[A-Za-z]/.test(c)).length;
  return letters >= 4;
}

export async function detectProviders({ timeoutMs = 1200 } = {}) {
  const out = {
    ollama: false,
    ollamaModels: [],
    anthropicEnv: false,
    transformersLocal: true,
    qwenLocal: true,
    preferred: null
  };
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
    }
  } catch (_) {}
  if (out.ollama && out.ollamaModels.length) out.preferred = 'ollama';
  else if (out.qwenLocal) out.preferred = 'qwen-local';
  else if (out.transformersLocal) out.preferred = 'transformers-local';
  else if (out.anthropicEnv) out.preferred = 'anthropic';
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

async function ensureXenova(model = process.env.SUNNY_LOCAL_MODEL || 'Xenova/LaMini-Flan-T5-248M') {
  if (xenovaPipe) return xenovaPipe;
  const { pipeline, env } = await import('@xenova/transformers');
  env.allowLocalModels = true;
  env.useBrowserCache = false;
  xenovaPipe = await pipeline('text2text-generation', model, { quantized: true });
  return xenovaPipe;
}

function extractAssistant(raw) {
  if (Array.isArray(raw)) {
    const last = raw.at(-1);
    if (last && typeof last === 'object' && last.content) return String(last.content);
  }
  return String(raw || '');
}

export async function complete({ provider, system, user, maxTokens = 48, temperature = 0.7, model }) {
  const det = await detectProviders();
  const p = provider || det.preferred;
  if (!p) throw Object.assign(new Error('No LLM provider available'), { code: 'NO_PROVIDER' });

  if (p === 'ollama') {
    const m = model || process.env.SUNNY_OLLAMA_MODEL || det.ollamaModels[0] || 'qwen2.5:0.5b';
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 30000);
    const r = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST', signal: ac.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: m, stream: false,
        options: { temperature, num_predict: maxTokens },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });
    clearTimeout(t);
    if (!r.ok) throw new Error('ollama HTTP ' + r.status);
    const j = await r.json();
    const content = sanitizeSpoken(j.message?.content || '');
    return { provider: p, model: m, content: looksSpoken(content) ? content : sanitizeSpoken(j.message?.content || '') || content, raw: j.message?.content || '', qualityFallback: false };
  }

  if (p === 'qwen-local') {
    const pipe = await ensureQwen(model);
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ];
    const t0 = Date.now();
    const res = await pipe(messages, { max_new_tokens: Math.min(64, maxTokens), temperature, do_sample: temperature > 0.05 });
    const ms = Date.now() - t0;
    const rawList = res?.[0]?.generated_text;
    const raw = extractAssistant(rawList);
    let text = sanitizeSpoken(raw);
    const ok = looksSpoken(text);
    return { provider: p, model: hfModelId, content: ok ? text : (text || raw.slice(0, 120)), raw, ms, qualityFallback: !ok };
  }

  if (p === 'transformers-local') {
    const pipe = await ensureXenova(model);
    const prompt = `One short Scottish highland clansman spoken reply (under 18 words): ${user}`;
    const res = await pipe(prompt, { max_new_tokens: Math.min(48, maxTokens), temperature: Math.max(0.3, temperature), do_sample: true });
    const raw = Array.isArray(res) ? (res[0].generated_text || '') : String(res);
    let text = sanitizeSpoken(raw);
    return { provider: p, model: process.env.SUNNY_LOCAL_MODEL || 'Xenova/LaMini-Flan-T5-248M', content: text || raw.slice(0, 80), raw, qualityFallback: !looksSpoken(text) };
  }

  if (p === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw Object.assign(new Error('ANTHROPIC_API_KEY missing'), { code: 'NO_KEY' });
    if (process.env.SUNNY_ALLOW_PAID !== '1') {
      throw Object.assign(new Error('Paid Anthropic calls blocked until SUNNY_ALLOW_PAID=1'), { code: 'PAID_BLOCKED' });
    }
    const m = model || process.env.SUNNY_ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: m, max_tokens: maxTokens, temperature, system, messages: [{ role: 'user', content: user }] })
    });
    if (!r.ok) throw new Error('anthropic HTTP ' + r.status);
    const j = await r.json();
    const content = (j.content || []).map(c => c.text || '').join(' ');
    return { provider: p, model: m, content: sanitizeSpoken(content), raw: content };
  }

  throw new Error('Unknown provider ' + p);
}

export async function warmupLocal() {
  try {
    const det = await detectProviders();
    if (det.preferred === 'ollama') return { ok: true, model: det.ollamaModels[0], provider: 'ollama' };
    if (det.preferred === 'qwen-local') {
      await ensureQwen();
      return { ok: true, model: hfModelId, provider: 'qwen-local' };
    }
    await ensureXenova();
    return { ok: true, model: 'Xenova/LaMini-Flan-T5-248M', provider: 'transformers-local' };
  } catch (e) {
    hfLoadError = String(e && e.stack || e);
    return { ok: false, error: hfLoadError };
  }
}

export function providerErrors() { return { hfLoadError }; }
