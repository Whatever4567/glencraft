#!/usr/bin/env python3
"""Shared pro-quality synth engine for the 1.2.50 soundtrack.

Band-limited oscillators, layered kick, FM+resonant donk / reverse-bass,
detuned supersaw, clap stack, formant choir, FM glass bells, a dense
convolution IR, and a gentle true-peak limiter. No third-party samples.
"""
from __future__ import annotations

import numpy as np
from scipy.signal import butter, sosfilt, lfilter

SR = 44100


def fade(sig, ms_in=4, ms_out=8):
    n = len(sig)
    a = min(max(n // 4, 1), int(ms_in * SR / 1000.0))
    b = min(max(n // 4, 1), int(ms_out * SR / 1000.0))
    out = np.array(sig, dtype=np.float64, copy=True)
    if a:
        out[:a] *= np.linspace(0.0, 1.0, a)
    if b:
        out[-b:] *= np.linspace(1.0, 0.0, b)
    return out


def sos_lp(x, hz, order=2):
    hz = min(max(hz, 20.0), SR * 0.45)
    return sosfilt(butter(order, hz, btype="lowpass", fs=SR, output="sos"), x)


def sos_hp(x, hz, order=2):
    hz = min(max(hz, 20.0), SR * 0.45)
    return sosfilt(butter(order, hz, btype="highpass", fs=SR, output="sos"), x)


def sos_bp(x, lo, hi, order=2):
    lo = max(30.0, min(lo, SR * 0.4))
    hi = max(lo + 30.0, min(hi, SR * 0.49))
    return sosfilt(butter(order, [lo, hi], btype="bandpass", fs=SR, output="sos"), x)


def tanh_sat(x, drive=1.2):
    d = max(drive, 1e-6)
    return np.tanh(x * d) / np.tanh(d)


# --- RBJ biquads (high-Q bandpass / lowshelf etc.) ---------------------------------
def rbj_sos(f0, Q, typ="band", sr=SR, gain_db=0.0):
    w0 = 2 * np.pi * max(20.0, min(f0, sr * 0.45)) / sr
    cos, sin = np.cos(w0), np.sin(w0)
    alpha = sin / (2 * max(Q, 0.05))
    if typ == "band":
        b0, b1, b2 = alpha, 0.0, -alpha
        a0, a1, a2 = 1 + alpha, -2 * cos, 1 - alpha
    elif typ == "low":
        b0 = (1 - cos) / 2
        b1 = 1 - cos
        b2 = (1 - cos) / 2
        a0, a1, a2 = 1 + alpha, -2 * cos, 1 - alpha
    elif typ == "high":
        b0 = (1 + cos) / 2
        b1 = -(1 + cos)
        b2 = (1 + cos) / 2
        a0, a1, a2 = 1 + alpha, -2 * cos, 1 - alpha
    elif typ == "peak":
        A = 10 ** (gain_db / 40.0)
        b0 = 1 + alpha * A
        b1 = -2 * cos
        b2 = 1 - alpha * A
        a0 = 1 + alpha / A
        a1 = -2 * cos
        a2 = 1 - alpha / A
    elif typ == "highshelf":
        A = 10 ** (gain_db / 40.0)
        two_sa = 2 * np.sqrt(A) * alpha
        b0 = A * ((A + 1) + (A - 1) * cos + two_sa)
        b1 = -2 * A * ((A - 1) + (A + 1) * cos)
        b2 = A * ((A + 1) + (A - 1) * cos - two_sa)
        a0 = (A + 1) - (A - 1) * cos + two_sa
        a1 = 2 * ((A - 1) - (A + 1) * cos)
        a2 = (A + 1) - (A - 1) * cos - two_sa
    else:
        raise ValueError(typ)
    return np.array([[b0 / a0, b1 / a0, b2 / a0, 1.0, a1 / a0, a2 / a0]], dtype=np.float64)


def rbj(x, f0, Q, typ="band", gain_db=0.0):
    return sosfilt(rbj_sos(f0, Q, typ, SR, gain_db), x)


def rbj_tv_low(x, cutoff, Q, block=256):
    """Time-varying RBJ lowpass; cutoff is a per-sample array."""
    n = len(x)
    y = np.zeros(n)
    z = np.zeros(2)
    for i0 in range(0, n, block):
        i1 = min(n, i0 + block)
        fc = float(np.mean(cutoff[i0:i1]))
        sos = rbj_sos(fc, Q, "low")
        # direct form II transients: use lfilter with zi
        b, a = sos[0, :3], sos[0, 3:]
        y[i0:i1], zf = lfilter(b, a, x[i0:i1], zi=z)
        z = zf
    return y


# --- Band-limited oscillators ------------------------------------------------------
def blep_saw(n, freq, sr=SR, phase0=0.0):
    dt = np.float64(freq) / sr
    if dt <= 0:
        return np.zeros(n)
    phase = (phase0 + np.arange(n, dtype=np.float64) * dt) % 1.0
    y = 2.0 * phase - 1.0
    m1 = phase < dt
    x = phase[m1] / dt
    y[m1] -= x + x - x * x - 1.0
    m2 = phase > (1.0 - dt)
    x = (phase[m2] - 1.0) / dt
    y[m2] -= x + x + x * x + 1.0
    return y


def blep_square(n, freq, sr=SR, phase0=0.0, pw=0.5):
    # two saws
    return blep_saw(n, freq, sr, phase0) - blep_saw(n, freq, sr, phase0 + pw)


def sine(n, freq, sr=SR, phase0=0.0):
    return np.sin(2 * np.pi * (phase0 + np.arange(n) * freq / sr))


def sine_sweep(freq_hz):
    """freq_hz is a per-sample instantaneous frequency array."""
    return np.sin(2 * np.pi * np.cumsum(freq_hz) / SR)


# --- Drums ------------------------------------------------------------------------
def make_kick(rng, dur=0.155):
    """Punchy clean UK-hardcore kick: 50 Hz fundamental, short click, short tail.

    Pitch drops to 50 Hz in a few milliseconds so 40–60 Hz is the spectral peak.
    The sub decays in ~55 ms and the whole hit is over before the off-beat donk
    (181 ms at 165 BPM), so the donk can own 60–100 Hz without the kick masking it.
    """
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 50.0 + 110.0 * np.exp(-t / 0.0075)
    body = sine_sweep(f) * (1.0 - np.exp(-t / 0.0007)) * np.exp(-t / 0.036)
    sub = np.sin(2 * np.pi * 50.0 * t) * (1.0 - np.exp(-t / 0.0012)) * np.exp(-t / 0.052) * 1.20
    punch = np.sin(2 * np.pi * 62.0 * t) * np.exp(-t / 0.009) * 0.18
    noise = rng.standard_normal(n)
    click = sos_hp(noise, 4000) * np.exp(-t / 0.0026) * 0.42
    click += sos_bp(noise, 2500, 6500) * np.exp(-t / 0.0035) * 0.16
    sig = body * 0.55 + sub + punch + click
    sig = tanh_sat(sig, 1.08)
    k = int(0.010 * SR)
    sig[-k:] *= np.linspace(1, 0, k)
    return sig.astype(np.float64)


def make_donk(freq, rng, spb, style="bounce"):
    """Hollow metallic 2-op FM donk on the off-beat.

    Carrier an octave above the root, modulator ratio 1.75 (between 1.5 and
    2), a short pitch-dropping envelope and a fast-decaying FM index. Resonant
    band-passes give the classic UK bounce 'donk' hollow mid. High-passed and
    notched at 50 Hz so it does not mask the kick fundamental. A quiet
    high-passed reverse-bass still leans into the next kick.
    """
    dur = spb * 0.84
    n = int(dur * SR)
    t = np.arange(n) / SR
    fade_out = np.ones(n)
    tail = int(0.016 * SR)
    fade_out[-tail:] = np.linspace(1, 0, tail)

    # Pitch drop: ~+10 st down to the octave-up carrier in ~20 ms
    drop_st = 10.0 * np.exp(-t / 0.018)
    f_car = (freq * 2.0) * (2.0 ** (drop_st / 12.0))
    ratio = 1.75
    f_mod = f_car * ratio
    idx = 7.2 * np.exp(-t / 0.020) + 0.35
    ph_m = 2 * np.pi * np.cumsum(f_mod) / SR
    ph_c = 2 * np.pi * np.cumsum(f_car) / SR
    fm = np.sin(ph_c + idx * np.sin(ph_m))

    # Hollow metallic resonances (mid is the donk; keep out of the kick band)
    donk = rbj(fm, 430, 4.4, "band") * 0.70
    donk += rbj(fm, 680, 5.2, "band") * 1.05
    donk += rbj(fm, 980, 3.6, "band") * 0.48
    donk += rbj(fm, 1480, 2.8, "band") * 0.22
    donk += rbj(fm, 2200, 2.2, "band") * 0.08

    denv = (0.62 * np.exp(-t / 0.090) + 0.38 * np.exp(-t / 0.20)) * fade_out
    att = int(0.0018 * SR)
    denv[:att] *= np.linspace(0, 1, att)

    # Mid-bass thump 90–200 Hz (octave weight) plus a short root thunk
    # at 58–73 Hz (the 60–80 Hz bounce band of the reference). The thunk
    # decays fast so it does not become a 50 Hz sub that masks the kick.
    body = sos_bp(np.sin(ph_c), 90, 220)
    benv = np.exp(-t / 0.090) * fade_out
    benv[:att] *= np.linspace(0, 1, att)
    root = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.085) * fade_out
    root[:att] *= np.linspace(0, 1, att)
    # 1.5× root sits in 87–110 Hz (the reference's 80–100 Hz donk band)
    upper = np.sin(2 * np.pi * freq * 1.5 * t) * np.exp(-t / 0.070) * fade_out
    upper[:att] *= np.linspace(0, 1, att)

    # Quiet reverse-bass, high-passed so it cannot mask the kick
    saw = np.zeros(n)
    for cents, amp in ((-9, 0.45), (0, 0.7), (9, 0.45)):
        saw += amp * blep_saw(n, freq * 2 ** (cents / 1200.0), phase0=0.07 * (cents + 12))
    saw = tanh_sat(saw / 1.7, 1.4)
    cut = 280 + 420 * (t / (t[-1] + 1e-12)) ** 0.7
    saw = sos_hp(rbj_tv_low(saw, cut, Q=1.1), 110)
    rb_env = (t / (t[-1] + 1e-12)) ** 0.62 * fade_out * 0.50

    sig = donk * denv * 1.55 + body * benv * 1.10 + root * 1.20 + upper * 1.10 + saw * rb_env
    # Keep rumble below the lowest donk root out; notch the kick fundamental narrowly
    sig = sos_hp(sig, 54)
    sig = rbj(sig, 50, 5.5, "peak", gain_db=-7.0)
    sig = tanh_sat(sig, 1.22) * fade_out
    return sig.astype(np.float64)


def make_clap(rng):
    """Layered clap: 4 delayed noise bursts + short bright plate-ish tail."""
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for off, amp in ((0.0, 1.0), (0.011, 0.8), (0.019, 0.55), (0.030, 0.38)):
        i = int(off * SR)
        burst = sos_bp(rng.standard_normal(n - i), 800, 5200)
        burst *= np.exp(-np.arange(n - i) / SR / 0.032) * amp
        sig[i:] += burst
    # thin snare body
    sig += np.sin(2 * np.pi * 210 * t) * np.exp(-t / 0.03) * 0.22
    sig += sos_bp(rng.standard_normal(n), 1500, 8000) * np.exp(-t / 0.05) * 0.2
    sig = tanh_sat(sig, 1.2)
    return fade(sig, 0.8, 40)


def make_snare(rng):
    n = int(0.2 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.035)
    noise = sos_bp(rng.standard_normal(n), 600, 10000) * np.exp(-t / 0.055)
    return fade(tanh_sat(body * 0.5 + noise, 1.15), 0.8, 16)


def make_hat(rng, open_hat=False):
    """Metallic closed/open hat: HP noise through a few high resonant peaks."""
    dur = 0.16 if open_hat else 0.048
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    x = sos_hp(noise, 7000)
    x += rbj(noise, 8000, 7, "band") * 0.5
    x += rbj(noise, 10500, 8, "band") * 0.35
    x *= np.exp(-t / (0.085 if open_hat else 0.018))
    return fade(x, 0.4, 5)


def make_crash(rng):
    n = int(1.8 * SR)
    t = np.arange(n) / SR
    x = sos_hp(rng.standard_normal(n), 2400)
    x += rbj(rng.standard_normal(n), 6000, 2.5, "band") * 0.4
    x *= np.exp(-t / 0.6)
    return fade(x, 2, 80)


def make_riser(rng, dur, start_hz=180, end_hz=10000):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    chunks = 40
    for k in range(chunks):
        a = int(k * n / chunks)
        b = int((k + 1) * n / chunks)
        p = k / max(chunks - 1, 1)
        hz = start_hz * (end_hz / start_hz) ** p
        out[a:b] = sos_hp(noise[a:b], hz)
    env = (t / dur) ** 1.35
    f = start_hz * (end_hz / start_hz) ** (t / dur)
    sweep = sine_sweep(f) * env * 0.16
    return fade(out * env * 0.95 + sweep, 10, 5)


def make_sweep(rng, dur=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = sos_bp(rng.standard_normal(n), 400, 12000)
    return noise * (np.sin(np.pi * t / dur) ** 1.15)


def make_impact(rng):
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    low = sine_sweep(80 * np.exp(-t / 0.05) + 36) * np.exp(-t / 0.2)
    noise = sos_hp(rng.standard_normal(n), 180) * np.exp(-t / 0.14)
    return fade(tanh_sat(low * 0.95 + noise * 0.45, 1.25), 1, 30)


# --- Tonal ------------------------------------------------------------------------
def supersaw(freq, dur, det=18, n_osc=7, cutoff=8000, hp=230):
    n = int(dur * SR)
    s = np.zeros(n)
    dets = np.linspace(-det, det, n_osc)
    for i, c in enumerate(dets):
        s += blep_saw(n, freq * 2 ** (c / 1200.0), phase0=0.07 * i)
    s /= n_osc
    s = sos_hp(s, hp)
    s = sos_lp(s, cutoff)
    att, rel = int(0.01 * SR), int(0.035 * SR)
    env = np.ones(n)
    if att < n:
        env[:att] = np.linspace(0, 1, att)
    if rel < n:
        env[-rel:] = np.linspace(1, 0, rel)
    return s * env


def supersaw_stereo(freq, dur, det=18, n_osc=7, cutoff=8000):
    """Return (L, R) with odd/even unison spread + a mono centre saw."""
    n = int(dur * SR)
    L, R = np.zeros(n), np.zeros(n)
    dets = np.linspace(-det, det, n_osc)
    for i, c in enumerate(dets):
        w = blep_saw(n, freq * 2 ** (c / 1200.0), phase0=0.09 * i)
        if i == n_osc // 2:
            L += w * 0.7
            R += w * 0.7
        elif i % 2 == 0:
            L += w
            R += w * 0.25
        else:
            R += w
            L += w * 0.25
    L = sos_lp(sos_hp(L / (n_osc * 0.7), 230), cutoff)
    R = sos_lp(sos_hp(R / (n_osc * 0.7), 230), cutoff)
    att, rel = int(0.01 * SR), int(0.035 * SR)
    env = np.ones(n)
    env[:att] = np.linspace(0, 1, att)
    env[-rel:] = np.linspace(1, 0, rel)
    return L * env, R * env


def lead_note(freq, dur, cutoff=4200):
    """Pitched-up vocal-style hook: glottal pulse through vowel formants.

    Nightcore / happy-hardcore 'vocal' timbre: a soft pulse + sine body, brief
    portamento, and eh/ah formants. No bright 7.5 kHz pulse/supersaw. High
    notes keep a sung fundamental so they do not go thin or hollow.
    """
    n = int(max(dur, 0.03) * SR)
    t = np.arange(n) / SR
    f0 = freq * (1.0 - 0.055 * np.exp(-t / 0.028))
    vib = 1.0 + 0.006 * np.sin(2 * np.pi * 5.4 * t)
    ph = 2 * np.pi * np.cumsum(f0 * vib) / SR
    # soft glottal pulse (warmer than a square) + detuned copy
    glot = 0.55 * (0.62 + 0.38 * np.cos(ph)) ** 2 - 0.12
    glot += 0.32 * np.sin(ph)
    glot2 = 0.55 * (0.62 + 0.38 * np.cos(ph * 1.0035)) ** 2 - 0.12
    core = np.sin(ph) * 0.55 + 0.22 * np.sin(2 * ph)
    raw = glot * 0.50 + glot2 * 0.22 + core * 0.55
    seed = int(abs(freq * 10)) % 99991 + 3
    breath = sos_bp(np.random.default_rng(seed).standard_normal(n), 1600, 5200) * 0.045
    raw = raw + breath
    formed = (
        1.00 * rbj(raw, 820, 5.4, "band")
        + 0.72 * rbj(raw, 1580, 4.6, "band")
        + 0.38 * rbj(raw, 2680, 3.6, "band")
        + 0.16 * rbj(raw, 3700, 2.8, "band")
    )
    body = sos_lp(raw, 1400) * 0.50
    sig = sos_lp(formed * 0.80 + body, float(cutoff))
    att = int(0.012 * SR)
    rel = max(int(0.06 * SR), int(0.22 * n))
    env = np.ones(n)
    env[: min(att, n)] = np.linspace(0, 1, min(att, n)) ** 0.7
    if rel < n:
        env[-rel:] = np.linspace(1, 0, rel)
    L = sig * env
    R = np.roll(sig, int(0.007 * SR)) * env
    return fade(L, 3, 10), fade(R, 3, 10)


# --- Choir / bells / IR -----------------------------------------------------------
def choir_voice(n, freq, formants, detune=9, rng=None):
    """Breathy detuned choir: soft saws, vowel formants, deep body, air."""
    raw = np.zeros(n)
    n_osc = 7
    dets = np.linspace(-detune, detune, n_osc)
    for i, c in enumerate(dets):
        raw += blep_saw(n, freq * 2 ** (c / 1200.0), phase0=0.05 * i)
    raw /= n_osc
    t = np.arange(n) / SR
    raw += 0.28 * (2 / np.pi) * np.arcsin(np.sin(2 * np.pi * freq * t))
    if freq > 40:
        raw += 0.18 * np.sin(2 * np.pi * (freq * 0.5) * t)
    if rng is not None:
        raw += sos_bp(rng.standard_normal(n), 180, 900) * 0.07
        raw += sos_bp(rng.standard_normal(n), 1800, 5500) * 0.055
    formed = np.zeros(n)
    gains = (0.85, 0.55, 0.28)
    qs = (3.4, 3.0, 2.5)
    for fc, g, q in zip(formants, gains, qs):
        formed += g * rbj(raw, fc, q, "band")
    body = sos_lp(raw, 420) * 0.95
    return sos_lp(formed * 0.70 + body, 3000)


def fm_glass_bell(freq, dur, rng, ratio=3.71, index0=4.2):
    """Inharmonic FM glass / crystal bell with a long fade."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    idx = index0 * np.exp(-t / (dur * 0.22))
    mod = np.sin(2 * np.pi * freq * ratio * t)
    car = np.sin(2 * np.pi * freq * t + idx * mod)
    # second partial slightly inharmonic
    car += 0.28 * np.sin(2 * np.pi * freq * 2.01 * t + 0.6 * idx * np.sin(2 * np.pi * freq * 5.04 * t))
    env = np.exp(-t / (dur * 0.32))
    att = int(0.012 * SR)
    env[:att] *= np.linspace(0, 1, att)
    glass = sos_bp(rng.standard_normal(n), 2500, 9000) * np.exp(-t / 0.07) * 0.06
    # A touch of air so the drip sparkles, without a fizzy 10 kHz tail.
    return fade(sos_lp(car * env + glass, 7500), 6, 400)


def make_cave_ir(sec, rng, decay_pow=1.75, dark=2800):
    """Dense stereo IR: early reflections + frequency-dependent tail."""
    n = int(sec * SR)
    ir = np.zeros((n, 2))
    # early reflections 12–90 ms
    for ch in (0, 1):
        for _ in range(18):
            tms = 12 + rng.random() * 80
            i = int(tms * SR / 1000)
            if i < n:
                ir[i, ch] += rng.uniform(-1, 1) * (0.35 ** (tms / 40.0))
    # dense tail
    t = np.arange(n) / n
    env = (1 - t) ** decay_pow
    # highs die faster: start brighter, lowpass closes
    noise_l = rng.standard_normal(n) * env
    noise_r = rng.standard_normal(n) * env
    chunks = 24
    for k in range(chunks):
        a = int(k * n / chunks)
        b = int((k + 1) * n / chunks)
        p = k / max(chunks - 1, 1)
        hz = dark * (0.25 ** p)  # closes toward the dark end
        noise_l[a:b] = sos_lp(noise_l[a:b], max(400, hz))
        noise_r[a:b] = sos_lp(noise_r[a:b], max(380, hz * 0.95))
    ir[:, 0] += noise_l * 0.9
    ir[:, 1] += noise_r * 0.9
    # pre-delay is applied by the caller (pad zeros)
    peak = np.max(np.abs(ir)) + 1e-12
    return ir / peak


def convolve_stereo(x, ir, wet=0.7, dry=0.3, predelay_s=0.06):
    from scipy.signal import fftconvolve
    pd = int(predelay_s * SR)
    padded = np.vstack([np.zeros((pd, 2)), ir])
    y = np.zeros((len(x), 2))
    for ch in (0, 1):
        conv = fftconvolve(x[:, ch], padded[:, ch], mode="full")
        y[:, ch] = conv[: len(x)]
    peak = np.max(np.abs(y)) + 1e-12
    src_peak = np.max(np.abs(x)) + 1e-12
    y = y / peak * src_peak * 1.35
    return x * dry + y * wet


# --- Mix helpers ------------------------------------------------------------------
def add_mono(bus, t0, sig, gain=1.0, pan=0.0, sr=SR):
    i0 = int(round(t0 * sr))
    if i0 >= bus.shape[0] or len(sig) == 0:
        return
    if i0 < 0:
        sig = sig[-i0:]
        i0 = 0
        if len(sig) == 0:
            return
    n = min(len(sig), bus.shape[0] - i0)
    if n <= 0:
        return
    l = np.sqrt(0.5 * (1.0 - pan)) * gain
    r = np.sqrt(0.5 * (1.0 + pan)) * gain
    bus[i0:i0 + n, 0] += sig[:n] * l
    bus[i0:i0 + n, 1] += sig[:n] * r


def add_stereo(bus, t0, left, right, gain=1.0, sr=SR):
    i0 = int(round(t0 * sr))
    if i0 >= bus.shape[0]:
        return
    if i0 < 0:
        left, right = left[-i0:], right[-i0:]
        i0 = 0
    n = min(len(left), len(right), bus.shape[0] - i0)
    if n <= 0:
        return
    bus[i0:i0 + n, 0] += left[:n] * gain
    bus[i0:i0 + n, 1] += right[:n] * gain


def sidechain(n, kick_times, depth=0.8, rel=0.12, sr=SR):
    duck = np.ones(n)
    n_d = int((rel * 2.2) * sr)
    t = np.arange(n_d) / sr
    curve = 1.0 - depth * np.exp(-t / rel)
    for tk in kick_times:
        i = int(round(tk * sr))
        if i >= n or i < 0:
            continue
        j = min(n_d, n - i)
        duck[i:i + j] = np.minimum(duck[i:i + j], curve[:j])
    return duck


def ping_pong_delay(x, delay_s, fb=0.28, mix=0.22):
    d = int(delay_s * SR)
    if d <= 0 or 2 * d >= len(x):
        return x
    y = np.zeros_like(x)
    y[d:, 1] += x[:-d, 0]
    y[2 * d:, 0] += x[:-2 * d, 0] * fb
    y[d:, 0] += x[:-d, 1] * 0.7
    y[2 * d:, 1] += x[:-2 * d, 1] * fb
    return x * (1 - mix) + y * mix


def glue(x, thresh=0.42, ratio=1.8, att_s=0.006, rel_s=0.16):
    """Gentle glue only — do not squash loudness range."""
    peak = np.maximum(np.max(np.abs(x), axis=1), 1e-9)
    att = 1 - np.exp(-1 / (att_s * SR))
    rel = 1 - np.exp(-1 / (rel_s * SR))
    env = np.zeros_like(peak)
    e = 0.0
    for i, p in enumerate(peak):
        e = e + (att if p > e else rel) * (p - e)
        env[i] = e
    gain = np.ones_like(env)
    over = env > thresh
    gain[over] = (thresh + (env[over] - thresh) / ratio) / env[over]
    gain = np.convolve(gain, np.ones(16) / 16, mode="same")
    return x * gain[:, None]


def limiter(x, ceiling=10 ** (-1.0 / 20.0), look_ms=5):
    """Safety true-peak catcher, not a loudness crusher."""
    from scipy.ndimage import maximum_filter1d
    look = int(look_ms * SR / 1000)
    peak = np.max(np.abs(x), axis=1)
    padded = np.pad(peak, (0, look), mode="edge")
    fut = maximum_filter1d(padded, size=look + 1, origin=look // 2, mode="nearest")[: len(peak)]
    gain = np.ones_like(peak)
    mask = fut > ceiling
    gain[mask] = ceiling / (fut[mask] + 1e-12)
    rel = 1 - np.exp(-1.0 / (0.12 * SR))
    out_g = np.empty_like(gain)
    g = 1.0
    for i, t in enumerate(gain):
        g = t if t < g else g + rel * (t - g)
        out_g[i] = g
    return np.clip(x * out_g[:, None], -ceiling, ceiling)


def seamless_loop(x, xfade_s=0.08, polish_s=0.01, sr=SR):
    """Equal-power end→start crossfade, then a short smoothstep so the wrap step is 0."""
    y = np.array(x, dtype=np.float64, copy=True)
    c = max(8, int(xfade_s * sr))
    c = min(c, len(y) // 8)
    t = np.linspace(0, 1, c)[:, None]
    y[-c:] = y[-c:] * np.cos(t * np.pi / 2) + y[:c] * np.sin(t * np.pi / 2)
    # bring last sample exactly onto first (inaudible 1-sample continuity)
    p = max(8, int(polish_s * sr))
    # smoothstep 0..1
    u = np.linspace(0, 1, p)[:, None]
    w = u * u * (3 - 2 * u)
    target = y[0]
    y[-p:] += (target - y[-1]) * w
    return y


def make_noise_sweep(rng, dur, up=True, lo=200, hi=12000):
    """White-noise filter sweep (uplifter or downlifter) with a slight sine zip."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    p = t / max(dur, 1e-9)
    if not up:
        p = 1.0 - p
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    chunks = max(24, int(dur * 20))
    for k in range(chunks):
        a = int(k * n / chunks)
        b = int((k + 1) * n / chunks)
        q = k / max(chunks - 1, 1)
        if not up:
            q = 1.0 - q
        hz = lo * (hi / lo) ** q
        out[a:b] = sos_hp(noise[a:b], hz)
    env = p ** 1.15
    f = lo * (hi / lo) ** p
    zipw = sine_sweep(f) * env * 0.10
    return fade(out * env * 0.95 + zipw, 8, 4)


def make_reverse_cymbal(rng, dur=0.7):
    c = make_crash(rng)
    r = c[::-1]
    n = int(dur * SR)
    if len(r) < n:
        r = np.pad(r, (n - len(r), 0))
    r = r[-n:]
    r *= np.linspace(0.05, 1.0, len(r)) ** 1.2
    return fade(r, 8, 3)


def make_zap(freq, dur=0.09):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * (2.0 ** (8 * np.exp(-t / 0.018)))
    sig = sine_sweep(f) * np.exp(-t / 0.04)
    sig += sos_bp(np.sin(2 * np.pi * np.cumsum(f * 2.1) / SR), 800, 4000) * np.exp(-t / 0.03) * 0.3
    return fade(tanh_sat(sig, 1.3), 0.6, 8)



def parallel_sat(x, drive=2.6, mix=0.42, hp=70, focus_hz=92):
    """Parallel saturation: keep the dry fundamental, add harmonics.

    High-passed so the 50 Hz kick band stays clean. A mild 90 Hz peak on the
    wet path puts extra bounce weight in 80–100 Hz.
    """
    if x.ndim == 1:
        wet = tanh_sat(x, drive)
        wet = sos_hp(wet, hp)
        wet = rbj(wet, focus_hz, 1.3, "peak", gain_db=3.0)
        return x + wet * mix
    y = np.zeros_like(x)
    for ch in range(x.shape[1]):
        wet = tanh_sat(x[:, ch], drive)
        wet = sos_hp(wet, hp)
        wet = rbj(wet, focus_hz, 1.3, "peak", gain_db=3.0)
        y[:, ch] = x[:, ch] + wet * mix
    return y

def mono_below(x, hz=150):
    """Force the low end to mono; keep stereo above hz."""
    low_l = sos_lp(x[:, 0], hz, 2)
    low_r = sos_lp(x[:, 1], hz, 2)
    low = 0.5 * (low_l + low_r)
    high_l = x[:, 0] - low_l
    high_r = x[:, 1] - low_r
    return np.stack([low + high_l, low + high_r], 1)


def widen_highs(x, hz=500, amount=1.35):
    """Widen the side signal above hz, leave the low mid alone."""
    mid = 0.5 * (x[:, 0] + x[:, 1])
    side = 0.5 * (x[:, 0] - x[:, 1])
    side_lo = sos_lp(side, hz, 2)
    side_hi = side - side_lo
    side = side_lo + side_hi * amount
    return np.stack([mid + side, mid - side], 1)


def true_peak_limiter(x, ceiling=10 ** (-1.0 / 20.0), look_ms=6, os=4):
    """Lookahead limiter with simple oversampling so true-peak stays under ceiling."""
    from scipy.ndimage import maximum_filter1d
    from scipy.signal import resample_poly
    # 4x oversample a mono peak proxy
    peak_s = np.max(np.abs(x), axis=1)
    up = resample_poly(peak_s, os, 1)
    look = int(look_ms * SR * os / 1000)
    padded = np.pad(np.abs(up), (0, look), mode="edge")
    fut = maximum_filter1d(padded, size=look + 1, origin=look // 2, mode="nearest")[: len(up)]
    # downsample future-peak envelope
    fut_ds = resample_poly(fut, 1, os)[: len(peak_s)]
    gain = np.ones_like(peak_s)
    mask = fut_ds > ceiling
    gain[mask] = ceiling / (fut_ds[mask] + 1e-12)
    rel = 1 - np.exp(-1.0 / (0.08 * SR))
    out_g = np.empty_like(gain)
    g = 1.0
    for i, t in enumerate(gain):
        g = t if t < g else g + rel * (t - g)
        out_g[i] = g
    y = x * out_g[:, None]
    return np.clip(y, -ceiling, ceiling)


# --- Pro drum layers, vocoder, disco filter ------------------------------------
def make_kick_pro(rng, style="drop"):
    """Layered kick: sub, body, knock, click, a short saturated crack.

    style: drop (festival punch, short tail), tight (builds), soft (breakdown),
    slam (drop-2, slightly harder transient). Tail is always over before the
    off-beat donk at 165 BPM (~181 ms).
    """
    dur = {"drop": 0.155, "tight": 0.12, "soft": 0.20, "slam": 0.15}[style]
    n = int(dur * SR)
    t = np.arange(n) / SR
    sub_t = {"drop": 0.050, "tight": 0.038, "soft": 0.070, "slam": 0.048}[style]
    f = 50.0 + 130.0 * np.exp(-t / 0.0065)
    body = sine_sweep(f) * (1.0 - np.exp(-t / 0.0006)) * np.exp(-t / 0.032)
    sub = np.sin(2 * np.pi * 50.0 * t) * (1.0 - np.exp(-t / 0.0010)) * np.exp(-t / sub_t) * 1.22
    # very short mid knock — dies in ~12 ms so it cannot mask the donk
    knock = np.sin(2 * np.pi * 180.0 * t) * np.exp(-t / 0.010) * (0.22 if style != "soft" else 0.10)
    punch = np.sin(2 * np.pi * 62.0 * t) * np.exp(-t / 0.008) * (0.16 if style != "soft" else 0.08)
    noise = rng.standard_normal(n)
    click = sos_hp(noise, 4500) * np.exp(-t / 0.0022) * (0.48 if style in ("drop", "slam") else 0.28)
    click += sos_bp(noise, 2200, 7000) * np.exp(-t / 0.0030) * 0.18
    crack = tanh_sat(sos_bp(noise, 800, 2400) * np.exp(-t / 0.004), 2.2) * (0.22 if style == "slam" else 0.12)
    sig = body * 0.55 + sub + knock + punch + click + crack
    drive = {"drop": 1.12, "tight": 1.08, "soft": 1.04, "slam": 1.22}[style]
    sig = tanh_sat(sig, drive)
    k = int(0.008 * SR)
    sig[-k:] *= np.linspace(1, 0, k)
    return sig.astype(np.float64)


def make_snare_pro(rng, kind="hit"):
    """Hybrid snare: tonal body, noise crack, short room. kind=hit/ghost/rim."""
    dur = {"hit": 0.28, "ghost": 0.11, "rim": 0.07}[kind]
    n = int(dur * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.028) * (0.7 if kind == "hit" else 0.25)
    body += np.sin(2 * np.pi * 285 * t) * np.exp(-t / 0.018) * 0.25
    crack = sos_bp(rng.standard_normal(n), 900, 9000) * np.exp(-t / (0.045 if kind == "hit" else 0.018))
    room = sos_bp(rng.standard_normal(n), 400, 3500) * np.exp(-t / 0.12) * (0.35 if kind == "hit" else 0.05)
    rim = sos_bp(rng.standard_normal(n), 2000, 8000) * np.exp(-t / 0.008) * (0.8 if kind == "rim" else 0.15)
    sig = body + crack * (1.0 if kind != "rim" else 0.4) + room + rim
    return fade(tanh_sat(sig, 1.25 if kind == "hit" else 1.1), 0.5, 12)


def make_shaker(rng):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    x = sos_bp(rng.standard_normal(n), 5000, 14000) * np.exp(-t / 0.025)
    x += rbj(rng.standard_normal(n), 9000, 6, "band") * np.exp(-t / 0.018) * 0.4
    return fade(x, 0.3, 6)


def make_tom(rng, freq=98.0):
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    f = freq * (1.0 + 0.35 * np.exp(-t / 0.02))
    sig = sine_sweep(f) * np.exp(-t / 0.08)
    sig += sos_bp(rng.standard_normal(n), freq * 2, 4000) * np.exp(-t / 0.03) * 0.2
    return fade(tanh_sat(sig, 1.15), 1, 16)


def make_impact_pro(rng, kind="festival"):
    """Hybrid festival impact: sub drop + noise smash + tonal cluster."""
    n = int((0.70 if kind == "festival" else 0.45) * SR)
    t = np.arange(n) / SR
    sub = sine_sweep(90 * np.exp(-t / 0.06) + 32) * np.exp(-t / 0.22)
    smash = sos_hp(rng.standard_normal(n), 200) * np.exp(-t / 0.12)
    smash += sos_bp(rng.standard_normal(n), 800, 6000) * np.exp(-t / 0.08) * 0.6
    # original minor-cluster hit, not a sampled crash
    tonal = np.zeros(n)
    for f, a in ((155.0, 0.4), (185.0, 0.28), (233.0, 0.18)):
        tonal += np.sin(2 * np.pi * f * t) * np.exp(-t / 0.15) * a
    sig = tanh_sat(sub * 0.95 + smash * 0.55 + tonal * 0.35, 1.3)
    return fade(sig, 1, 40)


def vocoder(carrier, modulator, n_bands=16, lo=140, hi=7600, rel_s=0.05, sr=SR):
    """Band vocoder: modulator envelopes applied to a carrier (original layers)."""
    if carrier.ndim == 1:
        carrier = np.stack([carrier, carrier], 1)
    if modulator.ndim == 1:
        modulator = np.stack([modulator, modulator], 1)
    n = min(len(carrier), len(modulator))
    carrier = np.array(carrier[:n], dtype=np.float64)
    modulator = np.array(modulator[:n], dtype=np.float64)
    edges = np.geomspace(lo, hi, n_bands + 1)
    out = np.zeros((n, 2))
    coeff = np.exp(-1.0 / (max(rel_s, 1e-4) * sr))
    for i in range(n_bands):
        sos = butter(2, [edges[i], edges[i + 1]], btype="bandpass", fs=sr, output="sos")
        for ch in (0, 1):
            m = np.abs(sosfilt(sos, modulator[:, ch]))
            env = np.empty(n)
            e = 0.0
            for k, v in enumerate(m):
                e = v if v > e else coeff * e + (1 - coeff) * v
                env[k] = e
            c = sosfilt(sos, carrier[:, ch])
            out[:, ch] += c * env
    peak = np.max(np.abs(out)) + 1e-12
    src = np.max(np.abs(carrier)) + 1e-12
    return out / peak * src


def tv_lowpass_stereo(x, cutoff, Q=0.9, block=256):
    """Time-varying stereo lowpass. cutoff is a per-sample array."""
    y = np.zeros_like(x)
    for ch in range(x.shape[1]):
        y[:, ch] = rbj_tv_low(x[:, ch], cutoff, Q=Q, block=block)
    return y


def muted_stab(freqs, dur=0.08, cutoff=1400, det=6):
    """Short muted cluster — filtered disco / house stab, original voicing."""
    n = int(dur * SR)
    sL, sR = np.zeros(n), np.zeros(n)
    for i, f in enumerate(freqs):
        L, R = supersaw_stereo(f, dur, det=det, n_osc=5, cutoff=cutoff)
        sL += L
        sR += R
    sL /= max(len(freqs), 1)
    sR /= max(len(freqs), 1)
    env = np.exp(-np.arange(n) / SR / 0.035)
    att = int(0.003 * SR)
    env[:att] *= np.linspace(0, 1, att)
    return sL * env, sR * env
