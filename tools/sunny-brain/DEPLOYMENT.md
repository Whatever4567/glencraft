# Sunny clansmen real-LLM deployment architecture (not publish-ready)

Parent/user decision required before any GitHub Pages go-live of Sunny LLM.

## Research sources used (unblock-research)
1. https://github.com/ollama/ollama/issues/18215 — official portable no-root Linux install via `ollama-linux-amd64.tar.zst` + zstd/tar
2. https://huggingface.co/docs/transformers.js/guides/webgpu — WebGPU device flag for Transformers.js
3. https://huggingface.co/docs/transformers.js/guides/dtypes — `onnx-community/Qwen2.5-0.5B-Instruct` q4/WebGPU example
4. https://vadimall.com/posts/transformers-js-v4-webgpu-browser-ai-typescript — Web Worker + Qwen2.5-0.5B pattern (never on UI/render thread)
5. https://locallm.net/ — documents HTTPS→localhost Private Network Access blocks for Ollama from public Pages
6. X/@bot threads: Grok Bot users pair local Ollama with tools; browser Pages still cannot reach another user's 127.0.0.1

## Why `http://127.0.0.1:8787` is not enough for live Pages
- GitHub Pages is served from `whatever4567.github.io` to the **player's** browser.
- A brain bound to the developer machine loopback is unreachable on the player's device.
- Even if the player runs Ollama locally, public HTTPS pages are often blocked from calling localhost (Private Network Access). Local-served game + local Ollama works; hosted Pages + localhost usually does not.

## Valid architectures (choose one)

### A) In-browser opt-in Web Worker (best free Pages path)
- Bundle/serve `browser/sunny-worker.js`.
- Opt-in cold load of `onnx-community/Qwen2.5-0.5B-Instruct` (~hundreds of MB q4; cached in origin storage after first load).
- WebGPU when available, WASM fallback otherwise.
- **Pros:** works on Pages without backend; no API keys; no per-token spend.
- **Cons:** first-load size/time; mobile/WebGPU variance; small-model quality; must never auto-download on boot (settings opt-in).

### B) Player-local Ollama (documented portable binary)
- Unprivileged extract of official `ollama-linux-amd64.tar.zst` (Python `zstandard` works without system `zstd`).
- Player runs `ollama serve` + a chat model; game uses Local Server mode only when origin is localhost or CORS/PNA allows.
- **Pros:** better model quality possible.
- **Cons:** not automatic for random Pages visitors; player setup required.

### C) User-approved hosted backend
- Cloudflare Worker / Fly.io / etc. proxy to Anthropic/OpenAI/Ollama-cloud.
- Requires explicit credential + spend approval; never embed keys in public HTML.
- **Pros:** consistent quality on all devices.
- **Cons:** cost, ops, privacy; must not auto-pay.

## Security / license
- digital-brain ZIP: MIT; Anthropic adapter is env-key only.
- Conscious-AI ZIP: needs LLaMA weights (not included); not used for runtime.
- Dialogue cannot execute world commands (`actions: []`).
- No arbitrary code execution from model text.

## Lag safeguards (vs removed v1.0.53 Sunny AI)
- Clansmen only; no restored pathfinding/inventory/objectives loop.
- Max 1 in-flight generation; cooldown; near radius; cancel on leave/dim.
- Worker/off-main-thread inference; no per-frame LLM.
