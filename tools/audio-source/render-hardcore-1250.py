#!/usr/bin/env python3
"""1.2.50 Happy Hardcore remix — UK bounce / donk, no piano.

170 BPM, rhythm-first: clean punchy 909-style kick, a loud off-beat
donk/reverse-bass (the bounce), short builds and long drops. Glencraft
melodies are bright pitched-up formant 'vocal' chops, with classic OST
grains time-aligned and pitched into D. Procedural synthesis plus the
game's own music/ assets only. No piano, no gabber kick, no screech lead.
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[2]
MUSIC = ROOT / "music"
OUT_DIR = Path(os.environ.get("HC_OUT", "/workspace/qa/audio-1250"))

SR = 44100
BPM = 170.0
SPB = 60.0 / BPM
BAR = 4 * SPB
BARS = 144
PREROLL_BARS = 2
SEED = 1250

# Arrangement (bars): short builds, long drops, 144 bars ≈ 3:23
# intro 8 | build 8 | drop1 48 | break 8 | build2 8 | drop2 56 | outro 8
SEC = {
    "intro":  (0, 8),
    "build1": (8, 16),
    "drop1":  (16, 64),
    "break":  (64, 72),
    "build2": (72, 80),
    "drop2":  (80, 136),
    "outro":  (136, 144),
}

# I–V–vi–IV in D major, one chord per bar
# D A Bm G
CHORD_HZ = [
    [146.83, 185.00, 220.00, 293.66],  # D
    [220.00, 277.18, 329.63, 440.00],  # A
    [123.47, 185.00, 246.94, 293.66],  # Bm
    [196.00, 246.94, 293.66, 392.00],  # G
]
BASS = [73.42, 110.00, 61.74, 98.00]          # D2 A2 B1 G2
DONK_F = [146.83, 220.00, 123.47, 196.00]     # mid donk bodies

# Highland-mist shape (D E F …) raised to D major, nightcore register (D5+)
# 16 eighths = 2 bars
HOOK_A = [86, 88, 90, 93,  95, 93, 90, 88,  90, 93, 95, 98,  93, 90, 88, 86]
HOOK_B = [90, 91, 93, 95,  93, 90, 88, 86,  90, 93, 95, 98,  97, 95, 93, 90]
# Breakdown highland (D dorian, recognisable mist motif) as chops, not piano
HOOK_PIPE = [74, 76, 77, 79,  81, 79, 77, 76,  74, 76, 77, 81,  79, 77, 76, 74]

VOWELS = {
    "a": (800, 1200, 2500),
    "e": (400, 2300, 3000),
    "i": (300, 2700, 3300),
    "o": (500, 900, 2400),
    "u": (350, 700, 2200),
}
VOWEL_CYCLE = "aeioaeiu"

rng = np.random.default_rng(SEED)


def midi_hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def fade(sig, ms_in=6, ms_out=8):
    n = len(sig)
    a = min(n // 3, int(ms_in * SR / 1000))
    b = min(n // 3, int(ms_out * SR / 1000))
    if a > 0:
        sig = sig.copy()
        sig[:a] *= np.linspace(0, 1, a)
    if b > 0:
        sig[-b:] *= np.linspace(1, 0, b)
    return sig


def sos_hp(x, hz, order=2):
    if hz <= 0:
        return x
    sos = butter(order, min(hz, SR * 0.45), btype="highpass", fs=SR, output="sos")
    return sosfilt(sos, x)


def sos_lp(x, hz, order=2):
    hz = min(max(hz, 40), SR * 0.45)
    sos = butter(order, hz, btype="lowpass", fs=SR, output="sos")
    return sosfilt(sos, x)


def sos_bp(x, lo, hi, order=2):
    lo = max(30, min(lo, SR * 0.4))
    hi = max(lo + 20, min(hi, SR * 0.49))
    sos = butter(order, [lo, hi], btype="bandpass", fs=SR, output="sos")
    return sosfilt(sos, x)


def tanh_sat(x, drive=1.2):
    return np.tanh(x * drive) / np.tanh(drive)


# ---------------------------------------------------------------------------
# One-shots
# ---------------------------------------------------------------------------
def make_kick():
    """Clean short 909-ish kick: punchy, tight, lightly saturated — not gabber."""
    dur = 0.155
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 150.0 * np.exp(-t / 0.016)
    f = np.maximum(f, 47.0)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR)
    env = np.exp(-t / 0.048) * (1 - np.exp(-t / 0.0012))
    punch = np.sin(2 * np.pi * 95 * t) * np.exp(-t / 0.022) * 0.7
    click = np.sin(2 * np.pi * 2800 * t) * np.exp(-t / 0.0028) * 0.28
    noise = sos_hp(rng.standard_normal(n), 5000) * np.exp(-t / 0.0035) * 0.32
    sig = body * env + punch + click + noise
    sig = tanh_sat(sig, 1.25)
    sig *= np.linspace(1, 0, n) ** 0.08  # force tight end
    # last 20 ms fade
    k = int(0.02 * SR)
    sig[-k:] *= np.linspace(1, 0, k)
    return sig.astype(np.float64)


def make_donk(freq):
    """Off-beat donk + reverse-bass. Loud mid 'donk' attack, rising saw into the next kick."""
    dur = SPB * 0.90  # just under an 8th, points at the next kick
    n = int(dur * SR)
    t = np.arange(n) / SR
    fade_out = np.ones(n)
    tail = int(0.012 * SR)
    fade_out[-tail:] = np.linspace(1, 0, tail)

    # Donk body: tom-like pitch drop, mid-forward (audible on small speakers)
    f0 = freq
    fd = f0 * 2.15 * np.exp(-t / 0.016) + f0 * 0.9
    ph = 2 * np.pi * np.cumsum(fd) / SR
    donk = (np.sin(ph) + 0.4 * np.sin(2 * ph)) * np.exp(-t / 0.062) * (1 - np.exp(-t / 0.0025))

    # Reverse-bass: detuned saw, rising envelope toward the next kick
    saw = np.zeros(n)
    for cents, amp in ((-14, 0.55), (0, 0.8), (14, 0.55)):
        f = freq * 2 ** (cents / 1200.0)
        saw += amp * (2 * ((t * f) % 1.0) - 1)
    saw = tanh_sat(saw / 1.9, 1.7)
    saw = sos_lp(saw, 620)
    rb_env = (t / (t[-1] + 1e-12)) ** 0.55 * fade_out

    sub = np.sin(2 * np.pi * (freq * 0.5 if freq > 80 else freq) * t) * ((t / t[-1]) ** 0.35) * fade_out

    sig = donk * 1.25 + saw * rb_env * 0.95 + sub * 0.75
    sig = tanh_sat(sig, 1.2) * fade_out
    return sig.astype(np.float64)


def make_clap():
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for off, amp in ((0.0, 1.0), (0.009, 0.75), (0.018, 0.55), (0.028, 0.35)):
        i = int(off * SR)
        burst = rng.standard_normal(n - i)
        burst = sos_bp(burst, 900, 4500)
        burst *= np.exp(-np.arange(n - i) / SR / 0.038) * amp
        sig[i:] += burst
    sig = fade(sig, 1, 20)
    return tanh_sat(sig, 1.1)


def make_snare():
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.04)
    noise = sos_bp(rng.standard_normal(n), 800, 9000) * np.exp(-t / 0.06)
    return fade(tanh_sat(body * 0.45 + noise, 1.15), 1, 12)


def make_hat(open_hat=False):
    dur = 0.15 if open_hat else 0.045
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sos_hp(rng.standard_normal(n), 7500)
    x *= np.exp(-t / (0.075 if open_hat else 0.022))
    return fade(x, 0.5, 6)


def make_crash():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    x = sos_hp(rng.standard_normal(n), 2500)
    x *= np.exp(-t / 0.55)
    return fade(x, 2, 80)


def make_riser(dur, start_hz=200, end_hz=9000):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    # rising highpass
    chunks = 32
    out = np.zeros(n)
    for k in range(chunks):
        a = int(k * n / chunks)
        b = int((k + 1) * n / chunks)
        p = k / max(chunks - 1, 1)
        hz = start_hz * (end_hz / start_hz) ** p
        out[a:b] = sos_hp(noise[a:b], hz)
    env = (t / dur) ** 1.4
    # sine sweep layer
    f = start_hz * (end_hz / start_hz) ** (t / dur)
    sweep = np.sin(2 * np.pi * np.cumsum(f) / SR) * env * 0.18
    return fade(out * env * 0.9 + sweep, 8, 4)


def make_sweep(dur=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = sos_bp(rng.standard_normal(n), 400, 12000)
    env = np.sin(np.pi * t / dur) ** 1.2
    return noise * env


def make_impact():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    low = np.sin(2 * np.pi * np.cumsum(80 * np.exp(-t / 0.06) + 35) / SR) * np.exp(-t / 0.18)
    noise = sos_hp(rng.standard_normal(n), 200) * np.exp(-t / 0.12)
    return fade(tanh_sat(low * 0.9 + noise * 0.5, 1.3), 1, 30)


# ---------------------------------------------------------------------------
# Tonal colours
# ---------------------------------------------------------------------------
def supersaw(freq, dur, det=18, n_osc=7, cutoff=7500):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    dets = np.linspace(-det, det, n_osc)
    for i, c in enumerate(dets):
        f = freq * 2 ** (c / 1200.0)
        s += 2 * ((t * f + 0.07 * i) % 1.0) - 1
    s /= n_osc
    s = sos_hp(s, 240)
    s = sos_lp(s, cutoff)
    att = int(0.012 * SR)
    rel = int(0.04 * SR)
    env = np.ones(n)
    if att < n:
        env[:att] = np.linspace(0, 1, att)
    if rel < n:
        env[-rel:] = np.linspace(1, 0, rel)
    return s * env


def formant_chop(freq, dur, vowel="a"):
    """Pitched-up 'nightcore' vocal-like synth chop. No real vocals."""
    n = int(max(dur, 0.03) * SR)
    t = np.arange(n) / SR
    # band-limited pulse / odd-harmonic stack (talk-box adjacent, not a screech)
    src = np.zeros(n)
    n_h = max(4, min(14, int(8000 / max(freq, 80))))
    for h in range(1, n_h + 1):
        amp = 1.0 / h if h % 2 else 0.35 / h
        src += amp * np.sin(2 * np.pi * freq * h * t)
    form = np.zeros(n)
    fs_ = VOWELS[vowel]
    gains = (1.0, 0.55, 0.32)
    for fc, g in zip(fs_, gains):
        lo, hi = max(80, fc * 0.65), min(SR * 0.45, fc * 1.4)
        if hi > lo + 30:
            form += g * sos_bp(src, lo, hi)
    # slight vibrato, short staccato envelope (chop, not a held lead)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t)
    form = form * vib
    att = int(0.006 * SR)
    rel = max(int(0.035 * SR), int(0.22 * n))
    env = np.ones(n)
    env[: min(att, n)] = np.linspace(0, 1, min(att, n))
    if rel < n:
        env[-rel:] = np.linspace(1, 0, rel)
    return fade(tanh_sat(form, 1.05) * env, 2, 8)


def bagpipe_drone(dur, root=146.83):
    """Narrow-pulse drone (D+A) with slight reed detune — breakdown colour only."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for f, amp in ((root, 0.7), (root * 1.5, 0.45), (root * 0.5, 0.35), (root * 2 ** (7 / 1200), 0.4)):
        # narrow pulse
        sig += amp * np.sign(np.sin(2 * np.pi * f * t) + 0.65)
    sig /= 2.2
    sig = sos_lp(sos_hp(sig, 120), 3200)
    att = int(0.05 * SR)
    rel = int(0.08 * SR)
    env = np.ones(n)
    env[:att] = np.linspace(0, 1, att)
    env[-rel:] = np.linspace(1, 0, rel)
    return sig * env * 0.5


def bagpipe_chanter(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f1, f2 = freq, freq * 2 ** (18 / 1200.0)
    sig = 0.6 * np.sign(np.sin(2 * np.pi * f1 * t) + 0.55)
    sig += 0.45 * np.sign(np.sin(2 * np.pi * f2 * t) + 0.55)
    sig = sos_bp(sig, max(200, freq * 0.8), min(4000, freq * 8))
    att = int(0.01 * SR)
    rel = int(0.04 * SR)
    env = np.ones(n)
    env[: min(att, n)] = np.linspace(0, 1, min(att, n))
    if rel < n:
        env[-rel:] = np.linspace(1, 0, rel)
    return fade(sig * env * 0.55, 3, 8)


# ---------------------------------------------------------------------------
# Classic OST grains (game assets only), in key and on the grid
# ---------------------------------------------------------------------------
def load_classic_grains():
    import librosa

    specs = [
        # name, file, semitone shift into D / current colour, start sec
        ("mist", "highland_mist.mp3", 0, 18.0),      # already D
        ("cairn", "cairn.mp3", 0, 16.0),             # D-ish
        ("dawn", "glen_dawn.mp3", 0, 20.0),          # G — use on G bars
        ("heather", "heather_air.mp3", -2, 15.0),    # Em -> D
        ("loch", "loch_night.mp3", 0, 22.0),         # Am — use on A bars
    ]
    grains = {}
    for name, fn, shift, t0 in specs:
        path = MUSIC / fn
        if not path.exists():
            print("missing", path)
            continue
        y, sr = librosa.load(str(path), sr=SR, mono=True, offset=t0, duration=8.0)
        if shift:
            y = librosa.effects.pitch_shift(y, sr=SR, n_steps=shift)
        y = sos_hp(y, 180)
        # peak-normalise the excerpt, then cut 1-beat and 2-beat grains
        peak = np.max(np.abs(y)) + 1e-9
        y = y / peak * 0.9
        beat = int(SPB * SR)
        pack = []
        for length, start in ((beat, 0), (beat, beat), (2 * beat, 2 * beat), (beat // 2, 4 * beat)):
            if start + length <= len(y):
                g = fade(y[start:start + length].copy(), 8, 8)
                pack.append(g)
        grains[name] = pack
        print(f"  grain {name}: {len(pack)} slices, shift={shift}")
    return grains


# ---------------------------------------------------------------------------
# Mix helpers
# ---------------------------------------------------------------------------
def add_mono(bus, t0, sig, gain=1.0, pan=0.0):
    i0 = int(round(t0 * SR))
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


def section_at(bar):
    for name, (a, b) in SEC.items():
        if a <= bar < b:
            return name
    return "outro"


def chord_index(bar):
    return bar % 4


def cheap_reverb(x, delays_ms=(29.7, 37.1, 41.4, 43.7), decay=0.38):
    from scipy.signal import lfilter

    y = np.zeros_like(x)
    for ch in (0, 1):
        acc = np.zeros(len(x))
        for i, dms in enumerate(delays_ms):
            d = int((dms + (1.7 if ch else 0)) * SR / 1000)
            fb = decay * (0.92 if i % 2 == 0 else 0.85)
            b = np.zeros(d + 1)
            b[-1] = 1.0
            a = np.zeros(d + 1)
            a[0] = 1.0
            a[-1] = -fb
            acc += lfilter(b, a, x[:, ch])
        y[:, ch] = acc / len(delays_ms)
    y = sos_lp(y.T, 6500).T if False else y
    # gentle tilt
    for ch in (0, 1):
        y[:, ch] = sos_lp(y[:, ch], 7000)
    return y


def ping_pong_delay(x, delay_s, fb=0.28, mix=0.22):
    d = int(delay_s * SR)
    y = np.zeros_like(x)
    y[d:, 1] += x[:-d, 0]           # L -> R
    y[2 * d:, 0] += x[:-2 * d, 0] * fb
    y[d:, 0] += x[:-d, 1] * 0.7
    y[2 * d:, 1] += x[:-2 * d, 1] * fb
    return x * (1 - mix) + y * mix


def glue(x, thresh=0.28, ratio=2.6, att_s=0.004, rel_s=0.09):
    peak = np.maximum(np.max(np.abs(x), axis=1), 1e-9)
    # envelope follower
    att = 1 - np.exp(-1 / (att_s * SR))
    rel = 1 - np.exp(-1 / (rel_s * SR))
    env = np.zeros_like(peak)
    e = 0.0
    for i, p in enumerate(peak):
        coef = att if p > e else rel
        e = e + coef * (p - e)
        env[i] = e
    gain = np.ones_like(env)
    over = env > thresh
    gain[over] = (thresh + (env[over] - thresh) / ratio) / env[over]
    # 4-sample smooth
    k = 8
    kern = np.ones(k) / k
    gain = np.convolve(gain, kern, mode="same")
    return x * gain[:, None]


def limiter(x, ceiling=10 ** (-1.0 / 20.0), look_ms=6):
    from scipy.ndimage import maximum_filter1d
    look = int(look_ms * SR / 1000)
    peak = np.max(np.abs(x), axis=1)
    padded = np.pad(peak, (0, look), mode="edge")
    # fut[i] = max(peak[i:i+look+1])
    fut = maximum_filter1d(padded, size=look + 1, origin=look // 2, mode="nearest")[: len(peak)]
    gain = np.ones_like(peak)
    mask = fut > ceiling
    gain[mask] = ceiling / (fut[mask] + 1e-12)
    rel = 1 - np.exp(-1.0 / (0.08 * SR))
    out_g = np.empty_like(gain)
    g = 1.0
    for i, t in enumerate(gain):
        g = t if t < g else g + rel * (t - g)
        out_g[i] = g
    return np.clip(x * out_g[:, None], -ceiling, ceiling)


# ---------------------------------------------------------------------------
# Arrange + render
# ---------------------------------------------------------------------------
def render():
    body_len = BARS * 4 * SPB
    preroll = PREROLL_BARS * 4 * SPB
    total_s = preroll + body_len
    N = int(round(total_s * SR))
    t_body = lambda bar, beat=0, eighth=0: preroll + bar * BAR + beat * SPB + eighth * (SPB / 2)

    drums = np.zeros((N, 2))
    donk_bus = np.zeros((N, 2))
    music = np.zeros((N, 2))
    chops = np.zeros((N, 2))
    grains_bus = np.zeros((N, 2))
    fx = np.zeros((N, 2))
    duck_src = []  # kick times in absolute seconds (including preroll)

    print("building one-shots…")
    kick = make_kick()
    clap = make_clap()
    snare = make_snare()
    hat_c = make_hat(False)
    hat_o = make_hat(True)
    crash = make_crash()
    impact = make_impact()
    donks = [make_donk(f) for f in DONK_F]

    print("loading classic grains…")
    grains = load_classic_grains()

    # Precompute some risers
    riser8 = make_riser(8 * BAR)
    riser4 = make_riser(4 * BAR)

    def in_preroll_echo(bar, place_fn):
        """Also place outro bars into the preroll so the loop carries tails."""
        place_fn(bar)
        if bar >= BARS - PREROLL_BARS:
            place_fn(bar - BARS)

    print("scheduling 144 bars…")
    for bar in range(-PREROLL_BARS, BARS):
        # map negative bars to outro clones for scheduling content
        src_bar = bar if bar >= 0 else bar + BARS
        sec = section_at(src_bar)
        ci = chord_index(src_bar)
        # intensity / role
        full_drums = sec in ("drop1", "drop2", "build1", "build2") or (sec == "break")
        # intro: kicks from bar 4, donk tease 6-7
        # outro: keep kick+donk but filter later in the mix via gains

        kick_gain = {
            "intro": 0.0 if (src_bar % 144) < 4 else 0.7,
            "build1": 0.85,
            "drop1": 1.0,
            "break": 0.78,
            "build2": 0.9,
            "drop2": 1.0,
            "outro": 0.65 if src_bar < 140 else 0.5,
        }[sec]
        if sec == "intro" and src_bar >= 4:
            kick_gain = 0.55 + 0.08 * (src_bar - 4)

        donk_gain = {
            "intro": 0.0 if src_bar < 6 else 0.45,
            "build1": 0.7 if src_bar < 12 else 0.9,
            "drop1": 1.0,
            "break": 0.85,
            "build2": 0.95,
            "drop2": 1.05,
            "outro": 0.55 if src_bar < 140 else 0.35,
        }[sec]

        hat_gain = {
            "intro": 0.15 if src_bar >= 6 else 0.0,
            "build1": 0.45 if src_bar < 12 else 0.7,
            "drop1": 0.85,
            "break": 0.35,
            "build2": 0.8,
            "drop2": 0.95,
            "outro": 0.3,
        }[sec]

        chord_gain = {
            "intro": 0.18 if src_bar >= 2 else 0.12,
            "build1": 0.35,
            "drop1": 0.55,
            "break": 0.2,
            "build2": 0.4,
            "drop2": 0.58,
            "outro": 0.22,
        }[sec]

        chop_on = sec in ("drop1", "drop2") or (sec == "build2" and src_bar >= 76)
        pipe_on = sec == "break"
        grain_on = sec in ("drop1", "drop2", "intro", "break")

        for beat in range(4):
            t = t_body(bar, beat)
            # kick every beat
            if kick_gain > 0.02:
                add_mono(drums, t, kick, gain=kick_gain * 1.15, pan=0.0)
                duck_src.append(t)
            # clap / snare on 2 and 4
            if sec in ("drop1", "drop2", "build1", "build2") and beat in (1, 3):
                g = 0.42 if sec.startswith("drop") else 0.28
                add_mono(drums, t, clap, gain=g, pan=0.08)
                add_mono(drums, t, snare, gain=g * 0.35, pan=-0.1)
            elif sec == "break" and beat in (1, 3):
                add_mono(drums, t, clap, gain=0.18, pan=0.08)
            # closed hats 16ths
            if hat_gain > 0.02:
                for s16 in range(4):
                    vel = 1.0 if s16 % 2 == 0 else 0.55
                    if sec == "drop2":
                        vel *= 1.05
                    add_mono(drums, t + s16 * (SPB / 4), hat_c, gain=hat_gain * 0.22 * vel,
                             pan=-0.15 + 0.08 * (s16 % 2))
            # open hat on the off-beat (with the donk)
            if hat_gain > 0.05 and sec not in ("intro",):
                add_mono(drums, t + SPB / 2, hat_o, gain=hat_gain * 0.32, pan=0.12)
            # DONK on the off-beat — the defining bounce
            if donk_gain > 0.02:
                add_mono(donk_bus, t + SPB / 2, donks[ci], gain=donk_gain * 1.05, pan=0.0)

        # supersaw chords (supporting, not a screech lead), held a bar
        if chord_gain > 0.04:
            cutoff = 4200 if sec in ("intro", "break", "outro") else (6000 if sec.startswith("build") else 8000)
            if sec == "drop2":
                cutoff = 8800
            notes = CHORD_HZ[ci]
            for j, f in enumerate(notes):
                sig = supersaw(f, BAR * 0.98, det=16 if sec.startswith("drop") else 12,
                               cutoff=cutoff)
                pan = (-0.35, -0.12, 0.12, 0.35)[j]
                add_mono(music, t_body(bar), sig, gain=chord_gain * 0.22, pan=pan)

        # snare rolls at ends of builds (last 4 bars) and a shorter one mid-phrase
        roll_bars = []
        if sec == "build1" and src_bar >= 12:
            roll_bars.append(src_bar)
        if sec == "build2" and src_bar >= 76:
            roll_bars.append(src_bar)
        # mini roll last 2 bars of each 16-bar block in drops
        if sec in ("drop1", "drop2") and (src_bar % 16) >= 14:
            roll_bars.append(src_bar)
        if bar in range(-PREROLL_BARS, BARS) and section_at(src_bar) and (src_bar in (12, 13, 14, 15, 76, 77, 78, 79) or (sec in ("drop1", "drop2") and src_bar % 16 >= 14)):
            # 16ths, last bar 32nds, crescendo
            last_of_phrase = src_bar in (15, 79) or (sec in ("drop1", "drop2") and src_bar % 16 == 15)
            div = 8 if last_of_phrase else 4  # 32nds or 16ths
            steps = 4 * div
            for k in range(steps):
                pos = t_body(bar) + k * (BAR / steps)
                vel = 0.15 + 0.85 * (k / max(steps - 1, 1))
                g = 0.28 * vel if sec.startswith("build") else 0.16 * vel
                add_mono(drums, pos, snare, gain=g, pan=0.0)

        # risers / sweeps / crashes / impacts
        if bar == 8:
            add_mono(fx, t_body(8), riser8, gain=0.55, pan=0.0)
        if bar == 12:
            add_mono(fx, t_body(12), riser4, gain=0.35, pan=0.0)
        if bar == 72:
            add_mono(fx, t_body(72), riser8, gain=0.6, pan=0.0)
        if bar == 76:
            add_mono(fx, t_body(76), riser4, gain=0.4, pan=0.0)
        if bar in (15, 79):
            add_mono(fx, t_body(bar, 2), make_sweep(SPB * 2), gain=0.5, pan=0.0)
        if bar in (16, 80):
            add_mono(fx, t_body(bar), crash, gain=0.55, pan=0.0)
            add_mono(drums, t_body(bar), impact, gain=0.7, pan=0.0)
        # white-noise sweeps every 8 bars in drops
        if sec in ("drop1", "drop2") and src_bar % 8 == 7:
            add_mono(fx, t_body(bar, 2), make_sweep(SPB * 2), gain=0.28, pan=0.05)

        # vocal-like chops: hook A in drop1, hook B in drop2, 8ths, 2-bar phrase
        if chop_on:
            hook = HOOK_A if sec == "drop1" or (sec == "build2") else HOOK_B
            # drop2 after 16 bars sometimes stutters
            phrase = hook
            for e in range(8):  # 8 eighths in a bar; hook is 16 long over 2 bars
                idx = (src_bar % 2) * 8 + e
                m = phrase[idx % 16]
                # stutter on the last eighth of even bars in drop2 (vocal-chop feel)
                stutter = sec == "drop2" and (src_bar % 4 == 3) and e >= 6
                vowel = VOWEL_CYCLE[(src_bar + e) % len(VOWEL_CYCLE)]
                t = t_body(bar, eighth=e)
                dur = (SPB / 2) * (0.85 if not stutter else 0.42)
                if stutter:
                    # two 16th chops
                    for k in range(2):
                        sig = formant_chop(midi_hz(m), SPB / 4 * 0.85, vowel)
                        add_mono(chops, t + k * (SPB / 4), sig, gain=0.72, pan=(-0.2, 0.2)[k])
                else:
                    sig = formant_chop(midi_hz(m), dur, vowel)
                    add_mono(chops, t, sig, gain=0.7 if sec.startswith("drop") else 0.4,
                             pan=0.15 if e % 2 else -0.15)

        # bagpipe-ish highland chops + drone in the short break (no piano)
        if pipe_on:
            if src_bar == 64 or bar == 64:
                add_mono(music, t_body(bar), bagpipe_drone(8 * BAR), gain=0.55, pan=0.0)
            for e in range(8):
                idx = (src_bar % 2) * 8 + e
                m = HOOK_PIPE[idx % 16]
                sig = bagpipe_chanter(midi_hz(m), SPB / 2 * 0.9)
                add_mono(chops, t_body(bar, eighth=e), sig, gain=0.62, pan=0.05)

        # classic grains, on the grid, in key (track chosen to match the bar's chord)
        if grain_on and grains:
            if ci == 3 and "dawn" in grains:      # G
                pack, name = grains["dawn"], "dawn"
            elif ci == 1 and "loch" in grains:    # A
                pack, name = grains["loch"], "loch"
            elif src_bar % 8 < 4 and "mist" in grains:
                pack, name = grains["mist"], "mist"
            elif "heather" in grains and src_bar % 8 >= 4:
                pack, name = grains["heather"], "heather"
            else:
                pack, name = grains.get("cairn") or next(iter(grains.values())), "cairn"
            # intro: longish pad grain once a bar, drops: 1-beat grain on beat 1 and 3 of even bars
            if sec == "intro" and pack:
                g = pack[min(2, len(pack) - 1)]
                add_mono(grains_bus, t_body(bar), g, gain=0.22, pan=-0.1)
            elif sec == "break" and pack and src_bar % 2 == 0:
                add_mono(grains_bus, t_body(bar), pack[0], gain=0.16, pan=0.1)
            elif sec in ("drop1", "drop2") and src_bar % 2 == 0 and pack:
                add_mono(grains_bus, t_body(bar, 0), pack[0], gain=0.20, pan=-0.18)
                if len(pack) > 1:
                    add_mono(grains_bus, t_body(bar, 2), pack[1], gain=0.16, pan=0.18)

    print("sidechain, delay, reverb, glue…")
    # sidechain envelope from kicks — duck pads, chops, grains (donk is off-beat, leave it)
    duck = np.ones(N)
    n_d = int(0.20 * SR)
    t_d = np.arange(n_d) / SR
    curve = 1.0 - 0.72 * np.exp(-t_d / 0.055)
    for tk in duck_src:
        i = int(round(tk * SR))
        if i >= N:
            continue
        j = min(n_d, N - i)
        if i < 0:
            continue
        duck[i:i + j] = np.minimum(duck[i:i + j], curve[:j])
    music *= duck[:, None]
    grains_bus *= duck[:, None]
    chops *= (0.35 + 0.65 * duck)[:, None]

    # delay on chops (dotted 8th = 3/16? use 3/16 for bounce: 0.75*8th wait, dotted 8th = 0.75 beat)
    chops = ping_pong_delay(chops, delay_s=SPB * 0.75, fb=0.26, mix=0.20)

    # reverb sends: claps already in drums (we'll send a HP copy), music, chops
    send = music * 0.28 + chops * 0.22 + grains_bus * 0.15
    # a little of the mid/high drums
    drum_send = sos_hp(drums[:, 0], 600)  # mono extract
    send[:, 0] += drum_send * 0.10
    send[:, 1] += drum_send * 0.10
    verb = cheap_reverb(send, decay=0.36)

    mix = drums * 1.00 + donk_bus * 1.08 + music * 1.0 + chops * 1.0 + grains_bus * 1.0 + fx * 0.85 + verb * 0.85

    # take body (drop preroll after tails have landed on the start)
    i0 = int(round(preroll * SR))
    n_body = int(round(body_len * SR))
    body = mix[i0:i0 + n_body].copy()
    # if off-by-one, pad/trim
    target = int(round(BARS * 4 * SPB * SR))
    if body.shape[0] < target:
        body = np.pad(body, ((0, target - body.shape[0]), (0, 0)))
    elif body.shape[0] > target:
        body = body[:target]

    # DC block + glue + pre-limit gain
    body = body - np.mean(body, axis=0)
    peak = np.max(np.abs(body)) + 1e-12
    body = body / peak * 0.85
    body = glue(body)
    body = limiter(body, ceiling=10 ** (-1.2 / 20.0))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    raw = OUT_DIR / "music-hardcore-pre-loudnorm.wav"
    sf.write(str(raw), body, SR, subtype="FLOAT")
    print("wrote", raw, "dur", body.shape[0] / SR)

    wav = OUT_DIR / "music-hardcore.wav"
    mp3 = OUT_DIR / "music-hardcore.mp3"
    # two-pass loudnorm to -14 LUFS, -1 dBTP
    pass1 = subprocess.check_output(
        ["ffmpeg", "-hide_banner", "-i", str(raw),
         "-af", "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json",
         "-f", "null", "-"],
        stderr=subprocess.STDOUT, text=True,
    )
    # parse json from the end of ffmpeg log
    import json, re
    m = re.search(r"\{[^{}]*input_i[^{}]*\}", pass1, re.S)
    if not m:
        print(pass1[-2000:])
        raise SystemExit("loudnorm json not found")
    stats = json.loads(m.group(0))
    print("loudnorm pass1", stats)
    filt = (
        "loudnorm=I=-14:TP=-1.0:LRA=11:"
        f"measured_I={stats['input_i']}:"
        f"measured_TP={stats['input_tp']}:"
        f"measured_LRA={stats['input_lra']}:"
        f"measured_thresh={stats['input_thresh']}:"
        f"offset={stats['target_offset']}:"
        "linear=true:print_format=summary"
    )
    subprocess.check_call(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-i", str(raw), "-af", filt, "-c:a", "pcm_s24le", "-ar", "44100", str(wav)]
    )
    subprocess.check_call(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "192k", "-ar", "44100", str(mp3)]
    )
    # in-game compressed copy
    game_mp3 = MUSIC / "hardcore_remix.mp3"
    game_ogg = MUSIC / "hardcore_remix.ogg"
    subprocess.check_call(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "160k", "-ar", "44100", str(game_mp3)]
    )
    subprocess.check_call(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-i", str(wav), "-codec:a", "libvorbis", "-q:a", "4", "-ar", "44100", str(game_ogg)]
    )
    print("game assets", game_mp3, game_ogg, "sizes",
          game_mp3.stat().st_size, game_ogg.stat().st_size)

    # section previews (wav+mp3) and loop-join check clip
    y, sr = sf.read(str(wav))
    def cut(name, bar_a, bar_b):
        a = int(bar_a * BAR * sr)
        b = int(bar_b * BAR * sr)
        p = OUT_DIR / f"section-{name}.wav"
        sf.write(str(p), y[a:b], sr, subtype="PCM_24")
        subprocess.check_call(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-i", str(p), "-codec:a", "libmp3lame", "-b:a", "192k",
             str(OUT_DIR / f"section-{name}.mp3")]
        )
    for name, (a, b) in SEC.items():
        cut(name, a, b)
    # last 2s + first 2s for loop inspection
    n2 = int(2.0 * sr)
    join = np.concatenate([y[-n2:], y[:n2]], axis=0)
    sf.write(str(OUT_DIR / "loop-join.wav"), join, sr, subtype="PCM_24")
    subprocess.check_call(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-i", str(OUT_DIR / "loop-join.wav"), "-codec:a", "libmp3lame", "-b:a", "192k",
         str(OUT_DIR / "loop-join.mp3")]
    )
    raw.unlink(missing_ok=True)
    print("done", wav, "dur", len(y) / sr)
    return wav


if __name__ == "__main__":
    render()
