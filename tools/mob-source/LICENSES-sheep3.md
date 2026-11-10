# sheep3 source licences

sheep3 is a game-ready remake derived from a third-party base mesh.
It is unpublished work on feature/v1.2.6x-mobs.

## Base mesh and original textures

- Title: Sheep (high-detail black-faced farm sheep)
- Source: https://grab3d.com/models/animals/sheep/
- Author / publisher: Grab3D (Germany)
- Licence: CC0 1.0 Universal (public domain dedication)
  https://creativecommons.org/publicdomain/zero/1.0/
- Downloaded: 2026-11-10
- Files used: sheep.glb (800,000 triangles, 4K PBR)
- Origin disclosure (from upstream LICENSE.txt):
  Method: AI-assisted (contains AI-generated content).
  Base mesh and textures generated with an AI image-to-3D tool (Meshy),
  then cleaned up, scaled, textured and checked in Blender.
- Local copy of the upstream licence and manifest:
  tools/mob-source/vendor/grab3d-sheep/LICENSE.txt
  tools/mob-source/vendor/grab3d-sheep/manifest.json

## What we changed

Decimated to a game budget by voxel remesh, Y-up / +Z facing, hooves
planted at y = 0, scaled to 1 m tall, rigged with Root / Body / Head /
Muzzle / ears / tail / legs, walk and idle clips, and a 2K albedo
(cream rope-like fleece, charcoal face and legs). A short-fleece
sheared variant (sheep3s_2k.webp) is derived from that albedo: wool
flattened to stubble over pale skin, face / ears / legs kept dark.
The in-game material path for sheep3 keeps sRGB albedo (it does not
force LinearEncoding), uses MeshStandard with metalness 0, and does
not apply the old procedural glStyle skin. Baked clips play (noclip
is cleared) so C302 cannot call skeleton.pose() on this rig.

## Other candidates considered (not used)

- Existing sheep2.glb (player-supplied, licence not stated in the
  file): already a textured blackface/cream sheep, but a faceted
  ~2.3k-triangle hull with painted wool rather than sculpted clumps.
- Quaternius Sheep (CC0, Poly Pizza): the original sheep.glb in this
  repo; low-poly and blocky compared to the Grab3D remake.
- Kenney / other cube-style CC0 sheep: stylised, not a match.

Attribution is not required under CC0; this file is kept so the origin is
on the record.
