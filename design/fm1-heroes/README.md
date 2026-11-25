# FM-1 homepage artwork

Reproducible Sharp compositions using original screenshots in `source/`, a vector template, and the site’s Space Grotesk Bold and DM Sans Medium fonts. Fonts are converted to outlines so exports render consistently without installed system fonts. No generative imagery or hand-edited pixels are used.

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm render:fm1-heroes
```

Edit `hero-template.svg` for the canvas, gradient, shadows and clipping. Edit `scripts/render-fm1-heroes.mjs` for typography, crop rectangles, window frames and positioning. Original screenshots remain versioned. Intermediate vector compositions go in ignored `generated/`.

Outputs retain the original 1.9:1 aspect ratio at twice the original resolution, 3040 × 1600, WebP quality 85. The renderer checks dimensions and fails if either output exceeds 200,000 bytes.

- `public/projects/fm1-web-hero.webp`
- `public/projects/fm1-mac-hero.webp`

The web flower is enlarged about 1.6×; its library panel is omitted. The Mac player is enlarged about 1.5× and sits in front of an inset library strip, with no protruding side edges. Taglines use 48px at the 1520px design width: about 19px at a 608px laptop card and 11px at a 346px mobile card. UI labels and the URL are contextual details, not marketing copy.

## Homepage review screenshots

The optional `scripts/capture-fm1-review.mjs` captures the actual local homepage FM-1 cards at 1440px and 390px. To run it on a machine with local browser support:

```bash
pnpm exec playwright install chromium
pnpm dev --port 4321
# In another terminal:
node scripts/capture-fm1-review.mjs before /absolute/review/output
pnpm render:fm1-heroes
node scripts/capture-fm1-review.mjs after /absolute/review/output
```

The Playwright development dependency is used only for optional review screenshots, not image regeneration. `CHROMIUM_EXECUTABLE_PATH` can select a system Chromium installation.
