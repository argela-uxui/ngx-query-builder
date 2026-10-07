# Demo Site Deployment Guide

This guide explains how the demo application hosted at **[https://argela-uxui.github.io/qbdemo/](https://argela-uxui.github.io/qbdemo/)** is generated, configured for Single Page Application (SPA) routing, and deployed to GitHub Pages.

---

## 1. Architecture & Hosting Strategy

The demo site serves as an interactive playground and live showcase of the `@argela-uxui/ngx-query-builder` library.

### Key Deployment Characteristics

| Element | Detail |
|---|---|
| **Live URL** | `https://argela-uxui.github.io/qbdemo/` |
| **Source Location** | `demo/` in the `argela-uxui/ngx-query-builder` repository |
| **Hosting Service** | GitHub Pages |
| **Target Repository** | `argela-uxui/argela-uxui.github.io` |
| **Target Branch** | `main` |
| **Target Directory** | `qbdemo/` (subfolder within the GitHub Pages repository) |
| **CI/CD Platform** | GitHub Actions |

Rather than serving from a `gh-pages` branch within this repository, deployments are pushed cross-repository to the organization's centralized GitHub Pages repository (`argela-uxui/argela-uxui.github.io`) under the `qbdemo/` subdirectory.

---

## 2. GitHub Actions Workflow

The deployment is managed by the workflow file:
`.github/workflows/deploy_demo_2_pages.yml`

### Workflow Triggers

The workflow runs under two scenarios:

1. **Automatic Push Trigger:** Triggers automatically on pushes to branch `main` when files within any of the following paths change:
   - `demo/**`
   - `projects/ngx-query-builder/**`
   - `angular.json`
   - `package.json`
   - `package-lock.json`
   - `tsconfig.json`
   - `.github/workflows/deploy-demo.yml`
2. **Manual Trigger (`workflow_dispatch`):** Can be triggered manually from the GitHub Actions UI at any time.

### Concurrency Control

```yaml
concurrency:
  group: deploy-demo
  cancel-in-progress: false
```
Setting `cancel-in-progress: false` ensures that in-flight deployments complete sequentially without corrupting the target repository's deployment directory.

---

## 3. Deployment Steps Breakdown

Below is the step-by-step walkthrough of what the deployment job executes:

### Step 1: Checkout & Environment Setup
```yaml
- name: Checkout
  uses: actions/checkout@v4

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 24.15.0
    cache: npm

- name: Install dependencies
  run: npm ci
```
- Uses Node.js 22.
- Performs `npm ci` leveraging npm dependency caching.

### Step 2: Angular Production Build with Base-Href
```yaml
- name: Build demo
  run: npx ng build demo --configuration production --base-href /qbdemo/
```

#### Why `--base-href /qbdemo/` is Critical
The demo is hosted at `https://argela-uxui.github.io/qbdemo/`, not the root domain `https://argela-uxui.github.io/`.
- Without `--base-href /qbdemo/`, browser requests for scripts, CSS, and assets (e.g., `styles-*.css`, `main-*.js`, `favicon.ico`) would request `https://argela-uxui.github.io/styles-*.css` instead of `https://argela-uxui.github.io/qbdemo/styles-*.css`, resulting in **404 Not Found** errors and a blank white page.
- Angular's router also uses the base href to configure client-side route parsing.

The build output is written to:
`demo/dist/demo/browser/`

### Step 3: SPA Fallback Handling (`404.html`)
```yaml
- name: Prepare GitHub Pages files
  run: |
    cp demo/dist/demo/browser/index.html demo/dist/demo/browser/404.html
```

#### Why `404.html` is Needed
GitHub Pages is a static file host without built-in server-side URL rewriting (like Apache `.htaccess` or Nginx `try_files $uri /index.html`).
- When a user refreshes the page on a deep route (e.g. `https://argela-uxui.github.io/qbdemo/custom-templates`), GitHub Pages looks for a physical file at `/qbdemo/custom-templates/index.html`.
- Because that file does not exist, GitHub Pages falls back to serving `404.html`.
- By duplicating `index.html` as `404.html`, GitHub Pages serves the Angular application on deep routes, and the Angular router initializes and navigates to the requested URL seamlessly.

### Step 4: Cross-Repository GitHub Pages Deployment
```yaml
- name: Deploy to argela-uxui.github.io
  uses: JamesIves/github-pages-deploy-action@v4
  with:
    token: ${{ secrets.GH_PAGES_TOKEN }}
    repository-name: argela-uxui/argela-uxui.github.io
    branch: main
    folder: demo/dist/demo/browser
    target-folder: qbdemo
    clean: true
    commit-message: Deploy ngx-query-builder demo
```

Parameters explained:
- **`token: ${{ secrets.GH_PAGES_TOKEN }}`**: A personal access token (PAT) stored as an encrypted secret in the repository settings with write permissions for `argela-uxui/argela-uxui.github.io`.
- **`repository-name: argela-uxui/argela-uxui.github.io`**: The target GitHub Pages repository.
- **`branch: main`**: The branch deployed by GitHub Pages for the organization.
- **`folder: demo/dist/demo/browser`**: The local build artifact directory to copy.
- **`target-folder: qbdemo`**: The destination folder in the target repository.
- **`clean: true`**: Automatically removes obsolete hashed asset files from previous deployments while preserving unrelated folders in `argela-uxui.github.io`.

---

## 4. Local Testing & Verification

Before pushing changes that affect the demo site:

### 1. Test in Development Mode
```bash
npm start
```
Runs the Angular dev server on `http://localhost:4200` with hot-reloading.

### 2. Test Production Build Locally
Verify that production bundling and budgets pass:
```bash
npx ng build demo --configuration production --base-href /qbdemo/
```

### 3. Verify Output Directory
Check that `demo/dist/demo/browser` contains:
- `index.html`
- Bundled `.js` and `.css` files with cache-busting hashes
- `assets/` and `favicon.ico`

---

## 5. Troubleshooting & Maintenance

| Issue | Cause | Solution |
|---|---|---|
| **Deployment fails: `403 Bad credentials` or permission denied** | Secret `GH_PAGES_TOKEN` has expired or lacks repository write access. | Generate a new GitHub Personal Access Token (PAT) with `repo` scope, and update the `GH_PAGES_TOKEN` repository secret under **Settings > Secrets and variables > Actions**. |
| **Demo site loads blank white page with console 404s** | `--base-href` was missing or incorrect during the demo build step. | Ensure the build command includes `--base-href /qbdemo/`. |
| **Page refresh results in GitHub 404 page** | `404.html` was missing from the deployed folder. | Verify that `cp demo/dist/demo/browser/index.html demo/dist/demo/browser/404.html` executed successfully. |
| **Old cached assets loaded by browsers** | Cache expiration or missing hash in production build. | Production configuration uses `"outputHashing": "all"` in `angular.json`. The deployment action cleans old assets with `clean: true`. Force refresh (`Ctrl+F5` or `Cmd+Shift+R`). |
| **Budget exceeded warning/error during build** | Bundle size exceeded the limits defined in `angular.json` (`budgets`). | Inspect dependencies in `demo/` or adjust the budget limits in `angular.json` under `projects.demo.architect.build.configurations.production.budgets`. |
