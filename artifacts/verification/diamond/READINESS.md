# 1.2.3 diamond release candidate — ready for normal release

Base: 5c79e69b3ad514e8e64bbc0c5cf353db48d6454a (1.2.2 caves/Y0).
Reproducible build: `node tools/build-diamond-patch.cjs /tmp/result.html`.
Output SHA256: 4902b622f483fbaa854c284a3a426fb690b949ae6b4b5aadc1d9880c1b4b5a9d.
This invokes the exact existing cave builder, then source-owned bounded transforms.

## Allocation
All byte slots enumerated in byte-registry.csv (including items, crop intermediate
stages, shape ids and legacy save-migration consumers). No safely reclaimable byte
slot. 250 is juniper leaves; 255 remains packed snow. 259 had no production numeric
registry references before this patch (post-patch contexts in id259-contexts.json).
256–258 already identify wool; no new wool visuals added here.

Diamond259 uses Uint16 block-cell backing, including world, old-H restore buffer,
planet columns, C324 earth cache, partial mesh jobs, north extension, snapshots.
Type masks grow to1024; atlas layer/UV/lighting attributes remain byte arrays:
those hold layer indices or intensity, NOT block ids. Saved numeric edit maps do
not truncate. RLE gains `u16:` tagged triples only when needed (async world save
uses tagged triples incrementally). Legacy pair-format byte saves still load and
byte-only synchronous saves keep exact old encoding. Never reinterpret old255.

## Automated evidence
`NODE_PATH=/tmp/diamond-canvas/node_modules node tests/diamond-v123-proof.cjs`
(actual production functions + actual source module, real canvas pixels)
`node tests/diamond-mesh-proof.cjs`
(actual plain/packed mesh buffers compared, diamond259 included)
`node tests/cave-y0-crossing-proof.cjs`
`node tests/cave-saved-restore-proof.cjs`
All pass. Full inline JS syntax parsed; clean rebuild cmp identical.

## Honest limits
No browser/gameplay claim. Static original cyan faceted 128/256px tile, not a
literal4K atlas. World cell buffers use twice the byte backing memory; masks,
lighting and atlas indices stay byte sized. New extended saves are backward-load
compatible in this release, but older game versions cannot decode tagged saves.
Old diamond-looking255 stacks stay snow; craft fresh diamond259 from9 diamonds.
