import sharp from 'sharp';
import opentype from 'opentype.js';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const design = path.join(root, 'design/fm1-heroes');
const generated = path.join(design, 'generated');
await mkdir(generated, { recursive: true });
const bold = opentype.loadSync(path.join(root, 'src/styles/fonts/font-7.ttf'));
const medium = opentype.loadSync(path.join(root, 'src/styles/fonts/font-1.ttf'));
const text = (value, x, y, size, fill = '#f8f6f1', font = medium) =>
  font.getPath(value, x, y, size).toSVG(3).replace('<path ', `<path fill="${fill}" `);
const crop = async (source, region) => sharp(path.join(design, 'source', source))
  .extract(region).png().toBuffer();
const images = {
  flower: await crop('web-original.webp', { left: 354, top: 207, width: 340, height: 340 }),
  keys: await crop('web-original.webp', { left: 91, top: 631, width: 865, height: 115 }),
  player: await crop('mac-original.webp', { left: 833, top: 345, width: 594, height: 374 }),
  library: await crop('mac-original.webp', { left: 258, top: 106, width: 870, height: 175 }),
};
const image = (key, x, y, width, height, clip, preserve = 'none') =>
  `<image x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="${preserve}" ${clip ? `clip-path="url(#${clip})"` : ''} xlink:href="data:image/png;base64,${images[key].toString('base64')}"/>`;
const lights = (x, y) => ['#ff6058', '#ffbd2e', '#28c840'].map((fill, index) =>
  `<circle cx="${x + index * 22}" cy="${y}" r="6.5" fill="${fill}"/>`).join('');
const copy = variant => {
  const lines = variant === 'web' ? ['Turn the knobs.', 'Right in your', 'browser.'] : ['Your firmware', 'library, at home', 'on your Mac.'];
  return text(variant === 'web' ? 'IN YOUR BROWSER' : 'AT HOME ON macOS', 72, 165, 22, '#dfebeb') +
    `<g transform="translate(27 0) skewX(-7)">${text('FM-1', 72, 299, 126, '#f8f6f1', bold)}${text('Pocket', 72, 414, 126, '#f8f6f1', bold)}</g>` +
    '<rect x="72" y="452" width="66" height="5" fill="#ff914f"/>' +
    lines.map((line, index) => text(line, 72, 520 + index * 58, 48)).join('');
};
const web = `<g filter="url(#shadow)"><rect x="592" y="53" width="880" height="694" rx="16" fill="#1b1a1f"/></g>
<g clip-path="url(#web-frame)"><rect x="592" y="53" width="880" height="48" fill="#29363a"/>
<circle cx="616" cy="77" r="4.5" fill="#90b6b9"/><circle cx="634" cy="77" r="4.5" fill="#90b6b9" opacity=".6"/><circle cx="652" cy="77" r="4.5" fill="#90b6b9" opacity=".35"/>
<rect x="680" y="63" width="765" height="28" rx="7" fill="#19282d"/>
${text('slowphase.github.io/fm1-pocket-player', 731, 83, 19, '#c9dddd')}
${image('flower', 760, 121, 542, 486, 'flower-frame', 'xMidYMid slice')}
${image('keys', 612, 614, 840, 112, 'keys-frame')}
</g><rect x="593" y="54" width="878" height="692" rx="15" fill="none" stroke="#ffffff" stroke-opacity=".12" stroke-width="2"/>`;
const mac = `<g filter="url(#shadow)"><rect x="626" y="83" width="795" height="540" rx="13" fill="#252426"/></g>
<g clip-path="url(#library-frame)"><rect x="626" y="83" width="795" height="46" fill="#333335"/>${lights(651,106)}
${text('All Firmware', 728, 113, 18)}${text('246 instruments', 1255, 112, 15, '#b7b3bb')}
${image('library', 626, 129, 795, 160, 'library-frame')}</g>
<g filter="url(#shadow)"><rect x="580" y="151" width="895" height="609" rx="14" fill="#1b1a1f"/></g>
<g clip-path="url(#mac-frame)"><rect x="580" y="151" width="895" height="45" fill="#333335"/>${lights(605,174)}
${text('FM-1 Pocket', 682, 181, 18)}${image('player', 580, 196, 895, 564, 'mac-frame')}</g>
<rect x="581" y="152" width="893" height="607" rx="13" fill="none" stroke="#ffffff" stroke-opacity=".12" stroke-width="2"/>`;

const template = await readFile(path.join(design, 'hero-template.svg'), 'utf8');
for (const variant of ['web', 'mac']) {
  const palette = variant === 'web' ? ['#286770','#20535a','#163d43'] : ['#765093','#563b70','#34293f'];
  let svg = template.replace('{{COPY}}', copy(variant)).replace('{{INTERFACE}}', variant === 'web' ? web : mac);
  for (const [index, name] of ['LIGHT', 'MID', 'DARK'].entries()) svg = svg.replace(`{{${name}}}`, palette[index]);
  if (svg.includes('{{')) throw new Error(`Unresolved template token in ${variant}`);
  await writeFile(path.join(generated, `${variant}.svg`), svg);
  const output = path.join(root, `public/projects/fm1-${variant}-hero.webp`);
  await sharp(Buffer.from(svg)).webp({ quality: 85, effort: 6 }).toFile(output);
  const metadata = await sharp(output).metadata();
  const bytes = (await stat(output)).size;
  if (metadata.width !== 3040 || metadata.height !== 1600 || bytes >= 200_000) {
    throw new Error(`${variant}: unexpected output: ${metadata.width}x${metadata.height}, ${bytes} bytes`);
  }
  console.log(`${variant}: ${metadata.width}x${metadata.height}, ${(bytes / 1024).toFixed(1)} KiB`);
}
