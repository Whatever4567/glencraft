import osmium, json, sys
S,W,N,E=55.885,-4.47,55.945,-4.37
nodes={}; ways={}; rels=[]; pts=[]
class NH(osmium.SimpleHandler):
    def node(self,n):
        if not n.location.valid(): return
        la,lo=n.location.lat,n.location.lon
        if S<=la<=N and W<=lo<=E:
            nodes[n.id]=(round(la,7),round(lo,7))
            if len(n.tags):
                t={k:v for k,v in n.tags}
                if any(k in t for k in ('natural','place','historic','amenity','shop','name','barrier','highway','leisure','tourism')): pts.append({'lat':la,'lon':lo,'tags':t})
class RH(osmium.SimpleHandler):
    def relation(self,r):
        t={k:v for k,v in r.tags}
        if t.get('type') in ('multipolygon','route','building') or 'building' in t:
            rels.append({'id':r.id,'tags':t,'members':[(m.type,m.ref,m.role) for m in r.members]})
need=set()
class WH(osmium.SimpleHandler):
    def way(self,w):
        refs=[n.ref for n in w.nodes]
        if any(r in nodes for r in refs) or w.id in need:
            ways[w.id]={'tags':{k:v for k,v in w.tags},'refs':refs}
f=sys.argv[1]
NH().apply_file(f); print('nodes',len(nodes),'pts',len(pts),flush=True)
RH().apply_file(f)
# keep relations whose way members we will see
WH().apply_file(f); print('ways',len(ways),flush=True)
keep=[r for r in rels if any(m[0]=='w' and m[1] in ways for m in r['members'])]
for w in ways.values(): w['geom']=[nodes[r] for r in w['refs'] if r in nodes]; del w['refs']
json.dump({'ways':ways,'rels':keep,'pts':pts},open('osm_clyde.json','w'))
print('rels',len(keep))
