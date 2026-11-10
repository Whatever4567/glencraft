#!/usr/bin/env python3
"""Layer permissively licensed recorded instruments under the existing synths.

VSCO-2 CE (CC0) supplies orchestral strings, harp, flute, horn, percussion.
FluidR3_GM (MIT) supplies choir, tin-whistle colour, and GM hats.
Synth voices stay in the mix at reduced gain so the writing and sound-design
layers remain, while the recorded timbre breaks the previous synthesis ceiling.
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import sample_player as SP

_INSTALLED_LIB = False
_INSTALLED_CINEMA = False


def _mix_pair(a, b, ga=1.0, gb=1.0):
    """Mix two (L,R) pairs, padding the shorter."""
    if a is None:
        return b
    if b is None:
        return a
    La, Ra = a
    Lb, Rb = b
    n = max(len(La), len(Lb), len(Ra), len(Rb))
    def pad(x):
        x = np.asarray(x, dtype=np.float64)
        if len(x) >= n:
            return x[:n]
        y = np.zeros(n, dtype=np.float64)
        y[:len(x)] = x
        return y
    return pad(La) * ga + pad(Lb) * gb, pad(Ra) * ga + pad(Rb) * gb


def _mix_mono(a, b, ga=1.0, gb=1.0):
    a = np.asarray(a, dtype=np.float64)
    b = np.asarray(b, dtype=np.float64)
    n = max(len(a), len(b))
    def pad(x):
        if len(x) >= n:
            return x[:n]
        y = np.zeros(n, dtype=np.float64)
        y[:len(x)] = x
        return y
    return pad(a) * ga + pad(b) * gb


def _trim(sig, seconds, fade_s=0.08):
    n = max(8, int(seconds * SP.SR_OUT))
    x = np.asarray(sig, dtype=np.float64)
    if len(x) <= n:
        return x
    y = x[:n].copy()
    fade = min(len(y) // 3, max(4, int(fade_s * SP.SR_OUT)))
    y[-fade:] *= np.linspace(1.0, 0.0, fade)
    return y


def _hz_midi(freq: float) -> float:
    return SP.midi_of_hz(freq)


# ---------------------------------------------------------------------------
# Melodic / harmonic wrappers
# ---------------------------------------------------------------------------
def _sampled_harp(freq, dur, vel=0.7, bright=0.55):
    inst = SP.sfz("Harp.sfz", one_shot=True)
    if inst is None:
        return None
    # Let the recorded ring speak; don't truncate to a short written dur.
    play = max(float(dur), 1.6 + 0.8 * float(bright))
    rel = 1.2 + 0.8 * float(bright)
    g = 0.55 + 0.25 * float(bright)
    return inst.note(_hz_midi(freq), play, vel=vel, release=rel, attack=0.001, gain=g)


def _flute_or_piccolo(freq, dur, vel, tongued, low):
    key = _hz_midi(freq)
    # Piccolo for the top of the high whistle; flute for the middle; none below C4.
    if key >= 84:
        inst = SP.sfz("PiccoloSus.sfz") or SP.sfz("FluteSusVib.sfz")
    elif key >= 60:
        inst = SP.sfz("FluteSusNV.sfz") if (low or not tongued) else SP.sfz("FluteSusVib.sfz")
        if inst is None:
            inst = SP.sfz("FluteSusVib.sfz")
    else:
        inst = None
    if inst is None:
        return None
    att = 0.012 if tongued else 0.05
    rel = min(0.22, max(0.1, dur * 0.28))
    return inst.note(key, dur, vel=vel, release=rel, attack=att, gain=0.7)


def _fluid_whistle(freq, dur, vel, tongued):
    inst = SP.sf2_preset(0, 78)  # Whistle
    if inst is None:
        return None
    att = 0.012 if tongued else 0.05
    rel = min(0.2, max(0.1, dur * 0.25))
    return inst.note(_hz_midi(freq), dur, vel=vel, release=rel, attack=att, gain=0.55)


def _sampled_whistle(freq, dur, vel=0.8, breathe=0.07, vib=True, tongued=True, low=False):
    flute = _flute_or_piccolo(freq, dur, vel, tongued, low)
    whistle = _fluid_whistle(freq, dur, vel * (0.85 if not low else 0.7), tongued)
    return _mix_pair(flute, whistle, 1.0, 0.85 if flute is not None else 1.15)


def _string_for_freq(freq: float):
    key = _hz_midi(freq)
    # Route by register to the section that actually recorded that pitch.
    if key < 48:
        names = ["ContrabassSusVB.sfz", "CelloEnsSusVib.sfz"]
        gains = [0.85, 0.45]
    elif key < 55:
        names = ["CelloEnsSusVib.sfz", "ContrabassSusVB.sfz", "ViolaEnsSusVib.sfz"]
        gains = [0.9, 0.35, 0.35]
    elif key < 67:
        names = ["ViolaEnsSusVib.sfz", "CelloEnsSusVib.sfz", "ViolinEnsSusVib.sfz"]
        gains = [0.75, 0.4, 0.7]
    else:
        names = ["ViolinEnsSusVib.sfz", "ViolaEnsSusVib.sfz"]
        gains = [0.9, 0.35]
    out = None
    for name, g in zip(names, gains):
        inst = SP.sfz(name)
        if inst is None:
            continue
        pair = inst.note(key, 0.4, vel=0.7, release=0.8, attack=0.05, gain=g)  # placeholder dur, replaced below
        # We only probe availability here; actual notes are played in ensemble.
        if inst.regions:
            out = (name, g) if out is None else out
    return list(zip(names, gains))


def _sampled_string_ensemble(n, freqs, gain=0.1, attack=0.9, release=1.1, bright=0.35):
    dur = n / float(SP.SR_OUT)
    L = np.zeros(n, dtype=np.float64)
    R = np.zeros(n, dtype=np.float64)
    if not freqs:
        return L, R
    # Per-note gain keeps a chord from summing too hot.
    note_g = gain * 5.4 / math.sqrt(max(1, len(freqs)))
    for i, f in enumerate(freqs):
        if f <= 0:
            continue
        key = _hz_midi(f)
        if key < 48:
            parts = [("ContrabassSusVB.sfz", 0.9), ("CelloEnsSusVib.sfz", 0.4)]
        elif key < 55:
            parts = [("CelloEnsSusVib.sfz", 0.85), ("ViolaEnsSusVib.sfz", 0.4)]
        elif key < 67:
            parts = [("ViolaEnsSusVib.sfz", 0.7), ("ViolinEnsSusVib.sfz", 0.75), ("CelloEnsSusVib.sfz", 0.28)]
        else:
            parts = [("ViolinEnsSusVib.sfz", 0.95), ("ViolaEnsSusVib.sfz", 0.3)]
        # Fit attack/release inside the written duration so section joins don't click.
        att = max(0.08, min(attack, dur * 0.35))
        rel = max(0.2, min(release, dur * 0.35))
        hold = max(0.08, dur - rel)
        for j, (name, g) in enumerate(parts):
            inst = SP.sfz(name)
            if inst is None:
                continue
            gg = g * note_g * (0.9 + 0.25 * bright if j == 0 else 0.85)
            l, r = inst.note(key, hold, vel=0.62 + 0.3 * bright, release=rel, attack=att, gain=gg)
            # light section pan
            pan = ((i + j) % 3 - 1) * 0.28
            gL = math.sqrt(0.5 * (1 - pan)) / 0.7071
            gR = math.sqrt(0.5 * (1 + pan)) / 0.7071
            nn = min(n, len(l), len(r))
            L[:nn] += l[:nn] * gL
            R[:nn] += r[:nn] * gR
    return L, R


def _sampled_choir(n, freqs, formants, gain=0.1, rng=None):
    dur = n / float(SP.SR_OUT)
    L = np.zeros(n, dtype=np.float64)
    R = np.zeros(n, dtype=np.float64)
    ahh = SP.sf2_preset(0, 52)  # Ahh Choir
    ooh = SP.sf2_preset(0, 53)  # Ohh Voices
    space = SP.sf2_preset(0, 91)  # Space Voice — useful in liminal beds
    if ahh is None and ooh is None:
        return None
    note_g = gain * 10.0 / math.sqrt(max(1, len(freqs) or 1))
    # formant brightness: higher second formant → more ahh than ooh
    f2 = formants[1] if formants and len(formants) > 1 else 800
    ahh_w = 0.55 + 0.25 * float(np.clip((f2 - 700) / 800, 0, 1))
    ooh_w = 1.0 - 0.4 * ahh_w
    att = min(1.6, max(0.4, dur * 0.28))
    rel = min(1.8, max(0.4, dur * 0.28))
    hold = max(0.2, dur - rel)
    for i, f in enumerate(freqs):
        if f <= 0:
            continue
        key = _hz_midi(f)
        g = note_g / (1.0 + 0.07 * i)
        if ahh is not None:
            l, r = ahh.note(key, hold, vel=0.75, release=rel, attack=att, gain=g * ahh_w)
            nn = min(n, len(l), len(r))
            L[:nn] += l[:nn]
            R[:nn] += r[:nn]
        if ooh is not None:
            l, r = ooh.note(key, hold, vel=0.7, release=rel, attack=att, gain=g * ooh_w * 0.85)
            nn = min(n, len(l), len(r))
            L[:nn] += l[:nn]
            R[:nn] += r[:nn]
        if space is not None and i == 0:
            l, r = space.note(key, hold, vel=0.5, release=rel, attack=att, gain=g * 0.18)
            nn = min(n, len(l), len(r))
            L[:nn] += l[:nn]
            R[:nn] += r[:nn]
    fade = min(int(2.0 * SP.SR_OUT), n // 3)
    if fade > 8:
        ramp = np.linspace(0, 1, fade) ** 1.2
        L[:fade] *= ramp
        R[:fade] *= ramp
        L[-fade:] *= ramp[::-1]
        R[-fade:] *= ramp[::-1]
    return L, R


def _sampled_horn(freq, dur, vel=0.45, bright=0.4):
    inst = SP.sfz("FHornSus.sfz")
    if inst is None:
        inst = SP.sfz("TromboneSus.sfz")
    if inst is None:
        return None
    att = max(0.18, 0.28 * dur)
    rel = max(0.25, 0.28 * dur)
    return inst.note(_hz_midi(freq), dur, vel=vel, release=rel, attack=att,
                     gain=0.55 + 0.25 * float(bright))


def _sampled_fiddle(freq, dur, vel=0.65, vib=True, slur=False):
    inst = SP.sfz("SViolinVib.sfz") or SP.sf2_preset(0, 110)
    if inst is None:
        return None
    att = 0.02 if slur else 0.05
    rel = min(0.18, dur * 0.25)
    if hasattr(inst, "note"):
        return inst.note(_hz_midi(freq), dur, vel=vel, release=rel, attack=att, gain=0.7)
    return None


def _sampled_bells(freq, dur, rng, vel=0.4):
    # Glock for high sparkle, tubular bells for lower chimes.
    key = _hz_midi(freq)
    name = "Glockenspiel.sfz" if key >= 72 else "TubularBells.sfz"
    inst = SP.sfz(name, one_shot=True) or SP.sfz("Glockenspiel.sfz", one_shot=True)
    if inst is None:
        return None
    play = max(float(dur), 2.2)
    return inst.note(key, play, vel=vel, release=1.8, attack=0.001, gain=0.55)


# ---------------------------------------------------------------------------
# Drums
# ---------------------------------------------------------------------------
def _vsco() -> Path | None:
    return SP.vsco_dir()


def _bank_bass() -> SP.HitBank | None:
    d = _vsco()
    if d is None:
        return None
    paths = sorted((d / "Percussion").glob("BDrumNewhit_*.wav"))
    paths += sorted((d / "VSCO 1 Percussion" / "drums" / "bass").glob("bdrum_*.wav"))
    return SP.hits("bass", paths) if paths else None


def _bank_snare() -> SP.HitBank | None:
    d = _vsco()
    if d is None:
        return None
    paths = sorted((d / "Percussion").glob("Snare2-Hit*.wav"))
    # VSCO 1 snares sit in nested folders
    v1 = d / "VSCO 1 Percussion" / "drums" / "snare"
    if v1.is_dir():
        paths += sorted(v1.rglob("*.wav"))
    return SP.hits("snare", paths) if paths else None


def _bank_taiko() -> SP.HitBank | None:
    d = _vsco()
    if d is None:
        return None
    paths = sorted((d / "Percussion").glob("BDrumNewhit_*.wav"))
    # tenor drums as the 'taiko' body
    tenor = d / "VSCO 1 Percussion" / "drums" / "tenor"
    if tenor.is_dir():
        paths += sorted(tenor.rglob("*.wav"))
    timp = d / "Percussion" / "Timpani"
    if timp.is_dir():
        paths += sorted(timp.glob("*.wav"))[:40]
    return SP.hits("taiko", paths) if paths else None


def _bank_cym() -> SP.HitBank | None:
    d = _vsco()
    if d is None:
        return None
    paths = sorted((d / "Percussion").glob("cymbal-crash*.wav"))
    paths += sorted((d / "Percussion").glob("susCymb1-hit_*.wav"))
    paths += sorted((d / "Percussion").glob("gongHit_*.wav"))
    return SP.hits("cym", paths) if paths else None


def _bank_stick() -> SP.HitBank | None:
    d = _vsco()
    if d is None:
        return None
    paths = sorted((d / "Percussion").glob("Snare2-taps*.wav"))
    paths += sorted((d / "Percussion").glob("Claves1_Hit*.wav"))
    paths += sorted((d / "Percussion").glob("Tamb1-Hit*.wav"))
    return SP.hits("stick", paths) if paths else None


# ---------------------------------------------------------------------------
# Public installers
# ---------------------------------------------------------------------------
def install_lib(ns: dict) -> None:
    """Wrap album_lib instrument callables in place."""
    global _INSTALLED_LIB
    if _INSTALLED_LIB or not SP.libraries_available():
        return

    synth_harp = ns["harp_pluck"]
    synth_whistle = ns["tin_whistle"]
    synth_choir = ns["choir_chord"]
    synth_fiddle = ns["fiddle_note"]
    synth_bodhran = ns["bodhran"]
    synth_bell = ns["glass_bell"]

    def harp_pluck(freq, dur, vel=0.7, bright=0.55):
        sampled = _sampled_harp(freq, dur, vel=vel, bright=bright)
        synth = synth_harp(freq, dur, vel=vel * 0.32, bright=bright)
        if sampled is None:
            return synth
        return _mix_pair(sampled, synth, 1.0, 0.55)

    def tin_whistle(freq, dur, vel=0.8, breathe=0.07, vib=True, tongued=True, low=False):
        sampled = _sampled_whistle(freq, dur, vel=vel, breathe=breathe, vib=vib,
                                   tongued=tongued, low=low)
        synth = synth_whistle(freq, dur, vel=vel * 0.38, breathe=breathe, vib=vib,
                              tongued=tongued, low=low)
        if sampled is None:
            return synth
        return _mix_pair(sampled, synth, 1.0, 0.5)

    def choir_chord(n, freqs, formants, gain=0.1, rng=None):
        sampled = _sampled_choir(n, freqs, formants, gain=gain, rng=rng)
        synth = synth_choir(n, freqs, formants, gain=gain * 0.38, rng=rng)
        if sampled is None:
            return synth
        return _mix_pair(sampled, synth, 1.0, 0.7)

    def fiddle_note(freq, dur, vel=0.65, vib=True, slur=False):
        sampled = _sampled_fiddle(freq, dur, vel=vel, vib=vib, slur=slur)
        synth = synth_fiddle(freq, dur, vel=vel * 0.35, vib=vib, slur=slur)
        if sampled is None:
            return synth
        return _mix_pair(sampled, synth, 1.0, 0.5)

    def bodhran(rng, dur=0.32, tight=False, vel=0.6):
        synth = synth_bodhran(rng, dur=dur, tight=tight, vel=vel * 0.5)
        bank = _bank_bass() if not tight else _bank_stick()
        # tenor / muted concert bass as a skin hit closer to a bodhran
        d = _vsco()
        hit = None
        if d is not None:
            muted = sorted((d / "VSCO 1 Percussion" / "drums" / "bass").glob("bdrum_muted_*.wav"))
            tenor = list((d / "VSCO 1 Percussion" / "drums" / "tenor").rglob("*.wav")) if (d / "VSCO 1 Percussion" / "drums" / "tenor").is_dir() else []
            paths = (muted + tenor) if tight else (tenor + muted)
            if paths:
                hit = SP.hits("bodhran", paths).hit(vel=vel, gain=0.7)
        if hit is None and bank:
            hit = bank.hit(vel=vel * 0.7, gain=0.45)
        if hit is None:
            return synth
        return _trim(_mix_mono(hit, synth, 1.0, 0.7), max(dur, 0.45), fade_s=0.06)

    def glass_bell(freq, dur, rng, vel=0.4):
        sampled = _sampled_bells(freq, dur, rng, vel=vel)
        synth = synth_bell(freq, dur, rng, vel=vel * 0.4)
        if sampled is None:
            return synth
        return _mix_pair(sampled, synth, 1.0, 0.55)

    ns["harp_pluck"] = harp_pluck
    ns["tin_whistle"] = tin_whistle
    ns["choir_chord"] = choir_chord
    ns["fiddle_note"] = fiddle_note
    ns["bodhran"] = bodhran
    ns["glass_bell"] = glass_bell
    ns["harp_pluck_synth"] = synth_harp
    ns["tin_whistle_synth"] = synth_whistle
    _INSTALLED_LIB = True


def install_cinema(ns: dict) -> None:
    global _INSTALLED_CINEMA
    if _INSTALLED_CINEMA or not SP.libraries_available():
        return

    synth_strings = ns["string_ensemble"]
    synth_horn = ns["horn_swell"]
    synth_kick = ns["cinematic_kick"]
    synth_snare = ns["layered_snare"]
    synth_taiko = ns["taiko"]
    synth_hat = ns["hat"]
    synth_ghost = ns["ghost_stick"]
    synth_impact = ns["impact"]

    def string_ensemble(n, freqs, gain=0.1, attack=0.9, release=1.1, bright=0.35):
        sampled = _sampled_string_ensemble(n, freqs, gain=gain, attack=attack,
                                           release=release, bright=bright)
        synth = synth_strings(n, freqs, gain=gain * 0.28, attack=attack,
                              release=release, bright=bright)
        return _mix_pair(sampled, synth, 1.0, 1.0)

    def horn_swell(freq, dur, vel=0.45, bright=0.4):
        sampled = _sampled_horn(freq, dur, vel=vel, bright=bright)
        synth = synth_horn(freq, dur, vel=vel * 0.32, bright=bright)
        if sampled is None:
            return synth
        return _mix_pair(sampled, synth, 1.0, 0.5)

    def cinematic_kick(rng, vel=0.8, hard=False):
        synth = synth_kick(rng, vel=vel * 0.55, hard=hard)
        bank = _bank_bass()
        hit = bank.hit(vel=vel, gain=0.85 if hard else 0.7) if bank else None
        if hit is None:
            return synth
        return _trim(_mix_mono(hit, synth, 1.0, 0.85), 1.8 if hard else 1.5, fade_s=0.08)

    def layered_snare(rng, vel=0.65, tight=False):
        synth = synth_snare(rng, vel=vel * 0.5, tight=tight)
        bank = _bank_snare()
        hit = bank.hit(vel=vel, gain=0.8 if not tight else 0.65) if bank else None
        if hit is None:
            return synth
        return _trim(_mix_mono(hit, synth, 1.0, 0.75), 0.7 if tight else 1.0, fade_s=0.05)

    def taiko(rng, vel=0.7):
        synth = synth_taiko(rng, vel=vel * 0.45)
        bank = _bank_taiko()
        hit = bank.hit(vel=vel, gain=0.75) if bank else None
        if hit is None:
            return synth
        return _trim(_mix_mono(hit, synth, 1.0, 0.7), 2.0, fade_s=0.1)

    def hat(rng, vel=0.3, open_hat=False):
        synth = synth_hat(rng, vel=vel * 0.55, open_hat=open_hat)
        kit = SP.sf2_preset(128, 0, one_shot=True)  # Standard GM kit
        if kit is None:
            return synth
        key = 46 if open_hat else 42
        hit = kit.hit(key, vel=max(0.25, vel), gain=0.55)
        return _trim(_mix_mono(hit, synth, 1.0, 0.7), 0.45 if not open_hat else 0.9, fade_s=0.03)

    def ghost_stick(rng, vel=0.18):
        synth = synth_ghost(rng, vel=vel * 0.55)
        bank = _bank_stick()
        hit = bank.hit(vel=max(0.2, vel), gain=0.5) if bank else None
        if hit is None:
            return synth
        return _trim(_mix_mono(hit, synth, 1.0, 0.7), 0.35, fade_s=0.04)

    def impact(rng, dur=2.2, vel=0.7):
        synth = synth_impact(rng, dur=dur, vel=vel * 0.55)
        bank = _bank_cym()
        bass = _bank_bass()
        cym = bank.hit(vel=min(1.0, vel + 0.15), gain=0.7) if bank else None
        boom = bass.hit(vel=vel, gain=0.5) if bass else None
        body = synth
        if cym is not None or boom is not None:
            # impact returns (L,R)
            mid = None
            if cym is not None and boom is not None:
                mid = _mix_mono(cym, boom, 0.85, 0.7)
            else:
                mid = cym if cym is not None else boom
            # spread the recorded hit slightly
            L = mid
            R = np.roll(mid, int(0.004 * SP.SR_OUT))
            body = _mix_pair((L, R), synth, 1.0, 0.8)
        if isinstance(body, tuple):
            L, R = body
            L = _trim(L, max(dur, 1.2), fade_s=0.25)
            R = _trim(R, max(dur, 1.2), fade_s=0.25)
            return L, R
        return _trim(body, max(dur, 1.2), fade_s=0.25)

    ns["string_ensemble"] = string_ensemble
    ns["horn_swell"] = horn_swell
    ns["cinematic_kick"] = cinematic_kick
    ns["layered_snare"] = layered_snare
    ns["taiko"] = taiko
    ns["hat"] = hat
    ns["ghost_stick"] = ghost_stick
    ns["impact"] = impact
    _INSTALLED_CINEMA = True
