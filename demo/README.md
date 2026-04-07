# ngx-query-builder — Demo App

A standalone Angular 19 application showcasing the `ngx-query-builder` library. The demo provides a live, interactive query builder with JSON output displayed in real time.

## Features Demonstrated

- **ReactiveFormsModule** integration — query bound to a `FormControl`
- **Entity mode** — fields filtered by selected entity
- **Allow collapse** — rulesets can be collapsed/expanded with animation
- **Persist value on field change** — values are preserved when switching between compatible field types
- **Disabled state** — toggling the entire query builder on/off
- **Custom textarea input** — overriding the default text input with a `<textarea>` via `*queryInput` template
- **All input types** — string, number, date, time, category, multiselect, boolean
- **Nullable fields** — operators `is null` / `is not null` hide the value input
- **Live JSON output** — rendered below the query builder as pretty-printed JSON

## Development Server

```bash
# From the workspace root:
npm start
# or
npx ng serve demo
```

Navigate to `http://localhost:4200/`. The app auto-reloads on file changes.

## Build

```bash
npx ng build demo
```

Build artifacts are written to `dist/demo/`.

## End-to-End Tests (Playwright)

The demo app is covered by a Playwright e2e test suite in `e2e/`.

```bash
# Run all e2e tests (starts dev server automatically)
npm run e2e

# Open Playwright interactive UI
npm run e2e:ui

# View the last HTML test report
npm run e2e:report
```

Test files:

| File | Coverage |
|------|----------|
| `e2e/page-load.spec.ts` | Page renders, title, output, badges |
| `e2e/condition.spec.ts` | AND/OR condition toggle (root + nested) |
| `e2e/rules.spec.ts` | Add/remove rules & rulesets, allowRuleset toggle |
| `e2e/input-types.spec.ts` | All 8 input types + nullable operator |
| `e2e/field-operator.spec.ts` | Field changes operators; operator shows/hides input |
| `e2e/controls.spec.ts` | Entity mode, disabled, collapse, persist value |
| `e2e/validation.spec.ts` | Valid/invalid/touched badges, empty ruleset warning |
| `e2e/output.spec.ts` | Live JSON output updates correctly |

## Notes

- The demo has **no unit tests** — it exists solely to showcase the library
- Playwright uses Chromium headless; run `npx playwright install chromium` if browsers aren't installed
- The `webServer` config in `playwright.config.ts` auto-starts `ng serve demo` before tests run
