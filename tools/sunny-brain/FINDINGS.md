# Sunny ZIP inspection + integration findings (local only)

## Archives
- `sunny-project.zip` (387064): Rust **digital-brain** (`digital-brain-main`, MIT). Consciousness/agent library with Anthropic LLM backend (`src/core/llm/`). Ollama listed as coming soon. **No model weights, no voice packs, no Glencraft glue.** Symlink `CLAUDE.md` skipped on extract.
- `sunny-extra.zip` (126370): Python **Conscious-AI** (`Conscious-AI-main`, LICENSE present). Research agent expecting **LLaMA-3.2-3B** + CUDA/torch checkpoints. **No checkpoints/weights included.** Not browser-runnable as-is.

## Secrets
No committed API key values found. Anthropic adapter reads `ANTHROPIC_API_KEY` from environment. Client HTML must not embed keys.

## Game state (v1.0.53 removal still in live 1.2.34)
- C236 cleared `glx_sunny_*` and removed laggy awareness/pathfinding/inventory AI.
- Clansmen still have villager-style procedural voices (`__c100` / C232) and a dormant `SUNNY_BRAIN.cycle` mood hook.
- Preference: Scots-intelligible voice, **no on-screen telepathy text**.

## Chosen real route
1. Port digital-brain dialogue concepts into a localhost Node adapter (`tools/sunny-brain`).
2. Real LLM providers: **transformers.js local** (default free proof), **Ollama** if present, **Anthropic** only with env key + explicit `SUNNY_ALLOW_PAID=1` (blocked by default).
3. Game module `sunny-llm-1222.js`: clansmen-only, async queue, cooldown, near radius, cancel-on-leave, settings toggle; speaks via speechSynthesis + existing hum; no world-action execution from model text.
