import json, math, gzip, struct, numpy as np
from PIL import Image, ImageDraw
CELL=4.0; LAT0,LAT1=55.9355,55.8940; LON0=-4.4575
lat_c=(LAT0+LAT1)/2; mlon=111320*math.cos(math.radians(lat_c)); mlat=111200
N=int(round((LAT0-LAT1)*mlat/CELL)); N=(N+15)//16*16
LON1=LON0+N*CELL/mlon
print('N',N,'lon1',LON1)
def xy(lat,lon): return ((lon-LON0)*mlon/CELL, (LAT0-lat)*mlat/CELL)
d=json.load(open('osm_clyde.json'))
ways=d['ways']; rels=d['rels']
# ---------- DEM ----------
M=np.load('dem.npy'); M=np.clip(M,-2,400)
zs=np.arange(N)+0.5
lat=LAT0-zs*CELL/mlat; lon=LON0+zs*CELL/mlon
n=2**15
px=((lon+180)/360*n-15978)*256
py=((1-np.arcsinh(np.tan(np.radians(lat)))/math.pi)/2*n-10213)*256
X,Y=np.meshgrid(px,py)
x0=np.floor(X).astype(int); y0=np.floor(Y).astype(int); fx=X-x0; fy=Y-y0
E_=(M[y0,x0]*(1-fx)*(1-fy)+M[y0,x0+1]*fx*(1-fy)+M[y0+1,x0]*(1-fx)*fy+M[y0+1,x0+1]*fx*fy)
elev=np.maximum(E_,0.0)  # metres, [z][x]
SEA=41
def e2y(e):
    y=np.where(e<=140, e/4.0, 35+(e-140)/8.0)
    return SEA+1+np.round(y).astype(int)
h=e2y(elev).clip(SEA+1,86).astype(np.int16)
# ---------- helpers ----------
def poly_img(): return Image.new('I',(N,N),0)
def ring_xy(g): return [xy(a,b) for a,b in g]
def outer_rings(r):
    out=[];inn=[]
    for t,ref,role in r['members']:
        if t=='w' and str(ref) in ways:
            g=ways[str(ref)]['geom']
            (inn if role=='inner' else out).append(g)
    return join(out),join(inn)
def join(segs):
    segs=[s[:] for s in segs if len(s)>1]; rings=[]
    while segs:
        cur=segs.pop(0)
        changed=True
        while cur[0]!=cur[-1] and changed:
            changed=False
            for i,s in enumerate(segs):
                if s[0]==cur[-1]: cur+=s[1:]; segs.pop(i); changed=True; break
                if s[-1]==cur[-1]: cur+=s[::-1][1:]; segs.pop(i); changed=True; break
                if s[-1]==cur[0]: cur=s+cur[1:]; segs.pop(i); changed=True; break
                if s[0]==cur[0]: cur=s[::-1]+cur[1:]; segs.pop(i); changed=True; break
        rings.append(cur)
    return rings
areas=[]  # (tags, outer rings, inner rings)
for wid,w in ways.items():
    g=w['geom']
    if len(g)>3 and g[0]==g[-1]: areas.append((w['tags'],[g],[],wid))
for r in rels:
    if r['tags'].get('type') in('multipolygon','building'):
        o,i=outer_rings(r)
        if o: areas.append((r['tags'],o,i,'r'+str(r['id'])))
# ---------- surface classes ----------
S=np.zeros((N,N),np.uint8)
img=Image.new('L',(N,N),0); dr=ImageDraw.Draw(img)
def cls(t):
    lu=t.get('landuse');le=t.get('leisure');na=t.get('natural');am=t.get('amenity');gf=t.get('golf')
    if gf=='bunker': return 9,90
    if gf in('green','tee'): return 23,89
    if gf=='fairway': return 8,88
    if na=='water' or t.get('waterway')=='riverbank' or lu in('reservoir','basin') or t.get('water'): return (5 if t.get('water')=='river' or 'Clyde' in t.get('name','') else 6),95
    if na in('sand','beach'): return 17,60
    if lu=='cemetery' or am=='grave_yard': return 10,70
    if le=='golf_course': return 8,40
    if le in('pitch','track','stadium'): return 13,72
    if le in('park','garden','recreation_ground','playground','common','nature_reserve'): return 1,45
    if lu in('forest',) or na=='wood': return 7,50
    if na in('scrub',): return 25,48
    if na in('heath','moor','grassland') : return 15,30
    if lu in('farmland','meadow','grass','village_green','orchard'): return 14 if lu!='grass' else 1, 35
    if lu=='allotments': return 24,55
    if lu in('industrial','railway','construction','brownfield','commercial','depot','port','quarry'): return 16,25
    if lu=='retail': return 22,26
    if am in('parking',) or t.get('parking'): return 11,65
    if lu=='residential': return 21,20
    if t.get('area:highway') or t.get('highway')=='pedestrian' or (t.get('place')=='square'): return 20,66
    if am in('school','college','university','hospital'): return 16,22
    if t.get('historic')=='archaeological_site' and ('fort' in t.get('name','').lower() or t.get('site_type')=='fortification'): return 19,80
    return None
lay=[]
for t,o,i,wid in areas:
    if 'building' in t: continue
    c=cls(t)
    if c: lay.append((c[1],c[0],o,i))
lay.sort(key=lambda a:a[0])
for pr,c,o,i in lay:
    m=Image.new('L',(N,N),0); md=ImageDraw.Draw(m)
    for r in o:
        if len(r)>2: md.polygon(ring_xy(r),fill=1)
    for r in i:
        if len(r)>2: md.polygon(ring_xy(r),fill=0)
    S[np.asarray(m)>0]=c
# waterways as lines
for wid,w in ways.items():
    t=w['tags'];ww=t.get('waterway');g=w['geom']
    if not ww or len(g)<2 or t.get('tunnel') or t.get('layer','0').startswith('-'): continue
    wdt={'river':6,'canal':4,'stream':1,'ditch':1,'drain':1}.get(ww,0)
    if not wdt: continue
    m=Image.new('L',(N,N),0); ImageDraw.Draw(m).line(ring_xy(g),fill=1,width=wdt)
    S[(np.asarray(m)>0)&(S!=5)]=5 if ww=='river' and 'Clyde' in t.get('name','') else 6
# ---------- roads / paths / rail ----------
RW={'motorway':5,'trunk':5,'primary':4,'secondary':3,'tertiary':3,'unclassified':2,'residential':2,'living_street':2,'service':1,'motorway_link':2,'trunk_link':2,'primary_link':2,'secondary_link':2,'tertiary_link':2,'pedestrian':2,'footway':1,'path':1,'cycleway':1,'steps':1,'track':1,'bridleway':1}
BR=np.zeros((N,N),np.uint8)
roads=[]
for wid,w in ways.items():
    t=w['tags'];hw=t.get('highway');g=w['geom']
    if len(g)<2: continue
    if t.get('tunnel') in('yes','culvert'): continue
    if t.get('railway') in('rail','light_rail') : roads.append((0,12,2,g,t)); continue
    if hw in RW:
        wdt=RW[hw]
        if hw in('trunk','primary') and t.get('oneway')=='yes': wdt=3
        k=2 if hw in('motorway','trunk','primary','secondary','motorway_link','trunk_link','primary_link','secondary_link') else 3 if hw in('tertiary','unclassified','residential','living_street','service','tertiary_link') else 26 if hw in('track','bridleway') else 20 if hw=='pedestrian' else 4
        roads.append((1 if k==4 or k==26 else 2, k, wdt, g, t))
roads.sort(key=lambda r:r[0])
# pavements along urban roads first (they become kerb-side footways)
pav=Image.new('L',(N,N),0); pd=ImageDraw.Draw(pav)
for pr,k,wdt,g,t in roads:
    if k in(2,3) and t.get('highway') not in('service','motorway','trunk','motorway_link','trunk_link') and t.get('sidewalk','both')!='no':
        pd.line(ring_xy(g),fill=1,width=wdt+2)
pv=np.asarray(pav)>0
S[pv&~np.isin(S,[5,6])]=20
for pr,k,wdt,g,t in roads:
    m=Image.new('L',(N,N),0); ImageDraw.Draw(m).line(ring_xy(g),fill=1,width=wdt); mm=np.asarray(m)>0
    if t.get('bridge') and t.get('bridge')!='no':
        BR[mm]=2 if 'Roman' in t.get('name','') else 1
        S[mm]=k
    else:
        S[mm&~np.isin(S,[5,6])]=k
# Antonine Wall rampart
for wid,w in ways.items():
    if w['tags'].get('name')=='Antonine Wall' and len(w['geom'])>1:
        m=Image.new('L',(N,N),0); ImageDraw.Draw(m).line(ring_xy(w['geom']),fill=1,width=3); mm=np.asarray(m)>0
        S[mm&~np.isin(S,[2,3,5,6])]=18
# ---------- buildings ----------
BID=np.zeros((N,N),np.int32); binfo=[]
bimg=Image.new('I',(N,N),0); bd=ImageDraw.Draw(bimg)
landat=S.copy()
def btype(t,area,lu):
    b=t.get('building','yes'); a=t.get('amenity',''); s=t.get('shop','')
    if b in('church','chapel','cathedral') or a=='place_of_worship': return 6
    if b in('school','college','university','civic','public','hospital','government','fire_station','townhall') or a in('school','townhall','library','police','fire_station'): return 7
    if b in('garage','garages','shed','hut','roof','carport','greenhouse','kiosk','cabin','allotment_house') : return 8
    if b in('retail','supermarket','commercial','office','kiosk') or s or lu==22: return 4
    if b in('industrial','warehouse','factory','manufacture','storage_tank','service','transportation','train_station','hangar'): return 5 if b!='train_station' else 7
    if b in('apartments','flats','residential','dormitory') :
        lv=t.get('building:levels')
        if lv and lv.replace('.','').isdigit() and float(lv)>=6: return 3
        return 2
    if b in('castle','ruins','tower') or t.get('historic'): return 10
    if b=='detached' or b=='bungalow': return 9
    if b in('house','semidetached_house','terrace','semi','semi-detached'): return 1
    # building=yes: infer
    if area<40: return 8
    if lu in(16,): return 5
    if lu==22: return 4
    if area>320: return 2 if lu==21 else 4
    return 1
bl=[]
for t,o,i,wid in areas:
    if 'building' not in t or t.get('building')=='no': continue
    if t.get('location')=='underground': continue
    pts=[ring_xy(r) for r in o]
    xs=[p[0] for r in pts for p in r]; zs_=[p[1] for r in pts for p in r]
    if max(xs)<0 or min(xs)>=N or max(zs_)<0 or min(zs_)>=N: continue
    bl.append((t,pts,[ring_xy(r) for r in i]))
for bi,(t,pts,inn) in enumerate(bl):
    for r in pts:
        if len(r)>2: bd.polygon(r,fill=bi+1)
    for r in inn:
        if len(r)>2: bd.polygon(r,fill=0)
BID=np.asarray(bimg).astype(np.int32)
BH=np.zeros((N,N),np.uint8); BT=np.zeros((N,N),np.uint8)
ids=BID.ravel(); order=np.argsort(ids,kind='stable'); sid=ids[order]
starts=np.searchsorted(sid,np.arange(len(bl)+2))
hflat=h.ravel(); lflat=landat.ravel()
BHf=BH.ravel(); BTf=BT.ravel(); stats={}
for bi in range(1,len(bl)+1):
    cells=order[starts[bi]:starts[bi+1]]
    if len(cells)==0: continue
    t=bl[bi-1][0]; area=len(cells)*CELL*CELL
    lu=np.bincount(lflat[cells]).argmax()
    ty=btype(t,area,lu)
    lv=None
    for k in('building:levels',):
        v=t.get(k)
        try: lv=float(v.split(';')[0])
        except: pass
    hm=None
    try: hm=float(t.get('height','').replace('m','').strip())
    except: pass
    if hm is None and lv is None: lv={1:2,2:4,3:10,4:2,5:2,6:3,7:2,8:1,9:2,10:3}[ty]
    if ty==2 and t.get('building:levels') is None and area<300: lv=3
    hgt=hm if hm else lv*3.0+ (0.5 if ty in(4,5) else 0)
    hb=max(1,int(round(hgt/4.0*1.33)))  # 4 m/block vertically, storeys a touch taller so a floor is 1 block
    base=int(np.median(hflat[cells]))
    hflat[cells]=base
    roof=t.get('roof:shape','')
    pitched = roof in('gabled','hipped','pyramidal','gambrel','mansard','half-hipped','side_hipped','gabled_row') or (roof=='' and ty in(1,2,6,9,10))
    BHf[cells]=min(hb,40); BTf[cells]=ty|(16 if pitched else 0)
    stats[ty]=stats.get(ty,0)+1
h=hflat.reshape(N,N); BH=BHf.reshape(N,N); BT=BTf.reshape(N,N)
print('buildings',len(bl),'by type',stats)

from scipy import ndimage as ndi
BIDr=np.asarray(bimg).astype(np.int64)
edge=np.zeros((N,N),bool)
for dx,dz in((1,0),(-1,0),(0,1),(0,-1)): edge|=np.roll(BIDr,(dz,dx),(0,1))!=BIDr
inside=(BIDr>0)&~edge
RD=np.where(BIDr>0,ndi.distance_transform_cdt(inside,metric='taxicab')+1,0).clip(0,15).astype(np.uint8)
B8=np.where(BIDr>0,BIDr%251+1,0).astype(np.uint8)
# River Clyde: mapped as tidal coastline here. Rasterise the coastline as a barrier and flood from the river centre line
_cb=Image.new('L',(N,N),0); _cd=ImageDraw.Draw(_cb)
for wid,w in ways.items():
    if w['tags'].get('natural')=='coastline' and len(w['geom'])>1: _cd.line(ring_xy(w['geom']),fill=1,width=2)
_bar=np.asarray(_cb)>0
_rl=np.zeros((N,N),bool)
for wid,w in ways.items():
    t=w['tags']
    if t.get('waterway')=='river' and 'Clyde' in t.get('name','') and len(w['geom'])>1:
        m=Image.new('L',(N,N),0); ImageDraw.Draw(m).line(ring_xy(w['geom']),fill=1,width=1); _rl|=np.asarray(m)>0
_lab,_n=ndi.label(~_bar)
_ids=np.unique(_lab[_rl&~_bar]); _ids=_ids[_ids>0]
_riv=np.isin(_lab,_ids)|(_bar&ndi.binary_dilation(np.isin(_lab,_ids),iterations=1))
print('river fill cells',int(_riv.sum()),'labels',len(_ids))
S[_riv&~np.isin(S,[12])&(BIDr==0)]=5
S[(S==5)&~_riv]=0
# ---------- water ----------
WL=np.zeros((N,N),np.int16)
river=S==5; other=S==6
WL[river]=SEA
# river bed deepens away from the bank
dr_=ndi.distance_transform_cdt(river,metric='taxicab')
h=np.where(river,SEA-np.minimum(1+dr_,7),h)
# canal / burns / ponds: level from the surrounding land, 2 deep
lab,nl=ndi.label(other)
if nl:
    land=~(river|other)
    # local land height via max filter of land heights
    hl=np.where(land,h,0).astype(np.int16)
    near=ndi.maximum_filter(hl,size=5)
    for i,sl in enumerate(ndi.find_objects(lab),1):
        m=lab[sl]==i
        ring=ndi.binary_dilation(m,iterations=2)&~m
        vals=h[sl][ring&land[sl]]
        lvl=int(np.percentile(vals,15)) if len(vals) else int(np.median(h[sl][m]))
        lvl=max(lvl-1,SEA)
        if m.sum()<=3: lvl=max(SEA,int(np.median(h[sl][m]))-1)
        sub=WL[sl]; sub[m]=lvl
        hh=h[sl]; dd=ndi.distance_transform_cdt(m,metric='taxicab'); hh[m]=np.maximum(lvl-np.minimum(1+dd[m],3),1)
# bridges: deck sits above water
BRm=BR>0
if BRm.any():
    # deck height = max of nearby road heights
    hb_=np.where(BRm&~(river|other),h,0)
    deck=ndi.maximum_filter(np.where(~(river|other),h,0),size=9)
    h=np.where(BRm&(river|other),np.maximum(deck,WL+2),h)
    WL=np.where(BRm&~(river|other),0,WL)
S=S.astype(np.uint8)
S[BRm]|=0x80
# ---------- trees ----------
trees=[]
for p in d['pts']:
    t=p['tags']
    if t.get('natural')=='tree':
        x,z=xy(p['lat'],p['lon'])
        if 0<=x<N and 0<=z<N: trees.append((int(x),int(z)))
for wid,w in ways.items():
    if w['tags'].get('natural')=='tree_row' and len(w['geom'])>1:
        g=ring_xy(w['geom'])
        for (ax,az),(bx,bz) in zip(g,g[1:]):
            L=max(1,int(math.hypot(bx-ax,bz-az)/2.5))
            for k in range(L): trees.append((int(ax+(bx-ax)*k/L),int(az+(bz-az)*k/L)))
trees=[(x,z) for x,z in trees if 0<=x<N and 0<=z<N and BIDr[z,x]==0 and (S[z,x]&0x7f) not in(2,3,5,6,12)]
# ---------- named places ----------
places=[]
for p in d['pts']:
    t=p['tags']
    if t.get('place') in('village','town','suburb','hamlet','neighbourhood','locality') and t.get('name'):
        x,z=xy(p['lat'],p['lon'])
        if 0<=x<N and 0<=z<N: places.append([t['name'],int(x),int(z)])
named=['Dalmuir Park','Dalmuir Municipal Golf Course','Old Dalnottar Cemetery','North Dalnottar Crematorium','Kilbowie Cemetery','Duntocher Roman fort','Clyde Shopping Centre','Forth and Clyde Canal','River Clyde','Clydebank & District Golf Course','Mountblow Sports Pavilion','Great Western Road']
for t,o,i,wid in areas:
    n_=t.get('name')
    if n_ in named:
        g=ring_xy(max(o,key=len)); cx=sum(p[0] for p in g)/len(g); cz=sum(p[1] for p in g)/len(g)
        if 0<=cx<N and 0<=cz<N: places.append([n_,int(cx),int(cz)])
for wid,w in ways.items():
    n_=w['tags'].get('name')
    if n_ in ('Great Western Road','Forth and Clyde Canal','River Clyde','Antonine Wall','Roman Road') and len(w['geom'])>1:
        g=ring_xy(w['geom']); cx,cz=g[len(g)//2]
        if 0<=cx<N and 0<=cz<N and not any(p[0]==n_ and abs(p[1]-cx)<150 and abs(p[2]-cz)<150 for p in places): places.append([n_,int(cx),int(cz)])
# ---------- castle sites: open (no buildings/roads), not key named places, by kind ----------
free=(BIDr==0)&np.isin(S&0x7f,[0,14,15,25,7,1])
cover=ndi.uniform_filter(free.astype(np.float32),size=40)
slope=ndi.maximum_filter(h,size=30)-ndi.minimum_filter(h,size=30)
def pick(score,avoid,R=40):
    sc=np.where((cover>0.97)&(slope<10),score,-1e9)
    for (ax,az) in avoid: 
        z0,z1=max(0,az-160),min(N,az+160); x0,x1=max(0,ax-160),min(N,ax+160); sc[z0:z1,x0:x1]=-1e9
    sc[:R,:]=-1e9; sc[-R:,:]=-1e9; sc[:,:R]=-1e9; sc[:,-R:]=-1e9
    z,x=np.unravel_index(np.argmax(sc),sc.shape); return int(x),int(z)
avoid=[(p[1],p[2]) for p in places if p[0] in named or p[0]=='Antonine Wall']
castles=[]
# 1 citadel: high ground
c=pick(h.astype(np.float32),avoid); castles.append(['citadel',*c]); avoid.append(c)
# 2 turreted orange-roofed castle: a moderate hill
c=pick(-np.abs(h.astype(np.float32)-(SEA+22))+ndi.uniform_filter(h.astype(np.float32),9)*0.05,avoid); castles.append(['turrets',*c]); avoid.append(c)
# 3 ruined tower-house by the Clyde shore
dist_river=ndi.distance_transform_edt(~river)
cover2=ndi.uniform_filter(((BIDr==0)&~river&~other).astype(np.float32),size=24)
sc=np.where((dist_river>6)&(dist_river<26)&(cover2>0.95),-dist_river,-1e9).astype(np.float32); sc[:40,:]=-1e9; sc[-40:,:]=-1e9; sc[:,:40]=-1e9; sc[:,-40:]=-1e9; sc[:N//2,:]=-1e9
for (ax,az) in avoid: sc[max(0,az-160):az+160,max(0,ax-160):ax+160]=-1e9
z,x=np.unravel_index(np.argmax(sc),sc.shape); castles.append(['towerhouse',int(x),int(z)]); avoid.append((int(x),int(z)))
# 4 loch island ruin: open moor; the game digs a lochan round it
c=pick(-np.abs(h.astype(np.float32)-(SEA+30)),avoid); castles.append(['lochisle',*c])
print('castles',castles)
for c in castles:
    lat=LAT0-c[2]*CELL/mlat; lon=LON0+c[1]*CELL/mlon; c.append(round(lat,5)); c.append(round(lon,5))
# ---------- write ----------
hdr={'N':N,'cell':CELL,'sea':SEA,'vscale':'4 m/block to 140 m, then 8 m/block','bbox':[LAT1,LON0,LAT0,LON1],
     'layers':['h','wl','s','bt','bh','rd','b8'],'places':places,'castles':castles,
     'trees':[v for t in trees for v in t],'attribution':'Map data (c) OpenStreetMap contributors (ODbL). Elevation: Mapzen/AWS Terrain Tiles (SRTM, EU-DEM/Copernicus, OS Terrain 50 and others).'}
hj=json.dumps(hdr).encode()
raw=struct.pack('<I',len(hj))+hj+b''.join(a.astype(np.uint8).tobytes() for a in (h.clip(0,255),WL.clip(0,255),S,BT,BH,RD,B8))
open('/workspace/game/site/world/clydebank.bin.gz','wb').write(gzip.compress(raw,9))
import os; print('raw',len(raw),'gz',os.path.getsize('/workspace/game/site/world/clydebank.bin.gz'),'trees',len(trees),'places',len(places))
# preview
pal=np.zeros((256,3),np.uint8)
for k,c in {0:(110,160,80),1:(90,180,90),2:(60,60,64),3:(90,90,95),4:(200,190,160),5:(40,90,170),6:(60,120,200),7:(30,100,40),8:(120,200,110),9:(230,210,150),10:(130,150,120),11:(80,80,80),12:(120,100,90),13:(100,200,100),14:(170,190,110),15:(140,120,90),16:(150,150,140),17:(230,220,170),18:(200,60,60),19:(220,120,40),20:(170,170,165),21:(120,170,100),22:(180,170,150),23:(150,230,140),24:(130,140,60),25:(100,130,70),26:(150,120,80)}.items(): pal[k]=c
img=pal[S&0x7f].astype(np.float32)
img*=(0.75+0.25*(h-h.min())/(np.ptp(h)+1))[...,None]
bm=BH>0; img[bm]=np.array([200,120,100])*0.6+img[bm]*0.0+ (BH[bm,None]*4)
for c in castles: img[max(0,c[2]-6):c[2]+6,max(0,c[1]-6):c[1]+6]=(255,0,255)
Image.fromarray(img.clip(0,255).astype(np.uint8)).save('/workspace/clyde/preview.png')
