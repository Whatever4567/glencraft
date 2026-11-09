#!/usr/bin/env python3
"""Render short WAV previews of 1.2.48 procedural audio (offline, no licensing issues)."""
from __future__ import annotations
import math, struct, wave, random
from pathlib import Path

OUT = Path("/workspace/qa/audio-1248")
OUT.mkdir(parents=True, exist_ok=True)
SR = 44100

def write_wav(name, samples, sr=SR):
    samples = [max(-1, min(1, x)) for x in samples]
    path = OUT / name
    with wave.open(str(path), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(b"".join(struct.pack("<h", int(x * 32767)) for x in samples))
    print(name, "s", round(len(samples)/sr, 2), "bytes", path.stat().st_size)

def env(i, n, a=0.02, r=0.2):
    t = i / n
    if t < a: return t / a
    if t > 1 - r: return max(0, (1 - t) / r)
    return 1

def osc(kind, f, t):
    ph = 2 * math.pi * f * t
    if kind == "sine": return math.sin(ph)
    if kind == "tri": return 2 * abs(2 * (t * f % 1) - 1) - 1
    if kind == "saw": return 2 * (t * f % 1) - 1
    if kind == "sq": return 1 if math.sin(ph) >= 0 else -1
    return math.sin(ph)

def noise():
    return random.random() * 2 - 1

def lowpass(seq, alpha=0.1):
    out=[]; lp=0
    for x in seq:
        lp = lp + alpha * (x - lp)
        out.append(lp)
    return out

def bird_phrase(kind, seconds=2.2):
    n=int(SR*seconds); out=[0.0]*n
    random.seed(hash(kind) & 0xFFFF)
    t=0.05
    if kind=="robin":
        for _ in range(8):
            f=random.uniform(2600,7200); d=random.uniform(0.05,0.14)
            for i in range(int(d*SR)):
                k=int((t)*SR)+i
                if 0<=k<n: out[k]+= math.sin(2*math.pi*f*(1+0.04*math.sin(40*t))*i/SR) * env(i,int(d*SR),0.1,0.4)*0.35
            t+=random.uniform(0.06,0.18)
    elif kind=="blackbird":
        for _ in range(5):
            f=random.uniform(1500,2800); d=random.uniform(0.12,0.3)
            for i in range(int(d*SR)):
                k=int(t*SR)+i
                if 0<=k<n: out[k]+= math.sin(2*math.pi*f*i/SR) * env(i,int(d*SR),0.15,0.4)*0.4
            t+=random.uniform(0.15,0.32)
    elif kind=="owl":
        for j,f,d,off in [(0,520,0.6,0),(1,480,0.15,1.5),(2,520,1.1,1.75)]:
            for i in range(int(d*SR)):
                k=int(off*SR)+i
                if 0<=k<n: out[k]+= math.sin(2*math.pi*f*i/SR) * env(i,int(d*SR),0.2,0.5)*0.35
    else:  # curlew
        for off,f0,f1,d in [(0,1500,2400,0.55),(0.7,1700,2600,0.5)]:
            for i in range(int(d*SR)):
                k=int(off*SR)+i
                f=f0+(f1-f0)*i/(d*SR)
                if 0<=k<n: out[k]+= math.sin(2*math.pi*f*i/SR)*env(i,int(d*SR),0.1,0.4)*0.35
    mx=max(1e-6, max(abs(x) for x in out)); out=[x/mx*0.5 for x in out]
    return out

def pad_bed(mood, seconds=10):
    n=int(SR*seconds); out=[0.0]*n
    roots={
        "day":[73,110,146.8,220,329.6],
        "night":[55,82.4,123.5,196],
        "cave1":[65.4,98,146.8],
        "blue":[82.4,123.5,185,277,523],
        "purple":[61.7,92.5,155.6,233,311],
        "hell":[36.7,49,73.4,92.5,110],
    }[mood]
    vol={"day":0.22,"night":0.2,"cave1":0.22,"blue":0.18,"purple":0.18,"hell":0.25}[mood]
    random.seed(sum(map(ord,mood)))
    for f in roots:
        for i in range(n):
            t=i/SR
            vib=1+0.004*math.sin(2*math.pi*0.07*t)
            out[i]+= math.sin(2*math.pi*f*vib*t) * vol / len(roots)
            if f>200: out[i]+= (2*abs(2*(t*f*vib%1)-1)-1) * vol * 0.08 / len(roots)
    # a few harp notes
    scale={"day":[220,246.9,293.7,329.6,370,392,440],"night":[164.8,196,220,246.9],
           "cave1":[146.8,174.6,196,220],"blue":[246.9,277.2,329.6,370],
           "purple":[207.7,246.9,311.1,349.2],"hell":[73.4,87.3,98,110]}[mood]
    t=1.5
    while t<seconds-1.5:
        f=random.choice(scale); d=1.2
        for i in range(int(d*SR)):
            k=int(t*SR)+i
            if k<n: out[k]+= math.sin(2*math.pi*f*i/SR)*env(i,int(d*SR),0.04,0.6)*0.12
        t+=1.8+random.random()*2.5
    # fade in/out
    fade=int(0.8*SR)
    for i in range(fade):
        out[i]*=i/fade; out[-1-i]*=i/fade
    mx=max(1e-6, max(abs(x) for x in out)); out=[x/mx*0.7 for x in out]
    return out

def cave_shot(kind):
    n=int(SR*2.4); out=[0.0]*n
    random.seed(hash(kind)&0xFFFF)
    if kind=="cave1-drip":
        for i in range(int(0.12*SR)):
            f=1400-700*i/(0.12*SR); out[i]+=math.sin(2*math.pi*f*i/SR)*env(i,int(0.12*SR),0.05,0.5)*0.5
    elif kind=="cave1-pebble":
        lp=0
        for i in range(int(0.35*SR)):
            lp=lp*0.92+(random.random()*2-1)*0.2
            out[i]+=lp*env(i,int(0.35*SR),0.02,0.5)*0.7
    elif kind=="blue-chime":
        for f,d in [(1046,1.4),(1318,1.2)]:
            for i in range(int(d*SR)):
                if i<n: out[i]+=math.sin(2*math.pi*f*i/SR)*env(i,int(d*SR),0.02,0.7)*0.35
    elif kind=="purple-shimmer":
        for i in range(int(2.0*SR)):
            out[i]+=math.sin(2*math.pi*(311+8*math.sin(6*i/SR))*i/SR)*env(i,int(2*SR),0.2,0.5)*0.3
    elif kind=="hell-rumble":
        lp=0
        for i in range(n):
            lp=lp*0.98+(random.random()*2-1)*0.15
            out[i]+=lp*env(i,n,0.1,0.4)*0.7 + math.sin(2*math.pi*55*i/SR)*0.2*env(i,n,0.2,0.5)
    mx=max(1e-6, max(abs(x) for x in out)); return [x/mx*0.6 for x in out]

def ufo(seconds=6):
    n=int(SR*seconds); out=[0.0]*n
    for i in range(n):
        t=i/SR
        # pass-by: distance 40->8->40, doppler
        d=20+20*math.cos(math.pi*t/seconds)
        att=min(1, 14/(d+6))
        dop=1+(0.06*math.sin(math.pi*t/seconds-0.2))
        throb=0.7+0.3*math.sin(2*math.pi*2.2*t)
        s=math.sin(2*math.pi*196*dop*t)*0.45*throb + math.sin(2*math.pi*294*dop*t)*0.22 + math.sin(2*math.pi*48*t)*0.3
        out[i]=s*att*0.45
        if i<SR*0.4: out[i]*=i/(SR*0.4)
        if i>n-SR*0.5: out[i]*=(n-i)/(SR*0.5)
    return out

def pig(kind):
    n=int(SR * (0.6 if kind!="squeal" else 0.5)); out=[0.0]*n
    random.seed(hash(kind)&255)
    if kind=="oink":
        for i in range(n):
            t=i/SR
            out[i]=(osc("saw",130,t)*0.5+math.sin(2*math.pi*70*t)*0.2)*env(i,n,0.05,0.4)
            # bandpass-ish by mixing
    elif kind=="snort":
        lp=0
        for i in range(int(0.14*SR)):
            lp=lp*0.85+(random.random()*2-1)
            out[i]=lp*0.4*env(i,int(0.14*SR),0.05,0.4)
    elif kind=="snuffle":
        lp=0
        for i in range(int(0.18*SR)):
            lp=lp*0.8+(random.random()*2-1)
            out[i]=lp*0.35*env(i,int(0.18*SR),0.04,0.5)
    elif kind=="happy":
        for i in range(int(0.22*SR)):
            t=i/SR; f=160+60*t/0.22
            out[i]=(osc("saw",f,t)*0.5+math.sin(2*math.pi*320*t)*0.15)*env(i,int(0.22*SR),0.06,0.4)
    else:  # squeal
        for i in range(n):
            t=i/SR; f=620+260*t/0.28
            out[i]=(osc("saw",f,t)*0.55+osc("sq",980-200*t,t)*0.12)*env(i,n,0.03,0.4)
    # quieter than a typical mob preview
    mx=max(1e-6, max(abs(x) for x in out)); return [x/mx*0.35 for x in out]

def main():
    random.seed(1248)
    write_wav("bird-robin.wav", bird_phrase("robin"))
    write_wav("bird-blackbird.wav", bird_phrase("blackbird"))
    write_wav("bird-curlew.wav", bird_phrase("curlew", 2.6))
    write_wav("bird-owl.wav", bird_phrase("owl", 3.2))
    for m in ["day","night","cave1","blue","purple","hell"]:
        write_wav(f"music-{m}.wav", pad_bed(m, 10))
    for k in ["cave1-drip","cave1-pebble","blue-chime","purple-shimmer","hell-rumble"]:
        write_wav(f"{k}.wav", cave_shot(k))
    write_wav("ufo-hover.wav", ufo(6))
    for k in ["oink","snort","snuffle","happy","squeal"]:
        write_wav(f"pig-{k}.wav", pig(k))
    # credits note
    (OUT/"README.txt").write_text(
        "1.2.48 audio previews — all synthesised for Glencraft, no third-party recordings.\n"
        "Birds: robin, blackbird, curlew (day), owl (night).\n"
        "Music: 10 s beds for day, night, cave level 1, blue cave, purple cave, deep hell cave.\n"
        "Cave one-shots: drip/pebble, chime, shimmer, rumble.\n"
        "UFO: 6 s theremin-like hover with a pass-by (distance + Doppler).\n"
        "Pigs: quieter oink, snort, snuffle, happy grunt, hurt squeal.\n"
    )
    print("previews in", OUT)

if __name__ == "__main__":
    main()
