python3 build87.py 1.0.69 >/dev/null && python3 build.py v1.0.69 >/dev/null 2>&1; python3 extract_inline.py && python3 - <<'P'
import re
p='site/index.html';s=open(p).read();k='window.PATCH_NOTES = [\n';assert k in s
s=s.replace(k,k+"{v:'v1.0.69', d:'2026-11-01', notes:['New: animal sounds are true 3D - every sheep, pig, duck and haggis call comes from where the animal stands, pans left and right as you turn and fades out by about 24 blocks','Fix: animal voices no longer pile up - one call per animal at a time and only a few at once','Mobs: pigs are a proper animated pig again (walk, idle, eat and run) wearing the real pig photo - the face and snout on the head and the pink wrinkled skin on the body','Mobs: pig hitbox, behaviour and mud rolling are unchanged','Audio: animal sounds are much quieter and the harsh sheep yell is gone - only gentle bleats','New: sound occlusion - sounds behind walls or heard from indoors are muffled and quieter','Fix: the alien abduction no longer freezes - the dialogue and music are back, the alien voice is ethereal with echo, chorus and airy reverb','Visual: YEAR 24000 vision is cleaner - no daylight sky, clouds or speech bubble showing through and the giant robots stand farther away','New: the meteor appears the moment the alien says brace for impact - a small far speck that grows as it comes in with a building roar into the impact','New: original Egyptian desert soundtrack crossfades in when you walk onto the sand and fades back out when you leave, UFO music takes over when it arrives','Fix: the alien painting only appears after the alien encounter and hangs flat on the hall wall','New: many more Egyptians around the pyramid - carrying stones, kneeling in prayer, farming with hoes and playing drums','New: aim at an Egyptian and press LT to start a synced meditation dance - every Egyptian nearby dances the same routine to an original 97 BPM arabesque track heard from the dancers, press LT again or walk away to stop']},\n",1)
for i in '12':
  s=s.replace('<stop offset="0" stop-color="#fff6cf"/><stop offset=".48" stop-color="#f6c83e"/><stop offset="1" stop-color="#b06e10"/></linearGradient><filter id="glA'+i, '<stop offset="0" stop-color="#f9dca0"/><stop offset=".45" stop-color="#c98236"/><stop offset="1" stop-color="#5e3210"/></linearGradient><filter id="glA'+i)
s=s.replace('flood-color="#ffc844" flood-opacity=".75"','flood-color="#ff9b30" flood-opacity=".8"').replace('stroke="#3a2206" stroke-width="4"','stroke="#2a1604" stroke-width="6"')
s=s.replace('<svg viewBox="0 0 680 230" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="glG','<svg viewBox="22 22 636 190" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="glG')
s=s.replace('</head>','<style>'+open('menu65.css').read()+open('theme67.css').read()+'</style>\n</head>',1)
s=s[:s.rindex('</body>')]+'<style id="th68">'+open('theme68.css').read()+'</style>\n'+s[s.rindex('</body>'):]
open(p,'w').write(s)
P
cp site/index.html /tmp/srv/new169.html; cp -r site/assets /tmp/srv/
python3 - <<'P'
p='site/index.html';s=open(p).read();k='window.PATCH_NOTES = [\n';i=s.index(k)+len(k);seen=set();out=[];rest=s[i:].split('\n')
j=0
while rest[j].startswith("{v:'v"):
    v=rest[j][4:rest[j].index("'",5)]
    if v not in seen: seen.add(v); out.append(rest[j])
    j+=1
s=s[:i]+'\n'.join(out+rest[j:]);open(p,'w').write(s);print('notes',len(out),'dropped',j-len(out))
P
cp site/index.html /tmp/srv/new169.html
