# 1.2.3 diamond candidate: NOT READY

Fresh isolated base: 5c79e69b3ad514e8e64bbc0c5cf353db48d6454a.
No gameplay/artifact/version changes, no publication.

The earlier source-only audit missed base-bundle registrations. Actual production:
- `const LEAF = {... juniper: 250 ...}`
- `[146,...,250,...].forEach(i => LEAFY[i] = 1)`
Thus 7d5cc2a must NOT be integrated: it steals juniper id250.
- C120 DIAMONDBLOCK255 collides with C287 PACKSNOW255 (snow wins).
- `world` is Uint8Array; RLE decode fills byte values. Id256 becomes AIR.
- High byte slots checked also contain live blocks/items (191–199 planets,
  200 basalt column, 201–214 tools/hell/guns, 215 leaves, 216 lantern,
  217 sword, 218/219 regional grass/plant, 220–249 building/crystals,
  250 juniper, 251 enchanting, 252/253 leaves, 254 rowan mapping, 255 snow).

No free supported alternative id has been certified; do not silently reclaim
legacy item ids that save migrations still rewrite, and do not widen world/save
storage as part of this small repair. Needs a deliberate registry allocation
and save compatibility decision before a publishable candidate is possible.
The previous pixel tests only tested a hand-built stub registry; they did not
certify actual startup or atlas mapping and must not be cited as that proof.

Run: node tests/diamond-id-allocation-proof.cjs
