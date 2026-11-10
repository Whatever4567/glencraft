# Glencraft Original Soundtrack

Working title: **Glencraft — Original Soundtrack**
Artist: original score composed and produced for Glencraft (no third-party songs, vocals, or samples).
Scope: a full in-game album on the scale of Minecraft's early volumes (about 30–34 tracks), shipped in batches of about eight. The existing Classic soundtrack, Calm beds, and Happy Hardcore remix stay untouched. This album is a new opt-in soundtrack mode.

Tuning of the score:
- A shared highland leitmotif (the "Glen theme") returns in every piece, re-harmonised per place.
- Scottish colour: tin whistle, low whistle, fiddle, Celtic harp, bagpipe drones, bodhran. No piano-led writing. Piano is avoided entirely in batch 1 and reserved, if ever, as a background colour in later calm overworld pieces only.
- Crystal caves and Agartha are beatless ethereal liminal ambient: choir pad, glassy bells, deep drone, cavernous reverb, minor or modal.
- Energetic / hardcore album tracks (later batches) follow UK happy hardcore / bounce: 165 BPM, punchy kick, off-beat FM donk, pitched-up original vocal hooks. The live remix file is not replaced.
- Space, Moon and Mars stay weightless and thin. Volcanoes are dark and slow, not dance music. Night is watchful. Combat is reserved for later batches.

Playback (Album mode):
- Per-context playlists, random rotation, no immediate repeat when a pool has more than one track.
- Silence gaps after a piece, in the spirit of Minecraft (about 45–180 s in the world; shorter on the title screen; combat may interrupt).
- Lazy-loaded Ogg Vorbis (about 96–128 kbps) with an MP3 fallback.
- Missing contexts fall back along a sensible chain (for example loch → day, purple cave → blue cave, Mars → Moon) until later batches fill them.

Status key: **B1** = batch 1 (this branch), later = planned.

## Tracklist

| # | Filename | Title | Context | Length target | Batch | Notes |
|---:|---|---|---|---|---|---|
| 1 | `the_glen_opens` | The Glen Opens | Menu / title | 2:40 | **B1** | States the Glen theme on harp and whistle. |
| 2 | `heather_road` | Heather Road | Overworld day | 3:10 | **B1** | Walking piece; whistle, harp, fiddle, soft bodhran. |
| 3 | `drove_road` | Drove Road | Overworld day | 3:00 | later | Brisker step, more bodhran. |
| 4 | `pine_shelter` | Pine Shelter | Overworld day | 2:50 | later | Closer, wooded, quieter lead. |
| 5 | `moor_light` | Moor Light | Overworld day | 3:00 | later | Open and airy; highlands moor. |
| 6 | `midday_glen` | Midday Glen | Overworld day | 2:50 | later | Brighter noon colour of the theme. |
| 7 | `bothy_smoke` | Bothy Smoke | Overworld day | 3:00 | later | Warmer, indoor-adjacent pastoral. |
| 8 | `watcher_on_the_ridge` | Watcher on the Ridge | Overworld night | 3:10 | **B1** | E aeolian, sparse low whistle. |
| 9 | `peat_fire` | Peat Fire | Overworld night | 3:00 | later | Closer, glowing, slow drone. |
| 10 | `owl_hour` | Owl Hour | Overworld night | 2:50 | later | Very sparse, wide night air. |
| 11 | `northern_quiet` | Northern Quiet | Overworld night | 3:20 | later | Cold high ridge, almost still. |
| 12 | `still_water` | Still Water | Highlands / lochs | 3:20 | **B1** | Harp, long delays, water-like air. |
| 13 | `ridge_wind` | Ridge Wind | Highlands | 3:00 | later | Dedicated high-country cue. |
| 14 | `white_pass` | White Pass | Snow | 3:10 | later | Hushed, icy, soft choir air. |
| 15 | `long_sand` | Long Sand | Desert | 3:00 | later | Dry, open, slow modal guitar-like harp. |
| 16 | `ash_line` | Ash Line | Volcano | 3:00 | **B1** | Low drones, distant booms, no dance pulse. |
| 17 | `blue_vault` | Blue Vault | Crystal cave (blue) | 3:30 | **B1** | Beatless liminal choir, glass bells, drone. |
| 18 | `purple_chamber` | Purple Chamber | Crystal cave (purple) | 3:30 | later | Darker sibling of Blue Vault. |
| 19 | `choir_of_the_hollow` | Choir of the Hollow | Agartha | 3:45 | **B1** | Big breathy choir, deep drone, few bells. |
| 20 | `inner_sun` | Inner Sun | Agartha | 3:20 | later | Warmer Agarthan light through stone. |
| 21 | `stone_memory` | Stone Memory | Agartha | 3:40 | later | Older, more hollow, almost liturgical. |
| 22 | `below_the_map` | Below the Map | Deep dark / void / hell cave | 3:20 | later | Lowest, least human, still beatless. |
| 23 | `silver_sea` | Silver Sea | Moon | 3:00 | **B1** | Weightless, thin, high bells, wide space. |
| 24 | `red_horizon` | Red Horizon | Mars | 3:10 | later | Drier, rust-coloured, slow winds. |
| 25 | `between_worlds` | Between Worlds | Deep space | 3:20 | later | Almost empty, long tones, vacuum quiet. |
| 26 | `claymore` | Claymore | Combat | 2:40 | later | Tense rhythmic bed, not hardcore. |
| 27 | `boss_of_the_glen` | Boss of the Glen | Boss | 3:00 | later | Heavier percussion, motif in the bass. |
| 28 | `crystal_hunt` | Crystal Hunt | Cave combat | 2:40 | later | Liminal colours under a pulse. |
| 29 | `starlight_show` | Starlight Show | Giant pop star | 3:00 | later | Original glitter-pop cue; not her diegetic song. |
| 30 | `open_sketch` | Open Sketch | Creative mode | 3:10 | later | Lighter, more open day variant. |
| 31 | `down_among_the_reeds` | Down Among the Reeds | Underwater | 3:00 | later | Muffled harp, bubbling air, slow choir. |
| 32 | `last_light` | Last Light | Credits | 3:20 | later | Full theme reprise, then thin-out. |
| 33 | `bounce_the_glen` | Bounce the Glen | Hardcore (overworld) | 3:20 | later | Original 165 BPM UK bounce; does not replace the remix. |
| 34 | `nightcore_loch` | Nightcore Loch | Hardcore (night / drop) | 3:00 | later | Night-coloured hardcore sibling. |

The live Happy Hardcore remix (`music/hardcore_remix.ogg` / `.mp3`) remains the Happy Hardcore mode's loop and is not part of this album's file set.

## Batch 1 playlist wiring

| Context | Pool (batch 1) | Fallback if empty / later |
|---|---|---|
| menu, title, paused on menu | `the_glen_opens` | — |
| overworld day, moor, pine, creative (until Open Sketch) | `heather_road` | — |
| loch, water's edge | `still_water` | day |
| overworld night | `watcher_on_the_ridge` | day |
| volcano (near `__c229.at`) | `ash_line` | day |
| blue crystal cave | `blue_vault` | cave1 / day |
| purple crystal cave | (later) | `blue_vault` |
| Agartha | `choir_of_the_hollow` | `blue_vault` |
| Moon | `silver_sea` | space |
| Mars, deep space | (later) | `silver_sea` |
| snow, desert, underwater, combat, pop star, credits, hell/void | (later) | nearest cousin (night, day, blue, agartha) |

## Production notes

- Rendered at 44.1 kHz stereo, mastered to about −16 to −14 LUFS for calm / scenic tracks (true peak ≤ −1 dB). Later energetic hardcore album tracks aim near −9 LUFS.
- Each piece is arranged in sections with motif development, then crossfaded so the loop is seamless.
- Sources and renderers live in `tools/audio-source/` (`album_instruments.py`, `render-album-batch1.py`) and the in-game player in `tools/content-source/v126x-album.js`.
