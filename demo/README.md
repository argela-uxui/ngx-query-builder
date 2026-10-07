# ngx-query-builder Demo

An Angular 22 application for exploring the `ngx-query-builder` component. It uses a responsive application shell, light/dark themes, a live playground, and 13 focused examples. The component is backed by reactive forms throughout the examples, with a few template-driven examples to show both forms APIs.

## Run locally

From the repository root:

```bash
npm ci
npm start
```

Open `http://localhost:4200/`. The library is loaded from the workspace source through the TypeScript path mapping. Choose the theme with the top-right button; the selection is saved locally.

Build the demo independently with:

```bash
npx ng build demo
```

Build output is written to `demo/dist/demo/` and is ignored by git.

## Playground (`/`)

The main playground keeps the existing 10-rule sample query and stable `data-testid` selectors used by the E2E suite. The builder is paired with live controls for:

- `allowRuleset`, `allowCollapse`, `persistValueOnFieldChange`, `dragDropRules`, `emptyMessage`, and translations
- Entity mode and `config.allowEmptyRulesets`
- FormControl disabled state, reset, clear, validity, touched/dirty status, and rule/ruleset counts
- Live RuleSet JSON, SQL, MongoDB, readable text, and a template snippet

## Examples

| Route | Demonstrates |
|---|---|
| `/examples/basic` | `ngModel` and reactive `FormControl` |
| `/examples/field-types` | Built-in types, defaults, nullable fields, custom textarea and rating inputs |
| `/examples/entities` | Entity-filtered fields and `Entity.defaultField` |
| `/examples/operators` | Built-in and field operators, `operatorMap`, `getOperators`, operator labels |
| `/examples/validation` | `Field.validator`, `allowEmptyRulesets`, inline and form-level errors |
| `/examples/callbacks` | `getInputType`, `getOptions`, CRUD callbacks, coercion and field-change callbacks |
| `/examples/custom-templates` | All nine structural template directives |
| `/examples/styling` | `classNames` presets and `--qb-*` CSS custom properties |
| `/examples/theme-builder` | Live editor for all `--qb-*` variables and `QueryBuilderClassNames`, editable code and saved themes |
| `/examples/localization` | English, Turkish and German translations; `emptyMessage` |
| `/examples/nested` | Recursive groups, `allowCollapse`, `allowRuleset`, and initial collapse state |
| `/examples/drag-drop` | Reordering and moving rules between nested groups |
| `/examples/disabled` | Reactive/template-driven disabled state, preset queries and JSON import |
| `/examples/query-conversion` | Demo-only SQL, MongoDB and readable-text conversions; share query state in the URL |

Each route is lazy-loaded and includes a live builder with configuration, template, or output code tabs as appropriate.

## E2E tests

Playwright tests live in the repository-level `e2e/` folder:

```bash
npm run e2e
npm run e2e:ui
npm run e2e:report
```

The Playwright web server starts `ng serve demo` automatically. Install Chromium once with `npx playwright install chromium` if it is not already present.

## Adding an example

1. Create a standalone component in `demo/src/app/examples/`, using the `app-` selector prefix, OnPush change detection, and the shared `DemoCardComponent` / `PageHeaderComponent`.
2. Add a lazy `DemoNavItem` in `demo/src/app/navigation.ts`; `app.routes.ts` creates a route for each navigation item.
3. Add a route smoke test to `e2e/examples.spec.ts` if it introduces an independently addressable example.

Shared example configs, translations, JSON tracking, and query formatters are in `demo/src/app/shared/`.
