# 1.2.35 verification

Two independent authoritative `tools/build-1.2.35.cjs` builds produce identical
HTML and version metadata. Both frozen GLB SHA256 values are checked by the builder.

63 native integration checks PASS with the actual embedded Three r128 and shipped
GLTFLoader. Identity controls reproduce the approved GLB within 0.00000018 metres.
Tested rifle main-hand errors are below 0.0002 metres, support-hand errors below
0.006 metres at pitch -0.5 / 0 / +0.5 radians; tested pistol errors below 0.00003
metres. Native animation/pose, clone independence, actual installer, first-person
visibility, equipment lifecycle, maps, opaque skinning, LOD and load failure are
covered. These are CPU transform/skin tests, not GPU performance measurements.

19 preserved suites PASS:
- v1226-player-detail, v1226-weapon-switch
- v1227-fingers, v1227-gun-pose
- v1229-face-hands, v1229-fire-cost
- v1230-sculpt, v1231-detail, v1232-face (22 legacy face assertions)
- v1222-hands, v1222-inventory, v1222-jetpack, v1222-equip
- v1222-rag, v1222-deadlook, v1222-guns-cab
- v1224-stability, v1222-cabin, v1222-perf

Two additional historic preview suites were attempted and also fail on untouched
1.2.34: `armour-refined` expects 13 parts instead of the already-shipped 17;
`pilot-preview` lacks its untracked artifacts/pilot-preview/before.html fixture.
They are not silently disabled or reported as passing. Their frozen old-model
scope assertions are not the new native-model integration test.

Offline matched front / three-quarter / side comparisons use the actual GLBs,
embedded colour maps and r128 CPU skinning. They represent diffuse lighting only.
No browser/GPU screenshot, frame-rate or PBR lighting equivalence is claimed.
