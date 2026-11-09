# Sunny clansmen local LLM brain

Local-only adapter restoring Sunny-style dialogue for Glencraft **clansmen** with a **real LLM**, bounded async voice output.

## Run
```bash
cd tools/sunny-brain
npm install   # once
node server.mjs   # 127.0.0.1:8787
```
Then open the local built `index.html` (or `artifacts/sunny-local/index.html`) with the game. Clansmen near the player request dialogue from the local server.

## Providers (priority)
1. **transformers-local** (default free proof): `Xenova/LaMini-Flan-T5-248M` via `@xenova/transformers`
2. **ollama** if `http://127.0.0.1:11434` is up (recommended for better Scots chat quality)
3. **anthropic** only if `ANTHROPIC_API_KEY` is set **and** `SUNNY_ALLOW_PAID=1` (blocked by default; never embed keys in client/HTML)

## Tests
```bash
node test-sunny.mjs
node test-http-lifecycle.mjs
```

## Limits
- No publish/PR from this local branch unless separately approved.
- Small T5 quality is limited; install Ollama + a chat model for better speech.
- Does not restore the removed laggy pathfinding/inventory Sunny AI.
- Voice only (speechSynthesis + existing villager hum); no telepathy captions.
