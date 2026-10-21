/**
 * Generate macOS (.icns) and Windows (.ico) icons from build/icon.png.
 * Run on macOS: `npm run icons`. The generated files are committed so
 * packaging on Windows does not need this script.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import pngToIco from 'png-to-ico';

const buildDir = path.resolve('build');
const source = path.join(buildDir, 'icon.png');
const tmpDir = path.join(buildDir, '.icon-tmp');

await fs.access(source);

await fs.rm(tmpDir, { recursive: true, force: true });
await fs.mkdir(tmpDir, { recursive: true });

// ICO entries are capped at 256×256; larger sizes must not be embedded.
const sizes = [16, 32, 48, 64, 128, 256];
const pngs = [];
for (const size of sizes) {
  const out = path.join(tmpDir, `${size}.png`);
  execFileSync('sips', ['-z', String(size), String(size), source, '--out', out], {
    stdio: 'ignore',
  });
  pngs.push(out);
}

const ico = await pngToIco(pngs);
await fs.writeFile(path.join(buildDir, 'icon.ico'), ico);

const iconset = path.join(buildDir, 'icon.iconset');
await fs.rm(iconset, { recursive: true, force: true });
await fs.mkdir(iconset, { recursive: true });
const icnsSizes = [
  [16, 16],
  [16, 32],
  [32, 32],
  [32, 64],
  [128, 128],
  [128, 256],
  [256, 256],
  [256, 512],
  [512, 512],
  [512, 1024],
];
for (const [base, actual] of icnsSizes) {
  const name = `icon_${base}x${base}${actual === base * 2 ? '@2x' : ''}.png`;
  execFileSync('sips', ['-z', String(actual), String(actual), source, '--out', path.join(iconset, name)], {
    stdio: 'ignore',
  });
}
execFileSync('iconutil', ['-c', 'icns', iconset, '-o', path.join(buildDir, 'icon.icns')]);

// Keep the in-app brand mark and favicon in sync with the app icon.
const assetDir = path.resolve('src/assets');
const publicDir = path.resolve('public');
await fs.mkdir(assetDir, { recursive: true });
await fs.mkdir(publicDir, { recursive: true });
execFileSync('sips', ['-z', '384', '384', source, '--out', path.join(assetDir, 'app-icon.png')], {
  stdio: 'ignore',
});
execFileSync('sips', ['-z', '256', '256', source, '--out', path.join(publicDir, 'favicon.png')], {
  stdio: 'ignore',
});

await fs.rm(tmpDir, { recursive: true, force: true });
await fs.rm(iconset, { recursive: true, force: true });
console.log('Generated build/icon.ico, build/icon.icns, src/assets/app-icon.png, public/favicon.png');
