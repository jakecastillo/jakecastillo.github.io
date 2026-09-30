# Jake Castillo — Software & Systems

A statically exported Next.js portfolio for [jakecastillo.github.io](https://jakecastillo.github.io), with a progressively enhanced Three.js introduction and a complete HTML reading experience.

## Develop

Use Node.js 22 LTS and npm. The lockfile is authoritative.

```sh
npm ci
npm run dev
```

## Validate the release

```sh
npm run format:check
npm run check
npx playwright install chromium
npm run test:e2e
npm run preview
```

`check` runs the privacy guard, lint with zero warnings, TypeScript, calendar-boundary tests, and a production static export. The browser verification runs against that export and covers chapter navigation, hidden-caption focus, native disclosures, deep links, five viewport sizes, WCAG-tagged axe checks, reduced motion, no-JavaScript reading, and WebGL failure. These checks do not replace physical-device or assistive-technology testing.

The static preview is at `http://127.0.0.1:4174`. A Next.js server is not required in production. `next start` is intentionally not used for the exported site.

## Structure

- `app/`: page composition, metadata, sitemap, robots, 404, and styles.
- `components/portfolio/`: server-rendered editorial sections. This is the authoritative source for approved **public** website copy.
- `components/portfolio/PortfolioMotion.tsx`: the single client enhancement boundary.
- `lib/portfolio/runtime.js`: native-scroll chapter control and anchor restoration.
- `lib/portfolio/records.js`: reading-section interactions, timeline, and clipboard feedback.
- `lib/portfolio/scene*.js`: lazy-loaded graphics and geometry, using the npm Three.js package.
- `lib/portfolio/lifecycle.js`: abortable subscriptions and frame cleanup.
- `public/`: only assets intentionally served to visitors.
- `tooling/`: export preview, privacy guard, browser verification, and branded-asset generation.

Text, links, work history, and native disclosures render before JavaScript. The scene uses a single scroll clock, renders only when needed, and falls back to SVG/CSS if WebGL fails. Reduced motion skips initial WebGL loading. There is no boot gate, custom wheel interception, analytics, contact-form backend, or perpetual graphics loop. Fonts are self-hosted through `next/font`.

## Public content and private inputs

Anything rendered on this public site is public, including its HTML and application assets. Keep private documents, raw source material, credentials, internal notes, and full source photographs outside the repository. Never use `public/` as a staging folder for private inputs.

The ignore rules and `npm run check:privacy` reject private document paths, recognized secret formats, old generated bundles, and source maps. This is a defense in depth check, not a guarantee that arbitrary text is safe to publish. Review content changes before committing. Deleting a previously tracked file does **not** erase earlier Git history.

Only the approved site copy belongs in the section components. There is no source-document download or hidden career database. Public portrait derivatives contain no EXIF, XMP, or IPTC metadata. Brand assets can be regenerated with `npm run assets`; then review the resulting images before committing them. Third-party artwork licenses are in `public/licenses/`.

## Branch review and GitHub Pages

Feature branch pushes and pull requests run validation. They cannot deploy: the deployment job and upload step are restricted to `refs/heads/master` and excluded from pull-request events. Actions are pinned to commit SHAs; Pages write permissions exist only on the deployment job.

After an approved merge to `master`, the workflow builds `out/`, uploads that directory as the Pages artifact, and deploys with GitHub's official Pages action. Repository Settings → Pages must use **GitHub Actions** as the source. Do not commit `out/`, `_next/`, or compiled HTML to Git.

For a rollback, revert the production merge on `master` and let the same validation and deployment workflow run. Feature branches do not change the live site.
