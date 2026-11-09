#!/usr/bin/env python3
"""Render ~30 s preview clips of the Classic soundtrack and the Happy Hardcore remix."""
import math, os, struct, subprocess, sys, wave
from pathlib import Path

SR = 44100
OUT = Path(os.environ.get('OUT', '/workspace/qa/audio-1248'))
MUSIC = Path(os.environ.get('MUSIC', '/workspace/gc-release-1248/music'))
OUT.mkdir(parents=True, exist_ok=True)
BPM = 170
SPB = 60.0 / BPM

def write_wav(path, samples):
    samples = [max(-1.0, min(1.0, x)) for x in samples]
    with wave.open(str(path), 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(x * 32767)) for x in samples))

def ffmpeg_pcm(src, start, dur):
    p = subprocess.run([
        'ffmpeg', '-v', 'error', '-ss', str(start), '-t', str(dur), '-i', str(src),
        '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'
    ], stdout=subprocess.PIPE, check=True)
    import array
    a = array.array('f'); a.frombytes(p.stdout)
    return list(a)

def fade(x, i, n, inn=SR, out=SR * 2):
    if i < inn: x *= i / inn
    if i > n - out: x *= max(0, (n - i) / out)
    return x

# Classic: 30 s of the main theme, faded
classic_src = MUSIC / 'highland_mist.mp3'
classic = ffmpeg_pcm(classic_src, 8, 30)
n = len(classic)
classic = [fade(v * 0.9, i, n) for i, v in enumerate(classic)]
write_wav(OUT / 'music-classic.wav', classic)
print('wrote', OUT / 'music-classic.wav', '%.2fs' % (n / SR))

# Hardcore: 170 BPM drums + hoover + supersaw + piano + mixed classic slices
DUR = 30.0
N = int(SR * DUR)
out = [0.0] * N
# decode a few classic tracks for slices
slices = []
for name, start in [('highland_mist.mp3', 20), ('glen_dawn.mp3', 16), ('heather_air.mp3', 24)]:
    p = MUSIC / name
    if p.exists():
        try:
            slices.append(ffmpeg_pcm(p, start, 12))
        except Exception as e:
            print('slice fail', name, e)

def env(t, a, d):
    if t < 0: return 0
    if t < a: return t / a
    return math.exp(-3.0 * (t - a) / max(1e-4, d))

def osc(t, f, typ='sine'):
    ph = 2 * math.pi * f * t
    if typ == 'sine': return math.sin(ph)
    if typ == 'tri':
        x = (t * f) % 1.0
        return 4 * x - 1 if x < 0.5 else 3 - 4 * x
    # saw
    return 2 * ((t * f) % 1.0) - 1

CHORDS = [
    [146.83, 185.00, 220.00, 293.66],
    [220.00, 277.18, 329.63, 440.00],
    [123.47, 185.00, 246.94, 293.66],
    [196.00, 246.94, 293.66, 392.00],
]
BASS = [73.42, 110.00, 61.74, 98.00]
HOOK = [293.66, 329.63, 369.99, 440.00, 392.00, 369.99, 329.63, 293.66]

import random
random.seed(48)

def add(i, v):
    if 0 <= i < N:
        out[i] += v

beats = int(DUR / SPB) + 2
# pre-render some noise for hats/claps
noise = [random.random() * 2 - 1 for _ in range(SR)]

for nbeat in range(beats):
    t0 = nbeat * SPB
    i0 = int(t0 * SR)
    bar, beat = divmod(nbeat, 4)
    ch = bar % 4
    # kick
    for k in range(int(0.2 * SR)):
        t = k / SR
        f = 160 * (38 / 160) ** (t / 0.09)
        add(i0 + k, math.sin(2 * math.pi * f * t) * math.exp(-t / 0.07) * 0.95)
        if t < 0.02:
            add(i0 + k, noise[k % len(noise)] * (1 - t / 0.02) * 0.08)
    # clap on 2 and 4
    if beat in (1, 3):
        for k in range(int(0.22 * SR)):
            t = k / SR
            add(i0 + k, noise[(k * 3) % len(noise)] * math.exp(-t / 0.04) * 0.32)
    # hats 16ths
    for sub, openh in ((0, False), (0.25, False), (0.5, beat == 3), (0.75, False)):
        j = int((t0 + sub * SPB) * SR)
        dur = 0.14 if openh else 0.04
        for k in range(int(dur * SR)):
            t = k / SR
            add(j + k, noise[(k * 7 + 13) % len(noise)] * math.exp(-t / (dur * 0.5)) * (0.11 if openh else 0.06))
    # hoover offbeat
    ht = t0 + SPB * 0.5
    hf = BASS[ch] * (2 if beat == 2 else 1)
    j = int(ht * SR)
    for k in range(int(0.18 * SR)):
        t = k / SR
        amp = env(t, 0.02, 0.14) * 0.14
        saw = sum(osc(t, hf * 2 ** (d / 1200), 'saw') for d in (-8, 0, 9)) / 3
        add(j + k, saw * amp)
    # supersaw chord on beat 1
    if beat == 0:
        for k in range(int(1.6 * SR)):
            t = k / SR
            amp = env(t, 0.02, 1.4) * 0.07
            s = 0
            for f in CHORDS[ch]:
                for d in (-7, -3, 0, 3, 8):
                    s += osc(t, f * 2 ** (d / 1200), 'saw')
            add(i0 + k, s / 20 * amp)
    # piano
    if beat in (0, 2):
        f = CHORDS[ch][0 if beat == 0 else 2]
        for k in range(int(0.55 * SR)):
            t = k / SR
            amp = env(t, 0.01, 0.45) * 0.1
            add(i0 + k, (osc(t, f) + 0.25 * osc(t, f * 2, 'tri')) * amp)
    # hook every other bar
    if bar % 2 == 1:
        f = HOOK[beat + (4 if bar % 4 == 3 else 0)]
        for k in range(int(0.28 * SR)):
            t = k / SR
            amp = env(t, 0.02, 0.22) * 0.09
            s = sum(osc(t, f * 2 ** (d / 1200), 'saw') for d in (-5, 0, 6)) / 3
            add(i0 + k, s * amp)
    # classic slice every 2 bars, 8 beats long, ducked a little
    if beat == 0 and bar % 2 == 0 and slices:
        sl = slices[(bar // 2) % len(slices)]
        length = min(int(8 * SPB * SR), len(sl), N - i0)
        for k in range(length):
            t = k / SR
            fadein = min(1, t / 0.08)
            fadeout = min(1, (length / SR - t) / 0.15)
            # high-pass-ish: subtract a crude moving average
            add(i0 + k, sl[k] * 0.22 * fadein * fadeout)

# soft limiter + fade
peak = max(1e-6, max(abs(x) for x in out))
g = 0.92 / peak if peak > 0.92 else 1
for i, x in enumerate(out):
    out[i] = fade(x * g, i, N, inn=int(0.4 * SR), out=int(1.5 * SR))
write_wav(OUT / 'music-hardcore.wav', out)
print('wrote', OUT / 'music-hardcore.wav', '%.2fs peak was %.2f' % (DUR, peak))

# also a short README addendum
readme = OUT / 'README.txt'
note = (
    '\nSoundtrack previews (v1.2.48, ~30 s each):\n'
    '- music-classic.wav: the restored Highland Mist theme (original Glencraft soundtrack).\n'
    '- music-hardcore.wav: 170 BPM Happy Hardcore remix — four-on-the-floor kick, offbeat hoover,\n'
    '  supersaw chords, piano stabs, and slices of the same classic Glencraft tracks mixed in.\n'
    '  Procedural synthesis plus the game\'s own music only; no outside copyrighted music.\n'
)
prev = readme.read_text() if readme.exists() else ''
if 'music-hardcore.wav' not in prev:
    readme.write_text(prev + note)
print('done')
