python3 build87.py 1.0.66 >/dev/null && python3 build.py v1.0.66 >/dev/null 2>&1; python3 extract_inline.py && python3 - <<'P'
import re
p='site/index.html';s=open(p).read();k='window.PATCH_NOTES = [\n';assert k in s
s=s.replace(k,k+"{v:'v1.0.66', d:'2026-10-31', notes:['New: the alien encounter is reworked - shorter (about 85 seconds), plays once and never repeats a line','New: the alien speaks in a high glitchy robot voice, with stutters and reversed chatter','New: every alien message paraphrases real public claims by US UAP whistleblowers (Grusch, Fravor, Graves, Elizondo), with the speaker named in the caption','New: an original remix-style track with a pulsing pad, a slow beat and rising tension','Textures: fluid neon hallucinations - melting colour, kaleidoscope swirls and a light VHS glitch','Textures: the nuke and storm clips now fill the screen see-through, so the alien stays visible','Mobs: the alien visitor greets you - pay attention, it comes rarely','New: the YEAR 24000 vision is rebuilt - every block turns mirror chrome, a neon grid floor, a purple sky, a neon skyline with 24,000 AE signs, saucers overhead','Mobs: a chrome Sphinx and chrome robots stand in front of the pyramid in a wide steady shot','Textures: the normal world comes back fully when the vision ends']},\n",1)
for i in '12':
  s=s.replace('<stop offset="0" stop-color="#fff6cf"/><stop offset=".48" stop-color="#f6c83e"/><stop offset="1" stop-color="#b06e10"/></linearGradient><filter id="glA'+i, '<stop offset="0" stop-color="#f9dca0"/><stop offset=".45" stop-color="#c98236"/><stop offset="1" stop-color="#5e3210"/></linearGradient><filter id="glA'+i)
s=s.replace('flood-color="#ffc844" flood-opacity=".75"','flood-color="#ff9b30" flood-opacity=".8"').replace('stroke="#3a2206" stroke-width="4"','stroke="#2a1604" stroke-width="6"')
s=s.replace('<svg viewBox="0 0 680 230" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="glG','<svg viewBox="22 22 636 190" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="glG')
s=s.replace('</head>','<style>'+open('menu65.css').read()+'</style>\n</head>',1)
open(p,'w').write(s)
P
cp site/index.html /tmp/srv/new166.html; cp -r site/assets /tmp/srv/
python3 - <<'P'
p='site/index.html';s=open(p).read();k='window.PATCH_NOTES = [\n';i=s.index(k)+len(k);seen=set();out=[];rest=s[i:].split('\n')
j=0
while rest[j].startswith("{v:'v"):
    v=rest[j][4:rest[j].index("'",5)]
    if v not in seen: seen.add(v); out.append(rest[j])
    j+=1
s=s[:i]+'\n'.join(out+rest[j:]);open(p,'w').write(s);print('notes',len(out),'dropped',j-len(out))
P
cp site/index.html /tmp/srv/new166.html
