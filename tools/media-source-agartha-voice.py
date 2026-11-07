import json, wave, subprocess, sys
from piper import PiperVoice, SynthesisConfig
src=open('/workspace/gc-126/tools/build-1.2.9.cjs').read()
i=src.index('const LINES = "+JSON.stringify(')+len('const LINES = "+JSON.stringify(')
lines=json.loads(src[i:src.index(')+".concat',i)])
v=PiperVoice.load('en_GB-alba-medium.onnx'); cfg=SynthesisConfig(length_scale=1.08, noise_scale=0.5, noise_w_scale=0.6)
for n,t in enumerate(lines,1):
    w=f'/tmp/rb/ag{n}.wav'
    with wave.open(w,'wb') as f: v.synthesize_wav(t,f,syn_config=cfg)
    # smooth "alien" treatment: slight pitch lift kept natural pace, soft shimmer chorus, small room
    af="asetrate=22050*1.06,aresample=44100,atempo=0.943,chorus=0.6:0.85:45|60:0.35|0.25:0.3|0.4:1.5|1.1,aecho=0.8:0.6:60:0.18,highpass=f=90,loudnorm=I=-18:TP=-2"
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',w,'-af',af,'-ac','1','-c:a','libmp3lame','-b:a','64k',f'/workspace/gc-126/assets/voice/agartha{n}.mp3'],check=True)
print(len(lines))
