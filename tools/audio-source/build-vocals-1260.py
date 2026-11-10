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
OUT = Path(os.environ.get("VOC_OUT", "/workspace/qa/audio-1260/v2/vocals"))

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
    (7, 79, 1, "nev"),
    (8, 81, 1, "er"),
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
}

# Words we ask Piper to say (phonetic helpers for tight syllables).
SAY = {
    "Up": "Up",
    "the": "the",
    "glen": "glen",
    "we": "we",
    "nev": "nev",
    "er": "er",
    "sleep": "sleep",
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
    path = cache / cache_key(say + "_" + text, model)
    if not path.exists():
        # slightly slower for vowels so pitch-correction has something to chew on
        scale = 1.25 if text.lower() in {"oh", "yeah", "hey", "sleep", "hills", "glen"} else 1.12
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


def render_hook(events, model, cache, phrase_dur=PHRASE_DUR):
    n = int(round(phrase_dur * SR))
    phrase = np.zeros(n)
    eighth = SPB / 2.0
    for pos, mid, dur8, word in events:
        raw = get_word(word, model, cache)
        sung = retune_to(raw, SR, midi_hz(mid), formant="preserved")
        dur = dur8 * eighth * 0.96
        fitted = fade(fit_duration(sung, SR, dur), ms_in=6, ms_out=18)
        # small natural amplitude envelope: longer notes bloom then settle
        t = np.arange(len(fitted)) / SR
        env = 0.88 + 0.12 * np.exp(-t / 0.12)
        place(phrase, fitted * env, pos * eighth)
    # gentle peak normalise
    peak = np.max(np.abs(phrase)) + 1e-12
    if peak > 0.95:
        phrase *= 0.92 / peak
    return phrase


def nightcore(y, st=NIGHTCORE_ST):
    """Pitch up with formant shift, tempo unchanged — nightcore timbre at 165 BPM."""
    return ffmpeg_rubberband(y, SR, semitones=st, tempo=1.0, formant="shifted", quality=True)


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


def finish_lead(mono, throws=None):
    """Nightcore, width, plate, dotted-8th delay, optional landing-word throws."""
    nc = nightcore(mono)
    st = stereoize(nc, width_ms=9, width=0.18)
    st = plate_reverb(st, wet=0.20, predelay_s=0.022, decay=1.05)
    st = ping_pong(st, delay_s=SPB * 0.75, fb=0.26, mix=0.16)
    if throws:
        for start, dur in throws:
            # throws are timed on the pre-nightcore phrase; tempo is unchanged so times stand
            st = delay_throw(st, start, dur, delay_s=SPB * 0.75, taps=4)
    peak = np.max(np.abs(st)) + 1e-12
    if peak > 0.98:
        st *= 0.95 / peak
    return st


def finish_layer(mono, wet=0.16, width=0.28, delay_mix=0.10):
    nc = nightcore(mono)
    st = stereoize(nc, width_ms=14, width=width)
    st = plate_reverb(st, wet=wet, predelay_s=0.028, decay=1.2)
    st = ping_pong(st, delay_s=SPB * 0.75, fb=0.22, mix=delay_mix)
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
    print("synthesising + tuning hook A/B (Jenny lead, Alba double)…")

    lead_a = render_hook(HOOK_A, MODEL_LEAD, cache)
    lead_b = render_hook(HOOK_B, MODEL_LEAD, cache)
    dbl_a = render_hook(HOOK_A, MODEL_DOUBLE, cache)
    dbl_b = render_hook(HOOK_B, MODEL_DOUBLE, cache)
    harm_a = harmony_from(HOOK_A, MODEL_LEAD, cache)
    harm_b = harmony_from(HOOK_B, MODEL_LEAD, cache)
    oct_a = octave_down(lead_a)
    oct_b = octave_down(lead_b)
    tag = render_hook(TAG, MODEL_LEAD, cache, phrase_dur=2 * BAR)
    tag_dbl = render_hook(TAG, MODEL_DOUBLE, cache, phrase_dur=2 * BAR)

    # Landing-word throws: "sleep" starts at 9 eighths, "hills" at 8
    eighth = SPB / 2.0
    throws_a = [(9 * eighth, 5 * eighth)]
    throws_b = [(8 * eighth, 6 * eighth)]

    print("nightcore + fx…")
    lead_a_fx = finish_lead(lead_a, throws=throws_a)
    lead_b_fx = finish_lead(lead_b, throws=throws_b)
    dbl_a_fx = finish_layer(dbl_a, wet=0.18, width=0.32, delay_mix=0.08)
    dbl_b_fx = finish_layer(dbl_b, wet=0.18, width=0.32, delay_mix=0.08)
    harm_a_fx = finish_layer(harm_a, wet=0.22, width=0.40, delay_mix=0.14)
    harm_b_fx = finish_layer(harm_b, wet=0.22, width=0.40, delay_mix=0.14)
    oct_a_fx = stereoize(nightcore(oct_a), width_ms=6, width=0.08)
    oct_b_fx = stereoize(nightcore(oct_b), width_ms=6, width=0.08)
    # tag: bigger reverb, no delay smear into the drop
    tag_fx = plate_reverb(stereoize(nightcore(tag), width_ms=10, width=0.2), wet=0.38, predelay_s=0.018, decay=1.6)
    tag_fx += plate_reverb(stereoize(nightcore(tag_dbl), width_ms=16, width=0.3), wet=0.40, predelay_s=0.03, decay=1.7) * 0.45
    peak = np.max(np.abs(tag_fx)) + 1e-12
    tag_fx *= 0.95 / max(peak, 0.95)

    write(OUT / "hook_a_lead.wav", lead_a_fx)
    write(OUT / "hook_b_lead.wav", lead_b_fx)
    write(OUT / "hook_a_double.wav", dbl_a_fx)
    write(OUT / "hook_b_double.wav", dbl_b_fx)
    write(OUT / "hook_a_harm.wav", harm_a_fx)
    write(OUT / "hook_b_harm.wav", harm_b_fx)
    write(OUT / "hook_a_oct.wav", oct_a_fx)
    write(OUT / "hook_b_oct.wav", oct_b_fx)
    write(OUT / "tag_to_the_hills.wav", tag_fx)

    # Dry nightcore phrases too (renderer may want a tighter dry lead)
    write(OUT / "hook_a_lead_dry.wav", stereoize(nightcore(lead_a), width_ms=7, width=0.12))
    write(OUT / "hook_b_lead_dry.wav", stereoize(nightcore(lead_b), width_ms=7, width=0.12))

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
    print("vocals ready", OUT)


if __name__ == "__main__":
    main()
