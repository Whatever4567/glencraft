# TOP PRIORITY before or with v1.1.36
1. (t690u) The user REJECTS the cube planets from v1.1.35: "planets should be like a sphere with dynamic moving around". Revert to round spheres (Earth, Moon, Mars) with smooth radial gravity, so the player stays upright and the ground turns continuously all the way round. Fix the old 45-degree staircase and tilt: put ramp shapes on all surface steps (c327), make the collision follow the radius smoothly, and have the camera's up direction follow the smoothed radial normal. Locally it should feel like flat ground, with no flips, no staircase and no clipping. Keep G (the real-world map), digging and the other v1.1.35 fixes.
2. (t691u) Remove the UFO takeoff and boom sound entirely, at any distance.
Ship fast.
3. (t692u) REMOVE the curved grass and auto-ramps on the terrain (c327 surface ramps). The user says it looks dumb, so keep the ground as plain cube blocks. (Corner stair ramps placed by the player can stay unless they're what looks bad; remove the auto surface ramps for sure.) Smooth walking on the spheres must come from collision and camera smoothing, not visible ramp meshes.
4. (t692u) The new land (the real-world continents) glitches the player through the floor. Fix it: chunks must be generated with collision before the player can fall into them, on load, teleport and arrival from space, with no fall-through. Test landing on and walking across several continents.
5. (t693u) "Just remove those ramps basically": remove ALL ramps, both the auto surface ramps (c327) AND the corner stair ramps from v1.1.33 (item B). Go back to normal blocks and normal stairs.
6. (t696u) The Earth interior must look like ref/inner_earth_layers.jpg (reference only, do NOT commit). Layers over the R=5000 radius, scaled from the surface down:
   1. surface;
   2. shallow caverns (limestone and stone caves, underground rivers, mineshafts);
   3. mid-depth lush caves (moss, dripstone, glow berries, aquifers);
   4. deep dark (deepslate, sculk, blue glowing bits, ancient-city ruins);
   5. magma and basalt caverns (lava seas, lava falls, basalt columns);
   6. molten depths with purple amethyst crystal fields;
   7. abyssal core shell (purple glowing minerals);
   8. a glowing orange core at the centre.
   Each layer has big open cavern bands with procedural caves you can explore. Blend this with the hollow Earth and Agartha plan: the cavern cities and Agartha sit in the cavern bands, and the inner sun/core sits at the centre. Keep it cheap on phones and fully diggable.
7. (t697u) More interior references: ref/inner_earth_2.jpg and ref/inner_earth_3.jpg (reference only, do NOT commit). Add structures to the layers:
   - village ruins and a skull carving in the shallow caverns;
   - giant mushrooms and overgrown ruins in the lush caves;
   - dark ancient-city towers with lit windows in the deep dark;
   - gothic blackstone cathedral cities with bridges over lava rivers, plus lavafalls, in the magma layer;
   - amethyst and blue crystal clusters on the cavern walls;
   - a giant glowing EYE structure (an orange iris with a green pupil) at the core, with gold steps leading up to it.
   Generate the structures procedurally per region, and keep them light on phones.
