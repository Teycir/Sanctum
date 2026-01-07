#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('node:fs');
const path = require('node:path');

const TIMESEAL_PATH = '/home/teycir/Repos/TimeSeal';
const DURESSVAULT_PATH = process.cwd();

const filesToCopy = [
  { src: 'lib/memoryProtection.ts', dest: 'lib/reusable/memoryProtection.ts' },
  { src: 'lib/cryptoUtils.ts', dest: 'lib/reusable/cryptoUtils.ts' },
  { src: 'lib/utils.ts', dest: 'lib/reusable/utils.ts' },
  { src: 'lib/qrcode.ts', dest: 'lib/reusable/qrcode.ts' },
  { src: 'lib/constants.ts', dest: 'lib/reusable/constants.ts' },
  { src: 'lib/ui/textAnimation.ts', dest: 'lib/reusable/ui/textAnimation.ts' },
  { src: 'lib/ui/hooks.ts', dest: 'lib/reusable/ui/hooks.ts' },
  { src: 'app/components/ui/button.tsx', dest: 'app/components/ui/button.tsx' },
  { src: 'app/components/ui/card.tsx', dest: 'app/components/ui/card.tsx' },
  { src: 'app/components/ui/input.tsx', dest: 'app/components/ui/input.tsx' },
  { src: 'app/components/ui/tooltip.tsx', dest: 'app/components/ui/tooltip.tsx' },
  { src: 'app/components/ui/dialog.tsx', dest: 'app/components/ui/dialog.tsx' },
  { src: 'app/components/ui/progress.tsx', dest: 'app/components/ui/progress.tsx' },
  { src: 'app/components/ui/badge.tsx', dest: 'app/components/ui/badge.tsx' },
  { src: 'app/components/ui/alert.tsx', dest: 'app/components/ui/alert.tsx' }
];

console.log('📦 Copying TimeSeal reusable code to Sanctum...\n');

let copied = 0;
let skipped = 0;

for (const { src, dest } of filesToCopy) {
  const srcPath = path.join(TIMESEAL_PATH, src);
  const destPath = path.join(DURESSVAULT_PATH, dest);

  if (!fs.existsSync(srcPath)) {
    console.log(`⚠️  Skipped: ${src} (not found)`);
    skipped++;
    continue;
  }

  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(srcPath, destPath);
  console.log(`✅ Copied: ${src} → ${dest}`);
  copied++;
}

console.log(`\n✨ Done! Copied ${copied} files, skipped ${skipped} files.`);
