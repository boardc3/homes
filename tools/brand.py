# MyDwell brand assets: mark (house north elevation reads as an "M"), wordmark outlined from Fraunces, lockups, favicons, OG image.
import io, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F=os.path.join(ROOT,'node_modules/@fontsource/fraunces/files/')
OUT=os.path.join(ROOT,'public/brand/')
INK='#14171A'; PAPER='#F3F0E8'; CORTEN='#9C4A26'; PACIFIC='#1F5F73'; SAGE='#7F8C6E'; SAND='#D9CBB0'

def glyph_run(font_file, text, x0, kern=0):
    f=TTFont(font_file); gs=f.getGlyphSet(); cmap=f.getBestCmap(); hm=f['hmtx']; upm=f['head'].unitsPerEm
    paths=[]; x=x0
    for ch in text:
        g=cmap[ord(ch)]; pen=SVGPathPen(gs); gs[g].draw(pen)
        paths.append((x,pen.getCommands())); x+=hm[g][0]+kern
    return paths, x, upm
def wordmark_paths(color=INK, accent=INK):
    # "My" in Fraunces italic 400, "Dwell" in Fraunces 600 (upright). Units: font units, y up.
    p1,x1,upm=glyph_run(F+'fraunces-latin-400-italic.woff2','My',0,kern=-10)
    p2,x2,_=glyph_run(F+'fraunces-latin-600-normal.woff2','Dwell',x1+30,kern=-6)
    out=[]
    for x,d in p1: out.append(f'<path transform="translate({x} 0)" d="{d}" fill="{accent}"/>')
    for x,d in p2: out.append(f'<path transform="translate({x} 0)" d="{d}" fill="{color}"/>')
    return out, x2, upm

# --- the mark: 64x64, north elevation of the house (left flat roof, Corten spine, shed roof), deck line
def mark(ink=INK, corten=CORTEN, bg=None, pad=0):
    s=[f'<rect width="64" height="64" rx="14" fill="{bg}"/>' if bg else '']
    s.append(f'<g fill="none" stroke="{ink}" stroke-width="3.6" stroke-linecap="square" stroke-linejoin="miter">'
             '<path d="M4.5 26.5 H33"/>'           # living roof + west overhang
             '<path d="M9 26.5 V47.5"/>'        # west glass line
             '<path d="M38.5 17.5 L59.5 27.5"/>'       # bedroom shed roof, 14 ft -> 10 ft
             '<path d="M55.5 25.6 V47.5"/>'        # east glass line
             '<path d="M3 49.5 H61"/>'         # the deck
             '</g>')
    s.append(f'<rect x="33" y="8.5" width="5.5" height="41" fill="{corten}"/>')   # the Corten spine
    return ''.join(s)
def svg(w,h,body,vb=None): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb or f"0 0 {w} {h}"}" width="{w}" height="{h}">{body}</svg>'

open(OUT+'mydwell-mark.svg','w').write(svg(64,64,mark()))
open(OUT+'mydwell-mark-light.svg','w').write(svg(64,64,mark(ink=PAPER)))
open(OUT+'favicon.svg','w').write(svg(64,64,mark(ink=PAPER,bg=INK)))

def lockup(color=INK, accent=CORTEN, mark_ink=None, height=120):
    paths,wpx,upm=wordmark_paths(color, accent)
    # place: mark 64 units tall scaled to cap height; wordmark baseline aligned with the deck line
    cap=TTFont(F+'fraunces-latin-600-normal.woff2')['OS/2'].sCapHeight
    s=31.0/cap  # cap height of the wordmark = the wall height of the mark (31 units)
    mk=mark(ink=mark_ink or color)
    W=64+16+wpx*s; H=64
    body=f'<g>{mk}</g><g transform="translate(80 49.5) scale({s} {-s})">'+''.join(paths)+'</g>'
    return svg(round(W*height/H),height,body,vb=f"0 0 {W:.1f} {H}"), W
lk,LW=lockup(); open(OUT+'mydwell-logo.svg','w').write(lk)
lk2,_=lockup(color=PAPER, accent='#E2A27C', mark_ink=PAPER); open(OUT+'mydwell-logo-light.svg','w').write(lk2)
paths,wpx,upm=wordmark_paths(INK, CORTEN)
cap=TTFont(F+'fraunces-latin-600-normal.woff2')['OS/2'].sCapHeight; k=60/cap
open(OUT+'mydwell-wordmark.svg','w').write(svg(round(wpx*k)+4,86,f'<g transform="translate(2 66) scale({k} {-k})">'+''.join(paths)+'</g>'))
print('lockup width units', round(LW,1))
