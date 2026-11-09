/* Sunny clansmen LLM Web Worker — Pages-reachable, opt-in cold load.
   Model: onnx-community/Qwen2.5-0.5B-Instruct
   Approx download: q4f16 ~461MB (WebGPU) or q4 ~750MB (WASM) + tokenizer ~10MB.
   Docs: https://huggingface.co/docs/transformers.js/guides/webgpu
         https://huggingface.co/docs/transformers.js/guides/dtypes
*/
let generator = null;
let modelId = 'onnx-community/Qwen2.5-0.5B-Instruct';
let device = 'wasm';
let dtype = 'q4';
let loading = null;
let cancelled = false;
let abortWarm = false;

const MODEL_BYTES = { q4: 786156820, q4f16: 483003582, tokenizerApprox: 10000000 };

function sanitize(text) {
  let s = String(text || '').replace(/\s+/g, ' ').trim();
  s = s.replace(/^(Clansman|Assistant|AI|Bot|Hamish|Angus)\s*:\s*/i, '');
  s = s.replace(/^["'`]+/, '');
  const m = s.match(/^.*?[.!?](?=["'`\s]|$)/);
  if (m) s = m[0];
  s = s.replace(/["'`]+$/g, '').trim();
  return s.split(/\s+/).filter(Boolean).slice(0, 16).join(' ');
}
function looksSpoken(s) {
  if (!s || s.length < 2) return false;
  if (/as an ai|language model|I cannot/i.test(s)) return false;
  if (/\b(alert|warn|instruct|tell|advise|inform)\b.*\b(traveller|traveler|player|user)\b/i.test(s)) return false;
  if (/dung drops from the sun|motherboard|cliquez/i.test(s)) return false;
  const weird = [...s].filter(c => c.charCodeAt(0) > 126).length;
  if (weird > 2) return false;
  return [...s].filter(c => /[A-Za-z]/.test(c)).length >= 4;
}

async function pickDevice() {
  try {
    if (typeof navigator !== 'undefined' && navigator.gpu) {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) return 'webgpu';
    }
  } catch (_) {}
  return 'wasm';
}

async function ensure() {
  if (generator) return generator;
  if (loading) return loading;
  cancelled = false;
  abortWarm = false;
  loading = (async () => {
    device = await pickDevice();
    dtype = device === 'webgpu' ? 'q4f16' : 'q4';
    const approx = MODEL_BYTES[dtype] + MODEL_BYTES.tokenizerApprox;
    self.postMessage({ type: 'status', status: 'loading', modelId, device, dtype, bytesApprox: approx, bytesLabel: `~${Math.round(approx / 1048576)} MB first download (then cached)` });
    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
    if (abortWarm) throw new Error('cancelled');
    generator = await pipeline('text-generation', modelId, {
      dtype,
      device,
      progress_callback: (p) => {
        if (abortWarm) return;
        self.postMessage({ type: 'progress', payload: p, device, dtype, bytesApprox: approx });
      }
    });
    if (abortWarm) { try { await generator.dispose?.(); } catch (_) {} generator = null; throw new Error('cancelled'); }
    return generator;
  })();
  try { return await loading; }
  finally { loading = null; }
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

async function chatOnce(gen, system, user, maxTokens) {
  const out = await gen([
    { role: 'system', content: system },
    { role: 'user', content: user }
  ], { max_new_tokens: Math.min(40, maxTokens || 36), temperature: 0.7, do_sample: true, return_full_text: false });
  const raw = extractAssistant(out?.[0]?.generated_text);
  const text = sanitize(raw);
  return { raw, text, ok: looksSpoken(text) };
}

self.onmessage = async (e) => {
  const msg = e.data || {};
  try {
    if (msg.type === 'cancel') {
      abortWarm = true; cancelled = true;
      self.postMessage({ type: 'cancelled' });
      return;
    }
    if (msg.type === 'info') {
      self.postMessage({
        type: 'info',
        modelId,
        sizes: {
          webgpu_q4f16_MB: Math.round(MODEL_BYTES.q4f16 / 1048576),
          wasm_q4_MB: Math.round(MODEL_BYTES.q4 / 1048576),
          tokenizer_MB: Math.round(MODEL_BYTES.tokenizerApprox / 1048576)
        }
      });
      return;
    }
    if (msg.type === 'warmup') {
      const t0 = performance.now();
      await ensure();
      self.postMessage({ type: 'ready', modelId, device, dtype, loadMs: Math.round(performance.now() - t0), bytesApprox: MODEL_BYTES[dtype] + MODEL_BYTES.tokenizerApprox });
      return;
    }
    if (msg.type === 'chat') {
      if (cancelled && !generator) throw new Error('cancelled');
      const gen = await ensure();
      const system = msg.system || 'You are a highland clansman. Speak in first person, one short sentence under 16 words. Plain English with light Scots flavour. No narration or orders.';
      const user = String(msg.user || '').slice(0, 400);
      const t0 = performance.now();
      let r = await chatOnce(gen, system, user, msg.maxTokens);
      let repaired = false;
      if (!r.ok) {
        repaired = true;
        r = await chatOnce(gen, system + ' Only the spoken words.', user, msg.maxTokens);
      }
      if (!r.ok) {
        self.postMessage({ type: 'chat_result', id: msg.id, ok: false, quiet: true, text: '', raw: r.raw, model: modelId, device, dtype, ms: Math.round(performance.now() - t0), repaired, actions: [] });
        return;
      }
      self.postMessage({ type: 'chat_result', id: msg.id, ok: true, text: r.text, raw: r.raw, model: modelId, device, dtype, ms: Math.round(performance.now() - t0), repaired, actions: [] });
      return;
    }
    self.postMessage({ type: 'error', message: 'unknown message type' });
  } catch (err) {
    self.postMessage({ type: 'error', id: msg.id, message: String(err && err.message || err), cancelled: /cancel/i.test(String(err && err.message || err)) });
  }
};
