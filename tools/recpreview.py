import asyncio,os,time
from playwright.async_api import async_playwright
FPS=30; W,H=1280,720
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':W,'height':H})
        await pg.goto('http://localhost:4174/preview.html'); await pg.wait_for_function('window.__ready===true && !!window.__pv')
        await pg.evaluate(f'window.__size({W},{H})')
        await pg.wait_for_function("[...document.images].every(i=>i.complete && i.naturalWidth>0)")
        T=await pg.evaluate('window.__ptotal'); n=int(T*FPS); os.makedirs('/tmp/pv',exist_ok=True)
        for i in range(n):
            await pg.evaluate(f'window.__pv({i/FPS})')
            await pg.screenshot(path=f'/tmp/pv/f{i:04d}.jpg',type='jpeg',quality=92)
        print('frames',n,'total',T); await b.close()
asyncio.run(main())
