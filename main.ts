// Sunset Coast Cover Studio — the hand-in program for the gta6-cover-art-01 bounty.
// Node 22, standard library only. It copies this directory's app/ and screenshots/
// beside it into the output directory (MAKEFUN_OUTPUT_DIR, or /output by default)
// and writes dossier.json there with the vendored make.fun library, so the judge
// can read the entry back deterministically.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The directory this file lives in: app/ and screenshots/ sit beside it.
const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast with a plain message when the entry is incomplete, instead of
// letting the copy or the dossier build fail halfway through.
if (!existsSync(join(here, 'app', 'index.html'))) {
  throw new Error('main.ts: app/index.html is missing — the app cannot be handed in without its page');
}

// The scorer's own caps, from the bounty's gate: only text_max_bytes shapes the
// dossier's bytes; the others refuse an entry the scorer would refuse anyway
// (more than 4 screenshots, or one over 256 KiB; more than 993 files in app/
// or 48 MiB of app files in all, or a path under app/ over 1000 bytes).
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, CAPS));
console.log(`Sunset Coast Cover Studio handed in to ${outDir}`);
