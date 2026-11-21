import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
T=4;I=93;C=2;Q=45.5;S=45;F=10;PT=0.5;P=I+T;GAP=12;B=T+GAP;H=T/2
R=50.5            # border width (outer face of ring to platform outer face)
W=5*P+T+B; D=3*P+T          # platform 505 x 295
# ---- main platform cells
blocks=[(0,[(i,j) for i in range(3) for j in range(3)]),(B,[(i,j) for i in (3,4) for j in range(3)])]
cells=[(i,j,b) for b,cl in blocks for i,j in cl]
# ---- centreline grid
yb=2-R; yt=D-2+R                          # ring tube centres  (-48.5 , 343.5)
xl0=2-R; xr1=W-2+R                        # (-48.5 , 553.5)
L=[2+97*i for i in range(4)]              # left platform verticals  2,99,196,293
Rr=[18+97*k+291-3*97+97*0 for k in range(0)]
RV=[307+97*k+2 for k in range(3)]         # right platform verticals 309,406,503
halfL=[]         # 50.5,147.5,244.5
halfR=[]       # 357.5,454.5
rows=[2,99,196,293]         # side-border rows 2..293
prow=[2,99,196,293]
vthru=[xl0]+L+RV+[xr1]                    # continuous verticals, full height
pieces=[]   # (kind,x0,y0,w,h)  face coordinates ; kind 'v','h','b'(bridge),'s'(stub)
for x in vthru: pieces.append(('v',x-H,yb-H,T,yt-yb+T))
for x in halfL+halfR:
    pieces.append(('s',x-H,yb+H,T,(2-yb)-T)); pieces.append(('s',x-H,D-2+H,T,(yt-(D-2))-T))
def hrow(y,xa,xb,kind='h'): pieces.append((kind,xa+H,y-H,xb-xa-T,T))
# platform rows
for y in prow:
    for a,b in zip(L[:-1],L[1:]): hrow(y,a,b)
    for a,b in zip(RV[:-1],RV[1:]): hrow(y,a,b)
    hrow(y,L[-1],RV[0],'b')
# ring rows (top/bottom)
for y in (yb,yt):
    xs=[xl0]+L; 
    for a,b in zip(xs[:-1],xs[1:]): hrow(y,a,b)
    hrow(y,L[-1],RV[0],'b')
    xs=RV+[xr1]
    for a,b in zip(xs[:-1],xs[1:]): hrow(y,a,b)
# side border rows
for y in rows:
    hrow(y,xl0,L[0]); hrow(y,RV[-1],xr1)
tot4=sum(max(p[3],p[4]) for p in pieces)
# nodes (feet)
nodes=set()
for x in vthru:
    for y in [yb,yt]+prow: nodes.add((x,y))
for x in halfL+halfR:
    for y in (yb,2,D-2,yt): nodes.add((x,y))
for y in rows:
    for x in (xl0,L[0],RV[-1],xr1): nodes.add((x,y))
nodes=sorted(nodes)
cross=0
cols=[(x,y) for x in (L[-1],RV[0]) for y in (yb,2,99,196,293,yt)]
CL=180; CT=F+T+CL; coltot=len(cols)*CL
rails=[(x-2,yb-2,4,yt-yb+4) for x in (L[-1],RV[0])]
rungs=[(L[-1]+2,y-2,RV[0]-L[-1]-4,4) for y in (yb,2,99,196,293,yt)]
captot=sum(r[3] for r in rails)+sum(r[2] for r in rungs)
(lambda *a:None)('cols',len(cols),CL,coltot,'cap',captot)
fb=len(nodes)*F
tot4+=fb
tot4+=coltot+captot
(lambda *a:None)('pieces',len(pieces),'nodes',len(nodes),'4x4 total in',tot4,tot4/12,'2x3',cross,cross/12)
lx=-R; rx=W+R; by_=-R; ty=D+R
area_tot=((295+R)*(D+2*R)+(W-307+R)*(D+2*R))   # two blocks incl border, gap excluded
(lambda *a:None)('area incl border',area_tot,area_tot/144, 'overall',rx-lx,ty-by_)

DECK=F+T
H11=132;H14=168

import math
def roof(x): return DECK+168-(max(x,311)-311)*(48/194)
yb_n=2-R; yt_n=D-2+R
def drop(y): return 0.0   # right block: no N-S rake (already slanted E-W)
def dL(y): return max(0.0,min(12.0,12*((yt_n+2)-y)/((yt_n+2)-(yb_n-2))))   # left block rake: 0 at patio edge (y=196), 12 in. at south end of canopy
def rz(x,y): return roof(x)-drop(y)
def tilt_y(x,y1,y2,w,t,kind='r'):
    global LEN,CNT
    z1,z2=rz(x,y1),rz(x,y2); h=w/2
    FR_SLOPE.append([(x-h,y1,z1-t),(x+h,y1,z1-t),(x+h,y2,z2-t),(x-h,y2,z2-t),(x-h,y1,z1),(x+h,y1,z1),(x+h,y2,z2),(x-h,y2,z2)])
    return math.hypot(y2-y1,z2-z1)
def tiltL(x,y1,y2,w,t):
    z1,z2=LTOP-dL(y1),LTOP-dL(y2); h=w/2
    FR_SLOPE.append([(x-h,y1,z1-t),(x+h,y1,z1-t),(x+h,y2,z2-t),(x-h,y2,z2-t),(x-h,y1,z1),(x+h,y1,z1),(x+h,y2,z2),(x-h,y2,z2)])
    return math.hypot(y2-y1,z2-z1)
MARK={}; CAN=0
FR_BOX=[];FR_SLOPE=[];LEN={'post':0,'rail':0};CNT={'post':0,'rail':0}
LTOP=DECK+H11
MARK['start']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
# left posts + flat top rails  (3x2 left block = two bedrooms, split at x=147.5;
# the two interior posts that stood mid-room at (99,99),(196,99) move into the partition at (147.5,99))
LPOSTS=[(x,y) for x in (2,99,196) for y in (2,196)]+[(2,99),(147.5,99)]
for x,y in LPOSTS:
    FR_BOX.append(('p',x-2,y-2,4,4,DECK,LTOP-4-dL(y))); LEN['post']+=LTOP-4-dL(y)-DECK; CNT['post']+=1
for y,segs in ((2,((2,99),(99,196),(196,293))),(196,((2,99),(99,196),(196,293))),(99,((2,147.5),(147.5,293)))):
    for xa,xb in segs:
        FR_BOX.append(('r',xa+2,y-2,xb-xa-4,4,LTOP-4-dL(y),LTOP-dL(y))); LEN['rail']+=xb-xa-4; CNT['rail']+=1
for x in (2,147.5,293):
    for ya,yb_ in ((2,99),(99,196)):
        LEN['rail']+=tiltL(x,ya+2,yb_-2,4,4); CNT['rail']+=1
MARK['left_end']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
# right posts
for x in (406,503):
    for y in (2,99,196,293):
        FR_BOX.append(('p',x-2,y-2,4,4,DECK,rz(x,y)-4)); LEN['post']+=rz(x,y)-4-DECK; CNT['post']+=1
# right y-rails at roof height of their x
for x in (309,406,503):
    for ya,yb_ in ((2,99),(99,196),(196,293)):
        LEN['rail']+=tilt_y(x,ya+2,yb_-2,4,4); CNT['rail']+=1
# right sloped x-rails
for y in (2,99,196,293):
    for xa,xb in ((311,404),(408,501)):
        za,zb=roof(xa)-drop(y),roof(xb)-drop(y)
        v=[(xa,y-2,za-4),(xb,y-2,zb-4),(xb,y+2,zb-4),(xa,y+2,za-4),(xa,y-2,za),(xb,y-2,zb),(xb,y+2,zb),(xa,y+2,za)]
        FR_SLOPE.append(v); LEN['rail']+=math.hypot(xb-xa,zb-za); CNT['rail']+=1

MARK['right_end']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
CAN=0
def can_box(x0,y0,w,h,z1):
    global CAN
    if w==4: x0,w=x0+1,2
    else: y0,h=y0+1,2
    FR_BOX.append(('c',x0,y0,w,h,z1-3,z1)); CAN+=max(w,h)
def can_slope(xa,xb,y):
    global CAN
    za,zb=roof(xa)-drop(y),roof(xb)-drop(y)
    FR_SLOPE.append([(xa,y-1,za-3),(xb,y-1,zb-3),(xb,y+1,zb-3),(xa,y+1,za-3),(xa,y-1,za),(xb,y-1,zb),(xb,y+1,zb),(xa,y+1,za)])
    CAN+=math.hypot(xb-xa,zb-za)
MARK['can0']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
# LEFT canopy (flat, 11 ft): joists only, ~every 48.5 in., over west + south perimeter squares
xo=xl0; yo=yb
for y in (2,50.5,99,147.5,196): can_box(xo-2,y-2,0-(xo-2),4,LTOP-dL(y))          # west joists
for x in (2,50.5,99,147.5,196,244.5,293): CAN+=tiltL(x,yo-2,0,2,3)      # south joists (raked)
MARK['can_sw_end']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
# LEFT canopy extension: over the white patio cells + north border (top-left quadrant)
for x in (2,50.5,99,147.5,196,244.5,293): CAN+=tiltL(x,198,yt+2,2,3)        # north joists
for y in (244.5,293): can_box(xo-2,y-2,0-(xo-2),4,LTOP-dL(y))                            # extra west joists
MARK['can_patio_end']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
# RIGHT canopy (follows roof slope): joists only, south, east, north
xe=xr1
for x in (309,357.5,406,454.5,503):
    CAN+=tilt_y(x,0,yb-2,2,3); CAN+=tilt_y(x,295,yt+2,2,3)       # south + north joists on the continuous slope
for y in (2,50.5,99,147.5,196,244.5,293): can_slope(505,xe+2,y)                   # east joists

MARK['can_right_end']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
# PERIMETER 4x4 edge tube + 4x4 posts, top-left white quadrant canopy ONLY
def post(px,py,ztop):
    FR_BOX.append(('c',px-2,py-2,4,4,DECK,ztop)); LEN['post']+=ztop-DECK; CNT['post']+=1
def edge_box(x0,y0,w,h,zt):
    FR_BOX.append(('c',x0,y0,w,h,zt-4,zt)); LEN['rail']+=max(w,h); CNT['rail']+=1
edge_box(xl0-2,yt-2,293+2-(xl0-2),4,LTOP-dL(yt))                  # north (front) edge only
for x in (2,99,196,293): post(x,yt,LTOP-4-dL(yt))      # every other canopy upright removed
MARK['end']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
FRTOT=LEN['post']+LEN['rail']
print(CNT,LEN,FRTOT,FRTOT/12)

import json,math,numpy as np
from scipy.spatial import ConvexHull
def hexa(x0,y0,w,h,z0,z1):
    return [(x0,y0,z0),(x0+w,y0,z0),(x0+w,y0+h,z0),(x0,y0+h,z0),(x0,y0,z1),(x0+w,y0,z1),(x0+w,y0+h,z1),(x0,y0+h,z1)]
def r(v): return [[round(a,2) for a in p] for p in v]
M=MARK
def seg(a,b,frb=True):
    out=[]
    for k,x,y,w,h,z0,z1 in FR_BOX[M[a][0]:M[b][0]]: out.append((k,hexa(x,y,w,h,z0,z1)))
    for vs in FR_SLOPE[M[a][1]:M[b][1]]: out.append(('s',list(vs)))
    return out
def L4(a,b): return (M[b][2]-M[a][2])/12
def LC(a,b): return (M[b][3]-M[a][3])/12
stages=[]
def add(id,title,items,l4,lc,note,cnt):
    stages.append(dict(id=id,title=title,items=[dict(c=c,v=r(v)) for c,v in items],l4=round(l4,2),l3=round(lc,2),note=note,count=cnt))
add('ground','Bare ground',[],0,0,'Nothing built. The site is an empty lot; the grid below is laid out in inches from the platform origin.',0)
fo=[]
for cx,cy in nodes:
    fo.append(('plate',hexa(cx-5,cy-5,10,10,-PT,0))); fo.append(('leg',hexa(cx-2,cy-2,4,4,0,F)))
add('footings','Footings and legs',fo,len(nodes)*F/12,0,f'{len(nodes)} legs, each a 4 in. x 4 in. tube 10 in. tall on a 10 in. x 10 in. plate.',len(nodes))
pl=[('bridge' if k=='b' else 'plat',hexa(x,y,w,h,F,F+T)) for k,x,y,w,h in pieces]
add('platform','Platform grid',pl,tot4_pl:=sum(max(p[3],p[4]) for p in pieces)/12,0,'The 4 in. x 4 in. tube platform: 15 squares at 97 in. pitch, 12 in. gaps with four bridge tubes, and the 50.5 in. border ring.',len(pieces))
fl=[]
for i,j,bb in cells:
    x0=T+i*P+bb;y0=T+j*P
    fl.append(('patio' if (bb==0 and j==2) else 'floor',hexa(x0,y0,I,I,DECK-1.5,DECK-0.5)))
add('floors','Gray floor and patio',fl,0,0,'Twelve 93 in. x 93 in. gray floor cells make the living area. The three white cells at the north end are the patio.',len(fl))
tw=[('col',hexa(cx-2,cy-2,4,4,DECK,CT)) for cx,cy in cols]+[('cap',hexa(x,y,w,h,CT,CT+T)) for x,y,w,h in rails+rungs]
add('tower','Red tower columns',tw,(coltot+captot)/12,0,'Twelve 4 in. x 4 in. columns rise 15 ft above the deck at x = 293 and 309, joined by cap rails and rungs.',len(tw))
add('left','Bedroom block frame (raked)',seg('start','left_end'),L4('start','left_end'),0,'Frame over the two bedrooms (the 3 x 2 left block): 11 ft above the deck at the patio edge, falling 12 in. to the south. Its one interior post stands in the wall between the bedrooms at x = 147.5 in., so each 12 ft x 16 ft room is clear.',0)
add('right','Living block frame (sloped)',seg('left_end','right_end'),L4('left_end','right_end'),0,'Frame over the 2 x 3 living area. Its roof slopes from 14 ft above the deck at the tower down to 10 ft at the far east edge.',0)
add('canopy_sw','Canopy: west and south joists',seg('can0','can_sw_end'),0,LC('can0','can_sw_end'),'3 in. x 2 in. joists about every 48.5 in. over the west and south perimeter squares, raking with the roof.',0)
add('canopy_patio','Canopy: patio extension',seg('can_sw_end','can_patio_end'),0,LC('can_sw_end','can_patio_end'),'The canopy continues over the white patio cells and north border, still in 3 in. x 2 in. tube, on the same continuous 1 ft fall.',0)
add('canopy_right','Canopy: right block',seg('can_patio_end','can_right_end'),0,LC('can_patio_end','can_right_end'),'South, north and east joists over the perimeter squares of the sloped right block.',0)
add('edge','North edge tube and uprights',seg('can_right_end','end'),L4('can_right_end','end'),0,'A 4 in. x 4 in. edge tube along the front (north) canopy edge, held up by four 4 in. x 4 in. uprights on the border tube.',0)
for st in stages: st['count']=len(st['items'])
tot4_all=sum(s['l4'] for s in stages); totc=sum(s['l3'] for s in stages)
gray=12*I*I/144; total=(W+2*R)*(D+2*R)/144
print('totals',tot4_all,totc,(10548+FRTOT)/12,CAN/12,gray,total, tot4/12)
cum4=cum3=0
for s in stages:
    cum4+=s['l4']; cum3+=s['l3']; s['cum4']=round(cum4,1); s['cum3']=round(cum3,1)
dims=dict(deck=DECK,gap=GAP,pitch=P,cell=I,tube=T,ring=R,foot=F,platW=W,platD=D,overallW=xr1-xl0+4,overallH=yt-yb+4,ltop=LTOP,col=CT,rake=12,
 gray=round(gray,2),total=round(total*1.0,2),l4=round(cum4,1),l3=round(cum3,1),roofTower=roof(311),roofEast=roof(505),
 xmin=xl0-2,xmax=xr1+2,ymin=yb-2,ymax=yt+2)
json.dump(dict(stages=stages,dims=dims),open('/home/claude/site/data/model.json','w'),separators=(',',':'))
print([ (s['id'],len(s['items']),s['l4'],s['l3']) for s in stages])

# ---------- SVG elevations + plan (exact projections of the same data)
COL={'plate':'#0a5fb4','leg':'#ff5a00','plat':'#3a3d43','bridge':'#e0a030','floor':'#9e9e9e','patio':'#ffffff','col':'#c0392b','cap':'#7b241c'}
items=[]
for st in stages:
    for it in st['items']:
        items.append((COL.get(it['c'],'#1f6f8b' if it['c']!='s' else '#16536a'),it['v']))
views={'west':(lambda p:-p[1],lambda p:p[0],False),'east':(lambda p:p[1],lambda p:p[0],True),
       'south':(lambda p:p[0],lambda p:p[1],False),'north':(lambda p:-p[0],lambda p:p[1],True)}
for name,(hf,df,asc) in views.items():
    order=sorted(items,key=lambda it:(1 if asc else -1)*np.mean([df(p) for p in it[1]]))
    polys=[];xs=[]
    for c,pts in order:
        P2=np.array([(hf(p),p[2]) for p in pts])
        try: hh=ConvexHull(P2)
        except Exception: continue
        pp=P2[hh.vertices]; xs+= [a for a,b in pp]
        polys.append((c,pp))
    x0=min(xs)-24;x1=max(xs)+24; zmax=CT+T+24
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.1f} {-zmax:.1f} {x1-x0:.1f} {zmax+30:.1f}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="{name} elevation">',
         f'<line x1="{x0:.1f}" y1="0" x2="{x1:.1f}" y2="0" stroke="#555" stroke-width="0.8"/>']
    for c,pp in polys:
        out.append('<polygon fill="%s" stroke="#111" stroke-width="0.35" points="%s"/>'%(c,' '.join(f'{a:.2f},{-b:.2f}' for a,b in pp)))
    out.append('</svg>')
    open(f'/home/claude/site/data/elev_{name}.svg','w').write('\n'.join(out))
# plan
xmin,xmax,ymin,ymax=dims['xmin'],dims['xmax'],dims['ymin'],dims['ymax']
def Y(y): return ymax-y
pl=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{xmin-30} {-30} {xmax-xmin+60} {ymax-ymin+60}" role="img" aria-label="plan">']
for k,x,y,w,h in pieces:
    pl.append(f'<rect x="{x-0:.1f}" y="{Y(y+h):.1f}" width="{w:.1f}" height="{h:.1f}" fill="{"#e0a030" if k=="b" else "#3a3d43"}"/>')
for i,j,bb in cells:
    x0=T+i*P+bb;y0=T+j*P; pat=(bb==0 and j==2)
    pl.append(f'<rect x="{x0}" y="{Y(y0+I):.1f}" width="{I}" height="{I}" fill="{"#fff" if pat else "#9e9e9e"}" stroke="{"#888" if pat else "none"}" stroke-dasharray="{"6 4" if pat else "0"}" stroke-width="1.2"/>')
for cx,cy in cols: pl.append(f'<rect x="{cx-2}" y="{Y(cy+2):.1f}" width="4" height="4" fill="#c0392b"/>')
for k,x,y,w,h,z0,z1 in FR_BOX:
    if k=='p' or (w==4 and h==4): pl.append(f'<rect x="{x}" y="{Y(y+h):.1f}" width="{w}" height="{h}" fill="#1f6f8b" stroke="#0d3a4a" stroke-width="0.6"/>')
open('/home/claude/site/data/plan.svg','w').write('\n'.join(pl+['</svg>']))
print('svgs written')

# ---------- BUILT-OUT massing (for photoreal references) — same geometry, closed in
BO=[]
def bx(c,x0,x1,y0,y1,z0,z1): BO.append(dict(c=c,v=r(hexa(x0,y0,x1-x0,y1-y0,z0,z1))))
def quad_slab(c,x0,x1,y0,y1,ztop,th):   # slab whose top follows ztop(x,y) at the 4 corners
    pts=[(x0,y0),(x1,y0),(x1,y1),(x0,y1)]
    v=[(x,y,ztop(x,y)-th) for x,y in pts]+[(x,y,ztop(x,y)) for x,y in pts]
    BO.append(dict(c=c,v=r(v)))
OX0,OX1,OY0,OY1=xl0-2,xr1+2,yb-2,yt+2
# deck (wood) over the whole platform, interior floors (concrete) inside the closed volumes
bx('deck',OX0,OX1,OY0,OY1,DECK-0.2,DECK+1.0)
bx('floor',2,293,2,196,DECK+1.0,DECK+1.3); bx('floor',309,503,2,293,DECK+1.0,DECK+1.3)
# platform tube fascia + legs/plates
for k,x,y,w,h in pieces: BO.append(dict(c='steel',v=r(hexa(x,y,w,h,F,F+T))))
for cx,cy in nodes: BO.append(dict(c='leg',v=r(hexa(cx-2,cy-2,4,4,0,F))))
# steel frame, tower, edge (everything from the model)
for k,x,y,w,h,z0,z1 in FR_BOX: BO.append(dict(c='steel',v=r(hexa(x,y,w,h,z0,z1))))
for vs in FR_SLOPE: BO.append(dict(c='steel',v=r(list(vs))))
# spine: the red tower, clad as a weathering-steel fin between the two blocks
bx('spine',291,311,OY0,OY1,DECK+1,CT+T)
# LEFT roof: one slab over frame + canopy, top flush with joist tops, 1 ft fall N->S
quad_slab('roof',OX0,291,OY0,OY1,lambda x,y: LTOP-dL(min(max(y,yb-2),yt+2))+5,9)
# RIGHT roof: sloped 14 ft at tower -> 10 ft at east edge
quad_slab('roof',311,OX1,OY0,OY1,lambda x,y: roof(x)+5,9)
# walls (inset 1 in. inside the post line). left block: N glass, W cedar, S cedar ; right: N glass, E glass, S cedar
def wall(c,x0,x1,y0,y1,top):
    zt0,zt1=top(x0,y0),top(x1,y1); z0=DECK+1.3
    v=[(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),(x0,y0,zt0),(x1,y0,zt1),(x1,y1,zt1),(x0,y1,zt0)]
    BO.append(dict(c=c,v=r(v)))
LT=lambda x,y: LTOP-4-dL(y)
RT=lambda x,y: roof(x)-4
wall('glass',4,291,195,197,LT)        # left north (to patio) – glass
wall('cedar',1,3,4,194,LT)            # left west – cedar
wall('cedar',4,291,1,3,LT)            # left south – cedar
wall('glass',311,501,292,294,RT)      # right north – glass
wall('glass',502,504,4,291,RT)        # right east – glass
wall('cedar',311,501,1,3,RT)          # right south – cedar
wall('wall',146,149,4,194,LT)         # bedroom partition (holds the moved post at x=147.5)
json.dump(BO,open('/home/claude/site/data/buildout.json','w'),separators=(',',':'))
print('buildout items',len(BO))
