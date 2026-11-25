import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'public/guides');
await mkdir(output, { recursive: true });
// Extract the complete front covers from the original three-page previews.
// The page rectangles exclude the preview's surrounding gutters and other pages.
const covers = [
  ['h1-pocket-guide', { left: 23, top: 23, width: 569, height: 867 }],
  ['mpc-gently', { left: 16, top: 16, width: 512, height: 781 }],
  ['shrub-gently', { left: 34, top: 34, width: 747, height: 1139 }],
  ['sloop-gently', { left: 0, top: 0, width: 533, height: 756 }],
  ['melodee-gently', { left: 39, top: 33, width: 748, height: 1140 }],
];
for (const [name, rectangle] of covers) {
  const info = await sharp(path.join(root, 'design/guides/source', `${name}.jpg`))
    .extract(rectangle)
    .resize({ height: 760, withoutEnlargement: true })
    .webp({ quality: 85, effort: 6 })
    .toFile(path.join(output, `${name}.webp`));
  console.log(`${name}: ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} KiB`);
}
