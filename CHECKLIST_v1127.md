# v1.1.27 Space rebuild (t649u). Take time, get it right, test thoroughly.
The user says the current space is a buggy mess: the character model spazzes out, Earth still can't be seen at all, and falling off the edge is a fake transition.
New layout, as one continuous sandbox simulation:
- Space = a huge black box (deep space with stars) about 10x bigger than the Earth map in each horizontal dimension, containing Earth, the Moon and Mars.
- Earth = the actual voxel map (same chunks, same world), a floating slab sitting inside the box. NO separate LOD trick that fails; it must be clearly visible from anywhere in space (far chunk rendering or a reliable mesh of the real terrain, ice-wall rim, sides, underside).
- Walking off the edge: you just physically fall past the edge, down the side of the slab, into the box. No transition, swap or teleport.
- Gravity: KEEP normal downward gravity everywhere in space for now (no planet-relative gravity, no zero-G). Land on top of things.
- The Moon and Mars are scaled up much bigger (since the box is huge), real breakable voxels with the new Moon/Mars blocks, floating in the box, landable from above.
- Fix the character model spazzing/jitter: the root cause is float precision or a camera/body fight; use a floating origin or rebase correctly, and make sure the first-person body is hidden.
- Keep: the teleport menu (Earth/Moon/Mars), the UFO and jetpack working in the box, and the Reset world fix from v1.1.26.
- Phone performance must stay OK (far chunks as low-detail meshes).
Verify: from many positions in the box Earth is visible; walk off the edge and fall; land on the Moon/Mars; no jitter at far distances; Reset world works.
- (t650u) The box has a solid roof at about Y 10000; the player can fly up to it and the coordinates HUD shows the true Y (up to ~10000). The floor and walls are box bounds too.
- (t651u) The box floor is at Y -10000, so the space box spans Y -10000 to +10000 with Earth floating in the middle; the player can fly or fall below Earth and see its underside. Planets can be placed above and below.
- (t652u) FINAL box size: -10000 to +10000 on ALL of X, Y and Z (a cube), with the Earth map box centred inside it. The HUD coordinates show the true values.
- (t653u) The box walls, roof and floor are solid unbreakable black blocks (a barrier the player collides with), with a starfield rendered inside so it reads as deep space.
- (t654u) Bugs seen in old space to make sure are gone: the map frozen or stuck on screen (a stale render/chunk image) and placed blocks rendering neon green (a missing texture/material for the new IDs or a broken lighting value out there). Test placing every block type in space and on the planets.
- (t655u) Remove ALL bedrock and floor/edge barriers on Earth (the bedrock layer becomes normal deep stone/breakable, no invisible floor, no edge clamp). The player can dig through the bottom of Earth or walk off the sides and fall into the space box. Only the outer black box walls are barriers. Make sure Hell/Agartha/caves still work.
