# Approved Scottish base — 1.2.36 integration

The three near GLBs are byte-identical to the specifically approved Scottish delivery.
Archive SHA256: `6331d4952644d2a8836fe4b3593a72641fcb46978353cb39be82c5965bea55b1`.
No new art, Sunny changes or unrelated V2 asset was imported. The anatomy already
inside this approved archive is retained; see HEAD-PROVENANCE.md for its CC0
MakeHuman graphical-data foundation and official licence URLs. No source-tool GPL
program code or private portrait is bundled. Source graphical-data hashes are included.

## Runtime adaptation

- Actual embedded Three r128, shipped GLTFLoader/SkeletonUtils; forty original bones,
  metre/Y-up/feet-root convention, native +X hand.L main grip and native arm lengths.
- The Scottish-with-pack template is cached once. A white pack enables ONLY its
  separate pack region. A gold owned pack uses the existing gold-tint policy.
  Neither pack equips flight clothing, a helmet or chest armour.
- Prior approved pilot assets provide only genuinely selected optional armour and
  armoured trousers, rebound by matching native bones/rests. No duplicate old body.
  Leggings hide kilt/sporran/hose; removal restores the base. Other armour stays optional.
- Standard under-clothing occlusion masks 480 covered near-leg triangles (63 far)
  to prevent thigh poke-through. Original position/normal/UV arrays remain intact.
  Waist-fixed kilt hem gains bounded 35% thigh weights; visual stride is bounded while
  gameplay speed stays unchanged. This is not cloth simulation; extreme poses may
  still intersect clothing. Approved GLB bytes are never rewritten.
- Actual head/arm renderables hide in first person; world and portrait are independent.
  Asset loading is transactional/cached, with a valid earlier avatar on failure.
- Portrait wrapper now grows to panel width (the old absolute canvas had zero width),
  resizes its camera and accepts pointer dragging. Portrait remains sRGB/ACES.
- Managed character materials compensate for the legacy world renderer missing the
  final display transfer, without global light/exposure or texture-data changes.

## Honest budgets

| State | Source near triangles | Rendered near | Far rendered |
|---|---:|---:|---:|
| Scottish base | 89,568 | 89,088 | 6,899 |
| Base + exact approved pack | 109,536 | 109,056 | 8,294 |
| Full optional diamond armour + pack | — | 126,118 | 11,465 |

The exact newly approved pack exceeds the earlier experimental 100k target; it has
not been silently decimated or misreported. Base near: 26 primitives/12 materials;
base+pack: 33/19. Far base+pack: 9 primitives/1 vertex-colour material, no images.
Full optional-armour far: 18 primitives/3 materials. No GPU/FPS claim.

`scottish-far.glb` is an explicitly derived distant LOD (8,357 source triangles),
not a re-export of approved near art. `tools/scottish-source/build-far.py` records its
Blender collapse and vertex-palette construction. Khronos: all near files zero
errors/warnings; far zero errors, nine non-root-skinned-node warnings (identity
parent transforms; actual r128 loading and skinning tested), plus informational
unused UV/marker records.

## Tests / evidence

Build: `node tools/build-1.2.36.cjs` (authoritative chain through 1.2.35).
Tests: v1236-pilot-display-transfer, v1236-scottish, v1236-unequip-lifecycle,
v1236-portrait; preserved v1235 native suite with PILOT_EXPECT_VERSION=1.2.36;
nineteen prior gameplay regression suites. Equipment test expectations intentionally
change from keep/upgrade-on-occupied-click to remove-first, as requested.

CPU previews use actual r128-skinned geometry and embedded colour maps; approximate
diffuse lighting plus the actual ACES/display equations, not a GPU/PBR screenshot.
Public browser QA must confirm portrait visibility/drag, armour removal/returns,
pack-only outfit, body lookdown and weapons after deployment.
