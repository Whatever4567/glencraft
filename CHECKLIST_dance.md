# Dance fix (user t517u) - add to the current release
Re-keyframe the Egyptian LT dance from this breakdown of the reference clip (about 97 BPM, one pose per second, with in-betweens at half beats).
Skip the rage, lunge and TikTok outro (stop at 0:32).
0-1.5 hands clasped at chest | 2 both forearms horizontal at chest, left over right | 3 R forearm up, L angled down | 4 mirror of 3
5 diamond: hands meet in front of the face | 6 L-shape: R forearm up, L horizontal touching R elbow, head left | 7 mirror of 6
8 hands flat on top of the head | 9 OK-circles over both eyes | 10 L-shape: L up | 11 eye circles | 12 L-shape: R up | 13 eye circles
14-17.5 flute at the mouth with wiggling fingers, head sway right, left, left | 18 R arm thrust forward, L across chest | 19 both forearms up framing the face
20 L-shape: R up | 21 diamond | 22-26.5 palms cover the face, head swaying | 27, 28, 29 hands thrown open beside the head (snap back between)
30 paw hands at chest, head tilted | 31-32 R index finger points at the camera twice.
Music: the clip is Super Mario 64's desert theme (Nintendo, copyrighted), so do NOT use it or copy its melody.
Write an ORIGINAL procedural desert/arabesque tune in a similar mood (Phrygian-dominant scale, flute lead, hand drums, about 97 BPM) to replace the current dance music.
Patch notes: "Dance moves redone to match the video; new desert dance music."

## Updates (t518u / t519u)
- Music: HOLD. The user is sending their own dance music plus a new Egyptian track for entering the temple biome. Wire in placeholders now and swap them when the files arrive.
- BUG: during the dance no dance music plays and the terrain music keeps going. Fix it so the dance music plays (3D, from the group) and the biome/terrain music ducks or pauses for the whole dance, then resumes.

## Music arrived (t520u)
- Temple biome music: /cursor/stores/store-6b099320-889b-4c23-9eca-54f85c129a7b/grok-bot/agents/146d0e47-1004-4f9b-a662-3b480f6050c9/attachments/01M6BD3TRC9PSH4H5EH5EZ6JZE.mp3. Extend it into a longer seamless loop that plays when entering the temple/Egyptian biome.
- Dance music: /cursor/stores/store-6b099320-889b-4c23-9eca-54f85c129a7b/grok-bot/agents/146d0e47-1004-4f9b-a662-3b480f6050c9/attachments/01M6BD3XYNGVQKJP54WXBPC77Z.mp3. Cut out the TikTok sound/outro and the rage/scream.
- Licensing: listen or compare first. If either file is Nintendo/Super Mario 64 or other clearly third-party copyrighted music, do NOT commit it. Make a close-sounding ORIGINAL procedural arrangement instead (same mood and tempo, not the melody) and say so in the report. Commit only audio that is free-licensed or the user's own (credit it in CREDITS.md). Keep files small (mp3/ogg under 1 MB).
- Also add a Settings option, "Custom dance music": the user picks an audio file from their phone and it's stored locally (IndexedDB) and used for the dance instead of the built-in tune. Never upload it. This lets them test with their own file.
