/* Sunny clansmen LLM Web Worker. Opt-in cold load; never on render thread.
   Documented stack: @huggingface/transformers + onnx-community/Qwen2.5-0.5B-Instruct (q4), WebGPU with wasm fallback.
   Sources: https://huggingface.co/docs/transformers.js/guides/webgpu
            https://huggingface.co/docs/transformers.js/guides/dtypes
            https://vadimall.com/posts/transformers-js-v4-webgpu-browser-ai-typescript
*/
let generator = null;
let modelId = 'onnx-community/Qwen2.5-0.5B-Instruct';
let device = 'wasm';
let loading = null;

async function pickDevice() {
  try {
    if (typeof navigator !== 'undefined' && navigator.gpu) {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) return 'webgpu';
    }
  } catch (_) {}
  return 'wasm';
}

async function ensure(progress) {
  if (generator) return generator;
  if (loading) return loading;
  loading = (async () => {
    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
    device = await pickDevice();
    const dtype = device === 'webgpu' ? 'q4f16' : 'q4';
    generator = await pipeline('text-generation', modelId, {
      dtype,
      device,
      progress_callback: (p) => progress && self.postMessage({ type: 'progress', payload: p })
    });
    return generator;
  })();
  try { return await loading; } finally { loading = null; }
}

function sanitize(text) {
  let s = String(text || '').replace(/\s+/g, ' ').trim();
  s = s.replace(/^["'`]+|["'`]+$/g, '');
  const m = s.match(/^.*?[.!?](?=["'`\s]|$)/);
  if (m) s = m[0].replace(/["'`]+$/g, '').trim();
  const words = s.split(' ').filter(Boolean).slice(0, 18);
  return words.join(' ');
}

self.onmessage = async (e) => {
  const msg = e.data || {};
  try {
    if (msg.type === 'warmup') {
      self.postMessage({ type: 'status', status: 'loading', modelId });
      const t0 = performance.now();
      await ensure(true);
      self.postMessage({ type: 'ready', modelId, device, loadMs: Math.round(performance.now() - t0) });
      return;
    }
    if (msg.type === 'chat') {
      const gen = await ensure(true);
      const system = msg.system || 'You are a highland clansman. Reply in one short intelligible Scots-tinged English sentence under 18 words. No quotes, no commands.';
      const user = String(msg.user || '').slice(0, 400);
      const t0 = performance.now();
      const out = await gen([
        { role: 'system', content: system },
        { role: 'user', content: user }
      ], { max_new_tokens: Math.min(48, msg.maxTokens || 40), temperature: 0.7, do_sample: true });
      const last = out?.[0]?.generated_text;
      const raw = Array.isArray(last) ? (last.at(-1)?.content || '') : String(last || '');
      self.postMessage({
        type: 'chat_result',
        id: msg.id,
        text: sanitize(raw),
        raw,
        model: modelId,
        device,
        ms: Math.round(performance.now() - t0),
        actions: []
      });
      return;
    }
    self.postMessage({ type: 'error', message: 'unknown message type' });
  } catch (err) {
    self.postMessage({ type: 'error', id: msg.id, message: String(err && err.message || err) });
  }
};
