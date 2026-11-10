# Sample-library licences (Glencraft Original Soundtrack)

Recorded instruments in Album mode are layered with the existing original
synthesis. Melodies, chords, lyrics and arrangements remain original
Glencraft writing. Raw sample libraries are **not** committed to this
repository (they are multi-gigabyte). Fetch them with
`tools/audio-source/fetch-samples.sh`, which writes to
`$GLENCRAFT_SAMPLE_LIB` or `/workspace/qa/album/samples` by default.

The game ships only the rendered OGG/MP3 masters under `music/album/`.
Those masters incorporate the libraries below, used within each licence.

---

## Used

### VS Chamber Orchestra: Community Edition (VSCO-2-CE)

- Source: https://github.com/sgossner/VSCO-2-CE (branch `SFZ`, commit `6dd651d55dde97fd4028699be9d4481f26917891`)
- Authors: Versilian Studios / Sam Gossner; recorded by Sam Gossner and
  Simon Dalzell (Ivy Audio); sample cutting by Elan Hickler / Soundemote.
- Homepage (as linked by the upstream README):
  http://vis.versilstudios.net/vsco-community.html
- Licence: **Creative Commons Zero 1.0 Universal (CC0-1.0)**. The upstream
  `LICENSE` file is the CC0 waiver. The accompanying `Readme.txt` additionally
  asks that the samples not be sold *as a sample library*, and encourages
  credit to Versilian Studios / Sam Gossner and/or Ivy Audio / Simon Dalzell,
  with a link to the VSCO: CE homepage. This project uses the samples only
  as performed instruments inside original musical works, does not
  redistribute the raw library, and gives that credit here and in
  `CREDITS.md`.
- Role in this score: orchestral string sections (violin, viola, cello,
  contrabass, including pizzicato / tremolo where called), solo violin,
  harp, flute and piccolo (layered under tin-whistle lines), French horn
  and trombone swells, concert bass drum, snares, tenor drums, timpani,
  cymbals, gong, glockenspiel and tubular bells, plus related percussion
  from the VSCO 1 percussion folder shipped with 1.1.0.

### Fluid (R3) General MIDI SoundFont (`FluidR3_GM.sf2`)

- Source used: the v3.1 GitHub release of
  https://github.com/pianobooster/fluid-soundfont
  (`FluidR3_GM.sf2`, 148,398,306 bytes, SHA-256 `74594e8f4250680adf590507a306655a299935343583256f3b722c48a1bc1cb0`). That project packages the files
  obtained from Ubuntu’s `fluid-soundfont` source
  (https://launchpad.net/ubuntu/+source/fluid-soundfont). We do not hotlink
  a personal hosting page.
- Copyright: Copyright (c) 2000-2002, 2008 Frank Wen
  <getfrank@gmail.com>. Copyright 2008 Toby Smithe (Debian/Ubuntu
  packaging acknowledgement, as published with the soundfont).
- Licence: **MIT License**. The text as published with the soundfont
  (and in Debian’s `fluid-soundfont` copyright file) is:

```
Copyright (c) 2000-2002, 2008 Frank Wen <getfrank@gmail.com>

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
```

- Role in this score: Ahh Choir and Ohh Voices (layered with the original
  synth choir), the GM Whistle (layered with VSCO flute/piccolo and the
  original tin-whistle synth), optional Space Voice in liminal beds,
  Fiddle colour, and Standard GM kit hats. The MIT notice is reproduced
  here and credited in `CREDITS.md`.
- Player: samples are extracted with the pure-Python `sf2utils` package
  and performed by `tools/audio-source/sample_player.py`. FluidSynth is
  **not** required and was not installed.

---

## Evaluated and not used

### Sonatina Symphonic Orchestra

- Commonly redistributed as CC Sampling Plus 1.0, which is **not** CC0
  and is a weaker, sample-specific licence with conditions that are a
  poor fit beside a CC0/MIT stack.
- Public discussion of the library also notes messy sample provenance
  (third-party sources folded in without a clean chain of title).
- Decision: **not used**. VSCO-2-CE covers the same orchestral chairs
  under CC0.

### GeneralUser GS (S. Christian Collins)

- The author permits unrestricted private and commercial *musical* use
  and asks for attribution, and asks that his personal download files
  not be hotlinked. He has also documented residual uncertainty about
  the origin of some constituent samples.
- Decision: **not used**. FluidR3_GM covers the GM roles we needed
  (choir, whistle, hats) under a plain MIT grant with the licence text
  shipped alongside the soundfont, without a hotlink restriction.

### 99Sounds free kits and Freesound CC0 drums

- 99Sounds kits are licensed **per kit**; some are free for commercial
  use, others are not, and each file would need its own recorded
  licence line.
- Freesound items are likewise licensed per sound (CC0, CC-BY, CC-BY-NC,
  etc.) and would be included only after a per-file check.
- Decision: **not used in this revision**. VSCO-2-CE already ships a
  CC0 concert bass drum (six velocity layers, two round-robins), snares,
  tenor drums, timpani, crashes, gongs and related sticks, which we
  layer with the original cinematic drum synths. No 99Sounds or
  Freesound file was copied into the sample tree or rendered into a
  master.

---

## What is committed

- This file, `fetch-samples.sh`, `sample_player.py`, `album_samples.py`,
  and the rendered Album-mode masters under `music/album/`.
- Not committed: the VSCO-2-CE tree, `FluidR3_GM.sf2`, or any other raw
  library. Re-render on a machine that has run `fetch-samples.sh`.
