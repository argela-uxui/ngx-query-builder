# Documentation Index

Welcome to the operational, release, and deployment documentation for the `ngx-query-builder` repository.

## Documentation Guides

| Guide | Description |
|---|---|
| [**NPM Package Generation & Publishing**](npm-publishing.md) | Step-by-step guide to building, testing, packaging, and publishing `@argela-uxui/ngx-query-builder` to the npm registry. |
| [**Demo Site Deployment**](demo-deployment.md) | Architecture and CI/CD workflow guide explaining how `https://argela-uxui.github.io/qbdemo/` is built and deployed to GitHub Pages via GitHub Actions. |

---

## Quick Reference Commands

### NPM Package

```bash
# Run full CI validation (lint + unit tests + e2e + production build)
npm run ci

# Production build of the library (dist/ngx-query-builder/)
npm run build

# Dry-run publish check (from output directory)
cd dist/ngx-query-builder && npm publish --dry-run && cd ../..

# Pack local tarball archive to publish/ directory
npm pack ./dist/ngx-query-builder --pack-destination publish

# Publish library to npm registry
npm run publish
```

### Demo Application

```bash
# Serve demo locally on http://localhost:4200
npm start

# Build demo locally with production config and GitHub Pages base-href
npx ng build demo --configuration production --base-href /qbdemo/
```
