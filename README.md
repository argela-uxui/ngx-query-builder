# ngx-query-builder

Angular 22 library workspace for `@argela-uxui/ngx-query-builder`, a standalone query-builder component with Angular forms integration. This repository contains the library, a demo application, and Jest and Playwright tests. It is a fork of [zebzhao/Angular-QueryBuilder](https://github.com/zebzhao/Angular-QueryBuilder).

**Looking to use the library in an application?** See the [package usage documentation](projects/ngx-query-builder/README.md) for installation, examples, configuration, custom templates, and the public API. This README covers developing, building, and releasing the project.

## Workspace layout

| Path | Purpose |
|---|---|
| `projects/ngx-query-builder/src/lib/` | Standalone component, directives, types, and unit tests. |
| `projects/ngx-query-builder/src/public-api.ts` | Public exports for the npm package. |
| `projects/ngx-query-builder/README.md` | Consumer-facing documentation, included in the built package. |
| `demo/` | Angular application exercising the library; see the [demo README](demo/README.md). |
| `docs/` | Operational guides for package publishing and demo deployment; see [docs README](docs/README.md). |
| `e2e/` | Playwright browser tests for the demo. |
| `dist/ngx-query-builder/` | Generated, publishable library package (gitignored). |

The Angular CLI project is named `ngx-query-builder`, but the package built from it is named `@argela-uxui/ngx-query-builder`. The workspace root package is private and must not be published.

## Development installation

Use Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` (as required by Angular 22), plus npm. From the repository root:

```bash
npm ci
```

`npm ci` installs the versions recorded in `package-lock.json`. For end-to-end tests, install Playwright's Chromium browser once:

```bash
npx playwright install chromium
```

No global Angular CLI installation is needed; `npm run` and `npx` use the project's local tools. To use the released package in another application rather than develop it here, follow the [package installation instructions](projects/ngx-query-builder/README.md#installation).

## Build and run the demo

```bash
npm run build
npm start
```

`npm run build` builds the library in Angular's **production/partial compilation mode** into `dist/ngx-query-builder/`. Publish only this output, never the workspace root. `npm start` serves the demo at `http://localhost:4200`; it uses the library source through the workspace TypeScript path mapping. The demo has a live playground and 15 lazy-loaded examples, including Theme Builder for custom appearance and Localization Builder for custom language profiles; see [demo/README.md](demo/README.md).

For iterative library development, `npm run build:watch` runs the Angular CLI build in watch mode. This uses the default library configuration, not the production configuration; run `npm run build` before packaging or publishing. To build the demo application separately, run `npx ng build demo`.

## Checks

| Command | Purpose |
|---|---|
| `npm run lint` | Lint the library and demo. |
| `npm test` | Run the library's Jest unit tests. |
| `npm run test:watch` | Run Jest in watch mode. |
| `npx jest --coverage` | Generate the unit-test coverage report in `coverage/`. |
| `npm run e2e` | Run Playwright tests in Chromium; starts the demo on port 4200 automatically. |
| `npm run e2e:ui` | Open Playwright's interactive test UI. |
| `npm run e2e:report` | Open the generated Playwright HTML report. |
| `npm run ci` | Run lint, unit tests, end-to-end tests, and the production library build. |
| `npm run clean` | Remove generated `dist/` and `coverage/` output. |

## Publishing to npm

The publishable package is configured in `projects/ngx-query-builder/package.json` with public access and the `https://registry.npmjs.org/` registry. `.npmrc` directs the `@argela-uxui` scope to that registry; do not put credentials in the repository. Publishing requires an npm account with permission to publish under `@argela-uxui`. npm may require two-factor authentication or other account verification.

1. Update the version in `projects/ngx-query-builder/package.json` for a new release. Update the [changelog](CHANGELOG.md) as appropriate. npm will not accept a second publish of an existing package version.
2. Authenticate and verify the publishing identity:

   ```bash
   npm login --registry=https://registry.npmjs.org/
   npm whoami --registry=https://registry.npmjs.org/
   ```

3. From the repository root, run `npm run ci` (and install Playwright Chromium first if necessary). Build and inspect the package from **inside** its output directory:

   ```bash
   npm run build
   cd dist/ngx-query-builder
   npm publish --dry-run
   cd ../..
   ```

   Confirm the dry-run package name, version, registry, public access, and included files. The `npm run build` production configuration is required: a default/full-compilation build contains a guard that rejects publication.
4. From the repository root, publish with `npm run publish`. That script rebuilds with the production configuration and runs `npm publish` from `dist/ngx-query-builder/`. Verify the released package and version on npm after publishing.

Do not run `npm publish` from the root; its `private: true` setting prevents publishing the workspace instead of the library. To create a local archive without publishing, run `npm run build` followed by `npm pack ./dist/ngx-query-builder --pack-destination publish` from the repository root. The tarball is written to the gitignored `publish/` directory; packing does not require npm authentication.

For the comprehensive guide on packaging and publishing, see the [NPM Package Publishing Guide](docs/npm-publishing.md).

## Demo deployment

The demo site at [https://argela-uxui.github.io/qbdemo/](https://argela-uxui.github.io/qbdemo/) is automatically deployed from GitHub Actions on every push to `main` affecting library or demo files. For complete deployment details, build parameters, SPA routing configuration, and secrets management, see the [Demo Site Deployment Guide](docs/demo-deployment.md).

## License

MIT - see [LICENSE](LICENSE).
