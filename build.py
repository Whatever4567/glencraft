import re,sys
s=open('s1.js').read();h=open('site/index.html').read()
parts=[(m.end(), h.index('</script>',m.end())) for m in re.finditer(r'<script>',h)];x,y=max(parts,key=lambda p:p[1]-p[0]);h=h[:x]+s+h[y:]
v=sys.argv[1];h=re.sub(r'glencraft-build: [^\n]*?(?= -->)','glencraft-build: b'+re.sub(r'\D','',v)+'-'+v,h,1);open('site/index.html','w').write(h)
