#!/usr/bin/env python3
"""1.2.6x Calm cave / Agartha beds — beatless ethereal liminal ambient.

Big breathy choir pad, sparse glassy bells, a deep 40–60 Hz drone, cavernous
reverb, minor/modal. Built to match t1134-cave-ref spectrally (deep drone
wall, not a mid-forward pad). Previews ~-15 LUFS, no clipping, to
/workspace/qa/audio-1260/. cave1 and hell keep their simpler 1.2.48 character.
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent))
import engine1260 as E

SR = E.SR
OUT = Path(os.environ.get("HC_OUT", "/workspace/qa/audio-1260"))
MUSIC = Path(__file__).resolve().parents[2] / "music"
DUR = 40.0  # loopable bed
SEED = 1260

# Slow minor/modal drifts that never cadence home.
MOODS = {
    "blue": {
        "chords": [
            [69.30, 103.83, 155.56, 207.65, 311.13],
            [65.41, 110.00, 164.81, 220.00, 329.63],
            [51.91, 103.83, 155.56, 207.65, 311.13],
            [61.74, 123.47, 185.00, 246.94, 369.99],
        ],
        "formants": (780, 1450, 2450),
        "formants_b": (640, 1200, 2100),
        "sub": 34.65,
        "bells": [1108.7, 1318.5, 1661.2, 1975.5, 2217.5],
        "bell_times": (5.5, 14.0, 24.5, 33.0),
        "chord_times": (0.0, 11.0, 21.5, 31.0),
        "ir": 7.5,
        "wet": 0.80,
        "lfo": 0.05,
        "desc": "blue crystal cave — icy C# minor choir",
    },
    "purple": {
        "chords": [
            [92.50, 110.00, 138.59, 185.00, 277.18],
            [73.42, 110.00, 146.83, 220.00, 293.66],
            [82.41, 103.83, 155.56, 207.65, 311.13],
            [82.41, 123.47, 164.81, 246.94, 329.63],
        ],
        "formants": (620, 1180, 2200),
        "formants_b": (500, 980, 1900),
        "sub": 30.87,
        "bells": [830.6, 987.8, 1244.5, 1480.0, 1661.2],
        "bell_times": (6.5, 17.5, 28.5),
        "chord_times": (0.0, 12.0, 23.0, 33.0),
        "ir": 8.0,
        "wet": 0.82,
        "lfo": 0.04,
        "desc": "purple crystal cave — dusk F# minor choir",
    },
    "agartha": {
        "chords": [
            [73.42, 110.00, 146.83, 164.81, 220.00],
            [77.78, 110.00, 155.56, 196.00, 233.08],
            [87.31, 110.00, 174.61, 220.00, 261.63],
            [65.41, 110.00, 130.81, 196.00, 261.63],
        ],
        "formants": (520, 980, 1800),
        "formants_b": (430, 820, 1600),
        "sub": 36.71,
        "bells": [587.3, 698.5, 880.0, 1174.7, 1396.9],
        "bell_times": (8.0, 22.0, 34.0),
        "chord_times": (0.0, 13.0, 25.0, 35.0),
        "ir": 9.0,
        "wet": 0.85,
        "lfo": 0.032,
        "desc": "Agartha — ancient D/A pedal, darker choir",
    },
}


def swell(n, hz, depth, seed):
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    env = 0.78 + depth * np.sin(2 * np.pi * hz * t + r.random() * 6)
    env += 0.10 * np.sin(2 * np.pi * hz * 0.37 * t)
    env = np.clip(env, 0.35, 1.15)
    # no hard fade — we'll crossfade the loop
    a = int(3.0 * SR)
    env[:a] *= np.linspace(0.55, 1, a) ** 1.1
    return env


def chord_gains(n, times, fade=7.0):
    nch = len(times)
    envs = [np.zeros(n) for _ in range(nch)]
    fd = int(fade * SR)
    for i, t0 in enumerate(times):
        a = int(t0 * SR)
        b = int(times[i + 1] * SR) if i + 1 < nch else n
        envs[i][a:b] = 1.0
        if i > 0 and fd > 0:
            p0, p1 = max(0, a), min(n, a + fd)
            ramp = np.linspace(0, 1, p1 - p0)
            envs[i][p0:p1] = ramp
            envs[i - 1][p0:p1] = 1 - ramp
    return envs


def lfo_formants(n, a, b, hz, seed):
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    k = 0.5 + 0.5 * np.sin(2 * np.pi * hz * t + r.random() * 6)
    return tuple(aa + (bb - aa) * k for aa, bb in zip(a, b))


def tone_liminal(x):
    """Deep 40–60 Hz foundation, choir in the 200–800 Hz cave, dark air."""
    y = x.copy()
    y = np.stack([E.rbj(y[:, 0], 50, 0.8, "peak", gain_db=1.5),
                  E.rbj(y[:, 1], 50, 0.8, "peak", gain_db=1.5)], 1)
    y = np.stack([E.rbj(y[:, 0], 85, 0.8, "peak", gain_db=2.5),
                  E.rbj(y[:, 1], 85, 0.8, "peak", gain_db=2.5)], 1)
    y = np.stack([E.rbj(y[:, 0], 120, 0.8, "peak", gain_db=1.5),
                  E.rbj(y[:, 1], 120, 0.8, "peak", gain_db=1.5)], 1)
    # mild mid cut only — keep the breathy choir audible
    y = np.stack([E.rbj(y[:, 0], 320, 0.7, "peak", gain_db=-1.0),
                  E.rbj(y[:, 1], 320, 0.7, "peak", gain_db=-1.0)], 1)
    y = np.stack([E.rbj(y[:, 0], 700, 0.7, "peak", gain_db=1.8),
                  E.rbj(y[:, 1], 700, 0.7, "peak", gain_db=1.8)], 1)
    air = np.stack([E.sos_hp(y[:, 0], 2800, 1), E.sos_hp(y[:, 1], 2800, 1)], 1)
    y = y + air * 0.04
    y = np.stack([E.sos_lp(y[:, 0], 6500, 1), E.sos_lp(y[:, 1], 6500, 1)], 1)
    return y


def render_liminal(name, spec, dur=DUR, rng=None):
    if rng is None:
        rng = np.random.default_rng(SEED + abs(hash(name)) % 999)
    n = int(dur * SR)
    pad = np.zeros((n, 2))
    times = list(spec["chord_times"])
    envs = chord_gains(n, times, fade=7.5)
    sw = swell(n, spec["lfo"], 0.28, seed=100 + abs(hash(name)) % 99)

    # Morphing formants (aah ↔ ooh)
    fa, fb = spec["formants"], spec["formants_b"]
    # render each chord at both vowel positions and crossfade slowly? expensive.
    # Instead pick a mid vowel and add slow filter LFO via two renders mixed.
    for ci, chord in enumerate(spec["chords"]):
        env = envs[ci] * sw
        for vi, f in enumerate(chord):
            # two vowel colours, slow LFO mix
            v1 = E.choir_voice(n, f, fa, detune=10, rng=rng)
            v2 = E.choir_voice(n, f, fb, detune=11, rng=rng)
            t = np.arange(n) / SR
            k = 0.5 + 0.5 * np.sin(2 * np.pi * spec["lfo"] * 0.6 * t + vi)
            mono = v1 * (1 - k) + v2 * k
            pan = (-0.48, -0.22, 0.0, 0.22, 0.48)[vi % 5]
            g = 0.42 / (1 + 0.05 * vi)
            E.add_mono(pad, 0, mono * env, gain=g, pan=pan)

    # Deep 40–60 Hz drone — present, but not so loud it buries the choir
    t = np.arange(n) / SR
    subf = spec["sub"] * (1 + 0.004 * np.sin(2 * np.pi * 0.03 * t))
    sub = np.sin(2 * np.pi * np.cumsum(subf) / SR) * sw
    drone = np.sin(2 * np.pi * 51.0 * t) * (1 + 0.08 * np.sin(2 * np.pi * 0.027 * t)) * sw
    E.add_mono(pad, 0, E.sos_lp(sub, 90), gain=0.08, pan=0.0)
    E.add_mono(pad, 0, E.sos_lp(drone, 90), gain=0.11, pan=0.0)

    # Chest at the chord root fills 70–150 Hz so the spectrum isn't a 50 Hz spike
    for ci, chord in enumerate(spec["chords"]):
        env = envs[ci] * sw
        root = float(min(chord))
        body = np.sin(2 * np.pi * root * t)
        body += 0.22 * np.sin(2 * np.pi * root * 2 * t)
        body += 0.12 * np.sin(2 * np.pi * 77.0 * t)
        body = E.sos_lp(body, 180) * env * 0.12
        E.add_mono(pad, 0, body, gain=1.0, pan=0.0)

    # Stereo choir widening: delayed / detuned copies
    d1, d2 = int(0.027 * SR), int(0.043 * SR)
    wide = np.zeros_like(pad)
    wide[d1:, 0] += pad[:-d1, 0] * 0.35
    wide[d2:, 1] += pad[:-d2, 1] * 0.35
    pad = pad + wide

    bells = np.zeros((n, 2))
    for i, t0 in enumerate(spec["bell_times"]):
        if t0 >= dur - 3:
            continue
        f = spec["bells"][i % len(spec["bells"])] * 2 ** (rng.uniform(-0.12, 0.12) / 12)
        sig = E.fm_glass_bell(f, dur=8.5 if name != "agartha" else 10.0, rng=rng)
        sig = E.sos_lp(sig, 5500)
        E.add_mono(bells, t0, sig, gain=0.090 if name != "agartha" else 0.070,
                   pan=float(rng.uniform(-0.65, 0.65)))

    ir = E.make_cave_ir(spec["ir"], rng, decay_pow=1.7, dark=2400)
    mixed = E.convolve_stereo(pad + bells, ir, wet=spec["wet"], dry=1 - spec["wet"] * 0.82,
                              predelay_s=0.065)
    mixed = np.stack([E.sos_hp(mixed[:, 0], 36, 2), E.sos_hp(mixed[:, 1], 36, 2)], 1)
    mixed = tone_liminal(mixed)
    # loop: last 2s ≈ first 2s material after xfade (choir is already continuous)
    mixed = E.seamless_loop(mixed, xfade_s=1.8, polish_s=0.03)
    # Preview level near the reference (~-16 LUFS). We'll fine-tune after measure.
    peak = np.max(np.abs(mixed)) + 1e-12
    mixed = mixed / peak * 0.45
    return mixed


def render_cave1(dur=30.0, rng=None):
    """Unchanged 1.2.48 character: intimate earthy sine pad + sparse plucks."""
    rng = rng or np.random.default_rng(11)
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = swell(n, 0.04, 0.2, 11)
    pad = np.zeros((n, 2))
    for f, g, pan in ((65.4, 0.26, -0.1), (98.0, 0.22, 0.1), (146.8, 0.18, 0.0)):
        E.add_mono(pad, 0, E.sos_lp(np.sin(2 * np.pi * f * t) * env, 1400), gain=g, pan=pan)
    t0 = 2.5
    roots = [146.8, 174.6, 196, 220]
    while t0 < dur - 2:
        f = roots[int(rng.integers(0, len(roots)))]
        nn = int(1.8 * SR)
        tt = np.arange(nn) / SR
        pl = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.45)
        E.add_mono(pad, t0, E.sos_lp(pl, 1800), gain=0.12, pan=float(rng.uniform(-0.4, 0.4)))
        t0 += 2.6 + float(rng.random()) * 3.2
    peak = np.max(np.abs(pad)) + 1e-12
    return pad / peak * 0.18


def render_hell(dur=30.0, rng=None):
    rng = rng or np.random.default_rng(22)
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = swell(n, 0.04, 0.15, 22)
    pad = np.zeros((n, 2))
    for f, g, pan in ((36.7, 0.3, 0.0), (49.0, 0.22, -0.15), (73.4, 0.18, 0.15),
                      (92.5, 0.12, 0.0), (110.0, 0.06, 0.2)):
        typ = np.sin(2 * np.pi * f * t) if f < 80 else (2 / np.pi) * np.arcsin(np.sin(2 * np.pi * f * t))
        E.add_mono(pad, 0, E.sos_lp(typ * env, 420), gain=g, pan=pan)
    peak = np.max(np.abs(pad)) + 1e-12
    return pad / peak * 0.18


def lufs(path):
    r = subprocess.check_output(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
        stderr=subprocess.STDOUT, text=True,
    )
    I = None
    for line in r.split("Summary:")[-1].splitlines():
        if line.strip().startswith("I:"):
            I = float(line.split("I:")[1].split("LUFS")[0].strip())
    return I


def write_pair(name, audio, game=False, target_lufs=-15.0):
    OUT.mkdir(parents=True, exist_ok=True)
    wav = OUT / f"mood-{name}.wav"
    mp3 = OUT / f"mood-{name}.mp3"
    if audio.ndim == 1:
        audio = np.stack([audio, audio], axis=1)
    tmp = OUT / f"_mood-{name}-raw.wav"
    sf.write(str(tmp), audio, SR, subtype="FLOAT")
    cur = lufs(tmp)
    if cur is not None:
        audio = audio * (10 ** ((target_lufs - cur) / 20.0))
        audio = np.clip(audio, -0.89, 0.89)
        print(f"  {name} LUFS {cur:.1f} -> {target_lufs}")
    sf.write(str(wav), audio, SR, subtype="PCM_24")
    tmp.unlink(missing_ok=True)
    subprocess.check_call(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "192k", "-ar", "44100", str(mp3)]
    )
    if game:
        for ext, codec in (("mp3", ["-codec:a", "libmp3lame", "-b:a", "128k"]),
                           ("ogg", ["-codec:a", "libvorbis", "-q:a", "4"])):
            dst = MUSIC / f"mood_{name}.{ext}"
            subprocess.check_call(
                ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                 "-i", str(wav), *codec, "-ar", "44100", str(dst)]
            )
    print(f"wrote {wav.name} peak={float(np.max(np.abs(audio))):.3f} rms={float(np.sqrt(np.mean(audio**2))):.4f}")
    return wav


def main():
    rng = np.random.default_rng(SEED)
    for name, spec in MOODS.items():
        print("rendering", name, "—", spec["desc"])
        audio = render_liminal(name, spec, rng=rng)
        write_pair(name, audio, game=True, target_lufs=-15.0)
    print("rendering cave1 (unchanged character)")
    write_pair("cave1", render_cave1(), game=False, target_lufs=-20.0)
    print("rendering hell (unchanged character)")
    write_pair("hell", render_hell(), game=False, target_lufs=-20.0)
    prev = OUT / "previews"
    prev.mkdir(parents=True, exist_ok=True)
    (OUT / "ab").mkdir(parents=True, exist_ok=True)
    for name in MOODS:
        src_wav = OUT / f"mood-{name}.wav"
        # 32 s preview
        dst = prev / f"cave-{name}.mp3"
        subprocess.check_call(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-i", str(src_wav), "-t", "32",
             "-codec:a", "libmp3lame", "-b:a", "192k", "-ar", "44100", str(dst)]
        )
        print("preview", dst)
    for name in ("purple", "blue", "agartha"):
        subprocess.check_call(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-i", str(OUT / f"mood-{name}.wav"),
             "-lavfi", "showspectrumpic=s=1280x512:legend=1:scale=log:color=intensity:fscale=log",
             str(OUT / "ab" / f"mood-{name}-spec.png")]
        )
    print("ok")


if __name__ == "__main__":
    main()
