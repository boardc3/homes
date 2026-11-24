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
import math
# ---------------- GABLE ROOF: 26 deg each way, ridge down the middle of the platform (north-south)
PITCH=26.0; TP=math.tan(math.radians(PITCH))
XC=W/2                      # ridge line x = 252.5 (middle of the 505 in. platform)
EAVE=120                    # 10 ft above the deck at the west and east walls (x=2, x=503)
HALF=XC-2
def G(x): return DECK+EAVE+(HALF-abs(x-XC))*TP      # top of steel under the roof at any x
RIDGE=G(XC)
def roof(x): return G(x)
def rz(x,y): return G(x)
LTOP=G(2)
yb_n=2-R; yt_n=D-2+R
MARK={}; CAN=0
FR_BOX=[];FR_SLOPE=[];LEN={'post':0,'rail':0};CNT={'post':0,'rail':0}
def xs_verts(xa,xb,y,w,t):
    """8-vertex boxes for a member along x whose top follows the roof; split at the ridge"""
    if xa<XC<xb: return xs_verts(xa,XC,y,w,t)+xs_verts(XC,xb,y,w,t)
    za,zb=G(xa),G(xb); h=w/2
    return [[(xa,y-h,za-t),(xb,y-h,zb-t),(xb,y+h,zb-t),(xa,y+h,za-t),(xa,y-h,za),(xb,y-h,zb),(xb,y+h,zb),(xa,y+h,za)]]
def xslope(xa,xb,y,w,t):
    vs=xs_verts(xa,xb,y,w,t); FR_SLOPE.extend(vs)
    return sum(math.hypot(v[1][0]-v[0][0],v[4][2]-v[5][2]) for v in vs)
def yflat(x,ya,yb_,w,t,kind='r'):
    """member along y: level, top at G(x)"""
    FR_BOX.append((kind,x-w/2,ya,w,yb_-ya,G(x)-t,G(x))); return yb_-ya
MARK['start']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
# LIVING WING: 9 posts up to the roof; every row is a portal frame peaking at the ridge
for x in (2,99,196):
    for y in (2,99,196):
        FR_BOX.append(('p',x-2,y-2,4,4,DECK,G(x)-4)); LEN['post']+=G(x)-4-DECK; CNT['post']+=1
for y in (2,99,196):
    for xa,xb in ((4,97),(101,194),(198,291)):
        LEN['rail']+=xslope(xa,xb,y,4,4); CNT['rail']+=1
for x in (2,99,196):
    for ya,yb_ in ((2,99),(99,196)):
        LEN['rail']+=yflat(x,ya+2,yb_-2,4,4); CNT['rail']+=1
for ya,yb_ in ((2,99),(99,196)):                       # ridge beam
    LEN['rail']+=yflat(XC,ya+2,yb_-2,4,4); CNT['rail']+=1
MARK['left_end']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
# BEDROOM WING: posts in the partition line and the outer walls; rafters fall east at the same 26 deg
RPOSTS=[(x,y) for x in (406,503) for y in (2,147.5,293)]
for x,y in RPOSTS:
    FR_BOX.append(('p',x-2,y-2,4,4,DECK,G(x)-4)); LEN['post']+=G(x)-4-DECK; CNT['post']+=1
for x in (406,503):
    for ya,yb_ in ((2,147.5),(147.5,293)):
        LEN['rail']+=yflat(x,ya+2,yb_-2,4,4); CNT['rail']+=1
for y in (2,147.5,293):
    for xa,xb in ((311,404),(408,501)):
        LEN['rail']+=xslope(xa,xb,y,4,4); CNT['rail']+=1
MARK['right_end']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
# CANOPY: 3 x 2 in. joists every ~4 ft over the deck border, on the roof pitch
def can_x(xa,xb,y):
    global CAN; CAN+=xslope(xa,xb,y,2,3)
def can_y(x,ya,yb_):
    global CAN; CAN+=yflat(x,ya,yb_,2,3,'c')
MARK['can0']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
for y in (2,50.5,99,147.5,196): can_x(xl0-2,0,y)                          # west joists
for x in (2,50.5,99,147.5,196,XC,293): can_y(x,yb-2,0)                    # south joists (incl. the ridge)
MARK['can_sw_end']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
for x in (2,50.5,99,147.5,196,293): can_y(x,198,yt+2)                     # north joists over the patio
for y in (244.5,293): can_x(xl0-2,0,y)                                    # extra west joists
MARK['can_patio_end']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
for x in (309,357.5,406,454.5,503): can_y(x,yb-2,0); can_y(x,295,yt+2)    # south + north joists
for y in (2,50.5,99,147.5,196,244.5,293): can_x(505,xr1+2,y)              # east joists
MARK['can_right_end']=(len(FR_BOX),len(FR_SLOPE),LEN['post']+LEN['rail'],CAN)
# PATIO EDGE: 4 in. beam along the north edge, peaking at the ridge, on three posts and the spine column
def post(px,py,ztop):
    FR_BOX.append(('c',px-2,py-2,4,4,DECK,ztop)); LEN['post']+=ztop-DECK; CNT['post']+=1
LEN['rail']+=xslope(xl0-2,291,yt,4,4); CNT['rail']+=1
for x in (2,99,196): post(x,yt,G(x)-4)
LEN['rail']+=yflat(XC,198,yt-2,4,4); CNT['rail']+=1                       # ridge beam carried on over the patio
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
add('ground','Bare ground',[],0,0,'Any lot will do. This one is staked to the exact footprint: 50 ft 6 in. by 33 ft.',0)
fo=[]
for cx,cy in nodes:
    fo.append(('plate',hexa(cx-5,cy-5,10,10,-PT,0))); fo.append(('leg',hexa(cx-2,cy-2,4,4,0,F)))
add('footings','Footings',fo,len(nodes)*F/12,0,'The whole house stands on 54 steel legs, each on a 10 in. plate. Light on the land, easy on the budget.',len(nodes))
pl=[('bridge' if k=='b' else 'plat',hexa(x,y,w,h,F,F+T)) for k,x,y,w,h in pieces]
add('platform','Platform',pl,tot4_pl:=sum(max(p[3],p[4]) for p in pieces)/12,0,'A grid of 4 in. square tube: fifteen 8 ft bays inside a 4 ft border ring.',len(pieces))
fl=[]
for i,j,bb in cells:
    x0=T+i*P+bb;y0=T+j*P
    fl.append(('patio' if (bb==0 and j==2) else 'floor',hexa(x0,y0,I,I,DECK-1.5,DECK-0.5)))
add('floors','Floor and patio',fl,0,0,'Twelve floor cells for the rooms. The three open cells at the north end become the patio.',len(fl))
coltops={cx:G(cx)-4 for cx in (L[-1],RV[0])}
tw=[('col',hexa(cx-2,cy-2,4,4,DECK,coltops[cx])) for cx,cy in cols]
tw+=[('cap',hexa(x-2,yb-2,4,yt-yb+4,G(x)-4,G(x))) for x in (L[-1],RV[0])]
for y in (yb,2,99,196,293,yt): tw+=[('cap',v) for v in xs_verts(L[-1]+2,RV[0]-2,y,4,4)]
coltot=sum(coltops[cx]-DECK for cx,cy in cols); captot=2*(yt-yb+4)+6*(RV[0]-L[-1]-4)/math.cos(math.radians(PITCH))
add('tower','Spine columns',tw,(coltot+captot)/12,0,f'Twelve columns rise to the roof where the two wings meet, about {round((G(L[-1])-DECK)/12)} ft above the deck.',len(tw))
add('left','Living wing',seg('start','left_end'),L4('start','left_end'),0,f'The wider wing, behind the patio. Every frame is a gable: 10 ft at the west wall, rising at {PITCH:g}° to the ridge, {int((RIDGE-DECK)//12)} ft {round((RIDGE-DECK)%12)} in. above the deck.',0)
add('right','Bedroom wing',seg('left_end','right_end'),L4('left_end','right_end'),0,f'The deeper wing. The roof falls at the same {PITCH:g}° from the spine to 10 ft at the east wall. Its interior posts sit in the wall between the two bedrooms.',0)
add('canopy_sw','Canopy',seg('can0','can_sw_end'),0,LC('can0','can_sw_end'),'3 by 2 in. joists every 4 ft over the west and south deck, on the roof pitch.',0)
add('canopy_patio','Patio canopy',seg('can_sw_end','can_patio_end'),0,LC('can_sw_end','can_patio_end'),'The canopy carries on over the patio and the north deck.',0)
add('canopy_right','Bedroom canopy',seg('can_patio_end','can_right_end'),0,LC('can_patio_end','can_right_end'),'Joists over the deck around the bedroom wing.',0)
add('edge','Patio edge',seg('can_right_end','end'),L4('can_right_end','end'),0,'A 4 in. beam along the north edge of the patio, peaking at the ridge, on three slim posts and the spine.',0)
for st in stages: st['count']=len(st['items'])
tot4_all=sum(s['l4'] for s in stages); totc=sum(s['l3'] for s in stages)
gray=12*I*I/144; total=(W+2*R)*(D+2*R)/144
print('totals',tot4_all,totc,(10548+FRTOT)/12,CAN/12,gray,total, tot4/12)
cum4=cum3=0
for s in stages:
    cum4+=s['l4']; cum3+=s['l3']; s['cum4']=round(cum4,1); s['cum3']=round(cum3,1)
dims=dict(deck=DECK,gap=GAP,pitch=P,cell=I,tube=T,ring=R,foot=F,platW=W,platD=D,overallW=xr1-xl0+4,overallH=yt-yb+4,eave=DECK+EAVE,ridge=round(RIDGE,2),ridgeX=XC,roofPitch=PITCH,col=round(G(L[-1]),2),
 gray=round(gray,2),total=round(total*1.0,2),l4=round(cum4,1),l3=round(cum3,1),
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
    x0=min(xs)-24;x1=max(xs)+24; zmax=RIDGE+24
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
# ONE GABLE ROOF over the whole house: 26 deg each way from a ridge down the middle
quad_slab('roof',OX0,XC,OY0,OY1,lambda x,y: G(x)+5,9)
quad_slab('roof',XC,OX1,OY0,OY1,lambda x,y: G(x)+5,9)
# walls (inset 1 in. inside the post line). left block: N glass, W cedar, S cedar ; right: N glass, E glass, S cedar
def wall(c,x0,x1,y0,y1,top):
    zt0,zt1=top(x0,y0),top(x1,y1); z0=DECK+1.3
    v=[(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),(x0,y0,zt0),(x1,y0,zt1),(x1,y1,zt1),(x0,y1,zt0)]
    BO.append(dict(c=c,v=r(v)))
LT=RT=lambda x,y: G(x)-4
# GLASS EVERYWHERE: every exterior wall is floor-to-ceiling glass in black steel frames
wall('glass',4,XC,195,197,LT); wall('glass',XC,291,195,197,LT)    # living north (to patio), split at the ridge
wall('glass',1,3,4,194,LT)            # living west
wall('glass',4,XC,1,3,LT); wall('glass',XC,291,1,3,LT)            # living south, split at the ridge
wall('glass',311,501,292,294,RT)      # bedrooms north (lake)
wall('glass',502,504,4,291,RT)        # bedrooms east
wall('glass',311,501,1,3,RT)          # bedrooms south
wall('wall',311,501,146,149,RT)       # partition between the two bedrooms (posts at y=147.5 sit inside it)
wall('spine',291,311,OY0,OY1,RT)      # Corten spine fin, full length, up to the roof

# ---------- FURNITURE LAYOUT (plan-accurate; floor at DECK+1.3)
FL=DECK+1.3
def fb(c,x0,x1,y0,y1,z0,z1): BO.append(dict(c=c,v=r(hexa(x0,y0,x1-x0,y1-y0,FL+z0,FL+z1))))
# living block (x 2..291, y 2..196): living zone west of the x=99 posts, dining between the posts, kitchen on the spine
fb('rug',12,96,38,160,0,.5)
fb('sofa',50,86,52,146,0,15); fb('sofa',80,86,52,146,15,30)          # sofa faces west (ocean), back to the posts
fb('table',22,40,80,118,0,16)                                        # coffee table
fb('table',108,187,81,117,28.5,30); fb('table',112,114,85,113,0,28.5); fb('table',181,183,85,113,0,28.5)   # dining table between the posts
fb('cab',267,291,20,176,0,36)                                        # 13 ft kitchen run on the Corten spine
fb('cab',279,291,60,136,56,57.5)                                     # floating shelf
# bedrooms (x 311..501): beds with headboards on the spine wall, partition at y 146..149
for yc in (75,220):
    fb('bed',315,395,yc-38,yc+38,0,22); fb('night',311,315,yc-42,yc+42,0,40)
    fb('night',311,329,yc-62,yc-44,0,24); fb('night',311,329,yc+44,yc+62,0,24)
json.dump(BO,open('/home/claude/site/data/buildout.json','w'),separators=(',',':'))
print('buildout items',len(BO))
