#!/usr/bin/env python3
"""1.2.50 Calm-soundtrack cave mood previews.

Reworked blue / purple crystal-cave beds, plus a new Agartha mood, in the
ethereal dark 'liminal space' style of the t1134 reference: beatless,
no percussion, no hook. A swelling breathy choir pad, sparse glassy
crystal bells, a deep sub drone, and a long cavernous reverb. Slow
minor/modal chord drifts that never cadence home. Quiet mix.

cave1 and hell are rendered with their existing 1.2.48 character so
they stay distinct. Procedural only — no third-party samples.
"""
from __future__ import annotations

import os
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
OUT = Path(os.environ.get("HC_OUT", "/workspace/qa/audio-1250"))
DUR = 30.0
SEED = 1250
rng = np.random.default_rng(SEED)


def sos_lp(x, hz, order=2):
    sos = butter(order, min(max(hz, 30), SR * 0.45), btype="lowpass", fs=SR, output="sos")
    return sosfilt(sos, x)


def sos_hp(x, hz, order=2):
    sos = butter(order, min(max(hz, 20), SR * 0.45), btype="highpass", fs=SR, output="sos")
    return sosfilt(sos, x)


def sos_bp(x, lo, hi, q_ignore=None, order=2):
    lo = max(30, min(lo, SR * 0.4))
    hi = max(lo + 20, min(hi, SR * 0.49))
    sos = butter(order, [lo, hi], btype="bandpass", fs=SR, output="sos")
    return sosfilt(sos, x)


def fade(sig, ms_in=80, ms_out=2000):
    n = len(sig)
    a = min(n // 4, int(ms_in * SR / 1000))
    b = min(n // 3, int(ms_out * SR / 1000))
    out = sig.copy()
    if a:
        out[:a] *= np.linspace(0, 1, a)
    if b:
        out[-b:] *= np.linspace(1, 0, b)
    return out


def make_ir(sec, decay_pow=2.4, stereo=True, seed=1):
    r = np.random.default_rng(seed)
    n = int(sec * SR)
    t = np.arange(n) / n
    env = (1 - t) ** decay_pow
    if stereo:
        l = r.standard_normal(n) * env
        rch = r.standard_normal(n) * env
        # slight HF rolloff so the cave is dark, not fizzy
        return np.stack([sos_lp(l, 6500), sos_lp(rch, 6200)], axis=1)
    x = r.standard_normal(n) * env
    return sos_lp(x, 6500)


def convolve_stereo(x, ir, wet=0.7, dry=0.3):
    """x, ir: (N, 2). Returns trimmed to len(x)."""
    y = np.zeros((len(x), 2))
    for ch in (0, 1):
        conv = fftconvolve(x[:, ch], ir[:, ch], mode="full")
        y[:, ch] = conv[: len(x)]
    # normalise wet so it doesn't explode
    peak = np.max(np.abs(y)) + 1e-12
    y = y / peak * (np.max(np.abs(x)) + 1e-12) * 1.4
    return x * dry + y * wet


def choir_tone(n, freq, formants, detune_cents=6):
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for cents, typ, amp in (
        (-detune_cents, "sine", 0.45),
        (0, "tri", 0.35),
        (detune_cents, "sine", 0.35),
        (detune_cents * 0.4, "sine2", 0.18),
    ):
        f = freq * 2 ** (cents / 1200.0)
        if typ == "tri":
            sig += amp * (2 / np.pi) * np.arcsin(np.sin(2 * np.pi * f * t))
        elif typ == "sine2":
            sig += amp * np.sin(2 * np.pi * f * 2 * t) * 0.5
        else:
            sig += amp * np.sin(2 * np.pi * f * t)
    # breathy hiss, filtered
    hiss = sos_bp(rng.standard_normal(n), 400, 2800) * 0.04
    sig = sig + hiss
    formed = np.zeros(n)
    gains = (1.0, 0.55, 0.28)
    for fc, g in zip(formants, gains):
        formed += g * sos_bp(sig, fc * 0.7, fc * 1.35)
    # also keep a little of the dark body
    return sos_lp(formed * 0.75 + sos_lp(sig, 900) * 0.35, 4200)


def swell_env(n, lfo_hz=0.05, depth=0.35, seed=0):
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    # slow choir swell — no beat
    env = 0.72 + depth * np.sin(2 * np.pi * lfo_hz * t + r.random() * 6)
    env += 0.08 * np.sin(2 * np.pi * (lfo_hz * 0.37) * t)
    env = np.clip(env, 0.25, 1.15)
    # 4 s fade in, 3 s out
    a, b = int(4.0 * SR), int(3.0 * SR)
    env[:a] *= np.linspace(0, 1, a) ** 1.2
    env[-b:] *= np.linspace(1, 0, b)
    return env


def chord_gains(n, times, fade=5.0):
    """times: list of (start_s, duration used implicitly by next). returns list of envelopes, one per chord."""
    nch = len(times)
    envs = [np.zeros(n) for _ in range(nch)]
    fd = int(fade * SR)
    for i, t0 in enumerate(times):
        a = int(t0 * SR)
        b = int(times[i + 1] * SR) if i + 1 < nch else n
        envs[i][a:b] = 1.0
        # overlap fade with previous
        if i > 0 and fd > 0:
            p0 = max(0, a)
            p1 = min(n, a + fd)
            ramp = np.linspace(0, 1, p1 - p0)
            envs[i][p0:p1] = ramp
            envs[i - 1][p0:p1] = 1 - ramp
    return envs


def glassy_bell(freq, dur=6.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    # two close partials + a weak 2nd / 3rd for crystal shimmer
    sig = np.sin(2 * np.pi * freq * t)
    sig += 0.45 * np.sin(2 * np.pi * freq * 2.003 * t)
    sig += 0.18 * np.sin(2 * np.pi * freq * 2.996 * t)
    sig += 0.08 * np.sin(2 * np.pi * freq * 4.02 * t)
    # slow amplitude, long drip/fade — no attack click
    att = int(0.02 * SR)
    env = np.exp(-t / (dur * 0.28))
    env[:att] *= np.linspace(0, 1, att)
    # tiny inharmonic rattle at the start (glass)
    rattle = sos_bp(rng.standard_normal(n), 2500, 8000) * np.exp(-t / 0.08) * 0.06
    return fade(sos_lp(sig * env + rattle, 9000), 8, 400)


def add_mono(bus, t0, sig, gain=1.0, pan=0.0):
    i0 = int(round(t0 * SR))
    if i0 >= bus.shape[0] or i0 < 0:
        return
    n = min(len(sig), bus.shape[0] - i0)
    l = np.sqrt(0.5 * (1 - pan)) * gain
    r = np.sqrt(0.5 * (1 + pan)) * gain
    bus[i0:i0 + n, 0] += sig[:n] * l
    bus[i0:i0 + n, 1] += sig[:n] * r


# Mood specs: slow minor/modal drifts that never cadence home.
MOODS = {
    "blue": {
        # icy C# aeolian: i – VI – v – VII, never V–i
        "chords": [
            [69.30, 103.83, 155.56, 207.65, 311.13],   # C#m
            [65.41, 110.00, 164.81, 220.00, 329.63],   # A
            [51.91, 103.83, 155.56, 207.65, 311.13],   # G#m
            [61.74, 123.47, 185.00, 246.94, 369.99],   # B
        ],
        "formants": (780, 1450, 2450),
        "sub": 34.65,          # C#0
        "bells": [1108.7, 1318.5, 1661.2, 1975.5, 2217.5, 2637.0],
        "ir": 6.5,
        "wet": 0.78,
        "lfo": 0.055,
        "bell_times": (3.2, 7.8, 14.5, 19.0, 24.6),
        "chord_times": (0.0, 8.5, 16.5, 24.0),
        "level": 0.11,
        "desc": "blue crystal cave — icy C# minor choir, glassy high bells",
    },
    "purple": {
        # dusk F# minor: i – VI – v – VII
        "chords": [
            [92.50, 110.00, 138.59, 185.00, 277.18],   # F#m
            [73.42, 110.00, 146.83, 220.00, 293.66],   # D
            [82.41, 103.83, 155.56, 207.65, 311.13],   # C#m
            [82.41, 123.47, 164.81, 246.94, 329.63],   # E
        ],
        "formants": (620, 1180, 2100),
        "sub": 30.87,          # B-1 / low B
        "bells": [830.6, 987.8, 1244.5, 1480.0, 1661.2, 1975.5],
        "ir": 7.0,
        "wet": 0.80,
        "lfo": 0.042,
        "bell_times": (4.5, 11.0, 18.8, 25.5),
        "chord_times": (0.0, 9.0, 17.5, 25.0),
        "level": 0.10,
        "desc": "purple crystal cave — darker F# minor choir, fewer lower bells",
    },
    "agartha": {
        # inner-earth D dorian/phrygian float with a D/A pedal: Dm(add9) – Eb – F – C
        # the pedal keeps it from ever cadence-landing in a new home
        "chords": [
            [73.42, 110.00, 146.83, 164.81, 220.00],   # D + A + E (sus/add9)
            [77.78, 110.00, 155.56, 196.00, 233.08],   # Eb over A/D
            [87.31, 110.00, 174.61, 220.00, 261.63],   # F over A
            [65.41, 110.00, 130.81, 196.00, 261.63],   # C over A
        ],
        "formants": (520, 980, 1800),  # darker 'oh/oo' vowel
        "sub": 36.71,          # D0
        "bells": [587.3, 698.5, 880.0, 1174.7, 1396.9],  # more bronze than ice
        "ir": 8.5,
        "wet": 0.84,
        "lfo": 0.033,
        "bell_times": (5.5, 16.0, 26.2),
        "chord_times": (0.0, 10.5, 19.5, 26.5),
        "level": 0.105,
        "desc": "Agartha — ancient D/A pedal, darker choir, very sparse bronze bells",
    },
}


def render_liminal(name, spec, dur=DUR):
    n = int(dur * SR)
    pad = np.zeros((n, 2))
    # choir: each chord's voices, crossfaded
    times = list(spec["chord_times"])
    envs = chord_gains(n, times, fade=6.0)
    swell = swell_env(n, lfo_hz=spec["lfo"], depth=0.32, seed=hash(name) & 0xFFFF)
    for ci, chord in enumerate(spec["chords"]):
        env = envs[ci] * swell
        for vi, f in enumerate(chord):
            mono = choir_tone(n, f, spec["formants"], detune_cents=5 + vi)
            pan = (-0.45, -0.22, 0.0, 0.22, 0.45)[vi % 5]
            g = 0.22 / (1 + 0.08 * vi)
            add_mono(pad, 0, mono * env, gain=g, pan=pan)
    # sub drone, slight wobble, mostly mono
    t = np.arange(n) / SR
    subf = spec["sub"] * (1 + 0.004 * np.sin(2 * np.pi * 0.03 * t))
    sub = np.sin(2 * np.pi * np.cumsum(subf) / SR)
    sub *= swell * 0.55
    add_mono(pad, 0, sos_lp(sub, 80), gain=0.45, pan=0.0)

    # sparse glassy bells
    bells = np.zeros((n, 2))
    for i, t0 in enumerate(spec["bell_times"]):
        if t0 >= dur - 2:
            continue
        f = spec["bells"][i % len(spec["bells"])]
        # slight random detune so they don't form a hook
        f *= 2 ** (rng.uniform(-0.15, 0.15) / 12)
        sig = glassy_bell(f, dur=6.8 if name != "agartha" else 8.0)
        pan = rng.uniform(-0.7, 0.7)
        add_mono(bells, t0, sig, gain=0.28 if name != "agartha" else 0.22, pan=pan)

    ir = make_ir(spec["ir"], decay_pow=2.5, seed=1000 + abs(hash(name)) % 999)
    mixed = convolve_stereo(pad + bells, ir, wet=spec["wet"], dry=1 - spec["wet"] * 0.85)
    # quiet
    peak = np.max(np.abs(mixed)) + 1e-12
    mixed = mixed / peak * spec["level"]
    mixed = fade(mixed, 80, 2500) if mixed.ndim == 1 else np.stack(
        [fade(mixed[:, 0], 80, 2500), fade(mixed[:, 1], 80, 2500)], axis=1
    )
    return mixed


def render_cave1(dur=DUR):
    """Existing 1.2.48 character: intimate earthy D/C sine pad + sparse soft plucks. Not the liminal choir."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = swell_env(n, 0.04, 0.2, seed=11)
    pad = np.zeros((n, 2))
    for f, g, pan in ((65.4, 0.26, -0.1), (98.0, 0.22, 0.1), (146.8, 0.18, 0.0)):
        sig = np.sin(2 * np.pi * f * t) * env
        add_mono(pad, 0, sos_lp(sig, 1400), gain=g, pan=pan)
    # sparse 'harp' plucks (this mood keeps them; blue/purple/agartha do not)
    roots = [146.8, 174.6, 196, 220]
    t0 = 2.5
    while t0 < dur - 2:
        f = roots[int(rng.integers(0, len(roots)))]
        nn = int(1.8 * SR)
        tt = np.arange(nn) / SR
        pl = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.45)
        pl[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
        add_mono(pad, t0, sos_lp(pl, 1800), gain=0.12, pan=float(rng.uniform(-0.4, 0.4)))
        t0 += 2.6 + float(rng.random()) * 3.2
    peak = np.max(np.abs(pad)) + 1e-12
    return fade(pad[:, 0], 80, 2500) if False else (pad / peak * 0.13)


def render_hell(dur=DUR):
    """Existing 1.2.48 character: low oppressive drones, no pretty choir or crystal bells."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = swell_env(n, 0.04, 0.15, seed=22)
    pad = np.zeros((n, 2))
    for f, g, pan in ((36.7, 0.3, 0.0), (49.0, 0.22, -0.15), (73.4, 0.18, 0.15), (92.5, 0.12, 0.0), (110.0, 0.06, 0.2)):
        typ = np.sin(2 * np.pi * f * t) if f < 80 else (2 / np.pi) * np.arcsin(np.sin(2 * np.pi * f * t))
        add_mono(pad, 0, sos_lp(typ * env, 420), gain=g, pan=pan)
    peak = np.max(np.abs(pad)) + 1e-12
    return pad / peak * 0.14


def write_pair(name, audio):
    OUT.mkdir(parents=True, exist_ok=True)
    wav = OUT / f"mood-{name}.wav"
    mp3 = OUT / f"mood-{name}.mp3"
    if audio.ndim == 1:
        audio = np.stack([audio, audio], axis=1)
    # safety
    audio = np.clip(audio, -0.95, 0.95)
    sf.write(str(wav), audio, SR, subtype="PCM_24")
    subprocess.check_call(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "192k", str(mp3)]
    )
    peak = float(np.max(np.abs(audio)))
    rms = float(np.sqrt(np.mean(audio ** 2)))
    print(f"wrote {wav.name}  dur={len(audio)/SR:.1f}s  peak={peak:.3f}  rms={rms:.4f}")
    return wav


def main():
    for name, spec in MOODS.items():
        print("rendering", name, "—", spec["desc"])
        write_pair(name, render_liminal(name, spec))
    print("rendering cave1 (unchanged character, for contrast)")
    write_pair("cave1", render_cave1())
    print("rendering hell (unchanged character, for contrast)")
    write_pair("hell", render_hell())
    print("ok")


if __name__ == "__main__":
    main()
