import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const phase = process.argv[2];
const output = process.argv[3];
if (!['before', 'after'].includes(phase) || !output) {
  throw new Error('Usage: node scripts/capture-fm1-review.mjs before|after /absolute/output/directory');
}
await mkdir(output, { recursive: true });
const root = fileURLToPath(new URL('../', import.meta.url));
const browser = await chromium.launch({ headless: true, channel: 'chromium', executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined });
try {
  for (const [name, width] of [['laptop', 1440], ['mobile', 390]]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
    if (phase === 'before') {
      await page.route('**/projects/fm1-*-hero.webp', async route => {
        const variant = route.request().url().includes('fm1-web-') ? 'web' : 'mac';
        const body = await readFile(path.join(root, 'design/fm1-heroes/source', `${variant}-original.webp`));
        await route.fulfill({ contentType: 'image/webp', body });
      });
    }
    await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode()));
    });
    const cards = page.locator('.workbench-grid > .fm1');
    const bounds = await cards.evaluateAll(nodes => nodes.map(node => {
      const r = node.getBoundingClientRect();
      return { x: r.x + scrollX, y: r.y + scrollY, right: r.right + scrollX, bottom: r.bottom + scrollY };
    }));
    const x = Math.min(...bounds.map(b => b.x));
    const y = Math.min(...bounds.map(b => b.y));
    const right = Math.max(...bounds.map(b => b.right));
    const bottom = Math.max(...bounds.map(b => b.bottom));
    const clip = { x, y, width: right - x, height: bottom - y };
    await page.screenshot({ path: path.join(output, `fm1-${phase}-${name}.png`), clip });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) throw new Error(`${name}: horizontal page overflow`);
    console.log(`${phase} ${name}: cards ${clip.width}x${clip.height}; no horizontal overflow`);
    await page.close();
  }
} finally {
  await browser.close();
}
