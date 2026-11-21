# Sunset Coast Cover Studio

An offline web app that builds GTA-style cover art from photos, layouts,
color grades and words. Pick a layout, drop in photos, tune the grade and
the text, then export the cover as a PNG.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a browser. Everything runs locally:
the photos, the fonts (Anton and Pacifico, under the SIL Open Font License
in `app/fonts/`) and the app itself need no network.

## What it does

- **4 layouts** — Classic Trio, Hero Left, Four Grid and Diagonal Split.
  Click a panel on the canvas to select it.
- **5 color grades** — Sunset, Neon, Noir, Vice and Pastel — washed over
  the panels.
- **Per-panel controls** — pick one of the 6 sample photos or upload your
  own, zoom, drag to pan, and add a short tag label. The Smart Crop button
  finds the focus point of the photo (brightness and contrast sampling, all
  on-device) and centers the crop there.
- **Cover text** — title, subtitle, quote, tagline, billing line, seal
  text and volume, all editable. Three presets (Sunset Heist, Neon Nights,
  Midnight Drive) set layout, grade and text in one click.
- **Undo / redo** and a **Hold to Compare** button that shows the bare
  photos while held.
- **PNG export** at 1080×1080, 1080×1350 and 1920×1080, or all three at
  once with Export All Sizes.

## Screenshots

`shots.json` lists the four shots: the bare cover at 1920×1080, the editor
at 1280×720, the cover at 1080×1350 and the square cover at 1080×1080.
Open `?shot=cover`, `?shot=cover45` or `?shot=coversq` for the bare cover
at those sizes; `window.__shotReady` becomes true once the scene has
painted.

## Publish

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` into the output folder and writes
`dossier.json` there.
