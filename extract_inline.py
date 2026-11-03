# v1.0.64: move big inline base64 images out of index.html into hashed files (parallel, cacheable)
import re,base64,hashlib,os,sys
P='site/index.html';s=open(P).read();os.makedirs('site/assets/x',exist_ok=True)
keep=set();n=[0,0]
def rep(m):
    if len(m.group(0))<8000: return m.group(0)
    b=base64.b64decode(m.group(2));ext={'jpeg':'jpg','png':'png','gif':'gif'}[m.group(1)]
    f='assets/x/%s.%s'%(hashlib.sha1(b).hexdigest()[:12],ext);keep.add(os.path.basename(f))
    if not os.path.exists('site/'+f): open('site/'+f,'wb').write(b)
    n[0]+=1;n[1]+=len(m.group(0));return f
s=re.sub(r'data:image/(jpeg|png|gif);base64,([A-Za-z0-9+/=]+)',rep,s)
for f in os.listdir('site/assets/x'):
    if f not in keep: os.remove('site/assets/x/'+f)
open(P,'w').write(s);print(n,len(s),len(keep))
