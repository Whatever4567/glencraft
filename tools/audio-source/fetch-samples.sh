#!/usr/bin/env bash
# Fetch the permissively licensed sample libraries used by the album renderer.
# See LICENSES.md. Raw libraries stay out of git.
set -euo pipefail
DEST="${GLENCRAFT_SAMPLE_LIB:-/workspace/qa/album/samples}"
mkdir -p "$DEST"

if [[ ! -f "$DEST/FluidR3_GM.sf2" ]]; then
  echo "Downloading FluidR3_GM.sf2 (MIT)…"
  curl -L --fail --retry 3 -o "$DEST/FluidR3_GM.sf2"     "https://github.com/pianobooster/fluid-soundfont/releases/download/v3.1/FluidR3_GM.sf2"
else
  echo "FluidR3_GM.sf2 already present"
fi

if [[ ! -f "$DEST/VSCO-2-CE/Harp.sfz" ]]; then
  echo "Cloning VSCO-2-CE (CC0, SFZ branch, sparse)…"
  rm -rf "$DEST/VSCO-2-CE"
  git clone --depth 1 --branch SFZ --filter=blob:none --sparse     https://github.com/sgossner/VSCO-2-CE.git "$DEST/VSCO-2-CE"
  git -C "$DEST/VSCO-2-CE" sparse-checkout set --cone     Strings Woodwinds Brass Percussion "VSCO 1 Percussion"
  git -C "$DEST/VSCO-2-CE" checkout HEAD --     LICENSE README.md Readme.txt "How To Install.txt" "*.sfz" "*.ariax" .gitignore || true
else
  echo "VSCO-2-CE already present"
fi

echo "VSCO HEAD: $(git -C "$DEST/VSCO-2-CE" rev-parse HEAD 2>/dev/null || echo unknown)"
ls -lh "$DEST/FluidR3_GM.sf2"
du -sh "$DEST/VSCO-2-CE"
