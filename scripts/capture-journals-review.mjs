import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [phase, origin, output = 'review'] = process.argv.slice(2);
if (!['before', 'after'].includes(phase) || !origin) throw new Error('Usage: node scripts/capture-journals-review.mjs before|after ORIGIN OUTPUT');
const slugs = ['endgame-switch-lite', 'turning-the-ulanzi-tc001-into-a-proper-ambient-display-with-awtrix'];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chromium' });
const report = [];
try {
  for (const [name, width] of [['desktop',1440],['tablet',768],['mobile',390],['narrow',320]]) {
    for (const slug of slugs) {
      const page = await browser.newPage({ viewport:{width,height:1000},deviceScaleFactor:1 });
      const failedMedia = [];
      page.on('response', response => {
        if (response.url().startsWith(origin) && response.url().includes('/content/images/') && response.status() >= 400) failedMedia.push(response.url());
      });
      await page.goto(`${origin}/${slug}/`, {waitUntil:'networkidle'});
      await page.evaluate(async()=>{
        for (const image of document.images) image.loading='eager';
        await document.fonts.ready;
        await Promise.all([...document.images].map(image=>image.decode()));
      });
      if (failedMedia.length) throw new Error(`Missing local media: ${failedMedia.join(', ')}`);
      const state = await page.evaluate(()=>{
        const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right};};
        return {
          overflow:document.documentElement.scrollWidth>innerWidth,
          h1:document.querySelectorAll('h1').length,
          images:[...document.images].map(e=>({loaded:e.complete&&e.naturalWidth>0,alt:e.alt})),
          videos:[...document.querySelectorAll('.kg-embed-card iframe')].map(rect),
          article:rect(document.querySelector('.prose')),
          gallery:[...document.querySelectorAll('.kg-gallery-image img')].map(rect),
          disclosure:document.querySelector('.code-disclosure')?.open,
        };
      });
      if(state.overflow)throw new Error(`${phase}/${slug}/${name}: page overflow`);
      if(!state.images.every(e=>e.loaded))throw new Error('Image failed to load');
      if(phase==='after'){
        if(state.h1!==1)throw new Error('Expected one page title');
        if(!state.images.every(e=>e.alt.trim()))throw new Error('Missing image description');
        for(const video of state.videos){
          if(Math.abs(video.width-state.article.width)>1||Math.abs(video.width/video.height-16/9)>.01)throw new Error('Video must fill the reading column at 16:9');
        }
        if(state.gallery.length){
          const [left,right]=state.gallery;
          if(Math.abs(left.y-right.y)>1||left.right>right.x||state.gallery.some(e=>e.height>521))throw new Error('Expected two bounded, side-by-side screenshots');
          if(await page.locator('.gallery-image-link').count()!==2)throw new Error('Screenshots need full-size links');
          if(state.disclosure!==false)throw new Error('Code should start collapsed');
        }
      }
      const prefix=slug==='endgame-switch-lite'?'switch':'ulanzi';
      await page.screenshot({path:path.join(output,`${prefix}-${phase}-${name}.png`),fullPage:true});
      if(phase==='after'&&state.gallery.length){
        await page.locator('.code-disclosure summary').click();
        const code=await page.locator('.code-disclosure pre').evaluate(e=>({height:e.clientHeight,scrollHeight:e.scrollHeight,font:parseFloat(getComputedStyle(e.querySelector('code')).fontSize),overflow:getComputedStyle(e).overflowY}));
        if(code.height>(width<=560?420:560)||code.scrollHeight<=code.height||code.font<14||code.overflow!=='auto')throw new Error('Expanded code must be readable and scroll within a bounded panel');
        await page.locator('.code-disclosure').screenshot({path:path.join(output,`code-after-${name}.png`)});
      }
      report.push({phase,slug,name,width,...state});
      console.log(`PASS ${phase}/${prefix}/${name}: images, overflow${phase==='after'?', headings, video/gallery and code layout':''}`);
      await page.close();
    }
  }
  await writeFile(path.join(output,`journals-${phase}.json`),JSON.stringify(report,null,2));
}finally{await browser.close();}
