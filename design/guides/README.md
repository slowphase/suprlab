# Guide covers

The JPGs in `source/` are the original GitHub preview images. Each contains the full front cover as its first page. `scripts/render-guide-covers.mjs` extracts that page without re-creating the design, then exports a WebP up to 760px high at quality 85.

Regenerate from the repository root:

```bash
pnpm render:guide-covers
```

The extraction rectangles are explicit because each source preview has different gutters. The complete cover is retained. The page displays it with `object-fit: contain` in a fixed-height neutral charcoal area, rather than cropping it to a landscape thumbnail.

## Sources

| Guide | Original preview |
| --- | --- |
| H1 Pocket Guide | https://github.com/slowphase/h1-pocket-guide/blob/main/previews/look-inside.jpg |
| MPC, gently | https://github.com/slowphase/mpc-gently/blob/main/previews/look-inside.jpg |
| SHRUB, gently | https://github.com/slowphase/shrub-gently/blob/main/previews/look-inside.jpg |
| SLOOP, gently | https://github.com/slowphase/sloop-gently/blob/main/previews/look-and-feel.jpg |
| Melodee, Gently | https://github.com/slowphase/melodee-gently/blob/main/previews/look-inside.jpg |

Credits and licences remain with the respective guides. H1's original text and artwork are by Jake Handy.

## Guide data

`src/data/guides.json` is the single source for titles, descriptions, device, device label, ordering, format, length, links and cover metadata. Cards are grouped by `device` and sorted by `order`; adding another guide to either existing device automatically puts it in the right section.

The guide counts were checked against each repository's README. MPC, Melodee and SHRUB each have eight lessons. H1 covers sixteen instruments. SLOOP's 44-page length refers to the A4 PDF; its iPad PDF uses 114 screens for the same content. The compact card tag shows `PDF · 44 pages` as approved.
