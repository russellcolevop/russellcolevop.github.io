# russellcolevop.github.io

Personal landing site for Russell Cole. Single-page, no framework, no build step.

## Deploy

Push the `main` branch to `github.com/russellcolevop/russellcolevop.github.io`. GitHub Pages auto-serves from the repo root.

```bash
git push origin main
```

GitHub Pages settings: Settings → Pages → Source: Deploy from branch → Branch: main → / (root).

The site will be live at `https://russellcolevop.github.io` within a few minutes of push.

## Custom Domain (later)

1. Add a `CNAME` file in the repo root containing your domain (e.g. `russellcole.com`).
2. In GitHub Pages settings, enter the custom domain.
3. At your DNS registrar, add:
   - `A` records pointing to GitHub Pages IPs: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Or a `CNAME` record pointing `www` to `russellcolevop.github.io`
4. Enable "Enforce HTTPS" in GitHub Pages settings once DNS propagates.

## Swap the OG Image

Replace `assets/og-image.png` with a 1200×630 PNG. The source SVG is at `assets/og-image.svg` — edit it and regenerate:

```bash
npx svgexport assets/og-image.svg assets/og-image.png 1200:630
```

## Add LinkedIn URL

In `index.html`, find the LinkedIn link (search for `linkedin`) and replace `href="#"` with your LinkedIn profile URL.

## Update Build Time Footer

In `index.html`, find `under [N] hours` in the footer and replace `[N]` with the actual build time.

## Update GitHub Source Link

The footer links to `https://github.com/russellcolevop/russellcolevop.github.io` — update if the repo URL changes.

## Tech Stack

- HTML5, no framework, no build step
- Tailwind CSS via CDN
- Inter + Source Serif 4 via Google Fonts (async, non-render-blocking)
- Inline JS only: AGV banner date check, scroll fade-in with `prefers-reduced-motion` guard
