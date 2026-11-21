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
FR_BOX=[];FR_SLOPE=[];LEN={'post':0,'rail':0};CNT={'post':0,'rail':0}
LTOP=DECK+H11
# left posts + flat top rails
for x in (2,99,196):
    for y in (2,99,196):
        FR_BOX.append(('p',x-2,y-2,4,4,DECK,LTOP-4-dL(y))); LEN['post']+=LTOP-4-dL(y)-DECK; CNT['post']+=1
for y in (2,99,196):
    for xa,xb in ((2,99),(99,196),(196,293)):
        FR_BOX.append(('r',xa+2,y-2,xb-xa-4,4,LTOP-4-dL(y),LTOP-dL(y))); LEN['rail']+=xb-xa-4; CNT['rail']+=1
for x in (2,99,196,293):
    for ya,yb_ in ((2,99),(99,196)):
        LEN['rail']+=tiltL(x,ya+2,yb_-2,4,4); CNT['rail']+=1
# right posts  (deeper 2x3 block = two bedrooms, 16 ft x 12 ft each, partition at y=147.5;
# the posts that stood mid-room at (406,99),(406,196) and the east posts at (503,99),(503,196) move onto the partition line)
RPOSTS=[(x,y) for x in (406,503) for y in (2,147.5,293)]
for x,y in RPOSTS:
    FR_BOX.append(('p',x-2,y-2,4,4,DECK,rz(x,y)-4)); LEN['post']+=rz(x,y)-4-DECK; CNT['post']+=1
# right y-rails at roof height of their x (x=309 sits on the red tower columns at 2/99/196/293)
for x,segs in ((309,((2,99),(99,196),(196,293))),(406,((2,147.5),(147.5,293))),(503,((2,147.5),(147.5,293)))):
    for ya,yb_ in segs:
        LEN['rail']+=tilt_y(x,ya+2,yb_-2,4,4); CNT['rail']+=1
# right sloped x-rails (perimeter rows + the partition row)
for y in (2,147.5,293):
    for xa,xb in ((311,404),(408,501)):
        za,zb=roof(xa)-drop(y),roof(xb)-drop(y)
        v=[(xa,y-2,za-4),(xb,y-2,zb-4),(xb,y+2,zb-4),(xa,y+2,za-4),(xa,y-2,za),(xb,y-2,zb),(xb,y+2,zb),(xa,y+2,za)]
        FR_SLOPE.append(v); LEN['rail']+=math.hypot(xb-xa,zb-za); CNT['rail']+=1

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
# LEFT canopy (flat, 11 ft): joists only, ~every 48.5 in., over west + south perimeter squares
xo=xl0; yo=yb
for y in (2,50.5,99,147.5,196): can_box(xo-2,y-2,0-(xo-2),4,LTOP-dL(y))          # west joists
for x in (2,50.5,99,147.5,196,244.5,293): CAN+=tiltL(x,yo-2,0,2,3)      # south joists (raked)
# LEFT canopy extension: over the white patio cells + north border (top-left quadrant)
for x in (2,50.5,99,147.5,196,244.5,293): CAN+=tiltL(x,198,yt+2,2,3)        # north joists
for y in (244.5,293): can_box(xo-2,y-2,0-(xo-2),4,LTOP-dL(y))                            # extra west joists
# RIGHT canopy (follows roof slope): joists only, south, east, north
xe=xr1
for x in (309,357.5,406,454.5,503):
    CAN+=tilt_y(x,0,yb-2,2,3); CAN+=tilt_y(x,295,yt+2,2,3)       # south + north joists on the continuous slope
for y in (2,50.5,99,147.5,196,244.5,293): can_slope(505,xe+2,y)                   # east joists

# PERIMETER 4x4 edge tube + 4x4 posts, top-left white quadrant canopy ONLY
def post(px,py,ztop):
    FR_BOX.append(('c',px-2,py-2,4,4,DECK,ztop)); LEN['post']+=ztop-DECK; CNT['post']+=1
def edge_box(x0,y0,w,h,zt):
    FR_BOX.append(('c',x0,y0,w,h,zt-4,zt)); LEN['rail']+=max(w,h); CNT['rail']+=1
edge_box(xl0-2,yt-2,293+2-(xl0-2),4,LTOP-dL(yt))                  # north (front) edge only
for x in (2,99,196,293): post(x,yt,LTOP-4-dL(yt))      # every other canopy upright removed
FRTOT=LEN['post']+LEN['rail']
print(CNT,LEN,FRTOT,FRTOT/12)
fig=plt.figure(figsize=(11,8.5),dpi=200)
def bx(a3,x0,x1,y0,y1,z0,z1,c,al=1.0):
    v=[(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)]
    f=[[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]
    a3.add_collection3d(Poly3DCollection([[v[i] for i in q] for q in f],fc=c,ec='k',lw=0.5,alpha=al))
def poly(a3,vs,faces,c,al):
    a3.add_collection3d(Poly3DCollection([[vs[i] for i in q] for q in faces],fc=c,ec='k',lw=1.0,alpha=al))
def scene(a3):
    for cx,cy in nodes: bx(a3,cx-5,cx+5,cy-5,cy+5,-PT,0,'#0a5fb4');bx(a3,cx-2,cx+2,cy-2,cy+2,0,F,'#ff5a00')
    for k,x,y,w,h in pieces: bx(a3,x,x+w,y,y+h,F,F+T,'#e0a030' if k=='b' else '#3a3d43')
    # gray living floors
    for i,j,bb in cells:
        if not(bb==0 and j==2):
            x0=T+i*P+bb;y0=T+j*P
            bx(a3,x0,x0+I,y0,y0+I,DECK-1.5,DECK-0.5,'#9e9e9e')
    for k,x,y,w,h,z0,z1 in FR_BOX: bx(a3,x,x+w,y,y+h,z0,z1,'#1f6f8b')
    for vs in FR_SLOPE: poly(a3,vs,[[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]],'#1f6f8b',1.0)
    for cx,cy in cols: bx(a3,cx-2,cx+2,cy-2,cy+2,DECK,CT,'#c0392b')
    for x,y,w,h in rails+rungs: bx(a3,x,x+w,y,y+h,CT,CT+T,'#7b241c')
    a3.set_xlim(-60,W+60);a3.set_ylim(-60,yt+60);a3.set_zlim(0,260)
    a3.set_box_aspect((W+120,yt+120,260),zoom=0.9); a3.set_axis_off(); a3.patch.set_alpha(0)
a=fig.add_axes([0.0,0.24,0.5,0.66],projection='3d'); scene(a); a.set_proj_type('persp',focal_length=0.35); a.view_init(elev=14,azim=-125)
b=fig.add_axes([0.5,0.24,0.5,0.66],projection='3d'); scene(b); b.set_proj_type('ortho'); b.view_init(elev=35.264,azim=-45)


fig.text(0.5,0.22,f'1.  Linear feet of 4-inch tube:  {(10548+FRTOT)/12:,.1f} ft',ha='center',fontsize=14,fontweight='bold')
fig.text(0.5,0.18,f'2.  Linear feet of 3 in. x 2 in. tube:  {CAN/12:,.1f} ft',ha='center',fontsize=14,fontweight='bold')
plt.savefig('/home/claude/out/home_frames_landscape_v13.png'); plt.savefig('/home/claude/out/home_frames_landscape_v13.pdf')
