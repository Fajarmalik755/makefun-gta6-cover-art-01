// Publishes this entry for the grader: it copies app/ and screenshots/ from
// beside this file into the output folder and writes dossier.json there with
// the vendored make.fun helper. Run it with `node main.ts`. Outside the
// grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const ENTRY_DIR = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest refuse
// an entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files in app/ or 48 MiB of app files in all, or a
// path under app/ over 1000 bytes).
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyIfPresent(name: string): void {
  const from = join(ENTRY_DIR, name);
  if (!existsSync(from)) return;
  cpSync(from, join(OUTPUT_DIR, name), { recursive: true });
}

// Warns (but does not fail) when a screenshot is missing or over the
// scorer's 256 KiB cap, so a bad publish is visible before it is handed in.
function checkScreenshots(): void {
  const dir = join(OUTPUT_DIR, 'screenshots');
  if (!existsSync(dir)) {
    console.warn('No screenshots folder was published.');
    return;
  }
  for (const file of readdirSync(dir)) {
    const size = statSync(join(dir, file)).size;
    if (size > 262144) console.warn(`${file} is ${size} bytes, over the 256 KiB screenshot cap.`);
  }
  console.log(`Published ${readdirSync(dir).length} screenshots.`);
}

function publish(): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  copyIfPresent('app');
  mkdirSync(join(OUTPUT_DIR, 'screenshots'), { recursive: true });
  copyIfPresent('screenshots');
  checkScreenshots();
  const dossier = buildDossier(OUTPUT_DIR, DOSSIER_LIMITS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  console.log(`Published Sunset Coast Cover Studio to ${OUTPUT_DIR}`);
}

publish();
