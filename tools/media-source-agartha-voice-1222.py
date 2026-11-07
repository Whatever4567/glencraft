import wave, subprocess
from piper import PiperVoice, SynthesisConfig
lines={'y1':'This is your world, in the year twenty four thousand.','y2':'The machines walk where your cities stood. They do not remember you.','y3':'The sky burns. The seas are gone. Only the old stones remain.','y4':'This does not have to happen. Choose differently. Take care of the Earth.','brace':'Brace for impact.'}
v=PiperVoice.load('/workspace/tts/en_GB-alba-medium.onnx'); cfg=SynthesisConfig(length_scale=1.08, noise_scale=0.5, noise_w_scale=0.6)
af="asetrate=22050*1.06,aresample=44100,atempo=0.943,chorus=0.6:0.85:45|60:0.35|0.25:0.3|0.4:1.5|1.1,aecho=0.8:0.6:60:0.18,highpass=f=90,loudnorm=I=-18:TP=-2"
for k,t in lines.items():
    w=f'/tmp/rb/{k}.wav'
    with wave.open(w,'wb') as f: v.synthesize_wav(t,f,syn_config=cfg)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',w,'-af',af,'-ac','1','-c:a','libmp3lame','-b:a','64k',f'/workspace/gc-126/assets/voice/agartha_{k}.mp3'],check=True)
print('ok')
