# ngx-query-builder

A flexible, configurable Angular 19 query builder component for constructing complex nested filter expressions. Supports entity-based field filtering, custom templates for every part of the UI, and full `ReactiveFormsModule` integration via `ControlValueAccessor`.

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@angular/core` | `>=19` |
| `@angular/forms` | `>=19` |
| `@angular/common` | `>=19` |
| `rxjs` | `>=7` |

## Installation

```bash
npm install ngx-query-builder
```

## Usage

See the [root README](../../README.md) for full API documentation, examples, and configuration options.

### Standalone (recommended)

```ts
import { QueryBuilderComponent } from 'ngx-query-builder';
```

### NgModule (backward compatible)

```ts
import { QueryBuilderModule } from 'ngx-query-builder';
```

## Build

```bash
ng build ngx-query-builder
```

Build artifacts are written to `dist/ngx-query-builder/`.

## Testing

```bash
# Run tests via Angular CLI builder
ng test ngx-query-builder

# Run tests with detailed coverage report
npx jest --coverage
```

The test suite uses Jest (via `jest-preset-angular`) and maintains **100% statement, branch, function and line coverage** for the core component.

## Publishing

```bash
ng build ngx-query-builder
cd dist/ngx-query-builder
npm publish
```

## Internal / Private Distribution

To use this library inside your company without publishing to the public npm registry, see the [**Internal / Private Distribution**](../../README.md#internal--private-distribution) section in the root README for full step-by-step instructions covering:

- **npm pack** — build a `.tgz` tarball and install from a file path (zero infrastructure)
- **Git dependency** — commit built `dist/` to a release branch/tag and install via `git+https://`
- **GitHub Packages** — publish to your organisation's private GitHub registry
- **Private registry** — self-hosted Verdaccio, Nexus, or Artifactory
- **npm link** — symlink for local side-by-side development only

## Exports

| Export | Description |
|--------|-------------|
| `QueryBuilderComponent` | Core standalone query builder component |
| `QueryBuilderModule` | NgModule re-exporting the component (backward compat) |
| `QueryInputDirective` | Custom template for value input |
| `QueryOperatorDirective` | Custom template for operator selector |
| `QueryFieldDirective` | Custom template for field selector |
| `QueryEntityDirective` | Custom template for entity selector |
| `QueryButtonGroupDirective` | Custom template for add/remove buttons |
| `QuerySwitchGroupDirective` | Custom template for AND/OR condition switch |
| `QueryRemoveButtonDirective` | Custom template for remove rule button |
| `QueryEmptyWarningDirective` | Custom template for empty ruleset warning |
| `QueryArrowIconDirective` | Custom template for collapse arrow icon |
| Interfaces | `QueryBuilderConfig`, `Rule`, `RuleSet`, `Field`, `Option`, `Entity` |
