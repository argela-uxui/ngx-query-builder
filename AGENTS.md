# AGENTS.md

## Project Overview

Angular 21 library (`ngx-query-builder`) — a standalone, signal-based query builder component with `ControlValueAccessor` support. Forked from `angular2-query-builder`, modernized to use `input()`, `contentChild()`, `contentChildren()`, `inject()`, OnPush, and `@if`/`@for` control flow.

## Architecture

- **Library source:** `projects/ngx-query-builder/src/lib/` — single component (`QueryBuilderComponent`) + 9 template directives (e.g. `QueryInputDirective`, `QueryFieldDirective`).
- **Public API:** `projects/ngx-query-builder/src/public-api.ts` — re-exports everything. `QueryBuilderModule` exists only for NgModule backward-compat; the component is standalone.
- **Demo app:** `demo/src/app/app.component.ts` — standalone component importing `QueryBuilderModule`, wired with `FormControl`. Used as the target for e2e tests.
- **Recursive rendering:** `QueryBuilderComponent` renders nested `<query-builder>` for child rulesets, passing parent templates and callbacks via `parentXxxTemplate` signal inputs. Context objects are cached per `Rule` instance in `Map` caches and invalidated on field/rule changes.
- **Data model:** `RuleSet` (recursive tree of `condition` + `rules: (Rule | RuleSet)[]`) defined in `query-builder.interfaces.ts`. The component mutates this tree in-place and notifies via CVA callbacks.

## Commands

| Task | Command |
|---|---|
| Build library | `npm run build` |
| Unit tests (Jest) | `npm test` |
| Unit tests watch | `npm run test:watch` |
| E2E tests (Playwright) | `npm run e2e` (auto-starts demo on `:4200`) |
| E2E with UI | `npm run e2e:ui` |
| Lint | `npm run lint` |
| Serve demo | `npm start` |
| Full CI pipeline | `npm run ci` (lint → test → e2e → build) |

## Code Conventions

- **Strict TypeScript** — `strict: true`, `strictTemplates: true`. Avoid `any`; use `unknown`.
- **Signal inputs** for all new inputs (`input()`). Only `data` and `disabled` remain as `@Input()` because they are mutated internally.
- **OnPush change detection** — call `changeDetectorRef.markForCheck()` after mutations; never `detectChanges()` except in `setDisabledState`.
- **Selectors** — library components: `query-` prefix (kebab-case element); directives: `query` prefix (camelCase attribute). Demo: `app-` prefix. Enforced by eslint rules in `eslint.config.js`.
- **No `any`** — eslint warns on `@typescript-eslint/no-explicit-any`.

## Testing Patterns

- **Unit tests** (Jest): `projects/ngx-query-builder/src/**/*.spec.ts`. Use `TestBed.createComponent(QueryBuilderComponent)` directly; set signal inputs via `fixture.componentRef.setInput('config', ...)`. Shared `createComponent()` helper and `baseConfig` fixture at the top of the spec file.
- **E2E tests** (Playwright): `e2e/*.spec.ts`. All specs use a shared **Page Object** (`e2e/demo.page.ts` → `DemoPage` class) with typed locator helpers. Demo elements use `data-testid` attributes; query-builder internals use CSS class selectors (`.q-field-control`, `.q-operator-control`, `.q-remove-button`).
- **E2E output assertions:** capture output text before action with `demo.getOutputText()`, then `demo.waitForOutputChange(prevText)` after mutation — avoids flaky timing issues.

## Key Files

| Purpose | Path |
|---|---|
| Component logic | `projects/ngx-query-builder/src/lib/query-builder/query-builder.component.ts` |
| Interfaces & types | `projects/ngx-query-builder/src/lib/query-builder/query-builder.interfaces.ts` |
| Template (HTML) | `projects/ngx-query-builder/src/lib/query-builder/query-builder.component.html` |
| Unit tests | `projects/ngx-query-builder/src/lib/query-builder/query-builder.component.spec.ts` |
| E2E Page Object | `e2e/demo.page.ts` |
| Demo app | `demo/src/app/app.component.ts` |
| Library package.json | `projects/ngx-query-builder/package.json` |
| TSConfig paths | `tsconfig.json` (`"ngx-query-builder"` → `public-api.ts`) |

