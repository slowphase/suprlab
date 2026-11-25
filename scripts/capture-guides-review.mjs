import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const [phase, url, output] = process.argv.slice(2);
if (!['before', 'after'].includes(phase) || !url || !output) {
  throw new Error('Usage: node scripts/capture-guides-review.mjs before|after URL OUTPUT');
}
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chromium', executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined });
try {
  for (const [name, width] of [['desktop', 1440], ['laptop', 1100], ['tablet', 768], ['mobile', 390], ['narrow', 320]]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      for (const image of document.images) image.loading = 'eager';
      await document.fonts.ready;
      await Promise.all([...document.images].map(image => image.decode()));
    });
    if (await page.locator('.guide-card').count() !== 5) throw new Error(`${phase}/${name}: expected five guide cards`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) throw new Error(`${phase}/${name}: horizontal overflow`);
    if (phase === 'after') {
      const state = await page.evaluate(() => {
        const sections = [...document.querySelectorAll('.guide-section')];
        const cards = [...document.querySelectorAll('.guide-card')];
        const rect = node => { const r = node.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, bottom:r.bottom }; };
        return {
          headings: sections.map(section => section.querySelector('.section-heading h2').textContent),
          groups: sections.map(section => [...section.querySelectorAll('.guide-card')].map(card => card.dataset.guide)),
          colours: cards.map(card => getComputedStyle(card).backgroundColor),
          frames: cards.map(card => getComputedStyle(card.querySelector('.guide-cover-frame')).backgroundColor),
          covers: cards.map(card => { const image = card.querySelector('img'); return image.complete && image.naturalWidth > 0 && getComputedStyle(image).objectFit === 'contain'; }),
          cards: cards.map(rect),
          framesGeometry: cards.map(card => rect(card.querySelector('.guide-cover-frame'))),
          contentGeometry: cards.map(card => rect(card.querySelector('.guide-card-content'))),
          coversGeometry: cards.map(card => rect(card.querySelector('.guide-cover'))),
          format: cards.map(card => card.querySelector('.guide-format').textContent.trim()),
          text: document.querySelector('main').textContent,
        };
      });
      if (JSON.stringify(state.groups) !== JSON.stringify([['melodee-gently','shrub-gently','sloop-gently','h1-pocket-guide'],['mpc-gently']])) throw new Error('Incorrect grouping or order');
      if (JSON.stringify(state.headings) !== JSON.stringify(['For the M-VAVE FM-1','For the Akai MPC Sample'])) throw new Error('Incorrect section headings');
      if (new Set([...state.colours, ...state.frames]).size !== 1) throw new Error('Card and cover surfaces must share one charcoal colour');
      if (!state.covers.every(Boolean)) throw new Error('A cover is missing or cropped');
      if (state.format.join('|') !== 'PDF · 8 lessons|PDF · 8 lessons|PDF · 44 pages|PDF · 16 instruments|PDF · 8 lessons') throw new Error('Incorrect guide tags');
      if (state.text.includes('—')) throw new Error('Unexpected em dash');
      const [melodee, shrub, sloop, h1, mpc] = state.cards;
      if (width > 1000) {
        if (Math.abs(melodee.y - shrub.y) > 1 || Math.abs(sloop.y - h1.y) > 1 || sloop.y <= melodee.y) throw new Error('Expected a two-by-two FM-1 grid');
        if (Math.abs(mpc.width - melodee.width) > 1 || Math.abs(mpc.x - melodee.x) > 1) throw new Error('MPC card must remain half-width and left aligned');
      } else if (state.cards.some(card => Math.abs(card.x - melodee.x) > 1)) throw new Error('Expected a single mobile column');
      for (let i = 0; i < state.cards.length; i++) {
        const frame = state.framesGeometry[i];
        const content = state.contentGeometry[i];
        const cover = state.coversGeometry[i];
        if (width > 520) {
          if (frame.x + frame.width > content.x + 1 || Math.abs(frame.y - content.y) > 1) throw new Error(`${name}: expected cover left of text`);
        } else if (frame.bottom > content.y + 1) throw new Error(`${name}: expected cover stacked above text`);
        if (cover.x < frame.x - 1 || cover.x + cover.width > frame.x + frame.width + 1 || cover.y < frame.y - 1 || cover.bottom > frame.bottom + 1) throw new Error(`${name}: cover extends outside its frame`);
      }
      console.log(`${name}: covers, groups, colours, tags, horizontal/stacked layout and card width verified`);
    }
    await page.screenshot({ path: path.join(output, `guides-${phase}-${name}.png`), fullPage: true });
    console.log(`${phase}/${name}: screenshot captured at ${width}px, no horizontal overflow`);
    await page.close();
  }
} finally {
  await browser.close();
}
