# Homes — build presentation site

Scroll presentation of the Homes steel-tube platform and frame, from bare ground to the finished build.
All geometry (src/data/model.json, elev_*.svg, plan.svg) is exported from the model script, in inches.

- `src/scene.js` three.js scene shared by the hero, the build sequence and the film
- `film.html` + `src/film.js` deterministic frame-by-frame renderer used to make `public/media/homes-build.mp4`
- `tools/export_model.py` regenerates `src/data/*` from the model (needs the model script `views19.py`)
- `tools/rec.py` records the film frames from `npm run dev` (then ffmpeg → mp4)

Key numbers: gray living area 720.8 sq ft · entire platform 1,666.5 sq ft · 4 in. x 4 in. tube 1,391.9 ft · 3 in. x 2 in. tube 217.4 ft.

## Ship it

First time (Vercel project linked to this GitHub repo):

```
cd ~/claude/Projects/Renderer/Homes/repo
vercel link --yes --project homes
vercel git connect
```

Every time after (a push is a deploy once `vercel git connect` has run):

```
git add -A && git commit -m "update" && git push
```
