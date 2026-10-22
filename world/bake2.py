# Glencraft v0.9.39 Clydebank 2x bake: Dalmuir, Mountblow, Duntocher + Clyde Shopping Centre at 2 blocks per metre.
# Map data (c) OpenStreetMap contributors, ODbL. Elevation: AWS Terrain Tiles.
import json, math, zlib, struct, numpy as np, os
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
SC=2.0
LAT0,LAT1=55.9300,55.8990; LON0,LON1=-4.4425,-4.3970
REGION=[(55.9298,-4.4330),(55.9298,-4.4075),(55.9200,-4.4075),(55.9188,-4.4195),(55.9150,-4.4195),(55.9100,-4.4115),(55.9075,-4.3995),(55.8993,-4.3973),(55.8993,-4.4095),(55.9045,-4.4230),(55.9068,-4.4422),(55.9235,-4.4422),(55.9262,-4.4365)]
lat_c=(LAT0+LAT1)/2; mlon=111320*math.cos(math.radians(lat_c)); mlat=111200
NX=int(round((LON1-LON0)*mlon*SC)); NZ=int(round((LAT0-LAT1)*mlat*SC))
NX=(NX+63)//64*64; NZ=(NZ+63)//64*64
print('grid',NX,NZ,flush=True)
def xy(lat,lon): return ((lon-LON0)*mlon*SC, (LAT0-lat)*mlat*SC)
d=json.load(open('/workspace/clyde/osm_clyde.json')); ways=d['ways']; rels=d['rels']
def R(g): return [xy(a,b) for a,b in g]
def newimg(): return Image.new('L',(NX,NZ),0)
reg_img=newimg(); ImageDraw.Draw(reg_img).polygon(R(REGION),fill=1); REG=np.asarray(reg_img)>0
reg_in=lambda x,z: 0<=int(x)<NX and 0<=int(z)<NZ and REG[int(z),int(x)]
# ---- DEM ----
M=np.clip(np.load('/workspace/clyde/dem.npy'),0,400)
lat=LAT0-(np.arange(NZ)+0.5)/(mlat*SC); lon=LON0+(np.arange(NX)+0.5)/(mlon*SC)
n=2**15; px=((lon+180)/360*n-15978)*256; py=((1-np.arcsinh(np.tan(np.radians(lat)))/math.pi)/2*n-10213)*256
x0=np.floor(px).astype(int); y0=np.floor(py).astype(int); fx=(px-x0)[None,:]; fy=(py-y0)[:,None]
elev=(M[y0[:,None],x0[None,:]]*(1-fx)*(1-fy)+M[y0[:,None],x0[None,:]+1]*fx*(1-fy)+M[y0[:,None]+1,x0[None,:]]*(1-fx)*fy+M[y0[:,None]+1,x0[None,:]+1]*fx*fy).astype(np.float32)
elev=ndi.gaussian_filter(elev,2.0*SC)
BASEY=14
# 2 blocks per metre up to 60 m above sea level, 1 block per metre above that (keeps the hills under the build limit)
ev=np.where(elev<60,elev*SC,60*SC+(elev-60))
h=(BASEY+np.round(ev)).astype(np.int16); del ev
print('elev',float(elev[REG].min()),float(elev[REG].max()),'h',int(h[REG].max()),flush=True)
def mask_poly(rings_out,rings_in=()):
    m=newimg(); dr=ImageDraw.Draw(m)
    for r in rings_out:
        if len(r)>2: dr.polygon(R(r),fill=1)
    for r in rings_in:
        if len(r)>2: dr.polygon(R(r),fill=0)
    return np.asarray(m)>0
def draw_line(dr,g,w,fill=1):
    dr.line(R(g),fill=fill,width=max(1,int(round(w))),joint='curve')
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
    return any(-100<=x<NX+100 and -100<=z<NZ+100 for x,z in R(g))
areas=[]
for wid,w in ways.items():
    g=w['geom']
    if len(g)>3 and g[0]==g[-1] and inbox(g): areas.append((w['tags'],[g],[],wid))
for r in rels:
    if r['tags'].get('type') in('multipolygon','building'):
        o=join([ways[str(m[1])]['geom'] for m in r['members'] if m[0]=='w' and str(m[1]) in ways and m[2]!='inner'])
        i=join([ways[str(m[1])]['geom'] for m in r['members'] if m[0]=='w' and str(m[1]) in ways and m[2]=='inner'])
        if o and any(inbox(x) for x in o): areas.append((r['tags'],o,i,'r'))
S=np.zeros((NZ,NX),np.uint8)
def cls(t):
    lu=t.get('landuse');le=t.get('leisure');na=t.get('natural');am=t.get('amenity');gf=t.get('golf')
    if gf=='bunker': return 9,90
    if gf in('green','tee'): return 23,89
    if gf in('fairway',): return 8,88
    if gf=='rough': return 25,87
    if na=='water' or t.get('waterway')=='riverbank' or lu in('reservoir','basin') or t.get('water'): return 6,95
    if t.get('railway')=='platform' or t.get('public_transport')=='platform' and t.get('railway'): return 20,93
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
    return None
lay=[]
for t,o,i,wid in areas:
    if 'building' in t: continue
    c=cls(t)
    if c: lay.append((c[1],c[0],o,i,t))
lay.sort(key=lambda a:a[0])
for pr,c,o,i,t in lay: S[mask_poly(o,i)]=c
print('landuse',flush=True)
wimg=newimg(); wd_=ImageDraw.Draw(wimg)
for wid,w in ways.items():
    t=w['tags'];ww=t.get('waterway');g=w['geom']
    if not ww or len(g)<2 or not inbox(g) or t.get('tunnel') or t.get('layer','0').startswith('-'): continue
    wd={'river':12,'canal':14,'stream':3,'ditch':1.5,'drain':1.5}.get(ww,0)
    if wd: draw_line(wd_,g,wd*SC)
S[(np.asarray(wimg)>0)&(S!=6)]=6; del wimg
# ---- roads ----
RW={'motorway':14,'trunk':14,'primary':9,'secondary':8,'tertiary':7,'unclassified':6,'residential':6,'living_street':5,'service':3.5,'motorway_link':6,'trunk_link':6,'primary_link':6,'secondary_link':6,'tertiary_link':6,'pedestrian':5,'footway':2,'path':1.5,'cycleway':2,'steps':2,'track':3,'bridleway':2}
MARK=np.zeros((NZ,NX),np.uint8)
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
I={k:newimg() for k in('car','kerb','pave','br','rail','sleep')}; DR={k:ImageDraw.Draw(v) for k,v in I.items()}
for hw,wd,g,t in roads:
    if hw=='rail':
        DR['rail'].line(R(g),fill=1,width=int(4*SC)); continue
    urban= hw not in('motorway','trunk','motorway_link','trunk_link','track') and t.get('sidewalk','both')!='no' and hw!='service'
    if urban: draw_line(DR['pave'],g,(wd+2+4)*SC)
    if hw!='service': draw_line(DR['kerb'],g,(wd+0.6)*SC)
    draw_line(DR['car'],g,wd*SC)
    if t.get('bridge') not in(None,'no'): draw_line(DR['br'],g,wd*SC)
A={k:np.asarray(v)>0 for k,v in I.items()}; del I,DR
car=A['car']; kerb=A['kerb']&~car; pave=A['pave']&~(car|kerb); BR=A['br']; rail=A['rail']
S[rail&(S!=6)]=12
fimg=newimg(); fd=ImageDraw.Draw(fimg); timg=newimg(); td=ImageDraw.Draw(timg)
for hw,wd,g,t in footways:
    draw_line(td if hw=='track' else fd,g,wd*SC)
    if t.get('bridge') not in(None,'no'): BRi=Image.fromarray(BR.astype(np.uint8)); draw_line(ImageDraw.Draw(BRi),g,wd*SC); BR=np.asarray(BRi)>0
fm=np.asarray(fimg)>0; tm=np.asarray(timg)>0; del fimg,timg
S[(fm&~car&(S!=6))|(fm&BR)]=4; S[tm&~car&(S!=6)]=26
S[pave&(S!=6)]=20; S[kerb&(S!=6)]=27; S[car&((S!=6)|BR)]=3
print('roads',flush=True)
def dashes(g,period,on):
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
        for x,z in dashes(g,9*SC,3*SC):
            for ox in (0,):
                xi,zi=int(x),int(z)
                if 0<=xi<NX and 0<=zi<NZ and car[zi,xi]: MARK[zi,xi]=1
roadsegs=[]
for hw,wd,g,t in roads:
    if hw!='rail':
        p=R(g)
        for a,b in zip(p,p[1:]): roadsegs.append((a,b,wd*SC))
segarr=np.array([(a[0],a[1],b[0],b[1],w) for a,b,w in roadsegs]) if roadsegs else np.zeros((0,5))
def road_dir(x,z):
    if not len(segarr): return None,1e9
    ax,az,bx,bz,w=segarr.T; vx,vz=bx-ax,bz-az; L2=vx*vx+vz*vz+1e-9
    u=np.clip(((x-ax)*vx+(z-az)*vz)/L2,0,1); dd=np.hypot(ax+u*vx-x,az+u*vz-z); k=int(np.argmin(dd)); L=math.sqrt(L2[k])
    return (vx[k]/L,vz[k]/L,w[k]),dd[k]
for p in d['pts']:
    t=p['tags']
    if t.get('highway')=='crossing' and t.get('crossing')!='unmarked':
        x,z=xy(p['lat'],p['lon'])
        if not reg_in(x,z): continue
        rd,dd=road_dir(x,z)
        if not rd or dd>6*SC: continue
        vx,vz,wd=rd
        for a in np.arange(-2*SC,2*SC+0.01,0.5):
            for b in np.arange(-wd/2-SC,wd/2+SC,0.5):
                cx=x+vx*a-vz*b; cz=z+vz*a+vx*b; xi,zi=int(cx),int(cz)
                if 0<=xi<NX and 0<=zi<NZ and car[zi,xi]: MARK[zi,xi]=2 if int(math.floor(b/(0.5*SC)+100))%2==0 else 3
# ---- barriers ----
BAR=np.zeros((NZ,NX),np.uint8)
BT_={'wall':6,'fence':2,'wire_fence':2,'chain_link':2,'hedge':3,'retaining_wall':4,'guard_rail':5,'railing':5,'city_wall':1}
for code in sorted(set(BT_.values())):
    bimg_=newimg(); bd_=ImageDraw.Draw(bimg_); hit=False
    for wid,w in ways.items():
        b=w['tags'].get('barrier'); g=w['geom']
        if BT_.get(b)==code and len(g)>1 and inbox(g): draw_line(bd_,g,1 if b!='hedge' else 1.5*SC); hit=True
    if hit: BAR[(np.asarray(bimg_)>0)&~car]=code
# low brick walls round the tower car parks (as in the photos): parking areas within 60 m of a tower
# ---- buildings ----
COURTS={'Overtoun Court','Ellinger Court','Dunswin Court','Dalmuir Court','Crescent Court','Burnside Court'}
bl=[]
for t,o,i,wid in areas:
    if 'building' not in t or t.get('building')=='no' or t.get('location')=='underground': continue
    g=max(o,key=len); p=R(g); cx=sum(a for a,b in p)/len(p); cz=sum(b for a,b in p)/len(p)
    if not reg_in(cx,cz): continue
    bl.append((t,o,i,wid,cx,cz))
bimg=Image.new('I',(NX,NZ),0); bd=ImageDraw.Draw(bimg)
for bi,(t,o,i,wid,cx,cz) in enumerate(bl):
    for r in o:
        if len(r)>2: bd.polygon(R(r),fill=bi+1)
    for r in i:
        if len(r)>2: bd.polygon(R(r),fill=0)
BID=np.asarray(bimg).astype(np.int32); del bimg
BID[~REG]=0
landat=S.copy()
T={'RSAND':150,'HARL':151,'SLATE':152,'RTILE':153,'ASPHALT':154,'PAVE':155,'WSTONE':156,'CONCRETE':157,'STONEBRICK':28,'BRICK':78,'PLANKS':10,'SANDSTONE':77,'COBBLE':12,'IRON':74,'GLASS':63,'ORANGE':73,'YELLOW':72,'DSBRICK':228}
COL={'white':'HARL','cream':'WSTONE','beige':'SANDSTONE','yellow':'SANDSTONE','red':'RSAND','brown':'BRICK','grey':'CONCRETE','gray':'CONCRETE','darkgrey':'STONEBRICK'}
def btype(t,area_m,lu):
    b=t.get('building','yes'); a=t.get('amenity','')
    if t.get('name') in COURTS: return 11
    try:
        if float(t.get('building:levels','0').split(';')[0])>=12: return 11
    except: pass
    if b in('church','chapel','cathedral') or a=='place_of_worship': return 6
    if b in('school','college','civic','public','hospital','fire_station','townhall','sports_centre','train_station','community_centre') or a in('school','library','police','community_centre','townhall'): return 7
    if b in('garage','garages','shed','hut','roof','carport','greenhouse','kiosk','cabin','bandstand') : return 8
    if t.get('parking')=='multi-storey': return 5
    if b in('retail','supermarket','commercial','office') or t.get('shop') or lu==22: return 4
    if b in('industrial','warehouse','factory','service','storage_tank'): return 5
    if b in('apartments','flats','residential'):
        try:
            if float(t.get('building:levels','0'))>=6: return 3
        except: pass
        return 2
    if b in('detached','bungalow'): return 9
    if b in('house','semidetached_house','terrace'): return 1
    if area_m<30: return 8
    if lu==16: return 5
    if lu==22: return 4
    if area_m>300: return 2 if lu==21 else 4
    return 1
WM=np.zeros((NZ,NX),np.uint8); BH=np.zeros((NZ,NX),np.uint8); RF=np.zeros((NZ,NX),np.uint8); BTL=np.zeros((NZ,NX),np.uint8); BF=np.zeros((NZ,NX),np.uint8); RM=np.zeros((NZ,NX),np.uint8)
ids=BID.ravel(); order=np.argsort(ids,kind='stable'); sid=ids[order]; starts=np.searchsorted(sid,np.arange(len(bl)+2)); del sid
hf=h.ravel(); lf=landat.ravel(); stats={}
access=np.isin(S,[3,4,20,27,11,26])
dist_acc=ndi.distance_transform_cdt(~access,metric='chessboard').astype(np.int16); del access
edge=np.zeros((NZ,NX),bool); outdir=np.full((NZ,NX),255,np.uint8); corner=np.zeros((NZ,NX),np.uint8)
for k,(dx,dz) in enumerate(((1,0),(-1,0),(0,1),(0,-1))):
    e=(BID>0)&(np.roll(BID,(-dz,-dx),(0,1))!=BID); edge|=e; outdir[e&(outdir==255)]=k; corner+=e.astype(np.uint8)
print('buildings prep',len(bl),flush=True)
lu_dsplay=None
towers=[]
for bi in range(1,len(bl)+1):
    cells=order[starts[bi]:starts[bi+1]]
    if len(cells)==0: continue
    t=bl[bi-1][0]; area=len(cells); area_m=area/(SC*SC)
    lu=np.bincount(lf[cells]).argmax(); ty=btype(t,area_m,lu)
    try: lv=float(t.get('building:levels','').split(';')[0])
    except: lv=None
    try: hm=float(t.get('height','').replace('m',''))
    except: hm=None
    if ty==11: lv=15; hm=44.0
    if lv is None: lv={1:2,2:4,3:10,4:2,5:2,6:3,7:2,8:1,9:2,10:3}[ty]
    if ty==2 and t.get('building:levels') is None and area_m<250: lv=3
    wallh=int(round(hm*SC)) if hm else int(round(lv*3*SC))
    if ty in(4,5): wallh=max(wallh,int(5*SC))
    if ty==8: wallh=int(3*SC)
    base=int(np.median(hf[cells])); hf[cells]=base
    hsh=(bi*2654435761)&0xffffffff
    wm={1:'HARL',2:'RSAND',3:'CONCRETE',4:'CONCRETE',5:'CONCRETE',6:'STONEBRICK',7:'BRICK',8:'PLANKS',9:'BRICK',10:'STONEBRICK',11:'CONCRETE'}[ty]
    if ty==1 and hsh%5==0: wm='BRICK'
    if ty==2 and hsh%3==0: wm='SANDSTONE'
    if ty==4 and (hsh%3==0 or area_m<250): wm='BRICK'   # red-brick shop parades
    if ty==8 and hsh%2==0: wm='CONCRETE'
    if ty==3: wm='HARL'
    c=(t.get('building:colour') or '').lower()
    if c in COL: wm=COL[c]
    if t.get('building:material')=='glass': wm='GLASS'
    shape=t.get('roof:shape') or ({1:'gabled',2:'gabled',6:'gabled',9:'hipped',10:'gabled'}.get(ty,'flat'))
    if ty==1 and hsh%3==0 and shape=='gabled': shape='hipped'
    rm='SLATE' if ty in(1,2,6,10) else 'RTILE' if ty==9 else 'ASPHALT'
    if ty==1 and hsh%7==0: rm='RTILE'
    rc=(t.get('roof:colour') or '').lower()
    if rc in('red','orange','brown'): rm='RTILE'
    if shape=='flat' and ty in(4,5,3,7,11): rm='CONCRETE' if hsh%2 else 'ASPHALT'
    zc,xc=np.divmod(cells,NX)
    rf=np.zeros(len(cells),np.int16)
    if shape!='flat' and area>=12*SC*SC and ty!=11:
        X=np.stack([xc-xc.mean(),zc-zc.mean()],1).astype(np.float64)
        cov=X.T@X/len(X); ev_,evec=np.linalg.eigh(cov); maj=evec[:,1]; mnr=evec[:,0]
        u=X@maj; v=X@mnr; hw=np.abs(v).max()+0.5; hl=np.abs(u).max()+0.5
        pitch=0.8 if ty!=2 else 0.65
        r1=np.floor((hw-np.abs(v))*pitch)+1
        if shape in('hipped','pyramidal'): r1=np.minimum(r1,np.floor((hl-np.abs(u))*pitch)+1)
        rf=np.clip(r1,1,28).astype(np.int16)
        ridge=np.abs(v)<0.75
        ch=ridge&((np.abs(np.abs(u)-(hl-2*SC))<0.75) | ((ty==2)&(np.mod(u+100,10*SC)<0.9)))
        if ty in(1,2,9): BF.ravel()[cells[ch]]|=8
    BH.ravel()[cells]=min(wallh,250); RF.ravel()[cells]=np.minimum(rf,99); WM.ravel()[cells]=T[wm]; RM.ravel()[cells]=T[rm]; BTL.ravel()[cells]=ty
    if ty==11: towers.append((bi,cells,hsh,t.get('name','')))
    ec=cells[edge.ravel()[cells]&(corner.ravel()[cells]==1)]
    if len(ec) and ty not in(8,11):
        dd=dist_acc.ravel()[ec]; o=np.argsort(dd)
        ndoor=1 if ty in(1,9) else max(1,int(len(ec)/(40*SC))) if ty==2 else 1+int(len(ec)>80*SC)
        chosen=[]
        for j in o:
            c_=ec[j]; zc_,xc_=divmod(int(c_),NX)
            if all(abs(zc_-a)+abs(xc_-b)>8*SC for a,b in chosen): chosen.append((zc_,xc_))
            if len(chosen)>=ndoor: break
        for zc_,xc_ in chosen: BF[zc_,xc_]|=4|(int(outdir[zc_,xc_])<<4)
    stats[ty]=stats.get(ty,0)+1
del order,starts
h=hf.reshape(NZ,NX)
BF[edge&(BID>0)]|=1
xs_=np.arange(NX,dtype=np.int32)[None,:]; zs_=np.arange(NZ,dtype=np.int32)[:,None]
alongx=(outdir==2)|(outdir==3); alongz=(outdir==0)|(outdir==1)
win=(edge&alongx&np.isin(xs_%5,(1,2,3))&(corner==1))|(edge&alongz&np.isin(zs_%5,(1,2,3))&(corner==1))
BF[win]|=2; del win
BF[(BID>0)&~edge&(BTL!=8)]|=64
# ---- the six Dalmuir / Mountblow 15-storey Wimpey towers ----
# RF = 100 + distance from the outer wall (1 = facade). Ground storey: recessed dark base behind pilotis,
# glazed entrance lobby facing the nearest road. Facades: grey concrete panels, a full-height glazed stair core
# in the middle of one long face, columns of yellow/orange balcony panels, one end wall in red-brown brick;
# dark plant room and railing on the roof.
for bi,cells,hsh,name in towers:
    zc,xc=np.divmod(cells,NX); z0,z1,x0,x1=zc.min()-2,zc.max()+3,xc.min()-2,xc.max()+3
    sub=BID[z0:z1,x0:x1]==bi
    dist=ndi.distance_transform_cdt(sub,metric='chessboard')
    dd=dist[zc-z0,xc-x0]; RF.ravel()[cells]=100+np.minimum(dd,99)
    X=np.stack([xc-xc.mean(),zc-zc.mean()],1).astype(np.float64); cov=X.T@X/len(X); ev_,evec=np.linalg.eigh(cov); maj=evec[:,1]
    u=X@maj; v=X@evec[:,0]
    fac=dd==1
    W_=WM.ravel(); cc=cells[fac]; uu=u[fac]; vv=v[fac]
    hl=np.abs(u).max(); hw=np.abs(v).max()
    longface=np.abs(vv)>hw-1.5; endface=~longface
    side=1 if hsh&1 else -1
    W_[cc]=T['CONCRETE']
    # red-brown brick on one end wall
    W_[cc[endface&(uu*side>0)]]=T['BRICK']
    # balcony panel columns: two bays either side of the core on each long face
    bay=np.mod(np.round(uu)+1000,int(6*SC))
    W_[cc[longface&(bay<2*SC)&(np.abs(uu)>4*SC)]]=T['ORANGE' if hsh&2 else 'YELLOW']
    # glazed stair core in the middle of the long face on the 'side' side
    W_[cc[longface&(np.abs(uu)<1.6*SC)&(vv*side>0)]]=T['GLASS']
    # entrance: the facade cell nearest a road, moved 3 cells in (behind the pilotis)
    dacc=dist_acc.ravel()[cc]; j=int(np.argmin(dacc)); ez,ex=divmod(int(cc[j]),NX); od=int(outdir[ez,ex])
    ddx,ddz=((1,0),(-1,0),(0,1),(0,-1))[od]
    dz_,dx_=ez-3*ddz,ex-3*ddx
    if BID[dz_,dx_]==bi: BF[dz_,dx_]|=4|(od<<4)
    near=(np.abs(zc-dz_)+np.abs(xc-dx_)<=5*SC)&(dd<=4)
    BF.ravel()[cells[near]]|=128
print('buildings',len(bl),stats,'towers',[t[3] for t in towers],flush=True)
del edge,outdir,corner,BID
# ---- water ----
WL=np.zeros((NZ,NX),np.int16)
wat=S==6
lab,nl=ndi.label(wat)
for i,sl in enumerate(ndi.find_objects(lab),1):
    m=lab[sl]==i; ring=ndi.binary_dilation(m,iterations=int(2*SC))&~m
    vals=h[sl][ring&~wat[sl]]
    lvl=int(np.percentile(vals,10)) if len(vals) else int(np.median(h[sl][m]))
    lvl-=1
    WL[sl][m]=lvl; dd=ndi.distance_transform_cdt(m,metric='taxicab'); hh=h[sl]; hh[m]=lvl-np.minimum(1+dd[m]//2,int(2*SC))
del lab
if BR.any():
    deck=ndi.maximum_filter(np.where(~wat,h,0),size=int(25*SC))
    h=np.where(BR&wat,np.maximum(deck,WL+3),h); S[BR&wat]|=0x80; del deck
# ---- outside the region: plain grass, nothing built ----
out=~REG
S[out]=0; MARK[out]=0; BAR[out]=0; WM[out]=0; BH[out]=0; RF[out]=0; BTL[out]=0; BF[out]=0; RM[out]=0; WL[out]=0
h[out]=np.maximum(h[out],BASEY+2)
S[out&(ndi.binary_dilation(REG,iterations=1))]=28   # boundary marker
# ---- points ----
trees=[]
for p in d['pts']:
    t=p['tags']; x,z=xy(p['lat'],p['lon'])
    if reg_in(x,z) and t.get('natural')=='tree': trees+=[int(x),int(z)]
stops=[]
for p in d['pts']:
    t=p['tags']; x,z=xy(p['lat'],p['lon'])
    if reg_in(x,z) and t.get('highway')=='bus_stop':
        rd,dd=road_dir(x,z)
        if rd: stops+=[int(x),int(z),int(round(math.degrees(math.atan2(rd[1],rd[0]))))%360]
lamps=[]
for hw,wd,g,t in roads:
    if hw in('rail','motorway','trunk','service'): continue
    pts=R(g); acc=0; side=1; sp=28*SC
    for (ax,az),(bx,bz) in zip(pts,pts[1:]):
        L=math.hypot(bx-ax,bz-az) or 1; nx,nz=-(bz-az)/L,(bx-ax)/L; k=(sp-acc%sp)
        while k<L:
            x=ax+(bx-ax)*k/L+nx*side*(wd*SC/2+2.5*SC); z=az+(bz-az)*k/L+nz*side*(wd*SC/2+2.5*SC); xi,zi=int(x),int(z)
            if reg_in(xi,zi) and S[zi,xi] in (20,21,1) and BH[zi,xi]==0: lamps+=[xi,zi]
            side=-side; k+=sp
        acc+=L
places=[]
for p in d['pts']:
    t=p['tags']
    if t.get('place') in('village','town','suburb','hamlet','neighbourhood','locality') and t.get('name'):
        x,z=xy(p['lat'],p['lon'])
        if reg_in(x,z): places.append([t['name'],int(x),int(z)])
for t,o,i,wid in areas:
    nm=t.get('name')
    if nm and (t.get('leisure') or t.get('landuse') in('cemetery','retail') or t.get('historic') or t.get('amenity') in('school',) or nm in COURTS or t.get('railway')=='station' or t.get('shop')=='mall'):
        g=R(max(o,key=len)); cx=sum(a for a,b in g)/len(g); cz=sum(b for a,b in g)/len(g)
        if reg_in(cx,cz): places.append([nm,int(cx),int(cz)])
for p in d['pts']:
    t=p['tags']
    if t.get('railway')=='station' and t.get('name'):
        x,z=xy(p['lat'],p['lon'])
        if reg_in(x,z): places.append([t['name']+' station',int(x),int(z)])
cx,cz=xy(55.9025,-4.4040)
places.append(['Clyde Shopping Centre',int(cx),int(cz)])
print('trees',len(trees)//2,'stops',len(stops)//3,'lamps',len(lamps)//2,'places',places,flush=True)
# ---- tiles: 64x64, 11 layers each, raw deflate ----
TS=64; NTX=NX//TS; NTZ=NZ//TS
lays=[np.clip(h,0,255).astype(np.uint8),np.clip(WL,0,255).astype(np.uint8),S,MARK,BTL,BH,RF,WM,RM,BF,BAR]
names=['h','wl','s','m','bt','bh','rf','wm','rm','bf','bar']
chunks=[]; offs=[]; o=0
for tz in range(NTZ):
    for tx in range(NTX):
        blob=b''.join(np.ascontiguousarray(a[tz*TS:(tz+1)*TS,tx*TS:(tx+1)*TS]).tobytes() for a in lays)
        co=zlib.compressobj(9,zlib.DEFLATED,-15); c=co.compress(blob)+co.flush()
        offs.append(o); chunks.append(c); o+=len(c)
offs.append(o)
hdr={'NX':NX,'NZ':NZ,'TS':TS,'NTX':NTX,'NTZ':NTZ,'cell':1/SC,'scale':SC,'baseY':BASEY,'bbox':[LAT1,LON0,LAT0,LON1],'layers':names,'trees':trees,'stops':stops,'lamps':lamps,'places':places,
     'attribution':'Map data (c) OpenStreetMap contributors (ODbL). Elevation: AWS Terrain Tiles.'}
hj=json.dumps(hdr).encode()
raw=struct.pack('<I',len(hj))+hj+np.array(offs,np.uint32).tobytes()+b''.join(chunks)
outp='/workspace/game/site/world/clydebank2x.bin'
open(outp,'wb').write(raw); print('MB',len(raw)/1e6)
pal=np.zeros((256,3),np.uint8)
for k,c in {0:(110,160,80),1:(90,180,90),3:(60,60,64),4:(200,190,160),6:(60,120,200),7:(30,100,40),8:(120,200,110),10:(130,150,120),11:(80,80,80),12:(120,100,90),13:(100,200,100),16:(150,150,140),20:(170,170,165),21:(120,170,100),22:(180,170,150),26:(150,120,80),27:(220,220,220),28:(255,0,0)}.items(): pal[k]=c
img=pal[S&0x7f]; img[BH>0]=(170,90,70); img[BTL==11]=(255,0,255); img[MARK>0]=(255,255,255)
Image.fromarray(img[::4,::4]).save('/workspace/clyde2/preview.png')
