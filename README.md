# MyDwell — build presentation site (repo: homes)

Live: https://www.mydwell.io (Vercel project `homes`, deploys on every push to `main`).

One guided scroll story, then the technical set:

1. **Story** (`src/story.js`): a sticky stage driven only by scroll position (no zoom, no orbit). Chapter 1 bare ground with the
   staked footprint, chapter 2 the 10 frame steps with running tube totals, chapter 3 the enclosure (deck, walls, roofs, Corten
   spine), chapter 4 a crossfade into the photoreal rendering taken from the exact same camera (`CAM_A` = `refs/A_lake_ne.png`), then dusk.
2. **Spaces (right-scroll)** (`src/more.js`): after the story, vertical scroll pans RIGHT through 12 finished views (Laguna at sunset, night and morning fog; living room, kitchen and bedroom interiors; patio; a denser suburban street by day and evening, backyard, aerial; the mountain lake). Phones get a swipe carousel.
2b. **Renderings**: two settings (Laguna Beach default, mountain lake) with a switch; the story's closing shot has the same switch. Conceptual renderings (nano_banana_pro, each locked to a massing reference rendered from the model).
3. **Film**: 21.4 s, 1080p30, MyDwell-branded, rendered frame by frame from the model (`film.html` + `src/film.js`, recorded with `tools/rec.py`).
4. **3D model** (`src/viewer.js`): Beams / Realistic switch (crossfade), drag to turn, preset views, no zoom.
5. **Elevations, plan, drainage, numbers**: SVG projections and tables generated from `src/data/model.json`.

Data: `tools/export_model.py` writes `src/data/model.json`, `buildout.json`, `elev_*.svg`, `plan.svg` from the model script.
References for the renderings: `refs/` (rendered by `refs.html` + `src/refs.js`).

Layout: living area in the wider 3 x 2 left block (frame as designed, behind the patio); two 16 ft x 12 ft bedrooms in the deeper 2 x 3 right block, split at y = 147.5 in. with the interior and east posts moved onto that line. Glass on every exterior wall.

Key numbers: gray living area 720.8 sq ft · entire platform 1,666.5 sq ft · 4 in. x 4 in. tube 1,355.2 ft · 3 in. x 2 in. tube 217.4 ft.

## Link previews (iMessage, Slack, social)

- `og:video` → `public/media/mydwell-preview.mp4` (10.8 s, 1280x720 H.264, 2.5 MB, silent): the MyDwell lockup over the platform and frame going up, then Laguna at sunset, the suburban street, the lake and the living room. Messages plays a direct MP4 inline and loops it; icon + image + video must stay under 10 MB total.
- `og:image` → `public/brand/og-image.jpg` (1200x630), the fallback still. Icon → `apple-touch-icon.png`.
- All preview URLs are absolute to `https://www.mydwell.io`. Change BASE in index.html if a custom domain is added.
- Rebuild the clip: `npm run dev -- --port 4174`, then `python3 tools/recpreview.py`, then ffmpeg (see that script).
- **Previews need the site to be public.** With Vercel Authentication on, Messages' preview fetcher gets the Vercel login page instead of these tags.

## Brand — MyDwell

- **Mark**: the house's north elevation drawn as one line: the wider, flatter living-block roof on the left, the Corten spine (rust bar), the narrower sloped bedroom roof on the right, standing on one deck line. Its silhouette reads as an "M".
- **Wordmark**: "My" in Fraunces Italic 400 (Corten), "Dwell" in Fraunces 600 (ink), outlined to paths in `public/brand/*.svg` (Fraunces is SIL Open Font License).
- **Colours**: Ink #14171A · Paper #F3F0E8 · Corten #9C4A26 · Pacific #1F5F73 · Sage #7F8C6E · Sand #D9CBB0.
- **Type**: Fraunces for display, system sans for body, system mono for labels.
- **Files**: `public/brand/` — mydwell-logo(.svg / -light), mydwell-mark, mydwell-wordmark, favicon.svg / -32.png, apple-touch-icon, icon-192/512, og-image.jpg (1200x630, used for Open Graph + Twitter). Regenerate with `python3 tools/brand.py && python3 tools/brand_raster.py`.

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
