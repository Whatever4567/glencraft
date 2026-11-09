/** Real LLM providers for Sunny clansmen. No API keys in client HTML. */
import { pipeline, env } from '@xenova/transformers';
import { sanitizeSpoken } from './brain.mjs';
function looksSpoken(s){if(!s||s.length<2)return false;const letters=[...s].filter(c=>/[A-Za-z]/.test(c)).length;const weird=[...s].filter(c=>/[^ -~]/.test(c)).length;return letters>=4 && weird<=2 && !/inappropriate|cannot respond|as an ai/i.test(s);}

env.allowLocalModels = true;
env.useBrowserCache = false;

let localPipe = null;
let localModelId = null;
let localLoadError = null;

export async function detectProviders({ timeoutMs = 1200 } = {}) {
  const out = { ollama: false, ollamaModels: [], anthropicEnv: false, transformersLocal: true, preferred: null };
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
  else if (out.transformersLocal) out.preferred = 'transformers-local';
  else if (out.anthropicEnv) out.preferred = 'anthropic';
  return out;
}

async function ensureLocal(model = process.env.SUNNY_LOCAL_MODEL || 'Xenova/LaMini-Flan-T5-248M') {
  if (localPipe && localModelId === model) return localPipe;
  localModelId = model;
  localPipe = await pipeline('text2text-generation', model, { quantized: true });
  return localPipe;
}

export async function complete({ provider, system, user, maxTokens = 48, temperature = 0.7, model }) {
  const p = provider || (await detectProviders()).preferred;
  if (!p) throw Object.assign(new Error('No LLM provider available'), { code: 'NO_PROVIDER' });

  if (p === 'transformers-local') {
    const pipe = await ensureLocal(model);
    // Flan/LaMini models work best with short instruction prompts.
    const prompt = `Rewrite as one short spoken highland clansman greeting or reply (under 18 words, Scots-tinged English, no quotes): ${user}`;
    const res = await pipe(prompt, { max_new_tokens: Math.min(48, maxTokens), temperature: Math.max(0.3, temperature), do_sample: true, top_p: 0.9 });
    const raw = Array.isArray(res) ? (res[0].generated_text || res[0].summary_text || '') : String(res);
    let text = sanitizeSpoken(raw);
    if (!text || /cannot respond|inappropriate|as an ai/i.test(text)) {
      const res2 = await pipe(`Say a friendly short Scottish villager line to a traveller:`, { max_new_tokens: 24, temperature: 0.9, do_sample: true });
      const raw2 = Array.isArray(res2) ? (res2[0].generated_text || '') : String(res2);
      text = sanitizeSpoken(raw2);
    }
    if (!looksSpoken(text)) {
      const res3 = await pipe('Write one short friendly Scottish sentence to a visitor:', { max_new_tokens: 24, temperature: 0.8, do_sample: true });
      const raw3 = Array.isArray(res3) ? (res3[0].generated_text || '') : String(res3);
      text = sanitizeSpoken(raw3);
    }
    if (!looksSpoken(text)) text = 'Aye, welcome to the glen.';
    return { provider: p, model: localModelId, content: text, raw, systemUsed: !!system };
  }

  if (p === 'ollama') {
    const m = model || process.env.SUNNY_OLLAMA_MODEL || 'llama3.2:1b';
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 20000);
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
    return { provider: p, model: m, content: sanitizeSpoken(j.message?.content || ''), raw: j.message?.content || '' };
  }

  if (p === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw Object.assign(new Error('ANTHROPIC_API_KEY missing'), { code: 'NO_KEY' });
    // Do not spend by default; require explicit opt-in.
    if (process.env.SUNNY_ALLOW_PAID !== '1') {
      throw Object.assign(new Error('Paid Anthropic calls blocked until SUNNY_ALLOW_PAID=1'), { code: 'PAID_BLOCKED' });
    }
    const m = model || process.env.SUNNY_ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: m, max_tokens: maxTokens, temperature,
        system,
        messages: [{ role: 'user', content: user }]
      })
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
    await ensureLocal();
    return { ok: true, model: localModelId };
  } catch (e) {
    localLoadError = String(e && e.stack || e);
    return { ok: false, error: localLoadError };
  }
}

export function providerErrors() { return { localLoadError }; }
