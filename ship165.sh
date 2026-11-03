python3 build87.py 1.0.65 >/dev/null && python3 build.py v1.0.65 >/dev/null 2>&1; python3 extract_inline.py && python3 - <<'P'
import re
p='site/index.html';s=open(p).read();k='window.PATCH_NOTES = [\n';assert k in s
s=s.replace(k,k+"{v:'v1.0.65', d:'2026-10-31', notes:['New main menu - a big golden-brown GLENCRAFT logo across the top and just Play and Settings on the left','A slow crossfading slideshow of your own pictures plays behind the menu','Patch notes are now in Settings','The loading screen uses the same big logo','Sheep and pigs now use real recordings - several clean variants each with a little random pitch (credits in CREDITS.md)']},\n",1)
for i in '12':
  s=s.replace('<stop offset="0" stop-color="#fff6cf"/><stop offset=".48" stop-color="#f6c83e"/><stop offset="1" stop-color="#b06e10"/></linearGradient><filter id="glA'+i, '<stop offset="0" stop-color="#f9dca0"/><stop offset=".45" stop-color="#c98236"/><stop offset="1" stop-color="#5e3210"/></linearGradient><filter id="glA'+i)
s=s.replace('flood-color="#ffc844" flood-opacity=".75"','flood-color="#ff9b30" flood-opacity=".8"').replace('stroke="#3a2206" stroke-width="4"','stroke="#2a1604" stroke-width="6"')
s=s.replace('<svg viewBox="0 0 680 230" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="glG','<svg viewBox="22 22 636 190" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="glG')
s=s.replace('</head>','<style>'+open('menu65.css').read()+'</style>\n</head>',1)
open(p,'w').write(s)
P
cp site/index.html /tmp/srv/new165.html; cp -r site/assets /tmp/srv/
