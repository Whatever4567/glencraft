# v1.1.101 anatomical player / FPS hand upgrade

**Review only. Do not merge or deploy from this report.** The live release remains unchanged.

Editable source, generator, tests and original source-history commit are in [`feat/v1.1.101-anatomical-player`](https://github.com/Whatever4567/glencraft/tree/feat/v1.1.101-anatomical-player). This main-based branch contains the corresponding single-HTML artifact and version marker because source-only history and site `main` are unrelated.

## Implemented

- Original weighted `SkinnedMesh` hand per hand: continuous tapered fingers and joints, unified palm/wrist surface, knuckle and palm-pad relief, opposing thumb on the anatomically radial side, small nails. Mirroring is in geometry, not negative object scale.
- No photograph overlay, third-party hand mesh, giant texture set. Skin texture is procedurally generated.
- FP hands attach to the existing exclusive gun-pose owner; no additional pose layer. Prior immutable weapon scale and old-model-hide-before-asset-ready paths are preserved.
- TP shares that hand source, adds final wrist/support targeting and finger curls, smooth jaw-tapered head, shaped linen torso, and fixed-thickness eyelids with actual close/open phases. Existing Scottish linen and tartan identity is retained.
- Two hand skin meshes are **1,776 vertices combined**, excluding five small nails per hand. Head uses 1,584 vertices.

## Verification

All prior headless suites for v1.1.96–v1.1.100 pass. New tests evaluate real indexed skin data, skin weight sums, thumb handedness, 1,500 hand poses, the real FP gun chain under load/fire/ADS/manual reload/switching, a 1,200-cycle switch loop, 800 TP rifle/pistol frames and actual eyelid close/open state. Build was run with `build87.py 1.0.201`, then `build.py v1.1.101`; the artifact contains `GAME_VERSION = 'v1.1.101'`.

## Honest limitations

CPU generated geometry was reviewed; this is **not** an Android/browser gameplay test or claim of photorealistic parity with reference photos. Remaining body/face surfaces and grips are stylised and need visual inspection on-device before release. No in-game screenshots are attached. Saves, terrain, mining, reload code and the existing v1.1.100 portal are not altered by the artifact update apart from retaining the shared source.
