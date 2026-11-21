import asyncio,sys,time,os
from playwright.async_api import async_playwright
FPS=24; W,H=1280,720
a,b=int(sys.argv[1]),int(sys.argv[2])   # frame range (b=-1 → all)
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await br.new_page(viewport={'width':W,'height':H})
        await pg.goto('http://localhost:4174/film.html'); await pg.wait_for_function('window.__ready===true')
        await pg.evaluate(f'window.__size({W},{H})')
        total=await pg.evaluate('window.__total'); n=int(total*FPS)
        print('total',total,'frames',n,flush=True)
        e=n if b<0 else min(b,n)
        os.makedirs('/tmp/frames',exist_ok=True); t0=time.time()
        for i in range(a,e):
            await pg.evaluate(f'window.__film({i/FPS})')
            await pg.screenshot(path=f'/tmp/frames/f{i:04d}.jpg',type='jpeg',quality=90)
        print('done',a,e,round(time.time()-t0,1),'s',flush=True)
        await br.close()
asyncio.run(main())
