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

## Hosting and updates

Live site: https://suprlab.net/. Hosted on GitHub Pages from `slowphase/suprlab`.

Cloudflare DNS points the apex domain and `www` to `slowphase.github.io` using DNS-only CNAME records (Cloudflare flattens the apex record). GitHub Pages owns the custom-domain binding, issues the certificate and enforces HTTPS. `www` redirects to the apex domain.

The manual workflow in `.github/workflows/pages.yml` builds at `/` with `SITE_URL=https://suprlab.net`. Push source changes, then run **Publish suprlab** in GitHub Actions when the update is ready. Source pushes alone do not publish. The site uses canonical URLs and allows indexing.

A separate project-path build can be tested locally with `BASE_PATH=/suprlab/ SITE_URL=https://slowphase.github.io`; the previous GitHub preview URL now redirects to the custom domain.

Ghost remains on PikaPods as a fallback and has not been retired. The original DNS record and pre-cutover GitHub Pages settings are saved in the private, ignored `.migration/` directory. Do not retire the PikaPod or remove backups without the owner's instruction.

Ghost newsletter, membership and analytics services are not part of the static portfolio. The full original export remains the source backup.

## Reimport

```
python3 scripts/import-ghost.py /path/to/export.json
```

The importer downloads public media, includes only published public Project Journal articles selected in `src/data/selected-ghost-projects.json`, and regenerates the normalized content. Keep import extracts private. Full HTML content is preserved, with original scripts and inline event handlers removed for the static site.
