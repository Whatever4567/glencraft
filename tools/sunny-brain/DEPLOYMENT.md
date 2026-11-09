# Sunny clansmen LLM — local browser deployment

## Pages-reachable architecture
- Opt-in Web Worker at `assets/sunny/sunny-worker.js` (module worker).
- Model: `onnx-community/Qwen2.5-0.5B-Instruct` via Transformers.js CDN.
- Devices: WebGPU `q4f16` (~461MB) preferred; WASM `q4` (~750MB) fallback.
- Relative asset URLs — works on Cloudflare Pages the same as local static host. Do **not** point Pages clients at box `127.0.0.1` for inference.

## Client (injected `sunny-llm-1222`)
- Settings: On/Off, Load brain, Cancel load, status (size/progress/device/error).
- Scheduler: nearby clansmen only (≤14), cooldown 14s, queue max 2, cancel on realm leave / death / sleep / mad / leave nearby.
- No telepathy captions; `actions: []` always; no restored per-frame pathfinding AI.

## Local preview
```
cd /workspace/gc-sunny && python3 -m http.server 8765 --bind 0.0.0.0
# open http://127.0.0.1:8765/index.html
```

## Node quality harness
```
node tools/sunny-brain/test-context-scenarios.mjs
```
