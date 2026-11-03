import re,json,base64,urllib.request,os,urllib.parse
B="https://texture-hud-patch.preview.emergentagent.com"
OUT="src-backup"; deps=set(); log={}
def get(p):
    try:
        r=urllib.request.urlopen(urllib.request.Request(B+p,headers={"User-Agent":"Mozilla/5.0"}),timeout=30)
        return r.read(),r.headers.get("content-type","")
    except Exception as e: return None,str(e)
def save(path,data):
    f=os.path.join(OUT,path.lstrip("/")); os.makedirs(os.path.dirname(f),exist_ok=True)
    open(f,"wb").write(data if isinstance(data,bytes) else data.encode())
seen=set(); q=["/src/main.tsx"]; assets=set()
while q:
    p=q.pop()
    if p in seen: continue
    seen.add(p)
    d,ct=get(p)
    if d is None or "text/html" in ct: log[p]="missing"; continue
    t=d.decode("utf-8","replace")
    for m in re.findall(r'(?:from|import)\s*\(?\s*["\']([^"\']+)["\']',t):
        if "/node_modules/" in m:
            n=m.split(".vite/deps/")[-1].split("?")[0].removesuffix(".js")
            n=n.split("_")[0] if not n.startswith("@") else "@"+n[1:].split("_")[0]+"/"+n[1:].split("_")[1] if "_" in n else n
            deps.add(n)
        elif m.startswith("/src/") or m.startswith("/@fs/"):
            q.append(m.split("?")[0])
        elif m.startswith("/") and not m.startswith("/@"): assets.add(m.split("?")[0])
    for m in re.findall(r'["\'](/[^"\'\s]+\.(?:png|jpe?g|webp|svg|gif|mp3|ogg|wav|glb|gltf|json|ico))["\']',t): assets.add(m)
    sm=re.search(r'sourceMappingURL=data:application/json;(?:charset=utf-8;)?base64,([A-Za-z0-9+/=]+)',t)
    orig=None
    if sm:
        j=json.loads(base64.b64decode(sm.group(1)))
        sc=j.get("sourcesContent") or []
        if sc and sc[0]: orig=sc[0]
    if p.endswith(".css"):
        r,ct2=get(p+"?direct")
        if r and "html" not in ct2: save(p,r); log[p]="original (css ?direct)"; continue
    if orig: save(p,orig); log[p]="original (sourcemap)"
    else: save(p,t); log[p]="transformed"
for a in assets:
    d,ct=get(a)
    if d and "text/html" not in ct: save("public"+a,d); log[a]="asset"
    else: log[a]="missing"
for f in ["/package.json","/vite.config.ts","/tsconfig.json","/tailwind.config.js","/postcss.config.js","/index.html","/favicon.ico","/manifest.json","/components.json"]:
    d,ct=get(f)
    if d and "text/html" not in ct or f=="/index.html":
        if d: save(f,d); log[f]="fetched ("+ct+")"
    else: log[f]="missing"
json.dump({"files":log,"deps":sorted(deps)},open("crawl-log.json","w"),indent=1)
