# v1.0.75 checklist (t512u-t516u). Verify on LIVE. Report times in UK time (GMT).
1. Reset world: show the Glencraft loading screen (glowing logo, "Resetting world..." text, no grass block) BEFORE the blocking generation starts (let it paint first), and hide it only once the new world has rendered. The player never sees a freeze or the old terrain.
2. Add a visible "Patch notes" button on the MAIN MENU under Play and Settings, in the blue style and controller-focusable. Settings/Info should also clearly have one.
3. Water and lava flow: use free, licensed, credited flow assets (ambientCG, Poly Haven, three.js flowmap water).
   - Water visibly flows, with animated normals, foam and reflections.
   - Lava visibly flows, with a glowing scrolling crust and emissive pulse.
   - Lag-free on the phone.
4. NO backup-save system (the user declined it). Instead, give the user's test world a "Bag of Everything": a container or chest-like bag item holding one stack of EVERY item and block in the game, placed in their inventory once on load (a one-time grant flag, so it isn't duplicated). Make it available on their current world, which the user calls their test world.
5. Update the patch notes.
