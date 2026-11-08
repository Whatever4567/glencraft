# Local anatomy candidate 1.2.33

Build: `node tools/build-1.2.33-anatomy.cjs index.html`.
The builder chains the public 1.2.32 wrapper. `GC_BASE32` is an optional exact-baseline shortcut, not required for reproducibility.
This is a LOCAL candidate. GAME_VERSION and version.json remain 1.2.32; only the local build marker and userData.anatomy identify 1233. No release notes or publication are part of this candidate.

## Art decisions and iterations

Five CPU multiview iterations were examined. The final candidate keeps the approved big blue eye paint and opening surfaces, brows, hair, rig and clothing. It replaces the angular piecewise nose ramp with continuous bridge/lobule/wings, reduces the mouth muzzle/lip projection, tapers the lower skull keys subtly, and builds smaller ears with an actual branching antihelix rather than nested rings. The nose/lip paint is aligned to the changed mesh UV landmarks, rather than the old painted blocks. No extra subdivisions were added.

Measured on the real mesh in head-local units:

- Maximum central nose z: 0.2614 -> 0.2523.
- Largest 2mm nose-profile second difference: 0.0050 -> 0.0004.
- Upper lip relief: 0.0110 -> 0.0058; lower: 0.0087 -> 0.0044.
- Upper mouth surface z: 0.2204 -> 0.2091.
- Jaw half-width at y .05: .1165 -> .1122; y .09: .1472 -> .1433; y .12: .1712 -> .1662.
- Ear height: .1075 -> .0951; depth: .0640 -> .0585.
- Ear radial front/back edge step: .0015; the same ring joins both sheets.
- Cheek/jaw adjacent normal angle p99 7.71 degrees, maximum 12.28 degrees.
- Eye openings: 474 tested vertices exactly unchanged. Eye/brow paint rectangles byte-identical.
- Body meshes and local transforms unchanged. Lid transforms unchanged.
- 95680 near triangles, 4823 far, 48 meshes, 11 materials, 8 textures.

## Validation

Two complete builds, without GC_BASE32, match each other and index.html exactly.
`tests/v1233-anatomy.mjs`: 21 checks.
`tests/v1232-face.mjs`: 22 checks.
The established 19 targeted regression invocations pass, including tbox-fast REAL=1 and fire-cost EXPECT=fixed.

Only intentional anatomy expectations in older tests change, gated on userData.anatomy === 1233:

- v1231-detail: tip landmark .196, nostril (.016,.169), ala (.028,.177), line .1138, lower lip .105. The nose/bridge minimum projection is .02; wing/nostril .003; upper/lower lip relief .004/.003. The chin should blend with the lip-chin dip (difference below .008), not form the previous projecting knob, and its depth remains .185-.205. Older model thresholds remain intact.
- v1232-face: mouth/nostril samples move to their actual new UV locations; the less saturated lips and lighter nostrils have appropriately smaller colour/contrast minima. All big-eye size and blue-colour checks remain.

## Evidence and limits

Final comparisons: `/workspace/qa/anatomy33/final33b-cmp-*.png`; overview `/workspace/qa/anatomy33/index.html`.
The CPU rasterizer loads the actual meshes and runs each page's own face painter, sampling the resulting texture through actual UVs. It is NOT GPU or in-game proof; non-face material maps/lighting are simplified. The anatomy is stylized original art, not a scan or an exact likeness. The mouth is deliberately subtle and may be less visible at gameplay distance. Runtime and GPU performance remain unmeasured.
