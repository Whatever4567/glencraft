#!/usr/bin/env python3
"""Shared instruments, mixing and mastering for the Glencraft OST.

Original synthesis for Glencraft. No third-party recordings.
Band-limited / additive / Karplus-style voices, mid-side width with a
mono low end, BS.1770 loudness via pyloudnorm, and a true-peak limiter.
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np
from scipy.signal import resample_poly

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import engine1260 as E

SR = E.SR

# Glen theme as scale degrees in a Mixolydian / Ionian frame
# (5 6 1 2 1 6 5 4 5) — the opening whistle phrase.
GLEN_DEGREES = [5, 6, 8, 9, 8, 6, 5, 4, 5]
GLEN_DUR =     [1, 1, 1, 1.5, 0.5, 1, 1, 1, 2]

# Answer phrase
GLEN_ANSWER = [5, 6, 11, 9, 8, 6, 5, 4, 1]
GLEN_ANSWER_DUR = [1, 1, 1, 1, 1, 1, 1, 1, 2]


def midi(n: float) -> float:
    return 440.0 * (2.0 ** ((n - 69.0) / 12.0))


def degree_to_hz(root_midi: float, degree: int, mode="mixolydian") -> float:
    """degree is 1-based; 8 is the octave. mode selects the interval set."""
    if mode == "mixolydian":
        # 1 2 3 4 5 6 b7 8
        steps = [0, 2, 4, 5, 7, 9, 10]
    elif mode == "aeolian":
        steps = [0, 2, 3, 5, 7, 8, 10]
    elif mode == "dorian":
        steps = [0, 2, 3, 5, 7, 9, 10]
    elif mode == "ionian":
        steps = [0, 2, 4, 5, 7, 9, 11]
    elif mode == "lydian":
        steps = [0, 2, 4, 6, 7, 9, 11]
    elif mode == "phrygian":
        steps = [0, 1, 3, 5, 7, 8, 10]
    else:
        steps = [0, 2, 4, 5, 7, 9, 10]
    deg = int(degree)
    octv, idx = divmod(deg - 1, 7)
    return midi(root_midi + steps[idx] + 12 * octv)


def env_adsr(n, att_s=0.02, dec_s=0.08, sus=0.85, rel_s=0.12, peak=1.0):
    att = min(n, max(1, int(att_s * SR)))
    dec = min(n - att, max(1, int(dec_s * SR)))
    rel = min(n, max(1, int(rel_s * SR)))
    e = np.ones(n, dtype=np.float64) * sus * peak
    e[:att] = np.linspace(0, peak, att)
    if dec > 0:
        e[att:att + dec] = np.linspace(peak, sus * peak, dec)
    if rel < n:
        e[-rel:] *= np.linspace(1, 0, rel)
    return e


# ---------------------------------------------------------------------------
# Instruments
# ---------------------------------------------------------------------------
def tin_whistle(freq, dur, vel=0.8, breathe=0.07, vib=True, tongued=True, low=False):
    """Wooden tin / low whistle: nearly sine, chiff, delayed vibrato."""
    n = int(max(dur, 0.04) * SR)
    t = np.arange(n) / SR
    scoop = 1.0 - 0.007 * np.exp(-t / 0.028)
    vib_env = np.clip((t - 0.22) / 0.28, 0, 1) if (vib and dur > 0.35) else 0.0
    fr = freq * scoop * (1.0 + 0.0038 * vib_env * np.sin(2 * np.pi * 5.55 * t))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    # wood: strong fundamental, tiny 2nd/3rd
    sig = np.sin(ph) + 0.11 * np.sin(2 * ph) + 0.035 * np.sin(3 * ph)
    if low:
        sig += 0.08 * np.sin(ph * 0.5)
    att = 0.011 if tongued else 0.045
    rel = min(0.16, dur * 0.28)
    e = env_adsr(n, att_s=att, dec_s=0.05, sus=0.92, rel_s=rel, peak=vel)
    rng = np.random.default_rng(int(abs(freq * 17)) % 99991 + 3)
    hi = 7000 if low else 9000
    lo_b = 1600 if low else 2200
    breath = E.sos_bp(rng.standard_normal(n), lo_b, hi) * breathe * e
    lp = 5200 if low else 7800
    out = E.sos_lp(sig * e + breath, lp)
    # stereo: tiny delay + slightly different breath
    L = E.fade(out, 3, 10)
    R = E.fade(np.roll(out, int(0.0045 * SR)), 3, 10)
    return L, R


def fiddle_note(freq, dur, vel=0.65, vib=True, slur=False):
    """Bowed fiddle: band-limited saw through violin-ish formants."""
    n = int(max(dur, 0.05) * SR)
    t = np.arange(n) / SR
    port = 0.0 if slur else 0.028
    fr = freq * (1.0 - port * np.exp(-t / 0.03))
    if vib and dur > 0.4:
        fr = fr * (1.0 + 0.0045 * np.clip((t - 0.28) / 0.3, 0, 1) * np.sin(2 * np.pi * 5.7 * t))
    ph = np.cumsum(fr) / SR
    # polyblep-ish saw via bandlimited harmonic sum
    saw = np.zeros(n)
    n_h = int(max(3, min(18, (SR * 0.42) / max(freq, 40.0))))
    for k in range(1, n_h + 1):
        saw += (1.0 / k) * np.sin(2 * np.pi * k * ph)
    saw *= 0.55
    formed = (
        0.85 * E.rbj(saw, 350, 2.0, "band")
        + 0.65 * E.rbj(saw, 780, 1.7, "band")
        + 0.32 * E.rbj(saw, 2100, 1.5, "band")
        + 0.12 * E.rbj(saw, 3400, 1.2, "band")
    )
    rng = np.random.default_rng(int(abs(freq * 13)) % 99991 + 7)
    bow = E.sos_bp(rng.standard_normal(n), 2500, 8000) * 0.045
    att = 0.012 if slur else 0.045
    rel = min(0.14, dur * 0.25)
    e = env_adsr(n, att_s=att, dec_s=0.08, sus=0.88, rel_s=rel, peak=vel)
    sig = E.sos_lp(formed + bow, 6200) * e
    L = E.fade(sig, 4, 12)
    R = E.fade(np.roll(sig, int(0.006 * SR)) * 0.98, 4, 12)
    return L, R


def harp_pluck(freq, dur, vel=0.7, bright=0.55):
    """Celtic harp pluck: additive partials, quicker high decay."""
    n = int(max(dur, 0.08) * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    n_p = 16 if bright > 0.4 else 11
    for k in range(1, n_p + 1):
        fk = freq * k * math.sqrt(1.0 + 0.00028 * (k * k))
        if fk > SR * 0.45:
            break
        decay = (0.62 / (k ** 0.62)) * (0.55 + 0.55 * bright)
        amp = vel * (1.0 / (k ** (0.78 + 0.15 * (1 - bright))))
        if k == 1:
            amp *= 1.15
        sig += amp * np.sin(2 * np.pi * fk * t + 0.15 * k) * np.exp(-t / max(0.08, decay))
    att = min(n, int(0.0025 * SR))
    sig[:att] *= np.linspace(0, 1, att)
    sig = E.sos_lp(sig, 10000 if bright > 0.5 else 7000)
    L = E.fade(sig, 1, 18)
    R = E.fade(np.roll(sig, int(0.003 * SR)), 1, 18)
    return L, R


def bagpipe_drone(n, root_hz, gain=0.12):
    """Quiet D/A/D drones. Beating, not a melody."""
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for f, g in ((root_hz, 1.0), (root_hz * 1.5, 0.7), (root_hz * 2.0, 0.45), (root_hz * 2.003, 0.35)):
        sig += g * np.sin(2 * np.pi * f * t)
        sig += 0.08 * np.sin(2 * np.pi * f * 2 * t)
    # slow amplitude weave
    sig *= 1.0 + 0.08 * np.sin(2 * np.pi * 0.07 * t) + 0.04 * np.sin(2 * np.pi * 0.11 * t)
    sig = E.sos_lp(sig / 2.4, 900) * gain
    # fade in/out so a loop can hide the edges
    fade = int(0.8 * SR)
    sig[:fade] *= np.linspace(0, 1, fade)
    sig[-fade:] *= np.linspace(1, 0, fade)
    L = sig
    R = np.roll(sig, int(0.008 * SR))
    return L, R


def bodhran(rng, dur=0.32, tight=False, vel=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f0 = 170.0 if tight else 125.0
    f = f0 * np.exp(-t / 0.035) + (50 if tight else 42)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.09 if tight else 0.13))
    skin = E.sos_bp(rng.standard_normal(n), 200, 1100) * np.exp(-t / 0.045)
    hit = E.sos_hp(rng.standard_normal(n), 2000) * np.exp(-t / 0.012) * 0.25
    sig = E.sos_lp((body * 0.95 + skin * 0.4 + hit) * vel, 2400)
    return E.fade(sig, 1, 16)


def soft_pad(n, freqs, gain=0.12, lp=1800, lfo=0.05):
    """Slow choir-adjacent pad of detuned sines."""
    t = np.arange(n) / SR
    L = np.zeros(n)
    R = np.zeros(n)
    for i, f in enumerate(freqs):
        w = 1.0 / (1.0 + 0.08 * i)
        a = np.sin(2 * np.pi * f * t)
        b = np.sin(2 * np.pi * f * 1.0035 * t)
        c = np.sin(2 * np.pi * f * 0.9968 * t)
        sig = (a + 0.7 * b + 0.7 * c) * w
        trem = 1.0 + 0.12 * np.sin(2 * np.pi * lfo * (0.8 + 0.2 * i) * t + i)
        sig *= trem
        g = gain / max(1, math.sqrt(len(freqs)))
        L += sig * g
        R += np.roll(sig, int((0.004 + 0.001 * i) * SR)) * g
    L = E.sos_lp(L, lp)
    R = E.sos_lp(R, lp)
    fade = int(1.2 * SR)
    if fade * 2 < n:
        ramp = np.linspace(0, 1, fade)
        L[:fade] *= ramp
        R[:fade] *= ramp
        L[-fade:] *= ramp[::-1]
        R[-fade:] *= ramp[::-1]
    return L, R


def choir_chord(n, freqs, formants, gain=0.1, rng=None):
    L = np.zeros(n)
    R = np.zeros(n)
    rng = rng or np.random.default_rng(7)
    for i, f in enumerate(freqs):
        v = E.choir_voice(n, f, formants, detune=8 + i, rng=rng)
        g = gain / (1.0 + 0.07 * i)
        # slow independent swell
        t = np.arange(n) / SR
        swell = 0.72 + 0.28 * np.sin(2 * np.pi * (0.03 + 0.007 * i) * t + i)
        v = v * g * swell
        L += v
        R += np.roll(v, int((0.008 + 0.002 * i) * SR))
    fade = int(2.0 * SR)
    if fade * 2 < n:
        ramp = np.linspace(0, 1, fade) ** 1.2
        L[:fade] *= ramp
        R[:fade] *= ramp
        L[-fade:] *= ramp[::-1]
        R[-fade:] *= ramp[::-1]
    return L, R


def sub_drone(n, hz, gain=0.16, lfo=0.03):
    t = np.arange(n) / SR
    sig = np.sin(2 * np.pi * hz * t)
    sig += 0.25 * np.sin(2 * np.pi * hz * 2 * t)
    sig *= 1.0 + 0.08 * np.sin(2 * np.pi * lfo * t)
    sig = E.sos_lp(sig, 90) * gain
    fade = int(1.5 * SR)
    sig[:fade] *= np.linspace(0, 1, fade)
    sig[-fade:] *= np.linspace(1, 0, fade)
    return sig, np.roll(sig, int(0.01 * SR))


def air_noise(n, rng, lo=200, hi=1800, gain=0.03):
    x = E.sos_bp(rng.standard_normal(n), lo, hi) * gain
    t = np.arange(n) / SR
    x *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.04 * t)
    fade = int(0.8 * SR)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    return x, np.roll(x, int(0.02 * SR))


def rumble(n, rng, gain=0.08):
    t = np.arange(n) / SR
    x = E.sos_lp(rng.standard_normal(n), 80) * gain
    x *= 0.6 + 0.4 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t))
    # occasional slow swell
    return E.sos_lp(x, 120), E.sos_lp(np.roll(x, int(0.03 * SR)), 120)


def distant_boom(rng, dur=1.8, vel=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 80 * np.exp(-t / 0.18) + 22
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.45)
    air = E.sos_lp(rng.standard_normal(n), 200) * np.exp(-t / 0.5) * 0.7
    sig = (body * 0.9 + air * 0.5) * vel
    return E.fade(sig, 8, 200)


def glass_bell(freq, dur, rng, vel=0.4):
    s = E.fm_glass_bell(freq, dur, rng, ratio=3.71, index0=3.6) * vel
    return s, np.roll(s, int(0.007 * SR))


# ---------------------------------------------------------------------------
# Mix / master
# ---------------------------------------------------------------------------
def highpass(x, hz=32.0):
    y = np.zeros_like(x)
    for ch in range(x.shape[1]):
        y[:, ch] = E.sos_hp(x[:, ch], hz, order=2)
    return y


def mono_low_wide_high(x, split=130.0, side_gain=1.15):
    """Keep the low end mono; gently widen the top."""
    mid = 0.5 * (x[:, 0] + x[:, 1])
    side = 0.5 * (x[:, 0] - x[:, 1])
    mid_lo = E.sos_lp(mid, split, order=2)
    mid_hi = mid - mid_lo
    side = E.sos_hp(side, split, order=2) * side_gain
    L = mid_lo + mid_hi + side
    R = mid_lo + mid_hi - side
    return np.stack([L, R], axis=1)


def true_peak(x, sr=SR):
    up = resample_poly(x, 4, 1, axis=0)
    return float(np.max(np.abs(up)))


def lufs_integrated(x, sr=SR):
    import pyloudnorm as pyln
    meter = pyln.Meter(sr)
    # pyloudnorm expects (n, ch) and may warn on short clips
    v = meter.integrated_loudness(np.asarray(x, dtype=np.float64))
    return float(v)


def master(x, target_lufs=-15.0, ceiling_db=-1.0, hp=30.0, split=130.0):
    y = highpass(np.asarray(x, dtype=np.float64), hp)
    y = E.glue(y, thresh=0.46, ratio=1.6, att_s=0.008, rel_s=0.18)
    y = mono_low_wide_high(y, split=split, side_gain=1.12)
    # loudness
    try:
        loud = lufs_integrated(y)
        if not math.isfinite(loud) or loud < -70:
            peak = np.max(np.abs(y)) + 1e-12
            y = y / peak * 0.1
            loud = lufs_integrated(y)
        gain = 10 ** ((target_lufs - loud) / 20.0)
        gain = min(gain, 8.0)
        y = y * gain
    except Exception:
        peak = np.max(np.abs(y)) + 1e-12
        y = y / peak * 0.2
    ceiling = 10 ** (ceiling_db / 20.0)
    y = E.limiter(y, ceiling=ceiling, look_ms=6)
    # if true peak still over, a last scale
    tp = true_peak(y)
    if tp > ceiling:
        y = y * (ceiling / tp)
        y = E.limiter(y, ceiling=ceiling, look_ms=4)
    return y


def loop_master(x, xfade_s=2.0, target_lufs=-15.0, ceiling_db=-1.0, **kw):
    y = E.seamless_loop(np.asarray(x, dtype=np.float64), xfade_s=xfade_s, polish_s=0.02)
    y = master(y, target_lufs=target_lufs, ceiling_db=ceiling_db, **kw)
    # loop again after limiter so the wrap stays clean
    y = E.seamless_loop(y, xfade_s=min(0.4, xfade_s * 0.25), polish_s=0.015)
    return y


def apply_reverb(x, rng, ir_s=3.2, wet=0.28, dry=1.0, pre=0.04, dark=2400):
    ir = E.make_cave_ir(ir_s, rng, decay_pow=1.85, dark=dark)
    return E.convolve_stereo(x, ir, wet=wet, dry=dry, predelay_s=pre)


def add_phrase(bus, t0, degrees, durs, root_midi, mode, instrument, bpm,
               vel=0.7, gap=0.0, pan=0.0, **inst_kw):
    """Place a degree-sequence with an instrument callback returning (L,R) or mono."""
    beat = 60.0 / bpm
    t = t0
    for deg, dur in zip(degrees, durs):
        if deg is None or deg == 0:
            t += dur * beat + gap
            continue
        hz = degree_to_hz(root_midi, deg, mode)
        sec = dur * beat
        out = instrument(hz, sec, vel=vel, **inst_kw)
        if isinstance(out, tuple):
            L, R = out
            # light pan
            if pan != 0:
                gL = math.sqrt(0.5 * (1 - pan))
                gR = math.sqrt(0.5 * (1 + pan))
                E.add_stereo(bus, t, L * gL / 0.7071, R * gR / 0.7071, gain=1.0)
            else:
                E.add_stereo(bus, t, L, R, gain=1.0)
        else:
            E.add_mono(bus, t, out, gain=1.0, pan=pan)
        t += sec + gap
    return t


def harp_arpeggio(bus, t0, chord_hz, beats, bpm, vel=0.28, pattern=None, bright=0.5):
    beat = 60.0 / bpm
    pattern = pattern or [0, 2, 1, 3, 2, 1]
    # chord_hz should be 3–4 notes
    notes = list(chord_hz)
    t = t0
    end = t0 + beats * beat
    i = 0
    while t < end - 0.02:
        hz = notes[pattern[i % len(pattern)] % len(notes)]
        dur = beat * 0.95
        L, R = harp_pluck(hz, max(0.4, dur * 2.2), vel=vel, bright=bright)
        E.add_stereo(bus, t, L, R, gain=1.0)
        t += beat * 0.5
        i += 1


def stats(x, sr=SR):
    tp = true_peak(x, sr)
    try:
        loud = lufs_integrated(x, sr)
    except Exception as e:
        loud = float("nan")
    peak = float(np.max(np.abs(x)))
    rms = float(np.sqrt(np.mean(x ** 2)))
    # loop join error
    c = min(len(x), int(0.01 * sr))
    join = float(np.max(np.abs(x[0] - x[-1])))
    dc = np.mean(x, axis=0)
    return {
        "dur": len(x) / sr,
        "lufs": loud,
        "tp_db": 20 * math.log10(tp + 1e-12),
        "peak_db": 20 * math.log10(peak + 1e-12),
        "rms_db": 20 * math.log10(rms + 1e-12),
        "join": join,
        "dc": (float(dc[0]), float(dc[1])),
    }
