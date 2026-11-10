#!/usr/bin/env python3
"""Build original nightcore vocal stems for the Glencraft happy-hardcore remix.

Voice: Piper TTS 1.8 (en_GB-jenny_dioco-medium lead, en_GB-alba-medium double).
Lyrics and melody are original (D-dorian hook derived from the highland-mist
D–E–F shape, not a copy of any reference clip). Each word is pitch-corrected
onto the hook, then the phrase is pitched +6 semitones with formants shifted
(nightcore) without changing tempo, plus reverb and delay.
"""
from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

SR = 44100
BPM = 165.0
SPB = 60.0 / BPM
BAR = 4 * SPB
PHRASE_BARS = 2
PHRASE_DUR = PHRASE_BARS * BAR  # ~2.909 s
NIGHTCORE_ST = 6.0  # +6 semitones, formants shifted

PIPER = os.environ.get("PIPER", "/workspace/tools/piper-venv/bin/piper")
MODEL_LEAD = os.environ.get(
    "PIPER_MODEL_LEAD", "/workspace/tools/piper-voices/en_GB-jenny_dioco-medium.onnx"
)
MODEL_DOUBLE = os.environ.get(
    "PIPER_MODEL_DOUBLE", "/workspace/tools/piper-voices/en_GB-alba-medium.onnx"
)
OUT = Path(os.environ.get("VOC_OUT", "/workspace/qa/audio-1260/v5/vocals"))

# Original lyrics (Glencraft / Highlands). Do not copy the reference clip.
# Hook A: "Up the glen, we never sleep"
# Hook B: "Dance till the sun's on the hills"
# Tag:    "To the hills"
#
# Melody in D dorian, mid register, derived from the highland-mist D–E–F rise.
# Values are (eighth-index 0..15, midi, duration in eighths, word).
HOOK_A = [
    (0, 74, 2, "Up"),
    (2, 76, 1, "the"),
    (3, 77, 3, "glen"),
    (6, 77, 1, "we"),
    (7, 79, 2, "never"),  # one word, one note (G4) — no "nev"/"er" chop
    (9, 77, 5, "sleep"),
]
HOOK_B = [
    (0, 81, 2, "Dance"),
    (2, 79, 1, "till"),
    (3, 77, 1, "the"),
    (4, 81, 2, "suns"),  # "sun's"
    (6, 79, 1, "on"),
    (7, 77, 1, "the"),
    (8, 74, 6, "hills"),
]
# Drop-2 chorus variation (original, still Highlands / Glencraft — not the ref clip).
# Hook C: "Over the loch, the heather glows"
# Hook D: "Keep the fire on the hills"
HOOK_C = [
    (0, 81, 2, "Over"),
    (2, 79, 1, "the"),
    (3, 77, 3, "loch"),
    (6, 79, 1, "the"),
    (7, 81, 2, "heather"),
    (9, 79, 5, "glows"),
]
HOOK_D = [
    (0, 79, 2, "Keep"),
    (2, 77, 1, "the"),
    (3, 81, 3, "fire"),
    (6, 79, 1, "on"),
    (7, 77, 1, "the"),
    (8, 74, 6, "hills"),
]
# Breakdown — new lyrical idea, longer notes, not the drop hook.
# "When the mist comes down the glen / I'll find my way home again"
HOOK_E = [
    (0, 74, 2, "When"),
    (2, 76, 1, "the"),
    (3, 77, 3, "mist"),
    (6, 76, 2, "comes"),
    (8, 74, 2, "down"),
    (10, 72, 1, "the"),
    (11, 74, 5, "glen"),
]
HOOK_F = [
    (0, 77, 2, "Ill"),
    (2, 79, 2, "find"),
    (4, 81, 2, "my"),
    (6, 79, 2, "way"),
    (8, 77, 3, "home"),
    (11, 74, 5, "again"),
]
# Drop-2 countermelody, sitting a third above the hook.
# "Call me over the high ground"
HOOK_G = [
    (0, 81, 2, "Call"),
    (2, 83, 1, "me"),
    (3, 84, 3, "over"),
    (6, 83, 1, "the"),
    (7, 81, 2, "high"),
    (9, 79, 7, "ground"),
]
# Pre-drop vocal tag, slightly higher so it cuts through.
TAG = [
    (0, 79, 2, "To"),
    (2, 81, 2, "the"),
    (4, 86, 8, "hills"),
]
# Spoken/sung chops (single sustained note later retuned per use).
CHOPS = {
    "oh": "oh",
    "hey": "hey",
    "yeah": "yeah",
    "glen": "glen",
    "sleep": "sleep",
    "dance": "dance",
    "up": "Up",
    "mist": "mist",
    "home": "home",
    "call": "Call",
    "again": "again",
}

# Words we ask Piper to say (phonetic helpers for tight syllables).
SAY = {
    "Up": "Up",
    "the": "the",
    "glen": "glen",
    "we": "we",
    "never": "never",
    "sleep": "sleep",
    "Over": "Over",
    "loch": "loch",
    "heather": "heather",
    "glows": "glows",
    "Keep": "Keep",
    "fire": "fire",
    "Dance": "Dance",
    "till": "till",
    "suns": "suns",
    "on": "on",
    "hills": "hills",
    "To": "To",
    "oh": "ohhh",
    "hey": "hey",
    "yeah": "yeah",
    "dance": "dance",
    "up": "Up",
    "When": "When",
    "mist": "mist",
    "comes": "comes",
    "down": "down",
    "Ill": "I'll",
    "find": "find",
    "my": "my",
    "way": "way",
    "home": "home",
    "again": "again",
    "Call": "Call",
    "me": "me",
    "high": "high",
    "ground": "ground",
}

# D dorian scale midi classes: D E F G A B C
DORIAN = [0, 2, 3, 5, 7, 9, 10]  # pitch classes relative to D (2)


def midi_hz(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def dorian_third_up(midi):
    """Diatonic third above in D dorian."""
    # map midi to scale degree
    pc = (midi - 62) % 12  # D2=62, D3=74 → 12, pc of D=0
    # 62 is D4-12=D3? D4=74, D3=62 yes. pc from D: (midi-62)%12 but 74-62=12, pc=0. Good.
    # Wait 74-62=12 % 12 = 0. Yes.
    # Actually (midi - 2) % 12 because D is pc 2 in C-based, easier:
    rel = (midi - 62) % 12
    if rel in DORIAN:
        i = DORIAN.index(rel)
        new_rel = DORIAN[(i + 2) % 7]
        octv = 1 if (i + 2) >= 7 else 0
        return midi + (new_rel - rel) + 12 * octv
    # off-scale: minor third
    return midi + 3


def run(cmd):
    subprocess.check_call(cmd)


def piper_say(text, model, dest, length_scale=1.15, sentence_silence=0.0):
    dest = Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    # piper 1.8 ships its own espeak data
    p = subprocess.run(
        [
            PIPER,
            "--model", model,
            "--output_file", str(dest),
            "--length-scale", str(length_scale),
            "--noise-scale", "0.5",
            "--noise-w-scale", "0.6",
            "--sentence-silence", str(sentence_silence),
        ],
        input=text + "\n",
        text=True,
        capture_output=True,
    )
    if p.returncode != 0 or not dest.exists():
        raise RuntimeError(f"piper failed for {text!r} model={model}: {p.stderr}")
    return dest


def load_mono(path, sr=SR):
    y, file_sr = sf.read(str(path), always_2d=False)
    if y.ndim > 1:
        y = np.mean(y, axis=1)
    y = y.astype(np.float64)
    if file_sr != sr:
        y = librosa.resample(y, orig_sr=file_sr, target_sr=sr)
    return y


def trim_silence(y, sr=SR, thresh=0.015, pad_ms=25):
    if len(y) == 0:
        return y
    env = np.abs(y)
    win = max(1, int(0.01 * sr))
    env = np.convolve(env, np.ones(win) / win, mode="same")
    peak = np.max(env) + 1e-12
    mask = env > (thresh * peak if peak > 0.05 else thresh)
    if not np.any(mask):
        return y
    a = max(0, int(np.argmax(mask) - pad_ms * sr / 1000))
    b = min(len(y), int(len(mask) - np.argmax(mask[::-1]) + pad_ms * sr / 1000))
    return y[a:b]


def ffmpeg_rubberband(y, sr, semitones=0.0, tempo=1.0, formant="preserved", quality=True):
    """Pitch/time via ffmpeg rubberband. tempo>1 means faster (shorter)."""
    if abs(semitones) < 0.01 and abs(tempo - 1.0) < 0.005:
        return y
    pitch = 2.0 ** (semitones / 12.0)
    tempo = float(np.clip(tempo, 0.12, 8.0))
    pitch = float(np.clip(pitch, 0.25, 4.0))
    form = "preserved" if formant == "preserved" else "shifted"
    q = "quality" if quality else "speed"
    with tempfile.TemporaryDirectory(prefix="rb-") as td:
        inp = Path(td) / "in.wav"
        out = Path(td) / "out.wav"
        sf.write(str(inp), y, sr, subtype="FLOAT")
        filt = f"rubberband=tempo={tempo}:pitch={pitch}:formant={form}:pitchq={q}:channels=together"
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(inp), "-af", filt, "-ar", str(sr), "-ac", "1", str(out),
        ])
        z, _ = sf.read(str(out))
        if z.ndim > 1:
            z = np.mean(z, axis=1)
        return z.astype(np.float64)


def estimate_f0(y, sr=SR):
    f0, _, _ = librosa.pyin(
        y.astype(np.float32), fmin=80, fmax=420, sr=sr, frame_length=1024
    )
    med = float(np.nanmedian(f0)) if np.any(np.isfinite(f0)) else float("nan")
    if not np.isfinite(med) or med < 70:
        return 200.0
    return med


def retune_to(y, sr, target_hz, formant="preserved"):
    f0 = estimate_f0(y, sr)
    semi = 12.0 * np.log2(max(target_hz, 40.0) / max(f0, 40.0))
    semi = float(np.clip(semi, -15.0, 19.0))
    return ffmpeg_rubberband(y, sr, semitones=semi, tempo=1.0, formant=formant)


def fit_duration(y, sr, dur):
    target = max(int(dur * sr), 32)
    if len(y) < 16:
        return np.zeros(target)
    tempo = len(y) / target
    # Avoid extreme stretch: if we'd slow more than 3x, pad instead of molasses
    if tempo < 0.35:
        z = ffmpeg_rubberband(y, sr, tempo=0.4, formant="preserved")
        if len(z) >= target:
            return z[:target]
        out = np.zeros(target)
        out[: len(z)] = z
        # fade tail of the remainder
        return out
    z = ffmpeg_rubberband(y, sr, tempo=tempo, formant="preserved")
    if len(z) < target:
        z = np.pad(z, (0, target - len(z)))
    return z[:target]


def fade(sig, sr=SR, ms_in=4, ms_out=12):
    n = len(sig)
    a = min(max(n // 6, 1), int(ms_in * sr / 1000.0))
    b = min(max(n // 6, 1), int(ms_out * sr / 1000.0))
    out = np.array(sig, dtype=np.float64, copy=True)
    if a:
        out[:a] *= np.linspace(0.0, 1.0, a)
    if b:
        out[-b:] *= np.linspace(1.0, 0.0, b)
    return out


def cache_key(text, model):
    tag = Path(model).stem.split("-")[1] if "-" in Path(model).stem else "v"
    safe = "".join(c if c.isalnum() else "_" for c in text)[:40]
    return f"raw_{tag}_{safe}.wav"


def get_word(text, model, cache):
    say = SAY.get(text, text)
    key = cache_key(say + "_" + text, model)
    path = cache / key
    if not path.exists():
        for alt in (
            Path("/workspace/qa/audio-1260/v4/vocals/_cache") / key,
            Path("/workspace/qa/audio-1260/v3/vocals/_cache") / key,
            Path("/workspace/qa/audio-1260/v2/vocals/_cache") / key,
        ):
            if alt.exists():
                path = alt
                break
    if not path.exists():
        # slightly slower for vowels so pitch-correction has something to chew on
        scale = 1.25 if text.lower() in {"oh", "yeah", "hey", "sleep", "hills", "glen", "never", "heather", "glows", "fire", "loch", "over", "mist", "home", "again", "ground", "when", "call"} else 1.12
        piper_say(say, model, path, length_scale=scale, sentence_silence=0.0)
    y = trim_silence(load_mono(path))
    # de-clip / normalise Piper's occasional peak=1
    peak = np.max(np.abs(y)) + 1e-12
    if peak > 0.95:
        y = y / peak * 0.92
    return y


def place(phrase, sig, t0, sr=SR):
    i0 = int(round(t0 * sr))
    if i0 < 0:
        sig = sig[-i0:]
        i0 = 0
    n = min(len(sig), len(phrase) - i0)
    if n > 0:
        phrase[i0:i0 + n] += sig[:n]


def add_scoop(y, sr, cents=-32, dur_s=0.055):
    """Brief downward scoop into the note — a sung onset, not a hard robot step."""
    n = len(y)
    if n < int(0.06 * sr):
        return y
    t = np.arange(n) / sr
    env = np.clip(1.0 - t / dur_s, 0.0, 1.0)
    env = env * env
    ratio = 2.0 ** ((cents / 1200.0) * env)
    idx = np.cumsum(ratio)
    idx *= (n - 1) / max(idx[-1], 1e-9)
    return np.interp(np.arange(n), idx, y).astype(np.float64)


def add_vibrato(y, sr, rate=5.5, depth_cents=20, delay_s=0.09):

    """Ramp in a gentle sung vibrato on held notes, keeping length fixed."""
    n = len(y)
    if n < int(0.12 * sr):
        return y
    t = np.arange(n) / sr
    env = np.clip((t - delay_s) / 0.10, 0.0, 1.0)
    env = env * env * (3 - 2 * env)
    ratio = 2.0 ** ((depth_cents / 1200.0) * np.sin(2 * np.pi * rate * t) * env)
    idx = np.cumsum(ratio)
    idx *= (n - 1) / max(idx[-1], 1e-9)
    return np.interp(np.arange(n), idx, y).astype(np.float64)


def add_breath(y, sr, seed=1, amount=0.045):
    """Soft breath / air at the onset, like a sung consonant release."""
    rng = np.random.default_rng(seed)
    n = len(y)
    noise = rng.standard_normal(n)
    # simple 2–7 kHz air
    from scipy.signal import butter, sosfilt
    sos = butter(2, [1800, 7000], btype="bandpass", fs=sr, output="sos")
    air = sosfilt(sos, noise)
    att = int(0.012 * sr)
    hold = int(0.06 * sr)
    env = np.zeros(n)
    a = min(att, n)
    env[:a] = np.linspace(0, 1, a)
    b = min(n, a + hold)
    if b > a:
        env[a:b] = np.linspace(1, 0.25, b - a)
    if b < n:
        tail = n - b
        env[b:] = 0.25 * np.exp(-np.arange(tail) / sr / 0.08)
    peak = np.max(np.abs(y)) + 1e-12
    return y + air * env * amount * peak


def render_hook(events, model, cache, phrase_dur=PHRASE_DUR):
    """Sung hook: legato overlaps, vibrato on holds, breath at onsets."""
    n = int(round(phrase_dur * SR))
    phrase = np.zeros(n)
    eighth = SPB / 2.0
    legato = 0.055  # slightly longer sung overlap
    for i, (pos, mid, dur8, word) in enumerate(events):
        raw = get_word(word, model, cache)
        sung = retune_to(raw, SR, midi_hz(mid), formant="preserved")
        # extend a little so the legato tail has audio to fade
        dur = dur8 * eighth * 0.96 + (legato if i < len(events) - 1 else 0.0)
        fitted = fit_duration(sung, SR, dur)
        fitted = add_scoop(fitted, SR, cents=-28 if dur8 >= 2 else -18, dur_s=0.05)
        if dur8 >= 2:
            fitted = add_vibrato(fitted, SR, rate=5.2, depth_cents=26, delay_s=0.07)
        seed = (abs(hash((word, mid, i))) % 99991) + 3
        fitted = add_breath(fitted, SR, seed=seed, amount=0.040)
        # longer crossfade on connected notes, crisper start on the first
        ms_in = 8 if i == 0 else 22
        ms_out = 14 if i == len(events) - 1 else 36
        fitted = fade(fitted, ms_in=ms_in, ms_out=ms_out)
        t = np.arange(len(fitted)) / SR
        env = 0.90 + 0.10 * np.exp(-t / 0.12)
        t0 = pos * eighth
        if i > 0:
            t0 = max(0.0, t0 - legato * 0.5)
        place(phrase, fitted * env, t0)
    peak = np.max(np.abs(phrase)) + 1e-12
    if peak > 0.95:
        phrase *= 0.92 / peak
    return phrase


def nightcore(y, st=NIGHTCORE_ST):
    """Pitch up with formant shift, tempo unchanged — nightcore timbre at 165 BPM."""
    # Formant-correct: raise the sung pitch, keep the singer's mouth shape.
    # Nightcore sheen comes from the pro chain (presence, air, a touch of exciter),
    # not a full cartoon formant shift.
    return ffmpeg_rubberband(y, SR, semitones=st, tempo=1.0, formant="preserved", quality=True)


def octave_down(y):
    return ffmpeg_rubberband(y, SR, semitones=-12.0, tempo=1.0, formant="preserved", quality=True)


def harmony_from(events, model, cache, phrase_dur=PHRASE_DUR):
    harm = [(pos, dorian_third_up(mid), dur, word) for pos, mid, dur, word in events]
    return render_hook(harm, model, cache, phrase_dur)


def stereoize(y, width_ms=11, width=0.22):
    """Light short-delay width, keep mono compatible."""
    d = int(width_ms * SR / 1000)
    L = y.copy()
    R = np.pad(y, (d, 0))[: len(y)] * (0.85 + width)
    # mid-weighted
    mid = 0.5 * (L + R)
    side = 0.5 * (L - R) * (1.0 + width)
    return np.stack([mid + side, mid - side], 1)


def plate_reverb(x, wet=0.22, predelay_s=0.024, decay=1.15):
    """Bright short plate-ish stereo reverb (procedural IR)."""
    from scipy.signal import fftconvolve
    rng = np.random.default_rng(12601)
    n_ir = int(decay * SR)
    ir = np.zeros((n_ir, 2))
    t = np.arange(n_ir) / SR
    env = np.exp(-t / (decay * 0.28))
    ir[:, 0] = rng.standard_normal(n_ir) * env
    ir[:, 1] = rng.standard_normal(n_ir) * env
    # early taps
    for ch, offs in ((0, (0.017, 0.029, 0.043)), (1, (0.019, 0.033, 0.051))):
        for k, off in enumerate(offs):
            i = int(off * SR)
            if i < n_ir:
                ir[i, ch] += (0.6 - 0.15 * k) * (1 if k % 2 == 0 else -1)
    # bright but not fizzy
    from scipy.signal import butter, sosfilt
    sos = butter(2, 6500, btype="lowpass", fs=SR, output="sos")
    ir[:, 0] = sosfilt(sos, ir[:, 0])
    ir[:, 1] = sosfilt(sos, ir[:, 1])
    pd = int(predelay_s * SR)
    padded = np.vstack([np.zeros((pd, 2)), ir])
    y = np.zeros((len(x), 2))
    src = x if x.ndim == 2 else np.stack([x, x], 1)
    for ch in (0, 1):
        conv = fftconvolve(src[:, ch], padded[:, ch], mode="full")
        y[:, ch] = conv[: len(src)]
    peak = np.max(np.abs(y)) + 1e-12
    src_peak = np.max(np.abs(src)) + 1e-12
    y = y / peak * src_peak
    return src * (1.0 - wet) + y * wet


def ping_pong(x, delay_s, fb=0.28, mix=0.18):
    d = int(delay_s * SR)
    if d <= 0 or 2 * d >= len(x):
        return x
    y = np.zeros_like(x)
    y[d:, 1] += x[:-d, 0]
    y[2 * d:, 0] += x[:-2 * d, 0] * fb
    y[d:, 0] += x[:-d, 1] * 0.7
    y[2 * d:, 1] += x[:-2 * d, 1] * fb
    return x * (1 - mix) + y * mix


def delay_throw(x, word_start_s, word_dur_s, delay_s=SPB * 0.75, taps=4):
    """Echo just the landing word so the throw is a production moment, not smear."""
    y = np.array(x, dtype=np.float64, copy=True)
    a = int(word_start_s * SR)
    b = int((word_start_s + word_dur_s) * SR)
    a = max(0, min(a, len(x)))
    b = max(a + 1, min(b, len(x)))
    grain = x[a:b].copy()
    # fade the grain
    k = min(len(grain) // 4, int(0.02 * SR))
    if k > 1:
        grain[:k] *= np.linspace(0, 1, k)[:, None] if grain.ndim == 2 else np.linspace(0, 1, k)
        grain[-k:] *= np.linspace(1, 0, k)[:, None] if grain.ndim == 2 else np.linspace(1, 0, k)
    for i in range(1, taps + 1):
        pos = b + int(i * delay_s * SR)
        if pos >= len(y):
            break
        g = (0.55 ** i) * (1.0 if i % 2 else 0.75)
        n = min(len(grain), len(y) - pos)
        # alternate pan by flipping L/R each tap
        bit = grain[:n] * g
        if bit.ndim == 2 and i % 2:
            bit = bit[:, ::-1]
        y[pos:pos + n] += bit
    return y


def formant_colour(y, shift=0.04):
    """Nudge vowel formant peaks by a fraction so layers do not share one mouth."""
    import engine1260 as E
    src = y if y.ndim == 2 else y[:, None]
    out = np.zeros_like(src, dtype=np.float64)
    f1, f2, f3 = 820 * (1 + shift), 1580 * (1 + shift), 2680 * (1 + shift)
    o1, o2, o3 = 820 * (1 - shift * 0.4), 1580 * (1 - shift * 0.4), 2680 * (1 - shift * 0.4)
    for ch in range(src.shape[1]):
        x = src[:, ch]
        x = E.rbj(x, f1, 4.8, "peak", gain_db=1.8)
        x = E.rbj(x, f2, 4.2, "peak", gain_db=1.4)
        x = E.rbj(x, f3, 3.2, "peak", gain_db=0.8)
        x = E.rbj(x, o1, 4.8, "peak", gain_db=-0.8)
        x = E.rbj(x, o2, 4.2, "peak", gain_db=-0.6)
        out[:, ch] = x
    return out if y.ndim == 2 else out[:, 0]


def chorus_double(mono, cents=11, delay_ms=15):
    """Stereo-detuned chorus: dry centre, slightly sharp / flat delayed sides."""
    up = ffmpeg_rubberband(mono, SR, semitones=cents / 100.0, formant="shifted", quality=True)
    dn = ffmpeg_rubberband(mono, SR, semitones=-cents / 100.0, formant="shifted", quality=True)
    d = int(delay_ms * SR / 1000)
    up_d = np.pad(up, (d, 0))[: len(mono)]
    dn_d = np.pad(dn, (int(d * 1.2), 0))[: len(mono)]
    # match lengths
    n = min(len(mono), len(up_d), len(dn_d))
    mono, up_d, dn_d = mono[:n], up_d[:n], dn_d[:n]
    L = mono * 0.70 + dn_d * 0.55 + up_d * 0.20
    R = mono * 0.70 + up_d * 0.55 + dn_d * 0.20
    return np.stack([L, R], 1)


def finish_intimate(mono, formant_shift=0.02):
    """Breakdown vocal: less nightcore (+3 st, formants shifted less aggressively),
    longer plate, almost no delay — a scene change, not a hook wall."""
    soft = ffmpeg_rubberband(mono, SR, semitones=3.0, tempo=1.0, formant="preserved", quality=True)
    st = chorus_double(soft, cents=7, delay_ms=18)
    st = formant_colour(st, shift=formant_shift)
    st = plate_reverb(st, wet=0.38, predelay_s=0.032, decay=1.8)
    st = ping_pong(st, delay_s=SPB * 1.5, fb=0.18, mix=0.08)
    st = ffmpeg_pro_chain(st, intimate=True)
    peak = np.max(np.abs(st)) + 1e-12
    if peak > 0.98:
        st *= 0.95 / peak
    return st


def ffmpeg_pro_chain(y, sr=SR, intimate=False):
    """De-ess, compress, presence, air, a light exciter — a small vocal mix bus."""
    if intimate:
        filt = (
            "highpass=f=80:poles=2,"
            "equalizer=f=260:t=q:w=0.9:g=-1.5,"
            "equalizer=f=2800:t=q:w=0.8:g=2.2,"
            "equalizer=f=5200:t=q:w=1.1:g=1.2,"
            "deesser=i=0.18:m=0.5:f=0.5,"
            "acompressor=threshold=-22dB:ratio=2.6:attack=8:release=90:makeup=2.0:knee=4,"
            "aexciter=amount=0.18:drive=2.8:blend=0:freq=5000:ceil=13000,"
            "treble=g=1.2:f=8500"
        )
    else:
        filt = (
            "highpass=f=90:poles=2,"
            "equalizer=f=280:t=q:w=0.9:g=-2.0,"
            "equalizer=f=3300:t=q:w=0.8:g=3.4,"
            "equalizer=f=5600:t=q:w=1.15:g=2.0,"
            "deesser=i=0.24:m=0.58:f=0.55,"
            "acompressor=threshold=-20dB:ratio=3.2:attack=6:release=70:makeup=2.6:knee=4,"
            "aexciter=amount=0.32:drive=3.2:blend=0:freq=4500:ceil=14500,"
            "treble=g=2.0:f=9000"
        )
    import tempfile
    with tempfile.TemporaryDirectory(prefix="vchain-") as td:
        inp = Path(td) / "in.wav"
        out = Path(td) / "out.wav"
        sf.write(str(inp), y, sr, subtype="FLOAT")
        run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(inp), "-af", filt, "-ar", str(sr), str(out),
        ])
        z, _ = sf.read(str(out), always_2d=True)
    z = z.astype(np.float64)
    if y.ndim == 1 and z.shape[1] == 1:
        z = z[:, 0]
    peak = np.max(np.abs(z)) + 1e-12
    src = np.max(np.abs(y)) + 1e-12
    if peak > src * 1.15:
        z *= (src * 1.05) / peak
    return z


def finish_lead(mono, throws=None, formant_shift=0.035):
    """Formant-correct nightcore, doubles, colour, plate, throws, pro chain."""
    nc = nightcore(mono)
    st = chorus_double(nc, cents=11, delay_ms=15)
    st = formant_colour(st, shift=formant_shift)
    st = plate_reverb(st, wet=0.20, predelay_s=0.022, decay=1.05)
    st = ping_pong(st, delay_s=SPB * 0.75, fb=0.26, mix=0.16)
    if throws:
        for start, dur in throws:
            # throws are timed on the pre-nightcore phrase; tempo is unchanged so times stand
            st = delay_throw(st, start, dur, delay_s=SPB * 0.75, taps=4)
    st = ffmpeg_pro_chain(st, intimate=False)
    peak = np.max(np.abs(st)) + 1e-12
    if peak > 0.98:
        st *= 0.95 / peak
    return st


def finish_layer(mono, wet=0.16, width=0.28, delay_mix=0.10, formant_shift=-0.03):
    nc = nightcore(mono)
    st = chorus_double(nc, cents=8, delay_ms=18)
    st = formant_colour(st, shift=formant_shift)
    st = plate_reverb(st, wet=wet, predelay_s=0.028, decay=1.2)
    st = ping_pong(st, delay_s=SPB * 0.75, fb=0.22, mix=delay_mix)
    st = ffmpeg_pro_chain(st, intimate=False)
    peak = np.max(np.abs(st)) + 1e-12
    if peak > 0.98:
        st *= 0.95 / peak
    return st


def write(path, y):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    if y.ndim == 1:
        y = np.stack([y, y], 1)
    sf.write(str(path), y, SR, subtype="PCM_24")
    print(f"  wrote {path}  {len(y)/SR:.3f}s  peak={np.max(np.abs(y)):.3f}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    cache = OUT / "_cache"
    cache.mkdir(exist_ok=True)
    print("synthesising + tuning hooks A/B and C/D (Jenny lead, Alba double)…")

    def render_set(events):
        lead = render_hook(events, MODEL_LEAD, cache)
        dbl = render_hook(events, MODEL_DOUBLE, cache)
        harm = harmony_from(events, MODEL_LEAD, cache)
        octv = octave_down(lead)
        return lead, dbl, harm, octv

    lead_a, dbl_a, harm_a, oct_a = render_set(HOOK_A)
    lead_b, dbl_b, harm_b, oct_b = render_set(HOOK_B)
    lead_c, dbl_c, harm_c, oct_c = render_set(HOOK_C)
    lead_d, dbl_d, harm_d, oct_d = render_set(HOOK_D)
    lead_e, dbl_e, harm_e, oct_e = render_set(HOOK_E)
    lead_f, dbl_f, harm_f, oct_f = render_set(HOOK_F)
    lead_g, dbl_g, harm_g, oct_g = render_set(HOOK_G)
    tag = render_hook(TAG, MODEL_LEAD, cache, phrase_dur=2 * BAR)
    tag_dbl = render_hook(TAG, MODEL_DOUBLE, cache, phrase_dur=2 * BAR)

    # Landing-word throws: "sleep"/"glows" at 9 eighths, "hills" at 8
    eighth = SPB / 2.0
    throws_a = [(9 * eighth, 5 * eighth)]
    throws_b = [(8 * eighth, 6 * eighth)]
    throws_c = [(9 * eighth, 5 * eighth)]
    throws_d = [(8 * eighth, 6 * eighth)]

    print("nightcore + fx…")
    lead_a_fx = finish_lead(lead_a, throws=throws_a, formant_shift=0.035)
    lead_b_fx = finish_lead(lead_b, throws=throws_b, formant_shift=0.035)
    lead_c_fx = finish_lead(lead_c, throws=throws_c, formant_shift=0.050)
    lead_d_fx = finish_lead(lead_d, throws=throws_d, formant_shift=0.050)
    dbl_a_fx = finish_layer(dbl_a, wet=0.18, width=0.32, delay_mix=0.08, formant_shift=-0.03)
    dbl_b_fx = finish_layer(dbl_b, wet=0.18, width=0.32, delay_mix=0.08, formant_shift=-0.03)
    dbl_c_fx = finish_layer(dbl_c, wet=0.18, width=0.32, delay_mix=0.08, formant_shift=-0.045)
    dbl_d_fx = finish_layer(dbl_d, wet=0.18, width=0.32, delay_mix=0.08, formant_shift=-0.045)
    harm_a_fx = finish_layer(harm_a, wet=0.22, width=0.40, delay_mix=0.14, formant_shift=0.02)
    harm_b_fx = finish_layer(harm_b, wet=0.22, width=0.40, delay_mix=0.14, formant_shift=0.02)
    harm_c_fx = finish_layer(harm_c, wet=0.22, width=0.40, delay_mix=0.14, formant_shift=0.04)
    harm_d_fx = finish_layer(harm_d, wet=0.22, width=0.40, delay_mix=0.14, formant_shift=0.04)
    oct_a_fx = stereoize(nightcore(oct_a), width_ms=6, width=0.08)
    oct_b_fx = stereoize(nightcore(oct_b), width_ms=6, width=0.08)
    oct_c_fx = stereoize(nightcore(oct_c), width_ms=6, width=0.08)
    oct_d_fx = stereoize(nightcore(oct_d), width_ms=6, width=0.08)
    # Breakdown: intimate (soft +3 st nightcore + long plate). Countermelody: bright lead.
    lead_e_fx = finish_intimate(lead_e, formant_shift=0.02)
    dbl_e_fx = finish_intimate(dbl_e, formant_shift=-0.02)
    harm_e_fx = finish_intimate(harm_e, formant_shift=0.03)
    oct_e_fx = plate_reverb(stereoize(oct_e, width_ms=8, width=0.08), wet=0.30, predelay_s=0.03, decay=1.6)
    lead_f_fx = finish_intimate(lead_f, formant_shift=0.02)
    dbl_f_fx = finish_intimate(dbl_f, formant_shift=-0.02)
    harm_f_fx = finish_intimate(harm_f, formant_shift=0.03)
    oct_f_fx = plate_reverb(stereoize(oct_f, width_ms=8, width=0.08), wet=0.30, predelay_s=0.03, decay=1.6)
    lead_g_fx = finish_lead(lead_g, throws=[(9 * (SPB / 2.0), 7 * (SPB / 2.0))], formant_shift=0.06)
    dbl_g_fx = finish_layer(dbl_g, wet=0.22, width=0.36, delay_mix=0.16, formant_shift=-0.04)
    harm_g_fx = finish_layer(harm_g, wet=0.24, width=0.42, delay_mix=0.16, formant_shift=0.05)
    oct_g_fx = stereoize(nightcore(oct_g), width_ms=6, width=0.10)
    # tag: bigger reverb, no delay smear into the drop
    tag_fx = plate_reverb(stereoize(nightcore(tag), width_ms=10, width=0.2), wet=0.38, predelay_s=0.018, decay=1.6)
    tag_fx += plate_reverb(stereoize(nightcore(tag_dbl), width_ms=16, width=0.3), wet=0.40, predelay_s=0.03, decay=1.7) * 0.45
    peak = np.max(np.abs(tag_fx)) + 1e-12
    tag_fx *= 0.95 / max(peak, 0.95)

    for key, lead, dbl, harm, octv, dry_src in (
        ("a", lead_a_fx, dbl_a_fx, harm_a_fx, oct_a_fx, lead_a),
        ("b", lead_b_fx, dbl_b_fx, harm_b_fx, oct_b_fx, lead_b),
        ("c", lead_c_fx, dbl_c_fx, harm_c_fx, oct_c_fx, lead_c),
        ("d", lead_d_fx, dbl_d_fx, harm_d_fx, oct_d_fx, lead_d),
        ("e", lead_e_fx, dbl_e_fx, harm_e_fx, oct_e_fx, lead_e),
        ("f", lead_f_fx, dbl_f_fx, harm_f_fx, oct_f_fx, lead_f),
        ("g", lead_g_fx, dbl_g_fx, harm_g_fx, oct_g_fx, lead_g),
    ):
        write(OUT / f"hook_{key}_lead.wav", lead)
        write(OUT / f"hook_{key}_double.wav", dbl)
        write(OUT / f"hook_{key}_harm.wav", harm)
        write(OUT / f"hook_{key}_oct.wav", octv)
        write(OUT / f"hook_{key}_lead_dry.wav", stereoize(nightcore(dry_src), width_ms=7, width=0.12))
    write(OUT / "tag_to_the_hills.wav", tag_fx)

    print("chops…")
    for name, text in CHOPS.items():
        raw = get_word(text, MODEL_LEAD, cache)
        # tune to A4 (81) as a neutral; renderer retunes if needed
        sung = retune_to(raw, SR, midi_hz(81), formant="preserved")
        sung = fade(fit_duration(sung, SR, SPB), ms_in=5, ms_out=20)
        st = finish_layer(sung, wet=0.20, width=0.35, delay_mix=0.12)
        write(OUT / f"chop_{name}.wav", st)
        write(OUT / f"chop_{name}_dry.wav", stereoize(nightcore(sung), width_ms=8, width=0.2))

    # Combined hook A+B (4 bars) already mixed at production levels for convenience
    def stack_ab(a, b, da, db, ha, hb, oa, ob):
        n = len(a) + len(b)
        y = np.zeros((n, 2))
        y[: len(a)] += a * 1.00
        y[: len(a)] += da * 0.38
        y[: len(a)] += ha * 0.28
        y[: len(a)] += oa * 0.32
        y[len(a):] += b * 1.00
        y[len(a):] += db * 0.38
        y[len(a):] += hb * 0.28
        y[len(a):] += ob * 0.32
        peak = np.max(np.abs(y)) + 1e-12
        if peak > 0.98:
            y *= 0.95 / peak
        return y

    stacked = stack_ab(lead_a_fx, lead_b_fx, dbl_a_fx, dbl_b_fx, harm_a_fx, harm_b_fx, oct_a_fx, oct_b_fx)
    write(OUT / "hook_ab_layered.wav", stacked)
    stacked_cd = stack_ab(lead_c_fx, lead_d_fx, dbl_c_fx, dbl_d_fx, harm_c_fx, harm_d_fx, oct_c_fx, oct_d_fx)
    write(OUT / "hook_cd_layered.wav", stacked_cd)
    stacked_ef = stack_ab(lead_e_fx, lead_f_fx, dbl_e_fx, dbl_f_fx, harm_e_fx, harm_f_fx, oct_e_fx, oct_f_fx)
    write(OUT / "hook_ef_layered.wav", stacked_ef)
    write(OUT / "hook_g_layered.wav", lead_g_fx * 1.0 + dbl_g_fx * 0.35 + harm_g_fx * 0.28)
    print("vocals ready", OUT)


if __name__ == "__main__":
    main()
