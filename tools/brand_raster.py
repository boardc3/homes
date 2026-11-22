# Rasterise brand assets with headless Chrome: favicons/app icons from favicon.svg, and the 1200x630 social preview.
import asyncio, base64, os, sys
from playwright.async_api import async_playwright
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B=R+'/public/brand/'
fav=open(B+'favicon.svg').read()
logo_l=open(B+'mydwell-logo-light.svg').read()
hero=base64.b64encode(open(R+'/public/media/laguna-hero-dusk.jpg','rb').read()).decode()
OG=f'''<html><head><style>
@font-face{{font-family:F;src:url(data:font/woff2;base64,{base64.b64encode(open(R+"/node_modules/@fontsource/fraunces/files/fraunces-latin-600-normal.woff2","rb").read()).decode()})}}
html,body{{margin:0;width:1200px;height:630px;overflow:hidden;background:#14171A}}
.bg{{position:absolute;inset:0;background:url(data:image/jpeg;base64,{hero}) center 40%/cover}}
.sh{{position:absolute;inset:0;background:linear-gradient(0deg,rgba(10,12,13,.88) 0%,rgba(10,12,13,.6) 24%,rgba(10,12,13,0) 46%),linear-gradient(180deg,rgba(10,12,13,.55) 0%,rgba(10,12,13,0) 28%)}}
.lg{{position:absolute;left:56px;top:44px}}.lg svg{{height:62px;width:auto}}
.c{{position:absolute;left:56px;right:56px;bottom:46px;color:#F3F0E8;display:flex;flex-direction:column;gap:14px}}
h1{{margin:0;font:600 50px/1 F,Georgia,serif;letter-spacing:-.02em}}
p{{margin:0;font:600 15px ui-monospace,Menlo,monospace;letter-spacing:.16em;text-transform:uppercase;color:#E2A27C}}
</style></head><body><div class="bg"></div><div class="sh"></div><div class="lg">{logo_l}</div><div class="c"><h1>From bare ground to a real place.</h1><p>Frame to finish · Laguna Beach · Suburbs · The wild</p></div></body></html>'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        for n,sz in [('favicon-32',32),('apple-touch-icon',180),('icon-192',192),('icon-512',512)]:
            pg=await b.new_page(viewport={'width':sz,'height':sz})
            await pg.set_content(f'<html><body style="margin:0;background:transparent">{fav.replace("width=\"64\" height=\"64\"",f"width=\"{sz}\" height=\"{sz}\"")}</body></html>')
            await pg.screenshot(path=B+n+'.png',omit_background=True); await pg.close()
        pg=await b.new_page(viewport={'width':1200,'height':630}); await pg.set_content(OG); await pg.wait_for_timeout(600)
        await pg.screenshot(path=B+'og-image.jpg',type='jpeg',quality=88); await b.close()
asyncio.run(main())
