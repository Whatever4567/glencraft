# Approved pilot v1 — game integration 1.2.35

These two self-contained GLBs are byte-exact copies of the frozen standalone
pilot model approved for publication. No V2, old procedural face experiment,
reference photograph, editable source archive or unrelated feature is included.

| Asset | Triangles fully equipped | Draw primitives | Materials | SHA256 |
|---|---:|---:|---:|---|
| pilot.glb | 85107 | 38 | 12 | 1e91f94225cee58c4ff5b0d0c42ea39ee1356bbdaf256784fc909af5b7a809a0 |
| pilot-far.glb | 11295 | 18 | 2 | 3b6a836790fe501fe89ff5c23d865188af3c2764c72715c02ca836714a7d263c |

40 native bones; 15 separate visibility/equipment regions. Metres, +Y up,
+Z forward. Feet-root identity; native head size is preserved, not multiplied
by the legacy head pivot scale. Main hand is slot1 / +X / hand.L.

## Integration, not re-authoring

`tools/build-1.2.35.cjs` composes the authoritative previous release and the
native adapter in `tools/pilot-model-source/`. It verifies both GLB hashes.
The two GLBs load once asynchronously through the shipped Three r128 loader.
Each avatar gets independent SkeletonUtils-cloned bones and private material
variants; geometry/images are cached. The complete previous avatar remains
valid if either model cannot load. The old visual meshes are removed only
when the replacement is ready, rather than layered under the new model.

The existing gameplay control groups drive native rest-basis corrected poses.
Two-bone IK uses native 0.241398 / 0.228756 metre arm lengths and native grip
markers. The visual third-person gun placement and support grip are adjusted
for this shorter anatomical reach; weapon damage, fire, ammunition, projectile
logic and first-person assets are unchanged. Model-space torso, head, legs,
forearms and finger controls are retargeted. Native head/arm renderables are
masked for first-person body look-down. World and portrait masks are independent.

Equipment regions map to the five existing slots. Only the named tintable
armour panels vary by tier; default diamond uses the approved original teal.
Mixed tiers get cached per-tier material variants. Removing boot guards leaves
foundation footwear. All equipped regions remain in the existing dress lifecycle
without disposing shared geometry. White pack and nozzle anchors use the native
model; existing flame/fuel/sound objects and particles retain their lifecycle.
Gold item 777 uses an explicit variant policy: the same frozen approved pack
with gold main casing material, and matching neutral-casing palette changes in
its cheap far model. This is not a newly imported gold model.

At 16 metres the entire near rig is hidden and the cached far rig is shown;
geometry indices are never swapped across incompatible material primitives.
The 85107 triangle near count includes all supplied gear, not flame effects.
The current two 12-sided flame cones add 48 triangles when visible.

## Verification and limits

`tests/v1235-pilot-native.mjs` executes the actual embedded Three r128,
shipped GLTFLoader, production controls/animation, original embedded maps,
cloned native bones and actual CPU-skinned positions. It covers asset hashes,
identity-pose equivalence, poses/grip errors, material modes/maps, region masks,
independent inventory rigs, repeated dress/removal, tiers, pack nozzles, failure
fallback, LOD, network caching and release script syntax/metadata.
`tools/render-pilot-native.mjs` produces actual CPU-skinned diffuse comparisons,
not browser screenshots. Normal/roughness maps are loaded and shader-compatible
core glTF maps, but these CPU previews do not simulate game PBR/specular lighting.
No measured GPU performance/FPS or browser screenshot claim is made.
No eyelid morph target is supplied; the old procedural painted-blink texture is
not transplanted onto the approved anatomical head.

## Credits / rights

See `PROVENANCE.md` for the precise MakeHuman CC0 graphical-data foundation,
source URLs and modifications. Thanks to the MakeHuman community, Data Collection
AB, Joel Palmius and Jonas Hauquier. CC0 1.0:
https://creativecommons.org/publicdomain/zero/1.0/
No MPFB application code is bundled. The head is not represented as a scan,
exact personal likeness, or wholly hand-sculpted-from-zero anatomy.
