# CLAUDE.md — ngx-query-builder

## Project Overview

`ngx-query-builder` is an Angular 21 library providing a standalone, signal-based query builder component with `ControlValueAccessor` support. Forked from `angular2-query-builder`, it has been modernized to use `input()`, `contentChild()`, `contentChildren()`, `inject()`, OnPush change detection, and `@if`/`@for`/`@switch`/`@let` template control flow.

**Tech stack:** Angular 21 · TypeScript 5.9 · Jest 30 · Playwright 1.59 · ng-packagr · ESLint (flat config)

## Architecture

```
projects/ngx-query-builder/src/
├── lib/
│   ├── ngx-query-builder.module.ts        # NgModule (backward-compat only)
│   └── query-builder/
│       ├── query-builder.component.ts      # Main component (standalone, OnPush, CVA + Validator)
│       ├── query-builder.component.html    # Template with @if/@for/@switch/@let control flow
│       ├── query-builder.component.scss    # Styles
│       ├── query-builder.component.spec.ts # Unit tests (Jest)
│       ├── query-builder.interfaces.ts     # All interfaces and types
│       ├── query-input.directive.ts        # *queryInput structural directive
│       ├── query-field.directive.ts        # *queryField structural directive
│       ├── query-operator.directive.ts     # *queryOperator structural directive
│       ├── query-entity.directive.ts       # *queryEntity structural directive
│       ├── query-button-group.directive.ts # *queryButtonGroup structural directive
│       ├── query-switch-group.directive.ts # *querySwitchGroup structural directive
│       ├── query-remove-button.directive.ts# *queryRemoveButton structural directive
│       ├── query-empty-warning.directive.ts# *queryEmptyWarning structural directive
│       └── query-arrow-icon.directive.ts   # *queryArrowIcon structural directive
└── public-api.ts                           # Re-exports everything
```

- **Recursive rendering:** `QueryBuilderComponent` renders nested `<query-builder>` for child rulesets, passing parent templates and callbacks via `parentXxxTemplate` signal inputs.
- **Radio group isolation:** Each component instance auto-generates a unique `componentId` from a `private static nextComponentId` counter (`qb-0`, `qb-1`, …). From this, `switchGroupId` (`qb-N-switch`), `andOptionId` (`qb-N-and`), and `orOptionId` (`qb-N-or`) are derived and used as `name`, `id`, and `for` attributes on the AND/OR radio buttons and labels. This ensures nested `<query-builder>` instances don't interfere with each other's radio selection.
- **Data model:** `RuleSet` is a recursive tree of `condition` + `rules: (Rule | RuleSet)[]`. The component mutates this tree in-place and notifies via CVA callbacks.
- **Context caching:** Template context objects are cached per `Rule` instance in `Map` caches and invalidated on field/rule changes.
- **Demo app:** `demo/src/app/` — routed standalone app with an accessible sidebar, light/dark ThemeService, Playground route `/`, and 13 lazy-loaded feature example routes. Shared cards, controls, sample configs, and demo-only query converters live in `demo/src/app/shared/`.

## Commands

| Task | Command |
|---|---|
| Install dependencies | `npm install` |
| Build library | `npm run build` |
| Unit tests (Jest) | `npm test` |
| Unit tests watch | `npm run test:watch` |
| E2E tests (Playwright) | `npm run e2e` (auto-starts demo on `:4200`) |
| E2E with UI | `npm run e2e:ui` |
| Lint (lib + demo) | `npm run lint` |
| Serve demo app | `npm start` |
| Full CI pipeline | `npm run ci` (lint → test → e2e → build) |
| Clean dist/coverage | `npm run clean` |

## Code Conventions

### TypeScript
- **Strict mode** — `strict: true`, `strictTemplates: true`, `strictInjectionParameters: true` in tsconfig.
- **No `any`** — eslint warns on `@typescript-eslint/no-explicit-any`. Use `unknown` or proper typing.
- **Interfaces over types** for object shapes (`interface Field`, not `type Field = {}`).
- **Explicit return types** on all public functions.
- **Utility types** — use `Pick`, `Omit`, `Partial`, `Record` for type transformations.

### Angular
- **Signal inputs** (`input()`) for all new inputs. Only `data` and `disabled` remain as `@Input()` because they are mutated internally via CVA.
- **Signal queries** — `viewChild()`, `contentChild()`, `contentChildren()` instead of `@ViewChild`/`@ContentChild`.
- **OnPush change detection** — call `changeDetectorRef.markForCheck()` after mutations; never `detectChanges()` except in `setDisabledState`.
- **`inject()` DI** — use `inject()` instead of constructor injection for services.
- **Control flow** — `@if`, `@for`, `@switch`, `@let` in templates; no `*ngIf`/`*ngFor`.
- **Standalone first** — all new components/directives must be standalone. `QueryBuilderModule` exists solely for NgModule backward-compat.
- **Selector prefixes** — library components: `query-` (kebab-case element); directives: `query` (camelCase attribute). Demo: `app-` prefix. Enforced by ESLint.

### File Organization
- One component/directive per file.
- Interfaces and types in `query-builder.interfaces.ts`.
- Public API exported through `public-api.ts`.

## Testing Patterns

### Unit Tests (Jest)
- **Location:** `projects/ngx-query-builder/src/**/*.spec.ts`
- **Test runner:** Jest 30 with `jest-preset-angular`.
- **Setup:** `TestBed.createComponent(QueryBuilderComponent)` directly; set signal inputs via `fixture.componentRef.setInput('config', ...)`.
- **Shared helpers:** `createComponent()` helper and `baseConfig` fixture at the top of the spec file.
- **Pattern:** AAA (Arrange, Act, Assert). Descriptive test names that explain expected behavior.
- **Coverage target:** 80%+ for critical paths. Run with `npx jest --coverage`.

### E2E Tests (Playwright)
- **Location:** `e2e/*.spec.ts`
- **Page Object:** `e2e/demo.page.ts` → `DemoPage` class with typed locator helpers.
- **Example route coverage:** `e2e/examples.spec.ts` smoke-tests all examples and adds targeted feature checks.
- **Selectors:** Demo elements use `data-testid` attributes; query-builder internals use CSS class selectors (`.q-field-control`, `.q-operator-control`, `.q-remove-button`).
- **Output assertions:** Capture output text before action with `demo.getOutputText()`, then `demo.waitForOutputChange(prevText)` after mutation — avoids flaky timing issues.
- **Structure:** Each spec file focuses on one feature area (rules, conditions, controls, field-operator, input-types, output, page-load, validation).

## Key Files

| Purpose | Path |
|---|---|
| Component logic | `projects/ngx-query-builder/src/lib/query-builder/query-builder.component.ts` |
| Template (HTML) | `projects/ngx-query-builder/src/lib/query-builder/query-builder.component.html` |
| Interfaces & types | `projects/ngx-query-builder/src/lib/query-builder/query-builder.interfaces.ts` |
| Unit tests | `projects/ngx-query-builder/src/lib/query-builder/query-builder.component.spec.ts` |
| Public API | `projects/ngx-query-builder/src/public-api.ts` |
| NgModule (compat) | `projects/ngx-query-builder/src/lib/ngx-query-builder.module.ts` |
| Demo shell | `demo/src/app/app.component.ts` |
| Demo routes/navigation | `demo/src/app/app.routes.ts`, `demo/src/app/navigation.ts` |
| Playground | `demo/src/app/playground/playground.component.ts` |
| Demo shared components | `demo/src/app/shared/` |
| Demo examples | `demo/src/app/examples/` |
| E2E Page Object | `e2e/demo.page.ts` |
| Jest config | `jest.config.ts` |
| Playwright config | `playwright.config.ts` |
| ESLint config | `eslint.config.js` |
| Root tsconfig | `tsconfig.json` |
| Library package.json | `projects/ngx-query-builder/package.json` |

## Data Model Reference

```typescript
interface RuleSet {
  condition: string;              // 'and' | 'or'
  rules: (RuleSet | Rule)[];      // Recursive tree
  collapsed?: boolean;
  isChild?: boolean;
}

interface Rule {
  field: string;
  value?: unknown;
  operator?: string;
  entity?: string;
}

interface QueryBuilderConfig {
  fields: Record<string, Field>;
  entities?: Record<string, Entity>;
  allowEmptyRulesets?: boolean;
  getOperators?: (fieldName: string, field: Field) => string[];
  getInputType?: (field: string, operator: string) => string;
  getOptions?: (field: string) => Option[];
  addRule?: (parent: RuleSet) => void;
  addRuleSet?: (parent: RuleSet) => void;
  removeRule?: (rule: Rule, parent: RuleSet) => void;
  removeRuleSet?: (ruleset: RuleSet, parent: RuleSet) => void;
  coerceValueForOperator?: (operator: string, value: unknown, rule: Rule) => unknown;
  calculateFieldChangeValue?: (currentField: Field, nextField: Field, currentValue: unknown) => unknown;
}
```

## Default Operator Map

| Field Type | Operators |
|---|---|
| `string` | `=`, `!=`, `contains`, `like` |
| `number` | `=`, `!=`, `>`, `>=`, `<`, `<=` |
| `date` | `=`, `!=`, `>`, `>=`, `<`, `<=` |
| `time` | `=`, `!=`, `>`, `>=`, `<`, `<=` |
| `category` | `=`, `!=`, `in`, `not in` |
| `boolean` | `=` |

## Custom Template Directives

9 structural directives allow replacing any part of the UI:

| Directive | Context ($implicit + named) |
|---|---|
| `*queryInput` | `Rule`, `field: Field`, `options: Option[]`, `onChange()`, `getDisabledState()` |
| `*queryField` | `Rule`, `fields: Field[]`, `onChange()`, `getFields()`, `getDisabledState()` |
| `*queryOperator` | `Rule`, `operators: string[]`, `onChange()`, `getDisabledState()` |
| `*queryEntity` | `Rule`, `entities: Entity[]`, `onChange()`, `getDisabledState()` |
| `*queryButtonGroup` | `RuleSet`, `addRule()`, `addRuleSet?()`, `removeRuleSet?()`, `getDisabledState()` |
| `*queryRemoveButton` | `Rule`, `removeRule()`, `getDisabledState()` |
| `*querySwitchGroup` | `RuleSet`, `onChange()`, `getDisabledState()` |
| `*queryEmptyWarning` | `RuleSet`, `message: string`, `getDisabledState()` |
| `*queryArrowIcon` | `RuleSet`, `getDisabledState()` |

---

## Agent Skills

### 🧑‍💻 Coder (Software Engineer)

**Role:** Implement features, fix bugs, and write production code for the ngx-query-builder library and demo app.

**Responsibilities:**
- Implement new features in `QueryBuilderComponent` following existing signal-based, OnPush patterns.
- Add new template directives following the established `Directive` + `TemplateRef` pattern (see existing 9 directives).
- Extend `QueryBuilderConfig` and related interfaces in `query-builder.interfaces.ts` for new functionality.
- Update the demo app in `demo/src/app/app.component.ts` to showcase new features with `data-testid` attributes for E2E testability.
- Export any new public symbols from `public-api.ts`.

**Conventions to follow:**
- Use `input()` for new signal inputs; only use `@Input()` for properties mutated internally.
- Use `inject()` for DI, never constructor-based injection.
- Use `@if`/`@for`/`@switch`/`@let` control flow in templates — no `*ngIf`/`*ngFor`.
- All components must be standalone with `changeDetection: ChangeDetectionStrategy.OnPush`.
- Avoid `any` — use `unknown` or proper types. ESLint warns on `@typescript-eslint/no-explicit-any`.
- Call `changeDetectorRef.markForCheck()` after in-place mutations to trigger CD.
- Invalidate context caches (`inputContextCache`, `operatorContextCache`, etc.) when fields or rules change.
- Maintain backward compatibility with `QueryBuilderModule`.
- Follow selector conventions: `query-` prefix for elements (kebab-case), `query` prefix for directives (camelCase), `app-` for demo.

**Verification:**
- Run `npm run lint` — zero errors.
- Run `npm test` — all unit tests pass.
- Run `npm run e2e` — all E2E tests pass.
- Run `npm run build` — library builds without errors.

---

### 🏗️ Code Reviewer (Software Architect)

**Role:** Review code changes for architectural consistency, performance, and adherence to project conventions.

**Review checklist:**

1. **Architecture & Design**
   - Does the change follow the single-component + directive composition pattern?
   - Is recursive rendering handled correctly (parent template pass-through)?
   - Are context caches properly invalidated when state changes?
   - Does the change maintain CVA/Validator contract integrity?

2. **Angular Best Practices**
   - Signal inputs (`input()`) used for new inputs?
   - OnPush-compatible? (`markForCheck()` after mutations, no `detectChanges()` except `setDisabledState`)
   - Standalone components? No unnecessary NgModule dependencies?
   - Modern control flow (`@if`/`@for`) in templates?

3. **TypeScript Quality**
   - No `any` types — `unknown` or specific types used?
   - Interfaces for object shapes, not type aliases?
   - Explicit return types on public methods?
   - Null/undefined handled properly?

4. **Performance**
   - Context objects cached per Rule instance (not re-created on every CD cycle)?
   - `@for` uses `track` expression?
   - No unnecessary template re-renders?
   - No heavy computation in template expressions?

5. **Backward Compatibility**
   - Public API unchanged or additive only?
   - `QueryBuilderModule` still works?
   - CSS class names preserved (`.q-*` prefix)?
   - Existing template directive contexts preserved?

6. **Testing**
   - Unit tests added for new logic?
   - E2E tests added for new user-facing features?
   - Demo app updated with `data-testid` attributes for new controls?

**Verification commands:**
```bash
npm run lint      # Code style and selector conventions
npm test          # Unit tests pass
npm run e2e       # E2E tests pass
npm run build     # Library builds cleanly
```

---

### 🧪 Testing Engineer

**Role:** Write and maintain unit tests (Jest) and E2E tests (Playwright) for the ngx-query-builder library and demo app.

**Unit Test Guidelines (Jest):**
- **File location:** `projects/ngx-query-builder/src/lib/query-builder/query-builder.component.spec.ts` (or co-located `.spec.ts` for new files).
- **Setup pattern:**
  ```typescript
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueryBuilderComponent, ReactiveFormsModule],
    }).compileComponents();
  });
  ```
- **Component creation helper:**
  ```typescript
  function createComponent(config = baseConfig, data: RuleSet = { ...emptyRuleset }) {
    const fixture = TestBed.createComponent(QueryBuilderComponent);
    fixture.componentRef.setInput('config', config);
    fixture.componentInstance.data = data;
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }
  ```
- **Signal inputs:** Set via `fixture.componentRef.setInput('inputName', value)`.
- **Mutable inputs:** Set directly on component instance (`component.data = ...`, `component.disabled = ...`).
- **AAA pattern:** Arrange → Act → Assert. One assertion focus per test.
- **Descriptive names:** `it('should add a rule with default field when addRule is called', ...)`.
- **Test categories:** Initialization, CVA, Validation, Rule/RuleSet CRUD, Field/Operator changes, Template resolution, Entity handling, Edge cases.

**E2E Test Guidelines (Playwright):**
- **File location:** `e2e/*.spec.ts` — one file per feature area.
- **Page Object:** Always use `DemoPage` from `e2e/demo.page.ts`. Never use raw selectors in specs.
  ```typescript
  let demo: DemoPage;
  test.beforeEach(async ({ page }) => {
    demo = new DemoPage(page);
    await demo.goto();
  });
  ```
- **Selectors:** Use `data-testid` for demo controls. Use `.q-*` CSS classes for query-builder internals.
- **Output assertions pattern:**
  ```typescript
  const prevText = await demo.getOutputText();
  // ... perform action ...
  await demo.waitForOutputChange(prevText);
  const json = await demo.getOutputJson();
  expect(json.rules.length).toBe(expectedCount);
  ```
- **Adding new Page Object methods:** Add to `DemoPage` class with typed `Locator` return. Document with JSDoc.
- **New demo controls:** Add `data-testid` attribute in demo app HTML, then add corresponding locator method in `DemoPage`.

**Verification:**
- `npm test` — all unit tests pass, no skipped tests.
- `npm run e2e` — all E2E tests pass in CI-like mode.
- `npx jest --coverage` — coverage meets 80%+ for critical paths.

---

### 📝 Technical Writer

**Role:** Create and maintain project documentation, README, CHANGELOG, inline code comments, and JSDoc annotations.

**Documentation scope:**

1. **README.md** — User-facing documentation:
   - Installation instructions (npm, tarball, git, private registry, npm link).
   - Quick start for standalone and NgModule usage.
   - Full API reference: inputs table, `QueryBuilderConfig` interface, operator map.
   - Custom template examples for all 9 directives with context variables.
   - Styling/CSS class override examples.
   - Development setup and commands.
   - Migration guide from `angular2-query-builder`.

2. **CHANGELOG.md** — Release notes:
   - Follow [Keep a Changelog](https://keepachangelog.com/) format.
   - Categorize: Added, Changed, Deprecated, Removed, Fixed, Security.
   - Reference issue/PR numbers where applicable.

3. **AGENTS.md** — AI agent context:
   - Project overview, architecture, commands, conventions.
   - Keep synchronized with actual project state.

4. **CLAUDE.md** — This file:
   - Detailed project context for Claude/AI assistants.
   - Agent skill definitions.
   - Keep synchronized with AGENTS.md and actual project state.

5. **Inline documentation:**
   - JSDoc on all public interfaces, classes, and methods in the library.
   - Inline comments for complex logic (e.g., recursive rendering, context caching, CVA lifecycle).
   - Template comments for non-obvious template patterns.

6. **Code examples:**
   - Ensure all README code examples compile and work with current API.
   - Include both standalone and NgModule patterns.
   - Show custom template usage for each directive.

**Conventions:**
- Use Markdown with proper heading hierarchy.
- Code blocks with language tags (`typescript`, `html`, `bash`).
- Tables for structured reference data (inputs, operators, directives).
- Badge links for Angular version, TypeScript version, license.
- Keep terminology consistent: "signal input" (not "signal-based input"), "control flow" (not "block syntax"), "standalone" (not "standalone component" when referring to the pattern).

**Verification:**
- All code examples in README should be valid against current API.
- Commands table matches `package.json` scripts.
- Interface documentation matches `query-builder.interfaces.ts`.
- No broken internal links or references to removed features.
