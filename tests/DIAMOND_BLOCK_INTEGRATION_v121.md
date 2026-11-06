# Diamond block texture fix — integration for cave worker (→ 1.2.1)

**Do not merge this branch to main from the diamond agent.** Cave replacement worker owns **1.2.1** (`sand-subagent-109d8b33-4787-855c-acab-b5ae9b874970`). Main tip expected `1091f79` labels **1.2.0**.

## Root cause (evidence)

| Id | Module | Effect |
|----|--------|--------|
| **255** | `items/packed_snow_full_opaque.js` (C287, ORDER ~179) | `T.PACKSNOW = 255`, `FACES[255]='packsnow'` — ice wall / historical id |
| **255** | `world/xp_tidy_spawn_mud.js` (C120, ORDER ~28) | **Also** set `T.DIAMONDBLOCK = 255` + diamond paint |

C287 loads **after** C120, so snow **wins** `FACES` / `NAMES` / `BLOCK_MATS` / icons for 255. Crafted “Block of diamond” was id 255 → **snow texture** in world, C324 earth meshes (via `FACES`), held, and inventory. Not an atlas mip bug; **id collision**.

Uint8 world cells: ids must stay in 1–255. **250** is unused as a block id (timeout literals only).

## Patch contents (this branch `fix/v1.2.1-diamond-block-texture`)

1. `src/world/xp_tidy_spawn_mud.js` — `DIAMONDBLOCK` **250**; richer faceted cyan/blue paint (still procedural canvas, not a 4K photo atlas).
2. `src/ui/v1197_inventory_nature_wool.js` — diamond fallback **250**.
3. `src/items/diamond_block_distinct_v121.js` — late fixer after packed snow: bind 250, leave 255 as snow, static `MeshStandardMaterial` polish, recipe retarget.
4. `src/ORDER.txt` — `items/diamond_block_distinct_v121.js` immediately after `packed_snow_full_opaque.js`.
5. `tests/v121_diamond_block_headless.js` — mapping + pixel evidence (needs `canvas` for pixels).

## Build / integrate

```bash
# On cave worker 1.2.1 source branch:
git fetch origin fix/v1.2.1-diamond-block-texture
git cherry-pick <commit>   # or merge that branch
# OR apply patch:
git apply diamond_block_v121.patch

node tests/v121_diamond_block_headless.js   # expect ALL PASS
python3 build87.py 1.2.1 && python3 build.py v1.2.1
# then normal site PR as cave worker’s release process
```

## Honest limitations

- **Saves:** stacks / world cells that were id **255** remain **packed snow** (correct for ice walls). Old “diamond blocks” were never a distinct id — cannot migrate without guessing.
- **New crafts** of Block of diamond use **250** with the shiny procedural tile.
- Texture is **deterministic canvas facets** (128–256²), mobile-friendly — **not** a literal Glencraft 4K UHD photo atlas; do not claim 4K UHD.
- No GPU sparkles / extra lights; polish is static material params only.
- Agartha code that rewrote `T.DIAMONDBLOCK` world cells to crystal cyan no longer hits ice-wall 255.

## Unchanged

Packed snow id/saves/recipes for 255; diamond **item** (`IT.DIAMOND`) and craft recipe shape (9 diamonds ↔ 1 block); no version bump / deploy from this agent.
