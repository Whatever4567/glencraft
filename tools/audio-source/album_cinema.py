#!/usr/bin/env python3
"""Production toolkit for the Glencraft OST.

Techniques inspired by award-level dance and pop production
(filter journeys, side-chain depth, vocoder formants, funk bass
articulation, folk-meets-electronic plucks, cinematic builds and
impacts, layered custom drums) — implemented as original synthesis
and applied to original writing only. No third-party samples,
melodies, or lyrics.
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt, sosfilt_zi

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import engine1260 as E
import album_lib as A

SR = E.SR


def _lin(n, a, b):
    return np.linspace(a, b, n, dtype=np.float64)


def saturate(x, drive=1.15, mix=0.35):
    y = np.tanh(x * drive) / np.tanh(drive)
    return x * (1.0 - mix) + y * mix


def shelf(x, hz, gain_db, typ="high"):
    """Gentle high or low shelf via RBJ peaking/high/low blend."""
    g = 10 ** (gain_db / 20.0)
    if typ == "high":
        hi = E.sos_hp(x, hz, order=2)
        lo = x - hi
        return lo + hi * g
    lo = E.sos_lp(x, hz, order=2)
    hi = x - lo
    return lo * g + hi


def eq_stereo(x, **kw):
    y = np.zeros_like(x)
    for ch in range(x.shape[1]):
        y[:, ch] = shelf(x[:, ch], **kw) if False else x[:, ch]
    return y


def stereo_shelf(x, hz, gain_db, typ="high"):
    y = np.empty_like(x)
    for ch in range(x.shape[1]):
        y[:, ch] = shelf(x[:, ch], hz, gain_db, typ)
    return y


def lp_tv(x, cutoff, Q=0.72, block=128):
    """Time-varying lowpass on a mono or stereo array. cutoff may be scalar or (n,)."""
    if x.ndim == 1:
        c = np.full(len(x), float(cutoff)) if np.isscalar(cutoff) else np.asarray(cutoff, dtype=np.float64)
        return E.rbj_tv_low(x, c, Q, block=block)
    y = np.empty_like(x)
    c = np.full(len(x), float(cutoff)) if np.isscalar(cutoff) else np.asarray(cutoff, dtype=np.float64)
    for ch in range(x.shape[1]):
        y[:, ch] = E.rbj_tv_low(x[:, ch], c, Q, block=block)
    return y


def sweep_cutoff(n, start_hz, end_hz, curve=1.0, hold_start=0.0, hold_end=0.0):
    """Cutoff path with optional holds at the ends (fractions of length)."""
    a = int(max(0, hold_start) * n)
    b = int(max(0, hold_end) * n)
    mid = max(1, n - a - b)
    t = np.linspace(0, 1, mid) ** curve
    mid_c = start_hz * (end_hz / start_hz) ** t if start_hz > 0 and end_hz > 0 else _lin(mid, start_hz, end_hz)
    return np.concatenate([
        np.full(a, start_hz),
        mid_c,
        np.full(n - a - mid, end_hz)
    ])[:n]


def fade_edges(x, inn=0.02, out=0.02):
    n = len(x)
    a = min(n // 4, int(inn * SR))
    b = min(n // 4, int(out * SR))
    y = np.array(x, dtype=np.float64, copy=True)
    if a:
        ramp = _lin(a, 0, 1)[:, None] if y.ndim == 2 else _lin(a, 0, 1)
        y[:a] *= ramp
    if b:
        ramp = _lin(b, 1, 0)[:, None] if y.ndim == 2 else _lin(b, 1, 0)
        y[-b:] *= ramp
    return y


def apply_sidechain(x, times, depth=0.55, rel=0.16):
    if x.ndim == 1:
        return x * E.sidechain(len(x), times, depth=depth, rel=rel)
    duck = E.sidechain(len(x), times, depth=depth, rel=rel)
    return x * duck[:, None]


# ---------------------------------------------------------------------------
# Vocoder (Daft-style formant bank, original carriers / modulators only)
# ---------------------------------------------------------------------------
def vocoder(carrier, modulator, bands=18, lo=180.0, hi=6400.0, release=0.05):
    """Band envelope vocoder. carrier and modulator are mono, equal length."""
    n = min(len(carrier), len(modulator))
    car = np.asarray(carrier[:n], dtype=np.float64)
    mod = np.asarray(modulator[:n], dtype=np.float64)
    freqs = np.geomspace(lo, hi, bands + 1)
    rel = 1.0 - math.exp(-1.0 / (max(release, 1e-3) * SR))
    att = 1.0 - math.exp(-1.0 / (0.008 * SR))
    out = np.zeros(n)
    for i in range(bands):
        bp_c = E.sos_bp(car, freqs[i], freqs[i + 1], order=2)
        bp_m = E.sos_bp(mod, freqs[i], freqs[i + 1], order=2)
        env = np.zeros(n)
        e = 0.0
        # cheap block envelope
        win = 64
        abs_m = np.abs(bp_m)
        for k in range(0, n, win):
            peak = float(np.max(abs_m[k:k + win]))
            for j in range(k, min(n, k + win)):
                cff = att if peak > e else rel
                e = e + cff * (peak - e)
                env[j] = e
        out += bp_c * env * 6.5
    return E.sos_lp(out, hi * 1.1)


def vocoder_stereo(car_l, car_r, mod, **kw):
    return vocoder(car_l, mod, **kw), vocoder(car_r, mod, **kw)


def vowel_modulator(n, path, f0=140.0):
    """Glottal pulse train whose formants follow a list of (t_frac, (F1,F2,F3))."""
    t = np.arange(n) / SR
    # interpolate formants
    times = np.array([p[0] for p in path]) * (n / SR)
    f1 = np.interp(t, times, [p[1][0] for p in path])
    f2 = np.interp(t, times, [p[1][1] for p in path])
    f3 = np.interp(t, times, [p[1][2] for p in path])
    # glottal
    vib = 1.0 + 0.004 * np.sin(2 * np.pi * 5.2 * t)
    ph = 2 * np.pi * np.cumsum(f0 * vib) / SR
    glot = 0.6 * (0.62 + 0.38 * np.cos(ph)) ** 2 - 0.1
    glot += 0.25 * np.sin(ph)
    # approximate formants with time-varying peaking (block)
    out = np.zeros(n)
    block = 512
    for k in range(0, n, block):
        sl = slice(k, min(n, k + block))
        raw = glot[sl]
        i = (k + (sl.stop - k) // 2)
        formed = (
            1.00 * E.rbj(raw, float(f1[i]), 5.0, "band")
            + 0.70 * E.rbj(raw, float(f2[i]), 4.4, "band")
            + 0.35 * E.rbj(raw, float(f3[i]), 3.4, "band")
        )
        out[sl] = formed
    return E.fade(out, 8, 8)


# ---------------------------------------------------------------------------
# Leads, bass, orchestra
# ---------------------------------------------------------------------------
def avicii_pluck(freq, dur, vel=0.7, bright=0.7):
    """Bright folk-electronic pluck (harp body + short synth tail). Original tone."""
    n = int(max(dur, 0.06) * SR)
    t = np.arange(n) / SR
    # slightly chirped fundamental
    fr = freq * (1.0 + 0.01 * np.exp(-t / 0.01))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    sig = np.sin(ph)
    for k in (2, 3, 4, 6):
        sig += (0.45 / k) * (0.5 + bright) * np.sin(k * ph)
    env = np.exp(-t / (0.09 + 0.10 * (1 - bright)))
    att = min(n, int(0.002 * SR))
    env[:att] *= _lin(att, 0, 1)
    raw = sig * env * vel
    raw = E.sos_lp(raw, 1800 + 7000 * bright)
    # a touch of delay-like stereo
    L = E.fade(raw, 1, 12)
    R = E.fade(np.roll(raw, int(0.004 * SR)) * 0.96, 1, 12)
    return L, R


def funk_bass(freq, dur, vel=0.8, dead=False, slide_from=None):
    """Round, slightly dirty 'live' bass. Dead notes are muted thumps."""
    n = int(max(dur, 0.04) * SR)
    t = np.arange(n) / SR
    if slide_from:
        fr = slide_from * (freq / slide_from) ** np.clip(t / 0.07, 0, 1)
    else:
        fr = np.full(n, freq)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    if dead:
        body = np.sin(ph) * np.exp(-t / 0.04)
        click = E.sos_bp(np.random.default_rng(int(freq * 3) % 99991).standard_normal(n), 80, 400) * np.exp(-t / 0.03)
        sig = (body * 0.7 + click * 0.3) * vel * 0.55
        return E.fade(E.sos_lp(sig, 500), 1, 8)
    fund = np.sin(ph)
    odd = 0.22 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    sig = fund + odd
    sig = saturate(sig, drive=1.4, mix=0.28)
    att = int(0.006 * SR)
    rel = int(min(0.12, dur * 0.35) * SR)
    env = np.ones(n) * vel
    env[:att] = _lin(att, 0, vel)
    env[-rel:] *= _lin(rel, 1, 0)
    # mild pick click
    click = np.exp(-t / 0.008) * 0.12 * vel
    sig = E.sos_lp(sig * env + click * np.sin(2 * np.pi * freq * 4 * t), 720)
    return E.fade(sig, 1, 6)


def string_ensemble(n, freqs, gain=0.1, attack=0.9, release=1.1, bright=0.35):
    t = np.arange(n) / SR
    L = np.zeros(n)
    R = np.zeros(n)
    for i, f in enumerate(freqs):
        if f <= 0:
            continue
        raw = np.zeros(n)
        dets = (-11, -6, -2, 2, 7, 12)
        for j, c in enumerate(dets):
            raw += E.blep_saw(n, f * 2 ** (c / 1200.0), phase0=0.07 * (i + j))
        raw /= len(dets)
        formed = (
            0.7 * E.rbj(raw, 420, 1.4, "band")
            + 0.45 * E.rbj(raw, 1100, 1.2, "band")
            + (0.15 + 0.25 * bright) * E.rbj(raw, 2600, 1.1, "band")
        )
        vib = 1.0 + 0.004 * np.sin(2 * np.pi * (4.8 + 0.15 * i) * t + i)
        formed *= vib
        g = gain / math.sqrt(max(1, len(freqs)))
        pan = ((i % 3) - 1) * 0.45
        sig = E.sos_lp(formed, 2200 + 3500 * bright) * g
        a = min(n // 3, int(attack * SR))
        r = min(n // 3, int(release * SR))
        env = np.ones(n)
        env[:a] = _lin(a, 0, 1) ** 1.15
        env[-r:] *= _lin(r, 1, 0) ** 1.1
        sig *= env
        l = math.sqrt(0.5 * (1 - pan))
        rr = math.sqrt(0.5 * (1 + pan))
        L += sig * l / 0.7071
        R += np.roll(sig, int((0.005 + 0.002 * i) * SR)) * rr / 0.7071
    return L, R


def horn_swell(freq, dur, vel=0.45, bright=0.4):
    n = int(max(dur, 0.3) * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    # odd-rich brass that opens
    bri = _lin(n, 0.15, bright) * (0.3 + 0.7 * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.7)
    sig = np.sin(ph)
    for k, base in ((2, 0.18), (3, 0.22), (4, 0.08), (5, 0.12)):
        sig += (base * bri * 2) * np.sin(k * ph)
    env = env_curve(n, 0.35 * dur, 0.2 * dur, 0.85, 0.3 * dur, vel)
    sig = E.sos_lp(sig, 800 + 2400 * bright) * env
    L = E.fade(sig, 10, 30)
    R = E.fade(np.roll(sig, int(0.007 * SR)), 10, 30)
    return L, R


def env_curve(n, att, dec, sus, rel, peak=1.0):
    return A.env_adsr(n, att_s=att, dec_s=dec, sus=sus, rel_s=rel, peak=peak)


# ---------------------------------------------------------------------------
# Custom drums — layered, processed, never a stock click
# ---------------------------------------------------------------------------
def _rng(seed):
    return np.random.default_rng(seed)


def cinematic_kick(rng, vel=0.8, hard=False):
    """Layered kick: sub sine, mid punch, beater, room. Not a toy 808."""
    dur = 0.48 if hard else 0.38
    n = int(dur * SR)
    t = np.arange(n) / SR
    f0 = 48 if hard else 54
    f = (180 if hard else 150) * np.exp(-t / 0.018) + f0
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.22 if hard else 0.18))
    punch_f = 220 * np.exp(-t / 0.012) + 80
    punch = np.sin(2 * np.pi * np.cumsum(punch_f) / SR) * np.exp(-t / 0.05)
    beater = E.sos_bp(rng.standard_normal(n), 1800, 7000) * np.exp(-t / 0.012) * 0.55
    room = E.sos_bp(rng.standard_normal(n), 200, 1400) * np.exp(-t / 0.09) * 0.22
    sig = saturate(sub * 0.95 + punch * 0.4, drive=1.25, mix=0.2) + beater + room
    sig *= vel
    return E.fade(E.sos_lp(sig, 9000), 0.5, 18)


def taiko(rng, vel=0.7):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    f = 140 * np.exp(-t / 0.04) + 42
    skin = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.28)
    skin += 0.4 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * np.exp(-t / 0.16)
    strike = E.sos_bp(rng.standard_normal(n), 400, 2500) * np.exp(-t / 0.04) * 0.5
    room = E.sos_lp(rng.standard_normal(n), 600) * np.exp(-t / 0.4) * 0.28
    sig = (skin * 0.9 + strike + room) * vel
    return E.fade(E.sos_lp(sig, 4000), 1, 40)


def layered_snare(rng, vel=0.65, tight=False):
    n = int((0.28 if tight else 0.42) * SR)
    t = np.arange(n) / SR
    # body
    f = 200 * np.exp(-t / 0.02) + 160
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.08 if tight else 0.12))
    # wires / noise stack (two colours)
    n1 = E.sos_bp(rng.standard_normal(n), 1500, 5500) * np.exp(-t / (0.06 if tight else 0.1))
    n2 = E.sos_hp(rng.standard_normal(n), 5000) * np.exp(-t / 0.04) * 0.5
    clap = E.sos_bp(rng.standard_normal(n), 800, 2400) * np.exp(-t / 0.05) * 0.45
    sig = saturate(body * 0.55 + n1 * 0.7 + n2 * 0.35 + clap, drive=1.3, mix=0.25) * vel
    return E.fade(sig, 0.6, 16)


def hat(rng, vel=0.3, open_hat=False):
    n = int((0.18 if open_hat else 0.055) * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    # metallic stack of bandpasses
    sig = (
        E.sos_bp(x, 7000, 12000, order=2)
        + 0.5 * E.sos_bp(x, 9000, 16000, order=2)
    )
    dec = 0.08 if open_hat else 0.018
    sig *= np.exp(-t / dec) * vel
    return E.fade(E.sos_hp(sig, 5000), 0.3, 6)


def ghost_stick(rng, vel=0.18):
    """Quiet ghost note — stick on the skin, not a full hit."""
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    x = E.sos_bp(rng.standard_normal(n), 600, 2800) * np.exp(-t / 0.025) * vel
    return E.fade(x, 0.3, 8)


def impact(rng, dur=2.2, vel=0.7):
    """Cinematic impact: sub drop, crunch, long tail. Not a dance kick."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 90 * np.exp(-t / 0.12) + 22
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    crunch = E.sos_bp(rng.standard_normal(n), 200, 1800) * np.exp(-t / 0.35)
    air = E.sos_hp(rng.standard_normal(n), 2500) * np.exp(-t / 0.2) * 0.35
    sig = saturate(sub * 0.9 + crunch * 0.45, drive=1.5, mix=0.3) + air
    sig *= vel
    L = E.fade(sig, 4, 200)
    R = E.fade(np.roll(sig, int(0.012 * SR)) * 0.96 + E.sos_bp(rng.standard_normal(n), 300, 2000) * np.exp(-t / 0.3) * 0.08 * vel, 4, 200)
    return L, R


def riser(rng, dur, start_hz=200, end_hz=9000, vel=0.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    # noise + rising tone cluster
    noise = rng.standard_normal(n)
    cut = start_hz * (end_hz / start_hz) ** (t / dur)
    # block-lpf
    noise = lp_tv(noise, cut, Q=0.85, block=256)
    noise = E.sos_hp(noise, 200)
    tone_f = start_hz * 0.5 * (end_hz / start_hz) ** (t / dur)
    tone = np.sin(2 * np.pi * np.cumsum(tone_f) / SR) * 0.18
    env = (t / dur) ** 1.4 * vel
    sig = (noise * 0.85 + tone) * env
    L = E.fade(sig, 8, 8)
    R = E.fade(np.roll(sig, int(0.01 * SR)), 8, 8)
    return L, R


def downlifter(rng, dur=1.2, vel=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    cut = 8000 * (400 / 8000) ** (t / dur)
    x = lp_tv(E.sos_hp(rng.standard_normal(n), 300), cut)
    env = (1 - t / dur) ** 0.7 * vel
    return E.fade(x * env, 4, 8)


def reverse_swell(sig, fade_s=None):
    y = np.asarray(sig, dtype=np.float64)[::-1].copy()
    return E.fade(y, 4, 4)


# ---------------------------------------------------------------------------
# Groove helpers — written hits, not tiled 1-bar loops
# ---------------------------------------------------------------------------
def swing_time(beat_pos, swing=0.12, spb=0.5):
    """Delay off-16ths. beat_pos is in beats (quarters)."""
    # 16th index
    six = beat_pos * 4.0
    # odd 16ths get swing (as a fraction of a 16th)
    odd = int(round(six)) % 2 == 1
    delay = (swing * (spb / 4.0)) if odd else 0.0
    return beat_pos * spb + delay


def humanize(t, rng, amt=0.008):
    return t + rng.uniform(-amt, amt)


def place_mono(bus, t, sig, gain=1.0, pan=0.0):
    E.add_mono(bus, t, sig, gain=gain, pan=pan)


def place_stereo(bus, t, L, R, gain=1.0):
    E.add_stereo(bus, t, L, R, gain=gain)


# ---------------------------------------------------------------------------
# Mix bus
# ---------------------------------------------------------------------------
def depth_mix(close, mid, far, perc=None, close_g=1.0, mid_g=0.85, far_g=0.7, perc_g=0.9):
    n = max(len(close), len(mid), len(far), 0 if perc is None else len(perc))
    def pad(x):
        if len(x) < n:
            z = np.zeros((n, 2))
            z[:len(x)] = x
            return z
        return x[:n]
    y = pad(close) * close_g + pad(mid) * mid_g + pad(far) * far_g
    if perc is not None:
        y = y + pad(perc) * perc_g
    return y


def polish_stem(x, hp=30.0, air_db=0.0, mud_cut_db=0.0):
    y = A.highpass(x, hp)
    if mud_cut_db:
        # gentle mid scoop around 280 Hz
        for ch in range(y.shape[1]):
            y[:, ch] = y[:, ch] + (10 ** (mud_cut_db / 20.0) - 1.0) * E.rbj(y[:, ch], 280, 0.9, "band")
    if air_db:
        y = stereo_shelf(y, 9000, air_db, typ="high")
    return y
