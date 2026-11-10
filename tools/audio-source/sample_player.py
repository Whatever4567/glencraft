#!/usr/bin/env python3
"""Permissively licensed SFZ / SoundFont sample player.

Velocity layers, round-robins, looped sustains and release tails.
Implemented with soundfile + numpy; no FluidSynth and no apt packages.

Libraries (not shipped in git — see LICENSES.md and fetch-samples.sh):

* VSCO-2 Community Edition (CC0) — orchestral WAV / SFZ
* FluidR3_GM (MIT) — choir, whistle, GM drums and colour
"""
from __future__ import annotations

import math
import os
import re
import sys
import threading
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

SR_OUT = 44100

# ---------------------------------------------------------------------------
# Library roots
# ---------------------------------------------------------------------------
def sample_root() -> Path | None:
    cands = []
    env = os.environ.get("GLENCRAFT_SAMPLE_LIB", "").strip()
    if env:
        cands.append(Path(env))
    cands.append(Path("/workspace/qa/album/samples"))
    here = Path(__file__).resolve()
    cands.append(here.parents[3] / "qa" / "album" / "samples")
    for p in cands:
        if p.is_dir():
            return p
    return None


def vsco_dir() -> Path | None:
    root = sample_root()
    if root is None:
        return None
    p = root / "VSCO-2-CE"
    return p if (p / "Harp.sfz").is_file() else None


def fluidr3_path() -> Path | None:
    root = sample_root()
    if root is None:
        return None
    p = root / "FluidR3_GM.sf2"
    return p if p.is_file() and p.stat().st_size > 10_000_000 else None


def libraries_available() -> bool:
    return vsco_dir() is not None


# ---------------------------------------------------------------------------
# WAV I/O and resampling
# ---------------------------------------------------------------------------
_wav_cache: dict[str, tuple[np.ndarray, int]] = {}
_cache_lock = threading.Lock()


def load_wav(path: Path) -> tuple[np.ndarray, int]:
    key = str(path)
    with _cache_lock:
        hit = _wav_cache.get(key)
    if hit is not None:
        return hit
    data, sr = sf.read(str(path), dtype="float32", always_2d=True)
    data = np.asarray(data, dtype=np.float32)
    with _cache_lock:
        if len(_wav_cache) < 4000:
            _wav_cache[key] = (data, int(sr))
    return data, int(sr)


def _as_stereo(x: np.ndarray) -> np.ndarray:
    if x.ndim == 1:
        return np.stack([x, x], axis=1)
    if x.shape[1] == 1:
        return np.repeat(x, 2, axis=1)
    return x[:, :2]


def interp_audio(x: np.ndarray, ratio: float, out_sr: int, in_sr: int) -> np.ndarray:
    """Pitch-shift by `ratio` (>1 = higher / shorter) and resample to out_sr."""
    x = _as_stereo(np.asarray(x, dtype=np.float64))
    if x.shape[0] < 2:
        return np.zeros((1, 2), dtype=np.float64)
    # combined step: output index i corresponds to input time
    #   t_in = i / out_sr * ratio, sample = t_in * in_sr = i * (in_sr * ratio / out_sr)
    step = (in_sr * ratio) / float(out_sr)
    n_out = max(1, int(math.floor((x.shape[0] - 1) / step)))
    idx = np.arange(n_out, dtype=np.float64) * step
    i0 = np.floor(idx).astype(np.int64)
    i1 = np.minimum(i0 + 1, x.shape[0] - 1)
    frac = (idx - i0)[:, None]
    return x[i0] * (1.0 - frac) + x[i1] * frac


def eq_power_xfade(a: np.ndarray, b: np.ndarray, n: int) -> np.ndarray:
    n = min(n, len(a), len(b))
    if n <= 1:
        return np.concatenate([a, b], axis=0)
    t = np.linspace(0, np.pi / 2, n)[:, None]
    fade_out = np.cos(t)
    fade_in = np.sin(t)
    head = a[:-n]
    mid = a[-n:] * fade_out + b[:n] * fade_in
    tail = b[n:]
    return np.concatenate([head, mid, tail], axis=0)


def find_loop(x: np.ndarray, sr: int) -> tuple[int, int] | None:
    """Autocorrelation loop in the stable mid of an unlooped sustain."""
    n = len(x)
    if n < int(1.4 * sr):
        return None
    mid = x.mean(axis=1) if x.ndim == 2 else x
    release = int(min(0.6 * sr, n * 0.18))
    start0 = int(min(0.45 * sr, n * 0.18))
    win = int(0.22 * sr)
    if start0 + win >= n - release - int(0.5 * sr):
        return None
    w = mid[start0:start0 + win]
    w = w - w.mean()
    denom = float(np.dot(w, w)) + 1e-12
    best_c = -1.0
    best_lag = int(1.1 * sr)
    lo = int(0.65 * sr)
    hi = int(min(1.85 * sr, n - release - start0 - win))
    if hi <= lo:
        return None
    step = max(1, int(0.008 * sr))
    for lag in range(lo, hi, step):
        y = mid[start0 + lag:start0 + lag + win]
        y = y - y.mean()
        c = float(np.dot(w, y)) / (denom)
        if c > best_c:
            best_c = c
            best_lag = lag
    if best_c < 0.55:
        # still loop; a long crossfade will hide the join
        best_lag = int(min(1.15 * sr, hi - 1))
    return start0, start0 + best_lag


def loop_source(x: np.ndarray, sr: int, needed: int, loop: tuple[int, int] | None,
                xf_s: float = 0.08) -> np.ndarray:
    """Build `needed` frames, looping [start, end) with an equal-power join."""
    x = _as_stereo(x)
    if needed <= len(x) and loop is None:
        return x[:needed].astype(np.float64, copy=True)
    if loop is None:
        loop = find_loop(x, sr)
    if loop is None:
        if needed <= len(x):
            return x[:needed].astype(np.float64, copy=True)
        # pad by fading a mid slice if the file is short
        out = np.zeros((needed, 2), dtype=np.float64)
        out[:len(x)] = x
        return out
    ls, le = int(loop[0]), int(loop[1])
    ls = max(0, min(ls, len(x) - 2))
    le = max(ls + 8, min(le, len(x)))
    body = x[:le].astype(np.float64, copy=True)
    cycle = x[ls:le].astype(np.float64, copy=True)
    xf = max(8, int(xf_s * sr))
    xf = min(xf, len(cycle) // 3)
    out = body
    # safety
    guard = 0
    while len(out) < needed and guard < 400:
        out = eq_power_xfade(out, cycle, xf)
        guard += 1
    if len(out) < needed:
        pad = np.zeros((needed - len(out), 2), dtype=np.float64)
        out = np.concatenate([out, pad], axis=0)
    return out[:needed]


def release_tail(x: np.ndarray, sr: int, loop: tuple[int, int] | None, rel_s: float) -> np.ndarray:
    """Natural end of the file after the loop, or a faded copy of the loop."""
    x = _as_stereo(x)
    n_rel = max(8, int(rel_s * sr))
    if loop is not None and loop[1] < len(x) - 16:
        tail = x[int(loop[1]):].astype(np.float64, copy=True)
        if len(tail) >= n_rel:
            return tail[:n_rel]
        # extend by faded loop if the recorded tail is short
        extra = loop_source(x, sr, n_rel, loop)[-n_rel:]
        out = np.zeros((n_rel, 2), dtype=np.float64)
        out[:len(tail)] = tail
        # crossfade into extra
        if len(tail) < n_rel:
            out[len(tail):] = extra[len(tail):]
        return out
    # fade the last part of the sustain
    end = x[-min(len(x), max(n_rel, int(0.4 * sr))):].astype(np.float64, copy=True)
    if len(end) < n_rel:
        pad = np.zeros((n_rel - len(end), 2), dtype=np.float64)
        end = np.concatenate([end, pad], axis=0)
    else:
        end = end[:n_rel]
    fade = np.linspace(1.0, 0.0, len(end))[:, None] ** 1.05
    return end * fade


def apply_amp_env(x: np.ndarray, sr: int, attack: float, release: float, peak: float = 1.0) -> np.ndarray:
    n = len(x)
    e = np.ones(n, dtype=np.float64) * peak
    a = min(n, max(1, int(attack * sr)))
    r = min(n, max(1, int(release * sr)))
    e[:a] *= np.linspace(0.0, 1.0, a) ** 1.05
    if r < n:
        e[-r:] *= np.linspace(1.0, 0.0, r) ** 1.1
    return x * e[:, None]


# ---------------------------------------------------------------------------
# SFZ
# ---------------------------------------------------------------------------
_OPCODE_START = re.compile(r"(?:(?<=\s)|^)([a-zA-Z_][a-zA-Z0-9_]*)=")


def _iter_opcodes(body: str):
    """Yield (opcode, value) pairs. Values may contain spaces (VSCO paths)."""
    matches = list(_OPCODE_START.finditer(body))
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        yield m.group(1).lower(), body[m.end():end].strip()


def _midi_token(v: str) -> int:
    # numbers or note names like c4, f#3
    v = v.strip()
    if re.fullmatch(r"-?\d+", v):
        return int(v)
    m = re.fullmatch(r"([a-gA-G])([#b]?)(-?\d+)", v)
    if not m:
        return 60
    names = {"c": 0, "d": 2, "e": 4, "f": 5, "g": 7, "a": 9, "b": 11}
    pc = names[m.group(1).lower()]
    if m.group(2) == "#":
        pc += 1
    elif m.group(2) == "b":
        pc -= 1
    octv = int(m.group(3))
    return 12 * (octv + 1) + pc


def parse_sfz(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8", errors="replace")
    # strip // comments
    text = re.sub(r"//.*?$", "", text, flags=re.M)
    parts = re.split(r"<(control|global|group|region)\s*>", text, flags=re.I)
    # parts[0] preamble, then (tag, body, tag, body, ...)
    control: dict = {}
    glob: dict = {}
    group: dict = {}
    regions: list[dict] = []
    default_path = ""

    def eat(body: str, into: dict) -> None:
        for k, v in _iter_opcodes(body):
            if v:
                into[k] = v

    i = 1
    while i + 1 < len(parts):
        tag = parts[i].lower()
        body = parts[i + 1]
        if tag == "control":
            control = {}
            eat(body, control)
            default_path = control.get("default_path", default_path).replace("\\", "/")
        elif tag == "global":
            glob = {}
            eat(body, glob)
        elif tag == "group":
            group = {}
            eat(body, group)
        elif tag == "region":
            reg = {}
            reg.update(glob)
            reg.update(group)
            eat(body, reg)
            sample = reg.get("sample")
            if not sample:
                i += 2
                continue
            sample = sample.replace("\\", "/")
            pref = (reg.get("default_path") or default_path or "").replace("\\", "/")
            if pref and not Path(sample).is_absolute():
                full = (pref.rstrip("/") + "/" + sample.lstrip("/")) if not sample.startswith(pref) else sample
            else:
                full = sample
            wav = (path.parent / full).resolve()
            try:
                lokey = _midi_token(reg["lokey"]) if "lokey" in reg else (
                    _midi_token(reg["key"]) if "key" in reg else 0
                )
                hikey = _midi_token(reg["hikey"]) if "hikey" in reg else (
                    _midi_token(reg["key"]) if "key" in reg else 127
                )
            except Exception:
                lokey, hikey = 0, 127
            center = _midi_token(reg["pitch_keycenter"]) if "pitch_keycenter" in reg else (lokey + hikey) // 2
            lovel = int(float(reg.get("lovel", 0)))
            hivel = int(float(reg.get("hivel", 127)))
            volume = float(reg.get("volume", 0.0))
            pan = float(reg.get("pan", 0.0))
            tune = float(reg.get("tune", 0.0))  # cents
            transpose = int(float(reg.get("transpose", 0)))
            attack = float(reg.get("ampeg_attack", 0.0))
            release = float(reg.get("ampeg_release", 0.3))
            seq_pos = int(float(reg.get("seq_position", 0) or 0))
            seq_len = int(float(reg.get("seq_length", 0) or 0))
            loop_mode = (reg.get("loop_mode") or "").lower()
            loop = None
            if "loop_start" in reg and "loop_end" in reg:
                loop = (int(float(reg["loop_start"])), int(float(reg["loop_end"])))
            regions.append({
                "path": wav,
                "lokey": lokey,
                "hikey": hikey,
                "center": center + transpose,
                "lovel": lovel,
                "hivel": hivel,
                "volume_db": volume,
                "pan": pan / 100.0 if abs(pan) > 1.5 else pan,  # sfz pan is -100..100
                "tune": tune,
                "attack": attack,
                "release": release,
                "seq_pos": seq_pos,
                "seq_len": seq_len,
                "loop_mode": loop_mode,
                "loop": loop,
            })
        i += 2
    return regions


class SfzInstrument:
    def __init__(self, sfz_path: Path, one_shot: bool = False):
        self.path = sfz_path
        self.one_shot = one_shot
        self.regions = [r for r in parse_sfz(sfz_path) if r["path"].is_file()]
        self._rr = 0
        self._loops: dict[str, tuple[int, int] | None] = {}
        # group identical key/vel into implicit RR if seq is unused
        if self.regions and all(r["seq_pos"] == 0 for r in self.regions):
            buckets: dict[tuple, list] = {}
            for r in self.regions:
                key = (r["lokey"], r["hikey"], r["lovel"], r["hivel"], r["center"])
                buckets.setdefault(key, []).append(r)
            for group in buckets.values():
                if len(group) > 1:
                    for i, r in enumerate(group, start=1):
                        r["seq_pos"] = i
                        r["seq_len"] = len(group)

    def _loop_for(self, path: Path, audio: np.ndarray, sr: int) -> tuple[int, int] | None:
        k = str(path)
        if k not in self._loops:
            self._loops[k] = None if self.one_shot else find_loop(audio, sr)
        return self._loops[k]

    def _pick(self, key: int, vel127: int) -> dict | None:
        hits = [r for r in self.regions
                if r["lokey"] <= key <= r["hikey"] and r["lovel"] <= vel127 <= r["hivel"]]
        if not hits:
            # nearest keycenter whose range is closest
            pool = [r for r in self.regions if r["lovel"] <= vel127 <= r["hivel"]] or self.regions
            if not pool:
                return None
            hits = pool
        # prefer in-range, then closest center
        in_range = [r for r in hits if r["lokey"] <= key <= r["hikey"]]
        cand = in_range or hits
        # RR
        seq_len = max((r["seq_len"] for r in cand), default=0)
        if seq_len >= 2:
            pos = (self._rr % seq_len) + 1
            rr = [r for r in cand if r["seq_pos"] == pos] or cand
            cand = rr
        self._rr += 1
        return min(cand, key=lambda r: abs(r["center"] - key))

    def note(self, key: float, dur: float, vel: float = 0.7,
             release: float | None = None, attack: float | None = None,
             gain: float = 1.0) -> tuple[np.ndarray, np.ndarray]:
        key_i = int(round(key))
        vel127 = int(np.clip(vel, 0, 1) * 127)
        reg = self._pick(key_i, vel127)
        if reg is None:
            z = np.zeros(max(8, int(dur * SR_OUT)))
            return z, z.copy()
        audio, sr = load_wav(reg["path"])
        audio = _as_stereo(audio)
        loop = reg["loop"] or self._loop_for(reg["path"], audio, sr)
        cents = (key - reg["center"]) * 100.0 + reg["tune"]
        ratio = 2.0 ** (cents / 1200.0)
        rel_s = release if release is not None else max(0.08, min(reg["release"], 2.5) if not self.one_shot else 0.25)
        att_s = attack if attack is not None else max(0.001, reg["attack"])
        if self.one_shot:
            # play the recorded hit, pitch if needed, don't force a long sustain
            src = audio.astype(np.float64, copy=False)
            pitched = interp_audio(src, ratio, SR_OUT, sr)
            n = len(pitched)
            env_rel = min(0.25, rel_s)
            pitched = apply_amp_env(pitched, SR_OUT, att_s, env_rel, peak=1.0)
        else:
            hold = max(dur, 0.05)
            # source frames needed at the original rate to cover hold+release after pitch
            needed = int((hold + rel_s) * sr * ratio) + 8
            # use most of the file as sustain, append a natural tail
            sustain = loop_source(audio, sr, max(needed, int(hold * sr * ratio)), loop)
            tail = release_tail(audio, sr, loop, rel_s * ratio + 0.05)
            xf = max(8, int(0.04 * sr))
            src = eq_power_xfade(sustain, tail, xf)
            pitched = interp_audio(src, ratio, SR_OUT, sr)
            # trim / pad to hold+release at output rate
            n_out = max(8, int((hold + rel_s) * SR_OUT))
            if len(pitched) < n_out:
                pad = np.zeros((n_out - len(pitched), 2), dtype=np.float64)
                pitched = np.concatenate([pitched, pad], axis=0)
            else:
                pitched = pitched[:n_out]
            pitched = apply_amp_env(pitched, SR_OUT, att_s, rel_s, peak=1.0)
        # volume opcode is dB; VSCO often uses +10..+20 on already-hot files — clamp
        vol = 10.0 ** (np.clip(reg["volume_db"], -24.0, 9.0) / 20.0)
        vel_g = float(vel) ** 1.15
        g = gain * vol * vel_g
        pan = float(np.clip(reg["pan"], -1.0, 1.0))
        gL = math.sqrt(0.5 * (1.0 - pan)) * g / 0.7071
        gR = math.sqrt(0.5 * (1.0 + pan)) * g / 0.7071
        L = pitched[:, 0] * gL
        R = pitched[:, 1] * gR
        return L, R


# ---------------------------------------------------------------------------
# One-shot folder banks (VSCO percussion filename conventions)
# ---------------------------------------------------------------------------
_VEL_TOKEN = re.compile(r"(?:_v|_vel)?(\d)|_(ppp|pp|p|mp|mf|f|ff|fff)(?:_|$)", re.I)
_DYN = {"ppp": 1, "pp": 2, "p": 3, "mp": 4, "mf": 5, "f": 6, "ff": 7, "fff": 8}


class HitBank:
    """Velocity-layered, round-robin one-shots from a glob of WAV files."""

    def __init__(self, paths: list[Path]):
        self.hits: list[tuple[int, int, Path]] = []  # (vel_rank, rr, path)
        for p in paths:
            if not p.is_file():
                continue
            name = p.name
            vel_rank = 4
            rr = 1
            m = re.search(r"_v(\d+)", name, re.I)
            if m:
                vel_rank = int(m.group(1))
            else:
                for dyn, rk in _DYN.items():
                    if re.search(rf"_{dyn}(?:_|\.|$)", name, re.I) or name.lower().endswith(f"_{dyn}.wav"):
                        vel_rank = rk
                        break
            m = re.search(r"_rr(\d+)", name, re.I)
            if m:
                rr = int(m.group(1))
            else:
                m = re.search(r"_(\d+)(?:_Sum)?\.wav$", name, re.I)
                if m:
                    rr = int(m.group(1))
            self.hits.append((vel_rank, rr, p))
        self.hits.sort()
        self._rr = 0
        ranks = sorted({h[0] for h in self.hits})
        self._ranks = ranks

    def __bool__(self) -> bool:
        return bool(self.hits)

    def hit(self, vel: float = 0.7, gain: float = 1.0) -> np.ndarray:
        """Return mono (already a mid mix) at SR_OUT."""
        if not self.hits:
            return np.zeros(8, dtype=np.float64)
        if self._ranks:
            # map vel 0..1 onto available ranks
            idx = int(np.clip(round(vel * (len(self._ranks) - 1)), 0, len(self._ranks) - 1))
            rank = self._ranks[idx]
            # also accept neighbouring ranks if RR is thin
            layer = [h for h in self.hits if h[0] == rank] or self.hits
        else:
            layer = self.hits
        rrs = sorted({h[1] for h in layer})
        want = rrs[self._rr % len(rrs)]
        self._rr += 1
        chosen = [h for h in layer if h[1] == want] or layer
        path = chosen[0][2]
        audio, sr = load_wav(path)
        audio = _as_stereo(audio).astype(np.float64)
        if sr != SR_OUT:
            audio = interp_audio(audio, 1.0, SR_OUT, sr)
        mid = 0.5 * (audio[:, 0] + audio[:, 1])
        # fade edges, velocity
        n = len(mid)
        fade = min(n // 8, int(0.01 * SR_OUT))
        if fade > 1:
            mid[:fade] *= np.linspace(0, 1, fade)
        fade_out = min(n // 4, int(0.08 * SR_OUT))
        if fade_out > 1:
            mid[-fade_out:] *= np.linspace(1, 0, fade_out)
        peak = float(np.max(np.abs(mid)) + 1e-9)
        # normalise very hot orchestral hits toward a consistent peak, then vel
        mid = mid / peak * 0.9 * (0.35 + 0.65 * float(vel) ** 1.1) * gain
        return mid


# ---------------------------------------------------------------------------
# FluidR3 (MIT) via sf2utils, file kept open
# ---------------------------------------------------------------------------
class FluidFont:
    def __init__(self, path: Path):
        import logging
        from sf2utils.sf2parse import Sf2File
        self.path = path
        self._fh = open(path, "rb")
        log = logging.getLogger()
        prev = log.level
        log.setLevel(logging.ERROR)
        try:
            self.sf = Sf2File(self._fh)
        finally:
            log.setLevel(prev)
        self._pcm: dict[int, np.ndarray] = {}
        self._presets: dict[tuple[int, int], object] = {}
        for p in self.sf.presets:
            if getattr(p, "bank", None) is None or getattr(p, "preset", None) is None:
                continue
            self._presets[(int(p.bank), int(p.preset))] = p

    def pcm(self, sample) -> np.ndarray:
        # unique-ish key
        key = (sample.start, sample.end, sample.smpl_offset)
        if key in self._pcm:
            return self._pcm[key]
        raw = sample.raw_sample_data
        data = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
        self._pcm[key] = data
        return data

    def preset_zones(self, bank: int, preset: int) -> list[dict]:
        p = self._presets.get((bank, preset))
        if p is None:
            return []
        inst = next((i for i in p.instruments if i is not None), None)
        if inst is None:
            return []
        zones = []
        for bag in inst.bags:
            sample = bag.sample
            if sample is None:
                continue
            def _span(rng, lo=0, hi=127):
                if rng is None:
                    return lo, hi
                if isinstance(rng, range):
                    if rng.stop <= rng.start:
                        return int(rng.start), int(rng.start)
                    return int(rng.start), int(rng.stop) - 1
                if isinstance(rng, (list, tuple)) and rng:
                    vals = [int(x) for x in rng]
                    return min(vals), max(vals)
                if hasattr(rng, "start") and hasattr(rng, "stop"):
                    stop = int(rng.stop)
                    start = int(rng.start)
                    return start, stop if stop == start else stop - 1
                try:
                    vals = [int(x) for x in list(rng)]
                    return (min(vals), max(vals)) if vals else (lo, hi)
                except TypeError:
                    return lo, hi
            lokey, hikey = _span(bag.key_range, 0, 127)
            v0, v1 = _span(bag.velocity_range, 0, 127)
            root = bag.base_note if bag.base_note is not None else sample.original_pitch
            if root is None:
                root = 60
            loop = None
            if bag.sample_loop or (sample.start_loop is not None and sample.end_loop is not None):
                dur = int(sample.duration or 0)
                ls = int(sample.start_loop or 0)
                le = int(sample.end_loop or 0)
                base = int(sample.start or 0)
                # Prefer already-local points (typical for sf2utils); else localise.
                if not (0 <= ls < le <= dur + 16 and (le - ls) >= 32):
                    ls2, le2 = ls - base, le - base
                    if 0 <= ls2 < le2 <= dur + 16:
                        ls, le = ls2, le2
                if 0 <= ls < le <= dur + 16 and (le - ls) >= 32:
                    loop = (ls, le)
            pan = float(bag.pan or 0.0)  # -50..50 typically
            att = float(bag.volume_envelope_attack or 0.0)
            rel = float(bag.volume_envelope_release or 0.4)
            zones.append({
                "sample": sample,
                "sr": int(sample.sample_rate or 44100),
                "lokey": lokey,
                "hikey": hikey,
                "lovel": v0,
                "hivel": v1,
                "root": int(root),
                "loop": loop,
                "pan": np.clip(pan / 50.0, -1.0, 1.0) if abs(pan) > 1.5 else float(pan),
                "attack": max(0.0, att if att < 30 else 0.01),
                "release": max(0.05, rel if rel < 30 else 0.4),
                "tune": float(bag.fine_tuning or 0.0) + 100.0 * float(bag.tuning or 0.0),
            })
        return zones


class Sf2Preset:
    def __init__(self, font: FluidFont, bank: int, preset: int, one_shot: bool = False):
        self.font = font
        self.zones = font.preset_zones(bank, preset)
        self.one_shot = one_shot
        self._rr = 0

    def _matching(self, key: int, vel127: int) -> list[dict]:
        hits = [z for z in self.zones
                if z["lokey"] <= key <= z["hikey"] and z["lovel"] <= vel127 <= z["hivel"]]
        if not hits:
            hits = [z for z in self.zones if z["lovel"] <= vel127 <= z["hivel"]] or self.zones
            if hits:
                # closest root
                best = min(abs(z["root"] - key) for z in hits)
                hits = [z for z in hits if abs(z["root"] - key) == best]
        return hits

    def note(self, key: float, dur: float, vel: float = 0.7,
             release: float | None = None, attack: float | None = None,
             gain: float = 1.0) -> tuple[np.ndarray, np.ndarray]:
        key_i = int(round(np.clip(key, 0, 127)))
        vel127 = int(np.clip(vel, 0, 1) * 127)
        zones = self._matching(key_i, vel127)
        if not zones:
            z = np.zeros(max(8, int(dur * SR_OUT)))
            return z, z.copy()
        rel_s = release if release is not None else max(z["release"] for z in zones)
        rel_s = float(np.clip(rel_s, 0.08, 2.8))
        att_s = attack if attack is not None else max(0.01, min(z["attack"] for z in zones))
        hold = max(dur, 0.05)
        n_out = max(8, int((hold + rel_s) * SR_OUT))
        L = np.zeros(n_out, dtype=np.float64)
        R = np.zeros(n_out, dtype=np.float64)
        vel_g = float(vel) ** 1.1
        for z in zones:
            pcm = self.font.pcm(z["sample"])
            audio = _as_stereo(pcm.astype(np.float64))
            sr = z["sr"]
            cents = (key - z["root"]) * 100.0 + z["tune"]
            ratio = 2.0 ** (cents / 1200.0)
            if self.one_shot:
                pitched = interp_audio(audio, ratio, SR_OUT, sr)
            else:
                needed = int((hold + rel_s) * sr * ratio) + 8
                src = loop_source(audio, sr, needed, z["loop"])
                pitched = interp_audio(src, ratio, SR_OUT, sr)
            if len(pitched) < n_out:
                pad = np.zeros((n_out - len(pitched), 2), dtype=np.float64)
                pitched = np.concatenate([pitched, pad], axis=0)
            else:
                pitched = pitched[:n_out]
            pitched = apply_amp_env(pitched, SR_OUT, att_s, rel_s, peak=1.0)
            pan = float(z["pan"])
            gL = math.sqrt(0.5 * (1.0 - pan)) * gain * vel_g / 0.7071
            gR = math.sqrt(0.5 * (1.0 + pan)) * gain * vel_g / 0.7071
            L += pitched[:, 0] * gL
            R += pitched[:, 1] * gR
        # gentle normalise so stacked L/R zones don't clip the voice
        peak = max(1e-9, float(np.max(np.abs(L))), float(np.max(np.abs(R))))
        if peak > 0.95:
            s = 0.95 / peak
            L *= s
            R *= s
        return L, R

    def hit(self, key: int, vel: float = 0.7, gain: float = 1.0) -> np.ndarray:
        L, R = self.note(key, 0.4, vel=vel, release=0.25, attack=0.001, gain=gain)
        return 0.5 * (L + R)


# ---------------------------------------------------------------------------
# Lazy library
# ---------------------------------------------------------------------------
_FONT: FluidFont | None = None
_SFZ: dict[str, SfzInstrument] = {}
_HITS: dict[str, HitBank] = {}
_SF2P: dict[tuple, Sf2Preset] = {}


def font() -> FluidFont | None:
    global _FONT
    if _FONT is None:
        p = fluidr3_path()
        if p is None:
            return None
        _FONT = FluidFont(p)
    return _FONT


def sfz(name: str, one_shot: bool = False) -> SfzInstrument | None:
    d = vsco_dir()
    if d is None:
        return None
    if name not in _SFZ:
        path = d / name
        if not path.is_file():
            return None
        _SFZ[name] = SfzInstrument(path, one_shot=one_shot)
    return _SFZ[name]


def sf2_preset(bank: int, preset: int, one_shot: bool = False) -> Sf2Preset | None:
    f = font()
    if f is None:
        return None
    key = (bank, preset, one_shot)
    if key not in _SF2P:
        _SF2P[key] = Sf2Preset(f, bank, preset, one_shot=one_shot)
    return _SF2P[key]


def hits(name: str, paths: list[Path]) -> HitBank:
    if name not in _HITS:
        _HITS[name] = HitBank(paths)
    return _HITS[name]


def midi_of_hz(freq: float) -> float:
    return 69.0 + 12.0 * math.log2(max(freq, 8.0) / 440.0)


if __name__ == "__main__":
    print("VSCO", vsco_dir())
    print("FluidR3", fluidr3_path())
    print("libraries_available", libraries_available())
