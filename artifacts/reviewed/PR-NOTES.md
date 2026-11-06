## 1.2.1 review: saved cave load + bounded work

No merge/deploy and no real-world save reset in this branch. Prior traversal, placement, reset invalidation, Agartha/Hell and UFO protected fixes are preserved.

### Found
C324 used to wait for `started=true`, but original `enterWorld` could accept its 25 surface chunks before any cave geometry existed. That produced incorrect first-load ownership. Separately, out-of-radius `drop` removed the mesh/light owner but retained suspended voxel buffers in alternate frames.

### Minimum patch
- Existing C317 native flat restored negative-Y position, including the existing +0.05 clearance, must have its nearest actual C324 column completed with real mesher+light+AO before ordinary original readiness and first render.
- During the incomplete saved-cave wait ordinary surface loading is paused. No arbitrary distance increase, fog/water blanking or new terrain generator.
- Out-of-radius partial voxel ownership releases with the same column.
- Retention test asserts actual radius+hysteresis on travel away, not nearby/return re-entry.

### Tests in this commit
Eight relevant checks all pass with `node --max-old-space-size=640`: cave-regression, cave-mesh-parity-proof, cave-dimension-proof, cave-surface-traversal-proof, cave-traversal-proof, cave-enterWorld-integration-proof, cave-saved-restore-proof, cave-loader-no-handshake-proof. Full real enterWorld integration proves applySave -> exact C317 -> near actual geometry/AO lighting -> first render -> started; no saved bytes rewritten; public builds paused while pending.

### Reproduce
Run `node tools/build-cave-patch.cjs --print-hash`, then feed its exact `output` to the `CAVE_EXPECT_SHA` environment guard and run `CAVE_EXPECT_SHA=<hash> node tools/build-cave-patch.cjs /tmp/reviewed.html`. That writes only the hash-checked editable-script candidate using source C324 plus immutable checkpoint; guard output verified matches exact SHA.

### Still unverified/outstanding
No browser device FPS/gameplay screenshots verified; this is not proof every overlapping cave is gone. Round C321 frame conversion and visual cave replacement remain separate. Preserve/reference additional cave designs later; no art or diamond patch included.
