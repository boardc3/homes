# Homes — build presentation site

Live: https://homes-chris-ccolbertcoms-projects.vercel.app (Vercel project `homes`, deploys on every push to `main`).

One guided scroll story, then the technical set:

1. **Story** (`src/story.js`): a sticky stage driven only by scroll position (no zoom, no orbit). Chapter 1 bare ground with the
   staked footprint, chapter 2 the 10 frame steps with running tube totals, chapter 3 the enclosure (deck, walls, roofs, Corten
   spine), chapter 4 a crossfade into the photoreal rendering taken from the exact same camera (`CAM_A` = `refs/A_lake_ne.png`), then dusk.
2. **Renderings**: five conceptual renderings (nano_banana_pro, each locked to a massing reference rendered from the model).
3. **Film**: 29 s, 1080p30, rendered frame by frame from the model (`film.html` + `src/film.js`, recorded with `tools/rec.py`).
4. **3D model** (`src/viewer.js`): Beams / Realistic switch (crossfade), drag to turn, preset views, no zoom.
5. **Elevations, plan, drainage, numbers**: SVG projections and tables generated from `src/data/model.json`.

Data: `tools/export_model.py` writes `src/data/model.json`, `buildout.json`, `elev_*.svg`, `plan.svg` from the model script.
References for the renderings: `refs/` (rendered by `refs.html` + `src/refs.js`).

Layout: two 12 ft x 16 ft bedrooms in the 3 x 2 left block (its interior post moved into the partition at x = 147.5 in.), 16 ft x 24 ft living area in the 2 x 3 right block.

Key numbers: gray living area 720.8 sq ft · entire platform 1,666.5 sq ft · 4 in. x 4 in. tube 1,366.7 ft · 3 in. x 2 in. tube 217.4 ft.

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
