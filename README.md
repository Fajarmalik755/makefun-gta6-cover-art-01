# Sunset Coast Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/Fajarmalik755/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/Fajarmalik755/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your crew photos into a 16:9 movie-poster cover — a multi-panel grid with a
hero close-up, a huge striped sunset title, a neon script subtitle, stars and a
press quote, a tagline ribbon, a billing block, a barcode, a gold seal and a
volume badge. Everything runs offline in the browser: your photos never leave
your device.

## What it does

- **4 layouts** — Hero Six (hero + 5 panels), Hero Four (hero + 3), Full Bleed (one photo), Nine Grid (3×3), with slanted dividers and thin light gutters.
- **5 grades** — Sunset, Neon, Noir, Heatwave, Miami Pastel, built from canvas filters plus warm overlays, grain and a vignette.
- **Per-panel editing** — click a panel to select it, upload your own photo into it, drag to pan, zoom slider, an on-device "Smart crop" heuristic (downscales the photo and scores skin tones + edge density to find the subject — labelled honestly as a heuristic), and "Apply photo to all panels".
- **All text editable** — title, subtitle, press quote, tagline ribbon, billing block, seal and volume badge, plus a cast tag per panel. The preview redraws live on every change.
- **3 named preset looks** — Golden Getaway, Neon Nights, Last Resort.
- **Undo / redo** and a hold-to-preview **Before** button that hides the grades and text to show the raw photos.
- **Export** — 1080×1080, 1080×1350 and 1920×1080 PNGs, or all three at once, rendered at full resolution on an offscreen canvas.

Default cover copy (all original wording): title **GOLDEN HOUR HEIST**,
subtitle **Chasing the Last Light**, press quote **FULL THROTTLE INTO THE SUNSET**,
tagline **SIX CREW · ONE COAST · NO WAY BACK**, cast tags THE DRIVER / THE BOSS /
THE FIXER / THE CAPTAIN / THE LOOKOUT / THE GETAWAY, billing
**A SUNSET COAST PICTURE · STARRING YOUR CREW · SHOT ON YOUR OWN CAMERA · GRADED AT SUNSET**,
seal **BEST CAST**, **VOL. 1**, **COMING SOON**.

## How to run it

No build step, no network — just static files. Node 22 is enough:

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `app/` with any static server (for example `python3 -m http.server`
from inside `app/`).

Screenshot scenes (used for the entry's screenshots):

- `?shot=cover` — cover only, 16:9
- `?shot=editor` — full editor UI with the default cast loaded
- `?shot=cover45` — cover only, 4:5
- `?shot=coversq` — cover only, 1:1

## Handing it in

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and
writes `dossier.json` there with the vendored make.fun library.

## Bounty

This entry is for the [gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).
Referral code: `25xq9bc4`.

## Notes

- The six sample photos in `app/samples/` were made for make.fun with an image model and are free to use.
- Fonts (Anton, Pacifico) are bundled under `app/fonts/` under the SIL Open Font License.
- No Rockstar Games logo, artwork or fonts are used anywhere in this app.
