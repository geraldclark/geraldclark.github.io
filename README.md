# Gerald Clark — Portfolio

Static Astro site published from this repository to GitHub Pages at [gerald-clark.com](https://gerald-clark.com).

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

Output is written to `dist/`. Content lives in `src/data/portfolio.json`.

## Deploy (GitHub Pages)

Publishing uses **GitHub Actions** (not “Deploy from a branch”).

1. Repo **Settings → Pages → Build and deployment → Source**: choose **GitHub Actions**.
2. Push to `main` (or run the **Deploy to GitHub Pages** workflow manually).
3. Confirm `public/CNAME` contains `gerald-clark.com` so the custom domain stays attached.

The workflow builds Astro and uploads `dist/` as the Pages artifact.
