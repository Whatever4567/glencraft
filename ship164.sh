python3 build87.py 1.0.64 >/dev/null && python3 build.py v1.0.64 >/dev/null 2>&1; python3 extract_inline.py && python3 - <<'P'
p='site/index.html';s=open(p).read();k='window.PATCH_NOTES = [\n';assert k in s
s=s.replace(k,k+"{v:'v1.0.64', d:'2026-10-31', notes:['Much faster loading - the loading screen now closes the moment the game is ready (no more fixed wait)','Textures load as separate files in parallel, so the page is about 85 percent smaller','Music, planets, the moon picture and mob sounds now load after the menu opens','The Moon only shows at night - it rises at dusk, sets at dawn and is hidden by day','The big desert saucer is rebuilt - dark gunmetal hull, a detailed underside with struts and a blazing core, and hundreds of rainbow lights that chase and twinkle, glowing on the ground below']},\n",1);open(p,'w').write(s)
P
cp site/index.html /tmp/srv/new164.html; cp -r site/assets /tmp/srv/
