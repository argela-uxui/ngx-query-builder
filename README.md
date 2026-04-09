# ngx-query-builder

A modernized Angular query builder component — Angular 21, standalone, signals, OnPush.

Forked from [zebzhao/Angular-QueryBuilder](https://github.com/zebzhao/Angular-QueryBuilder) and fully updated to current Angular best practices.

[![Angular](https://img.shields.io/badge/Angular-19-red)](https://angular.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Features

- ✅ **Standalone component** — no NgModule required (NgModule export provided for backward compat)
- ✅ **Signal inputs** — reactive, type-safe `input()` API
- ✅ **Signal queries** — `viewChild`, `contentChild`, `contentChildren`
- ✅ **OnPush change detection** — optimal performance
- ✅ **`inject()` DI** — constructor-free dependency injection
- ✅ **New template control flow** — `@if`, `@for`, `@switch`, `@let`
- ✅ **ControlValueAccessor** — works with Angular reactive forms and template-driven forms
- ✅ **Fully customizable** — replace any template (fields, operators, inputs, buttons, etc.)
- ✅ **Recursive rule sets** — nested AND/OR grouping
- ✅ **Radio group isolation** — each component instance generates unique IDs for AND/OR radios, safe for nested rulesets
- ✅ **Jest** — fast unit tests

## Installation

```bash
npm install ngx-query-builder
```

> **Peer dependencies:** `@angular/core >=21`, `@angular/forms >=21`, `rxjs >=7`

## Internal / Private Distribution

If you want to use this library inside your company without publishing to the public npm registry, choose one of the approaches below.

---

### Option 1 — npm pack (tarball) · _simplest, no infrastructure required_

Build the library, pack it into a `.tgz` file, and distribute it however you like (file share, Git LFS, email, etc.).

```bash
# In this repository
ng build ngx-query-builder
cd dist/ngx-query-builder
npm pack
# Produces: ngx-query-builder-X.Y.Z.tgz
```

In the consuming project:

```bash
npm install /path/to/ngx-query-builder-X.Y.Z.tgz
```

Or reference it directly in `package.json`:

```json
{
  "dependencies": {
    "ngx-query-builder": "file:./libs/ngx-query-builder-1.0.0.tgz"
  }
}
```

---

### Option 2 — Git dependency · _no infrastructure, version-controlled_

Commit the built `dist/ngx-query-builder/` output to a dedicated release branch or tag in your internal Git repository (GitHub Enterprise, GitLab, Bitbucket, etc.).

```bash
# Build and commit dist/ to a release branch
ng build ngx-query-builder
git checkout -b release/1.0.0
git add -f dist/ngx-query-builder
git commit -m "Release 1.0.0 — built dist"
git tag v1.0.0
git push origin release/1.0.0 --tags
```

In the consuming project:

```bash
# Install from a specific tag
npm install git+https://git.company.com/team/ngx-query-builder.git#v1.0.0

# Or from a branch
npm install git+https://git.company.com/team/ngx-query-builder.git#release/1.0.0
```

> **Note:** The `dist/` directory is gitignored on `develop`/`main`. The release branch deliberately commits it so npm can resolve the package without a build step in the consuming project.

---

### Option 3 — GitHub Packages · _team-scale, stays on GitHub_

GitHub Packages is a private npm registry built into GitHub. Packages can be scoped to your organisation and are accessible to any team member with the right permissions.

**1. Authenticate** — create a Personal Access Token (PAT) with `write:packages` scope, then add it to `~/.npmrc`:

```ini
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

**2. Set the package scope** — update `projects/ngx-query-builder/package.json`:

```json
{
  "name": "@your-org/ngx-query-builder"
}
```

**3. Build and publish:**

```bash
ng build ngx-query-builder
cd dist/ngx-query-builder
npm publish --registry https://npm.pkg.github.com
```

**4. Install in the consuming project** — add to `.npmrc`:

```ini
@your-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Then install as usual:

```bash
npm install @your-org/ngx-query-builder
```

---

### Option 4 — Private npm registry (Verdaccio / Nexus / Artifactory) · _enterprise scale_

Any standard private npm registry works. [Verdaccio](https://verdaccio.org/) is free and easy to self-host.

```bash
# Start Verdaccio locally (or point at your company registry)
npx verdaccio

# Publish (builds first)
ng build ngx-query-builder
cd dist/ngx-query-builder
npm publish --registry http://your-registry.company.com
```

In the consuming project, set the registry in `.npmrc`:

```ini
@your-scope:registry=http://your-registry.company.com
```

---

### Option 5 — npm link · _local development only_

Use `npm link` when you are developing both this library and a consuming app at the same time on the same machine. Changes to the library are reflected immediately without republishing.

```bash
# In this repository — build in watch mode and register the link
npm run build:watch &
cd dist/ngx-query-builder
npm link

# In the consuming project — connect to the linked package
npm link ngx-query-builder
```

To unlink when done:

```bash
# In the consuming project
npm unlink ngx-query-builder

# In this repository
cd dist/ngx-query-builder
npm unlink
```

> **Note:** `npm link` is not suitable for CI or production use. Use one of the options above for shared distribution.

---

## Quick Start

### Standalone (Angular 17+)

```ts
import { QueryBuilderComponent, QueryBuilderConfig } from 'ngx-query-builder';

@Component({
  standalone: true,
  imports: [QueryBuilderComponent, ReactiveFormsModule],
  template: `<query-builder [formControl]="queryCtrl" [config]="config"></query-builder>`
})
export class AppComponent {
  queryCtrl = new FormControl({ condition: 'and', rules: [] });

  config: QueryBuilderConfig = {
    fields: {
      age:      { name: 'Age',      type: 'number' },
      gender:   { name: 'Gender',   type: 'category', options: [
                    { name: 'Male',   value: 'm' },
                    { name: 'Female', value: 'f' },
                  ]},
      birthday: { name: 'Birthday', type: 'date' },
      name:     { name: 'Name',     type: 'string' },
    }
  };
}
```

### NgModule (backward compatible)

```ts
import { QueryBuilderModule } from 'ngx-query-builder';

@NgModule({
  imports: [QueryBuilderModule, ReactiveFormsModule],
})
export class AppModule {}
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `[formControl]` | `FormControl<RuleSet>` | — | Reactive forms binding |
| `[(ngModel)]` | `RuleSet` | — | Template-driven binding |
| `[config]` | `QueryBuilderConfig` | `{ fields: {} }` | Field/operator configuration |
| `[data]` | `RuleSet` | `{ condition:'and', rules:[] }` | Query value (use with CVA or direct binding) |
| `[disabled]` | `boolean` | `false` | Disable the entire query builder |
| `[allowRuleset]` | `boolean` | `true` | Show "Add Ruleset" button |
| `[allowCollapse]` | `boolean` | `false` | Enable collapse/expand of rule sets |
| `[persistValueOnFieldChange]` | `boolean` | `false` | Keep value when field changes to same type |
| `[classNames]` | `QueryBuilderClassNames` | — | CSS class overrides for all elements |
| `[operatorMap]` | `{ [type: string]: string[] }` | — | Override operators per field type |
| `[emptyMessage]` | `string` | `'A ruleset cannot be empty…'` | Message shown for empty rule sets |

## Configuration

### `QueryBuilderConfig`

```ts
interface QueryBuilderConfig {
  fields: {
    [fieldKey: string]: {
      name: string;           // Display label
      type: string;           // 'string' | 'number' | 'date' | 'time' | 'boolean' | 'category' | 'multiselect'
      value?: string;         // Key used in the rule (defaults to fieldKey)
      options?: Option[];     // For category/multiselect
      operators?: string[];   // Override operators for this field
      defaultValue?: any;     // Default value when field is selected
      defaultOperator?: any;  // Default operator when field is selected
      entity?: string;        // Associate field with an entity
      nullable?: boolean;
      validator?: (rule: Rule, parent: RuleSet) => any | null;
    }
  };
  entities?: {
    [entityKey: string]: { name: string; value?: string; defaultField?: any }
  };
  allowEmptyRulesets?: boolean;
  getOperators?: (fieldName: string, field: Field) => string[];
  getInputType?: (field: string, operator: string) => string;
  getOptions?: (field: string) => Option[];
  addRule?: (parent: RuleSet) => void;
  addRuleSet?: (parent: RuleSet) => void;
  removeRule?: (rule: Rule, parent: RuleSet) => void;
  removeRuleSet?: (ruleset: RuleSet, parent: RuleSet) => void;
  coerceValueForOperator?: (operator: string, value: any, rule: Rule) => any;
  calculateFieldChangeValue?: (currentField: Field, nextField: Field, currentValue: any) => any;
}
```

### Default Operator Map

| Type | Default Operators |
|---|---|
| `string` | `=`, `!=`, `contains`, `like` |
| `number` | `=`, `!=`, `>`, `>=`, `<`, `<=` |
| `date` | `=`, `!=`, `>`, `>=`, `<`, `<=` |
| `time` | `=`, `!=`, `>`, `>=`, `<`, `<=` |
| `category` | `=`, `!=`, `in`, `not in` |
| `multiselect` | `in`, `not in` |
| `boolean` | `=` |

## Custom Templates

Replace any part of the UI using structural directives as content children.

### Custom Input

```html
<query-builder [formControl]="queryCtrl" [config]="config">
  <!-- Custom input for fields of type 'textarea' -->
  <ng-container *queryInput="let rule; type: 'textarea'">
    <textarea [(ngModel)]="rule.value"></textarea>
  </ng-container>
</query-builder>
```

### Custom Field Selector

```html
<query-builder [formControl]="queryCtrl" [config]="config">
  <ng-container *queryField="let rule; let fields=fields; let onChange=onChange">
    <mat-select [(ngModel)]="rule.field" (ngModelChange)="onChange($event, rule)">
      <mat-option *ngFor="let f of fields" [value]="f.value">{{f.name}}</mat-option>
    </mat-select>
  </ng-container>
</query-builder>
```

### Custom Button Group

```html
<query-builder [formControl]="queryCtrl" [config]="config">
  <ng-container *queryButtonGroup="let ruleset; let addRule=addRule; let addRuleSet=addRuleSet; let removeRuleSet=removeRuleSet">
    <button (click)="addRule()">+ Rule</button>
    <button *ngIf="addRuleSet" (click)="addRuleSet()">+ Ruleset</button>
    <button *ngIf="removeRuleSet" (click)="removeRuleSet()">- Ruleset</button>
  </ng-container>
</query-builder>
```

### Available Directives

| Directive | Context variables |
|---|---|
| `*queryInput` | `rule`, `field`, `options`, `onChange`, `getDisabledState` |
| `*queryField` | `rule`, `fields`, `onChange`, `getFields`, `getDisabledState` |
| `*queryOperator` | `rule`, `operators`, `onChange`, `getDisabledState` |
| `*queryEntity` | `rule`, `entities`, `onChange`, `getDisabledState` |
| `*queryButtonGroup` | `addRule`, `addRuleSet?`, `removeRuleSet?`, `getDisabledState` |
| `*queryRemoveButton` | `rule`, `removeRule`, `getDisabledState` |
| `*querySwitchGroup` | `onChange`, `getDisabledState` |
| `*queryEmptyWarning` | `message`, `getDisabledState` |
| `*queryArrowIcon` | `getDisabledState` |

## Styling

Apply CSS class overrides via `[classNames]` input:

```ts
classNames: QueryBuilderClassNames = {
  // Bootstrap 4 example
  row:                'row p-2 m-1',
  rule:               'border',
  ruleSet:            'border',
  invalidRuleSet:     'alert alert-danger',
  emptyWarning:       'text-danger mx-auto',
  button:             'btn',
  buttonGroup:        'btn-group',
  rightAlign:         'order-12 ml-auto',
  switchRow:          'd-flex px-2',
  switchGroup:        'd-flex align-items-center',
  switchRadio:        'custom-control-input',
  switchLabel:        'custom-control-label',
  switchControl:      'custom-control custom-radio custom-control-inline',
  fieldControl:       'form-control',
  fieldControlSize:   'col-auto pr-0',
  operatorControl:    'form-control',
  operatorControlSize:'col-auto pr-0',
  inputControl:       'form-control',
  inputControlSize:   'col-auto',
};
```

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests (Jest)
npm test

# Run tests with coverage report
npx jest --coverage

# Build the demo app
npx ng build demo

# Serve the demo app
npx ng serve demo
```

## Migration from `angular2-query-builder`

1. Replace `angular2-query-builder` with `ngx-query-builder` in `package.json`
2. Update imports: `from 'angular2-query-builder'` → `from 'ngx-query-builder'`
3. Keep `QueryBuilderModule` import (or use `QueryBuilderComponent` directly as a standalone component)

## License

MIT © [Argela Inc.](https://argela.com.tr)
