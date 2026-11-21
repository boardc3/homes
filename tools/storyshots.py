import asyncio,sys
from playwright.async_api import async_playwright
W,H,tag=int(sys.argv[1]),int(sys.argv[2]),sys.argv[3]
PS=[0,.04,.10,.22,.35,.50,.58,.64,.70,.75,.79,.84,.875,.90,.94,.99]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg=await b.new_page(viewport={'width':W,'height':H}); errs=[]
        pg.on('pageerror',lambda e: errs.append(str(e)))
        pg.on('response',lambda r: errs.append(f'{r.status} {r.url}') if r.status>=400 else None)
        await pg.goto('http://localhost:4173/'); await pg.wait_for_timeout(1500)
        for i,pr in enumerate(PS):
            await pg.evaluate(f"(()=>{{const s=document.getElementById('story');window.scrollTo({{top:s.offsetTop+{pr}*(s.offsetHeight-innerHeight),behavior:'instant'}})}})()")
            await pg.wait_for_timeout(1300)
            await pg.screenshot(path=f'/tmp/st_{tag}_{i:02d}.jpg',type='jpeg',quality=70)
        print(tag, errs or 'no errors'); await b.close()
asyncio.run(main())
