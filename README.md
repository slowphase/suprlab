# suprlab

An Astro portfolio for slowphase. This repository holds the suprlab Astro portfolio, hosted on GitHub Pages. The domain switch to https://suprlab.net is approved. Keep the existing Ghost/PikaPods instance running until the switch has been verified.

## Content

- Two lead projects: slot.advance and FM-1 Pocket Player.
- One bundle of four GitHub guides.
- One bundle of two original Ghost project journals: AWTRIX and Endgame Switch Lite.
- Only AWTRIX and Endgame Switch Lite are included from Ghost. All other articles and the old Ghost pages are excluded; About is a new portfolio introduction.
- Original project article slugs, publication/update dates, tag names/slugs and author archive retained.
- Project media is kept locally; unused media is held in the ignored private migration backup. Drafts, members, account data and settings are excluded from site source.

The Ghost archive is unchanged in Downloads. A private working extract and detailed import report are in the ignored `.migration/` directory. Never upload that directory or the original export to a public repository.

## Editing

`src/pages/index.astro` is the homepage. Lead project pages are in `src/pages/projects/`; guide links are in `src/data/guides.json`. Project articles are in `src/data/posts.json`. Shared styling is in `src/styles/global.css`.

## Local use

Node 22.12+ (Node 24 LTS recommended) and pnpm 11.

```
pnpm install
pnpm dev
pnpm build
pnpm preview
```

`ASTRO_TELEMETRY_DISABLED=1` disables Astro telemetry. The output is a static site in `dist/`. There is no server, database or runtime GitHub dependency.

## Future GitHub Pages hosting

Target repository: `slowphase/suprlab` (already exists). Publication on suprlab.net and its DNS switch are approved.

A project preview can be built with `BASE_PATH=/suprlab/ SITE_URL=https://slowphase.github.io`. The eventual domain build uses the default root path and `https://suprlab.net`. The domain, canonical metadata, indexing, RSS and old pagination paths need a final cutover review before going live. The approved domain build uses canonical URLs and allows indexing. The custom domain is configured in GitHub Pages settings.

A manually triggered Pages workflow is prepared in `.github/workflows/pages.yml`; it has no push trigger. Running it publishes and requires approval. Keep Ghost online until a full route/media audit and domain switch are approved.

Ghost newsletter, membership and analytics services are not part of the static portfolio. The full original export remains the source backup.

## Reimport

```
python3 scripts/import-ghost.py /path/to/export.json
```

The importer downloads public media, includes only published public Project Journal articles selected in `src/data/selected-ghost-projects.json`, and regenerates the normalized content. Keep import extracts private. Full HTML content is preserved, with original scripts and inline event handlers removed for the static site.
