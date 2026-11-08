# Local armour preview — no deployment

Base: `0f8ac65a2b2f4aa1359396d522ca5d0694434a29` (live 1.2.32).

Build: `node tools/build-armour-preview.cjs artifacts/armour-preview/after.html`
Test: `node tests/armour-sculpt.mjs`
Render: `node tools/render-armour-preview.mjs artifacts/armour-preview/after.html artifacts/armour-preview/after preview`

The builder replaces only the HD equipment fitter (and its narrowly scoped worn jetpack strap fit). The release builder, index.html, world, inventory data, combat, saves, head, underlying body and rig are unchanged. It is deliberately not wired into the release build.

## Diagnosis and art

The old HD fitter used untextured single-material rounded boxes, half-sphere shoulder caps and one continuous tapered cylinder as leggings. Most of its triangles rounded the same silhouettes rather than describing construction. Simply subdividing those shapes would not add visible detail.

This candidate uses an actual ring-profile cuirass with tapered waist/ribs/collar, paired keeled breast and back plates, overlapping abdominal lames, layered pauldron/couter/forearm plates, split hip-pivot tassets, knee/shin/sabaton plates, a separate multi-ring domed helmet crown, brow and cheek guards. Four tiny raised rivets are built into each plate buffer, rather than added as separate meshes. No changes to the face are included.

The one 256-square original pixel atlas combines recessed seams, rolled-edge highlights, directional tapered fluting, rivet pixels, chased chevrons, short edge nicks and restrained fine grain. It multiplies the existing tier colour, retaining diamond teal and all other tiers. Nearest magnification preserves authored pixels; mipmaps handle distance. Inventory Standard materials gain restrained roughness/metalness and a small bump; the Lambert world path still has the same painted detail and actual geometry. This is not a 4K scan or photorealistic asset.

Reference opened and visually inspected: The Metropolitan Museum of Art, *Field Armor*, Nuremberg, ca. 1525, object 04.3.289; public-domain/CC0 record https://www.metmuseum.org/art/collection/search/35778 ; image https://images.metmuseum.org/CRDImages/aa/original/DP341737.jpg . Reference lessons: tapered flutes, overlapping shoulder lames, shaped waist, separate thigh defenses, edge rolls. No museum pixels were copied into the game. The existing `tools/diamond-source/diamond-block.js` painter was also inspected: its readable directional planes, light/dark facet hierarchy and controlled edge sheen are more important than noise density. Those principles guide the original armour atlas.

## Budgets and checks

See `artifacts/armour-preview/lifecycle.log` for exact current counts. All armour is bounded/cached: 37 attached meshes, one shared tier material, one shared atlas, 21 geometry shapes. Rewearing does not allocate new GPU geometry/material/texture assets. The base model's existing LOD is unchanged; equipment itself remains modest polygon count at distance. Mesh count increases relative to the old equipment, but triangles decrease substantially.

The harness executes the actual production dress function, HD fitter, real Three geometry and node-canvas painters. Tests cover 32 tier changes in both inventory PBR/world Lambert paths, wear/unwear, detached old parts, shared cached geometries/materials, finite vertices/normals/UVs, actual bone parents, posed knee/hip/arm transforms, unchanged template jetpack resources, idempotent strap adjustment, and unchanged page scope. The exact production white jetpack model/dress is included. The unchanged release regression suite covers inventory equip, jetpack lifecycle, weapon switch, fingers/grips, face and sculpt budgets.

Worn pack straps are moved outward on each clone so the new chest layers do not hide them. Shoulder straps lengthen to reach; the cached jetpack template, tanks/nozzles/flames and gameplay are not modified. Rear cuirass depth is reduced to clear the pack mount.

Evidence images are CPU orthographic rasterizations of actual equipped meshes/UVs/textures, same equipment/camera/light before and after. Armour and jetpack pixel maps are sampled from their own painters. They are **not in-game/GPU/browser screenshots**: no GPU bump/specular/shadow validation, no mobile framerate measurement, and no full app first-person camera/visibility-cache proof. First-person parity is a separate worker's patch and is not merged here. These are preview improvements, not a claim of photorealism.

Final measured budgets: base 95,680 triangles; new armour 2,432; fully armoured model 98,112 (far 7,255), versus previous 112,472 (far 21,615). Including the unchanged white jetpack, 99,372 near / 8,515 far, versus previous 113,732 / 22,875. No global budget was raised. With pack: 112 meshes (previous 99), 83 geometry resources (previous 86), 21 materials unchanged, 10 textures (previous 9). The mesh increase is the deliberate tradeoff for individually articulated layered pieces; no GPU performance claim is made.

Validation on final reference-fluting candidate: two generated HTML files byte-identical; atlas pixels deterministic across isolated page loads; all 10 targeted production suites passed (`v1222-equip`, `v1222-jetpack`, `v1226-player-detail`, `v1226-weapon-switch`, `v1227-fingers`, `v1227-gun-pose`, `v1229-face-hands`, `v1230-sculpt`, `v1231-detail`, `v1232-face`) plus the new armour lifecycle suite. Logs and labelled CPU comparisons are in `artifacts/armour-preview/`.
