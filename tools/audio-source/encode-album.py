#!/usr/bin/env python3
"""Encode album WAVs to 128 kbps OGG + MP3, 30s previews, and spectrograms."""
from __future__ import annotations
import subprocess, sys
from pathlib import Path

QA = Path("/workspace/qa/album")
WAV, PREV, SPEC = QA / "wav", QA / "previews", QA / "spectrograms"
MUSIC = Path("/workspace/gc-album/music/album")
MUSIC.mkdir(parents=True, exist_ok=True)
PREV.mkdir(parents=True, exist_ok=True)
SPEC.mkdir(parents=True, exist_ok=True)

def run(cmd):
    subprocess.run(cmd, check=True)

names = sys.argv[1:] or sorted(p.stem for p in WAV.glob("*.wav"))
for name in names:
    src = WAV / f"{name}.wav"
    ogg = MUSIC / f"{name}.ogg"
    mp3 = MUSIC / f"{name}.mp3"
    print("encode", name, flush=True)
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-c:a", "libvorbis", "-b:a", "128k", "-ar", "44100", "-ac", "2", str(ogg)])
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", "-ac", "2", str(mp3)])
    # 30s preview from a mid-piece section (not just the fade-in)
    run(["ffmpeg", "-y", "-v", "error", "-ss", "45", "-t", "30", "-i", str(src),
         "-c:a", "libmp3lame", "-b:a", "160k", "-ar", "44100", str(PREV / f"{name}-30s.mp3")])
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src),
         "-lavfi", "showspectrumpic=s=1280x512:mode=combined:legend=1:color=intensity",
         str(SPEC / f"{name}.png")])
    print("  ogg", ogg.stat().st_size, "mp3", mp3.stat().st_size, flush=True)
print("encode done")
