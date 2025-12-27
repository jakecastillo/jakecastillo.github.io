# jakecastillo.github.io

Personal portfolio site built with Next.js (App Router) and statically exported for GitHub Pages.

- Live site: `https://jakecastillo.github.io`
- Framework: Next.js static export (`output: "export"`)
- Styling/UX: Tailwind CSS v4, Framer Motion animations, dark/light theme toggle

## What’s in here

- Pages: Home, About, Experience, Skills, Contact (`app/`)
- Shared UI: `Header`, `Footer`, `ScrollProgress`, `Section` (`components/`)
- Terminal-style hero: interactive “terminal” typing + command handling (`components/TerminalTyping.tsx`)
- Content source-of-truth: resume/skills/experience data in `data/resume.ts`
- SEO basics: Open Graph metadata (`app/layout.tsx`) + sitemap/robots via `next-sitemap`

## Getting Started

Install deps, then run the dev server:

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `yarn dev`: run locally
- `yarn build`: build + static export to `out/` (also runs `next-sitemap` via `postbuild`)
- `yarn lint`: lint
- `yarn typecheck`: TypeScript check
- `yarn format`: prettier format

## Project Structure

- `app/`: routes + layout (`app/layout.tsx` sets global metadata and shells)
- `components/`: reusable UI (nav, footer, scroll progress, terminal hero)
- `data/resume.ts`: edit this to update copy, experience, skills, and contact info
- `public/`: static assets (portrait, icons, generated `robots.txt`/`sitemap.xml`)

## Deploying

This repo is configured to deploy to GitHub Pages via `.github/workflows/deploy.yml`:

- On push to `master`, GitHub Actions installs deps, lints, typechecks, builds, and uploads `out/` to Pages.
- `out/.nojekyll` is created during the workflow to avoid GitHub Pages Jekyll processing.

## Customization Checklist

- Update content: `data/resume.ts`
- Update metadata/OG: `app/layout.tsx`
- Update theme tokens: `app/globals.css` (`--background`, `--primary`, terminal colors, etc.)
- Update hero image: `public/jake-portrait.jpg` (referenced by `app/page.tsx`)

## Notes

- This site is a static export; Pages are pre-rendered and served as static files (no server runtime).
- If you add client-only features, keep them compatible with static hosting (no API routes unless you use a third-party backend).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
