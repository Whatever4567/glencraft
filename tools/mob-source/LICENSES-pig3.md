# pig3 source licences

pig3 is a game-ready remake derived from a third-party base mesh.
It is unpublished work on feature/v1.2.6x-mobs.

## Base mesh and original textures

- Title: Pig (high-detail domestic pig)
- Source: https://grab3d.com/models/animals/pig/
- Author / publisher: Grab3D (Germany)
- Licence: CC0 1.0 Universal (public domain dedication)
  https://creativecommons.org/publicdomain/zero/1.0/
- Downloaded: 2026-11-10
- Files used: pig.glb (255,506 triangles, 4K PBR)
- Origin disclosure (from upstream LICENSE.txt):
  Method: AI-assisted (contains AI-generated content).
  Base mesh and textures generated with an AI image-to-3D tool (Meshy),
  then cleaned up, scaled, textured and checked in Blender.
- Local copy of the upstream licence and manifest:
  tools/mob-source/vendor/grab3d-pig/LICENSE.txt
  tools/mob-source/vendor/grab3d-pig/manifest.json

## What we changed

Decimated to a game budget, Y-up / +Z facing (already correct in the
source), hooves planted at y = 0, scaled to 1 m tall, rigged with Root /
Body / Head / Snout / ears / tail / legs, walk and idle clips, and a
warm-pink 2K albedo (sparse bristles, darker creases, deeper nostrils).
The in-game material path for pig3 keeps sRGB albedo (it does not force
LinearEncoding), uses MeshStandard with metalness 0, and does not apply
the old procedural glStyle skin.

## Other candidates considered (not used)

- Quaternius Farm Animal Pack pig (CC0, Poly Pizza / OpenGameArt, 2018/2021):
  correct proportions, but 562 triangles and heavily faceted.
- Quaternius 2023 "Pig" on Poly Pizza (CC0): voxel / block style, not a match.
- Kenney Cube Pets Animal Pig (CC0): cubic stylised pet, not a match.
- Innerscene farm-pig (CC0, https://www.innerscene.com/tools/library/3d-parts/farm-pig-85281eb9):
  real-scale farm pig, but a simpler toy-like mesh with a neck seam.
- Poly by Google pigs (CC-BY 3.0): low-poly faceted, less close than Grab3D.

Attribution is not required under CC0; this file is kept so the origin is
on the record.
