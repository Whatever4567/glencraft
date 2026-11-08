# Refined diamond armour — approved release 1.2.33

The prior candidate at 56335e15 was explicitly rejected. It remains preserved, not published. The new source is `refined.js`, composed only by `build-armour-refined.cjs`. The refined candidate was approved at t1050 and explicitly requested live at t1051; `build-1.2.33.cjs` now composes it. The rejected source is not included.

## Changed direction

Removed the entire stack of rounded plate pads, belly rings, fluting wallpaper and repeated rivets. Instead each part has a designed anatomical cross-section: a continuous cuirass with a 22% narrower waist than chest, lowered arm openings and open neckline, domed open-face helmet, shaped shoulder sleeves, tapered vambraces, thigh shells following the hips, pointed greaves and shaped sabatons. A narrow collar/hem edge is not a stacked belt. The underlying body, face and bones have not been modified.

Broad shapes come first; medium detail is a sparse pectoral/side panel boundary and a restrained central diamond hallmark. Fine detail is limited to pixel-scale light/dark edge trim. No random scratch field, rivet tiling or flutes. Broad crystalline planes are painted into the original 256px atlas. Limbs use a separate atlas region rather than repeating the chest emblem on every piece. Diamond teal and all tier colours are retained. Inventory Standard materials have restrained .34 roughness / .32 metalness; world Lambert still receives the same original painted surface. This is not a claim of photorealism or a 4K scan.

## References actually viewed

- Public Skyrim Glass Armor gameplay image: https://i.imgur.com/LGCHj.jpg , linked from https://www.reddit.com/r/skyrim/comments/mbwxl/continuing_the_awesome_armor_aesthetic_heres_my/ . Lessons: fitted continuous torso, intentional broad crystalline material, thin layered edges and anatomical limb taper instead of a string of balls/boxes. Reference only; no pixels/models copied or imported. No attempt to reproduce that game's ornament, helmet or armour design.
- User human reference CPU front preview at `/workspace/qa/reference1046/human-ref-v1-front.png`, viewed read-only to check natural torso/limb taper. No imported replacement or use of its textures.
- Existing original diamond-block painter for readable broad facet hierarchy and controlled highlights.

## Reproduce / judge

`node tools/build-armour-refined.cjs artifacts/armour-refined/after.html`
`node tests/armour-refined.mjs`
`node tools/render-armour-preview.mjs artifacts/armour-refined/after.html artifacts/armour-refined/after preview`

Compare against the ORIGINAL LIVE armour in `artifacts/armour-preview/before-*.png`, not merely the rejected pass. New front/back/three-quarter and closeups are in `artifacts/armour-refined/`. Both use the same actual live body, equipment, CPU camera and light. They sample the actual armour and pack texture painters. They are not GPU/in-game screenshots and cannot validate specular lighting, frame rate, physical collisions or full first-person visibility. Separate first-person and head worker changes are not merged. Tests validate mechanics/resources, not artistic approval. Artistic approval applies only to the exact refined preview at 25a66b68; no further art changes are included in release 1.2.33.

## Final local validation

13 armour meshes / 8 cached geometry shapes replace the rejected 37-mesh layering. Original live armour had 24 meshes. Armour alone uses 2,544 triangles. Live-base body plus armour: 98,224 near / 7,367 far; including the unchanged white pack: 99,484 / 8,627. Original live plus pack: 113,732 / 22,875. Full equipped meshes decrease 99→88, geometry resources 86→70; materials stay 21; textures 9→10. These counts use the live 1.2.32 head/body, not either other worker's candidate.

Two final builds are byte-identical. The lifecycle suite checks four tiers and repeated wear/unwear on both inventory PBR and world Lambert models, finite attributes, outward front winding, waist taper, actual bone parents and posed transforms, cached geometry/material reuse, template-safe/idempotent jetpack harness fit, <100k full equipped budget, and unchanged release page outside the fitter. All ten existing targeted suites passed: v1222-equip, v1222-jetpack, v1226-player-detail, v1226-weapon-switch, v1227-fingers, v1227-gun-pose, v1229-face-hands, v1230-sculpt, v1231-detail and v1232-face. Tests are mechanical evidence, not artistic approval.

For a fresh checkout, first create the original-live fixture: `mkdir -p artifacts/armour-preview; node tools/build-1.2.32.cjs artifacts/armour-preview/before.html`. The refined builder does not depend on the rejected source or builder.

Release preservation regression: `node tests/v1233-release.mjs` checks the exact approved source hash and the entire approved preview HTML hash after removing only version, build marker and the new release note. `build-1.2.33.cjs` writes matching HTML and sibling version.json.
