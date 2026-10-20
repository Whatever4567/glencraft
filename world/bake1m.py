import json, math, gzip, struct, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
CELL=1.0; LAT0,LAT1=55.9280,55.9070; LON0,LON1=-4.4420,-4.4060
lat_c=(LAT0+LAT1)/2; mlon=111320*math.cos(math.radians(lat_c)); mlat=111200
NX=int(round((LON1-LON0)*mlon)); NZ=int(round((LAT0-LAT1)*mlat))
print('grid',NX,NZ)
def xy(lat,lon): return ((lon-LON0)*mlon, (LAT0-lat)*mlat)
d=json.load(open('osm_clyde.json')); ways=d['ways']; rels=d['rels']
# ---- DEM ----
M=np.clip(np.load('dem.npy'),0,400)
lat=LAT0-(np.arange(NZ)+0.5)/mlat; lon=LON0+(np.arange(NX)+0.5)/mlon
n=2**15; px=((lon+180)/360*n-15978)*256; py=((1-np.arcsinh(np.tan(np.radians(lat)))/math.pi)/2*n-10213)*256
X,Y=np.meshgrid(px,py); x0=np.floor(X).astype(int); y0=np.floor(Y).astype(int); fx=X-x0; fy=Y-y0
elev=(M[y0,x0]*(1-fx)*(1-fy)+M[y0,x0+1]*fx*(1-fy)+M[y0+1,x0]*(1-fx)*fy+M[y0+1,x0+1]*fx*fy).astype(np.float32)
elev=ndi.gaussian_filter(elev,2.0)
BASEY=42
h=(BASEY+np.round(elev)).astype(np.int16)
print('elev',elev.min(),elev.max())
def R(g): return [xy(a,b) for a,b in g]
def mask_poly(rings_out,rings_in=()):
    m=Image.new('L',(NX,NZ),0); dr=ImageDraw.Draw(m)
    for r in rings_out:
        if len(r)>2: dr.polygon(R(r),fill=1)
    for r in rings_in:
        if len(r)>2: dr.polygon(R(r),fill=0)
    return np.asarray(m)>0
def mask_line(g,w):
    m=Image.new('L',(NX,NZ),0); ImageDraw.Draw(m).line(R(g),fill=1,width=max(1,int(round(w))),joint='curve')
    return np.asarray(m)>0
def join(segs):
    segs=[s[:] for s in segs if len(s)>1]; rings=[]
    while segs:
        cur=segs.pop(0); ch=True
        while cur[0]!=cur[-1] and ch:
            ch=False
            for i,s in enumerate(segs):
                if s[0]==cur[-1]: cur+=s[1:]; segs.pop(i); ch=True; break
                if s[-1]==cur[-1]: cur+=s[::-1][1:]; segs.pop(i); ch=True; break
                if s[-1]==cur[0]: cur=s+cur[1:]; segs.pop(i); ch=True; break
                if s[0]==cur[0]: cur=s[::-1]+cur[1:]; segs.pop(i); ch=True; break
        rings.append(cur)
    return rings
def inbox(g):
    xs=[xy(a,b) for a,b in g]; return any(-50<=x<NX+50 and -50<=z<NZ+50 for x,z in xs)
areas=[]
for wid,w in ways.items():
    g=w['geom']
    if len(g)>3 and g[0]==g[-1] and inbox(g): areas.append((w['tags'],[g],[],wid))
for r in rels:
    if r['tags'].get('type') in('multipolygon','building'):
        o=join([ways[str(m[1])]['geom'] for m in r['members'] if m[0]=='w' and str(m[1]) in ways and m[2]!='inner'])
        i=join([ways[str(m[1])]['geom'] for m in r['members'] if m[0]=='w' and str(m[1]) in ways and m[2]=='inner'])
        if o and any(inbox(x) for x in o): areas.append((r['tags'],o,i,'r'))
# ---- landuse classes (same codes as the 4 m bake) ----
S=np.zeros((NZ,NX),np.uint8)
def cls(t):
    lu=t.get('landuse');le=t.get('leisure');na=t.get('natural');am=t.get('amenity');gf=t.get('golf')
    if gf=='bunker': return 9,90
    if gf in('green','tee'): return 23,89
    if gf in('fairway',): return 8,88
    if gf=='rough': return 25,87
    if na=='water' or t.get('waterway')=='riverbank' or lu in('reservoir','basin') or t.get('water'): return 6,95
    if lu=='cemetery' or am=='grave_yard': return 10,70
    if le=='golf_course': return 8,40
    if le in('pitch','track','stadium'): return 13,72
    if le in('park','garden','recreation_ground','playground','common','nature_reserve','dog_park'): return 1,45
    if lu=='forest' or na=='wood': return 7,50
    if na=='scrub': return 25,48
    if na in('heath','moor','grassland'): return 15,30
    if lu in('farmland','meadow','orchard'): return 14,35
    if lu in('grass','village_green','recreation_ground'): return 1,35
    if lu=='allotments': return 24,55
    if lu in('industrial','railway','construction','brownfield','commercial','depot','garages'): return 16,25
    if lu=='retail': return 22,26
    if am=='parking' or t.get('parking'): return 11,65
    if lu=='residential': return 21,20
    if t.get('area:highway') or t.get('highway')=='pedestrian' or t.get('place')=='square': return 20,66
    if am in('school','college','university','hospital','place_of_worship','community_centre'): return 16,22
    if t.get('historic')=='archaeological_site' and 'fort' in t.get('name','').lower(): return 19,80
    return None
lay=[]
for t,o,i,wid in areas:
    if 'building' in t: continue
    c=cls(t)
    if c: lay.append((c[1],c[0],o,i))
lay.sort(key=lambda a:a[0])
for pr,c,o,i in lay: S[mask_poly(o,i)]=c
# waterways
for wid,w in ways.items():
    t=w['tags'];ww=t.get('waterway');g=w['geom']
    if not ww or len(g)<2 or not inbox(g) or t.get('tunnel') or t.get('layer','0').startswith('-'): continue
    wd={'river':12,'canal':14,'stream':3,'ditch':1.5,'drain':1.5}.get(ww,0)
    if wd: S[mask_line(g,wd)&(S!=6)]=6
# ---- roads, kerbs, pavements, markings ----
RW={'motorway':14,'trunk':14,'primary':9,'secondary':8,'tertiary':7,'unclassified':6,'residential':6,'living_street':5,'service':3.5,'motorway_link':6,'trunk_link':6,'primary_link':6,'secondary_link':6,'tertiary_link':6,'pedestrian':5,'footway':2,'path':1.5,'cycleway':2,'steps':2,'track':3,'bridleway':2}
MARK=np.zeros((NZ,NX),np.uint8); BR=np.zeros((NZ,NX),bool)
roads=[]; footways=[]
for wid,w in ways.items():
    t=w['tags'];hw=t.get('highway');g=w['geom']
    if len(g)<2 or not inbox(g) or t.get('tunnel') in('yes','culvert'): continue
    if t.get('railway') in('rail','light_rail'): roads.append(('rail',4,g,t)); continue
    if hw not in RW: continue
    wd=RW[hw]
    try: wd=max(wd,float(t.get('lanes'))*3.2)
    except: pass
    if hw=='service' and t.get('service') in('driveway','parking_aisle'): wd=3
    if hw in('footway','path','cycleway','steps','track','bridleway','pedestrian'): footways.append((hw,wd,g,t))
    else: roads.append((hw,wd,g,t))
car=np.zeros((NZ,NX),bool); kerb=np.zeros((NZ,NX),bool); pave=np.zeros((NZ,NX),bool)
for hw,wd,g,t in roads:
    if hw=='rail': S[mask_line(g,wd)&(S!=6)]=12; continue
    urban= hw not in('motorway','trunk','motorway_link','trunk_link','track') and t.get('sidewalk','both')!='no' and hw!='service'
    if urban: pave|=mask_line(g,wd+2+4)
    if hw!='service': kerb|=mask_line(g,wd+2)
    m=mask_line(g,wd); car|=m
    if t.get('bridge') not in(None,'no'): BR|=m
kerb&=~car; pave&=~(car|kerb)
for hw,wd,g,t in footways:
    m=mask_line(g,wd)
    if t.get('bridge') not in(None,'no'): BR|=m
    S[m&~car&(S!=6)|(m&BR)]=4 if hw!='track' else 26
S[pave&(S!=6)]=20; S[kerb&(S!=6)]=27; S[car&((S!=6)|BR)]=3
# centre / lane lines: dashed 3 m on, 6 m off along two-way tertiary+ roads and 2-lane one-ways
def dashes(g,period=9,on=3):
    pts=R(g); acc=0; out=[]
    for (ax,az),(bx,bz) in zip(pts,pts[1:]):
        L=math.hypot(bx-ax,bz-az); k=0.0
        while k<L:
            if (acc+k)%period<on: out.append((ax+(bx-ax)*k/L,az+(bz-az)*k/L))
            k+=0.5
        acc+=L
    return out
for hw,wd,g,t in roads:
    if hw in('primary','secondary','tertiary','unclassified','trunk','primary_link','secondary_link') and (t.get('oneway')!='yes' or t.get('lanes') in('2','3')):
        for x,z in dashes(g):
            xi,zi=int(x),int(z)
            if 0<=xi<NX and 0<=zi<NZ and car[zi,xi]: MARK[zi,xi]=1
# crossings: zebra stripes across the road at crossing nodes
roadpts=[]
for hw,wd,g,t in roads: 
    if hw!='rail': roadpts.append((R(g),wd))
def road_dir(x,z):
    best=None;bd=1e9
    for pts,wd in roadpts:
        for (ax,az),(bx,bz) in zip(pts,pts[1:]):
            if min(ax,bx)-20>x or max(ax,bx)+20<x or min(az,bz)-20>z or max(az,bz)+20<z: continue
            vx,vz=bx-ax,bz-az; L2=vx*vx+vz*vz or 1; u=max(0,min(1,((x-ax)*vx+(z-az)*vz)/L2)); dd=math.hypot(ax+u*vx-x,az+u*vz-z)
            if dd<bd: bd=dd; best=(vx/math.sqrt(L2),vz/math.sqrt(L2),wd)
    return best,bd
for p in d['pts']:
    t=p['tags']
    if t.get('highway')=='crossing' and t.get('crossing')!='unmarked':
        x,z=xy(p['lat'],p['lon']); rd,dd=road_dir(x,z)
        if not rd or dd>6: continue
        vx,vz,wd=rd
        for a in np.arange(-2,2.01,0.5):
            for b in np.arange(-wd/2-1,wd/2+1,0.5):
                cx=x+vx*a-vz*b; cz=z+vz*a+vx*b; xi,zi=int(cx),int(cz)
                if 0<=xi<NX and 0<=zi<NZ and car[zi,xi]: MARK[zi,xi]=2 if int(math.floor(b+100))%2==0 else 3
# Antonine Wall rampart
for wid,w in ways.items():
    if w['tags'].get('name')=='Antonine Wall' and len(w['geom'])>1 and inbox(w['geom']):
        m=mask_line(w['geom'],6); S[m&~car&(S!=6)]=18
# ---- barriers ----
BAR=np.zeros((NZ,NX),np.uint8)
BT_={'wall':1,'fence':2,'wire_fence':2,'chain_link':2,'hedge':3,'retaining_wall':4,'guard_rail':5,'railing':5,'city_wall':1}
for wid,w in ways.items():
    b=w['tags'].get('barrier'); g=w['geom']
    if b in BT_ and len(g)>1 and inbox(g): BAR[mask_line(g,1 if b!='hedge' else 1.5)&~car]=BT_[b]
# ---- buildings ----
bl=[]
for t,o,i,wid in areas:
    if 'building' not in t or t.get('building')=='no' or t.get('location')=='underground': continue
    bl.append((t,o,i))
bimg=Image.new('I',(NX,NZ),0); bd=ImageDraw.Draw(bimg)
for bi,(t,o,i) in enumerate(bl):
    for r in o:
        if len(r)>2: bd.polygon(R(r),fill=bi+1)
    for r in i:
        if len(r)>2: bd.polygon(R(r),fill=0)
BID=np.asarray(bimg).astype(np.int32)
landat=S.copy()
T={'RSAND':150,'HARL':151,'SLATE':152,'RTILE':153,'ASPHALT':154,'PAVE':155,'WSTONE':156,'CONCRETE':157,'STONEBRICK':28,'BRICK':78,'PLANKS':10,'SANDSTONE':77,'COBBLE':12,'IRON':74,'GLASS':63}
COL={'white':'HARL','cream':'WSTONE','beige':'SANDSTONE','yellow':'SANDSTONE','red':'RSAND','brown':'BRICK','grey':'CONCRETE','gray':'CONCRETE','darkgrey':'STONEBRICK'}
def btype(t,area,lu):
    b=t.get('building','yes'); a=t.get('amenity','')
    if b in('church','chapel','cathedral') or a=='place_of_worship': return 6
    if b in('school','college','civic','public','hospital','fire_station','townhall','sports_centre','train_station','community_centre') or a in('school','library','police','community_centre'): return 7
    if b in('garage','garages','shed','hut','roof','carport','greenhouse','kiosk','cabin') : return 8
    if b in('retail','supermarket','commercial','office') or t.get('shop') or lu==22: return 4
    if b in('industrial','warehouse','factory','service','storage_tank'): return 5
    if b in('apartments','flats','residential'):
        try:
            if float(t.get('building:levels','0'))>=6: return 3
        except: pass
        return 2
    if b in('detached','bungalow'): return 9
    if b in('house','semidetached_house','terrace'): return 1
    if area<30: return 8
    if lu==16: return 5
    if lu==22: return 4
    if area>300: return 2 if lu==21 else 4
    return 1
WM=np.zeros((NZ,NX),np.uint8); RM=np.zeros((NZ,NX),np.uint8); BH=np.zeros((NZ,NX),np.uint8); RF=np.zeros((NZ,NX),np.uint8); BTL=np.zeros((NZ,NX),np.uint8); BF=np.zeros((NZ,NX),np.uint8)
ids=BID.ravel(); order=np.argsort(ids,kind='stable'); sid=ids[order]; starts=np.searchsorted(sid,np.arange(len(bl)+2))
hf=h.ravel(); lf=landat.ravel(); stats={}
# distance to the nearest road / path for door placement
access=np.isin(S,[3,4,20,27,11,26])
_,(iz,ix)=ndi.distance_transform_edt(~access,return_indices=True)
edge=np.zeros((NZ,NX),bool); outdir=np.full((NZ,NX),255,np.uint8)
for k,(dx,dz) in enumerate(((1,0),(-1,0),(0,1),(0,-1))):
    nb=np.roll(BID,(-dz,-dx),(0,1)); e=(BID>0)&(nb!=BID); edge|=e; outdir[e&(outdir==255)]=k
corner=np.zeros((NZ,NX),np.uint8)
for k,(dx,dz) in enumerate(((1,0),(-1,0),(0,1),(0,-1))): corner+=((BID>0)&(np.roll(BID,(-dz,-dx),(0,1))!=BID)).astype(np.uint8)
dist_acc=ndi.distance_transform_edt(~access)
rng=np.random.default_rng(3)
for bi in range(1,len(bl)+1):
    cells=order[starts[bi]:starts[bi+1]]
    if len(cells)==0: continue
    t=bl[bi-1][0]; area=len(cells)
    lu=np.bincount(lf[cells]).argmax(); ty=btype(t,area,lu)
    try: lv=float(t.get('building:levels','').split(';')[0])
    except: lv=None
    try: hm=float(t.get('height','').replace('m',''))
    except: hm=None
    if lv is None: lv={1:2,2:4,3:10,4:2,5:2,6:3,7:2,8:1,9:2,10:3}[ty]
    if ty==2 and t.get('building:levels') is None and area<250: lv=3
    wallh=int(round(hm*0.8)) if hm else int(lv*3)
    if ty in(4,5): wallh=max(wallh,5)
    if ty==8: wallh=3
    base=int(np.median(hf[cells])); hf[cells]=base
    # materials
    hsh=(bi*2654435761)&0xffffffff
    wm={1:'HARL',2:'RSAND',3:'CONCRETE',4:'CONCRETE',5:'CONCRETE',6:'STONEBRICK',7:'BRICK',8:'PLANKS',9:'BRICK',10:'STONEBRICK'}[ty]
    if ty==1 and hsh%5==0: wm='BRICK'
    if ty==2 and hsh%4==0: wm='SANDSTONE'
    if ty==4 and hsh%3==0: wm='BRICK'
    if ty==8 and hsh%2==0: wm='CONCRETE'
    c=(t.get('building:colour') or '').lower()
    if c in COL: wm=COL[c]
    shape=t.get('roof:shape') or ({1:'gabled',2:'gabled',6:'gabled',9:'hipped',10:'gabled'}.get(ty,'flat'))
    if ty==1 and hsh%3==0 and shape=='gabled': shape='hipped'
    rm='SLATE' if ty in(1,2,6,10) else 'RTILE' if ty==9 else 'ASPHALT'
    if ty==1 and hsh%7==0: rm='RTILE'
    rc=(t.get('roof:colour') or '').lower()
    if rc in('red','orange','brown'): rm='RTILE'
    if shape=='flat' and ty in(4,5,3,7): rm='CONCRETE' if hsh%2 else 'ASPHALT'
    zc,xc=np.divmod(cells,NX)
    rf=np.zeros(len(cells),np.int16)
    if shape!='flat' and area>=12:
        X=np.stack([xc-xc.mean(),zc-zc.mean()],1).astype(np.float64)
        cov=X.T@X/len(X); ev,evec=np.linalg.eigh(cov); maj=evec[:,1]; mnr=evec[:,0]
        u=X@maj; v=X@mnr; hw=np.abs(v).max()+0.5; hl=np.abs(u).max()+0.5
        pitch=0.8 if ty!=2 else 0.65
        r1=np.floor((hw-np.abs(v))*pitch)+1
        if shape in('hipped','pyramidal'): r1=np.minimum(r1,np.floor((hl-np.abs(u))*pitch)+1)
        rf=np.clip(r1,1,14).astype(np.int16)
        # chimneys on the ridge, near the gable ends (and every ~10 m along tenement ridges)
        ridge=np.abs(v)<0.75
        ch=ridge&((np.abs(np.abs(u)-(hl-2))<0.75) | ((ty==2)&(np.mod(u+100,10)<0.9)))
        if ty in(1,2,9): BF.ravel()[cells[ch]]|=8
    BH.ravel()[cells]=min(wallh,60); RF.ravel()[cells]=rf; WM.ravel()[cells]=T[wm]; RM.ravel()[cells]=T[rm]; BTL.ravel()[cells]=ty
    # door(s): edge cells closest to a road / path, facing out
    ec=cells[edge.ravel()[cells]&(corner.ravel()[cells]==1)]
    if len(ec) and ty!=8:
        dd=dist_acc.ravel()[ec]; o=np.argsort(dd)
        ndoor=1 if ty in(1,9) else max(1,int(len(ec)/40)) if ty==2 else 1+int(len(ec)>80)
        chosen=[]
        for j in o:
            c_=ec[j]; zc_,xc_=divmod(int(c_),NX)
            if all(abs(zc_-a)+abs(xc_-b)>8 for a,b in chosen): chosen.append((zc_,xc_))
            if len(chosen)>=ndoor: break
        for zc_,xc_ in chosen: BF[zc_,xc_]|=4|(int(outdir[zc_,xc_])<<4)
    stats[ty]=stats.get(ty,0)+1
h=hf.reshape(NZ,NX)
BF[edge&(BID>0)]|=1
# window columns along walls: 2 on / 1 off, not at corners
win=np.zeros((NZ,NX),bool)
xs_=np.arange(NX)[None,:].repeat(NZ,0); zs_=np.arange(NZ)[:,None].repeat(NX,1)
alongx=(outdir==2)|(outdir==3); alongz=(outdir==0)|(outdir==1)
win|=edge&alongx&(xs_%3!=0)&(corner==1); win|=edge&alongz&(zs_%3!=0)&(corner==1)
BF[win]|=2
BF[(BID>0)&~edge&(BTL!=8)]|=64     # hollow ground floor inside
print('buildings',len(bl),stats)
# ---- water levels ----
WL=np.zeros((NZ,NX),np.int16)
wat=S==6
lab,nl=ndi.label(wat)
land=~wat
for i,sl in enumerate(ndi.find_objects(lab),1):
    m=lab[sl]==i; ring=ndi.binary_dilation(m,iterations=2)&~m
    vals=h[sl][ring&land[sl]]
    lvl=int(np.percentile(vals,10)) if len(vals) else int(np.median(h[sl][m]))
    lvl-=1
    WL[sl][m]=lvl; dd=ndi.distance_transform_cdt(m,metric='taxicab'); hh=h[sl]; hh[m]=lvl-np.minimum(1+dd[m]//2,4)
# bridges: deck at the road height either side
if BR.any():
    deck=ndi.maximum_filter(np.where(~wat,h,0),size=25)
    h=np.where(BR&wat,np.maximum(deck,WL+3),h); S[BR&wat]|=0x80
# ---- points: trees, lamps, bus stops ----
trees=[]
for p in d['pts']:
    t=p['tags']; x,z=xy(p['lat'],p['lon'])
    if not(0<=x<NX and 0<=z<NZ): continue
    if t.get('natural')=='tree': trees+= [int(x),int(z)]
stops=[]
for p in d['pts']:
    t=p['tags']; x,z=xy(p['lat'],p['lon'])
    if 0<=x<NX and 0<=z<NZ and t.get('highway')=='bus_stop':
        rd,dd=road_dir(x,z)
        if rd: stops+= [int(x),int(z),int(round(math.degrees(math.atan2(rd[1],rd[0]))))%360]
lamps=[]
for hw,wd,g,t in roads:
    if hw in('rail','motorway','trunk','service') : continue
    pts=R(g); acc=0; side=1
    for (ax,az),(bx,bz) in zip(pts,pts[1:]):
        L=math.hypot(bx-ax,bz-az) or 1; nx,nz=-(bz-az)/L,(bx-ax)/L; k=(28-acc%28)
        while k<L:
            x=ax+(bx-ax)*k/L+nx*side*(wd/2+3); z=az+(bz-az)*k/L+nz*side*(wd/2+3); xi,zi=int(x),int(z)
            if 0<=xi<NX and 0<=zi<NZ and S[zi,xi] in (20,21,1) and BID[zi,xi]==0: lamps+=[xi,zi]
            side=-side; k+=28
        acc+=L
places=[]
for p in d['pts']:
    t=p['tags']
    if t.get('place') in('village','town','suburb','hamlet','neighbourhood','locality') and t.get('name'):
        x,z=xy(p['lat'],p['lon'])
        if 0<=x<NX and 0<=z<NZ: places.append([t['name'],int(x),int(z)])
for t,o,i,wid in areas:
    nm=t.get('name')
    if nm and (t.get('leisure') or t.get('landuse') in('cemetery',) or t.get('historic') or t.get('amenity') in('school',)):
        g=R(max(o,key=len)); cx=sum(a for a,b in g)/len(g); cz=sum(b for a,b in g)/len(g)
        if 0<=cx<NX and 0<=cz<NZ: places.append([nm,int(cx),int(cz)])
print('trees',len(trees)//2,'stops',len(stops)//3,'lamps',len(lamps)//2,'places',len(places))
hdr={'NX':NX,'NZ':NZ,'cell':1,'baseY':BASEY,'bbox':[LAT1,LON0,LAT0,LON1],'layers':['h','wl','s','m','bt','bh','rf','wm','rm','bf','bar'],
     'trees':trees,'stops':stops,'lamps':lamps,'places':places,
     'attribution':'Map data (c) OpenStreetMap contributors (ODbL). Elevation: AWS Terrain Tiles (SRTM, EU-DEM/Copernicus, OS Terrain 50 and others).'}
hj=json.dumps(hdr).encode()
lays=[h.clip(0,255),WL.clip(0,255),S,MARK,BTL,BH,RF,WM,RM,BF,BAR]
raw=struct.pack('<I',len(hj))+hj+b''.join(a.astype(np.uint8).tobytes() for a in lays)
out='/workspace/game/site/world/dalmuir1m.bin.gz'
open(out,'wb').write(gzip.compress(raw,9))
import os; print('raw MB',len(raw)/1e6,'gz MB',os.path.getsize(out)/1e6)
pal=np.zeros((256,3),np.uint8)
for k,c in {0:(110,160,80),1:(90,180,90),3:(60,60,64),4:(200,190,160),6:(60,120,200),7:(30,100,40),8:(120,200,110),9:(230,210,150),10:(130,150,120),11:(80,80,80),12:(120,100,90),13:(100,200,100),14:(170,190,110),16:(150,150,140),18:(200,60,60),19:(220,120,40),20:(170,170,165),21:(120,170,100),22:(180,170,150),23:(150,230,140),24:(130,140,60),25:(100,130,70),26:(150,120,80),27:(220,220,220)}.items(): pal[k]=c
img=pal[S&0x7f].copy(); img[BH>0]=(170,90,70); img[(BF&2)>0]=(120,180,220); img[(BF&4)>0]=(255,255,0); img[MARK>0]=(255,255,255); img[BAR>0]=(255,0,255)
Image.fromarray(img).save('/workspace/clyde/preview1m.png')
