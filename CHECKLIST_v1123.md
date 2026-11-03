# v1.1.23 (t639u, t640u, t641u)
1. Original haggis matching the new pig/sheep style (NOT from the rip zip)
2. Pig/sheep textures upscaled to 4K, compressed, phone-friendly (2K on mobile)
3. UFO in space: smooth damped flight, no jitter
4. Moon/Mars: the player is always upright relative to the planet normal; the block face under you becomes the floor as you walk round; gravity toward the centre; no drifting off
5. Remove the hidden Y limit and the glitch (floating origin); the first-person UFO cockpit view through a clear window, with the player body hidden
6. Space is continuous above the mainland; planets are real breakable/placeable voxels (test mining)
7. Earth from space is the real map terrain as LOD chunks with the ice-wall edges visible, not a PNG
8. Disable/remove non-landable planets for now (Sun stays as the light only)
Headless-verify, patch notes, push, verify live, plain report.
9. (t642u) Building on planets: placing blocks must work on the Moon/Mars with the planet-relative up axis. New discoverable blocks: Moon (moon regolith/dust, moon rock, moon cheese-free! basalt, rare "lunar crystal" ore deeper down) and Mars (red sand, mars stone, iron-rich oxide ore, rare "mars crystal"). Proper HD textures, inventory icons, and a few crafting uses (e.g. polished/brick variants). Planets generate with layered strata so digging down discovers them.
10. (t643u) From space/Moon the WHOLE flat world must be visible (bathtub shape, ice-wall rim) with no render-distance cutoff: far LOD mesh of the entire map that updates live (e.g. the volcano eruption, lava and particles are visible from the Moon, with an eruption glow/plume at LOD).
11. (t643u) Optional teleport: a menu or button to teleport to Earth spawn, the Moon surface and the Mars surface (the user asked for this; continuous flight still works too). Controller and touch accessible.
12. (t644u) Earth is a floating 3D slab: the sides and underside show real strata, and the tunnel and Agartha are visible as cutaways from outside (or via the LOD). Walking past the outer edge (beyond the ice extension) lets you fall off into space safely, with no void death; space physics take over and you can fly or teleport back.
13. (t645u) Jetpack flight straight up must reach real space: remove the fake space layer/ceiling entirely, so it's one continuous world and Earth shrinks below as you rise.
0. (t646u) URGENT, do first: Reset world instantly sends the player to the Backrooms. Fix Reset world (spawn at the mainland spawn, clear any saved dimension/position state) and REMOVE the Backrooms dimension entirely (code, triggers, portals, saved state); old saves that are inside the Backrooms get moved to spawn. Ship this fix immediately as its own hotfix if v1.1.24 isn't ready.
