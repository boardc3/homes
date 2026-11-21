import asyncio,json
from playwright.async_api import async_playwright
# (name, eye x, eye y(north), eye z, target x, y, z, fov)   inches, model centre = 0,0
SHOTS={
 'A_lake_ne':    (  760,  880,  120,   -10,   0,  95, 40),
 'B_approach_sw':( -760, -820,   95,    10,  30, 100, 40),
 'C_aerial_s':   (  120,-1050,  760,    0,  60,  40, 40),
 'D_patio_nw':   ( -620,  700,  170,   -20,  60, 95, 42),
}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':1920,'height':1080})
        await pg.goto('http://localhost:4174/refs.html'); await pg.wait_for_function('window.__ready===true')
        for n,s in SHOTS.items():
            await pg.evaluate(f'window.__shot(1920,1080,{",".join(map(str,s))})'); await pg.wait_for_timeout(200)
            await pg.screenshot(path=f'/home/claude/site/refs/{n}.png')
        await b.close()
asyncio.run(main())
