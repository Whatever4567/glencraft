# v1.0.84 (add to the desert music fix)
1. Temple paintings clip into the walls: put each frame flush on the room-facing wall surface (offset about 0.03), facing into the room, on solid wall only.
2. No mobs spawn inside the temple/pyramid (creepers keep spawning). Make a no-spawn zone over the interior bounds for natural spawns and spawners. The Egyptians stay.
3. Reset world: the user still sees the floating and the world disappearing BEFORE the loading screen. Show the full-screen Glencraft loading screen FIRST: draw it and wait for 2 animation frames before touching the world. Only then tear down and regenerate. Add a progress bar with a percentage (chunks generated / total) that updates as it goes (yield between chunks with await/setTimeout so it can repaint). Lift the screen only once the world is drawn.
4. After a reset the player keeps their position: respawn at the same x/z, at a safe y (top solid block +1), not at world spawn. Inventory is kept as before.
5. Patch notes for all.
6. Egyptians sometimes disappear: they must ALWAYS be there. Exclude them from despawn and distance or mob-cap culling, save them with the world, respawn any missing ones at the pyramid on load or chunk reload, and keep them from wandering off or dying to the environment.
