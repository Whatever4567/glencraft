# Glencraft Original Soundtrack

Working title: **Glencraft — Original Soundtrack**
Artist: original score composed and produced for Glencraft (no third-party songs, vocals, or copyrighted samples; recorded instruments are only from the CC0 / MIT libraries in LICENSES.md).
Scope: a full in-game album on the scale of Minecraft's early volumes (about 30–34 tracks), shipped in batches of about eight. The existing Classic soundtrack, Calm beds, and Happy Hardcore remix stay untouched. This album is a new opt-in soundtrack mode.

Tuning of the score:
- A shared highland leitmotif (the "Glen theme") returns in every piece, re-harmonised per place.
- Scottish colour: tin whistle, low whistle, fiddle, Celtic harp, bagpipe drones, bodhran. No piano-led writing. Piano is avoided entirely in batch 1 and reserved, if ever, as a background colour in later calm overworld pieces only.
- Crystal caves and Agartha are beatless ethereal liminal ambient: choir pad, glassy bells, deep drone, cavernous reverb, minor or modal.
- Energetic / hardcore album sides (batch 5) follow UK happy hardcore / bounce: 165 BPM, punchy kick, off-beat FM donk, and original WORLD-sung hooks (new lyrics and melodies, not the live remix). They live in an opt-in bounce pool and do not replace the live remix file. Drops are section-matched to about −9 LUFS; 8-bar similarity stays below 0.85.
- Space, Moon and Mars stay weightless and thin. Volcanoes are dark and slow, not dance music. Night is watchful. Combat (`claymore`) is a tense written-percussion bed, not happy hardcore. The pop-star cue (`starlight_show`) is original dance-pop and must not replace her diegetic song.

Playback (Album mode):
- Per-context playlists, random rotation, no immediate repeat when a pool has more than one track.
- Silence gaps after a piece, in the spirit of Minecraft (about 45–180 s in the world; shorter on the title screen; combat may interrupt).
- Lazy-loaded Ogg Vorbis (about 96–128 kbps) with an MP3 fallback.
- Missing contexts fall back along a sensible chain (for example loch → day, purple cave → blue cave, Mars → Moon). Batch 2 fills purple, snow, desert, Mars, space and underwater, and adds second day and night cues. Batch 3 adds pine/owl companions, a warmer Agartha cue, hell/void, creative, combat, the pop-star dance-pop cue, and a credits reprise, plus detectContext hooks for combat, near the pop star, and credits. Batch 4 adds further day/night and highlands cues, an older Agartha memory, a boss cue, and crystal-cave combat, plus biome hooks for moor, high and pine. Batch 5 adds four original 165 BPM UK-bounce album sides (they do not replace the live Happy Hardcore remix).

Status key: **B1** / **B2** / **B3** / **B4** / **B5** = shipped on this branch.

## Tracklist

| # | Filename | Title | Context | Length target | Batch | Notes |
|---:|---|---|---|---|---|---|
| 1 | `the_glen_opens` | The Glen Opens | Menu / title | 2:40 | **B1** | States the Glen theme on harp and whistle. |
| 2 | `heather_road` | Heather Road | Overworld day | 3:10 | **B1** | Walking piece; whistle, harp, fiddle, soft bodhran. Warmer low end and a bigger lift_two. |
| 3 | `drove_road` | Drove Road | Overworld day | 3:00 | **B2** | Brisker step, more bodhran. |
| 4 | `pine_shelter` | Pine Shelter | Overworld day | 3:06 | **B3** | Closer, wooded, quieter lead. E mixolydian. |
| 5 | `moor_light` | Moor Light | Overworld day / moor | 3:12 | **B4** | Open and airy; highlands moor. Bb mixolydian. |
| 6 | `midday_glen` | Midday Glen | Overworld day | 3:13 | **B4** | Brighter noon colour of the Glen theme. A ionian. |
| 7 | `bothy_smoke` | Bothy Smoke | Overworld day | 3:14 | **B4** | Warmer, indoor-adjacent pastoral. F mixolydian. |
| 8 | `watcher_on_the_ridge` | Watcher on the Ridge | Overworld night | 3:10 | **B1** | E aeolian, sparse low whistle. |
| 9 | `peat_fire` | Peat Fire | Overworld night | 3:00 | **B2** | Closer, glowing, slow drone. |
| 10 | `owl_hour` | Owl Hour | Overworld night | 3:20 | **B3** | Very sparse, wide night air. B aeolian. |
| 11 | `northern_quiet` | Northern Quiet | Overworld night | 3:16 | **B4** | Cold high ridge, almost still. Eb aeolian. |
| 12 | `still_water` | Still Water | Highlands / lochs | 3:20 | **B1** | Harp, long delays, water-like air. |
| 13 | `ridge_wind` | Ridge Wind | Highlands / high biome | 3:11 | **B4** | Dedicated high-country cue. D lydian. |
| 14 | `white_pass` | White Pass | Snow | 3:10 | **B2** | Hushed, icy, soft choir air. |
| 15 | `long_sand` | Long Sand | Desert | 3:00 | **B2** | Dry, open, slow modal guitar-like harp. |
| 16 | `ash_line` | Ash Line | Volcano | 3:00 | **B1** | Low drones, distant booms, no dance pulse. |
| 17 | `blue_vault` | Blue Vault | Crystal cave (blue) | 3:30 | **B1** | Beatless liminal choir, glass bells, drone. |
| 18 | `purple_chamber` | Purple Chamber | Crystal cave (purple) | 3:30 | **B2** | Darker sibling of Blue Vault. Beatless. |
| 19 | `choir_of_the_hollow` | Choir of the Hollow | Agartha | 3:45 | **B1** | Big breathy choir, deep drone, few bells. |
| 20 | `inner_sun` | Inner Sun | Agartha | 3:36 | **B3** | Warmer Agarthan light through stone. F lydian, beatless. |
| 21 | `stone_memory` | Stone Memory | Agartha | 3:40 | **B4** | Older, more hollow, almost liturgical. Beatless. |
| 22 | `below_the_map` | Below the Map | Deep dark / void / hell cave | 3:30 | **B3** | Lowest, least human, still beatless. |
| 23 | `silver_sea` | Silver Sea | Moon | 3:00 | **B1** | Weightless, thin, high bells, wide space. |
| 24 | `red_horizon` | Red Horizon | Mars | 3:10 | **B2** | Drier, rust-coloured, slow winds. |
| 25 | `between_worlds` | Between Worlds | Deep space | 3:20 | **B2** | Almost empty, long tones, vacuum quiet. |
| 26 | `claymore` | Claymore | Combat | 3:02 | **B3** | Tense written percussion, not hardcore. D aeolian. |
| 27 | `boss_of_the_glen` | Boss of the Glen | Boss (Ember Wyrm) | 3:45 | **B4** | Heavier percussion, Glen motif in the bass, filled mids and presence, quiet aftermath. E phrygian. |
| 28 | `crystal_hunt` | Crystal Hunt | Cave combat | 3:10 | **B4** | Liminal colours under a written pulse, not hardcore, with more low end and presence. C# dorian. |
| 29 | `starlight_show` | Starlight Show | Giant pop star | 3:17 | **B3** | Original dance-pop cue with a WORLD-sung hook and a dramatic drop; not her diegetic song. Duck or skip if her song is playing. |
| 30 | `open_sketch` | Open Sketch | Creative mode | 3:12 | **B3** | Lighter, more open day variant. C mixolydian. |
| 31 | `down_among_the_reeds` | Down Among the Reeds | Underwater | 3:00 | **B2** | Muffled harp, bubbling air, slow choir. |
| 32 | `last_light` | Last Light | Credits | 3:15 | **B3** | Full Glen-theme reprise, then thin-out. |
| 33 | `bounce_the_glen` | Bounce the Glen | Album hardcore side | 3:18 | **B5** | Original 165 BPM UK bounce, E dorian. Does not replace the remix. |
| 34 | `nightcore_loch` | Nightcore Loch | Album hardcore side | 3:18 | **B5** | Night-coloured sibling, F# aeolian, drop 2 lifts +3. Does not replace the remix. |
| 35 | `cairn_flash` | Cairn Flash | Album hardcore side | 3:24 | **B5** | Brighter festival side, B dorian, 4-bar harmonic motion. Does not replace the remix. |
| 36 | `till_the_hills` | Till the Hills | Album hardcore side | 3:35 | **B5** | Emotive folk-EDM build into bounce drops, A dorian, 4-bar harmonic motion. Does not replace the remix. |

The live Happy Hardcore remix (`music/hardcore_remix.ogg` / `.mp3`) remains the Happy Hardcore mode's loop and is not part of this album's file set.

## Playlist wiring (batches 1–5)

| Context | Pool | Fallback if empty / later |
|---|---|---|
| menu, title, paused on menu | `the_glen_opens` | — |
| overworld day | `heather_road`, `drove_road`, `pine_shelter`, `midday_glen`, `bothy_smoke` | — |
| loch, water's edge | `still_water` | day |
| overworld night | `watcher_on_the_ridge`, `peat_fire`, `owl_hour`, `northern_quiet` | day |
| volcano (near `__c229.at`) | `ash_line` | day |
| blue crystal cave | `blue_vault` | cave1 / day |
| purple crystal cave | `purple_chamber` | `blue_vault` |
| Agartha | `choir_of_the_hollow`, `inner_sun`, `stone_memory` | `blue_vault` |
| Moon | `silver_sea` | space |
| Mars | `red_horizon` | `silver_sea` |
| deep space | `between_worlds` | `silver_sea` |
| snow | `white_pass` | night |
| desert | `long_sand` | day |
| underwater | `down_among_the_reeds` | loch |
| hell / void / deep dark | `below_the_map` | volcano |
| creative mode | `open_sketch` | day |
| moor biome (day) | `moor_light` | day |
| high / ridge biome (day) | `ridge_wind` | day |
| pine biome (day) | `pine_shelter` | day |
| combat (nearby hostile, aggro or within 8 blocks; not the pop star) | `claymore` | volcano |
| crystal-cave / Agartha combat | `crystal_hunt` | combat |
| boss (Ember Wyrm / `kind === 'dragon'` or `boss === true`, within 56 blocks) | `boss_of_the_glen` | combat |
| near the giant pop star | `starlight_show` | day. Duck or skip while `__v1251.songOn`. |
| credits (`__creditsOpen`, `#credits`, or a credits roll element) | `last_light` | menu |
| album hardcore sides (opt-in: `__v126x.bounce`, `__albumBounce`, or `#bounce`; never auto-mixed into day/night) | `bounce_the_glen`, `nightcore_loch`, `cairn_flash`, `till_the_hills` | day |

## Production notes

- Rendered at 44.1 kHz stereo, mastered to about −16 to −14 LUFS for calm / scenic tracks (true peak ≤ −1 dB). Energetic hardcore album sides aim near −9 to −10 LUFS, with quieter intros and breakdowns so the drops stay festive without flattening the dynamic range.
- Each piece is arranged in sections with motif development, then crossfaded so the loop is seamless.
- Sources and renderers live in `tools/audio-source/` (`album_lib.py`, `album_cinema.py`, `render-album-batch1.py`, `render-album-batch2.py`, `render-album-batch3.py`, `render-album-batch4.py`, `render-album-batch5.py`) and the in-game player in `tools/content-source/v126x-album.js`.
