# Brand asset generation

Documentation brand assets are generated deterministically from HTML templates.

## Regenerate

```bash
node scripts/docs/render-brand-assets.mjs
```

Outputs:

| File | Dimensions | Purpose |
| --- | --- | --- |
| `social-preview.png` | 1280×640 | GitHub social preview |
| `readme-hero.png` | 1440×760 | README hero image |
| `og-docs.png` | 1200×630 | Documentation Open Graph image |

## Logo marks

| File | Theme |
| --- | --- |
| `cited-mark-light.svg` | Light backgrounds |
| `cited-mark-dark.svg` | Dark backgrounds |

Source mark: `public/cited-mark.svg`

## Design tokens

- Pamphlet Blue accent: `#5ce1e6`
- Ink: `#15131a`
- Paper: `#fbf7f0`

See the Cited brand system skill for full token law.

## Screenshots

Product screenshots:

```bash
npm run docs:screenshots
```

Live capture (requires running local instance):

```bash
CITED_DOCS_SCREENSHOT_LIVE=true npm run docs:screenshots
```
